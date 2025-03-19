import { useState, useEffect } from "react";
import api from "../api/axios";

export const useQuizSession = (quizId, location) => {
  const [gamePin, setGamePin] = useState(location?.state?.gamePin || "");
  const [sessionId, setSessionId] = useState(
    location?.state?.sessionId || null
  );
  const [playerName, setPlayerName] = useState(
    location?.state?.playerName || ""
  );
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [quizLive, setQuizLive] = useState(location?.state?.quizLive || false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizSession = async () => {
      try {
        // Set isHost based on whether there's a playerId in location state
        const isHost = !location.state?.playerId;
        setIsHost(isHost);

        console.log("Session data in location state:", {
          gamePin: location?.state?.gamePin,
          sessionId: location?.state?.sessionId,
          playerId: location?.state?.playerId,
          playerName: location?.state?.playerName,
        });

        // Use gamePin from location state if available
        if (location.state?.gamePin) {
          setGamePin(location.state.gamePin);
        }

        // Use sessionId from location state if available
        if (location.state?.sessionId) {
          setSessionId(location.state.sessionId);
        }

        // Only make API call if we need more data
        if (!location.state?.gamePin || !location.state?.sessionId) {
          try {
            // First try the preferred endpoint
            const endpoint = isHost
              ? `/quiz/${quizId}/session/host`
              : `/quiz/${quizId}/session/active`;
            console.log(`Fetching session data from ${endpoint}`);

            try {
              const response = await api.get(endpoint);
              const session = response.data;
              console.log("Session data from API:", session);

              if (session) {
                setGamePin(session.pin);
                setSessionId(session._id || session.sessionId);
              }
            } catch (primaryError) {
              console.error("Error with primary endpoint:", primaryError);

              // Fallback to secondary endpoint if primary fails
              console.log("Trying fallback endpoint: /quiz/${quizId}/session");
              const fallbackResponse = await api.get(`/quiz/${quizId}/session`);
              const fallbackSession = fallbackResponse.data;

              console.log("Session data from fallback API:", fallbackSession);
              if (fallbackSession) {
                setGamePin(fallbackSession.pin);
                setSessionId(fallbackSession._id || fallbackSession.sessionId);
              }
            }
          } catch (sessionError) {
            console.error("Error fetching session:", sessionError);
          }
        }

        // Set player information for participants
        if (location.state?.playerId) {
          setIsParticipant(true);

          if (location.state?.playerName) {
            setPlayerName(location.state.playerName);
          } else {
            try {
              const playerId = location.state.playerId;
              const playerResponse = await api.get(`/players/${playerId}`);
              setPlayerName(playerResponse.data.name);
            } catch (playerError) {
              console.error("Error fetching player:", playerError);
              setPlayerName("Guest Player");
            }
          }
        }
      } catch (error) {
        console.error("Error in useQuizSession:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizSession();
  }, [quizId, location?.state]);

  return {
    gamePin,
    sessionId,
    playerName,
    isHost,
    isParticipant,
    quizLive,
    setQuizLive,
    isLoading,
  };
};
