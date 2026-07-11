// Shared in-memory invite token store (Chunk 5 Rev 3)
// In production, move this to a database-backed table.

export interface InviteToken {
  email: string;
  orgId: string;
  role: string;
  expiresAt: number;
}

export const INVITE_TOKENS = new Map<string, InviteToken>();
