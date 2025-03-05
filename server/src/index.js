import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";

dotenv.config(); // Load environment variables

const app = express();

// Configure CORS properly for credentials
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend origin
    credentials: true, // Allow credentials
  })
);

// Increase payload size limit to 50MB
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const mongoURI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/quizcraft";

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT || 5001, () => {
      console.log(`Server running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/quiz", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", contactRoutes);
app.get("/", (req, res) => res.send("API is running..."));
