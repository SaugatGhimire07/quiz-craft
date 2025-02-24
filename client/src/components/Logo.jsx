import { Link } from "react-router-dom";
import quizCraftLogo from "../assets/logo/logo.png";

const Logo = () => {
  return (
    <Link to="/" className="logo-container">
      <img src={quizCraftLogo} alt="Quiz Craft Logo" className="logo" />
    </Link>
  );
};

export default Logo;
