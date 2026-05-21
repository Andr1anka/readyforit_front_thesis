import { useEffect, useRef, useState } from "react";

/**
 * Відкриває камеру, постійно вимірює середню яскравість кадру (Y-канал).
 * Кнопка "Зробити знімок" активна тільки якщо яскравість >= порогу.
 * Повертає Blob через onCapture(blob).
 */
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [brightness, setBrightness] = useState(0);
  const [error, setError] = useState("");

  const BRIGHTNESS_THRESHOLD = 90; // 0..255, добре освітлення ≈ 90+

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
        }
        tick();
      } catch (e) {
        setError("Не вдалося відкрити камеру: " + e.message);
      }
    }

    function tick() {
      if (stopped) return;
      const v = videoRef.current;
      const c = canvasRef.current;
      if (v && c && v.readyState >= 2) {
        const w = 80;
        const h = 60;
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.drawImage(v, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // luminance Rec. 601
          const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          sum += y;
          count++;
        }
        setBrightness(Math.round(sum / count));
      }
      requestAnimationFrame(tick);
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

  const canCapture = brightness >= BRIGHTNESS_THRESHOLD && !error;

  return (
    <div className="camera-capture">
      {error && <div className="error-message">{error}</div>}
      <div className="camera-frame">
        <video ref={videoRef} playsInline muted className="camera-video" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        <div className={`brightness-pill ${canCapture ? "ok" : "warn"}`}>
          {canCapture
            ? `✓ Освітлення достатнє (${brightness})`
            : `⚠ Замало світла (${brightness}). Перейдіть до світла.`}
        </div>
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