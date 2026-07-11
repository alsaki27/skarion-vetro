// Persists panel resize/collapse state per project in localStorage.
import { useState, useCallback, useEffect } from "react";

const STORAGE_PREFIX = "skarion_panel_";

interface PanelState {
  leftWidth: number;
  rightWidth: number;
  bottomHeight: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  bottomCollapsed: boolean;
}

const DEFAULT: PanelState = {
  leftWidth: 256,
  rightWidth: 288,
  bottomHeight: 192,
  leftCollapsed: false,
  rightCollapsed: false,
  bottomCollapsed: true,
};

export function usePanelState(projectId: string) {
  const storageKey = `${STORAGE_PREFIX}${projectId}`;

  const [state, setState] = useState<PanelState>(() => {
    if (typeof window === "undefined") return DEFAULT;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...DEFAULT, ...JSON.parse(saved) } : DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch { /* quota exceeded — ignore */ }
  }, [state, storageKey]);

  const set = useCallback((partial: Partial<PanelState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const toggleLeft = useCallback(() => setState((prev) => ({ ...prev, leftCollapsed: !prev.leftCollapsed })), []);
  const toggleRight = useCallback(() => setState((prev) => ({ ...prev, rightCollapsed: !prev.rightCollapsed })), []);
  const toggleBottom = useCallback(() => setState((prev) => ({ ...prev, bottomCollapsed: !prev.bottomCollapsed })), []);

  return { state, set, toggleLeft, toggleRight, toggleBottom };
}
