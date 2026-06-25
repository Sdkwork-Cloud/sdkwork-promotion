import {
  Suspense,
  useEffect,
  useState,
} from "react";
import {
  Coins,
  Crown,
} from "lucide-react";
import { createSdkworkPointsToneStyle } from "../points-appearance";
import type { SdkworkPointsController } from "../points-controller";
import {
  useSdkworkPointsController,
  useSdkworkPointsControllerState,
} from "../points-controller";
import { useSdkworkPointsIntl } from "../points-intl";
import { SdkworkPointsQuickPanel } from "./points-quick-panel";
import { SdkworkPointsRechargeDialog } from "./points-recharge-dialog";
import { SdkworkPointsUpgradeDialog } from "./points-upgrade-dialog";

export interface SdkworkPointsHeaderEntryProps {
  controller?: SdkworkPointsController;
  onOpenPage?: () => void;
}

export function SdkworkPointsHeaderEntry({
  controller: controllerProp,
  onOpenPage,
}: SdkworkPointsHeaderEntryProps) {
  const controller = useSdkworkPointsController(controllerProp);
  const state = useSdkworkPointsControllerState(controller);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const {
    copy,
    formatPoints,
  } = useSdkworkPointsIntl();

  useEffect(() => {
    if (!state.isBootstrapped && !state.isLoading) {
      void controller.bootstrap();
    }
  }, [controller, state.isBootstrapped, state.isLoading]);

  return (
    <div className="relative flex items-center gap-2">
      <button
        className="inline-flex h-9 items-center gap-2 rounded-[1rem] border px-3 text-sm font-medium"
        onClick={() => controller.openUpgrade()}
        style={createSdkworkPointsToneStyle("accent", {
          backgroundWeight: 12,
          borderWeight: 24,
        })}
        type="button"
      >
        <Crown className="h-4 w-4" />
        {copy.actions.upgrade}
      </button>

      <button
        aria-label={copy.headerEntry.balanceAriaLabel}
        className="inline-flex h-9 items-center gap-2 rounded-[1rem] border border-[var(--sdk-color-border-subtle)] bg-[var(--sdk-color-surface-panel-muted)] px-3 text-sm font-medium text-[var(--sdk-color-text-primary)]"
        onClick={() => setIsPanelOpen((current) => !current)}
        type="button"
      >
        <Coins className="h-4 w-4" />
        {formatPoints(state.dashboard.summary.balancePoints)} {copy.headerEntry.pointsSuffix}
      </button>

      {isPanelOpen ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50">
          <Suspense fallback={null}>
            <SdkworkPointsQuickPanel
              onOpenPage={() => {
                setIsPanelOpen(false);
                onOpenPage?.();
              }}
              onRecharge={() => {
                setIsPanelOpen(false);
                controller.openRecharge();
              }}
              onUpgrade={() => {
                setIsPanelOpen(false);
                controller.openUpgrade();
              }}
              recentTransactions={state.dashboard.transactions.slice(0, 4)}
              summary={state.dashboard.summary}
            />
          </Suspense>
        </div>
      ) : null}

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
  );
}
