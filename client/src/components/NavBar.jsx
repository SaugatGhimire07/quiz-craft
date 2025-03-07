import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/navbar.css";
import logo from "../assets/logo/logo.png";

const NavBar = () => {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">
          <img src={logo} alt="logo" className="img" />
        </Link>
      </div>
      <ul className="navbar-links">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/features">Features</Link>
        </li>
        <li>
          <Link to="/contact">How it works</Link>
        </li>
        <li>
          <Link to="/join">Join Quiz</Link>
        </li>
      </ul>

      <ul className="navbar-auth">
        {user ? (
          // Show Dashboard button for logged-in users
          <div className="signup">
            <li>
              <Link to="/dashboard" style={{ color: "white" }}>
                Go to Dashboard
              </Link>
            </li>
          </div>
        ) : (
          // Show Login and Sign Up for non-logged-in users
          <>
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <div className="signup">
              <li>
                <Link to="/signup" style={{ color: "white" }}>
                  Sign Up
                </Link>
              </li>
            </div>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
