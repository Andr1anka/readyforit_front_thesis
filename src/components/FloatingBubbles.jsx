export default function FloatingBubbles() {
  return (
    <div className="bubbles">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={`bubble bubble-${index + 1}`} />
      ))}
    </div>
  );
}