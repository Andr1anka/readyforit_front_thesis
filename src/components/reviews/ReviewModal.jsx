import { useState } from "react";
import { submitReview, submitComplaint } from "../../api/reviewApi";

/**
 * Модалка подачі відгуку або скарги до конкретного уроку.
 * props: { lessonId, mode: "review"|"complaint", onClose, onDone }
 */
export default function ReviewModal({ lessonId, mode = "review", onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isReview = mode === "review";

  const submit = async () => {
    setError("");
    if (!isReview && !comment.trim()) {
      setError("Опишіть суть скарги");
      return;
    }
    try {
      setSubmitting(true);
      if (isReview) {
        await submitReview(lessonId, rating, comment.trim());
      } else {
        await submitComplaint(lessonId, title.trim(), comment.trim());
      }
      onDone?.();
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося надіслати");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rv-modal-backdrop" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{isReview ? "Залишити відгук" : "Подати скаргу"}</h3>

        {isReview && (
          <div className="rv-stars-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rv-star ${n <= rating ? "on" : ""}`}
                onClick={() => setRating(n)}
                aria-label={`${n} зірок`}
              >
                ★
              </button>
            ))}
          </div>
        )}

        {!isReview && (
          <label>
            Тема (необовʼязково)
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </label>
        )}

        <label>
          {isReview ? "Коментар (необовʼязково)" : "Опис проблеми"}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={isReview ? 1500 : 1000}
            placeholder={isReview ? "Як пройшло заняття?" : "Що сталось?"}
          />
        </label>

        {error && <div className="error-message">{error}</div>}

        <div className="row-buttons" style={{ marginTop: 14 }}>
          <button className="ghost-btn" onClick={onClose}>Скасувати</button>
          <button className="submit-btn" style={{ width: "auto" }} disabled={submitting} onClick={submit}>
            {submitting ? "Надсилаємо..." : "Надіслати"}
          </button>
        </div>
      </div>
    </div>
  );
}
