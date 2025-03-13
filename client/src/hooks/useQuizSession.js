import { useState, useEffect } from "react";
import api from "../api/axios";

export const useQuizSession = (quizId, location) => {
  const [gamePin, setGamePin] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    const fetchQuizSession = async () => {
      try {
        const isHost = !location.state?.playerId;
        setIsHost(isHost);

        const response = await api.get(`/quiz/${quizId}/session`);
        const session = response.data;

        setGamePin(session.pin);
        setSessionId(session.sessionId);

        if (location.state?.playerId) {
          setIsParticipant(true);
          const playerId = location.state.playerId;
          const playerResponse = await api.get(`/players/${playerId}`);
          setPlayerName(playerResponse.data.name);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchQuizSession();
  }, [quizId, location.state]);

  return {
    gamePin,
    sessionId,
    playerName,
    isHost,
    isParticipant,
  };
};
