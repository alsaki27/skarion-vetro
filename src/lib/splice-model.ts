// Splice model, continuity tracing, and generated splice matrix.
export interface Splice {
  id: string;
  locationId: string;
  locationType: "closure" | "fdh";
  inCableId: string;
  inStartFiber: number;
  inEndFiber: number;
  outCableId: string;
  outStartFiber: number;
  outEndFiber: number;
  spliceType: "pass_through" | "pigtail" | "termination";
  destination: string;
}

export interface SpliceMatrixRow {
  inCable: string;
  inFiberRange: string;
  inColor: string;
  outCable: string;
  outFiberRange: string;
  outColor: string;
  destination: string;
  spliceType: string;
}

export function generateSpliceMatrix(splices: Splice[]): SpliceMatrixRow[] {
  return splices.map((s) => ({
    inCable: s.inCableId,
    inFiberRange: `${s.inStartFiber}-${s.inEndFiber}`,
    inColor: `${COLOR_SEQUENCE[(s.inStartFiber - 1) % 12]}`,
    outCable: s.outCableId,
    outFiberRange: `${s.outStartFiber}-${s.outEndFiber}`,
    outColor: `${COLOR_SEQUENCE[(s.outStartFiber - 1) % 12]}`,
    destination: s.destination,
    spliceType: s.spliceType,
  }));
}

export function traceFiber(splices: Splice[], startFiber: number, cableId: string): { location: string; fiber: number }[] {
  const trace: { location: string; fiber: number }[] = [];
  let currentCable = cableId;
  let currentFiber = startFiber;
  for (const s of splices) {
    if (s.inCableId === currentCable && s.inStartFiber <= currentFiber && s.inEndFiber >= currentFiber) {
      const offset = currentFiber - s.inStartFiber;
      currentFiber = s.outStartFiber + offset;
      currentCable = s.outCableId;
      trace.push({ location: s.locationId, fiber: currentFiber });
    }
  }
  return trace;
}

const COLOR_SEQUENCE = ["blue", "orange", "green", "brown", "slate", "white", "red", "black", "yellow", "violet", "rose", "aqua"];
