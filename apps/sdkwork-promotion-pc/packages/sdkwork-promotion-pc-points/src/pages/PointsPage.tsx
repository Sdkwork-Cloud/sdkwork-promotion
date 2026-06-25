import { useEffect } from "react";
import {
  Coins,
  Crown,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Button,
  LoadingBlock,
  StatCard,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import type { SdkworkPointsMessagesOverrides } from "../points-copy";
import type { SdkworkPointsController } from "../points-controller";
import {
  useSdkworkPointsController,
  useSdkworkPointsControllerState,
} from "../points-controller";
import {
  createSdkworkPointsBackdropStyle,
  createSdkworkPointsGlassStyle,
  createSdkworkPointsHeroStyle,
  createSdkworkPointsHeroTextStyle,
  createSdkworkPointsToneStyle,
} from "../points-appearance";
import {
  SdkworkPointsIntlProvider,
  useSdkworkPointsIntl,
} from "../points-intl";
import { SdkworkPointsRechargeDialog } from "../components/points-recharge-dialog";
import { SdkworkPointsTransactionList } from "../components/points-transaction-list";
import { SdkworkPointsUpgradeDialog } from "../components/points-upgrade-dialog";

export interface SdkworkPointsPageProps {
  controller?: SdkworkPointsController;
  locale?: string | null;
  messages?: SdkworkPointsMessagesOverrides;
}

interface SdkworkPointsPageContentProps {
  controller?: SdkworkPointsController;
}

function SdkworkPointsPageContent({
  controller: controllerProp,
}: SdkworkPointsPageContentProps) {
  const controller = useSdkworkPointsController(controllerProp);
  const state = useSdkworkPointsControllerState(controller);
  const {
    copy,
    formatCurrentPlanState,
    formatCurrentPlanTitle,
    formatPoints,
    formatPointsRate,
  } = useSdkworkPointsIntl();
  const primaryHeroTextStyle = createSdkworkPointsHeroTextStyle();
  const mutedHeroTextStyle = createSdkworkPointsHeroTextStyle("muted");
  const subtleHeroTextStyle = createSdkworkPointsHeroTextStyle("subtle");

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  return (
    <div className="relative h-full overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={createSdkworkPointsBackdropStyle()}
      />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-[88rem] space-y-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.9fr)]">
            <div
              className="overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--sdk-color-border-default)_72%,transparent)] px-6 py-7 text-white shadow-[var(--sdk-shadow-lg)]"
              style={createSdkworkPointsHeroStyle()}
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={subtleHeroTextStyle}>
                    {copy.page.eyebrow}
                  </div>
                  <h1 className="mt-3 text-4xl font-semibold tracking-tight" style={primaryHeroTextStyle}>{copy.page.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7" style={mutedHeroTextStyle}>
                    {copy.page.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => controller.openRecharge()} type="button" variant="secondary">
                    {copy.page.primaryAction}
                  </Button>
                  <Button onClick={() => controller.openUpgrade()} type="button" variant="outline">
                    {copy.page.secondaryAction}
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
                <div
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                  style={createSdkworkPointsGlassStyle("brand", {
                    backgroundWeight: 12,
                    borderWeight: 26,
                  })}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm" style={mutedHeroTextStyle}>{copy.page.availablePointsLabel}</div>
                        <div className="mt-3 text-5xl font-semibold tracking-tight">
                          {formatPoints(state.dashboard.summary.balancePoints)}
                        </div>
                    </div>
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] border"
                      style={createSdkworkPointsToneStyle("brand", {
                        backgroundWeight: 14,
                        borderWeight: 24,
                      })}
                    >
                      <Coins className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    {state.dashboard.summary.isAuthenticated ? copy.page.readyForGrowth : copy.page.signInRequired}
                  </div>
                </div>

                <div
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                  style={createSdkworkPointsGlassStyle("accent", {
                    backgroundWeight: 12,
                    borderWeight: 26,
                  })}
                    >
                      <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                      style={createSdkworkPointsToneStyle("accent", {
                        backgroundWeight: 18,
                        borderWeight: 28,
                      })}
                    >
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm" style={mutedHeroTextStyle}>{copy.page.currentPlanLabel}</div>
                      <div className="mt-1 text-xl font-semibold" style={primaryHeroTextStyle}>
                        {formatCurrentPlanTitle(state.dashboard.summary.currentPlan)}
                      </div>
                    </div>
                  </div>
                  <div
                    className="mt-4 rounded-[1rem] border px-4 py-3 text-sm"
                    style={{
                      ...createSdkworkPointsGlassStyle("neutral", {
                        backgroundWeight: 8,
                        borderWeight: 20,
                        surfaceWeight: 80,
                      }),
                      ...mutedHeroTextStyle,
                    }}
                  >
                    {formatCurrentPlanState(
                      state.dashboard.summary.currentPlan,
                      state.dashboard.summary.isAuthenticated,
                    )}
                  </div>
                  <div className="mt-4 text-sm" style={mutedHeroTextStyle}>
                    {copy.page.rateLabel}: {formatPointsRate(state.dashboard.summary.pointsToCashRate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
              <StatCard
                change="+"
                changeTone="success"
                icon={<TrendingUp className="h-5 w-5" />}
                label={copy.page.earnedThisMonthLabel}
                value={`+${formatPoints(state.dashboard.summary.earnedThisMonth)}`}
              />
              <StatCard
                change="-"
                changeTone="danger"
                icon={<TrendingDown className="h-5 w-5" />}
                label={copy.page.spentThisMonthLabel}
                value={`-${formatPoints(state.dashboard.summary.spentThisMonth)}`}
              />
              <StatCard
                icon={<Wallet className="h-5 w-5" />}
                label={copy.page.exchangeRateLabel}
                value={state.dashboard.summary.pointsToCashRate ? `${formatPoints(state.dashboard.summary.pointsToCashRate)} ${copy.headerEntry.pointsSuffix}` : "--"}
              />
            </div>
          </section>

          {state.isLoading && !state.isBootstrapped ? <LoadingBlock label={copy.page.loading} /> : null}

          {state.lastError ? (
            <StatusNotice title={copy.page.errorTitle} tone="danger">
              {state.lastError}
            </StatusNotice>
          ) : null}

          <SdkworkPointsTransactionList
            activeFilter={state.activeFilter}
            onFilterChange={controller.setFilter}
            transactions={state.visibleTransactions}
          />
        </div>

        <SdkworkPointsRechargeDialog
          controller={controller}
          onOpenChange={(open) => {
            if (!open) {
              controller.closeRecharge();
            }
          }}
          open={state.isRechargeOpen}
        />
        <SdkworkPointsUpgradeDialog
          controller={controller}
          onOpenChange={(open) => {
            if (!open) {
              controller.closeUpgrade();
            }
          }}
          open={state.isUpgradeOpen}
        />
      </div>
    </div>
  );
}

export function SdkworkPointsPage({
  locale,
  messages,
  ...props
}: SdkworkPointsPageProps) {
  const content = <SdkworkPointsPageContent {...props} />;

  if (locale || messages) {
    return (
      <SdkworkPointsIntlProvider locale={locale} messages={messages}>
        {content}
      </SdkworkPointsIntlProvider>
    );
  }

  return content;
}
