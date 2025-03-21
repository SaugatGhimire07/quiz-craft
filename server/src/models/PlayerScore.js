import mongoose from "mongoose";

const playerScoreSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
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
    totalScore: {
      type: Number,
      default: 0,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        answer: String,
        isCorrect: Boolean,
        timeTaken: Number,
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

const PlayerScore = mongoose.model("PlayerScore", playerScoreSchema);

export default PlayerScore;
