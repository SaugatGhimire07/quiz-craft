import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import { useAuth } from "../context/AuthContext";
import "../styles/reportPage.css";
import "../styles/sessionResults.css";

const SessionResults = () => {
  const { sessionId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [initials, setInitials] = useState("");

  useEffect(() => {
    if (user?.name) {
      const userName = user.name;
      const userInitials = userName
        ? userName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
        : "";
      setInitials(userInitials);
    }

    fetchSessionResults();
  }, [user, sessionId]);

  const fetchSessionResults = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/quiz/host/session/${sessionId}/participants`
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching session results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToReports = () => {
    navigate("/reports");
  };

  const handleViewParticipantResults = (quizId, sessionId, playerId) => {
    // Navigate to participant's detailed results
    navigate(`/results/${quizId}`, {
      state: {
        sessionId,
        playerId,
        isHost: true, // Flag to indicate host is viewing
      },
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  return (
    <div>
      <DashNav initials={initials} />

      <div className="content-container">
        <div className="main-content">
          <SidebarNav
            active="reports"
            showBackButton={false}
            isAdmin={user?.isAdmin}
          />

          <div className="session-results-container">
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
              Back to Reports
            </button>

            {loading ? (
              <div className="loading-container">
                Loading session results...
              </div>
            ) : results ? (
              <div className="session-details">
                <h1>{results.quizTitle}</h1>
                <h2>Participant Results</h2>

                <div className="session-stats">
                  <div className="stat-item">
                    <span className="stat-label">Session ID:</span>
                    <span className="stat-value">{results.sessionId}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Quiz ID:</span>
                    <span className="stat-value">{results.quizId}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Participants:</span>
                    <span className="stat-value">
                      {results.participants.length}
                    </span>
                  </div>
                </div>

                {results.participants.length > 0 ? (
                  <table className="participants-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Participant</th>
                        <th>Score</th>
                        <th>Correct</th>
                        <th>Time Taken</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.participants
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((participant, index) => (
                          <tr key={participant.playerId || index}>
                            <td>{participant.rank || index + 1}</td>
                            <td>{participant.playerName}</td>
                            <td className="score-cell">
                              {participant.percentage}%
                            </td>
                            <td>
                              {participant.correctAnswers}/
                              {participant.totalQuestions}
                            </td>
                            <td>{formatTime(participant.timeTaken)}</td>
                            <td>
                              <button
                                className="view-results-btn"
                                onClick={() =>
                                  handleViewParticipantResults(
                                    results.quizId,
                                    results.sessionId,
                                    participant.playerId
                                  )
                                }
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No participant data available for this session.</p>
                )}
              </div>
            ) : (
              <div className="error-message">
                Failed to load session results. Please try again.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionResults;
