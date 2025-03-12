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
    const updatedQuiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { status: "draft" },
      { new: true }
    );

    if (!updatedQuiz) {
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized" });
    }

    await Player.deleteMany({ quizId: req.params.id });
    res.json(updatedQuiz);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to end quiz", error: error.message });
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

    // Find quiz
    const quiz = await Quiz.findOne({
      _id: quizId,
      status: "live",
    });

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found or not active",
      });
    }

    // Look for an active session
    let session = await QuizSession.findOne({
      quizId,
      isActive: true,
      startedAt: null,
    });

    // Create new session if none exists
    if (!session) {
      session = new QuizSession({
        quizId,
        hostId: quiz.createdBy, // Add the quiz creator as host
        isActive: true,
      });
      await session.save();
    }

    res.json({
      sessionId: session._id,
      pin: session.pin,
      isActive: session.isActive,
      createdAt: session.createdAt,
      hostId: session.hostId, // Include hostId in response
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
    const quiz = await Quiz.findOne({
      _id: req.params.quizId,
      createdBy: req.user._id,
    });
    if (!quiz)
      return res
        .status(404)
        .json({ message: "Quiz not found or unauthorized" });

    const session = await QuizSession.findOneAndUpdate(
      { quizId: req.params.quizId, isActive: true, startedAt: null },
      { isActive: false, startedAt: new Date() },
      { new: true }
    );

    if (!session)
      return res.status(404).json({ message: "No active session found" });

    res.json({
      sessionId: session._id,
      startedAt: session.startedAt,
      isActive: session.isActive,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to start session", error: error.message });
  }
};

export const joinQuizSession = async (req, res) => {
  try {
    const { pin, playerName, userId } = req.body;

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

    // Create new player
    const player = new Player({
      name: playerName,
      sessionId: session._id,
      quizId: quiz._id,
      userId: userId || null,
      avatarSeed: playerName.toLowerCase().replace(/[^a-z0-9]/g, ""),
      isConnected: true,
      role: "participant",
    });
    await player.save();

    res.status(201).json({
      quizId: quiz._id,
      sessionId: session._id,
      player: {
        id: player._id,
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

    // Create or get active session
    const session = await QuizSession.findOneAndUpdate(
      {
        quizId,
        isActive: true,
      },
      {
        quizId,
        hostId: hostId,
        isActive: true,
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        setDefaultsOnInsert: true,
      }
    );

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
