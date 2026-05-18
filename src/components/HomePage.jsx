import { useState } from "react";
import MeetingRoom from "./MeetingRoom";

export default function HomePage({ onLogout }) {
  const [inRoom, setInRoom] = useState(false);

  const firstName = localStorage.getItem("firstName") || "";
  const lastName = localStorage.getItem("lastName") || "";
  const displayName = `${firstName} ${lastName}`.trim() || "Учасник";

  if (inRoom) {
    return (
      <MeetingRoom
        displayName={displayName}
        onLeave={() => setInRoom(false)}
      />
    );
  }

  return (
    <main className="home-page">
      <section className="home-card">
        <h1>Вітаємо, {firstName || "користувач"}!</h1>
        <p>Натисніть кнопку нижче, щоб приєднатися до спільної кімнати.</p>

        <button className="submit-btn" onClick={() => setInRoom(true)}>
          Приєднатись
        </button>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("firstName");
            localStorage.removeItem("lastName");
            onLogout();
          }}
        >
          Вийти
        </button>
      </section>
    </main>
  );
}