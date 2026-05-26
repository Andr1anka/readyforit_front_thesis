import { useEffect, useState } from "react";
import Header from "./layout/Header";
import { getLessonDetails, bookLesson } from "../api/interviewerApi";
import { getMyProfile } from "../api/profileApi";

/**
 * Сторінка підтвердження запису на урок.
 * Показує деталі обраного слота, ціну й баланс, перевіряє достатність коштів,
 * і виконує бронювання. Після успіху веде в розклад.
 */
export default function BookingPage({ lessonTypeId, slotId, onLogout, onNavigate, current }) {
  const [details, setDetails] = useState(null);
  const [slot, setSlot] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    Promise.all([getLessonDetails(lessonTypeId), getMyProfile()])
      .then(([d, profile]) => {
        setDetails(d);
        setBalance(profile.balance ?? 0);
        const found = (d.slots || []).find((s) => String(s.id) === String(slotId));
        setSlot(found || null);
        if (!found) setError("Слот більше недоступний");
      })
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити дані"))
      .finally(() => setLoading(false));
  }, [lessonTypeId, slotId]);

  const enough = details && balance != null && Number(balance) >= details.price;

  const confirm = async () => {
    setError("");
    try {
      setSubmitting(true);
      const res = await bookLesson(lessonTypeId, slotId);
      setDone(res);
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося записатись");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="bk-page">
        {loading ? (
          <div className="il-loading">Завантаження...</div>
        ) : done ? (
          <div className="bk-card bk-success">
            <div className="bk-check">✓</div>
            <h1>Запис підтверджено!</h1>
            <p>
              {done.lessonTitle} з {done.interviewerFirstName} {done.interviewerLastName}
            </p>
            <p className="bk-time">{done.timeOfLesson}</p>
            <p className="hint">
              Списано {done.price} грн. Новий баланс: {fmt(done.newBalance)} грн.
            </p>
            <div className="row-buttons" style={{ justifyContent: "center", marginTop: 16 }}>
              <button className="ghost-btn" onClick={() => onNavigate?.("interviewers")}>
                До списку
              </button>
              <button className="submit-btn" style={{ width: "auto" }}
                onClick={() => onNavigate?.("schedule")}>
                Мій розклад
              </button>
            </div>
          </div>
        ) : details && slot ? (
          <div className="bk-card">
            <button className="ghost-btn small" onClick={() => onNavigate?.(`lesson-details:${lessonTypeId}`)}>
              ← Назад
            </button>
            <h1>Підтвердження запису</h1>

            <div className="bk-row"><span>Заняття</span><strong>{details.title}</strong></div>
            <div className="bk-row">
              <span>Інтерв'юер</span>
              <strong>{details.interviewerFirstName} {details.interviewerLastName}</strong>
            </div>
            <div className="bk-row">
              <span>Дата і час</span>
              <strong>{formatDay(slot.date)}, {slot.startTime}–{slot.endTime}</strong>
            </div>
            <div className="bk-row"><span>Тривалість</span><strong>{slot.durationMinutes} хв</strong></div>
            <div className="bk-row bk-price-row"><span>Вартість</span><strong>{details.price} грн</strong></div>
            <div className="bk-row"><span>Ваш баланс</span><strong>{fmt(balance)} грн</strong></div>

            {!enough && (
              <div className="error-message">
                Недостатньо коштів. Поповніть баланс у профілі.
              </div>
            )}
            {error && <div className="error-message">{error}</div>}

            <div className="row-buttons" style={{ marginTop: 18 }}>
              <button className="ghost-btn" onClick={() => onNavigate?.(`lesson-details:${lessonTypeId}`)}>
                Скасувати
              </button>
              {enough ? (
                <button className="submit-btn" style={{ width: "auto" }} disabled={submitting} onClick={confirm}>
                  {submitting ? "Записуємо..." : `Записатись за ${details.price} грн`}
                </button>
              ) : (
                <button className="submit-btn" style={{ width: "auto" }}
                  onClick={() => onNavigate?.("profile")}>
                  Поповнити баланс
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bk-card">
            <div className="error-message">{error || "Слот недоступний"}</div>
            <button className="submit-btn" style={{ marginTop: 16 }}
              onClick={() => onNavigate?.(`lesson-details:${lessonTypeId}`)}>
              ← Назад до заняття
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function fmt(v) {
  if (v == null) return "0";
  return Number(v).toFixed(2).replace(/\.00$/, "");
}
function formatDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit" });
}
