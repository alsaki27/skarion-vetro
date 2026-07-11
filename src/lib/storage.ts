import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY ?? "";
const R2_SECRET_KEY = process.env.R2_SECRET_KEY ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "skarion-vetro";

let r2: S3Client | null = null;

function getR2(): S3Client | null {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY) return null;
  if (!r2) {
    r2 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
    });
  }
  return r2;
}

export async function uploadFile(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  const client = getR2();
  if (!client) throw new Error("R2 not configured");
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function getFileUrl(key: string): Promise<string> {
  const client = getR2();
  if (!client) throw new Error("R2 not configured");
  return getSignedUrl(client, new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }), { expiresIn: 3600 });
}

export async function listFiles(prefix: string) {
  const client = getR2();
  if (!client) throw new Error("R2 not configured");
  const result = await client.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: prefix }));
  return result.Contents ?? [];
}

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY && R2_SECRET_KEY);
}
