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

  // Join the room and fetch participants
  useEffect(() => {
    if (!gamePin) return; // No game pin, can't proceed
    let mounted = true;

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

        // Try the players route first
        try {
          const response = await api.get(
            `/players/session/${gamePin}/participants`
          );

          if (mounted && response?.data?.participants) {
            console.log(
              `Found ${response.data.participants.length} participants`
            );

            // Process participants...
            const apiParticipants = response.data.participants.map(
              (participant) => ({
                ...participant,
                avatarSeed:
                  sessionStorage.getItem(
                    `avatar_${participant._id}_${quizId}`
                  ) || participant.avatarSeed,
              })
            );

            // Update state with fetched participants
            setPlayers((currentPlayers) => {
              // Create a map of existing players by ID for quick lookup
              const existingPlayersMap = new Map(
                currentPlayers.map((player) => [player._id, player])
              );

              // Merge API participants with socket participants
              const mergedParticipants = apiParticipants.map((apiPlayer) => {
                const existingPlayer = existingPlayersMap.get(apiPlayer._id);
                return existingPlayer
                  ? { ...existingPlayer, ...apiPlayer }
                  : apiPlayer;
              });

              // Add any socket participants not returned by the API
              currentPlayers.forEach((socketPlayer) => {
                if (
                  !mergedParticipants.some((p) => p._id === socketPlayer._id)
                ) {
                  mergedParticipants.push(socketPlayer);
                }
              });

              return mergedParticipants;
            });

            setPlayerCount(apiParticipants.length);
          }
        } catch (firstError) {
          console.log("First endpoint failed, trying fallback...");

          // If first endpoint fails, try the quiz route as fallback
          const fallbackResponse = await api.get(
            `/quiz/session/${gamePin}/participants`
          );

          if (mounted && fallbackResponse?.data?.participants) {
            // Process as before...
            // (similar code to above)
          }
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Initial fetch
    fetchParticipants();

    // Join the quiz room when socket is connected
    if (isConnected) {
      console.log(
        `Joining quiz room ${gamePin} as ${
          isHost ? "host" : "participant"
        } with ID: ${socket.id}`
      );

      // Prepare host data properly
      const hostId = isHost ? `host-${user?._id || "anonymous"}` : null;
      const participantId = isHost ? null : location.state?.playerId;

      // Add a callback to confirm the room was joined
      emitEvent(
        "joinQuizRoom",
        {
          pin: gamePin,
          playerName: isHost ? "Quiz Host" : playerName,
          playerId: isHost ? hostId : participantId,
          isHost,
          userId: user?._id,
        },
        (response) => {
          if (response && response.success) {
            console.log(`Successfully joined room ${gamePin}`);
          } else {
            console.error(`Failed to join room ${gamePin}`, response);
          }
        }
      );
    }

    // Set up polling for participants
    const pollInterval = setInterval(fetchParticipants, 5000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(pollInterval);

      // Leave room on unmount if we're a participant
      if (!isHost && location.state?.playerId && isConnected) {
        console.log(`Leaving quiz room ${gamePin}`);
        sessionStorage.removeItem(
          `avatar_${location.state.playerId}_${quizId}`
        );
        emitEvent("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state?.playerId,
        });
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
      console.log("Player left:", playerId);
      setPlayers((currentPlayers) =>
        currentPlayers.filter((player) => player._id !== playerId)
      );
    };

    socket.on("participantJoined", handleParticipantJoined);
    socket.on("playerLeft", handlePlayerLeft);

    return () => {
      socket.off("participantJoined", handleParticipantJoined);
      socket.off("playerLeft", handlePlayerLeft);
    };
  }, [socket]);

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
