"use client";

import { useEffect, useMemo } from "react";
import { useDesignStore } from "@/lib/store";
import { isPointElement, isLineElement, isContainerType, HARDWARE_CATALOG } from "@/lib/types";
import type {
  BasemapDataset,
  BasemapFeature,
  BasemapFeatureSelection,
  BasemapLayerKind,
  CheckResult,
} from "@/lib/types";
import {
  featureLabel,
  featureSummary,
  getBasemapSelectionLabel,
  getRelatedAddressFeatures,
  getRelatedParcelFeature,
  isAddressFeature,
  isParcelFeature,
} from "@/lib/basemap-workspace";

export function RightPanel() {
  const selectedId = useDesignStore((s) => s.selectedId);
  const elements = useDesignStore((s) => s.elements);
  const grading = useDesignStore((s) => s.grading);
  const basemapData = useDesignStore((s) => s.basemapData);
  const selectedBasemapFeature = useDesignStore((s) => s.selectedBasemapFeature);
  const selectBasemapFeature = useDesignStore((s) => s.selectBasemapFeature);
  const activeTab = useDesignStore((s) => s.inspectorTab);
  const setActiveTab = useDesignStore((s) => s.setInspectorTab);

  const selected = selectedId ? elements[selectedId] : null;
  const selectedBasemap = selectedBasemapFeature?.feature ?? null;
  const isPoint = selected ? isPointElement(selected) : false;
  const isLine = selected ? isLineElement(selected) : false;
  const isContainer = isPoint && selected ? isContainerType(selected.type as import("@/lib/types").PointElementType) : false;
  const isBasemapSelection = Boolean(selectedBasemapFeature && selectedBasemap);

  // Compute grading issues for this element
  const elementChecks: CheckResult[] = useMemo(() => {
    if (!grading || !selected || isBasemapSelection) return [];
    return grading.checks.filter((c) => c.elementIds?.includes(selected.id));
  }, [grading, selected, isBasemapSelection]);

  // Compute relationships from grading engine graph
  const relationships = useMemo(() => {
    if (!selected || isBasemapSelection) return [];
    const all = Object.values(elements);
    const connected: { id: string; type: string; relation: string }[] = [];
    if (isPointElement(selected)) {
      for (const el of all) {
        if (isLineElement(el)) {
          if (el.startElementId === selected.id) {
            connected.push({ id: el.id, type: el.type, relation: "starts" });
          }
          if (el.endElementId === selected.id) {
            connected.push({ id: el.id, type: el.type, relation: "ends" });
          }
        }
      }
      if (isContainerType(selected.type)) {
        const hosted = all.filter(
          (e) => isPointElement(e) && e.parent_container_id === selected.id
        );
        for (const h of hosted) {
          connected.push({ id: h.id, type: h.type, relation: "hosted" });
        }
      }
      if (selected.parent_container_id) {
        const container = elements[selected.parent_container_id];
        if (container) {
          connected.push({ id: container.id, type: container.type, relation: "container" });
        }
      }
    }
    if (isLineElement(selected)) {
      const start = selected.startElementId ? elements[selected.startElementId] : null;
      const end = selected.endElementId ? elements[selected.endElementId] : null;
      if (start) connected.push({ id: start.id, type: start.type, relation: "start" });
      if (end) connected.push({ id: end.id, type: end.type, relation: "end" });
    }
    return connected;
  }, [elements, selected, isBasemapSelection]);

  const tabs: { id: string; label: string; badge?: number }[] = useMemo(() => {
    if (isBasemapSelection && selectedBasemapFeature && selectedBasemap) {
      const baseTabs: { id: string; label: string; badge?: number }[] = [
        { id: "attributes", label: "Attributes" },
        { id: "source", label: "Source" },
      ];
      if (isAddressFeature(selectedBasemap) || isParcelFeature(selectedBasemap)) {
        baseTabs.push({ id: "relationships", label: "Relationships" });
      }
      return baseTabs;
    }
    if (!selected) return [{ id: "attributes", label: "Attributes" }];
    const base: { id: string; label: string; badge?: number }[] = [
      { id: "attributes", label: "Attributes" },
      { id: "source", label: "Source" },
      { id: "relationships", label: "Relationships", badge: relationships.length },
    ];
    if (isContainer) base.push({ id: "containment", label: "Containment" });
    if (isPoint) base.push({ id: "connectivity", label: "Connectivity" });
    if (isContainer || isLine) base.push({ id: "capacity", label: "Capacity" });
    base.push({ id: "validation", label: "Validation", badge: elementChecks.length });
    base.push({ id: "history", label: "History" });
    base.push({ id: "notes", label: "Notes" });
    return base;
  }, [selected, selectedBasemap, isBasemapSelection, isPoint, isLine, isContainer, relationships.length, elementChecks.length, selectedBasemapFeature]);

  const title = isBasemapSelection && selectedBasemapFeature && selectedBasemap
    ? `${selectedBasemapFeature.layer.slice(0, -1)} ${featureLabel(selectedBasemap)}`
    : selected
      ? `${selected.type} ${selected.id.slice(0, 8)}`
      : "";

  const subtitle = isBasemapSelection && selectedBasemapFeature && selectedBasemap
    ? featureSummary(selectedBasemap) || getBasemapSelectionLabel(selectedBasemapFeature)
    : "";

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id ?? "attributes");
    }
  }, [tabs, activeTab, setActiveTab]);

  if (!selected && !selectedBasemapFeature) {
    return (
      <div className="p-3 text-xs text-zinc-500">
        Select a feature on the map to inspect its properties.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
        {title} {subtitle ? <span className="text-zinc-500">{subtitle}</span> : null}
      </div>
      <div className="flex border-b border-zinc-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`shrink-0 px-2 py-1 text-[11px] font-medium transition-colors ${
              activeTab === t.id
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className="ml-1 rounded bg-zinc-700 px-1 text-[9px]">{t.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isBasemapSelection && selectedBasemap && selectedBasemapFeature ? (
          <>
            {activeTab === "attributes" && <BasemapAttributesTab feature={selectedBasemap} />}
            {activeTab === "source" && <BasemapSourceTab feature={selectedBasemap} />}
            {activeTab === "relationships" && (
              <BasemapRelationshipsTab
                feature={selectedBasemap}
                layer={selectedBasemapFeature.layer}
                basemapData={basemapData}
                onSelect={selectBasemapFeature}
              />
            )}
          </>
        ) : (
          <>
            {activeTab === "attributes" && (selected ? <AttributesTab element={selected} /> : null)}
            {activeTab === "source" && (selected ? <SourceTab element={selected} /> : null)}
            {activeTab === "relationships" && <RelationshipsTab relationships={relationships} />}
            {activeTab === "containment" && isContainer && selected && isPointElement(selected) ? <ContainmentTab element={selected} /> : null}
            {activeTab === "connectivity" && isPoint && selected && isPointElement(selected) ? <ConnectivityTab element={selected} /> : null}
            {activeTab === "capacity" && (isContainer || isLine) && selected ? <CapacityTab element={selected} /> : null}
            {activeTab === "validation" && <ValidationTab checks={elementChecks} />}
            {activeTab === "history" && (selected ? <HistoryTab elementId={selected.id} /> : null)}
            {activeTab === "notes" && (selected ? <NotesTab elementId={selected.id} /> : null)}
          </>
        )}
      </div>
    </div>
  );
}

