export default function CatAnimation() {
  return (
    <div className="cat-box">
      <video
        className="cat-video"
        src="/cat/cat.webm"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}