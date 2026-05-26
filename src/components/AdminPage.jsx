import { useEffect, useState } from "react";
import Header from "./layout/Header";
import {
  adminGetComplaints,
  adminResolveComplaint,
  adminGetUsers,
  adminSetBlocked,
  adminGetRequests,
  adminDecideRequest,
  adminGetVerifications,
  adminDecideVerification,
} from "../api/adminApi";

export default function AdminPage({ onLogout, onNavigate, current }) {
  const [tab, setTab] = useState("requests");

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />

      <main className="adm-page">
        <h1>Панель адміністратора</h1>

        <nav className="adm-tabs">
          <button
            className={tab === "requests" ? "active" : ""}
            onClick={() => setTab("requests")}
          >
            Заявки
          </button>

          <button
            className={tab === "complaints" ? "active" : ""}
            onClick={() => setTab("complaints")}
          >
            Скарги
          </button>

          <button
            className={tab === "verifications" ? "active" : ""}
            onClick={() => setTab("verifications")}
          >
            Верифікація
          </button>

          <button
            className={tab === "users" ? "active" : ""}
            onClick={() => setTab("users")}
          >
            Користувачі
          </button>
        </nav>

        {tab === "requests" && <RequestsTab />}
        {tab === "complaints" && <ComplaintsTab />}
        {tab === "verifications" && <VerificationsTab />}
        {tab === "users" && <UsersTab />}
      </main>
    </>
  );
}

/* ---------------- Заявки ---------------- */

function RequestsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = () => {
    setLoading(true);

    adminGetRequests()
      .then(setItems)
      .catch((e) => setError(msg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const decide = async (id, approve) => {
    const comment = approve
      ? null
      : window.prompt("Причина відмови (необовʼязково):") || null;

    try {
      await adminDecideRequest(id, approve, comment);
      load();
    } catch (e) {
      alert(msg(e));
    }
  };

  const openProofPreview = async (requestId, index) => {
    try {
      setPreviewLoading(true);

      const token = localStorage.getItem("token");

      const url =
        `${import.meta.env.VITE_API_URL}` +
        `/admin/requests/${requestId}/proofs/${index}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Не вдалося відкрити файл");
      }

      const contentType = res.headers.get("Content-Type") || "";
      const blob = await res.blob();

      const fixedBlob = new Blob([blob], {
        type: contentType || blob.type || "application/octet-stream",
      });

      const blobUrl = URL.createObjectURL(fixedBlob);

      setPreview({
        url: blobUrl,
        type: contentType || blob.type || "",
        name: `Файл ${index + 1}`,
      });
    } catch (e) {
      alert(e.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }

    setPreview(null);
  };

  if (loading) return <Loading />;
  if (error) return <Err msg={error} />;
  if (!items.length) return <Empty text="Немає заявок на розгляді." />;

  return (
    <>
      <div className="adm-list">
        {items.map((r) => (
          <div key={r.id} className="adm-card">
            <div className="adm-card-head">
              <strong>
                {r.firstName} {r.lastName}
              </strong>

              <span className="adm-muted">{r.email}</span>
            </div>

            <div className="adm-fields">
              <div>
                <b>Спеціалізація:</b> {r.specialization || "—"}
              </div>

              <div>
                <b>Досвід:</b> {r.yearsOfExperience ?? "—"} р.
              </div>

              {r.experienceDescription && (
                <div>
                  <b>Опис:</b> {r.experienceDescription}
                </div>
              )}

              {r.externalLinks && (
                <div>
                  <b>Посилання:</b> {r.externalLinks}
                </div>
              )}

              {r.proofObjectKeys?.length > 0 && (
                <div>
                  <b>Підтверджень:</b> {r.proofObjectKeys.length} файл(ів)

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {r.proofObjectKeys.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        className="ghost-btn"
                        disabled={previewLoading}
                        onClick={() => openProofPreview(r.id, index)}
                      >
                        📄 Переглянути файл {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="adm-actions">
              <button
                className="submit-btn"
                style={{ width: "auto" }}
                onClick={() => decide(r.id, true)}
              >
                Схвалити
              </button>

              <button
                className="ghost-btn danger"
                onClick={() => decide(r.id, false)}
              >
                Відхилити
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <FilePreviewModal preview={preview} onClose={closePreview} />
      )}
    </>
  );
}

/* ---------------- Preview Modal ---------------- */

function FilePreviewModal({ preview, onClose }) {
  const type = preview.type || "";

  const isImage = type.includes("image");
  const isPdf = type.includes("pdf");

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <strong>{preview.name}</strong>

          <button type="button" className="ghost-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={styles.previewBody}>
          {isImage ? (
            <img
              src={preview.url}
              alt={preview.name}
              style={styles.image}
            />
          ) : isPdf ? (
            <iframe
              src={preview.url}
              title={preview.name}
              style={styles.frame}
            />
          ) : (
            <div className="info-message">
              Цей тип файлу браузер не може показати прямо на сайті.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Скарги ---------------- */

function ComplaintsTab() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = (st) => {
    setLoading(true);

    adminGetComplaints(st)
      .then(setItems)
      .catch((e) => setError(msg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(status), [status]);

  const resolve = async (id, accept) => {
    const comment = window.prompt("Коментар (необовʼязково):") || null;

    try {
      await adminResolveComplaint(id, accept, comment);
      load(status);
    } catch (e) {
      alert(msg(e));
    }
  };

  return (
    <div>
      <div className="adm-filter">
        <span>Статус:</span>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">На розгляді</option>
          <option value="RESOLVED">Вирішені</option>
          <option value="REJECTED">Відхилені</option>
          <option value="ALL">Усі</option>
        </select>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <Err msg={error} />
      ) : !items.length ? (
        <Empty text="Немає скарг." />
      ) : (
        <div className="adm-list">
          {items.map((c) => (
            <div key={c.id} className="adm-card">
              <div className="adm-card-head">
                <strong>{c.title || "Скарга"}</strong>

                <span className={`rv-status ${c.status}`}>
                  {cStatus(c.status)}
                </span>
              </div>

              <div className="adm-muted">
                На {c.accusedFirstName} {c.accusedLastName} · {c.lessonTitle} ·{" "}
                {c.createdAt}
              </div>

              <p className="adm-text">{c.description}</p>

              {c.adminComment && (
                <div className="adm-note">
                  <b>Ваш коментар:</b> {c.adminComment}
                </div>
              )}

              {c.status === "OPEN" && (
                <div className="adm-actions">
                  <button
                    className="submit-btn"
                    style={{ width: "auto" }}
                    onClick={() => resolve(c.id, true)}
                  >
                    Вирішити
                  </button>

                  <button
                    className="ghost-btn danger"
                    onClick={() => resolve(c.id, false)}
                  >
                    Відхилити
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Верифікація ---------------- */

function VerificationsTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);

    adminGetVerifications()
      .then(setItems)
      .catch((e) => setError(msg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const decide = async (id, approve) => {
    try {
      await adminDecideVerification(id, approve);
      load();
    } catch (e) {
      alert(msg(e));
    }
  };

  if (loading) return <Loading />;
  if (error) return <Err msg={error} />;
  if (!items.length) {
    return <Empty text="Немає запитів на ручну верифікацію." />;
  }

  return (
    <div className="adm-list">
      {items.map((u) => (
        <div key={u.id} className="adm-card">
          <div className="adm-card-head">
            <strong>
              {u.firstName} {u.lastName}
            </strong>

            <span className="adm-muted">{u.email}</span>
          </div>

          <div className="adm-muted">
            Статус верифікації: {u.verificationStatus}
          </div>

          <div className="adm-actions">
            <button
              className="submit-btn"
              style={{ width: "auto" }}
              onClick={() => decide(u.id, true)}
            >
              Підтвердити
            </button>

            <button
              className="ghost-btn danger"
              onClick={() => decide(u.id, false)}
            >
              Відхилити
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Користувачі ---------------- */

function UsersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);

    adminGetUsers()
      .then(setItems)
      .catch((e) => setError(msg(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (u) => {
    try {
      await adminSetBlocked(u.id, !u.blocked);
      load();
    } catch (e) {
      alert(msg(e));
    }
  };

  if (loading) return <Loading />;
  if (error) return <Err msg={error} />;

  const filtered = items.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  return (
    <div>
      <input
        className="adm-search"
        placeholder="Пошук користувача..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="adm-table">
        <div className="adm-tr adm-th">
          <span>Імʼя</span>
          <span>Email</span>
          <span>Роль</span>
          <span>Статус</span>
          <span></span>
        </div>

        {filtered.map((u) => (
          <div key={u.id} className="adm-tr">
            <span>
              {u.firstName} {u.lastName}
            </span>

            <span className="adm-muted">{u.email}</span>

            <span>{u.role}</span>

            <span>
              {u.blocked ? (
                <em className="adm-blocked">Заблокований</em>
              ) : (
                "Активний"
              )}
            </span>

            <span>
              {u.role !== "ADMIN" && (
                <button
                  className={
                    u.blocked ? "ghost-btn small" : "ghost-btn small danger"
                  }
                  onClick={() => toggle(u)}
                >
                  {u.blocked ? "Розблокувати" : "Заблокувати"}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function Loading() {
  return <div className="il-loading">Завантаження...</div>;
}

function Err({ msg }) {
  return <div className="error-message">{msg}</div>;
}

function Empty({ text }) {
  return <div className="info-message">{text}</div>;
}

function msg(e) {
  return e.response?.data?.message || "Сталася помилка";
}

function cStatus(s) {
  return (
    {
      OPEN: "На розгляді",
      RESOLVED: "Вирішено",
      REJECTED: "Відхилено",
    }[s] || s
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(20, 20, 30, 0.55)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  modal: {
    width: "min(1000px, 95vw)",
    height: "min(760px, 90vh)",
    background: "#fff",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  previewBody: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 16,
  },

  frame: {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: 16,
  },
};