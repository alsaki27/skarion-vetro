export interface RequestContext {
  userId: string;
  orgId: string;
  role: "student" | "instructor" | "admin";
  isPlatformStaff: boolean;
  requestId: string;
}

let _requestIdCounter = 0;
const ALPHANUM = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateRequestId(): string {
  const ts = Date.now().toString(36);
  _requestIdCounter = (_requestIdCounter + 1) % 0xffff;
  const seq = _requestIdCounter.toString(36).padStart(3, "0");
  let rand = "";
  for (let i = 0; i < 4; i++) {
    rand += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return `${ts}-${seq}${rand}`;
}

export function createRequestId(): string {
  return generateRequestId();
}
