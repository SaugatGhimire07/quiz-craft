import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";
import { getOrCreateAvatar } from "../utils/avatarManager";

const socket = io("http://localhost:5001", {
  withCredentials: true,
});

export const useParticipants = (
  gamePin,
  quizId,
  isHost,
  playerName,
  location,
  user,
  navigate
) => {
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    if (!gamePin) return;

    let mounted = true;

    const fetchParticipants = async () => {
      try {
        const response = await api.get(
          `/players/session/${gamePin}/participants`
        );
        if (mounted) {
          const updatedParticipants = response.data.participants.map(
            (participant) => {
              // Check for existing avatar seed first
              const storageKey = `avatar_${participant._id}_${quizId}`;
              let avatarSeed = sessionStorage.getItem(storageKey);

              if (!avatarSeed) {
                // If no seed exists, generate and store it
                avatarSeed = `${participant._id}-${Date.now()}`;
                sessionStorage.setItem(storageKey, avatarSeed);
              }

              return {
                ...participant,
                avatarSeed,
              };
            }
          );
          setPlayers(updatedParticipants);
          setPlayerCount(updatedParticipants.length);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Initial fetch
    fetchParticipants();

    // Socket connection
    socket.emit("joinQuizRoom", {
      pin: gamePin,
      playerName: isHost ? "Quiz Host" : playerName,
      playerId: isHost ? null : location.state?.playerId,
      isHost: isHost,
      userId: user?._id,
    });

    // Handle participant joining
    socket.on(
      "participantJoined",
      ({ id, name, avatarSeed, userId, isHost }) => {
        if (mounted) {
          setPlayers((prevPlayers) => {
            if (isHost) return prevPlayers;

            const isDuplicate = prevPlayers.some((player) => player._id === id);

            if (!isDuplicate) {
              const storageKey = `avatar_${id}_${quizId}`;
              // Use existing avatar seed or save the new one
              const existingAvatarSeed = sessionStorage.getItem(storageKey);
              const finalAvatarSeed = existingAvatarSeed || avatarSeed;

              if (!existingAvatarSeed) {
                sessionStorage.setItem(storageKey, finalAvatarSeed);
              }

              return [
                ...prevPlayers,
                {
                  _id: id,
                  name,
                  avatarSeed: finalAvatarSeed,
                  userId,
                  isHost: false,
                  isCurrentPlayer: location.state?.playerId === id,
                  isConnected: true,
                  role: "participant",
                },
              ];
            }
            return prevPlayers;
          });
        }
      }
    );

    // Polling for updates
    const pollInterval = setInterval(fetchParticipants, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);

      if (!isHost) {
        socket.emit("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state?.playerId,
        });

        if (location.state?.playerId) {
          const participantKey = `avatar_${location.state.playerId}_${quizId}`;
          sessionStorage.removeItem(participantKey);
        }
      }

      socket.off("participantJoined");
      socket.off("playerLeft");
      socket.off("playerCount");
      socket.off("quizStarted");
    };
  }, [gamePin, isHost, playerName, location.state?.playerId, quizId, navigate]);

  return {
    players,
    playerCount,
    socket,
    setPlayers,
    setPlayerCount,
  };
};
