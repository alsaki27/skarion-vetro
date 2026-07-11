"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  expired: { title: "Session expired", description: "Your session has expired. Please sign in again to continue." },
  revoked: { title: "Session revoked", description: "Your session has been revoked. Please sign in again." },
  forbidden: { title: "Access denied", description: "You do not have permission to access this page." },
  "not-found": { title: "Not found", description: "The page you are looking for does not exist." },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "forbidden";
  const info = ERROR_MESSAGES[code] ?? ERROR_MESSAGES.forbidden;

  return (
    <div className="max-w-sm text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-900/30 text-xl">🔒</div>
      <h1 className="text-xl font-bold text-white">{info.title}</h1>
      <p className="mt-2 text-sm text-zinc-500">{info.description}</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">Sign in</Link>
        <Link href="/" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500">Home</Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <AuthErrorContent />
      </Suspense>
    </main>
  );
}
