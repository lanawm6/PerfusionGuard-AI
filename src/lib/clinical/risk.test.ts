import { describe, it, expect } from "vitest";
import { generateSamples } from "./data";
import { assessPerfusionRisk } from "./risk";

describe("illustrative perfusion rules", () => {
  it("stable scenario is LOW", () => {
    expect(assessPerfusionRisk(generateSamples("stable", 0), 78).level).toBe("LOW");
  });
  it("multiple-trends scenario is HIGH", () => {
    expect(assessPerfusionRisk(generateSamples("multiple", 0), 84).level).toBe("HIGH");
  });
  it("emerging scenario is MODERATE", () => {
    expect(assessPerfusionRisk(generateSamples("emerging", 0), 66).level).toBe("MODERATE");
  });
  it("GI scenario stays systemically LOW", () => {
    expect(assessPerfusionRisk(generateSamples("gi", 0), 70).level).toBe("LOW");
  });
});
