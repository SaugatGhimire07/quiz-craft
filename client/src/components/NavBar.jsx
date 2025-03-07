import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/navbar.css";
import logo from "../assets/logo/logo.png";

const NavBar = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

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
          <div className="signup">
            <li>
              <Link to="/dashboard" style={{ color: "white" }}>
                Go to Dashboard
              </Link>
            </li>
          </div>
        ) : (
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
