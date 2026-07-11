"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  if (!token) {
    return (
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-bold text-white">Invalid invitation</h1>
        <p className="mt-2 text-sm text-zinc-500">No invitation token found. Check your invitation link.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-lg">✅</div>
        <h1 className="text-xl font-bold text-white">Account created</h1>
        <p className="mt-2 text-sm text-zinc-500">You can now sign in with your email and password.</p>
        <button onClick={() => router.push("/login")} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
          Sign in →
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token, password, name }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to accept invitation");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — check your connection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-xl font-bold text-white">Accept invitation</h1>
        <p className="mt-1 text-sm text-zinc-500">Set up your account to get started</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">Full name</label>
          <input ref={nameRef} id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">Password</label>
          <input id="password" type="password" required autoComplete="new-password" minLength={8}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            placeholder="At least 8 characters" />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm text-zinc-400">Confirm password</label>
          <input id="confirm" type="password" required autoComplete="new-password" minLength={8}
            value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            placeholder="Repeat password" />
        </div>
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">{error}</div>
        )}
        <button type="submit" disabled={submitting || !name || !password || !confirm}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <AcceptInviteForm />
      </Suspense>
    </main>
  );
}
