import { useMemo, useState, useEffect, useRef } from "react";
import "../../styles/header.css";

import siteIcon from "../../assets/images/site-icon.png";

/**
 * Пропси:
 *   onLogout            ─ викид токена і повернення на AuthPage
 *   onNavigate(screen)  ─ переключення екрану в App.jsx
 *                         screen ∈ { "home", "interviewers", "schedule",
 *                                    "profile", "interviewer-profile", "admin" }
 *   current             ─ ім'я поточного екрану (для підсвічування активного пункту)
 */
export default function Header({ onLogout, onNavigate, current = "home" }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const role = localStorage.getItem("role") || "USER";

  const displayName = `${firstName} ${lastName}`.trim() || "Користувач";

  // Закриваємо дропдаун при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const menuItems = useMemo(() => {
    if (role === "ADMIN") {
      return [
        { title: "Профіль", screen: "profile" },
        { title: "Панель адміністратора", screen: "admin" },
      ];
    }

    if (role === "INTERVIEWER") {
      return [
        { title: "Профіль", screen: "profile" },
        { title: "Профіль інтервʼюера", screen: "interviewer-profile" },
      ];
    }

    return [{ title: "Профіль", screen: "profile" }];
  }, [role]);

  const go = (screen) => {
    setIsMenuOpen(false);
    onNavigate?.(screen);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("role");
    setIsMenuOpen(false);
    onLogout?.();
  };

  return (
    <header className="main-header">
      <button
        type="button"
        className="brand"
        onClick={() => go("home")}
      >
        <img className="brand-icon-img" src={siteIcon} alt="ReadyForIT" />
        <span className="brand-title">ReadyForIT</span>
      </button>

      <nav className="main-nav">
        <button
          type="button"
          className={current === "home" ? "active" : ""}
          onClick={() => go("home")}
        >
          Головна
        </button>
        <button
          type="button"
          className={current === "interviewers" ? "active" : ""}
          onClick={() => go("interviewers")}
        >
          Інтервʼюери
        </button>
        <button
          type="button"
          className={current === "schedule" ? "active" : ""}
          onClick={() => go("schedule")}
        >
          Розклад
        </button>
        <button
          type="button"
          className={current === "reviews" ? "active" : ""}
          onClick={() => go("reviews")}
        >
          Відгуки
        </button>
      </nav>

      <div className="profile-menu" ref={menuRef}>
        <button
          className="profile-button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {displayName}
        </button>

        {isMenuOpen && (
          <div className="profile-dropdown">
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.screen}
                className={current === item.screen ? "active" : ""}
                onClick={() => go(item.screen)}
              >
                {item.title}
              </button>
            ))}

            <button type="button" className="logout-item" onClick={logout}>
              Вийти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}