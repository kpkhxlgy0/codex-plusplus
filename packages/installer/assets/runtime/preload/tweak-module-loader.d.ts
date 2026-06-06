export interface TweakModuleLoaderOptions {
    manifestId: string;
    entry: string;
    dir: string;
    readSource: (filename: string) => string;
    fallbackRequire?: (request: string) => unknown;
    console?: Console;
}
export declare function createTweakModuleLoader(options: TweakModuleLoaderOptions): {
    loadEntry(sourceOverride?: string): unknown;
    resolve(request: string, parentFilename?: string): string;
};
