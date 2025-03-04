import express from 'express';
import { createQuiz, getQuizByCode, joinQuiz, updateUserScore, endQuiz, getLiveQuizzes, startQuiz, leaveQuiz} from '../controllers/quizController.js';

const router = express.Router();

router.post('/create', createQuiz); // Endpoint to create a new quiz
router.get('/:code', getQuizByCode); // Endpoint to get a quiz by code
router.post('/join', joinQuiz); // Endpoint to join a quiz
router.post('/update-score', updateUserScore); // Endpoint to update user score
router.post('/end', endQuiz); // Endpoint to end a quiz
router.get('/live', getLiveQuizzes); // Endpoint to get live quizzes
router.post('/start', startQuiz); // Endpoint to start a quiz
router.post('/leave', leaveQuiz); // Endpoint to leave a quiz

export default router;