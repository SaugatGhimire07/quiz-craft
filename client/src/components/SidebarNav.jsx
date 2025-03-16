import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/sidebarnav.css";

const SidebarNav = ({ active = "dashboard", showBackButton = true ,isAdmin = false  }) => {
  const navigate = useNavigate();

  // console.log("SidebarNav isAdmin:", isAdmin);
  
  // Check if we're in a profile-related page
  const isProfilePage = active === "account" || active === "organization";

  return (
    <div className="sidebar">
      {/* Back button - shown only when showBackButton prop is true */}
      {showBackButton && (
        <div className="back-button">
          <button onClick={() => navigate("/dashboard")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Back to home</span>
          </button>
        </div>
      )}

      {/* Dashboard navigation - only shown on dashboard pages */}
      {!isProfilePage && !isAdmin && (
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Dashboard</h3>
          <ul className="sidebar-menu">
            <li
              className={`sidebar-menu-item ${
                active === "dashboard" ? "active" : ""
              }`}
              onClick={() => navigate("/dashboard")}
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "discover" ? "active" : ""
              }`}
              onClick={() => navigate("/discover")}
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
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Discover
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "library" ? "active" : ""
              }`}
              onClick={() => navigate("/library")}
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
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Library
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "reports" ? "active" : ""
              }`}
              onClick={() => navigate("/reports")}
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
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              Reports
            </li>
          </ul>
        </div>
      )}

      {/* Profile navigation - only shown on profile pages */}
      {isProfilePage && (
        <div className="sidebar-section">
          <h3 className="sidebar-heading">My profile</h3>
          <ul className="sidebar-menu">
            <li
              className={`sidebar-menu-item ${
                active === "account" ? "active" : ""
              }`}
              onClick={() => navigate("/profile")}
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
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              Account settings
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "organization" ? "active" : ""
              }`}
              onClick={() => navigate("/organization")}
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Organization
            </li>
          </ul>
        </div>
      )}

      {/* Admin navigation - only shown for admin users */}
      {isAdmin && (
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Admin Dashboard</h3>
          <ul className="sidebar-menu">
            <li
              className={`sidebar-menu-item ${
                active === "admin-home" ? "active" : ""
              }`}
              onClick={() => navigate("/dashboard")}
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Dashboard
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "admin-organization" ? "active" : ""
              }`}
              onClick={() => navigate("/adminorganization")}
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
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Organization
            </li>
            <li
              className={`sidebar-menu-item ${
                active === "quiz-management" ? "active" : ""
              }`}
              onClick={() => navigate("/dashboard/quiz-management")}
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="10" y1="9" x2="8" y2="9"></line>
              </svg>
              Quiz Management
            </li>
          </ul>
        </div>
      )}


    </div>
  );
};

// Update prop types validation
SidebarNav.propTypes = {
  active: PropTypes.string,
  showBackButton: PropTypes.bool,
};

export default SidebarNav;
