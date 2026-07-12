"use client";

import { useDesignStore } from "@/lib/store";

export function WorkspaceStatusBar() {
  const selectedId = useDesignStore((s) => s.selectedId);
  const elements = useDesignStore((s) => s.elements);
  const grading = useDesignStore((s) => s.grading);
  const selectedBasemapFeature = useDesignStore((s) => s.selectedBasemapFeature);
  const basemapData = useDesignStore((s) => s.basemapData);

  const selected = selectedId ? elements[selectedId] : null;
  const issueCount = grading?.checks.filter((c) => c.status === "fail").length ?? 0;

  let summary = "Nothing selected";
  if (selected) {
    summary = `${selected.type} — ${selected.label ?? selected.id}`;
  } else if (selectedBasemapFeature) {
    const layer = selectedBasemapFeature.layer;
    const id = selectedBasemapFeature.feature.id;
    const data = layer === "parcels" ? basemapData?.parcels : basemapData?.addresses;
    const feature = data?.find((f) => f.id === id);
    const props = (feature?.properties ?? {}) as Record<string, unknown>;
    if (layer === "parcels") {
      summary = `📐 Parcel — ${props.parcel_external_id ?? id}`;
    } else {
      summary = `📍 Address — ${props.full_address ?? id}`;
    }
  }

  return (
    <div className="flex items-center gap-4 border-t border-zinc-800 bg-zinc-900 px-3 py-0.5 text-[10px] text-zinc-500 shrink-0">
      <span>CRS: WGS84 (EPSG:4326)</span>
      <span className="border-l border-zinc-700 pl-4">{summary}</span>
      {issueCount > 0 && (
        <span className="border-l border-zinc-700 pl-4 text-red-400 font-medium">
          {issueCount} issue{issueCount !== 1 ? "s" : ""}
        </span>
      )}
      <span className="ml-auto text-zinc-600">
        parcels {basemapData?.parcels?.length ?? "—"} · addresses {basemapData?.addresses?.length ?? "—"}
      </span>
    </div>
  );
}
