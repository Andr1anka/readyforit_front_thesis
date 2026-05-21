import { useState } from "react";
import { changePassword } from "../../api/profileApi";

export default function SecurityTab() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (form.next.length < 6) {
      setError("Новий пароль має містити щонайменше 6 символів");
      return;
    }
    if (form.next !== form.confirm) {
      setError("Паролі не співпадають");
      return;
    }

    try {
      setSaving(true);
      await changePassword(form.current, form.next);
      setMessage("Пароль успішно змінено");
      setForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося змінити пароль");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <h3>Зміна паролю</h3>
      <label>
        Поточний пароль
        <input
          type="password"
          value={form.current}
          onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
          required
        />
      </label>
      <label>
        Новий пароль
        <input
          type="password"
          value={form.next}
          onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
          required
          minLength={6}
        />
      </label>
      <label>
        Повторіть новий пароль
        <input
          type="password"
          value={form.confirm}
          onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
          required
          minLength={6}
        />
      </label>
      <button className="submit-btn" disabled={saving}>
        {saving ? "Зміна..." : "Змінити пароль"}
      </button>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );
}