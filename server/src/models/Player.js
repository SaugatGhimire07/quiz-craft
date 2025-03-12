import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
    },
    isHost: {
      type: Boolean,
      default: false,
    },
    avatarSeed: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);

export default Player;
