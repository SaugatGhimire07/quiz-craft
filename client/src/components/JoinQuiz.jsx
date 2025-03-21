import "../styles/joinQuiz.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const JoinQuiz = () => {
  // Get socket, isConnected and emitEvent from the context
  const { socket, isConnected, emitEvent } = useSocket();
  const [gamePin, setGamePin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshAuthToken } = useAuth(); // Get isAuthenticated flag

  useEffect(() => {
    // Only set up listeners if socket is available
    if (!socket) return;

    const handleConnect = () => {
      console.log("Connected to quiz server");
    };

    const handleConnectError = (error) => {
      console.error("Socket connection error:", error);
      setError("Connection error. Please try again.");
    };

    const handleError = (error) => {
      setError(error.message);
    };

    const handlePlayerJoined = (data) => {
      console.log(`${data.playerName} joined the quiz`);
    };

    // Add event listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("error", handleError);
    socket.on("playerJoined", handlePlayerJoined);

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
        socket.off("error", handleError);
        socket.off("playerJoined", handlePlayerJoined);
      }
    };
  }, [socket]); // Only re-run when socket changes

  // Add this effect to ensure auth state is current
  useEffect(() => {
    // Try to refresh auth state when component mounts
    refreshAuthToken?.();
  }, [refreshAuthToken]);

  const handleJoinQuiz = async (playerName) => {
    try {
      setSubmitting(true);

      // Check if user is logged in
      if (!user || !user._id) {
        console.log("No valid user found, redirecting to login");
        // Redirect to login with return URL
        navigate("/login", {
          state: {
            returnTo: "/join",
            gamePin: gamePin.trim(),
          },
        });
        return;
      }

      console.log(`Joining quiz as ${playerName} with user ID: ${user._id}`);

      // Make sure userId is a string in the expected format
      const userId = user._id.toString();

      const response = await api.post("/quiz/join", {
        pin: gamePin.trim(),
        playerName,
        userId: userId, // Ensure userId is passed correctly
      });

      if (response.data) {
        console.log("Successfully joined quiz:", response.data);

        // Then emit socket event if connected
        if (socket && isConnected) {
          emitEvent("joinQuizRoom", {
            pin: gamePin.trim(),
            playerName: playerName,
            playerId: response.data.player.id,
            isHost: false,
            userId: userId,
          });
        }

        // Navigate to waiting room
        navigate(`/waiting-room/${response.data.quizId}`, {
          state: {
            sessionId: response.data.sessionId,
            playerId: response.data.player.id,
            playerName: playerName,
            gamePin: gamePin.trim(),
            userId: userId,
          },
        });
      }
    } catch (error) {
      console.error("Failed to join quiz:", error);

      // Add more specific error message based on the error response
      let errorMessage =
        "Failed to join quiz. Please check the PIN and try again.";

      if (
        error.response?.data?.error ===
        "userId is required - all participants must be logged in"
      ) {
        errorMessage =
          "You must be logged in to join a quiz. Please log in and try again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    if (!gamePin.trim()) {
      setError("Please enter a game PIN");
      return;
    }

    setError(""); // Clear previous errors

    // More detailed logging
    console.log("Auth state check:", {
      userExists: !!user,
      userId: user?._id,
      isAuthenticated: isAuthenticated,
      authToken: !!localStorage.getItem("token"),
    });

    // More robust check that includes both user object and our derived isAuthenticated flag
    if (user?._id && isAuthenticated) {
      // Use optional chaining for safer access
      handleJoinQuiz(user.name || "Anonymous");
    } else {
      // Before redirecting, check if there's actually a token but we failed to parse the user
      const hasToken = !!localStorage.getItem("token");
      if (hasToken) {
        setError(
          "Session issue detected. Please refresh the page and try again."
        );
        // Could add an auto-refresh here
        return;
      }

      // Redirect to login if not authenticated
      navigate("/login", {
        state: {
          returnTo: "/join",
          gamePin: gamePin.trim(),
        },
      });
    }
  };

  return (
    <div className="join-quiz-container">
      {error && <div className="error-message">{error}</div>}

      <div className="pincode-input">
        <input
          type="text"
          placeholder="123456"
          value={gamePin}
          onChange={(e) => setGamePin(e.target.value)}
          className="game-pin-input"
        />
      </div>

      <button
        onClick={handleJoin}
        className={`pincode-button ${gamePin.trim() ? "active" : ""}`}
      >
        Join
      </button>
    </div>
  );
};

export default JoinQuiz;
