import express from "express";
import {
  createQuiz,
  getUserQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  uploadImage,
  getImage,
  makeQuizLive,
  endQuiz,
  getQuizByGamePin,
  getOrCreateQuizSession,
  startQuizSession,
  joinQuizSession,
} from "../controllers/quizController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/image/:id", getImage);
router.post("/create", protect, createQuiz);
router.get("/user", protect, getUserQuizzes);
router.get("/:id", protect, getQuiz);
router.put("/:id", protect, updateQuiz);
router.delete("/:id", protect, deleteQuiz);
router.patch("/:id/publish", protect, makeQuizLive);
router.post("/:id/end", protect, endQuiz);
router.get("/gamepin/:gamePin", protect, getQuizByGamePin);
router.get("/:quizId/session/active", getOrCreateQuizSession);
router.post("/:quizId/session/start", protect, startQuizSession);
router.post("/join", joinQuizSession);

// For participants (no auth required)
router.get("/:quizId/session/active", getOrCreateQuizSession);
router.get("/:quizId/session", getOrCreateQuizSession);

// For hosts (auth required)
router.post("/:quizId/session/host", protect, getOrCreateQuizSession);

export default router;
