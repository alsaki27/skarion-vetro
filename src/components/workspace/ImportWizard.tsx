"use client";

import { useState, useCallback } from "react";
import { authFetch } from "@/lib/api-client";

interface ImportWizardProps {
  projectId: string;
  onClose: () => void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export function ImportWizard({ projectId, onClose }: ImportWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ detected?: Record<string, unknown>; warnings?: string[]; jobId?: string } | null>(null);
  const [targetLayer, setTargetLayer] = useState("new");
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [committing, setCommitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleUpload = useCallback(async (f: File) => {
    setFile(f);
    const form = new FormData();
    form.append("file", f);
    const res = await authFetch("/api/imports/upload", { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setUploadResult(data);
      setStep(2);
    } else {
      alert(data.error ?? "Upload failed");
    }
  }, []);

  const handleCommit = useCallback(async () => {
    setCommitting(true);
    const res = await authFetch("/api/imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        targetLayerId: targetLayer === "new" ? null : targetLayer,
        fieldMapping,
        appendBehavior: "append",
        uploadJobId: uploadResult?.jobId,
      }),
    });
    const data = await res.json();
    setCommitting(false);
    if (res.ok) {
      setJobId(data.job?.id ?? null);
      setStep(5);
    } else {
      alert(data.error ?? "Import failed");
    }
  }, [projectId, targetLayer, fieldMapping, uploadResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded bg-zinc-900 border border-zinc-700 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Import Wizard</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <div className="px-4 py-3">
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded ${s <= step ? "bg-blue-500" : "bg-zinc-700"}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-400">Upload GeoJSON, Shapefile ZIP, or KML (max 50MB)</div>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded border-2 border-dashed border-zinc-700 px-6 py-8 hover:border-zinc-500">
                <input
                  type="file"
                  className="hidden"
                  accept=".geojson,.json,.zip,.kml,.kmz"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <span className="text-xs text-zinc-300">Drop file here or click to browse</span>
              </label>
            </div>
          )}

          {step === 2 && uploadResult && (
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="font-medium">Preview</div>
              <div>File: {String(uploadResult.detected?.filename ?? "—")}</div>
              <div>Features: {String(uploadResult.detected?.featureCount ?? "—")}</div>
              <div>Geometry: {String(uploadResult.detected?.geometryType ?? "—")}</div>
              <div>CRS: {String(uploadResult.detected?.crs ?? "—")}</div>
              {uploadResult.warnings && (uploadResult.warnings as string[]).length > 0 && (
                <div className="rounded bg-yellow-950/30 p-2 text-yellow-300">
                  Warnings: {(uploadResult.warnings as string[]).join(", ")}
                </div>
              )}
              <button
                onClick={() => setStep(3)}
                className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2 text-xs">
              <div className="text-zinc-400">Select target layer</div>
              <select
                value={targetLayer}
                onChange={(e) => setTargetLayer(e.target.value)}
                className="w-full rounded bg-zinc-800 px-2 py-1 text-zinc-100"
              >
                <option value="new">Create new reference layer</option>
                <option value="existing1">Existing Layer 1</option>
              </select>
              <button
                onClick={() => setStep(4)}
                className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
              >
                Next
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 text-xs">
              <div className="text-zinc-400">Field Mapping (auto-suggested where possible)</div>
              <div className="grid grid-cols-[1fr_1fr] gap-2">
                <div className="text-zinc-500">Source Field</div>
                <div className="text-zinc-500">Target Field</div>
                {(uploadResult?.detected?.fieldSchema as Array<{name:string}> ?? []).map((f) => (
                  <div key={f.name} className="contents">
                    <div className="text-zinc-300">{f.name}</div>
                    <input
                      type="text"
                      value={fieldMapping[f.name] ?? ""}
                      onChange={(e) => setFieldMapping((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      placeholder="target field"
                      className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-100"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(5)}
                className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
              >
                Review
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-2 text-xs text-zinc-300">
              <div className="font-medium">Review & Commit</div>
              <div>File: {file?.name}</div>
              <div>Target: {targetLayer === "new" ? "New reference layer" : targetLayer}</div>
              <div>Mapped fields: {Object.keys(fieldMapping).length}</div>
              <button
                onClick={handleCommit}
                disabled={committing}
                className="mt-2 rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-500 disabled:opacity-50"
              >
                {committing ? "Importing…" : jobId ? `Imported (job ${jobId.slice(0, 8)})` : "Import"}
              </button>
              {jobId && (
                <div className="text-green-400">
                  Import job started. Track progress in the Data Catalog tab.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
