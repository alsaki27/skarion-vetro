"use client";

import { useState } from "react";
import type { LayerStyle, Rule, Symbolizer, LabelRule } from "@/lib/styles";

interface StyleEditorProps {
  style: LayerStyle;
  onChange: (style: LayerStyle) => void;
  onClose: () => void;
}

export default function StyleEditor({ style, onChange, onClose }: StyleEditorProps) {
  const [local, setLocal] = useState<LayerStyle>(style);

  const updateRule = (ruleId: string, patch: Partial<Rule>) => {
    setLocal((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => r.id === ruleId ? { ...r, ...patch } : r),
    }));
  };

  const updateSymbolizer = (ruleId: string, patch: Partial<Symbolizer>) => {
    setLocal((prev) => ({
      ...prev,
      rules: prev.rules.map((r) => r.id === ruleId ? { ...r, symbolizer: { ...r.symbolizer, ...patch } } : r),
    }));
  };

  const addRule = () => {
    setLocal((prev) => ({
      ...prev,
      rules: [...prev.rules, { id: crypto.randomUUID(), label: "New Rule", symbolizer: { color: "#888888", width: 1 } }],
    }));
  };

  return (
    <div className="space-y-3 rounded bg-zinc-900 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-zinc-200">{local.name}</span>
        <div className="flex gap-1">
          <button onClick={addRule} className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 hover:text-zinc-200">+ Rule</button>
          <button onClick={() => { onChange(local); onClose(); }} className="rounded bg-blue-600 px-2 py-0.5 text-white text-[10px]">Apply</button>
          <button onClick={onClose} className="rounded bg-zinc-800 px-2 py-0.5 text-zinc-400 text-[10px]">Cancel</button>
        </div>
      </div>

      <div className="font-medium text-zinc-400">Labels</div>
      {local.labels.map((label, i) => (
        <div key={i} className="space-y-1 rounded bg-zinc-800/50 p-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Field:</span>
            <span className="text-zinc-200">{label.field}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Size:</span>
            <input type="number" value={label.size ?? 11} onChange={(e) => {
              const next = [...local.labels]; next[i] = { ...next[i], size: Number(e.target.value) };
              setLocal({ ...local, labels: next });
            }} className="w-16 rounded bg-zinc-800 px-1 py-0.5 text-zinc-100" />
            <span className="text-zinc-500">Color:</span>
            <input type="color" value={label.color ?? "#ffffff"} onChange={(e) => {
              const next = [...local.labels]; next[i] = { ...next[i], color: e.target.value };
              setLocal({ ...local, labels: next });
            }} className="h-5 w-8 rounded" />
          </div>
        </div>
      ))}

      <div className="font-medium text-zinc-400">Rules</div>
      {local.rules.map((rule) => (
        <div key={rule.id} className="space-y-1 rounded bg-zinc-800/50 p-2">
          <div className="flex items-center gap-2">
            <span className="flex-1 font-medium text-zinc-300">{rule.label ?? rule.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-zinc-500">Color</span>
            <input type="color" value={rule.symbolizer.color ?? "#888"}
              onChange={(e) => updateSymbolizer(rule.id, { color: e.target.value })}
              className="h-5 w-8 rounded" />
            <span className="w-12 text-zinc-500">Width</span>
            <input type="number" min={0} max={20} step={0.5} value={rule.symbolizer.width ?? 1}
              onChange={(e) => updateSymbolizer(rule.id, { width: Number(e.target.value) })}
              className="w-14 rounded bg-zinc-800 px-1 py-0.5 text-zinc-100" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 text-zinc-500">Opacity</span>
            <input type="range" min={0} max={100} value={(rule.symbolizer.opacity ?? 100)}
              onChange={(e) => updateSymbolizer(rule.id, { opacity: Number(e.target.value) })}
              className="h-1 flex-1 accent-zinc-500" />
            <span className="w-8 text-right text-zinc-500">{rule.symbolizer.opacity ?? 100}%</span>
          </div>
          {local.geometryType === "line" && (
            <div className="flex items-center gap-2">
              <span className="w-12 text-zinc-500">Dash</span>
              <select value={(rule.symbolizer.dashArray ?? []).join(",")}
                onChange={(e) => updateSymbolizer(rule.id, {
                  dashArray: e.target.value ? e.target.value.split(",").map(Number) : undefined,
                })}
                className="flex-1 rounded bg-zinc-800 px-1 py-0.5 text-zinc-100">
                <option value="">Solid</option>
                <option value="4,2">Dashed</option>
                <option value="8,4">Long dash</option>
                <option value="2,2">Dotted</option>
                <option value="8,2,2,2">Dash-dot</option>
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
