import {
  createSdkworkAppCapabilityManifest,
  type CreateSdkworkAppCapabilityManifestOptions,
  type SdkworkAppCapabilityManifest,
} from "@sdkwork/appbase-pc-react";
import {
  createSdkworkCommercialAction,
  type SdkworkCommercialAction,
} from "@sdkwork/promotion-pc-offer";
import type { SdkworkBillingPosture } from "@sdkwork/promotion-pc-pricing/billing-stub";
import {
  createSdkworkPricingMessages,
  type SdkworkPricingMessagesOverrides,
} from "./pricing-copy";

export type SdkworkPricingBillingModel = "hybrid" | "prepaid" | "subscription" | "usage";
export type SdkworkPricingCadence = "annual" | "metered" | "monthly" | "one-time";
export type SdkworkPricingServiceTier = "enterprise" | "free" | "pro" | "team";
export type SdkworkPricingFeatureValue = boolean | number | string | null;

export interface SdkworkPricingWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "pricing";
  routePath: string;
}

export interface CreatePricingWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
  routePath?: string;
}

export interface SdkworkPricingRouteIntent {
  billingModel?: SdkworkPricingBillingModel;
  focusWindow: boolean;
  planId?: string;
  route: string;
  serviceTier?: SdkworkPricingServiceTier;
  source: "pricing-workspace";
  type: "pricing-route-intent";
}

export interface CreatePricingRouteIntentOptions {
  basePath?: string;
  billingModel?: SdkworkPricingBillingModel;
  focusWindow?: boolean;
  planId?: string;
  serviceTier?: SdkworkPricingServiceTier;
}

export interface SdkworkPricingFeature {
  id: string;
  label: string;
}

export interface SdkworkPricingPlan {
  bestFitFor: string;
  billingModel: SdkworkPricingBillingModel;
  cadence: SdkworkPricingCadence;
  current: boolean;
  description: string;
  featureValues: Record<string, SdkworkPricingFeatureValue>;
  id: string;
  includedPoints: number;
  includedUsage: string;
  priceCny: number | null;
  priceLabel: string;
  recommended: boolean;
  savingsComparedToMonthlyCny: number;
  seatLimit: number | null;
  serviceTier: SdkworkPricingServiceTier;
  tags: string[];
  title: string;
  action: SdkworkCommercialAction;
}

export interface SdkworkPricingDigest {
  currentPlanTitle: string;
  highestSavingsCny: number;
  hybridPlans: number;
  planCount: number;
  prepaidPlans: number;
  recommendedPlanId: string | null;
  subscriptionPlans: number;
  usagePlans: number;
}

export interface SdkworkPricingSummary {
  activeSubscriptionPlans: number;
  availablePoints: number;
  bestOfferSavingsCny: number;
  budgetPosture: SdkworkBillingPosture;
  currentLevelName: string;
  isAuthenticated: boolean;
  walletBalanceCny: number;
}

export interface SdkworkPricingCatalogData {
  digest: SdkworkPricingDigest;
  featureMatrix: SdkworkPricingFeature[];
  plans: SdkworkPricingPlan[];
  summary: SdkworkPricingSummary;
}

export interface CreateEmptySdkworkPricingCatalogOptions {
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
  plans?: readonly SdkworkPricingPlan[];
  summary?: Partial<SdkworkPricingSummary>;
}

