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
import PlayerScore from "../models/PlayerScore.js"; // Make sure to import this

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
  const { title, questions } = req.body;

  try {
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
    res.status(201).json(savedQuiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create quiz", error: error.message });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(quizzes);
  } catch (error) {
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

    // Find the session
    const session = await QuizSession.findOne({
      $or: [{ _id: sessionId }, { quizId, isActive: true }],
    });

    if (!session) {
      console.log(
        `No session found for quiz ${quizId} with sessionId ${sessionId}`
      );
      return res.status(404).json({ message: "Quiz session not found" });
    }

    console.log(`Found session: ${session._id}`);

    // Get all player scores for this session
    const playerScores = await PlayerScore.find({
      quizId,
      sessionId: session._id,
    }).populate("playerId", "name");

    console.log(`Found ${playerScores.length} player scores`);

    // Debug information for each player score
    playerScores.forEach((score) => {
      console.log(
        `Player ${score.playerId?.name || "Unknown"}: Score ${
          score.totalScore
        }, Completed: ${score.completed}, Answers: ${score.answers.length}`
      );
      score.answers.forEach((ans, idx) => {
        console.log(
          `  Answer ${idx + 1}: Correct: ${ans.isCorrect}, Points: ${
            ans.score || 0
          }`
        );
      });
    });

    // If no scores yet, try to get total questions count for the quiz
    const quiz = await Quiz.findById(quizId);
    const totalQuestions = quiz?.questions?.length || 0;

    // Get all players for this session
    const players = await Player.find({
      sessionId: session._id,
      isHost: { $ne: true }, // Exclude the host
    });

    console.log(`Found ${players.length} players in this session`);

    // Format scores for the leaderboard
    const results = [];

    // Add players with scores
    for (const score of playerScores) {
      // Count correct answers
      const correctAnswers = score.answers.filter(
        (answer) => answer.isCorrect
      ).length;

      // Recalculate total score if it's showing as 0 but there are correct answers
      let finalScore = score.totalScore || 0;
      if (finalScore === 0 && correctAnswers > 0) {
        finalScore = score.answers.reduce(
          (sum, a) => sum + (a.isCorrect ? a.score || 0 : 0),
          0
        );
        console.log(
          `Recalculated score for ${score.playerId?.name}: ${finalScore}`
        );
      }

      results.push({
        playerId: score.playerId?._id || score.playerId,
        playerName: score.playerId?.name || "Anonymous",
        score: finalScore,
        correctAnswers,
        totalQuestions,
      });
    }

    // Add players without scores (who might not have answered any questions)
    for (const player of players) {
      // Check if player is already in results
      const alreadyInResults = results.some(
        (result) =>
          result.playerId &&
          result.playerId.toString() === player._id.toString()
      );

      if (!alreadyInResults) {
        results.push({
          playerId: player._id,
          playerName: player.name || "Anonymous",
          score: 0,
          correctAnswers: 0,
          totalQuestions,
        });
      }
    }

    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);

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

    console.log(
      `Checking session status for quiz ${quizId}, session ${sessionId}`
    );

    // Find the session
    const session = await QuizSession.findOne({
      $or: [{ _id: sessionId }, { quizId, isActive: true }],
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get player count from Player collection - EXCLUDING HOSTS
    const totalPlayers = await Player.countDocuments({
      sessionId: session._id,
      isHost: { $ne: true }, // Exclude hosts
      role: { $ne: "host" }, // Also check role field
    });

    // Get completed count from PlayerScore collection
    const completedCount = await PlayerScore.countDocuments({
      sessionId: session._id,
      completed: true,
    });

    console.log(
      `Session status: ${completedCount} of ${totalPlayers} players completed`
    );

    // STRICT EQUALITY CHECK - only complete when ALL players have finished
    const isComplete = totalPlayers > 0 && completedCount === totalPlayers;

    // If all players have completed, update the session
    if (isComplete && !session.allCompleted) {
      await QuizSession.findByIdAndUpdate(session._id, {
        $set: { allCompleted: true },
      });
      console.log(
        `All ${totalPlayers} players have completed. Marking session as complete.`
      );
    }

    res.json({
      quizId,
      sessionId: session._id,
      totalPlayers,
      completedCount,
      allCompleted: isComplete || session.allCompleted,
      pin: session.pin,
    });
  } catch (error) {
    console.error("Error checking session status:", error);
    res.status(500).json({ message: "Error checking session status" });
  }
};
