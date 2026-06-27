import type { SdkworkPromotionPcRouteContribution } from "@sdkwork/promotion-pc-core";

export const sdkworkPromotionPcPricingRoutes = [
  {
    auth: "required",
    capability: "pricing",
    domain: "promotion",
    id: "app.commerce.pricing.dashboard",
    packageName: "@sdkwork/promotion-pc-pricing",
    path: "/app/pricing",
    screen: "dashboard",
    surface: "app",
    title: "Pricing",
    titleKey: "pricing.routes.dashboard.title",
  },
] as const satisfies readonly SdkworkPromotionPcRouteContribution[];
