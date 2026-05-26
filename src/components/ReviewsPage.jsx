import { useEffect, useState } from "react";
import Header from "./layout/Header";
import Avatar from "./Avatar";
import {
  getMyWrittenReviews,
  getReceivedReviews,
  getMyComplaints,
} from "../api/reviewApi";

export default function ReviewsPage({ onLogout, onNavigate, current }) {
  const [tab, setTab] = useState("received");
  const [written, setWritten] = useState([]);
  const [received, setReceived] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getReceivedReviews(), getMyWrittenReviews(), getMyComplaints()])
      .then(([r, w, c]) => { setReceived(r); setWritten(w); setComplaints(c); })
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="rv-page">
        <h1>Відгуки</h1>
        <nav className="rv-tabs">
          <button className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>
            Про мене ({received.length})
          </button>
          <button className={tab === "written" ? "active" : ""} onClick={() => setTab("written")}>
            Мої відгуки ({written.length})
          </button>
          <button className={tab === "complaints" ? "active" : ""} onClick={() => setTab("complaints")}>
            Мої скарги ({complaints.length})
          </button>
        </nav>

        {loading ? (
          <div className="il-loading">Завантаження...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tab === "complaints" ? (
          <ComplaintsList items={complaints} />
        ) : (
          <ReviewsList items={tab === "received" ? received : written} mode={tab} />
        )}
      </main>
    </>
  );
}

function ReviewsList({ items, mode }) {
  if (items.length === 0) {
    return <div className="info-message">
      {mode === "received" ? "Про вас ще немає відгуків." : "Ви ще не залишали відгуків."}
    </div>;
  }
  return (
    <div className="rv-list">
      {items.map((r) => (
        <div key={r.id} className="rv-item">
          <Avatar user={{ initials: initials(r.counterpartFirstName, r.counterpartLastName) }} size={46} />
          <div className="rv-item-body">
            <div className="rv-item-top">
              <strong>{r.counterpartFirstName} {r.counterpartLastName}</strong>
              <span className="ld-stars">{stars(r.rating)}</span>
            </div>
            <div className="rv-item-meta">
              {mode === "received" ? "про мене" : "від мене"} · {r.lessonTitle}
              {r.createdAt && <> · {r.createdAt}</>}
            </div>
            {r.comment && <p className="rv-item-text">{r.comment}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplaintsList({ items }) {
  if (items.length === 0) {
    return <div className="info-message">Ви не подавали скарг.</div>;
  }
  return (
    <div className="rv-list">
      {items.map((c) => (
        <div key={c.id} className="rv-complaint">
          <div className="rv-complaint-top">
            <strong>{c.title || "Скарга"}</strong>
            <span className={`rv-status ${c.status}`}>{statusLabel(c.status)}</span>
          </div>
          <div className="rv-item-meta">
            На {c.accusedFirstName} {c.accusedLastName} · {c.lessonTitle}
            {c.createdAt && <> · {c.createdAt}</>}
          </div>
          <p className="rv-item-text">{c.description}</p>
          {c.adminComment && (
            <div className="rv-admin-note"><strong>Відповідь адміністратора:</strong> {c.adminComment}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function statusLabel(s) {
  return { OPEN: "На розгляді", RESOLVED: "Вирішено", REJECTED: "Відхилено" }[s] || s;
}
function initials(f, l) { return ((f ? f[0] : "") + (l ? l[0] : "")).toUpperCase() || "?"; }
function stars(n) { const x = Math.max(0, Math.min(5, n || 0)); return "★".repeat(x) + "☆".repeat(5 - x); }
