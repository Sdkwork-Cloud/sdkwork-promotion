import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPricingComparisonTable,
} from "../src";

describe("sdkwork-promotion-pc-pricing comparison table", () => {
  it("renders feature rows and supports focusing a plan column", () => {
    const PricingComparisonTable = SdkworkPricingComparisonTable;
    const onSelectPlan = vi.fn();

    expect(PricingComparisonTable).toBeTypeOf("function");

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PricingComparisonTable
          featureMatrix={[
            {
              id: "billing-model",
              label: "Billing model",
            },
            {
              id: "invoice-ready",
              label: "Invoice-ready",
            },
          ]}
          onSelectPlan={onSelectPlan}
          plans={[
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
              description: "Usage based.",
              featureValues: {
                "billing-model": "Usage",
                "invoice-ready": false,
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
              tags: [],
              title: "Pay as you go",
            },
            {
              action: {
                capability: "subscription",
                intent: "renew",
                label: "Renew current plan",
                route: "/subscription?mode=renew&packageId=102",
              },
              bestFitFor: "Team procurement",
              billingModel: "subscription",
              cadence: "annual",
              current: true,
              description: "Team subscription.",
              featureValues: {
                "billing-model": "Subscription",
                "invoice-ready": true,
              },
              id: "plan-team",
              includedPoints: 360000,
              includedUsage: "Included annual quota",
              priceCny: 599,
              priceLabel: "CN婵?99 / year",
              recommended: false,
              savingsComparedToMonthlyCny: 120,
              seatLimit: 10,
              serviceTier: "team",
              tags: [],
              title: "Team Annual",
            },
          ]}
          selectedPlanId="plan-team"
        />
      </SdkworkThemeProvider>,
    );

    expect(screen.getByText("Billing model")).toBeInTheDocument();
    expect(screen.getByText("Invoice-ready")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Usage")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /focus pay as you go/i,
      }),
    );
    expect(onSelectPlan).toHaveBeenCalledWith("usage-payg");
  });
});
