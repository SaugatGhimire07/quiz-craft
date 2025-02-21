import { Routes } from "react-router-dom";
import AuthProvider from "./context/AuthProvider";
import AppRoutes from "./routes/AppRoutes";
import "./styles/style.css";

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
