// 业务模块契约：定义 PC 应用业务包向 shell 注册的模块清单结构
// 业务包通过 routes.ts 贡献路由，通过模块清单声明自身能力与版本

export interface SdkworkPromotionPcModuleManifest {
  readonly id: string;
  readonly packageName: string;
  readonly capability: string;
  readonly domain: "commerce";
  readonly version: string;
  readonly surface: "app" | "backend-admin";
  readonly routeIds?: readonly string[];
}

export interface SdkworkPromotionPcModuleRegistry {
  readonly modules: ReadonlyMap<string, SdkworkPromotionPcModuleManifest>;
  register(manifest: SdkworkPromotionPcModuleManifest): void;
  get(id: string): SdkworkPromotionPcModuleManifest | undefined;
  list(): readonly SdkworkPromotionPcModuleManifest[];
}

// 构造单个业务模块清单的工厂函数，便于业务包在 shell 装配时声明自身
export function createPromotionPcModuleManifest(
  manifest: SdkworkPromotionPcModuleManifest,
): SdkworkPromotionPcModuleManifest {
  return manifest;
}
