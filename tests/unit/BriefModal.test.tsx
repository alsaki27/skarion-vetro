import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BriefModal from "@/components/BriefModal";
import type { ProjectFixture } from "@/lib/types";

const mockProject: ProjectFixture = {
  id: "p1-greenfield",
  title: "Project 1: Greenfield Build",
  scenario: "A new housing development needs fiber-to-the-home service.",
  tasks: ["Place poles along the main road", "Route cable from the CO to each premise"],
  constraints: { maxPoleSpanFt: 300, maxDropCableFt: 150, minCableCount: 12 },
  constraintNotes: ["Maximum pole span is 300ft", "Drop cables cannot exceed 150ft"],
  deliverables: ["Completed HLD design with all premises connected"],
  tip: "Start by placing the CO at the edge of the development.",
  environment: "aerial",
  difficulty: "beginner",
  splitArchitecture: "centralized",
  gradingWeights: { coverage: 0.3, connectivity: 0.3, compliance: 0.2, efficiency: 0.2 },
  preloadedElements: [],
  optimalStats: { totalCableFt: 5280 },
  passThreshold: 80,
  requirements: [],
  mapCenter: [-97.0, 30.0],
  mapZoom: 15,
};

describe("BriefModal", () => {
  it("renders the project title and description", () => {
    render(<BriefModal project={mockProject} onClose={() => {}} />);

    expect(screen.getByText("📋 Project 1: Greenfield Build")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A new housing development needs fiber-to-the-home service.",
      ),
    ).toBeInTheDocument();
  });

  it("renders an Open Map Canvas button", () => {
    render(<BriefModal project={mockProject} onClose={() => {}} />);
    expect(
      screen.getByRole("button", { name: /open map canvas/i }),
    ).toBeInTheDocument();
  });
});
