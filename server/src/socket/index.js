// In your socket.io server setup
io.on("connection", (socket) => {
  // ...existing socket handlers...

  // Add new socket events for avatar syncing
  socket.on("syncAvatars", ({ pin, avatars }) => {
    // Broadcast avatar seeds to all clients in the room except sender
    socket.to(pin).emit("avatarsUpdate", { avatars });
  });

  socket.on("requestAvatarSync", ({ pin }) => {
    // Request host to send current avatar seeds
    socket.to(pin).emit("requestAvatarSync");
  });
});
