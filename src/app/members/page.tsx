"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface Member {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  lastLoginAt: string | null;
  joinedAt: string | null;
}

export default function MembersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/members");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/members?${params}`)
      .then((r) => { if (!cancelled && r.ok) return r.json(); throw new Error(); })
      .then((data) => { if (!cancelled) { setMembers(data.members); setFetching(false); } })
      .catch(() => { if (!cancelled) { setError("Failed to load members"); setFetching(false); } });
    return () => { cancelled = true; };
  }, [user, search, refreshKey]);

  const doAction = async (userId: string, action: string, role?: string) => {
    setActionMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, ...(role ? { role } : {}) }),
      });
      if (res.ok) {
        setActionMsg("Member updated");
        setRefreshKey((k) => k + 1);
      } else {
        const data = await res.json();
        setError(data.error ?? "Action failed");
      }
    } catch {
      setError("Network error");
    }
  };

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center bg-zinc-950"><p className="text-sm text-zinc-500">Loading…</p></div>;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Members</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your organization members</p>
        </div>
        <button onClick={() => router.push("/curriculum")} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">
          ← Curriculum
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="mb-4 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-blue-500"
      />

      {error && <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</div>}
      {actionMsg && <div className="mb-4 rounded-lg border border-green-800 bg-green-900/20 px-3 py-2 text-sm text-green-400">{actionMsg}</div>}

      {fetching ? (
        <p className="text-sm text-zinc-500">Loading members…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-zinc-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-zinc-600">No members found.</td></tr>
              )}
              {members.map((m) => (
                <tr key={m.userId} className="border-b border-zinc-800 text-zinc-300">
                  <td className="px-4 py-3">{m.name}</td>
                  <td className="px-4 py-3 text-zinc-500">{m.email}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        value={m.role}
                        onChange={(e) => doAction(m.userId, "change_role", e.target.value)}
                        className="rounded bg-zinc-800 px-2 py-1 text-sm text-zinc-300"
                      >
                        <option value="student">student</option>
                        <option value="instructor">instructor</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span>{m.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${m.status === "active" ? "bg-green-900/30 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString() : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {m.status === "active" ? (
                        <button
                          onClick={() => doAction(m.userId, "deactivate")}
                          className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-400 hover:bg-red-900/50"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => doAction(m.userId, "reactivate")}
                          className="rounded bg-green-900/30 px-2 py-1 text-xs text-green-400 hover:bg-green-900/50"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
