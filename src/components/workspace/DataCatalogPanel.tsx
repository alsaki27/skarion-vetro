"use client";

import { useState } from "react";
import { ImportWizard } from "./ImportWizard";

export function DataCatalogPanel({ projectId }: { projectId: string }) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="text-xs text-zinc-400 space-y-3">
      <div>
        <div className="mb-1 font-medium text-zinc-300 flex items-center justify-between">
          <span>Registered Sources</span>
          <button
            onClick={() => setWizardOpen(true)}
            className="rounded bg-blue-600 px-2 py-0.5 text-[10px] text-white hover:bg-blue-500"
          >
            Import
          </button>
        </div>
        <div className="text-zinc-600 italic">No data sources registered yet.</div>
      </div>
      <div>
        <div className="mb-1 font-medium text-zinc-300">Discover New Sources</div>
        <div className="text-zinc-600 italic">ArcGIS discovery coming soon.</div>
      </div>
      <div>
        <div className="mb-1 font-medium text-zinc-300">Import History</div>
        <div className="text-zinc-600 italic">No imports yet.</div>
      </div>
      {wizardOpen && <ImportWizard projectId={projectId} onClose={() => setWizardOpen(false)} />}
    </div>
  );
}
