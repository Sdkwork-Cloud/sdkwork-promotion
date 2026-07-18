import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

// 强制 react/react-dom 从工作区根目录的 node_modules 解析为具体文件路径，
// 防止兄弟仓库（sdkwork-im、sdkwork-ui）通过 pnpm 符号链接注入它们自己的
// React 副本，导致测试中出现 "multiple copies of React" hooks 错误。
// resolveId 必须返回文件路径（非目录），否则 vite 无法正确解析。
function forceLocalDepsPlugin() {
  const reactRoot = path.join(root, "node_modules/react");
  const reactDomRoot = path.join(root, "node_modules/react-dom");

  return {
    name: "force-local-deps",
    enforce: "pre" as const,
    resolveId(source: string) {
      if (source === "react") {
        return path.join(reactRoot, "index.js");
      }
      if (source.startsWith("react/")) {
        return path.join(reactRoot, `${source.slice("react/".length)}.js`);
      }
      if (source === "react-dom") {
        return path.join(reactDomRoot, "index.js");
      }
      if (source.startsWith("react-dom/")) {
        return path.join(reactDomRoot, `${source.slice("react-dom/".length)}.js`);
      }
      return null;
    },
  };
}

// 从工作区根目录的 node_modules 解析 lucide-react 和 @radix-ui/* 包。
// sdkwork-ui/sdkwork-ui-pc-react/node_modules 中的符号链接指向 sdkwork-im
// 的 pnpm store，会带入不同的 React 实例。使用 resolve.alias（而非 resolveId）
// 处理目录级包解析，因为 alias 系统能正确读取 package.json 入口文件。
function loadLocalPackageAliases() {
  const reactRoot = path.join(root, "node_modules/react");
  const reactDomRoot = path.join(root, "node_modules/react-dom");
  const lucideRoot = path.join(root, "node_modules/lucide-react");
  const pnpmDir = path.join(root, "node_modules", ".pnpm");

  const aliases: Array<{ find: string; replacement: string }> = [
    { find: "react", replacement: reactRoot },
    { find: "react-dom", replacement: reactDomRoot },
    { find: "react/jsx-runtime", replacement: path.join(reactRoot, "jsx-runtime.js") },
    { find: "react/jsx-dev-runtime", replacement: path.join(reactRoot, "jsx-dev-runtime.js") },
    { find: "lucide-react", replacement: lucideRoot },
  ];

  // 动态生成 @radix-ui/* alias，从工作区根的 pnpm store 解析。
  if (existsSync(pnpmDir)) {
    const entries = readdirSync(pnpmDir);
    for (const entry of entries) {
      // pnpm store 条目格式：@radix-ui+react-dialog@1.1._hash
      if (!entry.startsWith("@radix-ui+")) {
        continue;
      }

      // 提取包名：@radix-ui+react-dialog@1.1._hash → react-dialog
      const withoutScope = entry.slice("@radix-ui+".length);
      const versionIndex = withoutScope.lastIndexOf("@");
      if (versionIndex <= 0) {
        continue;
      }

      const packageName = withoutScope.slice(0, versionIndex);
      const resolvedPath = path.join(
        pnpmDir,
        entry,
        "node_modules",
        "@radix-ui",
        packageName,
      );

      if (existsSync(resolvedPath)) {
        aliases.push({
          find: `@radix-ui/${packageName}`,
          replacement: resolvedPath,
        });
      }
    }
  }

  return aliases;
}

function loadTsconfigAliases() {
  const tsconfig = JSON.parse(readFileSync(path.join(root, "tsconfig.base.json"), "utf8"));
  const paths = tsconfig?.compilerOptions?.paths ?? {};
  return Object.entries(paths)
    .map(([find, replacements]) => {
      const replacement = Array.isArray(replacements) ? replacements[0] : undefined;
      if (typeof replacement !== "string") {
        return null;
      }
      return {
        find,
        replacement: path.resolve(root, replacement),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right!.find.length - left!.find.length) as Array<{
    find: string;
    replacement: string;
  }>;
}

export default defineConfig({
  plugins: [forceLocalDepsPlugin(), react()],
  resolve: {
    dedupe: ["react", "react-dom", "lucide-react"],
    alias: [
      ...loadLocalPackageAliases(),
      ...loadTsconfigAliases(),
    ].filter((entry) => entry.find !== "@sdkwork/ui-pc-react" || existsSync(entry.replacement)),
  },
  test: {
    environment: "jsdom",
    setupFiles: [path.join(root, "vitest.setup.ts")],
    pool: "forks",
    maxWorkers: 2,
    fileParallelism: false,
    include: [
      "apps/sdkwork-promotion-pc/packages/**/*.test.ts",
      "apps/sdkwork-promotion-pc/packages/**/*.test.tsx",
      "apps/sdkwork-promotion-common/packages/**/*.test.ts",
    ],
  },
});
