import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import { z } from "zod";

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function getR2Client() {
  const endpoint = process.env.R2_ENDPOINT;
  if (!endpoint) return null;
  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  try {
    if (!auth || !auth.org_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds ${MAX_SIZE_MB}MB limit` }, { status: 413 });
    }

    const filename = file.name;
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["zip", "geojson", "json", "kml", "kmz"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type: ${ext}` }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    const orgId = auth.org_id;
    const key = `uploads/${orgId}/${jobId}/${filename}`;

    let detected: Record<string, unknown> = { filename, size: file.size, ext };

    // Basic validation for GeoJSON
    if (ext === "geojson" || ext === "json") {
      try {
        const text = await file.text();
        const geo = JSON.parse(text);
        const features = geo.features ?? [];
        if (features.length > 10000) {
          return NextResponse.json({ error: "Maximum 10,000 features allowed" }, { status: 413 });
        }
        detected.geometryType = features[0]?.geometry?.type ?? "unknown";
        detected.featureCount = features.length;
        detected.crs = geo.crs?.properties?.name ?? "EPSG:4326";
        const fieldNames = Object.keys(features[0]?.properties ?? {});
        detected.fieldSchema = fieldNames.map((name) => ({ name, type: "string" }));
      } catch {
        return NextResponse.json({ error: "Invalid GeoJSON" }, { status: 400 });
      }
    }

    // For shapefile ZIP: check required files
    if (ext === "zip") {
      const JSZip = (await import("jszip")).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const names = Object.keys(zip.files).map((n) => n.toLowerCase());
      const hasShp = names.some((n) => n.endsWith(".shp"));
      const hasShx = names.some((n) => n.endsWith(".shx"));
      const hasDbf = names.some((n) => n.endsWith(".dbf"));
      const hasPrj = names.some((n) => n.endsWith(".prj"));
      if (!hasShp || !hasShx || !hasDbf) {
        return NextResponse.json({ error: "Invalid shapefile ZIP: missing .shp, .shx, or .dbf" }, { status: 400 });
      }
      detected = {
        ...detected,
        hasShp,
        hasShx,
        hasDbf,
        hasPrj,
        warnings: hasPrj ? [] : ["Missing .prj file — CRS detection may fail"],
      };
    }

    const client = getR2Client();
    if (client) {
      const buffer = await file.arrayBuffer();
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET ?? "",
          Key: key,
          Body: Buffer.from(buffer),
          ContentType: file.type || "application/octet-stream",
        })
      );
    }

    return NextResponse.json({ jobId, key, detected, warnings: detected.warnings ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
