import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const JoinQuiz = () => {
  const [gamePin, setGamePin] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!gamePin.trim() || (!user && !playerName.trim())) {
      setError("Game PIN and Player Name are required!");
      return;
    }

    try {
      // Fetch quiz details using gamePin
      const quizResponse = await api.get(`/quiz/gamepin/${gamePin}`);
      const quiz = quizResponse.data;

      // Check if the quiz is live
      if (quiz.status !== "live") {
        setError("The quiz is not live. Please check the Game PIN and try again.");
        return;
      }

      const playerData = user ? { gamePin, playerName: user.name } : { gamePin, playerName };
      const response = await api.post("/players/join", playerData);
      const player = response.data;
      navigate(`/waiting-room/${quiz._id}`);
    } catch (error) {
      console.error("Error joining quiz:", error);
      setError("Failed to join the quiz. Please check the Game PIN and try again.");
    }
  };

  const handleLogin = () => navigate("/login");

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}
      <input
        type="text"
        placeholder="Enter Game PIN"
        value={gamePin}
        onChange={(e) => setGamePin(e.target.value)}
        style={styles.input}
      />
      {(!user || showGuestOptions) && (
        <input
          type="text"
          placeholder="Enter Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={styles.input}
        />
      )}
      <button onClick={handleJoin} style={styles.button} disabled={!gamePin || (!user && !playerName)}>
        Join
      </button>
      {!user && !showGuestOptions && (
        <div style={styles.guestOptions}>
          <button onClick={handleLogin} style={styles.altButton}>Log In</button>
          <button onClick={() => setShowGuestOptions(true)} style={styles.altButton}>Play as Guest</button>
        </div>
      )}
    </div>
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
};

export default JoinQuiz;
