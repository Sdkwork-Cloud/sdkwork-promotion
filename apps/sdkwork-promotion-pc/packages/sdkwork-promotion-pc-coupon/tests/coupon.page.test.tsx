import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  createSdkworkCouponController,
  SdkworkCouponPage,
} from "../src";

describe("sdkwork-promotion-pc-coupon page", () => {
  it("renders the coupon center with redeem dialog and detail drawer flows", async () => {
    const controller = createSdkworkCouponController({
      service: {
        cancelUseCoupon: vi.fn(),
        exchangeCouponByPoints: vi.fn(),
        getCouponDetail: vi.fn().mockResolvedValue({
          canReceive: true,
          couponId: "200",
          description: "New user commercial discount",
          id: "coupon-200",
          name: "Pro Monthly 80",
          pointCost: 800,
          pointsExchange: true,
          status: "available" as const,
          type: "cash" as const,
        }),
        getDashboard: vi.fn().mockResolvedValue({
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
            {
              amountCny: 50,
              code: "USED50",
              couponId: "201",
              id: "user-coupon-UC-201",
              name: "Starter 50",
              remainingDays: 0,
              status: "used" as const,
              type: "cash" as const,
              userCouponId: "UC-201",
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
        getUserCouponDetail: vi.fn().mockResolvedValue({
          amountCny: 80,
          code: "PRO80",
          couponId: "200",
          id: "user-coupon-UC-200",
          name: "Pro Monthly 80",
          status: "available" as const,
          type: "cash" as const,
          userCouponId: "UC-200",
        }),
        receiveCoupon: vi.fn().mockResolvedValue({
          couponId: "200",
          id: "user-coupon-UC-200",
          name: "Pro Monthly 80",
          status: "available" as const,
          type: "cash" as const,
          userCouponId: "UC-200",
        }),
        redeemCoupon: vi.fn().mockResolvedValue({
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
      },
    });

    const { container } = render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkCouponPage controller={controller} />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /coupon center/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Pro Monthly 80")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("button", {
        name: /history/i,
      }),
    );
    const historyCard = (await screen.findByText("Starter 50")).closest("article");
    expect(historyCard).not.toBeNull();
    expect(within(historyCard as HTMLElement).getByText("Used")).toHaveAttribute("data-sdk-tone", "warning");

    fireEvent.click(
      screen.getByRole("button", {
        name: /discover/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /redeem coupon/i,
      }),
    );
    const redeemDialog = await screen.findByRole("dialog", {
      name: /redeem coupon/i,
    });
    fireEvent.change(
      within(redeemDialog).getByLabelText(/coupon code/i),
      {
        target: {
          value: "SPRING120",
        },
      },
    );
    fireEvent.click(
      within(redeemDialog).getByRole("button", {
        name: /redeem coupon/i,
      }),
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: /view details/i,
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: /coupon detail/i,
      }),
    ).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("text-white/72");
    expect(container.innerHTML).not.toContain("text-white/65");
  });
});
