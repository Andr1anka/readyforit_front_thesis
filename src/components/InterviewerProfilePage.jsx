import { useEffect, useState } from "react";
import Header from "./layout/Header";
import RichTextEditor from "./interviewer/RichTextEditor";
import TagInput from "./interviewer/TagInput";
import {
  getInterviewerSettings,
  updateInterviewerSettings,
  getLessonTypes,
  createLessonType,
  updateLessonType,
  deleteLessonType,
  previewSlots,
  saveSlots,
  getMySlots,
  deleteSlot,
} from "../api/interviewerApi";

const EMPTY_LESSON = {
  title: "",
  shortDescription: "",
  longDescription: "",
  tags: [],
  price: "",
};

export default function InterviewerProfilePage({ onLogout, onNavigate, current }) {
  const [section, setSection] = useState("settings");

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="profile-page">
        <h1 style={{ marginBottom: 16 }}>Профіль інтерв'юера</h1>

        <nav className="profile-tabs">
          <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}>
            Налаштування
          </button>
          <button className={section === "lessons" ? "active" : ""} onClick={() => setSection("lessons")}>
            Види занять
          </button>
          <button className={section === "slots" ? "active" : ""} onClick={() => setSection("slots")}>
            Розклад / слоти
          </button>
        </nav>

        <section className="profile-content">
          {section === "settings" && <SettingsSection />}
          {section === "lessons" && <LessonTypesSection />}
          {section === "slots" && <SlotsSection />}
        </section>
      </main>
    </>
  );
}

