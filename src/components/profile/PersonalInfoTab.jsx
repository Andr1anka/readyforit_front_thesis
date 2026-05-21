import { useState } from "react";
import { updateProfile } from "../../api/profileApi";

export default function PersonalInfoTab({ user, onUpdated }) {
  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    age: user.age ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    try {
      setSaving(true);
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        age: form.age === "" ? null : Number(form.age),
      };
      const updated = await updateProfile(payload);
      onUpdated(updated);
      setMessage("Дані збережено");
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      <label>
        Імʼя
        <input name="firstName" value={form.firstName} onChange={handleChange} required />
      </label>
      <label>
        Прізвище
        <input name="lastName" value={form.lastName} onChange={handleChange} required />
      </label>
      <label>
        Вік
        <input
          name="age"
          type="number"
          min="14"
          max="120"
          value={form.age}
          onChange={handleChange}
          placeholder="Введіть вік"
        />
      </label>
      <label>
        Email (не редагується)
        <input value={user.email} disabled />
      </label>

      <button className="submit-btn" disabled={saving}>
        {saving ? "Збереження..." : "Зберегти"}
      </button>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );
}