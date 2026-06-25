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
import type { SdkworkOfferFilter } from "./offer";
import {
  createSdkworkOfferMessages,
  normalizeSdkworkOfferLocale,
  type SdkworkOfferMessages,
  type SdkworkOfferMessagesOverrides,
} from "./offer-copy";

export interface SdkworkOfferIntlValue {
  copy: SdkworkOfferMessages;
  formatCouponInventory: (available: number | null | undefined) => string;
  formatCouponInventoryMeta: (claimable: number | null | undefined, expiring: number | null | undefined) => string;
  formatCurrencyCny: (value: number | null | undefined) => string;
  formatFilterLabel: (filter: SdkworkOfferFilter) => string;
  formatOfferSavings: (value: number | null | undefined) => string;
  formatPoints: (value: number | null | undefined) => string;
  formatMembershipTerm: (days: number | null | undefined) => string;
  locale: string;
}

export interface SdkworkOfferIntlProviderProps extends PropsWithChildren {
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
}

function interpolateSdkworkOfferTemplate(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (output, [key, value]) => output.replaceAll(`{${key}}`, value),
    template,
  );
}

function createSdkworkOfferIntlValue(
  locale?: string | null,
  overrides?: SdkworkOfferMessagesOverrides,
): SdkworkOfferIntlValue {
  const resolvedLocale = normalizeSdkworkOfferLocale(locale);
  const copy = createSdkworkOfferMessages(resolvedLocale, overrides);

  return {
    copy,
    formatCouponInventory(available) {
      return interpolateSdkworkOfferTemplate(copy.format.availableCouponsValue, {
        value: String(available ?? 0),
      });
    },
    formatCouponInventoryMeta(claimable, expiring) {
      return interpolateSdkworkOfferTemplate(copy.format.claimableExpiringValue, {
        claimable: String(claimable ?? 0),
        expiring: String(expiring ?? 0),
      });
    },
    formatCurrencyCny(value) {
      return formatSdkworkCurrencyCny(value, resolvedLocale);
    },
    formatFilterLabel(filter) {
      return copy.filters[filter];
    },
    formatOfferSavings(value) {
      return interpolateSdkworkOfferTemplate(copy.format.savingsValue, {
        value: formatSdkworkCurrencyCny(value, resolvedLocale),
      });
    },
    formatPoints(value) {
      return formatSdkworkPoints(value ?? 0, resolvedLocale);
    },
    formatMembershipTerm(days) {
      if (days === null || days === undefined) {
        return copy.inventory.noActiveTerm;
      }

      return interpolateSdkworkOfferTemplate(copy.format.remainingDaysValue, {
        value: String(days),
      });
    },
    locale: resolvedLocale,
  };
}

const DEFAULT_SDKWORK_OFFER_INTL = createSdkworkOfferIntlValue();

const SdkworkOfferIntlContext = createContext<SdkworkOfferIntlValue>(
  DEFAULT_SDKWORK_OFFER_INTL,
);

export function SdkworkOfferIntlProvider({
  children,
  locale,
  messages,
}: SdkworkOfferIntlProviderProps) {
  const value = useMemo(
    () => createSdkworkOfferIntlValue(locale, messages),
    [locale, messages],
  );

  return (
    <SdkworkOfferIntlContext.Provider value={value}>
      {children}
    </SdkworkOfferIntlContext.Provider>
  );
}

export function useSdkworkOfferIntl(): SdkworkOfferIntlValue {
  return useContext(SdkworkOfferIntlContext);
}
