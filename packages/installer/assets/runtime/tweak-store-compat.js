"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storeEntryPlatformCompatibility = storeEntryPlatformCompatibility;
exports.assertStoreEntryPlatformCompatible = assertStoreEntryPlatformCompatible;
exports.storeEntryRuntimeCompatibility = storeEntryRuntimeCompatibility;
exports.assertStoreEntryRuntimeCompatible = assertStoreEntryRuntimeCompatible;
exports.cleanMinRuntime = cleanMinRuntime;
exports.formatStorePlatforms = formatStorePlatforms;
const version_utils_1 = require("./version-utils");
function storeEntryPlatformCompatibility(entry, currentPlatform = process.platform) {
    const supported = entry.platforms ?? null;
    const compatible = !supported || supported.includes(currentPlatform);
    return {
        current: currentPlatform,
        supported,
        compatible,
        reason: compatible ? null : `${entry.manifest.name} is only available on ${formatStorePlatforms(supported)}.`,
    };
}
function assertStoreEntryPlatformCompatible(entry) {
    const platform = storeEntryPlatformCompatibility(entry);
    if (!platform.compatible) {
        throw new Error(platform.reason ?? `${entry.manifest.name} is not available on this platform.`);
    }
}
function storeEntryRuntimeCompatibility(entry, currentVersion) {
    const required = cleanMinRuntime(entry.manifest.minRuntime);
    const compatible = !required || (0, version_utils_1.compareVersions)(currentVersion, required) >= 0;
    return {
        current: currentVersion,
        required,
        compatible,
        reason: compatible || !required
            ? null
            : `${entry.manifest.name} requires Codex++ ${required} or newer.`,
    };
}
function assertStoreEntryRuntimeCompatible(entry, currentVersion) {
    const runtime = storeEntryRuntimeCompatibility(entry, currentVersion);
    if (!runtime.compatible) {
        throw new Error(runtime.reason ?? `${entry.manifest.name} requires a newer Codex++ runtime.`);
    }
}
function cleanMinRuntime(value) {
    if (typeof value !== "string")
        return null;
    const version = (0, version_utils_1.normalizeVersion)(value.replace(/^>=?\s*/, ""));
    return version_utils_1.VERSION_RE.test(version) ? version : null;
}
function formatStorePlatforms(platforms) {
    if (!platforms || platforms.length === 0)
        return "supported platforms";
    return platforms.map((platform) => {
        if (platform === "darwin")
            return "macOS";
        if (platform === "win32")
            return "Windows";
        return "Linux";
    }).join(", ");
}
//# sourceMappingURL=tweak-store-compat.js.map