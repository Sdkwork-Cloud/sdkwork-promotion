import { formatSdkworkPromotionPoints as formatSdkworkPoints } from "@sdkwork/promotion-service";

export type SdkworkPricingLocale = "en-US" | "zh-CN";
type SdkworkPricingBillingModel = "hybrid" | "prepaid" | "subscription" | "usage";
type SdkworkPricingCadence = "annual" | "metered" | "monthly" | "one-time";

export type SdkworkPricingMessagesOverrides = DeepPartial<SdkworkPricingMessages>;

export interface SdkworkPricingMessages {
  actions: {
    current: string;
    focus: string;
    recommended: string;
    refresh: string;
    select: string;
    selected: string;
  };
  billingModel: {
    all: string;
    hybrid: string;
    prepaid: string;
    subscription: string;
    usage: string;
  };
  cadence: {
    annual: string;
    metered: string;
    monthly: string;
    oneTime: string;
  };
  comparison: {
    emptyDescription: string;
    emptyTitle: string;
    feature: string;
    focusPlanAria: string;
    included: string;
    notIncluded: string;
  };
  controller: {
    bootstrapFailed: string;
  };
  defaults: {
    currentLevelName: string;
    hybridIncludedUsage: string;
    hybridPlanDescription: string;
    hybridPlanPriceLabel: string;
    hybridPlanTitle: string;
    none: string;
    rechargeDescription: string;
    rechargeIncludedUsage: string;
    usageIncludedUsage: string;
    usagePlanDescription: string;
    usagePlanPriceLabel: string;
    usagePlanTitle: string;
  };
  featureMatrix: {
    billingModel: string;
    budgetGuard: string;
    cadence: string;
    includedPoints: string;
    includedUsage: string;
    invoiceReady: string;
    seatLimit: string;
  };
  manifest: {
    description: string;
    title: string;
  };
  metrics: {
    activeSubscriptions: string;
    availablePoints: string;
    bestFit: string;
    bestSavingsSignal: string;
    billingModel: string;
    budgetPosture: string;
    currentPlan: string;
    noPlanSelected: string;
    noPlanSelectedDescription: string;
    price: string;
    savingsSignal: string;
    selectedPlan: string;
    walletBalance: string;
    workspacePostureValue: string;
  };
  page: {
    description: string;
    errorTitle: string;
    eyebrow: string;
    loading: string;
    title: string;
  };
  planCards: {
    bestForValue: string;
    cadence: string;
    emptyDescription: string;
    emptyTitle: string;
    includedPoints: string;
    none: string;
    seatLimit: string;
    selectPlanAria: string;
    togglePlanAria: string;
    usagePosture: string;
  };
  posture: {
    healthy: string;
    overBudget: string;
    paymentAttention: string;
    watch: string;
  };
  priceBook: {
    eyebrow: string;
    title: string;
  };
  seats: {
    custom: string;
    pluralValue: string;
    singular: string;
  };
  summary: {
    activeSubscriptions: string;
    availablePoints: string;
    bestSavingsSignal: string;
  };
  service: {
    actionOpenBilling: string;
    actionRenewCurrentPlan: string;
    actionReviewEnterprisePath: string;
    actionStartValue: string;
    actionTopUpWallet: string;
    actionUpgradeToValue: string;
    bestFitBurstLaunches: string;
    bestFitCrossFunctional: string;
    bestFitDailyIndividual: string;
    bestFitSecurityProcurement: string;
    bestFitVariableWorkloads: string;
    budgetGuardBudgetWatchActive: string;
    budgetGuardCentralBudgetInvoiceWorkflow: string;
    budgetGuardIncludedQuotaActiveWatch: string;
    budgetGuardIncludedQuotaAlerts: string;
    budgetGuardRealtimeBillingAlerts: string;
    budgetGuardRechargeControlled: string;
    hybridOverflowUsage: string;
    includedAnnualQuota: string;
    includedMonthlyQuota: string;
    meteredAsConsumed: string;
    pointsCreditsValue: string;
    pricePerPackValue: string;
    pricePerMonthValue: string;
    pricePerYearValue: string;
    quotaPerMonthValue: string;
    quotaPerYearValue: string;
    rechargeCreditsUsage: string;
    rechargeOnDemand: string;
    tagAnnual: string;
    tagCredits: string;
    tagEnterprise: string;
    tagMonthly: string;
    tagNoCommitment: string;
    tagPro: string;
    tagRecommended: string;
    tagTeam: string;
    tagUpgradePath: string;
  };
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep<T>(base: T, overrides?: DeepPartial<T>): T {
  if (!overrides) {
    return base;
  }

  const output: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      continue;
    }

