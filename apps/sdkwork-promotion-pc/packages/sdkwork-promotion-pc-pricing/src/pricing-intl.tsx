import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type {
  SdkworkPricingBillingModel,
  SdkworkPricingCadence,
  SdkworkPricingFeatureValue,
} from "./pricing";
import {
  createSdkworkPricingMessages,
  formatSdkworkPricingBillingModelLabel,
  formatSdkworkPricingBudgetPostureLabel,
  formatSdkworkPricingCadenceLabel,
  formatSdkworkPricingFeatureLabel,
  formatSdkworkPricingIncludedPointsLabel,
  formatSdkworkPricingSeatLimitLabel,
  formatSdkworkPricingTemplate,
  normalizeSdkworkPricingLocale,
  type SdkworkPricingMessages,
  type SdkworkPricingMessagesOverrides,
} from "./pricing-copy";

export interface SdkworkPricingIntlValue {
  copy: SdkworkPricingMessages;
  formatBestFor: (value: string) => string;
  formatBillingModel: (value: SdkworkPricingBillingModel | "all") => string;
  formatBudgetPosture: (value: string) => string;
  formatCadence: (value: SdkworkPricingCadence) => string;
  formatFeatureLabel: (value: string, fallbackLabel?: string) => string;
  formatFeatureValue: (value: SdkworkPricingFeatureValue) => string;
  formatFocusPlanAria: (value: string) => string;
  formatIncludedPoints: (value: number) => string;
  formatSelectPlanAction: (value: string) => string;
  formatSeatLimit: (value: number | null) => string;
  formatTogglePlanAria: (value: string) => string;
  formatWorkspacePosture: (value: string) => string;
  locale: string;
}

export interface SdkworkPricingIntlProviderProps extends PropsWithChildren {
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
}

function createSdkworkPricingIntlValue(
  locale?: string | null,
  overrides?: SdkworkPricingMessagesOverrides,
): SdkworkPricingIntlValue {
  const resolvedLocale = normalizeSdkworkPricingLocale(locale);
  const copy = createSdkworkPricingMessages(resolvedLocale, overrides);

  return {
    copy,
    formatBestFor(value) {
      return formatSdkworkPricingTemplate(copy.planCards.bestForValue, value);
    },
    formatBillingModel(value) {
      return formatSdkworkPricingBillingModelLabel(value, resolvedLocale, overrides);
    },
    formatBudgetPosture(value) {
      return formatSdkworkPricingBudgetPostureLabel(value, resolvedLocale, overrides);
    },
    formatCadence(value) {
      return formatSdkworkPricingCadenceLabel(value, resolvedLocale, overrides);
    },
    formatFeatureLabel(value, fallbackLabel) {
      const label = formatSdkworkPricingFeatureLabel(value, resolvedLocale, overrides);
      return label === value ? (fallbackLabel ?? value) : label;
    },
    formatFeatureValue(value) {
      if (typeof value === "boolean") {
        return value ? copy.comparison.included : copy.comparison.notIncluded;
      }

      if (value === null || value === undefined || value === "") {
        return "--";
      }

      return String(value);
    },
    formatFocusPlanAria(value) {
      return formatSdkworkPricingTemplate(copy.comparison.focusPlanAria, value);
    },
    formatIncludedPoints(value) {
      return formatSdkworkPricingIncludedPointsLabel(value, resolvedLocale, overrides);
    },
    formatSelectPlanAction(value) {
      return `${copy.actions.select} ${value}`;
    },
    formatSeatLimit(value) {
      return formatSdkworkPricingSeatLimitLabel(value, resolvedLocale, overrides);
    },
    formatTogglePlanAria(value) {
      return formatSdkworkPricingTemplate(copy.planCards.togglePlanAria, value);
    },
    formatWorkspacePosture(value) {
      return formatSdkworkPricingTemplate(copy.metrics.workspacePostureValue, value);
    },
    locale: resolvedLocale,
  };
}

const DEFAULT_SDKWORK_PRICING_INTL = createSdkworkPricingIntlValue();

const SdkworkPricingIntlContext = createContext<SdkworkPricingIntlValue>(
  DEFAULT_SDKWORK_PRICING_INTL,
);

export function SdkworkPricingIntlProvider({
  children,
  locale,
  messages,
}: SdkworkPricingIntlProviderProps) {
  const value = useMemo(
    () => createSdkworkPricingIntlValue(locale, messages),
    [locale, messages],
  );

  return (
    <SdkworkPricingIntlContext.Provider value={value}>
      {children}
    </SdkworkPricingIntlContext.Provider>
  );
}

export function useSdkworkPricingIntl(): SdkworkPricingIntlValue {
  return useContext(SdkworkPricingIntlContext);
}
