// 宿主适配器注册表：聚合 PC 应用可用的原生宿主适配器
// 浏览器环境注入 browser 适配器，桌面/平板由 pc-desktop 包注入

import type { SdkworkPromotionPcHostAdapter } from "../host";

export interface SdkworkPromotionPcHostRegistry {
  readonly adapters: ReadonlyMap<string, SdkworkPromotionPcHostAdapter>;
  register(adapter: SdkworkPromotionPcHostAdapter): void;
  get(name: string): SdkworkPromotionPcHostAdapter | undefined;
  list(): readonly SdkworkPromotionPcHostAdapter[];
}

// 创建宿主适配器注册表，初始可为空，由 shell/bootstrap 注入实际适配器
export function createPromotionPcHostRegistry(
  initial: readonly SdkworkPromotionPcHostAdapter[] = [],
): SdkworkPromotionPcHostRegistry {
  const adapters = new Map<string, SdkworkPromotionPcHostAdapter>();
  for (const adapter of initial) {
    adapters.set(adapter.name, adapter);
  }
  return {
    adapters,
    register(adapter) {
      adapters.set(adapter.name, adapter);
    },
    get(name) {
      return adapters.get(name);
    },
    list() {
      return Array.from(adapters.values());
    },
  };
}
