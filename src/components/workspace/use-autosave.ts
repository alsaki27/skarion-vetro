"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDesignStore } from "@/lib/store";

const AUTOSAVE_DELAY = 3000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF = 2000;

interface AutosaveState {
  status: "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";
  lastSavedAt: Date | null;
  error: string | null;
  savedRevision: string | null;
}

export function useAutosave(projectId: string) {
  const [state, setState] = useState<AutosaveState>({ status: "idle", lastSavedAt: null, error: null, savedRevision: null });
  const pendingChangesRef = useRef(false);
  const changeVersionRef = useRef(0);
  const savingRef = useRef(false);
  const retryCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elements = useDesignStore((s) => s.elements);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    retryCountRef.current = 0;

    const attemptSave = async (): Promise<void> => {
      setState((s) => ({ ...s, status: "saving", error: null }));
      const versionBefore = changeVersionRef.current;
      const baseRevision = state.savedRevision;

      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/designs/autosave", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ projectId, elements, note: "autosave", baseRevision: baseRevision ?? undefined }),
        });

        if (res.status === 409) {
          setState({ status: "conflict", lastSavedAt: null, error: "Conflict — your design is out of date", savedRevision: baseRevision });
          savingRef.current = false;
          return;
        }

        if (!res.ok) throw new Error(`Save failed: ${res.status}`);

        const data = await res.json() as { revision: string; etag: string };
        pendingChangesRef.current = false;
        savingRef.current = false;
        retryCountRef.current = 0;
        setState({ status: "saved", lastSavedAt: new Date(), error: null, savedRevision: data.revision });

        // If newer changes arrived during save, mark dirty for next cycle
        if (changeVersionRef.current > versionBefore) {
          pendingChangesRef.current = true;
          setState((s) => ({ ...s, status: "dirty" }));
        }
      } catch (err) {
        retryCountRef.current++;
        if (retryCountRef.current <= MAX_RETRIES) {
          const delay = RETRY_BACKOFF * Math.pow(2, retryCountRef.current - 1);
          setTimeout(() => { if (savingRef.current) attemptSave(); }, delay);
        } else {
          savingRef.current = false;
          retryCountRef.current = 0;
          setState({ status: "error", lastSavedAt: null, error: String(err), savedRevision: state.savedRevision });
        }
      }
    };

    await attemptSave();
  }, [projectId, elements, state.savedRevision]);

  const markDirty = useCallback(() => {
    changeVersionRef.current++;
    if (!pendingChangesRef.current && !savingRef.current) {
      pendingChangesRef.current = true;
      setState((s) => (s.status !== "saving" && s.status !== "error" ? { ...s, status: "dirty" } : s));
    }
  }, []);

  // Debounced autosave when dirty
  useEffect(() => {
    if (state.status === "dirty" && pendingChangesRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        save();
      }, AUTOSAVE_DELAY);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.status, save]);

  // Save on unload (best-effort — sendBeacon cannot attach auth headers, so this is limited)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingChangesRef.current && state.savedRevision) {
        // sendBeacon cannot send auth headers. Document as best-effort only.
        // The ETag conflict check will protect from stale overwrites on next load.
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.savedRevision]);

  return { ...state, markDirty, save, retry: save, setSavedRevision: (rev: string) => setState((s) => ({ ...s, savedRevision: rev })) };
}
