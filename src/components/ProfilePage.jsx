import { useEffect, useState } from "react";
import { getMyProfile, uploadAvatar } from "../api/profileApi";
import Header from "./layout/Header";
import Avatar from "./Avatar";
import PersonalInfoTab from "./profile/PersonalInfoTab";
import SecurityTab from "./profile/SecurityTab";
import VerificationTab from "./profile/VerificationTab";
import InterviewerTab from "./profile/InterviewerTab";
import WalletTab from "./profile/WalletTab";

const TABS = [
  { key: "info", label: "Особисті дані" },
  { key: "security", label: "Безпека" },
  { key: "verification", label: "Верифікація" },
  { key: "interviewer", label: "Інтерв'юер" },
  { key: "wallet", label: "Гаманець" },
];

export default function ProfilePage({ onLogout, onNavigate, current }) {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarBlobUrl, setAvatarBlobUrl] = useState(null);

  const loadAvatar = async (relativeUrl) => {
    try {
      const fullUrl = (import.meta.env.VITE_API_URL || "") + relativeUrl;
      const token = localStorage.getItem("token");
      const res = await fetch(fullUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      setAvatarBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (err) {
      console.warn("Не вдалося завантажити аватар", err);
    }
  };

  const loadProfile = async () => {
    try {
      const data = await getMyProfile();
      setUser(data);
      if (data.hasCustomAvatar) {
        loadAvatar(data.avatarUrl);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Не вдалося завантажити профіль");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    return () => {
      setAvatarBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
    // eslint-disable-next-line
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      if (updated.hasCustomAvatar) loadAvatar(updated.avatarUrl);
    } catch (err) {
      alert(err.response?.data?.message || "Не вдалося завантажити аватар");
    }
  };

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />

      {loading ? (
        <div className="profile-loading">Завантаження...</div>
      ) : error ? (
        <div className="error-message" style={{ margin: 40 }}>{error}</div>
      ) : user ? (
        <main className="profile-page">
          <header className="profile-header">
            <div className="profile-avatar-wrap">
              <Avatar user={user} size={140} src={avatarBlobUrl} />
              <label className="avatar-upload-btn" title="Завантажити нове фото">
                📷
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  hidden
                />
              </label>
            </div>
            <div className="profile-summary">
              <h1>
                {user.firstName} {user.lastName}
              </h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-badges">
                <span className={`badge badge-role role-${user.role.toLowerCase()}`}>
                  {roleLabel(user.role)}
                </span>
                {user.isVerificated && (
                  <span className="badge badge-verified">✓ Верифіковано</span>
                )}
                {user.interviewerRequestStatus === "PENDING" && (
                  <span className="badge badge-pending">
                    Заявку на інтерв'юера подано
                  </span>
                )}
              </div>
            </div>
          </header>

          <nav className="profile-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "active" : ""}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <section className="profile-content">
            {tab === "info" && <PersonalInfoTab user={user} onUpdated={setUser} />}
            {tab === "security" && <SecurityTab />}
            {tab === "verification" && (
              <VerificationTab user={user} onChange={loadProfile} />
            )}
            {tab === "interviewer" && (
              <InterviewerTab user={user} onChange={loadProfile} />
            )}
            {tab === "wallet" && <WalletTab user={user} />}
          </section>
        </main>
      ) : null}
    </>
  );
}

function roleLabel(role) {
  switch (role) {
    case "USER":
      return "Користувач";
    case "REQUEST_FOR_INTERVIEWER":
      return "Заявка на інтерв'юера";
    case "INTERVIEWER":
      return "Інтерв'юер";
    case "ADMIN":
      return "Адміністратор";
    default:
      return role;
  }
}