    const baseValue = output[key];
    output[key] = isRecord(baseValue) && isRecord(value)
      ? mergeDeep(baseValue, value)
      : value;
  }

  return output as T;
}

const EN_US_MESSAGES: SdkworkPricingMessages = {
  actions: {
    current: "Current",
    focus: "Focus",
    recommended: "Recommended",
    refresh: "Refresh pricing",
    select: "Select",
    selected: "Selected",
  },
  billingModel: {
    all: "All",
    hybrid: "Hybrid",
    prepaid: "Prepaid",
    subscription: "Subscription",
    usage: "Usage",
  },
  cadence: {
    annual: "Annual",
    metered: "Metered",
    monthly: "Monthly",
    oneTime: "One-time",
  },
  comparison: {
    emptyDescription: "Plan comparison will appear when pricing plans are available.",
    emptyTitle: "No comparison data",
    feature: "Feature",
    focusPlanAria: "Focus {value}",
    included: "Included",
    notIncluded: "Not included",
  },
  controller: {
    bootstrapFailed: "Failed to load pricing center.",
  },
  defaults: {
    currentLevelName: "Pay as you go",
    hybridIncludedUsage: "Included quota + overflow metering",
    hybridPlanDescription: "Blend included quota, custom governance, and metered overflow in one enterprise-grade package.",
    hybridPlanPriceLabel: "Custom",
    hybridPlanTitle: "Enterprise Hybrid",
    none: "None",
    rechargeDescription: "Recharge credits for burst usage and launch windows.",
    rechargeIncludedUsage: "Recharge credits",
    usageIncludedUsage: "Metered as consumed",
    usagePlanDescription: "Start with usage-based billing and scale only when demand proves out.",
    usagePlanPriceLabel: "Usage based",
    usagePlanTitle: "Pay as you go",
  },
  featureMatrix: {
    billingModel: "Billing model",
    budgetGuard: "Budget guard",
    cadence: "Cadence",
    includedPoints: "Included points",
    includedUsage: "Included usage",
    invoiceReady: "Invoice-ready",
    seatLimit: "Seat limit",
  },
  manifest: {
    description: "Pricing workspace for normalized price books, plan comparison, bundle strategy, and commercial routing across one reusable desktop center.",
    title: "Pricing",
  },
  metrics: {
    activeSubscriptions: "Active subscriptions",
    availablePoints: "Available points",
    bestFit: "Best fit",
    bestSavingsSignal: "Best savings signal",
    billingModel: "Billing model",
    budgetPosture: "Budget posture",
    currentPlan: "Current plan",
    noPlanSelected: "No plan selected",
    noPlanSelectedDescription: "Select a plan to inspect the recommended commercial route.",
    price: "Price",
    savingsSignal: "Savings signal",
    selectedPlan: "Selected plan",
    walletBalance: "Wallet balance",
    workspacePostureValue: "{value} workspace posture",
  },
  page: {
    description: "Normalize price books, compare billing models, and route directly into the best subscription, recharge, billing, or enterprise path.",
    errorTitle: "Pricing center error",
    eyebrow: "Commercial Pricing",
    loading: "Loading pricing center...",
    title: "Pricing Center",
  },
  planCards: {
    bestForValue: "Best for {value}.",
    cadence: "Cadence",
    emptyDescription: "No pricing plans are currently available in this workspace.",
    emptyTitle: "No pricing plans",
    includedPoints: "Included points",
    none: "None",
    seatLimit: "Seat limit",
    selectPlanAria: "Select {value}",
    togglePlanAria: "Toggle {value}",
    usagePosture: "Usage posture",
  },
  posture: {
    healthy: "Healthy",
    overBudget: "Over budget",
    paymentAttention: "Payment attention",
    watch: "Watch",
  },
  priceBook: {
    eyebrow: "Price book",
    title: "Commercial package comparison",
  },
  seats: {
    custom: "Custom",
    pluralValue: "{value} seats",
    singular: "1 seat",
  },
  summary: {
    activeSubscriptions: "Active subscriptions",
    availablePoints: "Available points",
    bestSavingsSignal: "Best savings signal",
  },
  service: {
    actionOpenBilling: "Open billing",
    actionRenewCurrentPlan: "Renew current plan",
    actionReviewEnterprisePath: "Review enterprise path",
    actionStartValue: "Start {value}",
    actionTopUpWallet: "Top up wallet",
    actionUpgradeToValue: "Upgrade to {value}",
    bestFitBurstLaunches: "Burst launches and seasonal campaigns",
    bestFitCrossFunctional: "Cross-functional production workflows",
    bestFitDailyIndividual: "Daily individual usage",
    bestFitSecurityProcurement: "Security, procurement, and shared governance",
    bestFitVariableWorkloads: "Variable workloads and pilot launches",
    budgetGuardBudgetWatchActive: "Budget watch active",
    budgetGuardCentralBudgetInvoiceWorkflow: "Central budget + invoice workflow",
    budgetGuardIncludedQuotaActiveWatch: "Included quota + active watch",
    budgetGuardIncludedQuotaAlerts: "Included quota + alerts",
    budgetGuardRealtimeBillingAlerts: "Realtime billing alerts",
    budgetGuardRechargeControlled: "Recharge controlled",
    hybridOverflowUsage: "Included quota + overflow metering",
    includedAnnualQuota: "Included annual quota",
    includedMonthlyQuota: "Included monthly quota",
    meteredAsConsumed: "Metered as consumed",
    pointsCreditsValue: "{value} credits",
    pricePerPackValue: "{value} / pack",
    pricePerMonthValue: "{value} / month",
    pricePerYearValue: "{value} / year",
    quotaPerMonthValue: "{value} / month",
    quotaPerYearValue: "{value} / year",
    rechargeCreditsUsage: "Recharge credits",
    rechargeOnDemand: "Recharge on demand",
    tagAnnual: "Annual",
    tagCredits: "Credits",
    tagEnterprise: "Enterprise",
    tagMonthly: "Monthly",
    tagNoCommitment: "No commitment",
    tagPro: "Pro",
    tagRecommended: "Recommended",
    tagTeam: "Team",
    tagUpgradePath: "Upgrade path",
  },
};

