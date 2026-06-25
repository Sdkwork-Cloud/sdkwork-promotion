import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type {
  SdkworkPointsCurrentPlan,
  SdkworkPointsTransactionDirection,
} from "./points-service";
import {
  createSdkworkPointsMessages,
  formatCurrencyCny,
  formatPoints,
  formatPointsRate as formatPointsRateValue,
  type SdkworkPointsMessages,
  type SdkworkPointsMessagesOverrides,
  normalizeSdkworkPointsLocale,
} from "./points-copy";

export interface SdkworkPointsIntlValue {
  copy: SdkworkPointsMessages;
  formatCurrencyCny: (value: number | null | undefined) => string;
  formatCurrentPlanState: (currentPlan: Pick<SdkworkPointsCurrentPlan, "remainingDays">, isAuthenticated: boolean) => string;
  formatCurrentPlanTitle: (currentPlan: Pick<SdkworkPointsCurrentPlan, "name" | "status">) => string;
  formatDurationDays: (value: number | null | undefined) => string;
  formatPaymentMethod: (value: string | null | undefined) => string;
  formatPoints: (value: number) => string;
  formatPointsIncluded: (value: number | null | undefined) => string;
  formatPointsRate: (value: number | null | undefined) => string;
  formatTransactionDelta: (value: number, direction: SdkworkPointsTransactionDirection) => string;
  formatTransactionStatus: (status: string | undefined) => string;
  formatTransactionTimestamp: (value: string) => string;
  locale: string;
}

export interface SdkworkPointsIntlProviderProps extends PropsWithChildren {
  locale?: string | null;
  messages?: SdkworkPointsMessagesOverrides;
}

function interpolateTemplate(template: string, value: string): string {
  return template.replaceAll("{value}", value);
}

function normalizePaymentMethodKey(
  value: string | null | undefined,
): keyof SdkworkPointsMessages["paymentMethod"] {
  const normalized = String(value || "").trim().toUpperCase();

  if (normalized === "ALIPAY") {
    return "ALIPAY";
  }

  if (normalized === "BANKCARD" || normalized === "BANK_CARD") {
    return "BANKCARD";
  }

  return "WECHAT";
}

function createSdkworkPointsIntlValue(
  locale?: string | null,
  overrides?: SdkworkPointsMessagesOverrides,
): SdkworkPointsIntlValue {
  const resolvedLocale = normalizeSdkworkPointsLocale(locale);
  const copy = createSdkworkPointsMessages(resolvedLocale, overrides);

  function formatPointsValue(value: number): string {
    return formatPoints(value, resolvedLocale);
  }

  return {
    copy,
    formatCurrencyCny(value) {
      return formatCurrencyCny(value, resolvedLocale);
    },
    formatCurrentPlanState(currentPlan, isAuthenticated) {
      if (currentPlan.remainingDays) {
        return interpolateTemplate(copy.format.daysRemainingValue, String(currentPlan.remainingDays));
      }

      return isAuthenticated ? copy.page.noPremiumTerm : copy.page.signInRequired;
    },
    formatCurrentPlanTitle(currentPlan) {
      if (currentPlan.status === "guest") {
        return copy.plan.guest;
      }

      if (currentPlan.status === "free") {
        return copy.plan.free;
      }

      return currentPlan.name || copy.plan.active;
    },
    formatDurationDays(value) {
      if (value === null || value === undefined) {
        return copy.common.flexibleDuration;
      }

      return `${value} ${copy.common.days}`;
    },
    formatPaymentMethod(value) {
      return copy.paymentMethod[normalizePaymentMethodKey(value)];
    },
    formatPoints: formatPointsValue,
    formatPointsIncluded(value) {
      return interpolateTemplate(copy.format.pointsIncludedValue, formatPointsValue(value ?? 0));
    },
    formatPointsRate(value) {
      return formatPointsRateValue(value, resolvedLocale);
    },
    formatTransactionDelta(value, direction) {
      return `${direction === "earned" ? "+" : "-"}${formatPointsValue(value)}`;
    },
    formatTransactionStatus(status) {
      const normalized = String(status || "").trim().toLowerCase();

      if (normalized === "completed" || normalized === "success") {
        return copy.status.completed;
      }

      if (normalized === "failed") {
        return copy.status.failed;
      }

      return copy.status.pending;
    },
    formatTransactionTimestamp(value) {
      const timestamp = new Date(value);

      if (Number.isNaN(timestamp.getTime())) {
        return value;
      }

      return new Intl.DateTimeFormat(resolvedLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(timestamp);
    },
    locale: resolvedLocale,
  };
}

const DEFAULT_SDKWORK_POINTS_INTL = createSdkworkPointsIntlValue();

const SdkworkPointsIntlContext = createContext<SdkworkPointsIntlValue>(
  DEFAULT_SDKWORK_POINTS_INTL,
);

export function SdkworkPointsIntlProvider({
  children,
  locale,
  messages,
}: SdkworkPointsIntlProviderProps) {
  const value = useMemo(
    () => createSdkworkPointsIntlValue(locale, messages),
    [locale, messages],
  );

  return (
    <SdkworkPointsIntlContext.Provider value={value}>
      {children}
    </SdkworkPointsIntlContext.Provider>
  );
}

export function useSdkworkPointsIntl(): SdkworkPointsIntlValue {
  return useContext(SdkworkPointsIntlContext);
}
