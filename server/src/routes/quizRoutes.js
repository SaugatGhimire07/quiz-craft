import express from "express";
import {
  createQuiz,
  getUserQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  uploadImage,
  getImage,
} from "../controllers/quizController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/image/:id", getImage);
router.post("/create", protect, createQuiz);
router.get("/user", protect, getUserQuizzes);
router.get("/:id", protect, getQuiz);
router.put("/:id", protect, updateQuiz);
router.delete("/:id", protect, deleteQuiz);

export default router;
