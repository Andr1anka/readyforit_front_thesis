import { useEffect, useState } from "react";
import { getPaymentHistory, initTopup } from "../../api/profileApi";

export default function WalletTab({ user }) {
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try {
      setHistory(await getPaymentHistory());
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    if (!value || value < 10) {
      setError("Мінімальна сума 10");
      return;
    }
    try {
      setSubmitting(true);
      const { data, signature, checkoutUrl } = await initTopup(value);
      // Створюємо приховану форму і саме її submit'ом редіректимо на LiqPay.
      // LiqPay приймає лише POST з полями data + signature.
      const formEl = document.createElement("form");
      formEl.method = "POST";
      formEl.action = checkoutUrl;
      formEl.acceptCharset = "utf-8";

      const dataInput = document.createElement("input");
      dataInput.type = "hidden";
      dataInput.name = "data";
      dataInput.value = data;
      formEl.appendChild(dataInput);

      const sigInput = document.createElement("input");
      sigInput.type = "hidden";
      sigInput.name = "signature";
      sigInput.value = signature;
      formEl.appendChild(sigInput);

      document.body.appendChild(formEl);
      formEl.submit();
    } catch (err) {
      setError(err.response?.data?.message || "Не вдалося ініціювати платіж");
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-form">
      <div className="balance-card">
        <div className="balance-label">Поточний баланс</div>
        <div className="balance-amount">
          {Number(user.balance ?? 0).toFixed(2)} ₴
        </div>
      </div>

      <form onSubmit={handleTopup} className="topup-form">
        <h3>Поповнити баланс</h3>
        <p className="hint">
          Дані вашої картки вводяться на захищеній сторінці LiqPay. Ми не маємо доступу
          до номера картки чи CVV.
        </p>
        <label>
          Сума (UAH)
          <input
            type="number"
            min="10"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Наприклад: 200"
            required
          />
        </label>
        <button className="submit-btn" disabled={submitting}>
          {submitting ? "Перенаправлення..." : "Поповнити через LiqPay"}
        </button>
        {error && <div className="error-message">{error}</div>}
      </form>

      <h3 style={{ marginTop: 30 }}>Історія платежів</h3>
      {history.length === 0 ? (
        <p className="hint">Транзакцій ще немає.</p>
      ) : (
        <div className="payment-history">
          {history.map((h) => (
            <div key={h.orderId} className={`payment-row status-${h.status.toLowerCase()}`}>
              <div className="payment-amount">
                {h.amount} {h.currency}
              </div>
              <div className="payment-meta">
                <span className={`badge badge-${h.status.toLowerCase()}`}>{h.status}</span>
                {h.cardLast4 && <span>•••• {h.cardLast4}</span>}
                <span>{formatDate(h.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA") + " " + d.toLocaleTimeString("uk-UA", {
    hour: "2-digit", minute: "2-digit",
  });
}