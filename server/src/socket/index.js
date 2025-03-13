const avatarSeeds = new Map(); // Store avatar seeds by room

// In your socket.io server setup
io.on("connection", (socket) => {
  // Add new socket events for avatar syncing
  socket.on("syncAvatars", ({ pin, avatars }) => {
    // Store received avatars
    if (!avatarSeeds.has(pin)) {
      avatarSeeds.set(pin, new Map());
    }
    Object.entries(avatars).forEach(([playerId, seed]) => {
      avatarSeeds.get(pin).set(playerId, seed);
    });

    // Broadcast to others in room
    socket.to(pin).emit("avatarsUpdate", { avatars });
  });

  socket.on("requestAvatarSync", ({ pin }) => {
    // Send stored avatars for the room
    const roomAvatars = avatarSeeds.get(pin);
    if (roomAvatars) {
      const avatars = Object.fromEntries(roomAvatars);
      socket.emit("avatarsUpdate", { avatars });
    }
  });

  // Clean up when room is closed
  socket.on("disconnect", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((pin) => {
      if (avatarSeeds.has(pin)) {
        avatarSeeds.delete(pin);
      }
    });
  });
});
