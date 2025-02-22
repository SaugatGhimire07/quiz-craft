import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import "../styles/signup.css";
import "../styles/fonts.css";
import Logo from "../components/Logo";

const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", formData);
      localStorage.setItem("token", response.data.token);
      navigate("/login"); // Redirect to login page after successful registration
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.errors?.[0]?.msg ||
          "Registration failed"
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
    <div className="signup-container">
      <Logo />
      <div className="signup-box">
        <div className="signup-header">
          <h1>Create a free account</h1>
          <p>
            We recommend using a dedicated email for better organization and
            easy access.
          </p>
          {error && <p className="error-message">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">First and last name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Choose a password</label>
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
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? (
                  <EyeOff className="icon" />
                ) : (
                  <Eye className="icon" />
                )}
              </button>
            </div>
            <p className="password-hint">At least 8 characters</p>
          </div>

          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>

        <p className="terms">
          By signing up you accept our <a href="#">terms of use</a> and{" "}
          <a href="#">policies</a>
        </p>

        <div className="login-link">
          <span>Already have an account?</span> <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
