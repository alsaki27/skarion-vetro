"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, error, login, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const redirectTo = searchParams.get("redirect") ?? "/curriculum";

  useEffect(() => {
    if (user && !loading) router.replace(redirectTo);
  }, [user, loading, router, redirectTo]);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    clearError();
    await login(email, password);
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-bold text-white">
          S
        </div>
        <h1 className="text-xl font-bold text-white">Sign in to Skarion-VETRO</h1>
        <p className="mt-1 text-sm text-zinc-500">OSP fiber network design training</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">Email</label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            minLength={3}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500"
            placeholder="password"
          />
        </div>
        {error && (
          <div className="rounded-lg border border-red-800 bg-red-900/20 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting || !email || !password}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Dev credentials: <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">dev@skarion.com</code> / <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">dev</code>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
