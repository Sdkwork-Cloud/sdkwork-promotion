import type { SdkworkPromotionPcRouteContribution } from "@sdkwork/promotion-pc-core";

export const sdkworkPromotionPcOfferRoutes = [
  {
    auth: "required",
    capability: "offer",
    domain: "promotion",
    id: "app.promotion.offer.dashboard",
    packageName: "@sdkwork/promotion-pc-offer",
    path: "/app/offer",
    screen: "dashboard",
    surface: "app",
    title: "Offers",
    titleKey: "offer.routes.dashboard.title",
  },
] as const satisfies readonly SdkworkPromotionPcRouteContribution[];
