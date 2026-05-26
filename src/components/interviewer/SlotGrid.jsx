import { useMemo } from "react";

/**
 * Календарна сітка слотів: показує тільки актуальні слоти
 * від сьогодні на 7 днів. Минулі слоти та дати поза цим тижнем не відображаються.
 */
const PX_PER_MIN = 1.1;
const HOUR_LABEL_W = 44;
const WEEK_DAYS = 7;

export default function SlotGrid({ slots = [], onPick, selectedId }) {
  const model = useMemo(() => buildModel(slots), [slots]);

  const { days, minMinutes, maxMinutes, hourMarks } = model;
  const hasVisibleSlots = days.some((day) => day.slots.length > 0);

  if (!hasVisibleSlots) {
    return <p className="hint">На найближчий тиждень немає доступних слотів.</p>;
  }

  const gridHeight = (maxMinutes - minMinutes) * PX_PER_MIN;

  return (
    <div className="slotgrid-wrap">
      <div className="slotgrid" style={{ height: gridHeight + 30 }}>
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

        <div className="slotgrid-cols">
          {days.map((day) => (
            <div className="slotgrid-col" key={day.date}>
              <div className="slotgrid-col-head">{day.label}</div>
              <div className="slotgrid-col-body" style={{ height: gridHeight }}>
                {hourMarks.map((h) => (
                  <div
                    key={h}
                    className="slotgrid-line"
                    style={{ top: (h * 60 - minMinutes) * PX_PER_MIN }}
                  />
                ))}

                {day.slots.map((s) => {
                  const top = (s.startMin - minMinutes) * PX_PER_MIN;
                  const height = Math.max(40, (s.endMin - s.startMin) * PX_PER_MIN - 2);
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
                      title={`${s.startTime}–${s.endTime}`}
                    >
                      <span className="slotgrid-slot-time">{s.startTime}</span>
                      <span className="slotgrid-slot-end">{s.endTime}</span>
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

function buildModel(slots) {
  const now = new Date();
  const today = startOfLocalDay(now);
  const weekDates = Array.from({ length: WEEK_DAYS }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return toIsoDate(d);
  });

  const weekSet = new Set(weekDates);
  const byDate = Object.fromEntries(weekDates.map((date) => [date, []]));

  let min = 24 * 60;
  let max = 0;

  slots.forEach((slot) => {
    if (!slot?.date || !slot?.startTime || !slot?.endTime) return;
    if (!weekSet.has(slot.date)) return;

    const startDateTime = new Date(`${slot.date}T${slot.startTime}:00`);
    if (startDateTime <= now) return;

    const startMin = toMin(slot.startTime);
    const endMin = toMin(slot.endTime);
    if (endMin <= startMin) return;

    min = Math.min(min, startMin);
    max = Math.max(max, endMin);
    byDate[slot.date].push({ ...slot, startMin, endMin });
  });

  if (min === 24 * 60 || max === 0) {
    min = 9 * 60;
    max = 18 * 60;
  }

  const minMinutes = Math.floor(min / 60) * 60;
  const maxMinutes = Math.ceil(max / 60) * 60;

  const hourMarks = [];
  for (let h = minMinutes / 60; h <= maxMinutes / 60; h++) {
    hourMarks.push(h);
  }

  const days = weekDates.map((date) => ({
    date,
    label: formatDay(date),
    slots: byDate[date].sort((a, b) => a.startMin - b.startMin),
  }));

  return { days, minMinutes, maxMinutes, hourMarks };
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("uk-UA", { weekday: "short", day: "2-digit", month: "2-digit" });
}
