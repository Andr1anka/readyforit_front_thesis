import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Прямий WebRTC peer-to-peer дзвінок (1:1) через наявний signaling-server.js
 * (ws://localhost:4444, протокол subscribe/publish по топіку).
 *
 * Кожна кімната = topic (link уроку). Обидва учасники підписуються на топік і
 * обмінюються offer/answer/ICE через publish. Використано patterns "perfect
 * negotiation" (polite/impolite) для уникнення glare.
 *
 * params: { room, localStream, signalingUrl, onRemoteStream, onStatus }
 */
const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:4444";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC({ room, localStream }) {
  const [status, setStatus] = useState("idle"); // idle|connecting|connected|disconnected|failed
  const [remoteStream, setRemoteStream] = useState(null);

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const politeRef = useRef(Math.random() < 0.5); // довільний тай-брейк
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const peerIdRef = useRef(Math.random().toString(36).slice(2));

  const sendSignal = useCallback((payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({
        type: "publish",
        topic: room,
        from: peerIdRef.current,
        payload,
      }));
    }
  }, [room]);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // додаємо локальні треки
    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal({ kind: "ice", candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setStatus("connected");
      else if (st === "disconnected") setStatus("disconnected");
      else if (st === "failed") setStatus("failed");
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        sendSignal({ kind: "sdp", description: pc.localDescription });
      } catch (e) {
        console.error("negotiation error", e);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }, [localStream, sendSignal]);

  const handleSignal = useCallback(async (msg) => {
    // ігноруємо власні повідомлення
    if (!msg || msg.from === peerIdRef.current) return;
    const pc = pcRef.current;
    if (!pc) return;
    const payload = msg.payload;
    if (!payload) return;

    try {
      if (payload.kind === "sdp") {
        const description = payload.description;
        const polite = politeRef.current;
        const offerCollision =
          description.type === "offer" &&
          (makingOfferRef.current || pc.signalingState !== "stable");

        ignoreOfferRef.current = !polite && offerCollision;
        if (ignoreOfferRef.current) return;

        await pc.setRemoteDescription(description);
        if (description.type === "offer") {
          await pc.setLocalDescription();
          sendSignal({ kind: "sdp", description: pc.localDescription });
        }
      } else if (payload.kind === "ice") {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (e) {
          if (!ignoreOfferRef.current) console.warn("ICE add failed", e);
        }
      } else if (payload.kind === "hello") {
        // Інший учасник щойно приєднався і просить offer. onnegotiationneeded міг
        // спрацювати ще до його підписки, тож надсилаємо offer повторно.
        // Можливі одночасні offer'и обробляє perfect-negotiation на гілці "sdp".
        if (pc.signalingState === "stable") {
          try {
            makingOfferRef.current = true;
            await pc.setLocalDescription(await pc.createOffer());
            sendSignal({ kind: "sdp", description: pc.localDescription });
          } catch (e) {
            console.error("re-offer on hello failed", e);
          } finally {
            makingOfferRef.current = false;
          }
        }
      }
    } catch (e) {
      console.error("signal handling error", e);
    }
  }, [sendSignal]);

  useEffect(() => {
    if (!room || !localStream) return;
    setStatus("connecting");

    const pc = createPeer();
    pcRef.current = pc;

    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", topics: [room] }));
      // сповіщаємо, що ми тут
      sendSignal({ kind: "hello" });
    };

    ws.onmessage = (evt) => {
      let data;
      try { data = JSON.parse(evt.data); } catch { return; }
      if (data.type === "publish" && data.topic === room) {
        handleSignal(data);
      }
    };

    ws.onerror = () => setStatus("failed");
    ws.onclose = () => {
      if (pcRef.current && pcRef.current.connectionState !== "connected") {
        setStatus("disconnected");
      }
    };

    return () => {
      try { ws.send(JSON.stringify({ type: "unsubscribe", topics: [room] })); } catch { /* ignore */ }
      ws.close();
      pc.getSenders().forEach((s) => { try { s.track && s.track.stop(); } catch { /* ignore */ } });
      pc.close();
      pcRef.current = null;
      wsRef.current = null;
      setRemoteStream(null);
    };
  }, [room, localStream, createPeer, handleSignal, sendSignal]);

  const hangup = useCallback(() => {
    try { wsRef.current?.close(); } catch { /* ignore */ }
    try { pcRef.current?.close(); } catch { /* ignore */ }
    setStatus("disconnected");
    setRemoteStream(null);
  }, []);

  return { status, remoteStream, hangup };
}
