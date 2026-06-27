import {
  EmptyState,
} from "@sdkwork/ui-pc-react";
import type { SdkworkPricingPlan } from "../pricing";
import {
  createSdkworkPricingHeroStyle,
  createSdkworkPricingHeroTextStyle,
  createSdkworkPricingPanelStyle,
  createSdkworkPricingToneStyle,
} from "../pricing-appearance";
import { useSdkworkPricingIntl } from "../pricing-intl";

export interface SdkworkPricingPlanCardsProps {
  onNavigate?: (route: string) => void;
  onSelectPlan?: (planId: string) => void;
  plans: readonly SdkworkPricingPlan[];
  selectedPlanId?: string | null;
}

export function SdkworkPricingPlanCards({
  onNavigate,
  onSelectPlan,
  plans,
  selectedPlanId,
}: SdkworkPricingPlanCardsProps) {
  const {
    copy,
    formatBestFor,
    formatBillingModel,
    formatCadence,
    formatIncludedPoints,
    formatSeatLimit,
    formatSelectPlanAction,
    formatTogglePlanAria,
  } = useSdkworkPricingIntl();

  if (plans.length === 0) {
    return (
      <EmptyState
        description={copy.planCards.emptyDescription}
        title={copy.planCards.emptyTitle}
      />
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {plans.map((plan) => {
        const isSelected = plan.id === selectedPlanId;

        return (
          <article
            className={`rounded-[1.75rem] border p-6 shadow-[var(--sdk-shadow-sm)] transition-all ${
              isSelected
                ? "shadow-[var(--sdk-shadow-lg)]"
                : "border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)]"
            }`}
            key={plan.id}
            style={isSelected
              ? createSdkworkPricingPanelStyle("accent", {
                backgroundWeight: 10,
                borderWeight: 24,
              })
              : undefined}
          >
            <div className="flex flex-wrap items-center gap-2">
              {plan.current ? (
                <span
                  className="rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                  style={createSdkworkPricingToneStyle("danger", {
                    backgroundWeight: 12,
                    borderWeight: 22,
                  })}
                >
                  {copy.actions.current}
                </span>
              ) : null}
              {plan.recommended ? (
                <span
                  className="rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
                  style={createSdkworkPricingToneStyle("accent", {
                    backgroundWeight: 12,
                    borderWeight: 22,
                  })}
                >
                  {copy.actions.recommended}
                </span>
              ) : null}
              <span className="rounded-full bg-[var(--sdk-color-surface-panel-muted)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
                {formatBillingModel(plan.billingModel)}
              </span>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-[var(--sdk-color-text-primary)]">
                  {plan.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--sdk-color-text-secondary)]">
                  {plan.description}
                </p>
              </div>

              <button
                aria-label={formatTogglePlanAria(plan.title)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? ""
                    : "bg-[var(--sdk-color-surface-panel-muted)] text-[var(--sdk-color-text-primary)] hover:bg-[var(--sdk-color-surface-panel)]"
                }`}
                onClick={() => onSelectPlan?.(plan.id)}
                style={isSelected
                  ? createSdkworkPricingToneStyle("brand", {
                    backgroundWeight: 18,
                    borderWeight: 30,
                  })
                  : undefined}
                type="button"
              >
                {isSelected ? copy.actions.selected : copy.actions.select}
              </button>
            </div>

            <div className="mt-6">
              <div className="text-4xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                {plan.priceLabel}
              </div>
              <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                {formatBestFor(plan.bestFitFor)}
              </div>
            </div>

            <div className="mt-6 grid gap-3 rounded-[1.35rem] border border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel-muted)] p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--sdk-color-text-muted)]">{copy.planCards.cadence}</span>
                <span className="font-medium text-[var(--sdk-color-text-primary)]">
                  {formatCadence(plan.cadence)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--sdk-color-text-muted)]">{copy.planCards.includedPoints}</span>
                <span className="font-medium text-[var(--sdk-color-text-primary)]">
                  {formatIncludedPoints(plan.includedPoints)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--sdk-color-text-muted)]">{copy.planCards.seatLimit}</span>
                <span className="font-medium text-[var(--sdk-color-text-primary)]">
                  {formatSeatLimit(plan.seatLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--sdk-color-text-muted)]">{copy.planCards.usagePosture}</span>
                <span className="max-w-[14rem] text-right font-medium text-[var(--sdk-color-text-primary)]">
                  {plan.includedUsage}
                </span>
              </div>
            </div>

            {plan.tags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {plan.tags.map((tag) => (
                  <span
                    className="rounded-full border border-[var(--sdk-color-border-default)] px-3 py-1 text-xs text-[var(--sdk-color-text-secondary)]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="flex-1 rounded-[1rem] border px-4 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                onClick={() => onNavigate?.(plan.action.route)}
                style={{
                  ...createSdkworkPricingHeroStyle(),
                  ...createSdkworkPricingHeroTextStyle(),
                }}
                type="button"
              >
                {plan.action.label}
              </button>
              <button
                aria-label={formatSelectPlanAction(plan.title)}
                className="rounded-[1rem] border border-[var(--sdk-color-border-default)] px-4 py-3 text-sm font-semibold text-[var(--sdk-color-text-primary)] transition-colors hover:bg-[var(--sdk-color-surface-panel-muted)]"
                onClick={() => onSelectPlan?.(plan.id)}
                type="button"
              >
                {formatSelectPlanAction(plan.title)}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
