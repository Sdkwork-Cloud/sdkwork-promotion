import { useEffect } from "react";
import {
  Coins,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Button,
  LoadingBlock,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import { formatSdkworkPromotionCurrencyCny as formatSdkworkCurrencyCny } from "@sdkwork/promotion-service";
import type { SdkworkPricingMessagesOverrides } from "../pricing-copy";
import type { SdkworkPricingController } from "../pricing-controller";
import {
  useSdkworkPricingController,
  useSdkworkPricingControllerState,
} from "../pricing-controller";
import {
  createSdkworkPricingBackdropStyle,
  createSdkworkPricingGlassStyle,
  createSdkworkPricingHeroStyle,
  createSdkworkPricingHeroTextStyle,
  createSdkworkPricingPanelStyle,
  createSdkworkPricingToneStyle,
} from "../pricing-appearance";
import {
  SdkworkPricingIntlProvider,
  useSdkworkPricingIntl,
} from "../pricing-intl";
import type { SdkworkPricingService } from "../pricing-service";
import { SdkworkPricingComparisonTable } from "../components/PricingComparisonTable";
import { SdkworkPricingPlanCards } from "../components/PricingPlanCards";

export interface SdkworkPricingPageProps {
  controller?: SdkworkPricingController;
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
  onNavigate?: (route: string) => void;
  service?: Partial<SdkworkPricingService>;
}

interface SdkworkPricingPageContentProps {
  controller?: SdkworkPricingController;
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
  onNavigate?: (route: string) => void;
  service?: Partial<SdkworkPricingService>;
}

function SdkworkPricingPageContent({
  controller: controllerProp,
  locale,
  messages,
  onNavigate,
  service,
}: SdkworkPricingPageContentProps) {
  const controller = useSdkworkPricingController(controllerProp, {
    locale,
    messages,
    service,
  });
  const state = useSdkworkPricingControllerState(controller);
  const {
    copy,
    formatBillingModel,
    formatBudgetPosture,
    formatWorkspacePosture,
  } = useSdkworkPricingIntl();
  const billingModels = Array.from(
    new Set(state.catalog.plans.map((plan) => plan.billingModel)),
  );

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  return (
    <div className="relative h-full overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={createSdkworkPricingBackdropStyle()}
      />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-[96rem] space-y-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.85fr)]">
            <div
              className="overflow-hidden rounded-[2rem] border px-6 py-7 shadow-[var(--sdk-shadow-lg)]"
              style={{
                ...createSdkworkPricingHeroStyle(),
                ...createSdkworkPricingHeroTextStyle(),
              }}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--sdk-shadow-soft)]"
                    style={createSdkworkPricingToneStyle("accent", {
                      backgroundWeight: 16,
                      borderWeight: 26,
                    })}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {copy.page.eyebrow}
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight">{copy.page.title}</h1>
                  <p className="mt-3 text-sm leading-7" style={createSdkworkPricingHeroTextStyle("muted")}>
                    {copy.page.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {state.selectedPlan ? (
                    <Button onClick={() => onNavigate?.(state.selectedPlan!.action.route)} type="button">
                      {state.selectedPlan.action.label}
                    </Button>
                  ) : null}
                  <Button onClick={() => void controller.refresh()} type="button" variant="outline">
                    {copy.actions.refresh}
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                <div
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                  style={createSdkworkPricingGlassStyle("accent", {
                    backgroundWeight: 14,
                    borderWeight: 26,
                  })}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm" style={createSdkworkPricingHeroTextStyle("subtle")}>{copy.metrics.currentPlan}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight">
                        {state.catalog.digest.currentPlanTitle}
                      </div>
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("accent", {
                        backgroundWeight: 16,
                        borderWeight: 24,
                      })}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                  style={createSdkworkPricingGlassStyle("success", {
                    backgroundWeight: 14,
                    borderWeight: 26,
                  })}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm" style={createSdkworkPricingHeroTextStyle("subtle")}>{copy.metrics.walletBalance}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight">
                        {formatSdkworkCurrencyCny(state.catalog.summary.walletBalanceCny)}
                      </div>
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("success", {
                        backgroundWeight: 16,
                        borderWeight: 24,
                      })}
                    >
                      <Wallet className="h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                  style={createSdkworkPricingGlassStyle("danger", {
                    backgroundWeight: 14,
                    borderWeight: 26,
                  })}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm" style={createSdkworkPricingHeroTextStyle("subtle")}>{copy.metrics.savingsSignal}</div>
                      <div className="mt-3 text-3xl font-semibold tracking-tight">
                        {formatSdkworkCurrencyCny(state.catalog.digest.highestSavingsCny)}
                      </div>
                    </div>
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("danger", {
                        backgroundWeight: 16,
                        borderWeight: 24,
                      })}
                    >
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <div
                className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-5 shadow-[var(--sdk-shadow-sm)]"
                style={createSdkworkPricingPanelStyle("neutral", {
                  backgroundWeight: 6,
                  borderWeight: 14,
                })}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">{copy.metrics.budgetPosture}</div>
                <div className="mt-3 text-2xl font-semibold text-[var(--sdk-color-text-primary)]">
                  {formatBudgetPosture(state.catalog.summary.budgetPosture)}
                </div>
                <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                  {formatWorkspacePosture(state.catalog.summary.currentLevelName)}
                </div>
              </div>

              <div
                className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-5 shadow-[var(--sdk-shadow-sm)]"
                style={createSdkworkPricingPanelStyle("accent", {
                  backgroundWeight: 8,
                  borderWeight: 18,
                })}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">{copy.metrics.selectedPlan}</div>
                <div className="mt-3 text-2xl font-semibold text-[var(--sdk-color-text-primary)]">
                  {state.selectedPlan?.title ?? copy.metrics.noPlanSelected}
                </div>
                <div className="mt-2 text-sm leading-7 text-[var(--sdk-color-text-secondary)]">
                  {state.selectedPlan?.description ?? copy.metrics.noPlanSelectedDescription}
                </div>
                {state.selectedPlan ? (
                  <div className="mt-5 space-y-3 rounded-[1.25rem] bg-[var(--sdk-color-surface-panel-muted)] p-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--sdk-color-text-muted)]">{copy.metrics.billingModel}</span>
                      <span className="font-medium text-[var(--sdk-color-text-primary)]">
                        {formatBillingModel(state.selectedPlan.billingModel)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[var(--sdk-color-text-muted)]">{copy.metrics.price}</span>
                      <span className="font-medium text-[var(--sdk-color-text-primary)]">
                        {state.selectedPlan.priceLabel}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-[var(--sdk-color-text-muted)]">{copy.metrics.bestFit}</span>
                      <span className="max-w-[14rem] text-right font-medium text-[var(--sdk-color-text-primary)]">
                        {state.selectedPlan.bestFitFor}
                      </span>
                    </div>
                  </div>
                ) : null}
                {state.selectedPlan ? (
                  <div className="mt-5">
                    <Button onClick={() => onNavigate?.(state.selectedPlan!.action.route)} type="button">
                      {state.selectedPlan.action.label}
                    </Button>
                  </div>
                ) : null}
              </div>
            </aside>
          </section>

          {state.isLoading && !state.isBootstrapped ? <LoadingBlock label={copy.page.loading} /> : null}

          {state.lastError ? (
            <StatusNotice title={copy.page.errorTitle} tone="danger">
              {state.lastError}
            </StatusNotice>
          ) : null}

          <section className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] shadow-[var(--sdk-shadow-sm)]">
            <div className="flex flex-col gap-4 border-b border-[var(--sdk-color-border-subtle)] px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">{copy.priceBook.eyebrow}</div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--sdk-color-text-primary)]">{copy.priceBook.title}</h2>
              </div>

              <div className="inline-flex flex-wrap gap-2">
                <Button
                  onClick={() => controller.setBillingModel("all")}
                  type="button"
                  variant={state.activeBillingModel === "all" ? "secondary" : "ghost"}
                >
                  {formatBillingModel("all")}
                </Button>
                {billingModels.map((billingModel) => (
                  <Button
                    key={billingModel}
                    onClick={() => controller.setBillingModel(billingModel)}
                    type="button"
                    variant={state.activeBillingModel === billingModel ? "secondary" : "ghost"}
                  >
                    {formatBillingModel(billingModel)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div
                  className="rounded-[1.35rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] p-4"
                  style={createSdkworkPricingPanelStyle("accent", {
                    backgroundWeight: 6,
                    borderWeight: 16,
                    surfaceColor: "var(--sdk-color-surface-panel-muted)",
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("accent", {
                        backgroundWeight: 12,
                        borderWeight: 22,
                      })}
                    >
                      <Coins className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--sdk-color-text-secondary)]">{copy.summary.availablePoints}</div>
                      <div className="mt-1 text-xl font-semibold text-[var(--sdk-color-text-primary)]">
                        {state.catalog.summary.availablePoints}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[1.35rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] p-4"
                  style={createSdkworkPricingPanelStyle("success", {
                    backgroundWeight: 6,
                    borderWeight: 16,
                    surfaceColor: "var(--sdk-color-surface-panel-muted)",
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("success", {
                        backgroundWeight: 12,
                        borderWeight: 22,
                      })}
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--sdk-color-text-secondary)]">{copy.summary.activeSubscriptions}</div>
                      <div className="mt-1 text-xl font-semibold text-[var(--sdk-color-text-primary)]">
                        {state.catalog.summary.activeSubscriptionPlans}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-[1.35rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] p-4"
                  style={createSdkworkPricingPanelStyle("warning", {
                    backgroundWeight: 6,
                    borderWeight: 16,
                    surfaceColor: "var(--sdk-color-surface-panel-muted)",
                  })}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPricingToneStyle("warning", {
                        backgroundWeight: 12,
                        borderWeight: 22,
                      })}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--sdk-color-text-secondary)]">{copy.summary.bestSavingsSignal}</div>
                      <div className="mt-1 text-xl font-semibold text-[var(--sdk-color-text-primary)]">
                        {formatSdkworkCurrencyCny(state.catalog.summary.bestOfferSavingsCny)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <SdkworkPricingPlanCards
                onNavigate={onNavigate}
                onSelectPlan={(planId) => controller.selectPlan(planId)}
                plans={state.visiblePlans}
                selectedPlanId={state.selectedPlanId}
              />

              <SdkworkPricingComparisonTable
                featureMatrix={state.catalog.featureMatrix}
                onSelectPlan={(planId) => controller.selectPlan(planId)}
                plans={state.visiblePlans}
                selectedPlanId={state.selectedPlanId}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SdkworkPricingPage({
  locale,
  messages,
  ...props
}: SdkworkPricingPageProps) {
  const content = (
    <SdkworkPricingPageContent
      {...props}
      locale={locale}
      messages={messages}
    />
  );

  if (locale || messages) {
    return (
      <SdkworkPricingIntlProvider locale={locale} messages={messages}>
        {content}
      </SdkworkPricingIntlProvider>
    );
  }

  return content;
}
