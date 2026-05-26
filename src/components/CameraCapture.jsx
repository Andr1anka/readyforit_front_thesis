import { useEffect, useRef, useState } from "react";

/**
 * Відкриває камеру і повертає Blob через onCapture(blob).
 *
 * Примітка: раніше тут було обмеження за яскравістю кадру — кнопка знімка
 * блокувалась, поки освітлення не перевищить поріг. Воно працювало
 * некоректно (хибно блокувало навіть при нормальному світлі), тому
 * прибрано: тепер знімок можна зробити завжди, коли камера активна.
 */
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let stopped = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError("Не вдалося відкрити камеру: " + e.message);
      }
    }

    start();
    return () => {
      stopped = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    const v = videoRef.current;
    if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(
      (blob) => {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        onCapture(blob);
      },
      "image/jpeg",
      0.92
    );
  };

  const canCapture = ready && !error;

  return (
    <div className="camera-capture">
      {error && <div className="error-message">{error}</div>}
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted className="camera-video" />
      </div>
      <div className="camera-actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Скасувати
        </button>
        <button
          type="button"
          className="submit-btn"
          disabled={!canCapture}
          onClick={handleCapture}
        >
          📸 Зробити знімок
        </button>
      </div>
    </div>
  );
}