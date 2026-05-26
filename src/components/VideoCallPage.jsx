import { useEffect, useRef, useState } from "react";
import Header from "./layout/Header";
import { useLocalMedia } from "./video/useLocalMedia";
import { useWebRTC } from "./video/useWebRTC";
import { getJoinInfo } from "../api/scheduleApi";

export default function VideoCallPage({ lessonId, onLogout, onNavigate, current }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("lobby"); // lobby | call

  const media = useLocalMedia();

  useEffect(() => {
    getJoinInfo(lessonId)
      .then(setInfo)
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити заняття"))
      .finally(() => setLoading(false));
  }, [lessonId]);

  // у лобі — одразу прев'ю
  useEffect(() => {
    if (phase === "lobby" && !loading && info) {
      media.start();
    }
    // eslint-disable-next-line
  }, [phase, loading, info]);

  if (loading) {
    return (
      <><Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
        <main className="vc-page"><div className="il-loading">Завантаження...</div></main></>
    );
  }
  if (error || !info) {
    return (
      <><Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
        <main className="vc-page">
          <div className="error-message">{error || "Заняття недоступне"}</div>
          <button className="submit-btn" style={{ marginTop: 16 }} onClick={() => onNavigate?.("schedule")}>
            ← До розкладу
          </button>
        </main></>
    );
  }

  return (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="vc-page">
        {phase === "lobby" ? (
          <Lobby
            info={info}
            media={media}
            onJoin={() => setPhase("call")}
            onBack={() => { media.stop(); onNavigate?.("schedule"); }}
          />
        ) : (
          <Call
            info={info}
            media={media}
            onLeave={() => { media.stop(); onNavigate?.("schedule"); }}
          />
        )}
      </main>
    </>
  );
}

/* ------------------- ЛОБІ (прев'ю + налаштування пристроїв) ------------------- */
function Lobby({ info, media, onJoin, onBack }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && media.stream) {
      videoRef.current.srcObject = media.stream;
    }
  }, [media.stream]);

  return (
    <div className="vc-lobby">
      <h1>Готові приєднатись?</h1>
      <p className="hint">
        {info.title} з {info.counterpartFirstName} {info.counterpartLastName}
      </p>
      {!info.joinable && (
        <div className="info-message">
          Вікно приєднання ще не відкрите (доступно за 15 хв до початку). Ви можете перевірити
          камеру й мікрофон зараз.
        </div>
      )}

      <div className="vc-preview">
        <video ref={videoRef} autoPlay playsInline muted className="vc-video local" />
        {!media.camOn && <div className="vc-cam-off">Камера вимкнена</div>}
      </div>

      {media.error && <div className="error-message">{media.error}</div>}

      <div className="vc-controls">
        <button className={`vc-ctrl ${media.micOn ? "" : "off"}`} onClick={media.toggleMic}>
          {media.micOn ? "🎤 Мікрофон" : "🔇 Вимкнено"}
        </button>
        <button className={`vc-ctrl ${media.camOn ? "" : "off"}`} onClick={media.toggleCam}>
          {media.camOn ? "📹 Камера" : "🚫 Камера"}
        </button>
      </div>

      <div className="vc-devices">
        <label>
          Камера
          <select value={media.selected.camId} onChange={(e) => media.chooseDevice("video", e.target.value)}>
            <option value="">За замовчуванням</option>
            {media.devices.cams.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || "Камера"}</option>
            ))}
          </select>
        </label>
        <label>
          Мікрофон
          <select value={media.selected.micId} onChange={(e) => media.chooseDevice("audio", e.target.value)}>
            <option value="">За замовчуванням</option>
            {media.devices.mics.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || "Мікрофон"}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="row-buttons" style={{ marginTop: 18 }}>
        <button className="ghost-btn" onClick={onBack}>Назад</button>
        <button className="submit-btn" style={{ width: "auto" }} disabled={!info.joinable || !media.stream} onClick={onJoin}>
          Приєднатись
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- ДЗВІНОК ------------------------------- */
function Call({ info, media, onLeave }) {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const { status, remoteStream, hangup } = useWebRTC({
    room: info.room,
    localStream: media.stream,
  });

  useEffect(() => {
    if (localRef.current && media.stream) localRef.current.srcObject = media.stream;
  }, [media.stream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const statusLabel = {
    idle: "Підготовка...",
    connecting: "Зʼєднання...",
    connected: "Зʼєднано",
    disconnected: "Співрозмовник відключився",
    failed: "Помилка зʼєднання",
  }[status] || status;

  const leave = () => { hangup(); onLeave(); };

  return (
    <div className="vc-call">
      <div className="vc-call-head">
        <span>{info.title}</span>
        <span className={`vc-status ${status}`}>{statusLabel}</span>
      </div>

      <div className="vc-stage">
        <div className="vc-remote">
          {remoteStream ? (
            <video ref={remoteRef} autoPlay playsInline className="vc-video remote" />
          ) : (
            <div className="vc-waiting">Очікуємо, поки приєднається {info.counterpartFirstName}...</div>
          )}
        </div>
        <div className="vc-local-pip">
          <video ref={localRef} autoPlay playsInline muted className="vc-video local" />
          {!media.camOn && <div className="vc-cam-off small">Камера вимкнена</div>}
        </div>
      </div>

      <div className="vc-controls">
        <button className={`vc-ctrl ${media.micOn ? "" : "off"}`} onClick={media.toggleMic}>
          {media.micOn ? "🎤" : "🔇"}
        </button>
        <button className={`vc-ctrl ${media.camOn ? "" : "off"}`} onClick={media.toggleCam}>
          {media.camOn ? "📹" : "🚫"}
        </button>
        <button className="vc-ctrl leave" onClick={leave}>📞 Завершити</button>
      </div>
    </div>
  );
}
