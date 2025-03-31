import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import BackgroundTheme from "../components/BackgroundTheme";
import "../styles/quizResultsDetail.css";

const QuizResultsDetail = () => {
  const { quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get these values from location state
  const sessionId = location.state?.sessionId;
  const playerId = location.state?.playerId; // New: for host viewing participant results
  const isHost = location.state?.isHost; // New: flag to indicate if host is viewing

  useEffect(() => {
    if (!sessionId) {
      navigate("/reports");
      return;
    }

    const fetchResults = async () => {
      try {
        let url = `/quiz/${quizId}/user-results`;
        const params = { sessionId };

        // If host is viewing a specific participant's results
        if (isHost && playerId) {
          params.playerId = playerId;
        }

        const response = await api.get(url, { params });
        setResults(response.data);
      } catch (error) {
        console.error("Error fetching quiz results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId, sessionId, navigate, playerId, isHost]);

  const handleBackToReports = () => {
    // If host is viewing participant's results, return to session results page
    if (isHost) {
      navigate(`/session-results/${sessionId}`);
    } else {
      navigate("/reports");
    }
  };

  // Format time (from seconds to mm:ss format)
  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (!results) {
    return <div className="error">Failed to load quiz results</div>;
  }

  return (
    <div>
      <BackgroundTheme />

      <div className="quiz-results-detail-container">
        <div className="quiz-results-card">
          <button className="back-button" onClick={handleBackToReports}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {isHost ? "Back to Session Results" : "Back to Reports"}
          </button>

          <div className="quiz-results-header">
            <h1>{results.quizTitle}</h1>
            {isHost && results.playerName && (
              <h2 className="participant-name">
                Participant: {results.playerName}
              </h2>
            )}

            <div className="results-summary-grid">
              <div className="summary-item">
                <span className="summary-label">Score:</span>
                <span className="summary-value">{results.percentage}%</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Correct Answers:</span>
                <span className="summary-value">
                  {results.correctAnswers}/{results.totalQuestions}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Quiz Type:</span>
                <span className="summary-value">
                  {results.sessionType === "self-paced" ? "Self-Paced" : "Live"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Date:</span>
                <span className="summary-value">
                  {new Date(results.participatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Time Taken:</span>
                <span className="summary-value">
                  {formatTime(results.timeTaken)}
                </span>
              </div>
              {results.rank && (
                <div className="summary-item">
                  <span className="summary-label">Rank:</span>
                  <span className="summary-value rank-highlight">
                    {results.rank}/{results.totalParticipants || "?"}
                  </span>
                </div>
              )}
            </div>

            <div className="performance-bar">
              <div
                className="performance-fill"
                style={{ width: `${results.percentage}%` }}
              ></div>
            </div>
          </div>

          <div className="questions-list">
            <h2 className="questions-heading">Question Review</h2>

            {results.questions.map((question, index) => (
              <div
                key={question.questionId}
                className={`question-card ${
                  question.isCorrect ? "correct" : "incorrect"
                }`}
              >
                <div className="question-header">
                  <span className="question-number">Question {index + 1}</span>
                  <span
                    className={`question-status ${
                      question.isCorrect ? "correct" : "incorrect"
                    }`}
                  >
                    {question.isCorrect ? "Correct" : "Incorrect"}
                    {question.timeTaken && (
                      <span className="question-time">
                        ({formatTime(question.timeTaken)})
                      </span>
                    )}
                  </span>
                </div>

                <p className="question-text">{question.questionText}</p>

                {question.image && (
                  <div className="question-image">
                    <img src={question.image} alt="Question" />
                  </div>
                )}

                <div className="options-container">
                  {question.options.map((option, i) => (
                    <div
                      key={i}
                      className={`option ${
                        option === question.userAnswer &&
                        option === question.correctAnswer
                          ? "correct-answer"
                          : option === question.userAnswer
                          ? "wrong-answer"
                          : option === question.correctAnswer
                          ? "correct-option"
                          : ""
                      }`}
                    >
                      <span className="option-text">{option}</span>
                      {option === question.userAnswer &&
                        option === question.correctAnswer && (
                          <span className="option-icon correct">✓</span>
                        )}
                      {option === question.userAnswer &&
                        option !== question.correctAnswer && (
                          <span className="option-icon incorrect">✗</span>
                        )}
                      {option !== question.userAnswer &&
                        option === question.correctAnswer && (
                          <span className="option-icon correct">✓</span>
                        )}
                    </div>
                  ))}
                </div>

                {question.score > 0 && (
                  <div className="question-score">
                    <span>Points earned: {question.score}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultsDetail;
