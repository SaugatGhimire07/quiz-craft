import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../hooks/useAuth";
import LogoOnly from "../assets/logo/logo-only.png";
import BackgroundTheme from "../components/BackgroundTheme";
import LeaderboardResults from "../components/LeaderboardResults";
import WaitingForResults from "../components/WaitingForResults";
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
  const [score, setScore] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [quizComplete, setQuizComplete] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [liveLeaderboard, setLiveLeaderboard] = useState([]);
  const [allParticipantsFinished, setAllParticipantsFinished] = useState(false);

  // When the component mounts, explicitly reset these values
  useEffect(() => {
    // Reset quiz state when component mounts
    setSelectedQuestionIndex(0);
    setQuizComplete(false);
    setScore(0);

    return () => {
      // Cleanup on unmount
      console.log("LiveQuiz component unmounting");
    };
  }, []);

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

  const fetchLeaderboard = useCallback(
    async (shouldUpdateUI = true) => {
      try {
        console.log(
          "Fetching leaderboard with sessionId:",
          location.state?.sessionId
        );

        if (!location.state?.sessionId) {
          console.warn("Missing sessionId - cannot fetch leaderboard");
          return [];
        }

        const response = await api.get(`/quiz/${quizId}/results`, {
          params: {
            sessionId: location.state.sessionId,
          },
        });

        console.log("Raw leaderboard data:", response.data);

        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(
            "Valid leaderboard received with",
            response.data.length,
            "entries"
          );

          // Add current player if missing
          const currentPlayerIncluded = response.data.some(
            (player) => player.playerId === location.state.playerId
          );

          if (!currentPlayerIncluded && location.state?.playerName) {
            console.log("Current player not found in results, adding manually");
            const playerResults = [...response.data];
            playerResults.push({
              playerId: location.state.playerId,
              playerName: location.state.playerName,
              score,
              correctAnswers: score > 0 ? Math.ceil(score / 100) : 0,
              totalQuestions: questions.length || totalQuestions,
            });
            playerResults.sort((a, b) => b.score - a.score);

            if (shouldUpdateUI) {
              setLeaderboard(playerResults);
            }
            return playerResults;
          } else {
            if (shouldUpdateUI) {
              setLeaderboard(response.data);
            }
            return response.data;
          }
        } else {
          console.warn("Empty leaderboard data, using fallback");
          const fallbackData = createFallbackLeaderboard();
          if (shouldUpdateUI) {
            setLeaderboard(fallbackData);
          }
          return fallbackData;
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        const fallbackData = createFallbackLeaderboard();
        if (shouldUpdateUI) {
          setLeaderboard(fallbackData);
        }
        return fallbackData;
      }
    },
    [quizId, location.state, score, questions.length, totalQuestions]
  );

  useEffect(() => {
    if (!socket) return;

    // Add listener for quiz completion
    const handleShowResults = ({
      quizId: resultQuizId,
      sessionId,
      allParticipantsFinished: allFinished,
    }) => {
      // Only set as complete if we have the right quiz ID and we're not already complete
      if (resultQuizId === quizId) {
        console.log("Quiz complete event received, showing results");
        setQuizComplete(true);

        // Set all participants finished flag based on the server response
        if (allFinished) {
          console.log(
            "All participants have finished the quiz, showing leaderboard"
          );
          setAllParticipantsFinished(true);
        }

        // If we already have live leaderboard data, use it
        if (liveLeaderboard.length > 0) {
          setLeaderboard(liveLeaderboard);
        } else {
          // Otherwise fetch fresh data
          fetchLeaderboard();
        }
      }
    };

    // Listen for the showResults event from the server
    socket.on("showResults", handleShowResults);

    // Listen for a special event when all participants have completed
    socket.on("allParticipantsFinished", () => {
      console.log("Received allParticipantsFinished event");
      setAllParticipantsFinished(true);
    });

    return () => {
      socket.off("showResults", handleShowResults);
      socket.off("allParticipantsFinished");
    };
  }, [socket, quizId, fetchLeaderboard, liveLeaderboard]);

  // Add this useEffect to properly handle single-participant scenarios
  useEffect(() => {
    // If there's only one participant (or we think there is), show results immediately after quiz completion
    if (
      quizComplete &&
      leaderboard.length === 1 &&
      leaderboard[0].playerId === location.state?.playerId
    ) {
      console.log(
        "Only one participant detected, showing leaderboard immediately"
      );
      setAllParticipantsFinished(true);
    }
  }, [quizComplete, leaderboard, location.state?.playerId]);

  // Also modify the existing useEffect that polls for results
  useEffect(() => {
    // Only poll if quiz is complete but we're still waiting for others
    if (quizComplete && !allParticipantsFinished) {
      const pollInterval = setInterval(async () => {
        try {
          console.log("Polling for complete results...");
          const updatedLeaderboard = await fetchLeaderboard();

          // If there's only one player (the current user), consider it finished
          if (
            updatedLeaderboard.length === 1 &&
            updatedLeaderboard[0].playerId === location.state?.playerId
          ) {
            console.log("Single participant detected, showing results");
            setAllParticipantsFinished(true);
            return;
          }

          // Rest of the existing code for multiple participants...
          if (updatedLeaderboard.length > 1) {
            console.log(
              "Multiple participants found in results, showing leaderboard"
            );
            setAllParticipantsFinished(true);
          }

          // Check session status via API
          // ...existing code...
        } catch (error) {
          console.error("Error polling for results:", error);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }
  }, [
    quizComplete,
    allParticipantsFinished,
    fetchLeaderboard,
    quizId,
    location.state?.sessionId,
    location.state?.playerId,
  ]);

  useEffect(() => {
    setSelectedOption(null); // Reset selected option when question changes
    setIsCorrect(null); // Reset correctness state when question changes
    if (questions.length > 0) {
      setTimer(questions[selectedQuestionIndex].timer); // Reset timer for new question
      setQuestionStartTime(Date.now()); // Record when question started
      setTotalQuestions(questions.length); // Track total number of questions
    }
  }, [selectedQuestionIndex, questions]);

  useEffect(() => {
    // Only run timer logic if questions are loaded
    if (questions.length === 0) return;

    // Check if we're on the last question and have already answered
    const isLastQuestion = selectedQuestionIndex === questions.length - 1;
    const hasAnswered = selectedOption !== null;

    // Don't continue the timer if we're on the last question and have answered
    if (isLastQuestion && hasAnswered) {
      return;
    }

    if (timer > 0) {
      const timerId = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (timer === 0 && !quizComplete) {
      // Only advance when timer reaches 0 AND questions are loaded AND quiz isn't complete
      console.log("Timer reached 0, advancing to next question");
      handleNextQuestion();
    }
  }, [
    timer,
    questions.length,
    quizComplete,
    selectedQuestionIndex,
    selectedOption,
  ]);

  // Add this useEffect to monitor important state changes
  useEffect(() => {
    console.log("Quiz state updated:", {
      questionsLoaded: questions.length,
      currentQuestion: selectedQuestionIndex,
      timerValue: timer,
      quizComplete,
      score,
    });
  }, [questions.length, selectedQuestionIndex, timer, quizComplete, score]);

  const handleNextQuestion = () => {
    // Don't proceed if no questions are loaded
    if (!questions.length) {
      console.warn("No questions loaded yet. Cannot proceed.");
      return;
    }

    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    } else {
      // Quiz completed for this participant
      console.log(
        "Last question answered, waiting for all participants to finish"
      );

      // Mark this participant as complete
      setQuizComplete(true);

      // Notify the server this participant has completed
      if (socket?.connected && location.state?.playerId) {
        socket.emit("quizComplete", {
          quizId,
          sessionId: location.state?.sessionId,
          playerId: location.state.playerId,
          totalScore: score, // Make sure this is included
        });

        // Get the current leaderboard for this participant
        if (liveLeaderboard.length > 0) {
          setLeaderboard(liveLeaderboard);
        } else {
          fetchLeaderboard();
        }
      } else {
        // Fallback when socket isn't connected
        fetchLeaderboard();
      }
    }
  };

  const handleOptionSelect = (option) => {
    const isAnswerCorrect = option === currentQuestion.correctOption;
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);

    // Calculate score based on correctness and time
    if (isAnswerCorrect) {
      const maxTime = currentQuestion.timer;
      const timeTaken = (Date.now() - questionStartTime) / 1000;
      const timeBonus = Math.max(0, maxTime - timeTaken);
      const speedMultiplier = 5; // Points per second saved

      const questionScore = 100 + Math.round(timeBonus * speedMultiplier);

      // Update total score
      setScore((prevScore) => prevScore + questionScore);

      // Send score to server if connected to socket
      if (socket?.connected && location.state?.playerId) {
        socket.emit("submitAnswer", {
          quizId,
          questionId: currentQuestion._id,
          playerId: location.state.playerId,
          answer: option,
          isCorrect: true,
          timeTaken,
          score: questionScore, // Make sure this is included
        });
      }
    } else {
      // Wrong answer - no points
      if (socket?.connected && location.state?.playerId) {
        socket.emit("submitAnswer", {
          quizId,
          questionId: currentQuestion._id,
          playerId: location.state.playerId,
          answer: option,
          isCorrect: false,
          timeTaken: (Date.now() - questionStartTime) / 1000,
        });
      }
    }

    // Fetch updated leaderboard in the background (don't update UI yet)
    setTimeout(async () => {
      try {
        const updatedLeaderboard = await fetchLeaderboard(false);
        setLiveLeaderboard(updatedLeaderboard);
        console.log("Updated live leaderboard:", updatedLeaderboard);
      } catch (error) {
        console.error("Failed to update live leaderboard");
      }
    }, 500);

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

      {!quizComplete ? (
        <>
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
            </div>
          </div>
        </>
      ) : (
        <>
          {allParticipantsFinished ? (
            // Show full leaderboard only when all participants have finished
            <LeaderboardResults
              score={score}
              leaderboard={leaderboard}
              currentPlayerId={location.state?.playerId}
              isLoading={leaderboard.length === 0}
            />
          ) : (
            // Show waiting screen while other participants are still finishing
            <WaitingForResults
              score={score}
              playerName={location.state?.playerName || "Player"}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LiveQuiz;
