"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy page — redirects to the canonical workspace surface.
 * Retained until Block F3 cleanup confirms the workspace is the sole surface.
 */
export default function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/workspace/${id}`);
  }, [id, router]);

  return (
    <main className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
      Redirecting to workspace…
    </main>
  );
}
