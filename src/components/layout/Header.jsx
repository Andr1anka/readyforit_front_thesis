import { useMemo, useState } from "react";
import "../../styles/header.css";

import siteIcon from "../../assets/images/site-icon.png";

export default function Header({ onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const role = localStorage.getItem("role") || "USER";

  const displayName =
    `${firstName} ${lastName}`.trim() || "Користувач";

  const menuItems = useMemo(() => {
    if (role === "ADMIN") {
      return [
        { title: "Профіль", href: "/profile" },
        { title: "Панель адміністратора", href: "/admin" },
      ];
    }

    if (role === "INTERVIEWER") {
      return [
        { title: "Профіль", href: "/profile" },
        { title: "Профіль інтервʼюера", href: "/interviewer-profile" },
      ];
    }

    return [{ title: "Профіль", href: "/profile" }];
  }, [role]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("role");

    onLogout();
  };

  return (
    <header className="main-header">
      <a href="/" className="brand">
        <img
          className="brand-icon-img"
          src={siteIcon}
          alt="ReadyForIT"
        />

        <span className="brand-title">
          ReadyForIT
        </span>
      </a>

      <nav className="main-nav">
        <a href="/">Головна</a>
        <a href="/interviewers">Інтервʼюери</a>
        <a href="/reviews">Відгуки</a>
        <a href="/about">Про проєкт</a>
      </nav>

      <div className="profile-menu">
        <button
          className="profile-button"
          onClick={() =>
            setIsMenuOpen((prev) => !prev)
          }
        >
          {displayName}
        </button>

        {isMenuOpen && (
          <div className="profile-dropdown">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
              >
                {item.title}
              </a>
            ))}

            <button onClick={logout}>
              Вийти
            </button>
          </div>
        )}
      </div>
    </header>
  );
}