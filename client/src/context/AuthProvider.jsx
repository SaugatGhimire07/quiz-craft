import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount and token changes
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Verify token with backend
          const response = await api.get("/auth/user");
          setUser(response.data);
        } catch (error) {
          // If token is invalid, clear everything
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    validateAuth();
  }, []);

  const login = async (userData) => {
    const userWithVerification = {
      ...userData,
      isVerified: userData.isVerified || false,
    };
    setUser(userWithVerification);
    localStorage.setItem("user", JSON.stringify(userWithVerification));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
