import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

// Create socket instance
const socket = io("http://localhost:5001", {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

const JoinQuiz = () => {
  const [gamePin, setGamePin] = useState("");
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState("");
  const [showNameOverlay, setShowNameOverlay] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Socket connection handlers
    socket.on("connect", () => {
      console.log("Connected to quiz server");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Connection error. Please try again.");
    });

    socket.on("error", (error) => {
      setError(error.message);
    });

    socket.on("playerJoined", (data) => {
      console.log(`${data.playerName} joined the quiz`);
    });

    // Cleanup on unmount
    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("error");
      socket.off("playerJoined");
    };
  }, []);

  const handleJoinQuiz = async (playerName) => {
    try {
      const response = await api.post("/quiz/join", {
        pin: gamePin.trim(),
        playerName: playerName,
      });

      // Emit socket event to join room
      socket.emit("joinQuizRoom", {
        pin: gamePin.trim(),
        playerName: playerName,
      });

      navigate(`/waiting-room/${response.data.quizId}`, {
        state: {
          sessionId: response.data.sessionId,
          playerId: response.data.player.id,
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
    try {
      if (!gamePin.trim()) {
        setError("Game PIN is required!");
        return;
      }

      if (user) {
        // If user is logged in, join directly with their name
        await handleJoinQuiz(user.name);
      } else {
        // If not logged in, show name overlay
        setShowNameOverlay(true);
      }
    } catch (error) {
      setError("Failed to join quiz. Please try again.");
    }
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError("Please enter your name");
      return;
    }
    await handleJoinQuiz(guestName);
  };

  return (
    <>
      <div style={styles.container}>
        {error && <div style={styles.error}>{error}</div>}
        <input
          type="text"
          placeholder="Enter Game PIN"
          value={gamePin}
          onChange={(e) => setGamePin(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleJoin} style={styles.button} disabled={!gamePin}>
          Join
        </button>
      </div>

      {showNameOverlay && (
        <div style={styles.overlay}>
          <div style={styles.overlayContent}>
            <h3>Enter Your Name</h3>
            <form onSubmit={handleGuestSubmit}>
              <input
                type="text"
                placeholder="Your Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.button}>
                  Join Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setShowNameOverlay(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    borderRadius: "10px",
  },
  error: {
    color: "red",
  },
  input: {
    width: "150px",
    padding: "5px",
    borderRadius: "10px",
    fontSize: "15px",
  },
  button: {
    width: "70px",
    padding: "5px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  guestOptions: {
    display: "flex",
    flexDirection: "row",
  },
  altButton: {
    padding: "10px",
    margin: "0 5px",
    border: "none",
    borderRadius: "5px",
    backgroundColor: "#28a745",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  cancelButton: {
    width: "70px",
    padding: "5px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    cursor: "pointer",
  },
};

export default JoinQuiz;
