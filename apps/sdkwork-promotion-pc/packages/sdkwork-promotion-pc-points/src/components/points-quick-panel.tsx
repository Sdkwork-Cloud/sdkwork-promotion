import {
  ArrowRight,
  Coins,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@sdkwork/ui-pc-react";
import {
  createSdkworkPointsGlassStyle,
  createSdkworkPointsHeroStyle,
  createSdkworkPointsHeroTextStyle,
  createSdkworkPointsPanelStyle,
  createSdkworkPointsToneStyle,
} from "../points-appearance";
import { useSdkworkPointsIntl } from "../points-intl";
import type {
  SdkworkPointsSummary,
  SdkworkPointsTransaction,
} from "../points-service";

export interface SdkworkPointsQuickPanelProps {
  onOpenPage: () => void;
  onRecharge: () => void;
  onUpgrade: () => void;
  recentTransactions: SdkworkPointsTransaction[];
  summary: SdkworkPointsSummary;
}

export function SdkworkPointsQuickPanel({
  onOpenPage,
  onRecharge,
  onUpgrade,
  recentTransactions,
  summary,
}: SdkworkPointsQuickPanelProps) {
  const {
    copy,
    formatCurrencyCny,
    formatCurrentPlanTitle,
    formatPoints,
    formatTransactionDelta,
  } = useSdkworkPointsIntl();
  const primaryHeroTextStyle = createSdkworkPointsHeroTextStyle();
  const mutedHeroTextStyle = createSdkworkPointsHeroTextStyle("muted");
  const subtleHeroTextStyle = createSdkworkPointsHeroTextStyle("subtle");

  return (
    <div
      className="w-[22rem] rounded-[1.5rem] border border-[var(--sdk-color-border-default)] p-4 shadow-[var(--sdk-shadow-lg)]"
      style={createSdkworkPointsPanelStyle("neutral", {
        backgroundWeight: 4,
        borderWeight: 18,
        surfaceWeight: 94,
      })}
    >
      <div
        className="rounded-[1.25rem] border border-[color-mix(in_srgb,var(--sdk-color-border-default)_72%,transparent)] p-4 text-white shadow-[var(--sdk-shadow-sm)]"
        style={createSdkworkPointsHeroStyle()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.18em]" style={subtleHeroTextStyle}>
              {copy.quickPanel.availablePointsLabel}
            </div>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {formatPoints(summary.balancePoints)}
            </div>
            <div className="mt-1 text-sm" style={mutedHeroTextStyle}>
              {summary.isAuthenticated ? copy.page.readyForGrowth : copy.quickPanel.signInToUnlock}
            </div>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[1rem] border"
            style={createSdkworkPointsToneStyle("brand", {
              backgroundWeight: 14,
              borderWeight: 24,
            })}
          >
            <Coins className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-[1rem] border px-3 py-2"
            style={createSdkworkPointsGlassStyle("neutral", {
              backgroundWeight: 10,
              borderWeight: 22,
              surfaceWeight: 78,
            })}
          >
            <div className="text-[0.65rem] uppercase tracking-[0.16em]" style={subtleHeroTextStyle}>
              {copy.quickPanel.currentPlanLabel}
            </div>
            <div className="mt-1 text-sm font-semibold" style={primaryHeroTextStyle}>{formatCurrentPlanTitle(summary.currentPlan)}</div>
          </div>
          <div
            className="rounded-[1rem] border px-3 py-2"
            style={createSdkworkPointsGlassStyle("brand", {
              backgroundWeight: 10,
              borderWeight: 22,
              surfaceWeight: 78,
            })}
          >
            <div className="text-[0.65rem] uppercase tracking-[0.16em]" style={subtleHeroTextStyle}>
              {copy.quickPanel.currentMonthLabel}
            </div>
            <div className="mt-1 text-sm font-semibold" style={primaryHeroTextStyle}>+{formatPoints(summary.earnedThisMonth)}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button className="justify-start" onClick={onRecharge} size="sm" type="button" variant="secondary">
          <Sparkles className="h-4 w-4" />
          {copy.actions.recharge}
        </Button>
        <Button className="justify-start" onClick={onUpgrade} size="sm" type="button" variant="outline">
          <Crown className="h-4 w-4" />
          {copy.actions.upgrade}
        </Button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[var(--sdk-color-text-primary)]">{copy.quickPanel.recentActivityTitle}</div>
          <button
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--sdk-color-brand-primary)]"
            onClick={onOpenPage}
            type="button"
          >
            {copy.quickPanel.openCenterAction}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="rounded-[1rem] border border-dashed border-[var(--sdk-color-border-default)] px-4 py-4 text-sm text-[var(--sdk-color-text-secondary)]">
              {copy.quickPanel.noRecentActivity}
            </div>
          ) : recentTransactions.map((transaction) => (
            <div
              className="rounded-[1rem] border border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel-muted)] px-4 py-3"
              key={transaction.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--sdk-color-text-primary)]">
                    {transaction.title}
                  </div>
                  <div className="mt-1 text-xs text-[var(--sdk-color-text-secondary)]">
                    {transaction.description || copy.quickPanel.fallbackDescription}
                  </div>
                </div>
                <div className={transaction.direction === "earned" ? "text-emerald-500" : "text-[var(--sdk-color-text-primary)]"}>
                  {formatTransactionDelta(transaction.points, transaction.direction)}
                </div>
              </div>
              {transaction.cashAmountCny !== undefined ? (
                <div className="mt-2 text-[0.7rem] text-[var(--sdk-color-text-muted)]">
                  {formatCurrencyCny(transaction.cashAmountCny)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
