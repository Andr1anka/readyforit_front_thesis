import { useState } from "react";

export default function HomePage({ onLogout }) {
  const [joined, setJoined] = useState(false);

  return (
    <main className="home-page">
      <section className="home-card">
        <h1>Вітаємо!</h1>
        <p>Ви успішно увійшли в систему.</p>

        {!joined ? (
          <button className="submit-btn" onClick={() => setJoined(true)}>
            Приєднатись
          </button>
        ) : (
          <div className="success-message">Ви приєдналися 🎉</div>
        )}

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            onLogout();
          }}
        >
          Вийти
        </button>
      </section>
    </main>
  );
}