export default function BackgroundBubbles() {
  return (
    <div className="global-bubbles" aria-hidden="true">
      {Array.from({ length: 11 }, (_, i) => (
        <span key={i} className={`global-bubble bubble-${i + 1}`} />
      ))}
    </div>
  );
}