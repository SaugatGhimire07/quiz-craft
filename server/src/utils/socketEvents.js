import { io } from "../index.js";

export const emitParticipantJoined = (pin, participant) => {
  io.to(pin).emit("participantJoined", {
    id: participant._id,
    name: participant.name,
    timestamp: new Date(),
  });
};
