// import { useContext } from "react";
// import { AuthContext } from "../context/AuthContext";

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return {
//     ...context,
//     isVerified: context.user?.isVerified || false,
//     isAdmin: context.user?.isAdmin || false
//   }; 
// };

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Explicitly check isAdmin from user object
  const isAdmin = Boolean(context.user?.isAdmin);
  
  return {
    ...context,
    isVerified: context.user?.isVerified || false,
    isAdmin: context.user?.isAdmin || false,
  }; 
};