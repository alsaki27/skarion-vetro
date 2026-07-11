// Workspace keyboard shortcuts.
import { useEffect } from "react";

const SHORTCUTS: Record<string, { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean }> = {
  "Toggle Left Panel": { key: "b", ctrl: true },
  "Toggle Right Panel": { key: "i", ctrl: true },
  "Toggle Bottom Panel": { key: "t", ctrl: true },
  "Global Search": { key: "k", ctrl: true },
  "Save Design": { key: "s", ctrl: true },
  "Toggle Brief": { key: "b", ctrl: true, shift: true },
};

export function useKeyboardShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const [action, handler] of Object.entries(handlers)) {
        const def = SHORTCUTS[action];
        if (!def) continue;
        const matchCtrl = def.ctrl ? e.ctrlKey || e.metaKey : !(e.ctrlKey || e.metaKey);
        const matchShift = def.shift ? e.shiftKey : !e.shiftKey;
        const matchAlt = def.alt ? e.altKey : !e.altKey;
        if (e.key.toLowerCase() === def.key && matchCtrl && matchShift && matchAlt) {
          e.preventDefault();
          handler();
          return;
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
