/**
 * Minimal billing posture boundary until sdkwork-order-pc-billing lands in sdkwork-order.
 * Pricing only consumes budget posture for plan guard labels and hybrid recommendations.
 */
export type SdkworkBillingPosture =
  | "healthy"
  | "watch"
  | "over-budget"
  | "payment-attention";

export type SdkworkBillingBreakdownKey =
  | "provider"
  | "model"
  | "capability"
  | "workspace";

export interface SdkworkBillingDashboard {
  posture: SdkworkBillingPosture;
}

export interface SdkworkBillingService {
  getDashboard(): Promise<SdkworkBillingDashboard>;
  getEmptyDashboard(): SdkworkBillingDashboard;
}

export interface CreateBillingRouteIntentOptions {
  basePath?: string;
  breakdown?: SdkworkBillingBreakdownKey;
  focusWindow?: boolean;
  tab?: "overview" | "invoices";
}

export interface SdkworkBillingRouteIntent {
  breakdown?: SdkworkBillingBreakdownKey;
  focusWindow: boolean;
  route: string;
  source: "billing-workspace";
  tab?: "overview" | "invoices";
  type: "billing-route-intent";
}

function normalizeBasePath(basePath = "/billing"): string {
  const trimmed = basePath.trim() || "/billing";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function createBillingRouteIntent(
  options: CreateBillingRouteIntentOptions = {},
): SdkworkBillingRouteIntent {
  const basePath = normalizeBasePath(options.basePath);
  const queryParams = new URLSearchParams();

  if (options.tab) {
    queryParams.set("tab", options.tab);
  }

  if (options.breakdown) {
    queryParams.set("breakdown", options.breakdown);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    ...(options.breakdown ? { breakdown: options.breakdown } : {}),
    focusWindow: options.focusWindow !== false,
    route: `${basePath}${querySuffix}`,
    source: "billing-workspace",
    ...(options.tab ? { tab: options.tab } : {}),
    type: "billing-route-intent",
  };
}

export function createSdkworkBillingService(): SdkworkBillingService {
  const emptyDashboard: SdkworkBillingDashboard = {
    posture: "healthy",
  };

  return {
    getEmptyDashboard() {
      return emptyDashboard;
    },

    async getDashboard() {
      return emptyDashboard;
    },
  };
}
