import {
  useEffect,
  useState,
} from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import { createSdkworkPointsPanelStyle } from "../points-appearance";
import type { SdkworkPointsController } from "../points-controller";
import { useSdkworkPointsControllerState } from "../points-controller";
import { useSdkworkPointsIntl } from "../points-intl";

export interface SdkworkPointsUpgradeDialogProps {
  controller: SdkworkPointsController;
  onOpenChange?: (open: boolean) => void;
  open: boolean;
}

const PAYMENT_METHODS = ["WECHAT", "ALIPAY"] as const;

export function SdkworkPointsUpgradeDialog({
  controller,
  onOpenChange,
  open,
}: SdkworkPointsUpgradeDialogProps) {
  const state = useSdkworkPointsControllerState(controller);
  const [selectedPackageId, setSelectedPackId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("WECHAT");
  const {
    copy,
    formatCurrencyCny,
    formatCurrentPlanTitle,
    formatDurationDays,
    formatPaymentMethod,
    formatPointsIncluded,
  } = useSdkworkPointsIntl();
  const selectedPlan =
    state.dashboard.plans.find((plan) => plan.packageId === selectedPackageId)
    ?? state.dashboard.plans[0]
    ?? null;
  const canSubmit = Boolean(selectedPlan) && state.dashboard.summary.isAuthenticated && !state.isMutating;

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedPackId(
      state.dashboard.plans.find((plan) => plan.recommended)?.packageId
      ?? state.dashboard.plans[0]?.packageId
      ?? null,
    );
    setPaymentMethod("WECHAT");
  }, [open, state.dashboard.plans]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(92vw,64rem)]">
        <DialogHeader>
          <DialogTitle>{copy.upgradeDialog.title}</DialogTitle>
          <DialogDescription>
            {copy.upgradeDialog.description}
          </DialogDescription>
        </DialogHeader>

        {!state.dashboard.summary.isAuthenticated ? (
          <StatusNotice title={copy.upgradeDialog.signInRequiredTitle} tone="warning">
            {copy.upgradeDialog.signInRequiredDescription}
          </StatusNotice>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            {state.dashboard.plans.map((plan) => {
              const isSelected = selectedPlan?.packageId === plan.packageId;

              return (
                <article
                  className="rounded-[1.5rem] border p-5 shadow-[var(--sdk-shadow-sm)]"
                  key={plan.packageId}
                  style={isSelected
                    ? createSdkworkPointsPanelStyle("accent", {
                      backgroundWeight: 10,
                      borderWeight: 28,
                      surfaceWeight: 92,
                    })
                    : undefined}
                >
                  {isSelected ? (
                    <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--sdk-color-brand-accent)]">
                      {copy.upgradeDialog.selected}
                    </div>
                  ) : null}
                  <div className="text-xl font-semibold text-[var(--sdk-color-text-primary)]">{plan.name}</div>
                  <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                    {plan.description || copy.upgradeDialog.noPlanFallbackDescription}
                  </div>
                  <div className="mt-5 text-4xl font-semibold text-[var(--sdk-color-text-primary)]">{formatCurrencyCny(plan.priceCny)}</div>
                  <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                    {formatPointsIncluded(plan.includedPoints)}
                  </div>
                  <Button
                    className="mt-6 w-full"
                    onClick={() => setSelectedPackId(plan.packageId)}
                    type="button"
                    variant={isSelected ? "secondary" : "outline"}
                  >
                    {isSelected ? copy.upgradeDialog.selected : copy.upgradeDialog.selectPlan}
                  </Button>
                </article>
              );
            })}
          </div>

          <div
            className="rounded-[1.5rem] border p-5"
            style={createSdkworkPointsPanelStyle("brand", {
              backgroundWeight: 6,
              borderWeight: 22,
              surfaceWeight: 93,
            })}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
              {copy.upgradeDialog.currentMembershipLabel}
            </div>
            <div className="mt-3 text-2xl font-semibold text-[var(--sdk-color-text-primary)]">
              {formatCurrentPlanTitle(state.dashboard.summary.currentPlan)}
            </div>

            {selectedPlan ? (
              <>
                <div className="mt-6 text-sm font-semibold text-[var(--sdk-color-text-primary)]">
                  {copy.upgradeDialog.selectedPackageLabel}
                </div>
                <div className="mt-2 rounded-[1rem] border border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel)] px-4 py-4">
                  <div className="text-lg font-semibold text-[var(--sdk-color-text-primary)]">{selectedPlan.name}</div>
                  <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
                    {selectedPlan.description || copy.upgradeDialog.noPlanFallbackDescription}
                  </div>
                  <div className="mt-4 text-sm text-[var(--sdk-color-text-secondary)]">
                    {formatDurationDays(selectedPlan.durationDays)}
                  </div>
                  <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">
                    {formatPointsIncluded(selectedPlan.includedPoints)}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
                    {copy.upgradeDialog.paymentMethodLabel}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((method) => (
                      <Button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        type="button"
                        variant={paymentMethod === method ? "secondary" : "outline"}
                      >
                        {formatPaymentMethod(method)}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <StatusNotice className="mt-6" title={copy.upgradeDialog.noPlanTitle}>
                {copy.upgradeDialog.noPlanDescription}
              </StatusNotice>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange?.(false)} type="button" variant="ghost">
            {copy.actions.cancel}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={state.isMutating}
            onClick={() => {
              if (!selectedPlan) {
                return;
              }

              void controller.upgradePlan({
                packageId: selectedPlan.packageId,
                paymentMethod,
              });
            }}
            type="button"
          >
            {copy.actions.confirmPayment}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
