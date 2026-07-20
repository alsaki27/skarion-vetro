import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ScoreCard from "@/components/ScoreCard";
import type { GradingResult } from "@/lib/types";

const passingResult: GradingResult = {
  totalScore: 92,
  isPassing: true,
  passThreshold: 85,
  gradedAt: "2026-07-20T16:00:00Z",
  categories: [
    { name: "connectivity", weight: 40, score: 38, status: "pass" },
    { name: "compliance", weight: 30, score: 28, status: "warn" },
    { name: "efficiency", weight: 30, score: 26, status: "pass" },
  ],
  checks: [
    { checkId: "coverage", category: "connectivity", status: "pass", score: 100, message: "All premises covered" },
    { checkId: "connectivity", category: "connectivity", status: "pass", score: 100, message: "All elements connected" },
    { checkId: "compliance", category: "compliance", status: "warn", score: 93, message: "One span near 300ft limit" },
  ],
};

const failingResult: GradingResult = {
  totalScore: 45,
  isPassing: false,
  passThreshold: 85,
  gradedAt: "2026-07-20T16:00:00Z",
  categories: [
    { name: "connectivity", weight: 40, score: 10, status: "fail" },
    { name: "compliance", weight: 30, score: 20, status: "warn" },
    { name: "efficiency", weight: 30, score: 15, status: "fail" },
  ],
  checks: [
    { checkId: "coverage", category: "connectivity", status: "fail", score: 25, message: "3 premises unreachable" },
    { checkId: "connectivity", category: "connectivity", status: "fail", score: 0, message: "CO not connected to FDH" },
  ],
};

describe("ScoreCard", () => {
  it("shows prompt when no grading result", () => {
    render(<ScoreCard grading={null} />);
    expect(screen.getByText(/submit your design/i)).toBeTruthy();
  });

  it("displays score for passing result", () => {
    render(<ScoreCard grading={passingResult} />);
    expect(screen.getByText("92")).toBeTruthy();
    expect(screen.getByText(/PASS/)).toBeTruthy();
  });

  it("displays score for failing result", () => {
    render(<ScoreCard grading={failingResult} />);
    expect(screen.getByText("45")).toBeTruthy();
    expect(screen.getByText(/Not passing yet/)).toBeTruthy();
  });

  it("renders category breakdown", () => {
    render(<ScoreCard grading={passingResult} />);
    expect(screen.getByText("connectivity")).toBeTruthy();
    expect(screen.getByText("compliance")).toBeTruthy();
    expect(screen.getByText("efficiency")).toBeTruthy();
  });

  it("renders check feedback messages", () => {
    render(<ScoreCard grading={failingResult} />);
    expect(screen.getByText(/3 premises unreachable/)).toBeTruthy();
    expect(screen.getByText(/CO not connected to FDH/)).toBeTruthy();
  });
});
