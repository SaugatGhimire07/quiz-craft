import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyCode,
  verifyEmail,
  getCurrentUser,
  updateUserProfile,
  logoutEverywhere,
  requestEmailChange,
  verifyNewEmail,
} from "../controllers/authController.js";
import { body } from "express-validator";
import { protect, admin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// User Registration Route
router.post(
  "/register",
  [
    body("name").not().isEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Enter a valid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  registerUser
);

// User Login Route
router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/verify-code", verifyCode);
router.post("/verify-email", verifyEmail);

// Protected routes
router.get("/user", protect, getCurrentUser);
router.put("/user", protect, updateUserProfile);
router.post("/logout-everywhere", protect, logoutEverywhere);

// Add these new routes
router.put("/update-email", protect, requestEmailChange);
router.post("/verify-new-email", verifyNewEmail);

export default router;
