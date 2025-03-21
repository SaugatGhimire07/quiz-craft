import Quiz from "../models/Quiz.js";
import QuizSession from "../models/QuizSession.js";
import Player from "../models/Player.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";
import { emitParticipantJoined } from "../utils/socketEvents.js";
import { customAlphabet } from "nanoid";
import { fileURLToPath } from "url";
import PlayerScore from "../models/PlayerScore.js";
import redisClient from "../utils/redisClient.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gfs;
mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.status(201).json({
      fileId: req.file.id,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading file" });
  }
};

export const getImage = async (req, res) => {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const files = await gfs.find({ _id }).toArray();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No file exists" });
    }

    const downloadStream = gfs.openDownloadStream(_id);
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Error getting file" });
  }
};

export const createQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!title || !questions || !questions.length) {
      return res
        .status(400)
        .json({ message: "Title and questions are required" });
    }

    const newQuiz = new Quiz({
      title,
      questions,
      createdBy: req.user._id,
      status: "draft",
    });

    const savedQuiz = await newQuiz.save();

    // Invalidate cache
    await redisClient.del(`user:${req.user._id}:quizzes`);

    res.status(201).json(savedQuiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create quiz", error: error.message });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `user:${userId}:quizzes`;

    // Try to get data from cache first
    const cachedQuizzes = await redisClient.get(cacheKey);

    if (cachedQuizzes) {
      console.log("Returning quizzes from cache");
      return res.json(JSON.parse(cachedQuizzes));
    }

    // If not in cache, fetch from database
    console.log("Fetching quizzes from database");
    const quizzes = await Quiz.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    // Store in cache for 10 minutes (600 seconds)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(quizzes));

    res.json(quizzes);
  } catch (error) {
    console.error("Failed to fetch quizzes:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch quizzes", error: error.message });
  }
};

export const getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch quiz", error: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { title, questions } = req.body;

    // Validate required fields
    if (!title || !questions || !questions.length) {
      return res.status(400).json({
        message: "Title and questions are required",
      });
    }

    // Process questions to preserve image data
    const processedQuestions = questions.map((question) => {
      return {
        questionText: question.questionText,
        options: question.options,
        correctOption: question.correctOption,
        type: question.type || "multiple-choice",
        timer: question.timer || 30,
        // Preserve image data
        image: question.image,
        imageFilename: question.imageFilename,
        imageId: question.imageId,
      };
    });

    // Find and update the quiz
    const updatedQuiz = await Quiz.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id, // Ensure user owns the quiz
      },
      {
        title,
        questions: processedQuestions,
      },
      { new: true } // Return updated document
    );

    if (!updatedQuiz) {
      return res.status(404).json({
        message: "Quiz not found or unauthorized",
      });
    }

    // Invalidate cache
    await redisClient.del(`user:${req.user._id}:quizzes`);

    res.json(updatedQuiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    res.status(500).json({
      message: "Failed to update quiz",
      error: error.message,
    });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const quizId = req.params.id;

    // Find the quiz and make sure it belongs to the user
    const quiz = await Quiz.findOne({
      _id: quizId,
      createdBy: req.user._id,
    });

    if (!quiz) {
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized" });
    }

    // Delete any associated images
    if (quiz.questions) {
      for (const question of quiz.questions) {
        if (question.imageFilename) {
          try {
            // Update image path resolution
            const imagePath = path.join(
              path.dirname(__dirname), // Go up one level from controllers
              "../public/uploads",
              question.imageFilename
            );
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (error) {
            console.error("Error deleting image file:", error);
            // Continue with deletion even if image removal fails
          }
        }
      }
    }

    // Delete the quiz
    await Quiz.findByIdAndDelete(quizId);

    // Invalidate cache
    await redisClient.del(`user:${req.user._id}:quizzes`);

    // Return success response
    res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({
      message: "Failed to delete quiz",
      error: error.message,
    });
  }
};

