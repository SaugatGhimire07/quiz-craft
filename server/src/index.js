import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import Player from "./models/Player.js";
import Quiz from "./models/Quiz.js"; // Add this import
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import playersRoutes from "./routes/playersRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Your React frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Track connected users and their rooms
const connectedUsers = new Map();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on(
    "joinQuizRoom",
    async ({ pin, playerName, playerId, isHost, userId }) => {
      try {
        socket.join(pin);

        // Validate if the user should be allowed to join
        if (isHost) {
          const quiz = await Quiz.findOne({
            "sessions.pin": pin,
            createdBy: userId,
          });

          if (!quiz) {
            socket.emit("error", { message: "Unauthorized to join as host" });
            return;
          }
        }

        // Generate a consistent avatar seed from the player's name
        const avatarSeed =
          playerName.toLowerCase().replace(/[^a-z0-9]/g, "") + Date.now();

        if (playerId) {
          // Store user data with role information
          connectedUsers.set(socket.id, {
            pin,
            playerId,
            isHost,
            role: isHost ? "host" : "participant",
          });

          // Only update player status if they're not a host
          if (!isHost) {
            await Player.findByIdAndUpdate(playerId, {
              isConnected: true,
              socketId: socket.id,
              avatarSeed: avatarSeed, // Save the seed in the database
            });

            // Only emit participant joined for non-hosts
            io.to(pin).emit("participantJoined", {
              id: playerId,
              name: playerName,
              userId,
              avatarSeed, // Send the same seed to all clients
              role: "participant",
            });
          }

          // Update participant count (excluding host)
          const room = io.sockets.adapter.rooms.get(pin);
          const participantCount = room
            ? Array.from(room).filter((id) => {
                const user = connectedUsers.get(id);
                return user && !user.isHost;
              }).length
            : 0;

          io.to(pin).emit("playerCount", { count: participantCount });
        }
      } catch (error) {
        console.error("Error joining quiz room:", error);
        socket.emit("error", { message: "Failed to join quiz room" });
      }
    }
  );

  socket.on("disconnect", async () => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (userData) {
        const { pin, playerId } = userData;

        // Update player connection status
        await Player.findByIdAndUpdate(playerId, {
          isConnected: false,
          socketId: null,
        });

        // Notify room about player leaving
        io.to(pin).emit("playerLeft", { playerId });

        // Update player count
        const room = io.sockets.adapter.rooms.get(pin);
        const playerCount = room ? room.size - 1 : 0;
        io.to(pin).emit("playerCount", { count: playerCount });

        // Clean up stored data
        connectedUsers.delete(socket.id);
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });

  socket.on("leaveQuizRoom", async ({ pin, playerId }) => {
    try {
      if (playerId) {
        await Player.findByIdAndUpdate(playerId, {
          isConnected: false,
          socketId: null,
        });

        socket.leave(pin);
        connectedUsers.delete(socket.id);

        io.to(pin).emit("playerLeft", { playerId });

        const room = io.sockets.adapter.rooms.get(pin);
        const playerCount = room ? room.size : 0;
        io.to(pin).emit("playerCount", { count: playerCount });
      }
    } catch (error) {
      console.error("Error leaving quiz room:", error);
    }
  });
});

// Configure CORS for REST API
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Existing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Routes
app.use("/api/quiz", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/players", playersRoutes);
app.use("/api", contactRoutes);
app.use("/api/images", imageRoutes);
app.get("/", (req, res) => res.send("API is running..."));

// Modified server startup
const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server is ready`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// Export io instance for use in other files
export { io };
