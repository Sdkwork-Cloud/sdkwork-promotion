import { describe, expect, it } from "vitest";
import {
  createSdkworkOfferBackdropStyle,
  createSdkworkOfferGlassStyle,
  createSdkworkOfferHeroStyle,
  createSdkworkOfferHeroTextStyle,
  createSdkworkOfferPanelStyle,
  createSdkworkOfferToneStyle,
} from "../src";

describe("sdkwork-promotion-pc-offer appearance", () => {
  it("exports Sdkwork-style offer backdrop, hero, panel, tone, glass, and hero-text helpers", () => {
    expect(createSdkworkOfferToneStyle("brand").color).toBe("var(--sdk-color-brand-primary)");
    expect(createSdkworkOfferPanelStyle("accent").backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(createSdkworkOfferPanelStyle("accent").backgroundImage).toContain("var(--sdk-color-surface-panel)");
    expect(createSdkworkOfferHeroStyle().backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(createSdkworkOfferHeroStyle().backgroundImage).toContain("var(--sdk-color-surface-canvas)");
    expect(createSdkworkOfferHeroStyle().backgroundImage).toContain("var(--sdk-color-surface-panel)");
    expect(createSdkworkOfferHeroStyle().backgroundImage).not.toContain("#18181b");
    expect(createSdkworkOfferBackdropStyle().backgroundImage).toContain("var(--sdk-color-brand-primary)");
    expect(createSdkworkOfferGlassStyle("accent").backgroundImage).toContain("var(--sdk-color-brand-accent)");
    expect(String(createSdkworkOfferHeroTextStyle("muted").color)).toContain("white");
  });
});