export const makeQuizLive = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });
    if (!quiz)
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized" });

    if (!quiz.gamePin) quiz.gamePin = nanoid(6);
    quiz.status = "live";
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to make quiz live", error: error.message });
  }
};

export const endQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sessionId, closeSession } = req.body;

    console.log("Ending quiz:", { quizId, sessionId, closeSession });

    // First check if quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Update quiz status
    quiz.status = "draft";
    await quiz.save();

    // If closeSession is true, close the active session
    if (closeSession && sessionId) {
      const session = await QuizSession.findById(sessionId);
      if (session) {
        session.isActive = false;
        session.status = "completed";
        session.endedAt = new Date();
        await session.save();

        // Update all connected players
        await Player.updateMany(
          { sessionId: session._id },
          {
            isConnected: false,
            socketId: null,
          }
        );

        // Optionally archive players if you want to keep history but clean up DB
        // This approach is better than deleting players, as it preserves history
        // However, for your use case, simply setting isConnected: false may be enough

        console.log(`Quiz ${quizId} ended and session ${sessionId} closed`);
      }
    }

    res.json({
      message: "Quiz ended successfully",
      quiz,
    });
  } catch (error) {
    console.error("Error ending quiz:", error);
    res.status(500).json({
      message: "Failed to end quiz",
      error: error.message,
    });
  }
};

export const getQuizByGamePin = async (req, res) => {
  try {
    const { gamePin } = req.params;

    const quiz = await Quiz.findOne({ gamePin });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz by gamePin:", error);
    res.status(500).json({ message: "Error fetching quiz by gamePin", error });
  }
};

export const getOrCreateQuizSession = async (req, res) => {
  try {
    const { quizId } = req.params;
    const isHostRequest = req.path.includes("/host");
    const userId = req.user?._id;

    console.log(
      `Session request for quiz ${quizId}, isHost: ${isHostRequest}, userId: ${userId}`
    );

    // Find quiz - for host requests, verify ownership
    const quizQuery = isHostRequest
      ? { _id: quizId, createdBy: userId }
      : { _id: quizId, status: "live" };

    const quiz = await Quiz.findOne(quizQuery);

    if (!quiz) {
      return res.status(404).json({
        message: isHostRequest
          ? "Quiz not found or not owned by you"
          : "Quiz not found or not active",
      });
    }

    // Look for an active session
    let session = await QuizSession.findOne({
      quizId,
      isActive: true,
    });

    // Create new session if none exists
    if (!session) {
      console.log(
        `No active session found for quiz ${quizId}, creating new session`
      );
      session = new QuizSession({
        quizId,
        hostId: quiz.createdBy, // Add the quiz creator as host
        isActive: true,
      });
      await session.save();
      console.log(
        `Created new session with ID ${session._id} and PIN ${session.pin}`
      );
    } else {
      console.log(
        `Found existing session with ID ${session._id} and PIN ${session.pin}`
      );
    }

    res.json({
      sessionId: session._id,
      pin: session.pin,
      isActive: session.isActive,
      createdAt: session.createdAt,
      hostId: session.hostId,
    });
  } catch (error) {
    console.error("Session error:", error);
    res.status(500).json({
      message: "Failed to get quiz session",
      error: error.message,
    });
  }
};

