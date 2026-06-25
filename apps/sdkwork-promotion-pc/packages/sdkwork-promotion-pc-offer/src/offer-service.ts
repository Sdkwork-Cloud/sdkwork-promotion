import type { SdkworkAccountAppService } from "@sdkwork/account-service";
import {
  createSdkworkWalletService,
  type SdkworkWalletOverview,
  type SdkworkWalletService,
} from "@sdkwork/account-pc-wallet";
import type { SdkworkMembershipAppService } from "@sdkwork/membership-service";
import {
  createSdkworkMembershipService,
  type SdkworkMembershipDashboardData,
  type SdkworkMembershipPlan,
  type SdkworkMembershipService,
} from "@sdkwork/membership-pc-membership";
import { createSubscriptionRouteIntent } from "@sdkwork/membership-pc-subscription";
import type { SdkworkPromotionAppService } from "@sdkwork/promotion-service";
import {
  createCouponRouteIntent,
  createSdkworkCouponService,
  type SdkworkCouponCatalog,
  type SdkworkCouponDashboardData,
  type SdkworkCouponService,
} from "@sdkwork/promotion-pc-coupon";
import {
  createPointsRouteIntent,
  createSdkworkPointsService,
  type SdkworkPointsDashboardData,
  type SdkworkPointsRechargeOffer,
  type SdkworkPointsService,
} from "@sdkwork/promotion-pc-points";
import {
  createEmptySdkworkOfferDashboard,
  scoreSdkworkCommercialOffer,
  sortSdkworkCommercialOffers,
  summarizeSdkworkCommercialOffers,
  type SdkworkCommercialOffer,
  type SdkworkOfferDashboardData,
} from "./offer";
import {
  createSdkworkOfferMessages,
  type SdkworkOfferMessagesOverrides,
} from "./offer-copy";
import { createSdkworkCommercialAction } from "./commercial-action";

export interface SdkworkOfferDashboardSources {
  couponDashboard: SdkworkCouponDashboardData;
  pointsDashboard: SdkworkPointsDashboardData;
  membershipDashboard: SdkworkMembershipDashboardData;
  walletOverview: SdkworkWalletOverview;
}

export interface CreateSdkworkOfferServiceOptions {
  promotionAppService?: SdkworkPromotionAppService;
  walletAppService?: SdkworkAccountAppService;
  membershipAppService?: SdkworkMembershipAppService;
  couponService?: Pick<SdkworkCouponService, "getDashboard">;
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
  pointsService?: Pick<SdkworkPointsService, "getDashboard">;
  membershipService?: Pick<SdkworkMembershipService, "getDashboard">;
  walletService?: Pick<SdkworkWalletService, "getOverview">;
}

export interface SdkworkOfferService {
  getDashboard(): Promise<SdkworkOfferDashboardData>;
  getEmptyDashboard(): SdkworkOfferDashboardData;
}

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveMembershipAction(
  membershipDashboard: SdkworkMembershipDashboardData,
): "purchase" | "renew" | "upgrade" {
  if (!membershipDashboard.summary.isMember) {
    return "purchase";
  }

  if ((membershipDashboard.summary.remainingDays ?? null) !== null && (membershipDashboard.summary.remainingDays ?? 0) <= 30) {
    return "renew";
  }

  return "upgrade";
}

function createOfferId(prefix: string, rawId: string | number): string {
  return `${prefix}-${String(rawId)}`;
}

function decorateOffer(offer: Omit<SdkworkCommercialOffer, "score">): SdkworkCommercialOffer {
  return {
    ...offer,
    score: scoreSdkworkCommercialOffer(offer),
  };
}

