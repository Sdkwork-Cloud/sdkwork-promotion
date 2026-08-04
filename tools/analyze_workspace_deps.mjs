import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";

const root = process.cwd();
const ws = readFileSync(join(root, "pnpm-workspace.yaml"), "utf-8");
const globs = [...ws.matchAll(/^\s*-\s*"([^"]+)"/gm)].map((m) => m[1]);
const localGlobs = globs.filter((g) => !g.startsWith("../"));
const siblingGlobs = globs.filter((g) => g.startsWith("../"));

function expand(globsArr, base) {
  const out = new Set();
  for (const g of globsArr) {
    const joined = join(base, g);
    const candidates = joined.includes("*")
      ? listByGlob(base, g)
      : [joined];
    for (const c of candidates) {
      if (existsSync(c) && statSync(c).isDirectory()) out.add(c);
    }
  }
  return [...out];
}

function listByGlob(base, g) {
  // support simple globs: dir/* (one level) and dir (literal)
  if (!g.includes("*")) return [join(base, g)];
  const star = g.indexOf("*");
  const prefix = g.slice(0, star);
  const dir = join(base, prefix);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => !n.startsWith("."))
    .map((n) => join(dir, n));
}

function pkgName(dir) {
  try {
    const data = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    return data.name ?? null;
  } catch {
    return null;
  }
}

const localDirs = expand(localGlobs, root);
const siblingDirs = expand(siblingGlobs, root);
const registered = new Map();
for (const d of [...localDirs, ...siblingDirs]) {
  const n = pkgName(d);
  if (n) registered.set(n, d);
}

// scan all sibling repos for every package.json
const allDirs = new Map();
for (const repo of readdirSync(join(root, "..")).filter((n) => n.startsWith("sdkwork-"))) {
  const repoPath = join(root, "..", repo);
  if (!statSync(repoPath).isDirectory()) continue;
  const stack = [repoPath];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === "target" || entry.name === ".pnpm" || entry.name === "generated") continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.name === "package.json") {
        try {
          const data = JSON.parse(readFileSync(full, "utf-8"));
          if (data.name) allDirs.set(data.name, dirname(full));
        } catch { /* ignore */ }
      }
    }
  }
}

const missing = new Map();
for (const d of [...localDirs, ...siblingDirs]) {
  try {
    const data = JSON.parse(readFileSync(join(d, "package.json"), "utf-8"));
    for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
      for (const [dep, spec] of Object.entries(data[section] ?? {})) {
        if (typeof spec === "string" && spec.startsWith("workspace:")) {
          if (!registered.has(dep)) {
            if (!missing.has(dep)) missing.set(dep, []);
            missing.get(dep).push(d);
          }
        }
      }
    }
  } catch { /* ignore */ }
}

console.log("registered count:", registered.size);
for (const [dep, usedBy] of [...missing.entries()].sort()) {
  const loc = allDirs.get(dep);
  console.log(`MISSING ${dep}${loc ? `  -> found at ${loc}` : "  -> NOT FOUND ANYWHERE"}`);
  for (const u of usedBy) console.log(`    used by ${u}`);
}