const ZH_CN_MESSAGES: SdkworkPricingMessages = {
  actions: {
    current: "\u5f53\u524d\u65b9\u6848",
    focus: "\u805a\u7126",
    recommended: "\u63a8\u8350",
    refresh: "\u5237\u65b0\u5b9a\u4ef7",
    select: "\u9009\u62e9",
    selected: "\u5df2\u9009\u62e9",
  },
  billingModel: {
    all: "\u5168\u90e8",
    hybrid: "\u6df7\u5408\u8ba1\u8d39",
    prepaid: "\u9884\u4ed8\u8d39",
    subscription: "\u8ba2\u9605\u5236",
    usage: "\u6309\u91cf\u8ba1\u8d39",
  },
  cadence: {
    annual: "\u5e74\u4ed8",
    metered: "\u6309\u91cf",
    monthly: "\u6708\u4ed8",
    oneTime: "\u4e00\u6b21\u6027",
  },
  comparison: {
    emptyDescription: "\u5f53\u524d\u6709\u53ef\u7528\u5b9a\u4ef7\u65b9\u6848\u65f6\uff0c\u5bf9\u6bd4\u77e9\u9635\u5c06\u663e\u793a\u5728\u6b64\u5904\u3002",
    emptyTitle: "\u6682\u65e0\u5bf9\u6bd4\u6570\u636e",
    feature: "\u529f\u80fd",
    focusPlanAria: "\u805a\u7126 {value}",
    included: "\u5305\u542b",
    notIncluded: "\u4e0d\u5305\u542b",
  },
  controller: {
    bootstrapFailed: "\u52a0\u8f7d\u5b9a\u4ef7\u4e2d\u5fc3\u5931\u8d25\u3002",
  },
  defaults: {
    currentLevelName: "\u6309\u91cf\u4ed8\u8d39",
    hybridIncludedUsage: "\u5305\u542b\u989d\u5ea6 + \u8d85\u91cf\u8ba1\u8d39",
    hybridPlanDescription: "\u5c06\u5305\u542b\u989d\u5ea6\u3001\u81ea\u5b9a\u4e49\u6cbb\u7406\u548c\u8d85\u91cf\u8ba1\u8d39\u6574\u5408\u5230\u540c\u4e00\u4e2a\u4f01\u4e1a\u7ea7\u5546\u4e1a\u5316\u65b9\u6848\u4e2d\u3002",
    hybridPlanPriceLabel: "\u5b9a\u5236\u62a5\u4ef7",
    hybridPlanTitle: "\u4f01\u4e1a\u6df7\u5408\u65b9\u6848",
    none: "\u65e0",
    rechargeDescription: "\u4e3a\u51b2\u523a\u53d1\u5e03\u548c\u6d3b\u52a8\u7a97\u53e3\u8865\u5145\u989d\u5ea6\u3002",
    rechargeIncludedUsage: "\u5145\u503c\u79ef\u5206",
    usageIncludedUsage: "\u6309\u5b9e\u9645\u7528\u91cf\u8ba1\u8d39",
    usagePlanDescription: "\u4ece\u6309\u91cf\u8ba1\u8d39\u5f00\u59cb\uff0c\u7b49\u9700\u6c42\u7a33\u5b9a\u540e\u518d\u5347\u7ea7\u5230\u66f4\u9ad8\u9636\u65b9\u6848\u3002",
    usagePlanPriceLabel: "\u6309\u91cf\u8ba1\u8d39",
    usagePlanTitle: "\u6309\u91cf\u4ed8\u8d39",
  },
  featureMatrix: {
    billingModel: "\u8ba1\u8d39\u6a21\u578b",
    budgetGuard: "\u9884\u7b97\u5b88\u62a4",
    cadence: "\u8ba1\u8d39\u5468\u671f",
    includedPoints: "\u5305\u542b\u79ef\u5206",
    includedUsage: "\u5305\u542b\u7528\u91cf",
    invoiceReady: "\u652f\u6301\u53d1\u7968",
    seatLimit: "\u5e2d\u4f4d\u4e0a\u9650",
  },
  manifest: {
    description: "\u7528\u4e8e\u7edf\u4e00\u7ef4\u62a4\u4ef7\u683c\u672c\u3001\u5bf9\u6bd4\u5957\u9910\u3001\u7b56\u5212\u5546\u4e1a\u7ec4\u5408\u548c\u5546\u4e1a\u5316\u8def\u7531\u7684\u5b9a\u4ef7\u5de5\u4f5c\u533a\u3002",
    title: "\u5b9a\u4ef7",
  },
  metrics: {
    activeSubscriptions: "\u5df2\u542f\u7528\u8ba2\u9605",
    availablePoints: "\u53ef\u7528\u79ef\u5206",
    bestFit: "\u9002\u5408\u573a\u666f",
    bestSavingsSignal: "\u6700\u4f18\u8282\u7701\u4fe1\u53f7",
    billingModel: "\u8ba1\u8d39\u6a21\u5f0f",
    budgetPosture: "\u9884\u7b97\u6001\u52bf",
    currentPlan: "\u5f53\u524d\u65b9\u6848",
    noPlanSelected: "\u6682\u672a\u9009\u62e9\u65b9\u6848",
    noPlanSelectedDescription: "\u9009\u62e9\u4e00\u4e2a\u65b9\u6848\u67e5\u770b\u63a8\u8350\u7684\u5546\u4e1a\u5316\u8def\u5f84\u3002",
    price: "\u4ef7\u683c",
    savingsSignal: "\u8282\u7701\u4fe1\u53f7",
    selectedPlan: "\u5df2\u9009\u65b9\u6848",
    walletBalance: "\u94b1\u5305\u4f59\u989d",
    workspacePostureValue: "{value} \u5de5\u4f5c\u533a\u6001\u52bf",
  },
  page: {
    description: "\u7edf\u4e00\u7ef4\u62a4\u4ef7\u683c\u672c\uff0c\u5bf9\u6bd4\u4e0d\u540c\u8ba1\u8d39\u6a21\u5f0f\uff0c\u5e76\u76f4\u63a5\u8def\u7531\u5230\u6700\u5408\u9002\u7684\u8ba2\u9605\uff0c\u5145\u503c\uff0c\u8d26\u5355\u6216\u4f01\u4e1a\u5316\u65b9\u6848\u3002",
    errorTitle: "\u5b9a\u4ef7\u4e2d\u5fc3\u5f02\u5e38",
    eyebrow: "\u5546\u4e1a\u5316\u5b9a\u4ef7",
    loading: "\u6b63\u5728\u52a0\u8f7d\u5b9a\u4ef7\u4e2d\u5fc3...",
    title: "\u5b9a\u4ef7\u4e2d\u5fc3",
  },
  planCards: {
    bestForValue: "\u9002\u5408 {value}\u3002",
    cadence: "\u8ba1\u8d39\u5468\u671f",
    emptyDescription: "\u5f53\u524d\u5de5\u4f5c\u533a\u6682\u65e0\u53ef\u7528\u7684\u5b9a\u4ef7\u65b9\u6848\u3002",
    emptyTitle: "\u6682\u65e0\u5b9a\u4ef7\u65b9\u6848",
    includedPoints: "\u5305\u542b\u79ef\u5206",
    none: "\u65e0",
    seatLimit: "\u5e2d\u4f4d\u4e0a\u9650",
    selectPlanAria: "\u9009\u62e9 {value}",
    togglePlanAria: "\u5207\u6362 {value}",
    usagePosture: "\u7528\u91cf\u6001\u52bf",
  },
  posture: {
    healthy: "\u5065\u5eb7",
    overBudget: "\u8d85\u51fa\u9884\u7b97",
    paymentAttention: "\u652f\u4ed8\u5f85\u5904\u7406",
    watch: "\u9700\u8981\u5173\u6ce8",
  },
  priceBook: {
    eyebrow: "\u4ef7\u683c\u672c",
    title: "\u5546\u4e1a\u5316\u5957\u9910\u5bf9\u6bd4",
  },
  seats: {
    custom: "\u81ea\u5b9a\u4e49",
    pluralValue: "{value} \u4e2a\u5e2d\u4f4d",
    singular: "1 \u4e2a\u5e2d\u4f4d",
  },
  summary: {
    activeSubscriptions: "\u5df2\u542f\u7528\u8ba2\u9605",
    availablePoints: "\u53ef\u7528\u79ef\u5206",
    bestSavingsSignal: "\u6700\u4f18\u8282\u7701\u4fe1\u53f7",
  },
  service: {
    actionOpenBilling: "\u6253\u5f00\u8d26\u5355\u4e2d\u5fc3",
    actionRenewCurrentPlan: "\u7eed\u8d39\u5f53\u524d\u65b9\u6848",
    actionReviewEnterprisePath: "\u67e5\u770b\u4f01\u4e1a\u65b9\u6848",
    actionStartValue: "\u5f00\u901a {value}",
    actionTopUpWallet: "\u5145\u503c\u94b1\u5305",
    actionUpgradeToValue: "\u5347\u7ea7\u5230 {value}",
    bestFitBurstLaunches: "\u51b2\u523a\u53d1\u5e03\u4e0e\u9636\u6bb5\u6027\u6d3b\u52a8",
    bestFitCrossFunctional: "\u8de8\u804c\u80fd\u534f\u540c\u751f\u4ea7\u6d41\u7a0b",
    bestFitDailyIndividual: "\u4e2a\u4eba\u65e5\u5e38\u9ad8\u9891\u4f7f\u7528",
    bestFitSecurityProcurement: "\u9002\u5408\u5b89\u5168\u3001\u91c7\u8d2d\u4e0e\u7edf\u4e00\u6cbb\u7406",
    bestFitVariableWorkloads: "\u6ce2\u52a8\u578b\u5de5\u4f5c\u8d1f\u8f7d\u4e0e\u8bd5\u70b9\u9879\u76ee",
    budgetGuardBudgetWatchActive: "\u9884\u7b97\u76d1\u63a7\u5df2\u5f00\u542f",
    budgetGuardCentralBudgetInvoiceWorkflow: "\u7edf\u4e00\u9884\u7b97 + \u53d1\u7968\u6d41\u7a0b",
    budgetGuardIncludedQuotaActiveWatch: "\u5305\u542b\u989d\u5ea6 + \u4e3b\u52a8\u76d1\u63a7",
    budgetGuardIncludedQuotaAlerts: "\u5305\u542b\u989d\u5ea6 + \u9884\u7b97\u63d0\u9192",
    budgetGuardRealtimeBillingAlerts: "\u5b9e\u65f6\u8ba1\u8d39\u63d0\u9192",
    budgetGuardRechargeControlled: "\u5145\u503c\u989d\u5ea6\u53ef\u63a7",
    hybridOverflowUsage: "\u5305\u542b\u989d\u5ea6 + \u8d85\u91cf\u8ba1\u8d39",
    includedAnnualQuota: "\u5305\u542b\u5e74\u5ea6\u989d\u5ea6",
    includedMonthlyQuota: "\u5305\u542b\u6708\u5ea6\u989d\u5ea6",
    meteredAsConsumed: "\u6309\u5b9e\u9645\u7528\u91cf\u8ba1\u8d39",
    pointsCreditsValue: "{value} \u79ef\u5206",
    pricePerPackValue: "{value} / \u5305",
    pricePerMonthValue: "{value} / \u6708",
    pricePerYearValue: "{value} / \u5e74",
    quotaPerMonthValue: "{value} / \u6708",
    quotaPerYearValue: "{value} / \u5e74",
    rechargeCreditsUsage: "\u5145\u503c\u79ef\u5206",
    rechargeOnDemand: "\u6309\u9700\u5145\u503c",
    tagAnnual: "\u5e74\u4ed8",
    tagCredits: "\u79ef\u5206",
    tagEnterprise: "\u4f01\u4e1a",
    tagMonthly: "\u6708\u4ed8",
    tagNoCommitment: "\u65e0\u627f\u8bfa",
    tagPro: "\u4e13\u4e1a\u7248",
    tagRecommended: "\u63a8\u8350",
    tagTeam: "\u56e2\u961f\u7248",
    tagUpgradePath: "\u5347\u7ea7\u8def\u5f84",
  },
};

