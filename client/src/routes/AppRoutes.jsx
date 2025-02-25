import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Terms from "../pages/Terms";
import CookiePolicy from "../pages/CookiePolicy";
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
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage/>} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<Terms />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
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
