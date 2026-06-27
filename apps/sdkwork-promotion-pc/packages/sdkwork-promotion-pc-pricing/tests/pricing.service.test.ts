import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configurePromotionServiceMockSession,
  resetPromotionServiceMockSession,
} from "../../../tests/test-utils/promotion-service-mock";
import {
  createSdkworkPricingService,
} from "../src";

describe("sdkwork-promotion-pc-pricing service", () => {
  beforeEach(() => {
    configurePromotionServiceMockSession({ authToken: "session-token" });
  });

  afterEach(() => {
    resetPromotionServiceMockSession();
  });

  it("creates a reusable public baseline catalog and composes pricing plans from wallet, subscription, offer, and billing services", async () => {

    expect(createSdkworkPricingService).toBeTypeOf("function");

    const service = createSdkworkPricingService({
      billingService: {
        getDashboard: vi.fn().mockResolvedValue({
          alerts: [],
          breakdowns: {
            capability: [],
            model: [],
            provider: [],
            workspace: [],
          },
          budgetPolicy: {
            budgetAmountCny: 400,
            currency: "CNY",
            projectionDays: 30,
            warningThreshold: 0.8,
          },
          digest: {
            budgetAmountCny: 400,
            budgetRemainingCny: 220,
            monthSpendCny: 180,
            outstandingAmountCny: 20,
            projectedMonthSpendCny: 360,
            savingsOpportunityCny: 120,
            todaySpendCny: 12,
          },
          invoiceAttention: {
            actionableInvoices: 1,
            pendingInvoices: 1,
            recentInvoices: [],
          },
          paymentAttention: {
            actionablePayments: 1,
            availablePaymentMethods: 2,
            outstandingAmountCny: 20,
            recentPayments: [],
          },
          posture: "watch",
          recentUsage: [],
          summary: {
            activeSubscriptionPlans: 2,
            availablePoints: 32000,
            bestOfferSavingsCny: 120,
            currentLevelName: "Team",
            totalSpentCny: 1280,
          },
          topAction: null,
        }),
      },
      offerService: {
        getDashboard: vi.fn().mockResolvedValue({
          digest: {
            couponOffers: 1,
            featuredOffers: 3,
            highlightedSavingsCny: 120,
            membershipOffers: 2,
            rechargeOffers: 1,
          },
          featuredOffers: [],
          inventory: {
            availableCoupons: 1,
            availablePoints: 32000,
            claimableCoupons: 1,
            currentLevelName: "Team",
            expiringSoonCoupons: 0,
            isAuthenticated: true,
            membershipRemainingDays: 280,
          },
        }),
      },
      subscriptionService: {
        getDashboard: vi.fn().mockResolvedValue({
          benefits: [],
          checkout: {
            action: "upgrade",
            discountAmountCny: 0,
            originalAmountCny: 59,
            payableAmountCny: 59,
            selectedCouponId: null,
            selectedPackageId: 101,
            selectedPaymentMethod: "WECHAT",
          },
          coupons: [],
          levels: [],
          plans: [
            {
              description: "For independent production workflows.",
              durationDays: 30,
              id: "plan-pro",
              includedPoints: 20000,
              levelName: "Pro",
              name: "Pro Monthly",
              packageId: 101,
              priceCny: 59,
              recommended: true,
              tags: ["creator"],
            },
            {
              description: "For shared team workspaces and operators.",
              durationDays: 365,
              id: "plan-team",
              includedPoints: 360000,
              levelName: "Team",
              name: "Team Annual",
              packageId: 102,
              priceCny: 599,
              recommended: false,
              tags: ["team", "annual"],
            },
          ],
          summary: {
            currentLevelName: "Team",
            isAuthenticated: true,
            isMember: true,
          },
        }),
      },
      walletService: {
        getOverview: vi.fn().mockResolvedValue({
          account: {
            availablePoints: 32000,
            cashAvailable: 260,
            cashFrozen: 0,
            experience: null,
            frozenPoints: 0,
            hasPayPassword: false,
            level: 2,
            levelName: "Team",
            status: "active",
            statusName: "Active",
            tokenBalance: 0,
            totalEarned: 0,
            totalPoints: 32000,
            totalSpent: 1280,
          },
          isAuthenticated: true,
          pointsToCashRate: 100,
          rechargePackages: [
            {
              description: "Burst credits for launch windows.",
              id: 9001,
              points: 12000,
              priceCny: 99,
              recommended: true,
              sortWeight: 1,
              title: "Studio Credits 12K",
            },
          ],
          transactions: [],
        }),
      },
    });

    const emptyCatalog = service.getEmptyCatalog();

    expect(emptyCatalog.plans.map((plan: { billingModel: string }) => plan.billingModel)).toEqual([
      "usage",
      "hybrid",
    ]);

    const catalog = await service.getCatalog();

    expect(catalog.summary).toMatchObject({
      activeSubscriptionPlans: 2,
      availablePoints: 32000,
      bestOfferSavingsCny: 120,
      budgetPosture: "watch",
      currentLevelName: "Team",
      isAuthenticated: true,
      walletBalanceCny: 260,
    });
    expect(catalog.digest).toMatchObject({
      currentPlanTitle: "Team Annual",
      highestSavingsCny: 120,
      hybridPlans: 1,
      planCount: 5,
      prepaidPlans: 1,
      subscriptionPlans: 2,
      usagePlans: 1,
    });
    expect(catalog.featureMatrix.map((feature: { id: string }) => feature.id)).toEqual([
      "billing-model",
      "cadence",
      "included-points",
      "included-usage",
      "seat-limit",
      "budget-guard",
      "invoice-ready",
    ]);
    expect(catalog.plans[0]).toMatchObject({
      billingModel: "subscription",
      current: true,
      id: "plan-team",
      title: "Team Annual",
    });
    expect(catalog.plans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: expect.objectContaining({
            capability: "billing",
            intent: "open",
            route: "/billing?breakdown=provider",
          }),
          billingModel: "usage",
          id: "usage-payg",
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            capability: "wallet",
            intent: "recharge",
            route: "/wallet?section=recharge",
          }),
          billingModel: "prepaid",
          id: "recharge-9001",
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            capability: "subscription",
            intent: "upgrade",
            route: "/subscription?mode=upgrade&packageId=101",
          }),
          billingModel: "subscription",
          id: "plan-pro",
          recommended: true,
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            capability: "subscription",
            intent: "renew",
            route: "/subscription?mode=renew&packageId=102",
          }),
          billingModel: "subscription",
          id: "plan-team",
        }),
        expect.objectContaining({
          action: expect.objectContaining({
            capability: "offer",
            intent: "review",
            route: "/offers?group=membership",
          }),
          billingModel: "hybrid",
          id: "enterprise-hybrid",
        }),
      ]),
    );
  });

  it("localizes service-generated default catalog copy for Chinese workspaces", () => {

    expect(createSdkworkPricingService).toBeTypeOf("function");

    const service = createSdkworkPricingService({
      locale: "zh-CN",
    });
    const catalog = service.getEmptyCatalog();

    expect(catalog.summary.currentLevelName).toBe("按量付费");
    expect(catalog.plans.map((plan: { title: string }) => plan.title)).toEqual([
      "按量付费",
      "企业混合方案",
    ]);
    expect(catalog.featureMatrix.map((feature: { label: string }) => feature.label)).toEqual([
      "计费模型",
      "计费周期",
      "包含积分",
      "包含用量",
      "席位上限",
      "预算守护",
      "支持发票",
    ]);
  });
});
