"use client";

import { useEffect, useRef } from "react";
import maplibregl, { Map as MLMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import { useDesignStore } from "@/lib/store";
import type { LngLat, NetworkElement, ProjectFixture } from "@/lib/types";
import { isLineElement, isPointElement, type PointElement } from "@/lib/types";
import { nearestPointElement } from "@/lib/geometry";
import { BASEMAP_LAYER_STYLES, loadBasemapLayers } from "@/lib/basemap";
import type { BasemapLayerName } from "@/lib/basemap";

const SNAP_FT = 60;

const BASEMAP_STYLES: Record<string, StyleSpecification> = {
  satellite: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      esri: {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution: "Imagery © Esri",
        maxzoom: 19,
      },
    },
    layers: [{ id: "esri", type: "raster", source: "esri" }],
  },
  streets: {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      carto: {
        type: "raster",
        tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
        tileSize: 256,
        attribution: "© CARTO © OpenStreetMap contributors",
        maxzoom: 20,
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  },
};

const POINT_COLORS: Record<string, string> = {
  co: "#8b5cf6",
  pole: "#f59e0b",
  handhole: "#78716c",
  flowerpot: "#d946ef",
  vault: "#64748b",
  premise: "#22c55e",
  splitter: "#3b82f6",
  mst: "#06b6d4",
  fdh_cabinet: "#ec4899",
  splice_closure: "#ef4444",
  terminal: "#14b8a6",
  riser: "#f97316",
  slack_loop: "#a3a3a3",
};

const LINE_COLORS: Record<string, string> = {
  cable: "#2563eb",
  conduit: "#78350f",
  drop_cable: "#16a34a",
};

function elementsToGeoJSON(elements: NetworkElement[]) {
  const points = {
    type: "FeatureCollection" as const,
    features: elements.filter(isPointElement).map((e) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: e.position },
      properties: {
        id: e.id,
        etype: e.type,
        label: e.label ?? "",
        color: POINT_COLORS[e.type] ?? "#666",
        size: e.type === "co" ? 10 : e.type === "premise" ? 6 : 7,
      },
    })),
  };
  const lines = {
    type: "FeatureCollection" as const,
    features: elements.filter(isLineElement).map((e) => ({
      type: "Feature" as const,
      geometry: { type: "LineString" as const, coordinates: e.path },
      properties: {
        id: e.id,
        etype: e.type,
        color: LINE_COLORS[e.type] ?? "#666",
        width: e.type === "drop_cable" ? 2 : 3.5,
        dash: e.type === "conduit" ? 1 : 0,
      },
    })),
  };
  return { points, lines };
}

