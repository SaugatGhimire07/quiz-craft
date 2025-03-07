import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import PropTypes from "prop-types";

const ProtectedRoute = ({
  children,
  allowedStates = [],
  requireAuth = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Store the attempted URL
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
