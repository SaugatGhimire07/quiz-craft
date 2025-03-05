import express from "express";
import { uploadImage, deleteImage } from "../controllers/imageController.js";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/upload", protect, uploadImage);
router.delete("/:filename", protect, deleteImage);

export default router;
