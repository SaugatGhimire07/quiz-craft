import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PropTypes from "prop-types";

const ProtectedRoute = ({
  children,
  allowedStates = [],
  requireAuth = false,
}) => {
  const { user, loading, isVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // First check
  if (!user) {
    return <Navigate to="/home" />;
  }

  // For routes that require authentication
  if (requireAuth) {
    // Redundant
    // if (!user) {
    //   return <Navigate to="/login" />;
    // }

    // Redirect unverified users to verify email page
    if (!isVerified && location.pathname !== "/verify-email") {
      return <Navigate to="/verify-email" state={{ email: user.email }} />;
    }
  }

  // For password reset flow routes
  if (allowedStates.length > 0) {
    const hasRequiredState = allowedStates.every(
      (key) => location.state?.[key]
    );
    if (!hasRequiredState) {
      return <Navigate to="/login" />;
    }
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedStates: PropTypes.arrayOf(PropTypes.string),
  requireAuth: PropTypes.bool,
};

export default ProtectedRoute;