export const startQuizSession = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { startQuiz, setStartedAt } = req.body;

    console.log(
      `Starting session for quiz ${quizId}, explicitly setting startedAt:`,
      setStartedAt
    );

    // Find the quiz first
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Find the session by quizId, regardless of other conditions
    let session = await QuizSession.findOne({ quizId, isActive: true });

    // If no session exists, create a new one
    if (!session) {
      console.log(`No active session found for quiz ${quizId}, creating one`);
      session = new QuizSession({
        quizId,
        hostId: quiz.createdBy,
        isActive: true,
        status: "active",
        startedAt: new Date(),
      });
      await session.save();
    } else {
      // Update existing session
      console.log(`Found existing session ${session._id}, updating status`);
      session.startedAt = new Date();
      session.status = "active";
      session.isActive = true;
      await session.save();
    }

    // Add verification step
    const verifiedSession = await QuizSession.findById(session._id);

    console.log("Session after update:", {
      id: verifiedSession._id,
      status: verifiedSession.status,
      isActive: verifiedSession.isActive,
      pin: verifiedSession.pin,
    });

    // Ensure we set startedAt explicitly when requested
    if (setStartedAt) {
      session.startedAt = new Date();
      console.log("Explicitly setting startedAt to:", session.startedAt);
    }

    session.status = "active";
    session.isActive = true;
    await session.save();

    // Return the session data with verification info
    res.json({
      sessionId: session._id,
      startedAt: session.startedAt,
      isActive: session.isActive,
      status: session.status,
      pin: session.pin,
      verified:
        verifiedSession.status === "active" &&
        verifiedSession.isActive === true,
    });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({
      message: "Failed to start session",
      error: error.message,
    });
  }
};

export const joinQuizSession = async (req, res) => {
  try {
    const { pin, playerName, userId, anonymousId } = req.body;

    // Validate request body
    if (!pin || !playerName) {
      return res.status(400).json({
        message: "PIN and player name are required",
      });
    }

    // Find session and quiz
    const session = await QuizSession.findOne({ pin });
    if (!session) {
      return res.status(404).json({
        message: "Invalid PIN. Please check and try again.",
      });
    }

    // Find the quiz and check if user is the host
    const quiz = await Quiz.findOne({
      _id: session.quizId,
      status: "live",
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or is no longer active",
      });
    }

    // Check if the user is the quiz creator/host
    if (userId && quiz.createdBy.toString() === userId) {
      return res.status(403).json({
        message: "Quiz host cannot join as a participant",
      });
    }

    // Now use the findOrCreate method to get a player
    const avatarSeed = playerName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // If neither userId nor anonymousId is provided, create a random ID
    const playerAnonymousId = anonymousId || nanoid(12);

    const player = await Player.findOrCreate({
      name: playerName,
      userId: userId || null,
      anonymousId: userId ? null : playerAnonymousId, // Only use anonymousId for non-logged in users
      sessionId: session._id,
      quizId: quiz._id,
      avatarSeed: avatarSeed,
      role: "participant",
    });

    res.status(201).json({
      quizId: quiz._id,
      sessionId: session._id,
      player: {
        id: player._id,
        stableId: player.stableId, // Include this for client-side tracking
        name: player.name,
        avatarSeed: player.avatarSeed,
        role: "participant",
      },
    });
  } catch (error) {
    console.error("Error joining quiz:", error);
    res.status(500).json({
      message: "Failed to join quiz",
      error: error.message,
    });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { hostId } = req.body;

    // Verify that the host is the quiz creator
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (quiz.createdBy.toString() !== hostId) {
      return res.status(403).json({
        message: "Only the quiz creator can make the quiz live",
      });
    }

    // First check if there's already an active session for this quiz
    let session = await QuizSession.findOne({
      quizId,
      isActive: true,
    });

    // If no active session exists, then create a new one
    if (!session) {
      console.log(`Creating new session for quiz ${quizId}`);
      session = await QuizSession.findOneAndUpdate(
        {
          quizId,
          hostId: hostId,
        },
        {
          quizId,
          hostId: hostId,
          isActive: true,
          status: "pending", // Set as pending until host starts the quiz
        },
        {
          new: true,
          upsert: true, // Create if doesn't exist
          setDefaultsOnInsert: true,
        }
      );
    } else {
      console.log(`Reusing existing session ${session._id} for quiz ${quizId}`);
    }

    // Update quiz status
    quiz.status = "live";
    await quiz.save();

    res.json({
      message: "Quiz is now live",
      sessionId: session._id,
      pin: session.pin,
      hostId: hostId,
    });
  } catch (error) {
    console.error("Error publishing quiz:", error);
    res.status(500).json({ message: "Failed to publish quiz" });
  }
};

