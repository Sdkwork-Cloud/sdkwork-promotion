import {
  createSdkworkAppCapabilityManifest,
  type CreateSdkworkAppCapabilityManifestOptions,
  type SdkworkAppCapabilityManifest,
} from "@sdkwork/appbase-pc-react";
import {
  createSdkworkOfferMessages,
  type SdkworkOfferMessagesOverrides,
} from "./offer-copy";
import type {
  SdkworkCommercialAction,
  SdkworkCommercialActionCapability,
} from "./commercial-action";

export type SdkworkOfferFilter = "all" | "coupon" | "membership" | "recharge";
export type SdkworkOfferGroup = Exclude<SdkworkOfferFilter, "all">;
export type SdkworkOfferKind =
  | "coupon-claim"
  | "coupon-exchange"
  | "membership-purchase"
  | "membership-renewal"
  | "membership-upgrade"
  | "points-recharge";
export type SdkworkOfferCapability = Extract<
  SdkworkCommercialActionCapability,
  "coupon" | "points" | "subscription"
>;
export type SdkworkOfferActionIntent =
  | "claim"
  | "exchange"
  | "purchase"
  | "recharge"
  | "renew"
  | "upgrade";

export interface SdkworkOfferWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "offer";
  routePath: string;
}

export interface CreateOfferWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
  routePath?: string;
}

export interface CreateEmptySdkworkOfferDashboardOptions {
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
}

export interface SdkworkOfferRouteIntent {
  focusWindow: boolean;
  group?: SdkworkOfferGroup;
  offerId?: string;
  route: string;
  source: "offer-workspace";
  type: "offer-route-intent";
}

export interface CreateOfferRouteIntentOptions {
  basePath?: string;
  focusWindow?: boolean;
  group?: SdkworkOfferGroup;
  offerId?: string;
}

export type SdkworkOfferAction = SdkworkCommercialAction<
  SdkworkOfferCapability,
  SdkworkOfferActionIntent
>;

export interface SdkworkCommercialOffer {
  action: SdkworkOfferAction;
  description?: string;
  estimatedSavingsCny: number;
  group: SdkworkOfferGroup;
  id: string;
  includedPoints?: number | null;
  kind: SdkworkOfferKind;
  originalPriceCny?: number | null;
  pointCost?: number | null;
  priceCny: number | null;
  recommended: boolean;
  score?: number;
  tags: string[];
  title: string;
}

export interface SdkworkOfferDigest {
  couponOffers: number;
  featuredOffers: number;
  highlightedSavingsCny: number;
  membershipOffers: number;
  rechargeOffers: number;
}

export interface SdkworkOfferInventory {
  availableCoupons: number;
  availablePoints: number;
  claimableCoupons: number;
  currentLevelName: string;
  expiringSoonCoupons: number;
  isAuthenticated: boolean;
  membershipRemainingDays: number | null;
}

export interface SdkworkOfferDashboardData {
  digest: SdkworkOfferDigest;
  featuredOffers: SdkworkCommercialOffer[];
  inventory: SdkworkOfferInventory;
}

