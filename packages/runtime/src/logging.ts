import { appendFileSync, closeSync, existsSync, openSync, readSync, statSync, writeFileSync } from "node:fs";

export const MAX_LOG_BYTES = 10 * 1024 * 1024;

export function appendCappedLog(path: string, line: string, maxBytes = MAX_LOG_BYTES): void {
  const incoming = Buffer.from(line);
  if (incoming.byteLength >= maxBytes) {
    writeFileSync(path, incoming.subarray(incoming.byteLength - maxBytes));
    return;
  }

  try {
    if (existsSync(path)) {
      const size = statSync(path).size;
      const allowedExisting = maxBytes - incoming.byteLength;
      if (size > allowedExisting) {
        // Make room in batches: trimming just enough for one line leaves a
        // full file, forcing every subsequent line to rewrite the entire log.
        const keepBytes = Math.max(0, Math.floor(maxBytes / 2) - incoming.byteLength);
        const tail = Buffer.alloc(keepBytes);
        const fd = openSync(path, "r");
        let bytesRead = 0;
        try {
          while (bytesRead < keepBytes) {
            const count = readSync(fd, tail, bytesRead, keepBytes - bytesRead, size - keepBytes + bytesRead);
            if (count === 0) break;
            bytesRead += count;
          }
        } finally {
          closeSync(fd);
        }
        writeFileSync(path, tail.subarray(0, bytesRead));
      }
    }
  } catch {
    // If trimming fails, still try to append below; logging must be best-effort.
  }

  appendFileSync(path, incoming);
}
