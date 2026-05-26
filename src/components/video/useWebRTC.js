import { useCallback, useEffect, useRef, useState } from "react";

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:4444";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

function makePeerId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useWebRTC({ room, localStream }) {
  const [status, setStatus] = useState("idle");
  const [remoteStream, setRemoteStream] = useState(null);

  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const peerIdRef = useRef(makePeerId());
  const retryTimerRef = useRef(null);

  const sendSignal = useCallback((payload) => {
    const ws = wsRef.current;
    if (!room || !ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: "publish",
      topic: room,
      from: peerIdRef.current,
      payload,
    }));
  }, [room]);

  const createAndSendOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || pc.signalingState !== "stable") return;

    try {
      makingOfferRef.current = true;
      await pc.setLocalDescription(await pc.createOffer());
      sendSignal({ kind: "sdp", description: pc.localDescription });
    } catch (e) {
      console.error("offer failed", e);
    } finally {
      makingOfferRef.current = false;
    }
  }, [sendSignal]);

  const createPeer = useCallback(() => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({ kind: "ice", candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === "connected") setStatus("connected");
      if (state === "connecting") setStatus("connecting");
      if (state === "disconnected" || state === "closed") setStatus("disconnected");
      if (state === "failed") setStatus("failed");
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce?.();
        createAndSendOffer();
      }
    };

    pc.onnegotiationneeded = async () => {
      await createAndSendOffer();
    };

    return pc;
  }, [createAndSendOffer, localStream, sendSignal]);

  const handleSignal = useCallback(async (message) => {
    if (!message || message.from === peerIdRef.current) return;

    const pc = pcRef.current;
    const payload = message.payload;
    if (!pc || !payload) return;

    try {
      if (payload.kind === "hello") {
        await createAndSendOffer();
        return;
      }

      if (payload.kind === "bye") {
        setRemoteStream(null);
        setStatus("disconnected");
        return;
      }

      if (payload.kind === "sdp") {
        const description = payload.description;
        const offerCollision =
          description.type === "offer" &&
          (makingOfferRef.current || pc.signalingState !== "stable");

        // deterministic tie-breaker: only one side accepts a colliding offer
        const polite = message.from > peerIdRef.current;
        ignoreOfferRef.current = !polite && offerCollision;
        if (ignoreOfferRef.current) return;

        await pc.setRemoteDescription(description);

        if (description.type === "offer") {
          await pc.setLocalDescription(await pc.createAnswer());
          sendSignal({ kind: "sdp", description: pc.localDescription });
        }
        return;
      }

      if (payload.kind === "ice" && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (e) {
          if (!ignoreOfferRef.current) console.warn("ICE candidate failed", e);
        }
      }
    } catch (e) {
      console.error("WebRTC signal handling failed", e);
      setStatus("failed");
    }
  }, [createAndSendOffer, sendSignal]);

  useEffect(() => {
    if (!room || !localStream) return undefined;

    setStatus("connecting");
    setRemoteStream(null);

    const pc = createPeer();
    pcRef.current = pc;

    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;

    const sayHello = () => sendSignal({ kind: "hello" });

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", topics: [room] }));
      // hello надсилаємо кілька разів, бо другий користувач міг ще не встигнути підписатись
      sayHello();
      retryTimerRef.current = window.setInterval(() => {
        if (pc.connectionState !== "connected") sayHello();
        else if (retryTimerRef.current) {
          clearInterval(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      }, 1200);
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.type === "publish" && data.topic === room) {
        handleSignal(data);
      }
    };

    ws.onerror = () => setStatus("failed");
    ws.onclose = () => {
      if (pc.connectionState !== "connected") setStatus("disconnected");
    };

    return () => {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      sendSignal({ kind: "bye" });
      try { ws.send(JSON.stringify({ type: "unsubscribe", topics: [room] })); } catch { /* ignore */ }
      try { ws.close(); } catch { /* ignore */ }
      try { pc.close(); } catch { /* ignore */ }
      wsRef.current = null;
      pcRef.current = null;
      setRemoteStream(null);
    };
  }, [room, localStream, createPeer, handleSignal, sendSignal]);

  const hangup = useCallback(() => {
    sendSignal({ kind: "bye" });
    try { wsRef.current?.close(); } catch { /* ignore */ }
    try { pcRef.current?.close(); } catch { /* ignore */ }
    setRemoteStream(null);
    setStatus("disconnected");
  }, [sendSignal]);

  return { status, remoteStream, hangup };
}
