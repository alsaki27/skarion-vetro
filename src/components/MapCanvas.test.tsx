import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { useDesignStore } from "@/lib/store";
import type { ProjectFixture } from "@/lib/types";

const mockSetStyle = vi.fn();
const mockMap = {
  setStyle: mockSetStyle,
  isStyleLoaded: vi.fn(() => true),
  addControl: vi.fn(),
  on: vi.fn(),
  getCanvas: () => ({ style: { cursor: "" } }),
  getSource: vi.fn(() => undefined),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  queryRenderedFeatures: vi.fn(() => []),
  off: vi.fn(),
  remove: vi.fn(),
  getLayer: vi.fn(() => false),
  setLayoutProperty: vi.fn(),
  setFilter: vi.fn(),
  setPaintProperty: vi.fn(),
};

// maplibregl constructors must be real functions so `new` works
const MockMapCtor = function () { return mockMap; } as unknown as new (...args: unknown[]) => unknown;
const MockNavCtor = function () { return {}; } as unknown as new (...args: unknown[]) => unknown;
const MockScaleCtor = function () { return {}; } as unknown as new (...args: unknown[]) => unknown;

vi.mock("maplibre-gl", () => ({
  default: { Map: MockMapCtor, NavigationControl: MockNavCtor, ScaleControl: MockScaleCtor },
  Map: MockMapCtor,
  NavigationControl: MockNavCtor,
  ScaleControl: MockScaleCtor,
}));

vi.mock("@/lib/basemap", () => ({
  BASEMAP_LAYER_STYLES: {},
  loadBasemapLayers: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/lib/basemap-workspace", () => ({
  findBasemapFeature: vi.fn(() => null),
}));

vi.stubGlobal("fetch", vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ type: "FeatureCollection", features: [] }),
  }),
));

vi.stubGlobal("localStorage", {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
});

describe("MapCanvas basemap style effect", () => {
  beforeEach(() => {
    mockSetStyle.mockClear();
    useDesignStore.setState({
      basemap: "satellite",
      elements: {},
      selectedId: null,
      selectedIds: new Set(),
      tool: "select",
      basemapData: null,
      selectedBasemapFeature: null,
      showBasemapCanvas: false,
      visibleBasemapLayers: {},
      lldMode: false,
      draftPath: [],
      draftStartElementId: null,
      grading: null,
      inspectorTab: "attributes",
    });
  });

  it("does not call map.setStyle on initial mount", async () => {
    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p1-greenfield",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 14,
      orgId: "test-org",
    } as unknown as ProjectFixture;

    render(React.createElement(MapCanvas, { project }));
    expect(mockSetStyle).toHaveBeenCalledTimes(0);
  });

  it("survives Strict Mode double-mount without calling setStyle", async () => {
    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p1-greenfield",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 14,
      orgId: "test-org",
    } as unknown as ProjectFixture;

    render(React.createElement(React.StrictMode, null, React.createElement(MapCanvas, { project })));
    expect(mockSetStyle).toHaveBeenCalledTimes(0);
  });

  it("calls map.setStyle once after basemap toggle", async () => {
    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p1-greenfield",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 14,
      orgId: "test-org",
    } as unknown as ProjectFixture;

    const { rerender } = render(React.createElement(MapCanvas, { project }));
    expect(mockSetStyle).toHaveBeenCalledTimes(0);

    useDesignStore.setState({ basemap: "streets" });
    rerender(React.createElement(MapCanvas, { project }));

    expect(mockSetStyle).toHaveBeenCalledTimes(1);
  });
});
