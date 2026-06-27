import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPricingPage,
} from "../src";

function createCatalog() {
  return {
    digest: {
      currentPlanTitle: "Team Annual",
      highestSavingsCny: 120,
      hybridPlans: 1,
      planCount: 5,
      prepaidPlans: 1,
      recommendedPlanId: "plan-pro",
      subscriptionPlans: 2,
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
        billingModel: "subscription",
        cadence: "annual",
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
        priceLabel: "CN¥599 / year",
        recommended: false,
        savingsComparedToMonthlyCny: 120,
        seatLimit: 10,
        serviceTier: "team",
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
        billingModel: "subscription",
        cadence: "monthly",
        current: false,
        description: "For independent production workflows.",
        featureValues: {
          "billing-model": "Subscription",
          "included-points": "20,000 / month",
        },
        id: "plan-pro",
        includedPoints: 20000,
        includedUsage: "Included monthly quota",
        priceCny: 59,
        priceLabel: "CN¥59 / month",
        recommended: true,
        savingsComparedToMonthlyCny: 0,
        seatLimit: 1,
        serviceTier: "pro",
        tags: ["creator"],
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
        billingModel: "prepaid",
        cadence: "one-time",
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
        priceLabel: "CN¥99 / pack",
        recommended: false,
        savingsComparedToMonthlyCny: 0,
        seatLimit: 1,
        serviceTier: "pro",
        tags: ["credits"],
        title: "Studio Credits 12K",
      },
      {
        action: {
          capability: "billing",
          intent: "open",
          label: "Open billing",
          route: "/billing?breakdown=provider",
        },
        bestFitFor: "Variable usage",
        billingModel: "usage",
        cadence: "metered",
        current: false,
        description: "Usage-based.",
        featureValues: {
          "billing-model": "Usage",
          "included-points": "None",
        },
        id: "usage-payg",
        includedPoints: 0,
        includedUsage: "Metered as consumed",
        priceCny: null,
        priceLabel: "Usage based",
        recommended: false,
        savingsComparedToMonthlyCny: 0,
        seatLimit: 1,
        serviceTier: "free",
        tags: ["usage"],
        title: "Pay as you go",
      },
      {
        action: {
          capability: "offer",
          intent: "review",
          label: "Review enterprise path",
          route: "/offers?group=membership",
        },
        bestFitFor: "Security and procurement",
        billingModel: "hybrid",
        cadence: "monthly",
        current: false,
        description: "Custom hybrid.",
        featureValues: {
          "billing-model": "Hybrid",
          "included-points": "Custom",
        },
        id: "enterprise-hybrid",
        includedPoints: 0,
        includedUsage: "Included quota + overflow metering",
        priceCny: null,
        priceLabel: "Custom",
        recommended: false,
        savingsComparedToMonthlyCny: 0,
        seatLimit: null,
        serviceTier: "enterprise",
        tags: ["enterprise"],
        title: "Enterprise Hybrid",
      },
    ],
    summary: {
      activeSubscriptionPlans: 2,
      availablePoints: 32000,
      bestOfferSavingsCny: 120,
      budgetPosture: "watch",
      currentLevelName: "Team",
      isAuthenticated: true,
      walletBalanceCny: 260,
    },
  };
}

describe("sdkwork-promotion-pc-pricing page", () => {
  it("renders the pricing center, filters plans, and routes selected CTA actions", async () => {
    const Page = SdkworkPricingPage;
    const onNavigate = vi.fn();

    expect(Page).toBeTypeOf("function");

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <Page
          onNavigate={onNavigate}
          service={{
            getCatalog: vi.fn().mockResolvedValue(createCatalog()),
            getEmptyCatalog: vi.fn().mockReturnValue({
              ...createCatalog(),
              digest: {
                currentPlanTitle: "Pay as you go",
                highestSavingsCny: 0,
                hybridPlans: 1,
                planCount: 2,
                prepaidPlans: 0,
                recommendedPlanId: "usage-payg",
                subscriptionPlans: 0,
                usagePlans: 1,
              },
              plans: createCatalog().plans.filter(
                (plan) => plan.id === "usage-payg" || plan.id === "enterprise-hybrid",
              ),
              summary: {
                ...createCatalog().summary,
                budgetPosture: "healthy",
                currentLevelName: "Pay as you go",
                isAuthenticated: false,
                walletBalanceCny: 0,
              },
            }),
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /pricing center/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Team Annual").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^prepaid$/i,
      }),
    );
    expect(screen.getAllByText("Studio Credits 12K").length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^subscription$/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /upgrade to pro monthly/i,
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith("/subscription?mode=upgrade&packageId=101");
  });

  it("threads locale-aware default controller copy through the page shell before pricing data resolves", async () => {
    const Page = SdkworkPricingPage;

    expect(Page).toBeTypeOf("function");

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <Page
          locale="zh-CN"
          service={{
            getCatalog: vi.fn().mockImplementation(
              () => new Promise(() => undefined),
            ),
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "定价中心",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("按量付费").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("企业混合方案").length,
    ).toBeGreaterThan(0);
  });
});
