import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

// мови для випадного списку: { value: монако-id, label, pistonLang, pistonVersion, defaultCode }
const LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript",
    pistonLang: "node",          // у Piston JS = node
    pistonVersion: "18.15.0",
    defaultCode: `console.log("Hello, world!");\n`,
  },
  {
    value: "python",
    label: "Python",
    pistonLang: "python",
    pistonVersion: "3.10.0",
    defaultCode: `print("Hello, world!")\n`,
  },
  {
    value: "java",
    label: "Java",
    pistonLang: "java",
    pistonVersion: "15.0.2",
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n`,
  },
  {
    value: "cpp",
    label: "C++",
    pistonLang: "gcc",            // у Piston C++ = gcc
    pistonVersion: "10.2.0",
    defaultCode: `#include <iostream>\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}\n`,
  },
  {
    value: "csharp",
    label: "C#",
    pistonLang: "mono",           // у Piston C# = mono
    pistonVersion: "6.12.0",
    defaultCode: `using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, world!");\n    }\n}\n`,
  },
  {
    value: "go",
    label: "Go",
    pistonLang: "go",
    pistonVersion: "1.16.2",
    defaultCode: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, world!")\n}\n`,
  },
  {
    value: "typescript",
    label: "TypeScript",
    pistonLang: "typescript",
    pistonVersion: "5.0.3",
    defaultCode: `const msg: string = "Hello, world!";\nconsole.log(msg);\n`,
  },
];
function getFileName(langValue) {
  switch (langValue) {
    case "cpp": return "main.cpp";
    case "csharp": return "main.cs";
    case "java": return "Main.java";
    case "javascript": return "main.js";
    case "typescript": return "main.ts";
    case "python": return "main.py";
    case "go": return "main.go";
    default: return "main.txt";
  }
}

const PISTON_URL = "/piston/api/v2/execute";

export default function CodeEditor({ roomId, displayName }) {
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const ymapRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  // Yjs init — створюємо один раз
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(`${roomId}-code`, ydoc, {
      // публічні безкоштовні signaling-сервери Yjs
      signaling: ["ws://localhost:4444"],
    });

    const ymap = ydoc.getMap("meta"); // зберігаємо тут активну мову

    ydocRef.current = ydoc;
    providerRef.current = provider;
    ymapRef.current = ymap;

    provider.awareness.setLocalStateField("user", {
      name: displayName,
      color: stringToColor(displayName),
    });

    // слухаємо зміну мови від іншого учасника
    const onMetaChange = () => {
      const lang = ymap.get("language");
      if (lang && lang !== language) {
        setLanguage(lang);
      }
    };
    ymap.observe(onMetaChange);

    // якщо мова вже встановлена кимось — підхопити
    const existingLang = ymap.get("language");
    if (existingLang) setLanguage(existingLang);

    return () => {
      ymap.unobserve(onMetaChange);
      if (bindingRef.current) bindingRef.current.destroy();
      provider.destroy();
      ydoc.destroy();
    };
    // навмисно один раз
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // привʼязуємо редактор до Yjs після його монтування
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;

    const ydoc = ydocRef.current;
    const provider = providerRef.current;
    if (!ydoc || !provider) return;

    const ytext = ydoc.getText("monaco");

    // якщо в кімнаті ще нікого і текст порожній — заповнюємо дефолтним кодом
    // (це робиться один раз, бо Yjs миттєво синхронізує між учасниками)
    if (ytext.length === 0) {
      const lang = LANGUAGES.find((l) => l.value === language);
      ytext.insert(0, lang?.defaultCode || "");
      ymapRef.current?.set("language", language);
    }

    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    ymapRef.current?.set("language", newLang);

    // підставляємо дефолтний код для нової мови ТІЛЬКИ якщо редактор порожній
    const ytext = ydocRef.current?.getText("monaco");
    if (ytext && ytext.length === 0) {
      const lang = LANGUAGES.find((l) => l.value === newLang);
      ytext.insert(0, lang?.defaultCode || "");
    }
  };

  const handleRun = async () => {
    const code = editorRef.current?.getValue() || "";
    const lang = LANGUAGES.find((l) => l.value === language);
    if (!lang) return;

    setRunning(true);
    setOutput("Виконання...");

    try {
      const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.pistonLang,
          version: lang.pistonVersion,
           files: [{ name: getFileName(lang.value), content: code }],
        }),
      });
      const data = await res.json();

      const stdout = data.run?.stdout || "";
      const stderr = data.run?.stderr || "";
      const compile = data.compile?.stderr || "";
      const combined = [compile, stdout, stderr].filter(Boolean).join("\n");

      setOutput(combined || "(порожній вивід)");

      // ділимося результатом з іншими учасниками
      ymapRef.current?.set("lastOutput", {
        text: combined,
        author: displayName,
        at: Date.now(),
      });
    } catch (err) {
      setOutput("Помилка виконання: " + err.message);
    } finally {
      setRunning(false);
    }
  };

  // підписуємось на чужі результати виконання
  useEffect(() => {
    const ymap = ymapRef.current;
    if (!ymap) return;
    const onChange = () => {
      const out = ymap.get("lastOutput");
      if (out && out.author !== displayName) {
        setOutput(`[${out.author} виконав]\n${out.text}`);
      }
    };
    ymap.observe(onChange);
    return () => ymap.unobserve(onChange);
  }, [displayName]);

  return (
    <div className="code-panel">
      <div className="code-toolbar">
        <select
          value={language}
          onChange={handleLanguageChange}
          className="lang-select"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          className="run-btn"
          onClick={handleRun}
          disabled={running}
        >
          {running ? "Виконується..." : "▶ Запустити"}
        </button>
      </div>

      <div className="code-editor-wrap">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      <div className="code-output">
        <div className="code-output-label">Вивід:</div>
        <pre>{output}</pre>
      </div>
    </div>
  );
}

// детермінований колір з імені — для курсорів інших учасників
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 60%)`;
}