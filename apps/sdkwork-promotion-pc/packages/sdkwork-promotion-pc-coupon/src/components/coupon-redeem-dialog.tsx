import { useEffect, useState } from "react";
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
      <DialogContent className="w-[min(92vw,28rem)] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-[var(--sdk-color-border-subtle)] px-6 py-5">
          <DialogTitle>{copy.redeemDialog.title}</DialogTitle>
          <DialogDescription>{copy.redeemDialog.summaryDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {state.lastError ? (
            <StatusNotice title={copy.redeemDialog.errorTitle} tone="danger">
              {state.lastError}
            </StatusNotice>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void controller.redeemCoupon({
                redeemCode: redeemCode.trim(),
              }).catch(() => {});
            }}
          >
            <label className="block space-y-2" htmlFor="sdkwork-coupon-redeem-code">
              <span className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
                {copy.redeemDialog.inputLabel}
              </span>
              <Input
                id="sdkwork-coupon-redeem-code"
                onChange={(event) => setRedeemCode(event.target.value)}
                placeholder={copy.redeemDialog.inputPlaceholder}
                required
                value={redeemCode}
              />
            </label>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button onClick={() => controller.closeRedeemDialog()} type="button" variant="ghost">
                {copy.actions.close}
              </Button>
              <Button disabled={!redeemCode.trim()} loading={state.isMutating} type="submit">
                {copy.actions.redeemCode}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
