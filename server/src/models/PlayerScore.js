import mongoose from "mongoose";

const playerScoreSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        answer: String,
        isCorrect: Boolean,
        timeTaken: Number,
        score: Number,
        questionText: String,
        correctOption: String,
        options: [String],
      },
    ],
    totalScore: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    rank: Number,
    timeTaken: Number, // Total time taken to complete the quiz
  },
  { timestamps: true }
);

playerScoreSchema.pre("save", function (next) {
  console.log("Saving PlayerScore:", this);
  next();
});

const PlayerScore = mongoose.model("PlayerScore", playerScoreSchema);

export default PlayerScore;
