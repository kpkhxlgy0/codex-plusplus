export declare function compactSettingsText(value: string): string;
export declare function hasNativeSettingsSectionHeaders(root: HTMLElement): boolean;
export declare function normalizeCodexPpSettingsLabel(value: string): string;
export declare function codexPpControlLabel(el: HTMLElement): string;
export declare function codexPpSettingsLabelsFrom(root: ParentNode): string[];
export declare function codexPpSettingsLabelScore(labels: string[]): {
    core: number;
    total: number;
};
export declare function isCodexPpSettingsLabelSet(labels: string[]): boolean;
export declare function codexPpVisibleBox(el: HTMLElement): DOMRect | null;
export declare function isForbiddenSettingsSidebarSurface(node: Element | null): boolean;
export declare function isSettingsSidebarCandidate(el: HTMLElement): boolean;
