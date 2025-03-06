import React, { useState, useEffect } from "react";
import backgroundImage from "../assets/home/waiting-room-background.jpg";
import Logo from "../assets/logo/logo.png";
import "../styles/waiting-room.css";

const WaitingRoom = () => {
  const [gamePin, setGamePin] = useState("910 5829");
  const [isLocked, setIsLocked] = useState(false);
  const [players, setPlayers] = useState([]);

  const playerNames = [
    "Alex",
    "Taylor",
    "Jordan",
    "Casey",
    "Riley",
    "Morgan",
    "Quinn",
    "Avery",
    "Reese",
    "Dakota",
  ];

  useEffect(() => {
    // Simulate players joining (for demo purposes)
    if (players.length < 8 && !isLocked) {
      const interval = setInterval(() => {
        const randomName =
          playerNames[Math.floor(Math.random() * playerNames.length)];
        if (!players.some((player) => player.name === randomName)) {
          setPlayers((prev) => [
            ...prev,
            {
              id: Date.now(),
              name: randomName,
            },
          ]);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [players, isLocked]);

  const handleStartQuiz = () => {
    alert("Starting Quiz!");
    // Additional logic to start the quiz would go here
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

        <div className="qr-code"></div>
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
                  <div key={player.id} className="player-name">
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

        {/* Game controls (Start and Lock buttons) */}
        <div className="game-controls">
          <button className="start-button" onClick={handleStartQuiz}>
            Start
          </button>
          <button
            className={`lock-button ${isLocked ? "locked" : "unlocked"}`}
            onClick={handleToggleLock}
            aria-label={isLocked ? "Unlock quiz" : "Lock quiz"}
          >
            <div className="lock-icon"></div>
          </button>
        </div>
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
