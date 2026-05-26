import { useMemo } from "react";

/**
 * Календарна сітка слотів (як на ескізі): дні — колонки, час — вертикальна вісь.
 * Фіолетові слоти — вільні, сірі штриховані — зайняті.
 * Висота слота пропорційна тривалості: x2 виглядає вдвічі вищим (зʼєднані),
 * x0.5 — нижчим. Початок (top) рахується від найранішої години.
 *
 * props:
 *   slots: [{id, date, startTime "HH:mm", endTime, available, booked, durationMinutes}]
 *   onPick(slot): клік по вільному слоту (для реєстрації — Feature 4)
 *   selectedId: id обраного слота (підсвічування)
 */
const PX_PER_MIN = 1.1;       // масштаб висоти
const HOUR_LABEL_W = 44;

export default function SlotGrid({ slots = [], onPick, selectedId }) {
  const model = useMemo(() => buildModel(slots), [slots]);

  if (!slots.length) {
    return <p className="hint">Поки немає доступних слотів.</p>;
  }

  const { days, minMinutes, maxMinutes, hourMarks } = model;
  const gridHeight = (maxMinutes - minMinutes) * PX_PER_MIN;

  return (
    <div className="slotgrid-wrap">
      <div className="slotgrid" style={{ height: gridHeight + 30 }}>
        {/* вісь годин */}
        <div className="slotgrid-hours" style={{ width: HOUR_LABEL_W }}>
          {hourMarks.map((h) => (
            <div
              key={h}
              className="slotgrid-hour"
              style={{ top: (h * 60 - minMinutes) * PX_PER_MIN }}
            >
              {String(h).padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* колонки днів */}
        <div className="slotgrid-cols">
          {days.map((day) => (
            <div className="slotgrid-col" key={day.date}>
              <div className="slotgrid-col-head">{day.label}</div>
              <div className="slotgrid-col-body" style={{ height: gridHeight }}>
                {/* лінії годин */}
                {hourMarks.map((h) => (
                  <div
                    key={h}
                    className="slotgrid-line"
                    style={{ top: (h * 60 - minMinutes) * PX_PER_MIN }}
                  />
                ))}
                {/* слоти */}
                {day.slots.map((s) => {
                  const top = (s.startMin - minMinutes) * PX_PER_MIN;
                  const displayDuration = s.displayDurationMinutes || s.durationMinutes;
                  const displayEndTime = s.displayEndTime || s.endTime;
                  const height = Math.max(18, displayDuration * PX_PER_MIN - 2);
                  const cls = s.booked ? "booked" : "available";
                  const sel = selectedId === s.id ? " selected" : "";
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`slotgrid-slot ${cls}${sel}`}
                      style={{ top, height }}
                      disabled={s.booked}
                      onClick={() => !s.booked && onPick?.(s)}
                      title={`${s.startTime}–${displayEndTime}`}
                    >
                      <span className="slotgrid-slot-time">{s.startTime}</span>
                      {height > 34 && <span className="slotgrid-slot-end">{displayEndTime}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="slotgrid-legend">
        <span className="legend-item"><i className="legend-box available" /> Вільний</span>
        <span className="legend-item"><i className="legend-box booked" /> Зайнятий</span>
      </div>
    </div>
  );
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function buildModel(slots) {
  const byDate = {};
  let min = 24 * 60;
  let max = 0;

  slots.forEach((s) => {
    const startMin = toMin(s.startTime);
    const endMin = toMin(s.endTime);
    min = Math.min(min, startMin);
    max = Math.max(max, endMin);
    (byDate[s.date] ||= []).push({ ...s, startMin, endMin });
  });

  // округлюємо межі до повних годин для гарної сітки
  const minMinutes = Math.floor(min / 60) * 60;
  const maxMinutes = Math.ceil(max / 60) * 60;

  const hourMarks = [];
  for (let h = minMinutes / 60; h <= maxMinutes / 60; h++) hourMarks.push(h);

  const days = Object.keys(byDate)
    .sort()
    .map((date) => ({
      date,
      label: formatDay(date),
      slots: byDate[date].sort((a, b) => a.startMin - b.startMin),
    }));

  return { days, minMinutes, maxMinutes, hourMarks };
}

function formatDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit" });
}
