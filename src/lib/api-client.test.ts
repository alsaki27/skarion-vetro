import { describe, it, expect, vi, beforeEach } from "vitest";

describe("authFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("attaches Bearer header when a token is stored", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response())));
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("test-jwt");

    const { authFetch } = await import("./api-client");
    await authFetch("/api/test");

    const callHeaders = new Headers((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers);
    expect(callHeaders.get("Authorization")).toBe("Bearer test-jwt");
  });

  it("omits Authorization header when no token is stored", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response())));
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const { authFetch } = await import("./api-client");
    await authFetch("/api/test");

    const callHeaders = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    const headerEntries = [...new Headers(callHeaders).entries()];
    expect(headerEntries.find(([k]) => k === "authorization")).toBeUndefined();
  });

  it("passes through other init options unchanged", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response())));

    const { authFetch } = await import("./api-client");
    await authFetch("/api/test", { method: "POST", body: "hello" });

    expect(fetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
      method: "POST",
      body: "hello",
    }));
  });
});
