"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION_RE = void 0;
exports.normalizeVersion = normalizeVersion;
exports.compareVersions = compareVersions;
exports.VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;
function normalizeVersion(value) {
    return value.trim().replace(/^v/i, "");
}
function compareVersions(a, b) {
    const av = exports.VERSION_RE.exec(a);
    const bv = exports.VERSION_RE.exec(b);
    if (!av || !bv)
        return 0;
    for (let i = 1; i <= 3; i++) {
        const diff = Number(av[i]) - Number(bv[i]);
        if (diff !== 0)
            return diff;
    }
    return 0;
}
//# sourceMappingURL=version-utils.js.map