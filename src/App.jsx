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
import BackgroundBubbles from "./components/layout/BackgroundBubbles";

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
import "./styles/index.css";

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <BackgroundBubbles />
      <div className="app-content">{children}</div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );

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

  let page;

  if (screen.startsWith("lesson-details:")) {
    const lessonTypeId = screen.split(":")[1];
    page = <LessonDetailsPage lessonTypeId={lessonTypeId} {...navProps} />;
  } else if (screen.startsWith("book:")) {
    const [, lessonTypeId, slotId] = screen.split(":");
    page = <BookingPage lessonTypeId={lessonTypeId} slotId={slotId} {...navProps} />;
  } else if (screen.startsWith("join:")) {
    const lessonId = screen.split(":")[1];
    page = <VideoCallPage lessonId={lessonId} {...navProps} />;
  } else {
    switch (screen) {
      case "profile":
        page = <ProfilePage {...navProps} onBack={() => navigate("home")} />;
        break;
      case "interviewers":
        page = <InterviewerListPage {...navProps} />;
        break;
      case "schedule":
        page = <SchedulePage {...navProps} />;
        break;
      case "reviews":
        page = <ReviewsPage {...navProps} />;
        break;
      case "interviewer-profile":
        page = <InterviewerProfilePage {...navProps} />;
        break;
      case "admin":
        page = <AdminPage {...navProps} />;
        break;
      case "home":
      default:
        page = <HomePage {...navProps} />;
        break;
    }
  }

  return <AppShell>{page}</AppShell>;
}

export default App;