import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { userInfo } from "node:os";
import { basename, join, resolve } from "node:path";
import kleur from "kleur";
import prompts from "prompts";
import type { TweakScope } from "@codex-plusplus/sdk";
import { createTweak, slugify, titleize } from "./create-tweak.js";
import { userPaths } from "../paths.js";

interface NewTweakOpts {
  id?: string;
  name?: string;
  repo?: string;
  scope?: TweakScope;
  git?: boolean;
  cwd?: boolean;
  force?: boolean;
}

interface NewTweakAnswers {
  name: string;
  target: string;
  id: string;
  repo: string;
  scope: TweakScope;
  git: boolean;
}

interface NewTweakDeps {
  prompt?: typeof prompts;
  runCommand?: (command: string, args: string[], cwd: string) => CommandResult;
  username?: string;
}

interface CommandResult {
  status: number | null;
  error?: Error;
}

export async function newTweak(
  target: string | undefined,
  opts: NewTweakOpts = {},
  deps: NewTweakDeps = {},
): Promise<void> {
  const prompt = deps.prompt ?? prompts;
  const username = slugifyUsername(deps.username ?? currentUsername());
  const fallbackName = titleize(slugify(target ? basename(target) : "my-tweak"));
  const initialName = opts.name ?? fallbackName;
  const initialSlug = slugify(initialName);
  const initialTarget = target ?? defaultTarget(initialSlug, opts);

  console.log(kleur.bold("Codex++ new tweak walkthrough"));
  console.log("Defaults are shown where available.");
  console.log();

  const answers = await prompt(
    [
      {
        type: opts.name ? null : "text",
        name: "name",
        message: "Tweak name",
        initial: "",
        validate: (value: string) => (value.trim() ? true : "Enter a tweak name"),
      },
      {
        type: target ? null : "text",
        name: "target",
        message: "Directory",
        initial: (prev: string) => defaultTarget(slugify(prev || initialName), opts),
        validate: (value: string) => (value.trim() ? true : "Enter a target directory"),
      },
      {
        type: opts.id ? null : "text",
        name: "id",
        message: "Manifest id",
        initial: (_prev: string, values: Partial<NewTweakAnswers>) =>
          `com.${username}.${slugify(values.name || initialName)}`,
        validate: (value: string) => (value.trim() ? true : "Enter a manifest id"),
      },
      {
        type: opts.repo ? null : "text",
        name: "repo",
        message: "GitHub repo",
        initial: (_prev: string, values: Partial<NewTweakAnswers>) =>
          `example/${slugify(values.name || initialName)}`,
        validate: (value: string) =>
          value.trim() && !/^[^/]+\/[^/]+$/.test(value.trim())
            ? "Use owner/repo format"
            : true,
      },
      {
        type: opts.scope ? null : "select",
        name: "scope",
        message: "Where should it run?",
        initial: 2,
        choices: [
          { title: "Renderer only", value: "renderer" },
          { title: "Main process only", value: "main" },
          { title: "Both renderer and main", value: "both" },
        ],
      },
      {
        type: typeof opts.git === "boolean" ? null : "confirm",
        name: "git",
        message: "Initialize a git repository?",
        initial: true,
      },
    ],
    {
      onCancel: () => {
        throw new Error("new-tweak cancelled");
      },
    },
  );

  const name = opts.name ?? answers.name ?? initialName;
  const dir = resolve(target ?? answers.target ?? initialTarget);
  const scope = opts.scope ?? answers.scope ?? "both";
  const git = opts.git ?? answers.git ?? false;
  const repo = (opts.repo ?? answers.repo)?.trim() || undefined;

  createTweak(dir, {
    id: opts.id ?? answers.id,
    name,
    repo,
    scope,
    force: opts.force ?? isExistingEmptyDirectory(dir),
    quiet: true,
  });

  const gitInitialized = git ? initGit(dir, deps.runCommand) : false;

  console.log(kleur.green().bold("✓ Created Codex++ tweak"));
  console.log(`  Directory: ${kleur.cyan(dir)}`);
  console.log(`  Manifest:  ${kleur.cyan(resolve(dir, "manifest.json"))}`);
  if (gitInitialized) console.log(`  Git:       ${kleur.cyan("initialized")}`);
  console.log();
  console.log("Next:");
  console.log(`  1. Run ${kleur.cyan(`codexplusplus validate-tweak ${dir}`)}`);
  console.log(`  2. Run ${kleur.cyan(`codexplusplus dev ${dir}`)}`);
}

function initGit(
  dir: string,
  runCommand: NewTweakDeps["runCommand"] = defaultRunCommand,
): boolean {
  const result = runCommand("git", ["init"], dir);
  if (result.error) {
    throw new Error(`git init failed: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git init failed with exit code ${result.status ?? "unknown"}`);
  }
  return true;
}

function defaultRunCommand(command: string, args: string[], cwd: string): CommandResult {
  return spawnSync(command, args, {
    cwd,
    stdio: "ignore",
  });
}

function isExistingEmptyDirectory(dir: string): boolean {
  return existsSync(dir) && readdirSync(dir).length === 0;
}

function defaultTarget(slug: string, opts: NewTweakOpts): string {
  if (opts.cwd) return `./${slug}`;
  return join(userPaths().tweaks, slug);
}

function currentUsername(): string {
  if (process.env.SUDO_USER && process.env.SUDO_USER !== "root") return process.env.SUDO_USER;
  try {
    return userInfo().username;
  } catch {
    return "you";
  }
}

function slugifyUsername(username: string): string {
  return slugify(username).replace(/[._-]+/g, "-") || "you";
}
