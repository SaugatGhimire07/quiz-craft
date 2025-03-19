import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import LogoOnly from "../assets/logo/logo-only.png";
import BackgroundTheme from "../components/BackgroundTheme";
import api from "../api/axios";
import "../styles/liveQuiz.css";

const LiveQuiz = () => {
  const { quizId } = useParams();
  const { socket, isConnected, emitEvent } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if coming from waiting room with a valid state
    const fromWaitingRoom = location.state?.fromWaitingRoom;

    // If not coming from waiting room, could be direct URL access
    if (!fromWaitingRoom) {
      console.log(
        "Direct access to LiveQuiz detected - verifying authorization"
      );
      // The checkIfHost function will verify and redirect if needed
    }

    const checkIfHost = async () => {
      try {
        setIsLoading(true);
        let retryCount = 0;
        const maxRetries = 3;

        // First check if the quiz is actually live/active
        try {
          const statusResponse = await api.get(`/quiz/${quizId}/status`);

          // More strict check - specifically look for startedAt as the definitive indicator
          if (
            !statusResponse.data.isLive ||
            !statusResponse.data.sessionActive ||
            !statusResponse.data.quizStarted ||
            !statusResponse.data.startedAt // Add this check - only allow if officially started
          ) {
            console.log(
              "Quiz is not active yet. Redirecting to waiting room..."
            );
            navigate(`/waiting-room/${quizId}`, {
              state: {
                ...location.state,
                quizLive: false,
                unauthorized: true,
              },
            });
            return;
          }
        } catch (error) {
          console.error("Error checking quiz status:", error);
          // On error, redirect to waiting room as fallback
          navigate(`/waiting-room/${quizId}`, {
            state: {
              ...location.state,
              error: "Failed to verify quiz status",
            },
          });
          return;
        }

        // Skip trying to use the host-only endpoint if we already know the user is a participant
        if (user && !location.state?.playerId) {
          try {
            // Try the authenticated endpoint first (for hosts)
            const response = await api.get(`/quiz/${quizId}`);

            // If successful and user is quiz creator, redirect to waiting room
            if (response.data.createdBy === user._id) {
              navigate(`/waiting-room/${quizId}`, {
                state: {
                  isHost: true,
                  quizLive: true,
                  ...location.state,
                },
              });
              return;
            }
          } catch (error) {
            // If this fails, continue to participant view
            console.log("User is not the quiz host, continuing as participant");
          }
        } else {
          console.log("User identified as a participant, skipping host check");
        }

        // For participants, use the participant endpoint with retry logic
        async function fetchParticipantData(attempt = 0) {
          try {
            // Use the correct participant-view endpoint that doesn't require auth
            const participantResponse = await api.get(
              `/quiz/${quizId}/participant-view`
            );

            if (
              !participantResponse.data ||
              !participantResponse.data.questions
            ) {
              console.error(
                "Invalid response from participant-view endpoint:",
                participantResponse
              );
              throw new Error("Invalid quiz data received");
            }

            console.log(
              "Successfully fetched participant quiz data:",
              participantResponse.data
            );
            setQuestions(participantResponse.data.questions);

            if (participantResponse.data.questions.length > 0) {
              setTimer(participantResponse.data.questions[0].timer);
            }
            setIsLoading(false);
          } catch (error) {
            console.error(
              `Error fetching quiz (attempt ${attempt + 1}):`,
              error
            );

            if (
              attempt < maxRetries &&
              (error.response?.status === 403 || error.response?.status === 404)
            ) {
              // Quiz might not be fully initialized yet, retry after delay
              console.log(
                `Retrying participant view in ${(attempt + 1) * 1000}ms...`
              );
              setTimeout(
                () => fetchParticipantData(attempt + 1),
                (attempt + 1) * 1000
              );
            } else {
              setIsLoading(false);
              // After all retries failed, show a better error message
              alert(
                "Unable to join the quiz. Please go back to the waiting room and try again."
              );

              // Navigate back to waiting room
              navigate(`/waiting-room/${quizId}`, {
                state: {
                  ...location.state,
                  error: "Failed to load quiz data. Please try again.",
                },
              });
            }
          }
        }

        // Start the retry process
        await fetchParticipantData();
      } catch (error) {
        console.error("Error in checkIfHost:", error);
        setIsLoading(false);
      }
    };

    checkIfHost();
  }, [quizId, user, navigate, location.state]);

  useEffect(() => {
    if (!socket) {
      console.error("Socket not available in LiveQuiz");
      return;
    }

    console.log("LiveQuiz - Setting up socket listeners");
    console.log("LiveQuiz - Socket ID:", socket.id);
    console.log("LiveQuiz - Socket connected:", socket.connected);
    console.log("LiveQuiz - Location state:", location.state);

    // Join the quiz room immediately if gamePin is available
    if (socket.connected && location.state?.gamePin) {
      console.log("LiveQuiz - Joining room with PIN:", location.state.gamePin);
      socket.emit("joinQuizRoom", {
        pin: location.state.gamePin,
        playerName: location.state?.playerName || "Anonymous",
        playerId: location.state?.playerId,
        isHost: false,
        userId: user?._id,
      });
    }

    const handleQuizStarted = ({ pin, quizId: startedQuizId, sessionId }) => {
      console.log("LiveQuiz - Quiz started event received:", {
        pin,
        startedQuizId,
        sessionId,
      });
      console.log("LiveQuiz - Current quiz ID:", quizId);

      // Fetch quiz data
      const fetchQuizData = async () => {
        try {
          console.log("LiveQuiz - Fetching quiz data");
          const response = await api.get(`/quiz/${quizId}`);
          console.log(
            "LiveQuiz - Quiz data fetched:",
            response.data.questions.length,
            "questions"
          );

          setQuestions(response.data.questions);
          if (response.data.questions.length > 0) {
            setTimer(response.data.questions[0].timer);
          }
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching quiz:", error);
          setIsLoading(false);
        }
      };

      fetchQuizData();
    };

    socket.on("quizStarted", handleQuizStarted);

    return () => {
      socket.off("quizStarted", handleQuizStarted);
    };
  }, [socket, quizId, location.state, user]);

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
      // Quiz completed - restart automatically without showing alert
      setSelectedQuestionIndex(0);
      setSelectedOption(null);
      setIsCorrect(null);
      if (questions.length > 0) {
        setTimer(questions[0].timer);
      }
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

  // Show loading state
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

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

export default LiveQuiz;
