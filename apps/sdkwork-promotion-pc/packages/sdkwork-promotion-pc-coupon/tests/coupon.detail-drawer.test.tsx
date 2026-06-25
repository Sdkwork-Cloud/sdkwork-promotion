import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  createSdkworkCouponController,
  SdkworkCouponDetailDrawer,
  SdkworkCouponIntlProvider,
} from "../src";

function createEmptyDashboard() {
  return {
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
  };
}

describe("sdkwork-promotion-pc-coupon detail drawer", () => {
  it("renders localized owned coupon metrics, timestamps, and operational labels", async () => {
    const cancelUseCoupon = vi.fn().mockResolvedValue({
      amountCny: 80,
      available: true,
      couponId: "200",
      id: "user-coupon-UC-200",
      minimumSpendCny: 299,
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsRefunded: false,
      remainingDays: 5,
      status: "available" as const,
      type: "points-exchange" as const,
      userCouponId: "UC-200",
    });
    const rollbackPointsExchange = vi.fn().mockResolvedValue({
      amountCny: 80,
      available: false,
      couponId: "200",
      id: "user-coupon-UC-200",
      minimumSpendCny: 299,
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsRefunded: true,
      remainingDays: 5,
      status: "used" as const,
      type: "points-exchange" as const,
      userCouponId: "UC-200",
    });
    const detail = {
      acquireAt: "2026-01-01T08:00:00.000Z",
      amountCny: 80,
      available: false,
      couponId: "200",
      expireAt: "2026-02-01T08:00:00.000Z",
      id: "user-coupon-UC-200",
      minimumSpendCny: 299,
      name: "Pro Monthly 80",
      orderId: "ORDER-200",
      pointCost: 800,
      pointsRefunded: false,
      remainingDays: 5,
      status: "used" as const,
      type: "points-exchange" as const,
      useAt: "2026-01-02T03:04:00.000Z",
      userCouponId: "UC-200",
    };
    const controller = createSdkworkCouponController({
      initialState: {
        dashboard: createEmptyDashboard(),
        detail,
        detailKind: "owned",
        isBootstrapped: true,
        isDetailOpen: true,
      },
      service: {
        cancelUseCoupon,
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue(createEmptyDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn(),
        redeemCoupon: vi.fn(),
        rollbackPointsExchange,
        useCoupon: vi.fn(),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponIntlProvider locale="zh-CN">
          <SdkworkCouponDetailDrawer controller={controller} />
        </SdkworkCouponIntlProvider>
      </SdkworkThemeProvider>,
    );

    const drawer = await screen.findByRole("dialog", { name: "优惠券详情" });
    const expectedUseAt = new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date("2026-01-02T03:04:00.000Z"));

    expect(within(drawer).getByText("使用信息")).toBeInTheDocument();
    expect(within(drawer).getByText("是否可用: 否")).toBeInTheDocument();
    expect(within(drawer).getByText("剩余天数: 5 天")).toBeInTheDocument();
    expect(within(drawer).getByText(`使用时间: ${expectedUseAt}`)).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "取消使用" })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "退回积分" })).toBeInTheDocument();
    expect(
      within(drawer).getByText("状态").closest("[data-sdk-pattern='detail-drawer-metric']"),
    ).toHaveAttribute("data-tone", "warning");

    fireEvent.click(within(drawer).getByRole("button", { name: "取消使用" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "退回积分" }));

    await waitFor(() => {
      expect(cancelUseCoupon).toHaveBeenCalledWith("UC-200");
    });
    await waitFor(() => {
      expect(rollbackPointsExchange).toHaveBeenCalledWith({
        reason: undefined,
        userCouponId: "UC-200",
      });
    });
  });

  it("renders localized catalog actions and forwards claim and points exchange requests", async () => {
    const exchangeCouponByPoints = vi.fn().mockResolvedValue({
      amountCny: 80,
      available: true,
      couponId: "200",
      id: "user-coupon-UC-200",
      minimumSpendCny: 0,
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsRefunded: false,
      remainingDays: 30,
      status: "available" as const,
      type: "cash" as const,
      userCouponId: "UC-200",
    });
    const receiveCoupon = vi.fn().mockResolvedValue({
      amountCny: 80,
      available: true,
      couponId: "200",
      id: "user-coupon-UC-200",
      minimumSpendCny: 0,
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsRefunded: false,
      remainingDays: 30,
      status: "available" as const,
      type: "cash" as const,
      userCouponId: "UC-200",
    });
    const detail = {
      amountCny: 80,
      canReceive: true,
      couponId: "200",
      description: "New user commercial discount",
      discountRate: null,
      endTime: "2026-02-01T08:00:00.000Z",
      getLimit: 1,
      id: "coupon-200",
      minimumSpendCny: 0,
      name: "Pro Monthly 80",
      pointCost: 800,
      pointsExchange: true,
      receivedCount: 12,
      remainingCount: 88,
      stackable: true,
      startTime: "2026-01-01T08:00:00.000Z",
      status: "available" as const,
      total: 100,
      type: "cash" as const,
      usedCount: 8,
    };
    const controller = createSdkworkCouponController({
      initialState: {
        dashboard: createEmptyDashboard(),
        detail,
        detailKind: "catalog",
        isBootstrapped: true,
        isDetailOpen: true,
      },
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints,
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue(createEmptyDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
        getUserCouponDetail: vi.fn(),
        receiveCoupon,
        redeemCoupon: vi.fn(),
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponIntlProvider locale="zh-CN">
          <SdkworkCouponDetailDrawer controller={controller} />
        </SdkworkCouponIntlProvider>
      </SdkworkThemeProvider>,
    );

    const drawer = await screen.findByRole("dialog", { name: "优惠券详情" });

    expect(within(drawer).getByText("概览")).toBeInTheDocument();
    expect(within(drawer).getByText("是否可叠加: 是")).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "领取优惠券" })).toBeInTheDocument();
    expect(within(drawer).getByRole("button", { name: "积分兑换" })).toBeInTheDocument();

    fireEvent.click(within(drawer).getByRole("button", { name: "领取优惠券" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "积分兑换" }));

    await waitFor(() => {
      expect(receiveCoupon).toHaveBeenCalledWith("200");
    });
    await waitFor(() => {
      expect(exchangeCouponByPoints).toHaveBeenCalledWith({
        couponId: "200",
      });
    });
  });
});
