import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import LogoOnly from "../assets/logo/logo-only.png";
import BackgroundTheme from "../components/BackgroundTheme";
import api from "../api/axios";
import "../styles/liveQuiz.css";

const LiveQuiz = () => {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        setQuestions(response.data.questions);
        setTimer(response.data.questions[0].timer); // Set initial timer
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    setSelectedOption(null); // Reset selected option when question changes
    setIsCorrect(null); // Reset correctness state when question changes
    if (questions.length > 0) {
      setTimer(questions[selectedQuestionIndex].timer); // Reset timer for new question
    }
  }, [selectedQuestionIndex, questions]);

  useEffect(() => {
    if (timer > 0) {
      const timerId = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      handleNextQuestion();
    }
  }, [timer]);

  const handleNextQuestion = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    } else {
      alert("Quiz completed!");
    }
  };

  const handlePreviousQuestion = () => {
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionIndex(selectedQuestionIndex - 1);
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setIsCorrect(option === currentQuestion.correctOption);

    // Move to the next question after a short delay
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  };

  const currentQuestion = questions[selectedQuestionIndex];

  return (
    <div>
      <BackgroundTheme />
      <div className="timer-container">
        <p className="timer-text">Time left: {timer} seconds</p>
      </div>
      <div className="live-quiz-container">
        <div className="live-quiz-main-content">
          <div className="live-quiz-main-header">
            <img
              src={LogoOnly}
              alt="Quiz Craft Logo"
              className="live-quiz-logo"
            />
          </div>
          {currentQuestion && (
            <div className="live-quiz-question-group">
              <p className="live-quiz-question-text">
                {currentQuestion.questionText}
              </p>

              {currentQuestion.image && (
                <div className="live-quiz-question-image">
                  <img src={currentQuestion.image} alt="Question" />
                </div>
              )}
            </div>
          )}

          <div className="live-quiz-content-spacer"></div>

          {currentQuestion && currentQuestion.type === "multiple-choice" ? (
            <div className="live-quiz-options-container multiple-choice">
              <div className="live-quiz-options-grid">
                {currentQuestion.options.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className={`live-quiz-option-row ${
                      selectedOption === option
                        ? isCorrect
                          ? "correct"
                          : "incorrect"
                        : ""
                    }`}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="live-quiz-option-input-wrapper">
                      <input
                        type="text"
                        value={option}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="live-quiz-option-input"
                        readOnly
                      />
                      {option && (
                        <div
                          className={`live-quiz-option-radio ${
                            selectedOption === option ? "selected" : ""
                          }`}
                        >
                          <div className="live-quiz-radio-inner"></div>
                        </div>
                      )}
                      {selectedOption === option && (
                        <div className="live-quiz-option-icon">
                          {isCorrect ? (
                            <span className="correct-icon">✔</span>
                          ) : (
                            <span className="incorrect-icon">✘</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            currentQuestion && (
              <div className="live-quiz-options-container true-false">
                <div
                  className={`live-quiz-option-row ${
                    selectedOption === "True"
                      ? isCorrect
                        ? "correct"
                        : "incorrect"
                      : ""
                  }`}
                  onClick={() => handleOptionSelect("True")}
                >
                  <div className="live-quiz-option-input-wrapper">
                    <input
                      type="text"
                      value="True"
                      readOnly
                      className="live-quiz-option-input true-option"
                    />
                    <div
                      className={`live-quiz-option-radio ${
                        selectedOption === "True" ? "selected" : ""
                      }`}
                    >
                      <div className="live-quiz-radio-inner"></div>
                    </div>
                    {selectedOption === "True" && (
                      <div className="live-quiz-option-icon">
                        {isCorrect ? (
                          <span className="correct-icon">✔</span>
                        ) : (
                          <span className="incorrect-icon">✘</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className={`live-quiz-option-row ${
                    selectedOption === "False"
                      ? isCorrect
                        ? "correct"
                        : "incorrect"
                      : ""
                  }`}
                  onClick={() => handleOptionSelect("False")}
                >
                  <div className="live-quiz-option-input-wrapper">
                    <input
                      type="text"
                      value="False"
                      readOnly
                      className="live-quiz-option-input false-option"
                    />
                    <div
                      className={`live-quiz-option-radio ${
                        selectedOption === "False" ? "selected" : ""
                      }`}
                    >
                      <div className="live-quiz-radio-inner"></div>
                    </div>
                    {selectedOption === "False" && (
                      <div className="live-quiz-option-icon">
                        {isCorrect ? (
                          <span className="correct-icon">✔</span>
                        ) : (
                          <span className="incorrect-icon">✘</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          <div className="live-quiz-navigation-buttons">
            <button
              onClick={handlePreviousQuestion}
              disabled={selectedQuestionIndex === 0}
            >
              Previous
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={selectedQuestionIndex === questions.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

LiveQuiz.propTypes = {
  questions: PropTypes.array.isRequired,
  selectedQuestionIndex: PropTypes.number.isRequired,
  handleQuestionChange: PropTypes.func.isRequired,
  handleImageClick: PropTypes.func.isRequired,
  handleImageChange: PropTypes.func.isRequired,
  handleDragOver: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  removeImage: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
};

export default LiveQuiz;
