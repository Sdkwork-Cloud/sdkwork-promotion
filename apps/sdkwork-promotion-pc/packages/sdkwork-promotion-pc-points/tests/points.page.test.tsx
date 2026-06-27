import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPointsHeaderEntry,
  SdkworkPointsPage,
  createSdkworkPointsController,
} from "../src";

describe("sdkwork-promotion-pc-points page", () => {
  it("renders the points center with Sdkwork-style commerce actions and transactions", async () => {
    const controller = createSdkworkPointsController({
      service: {
        getDashboard: vi.fn().mockResolvedValue({
          plans: [
            {
              description: "Best for teams",
              durationDays: 30,
              id: "membership-package-2",
              includedPoints: 5000,
              name: "Pro Monthly",
              packageId: 2,
              priceCny: 199,
              recommended: true,
              tags: ["Popular"],
            },
          ],
          rechargeOffers: [
            {
              description: "Starter offer",
              id: "recharge-package-22",
              points: 5000,
              priceCny: 24,
              recommended: true,
              title: "Growth 5K",
            },
          ],
          summary: {
            balancePoints: 2400,
            currentPlan: {
              level: 3,
              name: "Pro",
              remainingDays: 57,
              status: "active" as const,
              points: 3200,
            },
            earnedThisMonth: 1200,
            isAuthenticated: true,
            pointsToCashRate: 200,
            spentThisMonth: 240,
            totalEarned: 5400,
            totalSpent: 3000,
          },
          transactions: [
            {
              createdAt: "2026-04-02T11:00:00.000Z",
              description: "Image generation",
              direction: "spent" as const,
              id: "transaction-2",
              points: 240,
              status: "completed" as const,
              title: "Points usage",
            },
          ],
        }),
        getEmptyDashboard: vi.fn().mockReturnValue({
          plans: [],
          rechargeOffers: [],
          summary: {
            balancePoints: 0,
            currentPlan: {
              level: null,
              name: "Guest",
              remainingDays: null,
              status: "guest" as const,
              points: null,
            },
            earnedThisMonth: 0,
            isAuthenticated: false,
            pointsToCashRate: null,
            spentThisMonth: 0,
            totalEarned: 0,
            totalSpent: 0,
          },
          transactions: [],
        }),
        getRechargePresets: vi.fn().mockReturnValue([1200, 5000]),
        rechargePoints: vi.fn(),
        upgradePlan: vi.fn(),
      },
    });

    const { container } = render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkPointsPage controller={controller} />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /points center/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /recharge points/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /upgrade membership/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Points usage")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("border-white/10");
    expect(container.innerHTML).not.toContain("bg-white/8");
    expect(container.innerHTML).not.toContain("bg-white/6");
    expect(container.innerHTML).not.toContain("text-white/72");
    expect(container.innerHTML).not.toContain("text-white/65");
    expect(container.innerHTML).not.toContain("text-white/60");
  });

  it("opens the quick panel from the header entry and exposes commerce shortcuts", async () => {
    const controller = createSdkworkPointsController({
      service: {
        getDashboard: vi.fn().mockResolvedValue({
          plans: [],
          rechargeOffers: [],
          summary: {
            balancePoints: 2400,
            currentPlan: {
              level: 3,
              name: "Pro",
              remainingDays: 57,
              status: "active" as const,
              points: 3200,
            },
            earnedThisMonth: 1200,
            isAuthenticated: true,
            pointsToCashRate: 200,
            spentThisMonth: 240,
            totalEarned: 5400,
            totalSpent: 3000,
          },
          transactions: [
            {
              createdAt: "2026-04-02T11:00:00.000Z",
              direction: "spent" as const,
              id: "transaction-2",
              points: 240,
              status: "completed" as const,
              title: "Points usage",
            },
          ],
        }),
        getEmptyDashboard: vi.fn().mockReturnValue({
          plans: [],
          rechargeOffers: [],
          summary: {
            balancePoints: 0,
            currentPlan: {
              level: null,
              name: "Guest",
              remainingDays: null,
              status: "guest" as const,
              points: null,
            },
            earnedThisMonth: 0,
            isAuthenticated: false,
            pointsToCashRate: null,
            spentThisMonth: 0,
            totalEarned: 0,
            totalSpent: 0,
          },
          transactions: [],
        }),
        getRechargePresets: vi.fn().mockReturnValue([1200]),
        rechargePoints: vi.fn(),
        upgradePlan: vi.fn(),
      },
    });

    const { container } = render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkPointsHeaderEntry controller={controller} onOpenPage={vi.fn()} />
      </SdkworkThemeProvider>,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: /points balance/i,
      }),
    );

    expect(await screen.findByText(/recent activity/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", {
        name: /recharge/i,
      }).length,
    ).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain("border-white/10");
    expect(container.innerHTML).not.toContain("bg-white/8");
    expect(container.innerHTML).not.toContain("text-white/70");
    expect(container.innerHTML).not.toContain("text-white/60");
  });
});
