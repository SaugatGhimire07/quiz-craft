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
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
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

// Pre-save hook to ensure consistency between isActive and status fields
quizSessionSchema.pre("save", function (next) {
  if (this.status === "active") {
    this.isActive = true;
  }
  next();
});

const QuizSession = mongoose.model("QuizSession", quizSessionSchema);

export default QuizSession;
