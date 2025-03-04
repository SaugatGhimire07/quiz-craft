import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/quizResult.css";
import api from "../api/axios";

const QuizResult = () => {
  const { quizCode } = useParams();
  const { user } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quiz/${quizCode}`);
        if (response.status === 200) {
          setQuiz(response.data);
        } else {
          alert("Quiz not found.");
        }
      } catch (error) {
        alert("Failed to fetch quiz.");
      }
    };

    fetchQuiz();
  }, [quizCode]);

  if (!quiz) {
    return <div>Loading...</div>;
  }

  const userScore = quiz.userScores.find((score) => score.userName === user.name);
  const sortedScores = [...quiz.userScores].sort((a, b) => b.score - a.score);

  return (
    <div className="quiz-result">
      <h1>Quiz Result for {quiz.title}</h1>
      <h2>Your Score: {userScore.score}</h2>
      <h3>Leaderboard</h3>
      <ul>
        {sortedScores.map((score, index) => (
          <li key={index}>
            {index + 1}. {score.userName} - {score.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuizResult;