import { useEffect } from "react";

export default function VideoPanel({ roomId, displayName, onHangup }) {
  const config = {
    // prejoin тепер УВІМКНЕНО — користувач сам натискає Join Meeting
    "config.startWithAudioMuted": "true",
    "config.startWithVideoMuted": "false",
    "config.disableDeepLinking": "true",
    "config.requireDisplayName": "false",
    "config.disableProfile": "true",
    "userInfo.displayName": JSON.stringify(displayName || "Учасник"),
    "interfaceConfig.MOBILE_APP_PROMO": "false",
    "interfaceConfig.SHOW_JITSI_WATERMARK": "false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS": "false",
    "interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE": "false",
    "interfaceConfig.HIDE_INVITE_MORE_HEADER": "true",
  };

  const params = new URLSearchParams(config);
  const src = `https://meet.jit.si/${encodeURIComponent(roomId)}#${params.toString()}`;

  useEffect(() => {
    const onMessage = (event) => {
      if (!event.data) return;
      let payload = event.data;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { return; }
      }
      if (
        payload?.type === "video-conference-left" ||
        payload?.event === "video-conference-left" ||
        payload?.name === "video-conference-left" ||
        payload?.eventName === "video-conference-left"
      ) {
        if (onHangup) onHangup();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onHangup]);

  return (
    <iframe
      src={src}
      allow="camera; microphone; display-capture; autoplay; clipboard-write"
      className="jitsi-iframe"
      title="Jitsi Meeting"
    />
  );
}