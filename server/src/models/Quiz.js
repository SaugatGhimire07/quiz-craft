import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: String, required: true },
  type: { type: String, required: true }, // multiple-choice or true-false
  timer: { type: Number, required: true }, // time in seconds
});

const userScoreSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  score: { type: Number, default: 0 },
});

const waitingRoomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  code: { type: String, unique: true, required: true },
  userScores: [userScoreSchema], // Track user scores
  waitingRoom: [waitingRoomSchema], // Track players in the waiting room
  isLive: { type: Boolean, default: false }, // Indicates if the quiz is live
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;