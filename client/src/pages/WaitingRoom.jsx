import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { generateAvatar } from "../utils/avatarGenerator";
import { getOrCreateAvatar } from "../utils/avatarManager";
import api from "../api/axios";
import Logo from "../assets/logo/logo-only.png";
import HeaderLeft from "../assets/waiting-room/header_left.png";
import HeaderRight from "../assets/waiting-room/header_right.png";
import "../styles/waiting-room.css";
import { useAuth } from "../hooks/useAuth";
import ParticipantsList from "../components/ParticipantsList";
import { useQuizSession } from "../hooks/useQuizSession";
import { useParticipants } from "../hooks/useParticipants";

const WaitingRoom = () => {
  const { user } = useAuth();
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { gamePin, sessionId, playerName, isHost, isParticipant } =
    useQuizSession(quizId, location);

  const { players, playerCount, socket, setPlayers, setPlayerCount } =
    useParticipants(
      gamePin,
      quizId,
      isHost,
      playerName,
      location,
      user,
      navigate
    );

  const [currentUserId] = useState(user?._id || null);

  const handleStartQuiz = async () => {
    try {
      await api.post(`/quiz/${quizId}/session/start`);
      // Emit socket event to start quiz
      socket.emit("startQuiz", { pin: gamePin });
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Failed to start the quiz. Please try again.");
    }
  };

  const handleEndQuiz = async () => {
    try {
      await api.post(`/quiz/${quizId}/end`);
      // Clear avatar data for this quiz
      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes(`avatar_${quizId}`)) {
          sessionStorage.removeItem(key);
        }
      });
      alert("Quiz ended and status updated to draft.");
      navigate(location.state?.from || "/");
    } catch (error) {
      console.error("Error ending quiz:", error);
      alert("Failed to end the quiz. Please try again.");
    }
  };

  const handleLeaveQuiz = async () => {
    try {
      if (!isHost && location.state?.playerId) {
        // Clean up avatar data for this participant
        const participantKey = `avatar_${location.state.playerId}_${quizId}`;
        sessionStorage.removeItem(participantKey);

        // Emit socket event to notify others
        socket.emit("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state.playerId,
        });

        // Update player status in database
        await api.post(`/players/${location.state.playerId}/leave`);

        // Disconnect socket
        socket.disconnect();

        // Navigate back to home
        navigate("/");
      }
    } catch (error) {
      console.error("Error leaving quiz:", error);
      // Still try to navigate away even if there's an error
      navigate("/");
    }
  };

  const renderParticipants = () => {
    if (!Array.isArray(players) || players.length === 0) {
      return (
        <p className="no-participants">
          Share the game PIN with others to join!
        </p>
      );
    }

    return (
      <div className="participant-grid">
        {players.map((player) => {
          const isCurrentPlayer =
            !isHost &&
            (location.state?.playerId === player._id ||
              (user && user._id === player.userId));

          const avatarSeed = getOrCreateAvatar(player._id, quizId);

          return (
            <div
              key={player._id}
              className={`participant-card ${
                isCurrentPlayer ? "current-player" : ""
              }`}
            >
              <img
                src={generateAvatar(avatarSeed)}
                alt={`${isCurrentPlayer ? "Your" : `${player.name}'s`} avatar`}
                className="participant-avatar"
                width="64"
                height="64"
                loading="lazy"
              />
              <span className="participant-name">{player.name}</span>
              {isCurrentPlayer && <span className="you-badge">You</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="waiting-room">
      <div className="background-theme">
        <img src={HeaderLeft} alt="" className="bg-img-left" />
        <img src={HeaderRight} alt="" className="bg-img-right" />
      </div>

      <div className="pin-container">
        <div className="game-pin">
          <div className="join-instructions">
            Join at quizcraft.com | Use code{" "}
            <span className="pin-highlight">{gamePin}</span>
          </div>
        </div>
      </div>

      <div className="projection-area">
        <div className="projection-screen">
          <img src={Logo} alt="Quiz Craft Logo" className="quiz-craft-logo" />
          <h1 className="waiting-logo">
            <em>Quiz Craft!</em>
          </h1>
        </div>

        <ParticipantsList
          players={players}
          isHost={isHost}
          currentUserId={currentUserId}
          currentPlayerId={location.state?.playerId}
          user={user}
        />
      </div>

      <div className="game-controls">
        {isHost ? (
          <>
            <button
              className="start-button"
              onClick={handleStartQuiz}
              disabled={players.length === 0}
            >
              Start Quiz
            </button>
            <button className="end-button" onClick={handleEndQuiz}>
              Back to Dashboard
            </button>
          </>
        ) : (
          <button className="leave-button" onClick={handleLeaveQuiz}>
            Leave Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
