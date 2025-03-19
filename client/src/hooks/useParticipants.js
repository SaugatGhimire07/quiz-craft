import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import api from "../api/axios";

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
  const { socket, isConnected, emitEvent } = useSocket();

  // Add connection status effect
  useEffect(() => {
    if (socket) {
      console.log("Socket status:", {
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
      });
    }
  }, [socket, isConnected]);

  // Add this at the beginning of the hook after state declarations
  useEffect(() => {
    if (!socket || !location.state?.playerId) return;

    // Attempt to reconnect player when socket connects
    const handleConnect = async () => {
      try {
        await api.post(`/players/${location.state.playerId}/reconnect`, {
          socketId: socket.id,
        });

        // Re-join room after reconnection
        if (isConnected && gamePin) {
          emitEvent("joinQuizRoom", {
            pin: gamePin,
            playerName,
            playerId: location.state.playerId,
            isHost,
            userId: user?._id,
          });
        }
      } catch (error) {
        console.error("Error reconnecting player:", error);
      }
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, location.state?.playerId, isConnected, gamePin]);

  // Join room effect
  useEffect(() => {
    if (!gamePin || !socket) return;

    const joinRoom = () => {
      if (socket.connected) {
        console.log(`Joining quiz room ${gamePin} as participant`);
        emitEvent("joinQuizRoom", {
          pin: gamePin,
          playerName,
          playerId: location.state?.playerId,
          isHost: false,
          userId: undefined,
        });
      }
    };

    // Initial join
    joinRoom();

    // Handle reconnection
    const handleReconnect = () => {
      console.log("Socket reconnected, rejoining room");
      joinRoom();
    };

    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);

      // Only leave if we're connected
      if (socket.connected && !isHost && location.state?.playerId) {
        console.log(`Leaving quiz room ${gamePin}`);
        emitEvent("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state.playerId,
        });
      }
    };
  }, [
    gamePin,
    socket,
    emitEvent,
    playerName,
    location.state?.playerId,
    isHost,
  ]);

  // Join the room and fetch participants
  useEffect(() => {
    if (!gamePin) return; // No game pin, can't proceed
    let mounted = true;
    let pollInterval;

    // Debug logging
    console.log("useParticipants initialized with:", {
      gamePin,
      quizId,
      isHost,
      playerName,
      playerId: location?.state?.playerId,
      socketConnected: isConnected,
    });

    const fetchParticipants = async () => {
      try {
        console.log(`Fetching participants for game ${gamePin}`);

        const response = await api.get(
          `/players/session/${gamePin}/participants`
        );

        if (mounted && response?.data?.participants) {
          // Only include connected participants
          const connectedParticipants = response.data.participants.filter(
            (participant) => participant.isConnected
          );

          console.log(
            `Found ${connectedParticipants.length} connected participants`
          );

          setPlayers(connectedParticipants);
          setPlayerCount(connectedParticipants.length);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Initial fetch
    fetchParticipants();

    // Set up polling for both host and participants
    pollInterval = setInterval(fetchParticipants, isHost ? 2000 : 5000); // Poll more frequently for host

    // Enhanced cleanup function
    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }

      // Leave room on unmount if we're a participant
      if (!isHost && location.state?.playerId && isConnected) {
        console.log(`Leaving quiz room ${gamePin}`);

        // Clear all related storage
        sessionStorage.removeItem(
          `avatar_${location.state.playerId}_${quizId}`
        );
        localStorage.removeItem(`quiz_session_${quizId}`);

        // Emit leave event
        emitEvent("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state?.playerId,
        });

        // Force disconnect socket
        if (socket?.connected) {
          socket.disconnect();
        }
      }
    };
  }, [
    gamePin,
    isHost,
    playerName,
    location.state?.playerId,
    quizId,
    user,
    navigate,
    isConnected,
    emitEvent,
    socket,
  ]);

  // Listen for avatar updates
  useEffect(() => {
    if (!socket) return;

    const handleAvatarsUpdate = ({ avatars }) => {
      console.log("Received avatar updates:", avatars);

      const updatedPlayers = Object.entries(avatars).map(([playerId, seed]) => {
        sessionStorage.setItem(`avatar_${playerId}_${quizId}`, seed);
        const existingPlayer = players.find((p) => p._id === playerId);
        return existingPlayer
          ? { ...existingPlayer, avatarSeed: seed }
          : { _id: playerId, avatarSeed: seed, isConnected: true };
      });

      setPlayers(updatedPlayers);
    };

    socket.on("avatarsUpdate", handleAvatarsUpdate);

    return () => {
      socket.off("avatarsUpdate", handleAvatarsUpdate);
    };
  }, [players, quizId, socket]);

  // Listen for participant join/leave events
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (participant) => {
      console.log("Participant joined:", participant);

      // Safety check - if necessary data is missing, don't add the participant
      if (!participant || (!participant.id && !participant.name)) {
        console.error("Received invalid participant data:", participant);
        return;
      }

      // Use fallback values if data is missing
      const participantId = participant.id || `anon-${Date.now()}`;
      const participantName = participant.name || "Anonymous Player";
      const avatarSeed =
        participant.avatarSeed ||
        participantName.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Store the avatar seed in sessionStorage for consistency
      sessionStorage.setItem(`avatar_${participantId}_${quizId}`, avatarSeed);

      // Update player list when a new participant joins
      setPlayers((currentPlayers) => {
        // Check if player already exists
        const existingPlayerIndex = currentPlayers.findIndex(
          (p) => p._id === participantId
        );

        if (existingPlayerIndex >= 0) {
          // Update existing player
          const updatedPlayers = [...currentPlayers];
          updatedPlayers[existingPlayerIndex] = {
            ...updatedPlayers[existingPlayerIndex],
            name: participantName,
            avatarSeed: avatarSeed,
            isConnected: true,
          };
          return updatedPlayers;
        }

        // Add new player
        return [
          ...currentPlayers,
          {
            _id: participantId,
            name: participantName,
            avatarSeed: avatarSeed,
            isConnected: true,
            role: participant.role || "participant",
          },
        ];
      });
    };

    const handlePlayerLeft = ({ playerId }) => {
      console.log("Player left event received:", playerId);
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player._id !== playerId)
      );
      setPlayerCount((prevCount) => Math.max(0, prevCount - 1));
    };

    socket.on("participantJoined", handleParticipantJoined);
    socket.on("playerLeft", handlePlayerLeft);

    return () => {
      socket.off("participantJoined", handleParticipantJoined);
      socket.off("playerLeft", handlePlayerLeft);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerLeft = ({ playerId }) => {
      setPlayers((prevPlayers) =>
        prevPlayers.filter((player) => player._id !== playerId)
      );
      setPlayerCount((prevCount) => Math.max(0, prevCount - 1));
    };

    socket.on("playerLeft", handlePlayerLeft);

    return () => {
      socket.off("playerLeft", handlePlayerLeft);
    };
  }, [socket, setPlayers, setPlayerCount]);

  return {
    players,
    playerCount,
    socket,
    isConnected,
    emitEvent,
    setPlayers,
    setPlayerCount,
  };
};
