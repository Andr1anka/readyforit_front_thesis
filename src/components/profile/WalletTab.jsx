import { useEffect, useState } from "react";
import { getPaymentHistory, initTopup, confirmTopup, confirmPendingTopups } from "../../api/profileApi";

const PENDING_ORDER_KEY = "rfi_pending_topup_order";

export default function WalletTab({ user, onBalanceChange }) {
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");

  const loadHistory = async () => {
    try {
      setHistory(await getPaymentHistory());
    } catch (e) {
      console.warn(e);
    }
  };

  // Після повернення з LiqPay автоматично звіряємо статус платежу.
  // Стратегія: спочатку пробуємо конкретний orderId з sessionStorage,
  // якщо його немає (redirect POST міг скинути sessionStorage) —
  // перевіряємо всі незавершені транзакції через confirm-pending.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedFromLiqPay = params.get("topup") === "done";
    const pendingOrderId = sessionStorage.getItem(PENDING_ORDER_KEY);

    const run = async () => {
      await loadHistory();

      if (!returnedFromLiqPay && !pendingOrderId) {
        // Звичайне відкриття вкладки — нічого не підтверджуємо
        return;
      }

      try {
        setConfirming(true);
        let credited = false;

        if (pendingOrderId) {
          // Є конкретний orderId — підтверджуємо його
          try {
            const tx = await confirmTopup(pendingOrderId);
            if (tx.status === "SUCCESS" || tx.status === "SANDBOX") {
              setConfirmMsg(`Баланс поповнено на ${tx.amount} ${tx.currency} ✓`);
              credited = true;
            } else if (tx.status === "CREATED") {
              // Статус у LiqPay ще не фінальний — чекаємо або перевіряємо pending
              setConfirmMsg("Платіж обробляється, спробуйте оновити сторінку через хвилину.");
            } else {
              setConfirmMsg(`Статус платежу: ${tx.status}`);
            }
          } catch (e) {
            // Помилка підтвердження конкретного — спробуємо через pending
            console.warn("confirmTopup failed, falling back to confirmPendingTopups:", e);
          }
        }

        if (!credited) {
          // Або orderId не було, або confirm не дав результату —
          // перевіряємо всі незавершені транзакції
          const results = await confirmPendingTopups();
          const paid = results.filter(
            (tx) => tx.status === "SUCCESS" || tx.status === "SANDBOX"
          );
          if (paid.length > 0) {
            const total = paid.reduce((sum, tx) => sum + Number(tx.amount), 0);
            const currency = paid[0].currency;
            setConfirmMsg(`Баланс поповнено на ${total.toFixed(2)} ${currency} ✓`);
            credited = true;
          } else if (results.length > 0 && !confirmMsg) {
            setConfirmMsg("Платіж ще обробляється. Спробуйте пізніше.");
          }
        }

        if (credited) {
          onBalanceChange?.();
        }

        await loadHistory();
      } catch (e) {
        setError(e.response?.data?.message || "Не вдалося підтвердити платіж");
      } finally {
        setConfirming(false);
        sessionStorage.removeItem(PENDING_ORDER_KEY);
        // Прибираємо ?topup=done з URL щоб не повторювати при оновленні
        const clean = window.location.pathname;
        window.history.replaceState({}, "", clean);
      }
    };

    run();
    // eslint-disable-next-line
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
      const { orderId, data, signature, checkoutUrl } = await initTopup(value);

      // Запам'ятовуємо orderId перед переходом (sessionStorage зберігається в тій же вкладці)
      sessionStorage.setItem(PENDING_ORDER_KEY, orderId);

      // LiqPay приймає лише POST з полями data + signature → прихована форма
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
      {confirming && (
        <div className="info-message">⏳ Підтверджуємо ваш платіж...</div>
      )}
      {confirmMsg && <div className="success-message">{confirmMsg}</div>}

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
                <span className={`badge badge-${h.status.toLowerCase()}`}>{statusLabel(h.status)}</span>
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

function statusLabel(status) {
  switch (status) {
    case "SUCCESS": return "Успішно";
    case "SANDBOX": return "Тест (зараховано)";
    case "CREATED": return "Очікує";
    case "FAILURE": return "Відхилено";
    case "REVERSED": return "Повернено";
    default: return status;
  }
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("uk-UA") + " " + d.toLocaleTimeString("uk-UA", {
    hour: "2-digit", minute: "2-digit",
  });
}