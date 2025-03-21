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
      required: true, // Now required since all participants must be logged in
    },
    // Store userId as stable identifier for consistency
    stableId: {
      type: String,
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
  // Always use userId as the stableId
  if (!this.stableId && this.userId) {
    this.stableId = this.userId.toString();
  }
  next();
});

// Updated findOrCreate method that requires userId
playerSchema.statics.findOrCreate = async function (playerData) {
  // Ensure userId is provided
  if (!playerData.userId) {
    throw new Error("userId is required - all participants must be logged in");
  }

  console.log("findOrCreate called with data:", {
    name: playerData.name,
    userId: playerData.userId,
    sessionId: playerData.sessionId,
  });

  // Set stableId to userId
  const stableId = playerData.userId.toString();
  console.log(`Using userId ${stableId} as stableId for player`);

  // Find player by userId
  let player = await this.findOne({
    userId: playerData.userId,
    quizId: playerData.quizId,
    sessionId: playerData.sessionId,
  });

  if (player) {
    console.log(`Found existing player by userId: ${player._id}`);
    // Update connection status
    player.isConnected = true;
    player.socketId = playerData.socketId;
    player.lastActive = Date.now();
    await player.save();
    return player;
  }

  // Create new player
  const newPlayerData = {
    name: playerData.name,
    userId: playerData.userId,
    quizId: playerData.quizId,
    sessionId: playerData.sessionId,
    avatarSeed: playerData.avatarSeed,
    isHost: playerData.isHost || false,
    role: playerData.role || "participant",
    socketId: playerData.socketId,
    isConnected: true,
    stableId: stableId,
  };

  console.log("Creating new player with:", {
    name: newPlayerData.name,
    userId: newPlayerData.userId,
    stableId: newPlayerData.stableId,
  });

  player = new this(newPlayerData);
  await player.save();
  return player;
};

const Player = mongoose.model("Player", playerSchema);

export default Player;
