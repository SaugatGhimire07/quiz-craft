import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/emailService.js";

// Generate JWT Token
const generateToken = (id, sessionToken) => {
  return jwt.sign({ id, sessionToken }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
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

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user = new User({
      name,
      email,
      password,
      verificationCode,
      verificationExpires: Date.now() + 3600000, // 1 hour expiry
    });

    await user.save();

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
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

    // Check if email is verified
    if (!user.isVerified) {
      // Generate new verification code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      user.verificationCode = verificationCode;
      user.verificationExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send new verification email
      await sendVerificationEmail(email, verificationCode);

      return res.status(403).json({
        message: "Please verify your email first",
        isVerified: false,
      });
    }

    const token = generateToken(user._id, user.sessionToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      token,
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

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    user.resetPasswordToken = verificationCode;
    user.resetPasswordExpire = Date.now() + 900000; // 15 minutes
    await user.save();

    try {
      await sendPasswordResetEmail(email, verificationCode);

      res.json({
        message: "Password reset code sent to your email",
        redirect: "verify-code",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        message: "Failed to send reset code. Please try again.",
        error: "EMAIL_SEND_FAILED",
      });
    }
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      message: "Failed to process request",
      error: "SERVER_ERROR",
    });
  }
};

// @desc   Verify code for password reset
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
      return res.status(400).json({
        message: "Invalid or expired verification code",
      });
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
    console.error("Code verification error:", error);
    res.status(500).json({ message: "Failed to verify code" });
  }
};

// @desc   Reset password
// @route  POST /api/auth/reset-password/:token
// @access Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

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

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      message: "Password has been reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// @desc   Verify email address
// @route  POST /api/auth/verify-email
// @access Public
export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification code",
      });
    }

    // Update user status
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;
    await user.save();

    // Generate token WITH the session token
    const token = generateToken(user._id, user.sessionToken);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: true,
      token,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

// @desc   Get current user profile
// @route  GET /api/auth/user
// @access Private
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set from the auth middleware
    const user = await User.findById(req.user._id).select(
      "-password -verificationCode -resetPasswordToken -resetPasswordExpire -verificationExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Update user profile
// @route  PUT /api/auth/user
// @access Private
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, password, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle name update
    if (name) user.name = name;

    // Handle email update with password verification
    if (email && password) {
      // Verify the provided password
      const passwordMatch = await user.matchPassword(password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Check if email is already in use by another account
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email is already in use" });
      }

      user.email = email;
    }

    // Handle password update
    if (currentPassword && newPassword) {
      // Verify current password
      const passwordMatch = await user.matchPassword(currentPassword);
      if (!passwordMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
    }

    await user.save();

    // Return updated user info (without sensitive fields)
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Request email change
// @route  PUT /auth/update-email
// @access Private
export const requestEmailChange = async (req, res) => {
  try {
    const { newEmail, password } = req.body;

    // Find the user by ID
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Check if email is already in use by another account
    const emailExists = await User.findOne({ email: newEmail });
    if (emailExists && emailExists._id.toString() !== user._id.toString()) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Store the new email and verification code
    user.pendingEmail = newEmail;
    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send verification email to the new address
    await sendVerificationEmail(newEmail, verificationCode);

    res.json({
      message: "Verification email sent to your new address",
      success: true,
    });
  } catch (error) {
    console.error("Email change request error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc   Verify new email
// @route  POST /auth/verify-new-email
// @access Public
export const verifyNewEmail = async (req, res) => {
  const { email, code } = req.body;

  try {
    const user = await User.findOne({
      pendingEmail: email,
      emailVerificationCode: code,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification code",
      });
    }

    // Update user's email
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.json({
      message: "Email updated successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Failed to verify email" });
  }
};

// @desc   Logout from all devices except current one
// @route  POST /api/auth/logout-everywhere
// @access Private
export const logoutEverywhere = async (req, res) => {
  try {
    // Get current user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new session token
    const newSessionToken = crypto.randomBytes(32).toString("hex");
    user.sessionToken = newSessionToken;

    await user.save();

    // Return new token for current session
    const token = generateToken(user._id, newSessionToken);

    res.json({
      message: "Successfully logged out from all other devices",
      token,
    });
  } catch (error) {
    console.error("Logout everywhere error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
