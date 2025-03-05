import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: String, required: true },
  type: { type: String, required: true },
  timer: { type: Number, required: true },
  imageId: { type: String }, // Store GridFS file ID
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["draft", "live"], default: "draft" },
});

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
