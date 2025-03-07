import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoImage from "../assets/logo/logo-only.png";
import "../styles/sidebarnav.css";
import PropTypes from "prop-types";
import { useAuth } from "../hooks/useAuth";
import api from "../api/axios"; // Add this import

const DashNav = ({ initials }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call API to invalidate session tokens on server
      await api.post("/auth/logout-everywhere");

      // Call logout from auth context
      await logout();

      // Redirect to landing page
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);

      // Even if the API call fails, still logout on the client side
      logout();
      navigate("/");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Link to="/dashboard">
            <img src={logoImage} alt="Quiz Craft Logo" width="40" height="30" />
          </Link>
        </div>
        <div className="header-right" ref={dropdownRef}>
          <div
            className="avatar-link"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="avatar-circle">{initials}</div>

            {dropdownOpen && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="avatar-circle dropdown-avatar">
                    {initials}
                  </div>
                  <div className="user-info">
                    <p className="user-name">{user?.name || "User"}</p>
                    <p className="user-email">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <ul className="dropdown-menu">
                  <li>
                    <Link to="/profile" className="dropdown-item">
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
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      Account settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="dropdown-item logout-btn"
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
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Divider */}
      <div className="header-divider"></div>
    </>
  );
};

// Add prop types validation
DashNav.propTypes = {
  initials: PropTypes.string.isRequired,
};

export default DashNav;
