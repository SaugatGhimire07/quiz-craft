import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import { useAuth } from "../context/AuthContext";
import "../styles/reportPage.css";

const ReportPage = () => {
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    sortBy: "date", // date, title, score
    sortOrder: "desc", // asc, desc
    quizType: "all", // all, live, self-paced
  });
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

    fetchQuizHistory();
  }, [user]);

  const fetchQuizHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/quiz/user/history");
      setQuizHistory(response.data);
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (e) => {
    setFilter({ ...filter, sortBy: e.target.value });
  };

  const handleOrderChange = (e) => {
    setFilter({ ...filter, sortOrder: e.target.value });
  };

  const handleTypeChange = (e) => {
    setFilter({ ...filter, quizType: e.target.value });
  };

  const handleViewResults = (quizId, sessionId) => {
    navigate(`/results/${quizId}`, { state: { sessionId } });
  };

  // Apply filters and sorting to quiz history
  const filteredHistory = quizHistory
    .filter((quiz) => {
      if (filter.quizType === "all") return true;
      return quiz.quizType === filter.quizType;
    })
    .sort((a, b) => {
      const order = filter.sortOrder === "asc" ? 1 : -1;

      switch (filter.sortBy) {
        case "title":
          return order * a.quizTitle.localeCompare(b.quizTitle);
        case "score":
          return order * (a.percentage - b.percentage);
        case "date":
        default:
          return (
            order * (new Date(a.participatedAt) - new Date(b.participatedAt))
          );
      }
    });

  return (
    <div className="dashboard-container">
      {/* Header and Navigation */}
      <DashNav initials={initials} />

      <div className="content-container">
        {/* Main content with sidebar */}
        <div className="main-content">
          {/* Sidebar */}
          <SidebarNav
            active="reports"
            showBackButton={false}
            isAdmin={user?.isAdmin}
          />

          {/* Report content */}
          <div className="reports-content">
            <h1 className="reports-title">Your Quiz Reports</h1>

            <div className="reports-filters">
              <div className="filter-group">
                <label>Sort By:</label>
                <select value={filter.sortBy} onChange={handleSortChange}>
                  <option value="date">Date</option>
                  <option value="title">Quiz Title</option>
                  <option value="score">Score</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Order:</label>
                <select value={filter.sortOrder} onChange={handleOrderChange}>
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Quiz Type:</label>
                <select value={filter.quizType} onChange={handleTypeChange}>
                  <option value="all">All Quizzes</option>
                  <option value="live">Live Quizzes</option>
                  <option value="self-paced">Self-paced</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">Loading quiz history...</div>
            ) : filteredHistory.length > 0 ? (
              <div className="reports-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Quiz Title</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Time</th>
                      <th>Rank</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((quiz) => (
                      <tr key={`${quiz.quizId}-${quiz.sessionId}`}>
                        <td>{quiz.quizTitle}</td>
                        <td>
                          {new Date(quiz.participatedAt).toLocaleDateString()}
                        </td>
                        <td className="score-cell">{quiz.percentage}%</td>
                        <td>
                          {quiz.correctAnswers}/{quiz.totalQuestions}
                        </td>
                        <td>
                          {quiz.timeTaken
                            ? `${Math.floor(quiz.timeTaken / 60)}:${String(
                                Math.floor(quiz.timeTaken % 60)
                              ).padStart(2, "0")}`
                            : "-"}
                        </td>
                        <td>{quiz.rank || "-"}</td>
                        <td>
                          <button
                            className="view-results-btn"
                            onClick={() =>
                              handleViewResults(quiz.quizId, quiz.sessionId)
                            }
                          >
                            Review Answers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-reports">
                <p>You haven&apos;t participated in any quizzes yet.</p>
                <button onClick={() => navigate("/join")}>Join a Quiz</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
