import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import Player from "./models/Player.js"; // Add this import
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

  socket.on("joinQuizRoom", async ({ pin, playerName, playerId }) => {
    try {
      socket.join(pin);

      if (playerId) {
        await Player.findByIdAndUpdate(playerId, {
          isConnected: true,
          socketId: socket.id,
        });

        // Emit to all clients in the room including sender
        io.to(pin).emit("participantJoined", {
          id: playerId,
          name: playerName,
        });
      }

      // Get current room size
      const room = io.sockets.adapter.rooms.get(pin);
      const playerCount = room ? room.size : 0;
      io.to(pin).emit("playerCount", { count: playerCount });
    } catch (error) {
      console.error("Error joining quiz room:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      // Find and update player's connection status
      const player = await Player.findOne({ socketId: socket.id });
      if (player) {
        await Player.findByIdAndUpdate(player._id, {
          isConnected: false,
        });
      }
    } catch (error) {
      console.error("Error handling disconnect:", error);
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
