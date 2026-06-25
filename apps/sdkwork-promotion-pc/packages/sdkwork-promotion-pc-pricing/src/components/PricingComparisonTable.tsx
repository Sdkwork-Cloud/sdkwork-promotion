import { EmptyState } from "@sdkwork/ui-pc-react";
import type {
  SdkworkPricingFeature,
  SdkworkPricingPlan,
} from "../pricing";
import {
  createSdkworkPricingPanelStyle,
  createSdkworkPricingToneStyle,
} from "../pricing-appearance";
import { useSdkworkPricingIntl } from "../pricing-intl";

export interface SdkworkPricingComparisonTableProps {
  featureMatrix: readonly SdkworkPricingFeature[];
  onSelectPlan?: (planId: string) => void;
  plans: readonly SdkworkPricingPlan[];
  selectedPlanId?: string | null;
}

export function SdkworkPricingComparisonTable({
  featureMatrix,
  onSelectPlan,
  plans,
  selectedPlanId,
}: SdkworkPricingComparisonTableProps) {
  const {
    copy,
    formatFeatureLabel,
    formatFeatureValue,
    formatFocusPlanAria,
  } = useSdkworkPricingIntl();

  if (plans.length === 0) {
    return (
      <EmptyState
        description={copy.comparison.emptyDescription}
        title={copy.comparison.emptyTitle}
      />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-[1.6rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] shadow-[var(--sdk-shadow-sm)]"
      style={createSdkworkPricingPanelStyle("neutral", {
        backgroundWeight: 5,
        borderWeight: 14,
      })}
    >
      <table className="min-w-[780px] w-full text-left text-sm">
        <thead className="border-b border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel-muted)]">
          <tr>
            <th className="px-6 py-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
              {copy.comparison.feature}
            </th>
            {plans.map((plan) => {
              const isSelected = plan.id === selectedPlanId;

              return (
                <th
                  className="px-6 py-5"
                  key={plan.id}
                  style={isSelected
                    ? createSdkworkPricingPanelStyle("accent", {
                      backgroundWeight: 8,
                      borderWeight: 20,
                      surfaceColor: "var(--sdk-color-surface-panel-muted)",
                    })
                    : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-[var(--sdk-color-text-primary)]">
                        {plan.title}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--sdk-color-text-muted)]">
                        {plan.priceLabel}
                      </div>
                    </div>
                    <button
                      aria-label={formatFocusPlanAria(plan.title)}
                      className="rounded-xl border border-[var(--sdk-color-border-default)] px-3 py-2 text-xs font-semibold text-[var(--sdk-color-text-primary)] transition-colors hover:bg-[var(--sdk-color-surface-panel)]"
                      onClick={() => onSelectPlan?.(plan.id)}
                      style={isSelected
                        ? createSdkworkPricingToneStyle("accent", {
                          backgroundWeight: 12,
                          borderWeight: 22,
                        })
                        : undefined}
                      type="button"
                    >
                      {copy.actions.focus}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--sdk-color-border-subtle)]">
          {featureMatrix.map((feature) => (
            <tr key={feature.id}>
              <th className="px-6 py-4 font-medium text-[var(--sdk-color-text-secondary)]">
                {formatFeatureLabel(feature.id, feature.label)}
              </th>
              {plans.map((plan) => (
                <td
                  className="px-6 py-4 text-[var(--sdk-color-text-primary)]"
                  key={`${plan.id}-${feature.id}`}
                  style={plan.id === selectedPlanId
                    ? createSdkworkPricingPanelStyle("accent", {
                      backgroundWeight: 4,
                      borderWeight: 12,
                      surfaceColor: "var(--sdk-color-surface-panel-muted)",
                    })
                    : undefined}
                >
                  {formatFeatureValue(plan.featureValues[feature.id])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
