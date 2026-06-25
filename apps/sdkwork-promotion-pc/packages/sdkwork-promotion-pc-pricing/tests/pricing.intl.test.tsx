import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPricingIntlProvider,
  SdkworkPricingPage,
  SdkworkPricingPlanCards,
  createSdkworkPricingController,
  type SdkworkPricingCatalogData,
} from "../src";

function createCatalog(): SdkworkPricingCatalogData {
  return {
    digest: {
      currentPlanTitle: "Team Annual",
      highestSavingsCny: 120,
      hybridPlans: 1,
      planCount: 3,
      prepaidPlans: 1,
      recommendedPlanId: "plan-pro",
      subscriptionPlans: 1,
      usagePlans: 1,
    },
    featureMatrix: [
      {
        id: "billing-model",
        label: "Billing model",
      },
      {
        id: "included-points",
        label: "Included points",
      },
    ],
    plans: [
      {
        action: {
          capability: "subscription",
          intent: "renew",
          label: "Renew current plan",
          route: "/subscription?mode=renew&packageId=102",
        },
        bestFitFor: "Operations-heavy teams",
        billingModel: "subscription" as const,
        cadence: "annual" as const,
        current: true,
        description: "Shared seats and annual savings.",
        featureValues: {
          "billing-model": "Subscription",
          "included-points": "360,000 / year",
        },
        id: "plan-team",
        includedPoints: 360000,
        includedUsage: "Included annual quota",
        priceCny: 599,
        priceLabel: "CNY 599 / year",
        recommended: false,
        savingsComparedToMonthlyCny: 120,
        seatLimit: 10,
        serviceTier: "team" as const,
        tags: ["team"],
        title: "Team Annual",
      },
      {
        action: {
          capability: "subscription",
          intent: "upgrade",
          label: "Upgrade to Pro Monthly",
          route: "/subscription?mode=upgrade&packageId=101",
        },
        bestFitFor: "Daily individual usage",
        billingModel: "subscription" as const,
        cadence: "monthly" as const,
        current: false,
        description: "Predictable monthly pricing for creators.",
        featureValues: {
          "billing-model": "Subscription",
          "included-points": "20,000 / month",
        },
        id: "plan-pro",
        includedPoints: 20000,
        includedUsage: "Included monthly quota",
        priceCny: 59,
        priceLabel: "CNY 59 / month",
        recommended: true,
        savingsComparedToMonthlyCny: 0,
        seatLimit: 1,
        serviceTier: "pro" as const,
        tags: ["Recommended"],
        title: "Pro Monthly",
      },
      {
        action: {
          capability: "wallet",
          intent: "recharge",
          label: "Top up wallet",
          route: "/wallet?section=recharge",
        },
        bestFitFor: "Burst launches",
        billingModel: "prepaid" as const,
        cadence: "one-time" as const,
        current: false,
        description: "Recharge credits.",
        featureValues: {
          "billing-model": "Prepaid",
          "included-points": "12,000 credits",
        },
        id: "recharge-9001",
        includedPoints: 12000,
        includedUsage: "Recharge credits",
        priceCny: 99,
        priceLabel: "CNY 99 / pack",
        recommended: false,
        savingsComparedToMonthlyCny: 0,
        seatLimit: 1,
        serviceTier: "pro" as const,
        tags: ["credits"],
        title: "Studio Credits 12K",
      },
    ],
    summary: {
      activeSubscriptionPlans: 2,
      availablePoints: 32000,
      bestOfferSavingsCny: 120,
      budgetPosture: "watch" as const,
      currentLevelName: "Team",
      isAuthenticated: true,
      walletBalanceCny: 260,
    },
  };
}

function createEmptyCatalog() {
  return {
    ...createCatalog(),
    digest: {
      currentPlanTitle: "Pay as you go",
      highestSavingsCny: 0,
      hybridPlans: 0,
      planCount: 1,
      prepaidPlans: 0,
      recommendedPlanId: "usage-payg",
      subscriptionPlans: 0,
      usagePlans: 1,
    },
    plans: [],
    summary: {
      activeSubscriptionPlans: 0,
      availablePoints: 0,
      bestOfferSavingsCny: 0,
      budgetPosture: "healthy" as const,
      currentLevelName: "Pay as you go",
      isAuthenticated: false,
      walletBalanceCny: 0,
    },
  };
}

function createController() {
  return createSdkworkPricingController({
    service: {
      getCatalog: vi.fn().mockResolvedValue(createCatalog()),
      getEmptyCatalog: vi.fn().mockReturnValue(createEmptyCatalog()),
    },
  });
}

describe("sdkwork-promotion-pc-pricing intl", () => {
  it("renders Chinese copy across the pricing page when a Chinese locale is provided", async () => {
    const PricingPage = SdkworkPricingPage;
    const controller = createController();

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingPage controller={controller} locale="zh-CN" />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "\u5b9a\u4ef7\u4e2d\u5fc3",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "\u5237\u65b0\u5b9a\u4ef7" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "\u9884\u4ed8\u8d39" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "\u5546\u4e1a\u5316\u5957\u9910\u5bf9\u6bd4" })).toBeInTheDocument();
  });

  it("applies host message overrides on top of the localized pricing seam", async () => {
    const PricingPage = SdkworkPricingPage;
    const controller = createController();

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingPage
          controller={controller}
          locale="zh-CN"
          messages={{
            page: {
              title: "Host pricing cockpit",
            },
            actions: {
              refresh: "Sync now",
            },
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Host pricing cockpit",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeInTheDocument();
  });

  it("falls back to built-in English copy for standalone pricing components without a host intl provider", () => {
    const PricingPlanCards = SdkworkPricingPlanCards;

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingPlanCards
          onNavigate={vi.fn()}
          onSelectPlan={vi.fn()}
          plans={createCatalog().plans}
          selectedPlanId="plan-team"
        />
      </SdkworkThemeProvider>,
    );

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /select pro monthly/i })).toBeInTheDocument();
  });

  it("lets standalone pricing components consume Chinese copy through the intl provider", () => {
    const PricingIntlProvider = SdkworkPricingIntlProvider;
    const PricingPlanCards = SdkworkPricingPlanCards;

    expect(PricingIntlProvider).toBeTypeOf("function");

    if (typeof PricingIntlProvider !== "function") {
      return;
    }

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingIntlProvider locale="zh-CN">
          <PricingPlanCards
            onNavigate={vi.fn()}
            onSelectPlan={vi.fn()}
            plans={createCatalog().plans}
            selectedPlanId="plan-team"
          />
        </PricingIntlProvider>
      </SdkworkThemeProvider>,
    );

    expect(screen.getAllByText("\u5f53\u524d\u65b9\u6848").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /\u9009\u62e9 pro monthly/i })).toBeInTheDocument();
  });
});
