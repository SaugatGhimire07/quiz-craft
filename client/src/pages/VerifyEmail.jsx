import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import "../styles/verify-email.css";
import "../styles/auth-shared.css";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateVerificationStatus } = useAuth();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const email = location.state?.email;

  // Use useEffect for navigation instead of conditional return
  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  useEffect(() => {
    // Show message from login page if it exists
    if (location.state?.message) {
      setMessage({
        text: location.state.message,
        type: "info",
      });
    }
  }, [location.state]);

  // If no email, render nothing until navigation completes
  if (!email) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode) {
      setMessage({ text: "Please enter the verification code", type: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.post("/auth/verify-email", {
        email,
        code: verificationCode,
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: response.data._id,
            name: response.data.name,
            email: response.data.email,
            isVerified: true,
          })
        );

        // Update verification status in context
        updateVerificationStatus(true);

        setMessage({
          text: "Email verified successfully",
          type: "success",
        });

        // Navigate after successful verification
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Failed to verify email",
        type: "error",
      });

      if (error.response?.status === 400) {
        // Add resend option if code expired
        setMessage({
          text: "Verification code expired. Please try registering again.",
          type: "error",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verify-email-container auth-page">
      <Logo />
      <div className="verify-email-card">
        <h1 className="verify-email-title">Verify Your Email</h1>
        <p className="verify-email-subtitle">
          Please enter the verification code sent to <strong>{email}</strong>
        </p>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="verify-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="resend-link">
          <span>Didn&apos;t receive the code?</span>{" "}
          <Link to="/login">Try Again</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
