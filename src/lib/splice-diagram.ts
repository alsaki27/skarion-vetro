// Per-closure splice diagram generation.
export interface SplicePointRecord {
  address: string;
  closureId: string;
  incomingSections: { cableId: string; fiberRange: string; convention: string }[];
  outgoingSections: { cableId: string; fiberRange: string; destination: string }[];
  connectedMsts: { id: string; portCount: number; address: string; fiberRange: string }[];
}

export interface SpliceDiagramSVG {
  closureId: string;
  svgContent: string;
  checksum: string;
}

export function generateSplicePointRecord(
  closureId: string,
  incoming: { cableId: string; fiberRange: string; convention: string }[],
  outgoing: { cableId: string; fiberRange: string; destination: string }[],
  msts: { id: string; portCount: number; address: string; fiberRange: string }[],
  address: string,
): SplicePointRecord {
  return { address, closureId, incomingSections: incoming, outgoingSections: outgoing, connectedMsts: msts };
}

export function validateBalance(
  incoming: { range: [number, number] }[],
  outgoing: { range: [number, number] }[],
  spares: { range: [number, number] }[],
): string[] {
  const issues: string[] = [];
  const totalIn = incoming.reduce((sum, i) => sum + (i.range[1] - i.range[0] + 1), 0);
  const totalOut = outgoing.reduce((sum, i) => sum + (i.range[1] - i.range[0] + 1), 0);
  const totalSpare = spares.reduce((sum, i) => sum + (i.range[1] - i.range[0] + 1), 0);
  if (totalIn !== totalOut + totalSpare) {
    issues.push(`Balance mismatch: ${totalIn} fibers in, ${totalOut + totalSpare} accounted (${totalOut} out + ${totalSpare} spare)`);
  }
  return issues;
}
