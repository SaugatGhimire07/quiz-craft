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
import PlayerScore from "./models/PlayerScore.js";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Make sure this matches your client URL
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
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
        // Update player status in database
        await Player.findByIdAndUpdate(playerId, {
          isConnected: false,
          socketId: null,
        });

        // Leave the socket room
        socket.leave(pin);

        // Remove from connected users map
        connectedUsers.delete(socket.id);

        // Broadcast to all other clients in the room that this player left
        io.to(pin).emit("playerLeft", { playerId });

        // Log the event
        console.log(`Player ${playerId} left room ${pin}`);
      }
    } catch (error) {
      console.error("Error handling leaveQuizRoom:", error);
    }
  });

  // Find the socket.on("submitAnswer") handler and update it:
  socket.on(
    "submitAnswer",
    async ({
      quizId,
      questionId,
      playerId,
      answer,
      isCorrect,
      timeTaken,
      score,
    }) => {
      try {
        console.log(
          `Player ${playerId} submitted answer for ${questionId}: ${answer}, correct: ${isCorrect}, score: ${score}`
        );

        // Find the active session
        const session = await QuizSession.findOne({ quizId, isActive: true });

        if (!session) {
          console.error(`No active session found for quiz ${quizId}`);
          return;
        }

        // Find or create player score record
        let playerScore = await PlayerScore.findOne({
          quizId,
          playerId,
          sessionId: session._id,
        });

        if (!playerScore) {
          playerScore = new PlayerScore({
            quizId,
            playerId,
            sessionId: session._id,
            answers: [],
            totalScore: 0,
          });
        }

        // Add this answer to the player's answers array
        playerScore.answers.push({
          questionId,
          answer,
          isCorrect,
          timeTaken,
          score: isCorrect ? score || 0 : 0,
        });

        // Update total score
        if (isCorrect && score) {
          playerScore.totalScore += score;
          console.log(
            `Added ${score} points to player ${playerId}. New total: ${playerScore.totalScore}`
          );
        }

        // Save the updated player score
        await playerScore.save();

        // Send acknowledgment back to the client
        socket.emit("answerReceived", {
          questionId,
          isCorrect,
          score: isCorrect ? score : 0,
        });
      } catch (error) {
        console.error("Error handling answer submission:", error);
        // Send error message to client
        socket.emit("answerError", { message: "Failed to save answer" });
      }
    }
  );

  // Add this new socket event handler
  socket.on(
    "quizComplete",
    async ({ quizId, sessionId, playerId, totalScore }) => {
      try {
        console.log(
          `Player ${playerId} completed quiz ${quizId} with score ${totalScore}`
        );

        // Find the session
        const session = await QuizSession.findOne({
          $or: [{ _id: sessionId }, { quizId, isActive: true }],
        });

        if (!session) {
          console.error(`No active session found for quiz ${quizId}`);
          return;
        }

        // Update or create player score with completed flag
        const playerScore = await PlayerScore.findOneAndUpdate(
          {
            playerId,
            quizId,
            sessionId: session._id,
          },
          {
            $set: {
              completed: true,
              totalScore: totalScore || 0,
            },
          },
          { upsert: true, new: true }
        );

        console.log(`Marked player ${playerId} as completed`);

        // Get count of completed players vs total players
        const totalPlayers = session.players.length;
        const completedCount = await PlayerScore.countDocuments({
          sessionId: session._id,
          completed: true,
        });

        console.log(
          `${completedCount} out of ${totalPlayers} players have completed the quiz`
        );

        // If all players have completed, emit the showResults event
        if (completedCount >= totalPlayers) {
          console.log(
            `All players (${completedCount}/${totalPlayers}) have completed the quiz! Showing results to everyone`
          );

          // Broadcast to the room
          io.to(session.pin).emit("showResults", {
            quizId,
            sessionId: session._id,
            allParticipantsFinished: true,
          });

          // Also emit a specific event for when all are finished
          io.to(session.pin).emit("allParticipantsFinished", {
            quizId,
            sessionId: session._id,
          });

          // Update session status
          await QuizSession.findByIdAndUpdate(session._id, {
            $set: { allCompleted: true },
          });
        }
      } catch (error) {
        console.error("Error handling quiz completion:", error);
      }
    }
  );

  // Find the socket.on("quizComplete") handler and update it:

  socket.on(
    "quizComplete",
    async ({ quizId, sessionId, playerId, totalScore }) => {
      try {
        console.log(
          `Player ${playerId} completed quiz ${quizId} with final score ${totalScore}`
        );

        // Find the session
        const session = await QuizSession.findOne({
          $or: [{ _id: sessionId }, { quizId, isActive: true }],
        });

        if (!session) {
          console.error(`No session found for quiz ${quizId}`);
          return;
        }

        console.log(`Found session: ${session._id}`);

        // Find and update player score record
        const playerScore = await PlayerScore.findOneAndUpdate(
          {
            quizId,
            playerId,
            sessionId: session._id,
          },
          {
            $set: {
              completed: true,
              totalScore: totalScore || 0, // Use submitted total score
            },
          },
          { new: true, upsert: true }
        );

        console.log(
          `Updated PlayerScore with completed status. Final score: ${playerScore.totalScore}, Answers: ${playerScore.answers.length}`
        );

        // Immediately verify the player score is saved correctly
        const verifyScore = await PlayerScore.findOne({
          quizId,
          playerId,
          sessionId: session._id,
        });

        console.log(
          `Verification - PlayerScore found: ${!!verifyScore}, Score: ${
            verifyScore?.totalScore
          }, Completed: ${verifyScore?.completed}`
        );
      } catch (error) {
        console.error("Error handling quiz completion:", error);
      }
    }
  );
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
