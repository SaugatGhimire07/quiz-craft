import Quiz from "../models/Quiz.js";
import { nanoid } from "nanoid";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

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
    // Validate required fields
    if (!title || !questions || !questions.length) {
      return res.status(400).json({
        message: "Title and questions are required",
      });
    }

    // Process questions to preserve image data
    const processedQuestions = questions.map((question) => {
      // Keep image URL and filename if they exist
      return {
        questionText: question.questionText,
        options: question.options,
        correctOption: question.correctOption,
        image: question.image,
        imageId: question.imageId,
      };
    });

    const newQuiz = new Quiz({
      title,
      questions: processedQuestions,
      createdBy: req.user._id, // This comes from protect middleware
      status: "draft", // Set initial status as draft
      // Not setting any code field here
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    console.error("Quiz creation error:", error);
    res.status(500).json({
      message: "Failed to create quiz",
      error: error.message,
    });
  }
};

export const getUserQuizzes = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const quizzes = await Quiz.find({ createdBy: req.user._id }).sort({
      createdAt: -1,
    });

    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching user quizzes:", error);
    res.status(500).json({
      message: "Failed to fetch quizzes",
      error: error.message,
    });
  }
};

export const getQuiz = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({
      message: "Failed to fetch quiz",
      error: error.message,
    });
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
            // Delete image file from server
            const imagePath = path.join(
              __dirname,
              "../../public/uploads",
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
