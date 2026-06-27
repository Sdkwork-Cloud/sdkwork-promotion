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
  SdkworkCouponIntlProvider,
  SdkworkCouponRedeemDialog,
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

describe("sdkwork-promotion-pc-coupon redeem dialog", () => {
  it("renders Chinese redeem copy and submits a trimmed redeem code", async () => {
    const redeemCoupon = vi.fn().mockResolvedValue({
      amountCny: 120,
      available: true,
      couponId: "202",
      id: "user-coupon-UC-202",
      minimumSpendCny: 0,
      name: "Annual 120",
      pointCost: 0,
      pointsRefunded: false,
      remainingDays: 30,
      status: "available" as const,
      type: "cash" as const,
      userCouponId: "UC-202",
    });
    const controller = createSdkworkCouponController({
      initialState: {
        dashboard: createEmptyDashboard(),
        isBootstrapped: true,
        isRedeemOpen: true,
      },
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue(createEmptyDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn(),
        redeemCoupon,
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponIntlProvider locale="zh-CN">
          <SdkworkCouponRedeemDialog controller={controller} />
        </SdkworkCouponIntlProvider>
      </SdkworkThemeProvider>,
    );

    const dialog = await screen.findByRole("dialog", { name: "兑换优惠券" });
    const submitButton = within(dialog).getByRole("button", { name: "兑换优惠券" });

    expect(within(dialog).getByText("兑换券码后，优惠会立刻加入你的待用库存。")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText("券码"), {
      target: {
        value: " SPRING120 ",
      },
    });

    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(redeemCoupon).toHaveBeenCalledWith({
        redeemCode: "SPRING120",
      });
    });
    await waitFor(() => {
      expect(controller.getState().isRedeemOpen).toBe(false);
    });
  });

  it("renders the localized redeem error surface when the controller exposes a redeem failure", async () => {
    const controller = createSdkworkCouponController({
      initialState: {
        dashboard: createEmptyDashboard(),
        isBootstrapped: true,
        isRedeemOpen: true,
        lastError: "券码已失效",
      },
      service: {
        getDashboard: vi.fn().mockResolvedValue(createEmptyDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponIntlProvider locale="zh-CN">
          <SdkworkCouponRedeemDialog controller={controller} />
        </SdkworkCouponIntlProvider>
      </SdkworkThemeProvider>,
    );

    const dialog = await screen.findByRole("dialog", { name: "兑换优惠券" });
    expect(within(dialog).getByText("兑换优惠券异常")).toBeInTheDocument();
    expect(within(dialog).getByText("券码已失效")).toBeInTheDocument();
  });
});
