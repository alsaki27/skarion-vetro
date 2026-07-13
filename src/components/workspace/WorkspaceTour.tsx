"use client";

import { useDesignStore } from "@/lib/store";
import { useState } from "react";

const TOUR_STEPS = [
  { title: "Map", text: "Pan and zoom the map. Parcel outlines and address dots show the service area." },
  { title: "Tools", text: "Use the drawing tools to place structures and draw cables/conduits." },
  { title: "Layers", text: "Toggle reference layers, basemaps, and service group hulls from the Layers tab." },
  { title: "Groups", text: "Select premises (shift-click or drag), then create service groups from the Groups tab." },
  { title: "Submit", text: "Click Submit to grade your design. Check the Issues tab for problems." },
  { title: "Outputs", text: "View BOM, splice matrix, and export your design from the Outputs button." },
];

export function WorkspaceTour({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step] ?? TOUR_STEPS[TOUR_STEPS.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div className="pointer-events-auto bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-sm mx-4">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Tour ({step + 1}/{TOUR_STEPS.length})</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm">✕</button>
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-white mb-1">{current.title}</h3>
          <p className="text-xs text-zinc-400">{current.text}</p>
        </div>
        <div className="px-4 py-2 border-t border-zinc-800 flex justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-xs text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
          >
            Back
          </button>
          {step < TOUR_STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Next
            </button>
          ) : (
            <button onClick={onClose} className="text-xs text-green-400 hover:text-green-300">
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
