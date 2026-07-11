"use client";

import { useDesignStore } from "@/lib/store";
import { STAGE_ORDER, STAGE_DEFS, stageIndex } from "@/lib/stages";

const STAGE_COLORS: Record<string, string> = {
  orientation: "bg-zinc-700",
  demand: "bg-blue-600",
  service_groups: "bg-cyan-600",
  structures: "bg-amber-600",
  routes: "bg-violet-600",
  topology: "bg-pink-600",
  hld_review: "bg-orange-600",
  lld: "bg-emerald-600",
  complete: "bg-green-500",
};

export default function StageNavigator() {
  const currentStage = useDesignStore((s) => s.currentStage);
  const setStage = useDesignStore((s) => s.setStage);
  const completedStages = useDesignStore((s) => s.completedStages);

  const currentIdx = stageIndex(currentStage);

  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Stage Progress
      </h3>
      <div className="space-y-1">
        {STAGE_ORDER.map((stageId, idx) => {
          const def = STAGE_DEFS[stageId];
          const isCompleted = completedStages.has(stageId);
          const isCurrent = stageId === currentStage;
          const isAccessible = idx <= currentIdx || completedStages.has(stageId) ||
            (idx > 0 && completedStages.has(STAGE_ORDER[idx - 1]));

          const canClick = isAccessible || isCompleted;

          return (
            <button
              key={stageId}
              onClick={() => canClick && setStage(stageId)}
              disabled={!canClick}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                isCurrent
                  ? "border border-blue-500 bg-blue-900/20"
                  : isCompleted
                    ? "opacity-80 hover:bg-zinc-800"
                    : "opacity-40 cursor-not-allowed"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                  isCompleted ? "bg-green-600" : isCurrent ? "bg-blue-600" : STAGE_COLORS[stageId]
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </span>
              <div className="min-w-0">
                <span className={`font-medium ${isCurrent ? "text-white" : "text-zinc-300"}`}>
                  {def.label}
                </span>
                {isCurrent && (
                  <span className="ml-2 text-[10px] text-blue-400">current</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
