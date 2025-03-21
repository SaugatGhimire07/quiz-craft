const avatarSeeds = new Map(); // Store avatar seeds by room
const connectedUsers = new Map(); // Store connected users by socket id

io.on("connection", (socket) => {
  socket.on(
    "joinQuizRoom",
    async ({ pin, playerName, playerId, isHost, userId }) => {
      try {
        socket.join(pin);

        // Initialize room's avatar seeds if not exists
        if (!avatarSeeds.has(pin)) {
          avatarSeeds.set(pin, new Map());
        }

        if (!isHost && playerId) {
          // Generate deterministic avatar seed for new player if not already existing
          if (!avatarSeeds.get(pin).has(playerId)) {
            const avatarSeed = `avatar_${playerId}`;
            avatarSeeds.get(pin).set(playerId, avatarSeed);
          }

          // Broadcast updated avatar list to all clients (including the new player)
          const allAvatars = Object.fromEntries(avatarSeeds.get(pin));
          io.in(pin).emit("avatarsUpdate", {
            avatars: allAvatars,
          });
        }

        // Store connection info
        connectedUsers.set(socket.id, { pin, playerId, isHost });
      } catch (error) {
        console.error("Error in joinQuizRoom:", error);
        socket.emit("error", { message: "Failed to join quiz room" });
      }
    }
  );

  // Handle manual avatar sync from clients
  socket.on("syncAvatars", ({ pin, avatars }) => {
    if (!avatarSeeds.has(pin)) {
      avatarSeeds.set(pin, new Map());
    }

    // Update seeds on server
    Object.entries(avatars).forEach(([playerId, seed]) => {
      avatarSeeds.get(pin).set(playerId, seed);
    });

    // Broadcast updated avatars to all clients
    io.in(pin).emit("avatarsUpdate", {
      avatars: Object.fromEntries(avatarSeeds.get(pin)),
    });
  });

  // Handle avatar sync request from clients
  socket.on("requestAvatarSync", ({ pin }) => {
    if (avatarSeeds.has(pin)) {
      const allAvatars = Object.fromEntries(avatarSeeds.get(pin));
      socket.emit("avatarsUpdate", { avatars: allAvatars });
    }
  });

  // Add this handler in your io.on("connection") block
  socket.on("sendDirectMessage", ({ targetSocketId, event, data }) => {
    if (targetSocketId && event) {
      console.log(`Forwarding ${event} to socket ${targetSocketId}`);
      io.to(targetSocketId).emit(event, data);
    }
  });

  // Add or update this socket.on handler in server/src/index.js
  socket.on(
    "quizComplete",
    async ({ quizId, sessionId, playerId, totalScore }) => {
      try {
        console.log(
          `Player ${playerId} completed quiz ${quizId} with score ${totalScore}`
        );

        // Find the session
        const session = await QuizSession.findOne({
          $or: [{ _id: sessionId }, { quizId, isActive: true }],
        });

        if (!session) {
          console.error(`No session found for quiz ${quizId}`);
          return;
        }

        // Find the player
        const player = await Player.findById(playerId);
        if (!player) {
          console.error(`Player ${playerId} not found`);
          return;
        }

        console.log(`Found player ${player.name} in session ${session._id}`);

        // Find or create player score record
        const playerScore = await PlayerScore.findOneAndUpdate(
          {
            quizId,
            playerId,
            sessionId: session._id,
          },
          {
            $set: {
              completed: true,
              totalScore: totalScore || 0,
            },
          },
          { upsert: true, new: true }
        );

        console.log(
          `Updated player score record: ${playerScore._id}, score: ${playerScore.totalScore}`
        );

        // Count total players vs completed players
        const totalPlayers = await Player.countDocuments({
          sessionId: session._id,
          isHost: { $ne: true }, // Exclude hosts
        });

        const completedCount = await PlayerScore.countDocuments({
          sessionId: session._id,
          completed: true,
        });

        console.log(
          `${completedCount} out of ${totalPlayers} players have completed the quiz`
        );

        // Special case for single participant - always mark as complete
        if (totalPlayers === 1 && completedCount === 1) {
          console.log(
            "Single participant has completed the quiz, showing results"
          );

          // Mark session as all completed
          await QuizSession.findByIdAndUpdate(session._id, {
            $set: { allCompleted: true },
          });

          // Emit to the room
          io.to(session.pin).emit("showResults", {
            quizId,
            sessionId: session._id,
            allParticipantsFinished: true,
          });

          // Also emit separate event as a backup
          io.to(session.pin).emit("allParticipantsFinished", {
            quizId,
            sessionId: session._id,
          });
          return;
        }

        // Regular logic for multiple participants
        if (completedCount >= totalPlayers && totalPlayers > 0) {
          console.log(
            `All ${totalPlayers} players have completed! Showing results to everyone`
          );

          // Mark session as all completed
          await QuizSession.findByIdAndUpdate(session._id, {
            $set: { allCompleted: true },
          });

          // Emit to the room
          io.to(session.pin).emit("showResults", {
            quizId,
            sessionId: session._id,
            allParticipantsFinished: true,
          });

          // Also emit separate event as a backup
          io.to(session.pin).emit("allParticipantsFinished", {
            quizId,
            sessionId: session._id,
          });
        } else {
          // This participant is done, but still waiting for others
          // Send a personal showResults event just to this participant
          socket.emit("showResults", {
            quizId,
            sessionId: session._id,
            allParticipantsFinished: false,
          });
        }
      } catch (error) {
        console.error("Error handling quiz completion:", error);
      }
    }
  );

  // Clean up on disconnect
  socket.on("disconnect", () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      const { pin, playerId } = userData;

      if (playerId && avatarSeeds.has(pin)) {
        avatarSeeds.get(pin).delete(playerId);

        // Cleanup if room is empty
        if (avatarSeeds.get(pin).size === 0) {
          avatarSeeds.delete(pin);
        } else {
          io.in(pin).emit("avatarsUpdate", {
            avatars: Object.fromEntries(avatarSeeds.get(pin)),
          });
        }
      }

      connectedUsers.delete(socket.id);
    }
  });
});
