import {
  useEffect,
  useState,
} from "react";
import {
  Check,
  Sparkles,
  TicketPercent,
} from "lucide-react";
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
import type { SdkworkCouponController } from "../coupon-controller";
import { useSdkworkCouponControllerState } from "../coupon-controller";
import {
  createSdkworkCouponGlassStyle,
  createSdkworkCouponPanelStyle,
  createSdkworkCouponToneStyle,
} from "../coupon-appearance";
import { useSdkworkCouponIntl } from "../coupon-intl";

export interface SdkworkCouponRedeemDialogProps {
  controller: SdkworkCouponController;
}

export function SdkworkCouponRedeemDialog({
  controller,
}: SdkworkCouponRedeemDialogProps) {
  const state = useSdkworkCouponControllerState(controller);
  const { copy } = useSdkworkCouponIntl();
  const [redeemCode, setRedeemCode] = useState("");

  useEffect(() => {
    if (state.isRedeemOpen) {
      setRedeemCode("");
    }
  }, [state.isRedeemOpen]);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          controller.closeRedeemDialog();
        }
      }}
      open={state.isRedeemOpen}
    >
      <DialogContent className="w-[min(92vw,56rem)] overflow-hidden p-0">
        <div className="border-b border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel)] px-6 py-5">
          <DialogHeader className="gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--sdk-color-text-muted)]">
              {copy.redeemDialog.eyebrow}
            </div>
            <DialogTitle className="text-3xl tracking-tight">{copy.redeemDialog.title}</DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-7">
              {copy.redeemDialog.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div
          className="grid gap-6 bg-[var(--sdk-color-surface-panel-muted)] px-6 py-6 xl:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]"
          style={{
            backgroundImage: "radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--sdk-color-brand-accent)_10%,transparent),transparent_28%),linear-gradient(180deg,color-mix(in_srgb,var(--sdk-color-surface-panel)_96%,transparent),color-mix(in_srgb,var(--sdk-color-surface-panel-muted)_92%,transparent))",
          }}
        >
          <section
            className="rounded-[1.8rem] border p-5 shadow-[var(--sdk-shadow-md)]"
            data-slot="coupon-redeem-summary"
            style={createSdkworkCouponPanelStyle("brand", {
              backgroundWeight: 8,
              borderWeight: 22,
              surfaceColor: "var(--sdk-color-surface-panel)",
            })}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--sdk-color-text-muted)]">
              {copy.redeemDialog.summaryTitle}
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--sdk-color-text-secondary)]">
              {copy.redeemDialog.summaryDescription}
            </p>

            <div
              className="mt-5 rounded-[1.6rem] border p-5"
              style={createSdkworkCouponToneStyle("brand", {
                backgroundWeight: 10,
                borderWeight: 22,
              })}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    {copy.redeemDialog.previewLabel}
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight">
                    {redeemCode.trim() || copy.redeemDialog.inputPlaceholder}
                  </div>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[1rem] border"
                  style={createSdkworkCouponToneStyle("accent", {
                    backgroundWeight: 16,
                    borderWeight: 30,
                  })}
                >
                  <TicketPercent className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                copy.redeemDialog.benefitInventory,
                copy.redeemDialog.benefitCheckout,
                copy.redeemDialog.benefitRecovery,
              ].map((benefit) => (
                <div
                  className="flex items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-sm text-[var(--sdk-color-text-secondary)]"
                  key={benefit}
                  style={createSdkworkCouponGlassStyle("neutral", {
                    backgroundWeight: 8,
                    borderWeight: 18,
                    surfaceColor: "var(--sdk-color-surface-panel-muted)",
                  })}
                >
                  <div
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                    style={createSdkworkCouponToneStyle("accent", {
                      backgroundWeight: 12,
                      borderWeight: 22,
                    })}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-[1.8rem] border p-5 shadow-[var(--sdk-shadow-md)]"
            data-slot="coupon-redeem-form"
            style={createSdkworkCouponPanelStyle("neutral", {
              backgroundWeight: 8,
              borderWeight: 18,
              surfaceColor: "var(--sdk-color-surface-panel)",
            })}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--sdk-color-text-muted)]">
                  {copy.actions.redeemCode}
                </div>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)]">
                  {copy.redeemDialog.title}
                </h3>
              </div>
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border"
                style={createSdkworkCouponToneStyle("brand", {
                  backgroundWeight: 14,
                  borderWeight: 26,
                })}
              >
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            {state.lastError ? (
              <StatusNotice className="mt-5" title={copy.redeemDialog.errorTitle} tone="danger">
                {state.lastError}
              </StatusNotice>
            ) : null}

            <form
              className="mt-5 space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                void controller.redeemCoupon({
                  redeemCode: redeemCode.trim(),
                });
              }}
            >
              <label className="space-y-2 text-sm text-[var(--sdk-color-text-secondary)]" htmlFor="sdkwork-coupon-redeem-code">
                <span className="font-medium text-[var(--sdk-color-text-primary)]">{copy.redeemDialog.inputLabel}</span>
                <Input
                  className="h-12 rounded-2xl border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-4 text-base shadow-none focus-visible:border-[var(--sdk-color-brand-primary)] focus-visible:bg-[var(--sdk-color-surface-panel)] focus-visible:ring-0"
                  id="sdkwork-coupon-redeem-code"
                  onChange={(event) => setRedeemCode(event.target.value)}
                  placeholder={copy.redeemDialog.inputPlaceholder}
                  required
                  value={redeemCode}
                />
              </label>

              <DialogFooter className="justify-between">
                <Button onClick={() => controller.closeRedeemDialog()} type="button" variant="ghost">
                  {copy.actions.close}
                </Button>
                <Button className="min-w-36 rounded-2xl" disabled={!redeemCode.trim()} loading={state.isMutating} type="submit">
                  {copy.actions.redeemCode}
                </Button>
              </DialogFooter>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
