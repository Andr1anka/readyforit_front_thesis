import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL || "ws://localhost:4444";
const PISTON_URL = import.meta.env.VITE_PISTON_URL || "/piston/api/v2/execute";

const LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript",
    pistonLang: "javascript",
    pistonVersion: "18.15.0",
    fileName: "main.js",
    defaultCode: `function fibonacci(n) {\n  if (n <= 0) return 0;\n  if (n === 1) return 1;\n\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    let temp = a + b;\n    a = b;\n    b = temp;\n  }\n  return b;\n}\n\nconsole.log(fibonacci(10));\n`,
  },
  {
    value: "python",
    label: "Python",
    pistonLang: "python",
    pistonVersion: "3.10.0",
    fileName: "main.py",
    defaultCode: `def fibonacci(n):\n    if n <= 0:\n        return 0\n    if n == 1:\n        return 1\n\n    a, b = 0, 1\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n\nprint(fibonacci(10))\n`,
  },
  {
    value: "cpp",
    label: "C++",
    pistonLang: "c++",
    pistonVersion: "10.2.0",
    fileName: "main.cpp",
    defaultCode: `#include <iostream>\n\nlong long fibonacci(int n) {\n    if (n <= 0) return 0;\n    if (n == 1) return 1;\n\n    long long a = 0, b = 1;\n    for (int i = 2; i <= n; ++i) {\n        long long temp = a + b;\n        a = b;\n        b = temp;\n    }\n    return b;\n}\n\nint main() {\n    std::cout << fibonacci(10) << std::endl;\n    return 0;\n}\n`,
  },
  {
    value: "java",
    label: "Java",
    pistonLang: "java",
    pistonVersion: "15.0.2",
    fileName: "Main.java",
    defaultCode: `public class Main {\n    public static void main(String[] args) {\n        System.out.println(fibonacci(10));\n    }\n\n    static long fibonacci(int n) {\n        if (n <= 0) return 0;\n        if (n == 1) return 1;\n        long a = 0, b = 1;\n        for (int i = 2; i <= n; i++) {\n            long temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n}\n`,
  },
  {
    value: "typescript",
    label: "TypeScript",
    pistonLang: "typescript",
    pistonVersion: "5.0.3",
    fileName: "main.ts",
    defaultCode: `function fibonacci(n: number): number {\n  if (n <= 0) return 0;\n  if (n === 1) return 1;\n\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    const temp = a + b;\n    a = b;\n    b = temp;\n  }\n  return b;\n}\n\nconsole.log(fibonacci(10));\n`,
  },
  {
    value: "csharp",
    label: "C#",
    pistonLang: "csharp",
    pistonVersion: "6.12.0",
    fileName: "main.cs",
    defaultCode: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(Fibonacci(10));\n    }\n\n    static long Fibonacci(int n) {\n        if (n <= 0) return 0;\n        if (n == 1) return 1;\n        long a = 0, b = 1;\n        for (int i = 2; i <= n; i++) {\n            long temp = a + b;\n            a = b;\n            b = temp;\n        }\n        return b;\n    }\n}\n`,
  },
  {
    value: "go",
    label: "Go",
    pistonLang: "go",
    pistonVersion: "1.16.2",
    fileName: "main.go",
    defaultCode: `package main\n\nimport "fmt"\n\nfunc fibonacci(n int) int {\n    if n <= 0 { return 0 }\n    if n == 1 { return 1 }\n    a, b := 0, 1\n    for i := 2; i <= n; i++ {\n        a, b = b, a + b\n    }\n    return b\n}\n\nfunc main() {\n    fmt.Println(fibonacci(10))\n}\n`,
  },
];

function normalizePistonOutput(data) {
  if (!data) return "(порожній вивід)";
  if (data.message) return data.message;

  const chunks = [
    data.compile?.stderr,
    data.compile?.stdout,
    data.compile?.output,
    data.run?.stderr,
    data.run?.stdout,
    data.run?.output,
  ]
    .filter(Boolean)
    .map((x) => String(x).trim())
    .filter(Boolean);

  const unique = [];
  for (const chunk of chunks) {
    if (!unique.includes(chunk)) unique.push(chunk);
  }

  return unique.join("\n").trim() || "(порожній вивід)";
}

function makeRunId() {
  return crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function CodeEditor({ roomId, displayName, participantId }) {
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const ymapRef = useRef(null);
  const languageRef = useRef("javascript");
  const lastOutputIdRef = useRef(null);

  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);

  const currentLanguage = useMemo(
    () => LANGUAGES.find((l) => l.value === language) || LANGUAGES[0],
    [language]
  );

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebrtcProvider(`${roomId}-code`, ydoc, {
      signaling: [SIGNALING_URL],
    });
    const ymap = ydoc.getMap("meta");

    ydocRef.current = ydoc;
    providerRef.current = provider;
    ymapRef.current = ymap;

    provider.awareness.setLocalStateField("user", {
      name: displayName,
      color: stringToColor(displayName || participantId || "user"),
    });

    const onMetaChange = () => {
      const nextLang = ymap.get("language");
      if (nextLang && nextLang !== languageRef.current) {
        setLanguage(nextLang);
      }

      const isRunning = ymap.get("isRunning");
      setRunning(Boolean(isRunning));

      const out = ymap.get("lastOutput");
      if (out?.id && out.id !== lastOutputIdRef.current) {
        lastOutputIdRef.current = out.id;
        const prefix = out.authorId === participantId ? "" : `[${out.author || "Учасник"} виконав]\n`;
        setOutput(`${prefix}${out.text || "(порожній вивід)"}`);
      }
    };

    ymap.observe(onMetaChange);

    const existingLang = ymap.get("language");
    if (existingLang) setLanguage(existingLang);
    else ymap.set("language", "javascript");

    onMetaChange();

    return () => {
      ymap.unobserve(onMetaChange);
      bindingRef.current?.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId, displayName, participantId]);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    const ydoc = ydocRef.current;
    const provider = providerRef.current;
    if (!ydoc || !provider) return;

    const ytext = ydoc.getText("monaco");
    if (ytext.length === 0) {
      ytext.insert(0, currentLanguage.defaultCode);
    }

    bindingRef.current?.destroy();
    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor]),
      provider.awareness
    );
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const lang = LANGUAGES.find((l) => l.value === newLang) || LANGUAGES[0];
    setLanguage(newLang);
    ymapRef.current?.set("language", newLang);

    const ytext = ydocRef.current?.getText("monaco");
    if (ytext && editorRef.current) {
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, lang.defaultCode);
      });
    }
    setOutput("");
  };

  const handleRun = async () => {
    const code = editorRef.current?.getValue() || "";
    const lang = LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
    const runId = makeRunId();

    setRunning(true);
    setOutput("Виконання...");
    ymapRef.current?.set("isRunning", true);
    ymapRef.current?.set("lastOutput", {
      id: `${runId}-running`,
      text: "Виконання...",
      author: displayName || "Учасник",
      authorId: participantId,
      at: Date.now(),
    });

    try {
      const res = await fetch(PISTON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.pistonLang,
          version: lang.pistonVersion,
          files: [{ name: lang.fileName, content: code }],
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `HTTP ${res.status}`);
      }

      const text = normalizePistonOutput(data);
      lastOutputIdRef.current = runId;
      setOutput(text);
      ymapRef.current?.set("lastOutput", {
        id: runId,
        text,
        author: displayName || "Учасник",
        authorId: participantId,
        at: Date.now(),
      });
    } catch (err) {
      const text = "Помилка виконання: " + err.message;
      lastOutputIdRef.current = runId;
      setOutput(text);
      ymapRef.current?.set("lastOutput", {
        id: runId,
        text,
        author: displayName || "Учасник",
        authorId: participantId,
        at: Date.now(),
      });
    } finally {
      setRunning(false);
      ymapRef.current?.set("isRunning", false);
    }
  };

  return (
    <div className="code-panel">
      <div className="code-toolbar">
        <select value={language} onChange={handleLanguageChange} className="lang-select">
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>

        <button className="run-btn" onClick={handleRun} disabled={running}>
          {running ? "Виконується..." : "▶ Запустити"}
        </button>
      </div>

      <div className="code-editor-wrap">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          onMount={handleEditorMount}
          path={currentLanguage.fileName}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: "Consolas, 'Courier New', monospace",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
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

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
}