function normalizeBasePath(basePath: string | undefined): string {
  const normalized = (basePath ?? "/offers").trim();
  if (!normalized || normalized === "/") {
    return "/offers";
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function scoreSdkworkCommercialOffer(
  offer: Pick<
    SdkworkCommercialOffer,
    "estimatedSavingsCny" | "group" | "includedPoints" | "pointCost" | "priceCny" | "recommended"
  >,
): number {
  const groupBoost = offer.group === "membership" ? 30 : offer.group === "coupon" ? 20 : 10;
  const recommendationBoost = offer.recommended ? 40 : 0;
  const savingsBoost = toSafeNumber(offer.estimatedSavingsCny);
  const pointsBoost = Math.max(0, toSafeNumber(offer.includedPoints) / 1000);
  const priceEfficiencyBoost =
    offer.priceCny === null
      ? 25
      : Math.max(0, 50 - toSafeNumber(offer.priceCny) / 20);
  const pointCostPenalty = Math.max(0, toSafeNumber(offer.pointCost) / 500);

  return Math.round((groupBoost + recommendationBoost + savingsBoost + pointsBoost + priceEfficiencyBoost - pointCostPenalty) * 100) / 100;
}

export function sortSdkworkCommercialOffers(
  offers: readonly SdkworkCommercialOffer[],
): SdkworkCommercialOffer[] {
  return [...offers]
    .map((offer) => ({
      ...offer,
      score: offer.score ?? scoreSdkworkCommercialOffer(offer),
    }))
    .sort(
      (left, right) =>
        toSafeNumber(right.score) - toSafeNumber(left.score)
        || Number(right.recommended) - Number(left.recommended)
        || right.estimatedSavingsCny - left.estimatedSavingsCny
        || toSafeNumber(left.priceCny ?? Number.MAX_SAFE_INTEGER) - toSafeNumber(right.priceCny ?? Number.MAX_SAFE_INTEGER)
        || left.title.localeCompare(right.title),
    );
}

export function summarizeSdkworkCommercialOffers(
  offers: readonly SdkworkCommercialOffer[],
): SdkworkOfferDigest {
  return offers.reduce<SdkworkOfferDigest>(
    (summary, offer) => {
      summary.featuredOffers += 1;
      summary.highlightedSavingsCny = Math.max(summary.highlightedSavingsCny, toSafeNumber(offer.estimatedSavingsCny));

      if (offer.group === "coupon") {
        summary.couponOffers += 1;
      } else if (offer.group === "membership") {
        summary.membershipOffers += 1;
      } else {
        summary.rechargeOffers += 1;
      }

      return summary;
    },
    {
      couponOffers: 0,
      featuredOffers: 0,
      highlightedSavingsCny: 0,
      membershipOffers: 0,
      rechargeOffers: 0,
    },
  );
}

export function createEmptySdkworkOfferDashboard(
  options: CreateEmptySdkworkOfferDashboardOptions = {},
): SdkworkOfferDashboardData {
  const copy = createSdkworkOfferMessages(options.locale, options.messages);

  return {
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
      currentLevelName: copy.service.guestLabel,
      expiringSoonCoupons: 0,
      isAuthenticated: false,
      membershipRemainingDays: null,
    },
  };
}

export function createOfferWorkspaceManifest({
  description,
  host,
  id = "sdkwork-offer",
  locale,
  messages,
  packageNames = [
    "@sdkwork/promotion-pc-offer",
    "@sdkwork/promotion-pc-coupon",
    "@sdkwork/promotion-pc-points",
    "@sdkwork/membership-pc-subscription",
    "@sdkwork/membership-pc-membership",
    "@sdkwork/account-pc-wallet",
  ],
  routePath = "/offers",
  theme,
  title,
}: CreateOfferWorkspaceManifestOptions = {}): SdkworkOfferWorkspaceManifest {
  const copy = createSdkworkOfferMessages(locale, messages).manifest;

  return {
    ...createSdkworkAppCapabilityManifest({
      description: description ?? copy.description,
      host,
      id,
      packageNames,
      theme,
      title: title ?? copy.title,
    }),
    capability: "offer",
    routePath: normalizeBasePath(routePath),
  };
}

export function createOfferRouteIntent(
  options: CreateOfferRouteIntentOptions = {},
): SdkworkOfferRouteIntent {
  const basePath = normalizeBasePath(options.basePath);
  const queryParams = new URLSearchParams();

  if (options.group) {
    queryParams.set("group", options.group);
  }

  if (options.offerId) {
    queryParams.set("offerId", options.offerId);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    focusWindow: options.focusWindow !== false,
    ...(options.group ? { group: options.group } : {}),
    ...(options.offerId ? { offerId: options.offerId } : {}),
    route: `${basePath}${querySuffix}`,
    source: "offer-workspace",
    type: "offer-route-intent",
  };
}

export const offerPackageMeta = {
  architecture: "pc-react",
  domain: "promotion",
  package: "@sdkwork/promotion-pc-offer",
  status: "ready",
} as const;

export type OfferPackageMeta = typeof offerPackageMeta;
