import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import ConfirmationOverlay from "../components/ConfirmationOverlay";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios";
import "../styles/userdashboard.css";

const UserDashboard = () => {
  const { user , isAdmin} = useAuth();
  const [initials, setInitials] = useState("");
  const [name, setName] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Add state to track which dropdown is currently open
  const [activeDropdown, setActiveDropdown] = useState(null);
  // Add state for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  // Update the fetchQuizzes function
  const fetchQuizzes = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Add cache-busting parameter when we want to force refresh
      const endpoint = forceRefresh ? "/quiz/user?refresh=true" : "/quiz/user";

      const response = await api.get(endpoint);
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generate initials from user name when component mounts
  useEffect(() => {
    console.group('UserDashboard Debug');
    console.log('User object:', user);
    console.log('isAdmin status:', Boolean(user?.isAdmin));
    console.groupEnd();



    if (user) {
      const userName = user.name || "";
      setName(userName);
      const isAdmin = user.isAdmin || false;

      console.log("User admin status:", isAdmin);

      const userInitials = userName
        ? userName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
        : "";
      setInitials(userInitials);

      fetchQuizzes();
    }
  },  [user, isAdmin]);

  // Add effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null && !event.target.closest(".quiz-dropdown")) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  const handleCreateNew = () => {
    navigate("/create");
  };

  const handleJoinQuiz = () => {
    navigate("/join");
  };

  const handleQuizClick = (quizId) => {
    navigate(`/edit/${quizId}`);
  };

  // New function to toggle dropdown menu
  const toggleDropdown = (e, index) => {
    e.stopPropagation(); // Prevent card click
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Update the handleMakeQuizLive function
  const handleMakeQuizLive = async (e, quizId) => {
    e.stopPropagation(); // Prevent card click
    try {
      // Get the host's userId from the auth context
      const hostId = user._id;

      // Make the quiz live and send the hostId
      const response = await api.patch(`/quiz/${quizId}/publish`, {
        hostId: hostId,
      });

      // Navigate to waiting room with host information
      navigate(`/waiting-room/${quizId}`, {
        state: {
          isHost: true,
          hostId: hostId,
          sessionId: response.data.sessionId,
        },
      });

      // No need to fetch again as we're navigating away
      setActiveDropdown(null);
    } catch (error) {
      console.error("Error making quiz live:", error);
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (e, quiz) => {
    e.stopPropagation(); // Prevent card click
    setQuizToDelete(quiz);
    setShowDeleteConfirmation(true);
    setActiveDropdown(null);
  };

  // Then update the handleDeleteQuiz function
  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      await api.delete(`/quiz/${quizToDelete._id}`);
      // Remove quiz from state
      setQuizzes(quizzes.filter((quiz) => quiz._id !== quizToDelete._id));
      setShowDeleteConfirmation(false);

      // No need to re-fetch - we've already updated the state
      // and the server has invalidated the cache
    } catch (error) {
      console.error("Error deleting quiz:", error);
      // On error, refresh to get the current state
      fetchQuizzes(true);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header and Navigation */}
      <DashNav initials={initials} />

      <div className="content-container">
        {/* Main content with sidebar */}
        <div className="main-content">
          {/* Sidebar */}
          <SidebarNav active="dashboard" showBackButton={false} isAdmin={user?.isAdmin} />

          {/* Dashboard content */}
          <div className="dashboard-content">
            <h1 className="dashboard-title">Welcome, {name}</h1>

            <div className="top-section">
              <button className="dropdown-button" onClick={handleCreateNew}>
                New Quiz
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

              {/* Join Quiz Button */}
              <button
                className="dropdown-button join-button"
                onClick={handleJoinQuiz}
              >
                Join Quiz
                <span className="dropdown-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                </span>
              </button>
            </div>

            <h2 className="sub-heading-title">Your Quizzes</h2>

            <div className="quizzes-grid">
              {loading ? (
                <div>Loading quizzes...</div>
              ) : quizzes.length > 0 ? (
                quizzes.map((quiz, index) => (
                  <div
                    key={quiz._id}
                    className="quiz-card"
                    onClick={() => handleQuizClick(quiz._id)}
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

                      {/* Ellipsis button and dropdown */}
                      <div className="quiz-dropdown">
                        <button
                          className="ellipsis-button"
                          onClick={(e) => toggleDropdown(e, index)}
                          aria-label="Quiz options"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                          </svg>
                        </button>

                        {activeDropdown === index && (
                          <div className="quiz-dropdown-menu">
                            <button
                              onClick={(e) => handleMakeQuizLive(e, quiz._id)}
                              className="quiz-dropdown-item"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="10 8 16 12 10 16 10 8"></polygon>
                              </svg>
                              Make Quiz Live
                            </button>
                            <button
                              onClick={(e) => confirmDelete(e, quiz)}
                              className="dropdown-item delete-item"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              Delete Quiz
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-quizzes">
                  <p>You haven&apos;t created any quizzes yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      <ConfirmationOverlay
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        message={
          <>
            Are you sure you want to delete "
            <strong>{quizToDelete?.title}</strong>"?
            <br />
            <span className="text-danger">This action cannot be undone.</span>
          </>
        }
        type="danger"
      />
    </div>
  );
};

export default UserDashboard;
