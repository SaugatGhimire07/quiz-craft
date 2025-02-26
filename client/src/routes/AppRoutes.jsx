import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

//Screens
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";

import HomePage from "../pages/HomePage";

import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import NewPassword from "../pages/NewPassword";
import VerifyCode from "../pages/VerifyCode";
import VerifyEmail from "../pages/VerifyEmail";
import AccountSettings from "../pages/AccountSettings";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<HomePage />} />

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

        <Route path="/profile" element={<AccountSettings />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
