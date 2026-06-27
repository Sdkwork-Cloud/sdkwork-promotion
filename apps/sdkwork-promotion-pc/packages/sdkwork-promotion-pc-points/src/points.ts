import {
  createSdkworkAppCapabilityManifest,
  type CreateSdkworkAppCapabilityManifestOptions,
  type SdkworkAppCapabilityManifest,
} from "@sdkwork/appbase-pc-react";

export interface SdkworkPointsWorkspaceManifest extends SdkworkAppCapabilityManifest {
  capability: "points";
  routePath: string;
}

export interface CreatePointsWorkspaceManifestOptions
  extends Partial<
    Pick<CreateSdkworkAppCapabilityManifestOptions, "description" | "host" | "id" | "packageNames" | "theme" | "title">
  > {
  routePath?: string;
}

export interface SdkworkPointsRouteIntent {
  focusWindow: boolean;
  route: string;
  sectionId?: string;
  source: "points-workspace";
  type: "points-route-intent";
}

export interface CreatePointsRouteIntentOptions {
  basePath?: string;
  focusWindow?: boolean;
  sectionId?: string;
}

function normalizeBasePath(basePath: string | undefined): string {
  const normalized = (basePath ?? "/points").trim();
  if (!normalized || normalized === "/") {
    return "/points";
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

export function createPointsWorkspaceManifest({
  description = "Points workspace for recharge, credits usage, membership upgrades, and commercial quick-entry composition.",
  host,
  id = "sdkwork-points",
  packageNames = ["@sdkwork/promotion-pc-points", "@sdkwork/account-pc-wallet"],
  routePath = "/points",
  theme,
  title = "Points",
}: CreatePointsWorkspaceManifestOptions = {}): SdkworkPointsWorkspaceManifest {
  return {
    ...createSdkworkAppCapabilityManifest({
      description,
      host,
      id,
      packageNames,
      theme,
      title,
    }),
    capability: "points",
    routePath: normalizeBasePath(routePath),
  };
}

export function createPointsRouteIntent(
  options: CreatePointsRouteIntentOptions = {},
): SdkworkPointsRouteIntent {
  const basePath = normalizeBasePath(options.basePath);
  const queryParams = new URLSearchParams();

  if (options.sectionId) {
    queryParams.set("section", options.sectionId);
  }

  const querySuffix = queryParams.toString() ? `?${queryParams.toString()}` : "";

  return {
    focusWindow: options.focusWindow !== false,
    route: `${basePath}${querySuffix}`,
    ...(options.sectionId ? { sectionId: options.sectionId } : {}),
    source: "points-workspace",
    type: "points-route-intent",
  };
}

export const pointsPackageMeta = {
  architecture: "pc-react",
  domain: "commerce",
  package: "@sdkwork/promotion-pc-points",
  status: "ready",
} as const;

export type PointsPackageMeta = typeof pointsPackageMeta;