export const getSessionParticipants = async (req, res) => {
  try {
    const { pin } = req.params;
    console.log(`Fetching participants for session with pin: ${pin}`);

    // Try finding by both status and isActive to cover all cases
    let session = await QuizSession.findOne({
      pin,
      $or: [
        { status: "active" },
        { isActive: true, status: { $ne: "completed" } },
      ],
    });

    if (!session) {
      console.log(
        `No active session found for pin ${pin}, looking for any session`
      );
      session = await QuizSession.findOne({ pin });
    }

    if (!session) {
      console.log(`No session found for pin: ${pin}`);
      return res.status(404).json({
        message: "No session found for this PIN",
      });
    }

    console.log(
      `Found session: ${session._id}, status: ${session.status}, active: ${session.isActive}`
    );

    // Find all players in this session
    const participants = await Player.find({
      sessionId: session._id,
      isHost: { $ne: true }, // Exclude hosts
    })
      .select("_id name avatarSeed userId isHost isConnected")
      .populate("userId", "_id name");

    console.log(`Found ${participants.length} participants`);

    res.json({
      sessionId: session._id,
      participants: participants.map((p) => ({
        _id: p._id,
        name: p.name,
        userId: p.userId?._id || null,
        userName: p.userId?.name || p.name,
        avatarSeed:
          p.avatarSeed || p.name?.toLowerCase().replace(/[^a-z0-9]/g, ""),
        isConnected: p.isConnected || true,
        role: "participant",
      })),
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({
      message: "Error fetching participants",
      error: error.message,
    });
  }
};

// Add this function to your quizController.js
export const getQuizStatus = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Find active session
    const session = await QuizSession.findOne({
      quizId,
      $or: [
        { status: "active" },
        { isActive: true, status: { $ne: "completed" } },
      ],
    });

    // The key - check for startedAt as the definitive way to know if host started the quiz
    const quizStarted = session?.startedAt != null;

    res.json({
      isLive: quiz.status === "live",
      quizStatus: quiz.status,
      sessionActive: session?.isActive || false,
      sessionId: session?._id || null,
      quizStarted: quizStarted,
      startedAt: session?.startedAt || null,
    });
  } catch (error) {
    console.error("Error checking quiz status:", error);
    res.status(500).json({ message: "Error checking quiz status" });
  }
};

export const getQuizForParticipant = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Find the quiz but only return necessary data for participants
    const quiz = await Quiz.findOne({
      _id: quizId,
      status: "live", // Only allow access to live quizzes
    }).select("title questions");

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found or not active" });
    }

    // Make sure there's an active session
    const session = await QuizSession.findOne({
      quizId,
      isActive: true,
    });

    if (!session) {
      return res.status(403).json({
        message: "No active session for this quiz",
      });
    }

    // Create a safe version of the questions (without correct answers)
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options,
      timer: q.timer || 30,
      type: q.type || "multiple-choice",
      image: q.image,
      correctOption: q.correctOption, // Keep for now but could remove for stricter security
    }));

    res.json({
      title: quiz.title,
      questions: safeQuestions,
    });
  } catch (error) {
    console.error("Error fetching participant quiz data:", error);
    res.status(500).json({
      message: "Failed to fetch quiz data",
      error: error.message,
    });
  }
};

// Add this controller function to quizController.js or create a new resultsController.js

