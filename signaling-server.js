// запуск: node signaling-server.js
import { WebSocketServer } from "ws";

const PORT = 4444;
const wss = new WebSocketServer({ port: PORT });

const topics = new Map();

const send = (conn, message) => {
  if (conn.readyState !== 1) return;
  try {
    conn.send(JSON.stringify(message));
  } catch {
    conn.close();
  }
};

wss.on("connection", (conn) => {
  const subscribedTopics = new Set();
  let closed = false;
  let pongReceived = true;

  const pingInterval = setInterval(() => {
    if (!pongReceived) {
      conn.close();
      clearInterval(pingInterval);
    } else {
      pongReceived = false;
      try {
        conn.ping();
      } catch {
        conn.close();
      }
    }
  }, 30000);

  conn.on("pong", () => {
    pongReceived = true;
  });

  conn.on("close", () => {
    subscribedTopics.forEach((topicName) => {
      const subs = topics.get(topicName) || new Set();
      subs.delete(conn);
      if (subs.size === 0) topics.delete(topicName);
    });
    subscribedTopics.clear();
    closed = true;
  });

  conn.on("message", (raw) => {
    if (closed) return;
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (!message || !message.type) return;

    switch (message.type) {
      case "subscribe":
        (message.topics || []).forEach((topicName) => {
          if (typeof topicName !== "string") return;
          let subs = topics.get(topicName);
          if (!subs) {
            subs = new Set();
            topics.set(topicName, subs);
          }
          subs.add(conn);
          subscribedTopics.add(topicName);
        });
        break;
      case "unsubscribe":
        (message.topics || []).forEach((topicName) => {
          const subs = topics.get(topicName);
          if (subs) subs.delete(conn);
        });
        break;
      case "publish":
        if (message.topic) {
          const receivers = topics.get(message.topic);
          if (receivers) {
            receivers.forEach((r) => send(r, message));
          }
        }
        break;
      case "ping":
        send(conn, { type: "pong" });
        break;
    }
  });
});

console.log(`Y-WebRTC signaling server running on ws://localhost:${PORT}`);