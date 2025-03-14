import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { generateAvatar } from "../utils/avatarGenerator";
import api from "../api/axios";
import Logo from "../assets/logo/logo-only.png";
import HeaderLeft from "../assets/waiting-room/header_left.png";
import HeaderRight from "../assets/waiting-room/header_right.png";
import "../styles/waiting-room.css";
import { useAuth } from "../hooks/useAuth";
import ParticipantsList from "../components/ParticipantsList";

const socket = io("http://localhost:5001", {
  withCredentials: true,
});

const WaitingRoom = () => {
  const { user } = useAuth(); // Add this line
  const { quizId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [gamePin, setGamePin] = useState("");
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [isParticipant, setIsParticipant] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);

  // Add userId state
  const [currentUserId, setCurrentUserId] = useState(user?._id || null);

  // Modify the avatar generation useMemo
  const playerAvatars = useMemo(() => {
    if (!players.length) return {};

    return players.reduce((acc, player) => {
      // Use avatarSeed from player data instead of name
      acc[player._id] = generateAvatar(player.avatarSeed || player.name);
      return acc;
    }, {});
  }, [players]);

  // Fetch initial session and player data
  useEffect(() => {
    const fetchQuizSession = async () => {
      try {
        const isHost = !location.state?.playerId;
        setIsHost(isHost);

        // Get session info
        const response = await api.get(`/quiz/${quizId}/session`);
        const session = response.data;

        setGamePin(session.pin);
        setSessionId(session.sessionId);

        // Set player info if participant
        if (location.state?.playerId) {
          setIsParticipant(true);
          const playerId = location.state.playerId;
          const playerResponse = await api.get(`/players/${playerId}`);
          setPlayerName(playerResponse.data.name);
        }

        // Fetch initial participants with avatar seeds
        const participantsResponse = await api.get(
          `/players/session/${session.pin}/participants`
        );

        if (participantsResponse.data.participants) {
          setPlayers(participantsResponse.data.participants);
          setPlayerCount(participantsResponse.data.participants.length);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    fetchQuizSession();
  }, [quizId, location.state]);

  useEffect(() => {
    const checkQuizStatus = async () => {
      try {
        const response = await api.get(`/quiz/${quizId}`);
        const quiz = response.data;

        if (quiz.status === "draft") {
          alert("The quiz has ended.");
          navigate(location.state?.from || "/"); // Redirect to the previous page or home page
        }
      } catch (error) {
        console.error("Error checking quiz status:", error);
      }
    };

    const interval = setInterval(checkQuizStatus, 3000);
    return () => clearInterval(interval);
  }, [quizId, navigate, location.state]);

  // Combined data fetching and socket effect
  useEffect(() => {
    if (!gamePin) return;

    let mounted = true;

    // Function to fetch participants
    const fetchParticipants = async () => {
      try {
        const response = await api.get(
          `/players/session/${gamePin}/participants`
        );
        if (mounted) {
          setPlayers(response.data.participants);
          setPlayerCount(response.data.participants.length);
        }
      } catch (error) {
        console.error("Error fetching participants:", error);
      }
    };

    // Initial fetch
    fetchParticipants();

    // Join room
    socket.emit("joinQuizRoom", {
      pin: gamePin,
      playerName: isHost ? "Quiz Host" : playerName, // Add host name
      playerId: isHost ? null : location.state?.playerId, // Don't send playerId for host
      isHost: isHost, // Explicitly mark host role
      userId: user?._id,
    });

    // Socket event listeners
    socket.on(
      "participantJoined",
      ({ id, name, avatarSeed, userId, isHost }) => {
        if (mounted) {
          setPlayers((prevPlayers) => {
            // Don't add host to players list
            if (isHost) return prevPlayers;

            const isDuplicate = prevPlayers.some((player) => player._id === id);

            if (!isDuplicate) {
              const newPlayers = [
                ...prevPlayers,
                {
                  _id: id,
                  name,
                  avatarSeed,
                  userId,
                  isHost: false, // Ensure hosts are never added as players
                  isCurrentPlayer: location.state?.playerId === id,
                  isConnected: true,
                  role: "participant",
                },
              ];
              setPlayerCount(newPlayers.length); // Update count only for actual participants
              return newPlayers;
            }
            return prevPlayers;
          });
        }
      }
    );

    socket.on("playerLeft", ({ playerId }) => {
      if (mounted) {
        setPlayers((prev) => {
          const updatedPlayers = prev.filter((p) => p._id !== playerId);
          setPlayerCount(updatedPlayers.length);
          return updatedPlayers;
        });
      }
    });

    socket.on("playerCount", ({ count }) => {
      if (mounted) {
        setPlayerCount(count);
      }
    });

    socket.on("quizStarted", () => {
      if (mounted) {
        navigate(`/quiz/${quizId}`);
      }
    });

    // Poll for updates to catch any missed real-time events
    const pollInterval = setInterval(fetchParticipants, 5000);

    // Cleanup function
    return () => {
      mounted = false;
      clearInterval(pollInterval);

      if (!isHost) {
        socket.emit("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state?.playerId,
        });
      }

      socket.off("participantJoined");
      socket.off("playerLeft");
      socket.off("playerCount");
      socket.off("quizStarted");
    };
  }, [gamePin, isHost, playerName, location.state?.playerId, quizId, navigate]);

  const handleStartQuiz = async () => {
    try {
      await api.post(`/quiz/${quizId}/session/start`);
      // Emit socket event to start quiz
      socket.emit("startQuiz", { pin: gamePin });
    } catch (error) {
      console.error("Error starting quiz:", error);
      alert("Failed to start the quiz. Please try again.");
    }
  };

  const handleEndQuiz = async () => {
    try {
      await api.post(`/quiz/${quizId}/end`);
      alert("Quiz ended and status updated to draft.");
      navigate(location.state?.from || "/"); // Redirect to the previous page or home page
    } catch (error) {
      console.error("Error ending quiz:", error);
      alert("Failed to end the quiz. Please try again.");
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await api.get(
        `/players/session/${gamePin}/participants`
      );
      setPlayers(response.data.participants);
      setPlayerCount(response.data.participants.length);
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  // Add this function before the return statement
  const handleLeaveQuiz = async () => {
    try {
      if (!isHost && location.state?.playerId) {
        // Emit socket event to notify others
        socket.emit("leaveQuizRoom", {
          pin: gamePin,
          playerId: location.state.playerId,
        });

        // Navigate back to home
        navigate("/");
      }
    } catch (error) {
      console.error("Error leaving quiz:", error);
    }
  };

  // Update the renderParticipants function
  const renderParticipants = () => {
    if (!Array.isArray(players) || players.length === 0) {
      return (
        <p className="no-participants">
          Share the game PIN with others to join!
        </p>
      );
    }

    return (
      <div className="participant-grid">
        {players.map((player) => {
          // Identify current player using both playerId and userId
          const isCurrentPlayer =
            !isHost &&
            (location.state?.playerId === player._id ||
              (user && user._id === player.userId));

          return (
            <div
              key={player._id}
              className={`participant-card ${
                isCurrentPlayer ? "current-player" : ""
              }`}
            >
              <img
                src={generateAvatar(player.avatarSeed || player.name)}
                alt={`${isCurrentPlayer ? "Your" : `${player.name}'s`} avatar`}
                className="participant-avatar"
                width="64"
                height="64"
                loading="lazy"
              />
              <span className="participant-name">{player.name}</span>
              {isCurrentPlayer && <span className="you-badge">You</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="waiting-room">
      <div className="background-theme">
        <img src={HeaderLeft} alt="" className="bg-img-left" />
        <img src={HeaderRight} alt="" className="bg-img-right" />
      </div>

      <div className="pin-container">
        <div className="game-pin">
          <div className="join-instructions">
            Join at quizcraft.com | Use code{" "}
            <span className="pin-highlight">{gamePin}</span>
          </div>
        </div>
      </div>

      <div className="projection-area">
        <div className="projection-screen">
          <img src={Logo} alt="Quiz Craft Logo" className="quiz-craft-logo" />
          <h1 className="waiting-logo">
            <em>Quiz Craft!</em>
          </h1>
        </div>

        <ParticipantsList
          players={players}
          isHost={isHost}
          currentUserId={currentUserId}
          currentPlayerId={location.state?.playerId}
          user={user}
        />
      </div>

      <div className="game-controls">
        {isHost ? (
          <>
            <button
              className="start-button"
              onClick={handleStartQuiz}
              disabled={players.length === 0}
            >
              Start Quiz
            </button>
            <button className="end-button" onClick={handleEndQuiz}>
              Back to Dashboard
            </button>
          </>
        ) : (
          <button className="leave-button" onClick={handleLeaveQuiz}>
            Leave Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
