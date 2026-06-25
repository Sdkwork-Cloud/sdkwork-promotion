import { describe, expect, it } from "vitest";
import {
  createSdkworkPricingBackdropStyle,
  createSdkworkPricingGlassStyle,
  createSdkworkPricingHeroStyle,
  createSdkworkPricingHeroTextStyle,
  createSdkworkPricingPanelStyle,
  createSdkworkPricingToneStyle,
} from "../src";

describe("sdkwork-promotion-pc-pricing appearance", () => {
  it("exports theme-driven tone, glass, and hero text styles for reusable pricing surfaces", () => {
    const createToneStyle = createSdkworkPricingToneStyle;
    const createGlassStyle = createSdkworkPricingGlassStyle;
    const createHeroTextStyle = createSdkworkPricingHeroTextStyle;

    expect(createToneStyle).toBeTypeOf("function");
    expect(createGlassStyle).toBeTypeOf("function");
    expect(createHeroTextStyle).toBeTypeOf("function");

    if (
      typeof createToneStyle !== "function"
      || typeof createGlassStyle !== "function"
      || typeof createHeroTextStyle !== "function"
    ) {
      return;
    }

    expect(
      createToneStyle("accent", {
        backgroundWeight: 18,
        borderWeight: 32,
      }),
    ).toEqual({
      backgroundColor: "color-mix(in srgb, var(--sdk-color-brand-accent) 18%, transparent)",
        borderColor: "color-mix(in srgb, var(--sdk-color-brand-accent) 32%, transparent)",
        color: "var(--sdk-color-brand-accent)",
      });
    expect(String(createGlassStyle("brand").backgroundImage)).toContain("var(--sdk-color-brand-primary)");
    expect(String(createHeroTextStyle("muted").color)).toContain("white");
  });

  it("exports layered Sdkwork-style pricing gradients for hero and panel surfaces without raw hex colors", () => {
    const createPanelStyle = createSdkworkPricingPanelStyle;
    const createHeroStyle = createSdkworkPricingHeroStyle;
    const createBackdropStyle = createSdkworkPricingBackdropStyle;

    expect(createPanelStyle).toBeTypeOf("function");
    expect(createHeroStyle).toBeTypeOf("function");
    expect(createBackdropStyle).toBeTypeOf("function");

    if (
      typeof createPanelStyle !== "function"
      || typeof createHeroStyle !== "function"
      || typeof createBackdropStyle !== "function"
    ) {
      return;
    }

    expect(createPanelStyle("accent").backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(createPanelStyle("accent").backgroundImage).toContain("var(--sdk-color-surface-panel)");
    expect(createHeroStyle().backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createHeroStyle().backgroundImage).toContain("var(--sdk-color-surface-canvas)");
    expect(createHeroStyle().backgroundImage).toContain("var(--sdk-color-surface-panel)");
    expect(createHeroStyle().backgroundImage).not.toContain("#18181b");
    expect(createBackdropStyle().backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createBackdropStyle().backgroundImage).toContain("var(--sdk-color-brand-accent)");
  });
});
