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
  getSessionParticipants,
  getQuizStatus,
  getQuizForParticipant,
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
router.post("/:quizId/end", protect, endQuiz);
router.get("/gamepin/:gamePin", protect, getQuizByGamePin);
router.get("/:quizId/session/active", getOrCreateQuizSession);
router.post("/:quizId/session/start", startQuizSession);
router.post("/join", joinQuizSession);
router.get("/:quizId/status", getQuizStatus);

// For participants (no auth required)
router.get("/:quizId/session/active", getOrCreateQuizSession);
router.get("/:quizId/session", getOrCreateQuizSession);
router.get("/session/:pin/participants", getSessionParticipants);
router.post("/:quizId/session/participant-start", startQuizSession);
router.get("/:quizId/participant-view", getQuizForParticipant);

// For hosts (auth required)
router.get("/:quizId/session/host", protect, getOrCreateQuizSession);

export default router;
