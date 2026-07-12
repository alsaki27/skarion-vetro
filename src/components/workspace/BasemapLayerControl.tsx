"use client";

import { useDesignStore } from "@/lib/store";
import { BASEMAP_REF_STYLES } from "@/lib/basemap-workspace";

export function BasemapLayerControl() {
  const basemapData = useDesignStore((s) => s.basemapData);
  const refParcelsVisible = useDesignStore((s) => s.refParcelsVisible);
  const refAddressesVisible = useDesignStore((s) => s.refAddressesVisible);

  const parcelCount = basemapData?.parcels?.length ?? 0;
  const addressCount = basemapData?.addresses?.length ?? 0;

  const toggleParcels = () => useDesignStore.setState((s) => ({ refParcelsVisible: !s.refParcelsVisible }));
  const toggleAddresses = () => useDesignStore.setState((s) => ({ refAddressesVisible: !s.refAddressesVisible }));

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider px-1">
        Reference Layers
      </div>

      {/* Parcels row */}
      <button
        onClick={toggleParcels}
        className="flex items-center gap-1.5 rounded bg-zinc-800/50 px-1.5 py-1 w-full text-left hover:bg-zinc-800 transition-colors"
      >
        <span className="text-xs">{refParcelsVisible ? "👁" : "—"}</span>
        <span className={`flex-1 text-xs ${refParcelsVisible ? "text-zinc-200" : "text-zinc-500"}`}>Parcels</span>
        <span className="text-[10px] text-zinc-500">({parcelCount})</span>
      </button>

      {/* Addresses row */}
      <button
        onClick={toggleAddresses}
        className="flex items-center gap-1.5 rounded bg-zinc-800/50 px-1.5 py-1 w-full text-left hover:bg-zinc-800 transition-colors"
      >
        <span className="text-xs">{refAddressesVisible ? "👁" : "—"}</span>
        <span className={`flex-1 text-xs ${refAddressesVisible ? "text-zinc-200" : "text-zinc-500"}`}>Addresses</span>
        <span className="text-[10px] text-zinc-500">({addressCount})</span>
      </button>

      {/* Mini legend */}
      <div className="mt-2 pt-1.5 border-t border-zinc-800">
        <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider px-1 mb-1">Legend</div>
        <div className="space-y-0.5 px-1">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5 rounded"
              style={{ backgroundColor: BASEMAP_REF_STYLES.parcel.lineColor, opacity: BASEMAP_REF_STYLES.parcel.lineOpacity }}
            />
            <span className="text-[10px] text-zinc-400">Parcel boundary</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: BASEMAP_REF_STYLES.address.circleColorServiceable }}
            />
            <span className="text-[10px] text-zinc-400">Serviceable premise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: BASEMAP_REF_STYLES.address.circleColorContext }}
            />
            <span className="text-[10px] text-zinc-400">Other address</span>
          </div>
        </div>
      </div>
    </div>
  );
}
