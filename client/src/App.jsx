import AuthProvider from "./context/AuthProvider";
import AppRoutes from "./routes/AppRoutes";


// import "./styles/style.css";

//components
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";

import "./styles/style.css";
import "./styles/shared.css";


function App() {
  return (
    
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
