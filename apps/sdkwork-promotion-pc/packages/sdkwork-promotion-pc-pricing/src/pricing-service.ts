import type { SdkworkAccountAppService } from "@sdkwork/account-service";
import {
  createSdkworkWalletService,
  createWalletRouteIntent,
  type SdkworkWalletOverview,
  type SdkworkWalletRechargePackage,
  type SdkworkWalletService,
} from "@sdkwork/account-pc-wallet";
import type { SdkworkMembershipAppService } from "@sdkwork/membership-service";
import {
  createSdkworkSubscriptionService,
  createSubscriptionRouteIntent,
  type SdkworkSubscriptionDashboardData,
  type SdkworkSubscriptionService,
} from "@sdkwork/membership-pc-subscription";
import {
  formatSdkworkPromotionCurrencyCny as formatSdkworkCurrencyCny,
  formatSdkworkPromotionPoints as formatSdkworkPoints,
  hasSdkworkPromotionSession,
  type SdkworkPromotionAppService,
} from "@sdkwork/promotion-service";
import {
  createOfferRouteIntent,
  createSdkworkCommercialAction,
  createSdkworkOfferService,
  type SdkworkOfferDashboardData,
  type SdkworkOfferService,
} from "@sdkwork/promotion-pc-offer";
import {
  createSdkworkBillingService,
  type SdkworkBillingPosture,
  type SdkworkBillingService,
} from "./billing-stub";
import {
  createEmptySdkworkPricingCatalog,
  createSdkworkPricingHybridPlan,
  createSdkworkPricingUsagePlan,
  formatSdkworkPricingSeatLimit,
  type SdkworkPricingBillingModel,
  type SdkworkPricingCadence,
  type SdkworkPricingCatalogData,
  type SdkworkPricingFeatureValue,
  type SdkworkPricingPlan,
  type SdkworkPricingServiceTier,
  type SdkworkPricingSummary,
} from "./pricing";
import {
  createSdkworkPricingMessages,
  formatSdkworkPricingTemplate,
  normalizeSdkworkPricingLocale,
  type SdkworkPricingMessages,
  type SdkworkPricingMessagesOverrides,
} from "./pricing-copy";

export interface CreateSdkworkPricingServiceOptions {
  accountAppService?: SdkworkAccountAppService;
  billingService?: Partial<Pick<SdkworkBillingService, "getDashboard" | "getEmptyDashboard">>;
  locale?: string | null;
  membershipAppService?: SdkworkMembershipAppService;
  messages?: SdkworkPricingMessagesOverrides;
  offerService?: Partial<Pick<SdkworkOfferService, "getDashboard" | "getEmptyDashboard">>;
  promotionAppService?: SdkworkPromotionAppService;
  subscriptionService?: Partial<Pick<SdkworkSubscriptionService, "getDashboard" | "getEmptyDashboard">>;
  walletService?: Partial<Pick<SdkworkWalletService, "getOverview">>;
}

export interface SdkworkPricingService {
  getCatalog(): Promise<SdkworkPricingCatalogData>;
  getEmptyCatalog(): SdkworkPricingCatalogData;
}

type SdkworkPricingCopyContext = Pick<
  SdkworkPricingMessages,
  "billingModel" | "cadence" | "defaults" | "service"
>;