export default function MapCanvas({ project }: { project: ProjectFixture }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const basemap = useDesignStore((s) => s.basemap);

  // refs so stable event handlers see fresh state without re-binding
  const stateRef = useRef(useDesignStore.getState());
  useEffect(
    () => useDesignStore.subscribe((s) => (stateRef.current = s)),
    [],
  );

  // dev-only: expose the store for E2E test drivers
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__vetroStore = useDesignStore;
    }
  }, []);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES[useDesignStore.getState().basemap],
      center: project.mapCenter,
      zoom: project.mapZoom,
      doubleClickZoom: false,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.ScaleControl({ unit: "imperial" }),
      "bottom-left",
    );
    mapRef.current = map;

    const addBasemapSources = () => {
      // Load reference layer data. Uses project.referenceBasemap if provided,
      // otherwise falls back to loading the real sample GeoJSON from public/.
      const layers: [BasemapLayerName, GeoJSON.FeatureCollection | null][] = [
        "EOP", "CL", "RW", "PARCEL", "BOUNDARY",
      ].map((name) => {
        const fc = project.referenceBasemap?.[name];
        return [name as BasemapLayerName, fc ?? null];
      });

      // If no project reference basemap, load sample data asynchronously
      if (!project.referenceBasemap) {
        loadBasemapLayers().then((layerSet) => {
          if (!mapRef.current) return;
          for (const [name, fc] of Object.entries(layerSet)) {
            const sourceId = `basemap-${name}`;
            const source = mapRef.current.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
            if (source) {
              source.setData(fc as GeoJSON.FeatureCollection);
            } else {
              try {
                mapRef.current.addSource(sourceId, { type: "geojson", data: fc });
                const style = BASEMAP_LAYER_STYLES[name as BasemapLayerName];
                mapRef.current.addLayer({
                  id: `basemap-layer-${name}`,
                  type: "line",
                  source: sourceId,
                  layout: { visibility: "none" },
                  paint: { "line-color": style.color, "line-width": style.width, "line-opacity": style.opacity },
                } as maplibregl.AddLayerObject);
              } catch { /* already exists */ }
            }
          }
          // Ensure visibility matches store state
          updateBasemapVisibility();
        });
        return; // exit early; sources will be added async
      }

      for (const [name, fc] of layers) {
        if (!fc) continue;
        const sourceId = `basemap-${name}`;
        if (map.getSource(sourceId)) continue;
        const style = BASEMAP_LAYER_STYLES[name];
        map.addSource(sourceId, { type: "geojson", data: fc });
        map.addLayer({
          id: `basemap-layer-${name}`,
          type: "line",
          source: sourceId,
          layout: { visibility: "none" },
          paint: {
            "line-color": style.color,
            "line-width": style.width,
            "line-opacity": style.opacity,
          },
        } as maplibregl.AddLayerObject);
      }
    };

    const updateBasemapVisibility = () => {
      const s = useDesignStore.getState();
      for (const name of Object.keys(BASEMAP_LAYER_STYLES)) {
        const visible = s.showBasemapCanvas && s.visibleBasemapLayers[name];
        const layerId = `basemap-layer-${name}`;
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
        }
      }
    };

    const ensureLayers = () => {
      if (map.getSource("design-lines")) return;
      // Basemap canvas layers go first (below design layers)
      addBasemapSources();
      map.addSource("design-lines", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource("design-points", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource("draft-line", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "design-lines",
        type: "line",
        source: "design-lines",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
        },
      });
      map.addLayer({
        id: "draft-line",
        type: "line",
        source: "draft-line",
        paint: {
          "line-color": "#facc15",
          "line-width": 3,
          "line-dasharray": [2, 1.5],
        },
      });
      map.addLayer({
        id: "design-points",
        type: "circle",
        source: "design-points",
        paint: {
          "circle-radius": ["get", "size"],
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      updateBasemapVisibility();
      syncData();
    };

    const syncData = () => {
      const { elements, draftPath } = stateRef.current;
      const { points, lines } = elementsToGeoJSON(Object.values(elements));
      (map.getSource("design-points") as maplibregl.GeoJSONSource | undefined)?.setData(points);
      (map.getSource("design-lines") as maplibregl.GeoJSONSource | undefined)?.setData(lines);
      const draft =
        draftPath.length >= 1
          ? {
              type: "FeatureCollection" as const,
              features: [
                {
                  type: "Feature" as const,
                  geometry: {
                    type: "LineString" as const,
                    coordinates: draftPath.length === 1 ? [draftPath[0], draftPath[0]] : draftPath,
                  },
                  properties: {},
                },
              ],
            }
          : { type: "FeatureCollection" as const, features: [] };
      (map.getSource("draft-line") as maplibregl.GeoJSONSource | undefined)?.setData(draft);
    };

    map.on("load", ensureLayers);
    // re-add layers after a basemap style swap
    map.on("styledata", ensureLayers);

    const unsubscribe = useDesignStore.subscribe(() => {
      if (map.isStyleLoaded() && map.getSource("design-points")) syncData();
    });

    const handleClick = (ev: MapMouseEvent) => {
      const s = stateRef.current;
      const pos: LngLat = [ev.lngLat.lng, ev.lngLat.lat];
      const all = Object.values(s.elements);
      const snap = (filter?: (e: PointElement) => boolean) =>
        nearestPointElement(pos, all, SNAP_FT, filter);

      if (s.tool === "select") {
        const hit = map.queryRenderedFeatures(ev.point, {
          layers: ["design-points", "design-lines"],
        })[0];
        s.select(hit ? String(hit.properties?.id) : null);
        return;
      }

      if (s.tool === "cable" || s.tool === "conduit" || s.tool === "drop_cable") {
        const snapped = snap();
        const vertex = snapped ? snapped.position : pos;
        if (s.draftPath.length === 0) {
          s.beginLine(vertex, snapped?.id);
        } else if (s.tool === "drop_cable" && snapped) {
          // drops are two-point lines: start elem → end elem
          s.finishLine("drop_cable", vertex, snapped.id);
        } else {
          s.extendLine(vertex);
        }
        return;
      }

      // point placement tools
      if (
        s.tool === "co" || s.tool === "pole" || s.tool === "handhole" ||
        s.tool === "flowerpot" || s.tool === "vault" ||
        s.tool === "premise" || s.tool === "splitter" || s.tool === "mst" ||
        s.tool === "fdh_cabinet" || s.tool === "splice_closure" ||
        s.tool === "terminal" || s.tool === "riser" || s.tool === "slack_loop"
      ) {
        s.addPoint(s.tool, pos);
      }
    };

    const handleDblClick = (ev: MapMouseEvent) => {
      const s = stateRef.current;
      if (
        (s.tool === "cable" || s.tool === "conduit") &&
        s.draftPath.length >= 1
      ) {
        ev.preventDefault();
        const pos: LngLat = [ev.lngLat.lng, ev.lngLat.lat];
        const snapped = nearestPointElement(pos, Object.values(s.elements), SNAP_FT);
        s.finishLine(s.tool, snapped ? snapped.position : pos, snapped?.id);
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === "Escape") s.cancelLine();
      if (e.key === "Enter" && s.draftPath.length >= 2) {
        const tool = s.tool;
        if (tool === "cable" || tool === "conduit") {
          const last = s.draftPath[s.draftPath.length - 1];
          const snapped = nearestPointElement(last, Object.values(s.elements), SNAP_FT);
          s.finishLine(tool, last, snapped?.id);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") s.undo();
      if ((e.ctrlKey || e.metaKey) && e.key === "y") s.redo();
      if (e.key === "Delete" && s.selectedId) s.deleteElement(s.selectedId);
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);
    window.addEventListener("keydown", handleKey);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKey);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // basemap switching
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAP_STYLES[basemap]);
  }, [basemap]);

  // basemap canvas visibility toggle
  const showBasemapCanvas = useDesignStore((s) => s.showBasemapCanvas);
  const visibleBasemapLayers = useDesignStore((s) => s.visibleBasemapLayers);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    // Ensure sources exist after a style switch
    const ensure = () => {
      for (const name of Object.keys(BASEMAP_LAYER_STYLES)) {
        const sourceId = `basemap-${name}`;
        if (map.getSource(sourceId)) continue;
        try {
          const style = BASEMAP_LAYER_STYLES[name as BasemapLayerName];
          map.addSource(sourceId, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });
          map.addLayer({
            id: `basemap-layer-${name}`,
            type: "line",
            source: sourceId,
            layout: { visibility: showBasemapCanvas && visibleBasemapLayers[name] ? "visible" : "none" },
            paint: { "line-color": style.color, "line-width": style.width, "line-opacity": style.opacity },
          } as maplibregl.AddLayerObject);
        } catch { /* already exists */ }
      }
    };
    ensure();
    for (const name of Object.keys(BASEMAP_LAYER_STYLES)) {
      const layerId = `basemap-layer-${name}`;
      const visible = showBasemapCanvas && visibleBasemapLayers[name];
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
      }
    }
  }, [showBasemapCanvas, visibleBasemapLayers]);

  return <div ref={containerRef} className="h-full w-full" />;
}
