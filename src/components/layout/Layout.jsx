import Header from "./Header";
import Footer from "./Footer";

export default function Layout({
  children,
  onLogout,
}) {
  return (
    <>
      <Header onLogout={onLogout} />

      {children}

      <Footer />
    </>
  );
}