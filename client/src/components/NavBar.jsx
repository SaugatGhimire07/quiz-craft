import "../styles/navbar.css";

//logo
import logo from "../assets/logo/logo.png";

const NavBar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/">
          <img src={logo} alt="logo" className="img" />
        </a>
      </div>
      <ul className="navbar-links">
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/features">Features</a>
        </li>
        <li>
          <a href="/contact">How it works</a>
        </li>
        <li>
          <a href="/contact">Join Quiz</a>
        </li>
      </ul>

      <ul className="navbar-auth">
        <li>
          <a href="/login">Log in</a>
        </li>
        <div className="signup">
          <li>
            <a href="/login" style={{ color: "white" }}>
              Sign Up
            </a>
          </li>
        </div>
      </ul>
    </nav>
  );
};

export default NavBar;
