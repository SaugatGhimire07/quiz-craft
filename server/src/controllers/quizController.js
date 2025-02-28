import Quiz from '../models/Quiz.js';
import { nanoid } from 'nanoid';

export const createQuiz = async (req, res) => {
  const { title, questions } = req.body;

  try {
    const code = nanoid(6); // Generate a unique 6-character code
    const newQuiz = new Quiz({
      title,
      questions,
      createdBy: req.user._id,
      code,
    });

    const savedQuiz = await newQuiz.save();
    res.status(201).json(savedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error });
  }
};