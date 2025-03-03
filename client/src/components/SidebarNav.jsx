import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "../styles/sidebarnav.css";

const SidebarNav = ({ active = "account" }) => {
  const navigate = useNavigate();

  return (
    <div className="sidebar">
      {/* Back button */}
      <div className="back-button">
        <button onClick={() => navigate("/")}>
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

      {/* Profile navigation */}
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
    </div>
  );
};

// Add prop types validation
SidebarNav.propTypes = {
  active: PropTypes.string,
};

export default SidebarNav;
