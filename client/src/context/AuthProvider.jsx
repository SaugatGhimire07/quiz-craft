import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userWithVerification = {
      ...userData,
      isVerified: userData.isVerified || false,
    };
    setUser(userWithVerification);
    localStorage.setItem("user", JSON.stringify(userWithVerification));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // Add verification status update method
  const updateVerificationStatus = (isVerified) => {
    if (user) {
      const updatedUser = { ...user, isVerified };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        updateVerificationStatus,
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
