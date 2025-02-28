import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import "../styles/reset-password.css";
import "../styles/auth-shared.css";
import Logo from "../components/Logo";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation
    if (!email) {
      setMessage({
        text: "Please enter your email address",
        type: "error",
      });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage({
        text: "Please enter a valid email address",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.post("/auth/forgot-password", { email });

      if (response.data.redirect === "signup") {
        setMessage({
          text: "No account found with this email",
          type: "error",
        });
        setTimeout(() => {
          navigate("/signup", {
            state: { message: "Please create an account first" },
          });
        }, 3000);
      } else {
        setMessage({
          text: "Verification code sent to your email",
          type: "success",
        });
        setTimeout(() => {
          navigate("/verify-code", { state: { email } });
        }, 2000);
      }
    } catch (error) {
      // Server errors
      if (error.response?.status === 429) {
        setMessage({
          text: "Too many attempts. Please try again later.",
          type: "error",
        });
      }
      // Network errors
      else if (!error.response) {
        setMessage({
          text: "Network error. Please check your connection.",
          type: "error",
        });
      }
      // Other API errors
      else {
        setMessage({
          text:
            error.response?.data?.message ||
            "Failed to process reset password request",
          type: "error",
        });
      }

      // Log error for debugging
      console.error("Reset password error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-password-container auth-page">
      <Logo />
      <div className="reset-password-card">
        <h1 className="reset-password-title">Reset password</h1>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Your email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="reset-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Reset password"}
          </button>
        </form>

        <div className="signup-link">
          <span>Remember your password?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
