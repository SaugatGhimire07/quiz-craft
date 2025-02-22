import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  console.error("SendGrid API key is not set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendPasswordResetEmail = async (email, code) => {
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error("Sender email is not configured");
  }

  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Reset Your Password - Quiz Craft",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Reset</h1>
          <p style="font-size: 16px;">You requested to reset your password. Use the verification code below:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #2d2d2d; letter-spacing: 5px; font-size: 32px;">${code}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    console.log("Password reset email sent successfully");
    return response;
  } catch (error) {
    console.error(
      "Email sending error:",
      error.response?.body?.errors || error
    );
    throw new Error(
      error.response?.body?.errors?.[0]?.message ||
        "Failed to send password reset email"
    );
  }
};

export const sendVerificationEmail = async (email, code) => {
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error("Sender email is not configured");
  }

  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Verify Your Email - Quiz Craft",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to Quiz Craft!</h1>
          <p style="font-size: 16px;">Thank you for signing up. Please verify your email address using the code below:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h2 style="color: #2d2d2d; letter-spacing: 5px; font-size: 32px;">${code}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 15 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you didn't create an account with Quiz Craft, please ignore this email.</p>
        </div>
      `,
    };

    const response = await sgMail.send(msg);
    console.log("Verification email sent successfully");
    return response;
  } catch (error) {
    console.error(
      "Email sending error:",
      error.response?.body?.errors || error
    );
    throw new Error(
      error.response?.body?.errors?.[0]?.message ||
        "Failed to send verification email"
    );
  }
};
