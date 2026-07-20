"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MLMap, MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import { useDesignStore } from "@/lib/store";
import type { LngLat, NetworkElement, ProjectFixture } from "@/lib/types";
import { isLineElement, isPointElement, type PointElement } from "@/lib/types";
import { nearestPointElement } from "@/lib/geometry";
import { BASEMAP_LAYER_STYLES, loadBasemapLayers } from "@/lib/basemap";
import type { BasemapLayerName } from "@/lib/basemap";
import { findBasemapFeature } from "@/lib/basemap-workspace";
import { BASEMAP_REF_STYLES } from "@/lib/basemap-workspace";
import { authFetch } from "@/lib/api-client";

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
  const basemapData = useDesignStore((s) => s.basemapData);
  const setBasemapData = useDesignStore((s) => s.setBasemapData);
  const selectedBasemapFeature = useDesignStore((s) => s.selectedBasemapFeature);
  const selectBasemapFeature = useDesignStore((s) => s.selectBasemapFeature);

  // refs so stable event handlers see fresh state without re-binding
  const stateRef = useRef(useDesignStore.getState());
  useEffect(
    () => useDesignStore.subscribe((s) => (stateRef.current = s)),
    [],
  );
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);
  const hoveredParcelIdRef = useRef<string | null>(null);

  useEffect(() => {
    hoveredParcelIdRef.current = hoveredParcelId;
  }, [hoveredParcelId]);

  // dev-only: expose the store for E2E test drivers
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as unknown as Record<string, unknown>).__vetroStore = useDesignStore;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!project.basemapId) {
      setBasemapData(null);
      return () => {
        cancelled = true;
      };
    }

    async function loadBasemapData() {
      try {
        const [parcelsRes, addressesRes] = await Promise.all([
          authFetch(`/api/projects/${project.id}/layers/parcels`),
          authFetch(`/api/projects/${project.id}/layers/addresses`),
        ]);
        if (!parcelsRes.ok || !addressesRes.ok) {
          throw new Error("Failed to load parcel/address basemap data");
        }
        const [parcelsJson, addressesJson] = await Promise.all([
          parcelsRes.json(),
          addressesRes.json(),
        ]);
        if (cancelled) return;
        if (process.env.NODE_ENV !== "production") {
          const dc = (globalThis as Record<string, unknown>).__debugCalls as Record<string, unknown> | undefined;
          if (dc) {
            dc.setBasemapData = ((dc.setBasemapData as number) ?? 0) + 1;
            dc.setBasemapParcels = (parcelsJson.features as Array<unknown>).length;
            dc.setBasemapAddresses = (addressesJson.features as Array<unknown>).length;
          }
        }
        setBasemapData({
          parcels: parcelsJson.features ?? [],
          addresses: addressesJson.features ?? [],
        });
      } catch (error) {
        if (!cancelled) {
          console.warn("[MapCanvas] basemap data load failed", error);
          setBasemapData(null);
        }
      }
    }

    void loadBasemapData();
    return () => {
      cancelled = true;
    };
  }, [project.basemapId, project.id, setBasemapData]);

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
    // Capture the basemap used at construction so the switching effect
    // can skip setStyle on the initial render while still reacting to
    // genuine user toggles.  Tied to the Map instance so it survives
    // Strict Mode's double-invoke (mount-unmount-remount).
    initialBasemapRef.current = useDesignStore.getState().basemap;
    mapRef.current = map;
    // Expose the map instance for Playwright/DevTools introspection.
    // Only in dev/test — absent from production bundles.
    if (process.env.NODE_ENV !== "production") {
      (globalThis as Record<string, unknown>).__mapDebug = map;
      (globalThis as Record<string, unknown>).__debugCalls = { ensureLayers: 0, setBasemapData: 0 };
    }

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
        }).catch((err) => {
          console.warn("[MapCanvas] Basemap layers failed to load:", err);
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
      const currentBasemapData = s.basemapData;
      const pos: LngLat = [ev.lngLat.lng, ev.lngLat.lat];
      const all = Object.values(s.elements);
      const snap = (filter?: (e: PointElement) => boolean) =>
        nearestPointElement(pos, all, SNAP_FT, filter);

      if (s.tool === "select") {
        const workspaceHit = currentBasemapData
          ? map.queryRenderedFeatures(ev.point, {
              layers: [
                "workspace-addresses-circle",
                "workspace-addresses-label",
                "workspace-parcels-fill",
                "workspace-parcels-line",
                "workspace-parcels-label",
              ],
          })[0]
          : null;
        if (workspaceHit) {
          const addressId = String(workspaceHit.properties?.address_external_id ?? "");
          const parcelId = String(workspaceHit.properties?.parcel_external_id ?? "");
          if (addressId && currentBasemapData) {
            const hit = findBasemapFeature(currentBasemapData, "addresses", addressId);
            if (hit) {
              selectBasemapFeature({ layer: "addresses", feature: hit });
              return;
            }
          }
          if (parcelId && currentBasemapData) {
            const hit = findBasemapFeature(currentBasemapData, "parcels", parcelId);
            if (hit) {
              selectBasemapFeature({ layer: "parcels", feature: hit });
              return;
            }
          }
        }

        const hit = map.queryRenderedFeatures(ev.point, {
          layers: ["design-points", "design-lines"],
        })[0];
        if (ev.originalEvent.shiftKey && hit) {
          s.toggleSelection(String(hit.properties?.id));
        } else {
          s.select(hit ? String(hit.properties?.id) : null);
        }
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

    // Rect-drag multi-select (C2: shift-click + rect-drag for premise selection)
    let dragActive = false;
    const handleMouseDown = (ev: MapMouseEvent) => {
      const s = stateRef.current;
      if (s.tool !== "select") return;
      // Only start rect-drag when clicking on empty map (no element or basemap hit)
      const hit = map.queryRenderedFeatures(ev.point, {
        layers: ["design-points", "design-lines", "workspace-parcels-fill", "workspace-addresses-circle"],
      });
      if (hit.length > 0) return;
      dragActive = true;
      // Use a property on the map instance for the mutable drag rect
      (map as unknown as Record<string, unknown>)._dragRect = { start: [ev.lngLat.lng, ev.lngLat.lat] as LngLat, end: [ev.lngLat.lng, ev.lngLat.lat] as LngLat };
    };
    const handleMouseMove = (ev: MapMouseEvent) => {
      if (!dragActive) return;
      const rect = (map as unknown as Record<string, unknown>)._dragRect as { start: LngLat; end: LngLat } | undefined;
      if (rect) rect.end = [ev.lngLat.lng, ev.lngLat.lat];
    };
    const handleMouseUp = (ev: MapMouseEvent) => {
      if (!dragActive) return;
      dragActive = false;
      const rect = (map as unknown as Record<string, unknown>)._dragRect as { start: LngLat; end: LngLat } | undefined;
      if (!rect) return;
      const [sx, sy] = rect.start;
      const [ex, ey] = rect.end;
      const minX = Math.min(sx, ex);
      const maxX = Math.max(sx, ex);
      const minY = Math.min(sy, ey);
      const maxY = Math.max(sy, ey);
      // Only select if the rect has meaningful size (not a click)
      if (Math.abs(ex - sx) < 0.0001 && Math.abs(ey - sy) < 0.0001) return;
      const s = stateRef.current;
      const inRect = Object.values(s.elements).filter((e) => {
        if (e.type !== "premise") return false;
        const pos = (e as { position?: LngLat }).position;
        if (!pos) return false;
        return pos[0] >= minX && pos[0] <= maxX && pos[1] >= minY && pos[1] <= maxY;
      });
      if (inRect.length > 0) {
        // If shift held, add to existing selection; otherwise replace
        const existing = ev.originalEvent.shiftKey ? new Set(s.selectedIds) : new Set<string>();
        inRect.forEach((e) => existing.add(e.id));
        s.select(inRect[inRect.length - 1].id);
        useDesignStore.setState({ selectedIds: existing });
      }
      delete (map as unknown as Record<string, unknown>)._dragRect;
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKey);

    return () => {
      unsubscribe();
      window.removeEventListener("keydown", handleKey);
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  // Store the basemap value used at map construction time so the
  // switching effect can detect genuine user toggles vs the initial
  // render — calling setStyle() when the style already matches causes
  // a "Style is not done loading" warning loop that stalls style loading.
  const initialBasemapRef = useRef<string>("satellite");

  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemap === initialBasemapRef.current) return;
    map.setStyle(BASEMAP_STYLES[basemap]);
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const parcelSourceId = "workspace-parcels";
    const addressSourceId = "workspace-addresses";
    const parcelFillId = "workspace-parcels-fill";
    const parcelLineId = "workspace-parcels-line";
    const parcelLabelId = "workspace-parcels-label";
    const addressCircleId = "workspace-addresses-circle";
    const addressLabelId = "workspace-addresses-label";

    const ensureSource = (id: string, data: GeoJSON.FeatureCollection) => {
      const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(id, { type: "geojson", data });
      }
    };

    const ensureLayers = () => {
      if (process.env.NODE_ENV !== "production") {
        const dc = (globalThis as Record<string, unknown>).__debugCalls as Record<string, unknown> | undefined;
        if (dc) {
          dc.ensureLayers = ((dc.ensureLayers as number) ?? 0) + 1;
          dc.lastBasemapData = basemapData ? "set" : "null";
          // After adding sources/layers, snapshot the map's style sources
          try {
            const sty = map.getStyle() as Record<string, unknown>;
            if (sty?.sources) (dc as Record<string, unknown>).sourceCount = Object.keys(sty.sources as Record<string, unknown>).length;
            if (sty?.layers) (dc as Record<string, unknown>).layerCount = (sty.layers as Array<unknown>).length;
            (dc as Record<string, unknown>).hasWorkspaceParcels = sty?.sources ? "workspace-parcels" in (sty.sources as Record<string, unknown>) : false;
            // Also check getSource directly for cross-reference
            try {
              (dc as Record<string, unknown>).getSourceParcels = map.getSource("workspace-parcels") != null;
            } catch { (dc as Record<string, unknown>).getSourceParcels = false; }
          } catch { /* ignore */ }
        }
      }
      if (!basemapData) {
        return;
      }

      const parcelCollection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: basemapData.parcels,
      };
      const addressCollection: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: basemapData.addresses,
      };

      ensureSource(parcelSourceId, parcelCollection);
      ensureSource(addressSourceId, addressCollection);

      if (!map.getLayer(parcelFillId)) {
        map.addLayer({
          id: parcelFillId,
          type: "fill",
          source: parcelSourceId,
          paint: {
            "fill-color": BASEMAP_REF_STYLES.parcel.fillColor,
            "fill-opacity": BASEMAP_REF_STYLES.parcel.fillOpacity,
          },
        });
      }
      if (!map.getLayer(parcelLineId)) {
        map.addLayer({
          id: parcelLineId,
          type: "line",
          source: parcelSourceId,
          paint: {
            "line-color": BASEMAP_REF_STYLES.parcel.lineColor,
            "line-opacity": BASEMAP_REF_STYLES.parcel.lineOpacity,
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              15, BASEMAP_REF_STYLES.parcel.lineWidthMin,
              18, BASEMAP_REF_STYLES.parcel.lineWidthMax,
            ],
          },
        });
      }
      if (!map.getLayer(parcelLabelId)) {
        map.addLayer({
          id: parcelLabelId,
          type: "symbol",
          source: parcelSourceId,
          minzoom: BASEMAP_REF_STYLES.parcel.labelMinZoom,
          layout: {
            "text-field": ["get", "parcel_external_id"],
            "text-size": BASEMAP_REF_STYLES.parcel.labelSize,
            "text-anchor": "center",
            "text-allow-overlap": true,
          },
          paint: {
            "text-color": BASEMAP_REF_STYLES.parcel.labelColor,
            "text-halo-color": BASEMAP_REF_STYLES.parcel.labelHaloColor,
            "text-halo-width": BASEMAP_REF_STYLES.parcel.labelHaloWidth,
          },
        });
      }
      if (!map.getLayer(addressCircleId)) {
        map.addLayer({
          id: addressCircleId,
          type: "circle",
          source: addressSourceId,
          minzoom: 15,
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              15, BASEMAP_REF_STYLES.address.circleRadiusMin,
              18, BASEMAP_REF_STYLES.address.circleRadiusMax,
            ],
            "circle-color": [
              "case",
              ["==", ["get", "serviceable"], true],
              BASEMAP_REF_STYLES.address.circleColorServiceable,
              BASEMAP_REF_STYLES.address.circleColorContext,
            ],
            "circle-opacity": [
              "case",
              ["==", ["get", "serviceable"], true],
              BASEMAP_REF_STYLES.address.circleOpacityServiceable,
              BASEMAP_REF_STYLES.address.circleOpacityContext,
            ],
            "circle-stroke-width": BASEMAP_REF_STYLES.address.circleStrokeWidth,
            "circle-stroke-color": BASEMAP_REF_STYLES.address.circleStrokeColor,
          },
        });
      }
      if (!map.getLayer(addressLabelId)) {
        map.addLayer({
          id: addressLabelId,
          type: "symbol",
          source: addressSourceId,
          minzoom: BASEMAP_REF_STYLES.address.labelMinZoom,
          layout: {
            "text-field": ["coalesce", ["to-string", ["get", "house_number"]], ["get", "full_address"]],
            "text-size": BASEMAP_REF_STYLES.address.labelSize,
            "text-offset": [0, 1],
            "text-anchor": "top",
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": BASEMAP_REF_STYLES.address.labelColor,
            "text-halo-color": BASEMAP_REF_STYLES.address.labelHaloColor,
            "text-halo-width": BASEMAP_REF_STYLES.address.labelHaloWidth,
          },
        });
      }
    };

    // Project boundary — dashed amber polygon rendered when the fixture
    // defines a service-area boundary (Parkside Georgetown).
    const boundarySourceId = "workspace-boundary";
    const boundaryLayerId = "workspace-boundary-line";
    if (project.boundary) {
      const source = map.getSource(boundarySourceId) as maplibregl.GeoJSONSource | undefined;
      if (!source) {
        map.addSource(boundarySourceId, {
          type: "geojson",
          data: { type: "FeatureCollection", features: [{ type: "Feature", geometry: project.boundary, properties: {} }] },
        });
      }
      if (!map.getLayer(boundaryLayerId)) {
        map.addLayer({
          id: boundaryLayerId,
          type: "line",
          source: boundarySourceId,
          paint: {
            "line-color": "#f59e0b",
            "line-width": 2,
            "line-dasharray": [4, 2],
            "line-opacity": 0.7,
          },
        });
      }
    }

    const syncParcelLabels = (hoveredId: string | null, selectedFeature: typeof selectedBasemapFeature) => {
      if (!map.getLayer(parcelLabelId)) return;
      const labelIds = new Set<string>();
      if (hoveredId) {
        labelIds.add(hoveredId);
      }
      if (selectedFeature?.layer === "parcels") {
        labelIds.add(selectedFeature.feature.id);
      }
      const parcelExternalIds = [...labelIds]
        .map((id) => findBasemapFeature(basemapData, "parcels", id)?.properties.parcel_external_id)
        .filter((value): value is string => Boolean(value));
      map.setLayoutProperty(parcelLabelId, "visibility", parcelExternalIds.length > 0 ? "visible" : "none");
      map.setFilter(
        parcelLabelId,
        parcelExternalIds.length > 0
          ? ["in", ["get", "parcel_external_id"], ["literal", parcelExternalIds]]
          : ["==", ["get", "parcel_external_id"], "__none__"],
      );
    };

    // isStyleLoaded() stays false while raster TILES are still streaming
    // (potentially 10+ s on the Esri source), long after the style JSON is
    // ready. "styledata" never fires again after initial load and "load"
    // fires exactly once — both can pre-date this effect's re-run when
    // basemapData arrives, leaving a dead window where layers are never
    // added. "idle" is guaranteed to fire once the map settles, so re-arm
    // on it until the style reports ready.
    const tryEnsureLayers = () => {
      if (!map.isStyleLoaded()) {
        map.once("idle", tryEnsureLayers);
        return;
      }
      ensureLayers();
      syncParcelLabels(hoveredParcelIdRef.current, useDesignStore.getState().selectedBasemapFeature);
    };
    tryEnsureLayers();

    const handleMove = (ev: maplibregl.MapMouseEvent) => {
      if (!basemapData) return;
      const hit = map.queryRenderedFeatures(ev.point, {
        layers: [parcelFillId, parcelLineId],
      })[0];
      if (!hit) {
        setHoveredParcelId((prev) => (prev === null ? prev : null));
        map.getCanvas().style.cursor = "";
        return;
      }
      const parcelId = String(hit.properties?.parcel_external_id ?? "");
      if (!parcelId) return;
      setHoveredParcelId((prev) => (prev === parcelId ? prev : parcelId));
      map.getCanvas().style.cursor = "pointer";
    };

    const handleLeave = () => {
      setHoveredParcelId((prev) => (prev === null ? prev : null));
      map.getCanvas().style.cursor = "";
    };

    const handleStyleRefresh = () => {
      if (!map.isStyleLoaded()) return;
      ensureLayers();
      syncParcelLabels(hoveredParcelIdRef.current, useDesignStore.getState().selectedBasemapFeature);
    };

    map.on("mousemove", handleMove);
    map.on("mouseleave", handleLeave);
    map.on("styledata", handleStyleRefresh);
    map.on("load", handleStyleRefresh);

    return () => {
      map.off("mousemove", handleMove);
      map.off("mouseleave", handleLeave);
      map.off("styledata", handleStyleRefresh);
      map.off("load", handleStyleRefresh);
      map.off("idle", tryEnsureLayers);
    };
  }, [basemapData, selectedBasemapFeature, project.boundary]);

  // Drive hover/selected visual state on the parcel fill layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const parcelFillId = "workspace-parcels-fill";
    if (!map.getLayer(parcelFillId)) return;

    const selectedParcelId = selectedBasemapFeature?.layer === "parcels"
      ? selectedBasemapFeature.feature.id
      : null;

    map.setPaintProperty(parcelFillId, "fill-opacity", [
      "case",
      ["==", ["get", "parcel_external_id"], ["literal", selectedParcelId ?? "__none__"]],
      BASEMAP_REF_STYLES.parcel.fillOpacitySelected,
      ["==", ["get", "parcel_external_id"], ["literal", hoveredParcelId ?? "__none__"]],
      BASEMAP_REF_STYLES.parcel.fillOpacityHover,
      BASEMAP_REF_STYLES.parcel.fillOpacity,
    ]);
  }, [hoveredParcelId, selectedBasemapFeature]);

  const refParcelsVisible = useDesignStore((s) => s.refParcelsVisible);
  const refAddressesVisible = useDesignStore((s) => s.refAddressesVisible);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const parcelFillId = "workspace-parcels-fill";
    const parcelLineId = "workspace-parcels-line";
    const parcelLabelId = "workspace-parcels-label";
    const addressCircleId = "workspace-addresses-circle";
    const addressLabelId = "workspace-addresses-label";
    const parcelVis = refParcelsVisible ? "visible" : "none";
    const addressVis = refAddressesVisible ? "visible" : "none";
    if (map.getLayer(parcelFillId)) map.setLayoutProperty(parcelFillId, "visibility", parcelVis);
    if (map.getLayer(parcelLineId)) map.setLayoutProperty(parcelLineId, "visibility", parcelVis);
    if (map.getLayer(parcelLabelId)) map.setLayoutProperty(parcelLabelId, "visibility", parcelVis);
    if (map.getLayer(addressCircleId)) map.setLayoutProperty(addressCircleId, "visibility", addressVis);
    if (map.getLayer(addressLabelId)) map.setLayoutProperty(addressLabelId, "visibility", addressVis);
  }, [refParcelsVisible, refAddressesVisible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !basemapData) return;
    const parcelLabelId = "workspace-parcels-label";
    if (!map.getLayer(parcelLabelId)) return;

    const parcelExternalIds = [
      ...(hoveredParcelId ? [hoveredParcelId] : []),
      ...(selectedBasemapFeature?.layer === "parcels" ? [selectedBasemapFeature.feature.id] : []),
    ]
      .map((id) => findBasemapFeature(basemapData, "parcels", id)?.properties.parcel_external_id)
      .filter((value): value is string => Boolean(value));

    map.setLayoutProperty(parcelLabelId, "visibility", parcelExternalIds.length > 0 ? "visible" : "none");
    map.setFilter(
      parcelLabelId,
      parcelExternalIds.length > 0
        ? ["in", ["get", "parcel_external_id"], ["literal", parcelExternalIds]]
        : ["==", ["get", "parcel_external_id"], "__none__"],
    );
  }, [basemapData, hoveredParcelId, selectedBasemapFeature]);

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

  // Service group hull rendering
  const serviceGroups = useDesignStore((s) => s.serviceGroups);
  const designElements = useDesignStore((s) => s.elements);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const groupSourceId = "service-group-hulls";

    // Collect all group polygons
    const features: GeoJSON.Feature[] = [];
    for (const g of Object.values(serviceGroups)) {
      const premises = g.premiseIds.map((id) => designElements[id]).filter(Boolean);
      if (premises.length < 2) continue;
      const posns = premises.map((e) => {
        const pos = (e as { position?: [number, number] }).position;
        return pos ? [pos[0], pos[1]] as [number, number] : null;
      }).filter(Boolean) as [number, number][];
      if (posns.length < 3) continue;
      // Simple bounding polygon with padding
      const pad = 0.00015;
      const minLng = Math.min(...posns.map((p) => p[0])) - pad;
      const maxLng = Math.max(...posns.map((p) => p[0])) + pad;
      const minLat = Math.min(...posns.map((p) => p[1])) - pad;
      const maxLat = Math.max(...posns.map((p) => p[1])) + pad;
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[minLng, minLat], [maxLng, minLat], [maxLng, maxLat], [minLng, maxLat], [minLng, minLat]]],
        },
        properties: { name: g.name, color: g.color },
      });
    }

    const source = map.getSource(groupSourceId) as maplibregl.GeoJSONSource | undefined;
    if (features.length === 0) {
      if (source) source.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    if (source) {
      source.setData({ type: "FeatureCollection", features });
    } else {
      map.addSource(groupSourceId, { type: "geojson", data: { type: "FeatureCollection", features } });
      map.addLayer({
        id: "service-group-hulls",
        type: "fill",
        source: groupSourceId,
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": 0.15,
        },
      });
      map.addLayer({
        id: "service-group-hulls-line",
        type: "line",
        source: groupSourceId,
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-dasharray": [4, 2],
          "line-opacity": 0.6,
        },
      });
    }
  }, [serviceGroups, designElements]);

  return <div ref={containerRef} className="h-full w-full" />;
}
