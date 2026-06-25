import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import {
  formatSdkworkPromotionCurrencyCny as formatSdkworkCurrencyCny,
  formatSdkworkPromotionPoints as formatSdkworkPoints,
} from "@sdkwork/promotion-service";
import type {
  SdkworkCouponStatus,
  SdkworkCouponType,
} from "./coupon";
import {
  createSdkworkCouponMessages,
  normalizeSdkworkCouponLocale,
  type SdkworkCouponMessages,
  type SdkworkCouponMessagesOverrides,
} from "./coupon-copy";

export interface SdkworkCouponIntlValue {
  copy: SdkworkCouponMessages;
  formatAvailability: (value: boolean | null | undefined) => string;
  formatCurrencyCny: (value: number | null | undefined) => string;
  formatPointCost: (value: number | null | undefined) => string;
  formatRemainingDays: (value: number | null | undefined) => string;
  formatStatus: (status: string | null | undefined) => string;
  formatTimestamp: (value: string | undefined) => string;
  formatType: (value: string | null | undefined) => string;
  locale: string;
}

export interface SdkworkCouponIntlProviderProps extends PropsWithChildren {
  locale?: string | null;
  messages?: SdkworkCouponMessagesOverrides;
}

function interpolateSdkworkCouponTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, value),
    template,
  );
}

function createSdkworkCouponIntlValue(
  locale?: string | null,
  overrides?: SdkworkCouponMessagesOverrides,
): SdkworkCouponIntlValue {
  const resolvedLocale = normalizeSdkworkCouponLocale(locale);
  const copy = createSdkworkCouponMessages(resolvedLocale, overrides);

  return {
    copy,
    formatAvailability(value) {
      return value ? copy.common.yes : copy.common.no;
    },
    formatCurrencyCny(value) {
      return formatSdkworkCurrencyCny(value, resolvedLocale);
    },
    formatPointCost(value) {
      if (value === null || value === undefined) {
        return copy.common.emptyValue;
      }

      return interpolateSdkworkCouponTemplate(copy.format.pointCostValue, {
        value: formatSdkworkPoints(value, resolvedLocale),
      });
    },
    formatRemainingDays(value) {
      if (value === null || value === undefined) {
        return copy.common.emptyValue;
      }

      return interpolateSdkworkCouponTemplate(copy.format.remainingDaysValue, {
        value: formatSdkworkPoints(value, resolvedLocale),
      });
    },
    formatStatus(status) {
      const normalized = String(status || "").trim().toLowerCase();
      return copy.status[normalized as SdkworkCouponStatus] ?? status ?? copy.status.inactive;
    },
    formatTimestamp(value) {
      if (!value) {
        return copy.common.emptyValue;
      }

      return new Intl.DateTimeFormat(resolvedLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    },
    formatType(value) {
      const normalized = String(value || "").trim().toLowerCase().replaceAll("-", "");
      if (normalized === "pointsexchange") {
        return copy.type.pointsExchange;
      }

      return copy.type[normalized as Exclude<SdkworkCouponType, "points-exchange">] ?? copy.type.unknown;
    },
    locale: resolvedLocale,
  };
}

const DEFAULT_SDKWORK_COUPON_INTL = createSdkworkCouponIntlValue();

const SdkworkCouponIntlContext = createContext<SdkworkCouponIntlValue>(
  DEFAULT_SDKWORK_COUPON_INTL,
);

export function SdkworkCouponIntlProvider({
  children,
  locale,
  messages,
}: SdkworkCouponIntlProviderProps) {
  const value = useMemo(
    () => createSdkworkCouponIntlValue(locale, messages),
    [locale, messages],
  );

  return (
    <SdkworkCouponIntlContext.Provider value={value}>
      {children}
    </SdkworkCouponIntlContext.Provider>
  );
}

export function useSdkworkCouponIntl(): SdkworkCouponIntlValue {
  return useContext(SdkworkCouponIntlContext);
}
