// S1 block 3 — lås: webbens utloggning gäller bara den här webbläsaren.
// Körs som prebuild (npm run build, även på Vercel) och fäller bygget om
//  1. något i src/ anropar auth.signOut( utanför src/lib/sign-out.ts, eller
//  2. src/lib/sign-out.ts inte anropar signOut({ scope: "local" }).
// Självtest: `node scripts/check-sign-out-scope.mjs --selftest`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const HELPER = "src/lib/sign-out.ts";

export function problemsFor(files) {
  const out = [];
  for (const [path, src] of files) {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    if (path === HELPER) {
      if (!/auth\.signOut\(\s*\{\s*scope:\s*["']local["']\s*\}\s*\)/.test(code)) {
        out.push(`${HELPER}: signOut utan { scope: "local" }`);
      }
      continue;
    }
    if (/auth\s*\.\s*signOut\s*\(/.test(code)) {
      out.push(`${path}: anropar auth.signOut direkt — använd signOutThisDevice()`);
    }
  }
  return out;
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

if (process.argv.includes("--selftest")) {
  const bad = problemsFor([
    [HELPER, 'export const f = (s) => s.auth.signOut({ scope: "global" });'],
    ["src/app/x.tsx", "await supabase.auth.signOut();"],
  ]);
  if (bad.length !== 2) {
    console.error("självtest: skannern fäller inte", bad);
    process.exit(1);
  }
  console.log("självtest OK:", bad.length, "fynd");
  process.exit(0);
}

const root = process.cwd();
const files = walk(join(root, "src")).map((p) => [
  relative(root, p).split("\\").join("/"),
  readFileSync(p, "utf8"),
]);
const problems = problemsFor(files);
if (problems.length > 0) {
  console.error("check-sign-out-scope: RÖTT\n  " + problems.join("\n  "));
  process.exit(1);
}
console.log(`check-sign-out-scope: OK (${files.length} filer)`);
