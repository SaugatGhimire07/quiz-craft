import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import "../styles/login.css";
import "../styles/fonts.css";
import "../styles/auth-shared.css";
import Logo from "../components/Logo";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", formData);

      // If email is verified, proceed with login
      if (response.data.isVerified) {
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
        navigate("/");
      }
    } catch (error) {
      // Handle 403 Forbidden (unverified email)
      if (error.response?.status === 403) {
        setError("Please verify your email to continue");

        // Show loading state for verification redirect
        setLoading(true);

        setTimeout(() => {
          navigate("/verify-email", {
            state: {
              email: formData.email,
              message: "Please verify your email to continue",
            },
          });
        }, 2000);
        return;
      }

      // Handle other errors
      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="login-container auth-page">
      <Logo />
      <div className="login-box">
        <div className="login-header">
          <h1>Log in to your Quiz Craft account</h1>
          {error && <p className="error-message">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Your password</label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="icon" />
                ) : (
                  <Eye className="icon" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          <div className="form-links">
            <Link to="/reset-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
        </form>

        <div className="signup-link">
          <span>Don&apos;t have an account?</span>
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
