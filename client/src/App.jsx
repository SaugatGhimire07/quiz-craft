import AuthProvider from "./context/AuthProvider";
import AppRoutes from "./routes/AppRoutes";
import { SocketProvider } from "./context/SocketContext";

// import "./styles/style.css";

import "./styles/style.css";
import "./styles/shared.css";

function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </SocketProvider>
  );
}

export default App;
