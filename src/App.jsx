import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";
import "./styles/auth.css";
import "./styles/profile.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );

  // активний екран ─ "home" | "interviewers" | "schedule" | "profile" | "interviewer-profile" | "admin"
  const [screen, setScreen] = useState("home");

  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setScreen("home");
  };

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const navProps = {
    onLogout: handleLogout,
    onNavigate: setScreen,
    current: screen,
  };

  switch (screen) {
    case "profile":
      return <ProfilePage {...navProps} />;

    // Заглушки на майбутнє ─ підставиш свої компоненти, коли будуть готові
    case "interviewers":
      return <ComingSoon title="Інтервʼюери" {...navProps} />;
    case "schedule":
      return <ComingSoon title="Розклад" {...navProps} />;
    case "interviewer-profile":
      return <ComingSoon title="Профіль інтервʼюера" {...navProps} />;
    case "admin":
      return <ComingSoon title="Панель адміністратора" {...navProps} />;

    case "home":
    default:
      return <HomePage {...navProps} />;
  }
}

/** Простенька заглушка щоб навігація працювала ще до того як зробиш сторінку. */
function ComingSoon({ title, onLogout, onNavigate, current }) {
  // якщо у тебе Header у відокремленому компоненті ─ можна підключити сюди:
  // import Header from "./components/layout/Header";
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>{title}</h1>
      <p style={{ color: "#6e6b7e" }}>Сторінка в розробці.</p>
      <button
        className="submit-btn"
        style={{ marginTop: 20 }}
        onClick={() => onNavigate("home")}
      >
        ← На головну
      </button>
    </div>
  );
}

export default App;