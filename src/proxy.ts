import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRequestId } from "@/lib/request-context";
import { logger } from "@/lib/logger";

export function proxy(request: NextRequest) {
  const requestId = createRequestId();
  const start = Date.now();

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (!request.nextUrl.pathname.startsWith("/api/health")) {
    response.headers.set("x-request-id", requestId);
    logger.info("request", {
      requestId,
      route: request.nextUrl.pathname,
      method: request.method,
      status: response.status,
      durationMs: Date.now() - start,
    });
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
