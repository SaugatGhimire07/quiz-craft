import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { customAlphabet } from "nanoid";
import api from "../api/axios";
import backgroundImage from "../assets/home/waiting-room-background.jpg";
import Logo from "../assets/logo/logo.png";
import "../styles/waiting-room.css";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const WaitingRoom = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [gamePin, setGamePin] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        const quiz = response.data;
        setGamePin(quiz.gamePin || nanoid()); // Generate a new game PIN if not already set
        setIsHost(true); // Assuming the user is the host if they navigate here
      } catch (error) {
        console.error("Error fetching quiz details:", error);
      }
    };

    fetchQuizDetails();
  }, [quizId]);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await api.get(`/players/${gamePin}`);
        setPlayers(response.data);
      } catch (error) {
        console.error("Error fetching players:", error);
      }
    };

    if (gamePin) {
      fetchPlayers();
      const interval = setInterval(fetchPlayers, 3000);
      return () => clearInterval(interval);
    }
  }, [gamePin]);

  useEffect(() => {
    const checkQuizStatus = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        const quiz = response.data;

        if (quiz.status === "draft") {
          alert("The quiz has ended.");
          navigate(location.state?.from || "/"); // Redirect to the previous page or home page
        }
      } catch (error) {
        console.error("Error checking quiz status:", error);
      }
    };

    const interval = setInterval(checkQuizStatus, 3000);
    return () => clearInterval(interval);
  }, [quizId, navigate, location.state]);

  const handleStartQuiz = () => {
    alert("Starting Quiz!");
    // Additional logic to start the quiz would go here
  };

  const handleEndQuiz = async () => {
    try {
      await api.post(`/quiz/${quizId}/end`);
      alert("Quiz ended and status updated to draft.");
      navigate(location.state?.from || "/"); // Redirect to the previous page or home page
    } catch (error) {
      console.error("Error ending quiz:", error);
      alert("Failed to end the quiz. Please try again.");
    }
  };

  const handleToggleLock = () => {
    setIsLocked(!isLocked);
  };

  return (
    <div className="waiting-room">
      {/* Top bar with game PIN */}
      <div className="pin-container">
        <div className="join-info">
          <div className="quiz-craft-logo"></div>
        </div>

        {!isLocked ? (
          <div className="game-pin">
            <h2>Game PIN:</h2>
            <h1 className="decorative-pin">{gamePin}</h1>
          </div>
        ) : (
          <div className="locked-message">
            <h2>This game is locked - No one else can join</h2>
          </div>
        )}
      </div>

      {/* Classroom content */}
      <div className="classroom">
        <div className="left-wall">
          <div className="door"></div>
          <div className="bulletin-board"></div>
        </div>

        <div className="projection-area">
          <div className="projection-screen">
            <div className="logo">Quiz Craft!</div>
            <div className="waiting-message">
              <span className="waiting-text">Waiting for players</span>
              <span className="dots">...</span>
            </div>

            {players.length > 0 && (
              <div className="player-list">
                {players.map((player) => (
                  <div key={player._id} className="player-name">
                    {player.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="right-wall">
          <div className="whiteboard"></div>
          <div className="apple"></div>
        </div>

        <div className="desks">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="desk">
              <div className="chair"></div>
              {index === 0 && <div className="laptop"></div>}
            </div>
          ))}
        </div>

        {/* Game controls (Start, End, and Lock buttons) */}
        {isHost && (
          <div className="game-controls">
            <button className="start-button" onClick={handleStartQuiz}>
              Start
            </button>
            <button className="end-button" onClick={handleEndQuiz}>
              End
            </button>
            <button
              className={`lock-button ${isLocked ? "locked" : "unlocked"}`}
              onClick={handleToggleLock}
              aria-label={isLocked ? "Unlock quiz" : "Lock quiz"}
            >
              <div className="lock-icon"></div>
            </button>
          </div>
        )}
      </div>

      <div className="control-bar">
        <div className="player-count">
          <i className="player-icon"></i>
          <span>{players.length}</span>
        </div>
        <div className="controls">
          <button className="mute-button"></button>
          <button className="settings-button"></button>
          <button className="fullscreen-button"></button>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;