export const getQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sessionId } = req.query;

    console.log(`Getting results for quiz ${quizId}, session ${sessionId}`);

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // Find the session with exact match on sessionId
    const session = await QuizSession.findById(sessionId);

    if (!session) {
      console.log(`Session not found with ID: ${sessionId}`);
      return res.status(404).json({ message: "Session not found" });
    }

    console.log(`Found session: ${session._id}`);

    // Get ONLY player scores for THIS SESSION specifically
    const playerScores = await PlayerScore.find({
      sessionId: session._id,
    }).populate("playerId", "name");

    // Log unique player IDs to identify duplicates
    const uniquePlayerIds = [
      ...new Set(playerScores.map((score) => score.playerId)),
    ];
    console.log(
      `Found ${playerScores.length} scores from ${uniquePlayerIds.length} unique players`
    );

    // Format scores, ensuring uniqueness by player ID
    const playerMap = new Map(); // Use map to ensure one entry per player

    // Process all scores, keeping only the highest score per player
    for (const score of playerScores) {
      const playerId =
        score.playerId?._id?.toString() || score.playerId?.toString();
      const correctAnswers = score.answers.filter((a) => a.isCorrect).length;
      const totalScore = score.totalScore || 0;

      // Only add or replace if this score is higher than existing entry
      if (
        !playerMap.has(playerId) ||
        playerMap.get(playerId).score < totalScore
      ) {
        playerMap.set(playerId, {
          playerId,
          playerName: score.playerId?.name || "Anonymous",
          score: totalScore,
          correctAnswers,
          totalQuestions: session.quiz?.questions?.length || 3,
        });
      }
    }

    // Convert map to array and sort by score
    const results = Array.from(playerMap.values()).sort(
      (a, b) => b.score - a.score
    );

    console.log("Sending results:", results);
    res.json(results);
  } catch (error) {
    console.error("Error fetching quiz results:", error);
    res.status(500).json({ message: "Error fetching quiz results" });
  }
};

// Add this new controller function:

export const getSessionStatus = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    // Find the exact session by ID
    const session = await QuizSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get ACTUAL players in THIS session
    const players = await Player.find({
      sessionId: session._id,
      isHost: { $ne: true }, // Exclude hosts
      role: { $ne: "host" },
    });

    const uniquePlayerIds = [...new Set(players.map((p) => p._id.toString()))];
    const totalPlayers = uniquePlayerIds.length;

    // Count ONLY completed scores for THIS session
    const completedScores = await PlayerScore.find({
      sessionId: session._id,
      completed: true,
    });

    // Count unique completed players
    const uniqueCompletedPlayerIds = [
      ...new Set(completedScores.map((s) => s.playerId.toString())),
    ];
    const completedCount = uniqueCompletedPlayerIds.length;

    console.log(
      `Session status: ${completedCount} of ${totalPlayers} players completed`
    );

    // FIXED: now completedCount will never be more than totalPlayers
    const isComplete = totalPlayers > 0 && completedCount >= totalPlayers;

    res.json({
      quizId,
      sessionId: session._id,
      totalPlayers,
      completedCount: Math.min(completedCount, totalPlayers), // Prevent count exceeding total
      allCompleted: isComplete || session.allCompleted,
      pin: session.pin,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    res.status(500).json({ message: "Error checking session status" });
  }
};

