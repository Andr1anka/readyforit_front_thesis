import { useRef } from "react";

/**
 * Markdown-редактор з панеллю (жирний, курсив, закреслення, списки, цитата, код, посилання).
 * Працює над звичайним <textarea>: кнопки обгортають виділення відповідною
 * Markdown-розміткою. Зберігає Markdown-текст через onChange(md).
 *
 * Markdown обрано як формат зберігання longDescription — людиночитабельний,
 * безпечний, рендериться в HTML на сторінці деталей заняття.
 */
const WRAP = {
  bold: { before: "**", after: "**", label: "B", title: "Жирний", style: { fontWeight: 800 } },
  italic: { before: "*", after: "*", label: "I", title: "Курсив", style: { fontStyle: "italic" } },
  strike: { before: "~~", after: "~~", label: "S", title: "Закреслення", style: { textDecoration: "line-through" } },
  code: { before: "`", after: "`", label: "</>", title: "Інлайн-код" },
};

export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);

  const apply = (fn) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = value || "";
    const selected = text.slice(start, end);
    const { next, selStart, selEnd } = fn(text, start, end, selected);
    onChange?.(next);
    // відновлюємо виділення після ре-рендера
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const wrap = (w) =>
    apply((text, start, end, selected) => {
      const inner = selected || "текст";
      const insert = w.before + inner + w.after;
      const next = text.slice(0, start) + insert + text.slice(end);
      return {
        next,
        selStart: start + w.before.length,
        selEnd: start + w.before.length + inner.length,
      };
    });

  const linePrefix = (prefix) =>
    apply((text, start, end, selected) => {
      // префікс на кожен рядок виділення (або поточний рядок)
      const block = selected || "пункт";
      const prefixed = block
        .split("\n")
        .map((l, i) => (prefix === "1. " ? `${i + 1}. ${l}` : prefix + l))
        .join("\n");
      const next = text.slice(0, start) + prefixed + text.slice(end);
      return { next, selStart: start, selEnd: start + prefixed.length };
    });

  const codeBlock = () =>
    apply((text, start, end, selected) => {
      const block = "```\n" + (selected || "код") + "\n```";
      const next = text.slice(0, start) + block + text.slice(end);
      return { next, selStart: start + 4, selEnd: start + 4 + (selected || "код").length };
    });

  const link = () =>
    apply((text, start, end, selected) => {
      const label = selected || "текст";
      const insert = `[${label}](https://)`;
      const next = text.slice(0, start) + insert + text.slice(end);
      return { next, selStart: start + 1, selEnd: start + 1 + label.length };
    });

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <button type="button" className="rte-btn" title={WRAP.bold.title} style={WRAP.bold.style}
          onMouseDown={(e) => { e.preventDefault(); wrap(WRAP.bold); }}>{WRAP.bold.label}</button>
        <button type="button" className="rte-btn" title={WRAP.italic.title} style={WRAP.italic.style}
          onMouseDown={(e) => { e.preventDefault(); wrap(WRAP.italic); }}>{WRAP.italic.label}</button>
        <button type="button" className="rte-btn" title={WRAP.strike.title} style={WRAP.strike.style}
          onMouseDown={(e) => { e.preventDefault(); wrap(WRAP.strike); }}>{WRAP.strike.label}</button>
        <span className="rte-sep" />
        <button type="button" className="rte-btn" title="Маркований список"
          onMouseDown={(e) => { e.preventDefault(); linePrefix("- "); }}>•—</button>
        <button type="button" className="rte-btn" title="Нумерований список"
          onMouseDown={(e) => { e.preventDefault(); linePrefix("1. "); }}>1.</button>
        <span className="rte-sep" />
        <button type="button" className="rte-btn" title="Цитата"
          onMouseDown={(e) => { e.preventDefault(); linePrefix("> "); }}>❝</button>
        <button type="button" className="rte-btn" title="Інлайн-код"
          onMouseDown={(e) => { e.preventDefault(); wrap(WRAP.code); }}>{WRAP.code.label}</button>
        <button type="button" className="rte-btn" title="Блок коду"
          onMouseDown={(e) => { e.preventDefault(); codeBlock(); }}>{"{ }"}</button>
        <button type="button" className="rte-btn" title="Посилання"
          onMouseDown={(e) => { e.preventDefault(); link(); }}>🔗</button>
      </div>
      <textarea
        ref={ref}
        className="rte-area"
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder || "Введіть повідомлення (Markdown)"}
        rows={7}
      />
      <div className="rte-hint">Підтримується Markdown: **жирний**, *курсив*, списки, &gt; цитата, `код`.</div>
    </div>
  );
}
