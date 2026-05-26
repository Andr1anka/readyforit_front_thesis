import { useEffect, useState } from "react";
import {
  applyForInterviewer,
  getMyInterviewerRequest,
} from "../../api/profileApi";

export default function InterviewerTab({ user, onChange }) {
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    experienceDescription: "",
    specialization: "",
    yearsOfExperience: "",
    externalLinks: "",
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyInterviewerRequest()
      .then(setExisting)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Завантаження...</div>;

  // Не верифікований
  if (!(user.isVerificated || user.verificated)) {
    return (
      <div className="info-message">
        Щоб подати заявку на інтерв'юера, спочатку пройдіть верифікацію особи.
      </div>
    );
  }

  // Вже інтерв'юер
  if (user.role === "INTERVIEWER") {
    return (
      <div className="success-message">
        ✓ Ви вже маєте роль інтерв'юера. Налаштування слотів — на окремій сторінці.
      </div>
    );
  }

  // Заявка вже подана / розглядається — не зникає до рішення адміна
  if (existing && existing.status === "PENDING") {
    return (
      <div className="profile-form">
        <div className="info-message">
          ⏳ Вашу заявку подано <strong>{formatDate(existing.createdAt)}</strong>.
          Очікує розгляду адміністратором.
        </div>
        <div className="application-summary">
          <p><strong>Спеціалізація:</strong> {existing.specialization}</p>
          <p><strong>Досвід:</strong> {existing.yearsOfExperience} років</p>
          <p><strong>Документів додано:</strong> {existing.proofsCount}</p>
          <p><strong>Опис:</strong></p>
          <p className="multiline">{existing.experienceDescription}</p>
        </div>
      </div>
    );
  }

  // Якщо заявка REJECTED — даємо подати знову з коментарем адміна
  const isRejected = existing?.status === "REJECTED";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (files.length === 0) return setError("Додайте хоча б один документ як доказ досвіду");

    try {
      setSubmitting(true);
      const dto = {
        ...form,
        yearsOfExperience: form.yearsOfExperience === "" ? 0 : Number(form.yearsOfExperience),
      };
      const result = await applyForInterviewer(dto, files);
      setExisting(result);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося подати заявку");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h3>Заявка на роль інтерв'юера</h3>

      {isRejected && existing.adminComment && (
        <div className="error-message">
          Попередню заявку відхилено: {existing.adminComment}
        </div>
      )}

      <label>
        Спеціалізація
        <input
          value={form.specialization}
          onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
          placeholder="Наприклад: Java Backend, Frontend React"
          required
        />
      </label>

      <label>
        Років досвіду
        <input
          type="number"
          min="0"
          value={form.yearsOfExperience}
          onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: e.target.value }))}
          required
        />
      </label>

      <label>
        Опис досвіду
        <textarea
          rows={6}
          minLength={30}
          maxLength={4000}
          value={form.experienceDescription}
          onChange={(e) =>
            setForm((f) => ({ ...f, experienceDescription: e.target.value }))
          }
          placeholder="Розкажіть де працювали, з якими технологіями, які проєкти вели..."
          required
        />
      </label>

      <label>
        Посилання (LinkedIn, GitHub, портфоліо)
        <input
          value={form.externalLinks}
          onChange={(e) => setForm((f) => ({ ...f, externalLinks: e.target.value }))}
          placeholder="https://linkedin.com/in/... , https://github.com/..."
        />
      </label>

      <label>
        Документи / докази (PDF, скріни сертифікатів)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
        {files.length > 0 && (
          <small>{files.length} файл(ів) вибрано</small>
        )}
      </label>

      <button className="submit-btn" disabled={submitting}>
        {submitting ? "Подача..." : "Подати заявку"}
      </button>

      {error && <div className="error-message">{error}</div>}
    </form>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA") + " " + d.toLocaleTimeString("uk-UA", {
    hour: "2-digit", minute: "2-digit",
  });
}