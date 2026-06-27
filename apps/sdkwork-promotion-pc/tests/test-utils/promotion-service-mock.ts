import {
  configureSdkworkPromotionSessionTokenProvider,
  type SdkworkPromotionAppService,
  type SdkworkPromotionSessionTokens,
} from "@sdkwork/promotion-service";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (...args: infer TArgs) => infer TReturn
    ? (...args: TArgs) => TReturn
    : DeepPartial<T[K]>;
};

export function createPromotionAppServiceMock(
  overrides: DeepPartial<SdkworkPromotionAppService> = {},
): SdkworkPromotionAppService {
  const base: SdkworkPromotionAppService = {
    promotions: createMissingPromotionsTree(),
  };
  return mergePromotionAppService(base, overrides);
}

export function configurePromotionServiceMockSession(
  tokens: SdkworkPromotionSessionTokens = { authToken: "promotion-auth-token" },
): void {
  configureSdkworkPromotionSessionTokenProvider(() => tokens);
}

export function resetPromotionServiceMockSession(): void {
  configureSdkworkPromotionSessionTokenProvider(null);
}

function createMissingPromotionsTree(): SdkworkPromotionAppService["promotions"] {
  const tree: Record<string, unknown> = {};
  for (const method of [
    "offers.list",
    "offers.retrieve",
    "userCoupons.wallet.list",
    "userCoupons.wallet.retrieve",
    "userCoupons.claims.create",
    "codes.redemptions.create",
    "discountApplications.create",
    "discountApplications.reversals.create",
  ]) {
    addMissingMethod(tree, method);
  }
  return tree as SdkworkPromotionAppService["promotions"];
}

function addMissingMethod(root: Record<string, unknown>, method: string): void {
  let node = root;
  const segments = method.split(".");
  for (const segment of segments.slice(0, -1)) {
    if (!node[segment] || typeof node[segment] === "function") {
      node[segment] = {};
    }
    node = node[segment] as Record<string, unknown>;
  }
  node[segments.at(-1)!] = async () => {
    throw new Error(`Missing promotion service test method: ${method}`);
  };
}

function mergePromotionAppService<T>(base: T, overrides: DeepPartial<T>): T {
  for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      typeof (base as Record<string, unknown>)[key] === "object"
    ) {
      mergePromotionAppService((base as Record<string, unknown>)[key], value as DeepPartial<unknown>);
    } else {
      (base as Record<string, unknown>)[key] = value;
    }
  }
  return base;
}
