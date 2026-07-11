"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "student" | "instructor" | "admin";
  orgId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseToken(token: string): { sub: string; email: string; org_id: string; role: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

function initUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("access_token");
  if (!stored) return null;
  const payload = parseToken(stored);
  if (!payload) return null;
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.email.split("@")[0],
    role: payload.role as AuthUser["role"],
    orgId: payload.org_id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      sessionStorage.setItem("access_token", data.token);
      const payload = parseToken(data.token);
      if (payload) {
        setUser({
          id: payload.sub,
          email: payload.email,
          name: payload.email.split("@")[0],
          role: payload.role as AuthUser["role"],
          orgId: payload.org_id,
        });
      }
    } catch {
      setError("Network error — check your connection");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Logout persists even if the API call fails
    }
    sessionStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
