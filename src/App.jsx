import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import HomePage from "./components/HomePage";
import "./styles/auth.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );

  // на випадок, якщо токен зміниться в іншій вкладці
  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return isAuthenticated ? (
    <HomePage onLogout={() => setIsAuthenticated(false)} />
  ) : (
    <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />
  );
}

export default App;