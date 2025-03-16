import { io } from "./index.js";

export const emitQuizStart = (quizId) => {
  io.to(quizId).emit("quiz-started", {
    message: "The quiz has started!",
    timestamp: new Date(),
  });
};

export const emitNewPlayer = (quizId, player) => {
  io.to(quizId).emit("player-joined", {
    player,
    timestamp: new Date(),
  });
};

export const emitPlayerLeft = (quizId, playerId) => {
  io.to(quizId).emit("player-left", {
    playerId,
    timestamp: new Date(),
  });
};
