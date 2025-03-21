import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Not required - anonymous players are allowed
    },
    // A unique identifier for anonymous players (e.g., browser fingerprint)
    anonymousId: {
      type: String,
    },
    // Store a stable identifier that persists across sessions
    stableId: {
      type: String,
      // This will be either userId or anonymousId, set via pre-save hook
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuizSession",
      required: true,
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    isHost: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["host", "participant"],
      default: "participant",
    },
    avatarSeed: String,
    isConnected: {
      type: Boolean,
      default: true,
    },
    socketId: String,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to set the stableId
playerSchema.pre("save", function (next) {
  // Use userId if available, otherwise use anonymousId
  if (!this.stableId) {
    this.stableId = this.userId ? this.userId.toString() : this.anonymousId;
  }
  next();
});

// Add a method to find or create player
playerSchema.statics.findOrCreate = async function (playerData) {
  // Determine which stable ID to use
  const stableId = playerData.userId || playerData.anonymousId;

  if (!stableId) {
    throw new Error("Either userId or anonymousId must be provided");
  }

  // Try to find an existing player for this session
  let player = await this.findOne({
    stableId,
    quizId: playerData.quizId,
    sessionId: playerData.sessionId,
  });

  // If player exists, update their connection status
  if (player) {
    player.isConnected = true;
    player.socketId = playerData.socketId;
    player.lastActive = Date.now();
    await player.save();
    return player;
  }

  // Otherwise create a new player
  player = new this({
    name: playerData.name,
    userId: playerData.userId,
    anonymousId: playerData.anonymousId,
    quizId: playerData.quizId,
    sessionId: playerData.sessionId,
    avatarSeed: playerData.avatarSeed,
    isHost: playerData.isHost || false,
    role: playerData.role || "participant",
    socketId: playerData.socketId,
    isConnected: true,
  });

  await player.save();
  return player;
};

const Player = mongoose.model("Player", playerSchema);

export default Player;
