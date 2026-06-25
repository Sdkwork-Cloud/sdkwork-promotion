import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SdkworkThemeProvider } from "@sdkwork/ui-pc-react/theme";
import {
  resetPromotionServiceMockSession,
} from "../../../tests/test-utils/promotion-service-mock";
import {
  SdkworkOfferPage,
  createSdkworkOfferBackdropStyle,
  createSdkworkOfferHeroStyle,
  createSdkworkOfferPanelStyle,
} from "../src";

describe("sdkwork-promotion-pc-offer page", () => {
  afterEach(() => {
    cleanup();
    resetPromotionServiceMockSession();
  });

  it("renders the offer center, filters offers, and routes the selected offer through onNavigate", async () => {
    const onNavigate = vi.fn();
    const service = {
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
              capability: "subscription",
              label: "Open renewal",
              route: "/subscription?mode=renew&packageId=3",
            },
            description: "Annual membership package",
            estimatedSavingsCny: 300,
            group: "membership",
            id: "offer-membership-3",
            kind: "membership-renewal",
            priceCny: 699,
            recommended: true,
            tags: ["Annual"],
            title: "Pro Annual",
          },
          {
            action: {
              capability: "coupon",
              label: "Open coupon center",
              route: "/coupons?tab=discover&couponId=200",
            },
            description: "Claimable launch discount",
            estimatedSavingsCny: 120,
            group: "coupon",
            id: "offer-coupon-claim-200",
            kind: "coupon-claim",
            priceCny: 0,
            recommended: true,
            tags: ["Claimable"],
            title: "Launch 120",
          },
          {
            action: {
              capability: "points",
              label: "Open recharge",
              route: "/points?section=recharge",
            },
            description: "Recharge points for premium workflows",
            estimatedSavingsCny: 12,
            group: "recharge",
            id: "offer-recharge-recharge-pack-2",
            kind: "points-recharge",
            priceCny: 38,
            recommended: false,
            tags: ["Points"],
            title: "5000 Points",
          },
        ],
        inventory: {
          availableCoupons: 1,
          availablePoints: 2400,
          claimableCoupons: 1,
          currentLevelName: "Pro",
          isAuthenticated: true,
          membershipRemainingDays: 18,
        },
      }),
    };

    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkOfferPage onNavigate={onNavigate} service={service} />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /offer center/i,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Pro Annual",
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", {
        name: /pro annual/i,
      }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /coupon/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /launch 120/i,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /open coupon center/i,
      }),
    );

    expect(onNavigate).toHaveBeenCalledWith("/coupons?tab=discover&couponId=200");
  });

  it("uses offer appearance seam helpers for backdrop, hero, and selected offer cards", async () => {
    const onNavigate = vi.fn();
    const service = {
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
              capability: "subscription",
              label: "Open renewal",
              route: "/subscription?mode=renew&packageId=3",
            },
            description: "Annual membership package",
            estimatedSavingsCny: 300,
            group: "membership",
            id: "offer-membership-3",
            kind: "membership-renewal",
            priceCny: 699,
            recommended: true,
            tags: ["Annual"],
            title: "Pro Annual",
          },
          {
            action: {
              capability: "coupon",
              label: "Open coupon center",
              route: "/coupons?tab=discover&couponId=200",
            },
            description: "Claimable launch discount",
            estimatedSavingsCny: 120,
            group: "coupon",
            id: "offer-coupon-claim-200",
            kind: "coupon-claim",
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
          isAuthenticated: true,
          membershipRemainingDays: 18,
        },
      }),
    };

    const { container } = render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkOfferPage onNavigate={onNavigate} service={service} />
      </SdkworkThemeProvider>,
    );

    await screen.findByRole("heading", {
      name: /offer center/i,
    });

    const halo = container.querySelector(".pointer-events-none") as HTMLDivElement | null;
    const hero = container.querySelector(".mx-auto section > div") as HTMLDivElement | null;
    const selectedOffer = await screen.findByRole("button", {
      name: /pro annual/i,
    });

    expect(halo?.style.backgroundImage).toBe(
      createSdkworkOfferBackdropStyle().backgroundImage,
    );
    expect(hero?.style.backgroundImage).toBe(
      createSdkworkOfferHeroStyle().backgroundImage,
    );
    expect(selectedOffer.style.backgroundImage).toBe(
      createSdkworkOfferPanelStyle("accent", {
        backgroundWeight: 14,
        borderWeight: 34,
        surfaceColor: "var(--sdk-color-surface-panel-muted)",
      }).backgroundImage,
    );
  });

  it("threads locale-aware default controller copy through the offer page shell before dashboard data resolves", async () => {
    render(
      <SdkworkThemeProvider defaultTheme="light">
        <SdkworkOfferPage
          locale="zh-CN"
          service={{
            getDashboard: vi.fn().mockImplementation(
              () => new Promise(() => undefined),
            ),
          }}
        />
      </SdkworkThemeProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "优惠中心",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("访客")).toBeInTheDocument();
  });
});
