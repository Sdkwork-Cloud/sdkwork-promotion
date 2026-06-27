import { describe, expect, it, vi } from "vitest";
import {
  createSdkworkOfferController,
  type CreateSdkworkOfferControllerOptions,
} from "../src";

describe("sdkwork-promotion-pc-offer controller", () => {
  it("bootstraps, filters visible offers, tracks selection, and preserves selection after refresh", async () => {
    const firstDashboard = {
      digest: {
        couponOffers: 1,
        featuredOffers: 3,
        highlightedSavingsCny: 300,
        membershipOffers: 1,
        rechargeOffers: 1,
      },
      featuredOffers: [
        {
          action: {
            capability: "subscription" as const,
            label: "Open renewal",
            route: "/subscription?mode=renew&packageId=3",
          },
          estimatedSavingsCny: 300,
          group: "membership" as const,
          id: "offer-membership-3",
          kind: "membership-renewal" as const,
          priceCny: 699,
          recommended: true,
          tags: ["Annual"],
          title: "Pro Annual",
        },
        {
          action: {
            capability: "coupon" as const,
            label: "Open coupon center",
            route: "/coupons?tab=discover&couponId=200",
          },
          estimatedSavingsCny: 120,
          group: "coupon" as const,
          id: "offer-coupon-claim-200",
          kind: "coupon-claim" as const,
          priceCny: 0,
          recommended: true,
          tags: ["Claimable"],
          title: "Launch 120",
        },
        {
          action: {
            capability: "points" as const,
            label: "Open recharge",
            route: "/points?section=recharge",
          },
          estimatedSavingsCny: 12,
          group: "recharge" as const,
          id: "offer-recharge-recharge-pack-2",
          kind: "points-recharge" as const,
          priceCny: 38,
          recommended: false,
          tags: ["Points"],
          title: "5000 Points",
        },
      ],
      inventory: {
        availableCoupons: 1,
        availablePoints: 2400,
        claimableCoupons: 1,
        currentLevelName: "Pro",
        isAuthenticated: true,
        membershipRemainingDays: 18,
      },
    };
    const secondDashboard = {
      ...firstDashboard,
      featuredOffers: firstDashboard.featuredOffers.map((offer) =>
        offer.id === "offer-coupon-claim-200"
          ? {
              ...offer,
              title: "Launch 120 Updated",
            }
          : offer,
      ),
    };
    const service = {
      getDashboard: vi
        .fn()
        .mockResolvedValueOnce(firstDashboard)
        .mockResolvedValueOnce(secondDashboard),
      getEmptyDashboard: vi.fn().mockReturnValue({
        digest: {
          couponOffers: 0,
          featuredOffers: 0,
          highlightedSavingsCny: 0,
          membershipOffers: 0,
          rechargeOffers: 0,
        },
        featuredOffers: [],
        inventory: {
          availableCoupons: 0,
          availablePoints: 0,
          claimableCoupons: 0,
          currentLevelName: "Guest",
          isAuthenticated: false,
          membershipRemainingDays: null,
        },
      }),
    };

    const controller = createSdkworkOfferController({
      service,
    });

    await controller.bootstrap();
    expect(controller.getState()).toMatchObject({
      activeFilter: "all",
      isBootstrapped: true,
      isLoading: false,
      selectedOfferId: "offer-membership-3",
    });
    expect(controller.getState().visibleOffers).toHaveLength(3);

    controller.setFilter("coupon");
    expect(controller.getState().visibleOffers).toHaveLength(1);
    expect(controller.getState().visibleOffers[0]?.id).toBe("offer-coupon-claim-200");

    controller.selectOffer("offer-coupon-claim-200");
    expect(controller.getState().selectedOfferId).toBe("offer-coupon-claim-200");

    await controller.refresh();
    expect(controller.getState().selectedOfferId).toBe("offer-coupon-claim-200");
    expect(controller.getState().dashboard.featuredOffers[1]?.title).toBe("Launch 120 Updated");
  });

  it("uses localized controller fallback copy when bootstrap fails without an error instance", async () => {
    const controller = createSdkworkOfferController({
      locale: "zh-CN",
      service: {
        getDashboard: vi.fn().mockRejectedValue(null),
        getEmptyDashboard: vi.fn().mockReturnValue({
          digest: {
            couponOffers: 0,
            featuredOffers: 0,
            highlightedSavingsCny: 0,
            membershipOffers: 0,
            rechargeOffers: 0,
          },
          featuredOffers: [],
          inventory: {
            availableCoupons: 0,
            availablePoints: 0,
            claimableCoupons: 0,
            currentLevelName: "Guest",
            isAuthenticated: false,
            membershipRemainingDays: null,
          },
        }),
      },
    } satisfies CreateSdkworkOfferControllerOptions);

    await expect(controller.bootstrap()).rejects.toBeNull();
    expect(controller.getState().lastError).toBe("加载优惠中心失败。");
  });
});
