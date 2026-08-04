import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const ws = readFileSync(join(root, "pnpm-workspace.yaml"), "utf-8");
const globs = [...ws.matchAll(/^\s*-\s*"([^"]+)"/gm)].map((m) => m[1]);

function expand(gs, base) {
  const out = new Set();
  for (const g of gs) {
    if (g.includes("*")) {
      const prefix = g.split("*")[0];
      const dir = join(base, prefix);
      if (existsSync(dir) && statSync(dir).isDirectory()) {
        for (const n of readdirSync(dir)) {
          if (!n.startsWith(".")) out.add(join(dir, n));
        }
      }
    } else {
      const joined = join(base, g);
      if (existsSync(joined) && statSync(joined).isDirectory()) out.add(joined);
    }
  }
  return out;
}

function pkgName(d) {
  try {
    const data = JSON.parse(readFileSync(join(d, "package.json"), "utf-8"));
    return data.name ?? null;
  } catch {
    return null;
  }
}

function depsOf(d) {
  try {
    const data = JSON.parse(readFileSync(join(d, "package.json"), "utf-8"));
    const out = new Set();
    for (const sec of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const [dep, spec] of Object.entries(data[sec] ?? {})) {
        if (typeof spec === "string" && spec.startsWith("workspace:")) out.add(dep);
      }
    }
    return out;
  } catch {
    return new Set();
  }
}

const allDirs = new Map();
for (const repo of readdirSync(join(root, "..")).filter((n) => n.startsWith("sdkwork-"))) {
  const repoPath = join(root, "..", repo);
  if (!statSync(repoPath).isDirectory()) continue;
  const stack = [repoPath];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", "target", ".pnpm", "generated", "node_modules.cache"].includes(entry.name)) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name === "package.json") {
        try {
          const data = JSON.parse(readFileSync(full, "utf-8"));
          if (data.name) allDirs.set(data.name, dirname(full));
        } catch { /* ignore */ }
      }
    }
  }
}

import { dirname } from "node:path";

const registered = new Map();
for (const d of expand(globs, root)) {
  const n = pkgName(d);
  if (n) registered.set(n, d);
}

let changed = true;
while (changed) {
  changed = false;
  for (const [name, d] of [...registered.entries()]) {
    for (const dep of depsOf(d)) {
      if (!registered.has(dep) && allDirs.has(dep)) {
        registered.set(dep, allDirs.get(dep));
        changed = true;
      }
    }
  }
}

const existingDirs = expand(globs, root);
const additions = [];
for (const [name, d] of registered.entries()) {
  if (!existingDirs.has(d)) {
    additions.push([relative(root, d).replaceAll("\\", "/"), name]);
  }
}
for (const [rel, name] of additions.sort()) {
  console.log(`  - "${rel}"   # ${name}`);
}
console.log(`\n${additions.length} additions needed`);
