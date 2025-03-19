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
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [showNameOverlay, setShowNameOverlay] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const handleJoinQuiz = async (playerName) => {
    try {
      // First join via the API
      const response = await api.post("/quiz/join", {
        pin: gamePin.trim(),
        playerName: playerName,
        userId: user?._id,
      });

      // Then emit socket event if connected
      if (socket && isConnected) {
        emitEvent("joinQuizRoom", {
          pin: gamePin.trim(),
          playerName: playerName,
          playerId: response.data.player.id,
          isHost: false,
          userId: user?._id,
        });
      } else {
        console.warn(
          "Socket not connected - will rely only on API for joining"
        );
      }

      // Navigate to waiting room
      navigate(`/waiting-room/${response.data.quizId}`, {
        state: {
          sessionId: response.data.sessionId,
          playerId: response.data.player.id,
          playerName: playerName,
          gamePin: gamePin.trim(),
        },
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to join quiz. Please check the PIN and try again."
      );
    }
  };

  const handleJoin = async () => {
    if (!gamePin.trim()) {
      setError("Please enter a game PIN");
      return;
    }

    setError(""); // Clear previous errors

    if (user) {
      // For logged-in users, use their profile name
      handleJoinQuiz(user.name);
    } else {
      // For guests, show the name overlay
      setShowNameOverlay(true);
    }
  };

  const handleGuestJoin = () => {
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }
    handleJoinQuiz(guestName);
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

      {showNameOverlay && (
        <div className="name-overlay">
          <div className="name-container">
            <h3>Enter Your Name</h3>
            <input
              type="text"
              placeholder="Your Name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="name-input"
            />
            <div className="button-group">
              <button
                onClick={() => setShowNameOverlay(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button onClick={handleGuestJoin} className="join-button">
                Join
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinQuiz;