function AttributesTab({ element }: { element: import("@/lib/types").NetworkElement }) {
  const entries = Object.entries(element.attributes);
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr] gap-1 text-xs">
        <div className="text-zinc-500">id</div>
        <div className="text-zinc-300">{element.id}</div>
        <div className="text-zinc-500">type</div>
        <div className="text-zinc-300">{element.type}</div>
        <div className="text-zinc-500">label</div>
        <div className="text-zinc-300">{element.label ?? "—"}</div>
        {"position" in element && (
          <>
            <div className="text-zinc-500">lon</div>
            <div className="text-zinc-300">{element.position[0].toFixed(6)}</div>
            <div className="text-zinc-500">lat</div>
            <div className="text-zinc-300">{element.position[1].toFixed(6)}</div>
          </>
        )}
        {"path" in element && (
          <>
            <div className="text-zinc-500">vertices</div>
            <div className="text-zinc-300">{element.path.length}</div>
          </>
        )}
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <div className="text-zinc-500">{k}</div>
            <div className="text-zinc-300">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BasemapAttributesTab({ feature }: { feature: BasemapFeature }) {
  const entries = Object.entries(feature.properties);
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr] gap-1 text-xs">
        <div className="text-zinc-500">id</div>
        <div className="text-zinc-300">{feature.id}</div>
        <div className="text-zinc-500">geometry</div>
        <div className="text-zinc-300">{feature.geometry.type}</div>
        <div className="text-zinc-500">label</div>
        <div className="text-zinc-300">{featureLabel(feature)}</div>
        <div className="text-zinc-500">summary</div>
        <div className="text-zinc-300">{featureSummary(feature) || "—"}</div>
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <div className="text-zinc-500">{key}</div>
            <div className="text-zinc-300 break-words">{String(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BasemapSourceTab({ feature }: { feature: BasemapFeature }) {
  const props = feature.properties as Record<string, unknown>;
  const isAddr = isAddressFeature(feature);
  const isPcl = isParcelFeature(feature);
  return (
    <div className="space-y-2 text-xs">
      <div className="grid grid-cols-[1fr_1fr] gap-1">
        <div className="text-zinc-500">Source</div>
        <div className="text-zinc-300">{isPcl ? "WCAD" : "Wilco 911"}</div>
        <div className="text-zinc-500">Last Update</div>
        <div className="text-zinc-300">{String(props.source_last_update ?? "—")}</div>
        <div className="text-zinc-500">Layer</div>
        <div className="text-zinc-300">{isAddr ? "Addresses" : "Parcels"}</div>
        {isAddr && (
          <>
            <div className="text-zinc-500">Serviceable</div>
            <div className="text-zinc-300">{String(props.serviceable ?? false)}</div>
            <div className="text-zinc-500">Status</div>
            <div className="text-zinc-300">{String(props.status ?? "—")}</div>
          </>
        )}
        {isPcl && (
          <>
            <div className="text-zinc-500">Land Use</div>
            <div className="text-zinc-300">{String(props.land_use ?? "—")}</div>
            <div className="text-zinc-500">Situs Address</div>
            <div className="text-zinc-300">{String(props.site_address ?? "—")}</div>
            <div className="text-zinc-500">Acreage</div>
            <div className="text-zinc-300">{String(props.acreage ?? props.acres ?? "—")}</div>
          </>
        )}
      </div>
      <div className="rounded bg-zinc-800/50 px-2 py-1.5 text-[10px] text-zinc-400 leading-relaxed">
        {isPcl
          ? "Williamson County Appraisal District (WCAD). Public domain — WCAD is authoritative for parcel boundaries, ownership, and land use."
          : "Williamson County 911 Addressing. CITY='WC' = unincorporated Williamson County (no municipal jurisdiction)."}
      </div>
    </div>
  );
}

function BasemapRelationshipsTab({
  feature,
  layer,
  basemapData,
  onSelect,
}: {
  feature: BasemapFeature;
  layer: BasemapLayerKind;
  basemapData: BasemapDataset | null;
  onSelect: (selection: BasemapFeatureSelection | null) => void;
}) {
  if (!basemapData) {
    return <div className="text-xs text-zinc-500">Basemap data is still loading.</div>;
  }

  if (layer === "addresses" && isAddressFeature(feature)) {
    const parcel = getRelatedParcelFeature(basemapData, feature);
    return (
      <div className="space-y-2 text-xs">
        <div className="text-zinc-500">Linked parcel</div>
        {parcel ? (
          <button
            type="button"
            onClick={() => onSelect({ layer: "parcels", feature: parcel })}
            className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-left text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700"
          >
            <div className="font-medium">{featureLabel(parcel)}</div>
            <div className="text-[10px] text-zinc-400">{featureSummary(parcel) || "Parcel record"}</div>
          </button>
        ) : (
          <div className="text-zinc-500">No linked parcel available.</div>
        )}
      </div>
    );
  }

  if (layer === "parcels" && isParcelFeature(feature)) {
    const addresses = getRelatedAddressFeatures(basemapData, feature);
    return (
      <div className="space-y-2 text-xs">
        <div className="text-zinc-500">{addresses.length} address{addresses.length === 1 ? "" : "es"} reference this parcel.</div>
        <div className="space-y-1">
          {addresses.slice(0, 12).map((address) => (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect({ layer: "addresses", feature: address })}
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-left text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700"
            >
              <div className="font-medium">{featureLabel(address)}</div>
              <div className="text-[10px] text-zinc-400">{featureSummary(address) || "Address record"}</div>
            </button>
          ))}
        </div>
        {addresses.length > 12 && (
          <div className="text-[10px] text-zinc-500">Showing first 12 linked addresses.</div>
        )}
      </div>
    );
  }

  return <div className="text-xs text-zinc-500">No related records found.</div>;
}

function SourceTab({ element }: { element: import("@/lib/types").NetworkElement }) {
  const attrs = element.attributes ?? {};
  return (
    <div className="space-y-1 text-xs">
      <div className="grid grid-cols-[1fr_1fr] gap-1">
        <div className="text-zinc-500">Source</div>
        <div className="text-zinc-300">{String(attrs.source_id ?? "—")}</div>
        <div className="text-zinc-500">Publisher</div>
        <div className="text-zinc-300">{String(attrs.publisher ?? "—")}</div>
        <div className="text-zinc-500">CRS</div>
        <div className="text-zinc-300">{String(attrs.crs ?? "EPSG:4326")}</div>
        <div className="text-zinc-500">Import Date</div>
        <div className="text-zinc-300">{String(attrs.import_date ?? "—")}</div>
      </div>
    </div>
  );
}

function HistoryTab({ elementId }: { elementId: string }) {
  void elementId;
  return (
    <div className="text-xs text-zinc-500">
      <p>Element history tracking will be available once versioned design revisions are implemented.</p>
    </div>
  );
}

function RelationshipsTab({ relationships }: { relationships: { id: string; type: string; relation: string }[] }) {
  if (relationships.length === 0) {
    return <div className="text-xs text-zinc-500">No relationships found.</div>;
  }
  return (
    <div className="space-y-1">
      {relationships.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-zinc-800/50 px-2 py-1 text-xs">
          <span className="rounded bg-zinc-700 px-1 text-[10px] text-zinc-300">{r.relation}</span>
          <span className="text-zinc-300">{r.type}</span>
          <span className="ml-auto text-zinc-500">{r.id.slice(0, 8)}</span>
        </div>
      ))}
    </div>
  );
}

