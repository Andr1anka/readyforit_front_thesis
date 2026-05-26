import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Керування локальним медіапотоком: вмикання камери/мікрофона,
 * перемикання (mute/cam off), вибір пристроїв. Самодостатній (getUserMedia),
 * не залежить від WebRTC — використовується і для прев'ю, і під час дзвінка.
 */
export function useLocalMedia() {
  const [stream, setStream] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [devices, setDevices] = useState({ cams: [], mics: [] });
  const [selected, setSelected] = useState({ camId: "", micId: "" });
  const [error, setError] = useState("");
  const streamRef = useRef(null);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const start = useCallback(async (constraintsOverride) => {
    setError("");
    try {
      // зупиняємо попередній потік перед новим
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const constraints = constraintsOverride || {
        video: selected.camId ? { deviceId: { exact: selected.camId } } : true,
        audio: selected.micId ? { deviceId: { exact: selected.micId } } : true,
      };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      setStream(s);
      // застосувати поточні стани вкл/викл
      s.getVideoTracks().forEach((t) => (t.enabled = camOn));
      s.getAudioTracks().forEach((t) => (t.enabled = micOn));

      // оновити список пристроїв (мітки доступні лише після дозволу)
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cams: all.filter((d) => d.kind === "videoinput"),
        mics: all.filter((d) => d.kind === "audioinput"),
      });
      return s;
    } catch (e) {
      setError("Не вдалося отримати доступ до камери/мікрофона: " + e.message);
      return null;
    }
  }, [selected.camId, selected.micId, camOn, micOn]);

  const toggleCam = useCallback(() => {
    setCamOn((prev) => {
      const next = !prev;
      streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const toggleMic = useCallback(() => {
    setMicOn((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  }, []);

  const chooseDevice = useCallback((kind, id) => {
    setSelected((prev) => ({ ...prev, [kind === "video" ? "camId" : "micId"]: id }));
  }, []);

  // перезапуск при зміні обраного пристрою
  useEffect(() => {
    if (streamRef.current) start();
    // eslint-disable-next-line
  }, [selected.camId, selected.micId]);

  useEffect(() => () => stop(), [stop]);

  return {
    stream, camOn, micOn, devices, selected, error,
    start, stop, toggleCam, toggleMic, chooseDevice, streamRef,
  };
}
