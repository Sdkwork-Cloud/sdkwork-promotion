import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// PC 应用根目录：apps/sdkwork-promotion-pc
const appRoot = path.dirname(fileURLToPath(import.meta.url));
// 仓库根目录：sdkwork-promotion
const workspaceRoot = path.resolve(appRoot, "../..");

// 强制 React/React-DOM 解析到仓库根的 node_modules，避免 pnpm 多副本导致的 hooks 报错
function forceLocalReactPlugin() {
  const reactRoot = path.join(workspaceRoot, "node_modules/react");
  const reactDomRoot = path.join(workspaceRoot, "node_modules/react-dom");
  return {
    name: "force-local-react",
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

// 复用 tsconfig.base.json 的 path 映射，保证与 vitest/typescript 解析一致
function loadTsconfigAliases() {
  const tsconfig = JSON.parse(
    readFileSync(path.join(workspaceRoot, "tsconfig.base.json"), "utf8"),
  );
  const paths = tsconfig?.compilerOptions?.paths ?? {};
  return Object.entries(paths)
    .map(([find, replacements]) => {
      const replacement = Array.isArray(replacements) ? replacements[0] : undefined;
      if (typeof replacement !== "string") {
        return null;
      }
      return {
        find,
        replacement: path.resolve(workspaceRoot, replacement),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right!.find.length - left!.find.length) as Array<{
      find: string;
      replacement: string;
    }>;
}

export default defineConfig({
  plugins: [forceLocalReactPlugin(), react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      ...loadTsconfigAliases(),
    ].filter((entry) => entry.find !== "@sdkwork/ui-pc-react" || existsSync(entry.replacement)),
  },
  server: {
    port: 5173,
    host: "127.0.0.1",
  },
  build: {
    outDir: "dist",
  },
});
