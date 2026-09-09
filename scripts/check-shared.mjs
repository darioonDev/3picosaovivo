#!/usr/bin/env node
/**
 * Drift check against the twin repository.
 *
 * The two apps deliberately duplicate the settings machinery instead of
 * sharing a package: each is deployed by `git archive` + build on Hostinger,
 * so a local `file:` dependency would not survive. Duplication only works if
 * the drift is visible, which is what this reports.
 *
 * IDENTICAL — must match byte for byte; a difference fails the check.
 * PARALLEL  — expected to differ (fields, storage shape, cookie name). The
 *             diff size is printed so an unexpected divergence stands out,
 *             but it never fails.
 *
 * Skips silently when the twin is not checked out — CI only has one repo.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const twinName =
  path.basename(repo) === "camera-24h" ? "olhar-dos-tres-picos" : "camera-24h";
const twin = path.resolve(repo, "..", twinName);

const IDENTICAL = [
  "lib/config/schema.test.ts",
  "lib/uploads.ts",
  "app/api/admin/login/route.ts",
  "app/api/admin/password/route.ts",
  "app/api/admin/upload/route.ts",
  "app/api/asset/[name]/route.ts",
  "vitest.server-only-stub.ts",
];

const PARALLEL = [
  "lib/config/kinds.ts",
  "lib/config/resolve.ts",
  "lib/config/schema.ts",
  "lib/admin-auth.ts",
  "app/api/admin/settings/route.ts",
  "app/api/admin/maintenance/route.ts",
];

if (!existsSync(twin)) {
  console.log(`check:shared — ${twinName} não está por perto, nada a comparar.`);
  process.exit(0);
}

const read = (root, rel) => {
  const p = path.join(root, rel);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
};

const countDiff = (a, b) => {
  const x = a.split("\n");
  const y = b.split("\n");
  const seen = new Map();
  for (const l of y) seen.set(l, (seen.get(l) ?? 0) + 1);
  let differing = 0;
  for (const l of x) {
    const n = seen.get(l) ?? 0;
    if (n > 0) seen.set(l, n - 1);
    else differing += 1;
  }
  return differing;
};

let failed = 0;

console.log(`check:shared — comparando com ${twinName}\n`);
console.log("  idênticos (uma diferença aqui é erro):");
for (const rel of IDENTICAL) {
  const a = read(repo, rel);
  const b = read(twin, rel);
  if (a === null || b === null) {
    console.log(`    FALTA  ${rel}${a === null ? " (aqui)" : " (no gêmeo)"}`);
    failed += 1;
  } else if (a !== b) {
    console.log(`    DIFERE ${rel}  (${countDiff(a, b)} linhas)`);
    failed += 1;
  } else {
    console.log(`    ok     ${rel}`);
  }
}

console.log("\n  paralelos (divergência esperada, só para revisão):");
for (const rel of PARALLEL) {
  const a = read(repo, rel);
  const b = read(twin, rel);
  if (a === null || b === null) {
    console.log(`    FALTA  ${rel}${a === null ? " (aqui)" : " (no gêmeo)"}`);
    failed += 1;
  } else {
    console.log(`    ${String(countDiff(a, b)).padStart(4)} linhas  ${rel}`);
  }
}

if (failed > 0) {
  console.error(
    `\n${failed} problema(s). Um arquivo da lista "idênticos" divergiu: ` +
      `porte a mudança para o outro repo, ou mova o arquivo para a lista ` +
      `"paralelos" em scripts/check-shared.mjs se a diferença for proposital.`
  );
  process.exit(1);
}
console.log("\nsem divergência inesperada.");
