import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/waitingRoom.css";
import api from "../api/axios";

const WaitingRoom = () => {
  const { quizCode } = useParams();
  const { user, setUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quiz/${quizCode}`);
        if (response.status === 200) {
          setQuiz(response.data);
          setPlayers(response.data.waitingRoom);
        } else {
          alert("Quiz not found.");
        }
      } catch (error) {
        alert("Failed to fetch quiz.");
      }
    };

    fetchQuiz();
  }, [quizCode]);

  const handleStartQuiz = async () => {
    try {
      const response = await api.post(`/quiz/start`, { code: quizCode });
      if (response.status === 200) {
        navigate(`/play/${quizCode}`);
      } else {
        alert("Failed to start quiz.");
      }
    } catch (error) {
      alert("Failed to start quiz.");
    }
  };

  const handleLeaveRoom = async () => {
    try {
      const response = await api.post(`/quiz/leave`, { code: quizCode, userId: user._id });
      if (response.status === 200) {
        navigate("/");
      } else {
        alert("Failed to leave room.");
      }
    } catch (error) {
      alert("Failed to leave room.");
    }
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  return (
    <div className="waiting-room">
      <h1>Waiting Room for {quiz.title}</h1>
      <h2>Players:</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player.userName}</li>
        ))}
      </ul>
      {user && user._id === quiz.createdBy._id ? (
        <button onClick={handleStartQuiz}>Start Quiz</button>
      ) : (
        <button onClick={handleLeaveRoom}>Leave Room</button>
      )}
    </div>
  );
};

export default WaitingRoom;