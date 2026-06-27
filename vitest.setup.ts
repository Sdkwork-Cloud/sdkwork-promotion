import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 自动清理 @testing-library/react 渲染的 DOM，避免测试间 DOM 泄漏导致
// getByRole/getByText 等查询在后续测试中匹配到前序测试残留的元素。
// vitest 默认未开启 globals: true，因此 @testing-library/react 内置的
// 自动 cleanup（依赖全局 afterEach）不会生效，需要在此显式注册。
afterEach(() => {
  cleanup();
});
