import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  createSdkworkCouponController,
  SdkworkCouponIntlProvider,
  SdkworkCouponPage,
  SdkworkCouponStatGrid,
} from "../src";

function createCouponDashboard() {
  return {
    availableCoupons: [
      {
        amountCny: 80,
        code: "PRO80",
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
        amountCny: 80,
        canReceive: true,
        couponId: "200",
        description: "New user commercial discount",
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
        code: "PRO80",
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
  };
}

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

describe("sdkwork-promotion-pc-coupon intl", () => {
  it("renders Chinese copy across the coupon page when a Chinese locale is provided", async () => {
    const controller = createSdkworkCouponController({
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue(createCouponDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn(),
        redeemCoupon: vi.fn(),
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponPage controller={controller} locale="zh-CN" />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "优惠券中心",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "兑换优惠券" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "优惠券库存",
      }).length,
    ).toBeGreaterThan(0);
  });

  it("applies host message overrides on top of the localized coupon copy seam", async () => {
    const controller = createSdkworkCouponController({
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn(),
        getDashboard: vi.fn().mockResolvedValue(createCouponDashboard()),
        getEmptyDashboard: vi.fn().mockReturnValue(createEmptyDashboard()),
        getUserCouponDetail: vi.fn(),
        receiveCoupon: vi.fn(),
        redeemCoupon: vi.fn(),
        rollbackPointsExchange: vi.fn(),
        useCoupon: vi.fn(),
      },
    });

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponPage
          controller={controller}
          locale="zh-CN"
          messages={{
            actions: {
              redeemCode: "Launch redeem",
            },
            format: {
              pointCostValue: "pts::{value}",
            },
            inventory: {
              pointCostLabel: "Cost",
            },
            page: {
              title: "Host coupon cockpit",
            },
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Host coupon cockpit",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Launch redeem" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "优惠券库存",
      }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("Cost: pts::800")).toBeInTheDocument();
  });

  it("falls back to built-in English copy for standalone components without a host intl provider", () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponStatGrid
          catalogDigest={{
            claimableCoupons: 1,
            pointsExchangeCoupons: 1,
            totalCoupons: 2,
          }}
          statistics={{
            expiredCount: 1,
            totalCoupons: 4,
            unusedCount: 2,
            usedCount: 1,
          }}
          userDigest={{
            availableCoupons: 2,
            expiringSoonCoupons: 1,
            highestDiscountAmountCny: 80,
            totalCoupons: 4,
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(screen.getByText("Available coupons")).toBeInTheDocument();
    expect(screen.getByText("Highest discount")).toBeInTheDocument();
  });

  it("lets standalone coupon components consume Chinese copy through the intl provider", () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponIntlProvider locale="zh-CN">
          <SdkworkCouponStatGrid
            catalogDigest={{
              claimableCoupons: 1,
              pointsExchangeCoupons: 1,
              totalCoupons: 2,
            }}
            statistics={{
              expiredCount: 1,
              totalCoupons: 4,
              unusedCount: 2,
              usedCount: 1,
            }}
            userDigest={{
              availableCoupons: 2,
              expiringSoonCoupons: 1,
              highestDiscountAmountCny: 80,
              totalCoupons: 4,
            }}
          />
        </SdkworkCouponIntlProvider>
      </SdkworkThemeProvider>,
    );

    expect(screen.getAllByText("可用优惠券").length).toBeGreaterThan(0);
    expect(screen.getByText("总库存")).toBeInTheDocument();
  });
});
