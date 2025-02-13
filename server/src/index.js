import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