const SDKWORK_PRICING_MESSAGES: Record<SdkworkPricingLocale, SdkworkPricingMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

function interpolateTemplate(template: string, value: string): string {
  return template.replaceAll("{value}", value);
}

export function normalizeSdkworkPricingLocale(locale?: string | null): SdkworkPricingLocale {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

export function createSdkworkPricingMessages(
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): SdkworkPricingMessages {
  return mergeDeep(
    SDKWORK_PRICING_MESSAGES[normalizeSdkworkPricingLocale(locale)],
    overrides,
  );
}

export function formatSdkworkPricingBillingModelLabel(
  value: SdkworkPricingBillingModel | "all",
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value === "all") {
    return copy.billingModel.all;
  }

  return copy.billingModel[value];
}

export function formatSdkworkPricingCadenceLabel(
  value: SdkworkPricingCadence,
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value === "one-time") {
    return copy.cadence.oneTime;
  }

  return copy.cadence[value];
}

export function formatSdkworkPricingBudgetPostureLabel(
  value: string,
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value === "healthy") {
    return copy.posture.healthy;
  }

  if (value === "watch") {
    return copy.posture.watch;
  }

  if (value === "over-budget") {
    return copy.posture.overBudget;
  }

  if (value === "payment-attention") {
    return copy.posture.paymentAttention;
  }

  return value;
}

