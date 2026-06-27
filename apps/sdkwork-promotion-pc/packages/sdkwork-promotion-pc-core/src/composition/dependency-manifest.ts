// 依赖组合清单：定位并解析 sdkwork 依赖组合清单文件
// 清单文件位于 apps/sdkwork-promotion-pc/specs/dependency.composition.json

export const sdkworkPromotionPcDependencyManifestPath =
  "../../../../specs/dependency.composition.json" as const;

export interface SdkworkPromotionPcDependencySurface {
  readonly surface: string;
  readonly corePackage: string;
  readonly sdkClients: readonly string[];
  readonly reusableModules: readonly string[];
  readonly hostAdapters: readonly string[];
  readonly dependencyApiExports: readonly string[];
  readonly dependencyApiSurfaces: readonly string[];
}

export interface SdkworkPromotionPcDependencyManifest {
  readonly schemaVersion: number;
  readonly kind: string;
  readonly applicationCode: string;
  readonly clientArchitecture: string;
  readonly surfaces: readonly SdkworkPromotionPcDependencySurface[];
  readonly buildToolEntries?: Record<string, unknown>;
}

// 解析依赖组合清单的原始 JSON 文本，校验 schemaVersion 与 kind
export function parsePromotionPcDependencyManifest(
  raw: string,
): SdkworkPromotionPcDependencyManifest {
  const parsed = JSON.parse(raw) as SdkworkPromotionPcDependencyManifest;
  if (parsed.schemaVersion !== 1 || parsed.kind !== "sdkwork.dependency.composition") {
    throw new Error("Invalid sdkwork dependency composition manifest");
  }
  return parsed;
}

// 读取依赖组合清单，浏览器环境通过 fetch 读取，未找到时返回 null
export async function readPromotionPcDependencyManifest(
  manifestPath: string = sdkworkPromotionPcDependencyManifestPath,
): Promise<SdkworkPromotionPcDependencyManifest | null> {
  if (typeof fetch !== "function") {
    return null;
  }
  try {
    const response = await fetch(manifestPath);
    if (!response.ok) {
      return null;
    }
    return parsePromotionPcDependencyManifest(await response.text());
  } catch {
    return null;
  }
}
