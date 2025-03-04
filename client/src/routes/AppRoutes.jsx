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
import AccountSettings from "../pages/AccountSettings";
import CreateQuiz from "../pages/CreateQuiz";
import JoinQuiz from "../pages/JoinQuiz";
import PlayQuiz from "../pages/PlayQuiz";
import WaitingRoom from "../pages/WaitingRoom";
import QuizResult from "../pages/QuizResult";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
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
          path="/profile"
          element={
            <ProtectedRoute requireAuth={true}>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<AccountSettings />} />
        <Route path="/create-quiz" element={<CreateQuiz />} />
        <Route path="/join-quiz" element={<JoinQuiz />} />
        <Route path="/waiting-room/:quizCode" element={<WaitingRoom />} />
        <Route path="/play/:quizCode" element={<PlayQuiz />} />
        <Route path="/quiz-result/:quizCode" element={<QuizResult />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
//