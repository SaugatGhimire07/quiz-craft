import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

// Create a custom nanoid generator for 6-digit numeric PINs
const generatePin = customAlphabet("0123456789", 6);

const quizSessionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    pin: {
      type: String,
      default: () => generatePin(),
      unique: true, // This already creates an index
      validate: {
        validator: function (v) {
          return /^\d{6}$/.test(v);
        },
        message: "PIN must be a 6-digit number",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    startedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Remove this line since 'unique: true' already creates an index
// quizSessionSchema.index({ pin: 1 });

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);

export default QuizSession;
