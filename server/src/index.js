import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import Player from "./models/Player.js";
import Quiz from "./models/Quiz.js";
import QuizSession from "./models/QuizSession.js";
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
const quizSessions = new Map();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Socket.io event handler for starting a quiz
  socket.on("startQuiz", async ({ pin, quizId, sessionId }) => {
    console.log(
      `Quiz started by host for room ${pin}, quiz ID: ${quizId}, session ID: ${sessionId}`
    );

    try {
      // First try finding by sessionId (more reliable)
      let session;
      if (sessionId) {
        session = await QuizSession.findByIdAndUpdate(
          sessionId,
          {
            startedAt: new Date(),
            status: "active",
            isActive: true, // Make sure both fields are updated
          },
          { new: true }
        );

        if (session) {
          console.log(`Found and updated session by ID: ${sessionId}`);
        }
      }

      // If session wasn't found by ID, try finding by pin
      if (!session) {
        session = await QuizSession.findOneAndUpdate(
          { pin, isActive: true },
          {
            startedAt: new Date(),
            status: "active",
            isActive: true, // Make sure both fields are updated
          },
          { new: true }
        );

        if (session) {
          console.log(`Found and updated session by PIN: ${pin}`);
        }
      }

      // If still no session, create a new one
      if (!session) {
        console.log(
          `No session found for pin ${pin}, trying to create a new one`
        );

        // Get the quiz to ensure it exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          console.error(`Quiz not found with ID ${quizId}`);
          return;
        }

        session = new QuizSession({
          quizId,
          pin,
          hostId: quiz.createdBy,
          isActive: true,
          status: "active",
          startedAt: new Date(),
        });

        await session.save();
        console.log(
          `Created new session with ID ${session._id} and PIN ${pin}`
        );
      }

      // Log the room size for debugging
      const room = io.sockets.adapter.rooms.get(pin);
      const roomSize = room ? room.size : 0;
      console.log(`Room ${pin} has ${roomSize} connected clients`);

      if (room) {
        console.log("Room participants:", Array.from(room));
      }

      // Broadcast to EVERYONE in the room, including sender
      console.log(`Broadcasting quizStarted event to room ${pin}`);
      io.to(pin).emit("quizStarted", {
        pin,
        quizId,
        timestamp: new Date(),
        sessionId: session._id,
      });

      // Add a direct message to each socket in the room for guaranteed delivery
      if (room) {
        for (const clientId of room) {
          console.log(`Sending direct quizStarted to client ${clientId}`);
          io.to(clientId).emit("quizStarted", {
            pin,
            quizId,
            timestamp: new Date(),
            sessionId: session._id,
            directMessage: true,
          });
        }
      }

      // Also send a direct message to each participant in that room
      const clientsInRoom = io.sockets.adapter.rooms.get(pin);
      if (clientsInRoom) {
        clientsInRoom.forEach((clientId) => {
          if (clientId !== socket.id) {
            // Don't send to host
            io.to(clientId).emit("quizStarted", {
              pin,
              quizId,
              timestamp: new Date(),
              sessionId: session._id,
            });
          }
        });
      }

      console.log(`Broadcasted quizStarted event to room ${pin}`);
    } catch (error) {
      console.error("Error handling startQuiz event:", error);
    }
  });

  socket.on(
    "joinQuizRoom",
    async ({ pin, playerName, playerId, isHost, userId }) => {
      if (!pin) return;

      console.log(
        `${isHost ? "Host" : "Player"} ${playerName} joining room ${pin}`
      );

      // Join the socket room
      socket.join(pin);

      // Generate a deterministic avatar seed based on player details
      const avatarSeed = `${playerName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")}${Date.now()}`;

      // Update player connection status in database for participants
      if (!isHost && playerId) {
        try {
          const player = await Player.findByIdAndUpdate(
            playerId,
            {
              isConnected: true,
              socketId: socket.id,
              avatarSeed: avatarSeed,
            },
            { new: true }
          );

          if (player) {
            console.log(`Updated player ${playerId} connection status to true`);

            // Broadcast to everyone in the room that a participant joined
            io.to(pin).emit("participantJoined", {
              id: playerId,
              name: playerName,
              userId,
              avatarSeed,
              role: "participant",
            });
          }
        } catch (error) {
          console.error(`Error updating player ${playerId}:`, error);
        }
      } else if (isHost) {
        // For hosts, we'll just notify that they joined but not store in player DB
        // If we do need to track hosts in the DB, add that code here
        socket.emit("hostJoined", {
          success: true,
          pin,
        });
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

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Handle participant disconnection if necessary
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
