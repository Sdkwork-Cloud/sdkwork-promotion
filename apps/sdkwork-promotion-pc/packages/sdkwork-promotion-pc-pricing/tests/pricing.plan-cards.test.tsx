import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPricingPlanCards,
  type SdkworkPricingPlan,
} from "../src";

const plans = [
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
    current: true,
    description: "Start with metered usage and zero commitment.",
    featureValues: {
      "billing-model": "Usage",
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
    tags: ["No commitment"],
    title: "Pay as you go",
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
    description: "Predictable monthly pricing for creators.",
    featureValues: {
      "billing-model": "Subscription",
    },
    id: "plan-pro",
    includedPoints: 20000,
    includedUsage: "Included monthly quota",
    priceCny: 59,
    priceLabel: "CN婵?9 / month",
    recommended: true,
    savingsComparedToMonthlyCny: 0,
    seatLimit: 1,
    serviceTier: "pro",
    tags: ["Recommended"],
    title: "Pro Monthly",
  },
] satisfies SdkworkPricingPlan[];

describe("sdkwork-promotion-pc-pricing plan cards", () => {
  it("renders pricing plans, supports selection, and dispatches CTA navigation", () => {
    const PricingPlanCards = SdkworkPricingPlanCards;
    const onNavigate = vi.fn();
    const onSelectPlan = vi.fn();

    expect(PricingPlanCards).toBeTypeOf("function");

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingPlanCards
          onNavigate={onNavigate}
          onSelectPlan={onSelectPlan}
          plans={plans}
          selectedPlanId="usage-payg"
        />
      </SdkworkThemeProvider>,
    );

    expect(screen.getByText("Pay as you go")).toBeInTheDocument();
    expect(screen.getByText("Pro Monthly")).toBeInTheDocument();
    expect(screen.getAllByText(/recommended|current/i).length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", {
        name: /select pro monthly/i,
      }),
    );
    expect(onSelectPlan).toHaveBeenCalledWith("plan-pro");

    fireEvent.click(
      screen.getByRole("button", {
        name: /upgrade to pro monthly/i,
      }),
    );
    expect(onNavigate).toHaveBeenCalledWith("/subscription?mode=upgrade&packageId=101");
  });
});