function ContainmentTab({ element }: { element: import("@/lib/types").PointElement }) {
  const elements = useDesignStore((s) => s.elements);
  const hosted = Object.values(elements).filter(
    (e) => "parent_container_id" in e && e.parent_container_id === element.id
  );
  const catalogKey = String(element.attributes.catalog_key ?? "");
  const entry = catalogKey ? HARDWARE_CATALOG[catalogKey] : undefined;
  const maxHosted = entry?.maxHostedCount ?? 4;
  const usage = hosted.length;
  const pct = Math.round((usage / maxHosted) * 100);

  return (
    <div className="space-y-2">
      <div className="text-xs text-zinc-400">
        Capacity: {usage} / {maxHosted}
      </div>
      <div className="h-2 w-full rounded bg-zinc-800">
        <div
          className={`h-full rounded ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-yellow-500" : "bg-green-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="space-y-1">
        {hosted.map((h) => (
          <div key={h.id} className="rounded bg-zinc-800/50 px-2 py-1 text-xs text-zinc-300">
            {h.type} <span className="text-zinc-500">{h.id.slice(0, 8)}</span>
          </div>
        ))}
        {hosted.length === 0 && (
          <div className="text-xs text-zinc-500 italic">No hosted equipment.</div>
        )}
      </div>
    </div>
  );
}

function ConnectivityTab({ element }: { element: import("@/lib/types").PointElement }) {
  // Simple connectivity check: is this element connected to a CO?
  const elements = useDesignStore((s) => s.elements);
  const all = Object.values(elements);
  // Quick BFS using lines
  const lines = all.filter((e) => "path" in e);
  const graph = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)!.add(b);
    graph.get(b)!.add(a);
  };
  for (const line of lines) {
    if (line.startElementId && line.endElementId) {
      link(line.startElementId, line.endElementId);
    }
  }
  // Add containment links
  for (const p of all) {
    if ("parent_container_id" in p && p.parent_container_id) {
      link(p.id, p.parent_container_id);
    }
  }
  const co = all.find((e) => "type" in e && e.type === "co");
  let reachable = false;
  if (co) {
    const seen = new Set<string>([element.id]);
    const queue = [element.id];
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur === co.id) { reachable = true; break; }
      for (const next of graph.get(cur) ?? []) {
        if (!seen.has(next)) { seen.add(next); queue.push(next); }
      }
    }
  }

  return (
    <div className="text-xs space-y-2">
      <div className="text-zinc-400">
        Reachable from CO: {reachable ? (
          <span className="text-green-400">Yes</span>
        ) : (
          <span className="text-red-400">No</span>
        )}
      </div>
      {!reachable && (
        <div className="text-zinc-500">
          This element is not connected to the Central Office via cables/conduit.
        </div>
      )}
    </div>
  );
}

function CapacityTab({ element }: { element: import("@/lib/types").NetworkElement }) {
  if ("path" in element) {
    const count = Number(element.attributes.cable_count ?? 0);
    return (
      <div className="text-xs text-zinc-400">
        <div>Cable count: {count}</div>
        <div>Type: {String(element.attributes.cable_type ?? "—")}</div>
      </div>
    );
  }
  return <div className="text-xs text-zinc-500">Capacity data not available.</div>;
}

function ValidationTab({ checks }: { checks: CheckResult[] }) {
  if (checks.length === 0) {
    return <div className="text-xs text-green-400">No validation issues for this element.</div>;
  }
  return (
    <div className="space-y-2">
      {checks.map((c) => (
        <div key={c.checkId} className={`rounded p-2 text-xs ${
          c.status === "fail" ? "bg-red-950/30 text-red-300" : "bg-yellow-950/30 text-yellow-300"
        }`}>
          <div className="font-medium">{c.checkId}</div>
          <div className="text-zinc-400">{c.message}</div>
        </div>
      ))}
    </div>
  );
}

function NotesTab({ elementId }: { elementId: string }) {
  const notes = useDesignStore((s) => {
    const el = s.elements[elementId];
    return String(el?.attributes.notes ?? "");
  });
  const updateAttributes = useDesignStore((s) => s.updateAttributes);

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => updateAttributes(elementId, { notes: e.target.value })}
        placeholder="Add notes about this element…"
        className="w-full h-24 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
      />
      <div className="text-[10px] text-zinc-500">Notes are saved with the design snapshot.</div>
    </div>
  );
}
