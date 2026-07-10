"use client";

import { create } from "zustand";
import type {
  GradingResult,
  LngLat,
  NetworkElement,
  PointElementType,
} from "./types";
import { makeId } from "./geometry";

export type Tool =
  | "select"
  | "measure"
  | PointElementType
  | "cable"
  | "conduit"
  | "drop_cable";

export type Basemap = "satellite" | "streets";

interface DesignState {
  elements: Record<string, NetworkElement>;
  selectedId: string | null;
  tool: Tool;
  basemap: Basemap;
  /** In-progress line draw: vertices placed so far */
  draftPath: LngLat[];
  draftStartElementId: string | null;
  grading: GradingResult | null;
  // history for undo/redo — snapshots of `elements`
  past: Record<string, NetworkElement>[];
  future: Record<string, NetworkElement>[];

  setTool: (t: Tool) => void;
  setBasemap: (b: Basemap) => void;
  select: (id: string | null) => void;
  loadElements: (els: NetworkElement[]) => void;
  addPoint: (type: PointElementType, position: LngLat) => string;
  beginLine: (start: LngLat, startElementId?: string) => void;
  extendLine: (v: LngLat) => void;
  finishLine: (
    type: "cable" | "conduit" | "drop_cable",
    end: LngLat,
    endElementId?: string,
    attributes?: Record<string, unknown>,
  ) => string | null;
  cancelLine: () => void;
  updateAttributes: (id: string, attrs: Record<string, unknown>) => void;
  moveElement: (id: string, position: LngLat) => void;
  deleteElement: (id: string) => void;
  setGrading: (g: GradingResult | null) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 50;

function pushHistory(s: DesignState): Pick<DesignState, "past" | "future"> {
  return {
    past: [...s.past.slice(-MAX_HISTORY + 1), s.elements],
    future: [],
  };
}

const DEFAULT_LINE_ATTRS: Record<string, Record<string, unknown>> = {
  cable: { cable_count: 12, cable_type: "loose_tube", aerial: true },
  conduit: { size_in: 1.25, depth_in: 30 },
  drop_cable: { cable_count: 2 },
};

const DEFAULT_POINT_ATTRS: Partial<Record<PointElementType, Record<string, unknown>>> = {
  pole: { owner: "Utility", height_ft: 35, attachment_count: 0 },
  splitter: { ratio: "1:8", stage: 1 },
  fdh_cabinet: { port_count: 432 },
  splice_closure: { capacity: 96 },
};

export const useDesignStore = create<DesignState>((set, get) => ({
  elements: {},
  selectedId: null,
  tool: "select",
  basemap: "satellite",
  draftPath: [],
  draftStartElementId: null,
  grading: null,
  past: [],
  future: [],

  setTool: (tool) => set({ tool, draftPath: [], draftStartElementId: null }),
  setBasemap: (basemap) => set({ basemap }),
  select: (selectedId) => set({ selectedId }),

  loadElements: (els) =>
    set({
      elements: Object.fromEntries(els.map((e) => [e.id, e])),
      past: [],
      future: [],
      grading: null,
      selectedId: null,
    }),

  addPoint: (type, position) => {
    const id = makeId(type);
    set((s) => ({
      ...pushHistory(s),
      elements: {
        ...s.elements,
        [id]: {
          id,
          type,
          position,
          attributes: { ...(DEFAULT_POINT_ATTRS[type] ?? {}) },
        },
      },
      selectedId: id,
    }));
    return id;
  },

  beginLine: (start, startElementId) =>
    set({ draftPath: [start], draftStartElementId: startElementId ?? null }),

  extendLine: (v) => set((s) => ({ draftPath: [...s.draftPath, v] })),

  finishLine: (type, end, endElementId, attributes) => {
    const s = get();
    if (s.draftPath.length === 0) return null;
    const id = makeId(type);
    const path = [...s.draftPath, end];
    set((prev) => ({
      ...pushHistory(prev),
      elements: {
        ...prev.elements,
        [id]: {
          id,
          type,
          path,
          startElementId: prev.draftStartElementId ?? undefined,
          endElementId,
          attributes: { ...(DEFAULT_LINE_ATTRS[type] ?? {}), ...attributes },
        },
      },
      draftPath: [],
      draftStartElementId: null,
      selectedId: id,
    }));
    return id;
  },

  cancelLine: () => set({ draftPath: [], draftStartElementId: null }),

  updateAttributes: (id, attrs) =>
    set((s) => {
      const el = s.elements[id];
      if (!el) return s;
      return {
        ...pushHistory(s),
        elements: {
          ...s.elements,
          [id]: { ...el, attributes: { ...el.attributes, ...attrs } },
        },
      };
    }),

  moveElement: (id, position) =>
    set((s) => {
      const el = s.elements[id];
      if (!el || el.locked || !("position" in el)) return s;
      return {
        ...pushHistory(s),
        elements: { ...s.elements, [id]: { ...el, position } },
      };
    }),

  deleteElement: (id) =>
    set((s) => {
      const el = s.elements[id];
      if (!el || el.locked) return s;
      const elements = { ...s.elements };
      delete elements[id];
      // also remove lines attached to a deleted point element
      for (const other of Object.values(elements)) {
        if (
          "path" in other &&
          (other.startElementId === id || other.endElementId === id)
        ) {
          delete elements[other.id];
        }
      }
      return {
        ...pushHistory(s),
        elements,
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    }),

  setGrading: (grading) => set({ grading }),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1];
      if (!prev) return s;
      return {
        elements: prev,
        past: s.past.slice(0, -1),
        future: [s.elements, ...s.future],
        selectedId: null,
      };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return {
        elements: next,
        past: [...s.past, s.elements],
        future: s.future.slice(1),
        selectedId: null,
      };
    }),
}));
