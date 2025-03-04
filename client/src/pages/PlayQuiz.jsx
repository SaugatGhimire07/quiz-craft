import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/playQuiz.css";
import api from "../api/axios";

const PlayQuiz = () => {
  const { quizCode } = useParams();
  const { user, setUser } = useContext(AuthContext);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const navigate = useNavigate();

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

  const handleNextQuestion = async () => {
    if (selectedOption === quiz.questions[currentQuestionIndex].correctOption) {
      setUser({ ...user, score: user.score + 1 });
    }

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption("");
    } else {
      try {
        await api.post('/quiz/update-score', { code: quizCode, userName: user.name, score: user.score });
        navigate(`/quiz-result/${quizCode}`);
      } catch (error) {
        alert("Failed to update score.");
      }
    }
  };

  if (!quiz) {
    return <div>Loading...</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <div className="play-quiz">
      {!isQuizStarted ? (
        <div className="waiting-room">
          <h1>Waiting Room for {quiz.title}</h1>
          <h2>Players:</h2>
          <ul>
            {quiz.userScores.map((player, index) => (
              <li key={index}>{player.userName}</li>
            ))}
          </ul>
          {user && user._id === quiz.createdBy._id && (
            <button onClick={() => setIsQuizStarted(true)}>Start Quiz</button>
          )}
        </div>
      ) : (
        <div className="question">
          <h1>{quiz.title}</h1>
          <h2>{currentQuestion.questionText}</h2>
          {currentQuestion.image && (
            <img src={currentQuestion.image} alt="Question" />
          )}
          <div className="options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option ${selectedOption === option ? "selected" : ""}`}
                onClick={() => setSelectedOption(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <button onClick={handleNextQuestion}>Next</button>
        </div>
      )}
    </div>
  );
};

export default PlayQuiz;