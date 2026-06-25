import {
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  SdkworkCommercialOffer,
  SdkworkOfferDashboardData,
  SdkworkOfferFilter,
} from "./offer";
import {
  createSdkworkOfferMessages,
  type SdkworkOfferMessagesOverrides,
} from "./offer-copy";
import {
  createSdkworkOfferService,
  type SdkworkOfferService,
} from "./offer-service";

export interface SdkworkOfferControllerState {
  activeFilter: SdkworkOfferFilter;
  dashboard: SdkworkOfferDashboardData;
  isBootstrapped: boolean;
  isLoading: boolean;
  lastError?: string;
  selectedOffer: SdkworkCommercialOffer | null;
  selectedOfferId: string | null;
  visibleOffers: SdkworkCommercialOffer[];
}

export interface SdkworkOfferController {
  bootstrap(): Promise<SdkworkOfferControllerState>;
  getState(): SdkworkOfferControllerState;
  refresh(): Promise<SdkworkOfferControllerState>;
  selectOffer(offerId: string | null): void;
  service: SdkworkOfferService;
  setFilter(filter: SdkworkOfferFilter): void;
  subscribe(listener: () => void): () => void;
}

export interface CreateSdkworkOfferControllerOptions {
  initialState?: Partial<SdkworkOfferControllerState>;
  locale?: string | null;
  messages?: SdkworkOfferMessagesOverrides;
  service?: Partial<SdkworkOfferService>;
}

function normalizeDashboard(
  dashboard: SdkworkOfferDashboardData | undefined,
  fallbackDashboard: SdkworkOfferDashboardData,
): SdkworkOfferDashboardData {
  const resolvedDashboard = dashboard ?? fallbackDashboard;

  return {
    ...fallbackDashboard,
    ...resolvedDashboard,
    digest: resolvedDashboard.digest ?? fallbackDashboard.digest,
    featuredOffers: [...(resolvedDashboard.featuredOffers ?? fallbackDashboard.featuredOffers ?? [])],
    inventory: resolvedDashboard.inventory ?? fallbackDashboard.inventory,
  };
}

function deriveVisibleOffers(
  dashboard: SdkworkOfferDashboardData,
  filter: SdkworkOfferFilter,
): SdkworkCommercialOffer[] {
  if (filter === "all") {
    return dashboard.featuredOffers;
  }

  return dashboard.featuredOffers.filter((offer) => offer.group === filter);
}

function resolveSelectedOfferId(
  visibleOffers: readonly SdkworkCommercialOffer[],
  selectedOfferId: string | null,
): string | null {
  if (selectedOfferId && visibleOffers.some((offer) => offer.id === selectedOfferId)) {
    return selectedOfferId;
  }

  return visibleOffers[0]?.id ?? null;
}

function normalizeState(
  state: SdkworkOfferControllerState,
  fallbackDashboard: SdkworkOfferDashboardData,
): SdkworkOfferControllerState {
  const dashboard = normalizeDashboard(state.dashboard, fallbackDashboard);
  const visibleOffers = deriveVisibleOffers(dashboard, state.activeFilter);
  const selectedOfferId = resolveSelectedOfferId(visibleOffers, state.selectedOfferId);

  return {
    ...state,
    dashboard,
    selectedOffer: visibleOffers.find((offer) => offer.id === selectedOfferId) ?? null,
    selectedOfferId,
    visibleOffers,
  };
}

export function createSdkworkOfferController(
  options: CreateSdkworkOfferControllerOptions = {},
): SdkworkOfferController {
  const copy = createSdkworkOfferMessages(options.locale, options.messages).controller;
  const fallbackDashboard = (
    options.service?.getEmptyDashboard
    ?? createSdkworkOfferService({
      locale: options.locale,
      messages: options.messages,
    }).getEmptyDashboard
  )();
  const service: SdkworkOfferService = options.service
    ? {
        ...createSdkworkOfferService({
          locale: options.locale,
          messages: options.messages,
        }),
        ...options.service,
      }
    : createSdkworkOfferService({
        locale: options.locale,
        messages: options.messages,
      });
  const listeners = new Set<() => void>();
  let state = normalizeState({
    activeFilter: "all",
    dashboard: fallbackDashboard,
    isBootstrapped: false,
    isLoading: false,
    selectedOffer: fallbackDashboard.featuredOffers[0] ?? null,
    selectedOfferId: fallbackDashboard.featuredOffers[0]?.id ?? null,
    visibleOffers: fallbackDashboard.featuredOffers,
    ...options.initialState,
  }, fallbackDashboard);

  function emit(): void {
    listeners.forEach((listener) => listener());
  }

  function setState(
    next:
      | Partial<SdkworkOfferControllerState>
      | ((currentState: SdkworkOfferControllerState) => Partial<SdkworkOfferControllerState>),
  ): void {
    const partial = typeof next === "function" ? next(state) : next;
    state = normalizeState({
      ...state,
      ...partial,
    }, fallbackDashboard);
    emit();
  }

  return {
    async bootstrap() {
      setState({
        isLoading: true,
        lastError: undefined,
      });

      try {
        const dashboard = await service.getDashboard();
        setState({
          dashboard,
          isBootstrapped: true,
          isLoading: false,
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
      const dashboard = await service.getDashboard();
      setState({
        dashboard,
        isBootstrapped: true,
        isLoading: false,
      });
      return state;
    },

    selectOffer(offerId) {
      setState({
        selectedOfferId: offerId,
      });
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
  };
}

export function useSdkworkOfferController(
  controller?: SdkworkOfferController,
  options?: Pick<CreateSdkworkOfferControllerOptions, "locale" | "messages" | "service">,
): SdkworkOfferController {
  return useMemo(
    () => controller ?? createSdkworkOfferController({
      ...(options?.locale ? { locale: options.locale } : {}),
      ...(options?.messages ? { messages: options.messages } : {}),
      ...(options?.service ? { service: options.service } : {}),
    }),
    [controller, options?.locale, options?.messages, options?.service],
  );
}

export function useSdkworkOfferControllerState(
  controller: SdkworkOfferController,
): SdkworkOfferControllerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
