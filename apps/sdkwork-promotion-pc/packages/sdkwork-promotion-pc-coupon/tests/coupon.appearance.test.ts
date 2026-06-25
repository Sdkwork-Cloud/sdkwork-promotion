import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createSdkworkCouponBackdropStyle,
  createSdkworkCouponGlassStyle,
  createSdkworkCouponHeroStyle,
  createSdkworkCouponHeroTextStyle,
  createSdkworkCouponMetricToneStyle,
  createSdkworkCouponPanelStyle,
  createSdkworkCouponToneStyle,
  resolveSdkworkCouponStatusTone,
} from "../src";

describe("sdkwork-promotion-pc-coupon appearance", () => {
  it("exposes coupon appearance seam from package index", () => {
    const indexFile = readFileSync(
      resolve(import.meta.dirname, "../src/index.ts"),
      "utf8",
    );

    expect(indexFile).toMatch(/export \* from "\.\/coupon-appearance(?:\.ts)?";/);
  });

  it("exports tone and metric helpers for coupon status and chip styling", () => {
    expect(resolveSdkworkCouponStatusTone("available")).toBe("success");
    expect(
      createSdkworkCouponMetricToneStyle("warning"),
    ).toEqual({
      backgroundColor: "color-mix(in srgb, var(--sdk-color-state-warning) 14%, transparent)",
      borderColor: "color-mix(in srgb, var(--sdk-color-state-warning) 26%, transparent)",
      color: "var(--sdk-color-state-warning)",
    });
    expect(
      createSdkworkCouponToneStyle("accent", {
        backgroundWeight: 18,
        borderWeight: 34,
      }),
    ).toEqual({
      backgroundColor: "color-mix(in srgb, var(--sdk-color-brand-accent) 18%, transparent)",
      borderColor: "color-mix(in srgb, var(--sdk-color-brand-accent) 34%, transparent)",
      color: "var(--sdk-color-brand-accent)",
    });
  });

  it("exports Sdkwork-style backdrop, hero, and panel style helpers", () => {
    expect(createSdkworkCouponBackdropStyle().backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createSdkworkCouponBackdropStyle().backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(createSdkworkCouponHeroStyle().backgroundImage).toContain("linear-gradient");
    expect(createSdkworkCouponHeroStyle().backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(createSdkworkCouponHeroStyle().backgroundImage).not.toContain("#111827");
    expect(createSdkworkCouponHeroTextStyle("muted")).toEqual({
      color: "color-mix(in srgb, white 72%, var(--sdk-color-brand-accent))",
    });
    expect(createSdkworkCouponGlassStyle("brand").backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createSdkworkCouponPanelStyle("brand").backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createSdkworkCouponPanelStyle("brand").backgroundImage).toContain("var(--sdk-color-surface-panel)");
  });
});
