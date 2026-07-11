// Password hashing via argon2id (Chunk 5 Rev 3 requirement)
import * as argon2 from "argon2";

const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain, ARGON2_OPTS);
  } catch {
    return false;
  }
}
