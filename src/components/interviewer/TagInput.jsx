import { useState } from "react";

const SUGGESTED = [
  "Java", "Python", "JavaScript", "TypeScript", "C#", "Go",
  "Backend", "Frontend", "Fullstack", "DevOps", "QA", "Mobile",
  "React", "Spring", "Node.js", "SQL", "Data Science", "ML",
  "System Design", "Algorithms",
];

/**
 * Поле міток: можна вибрати з пропонованих або ввести свою (Enter / кома).
 * value — масив рядків; onChange(nextArray).
 */
export default function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState("");

  const add = (raw) => {
    const tag = raw.trim();
    if (!tag) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
    setInput("");
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const remaining = SUGGESTED.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="tag-input">
      <div className="tag-chips">
        {value.map((t) => (
          <span key={t} className="tag-chip">
            {t}
            <button type="button" onClick={() => remove(t)} aria-label="Видалити">
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={value.length ? "" : "Додати мітку та Enter"}
        />
      </div>

      {remaining.length > 0 && (
        <div className="tag-suggestions">
          {remaining.slice(0, 12).map((s) => (
            <button key={s} type="button" className="tag-suggest" onClick={() => add(s)}>
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
