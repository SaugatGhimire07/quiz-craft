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

      // We have a sessionId, or we'll try to proceed without one
      const endpoint = `/quiz/${quizId}/session/start`;
      console.log("Using endpoint:", endpoint);

      // Make the API call with explicit startedAt field
      const startResponse = await api.post(endpoint, {
        startQuiz: true,
        setStartedAt: true,
      });
      console.log("Quiz start response:", startResponse.data);

      // Get the session ID from the response
      const currentSessionId = startResponse?.data?.sessionId || sessionId;

      if (!currentSessionId) {
        console.error("No session ID available after attempts");
        alert("Failed to start quiz: Session ID not available");
        return;
      }

      // Add debugging for socket
      console.log("Socket connected:", socket?.connected);
      console.log("Socket ID:", socket?.id);

      // Emit the socket event to start the quiz
      if (socket?.connected) {
        console.log("Emitting startQuiz event:", {
          pin: gamePin,
          quizId,
          sessionId: currentSessionId,
        });

        socket.emit(
          "startQuiz",
          {
            pin: gamePin,
            quizId,
            sessionId: currentSessionId,
          },
          (acknowledgement) => {
            console.log(
              "Server acknowledged startQuiz event:",
              acknowledgement
            );

            // If we get a successful acknowledgement but socket events still fail,
            // we can force redirect all participants programmatically from here
            if (acknowledgement.success) {
              // The server could return a list of participant socket IDs
              if (acknowledgement.participantIds) {
                // For each participant, send a direct message through the server instead
                acknowledgement.participantIds.forEach((participantId) => {
                  // Using emitEvent instead of socket.to since client can't send directly to other clients
                  socket.emit("sendDirectMessage", {
                    targetSocketId: participantId,
                    event: "directQuizStart",
                    data: {
                      pin: gamePin,
                      quizId,
                      sessionId: currentSessionId,
                    },
                  });
                });
              }
            }
          }
        );

        console.log("Quiz started for participants");

        // Update local state
        setQuizLive(true);

        // IMPORTANT: For host only - no fallback timer since host stays on this page
        // The fallback timer should only be triggered in the participant's browser
        // when the host starts the quiz
      } else {
        console.error("Socket not connected, can't emit startQuiz event");
        alert("Socket connection issue. Please refresh and try again.");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);

      if (error.response?.data?.message) {
        alert(`Failed to start the quiz: ${error.response.data.message}`);
      } else if (error.message) {
        alert(`Failed to start the quiz: ${error.message}`);
      } else {
        alert("Failed to start the quiz. Please try again.");
      }
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

      // Double-check with server that quiz is actually started (to prevent race conditions)
      try {
        const statusResponse = await api.get(`/quiz/${quizId}/status`);

        if (
          !statusResponse.data.quizStarted ||
          !statusResponse.data.startedAt
        ) {
          console.log(
            "Received quiz started event but server says quiz is not started yet. Ignoring."
          );
          return;
        }

        // Save received sessionId
        if (receivedSessionId) {
          localStorage.setItem(`quiz_session_${quizId}`, receivedSessionId);
        }

        // IMPORTANT: Only redirect participants, not hosts
        if (!isHost) {
          console.log("Participant redirecting to live quiz...");
          navigate(`/live/${quizId}`, {
            state: {
              ...location.state,
              gamePin: pin,
              fromWaitingRoom: true,
              quizLive: true,
              sessionId: receivedSessionId || sessionId,
            },
          });
        } else {
          console.log("Host updating UI to show quiz is live");
          setQuizLive(true);
        }
      } catch (error) {
        console.error("Error verifying quiz started status:", error);
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
          // Poll API to check if quiz is active
          const response = await api.get(`/quiz/${quizId}/status`);

          // IMPORTANT: Also check quizStarted flag, not just isLive
          if (response.data.isLive && response.data.quizStarted) {
            console.log(
              "Poll detected quiz is live and started, redirecting..."
            );
            navigate(`/live/${quizId}`, {
              state: {
                ...location.state,
                gamePin,
                fromWaitingRoom: true,
                quizLive: true,
                sessionId,
                fallback: true,
              },
            });
          }
        } catch (error) {
          console.error("Error polling quiz status:", error);
        }
      }, 2000); // Check every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [isHost, quizId, quizLive, navigate]);

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
