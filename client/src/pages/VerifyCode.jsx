import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/axios";
import "../styles/verify-code.css";
import Logo from "../components/Logo";

const VerifyCode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationCode, setVerificationCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const email = location.state?.email;

  // Use useEffect for navigation
  useEffect(() => {
    if (!email) {
      navigate("/reset-password");
    }
  }, [email, navigate]);

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
      const response = await api.post("/auth/verify-code", {
        email,
        code: verificationCode,
      });

      if (response.data.resetToken) {
        setMessage({
          text: "Code verified successfully",
          type: "success",
        });

        // Navigate with state containing resetToken
        setTimeout(() => {
          navigate(`/new-password/${response.data.resetToken}`, {
            state: { resetToken: response.data.resetToken },
          });
        }, 2000);
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.message || "Invalid verification code",
        type: "error",
      });
      console.error("Verification error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="verify-code-container">
      <Logo />
      <div className="verify-code-card">
        <h1 className="verify-code-title">Enter Verification Code</h1>
        <p className="verify-code-subtitle">
          We&apos;ve sent a verification code to <strong>{email}</strong>
        </p>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code to reset password</label>
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
            {isSubmitting ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="resend-link">
          <span>Didn&apos;t receive the code?</span>
          <button
            onClick={() => navigate("/reset-password")}
            className="resend-button"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;
