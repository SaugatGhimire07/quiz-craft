import { Link } from "react-router-dom";
import logoImage from "../assets/logo/logo-only.png";
import "../styles/sidebarnav.css";
import PropTypes from "prop-types";

const DashNav = ({ initials }) => {
  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo">
          <Link to="/">
            <img src={logoImage} alt="Quiz Craft Logo" width="40" height="30" />
          </Link>
        </div>
        <div className="header-right">
          <Link to="/profile" className="avatar-link">
            <div className="avatar-circle">{initials}</div>
          </Link>
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
