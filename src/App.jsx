import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import HomePage from "./components/HomePage";
import ProfilePage from "./components/ProfilePage";
import InterviewerProfilePage from "./components/InterviewerProfilePage";
import InterviewerListPage from "./components/InterviewerListPage";
import LessonDetailsPage from "./components/LessonDetailsPage";
import BookingPage from "./components/BookingPage";
import SchedulePage from "./components/SchedulePage";
import VideoCallPage from "./components/VideoCallPage";
import ReviewsPage from "./components/ReviewsPage";
import AdminPage from "./components/AdminPage";
import "./styles/auth.css";
import "./styles/profile.css";
import "./styles/interviewer.css";
import "./styles/interviewer-list.css";
import "./styles/lesson-details.css";
import "./styles/booking.css";
import "./styles/schedule.css";
import "./styles/video-call.css";
import "./styles/reviews.css";
import "./styles/admin.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );

  // активний екран ─ зберігаємо в sessionStorage щоб не скидатись при перезавантаженні
  const [screen, setScreen] = useState(
    () => sessionStorage.getItem("rfi_screen") || "home"
  );

  const navigate = (s) => {
    sessionStorage.setItem("rfi_screen", s);
    setScreen(s);
  };

  useEffect(() => {
    const onStorage = () => setIsAuthenticated(!!localStorage.getItem("token"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("rfi_screen");
    setIsAuthenticated(false);
    setScreen("home");
  };

  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const navProps = {
    onLogout: handleLogout,
    onNavigate: navigate,
    current: screen,
  };

  // параметризований екран: "lesson-details:<id>"
  if (screen.startsWith("lesson-details:")) {
    const lessonTypeId = screen.split(":")[1];
    return <LessonDetailsPage lessonTypeId={lessonTypeId} {...navProps} />;
  }

  // параметризований екран: "book:<lessonTypeId>:<slotId>" (Feature 4)
  if (screen.startsWith("book:")) {
    const [, lessonTypeId, slotId] = screen.split(":");
    return <BookingPage lessonTypeId={lessonTypeId} slotId={slotId} {...navProps} />;
  }

  // параметризований екран: "join:<lessonId>" (відеозвʼязок — Feature 5c)
  if (screen.startsWith("join:")) {
    const lessonId = screen.split(":")[1];
    return <VideoCallPage lessonId={lessonId} {...navProps} />;
  }

  switch (screen) {
    case "profile":
  return (
    <ProfilePage
      {...navProps}
      onBack={() => navigate("home")}
    />
  );

    case "interviewers":
      return <InterviewerListPage {...navProps} />;
    case "schedule":
      return <SchedulePage {...navProps} />;
    case "reviews":
      return <ReviewsPage {...navProps} />;
    case "interviewer-profile":
      return <InterviewerProfilePage {...navProps} />;
    case "admin":
      return <AdminPage {...navProps} />;

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