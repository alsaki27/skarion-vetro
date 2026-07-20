"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDesignStore } from "@/lib/store";

const AUTOSAVE_DELAY = 3000;

interface AutosaveState {
  status: "idle" | "dirty" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  error: string | null;
}

export function useAutosave(projectId: string) {
  const [state, setState] = useState<AutosaveState>({ status: "idle", lastSavedAt: null, error: null });
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elements = useDesignStore((s) => s.elements);

  const save = useCallback(async () => {
    setState((s) => ({ ...s, status: "saving", error: null }));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/designs/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ projectId, elements, note: "autosave" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Save failed: ${res.status}`);
      }
      dirtyRef.current = false;
      setState({ status: "saved", lastSavedAt: new Date(), error: null });
    } catch (err) {
      setState({ status: "error", lastSavedAt: null, error: String(err) });
    }
  }, [projectId, elements]);

  const markDirty = useCallback(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true;
      setState((s) => (s.status !== "saving" && s.status !== "error" ? { ...s, status: "dirty" } : s));
    }
  }, []);

  // Debounced autosave when dirty
  useEffect(() => {
    if (state.status === "dirty") {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save();
      }, AUTOSAVE_DELAY);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.status, save]);

  // Save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dirtyRef.current) {
        const token = localStorage.getItem("token");
        navigator.sendBeacon("/api/designs/autosave", JSON.stringify({ projectId, elements, note: "unload-autosave", token }));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [projectId, elements]);

  return { ...state, markDirty, save };
}
