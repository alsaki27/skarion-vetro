export interface OpticalPath {
  id: string;
  label: string;
  segments: OpticalSegment[];
}

export interface OpticalSegment {
  type: "fiber" | "connector" | "splice" | "splitter";
  label: string;
  lengthFt?: number;
  count?: number;
  attenuationDbPerUnit?: number;
  attenuationDb?: number;
  splitterRatio?: number;
}

export interface OpticalBudget {
  pathId: string;
  wavelengthNm: number;
  totalLossDb: number;
  marginDb: number;
  budgetLimitDb: number;
  passes: boolean;
  segments: {
    type: string;
    label: string;
    lossDb: number;
    cumulativeDb: number;
  }[];
  warnings: string[];
}

const DEFAULT_ATTENUATION = {
  fiber_1310nm: 0.35,
  fiber_1550nm: 0.22,
  connector: 0.3,
  splice_fusion: 0.05,
  splice_mechanical: 0.15,
  splitter_1x2: 3.5,
  splitter_1x4: 7.0,
  splitter_1x8: 10.5,
  splitter_1x16: 14.0,
  splitter_1x32: 17.5,
  engineering_margin: 3.0,
};

const BUDGET_LIMITS: Record<number, number> = {
  1310: 28,
  1550: 28,
  1490: 25,
};

export function calculateOpticalBudget(path: OpticalPath, wavelengthNm: number = 1550): OpticalBudget {
  const segments: OpticalBudget["segments"] = [];
  let cumulativeDb = 0;
  const warnings: string[] = [];

  for (const seg of path.segments) {
    let lossDb = 0;

    if (seg.type === "fiber" && seg.lengthFt) {
      const attenPerKft = wavelengthNm === 1310 ? DEFAULT_ATTENUATION.fiber_1310nm : DEFAULT_ATTENUATION.fiber_1550nm;
      lossDb = (seg.lengthFt / 1000) * attenPerKft;
      lossDb = Math.round(lossDb * 1000) / 1000;
    } else if (seg.type === "connector") {
      lossDb = DEFAULT_ATTENUATION.connector * (seg.count ?? 1);
      lossDb = Math.round(lossDb * 100) / 100;
    } else if (seg.type === "splice") {
      lossDb = DEFAULT_ATTENUATION.splice_fusion * (seg.count ?? 1);
      lossDb = Math.round(lossDb * 100) / 100;
    } else if (seg.type === "splitter") {
      if (seg.splitterRatio && seg.splitterRatio > 1) {
        const splitterLoss = 10 * Math.log10(seg.splitterRatio);
        lossDb = Math.round(splitterLoss * 100) / 100;
      } else {
        lossDb = 0;
        warnings.push(`Splitter ${seg.label}: missing or invalid ratio`);
      }
    }

    cumulativeDb += lossDb;
    cumulativeDb = Math.round(cumulativeDb * 100) / 100;

    segments.push({ type: seg.type, label: seg.label, lossDb, cumulativeDb });
  }

  const marginDb = DEFAULT_ATTENUATION.engineering_margin;
  const totalLossDb = Math.round((cumulativeDb + marginDb) * 100) / 100;
  const budgetLimitDb = BUDGET_LIMITS[wavelengthNm] ?? 28;
  const passes = totalLossDb <= budgetLimitDb;

  if (!passes) {
    warnings.push(`Total loss ${totalLossDb}dB exceeds ${budgetLimitDb}dB budget at ${wavelengthNm}nm`);
  }

  return { pathId: path.id, wavelengthNm, totalLossDb, marginDb, budgetLimitDb, passes, segments, warnings };
}

export function findWorstPath(paths: OpticalPath[], wavelengthNm: number = 1550): OpticalBudget | null {
  let worst: OpticalBudget | null = null;
  for (const path of paths) {
    const budget = calculateOpticalBudget(path, wavelengthNm);
    if (!worst || budget.totalLossDb > worst.totalLossDb) {
      worst = budget;
    }
  }
  return worst;
}
