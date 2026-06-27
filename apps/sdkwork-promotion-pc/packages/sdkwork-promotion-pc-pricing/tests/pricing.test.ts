import { describe, expect, it } from "vitest";
import type { SdkworkPricingPlan } from "../src";
import * as pricingModule from "../src";

function createPlan(overrides: Partial<SdkworkPricingPlan> = {}): SdkworkPricingPlan {
  return {
    action: {
      capability: "subscription",
      intent: "purchase",
      label: "Choose plan",
      route: "/subscription",
    },
    bestFitFor: "Teams",
    billingModel: "subscription",
    cadence: "monthly",
    current: false,
    description: "Pricing plan",
    featureValues: {
      "billing-model": "Subscription",
      "budget-guard": "Included",
      cadence: "Monthly",
      "included-points": "20,000 / month",
      "included-usage": "Included monthly quota",
      "invoice-ready": false,
      "seat-limit": "1 seat",
    },
    id: "plan",
    includedPoints: 20000,
    includedUsage: "Included monthly quota",
    priceCny: 59,
    priceLabel: "CN¥59 / month",
    recommended: false,
    savingsComparedToMonthlyCny: 0,
    seatLimit: 1,
    serviceTier: "pro",
    tags: [],
    title: "Plan",
    ...overrides,
  };
}

describe("sdkwork-promotion-pc-pricing headless contract", () => {
  it("creates manifests, route intents, sorted plans, digests, and a public baseline catalog", () => {
    const {
      createEmptySdkworkPricingCatalog,
      createSdkworkPricingHybridPlan,
      createSdkworkPricingUsagePlan,
      createPricingRouteIntent,
      createPricingWorkspaceManifest,
      pricingPackageMeta,
      sortSdkworkPricingPlans,
      summarizeSdkworkPricingPlans,
    } = pricingModule;

    expect(pricingPackageMeta).toMatchObject({
      domain: "promotion",
      package: "@sdkwork/promotion-pc-pricing",
    });

    expect(createSdkworkPricingUsagePlan()).toMatchObject({
      action: {
        capability: "billing",
        intent: "open",
        label: "Open billing",
        route: "/billing?breakdown=provider",
      },
    });
    expect(createSdkworkPricingHybridPlan()).toMatchObject({
      action: {
        capability: "offer",
        intent: "review",
        label: "Review enterprise path",
        route: "/offers?group=membership",
      },
    });

    expect(
      createPricingWorkspaceManifest({
        title: "Pricing",
      }),
    ).toMatchObject({
      capability: "pricing",
      packageNames: [
        "@sdkwork/promotion-pc-pricing",
        "@sdkwork/account-pc-wallet",
        "@sdkwork/membership-pc-subscription",
        "@sdkwork/promotion-pc-offer",
      ],
      routePath: "/pricing",
      title: "Pricing",
    });

    expect(
      createPricingRouteIntent({
        billingModel: "hybrid",
        planId: "team-annual",
        serviceTier: "team",
      }),
    ).toEqual({
      billingModel: "hybrid",
      focusWindow: true,
      planId: "team-annual",
      route: "/pricing?billingModel=hybrid&serviceTier=team&planId=team-annual",
      serviceTier: "team",
      source: "pricing-workspace",
      type: "pricing-route-intent",
    });

    const sortedPlans = sortSdkworkPricingPlans([
      createPlan({
        billingModel: "usage",
        cadence: "metered",
        featureValues: {
          "billing-model": "Usage",
        },
        id: "usage-payg",
        priceCny: null,
        priceLabel: "Usage based",
        serviceTier: "free",
        title: "Pay as you go",
      }),
      createPlan({
        current: true,
        id: "team-annual",
        priceCny: 599,
        priceLabel: "CN¥599 / year",
        savingsComparedToMonthlyCny: 180,
        serviceTier: "team",
        title: "Team Annual",
      }),
      createPlan({
        billingModel: "hybrid",
        id: "enterprise-hybrid",
        priceCny: null,
        priceLabel: "Custom",
        serviceTier: "enterprise",
        title: "Enterprise Hybrid",
      }),
      createPlan({
        id: "pro-monthly",
        recommended: true,
        title: "Pro Monthly",
      }),
    ]);

    expect(sortedPlans.map((plan: { id: string }) => plan.id)).toEqual([
      "team-annual",
      "pro-monthly",
      "usage-payg",
      "enterprise-hybrid",
    ]);

    expect(summarizeSdkworkPricingPlans(sortedPlans)).toEqual({
      currentPlanTitle: "Team Annual",
      highestSavingsCny: 180,
      hybridPlans: 1,
      planCount: 4,
      prepaidPlans: 0,
      recommendedPlanId: "pro-monthly",
      subscriptionPlans: 2,
      usagePlans: 1,
    });

    const emptyCatalog = createEmptySdkworkPricingCatalog();

    expect(emptyCatalog.featureMatrix.map((feature: { id: string }) => feature.id)).toEqual([
      "billing-model",
      "cadence",
      "included-points",
      "included-usage",
      "seat-limit",
      "budget-guard",
      "invoice-ready",
    ]);
    expect(emptyCatalog.plans.map((plan: { id: string }) => plan.id)).toEqual([
      "usage-payg",
      "enterprise-hybrid",
    ]);
    expect(emptyCatalog.summary).toMatchObject({
      budgetPosture: "healthy",
      currentLevelName: "Pay as you go",
      isAuthenticated: false,
    });
  });

  it("localizes pricing workspace manifest defaults through the copy seam", () => {
    const { createPricingWorkspaceManifest } = pricingModule;

    expect(
      createPricingWorkspaceManifest({
        locale: "zh-CN",
        messages: {
          manifest: {
            description: "本地化定价工作区描述",
            title: "本地化定价标题",
          },
        },
      }),
    ).toMatchObject({
      description: "本地化定价工作区描述",
      title: "本地化定价标题",
    });
  });
});
