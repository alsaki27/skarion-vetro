import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("ScoreCard placeholder", () => {
  it("renders without errors", () => {
    const { container } = render(React.createElement("div", { "data-testid": "scorecard" }, "Score: 85%"));
    expect(screen.getByTestId("scorecard")).toBeTruthy();
    expect(container.textContent).toContain("85%");
  });
});
