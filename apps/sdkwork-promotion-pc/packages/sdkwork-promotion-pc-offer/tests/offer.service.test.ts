import { describe, expect, it, vi } from "vitest";
import {
  createSdkworkOfferService,
  type CreateSdkworkOfferServiceOptions,
} from "../src";

describe("sdkwork-promotion-pc-offer service", () => {
  it("aggregates membership, recharge, and coupon opportunities into one shared featured-offer dashboard", async () => {
    const service = createSdkworkOfferService({
      couponService: {
        getDashboard: vi.fn().mockResolvedValue({
          availableCoupons: [
            {
              amountCny: 80,
              couponId: "205",
              id: "user-coupon-UC-205",
              name: "Member 80",
              remainingDays: 15,
              status: "available",
              type: "cash",
              userCouponId: "UC-205",
            },
          ],
          catalogCoupons: [
            {
              amountCny: 120,
              canReceive: true,
              couponId: "200",
              description: "Claimable launch discount",
              id: "coupon-200",
              name: "Launch 120",
              pointCost: null,
              pointsExchange: false,
              status: "available",
              type: "cash",
            },
            {
              amountCny: 80,
              canReceive: false,
              couponId: "201",
              description: "Points exchange coupon",
              id: "coupon-201",
              name: "Exchange 80",
              pointCost: 800,
              pointsExchange: true,
              status: "available",
              type: "cash",
            },
          ],
          catalogDigest: {
            claimableCoupons: 1,
            pointsExchangeCoupons: 1,
            totalCoupons: 2,
          },
          myCoupons: [],
          statistics: {
            expiredCount: 0,
            totalCoupons: 1,
            unusedCount: 1,
            usedCount: 0,
          },
          userDigest: {
            availableCoupons: 1,
            expiringSoonCoupons: 0,
            highestDiscountAmountCny: 80,
            totalCoupons: 1,
          },
        }),
      },
      pointsService: {
        getDashboard: vi.fn().mockResolvedValue({
          plans: [],
          rechargeOffers: [
            {
              description: "Best for premium creation",
              id: "recharge-pack-2",
              points: 5000,
              priceCny: 38,
              recommended: true,
              title: "5000 Points",
            },
          ],
          summary: {
            balancePoints: 2400,
            currentPlan: {
              level: 3,
              name: "Pro",
              remainingDays: 18,
              status: "active",
              points: 3200,
            },
            earnedThisMonth: 1200,
            isAuthenticated: true,
            pointsToCashRate: 100,
            spentThisMonth: 240,
            totalEarned: 5400,
            totalSpent: 3000,
          },
          transactions: [],
        }),
      },
      membershipService: {
        getDashboard: vi.fn().mockResolvedValue({
          benefits: [],
          levels: [],
          plans: [
            {
              durationDays: 365,
              id: "membership-plan-3",
              includedPoints: 60000,
              name: "Pro Annual",
              originalPriceCny: 999,
              packageId: 3,
              priceCny: 699,
              recommended: true,
              tags: ["Annual"],
            },
            {
              durationDays: 30,
              id: "membership-plan-2",
              includedPoints: 5000,
              name: "Pro Monthly",
              originalPriceCny: 239,
              packageId: 2,
              priceCny: 199,
              recommended: false,
              tags: ["Monthly"],
            },
          ],
          summary: {
            currentLevelName: "Pro",
            currentLevelValue: 3,
            growthValue: 180,
            isAuthenticated: true,
            isMember: true,
            pointBalance: 2400,
            remainingDays: 18,
            status: "active",
            totalSpent: 399,
            upgradeGrowthValue: 500,
            points: 3200,
          },
        }),
      },
      walletService: {
        getOverview: vi.fn().mockResolvedValue({
          account: {
            availablePoints: 2400,
            cashAvailable: 0,
            cashFrozen: 0,
            experience: 18,
            frozenPoints: 0,
            hasPayPassword: true,
            level: 3,
            tokenBalance: 0,
            totalEarned: 5400,
            totalPoints: 2400,
            totalSpent: 3000,
          },
          isAuthenticated: true,
          pointsToCashRate: 100,
          rechargePackages: [],
          transactions: [],
        }),
      },
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.inventory).toMatchObject({
      availableCoupons: 1,
      availablePoints: 2400,
      claimableCoupons: 1,
      currentLevelName: "Pro",
      isAuthenticated: true,
      membershipRemainingDays: 18,
    });
    expect(dashboard.digest).toEqual({
      couponOffers: 2,
      featuredOffers: 5,
      highlightedSavingsCny: 300,
      membershipOffers: 2,
      rechargeOffers: 1,
    });
    expect(dashboard.featuredOffers[0]).toMatchObject({
      action: {
        capability: "subscription",
        intent: "renew",
        route: "/subscription?mode=renew&packageId=3",
      },
      estimatedSavingsCny: 300,
      group: "membership",
      id: "offer-membership-3",
      kind: "membership-renewal",
      title: "Pro Annual",
    });
    expect(dashboard.featuredOffers).toContainEqual(
      expect.objectContaining({
        action: {
          capability: "coupon",
          intent: "claim",
          label: "Open coupon center",
          route: "/coupons?tab=discover&couponId=200",
        },
        group: "coupon",
        id: "offer-coupon-claim-200",
        kind: "coupon-claim",
      }),
    );
    expect(dashboard.featuredOffers).toContainEqual(
      expect.objectContaining({
        action: {
          capability: "points",
          intent: "recharge",
          label: "Open recharge",
          route: "/points?section=recharge",
        },
        group: "recharge",
        id: "offer-recharge-recharge-pack-2",
      }),
    );
  });

  it("returns a guest-safe empty dashboard when the current wallet session is anonymous", async () => {
    const service = createSdkworkOfferService({
      walletService: {
        getOverview: vi.fn().mockResolvedValue({
          account: {
            availablePoints: 0,
            cashAvailable: 0,
            cashFrozen: 0,
            experience: null,
            frozenPoints: 0,
            hasPayPassword: false,
            level: null,
            tokenBalance: 0,
            totalEarned: 0,
            totalPoints: 0,
            totalSpent: 0,
          },
          isAuthenticated: false,
          pointsToCashRate: null,
          rechargePackages: [],
          transactions: [],
        }),
      },
    });

    await expect(service.getDashboard()).resolves.toMatchObject({
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
    });
  });

  it("localizes guest dashboards and service-generated offer actions for Chinese workspaces", async () => {
    const localizedGuestService = createSdkworkOfferService({
      locale: "zh-CN",
      walletService: {
        getOverview: vi.fn().mockResolvedValue({
          account: {
            availablePoints: 0,
            cashAvailable: 0,
            cashFrozen: 0,
            experience: null,
            frozenPoints: 0,
            hasPayPassword: false,
            level: null,
            tokenBalance: 0,
            totalEarned: 0,
            totalPoints: 0,
            totalSpent: 0,
          },
          isAuthenticated: false,
          pointsToCashRate: null,
          rechargePackages: [],
          transactions: [],
        }),
      },
    } satisfies CreateSdkworkOfferServiceOptions);

    await expect(localizedGuestService.getDashboard()).resolves.toMatchObject({
      inventory: {
        currentLevelName: "访客",
      },
    });

    const localizedService = createSdkworkOfferService({
      couponService: {
        getDashboard: vi.fn().mockResolvedValue({
          availableCoupons: [],
          catalogCoupons: [
            {
              amountCny: 120,
              canReceive: true,
              couponId: "200",
              description: "Claimable launch discount",
              id: "coupon-200",
              name: "Launch 120",
              pointCost: null,
              pointsExchange: false,
              status: "available",
              type: "cash",
            },
          ],
          catalogDigest: {
            claimableCoupons: 1,
            pointsExchangeCoupons: 0,
            totalCoupons: 1,
          },
          myCoupons: [],
          statistics: {
            expiredCount: 0,
            totalCoupons: 0,
            unusedCount: 0,
            usedCount: 0,
          },
          userDigest: {
            availableCoupons: 0,
            expiringSoonCoupons: 0,
            highestDiscountAmountCny: 0,
            totalCoupons: 0,
          },
        }),
      },
      locale: "zh-CN",
      pointsService: {
        getDashboard: vi.fn().mockResolvedValue({
          plans: [],
          rechargeOffers: [
            {
              description: "Best for premium creation",
              id: "recharge-pack-2",
              points: 5000,
              priceCny: 38,
              recommended: true,
              title: "5000 Points",
            },
          ],
          summary: {
            balancePoints: 2400,
            currentPlan: null,
            earnedThisMonth: 1200,
            isAuthenticated: true,
            pointsToCashRate: 100,
            spentThisMonth: 240,
            totalEarned: 5400,
            totalSpent: 3000,
          },
          transactions: [],
        }),
      },
      membershipService: {
        getDashboard: vi.fn().mockResolvedValue({
          benefits: [],
          levels: [],
          plans: [
            {
              durationDays: 365,
              id: "membership-plan-3",
              includedPoints: 60000,
              name: "Pro Annual",
              originalPriceCny: 999,
              packageId: 3,
              priceCny: 699,
              recommended: true,
              tags: ["Annual"],
            },
          ],
          summary: {
            currentLevelName: "Pro",
            currentLevelValue: 3,
            growthValue: 180,
            isAuthenticated: true,
            isMember: true,
            pointBalance: 2400,
            remainingDays: 18,
            status: "active",
            totalSpent: 399,
            upgradeGrowthValue: 500,
            points: 3200,
          },
        }),
      },
      walletService: {
        getOverview: vi.fn().mockResolvedValue({
          account: {
            availablePoints: 2400,
            cashAvailable: 0,
            cashFrozen: 0,
            experience: 18,
            frozenPoints: 0,
            hasPayPassword: true,
            level: 3,
            tokenBalance: 0,
            totalEarned: 5400,
            totalPoints: 2400,
            totalSpent: 3000,
          },
          isAuthenticated: true,
          pointsToCashRate: 100,
          rechargePackages: [],
          transactions: [],
        }),
      },
    } satisfies CreateSdkworkOfferServiceOptions);

    const dashboard = await localizedService.getDashboard();

    expect(dashboard.featuredOffers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: expect.objectContaining({
            label: "打开续费",
          }),
          group: "membership",
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            label: "打开优惠中心",
          }),
          group: "coupon",
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            label: "打开充值",
          }),
          group: "recharge",
        }),
      ]),
    );
  });
});
