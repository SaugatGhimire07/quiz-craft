import express from 'express';
import { createQuiz } from '../controllers/quizController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createQuiz);

export default router;