import { useEffect, useState } from "react";

const PALETTE = [
  ["#afa3d6", "#d5ceec"],
  ["#a3c4d6", "#cee6ec"],
  ["#d6a3c4", "#ecceda"],
  ["#a3d6b1", "#ceecd0"],
  ["#d6c4a3", "#ecdcce"],
];

function pickGradient(seed) {
  if (!seed) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({ user, size = 120, src = null }) {
  const [errored, setErrored] = useState(false);
  
  const [blobSrc, setBlobSrc] = useState(null);

useEffect(() => {
  if (!src) return;

  const token = localStorage.getItem("token");

  fetch(src, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
    .then((res) => {
      if (!res.ok) throw new Error("Avatar load failed");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      setBlobSrc(url);
    })
    .catch(() => setErrored(true));

  return () => {
    if (blobSrc) URL.revokeObjectURL(blobSrc);
  };
}, [src]);
  const showImage = blobSrc && !errored;

  if (showImage) {
    return (
      <img
        src={blobSrc}
        alt="avatar"
        width={size}
        height={size}
        onError={() => setErrored(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  const initials = (user?.initials || "").slice(0, 2) || "?";
  const seed = (user?.firstName || "") + (user?.lastName || "") + (user?.email || "");
  const [c1, c2] = pickGradient(seed);
  const gradientId = `g-${seed.replace(/[^a-z0-9]/gi, "").slice(0, 16) || "x"}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ borderRadius: "50%", display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="60" fill={`url(#${gradientId})`} />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontFamily="Inter, Arial, sans-serif"
        fontWeight="700"
        fontSize="46"
      >
        {initials}
      </text>
    </svg>
  );
}