function toSafeNumber(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function dedupeTags(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function inferCadence(durationDays: number | null | undefined): SdkworkPricingCadence {
  if (toSafeNumber(durationDays) >= 360) {
    return "annual";
  }

  return "monthly";
}

function inferServiceTier(
  plan: {
    levelName?: string;
    name: string;
    tags: string[];
  },
  index: number,
  total: number,
): SdkworkPricingServiceTier {
  const normalized = [
    plan.levelName,
    plan.name,
    ...plan.tags,
  ]
    .map(normalizeText)
    .join(" ");

  if (normalized.includes("enterprise") || normalized.includes("business")) {
    return "enterprise";
  }

  if (normalized.includes("team") || normalized.includes("workspace")) {
    return "team";
  }

  if (normalized.includes("free") || normalized.includes("starter")) {
    return "free";
  }

  if (normalized.includes("pro") || normalized.includes("plus")) {
    return "pro";
  }

  if (total <= 1) {
    return "pro";
  }

  if (total === 2) {
    return index === 0 ? "pro" : "team";
  }

  if (index === total - 1) {
    return "enterprise";
  }

  return index === 0 ? "pro" : "team";
}

function planMatchesCurrentLevel(
  plan: {
    levelName?: string;
    name: string;
  },
  currentLevelName: string,
): boolean {
  const normalizedCurrentLevel = normalizeText(currentLevelName);
  if (!normalizedCurrentLevel) {
    return false;
  }

  return [plan.levelName, plan.name]
    .map(normalizeText)
    .filter(Boolean)
    .some(
      (value) =>
        value === normalizedCurrentLevel
        || value.includes(normalizedCurrentLevel)
        || normalizedCurrentLevel.includes(value),
    );
}

function resolveSeatLimit(
  serviceTier: SdkworkPricingServiceTier,
  billingModel: SdkworkPricingBillingModel,
): number | null {
  if (billingModel === "hybrid" || serviceTier === "enterprise") {
    return null;
  }

  if (serviceTier === "team") {
    return 10;
  }

  return 1;
}

function formatBillingModelLabel(
  copy: SdkworkPricingCopyContext,
  billingModel: SdkworkPricingBillingModel,
): string {
  if (billingModel === "usage") {
    return copy.billingModel.usage;
  }

  if (billingModel === "prepaid") {
    return copy.billingModel.prepaid;
  }

  if (billingModel === "subscription") {
    return copy.billingModel.subscription;
  }

  return copy.billingModel.hybrid;
}

function formatCadenceLabel(
  copy: SdkworkPricingCopyContext,
  cadence: SdkworkPricingCadence,
): string {
  if (cadence === "annual") {
    return copy.cadence.annual;
  }

  if (cadence === "monthly") {
    return copy.cadence.monthly;
  }

  if (cadence === "one-time") {
    return copy.cadence.oneTime;
  }

  return copy.cadence.metered;
}

function formatIncludedPoints(
  copy: SdkworkPricingCopyContext,
  locale: string | null | undefined,
  includedPoints: number,
  cadence: SdkworkPricingCadence,
  billingModel: SdkworkPricingBillingModel,
): string {
  if (includedPoints <= 0) {
    return billingModel === "prepaid" ? copy.service.rechargeOnDemand : copy.defaults.none;
  }

  const formattedPoints = formatSdkworkPoints(
    includedPoints,
    normalizeSdkworkPricingLocale(locale),
  );

  if (billingModel === "prepaid") {
    return formatSdkworkPricingTemplate(copy.service.pointsCreditsValue, formattedPoints);
  }

  if (cadence === "annual") {
    return formatSdkworkPricingTemplate(copy.service.quotaPerYearValue, formattedPoints);
  }

  return formatSdkworkPricingTemplate(copy.service.quotaPerMonthValue, formattedPoints);
}

function resolveBudgetGuardLabel(
  copy: SdkworkPricingCopyContext,
  billingPosture: SdkworkBillingPosture,
  billingModel: SdkworkPricingBillingModel,
): string {
  if (billingModel === "prepaid") {
    return copy.service.budgetGuardRechargeControlled;
  }

  if (billingModel === "hybrid") {
    return copy.service.budgetGuardCentralBudgetInvoiceWorkflow;
  }

  if (billingModel === "subscription") {
    return billingPosture === "over-budget"
      ? copy.service.budgetGuardIncludedQuotaActiveWatch
      : copy.service.budgetGuardIncludedQuotaAlerts;
  }

  return billingPosture === "healthy"
    ? copy.service.budgetGuardRealtimeBillingAlerts
    : copy.service.budgetGuardBudgetWatchActive;
}

function isInvoiceReady(
  serviceTier: SdkworkPricingServiceTier,
  cadence: SdkworkPricingCadence,
  billingModel: SdkworkPricingBillingModel,
): boolean {
  return billingModel === "hybrid"
    || serviceTier === "team"
    || serviceTier === "enterprise"
    || cadence === "annual";
}

function resolveBestFitFor(
  copy: SdkworkPricingCopyContext,
  serviceTier: SdkworkPricingServiceTier,
  billingModel: SdkworkPricingBillingModel,
): string {
  if (billingModel === "usage") {
    return copy.service.bestFitVariableWorkloads;
  }

  if (billingModel === "prepaid") {
    return copy.service.bestFitBurstLaunches;
  }

  if (billingModel === "hybrid" || serviceTier === "enterprise") {
    return copy.service.bestFitSecurityProcurement;
  }

  if (serviceTier === "team") {
    return copy.service.bestFitCrossFunctional;
  }

  return copy.service.bestFitDailyIndividual;
}

function estimateAnnualSavings(
  priceCny: number,
  cadence: SdkworkPricingCadence,
): number {
  if (cadence !== "annual" || priceCny <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(priceCny * 0.2));
}

function createFeatureValues(options: {
  copy: SdkworkPricingCopyContext;
  billingModel: SdkworkPricingBillingModel;
  budgetGuard: string;
  cadence: SdkworkPricingCadence;
  includedPoints: number;
  includedUsage: string;
  invoiceReady: boolean;
  locale?: string | null;
  seatLimit: number | null;
}): Record<string, SdkworkPricingFeatureValue> {
  return {
    "billing-model": formatBillingModelLabel(options.copy, options.billingModel),
    "budget-guard": options.budgetGuard,
    cadence: formatCadenceLabel(options.copy, options.cadence),
    "included-points": formatIncludedPoints(
      options.copy,
      options.locale,
      options.includedPoints,
      options.cadence,
      options.billingModel,
    ),
    "included-usage": options.includedUsage,
    "invoice-ready": options.invoiceReady,
    "seat-limit": formatSdkworkPricingSeatLimit(options.seatLimit),
  };
}

function buildUsagePlan(
  copy: SdkworkPricingCopyContext,
  locale: string | null | undefined,
  messages: SdkworkPricingMessagesOverrides | undefined,
  billingPosture: SdkworkBillingPosture,
  current: boolean,
  recommended: boolean,
): SdkworkPricingPlan {
  return createSdkworkPricingUsagePlan({
    current,
    featureValues: createFeatureValues({
      copy,
      billingModel: "usage",
      budgetGuard: resolveBudgetGuardLabel(copy, billingPosture, "usage"),
      cadence: "metered",
      includedPoints: 0,
      includedUsage: copy.service.meteredAsConsumed,
      invoiceReady: false,
      locale,
      seatLimit: 1,
    }),
    locale,
    messages,
    recommended,
  });
}

function buildRechargePlan(
  rechargePackage: SdkworkWalletRechargePackage,
  copy: SdkworkPricingCopyContext,
  locale: string | null | undefined,
  billingPosture: SdkworkBillingPosture,
): SdkworkPricingPlan {
  const seatLimit = 1;
  const formattedPrice = formatSdkworkCurrencyCny(rechargePackage.priceCny);

  return {
    action: createSdkworkCommercialAction({
      capability: "wallet",
      intent: "recharge",
      label: copy.service.actionTopUpWallet,
      route: createWalletRouteIntent({
        sectionId: "recharge",
      }).route,
    }),
    bestFitFor: resolveBestFitFor(copy, "pro", "prepaid"),
    billingModel: "prepaid",
    cadence: "one-time",
    current: false,
    description: rechargePackage.description?.trim() || copy.defaults.rechargeDescription,
    featureValues: createFeatureValues({
      copy,
      billingModel: "prepaid",
      budgetGuard: resolveBudgetGuardLabel(copy, billingPosture, "prepaid"),
      cadence: "one-time",
      includedPoints: rechargePackage.points,
      includedUsage: copy.defaults.rechargeIncludedUsage,
      invoiceReady: false,
      locale,
      seatLimit,
    }),
    id: `recharge-${rechargePackage.id}`,
    includedPoints: rechargePackage.points,
    includedUsage: copy.defaults.rechargeIncludedUsage,
    priceCny: rechargePackage.priceCny,
    priceLabel: formatSdkworkPricingTemplate(copy.service.pricePerPackValue, formattedPrice),
    recommended: rechargePackage.recommended,
    savingsComparedToMonthlyCny: 0,
    seatLimit,
    serviceTier: "pro",
    tags: dedupeTags([
      copy.service.tagCredits,
      ...(rechargePackage.recommended ? [copy.service.tagRecommended] : []),
    ]),
    title: rechargePackage.title,
  };
}

function buildSubscriptionPlans(
  subscriptionDashboard: SdkworkSubscriptionDashboardData,
  copy: SdkworkPricingCopyContext,
  locale: string | null | undefined,
  billingPosture: SdkworkBillingPosture,
): SdkworkPricingPlan[] {
  const plans = [...subscriptionDashboard.plans].sort(
    (left, right) => left.priceCny - right.priceCny || left.name.localeCompare(right.name),
  );
  const currentLevelName = subscriptionDashboard.summary.currentLevelName || "";
  const isMember = Boolean(subscriptionDashboard.summary.isMember);

  return plans.map((plan, index) => {
    const cadence = inferCadence(plan.durationDays);
    const serviceTier = inferServiceTier(plan, index, plans.length);
    const seatLimit = resolveSeatLimit(serviceTier, "subscription");
    const isCurrent = isMember && planMatchesCurrentLevel(plan, currentLevelName);
    const action = isCurrent
      ? "renew"
      : isMember
        ? "upgrade"
        : "purchase";
    const includedUsage = cadence === "annual"
      ? copy.service.includedAnnualQuota
      : copy.service.includedMonthlyQuota;
    const invoiceReady = isInvoiceReady(serviceTier, cadence, "subscription");
    const formattedPrice = formatSdkworkCurrencyCny(plan.priceCny);
    const actionLabel = isCurrent
      ? copy.service.actionRenewCurrentPlan
      : isMember
        ? formatSdkworkPricingTemplate(copy.service.actionUpgradeToValue, plan.name)
        : formatSdkworkPricingTemplate(copy.service.actionStartValue, plan.name);

    return {
      action: createSdkworkCommercialAction({
        capability: "subscription",
        intent: action,
        label: actionLabel,
        route: createSubscriptionRouteIntent({
          mode: action,
          packageId: plan.packageId,
        }).route,
      }),
      bestFitFor: resolveBestFitFor(copy, serviceTier, "subscription"),
      billingModel: "subscription",
      cadence,
      current: isCurrent,
      description: plan.description?.trim() || `${plan.name} pricing package.`,
      featureValues: createFeatureValues({
        copy,
        billingModel: "subscription",
        budgetGuard: resolveBudgetGuardLabel(copy, billingPosture, "subscription"),
        cadence,
        includedPoints: plan.includedPoints,
        includedUsage,
        invoiceReady,
        locale,
        seatLimit,
      }),
      id: plan.id,
      includedPoints: plan.includedPoints,
      includedUsage,
      priceCny: plan.priceCny,
      priceLabel: formatSdkworkPricingTemplate(
        cadence === "annual" ? copy.service.pricePerYearValue : copy.service.pricePerMonthValue,
        formattedPrice,
      ),
      recommended: plan.recommended,
      savingsComparedToMonthlyCny: estimateAnnualSavings(plan.priceCny, cadence),
      seatLimit,
      serviceTier,
      tags: dedupeTags([
        ...plan.tags,
        serviceTier === "team"
          ? copy.service.tagTeam
          : serviceTier === "pro"
            ? copy.service.tagPro
            : copy.service.tagEnterprise,
        cadence === "annual" ? copy.service.tagAnnual : copy.service.tagMonthly,
      ]),
      title: plan.name,
    };
  });
}

function buildHybridPlan(
  copy: SdkworkPricingCopyContext,
  locale: string | null | undefined,
  messages: SdkworkPricingMessagesOverrides | undefined,
  billingPosture: SdkworkBillingPosture,
  offerDashboard: SdkworkOfferDashboardData,
): SdkworkPricingPlan {
  return createSdkworkPricingHybridPlan({
    description: copy.defaults.hybridPlanDescription,
    featureValues: createFeatureValues({
      copy,
      billingModel: "hybrid",
      budgetGuard: resolveBudgetGuardLabel(copy, billingPosture, "hybrid"),
      cadence: "monthly",
      includedPoints: 0,
      includedUsage: copy.service.hybridOverflowUsage,
      invoiceReady: true,
      locale,
      seatLimit: null,
    }),
    locale,
    messages,
    recommended: billingPosture !== "healthy" || offerDashboard.digest.membershipOffers > 0,
    tags: dedupeTags([
      copy.service.tagEnterprise,
      ...(offerDashboard.digest.membershipOffers > 0 ? [copy.service.tagUpgradePath] : []),
    ]),
  });
}

function createSummary(options: {
  billingPosture: SdkworkBillingPosture;
  copy: SdkworkPricingCopyContext;
  hasSession: boolean;
  offerDashboard: SdkworkOfferDashboardData;
  subscriptionDashboard: SdkworkSubscriptionDashboardData;
  walletOverview: SdkworkWalletOverview;
}): SdkworkPricingSummary {
  return {
    activeSubscriptionPlans: options.subscriptionDashboard.plans.length,
    availablePoints: options.walletOverview.account.availablePoints,
    bestOfferSavingsCny: options.offerDashboard.digest.highlightedSavingsCny,
    budgetPosture: options.billingPosture,
    currentLevelName:
      options.subscriptionDashboard.summary.currentLevelName
      || options.copy.defaults.currentLevelName,
    isAuthenticated: options.walletOverview.isAuthenticated || options.hasSession,
    walletBalanceCny: roundCurrency(options.walletOverview.account.cashAvailable),
  };
}

function selectRechargePackage(
  rechargePackages: readonly SdkworkWalletRechargePackage[],
): SdkworkWalletRechargePackage | null {
  return [...rechargePackages].sort(
    (left, right) =>
      Number(right.recommended) - Number(left.recommended)
      || left.priceCny - right.priceCny
      || left.title.localeCompare(right.title),
  )[0] ?? null;
}

function createCatalog(
  plans: readonly SdkworkPricingPlan[],
  summary: SdkworkPricingSummary,
  options: Pick<CreateSdkworkPricingServiceOptions, "locale" | "messages"> = {},
): SdkworkPricingCatalogData {
  const catalog = createEmptySdkworkPricingCatalog({
    locale: options.locale,
    messages: options.messages,
    plans,
    summary,
  });

  catalog.digest.highestSavingsCny = Math.max(
    catalog.digest.highestSavingsCny,
    summary.bestOfferSavingsCny,
  );

  return catalog;
}

export function createSdkworkPricingService(
  options: CreateSdkworkPricingServiceOptions = {},
): SdkworkPricingService {
  const copy = createSdkworkPricingMessages(options.locale, options.messages);
  const childServiceOptions = {
    locale: options.locale,
    membershipAppService: options.membershipAppService,
    promotionAppService: options.promotionAppService,
    walletAppService: options.accountAppService,
  };
  const billingService: Pick<SdkworkBillingService, "getDashboard" | "getEmptyDashboard"> = options.billingService
    ? {
        ...createSdkworkBillingService(),
        ...options.billingService,
      }
    : createSdkworkBillingService();
  const offerService: Pick<SdkworkOfferService, "getDashboard" | "getEmptyDashboard"> = options.offerService
    ? {
        ...createSdkworkOfferService(childServiceOptions),
        ...options.offerService,
      }
    : createSdkworkOfferService(childServiceOptions);
  const subscriptionService: Pick<SdkworkSubscriptionService, "getDashboard" | "getEmptyDashboard"> = options.subscriptionService
    ? {
        ...createSdkworkSubscriptionService({
          locale: options.locale,
          membershipAppService: options.membershipAppService,
        }),
        ...options.subscriptionService,
      }
    : createSdkworkSubscriptionService({
        locale: options.locale,
        membershipAppService: options.membershipAppService,
      });
  const walletService: Pick<SdkworkWalletService, "getOverview"> = options.walletService
    ? {
        ...createSdkworkWalletService({
          accountAppService: options.accountAppService,
        }),
        ...options.walletService,
      }
    : createSdkworkWalletService({
        accountAppService: options.accountAppService,
      });

  return {
    getEmptyCatalog() {
      const hasSession = hasSdkworkPromotionSession();
      return createEmptySdkworkPricingCatalog({
        locale: options.locale,
        messages: options.messages,
        summary: {
          isAuthenticated: hasSession,
        },
      });
    },

    async getCatalog() {
      const hasSession = hasSdkworkPromotionSession();

      const [walletOverview, subscriptionDashboard, billingDashboard, offerDashboard] = await Promise.all([
        walletService.getOverview(),
        subscriptionService.getDashboard(),
        billingService.getDashboard(),
        offerService.getDashboard(),
      ]);
      const summary = createSummary({
        billingPosture: billingDashboard.posture,
        copy,
        hasSession,
        offerDashboard,
        subscriptionDashboard,
        walletOverview,
      });
      const subscriptionPlans = buildSubscriptionPlans(
        subscriptionDashboard,
        copy,
        options.locale,
        billingDashboard.posture,
      );
      const hasCurrentSubscription = subscriptionPlans.some((plan) => plan.current);
      const rechargePackage = selectRechargePackage(walletOverview.rechargePackages);
      const plans: SdkworkPricingPlan[] = [
        ...subscriptionPlans,
        ...(rechargePackage ? [buildRechargePlan(rechargePackage, copy, options.locale, billingDashboard.posture)] : []),
        buildUsagePlan(
          copy,
          options.locale,
          options.messages,
          billingDashboard.posture,
          !hasCurrentSubscription,
          subscriptionPlans.length === 0 && !rechargePackage,
        ),
        buildHybridPlan(
          copy,
          options.locale,
          options.messages,
          billingDashboard.posture,
          offerDashboard,
        ),
      ];

      return createCatalog(plans, summary, {
        locale: options.locale,
        messages: options.messages,
      });
    },
  };
}

export const sdkworkPricingService = createSdkworkPricingService();
