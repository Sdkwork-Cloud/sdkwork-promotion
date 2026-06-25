export type SdkworkOfferLocale = "en-US" | "zh-CN";

export type SdkworkOfferMessagesOverrides = DeepPartial<SdkworkOfferMessages>;

export interface SdkworkOfferMessages {
  common: {
    days: string;
    emptyValue: string;
    noOfferSelected: string;
  };
  controller: {
    bootstrapFailed: string;
  };
  filters: {
    all: string;
    coupon: string;
    membership: string;
    recharge: string;
  };
  format: {
    availableCouponsValue: string;
    claimableExpiringValue: string;
    remainingDaysValue: string;
    savingsValue: string;
  };
  inventory: {
    accountLevel: string;
    couponInventory: string;
    membershipTerm: string;
    noActiveTerm: string;
  };
  manifest: {
    description: string;
    title: string;
  };
  offers: {
    empty: string;
    fallbackDescription: string;
    featuredBadge: string;
  };
  page: {
    availablePoints: string;
    bestSavings: string;
    description: string;
    errorTitle: string;
    eyebrow: string;
    featuredOffers: string;
    loading: string;
    title: string;
  };
  selected: {
    detailFallback: string;
    emptyDescription: string;
    eyebrow: string;
    priceLabel: string;
    routeLabel: string;
    savingsLabel: string;
  };
  service: {
    actionOpenCheckout: string;
    actionOpenCouponCenter: string;
    actionOpenRecharge: string;
    actionOpenRenewal: string;
    actionOpenUpgrade: string;
    couponFallbackDescription: string;
    couponTagClaimable: string;
    couponTagExchange: string;
    guestLabel: string;
    membershipFallbackDescription: string;
    rechargeFallbackDescription: string;
    rechargeTagPoints: string;
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

const EN_US_MESSAGES: SdkworkOfferMessages = {
  common: {
    days: "days",
    emptyValue: "--",
    noOfferSelected: "No offer selected",
  },
  controller: {
    bootstrapFailed: "Failed to load offer center.",
  },
  filters: {
    all: "All",
    coupon: "Coupon",
    membership: "Membership",
    recharge: "Recharge",
  },
  format: {
    availableCouponsValue: "{value} available",
    claimableExpiringValue: "{claimable} claimable / {expiring} expiring soon",
    remainingDaysValue: "{value} days",
    savingsValue: "Savings {value}",
  },
  inventory: {
    accountLevel: "Account level",
    couponInventory: "Coupon inventory",
    membershipTerm: "Membership term",
    noActiveTerm: "No active term",
  },
  manifest: {
    description: "Offer workspace for shared featured pricing, upgrade opportunities, coupon discovery, and recharge entry composition.",
    title: "Offers",
  },
  offers: {
    empty: "No commercial offers are currently available for this filter.",
    fallbackDescription: "Commercial offer",
    featuredBadge: "Featured",
  },
  page: {
    availablePoints: "Available points",
    bestSavings: "Best savings",
    description: "Standardize the best upgrade, recharge, and coupon opportunities into one reusable Sdkwork-inspired commercial layer.",
    errorTitle: "Offer center error",
    eyebrow: "Commercial offer system",
    featuredOffers: "Featured offers",
    loading: "Loading offer center...",
    title: "Offer Center",
  },
  selected: {
    detailFallback: "Commercial offer detail",
    emptyDescription: "Select an offer to inspect routing and pricing detail.",
    eyebrow: "Selected offer",
    priceLabel: "Price",
    routeLabel: "Route",
    savingsLabel: "Estimated savings",
  },
  service: {
    actionOpenCheckout: "Open checkout",
    actionOpenCouponCenter: "Open coupon center",
    actionOpenRecharge: "Open recharge",
    actionOpenRenewal: "Open renewal",
    actionOpenUpgrade: "Open upgrade",
    couponFallbackDescription: "Commercial coupon opportunity",
    couponTagClaimable: "Claimable",
    couponTagExchange: "Exchange",
    guestLabel: "Guest",
    membershipFallbackDescription: "Premium membership package",
    rechargeFallbackDescription: "Recharge points for premium workflows",
    rechargeTagPoints: "Points",
  },
};

const ZH_CN_MESSAGES: SdkworkOfferMessages = {
  common: {
    days: "天",
    emptyValue: "--",
    noOfferSelected: "未选择方案",
  },
  controller: {
    bootstrapFailed: "加载优惠中心失败。",
  },
  filters: {
    all: "全部",
    coupon: "优惠券",
    membership: "会员",
    recharge: "充值",
  },
  format: {
    availableCouponsValue: "{value} 张可用",
    claimableExpiringValue: "{claimable} 张可领取 / {expiring} 张即将过期",
    remainingDaysValue: "剩余 {value} 天",
    savingsValue: "可节省 {value}",
  },
  inventory: {
    accountLevel: "当前等级",
    couponInventory: "优惠券库存",
    noActiveTerm: "当前没有生效中的会员周期",
    membershipTerm: "\u4f1a\u5458\u5468\u671f",
  },
  manifest: {
    description: "用于统一展示精选定价、升级机会、优惠券发现和充值入口编排的方案工作区。",
    title: "方案",
  },
  offers: {
    empty: "当前筛选条件下暂无可展示的商业化方案。",
    fallbackDescription: "商业化方案",
    featuredBadge: "精选",
  },
  page: {
    availablePoints: "可用积分",
    bestSavings: "最佳节省",
    description: "把会员升级、积分充值和优惠券机会统一到一个可复用的 Sdkwork 风格商业化工作台中。",
    errorTitle: "优惠中心异常",
    eyebrow: "商业化方案系统",
    featuredOffers: "精选方案",
    loading: "正在加载优惠中心...",
    title: "优惠中心",
  },
  selected: {
    detailFallback: "商业化方案详情",
    emptyDescription: "选择一个方案后，可查看它的路由与定价详情。",
    eyebrow: "已选方案",
    priceLabel: "价格",
    routeLabel: "路由",
    savingsLabel: "预计节省",
  },
  service: {
    actionOpenCheckout: "打开结算",
    actionOpenCouponCenter: "打开优惠中心",
    actionOpenRecharge: "打开充值",
    actionOpenRenewal: "打开续费",
    actionOpenUpgrade: "打开升级",
    couponFallbackDescription: "商业优惠机会",
    couponTagClaimable: "可领取",
    couponTagExchange: "可兑换",
    guestLabel: "访客",
    membershipFallbackDescription: "高级会员套餐",
    rechargeFallbackDescription: "为高阶创作流程补充积分",
    rechargeTagPoints: "积分",
  },
};

const SDKWORK_OFFER_MESSAGES: Record<SdkworkOfferLocale, SdkworkOfferMessages> = {
  "en-US": EN_US_MESSAGES,
  "zh-CN": ZH_CN_MESSAGES,
};

export function normalizeSdkworkOfferLocale(locale?: string | null): SdkworkOfferLocale {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("zh")) {
    return "zh-CN";
  }

  return "en-US";
}

export function createSdkworkOfferMessages(
  locale?: string | null,
  overrides?: SdkworkOfferMessagesOverrides,
): SdkworkOfferMessages {
  return mergeDeep(
    SDKWORK_OFFER_MESSAGES[normalizeSdkworkOfferLocale(locale)],
    overrides,
  );
}