function createMembershipOffers(
  membershipDashboard: SdkworkMembershipDashboardData,
  copy: ReturnType<typeof createSdkworkOfferMessages>,
): SdkworkCommercialOffer[] {
  const action = resolveMembershipAction(membershipDashboard);

  return membershipDashboard.plans.map((plan: SdkworkMembershipPlan) => {
    const estimatedSavingsCny = Math.max(0, toSafeNumber(plan.originalPriceCny) - toSafeNumber(plan.priceCny));

    return decorateOffer({
      action: createSdkworkCommercialAction({
        capability: "subscription",
        intent: action,
        label: action === "renew"
          ? copy.service.actionOpenRenewal
          : action === "upgrade"
            ? copy.service.actionOpenUpgrade
            : copy.service.actionOpenCheckout,
        route: createSubscriptionRouteIntent({
          mode: action,
          packageId: plan.packageId,
        }).route,
      }),
      description: plan.description || copy.service.membershipFallbackDescription,
      estimatedSavingsCny,
      group: "membership",
      id: createOfferId("offer-membership", plan.packageId),
      includedPoints: plan.includedPoints,
      kind:
        action === "renew"
          ? "membership-renewal"
          : action === "upgrade"
            ? "membership-upgrade"
            : "membership-purchase",
      originalPriceCny: plan.originalPriceCny,
      pointCost: null,
      priceCny: plan.priceCny,
      recommended: plan.recommended,
      tags: [...plan.tags],
      title: plan.name,
    });
  });
}

function createRechargeOffers(
  pointsDashboard: SdkworkPointsDashboardData,
  copy: ReturnType<typeof createSdkworkOfferMessages>,
): SdkworkCommercialOffer[] {
  const rate = pointsDashboard.summary.pointsToCashRate;

  return pointsDashboard.rechargeOffers.map((offer: SdkworkPointsRechargeOffer) => {
    const estimatedValueCny =
      rate && rate > 0
        ? roundCurrency(offer.points / rate)
        : 0;
    const estimatedSavingsCny = Math.max(0, roundCurrency(estimatedValueCny - offer.priceCny));

    return decorateOffer({
      action: createSdkworkCommercialAction({
        capability: "points",
        intent: "recharge",
        label: copy.service.actionOpenRecharge,
        route: createPointsRouteIntent({
          sectionId: "recharge",
        }).route,
      }),
      description: offer.description || copy.service.rechargeFallbackDescription,
      estimatedSavingsCny,
      group: "recharge",
      id: createOfferId("offer-recharge", offer.id),
      includedPoints: offer.points,
      kind: "points-recharge",
      originalPriceCny: null,
      pointCost: null,
      priceCny: offer.priceCny,
      recommended: offer.recommended,
      tags: [copy.service.rechargeTagPoints],
      title: offer.title,
    });
  });
}

function createCouponOffer(
  coupon: SdkworkCouponCatalog,
  copy: ReturnType<typeof createSdkworkOfferMessages>,
  pointsToCashRate: number | null,
): SdkworkCommercialOffer | null {
  if (!coupon.canReceive && !coupon.pointsExchange) {
    return null;
  }

  const claimable = coupon.canReceive;
  const rawCouponId = coupon.couponId || coupon.id.replace(/^coupon-/, "");
  const pointPriceCny =
    coupon.pointCost !== null && pointsToCashRate && pointsToCashRate > 0
      ? roundCurrency(coupon.pointCost / pointsToCashRate)
      : null;

  return decorateOffer({
    action: createSdkworkCommercialAction({
      capability: "coupon",
      intent: claimable ? "claim" : "exchange",
      label: copy.service.actionOpenCouponCenter,
      route: createCouponRouteIntent({
        couponId: rawCouponId,
        tab: "discover",
      }).route,
    }),
    description: coupon.description || copy.service.couponFallbackDescription,
    estimatedSavingsCny: Math.max(0, toSafeNumber(coupon.amountCny)),
    group: "coupon",
    id: createOfferId(
      claimable ? "offer-coupon-claim" : "offer-coupon-exchange",
      rawCouponId,
    ),
    includedPoints: null,
    kind: claimable ? "coupon-claim" : "coupon-exchange",
    originalPriceCny: null,
    pointCost: coupon.pointCost,
    priceCny: claimable ? 0 : pointPriceCny,
    recommended: claimable || toSafeNumber(coupon.amountCny) >= 100,
    tags: [claimable ? copy.service.couponTagClaimable : copy.service.couponTagExchange],
    title: coupon.name,
  });
}

