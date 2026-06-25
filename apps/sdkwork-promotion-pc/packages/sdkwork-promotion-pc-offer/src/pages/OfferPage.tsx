import { useEffect } from "react";
import {
  BadgePercent,
  Coins,
  Crown,
  Sparkles,
} from "lucide-react";
import {
  Button,
  LoadingBlock,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import type { SdkworkOfferFilter } from "../offer";
import type { SdkworkOfferMessagesOverrides } from "../offer-copy";
import type { SdkworkOfferController } from "../offer-controller";
import {
  useSdkworkOfferController,
  useSdkworkOfferControllerState,
} from "../offer-controller";
import {
  createSdkworkOfferBackdropStyle,
  createSdkworkOfferGlassStyle,
  createSdkworkOfferHeroStyle,
  createSdkworkOfferHeroTextStyle,
  createSdkworkOfferPanelStyle,
  createSdkworkOfferToneStyle,
} from "../offer-appearance";
import {
  SdkworkOfferIntlProvider,
  useSdkworkOfferIntl,
} from "../offer-intl";
import type { SdkworkOfferService } from "../offer-service";

export interface SdkworkOfferPageProps {
  controller?: SdkworkOfferController;
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
  onNavigate?: (route: string) => void;
  service?: Partial<SdkworkOfferService>;
}

interface SdkworkOfferPageContentProps {
  controller?: SdkworkOfferController;
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
  onNavigate?: (route: string) => void;
  service?: Partial<SdkworkOfferService>;
}

const FILTERS: SdkworkOfferFilter[] = ["all", "membership", "recharge", "coupon"];

function SdkworkOfferPageContent({
  controller: controllerProp,
  locale,
  messages,
  onNavigate,
  service,
}: SdkworkOfferPageContentProps) {
  const controller = useSdkworkOfferController(controllerProp, {
    locale,
    messages,
    service,
  });
  const state = useSdkworkOfferControllerState(controller);
  const selectedOffer = state.selectedOffer;
  const {
    copy,
    formatCouponInventory,
    formatCouponInventoryMeta,
    formatCurrencyCny,
    formatFilterLabel,
    formatOfferSavings,
    formatPoints,
    formatMembershipTerm,
  } = useSdkworkOfferIntl();
  const heroHighlights = [
    {
      icon: BadgePercent,
      label: copy.page.featuredOffers,
      tone: "warning" as const,
      value: state.dashboard.digest.featuredOffers,
    },
    {
      icon: Coins,
      label: copy.page.availablePoints,
      tone: "brand" as const,
      value: formatPoints(state.dashboard.inventory.availablePoints),
    },
    {
      icon: Crown,
      label: copy.page.bestSavings,
      tone: "success" as const,
      value: formatCurrencyCny(state.dashboard.digest.highlightedSavingsCny),
    },
  ];

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  return (
    <div className="relative h-full overflow-y-auto">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80"
        style={createSdkworkOfferBackdropStyle()}
      />

      <div className="relative px-4 py-4 sm:px-5 sm:py-5">
        <div className="mx-auto max-w-[90rem] space-y-5">
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,0.9fr)]">
            <div
              className="overflow-hidden rounded-[2rem] border px-6 py-7 shadow-[var(--sdk-shadow-lg)]"
              style={{
                ...createSdkworkOfferHeroStyle(),
                ...createSdkworkOfferHeroTextStyle(),
              }}
            >
              <div className="max-w-3xl">
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] shadow-[var(--sdk-shadow-soft)]"
                  style={createSdkworkOfferToneStyle("accent", {
                    backgroundWeight: 16,
                    borderWeight: 26,
                  })}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {copy.page.eyebrow}
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight">{copy.page.title}</h1>
                <p
                  className="mt-3 max-w-2xl text-sm leading-7"
                  style={createSdkworkOfferHeroTextStyle("muted")}
                >
                  {copy.page.description}
                </p>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {heroHighlights.map((highlight) => {
                  const Icon = highlight.icon;

                  return (
                    <div
                      className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)] backdrop-blur-xl"
                      key={highlight.label}
                      style={createSdkworkOfferGlassStyle(highlight.tone, {
                        backgroundWeight: 14,
                        borderWeight: 26,
                      })}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div
                            className="text-sm"
                            style={createSdkworkOfferHeroTextStyle("subtle")}
                          >
                            {highlight.label}
                          </div>
                          <div className="mt-3 text-4xl font-semibold tracking-tight">
                            {highlight.value}
                          </div>
                        </div>
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                          style={createSdkworkOfferToneStyle(highlight.tone, {
                            backgroundWeight: 20,
                            borderWeight: 34,
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

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <div
                className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-soft)]"
                style={createSdkworkOfferPanelStyle("neutral")}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sdk-color-text-muted)]">
                  {copy.inventory.accountLevel}
                </div>
                <div className="mt-3 text-lg font-semibold text-[var(--sdk-color-text-primary)]">
                  {state.dashboard.inventory.currentLevelName}
                </div>
              </div>

              <div
                className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-soft)]"
                style={createSdkworkOfferPanelStyle("neutral")}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sdk-color-text-muted)]">
                  {copy.inventory.couponInventory}
                </div>
                <div className="mt-3 text-lg font-semibold text-[var(--sdk-color-text-primary)]">
                  {formatCouponInventory(state.dashboard.inventory.availableCoupons)}
                </div>
                <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">
                  {formatCouponInventoryMeta(
                    state.dashboard.inventory.claimableCoupons,
                    state.dashboard.inventory.expiringSoonCoupons,
                  )}
                </div>
              </div>

              <div
                className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-soft)]"
                style={createSdkworkOfferPanelStyle("neutral")}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--sdk-color-text-muted)]">
                  {copy.inventory.membershipTerm}
                </div>
                <div className="mt-3 text-lg font-semibold text-[var(--sdk-color-text-primary)]">
                  {formatMembershipTerm(state.dashboard.inventory.membershipRemainingDays)}
                </div>
              </div>
            </div>
          </section>

          {state.isLoading && !state.isBootstrapped ? <LoadingBlock label={copy.page.loading} /> : null}

          {state.lastError ? (
            <StatusNotice title={copy.page.errorTitle} tone="danger">
              {state.lastError}
            </StatusNotice>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.85fr)]">
            <div
              className="rounded-[1.5rem] border shadow-[var(--sdk-shadow-md)]"
              style={createSdkworkOfferPanelStyle("neutral")}
            >
              <div className="border-b border-[var(--sdk-color-border-subtle)] px-6 py-5">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <Button
                      key={filter}
                      onClick={() => controller.setFilter(filter)}
                      size="sm"
                      type="button"
                      variant={state.activeFilter === filter ? "secondary" : "ghost"}
                    >
                      {formatFilterLabel(filter)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
                {state.visibleOffers.length === 0 ? (
                  <div className="col-span-full rounded-[1.3rem] border border-dashed border-[var(--sdk-color-border-default)] px-5 py-10 text-sm text-[var(--sdk-color-text-secondary)]">
                    {copy.offers.empty}
                  </div>
                ) : state.visibleOffers.map((offer) => (
                  <button
                    className="rounded-[1.5rem] border p-5 text-left transition-colors shadow-[var(--sdk-shadow-sm)]"
                    key={offer.id}
                    onClick={() => controller.selectOffer(offer.id)}
                    style={state.selectedOfferId === offer.id
                      ? createSdkworkOfferPanelStyle("accent", {
                        backgroundWeight: 14,
                        borderWeight: 34,
                        surfaceColor: "var(--sdk-color-surface-panel-muted)",
                      })
                      : createSdkworkOfferPanelStyle("neutral", {
                        backgroundWeight: 8,
                        borderWeight: 24,
                        surfaceColor: "var(--sdk-color-surface-panel-muted)",
                      })}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--sdk-color-text-primary)]">
                          {offer.title}
                        </h3>
                        <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                          {offer.description || copy.offers.fallbackDescription}
                        </div>
                      </div>
                      {offer.recommended ? (
                        <span
                          className="rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em]"
                          style={createSdkworkOfferToneStyle("accent", {
                            backgroundWeight: 14,
                            borderWeight: 24,
                          })}
                        >
                          {copy.offers.featuredBadge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 text-3xl font-semibold text-[var(--sdk-color-text-primary)]">
                      {offer.priceCny === null
                        ? copy.common.emptyValue
                        : formatCurrencyCny(offer.priceCny)}
                    </div>
                    <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                      {formatOfferSavings(offer.estimatedSavingsCny)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <aside
              className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-md)]"
              style={createSdkworkOfferPanelStyle("neutral")}
            >
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--sdk-color-text-muted)]">
                {copy.selected.eyebrow}
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--sdk-color-text-primary)]">
                {selectedOffer?.title || copy.common.noOfferSelected}
              </h2>

              {selectedOffer ? (
                <>
                  <div className="mt-3 text-sm leading-6 text-[var(--sdk-color-text-secondary)]">
                    {selectedOffer.description || copy.selected.detailFallback}
                  </div>

                  <div
                    className="mt-5 rounded-[1.35rem] border p-4"
                    style={createSdkworkOfferPanelStyle("neutral", {
                      backgroundWeight: 8,
                      borderWeight: 24,
                      surfaceColor: "var(--sdk-color-surface-panel-muted)",
                    })}
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--sdk-color-text-secondary)]">{copy.selected.priceLabel}</span>
                      <span className="font-semibold text-[var(--sdk-color-text-primary)]">
                        {selectedOffer.priceCny === null
                          ? copy.common.emptyValue
                          : formatCurrencyCny(selectedOffer.priceCny)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--sdk-color-text-secondary)]">{copy.selected.savingsLabel}</span>
                      <span
                        className="font-semibold"
                        style={{ color: "var(--sdk-color-state-success)" }}
                      >
                        {formatCurrencyCny(selectedOffer.estimatedSavingsCny)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="text-[var(--sdk-color-text-secondary)]">{copy.selected.routeLabel}</span>
                      <span className="max-w-[12rem] truncate font-medium text-[var(--sdk-color-text-primary)]">
                        {selectedOffer.action.route}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="mt-5 w-full"
                    onClick={() => onNavigate?.(selectedOffer.action.route)}
                    type="button"
                  >
                    {selectedOffer.action.label}
                  </Button>
                </>
              ) : (
                <div className="mt-5 rounded-[1.3rem] border border-dashed border-[var(--sdk-color-border-default)] px-5 py-10 text-sm text-[var(--sdk-color-text-secondary)]">
                  {copy.selected.emptyDescription}
                </div>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SdkworkOfferPage({
  locale,
  messages,
  ...props
}: SdkworkOfferPageProps) {
  const content = (
    <SdkworkOfferPageContent
      {...props}
      locale={locale}
      messages={messages}
    />
  );

  if (locale || messages) {
    return (
      <SdkworkOfferIntlProvider locale={locale} messages={messages}>
        {content}
      </SdkworkOfferIntlProvider>
    );
  }

  return content;
}
