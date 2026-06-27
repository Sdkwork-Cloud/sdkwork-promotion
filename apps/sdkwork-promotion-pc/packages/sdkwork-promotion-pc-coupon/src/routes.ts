import type { SdkworkPromotionPcRouteContribution } from "@sdkwork/promotion-pc-core";

export const sdkworkPromotionPcCouponRoutes = [
  {
    auth: "required",
    capability: "coupon",
    domain: "promotion",
    id: "app.commerce.coupon.dashboard",
    packageName: "@sdkwork/promotion-pc-coupon",
    path: "/app/coupon",
    screen: "dashboard",
    surface: "app",
    title: "Coupons",
    titleKey: "coupon.routes.dashboard.title",
  },
] as const satisfies readonly SdkworkPromotionPcRouteContribution[];