function createCouponOffers(
  couponDashboard: SdkworkCouponDashboardData,
  copy: ReturnType<typeof createSdkworkOfferMessages>,
  pointsToCashRate: number | null,
): SdkworkCommercialOffer[] {
  return couponDashboard.catalogCoupons
    .map((coupon) => createCouponOffer(coupon, copy, pointsToCashRate))
    .filter((offer): offer is SdkworkCommercialOffer => Boolean(offer));
}

export function composeSdkworkOfferDashboard(
  sources: SdkworkOfferDashboardSources,
  options: Pick<CreateSdkworkOfferServiceOptions, "locale" | "messages"> = {},
): SdkworkOfferDashboardData {
  const copy = createSdkworkOfferMessages(options.locale, options.messages);
  if (!sources.walletOverview.isAuthenticated) {
    return createEmptySdkworkOfferDashboard({
      locale: options.locale,
      messages: options.messages,
    });
  }

  const featuredOffers = sortSdkworkCommercialOffers([
    ...createMembershipOffers(sources.membershipDashboard, copy),
    ...createRechargeOffers(sources.pointsDashboard, copy),
    ...createCouponOffers(sources.couponDashboard, copy, sources.walletOverview.pointsToCashRate),
  ]);

  return {
    digest: summarizeSdkworkCommercialOffers(featuredOffers),
    featuredOffers,
    inventory: {
      availableCoupons: sources.couponDashboard.userDigest.availableCoupons,
      availablePoints: sources.walletOverview.account.availablePoints,
      claimableCoupons: sources.couponDashboard.catalogDigest.claimableCoupons,
      currentLevelName:
        sources.membershipDashboard.summary.currentLevelName
        || copy.service.guestLabel,
      expiringSoonCoupons: sources.couponDashboard.userDigest.expiringSoonCoupons,
      isAuthenticated: true,
      membershipRemainingDays: sources.membershipDashboard.summary.remainingDays,
    },
  };
}

export function createSdkworkOfferService(
  options: CreateSdkworkOfferServiceOptions = {},
): SdkworkOfferService {
  const walletService = options.walletService ?? createSdkworkWalletService({
    accountAppService: options.walletAppService,
  });
  const couponService = options.couponService ?? createSdkworkCouponService({
    promotionAppService: options.promotionAppService,
    locale: options.locale,
  });
  const pointsService = options.pointsService ?? createSdkworkPointsService({
    walletAppService: options.walletAppService,
    membershipAppService: options.membershipAppService,
    locale: options.locale,
  });
  const membershipService = options.membershipService ?? createSdkworkMembershipService({
    membershipAppService: options.membershipAppService,
    locale: options.locale,
  });

  return {
    async getDashboard() {
      const walletOverview = await walletService.getOverview();
      if (!walletOverview.isAuthenticated) {
        return createEmptySdkworkOfferDashboard({
          locale: options.locale,
          messages: options.messages,
        });
      }

      const [couponDashboard, pointsDashboard, membershipDashboard] = await Promise.all([
        couponService.getDashboard(),
        pointsService.getDashboard(),
        membershipService.getDashboard(),
      ]);

      return composeSdkworkOfferDashboard(
        {
          couponDashboard,
          pointsDashboard,
          membershipDashboard,
          walletOverview,
        },
        {
          locale: options.locale,
          messages: options.messages,
        },
      );
    },

    getEmptyDashboard() {
      return createEmptySdkworkOfferDashboard({
        locale: options.locale,
        messages: options.messages,
      });
    },
  };
}

export const sdkworkOfferService = createSdkworkOfferService();
