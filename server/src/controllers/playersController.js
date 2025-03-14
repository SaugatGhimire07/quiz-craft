import Player from "../models/Player.js";
import Quiz from "../models/Quiz.js";
import QuizSession from "../models/QuizSession.js";

export const addPlayer = async (req, res) => {
  const { gamePin, playerName } = req.body;

  try {
    const quiz = await Quiz.findOne({ gamePin });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const player = new Player({
      name: playerName,
      quizId: quiz._id,
    });

    await player.save();

    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ message: "Error adding player", error });
  }
};

export const getPlayersByGamePin = async (req, res) => {
  const { gamePin } = req.params;

  try {
    const quiz = await Quiz.findOne({ gamePin });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const players = await Player.find({
      quizId: quiz._id,
      isConnected: true,
    });

    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Error fetching players", error });
  }
};

export const getSessionParticipants = async (req, res) => {
  try {
    const { pin } = req.params;

    const session = await QuizSession.findOne({
      pin,
      isActive: true,
    });

    if (!session) {
      return res.status(404).json({
        message: "No active session found for this PIN",
      });
    }

    // Only get participants (not hosts) who are connected
    const participants = await Player.find({
      sessionId: session._id,
      isConnected: true,
      isHost: { $ne: true }, // Exclude hosts from the query
    })
      .select("_id name avatarSeed userId isHost")
      .populate("userId", "_id name");

    res.json({
      sessionId: session._id,
      participants: participants.map((p) => ({
        _id: p._id,
        name: p.name, // No need to check isHost here since we filtered them out
        userId: p.userId?._id || null,
        userName: p.userId?.name || p.name,
        avatarSeed: p.avatarSeed,
        isConnected: true,
        role: "participant",
      })),
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({
      message: "Error fetching participants",
      error: error.message,
    });
  }
};
