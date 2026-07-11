import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h1 className="mb-2 text-xl font-bold text-zinc-100">Access Denied</h1>
        <p className="mb-6 text-sm text-zinc-400">
          You do not have permission to access this resource.
        </p>
        <Link
          href="/curriculum"
          className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Go to Curriculum
        </Link>
      </div>
    </main>
  );
}
