import { describe, expect, it, vi } from "vitest";
import { createSdkworkCouponController } from "../src";

describe("sdkwork-promotion-pc-coupon controller", () => {
  it("bootstraps coupon state, switches tabs, opens detail, and refreshes after redeem", async () => {
    const firstDashboard = {
      availableCoupons: [
        {
          amountCny: 80,
          couponId: "200",
          id: "user-coupon-UC-200",
          name: "Pro Monthly 80",
          remainingDays: 15,
          status: "available" as const,
          type: "cash" as const,
          userCouponId: "UC-200",
        },
      ],
      catalogCoupons: [
        {
          canReceive: true,
          couponId: "200",
          id: "coupon-200",
          name: "Pro Monthly 80",
          pointCost: 800,
          pointsExchange: true,
          status: "available" as const,
          type: "cash" as const,
        },
      ],
      catalogDigest: {
        claimableCoupons: 1,
        pointsExchangeCoupons: 1,
        totalCoupons: 1,
      },
      myCoupons: [
        {
          amountCny: 80,
          couponId: "200",
          id: "user-coupon-UC-200",
          name: "Pro Monthly 80",
          remainingDays: 15,
          status: "available" as const,
          type: "cash" as const,
          userCouponId: "UC-200",
        },
        {
          amountCny: 50,
          couponId: "201",
          id: "user-coupon-UC-201",
          name: "Archive 50",
          remainingDays: 0,
          status: "used" as const,
          type: "cash" as const,
          userCouponId: "UC-201",
        },
      ],
      statistics: {
        expiredCount: 0,
        totalCoupons: 2,
        unusedCount: 1,
        usedCount: 1,
      },
      userDigest: {
        availableCoupons: 1,
        expiringSoonCoupons: 0,
        highestDiscountAmountCny: 80,
        totalCoupons: 2,
      },
    };
    const secondDashboard = {
      ...firstDashboard,
      myCoupons: [
        ...firstDashboard.myCoupons,
        {
          amountCny: 120,
          code: "SPRING120",
          couponId: "202",
          id: "user-coupon-UC-202",
          name: "Annual 120",
          remainingDays: 90,
          status: "available" as const,
          type: "cash" as const,
          userCouponId: "UC-202",
        },
      ],
      statistics: {
        expiredCount: 0,
        totalCoupons: 3,
        unusedCount: 2,
        usedCount: 1,
      },
      userDigest: {
        availableCoupons: 2,
        expiringSoonCoupons: 0,
        highestDiscountAmountCny: 120,
        totalCoupons: 3,
      },
    };
    const service = {
      cancelUseCoupon: vi.fn(),
      exchangeCouponByPoints: vi.fn(),
      getCouponDetail: vi.fn().mockResolvedValue({
        canReceive: true,
        couponId: "200",
        id: "coupon-200",
        name: "Pro Monthly 80",
        pointCost: 800,
        pointsExchange: true,
        status: "available" as const,
        type: "cash" as const,
      }),
      getDashboard: vi
        .fn()
        .mockResolvedValueOnce(firstDashboard)
        .mockResolvedValueOnce(secondDashboard),
      getEmptyDashboard: vi.fn().mockReturnValue({
        availableCoupons: [],
        catalogCoupons: [],
        catalogDigest: {
          claimableCoupons: 0,
          pointsExchangeCoupons: 0,
          totalCoupons: 0,
        },
        myCoupons: [],
        statistics: {
          expiredCount: 0,
          totalCoupons: 0,
          unusedCount: 0,
          usedCount: 0,
        },
        userDigest: {
          availableCoupons: 0,
          expiringSoonCoupons: 0,
          highestDiscountAmountCny: 0,
          totalCoupons: 0,
        },
      }),
      getUserCouponDetail: vi.fn().mockResolvedValue({
        amountCny: 80,
        couponId: "200",
        id: "user-coupon-UC-200",
        name: "Pro Monthly 80",
        status: "available" as const,
        type: "cash" as const,
        userCouponId: "UC-200",
      }),
      receiveCoupon: vi.fn(),
      redeemCoupon: vi.fn().mockResolvedValue({
        amountCny: 120,
        code: "SPRING120",
        couponId: "202",
        id: "user-coupon-UC-202",
        name: "Annual 120",
        status: "available" as const,
        type: "cash" as const,
        userCouponId: "UC-202",
      }),
      rollbackPointsExchange: vi.fn(),
      useCoupon: vi.fn(),
    };

    const controller = createSdkworkCouponController({
      service,
    });

    await controller.bootstrap();
    expect(controller.getState()).toMatchObject({
      activeTab: "discover",
      isBootstrapped: true,
      isLoading: false,
      selectedCatalogCouponId: "coupon-200",
      selectedUserCouponId: "user-coupon-UC-200",
    });

    controller.setTab("history");
    expect(controller.getState().visibleUserCoupons).toHaveLength(1);
    expect(controller.getState().visibleUserCoupons[0]?.id).toBe("user-coupon-UC-201");

    await controller.openUserCouponDetail("UC-200");
    expect(controller.getState()).toMatchObject({
      detailKind: "owned",
      isDetailOpen: true,
      selectedUserCouponId: "user-coupon-UC-200",
    });

    controller.openRedeemDialog();
    expect(controller.getState().isRedeemOpen).toBe(true);

    await controller.redeemCoupon({
      redeemCode: "SPRING120",
    });
    expect(service.redeemCoupon).toHaveBeenCalledWith({
      channel: undefined,
      redeemCode: "SPRING120",
    });
    expect(controller.getState().dashboard.statistics.totalCoupons).toBe(3);
    expect(controller.getState().isRedeemOpen).toBe(false);
  });

  it("uses localized controller fallback messages for zh-CN", async () => {
    const bootstrapController = createSdkworkCouponController({
      locale: "zh-CN",
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockRejectedValue("network-timeout"),
        getEmptyDashboard: vi.fn().mockReturnValue({
          availableCoupons: [],
          catalogCoupons: [],
          catalogDigest: {
            claimableCoupons: 0,
            pointsExchangeCoupons: 0,
            totalCoupons: 0,
          },
          myCoupons: [],
          statistics: {
            expiredCount: 0,
            totalCoupons: 0,
            unusedCount: 0,
            usedCount: 0,
          },
          userDigest: {
            availableCoupons: 0,
            expiringSoonCoupons: 0,
            highestDiscountAmountCny: 0,
            totalCoupons: 0,
          },
        }),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn(),
        redeemCoupon: vi.fn(),
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    await expect(bootstrapController.bootstrap()).rejects.toBe("network-timeout");
    expect(bootstrapController.getState().lastError).toBe("加载优惠券中心失败。");
    await expect(bootstrapController.cancelUseCoupon()).rejects.toThrow("请先选择优惠券。");

    const mutationController = createSdkworkCouponController({
      locale: "zh-CN",
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue({
          availableCoupons: [
            {
              amountCny: 80,
              couponId: "200",
              id: "user-coupon-UC-200",
              name: "Pro Monthly 80",
              remainingDays: 15,
              status: "available" as const,
              type: "cash" as const,
              userCouponId: "UC-200",
            },
          ],
          catalogCoupons: [],
          catalogDigest: {
            claimableCoupons: 0,
            pointsExchangeCoupons: 0,
            totalCoupons: 0,
          },
          myCoupons: [
            {
              amountCny: 80,
              couponId: "200",
              id: "user-coupon-UC-200",
              name: "Pro Monthly 80",
              remainingDays: 15,
              status: "available" as const,
              type: "cash" as const,
              userCouponId: "UC-200",
            },
          ],
          statistics: {
            expiredCount: 0,
            totalCoupons: 1,
            unusedCount: 1,
            usedCount: 0,
          },
          userDigest: {
            availableCoupons: 1,
            expiringSoonCoupons: 0,
            highestDiscountAmountCny: 80,
            totalCoupons: 1,
          },
        }),
        getEmptyDashboard: vi.fn().mockReturnValue({
          availableCoupons: [],
          catalogCoupons: [],
          catalogDigest: {
            claimableCoupons: 0,
            pointsExchangeCoupons: 0,
            totalCoupons: 0,
          },
          myCoupons: [],
          statistics: {
            expiredCount: 0,
            totalCoupons: 0,
            unusedCount: 0,
            usedCount: 0,
          },
          userDigest: {
            availableCoupons: 0,
            expiringSoonCoupons: 0,
            highestDiscountAmountCny: 0,
            totalCoupons: 0,
          },
        }),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn().mockRejectedValue("mutation-timeout"),
        redeemCoupon: vi.fn(),
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    await mutationController.bootstrap();
    await expect(mutationController.receiveCoupon("coupon-200")).rejects.toBe("mutation-timeout");
    expect(mutationController.getState().lastError).toBe("领取优惠券失败。");
  });
});
