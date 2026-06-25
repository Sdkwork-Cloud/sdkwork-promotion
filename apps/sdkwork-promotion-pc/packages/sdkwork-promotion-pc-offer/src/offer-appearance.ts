import type { CSSProperties } from "react";
import { createSdkworkBackdropStyle, createSdkworkGlassStyle, createSdkworkHeroStyle, createSdkworkPanelStyle, createSdkworkToneStyle, type SdkworkThemeVisualTone } from "@sdkwork/ui-pc-react/theme";

export type SdkworkOfferVisualTone = SdkworkThemeVisualTone;

export function createSdkworkOfferToneStyle(
  tone: SdkworkOfferVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkToneStyle(tone, options);
}

export function createSdkworkOfferPanelStyle(
  tone: SdkworkOfferVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
    surfaceColor?: string;
    surfaceWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkPanelStyle(tone, options);
}

export function createSdkworkOfferGlassStyle(
  tone: SdkworkOfferVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
    surfaceColor?: string;
    surfaceWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkGlassStyle(tone, options);
}

export function createSdkworkOfferBackdropStyle(): CSSProperties {
  return createSdkworkBackdropStyle();
}

export function createSdkworkOfferHeroStyle(): CSSProperties {
  return createSdkworkHeroStyle();
}

export function createSdkworkOfferHeroTextStyle(
  tone: "muted" | "primary" | "subtle" = "primary",
): CSSProperties {
  if (tone === "muted") {
    return {
      color: "color-mix(in srgb, white 72%, var(--sdk-color-brand-accent))",
    };
  }

  if (tone === "subtle") {
    return {
      color: "color-mix(in srgb, white 64%, var(--sdk-color-brand-accent))",
    };
  }

  return {
    color: "color-mix(in srgb, white 92%, var(--sdk-color-brand-accent))",
  };
}
