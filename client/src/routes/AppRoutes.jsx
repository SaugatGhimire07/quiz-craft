import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import NewPassword from "../pages/NewPassword";
import VerifyCode from "../pages/VerifyCode";
import VerifyEmail from "../pages/VerifyEmail";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/verify-email"
          element={
            <ProtectedRoute allowedStates={["email"]}>
              <VerifyEmail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-code"
          element={
            <ProtectedRoute allowedStates={["email"]}>
              <VerifyCode />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-password/:token"
          element={
            <ProtectedRoute allowedStates={["resetToken"]}>
              <NewPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute requireAuth>
              <h1>Welcome to QuizCraft</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
