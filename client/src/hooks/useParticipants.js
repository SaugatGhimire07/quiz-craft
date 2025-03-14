import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../api/axios";

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
            (participant) => ({
              ...participant,
              avatarSeed: sessionStorage.getItem(
                `avatar_${participant._id}_${quizId}`
              ),
            })
          );
          setPlayers(updatedParticipants);
          setPlayerCount(updatedParticipants.length);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    fetchParticipants();

    socket.emit("joinQuizRoom", {
      pin: gamePin,
      playerName: isHost ? "Quiz Host" : playerName,
      playerId: isHost ? null : location.state?.playerId,
      isHost,
      userId: user?._id,
    });

    const pollInterval = setInterval(fetchParticipants, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);

      if (!isHost && location.state?.playerId) {
        sessionStorage.removeItem(
          `avatar_${location.state.playerId}_${quizId}`
        );
        socket.emit("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state?.playerId,
        });
      }

      socket.off("avatarsUpdate");
    };
  }, [gamePin, isHost, playerName, location.state?.playerId, quizId, navigate]);

  useEffect(() => {
    socket.on("avatarsUpdate", ({ avatars }) => {
      const updatedPlayers = Object.entries(avatars).map(([playerId, seed]) => {
        sessionStorage.setItem(`avatar_${playerId}_${quizId}`, seed);
        const existingPlayer = players.find((p) => p._id === playerId);
        return existingPlayer
          ? { ...existingPlayer, avatarSeed: seed }
          : { _id: playerId, avatarSeed: seed, isConnected: true };
      });

      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("avatarsUpdate");
    };
  }, [players, quizId]);

  return {
    players,
    playerCount,
    socket,
    setPlayers,
    setPlayerCount,
  };
};
