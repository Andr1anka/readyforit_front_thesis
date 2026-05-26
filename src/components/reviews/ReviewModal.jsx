import { useState } from "react";
import { submitReview, submitComplaint, submitInterviewerFeedback } from "../../api/reviewApi";

/**
 * mode:
 * - review: публічний відгук з рейтингом. Доступний обом учасникам.
 * - feedback: обов'язкова приватна рецензія інтерв'юера. Після неї інтерв'юеру зараховуються кошти.
 * - complaint: скарга.
 */
export default function ReviewModal({ lessonId, mode = "review", onClose, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isReview = mode === "review";
  const isFeedback = mode === "feedback";
  const isComplaint = mode === "complaint";

  const submit = async () => {
    setError("");
    const trimmed = comment.trim();

    if (isFeedback && trimmed.length < 30) {
      setError("Напишіть детальну рецензію: мінімум 30 символів");
      return;
    }

    if (isComplaint && !trimmed) {
      setError("Опишіть суть скарги");
      return;
    }

    try {
      setSubmitting(true);
      if (isReview) {
        await submitReview(lessonId, rating, trimmed);
      } else if (isFeedback) {
        await submitInterviewerFeedback(lessonId, trimmed);
      } else {
        await submitComplaint(lessonId, title.trim(), trimmed);
      }
      onDone?.();
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося надіслати");
    } finally {
      setSubmitting(false);
    }
  };

  const titleText = isReview
    ? "Залишити відгук"
    : isFeedback
      ? "Рецензія інтерв'юера"
      : "Подати скаргу";

  return (
    <div className="rv-modal-backdrop" onClick={onClose}>
      <div className="rv-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{titleText}</h3>

        {isReview && (
          <>
            <p className="hint" style={{ marginTop: -4 }}>
              Це публічний відгук про іншу сторону заняття. Його можуть залишити і студент, і інтерв'юер. Він впливає на рейтинг.
            </p>
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
          </>
        )}

        {isFeedback && (
          <div className="info-message" style={{ margin: "8px 0 14px" }}>
            Ця рецензія обов'язкова для інтерв'юера. Опишіть, як пройшло інтерв'ю, що кандидат зробив добре, де помилявся і що йому покращити. Кошти за заняття будуть зараховані на ваш баланс тільки після надсилання цієї рецензії.
          </div>
        )}

        {isComplaint && (
          <label>
            Тема (необовʼязково)
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </label>
        )}

        <label>
          {isReview ? "Коментар (необовʼязково)" : isFeedback ? "Детальна рецензія для студента" : "Опис проблеми"}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={isFeedback ? 8 : 5}
            maxLength={isFeedback ? 3000 : isComplaint ? 1000 : 1500}
            placeholder={
              isReview
                ? "Як пройшло заняття?"
                : isFeedback
                  ? "Наприклад: загальне враження, сильні сторони, помилки у відповідях, прогалини в теорії, поради для підготовки..."
                  : "Що сталось?"
            }
          />
        </label>

        {isFeedback && (
          <div className="hint" style={{ textAlign: "right" }}>
            {comment.trim().length}/3000 · мінімум 30 символів
          </div>
        )}

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
