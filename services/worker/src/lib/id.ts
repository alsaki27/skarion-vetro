// Simple crypto-based ID for Worker (no uuid dependency needed)
export function generateId(): string {
  return crypto.randomUUID();
}
