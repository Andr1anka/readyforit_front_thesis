import { useState } from "react";
import { loginUser, registerUser, forgotPassword, resetPassword } from "../api/authApi";
import FloatingBubbles from "./FloatingBubbles";
import CatAnimation from "./CatAnimation";


export default function AuthPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("resetToken") || "";
});

const isForgot = mode === "forgot";
const isReset = mode === "reset" || !!resetToken;

  const isRegister = mode === "register";
  const isLogin = mode === "login";

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    if (isForgot) {
       try {
         setLoading(true);
         await forgotPassword(form.email);
         setMessage("Ми надіслали посилання для відновлення паролю на вашу пошту.");
       } catch (err) {
         setError(err.response?.data?.message || "Не вдалося надіслати лист.");
       } finally {
         setLoading(false);
       }
       return;
      }

      if (isReset) {
       if (form.password !== form.confirmPassword) {
         setError("Паролі не співпадають");
         return;
       }
     
       try {
         setLoading(true);
         await resetPassword(resetToken, form.password);
         setMessage("Пароль успішно змінено. Тепер можете увійти.");
         setResetToken("");
         setMode("login");
         window.history.replaceState({}, document.title, window.location.pathname);
       } catch (err) {
         setError(err.response?.data?.message || "Не вдалося змінити пароль.");
       } finally {
         setLoading(false);
       }
       return;
      }

    if (isRegister && form.password !== form.confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        await registerUser({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
        });

        setMessage(
          "Реєстрація успішна! Ми надіслали лист підтвердження на вашу пошту. Посилання діє обмежений час."
        );
      } else {
        const data = await loginUser({
            email: form.email,
            password: form.password,
            });

            /* збереження JWT token */
        localStorage.setItem("token", data.token);
        localStorage.setItem("firstName", data.firstName || "");
        localStorage.setItem("lastName", data.lastName || "");
        localStorage.setItem("role", data.role || "USER");

            /* повідомлення */
        setMessage(data.message || "Вхід виконано успішно!");

        console.log("TOKEN:", data.token);
        console.log("USER:", data);
        if (onLoginSuccess) onLoginSuccess();
        }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Щось пішло не так. Перевірте дані та спробуйте ще раз."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <FloatingBubbles />

      <section className="auth-wrapper">
        <div className="auth-left">
            <div className="cat-bubble">
                <CatAnimation />
            </div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
            >
              Вхід
            </button>

            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
            >
              Реєстрація
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                  <label>
                    Імʼя
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Введіть імʼя"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    Прізвище
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Введіть прізвище"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                    />
                  </label>
                </>
            )}           


            <label>
              Електронна пошта
              <input
                type="email"
                name="email"
                placeholder="Введіть електронну пошту"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>


            {!isForgot && (
              <label>
                {isReset ? "Новий пароль" : "Пароль"}
                <input
                  type="password"
                  name="password"
                  placeholder={isReset ? "Введіть новий пароль" : "Введіть пароль"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </label>
            )}

            {(isRegister || isReset) && (
              <label>
                Повторіть пароль
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Повторіть пароль"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </label>
            )}

           <button className="submit-btn" type="submit" disabled={loading}>
  {loading
    ? "Зачекайте..."
    : isForgot
    ? "Надіслати лист"
    : isReset
    ? "Змінити пароль"
    : isRegister
    ? "Зареєструватися"
    : "Увійти"}
</button>
          </form>
          {isLogin && (
  <button
    type="button"
    className="auth-link-btn"
    onClick={() => {
      setMode("forgot");
      setError("");
      setMessage("");
    }}
  >
    Забули пароль?
  </button>
)}

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <p className="auth-switch">
            {isRegister ? "Вже маєте акаунт?" : "Ще немає акаунта?"}{" "}
            <button onClick={() => setMode(isRegister ? "login" : "register")}>
              {isRegister ? "Увійти" : "Зареєструватися"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}