import { useEffect, useState } from "react";
import Header from "./layout/Header";
import Avatar from "./Avatar";
import WeekCalendar from "./schedule/WeekCalendar";
import ReviewModal from "./reviews/ReviewModal";
import { getActualSchedule, getArchivedSchedule } from "../api/scheduleApi";

export default function SchedulePage({ onLogout, onNavigate, current }) {
  const [tab, setTab] = useState("actual");
  const [actual, setActual] = useState(null);
  const [archived, setArchived] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null); // "list" | "calendar" (для актуальних)

  useEffect(() => {
    setLoading(true);
    Promise.all([getActualSchedule(), getArchivedSchedule()])
      .then(([a, ar]) => {
        setActual(a);
        setArchived(ar);
        setView(a.suggestedView || "list");
      })
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити розклад"))
      .finally(() => setLoading(false));
  }, []);

  const join = (item) => onNavigate?.(`join:${item.lessonId}`);

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="sch-page">
        <div className="sch-head">
          <h1>Розклад</h1>
          {tab === "actual" && actual && actual.items.length > 0 && (
            <div className="sch-view-toggle">
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>Список</button>
              <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>Календар</button>
            </div>
          )}
        </div>

        <nav className="sch-tabs">
          <button className={tab === "actual" ? "active" : ""} onClick={() => setTab("actual")}>
            Актуальні {actual ? `(${actual.items.length})` : ""}
          </button>
          <button className={tab === "archived" ? "active" : ""} onClick={() => setTab("archived")}>
            Архівні {archived ? `(${archived.items.length})` : ""}
          </button>
        </nav>

        {loading ? (
          <div className="il-loading">Завантаження...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tab === "actual" ? (
          <ActualView data={actual} view={view} onJoin={join} onBrowse={() => onNavigate?.("interviewers")} />
        ) : (
          <ArchivedView data={archived} />
        )}
      </main>
    </>
  );
}

function ActualView({ data, view, onJoin, onBrowse }) {
  if (!data || data.items.length === 0) {
    return (
      <div className="info-message">
        Немає запланованих занять.{" "}
        <button className="link-btn" onClick={onBrowse}>Знайти інтерв'юера →</button>
      </div>
    );
  }
  if (view === "calendar") {
    return <WeekCalendar items={data.items} onJoin={onJoin} />;
  }
  // список згрупований по днях
  const byDate = {};
  data.items.forEach((it) => { (byDate[it.date] ||= []).push(it); });
  return (
    <div className="sch-list">
      {Object.keys(byDate).sort().map((date) => (
        <div key={date} className="sch-day-group">
          <div className="sch-day-label">{formatDay(date)}</div>
          {byDate[date].map((it) => <ScheduleCard key={it.lessonId} item={it} onJoin={onJoin} canJoin />)}
        </div>
      ))}
    </div>
  );
}

function ArchivedView({ data }) {
  const [modal, setModal] = useState(null); // {lessonId, mode}
  const [refreshKey, setRefreshKey] = useState(0);

  if (!data || data.items.length === 0) {
    return <div className="info-message">Архів порожній.</div>;
  }
  return (
    <div className="sch-list" key={refreshKey}>
      {data.items.map((it) => (
        <div key={it.lessonId} className="sch-archived">
          <ScheduleCard item={it} />
          {it.reviewFromInterviewer && (
            <div className="sch-review">
              <strong>Рецензія інтерв'юера:</strong>
              <p>{it.reviewFromInterviewer}</p>
            </div>
          )}
          {it.myRating != null && (
            <div className="sch-myreview">
              <strong>Ваш відгук:</strong> <span className="ld-stars">{stars(it.myRating)}</span>
              {it.myReviewComment && <p>{it.myReviewComment}</p>}
            </div>
          )}
          <div className="sch-archived-actions">
            {it.canReview && (
              <button className="ghost-btn small" onClick={() => setModal({ lessonId: it.lessonId, mode: "review" })}>
                Залишити відгук
              </button>
            )}
            <button className="ghost-btn small danger" onClick={() => setModal({ lessonId: it.lessonId, mode: "complaint" })}>
              Поскаржитись
            </button>
          </div>
        </div>
      ))}

      {modal && (
        <ReviewModal
          lessonId={modal.lessonId}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); setRefreshKey((k) => k + 1); window.location.reload(); }}
        />
      )}
    </div>
  );
}

function ScheduleCard({ item, onJoin, canJoin }) {
  const soon = canJoin && isJoinable(item);
  return (
    <article className="sch-card">
      <div className="sch-card-main">
        <h3 className="sch-card-title">{item.title}</h3>
        <div className="sch-card-person">
          <Avatar
            user={{ initials: initials(item.counterpartFirstName, item.counterpartLastName) }}
            size={36}
          />
          <div>
            <span className="sch-card-role">{item.role === "INTERVIEWER" ? "Студент" : "Викладач"}</span>
            <div className="sch-card-name">{item.counterpartFirstName} {item.counterpartLastName}</div>
          </div>
        </div>
      </div>
      <div className="sch-card-side">
        <div className="sch-card-when">
          <span>📅 {formatDay(item.date)}</span>
          <span>🕐 {item.startTime}–{item.endTime}</span>
          <span>💻 Онлайн</span>
        </div>
        {canJoin && (
          <button
            className={`submit-btn sch-join ${soon ? "" : "muted"}`}
            onClick={() => onJoin?.(item)}
          >
            {soon ? "Приєднатись" : "Деталі"}
          </button>
        )}
      </div>
    </article>
  );
}

function isJoinable(item) {
  // приєднатись можна за 15 хв до початку і до кінця заняття
  if (!item.timeOfLesson) return false;
  const start = new Date(item.timeOfLesson);
  const now = new Date();
  const fifteenBefore = new Date(start.getTime() - 15 * 60000);
  const end = new Date(start.getTime() + (item.durationMinutes || 60) * 60000);
  return now >= fifteenBefore && now <= end;
}
function initials(f, l) { return ((f ? f[0] : "") + (l ? l[0] : "")).toUpperCase() || "?"; }
function stars(n) { const x = Math.max(0, Math.min(5, n || 0)); return "★".repeat(x) + "☆".repeat(5 - x); }
function formatDay(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit" });
}
