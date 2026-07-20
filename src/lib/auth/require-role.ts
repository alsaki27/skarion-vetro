export function requireRole(auth: { role: string } | null, ...roles: string[]): asserts auth is NonNullable<typeof auth> {
  if (!auth) throw new Error("Authentication required");
  if (!roles.includes(auth.role)) throw new Error(`Role ${auth.role} not in [${roles.join(",")}]`);
}
