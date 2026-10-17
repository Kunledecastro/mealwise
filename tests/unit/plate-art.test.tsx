import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlateArt } from "@/components/plate-art";
import { SAMPLE_MEALS } from "@/lib/sample-data";

describe("PlateArt", () => {
  it("draws the same dish identically every time (no hydration mismatch)", () => {
    const m = SAMPLE_MEALS[0];
    const a = render(<PlateArt parts={m.plate} seed={m.slug} />).container.innerHTML;
    const b = render(<PlateArt parts={m.plate} seed={m.slug} />).container.innerHTML;
    expect(a).toBe(b);
  });

  it("has an accessible label listing the components", () => {
    const m = SAMPLE_MEALS.find((x) => x.slug === "jollof-rice-chicken")!;
    const { getByRole } = render(<PlateArt parts={m.plate} seed={m.slug} />);
    expect(getByRole("img").getAttribute("aria-label")).toMatch(/Jollof rice.*Chicken.*Salad/);
  });

  it("renders every sample meal without throwing", () => {
    for (const m of SAMPLE_MEALS) render(<PlateArt parts={m.plate} seed={m.slug} />);
  });
});
