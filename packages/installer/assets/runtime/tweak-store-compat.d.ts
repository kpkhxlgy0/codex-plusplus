import type { TweakStoreEntry, TweakStorePlatform } from "./tweak-store";
export interface StoreEntryPlatformCompatibility {
    current: NodeJS.Platform;
    supported: TweakStorePlatform[] | null;
    compatible: boolean;
    reason: string | null;
}
export interface StoreEntryRuntimeCompatibility {
    current: string;
    required: string | null;
    compatible: boolean;
    reason: string | null;
}
export declare function storeEntryPlatformCompatibility(entry: TweakStoreEntry, currentPlatform?: TweakStorePlatform): StoreEntryPlatformCompatibility;
export declare function assertStoreEntryPlatformCompatible(entry: TweakStoreEntry): void;
export declare function storeEntryRuntimeCompatibility(entry: TweakStoreEntry, currentVersion: string): StoreEntryRuntimeCompatibility;
export declare function assertStoreEntryRuntimeCompatible(entry: TweakStoreEntry, currentVersion: string): void;
export declare function cleanMinRuntime(value: unknown): string | null;
export declare function formatStorePlatforms(platforms: TweakStorePlatform[] | null): string;
