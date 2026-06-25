import {
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  createSdkworkPointsService,
  filterSdkworkPointsTransactions,
  type SdkworkPointsDashboardData,
  type SdkworkPointsRechargeInput,
  type SdkworkPointsRechargeResult,
  type SdkworkPointsService,
  type SdkworkPointsTransaction,
  type SdkworkPointsTransactionFilter,
  type SdkworkPointsUpgradeInput,
  type SdkworkPointsUpgradeResult,
} from "./points-service";

export interface SdkworkPointsControllerState {
  activeFilter: SdkworkPointsTransactionFilter;
  dashboard: SdkworkPointsDashboardData;
  isBootstrapped: boolean;
  isLoading: boolean;
  isMutating: boolean;
  isRechargeOpen: boolean;
  isUpgradeOpen: boolean;
  lastError?: string;
  visibleTransactions: SdkworkPointsTransaction[];
}

export interface SdkworkPointsController {
  bootstrap(): Promise<SdkworkPointsControllerState>;
  closeRecharge(): void;
  closeUpgrade(): void;
  getState(): SdkworkPointsControllerState;
  openRecharge(): void;
  openUpgrade(): void;
  rechargePoints(input: SdkworkPointsRechargeInput): Promise<SdkworkPointsRechargeResult>;
  refresh(): Promise<SdkworkPointsControllerState>;
  service: SdkworkPointsService;
  setFilter(filter: SdkworkPointsTransactionFilter): void;
  subscribe(listener: () => void): () => void;
  upgradePlan(input: SdkworkPointsUpgradeInput): Promise<SdkworkPointsUpgradeResult>;
}

export interface CreateSdkworkPointsControllerOptions {
  initialState?: Partial<SdkworkPointsControllerState>;
  service?: Partial<SdkworkPointsService>;
}

function deriveVisibleTransactions(
  dashboard: SdkworkPointsDashboardData,
  activeFilter: SdkworkPointsTransactionFilter,
): SdkworkPointsTransaction[] {
  return filterSdkworkPointsTransactions(dashboard.transactions, activeFilter);
}

export function createSdkworkPointsController(
  options: CreateSdkworkPointsControllerOptions = {},
): SdkworkPointsController {
  const service: SdkworkPointsService = options.service
    ? {
        ...createSdkworkPointsService(),
        ...options.service,
      }
    : createSdkworkPointsService();
  const listeners = new Set<() => void>();
  let state: SdkworkPointsControllerState = {
    activeFilter: "all",
    dashboard: service.getEmptyDashboard(),
    isBootstrapped: false,
    isLoading: false,
    isMutating: false,
    isRechargeOpen: false,
    isUpgradeOpen: false,
    visibleTransactions: [],
    ...options.initialState,
  };
  state.visibleTransactions = deriveVisibleTransactions(state.dashboard, state.activeFilter);

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  function setState(
    next:
      | Partial<SdkworkPointsControllerState>
      | ((currentState: SdkworkPointsControllerState) => Partial<SdkworkPointsControllerState>),
  ): void {
    const partial = typeof next === "function" ? next(state) : next;
    state = {
      ...state,
      ...partial,
    };
    state.visibleTransactions = deriveVisibleTransactions(state.dashboard, state.activeFilter);
    emit();
  }

  async function loadDashboard(): Promise<SdkworkPointsDashboardData> {
    return service.getDashboard();
  }

  async function runMutation<TResult>(callback: () => Promise<TResult>): Promise<TResult> {
    setState({
      isMutating: true,
      lastError: undefined,
    });

    try {
      const result = await callback();
      const dashboard = await loadDashboard();
      setState({
        dashboard,
        isBootstrapped: true,
        isMutating: false,
      });
      return result;
    } catch (error) {
      setState({
        isMutating: false,
        lastError: error instanceof Error ? error.message : "Points request failed.",
      });
      throw error;
    }
  }

  return {
    async bootstrap() {
      setState({
        isLoading: true,
        lastError: undefined,
      });

      try {
        const dashboard = await loadDashboard();
        setState({
          dashboard,
          isBootstrapped: true,
          isLoading: false,
        });
        return state;
      } catch (error) {
        setState({
          isLoading: false,
          lastError: error instanceof Error ? error.message : "Failed to load points center.",
        });
        throw error;
      }
    },

    closeRecharge() {
      setState({
        isRechargeOpen: false,
      });
    },

    closeUpgrade() {
      setState({
        isUpgradeOpen: false,
      });
    },

    getState() {
      return state;
    },

    openRecharge() {
      setState({
        isRechargeOpen: true,
      });
    },

    openUpgrade() {
      setState({
        isUpgradeOpen: true,
      });
    },

    async rechargePoints(input) {
      const result = await runMutation(() => service.rechargePoints(input));
      setState({
        isRechargeOpen: false,
      });
      return result;
    },

    async refresh() {
      const dashboard = await loadDashboard();
      setState({
        dashboard,
        isBootstrapped: true,
        isLoading: false,
      });
      return state;
    },

    service,

    setFilter(filter) {
      setState({
        activeFilter: filter,
      });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async upgradePlan(input) {
      const result = await runMutation(() => service.upgradePlan(input));
      setState({
        isUpgradeOpen: false,
      });
      return result;
    },
  };
}

export function useSdkworkPointsController(
  controller?: SdkworkPointsController,
): SdkworkPointsController {
  return useMemo(() => controller ?? createSdkworkPointsController(), [controller]);
}

export function useSdkworkPointsControllerState(
  controller: SdkworkPointsController,
): SdkworkPointsControllerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
