import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/joinQuiz.css";
import api from "../api/axios";
import FormattedInput from "../components/FormattedInput";

const JoinQuiz = () => {
  const [quizCode, setQuizCode] = useState("");
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleJoinQuiz = async () => {
    try {
      let userName = user ? user.name : prompt("Enter your name:");
      if (!userName) {
        alert("Name is required to join the quiz.");
        return;
      }

      const response = await api.post("/quiz/join", { code: quizCode, userName });
      if (response.status === 200) {
        if (!user) {
          setUser({ name: userName, score: 0 });
        }
        navigate(`/waiting-room/${quizCode}`);
      } else {
        alert("Quiz not found.");
      }
    } catch (error) {
      alert("Failed to join quiz.");
    }
  };

  const handleCreateQuiz = () => {
    if (user) {
      navigate("/create-quiz");
    } else {
      navigate("/login", { state: { from: "/create-quiz" } });
    }
  };

  return (
    <div className="join-quiz">
      <h1>Join Quiz</h1>
      <FormattedInput value={quizCode} setValue={setQuizCode} placeholder="Enter Quiz Code" />
      <button onClick={handleJoinQuiz}>Join Quiz</button>
      <button onClick={handleCreateQuiz}>Create Quiz</button>
    </div>
  );
};

export default JoinQuiz;