export const getUserQuizHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // First get all players associated with this user
    const players = await Player.find({ userId: userId });
    const playerIds = players.map((player) => player._id);

    console.log(`Found ${players.length} player records for user ${userId}`);

    // Then find all player scores using these IDs
    const playerScores = await PlayerScore.find({
      $or: [
        { userId: userId }, // Direct association with user ID
        { playerId: { $in: playerIds } }, // Or via player ID
      ],
    })
      .populate({
        path: "quizId",
        select: "title createdBy",
      })
      .populate({
        path: "sessionId",
        select: "startedAt endedAt",
      })
      .sort({ createdAt: -1 });

    console.log(
      `Found ${playerScores.length} score records across all player IDs`
    );

    const quizHistory = playerScores.map((score) => {
      // Calculate percentage
      const correctCount =
        score.answers?.filter((a) => a.isCorrect).length || 0;
      const totalQuestions = score.answers?.length || 0;
      const percentage =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      // Determine quiz type based on session data
      const quizType = score.sessionId?.type || "live";

      // Format time for display
      const formattedTime = score.timeTaken || null;

      return {
        quizId: score.quizId?._id,
        quizTitle: score.quizId?.title || "Unknown Quiz",
        sessionId: score.sessionId?._id,
        participatedAt: score.sessionId?.startedAt || score.createdAt,
        score: score.totalScore,
        correctAnswers: correctCount,
        totalQuestions,
        percentage,
        timeTaken: formattedTime, // Include the time taken
        rank: score.rank || null, // Include the rank
        completed: score.completed,
        quizType: quizType,
        playerName:
          players.find((p) => p._id.equals(score.playerId))?.name ||
          "Unknown Player",
      };
    });

    res.json(quizHistory);
  } catch (error) {
    console.error("Error fetching user quiz history:", error);
    res.status(500).json({ message: "Failed to fetch quiz history" });
  }
};

export const getUserQuizResults = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { sessionId } = req.query;
    const userId = req.user._id;

    console.log(
      `Getting user results for quiz ${quizId}, session ${sessionId}, user ${userId}`
    );

    // Find the player score for this user, quiz and session
    const playerScore = await PlayerScore.findOne({
      $or: [
        { userId, quizId, sessionId },
        {
          playerId: { $in: await getPlayerIdsByUser(userId) },
          quizId,
          sessionId,
        },
      ],
    })
      .populate({
        path: "quizId",
        select: "title questions",
      })
      .populate({
        path: "sessionId",
        select: "startedAt endedAt type",
      });

    if (!playerScore) {
      console.log(
        `No results found for quiz ${quizId}, session ${sessionId}, user ${userId}`
      );
      return res.status(404).json({ message: "Quiz results not found" });
    }

    // Get the quiz to access question details
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Format the answers with question details
    const questionResults = playerScore.answers.map((answer) => {
      const question = quiz.questions.find(
        (q) => q._id.toString() === answer.questionId.toString()
      );

      return {
        questionId: answer.questionId,
        questionText:
          answer.questionText ||
          question?.questionText ||
          "Question not available",
        options: answer.options || question?.options || [],
        correctAnswer: answer.correctOption || question?.correctOption || "",
        userAnswer: answer.answer,
        isCorrect: answer.isCorrect,
        image: question?.image || null,
        timeTaken: answer.timeTaken,
        score: answer.score,
      };
    });

    // Calculate stats
    const correctAnswers = questionResults.filter((q) => q.isCorrect).length;
    const totalQuestions = questionResults.length;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // Get total time taken
    const totalTimeTaken =
      playerScore.timeTaken ||
      playerScore.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);

    // Find the rank among participants
    const allScores = await PlayerScore.find({
      sessionId,
      completed: true,
    }).sort({ totalScore: -1 });

    let rank = 0;
    for (let i = 0; i < allScores.length; i++) {
      if (allScores[i]._id.toString() === playerScore._id.toString()) {
        rank = i + 1;
        break;
      }
    }

    res.json({
      quizId,
      quizTitle: quiz.title,
      sessionId,
      participatedAt: playerScore.sessionId?.startedAt || playerScore.createdAt,
      score: playerScore.totalScore,
      correctAnswers,
      totalQuestions,
      percentage,
      timeTaken: totalTimeTaken,
      rank: rank || playerScore.rank || null,
      questions: questionResults,
      sessionType: playerScore.sessionId?.type || "live",
      totalParticipants: allScores.length,
    });
  } catch (error) {
    console.error("Error fetching user quiz results:", error);
    res.status(500).json({ message: "Failed to fetch quiz results" });
  }
};

// Helper function to get all player IDs associated with a user
const getPlayerIdsByUser = async (userId) => {
  const players = await Player.find({ userId });
  return players.map((player) => player._id);
};
