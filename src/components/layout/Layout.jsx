import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children, onLogout }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header onLogout={onLogout} />

      <div style={{ flex: 1, position: "relative" }}>
        {children}
      </div>

      <Footer />
    </div>
  );
}