export function formatSdkworkPricingSeatLimitLabel(
  value: number | null,
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value === null) {
    return copy.seats.custom;
  }

  if (value <= 1) {
    return copy.seats.singular;
  }

  return interpolateTemplate(copy.seats.pluralValue, String(value));
}

export function formatSdkworkPricingIncludedPointsLabel(
  value: number,
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value <= 0) {
    return copy.planCards.none;
  }

  return formatSdkworkPoints(value, normalizeSdkworkPricingLocale(locale));
}

export function formatSdkworkPricingTemplate(
  template: string,
  value: string,
): string {
  return interpolateTemplate(template, value);
}

export function formatSdkworkPricingFeatureLabel(
  value: string,
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): string {
  const copy = createSdkworkPricingMessages(locale, overrides);

  if (value === "billing-model") {
    return copy.featureMatrix.billingModel;
  }

  if (value === "cadence") {
    return copy.featureMatrix.cadence;
  }

  if (value === "included-points") {
    return copy.featureMatrix.includedPoints;
  }

  if (value === "included-usage") {
    return copy.featureMatrix.includedUsage;
  }

  if (value === "seat-limit") {
    return copy.featureMatrix.seatLimit;
  }

  if (value === "budget-guard") {
    return copy.featureMatrix.budgetGuard;
  }

  if (value === "invoice-ready") {
    return copy.featureMatrix.invoiceReady;
  }

  return value;
}
