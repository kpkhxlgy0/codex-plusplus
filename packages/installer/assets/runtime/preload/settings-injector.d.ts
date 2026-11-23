/**
 * Settings injector for Codex's Settings page.
 *
 * Codex's settings can be a routed page or a modal dialog. The sidebar is a
 * grouped settings nav (Personal, Integrations, Coding, Archived) with native section headers above stacks of
 * buttons. Current builds expose a dialog or a settings nav marker. Older
 * routed pages are identified by their native sidebar labels.
 *
 * Layout we inject:
 *
 *   Personal                      (native Codex group label)
 *   [Codex's existing items group]
 *   Codex++                       (native Codex group label)
 *   ⓘ Config
 *   ☰ Tweaks
 *   ◇ Tweak Store
 *
 * Clicking Config / Tweaks / Tweak Store hides Codex's content panel children and renders
 * our own `main-surface` panel in their place. Clicking any of Codex's
 * sidebar items restores the original view.
 */
import type { SettingsSection, SettingsPage, SettingsHandle, TweakManifest } from "@codex-plusplus/sdk";
interface ListedTweak {
    manifest: TweakManifest;
    entry: string;
    dir: string;
    entryExists: boolean;
    enabled: boolean;
    update: TweakUpdateCheck | null;
}
interface TweakUpdateCheck {
    checkedAt: string;
    repo: string;
    currentVersion: string;
    latestVersion: string | null;
    latestTag: string | null;
    releaseUrl: string | null;
    updateAvailable: boolean;
    error?: string;
}
export declare function startSettingsInjector(): void;
export declare function onSettingsNavigation(path: string): void;
export declare function registerSection(section: SettingsSection): SettingsHandle;
export declare function clearSections(): void;
/**
 * Register a tweak-owned settings page. The runtime injects a sidebar entry
 * under a "TWEAKS" group header (which appears only when at least one page
 * is registered) and routes clicks to the page's `render(root)`.
 */
export declare function registerPage(tweakId: string, manifest: TweakManifest, page: SettingsPage): SettingsHandle;
/** Called by the tweak host after fetching the tweak list from main. */
export declare function setListedTweaks(list: ListedTweak[]): void;
export {};
