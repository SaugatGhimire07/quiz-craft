import { useState, useEffect, useCallback, useRef } from "react";
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
  const [socketReady, setSocketReady] = useState(false);
  const [localScores, setLocalScores] = useState({});
  const [questionTimes, setQuestionTimes] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const scoreRef = useRef(0);

  // Define currentQuestion at the top of the component
  const currentQuestion = questions[selectedQuestionIndex];

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
    scoreRef.current = score;
  }, [score]);

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

    // If socket isn't connected, try to connect it
    if (!socket.connected) {
      console.log("Socket not connected, attempting to connect...");
      socket.connect();
    }

    // Add a connection event handler
    const handleConnect = () => {
      console.log("Socket connected successfully!");
      setSocketReady(true);

      // Join the quiz room after connection
      if (location.state?.gamePin) {
        console.log("Joining room with PIN:", location.state.gamePin);
        socket.emit("joinQuizRoom", {
          pin: location.state.gamePin,
          playerName: location.state?.playerName || "Anonymous",
          playerId: location.state?.playerId,
          stableId: location.state?.stableId || location.state?.playerId, // Include stableId
          isHost: false,
          userId: user?._id,
        });
      }
    };

    // Listen for connection
    socket.on("connect", handleConnect);

    // If already connected, mark as ready
    if (socket.connected) {
      setSocketReady(true);

      // Join the quiz room immediately if gamePin is available
      if (location.state?.gamePin) {
        console.log(
          "LiveQuiz - Already connected, joining room with PIN:",
          location.state.gamePin
        );
        socket.emit("joinQuizRoom", {
          pin: location.state.gamePin,
          playerName: location.state?.playerName || "Anonymous",
          playerId: location.state?.playerId,
          stableId: location.state?.stableId || location.state?.playerId, // Include stableId
          isHost: false,
          userId: user?._id,
        });
      }
    }

    // Rest of your existing socket event listeners...

    // Add cleanup
    return () => {
      socket.off("connect", handleConnect);
      // Other cleanup...
    };
  }, [socket, quizId, location.state, user]);

  // Add this effect to monitor socket connection state
  useEffect(() => {
    if (!socket || quizComplete) return;

    // Check socket connection status periodically
    const checkInterval = setInterval(() => {
      if (!socket.connected && location.state?.gamePin) {
        console.log("Socket disconnected, attempting to reconnect...");
        socket.connect();

        // Try to rejoin room after short delay
        setTimeout(() => {
          if (socket.connected && location.state?.playerId) {
            console.log("Reconnected, rejoining room");
            socket.emit("joinQuizRoom", {
              pin: location.state.gamePin,
              playerName: location.state?.playerName || "Anonymous",
              playerId: location.state?.playerId,
              isHost: false,
              userId: user?._id,
            });
          }
        }, 500);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkInterval);
  }, [socket, quizComplete, location.state, user]);

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
          params: { sessionId: location.state.sessionId },
        });

        console.log("Raw leaderboard data:", response.data);

        if (Array.isArray(response.data) && response.data.length > 0) {
          // Get player's data from leaderboard
          const currentPlayerEntry = response.data.find(
            (player) => player.playerId === location.state.playerId
          );

          // If player found in server leaderboard and score mismatch
          if (currentPlayerEntry && currentPlayerEntry.score !== score) {
            console.log(
              `Score mismatch for current player: Local=${score}, Server=${currentPlayerEntry.score}`
            );

            // If server score is 0 but local score is higher, override it
            if (currentPlayerEntry.score === 0 && score > 0) {
              console.log(
                "Server reports zero score but we have local score, replacing"
              );

              const updatedLeaderboard = response.data.map((entry) => {
                if (entry.playerId === location.state.playerId) {
                  return {
                    ...entry,
                    score: score,
                    correctAnswers: Object.keys(localScores).length,
                  };
                }
                return entry;
              });

              if (shouldUpdateUI) {
                setLeaderboard(updatedLeaderboard);
              }
              return updatedLeaderboard;
            } else {
              // If server has a valid score, use it and update local state
              setScore(currentPlayerEntry.score);
            }
          }

          if (shouldUpdateUI) {
            setLeaderboard(response.data);
          }
          return response.data;
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
    [quizId, location.state, score, localScores]
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
          console.log(
            "Polling session status to check if all participants finished..."
          );

          // Directly check session status via API
          const statusResponse = await api.get(
            `/quiz/${quizId}/session-status`,
            {
              params: { sessionId: location.state?.sessionId },
            }
          );

          console.log("Session status:", statusResponse.data);

          // Only show results when server confirms ALL have finished
          if (statusResponse.data.allCompleted === true) {
            console.log("Server confirmed all participants have completed");
            setAllParticipantsFinished(true);

            // Fetch latest leaderboard data
            fetchLeaderboard(true);
          } else {
            console.log(
              `Waiting for more participants to finish: ${statusResponse.data.completedCount}/${statusResponse.data.totalPlayers}`
            );

            // Update leaderboard without forcing UI refresh
            await fetchLeaderboard(false);
          }
        } catch (error) {
          console.error("Error polling session status:", error);
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [
    quizComplete,
    allParticipantsFinished,
    quizId,
    location.state?.sessionId,
    fetchLeaderboard,
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
      // Record the skipped question before advancing
      if (currentQuestion && selectedOption === null) {
        console.log(
          `Question ${selectedQuestionIndex + 1} skipped due to timeout`
        );

        // Only set score if there's no existing score for this question
        if (!localScores[currentQuestion._id]) {
          setLocalScores((prev) => ({
            ...prev,
            [currentQuestion._id]: 0,
          }));
        }

        // Record time taken (full time since user didn't answer)
        const fullTime = currentQuestion.timer;
        setQuestionTimes((prev) => ({
          ...prev,
          [currentQuestion._id]: fullTime,
        }));

        // Send skipped question data to server only if we don't have a score already
        if (
          socket?.connected &&
          location.state?.playerId &&
          !localScores[currentQuestion._id] &&
          !submittedAnswers[currentQuestion._id]
        ) {
          socket.emit("submitAnswer", {
            quizId,
            questionId: currentQuestion._id,
            playerId: location.state.playerId,
            stableId: location.state?.stableId || location.state?.playerId,
            answer: "SKIPPED", // Special value to indicate skipped
            isCorrect: false,
            timeTaken: fullTime,
            score: 0,
            questionText: currentQuestion.questionText,
            correctOption: currentQuestion.correctOption,
            options: currentQuestion.options,
          });

          // Also mark this question as submitted to prevent duplicate submissions
          setSubmittedAnswers((prev) => ({
            ...prev,
            [currentQuestion._id]: true,
          }));
        }
      }

      // Now advance to next question
      console.log("Timer reached 0, advancing to next question");
      handleNextQuestion();
    }
  }, [
    timer,
    questions.length,
    quizComplete,
    selectedQuestionIndex,
    selectedOption,
    currentQuestion,
    socket,
    location.state,
    quizId,
  ]);

  const handleNextQuestion = () => {
    // Don't proceed if no questions are loaded
    if (!questions.length) {
      console.warn("No questions loaded yet. Cannot proceed.");
      return;
    }

    // Make sure score for current question is in localScores if answered correctly
    if (
      selectedOption === currentQuestion?.correctOption &&
      !localScores[currentQuestion._id] &&
      currentQuestion
    ) {
      console.log(
        `Ensuring score for correctly answered question ${currentQuestion._id} is saved locally`
      );

      // Calculate what the score should have been
      const maxTime = currentQuestion.timer;
      const timeTaken = (Date.now() - questionStartTime) / 1000;
      const timeBonus = Math.max(0, maxTime - timeTaken);
      const speedMultiplier = 5;
      const questionScore = 100 + Math.round(timeBonus * speedMultiplier);

      // Save it to localScores
      setLocalScores((prev) => ({
        ...prev,
        [currentQuestion._id]: questionScore,
      }));

      // Only send to server if we haven't already sent it
      // Add this check to prevent duplicate submission
      if (
        socket?.connected &&
        location.state?.playerId &&
        !localScores[currentQuestion._id] &&
        !submittedAnswers[currentQuestion._id] // This check should prevent duplicates
      ) {
        socket.emit("submitAnswer", {
          quizId,
          questionId: currentQuestion._id,
          playerId: location.state.playerId,
          stableId: location.state?.stableId || location.state?.playerId,
          answer: currentQuestion.correctOption,
          isCorrect: true,
          timeTaken,
          score: questionScore,
          questionText: currentQuestion.questionText,
          correctOption: currentQuestion.correctOption,
          options: currentQuestion.options,
        });
      }
    }

    // Rest of the function...
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex(selectedQuestionIndex + 1);
    } else {
      // Quiz completed logic...
      console.log(
        "Last question answered, waiting for all participants to finish"
      );

      // Calculate final score from localScores - this is the most reliable method
      const finalScore = Object.values(localScores).reduce(
        (total, questionScore) => total + questionScore,
        0
      );

      console.log(
        `Calculated from localScores: ${finalScore}, Current score: ${scoreRef.current}`
      );

      // Update state with the higher of the two values to ensure we don't lose points
      const bestScore = Math.max(finalScore, scoreRef.current);
      setScore(bestScore);
      scoreRef.current = bestScore; // Also update the ref

      // Always mark the quiz as complete regardless of socket status
      setQuizComplete(true);

      // Calculate total time taken from question times
      const totalTimeTaken = Object.values(questionTimes).reduce(
        (sum, time) => sum + time,
        0
      );

      // Notify the server this participant has completed (if possible)
      if (socket?.connected && location.state?.playerId) {
        console.log(`Sending final score ${scoreRef.current} to server`);
        socket.emit("quizComplete", {
          quizId,
          sessionId: location.state?.sessionId,
          playerId: location.state.playerId,
          stableId: location.state?.stableId || location.state?.playerId,
          totalScore: scoreRef.current,
          timeTaken: totalTimeTaken,
        });
      } else {
        console.warn("Socket not connected, can't send final score to server");
      }
    }
  };

  const handleOptionSelect = (option) => {
    // Don't allow selection if already selected
    if (selectedOption !== null) {
      return;
    }

    // Mark this question as submitted to prevent duplicate submissions
    setSubmittedAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: true,
    }));

    const isAnswerCorrect = option === currentQuestion.correctOption;
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);

    // Calculate time taken for this question
    const timeTaken = (Date.now() - questionStartTime) / 1000;

    // Log quiz state when user selects an option
    console.log("Quiz state on option selection:", {
      questionIndex: selectedQuestionIndex + 1,
      totalQuestions: questions.length,
      timerValue: timer,
      isCorrect: isAnswerCorrect,
      timeTaken,
    });

    // Save this question's time
    setQuestionTimes((prev) => ({
      ...prev,
      [currentQuestion._id]: timeTaken,
    }));

    if (isAnswerCorrect) {
      const maxTime = currentQuestion.timer;
      const timeTaken = (Date.now() - questionStartTime) / 1000;
      const timeBonus = Math.max(0, maxTime - timeTaken);
      const speedMultiplier = 5; // Points per second saved
      const questionScore = 100 + Math.round(timeBonus * speedMultiplier);

      console.log(
        `Calculated score: ${questionScore} for question ${currentQuestion._id}`
      );

      console.log(
        `Question ${selectedQuestionIndex + 1}: Scored ${questionScore} points`
      );
      console.log(`Current local scores:`, localScores);

      // Update total score
      setScore((prevScore) => {
        const newScore = prevScore + questionScore;
        console.log(`Total score updated: ${prevScore} → ${newScore}`);
        scoreRef.current = newScore; // Update ref immediately for safety
        return newScore;
      });

      // Try using isConnected from context instead
      const canSendScore =
        (socket?.connected || isConnected) && location.state?.playerId;

      // Always track score locally as a fallback
      setLocalScores((prev) => ({
        ...prev,
        [currentQuestion._id]: questionScore,
      }));

      // Track time taken for each question
      setQuestionTimes((prev) => ({
        ...prev,
        [currentQuestion._id]: timeTaken,
      }));

      if (canSendScore) {
        console.log(
          `Sending score ${questionScore} to server for player ${location.state.playerId}`
        );
        // Wait for acknowledgement that score was saved
        socket.emit(
          "submitAnswer",
          {
            quizId,
            questionId: currentQuestion._id,
            playerId: location.state.playerId,
            stableId: location.state?.stableId || location.state?.playerId,
            answer: option,
            isCorrect: true,
            timeTaken,
            score: questionScore, // Make sure this value is correct
            questionText: currentQuestion.questionText,
            correctOption: currentQuestion.correctOption,
            options: currentQuestion.options,
          },
          (response) => {
            if (response && response.success) {
              console.log(
                `Server confirmed score ${questionScore} was saved successfully`
              );
            } else {
              console.warn(
                `Server did not confirm score. Local score for this question: ${questionScore}`
              );
            }
          }
        );
      } else {
        console.warn("Socket connection issue - caching score locally");
        // Could add local storage caching here if needed
      }
    } else {
      // For wrong answers, still send to server but with score 0
      if (socket?.connected && location.state?.playerId) {
        socket.emit("submitAnswer", {
          quizId,
          questionId: currentQuestion._id,
          playerId: location.state.playerId,
          stableId: location.state?.stableId || location.state?.playerId,
          answer: option,
          isCorrect: false,
          timeTaken: (Date.now() - questionStartTime) / 1000,
          score: 0,
          // Add these new fields
          questionText: currentQuestion.questionText,
          correctOption: currentQuestion.correctOption,
          options: currentQuestion.options,
        });
      }
    }

    // Add a delay before moving to the next question (gives user time to see the result)
    setTimeout(() => {
      // Only move to next question if not the last question
      if (selectedQuestionIndex < questions.length - 1) {
        handleNextQuestion();
      } else {
        // For the last question, add a bit more delay to ensure score is updated
        setTimeout(() => {
          handleNextQuestion();
        }, 500);
      }
    }, 1500); // 1.5 second delay
  };

  // Add a listener for the acknowledgment
  useEffect(() => {
    if (!socket) return;

    const handleAnswerReceived = ({ questionId, isCorrect, score }) => {
      console.log(
        `Server confirmed answer for question ${questionId}: ${
          isCorrect ? "correct" : "incorrect"
        }, score: ${score}`
      );
    };

    socket.on("answerReceived", handleAnswerReceived);

    return () => {
      socket.off("answerReceived", handleAnswerReceived);
    };
  }, [socket]);

  const createFallbackLeaderboard = () => {
    if (!location.state?.playerName) return [];

    console.log(
      `Creating fallback leaderboard for ${location.state.playerName} with score ${score}`
    );

    // Calculate correct answers based on score (rough estimate)
    // Each question is worth at least 100 points
    const estimatedCorrectAnswers = Math.min(
      Math.ceil(score / 100),
      questions.length || totalQuestions
    );

    console.log(
      `Estimated correct answers: ${estimatedCorrectAnswers} out of ${
        questions.length || totalQuestions
      }`
    );

    return [
      {
        playerId: location.state.playerId,
        playerName: location.state.playerName,
        score,
        correctAnswers: estimatedCorrectAnswers,
        totalQuestions: questions.length || totalQuestions,
      },
    ];
  };

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
