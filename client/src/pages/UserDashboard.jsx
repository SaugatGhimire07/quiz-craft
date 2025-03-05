import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios"; // Add this import
import "../styles/userdashboard.css";

const UserDashboard = () => {
  const { user } = useAuth();
  const [initials, setInitials] = useState("");
  const [name, setName] = useState(""); // Add name state
  const [quizzes, setQuizzes] = useState([]); // Add quizzes state
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to fetch user's quizzes
  const fetchQuizzes = async () => {
    try {
      const response = await api.get("/quiz/user");
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate initials from user name when component mounts
  useEffect(() => {
    if (user) {
      const userName = user.name || "";
      // Set the name state
      setName(userName);

      // Generate initials from name
      const userInitials = userName
        ? userName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
        : "";
      setInitials(userInitials);

      // Fetch quizzes when component mounts
      fetchQuizzes();
    }
  }, [user]);

  const handleCreateNew = () => {
    navigate("/create"); // Redirect to create quiz page
  };

  const handleQuizClick = (quizId) => {
    navigate(`/edit/${quizId}`); // Navigate to edit route with quiz ID
  };

  return (
    <div className="dashboard-container">
      {/* Header and Navigation */}
      <DashNav initials={initials} />

      <div className="content-container">
        {/* Main content with sidebar */}
        <div className="main-content">
          {/* Sidebar */}
          <SidebarNav active="dashboard" />

          {/* Dashboard content */}
          <div className="dashboard-content">
            <h1 className="dashboard-title">Welcome, {name}</h1>

            <div className="top-section">
              <button className="dropdown-button" onClick={handleCreateNew}>
                Create new quiz
                <span className="dropdown-icon">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </span>
              </button>
            </div>

            <h2 className="sub-heading-title">Your Quizzes</h2>

            <div className="quizzes-grid">
              {loading ? (
                <div>Loading quizzes...</div>
              ) : quizzes.length > 0 ? (
                quizzes.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="quiz-card"
                    onClick={() => handleQuizClick(quiz._id)} // Add click handler
                  >
                    <div className="quiz-preview">
                      {quiz.questions.some((q) => q.image) ? (
                        <img
                          src={quiz.questions.find((q) => q.image)?.image}
                          alt={quiz.title}
                          className="quiz-preview-image"
                        />
                      ) : (
                        <div className="quiz-preview-fallback">
                          {quiz.questions.length} question
                          {quiz.questions.length !== 1 && "s"}
                        </div>
                      )}
                    </div>
                    <div className="quiz-info">
                      <div className="avatar">{initials}</div>
                      <div className="quiz-details">
                        <h3>{quiz.title}</h3>
                        <p>
                          Created{" "}
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-quizzes">
                  <p>You haven't created any quizzes yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
