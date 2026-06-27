// SDK 客户端契约：定义 PC 应用消费的生成式 SDK 客户端类型与工厂
// 实际 SDK 客户端由 root src/bootstrap 在运行时构造并注入，core 仅声明契约

export type SdkworkPromotionPcSdkSurface = "app" | "backend-admin";

export interface SdkworkPromotionPcSdkClientEntry {
  readonly name: string;
  readonly surface: SdkworkPromotionPcSdkSurface;
  readonly packageName: string;
  readonly apiPrefix: string;
  readonly capability: string;
}

export interface SdkworkPromotionPcSdkClientRegistry {
  readonly clients: ReadonlyMap<string, SdkworkPromotionPcSdkClientEntry>;
  register(entry: SdkworkPromotionPcSdkClientEntry): void;
  get(name: string): SdkworkPromotionPcSdkClientEntry | undefined;
  list(): readonly SdkworkPromotionPcSdkClientEntry[];
}

// 创建 SDK 客户端注册表，未注入时返回空注册表
export function createPromotionPcSdkClientRegistry(
  initial: readonly SdkworkPromotionPcSdkClientEntry[] = [],
): SdkworkPromotionPcSdkClientRegistry {
  const clients = new Map<string, SdkworkPromotionPcSdkClientEntry>();
  for (const entry of initial) {
    clients.set(entry.name, entry);
  }
  return {
    clients,
    register(entry) {
      clients.set(entry.name, entry);
    },
    get(name) {
      return clients.get(name);
    },
    list() {
      return Array.from(clients.values());
    },
  };
}