/* ============================ НАЛАШТУВАННЯ ============================ */
function SettingsSection() {
  const [form, setForm] = useState({ plannedSessionDurationMinutes: 60, expectedTimeForBreak: 10 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getInterviewerSettings()
      .then((s) =>
        setForm({
          plannedSessionDurationMinutes: s.plannedSessionDurationMinutes ?? 60,
          expectedTimeForBreak: s.expectedTimeForBreak ?? 10,
        })
      )
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    try {
      setSaving(true);
      await updateInterviewerSettings({
        plannedSessionDurationMinutes: Number(form.plannedSessionDurationMinutes),
        expectedTimeForBreak: Number(form.expectedTimeForBreak),
      });
      setMsg("Збережено");
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Завантаження...</div>;

  return (
    <form className="profile-form" onSubmit={save}>
      <h3>Базові налаштування</h3>
      <p className="hint">
        Ці значення використовуються для нарізання слотів. Базова тривалість застосовується до всіх занять інтерв'юера.
      </p>
      <label>
        Базова тривалість заняття (хв)
        <input
          type="number" min="15" max="480" step="5"
          value={form.plannedSessionDurationMinutes}
          onChange={(e) => setForm((f) => ({ ...f, plannedSessionDurationMinutes: e.target.value }))}
          required
        />
      </label>
      <label>
        Перерва між заняттями (хв)
        <input
          type="number" min="0" max="120" step="5"
          value={form.expectedTimeForBreak}
          onChange={(e) => setForm((f) => ({ ...f, expectedTimeForBreak: e.target.value }))}
          required
        />
      </label>
      <button className="submit-btn" disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</button>
      {msg && <div className="success-message">{msg}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );
}

/* ============================ ВИДИ ЗАНЯТЬ ============================ */
function LessonTypesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | id
  const [form, setForm] = useState(EMPTY_LESSON);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setItems(await getLessonTypes());
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося завантажити");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const startNew = () => { setForm(EMPTY_LESSON); setEditing("new"); setError(""); };
  const startEdit = (it) => {
    setForm({
      title: it.title || "",
      shortDescription: it.shortDescription || "",
      longDescription: it.longDescription || "",
      tags: it.tags || [],
      price: it.price ?? "",
    });
    setEditing(it.id);
    setError("");
  };
  const cancel = () => { setEditing(null); setForm(EMPTY_LESSON); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Вкажіть назву");
    if (!form.shortDescription.trim()) return setError("Вкажіть короткий опис");
    if (form.tags.length === 0) return setError("Додайте хоча б одну мітку");
    if (!form.price || Number(form.price) <= 0) return setError("Вкажіть додатну ціну");

    const payload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription,
      tags: form.tags,
      price: Number(form.price),
      durationMultiplier: 1,
    };
    try {
      setSaving(true);
      if (editing === "new") await createLessonType(payload);
      else await updateLessonType(editing, payload);
      await load();
      cancel();
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Видалити цей вид заняття?")) return;
    try {
      await deleteLessonType(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Не вдалося видалити");
    }
  };

  if (loading) return <div>Завантаження...</div>;

  if (editing) {
    return (
      <form className="profile-form" onSubmit={submit}>
        <h3>{editing === "new" ? "Новий вид заняття" : "Редагування заняття"}</h3>
        <label>
          Назва
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
        </label>
        <label>
          Короткий опис (для картки)
          <input
            value={form.shortDescription}
            onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
            maxLength={255}
            required
          />
        </label>
        <label>Детальний опис</label>
        <RichTextEditor
          value={form.longDescription}
          onChange={(html) => setForm((f) => ({ ...f, longDescription: html }))}
          placeholder="Де навчались, чого навчите, все що захочете вказати..."
        />
        <label>Мітки (спеціалізації)</label>
        <TagInput value={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} />
        <label>
          Ціна (грн)
          <input
            type="number" min="1"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </label>
        <div className="row-buttons">
          <button type="button" className="ghost-btn" onClick={cancel}>Скасувати</button>
          <button className="submit-btn" disabled={saving}>{saving ? "Збереження..." : "Зберегти"}</button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    );
  }

  return (
    <div className="profile-form">
      <div className="row-between">
        <h3 style={{ margin: 0 }}>Мої види занять</h3>
        <button className="submit-btn" style={{ width: "auto" }} onClick={startNew}>+ Додати</button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {items.length === 0 ? (
        <p className="hint">Ще немає жодного виду заняття. Створіть перший.</p>
      ) : (
        <div className="lesson-type-list">
          {items.map((it) => (
            <div key={it.id} className="lesson-type-card">
              <div className="lt-main">
                <div className="lt-title">{it.title}</div>
                <div className="lt-tags">
                  {it.tags.map((t) => <span key={t} className="tag-chip static">{t}</span>)}
                </div>
                <div className="lt-meta">
                  <span>{it.price} грн</span>
                  <span>· {it.effectiveDurationMinutes} хв</span>
                </div>
              </div>
              <div className="lt-actions">
                <button className="ghost-btn small" onClick={() => startEdit(it)}>Редагувати</button>
                <button className="ghost-btn small danger" onClick={() => remove(it.id)}>Видалити</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================ СЛОТИ ============================ */
function SlotsSection() {
  const [saved, setSaved] = useState([]);
  const [gen, setGen] = useState({ date: "", from: "09:00", to: "13:00" });
  const [preview, setPreview] = useState(null); // null | array
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const slots = await getMySlots();
      setSaved(slots);
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося завантажити");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const doPreview = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    const isoDate = parseUaDate(gen.date);
    if (!isoDate) return setError("Вкажіть дату у форматі дд.мм.рррр");
    if (!isValidTime(gen.from) || !isValidTime(gen.to)) return setError("Час має бути у форматі 24 год: гг:хх");
    try {
      setBusy(true);
      const slots = await previewSlots({
        date: isoDate,
        from: gen.from,
        to: gen.to,
        lessonTypeId: null,
      });
      setPreview(slots);
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося згенерувати слоти");
    } finally {
      setBusy(false);
    }
  };

  const removeFromPreview = (idx) => setPreview((p) => p.filter((_, i) => i !== idx));

  const confirmSave = async () => {
    if (!preview || preview.length === 0) return;
    try {
      setBusy(true);
      await saveSlots(preview);
      setPreview(null);
      await load();
      setMsg("Слоти збережено");
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося зберегти слоти");
    } finally {
      setBusy(false);
    }
  };

  const removeSaved = async (id) => {
    try {
      await deleteSlot(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Не вдалося видалити");
    }
  };

  if (loading) return <div>Завантаження...</div>;

  // групуємо збережені слоти по даті
  const byDate = {};
  saved.forEach((s) => { (byDate[s.date] ||= []).push(s); });

  return (
    <div className="profile-form">
      <h3>Згенерувати слоти</h3>
      <p className="hint">
        Вкажіть дату й бажаний проміжок. Слоти завжди нарізаються за базовою тривалістю заняття + перервою.
      </p>
      <form onSubmit={doPreview} className="slot-gen-form">
        <label>
          Дата
          <input
            type="text"
            inputMode="numeric"
            placeholder="дд.мм.рррр"
            value={gen.date}
            onChange={(e) => setGen((g) => ({ ...g, date: e.target.value }))}
            required
          />
        </label>
        <div className="form-row-2">
          <label>
            З
            <input
              type="text"
              inputMode="numeric"
              placeholder="09:00"
              pattern="[0-2][0-9]:[0-5][0-9]"
              value={gen.from}
              onChange={(e) => setGen((g) => ({ ...g, from: e.target.value }))}
              required
            />
          </label>
          <label>
            До
            <input
              type="text"
              inputMode="numeric"
              placeholder="13:00"
              pattern="[0-2][0-9]:[0-5][0-9]"
              value={gen.to}
              onChange={(e) => setGen((g) => ({ ...g, to: e.target.value }))}
              required
            />
          </label>
        </div>
        <button className="submit-btn" disabled={busy}>{busy ? "..." : "Згенерувати"}</button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {msg && <div className="success-message">{msg}</div>}

      {preview && (
        <div className="slot-preview">
          <h3 style={{ marginTop: 10 }}>Пропоновані слоти ({preview.length})</h3>
          <div className="slot-grid">
            {preview.map((s, i) => (
              <div key={i} className="slot-cell available">
                <span>{s.startTime}–{s.endTime}</span>
                <button type="button" onClick={() => removeFromPreview(i)} aria-label="Прибрати">×</button>
              </div>
            ))}
          </div>
          <div className="row-buttons">
            <button className="ghost-btn" onClick={() => setPreview(null)}>Скасувати</button>
            <button className="submit-btn" onClick={confirmSave} disabled={busy || preview.length === 0}>
              Зберегти {preview.length} слот(ів)
            </button>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Збережені слоти</h3>
      {saved.length === 0 ? (
        <p className="hint">Слотів ще немає.</p>
      ) : (
        Object.keys(byDate).sort().map((date) => (
          <div key={date} className="saved-day">
            <div className="saved-day-title">{formatDate(date)}</div>
            <div className="slot-grid">
              {byDate[date].map((s) => (
                <div key={s.id} className={`slot-cell ${s.booked ? "booked" : "available"}`}>
                  <span>{s.startTime}–{s.endTime}</span>
                  {!s.booked && (
                    <button type="button" onClick={() => removeSaved(s.id)} aria-label="Видалити">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

function parseUaDate(value) {
  const m = String(value || "").trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (String(d.getDate()).padStart(2, "0") !== dd || String(d.getMonth() + 1).padStart(2, "0") !== mm) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function isValidTime(value) {
  const m = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}
