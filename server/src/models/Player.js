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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isConnected: {
      type: Boolean,
      default: true,
    },
    socketId: {
      type: String,
      default: null,
    },
    avatarSeed: {
      type: String,
      default: function () {
        return this.name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
      },
    },
    role: {
      type: String,
      enum: ["host", "participant"],
      default: "participant",
    },
  },
  { timestamps: true }
);

// Add a pre-save hook for debugging
playerSchema.pre("save", function (next) {
  console.log(
    `Saving player: ${this.name}, isConnected: ${this.isConnected}, sessionId: ${this.sessionId}`
  );
  next();
});

playerSchema.pre("findOneAndUpdate", function (next) {
  console.log("Updating player:", this.getUpdate());
  next();
});

const Player = mongoose.model("Player", playerSchema);

export default Player;
