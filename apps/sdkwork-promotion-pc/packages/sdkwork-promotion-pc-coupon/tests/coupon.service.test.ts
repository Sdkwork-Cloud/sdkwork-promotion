import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  configurePromotionServiceMockSession,
  createPromotionAppServiceMock,
  resetPromotionServiceMockSession,
} from "../../../tests/test-utils/promotion-service-mock";
import { createSdkworkCouponService } from "../src";

describe("sdkwork-promotion-pc-coupon service", () => {
  beforeEach(() => {
    configurePromotionServiceMockSession({ authToken: "coupon-auth-token" });
  });

  afterEach(() => {
    resetPromotionServiceMockSession();
  });

  it("maps coupon catalog, owned coupons, and statistics into a reusable coupon dashboard", async () => {
    const service = createSdkworkCouponService({
      promotionAppService: createPromotionAppServiceMock({
        promotions: {
          offers: {
            list: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                content: [
                  {
                    amount: 80,
                    canReceive: true,
                    couponId: "200",
                    description: "New user commercial discount",
                    getLimit: 1,
                    minConsume: 199,
                    name: "Pro Monthly 80",
                    pointCost: 800,
                    pointsExchange: true,
                    remainingCount: 12,
                    stackable: true,
                    status: "UNUSED",
                    statusName: "Available",
                    total: 100,
                    type: "CASH",
                    typeName: "Cash",
                    usedCount: 20,
                  },
                ],
              },
            }),
          },
          userCoupons: {
            wallet: {
              list: vi.fn((params?: Record<string, unknown>) =>
                Promise.resolve({
                  code: "2000",
                  data: {
                    content: params?.status === "available"
                      ? [
                          {
                            acquireAt: "2026-04-03T10:00:00.000Z",
                            amount: 80,
                            available: true,
                            couponCode: "PRO80",
                            couponId: "200",
                            couponName: "Pro Monthly 80",
                            expireAt: "2026-04-18T00:00:00.000Z",
                            minConsume: 199,
                            remainingDays: 15,
                            scopeType: "capability",
                            scopeValue: "subscription",
                            status: "UNUSED",
                            statusName: "Available",
                            type: "CASH",
                            typeName: "Cash",
                            userCouponId: "UC-200",
                          },
                        ]
                      : [
                          {
                            acquireAt: "2026-04-03T10:00:00.000Z",
                            amount: 80,
                            available: true,
                            couponCode: "PRO80",
                            couponId: "200",
                            couponName: "Pro Monthly 80",
                            expireAt: "2026-04-18T00:00:00.000Z",
                            minConsume: 199,
                            pointCost: 800,
                            remainingDays: 15,
                            scopeType: "capability",
                            scopeValue: "subscription",
                            status: "UNUSED",
                            statusName: "Available",
                            type: "CASH",
                            typeName: "Cash",
                            userCouponId: "UC-200",
                          },
                          {
                            acquireAt: "2026-03-02T10:00:00.000Z",
                            available: false,
                            couponCode: "OLD50",
                            couponId: "201",
                            couponName: "Archive 50",
                            expireAt: "2026-03-15T00:00:00.000Z",
                            minConsume: 99,
                            remainingDays: 0,
                            status: "USED",
                            statusName: "Used",
                            type: "CASH",
                            typeName: "Cash",
                            useAt: "2026-03-03T00:00:00.000Z",
                            userCouponId: "UC-201",
                          },
                        ],
                  },
                }),
              ),
            },
          },
        },
      }),
    });

    const dashboard = await service.getDashboard();

    expect(dashboard.catalogCoupons[0]).toMatchObject({
      canReceive: true,
      couponId: "200",
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsExchange: true,
      status: "available",
      type: "cash",
    });
    expect(dashboard.availableCoupons[0]).toMatchObject({
      amountCny: 80,
      couponId: "200",
      id: "user-coupon-UC-200",
      pointCost: 800,
      scopeType: "capability",
      scopeValue: "subscription",
      status: "available",
      type: "cash",
      userCouponId: "UC-200",
    });
    expect(dashboard.statistics).toEqual({
      expiredCount: 0,
      totalCoupons: 2,
      unusedCount: 1,
      usedCount: 1,
    });
    expect(dashboard.catalogDigest.claimableCoupons).toBe(1);
    expect(dashboard.userDigest).toEqual({
      availableCoupons: 1,
      expiringSoonCoupons: 0,
      highestDiscountAmountCny: 80,
      totalCoupons: 2,
    });
  });

  it("returns a guest-safe coupon dashboard when there is no authenticated session", async () => {
    resetPromotionServiceMockSession();
    const service = createSdkworkCouponService();

    const dashboard = await service.getDashboard();

    expect(dashboard.catalogCoupons).toEqual([]);
    expect(dashboard.myCoupons).toEqual([]);
    expect(dashboard.availableCoupons).toEqual([]);
    expect(dashboard.statistics.totalCoupons).toBe(0);
  });

  it("routes coupon mutations and detail lookups through the commerce service boundary", async () => {
    const promotionAppService = createPromotionAppServiceMock({
      promotions: {
        offers: {
          retrieve: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              amount: 80,
              canReceive: true,
              couponId: "200",
              name: "Pro Monthly 80",
              status: "UNUSED",
              type: "CASH",
            },
          }),
        },
        userCoupons: {
          claims: {
            create: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                couponId: "200",
                couponName: "Pro Monthly 80",
                pointCost: 800,
                status: "UNUSED",
                userCouponId: "UC-200",
              },
            }),
          },
          wallet: {
            retrieve: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                amount: 80,
                couponId: "200",
                couponName: "Pro Monthly 80",
                status: "UNUSED",
                userCouponId: "UC-200",
              },
            }),
          },
        },
        codes: {
          redemptions: {
            create: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              couponCode: "SPRING80",
              couponId: "200",
              couponName: "Pro Monthly 80",
              status: "UNUSED",
              userCouponId: "UC-200",
            },
          }),
          },
        },
        discountApplications: {
          create: vi.fn().mockResolvedValue({
            code: "2000",
            data: {
              couponId: "200",
              couponName: "Pro Monthly 80",
              orderId: "ORDER-9",
              status: "USED",
              userCouponId: "UC-200",
            },
          }),
          reversals: {
            create: vi.fn().mockResolvedValue({
              code: "2000",
              data: {
                couponId: "200",
                couponName: "Pro Monthly 80",
                status: "UNUSED",
                userCouponId: "UC-200",
              },
            }),
          },
        },
      },
    });
    const service = createSdkworkCouponService({
      promotionAppService,
    });

    await expect(service.receiveCoupon("200")).resolves.toMatchObject({
      couponId: "200",
      status: "available",
      userCouponId: "UC-200",
    });
    await expect(service.redeemCoupon({ redeemCode: "SPRING80" })).resolves.toMatchObject({
      code: "SPRING80",
      couponId: "200",
    });
    await expect(service.exchangeCouponByPoints({ couponId: "200" })).resolves.toMatchObject({
      couponId: "200",
      pointCost: 800,
    });
    await expect(service.useCoupon({ orderId: "ORDER-9", userCouponId: "UC-200" })).resolves.toMatchObject({
      orderId: "ORDER-9",
      status: "used",
    });
    await expect(service.cancelUseCoupon("UC-200")).resolves.toMatchObject({
      couponId: "200",
      status: "available",
    });
    await expect(service.rollbackPointsExchange({ reason: "duplicate", userCouponId: "UC-200" })).resolves.toMatchObject({
      couponId: "200",
    });
    await expect(service.getCouponDetail("200")).resolves.toMatchObject({
      couponId: "200",
      status: "available",
      type: "cash",
    });
    await expect(service.getUserCouponDetail("UC-200")).resolves.toMatchObject({
      couponId: "200",
      status: "available",
      userCouponId: "UC-200",
    });

    expect(promotionAppService.promotions.codes.redemptions.create).toHaveBeenCalledWith({
      channel: undefined,
      code: "SPRING80",
    });
    expect(promotionAppService.promotions.userCoupons.claims.create).toHaveBeenCalledWith(
      expect.objectContaining({
        offerId: "200",
        requestNo: expect.any(String),
        sourceType: "points_exchange",
      }),
    );
    expect(promotionAppService.promotions.discountApplications.create).toHaveBeenCalledWith({
      orderId: "ORDER-9",
      userCouponId: "UC-200",
    });
    expect(promotionAppService.promotions.discountApplications.reversals.create).toHaveBeenCalledWith({
      reason: "duplicate",
      userCouponId: "UC-200",
    });
  });

  it("uses localized service errors for zh-CN mutations", async () => {
    resetPromotionServiceMockSession();
    const service = createSdkworkCouponService({
      locale: "zh-CN",
    });

    await expect(service.redeemCoupon({ redeemCode: "SPRING80" })).rejects.toThrow();
  });
});
