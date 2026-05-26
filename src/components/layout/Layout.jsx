import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, onLogout, onNavigate, current }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onLogout={onLogout} onNavigate={onNavigate} current={current} />
      <div style={{ flex: 1, position: "relative" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}