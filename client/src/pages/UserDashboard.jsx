import { useState, useEffect } from "react";
import DashNav from "../components/DashNav";
import SidebarNav from "../components/SidebarNav";
import { useAuth } from "../hooks/useAuth";
import "../styles/userdashboard.css";

const UserDashboard = () => {
  const { user } = useAuth();
  const [initials, setInitials] = useState("");
  const [name, setName] = useState(""); // Add name state

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
    }
  }, [user]);

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
              <button className="dropdown-button">
                Create new
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
              <div className="quiz-card">
                <div className="quiz-preview">No preview available</div>
                <div className="quiz-info">
                  <div className="avatar">{initials}</div>
                  <div className="quiz-details">
                    <h3>Untitled Presentation</h3>
                    <p>Last edited 2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
