"use client";

import { useState } from "react";

const US_STATES = [
  { fips: "48", abbrev: "TX", name: "Texas" },
  { fips: "06", abbrev: "CA", name: "California" },
  { fips: "36", abbrev: "NY", name: "New York" },
  { fips: "12", abbrev: "FL", name: "Florida" },
];

interface County {
  fips: string;
  name: string;
}

export function StudyAreaSelector({ onSelect }: { onSelect?: (area: Record<string, unknown>) => void }) {
  const [stateFips, setStateFips] = useState("");
  const [counties, setCounties] = useState<County[]>([]);
  const [countyFips, setCountyFips] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCounties = () => {
    if (!stateFips) return;
    setLoading(true);
    fetch(`/api/census/counties?stateFips=${stateFips}`)
      .then((r) => r.json())
      .then((data) => {
        setCounties(data.counties ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleCreate = () => {
    const state = US_STATES.find((s) => s.fips === stateFips);
    const county = counties.find((c) => c.fips === countyFips);
    if (!state) return;
    const payload = {
      name: county ? `${county.name}, ${state.name}` : state.name,
      stateFips: state.fips,
      countyFips: county?.fips,
      countyName: county?.name,
      stateAbbrev: state.abbrev,
      bbox: [-98.5, 29.5, -96.5, 31.5], // placeholder bbox
      geometry: "POLYGON((-98.5 29.5,-96.5 29.5,-96.5 31.5,-98.5 31.5,-98.5 29.5))",
    };
    fetch("/api/study-areas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.studyArea) {
          onSelect?.(data.studyArea);
        }
      });
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="text-zinc-400">Select a study area</div>
      <select
        value={stateFips}
        onChange={(e) => { setStateFips(e.target.value); setCountyFips(""); setCounties([]); }}
        className="w-full rounded bg-zinc-800 px-2 py-1 text-zinc-100"
      >
        <option value="">Select state…</option>
        {US_STATES.map((s) => (
          <option key={s.fips} value={s.fips}>{s.name}</option>
        ))}
      </select>

      {stateFips && (
        <div className="flex gap-2">
          <select
            value={countyFips}
            onChange={(e) => setCountyFips(e.target.value)}
            className="flex-1 rounded bg-zinc-800 px-2 py-1 text-zinc-100"
          >
            <option value="">Select county (optional)…</option>
            {counties.map((c) => (
              <option key={c.fips} value={c.fips}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={loadCounties}
            disabled={loading}
            className="rounded bg-zinc-700 px-2 py-1 text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
          >
            {loading ? "…" : "Load"}
          </button>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!stateFips}
        className="w-full rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Create Study Area
      </button>
    </div>
  );
}
