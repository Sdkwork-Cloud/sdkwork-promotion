import { describe, expect, it } from "vitest";
import {
  createSdkworkCommercialAction,
  type CreateOfferWorkspaceManifestOptions,
  createOfferRouteIntent,
  createOfferWorkspaceManifest,
  offerPackageMeta,
  scoreSdkworkCommercialOffer,
  type SdkworkOfferMessagesOverrides,
  sortSdkworkCommercialOffers,
  summarizeSdkworkCommercialOffers,
} from "../src";

describe("sdkwork-promotion-pc-offer commercial action contract", () => {
  it("creates a shared commercial action with explicit capability and intent", () => {
    expect(createSdkworkCommercialAction).toBeTypeOf("function");
    expect(
      createSdkworkCommercialAction({
        capability: "subscription",
        intent: "renew",
        label: "Open renewal",
        route: "/subscription?mode=renew&packageId=3",
      }),
    ).toEqual({
      capability: "subscription",
      intent: "renew",
      label: "Open renewal",
      route: "/subscription?mode=renew&packageId=3",
    });
  });
});

describe("sdkwork-promotion-pc-offer headless contract", () => {
  it("creates reusable offer manifests, route intents, digests, and deterministic offer ranking", () => {
    expect(offerPackageMeta).toMatchObject({
      domain: "promotion",
      package: "@sdkwork/promotion-pc-offer",
    });

    expect(
      createOfferWorkspaceManifest({
        title: "Offers",
      }),
    ).toMatchObject({
      capability: "offer",
      packageNames: [
        "@sdkwork/promotion-pc-offer",
        "@sdkwork/promotion-pc-coupon",
        "@sdkwork/promotion-pc-points",
        "@sdkwork/membership-pc-subscription",
        "@sdkwork/membership-pc-membership",
        "@sdkwork/account-pc-wallet",
      ],
      routePath: "/offers",
      title: "Offers",
    });

    expect(
      createOfferRouteIntent({
        group: "coupon",
        offerId: "coupon-200",
      }),
    ).toEqual({
      focusWindow: true,
      group: "coupon",
      offerId: "coupon-200",
      route: "/offers?group=coupon&offerId=coupon-200",
      source: "offer-workspace",
      type: "offer-route-intent",
    });

    const membershipOffer = {
      action: {
        capability: "subscription" as const,
        intent: "renew" as const,
        label: "Open renewal",
        route: "/subscription?mode=renew&packageId=3",
      },
      description: "Annual membership package",
      estimatedSavingsCny: 300,
      group: "membership" as const,
      id: "offer-membership-3",
      includedPoints: 60000,
      kind: "membership-renewal" as const,
      priceCny: 699,
      recommended: true,
      tags: ["Annual"],
      title: "Pro Annual",
    };
    const couponOffer = {
      action: {
        capability: "coupon" as const,
        intent: "claim" as const,
        label: "Open coupon center",
        route: "/coupons?tab=discover&couponId=200",
      },
      description: "Claimable launch coupon",
      estimatedSavingsCny: 120,
      group: "coupon" as const,
      id: "offer-coupon-200",
      kind: "coupon-claim" as const,
      priceCny: 0,
      recommended: true,
      tags: ["Claimable"],
      title: "Launch 120",
    };
    const rechargeOffer = {
      action: {
        capability: "points" as const,
        intent: "recharge" as const,
        label: "Open recharge",
        route: "/points?section=recharge",
      },
      description: "Recharge points for premium workflows",
      estimatedSavingsCny: 12,
      group: "recharge" as const,
      id: "offer-recharge-5000",
      kind: "points-recharge" as const,
      priceCny: 38,
      recommended: false,
      tags: ["Points"],
      title: "5000 Points",
    };

    expect(scoreSdkworkCommercialOffer(membershipOffer)).toBeGreaterThan(
      scoreSdkworkCommercialOffer(couponOffer),
    );
    expect(
      sortSdkworkCommercialOffers([
        rechargeOffer,
        couponOffer,
        membershipOffer,
      ]).map((offer) => offer.id),
    ).toEqual([
      "offer-membership-3",
      "offer-coupon-200",
      "offer-recharge-5000",
    ]);
    expect(
      summarizeSdkworkCommercialOffers([
        membershipOffer,
        couponOffer,
        rechargeOffer,
      ]),
    ).toEqual({
      couponOffers: 1,
      featuredOffers: 3,
      highlightedSavingsCny: 300,
      membershipOffers: 1,
      rechargeOffers: 1,
    });
  });

  it("localizes offer workspace manifest defaults through the copy seam", () => {
    expect(
      createOfferWorkspaceManifest({
        locale: "zh-CN",
        messages: {
          manifest: {
            description: "本地化方案工作区描述",
            title: "本地化方案标题",
          },
        },
      } satisfies CreateOfferWorkspaceManifestOptions & { messages: SdkworkOfferMessagesOverrides }),
    ).toMatchObject({
      description: "本地化方案工作区描述",
      title: "本地化方案标题",
    });
  });
});
