import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

// Create a custom nanoid generator for game PINs
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6);

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    questions: [
      {
        questionText: String,
        options: [String],
        correctOption: String,
        type: { type: String, default: "multiple-choice" },
        timer: { type: Number, default: 30 },
        // Add these fields to store image data
        image: String, // URL to the image
        imageFilename: String, // Filename for deletion
        imageId: mongoose.Schema.Types.ObjectId,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Add gamePin field
    gamePin: {
      type: String,
      default: () => nanoid(), // Generate a new game PIN using nanoid
      unique: true, // Ensure the game PIN is unique
    },
    // Keep code field as non-unique
    code: {
      type: String,
      unique: false,
      sparse: true, // Only index non-null values
    },
    status: {
      type: String,
      enum: ["draft", "published", "live", "closed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
