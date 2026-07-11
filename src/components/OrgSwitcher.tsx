"use client";

import { useState } from "react";

interface OrgInfo {
  id: string;
  name: string;
  role: string;
}

interface OrgSwitcherProps {
  currentOrg: OrgInfo;
  orgs: OrgInfo[];
  onSwitch: (orgId: string) => void;
  onLogout: () => void;
}

export default function OrgSwitcher({ currentOrg, orgs, onSwitch, onLogout }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      >
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        {currentOrg.name}
        {orgs.length > 1 && <span className="text-zinc-600">▼</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded border border-zinc-800 bg-zinc-900 shadow-lg">
            {orgs.length > 1 && (
              <div className="border-b border-zinc-800 px-3 py-2">
                <p className="mb-1 text-[10px] font-medium text-zinc-500">Switch Organization</p>
                {orgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => { onSwitch(org.id); setOpen(false); }}
                    className={`block w-full rounded px-2 py-1 text-left text-xs ${
                      org.id === currentOrg.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {org.name}
                    <span className="ml-2 text-[10px] text-zinc-600">({org.role})</span>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-zinc-800"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
