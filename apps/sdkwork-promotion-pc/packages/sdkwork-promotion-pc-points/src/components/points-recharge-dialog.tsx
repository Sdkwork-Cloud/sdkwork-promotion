import {
  useEffect,
  useMemo,
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
  Input,
  StatusNotice,
} from "@sdkwork/ui-pc-react";
import { createSdkworkPointsPanelStyle } from "../points-appearance";
import type { SdkworkPointsController } from "../points-controller";
import { useSdkworkPointsControllerState } from "../points-controller";
import { useSdkworkPointsIntl } from "../points-intl";

export interface SdkworkPointsRechargeDialogProps {
  controller: SdkworkPointsController;
  onOpenChange?: (open: boolean) => void;
  open: boolean;
}

const PAYMENT_METHODS = ["WECHAT", "ALIPAY", "BANKCARD"] as const;

function sanitizeNumber(value: string): string {
  return value.replaceAll(/\D+/g, "").slice(0, 7);
}

export function SdkworkPointsRechargeDialog({
  controller,
  onOpenChange,
  open,
}: SdkworkPointsRechargeDialogProps) {
  const state = useSdkworkPointsControllerState(controller);
  const [selectedPoints, setSelectedPoints] = useState<number>(0);
  const [customPoints, setCustomPoints] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("WECHAT");
  const {
    copy,
    formatCurrencyCny,
    formatPaymentMethod,
    formatPoints,
    formatPointsRate,
  } = useSdkworkPointsIntl();
  const presetPoints = controller.service.getRechargePresets();
  const offers = state.dashboard.rechargeOffers;
  const effectivePoints = selectedPoints || Number.parseInt(customPoints || "0", 10) || 0;
  const payableAmount = state.dashboard.summary.pointsToCashRate
    ? Number((effectivePoints / state.dashboard.summary.pointsToCashRate).toFixed(2))
    : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const offerDefault = offers.find((offer) => offer.recommended)?.points ?? offers[0]?.points;
    const presetDefault = presetPoints[1] ?? presetPoints[0] ?? 0;
    setSelectedPoints(offerDefault ?? presetDefault);
    setCustomPoints("");
    setPaymentMethod("WECHAT");
  }, [offers, open, presetPoints]);

  const canSubmit = useMemo(
    () => state.dashboard.summary.isAuthenticated && effectivePoints > 0 && !state.isMutating,
    [effectivePoints, state.dashboard.summary.isAuthenticated, state.isMutating],
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(92vw,52rem)]">
        <DialogHeader>
          <DialogTitle>{copy.rechargeDialog.title}</DialogTitle>
          <DialogDescription>
            {copy.rechargeDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className="rounded-[1.25rem] border p-4"
            style={createSdkworkPointsPanelStyle("brand", {
              backgroundWeight: 8,
              borderWeight: 24,
              surfaceWeight: 92,
            })}
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-text-muted)]">
              {copy.rechargeDialog.selectionEyebrow}
            </div>
            <div className="mt-3 text-3xl font-semibold text-[var(--sdk-color-text-primary)]">
              {formatPoints(effectivePoints || 0)}
            </div>
            <div className="mt-2 text-sm text-[var(--sdk-color-text-secondary)]">
              {copy.rechargeDialog.rateLabel}: {formatPointsRate(state.dashboard.summary.pointsToCashRate)}
            </div>
            <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">
              {copy.rechargeDialog.estimatedPriceLabel}: {formatCurrencyCny(payableAmount)}
            </div>
          </div>

          {!state.dashboard.summary.isAuthenticated ? (
            <StatusNotice title={copy.rechargeDialog.signInRequiredTitle} tone="warning">
              {copy.rechargeDialog.signInRequiredDescription}
            </StatusNotice>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            {(offers.length > 0 ? offers.map((offer) => offer.points) : presetPoints).map((points) => (
              <Button
                key={points}
                onClick={() => {
                  setSelectedPoints(points);
                  setCustomPoints("");
                }}
                type="button"
                variant={selectedPoints === points ? "secondary" : "outline"}
              >
                {formatPoints(points)}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--sdk-color-text-primary)]" htmlFor="sdkwork-points-custom-value">
              {copy.rechargeDialog.customAmountLabel}
            </label>
            <Input
              id="sdkwork-points-custom-value"
              inputMode="numeric"
              onChange={(event) => {
                setSelectedPoints(0);
                setCustomPoints(sanitizeNumber(event.target.value));
              }}
              onFocus={() => setSelectedPoints(0)}
              placeholder={copy.rechargeDialog.customAmountPlaceholder}
              value={customPoints}
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
              {copy.rechargeDialog.paymentMethodLabel}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange?.(false)} type="button" variant="ghost">
            {copy.actions.cancel}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={state.isMutating}
            onClick={() => {
              void controller.rechargePoints({
                paymentMethod,
                points: effectivePoints,
              });
            }}
            type="button"
          >
            {copy.actions.confirmRecharge}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
