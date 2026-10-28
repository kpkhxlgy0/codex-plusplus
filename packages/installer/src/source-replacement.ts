import { lstatSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, parse, relative, resolve, sep } from "node:path";
import { targetUserHome } from "./ownership.js";

/** Fail closed before replacing source or deleting update/rollback backups. */
export function assertSafeSourceReplacement(...targets: string[]): void {
  for (const target of targets) {
    rejectSymlinkComponents(target);
    const absolute = canonicalPath(target);
    const home = realpathSync(targetUserHome());
    if (absolute === parse(absolute).root || relative(absolute, home) === "") {
      throw new Error(`Refusing to replace filesystem or home root: ${target}`);
    }

    for (let ancestor = absolute; ; ancestor = dirname(ancestor)) {
      if (statIfPresent(ancestor)?.isDirectory() && hasGitEntry(ancestor)) rejectGit(target);
      if (ancestor === dirname(ancestor)) break;
    }

    const existing = statIfPresent(absolute);
    if (!existing) continue;
    if (!existing.isDirectory()) throw new Error(`Refusing to replace a non-directory: ${target}`);
    const pending = [absolute];
    while (pending.length) {
      const directory = pending.pop()!;
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.name.toLowerCase() === ".git") rejectGit(target);
        // Do not follow links into trees that replacement will not delete.
        if (entry.isDirectory()) pending.push(join(directory, entry.name));
      }
    }
    if (readdirSync(absolute).length && !isSourceTree(absolute)) {
      throw new Error(`Refusing to replace an unrecognized source directory: ${target}`);
    }
  }
}

function rejectGit(target: string): never {
  throw new Error(`Refusing to replace Git data at ${target}. Update the checkout with Git, then rerun install.sh or install.ps1.`);
}

function hasGitEntry(directory: string): boolean {
  return readdirSync(directory).some(name => name.toLowerCase() === ".git");
}

function statIfPresent(target: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function rejectSymlinkComponents(target: string): void {
  // Inspect before resolve() erases '..', which could hide a traversed link.
  const raw = isAbsolute(target) ? target : `${process.cwd()}${sep}${target}`;
  const root = parse(raw).root;
  const separator = process.platform === "win32" ? /[\\/]/ : /\//;
  let component = root;
  for (const part of raw.slice(root.length).split(separator)) {
    if (!part) continue;
    component += `${separator.test(component.slice(-1)) ? "" : sep}${part}`;
    if (statIfPresent(component)?.isSymbolicLink() && !isSystemAlias(component)) {
      throw new Error(`Refusing a symlink source or backup path: ${target}`);
    }
  }
}

function isSystemAlias(path: string): boolean {
  // macOS itself exposes native temporary paths through these fixed aliases.
  // Do not allow arbitrary links, including user-provided TMPDIR aliases.
  return process.platform === "darwin"
    && (path === "/var" || path === "/tmp")
    && realpathSync(path) === `/private${path}`;
}

function canonicalPath(target: string): string {
  let ancestor = resolve(target);
  const missing: string[] = [];
  while (!statIfPresent(ancestor)) {
    missing.unshift(basename(ancestor));
    ancestor = dirname(ancestor);
  }
  return join(realpathSync(ancestor), ...missing);
}

function isSourceTree(directory: string): boolean {
  try {
    const pkg = JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as { name?: unknown };
    return pkg.name === "codex-plusplus" && [
      "bin/codexplusplus.js", "packages/installer/src/cli.ts", "packages/runtime/src/main.ts",
    ].every(file => lstatSync(join(directory, file)).isFile());
  } catch {
    return false;
  }
}
