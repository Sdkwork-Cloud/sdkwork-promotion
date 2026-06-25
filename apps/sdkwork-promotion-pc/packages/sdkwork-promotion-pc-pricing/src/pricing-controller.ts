import {
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  SdkworkPricingBillingModel,
  SdkworkPricingCatalogData,
  SdkworkPricingPlan,
} from "./pricing";
import {
  createSdkworkPricingMessages,
  type SdkworkPricingMessagesOverrides,
} from "./pricing-copy";
import {
  createSdkworkPricingService,
  type SdkworkPricingService,
} from "./pricing-service";

export type SdkworkPricingBillingModelFilter = SdkworkPricingBillingModel | "all";

export interface SdkworkPricingControllerState {
  activeBillingModel: SdkworkPricingBillingModelFilter;
  catalog: SdkworkPricingCatalogData;
  isBootstrapped: boolean;
  isLoading: boolean;
  lastError?: string;
  selectedPlan: SdkworkPricingPlan | null;
  selectedPlanId: string | null;
  visiblePlans: SdkworkPricingPlan[];
}

export interface SdkworkPricingController {
  bootstrap(): Promise<SdkworkPricingControllerState>;
  getState(): SdkworkPricingControllerState;
  refresh(): Promise<SdkworkPricingControllerState>;
  selectPlan(planId: string | null): void;
  service: SdkworkPricingService;
  setBillingModel(billingModel: SdkworkPricingBillingModelFilter): void;
  subscribe(listener: () => void): () => void;
}

export interface CreateSdkworkPricingControllerOptions {
  initialState?: Partial<SdkworkPricingControllerState>;
  locale?: string | null;
  messages?: SdkworkPricingMessagesOverrides;
  service?: Partial<SdkworkPricingService>;
}

function deriveVisiblePlans(
  catalog: SdkworkPricingCatalogData,
  activeBillingModel: SdkworkPricingBillingModelFilter,
): SdkworkPricingPlan[] {
  if (activeBillingModel === "all") {
    return catalog.plans;
  }

  return catalog.plans.filter((plan) => plan.billingModel === activeBillingModel);
}

function resolveSelectedPlanId(
  plans: readonly SdkworkPricingPlan[],
  selectedPlanId: string | null,
): string | null {
  if (selectedPlanId && plans.some((plan) => plan.id === selectedPlanId)) {
    return selectedPlanId;
  }

  return plans.find((plan) => plan.current)?.id
    ?? plans.find((plan) => plan.recommended)?.id
    ?? plans[0]?.id
    ?? null;
}

function normalizeState(
  state: SdkworkPricingControllerState,
): SdkworkPricingControllerState {
  const visiblePlans = deriveVisiblePlans(state.catalog, state.activeBillingModel);
  const selectedPlanId = resolveSelectedPlanId(visiblePlans, state.selectedPlanId);

  return {
    ...state,
    selectedPlan: visiblePlans.find((plan) => plan.id === selectedPlanId) ?? null,
    selectedPlanId,
    visiblePlans,
  };
}

export function createSdkworkPricingController(
  options: CreateSdkworkPricingControllerOptions = {},
): SdkworkPricingController {
  const copy = createSdkworkPricingMessages(options.locale, options.messages).controller;
  const fallbackCatalog = (
    options.service?.getEmptyCatalog
    ?? createSdkworkPricingService({
      locale: options.locale,
      messages: options.messages,
    }).getEmptyCatalog
  )();
  const service: SdkworkPricingService = options.service
    ? {
        ...createSdkworkPricingService({
          locale: options.locale,
          messages: options.messages,
        }),
        ...options.service,
      }
    : createSdkworkPricingService({
        locale: options.locale,
        messages: options.messages,
      });
  const listeners = new Set<() => void>();
  let state = normalizeState({
    activeBillingModel: "all",
    catalog: fallbackCatalog,
    isBootstrapped: false,
    isLoading: false,
    selectedPlan: null,
    selectedPlanId: null,
    visiblePlans: fallbackCatalog.plans,
    ...options.initialState,
  });

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  function setState(
    next:
      | Partial<SdkworkPricingControllerState>
      | ((currentState: SdkworkPricingControllerState) => Partial<SdkworkPricingControllerState>),
  ): void {
    const partial = typeof next === "function" ? next(state) : next;
    state = normalizeState({
      ...state,
      ...partial,
    });
    emit();
  }

  return {
    async bootstrap() {
      setState({
        isLoading: true,
        lastError: undefined,
      });

      try {
        const catalog = await service.getCatalog();
        setState({
          catalog,
          isBootstrapped: true,
          isLoading: false,
          selectedPlanId: null,
        });
        return state;
      } catch (error) {
        setState({
          isLoading: false,
          lastError: error instanceof Error ? error.message : copy.bootstrapFailed,
        });
        throw error;
      }
    },

    getState() {
      return state;
    },

    async refresh() {
      const catalog = await service.getCatalog();
      setState({
        catalog,
        isBootstrapped: true,
        isLoading: false,
      });
      return state;
    },

    selectPlan(planId) {
      setState({
        selectedPlanId: planId,
      });
    },

    service,

    setBillingModel(billingModel) {
      setState({
        activeBillingModel: billingModel,
        selectedPlanId: null,
      });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useSdkworkPricingController(
  controller?: SdkworkPricingController,
  options?: Pick<CreateSdkworkPricingControllerOptions, "locale" | "messages" | "service">,
): SdkworkPricingController {
  return useMemo(
    () => controller ?? createSdkworkPricingController({
      ...(options?.locale ? { locale: options.locale } : {}),
      ...(options?.messages ? { messages: options.messages } : {}),
      ...(options?.service ? { service: options.service } : {}),
    }),
    [controller, options?.locale, options?.messages, options?.service],
  );
}

export function useSdkworkPricingControllerState(
  controller: SdkworkPricingController,
): SdkworkPricingControllerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
