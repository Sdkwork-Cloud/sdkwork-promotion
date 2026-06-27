import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  APP_PROMOTION_METHOD_TREE,
  type PromotionAppSdkClient,
  type PromotionSdkMethod,
} from "@sdkwork/promotion-sdk-ports";
import {
  configureSdkworkPromotionAppServiceProvider,
  configureSdkworkPromotionSessionTokenProvider,
  createSdkworkPromotionAppService,
} from "@sdkwork/promotion-service";
import { PromotionAppShell } from "@sdkwork/promotion-pc-shell";

// 会话 token 的 localStorage 键名
const PROMOTION_SESSION_STORAGE_KEYS = {
  accessToken: "sdkwork.promotion.accessToken",
  authToken: "sdkwork.promotion.authToken",
  refreshToken: "sdkwork.promotion.refreshToken",
} as const;

// 配置会话 token 提供者：从 localStorage 读取，未配置时返回匿名
configureSdkworkPromotionSessionTokenProvider(() => {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const accessToken = window.localStorage.getItem(PROMOTION_SESSION_STORAGE_KEYS.accessToken) ?? undefined;
    const authToken = window.localStorage.getItem(PROMOTION_SESSION_STORAGE_KEYS.authToken) ?? undefined;
    const refreshToken = window.localStorage.getItem(PROMOTION_SESSION_STORAGE_KEYS.refreshToken) ?? undefined;
    return { accessToken, authToken, refreshToken };
  } catch {
    // localStorage 不可用（隐私模式等）时降级为匿名会话
    return {};
  }
});

// 配置应用服务提供者：通过 fetch 调用 /app/v3/api/promotions 表面的 app-api
configureSdkworkPromotionAppServiceProvider(() => {
  const appClient = createPromotionAppFetchClient("/app/v3/api/promotions");
  return createSdkworkPromotionAppService({ appClient });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <PromotionAppShell />
    </BrowserRouter>
  </StrictMode>,
);

// 将方法树路径段转为 snake_case URL 段
function toSnakeCasePath(segment: string): string {
  return segment.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// 基于方法树构造 app SDK 客户端：叶子节点为 fetch 调用，中间节点为嵌套对象
function createPromotionAppFetchClient(baseUrl: string): PromotionAppSdkClient {
  const callEndpoint = (path: readonly string[]): PromotionSdkMethod => {
    return async (...args: Parameters<PromotionSdkMethod>) => {
      const url = `${baseUrl}/${path.map(toSnakeCasePath).join("/")}`;
      const body = args[0];
      const init: RequestInit = {
        method: body !== undefined ? "POST" : "GET",
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      };
      let response: Response;
      try {
        response = await fetch(url, init);
      } catch (error) {
        throw new Error(
          `Promotion API ${path.join(".")} network error: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
      if (!response.ok) {
        throw new Error(`Promotion API ${path.join(".")} failed: ${response.status} ${response.statusText}`);
      }
      // 兜底处理空响应体，避免 JSON 解析报错
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    };
  };

  const buildTree = (template: Record<string, unknown>, path: readonly string[]): Record<string, unknown> => {
    const node: Record<string, unknown> = {};
    for (const [key, marker] of Object.entries(template)) {
      const nextPath = [...path, key];
      if (marker === true) {
        node[key] = callEndpoint(nextPath);
      } else {
        node[key] = buildTree(marker as Record<string, unknown>, nextPath);
      }
    }
    return node;
  };

  return {
    commerce: {
      promotions: buildTree(
        APP_PROMOTION_METHOD_TREE.promotions as unknown as Record<string, unknown>,
        [],
      ),
    },
  } as PromotionAppSdkClient;
}
