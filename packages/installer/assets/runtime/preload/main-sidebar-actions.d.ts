import type { CodexSidebarActionOptions, CodexSidebarActionRef, CodexSidebarApi } from "@codex-plusplus/sdk";
interface SidebarSlot {
    container: HTMLElement;
    template: HTMLElement;
    insertAfter: HTMLElement | null;
}
export declare function rendererSidebarApi(tweakId: string): CodexSidebarApi;
export declare function disposeSidebarActionsForTweak(tweakId: string): void;
export declare function registerSidebarAction(tweakId: string, options: CodexSidebarActionOptions): CodexSidebarActionRef;
export declare function findMainSidebarActionSlot(root?: ParentNode): SidebarSlot | null;
export {};
