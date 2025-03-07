import Player from "../models/Player.js"; // Assuming you have a Player model
import Quiz from "../models/Quiz.js"; // Assuming you have a Quiz model

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

    const players = await Player.find({ quizId: quiz._id });

    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Error fetching players", error });
  }
};