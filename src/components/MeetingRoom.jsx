import { useState } from "react";
import VideoPanel from "./room/VideoPanel";
import CodeEditor from "./room/CodeEditor";
import ChatPanel from "./room/ChatPanel";
import "../styles/room.css";

const ROOM_ID = "ReadyForIt-Interview-Room";

export default function MeetingRoom({ displayName, onLeave }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="room-layout">
      <div className={"room-stage " + (editorOpen ? "with-editor" : "")}>
        <div className="video-area">
          <VideoPanel
            roomId={ROOM_ID}
            displayName={displayName}
            onHangup={onLeave}
          />
        </div>

        {editorOpen && (
          <div className="editor-pane">
            <div className="overlay-header">
              <span>Live-кодинг</span>
              <button
                className="overlay-close"
                onClick={() => setEditorOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="overlay-body">
              <CodeEditor roomId={ROOM_ID} displayName={displayName} />
            </div>
          </div>
        )}

        {chatOpen && (
          <div className="chat-overlay">
            <ChatPanel
              roomId={ROOM_ID}
              displayName={displayName}
              onClose={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>

      <footer className="room-controls">
        <button
          className={"ctrl-btn " + (editorOpen ? "active" : "")}
          onClick={() => setEditorOpen((v) => !v)}
          title="Редактор коду"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 6L2 12L8 18M16 6L22 12L16 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Редактор</span>
        </button>

        <button
          className={"ctrl-btn " + (chatOpen ? "active" : "")}
          onClick={() => setChatOpen((v) => !v)}
          title="Чат"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Чат</span>
        </button>

        <button
          className="ctrl-btn hangup"
          onClick={onLeave}
          title="Завершити дзвінок"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 16.92V19.92C22 20.97 21.14 21.83 20.09 21.78C9.51 21.27 1 13.51 0.5 4.78C0.45 3.73 1.31 2.87 2.36 2.87H5.36C6.24 2.87 7.01 3.49 7.18 4.36L7.92 8.08C8.06 8.78 7.83 9.5 7.31 9.99L5.79 11.51C7.27 14.27 9.61 16.61 12.37 18.09L13.89 16.57C14.38 16.05 15.1 15.82 15.8 15.96L19.52 16.7C20.39 16.87 21.01 17.64 21.01 18.52V16.92H22Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </footer>
    </div>
  );
}