import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:4444";

export default function ChatPanel({ roomId, displayName, participantId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const yarrayRef = useRef(null);
  const scrollRef = useRef(null);

  const me = useMemo(() => participantId || getStableClientId(), [participantId]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(`${roomId}-chat`, ydoc, {
      signaling: [SIGNALING_URL],
    });
    const yarray = ydoc.getArray("messages");
    yarrayRef.current = yarray;

    const update = () => setMessages(yarray.toArray());
    yarray.observe(update);
    update();

    return () => {
      yarray.unobserve(update);
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !yarrayRef.current) return;

    yarrayRef.current.push([{
      senderId: me,
      author: displayName || "Учасник",
      text: trimmed,
      at: Date.now(),
    }]);
    setText("");
  };

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <span>Чат</span>
        <button className="chat-close" onClick={onClose}>×</button>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => {
          const own = m.senderId === me;
          return (
            <div key={`${m.at || i}-${i}`} className={`chat-row ${own ? "own" : "other"}`}>
              <div className="chat-msg">
                <div className="chat-author">{own ? "Ви" : (m.author || "Учасник")}</div>
                <div className="chat-text">{m.text}</div>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <div className="chat-empty">Повідомлень ще немає</div>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Напишіть повідомлення..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button onClick={send}>↵</button>
      </div>
    </aside>
  );
}

function getStableClientId() {
  const key = "rfi_chat_client_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}
