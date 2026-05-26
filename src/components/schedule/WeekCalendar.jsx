import { useMemo } from "react";

/**
 * Тижневий календар (як гугл-календар): 7 днів-колонок від сьогодні,
 * час по вертикалі. Уроки розташовані за часом і висотою тривалості.
 *
 * props: items[], onJoin(item)
 */
const PX_PER_MIN = 0.9;

export default function WeekCalendar({ items = [], onJoin }) {
  const model = useMemo(() => buildWeek(items), [items]);
  const { days, minMin, maxMin, hours } = model;
  const gridHeight = (maxMin - minMin) * PX_PER_MIN;

  return (
    <div className="wc-wrap">
      <div className="wc" style={{ height: gridHeight + 40 }}>
        <div className="wc-hours">
          {hours.map((h) => (
            <div key={h} className="wc-hour" style={{ top: (h * 60 - minMin) * PX_PER_MIN + 40 }}>
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="wc-cols">
          {days.map((day) => (
            <div className="wc-col" key={day.key}>
              <div className={`wc-col-head ${day.isToday ? "today" : ""}`}>
                <span className="wc-dow">{day.dow}</span>
                <span className="wc-dnum">{day.dnum}</span>
              </div>
              <div className="wc-col-body" style={{ height: gridHeight }}>
                {hours.map((h) => (
                  <div key={h} className="wc-line" style={{ top: (h * 60 - minMin) * PX_PER_MIN }} />
                ))}
                {day.items.map((it) => {
                  const top = (it.startMin - minMin) * PX_PER_MIN;
                  const height = Math.max(30, (it.endMin - it.startMin) * PX_PER_MIN - 2);
                  return (
                    <button
                      key={it.lessonId}
                      className="wc-event"
                      style={{ top, height }}
                      onClick={() => onJoin?.(it)}
                      title={`${it.title} • ${it.startTime}–${it.endTime}`}
                    >
                      <span className="wc-event-time">{it.startTime}</span>
                      <span className="wc-event-title">{it.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function toMin(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function buildWeek(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      isToday: i === 0,
      dow: d.toLocaleDateString("uk-UA", { weekday: "short" }),
      dnum: d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" }),
      items: [],
    });
  }

  let minMin = 8 * 60;
  let maxMin = 20 * 60;
  items.forEach((it) => {
    const day = days.find((d) => d.key === it.date);
    if (!day) return;
    const startMin = toMin(it.startTime);
    const endMin = toMin(it.endTime);
    minMin = Math.min(minMin, startMin);
    maxMin = Math.max(maxMin, endMin);
    day.items.push({ ...it, startMin, endMin });
  });

  minMin = Math.floor(minMin / 60) * 60;
  maxMin = Math.ceil(maxMin / 60) * 60;
  const hours = [];
  for (let h = minMin / 60; h <= maxMin / 60; h++) hours.push(h);

  return { days, minMin, maxMin, hours };
}
