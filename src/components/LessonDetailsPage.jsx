import { useEffect, useState, useCallback } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Header from "./layout/Header";
import Avatar from "./Avatar";
import SlotGrid from "./interviewer/SlotGrid";
import { getLessonDetails, getInterviewerReviews } from "../api/interviewerApi";

marked.setOptions({ breaks: true });

const REVIEWS_PAGE_SIZE = 5;

const REVIEW_SORTS = [
  { value: "newest", label: "Спершу нові" },
  { value: "oldest", label: "Спершу старі" },
  { value: "rating_desc", label: "Рейтинг ↓" },
  { value: "rating_asc", label: "Рейтинг ↑" },
];

export default function LessonDetailsPage({ lessonTypeId, onLogout, onNavigate, current }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    setLoading(true);
    getLessonDetails(lessonTypeId)
      .then(setDetails)
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити заняття"))
      .finally(() => setLoading(false));
  }, [lessonTypeId]);

  const descHtml = details?.longDescription
    ? DOMPurify.sanitize(marked.parse(details.longDescription))
    : "";

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="ld-page">
        <button className="ghost-btn small" onClick={() => onNavigate?.("interviewers")}>
          ← До списку
        </button>

        {loading ? (
          <div className="il-loading">Завантаження...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : details ? (
          <>
            {/* Шапка заняття */}
            <section className="ld-head">
              <Avatar
                user={{
                  initials: initials(details.interviewerFirstName, details.interviewerLastName),
                  firstName: details.interviewerFirstName,
                  lastName: details.interviewerLastName,
                }}
                src={buildApiFileUrl(details.interviewerPhoto)}
                size={84}
              />
              <div className="ld-head-info">
                <div className="ld-title-row">
                  <h1>{details.title}</h1>
                  <div className="ld-price">{details.price} грн</div>
                </div>
                <p className="ld-interviewer">
                  {details.interviewerFirstName} {details.interviewerLastName}
                  {details.verified && <span className="ld-verified" title="Верифікований">✓</span>}
                </p>
                <div className="ld-tags">
                  {details.tags.map((t) => <span key={t} className="tag-chip static">{t}</span>)}
                </div>
                <div className="ld-meta">
                  {details.interviewerRank != null && (
                    <span>★ {details.interviewerRank} ({details.reviewsCount})</span>
                  )}
                  {details.experienceYears != null && <span>· Досвід: {details.experienceYears} р.</span>}
                  <span>· Тривалість: {details.effectiveDurationMinutes} хв</span>
                </div>
              </div>
            </section>

            <p className="ld-short">{details.shortDescription}</p>

            {/* Детальний опис (Markdown) */}
            {descHtml && (
              <section className="ld-section">
                <h2>Детальна інформація</h2>
                <div className="ld-markdown" dangerouslySetInnerHTML={{ __html: descHtml }} />
              </section>
            )}

            {/* Розклад */}
            <section className="ld-section">
              <h2>Розклад</h2>
              <SlotGrid
                slots={withDisplayDuration(details.slots, details.effectiveDurationMinutes)}
                selectedId={selectedSlot?.id}
                onPick={(s) => setSelectedSlot(s)}
              />
              {selectedSlot && (
                <div className="ld-booking-bar">
                  <span>
                    Обрано: {formatDay(selectedSlot.date)} {selectedSlot.startTime}–{selectedSlot.displayEndTime || selectedSlot.endTime}
                  </span>
                  <button
                    className="submit-btn"
                    style={{ width: "auto" }}
                    onClick={() =>
                      onNavigate?.(`book:${details.lessonTypeId}:${selectedSlot.id}`)
                    }
                  >
                    Записатись
                  </button>
                </div>
              )}
            </section>

            {/* Відгуки */}
            <ReviewsSection interviewerId={details.interviewerId} />
          </>
        ) : null}
      </main>
    </>
  );
}

function ReviewsSection({ interviewerId }) {
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0, page: 0 });
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p, s) => {
    setLoading(true);
    try {
      const res = await getInterviewerReviews(interviewerId, p, REVIEWS_PAGE_SIZE, s);
      setData(res);
    } catch {
      /* мовчки — відгуків може не бути */
    } finally {
      setLoading(false);
    }
  }, [interviewerId]);

  useEffect(() => { load(0, sort); setPage(0); }, [load, sort]);

  const goToPage = (p) => {
    if (p < 0 || p >= data.totalPages) return;
    setPage(p);
    load(p, sort);
  };

  return (
    <section className="ld-section">
      <div className="ld-reviews-head">
        <h2>Відгуки ({data.totalElements})</h2>
        {data.totalElements > 0 && (
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {REVIEW_SORTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="il-loading">Завантаження...</div>
      ) : data.content.length === 0 ? (
        <p className="hint">Ще немає відгуків.</p>
      ) : (
        <>
          <div className="ld-review-list">
            {data.content.map((r) => (
              <div key={r.id} className="ld-review">
                <Avatar
                  user={{
                    initials: initials(r.reviewerFirstName, r.reviewerLastName),
                    firstName: r.reviewerFirstName,
                    lastName: r.reviewerLastName,
                  }}
                  size={44}
                />
                <div className="ld-review-body">
                  <div className="ld-review-top">
                    <strong>{r.reviewerFirstName} {r.reviewerLastName}</strong>
                    <span className="ld-stars">{stars(r.rating)}</span>
                  </div>
                  {r.comment && <p className="ld-review-text">{r.comment}</p>}
                  {r.createdAt && <span className="ld-review-date">{r.createdAt}</span>}
                </div>
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="il-pagination">
              <button className="ghost-btn small" disabled={data.page === 0}
                onClick={() => goToPage(data.page - 1)}>←</button>
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button key={i} className={`il-page-btn ${i === data.page ? "active" : ""}`}
                  onClick={() => goToPage(i)}>{i + 1}</button>
              ))}
              <button className="ghost-btn small" disabled={data.page >= data.totalPages - 1}
                onClick={() => goToPage(data.page + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function initials(f, l) {
  return ((f ? f[0] : "") + (l ? l[0] : "")).toUpperCase() || "?";
}
function stars(n) {
  const x = Math.max(0, Math.min(5, n || 0));
  return "★".repeat(x) + "☆".repeat(5 - x);
}
function formatDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function buildApiFileUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = import.meta.env.VITE_API_URL || "";
  const originBase = apiBase.endsWith("/api")
    ? apiBase.slice(0, -4)
    : apiBase.replace(/\/$/, "");

  return `${originBase}${url.startsWith("/") ? url : `/${url}`}`;
}

function withDisplayDuration(slots = [], durationMinutes) {
  return slots.map((s) => ({
    ...s,
    displayDurationMinutes: durationMinutes || s.durationMinutes,
    displayEndTime: addMinutes(s.startTime, durationMinutes || s.durationMinutes),
  }));
}

function addMinutes(hhmm, minutes) {
  if (!hhmm || !minutes) return hhmm;
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + Number(minutes);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
