import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/emailService.js"; // Add this import

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    user = new User({ name, email, password });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Login user & get token
// @route  POST /api/auth/login
// @access Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Send back user data and token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Forgot password
// @route  POST /api/auth/forgot-password
// @access Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Email format validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address",
        error: "INVALID_EMAIL",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email address",
        redirect: "signup",
        error: "USER_NOT_FOUND",
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Save verification code to user
    user.resetPasswordToken = verificationCode;
    user.resetPasswordExpire = Date.now() + 900000; // 15 minutes
    await user.save();

    try {
      // Send verification email
      await sendVerificationEmail(email, verificationCode);

      res.json({
        message: "Verification code sent to your email",
        redirect: "verify-code",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Reset the token if email sending fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send verification email. Please try again.",
        error: "EMAIL_SEND_FAILED",
      });
    }
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Failed to process reset password request",
      error: "SERVER_ERROR",
    });
  }
};

// @desc   Reset password
// @route  POST /api/auth/reset-password
// @access Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // Get token from URL params
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: "Password has been reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// @desc   Verify code
// @route  POST /api/auth/verify-code
// @access Public
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await User.findOne({
      email,
      resetPasswordToken: code,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code" });
    }

    // Generate new token for password reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({
      message: "Code verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};
