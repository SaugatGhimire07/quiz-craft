import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import ContactPage from "../pages/ContactPage";
// import PrivacyPolicy from "../pages/PrivacyPolicy";
// import Terms from "../pages/Terms";
// import CookiePolicy from "../pages/CookiePolicy";
import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import NewPassword from "../pages/NewPassword";
import VerifyCode from "../pages/VerifyCode";
import VerifyEmail from "../pages/VerifyEmail";
import AccountSettings from "../pages/AccountSettings";
import UserDashboard from "../pages/UserDashboard";
import CreateQuiz from "../pages/CreateQuiz";
import WaitingRoom from "../pages/WaitingRoom";
import LiveQuiz from "../pages/LiveQuiz"; // Import LiveQuiz component
import AdminOrganization from "../pages/AdminOrganization";
import ReportPage from "../pages/ReportPage";
import QuizResultsDetail from "../pages/QuizResultsDetail";
import SessionResults from "../pages/SessionResults";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/waiting-room/:quizId" element={<WaitingRoom />} />
        {/* <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<Terms />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} /> */}
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/verify-email"
          element={
            // <ProtectedRoute allowedStates={["email"]}>
            <VerifyEmail />
            // </ProtectedRoute>
          }
        />
        <Route
          path="/verify-code"
          element={
            // <ProtectedRoute allowedStates={["email"]}>
            <VerifyCode />
            //  </ProtectedRoute>
          }
        />
        <Route
          path="/new-password/:token"
          element={
            // <ProtectedRoute allowedStates={["resetToken"]}>
            <NewPassword />
            // </ProtectedRoute>
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

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth={true}>
              <UserDashboard />
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
        <Route
          path="/create"
          element={
            <ProtectedRoute requireAuth={true}>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:quizId"
          element={
            <ProtectedRoute requireAuth={true}>
              <CreateQuiz />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live/:quizId"
          element={
            <ProtectedRoute requireAuth={true}>
              <LiveQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminorganization"
          element={
            <ProtectedRoute requireAuth={true}>
              <AdminOrganization />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:quizId"
          element={
            <ProtectedRoute>
              <QuizResultsDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/session-results/:sessionId"
          element={
            <ProtectedRoute>
              <SessionResults />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
