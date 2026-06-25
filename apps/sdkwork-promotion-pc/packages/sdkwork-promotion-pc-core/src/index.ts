export type SdkworkPromotionPcRouteSurface = "app" | "backend-admin";

export interface SdkworkPromotionPcRouteContribution {
  readonly auth: "public" | "required";
  readonly capability: string;
  readonly domain: "promotion";
  readonly id: string;
  readonly packageName: string;
  readonly path: string;
  readonly permissionHint?: string;
  readonly screen: string;
  readonly surface: SdkworkPromotionPcRouteSurface;
  readonly title: string;
  readonly titleKey: string;
}

export const sdkworkPromotionPcRuntimeIdentity = {
  appKey: "sdkwork-promotion-pc",
  architecture: "pc-react",
  domain: "promotion",
  capability: "promotion",
  runtimeFamily: "web",
} as const;

export function createSdkworkPromotionPcRouteRegistry(
  ...routeGroups: readonly (readonly SdkworkPromotionPcRouteContribution[])[]
): readonly SdkworkPromotionPcRouteContribution[] {
  return routeGroups.flat();
}
