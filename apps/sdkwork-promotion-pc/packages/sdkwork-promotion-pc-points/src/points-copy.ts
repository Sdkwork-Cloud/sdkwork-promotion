import {
  formatSdkworkPromotionCurrencyCny as formatSdkworkCurrencyCny,
  formatSdkworkPromotionPoints as formatSdkworkPoints,
  formatSdkworkPromotionPointsRate as formatSdkworkPointsRate,
} from "@sdkwork/promotion-service";
import type { SdkworkPointsCurrentPlan } from "./points-service";

export type SdkworkPointsLocale = "en-US" | "zh-CN";

export type SdkworkPointsMessagesOverrides = DeepPartial<SdkworkPointsMessages>;

export interface SdkworkPointsMessages {
  actions: {
    cancel: string;
    confirmPayment: string;
    confirmRecharge: string;
    openCenter: string;
    recharge: string;
    rechargePoints: string;
    upgrade: string;
    upgradeMembership: string;
  };
  common: {
    days: string;
    flexibleDuration: string;
    points: string;
  };
  filters: {
    all: string;
    earned: string;
    spent: string;
  };
  format: {
    daysRemainingValue: string;
    pointsIncludedValue: string;
  };
  headerEntry: {
    balanceAriaLabel: string;
    pointsSuffix: string;
  };
  page: {
    availablePointsLabel: string;
    currentPlanLabel: string;
    description: string;
    earnedThisMonthLabel: string;
    errorTitle: string;
    exchangeRateLabel: string;
    eyebrow: string;
    loading: string;
    noPremiumTerm: string;
    primaryAction: string;
    rateLabel: string;
    readyForGrowth: string;
    secondaryAction: string;
    signInRequired: string;
    spentThisMonthLabel: string;
    title: string;
  };
  paymentMethod: {
    ALIPAY: string;
    BANKCARD: string;
    WECHAT: string;
  };
  plan: {
    active: string;
    free: string;
    guest: string;
  };
  quickPanel: {
    availablePointsLabel: string;
    currentMonthLabel: string;
    currentPlanLabel: string;
    fallbackDescription: string;
    noRecentActivity: string;
    openCenterAction: string;
    recentActivityTitle: string;
    signInToUnlock: string;
  };
  rechargeDialog: {
    customAmountLabel: string;
    customAmountPlaceholder: string;
    description: string;
    estimatedPriceLabel: string;
    paymentMethodLabel: string;
    rateLabel: string;
    selectionEyebrow: string;
    signInRequiredDescription: string;
    signInRequiredTitle: string;
    title: string;
  };
  status: {
    completed: string;
    failed: string;
    pending: string;
  };
  transactionList: {
    description: string;
    emptyDescription: string;
    emptyTitle: string;
    fallbackDescription: string;
    recordsEyebrow: string;
    title: string;
  };
  upgradeDialog: {
    currentMembershipLabel: string;
    description: string;
    noPlanDescription: string;
    noPlanFallbackDescription: string;
    noPlanTitle: string;
    paymentMethodLabel: string;
    selected: string;
    selectedPackageLabel: string;
    selectPlan: string;
    signInRequiredDescription: string;
    signInRequiredTitle: string;
    title: string;
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

const EN_US_MESSAGES: SdkworkPointsMessages = {
  actions: {
    cancel: "Cancel",
    confirmPayment: "Confirm payment",
    confirmRecharge: "Confirm recharge",
    openCenter: "Open center",
    recharge: "Recharge",
    rechargePoints: "Recharge points",
    upgrade: "Upgrade",
    upgradeMembership: "Upgrade membership",
  },
  common: {
    days: "days",
    flexibleDuration: "Flexible duration",
    points: "points",
  },
  filters: {
    all: "All",
    earned: "Earned",
    spent: "Spent",
  },
  format: {
    daysRemainingValue: "{value} days remaining",
    pointsIncludedValue: "{value} points included",
  },
  headerEntry: {
    balanceAriaLabel: "Points balance",
    pointsSuffix: "pts",
  },
  page: {
    availablePointsLabel: "Available points",
    currentPlanLabel: "Current plan",
    description: "Recharge points, review commercial usage, and upgrade premium capacity through one reusable desktop surface.",
    earnedThisMonthLabel: "Earned this month",
    errorTitle: "Points center error",
    exchangeRateLabel: "Exchange rate",
    eyebrow: "Commerce",
    loading: "Loading points center...",
    noPremiumTerm: "No premium term active.",
    primaryAction: "Recharge points",
    rateLabel: "Rate",
    readyForGrowth: "Ready for growth.",
    secondaryAction: "Upgrade membership",
    signInRequired: "Sign in required.",
    spentThisMonthLabel: "Spent this month",
    title: "Points Center",
  },
  paymentMethod: {
    ALIPAY: "Alipay",
    BANKCARD: "Bank card",
    WECHAT: "WeChat Pay",
  },
  plan: {
    active: "Member",
    free: "Free",
    guest: "Guest",
  },
  quickPanel: {
    availablePointsLabel: "Available points",
    currentMonthLabel: "This month",
    currentPlanLabel: "Current plan",
    fallbackDescription: "Commercial usage event",
    noRecentActivity: "No recent activity yet.",
    openCenterAction: "Open center",
    recentActivityTitle: "Recent activity",
    signInToUnlock: "Sign in to unlock recharge and upgrades.",
  },
  rechargeDialog: {
    customAmountLabel: "Custom amount",
    customAmountPlaceholder: "Enter points",
    description: "Top up points using the shared wallet lane and keep the same premium flow used by Sdkwork Studio.",
    estimatedPriceLabel: "Estimated price",
    paymentMethodLabel: "Payment method",
    rateLabel: "Rate",
    selectionEyebrow: "Selection",
    signInRequiredDescription: "Recharge actions require an authenticated commercial session.",
    signInRequiredTitle: "Sign in required",
    title: "Recharge points",
  },
  status: {
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
  },
  transactionList: {
    description: "Recharge, usage, and upgrade events across the shared points commerce flow.",
    emptyDescription: "Once points activity starts flowing, records will appear here.",
    emptyTitle: "No transactions yet",
    fallbackDescription: "Commercial transaction",
    recordsEyebrow: "Records",
    title: "Transaction history",
  },
  upgradeDialog: {
    currentMembershipLabel: "Current membership",
    description: "Choose a premium package and extend the same Sdkwork-inspired commercial experience into any SDKWORK desktop app.",
    noPlanDescription: "No upgrade packages were returned by the current commerce service.",
    noPlanFallbackDescription: "Premium plan",
    noPlanTitle: "No plan available",
    paymentMethodLabel: "Payment method",
    selected: "Selected",
    selectedPackageLabel: "Selected package",
    selectPlan: "Select plan",
    signInRequiredDescription: "Membership upgrades require an authenticated session.",
    signInRequiredTitle: "Sign in required",
    title: "Upgrade membership",
  },
};

const ZH_CN_MESSAGES: SdkworkPointsMessages = {
  actions: {
    cancel: "取消",
    confirmPayment: "确认支付",
    confirmRecharge: "确认充值",
    openCenter: "打开中心",
    recharge: "充值",
    rechargePoints: "充值积分",
    upgrade: "升级",
    upgradeMembership: "升级会员",
  },
  common: {
    days: "天",
    flexibleDuration: "时长灵活",
    points: "积分",
  },
  filters: {
    all: "全部",
    earned: "获得",
    spent: "消耗",
  },
  format: {
    daysRemainingValue: "剩余 {value} 天",
    pointsIncludedValue: "包含 {value} 积分",
  },
  headerEntry: {
    balanceAriaLabel: "积分余额",
    pointsSuffix: "积分",
  },
  page: {
    availablePointsLabel: "可用积分",
    currentPlanLabel: "当前方案",
    description: "在一个可复用的桌面商业化界面中统一完成积分充值、商业消耗追踪与高级能力升级。",
    earnedThisMonthLabel: "本月获得",
    errorTitle: "积分中心异常",
    exchangeRateLabel: "兑换比例",
    eyebrow: "商业化",
    loading: "正在加载积分中心...",
    noPremiumTerm: "当前没有生效中的高级权益。",
    primaryAction: "充值积分",
    rateLabel: "兑换比例",
    readyForGrowth: "已准备好进入增长模式。",
    secondaryAction: "升级会员",
    signInRequired: "需要先登录。",
    spentThisMonthLabel: "本月消耗",
    title: "积分中心",
  },
  paymentMethod: {
    ALIPAY: "支付宝",
    BANKCARD: "银行卡",
    WECHAT: "微信支付",
  },
  plan: {
    free: "免费版",
    guest: "游客",
    active: "\u4f1a\u5458",
  },
  quickPanel: {
    availablePointsLabel: "可用积分",
    currentMonthLabel: "本月数据",
    currentPlanLabel: "当前方案",
    fallbackDescription: "商业化使用事件",
    noRecentActivity: "当前还没有最近活动。",
    openCenterAction: "打开中心",
    recentActivityTitle: "最近活动",
    signInToUnlock: "登录后即可解锁充值和升级能力。",
  },
  rechargeDialog: {
    customAmountLabel: "自定义数量",
    customAmountPlaceholder: "输入积分数量",
    description: "通过共享的钱包通道补充积分，并保持与 Sdkwork Studio 一致的高级商业化流程。",
    estimatedPriceLabel: "预计价格",
    paymentMethodLabel: "支付方式",
    rateLabel: "兑换比例",
    selectionEyebrow: "当前选择",
    signInRequiredDescription: "充值操作需要已登录的商业化会话。",
    signInRequiredTitle: "需要登录",
    title: "充值积分",
  },
  status: {
    completed: "已完成",
    failed: "失败",
    pending: "处理中",
  },
  transactionList: {
    description: "统一展示积分充值、使用与升级事件。",
    emptyDescription: "当积分活动开始流转后，记录会出现在这里。",
    emptyTitle: "暂无积分流水",
    fallbackDescription: "商业化交易",
    recordsEyebrow: "记录",
    title: "积分流水",
  },
  upgradeDialog: {
    currentMembershipLabel: "当前会员",
    description: "选择高级套餐，把 Sdkwork 风格的商业化体验带入任何 SDKWORK 桌面应用。",
    noPlanDescription: "当前商业化服务没有返回可升级的套餐。",
    noPlanFallbackDescription: "高级套餐",
    noPlanTitle: "暂无可升级方案",
    paymentMethodLabel: "支付方式",
    selected: "已选择",
    selectedPackageLabel: "已选套餐",
    selectPlan: "选择方案",
    signInRequiredDescription: "升级会员需要已登录的会话。",
    signInRequiredTitle: "需要登录",
    title: "升级会员",
  },
};

const SDKWORK_POINTS_MESSAGES: Record<SdkworkPointsLocale, SdkworkPointsMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

export function normalizeSdkworkPointsLocale(locale?: string | null): SdkworkPointsLocale {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

export function createSdkworkPointsMessages(
  locale?: string | null,
  overrides?: SdkworkPointsMessagesOverrides,
): SdkworkPointsMessages {
  return mergeDeep(
    SDKWORK_POINTS_MESSAGES[normalizeSdkworkPointsLocale(locale)],
    overrides,
  );
}

export function formatPoints(value: number, language = "en-US"): string {
  return formatSdkworkPoints(value, language);
}

export function formatCurrencyCny(
  value: number | null | undefined,
  language = "en-US",
): string {
  return formatSdkworkCurrencyCny(value, language);
}

export function formatPointsRate(
  value: number | null | undefined,
  language = "en-US",
): string {
  if (!value || value <= 0) {
    return formatSdkworkPointsRate(value ?? 0, language);
  }

  if (normalizeSdkworkPointsLocale(language) === "zh-CN") {
    return `${formatPoints(value, language)} 积分 / 1 元`;
  }

  return `${formatPoints(value, language)} pts / CNY 1`;
}

export function getCurrentPlanTitle(
  currentPlan: SdkworkPointsCurrentPlan,
  language = "en-US",
): string {
  const copy = createSdkworkPointsMessages(language);

  if (currentPlan.status === "guest") {
    return copy.plan.guest;
  }

  if (currentPlan.status === "free") {
    return copy.plan.free;
  }

  return currentPlan.name || copy.plan.active;
}
