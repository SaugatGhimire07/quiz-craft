import express from "express";
import {
  submitContactForm,
  getMessages,
} from "../controllers/contactController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/contact", submitContactForm);
router.get("/messages", protect, admin, getMessages);

export default router;
