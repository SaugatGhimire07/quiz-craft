import Quiz from "../models/Quiz.js";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

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

    const newQuiz = new Quiz({
      title,
      questions: questions.map((q) => ({
        ...q,
        image: undefined,
        imageId: q.imageId,
      })),
      createdBy: req.user._id, // This comes from protect middleware
      status: "draft", // Set initial status as draft
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

    // Find and update the quiz
    const updatedQuiz = await Quiz.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id, // Ensure user owns the quiz
      },
      {
        title,
        questions,
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
