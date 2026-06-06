"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTweakModuleLoader = createTweakModuleLoader;
const MODULE_FILE_EXTENSIONS = [".js", ".cjs", ".json"];
const MODULE_INDEX_FILES = ["index.js", "index.cjs", "index.json"];
function createTweakModuleLoader(options) {
    const tweakDir = normalizeAbsolutePath(options.dir);
    const entry = normalizeAbsolutePath(options.entry);
    const moduleCache = new Map();
    assertInsideTweakDir(tweakDir, entry);
    const loadModule = (filename, sourceOverride) => {
        const resolved = normalizeAbsolutePath(filename);
        assertInsideTweakDir(tweakDir, resolved);
        const existing = moduleCache.get(resolved);
        if (existing)
            return existing.exports;
        if (resolved.endsWith(".json")) {
            const source = sourceOverride ?? options.readSource(resolved);
            const module = createModuleRecord(resolved, JSON.parse(source));
            module.loaded = true;
            moduleCache.set(resolved, module);
            return module.exports;
        }
        const module = createModuleRecord(resolved, {});
        moduleCache.set(resolved, module);
        const source = sourceOverride ?? options.readSource(resolved);
        const localRequire = makeRequire(resolved);
        try {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
            const fn = new Function("module", "exports", "require", "__filename", "__dirname", "console", `${source}\n//# sourceURL=${sourceUrl(options.manifestId, resolved)}`);
            fn(module, module.exports, localRequire, resolved, module.dirname, options.console ?? console);
            module.loaded = true;
            return module.exports;
        }
        catch (error) {
            moduleCache.delete(resolved);
            throw error;
        }
    };
    const resolveModule = (request, parentFilename) => {
        if (!isRelativeRequest(request)) {
            if (options.fallbackRequire)
                return request;
            throw new Error(`Renderer tweak require only supports relative files; bundle dependency "${request}" into the tweak entry`);
        }
        const base = dirnamePath(parentFilename);
        const target = normalizeAbsolutePath(joinPath(base, request));
        assertInsideTweakDir(tweakDir, target);
        for (const candidate of moduleCandidates(target)) {
            try {
                options.readSource(candidate);
                return candidate;
            }
            catch {
                // Try the next CommonJS candidate.
            }
        }
        throw new Error(`Cannot find module "${request}" from ${parentFilename}`);
    };
    const makeRequire = (parentFilename) => {
        const requireFn = ((request) => {
            if (!isRelativeRequest(request)) {
                if (options.fallbackRequire)
                    return options.fallbackRequire(request);
                throw new Error(`Renderer tweak require only supports relative files; bundle dependency "${request}" into the tweak entry`);
            }
            const filename = resolveModule(request, parentFilename);
            return loadModule(filename);
        });
        requireFn.resolve = (request) => resolveModule(request, parentFilename);
        return requireFn;
    };
    return {
        loadEntry(sourceOverride) {
            return loadModule(entry, sourceOverride);
        },
        resolve(request, parentFilename = entry) {
            return resolveModule(request, parentFilename);
        },
    };
}
function createModuleRecord(filename, exports) {
    return {
        id: filename,
        filename,
        dirname: dirnamePath(filename),
        exports,
        loaded: false,
    };
}
function moduleCandidates(target) {
    const ext = extensionOf(target);
    if (ext)
        return [target];
    return [
        target,
        ...MODULE_FILE_EXTENSIONS.map((extension) => `${target}${extension}`),
        ...MODULE_INDEX_FILES.map((file) => `${target}/${file}`),
    ];
}
function isRelativeRequest(request) {
    return request === "." || request === ".." || request.startsWith("./") || request.startsWith("../");
}
function sourceUrl(manifestId, filename) {
    return `codexpp-tweak://${encodeURIComponent(manifestId)}/${encodeURIComponent(filename)}`;
}
function assertInsideTweakDir(tweakDir, filename) {
    if (!isPathInsideOrEqual(tweakDir, filename)) {
        throw new Error("path outside tweak dir");
    }
}
function isPathInsideOrEqual(parent, child) {
    const parentPath = normalizeForCompare(parent);
    const childPath = normalizeForCompare(child);
    return childPath === parentPath || childPath.startsWith(`${parentPath}/`);
}
function normalizeForCompare(value) {
    const normalized = normalizeAbsolutePath(value).replace(/\/+$/, "");
    return /^[A-Za-z]:\//.test(normalized) ? normalized.toLowerCase() : normalized;
}
function normalizeAbsolutePath(input) {
    const normalized = String(input || "").replace(/\\/g, "/");
    let prefix = "";
    let rest = normalized;
    const driveMatch = rest.match(/^([A-Za-z]:)(?:\/|$)/);
    if (driveMatch) {
        prefix = driveMatch[1] ?? "";
        rest = rest.slice(prefix.length);
    }
    else if (rest.startsWith("/")) {
        prefix = "/";
        rest = rest.slice(1);
    }
    const parts = [];
    for (const part of rest.split("/")) {
        if (!part || part === ".")
            continue;
        if (part === "..") {
            if (parts.length > 0)
                parts.pop();
            else
                throw new Error("path traversal");
            continue;
        }
        parts.push(part);
    }
    if (prefix === "/")
        return `/${parts.join("/")}`;
    if (prefix)
        return `${prefix}/${parts.join("/")}`.replace(/\/$/, "/");
    return parts.join("/");
}
function joinPath(base, request) {
    return `${base.replace(/\/+$/, "")}/${request}`;
}
function dirnamePath(filename) {
    const normalized = normalizeAbsolutePath(filename);
    const index = normalized.lastIndexOf("/");
    if (index <= 0)
        return normalized.startsWith("/") ? "/" : ".";
    return normalized.slice(0, index);
}
function extensionOf(filename) {
    const basename = filename.slice(filename.lastIndexOf("/") + 1);
    const index = basename.lastIndexOf(".");
    return index > 0 ? basename.slice(index) : "";
}
//# sourceMappingURL=tweak-module-loader.js.map