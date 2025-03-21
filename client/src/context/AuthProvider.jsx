import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";
import api from "../api/axios"; // Add this import

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check token and load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");

        console.log("Initial auth check, token exists:", !!token);

        if (!token) {
          setLoading(false);
          return;
        }

        // Fetch user data with token
        const response = await api.get("/auth/user");
        setUser(response.data);
      } catch (error) {
        console.error("Error loading user:", error.message);
        // Don't remove token on network errors, only on auth errors
        if (error.response && error.response.status === 401) {
          console.log("Auth error, removing token");
          localStorage.removeItem("token");
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    // Debug logging
    console.log("AuthProvider state:", {
      isUserSet: !!user,
      user: user
        ? {
            id: user._id,
            name: user.name,
            isVerified: user.isVerified,
          }
        : null,
      loading,
    });
  }, [user, loading]);

  const login = (userData) => {
    // Validate userData has required fields
    if (!userData || !userData._id) {
      console.error("Invalid user data provided to login function");
      return;
    }

    const userWithVerification = {
      ...userData,
      isVerified: userData.isVerified || false,
    };

    // Set user in state
    setUser(userWithVerification);

    // Use try-catch to handle localStorage errors that can occur in some browsers
    try {
      localStorage.setItem("user", JSON.stringify(userWithVerification));
    } catch (error) {
      console.error("Error saving user data to localStorage:", error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const refreshAuthToken = async () => {
    try {
      // First try getting user from localStorage as a fallback
      const storedUser = localStorage.getItem("user");
      if (storedUser && !user) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Only set if we have a valid user object with _id
          if (parsedUser && parsedUser._id) {
            console.log("Refreshing user from localStorage:", parsedUser.name);
            setUser(parsedUser);
          }
        } catch (e) {
          console.error("Error parsing stored user:", e);
        }
      }

      // If we have a token but no user, try getting from server
      const token = localStorage.getItem("token");
      if (token && !user) {
        const response = await api.get("/auth/user");
        if (response.data) {
          setUser(response.data);
        }
      }
    } catch (error) {
      console.error("Error refreshing auth token:", error);
      // Only clear on authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    refreshAuthToken, // Include this function in the context
    isAuthenticated: !!user && !!user._id, // Add this line to export this value
    updateVerificationStatus: (isVerified) => {
      if (user) {
        const updatedUser = { ...user, isVerified };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
