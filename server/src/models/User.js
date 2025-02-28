import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: undefined },
    verificationExpires: { type: Date, default: undefined },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    sessionToken: {
      type: String,
      required: false,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    // Add these new fields for email change
    pendingEmail: String,
    emailVerificationCode: String,
    emailVerificationExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", UserSchema);
export default User;
