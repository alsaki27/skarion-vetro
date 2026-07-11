import type { ProjectFixture } from "../types";
import { p1Greenfield } from "./p1-greenfield";
import { p2OakwoodUnderground } from "./p2-oakwood";
import { p3SunsetRidge } from "./p3-sunset";
import { p4SplitLab } from "./p4-split-lab";
import { p5SpliceMaster, p6PoleLoading, p7Parkview } from "./p5-p7";
import { p8Westside, p9Riverside } from "./p8-p9-capstones";

export const PROJECTS: Record<string, ProjectFixture> = {
  [p1Greenfield.id]: p1Greenfield,
  [p2OakwoodUnderground.id]: p2OakwoodUnderground,
  [p3SunsetRidge.id]: p3SunsetRidge,
  [p4SplitLab.id]: p4SplitLab,
  [p5SpliceMaster.id]: p5SpliceMaster,
  [p6PoleLoading.id]: p6PoleLoading,
  [p7Parkview.id]: p7Parkview,
  [p8Westside.id]: p8Westside,
  [p9Riverside.id]: p9Riverside,
};

export { p1Greenfield } from "./p1-greenfield";
export { p2OakwoodUnderground } from "./p2-oakwood";
export { p3SunsetRidge } from "./p3-sunset";
export { p4SplitLab } from "./p4-split-lab";
export { p5SpliceMaster, p6PoleLoading, p7Parkview } from "./p5-p7";
export { p8Westside, p9Riverside } from "./p8-p9-capstones";
