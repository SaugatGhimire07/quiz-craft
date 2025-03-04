import Quiz from '../models/Quiz.js';
import { nanoid } from 'nanoid';

// Create a new quiz
export const createQuiz = async (req, res) => {
  const { title, questions } = req.body;

  try {
    const code = nanoid(6); // Generate a unique 6-character code
    const newQuiz = new Quiz({
      title,
      questions,
      createdBy: req.user._id,
      code,
      isLive: false, // Set the quiz to not live upon creation
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error });
  }
};

// Get a quiz by code
export const getQuizByCode = async (req, res) => {
  const { code } = req.params;
  try {
    const quiz = await Quiz.findOne({ code }).populate('createdBy', 'name');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    res.status(200).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get quiz', error });
  }
};

// Join a quiz
export const joinQuiz = async (req, res) => {
  const { code, userName } = req.body;
  try {
    const quiz = await Quiz.findOne({ code });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const userScore = { userName, score: 0 };
    quiz.userScores.push(userScore);

    // Add player to the waiting room
    quiz.waitingRoom.push({ userName });

    await quiz.save();
    res.status(200).json({ message: 'Joined quiz successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join quiz', error });
  }
};

// Start a quiz
export const startQuiz = async (req, res) => {
  const { code } = req.body;
  try {
    const quiz = await Quiz.findOne({ code });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.isLive = true; // Set the quiz to live
    await quiz.save();
    res.status(200).json({ message: 'Quiz started successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start quiz', error });
  }
};

// End a quiz
export const endQuiz = async (req, res) => {
  const { code } = req.body;
  try {
    const quiz = await Quiz.findOne({ code });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    quiz.isLive = false; // Set the quiz to not live
    quiz.waitingRoom = []; // Clear the waiting room
    await quiz.save();
    res.status(200).json({ message: 'Quiz has ended', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to end quiz', error });
  }
};

// Get live quizzes
export const getLiveQuizzes = async (req, res) => {
  try {
    const liveQuizzes = await Quiz.find({ isLive: true });
    res.status(200).json(liveQuizzes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get live quizzes', error });
  }
};

// Update user score
export const updateUserScore = async (req, res) => {
  const { code, userName, score } = req.body;
  try {
    const quiz = await Quiz.findOne({ code });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const userScore = quiz.userScores.find((us) => us.userName === userName);
    if (userScore) {
      userScore.score = score;
      await quiz.save();
      res.status(200).json({ message: 'Score updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found in quiz' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update score', error });
  }
};

// Leave a quiz
export const leaveQuiz = async (req, res) => {
  const { code, userId } = req.body;
  try {
    const quiz = await Quiz.findOne({ code });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Remove player from the waiting room
    quiz.waitingRoom = quiz.waitingRoom.filter(player => player.userId.toString() !== userId);

    // If the user is the host, assign a new host or end the quiz if no players are left
    if (quiz.createdBy.toString() === userId) {
      if (quiz.waitingRoom.length > 0) {
        quiz.createdBy = quiz.waitingRoom[0].userId;
      } else {
        quiz.isLive = false;
        quiz.waitingRoom = [];
      }
    }

    await quiz.save();
    res.status(200).json({ message: 'Left quiz successfully', quiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave quiz', error });
  }
};