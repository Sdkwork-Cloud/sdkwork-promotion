import type { SdkworkPromotionPcRouteContribution } from "@sdkwork/promotion-pc-core";

export const sdkworkPromotionPcPointsRoutes = [
  {
    auth: "required",
    capability: "points",
    domain: "promotion",
    id: "app.commerce.points.dashboard",
    packageName: "@sdkwork/promotion-pc-points",
    path: "/app/points",
    screen: "dashboard",
    surface: "app",
    title: "Points",
    titleKey: "points.routes.dashboard.title",
  },
] as const satisfies readonly SdkworkPromotionPcRouteContribution[];
