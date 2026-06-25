import { useEffect } from "react";
import {
  Clock3,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import {
  Button,
  LoadingBlock,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import type { SdkworkCouponMessagesOverrides } from "../coupon-copy";
import type { SdkworkCouponController } from "../coupon-controller";
import {
  useSdkworkCouponController,
  useSdkworkCouponControllerState,
} from "../coupon-controller";
import {
  SdkworkCouponIntlProvider,
  useSdkworkCouponIntl,
} from "../coupon-intl";
import {
  createSdkworkCouponBackdropStyle,
  createSdkworkCouponGlassStyle,
  createSdkworkCouponHeroStyle,
  createSdkworkCouponHeroTextStyle,
  createSdkworkCouponMetricToneStyle,
  createSdkworkCouponPanelStyle,
  createSdkworkCouponToneStyle,
  resolveSdkworkCouponStatusTone,
} from "../coupon-appearance";
import { SdkworkCouponDetailDrawer } from "../components/coupon-detail-drawer";
import { SdkworkCouponRedeemDialog } from "../components/coupon-redeem-dialog";

export interface SdkworkCouponPageProps {
  controller?: SdkworkCouponController;
  locale?: string | null;
  messages?: SdkworkCouponMessagesOverrides;
}

interface SdkworkCouponPageContentProps {
  controller?: SdkworkCouponController;
}

function SdkworkCouponPageContent({
  controller: controllerProp,
}: SdkworkCouponPageContentProps) {
  const {
    copy,
    formatCurrencyCny,
    locale,
    formatPointCost,
    formatRemainingDays,
    formatStatus,
  } = useSdkworkCouponIntl();
  const controller = useSdkworkCouponController(controllerProp, {
    locale,
    messages: copy,
  });
  const state = useSdkworkCouponControllerState(controller);

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  const heroHighlights = [
    {
      helper: state.dashboard.availableCoupons[0]?.name || copy.page.activeCouponFallback,
      icon: TicketPercent,
      label: copy.stats.availableCoupons,
      tone: "success" as const,
      value: state.dashboard.userDigest.availableCoupons,
    },
    {
      helper: `${copy.stats.claimableOffers}: ${state.dashboard.catalogDigest.claimableCoupons}`,
      icon: Clock3,
      label: copy.stats.expiringSoon,
      tone: "warning" as const,
      value: state.dashboard.userDigest.expiringSoonCoupons,
    },
    {
      helper: `${copy.stats.usedCoupons}: ${state.dashboard.statistics.usedCount}`,
      icon: Sparkles,
      label: copy.page.highestDiscountLabel,
      tone: "brand" as const,
      value: formatCurrencyCny(state.dashboard.userDigest.highestDiscountAmountCny),
    },
  ];

  const operations = [
    {
      helper: copy.actions.discover,
      label: copy.stats.claimableOffers,
      tone: "accent" as const,
      value: state.dashboard.catalogDigest.claimableCoupons,
    },
    {
      helper: copy.actions.exchangePoints,
      label: copy.stats.pointsExchangeOffers,
      tone: "brand" as const,
      value: state.dashboard.catalogDigest.pointsExchangeCoupons,
    },
    {
      helper: `${copy.stats.totalInventory}: ${state.dashboard.statistics.totalCoupons}`,
      label: copy.stats.usedCoupons,
      tone: "warning" as const,
      value: state.dashboard.statistics.usedCount,
    },
  ];
  const primaryHeroTextStyle = createSdkworkCouponHeroTextStyle();
  const mutedHeroTextStyle = createSdkworkCouponHeroTextStyle("muted");
  const subtleHeroTextStyle = createSdkworkCouponHeroTextStyle("subtle");

  return (
    <div className="relative h-full overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={createSdkworkCouponBackdropStyle()}
      />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-[92rem] space-y-6">
          <section
            className="overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--sdk-color-border-default)_72%,transparent)] px-6 py-7 text-white shadow-[var(--sdk-shadow-lg)]"
            style={createSdkworkCouponHeroStyle()}
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] xl:items-end">
              <div>
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--sdk-shadow-soft)]"
                  style={{
                    ...createSdkworkCouponGlassStyle("accent", {
                      backgroundWeight: 12,
                      borderWeight: 24,
                      surfaceWeight: 82,
                    }),
                    ...subtleHeroTextStyle,
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.page.eyebrow}
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight" style={primaryHeroTextStyle}>{copy.page.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7" style={mutedHeroTextStyle}>
                  {copy.page.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    className="rounded-2xl px-5 py-5 text-sm font-semibold"
                    onClick={() => controller.openRedeemDialog()}
                    type="button"
                    variant="secondary"
                  >
                    {copy.actions.redeemCode}
                  </Button>
                  <Button
                    className="rounded-2xl px-5 py-5 text-sm font-semibold"
                    onClick={() => void controller.refresh()}
                    type="button"
                    variant="outline"
                  >
                    {copy.actions.refreshInventory}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {heroHighlights.map((highlight) => {
                  const Icon = highlight.icon;

                  return (
                    <div
                      className="rounded-[1.6rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                      key={highlight.label}
                      style={createSdkworkCouponGlassStyle(highlight.tone, {
                        backgroundWeight: 12,
                        borderWeight: 26,
                      })}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm" style={mutedHeroTextStyle}>{highlight.label}</div>
                          <div className="mt-3 text-4xl font-semibold tracking-tight">{highlight.value}</div>
                          <div className="mt-2 text-sm" style={subtleHeroTextStyle}>{highlight.helper}</div>
                        </div>
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                          style={createSdkworkCouponToneStyle(highlight.tone, {
                            backgroundWeight: 18,
                            borderWeight: 32,
                          })}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {state.isLoading && !state.isBootstrapped ? <LoadingBlock label={copy.page.loading} /> : null}

          {state.lastError && !state.isMutating ? (
            <StatusNotice title={copy.page.errorTitle} tone="danger">
              {state.lastError}
            </StatusNotice>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            {operations.map((card) => (
              <article
                className="rounded-[1.6rem] border px-5 py-5 shadow-[var(--sdk-shadow-md)]"
                key={card.label}
                style={createSdkworkCouponPanelStyle(card.tone, {
                  backgroundWeight: 8,
                  borderWeight: 24,
                })}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                      {card.value}
                    </div>
                    <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                      {card.helper}
                    </div>
                  </div>
                  <div
                    className="mt-1 h-3 w-3 rounded-full border"
                    style={createSdkworkCouponToneStyle(card.tone, {
                      backgroundWeight: 22,
                      borderWeight: 38,
                    })}
                  />
                </div>
              </article>
            ))}
          </section>

          <section
            className="overflow-hidden rounded-[2rem] border shadow-[var(--sdk-shadow-md)]"
            style={createSdkworkCouponPanelStyle("neutral", {
              backgroundWeight: 6,
              borderWeight: 16,
            })}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sdk-color-border-subtle)] px-6 py-6">
              <div>
                <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
                  {copy.page.inventoryEyebrow}
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                  {copy.page.inventoryTitle}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => controller.setTab("discover")} type="button" variant={state.activeTab === "discover" ? "secondary" : "outline"}>
                  {copy.actions.discover}
                </Button>
                <Button onClick={() => controller.setTab("my")} type="button" variant={state.activeTab === "my" ? "secondary" : "outline"}>
                  {copy.actions.myCoupons}
                </Button>
                <Button onClick={() => controller.setTab("history")} type="button" variant={state.activeTab === "history" ? "secondary" : "outline"}>
                  {copy.actions.history}
                </Button>
              </div>
            </div>

            {state.activeTab === "discover" ? (
              <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
                {state.visibleCatalogCoupons.length === 0 ? (
                  <div className="col-span-full rounded-[1.4rem] border border-dashed border-[var(--sdk-color-border-default)] px-5 py-10 text-sm text-[var(--sdk-color-text-secondary)]">
                    {copy.inventory.emptyDiscover}
                  </div>
                ) : state.visibleCatalogCoupons.map((coupon) => (
                  <article
                    className="rounded-[1.6rem] border p-5 shadow-[var(--sdk-shadow-sm)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--sdk-shadow-md)]"
                    key={coupon.id}
                    style={createSdkworkCouponPanelStyle("neutral", {
                      backgroundWeight: 8,
                      borderWeight: 20,
                      surfaceColor: "var(--sdk-color-surface-panel-muted)",
                    })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--sdk-color-text-primary)]">{coupon.name}</div>
                        <div className="mt-2 text-sm leading-7 text-[var(--sdk-color-text-secondary)]">
                          {coupon.description || copy.inventory.catalogFallbackDescription}
                        </div>
                      </div>
                      <div
                        className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                        data-sdk-coupon-status={coupon.status}
                        data-sdk-tone={resolveSdkworkCouponStatusTone(coupon.status)}
                        style={createSdkworkCouponMetricToneStyle(resolveSdkworkCouponStatusTone(coupon.status))}
                      >
                        {formatStatus(coupon.status)}
                      </div>
                    </div>

                    <div className="mt-5 text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                      {formatCurrencyCny(coupon.amountCny)}
                    </div>
                    <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                      {copy.inventory.pointCostLabel}: {formatPointCost(coupon.pointCost)}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button onClick={() => void controller.openCatalogDetail(coupon.id)} type="button" variant="outline">
                        {copy.actions.viewDetails}
                      </Button>
                      {coupon.canReceive ? (
                        <Button onClick={() => void controller.receiveCoupon(coupon.id)} type="button">
                          {copy.actions.claimCoupon}
                        </Button>
                      ) : null}
                      {coupon.pointsExchange ? (
                        <Button onClick={() => void controller.exchangeCouponByPoints({ couponId: coupon.id })} type="button" variant="outline">
                          {copy.actions.exchangePoints}
                        </Button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
                {state.visibleUserCoupons.length === 0 ? (
                  <div className="col-span-full rounded-[1.4rem] border border-dashed border-[var(--sdk-color-border-default)] px-5 py-10 text-sm text-[var(--sdk-color-text-secondary)]">
                    {copy.inventory.emptyVisible}
                  </div>
                ) : state.visibleUserCoupons.map((coupon) => (
                  <article
                    className="rounded-[1.6rem] border p-5 shadow-[var(--sdk-shadow-sm)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--sdk-shadow-md)]"
                    key={coupon.id}
                    style={createSdkworkCouponPanelStyle("neutral", {
                      backgroundWeight: 8,
                      borderWeight: 20,
                      surfaceColor: "var(--sdk-color-surface-panel-muted)",
                    })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--sdk-color-text-primary)]">{coupon.name}</div>
                        <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                          {copy.inventory.codeLabel}: {coupon.code || copy.common.emptyValue}
                        </div>
                      </div>
                      <div
                        className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                        data-sdk-coupon-status={coupon.status}
                        data-sdk-tone={resolveSdkworkCouponStatusTone(coupon.status)}
                        style={createSdkworkCouponMetricToneStyle(resolveSdkworkCouponStatusTone(coupon.status))}
                      >
                        {formatStatus(coupon.status)}
                      </div>
                    </div>

                    <div className="mt-5 text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                      {formatCurrencyCny(coupon.amountCny)}
                    </div>
                    <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                      {copy.inventory.remainingDaysLabel}: {formatRemainingDays(coupon.remainingDays)}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button
                        onClick={() => void controller.openUserCouponDetail(coupon.userCouponId ?? coupon.id)}
                        type="button"
                        variant="outline"
                      >
                        {copy.actions.viewDetails}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <SdkworkCouponRedeemDialog controller={controller} />
      <SdkworkCouponDetailDrawer controller={controller} />
    </div>
  );
}

export function SdkworkCouponPage({
  locale,
  messages,
  ...props
}: SdkworkCouponPageProps) {
  const content = <SdkworkCouponPageContent {...props} />;

  if (locale || messages) {
    return (
      <SdkworkCouponIntlProvider locale={locale} messages={messages}>
        {content}
      </SdkworkCouponIntlProvider>
    );
  }

  return content;
}
