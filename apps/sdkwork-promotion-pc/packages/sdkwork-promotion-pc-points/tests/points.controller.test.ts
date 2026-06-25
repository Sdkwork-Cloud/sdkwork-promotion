import { describe, expect, it, vi } from "vitest";
import { createSdkworkPointsController } from "../src";

describe("sdkwork-promotion-pc-points controller", () => {
  it("bootstraps, filters visible transactions, and refreshes after recharge", async () => {
    const firstDashboard = {
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
          title: "Image generation",
        },
        {
          createdAt: "2026-04-01T08:00:00.000Z",
          direction: "earned" as const,
          id: "transaction-1",
          points: 1200,
          status: "completed" as const,
          title: "Top up points",
        },
      ],
    };
    const secondDashboard = {
      ...firstDashboard,
      summary: {
        ...firstDashboard.summary,
        balancePoints: 4800,
      },
    };
    const service = {
      getDashboard: vi
        .fn()
        .mockResolvedValueOnce(firstDashboard)
        .mockResolvedValueOnce(secondDashboard),
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
      rechargePoints: vi.fn().mockResolvedValue({
        points: 2400,
        requestNo: "REQ-CTRL-1",
        status: "completed",
      }),
      upgradePlan: vi.fn(),
    };

    const controller = createSdkworkPointsController({
      service,
    });

    await controller.bootstrap();
    expect(controller.getState()).toMatchObject({
      activeFilter: "all",
      isBootstrapped: true,
      isLoading: false,
    });
    expect(controller.getState().visibleTransactions).toHaveLength(2);

    controller.setFilter("earned");
    expect(controller.getState().visibleTransactions).toHaveLength(1);
    expect(controller.getState().visibleTransactions[0]?.id).toBe("transaction-1");

    controller.openRecharge();
    await controller.rechargePoints({
      paymentMethod: "WECHAT",
      points: 2400,
    });

    expect(service.rechargePoints).toHaveBeenCalledWith({
      paymentMethod: "WECHAT",
      points: 2400,
    });
    expect(service.getDashboard).toHaveBeenCalledTimes(2);
    expect(controller.getState().isRechargeOpen).toBe(false);
    expect(controller.getState().dashboard.summary.balancePoints).toBe(4800);
  });
});
