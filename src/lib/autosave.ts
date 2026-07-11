import type { NetworkElement } from "./types";

const AUTOSAVE_INTERVAL = 15_000; // 15 seconds
const STORAGE_KEY_PREFIX = "vetro_design_";

interface AutosaveData {
  projectId: string;
  elements: Record<string, NetworkElement>;
  savedAt: number;
}

export function saveToLocal(projectId: string, elements: Record<string, NetworkElement>): void {
  try {
    const data: AutosaveData = {
      projectId,
      elements,
      savedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable
  }
}

export function loadFromLocal(projectId: string): AutosaveData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
    if (!raw) return null;
    return JSON.parse(raw) as AutosaveData;
  } catch {
    return null;
  }
}

export function clearLocal(projectId: string): void {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + projectId);
  } catch {
    // ignore
  }
}

export function startAutosave(
  projectId: string,
  getElements: () => Record<string, NetworkElement>,
): () => void {
  const interval = setInterval(() => {
    const elements = getElements();
    if (Object.keys(elements).length > 0) {
      saveToLocal(projectId, elements);
    }
  }, AUTOSAVE_INTERVAL);

  return () => clearInterval(interval);
}
