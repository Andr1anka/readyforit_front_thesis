import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export default function ChatPanel({ roomId, displayName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const yarrayRef = useRef(null);
  const providerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(`${roomId}-chat`, ydoc, {
      signaling: ["ws://localhost:4444"],
    });
    const yarray = ydoc.getArray("messages");

    yarrayRef.current = yarray;
    providerRef.current = provider;

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || !yarrayRef.current) return;
    yarrayRef.current.push([
      { author: displayName, text: trimmed, at: Date.now() },
    ]);
    setText("");
  };

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <span>Чат</span>
        <button className="chat-close" onClick={onClose}>×</button>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              "chat-msg " + (m.author === displayName ? "own" : "")
            }
          >
            <div className="chat-author">{m.author}</div>
            <div className="chat-text">{m.text}</div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="chat-empty">Повідомлень ще немає</div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Напишіть повідомлення..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send}>↵</button>
      </div>
    </aside>
  );
}