import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { generateAvatar } from "../utils/avatarGenerator";
import { getOrCreateAvatar } from "../utils/avatarManager";
import api from "../api/axios";
import Logo from "../assets/logo/logo-only.png";
import "../styles/waiting-room.css";
import { useAuth } from "../hooks/useAuth";
import ParticipantsList from "../components/ParticipantsList";
import { useQuizSession } from "../hooks/useQuizSession";
import { useParticipants } from "../hooks/useParticipants";
import BackgroundTheme from "../components/BackgroundTheme";

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
  const [quizLive, setQuizLive] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  // Add this to the beginning of the component
  useEffect(() => {
    // Clear any fallback timer from previous sessions
    if (window.quizFallbackTimer) {
      clearTimeout(window.quizFallbackTimer);
      window.quizFallbackTimer = null;
    }

    // Reset the fallback trigger flag
    setFallbackTriggered(false);

    // Clear any previous "quiz is live" state if we're not coming from a live quiz
    if (!location.state?.fromLiveQuiz) {
      setQuizLive(false);
    }

    // Clean up function
    return () => {
      if (window.quizFallbackTimer) {
        clearTimeout(window.quizFallbackTimer);
        window.quizFallbackTimer = null;
      }
    };
  }, [quizId]);

  const handleStartQuiz = async () => {
    try {
      console.log("Starting quiz with sessionId:", sessionId);

      // Start the quiz via API first
      const startResponse = await api.post(`/quiz/${quizId}/session/start`, {
        startQuiz: true,
        setStartedAt: true,
      });

      console.log("Quiz start response:", startResponse.data);
      const currentSessionId = startResponse?.data?.sessionId || sessionId;

      if (!currentSessionId) {
        throw new Error("No session ID available");
      }

      // If socket is not connected, try to reconnect
      if (!socket?.connected) {
        console.log("Socket not connected, attempting to reconnect...");
        socket?.connect();

        // Wait for connection
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Socket connection timeout")),
            5000
          );

          socket.once("connect", () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      // Now emit the socket event
      if (socket?.connected) {
        console.log("Emitting startQuiz event");
        socket.emit("startQuiz", {
          pin: gamePin,
          quizId,
          sessionId: currentSessionId,
        });

        setQuizLive(true);
      } else {
        throw new Error("Socket connection failed");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert(error.message || "Failed to start quiz. Please try again.");
    }
  };

  const handleEndQuiz = async () => {
    try {
      // Add logging to debug the request
      console.log("Ending quiz:", {
        quizId,
        sessionId,
        hostname: window.location.hostname,
      });

      // End the quiz and close the session
      const response = await api.post(`/quiz/${quizId}/end`, {
        sessionId: sessionId,
        closeSession: true,
      });

      console.log("End quiz response:", response);

      // Clean up only if the request was successful
      if (response.status === 200) {
        // Clean up avatar data
        Object.keys(sessionStorage).forEach((key) => {
          if (key.includes(`avatar_${quizId}`)) {
            sessionStorage.removeItem(key);
          }
        });

        // Notify participants if socket is connected
        if (socket?.connected) {
          socket.emit("endQuiz", {
            pin: gamePin,
            quizId,
            sessionId,
          });
        }

        // Disconnect socket
        if (socket) {
          socket.disconnect();
        }

        // Clear local storage
        localStorage.removeItem(`quiz_session_${quizId}`);

        // Navigate back to dashboard
        navigate("/dashboard", {
          replace: true, // Use replace to prevent going back to the quiz
        });
      }
    } catch (error) {
      console.error("Error ending quiz:", error);

      // More specific error handling
      if (error.response?.status === 404) {
        alert("Quiz not found. Returning to dashboard...");
        navigate("/dashboard", { replace: true });
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to end the quiz. Please try again.";
        alert(errorMessage);
      }
    }
  };

  const handleLeaveQuiz = async () => {
    try {
      if (!isHost && location.state?.playerId) {
        // First emit socket event before disconnecting
        if (socket?.connected) {
          socket.emit("leaveQuizRoom", {
            pin: gamePin,
            playerId: location.state.playerId,
          });
        }

        // Update database
        try {
          await api.post(`/players/${location.state.playerId}/leave`);
        } catch (error) {
          console.error("Error updating player status:", error);
        }

        // Clean up storage
        const participantKey = `avatar_${location.state.playerId}_${quizId}`;
        sessionStorage.removeItem(participantKey);
        sessionStorage.removeItem(`quiz_session_${quizId}`);

        // Update local state
        setPlayers((prevPlayers) =>
          prevPlayers.filter((player) => player._id !== location.state.playerId)
        );
        setPlayerCount((prevCount) => Math.max(0, prevCount - 1));

        // Disconnect socket last
        if (socket?.connected) {
          socket.disconnect();
        }

        // Navigate after all cleanup is done
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Error leaving quiz:", error);
      navigate("/", { replace: true });
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

  useEffect(() => {
    if (!socket) {
      console.error("Socket not available in WaitingRoom");
      return;
    }

    console.log(
      `Setting up quiz started listener in WaitingRoom for ${
        isHost ? "host" : "participant"
      }`
    );
    console.log("Socket ID:", socket.id);
    console.log("Socket connected:", socket.connected);

    // Listen for quizStarted or directQuizStart events
    const handleQuizStarted = async ({
      pin,
      quizId: startedQuizId,
      sessionId: receivedSessionId,
      directMessage,
    }) => {
      console.log("Quiz started event received in WaitingRoom:", {
        pin,
        startedQuizId,
        sessionId: receivedSessionId,
        directMessage,
        isHost,
      });

      try {
        // Verify quiz status
        const statusResponse = await api.get(`/quiz/${quizId}/status`);
        const isQuizActive =
          statusResponse.data.quizStarted &&
          statusResponse.data.startedAt &&
          statusResponse.data.sessionActive;

        if (!isQuizActive) {
          console.log("Quiz not fully started yet, waiting...");
          return;
        }

        // Save session ID for both guest and logged-in users
        if (receivedSessionId) {
          localStorage.setItem(`quiz_session_${quizId}`, receivedSessionId);
        }

        // Don't redirect if user is host
        if (isHost) {
          console.log("Host updating UI to show quiz is live");
          setQuizLive(true);
          return;
        }

        // For both guests and logged-in participants
        if (location.state?.playerId) {
          console.log("Participant redirecting to live quiz...");
          navigate(`/live/${quizId}`, {
            state: {
              ...location.state,
              gamePin: pin,
              fromWaitingRoom: true,
              quizLive: true,
              sessionId: receivedSessionId || sessionId,
              isGuest: !user, // Add flag to identify guest users
            },
            replace: true, // Use replace to prevent going back
          });
        } else {
          console.error("No player ID found in location state");
          // Fallback to waiting room with error
          setError("Failed to join quiz. Please try rejoining.");
        }
      } catch (error) {
        console.error("Error handling quiz start:", error);
      }
    };

    // Listen for both regular and direct messages
    socket.on("quizStarted", handleQuizStarted);
    socket.on("directQuizStart", handleQuizStarted);

    return () => {
      socket.off("quizStarted", handleQuizStarted);
      socket.off("directQuizStart", handleQuizStarted);
    };
  }, [socket, quizId, isHost, navigate, location, sessionId]);

  useEffect(() => {
    if (!socket) return;

    const handleError = (error) => {
      console.error("Socket error:", error);

      if (error.message === "Unauthorized to join as host") {
        alert(
          "You're not authorized to join this quiz as host. Please check your login status."
        );
        navigate("/");
      }
    };

    socket.on("error", handleError);

    return () => {
      socket.off("error", handleError);
    };
  }, [socket, navigate]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    // Cleanup function for the fallback timer
    return () => {
      if (window.quizFallbackTimer) {
        clearTimeout(window.quizFallbackTimer);
        window.quizFallbackTimer = null;
      }
    };
  }, []);

  // Add this in useEffect for participants
  useEffect(() => {
    if (!isHost && socket?.connected) {
      console.log(`Participant verifying room membership for pin: ${gamePin}`);
      socket.emit(
        "verifyRoomMembership",
        {
          pin: gamePin,
          playerId: location.state?.playerId,
        },
        (response) => {
          console.log("Room membership verified:", response);
        }
      );
    }
  }, [socket, isHost, gamePin]);

  // Add to WaitingRoom component
  useEffect(() => {
    if (!isHost && !quizLive) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await api.get(`/quiz/${quizId}/status`);

          // Check if quiz is active
          const isQuizActive =
            response.data.isLive &&
            response.data.quizStarted &&
            response.data.sessionActive &&
            response.data.startedAt;

          if (isQuizActive && location.state?.playerId) {
            console.log(
              "Poll detected quiz is started, redirecting participant..."
            );
            navigate(`/live/${quizId}`, {
              state: {
                ...location.state,
                gamePin,
                fromWaitingRoom: true,
                quizLive: true,
                sessionId,
                isGuest: !user,
                fallback: true,
              },
              replace: true,
            });
          }
        } catch (error) {
          console.error("Error polling quiz status:", error);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [
    isHost,
    quizId,
    quizLive,
    navigate,
    gamePin,
    location.state,
    sessionId,
    user,
  ]);

  return (
    <div className="waiting-room">
      <BackgroundTheme />

      {location.state?.unauthorized && !quizLive && (
        <div className="unauthorized-banner">
          <span>Please wait for the host to start the quiz</span>
        </div>
      )}

      {quizLive && isHost && (
        <div className="quiz-live-banner">
          <span>Quiz is currently live for participants</span>
        </div>
      )}

      <div className="pin-container">
        {gamePin ? (
          <div className="game-pin">
            <div className="join-instructions">
              Join at quizcraft.com | Use code{" "}
              <span className="pin-highlight">{gamePin}</span>
            </div>
          </div>
        ) : (
          <div className="game-pin">
            <div className="join-instructions">Loading quiz code...</div>
          </div>
        )}
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
              disabled={players.length === 0 || quizLive}
            >
              {quizLive ? "Quiz In Progress" : "Start Quiz"}
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
