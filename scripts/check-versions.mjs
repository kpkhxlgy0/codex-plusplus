import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const canonicalFile = "packages/installer/package.json";
const readVersion = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8")).version;
const version = readVersion(canonicalFile);
if (typeof version !== "string" || !version) {
  throw new Error(`${canonicalFile} must declare a version`);
}

const packageFiles = ["package.json", ...readdirSync(resolve(root, "packages"))
  .map((name) => `packages/${name}/package.json`)
  .filter((file) => existsSync(resolve(root, file)))];

for (const file of packageFiles) {
  const actual = readVersion(file);
  if (actual !== version) {
    console.error(`[versions] ${file} version ${JSON.stringify(actual)} does not match ${canonicalFile} version ${version}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log(`[versions] all package versions match ${version}`);
