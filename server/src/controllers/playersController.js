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
    console.log(`Fetching participants for session with pin: ${pin}`);

    // Try finding by both status and isActive to cover all cases
    let session = await QuizSession.findOne({
      pin,
      $or: [
        { status: "active" },
        { isActive: true, status: { $ne: "completed" } },
      ],
    });

    if (!session) {
      console.log(
        `No active session found for pin ${pin}, looking for any session`
      );
      session = await QuizSession.findOne({ pin });

      if (session) {
        console.log(
          `Found inactive session with pin ${pin}, updating to active`
        );

        // If we found a session but it's not active, update it to active
        session.isActive = true;
        session.status = "active";
        session.startedAt = session.startedAt || new Date();
        await session.save();
      }
    }

    if (!session) {
      console.log(`No session found for pin: ${pin}`);
      return res.status(404).json({
        message: "No session found for this PIN",
      });
    }

    console.log(
      `Found session: ${session._id}, status: ${session.status}, active: ${session.isActive}`
    );

    // Find participants without filtering by isConnected
    const participants = await Player.find({
      sessionId: session._id,
      isHost: { $ne: true }, // Still exclude hosts
    })
      .select("_id name avatarSeed userId isHost")
      .populate("userId", "_id name");

    console.log(`Found ${participants.length} participants in database`);

    res.json({
      sessionId: session._id,
      participants: participants.map((p) => ({
        _id: p._id,
        name: p.name || "Anonymous",
        userId: p.userId?._id || null,
        userName: p.userId?.name || p.name || "Anonymous",
        avatarSeed:
          p.avatarSeed ||
          p.name?.toLowerCase().replace(/[^a-z0-9]/g, "") + Date.now(),
        isConnected: true, // Consider all players as connected
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
