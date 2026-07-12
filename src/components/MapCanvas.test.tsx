import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { useDesignStore } from "@/lib/store";
import type { ProjectFixture } from "@/lib/types";

let styleLoaded = true;
const mockEventHandlers = new Map<string, (...args: unknown[]) => void>();

const mockSetStyle = vi.fn();
const mockAddSource = vi.fn();
const mockAddLayer = vi.fn();
const mockGetSource = vi.fn(() => undefined);
const mockGetLayer = vi.fn(() => false);

const mockMap = {
  setStyle: mockSetStyle,
  isStyleLoaded: () => styleLoaded,
  addControl: vi.fn(),
  on: vi.fn((ev: string, handler: (...args: unknown[]) => void) => {
    mockEventHandlers.set(ev, handler);
  }),
  off: vi.fn(),
  getCanvas: () => ({ style: { cursor: "" } }),
  getSource: mockGetSource,
  addSource: mockAddSource,
  addLayer: mockAddLayer,
  queryRenderedFeatures: vi.fn(() => []),
  getLayer: mockGetLayer,
  setLayoutProperty: vi.fn(),
  setFilter: vi.fn(),
  setPaintProperty: vi.fn(),
  remove: vi.fn(),
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
  BASEMAP_REF_STYLES: {
    parcel: {
      fillColor: "#f59e0b", fillOpacity: 0.08, fillOpacityHover: 0.25, fillOpacitySelected: 0.35,
      lineColor: "#f59e0b", lineOpacity: 0.55, lineWidthMin: 1, lineWidthMax: 1.5,
      labelMinZoom: 18, labelColor: "#fef3c7", labelHaloColor: "#111", labelHaloWidth: 1, labelSize: 10,
    },
    address: {
      circleRadiusMin: 3, circleRadiusMax: 5, circleColorServiceable: "#22c55e", circleColorContext: "#64748b",
      circleOpacityServiceable: 0.95, circleOpacityContext: 0.45, circleOpacityHover: 1.0,
      circleStrokeColor: "#0f172a", circleStrokeWidth: 1.5,
      labelMinZoom: 17, labelColor: "#e2e8f0", labelHaloColor: "#0206", labelHaloWidth: 1.2, labelSize: 10,
    },
  } as const,
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
    styleLoaded = true;
    mockSetStyle.mockClear();
    mockAddSource.mockClear();
    mockAddLayer.mockClear();
    mockGetSource.mockReturnValue(undefined);
    mockGetLayer.mockReturnValue(false);
    mockMap.on.mockClear();
    mockMap.off.mockClear();
    mockEventHandlers.clear();
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

function mockBasemapData() {
  return {
    parcels: [{ id: "R1", type: "Feature" as const, geometry: { type: "Polygon" as const, coordinates: [] }, properties: { parcel_external_id: "R1" } }],
    addresses: [{ id: "A1", type: "Feature" as const, geometry: { type: "Point" as const, coordinates: [0, 0] }, properties: { address_external_id: "A1", serviceable: true } }],
  };
}

describe("MapCanvas layer retry on style load", () => {
  beforeEach(() => {
    styleLoaded = false;
    mockSetStyle.mockClear();
    mockAddSource.mockClear();
    mockAddLayer.mockClear();
    mockGetSource.mockReturnValue(undefined);
    mockGetLayer.mockReturnValue(false);
    mockMap.on.mockClear();
    mockMap.off.mockClear();
    mockEventHandlers.clear();
    // Fetch must return real data so ensureLayers has something to render
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ type: "FeatureCollection", features: [
          { type: "Feature", geometry: { type: "Polygon", coordinates: [] }, properties: { parcel_external_id: "R1" } },
        ] }),
      }),
    ));
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

  it("registers styledata and load listeners even when style is not yet loaded", async () => {
    styleLoaded = false;
    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p10-parkside-georgetown",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 16,
      basemapId: "wilco-l131725c",
      orgId: "test-org",
    } as unknown as ProjectFixture;

    render(React.createElement(MapCanvas, { project }));

    const onCalls = mockMap.on.mock.calls as [string, (...args: unknown[]) => void][];
    const hasStyledata = onCalls.some(([ev]) => ev === "styledata");
    const hasLoad = onCalls.some(([ev]) => ev === "load");
    expect(hasStyledata).toBe(true);
    expect(hasLoad).toBe(true);
  });

  it("does not add sources or layers before style is loaded", async () => {
    styleLoaded = false;
    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p10-parkside-georgetown",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 16,
      basemapId: "wilco-l131725c",
      orgId: "test-org",
    } as unknown as ProjectFixture;

    render(React.createElement(MapCanvas, { project }));

    expect(mockAddSource).not.toHaveBeenCalled();
    expect(mockAddLayer).not.toHaveBeenCalled();
  });

  it("creates sources and layers after the load event fires", async () => {
    styleLoaded = false;
    // Set basemap data in store BEFORE render so the effect sees it
    useDesignStore.setState({ basemapData: mockBasemapData() });

    const { default: MapCanvas } = await import("./MapCanvas");
    const project = {
      id: "p10-parkside-georgetown",
      mapCenter: [-97.7, 30.5] as [number, number],
      mapZoom: 16,
      basemapId: "wilco-l131725c",
      orgId: "test-org",
    } as unknown as ProjectFixture;

    render(React.createElement(MapCanvas, { project }));
    mockAddSource.mockClear();
    mockAddLayer.mockClear();

    // Simulate style loading
    styleLoaded = true;
    const loadHandler = mockEventHandlers.get("load");
    expect(loadHandler).toBeDefined();
    (loadHandler as () => void)();

    expect(mockAddSource).toHaveBeenCalledWith("workspace-parcels", expect.any(Object));
    expect(mockAddSource).toHaveBeenCalledWith("workspace-addresses", expect.any(Object));
    expect(mockAddLayer).toHaveBeenCalled();
  });
});
