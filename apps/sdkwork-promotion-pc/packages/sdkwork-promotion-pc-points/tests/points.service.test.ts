import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureAccountServiceMockSession,
  createAccountAppServiceMock,
  resetAccountServiceMockSession,
} from "../../../../../../sdkwork-account/apps/sdkwork-account-pc/tests/test-utils/account-service-mock";
import {
  configureMembershipServiceMockSession,
  createMembershipAppServiceMock,
  resetMembershipServiceMockSession,
} from "../../../../../../sdkwork-membership/apps/sdkwork-membership-pc/tests/test-utils/membership-service-mock";
import { createSdkworkPointsService } from "../src";

describe("sdkwork-promotion-pc-points service", () => {
  beforeEach(() => {
    configureAccountServiceMockSession({ authToken: "points-token" });
    configureMembershipServiceMockSession({ authToken: "points-token" });
  });

  afterEach(() => {
    resetAccountServiceMockSession();
    resetMembershipServiceMockSession();
  });

  it("maps wallet overview into a reusable points dashboard with transactions, offers, and plans", async () => {
    const service = createSdkworkPointsService({
      now: () => "2026-04-03T09:00:00.000Z",
      walletService: {
        async getOverview() {
          return {
            account: {
              availablePoints: 2400,
              cashAvailable: 66,
              cashFrozen: 0,
              experience: 18,
              frozenPoints: 0,
              hasPayPassword: true,
              level: 2,
              levelName: "Silver",
              status: "ACTIVE",
              statusName: "Active",
              tokenBalance: 8,
              totalEarned: 5400,
              totalPoints: 2400,
              totalSpent: 3000,
            },
            isAuthenticated: true,
            pointsToCashRate: 200,
            rechargePackages: [
              {
                description: "Starter offer",
                id: 11,
                points: 1200,
                priceCny: 6,
                recommended: false,
                sortWeight: 10,
                title: "Starter 1.2K",
              },
              {
                description: "Growth offer",
                id: 22,
                points: 5000,
                priceCny: 24,
                recommended: true,
                sortWeight: 20,
                title: "Growth 5K",
              },
            ],
            transactions: [
              {
                cashAmountCny: 6,
                createdAt: "2026-04-02T11:00:00.000Z",
                id: "transaction-2",
                pointsAfter: 2400,
                pointsBefore: 2640,
                pointsDelta: -240,
                status: "SUCCESS",
                statusName: "Success",
                title: "Image generation",
                transactionType: "POINTS_USAGE",
                transactionTypeName: "Points usage",
              },
              {
                cashAmountCny: 12,
                createdAt: "2026-04-01T08:00:00.000Z",
                id: "transaction-1",
                pointsAfter: 2640,
                pointsBefore: 1440,
                pointsDelta: 1200,
                status: "SUCCESS",
                statusName: "Success",
                title: "Top up points",
                transactionType: "POINTS_RECHARGE",
                transactionTypeName: "Points recharge",
              },
            ],
          };
        },
        rechargePoints: vi.fn().mockResolvedValue({
          cashAmountCny: 12,
          paymentMethod: "WECHAT",
          points: 2400,
          requestNo: "REQ-POINTS-1",
          status: "completed",
          transactionId: "PTX-1",
        }),
      },
      membershipService: {
        getDashboard: vi.fn().mockResolvedValue({
          benefits: [],
          levels: [],
          plans: [
            {
              description: "For personal work",
              durationDays: 30,
              id: "membership-package-1",
              includedPoints: 2000,
              levelName: "Plus",
              name: "Plus Monthly",
              originalPriceCny: 129,
              packageId: 1,
              priceCny: 99,
              recommended: false,
              tags: ["Starter"],
            },
            {
              description: "Best for teams",
              durationDays: 30,
              id: "membership-package-2",
              includedPoints: 5000,
              levelName: "Pro",
              name: "Pro Monthly",
              originalPriceCny: 249,
              packageId: 2,
              priceCny: 199,
              recommended: true,
              tags: ["Popular"],
            },
          ],
          summary: {
            currentLevelName: "Pro",
            currentLevelValue: 3,
            growthValue: 180,
            isAuthenticated: true,
            isMember: true,
            pointBalance: 2400,
            remainingDays: 57,
            status: "active",
            totalSpent: 399,
            upgradeGrowthValue: 500,
            points: 3200,
          },
        }),
        purchaseMembership: vi.fn(),
      },
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.summary).toMatchObject({
      balancePoints: 2400,
      currentPlan: {
        name: "Pro",
        status: "active",
      },
      earnedThisMonth: 1200,
      isAuthenticated: true,
      pointsToCashRate: 200,
      spentThisMonth: 240,
      totalEarned: 5400,
      totalSpent: 3000,
    });
    expect(dashboard.transactions[0]).toMatchObject({
      direction: "spent",
      id: "transaction-2",
      title: "Points usage",
    });
    expect(dashboard.rechargeOffers[0]).toMatchObject({
      id: "recharge-package-22",
      points: 5000,
      recommended: true,
    });
    expect(dashboard.plans[0]).toMatchObject({
      packageId: 2,
      recommended: true,
    });
  });

  it("returns a guest-safe dashboard when the wallet service is not authenticated", async () => {
    const service = createSdkworkPointsService({
      walletService: {
        async getOverview() {
          return {
            account: {
              availablePoints: 0,
              cashAvailable: 0,
              cashFrozen: 0,
              experience: null,
              frozenPoints: 0,
              hasPayPassword: false,
              level: null,
              levelName: undefined,
              status: undefined,
              statusName: undefined,
              tokenBalance: 0,
              totalEarned: 0,
              totalPoints: 0,
              totalSpent: 0,
            },
            isAuthenticated: false,
            pointsToCashRate: null,
            rechargePackages: [],
            transactions: [],
          };
        },
        rechargePoints: vi.fn(),
      },
      membershipService: {
        getDashboard: vi.fn().mockResolvedValue({
          benefits: [],
          levels: [],
          plans: [],
          summary: {
            currentLevelName: "Guest",
            currentLevelValue: null,
            growthValue: null,
            isAuthenticated: false,
            isMember: false,
            pointBalance: null,
            remainingDays: null,
            status: "guest",
            totalSpent: null,
            upgradeGrowthValue: null,
            points: null,
          },
        }),
        purchaseMembership: vi.fn(),
      },
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.summary.isAuthenticated).toBe(false);
    expect(dashboard.summary.balancePoints).toBe(0);
    expect(dashboard.transactions).toEqual([]);
    expect(dashboard.rechargeOffers).toEqual([]);
    expect(dashboard.plans).toEqual([]);
  });

  it("recharges points through wallet and upgrades membership through the membership service", async () => {
    const walletService = {
      getOverview: vi.fn().mockResolvedValue({
        account: {
          availablePoints: 0,
          cashAvailable: 0,
          cashFrozen: 0,
          experience: null,
          frozenPoints: 0,
          hasPayPassword: false,
          level: null,
          levelName: undefined,
          status: undefined,
          statusName: undefined,
          tokenBalance: 0,
          totalEarned: 0,
          totalPoints: 0,
          totalSpent: 0,
        },
        isAuthenticated: true,
        pointsToCashRate: 200,
        rechargePackages: [],
        transactions: [],
      }),
      rechargePoints: vi.fn().mockResolvedValue({
        cashAmountCny: 12,
        paymentMethod: "WECHAT",
        points: 2400,
        requestNo: "REQ-POINTS-2",
        status: "completed",
        transactionId: "PTX-2",
      }),
    };
    const membershipService = {
      getDashboard: vi.fn().mockResolvedValue({
        benefits: [],
        levels: [],
        plans: [],
        summary: {
          currentLevelName: "Free",
          currentLevelValue: null,
          growthValue: null,
          isAuthenticated: true,
          isMember: false,
          pointBalance: null,
          remainingDays: null,
          status: "free",
          totalSpent: null,
          upgradeGrowthValue: null,
          points: null,
        },
      }),
      purchaseMembership: vi.fn().mockResolvedValue({
        amountCny: 199,
        durationDays: 30,
        orderId: "ORDER-POINTS-2",
        packageId: 2,
        packageName: "Pro Monthly",
        status: "completed",
        targetLevelName: "Pro",
      }),
    };
    const service = createSdkworkPointsService({
      membershipService,
      walletService,
    });

    await expect(
      service.rechargePoints({
        paymentMethod: "WECHAT",
        points: 2400,
        remarks: "Workspace top-up",
      }),
    ).resolves.toMatchObject({
      cashAmountCny: 12,
      requestNo: "REQ-POINTS-2",
      status: "completed",
    });

    await expect(
      service.upgradePlan({
        packageId: 2,
        paymentMethod: "ALIPAY",
      }),
    ).resolves.toMatchObject({
      amountCny: 199,
      orderId: "ORDER-POINTS-2",
      packageId: 2,
      status: "completed",
    });

    expect(walletService.rechargePoints).toHaveBeenCalledWith({
      paymentMethod: "WECHAT",
      points: 2400,
      remarks: "Workspace top-up",
    });
    expect(membershipService.purchaseMembership).toHaveBeenCalledWith({
      packageId: 2,
      paymentMethod: "ALIPAY",
    });
  });

  it("propagates injected account and membership services into default wallet and membership boundaries", async () => {
    const rechargePackages = vi.fn().mockResolvedValue({
      code: "2000",
      data: [
        {
          id: 101,
          name: "Studio Credits",
          pointAmount: 1000,
          price: 9.9,
          sortWeight: 1,
        },
      ],
    });
    const membershipPackages = vi.fn().mockResolvedValue({
      code: "2000",
      data: [
        {
          id: 3,
          name: "Pro Monthly",
          pointAmount: 5000,
          price: 59,
          recommended: true,
          durationDays: 30,
        },
      ],
    });
    const walletAppService = createAccountAppServiceMock({
      accounts: {
        current: {
          summary: {
            retrieve: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              cashAvailable: 20,
              pointsAvailable: 1200,
            },
          }),
          },
        },
      },
      wallet: {
        exchangeRate: {
          retrieve: vi.fn().mockResolvedValue({
            code: "2000",
            data: 100,
          }),
        },
        ledgerEntries: {
          points: {
            list: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                content: [],
              },
            }),
          },
        },
        accounts: {
          points: {
          retrieve: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              availablePoints: 1200,
              totalEarned: 1200,
              totalPoints: 1200,
              totalSpent: 0,
            },
          }),
          },
        },
      },
      recharges: {
        packages: {
          list: rechargePackages,
        },
      },
    });
    const membershipAppService = createMembershipAppServiceMock({
      memberships: {
        benefits: {
          list: vi.fn().mockResolvedValue({
            code: "2000",
            data: [],
          }),
        },
        current: {
          retrieve: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              remainingDays: 15,
              planRank: 3,
              planName: "Pro",
              membershipStatus: "ACTIVE",
            },
          }),
          status: {
            retrieve: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                isMember: true,
                pointBalance: 1200,
                planRank: 3,
              },
            }),
          },
        },
        plans: {
          list: vi.fn().mockResolvedValue({
            code: "2000",
            data: [],
          }),
        },
        packages: {
          list: membershipPackages,
        },
      },
    });
    const service = createSdkworkPointsService({
      walletAppService,
      membershipAppService,
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.summary).toMatchObject({
      balancePoints: 1200,
      currentPlan: {
        name: "Pro",
        status: "active",
      },
      isAuthenticated: true,
    });
    expect(dashboard.rechargeOffers[0]).toMatchObject({
      id: "recharge-package-101",
    });
    expect(dashboard.plans[0]).toMatchObject({
      packageId: 3,
    });
    expect(rechargePackages).toHaveBeenCalledOnce();
    expect(membershipPackages).toHaveBeenCalledOnce();
  });

  it("passes locale into the default membership mutation boundary used by plan upgrades", async () => {
    const service = createSdkworkPointsService({
      membershipAppService: createMembershipAppServiceMock({
        memberships: {
          purchases: {
            create: vi.fn().mockResolvedValue({
              code: "5000",
            }),
          },
        },
      }),
      locale: "zh-CN",
    });

    await expect(
      service.upgradePlan({
        packageId: 2,
      }),
    ).rejects.toThrow("\u8d2d\u4e70\u4f1a\u5458\u5931\u8d25\u3002");
  });
});
