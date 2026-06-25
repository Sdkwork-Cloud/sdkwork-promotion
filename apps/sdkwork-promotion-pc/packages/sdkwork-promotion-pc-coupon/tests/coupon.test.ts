import { describe, expect, it } from "vitest";
import {
  couponPackageMeta,
  createCouponRouteIntent,
  createCouponWorkspaceManifest,
  estimateSdkworkCouponDiscountAmount,
  resolveSdkworkUserCouponRequestId,
  summarizeSdkworkCouponCatalog,
  summarizeSdkworkUserCoupons,
} from "../src";

describe("sdkwork-promotion-pc-coupon headless contract", () => {
  it("creates reusable coupon manifests, route intents, digests, and checkout discount estimates", () => {
    expect(couponPackageMeta).toMatchObject({
      domain: "commerce",
      package: "@sdkwork/promotion-pc-coupon",
    });

    expect(
      createCouponWorkspaceManifest({
        title: "Coupons",
      }),
    ).toMatchObject({
      capability: "coupon",
      packageNames: ["@sdkwork/promotion-pc-coupon"],
      routePath: "/coupons",
      title: "Coupons",
    });

    expect(
      createCouponRouteIntent({
        couponId: "COUPON-8",
        tab: "history",
        userCouponId: "UC-200",
      }),
    ).toEqual({
      couponId: "COUPON-8",
      focusWindow: true,
      route: "/coupons?tab=history&couponId=COUPON-8&userCouponId=UC-200",
      source: "coupon-workspace",
      tab: "history",
      type: "coupon-route-intent",
      userCouponId: "UC-200",
    });

    expect(
      summarizeSdkworkCouponCatalog([
        {
          canReceive: true,
          id: "coupon-1",
          pointsExchange: false,
          status: "available",
        },
        {
          canReceive: true,
          id: "coupon-2",
          pointsExchange: true,
          status: "available",
        },
        {
          canReceive: false,
          id: "coupon-3",
          pointsExchange: false,
          status: "inactive",
        },
      ]),
    ).toEqual({
      claimableCoupons: 2,
      pointsExchangeCoupons: 1,
      totalCoupons: 3,
    });

    expect(
      summarizeSdkworkUserCoupons([
        {
          discountAmountCny: 50,
          id: "user-coupon-1",
          remainingDays: 5,
          status: "available",
        },
        {
          discountAmountCny: 20,
          id: "user-coupon-2",
          remainingDays: 30,
          status: "available",
        },
        {
          discountAmountCny: 80,
          id: "user-coupon-3",
          remainingDays: 0,
          status: "expired",
        },
      ]),
    ).toEqual({
      availableCoupons: 2,
      expiringSoonCoupons: 1,
      highestDiscountAmountCny: 80,
      totalCoupons: 3,
    });

    expect(
      estimateSdkworkCouponDiscountAmount(699, {
        discountRate: 8.5,
        id: "user-coupon-annual",
        minimumSpendCny: 300,
        name: "Annual 8.5 Discount",
        status: "available",
      }),
    ).toBe(104.85);

    expect(
      resolveSdkworkUserCouponRequestId({
        couponId: "COUPON-9",
        id: "user-coupon-UC-999",
        userCouponId: "UC-999",
      }),
    ).toBe("UC-999");
  });
});
