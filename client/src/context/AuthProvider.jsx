import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user data in localStorage on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // const login = (userData) => {
    
  //   const userWithVerification = {
  //     ...userData,
      
  //     isVerified: userData.isVerified || false,
  //     isAdmin: Boolean(userData.isAdmin) // Add this line
  //   };
  //   console.log(userData)
  //   setUser(userWithVerification);
  //   localStorage.setItem("user", JSON.stringify(userWithVerification));
  // };

  const login = (userData) => {
    // Make sure we preserve id and isAdmin explicitly
    const userWithStatus = {
      id: userData.id || userData._id, // Handle both id formats
      name: userData.name,
      email: userData.email,
      isVerified: Boolean(userData.isVerified),
      isAdmin: Boolean(userData.isAdmin)
    };
    
    console.log('Login - Storing user data:', userWithStatus);
    
    setUser(userWithStatus);
    localStorage.setItem("user", JSON.stringify(userWithStatus));
  };

  // Update localStorage handling
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    console.log('Stored user:', storedUser);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          isVerified: Boolean(parsedUser.isVerified),
          isAdmin: Boolean(parsedUser.isAdmin)
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const value = {
    user,
    login,
    logout,
    loading,
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
