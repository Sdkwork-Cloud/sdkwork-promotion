import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkPointsIntlProvider,
  SdkworkPointsPage,
  SdkworkPointsQuickPanel,
  createSdkworkPointsController,
  formatPointsRate,
} from "../src";

function createDashboard() {
  return {
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
  };
}

function createEmptyDashboard() {
  return {
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
  };
}

function createController() {
  return createSdkworkPointsController({
    service: {
      getDashboard: vi.fn().mockResolvedValue(createDashboard()),
      getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
      getRechargePresets: vi.fn().mockReturnValue([1200, 5000]),
      rechargePoints: vi.fn(),
      upgradePlan: vi.fn(),
    },
  });
}

describe("sdkwork-promotion-pc-points intl", () => {
  it("renders Chinese copy across the points page when a Chinese locale is provided", async () => {
    const PointsPage = SdkworkPointsPage;
    const controller = createController();

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PointsPage controller={controller} locale="zh-CN" />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "积分中心",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "充值积分" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "升级会员" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "积分流水" })).toBeInTheDocument();
    expect(formatPointsRate(200, "zh-CN")).toBe("200 积分 / 1 元");
  });

  it("applies host message overrides on top of the localized points seam", async () => {
    const PointsPage = SdkworkPointsPage;
    const controller = createController();

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PointsPage
          controller={controller}
          locale="zh-CN"
          messages={{
            page: {
              primaryAction: "Launch recharge",
              title: "Host points cockpit",
            },
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Host points cockpit",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch recharge" })).toBeInTheDocument();
  });

  it("falls back to built-in English copy for standalone points components without a host intl provider", () => {
    const PointsQuickPanel = SdkworkPointsQuickPanel;
    const dashboard = createDashboard();

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <PointsQuickPanel
          onOpenPage={vi.fn()}
          onRecharge={vi.fn()}
          onUpgrade={vi.fn()}
          recentTransactions={dashboard.transactions}
          summary={dashboard.summary}
        />
      </SdkworkThemeProvider>,
    );

    expect(screen.getByText("Available points")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open center/i })).toBeInTheDocument();
    expect(formatPointsRate(200, "en-US")).toBe("200 pts / CNY 1");
  });

  it("lets standalone points components consume Chinese copy through the intl provider", () => {
    const PointsIntlProvider = SdkworkPointsIntlProvider;
    const PointsQuickPanel = SdkworkPointsQuickPanel;
    const dashboard = createDashboard();

    expect(PointsIntlProvider).toBeTypeOf("function");

    if (typeof PointsIntlProvider !== "function") {
      return;
    }

    const { container } = render(
      <SdkworkThemeProvider defaultTheme="light">
        <PointsIntlProvider locale="zh-CN">
          <PointsQuickPanel
            onOpenPage={vi.fn()}
            onRecharge={vi.fn()}
            onUpgrade={vi.fn()}
            recentTransactions={dashboard.transactions}
            summary={dashboard.summary}
          />
        </PointsIntlProvider>
      </SdkworkThemeProvider>,
    );

    expect(screen.getAllByText("可用积分").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "打开中心" })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("bg-white/8");
    expect(container.innerHTML).not.toContain("border-white/10");
    expect(container.innerHTML).not.toContain("text-white/70");
    expect(container.innerHTML).not.toContain("text-white/60");
  });
});
