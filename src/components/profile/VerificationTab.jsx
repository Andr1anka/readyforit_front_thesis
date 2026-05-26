import { useEffect, useState } from "react";
import {
  getVerificationStatus,
  submitVerification,
  escalateVerification,
} from "../../api/profileApi";
import CameraCapture from "../CameraCapture";

export default function VerificationTab({ user, onChange }) {
  const [status, setStatus] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [escalating, setEscalating] = useState(false);

  const loadStatus = async () => {
    const s = await getVerificationStatus();
    setStatus(s);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!documentFile) return setError("Завантажте фото документу");
    if (!selfieBlob) return setError("Зробіть селфі через камеру");

    try {
      setSubmitting(true);
      const result = await submitVerification(documentFile, selfieBlob);
      setStatus(result);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || "Помилка верифікації");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setEscalating(true);
      await escalateVerification();
      await loadStatus();
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося передати адміну");
    } finally {
      setEscalating(false);
    }
  };

  // === Стан: вже верифікований ===
 if (user.isVerificated || user.verificated) {
    return (
      <div className="profile-form">
        <div className="success-message">
          ✓ Ваш акаунт верифіковано. Ви можете подавати заявку на інтерв'юера.
        </div>
      </div>
    );
  }

  // === Стан: на ручному розгляді ===
  if (status?.status === "ESCALATED") {
    return (
      <div className="profile-form">
        <div className="info-message">
          Вашу справу передано адміністратору. Очікуйте на рішення — ми надішлемо email.
        </div>
      </div>
    );
  }

  return (
    <div className="profile-form">
      <h3>Верифікація особи (KYC)</h3>
      <p className="hint">
        Перед верифікацією завантажте фото профілю. Потім завантажте фото паспорта або ID-картки та зробіть селфі. Система звірить ваше обличчя
        та ім'я з документом.
      </p>

      <label>
        Фото документу
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
        />
      </label>

      <div className="selfie-section">
        <div className="row-between">
          <span>Селфі</span>
          {!showCamera && !selfieBlob && (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setShowCamera(true)}
            >
              Відкрити камеру
            </button>
          )}
          {selfieBlob && (
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setSelfieBlob(null);
                setShowCamera(true);
              }}
            >
              Перезняти
            </button>
          )}
        </div>

        {showCamera && (
          <CameraCapture
            onCapture={(blob) => {
              setSelfieBlob(blob);
              setShowCamera(false);
            }}
            onCancel={() => setShowCamera(false)}
          />
        )}

        {selfieBlob && (
          <img
            src={URL.createObjectURL(selfieBlob)}
            alt="selfie preview"
            className="selfie-preview"
          />
        )}
      </div>

      <button
        type="button"
        className="submit-btn"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? "Перевірка..." : "Надіслати на верифікацію"}
      </button>

      {error && <div className="error-message">{error}</div>}

      {status && status.status === "REJECTED" && (
        <div className="rejected-block">
          <div className="error-message">
            Автоматична верифікація не пройдена.
            {status.faceSimilarity !== null && (
              <div>Подібність обличчя: {(status.faceSimilarity * 100).toFixed(1)}%</div>
            )}
            {status.nameMatch === false && <div>Імʼя на документі не співпало</div>}
          </div>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleEscalate}
            disabled={escalating}
          >
            {escalating ? "..." : "Передати справу адміністратору"}
          </button>
        </div>
      )}
    </div>
  );
}