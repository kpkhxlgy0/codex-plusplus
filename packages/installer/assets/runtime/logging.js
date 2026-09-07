"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LOG_BYTES = void 0;
exports.appendCappedLog = appendCappedLog;
const node_fs_1 = require("node:fs");
exports.MAX_LOG_BYTES = 10 * 1024 * 1024;
function appendCappedLog(path, line, maxBytes = exports.MAX_LOG_BYTES) {
    const incoming = Buffer.from(line);
    if (incoming.byteLength >= maxBytes) {
        (0, node_fs_1.writeFileSync)(path, incoming.subarray(incoming.byteLength - maxBytes));
        return;
    }
    try {
        if ((0, node_fs_1.existsSync)(path)) {
            const size = (0, node_fs_1.statSync)(path).size;
            const allowedExisting = maxBytes - incoming.byteLength;
            if (size > allowedExisting) {
                // Make room in batches: trimming just enough for one line leaves a
                // full file, forcing every subsequent line to rewrite the entire log.
                const keepBytes = Math.max(0, Math.floor(maxBytes / 2) - incoming.byteLength);
                const tail = Buffer.alloc(keepBytes);
                const fd = (0, node_fs_1.openSync)(path, "r");
                let bytesRead = 0;
                try {
                    while (bytesRead < keepBytes) {
                        const count = (0, node_fs_1.readSync)(fd, tail, bytesRead, keepBytes - bytesRead, size - keepBytes + bytesRead);
                        if (count === 0)
                            break;
                        bytesRead += count;
                    }
                }
                finally {
                    (0, node_fs_1.closeSync)(fd);
                }
                (0, node_fs_1.writeFileSync)(path, tail.subarray(0, bytesRead));
            }
        }
    }
    catch {
        // If trimming fails, still try to append below; logging must be best-effort.
    }
    (0, node_fs_1.appendFileSync)(path, incoming);
}
//# sourceMappingURL=logging.js.map