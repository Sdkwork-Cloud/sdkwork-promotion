import type { CSSProperties } from "react";
import { createSdkworkBackdropStyle, createSdkworkGlassStyle, createSdkworkHeroStyle, createSdkworkPanelStyle, createSdkworkToneStyle, type SdkworkThemeVisualTone } from "@sdkwork/ui-pc-react/theme";

export type SdkworkCouponVisualTone = SdkworkThemeVisualTone;

export type SdkworkCouponMetricTone = "default" | "danger" | "success" | "warning";

export function resolveSdkworkCouponStatusTone(
  status: string | null | undefined,
): SdkworkCouponMetricTone {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "available") {
    return "success";
  }

  if (normalized === "used") {
    return "warning";
  }

  if (normalized === "expired" || normalized === "inactive") {
    return "danger";
  }

  return "default";
}

export function createSdkworkCouponToneStyle(
  tone: SdkworkCouponVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkToneStyle(tone, options);
}

export function createSdkworkCouponMetricToneStyle(
  tone: SdkworkCouponMetricTone,
): CSSProperties {
  if (tone === "success") {
    return createSdkworkCouponToneStyle("success", {
      backgroundWeight: 14,
      borderWeight: 26,
    });
  }

  if (tone === "warning") {
    return createSdkworkCouponToneStyle("warning", {
      backgroundWeight: 14,
      borderWeight: 26,
    });
  }

  if (tone === "danger") {
    return createSdkworkCouponToneStyle("danger", {
      backgroundWeight: 14,
      borderWeight: 26,
    });
  }

  return createSdkworkCouponToneStyle("neutral", {
    backgroundWeight: 10,
    borderWeight: 22,
  });
}

export function createSdkworkCouponPanelStyle(
  tone: SdkworkCouponVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
    surfaceColor?: string;
    surfaceWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkPanelStyle(tone, options);
}

export function createSdkworkCouponGlassStyle(
  tone: SdkworkCouponVisualTone,
  options: {
    backgroundWeight?: number;
    borderWeight?: number;
    surfaceColor?: string;
    surfaceWeight?: number;
  } = {},
): CSSProperties {
  return createSdkworkGlassStyle(tone, options);
}

export function createSdkworkCouponBackdropStyle(): CSSProperties {
  return createSdkworkBackdropStyle();
}

export function createSdkworkCouponHeroStyle(): CSSProperties {
  return createSdkworkHeroStyle();
}

export function createSdkworkCouponHeroTextStyle(
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
