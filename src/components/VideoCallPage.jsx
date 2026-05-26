import { useEffect, useMemo, useRef, useState } from "react";
import Header from "./layout/Header";
import ChatPanel from "./room/ChatPanel";
import CodeEditor from "./room/CodeEditor";
import { useLocalMedia } from "./video/useLocalMedia";
import { useWebRTC } from "./video/useWebRTC";
import { getJoinInfo } from "../api/scheduleApi";

export default function VideoCallPage({ lessonId, onLogout, onNavigate, current }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("lobby");

  const media = useLocalMedia();

  useEffect(() => {
    getJoinInfo(lessonId)
      .then(setInfo)
      .catch((e) => setError(e.response?.data?.message || "Не вдалося завантажити заняття"))
      .finally(() => setLoading(false));
  }, [lessonId]);

  useEffect(() => {
    if (phase === "lobby" && !loading && info) media.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, loading, info]);

  if (loading) {
    return (
      <>
        <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
        <main className="vc-page"><div className="il-loading">Завантаження...</div></main>
      </>
    );
  }

  if (error || !info) {
    return (
      <>
        <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
        <main className="vc-page">
          <div className="error-message">{error || "Заняття недоступне"}</div>
          <button className="submit-btn" style={{ marginTop: 16 }} onClick={() => onNavigate?.("schedule")}>
            ← До розкладу
          </button>
        </main>
      </>
    );
  }

  return phase === "lobby" ? (
    <>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <main className="vc-page">
        <Lobby
          info={info}
          media={media}
          onJoin={() => setPhase("call")}
          onBack={() => { media.stop(); onNavigate?.("schedule"); }}
        />
      </main>
    </>
  ) : (
    <Call
      info={info}
      media={media}
      current={current}
      onLeave={() => { media.stop(); onNavigate?.("schedule"); }}
    />
  );
}

function Lobby({ info, media, onJoin, onBack }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && media.stream) videoRef.current.srcObject = media.stream;
  }, [media.stream]);

  return (
    <div className="vc-lobby">
      <h1>Готові приєднатись?</h1>
      <p className="hint">
        {info.title} з {info.counterpartFirstName} {info.counterpartLastName}
      </p>

      {!info.joinable && (
        <div className="info-message">
          Вікно приєднання ще не відкрите. Ви можете перевірити камеру й мікрофон зараз.
        </div>
      )}

      <div className="vc-preview">
        <video ref={videoRef} autoPlay playsInline muted className="vc-video local" />
        {!media.camOn && <div className="vc-cam-off">Камера вимкнена</div>}
      </div>

      {media.error && <div className="error-message">{media.error}</div>}

      <div className="vc-controls">
        <button className={`vc-ctrl ${media.micOn ? "" : "off"}`} onClick={media.toggleMic}>
          {media.micOn ? "🎤 Мікрофон" : "🔇 Мікрофон"}
        </button>
        <button className={`vc-ctrl ${media.camOn ? "" : "off"}`} onClick={media.toggleCam}>
          {media.camOn ? "📹 Камера" : "🚫 Камера"}
        </button>
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

function Call({ info, media, current, onLeave }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const localRef = useRef(null);
  const remoteRef = useRef(null);

  const displayName = useMemo(() => {
    const fromCurrent = `${current?.firstName || ""} ${current?.lastName || ""}`.trim();
    if (fromCurrent) return fromCurrent;

    const raw = localStorage.getItem("rfi_user") || localStorage.getItem("user");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        if (name) return name;
        if (user.email) return user.email;
      } catch { /* ignore */ }
    }
    return "Учасник";
  }, [current]);

  const participantId = useMemo(() => {
    if (current?.id) return `user-${current.id}`;
    if (current?.email) return `email-${current.email}`;

    const raw = localStorage.getItem("rfi_user") || localStorage.getItem("user");
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user.id) return `user-${user.id}`;
        if (user.email) return `email-${user.email}`;
      } catch { /* ignore */ }
    }

    const key = "rfi_call_client_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  }, [current]);

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

  const leave = () => {
    hangup();
    onLeave();
  };

  return (
    <main className={`vc-fullscreen ${chatOpen ? "with-chat" : ""} ${codeOpen ? "with-code" : ""}`}>
      <section className="vc-main-panel">
        <header className="vc-topbar">
          <div>
            <strong>{info.title}</strong>
            <span>{info.counterpartFirstName} {info.counterpartLastName}</span>
          </div>
          <span className={`vc-status ${status}`}>{statusLabel}</span>
        </header>

        <div className="vc-stage-full">
          <div className="vc-remote-full">
            {remoteStream ? (
              <video ref={remoteRef} autoPlay playsInline className="vc-video remote" />
            ) : (
              <div className="vc-waiting">Очікуємо, поки приєднається {info.counterpartFirstName}...</div>
            )}
          </div>

          <div className="vc-local-pip-full">
            <video ref={localRef} autoPlay playsInline muted className="vc-video local" />
            {!media.camOn && <div className="vc-cam-off small">Камера вимкнена</div>}
          </div>
        </div>

        <footer className="vc-bottom-controls">
          <button className={`vc-round ${media.micOn ? "" : "off"}`} onClick={media.toggleMic} title="Мікрофон">
            {media.micOn ? "🎤" : "🔇"}
          </button>
          <button className={`vc-round ${media.camOn ? "" : "off"}`} onClick={media.toggleCam} title="Камера">
            {media.camOn ? "📹" : "🚫"}
          </button>
          <button className={`vc-round ${chatOpen ? "active" : ""}`} onClick={() => setChatOpen((v) => !v)} title="Чат">
            💬
          </button>
          <button className={`vc-code-toggle ${codeOpen ? "active" : ""}`} onClick={() => setCodeOpen((v) => !v)}>
            💻 Live coding
          </button>
          <button className="vc-leave" onClick={leave}>📞 Завершити</button>
        </footer>
      </section>

      {codeOpen && (
        <aside className="vc-code-panel">
          <div className="vc-side-header">
            <span>Live-кодинг</span>
            <button onClick={() => setCodeOpen(false)}>×</button>
          </div>
          <CodeEditor roomId={info.room} displayName={displayName} participantId={participantId} />
        </aside>
      )}

      {chatOpen && (
        <aside className="vc-chat-panel">
          <ChatPanel roomId={info.room} displayName={displayName} participantId={participantId} onClose={() => setChatOpen(false)} />
        </aside>
      )}
    </main>
  );
}
