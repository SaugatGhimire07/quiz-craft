import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignUpPage from "../pages/SignUpPage";
import LoginPage from "../pages/LoginPage";
import ResetPassword from "../pages/ResetPassword";
import ProtectedRoute from "../components/ProtectedRoute";
import NewPassword from "../pages/NewPassword";
import VerifyCode from "../pages/VerifyCode";

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/new-password/:token" element={<NewPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <h1>Welcome to QuizCraft</h1>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
