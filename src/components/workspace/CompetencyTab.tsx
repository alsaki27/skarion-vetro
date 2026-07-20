"use client";

import { useState, useEffect } from "react";
import { OSP_COMPETENCIES } from "@/lib/competency-model";

export function CompetencyTab() {
  const [data, setData] = useState<Array<{ competencyId: string; title: string; level: string; records: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/competencies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json() as { competencies?: Array<{ id: string; title: string; description: string; evidenceTypes: string[] }> };
        const comps = body.competencies ?? OSP_COMPETENCIES.map((c) => ({ id: c.id, title: c.title, description: c.description, evidenceTypes: c.evidenceTypes }));
        setData(comps.map((c) => ({ competencyId: c.id, title: c.title, level: "developing", records: 0 })));
      } catch {
        setData(OSP_COMPETENCIES.map((c) => ({ competencyId: c.id, title: c.title, level: "developing", records: 0 })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const levelColors: Record<string, string> = {
    developing: "text-zinc-400",
    demonstrated: "text-blue-400",
    proficient: "text-green-400",
  };

  const levelBars: Record<string, string> = {
    developing: "bg-zinc-600 w-1/3",
    demonstrated: "bg-blue-500 w-2/3",
    proficient: "bg-green-500 w-full",
  };

  if (loading) return <div className="text-xs text-zinc-500">Loading competencies...</div>;

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-semibold uppercase text-zinc-500">OSP Competencies</div>
      {data.map((c) => (
        <div key={c.competencyId} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-zinc-300">{c.title}</span>
            <span className={`text-[10px] font-medium ${levelColors[c.level] ?? "text-zinc-500"}`}>
              {c.level}
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded overflow-hidden">
            <div className={`h-full rounded transition-all ${levelBars[c.level] ?? "bg-zinc-600"}`} />
          </div>
          <div className="text-[10px] text-zinc-600">{c.records} evidence records</div>
        </div>
      ))}
      <div className="text-[10px] text-zinc-600 mt-2 pt-2 border-t border-zinc-800">
        Complete projects and pass checks to build competency evidence.
      </div>
    </div>
  );
}
