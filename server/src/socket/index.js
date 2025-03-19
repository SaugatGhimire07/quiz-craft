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
