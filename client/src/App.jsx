import AuthProvider from "./context/AuthProvider";
import AppRoutes from "./routes/AppRoutes";

// import "./styles/style.css";

//components
import Navbar from "./components/NavBar";
import Footer from "./components/Footer";

function App() {
  return (
    
    <AuthProvider>
      <Navbar/>
      <AppRoutes />
      <Footer/>
    </AuthProvider>
  );
}

export default App;
