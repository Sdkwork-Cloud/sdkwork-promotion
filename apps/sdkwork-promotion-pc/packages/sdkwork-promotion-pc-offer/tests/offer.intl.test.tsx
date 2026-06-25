import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  SdkworkOfferIntlProvider,
  SdkworkOfferPage,
  useSdkworkOfferIntl,
} from "../src";

function createOfferService() {
  return {
    getEmptyDashboard: vi.fn().mockReturnValue({
      digest: {
        couponOffers: 0,
        featuredOffers: 0,
        highlightedSavingsCny: 0,
        membershipOffers: 0,
        rechargeOffers: 0,
      },
      featuredOffers: [],
      inventory: {
        availableCoupons: 0,
        availablePoints: 0,
        claimableCoupons: 0,
        currentLevelName: "Guest",
        expiringSoonCoupons: 0,
        isAuthenticated: false,
        membershipRemainingDays: null,
      },
    }),
    getDashboard: vi.fn().mockResolvedValue({
      digest: {
        couponOffers: 1,
        featuredOffers: 3,
        highlightedSavingsCny: 300,
        membershipOffers: 1,
        rechargeOffers: 1,
      },
      featuredOffers: [
        {
          action: {
            capability: "subscription" as const,
            label: "Open renewal",
            route: "/subscription?mode=renew&packageId=3",
          },
          description: "Annual membership package",
          estimatedSavingsCny: 300,
          group: "membership" as const,
          id: "offer-membership-3",
          kind: "membership-renewal" as const,
          priceCny: 699,
          recommended: true,
          tags: ["Annual"],
          title: "Pro Annual",
        },
        {
          action: {
            capability: "coupon" as const,
            label: "Open coupon center",
            route: "/coupons?tab=discover&couponId=200",
          },
          description: "Claimable launch discount",
          estimatedSavingsCny: 120,
          group: "coupon" as const,
          id: "offer-coupon-claim-200",
          kind: "coupon-claim" as const,
          priceCny: 0,
          recommended: true,
          tags: ["Claimable"],
          title: "Launch 120",
        },
      ],
      inventory: {
        availableCoupons: 1,
        availablePoints: 2400,
        claimableCoupons: 1,
        currentLevelName: "Pro",
        expiringSoonCoupons: 1,
        isAuthenticated: true,
        membershipRemainingDays: 18,
      },
    }),
  };
}

function OfferIntlProbe() {
  const { copy, formatFilterLabel } = useSdkworkOfferIntl();

  return (
    <div>
      <span>{copy.page.title}</span>
      <span>{formatFilterLabel("coupon")}</span>
    </div>
  );
}

describe("sdkwork-promotion-pc-offer intl", () => {
  it("exposes the exported intl provider and hook seam from the package root", () => {
    render(
      <SdkworkOfferIntlProvider
        messages={{
          filters: {
            coupon: "Coupon picks",
          },
          page: {
            title: "Offer cockpit",
          },
        }}
      >
        <OfferIntlProbe />
      </SdkworkOfferIntlProvider>,
    );

    expect(screen.getByText("Offer cockpit")).toBeInTheDocument();
    expect(screen.getByText("Coupon picks")).toBeInTheDocument();
  });

  it("renders Chinese offer copy when the page receives a Chinese locale", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkOfferPage locale="zh-CN" service={createOfferService()} />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "优惠中心",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("精选方案")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "会员" })).toBeInTheDocument();
    expect(screen.getAllByText("已选方案").length).toBeGreaterThan(0);
  });

  it("applies host message overrides on top of the localized offer copy seam", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkOfferPage
          locale="zh-CN"
          messages={{
            filters: {
              coupon: "领券推荐",
            },
            page: {
              title: "商业驾驶舱",
            },
          }}
          service={createOfferService()}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "商业驾驶舱",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "领券推荐" })).toBeInTheDocument();
    expect(screen.getAllByText("已选方案").length).toBeGreaterThan(0);
  });
});
