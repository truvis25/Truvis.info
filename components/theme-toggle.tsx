"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

type Mode = "light" | "dark" | "system";

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyMode(mode: Mode) {
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

const NEXT: Record<Mode, Mode> = { system: "dark", dark: "light", light: "system" };
const LABEL: Record<Mode, string> = {
  system: "Theme: system",
  dark: "Theme: dark",
  light: "Theme: light",
};

// Cycles system → dark → light. "system" tracks the OS preference live; an
// explicit choice is persisted and wins until switched back to system.
export function ThemeToggle({ className }: { className?: string }) {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    // Two-pass hydration: the server can't know localStorage, so the first
    // client render must stay a placeholder and switch here after mount.
    const stored = localStorage.getItem("theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(stored === "dark" || stored === "light" ? stored : "system");
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  if (mode === null) {
    // Placeholder keeps layout stable until the stored preference is read.
    return <span className={className} aria-hidden />;
  }

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return (
    <button
      type="button"
      aria-label={`${LABEL[mode]} — switch`}
      title={LABEL[mode]}
      className={className}
      onClick={() => {
        const next = NEXT[mode];
        setMode(next);
        if (next === "system") localStorage.removeItem("theme");
        else localStorage.setItem("theme", next);
        applyMode(next);
      }}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
