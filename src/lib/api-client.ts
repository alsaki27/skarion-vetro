/**
 * Shared authenticated fetch helper for client components.
 *
 * Reads the JWT from localStorage (set on login) and attaches an
 * `Authorization: Bearer <token>` header when available.  Behaves like
 * plain `fetch` when no token is stored or when called server-side / SSR.
 *
 * Intended to close the class of bug where ad-hoc fetch() calls against
 * auth-gated API routes silently omit the auth header.
 */

export async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return fetch(url, { ...init, headers });
}