function normalizeBasePath(basePath: string | undefined): string {
  const normalized = (basePath ?? "/pricing").trim();
  if (!normalized || normalized === "/") {
    return "/pricing";
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mergeFeatureValues(
  defaults: Record<string, SdkworkPricingFeatureValue>,
  overrides: Record<string, SdkworkPricingFeatureValue> | undefined,
): Record<string, SdkworkPricingFeatureValue> {
  return {
    ...defaults,
    ...(overrides ?? {}),
  };
}

function createUsageFeatureValues(
  locale?: string | null,
  messages?: SdkworkPricingMessagesOverrides,
  overrides?: Record<string, SdkworkPricingFeatureValue>,
): Record<string, SdkworkPricingFeatureValue> {
  const copy = createSdkworkPricingMessages(locale, messages);

  return mergeFeatureValues(
    {
      "billing-model": copy.billingModel.usage,
      "budget-guard": copy.service.budgetGuardRealtimeBillingAlerts,
      cadence: copy.cadence.metered,
      "included-points": copy.defaults.none,
      "included-usage": copy.defaults.usageIncludedUsage,
      "invoice-ready": false,
      "seat-limit": copy.seats.singular,
    },
    overrides,
  );
}

function createHybridFeatureValues(
  locale?: string | null,
  messages?: SdkworkPricingMessagesOverrides,
  overrides?: Record<string, SdkworkPricingFeatureValue>,
): Record<string, SdkworkPricingFeatureValue> {
  const copy = createSdkworkPricingMessages(locale, messages);

  return mergeFeatureValues(
    {
      "billing-model": copy.billingModel.hybrid,
      "budget-guard": copy.service.budgetGuardCentralBudgetInvoiceWorkflow,
      cadence: copy.cadence.monthly,
      "included-points": copy.seats.custom,
      "included-usage": copy.defaults.hybridIncludedUsage,
      "invoice-ready": true,
      "seat-limit": copy.seats.custom,
    },
    overrides,
  );
}

export function createSdkworkPricingFeatureMatrix(
  locale?: string | null,
  messages?: SdkworkPricingMessagesOverrides,
): SdkworkPricingFeature[] {
  const copy = createSdkworkPricingMessages(locale, messages);

  return [
    {
      id: "billing-model",
      label: copy.featureMatrix.billingModel,
    },
    {
      id: "cadence",
      label: copy.featureMatrix.cadence,
    },
    {
      id: "included-points",
      label: copy.featureMatrix.includedPoints,
    },
    {
      id: "included-usage",
      label: copy.featureMatrix.includedUsage,
    },
    {
      id: "seat-limit",
      label: copy.featureMatrix.seatLimit,
    },
    {
      id: "budget-guard",
      label: copy.featureMatrix.budgetGuard,
    },
    {
      id: "invoice-ready",
      label: copy.featureMatrix.invoiceReady,
    },
  ];
}

export function formatSdkworkPricingBillingModel(
  billingModel: SdkworkPricingBillingModel,
): string {
  if (billingModel === "usage") {
    return "Usage";
  }

  if (billingModel === "prepaid") {
    return "Prepaid";
  }

  if (billingModel === "subscription") {
    return "Subscription";
  }

  return "Hybrid";
}

export function formatSdkworkPricingCadence(
  cadence: SdkworkPricingCadence,
): string {
  if (cadence === "monthly") {
    return "Monthly";
  }

  if (cadence === "annual") {
    return "Annual";
  }

  if (cadence === "one-time") {
    return "One-time";
  }

  return "Metered";
}

export function formatSdkworkPricingSeatLimit(
  seatLimit: number | null,
): string {
  if (seatLimit === null) {
    return "Custom";
  }

  if (seatLimit <= 1) {
    return "1 seat";
  }

  return `${seatLimit} seats`;
}

export function createSdkworkPricingUsagePlan(
  options: Partial<SdkworkPricingPlan> & {
    locale?: string | null;
    messages?: SdkworkPricingMessagesOverrides;
  } = {},
): SdkworkPricingPlan {
  const {
    featureValues,
    locale,
    messages,
    ...rest
  } = options;
  const copy = createSdkworkPricingMessages(locale, messages);
  const basePlan: SdkworkPricingPlan = {
    bestFitFor: copy.service.bestFitVariableWorkloads,
    billingModel: "usage",
    cadence: "metered",
    action: createSdkworkCommercialAction({
      capability: "billing",
      intent: "open",
      label: copy.service.actionOpenBilling,
      route: "/billing?breakdown=provider",
    }),
    current: true,
    description: copy.defaults.usagePlanDescription,
    featureValues: createUsageFeatureValues(locale, messages),
    id: "usage-payg",
    includedPoints: 0,
    includedUsage: copy.defaults.usageIncludedUsage,
    priceCny: null,
    priceLabel: copy.defaults.usagePlanPriceLabel,
    recommended: true,
    savingsComparedToMonthlyCny: 0,
    seatLimit: 1,
    serviceTier: "free",
    tags: [copy.service.tagNoCommitment],
    title: copy.defaults.usagePlanTitle,
  };

  return {
    ...basePlan,
    ...rest,
    featureValues: createUsageFeatureValues(locale, messages, featureValues),
  };
}

export function createSdkworkPricingHybridPlan(
  options: Partial<SdkworkPricingPlan> & {
    locale?: string | null;
    messages?: SdkworkPricingMessagesOverrides;
  } = {},
): SdkworkPricingPlan {
  const {
    featureValues,
    locale,
    messages,
    ...rest
  } = options;
  const copy = createSdkworkPricingMessages(locale, messages);
  const basePlan: SdkworkPricingPlan = {
    bestFitFor: copy.service.bestFitSecurityProcurement,
    billingModel: "hybrid",
    cadence: "monthly",
    action: createSdkworkCommercialAction({
      capability: "offer",
      intent: "review",
      label: copy.service.actionReviewEnterprisePath,
      route: "/offers?group=membership",
    }),
    current: false,
    description: copy.defaults.hybridPlanDescription,
    featureValues: createHybridFeatureValues(locale, messages),
    id: "enterprise-hybrid",
    includedPoints: 0,
    includedUsage: copy.defaults.hybridIncludedUsage,
    priceCny: null,
    priceLabel: copy.defaults.hybridPlanPriceLabel,
    recommended: false,
    savingsComparedToMonthlyCny: 0,
    seatLimit: null,
    serviceTier: "enterprise",
    tags: [copy.service.tagEnterprise],
    title: copy.defaults.hybridPlanTitle,
  };

  return {
    ...basePlan,
    ...rest,
    featureValues: createHybridFeatureValues(locale, messages, featureValues),
  };
}

export function sortSdkworkPricingPlans(
  plans: readonly SdkworkPricingPlan[],
): SdkworkPricingPlan[] {
  const tierRank: Record<SdkworkPricingServiceTier, number> = {
    enterprise: 3,
    free: 0,
    pro: 1,
    team: 2,
  };

  return [...plans].sort(
    (left, right) =>
      Number(right.current) - Number(left.current)
      || Number(right.recommended) - Number(left.recommended)
      || (tierRank[left.serviceTier] ?? Number.MAX_SAFE_INTEGER) - (tierRank[right.serviceTier] ?? Number.MAX_SAFE_INTEGER)
      || toSafeNumber(left.priceCny ?? Number.MAX_SAFE_INTEGER) - toSafeNumber(right.priceCny ?? Number.MAX_SAFE_INTEGER)
      || left.title.localeCompare(right.title),
  );
}

export function summarizeSdkworkPricingPlans(
  plans: readonly SdkworkPricingPlan[],
): SdkworkPricingDigest {
  const sortedPlans = sortSdkworkPricingPlans(plans);
  const currentPlan = sortedPlans.find((plan) => plan.current) ?? sortedPlans[0] ?? null;
  const recommendedPlan =
    sortedPlans.find((plan) => plan.recommended && !plan.current)
    ?? sortedPlans.find((plan) => plan.recommended)
    ?? currentPlan;

  return sortedPlans.reduce<SdkworkPricingDigest>(
    (summary, plan) => {
      summary.planCount += 1;
      summary.highestSavingsCny = Math.max(summary.highestSavingsCny, toSafeNumber(plan.savingsComparedToMonthlyCny));

      if (plan.billingModel === "usage") {
        summary.usagePlans += 1;
      } else if (plan.billingModel === "prepaid") {
        summary.prepaidPlans += 1;
      } else if (plan.billingModel === "subscription") {
        summary.subscriptionPlans += 1;
      } else {
        summary.hybridPlans += 1;
      }

      return summary;
    },
    {
      currentPlanTitle: currentPlan?.title ?? "Pay as you go",
      highestSavingsCny: 0,
      hybridPlans: 0,
      planCount: 0,
      prepaidPlans: 0,
      recommendedPlanId: recommendedPlan?.id ?? null,
      subscriptionPlans: 0,
      usagePlans: 0,
    },
  );
}

export function createEmptySdkworkPricingCatalog(
  options: CreateEmptySdkworkPricingCatalogOptions = {},
): SdkworkPricingCatalogData {
  const copy = createSdkworkPricingMessages(options.locale, options.messages);
  const plans = options.plans?.length
    ? sortSdkworkPricingPlans(options.plans)
    : sortSdkworkPricingPlans([
        createSdkworkPricingUsagePlan({
          locale: options.locale,
          messages: options.messages,
        }),
        createSdkworkPricingHybridPlan({
          locale: options.locale,
          messages: options.messages,
        }),
      ]);

  return {
    digest: summarizeSdkworkPricingPlans(plans),
    featureMatrix: createSdkworkPricingFeatureMatrix(options.locale, options.messages),
    plans,
    summary: {
      activeSubscriptionPlans: 0,
      availablePoints: 0,
      bestOfferSavingsCny: 0,
      budgetPosture: "healthy",
      currentLevelName: copy.defaults.currentLevelName,
      isAuthenticated: false,
      walletBalanceCny: 0,
      ...options.summary,
    },
  };
}

export function createPricingWorkspaceManifest({
  description,
  host,
  id = "sdkwork-pricing",
  locale,
  messages,
  packageNames = [
    "@sdkwork/promotion-pc-pricing",
    "@sdkwork/account-pc-wallet",
    "@sdkwork/membership-pc-subscription",
    "@sdkwork/promotion-pc-offer",
  ],
  routePath = "/pricing",
  theme,
  title,
}: CreatePricingWorkspaceManifestOptions = {}): SdkworkPricingWorkspaceManifest {
  const copy = createSdkworkPricingMessages(locale, messages).manifest;

  return {
    ...createSdkworkAppCapabilityManifest({
      description: description ?? copy.description,
      host,
      id,
      packageNames,
      theme,
      title: title ?? copy.title,
    }),
    capability: "pricing",
    routePath: normalizeBasePath(routePath),
  };
}

export function createPricingRouteIntent(
  options: CreatePricingRouteIntentOptions = {},
): SdkworkPricingRouteIntent {
  const basePath = normalizeBasePath(options.basePath);
  const queryParams = new URLSearchParams();

  if (options.billingModel) {
    queryParams.set("billingModel", options.billingModel);
  }

  if (options.serviceTier) {
    queryParams.set("serviceTier", options.serviceTier);
  }

  if (options.planId) {
    queryParams.set("planId", options.planId);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    ...(options.billingModel ? { billingModel: options.billingModel } : {}),
    focusWindow: options.focusWindow !== false,
    ...(options.planId ? { planId: options.planId } : {}),
    route: `${basePath}${querySuffix}`,
    ...(options.serviceTier ? { serviceTier: options.serviceTier } : {}),
    source: "pricing-workspace",
    type: "pricing-route-intent",
  };
}

export const pricingPackageMeta = {
  architecture: "pc-react",
  domain: "promotion",
  package: "@sdkwork/promotion-pc-pricing",
  status: "ready",
} as const;

export type PricingPackageMeta = typeof pricingPackageMeta;
