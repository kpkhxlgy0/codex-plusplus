"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  postUpdateRepairScript: () => postUpdateRepairScript
});
module.exports = __toCommonJS(main_exports);
var import_electron4 = require("electron");
var import_node_fs10 = require("node:fs");
var import_node_child_process3 = require("node:child_process");
var import_node_crypto3 = require("node:crypto");
var import_node_path9 = require("node:path");
var import_node_os2 = require("node:os");

// ../../node_modules/chokidar/esm/index.js
var import_fs2 = require("fs");
var import_promises3 = require("fs/promises");
var import_events = require("events");
var sysPath2 = __toESM(require("path"), 1);

// ../../node_modules/readdirp/esm/index.js
var import_promises = require("node:fs/promises");
var import_node_stream = require("node:stream");
var import_node_path = require("node:path");
var EntryTypes = {
  FILE_TYPE: "files",
  DIR_TYPE: "directories",
  FILE_DIR_TYPE: "files_directories",
  EVERYTHING_TYPE: "all"
};
var defaultOptions = {
  root: ".",
  fileFilter: (_entryInfo) => true,
  directoryFilter: (_entryInfo) => true,
  type: EntryTypes.FILE_TYPE,
  lstat: false,
  depth: 2147483648,
  alwaysStat: false,
  highWaterMark: 4096
};
Object.freeze(defaultOptions);
var RECURSIVE_ERROR_CODE = "READDIRP_RECURSIVE_ERROR";
var NORMAL_FLOW_ERRORS = /* @__PURE__ */ new Set(["ENOENT", "EPERM", "EACCES", "ELOOP", RECURSIVE_ERROR_CODE]);
var ALL_TYPES = [
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
];
var DIR_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.DIR_TYPE,
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE
]);
var FILE_TYPES = /* @__PURE__ */ new Set([
  EntryTypes.EVERYTHING_TYPE,
  EntryTypes.FILE_DIR_TYPE,
  EntryTypes.FILE_TYPE
]);
var isNormalFlowError = (error) => NORMAL_FLOW_ERRORS.has(error.code);
var wantBigintFsStats = process.platform === "win32";
var emptyFn = (_entryInfo) => true;
var normalizeFilter = (filter) => {
  if (filter === void 0)
    return emptyFn;
  if (typeof filter === "function")
    return filter;
  if (typeof filter === "string") {
    const fl = filter.trim();
    return (entry) => entry.basename === fl;
  }
  if (Array.isArray(filter)) {
    const trItems = filter.map((item) => item.trim());
    return (entry) => trItems.some((f) => entry.basename === f);
  }
  return emptyFn;
};
var ReaddirpStream = class extends import_node_stream.Readable {
  constructor(options = {}) {
    super({
      objectMode: true,
      autoDestroy: true,
      highWaterMark: options.highWaterMark
    });
    const opts = { ...defaultOptions, ...options };
    const { root, type } = opts;
    this._fileFilter = normalizeFilter(opts.fileFilter);
    this._directoryFilter = normalizeFilter(opts.directoryFilter);
    const statMethod = opts.lstat ? import_promises.lstat : import_promises.stat;
    if (wantBigintFsStats) {
      this._stat = (path) => statMethod(path, { bigint: true });
    } else {
      this._stat = statMethod;
    }
    this._maxDepth = opts.depth ?? defaultOptions.depth;
    this._wantsDir = type ? DIR_TYPES.has(type) : false;
    this._wantsFile = type ? FILE_TYPES.has(type) : false;
    this._wantsEverything = type === EntryTypes.EVERYTHING_TYPE;
    this._root = (0, import_node_path.resolve)(root);
    this._isDirent = !opts.alwaysStat;
    this._statsProp = this._isDirent ? "dirent" : "stats";
    this._rdOptions = { encoding: "utf8", withFileTypes: this._isDirent };
    this.parents = [this._exploreDir(root, 1)];
    this.reading = false;
    this.parent = void 0;
  }
  async _read(batch) {
    if (this.reading)
      return;
    this.reading = true;
    try {
      while (!this.destroyed && batch > 0) {
        const par = this.parent;
        const fil = par && par.files;
        if (fil && fil.length > 0) {
          const { path, depth } = par;
          const slice = fil.splice(0, batch).map((dirent) => this._formatEntry(dirent, path));
          const awaited = await Promise.all(slice);
          for (const entry of awaited) {
            if (!entry)
              continue;
            if (this.destroyed)
              return;
            const entryType = await this._getEntryType(entry);
            if (entryType === "directory" && this._directoryFilter(entry)) {
              if (depth <= this._maxDepth) {
                this.parents.push(this._exploreDir(entry.fullPath, depth + 1));
              }
              if (this._wantsDir) {
                this.push(entry);
                batch--;
              }
            } else if ((entryType === "file" || this._includeAsFile(entry)) && this._fileFilter(entry)) {
              if (this._wantsFile) {
                this.push(entry);
                batch--;
              }
            }
          }
        } else {
          const parent = this.parents.pop();
          if (!parent) {
            this.push(null);
            break;
          }
          this.parent = await parent;
          if (this.destroyed)
            return;
        }
      }
    } catch (error) {
      this.destroy(error);
    } finally {
      this.reading = false;
    }
  }
  async _exploreDir(path, depth) {
    let files;
    try {
      files = await (0, import_promises.readdir)(path, this._rdOptions);
    } catch (error) {
      this._onError(error);
    }
    return { files, depth, path };
  }
  async _formatEntry(dirent, path) {
    let entry;
    const basename3 = this._isDirent ? dirent.name : dirent;
    try {
      const fullPath = (0, import_node_path.resolve)((0, import_node_path.join)(path, basename3));
      entry = { path: (0, import_node_path.relative)(this._root, fullPath), fullPath, basename: basename3 };
      entry[this._statsProp] = this._isDirent ? dirent : await this._stat(fullPath);
    } catch (err) {
      this._onError(err);
      return;
    }
    return entry;
  }
  _onError(err) {
    if (isNormalFlowError(err) && !this.destroyed) {
      this.emit("warn", err);
    } else {
      this.destroy(err);
    }
  }
  async _getEntryType(entry) {
    if (!entry && this._statsProp in entry) {
      return "";
    }
    const stats = entry[this._statsProp];
    if (stats.isFile())
      return "file";
    if (stats.isDirectory())
      return "directory";
    if (stats && stats.isSymbolicLink()) {
      const full = entry.fullPath;
      try {
        const entryRealPath = await (0, import_promises.realpath)(full);
        const entryRealPathStats = await (0, import_promises.lstat)(entryRealPath);
        if (entryRealPathStats.isFile()) {
          return "file";
        }
        if (entryRealPathStats.isDirectory()) {
          const len = entryRealPath.length;
          if (full.startsWith(entryRealPath) && full.substr(len, 1) === import_node_path.sep) {
            const recursiveError = new Error(`Circular symlink detected: "${full}" points to "${entryRealPath}"`);
            recursiveError.code = RECURSIVE_ERROR_CODE;
            return this._onError(recursiveError);
          }
          return "directory";
        }
      } catch (error) {
        this._onError(error);
        return "";
      }
    }
  }
  _includeAsFile(entry) {
    const stats = entry && entry[this._statsProp];
    return stats && this._wantsEverything && !stats.isDirectory();
  }
};
function readdirp(root, options = {}) {
  let type = options.entryType || options.type;
  if (type === "both")
    type = EntryTypes.FILE_DIR_TYPE;
  if (type)
    options.type = type;
  if (!root) {
    throw new Error("readdirp: root argument is required. Usage: readdirp(root, options)");
  } else if (typeof root !== "string") {
    throw new TypeError("readdirp: root argument must be a string. Usage: readdirp(root, options)");
  } else if (type && !ALL_TYPES.includes(type)) {
    throw new Error(`readdirp: Invalid type passed. Use one of ${ALL_TYPES.join(", ")}`);
  }
  options.root = root;
  return new ReaddirpStream(options);
}

// ../../node_modules/chokidar/esm/handler.js
var import_fs = require("fs");
var import_promises2 = require("fs/promises");
var sysPath = __toESM(require("path"), 1);
var import_os = require("os");
var STR_DATA = "data";
var STR_END = "end";
var STR_CLOSE = "close";
var EMPTY_FN = () => {
};
var pl = process.platform;
var isWindows = pl === "win32";
var isMacos = pl === "darwin";
var isLinux = pl === "linux";
var isFreeBSD = pl === "freebsd";
var isIBMi = (0, import_os.type)() === "OS400";
var EVENTS = {
  ALL: "all",
  READY: "ready",
  ADD: "add",
  CHANGE: "change",
  ADD_DIR: "addDir",
  UNLINK: "unlink",
  UNLINK_DIR: "unlinkDir",
  RAW: "raw",
  ERROR: "error"
};
var EV = EVENTS;
var THROTTLE_MODE_WATCH = "watch";
var statMethods = { lstat: import_promises2.lstat, stat: import_promises2.stat };
var KEY_LISTENERS = "listeners";
var KEY_ERR = "errHandlers";
var KEY_RAW = "rawEmitters";
var HANDLER_KEYS = [KEY_LISTENERS, KEY_ERR, KEY_RAW];
var binaryExtensions = /* @__PURE__ */ new Set([
  "3dm",
  "3ds",
  "3g2",
  "3gp",
  "7z",
  "a",
  "aac",
  "adp",
  "afdesign",
  "afphoto",
  "afpub",
  "ai",
  "aif",
  "aiff",
  "alz",
  "ape",
  "apk",
  "appimage",
  "ar",
  "arj",
  "asf",
  "au",
  "avi",
  "bak",
  "baml",
  "bh",
  "bin",
  "bk",
  "bmp",
  "btif",
  "bz2",
  "bzip2",
  "cab",
  "caf",
  "cgm",
  "class",
  "cmx",
  "cpio",
  "cr2",
  "cur",
  "dat",
  "dcm",
  "deb",
  "dex",
  "djvu",
  "dll",
  "dmg",
  "dng",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotm",
  "dra",
  "DS_Store",
  "dsk",
  "dts",
  "dtshd",
  "dvb",
  "dwg",
  "dxf",
  "ecelp4800",
  "ecelp7470",
  "ecelp9600",
  "egg",
  "eol",
  "eot",
  "epub",
  "exe",
  "f4v",
  "fbs",
  "fh",
  "fla",
  "flac",
  "flatpak",
  "fli",
  "flv",
  "fpx",
  "fst",
  "fvt",
  "g3",
  "gh",
  "gif",
  "graffle",
  "gz",
  "gzip",
  "h261",
  "h263",
  "h264",
  "icns",
  "ico",
  "ief",
  "img",
  "ipa",
  "iso",
  "jar",
  "jpeg",
  "jpg",
  "jpgv",
  "jpm",
  "jxr",
  "key",
  "ktx",
  "lha",
  "lib",
  "lvp",
  "lz",
  "lzh",
  "lzma",
  "lzo",
  "m3u",
  "m4a",
  "m4v",
  "mar",
  "mdi",
  "mht",
  "mid",
  "midi",
  "mj2",
  "mka",
  "mkv",
  "mmr",
  "mng",
  "mobi",
  "mov",
  "movie",
  "mp3",
  "mp4",
  "mp4a",
  "mpeg",
  "mpg",
  "mpga",
  "mxu",
  "nef",
  "npx",
  "numbers",
  "nupkg",
  "o",
  "odp",
  "ods",
  "odt",
  "oga",
  "ogg",
  "ogv",
  "otf",
  "ott",
  "pages",
  "pbm",
  "pcx",
  "pdb",
  "pdf",
  "pea",
  "pgm",
  "pic",
  "png",
  "pnm",
  "pot",
  "potm",
  "potx",
  "ppa",
  "ppam",
  "ppm",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "psd",
  "pya",
  "pyc",
  "pyo",
  "pyv",
  "qt",
  "rar",
  "ras",
  "raw",
  "resources",
  "rgb",
  "rip",
  "rlc",
  "rmf",
  "rmvb",
  "rpm",
  "rtf",
  "rz",
  "s3m",
  "s7z",
  "scpt",
  "sgi",
  "shar",
  "snap",
  "sil",
  "sketch",
  "slk",
  "smv",
  "snk",
  "so",
  "stl",
  "suo",
  "sub",
  "swf",
  "tar",
  "tbz",
  "tbz2",
  "tga",
  "tgz",
  "thmx",
  "tif",
  "tiff",
  "tlz",
  "ttc",
  "ttf",
  "txz",
  "udf",
  "uvh",
  "uvi",
  "uvm",
  "uvp",
  "uvs",
  "uvu",
  "viv",
  "vob",
  "war",
  "wav",
  "wax",
  "wbmp",
  "wdp",
  "weba",
  "webm",
  "webp",
  "whl",
  "wim",
  "wm",
  "wma",
  "wmv",
  "wmx",
  "woff",
  "woff2",
  "wrm",
  "wvx",
  "xbm",
  "xif",
  "xla",
  "xlam",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
  "xm",
  "xmind",
  "xpi",
  "xpm",
  "xwd",
  "xz",
  "z",
  "zip",
  "zipx"
]);
var isBinaryPath = (filePath) => binaryExtensions.has(sysPath.extname(filePath).slice(1).toLowerCase());
var foreach = (val, fn) => {
  if (val instanceof Set) {
    val.forEach(fn);
  } else {
    fn(val);
  }
};
var addAndConvert = (main, prop, item) => {
  let container = main[prop];
  if (!(container instanceof Set)) {
    main[prop] = container = /* @__PURE__ */ new Set([container]);
  }
  container.add(item);
};
var clearItem = (cont) => (key) => {
  const set = cont[key];
  if (set instanceof Set) {
    set.clear();
  } else {
    delete cont[key];
  }
};
var delFromSet = (main, prop, item) => {
  const container = main[prop];
  if (container instanceof Set) {
    container.delete(item);
  } else if (container === item) {
    delete main[prop];
  }
};
var isEmptySet = (val) => val instanceof Set ? val.size === 0 : !val;
var FsWatchInstances = /* @__PURE__ */ new Map();
function createFsWatchInstance(path, options, listener, errHandler, emitRaw) {
  const handleEvent = (rawEvent, evPath) => {
    listener(path);
    emitRaw(rawEvent, evPath, { watchedPath: path });
    if (evPath && path !== evPath) {
      fsWatchBroadcast(sysPath.resolve(path, evPath), KEY_LISTENERS, sysPath.join(path, evPath));
    }
  };
  try {
    return (0, import_fs.watch)(path, {
      persistent: options.persistent
    }, handleEvent);
  } catch (error) {
    errHandler(error);
    return void 0;
  }
}
var fsWatchBroadcast = (fullPath, listenerType, val1, val2, val3) => {
  const cont = FsWatchInstances.get(fullPath);
  if (!cont)
    return;
  foreach(cont[listenerType], (listener) => {
    listener(val1, val2, val3);
  });
};
var setFsWatchListener = (path, fullPath, options, handlers) => {
  const { listener, errHandler, rawEmitter } = handlers;
  let cont = FsWatchInstances.get(fullPath);
  let watcher;
  if (!options.persistent) {
    watcher = createFsWatchInstance(path, options, listener, errHandler, rawEmitter);
    if (!watcher)
      return;
    return watcher.close.bind(watcher);
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_ERR, errHandler);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    watcher = createFsWatchInstance(
      path,
      options,
      fsWatchBroadcast.bind(null, fullPath, KEY_LISTENERS),
      errHandler,
      // no need to use broadcast here
      fsWatchBroadcast.bind(null, fullPath, KEY_RAW)
    );
    if (!watcher)
      return;
    watcher.on(EV.ERROR, async (error) => {
      const broadcastErr = fsWatchBroadcast.bind(null, fullPath, KEY_ERR);
      if (cont)
        cont.watcherUnusable = true;
      if (isWindows && error.code === "EPERM") {
        try {
          const fd = await (0, import_promises2.open)(path, "r");
          await fd.close();
          broadcastErr(error);
        } catch (err) {
        }
      } else {
        broadcastErr(error);
      }
    });
    cont = {
      listeners: listener,
      errHandlers: errHandler,
      rawEmitters: rawEmitter,
      watcher
    };
    FsWatchInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_ERR, errHandler);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      cont.watcher.close();
      FsWatchInstances.delete(fullPath);
      HANDLER_KEYS.forEach(clearItem(cont));
      cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
var FsWatchFileInstances = /* @__PURE__ */ new Map();
var setFsWatchFileListener = (path, fullPath, options, handlers) => {
  const { listener, rawEmitter } = handlers;
  let cont = FsWatchFileInstances.get(fullPath);
  const copts = cont && cont.options;
  if (copts && (copts.persistent < options.persistent || copts.interval > options.interval)) {
    (0, import_fs.unwatchFile)(fullPath);
    cont = void 0;
  }
  if (cont) {
    addAndConvert(cont, KEY_LISTENERS, listener);
    addAndConvert(cont, KEY_RAW, rawEmitter);
  } else {
    cont = {
      listeners: listener,
      rawEmitters: rawEmitter,
      options,
      watcher: (0, import_fs.watchFile)(fullPath, options, (curr, prev) => {
        foreach(cont.rawEmitters, (rawEmitter2) => {
          rawEmitter2(EV.CHANGE, fullPath, { curr, prev });
        });
        const currmtime = curr.mtimeMs;
        if (curr.size !== prev.size || currmtime > prev.mtimeMs || currmtime === 0) {
          foreach(cont.listeners, (listener2) => listener2(path, curr));
        }
      })
    };
    FsWatchFileInstances.set(fullPath, cont);
  }
  return () => {
    delFromSet(cont, KEY_LISTENERS, listener);
    delFromSet(cont, KEY_RAW, rawEmitter);
    if (isEmptySet(cont.listeners)) {
      FsWatchFileInstances.delete(fullPath);
      (0, import_fs.unwatchFile)(fullPath);
      cont.options = cont.watcher = void 0;
      Object.freeze(cont);
    }
  };
};
var NodeFsHandler = class {
  constructor(fsW) {
    this.fsw = fsW;
    this._boundHandleError = (error) => fsW._handleError(error);
  }
  /**
   * Watch file for changes with fs_watchFile or fs_watch.
   * @param path to file or dir
   * @param listener on fs change
   * @returns closer for the watcher instance
   */
  _watchWithNodeFs(path, listener) {
    const opts = this.fsw.options;
    const directory = sysPath.dirname(path);
    const basename3 = sysPath.basename(path);
    const parent = this.fsw._getWatchedDir(directory);
    parent.add(basename3);
    const absolutePath = sysPath.resolve(path);
    const options = {
      persistent: opts.persistent
    };
    if (!listener)
      listener = EMPTY_FN;
    let closer;
    if (opts.usePolling) {
      const enableBin = opts.interval !== opts.binaryInterval;
      options.interval = enableBin && isBinaryPath(basename3) ? opts.binaryInterval : opts.interval;
      closer = setFsWatchFileListener(path, absolutePath, options, {
        listener,
        rawEmitter: this.fsw._emitRaw
      });
    } else {
      closer = setFsWatchListener(path, absolutePath, options, {
        listener,
        errHandler: this._boundHandleError,
        rawEmitter: this.fsw._emitRaw
      });
    }
    return closer;
  }
  /**
   * Watch a file and emit add event if warranted.
   * @returns closer for the watcher instance
   */
  _handleFile(file, stats, initialAdd) {
    if (this.fsw.closed) {
      return;
    }
    const dirname6 = sysPath.dirname(file);
    const basename3 = sysPath.basename(file);
    const parent = this.fsw._getWatchedDir(dirname6);
    let prevStats = stats;
    if (parent.has(basename3))
      return;
    const listener = async (path, newStats) => {
      if (!this.fsw._throttle(THROTTLE_MODE_WATCH, file, 5))
        return;
      if (!newStats || newStats.mtimeMs === 0) {
        try {
          const newStats2 = await (0, import_promises2.stat)(file);
          if (this.fsw.closed)
            return;
          const at = newStats2.atimeMs;
          const mt = newStats2.mtimeMs;
          if (!at || at <= mt || mt !== prevStats.mtimeMs) {
            this.fsw._emit(EV.CHANGE, file, newStats2);
          }
          if ((isMacos || isLinux || isFreeBSD) && prevStats.ino !== newStats2.ino) {
            this.fsw._closeFile(path);
            prevStats = newStats2;
            const closer2 = this._watchWithNodeFs(file, listener);
            if (closer2)
              this.fsw._addPathCloser(path, closer2);
          } else {
            prevStats = newStats2;
          }
        } catch (error) {
          this.fsw._remove(dirname6, basename3);
        }
      } else if (parent.has(basename3)) {
        const at = newStats.atimeMs;
        const mt = newStats.mtimeMs;
        if (!at || at <= mt || mt !== prevStats.mtimeMs) {
          this.fsw._emit(EV.CHANGE, file, newStats);
        }
        prevStats = newStats;
      }
    };
    const closer = this._watchWithNodeFs(file, listener);
    if (!(initialAdd && this.fsw.options.ignoreInitial) && this.fsw._isntIgnored(file)) {
      if (!this.fsw._throttle(EV.ADD, file, 0))
        return;
      this.fsw._emit(EV.ADD, file, stats);
    }
    return closer;
  }
  /**
   * Handle symlinks encountered while reading a dir.
   * @param entry returned by readdirp
   * @param directory path of dir being read
   * @param path of this item
   * @param item basename of this item
   * @returns true if no more processing is needed for this entry.
   */
  async _handleSymlink(entry, directory, path, item) {
    if (this.fsw.closed) {
      return;
    }
    const full = entry.fullPath;
    const dir = this.fsw._getWatchedDir(directory);
    if (!this.fsw.options.followSymlinks) {
      this.fsw._incrReadyCount();
      let linkPath;
      try {
        linkPath = await (0, import_promises2.realpath)(path);
      } catch (e) {
        this.fsw._emitReady();
        return true;
      }
      if (this.fsw.closed)
        return;
      if (dir.has(item)) {
        if (this.fsw._symlinkPaths.get(full) !== linkPath) {
          this.fsw._symlinkPaths.set(full, linkPath);
          this.fsw._emit(EV.CHANGE, path, entry.stats);
        }
      } else {
        dir.add(item);
        this.fsw._symlinkPaths.set(full, linkPath);
        this.fsw._emit(EV.ADD, path, entry.stats);
      }
      this.fsw._emitReady();
      return true;
    }
    if (this.fsw._symlinkPaths.has(full)) {
      return true;
    }
    this.fsw._symlinkPaths.set(full, true);
  }
  _handleRead(directory, initialAdd, wh, target, dir, depth, throttler) {
    directory = sysPath.join(directory, "");
    throttler = this.fsw._throttle("readdir", directory, 1e3);
    if (!throttler)
      return;
    const previous = this.fsw._getWatchedDir(wh.path);
    const current = /* @__PURE__ */ new Set();
    let stream = this.fsw._readdirp(directory, {
      fileFilter: (entry) => wh.filterPath(entry),
      directoryFilter: (entry) => wh.filterDir(entry)
    });
    if (!stream)
      return;
    stream.on(STR_DATA, async (entry) => {
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      const item = entry.path;
      let path = sysPath.join(directory, item);
      current.add(item);
      if (entry.stats.isSymbolicLink() && await this._handleSymlink(entry, directory, path, item)) {
        return;
      }
      if (this.fsw.closed) {
        stream = void 0;
        return;
      }
      if (item === target || !target && !previous.has(item)) {
        this.fsw._incrReadyCount();
        path = sysPath.join(dir, sysPath.relative(dir, path));
        this._addToNodeFs(path, initialAdd, wh, depth + 1);
      }
    }).on(EV.ERROR, this._boundHandleError);
    return new Promise((resolve6, reject) => {
      if (!stream)
        return reject();
      stream.once(STR_END, () => {
        if (this.fsw.closed) {
          stream = void 0;
          return;
        }
        const wasThrottled = throttler ? throttler.clear() : false;
        resolve6(void 0);
        previous.getChildren().filter((item) => {
          return item !== directory && !current.has(item);
        }).forEach((item) => {
          this.fsw._remove(directory, item);
        });
        stream = void 0;
        if (wasThrottled)
          this._handleRead(directory, false, wh, target, dir, depth, throttler);
      });
    });
  }
  /**
   * Read directory to add / remove files from `@watched` list and re-read it on change.
   * @param dir fs path
   * @param stats
   * @param initialAdd
   * @param depth relative to user-supplied path
   * @param target child path targeted for watch
   * @param wh Common watch helpers for this path
   * @param realpath
   * @returns closer for the watcher instance.
   */
  async _handleDir(dir, stats, initialAdd, depth, target, wh, realpath2) {
    const parentDir = this.fsw._getWatchedDir(sysPath.dirname(dir));
    const tracked = parentDir.has(sysPath.basename(dir));
    if (!(initialAdd && this.fsw.options.ignoreInitial) && !target && !tracked) {
      this.fsw._emit(EV.ADD_DIR, dir, stats);
    }
    parentDir.add(sysPath.basename(dir));
    this.fsw._getWatchedDir(dir);
    let throttler;
    let closer;
    const oDepth = this.fsw.options.depth;
    if ((oDepth == null || depth <= oDepth) && !this.fsw._symlinkPaths.has(realpath2)) {
      if (!target) {
        await this._handleRead(dir, initialAdd, wh, target, dir, depth, throttler);
        if (this.fsw.closed)
          return;
      }
      closer = this._watchWithNodeFs(dir, (dirPath, stats2) => {
        if (stats2 && stats2.mtimeMs === 0)
          return;
        this._handleRead(dirPath, false, wh, target, dir, depth, throttler);
      });
    }
    return closer;
  }
  /**
   * Handle added file, directory, or glob pattern.
   * Delegates call to _handleFile / _handleDir after checks.
   * @param path to file or ir
   * @param initialAdd was the file added at watch instantiation?
   * @param priorWh depth relative to user-supplied path
   * @param depth Child path actually targeted for watch
   * @param target Child path actually targeted for watch
   */
  async _addToNodeFs(path, initialAdd, priorWh, depth, target) {
    const ready = this.fsw._emitReady;
    if (this.fsw._isIgnored(path) || this.fsw.closed) {
      ready();
      return false;
    }
    const wh = this.fsw._getWatchHelpers(path);
    if (priorWh) {
      wh.filterPath = (entry) => priorWh.filterPath(entry);
      wh.filterDir = (entry) => priorWh.filterDir(entry);
    }
    try {
      const stats = await statMethods[wh.statMethod](wh.watchPath);
      if (this.fsw.closed)
        return;
      if (this.fsw._isIgnored(wh.watchPath, stats)) {
        ready();
        return false;
      }
      const follow = this.fsw.options.followSymlinks;
      let closer;
      if (stats.isDirectory()) {
        const absPath = sysPath.resolve(path);
        const targetPath = follow ? await (0, import_promises2.realpath)(path) : path;
        if (this.fsw.closed)
          return;
        closer = await this._handleDir(wh.watchPath, stats, initialAdd, depth, target, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (absPath !== targetPath && targetPath !== void 0) {
          this.fsw._symlinkPaths.set(absPath, targetPath);
        }
      } else if (stats.isSymbolicLink()) {
        const targetPath = follow ? await (0, import_promises2.realpath)(path) : path;
        if (this.fsw.closed)
          return;
        const parent = sysPath.dirname(wh.watchPath);
        this.fsw._getWatchedDir(parent).add(wh.watchPath);
        this.fsw._emit(EV.ADD, wh.watchPath, stats);
        closer = await this._handleDir(parent, stats, initialAdd, depth, path, wh, targetPath);
        if (this.fsw.closed)
          return;
        if (targetPath !== void 0) {
          this.fsw._symlinkPaths.set(sysPath.resolve(path), targetPath);
        }
      } else {
        closer = this._handleFile(wh.watchPath, stats, initialAdd);
      }
      ready();
      if (closer)
        this.fsw._addPathCloser(path, closer);
      return false;
    } catch (error) {
      if (this.fsw._handleError(error)) {
        ready();
        return path;
      }
    }
  }
};

// ../../node_modules/chokidar/esm/index.js
var SLASH = "/";
var SLASH_SLASH = "//";
var ONE_DOT = ".";
var TWO_DOTS = "..";
var STRING_TYPE = "string";
var BACK_SLASH_RE = /\\/g;
var DOUBLE_SLASH_RE = /\/\//;
var DOT_RE = /\..*\.(sw[px])$|~$|\.subl.*\.tmp/;
var REPLACER_RE = /^\.[/\\]/;
function arrify(item) {
  return Array.isArray(item) ? item : [item];
}
var isMatcherObject = (matcher) => typeof matcher === "object" && matcher !== null && !(matcher instanceof RegExp);
function createPattern(matcher) {
  if (typeof matcher === "function")
    return matcher;
  if (typeof matcher === "string")
    return (string) => matcher === string;
  if (matcher instanceof RegExp)
    return (string) => matcher.test(string);
  if (typeof matcher === "object" && matcher !== null) {
    return (string) => {
      if (matcher.path === string)
        return true;
      if (matcher.recursive) {
        const relative6 = sysPath2.relative(matcher.path, string);
        if (!relative6) {
          return false;
        }
        return !relative6.startsWith("..") && !sysPath2.isAbsolute(relative6);
      }
      return false;
    };
  }
  return () => false;
}
function normalizePath(path) {
  if (typeof path !== "string")
    throw new Error("string expected");
  path = sysPath2.normalize(path);
  path = path.replace(/\\/g, "/");
  let prepend = false;
  if (path.startsWith("//"))
    prepend = true;
  const DOUBLE_SLASH_RE2 = /\/\//;
  while (path.match(DOUBLE_SLASH_RE2))
    path = path.replace(DOUBLE_SLASH_RE2, "/");
  if (prepend)
    path = "/" + path;
  return path;
}
function matchPatterns(patterns, testString, stats) {
  const path = normalizePath(testString);
  for (let index = 0; index < patterns.length; index++) {
    const pattern = patterns[index];
    if (pattern(path, stats)) {
      return true;
    }
  }
  return false;
}
function anymatch(matchers, testString) {
  if (matchers == null) {
    throw new TypeError("anymatch: specify first argument");
  }
  const matchersArray = arrify(matchers);
  const patterns = matchersArray.map((matcher) => createPattern(matcher));
  if (testString == null) {
    return (testString2, stats) => {
      return matchPatterns(patterns, testString2, stats);
    };
  }
  return matchPatterns(patterns, testString);
}
var unifyPaths = (paths_) => {
  const paths = arrify(paths_).flat();
  if (!paths.every((p) => typeof p === STRING_TYPE)) {
    throw new TypeError(`Non-string provided as watch path: ${paths}`);
  }
  return paths.map(normalizePathToUnix);
};
var toUnix = (string) => {
  let str = string.replace(BACK_SLASH_RE, SLASH);
  let prepend = false;
  if (str.startsWith(SLASH_SLASH)) {
    prepend = true;
  }
  while (str.match(DOUBLE_SLASH_RE)) {
    str = str.replace(DOUBLE_SLASH_RE, SLASH);
  }
  if (prepend) {
    str = SLASH + str;
  }
  return str;
};
var normalizePathToUnix = (path) => toUnix(sysPath2.normalize(toUnix(path)));
var normalizeIgnored = (cwd = "") => (path) => {
  if (typeof path === "string") {
    return normalizePathToUnix(sysPath2.isAbsolute(path) ? path : sysPath2.join(cwd, path));
  } else {
    return path;
  }
};
var getAbsolutePath = (path, cwd) => {
  if (sysPath2.isAbsolute(path)) {
    return path;
  }
  return sysPath2.join(cwd, path);
};
var EMPTY_SET = Object.freeze(/* @__PURE__ */ new Set());
var DirEntry = class {
  constructor(dir, removeWatcher) {
    this.path = dir;
    this._removeWatcher = removeWatcher;
    this.items = /* @__PURE__ */ new Set();
  }
  add(item) {
    const { items } = this;
    if (!items)
      return;
    if (item !== ONE_DOT && item !== TWO_DOTS)
      items.add(item);
  }
  async remove(item) {
    const { items } = this;
    if (!items)
      return;
    items.delete(item);
    if (items.size > 0)
      return;
    const dir = this.path;
    try {
      await (0, import_promises3.readdir)(dir);
    } catch (err) {
      if (this._removeWatcher) {
        this._removeWatcher(sysPath2.dirname(dir), sysPath2.basename(dir));
      }
    }
  }
  has(item) {
    const { items } = this;
    if (!items)
      return;
    return items.has(item);
  }
  getChildren() {
    const { items } = this;
    if (!items)
      return [];
    return [...items.values()];
  }
  dispose() {
    this.items.clear();
    this.path = "";
    this._removeWatcher = EMPTY_FN;
    this.items = EMPTY_SET;
    Object.freeze(this);
  }
};
var STAT_METHOD_F = "stat";
var STAT_METHOD_L = "lstat";
var WatchHelper = class {
  constructor(path, follow, fsw) {
    this.fsw = fsw;
    const watchPath = path;
    this.path = path = path.replace(REPLACER_RE, "");
    this.watchPath = watchPath;
    this.fullWatchPath = sysPath2.resolve(watchPath);
    this.dirParts = [];
    this.dirParts.forEach((parts) => {
      if (parts.length > 1)
        parts.pop();
    });
    this.followSymlinks = follow;
    this.statMethod = follow ? STAT_METHOD_F : STAT_METHOD_L;
  }
  entryPath(entry) {
    return sysPath2.join(this.watchPath, sysPath2.relative(this.watchPath, entry.fullPath));
  }
  filterPath(entry) {
    const { stats } = entry;
    if (stats && stats.isSymbolicLink())
      return this.filterDir(entry);
    const resolvedPath = this.entryPath(entry);
    return this.fsw._isntIgnored(resolvedPath, stats) && this.fsw._hasReadPermissions(stats);
  }
  filterDir(entry) {
    return this.fsw._isntIgnored(this.entryPath(entry), entry.stats);
  }
};
var FSWatcher = class extends import_events.EventEmitter {
  // Not indenting methods for history sake; for now.
  constructor(_opts = {}) {
    super();
    this.closed = false;
    this._closers = /* @__PURE__ */ new Map();
    this._ignoredPaths = /* @__PURE__ */ new Set();
    this._throttled = /* @__PURE__ */ new Map();
    this._streams = /* @__PURE__ */ new Set();
    this._symlinkPaths = /* @__PURE__ */ new Map();
    this._watched = /* @__PURE__ */ new Map();
    this._pendingWrites = /* @__PURE__ */ new Map();
    this._pendingUnlinks = /* @__PURE__ */ new Map();
    this._readyCount = 0;
    this._readyEmitted = false;
    const awf = _opts.awaitWriteFinish;
    const DEF_AWF = { stabilityThreshold: 2e3, pollInterval: 100 };
    const opts = {
      // Defaults
      persistent: true,
      ignoreInitial: false,
      ignorePermissionErrors: false,
      interval: 100,
      binaryInterval: 300,
      followSymlinks: true,
      usePolling: false,
      // useAsync: false,
      atomic: true,
      // NOTE: overwritten later (depends on usePolling)
      ..._opts,
      // Change format
      ignored: _opts.ignored ? arrify(_opts.ignored) : arrify([]),
      awaitWriteFinish: awf === true ? DEF_AWF : typeof awf === "object" ? { ...DEF_AWF, ...awf } : false
    };
    if (isIBMi)
      opts.usePolling = true;
    if (opts.atomic === void 0)
      opts.atomic = !opts.usePolling;
    const envPoll = process.env.CHOKIDAR_USEPOLLING;
    if (envPoll !== void 0) {
      const envLower = envPoll.toLowerCase();
      if (envLower === "false" || envLower === "0")
        opts.usePolling = false;
      else if (envLower === "true" || envLower === "1")
        opts.usePolling = true;
      else
        opts.usePolling = !!envLower;
    }
    const envInterval = process.env.CHOKIDAR_INTERVAL;
    if (envInterval)
      opts.interval = Number.parseInt(envInterval, 10);
    let readyCalls = 0;
    this._emitReady = () => {
      readyCalls++;
      if (readyCalls >= this._readyCount) {
        this._emitReady = EMPTY_FN;
        this._readyEmitted = true;
        process.nextTick(() => this.emit(EVENTS.READY));
      }
    };
    this._emitRaw = (...args) => this.emit(EVENTS.RAW, ...args);
    this._boundRemove = this._remove.bind(this);
    this.options = opts;
    this._nodeFsHandler = new NodeFsHandler(this);
    Object.freeze(opts);
  }
  _addIgnoredPath(matcher) {
    if (isMatcherObject(matcher)) {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher.path && ignored.recursive === matcher.recursive) {
          return;
        }
      }
    }
    this._ignoredPaths.add(matcher);
  }
  _removeIgnoredPath(matcher) {
    this._ignoredPaths.delete(matcher);
    if (typeof matcher === "string") {
      for (const ignored of this._ignoredPaths) {
        if (isMatcherObject(ignored) && ignored.path === matcher) {
          this._ignoredPaths.delete(ignored);
        }
      }
    }
  }
  // Public methods
  /**
   * Adds paths to be watched on an existing FSWatcher instance.
   * @param paths_ file or file list. Other arguments are unused
   */
  add(paths_, _origAdd, _internal) {
    const { cwd } = this.options;
    this.closed = false;
    this._closePromise = void 0;
    let paths = unifyPaths(paths_);
    if (cwd) {
      paths = paths.map((path) => {
        const absPath = getAbsolutePath(path, cwd);
        return absPath;
      });
    }
    paths.forEach((path) => {
      this._removeIgnoredPath(path);
    });
    this._userIgnored = void 0;
    if (!this._readyCount)
      this._readyCount = 0;
    this._readyCount += paths.length;
    Promise.all(paths.map(async (path) => {
      const res = await this._nodeFsHandler._addToNodeFs(path, !_internal, void 0, 0, _origAdd);
      if (res)
        this._emitReady();
      return res;
    })).then((results) => {
      if (this.closed)
        return;
      results.forEach((item) => {
        if (item)
          this.add(sysPath2.dirname(item), sysPath2.basename(_origAdd || item));
      });
    });
    return this;
  }
  /**
   * Close watchers or start ignoring events from specified paths.
   */
  unwatch(paths_) {
    if (this.closed)
      return this;
    const paths = unifyPaths(paths_);
    const { cwd } = this.options;
    paths.forEach((path) => {
      if (!sysPath2.isAbsolute(path) && !this._closers.has(path)) {
        if (cwd)
          path = sysPath2.join(cwd, path);
        path = sysPath2.resolve(path);
      }
      this._closePath(path);
      this._addIgnoredPath(path);
      if (this._watched.has(path)) {
        this._addIgnoredPath({
          path,
          recursive: true
        });
      }
      this._userIgnored = void 0;
    });
    return this;
  }
  /**
   * Close watchers and remove all listeners from watched paths.
   */
  close() {
    if (this._closePromise) {
      return this._closePromise;
    }
    this.closed = true;
    this.removeAllListeners();
    const closers = [];
    this._closers.forEach((closerList) => closerList.forEach((closer) => {
      const promise = closer();
      if (promise instanceof Promise)
        closers.push(promise);
    }));
    this._streams.forEach((stream) => stream.destroy());
    this._userIgnored = void 0;
    this._readyCount = 0;
    this._readyEmitted = false;
    this._watched.forEach((dirent) => dirent.dispose());
    this._closers.clear();
    this._watched.clear();
    this._streams.clear();
    this._symlinkPaths.clear();
    this._throttled.clear();
    this._closePromise = closers.length ? Promise.all(closers).then(() => void 0) : Promise.resolve();
    return this._closePromise;
  }
  /**
   * Expose list of watched paths
   * @returns for chaining
   */
  getWatched() {
    const watchList = {};
    this._watched.forEach((entry, dir) => {
      const key = this.options.cwd ? sysPath2.relative(this.options.cwd, dir) : dir;
      const index = key || ONE_DOT;
      watchList[index] = entry.getChildren().sort();
    });
    return watchList;
  }
  emitWithAll(event, args) {
    this.emit(event, ...args);
    if (event !== EVENTS.ERROR)
      this.emit(EVENTS.ALL, event, ...args);
  }
  // Common helpers
  // --------------
  /**
   * Normalize and emit events.
   * Calling _emit DOES NOT MEAN emit() would be called!
   * @param event Type of event
   * @param path File or directory path
   * @param stats arguments to be passed with event
   * @returns the error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  async _emit(event, path, stats) {
    if (this.closed)
      return;
    const opts = this.options;
    if (isWindows)
      path = sysPath2.normalize(path);
    if (opts.cwd)
      path = sysPath2.relative(opts.cwd, path);
    const args = [path];
    if (stats != null)
      args.push(stats);
    const awf = opts.awaitWriteFinish;
    let pw;
    if (awf && (pw = this._pendingWrites.get(path))) {
      pw.lastChange = /* @__PURE__ */ new Date();
      return this;
    }
    if (opts.atomic) {
      if (event === EVENTS.UNLINK) {
        this._pendingUnlinks.set(path, [event, ...args]);
        setTimeout(() => {
          this._pendingUnlinks.forEach((entry, path2) => {
            this.emit(...entry);
            this.emit(EVENTS.ALL, ...entry);
            this._pendingUnlinks.delete(path2);
          });
        }, typeof opts.atomic === "number" ? opts.atomic : 100);
        return this;
      }
      if (event === EVENTS.ADD && this._pendingUnlinks.has(path)) {
        event = EVENTS.CHANGE;
        this._pendingUnlinks.delete(path);
      }
    }
    if (awf && (event === EVENTS.ADD || event === EVENTS.CHANGE) && this._readyEmitted) {
      const awfEmit = (err, stats2) => {
        if (err) {
          event = EVENTS.ERROR;
          args[0] = err;
          this.emitWithAll(event, args);
        } else if (stats2) {
          if (args.length > 1) {
            args[1] = stats2;
          } else {
            args.push(stats2);
          }
          this.emitWithAll(event, args);
        }
      };
      this._awaitWriteFinish(path, awf.stabilityThreshold, event, awfEmit);
      return this;
    }
    if (event === EVENTS.CHANGE) {
      const isThrottled = !this._throttle(EVENTS.CHANGE, path, 50);
      if (isThrottled)
        return this;
    }
    if (opts.alwaysStat && stats === void 0 && (event === EVENTS.ADD || event === EVENTS.ADD_DIR || event === EVENTS.CHANGE)) {
      const fullPath = opts.cwd ? sysPath2.join(opts.cwd, path) : path;
      let stats2;
      try {
        stats2 = await (0, import_promises3.stat)(fullPath);
      } catch (err) {
      }
      if (!stats2 || this.closed)
        return;
      args.push(stats2);
    }
    this.emitWithAll(event, args);
    return this;
  }
  /**
   * Common handler for errors
   * @returns The error if defined, otherwise the value of the FSWatcher instance's `closed` flag
   */
  _handleError(error) {
    const code = error && error.code;
    if (error && code !== "ENOENT" && code !== "ENOTDIR" && (!this.options.ignorePermissionErrors || code !== "EPERM" && code !== "EACCES")) {
      this.emit(EVENTS.ERROR, error);
    }
    return error || this.closed;
  }
  /**
   * Helper utility for throttling
   * @param actionType type being throttled
   * @param path being acted upon
   * @param timeout duration of time to suppress duplicate actions
   * @returns tracking object or false if action should be suppressed
   */
  _throttle(actionType, path, timeout) {
    if (!this._throttled.has(actionType)) {
      this._throttled.set(actionType, /* @__PURE__ */ new Map());
    }
    const action = this._throttled.get(actionType);
    if (!action)
      throw new Error("invalid throttle");
    const actionPath = action.get(path);
    if (actionPath) {
      actionPath.count++;
      return false;
    }
    let timeoutObject;
    const clear = () => {
      const item = action.get(path);
      const count = item ? item.count : 0;
      action.delete(path);
      clearTimeout(timeoutObject);
      if (item)
        clearTimeout(item.timeoutObject);
      return count;
    };
    timeoutObject = setTimeout(clear, timeout);
    const thr = { timeoutObject, clear, count: 0 };
    action.set(path, thr);
    return thr;
  }
  _incrReadyCount() {
    return this._readyCount++;
  }
  /**
   * Awaits write operation to finish.
   * Polls a newly created file for size variations. When files size does not change for 'threshold' milliseconds calls callback.
   * @param path being acted upon
   * @param threshold Time in milliseconds a file size must be fixed before acknowledging write OP is finished
   * @param event
   * @param awfEmit Callback to be called when ready for event to be emitted.
   */
  _awaitWriteFinish(path, threshold, event, awfEmit) {
    const awf = this.options.awaitWriteFinish;
    if (typeof awf !== "object")
      return;
    const pollInterval = awf.pollInterval;
    let timeoutHandler;
    let fullPath = path;
    if (this.options.cwd && !sysPath2.isAbsolute(path)) {
      fullPath = sysPath2.join(this.options.cwd, path);
    }
    const now = /* @__PURE__ */ new Date();
    const writes = this._pendingWrites;
    function awaitWriteFinishFn(prevStat) {
      (0, import_fs2.stat)(fullPath, (err, curStat) => {
        if (err || !writes.has(path)) {
          if (err && err.code !== "ENOENT")
            awfEmit(err);
          return;
        }
        const now2 = Number(/* @__PURE__ */ new Date());
        if (prevStat && curStat.size !== prevStat.size) {
          writes.get(path).lastChange = now2;
        }
        const pw = writes.get(path);
        const df = now2 - pw.lastChange;
        if (df >= threshold) {
          writes.delete(path);
          awfEmit(void 0, curStat);
        } else {
          timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval, curStat);
        }
      });
    }
    if (!writes.has(path)) {
      writes.set(path, {
        lastChange: now,
        cancelWait: () => {
          writes.delete(path);
          clearTimeout(timeoutHandler);
          return event;
        }
      });
      timeoutHandler = setTimeout(awaitWriteFinishFn, pollInterval);
    }
  }
  /**
   * Determines whether user has asked to ignore this path.
   */
  _isIgnored(path, stats) {
    if (this.options.atomic && DOT_RE.test(path))
      return true;
    if (!this._userIgnored) {
      const { cwd } = this.options;
      const ign = this.options.ignored;
      const ignored = (ign || []).map(normalizeIgnored(cwd));
      const ignoredPaths = [...this._ignoredPaths];
      const list = [...ignoredPaths.map(normalizeIgnored(cwd)), ...ignored];
      this._userIgnored = anymatch(list, void 0);
    }
    return this._userIgnored(path, stats);
  }
  _isntIgnored(path, stat4) {
    return !this._isIgnored(path, stat4);
  }
  /**
   * Provides a set of common helpers and properties relating to symlink handling.
   * @param path file or directory pattern being watched
   */
  _getWatchHelpers(path) {
    return new WatchHelper(path, this.options.followSymlinks, this);
  }
  // Directory helpers
  // -----------------
  /**
   * Provides directory tracking objects
   * @param directory path of the directory
   */
  _getWatchedDir(directory) {
    const dir = sysPath2.resolve(directory);
    if (!this._watched.has(dir))
      this._watched.set(dir, new DirEntry(dir, this._boundRemove));
    return this._watched.get(dir);
  }
  // File helpers
  // ------------
  /**
   * Check for read permissions: https://stackoverflow.com/a/11781404/1358405
   */
  _hasReadPermissions(stats) {
    if (this.options.ignorePermissionErrors)
      return true;
    return Boolean(Number(stats.mode) & 256);
  }
  /**
   * Handles emitting unlink events for
   * files and directories, and via recursion, for
   * files and directories within directories that are unlinked
   * @param directory within which the following item is located
   * @param item      base path of item/directory
   */
  _remove(directory, item, isDirectory) {
    const path = sysPath2.join(directory, item);
    const fullPath = sysPath2.resolve(path);
    isDirectory = isDirectory != null ? isDirectory : this._watched.has(path) || this._watched.has(fullPath);
    if (!this._throttle("remove", path, 100))
      return;
    if (!isDirectory && this._watched.size === 1) {
      this.add(directory, item, true);
    }
    const wp = this._getWatchedDir(path);
    const nestedDirectoryChildren = wp.getChildren();
    nestedDirectoryChildren.forEach((nested) => this._remove(path, nested));
    const parent = this._getWatchedDir(directory);
    const wasTracked = parent.has(item);
    parent.remove(item);
    if (this._symlinkPaths.has(fullPath)) {
      this._symlinkPaths.delete(fullPath);
    }
    let relPath = path;
    if (this.options.cwd)
      relPath = sysPath2.relative(this.options.cwd, path);
    if (this.options.awaitWriteFinish && this._pendingWrites.has(relPath)) {
      const event = this._pendingWrites.get(relPath).cancelWait();
      if (event === EVENTS.ADD)
        return;
    }
    this._watched.delete(path);
    this._watched.delete(fullPath);
    const eventName = isDirectory ? EVENTS.UNLINK_DIR : EVENTS.UNLINK;
    if (wasTracked && !this._isIgnored(path))
      this._emit(eventName, path);
    this._closePath(path);
  }
  /**
   * Closes all watchers for a path
   */
  _closePath(path) {
    this._closeFile(path);
    const dir = sysPath2.dirname(path);
    this._getWatchedDir(dir).remove(sysPath2.basename(path));
  }
  /**
   * Closes only file-specific watchers
   */
  _closeFile(path) {
    const closers = this._closers.get(path);
    if (!closers)
      return;
    closers.forEach((closer) => closer());
    this._closers.delete(path);
  }
  _addPathCloser(path, closer) {
    if (!closer)
      return;
    let list = this._closers.get(path);
    if (!list) {
      list = [];
      this._closers.set(path, list);
    }
    list.push(closer);
  }
  _readdirp(root, opts) {
    if (this.closed)
      return;
    const options = { type: EVENTS.ALL, alwaysStat: true, lstat: true, ...opts, depth: 0 };
    let stream = readdirp(root, options);
    this._streams.add(stream);
    stream.once(STR_CLOSE, () => {
      stream = void 0;
    });
    stream.once(STR_END, () => {
      if (stream) {
        this._streams.delete(stream);
        stream = void 0;
      }
    });
    return stream;
  }
};
function watch(paths, options = {}) {
  const watcher = new FSWatcher(options);
  watcher.add(paths);
  return watcher;
}
var esm_default = { watch, FSWatcher };

// src/tweak-discovery.ts
var import_node_fs = require("node:fs");
var import_node_path2 = require("node:path");
var ENTRY_CANDIDATES = ["index.js", "index.cjs", "index.mjs"];
function discoverTweaks(tweaksDir) {
  if (!(0, import_node_fs.existsSync)(tweaksDir)) return [];
  const out = [];
  for (const name of (0, import_node_fs.readdirSync)(tweaksDir)) {
    const dir = (0, import_node_path2.join)(tweaksDir, name);
    if (!(0, import_node_fs.statSync)(dir).isDirectory()) continue;
    const manifestPath = (0, import_node_path2.join)(dir, "manifest.json");
    if (!(0, import_node_fs.existsSync)(manifestPath)) continue;
    let manifest;
    try {
      manifest = JSON.parse((0, import_node_fs.readFileSync)(manifestPath, "utf8"));
    } catch {
      continue;
    }
    if (!isValidManifest(manifest)) continue;
    const entry = resolveEntry(dir, manifest);
    if (!entry) continue;
    out.push({ dir, entry, manifest });
  }
  return out;
}
function isValidManifest(m) {
  if (!m.id || !m.name || !m.version || !m.githubRepo) return false;
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(m.githubRepo)) return false;
  if (m.scope && !["renderer", "main", "both"].includes(m.scope)) return false;
  return true;
}
function resolveEntry(dir, m) {
  if (m.main) {
    const p = (0, import_node_path2.join)(dir, m.main);
    return (0, import_node_fs.existsSync)(p) ? p : null;
  }
  for (const c of ENTRY_CANDIDATES) {
    const p = (0, import_node_path2.join)(dir, c);
    if ((0, import_node_fs.existsSync)(p)) return p;
  }
  return null;
}

// src/storage.ts
var import_node_fs2 = require("node:fs");
var import_node_path3 = require("node:path");
var FLUSH_DELAY_MS = 50;
function createDiskStorage(rootDir, id) {
  const dir = (0, import_node_path3.join)(rootDir, "storage");
  (0, import_node_fs2.mkdirSync)(dir, { recursive: true });
  const file = (0, import_node_path3.join)(dir, `${sanitize(id)}.json`);
  let data = {};
  if ((0, import_node_fs2.existsSync)(file)) {
    try {
      data = JSON.parse((0, import_node_fs2.readFileSync)(file, "utf8"));
    } catch {
      try {
        (0, import_node_fs2.renameSync)(file, `${file}.corrupt-${Date.now()}`);
      } catch {
      }
      data = {};
    }
  }
  let dirty = false;
  let timer = null;
  const scheduleFlush = () => {
    dirty = true;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (dirty) flush();
    }, FLUSH_DELAY_MS);
  };
  const flush = () => {
    if (!dirty) return;
    const tmp = `${file}.tmp`;
    try {
      (0, import_node_fs2.writeFileSync)(tmp, JSON.stringify(data, null, 2), "utf8");
      (0, import_node_fs2.renameSync)(tmp, file);
      dirty = false;
    } catch (e) {
      console.error("[codex-plusplus] storage flush failed:", id, e);
    }
  };
  return {
    get: (k, d) => Object.prototype.hasOwnProperty.call(data, k) ? data[k] : d,
    set(k, v) {
      data[k] = v;
      scheduleFlush();
    },
    delete(k) {
      if (k in data) {
        delete data[k];
        scheduleFlush();
      }
    },
    all: () => ({ ...data }),
    flush
  };
}
function sanitize(id) {
  return id.replace(/[^a-zA-Z0-9._@-]/g, "_");
}

// src/mcp-sync.ts
var import_node_fs3 = require("node:fs");
var import_node_path4 = require("node:path");
var MCP_MANAGED_START = "# BEGIN CODEX++ MANAGED MCP SERVERS";
var MCP_MANAGED_END = "# END CODEX++ MANAGED MCP SERVERS";
function syncManagedMcpServers({
  configPath,
  tweaks
}) {
  const current = (0, import_node_fs3.existsSync)(configPath) ? (0, import_node_fs3.readFileSync)(configPath, "utf8") : "";
  const built = buildManagedMcpBlock(tweaks, current);
  const next = mergeManagedMcpBlock(current, built.block);
  if (next !== current) {
    (0, import_node_fs3.mkdirSync)((0, import_node_path4.dirname)(configPath), { recursive: true });
    (0, import_node_fs3.writeFileSync)(configPath, next, "utf8");
  }
  return { ...built, changed: next !== current };
}
function buildManagedMcpBlock(tweaks, existingToml = "") {
  const manualToml = stripManagedMcpBlock(existingToml);
  const manualNames = findMcpServerNames(manualToml);
  const usedNames = new Set(manualNames);
  const serverNames = [];
  const skippedServerNames = [];
  const entries = [];
  for (const tweak of tweaks) {
    const mcp = normalizeMcpServer(tweak.manifest.mcp);
    if (!mcp) continue;
    const baseName = mcpServerNameFromTweakId(tweak.manifest.id);
    if (manualNames.has(baseName)) {
      skippedServerNames.push(baseName);
      continue;
    }
    const serverName = reserveUniqueName(baseName, usedNames);
    serverNames.push(serverName);
    entries.push(formatMcpServer(serverName, tweak.dir, mcp));
  }
  if (entries.length === 0) {
    return { block: "", serverNames, skippedServerNames };
  }
  return {
    block: [MCP_MANAGED_START, ...entries, MCP_MANAGED_END].join("\n"),
    serverNames,
    skippedServerNames
  };
}
function mergeManagedMcpBlock(currentToml, managedBlock) {
  if (!managedBlock && !currentToml.includes(MCP_MANAGED_START)) return currentToml;
  const stripped = stripManagedMcpBlock(currentToml).trimEnd();
  if (!managedBlock) return stripped ? `${stripped}
` : "";
  return `${stripped ? `${stripped}

` : ""}${managedBlock}
`;
}
function stripManagedMcpBlock(toml) {
  const pattern = new RegExp(
    `\\n?${escapeRegExp(MCP_MANAGED_START)}[\\s\\S]*?${escapeRegExp(MCP_MANAGED_END)}\\n?`,
    "g"
  );
  return toml.replace(pattern, "\n").replace(/\n{3,}/g, "\n\n");
}
function mcpServerNameFromTweakId(id) {
  const withoutPublisher = id.replace(/^co\.bennett\./, "");
  const slug = withoutPublisher.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return slug || "tweak-mcp";
}
function findMcpServerNames(toml) {
  const names = /* @__PURE__ */ new Set();
  const tablePattern = /^\s*\[mcp_servers\.([^\]\s]+)\]\s*$/gm;
  let match;
  while ((match = tablePattern.exec(toml)) !== null) {
    names.add(unquoteTomlKey(match[1] ?? ""));
  }
  return names;
}
function reserveUniqueName(baseName, usedNames) {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return baseName;
  }
  for (let i = 2; ; i += 1) {
    const candidate = `${baseName}-${i}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }
}
function normalizeMcpServer(value) {
  if (!value || typeof value.command !== "string" || value.command.length === 0) return null;
  if (value.args !== void 0 && !Array.isArray(value.args)) return null;
  if (value.args?.some((arg) => typeof arg !== "string")) return null;
  if (value.env !== void 0) {
    if (!value.env || typeof value.env !== "object" || Array.isArray(value.env)) return null;
    if (Object.values(value.env).some((envValue) => typeof envValue !== "string")) return null;
  }
  return value;
}
function formatMcpServer(serverName, tweakDir, mcp) {
  const lines = [
    `[mcp_servers.${formatTomlKey(serverName)}]`,
    `command = ${formatTomlString(resolveCommand(tweakDir, mcp.command))}`
  ];
  if (mcp.args && mcp.args.length > 0) {
    lines.push(`args = ${formatTomlStringArray(mcp.args.map((arg) => resolveArg(tweakDir, arg)))}`);
  }
  if (mcp.env && Object.keys(mcp.env).length > 0) {
    lines.push(`env = ${formatTomlInlineTable(mcp.env)}`);
  }
  return lines.join("\n");
}
function resolveCommand(tweakDir, command) {
  if ((0, import_node_path4.isAbsolute)(command) || !looksLikeRelativePath(command)) return command;
  return (0, import_node_path4.resolve)(tweakDir, command);
}
function resolveArg(tweakDir, arg) {
  if ((0, import_node_path4.isAbsolute)(arg) || arg.startsWith("-")) return arg;
  const candidate = (0, import_node_path4.resolve)(tweakDir, arg);
  return (0, import_node_fs3.existsSync)(candidate) ? candidate : arg;
}
function looksLikeRelativePath(value) {
  return value.startsWith("./") || value.startsWith("../") || value.includes("/");
}
function formatTomlString(value) {
  return JSON.stringify(value);
}
function formatTomlStringArray(values) {
  return `[${values.map(formatTomlString).join(", ")}]`;
}
function formatTomlInlineTable(record) {
  return `{ ${Object.entries(record).map(([key, value]) => `${formatTomlKey(key)} = ${formatTomlString(value)}`).join(", ")} }`;
}
function formatTomlKey(key) {
  return /^[a-zA-Z0-9_-]+$/.test(key) ? key : formatTomlString(key);
}
function unquoteTomlKey(key) {
  if (!key.startsWith('"') || !key.endsWith('"')) return key;
  try {
    return JSON.parse(key);
  } catch {
    return key;
  }
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/watcher-health.ts
var import_node_child_process = require("node:child_process");
var import_node_fs4 = require("node:fs");
var import_node_os = require("node:os");
var import_node_path5 = require("node:path");
var LAUNCHD_LABEL = "com.codexplusplus.watcher";
var WATCHER_LOG = (0, import_node_path5.join)((0, import_node_os.homedir)(), "Library", "Logs", "codex-plusplus-watcher.log");
function getWatcherHealth(userRoot2) {
  const checks = [];
  const state = readJson((0, import_node_path5.join)(userRoot2, "state.json"));
  const config = readJson((0, import_node_path5.join)(userRoot2, "config.json")) ?? {};
  const selfUpdate = readJson((0, import_node_path5.join)(userRoot2, "self-update-state.json"));
  checks.push({
    name: "Install state",
    status: state ? "ok" : "error",
    detail: state ? `Codex++ ${state.version ?? "(unknown version)"}` : "state.json is missing"
  });
  if (!state) return summarize("none", checks);
  const autoUpdate = config.codexPlusPlus?.autoUpdate !== false;
  checks.push({
    name: "Automatic refresh",
    status: autoUpdate ? "ok" : "warn",
    detail: autoUpdate ? "enabled" : "disabled in Codex++ config"
  });
  checks.push({
    name: "Watcher kind",
    status: state.watcher && state.watcher !== "none" ? "ok" : "error",
    detail: state.watcher ?? "none"
  });
  if (selfUpdate) {
    checks.push(selfUpdateCheck(selfUpdate));
  }
  const appRoot = state.appRoot ?? "";
  checks.push({
    name: "Codex app",
    status: appRoot && (0, import_node_fs4.existsSync)(appRoot) ? "ok" : "error",
    detail: appRoot || "missing appRoot in state"
  });
  switch ((0, import_node_os.platform)()) {
    case "darwin":
      checks.push(...checkLaunchdWatcher(appRoot));
      break;
    case "linux":
      checks.push(...checkSystemdWatcher(appRoot));
      break;
    case "win32":
      checks.push(...checkScheduledTaskWatcher());
      break;
    default:
      checks.push({
        name: "Platform watcher",
        status: "warn",
        detail: `unsupported platform: ${(0, import_node_os.platform)()}`
      });
  }
  return summarize(state.watcher ?? "none", checks);
}
function selfUpdateCheck(state) {
  const at = state.completedAt ?? state.checkedAt ?? "unknown time";
  if (state.status === "failed") {
    return {
      name: "last Codex++ update",
      status: "warn",
      detail: state.error ? `failed ${at}: ${state.error}` : `failed ${at}`
    };
  }
  if (state.status === "disabled") {
    return { name: "last Codex++ update", status: "warn", detail: `skipped ${at}: automatic refresh disabled` };
  }
  if (state.status === "updated") {
    return { name: "last Codex++ update", status: "ok", detail: `updated ${at} to ${state.latestVersion ?? "new release"}` };
  }
  if (state.status === "up-to-date") {
    return { name: "last Codex++ update", status: "ok", detail: `up to date ${at}` };
  }
  return { name: "last Codex++ update", status: "warn", detail: `checking since ${at}` };
}
function checkLaunchdWatcher(appRoot) {
  const checks = [];
  const plistPath = (0, import_node_path5.join)((0, import_node_os.homedir)(), "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);
  const plist = (0, import_node_fs4.existsSync)(plistPath) ? readFileSafe(plistPath) : "";
  const asarPath = appRoot ? (0, import_node_path5.join)(appRoot, "Contents", "Resources", "app.asar") : "";
  checks.push({
    name: "launchd plist",
    status: plist ? "ok" : "error",
    detail: plistPath
  });
  if (plist) {
    checks.push({
      name: "launchd label",
      status: plist.includes(LAUNCHD_LABEL) ? "ok" : "error",
      detail: LAUNCHD_LABEL
    });
    checks.push({
      name: "launchd trigger",
      status: asarPath && plist.includes(asarPath) ? "ok" : "error",
      detail: asarPath || "missing appRoot"
    });
    checks.push({
      name: "watcher command",
      status: plist.includes("CODEX_PLUSPLUS_WATCHER=1") && plist.includes(" update --watcher --quiet") ? "ok" : "error",
      detail: commandSummary(plist)
    });
    const cliPath = extractFirst(plist, /'([^']*packages\/installer\/dist\/cli\.js)'/);
    if (cliPath) {
      checks.push({
        name: "repair CLI",
        status: (0, import_node_fs4.existsSync)(cliPath) ? "ok" : "error",
        detail: cliPath
      });
    }
  }
  const loaded = commandSucceeds("launchctl", ["list", LAUNCHD_LABEL]);
  checks.push({
    name: "launchd loaded",
    status: loaded ? "ok" : "error",
    detail: loaded ? "service is loaded" : "launchctl cannot find the watcher"
  });
  checks.push(watcherLogCheck());
  return checks;
}
function checkSystemdWatcher(appRoot) {
  const dir = (0, import_node_path5.join)((0, import_node_os.homedir)(), ".config", "systemd", "user");
  const service = (0, import_node_path5.join)(dir, "codex-plusplus-watcher.service");
  const timer = (0, import_node_path5.join)(dir, "codex-plusplus-watcher.timer");
  const pathUnit = (0, import_node_path5.join)(dir, "codex-plusplus-watcher.path");
  const expectedPath = appRoot ? (0, import_node_path5.join)(appRoot, "resources", "app.asar") : "";
  const pathBody = (0, import_node_fs4.existsSync)(pathUnit) ? readFileSafe(pathUnit) : "";
  return [
    {
      name: "systemd service",
      status: (0, import_node_fs4.existsSync)(service) ? "ok" : "error",
      detail: service
    },
    {
      name: "systemd timer",
      status: (0, import_node_fs4.existsSync)(timer) ? "ok" : "error",
      detail: timer
    },
    {
      name: "systemd path",
      status: pathBody && expectedPath && pathBody.includes(expectedPath) ? "ok" : "error",
      detail: expectedPath || pathUnit
    },
    {
      name: "path unit active",
      status: commandSucceeds("systemctl", ["--user", "is-active", "--quiet", "codex-plusplus-watcher.path"]) ? "ok" : "warn",
      detail: "systemctl --user is-active codex-plusplus-watcher.path"
    },
    {
      name: "timer active",
      status: commandSucceeds("systemctl", ["--user", "is-active", "--quiet", "codex-plusplus-watcher.timer"]) ? "ok" : "warn",
      detail: "systemctl --user is-active codex-plusplus-watcher.timer"
    }
  ];
}
function checkScheduledTaskWatcher() {
  return [
    {
      name: "logon task",
      status: commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher"]) ? "ok" : "error",
      detail: "codex-plusplus-watcher"
    },
    {
      name: "hourly task",
      status: commandSucceeds("schtasks.exe", ["/Query", "/TN", "codex-plusplus-watcher-hourly"]) ? "ok" : "warn",
      detail: "codex-plusplus-watcher-hourly"
    }
  ];
}
function watcherLogCheck() {
  if (!(0, import_node_fs4.existsSync)(WATCHER_LOG)) {
    return { name: "watcher log", status: "warn", detail: "no watcher log yet" };
  }
  const tail = readFileSafe(WATCHER_LOG).split(/\r?\n/).slice(-40).join("\n");
  return analyzeWatcherLogTail(tail);
}
function analyzeWatcherLogTail(tail) {
  const hasError = /✗ codex-plusplus failed|codex-plusplus failed|error|failed/i.test(tail);
  const needsManualRepair = hasError && /Cannot write to .*Codex.*\.app|App Management|file ownership|sudo codexplusplus (?:install|repair)|EACCES|EPERM/i.test(tail);
  return {
    name: "watcher log",
    status: hasError ? "warn" : "ok",
    detail: hasError ? needsManualRepair ? "auto-repair needs app permissions; run `codexplusplus repair` from Terminal" : "recent watcher log contains an error" : WATCHER_LOG
  };
}
function summarize(watcher, checks) {
  const hasError = checks.some((c) => c.status === "error");
  const hasWarn = checks.some((c) => c.status === "warn");
  const status = hasError ? "error" : hasWarn ? "warn" : "ok";
  const failed = checks.filter((c) => c.status === "error").length;
  const warned = checks.filter((c) => c.status === "warn").length;
  const title = status === "ok" ? "Auto-repair watcher is ready" : status === "warn" ? "Auto-repair watcher needs review" : "Auto-repair watcher is not ready";
  const summary = status === "ok" ? "Codex++ should automatically repair itself after Codex updates." : `${failed} failing check(s), ${warned} warning(s).`;
  return {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status,
    title,
    summary,
    watcher,
    checks
  };
}
function commandSucceeds(command, args) {
  try {
    (0, import_node_child_process.execFileSync)(command, args, { stdio: "ignore", timeout: 5e3 });
    return true;
  } catch {
    return false;
  }
}
function commandSummary(plist) {
  const command = extractFirst(plist, /<string>([^<]*(?:update --watcher --quiet|repair --quiet)[^<]*)<\/string>/);
  return command ? unescapeXml(command).replace(/\s+/g, " ").trim() : "watcher command not found";
}
function extractFirst(source, pattern) {
  return source.match(pattern)?.[1] ?? null;
}
function readJson(path) {
  try {
    return JSON.parse((0, import_node_fs4.readFileSync)(path, "utf8"));
  } catch {
    return null;
  }
}
function readFileSafe(path) {
  try {
    return (0, import_node_fs4.readFileSync)(path, "utf8");
  } catch {
    return "";
  }
}
function unescapeXml(value) {
  return value.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

// src/tweak-lifecycle.ts
function isMainProcessTweakScope(scope) {
  return scope !== "renderer";
}
function reloadTweaks(reason, deps) {
  deps.logInfo(`reloading tweaks (${reason})`);
  deps.stopAllMainTweaks();
  deps.clearTweakModuleCache();
  deps.loadAllMainTweaks();
  deps.broadcastReload();
}
function setTweakEnabledAndReload(id, enabled, deps) {
  const normalizedEnabled = !!enabled;
  deps.setTweakEnabled(id, normalizedEnabled);
  deps.logInfo(`tweak ${id} enabled=${normalizedEnabled}`);
  reloadTweaks("enabled-toggle", deps);
  return true;
}

// src/logging.ts
var import_node_fs5 = require("node:fs");
var MAX_LOG_BYTES = 10 * 1024 * 1024;
function appendCappedLog(path, line, maxBytes = MAX_LOG_BYTES) {
  const incoming = Buffer.from(line);
  if (incoming.byteLength >= maxBytes) {
    (0, import_node_fs5.writeFileSync)(path, incoming.subarray(incoming.byteLength - maxBytes));
    return;
  }
  try {
    if ((0, import_node_fs5.existsSync)(path)) {
      const size = (0, import_node_fs5.statSync)(path).size;
      const allowedExisting = maxBytes - incoming.byteLength;
      if (size > allowedExisting) {
        const keepBytes = Math.max(0, Math.floor(maxBytes / 2) - incoming.byteLength);
        const tail = Buffer.alloc(keepBytes);
        const fd = (0, import_node_fs5.openSync)(path, "r");
        let bytesRead = 0;
        try {
          while (bytesRead < keepBytes) {
            const count = (0, import_node_fs5.readSync)(fd, tail, bytesRead, keepBytes - bytesRead, size - keepBytes + bytesRead);
            if (count === 0) break;
            bytesRead += count;
          }
        } finally {
          (0, import_node_fs5.closeSync)(fd);
        }
        (0, import_node_fs5.writeFileSync)(path, tail.subarray(0, bytesRead));
      }
    }
  } catch {
  }
  (0, import_node_fs5.appendFileSync)(path, incoming);
}

// src/codex-runtime-probe.ts
var import_electron = require("electron");
var import_node_fs6 = require("node:fs");
var import_node_path6 = require("node:path");
function getRuntimeInfo(opts) {
  return {
    type: detectRuntimeType(),
    codexVersion: opts.codexVersion ?? safeAppVersion(),
    channel: opts.channel,
    buildFlavor: safeBuildFlavor(),
    usesOwlAppShell: null,
    appPath: safeAppPath(),
    resourcesPath: process.resourcesPath ?? null
  };
}
function getRuntimeCapabilities(opts) {
  const services = asRecord(opts.getWindowServices());
  const windowManager = asRecord(services?.windowManager);
  const cdp = getCdpStatus();
  const native = opts.getNativeCapabilities?.() ?? defaultNativeCapabilities();
  const views = opts.getViewCapabilities?.() ?? defaultViewCapabilities();
  const canCreateWindow = typeof windowManager?.createWindow === "function" || typeof services?.createFreshWindow === "function" || typeof services?.createFreshLocalWindow === "function" || typeof services?.ensureHostWindow === "function";
  return {
    windows: {
      create: canCreateWindow,
      focus: true,
      primary: typeof services?.getPrimaryWindow === "function" || typeof windowManager?.getPrimaryWindow === "function",
      browserView: typeof windowManager?.registerWindow === "function"
    },
    views,
    cdp: {
      supported: true,
      enabled: cdp.enabled,
      port: cdp.port
    },
    native
  };
}
function getCdpStatus() {
  const enabled = process.env.CODEXPP_REMOTE_DEBUG === "1";
  const port = parseCdpPort(process.env.CODEXPP_REMOTE_DEBUG_PORT);
  return {
    supported: true,
    enabled,
    port: enabled ? port : null,
    url: enabled ? `http://127.0.0.1:${port}` : null
  };
}
async function listCdpTargets() {
  const status = getCdpStatus();
  if (!status.enabled || !status.url) return [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1e3);
  try {
    const res = await fetch(`${status.url}/json`, { signal: controller.signal });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => normalizeCdpTarget(row)).filter((row) => row !== null);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
function detectRuntimeType() {
  if (process.platform === "darwin") {
    const appRoot = inferMacAppRoot();
    if (appRoot && (0, import_node_fs6.existsSync)((0, import_node_path6.join)(appRoot, "Contents", "Frameworks", "Codex Framework.framework"))) {
      return "owl";
    }
    if (appRoot && (0, import_node_fs6.existsSync)((0, import_node_path6.join)(appRoot, "Contents", "Frameworks", "Electron Framework.framework"))) {
      return "electron";
    }
    if (process.resourcesPath && (0, import_node_fs6.existsSync)((0, import_node_path6.join)(process.resourcesPath, "app.asar"))) {
      return "electron";
    }
    return "unknown";
  }
  return process.resourcesPath && (0, import_node_fs6.existsSync)((0, import_node_path6.join)(process.resourcesPath, "app.asar")) ? "electron" : "unknown";
}
function inferMacAppRoot() {
  const marker = ".app/Contents/MacOS/";
  const idx = process.execPath.indexOf(marker);
  return idx >= 0 ? process.execPath.slice(0, idx + ".app".length) : null;
}
function safeAppVersion() {
  try {
    return import_electron.app.getVersion();
  } catch {
    return null;
  }
}
function safeAppPath() {
  try {
    return import_electron.app.getAppPath();
  } catch {
    return process.resourcesPath ? (0, import_node_path6.join)(process.resourcesPath, "app.asar") : null;
  }
}
function safeBuildFlavor() {
  const appPath = safeAppPath();
  if (!appPath) return null;
  const parent = (0, import_node_path6.dirname)(appPath);
  if (parent.includes("Nightly")) return "nightly";
  return import_electron.app.isPackaged ? "prod" : "dev";
}
function parseCdpPort(value) {
  const parsed = Number(value ?? "9222");
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536 ? parsed : 9222;
}
function defaultNativeCapabilities() {
  return {
    inProcessModules: true,
    swiftModules: process.platform === "darwin",
    appKitEmbedding: false,
    childWindowOverlay: false,
    directViewAttach: false,
    metalViews: false,
    nativeHost: false,
    helpers: true
  };
}
function defaultViewCapabilities() {
  return {
    create: false,
    privateViewTree: false,
    webContentsView: false,
    browserViewFallback: typeof import_electron.BrowserWindow.fromId === "function"
  };
}
function normalizeCdpTarget(row) {
  const value = asRecord(row);
  if (!value || typeof value.id !== "string" || typeof value.type !== "string" || typeof value.url !== "string") {
    return null;
  }
  return {
    id: value.id,
    type: value.type,
    url: value.url,
    ...typeof value.title === "string" ? { title: value.title } : {},
    ...typeof value.webSocketDebuggerUrl === "string" ? { webSocketDebuggerUrl: value.webSocketDebuggerUrl } : {}
  };
}
function asRecord(value) {
  return value && typeof value === "object" ? value : null;
}

// src/native-bridge.ts
var import_electron2 = require("electron");
var import_node_child_process2 = require("node:child_process");
var import_node_crypto = require("node:crypto");
var import_node_fs8 = require("node:fs");
var import_node_readline = require("node:readline");

// src/native-paths.ts
var import_node_fs7 = require("node:fs");
var import_node_path7 = require("node:path");
function resolveNativeTweakPath(tweakDir, path) {
  if (typeof path !== "string" || path.trim() === "") throw new Error("native path is required");
  const root = (0, import_node_fs7.realpathSync)(tweakDir);
  const full = (0, import_node_path7.resolve)(tweakDir, path);
  let target;
  try {
    target = (0, import_node_fs7.realpathSync)(full);
  } catch {
    throw new Error("native path does not exist");
  }
  if (!isPathInside(root, target) || target === root) {
    throw new Error("native path must stay inside the tweak directory");
  }
  return target;
}
function isPathInside(parent, target) {
  const rel = (0, import_node_path7.relative)((0, import_node_path7.resolve)(parent), (0, import_node_path7.resolve)(target));
  return rel === "" || !!rel && !rel.startsWith("..") && !(0, import_node_path7.isAbsolute)(rel);
}

// src/native-bridge.ts
var NativeBridge = class {
  constructor(log2, options = {}) {
    this.log = log2;
    this.options = options;
  }
  log;
  options;
  modules = /* @__PURE__ */ new Map();
  instances = /* @__PURE__ */ new Map();
  helpers = /* @__PURE__ */ new Map();
  nativeHostExports = null;
  nativeHostLoadError = null;
  getCapabilities() {
    const host = this.loadNativeHost(false);
    const hostCapabilities = host ? this.readNativeHostCapabilities(host) : {};
    const nativeHost = host !== null;
    return {
      inProcessModules: true,
      swiftModules: process.platform === "darwin",
      appKitEmbedding: Boolean(hostCapabilities.appKitEmbedding),
      childWindowOverlay: Boolean(hostCapabilities.childWindowOverlay),
      directViewAttach: Boolean(hostCapabilities.directViewAttach),
      metalViews: Boolean(hostCapabilities.metalViews),
      nativeHost,
      helpers: true
    };
  }
  loadModule(ctx, options) {
    const id = assertBridgeId(options.id, "native module id");
    const fullPath = resolveTweakPath(ctx, options.path);
    const kind = options.kind ?? inferModuleKind(fullPath);
    if (kind !== "node-addon") {
      throw new Error(
        `${kind} native modules must be loaded through a .node Objective-C++ shim in Codex++ 1.0.0`
      );
    }
    if (!fullPath.endsWith(".node")) {
      throw new Error("node-addon native modules must use a .node file");
    }
    const loaded = require(fullPath);
    const exports2 = selectEntrypoint(loaded, options.entrypoint);
    const key = moduleKey(ctx.id, id);
    this.modules.set(key, { key, tweakId: ctx.id, id, kind, path: fullPath, exports: exports2 });
    this.log("info", `loaded native module ${ctx.id}:${id}`, { kind, path: fullPath });
    return this.moduleRef(ctx.id, id, kind);
  }
  async createPanel(ctx, options) {
    const created = await this.createNativeInstance(ctx, "panel", options.moduleId, options.factory ?? "createPanel", {
      parentWindowId: options.parentWindowId,
      bounds: options.bounds,
      transparent: options.transparent === true,
      passthroughMouse: options.passthroughMouse === true
    });
    return this.panelRef(created);
  }
  async attachView(ctx, options) {
    const created = await this.createNativeInstance(ctx, "view", options.moduleId, options.factory ?? "attachView", {
      parentWindowId: options.parentWindowId,
      bounds: options.bounds,
      zIndex: options.zIndex
    });
    return this.viewRef(created);
  }
  launchHelper(ctx, options) {
    const id = assertBridgeId(options.id, "native helper id");
    if ((options.transport ?? "stdio") !== "stdio") {
      throw new Error("native helpers support only stdio transport in Codex++ 1.0.0");
    }
    if ((options.restart ?? "never") !== "never") {
      throw new Error("native helper restart policies are not available in Codex++ 1.0.0");
    }
    const executable = resolveTweakPath(ctx, options.executable);
    const args = options.args ?? [];
    const env = { ...process.env, ...options.env ?? {} };
    const child = (0, import_node_child_process2.spawn)(executable, args, {
      cwd: ctx.dir,
      env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const key = helperKey(ctx.id, id);
    const helper = {
      key,
      tweakId: ctx.id,
      id,
      child,
      pending: /* @__PURE__ */ new Map()
    };
    this.helpers.set(key, helper);
    const stdout = (0, import_node_readline.createInterface)({ input: child.stdout });
    stdout.on("line", (line) => this.handleHelperLine(helper, line));
    child.stderr.on("data", (chunk) => {
      this.log("warn", `native helper ${ctx.id}:${id} stderr`, String(chunk));
    });
    child.on("exit", (code, signal) => {
      this.log("info", `native helper ${ctx.id}:${id} exited`, { code, signal });
      this.helpers.delete(key);
      for (const request of helper.pending.values()) {
        clearTimeout(request.timer);
        request.reject(new Error(`native helper exited before response`));
      }
      helper.pending.clear();
    });
    child.on("error", (error) => {
      this.log("error", `native helper ${ctx.id}:${id} failed`, error);
      this.helpers.delete(key);
      for (const request of helper.pending.values()) {
        clearTimeout(request.timer);
        request.reject(error);
      }
      helper.pending.clear();
    });
    this.log("info", `launched native helper ${ctx.id}:${id}`, { pid: child.pid, executable });
    return this.helperRef(ctx.id, id, child.pid ?? -1);
  }
  disposeTweak(tweakId) {
    for (const [key, instance] of [...this.instances]) {
      if (instance.tweakId !== tweakId) continue;
      void this.disposeInstance(instance).finally(() => this.instances.delete(key));
    }
    for (const [key, helper] of [...this.helpers]) {
      if (helper.tweakId !== tweakId) continue;
      this.stopHelper(helper);
      this.helpers.delete(key);
    }
    for (const [key, mod] of [...this.modules]) {
      if (mod.tweakId !== tweakId) continue;
      void callOptional(mod.exports, "dispose", []);
      this.modules.delete(key);
    }
  }
  disposeAll() {
    const tweakIds = /* @__PURE__ */ new Set([
      ...[...this.modules.values()].map((item) => item.tweakId),
      ...[...this.instances.values()].map((item) => item.tweakId),
      ...[...this.helpers.values()].map((item) => item.tweakId)
    ]);
    for (const id of tweakIds) this.disposeTweak(id);
  }
  async callInstance(tweakId, kind, id, method, arg) {
    if (kind === "panel") {
      if (method === "setBounds") return this.invokeInstance(tweakId, id, "setBounds", [arg]);
      if (method === "show") return this.invokeInstance(tweakId, id, "show", []);
      if (method === "hide") return this.invokeInstance(tweakId, id, "hide", []);
      if (method === "dispose") return this.disposeInstanceById(tweakId, id);
    }
    if (kind === "view") {
      if (method === "setBounds") return this.invokeInstance(tweakId, id, "setBounds", [arg]);
      if (method === "setVisible") return this.invokeInstance(tweakId, id, "setVisible", [arg]);
      if (method === "dispose") return this.disposeInstanceById(tweakId, id);
    }
    throw new Error(`unknown native ${kind} method: ${method}`);
  }
  async callHelper(tweakId, helperId, method, payload, timeoutMs) {
    if (method === "send") return this.sendHelper(tweakId, helperId, payload);
    if (method === "request") return this.requestHelper(tweakId, helperId, payload, timeoutMs);
    if (method === "stop") return this.stopHelperById(tweakId, helperId);
    throw new Error(`unknown native helper method: ${method}`);
  }
  moduleRef(tweakId, id, kind = this.moduleFor(tweakId, id).kind) {
    return {
      id,
      kind,
      request: (method, payload, timeoutMs) => this.requestModule(tweakId, id, method, payload, timeoutMs),
      dispose: () => this.disposeModule(tweakId, id)
    };
  }
  panelRef(instance) {
    return {
      id: instance.id,
      windowId: instance.windowId,
      setBounds: (bounds) => this.invokeInstance(instance.tweakId, instance.id, "setBounds", [bounds]),
      show: () => this.invokeInstance(instance.tweakId, instance.id, "show", []),
      hide: () => this.invokeInstance(instance.tweakId, instance.id, "hide", []),
      dispose: () => this.disposeInstanceById(instance.tweakId, instance.id)
    };
  }
  viewRef(instance) {
    return {
      id: instance.id,
      setBounds: (bounds) => this.invokeInstance(instance.tweakId, instance.id, "setBounds", [bounds]),
      setVisible: (visible) => this.invokeInstance(instance.tweakId, instance.id, "setVisible", [visible]),
      dispose: () => this.disposeInstanceById(instance.tweakId, instance.id)
    };
  }
  helperRef(tweakId, id, pid) {
    return {
      id,
      pid,
      send: (message) => this.sendHelper(tweakId, id, message),
      request: (message, timeoutMs) => this.requestHelper(tweakId, id, message, timeoutMs),
      stop: () => this.stopHelperById(tweakId, id)
    };
  }
  async requestModule(tweakId, id, method, payload, _timeoutMs) {
    const mod = this.moduleFor(tweakId, id);
    const target = asRecord2(mod.exports);
    const fn = target?.request;
    if (typeof fn === "function") {
      return await fn.call(mod.exports, method, payload);
    }
    const methodFn = target?.[method];
    if (typeof methodFn === "function") {
      return await methodFn.call(mod.exports, payload);
    }
    throw new Error(`native module ${tweakId}:${id} has no request() or ${method}()`);
  }
  async disposeModule(tweakId, id) {
    const key = moduleKey(tweakId, id);
    const mod = this.modules.get(key);
    if (!mod) return;
    await callOptional(mod.exports, "dispose", []);
    this.modules.delete(key);
  }
  async createNativeInstance(ctx, kind, moduleId, factory, options) {
    const target = moduleId ? this.moduleFor(ctx.id, moduleId).exports : this.loadNativeHost(true);
    const fn = asRecord2(target)?.[factory];
    if (typeof fn !== "function") {
      const label = moduleId ? `native module ${ctx.id}:${moduleId}` : "Codex++ native host";
      throw new Error(`${label} has no factory ${factory}()`);
    }
    const parentWindow = typeof options.parentWindowId === "number" ? import_electron2.BrowserWindow.fromId(options.parentWindowId) : import_electron2.BrowserWindow.getFocusedWindow();
    const parentNativeHandle = nativeHandleForWindow(parentWindow);
    const value = await fn.call(target, {
      ...options,
      parentWindowId: windowIdFor(parentWindow),
      parentWebContentsId: webContentsIdFor(parentWindow),
      parentNativeHandle
    });
    const id = typeof asRecord2(value)?.id === "string" ? String(asRecord2(value)?.id) : (0, import_node_crypto.randomUUID)();
    const windowId = typeof asRecord2(value)?.windowId === "number" ? Number(asRecord2(value)?.windowId) : null;
    const instance = {
      key: instanceKey(ctx.id, id),
      tweakId: ctx.id,
      id,
      kind,
      value,
      parentWindowId: windowIdFor(parentWindow),
      windowId,
      disposeBindings: [],
      disposing: false
    };
    this.instances.set(instance.key, instance);
    if (canBindParentWindow(parentWindow)) {
      this.bindInstanceToParent(instance, parentWindow);
      this.syncParentState(instance, parentWindow, "created");
    }
    this.log("info", `created native ${kind} ${ctx.id}:${id}`, {
      moduleId: moduleId ?? "codexpp.native-host",
      factory,
      windowId
    });
    return instance;
  }
  loadNativeHost(required) {
    if (this.nativeHostExports) return this.nativeHostExports;
    if (this.nativeHostLoadError && !required) return null;
    const nativeHostPath = this.options.nativeHostPath;
    if (!nativeHostPath || !(0, import_node_fs8.existsSync)(nativeHostPath)) {
      const error = new Error("Codex++ native host is not installed");
      this.nativeHostLoadError = error;
      if (required) throw error;
      return null;
    }
    try {
      this.nativeHostExports = require(nativeHostPath);
      this.nativeHostLoadError = null;
      this.log("info", "loaded Codex++ native host", { path: nativeHostPath });
      return this.nativeHostExports;
    } catch (error) {
      this.nativeHostLoadError = error instanceof Error ? error : new Error(String(error));
      this.log("error", "failed to load Codex++ native host", this.nativeHostLoadError);
      if (required) throw this.nativeHostLoadError;
      return null;
    }
  }
  readNativeHostCapabilities(host) {
    const getCapabilities = asRecord2(host)?.getCapabilities;
    if (typeof getCapabilities !== "function") return {};
    try {
      const capabilities = getCapabilities.call(host);
      return asRecord2(capabilities) ?? {};
    } catch (error) {
      this.log("warn", "Codex++ native host capability probe failed", error);
      return {};
    }
  }
  async invokeInstance(tweakId, id, method, args) {
    const instance = this.instanceFor(tweakId, id);
    const fn = asRecord2(instance.value)?.[method];
    if (typeof fn === "function") {
      await fn.apply(instance.value, args);
      return;
    }
    if (instance.windowId !== null) {
      const win = import_electron2.BrowserWindow.fromId(instance.windowId);
      if (win && !win.isDestroyed()) {
        if (method === "setBounds") win.setBounds(args[0]);
        else if (method === "show") win.show();
        else if (method === "hide") win.hide();
        else if (method === "setVisible") args[0] ? win.show() : win.hide();
        return;
      }
    }
    throw new Error(`native ${instance.kind} ${tweakId}:${id} does not implement ${method}()`);
  }
  async disposeInstanceById(tweakId, id) {
    const key = instanceKey(tweakId, id);
    const instance = this.instances.get(key);
    if (!instance) return;
    await this.disposeInstance(instance);
    this.instances.delete(key);
  }
  async disposeInstance(instance) {
    if (instance.disposing) return;
    instance.disposing = true;
    for (const dispose of instance.disposeBindings.splice(0)) {
      try {
        dispose();
      } catch {
      }
    }
    await callOptional(instance.value, "dispose", []);
    if (instance.windowId !== null) {
      const win = import_electron2.BrowserWindow.fromId(instance.windowId);
      if (win && !win.isDestroyed()) win.close();
    }
  }
  bindInstanceToParent(instance, parentWindow) {
    const on = (event, listener) => {
      parentWindow.on(event, listener);
      instance.disposeBindings.push(() => parentWindow.off(event, listener));
    };
    const syncBounds = () => this.syncParentState(instance, parentWindow, "bounds");
    const syncFocus = (focused) => this.signalParentState(instance, parentWindow, "focus", { focused });
    const syncVisibility = (visible) => this.signalParentState(instance, parentWindow, "visibility", { visible });
    const disposeWithParent = () => {
      this.log("info", `disposing native ${instance.kind} ${instance.tweakId}:${instance.id}; parent closed`);
      void this.disposeInstanceById(instance.tweakId, instance.id);
    };
    on("move", syncBounds);
    on("resize", syncBounds);
    on("enter-full-screen", syncBounds);
    on("leave-full-screen", syncBounds);
    on("maximize", syncBounds);
    on("unmaximize", syncBounds);
    on("minimize", syncBounds);
    on("restore", syncBounds);
    on("show", () => syncVisibility(true));
    on("hide", () => syncVisibility(false));
    on("focus", () => syncFocus(true));
    on("blur", () => syncFocus(false));
    on("close", disposeWithParent);
    on("closed", disposeWithParent);
  }
  syncParentState(instance, parentWindow, reason) {
    const state = parentWindowState(parentWindow, reason);
    if (!state) return;
    void this.callFirstOptionalInstance(instance, ["syncParent", "parentChanged"], [state]).then((handled) => {
      if (!handled) {
        return this.callFirstOptionalInstance(
          instance,
          ["setParentBounds", "parentBoundsChanged"],
          [state.bounds, state]
        );
      }
      return false;
    }).catch((error) => this.log("warn", `native ${instance.kind} parent sync failed`, error));
  }
  signalParentState(instance, parentWindow, reason, patch) {
    const state = parentWindowState(parentWindow, reason);
    if (!state) return;
    const payload = { ...state, ...patch };
    void this.callFirstOptionalInstance(instance, ["parentStateChanged", "parentChanged"], [payload]).catch((error) => this.log("warn", `native ${instance.kind} parent signal failed`, error));
  }
  async callFirstOptionalInstance(instance, methods, args) {
    const target = asRecord2(instance.value);
    for (const method of methods) {
      const fn = target?.[method];
      if (typeof fn !== "function") continue;
      await fn.apply(instance.value, args);
      return true;
    }
    return false;
  }
  async sendHelper(tweakId, id, message) {
    const helper = this.helperFor(tweakId, id);
    helper.child.stdin.write(`${JSON.stringify(message)}
`);
  }
  async requestHelper(tweakId, id, message, timeoutMs = 1e4) {
    const helper = this.helperFor(tweakId, id);
    const requestId = (0, import_node_crypto.randomUUID)();
    const payload = { id: requestId, message };
    return await new Promise((resolve6, reject) => {
      const timer = setTimeout(() => {
        helper.pending.delete(requestId);
        reject(new Error(`native helper request timed out: ${tweakId}:${id}`));
      }, timeoutMs);
      helper.pending.set(requestId, { resolve: resolve6, reject, timer });
      helper.child.stdin.write(`${JSON.stringify(payload)}
`);
    });
  }
  async stopHelperById(tweakId, id) {
    const key = helperKey(tweakId, id);
    const helper = this.helpers.get(key);
    if (!helper) return;
    this.stopHelper(helper);
    this.helpers.delete(key);
  }
  stopHelper(helper) {
    if (helper.child.killed) return;
    helper.child.kill();
    const timer = setTimeout(() => {
      if (!helper.child.killed) helper.child.kill("SIGKILL");
    }, 1500);
    timer.unref?.();
  }
  handleHelperLine(helper, line) {
    let payload;
    try {
      payload = JSON.parse(line);
    } catch {
      this.log("info", `native helper ${helper.tweakId}:${helper.id}`, line);
      return;
    }
    if (typeof payload.id !== "string") return;
    const request = helper.pending.get(payload.id);
    if (!request) return;
    helper.pending.delete(payload.id);
    clearTimeout(request.timer);
    if (payload.error) {
      request.reject(new Error(String(payload.error)));
    } else {
      request.resolve(payload.result);
    }
  }
  moduleFor(tweakId, id) {
    const mod = this.modules.get(moduleKey(tweakId, id));
    if (!mod) throw new Error(`native module is not loaded: ${tweakId}:${id}`);
    return mod;
  }
  instanceFor(tweakId, id) {
    const instance = this.instances.get(instanceKey(tweakId, id));
    if (!instance) throw new Error(`native instance is not loaded: ${tweakId}:${id}`);
    return instance;
  }
  helperFor(tweakId, id) {
    const helper = this.helpers.get(helperKey(tweakId, id));
    if (!helper) throw new Error(`native helper is not running: ${tweakId}:${id}`);
    return helper;
  }
};
function resolveTweakPath(ctx, path) {
  return resolveNativeTweakPath(ctx.dir, path);
}
function inferModuleKind(path) {
  if (path.endsWith(".node")) return "node-addon";
  if (path.endsWith(".dylib")) return "dylib";
  if (path.endsWith(".framework")) return "framework";
  throw new Error("native module path must end in .node, .dylib, or .framework");
}
function selectEntrypoint(loaded, entrypoint) {
  if (!entrypoint) return asRecord2(loaded)?.default ?? loaded;
  const selected = asRecord2(loaded)?.[entrypoint];
  if (selected === void 0) throw new Error(`native module entrypoint not found: ${entrypoint}`);
  return selected;
}
function assertBridgeId(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`${label} may only contain letters, numbers, dots, underscores, and dashes`);
  }
  return value;
}
function moduleKey(tweakId, moduleId) {
  return `${tweakId}:${moduleId}`;
}
function instanceKey(tweakId, id) {
  return `${tweakId}:${id}`;
}
function helperKey(tweakId, id) {
  return `${tweakId}:${id}`;
}
function asRecord2(value) {
  return value && typeof value === "object" ? value : null;
}
async function callOptional(target, method, args) {
  const fn = asRecord2(target)?.[method];
  if (typeof fn === "function") await fn.apply(target, args);
}
function parentWindowState(parentWindow, reason) {
  if (isWindowDestroyed(parentWindow)) return null;
  const bounds = callWindowMethod(parentWindow, "getBounds");
  const contentBounds = callWindowMethod(parentWindow, "getContentBounds");
  return {
    reason,
    windowId: windowIdFor(parentWindow),
    webContentsId: webContentsIdFor(parentWindow),
    bounds,
    contentBounds,
    visible: callWindowMethod(parentWindow, "isVisible") ?? null,
    focused: callWindowMethod(parentWindow, "isFocused") ?? null,
    minimized: callWindowMethod(parentWindow, "isMinimized") ?? null,
    maximized: callWindowMethod(parentWindow, "isMaximized") ?? null,
    fullscreen: callWindowMethod(parentWindow, "isFullScreen") ?? null
  };
}
function nativeHandleForWindow(parentWindow) {
  if (!parentWindow || isWindowDestroyed(parentWindow)) return null;
  const fn = asRecord2(parentWindow)?.getNativeWindowHandle;
  if (typeof fn !== "function") return null;
  try {
    const handle = fn.call(parentWindow);
    return Buffer.isBuffer(handle) ? handle : null;
  } catch {
    return null;
  }
}
function canBindParentWindow(parentWindow) {
  if (!parentWindow || isWindowDestroyed(parentWindow)) return false;
  return typeof asRecord2(parentWindow)?.on === "function" && typeof asRecord2(parentWindow)?.off === "function";
}
function isWindowDestroyed(parentWindow) {
  const fn = asRecord2(parentWindow)?.isDestroyed;
  if (typeof fn !== "function") return false;
  try {
    return Boolean(fn.call(parentWindow));
  } catch {
    return true;
  }
}
function windowIdFor(parentWindow) {
  const id = asRecord2(parentWindow)?.id;
  return typeof id === "number" ? id : null;
}
function webContentsIdFor(parentWindow) {
  const webContents2 = asRecord2(asRecord2(parentWindow)?.webContents);
  const id = webContents2?.id;
  return typeof id === "number" ? id : null;
}
function callWindowMethod(parentWindow, method) {
  const fn = asRecord2(parentWindow)?.[method];
  if (typeof fn !== "function") return null;
  try {
    return fn.call(parentWindow);
  } catch {
    return null;
  }
}

// src/tweak-store.ts
var DEFAULT_TWEAK_STORE_INDEX_URL = "https://kpkhxlgy0.github.io/codex-plusplus/store/index.json";
var GITHUB_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
var FULL_SHA_RE = /^[a-f0-9]{40}$/i;
function normalizeGitHubRepo(input) {
  const raw = input.trim();
  if (!raw) throw new Error("GitHub repo is required");
  const ssh = /^git@github\.com:([^/]+\/[^/]+?)(?:\.git)?$/i.exec(raw);
  if (ssh) return normalizeRepoPart(ssh[1]);
  if (/^https?:\/\//i.test(raw)) {
    const url = new URL(raw);
    if (url.hostname !== "github.com") throw new Error("Only github.com repositories are supported");
    const parts = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (parts.length < 2) throw new Error("GitHub repo URL must include owner and repository");
    return normalizeRepoPart(`${parts[0]}/${parts[1]}`);
  }
  return normalizeRepoPart(raw);
}
function normalizeStoreRegistry(input) {
  const registry = input;
  if (!registry || registry.schemaVersion !== 1 || !Array.isArray(registry.entries)) {
    throw new Error("Unsupported tweak store registry");
  }
  const entries = registry.entries.map(normalizeStoreEntry);
  entries.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  return {
    schemaVersion: 1,
    generatedAt: typeof registry.generatedAt === "string" ? registry.generatedAt : void 0,
    entries
  };
}
function shuffleStoreEntries(entries, randomIndex = (exclusiveMax) => Math.floor(Math.random() * exclusiveMax)) {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    if (!Number.isInteger(j) || j < 0 || j > i) {
      throw new Error(`shuffle randomIndex returned ${j}; expected an integer from 0 to ${i}`);
    }
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function normalizeStoreEntry(input) {
  const entry = input;
  if (!entry || typeof entry !== "object") throw new Error("Invalid tweak store entry");
  const repo = normalizeGitHubRepo(String(entry.repo ?? entry.manifest?.githubRepo ?? ""));
  const manifest = entry.manifest;
  if (!manifest?.id || !manifest.name || !manifest.version) {
    throw new Error(`Store entry for ${repo} is missing manifest fields`);
  }
  if (normalizeGitHubRepo(manifest.githubRepo) !== repo) {
    throw new Error(`Store entry ${manifest.id} repo does not match manifest githubRepo`);
  }
  if (!isFullCommitSha(String(entry.approvedCommitSha ?? ""))) {
    throw new Error(`Store entry ${manifest.id} must pin a full approved commit SHA`);
  }
  return {
    id: manifest.id,
    manifest,
    repo,
    approvedCommitSha: String(entry.approvedCommitSha),
    approvedAt: typeof entry.approvedAt === "string" ? entry.approvedAt : "",
    approvedBy: typeof entry.approvedBy === "string" ? entry.approvedBy : "",
    platforms: normalizeStorePlatforms(entry.platforms),
    releaseUrl: optionalGithubUrl(entry.releaseUrl),
    reviewUrl: optionalGithubUrl(entry.reviewUrl)
  };
}
function storeArchiveUrl(entry) {
  if (!isFullCommitSha(entry.approvedCommitSha)) {
    throw new Error(`Store entry ${entry.id} is not pinned to a full commit SHA`);
  }
  return `https://codeload.github.com/${entry.repo}/tar.gz/${entry.approvedCommitSha}`;
}
function isFullCommitSha(value) {
  return FULL_SHA_RE.test(value);
}
function normalizeRepoPart(value) {
  const repo = value.trim().replace(/\.git$/i, "").replace(/^\/+|\/+$/g, "");
  if (!GITHUB_REPO_RE.test(repo)) throw new Error("GitHub repo must be in owner/repo form");
  return repo;
}
function normalizeStorePlatforms(input) {
  if (input === void 0) return void 0;
  if (!Array.isArray(input)) throw new Error("Store entry platforms must be an array");
  const allowed = /* @__PURE__ */ new Set(["darwin", "win32", "linux"]);
  const platforms = Array.from(new Set(input.map((value) => {
    if (typeof value !== "string" || !allowed.has(value)) {
      throw new Error(`Unsupported store platform: ${String(value)}`);
    }
    return value;
  })));
  return platforms.length > 0 ? platforms : void 0;
}
function optionalGithubUrl(value) {
  if (typeof value !== "string" || !value.trim()) return void 0;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "github.com") return void 0;
  return url.toString();
}

// src/browser-ui.ts
var import_electron3 = require("electron");
var import_node_crypto2 = require("node:crypto");
var import_node_fs9 = require("node:fs");
var import_node_http = require("node:http");
var import_node_path8 = require("node:path");
var CONNECT_PORT_CHANNEL = "codexpp:browser-ui-connect-app-host";
var BRIDGE_REQUEST_CHANNEL = "codexpp:browser-ui-bridge-request";
var BRIDGE_RESPONSE_CHANNEL = "codexpp:browser-ui-bridge-response";
var MESSAGE_FOR_VIEW_CHANNEL = "codexpp:browser-ui-message-for-view";
var WORKER_MESSAGE_CHANNEL = "codexpp:browser-ui-worker-message";
var SYSTEM_THEME_CHANNEL = "codexpp:browser-ui-system-theme";
var MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};
var activeServer = null;
var activeHost = null;
var activeOptions = null;
var bridgeRequests = /* @__PURE__ */ new Map();
var controlClients = /* @__PURE__ */ new Set();
function maybeStartBrowserUiServer(opts) {
  if (process.env.CODEXPP_BROWSER_UI !== "1") return;
  const port = parsePort(process.env.CODEXPP_BROWSER_UI_PORT, 8765);
  startBrowserUiServer({
    ...opts,
    port,
    host: "127.0.0.1",
    hideMainWindow: process.env.CODEXPP_BROWSER_UI_HIDE_MAIN === "1"
  });
}
function startBrowserUiServer(opts) {
  if (activeServer) return;
  activeOptions = opts;
  installBrowserUiIpcHandlers(opts.log);
  const server = (0, import_node_http.createServer)((req, res) => {
    handleHttpRequest(req, res).catch((error) => {
      opts.log("error", "browser UI request failed", { message: error.message });
      sendText(res, 500, "Internal Server Error\n", "text/plain; charset=utf-8");
    });
  });
  server.on("upgrade", (req, socket, head) => {
    handleUpgrade(req, socket, head).catch((error) => {
      opts.log("warn", "browser UI websocket upgrade failed", { message: error.message });
      socket.destroy();
    });
  });
  server.on("error", (error) => {
    opts.log("error", "browser UI server failed", { message: error.message });
  });
  server.listen(opts.port, opts.host, () => {
    opts.log("info", `browser UI server listening at http://${opts.host}:${opts.port}/`);
  });
  activeServer = server;
  if (opts.hideMainWindow) {
    for (const delayMs of [500, 1500, 3e3]) {
      const timer = setTimeout(hideVisibleCodexWindows, delayMs);
      timer.unref?.();
    }
  }
}
function installBrowserUiIpcHandlers(log2) {
  import_electron3.ipcMain.removeAllListeners(BRIDGE_RESPONSE_CHANNEL);
  import_electron3.ipcMain.removeAllListeners(MESSAGE_FOR_VIEW_CHANNEL);
  import_electron3.ipcMain.removeAllListeners(WORKER_MESSAGE_CHANNEL);
  import_electron3.ipcMain.removeAllListeners(SYSTEM_THEME_CHANNEL);
  import_electron3.ipcMain.on(BRIDGE_RESPONSE_CHANNEL, (event, payload) => {
    if (!isBrowserUiHostSender(event.sender)) return;
    const response = asRecord3(payload);
    const id = typeof response?.id === "string" ? response.id : "";
    const pending = bridgeRequests.get(id);
    if (!pending) return;
    bridgeRequests.delete(id);
    clearTimeout(pending.timer);
    if (response?.ok === true) {
      pending.resolve(response.value);
    } else {
      pending.reject(new Error(typeof response?.error === "string" ? response.error : "Bridge request failed"));
    }
  });
  import_electron3.ipcMain.on(MESSAGE_FOR_VIEW_CHANNEL, (event, message) => {
    if (!isBrowserUiHostSender(event.sender)) return;
    broadcastControl({ type: "message-for-view", message });
  });
  import_electron3.ipcMain.on(WORKER_MESSAGE_CHANNEL, (event, workerId, message) => {
    if (!isBrowserUiHostSender(event.sender)) return;
    if (typeof workerId !== "string") return;
    broadcastControl({ type: "worker-message", workerId, message });
  });
  import_electron3.ipcMain.on(SYSTEM_THEME_CHANNEL, (event, value) => {
    if (!isBrowserUiHostSender(event.sender)) return;
    broadcastControl({ type: "system-theme-variant-updated", value });
  });
  process.once("exit", () => {
    for (const pending of bridgeRequests.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Codex++ browser UI server stopped"));
    }
    bridgeRequests.clear();
    for (const client of controlClients) client.close();
    controlClients.clear();
    try {
      if (activeHost && !activeHost.webContents.isDestroyed()) {
        activeHost.webContents.close({ waitForBeforeUnload: false });
      }
    } catch (error) {
      log2("warn", "browser UI host cleanup failed", { message: String(error) });
    }
  });
}
async function handleHttpRequest(req, res) {
  const options = requireOptions();
  const url = requestUrl(req);
  if (!url) {
    sendText(res, 400, "Bad Request\n", "text/plain; charset=utf-8");
    return;
  }
  if (url.pathname === "/codexpp/browser-ui/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (url.pathname === "/codexpp/browser-ui/bridge") {
    if (req.method !== "POST") {
      sendText(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8");
      return;
    }
    const body = asRecord3(await readJsonBody(req));
    const method = typeof body?.method === "string" ? body.method : "";
    const args = Array.isArray(body?.args) ? body.args : [];
    try {
      const value = await callHiddenBridge(method, args);
      sendJson(res, 200, { ok: true, value });
    } catch (error) {
      sendJson(res, 500, {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return;
  }
  if (url.pathname === "/codexpp/browser-ui/bridge.js") {
    if (req.method !== "GET" && req.method !== "HEAD") {
      sendText(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8");
      return;
    }
    const script = browserBridgeScript(await collectInitialState(options));
    sendBuffer(res, 200, Buffer.from(script), MIME_TYPES[".js"], req.method === "HEAD");
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendText(res, 405, "Method Not Allowed\n", "text/plain; charset=utf-8");
    return;
  }
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = await browserIndexHtml();
    sendBuffer(res, 200, Buffer.from(html), MIME_TYPES[".html"], req.method === "HEAD");
    return;
  }
  const file = webviewFile(url.pathname);
  if (!file) {
    sendText(res, 404, "Not Found\n", "text/plain; charset=utf-8");
    return;
  }
  const content = (0, import_node_fs9.readFileSync)(file);
  sendBuffer(res, 200, content, mimeType(file), req.method === "HEAD");
}
async function handleUpgrade(req, socket, head) {
  const url = requestUrl(req);
  if (!url) throw new Error("bad websocket URL");
  if (url.pathname !== "/codexpp/browser-ui/rpc" && url.pathname !== "/codexpp/browser-ui/control") {
    socket.destroy();
    return;
  }
  const ws = acceptWebSocket(req, socket, head);
  if (url.pathname === "/codexpp/browser-ui/control") {
    controlClients.add(ws);
    ws.onClose(() => controlClients.delete(ws));
    ws.sendJson({ type: "hello" });
    return;
  }
  const host = await ensureBrowserUiHost();
  const { port1, port2 } = new import_electron3.MessageChannelMain();
  host.webContents.postMessage(CONNECT_PORT_CHANNEL, {}, [port2]);
  bridgeMessagePortToWebSocket(port1, ws);
}
async function browserIndexHtml() {
  const indexPath = (0, import_node_path8.join)(webviewRoot(), "index.html");
  let html = relaxBrowserUiCsp((0, import_node_fs9.readFileSync)(indexPath, "utf8"));
  const shim = `<script src="/codexpp/browser-ui/bridge.js"></script>`;
  if (html.includes("</head>")) {
    html = html.replace("</head>", `${shim}
  </head>`);
  } else {
    html = `${shim}
${html}`;
  }
  return html;
}
function relaxBrowserUiCsp(html) {
  return html.replace(
    /(<meta\s+http-equiv=["']Content-Security-Policy["']\s+content=")([^"]*)(")/,
    (_match, prefix, content, suffix) => {
      const directives = parseCspDirectives(decodeHtmlAttribute(content));
      directives.set("child-src", "'self' blob: data: http: https:");
      directives.set("frame-src", "'self' blob: data: http: https:");
      directives.set("connect-src", "'self' http: https: ws: wss: sentry-ipc:");
      return `${prefix}${encodeHtmlAttribute(formatCspDirectives(directives))}${suffix}`;
    }
  );
}
function parseCspDirectives(content) {
  const directives = /* @__PURE__ */ new Map();
  for (const part of content.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [name, ...rest] = trimmed.split(/\s+/);
    if (!name) continue;
    directives.set(name, rest.join(" "));
  }
  return directives;
}
function formatCspDirectives(directives) {
  return [...directives.entries()].map(([name, value]) => value ? `${name} ${value}` : name).join("; ");
}
function decodeHtmlAttribute(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function encodeHtmlAttribute(value) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
async function collectInitialState(options) {
  await ensureBrowserUiHost();
  const [snapshot, systemThemeVariant, sentryInitOptions, buildFlavor, usesOwlAppShell] = await Promise.all([
    callHiddenBridge("snapshot", []),
    callHiddenBridge("systemTheme", []),
    callHiddenBridge("sentryOptions", []),
    callHiddenBridge("buildFlavor", []),
    callHiddenBridge("usesOwlAppShell", [])
  ]);
  if (options.hideMainWindow) hideVisibleCodexWindows();
  return {
    snapshot: asPlainObject(snapshot),
    systemThemeVariant: typeof systemThemeVariant === "string" ? systemThemeVariant : currentSystemThemeVariant(),
    sentryInitOptions,
    buildFlavor,
    usesOwlAppShell: usesOwlAppShell === true,
    platform: process.platform,
    arch: process.arch
  };
}
async function ensureBrowserUiHost() {
  if (activeHost && !activeHost.webContents.isDestroyed()) return activeHost;
  const options = requireOptions();
  const services = await waitForWindowServices(options);
  const windowManager = services.windowManager;
  if (!windowManager?.registerWindow) {
    throw new Error("Codex window registration services are unavailable");
  }
  const view = new import_electron3.BrowserView({
    webPreferences: {
      preload: windowManager.options?.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: windowManager.options?.allowDevtools
    }
  });
  const windowLike = makeWindowLikeForView(view);
  windowManager.registerWindow(windowLike, "local", false, "secondary");
  const context = services.getContextForWebContents?.(view.webContents) ?? services.getContext?.("local");
  context?.registerWindow?.(windowLike);
  await view.webContents.loadURL("about:blank");
  activeHost = { view, webContents: view.webContents };
  view.webContents.once("destroyed", () => {
    if (activeHost?.webContents === view.webContents) activeHost = null;
  });
  options.log("info", "browser UI hidden host ready", { webContentsId: view.webContents.id });
  return activeHost;
}
async function waitForWindowServices(options) {
  const started = Date.now();
  while (Date.now() - started < 3e4) {
    const services = options.getWindowServices();
    if (services?.windowManager?.registerWindow && (services.getContext || services.getContextForWebContents)) {
      return services;
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Codex window services");
}
function callHiddenBridge(method, args) {
  assertBridgeMethod(method);
  return ensureBrowserUiHost().then((host) => {
    const id = (0, import_node_crypto2.randomUUID)();
    return new Promise((resolve6, reject) => {
      const timer = setTimeout(() => {
        bridgeRequests.delete(id);
        reject(new Error(`Timed out waiting for browser UI bridge method: ${method}`));
      }, 15e3);
      bridgeRequests.set(id, { resolve: resolve6, reject, timer });
      host.webContents.send(BRIDGE_REQUEST_CHANNEL, { id, method, args });
    });
  });
}
function bridgeMessagePortToWebSocket(port, ws) {
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    try {
      port.postMessage(null);
    } catch {
    }
    try {
      port.close();
    } catch {
    }
    ws.close();
  };
  port.start();
  port.on("message", (event) => {
    if (closed) return;
    if (event.data == null) {
      close();
      return;
    }
    if (typeof event.data === "string") {
      ws.sendText(event.data);
    }
  });
  port.on("close", close);
  ws.onText((text) => {
    if (closed) return;
    port.postMessage(text);
  });
  ws.onClose(close);
}
function broadcastControl(payload) {
  for (const client of [...controlClients]) {
    try {
      client.sendJson(payload);
    } catch {
      client.close();
      controlClients.delete(client);
    }
  }
}
function browserBridgeScript(state) {
  return `
(() => {
  const initialState = ${safeJson(state)};
  const snapshot = new Map(Object.entries(initialState.snapshot || {}));
  const workerSubscribers = new Map();
  const themeSubscribers = new Set();
  const browserSidebarSnapshots = new Map();
  const browserSidebarSeededLocalServers = new Set();
  let systemThemeVariant = initialState.systemThemeVariant || "light";

  window.__codexppBrowserUi = true;
  installBrowserUiWebviewShim();

  const control = new WebSocket(new URL("/codexpp/browser-ui/control", location.href));
  control.addEventListener("message", (event) => {
    let payload;
    try { payload = JSON.parse(event.data); } catch { return; }
    if (payload.type === "message-for-view") {
      const message = payload.message;
      if (message && message.type === "shared-object-updated") {
        if (message.value === undefined) snapshot.delete(message.key);
        else snapshot.set(message.key, message.value);
      }
      rememberBrowserSidebarHostMessage(message);
      window.dispatchEvent(new MessageEvent("message", { data: message }));
    } else if (payload.type === "worker-message") {
      const subs = workerSubscribers.get(payload.workerId);
      if (subs) for (const fn of [...subs]) fn(payload.message);
    } else if (payload.type === "system-theme-variant-updated") {
      systemThemeVariant = payload.value;
      for (const fn of [...themeSubscribers]) fn();
    }
  });

  async function bridge(method, args = []) {
    const res = await fetch("/codexpp/browser-ui/bridge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, args }),
    });
    const body = await res.json();
    if (!body.ok) throw new Error(body.error || "Codex++ browser bridge failed");
    return body.value;
  }

  function legacyBrowserTabId(conversationId) {
    return String(conversationId || "new-conversation") + ":legacy";
  }

  function browserSidebarKey(conversationId, browserTabId) {
    return String(conversationId || "new-conversation") + "::" + String(browserTabId || legacyBrowserTabId(conversationId));
  }

  function normalizeBrowserUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw).href;
    } catch {}
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return raw;
    try {
      return new URL("https://" + raw).href;
    } catch {
      return raw;
    }
  }

  function browserTitleForUrl(url) {
    if (!url) return "New tab";
    try {
      const host = new URL(url).hostname.replace(/^www\\./, "");
      return host || url;
    } catch {
      return url;
    }
  }

  function makeBrowserSidebarSnapshot(url, patch = {}) {
    const normalized = normalizeBrowserUrl(url);
    return {
      tabType: normalized ? "web" : "new-tab-page",
      isSuspended: false,
      title: normalized ? browserTitleForUrl(normalized) : "New tab",
      url: normalized,
      faviconUrl: null,
      isLoading: false,
      canGoBack: false,
      canGoForward: false,
      zoomPercent: 100,
      commentModeDisabledReason: null,
      interactionMode: "browse",
      annotationEditorMode: "comment",
      isAnnotationAddModifierPressed: false,
      isOriginalViewEnabled: false,
      isTweaksEditorOpen: false,
      comments: [],
      ...patch,
    };
  }

  function dispatchBrowserSidebarMessage(message) {
    window.dispatchEvent(new MessageEvent("message", { data: message }));
  }

  function seedBrowserSidebarLocalServers(conversationId) {
    if (!conversationId || browserSidebarSeededLocalServers.has(conversationId)) return;
    browserSidebarSeededLocalServers.add(conversationId);
    queueMicrotask(() => {
      dispatchBrowserSidebarMessage({
        type: "browser-sidebar-local-servers",
        conversationId,
        state: { isLoading: false, servers: [], hiddenServers: [] },
      });
    });
  }

  function rememberBrowserSidebarHostMessage(message) {
    if (!message || typeof message !== "object") return;
    if (message.type === "browser-sidebar-state") {
      const conversationId = message.conversationId;
      if (!conversationId || !message.snapshot) return;
      browserSidebarSnapshots.set(browserSidebarKey(conversationId, message.browserTabId), message.snapshot);
    } else if (message.type === "browser-sidebar-local-servers") {
      if (message.conversationId) browserSidebarSeededLocalServers.add(message.conversationId);
    }
  }

  function sendBrowserSidebarSnapshot(conversationId, browserTabId, snapshotPatch) {
    if (!conversationId) return;
    const key = browserSidebarKey(conversationId, browserTabId);
    const previous = browserSidebarSnapshots.get(key) || makeBrowserSidebarSnapshot("");
    const next = { ...previous, ...snapshotPatch };
    browserSidebarSnapshots.set(key, next);
    dispatchBrowserSidebarMessage({
      type: "browser-sidebar-state",
      conversationId,
      ...(browserTabId ? { browserTabId } : {}),
      snapshot: next,
    });
  }

  function setBrowserSidebarUrl(conversationId, browserTabId, url, isLoading = false) {
    const normalized = normalizeBrowserUrl(url);
    sendBrowserSidebarSnapshot(conversationId, browserTabId, makeBrowserSidebarSnapshot(normalized, { isLoading }));
  }

  function findBrowserSidebarFrame(conversationId, browserTabId) {
    const selector = "[data-browser-sidebar-conversation-id='" + cssEscape(conversationId) + "'][data-browser-sidebar-browser-tab-id='" + cssEscape(browserTabId || legacyBrowserTabId(conversationId)) + "']";
    return document.querySelector(selector);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(value));
    return String(value).replace(/['\\\\]/g, "\\\\$&");
  }

  function handleBrowserSidebarViewMessage(message) {
    if (!message || typeof message !== "object") return;
    if (message.type === "browser-sidebar-sync") {
      const payload = message.payload || {};
      seedBrowserSidebarLocalServers(payload.conversationId);
      return;
    }
    if (message.type === "browser-sidebar-owner-sync") {
      seedBrowserSidebarLocalServers(message.conversationId);
      return;
    }
    if (message.type !== "browser-sidebar-command") return;

    const conversationId = message.conversationId;
    const browserTabId = message.browserTabId;
    const command = message.command || {};
    seedBrowserSidebarLocalServers(conversationId);

    if (command.type === "navigate") {
      const normalized = normalizeBrowserUrl(command.url);
      setBrowserSidebarUrl(conversationId, browserTabId, normalized, true);
      queueMicrotask(() => {
        const frame = findBrowserSidebarFrame(conversationId, browserTabId);
        if (!frame || !normalized || frame.getURL?.() === normalized) return;
        frame.loadURL?.(normalized);
      });
      window.setTimeout(() => setBrowserSidebarUrl(conversationId, browserTabId, normalized, false), 500);
    } else if (command.type === "reload") {
      const frame = findBrowserSidebarFrame(conversationId, browserTabId);
      frame?.reload?.();
      const current = browserSidebarSnapshots.get(browserSidebarKey(conversationId, browserTabId));
      if (current?.url) {
        sendBrowserSidebarSnapshot(conversationId, browserTabId, { ...current, isLoading: true });
        window.setTimeout(() => sendBrowserSidebarSnapshot(conversationId, browserTabId, { ...current, isLoading: false }), 250);
      }
    } else if (command.type === "go-back") {
      findBrowserSidebarFrame(conversationId, browserTabId)?.goBack?.();
    } else if (command.type === "go-forward") {
      findBrowserSidebarFrame(conversationId, browserTabId)?.goForward?.();
    } else if (command.type === "stop") {
      const current = browserSidebarSnapshots.get(browserSidebarKey(conversationId, browserTabId));
      if (current) sendBrowserSidebarSnapshot(conversationId, browserTabId, { ...current, isLoading: false });
    } else if (command.type === "reset" || command.type === "close-tab") {
      sendBrowserSidebarSnapshot(conversationId, browserTabId, makeBrowserSidebarSnapshot(""));
    }
  }

  window.codexWindowType = "electron";
  window.electronBridge = {
    windowType: "electron",
    sendMessageFromView: (message) => {
      if (message && message.type === "shared-object-set") snapshot.set(message.key, message.value);
      handleBrowserSidebarViewMessage(message);
      return bridge("sendMessageFromView", [message]);
    },
    getPathForFile: () => null,
    sendWorkerMessageFromView: (workerId, message) => bridge("sendWorkerMessageFromView", [workerId, message]),
    subscribeToWorkerMessages: (workerId, handler) => {
      let subs = workerSubscribers.get(workerId);
      if (!subs) {
        subs = new Set();
        workerSubscribers.set(workerId, subs);
        bridge("subscribeWorkerMessages", [workerId]).catch(console.error);
      }
      subs.add(handler);
      return () => {
        const current = workerSubscribers.get(workerId);
        if (!current) return;
        current.delete(handler);
        if (current.size === 0) {
          workerSubscribers.delete(workerId);
          bridge("unsubscribeWorkerMessages", [workerId]).catch(console.error);
        }
      };
    },
    showContextMenu: (items) => bridge("showContextMenu", [items]),
    showApplicationMenu: (menuId, x, y) => bridge("showApplicationMenu", [menuId, x, y]),
    getFastModeRolloutMetrics: (params) => bridge("getFastModeRolloutMetrics", [params]),
    getSharedObjectSnapshotValue: (key) => snapshot.get(key),
    getSystemThemeVariant: () => systemThemeVariant,
    subscribeToSystemThemeVariant: (handler) => {
      themeSubscribers.add(handler);
      return () => themeSubscribers.delete(handler);
    },
    triggerSentryTestError: () => bridge("triggerSentryTestError", []),
    getSentryInitOptions: () => null,
    getAppSessionId: () => null,
    getBuildFlavor: () => initialState.buildFlavor,
    isIntelMacBuild: () => initialState.platform === "darwin" && initialState.arch === "x64",
    usesOwlAppShell: () => initialState.usesOwlAppShell,
  };

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data || event.data.type !== "connect-app-host") return;
    const port = event.data.port;
    if (!port) return;
    const ws = new WebSocket(new URL("/codexpp/browser-ui/rpc", location.href));
    ws.addEventListener("message", (message) => port.postMessage(message.data));
    ws.addEventListener("close", () => {
      try { port.postMessage(null); } catch {}
      try { port.close(); } catch {}
    });
    ws.addEventListener("open", () => {
      port.onmessage = (message) => {
        if (message.data == null) {
          ws.close();
          return;
        }
        ws.send(message.data);
      };
      port.start && port.start();
    });
  });

  function installBrowserUiWebviewShim() {
    if (window.__codexppWebviewShimInstalled) return;
    window.__codexppWebviewShimInstalled = true;
    const originalCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function(tagName, options) {
      if (String(tagName).toLowerCase() !== "webview") {
        return originalCreateElement.call(this, tagName, options);
      }
      return createWebviewIframe(this);
    };

    function createWebviewIframe(doc) {
      const iframe = originalCreateElement.call(doc, "iframe");
      iframe.dataset.codexppWebviewShim = "true";
      iframe.style.border = "0";
      iframe.style.display = "block";
      iframe.style.backgroundColor = "#fff";
      iframe.setAttribute("allow", "autoplay; clipboard-read; clipboard-write; display-capture; fullscreen; microphone; camera");
      const nativeSetAttribute = iframe.setAttribute.bind(iframe);
      const nativeGetAttribute = iframe.getAttribute.bind(iframe);

      try {
        Object.defineProperty(iframe, "tagName", { configurable: true, get: () => "WEBVIEW" });
        Object.defineProperty(iframe, "nodeName", { configurable: true, get: () => "WEBVIEW" });
      } catch {}

      const emit = (type, extra = {}) => {
        const event = new Event(type);
        Object.assign(event, extra);
        iframe.dispatchEvent(event);
      };
      const currentUrl = () => iframe.dataset.codexppRequestedSrc || nativeGetAttribute("src") || "about:blank";
      const actualFrameUrl = (url) => {
        const requested = String(url || "about:blank");
        if (!shouldBreakRecursiveFrameLoad(requested)) return requested;
        try {
          const next = new URL(requested, location.href);
          next.searchParams.set("__codexpp_frame_depth", String(frameAncestorDepth() + 1));
          return next.href;
        } catch {
          return requested;
        }
      };
      const setFrameUrl = (url) => {
        const requested = String(url || "about:blank");
        iframe.dataset.codexppRequestedSrc = requested;
        nativeSetAttribute("src", actualFrameUrl(requested));
      };
      const navigate = (url) => {
        const next = String(url || "about:blank");
        emit("did-start-loading", { url: next });
        setFrameUrl(next);
      };

      iframe.setAttribute = (name, value) => {
        if (String(name).toLowerCase() === "src") {
          setFrameUrl(value);
          return;
        }
        nativeSetAttribute(name, value);
      };

      try {
        Object.defineProperty(iframe, "src", {
          configurable: true,
          get: () => currentUrl(),
          set: (value) => setFrameUrl(value),
        });
      } catch {}

      iframe.addEventListener("load", () => {
        const url = currentUrl();
        emit("dom-ready", { url });
        emit("did-navigate", { url });
        emit("did-stop-loading", { url });
        emit("did-finish-load", { url });
        let title = "";
        try {
          title = iframe.contentDocument?.title || "";
        } catch {}
        const conversationId = iframe.getAttribute("data-browser-sidebar-conversation-id");
        const browserTabId = iframe.getAttribute("data-browser-sidebar-browser-tab-id");
        if (conversationId) {
          sendBrowserSidebarSnapshot(conversationId, browserTabId, makeBrowserSidebarSnapshot(url, {
            title: title || browserTitleForUrl(url),
            isLoading: false,
          }));
        }
        if (title) emit("page-title-updated", { title });
      });
      iframe.addEventListener("error", () => {
        emit("did-fail-load", { errorCode: -2, errorDescription: "iframe load failed", validatedURL: currentUrl() });
        emit("did-stop-loading", { url: currentUrl() });
      });

      Object.defineProperties(iframe, {
        destroy: { value: () => iframe.remove() },
        getURL: { value: () => currentUrl() },
        getTitle: {
          value: () => {
            try {
              return iframe.contentDocument?.title || "";
            } catch {
              return "";
            }
          },
        },
        loadURL: { value: (url) => { navigate(url); return Promise.resolve(); } },
        reload: {
          value: () => {
            try {
              iframe.contentWindow?.location.reload();
            } catch {
              navigate(currentUrl());
            }
          },
        },
        stop: { value: () => {} },
        canGoBack: { value: () => false },
        canGoForward: { value: () => false },
        goBack: {
          value: () => {
            try {
              iframe.contentWindow?.history.back();
            } catch {}
          },
        },
        goForward: {
          value: () => {
            try {
              iframe.contentWindow?.history.forward();
            } catch {}
          },
        },
        executeJavaScript: {
          value: (code) => {
            try {
              return Promise.resolve(iframe.contentWindow?.eval(String(code)));
            } catch (error) {
              return Promise.reject(error);
            }
          },
        },
        insertCSS: { value: () => Promise.resolve("") },
        openDevTools: { value: () => {} },
        closeDevTools: { value: () => {} },
        isDevToolsOpened: { value: () => false },
        send: { value: () => {} },
      });

      return iframe;
    }

    function frameAncestorDepth() {
      let depth = 0;
      let current = window;
      const seen = new Set();
      while (current && !seen.has(current)) {
        seen.add(current);
        let parent;
        try {
          parent = current.parent;
        } catch {
          break;
        }
        if (parent === current) break;
        depth += 1;
        current = parent;
      }
      return depth;
    }

    function shouldBreakRecursiveFrameLoad(url) {
      let target;
      try {
        target = new URL(url, location.href).href;
      } catch {
        return false;
      }
      let current = window;
      const seen = new Set();
      while (current && !seen.has(current)) {
        seen.add(current);
        try {
          if (new URL(current.location.href).href === target) return true;
          if (current.parent === current) break;
          current = current.parent;
        } catch {
          return false;
        }
      }
      return false;
    }
  }
})();
`;
}
function hideVisibleCodexWindows() {
  if (process.platform === "darwin") {
    try {
      import_electron3.app.hide();
    } catch {
    }
  }
  for (const win of import_electron3.BrowserWindow.getAllWindows()) {
    if (win.isDestroyed()) continue;
    if (activeHost && win.webContents.id === activeHost.webContents.id) continue;
    if (!win.isVisible()) continue;
    try {
      win.hide();
    } catch {
    }
  }
}
function makeWindowLikeForView(view) {
  const viewBounds = () => view.getBounds();
  return {
    id: view.webContents.id,
    webContents: view.webContents,
    on: (event, listener) => {
      if (event === "closed") view.webContents.once("destroyed", listener);
      else view.webContents.on(event, listener);
      return view;
    },
    once: (event, listener) => {
      view.webContents.once(event, listener);
      return view;
    },
    off: (event, listener) => {
      view.webContents.off(event, listener);
      return view;
    },
    removeListener: (event, listener) => {
      view.webContents.removeListener(event, listener);
      return view;
    },
    isDestroyed: () => view.webContents.isDestroyed(),
    isFocused: () => view.webContents.isFocused(),
    focus: () => view.webContents.focus(),
    show: () => {
    },
    hide: () => {
    },
    getBounds: viewBounds,
    getContentBounds: viewBounds,
    getSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    getContentSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    setTitle: () => {
    },
    getTitle: () => "",
    setRepresentedFilename: () => {
    },
    setDocumentEdited: () => {
    },
    setWindowButtonVisibility: () => {
    }
  };
}
function acceptWebSocket(req, socket, head) {
  const key = req.headers["sec-websocket-key"];
  if (typeof key !== "string") throw new Error("missing Sec-WebSocket-Key");
  const accept = (0, import_node_crypto2.createHash)("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${accept}`,
      "\r\n"
    ].join("\r\n")
  );
  const ws = new WebSocketConnection(socket);
  if (head.length > 0) ws.acceptHead(head);
  return ws;
}
var WebSocketConnection = class {
  constructor(socket) {
    this.socket = socket;
    socket.on("data", (chunk) => this.acceptHead(chunk));
    socket.on("close", () => this.emitClose());
    socket.on("error", () => this.emitClose());
  }
  socket;
  buffer = Buffer.alloc(0);
  textHandlers = /* @__PURE__ */ new Set();
  closeHandlers = /* @__PURE__ */ new Set();
  closed = false;
  acceptHead(chunk) {
    if (this.closed) return;
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.readFrames();
  }
  onText(handler) {
    this.textHandlers.add(handler);
  }
  onClose(handler) {
    this.closeHandlers.add(handler);
  }
  sendJson(payload) {
    this.sendText(JSON.stringify(payload));
  }
  sendText(text) {
    this.sendFrame(1, Buffer.from(text, "utf8"));
  }
  close() {
    if (this.closed) return;
    try {
      this.sendFrame(8, Buffer.alloc(0));
    } catch {
    }
    this.closed = true;
    this.socket.end();
    this.emitClose();
  }
  readFrames() {
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const opcode = first & 15;
      const masked = (second & 128) !== 0;
      let length = second & 127;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < offset + 2) return;
        length = this.buffer.readUInt16BE(offset);
        offset += 2;
      } else if (length === 127) {
        if (this.buffer.length < offset + 8) return;
        const high = this.buffer.readUInt32BE(offset);
        const low = this.buffer.readUInt32BE(offset + 4);
        if (high !== 0) {
          this.close();
          return;
        }
        length = low;
        offset += 8;
      }
      const maskOffset = offset;
      if (masked) offset += 4;
      if (this.buffer.length < offset + length) return;
      const mask = masked ? this.buffer.subarray(maskOffset, maskOffset + 4) : null;
      const payload = Buffer.from(this.buffer.subarray(offset, offset + length));
      this.buffer = this.buffer.subarray(offset + length);
      if (mask) {
        for (let i = 0; i < payload.length; i += 1) payload[i] ^= mask[i % 4];
      }
      if (opcode === 8) {
        this.close();
      } else if (opcode === 9) {
        this.sendFrame(10, payload);
      } else if (opcode === 1) {
        const text = payload.toString("utf8");
        for (const handler of [...this.textHandlers]) handler(text);
      }
    }
  }
  sendFrame(opcode, payload) {
    if (this.closed && opcode !== 8) return;
    const length = payload.length;
    let header;
    if (length < 126) {
      header = Buffer.from([128 | opcode, length]);
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 128 | opcode;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 128 | opcode;
      header[1] = 127;
      header.writeUInt32BE(0, 2);
      header.writeUInt32BE(length, 6);
    }
    this.socket.write(Buffer.concat([header, payload]));
  }
  emitClose() {
    if (!this.closed) this.closed = true;
    for (const handler of [...this.closeHandlers]) handler();
    this.closeHandlers.clear();
    this.textHandlers.clear();
  }
};
function requestUrl(req) {
  try {
    return new URL(req.url ?? "/", "http://127.0.0.1");
  } catch {
    return null;
  }
}
function readJsonBody(req) {
  return new Promise((resolve6, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > 1024 * 1024) {
        reject(new Error("request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve6(null);
        return;
      }
      try {
        resolve6(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
function sendJson(res, status, body) {
  sendBuffer(res, status, Buffer.from(JSON.stringify(body)), MIME_TYPES[".json"], false);
}
function sendText(res, status, body, contentType) {
  sendBuffer(res, status, Buffer.from(body), contentType, false);
}
function sendBuffer(res, status, body, contentType, headOnly) {
  res.writeHead(status, {
    "content-type": contentType,
    "content-length": body.length,
    "cache-control": "no-store"
  });
  if (headOnly) res.end();
  else res.end(body);
}
function webviewRoot() {
  return (0, import_node_path8.join)(process.resourcesPath, "app.asar", "webview");
}
function webviewFile(pathname) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (!cleanPath || cleanPath.includes("\0")) return null;
  const root = webviewRoot();
  const file = (0, import_node_path8.normalize)((0, import_node_path8.join)(root, cleanPath));
  const rel = (0, import_node_path8.relative)(root, file);
  if (rel.startsWith("..") || rel === "") return null;
  if (!(0, import_node_fs9.existsSync)(file) || !(0, import_node_fs9.statSync)(file).isFile()) return null;
  return file;
}
function mimeType(file) {
  const dot = file.lastIndexOf(".");
  const ext = dot >= 0 ? file.slice(dot).toLowerCase() : "";
  return MIME_TYPES[ext] ?? "application/octet-stream";
}
function requireOptions() {
  if (!activeOptions) throw new Error("Codex++ browser UI server is not configured");
  return activeOptions;
}
function isBrowserUiHostSender(sender) {
  return !!activeHost && !activeHost.webContents.isDestroyed() && sender.id === activeHost.webContents.id;
}
function assertBridgeMethod(method) {
  if (!/^[a-zA-Z0-9._:-]+$/.test(method)) throw new Error("invalid bridge method");
}
function parsePort(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}
function asRecord3(value) {
  return value && typeof value === "object" ? value : null;
}
function asPlainObject(value) {
  const record = asRecord3(value);
  return record && !Array.isArray(record) ? record : {};
}
function currentSystemThemeVariant() {
  return import_electron3.nativeTheme.shouldUseDarkColors ? "dark" : "light";
}
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
function delay(ms) {
  return new Promise((resolve6) => setTimeout(resolve6, ms));
}

// src/version-utils.ts
var VERSION_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;
function normalizeVersion(value) {
  return value.trim().replace(/^v/i, "");
}
function compareVersions(a, b) {
  const av = VERSION_RE.exec(a);
  const bv = VERSION_RE.exec(b);
  if (!av || !bv) return 0;
  for (let i = 1; i <= 3; i++) {
    const diff = Number(av[i]) - Number(bv[i]);
    if (diff !== 0) return diff;
  }
  return 0;
}

// src/tweak-store-compat.ts
function storeEntryPlatformCompatibility(entry, currentPlatform = process.platform) {
  const supported = entry.platforms ?? null;
  const compatible = !supported || supported.includes(currentPlatform);
  return {
    current: currentPlatform,
    supported,
    compatible,
    reason: compatible ? null : `${entry.manifest.name} is only available on ${formatStorePlatforms(supported)}.`
  };
}
function assertStoreEntryPlatformCompatible(entry) {
  const platform2 = storeEntryPlatformCompatibility(entry);
  if (!platform2.compatible) {
    throw new Error(platform2.reason ?? `${entry.manifest.name} is not available on this platform.`);
  }
}
function storeEntryRuntimeCompatibility(entry, currentVersion) {
  const required = cleanMinRuntime(entry.manifest.minRuntime);
  const compatible = !required || compareVersions(currentVersion, required) >= 0;
  return {
    current: currentVersion,
    required,
    compatible,
    reason: compatible || !required ? null : `${entry.manifest.name} requires Codex++ ${required} or newer.`
  };
}
function assertStoreEntryRuntimeCompatible(entry, currentVersion) {
  const runtime = storeEntryRuntimeCompatibility(entry, currentVersion);
  if (!runtime.compatible) {
    throw new Error(runtime.reason ?? `${entry.manifest.name} requires a newer Codex++ runtime.`);
  }
}
function cleanMinRuntime(value) {
  if (typeof value !== "string") return null;
  const version = normalizeVersion(value.replace(/^>=?\s*/, ""));
  return VERSION_RE.test(version) ? version : null;
}
function formatStorePlatforms(platforms) {
  if (!platforms || platforms.length === 0) return "supported platforms";
  return platforms.map((platform2) => {
    if (platform2 === "darwin") return "macOS";
    if (platform2 === "win32") return "Windows";
    return "Linux";
  }).join(", ");
}

// src/main.ts
var userRoot = process.env.CODEX_PLUSPLUS_USER_ROOT;
var runtimeDir = process.env.CODEX_PLUSPLUS_RUNTIME;
if (!userRoot || !runtimeDir) {
  throw new Error(
    "codex-plusplus runtime started without CODEX_PLUSPLUS_USER_ROOT/RUNTIME envs"
  );
}
var PRELOAD_PATH = (0, import_node_path9.resolve)(runtimeDir, "preload.js");
var TWEAKS_DIR = (0, import_node_path9.join)(userRoot, "tweaks");
var LOG_DIR = (0, import_node_path9.join)(userRoot, "log");
var LOG_FILE = (0, import_node_path9.join)(LOG_DIR, "main.log");
var CONFIG_FILE = (0, import_node_path9.join)(userRoot, "config.json");
var CODEX_CONFIG_FILE = (0, import_node_path9.join)(process.env.CODEX_HOME || (0, import_node_path9.join)((0, import_node_os2.homedir)(), ".codex"), "config.toml");
var INSTALLER_STATE_FILE = (0, import_node_path9.join)(userRoot, "state.json");
var UPDATE_MODE_FILE = (0, import_node_path9.join)(userRoot, "update-mode.json");
var SELF_UPDATE_STATE_FILE = (0, import_node_path9.join)(userRoot, "self-update-state.json");
var SIGNED_CODEX_BACKUP = (0, import_node_path9.join)(userRoot, "backup", "Codex.app");
var CODEX_PLUSPLUS_CLI_SHIM = (0, import_node_path9.join)(userRoot, "bin", process.platform === "win32" ? "codexplusplus.cmd" : "codexplusplus");
var POST_UPDATE_REPAIR_LOG_FILE = (0, import_node_path9.join)(LOG_DIR, "post-update-repair.log");
var CODEX_PLUSPLUS_VERSION = "1.0.6";
var CODEX_PLUSPLUS_REPO = "kpkhxlgy0/codex-plusplus";
var TWEAK_STORE_INDEX_URL = process.env.CODEX_PLUSPLUS_STORE_INDEX_URL ?? DEFAULT_TWEAK_STORE_INDEX_URL;
var CODEX_WINDOW_SERVICES_KEY = "__codexpp_window_services__";
var DEBUG_WEB_CONTENTS_LOG = process.env.CODEXPP_DEBUG_WEB_CONTENTS === "1";
var DESKTOP_MESSAGE_FROM_VIEW = "codex_desktop:message-from-view";
var mainMessageFromViewTransformers = /* @__PURE__ */ new Set();
var mainMessageFromViewResponseListeners = /* @__PURE__ */ new Set();
(0, import_node_fs10.mkdirSync)(LOG_DIR, { recursive: true });
(0, import_node_fs10.mkdirSync)(TWEAKS_DIR, { recursive: true });
installMessageFromViewTransformHook();
if (process.env.CODEXPP_REMOTE_DEBUG === "1") {
  const port = process.env.CODEXPP_REMOTE_DEBUG_PORT ?? "9222";
  import_electron4.app.commandLine.appendSwitch("remote-debugging-port", port);
  log("info", `remote debugging enabled on port ${port}`);
}
function readState() {
  try {
    return JSON.parse((0, import_node_fs10.readFileSync)(CONFIG_FILE, "utf8"));
  } catch {
    return {};
  }
}
function writeState(s) {
  try {
    (0, import_node_fs10.writeFileSync)(CONFIG_FILE, JSON.stringify(s, null, 2));
  } catch (e) {
    log("warn", "writeState failed:", String(e.message));
  }
}
function isCodexPlusPlusAutoUpdateEnabled() {
  return readState().codexPlusPlus?.autoUpdate !== false;
}
function setCodexPlusPlusAutoUpdate(enabled) {
  const s = readState();
  s.codexPlusPlus ??= {};
  s.codexPlusPlus.autoUpdate = enabled;
  writeState(s);
}
function setCodexPlusPlusUpdateConfig(config) {
  const s = readState();
  s.codexPlusPlus ??= {};
  if (config.updateChannel) s.codexPlusPlus.updateChannel = config.updateChannel;
  if ("updateRepo" in config) s.codexPlusPlus.updateRepo = cleanOptionalString(config.updateRepo);
  if ("updateRef" in config) s.codexPlusPlus.updateRef = cleanOptionalString(config.updateRef);
  writeState(s);
}
function isCodexPlusPlusSafeModeEnabled() {
  return readState().codexPlusPlus?.safeMode === true;
}
function isTweakEnabled(id) {
  const s = readState();
  if (s.codexPlusPlus?.safeMode === true) return false;
  return s.tweaks?.[id]?.enabled !== false;
}
function setTweakEnabled(id, enabled) {
  const s = readState();
  s.tweaks ??= {};
  s.tweaks[id] = { ...s.tweaks[id], enabled };
  writeState(s);
}
function readInstallerState() {
  try {
    return JSON.parse((0, import_node_fs10.readFileSync)(INSTALLER_STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function readSelfUpdateState() {
  try {
    return JSON.parse((0, import_node_fs10.readFileSync)(SELF_UPDATE_STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function writeSelfUpdateState(state) {
  try {
    (0, import_node_fs10.writeFileSync)(SELF_UPDATE_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    log("warn", "writeSelfUpdateState failed:", String(e.message));
  }
}
function cleanOptionalString(value) {
  if (typeof value !== "string") return void 0;
  const trimmed = value.trim();
  return trimmed ? trimmed : void 0;
}
function isPathInside2(parent, target) {
  const rel = (0, import_node_path9.relative)((0, import_node_path9.resolve)(parent), (0, import_node_path9.resolve)(target));
  return rel === "" || !!rel && !rel.startsWith("..") && !(0, import_node_path9.isAbsolute)(rel);
}
function log(level, ...args) {
  const line = `[${(/* @__PURE__ */ new Date()).toISOString()}] [${level}] ${args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ")}
`;
  try {
    appendCappedLog(LOG_FILE, line);
  } catch {
  }
  if (level === "error") console.error("[codex-plusplus]", ...args);
}
function installSparkleUpdateHook() {
  if (process.platform !== "darwin") return;
  const Module = require("node:module");
  const originalLoad = Module._load;
  if (typeof originalLoad !== "function") return;
  Module._load = function codexPlusPlusModuleLoad(request, parent, isMain) {
    const loaded = originalLoad.apply(this, [request, parent, isMain]);
    if (typeof request === "string" && /sparkle(?:\.node)?$/i.test(request)) {
      wrapSparkleExports(loaded);
    }
    return loaded;
  };
}
function wrapSparkleExports(loaded) {
  if (!loaded || typeof loaded !== "object") return;
  const exports2 = loaded;
  if (exports2.__codexppSparkleWrapped) return;
  exports2.__codexppSparkleWrapped = true;
  for (const name of ["installUpdatesIfAvailable"]) {
    const fn = exports2[name];
    if (typeof fn !== "function") continue;
    exports2[name] = function codexPlusPlusSparkleWrapper(...args) {
      prepareSignedCodexForSparkleInstall();
      return Reflect.apply(fn, this, args);
    };
  }
  if (exports2.default && exports2.default !== exports2) {
    wrapSparkleExports(exports2.default);
  }
}
function prepareSignedCodexForSparkleInstall() {
  if (process.platform !== "darwin") return;
  if ((0, import_node_fs10.existsSync)(UPDATE_MODE_FILE)) {
    log("info", "Sparkle update prep skipped; update mode already active");
    return;
  }
  if (!(0, import_node_fs10.existsSync)(SIGNED_CODEX_BACKUP)) {
    log("warn", "Sparkle update prep skipped; signed Codex.app backup is missing");
    return;
  }
  if (!isDeveloperIdSignedApp(SIGNED_CODEX_BACKUP)) {
    log("warn", "Sparkle update prep skipped; Codex.app backup is not Developer ID signed");
    return;
  }
  const state = readInstallerState();
  const appRoot = state?.appRoot ?? inferMacAppRoot2();
  if (!appRoot) {
    log("warn", "Sparkle update prep skipped; could not infer Codex.app path");
    return;
  }
  const mode = {
    enabledAt: (/* @__PURE__ */ new Date()).toISOString(),
    appRoot,
    codexVersion: state?.codexVersion ?? null
  };
  (0, import_node_fs10.writeFileSync)(UPDATE_MODE_FILE, JSON.stringify(mode, null, 2));
  startPostUpdateRepairMonitor();
  try {
    (0, import_node_child_process3.execFileSync)("ditto", [SIGNED_CODEX_BACKUP, appRoot], { stdio: "ignore" });
    try {
      (0, import_node_child_process3.execFileSync)("xattr", ["-dr", "com.apple.quarantine", appRoot], { stdio: "ignore" });
    } catch {
    }
    log("info", "Restored signed Codex.app before Sparkle install", { appRoot });
  } catch (e) {
    log("error", "Failed to restore signed Codex.app before Sparkle install", {
      message: e.message
    });
  }
}
function startPostUpdateRepairMonitor() {
  if (process.platform !== "darwin") return;
  if (!(0, import_node_fs10.existsSync)(CODEX_PLUSPLUS_CLI_SHIM)) {
    log("warn", "Post-update repair monitor skipped; Codex++ CLI shim is missing", {
      shim: CODEX_PLUSPLUS_CLI_SHIM
    });
    return;
  }
  try {
    const child = (0, import_node_child_process3.spawn)("/bin/sh", ["-c", `${postUpdateRepairScript()} >> ${shellQuote(POST_UPDATE_REPAIR_LOG_FILE)} 2>&1`], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    log("info", "Started Codex++ post-update repair monitor", {
      log: POST_UPDATE_REPAIR_LOG_FILE
    });
  } catch (e) {
    log("warn", "Post-update repair monitor failed to start", {
      message: e.message
    });
  }
}
function postUpdateRepairScript() {
  const repairCommand = [
    "CODEX_PLUSPLUS_WATCHER=1",
    shellQuote(CODEX_PLUSPLUS_CLI_SHIM),
    "repair",
    "--watcher",
    "--quiet",
    "--local"
  ].join(" ");
  const doctorCommand = `${shellQuote(CODEX_PLUSPLUS_CLI_SHIM)} doctor >/dev/null 2>&1`;
  return [
    "set -u",
    `echo "[$(date)] Codex++ post-update repair monitor started"`,
    "sleep 20",
    "deadline=$(( $(date +%s) + 900 ))",
    "while [ $(date +%s) -lt $deadline ]; do",
    `  ${repairCommand} || true`,
    `  if [ ! -f ${shellQuote(UPDATE_MODE_FILE)} ] && ${doctorCommand}; then`,
    `    echo "[$(date)] Codex++ post-update repair completed"`,
    "    exit 0",
    "  fi",
    "  sleep 20",
    "done",
    `echo "[$(date)] Codex++ post-update repair timed out"`,
    "exit 1"
  ].join("\n");
}
function isDeveloperIdSignedApp(appRoot) {
  const result = (0, import_node_child_process3.spawnSync)("codesign", ["-dv", "--verbose=4", appRoot], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return result.status === 0 && /Authority=Developer ID Application:/.test(output) && !/Signature=adhoc/.test(output) && !/TeamIdentifier=not set/.test(output);
}
function inferMacAppRoot2() {
  const marker = ".app/Contents/MacOS/";
  const idx = process.execPath.indexOf(marker);
  return idx >= 0 ? process.execPath.slice(0, idx + ".app".length) : null;
}
process.on("uncaughtException", (e) => {
  log("error", "uncaughtException", { code: e.code, message: e.message, stack: e.stack });
});
process.on("unhandledRejection", (e) => {
  log("error", "unhandledRejection", { value: String(e) });
});
installSparkleUpdateHook();
var tweakState = {
  discovered: [],
  loadedMain: /* @__PURE__ */ new Map()
};
var nativeBridge = new NativeBridge(log, {
  nativeHostPath: (0, import_node_path9.join)(runtimeDir, "native", "codexpp_native_host.node")
});
var owlViews = /* @__PURE__ */ new Map();
var tweakLifecycleDeps = {
  logInfo: (message) => log("info", message),
  setTweakEnabled,
  stopAllMainTweaks,
  clearTweakModuleCache,
  loadAllMainTweaks,
  broadcastReload
};
function registerPreload(s, label) {
  try {
    const reg = s.registerPreloadScript;
    if (typeof reg === "function") {
      reg.call(s, { type: "frame", filePath: PRELOAD_PATH, id: "codex-plusplus" });
      log("info", `preload registered (registerPreloadScript) on ${label}:`, PRELOAD_PATH);
      return;
    }
    const existing = s.getPreloads();
    if (!existing.includes(PRELOAD_PATH)) {
      s.setPreloads([...existing, PRELOAD_PATH]);
    }
    log("info", `preload registered (setPreloads) on ${label}:`, PRELOAD_PATH);
  } catch (e) {
    if (e instanceof Error && e.message.includes("existing ID")) {
      log("info", `preload already registered on ${label}:`, PRELOAD_PATH);
      return;
    }
    log("error", `preload registration on ${label} failed:`, e);
  }
}
import_electron4.app.whenReady().then(() => {
  log("info", "app ready fired");
  if (isCodexPlusPlusSafeModeEnabled()) {
    log("warn", "safe mode is enabled; preload will not be registered");
    return;
  }
  registerPreload(import_electron4.session.defaultSession, "defaultSession");
  maybeStartBrowserUiServer({
    getWindowServices: getCodexWindowServices,
    log
  });
});
import_electron4.app.on("session-created", (s) => {
  if (isCodexPlusPlusSafeModeEnabled()) return;
  registerPreload(s, "session-created");
});
import_electron4.app.on("web-contents-created", (_e, wc) => {
  try {
    if (DEBUG_WEB_CONTENTS_LOG) {
      const wp = wc.getLastWebPreferences?.();
      log("info", "web-contents-created", {
        id: wc.id,
        type: wc.getType(),
        sessionIsDefault: wc.session === import_electron4.session.defaultSession,
        sandbox: wp?.sandbox,
        contextIsolation: wp?.contextIsolation
      });
    }
    wc.on("preload-error", (_ev, p, err) => {
      log("error", `wc ${wc.id} preload-error path=${p}`, String(err?.stack ?? err));
    });
  } catch (e) {
    log("error", "web-contents-created handler failed:", String(e?.stack ?? e));
  }
});
log("info", "main.ts evaluated; app.isReady=" + import_electron4.app.isReady());
if (isCodexPlusPlusSafeModeEnabled()) {
  log("warn", "safe mode is enabled; tweaks will not be loaded");
}
loadAllMainTweaks();
import_electron4.app.on("will-quit", () => {
  stopAllMainTweaks();
  nativeBridge.disposeAll();
  disposeAllOwlViews();
  for (const t of tweakState.loadedMain.values()) {
    try {
      t.storage.flush();
    } catch {
    }
  }
});
import_electron4.ipcMain.handle("codexpp:list-tweaks", async () => {
  await Promise.all(tweakState.discovered.map((t) => ensureTweakUpdateCheck(t)));
  const updateChecks = readState().tweakUpdateChecks ?? {};
  return tweakState.discovered.map((t) => ({
    manifest: t.manifest,
    entry: t.entry,
    dir: t.dir,
    entryExists: (0, import_node_fs10.existsSync)(t.entry),
    enabled: isTweakEnabled(t.manifest.id),
    update: updateChecks[t.manifest.id] ?? null
  }));
});
import_electron4.ipcMain.handle("codexpp:get-tweak-enabled", (_e, id) => isTweakEnabled(id));
import_electron4.ipcMain.handle("codexpp:set-tweak-enabled", (_e, id, enabled) => {
  return setTweakEnabledAndReload(id, enabled, tweakLifecycleDeps);
});
import_electron4.ipcMain.handle("codexpp:get-config", () => {
  const s = readState();
  const installerState = readInstallerState();
  const sourceRoot = installerState?.sourceRoot ?? fallbackSourceRoot();
  return {
    version: CODEX_PLUSPLUS_VERSION,
    autoUpdate: s.codexPlusPlus?.autoUpdate !== false,
    safeMode: s.codexPlusPlus?.safeMode === true,
    updateChannel: s.codexPlusPlus?.updateChannel ?? "stable",
    updateRepo: s.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    updateRef: s.codexPlusPlus?.updateRef ?? "",
    updateCheck: s.codexPlusPlus?.updateCheck ?? null,
    selfUpdate: readSelfUpdateState(),
    installationSource: describeInstallationSource(sourceRoot)
  };
});
import_electron4.ipcMain.handle("codexpp:set-auto-update", (_e, enabled) => {
  setCodexPlusPlusAutoUpdate(!!enabled);
  return { autoUpdate: isCodexPlusPlusAutoUpdateEnabled() };
});
import_electron4.ipcMain.handle("codexpp:set-update-config", (_e, config) => {
  setCodexPlusPlusUpdateConfig(config);
  const s = readState();
  return {
    updateChannel: s.codexPlusPlus?.updateChannel ?? "stable",
    updateRepo: s.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    updateRef: s.codexPlusPlus?.updateRef ?? ""
  };
});
import_electron4.ipcMain.handle("codexpp:check-codexpp-update", async (_e, force) => {
  return ensureCodexPlusPlusUpdateCheck(force === true);
});
import_electron4.ipcMain.handle("codexpp:run-codexpp-update", async () => {
  const sourceRoot = readInstallerState()?.sourceRoot ?? fallbackSourceRoot();
  if (!sourceRoot) {
    throw new Error("Codex++ source CLI was not found. Run the installer once, then try again.");
  }
  const cli = (0, import_node_path9.join)(sourceRoot, "packages", "installer", "dist", "cli.js");
  if (!(0, import_node_fs10.existsSync)(cli)) {
    throw new Error("Codex++ source CLI was not found. Run the installer once, then try again.");
  }
  const pending = markSelfUpdateStarted(sourceRoot);
  startInstalledCli(cli, ["update", "--watcher"]);
  return pending;
});
import_electron4.ipcMain.handle("codexpp:get-watcher-health", () => getWatcherHealth(userRoot));
import_electron4.ipcMain.handle("codexpp:get-tweak-store", async () => {
  const store = await fetchTweakStoreRegistry();
  const registry = store.registry;
  const installed = new Map(tweakState.discovered.map((t) => [t.manifest.id, t]));
  const entries = shuffleStoreEntries(registry.entries, import_node_crypto3.randomInt);
  return {
    ...registry,
    sourceUrl: TWEAK_STORE_INDEX_URL,
    fetchedAt: store.fetchedAt,
    entries: entries.map((entry) => {
      const local = installed.get(entry.id);
      const platform2 = storeEntryPlatformCompatibility(entry);
      const runtime = storeEntryRuntimeCompatibility(entry, CODEX_PLUSPLUS_VERSION);
      return {
        ...entry,
        platform: platform2,
        runtime,
        installed: local ? {
          version: local.manifest.version,
          enabled: isTweakEnabled(local.manifest.id)
        } : null
      };
    })
  };
});
import_electron4.ipcMain.handle("codexpp:install-store-tweak", async (_e, id) => {
  const { registry } = await fetchTweakStoreRegistry();
  const entry = registry.entries.find((candidate) => candidate.id === id);
  if (!entry) throw new Error(`Tweak store entry not found: ${id}`);
  assertStoreEntryPlatformCompatible(entry);
  assertStoreEntryRuntimeCompatible(entry, CODEX_PLUSPLUS_VERSION);
  await installStoreTweak(entry);
  reloadTweaks("store-install", tweakLifecycleDeps);
  return { installed: entry.id };
});
import_electron4.ipcMain.handle("codexpp:prepare-tweak-store-submission", async (_e, repoInput) => {
  return prepareTweakStoreSubmission(repoInput);
});
function readTweakSource(entryPath) {
  const resolved = (0, import_node_path9.resolve)(entryPath);
  if (!isPathInside2(TWEAKS_DIR, resolved)) {
    throw new Error("path outside tweaks dir");
  }
  return require("node:fs").readFileSync(resolved, "utf8");
}
import_electron4.ipcMain.handle("codexpp:read-tweak-source", (_e, entryPath) => {
  return readTweakSource(entryPath);
});
import_electron4.ipcMain.on("codexpp:read-tweak-source-sync", (event, entryPath) => {
  try {
    event.returnValue = { ok: true, source: readTweakSource(entryPath) };
  } catch (error) {
    event.returnValue = {
      ok: false,
      error: String(error?.message ?? error)
    };
  }
});
var ASSET_MAX_BYTES = 1024 * 1024;
var MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};
import_electron4.ipcMain.handle(
  "codexpp:read-tweak-asset",
  (_e, tweakDir, relPath) => {
    const fs = require("node:fs");
    const dir = (0, import_node_path9.resolve)(tweakDir);
    if (!isPathInside2(TWEAKS_DIR, dir)) {
      throw new Error("tweakDir outside tweaks dir");
    }
    const full = (0, import_node_path9.resolve)(dir, relPath);
    if (!isPathInside2(dir, full) || full === dir) {
      throw new Error("path traversal");
    }
    const stat4 = fs.statSync(full);
    if (stat4.size > ASSET_MAX_BYTES) {
      throw new Error(`asset too large (${stat4.size} > ${ASSET_MAX_BYTES})`);
    }
    const ext = full.slice(full.lastIndexOf(".")).toLowerCase();
    const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
    const buf = fs.readFileSync(full);
    return `data:${mime};base64,${buf.toString("base64")}`;
  }
);
import_electron4.ipcMain.on("codexpp:preload-log", (_e, level, msg) => {
  const lvl = level === "error" || level === "warn" ? level : "info";
  try {
    appendCappedLog((0, import_node_path9.join)(LOG_DIR, "preload.log"), `[${(/* @__PURE__ */ new Date()).toISOString()}] [${lvl}] ${msg}
`);
  } catch {
  }
});
import_electron4.ipcMain.handle("codexpp:tweak-fs", (_e, op, id, p, c) => {
  if (!/^[a-zA-Z0-9._-]+$/.test(id)) throw new Error("bad tweak id");
  const dir = (0, import_node_path9.join)(userRoot, "tweak-data", id);
  (0, import_node_fs10.mkdirSync)(dir, { recursive: true });
  const full = (0, import_node_path9.resolve)(dir, p);
  if (!isPathInside2(dir, full) || full === dir) throw new Error("path traversal");
  const fs = require("node:fs");
  switch (op) {
    case "read":
      return fs.readFileSync(full, "utf8");
    case "write":
      return fs.writeFileSync(full, c ?? "", "utf8");
    case "exists":
      return fs.existsSync(full);
    case "dataDir":
      return dir;
    default:
      throw new Error(`unknown op: ${op}`);
  }
});
import_electron4.ipcMain.handle("codexpp:user-paths", () => ({
  userRoot,
  runtimeDir,
  tweaksDir: TWEAKS_DIR,
  logDir: LOG_DIR
}));
import_electron4.ipcMain.handle("codexpp:codex-runtime-info", () => currentRuntimeInfo());
import_electron4.ipcMain.handle("codexpp:codex-runtime-capabilities", () => currentRuntimeCapabilities());
import_electron4.ipcMain.handle("codexpp:codex-cdp-status", () => getCdpStatus());
import_electron4.ipcMain.handle("codexpp:codex-cdp-targets", () => listCdpTargets());
import_electron4.ipcMain.handle(
  "codexpp:model-generate-text",
  (_e, tweakId, options) => {
    assertTweakPermissionForId(tweakId, "model");
    return generateModelText(tweakId, options);
  }
);
import_electron4.ipcMain.handle(
  "codexpp:model-generate-object",
  (_e, tweakId, options) => {
    assertTweakPermissionForId(tweakId, "model");
    return generateModelObject(tweakId, options);
  }
);
import_electron4.ipcMain.handle("codexpp:codex-window-create", (_e, opts) => {
  return createCodexWindow(opts);
});
import_electron4.ipcMain.handle("codexpp:codex-window-primary", () => getPrimaryCodexWindowRef());
import_electron4.ipcMain.handle("codexpp:codex-window-focus", (_e, windowId) => focusCodexWindow(windowId));
import_electron4.ipcMain.handle("codexpp:codex-window-show", (_e, windowId) => showCodexWindow(windowId));
import_electron4.ipcMain.handle(
  "codexpp:codex-view-create",
  async (_e, tweakId, options) => {
    const tweak = assertTweakViewPermissionForId(tweakId);
    const ref = await createOwlView({ id: tweak.manifest.id, dir: tweak.dir }, options);
    return {
      id: ref.id,
      webContentsId: ref.webContentsId,
      parentWindowId: ref.parentWindowId
    };
  }
);
import_electron4.ipcMain.handle(
  "codexpp:codex-view-call",
  (_e, tweakId, viewId, method, arg, arg2) => {
    assertTweakViewPermissionForId(tweakId);
    return callOwlView(tweakId, viewId, method, arg, arg2);
  }
);
import_electron4.ipcMain.handle("codexpp:codex-view-dispose-tweak", (_e, tweakId) => {
  assertTweakId(tweakId);
  disposeOwlViewsForTweak(tweakId);
});
import_electron4.ipcMain.handle(
  "codexpp:native-load-module",
  (_e, tweakId, options) => {
    const ref = nativeBridge.loadModule(tweakContext(tweakId, "native-module"), options);
    return { id: ref.id, kind: ref.kind };
  }
);
import_electron4.ipcMain.handle(
  "codexpp:native-module-request",
  (_e, tweakId, moduleId, method, payload, timeoutMs) => {
    assertTweakPermissionForId(tweakId, "native-module");
    return nativeBridge.requestModule(tweakId, moduleId, method, payload, timeoutMs);
  }
);
import_electron4.ipcMain.handle("codexpp:native-module-dispose", (_e, tweakId, moduleId) => {
  assertTweakPermissionForId(tweakId, "native-module");
  return nativeBridge.disposeModule(tweakId, moduleId);
});
import_electron4.ipcMain.handle("codexpp:native-dispose-tweak", (_e, tweakId) => {
  assertTweakId(tweakId);
  nativeBridge.disposeTweak(tweakId);
});
import_electron4.ipcMain.handle(
  "codexpp:native-create-panel",
  async (_e, tweakId, options) => {
    const ref = await nativeBridge.createPanel(tweakContext(tweakId, "native-view"), options);
    return { id: ref.id, windowId: ref.windowId };
  }
);
import_electron4.ipcMain.handle(
  "codexpp:native-attach-view",
  async (_e, tweakId, options) => {
    const ref = await nativeBridge.attachView(tweakContext(tweakId, "native-view"), options);
    return { id: ref.id };
  }
);
import_electron4.ipcMain.handle(
  "codexpp:native-instance-call",
  async (_e, tweakId, kind, instanceId, method, arg) => {
    assertTweakPermissionForId(tweakId, "native-view");
    return nativeBridge.callInstance(tweakId, kind, instanceId, method, arg);
  }
);
import_electron4.ipcMain.handle(
  "codexpp:native-launch-helper",
  (_e, tweakId, options) => {
    const ref = nativeBridge.launchHelper(tweakContext(tweakId, "native-helper"), options);
    return { id: ref.id, pid: ref.pid };
  }
);
import_electron4.ipcMain.handle(
  "codexpp:native-helper-call",
  (_e, tweakId, helperId, method, payload, timeoutMs) => {
    assertTweakPermissionForId(tweakId, "native-helper");
    return nativeBridge.callHelper(tweakId, helperId, method, payload, timeoutMs);
  }
);
import_electron4.ipcMain.handle("codexpp:reveal", (_e, p) => {
  import_electron4.shell.openPath(p).catch(() => {
  });
});
import_electron4.ipcMain.handle("codexpp:open-external", (_e, url) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "github.com") {
    throw new Error("only github.com links can be opened from tweak metadata");
  }
  import_electron4.shell.openExternal(parsed.toString()).catch(() => {
  });
});
import_electron4.ipcMain.handle("codexpp:copy-text", (_e, text) => {
  import_electron4.clipboard.writeText(String(text));
  return true;
});
import_electron4.ipcMain.handle("codexpp:reload-tweaks", () => {
  reloadTweaks("manual", tweakLifecycleDeps);
  return { at: Date.now(), count: tweakState.discovered.length };
});
var RELOAD_DEBOUNCE_MS = 250;
var reloadTimer = null;
function scheduleReload(reason) {
  if (reloadTimer) clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    reloadTimer = null;
    reloadTweaks(reason, tweakLifecycleDeps);
  }, RELOAD_DEBOUNCE_MS);
}
try {
  const watcher = esm_default.watch(TWEAKS_DIR, {
    ignoreInitial: true,
    // Wait for files to settle before triggering — guards against partially
    // written tweak files during editor saves / git checkouts.
    awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    // Avoid eating CPU on huge node_modules trees inside tweak folders.
    ignored: (p) => p.includes(`${TWEAKS_DIR}/`) && /\/node_modules\//.test(p)
  });
  watcher.on("all", (event, path) => scheduleReload(`${event} ${path}`));
  watcher.on("error", (e) => log("warn", "watcher error:", e));
  log("info", "watching", TWEAKS_DIR);
  import_electron4.app.on("will-quit", () => watcher.close().catch(() => {
  }));
} catch (e) {
  log("error", "failed to start watcher:", e);
}
function loadAllMainTweaks() {
  try {
    tweakState.discovered = discoverTweaks(TWEAKS_DIR);
    log(
      "info",
      `discovered ${tweakState.discovered.length} tweak(s):`,
      tweakState.discovered.map((t) => t.manifest.id).join(", ")
    );
  } catch (e) {
    log("error", "tweak discovery failed:", e);
    tweakState.discovered = [];
  }
  syncMcpServersFromEnabledTweaks();
  for (const t of tweakState.discovered) {
    if (!isMainProcessTweakScope(t.manifest.scope)) continue;
    if (!isTweakEnabled(t.manifest.id)) {
      log("info", `skipping disabled main tweak: ${t.manifest.id}`);
      continue;
    }
    try {
      const mod = require(t.entry);
      const tweak = mod.default ?? mod;
      if (typeof tweak?.start === "function") {
        const storage = createDiskStorage(userRoot, t.manifest.id);
        tweak.start({
          manifest: t.manifest,
          process: "main",
          log: makeLogger(t.manifest.id),
          storage,
          bridge: makeMainBridge(),
          ipc: makeMainIpc(t.manifest.id),
          fs: makeMainFs(t.manifest.id),
          model: makeModelApi(t.manifest.id),
          codex: makeCodexApi(t)
        });
        tweakState.loadedMain.set(t.manifest.id, {
          stop: tweak.stop,
          storage
        });
        log("info", `started main tweak: ${t.manifest.id}`);
      }
    } catch (e) {
      log("error", `tweak ${t.manifest.id} failed to start:`, e);
    }
  }
}
function syncMcpServersFromEnabledTweaks() {
  try {
    const result = syncManagedMcpServers({
      configPath: CODEX_CONFIG_FILE,
      tweaks: tweakState.discovered.filter((t) => isTweakEnabled(t.manifest.id))
    });
    if (result.changed) {
      log("info", `synced Codex MCP config: ${result.serverNames.join(", ") || "none"}`);
    }
    if (result.skippedServerNames.length > 0) {
      log(
        "info",
        `skipped Codex++ managed MCP server(s) already configured by user: ${result.skippedServerNames.join(", ")}`
      );
    }
  } catch (e) {
    log("warn", "failed to sync Codex MCP config:", e);
  }
}
function stopAllMainTweaks() {
  for (const [id, t] of tweakState.loadedMain) {
    try {
      t.stop?.();
      t.storage.flush();
      log("info", `stopped main tweak: ${id}`);
    } catch (e) {
      log("warn", `stop failed for ${id}:`, e);
    } finally {
      nativeBridge.disposeTweak(id);
      disposeOwlViewsForTweak(id);
    }
  }
  tweakState.loadedMain.clear();
}
function clearTweakModuleCache() {
  const rootSet = /* @__PURE__ */ new Set([TWEAKS_DIR, safeRealpath(TWEAKS_DIR)]);
  const entrySet = /* @__PURE__ */ new Set();
  for (const tweak of tweakState.discovered) {
    rootSet.add(tweak.dir);
    rootSet.add(safeRealpath(tweak.dir));
    entrySet.add(tweak.entry);
    entrySet.add(safeRealpath(tweak.entry));
  }
  const roots = [...rootSet];
  for (const key of Object.keys(require.cache)) {
    const realKey = safeRealpath(key);
    const isTweakModule = entrySet.has(key) || entrySet.has(realKey) || roots.some((root) => isPathInside2(root, key) || isPathInside2(root, realKey));
    if (isTweakModule) delete require.cache[key];
  }
}
function safeRealpath(filePath) {
  try {
    return (0, import_node_fs10.realpathSync)(filePath);
  } catch {
    return filePath;
  }
}
var UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1e3;
async function ensureCodexPlusPlusUpdateCheck(force = false) {
  const state = readState();
  const cached = state.codexPlusPlus?.updateCheck;
  const channel = state.codexPlusPlus?.updateChannel ?? "stable";
  const repo = state.codexPlusPlus?.updateRepo ?? CODEX_PLUSPLUS_REPO;
  if (!force && cached && cached.currentVersion === CODEX_PLUSPLUS_VERSION && Date.now() - Date.parse(cached.checkedAt) < UPDATE_CHECK_INTERVAL_MS) {
    return cached;
  }
  const release = await fetchLatestRelease(repo, CODEX_PLUSPLUS_VERSION, channel === "prerelease");
  const latestVersion = release.latestTag ? normalizeVersion(release.latestTag) : null;
  const check = {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    currentVersion: CODEX_PLUSPLUS_VERSION,
    latestVersion,
    releaseUrl: release.releaseUrl ?? `https://github.com/${repo}/releases`,
    releaseNotes: release.releaseNotes,
    updateAvailable: latestVersion ? compareVersions(normalizeVersion(latestVersion), CODEX_PLUSPLUS_VERSION) > 0 : false,
    ...release.error ? { error: release.error } : {}
  };
  state.codexPlusPlus ??= {};
  state.codexPlusPlus.updateCheck = check;
  writeState(state);
  return check;
}
async function ensureTweakUpdateCheck(t) {
  const id = t.manifest.id;
  const repo = t.manifest.githubRepo;
  const state = readState();
  const cached = state.tweakUpdateChecks?.[id];
  if (cached && cached.repo === repo && cached.currentVersion === t.manifest.version && Date.now() - Date.parse(cached.checkedAt) < UPDATE_CHECK_INTERVAL_MS) {
    return;
  }
  const next = await fetchLatestRelease(repo, t.manifest.version);
  const latestVersion = next.latestTag ? normalizeVersion(next.latestTag) : null;
  const check = {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    repo,
    currentVersion: t.manifest.version,
    latestVersion,
    latestTag: next.latestTag,
    releaseUrl: next.releaseUrl,
    updateAvailable: latestVersion ? compareVersions(latestVersion, normalizeVersion(t.manifest.version)) > 0 : false,
    ...next.error ? { error: next.error } : {}
  };
  state.tweakUpdateChecks ??= {};
  state.tweakUpdateChecks[id] = check;
  writeState(state);
}
async function fetchLatestRelease(repo, currentVersion, includePrerelease = false) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    try {
      const endpoint = includePrerelease ? "releases?per_page=20" : "releases/latest";
      const res = await fetch(`https://api.github.com/repos/${repo}/${endpoint}`, {
        headers: {
          "Accept": "application/vnd.github+json",
          "User-Agent": `codex-plusplus/${currentVersion}`
        },
        signal: controller.signal
      });
      if (res.status === 404) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: "no GitHub release found" };
      }
      if (!res.ok) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: `GitHub returned ${res.status}` };
      }
      const json = await res.json();
      const body = Array.isArray(json) ? json.find((release) => !release.draft) : json;
      if (!body) {
        return { latestTag: null, releaseUrl: null, releaseNotes: null, error: "no GitHub release found" };
      }
      return {
        latestTag: body.tag_name ?? null,
        releaseUrl: body.html_url ?? `https://github.com/${repo}/releases`,
        releaseNotes: body.body ?? null
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    return {
      latestTag: null,
      releaseUrl: null,
      releaseNotes: null,
      error: e instanceof Error ? e.message : String(e)
    };
  }
}
var StoreTweakModifiedError = class extends Error {
  constructor(tweakName) {
    super(
      `${tweakName} has local source changes, so Codex++ can't auto-update it. Revert your local changes or reinstall the tweak manually.`
    );
    this.name = "StoreTweakModifiedError";
  }
};
async function fetchTweakStoreRegistry() {
  const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8e3);
    try {
      const res = await fetch(TWEAK_STORE_INDEX_URL, {
        headers: {
          "Accept": "application/json",
          "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`
        },
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`store returned ${res.status}`);
      return {
        registry: normalizeStoreRegistry(await res.json()),
        fetchedAt
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    log("warn", "failed to fetch tweak store registry:", error.message);
    throw error;
  }
}
async function installStoreTweak(entry) {
  const url = storeArchiveUrl(entry);
  const work = (0, import_node_fs10.mkdtempSync)((0, import_node_path9.join)((0, import_node_os2.tmpdir)(), "codexpp-store-tweak-"));
  const archive = (0, import_node_path9.join)(work, "source.tar.gz");
  const extractDir = (0, import_node_path9.join)(work, "extract");
  const target = (0, import_node_path9.join)(TWEAKS_DIR, entry.id);
  const stagedTarget = (0, import_node_path9.join)(work, "staged", entry.id);
  try {
    log("info", `installing store tweak ${entry.id} from ${entry.repo}@${entry.approvedCommitSha}`);
    const res = await fetch(url, {
      headers: { "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}` },
      redirect: "follow"
    });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    (0, import_node_fs10.writeFileSync)(archive, bytes);
    (0, import_node_fs10.mkdirSync)(extractDir, { recursive: true });
    extractTarArchive(archive, extractDir);
    const source = findTweakRoot(extractDir);
    if (!source) throw new Error("downloaded archive did not contain manifest.json");
    validateStoreTweakSource(entry, source);
    (0, import_node_fs10.rmSync)(stagedTarget, { recursive: true, force: true });
    copyTweakSource(source, stagedTarget);
    const stagedFiles = hashTweakSource(stagedTarget);
    (0, import_node_fs10.writeFileSync)(
      (0, import_node_path9.join)(stagedTarget, ".codexpp-store.json"),
      JSON.stringify(
        {
          repo: entry.repo,
          approvedCommitSha: entry.approvedCommitSha,
          installedAt: (/* @__PURE__ */ new Date()).toISOString(),
          storeIndexUrl: TWEAK_STORE_INDEX_URL,
          files: stagedFiles
        },
        null,
        2
      )
    );
    await assertStoreTweakCleanForAutoUpdate(entry, target, work);
    (0, import_node_fs10.rmSync)(target, { recursive: true, force: true });
    (0, import_node_fs10.cpSync)(stagedTarget, target, { recursive: true });
  } finally {
    (0, import_node_fs10.rmSync)(work, { recursive: true, force: true });
  }
}
async function prepareTweakStoreSubmission(repoInput) {
  const repo = normalizeGitHubRepo(repoInput);
  const repoInfo = await fetchGithubJson(`https://api.github.com/repos/${repo}`);
  const defaultBranch = repoInfo.default_branch;
  if (!defaultBranch) throw new Error(`Could not resolve default branch for ${repo}`);
  const commit = await fetchGithubJson(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(defaultBranch)}`);
  if (!commit.sha) throw new Error(`Could not resolve current commit for ${repo}`);
  const manifest = await fetchManifestAtCommit(repo, commit.sha).catch((e) => {
    log("warn", `could not read manifest for store submission ${repo}@${commit.sha}:`, e);
    return void 0;
  });
  return {
    repo,
    defaultBranch,
    commitSha: commit.sha,
    commitUrl: commit.html_url ?? `https://github.com/${repo}/commit/${commit.sha}`,
    manifest: manifest ? {
      id: typeof manifest.id === "string" ? manifest.id : void 0,
      name: typeof manifest.name === "string" ? manifest.name : void 0,
      version: typeof manifest.version === "string" ? manifest.version : void 0,
      description: typeof manifest.description === "string" ? manifest.description : void 0,
      iconUrl: typeof manifest.iconUrl === "string" ? manifest.iconUrl : void 0
    } : void 0
  };
}
async function fetchGithubJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8e3);
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/vnd.github+json",
        "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`
      },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}
async function fetchManifestAtCommit(repo, commitSha) {
  const res = await fetch(`https://raw.githubusercontent.com/${repo}/${commitSha}/manifest.json`, {
    headers: {
      "Accept": "application/json",
      "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}`
    }
  });
  if (!res.ok) throw new Error(`manifest fetch returned ${res.status}`);
  return await res.json();
}
function extractTarArchive(archive, targetDir) {
  const result = (0, import_node_child_process3.spawnSync)("tar", ["-xzf", archive, "-C", targetDir], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  if (result.status !== 0) {
    throw new Error(`tar extraction failed: ${result.stderr || result.stdout || result.status}`);
  }
}
function validateStoreTweakSource(entry, source) {
  const manifestPath = (0, import_node_path9.join)(source, "manifest.json");
  const manifest = JSON.parse((0, import_node_fs10.readFileSync)(manifestPath, "utf8"));
  if (manifest.id !== entry.manifest.id) {
    throw new Error(`downloaded tweak id ${manifest.id} does not match approved id ${entry.manifest.id}`);
  }
  if (manifest.githubRepo !== entry.repo) {
    throw new Error(`downloaded tweak repo ${manifest.githubRepo} does not match approved repo ${entry.repo}`);
  }
  if (manifest.version !== entry.manifest.version) {
    throw new Error(`downloaded tweak version ${manifest.version} does not match approved version ${entry.manifest.version}`);
  }
}
function findTweakRoot(dir) {
  if (!(0, import_node_fs10.existsSync)(dir)) return null;
  if ((0, import_node_fs10.existsSync)((0, import_node_path9.join)(dir, "manifest.json"))) return dir;
  for (const name of (0, import_node_fs10.readdirSync)(dir)) {
    const child = (0, import_node_path9.join)(dir, name);
    try {
      if (!(0, import_node_fs10.statSync)(child).isDirectory()) continue;
    } catch {
      continue;
    }
    const found = findTweakRoot(child);
    if (found) return found;
  }
  return null;
}
function copyTweakSource(source, target) {
  (0, import_node_fs10.cpSync)(source, target, {
    recursive: true,
    filter: (src) => !/(^|[/\\])(?:\.git|node_modules)(?:[/\\]|$)/.test(src)
  });
}
async function assertStoreTweakCleanForAutoUpdate(entry, target, work) {
  if (!(0, import_node_fs10.existsSync)(target)) return;
  const metadata = readStoreInstallMetadata(target);
  if (!metadata) return;
  if (metadata.repo !== entry.repo) {
    throw new StoreTweakModifiedError(entry.manifest.name);
  }
  const currentFiles = hashTweakSource(target);
  const baselineFiles = metadata.files ?? await fetchBaselineStoreTweakHashes(metadata, work);
  if (!sameFileHashes(currentFiles, baselineFiles)) {
    throw new StoreTweakModifiedError(entry.manifest.name);
  }
}
function readStoreInstallMetadata(target) {
  const metadataPath = (0, import_node_path9.join)(target, ".codexpp-store.json");
  if (!(0, import_node_fs10.existsSync)(metadataPath)) return null;
  try {
    const parsed = JSON.parse((0, import_node_fs10.readFileSync)(metadataPath, "utf8"));
    if (typeof parsed.repo !== "string" || typeof parsed.approvedCommitSha !== "string") return null;
    return {
      repo: parsed.repo,
      approvedCommitSha: parsed.approvedCommitSha,
      installedAt: typeof parsed.installedAt === "string" ? parsed.installedAt : "",
      storeIndexUrl: typeof parsed.storeIndexUrl === "string" ? parsed.storeIndexUrl : "",
      files: isHashRecord(parsed.files) ? parsed.files : void 0
    };
  } catch {
    return null;
  }
}
async function fetchBaselineStoreTweakHashes(metadata, work) {
  const baselineDir = (0, import_node_path9.join)(work, "baseline");
  const archive = (0, import_node_path9.join)(work, "baseline.tar.gz");
  const res = await fetch(`https://codeload.github.com/${metadata.repo}/tar.gz/${metadata.approvedCommitSha}`, {
    headers: { "User-Agent": `codex-plusplus/${CODEX_PLUSPLUS_VERSION}` },
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`Could not verify local tweak changes before update: ${res.status}`);
  (0, import_node_fs10.writeFileSync)(archive, Buffer.from(await res.arrayBuffer()));
  (0, import_node_fs10.mkdirSync)(baselineDir, { recursive: true });
  extractTarArchive(archive, baselineDir);
  const source = findTweakRoot(baselineDir);
  if (!source) throw new Error("Could not verify local tweak changes before update: baseline manifest missing");
  return hashTweakSource(source);
}
function hashTweakSource(root) {
  const out = {};
  collectTweakFileHashes(root, root, out);
  return out;
}
function collectTweakFileHashes(root, dir, out) {
  for (const name of (0, import_node_fs10.readdirSync)(dir).sort()) {
    if (name === ".git" || name === "node_modules" || name === ".codexpp-store.json") continue;
    const full = (0, import_node_path9.join)(dir, name);
    const rel = (0, import_node_path9.relative)(root, full).split("\\").join("/");
    const stat4 = (0, import_node_fs10.statSync)(full);
    if (stat4.isDirectory()) {
      collectTweakFileHashes(root, full, out);
      continue;
    }
    if (!stat4.isFile()) continue;
    out[rel] = (0, import_node_crypto3.createHash)("sha256").update((0, import_node_fs10.readFileSync)(full)).digest("hex");
  }
}
function sameFileHashes(a, b) {
  const ak = Object.keys(a).sort();
  const bk = Object.keys(b).sort();
  if (ak.length !== bk.length) return false;
  for (let i = 0; i < ak.length; i++) {
    const key = ak[i];
    if (key !== bk[i] || a[key] !== b[key]) return false;
  }
  return true;
}
function isHashRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "string");
}
function fallbackSourceRoot() {
  const candidates = [
    (0, import_node_path9.join)((0, import_node_os2.homedir)(), ".codex-plusplus", "source"),
    (0, import_node_path9.join)(userRoot, "source")
  ];
  for (const candidate of candidates) {
    if ((0, import_node_fs10.existsSync)((0, import_node_path9.join)(candidate, "packages", "installer", "dist", "cli.js"))) return candidate;
  }
  return null;
}
function describeInstallationSource(sourceRoot) {
  if (!sourceRoot) {
    return {
      kind: "unknown",
      label: "Unknown",
      detail: "Codex++ source location is not recorded yet."
    };
  }
  const normalized = sourceRoot.replace(/\\/g, "/");
  if (/\/(?:Homebrew|homebrew)\/Cellar\/codexplusplus\//.test(normalized)) {
    return { kind: "homebrew", label: "Homebrew", detail: sourceRoot };
  }
  if ((0, import_node_fs10.existsSync)((0, import_node_path9.join)(sourceRoot, ".git"))) {
    return { kind: "local-dev", label: "Local development checkout", detail: sourceRoot };
  }
  if (normalized.endsWith("/.codex-plusplus/source") || normalized.includes("/.codex-plusplus/source/")) {
    return { kind: "github-source", label: "GitHub source installer", detail: sourceRoot };
  }
  if ((0, import_node_fs10.existsSync)((0, import_node_path9.join)(sourceRoot, "package.json"))) {
    return { kind: "source-archive", label: "Source archive", detail: sourceRoot };
  }
  return { kind: "unknown", label: "Unknown", detail: sourceRoot };
}
function startInstalledCli(cli, args) {
  if (process.platform === "darwin" && startInstalledCliWithLaunchd(cli, args)) {
    return;
  }
  const child = (0, import_node_child_process3.spawn)(process.execPath, [cli, ...args], {
    cwd: (0, import_node_path9.resolve)((0, import_node_path9.dirname)(cli), "..", "..", ".."),
    env: { ...process.env, CODEX_PLUSPLUS_MANUAL_UPDATE: "1" },
    detached: true,
    stdio: "ignore"
  });
  child.unref();
}
function startInstalledCliWithLaunchd(cli, args) {
  const label = `com.codexplusplus.patch-helper.${process.pid}.${Date.now()}`;
  const cleanup = `launchctl remove ${label} >/dev/null 2>&1 || launchctl bootout gui/$(id -u)/${label} >/dev/null 2>&1 || true`;
  const command = [
    `trap ${shellQuote(cleanup)} EXIT`,
    `cd ${shellQuote((0, import_node_path9.resolve)((0, import_node_path9.dirname)(cli), "..", "..", ".."))}`,
    `CODEX_PLUSPLUS_MANUAL_UPDATE=1 ${[process.execPath, cli, ...args].map(shellQuote).join(" ")}`
  ].join(" && ");
  const result = (0, import_node_child_process3.spawnSync)(
    "launchctl",
    [
      "submit",
      "-l",
      label,
      "--",
      "/bin/sh",
      "-c",
      `${command} || true`
    ],
    {
      encoding: "utf8",
      stdio: "ignore"
    }
  );
  if (result.status === 0) return true;
  log("warn", `launchctl submit failed for Codex++ patch helper: ${result.error?.message ?? result.status}`);
  return false;
}
function shellQuote(value) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function markSelfUpdateStarted(sourceRoot) {
  const config = readState().codexPlusPlus;
  const channel = config?.updateChannel ?? "stable";
  const state = {
    checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
    status: "checking",
    currentVersion: CODEX_PLUSPLUS_VERSION,
    latestVersion: null,
    targetRef: config?.updateChannel === "custom" ? config.updateRef ?? null : null,
    releaseUrl: null,
    repo: config?.updateRepo ?? CODEX_PLUSPLUS_REPO,
    channel,
    sourceRoot,
    installationSource: describeInstallationSource(sourceRoot)
  };
  writeSelfUpdateState(state);
  return state;
}
function broadcastReload() {
  const payload = {
    at: Date.now(),
    tweaks: tweakState.discovered.map((t) => t.manifest.id)
  };
  for (const wc of import_electron4.webContents.getAllWebContents()) {
    try {
      wc.send("codexpp:tweaks-changed", payload);
    } catch (e) {
      log("warn", "broadcast send failed:", e);
    }
  }
}
function makeLogger(scope) {
  return {
    debug: (...a) => log("info", `[${scope}]`, ...a),
    info: (...a) => log("info", `[${scope}]`, ...a),
    warn: (...a) => log("warn", `[${scope}]`, ...a),
    error: (...a) => log("error", `[${scope}]`, ...a)
  };
}
function makeMainBridge() {
  return {
    addMessageFromViewTransformer: (transformer) => {
      mainMessageFromViewTransformers.add(transformer);
      return {
        unregister: () => {
          mainMessageFromViewTransformers.delete(transformer);
        }
      };
    },
    addMessageFromViewResponseListener: (listener) => {
      mainMessageFromViewResponseListeners.add(listener);
      return {
        unregister: () => {
          mainMessageFromViewResponseListeners.delete(listener);
        }
      };
    }
  };
}
function installMessageFromViewTransformHook() {
  const current = import_electron4.ipcMain.handle;
  if (current.__codexppMessageTransformPatched) return;
  const originalHandle = import_electron4.ipcMain.handle.bind(import_electron4.ipcMain);
  const patchedHandle = ((channel, listener) => {
    if (channel !== DESKTOP_MESSAGE_FROM_VIEW) return originalHandle(channel, listener);
    return originalHandle(channel, async (event, message) => {
      const context = {
        senderId: event.sender?.id,
        senderUrl: event.senderFrame?.url || event.sender?.getURL?.()
      };
      const transformed = transformMessageFromView(message, context);
      const response = await listener(event, transformed);
      notifyMessageFromViewResponse(transformed, response, context);
      return response;
    });
  });
  patchedHandle.__codexppMessageTransformPatched = true;
  import_electron4.ipcMain.handle = patchedHandle;
}
function transformMessageFromView(message, context) {
  let current = message;
  for (const transformer of Array.from(mainMessageFromViewTransformers)) {
    try {
      const next = transformer(current, context);
      if (next !== void 0) current = next;
    } catch (error) {
      log("warn", "message-from-view transformer failed:", error);
    }
  }
  return current;
}
function notifyMessageFromViewResponse(message, response, context) {
  for (const listener of Array.from(mainMessageFromViewResponseListeners)) {
    try {
      listener(message, response, context);
    } catch (error) {
      log("warn", "message-from-view response listener failed:", error);
    }
  }
}
function makeMainIpc(id) {
  const ch = (c) => `codexpp:${id}:${c}`;
  return {
    on: (c, h) => {
      const wrapped = (_e, ...args) => h(...args);
      import_electron4.ipcMain.on(ch(c), wrapped);
      return () => import_electron4.ipcMain.removeListener(ch(c), wrapped);
    },
    send: (_c) => {
      throw new Error("ipc.send is renderer\u2192main; main side uses handle/on");
    },
    invoke: (_c) => {
      throw new Error("ipc.invoke is renderer\u2192main; main side uses handle");
    },
    handle: (c, handler) => {
      import_electron4.ipcMain.handle(ch(c), (_e, ...args) => handler(...args));
    }
  };
}
function makeMainFs(id) {
  const dir = (0, import_node_path9.join)(userRoot, "tweak-data", id);
  (0, import_node_fs10.mkdirSync)(dir, { recursive: true });
  const fs = require("node:fs/promises");
  return {
    dataDir: dir,
    read: (p) => fs.readFile((0, import_node_path9.join)(dir, p), "utf8"),
    write: (p, c) => fs.writeFile((0, import_node_path9.join)(dir, p), c, "utf8"),
    exists: async (p) => {
      try {
        await fs.access((0, import_node_path9.join)(dir, p));
        return true;
      } catch {
        return false;
      }
    }
  };
}
function makeModelApi(tweakId) {
  return {
    generateText: (options) => {
      assertTweakPermissionForId(tweakId, "model");
      return generateModelText(tweakId, options);
    },
    generateObject: (options) => {
      assertTweakPermissionForId(tweakId, "model");
      return generateModelObject(tweakId, options);
    }
  };
}
function cleanModelReasoningEffort(value) {
  return value === "minimal" || value === "low" || value === "medium" || value === "high" || value === "xhigh" ? value : null;
}
function cleanModelString(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}
function modelPrompt(options) {
  const system = cleanModelString(options.system, 8e3).trim();
  const prompt = cleanModelString(options.prompt, 12e4).trim();
  if (!prompt) throw new Error("model prompt is required");
  return system ? `${system}

${prompt}` : prompt;
}
function modelWorkingDirectory(tweakId, cwd) {
  if (typeof cwd === "string" && cwd && (0, import_node_path9.isAbsolute)(cwd) && (0, import_node_fs10.existsSync)(cwd)) return cwd;
  return (0, import_node_path9.join)(userRoot, "tweak-data", tweakId);
}
function codexCliEnv() {
  return {
    ...process.env,
    HOME: process.env.HOME || (0, import_node_os2.homedir)(),
    CODEX_INTERNAL_ORIGINATOR_OVERRIDE: process.env.CODEX_INTERNAL_ORIGINATOR_OVERRIDE || "Codex++",
    PATH: [
      process.env.PATH || "",
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin"
    ].filter(Boolean).join(":")
  };
}
function codexCliCommand() {
  return process.env.CODEX_PLUSPLUS_CODEX_CLI || process.env.CODEX_CLI || "codex";
}
function modelTimeoutMs(value) {
  const timeoutMs = typeof value === "number" && Number.isFinite(value) ? value : 45e3;
  return Math.max(5e3, Math.min(18e4, Math.floor(timeoutMs)));
}
async function runCodexModel(tweakId, options, schema) {
  const prompt = modelPrompt(options);
  const model = cleanModelString(options.model, 120).trim();
  const reasoningEffort = cleanModelReasoningEffort(options.reasoningEffort);
  const cwd = modelWorkingDirectory(tweakId, options.cwd);
  const tempDir = (0, import_node_fs10.mkdtempSync)((0, import_node_path9.join)((0, import_node_os2.tmpdir)(), "codexpp-model-"));
  const promptPath = (0, import_node_path9.join)(tempDir, "prompt.txt");
  const outputPath = (0, import_node_path9.join)(tempDir, "output.txt");
  const schemaPath = (0, import_node_path9.join)(tempDir, "schema.json");
  try {
    (0, import_node_fs10.writeFileSync)(promptPath, prompt, "utf8");
    const args = [
      "exec",
      "--ephemeral",
      "--skip-git-repo-check",
      "--ignore-rules",
      "--ask-for-approval",
      "never",
      "--sandbox",
      "read-only",
      "--output-last-message",
      outputPath,
      "-C",
      cwd
    ];
    if (model) args.push("--model", model);
    if (reasoningEffort) args.push("-c", `model_reasoning_effort="${reasoningEffort}"`);
    if (schema) {
      (0, import_node_fs10.writeFileSync)(schemaPath, JSON.stringify(schema, null, 2), "utf8");
      args.push("--output-schema", schemaPath);
    }
    args.push("-");
    const result = await spawnWithInput(codexCliCommand(), args, prompt, {
      cwd,
      env: codexCliEnv(),
      timeoutMs: modelTimeoutMs(options.timeoutMs)
    });
    if (result.status !== 0) {
      throw new Error(`codex exec failed (${result.status ?? "signal"}): ${result.stderr.slice(-2e3)}`);
    }
    const text = (0, import_node_fs10.readFileSync)(outputPath, "utf8").trim();
    if (!text) throw new Error("codex exec returned an empty final message");
    return {
      text,
      model: model || null,
      reasoningEffort
    };
  } finally {
    (0, import_node_fs10.rmSync)(tempDir, { recursive: true, force: true });
  }
}
function spawnWithInput(command, args, input, options) {
  return new Promise((resolvePromise, reject) => {
    const child = (0, import_node_child_process3.spawn)(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`codex model generation timed out after ${options.timeoutMs}ms`));
    }, options.timeoutMs);
    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
      if (stdout.length > 128e3) stdout = stdout.slice(-128e3);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
      if (stderr.length > 128e3) stderr = stderr.slice(-128e3);
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (status, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ status, signal, stdout, stderr });
    });
    child.stdin?.end(input);
  });
}
async function generateModelText(tweakId, options) {
  return runCodexModel(tweakId, options);
}
async function generateModelObject(tweakId, options) {
  if (!options || typeof options !== "object" || !options.schema || typeof options.schema !== "object") {
    throw new Error("model object generation requires a JSON schema");
  }
  const result = await runCodexModel(tweakId, options, options.schema);
  let object;
  try {
    object = JSON.parse(result.text);
  } catch (error) {
    throw new Error(`model object generation returned invalid JSON: ${error.message}`);
  }
  return { ...result, object };
}
function currentRuntimeInfo() {
  const installerState = readInstallerState();
  return getRuntimeInfo({
    userRoot,
    runtimeDir,
    codexVersion: installerState?.codexVersion ?? null,
    channel: null,
    getWindowServices: getCodexWindowServices
  });
}
function currentRuntimeCapabilities() {
  const installerState = readInstallerState();
  return getRuntimeCapabilities({
    userRoot,
    runtimeDir,
    codexVersion: installerState?.codexVersion ?? null,
    channel: null,
    getWindowServices: getCodexWindowServices,
    getNativeCapabilities: () => nativeBridge.getCapabilities(),
    getViewCapabilities: () => getOwlViewCapabilities()
  });
}
function tweakContext(tweakId, permission) {
  const tweak = permission ? assertTweakPermissionForId(tweakId, permission) : tweakById(tweakId);
  return { id: tweak.manifest.id, dir: tweak.dir };
}
function tweakById(tweakId) {
  assertTweakId(tweakId);
  const tweak = tweakState.discovered.find((item) => item.manifest.id === tweakId);
  if (!tweak) throw new Error(`unknown tweak: ${tweakId}`);
  if (!isTweakEnabled(tweakId)) throw new Error(`tweak is disabled: ${tweakId}`);
  return tweak;
}
function assertTweakPermissionForId(tweakId, permission) {
  const tweak = tweakById(tweakId);
  assertTweakPermission(tweak, permission);
  return tweak;
}
function assertTweakViewPermissionForId(tweakId) {
  const tweak = tweakById(tweakId);
  assertTweakViewPermission(tweak);
  return tweak;
}
function assertTweakPermission(tweak, permission) {
  if (tweak.manifest.permissions?.includes(permission)) return;
  throw new Error(`tweak ${tweak.manifest.id} must declare ${permission} permission`);
}
function assertTweakViewPermission(tweak) {
  if (tweak.manifest.permissions?.includes("codex-views") || tweak.manifest.permissions?.includes("codex.views")) {
    return;
  }
  throw new Error(`tweak ${tweak.manifest.id} must declare codex-views permission`);
}
function assertTweakId(tweakId) {
  if (!/^[a-zA-Z0-9._-]+$/.test(tweakId)) throw new Error("bad tweak id");
}
function getPrimaryCodexWindow() {
  const services = getCodexWindowServices();
  const fromServices = typeof services?.getPrimaryWindow === "function" ? services.getPrimaryWindow("local") : null;
  if (fromServices && !fromServices.isDestroyed()) return fromServices;
  const fromManager = typeof services?.windowManager?.getPrimaryWindow === "function" ? services.windowManager.getPrimaryWindow.call(services.windowManager) : null;
  if (fromManager && !fromManager.isDestroyed()) return fromManager;
  const focused = import_electron4.BrowserWindow.getFocusedWindow();
  if (focused && !focused.isDestroyed()) return focused;
  return import_electron4.BrowserWindow.getAllWindows().find((win) => !win.isDestroyed()) ?? null;
}
function getPrimaryCodexWindowRef() {
  const win = getPrimaryCodexWindow();
  if (!win || win.isDestroyed()) return null;
  return { windowId: win.id, webContentsId: win.webContents.id };
}
function focusCodexWindow(windowId) {
  const win = import_electron4.BrowserWindow.fromId(windowId);
  if (!win || win.isDestroyed()) return false;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  return true;
}
function showCodexWindow(windowId) {
  const win = import_electron4.BrowserWindow.fromId(windowId);
  if (!win || win.isDestroyed()) return false;
  win.show();
  return true;
}
function getOwlViewCapabilities() {
  const parent = getPrimaryCodexWindow() ?? import_electron4.BrowserWindow.getFocusedWindow();
  const contentView = asRecord4(parent)?.contentView;
  let sampleView = null;
  try {
    sampleView = new import_electron4.BrowserView({ webPreferences: { sandbox: true } });
  } catch {
  }
  const webContentsView = asRecord4(sampleView)?.webContentsView;
  const privateViewTree = typeof asRecord4(contentView)?.addChildView === "function" && typeof asRecord4(contentView)?.removeChildView === "function";
  const webContentsViewAvailable = Boolean(webContentsView) && typeof asRecord4(webContentsView)?.setBounds === "function";
  const privateAttach = privateViewTree && webContentsViewAvailable;
  const browserViewFallback = typeof asRecord4(parent)?.addBrowserView === "function";
  try {
    if (sampleView && !sampleView.webContents.isDestroyed()) {
      sampleView.webContents.close({ waitForBeforeUnload: false });
    }
  } catch {
  }
  return {
    create: privateAttach || browserViewFallback,
    privateViewTree: privateAttach,
    webContentsView: webContentsViewAvailable,
    browserViewFallback
  };
}
async function createOwlView(ctx, opts) {
  const id = assertBridgeId2(opts.id ?? (0, import_node_crypto3.randomUUID)(), "Codex view id");
  const key = owlViewKey(ctx.id, id);
  if (owlViews.has(key)) throw new Error(`Codex view already exists: ${ctx.id}:${id}`);
  const parent = typeof opts.parentWindowId === "number" ? import_electron4.BrowserWindow.fromId(opts.parentWindowId) : getPrimaryCodexWindow();
  if (!parent || isWindowDestroyed2(parent)) {
    throw new Error("Codex view needs an active parent window");
  }
  const services = getCodexWindowServices();
  const windowManager = services?.windowManager;
  const route = opts.route === void 0 ? null : normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const view = new import_electron4.BrowserView({
    webPreferences: {
      preload: opts.registerWithCodex === false ? void 0 : windowManager?.options?.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: windowManager?.options?.allowDevtools
    }
  });
  if (opts.backgroundColor) {
    callObjectMethod(view, "setBackgroundColor", [opts.backgroundColor]);
    callObjectMethod(asRecord4(view)?.webContentsView, "setBackgroundColor", [opts.backgroundColor]);
  }
  const managed = {
    key,
    tweakId: ctx.id,
    id,
    view,
    parentWindowId: windowIdFor2(parent),
    attachMode: null,
    disposeBindings: [],
    disposed: false
  };
  owlViews.set(key, managed);
  try {
    if (route !== null && opts.registerWithCodex !== false && windowManager?.registerWindow) {
      const appearance = opts.appearance || "secondary";
      const windowLike = makeWindowLikeForView2(view);
      windowManager.registerWindow(windowLike, hostId, false, appearance);
      services?.getContext?.(hostId)?.registerWindow?.(windowLike);
    }
    attachOwlView(managed, parent);
    if (opts.bounds) setOwlViewBounds(managed, opts.bounds);
    if (opts.visible === false) setOwlViewVisible(managed, false);
    if (route !== null) {
      await view.webContents.loadURL(codexAppUrl(route, hostId));
    } else if (opts.url) {
      await view.webContents.loadURL(normalizeOwlViewUrl(opts.url));
    } else {
      await view.webContents.loadURL("about:blank");
    }
  } catch (e) {
    disposeOwlView(managed);
    throw e;
  }
  log("info", `created Owl view ${ctx.id}:${id}`, {
    parentWindowId: managed.parentWindowId,
    webContentsId: view.webContents.id,
    attachMode: managed.attachMode
  });
  return owlViewRef(managed);
}
async function callOwlView(tweakId, id, method, arg, arg2) {
  const view = owlViewFor(tweakId, id);
  if (method === "setBounds") return setOwlViewBounds(view, arg);
  if (method === "setVisible") return setOwlViewVisible(view, Boolean(arg));
  if (method === "bringToFront") return bringOwlViewToFront(view);
  if (method === "loadRoute") {
    const route = normalizeCodexRoute(String(arg));
    const hostId = typeof arg2 === "string" && arg2 ? arg2 : "local";
    return view.view.webContents.loadURL(codexAppUrl(route, hostId));
  }
  if (method === "loadUrl") return view.view.webContents.loadURL(normalizeOwlViewUrl(String(arg)));
  if (method === "dispose") return disposeOwlViewById(tweakId, id);
  throw new Error(`unknown Codex view method: ${method}`);
}
function owlViewRef(view) {
  return {
    id: view.id,
    webContentsId: view.view.webContents.id,
    parentWindowId: view.parentWindowId,
    setBounds: (bounds) => Promise.resolve(setOwlViewBounds(view, bounds)),
    setVisible: (visible) => Promise.resolve(setOwlViewVisible(view, visible)),
    bringToFront: () => Promise.resolve(bringOwlViewToFront(view)),
    loadRoute: (route, hostId) => view.view.webContents.loadURL(codexAppUrl(normalizeCodexRoute(route), hostId || "local")).then(() => {
    }),
    loadUrl: (url) => view.view.webContents.loadURL(normalizeOwlViewUrl(url)).then(() => {
    }),
    dispose: () => Promise.resolve(disposeOwlViewById(view.tweakId, view.id))
  };
}
function attachOwlView(view, parent) {
  const contentView = asRecord4(parent)?.contentView;
  const webContentsView = asRecord4(view.view)?.webContentsView;
  if (typeof asRecord4(parent)?.addBrowserView === "function") {
    callObjectMethod(parent, "addBrowserView", [view.view]);
    view.attachMode = "browserView";
  } else if (typeof asRecord4(contentView)?.addChildView === "function" && webContentsView) {
    try {
      addOwlChildView(parent, view.view);
      view.attachMode = "contentView";
    } catch (e) {
      log("warn", "Owl contentView attachment failed; falling back to BrowserView", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e)
      });
    }
  }
  if (!view.attachMode) {
    throw new Error("Owl view attachment is not available on this Codex window");
  }
  const dispose = () => disposeOwlViewById(view.tweakId, view.id);
  bindWindowEvent(parent, view, "closed", dispose);
  bindWindowEvent(parent, view, "close", dispose);
}
function bringOwlViewToFront(view) {
  if (view.disposed) return;
  const parent = view.parentWindowId === null ? null : import_electron4.BrowserWindow.fromId(view.parentWindowId);
  if (!parent || isWindowDestroyed2(parent)) return;
  const contentView = asRecord4(parent)?.contentView;
  const webContentsView = asRecord4(view.view)?.webContentsView;
  if (view.attachMode === "contentView" && webContentsView) {
    try {
      if (typeof asRecord4(parent)?.setTopBrowserView === "function") {
        callObjectMethod(parent, "setTopBrowserView", [view.view]);
      } else {
        callObjectMethod(contentView, "addChildView", [webContentsView]);
      }
      return;
    } catch (e) {
      log("warn", "Owl contentView bring-to-front failed", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e)
      });
    }
  }
  if (typeof asRecord4(parent)?.setTopBrowserView === "function") {
    callObjectMethod(parent, "setTopBrowserView", [view.view]);
  }
}
function setOwlViewBounds(view, bounds) {
  assertBounds(bounds);
  callObjectMethod(view.view, "setBounds", [bounds]);
  callObjectMethod(asRecord4(view.view)?.webContentsView, "setBounds", [bounds]);
}
function setOwlViewVisible(view, visible) {
  callObjectMethod(asRecord4(view.view)?.webContentsView, "setVisible", [visible]);
}
function disposeOwlViewById(tweakId, id) {
  const view = owlViews.get(owlViewKey(tweakId, id));
  if (!view) return;
  disposeOwlView(view);
}
function disposeOwlViewsForTweak(tweakId) {
  for (const view of [...owlViews.values()]) {
    if (view.tweakId === tweakId) disposeOwlView(view);
  }
}
function disposeAllOwlViews() {
  for (const view of [...owlViews.values()]) disposeOwlView(view);
}
function disposeOwlView(view) {
  if (view.disposed) return;
  view.disposed = true;
  owlViews.delete(view.key);
  for (const dispose of view.disposeBindings.splice(0)) {
    try {
      dispose();
    } catch {
    }
  }
  const parent = view.parentWindowId === null ? null : import_electron4.BrowserWindow.fromId(view.parentWindowId);
  if (parent && !isWindowDestroyed2(parent)) {
    try {
      if (view.attachMode === "contentView") {
        removeOwlChildView(parent, view.view);
      } else if (view.attachMode === "browserView") {
        callObjectMethod(parent, "removeBrowserView", [view.view]);
      }
    } catch (e) {
      log("warn", "Owl view detach failed during dispose", {
        tweakId: view.tweakId,
        viewId: view.id,
        error: String(e)
      });
    }
  }
  try {
    if (!view.view.webContents.isDestroyed()) {
      view.view.webContents.close({ waitForBeforeUnload: false });
    }
  } catch {
  }
}
function owlViewFor(tweakId, id) {
  const view = owlViews.get(owlViewKey(tweakId, id));
  if (!view || view.disposed) throw new Error(`Codex view is not loaded: ${tweakId}:${id}`);
  return view;
}
function owlViewKey(tweakId, viewId) {
  return `${tweakId}:${viewId}`;
}
function addOwlChildView(parent, child) {
  const ownerWindow = asRecord4(child)?.ownerWindow;
  if (ownerWindow && ownerWindow !== parent) {
    callObjectMethod(ownerWindow, "removeBrowserView", [child]);
  }
  callObjectMethod(asRecord4(parent)?.contentView, "addChildView", [asRecord4(child)?.webContentsView]);
  try {
    child.ownerWindow = parent;
  } catch {
  }
  callObjectMethod(asRecord4(child.webContents), "_setOwnerWindow", [parent]);
  const browserViews = asRecord4(parent)?._browserViews;
  if (Array.isArray(browserViews) && !browserViews.includes(child)) {
    browserViews.push(child);
  }
}
function removeOwlChildView(parent, child) {
  callObjectMethod(asRecord4(parent)?.contentView, "removeChildView", [asRecord4(child)?.webContentsView]);
  try {
    child.ownerWindow = null;
  } catch {
  }
  const browserViews = asRecord4(parent)?._browserViews;
  if (Array.isArray(browserViews)) {
    const index = browserViews.indexOf(child);
    if (index >= 0) browserViews.splice(index, 1);
  }
}
async function createCodexBrowserView(opts) {
  const services = getCodexWindowServices();
  const windowManager = services?.windowManager;
  if (!services || !windowManager?.registerWindow) {
    throw new Error(
      "Codex embedded view services are not available. Reinstall Codex++ 1.0.0 or later."
    );
  }
  const route = normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const appearance = opts.appearance || "secondary";
  const view = new import_electron4.BrowserView({
    webPreferences: {
      preload: windowManager.options?.preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      devTools: windowManager.options?.allowDevtools
    }
  });
  const windowLike = makeWindowLikeForView2(view);
  windowManager.registerWindow(windowLike, hostId, false, appearance);
  services.getContext?.(hostId)?.registerWindow?.(windowLike);
  await view.webContents.loadURL(codexAppUrl(route, hostId));
  return view;
}
async function createCodexWindow(opts) {
  const services = getCodexWindowServices();
  if (!services) {
    throw new Error(
      "Codex window services are not available. Reinstall Codex++ 1.0.0 or later."
    );
  }
  const route = normalizeCodexRoute(opts.route);
  const hostId = opts.hostId || "local";
  const parent = typeof opts.parentWindowId === "number" ? import_electron4.BrowserWindow.fromId(opts.parentWindowId) : import_electron4.BrowserWindow.getFocusedWindow();
  const createWindow = services.windowManager?.createWindow;
  let win;
  if (typeof createWindow === "function") {
    win = await createWindow.call(services.windowManager, {
      initialRoute: route,
      hostId,
      show: opts.show !== false,
      appearance: opts.appearance || "secondary",
      parent
    });
  } else if (hostId === "local" && typeof services.createFreshWindow === "function") {
    win = await services.createFreshWindow(route);
  } else if (hostId === "local" && typeof services.createFreshLocalWindow === "function") {
    win = await services.createFreshLocalWindow(route);
  } else if (typeof services.ensureHostWindow === "function") {
    win = await services.ensureHostWindow(hostId);
  }
  if (!win || win.isDestroyed()) {
    throw new Error("Codex did not return a window for the requested route");
  }
  if (opts.bounds) {
    win.setBounds(opts.bounds);
  }
  if (parent && !parent.isDestroyed()) {
    try {
      win.setParentWindow(parent);
    } catch {
    }
  }
  if (opts.show !== false) {
    win.show();
  }
  return {
    windowId: win.id,
    webContentsId: win.webContents.id
  };
}
function makeCodexApi(tweak) {
  const ctx = () => ({ id: tweak.manifest.id, dir: tweak.dir });
  return {
    runtime: {
      getInfo: async () => currentRuntimeInfo(),
      getCapabilities: async () => currentRuntimeCapabilities()
    },
    windows: {
      create: createCodexWindow,
      getPrimary: async () => getPrimaryCodexWindowRef(),
      focus: async (windowId) => focusCodexWindow(windowId),
      show: async (windowId) => showCodexWindow(windowId)
    },
    views: {
      create: async (options) => {
        assertTweakViewPermission(tweak);
        return createOwlView(ctx(), options);
      }
    },
    cdp: {
      getStatus: async () => getCdpStatus(),
      listTargets: async () => listCdpTargets()
    },
    native: {
      loadModule: async (options) => {
        assertTweakPermission(tweak, "native-module");
        return nativeBridge.loadModule(ctx(), options);
      },
      createPanel: async (options) => {
        assertTweakPermission(tweak, "native-view");
        return nativeBridge.createPanel(ctx(), options);
      },
      attachView: async (options) => {
        assertTweakPermission(tweak, "native-view");
        return nativeBridge.attachView(ctx(), options);
      },
      launchHelper: async (options) => {
        assertTweakPermission(tweak, "native-helper");
        return nativeBridge.launchHelper(ctx(), options);
      }
    },
    createBrowserView: createCodexBrowserView,
    createWindow: createCodexWindow
  };
}
function makeWindowLikeForView2(view) {
  const viewBounds = () => view.getBounds();
  return {
    id: view.webContents.id,
    webContents: view.webContents,
    on: (event, listener) => {
      if (event === "closed") {
        view.webContents.once("destroyed", listener);
      } else {
        view.webContents.on(event, listener);
      }
      return view;
    },
    once: (event, listener) => {
      view.webContents.once(event, listener);
      return view;
    },
    off: (event, listener) => {
      view.webContents.off(event, listener);
      return view;
    },
    removeListener: (event, listener) => {
      view.webContents.removeListener(event, listener);
      return view;
    },
    isDestroyed: () => view.webContents.isDestroyed(),
    isFocused: () => view.webContents.isFocused(),
    focus: () => view.webContents.focus(),
    show: () => {
    },
    hide: () => {
    },
    getBounds: viewBounds,
    getContentBounds: viewBounds,
    getSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    getContentSize: () => {
      const b = viewBounds();
      return [b.width, b.height];
    },
    setTitle: () => {
    },
    getTitle: () => "",
    setRepresentedFilename: () => {
    },
    setDocumentEdited: () => {
    },
    setWindowButtonVisibility: () => {
    }
  };
}
function codexAppUrl(route, hostId) {
  const url = new URL("app://-/index.html");
  url.searchParams.set("hostId", hostId);
  if (route !== "/") url.searchParams.set("initialRoute", route);
  return url.toString();
}
function normalizeOwlViewUrl(url) {
  if (typeof url !== "string" || url.includes("\n") || url.includes("\r")) {
    throw new Error("Owl view URL must be a string without control characters");
  }
  const parsed = new URL(url);
  if (!["http:", "https:", "app:", "file:", "data:", "about:"].includes(parsed.protocol)) {
    throw new Error(`unsupported Owl view URL protocol: ${parsed.protocol}`);
  }
  return parsed.toString();
}
function getCodexWindowServices() {
  const services = globalThis[CODEX_WINDOW_SERVICES_KEY];
  return services && typeof services === "object" ? services : null;
}
function normalizeCodexRoute(route) {
  if (typeof route !== "string" || !route.startsWith("/")) {
    throw new Error("Codex route must be an absolute app route");
  }
  if (route.includes("://") || route.includes("\n") || route.includes("\r")) {
    throw new Error("Codex route must not include a protocol or control characters");
  }
  return route;
}
function asRecord4(value) {
  return value && typeof value === "object" ? value : null;
}
function callObjectMethod(target, method, args) {
  const fn = asRecord4(target)?.[method];
  if (typeof fn !== "function") return void 0;
  return fn.apply(target, args);
}
function isWindowDestroyed2(win) {
  if (!win) return true;
  const fn = asRecord4(win)?.isDestroyed;
  if (typeof fn !== "function") return false;
  try {
    return Boolean(fn.call(win));
  } catch {
    return true;
  }
}
function windowIdFor2(win) {
  const id = asRecord4(win)?.id;
  return typeof id === "number" ? id : null;
}
function bindWindowEvent(win, view, event, listener) {
  const on = asRecord4(win)?.on;
  const off = asRecord4(win)?.off;
  if (typeof on !== "function") return;
  on.call(win, event, listener);
  view.disposeBindings.push(() => {
    if (typeof off === "function") off.call(win, event, listener);
    else callObjectMethod(win, "removeListener", [event, listener]);
  });
}
function assertBridgeId2(value, label) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`${label} may only contain letters, numbers, dots, underscores, and dashes`);
  }
  return value;
}
function assertBounds(bounds) {
  const values = [bounds?.x, bounds?.y, bounds?.width, bounds?.height];
  if (!values.every((value) => typeof value === "number" && Number.isFinite(value))) {
    throw new Error("bounds must contain finite x, y, width, and height numbers");
  }
  if (bounds.width < 0 || bounds.height < 0) {
    throw new Error("bounds width and height must be non-negative");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  postUpdateRepairScript
});
/*! Bundled license information:

chokidar/esm/index.js:
  (*! chokidar - MIT License (c) 2012 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21haW4udHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nob2tpZGFyL2VzbS9pbmRleC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVhZGRpcnAvZXNtL2luZGV4LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jaG9raWRhci9lc20vaGFuZGxlci5qcyIsICIuLi9zcmMvdHdlYWstZGlzY292ZXJ5LnRzIiwgIi4uL3NyYy9zdG9yYWdlLnRzIiwgIi4uL3NyYy9tY3Atc3luYy50cyIsICIuLi9zcmMvd2F0Y2hlci1oZWFsdGgudHMiLCAiLi4vc3JjL3R3ZWFrLWxpZmVjeWNsZS50cyIsICIuLi9zcmMvbG9nZ2luZy50cyIsICIuLi9zcmMvY29kZXgtcnVudGltZS1wcm9iZS50cyIsICIuLi9zcmMvbmF0aXZlLWJyaWRnZS50cyIsICIuLi9zcmMvbmF0aXZlLXBhdGhzLnRzIiwgIi4uL3NyYy90d2Vhay1zdG9yZS50cyIsICIuLi9zcmMvYnJvd3Nlci11aS50cyIsICIuLi9zcmMvdmVyc2lvbi11dGlscy50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUtY29tcGF0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIE1haW4tcHJvY2VzcyBib290c3RyYXAuIExvYWRlZCBieSB0aGUgYXNhciBsb2FkZXIgYmVmb3JlIENvZGV4J3Mgb3duXG4gKiBtYWluIHByb2Nlc3MgY29kZSBydW5zLiBXZSBob29rIGBCcm93c2VyV2luZG93YCBzbyBldmVyeSB3aW5kb3cgQ29kZXhcbiAqIGNyZWF0ZXMgZ2V0cyBvdXIgcHJlbG9hZCBzY3JpcHQgYXR0YWNoZWQuIFdlIGFsc28gc3RhbmQgdXAgYW4gSVBDXG4gKiBjaGFubmVsIGZvciB0d2Vha3MgdG8gdGFsayB0byB0aGUgbWFpbiBwcm9jZXNzLlxuICpcbiAqIFdlIGFyZSBpbiBDSlMgbGFuZCBoZXJlIChtYXRjaGVzIEVsZWN0cm9uJ3MgbWFpbiBwcm9jZXNzIGFuZCBDb2RleCdzIG93blxuICogY29kZSkuIFRoZSByZW5kZXJlci1zaWRlIHJ1bnRpbWUgaXMgYnVuZGxlZCBzZXBhcmF0ZWx5IGludG8gcHJlbG9hZC5qcy5cbiAqL1xuaW1wb3J0IHsgYXBwLCBCcm93c2VyVmlldywgQnJvd3NlcldpbmRvdywgY2xpcGJvYXJkLCBpcGNNYWluLCBzZXNzaW9uLCBzaGVsbCwgd2ViQ29udGVudHMgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGNwU3luYywgZXhpc3RzU3luYywgbWtkaXJTeW5jLCBta2R0ZW1wU3luYywgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgcmVhbHBhdGhTeW5jLCBybVN5bmMsIHN0YXRTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGV4ZWNGaWxlU3luYywgc3Bhd24sIHNwYXduU3luYyB9IGZyb20gXCJub2RlOmNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2gsIHJhbmRvbUludCwgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBob21lZGlyLCB0bXBkaXIgfSBmcm9tIFwibm9kZTpvc1wiO1xuaW1wb3J0IGNob2tpZGFyIGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IHsgZGlzY292ZXJUd2Vha3MsIHR5cGUgRGlzY292ZXJlZFR3ZWFrIH0gZnJvbSBcIi4vdHdlYWstZGlzY292ZXJ5XCI7XG5pbXBvcnQgeyBjcmVhdGVEaXNrU3RvcmFnZSwgdHlwZSBEaXNrU3RvcmFnZSB9IGZyb20gXCIuL3N0b3JhZ2VcIjtcbmltcG9ydCB7IHN5bmNNYW5hZ2VkTWNwU2VydmVycyB9IGZyb20gXCIuL21jcC1zeW5jXCI7XG5pbXBvcnQgeyBnZXRXYXRjaGVySGVhbHRoIH0gZnJvbSBcIi4vd2F0Y2hlci1oZWFsdGhcIjtcbmltcG9ydCB7XG4gIGlzTWFpblByb2Nlc3NUd2Vha1Njb3BlLFxuICByZWxvYWRUd2Vha3MsXG4gIHNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZCxcbn0gZnJvbSBcIi4vdHdlYWstbGlmZWN5Y2xlXCI7XG5pbXBvcnQgeyBhcHBlbmRDYXBwZWRMb2cgfSBmcm9tIFwiLi9sb2dnaW5nXCI7XG5pbXBvcnQge1xuICBnZXRDZHBTdGF0dXMsXG4gIGdldFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIGdldFJ1bnRpbWVJbmZvLFxuICBsaXN0Q2RwVGFyZ2V0cyxcbn0gZnJvbSBcIi4vY29kZXgtcnVudGltZS1wcm9iZVwiO1xuaW1wb3J0IHsgTmF0aXZlQnJpZGdlLCB0eXBlIE5hdGl2ZVR3ZWFrQ29udGV4dCB9IGZyb20gXCIuL25hdGl2ZS1icmlkZ2VcIjtcbmltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgQ29kZXhSdW50aW1lSW5mbyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIENvZGV4TW9kZWxPYmplY3RSZXN1bHQsXG4gIENvZGV4TW9kZWxSZWFzb25pbmdFZmZvcnQsXG4gIENvZGV4TW9kZWxUZXh0UmVzdWx0LFxuICBDb2RleFZpZXdDcmVhdGVPcHRpb25zLFxuICBDb2RleFZpZXdSZWYsXG4gIENvZGV4V2luZG93UmVmLFxuICBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zLFxuICBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucyxcbiAgTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zLFxuICBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucyxcbiAgVHdlYWtQZXJtaXNzaW9uLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9UV0VBS19TVE9SRV9JTkRFWF9VUkwsXG4gIG5vcm1hbGl6ZUdpdEh1YlJlcG8sXG4gIG5vcm1hbGl6ZVN0b3JlUmVnaXN0cnksXG4gIHNodWZmbGVTdG9yZUVudHJpZXMsXG4gIHN0b3JlQXJjaGl2ZVVybCxcbiAgdHlwZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24sXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVSZWdpc3RyeSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmVcIjtcbmltcG9ydCB7IG1heWJlU3RhcnRCcm93c2VyVWlTZXJ2ZXIgfSBmcm9tIFwiLi9icm93c2VyLXVpXCI7XG5pbXBvcnQgeyBjb21wYXJlVmVyc2lvbnMsIG5vcm1hbGl6ZVZlcnNpb24gfSBmcm9tIFwiLi92ZXJzaW9uLXV0aWxzXCI7XG5pbXBvcnQge1xuICBhc3NlcnRTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmxlLFxuICBhc3NlcnRTdG9yZUVudHJ5UnVudGltZUNvbXBhdGlibGUsXG4gIHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHksXG4gIHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmUtY29tcGF0XCI7XG5cbmNvbnN0IHVzZXJSb290ID0gcHJvY2Vzcy5lbnYuQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UO1xuY29uc3QgcnVudGltZURpciA9IHByb2Nlc3MuZW52LkNPREVYX1BMVVNQTFVTX1JVTlRJTUU7XG5cbmlmICghdXNlclJvb3QgfHwgIXJ1bnRpbWVEaXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiY29kZXgtcGx1c3BsdXMgcnVudGltZSBzdGFydGVkIHdpdGhvdXQgQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UL1JVTlRJTUUgZW52c1wiLFxuICApO1xufVxuXG5jb25zdCBQUkVMT0FEX1BBVEggPSByZXNvbHZlKHJ1bnRpbWVEaXIsIFwicHJlbG9hZC5qc1wiKTtcbmNvbnN0IFRXRUFLU19ESVIgPSBqb2luKHVzZXJSb290LCBcInR3ZWFrc1wiKTtcbmNvbnN0IExPR19ESVIgPSBqb2luKHVzZXJSb290LCBcImxvZ1wiKTtcbmNvbnN0IExPR19GSUxFID0gam9pbihMT0dfRElSLCBcIm1haW4ubG9nXCIpO1xuY29uc3QgQ09ORklHX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcImNvbmZpZy5qc29uXCIpO1xuY29uc3QgQ09ERVhfQ09ORklHX0ZJTEUgPSBqb2luKHByb2Nlc3MuZW52LkNPREVYX0hPTUUgfHwgam9pbihob21lZGlyKCksIFwiLmNvZGV4XCIpLCBcImNvbmZpZy50b21sXCIpO1xuY29uc3QgSU5TVEFMTEVSX1NUQVRFX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcInN0YXRlLmpzb25cIik7XG5jb25zdCBVUERBVEVfTU9ERV9GSUxFID0gam9pbih1c2VyUm9vdCwgXCJ1cGRhdGUtbW9kZS5qc29uXCIpO1xuY29uc3QgU0VMRl9VUERBVEVfU1RBVEVfRklMRSA9IGpvaW4odXNlclJvb3QsIFwic2VsZi11cGRhdGUtc3RhdGUuanNvblwiKTtcbmNvbnN0IFNJR05FRF9DT0RFWF9CQUNLVVAgPSBqb2luKHVzZXJSb290LCBcImJhY2t1cFwiLCBcIkNvZGV4LmFwcFwiKTtcbmNvbnN0IENPREVYX1BMVVNQTFVTX0NMSV9TSElNID0gam9pbih1c2VyUm9vdCwgXCJiaW5cIiwgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiID8gXCJjb2RleHBsdXNwbHVzLmNtZFwiIDogXCJjb2RleHBsdXNwbHVzXCIpO1xuY29uc3QgUE9TVF9VUERBVEVfUkVQQUlSX0xPR19GSUxFID0gam9pbihMT0dfRElSLCBcInBvc3QtdXBkYXRlLXJlcGFpci5sb2dcIik7XG5jb25zdCBDT0RFWF9QTFVTUExVU19WRVJTSU9OID0gXCIxLjAuNlwiO1xuY29uc3QgQ09ERVhfUExVU1BMVVNfUkVQTyA9IFwia3BraHhsZ3kwL2NvZGV4LXBsdXNwbHVzXCI7XG5jb25zdCBUV0VBS19TVE9SRV9JTkRFWF9VUkwgPSBwcm9jZXNzLmVudi5DT0RFWF9QTFVTUExVU19TVE9SRV9JTkRFWF9VUkwgPz8gREVGQVVMVF9UV0VBS19TVE9SRV9JTkRFWF9VUkw7XG5jb25zdCBDT0RFWF9XSU5ET1dfU0VSVklDRVNfS0VZID0gXCJfX2NvZGV4cHBfd2luZG93X3NlcnZpY2VzX19cIjtcbmNvbnN0IERFQlVHX1dFQl9DT05URU5UU19MT0cgPSBwcm9jZXNzLmVudi5DT0RFWFBQX0RFQlVHX1dFQl9DT05URU5UUyA9PT0gXCIxXCI7XG5jb25zdCBERVNLVE9QX01FU1NBR0VfRlJPTV9WSUVXID0gXCJjb2RleF9kZXNrdG9wOm1lc3NhZ2UtZnJvbS12aWV3XCI7XG5cbnR5cGUgTWVzc2FnZUZyb21WaWV3Q29udGV4dCA9IHsgc2VuZGVySWQ/OiBudW1iZXI7IHNlbmRlclVybD86IHN0cmluZyB9O1xudHlwZSBNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lciA9IChcbiAgbWVzc2FnZTogdW5rbm93bixcbiAgY29udGV4dDogTWVzc2FnZUZyb21WaWV3Q29udGV4dCxcbikgPT4gdW5rbm93biB8IHVuZGVmaW5lZDtcbnR5cGUgTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lciA9IChcbiAgbWVzc2FnZTogdW5rbm93bixcbiAgcmVzcG9uc2U6IHVua25vd24sXG4gIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQsXG4pID0+IHZvaWQ7XG5cbmNvbnN0IG1haW5NZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMgPSBuZXcgU2V0PE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyPigpO1xuY29uc3QgbWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzID0gbmV3IFNldDxNZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVyPigpO1xuXG5ta2RpclN5bmMoTE9HX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5ta2RpclN5bmMoVFdFQUtTX0RJUiwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG5pbnN0YWxsTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtSG9vaygpO1xuXG4vLyBPcHRpb25hbDogZW5hYmxlIENocm9tZSBEZXZUb29scyBQcm90b2NvbCBvbiBhIFRDUCBwb3J0IHNvIHdlIGNhbiBkcml2ZSB0aGVcbi8vIHJ1bm5pbmcgQ29kZXggZnJvbSBvdXRzaWRlIChjdXJsIGh0dHA6Ly9sb2NhbGhvc3Q6PHBvcnQ+L2pzb24sIGF0dGFjaCB2aWFcbi8vIENEUCBXZWJTb2NrZXQsIHRha2Ugc2NyZWVuc2hvdHMsIGV2YWx1YXRlIGluIHJlbmRlcmVyLCBldGMuKS4gQ29kZXgnc1xuLy8gcHJvZHVjdGlvbiBidWlsZCBzZXRzIHdlYlByZWZlcmVuY2VzLmRldlRvb2xzPWZhbHNlLCB3aGljaCBraWxscyB0aGVcbi8vIGluLXdpbmRvdyBEZXZUb29scyBzaG9ydGN1dCwgYnV0IGAtLXJlbW90ZS1kZWJ1Z2dpbmctcG9ydGAgd29ya3MgcmVnYXJkbGVzc1xuLy8gYmVjYXVzZSBpdCdzIGEgQ2hyb21pdW0gY29tbWFuZC1saW5lIHN3aXRjaCBwcm9jZXNzZWQgYmVmb3JlIGFwcCBpbml0LlxuLy9cbi8vIE9mZiBieSBkZWZhdWx0LiBTZXQgQ09ERVhQUF9SRU1PVEVfREVCVUc9MSAob3B0aW9uYWxseSBDT0RFWFBQX1JFTU9URV9ERUJVR19QT1JUKVxuLy8gdG8gdHVybiBpdCBvbi4gTXVzdCBiZSBhcHBlbmRlZCBiZWZvcmUgYGFwcGAgYmVjb21lcyByZWFkeTsgd2UncmUgYXQgbW9kdWxlXG4vLyB0b3AtbGV2ZWwgc28gdGhhdCdzIGZpbmUuXG5pZiAocHJvY2Vzcy5lbnYuQ09ERVhQUF9SRU1PVEVfREVCVUcgPT09IFwiMVwiKSB7XG4gIGNvbnN0IHBvcnQgPSBwcm9jZXNzLmVudi5DT0RFWFBQX1JFTU9URV9ERUJVR19QT1JUID8/IFwiOTIyMlwiO1xuICBhcHAuY29tbWFuZExpbmUuYXBwZW5kU3dpdGNoKFwicmVtb3RlLWRlYnVnZ2luZy1wb3J0XCIsIHBvcnQpO1xuICBsb2coXCJpbmZvXCIsIGByZW1vdGUgZGVidWdnaW5nIGVuYWJsZWQgb24gcG9ydCAke3BvcnR9YCk7XG59XG5cbmludGVyZmFjZSBQZXJzaXN0ZWRTdGF0ZSB7XG4gIGNvZGV4UGx1c1BsdXM/OiB7XG4gICAgYXV0b1VwZGF0ZT86IGJvb2xlYW47XG4gICAgc2FmZU1vZGU/OiBib29sZWFuO1xuICAgIHVwZGF0ZUNoYW5uZWw/OiBTZWxmVXBkYXRlQ2hhbm5lbDtcbiAgICB1cGRhdGVSZXBvPzogc3RyaW5nO1xuICAgIHVwZGF0ZVJlZj86IHN0cmluZztcbiAgICB1cGRhdGVDaGVjaz86IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjaztcbiAgfTtcbiAgLyoqIFBlci10d2VhayBlbmFibGUgZmxhZ3MuIE1pc3NpbmcgZW50cmllcyBkZWZhdWx0IHRvIGVuYWJsZWQuICovXG4gIHR3ZWFrcz86IFJlY29yZDxzdHJpbmcsIHsgZW5hYmxlZD86IGJvb2xlYW4gfT47XG4gIC8qKiBDYWNoZWQgR2l0SHViIHJlbGVhc2UgY2hlY2tzLiBSdW50aW1lIG5ldmVyIGF1dG8taW5zdGFsbHMgdXBkYXRlcy4gKi9cbiAgdHdlYWtVcGRhdGVDaGVja3M/OiBSZWNvcmQ8c3RyaW5nLCBUd2Vha1VwZGF0ZUNoZWNrPjtcbn1cblxuaW50ZXJmYWNlIENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICBsYXRlc3RWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7XG4gIHVwZGF0ZUF2YWlsYWJsZTogYm9vbGVhbjtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbnR5cGUgU2VsZlVwZGF0ZUNoYW5uZWwgPSBcInN0YWJsZVwiIHwgXCJwcmVyZWxlYXNlXCIgfCBcImN1c3RvbVwiO1xudHlwZSBTZWxmVXBkYXRlU3RhdHVzID0gXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG5cbmludGVyZmFjZSBTZWxmVXBkYXRlU3RhdGUge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7XG4gIHN0YXR1czogU2VsZlVwZGF0ZVN0YXR1cztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgdGFyZ2V0UmVmOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICByZXBvOiBzdHJpbmc7XG4gIGNoYW5uZWw6IFNlbGZVcGRhdGVDaGFubmVsO1xuICBzb3VyY2VSb290OiBzdHJpbmc7XG4gIGluc3RhbGxhdGlvblNvdXJjZT86IEluc3RhbGxhdGlvblNvdXJjZTtcbiAgZXJyb3I/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnN0YWxsYXRpb25Tb3VyY2Uge1xuICBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiB8IFwiaG9tZWJyZXdcIiB8IFwibG9jYWwtZGV2XCIgfCBcInNvdXJjZS1hcmNoaXZlXCIgfCBcInVua25vd25cIjtcbiAgbGFiZWw6IHN0cmluZztcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUd2Vha1VwZGF0ZUNoZWNrIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIHJlcG86IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsO1xuICByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiByZWFkU3RhdGUoKTogUGVyc2lzdGVkU3RhdGUge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhDT05GSUdfRklMRSwgXCJ1dGY4XCIpKSBhcyBQZXJzaXN0ZWRTdGF0ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHt9O1xuICB9XG59XG5mdW5jdGlvbiB3cml0ZVN0YXRlKHM6IFBlcnNpc3RlZFN0YXRlKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgd3JpdGVGaWxlU3luYyhDT05GSUdfRklMRSwgSlNPTi5zdHJpbmdpZnkocywgbnVsbCwgMikpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nKFwid2FyblwiLCBcIndyaXRlU3RhdGUgZmFpbGVkOlwiLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UpKTtcbiAgfVxufVxuZnVuY3Rpb24gaXNDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZUVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiByZWFkU3RhdGUoKS5jb2RleFBsdXNQbHVzPy5hdXRvVXBkYXRlICE9PSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHNldENvZGV4UGx1c1BsdXNBdXRvVXBkYXRlKGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgcyA9IHJlYWRTdGF0ZSgpO1xuICBzLmNvZGV4UGx1c1BsdXMgPz89IHt9O1xuICBzLmNvZGV4UGx1c1BsdXMuYXV0b1VwZGF0ZSA9IGVuYWJsZWQ7XG4gIHdyaXRlU3RhdGUocyk7XG59XG5mdW5jdGlvbiBzZXRDb2RleFBsdXNQbHVzVXBkYXRlQ29uZmlnKGNvbmZpZzoge1xuICB1cGRhdGVDaGFubmVsPzogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG8/OiBzdHJpbmc7XG4gIHVwZGF0ZVJlZj86IHN0cmluZztcbn0pOiB2b2lkIHtcbiAgY29uc3QgcyA9IHJlYWRTdGF0ZSgpO1xuICBzLmNvZGV4UGx1c1BsdXMgPz89IHt9O1xuICBpZiAoY29uZmlnLnVwZGF0ZUNoYW5uZWwpIHMuY29kZXhQbHVzUGx1cy51cGRhdGVDaGFubmVsID0gY29uZmlnLnVwZGF0ZUNoYW5uZWw7XG4gIGlmIChcInVwZGF0ZVJlcG9cIiBpbiBjb25maWcpIHMuY29kZXhQbHVzUGx1cy51cGRhdGVSZXBvID0gY2xlYW5PcHRpb25hbFN0cmluZyhjb25maWcudXBkYXRlUmVwbyk7XG4gIGlmIChcInVwZGF0ZVJlZlwiIGluIGNvbmZpZykgcy5jb2RleFBsdXNQbHVzLnVwZGF0ZVJlZiA9IGNsZWFuT3B0aW9uYWxTdHJpbmcoY29uZmlnLnVwZGF0ZVJlZik7XG4gIHdyaXRlU3RhdGUocyk7XG59XG5mdW5jdGlvbiBpc0NvZGV4UGx1c1BsdXNTYWZlTW9kZUVuYWJsZWQoKTogYm9vbGVhbiB7XG4gIHJldHVybiByZWFkU3RhdGUoKS5jb2RleFBsdXNQbHVzPy5zYWZlTW9kZSA9PT0gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGlzVHdlYWtFbmFibGVkKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcyA9IHJlYWRTdGF0ZSgpO1xuICBpZiAocy5jb2RleFBsdXNQbHVzPy5zYWZlTW9kZSA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gcy50d2Vha3M/LltpZF0/LmVuYWJsZWQgIT09IGZhbHNlO1xufVxuZnVuY3Rpb24gc2V0VHdlYWtFbmFibGVkKGlkOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pOiB2b2lkIHtcbiAgY29uc3QgcyA9IHJlYWRTdGF0ZSgpO1xuICBzLnR3ZWFrcyA/Pz0ge307XG4gIHMudHdlYWtzW2lkXSA9IHsgLi4ucy50d2Vha3NbaWRdLCBlbmFibGVkIH07XG4gIHdyaXRlU3RhdGUocyk7XG59XG5cbmludGVyZmFjZSBJbnN0YWxsZXJTdGF0ZSB7XG4gIGFwcFJvb3Q6IHN0cmluZztcbiAgY29kZXhWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBzb3VyY2VSb290Pzogc3RyaW5nO1xufVxuXG5mdW5jdGlvbiByZWFkSW5zdGFsbGVyU3RhdGUoKTogSW5zdGFsbGVyU3RhdGUgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoSU5TVEFMTEVSX1NUQVRFX0ZJTEUsIFwidXRmOFwiKSkgYXMgSW5zdGFsbGVyU3RhdGU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRTZWxmVXBkYXRlU3RhdGUoKTogU2VsZlVwZGF0ZVN0YXRlIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKFNFTEZfVVBEQVRFX1NUQVRFX0ZJTEUsIFwidXRmOFwiKSkgYXMgU2VsZlVwZGF0ZVN0YXRlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuZnVuY3Rpb24gd3JpdGVTZWxmVXBkYXRlU3RhdGUoc3RhdGU6IFNlbGZVcGRhdGVTdGF0ZSk6IHZvaWQge1xuICB0cnkge1xuICAgIHdyaXRlRmlsZVN5bmMoU0VMRl9VUERBVEVfU1RBVEVfRklMRSwgSlNPTi5zdHJpbmdpZnkoc3RhdGUsIG51bGwsIDIpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJ3cml0ZVNlbGZVcGRhdGVTdGF0ZSBmYWlsZWQ6XCIsIFN0cmluZygoZSBhcyBFcnJvcikubWVzc2FnZSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNsZWFuT3B0aW9uYWxTdHJpbmcodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICByZXR1cm4gdHJpbW1lZCA/IHRyaW1tZWQgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGlzUGF0aEluc2lkZShwYXJlbnQ6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcmVsID0gcmVsYXRpdmUocmVzb2x2ZShwYXJlbnQpLCByZXNvbHZlKHRhcmdldCkpO1xuICByZXR1cm4gcmVsID09PSBcIlwiIHx8ICghIXJlbCAmJiAhcmVsLnN0YXJ0c1dpdGgoXCIuLlwiKSAmJiAhaXNBYnNvbHV0ZShyZWwpKTtcbn1cblxuZnVuY3Rpb24gbG9nKGxldmVsOiBcImluZm9cIiB8IFwid2FyblwiIHwgXCJlcnJvclwiLCAuLi5hcmdzOiB1bmtub3duW10pOiB2b2lkIHtcbiAgY29uc3QgbGluZSA9IGBbJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XSBbJHtsZXZlbH1dICR7YXJnc1xuICAgIC5tYXAoKGEpID0+ICh0eXBlb2YgYSA9PT0gXCJzdHJpbmdcIiA/IGEgOiBKU09OLnN0cmluZ2lmeShhKSkpXG4gICAgLmpvaW4oXCIgXCIpfVxcbmA7XG4gIHRyeSB7XG4gICAgYXBwZW5kQ2FwcGVkTG9nKExPR19GSUxFLCBsaW5lKTtcbiAgfSBjYXRjaCB7fVxuICBpZiAobGV2ZWwgPT09IFwiZXJyb3JcIikgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c11cIiwgLi4uYXJncyk7XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxTcGFya2xlVXBkYXRlSG9vaygpOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09IFwiZGFyd2luXCIpIHJldHVybjtcblxuICBjb25zdCBNb2R1bGUgPSByZXF1aXJlKFwibm9kZTptb2R1bGVcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6bW9kdWxlXCIpICYge1xuICAgIF9sb2FkPzogKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50OiB1bmtub3duLCBpc01haW46IGJvb2xlYW4pID0+IHVua25vd247XG4gIH07XG4gIGNvbnN0IG9yaWdpbmFsTG9hZCA9IE1vZHVsZS5fbG9hZDtcbiAgaWYgKHR5cGVvZiBvcmlnaW5hbExvYWQgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuO1xuXG4gIE1vZHVsZS5fbG9hZCA9IGZ1bmN0aW9uIGNvZGV4UGx1c1BsdXNNb2R1bGVMb2FkKHJlcXVlc3Q6IHN0cmluZywgcGFyZW50OiB1bmtub3duLCBpc01haW46IGJvb2xlYW4pIHtcbiAgICBjb25zdCBsb2FkZWQgPSBvcmlnaW5hbExvYWQuYXBwbHkodGhpcywgW3JlcXVlc3QsIHBhcmVudCwgaXNNYWluXSkgYXMgdW5rbm93bjtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3QgPT09IFwic3RyaW5nXCIgJiYgL3NwYXJrbGUoPzpcXC5ub2RlKT8kL2kudGVzdChyZXF1ZXN0KSkge1xuICAgICAgd3JhcFNwYXJrbGVFeHBvcnRzKGxvYWRlZCk7XG4gICAgfVxuICAgIHJldHVybiBsb2FkZWQ7XG4gIH07XG59XG5cbmZ1bmN0aW9uIHdyYXBTcGFya2xlRXhwb3J0cyhsb2FkZWQ6IHVua25vd24pOiB2b2lkIHtcbiAgaWYgKCFsb2FkZWQgfHwgdHlwZW9mIGxvYWRlZCAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICBjb25zdCBleHBvcnRzID0gbG9hZGVkIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ICYgeyBfX2NvZGV4cHBTcGFya2xlV3JhcHBlZD86IGJvb2xlYW4gfTtcbiAgaWYgKGV4cG9ydHMuX19jb2RleHBwU3BhcmtsZVdyYXBwZWQpIHJldHVybjtcbiAgZXhwb3J0cy5fX2NvZGV4cHBTcGFya2xlV3JhcHBlZCA9IHRydWU7XG5cbiAgZm9yIChjb25zdCBuYW1lIG9mIFtcImluc3RhbGxVcGRhdGVzSWZBdmFpbGFibGVcIl0pIHtcbiAgICBjb25zdCBmbiA9IGV4cG9ydHNbbmFtZV07XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSBjb250aW51ZTtcbiAgICBleHBvcnRzW25hbWVdID0gZnVuY3Rpb24gY29kZXhQbHVzUGx1c1NwYXJrbGVXcmFwcGVyKHRoaXM6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkge1xuICAgICAgcHJlcGFyZVNpZ25lZENvZGV4Rm9yU3BhcmtsZUluc3RhbGwoKTtcbiAgICAgIHJldHVybiBSZWZsZWN0LmFwcGx5KGZuLCB0aGlzLCBhcmdzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKGV4cG9ydHMuZGVmYXVsdCAmJiBleHBvcnRzLmRlZmF1bHQgIT09IGV4cG9ydHMpIHtcbiAgICB3cmFwU3BhcmtsZUV4cG9ydHMoZXhwb3J0cy5kZWZhdWx0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwcmVwYXJlU2lnbmVkQ29kZXhGb3JTcGFya2xlSW5zdGFsbCgpOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09IFwiZGFyd2luXCIpIHJldHVybjtcbiAgaWYgKGV4aXN0c1N5bmMoVVBEQVRFX01PREVfRklMRSkpIHtcbiAgICBsb2coXCJpbmZvXCIsIFwiU3BhcmtsZSB1cGRhdGUgcHJlcCBza2lwcGVkOyB1cGRhdGUgbW9kZSBhbHJlYWR5IGFjdGl2ZVwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFleGlzdHNTeW5jKFNJR05FRF9DT0RFWF9CQUNLVVApKSB7XG4gICAgbG9nKFwid2FyblwiLCBcIlNwYXJrbGUgdXBkYXRlIHByZXAgc2tpcHBlZDsgc2lnbmVkIENvZGV4LmFwcCBiYWNrdXAgaXMgbWlzc2luZ1wiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFpc0RldmVsb3BlcklkU2lnbmVkQXBwKFNJR05FRF9DT0RFWF9CQUNLVVApKSB7XG4gICAgbG9nKFwid2FyblwiLCBcIlNwYXJrbGUgdXBkYXRlIHByZXAgc2tpcHBlZDsgQ29kZXguYXBwIGJhY2t1cCBpcyBub3QgRGV2ZWxvcGVyIElEIHNpZ25lZFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IHJlYWRJbnN0YWxsZXJTdGF0ZSgpO1xuICBjb25zdCBhcHBSb290ID0gc3RhdGU/LmFwcFJvb3QgPz8gaW5mZXJNYWNBcHBSb290KCk7XG4gIGlmICghYXBwUm9vdCkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJTcGFya2xlIHVwZGF0ZSBwcmVwIHNraXBwZWQ7IGNvdWxkIG5vdCBpbmZlciBDb2RleC5hcHAgcGF0aFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBtb2RlID0ge1xuICAgIGVuYWJsZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIGFwcFJvb3QsXG4gICAgY29kZXhWZXJzaW9uOiBzdGF0ZT8uY29kZXhWZXJzaW9uID8/IG51bGwsXG4gIH07XG4gIHdyaXRlRmlsZVN5bmMoVVBEQVRFX01PREVfRklMRSwgSlNPTi5zdHJpbmdpZnkobW9kZSwgbnVsbCwgMikpO1xuICBzdGFydFBvc3RVcGRhdGVSZXBhaXJNb25pdG9yKCk7XG5cbiAgdHJ5IHtcbiAgICBleGVjRmlsZVN5bmMoXCJkaXR0b1wiLCBbU0lHTkVEX0NPREVYX0JBQ0tVUCwgYXBwUm9vdF0sIHsgc3RkaW86IFwiaWdub3JlXCIgfSk7XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNGaWxlU3luYyhcInhhdHRyXCIsIFtcIi1kclwiLCBcImNvbS5hcHBsZS5xdWFyYW50aW5lXCIsIGFwcFJvb3RdLCB7IHN0ZGlvOiBcImlnbm9yZVwiIH0pO1xuICAgIH0gY2F0Y2gge31cbiAgICBsb2coXCJpbmZvXCIsIFwiUmVzdG9yZWQgc2lnbmVkIENvZGV4LmFwcCBiZWZvcmUgU3BhcmtsZSBpbnN0YWxsXCIsIHsgYXBwUm9vdCB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcImVycm9yXCIsIFwiRmFpbGVkIHRvIHJlc3RvcmUgc2lnbmVkIENvZGV4LmFwcCBiZWZvcmUgU3BhcmtsZSBpbnN0YWxsXCIsIHtcbiAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0UG9zdFVwZGF0ZVJlcGFpck1vbml0b3IoKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcImRhcndpblwiKSByZXR1cm47XG4gIGlmICghZXhpc3RzU3luYyhDT0RFWF9QTFVTUExVU19DTElfU0hJTSkpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwiUG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3Igc2tpcHBlZDsgQ29kZXgrKyBDTEkgc2hpbSBpcyBtaXNzaW5nXCIsIHtcbiAgICAgIHNoaW06IENPREVYX1BMVVNQTFVTX0NMSV9TSElNLFxuICAgIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgY2hpbGQgPSBzcGF3bihcIi9iaW4vc2hcIiwgW1wiLWNcIiwgYCR7cG9zdFVwZGF0ZVJlcGFpclNjcmlwdCgpfSA+PiAke3NoZWxsUXVvdGUoUE9TVF9VUERBVEVfUkVQQUlSX0xPR19GSUxFKX0gMj4mMWBdLCB7XG4gICAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgIH0pO1xuICAgIGNoaWxkLnVucmVmKCk7XG4gICAgbG9nKFwiaW5mb1wiLCBcIlN0YXJ0ZWQgQ29kZXgrKyBwb3N0LXVwZGF0ZSByZXBhaXIgbW9uaXRvclwiLCB7XG4gICAgICBsb2c6IFBPU1RfVVBEQVRFX1JFUEFJUl9MT0dfRklMRSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJQb3N0LXVwZGF0ZSByZXBhaXIgbW9uaXRvciBmYWlsZWQgdG8gc3RhcnRcIiwge1xuICAgICAgbWVzc2FnZTogKGUgYXMgRXJyb3IpLm1lc3NhZ2UsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBvc3RVcGRhdGVSZXBhaXJTY3JpcHQoKTogc3RyaW5nIHtcbiAgY29uc3QgcmVwYWlyQ29tbWFuZCA9IFtcbiAgICBcIkNPREVYX1BMVVNQTFVTX1dBVENIRVI9MVwiLFxuICAgIHNoZWxsUXVvdGUoQ09ERVhfUExVU1BMVVNfQ0xJX1NISU0pLFxuICAgIFwicmVwYWlyXCIsXG4gICAgXCItLXdhdGNoZXJcIixcbiAgICBcIi0tcXVpZXRcIixcbiAgICBcIi0tbG9jYWxcIixcbiAgXS5qb2luKFwiIFwiKTtcbiAgY29uc3QgZG9jdG9yQ29tbWFuZCA9IGAke3NoZWxsUXVvdGUoQ09ERVhfUExVU1BMVVNfQ0xJX1NISU0pfSBkb2N0b3IgPi9kZXYvbnVsbCAyPiYxYDtcbiAgcmV0dXJuIFtcbiAgICBcInNldCAtdVwiLFxuICAgIGBlY2hvIFwiWyQoZGF0ZSldIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3Igc3RhcnRlZFwiYCxcbiAgICBcInNsZWVwIDIwXCIsXG4gICAgXCJkZWFkbGluZT0kKCggJChkYXRlICslcykgKyA5MDAgKSlcIixcbiAgICBcIndoaWxlIFsgJChkYXRlICslcykgLWx0ICRkZWFkbGluZSBdOyBkb1wiLFxuICAgIGAgICR7cmVwYWlyQ29tbWFuZH0gfHwgdHJ1ZWAsXG4gICAgYCAgaWYgWyAhIC1mICR7c2hlbGxRdW90ZShVUERBVEVfTU9ERV9GSUxFKX0gXSAmJiAke2RvY3RvckNvbW1hbmR9OyB0aGVuYCxcbiAgICBgICAgIGVjaG8gXCJbJChkYXRlKV0gQ29kZXgrKyBwb3N0LXVwZGF0ZSByZXBhaXIgY29tcGxldGVkXCJgLFxuICAgIFwiICAgIGV4aXQgMFwiLFxuICAgIFwiICBmaVwiLFxuICAgIFwiICBzbGVlcCAyMFwiLFxuICAgIFwiZG9uZVwiLFxuICAgIGBlY2hvIFwiWyQoZGF0ZSldIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIHRpbWVkIG91dFwiYCxcbiAgICBcImV4aXQgMVwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzRGV2ZWxvcGVySWRTaWduZWRBcHAoYXBwUm9vdDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHJlc3VsdCA9IHNwYXduU3luYyhcImNvZGVzaWduXCIsIFtcIi1kdlwiLCBcIi0tdmVyYm9zZT00XCIsIGFwcFJvb3RdLCB7XG4gICAgZW5jb2Rpbmc6IFwidXRmOFwiLFxuICAgIHN0ZGlvOiBbXCJpZ25vcmVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgfSk7XG4gIGNvbnN0IG91dHB1dCA9IGAke3Jlc3VsdC5zdGRvdXQgPz8gXCJcIn0ke3Jlc3VsdC5zdGRlcnIgPz8gXCJcIn1gO1xuICByZXR1cm4gKFxuICAgIHJlc3VsdC5zdGF0dXMgPT09IDAgJiZcbiAgICAvQXV0aG9yaXR5PURldmVsb3BlciBJRCBBcHBsaWNhdGlvbjovLnRlc3Qob3V0cHV0KSAmJlxuICAgICEvU2lnbmF0dXJlPWFkaG9jLy50ZXN0KG91dHB1dCkgJiZcbiAgICAhL1RlYW1JZGVudGlmaWVyPW5vdCBzZXQvLnRlc3Qob3V0cHV0KVxuICApO1xufVxuXG5mdW5jdGlvbiBpbmZlck1hY0FwcFJvb3QoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IG1hcmtlciA9IFwiLmFwcC9Db250ZW50cy9NYWNPUy9cIjtcbiAgY29uc3QgaWR4ID0gcHJvY2Vzcy5leGVjUGF0aC5pbmRleE9mKG1hcmtlcik7XG4gIHJldHVybiBpZHggPj0gMCA/IHByb2Nlc3MuZXhlY1BhdGguc2xpY2UoMCwgaWR4ICsgXCIuYXBwXCIubGVuZ3RoKSA6IG51bGw7XG59XG5cbi8vIFN1cmZhY2UgdW5oYW5kbGVkIGVycm9ycyBmcm9tIGFueXdoZXJlIGluIHRoZSBtYWluIHByb2Nlc3MgdG8gb3VyIGxvZy5cbnByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCAoZTogRXJyb3IgJiB7IGNvZGU/OiBzdHJpbmcgfSkgPT4ge1xuICBsb2coXCJlcnJvclwiLCBcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIHsgY29kZTogZS5jb2RlLCBtZXNzYWdlOiBlLm1lc3NhZ2UsIHN0YWNrOiBlLnN0YWNrIH0pO1xufSk7XG5wcm9jZXNzLm9uKFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIChlKSA9PiB7XG4gIGxvZyhcImVycm9yXCIsIFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIHsgdmFsdWU6IFN0cmluZyhlKSB9KTtcbn0pO1xuXG5pbnN0YWxsU3BhcmtsZVVwZGF0ZUhvb2soKTtcblxuaW50ZXJmYWNlIExvYWRlZE1haW5Ud2VhayB7XG4gIHN0b3A/OiAoKSA9PiB2b2lkO1xuICBzdG9yYWdlOiBEaXNrU3RvcmFnZTtcbn1cblxuaW50ZXJmYWNlIENvZGV4V2luZG93U2VydmljZXMge1xuICBjcmVhdGVGcmVzaFdpbmRvdz86IChyb3V0ZT86IHN0cmluZykgPT4gUHJvbWlzZTxFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbD47XG4gIGNyZWF0ZUZyZXNoTG9jYWxXaW5kb3c/OiAocm91dGU/OiBzdHJpbmcpID0+IFByb21pc2U8RWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw+O1xuICBlbnN1cmVIb3N0V2luZG93PzogKGhvc3RJZD86IHN0cmluZykgPT4gUHJvbWlzZTxFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbD47XG4gIGdldFByaW1hcnlXaW5kb3c/OiAoaG9zdElkPzogc3RyaW5nKSA9PiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbDtcbiAgZ2V0Q29udGV4dD86IChob3N0SWQ6IHN0cmluZykgPT4geyByZWdpc3RlcldpbmRvdz86ICh3aW5kb3dMaWtlOiBDb2RleFdpbmRvd0xpa2UpID0+IHZvaWQgfSB8IG51bGw7XG4gIHdpbmRvd01hbmFnZXI/OiB7XG4gICAgY3JlYXRlV2luZG93PzogKG9wdHM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSA9PiBQcm9taXNlPEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsPjtcbiAgICBnZXRQcmltYXJ5V2luZG93PzogKCkgPT4gRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw7XG4gICAgcmVnaXN0ZXJXaW5kb3c/OiAoXG4gICAgICB3aW5kb3dMaWtlOiBDb2RleFdpbmRvd0xpa2UsXG4gICAgICBob3N0SWQ6IHN0cmluZyxcbiAgICAgIHByaW1hcnk6IGJvb2xlYW4sXG4gICAgICBhcHBlYXJhbmNlOiBzdHJpbmcsXG4gICAgKSA9PiB2b2lkO1xuICAgIG9wdGlvbnM/OiB7XG4gICAgICBhbGxvd0RldnRvb2xzPzogYm9vbGVhbjtcbiAgICAgIHByZWxvYWRQYXRoPzogc3RyaW5nO1xuICAgIH07XG4gIH07XG59XG5cbmludGVyZmFjZSBDb2RleFdpbmRvd0xpa2Uge1xuICBpZDogbnVtYmVyO1xuICB3ZWJDb250ZW50czogRWxlY3Ryb24uV2ViQ29udGVudHM7XG4gIG9uKGV2ZW50OiBcImNsb3NlZFwiLCBsaXN0ZW5lcjogKCkgPT4gdm9pZCk6IHVua25vd247XG4gIG9uY2U/KGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKTogdW5rbm93bjtcbiAgb2ZmPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIHJlbW92ZUxpc3RlbmVyPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIGlzRGVzdHJveWVkPygpOiBib29sZWFuO1xuICBpc0ZvY3VzZWQ/KCk6IGJvb2xlYW47XG4gIGZvY3VzPygpOiB2b2lkO1xuICBzaG93PygpOiB2b2lkO1xuICBoaWRlPygpOiB2b2lkO1xuICBnZXRCb3VuZHM/KCk6IEVsZWN0cm9uLlJlY3RhbmdsZTtcbiAgZ2V0Q29udGVudEJvdW5kcz8oKTogRWxlY3Ryb24uUmVjdGFuZ2xlO1xuICBnZXRTaXplPygpOiBbbnVtYmVyLCBudW1iZXJdO1xuICBnZXRDb250ZW50U2l6ZT8oKTogW251bWJlciwgbnVtYmVyXTtcbiAgc2V0VGl0bGU/KHRpdGxlOiBzdHJpbmcpOiB2b2lkO1xuICBnZXRUaXRsZT8oKTogc3RyaW5nO1xuICBzZXRSZXByZXNlbnRlZEZpbGVuYW1lPyhmaWxlbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgc2V0RG9jdW1lbnRFZGl0ZWQ/KGVkaXRlZDogYm9vbGVhbik6IHZvaWQ7XG4gIHNldFdpbmRvd0J1dHRvblZpc2liaWxpdHk/KHZpc2libGU6IGJvb2xlYW4pOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgQ29kZXhDcmVhdGVXaW5kb3dPcHRpb25zIHtcbiAgcm91dGU6IHN0cmluZztcbiAgaG9zdElkPzogc3RyaW5nO1xuICBzaG93PzogYm9vbGVhbjtcbiAgYXBwZWFyYW5jZT86IHN0cmluZztcbiAgcGFyZW50V2luZG93SWQ/OiBudW1iZXI7XG4gIGJvdW5kcz86IEVsZWN0cm9uLlJlY3RhbmdsZTtcbn1cblxuaW50ZXJmYWNlIENvZGV4Q3JlYXRlVmlld09wdGlvbnMge1xuICByb3V0ZTogc3RyaW5nO1xuICBob3N0SWQ/OiBzdHJpbmc7XG4gIGFwcGVhcmFuY2U/OiBzdHJpbmc7XG59XG5cbnR5cGUgT3dsVmlld0F0dGFjaE1vZGUgPSBcImNvbnRlbnRWaWV3XCIgfCBcImJyb3dzZXJWaWV3XCI7XG5cbmludGVyZmFjZSBNYW5hZ2VkT3dsVmlldyB7XG4gIGtleTogc3RyaW5nO1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIHZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3O1xuICBwYXJlbnRXaW5kb3dJZDogbnVtYmVyIHwgbnVsbDtcbiAgYXR0YWNoTW9kZTogT3dsVmlld0F0dGFjaE1vZGUgfCBudWxsO1xuICBkaXNwb3NlQmluZGluZ3M6IEFycmF5PCgpID0+IHZvaWQ+O1xuICBkaXNwb3NlZDogYm9vbGVhbjtcbn1cblxuY29uc3QgdHdlYWtTdGF0ZSA9IHtcbiAgZGlzY292ZXJlZDogW10gYXMgRGlzY292ZXJlZFR3ZWFrW10sXG4gIGxvYWRlZE1haW46IG5ldyBNYXA8c3RyaW5nLCBMb2FkZWRNYWluVHdlYWs+KCksXG59O1xuXG5jb25zdCBuYXRpdmVCcmlkZ2UgPSBuZXcgTmF0aXZlQnJpZGdlKGxvZywge1xuICBuYXRpdmVIb3N0UGF0aDogam9pbihydW50aW1lRGlyLCBcIm5hdGl2ZVwiLCBcImNvZGV4cHBfbmF0aXZlX2hvc3Qubm9kZVwiKSxcbn0pO1xuY29uc3Qgb3dsVmlld3MgPSBuZXcgTWFwPHN0cmluZywgTWFuYWdlZE93bFZpZXc+KCk7XG5cbmNvbnN0IHR3ZWFrTGlmZWN5Y2xlRGVwcyA9IHtcbiAgbG9nSW5mbzogKG1lc3NhZ2U6IHN0cmluZykgPT4gbG9nKFwiaW5mb1wiLCBtZXNzYWdlKSxcbiAgc2V0VHdlYWtFbmFibGVkLFxuICBzdG9wQWxsTWFpblR3ZWFrcyxcbiAgY2xlYXJUd2Vha01vZHVsZUNhY2hlLFxuICBsb2FkQWxsTWFpblR3ZWFrcyxcbiAgYnJvYWRjYXN0UmVsb2FkLFxufTtcblxuLy8gMS4gSG9vayBldmVyeSBzZXNzaW9uIHNvIG91ciBwcmVsb2FkIHJ1bnMgaW4gZXZlcnkgcmVuZGVyZXIuXG4vL1xuLy8gV2UgdXNlIEVsZWN0cm9uJ3MgbW9kZXJuIGBzZXNzaW9uLnJlZ2lzdGVyUHJlbG9hZFNjcmlwdGAgQVBJIChhZGRlZCBpblxuLy8gRWxlY3Ryb24gMzUpLiBUaGUgZGVwcmVjYXRlZCBgc2V0UHJlbG9hZHNgIHBhdGggc2lsZW50bHkgbm8tb3BzIGluIHNvbWVcbi8vIGNvbmZpZ3VyYXRpb25zIChub3RhYmx5IHdpdGggc2FuZGJveGVkIHJlbmRlcmVycyksIHNvIHJlZ2lzdGVyUHJlbG9hZFNjcmlwdFxuLy8gaXMgdGhlIG9ubHkgcmVsaWFibGUgd2F5IHRvIGluamVjdCBpbnRvIENvZGV4J3MgQnJvd3NlcldpbmRvd3MuXG5mdW5jdGlvbiByZWdpc3RlclByZWxvYWQoczogRWxlY3Ryb24uU2Vzc2lvbiwgbGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IHJlZyA9IChzIGFzIHVua25vd24gYXMge1xuICAgICAgcmVnaXN0ZXJQcmVsb2FkU2NyaXB0PzogKG9wdHM6IHtcbiAgICAgICAgdHlwZT86IFwiZnJhbWVcIiB8IFwic2VydmljZS13b3JrZXJcIjtcbiAgICAgICAgaWQ/OiBzdHJpbmc7XG4gICAgICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgICB9KSA9PiBzdHJpbmc7XG4gICAgfSkucmVnaXN0ZXJQcmVsb2FkU2NyaXB0O1xuICAgIGlmICh0eXBlb2YgcmVnID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJlZy5jYWxsKHMsIHsgdHlwZTogXCJmcmFtZVwiLCBmaWxlUGF0aDogUFJFTE9BRF9QQVRILCBpZDogXCJjb2RleC1wbHVzcGx1c1wiIH0pO1xuICAgICAgbG9nKFwiaW5mb1wiLCBgcHJlbG9hZCByZWdpc3RlcmVkIChyZWdpc3RlclByZWxvYWRTY3JpcHQpIG9uICR7bGFiZWx9OmAsIFBSRUxPQURfUEFUSCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIEZhbGxiYWNrIGZvciBvbGRlciBFbGVjdHJvbiB2ZXJzaW9ucy5cbiAgICBjb25zdCBleGlzdGluZyA9IHMuZ2V0UHJlbG9hZHMoKTtcbiAgICBpZiAoIWV4aXN0aW5nLmluY2x1ZGVzKFBSRUxPQURfUEFUSCkpIHtcbiAgICAgIHMuc2V0UHJlbG9hZHMoWy4uLmV4aXN0aW5nLCBQUkVMT0FEX1BBVEhdKTtcbiAgICB9XG4gICAgbG9nKFwiaW5mb1wiLCBgcHJlbG9hZCByZWdpc3RlcmVkIChzZXRQcmVsb2Fkcykgb24gJHtsYWJlbH06YCwgUFJFTE9BRF9QQVRIKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgJiYgZS5tZXNzYWdlLmluY2x1ZGVzKFwiZXhpc3RpbmcgSURcIikpIHtcbiAgICAgIGxvZyhcImluZm9cIiwgYHByZWxvYWQgYWxyZWFkeSByZWdpc3RlcmVkIG9uICR7bGFiZWx9OmAsIFBSRUxPQURfUEFUSCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxvZyhcImVycm9yXCIsIGBwcmVsb2FkIHJlZ2lzdHJhdGlvbiBvbiAke2xhYmVsfSBmYWlsZWQ6YCwgZSk7XG4gIH1cbn1cblxuYXBwLndoZW5SZWFkeSgpLnRoZW4oKCkgPT4ge1xuICBsb2coXCJpbmZvXCIsIFwiYXBwIHJlYWR5IGZpcmVkXCIpO1xuICBpZiAoaXNDb2RleFBsdXNQbHVzU2FmZU1vZGVFbmFibGVkKCkpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwic2FmZSBtb2RlIGlzIGVuYWJsZWQ7IHByZWxvYWQgd2lsbCBub3QgYmUgcmVnaXN0ZXJlZFwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmVnaXN0ZXJQcmVsb2FkKHNlc3Npb24uZGVmYXVsdFNlc3Npb24sIFwiZGVmYXVsdFNlc3Npb25cIik7XG4gIG1heWJlU3RhcnRCcm93c2VyVWlTZXJ2ZXIoe1xuICAgIGdldFdpbmRvd1NlcnZpY2VzOiBnZXRDb2RleFdpbmRvd1NlcnZpY2VzLFxuICAgIGxvZyxcbiAgfSk7XG59KTtcblxuYXBwLm9uKFwic2Vzc2lvbi1jcmVhdGVkXCIsIChzKSA9PiB7XG4gIGlmIChpc0NvZGV4UGx1c1BsdXNTYWZlTW9kZUVuYWJsZWQoKSkgcmV0dXJuO1xuICByZWdpc3RlclByZWxvYWQocywgXCJzZXNzaW9uLWNyZWF0ZWRcIik7XG59KTtcblxuYXBwLm9uKFwid2ViLWNvbnRlbnRzLWNyZWF0ZWRcIiwgKF9lLCB3YykgPT4ge1xuICB0cnkge1xuICAgIGlmIChERUJVR19XRUJfQ09OVEVOVFNfTE9HKSB7XG4gICAgICBjb25zdCB3cCA9ICh3YyBhcyB1bmtub3duIGFzIHsgZ2V0TGFzdFdlYlByZWZlcmVuY2VzPzogKCkgPT4gUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfSlcbiAgICAgICAgLmdldExhc3RXZWJQcmVmZXJlbmNlcz8uKCk7XG4gICAgICBsb2coXCJpbmZvXCIsIFwid2ViLWNvbnRlbnRzLWNyZWF0ZWRcIiwge1xuICAgICAgICBpZDogd2MuaWQsXG4gICAgICAgIHR5cGU6IHdjLmdldFR5cGUoKSxcbiAgICAgICAgc2Vzc2lvbklzRGVmYXVsdDogd2Muc2Vzc2lvbiA9PT0gc2Vzc2lvbi5kZWZhdWx0U2Vzc2lvbixcbiAgICAgICAgc2FuZGJveDogd3A/LnNhbmRib3gsXG4gICAgICAgIGNvbnRleHRJc29sYXRpb246IHdwPy5jb250ZXh0SXNvbGF0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHdjLm9uKFwicHJlbG9hZC1lcnJvclwiLCAoX2V2LCBwLCBlcnIpID0+IHtcbiAgICAgIGxvZyhcImVycm9yXCIsIGB3YyAke3djLmlkfSBwcmVsb2FkLWVycm9yIHBhdGg9JHtwfWAsIFN0cmluZyhlcnI/LnN0YWNrID8/IGVycikpO1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nKFwiZXJyb3JcIiwgXCJ3ZWItY29udGVudHMtY3JlYXRlZCBoYW5kbGVyIGZhaWxlZDpcIiwgU3RyaW5nKChlIGFzIEVycm9yKT8uc3RhY2sgPz8gZSkpO1xuICB9XG59KTtcblxubG9nKFwiaW5mb1wiLCBcIm1haW4udHMgZXZhbHVhdGVkOyBhcHAuaXNSZWFkeT1cIiArIGFwcC5pc1JlYWR5KCkpO1xuaWYgKGlzQ29kZXhQbHVzUGx1c1NhZmVNb2RlRW5hYmxlZCgpKSB7XG4gIGxvZyhcIndhcm5cIiwgXCJzYWZlIG1vZGUgaXMgZW5hYmxlZDsgdHdlYWtzIHdpbGwgbm90IGJlIGxvYWRlZFwiKTtcbn1cblxuLy8gMi4gSW5pdGlhbCB0d2VhayBkaXNjb3ZlcnkgKyBtYWluLXNjb3BlIGxvYWQuXG5sb2FkQWxsTWFpblR3ZWFrcygpO1xuXG5hcHAub24oXCJ3aWxsLXF1aXRcIiwgKCkgPT4ge1xuICBzdG9wQWxsTWFpblR3ZWFrcygpO1xuICBuYXRpdmVCcmlkZ2UuZGlzcG9zZUFsbCgpO1xuICBkaXNwb3NlQWxsT3dsVmlld3MoKTtcbiAgLy8gQmVzdC1lZmZvcnQgZmx1c2ggb2YgYW55IHBlbmRpbmcgc3RvcmFnZSB3cml0ZXMuXG4gIGZvciAoY29uc3QgdCBvZiB0d2Vha1N0YXRlLmxvYWRlZE1haW4udmFsdWVzKCkpIHtcbiAgICB0cnkge1xuICAgICAgdC5zdG9yYWdlLmZsdXNoKCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG59KTtcblxuLy8gMy4gSVBDOiBleHBvc2UgdHdlYWsgbWV0YWRhdGEgKyByZXZlYWwtaW4tZmluZGVyLlxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmxpc3QtdHdlYWtzXCIsIGFzeW5jICgpID0+IHtcbiAgYXdhaXQgUHJvbWlzZS5hbGwodHdlYWtTdGF0ZS5kaXNjb3ZlcmVkLm1hcCgodCkgPT4gZW5zdXJlVHdlYWtVcGRhdGVDaGVjayh0KSkpO1xuICBjb25zdCB1cGRhdGVDaGVja3MgPSByZWFkU3RhdGUoKS50d2Vha1VwZGF0ZUNoZWNrcyA/PyB7fTtcbiAgcmV0dXJuIHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+ICh7XG4gICAgbWFuaWZlc3Q6IHQubWFuaWZlc3QsXG4gICAgZW50cnk6IHQuZW50cnksXG4gICAgZGlyOiB0LmRpcixcbiAgICBlbnRyeUV4aXN0czogZXhpc3RzU3luYyh0LmVudHJ5KSxcbiAgICBlbmFibGVkOiBpc1R3ZWFrRW5hYmxlZCh0Lm1hbmlmZXN0LmlkKSxcbiAgICB1cGRhdGU6IHVwZGF0ZUNoZWNrc1t0Lm1hbmlmZXN0LmlkXSA/PyBudWxsLFxuICB9KSk7XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC10d2Vhay1lbmFibGVkXCIsIChfZSwgaWQ6IHN0cmluZykgPT4gaXNUd2Vha0VuYWJsZWQoaWQpKTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpzZXQtdHdlYWstZW5hYmxlZFwiLCAoX2UsIGlkOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgcmV0dXJuIHNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZChpZCwgZW5hYmxlZCwgdHdlYWtMaWZlY3ljbGVEZXBzKTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Z2V0LWNvbmZpZ1wiLCAoKSA9PiB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgY29uc3QgaW5zdGFsbGVyU3RhdGUgPSByZWFkSW5zdGFsbGVyU3RhdGUoKTtcbiAgY29uc3Qgc291cmNlUm9vdCA9IGluc3RhbGxlclN0YXRlPy5zb3VyY2VSb290ID8/IGZhbGxiYWNrU291cmNlUm9vdCgpO1xuICByZXR1cm4ge1xuICAgIHZlcnNpb246IENPREVYX1BMVVNQTFVTX1ZFUlNJT04sXG4gICAgYXV0b1VwZGF0ZTogcy5jb2RleFBsdXNQbHVzPy5hdXRvVXBkYXRlICE9PSBmYWxzZSxcbiAgICBzYWZlTW9kZTogcy5jb2RleFBsdXNQbHVzPy5zYWZlTW9kZSA9PT0gdHJ1ZSxcbiAgICB1cGRhdGVDaGFubmVsOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoYW5uZWwgPz8gXCJzdGFibGVcIixcbiAgICB1cGRhdGVSZXBvOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlcG8gPz8gQ09ERVhfUExVU1BMVVNfUkVQTyxcbiAgICB1cGRhdGVSZWY6IHMuY29kZXhQbHVzUGx1cz8udXBkYXRlUmVmID8/IFwiXCIsXG4gICAgdXBkYXRlQ2hlY2s6IHMuY29kZXhQbHVzUGx1cz8udXBkYXRlQ2hlY2sgPz8gbnVsbCxcbiAgICBzZWxmVXBkYXRlOiByZWFkU2VsZlVwZGF0ZVN0YXRlKCksXG4gICAgaW5zdGFsbGF0aW9uU291cmNlOiBkZXNjcmliZUluc3RhbGxhdGlvblNvdXJjZShzb3VyY2VSb290KSxcbiAgfTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6c2V0LWF1dG8tdXBkYXRlXCIsIChfZSwgZW5hYmxlZDogYm9vbGVhbikgPT4ge1xuICBzZXRDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZSghIWVuYWJsZWQpO1xuICByZXR1cm4geyBhdXRvVXBkYXRlOiBpc0NvZGV4UGx1c1BsdXNBdXRvVXBkYXRlRW5hYmxlZCgpIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOnNldC11cGRhdGUtY29uZmlnXCIsIChfZSwgY29uZmlnOiB7XG4gIHVwZGF0ZUNoYW5uZWw/OiBTZWxmVXBkYXRlQ2hhbm5lbDtcbiAgdXBkYXRlUmVwbz86IHN0cmluZztcbiAgdXBkYXRlUmVmPzogc3RyaW5nO1xufSkgPT4ge1xuICBzZXRDb2RleFBsdXNQbHVzVXBkYXRlQ29uZmlnKGNvbmZpZyk7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcmV0dXJuIHtcbiAgICB1cGRhdGVDaGFubmVsOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoYW5uZWwgPz8gXCJzdGFibGVcIixcbiAgICB1cGRhdGVSZXBvOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlcG8gPz8gQ09ERVhfUExVU1BMVVNfUkVQTyxcbiAgICB1cGRhdGVSZWY6IHMuY29kZXhQbHVzUGx1cz8udXBkYXRlUmVmID8/IFwiXCIsXG4gIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNoZWNrLWNvZGV4cHAtdXBkYXRlXCIsIGFzeW5jIChfZSwgZm9yY2U/OiBib29sZWFuKSA9PiB7XG4gIHJldHVybiBlbnN1cmVDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2soZm9yY2UgPT09IHRydWUpO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpydW4tY29kZXhwcC11cGRhdGVcIiwgYXN5bmMgKCkgPT4ge1xuICBjb25zdCBzb3VyY2VSb290ID0gcmVhZEluc3RhbGxlclN0YXRlKCk/LnNvdXJjZVJvb3QgPz8gZmFsbGJhY2tTb3VyY2VSb290KCk7XG4gIGlmICghc291cmNlUm9vdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4Kysgc291cmNlIENMSSB3YXMgbm90IGZvdW5kLiBSdW4gdGhlIGluc3RhbGxlciBvbmNlLCB0aGVuIHRyeSBhZ2Fpbi5cIik7XG4gIH1cbiAgY29uc3QgY2xpID0gam9pbihzb3VyY2VSb290LCBcInBhY2thZ2VzXCIsIFwiaW5zdGFsbGVyXCIsIFwiZGlzdFwiLCBcImNsaS5qc1wiKTtcbiAgaWYgKCFleGlzdHNTeW5jKGNsaSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCsrIHNvdXJjZSBDTEkgd2FzIG5vdCBmb3VuZC4gUnVuIHRoZSBpbnN0YWxsZXIgb25jZSwgdGhlbiB0cnkgYWdhaW4uXCIpO1xuICB9XG4gIGNvbnN0IHBlbmRpbmcgPSBtYXJrU2VsZlVwZGF0ZVN0YXJ0ZWQoc291cmNlUm9vdCk7XG4gIHN0YXJ0SW5zdGFsbGVkQ2xpKGNsaSwgW1widXBkYXRlXCIsIFwiLS13YXRjaGVyXCJdKTtcbiAgcmV0dXJuIHBlbmRpbmc7XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC13YXRjaGVyLWhlYWx0aFwiLCAoKSA9PiBnZXRXYXRjaGVySGVhbHRoKHVzZXJSb290ISkpO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Z2V0LXR3ZWFrLXN0b3JlXCIsIGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc3RvcmUgPSBhd2FpdCBmZXRjaFR3ZWFrU3RvcmVSZWdpc3RyeSgpO1xuICBjb25zdCByZWdpc3RyeSA9IHN0b3JlLnJlZ2lzdHJ5O1xuICBjb25zdCBpbnN0YWxsZWQgPSBuZXcgTWFwKHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+IFt0Lm1hbmlmZXN0LmlkLCB0XSkpO1xuICBjb25zdCBlbnRyaWVzID0gc2h1ZmZsZVN0b3JlRW50cmllcyhyZWdpc3RyeS5lbnRyaWVzLCByYW5kb21JbnQpO1xuICByZXR1cm4ge1xuICAgIC4uLnJlZ2lzdHJ5LFxuICAgIHNvdXJjZVVybDogVFdFQUtfU1RPUkVfSU5ERVhfVVJMLFxuICAgIGZldGNoZWRBdDogc3RvcmUuZmV0Y2hlZEF0LFxuICAgIGVudHJpZXM6IGVudHJpZXMubWFwKChlbnRyeSkgPT4ge1xuICAgICAgY29uc3QgbG9jYWwgPSBpbnN0YWxsZWQuZ2V0KGVudHJ5LmlkKTtcbiAgICAgIGNvbnN0IHBsYXRmb3JtID0gc3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJpbGl0eShlbnRyeSk7XG4gICAgICBjb25zdCBydW50aW1lID0gc3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmlsaXR5KGVudHJ5LCBDT0RFWF9QTFVTUExVU19WRVJTSU9OKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIC4uLmVudHJ5LFxuICAgICAgICBwbGF0Zm9ybSxcbiAgICAgICAgcnVudGltZSxcbiAgICAgICAgaW5zdGFsbGVkOiBsb2NhbFxuICAgICAgICAgID8ge1xuICAgICAgICAgICAgICB2ZXJzaW9uOiBsb2NhbC5tYW5pZmVzdC52ZXJzaW9uLFxuICAgICAgICAgICAgICBlbmFibGVkOiBpc1R3ZWFrRW5hYmxlZChsb2NhbC5tYW5pZmVzdC5pZCksXG4gICAgICAgICAgICB9XG4gICAgICAgICAgOiBudWxsLFxuICAgICAgfTtcbiAgICB9KSxcbiAgfTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6aW5zdGFsbC1zdG9yZS10d2Vha1wiLCBhc3luYyAoX2UsIGlkOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgeyByZWdpc3RyeSB9ID0gYXdhaXQgZmV0Y2hUd2Vha1N0b3JlUmVnaXN0cnkoKTtcbiAgY29uc3QgZW50cnkgPSByZWdpc3RyeS5lbnRyaWVzLmZpbmQoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlLmlkID09PSBpZCk7XG4gIGlmICghZW50cnkpIHRocm93IG5ldyBFcnJvcihgVHdlYWsgc3RvcmUgZW50cnkgbm90IGZvdW5kOiAke2lkfWApO1xuICBhc3NlcnRTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmxlKGVudHJ5KTtcbiAgYXNzZXJ0U3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmxlKGVudHJ5LCBDT0RFWF9QTFVTUExVU19WRVJTSU9OKTtcbiAgYXdhaXQgaW5zdGFsbFN0b3JlVHdlYWsoZW50cnkpO1xuICByZWxvYWRUd2Vha3MoXCJzdG9yZS1pbnN0YWxsXCIsIHR3ZWFrTGlmZWN5Y2xlRGVwcyk7XG4gIHJldHVybiB7IGluc3RhbGxlZDogZW50cnkuaWQgfTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cHJlcGFyZS10d2Vhay1zdG9yZS1zdWJtaXNzaW9uXCIsIGFzeW5jIChfZSwgcmVwb0lucHV0OiBzdHJpbmcpID0+IHtcbiAgcmV0dXJuIHByZXBhcmVUd2Vha1N0b3JlU3VibWlzc2lvbihyZXBvSW5wdXQpO1xufSk7XG5cbi8vIFNhbmRib3hlZCByZW5kZXJlciBwcmVsb2FkIGNhbid0IHVzZSBOb2RlIGZzIHRvIHJlYWQgdHdlYWsgc291cmNlLiBNYWluXG4vLyByZWFkcyBpdCBvbiB0aGUgcmVuZGVyZXIncyBiZWhhbGYuIFBhdGggbXVzdCBsaXZlIHVuZGVyIHR3ZWFrc0RpciBmb3Jcbi8vIHNlY3VyaXR5IFx1MjAxNCB3ZSByZWZ1c2UgYW55dGhpbmcgZWxzZS5cbmZ1bmN0aW9uIHJlYWRUd2Vha1NvdXJjZShlbnRyeVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZShlbnRyeVBhdGgpO1xuICBpZiAoIWlzUGF0aEluc2lkZShUV0VBS1NfRElSLCByZXNvbHZlZCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIG91dHNpZGUgdHdlYWtzIGRpclwiKTtcbiAgfVxuICByZXR1cm4gcmVxdWlyZShcIm5vZGU6ZnNcIikucmVhZEZpbGVTeW5jKHJlc29sdmVkLCBcInV0ZjhcIik7XG59XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpyZWFkLXR3ZWFrLXNvdXJjZVwiLCAoX2UsIGVudHJ5UGF0aDogc3RyaW5nKSA9PiB7XG4gIHJldHVybiByZWFkVHdlYWtTb3VyY2UoZW50cnlQYXRoKTtcbn0pO1xuXG5pcGNNYWluLm9uKFwiY29kZXhwcDpyZWFkLXR3ZWFrLXNvdXJjZS1zeW5jXCIsIChldmVudCwgZW50cnlQYXRoOiBzdHJpbmcpID0+IHtcbiAgdHJ5IHtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IHsgb2s6IHRydWUsIHNvdXJjZTogcmVhZFR3ZWFrU291cmNlKGVudHJ5UGF0aCkgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBldmVudC5yZXR1cm5WYWx1ZSA9IHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGVycm9yOiBTdHJpbmcoKGVycm9yIGFzIEVycm9yKT8ubWVzc2FnZSA/PyBlcnJvciksXG4gICAgfTtcbiAgfVxufSk7XG5cbi8qKlxuICogUmVhZCBhbiBhcmJpdHJhcnkgYXNzZXQgZmlsZSBmcm9tIGluc2lkZSBhIHR3ZWFrJ3MgZGlyZWN0b3J5IGFuZCByZXR1cm4gaXRcbiAqIGFzIGEgYGRhdGE6YCBVUkwuIFVzZWQgYnkgdGhlIHNldHRpbmdzIGluamVjdG9yIHRvIHJlbmRlciBtYW5pZmVzdCBpY29uc1xuICogKHRoZSByZW5kZXJlciBpcyBzYW5kYm94ZWQ7IGBmaWxlOi8vYCB3b24ndCBsb2FkKS5cbiAqXG4gKiBTZWN1cml0eTogY2FsbGVyIHBhc3NlcyBgdHdlYWtEaXJgIGFuZCBgcmVsUGF0aGA7IHdlICgxKSByZXF1aXJlIHR3ZWFrRGlyXG4gKiB0byBsaXZlIHVuZGVyIFRXRUFLU19ESVIsICgyKSByZXNvbHZlIHJlbFBhdGggYWdhaW5zdCBpdCBhbmQgcmUtY2hlY2sgdGhlXG4gKiByZXN1bHQgc3RpbGwgbGl2ZXMgdW5kZXIgVFdFQUtTX0RJUiwgKDMpIGNhcCBvdXRwdXQgc2l6ZSBhdCAxIE1pQi5cbiAqL1xuY29uc3QgQVNTRVRfTUFYX0JZVEVTID0gMTAyNCAqIDEwMjQ7XG5jb25zdCBNSU1FX0JZX0VYVDogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCIucG5nXCI6IFwiaW1hZ2UvcG5nXCIsXG4gIFwiLmpwZ1wiOiBcImltYWdlL2pwZWdcIixcbiAgXCIuanBlZ1wiOiBcImltYWdlL2pwZWdcIixcbiAgXCIuZ2lmXCI6IFwiaW1hZ2UvZ2lmXCIsXG4gIFwiLndlYnBcIjogXCJpbWFnZS93ZWJwXCIsXG4gIFwiLnN2Z1wiOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgXCIuaWNvXCI6IFwiaW1hZ2UveC1pY29uXCIsXG59O1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpyZWFkLXR3ZWFrLWFzc2V0XCIsXG4gIChfZSwgdHdlYWtEaXI6IHN0cmluZywgcmVsUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgZnMgPSByZXF1aXJlKFwibm9kZTpmc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwibm9kZTpmc1wiKTtcbiAgICBjb25zdCBkaXIgPSByZXNvbHZlKHR3ZWFrRGlyKTtcbiAgICBpZiAoIWlzUGF0aEluc2lkZShUV0VBS1NfRElSLCBkaXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0d2Vha0RpciBvdXRzaWRlIHR3ZWFrcyBkaXJcIik7XG4gICAgfVxuICAgIGNvbnN0IGZ1bGwgPSByZXNvbHZlKGRpciwgcmVsUGF0aCk7XG4gICAgaWYgKCFpc1BhdGhJbnNpZGUoZGlyLCBmdWxsKSB8fCBmdWxsID09PSBkaXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInBhdGggdHJhdmVyc2FsXCIpO1xuICAgIH1cbiAgICBjb25zdCBzdGF0ID0gZnMuc3RhdFN5bmMoZnVsbCk7XG4gICAgaWYgKHN0YXQuc2l6ZSA+IEFTU0VUX01BWF9CWVRFUykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBhc3NldCB0b28gbGFyZ2UgKCR7c3RhdC5zaXplfSA+ICR7QVNTRVRfTUFYX0JZVEVTfSlgKTtcbiAgICB9XG4gICAgY29uc3QgZXh0ID0gZnVsbC5zbGljZShmdWxsLmxhc3RJbmRleE9mKFwiLlwiKSkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBtaW1lID0gTUlNRV9CWV9FWFRbZXh0XSA/PyBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xuICAgIGNvbnN0IGJ1ZiA9IGZzLnJlYWRGaWxlU3luYyhmdWxsKTtcbiAgICByZXR1cm4gYGRhdGE6JHttaW1lfTtiYXNlNjQsJHtidWYudG9TdHJpbmcoXCJiYXNlNjRcIil9YDtcbiAgfSxcbik7XG5cbi8vIFNhbmRib3hlZCBwcmVsb2FkIGNhbid0IHdyaXRlIGxvZ3MgdG8gZGlzazsgZm9yd2FyZCB0byB1cyB2aWEgSVBDLlxuaXBjTWFpbi5vbihcImNvZGV4cHA6cHJlbG9hZC1sb2dcIiwgKF9lLCBsZXZlbDogXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgbXNnOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgbHZsID0gbGV2ZWwgPT09IFwiZXJyb3JcIiB8fCBsZXZlbCA9PT0gXCJ3YXJuXCIgPyBsZXZlbCA6IFwiaW5mb1wiO1xuICB0cnkge1xuICAgIGFwcGVuZENhcHBlZExvZyhqb2luKExPR19ESVIsIFwicHJlbG9hZC5sb2dcIiksIGBbJHtuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCl9XSBbJHtsdmx9XSAke21zZ31cXG5gKTtcbiAgfSBjYXRjaCB7fVxufSk7XG5cbi8vIFNhbmRib3gtc2FmZSBmaWxlc3lzdGVtIG9wcyBmb3IgcmVuZGVyZXItc2NvcGUgdHdlYWtzLiBFYWNoIHR3ZWFrIGdldHNcbi8vIGEgc2FuZGJveGVkIGRpciB1bmRlciB1c2VyUm9vdC90d2Vhay1kYXRhLzxpZD4uIFJlbmRlcmVyIHNpZGUgY2FsbHMgdGhlc2Vcbi8vIG92ZXIgSVBDIGluc3RlYWQgb2YgdXNpbmcgTm9kZSBmcyBkaXJlY3RseS5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDp0d2Vhay1mc1wiLCAoX2UsIG9wOiBzdHJpbmcsIGlkOiBzdHJpbmcsIHA6IHN0cmluZywgYz86IHN0cmluZykgPT4ge1xuICBpZiAoIS9eW2EtekEtWjAtOS5fLV0rJC8udGVzdChpZCkpIHRocm93IG5ldyBFcnJvcihcImJhZCB0d2VhayBpZFwiKTtcbiAgY29uc3QgZGlyID0gam9pbih1c2VyUm9vdCEsIFwidHdlYWstZGF0YVwiLCBpZCk7XG4gIG1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBmdWxsID0gcmVzb2x2ZShkaXIsIHApO1xuICBpZiAoIWlzUGF0aEluc2lkZShkaXIsIGZ1bGwpIHx8IGZ1bGwgPT09IGRpcikgdGhyb3cgbmV3IEVycm9yKFwicGF0aCB0cmF2ZXJzYWxcIik7XG4gIGNvbnN0IGZzID0gcmVxdWlyZShcIm5vZGU6ZnNcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6ZnNcIik7XG4gIHN3aXRjaCAob3ApIHtcbiAgICBjYXNlIFwicmVhZFwiOiByZXR1cm4gZnMucmVhZEZpbGVTeW5jKGZ1bGwsIFwidXRmOFwiKTtcbiAgICBjYXNlIFwid3JpdGVcIjogcmV0dXJuIGZzLndyaXRlRmlsZVN5bmMoZnVsbCwgYyA/PyBcIlwiLCBcInV0ZjhcIik7XG4gICAgY2FzZSBcImV4aXN0c1wiOiByZXR1cm4gZnMuZXhpc3RzU3luYyhmdWxsKTtcbiAgICBjYXNlIFwiZGF0YURpclwiOiByZXR1cm4gZGlyO1xuICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihgdW5rbm93biBvcDogJHtvcH1gKTtcbiAgfVxufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDp1c2VyLXBhdGhzXCIsICgpID0+ICh7XG4gIHVzZXJSb290LFxuICBydW50aW1lRGlyLFxuICB0d2Vha3NEaXI6IFRXRUFLU19ESVIsXG4gIGxvZ0RpcjogTE9HX0RJUixcbn0pKTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtaW5mb1wiLCAoKSA9PiBjdXJyZW50UnVudGltZUluZm8oKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtcnVudGltZS1jYXBhYmlsaXRpZXNcIiwgKCkgPT4gY3VycmVudFJ1bnRpbWVDYXBhYmlsaXRpZXMoKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtY2RwLXN0YXR1c1wiLCAoKSA9PiBnZXRDZHBTdGF0dXMoKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtY2RwLXRhcmdldHNcIiwgKCkgPT4gbGlzdENkcFRhcmdldHMoKSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm1vZGVsLWdlbmVyYXRlLXRleHRcIixcbiAgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zKSA9PiB7XG4gICAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgXCJtb2RlbFwiKTtcbiAgICByZXR1cm4gZ2VuZXJhdGVNb2RlbFRleHQodHdlYWtJZCwgb3B0aW9ucyk7XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS1vYmplY3RcIixcbiAgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZU9iamVjdE9wdGlvbnMpID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm1vZGVsXCIpO1xuICAgIHJldHVybiBnZW5lcmF0ZU1vZGVsT2JqZWN0KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctY3JlYXRlXCIsIChfZSwgb3B0czogQ29kZXhDcmVhdGVXaW5kb3dPcHRpb25zKSA9PiB7XG4gIHJldHVybiBjcmVhdGVDb2RleFdpbmRvdyhvcHRzKTtcbn0pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1wcmltYXJ5XCIsICgpID0+IGdldFByaW1hcnlDb2RleFdpbmRvd1JlZigpKTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctZm9jdXNcIiwgKF9lLCB3aW5kb3dJZDogbnVtYmVyKSA9PiBmb2N1c0NvZGV4V2luZG93KHdpbmRvd0lkKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtd2luZG93LXNob3dcIiwgKF9lLCB3aW5kb3dJZDogbnVtYmVyKSA9PiBzaG93Q29kZXhXaW5kb3cod2luZG93SWQpKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6Y29kZXgtdmlldy1jcmVhdGVcIixcbiAgYXN5bmMgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IENvZGV4Vmlld0NyZWF0ZU9wdGlvbnMpID0+IHtcbiAgICBjb25zdCB0d2VhayA9IGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkKTtcbiAgICBjb25zdCByZWYgPSBhd2FpdCBjcmVhdGVPd2xWaWV3KHsgaWQ6IHR3ZWFrLm1hbmlmZXN0LmlkLCBkaXI6IHR3ZWFrLmRpciB9LCBvcHRpb25zKTtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHJlZi5pZCxcbiAgICAgIHdlYkNvbnRlbnRzSWQ6IHJlZi53ZWJDb250ZW50c0lkLFxuICAgICAgcGFyZW50V2luZG93SWQ6IHJlZi5wYXJlbnRXaW5kb3dJZCxcbiAgICB9O1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6Y29kZXgtdmlldy1jYWxsXCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCB2aWV3SWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIGFyZz86IHVua25vd24sIGFyZzI/OiB1bmtub3duKSA9PiB7XG4gICAgYXNzZXJ0VHdlYWtWaWV3UGVybWlzc2lvbkZvcklkKHR3ZWFrSWQpO1xuICAgIHJldHVybiBjYWxsT3dsVmlldyh0d2Vha0lkLCB2aWV3SWQsIG1ldGhvZCwgYXJnLCBhcmcyKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtdmlldy1kaXNwb3NlLXR3ZWFrXCIsIChfZSwgdHdlYWtJZDogc3RyaW5nKSA9PiB7XG4gIGFzc2VydFR3ZWFrSWQodHdlYWtJZCk7XG4gIGRpc3Bvc2VPd2xWaWV3c0ZvclR3ZWFrKHR3ZWFrSWQpO1xufSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1sb2FkLW1vZHVsZVwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgb3B0aW9uczogTmF0aXZlTW9kdWxlTG9hZE9wdGlvbnMpID0+IHtcbiAgICBjb25zdCByZWYgPSBuYXRpdmVCcmlkZ2UubG9hZE1vZHVsZSh0d2Vha0NvbnRleHQodHdlYWtJZCwgXCJuYXRpdmUtbW9kdWxlXCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkLCBraW5kOiByZWYua2luZCB9O1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLW1vZHVsZS1yZXF1ZXN0XCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBtb2R1bGVJZDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgcGF5bG9hZD86IHVua25vd24sIHRpbWVvdXRNcz86IG51bWJlcikgPT4ge1xuICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibmF0aXZlLW1vZHVsZVwiKTtcbiAgICByZXR1cm4gbmF0aXZlQnJpZGdlLnJlcXVlc3RNb2R1bGUodHdlYWtJZCwgbW9kdWxlSWQsIG1ldGhvZCwgcGF5bG9hZCwgdGltZW91dE1zKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6bmF0aXZlLW1vZHVsZS1kaXNwb3NlXCIsIChfZSwgdHdlYWtJZDogc3RyaW5nLCBtb2R1bGVJZDogc3RyaW5nKSA9PiB7XG4gIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibmF0aXZlLW1vZHVsZVwiKTtcbiAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5kaXNwb3NlTW9kdWxlKHR3ZWFrSWQsIG1vZHVsZUlkKTtcbn0pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOm5hdGl2ZS1kaXNwb3NlLXR3ZWFrXCIsIChfZSwgdHdlYWtJZDogc3RyaW5nKSA9PiB7XG4gIGFzc2VydFR3ZWFrSWQodHdlYWtJZCk7XG4gIG5hdGl2ZUJyaWRnZS5kaXNwb3NlVHdlYWsodHdlYWtJZCk7XG59KTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLWNyZWF0ZS1wYW5lbFwiLFxuICBhc3luYyAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgb3B0aW9uczogTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gYXdhaXQgbmF0aXZlQnJpZGdlLmNyZWF0ZVBhbmVsKHR3ZWFrQ29udGV4dCh0d2Vha0lkLCBcIm5hdGl2ZS12aWV3XCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkLCB3aW5kb3dJZDogcmVmLndpbmRvd0lkIH07XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpuYXRpdmUtYXR0YWNoLXZpZXdcIixcbiAgYXN5bmMgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZVZpZXdBdHRhY2hPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gYXdhaXQgbmF0aXZlQnJpZGdlLmF0dGFjaFZpZXcodHdlYWtDb250ZXh0KHR3ZWFrSWQsIFwibmF0aXZlLXZpZXdcIiksIG9wdGlvbnMpO1xuICAgIHJldHVybiB7IGlkOiByZWYuaWQgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1pbnN0YW5jZS1jYWxsXCIsXG4gIGFzeW5jIChfZSwgdHdlYWtJZDogc3RyaW5nLCBraW5kOiBcInBhbmVsXCIgfCBcInZpZXdcIiwgaW5zdGFuY2VJZDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgYXJnPzogdW5rbm93bikgPT4ge1xuICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibmF0aXZlLXZpZXdcIik7XG4gICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5jYWxsSW5zdGFuY2UodHdlYWtJZCwga2luZCwgaW5zdGFuY2VJZCwgbWV0aG9kLCBhcmcpO1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLWxhdW5jaC1oZWxwZXJcIixcbiAgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZUhlbHBlckxhdW5jaE9wdGlvbnMpID0+IHtcbiAgICBjb25zdCByZWYgPSBuYXRpdmVCcmlkZ2UubGF1bmNoSGVscGVyKHR3ZWFrQ29udGV4dCh0d2Vha0lkLCBcIm5hdGl2ZS1oZWxwZXJcIiksIG9wdGlvbnMpO1xuICAgIHJldHVybiB7IGlkOiByZWYuaWQsIHBpZDogcmVmLnBpZCB9O1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLWhlbHBlci1jYWxsXCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBoZWxwZXJJZDogc3RyaW5nLCBtZXRob2Q6IHN0cmluZywgcGF5bG9hZD86IHVua25vd24sIHRpbWVvdXRNcz86IG51bWJlcikgPT4ge1xuICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibmF0aXZlLWhlbHBlclwiKTtcbiAgICByZXR1cm4gbmF0aXZlQnJpZGdlLmNhbGxIZWxwZXIodHdlYWtJZCwgaGVscGVySWQsIG1ldGhvZCwgcGF5bG9hZCwgdGltZW91dE1zKTtcbiAgfSxcbik7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpyZXZlYWxcIiwgKF9lLCBwOiBzdHJpbmcpID0+IHtcbiAgc2hlbGwub3BlblBhdGgocCkuY2F0Y2goKCkgPT4ge30pO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpvcGVuLWV4dGVybmFsXCIsIChfZSwgdXJsOiBzdHJpbmcpID0+IHtcbiAgY29uc3QgcGFyc2VkID0gbmV3IFVSTCh1cmwpO1xuICBpZiAocGFyc2VkLnByb3RvY29sICE9PSBcImh0dHBzOlwiIHx8IHBhcnNlZC5ob3N0bmFtZSAhPT0gXCJnaXRodWIuY29tXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJvbmx5IGdpdGh1Yi5jb20gbGlua3MgY2FuIGJlIG9wZW5lZCBmcm9tIHR3ZWFrIG1ldGFkYXRhXCIpO1xuICB9XG4gIHNoZWxsLm9wZW5FeHRlcm5hbChwYXJzZWQudG9TdHJpbmcoKSkuY2F0Y2goKCkgPT4ge30pO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb3B5LXRleHRcIiwgKF9lLCB0ZXh0OiBzdHJpbmcpID0+IHtcbiAgY2xpcGJvYXJkLndyaXRlVGV4dChTdHJpbmcodGV4dCkpO1xuICByZXR1cm4gdHJ1ZTtcbn0pO1xuXG4vLyBNYW51YWwgZm9yY2UtcmVsb2FkIHRyaWdnZXIgZnJvbSB0aGUgcmVuZGVyZXIgKGUuZy4gdGhlIFwiRm9yY2UgUmVsb2FkXCJcbi8vIGJ1dHRvbiBvbiBvdXIgaW5qZWN0ZWQgVHdlYWtzIHBhZ2UpLiBCeXBhc3NlcyB0aGUgd2F0Y2hlciBkZWJvdW5jZS5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpyZWxvYWQtdHdlYWtzXCIsICgpID0+IHtcbiAgcmVsb2FkVHdlYWtzKFwibWFudWFsXCIsIHR3ZWFrTGlmZWN5Y2xlRGVwcyk7XG4gIHJldHVybiB7IGF0OiBEYXRlLm5vdygpLCBjb3VudDogdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkLmxlbmd0aCB9O1xufSk7XG5cbi8vIDQuIEZpbGVzeXN0ZW0gd2F0Y2hlciBcdTIxOTIgZGVib3VuY2VkIHJlbG9hZCArIGJyb2FkY2FzdC5cbi8vICAgIFdlIHdhdGNoIHRoZSB0d2Vha3MgZGlyIGZvciBhbnkgY2hhbmdlLiBPbiB0aGUgZmlyc3QgdGljayBvZiBpbmFjdGl2aXR5XG4vLyAgICB3ZSBzdG9wIG1haW4tc2lkZSB0d2Vha3MsIGNsZWFyIHRoZWlyIGNhY2hlZCBtb2R1bGVzLCByZS1kaXNjb3ZlciwgdGhlblxuLy8gICAgcmVzdGFydCBhbmQgYnJvYWRjYXN0IGBjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkYCB0byBldmVyeSByZW5kZXJlciBzbyBpdFxuLy8gICAgY2FuIHJlLWluaXQgaXRzIGhvc3QuXG5jb25zdCBSRUxPQURfREVCT1VOQ0VfTVMgPSAyNTA7XG5sZXQgcmVsb2FkVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5mdW5jdGlvbiBzY2hlZHVsZVJlbG9hZChyZWFzb246IHN0cmluZyk6IHZvaWQge1xuICBpZiAocmVsb2FkVGltZXIpIGNsZWFyVGltZW91dChyZWxvYWRUaW1lcik7XG4gIHJlbG9hZFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgcmVsb2FkVGltZXIgPSBudWxsO1xuICAgIHJlbG9hZFR3ZWFrcyhyZWFzb24sIHR3ZWFrTGlmZWN5Y2xlRGVwcyk7XG4gIH0sIFJFTE9BRF9ERUJPVU5DRV9NUyk7XG59XG5cbnRyeSB7XG4gIGNvbnN0IHdhdGNoZXIgPSBjaG9raWRhci53YXRjaChUV0VBS1NfRElSLCB7XG4gICAgaWdub3JlSW5pdGlhbDogdHJ1ZSxcbiAgICAvLyBXYWl0IGZvciBmaWxlcyB0byBzZXR0bGUgYmVmb3JlIHRyaWdnZXJpbmcgXHUyMDE0IGd1YXJkcyBhZ2FpbnN0IHBhcnRpYWxseVxuICAgIC8vIHdyaXR0ZW4gdHdlYWsgZmlsZXMgZHVyaW5nIGVkaXRvciBzYXZlcyAvIGdpdCBjaGVja291dHMuXG4gICAgYXdhaXRXcml0ZUZpbmlzaDogeyBzdGFiaWxpdHlUaHJlc2hvbGQ6IDE1MCwgcG9sbEludGVydmFsOiA1MCB9LFxuICAgIC8vIEF2b2lkIGVhdGluZyBDUFUgb24gaHVnZSBub2RlX21vZHVsZXMgdHJlZXMgaW5zaWRlIHR3ZWFrIGZvbGRlcnMuXG4gICAgaWdub3JlZDogKHApID0+IHAuaW5jbHVkZXMoYCR7VFdFQUtTX0RJUn0vYCkgJiYgL1xcL25vZGVfbW9kdWxlc1xcLy8udGVzdChwKSxcbiAgfSk7XG4gIHdhdGNoZXIub24oXCJhbGxcIiwgKGV2ZW50LCBwYXRoKSA9PiBzY2hlZHVsZVJlbG9hZChgJHtldmVudH0gJHtwYXRofWApKTtcbiAgd2F0Y2hlci5vbihcImVycm9yXCIsIChlKSA9PiBsb2coXCJ3YXJuXCIsIFwid2F0Y2hlciBlcnJvcjpcIiwgZSkpO1xuICBsb2coXCJpbmZvXCIsIFwid2F0Y2hpbmdcIiwgVFdFQUtTX0RJUik7XG4gIGFwcC5vbihcIndpbGwtcXVpdFwiLCAoKSA9PiB3YXRjaGVyLmNsb3NlKCkuY2F0Y2goKCkgPT4ge30pKTtcbn0gY2F0Y2ggKGUpIHtcbiAgbG9nKFwiZXJyb3JcIiwgXCJmYWlsZWQgdG8gc3RhcnQgd2F0Y2hlcjpcIiwgZSk7XG59XG5cbi8vIC0tLSBoZWxwZXJzIC0tLVxuXG5mdW5jdGlvbiBsb2FkQWxsTWFpblR3ZWFrcygpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICB0d2Vha1N0YXRlLmRpc2NvdmVyZWQgPSBkaXNjb3ZlclR3ZWFrcyhUV0VBS1NfRElSKTtcbiAgICBsb2coXG4gICAgICBcImluZm9cIixcbiAgICAgIGBkaXNjb3ZlcmVkICR7dHdlYWtTdGF0ZS5kaXNjb3ZlcmVkLmxlbmd0aH0gdHdlYWsocyk6YCxcbiAgICAgIHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+IHQubWFuaWZlc3QuaWQpLmpvaW4oXCIsIFwiKSxcbiAgICApO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nKFwiZXJyb3JcIiwgXCJ0d2VhayBkaXNjb3ZlcnkgZmFpbGVkOlwiLCBlKTtcbiAgICB0d2Vha1N0YXRlLmRpc2NvdmVyZWQgPSBbXTtcbiAgfVxuXG4gIHN5bmNNY3BTZXJ2ZXJzRnJvbUVuYWJsZWRUd2Vha3MoKTtcblxuICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkKSB7XG4gICAgaWYgKCFpc01haW5Qcm9jZXNzVHdlYWtTY29wZSh0Lm1hbmlmZXN0LnNjb3BlKSkgY29udGludWU7XG4gICAgaWYgKCFpc1R3ZWFrRW5hYmxlZCh0Lm1hbmlmZXN0LmlkKSkge1xuICAgICAgbG9nKFwiaW5mb1wiLCBgc2tpcHBpbmcgZGlzYWJsZWQgbWFpbiB0d2VhazogJHt0Lm1hbmlmZXN0LmlkfWApO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBtb2QgPSByZXF1aXJlKHQuZW50cnkpO1xuICAgICAgY29uc3QgdHdlYWsgPSBtb2QuZGVmYXVsdCA/PyBtb2Q7XG4gICAgICBpZiAodHlwZW9mIHR3ZWFrPy5zdGFydCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IHN0b3JhZ2UgPSBjcmVhdGVEaXNrU3RvcmFnZSh1c2VyUm9vdCEsIHQubWFuaWZlc3QuaWQpO1xuICAgICAgICB0d2Vhay5zdGFydCh7XG4gICAgICAgICAgbWFuaWZlc3Q6IHQubWFuaWZlc3QsXG4gICAgICAgICAgcHJvY2VzczogXCJtYWluXCIsXG4gICAgICAgICAgbG9nOiBtYWtlTG9nZ2VyKHQubWFuaWZlc3QuaWQpLFxuICAgICAgICAgIHN0b3JhZ2UsXG4gICAgICAgICAgYnJpZGdlOiBtYWtlTWFpbkJyaWRnZSgpLFxuICAgICAgICAgIGlwYzogbWFrZU1haW5JcGModC5tYW5pZmVzdC5pZCksXG4gICAgICAgICAgZnM6IG1ha2VNYWluRnModC5tYW5pZmVzdC5pZCksXG4gICAgICAgICAgbW9kZWw6IG1ha2VNb2RlbEFwaSh0Lm1hbmlmZXN0LmlkKSxcbiAgICAgICAgICBjb2RleDogbWFrZUNvZGV4QXBpKHQpLFxuICAgICAgICB9KTtcbiAgICAgICAgdHdlYWtTdGF0ZS5sb2FkZWRNYWluLnNldCh0Lm1hbmlmZXN0LmlkLCB7XG4gICAgICAgICAgc3RvcDogdHdlYWsuc3RvcCxcbiAgICAgICAgICBzdG9yYWdlLFxuICAgICAgICB9KTtcbiAgICAgICAgbG9nKFwiaW5mb1wiLCBgc3RhcnRlZCBtYWluIHR3ZWFrOiAke3QubWFuaWZlc3QuaWR9YCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwiZXJyb3JcIiwgYHR3ZWFrICR7dC5tYW5pZmVzdC5pZH0gZmFpbGVkIHRvIHN0YXJ0OmAsIGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzeW5jTWNwU2VydmVyc0Zyb21FbmFibGVkVHdlYWtzKCk6IHZvaWQge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHN5bmNNYW5hZ2VkTWNwU2VydmVycyh7XG4gICAgICBjb25maWdQYXRoOiBDT0RFWF9DT05GSUdfRklMRSxcbiAgICAgIHR3ZWFrczogdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkLmZpbHRlcigodCkgPT4gaXNUd2Vha0VuYWJsZWQodC5tYW5pZmVzdC5pZCkpLFxuICAgIH0pO1xuICAgIGlmIChyZXN1bHQuY2hhbmdlZCkge1xuICAgICAgbG9nKFwiaW5mb1wiLCBgc3luY2VkIENvZGV4IE1DUCBjb25maWc6ICR7cmVzdWx0LnNlcnZlck5hbWVzLmpvaW4oXCIsIFwiKSB8fCBcIm5vbmVcIn1gKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5za2lwcGVkU2VydmVyTmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgbG9nKFxuICAgICAgICBcImluZm9cIixcbiAgICAgICAgYHNraXBwZWQgQ29kZXgrKyBtYW5hZ2VkIE1DUCBzZXJ2ZXIocykgYWxyZWFkeSBjb25maWd1cmVkIGJ5IHVzZXI6ICR7cmVzdWx0LnNraXBwZWRTZXJ2ZXJOYW1lcy5qb2luKFwiLCBcIil9YCxcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nKFwid2FyblwiLCBcImZhaWxlZCB0byBzeW5jIENvZGV4IE1DUCBjb25maWc6XCIsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN0b3BBbGxNYWluVHdlYWtzKCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IFtpZCwgdF0gb2YgdHdlYWtTdGF0ZS5sb2FkZWRNYWluKSB7XG4gICAgdHJ5IHtcbiAgICAgIHQuc3RvcD8uKCk7XG4gICAgICB0LnN0b3JhZ2UuZmx1c2goKTtcbiAgICAgIGxvZyhcImluZm9cIiwgYHN0b3BwZWQgbWFpbiB0d2VhazogJHtpZH1gKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIGBzdG9wIGZhaWxlZCBmb3IgJHtpZH06YCwgZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIG5hdGl2ZUJyaWRnZS5kaXNwb3NlVHdlYWsoaWQpO1xuICAgICAgZGlzcG9zZU93bFZpZXdzRm9yVHdlYWsoaWQpO1xuICAgIH1cbiAgfVxuICB0d2Vha1N0YXRlLmxvYWRlZE1haW4uY2xlYXIoKTtcbn1cblxuZnVuY3Rpb24gY2xlYXJUd2Vha01vZHVsZUNhY2hlKCk6IHZvaWQge1xuICBjb25zdCByb290U2V0ID0gbmV3IFNldDxzdHJpbmc+KFtUV0VBS1NfRElSLCBzYWZlUmVhbHBhdGgoVFdFQUtTX0RJUildKTtcbiAgY29uc3QgZW50cnlTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCB0d2VhayBvZiB0d2Vha1N0YXRlLmRpc2NvdmVyZWQpIHtcbiAgICByb290U2V0LmFkZCh0d2Vhay5kaXIpO1xuICAgIHJvb3RTZXQuYWRkKHNhZmVSZWFscGF0aCh0d2Vhay5kaXIpKTtcbiAgICBlbnRyeVNldC5hZGQodHdlYWsuZW50cnkpO1xuICAgIGVudHJ5U2V0LmFkZChzYWZlUmVhbHBhdGgodHdlYWsuZW50cnkpKTtcbiAgfVxuXG4gIGNvbnN0IHJvb3RzID0gWy4uLnJvb3RTZXRdO1xuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhyZXF1aXJlLmNhY2hlKSkge1xuICAgIGNvbnN0IHJlYWxLZXkgPSBzYWZlUmVhbHBhdGgoa2V5KTtcbiAgICBjb25zdCBpc1R3ZWFrTW9kdWxlID1cbiAgICAgIGVudHJ5U2V0LmhhcyhrZXkpIHx8XG4gICAgICBlbnRyeVNldC5oYXMocmVhbEtleSkgfHxcbiAgICAgIHJvb3RzLnNvbWUoKHJvb3QpID0+IGlzUGF0aEluc2lkZShyb290LCBrZXkpIHx8IGlzUGF0aEluc2lkZShyb290LCByZWFsS2V5KSk7XG4gICAgaWYgKGlzVHdlYWtNb2R1bGUpIGRlbGV0ZSByZXF1aXJlLmNhY2hlW2tleV07XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FmZVJlYWxwYXRoKGZpbGVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICB0cnkge1xuICAgIHJldHVybiByZWFscGF0aFN5bmMoZmlsZVBhdGgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gZmlsZVBhdGg7XG4gIH1cbn1cblxuY29uc3QgVVBEQVRFX0NIRUNLX0lOVEVSVkFMX01TID0gMjQgKiA2MCAqIDYwICogMTAwMDtcbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUNvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2s+IHtcbiAgY29uc3Qgc3RhdGUgPSByZWFkU3RhdGUoKTtcbiAgY29uc3QgY2FjaGVkID0gc3RhdGUuY29kZXhQbHVzUGx1cz8udXBkYXRlQ2hlY2s7XG4gIGNvbnN0IGNoYW5uZWwgPSBzdGF0ZS5jb2RleFBsdXNQbHVzPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCI7XG4gIGNvbnN0IHJlcG8gPSBzdGF0ZS5jb2RleFBsdXNQbHVzPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE87XG4gIGlmIChcbiAgICAhZm9yY2UgJiZcbiAgICBjYWNoZWQgJiZcbiAgICBjYWNoZWQuY3VycmVudFZlcnNpb24gPT09IENPREVYX1BMVVNQTFVTX1ZFUlNJT04gJiZcbiAgICBEYXRlLm5vdygpIC0gRGF0ZS5wYXJzZShjYWNoZWQuY2hlY2tlZEF0KSA8IFVQREFURV9DSEVDS19JTlRFUlZBTF9NU1xuICApIHtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9XG5cbiAgY29uc3QgcmVsZWFzZSA9IGF3YWl0IGZldGNoTGF0ZXN0UmVsZWFzZShyZXBvLCBDT0RFWF9QTFVTUExVU19WRVJTSU9OLCBjaGFubmVsID09PSBcInByZXJlbGVhc2VcIik7XG4gIGNvbnN0IGxhdGVzdFZlcnNpb24gPSByZWxlYXNlLmxhdGVzdFRhZyA/IG5vcm1hbGl6ZVZlcnNpb24ocmVsZWFzZS5sYXRlc3RUYWcpIDogbnVsbDtcbiAgY29uc3QgY2hlY2s6IENvZGV4UGx1c1BsdXNVcGRhdGVDaGVjayA9IHtcbiAgICBjaGVja2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBjdXJyZW50VmVyc2lvbjogQ09ERVhfUExVU1BMVVNfVkVSU0lPTixcbiAgICBsYXRlc3RWZXJzaW9uLFxuICAgIHJlbGVhc2VVcmw6IHJlbGVhc2UucmVsZWFzZVVybCA/PyBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb30vcmVsZWFzZXNgLFxuICAgIHJlbGVhc2VOb3RlczogcmVsZWFzZS5yZWxlYXNlTm90ZXMsXG4gICAgdXBkYXRlQXZhaWxhYmxlOiBsYXRlc3RWZXJzaW9uXG4gICAgICA/IGNvbXBhcmVWZXJzaW9ucyhub3JtYWxpemVWZXJzaW9uKGxhdGVzdFZlcnNpb24pLCBDT0RFWF9QTFVTUExVU19WRVJTSU9OKSA+IDBcbiAgICAgIDogZmFsc2UsXG4gICAgLi4uKHJlbGVhc2UuZXJyb3IgPyB7IGVycm9yOiByZWxlYXNlLmVycm9yIH0gOiB7fSksXG4gIH07XG4gIHN0YXRlLmNvZGV4UGx1c1BsdXMgPz89IHt9O1xuICBzdGF0ZS5jb2RleFBsdXNQbHVzLnVwZGF0ZUNoZWNrID0gY2hlY2s7XG4gIHdyaXRlU3RhdGUoc3RhdGUpO1xuICByZXR1cm4gY2hlY2s7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZVR3ZWFrVXBkYXRlQ2hlY2sodDogRGlzY292ZXJlZFR3ZWFrKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGlkID0gdC5tYW5pZmVzdC5pZDtcbiAgY29uc3QgcmVwbyA9IHQubWFuaWZlc3QuZ2l0aHViUmVwbztcbiAgY29uc3Qgc3RhdGUgPSByZWFkU3RhdGUoKTtcbiAgY29uc3QgY2FjaGVkID0gc3RhdGUudHdlYWtVcGRhdGVDaGVja3M/LltpZF07XG4gIGlmIChcbiAgICBjYWNoZWQgJiZcbiAgICBjYWNoZWQucmVwbyA9PT0gcmVwbyAmJlxuICAgIGNhY2hlZC5jdXJyZW50VmVyc2lvbiA9PT0gdC5tYW5pZmVzdC52ZXJzaW9uICYmXG4gICAgRGF0ZS5ub3coKSAtIERhdGUucGFyc2UoY2FjaGVkLmNoZWNrZWRBdCkgPCBVUERBVEVfQ0hFQ0tfSU5URVJWQUxfTVNcbiAgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbmV4dCA9IGF3YWl0IGZldGNoTGF0ZXN0UmVsZWFzZShyZXBvLCB0Lm1hbmlmZXN0LnZlcnNpb24pO1xuICBjb25zdCBsYXRlc3RWZXJzaW9uID0gbmV4dC5sYXRlc3RUYWcgPyBub3JtYWxpemVWZXJzaW9uKG5leHQubGF0ZXN0VGFnKSA6IG51bGw7XG4gIGNvbnN0IGNoZWNrOiBUd2Vha1VwZGF0ZUNoZWNrID0ge1xuICAgIGNoZWNrZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIHJlcG8sXG4gICAgY3VycmVudFZlcnNpb246IHQubWFuaWZlc3QudmVyc2lvbixcbiAgICBsYXRlc3RWZXJzaW9uLFxuICAgIGxhdGVzdFRhZzogbmV4dC5sYXRlc3RUYWcsXG4gICAgcmVsZWFzZVVybDogbmV4dC5yZWxlYXNlVXJsLFxuICAgIHVwZGF0ZUF2YWlsYWJsZTogbGF0ZXN0VmVyc2lvblxuICAgICAgPyBjb21wYXJlVmVyc2lvbnMobGF0ZXN0VmVyc2lvbiwgbm9ybWFsaXplVmVyc2lvbih0Lm1hbmlmZXN0LnZlcnNpb24pKSA+IDBcbiAgICAgIDogZmFsc2UsXG4gICAgLi4uKG5leHQuZXJyb3IgPyB7IGVycm9yOiBuZXh0LmVycm9yIH0gOiB7fSksXG4gIH07XG4gIHN0YXRlLnR3ZWFrVXBkYXRlQ2hlY2tzID8/PSB7fTtcbiAgc3RhdGUudHdlYWtVcGRhdGVDaGVja3NbaWRdID0gY2hlY2s7XG4gIHdyaXRlU3RhdGUoc3RhdGUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaExhdGVzdFJlbGVhc2UoXG4gIHJlcG86IHN0cmluZyxcbiAgY3VycmVudFZlcnNpb246IHN0cmluZyxcbiAgaW5jbHVkZVByZXJlbGVhc2UgPSBmYWxzZSxcbik6IFByb21pc2U8eyBsYXRlc3RUYWc6IHN0cmluZyB8IG51bGw7IHJlbGVhc2VVcmw6IHN0cmluZyB8IG51bGw7IHJlbGVhc2VOb3Rlczogc3RyaW5nIHwgbnVsbDsgZXJyb3I/OiBzdHJpbmcgfT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA4MDAwKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZW5kcG9pbnQgPSBpbmNsdWRlUHJlcmVsZWFzZSA/IFwicmVsZWFzZXM/cGVyX3BhZ2U9MjBcIiA6IFwicmVsZWFzZXMvbGF0ZXN0XCI7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99LyR7ZW5kcG9pbnR9YCwge1xuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi92bmQuZ2l0aHViK2pzb25cIixcbiAgICAgICAgICBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Y3VycmVudFZlcnNpb259YCxcbiAgICAgICAgfSxcbiAgICAgICAgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCxcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlcy5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgICByZXR1cm4geyBsYXRlc3RUYWc6IG51bGwsIHJlbGVhc2VVcmw6IG51bGwsIHJlbGVhc2VOb3RlczogbnVsbCwgZXJyb3I6IFwibm8gR2l0SHViIHJlbGVhc2UgZm91bmRcIiB9O1xuICAgICAgfVxuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgcmV0dXJuIHsgbGF0ZXN0VGFnOiBudWxsLCByZWxlYXNlVXJsOiBudWxsLCByZWxlYXNlTm90ZXM6IG51bGwsIGVycm9yOiBgR2l0SHViIHJldHVybmVkICR7cmVzLnN0YXR1c31gIH07XG4gICAgICB9XG4gICAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzLmpzb24oKSBhcyB7IHRhZ19uYW1lPzogc3RyaW5nOyBodG1sX3VybD86IHN0cmluZzsgYm9keT86IHN0cmluZzsgZHJhZnQ/OiBib29sZWFuIH0gfCBBcnJheTx7IHRhZ19uYW1lPzogc3RyaW5nOyBodG1sX3VybD86IHN0cmluZzsgYm9keT86IHN0cmluZzsgZHJhZnQ/OiBib29sZWFuIH0+O1xuICAgICAgY29uc3QgYm9keSA9IEFycmF5LmlzQXJyYXkoanNvbikgPyBqc29uLmZpbmQoKHJlbGVhc2UpID0+ICFyZWxlYXNlLmRyYWZ0KSA6IGpzb247XG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgcmV0dXJuIHsgbGF0ZXN0VGFnOiBudWxsLCByZWxlYXNlVXJsOiBudWxsLCByZWxlYXNlTm90ZXM6IG51bGwsIGVycm9yOiBcIm5vIEdpdEh1YiByZWxlYXNlIGZvdW5kXCIgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxhdGVzdFRhZzogYm9keS50YWdfbmFtZSA/PyBudWxsLFxuICAgICAgICByZWxlYXNlVXJsOiBib2R5Lmh0bWxfdXJsID8/IGBodHRwczovL2dpdGh1Yi5jb20vJHtyZXBvfS9yZWxlYXNlc2AsXG4gICAgICAgIHJlbGVhc2VOb3RlczogYm9keS5ib2R5ID8/IG51bGwsXG4gICAgICB9O1xuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGxhdGVzdFRhZzogbnVsbCxcbiAgICAgIHJlbGVhc2VVcmw6IG51bGwsXG4gICAgICByZWxlYXNlTm90ZXM6IG51bGwsXG4gICAgICBlcnJvcjogZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogU3RyaW5nKGUpLFxuICAgIH07XG4gIH1cbn1cblxuaW50ZXJmYWNlIFR3ZWFrU3RvcmVGZXRjaFJlc3VsdCB7XG4gIHJlZ2lzdHJ5OiBUd2Vha1N0b3JlUmVnaXN0cnk7XG4gIGZldGNoZWRBdDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgU3RvcmVJbnN0YWxsTWV0YWRhdGEge1xuICByZXBvOiBzdHJpbmc7XG4gIGFwcHJvdmVkQ29tbWl0U2hhOiBzdHJpbmc7XG4gIGluc3RhbGxlZEF0OiBzdHJpbmc7XG4gIHN0b3JlSW5kZXhVcmw6IHN0cmluZztcbiAgZmlsZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5jbGFzcyBTdG9yZVR3ZWFrTW9kaWZpZWRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IodHdlYWtOYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcihcbiAgICAgIGAke3R3ZWFrTmFtZX0gaGFzIGxvY2FsIHNvdXJjZSBjaGFuZ2VzLCBzbyBDb2RleCsrIGNhbid0IGF1dG8tdXBkYXRlIGl0LiBSZXZlcnQgeW91ciBsb2NhbCBjaGFuZ2VzIG9yIHJlaW5zdGFsbCB0aGUgdHdlYWsgbWFudWFsbHkuYCxcbiAgICApO1xuICAgIHRoaXMubmFtZSA9IFwiU3RvcmVUd2Vha01vZGlmaWVkRXJyb3JcIjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaFR3ZWFrU3RvcmVSZWdpc3RyeSgpOiBQcm9taXNlPFR3ZWFrU3RvcmVGZXRjaFJlc3VsdD4ge1xuICBjb25zdCBmZXRjaGVkQXQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gIHRyeSB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDgwMDApO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChUV0VBS19TVE9SRV9JTkRFWF9VUkwsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgIFwiVXNlci1BZ2VudFwiOiBgY29kZXgtcGx1c3BsdXMvJHtDT0RFWF9QTFVTUExVU19WRVJTSU9OfWAsXG4gICAgICAgIH0sXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICB9KTtcbiAgICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYHN0b3JlIHJldHVybmVkICR7cmVzLnN0YXR1c31gKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHJlZ2lzdHJ5OiBub3JtYWxpemVTdG9yZVJlZ2lzdHJ5KGF3YWl0IHJlcy5qc29uKCkpLFxuICAgICAgICBmZXRjaGVkQXQsXG4gICAgICB9O1xuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc3QgZXJyb3IgPSBlIGluc3RhbmNlb2YgRXJyb3IgPyBlIDogbmV3IEVycm9yKFN0cmluZyhlKSk7XG4gICAgbG9nKFwid2FyblwiLCBcImZhaWxlZCB0byBmZXRjaCB0d2VhayBzdG9yZSByZWdpc3RyeTpcIiwgZXJyb3IubWVzc2FnZSk7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFN0b3JlVHdlYWsoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB1cmwgPSBzdG9yZUFyY2hpdmVVcmwoZW50cnkpO1xuICBjb25zdCB3b3JrID0gbWtkdGVtcFN5bmMoam9pbih0bXBkaXIoKSwgXCJjb2RleHBwLXN0b3JlLXR3ZWFrLVwiKSk7XG4gIGNvbnN0IGFyY2hpdmUgPSBqb2luKHdvcmssIFwic291cmNlLnRhci5nelwiKTtcbiAgY29uc3QgZXh0cmFjdERpciA9IGpvaW4od29yaywgXCJleHRyYWN0XCIpO1xuICBjb25zdCB0YXJnZXQgPSBqb2luKFRXRUFLU19ESVIsIGVudHJ5LmlkKTtcbiAgY29uc3Qgc3RhZ2VkVGFyZ2V0ID0gam9pbih3b3JrLCBcInN0YWdlZFwiLCBlbnRyeS5pZCk7XG5cbiAgdHJ5IHtcbiAgICBsb2coXCJpbmZvXCIsIGBpbnN0YWxsaW5nIHN0b3JlIHR3ZWFrICR7ZW50cnkuaWR9IGZyb20gJHtlbnRyeS5yZXBvfUAke2VudHJ5LmFwcHJvdmVkQ29tbWl0U2hhfWApO1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczogeyBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Q09ERVhfUExVU1BMVVNfVkVSU0lPTn1gIH0sXG4gICAgICByZWRpcmVjdDogXCJmb2xsb3dcIixcbiAgICB9KTtcbiAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBkb3dubG9hZCBmYWlsZWQ6ICR7cmVzLnN0YXR1c31gKTtcbiAgICBjb25zdCBieXRlcyA9IEJ1ZmZlci5mcm9tKGF3YWl0IHJlcy5hcnJheUJ1ZmZlcigpKTtcbiAgICB3cml0ZUZpbGVTeW5jKGFyY2hpdmUsIGJ5dGVzKTtcbiAgICBta2RpclN5bmMoZXh0cmFjdERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgZXh0cmFjdFRhckFyY2hpdmUoYXJjaGl2ZSwgZXh0cmFjdERpcik7XG4gICAgY29uc3Qgc291cmNlID0gZmluZFR3ZWFrUm9vdChleHRyYWN0RGlyKTtcbiAgICBpZiAoIXNvdXJjZSkgdGhyb3cgbmV3IEVycm9yKFwiZG93bmxvYWRlZCBhcmNoaXZlIGRpZCBub3QgY29udGFpbiBtYW5pZmVzdC5qc29uXCIpO1xuICAgIHZhbGlkYXRlU3RvcmVUd2Vha1NvdXJjZShlbnRyeSwgc291cmNlKTtcbiAgICBybVN5bmMoc3RhZ2VkVGFyZ2V0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgY29weVR3ZWFrU291cmNlKHNvdXJjZSwgc3RhZ2VkVGFyZ2V0KTtcbiAgICBjb25zdCBzdGFnZWRGaWxlcyA9IGhhc2hUd2Vha1NvdXJjZShzdGFnZWRUYXJnZXQpO1xuICAgIHdyaXRlRmlsZVN5bmMoXG4gICAgICBqb2luKHN0YWdlZFRhcmdldCwgXCIuY29kZXhwcC1zdG9yZS5qc29uXCIpLFxuICAgICAgSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIHtcbiAgICAgICAgICByZXBvOiBlbnRyeS5yZXBvLFxuICAgICAgICAgIGFwcHJvdmVkQ29tbWl0U2hhOiBlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSxcbiAgICAgICAgICBpbnN0YWxsZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgIHN0b3JlSW5kZXhVcmw6IFRXRUFLX1NUT1JFX0lOREVYX1VSTCxcbiAgICAgICAgICBmaWxlczogc3RhZ2VkRmlsZXMsXG4gICAgICAgIH0sXG4gICAgICAgIG51bGwsXG4gICAgICAgIDIsXG4gICAgICApLFxuICAgICk7XG4gICAgYXdhaXQgYXNzZXJ0U3RvcmVUd2Vha0NsZWFuRm9yQXV0b1VwZGF0ZShlbnRyeSwgdGFyZ2V0LCB3b3JrKTtcbiAgICBybVN5bmModGFyZ2V0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgY3BTeW5jKHN0YWdlZFRhcmdldCwgdGFyZ2V0LCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBybVN5bmMod29yaywgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVUd2Vha1N0b3JlU3VibWlzc2lvbihyZXBvSW5wdXQ6IHN0cmluZyk6IFByb21pc2U8VHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uPiB7XG4gIGNvbnN0IHJlcG8gPSBub3JtYWxpemVHaXRIdWJSZXBvKHJlcG9JbnB1dCk7XG4gIGNvbnN0IHJlcG9JbmZvID0gYXdhaXQgZmV0Y2hHaXRodWJKc29uPHsgZGVmYXVsdF9icmFuY2g/OiBzdHJpbmcgfT4oYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfWApO1xuICBjb25zdCBkZWZhdWx0QnJhbmNoID0gcmVwb0luZm8uZGVmYXVsdF9icmFuY2g7XG4gIGlmICghZGVmYXVsdEJyYW5jaCkgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmVzb2x2ZSBkZWZhdWx0IGJyYW5jaCBmb3IgJHtyZXBvfWApO1xuXG4gIGNvbnN0IGNvbW1pdCA9IGF3YWl0IGZldGNoR2l0aHViSnNvbjx7XG4gICAgc2hhPzogc3RyaW5nO1xuICAgIGh0bWxfdXJsPzogc3RyaW5nO1xuICB9PihgaHR0cHM6Ly9hcGkuZ2l0aHViLmNvbS9yZXBvcy8ke3JlcG99L2NvbW1pdHMvJHtlbmNvZGVVUklDb21wb25lbnQoZGVmYXVsdEJyYW5jaCl9YCk7XG4gIGlmICghY29tbWl0LnNoYSkgdGhyb3cgbmV3IEVycm9yKGBDb3VsZCBub3QgcmVzb2x2ZSBjdXJyZW50IGNvbW1pdCBmb3IgJHtyZXBvfWApO1xuXG4gIGNvbnN0IG1hbmlmZXN0ID0gYXdhaXQgZmV0Y2hNYW5pZmVzdEF0Q29tbWl0KHJlcG8sIGNvbW1pdC5zaGEpLmNhdGNoKChlKSA9PiB7XG4gICAgbG9nKFwid2FyblwiLCBgY291bGQgbm90IHJlYWQgbWFuaWZlc3QgZm9yIHN0b3JlIHN1Ym1pc3Npb24gJHtyZXBvfUAke2NvbW1pdC5zaGF9OmAsIGUpO1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgcmVwbyxcbiAgICBkZWZhdWx0QnJhbmNoLFxuICAgIGNvbW1pdFNoYTogY29tbWl0LnNoYSxcbiAgICBjb21taXRVcmw6IGNvbW1pdC5odG1sX3VybCA/PyBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb30vY29tbWl0LyR7Y29tbWl0LnNoYX1gLFxuICAgIG1hbmlmZXN0OiBtYW5pZmVzdFxuICAgICAgPyB7XG4gICAgICAgICAgaWQ6IHR5cGVvZiBtYW5pZmVzdC5pZCA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0LmlkIDogdW5kZWZpbmVkLFxuICAgICAgICAgIG5hbWU6IHR5cGVvZiBtYW5pZmVzdC5uYW1lID09PSBcInN0cmluZ1wiID8gbWFuaWZlc3QubmFtZSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB2ZXJzaW9uOiB0eXBlb2YgbWFuaWZlc3QudmVyc2lvbiA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0LnZlcnNpb24gOiB1bmRlZmluZWQsXG4gICAgICAgICAgZGVzY3JpcHRpb246IHR5cGVvZiBtYW5pZmVzdC5kZXNjcmlwdGlvbiA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0LmRlc2NyaXB0aW9uIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGljb25Vcmw6IHR5cGVvZiBtYW5pZmVzdC5pY29uVXJsID09PSBcInN0cmluZ1wiID8gbWFuaWZlc3QuaWNvblVybCA6IHVuZGVmaW5lZCxcbiAgICAgICAgfVxuICAgICAgOiB1bmRlZmluZWQsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoR2l0aHViSnNvbjxUPih1cmw6IHN0cmluZyk6IFByb21pc2U8VD4ge1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDgwMDApO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgaGVhZGVyczoge1xuICAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL3ZuZC5naXRodWIranNvblwiLFxuICAgICAgICBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Q09ERVhfUExVU1BMVVNfVkVSU0lPTn1gLFxuICAgICAgfSxcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgR2l0SHViIHJldHVybmVkICR7cmVzLnN0YXR1c31gKTtcbiAgICByZXR1cm4gYXdhaXQgcmVzLmpzb24oKSBhcyBUO1xuICB9IGZpbmFsbHkge1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaE1hbmlmZXN0QXRDb21taXQocmVwbzogc3RyaW5nLCBjb21taXRTaGE6IHN0cmluZyk6IFByb21pc2U8UGFydGlhbDxUd2Vha01hbmlmZXN0Pj4ge1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tLyR7cmVwb30vJHtjb21taXRTaGF9L21hbmlmZXN0Lmpzb25gLCB7XG4gICAgaGVhZGVyczoge1xuICAgICAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Q09ERVhfUExVU1BMVVNfVkVSU0lPTn1gLFxuICAgIH0sXG4gIH0pO1xuICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBtYW5pZmVzdCBmZXRjaCByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCk7XG4gIHJldHVybiBhd2FpdCByZXMuanNvbigpIGFzIFBhcnRpYWw8VHdlYWtNYW5pZmVzdD47XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RUYXJBcmNoaXZlKGFyY2hpdmU6IHN0cmluZywgdGFyZ2V0RGlyOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgcmVzdWx0ID0gc3Bhd25TeW5jKFwidGFyXCIsIFtcIi14emZcIiwgYXJjaGl2ZSwgXCItQ1wiLCB0YXJnZXREaXJdLCB7XG4gICAgZW5jb2Rpbmc6IFwidXRmOFwiLFxuICAgIHN0ZGlvOiBbXCJpZ25vcmVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgfSk7XG4gIGlmIChyZXN1bHQuc3RhdHVzICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB0YXIgZXh0cmFjdGlvbiBmYWlsZWQ6ICR7cmVzdWx0LnN0ZGVyciB8fCByZXN1bHQuc3Rkb3V0IHx8IHJlc3VsdC5zdGF0dXN9YCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVTdG9yZVR3ZWFrU291cmNlKGVudHJ5OiBUd2Vha1N0b3JlRW50cnksIHNvdXJjZTogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IG1hbmlmZXN0UGF0aCA9IGpvaW4oc291cmNlLCBcIm1hbmlmZXN0Lmpzb25cIik7XG4gIGNvbnN0IG1hbmlmZXN0ID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWFuaWZlc3RQYXRoLCBcInV0ZjhcIikpIGFzIFR3ZWFrTWFuaWZlc3Q7XG4gIGlmIChtYW5pZmVzdC5pZCAhPT0gZW50cnkubWFuaWZlc3QuaWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGRvd25sb2FkZWQgdHdlYWsgaWQgJHttYW5pZmVzdC5pZH0gZG9lcyBub3QgbWF0Y2ggYXBwcm92ZWQgaWQgJHtlbnRyeS5tYW5pZmVzdC5pZH1gKTtcbiAgfVxuICBpZiAobWFuaWZlc3QuZ2l0aHViUmVwbyAhPT0gZW50cnkucmVwbykge1xuICAgIHRocm93IG5ldyBFcnJvcihgZG93bmxvYWRlZCB0d2VhayByZXBvICR7bWFuaWZlc3QuZ2l0aHViUmVwb30gZG9lcyBub3QgbWF0Y2ggYXBwcm92ZWQgcmVwbyAke2VudHJ5LnJlcG99YCk7XG4gIH1cbiAgaWYgKG1hbmlmZXN0LnZlcnNpb24gIT09IGVudHJ5Lm1hbmlmZXN0LnZlcnNpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGRvd25sb2FkZWQgdHdlYWsgdmVyc2lvbiAke21hbmlmZXN0LnZlcnNpb259IGRvZXMgbm90IG1hdGNoIGFwcHJvdmVkIHZlcnNpb24gJHtlbnRyeS5tYW5pZmVzdC52ZXJzaW9ufWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZpbmRUd2Vha1Jvb3QoZGlyOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKCFleGlzdHNTeW5jKGRpcikpIHJldHVybiBudWxsO1xuICBpZiAoZXhpc3RzU3luYyhqb2luKGRpciwgXCJtYW5pZmVzdC5qc29uXCIpKSkgcmV0dXJuIGRpcjtcbiAgZm9yIChjb25zdCBuYW1lIG9mIHJlYWRkaXJTeW5jKGRpcikpIHtcbiAgICBjb25zdCBjaGlsZCA9IGpvaW4oZGlyLCBuYW1lKTtcbiAgICB0cnkge1xuICAgICAgaWYgKCFzdGF0U3luYyhjaGlsZCkuaXNEaXJlY3RvcnkoKSkgY29udGludWU7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgZm91bmQgPSBmaW5kVHdlYWtSb290KGNoaWxkKTtcbiAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gY29weVR3ZWFrU291cmNlKHNvdXJjZTogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZyk6IHZvaWQge1xuICBjcFN5bmMoc291cmNlLCB0YXJnZXQsIHtcbiAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgZmlsdGVyOiAoc3JjKSA9PiAhLyhefFsvXFxcXF0pKD86XFwuZ2l0fG5vZGVfbW9kdWxlcykoPzpbL1xcXFxdfCQpLy50ZXN0KHNyYyksXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBhc3NlcnRTdG9yZVR3ZWFrQ2xlYW5Gb3JBdXRvVXBkYXRlKFxuICBlbnRyeTogVHdlYWtTdG9yZUVudHJ5LFxuICB0YXJnZXQ6IHN0cmluZyxcbiAgd29yazogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmICghZXhpc3RzU3luYyh0YXJnZXQpKSByZXR1cm47XG4gIGNvbnN0IG1ldGFkYXRhID0gcmVhZFN0b3JlSW5zdGFsbE1ldGFkYXRhKHRhcmdldCk7XG4gIGlmICghbWV0YWRhdGEpIHJldHVybjtcbiAgaWYgKG1ldGFkYXRhLnJlcG8gIT09IGVudHJ5LnJlcG8pIHtcbiAgICB0aHJvdyBuZXcgU3RvcmVUd2Vha01vZGlmaWVkRXJyb3IoZW50cnkubWFuaWZlc3QubmFtZSk7XG4gIH1cbiAgY29uc3QgY3VycmVudEZpbGVzID0gaGFzaFR3ZWFrU291cmNlKHRhcmdldCk7XG4gIGNvbnN0IGJhc2VsaW5lRmlsZXMgPSBtZXRhZGF0YS5maWxlcyA/PyBhd2FpdCBmZXRjaEJhc2VsaW5lU3RvcmVUd2Vha0hhc2hlcyhtZXRhZGF0YSwgd29yayk7XG4gIGlmICghc2FtZUZpbGVIYXNoZXMoY3VycmVudEZpbGVzLCBiYXNlbGluZUZpbGVzKSkge1xuICAgIHRocm93IG5ldyBTdG9yZVR3ZWFrTW9kaWZpZWRFcnJvcihlbnRyeS5tYW5pZmVzdC5uYW1lKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkU3RvcmVJbnN0YWxsTWV0YWRhdGEodGFyZ2V0OiBzdHJpbmcpOiBTdG9yZUluc3RhbGxNZXRhZGF0YSB8IG51bGwge1xuICBjb25zdCBtZXRhZGF0YVBhdGggPSBqb2luKHRhcmdldCwgXCIuY29kZXhwcC1zdG9yZS5qc29uXCIpO1xuICBpZiAoIWV4aXN0c1N5bmMobWV0YWRhdGFQYXRoKSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWV0YWRhdGFQYXRoLCBcInV0ZjhcIikpIGFzIFBhcnRpYWw8U3RvcmVJbnN0YWxsTWV0YWRhdGE+O1xuICAgIGlmICh0eXBlb2YgcGFyc2VkLnJlcG8gIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHBhcnNlZC5hcHByb3ZlZENvbW1pdFNoYSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlcG86IHBhcnNlZC5yZXBvLFxuICAgICAgYXBwcm92ZWRDb21taXRTaGE6IHBhcnNlZC5hcHByb3ZlZENvbW1pdFNoYSxcbiAgICAgIGluc3RhbGxlZEF0OiB0eXBlb2YgcGFyc2VkLmluc3RhbGxlZEF0ID09PSBcInN0cmluZ1wiID8gcGFyc2VkLmluc3RhbGxlZEF0IDogXCJcIixcbiAgICAgIHN0b3JlSW5kZXhVcmw6IHR5cGVvZiBwYXJzZWQuc3RvcmVJbmRleFVybCA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlZC5zdG9yZUluZGV4VXJsIDogXCJcIixcbiAgICAgIGZpbGVzOiBpc0hhc2hSZWNvcmQocGFyc2VkLmZpbGVzKSA/IHBhcnNlZC5maWxlcyA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEJhc2VsaW5lU3RvcmVUd2Vha0hhc2hlcyhcbiAgbWV0YWRhdGE6IFN0b3JlSW5zdGFsbE1ldGFkYXRhLFxuICB3b3JrOiBzdHJpbmcsXG4pOiBQcm9taXNlPFJlY29yZDxzdHJpbmcsIHN0cmluZz4+IHtcbiAgY29uc3QgYmFzZWxpbmVEaXIgPSBqb2luKHdvcmssIFwiYmFzZWxpbmVcIik7XG4gIGNvbnN0IGFyY2hpdmUgPSBqb2luKHdvcmssIFwiYmFzZWxpbmUudGFyLmd6XCIpO1xuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgaHR0cHM6Ly9jb2RlbG9hZC5naXRodWIuY29tLyR7bWV0YWRhdGEucmVwb30vdGFyLmd6LyR7bWV0YWRhdGEuYXBwcm92ZWRDb21taXRTaGF9YCwge1xuICAgIGhlYWRlcnM6IHsgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCB9LFxuICAgIHJlZGlyZWN0OiBcImZvbGxvd1wiLFxuICB9KTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHZlcmlmeSBsb2NhbCB0d2VhayBjaGFuZ2VzIGJlZm9yZSB1cGRhdGU6ICR7cmVzLnN0YXR1c31gKTtcbiAgd3JpdGVGaWxlU3luYyhhcmNoaXZlLCBCdWZmZXIuZnJvbShhd2FpdCByZXMuYXJyYXlCdWZmZXIoKSkpO1xuICBta2RpclN5bmMoYmFzZWxpbmVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBleHRyYWN0VGFyQXJjaGl2ZShhcmNoaXZlLCBiYXNlbGluZURpcik7XG4gIGNvbnN0IHNvdXJjZSA9IGZpbmRUd2Vha1Jvb3QoYmFzZWxpbmVEaXIpO1xuICBpZiAoIXNvdXJjZSkgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHZlcmlmeSBsb2NhbCB0d2VhayBjaGFuZ2VzIGJlZm9yZSB1cGRhdGU6IGJhc2VsaW5lIG1hbmlmZXN0IG1pc3NpbmdcIik7XG4gIHJldHVybiBoYXNoVHdlYWtTb3VyY2Uoc291cmNlKTtcbn1cblxuZnVuY3Rpb24gaGFzaFR3ZWFrU291cmNlKHJvb3Q6IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgY29sbGVjdFR3ZWFrRmlsZUhhc2hlcyhyb290LCByb290LCBvdXQpO1xuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBjb2xsZWN0VHdlYWtGaWxlSGFzaGVzKHJvb3Q6IHN0cmluZywgZGlyOiBzdHJpbmcsIG91dDogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IHZvaWQge1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgcmVhZGRpclN5bmMoZGlyKS5zb3J0KCkpIHtcbiAgICBpZiAobmFtZSA9PT0gXCIuZ2l0XCIgfHwgbmFtZSA9PT0gXCJub2RlX21vZHVsZXNcIiB8fCBuYW1lID09PSBcIi5jb2RleHBwLXN0b3JlLmpzb25cIikgY29udGludWU7XG4gICAgY29uc3QgZnVsbCA9IGpvaW4oZGlyLCBuYW1lKTtcbiAgICBjb25zdCByZWwgPSByZWxhdGl2ZShyb290LCBmdWxsKS5zcGxpdChcIlxcXFxcIikuam9pbihcIi9cIik7XG4gICAgY29uc3Qgc3RhdCA9IHN0YXRTeW5jKGZ1bGwpO1xuICAgIGlmIChzdGF0LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIGNvbGxlY3RUd2Vha0ZpbGVIYXNoZXMocm9vdCwgZnVsbCwgb3V0KTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIXN0YXQuaXNGaWxlKCkpIGNvbnRpbnVlO1xuICAgIG91dFtyZWxdID0gY3JlYXRlSGFzaChcInNoYTI1NlwiKS51cGRhdGUocmVhZEZpbGVTeW5jKGZ1bGwpKS5kaWdlc3QoXCJoZXhcIik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FtZUZpbGVIYXNoZXMoYTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiwgYjogUmVjb3JkPHN0cmluZywgc3RyaW5nPik6IGJvb2xlYW4ge1xuICBjb25zdCBhayA9IE9iamVjdC5rZXlzKGEpLnNvcnQoKTtcbiAgY29uc3QgYmsgPSBPYmplY3Qua2V5cyhiKS5zb3J0KCk7XG4gIGlmIChhay5sZW5ndGggIT09IGJrLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFrLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0gYWtbaV07XG4gICAgaWYgKGtleSAhPT0gYmtbaV0gfHwgYVtrZXldICE9PSBiW2tleV0pIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaXNIYXNoUmVjb3JkKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiBPYmplY3QudmFsdWVzKHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KS5ldmVyeSgodikgPT4gdHlwZW9mIHYgPT09IFwic3RyaW5nXCIpO1xufVxuXG5mdW5jdGlvbiBmYWxsYmFja1NvdXJjZVJvb3QoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgam9pbihob21lZGlyKCksIFwiLmNvZGV4LXBsdXNwbHVzXCIsIFwic291cmNlXCIpLFxuICAgIGpvaW4odXNlclJvb3QhLCBcInNvdXJjZVwiKSxcbiAgXTtcbiAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgIGlmIChleGlzdHNTeW5jKGpvaW4oY2FuZGlkYXRlLCBcInBhY2thZ2VzXCIsIFwiaW5zdGFsbGVyXCIsIFwiZGlzdFwiLCBcImNsaS5qc1wiKSkpIHJldHVybiBjYW5kaWRhdGU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlc2NyaWJlSW5zdGFsbGF0aW9uU291cmNlKHNvdXJjZVJvb3Q6IHN0cmluZyB8IG51bGwpOiBJbnN0YWxsYXRpb25Tb3VyY2Uge1xuICBpZiAoIXNvdXJjZVJvb3QpIHtcbiAgICByZXR1cm4ge1xuICAgICAga2luZDogXCJ1bmtub3duXCIsXG4gICAgICBsYWJlbDogXCJVbmtub3duXCIsXG4gICAgICBkZXRhaWw6IFwiQ29kZXgrKyBzb3VyY2UgbG9jYXRpb24gaXMgbm90IHJlY29yZGVkIHlldC5cIixcbiAgICB9O1xuICB9XG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBzb3VyY2VSb290LnJlcGxhY2UoL1xcXFwvZywgXCIvXCIpO1xuICBpZiAoL1xcLyg/OkhvbWVicmV3fGhvbWVicmV3KVxcL0NlbGxhclxcL2NvZGV4cGx1c3BsdXNcXC8vLnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICByZXR1cm4geyBraW5kOiBcImhvbWVicmV3XCIsIGxhYmVsOiBcIkhvbWVicmV3XCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xuICB9XG4gIGlmIChleGlzdHNTeW5jKGpvaW4oc291cmNlUm9vdCwgXCIuZ2l0XCIpKSkge1xuICAgIHJldHVybiB7IGtpbmQ6IFwibG9jYWwtZGV2XCIsIGxhYmVsOiBcIkxvY2FsIGRldmVsb3BtZW50IGNoZWNrb3V0XCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xuICB9XG4gIGlmIChub3JtYWxpemVkLmVuZHNXaXRoKFwiLy5jb2RleC1wbHVzcGx1cy9zb3VyY2VcIikgfHwgbm9ybWFsaXplZC5pbmNsdWRlcyhcIi8uY29kZXgtcGx1c3BsdXMvc291cmNlL1wiKSkge1xuICAgIHJldHVybiB7IGtpbmQ6IFwiZ2l0aHViLXNvdXJjZVwiLCBsYWJlbDogXCJHaXRIdWIgc291cmNlIGluc3RhbGxlclwiLCBkZXRhaWw6IHNvdXJjZVJvb3QgfTtcbiAgfVxuICBpZiAoZXhpc3RzU3luYyhqb2luKHNvdXJjZVJvb3QsIFwicGFja2FnZS5qc29uXCIpKSkge1xuICAgIHJldHVybiB7IGtpbmQ6IFwic291cmNlLWFyY2hpdmVcIiwgbGFiZWw6IFwiU291cmNlIGFyY2hpdmVcIiwgZGV0YWlsOiBzb3VyY2VSb290IH07XG4gIH1cbiAgcmV0dXJuIHsga2luZDogXCJ1bmtub3duXCIsIGxhYmVsOiBcIlVua25vd25cIiwgZGV0YWlsOiBzb3VyY2VSb290IH07XG59XG5cbmZ1bmN0aW9uIHN0YXJ0SW5zdGFsbGVkQ2xpKGNsaTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIiAmJiBzdGFydEluc3RhbGxlZENsaVdpdGhMYXVuY2hkKGNsaSwgYXJncykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY2hpbGQgPSBzcGF3bihwcm9jZXNzLmV4ZWNQYXRoLCBbY2xpLCAuLi5hcmdzXSwge1xuICAgIGN3ZDogcmVzb2x2ZShkaXJuYW1lKGNsaSksIFwiLi5cIiwgXCIuLlwiLCBcIi4uXCIpLFxuICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgQ09ERVhfUExVU1BMVVNfTUFOVUFMX1VQREFURTogXCIxXCIgfSxcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICBzdGRpbzogXCJpZ25vcmVcIixcbiAgfSk7XG4gIGNoaWxkLnVucmVmKCk7XG59XG5cbmZ1bmN0aW9uIHN0YXJ0SW5zdGFsbGVkQ2xpV2l0aExhdW5jaGQoY2xpOiBzdHJpbmcsIGFyZ3M6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IGxhYmVsID0gYGNvbS5jb2RleHBsdXNwbHVzLnBhdGNoLWhlbHBlci4ke3Byb2Nlc3MucGlkfS4ke0RhdGUubm93KCl9YDtcbiAgY29uc3QgY2xlYW51cCA9IGBsYXVuY2hjdGwgcmVtb3ZlICR7bGFiZWx9ID4vZGV2L251bGwgMj4mMSB8fCBsYXVuY2hjdGwgYm9vdG91dCBndWkvJChpZCAtdSkvJHtsYWJlbH0gPi9kZXYvbnVsbCAyPiYxIHx8IHRydWVgO1xuICBjb25zdCBjb21tYW5kID0gW1xuICAgIGB0cmFwICR7c2hlbGxRdW90ZShjbGVhbnVwKX0gRVhJVGAsXG4gICAgYGNkICR7c2hlbGxRdW90ZShyZXNvbHZlKGRpcm5hbWUoY2xpKSwgXCIuLlwiLCBcIi4uXCIsIFwiLi5cIikpfWAsXG4gICAgYENPREVYX1BMVVNQTFVTX01BTlVBTF9VUERBVEU9MSAke1twcm9jZXNzLmV4ZWNQYXRoLCBjbGksIC4uLmFyZ3NdLm1hcChzaGVsbFF1b3RlKS5qb2luKFwiIFwiKX1gLFxuICBdLmpvaW4oXCIgJiYgXCIpO1xuICBjb25zdCByZXN1bHQgPSBzcGF3blN5bmMoXG4gICAgXCJsYXVuY2hjdGxcIixcbiAgICBbXG4gICAgICBcInN1Ym1pdFwiLFxuICAgICAgXCItbFwiLFxuICAgICAgbGFiZWwsXG4gICAgICBcIi0tXCIsXG4gICAgICBcIi9iaW4vc2hcIixcbiAgICAgIFwiLWNcIixcbiAgICAgIGAke2NvbW1hbmR9IHx8IHRydWVgLFxuICAgIF0sXG4gICAge1xuICAgICAgZW5jb2Rpbmc6IFwidXRmOFwiLFxuICAgICAgc3RkaW86IFwiaWdub3JlXCIsXG4gICAgfSxcbiAgKTtcbiAgaWYgKHJlc3VsdC5zdGF0dXMgPT09IDApIHJldHVybiB0cnVlO1xuICBsb2coXCJ3YXJuXCIsIGBsYXVuY2hjdGwgc3VibWl0IGZhaWxlZCBmb3IgQ29kZXgrKyBwYXRjaCBoZWxwZXI6ICR7cmVzdWx0LmVycm9yPy5tZXNzYWdlID8/IHJlc3VsdC5zdGF0dXN9YCk7XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gc2hlbGxRdW90ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAnJHt2YWx1ZS5yZXBsYWNlKC8nL2csIGAnXFxcXCcnYCl9J2A7XG59XG5cbmZ1bmN0aW9uIG1hcmtTZWxmVXBkYXRlU3RhcnRlZChzb3VyY2VSb290OiBzdHJpbmcpOiBTZWxmVXBkYXRlU3RhdGUge1xuICBjb25zdCBjb25maWcgPSByZWFkU3RhdGUoKS5jb2RleFBsdXNQbHVzO1xuICBjb25zdCBjaGFubmVsID0gY29uZmlnPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCI7XG4gIGNvbnN0IHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUgPSB7XG4gICAgY2hlY2tlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgc3RhdHVzOiBcImNoZWNraW5nXCIsXG4gICAgY3VycmVudFZlcnNpb246IENPREVYX1BMVVNQTFVTX1ZFUlNJT04sXG4gICAgbGF0ZXN0VmVyc2lvbjogbnVsbCxcbiAgICB0YXJnZXRSZWY6IGNvbmZpZz8udXBkYXRlQ2hhbm5lbCA9PT0gXCJjdXN0b21cIiA/IGNvbmZpZy51cGRhdGVSZWYgPz8gbnVsbCA6IG51bGwsXG4gICAgcmVsZWFzZVVybDogbnVsbCxcbiAgICByZXBvOiBjb25maWc/LnVwZGF0ZVJlcG8gPz8gQ09ERVhfUExVU1BMVVNfUkVQTyxcbiAgICBjaGFubmVsLFxuICAgIHNvdXJjZVJvb3QsXG4gICAgaW5zdGFsbGF0aW9uU291cmNlOiBkZXNjcmliZUluc3RhbGxhdGlvblNvdXJjZShzb3VyY2VSb290KSxcbiAgfTtcbiAgd3JpdGVTZWxmVXBkYXRlU3RhdGUoc3RhdGUpO1xuICByZXR1cm4gc3RhdGU7XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdFJlbG9hZCgpOiB2b2lkIHtcbiAgY29uc3QgcGF5bG9hZCA9IHtcbiAgICBhdDogRGF0ZS5ub3coKSxcbiAgICB0d2Vha3M6IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+IHQubWFuaWZlc3QuaWQpLFxuICB9O1xuICBmb3IgKGNvbnN0IHdjIG9mIHdlYkNvbnRlbnRzLmdldEFsbFdlYkNvbnRlbnRzKCkpIHtcbiAgICB0cnkge1xuICAgICAgd2Muc2VuZChcImNvZGV4cHA6dHdlYWtzLWNoYW5nZWRcIiwgcGF5bG9hZCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBcImJyb2FkY2FzdCBzZW5kIGZhaWxlZDpcIiwgZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VMb2dnZXIoc2NvcGU6IHN0cmluZykge1xuICByZXR1cm4ge1xuICAgIGRlYnVnOiAoLi4uYTogdW5rbm93bltdKSA9PiBsb2coXCJpbmZvXCIsIGBbJHtzY29wZX1dYCwgLi4uYSksXG4gICAgaW5mbzogKC4uLmE6IHVua25vd25bXSkgPT4gbG9nKFwiaW5mb1wiLCBgWyR7c2NvcGV9XWAsIC4uLmEpLFxuICAgIHdhcm46ICguLi5hOiB1bmtub3duW10pID0+IGxvZyhcIndhcm5cIiwgYFske3Njb3BlfV1gLCAuLi5hKSxcbiAgICBlcnJvcjogKC4uLmE6IHVua25vd25bXSkgPT4gbG9nKFwiZXJyb3JcIiwgYFske3Njb3BlfV1gLCAuLi5hKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZU1haW5CcmlkZ2UoKSB7XG4gIHJldHVybiB7XG4gICAgYWRkTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXI6ICh0cmFuc2Zvcm1lcjogTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIpID0+IHtcbiAgICAgIG1haW5NZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMuYWRkKHRyYW5zZm9ybWVyKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVucmVnaXN0ZXI6ICgpID0+IHtcbiAgICAgICAgICBtYWluTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzLmRlbGV0ZSh0cmFuc2Zvcm1lcik7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gICAgYWRkTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcjogKGxpc3RlbmVyOiBNZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVyKSA9PiB7XG4gICAgICBtYWluTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVucmVnaXN0ZXI6ICgpID0+IHtcbiAgICAgICAgICBtYWluTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcnMuZGVsZXRlKGxpc3RlbmVyKTtcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybUhvb2soKTogdm9pZCB7XG4gIGNvbnN0IGN1cnJlbnQgPSBpcGNNYWluLmhhbmRsZSBhcyB0eXBlb2YgaXBjTWFpbi5oYW5kbGUgJiB7IF9fY29kZXhwcE1lc3NhZ2VUcmFuc2Zvcm1QYXRjaGVkPzogYm9vbGVhbiB9O1xuICBpZiAoY3VycmVudC5fX2NvZGV4cHBNZXNzYWdlVHJhbnNmb3JtUGF0Y2hlZCkgcmV0dXJuO1xuICBjb25zdCBvcmlnaW5hbEhhbmRsZSA9IGlwY01haW4uaGFuZGxlLmJpbmQoaXBjTWFpbik7XG4gIGNvbnN0IHBhdGNoZWRIYW5kbGUgPSAoKGNoYW5uZWw6IHN0cmluZywgbGlzdGVuZXI6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY01haW4uaGFuZGxlPlsxXSkgPT4ge1xuICAgIGlmIChjaGFubmVsICE9PSBERVNLVE9QX01FU1NBR0VfRlJPTV9WSUVXKSByZXR1cm4gb3JpZ2luYWxIYW5kbGUoY2hhbm5lbCwgbGlzdGVuZXIpO1xuICAgIHJldHVybiBvcmlnaW5hbEhhbmRsZShjaGFubmVsLCBhc3luYyAoZXZlbnQsIG1lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSB7XG4gICAgICAgIHNlbmRlcklkOiBldmVudC5zZW5kZXI/LmlkLFxuICAgICAgICBzZW5kZXJVcmw6IGV2ZW50LnNlbmRlckZyYW1lPy51cmwgfHwgZXZlbnQuc2VuZGVyPy5nZXRVUkw/LigpLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWVkID0gdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2UsIGNvbnRleHQpO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBsaXN0ZW5lcihldmVudCwgdHJhbnNmb3JtZWQpO1xuICAgICAgbm90aWZ5TWVzc2FnZUZyb21WaWV3UmVzcG9uc2UodHJhbnNmb3JtZWQsIHJlc3BvbnNlLCBjb250ZXh0KTtcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9KTtcbiAgfSkgYXMgdHlwZW9mIGlwY01haW4uaGFuZGxlICYgeyBfX2NvZGV4cHBNZXNzYWdlVHJhbnNmb3JtUGF0Y2hlZD86IGJvb2xlYW4gfTtcbiAgcGF0Y2hlZEhhbmRsZS5fX2NvZGV4cHBNZXNzYWdlVHJhbnNmb3JtUGF0Y2hlZCA9IHRydWU7XG4gIGlwY01haW4uaGFuZGxlID0gcGF0Y2hlZEhhbmRsZTtcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtTWVzc2FnZUZyb21WaWV3KG1lc3NhZ2U6IHVua25vd24sIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQpOiB1bmtub3duIHtcbiAgbGV0IGN1cnJlbnQgPSBtZXNzYWdlO1xuICBmb3IgKGNvbnN0IHRyYW5zZm9ybWVyIG9mIEFycmF5LmZyb20obWFpbk1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycykpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbmV4dCA9IHRyYW5zZm9ybWVyKGN1cnJlbnQsIGNvbnRleHQpO1xuICAgICAgaWYgKG5leHQgIT09IHVuZGVmaW5lZCkgY3VycmVudCA9IG5leHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJtZXNzYWdlLWZyb20tdmlldyB0cmFuc2Zvcm1lciBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnQ7XG59XG5cbmZ1bmN0aW9uIG5vdGlmeU1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlKFxuICBtZXNzYWdlOiB1bmtub3duLFxuICByZXNwb25zZTogdW5rbm93bixcbiAgY29udGV4dDogTWVzc2FnZUZyb21WaWV3Q29udGV4dCxcbik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIEFycmF5LmZyb20obWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzKSkge1xuICAgIHRyeSB7XG4gICAgICBsaXN0ZW5lcihtZXNzYWdlLCByZXNwb25zZSwgY29udGV4dCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJtZXNzYWdlLWZyb20tdmlldyByZXNwb25zZSBsaXN0ZW5lciBmYWlsZWQ6XCIsIGVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZU1haW5JcGMoaWQ6IHN0cmluZykge1xuICBjb25zdCBjaCA9IChjOiBzdHJpbmcpID0+IGBjb2RleHBwOiR7aWR9OiR7Y31gO1xuICByZXR1cm4ge1xuICAgIG9uOiAoYzogc3RyaW5nLCBoOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICBjb25zdCB3cmFwcGVkID0gKF9lOiB1bmtub3duLCAuLi5hcmdzOiB1bmtub3duW10pID0+IGgoLi4uYXJncyk7XG4gICAgICBpcGNNYWluLm9uKGNoKGMpLCB3cmFwcGVkKTtcbiAgICAgIHJldHVybiAoKSA9PiBpcGNNYWluLnJlbW92ZUxpc3RlbmVyKGNoKGMpLCB3cmFwcGVkIGFzIG5ldmVyKTtcbiAgICB9LFxuICAgIHNlbmQ6IChfYzogc3RyaW5nKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpcGMuc2VuZCBpcyByZW5kZXJlclx1MjE5Mm1haW47IG1haW4gc2lkZSB1c2VzIGhhbmRsZS9vblwiKTtcbiAgICB9LFxuICAgIGludm9rZTogKF9jOiBzdHJpbmcpID0+IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImlwYy5pbnZva2UgaXMgcmVuZGVyZXJcdTIxOTJtYWluOyBtYWluIHNpZGUgdXNlcyBoYW5kbGVcIik7XG4gICAgfSxcbiAgICBoYW5kbGU6IChjOiBzdHJpbmcsIGhhbmRsZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHVua25vd24pID0+IHtcbiAgICAgIGlwY01haW4uaGFuZGxlKGNoKGMpLCAoX2U6IHVua25vd24sIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gaGFuZGxlciguLi5hcmdzKSk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZU1haW5GcyhpZDogc3RyaW5nKSB7XG4gIGNvbnN0IGRpciA9IGpvaW4odXNlclJvb3QhLCBcInR3ZWFrLWRhdGFcIiwgaWQpO1xuICBta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgZnMgPSByZXF1aXJlKFwibm9kZTpmcy9wcm9taXNlc1wiKSBhcyB0eXBlb2YgaW1wb3J0KFwibm9kZTpmcy9wcm9taXNlc1wiKTtcbiAgcmV0dXJuIHtcbiAgICBkYXRhRGlyOiBkaXIsXG4gICAgcmVhZDogKHA6IHN0cmluZykgPT4gZnMucmVhZEZpbGUoam9pbihkaXIsIHApLCBcInV0ZjhcIiksXG4gICAgd3JpdGU6IChwOiBzdHJpbmcsIGM6IHN0cmluZykgPT4gZnMud3JpdGVGaWxlKGpvaW4oZGlyLCBwKSwgYywgXCJ1dGY4XCIpLFxuICAgIGV4aXN0czogYXN5bmMgKHA6IHN0cmluZykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgZnMuYWNjZXNzKGpvaW4oZGlyLCBwKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYWtlTW9kZWxBcGkodHdlYWtJZDogc3RyaW5nKSB7XG4gIHJldHVybiB7XG4gICAgZ2VuZXJhdGVUZXh0OiAob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMpID0+IHtcbiAgICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibW9kZWxcIik7XG4gICAgICByZXR1cm4gZ2VuZXJhdGVNb2RlbFRleHQodHdlYWtJZCwgb3B0aW9ucyk7XG4gICAgfSxcbiAgICBnZW5lcmF0ZU9iamVjdDogPFQgPSB1bmtub3duPihvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVPYmplY3RPcHRpb25zKSA9PiB7XG4gICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm1vZGVsXCIpO1xuICAgICAgcmV0dXJuIGdlbmVyYXRlTW9kZWxPYmplY3Q8VD4odHdlYWtJZCwgb3B0aW9ucyk7XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY2xlYW5Nb2RlbFJlYXNvbmluZ0VmZm9ydCh2YWx1ZTogdW5rbm93bik6IENvZGV4TW9kZWxSZWFzb25pbmdFZmZvcnQgfCBudWxsIHtcbiAgcmV0dXJuIHZhbHVlID09PSBcIm1pbmltYWxcIiB8fFxuICAgIHZhbHVlID09PSBcImxvd1wiIHx8XG4gICAgdmFsdWUgPT09IFwibWVkaXVtXCIgfHxcbiAgICB2YWx1ZSA9PT0gXCJoaWdoXCIgfHxcbiAgICB2YWx1ZSA9PT0gXCJ4aGlnaFwiXG4gICAgPyB2YWx1ZVxuICAgIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gY2xlYW5Nb2RlbFN0cmluZyh2YWx1ZTogdW5rbm93biwgbWF4TGVuZ3RoOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gdmFsdWUuc2xpY2UoMCwgbWF4TGVuZ3RoKSA6IFwiXCI7XG59XG5cbmZ1bmN0aW9uIG1vZGVsUHJvbXB0KG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zKTogc3RyaW5nIHtcbiAgY29uc3Qgc3lzdGVtID0gY2xlYW5Nb2RlbFN0cmluZyhvcHRpb25zLnN5c3RlbSwgODAwMCkudHJpbSgpO1xuICBjb25zdCBwcm9tcHQgPSBjbGVhbk1vZGVsU3RyaW5nKG9wdGlvbnMucHJvbXB0LCAxMjAwMDApLnRyaW0oKTtcbiAgaWYgKCFwcm9tcHQpIHRocm93IG5ldyBFcnJvcihcIm1vZGVsIHByb21wdCBpcyByZXF1aXJlZFwiKTtcbiAgcmV0dXJuIHN5c3RlbSA/IGAke3N5c3RlbX1cXG5cXG4ke3Byb21wdH1gIDogcHJvbXB0O1xufVxuXG5mdW5jdGlvbiBtb2RlbFdvcmtpbmdEaXJlY3RvcnkodHdlYWtJZDogc3RyaW5nLCBjd2Q6IHVua25vd24pOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIGN3ZCA9PT0gXCJzdHJpbmdcIiAmJiBjd2QgJiYgaXNBYnNvbHV0ZShjd2QpICYmIGV4aXN0c1N5bmMoY3dkKSkgcmV0dXJuIGN3ZDtcbiAgcmV0dXJuIGpvaW4odXNlclJvb3QhLCBcInR3ZWFrLWRhdGFcIiwgdHdlYWtJZCk7XG59XG5cbmZ1bmN0aW9uIGNvZGV4Q2xpRW52KCk6IE5vZGVKUy5Qcm9jZXNzRW52IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5wcm9jZXNzLmVudixcbiAgICBIT01FOiBwcm9jZXNzLmVudi5IT01FIHx8IGhvbWVkaXIoKSxcbiAgICBDT0RFWF9JTlRFUk5BTF9PUklHSU5BVE9SX09WRVJSSURFOiBwcm9jZXNzLmVudi5DT0RFWF9JTlRFUk5BTF9PUklHSU5BVE9SX09WRVJSSURFIHx8IFwiQ29kZXgrK1wiLFxuICAgIFBBVEg6IFtcbiAgICAgIHByb2Nlc3MuZW52LlBBVEggfHwgXCJcIixcbiAgICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICAgIFwiL3Vzci9iaW5cIixcbiAgICAgIFwiL2JpblwiLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLmpvaW4oXCI6XCIpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb2RleENsaUNvbW1hbmQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIHByb2Nlc3MuZW52LkNPREVYX1BMVVNQTFVTX0NPREVYX0NMSSB8fCBwcm9jZXNzLmVudi5DT0RFWF9DTEkgfHwgXCJjb2RleFwiO1xufVxuXG5mdW5jdGlvbiBtb2RlbFRpbWVvdXRNcyh2YWx1ZTogdW5rbm93bik6IG51bWJlciB7XG4gIGNvbnN0IHRpbWVvdXRNcyA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpID8gdmFsdWUgOiA0NV8wMDA7XG4gIHJldHVybiBNYXRoLm1heCg1XzAwMCwgTWF0aC5taW4oMTgwXzAwMCwgTWF0aC5mbG9vcih0aW1lb3V0TXMpKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJ1bkNvZGV4TW9kZWwoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgb3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIHNjaGVtYT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuKTogUHJvbWlzZTxDb2RleE1vZGVsVGV4dFJlc3VsdD4ge1xuICBjb25zdCBwcm9tcHQgPSBtb2RlbFByb21wdChvcHRpb25zKTtcbiAgY29uc3QgbW9kZWwgPSBjbGVhbk1vZGVsU3RyaW5nKG9wdGlvbnMubW9kZWwsIDEyMCkudHJpbSgpO1xuICBjb25zdCByZWFzb25pbmdFZmZvcnQgPSBjbGVhbk1vZGVsUmVhc29uaW5nRWZmb3J0KG9wdGlvbnMucmVhc29uaW5nRWZmb3J0KTtcbiAgY29uc3QgY3dkID0gbW9kZWxXb3JraW5nRGlyZWN0b3J5KHR3ZWFrSWQsIG9wdGlvbnMuY3dkKTtcbiAgY29uc3QgdGVtcERpciA9IG1rZHRlbXBTeW5jKGpvaW4odG1wZGlyKCksIFwiY29kZXhwcC1tb2RlbC1cIikpO1xuICBjb25zdCBwcm9tcHRQYXRoID0gam9pbih0ZW1wRGlyLCBcInByb21wdC50eHRcIik7XG4gIGNvbnN0IG91dHB1dFBhdGggPSBqb2luKHRlbXBEaXIsIFwib3V0cHV0LnR4dFwiKTtcbiAgY29uc3Qgc2NoZW1hUGF0aCA9IGpvaW4odGVtcERpciwgXCJzY2hlbWEuanNvblwiKTtcblxuICB0cnkge1xuICAgIHdyaXRlRmlsZVN5bmMocHJvbXB0UGF0aCwgcHJvbXB0LCBcInV0ZjhcIik7XG4gICAgY29uc3QgYXJncyA9IFtcbiAgICAgIFwiZXhlY1wiLFxuICAgICAgXCItLWVwaGVtZXJhbFwiLFxuICAgICAgXCItLXNraXAtZ2l0LXJlcG8tY2hlY2tcIixcbiAgICAgIFwiLS1pZ25vcmUtcnVsZXNcIixcbiAgICAgIFwiLS1hc2stZm9yLWFwcHJvdmFsXCIsXG4gICAgICBcIm5ldmVyXCIsXG4gICAgICBcIi0tc2FuZGJveFwiLFxuICAgICAgXCJyZWFkLW9ubHlcIixcbiAgICAgIFwiLS1vdXRwdXQtbGFzdC1tZXNzYWdlXCIsXG4gICAgICBvdXRwdXRQYXRoLFxuICAgICAgXCItQ1wiLFxuICAgICAgY3dkLFxuICAgIF07XG5cbiAgICBpZiAobW9kZWwpIGFyZ3MucHVzaChcIi0tbW9kZWxcIiwgbW9kZWwpO1xuICAgIGlmIChyZWFzb25pbmdFZmZvcnQpIGFyZ3MucHVzaChcIi1jXCIsIGBtb2RlbF9yZWFzb25pbmdfZWZmb3J0PVwiJHtyZWFzb25pbmdFZmZvcnR9XCJgKTtcbiAgICBpZiAoc2NoZW1hKSB7XG4gICAgICB3cml0ZUZpbGVTeW5jKHNjaGVtYVBhdGgsIEpTT04uc3RyaW5naWZ5KHNjaGVtYSwgbnVsbCwgMiksIFwidXRmOFwiKTtcbiAgICAgIGFyZ3MucHVzaChcIi0tb3V0cHV0LXNjaGVtYVwiLCBzY2hlbWFQYXRoKTtcbiAgICB9XG4gICAgYXJncy5wdXNoKFwiLVwiKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHNwYXduV2l0aElucHV0KGNvZGV4Q2xpQ29tbWFuZCgpLCBhcmdzLCBwcm9tcHQsIHtcbiAgICAgIGN3ZCxcbiAgICAgIGVudjogY29kZXhDbGlFbnYoKSxcbiAgICAgIHRpbWVvdXRNczogbW9kZWxUaW1lb3V0TXMob3B0aW9ucy50aW1lb3V0TXMpLFxuICAgIH0pO1xuICAgIGlmIChyZXN1bHQuc3RhdHVzICE9PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYGNvZGV4IGV4ZWMgZmFpbGVkICgke3Jlc3VsdC5zdGF0dXMgPz8gXCJzaWduYWxcIn0pOiAke3Jlc3VsdC5zdGRlcnIuc2xpY2UoLTIwMDApfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHRleHQgPSByZWFkRmlsZVN5bmMob3V0cHV0UGF0aCwgXCJ1dGY4XCIpLnRyaW0oKTtcbiAgICBpZiAoIXRleHQpIHRocm93IG5ldyBFcnJvcihcImNvZGV4IGV4ZWMgcmV0dXJuZWQgYW4gZW1wdHkgZmluYWwgbWVzc2FnZVwiKTtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dCxcbiAgICAgIG1vZGVsOiBtb2RlbCB8fCBudWxsLFxuICAgICAgcmVhc29uaW5nRWZmb3J0LFxuICAgIH07XG4gIH0gZmluYWxseSB7XG4gICAgcm1TeW5jKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzcGF3bldpdGhJbnB1dChcbiAgY29tbWFuZDogc3RyaW5nLFxuICBhcmdzOiBzdHJpbmdbXSxcbiAgaW5wdXQ6IHN0cmluZyxcbiAgb3B0aW9uczogeyBjd2Q6IHN0cmluZzsgZW52OiBOb2RlSlMuUHJvY2Vzc0VudjsgdGltZW91dE1zOiBudW1iZXIgfSxcbik6IFByb21pc2U8eyBzdGF0dXM6IG51bWJlciB8IG51bGw7IHNpZ25hbDogTm9kZUpTLlNpZ25hbHMgfCBudWxsOyBzdGRvdXQ6IHN0cmluZzsgc3RkZXJyOiBzdHJpbmcgfT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmVQcm9taXNlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBjaGlsZCA9IHNwYXduKGNvbW1hbmQsIGFyZ3MsIHtcbiAgICAgIGN3ZDogb3B0aW9ucy5jd2QsXG4gICAgICBlbnY6IG9wdGlvbnMuZW52LFxuICAgICAgc3RkaW86IFtcInBpcGVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgICB9KTtcbiAgICBsZXQgc3Rkb3V0ID0gXCJcIjtcbiAgICBsZXQgc3RkZXJyID0gXCJcIjtcbiAgICBsZXQgc2V0dGxlZCA9IGZhbHNlO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkgcmV0dXJuO1xuICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICBjaGlsZC5raWxsKFwiU0lHVEVSTVwiKTtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYGNvZGV4IG1vZGVsIGdlbmVyYXRpb24gdGltZWQgb3V0IGFmdGVyICR7b3B0aW9ucy50aW1lb3V0TXN9bXNgKSk7XG4gICAgfSwgb3B0aW9ucy50aW1lb3V0TXMpO1xuXG4gICAgY2hpbGQuc3Rkb3V0Py5zZXRFbmNvZGluZyhcInV0ZjhcIik7XG4gICAgY2hpbGQuc3RkZXJyPy5zZXRFbmNvZGluZyhcInV0ZjhcIik7XG4gICAgY2hpbGQuc3Rkb3V0Py5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XG4gICAgICBzdGRvdXQgKz0gU3RyaW5nKGNodW5rKTtcbiAgICAgIGlmIChzdGRvdXQubGVuZ3RoID4gMTI4XzAwMCkgc3Rkb3V0ID0gc3Rkb3V0LnNsaWNlKC0xMjhfMDAwKTtcbiAgICB9KTtcbiAgICBjaGlsZC5zdGRlcnI/Lm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHtcbiAgICAgIHN0ZGVyciArPSBTdHJpbmcoY2h1bmspO1xuICAgICAgaWYgKHN0ZGVyci5sZW5ndGggPiAxMjhfMDAwKSBzdGRlcnIgPSBzdGRlcnIuc2xpY2UoLTEyOF8wMDApO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgICBpZiAoc2V0dGxlZCkgcmV0dXJuO1xuICAgICAgc2V0dGxlZCA9IHRydWU7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbihcImNsb3NlXCIsIChzdGF0dXMsIHNpZ25hbCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHJldHVybjtcbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHJlc29sdmVQcm9taXNlKHsgc3RhdHVzLCBzaWduYWwsIHN0ZG91dCwgc3RkZXJyIH0pO1xuICAgIH0pO1xuICAgIGNoaWxkLnN0ZGluPy5lbmQoaW5wdXQpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVNb2RlbFRleHQoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgb3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4pOiBQcm9taXNlPENvZGV4TW9kZWxUZXh0UmVzdWx0PiB7XG4gIHJldHVybiBydW5Db2RleE1vZGVsKHR3ZWFrSWQsIG9wdGlvbnMpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZW5lcmF0ZU1vZGVsT2JqZWN0PFQgPSB1bmtub3duPihcbiAgdHdlYWtJZDogc3RyaW5nLFxuICBvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVPYmplY3RPcHRpb25zLFxuKTogUHJvbWlzZTxDb2RleE1vZGVsT2JqZWN0UmVzdWx0PFQ+PiB7XG4gIGlmICghb3B0aW9ucyB8fCB0eXBlb2Ygb3B0aW9ucyAhPT0gXCJvYmplY3RcIiB8fCAhb3B0aW9ucy5zY2hlbWEgfHwgdHlwZW9mIG9wdGlvbnMuc2NoZW1hICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibW9kZWwgb2JqZWN0IGdlbmVyYXRpb24gcmVxdWlyZXMgYSBKU09OIHNjaGVtYVwiKTtcbiAgfVxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBydW5Db2RleE1vZGVsKHR3ZWFrSWQsIG9wdGlvbnMsIG9wdGlvbnMuc2NoZW1hKTtcbiAgbGV0IG9iamVjdDogVDtcbiAgdHJ5IHtcbiAgICBvYmplY3QgPSBKU09OLnBhcnNlKHJlc3VsdC50ZXh0KSBhcyBUO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgbW9kZWwgb2JqZWN0IGdlbmVyYXRpb24gcmV0dXJuZWQgaW52YWxpZCBKU09OOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gKTtcbiAgfVxuICByZXR1cm4geyAuLi5yZXN1bHQsIG9iamVjdCB9O1xufVxuXG5mdW5jdGlvbiBjdXJyZW50UnVudGltZUluZm8oKTogQ29kZXhSdW50aW1lSW5mbyB7XG4gIGNvbnN0IGluc3RhbGxlclN0YXRlID0gcmVhZEluc3RhbGxlclN0YXRlKCk7XG4gIHJldHVybiBnZXRSdW50aW1lSW5mbyh7XG4gICAgdXNlclJvb3Q6IHVzZXJSb290ISxcbiAgICBydW50aW1lRGlyOiBydW50aW1lRGlyISxcbiAgICBjb2RleFZlcnNpb246IGluc3RhbGxlclN0YXRlPy5jb2RleFZlcnNpb24gPz8gbnVsbCxcbiAgICBjaGFubmVsOiBudWxsLFxuICAgIGdldFdpbmRvd1NlcnZpY2VzOiBnZXRDb2RleFdpbmRvd1NlcnZpY2VzLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY3VycmVudFJ1bnRpbWVDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzIHtcbiAgY29uc3QgaW5zdGFsbGVyU3RhdGUgPSByZWFkSW5zdGFsbGVyU3RhdGUoKTtcbiAgcmV0dXJuIGdldFJ1bnRpbWVDYXBhYmlsaXRpZXMoe1xuICAgIHVzZXJSb290OiB1c2VyUm9vdCEsXG4gICAgcnVudGltZURpcjogcnVudGltZURpciEsXG4gICAgY29kZXhWZXJzaW9uOiBpbnN0YWxsZXJTdGF0ZT8uY29kZXhWZXJzaW9uID8/IG51bGwsXG4gICAgY2hhbm5lbDogbnVsbCxcbiAgICBnZXRXaW5kb3dTZXJ2aWNlczogZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcyxcbiAgICBnZXROYXRpdmVDYXBhYmlsaXRpZXM6ICgpID0+IG5hdGl2ZUJyaWRnZS5nZXRDYXBhYmlsaXRpZXMoKSxcbiAgICBnZXRWaWV3Q2FwYWJpbGl0aWVzOiAoKSA9PiBnZXRPd2xWaWV3Q2FwYWJpbGl0aWVzKCksXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0d2Vha0NvbnRleHQodHdlYWtJZDogc3RyaW5nLCBwZXJtaXNzaW9uPzogVHdlYWtQZXJtaXNzaW9uKTogTmF0aXZlVHdlYWtDb250ZXh0IHtcbiAgY29uc3QgdHdlYWsgPSBwZXJtaXNzaW9uXG4gICAgPyBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBwZXJtaXNzaW9uKVxuICAgIDogdHdlYWtCeUlkKHR3ZWFrSWQpO1xuICByZXR1cm4geyBpZDogdHdlYWsubWFuaWZlc3QuaWQsIGRpcjogdHdlYWsuZGlyIH07XG59XG5cbmZ1bmN0aW9uIHR3ZWFrQnlJZCh0d2Vha0lkOiBzdHJpbmcpOiBEaXNjb3ZlcmVkVHdlYWsge1xuICBhc3NlcnRUd2Vha0lkKHR3ZWFrSWQpO1xuICBjb25zdCB0d2VhayA9IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5maW5kKChpdGVtKSA9PiBpdGVtLm1hbmlmZXN0LmlkID09PSB0d2Vha0lkKTtcbiAgaWYgKCF0d2VhaykgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIHR3ZWFrOiAke3R3ZWFrSWR9YCk7XG4gIGlmICghaXNUd2Vha0VuYWJsZWQodHdlYWtJZCkpIHRocm93IG5ldyBFcnJvcihgdHdlYWsgaXMgZGlzYWJsZWQ6ICR7dHdlYWtJZH1gKTtcbiAgcmV0dXJuIHR3ZWFrO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkOiBzdHJpbmcsIHBlcm1pc3Npb246IFR3ZWFrUGVybWlzc2lvbik6IERpc2NvdmVyZWRUd2VhayB7XG4gIGNvbnN0IHR3ZWFrID0gdHdlYWtCeUlkKHR3ZWFrSWQpO1xuICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIHBlcm1pc3Npb24pO1xuICByZXR1cm4gdHdlYWs7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkOiBzdHJpbmcpOiBEaXNjb3ZlcmVkVHdlYWsge1xuICBjb25zdCB0d2VhayA9IHR3ZWFrQnlJZCh0d2Vha0lkKTtcbiAgYXNzZXJ0VHdlYWtWaWV3UGVybWlzc2lvbih0d2Vhayk7XG4gIHJldHVybiB0d2Vhaztcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtQZXJtaXNzaW9uKHR3ZWFrOiBEaXNjb3ZlcmVkVHdlYWssIHBlcm1pc3Npb246IFR3ZWFrUGVybWlzc2lvbik6IHZvaWQge1xuICBpZiAodHdlYWsubWFuaWZlc3QucGVybWlzc2lvbnM/LmluY2x1ZGVzKHBlcm1pc3Npb24pKSByZXR1cm47XG4gIHRocm93IG5ldyBFcnJvcihgdHdlYWsgJHt0d2Vhay5tYW5pZmVzdC5pZH0gbXVzdCBkZWNsYXJlICR7cGVybWlzc2lvbn0gcGVybWlzc2lvbmApO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRUd2Vha1ZpZXdQZXJtaXNzaW9uKHR3ZWFrOiBEaXNjb3ZlcmVkVHdlYWspOiB2b2lkIHtcbiAgaWYgKFxuICAgIHR3ZWFrLm1hbmlmZXN0LnBlcm1pc3Npb25zPy5pbmNsdWRlcyhcImNvZGV4LXZpZXdzXCIpIHx8XG4gICAgdHdlYWsubWFuaWZlc3QucGVybWlzc2lvbnM/LmluY2x1ZGVzKFwiY29kZXgudmlld3NcIilcbiAgKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihgdHdlYWsgJHt0d2Vhay5tYW5pZmVzdC5pZH0gbXVzdCBkZWNsYXJlIGNvZGV4LXZpZXdzIHBlcm1pc3Npb25gKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtJZCh0d2Vha0lkOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QodHdlYWtJZCkpIHRocm93IG5ldyBFcnJvcihcImJhZCB0d2VhayBpZFwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJpbWFyeUNvZGV4V2luZG93KCk6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHtcbiAgY29uc3Qgc2VydmljZXMgPSBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk7XG4gIGNvbnN0IGZyb21TZXJ2aWNlcyA9IHR5cGVvZiBzZXJ2aWNlcz8uZ2V0UHJpbWFyeVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBzZXJ2aWNlcy5nZXRQcmltYXJ5V2luZG93KFwibG9jYWxcIilcbiAgICA6IG51bGw7XG4gIGlmIChmcm9tU2VydmljZXMgJiYgIWZyb21TZXJ2aWNlcy5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gZnJvbVNlcnZpY2VzO1xuICBjb25zdCBmcm9tTWFuYWdlciA9IHR5cGVvZiBzZXJ2aWNlcz8ud2luZG93TWFuYWdlcj8uZ2V0UHJpbWFyeVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBzZXJ2aWNlcy53aW5kb3dNYW5hZ2VyLmdldFByaW1hcnlXaW5kb3cuY2FsbChzZXJ2aWNlcy53aW5kb3dNYW5hZ2VyKVxuICAgIDogbnVsbDtcbiAgaWYgKGZyb21NYW5hZ2VyICYmICFmcm9tTWFuYWdlci5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gZnJvbU1hbmFnZXI7XG4gIGNvbnN0IGZvY3VzZWQgPSBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgaWYgKGZvY3VzZWQgJiYgIWZvY3VzZWQuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZvY3VzZWQ7XG4gIHJldHVybiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5maW5kKCh3aW4pID0+ICF3aW4uaXNEZXN0cm95ZWQoKSkgPz8gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0UHJpbWFyeUNvZGV4V2luZG93UmVmKCk6IENvZGV4V2luZG93UmVmIHwgbnVsbCB7XG4gIGNvbnN0IHdpbiA9IGdldFByaW1hcnlDb2RleFdpbmRvdygpO1xuICBpZiAoIXdpbiB8fCB3aW4uaXNEZXN0cm95ZWQoKSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiB7IHdpbmRvd0lkOiB3aW4uaWQsIHdlYkNvbnRlbnRzSWQ6IHdpbi53ZWJDb250ZW50cy5pZCB9O1xufVxuXG5mdW5jdGlvbiBmb2N1c0NvZGV4V2luZG93KHdpbmRvd0lkOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3Qgd2luID0gQnJvd3NlcldpbmRvdy5mcm9tSWQod2luZG93SWQpO1xuICBpZiAoIXdpbiB8fCB3aW4uaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZhbHNlO1xuICBpZiAod2luLmlzTWluaW1pemVkKCkpIHdpbi5yZXN0b3JlKCk7XG4gIHdpbi5zaG93KCk7XG4gIHdpbi5mb2N1cygpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gc2hvd0NvZGV4V2luZG93KHdpbmRvd0lkOiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3Qgd2luID0gQnJvd3NlcldpbmRvdy5mcm9tSWQod2luZG93SWQpO1xuICBpZiAoIXdpbiB8fCB3aW4uaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZhbHNlO1xuICB3aW4uc2hvdygpO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0T3dsVmlld0NhcGFiaWxpdGllcygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJ2aWV3c1wiXSB7XG4gIGNvbnN0IHBhcmVudCA9IGdldFByaW1hcnlDb2RleFdpbmRvdygpID8/IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpO1xuICBjb25zdCBjb250ZW50VmlldyA9IGFzUmVjb3JkKHBhcmVudCk/LmNvbnRlbnRWaWV3O1xuICBsZXQgc2FtcGxlVmlldzogRWxlY3Ryb24uQnJvd3NlclZpZXcgfCBudWxsID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBzYW1wbGVWaWV3ID0gbmV3IEJyb3dzZXJWaWV3KHsgd2ViUHJlZmVyZW5jZXM6IHsgc2FuZGJveDogdHJ1ZSB9IH0pO1xuICB9IGNhdGNoIHt9XG4gIGNvbnN0IHdlYkNvbnRlbnRzVmlldyA9IGFzUmVjb3JkKHNhbXBsZVZpZXcpPy53ZWJDb250ZW50c1ZpZXc7XG4gIGNvbnN0IHByaXZhdGVWaWV3VHJlZSA9IHR5cGVvZiBhc1JlY29yZChjb250ZW50Vmlldyk/LmFkZENoaWxkVmlldyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgdHlwZW9mIGFzUmVjb3JkKGNvbnRlbnRWaWV3KT8ucmVtb3ZlQ2hpbGRWaWV3ID09PSBcImZ1bmN0aW9uXCI7XG4gIGNvbnN0IHdlYkNvbnRlbnRzVmlld0F2YWlsYWJsZSA9IEJvb2xlYW4od2ViQ29udGVudHNWaWV3KSAmJlxuICAgIHR5cGVvZiBhc1JlY29yZCh3ZWJDb250ZW50c1ZpZXcpPy5zZXRCb3VuZHMgPT09IFwiZnVuY3Rpb25cIjtcbiAgY29uc3QgcHJpdmF0ZUF0dGFjaCA9IHByaXZhdGVWaWV3VHJlZSAmJiB3ZWJDb250ZW50c1ZpZXdBdmFpbGFibGU7XG4gIGNvbnN0IGJyb3dzZXJWaWV3RmFsbGJhY2sgPSB0eXBlb2YgYXNSZWNvcmQocGFyZW50KT8uYWRkQnJvd3NlclZpZXcgPT09IFwiZnVuY3Rpb25cIjtcbiAgdHJ5IHtcbiAgICBpZiAoc2FtcGxlVmlldyAmJiAhc2FtcGxlVmlldy53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICBzYW1wbGVWaWV3LndlYkNvbnRlbnRzLmNsb3NlKHsgd2FpdEZvckJlZm9yZVVubG9hZDogZmFsc2UgfSk7XG4gICAgfVxuICB9IGNhdGNoIHt9XG4gIHJldHVybiB7XG4gICAgY3JlYXRlOiBwcml2YXRlQXR0YWNoIHx8IGJyb3dzZXJWaWV3RmFsbGJhY2ssXG4gICAgcHJpdmF0ZVZpZXdUcmVlOiBwcml2YXRlQXR0YWNoLFxuICAgIHdlYkNvbnRlbnRzVmlldzogd2ViQ29udGVudHNWaWV3QXZhaWxhYmxlLFxuICAgIGJyb3dzZXJWaWV3RmFsbGJhY2ssXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU93bFZpZXcoXG4gIGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LFxuICBvcHRzOiBDb2RleFZpZXdDcmVhdGVPcHRpb25zLFxuKTogUHJvbWlzZTxDb2RleFZpZXdSZWY+IHtcbiAgY29uc3QgaWQgPSBhc3NlcnRCcmlkZ2VJZChvcHRzLmlkID8/IHJhbmRvbVVVSUQoKSwgXCJDb2RleCB2aWV3IGlkXCIpO1xuICBjb25zdCBrZXkgPSBvd2xWaWV3S2V5KGN0eC5pZCwgaWQpO1xuICBpZiAob3dsVmlld3MuaGFzKGtleSkpIHRocm93IG5ldyBFcnJvcihgQ29kZXggdmlldyBhbHJlYWR5IGV4aXN0czogJHtjdHguaWR9OiR7aWR9YCk7XG5cbiAgY29uc3QgcGFyZW50ID0gdHlwZW9mIG9wdHMucGFyZW50V2luZG93SWQgPT09IFwibnVtYmVyXCJcbiAgICA/IEJyb3dzZXJXaW5kb3cuZnJvbUlkKG9wdHMucGFyZW50V2luZG93SWQpXG4gICAgOiBnZXRQcmltYXJ5Q29kZXhXaW5kb3coKTtcbiAgaWYgKCFwYXJlbnQgfHwgaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50KSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHZpZXcgbmVlZHMgYW4gYWN0aXZlIHBhcmVudCB3aW5kb3dcIik7XG4gIH1cblxuICBjb25zdCBzZXJ2aWNlcyA9IGdldENvZGV4V2luZG93U2VydmljZXMoKTtcbiAgY29uc3Qgd2luZG93TWFuYWdlciA9IHNlcnZpY2VzPy53aW5kb3dNYW5hZ2VyO1xuICBjb25zdCByb3V0ZSA9IG9wdHMucm91dGUgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBub3JtYWxpemVDb2RleFJvdXRlKG9wdHMucm91dGUpO1xuICBjb25zdCBob3N0SWQgPSBvcHRzLmhvc3RJZCB8fCBcImxvY2FsXCI7XG4gIGNvbnN0IHZpZXcgPSBuZXcgQnJvd3NlclZpZXcoe1xuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBwcmVsb2FkOiBvcHRzLnJlZ2lzdGVyV2l0aENvZGV4ID09PSBmYWxzZSA/IHVuZGVmaW5lZCA6IHdpbmRvd01hbmFnZXI/Lm9wdGlvbnM/LnByZWxvYWRQYXRoLFxuICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2UsXG4gICAgICBzcGVsbGNoZWNrOiBmYWxzZSxcbiAgICAgIGRldlRvb2xzOiB3aW5kb3dNYW5hZ2VyPy5vcHRpb25zPy5hbGxvd0RldnRvb2xzLFxuICAgIH0sXG4gIH0pO1xuXG4gIGlmIChvcHRzLmJhY2tncm91bmRDb2xvcikge1xuICAgIGNhbGxPYmplY3RNZXRob2QodmlldywgXCJzZXRCYWNrZ3JvdW5kQ29sb3JcIiwgW29wdHMuYmFja2dyb3VuZENvbG9yXSk7XG4gICAgY2FsbE9iamVjdE1ldGhvZChhc1JlY29yZCh2aWV3KT8ud2ViQ29udGVudHNWaWV3LCBcInNldEJhY2tncm91bmRDb2xvclwiLCBbb3B0cy5iYWNrZ3JvdW5kQ29sb3JdKTtcbiAgfVxuXG4gIGNvbnN0IG1hbmFnZWQ6IE1hbmFnZWRPd2xWaWV3ID0ge1xuICAgIGtleSxcbiAgICB0d2Vha0lkOiBjdHguaWQsXG4gICAgaWQsXG4gICAgdmlldyxcbiAgICBwYXJlbnRXaW5kb3dJZDogd2luZG93SWRGb3IocGFyZW50KSxcbiAgICBhdHRhY2hNb2RlOiBudWxsLFxuICAgIGRpc3Bvc2VCaW5kaW5nczogW10sXG4gICAgZGlzcG9zZWQ6IGZhbHNlLFxuICB9O1xuICBvd2xWaWV3cy5zZXQoa2V5LCBtYW5hZ2VkKTtcblxuICB0cnkge1xuICAgIGlmIChyb3V0ZSAhPT0gbnVsbCAmJiBvcHRzLnJlZ2lzdGVyV2l0aENvZGV4ICE9PSBmYWxzZSAmJiB3aW5kb3dNYW5hZ2VyPy5yZWdpc3RlcldpbmRvdykge1xuICAgICAgY29uc3QgYXBwZWFyYW5jZSA9IG9wdHMuYXBwZWFyYW5jZSB8fCBcInNlY29uZGFyeVwiO1xuICAgICAgY29uc3Qgd2luZG93TGlrZSA9IG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3KTtcbiAgICAgIHdpbmRvd01hbmFnZXIucmVnaXN0ZXJXaW5kb3cod2luZG93TGlrZSwgaG9zdElkLCBmYWxzZSwgYXBwZWFyYW5jZSk7XG4gICAgICBzZXJ2aWNlcz8uZ2V0Q29udGV4dD8uKGhvc3RJZCk/LnJlZ2lzdGVyV2luZG93Py4od2luZG93TGlrZSk7XG4gICAgfVxuXG4gICAgYXR0YWNoT3dsVmlldyhtYW5hZ2VkLCBwYXJlbnQpO1xuICAgIGlmIChvcHRzLmJvdW5kcykgc2V0T3dsVmlld0JvdW5kcyhtYW5hZ2VkLCBvcHRzLmJvdW5kcyk7XG4gICAgaWYgKG9wdHMudmlzaWJsZSA9PT0gZmFsc2UpIHNldE93bFZpZXdWaXNpYmxlKG1hbmFnZWQsIGZhbHNlKTtcblxuICAgIGlmIChyb3V0ZSAhPT0gbnVsbCkge1xuICAgICAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKGNvZGV4QXBwVXJsKHJvdXRlLCBob3N0SWQpKTtcbiAgICB9IGVsc2UgaWYgKG9wdHMudXJsKSB7XG4gICAgICBhd2FpdCB2aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwobm9ybWFsaXplT3dsVmlld1VybChvcHRzLnVybCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB2aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwoXCJhYm91dDpibGFua1wiKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBkaXNwb3NlT3dsVmlldyhtYW5hZ2VkKTtcbiAgICB0aHJvdyBlO1xuICB9XG5cbiAgbG9nKFwiaW5mb1wiLCBgY3JlYXRlZCBPd2wgdmlldyAke2N0eC5pZH06JHtpZH1gLCB7XG4gICAgcGFyZW50V2luZG93SWQ6IG1hbmFnZWQucGFyZW50V2luZG93SWQsXG4gICAgd2ViQ29udGVudHNJZDogdmlldy53ZWJDb250ZW50cy5pZCxcbiAgICBhdHRhY2hNb2RlOiBtYW5hZ2VkLmF0dGFjaE1vZGUsXG4gIH0pO1xuICByZXR1cm4gb3dsVmlld1JlZihtYW5hZ2VkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FsbE93bFZpZXcoXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgaWQ6IHN0cmluZyxcbiAgbWV0aG9kOiBzdHJpbmcsXG4gIGFyZz86IHVua25vd24sXG4gIGFyZzI/OiB1bmtub3duLFxuKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGNvbnN0IHZpZXcgPSBvd2xWaWV3Rm9yKHR3ZWFrSWQsIGlkKTtcbiAgaWYgKG1ldGhvZCA9PT0gXCJzZXRCb3VuZHNcIikgcmV0dXJuIHNldE93bFZpZXdCb3VuZHModmlldywgYXJnIGFzIEVsZWN0cm9uLlJlY3RhbmdsZSk7XG4gIGlmIChtZXRob2QgPT09IFwic2V0VmlzaWJsZVwiKSByZXR1cm4gc2V0T3dsVmlld1Zpc2libGUodmlldywgQm9vbGVhbihhcmcpKTtcbiAgaWYgKG1ldGhvZCA9PT0gXCJicmluZ1RvRnJvbnRcIikgcmV0dXJuIGJyaW5nT3dsVmlld1RvRnJvbnQodmlldyk7XG4gIGlmIChtZXRob2QgPT09IFwibG9hZFJvdXRlXCIpIHtcbiAgICBjb25zdCByb3V0ZSA9IG5vcm1hbGl6ZUNvZGV4Um91dGUoU3RyaW5nKGFyZykpO1xuICAgIGNvbnN0IGhvc3RJZCA9IHR5cGVvZiBhcmcyID09PSBcInN0cmluZ1wiICYmIGFyZzIgPyBhcmcyIDogXCJsb2NhbFwiO1xuICAgIHJldHVybiB2aWV3LnZpZXcud2ViQ29udGVudHMubG9hZFVSTChjb2RleEFwcFVybChyb3V0ZSwgaG9zdElkKSk7XG4gIH1cbiAgaWYgKG1ldGhvZCA9PT0gXCJsb2FkVXJsXCIpIHJldHVybiB2aWV3LnZpZXcud2ViQ29udGVudHMubG9hZFVSTChub3JtYWxpemVPd2xWaWV3VXJsKFN0cmluZyhhcmcpKSk7XG4gIGlmIChtZXRob2QgPT09IFwiZGlzcG9zZVwiKSByZXR1cm4gZGlzcG9zZU93bFZpZXdCeUlkKHR3ZWFrSWQsIGlkKTtcbiAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIENvZGV4IHZpZXcgbWV0aG9kOiAke21ldGhvZH1gKTtcbn1cblxuZnVuY3Rpb24gb3dsVmlld1JlZih2aWV3OiBNYW5hZ2VkT3dsVmlldyk6IENvZGV4Vmlld1JlZiB7XG4gIHJldHVybiB7XG4gICAgaWQ6IHZpZXcuaWQsXG4gICAgd2ViQ29udGVudHNJZDogdmlldy52aWV3LndlYkNvbnRlbnRzLmlkLFxuICAgIHBhcmVudFdpbmRvd0lkOiB2aWV3LnBhcmVudFdpbmRvd0lkLFxuICAgIHNldEJvdW5kczogKGJvdW5kcykgPT4gUHJvbWlzZS5yZXNvbHZlKHNldE93bFZpZXdCb3VuZHModmlldywgYm91bmRzKSksXG4gICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+IFByb21pc2UucmVzb2x2ZShzZXRPd2xWaWV3VmlzaWJsZSh2aWV3LCB2aXNpYmxlKSksXG4gICAgYnJpbmdUb0Zyb250OiAoKSA9PiBQcm9taXNlLnJlc29sdmUoYnJpbmdPd2xWaWV3VG9Gcm9udCh2aWV3KSksXG4gICAgbG9hZFJvdXRlOiAocm91dGUsIGhvc3RJZCkgPT4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwoY29kZXhBcHBVcmwobm9ybWFsaXplQ29kZXhSb3V0ZShyb3V0ZSksIGhvc3RJZCB8fCBcImxvY2FsXCIpKS50aGVuKCgpID0+IHt9KSxcbiAgICBsb2FkVXJsOiAodXJsKSA9PiB2aWV3LnZpZXcud2ViQ29udGVudHMubG9hZFVSTChub3JtYWxpemVPd2xWaWV3VXJsKHVybCkpLnRoZW4oKCkgPT4ge30pLFxuICAgIGRpc3Bvc2U6ICgpID0+IFByb21pc2UucmVzb2x2ZShkaXNwb3NlT3dsVmlld0J5SWQodmlldy50d2Vha0lkLCB2aWV3LmlkKSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGF0dGFjaE93bFZpZXcodmlldzogTWFuYWdlZE93bFZpZXcsIHBhcmVudDogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyk6IHZvaWQge1xuICBjb25zdCBjb250ZW50VmlldyA9IGFzUmVjb3JkKHBhcmVudCk/LmNvbnRlbnRWaWV3O1xuICBjb25zdCB3ZWJDb250ZW50c1ZpZXcgPSBhc1JlY29yZCh2aWV3LnZpZXcpPy53ZWJDb250ZW50c1ZpZXc7XG4gIGlmICh0eXBlb2YgYXNSZWNvcmQocGFyZW50KT8uYWRkQnJvd3NlclZpZXcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGNhbGxPYmplY3RNZXRob2QocGFyZW50LCBcImFkZEJyb3dzZXJWaWV3XCIsIFt2aWV3LnZpZXddKTtcbiAgICB2aWV3LmF0dGFjaE1vZGUgPSBcImJyb3dzZXJWaWV3XCI7XG4gIH0gZWxzZSBpZiAoXG4gICAgdHlwZW9mIGFzUmVjb3JkKGNvbnRlbnRWaWV3KT8uYWRkQ2hpbGRWaWV3ID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICB3ZWJDb250ZW50c1ZpZXdcbiAgKSB7XG4gICAgdHJ5IHtcbiAgICAgIGFkZE93bENoaWxkVmlldyhwYXJlbnQsIHZpZXcudmlldyk7XG4gICAgICB2aWV3LmF0dGFjaE1vZGUgPSBcImNvbnRlbnRWaWV3XCI7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBcIk93bCBjb250ZW50VmlldyBhdHRhY2htZW50IGZhaWxlZDsgZmFsbGluZyBiYWNrIHRvIEJyb3dzZXJWaWV3XCIsIHtcbiAgICAgICAgdHdlYWtJZDogdmlldy50d2Vha0lkLFxuICAgICAgICB2aWV3SWQ6IHZpZXcuaWQsXG4gICAgICAgIGVycm9yOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKCF2aWV3LmF0dGFjaE1vZGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPd2wgdmlldyBhdHRhY2htZW50IGlzIG5vdCBhdmFpbGFibGUgb24gdGhpcyBDb2RleCB3aW5kb3dcIik7XG4gIH1cblxuICBjb25zdCBkaXNwb3NlID0gKCkgPT4gZGlzcG9zZU93bFZpZXdCeUlkKHZpZXcudHdlYWtJZCwgdmlldy5pZCk7XG4gIGJpbmRXaW5kb3dFdmVudChwYXJlbnQsIHZpZXcsIFwiY2xvc2VkXCIsIGRpc3Bvc2UpO1xuICBiaW5kV2luZG93RXZlbnQocGFyZW50LCB2aWV3LCBcImNsb3NlXCIsIGRpc3Bvc2UpO1xufVxuXG5mdW5jdGlvbiBicmluZ093bFZpZXdUb0Zyb250KHZpZXc6IE1hbmFnZWRPd2xWaWV3KTogdm9pZCB7XG4gIGlmICh2aWV3LmRpc3Bvc2VkKSByZXR1cm47XG4gIGNvbnN0IHBhcmVudCA9IHZpZXcucGFyZW50V2luZG93SWQgPT09IG51bGwgPyBudWxsIDogQnJvd3NlcldpbmRvdy5mcm9tSWQodmlldy5wYXJlbnRXaW5kb3dJZCk7XG4gIGlmICghcGFyZW50IHx8IGlzV2luZG93RGVzdHJveWVkKHBhcmVudCkpIHJldHVybjtcbiAgY29uc3QgY29udGVudFZpZXcgPSBhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldztcbiAgY29uc3Qgd2ViQ29udGVudHNWaWV3ID0gYXNSZWNvcmQodmlldy52aWV3KT8ud2ViQ29udGVudHNWaWV3O1xuICBpZiAodmlldy5hdHRhY2hNb2RlID09PSBcImNvbnRlbnRWaWV3XCIgJiYgd2ViQ29udGVudHNWaWV3KSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0eXBlb2YgYXNSZWNvcmQocGFyZW50KT8uc2V0VG9wQnJvd3NlclZpZXcgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsT2JqZWN0TWV0aG9kKHBhcmVudCwgXCJzZXRUb3BCcm93c2VyVmlld1wiLCBbdmlldy52aWV3XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYWxsT2JqZWN0TWV0aG9kKGNvbnRlbnRWaWV3LCBcImFkZENoaWxkVmlld1wiLCBbd2ViQ29udGVudHNWaWV3XSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBcIk93bCBjb250ZW50VmlldyBicmluZy10by1mcm9udCBmYWlsZWRcIiwge1xuICAgICAgICB0d2Vha0lkOiB2aWV3LnR3ZWFrSWQsXG4gICAgICAgIHZpZXdJZDogdmlldy5pZCxcbiAgICAgICAgZXJyb3I6IFN0cmluZyhlKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBpZiAodHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LnNldFRvcEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsT2JqZWN0TWV0aG9kKHBhcmVudCwgXCJzZXRUb3BCcm93c2VyVmlld1wiLCBbdmlldy52aWV3XSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0T3dsVmlld0JvdW5kcyh2aWV3OiBNYW5hZ2VkT3dsVmlldywgYm91bmRzOiBFbGVjdHJvbi5SZWN0YW5nbGUpOiB2b2lkIHtcbiAgYXNzZXJ0Qm91bmRzKGJvdW5kcyk7XG4gIGNhbGxPYmplY3RNZXRob2Qodmlldy52aWV3LCBcInNldEJvdW5kc1wiLCBbYm91bmRzXSk7XG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQodmlldy52aWV3KT8ud2ViQ29udGVudHNWaWV3LCBcInNldEJvdW5kc1wiLCBbYm91bmRzXSk7XG59XG5cbmZ1bmN0aW9uIHNldE93bFZpZXdWaXNpYmxlKHZpZXc6IE1hbmFnZWRPd2xWaWV3LCB2aXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQodmlldy52aWV3KT8ud2ViQ29udGVudHNWaWV3LCBcInNldFZpc2libGVcIiwgW3Zpc2libGVdKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZU93bFZpZXdCeUlkKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gb3dsVmlld3MuZ2V0KG93bFZpZXdLZXkodHdlYWtJZCwgaWQpKTtcbiAgaWYgKCF2aWV3KSByZXR1cm47XG4gIGRpc3Bvc2VPd2xWaWV3KHZpZXcpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlT3dsVmlld3NGb3JUd2Vhayh0d2Vha0lkOiBzdHJpbmcpOiB2b2lkIHtcbiAgZm9yIChjb25zdCB2aWV3IG9mIFsuLi5vd2xWaWV3cy52YWx1ZXMoKV0pIHtcbiAgICBpZiAodmlldy50d2Vha0lkID09PSB0d2Vha0lkKSBkaXNwb3NlT3dsVmlldyh2aWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwb3NlQWxsT3dsVmlld3MoKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdmlldyBvZiBbLi4ub3dsVmlld3MudmFsdWVzKCldKSBkaXNwb3NlT3dsVmlldyh2aWV3KTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZU93bFZpZXcodmlldzogTWFuYWdlZE93bFZpZXcpOiB2b2lkIHtcbiAgaWYgKHZpZXcuZGlzcG9zZWQpIHJldHVybjtcbiAgdmlldy5kaXNwb3NlZCA9IHRydWU7XG4gIG93bFZpZXdzLmRlbGV0ZSh2aWV3LmtleSk7XG4gIGZvciAoY29uc3QgZGlzcG9zZSBvZiB2aWV3LmRpc3Bvc2VCaW5kaW5ncy5zcGxpY2UoMCkpIHtcbiAgICB0cnkge1xuICAgICAgZGlzcG9zZSgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxuICBjb25zdCBwYXJlbnQgPSB2aWV3LnBhcmVudFdpbmRvd0lkID09PSBudWxsID8gbnVsbCA6IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHZpZXcucGFyZW50V2luZG93SWQpO1xuICBpZiAocGFyZW50ICYmICFpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnQpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh2aWV3LmF0dGFjaE1vZGUgPT09IFwiY29udGVudFZpZXdcIikge1xuICAgICAgICByZW1vdmVPd2xDaGlsZFZpZXcocGFyZW50LCB2aWV3LnZpZXcpO1xuICAgICAgfSBlbHNlIGlmICh2aWV3LmF0dGFjaE1vZGUgPT09IFwiYnJvd3NlclZpZXdcIikge1xuICAgICAgICBjYWxsT2JqZWN0TWV0aG9kKHBhcmVudCwgXCJyZW1vdmVCcm93c2VyVmlld1wiLCBbdmlldy52aWV3XSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBcIk93bCB2aWV3IGRldGFjaCBmYWlsZWQgZHVyaW5nIGRpc3Bvc2VcIiwge1xuICAgICAgICB0d2Vha0lkOiB2aWV3LnR3ZWFrSWQsXG4gICAgICAgIHZpZXdJZDogdmlldy5pZCxcbiAgICAgICAgZXJyb3I6IFN0cmluZyhlKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICB0cnkge1xuICAgIGlmICghdmlldy52aWV3LndlYkNvbnRlbnRzLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgIHZpZXcudmlldy53ZWJDb250ZW50cy5jbG9zZSh7IHdhaXRGb3JCZWZvcmVVbmxvYWQ6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxufVxuXG5mdW5jdGlvbiBvd2xWaWV3Rm9yKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE1hbmFnZWRPd2xWaWV3IHtcbiAgY29uc3QgdmlldyA9IG93bFZpZXdzLmdldChvd2xWaWV3S2V5KHR3ZWFrSWQsIGlkKSk7XG4gIGlmICghdmlldyB8fCB2aWV3LmRpc3Bvc2VkKSB0aHJvdyBuZXcgRXJyb3IoYENvZGV4IHZpZXcgaXMgbm90IGxvYWRlZDogJHt0d2Vha0lkfToke2lkfWApO1xuICByZXR1cm4gdmlldztcbn1cblxuZnVuY3Rpb24gb3dsVmlld0tleSh0d2Vha0lkOiBzdHJpbmcsIHZpZXdJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3R3ZWFrSWR9OiR7dmlld0lkfWA7XG59XG5cbmZ1bmN0aW9uIGFkZE93bENoaWxkVmlldyhwYXJlbnQ6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csIGNoaWxkOiBFbGVjdHJvbi5Ccm93c2VyVmlldyk6IHZvaWQge1xuICBjb25zdCBvd25lcldpbmRvdyA9IGFzUmVjb3JkKGNoaWxkKT8ub3duZXJXaW5kb3c7XG4gIGlmIChvd25lcldpbmRvdyAmJiBvd25lcldpbmRvdyAhPT0gcGFyZW50KSB7XG4gICAgY2FsbE9iamVjdE1ldGhvZChvd25lcldpbmRvdywgXCJyZW1vdmVCcm93c2VyVmlld1wiLCBbY2hpbGRdKTtcbiAgfVxuXG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQocGFyZW50KT8uY29udGVudFZpZXcsIFwiYWRkQ2hpbGRWaWV3XCIsIFthc1JlY29yZChjaGlsZCk/LndlYkNvbnRlbnRzVmlld10pO1xuICB0cnkge1xuICAgIChjaGlsZCBhcyB1bmtub3duIGFzIHsgb3duZXJXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIH0pLm93bmVyV2luZG93ID0gcGFyZW50O1xuICB9IGNhdGNoIHt9XG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQoY2hpbGQud2ViQ29udGVudHMpLCBcIl9zZXRPd25lcldpbmRvd1wiLCBbcGFyZW50XSk7XG5cbiAgY29uc3QgYnJvd3NlclZpZXdzID0gYXNSZWNvcmQocGFyZW50KT8uX2Jyb3dzZXJWaWV3cztcbiAgaWYgKEFycmF5LmlzQXJyYXkoYnJvd3NlclZpZXdzKSAmJiAhYnJvd3NlclZpZXdzLmluY2x1ZGVzKGNoaWxkKSkge1xuICAgIGJyb3dzZXJWaWV3cy5wdXNoKGNoaWxkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZW1vdmVPd2xDaGlsZFZpZXcocGFyZW50OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LCBjaGlsZDogRWxlY3Ryb24uQnJvd3NlclZpZXcpOiB2b2lkIHtcbiAgY2FsbE9iamVjdE1ldGhvZChhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldywgXCJyZW1vdmVDaGlsZFZpZXdcIiwgW2FzUmVjb3JkKGNoaWxkKT8ud2ViQ29udGVudHNWaWV3XSk7XG4gIHRyeSB7XG4gICAgKGNoaWxkIGFzIHVua25vd24gYXMgeyBvd25lcldpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfSkub3duZXJXaW5kb3cgPSBudWxsO1xuICB9IGNhdGNoIHt9XG5cbiAgY29uc3QgYnJvd3NlclZpZXdzID0gYXNSZWNvcmQocGFyZW50KT8uX2Jyb3dzZXJWaWV3cztcbiAgaWYgKEFycmF5LmlzQXJyYXkoYnJvd3NlclZpZXdzKSkge1xuICAgIGNvbnN0IGluZGV4ID0gYnJvd3NlclZpZXdzLmluZGV4T2YoY2hpbGQpO1xuICAgIGlmIChpbmRleCA+PSAwKSBicm93c2VyVmlld3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb2RleEJyb3dzZXJWaWV3KG9wdHM6IENvZGV4Q3JlYXRlVmlld09wdGlvbnMpOiBQcm9taXNlPHVua25vd24+IHtcbiAgY29uc3Qgc2VydmljZXMgPSBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk7XG4gIGNvbnN0IHdpbmRvd01hbmFnZXIgPSBzZXJ2aWNlcz8ud2luZG93TWFuYWdlcjtcbiAgaWYgKCFzZXJ2aWNlcyB8fCAhd2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIkNvZGV4IGVtYmVkZGVkIHZpZXcgc2VydmljZXMgYXJlIG5vdCBhdmFpbGFibGUuIFJlaW5zdGFsbCBDb2RleCsrIDEuMC4wIG9yIGxhdGVyLlwiLFxuICAgICk7XG4gIH1cblxuICBjb25zdCByb3V0ZSA9IG5vcm1hbGl6ZUNvZGV4Um91dGUob3B0cy5yb3V0ZSk7XG4gIGNvbnN0IGhvc3RJZCA9IG9wdHMuaG9zdElkIHx8IFwibG9jYWxcIjtcbiAgY29uc3QgYXBwZWFyYW5jZSA9IG9wdHMuYXBwZWFyYW5jZSB8fCBcInNlY29uZGFyeVwiO1xuICBjb25zdCB2aWV3ID0gbmV3IEJyb3dzZXJWaWV3KHtcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgcHJlbG9hZDogd2luZG93TWFuYWdlci5vcHRpb25zPy5wcmVsb2FkUGF0aCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgc3BlbGxjaGVjazogZmFsc2UsXG4gICAgICBkZXZUb29sczogd2luZG93TWFuYWdlci5vcHRpb25zPy5hbGxvd0RldnRvb2xzLFxuICAgIH0sXG4gIH0pO1xuICBjb25zdCB3aW5kb3dMaWtlID0gbWFrZVdpbmRvd0xpa2VGb3JWaWV3KHZpZXcpO1xuICB3aW5kb3dNYW5hZ2VyLnJlZ2lzdGVyV2luZG93KHdpbmRvd0xpa2UsIGhvc3RJZCwgZmFsc2UsIGFwcGVhcmFuY2UpO1xuICBzZXJ2aWNlcy5nZXRDb250ZXh0Py4oaG9zdElkKT8ucmVnaXN0ZXJXaW5kb3c/Lih3aW5kb3dMaWtlKTtcbiAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKGNvZGV4QXBwVXJsKHJvdXRlLCBob3N0SWQpKTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUNvZGV4V2luZG93KG9wdHM6IENvZGV4Q3JlYXRlV2luZG93T3B0aW9ucyk6IFByb21pc2U8Q29kZXhXaW5kb3dSZWY+IHtcbiAgY29uc3Qgc2VydmljZXMgPSBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk7XG4gIGlmICghc2VydmljZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBcIkNvZGV4IHdpbmRvdyBzZXJ2aWNlcyBhcmUgbm90IGF2YWlsYWJsZS4gUmVpbnN0YWxsIENvZGV4KysgMS4wLjAgb3IgbGF0ZXIuXCIsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IHJvdXRlID0gbm9ybWFsaXplQ29kZXhSb3V0ZShvcHRzLnJvdXRlKTtcbiAgY29uc3QgaG9zdElkID0gb3B0cy5ob3N0SWQgfHwgXCJsb2NhbFwiO1xuICBjb25zdCBwYXJlbnQgPSB0eXBlb2Ygb3B0cy5wYXJlbnRXaW5kb3dJZCA9PT0gXCJudW1iZXJcIlxuICAgID8gQnJvd3NlcldpbmRvdy5mcm9tSWQob3B0cy5wYXJlbnRXaW5kb3dJZClcbiAgICA6IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpO1xuICBjb25zdCBjcmVhdGVXaW5kb3cgPSBzZXJ2aWNlcy53aW5kb3dNYW5hZ2VyPy5jcmVhdGVXaW5kb3c7XG5cbiAgbGV0IHdpbjogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gIGlmICh0eXBlb2YgY3JlYXRlV2luZG93ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aW4gPSBhd2FpdCBjcmVhdGVXaW5kb3cuY2FsbChzZXJ2aWNlcy53aW5kb3dNYW5hZ2VyLCB7XG4gICAgICBpbml0aWFsUm91dGU6IHJvdXRlLFxuICAgICAgaG9zdElkLFxuICAgICAgc2hvdzogb3B0cy5zaG93ICE9PSBmYWxzZSxcbiAgICAgIGFwcGVhcmFuY2U6IG9wdHMuYXBwZWFyYW5jZSB8fCBcInNlY29uZGFyeVwiLFxuICAgICAgcGFyZW50LFxuICAgIH0pO1xuICB9IGVsc2UgaWYgKGhvc3RJZCA9PT0gXCJsb2NhbFwiICYmIHR5cGVvZiBzZXJ2aWNlcy5jcmVhdGVGcmVzaFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgc2VydmljZXMuY3JlYXRlRnJlc2hXaW5kb3cocm91dGUpO1xuICB9IGVsc2UgaWYgKGhvc3RJZCA9PT0gXCJsb2NhbFwiICYmIHR5cGVvZiBzZXJ2aWNlcy5jcmVhdGVGcmVzaExvY2FsV2luZG93ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB3aW4gPSBhd2FpdCBzZXJ2aWNlcy5jcmVhdGVGcmVzaExvY2FsV2luZG93KHJvdXRlKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc2VydmljZXMuZW5zdXJlSG9zdFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgc2VydmljZXMuZW5zdXJlSG9zdFdpbmRvdyhob3N0SWQpO1xuICB9XG5cbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCBkaWQgbm90IHJldHVybiBhIHdpbmRvdyBmb3IgdGhlIHJlcXVlc3RlZCByb3V0ZVwiKTtcbiAgfVxuXG4gIGlmIChvcHRzLmJvdW5kcykge1xuICAgIHdpbi5zZXRCb3VuZHMob3B0cy5ib3VuZHMpO1xuICB9XG4gIGlmIChwYXJlbnQgJiYgIXBhcmVudC5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHdpbi5zZXRQYXJlbnRXaW5kb3cocGFyZW50KTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgaWYgKG9wdHMuc2hvdyAhPT0gZmFsc2UpIHtcbiAgICB3aW4uc2hvdygpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB3aW5kb3dJZDogd2luLmlkLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHdpbi53ZWJDb250ZW50cy5pZCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZUNvZGV4QXBpKHR3ZWFrOiBEaXNjb3ZlcmVkVHdlYWspIHtcbiAgY29uc3QgY3R4ID0gKCk6IE5hdGl2ZVR3ZWFrQ29udGV4dCA9PiAoeyBpZDogdHdlYWsubWFuaWZlc3QuaWQsIGRpcjogdHdlYWsuZGlyIH0pO1xuICByZXR1cm4ge1xuICAgIHJ1bnRpbWU6IHtcbiAgICAgIGdldEluZm86IGFzeW5jICgpID0+IGN1cnJlbnRSdW50aW1lSW5mbygpLFxuICAgICAgZ2V0Q2FwYWJpbGl0aWVzOiBhc3luYyAoKSA9PiBjdXJyZW50UnVudGltZUNhcGFiaWxpdGllcygpLFxuICAgIH0sXG4gICAgd2luZG93czoge1xuICAgICAgY3JlYXRlOiBjcmVhdGVDb2RleFdpbmRvdyxcbiAgICAgIGdldFByaW1hcnk6IGFzeW5jICgpID0+IGdldFByaW1hcnlDb2RleFdpbmRvd1JlZigpLFxuICAgICAgZm9jdXM6IGFzeW5jICh3aW5kb3dJZDogbnVtYmVyKSA9PiBmb2N1c0NvZGV4V2luZG93KHdpbmRvd0lkKSxcbiAgICAgIHNob3c6IGFzeW5jICh3aW5kb3dJZDogbnVtYmVyKSA9PiBzaG93Q29kZXhXaW5kb3cod2luZG93SWQpLFxuICAgIH0sXG4gICAgdmlld3M6IHtcbiAgICAgIGNyZWF0ZTogYXN5bmMgKG9wdGlvbnM6IENvZGV4Vmlld0NyZWF0ZU9wdGlvbnMpID0+IHtcbiAgICAgICAgYXNzZXJ0VHdlYWtWaWV3UGVybWlzc2lvbih0d2Vhayk7XG4gICAgICAgIHJldHVybiBjcmVhdGVPd2xWaWV3KGN0eCgpLCBvcHRpb25zKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjZHA6IHtcbiAgICAgIGdldFN0YXR1czogYXN5bmMgKCkgPT4gZ2V0Q2RwU3RhdHVzKCksXG4gICAgICBsaXN0VGFyZ2V0czogYXN5bmMgKCkgPT4gbGlzdENkcFRhcmdldHMoKSxcbiAgICB9LFxuICAgIG5hdGl2ZToge1xuICAgICAgbG9hZE1vZHVsZTogYXN5bmMgKG9wdGlvbnM6IE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhaywgXCJuYXRpdmUtbW9kdWxlXCIpO1xuICAgICAgICByZXR1cm4gbmF0aXZlQnJpZGdlLmxvYWRNb2R1bGUoY3R4KCksIG9wdGlvbnMpO1xuICAgICAgfSxcbiAgICAgIGNyZWF0ZVBhbmVsOiBhc3luYyAob3B0aW9uczogTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhaywgXCJuYXRpdmUtdmlld1wiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5jcmVhdGVQYW5lbChjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgICAgYXR0YWNoVmlldzogYXN5bmMgKG9wdGlvbnM6IE5hdGl2ZVZpZXdBdHRhY2hPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhaywgXCJuYXRpdmUtdmlld1wiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5hdHRhY2hWaWV3KGN0eCgpLCBvcHRpb25zKTtcbiAgICAgIH0sXG4gICAgICBsYXVuY2hIZWxwZXI6IGFzeW5jIChvcHRpb25zOiBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhaywgXCJuYXRpdmUtaGVscGVyXCIpO1xuICAgICAgICByZXR1cm4gbmF0aXZlQnJpZGdlLmxhdW5jaEhlbHBlcihjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY3JlYXRlQnJvd3NlclZpZXc6IGNyZWF0ZUNvZGV4QnJvd3NlclZpZXcsXG4gICAgY3JlYXRlV2luZG93OiBjcmVhdGVDb2RleFdpbmRvdyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZVdpbmRvd0xpa2VGb3JWaWV3KHZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3KTogQ29kZXhXaW5kb3dMaWtlIHtcbiAgY29uc3Qgdmlld0JvdW5kcyA9ICgpID0+IHZpZXcuZ2V0Qm91bmRzKCk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHZpZXcud2ViQ29udGVudHMuaWQsXG4gICAgd2ViQ29udGVudHM6IHZpZXcud2ViQ29udGVudHMsXG4gICAgb246IChldmVudDogXCJjbG9zZWRcIiwgbGlzdGVuZXI6ICgpID0+IHZvaWQpID0+IHtcbiAgICAgIGlmIChldmVudCA9PT0gXCJjbG9zZWRcIikge1xuICAgICAgICB2aWV3LndlYkNvbnRlbnRzLm9uY2UoXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlldy53ZWJDb250ZW50cy5vbihldmVudCwgbGlzdGVuZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBvbmNlOiAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHZpZXcud2ViQ29udGVudHMub25jZShldmVudCBhcyBcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIG9mZjogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLm9mZihldmVudCBhcyBcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHZpZXcud2ViQ29udGVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBpc0Rlc3Ryb3llZDogKCkgPT4gdmlldy53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpLFxuICAgIGlzRm9jdXNlZDogKCkgPT4gdmlldy53ZWJDb250ZW50cy5pc0ZvY3VzZWQoKSxcbiAgICBmb2N1czogKCkgPT4gdmlldy53ZWJDb250ZW50cy5mb2N1cygpLFxuICAgIHNob3c6ICgpID0+IHt9LFxuICAgIGhpZGU6ICgpID0+IHt9LFxuICAgIGdldEJvdW5kczogdmlld0JvdW5kcyxcbiAgICBnZXRDb250ZW50Qm91bmRzOiB2aWV3Qm91bmRzLFxuICAgIGdldFNpemU6ICgpID0+IHtcbiAgICAgIGNvbnN0IGIgPSB2aWV3Qm91bmRzKCk7XG4gICAgICByZXR1cm4gW2Iud2lkdGgsIGIuaGVpZ2h0XTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTaXplOiAoKSA9PiB7XG4gICAgICBjb25zdCBiID0gdmlld0JvdW5kcygpO1xuICAgICAgcmV0dXJuIFtiLndpZHRoLCBiLmhlaWdodF07XG4gICAgfSxcbiAgICBzZXRUaXRsZTogKCkgPT4ge30sXG4gICAgZ2V0VGl0bGU6ICgpID0+IFwiXCIsXG4gICAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZTogKCkgPT4ge30sXG4gICAgc2V0RG9jdW1lbnRFZGl0ZWQ6ICgpID0+IHt9LFxuICAgIHNldFdpbmRvd0J1dHRvblZpc2liaWxpdHk6ICgpID0+IHt9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb2RleEFwcFVybChyb3V0ZTogc3RyaW5nLCBob3N0SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoXCJhcHA6Ly8tL2luZGV4Lmh0bWxcIik7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwiaG9zdElkXCIsIGhvc3RJZCk7XG4gIGlmIChyb3V0ZSAhPT0gXCIvXCIpIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwiaW5pdGlhbFJvdXRlXCIsIHJvdXRlKTtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVPd2xWaWV3VXJsKHVybDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB1cmwgIT09IFwic3RyaW5nXCIgfHwgdXJsLmluY2x1ZGVzKFwiXFxuXCIpIHx8IHVybC5pbmNsdWRlcyhcIlxcclwiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk93bCB2aWV3IFVSTCBtdXN0IGJlIGEgc3RyaW5nIHdpdGhvdXQgY29udHJvbCBjaGFyYWN0ZXJzXCIpO1xuICB9XG4gIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsKTtcbiAgaWYgKCFbXCJodHRwOlwiLCBcImh0dHBzOlwiLCBcImFwcDpcIiwgXCJmaWxlOlwiLCBcImRhdGE6XCIsIFwiYWJvdXQ6XCJdLmluY2x1ZGVzKHBhcnNlZC5wcm90b2NvbCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHVuc3VwcG9ydGVkIE93bCB2aWV3IFVSTCBwcm90b2NvbDogJHtwYXJzZWQucHJvdG9jb2x9YCk7XG4gIH1cbiAgcmV0dXJuIHBhcnNlZC50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk6IENvZGV4V2luZG93U2VydmljZXMgfCBudWxsIHtcbiAgY29uc3Qgc2VydmljZXMgPSAoZ2xvYmFsVGhpcyBhcyB1bmtub3duIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+KVtDT0RFWF9XSU5ET1dfU0VSVklDRVNfS0VZXTtcbiAgcmV0dXJuIHNlcnZpY2VzICYmIHR5cGVvZiBzZXJ2aWNlcyA9PT0gXCJvYmplY3RcIiA/IChzZXJ2aWNlcyBhcyBDb2RleFdpbmRvd1NlcnZpY2VzKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvZGV4Um91dGUocm91dGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2Ygcm91dGUgIT09IFwic3RyaW5nXCIgfHwgIXJvdXRlLnN0YXJ0c1dpdGgoXCIvXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcm91dGUgbXVzdCBiZSBhbiBhYnNvbHV0ZSBhcHAgcm91dGVcIik7XG4gIH1cbiAgaWYgKHJvdXRlLmluY2x1ZGVzKFwiOi8vXCIpIHx8IHJvdXRlLmluY2x1ZGVzKFwiXFxuXCIpIHx8IHJvdXRlLmluY2x1ZGVzKFwiXFxyXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggcm91dGUgbXVzdCBub3QgaW5jbHVkZSBhIHByb3RvY29sIG9yIGNvbnRyb2wgY2hhcmFjdGVyc1wiKTtcbiAgfVxuICByZXR1cm4gcm91dGU7XG59XG5cbmZ1bmN0aW9uIGFzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IDogbnVsbDtcbn1cblxuZnVuY3Rpb24gY2FsbE9iamVjdE1ldGhvZCh0YXJnZXQ6IHVua25vd24sIG1ldGhvZDogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiB1bmtub3duIHtcbiAgY29uc3QgZm4gPSBhc1JlY29yZCh0YXJnZXQpPy5bbWV0aG9kXTtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gZm4uYXBwbHkodGFyZ2V0LCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gaXNXaW5kb3dEZXN0cm95ZWQod2luOiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICBpZiAoIXdpbikgcmV0dXJuIHRydWU7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQod2luKT8uaXNEZXN0cm95ZWQ7XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuICB0cnkge1xuICAgIHJldHVybiBCb29sZWFuKGZuLmNhbGwod2luKSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdpbmRvd0lkRm9yKHdpbjogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBudW1iZXIgfCBudWxsIHtcbiAgY29uc3QgaWQgPSBhc1JlY29yZCh3aW4pPy5pZDtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gYmluZFdpbmRvd0V2ZW50KFxuICB3aW46IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csXG4gIHZpZXc6IE1hbmFnZWRPd2xWaWV3LFxuICBldmVudDogc3RyaW5nLFxuICBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCxcbik6IHZvaWQge1xuICBjb25zdCBvbiA9IGFzUmVjb3JkKHdpbik/Lm9uO1xuICBjb25zdCBvZmYgPSBhc1JlY29yZCh3aW4pPy5vZmY7XG4gIGlmICh0eXBlb2Ygb24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuO1xuICBvbi5jYWxsKHdpbiwgZXZlbnQsIGxpc3RlbmVyKTtcbiAgdmlldy5kaXNwb3NlQmluZGluZ3MucHVzaCgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBvZmYgPT09IFwiZnVuY3Rpb25cIikgb2ZmLmNhbGwod2luLCBldmVudCwgbGlzdGVuZXIpO1xuICAgIGVsc2UgY2FsbE9iamVjdE1ldGhvZCh3aW4sIFwicmVtb3ZlTGlzdGVuZXJcIiwgW2V2ZW50LCBsaXN0ZW5lcl0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0QnJpZGdlSWQodmFsdWU6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIS9eW2EtekEtWjAtOS5fLV0rJC8udGVzdCh2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGFiZWx9IG1heSBvbmx5IGNvbnRhaW4gbGV0dGVycywgbnVtYmVycywgZG90cywgdW5kZXJzY29yZXMsIGFuZCBkYXNoZXNgKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEJvdW5kcyhib3VuZHM6IEVsZWN0cm9uLlJlY3RhbmdsZSk6IHZvaWQge1xuICBjb25zdCB2YWx1ZXMgPSBbYm91bmRzPy54LCBib3VuZHM/LnksIGJvdW5kcz8ud2lkdGgsIGJvdW5kcz8uaGVpZ2h0XTtcbiAgaWYgKCF2YWx1ZXMuZXZlcnkoKHZhbHVlKSA9PiB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHZhbHVlKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3VuZHMgbXVzdCBjb250YWluIGZpbml0ZSB4LCB5LCB3aWR0aCwgYW5kIGhlaWdodCBudW1iZXJzXCIpO1xuICB9XG4gIGlmIChib3VuZHMud2lkdGggPCAwIHx8IGJvdW5kcy5oZWlnaHQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmRzIHdpZHRoIGFuZCBoZWlnaHQgbXVzdCBiZSBub24tbmVnYXRpdmVcIik7XG4gIH1cbn1cblxuLy8gVG91Y2ggQnJvd3NlcldpbmRvdyB0byBrZWVwIGl0cyBpbXBvcnQgXHUyMDE0IG9sZGVyIEVsZWN0cm9uIGxpbnQgcnVsZXMuXG52b2lkIEJyb3dzZXJXaW5kb3c7XG4iLCAiLyohIGNob2tpZGFyIC0gTUlUIExpY2Vuc2UgKGMpIDIwMTIgUGF1bCBNaWxsZXIgKHBhdWxtaWxsci5jb20pICovXG5pbXBvcnQgeyBzdGF0IGFzIHN0YXRjYiB9IGZyb20gJ2ZzJztcbmltcG9ydCB7IHN0YXQsIHJlYWRkaXIgfSBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0ICogYXMgc3lzUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHJlYWRkaXJwIH0gZnJvbSAncmVhZGRpcnAnO1xuaW1wb3J0IHsgTm9kZUZzSGFuZGxlciwgRVZFTlRTIGFzIEVWLCBpc1dpbmRvd3MsIGlzSUJNaSwgRU1QVFlfRk4sIFNUUl9DTE9TRSwgU1RSX0VORCwgfSBmcm9tICcuL2hhbmRsZXIuanMnO1xuY29uc3QgU0xBU0ggPSAnLyc7XG5jb25zdCBTTEFTSF9TTEFTSCA9ICcvLyc7XG5jb25zdCBPTkVfRE9UID0gJy4nO1xuY29uc3QgVFdPX0RPVFMgPSAnLi4nO1xuY29uc3QgU1RSSU5HX1RZUEUgPSAnc3RyaW5nJztcbmNvbnN0IEJBQ0tfU0xBU0hfUkUgPSAvXFxcXC9nO1xuY29uc3QgRE9VQkxFX1NMQVNIX1JFID0gL1xcL1xcLy87XG5jb25zdCBET1RfUkUgPSAvXFwuLipcXC4oc3dbcHhdKSR8fiR8XFwuc3VibC4qXFwudG1wLztcbmNvbnN0IFJFUExBQ0VSX1JFID0gL15cXC5bL1xcXFxdLztcbmZ1bmN0aW9uIGFycmlmeShpdGVtKSB7XG4gICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoaXRlbSkgPyBpdGVtIDogW2l0ZW1dO1xufVxuY29uc3QgaXNNYXRjaGVyT2JqZWN0ID0gKG1hdGNoZXIpID0+IHR5cGVvZiBtYXRjaGVyID09PSAnb2JqZWN0JyAmJiBtYXRjaGVyICE9PSBudWxsICYmICEobWF0Y2hlciBpbnN0YW5jZW9mIFJlZ0V4cCk7XG5mdW5jdGlvbiBjcmVhdGVQYXR0ZXJuKG1hdGNoZXIpIHtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJldHVybiBtYXRjaGVyO1xuICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gJ3N0cmluZycpXG4gICAgICAgIHJldHVybiAoc3RyaW5nKSA9PiBtYXRjaGVyID09PSBzdHJpbmc7XG4gICAgaWYgKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICAgIHJldHVybiAoc3RyaW5nKSA9PiBtYXRjaGVyLnRlc3Qoc3RyaW5nKTtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdvYmplY3QnICYmIG1hdGNoZXIgIT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIChzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGlmIChtYXRjaGVyLnBhdGggPT09IHN0cmluZylcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVyLnJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlID0gc3lzUGF0aC5yZWxhdGl2ZShtYXRjaGVyLnBhdGgsIHN0cmluZyk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZWxhdGl2ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAhcmVsYXRpdmUuc3RhcnRzV2l0aCgnLi4nKSAmJiAhc3lzUGF0aC5pc0Fic29sdXRlKHJlbGF0aXZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuICgpID0+IGZhbHNlO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplUGF0aChwYXRoKSB7XG4gICAgaWYgKHR5cGVvZiBwYXRoICE9PSAnc3RyaW5nJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzdHJpbmcgZXhwZWN0ZWQnKTtcbiAgICBwYXRoID0gc3lzUGF0aC5ub3JtYWxpemUocGF0aCk7XG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIGxldCBwcmVwZW5kID0gZmFsc2U7XG4gICAgaWYgKHBhdGguc3RhcnRzV2l0aCgnLy8nKSlcbiAgICAgICAgcHJlcGVuZCA9IHRydWU7XG4gICAgY29uc3QgRE9VQkxFX1NMQVNIX1JFID0gL1xcL1xcLy87XG4gICAgd2hpbGUgKHBhdGgubWF0Y2goRE9VQkxFX1NMQVNIX1JFKSlcbiAgICAgICAgcGF0aCA9IHBhdGgucmVwbGFjZShET1VCTEVfU0xBU0hfUkUsICcvJyk7XG4gICAgaWYgKHByZXBlbmQpXG4gICAgICAgIHBhdGggPSAnLycgKyBwYXRoO1xuICAgIHJldHVybiBwYXRoO1xufVxuZnVuY3Rpb24gbWF0Y2hQYXR0ZXJucyhwYXR0ZXJucywgdGVzdFN0cmluZywgc3RhdHMpIHtcbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aCh0ZXN0U3RyaW5nKTtcbiAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcGF0dGVybnMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IHBhdHRlcm4gPSBwYXR0ZXJuc1tpbmRleF07XG4gICAgICAgIGlmIChwYXR0ZXJuKHBhdGgsIHN0YXRzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuZnVuY3Rpb24gYW55bWF0Y2gobWF0Y2hlcnMsIHRlc3RTdHJpbmcpIHtcbiAgICBpZiAobWF0Y2hlcnMgPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdhbnltYXRjaDogc3BlY2lmeSBmaXJzdCBhcmd1bWVudCcpO1xuICAgIH1cbiAgICAvLyBFYXJseSBjYWNoZSBmb3IgbWF0Y2hlcnMuXG4gICAgY29uc3QgbWF0Y2hlcnNBcnJheSA9IGFycmlmeShtYXRjaGVycyk7XG4gICAgY29uc3QgcGF0dGVybnMgPSBtYXRjaGVyc0FycmF5Lm1hcCgobWF0Y2hlcikgPT4gY3JlYXRlUGF0dGVybihtYXRjaGVyKSk7XG4gICAgaWYgKHRlc3RTdHJpbmcgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gKHRlc3RTdHJpbmcsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hQYXR0ZXJucyhwYXR0ZXJucywgdGVzdFN0cmluZywgc3RhdHMpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hQYXR0ZXJucyhwYXR0ZXJucywgdGVzdFN0cmluZyk7XG59XG5jb25zdCB1bmlmeVBhdGhzID0gKHBhdGhzXykgPT4ge1xuICAgIGNvbnN0IHBhdGhzID0gYXJyaWZ5KHBhdGhzXykuZmxhdCgpO1xuICAgIGlmICghcGF0aHMuZXZlcnkoKHApID0+IHR5cGVvZiBwID09PSBTVFJJTkdfVFlQRSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgTm9uLXN0cmluZyBwcm92aWRlZCBhcyB3YXRjaCBwYXRoOiAke3BhdGhzfWApO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aHMubWFwKG5vcm1hbGl6ZVBhdGhUb1VuaXgpO1xufTtcbi8vIElmIFNMQVNIX1NMQVNIIG9jY3VycyBhdCB0aGUgYmVnaW5uaW5nIG9mIHBhdGgsIGl0IGlzIG5vdCByZXBsYWNlZFxuLy8gICAgIGJlY2F1c2UgXCIvL1N0b3JhZ2VQQy9Ecml2ZVBvb2wvTW92aWVzXCIgaXMgYSB2YWxpZCBuZXR3b3JrIHBhdGhcbmNvbnN0IHRvVW5peCA9IChzdHJpbmcpID0+IHtcbiAgICBsZXQgc3RyID0gc3RyaW5nLnJlcGxhY2UoQkFDS19TTEFTSF9SRSwgU0xBU0gpO1xuICAgIGxldCBwcmVwZW5kID0gZmFsc2U7XG4gICAgaWYgKHN0ci5zdGFydHNXaXRoKFNMQVNIX1NMQVNIKSkge1xuICAgICAgICBwcmVwZW5kID0gdHJ1ZTtcbiAgICB9XG4gICAgd2hpbGUgKHN0ci5tYXRjaChET1VCTEVfU0xBU0hfUkUpKSB7XG4gICAgICAgIHN0ciA9IHN0ci5yZXBsYWNlKERPVUJMRV9TTEFTSF9SRSwgU0xBU0gpO1xuICAgIH1cbiAgICBpZiAocHJlcGVuZCkge1xuICAgICAgICBzdHIgPSBTTEFTSCArIHN0cjtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn07XG4vLyBPdXIgdmVyc2lvbiBvZiB1cGF0aC5ub3JtYWxpemVcbi8vIFRPRE86IHRoaXMgaXMgbm90IGVxdWFsIHRvIHBhdGgtbm9ybWFsaXplIG1vZHVsZSAtIGludmVzdGlnYXRlIHdoeVxuY29uc3Qgbm9ybWFsaXplUGF0aFRvVW5peCA9IChwYXRoKSA9PiB0b1VuaXgoc3lzUGF0aC5ub3JtYWxpemUodG9Vbml4KHBhdGgpKSk7XG4vLyBUT0RPOiByZWZhY3RvclxuY29uc3Qgbm9ybWFsaXplSWdub3JlZCA9IChjd2QgPSAnJykgPT4gKHBhdGgpID0+IHtcbiAgICBpZiAodHlwZW9mIHBhdGggPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBub3JtYWxpemVQYXRoVG9Vbml4KHN5c1BhdGguaXNBYnNvbHV0ZShwYXRoKSA/IHBhdGggOiBzeXNQYXRoLmpvaW4oY3dkLCBwYXRoKSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gcGF0aDtcbiAgICB9XG59O1xuY29uc3QgZ2V0QWJzb2x1dGVQYXRoID0gKHBhdGgsIGN3ZCkgPT4ge1xuICAgIGlmIChzeXNQYXRoLmlzQWJzb2x1dGUocGF0aCkpIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuICAgIHJldHVybiBzeXNQYXRoLmpvaW4oY3dkLCBwYXRoKTtcbn07XG5jb25zdCBFTVBUWV9TRVQgPSBPYmplY3QuZnJlZXplKG5ldyBTZXQoKSk7XG4vKipcbiAqIERpcmVjdG9yeSBlbnRyeS5cbiAqL1xuY2xhc3MgRGlyRW50cnkge1xuICAgIGNvbnN0cnVjdG9yKGRpciwgcmVtb3ZlV2F0Y2hlcikge1xuICAgICAgICB0aGlzLnBhdGggPSBkaXI7XG4gICAgICAgIHRoaXMuX3JlbW92ZVdhdGNoZXIgPSByZW1vdmVXYXRjaGVyO1xuICAgICAgICB0aGlzLml0ZW1zID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICBhZGQoaXRlbSkge1xuICAgICAgICBjb25zdCB7IGl0ZW1zIH0gPSB0aGlzO1xuICAgICAgICBpZiAoIWl0ZW1zKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoaXRlbSAhPT0gT05FX0RPVCAmJiBpdGVtICE9PSBUV09fRE9UUylcbiAgICAgICAgICAgIGl0ZW1zLmFkZChpdGVtKTtcbiAgICB9XG4gICAgYXN5bmMgcmVtb3ZlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaXRlbXMuZGVsZXRlKGl0ZW0pO1xuICAgICAgICBpZiAoaXRlbXMuc2l6ZSA+IDApXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGRpciA9IHRoaXMucGF0aDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHJlYWRkaXIoZGlyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fcmVtb3ZlV2F0Y2hlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbW92ZVdhdGNoZXIoc3lzUGF0aC5kaXJuYW1lKGRpciksIHN5c1BhdGguYmFzZW5hbWUoZGlyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGFzKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmV0dXJuIGl0ZW1zLmhhcyhpdGVtKTtcbiAgICB9XG4gICAgZ2V0Q2hpbGRyZW4oKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIHJldHVybiBbLi4uaXRlbXMudmFsdWVzKCldO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLml0ZW1zLmNsZWFyKCk7XG4gICAgICAgIHRoaXMucGF0aCA9ICcnO1xuICAgICAgICB0aGlzLl9yZW1vdmVXYXRjaGVyID0gRU1QVFlfRk47XG4gICAgICAgIHRoaXMuaXRlbXMgPSBFTVBUWV9TRVQ7XG4gICAgICAgIE9iamVjdC5mcmVlemUodGhpcyk7XG4gICAgfVxufVxuY29uc3QgU1RBVF9NRVRIT0RfRiA9ICdzdGF0JztcbmNvbnN0IFNUQVRfTUVUSE9EX0wgPSAnbHN0YXQnO1xuZXhwb3J0IGNsYXNzIFdhdGNoSGVscGVyIHtcbiAgICBjb25zdHJ1Y3RvcihwYXRoLCBmb2xsb3csIGZzdykge1xuICAgICAgICB0aGlzLmZzdyA9IGZzdztcbiAgICAgICAgY29uc3Qgd2F0Y2hQYXRoID0gcGF0aDtcbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aCA9IHBhdGgucmVwbGFjZShSRVBMQUNFUl9SRSwgJycpO1xuICAgICAgICB0aGlzLndhdGNoUGF0aCA9IHdhdGNoUGF0aDtcbiAgICAgICAgdGhpcy5mdWxsV2F0Y2hQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHdhdGNoUGF0aCk7XG4gICAgICAgIHRoaXMuZGlyUGFydHMgPSBbXTtcbiAgICAgICAgdGhpcy5kaXJQYXJ0cy5mb3JFYWNoKChwYXJ0cykgPT4ge1xuICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgcGFydHMucG9wKCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmZvbGxvd1N5bWxpbmtzID0gZm9sbG93O1xuICAgICAgICB0aGlzLnN0YXRNZXRob2QgPSBmb2xsb3cgPyBTVEFUX01FVEhPRF9GIDogU1RBVF9NRVRIT0RfTDtcbiAgICB9XG4gICAgZW50cnlQYXRoKGVudHJ5KSB7XG4gICAgICAgIHJldHVybiBzeXNQYXRoLmpvaW4odGhpcy53YXRjaFBhdGgsIHN5c1BhdGgucmVsYXRpdmUodGhpcy53YXRjaFBhdGgsIGVudHJ5LmZ1bGxQYXRoKSk7XG4gICAgfVxuICAgIGZpbHRlclBhdGgoZW50cnkpIHtcbiAgICAgICAgY29uc3QgeyBzdGF0cyB9ID0gZW50cnk7XG4gICAgICAgIGlmIChzdGF0cyAmJiBzdGF0cy5pc1N5bWJvbGljTGluaygpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyRGlyKGVudHJ5KTtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5lbnRyeVBhdGgoZW50cnkpO1xuICAgICAgICAvLyBUT0RPOiB3aGF0IGlmIHN0YXRzIGlzIHVuZGVmaW5lZD8gcmVtb3ZlICFcbiAgICAgICAgcmV0dXJuIHRoaXMuZnN3Ll9pc250SWdub3JlZChyZXNvbHZlZFBhdGgsIHN0YXRzKSAmJiB0aGlzLmZzdy5faGFzUmVhZFBlcm1pc3Npb25zKHN0YXRzKTtcbiAgICB9XG4gICAgZmlsdGVyRGlyKGVudHJ5KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZzdy5faXNudElnbm9yZWQodGhpcy5lbnRyeVBhdGgoZW50cnkpLCBlbnRyeS5zdGF0cyk7XG4gICAgfVxufVxuLyoqXG4gKiBXYXRjaGVzIGZpbGVzICYgZGlyZWN0b3JpZXMgZm9yIGNoYW5nZXMuIEVtaXR0ZWQgZXZlbnRzOlxuICogYGFkZGAsIGBhZGREaXJgLCBgY2hhbmdlYCwgYHVubGlua2AsIGB1bmxpbmtEaXJgLCBgYWxsYCwgYGVycm9yYFxuICpcbiAqICAgICBuZXcgRlNXYXRjaGVyKClcbiAqICAgICAgIC5hZGQoZGlyZWN0b3JpZXMpXG4gKiAgICAgICAub24oJ2FkZCcsIHBhdGggPT4gbG9nKCdGaWxlJywgcGF0aCwgJ3dhcyBhZGRlZCcpKVxuICovXG5leHBvcnQgY2xhc3MgRlNXYXRjaGVyIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgICAvLyBOb3QgaW5kZW50aW5nIG1ldGhvZHMgZm9yIGhpc3Rvcnkgc2FrZTsgZm9yIG5vdy5cbiAgICBjb25zdHJ1Y3Rvcihfb3B0cyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY2xvc2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Nsb3NlcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX2lnbm9yZWRQYXRocyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9zdHJlYW1zID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9zeW1saW5rUGF0aHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3dhdGNoZWQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdXcml0ZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9yZWFkeUNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5fcmVhZHlFbWl0dGVkID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGF3ZiA9IF9vcHRzLmF3YWl0V3JpdGVGaW5pc2g7XG4gICAgICAgIGNvbnN0IERFRl9BV0YgPSB7IHN0YWJpbGl0eVRocmVzaG9sZDogMjAwMCwgcG9sbEludGVydmFsOiAxMDAgfTtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHtcbiAgICAgICAgICAgIC8vIERlZmF1bHRzXG4gICAgICAgICAgICBwZXJzaXN0ZW50OiB0cnVlLFxuICAgICAgICAgICAgaWdub3JlSW5pdGlhbDogZmFsc2UsXG4gICAgICAgICAgICBpZ25vcmVQZXJtaXNzaW9uRXJyb3JzOiBmYWxzZSxcbiAgICAgICAgICAgIGludGVydmFsOiAxMDAsXG4gICAgICAgICAgICBiaW5hcnlJbnRlcnZhbDogMzAwLFxuICAgICAgICAgICAgZm9sbG93U3ltbGlua3M6IHRydWUsXG4gICAgICAgICAgICB1c2VQb2xsaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIC8vIHVzZUFzeW5jOiBmYWxzZSxcbiAgICAgICAgICAgIGF0b21pYzogdHJ1ZSwgLy8gTk9URTogb3ZlcndyaXR0ZW4gbGF0ZXIgKGRlcGVuZHMgb24gdXNlUG9sbGluZylcbiAgICAgICAgICAgIC4uLl9vcHRzLFxuICAgICAgICAgICAgLy8gQ2hhbmdlIGZvcm1hdFxuICAgICAgICAgICAgaWdub3JlZDogX29wdHMuaWdub3JlZCA/IGFycmlmeShfb3B0cy5pZ25vcmVkKSA6IGFycmlmeShbXSksXG4gICAgICAgICAgICBhd2FpdFdyaXRlRmluaXNoOiBhd2YgPT09IHRydWUgPyBERUZfQVdGIDogdHlwZW9mIGF3ZiA9PT0gJ29iamVjdCcgPyB7IC4uLkRFRl9BV0YsIC4uLmF3ZiB9IDogZmFsc2UsXG4gICAgICAgIH07XG4gICAgICAgIC8vIEFsd2F5cyBkZWZhdWx0IHRvIHBvbGxpbmcgb24gSUJNIGkgYmVjYXVzZSBmcy53YXRjaCgpIGlzIG5vdCBhdmFpbGFibGUgb24gSUJNIGkuXG4gICAgICAgIGlmIChpc0lCTWkpXG4gICAgICAgICAgICBvcHRzLnVzZVBvbGxpbmcgPSB0cnVlO1xuICAgICAgICAvLyBFZGl0b3IgYXRvbWljIHdyaXRlIG5vcm1hbGl6YXRpb24gZW5hYmxlZCBieSBkZWZhdWx0IHdpdGggZnMud2F0Y2hcbiAgICAgICAgaWYgKG9wdHMuYXRvbWljID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICBvcHRzLmF0b21pYyA9ICFvcHRzLnVzZVBvbGxpbmc7XG4gICAgICAgIC8vIG9wdHMuYXRvbWljID0gdHlwZW9mIF9vcHRzLmF0b21pYyA9PT0gJ251bWJlcicgPyBfb3B0cy5hdG9taWMgOiAxMDA7XG4gICAgICAgIC8vIEdsb2JhbCBvdmVycmlkZS4gVXNlZnVsIGZvciBkZXZlbG9wZXJzLCB3aG8gbmVlZCB0byBmb3JjZSBwb2xsaW5nIGZvciBhbGxcbiAgICAgICAgLy8gaW5zdGFuY2VzIG9mIGNob2tpZGFyLCByZWdhcmRsZXNzIG9mIHVzYWdlIC8gZGVwZW5kZW5jeSBkZXB0aFxuICAgICAgICBjb25zdCBlbnZQb2xsID0gcHJvY2Vzcy5lbnYuQ0hPS0lEQVJfVVNFUE9MTElORztcbiAgICAgICAgaWYgKGVudlBvbGwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgZW52TG93ZXIgPSBlbnZQb2xsLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAoZW52TG93ZXIgPT09ICdmYWxzZScgfHwgZW52TG93ZXIgPT09ICcwJylcbiAgICAgICAgICAgICAgICBvcHRzLnVzZVBvbGxpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGVsc2UgaWYgKGVudkxvd2VyID09PSAndHJ1ZScgfHwgZW52TG93ZXIgPT09ICcxJylcbiAgICAgICAgICAgICAgICBvcHRzLnVzZVBvbGxpbmcgPSB0cnVlO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIG9wdHMudXNlUG9sbGluZyA9ICEhZW52TG93ZXI7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZW52SW50ZXJ2YWwgPSBwcm9jZXNzLmVudi5DSE9LSURBUl9JTlRFUlZBTDtcbiAgICAgICAgaWYgKGVudkludGVydmFsKVxuICAgICAgICAgICAgb3B0cy5pbnRlcnZhbCA9IE51bWJlci5wYXJzZUludChlbnZJbnRlcnZhbCwgMTApO1xuICAgICAgICAvLyBUaGlzIGlzIGRvbmUgdG8gZW1pdCByZWFkeSBvbmx5IG9uY2UsIGJ1dCBlYWNoICdhZGQnIHdpbGwgaW5jcmVhc2UgdGhhdD9cbiAgICAgICAgbGV0IHJlYWR5Q2FsbHMgPSAwO1xuICAgICAgICB0aGlzLl9lbWl0UmVhZHkgPSAoKSA9PiB7XG4gICAgICAgICAgICByZWFkeUNhbGxzKys7XG4gICAgICAgICAgICBpZiAocmVhZHlDYWxscyA+PSB0aGlzLl9yZWFkeUNvdW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdFJlYWR5ID0gRU1QVFlfRk47XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVhZHlFbWl0dGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAvLyB1c2UgcHJvY2Vzcy5uZXh0VGljayB0byBhbGxvdyB0aW1lIGZvciBsaXN0ZW5lciB0byBiZSBib3VuZFxuICAgICAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soKCkgPT4gdGhpcy5lbWl0KEVWLlJFQURZKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2VtaXRSYXcgPSAoLi4uYXJncykgPT4gdGhpcy5lbWl0KEVWLlJBVywgLi4uYXJncyk7XG4gICAgICAgIHRoaXMuX2JvdW5kUmVtb3ZlID0gdGhpcy5fcmVtb3ZlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdHM7XG4gICAgICAgIHRoaXMuX25vZGVGc0hhbmRsZXIgPSBuZXcgTm9kZUZzSGFuZGxlcih0aGlzKTtcbiAgICAgICAgLy8gWW91XHUyMDE5cmUgZnJvemVuIHdoZW4geW91ciBoZWFydFx1MjAxOXMgbm90IG9wZW4uXG4gICAgICAgIE9iamVjdC5mcmVlemUob3B0cyk7XG4gICAgfVxuICAgIF9hZGRJZ25vcmVkUGF0aChtYXRjaGVyKSB7XG4gICAgICAgIGlmIChpc01hdGNoZXJPYmplY3QobWF0Y2hlcikpIHtcbiAgICAgICAgICAgIC8vIHJldHVybiBlYXJseSBpZiB3ZSBhbHJlYWR5IGhhdmUgYSBkZWVwbHkgZXF1YWwgbWF0Y2hlciBvYmplY3RcbiAgICAgICAgICAgIGZvciAoY29uc3QgaWdub3JlZCBvZiB0aGlzLl9pZ25vcmVkUGF0aHMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNNYXRjaGVyT2JqZWN0KGlnbm9yZWQpICYmXG4gICAgICAgICAgICAgICAgICAgIGlnbm9yZWQucGF0aCA9PT0gbWF0Y2hlci5wYXRoICYmXG4gICAgICAgICAgICAgICAgICAgIGlnbm9yZWQucmVjdXJzaXZlID09PSBtYXRjaGVyLnJlY3Vyc2l2ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lnbm9yZWRQYXRocy5hZGQobWF0Y2hlcik7XG4gICAgfVxuICAgIF9yZW1vdmVJZ25vcmVkUGF0aChtYXRjaGVyKSB7XG4gICAgICAgIHRoaXMuX2lnbm9yZWRQYXRocy5kZWxldGUobWF0Y2hlcik7XG4gICAgICAgIC8vIG5vdyBmaW5kIGFueSBtYXRjaGVyIG9iamVjdHMgd2l0aCB0aGUgbWF0Y2hlciBhcyBwYXRoXG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgaWdub3JlZCBvZiB0aGlzLl9pZ25vcmVkUGF0aHMpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPICg0MzA4MWopOiBtYWtlIHRoaXMgbW9yZSBlZmZpY2llbnQuXG4gICAgICAgICAgICAgICAgLy8gcHJvYmFibHkganVzdCBtYWtlIGEgYHRoaXMuX2lnbm9yZWREaXJlY3Rvcmllc2Agb3Igc29tZVxuICAgICAgICAgICAgICAgIC8vIHN1Y2ggdGhpbmcuXG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2hlck9iamVjdChpZ25vcmVkKSAmJiBpZ25vcmVkLnBhdGggPT09IG1hdGNoZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faWdub3JlZFBhdGhzLmRlbGV0ZShpZ25vcmVkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gUHVibGljIG1ldGhvZHNcbiAgICAvKipcbiAgICAgKiBBZGRzIHBhdGhzIHRvIGJlIHdhdGNoZWQgb24gYW4gZXhpc3RpbmcgRlNXYXRjaGVyIGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSBwYXRoc18gZmlsZSBvciBmaWxlIGxpc3QuIE90aGVyIGFyZ3VtZW50cyBhcmUgdW51c2VkXG4gICAgICovXG4gICAgYWRkKHBhdGhzXywgX29yaWdBZGQsIF9pbnRlcm5hbCkge1xuICAgICAgICBjb25zdCB7IGN3ZCB9ID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jbG9zZVByb21pc2UgPSB1bmRlZmluZWQ7XG4gICAgICAgIGxldCBwYXRocyA9IHVuaWZ5UGF0aHMocGF0aHNfKTtcbiAgICAgICAgaWYgKGN3ZCkge1xuICAgICAgICAgICAgcGF0aHMgPSBwYXRocy5tYXAoKHBhdGgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhYnNQYXRoID0gZ2V0QWJzb2x1dGVQYXRoKHBhdGgsIGN3ZCk7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgYHBhdGhgIGluc3RlYWQgb2YgYGFic1BhdGhgIGJlY2F1c2UgdGhlIGN3ZCBwb3J0aW9uIGNhbid0IGJlIGEgZ2xvYlxuICAgICAgICAgICAgICAgIHJldHVybiBhYnNQYXRoO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlSWdub3JlZFBhdGgocGF0aCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl91c2VySWdub3JlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCF0aGlzLl9yZWFkeUNvdW50KVxuICAgICAgICAgICAgdGhpcy5fcmVhZHlDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3JlYWR5Q291bnQgKz0gcGF0aHMubGVuZ3RoO1xuICAgICAgICBQcm9taXNlLmFsbChwYXRocy5tYXAoYXN5bmMgKHBhdGgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuX25vZGVGc0hhbmRsZXIuX2FkZFRvTm9kZUZzKHBhdGgsICFfaW50ZXJuYWwsIHVuZGVmaW5lZCwgMCwgX29yaWdBZGQpO1xuICAgICAgICAgICAgaWYgKHJlcylcbiAgICAgICAgICAgICAgICB0aGlzLl9lbWl0UmVhZHkoKTtcbiAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgIH0pKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgcmVzdWx0cy5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkKHN5c1BhdGguZGlybmFtZShpdGVtKSwgc3lzUGF0aC5iYXNlbmFtZShfb3JpZ0FkZCB8fCBpdGVtKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZSB3YXRjaGVycyBvciBzdGFydCBpZ25vcmluZyBldmVudHMgZnJvbSBzcGVjaWZpZWQgcGF0aHMuXG4gICAgICovXG4gICAgdW53YXRjaChwYXRoc18pIHtcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIGNvbnN0IHBhdGhzID0gdW5pZnlQYXRocyhwYXRoc18pO1xuICAgICAgICBjb25zdCB7IGN3ZCB9ID0gdGhpcy5vcHRpb25zO1xuICAgICAgICBwYXRocy5mb3JFYWNoKChwYXRoKSA9PiB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IHRvIGFic29sdXRlIHBhdGggdW5sZXNzIHJlbGF0aXZlIHBhdGggYWxyZWFkeSBtYXRjaGVzXG4gICAgICAgICAgICBpZiAoIXN5c1BhdGguaXNBYnNvbHV0ZShwYXRoKSAmJiAhdGhpcy5fY2xvc2Vycy5oYXMocGF0aCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3dkKVxuICAgICAgICAgICAgICAgICAgICBwYXRoID0gc3lzUGF0aC5qb2luKGN3ZCwgcGF0aCk7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGgucmVzb2x2ZShwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlUGF0aChwYXRoKTtcbiAgICAgICAgICAgIHRoaXMuX2FkZElnbm9yZWRQYXRoKHBhdGgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3dhdGNoZWQuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkSWdub3JlZFBhdGgoe1xuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICByZWN1cnNpdmU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyByZXNldCB0aGUgY2FjaGVkIHVzZXJJZ25vcmVkIGFueW1hdGNoIGZuXG4gICAgICAgICAgICAvLyB0byBtYWtlIGlnbm9yZWRQYXRocyBjaGFuZ2VzIGVmZmVjdGl2ZVxuICAgICAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2Ugd2F0Y2hlcnMgYW5kIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZyb20gd2F0Y2hlZCBwYXRocy5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Nsb3NlUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlUHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgICAgIC8vIE1lbW9yeSBtYW5hZ2VtZW50LlxuICAgICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICBjb25zdCBjbG9zZXJzID0gW107XG4gICAgICAgIHRoaXMuX2Nsb3NlcnMuZm9yRWFjaCgoY2xvc2VyTGlzdCkgPT4gY2xvc2VyTGlzdC5mb3JFYWNoKChjbG9zZXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb21pc2UgPSBjbG9zZXIoKTtcbiAgICAgICAgICAgIGlmIChwcm9taXNlIGluc3RhbmNlb2YgUHJvbWlzZSlcbiAgICAgICAgICAgICAgICBjbG9zZXJzLnB1c2gocHJvbWlzZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcy5mb3JFYWNoKChzdHJlYW0pID0+IHN0cmVhbS5kZXN0cm95KCkpO1xuICAgICAgICB0aGlzLl91c2VySWdub3JlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fcmVhZHlDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3JlYWR5RW1pdHRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl93YXRjaGVkLmZvckVhY2goKGRpcmVudCkgPT4gZGlyZW50LmRpc3Bvc2UoKSk7XG4gICAgICAgIHRoaXMuX2Nsb3NlcnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fd2F0Y2hlZC5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zdHJlYW1zLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3N5bWxpbmtQYXRocy5jbGVhcigpO1xuICAgICAgICB0aGlzLl90aHJvdHRsZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fY2xvc2VQcm9taXNlID0gY2xvc2Vycy5sZW5ndGhcbiAgICAgICAgICAgID8gUHJvbWlzZS5hbGwoY2xvc2VycykudGhlbigoKSA9PiB1bmRlZmluZWQpXG4gICAgICAgICAgICA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICByZXR1cm4gdGhpcy5fY2xvc2VQcm9taXNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFeHBvc2UgbGlzdCBvZiB3YXRjaGVkIHBhdGhzXG4gICAgICogQHJldHVybnMgZm9yIGNoYWluaW5nXG4gICAgICovXG4gICAgZ2V0V2F0Y2hlZCgpIHtcbiAgICAgICAgY29uc3Qgd2F0Y2hMaXN0ID0ge307XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuZm9yRWFjaCgoZW50cnksIGRpcikgPT4ge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gdGhpcy5vcHRpb25zLmN3ZCA/IHN5c1BhdGgucmVsYXRpdmUodGhpcy5vcHRpb25zLmN3ZCwgZGlyKSA6IGRpcjtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0ga2V5IHx8IE9ORV9ET1Q7XG4gICAgICAgICAgICB3YXRjaExpc3RbaW5kZXhdID0gZW50cnkuZ2V0Q2hpbGRyZW4oKS5zb3J0KCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gd2F0Y2hMaXN0O1xuICAgIH1cbiAgICBlbWl0V2l0aEFsbChldmVudCwgYXJncykge1xuICAgICAgICB0aGlzLmVtaXQoZXZlbnQsIC4uLmFyZ3MpO1xuICAgICAgICBpZiAoZXZlbnQgIT09IEVWLkVSUk9SKVxuICAgICAgICAgICAgdGhpcy5lbWl0KEVWLkFMTCwgZXZlbnQsIC4uLmFyZ3MpO1xuICAgIH1cbiAgICAvLyBDb21tb24gaGVscGVyc1xuICAgIC8vIC0tLS0tLS0tLS0tLS0tXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplIGFuZCBlbWl0IGV2ZW50cy5cbiAgICAgKiBDYWxsaW5nIF9lbWl0IERPRVMgTk9UIE1FQU4gZW1pdCgpIHdvdWxkIGJlIGNhbGxlZCFcbiAgICAgKiBAcGFyYW0gZXZlbnQgVHlwZSBvZiBldmVudFxuICAgICAqIEBwYXJhbSBwYXRoIEZpbGUgb3IgZGlyZWN0b3J5IHBhdGhcbiAgICAgKiBAcGFyYW0gc3RhdHMgYXJndW1lbnRzIHRvIGJlIHBhc3NlZCB3aXRoIGV2ZW50XG4gICAgICogQHJldHVybnMgdGhlIGVycm9yIGlmIGRlZmluZWQsIG90aGVyd2lzZSB0aGUgdmFsdWUgb2YgdGhlIEZTV2F0Y2hlciBpbnN0YW5jZSdzIGBjbG9zZWRgIGZsYWdcbiAgICAgKi9cbiAgICBhc3luYyBfZW1pdChldmVudCwgcGF0aCwgc3RhdHMpIHtcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvcHRzID0gdGhpcy5vcHRpb25zO1xuICAgICAgICBpZiAoaXNXaW5kb3dzKVxuICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGgubm9ybWFsaXplKHBhdGgpO1xuICAgICAgICBpZiAob3B0cy5jd2QpXG4gICAgICAgICAgICBwYXRoID0gc3lzUGF0aC5yZWxhdGl2ZShvcHRzLmN3ZCwgcGF0aCk7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBbcGF0aF07XG4gICAgICAgIGlmIChzdGF0cyAhPSBudWxsKVxuICAgICAgICAgICAgYXJncy5wdXNoKHN0YXRzKTtcbiAgICAgICAgY29uc3QgYXdmID0gb3B0cy5hd2FpdFdyaXRlRmluaXNoO1xuICAgICAgICBsZXQgcHc7XG4gICAgICAgIGlmIChhd2YgJiYgKHB3ID0gdGhpcy5fcGVuZGluZ1dyaXRlcy5nZXQocGF0aCkpKSB7XG4gICAgICAgICAgICBwdy5sYXN0Q2hhbmdlID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLmF0b21pYykge1xuICAgICAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5VTkxJTkspIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nVW5saW5rcy5zZXQocGF0aCwgW2V2ZW50LCAuLi5hcmdzXSk7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmZvckVhY2goKGVudHJ5LCBwYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXQoLi4uZW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KEVWLkFMTCwgLi4uZW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1VubGlua3MuZGVsZXRlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LCB0eXBlb2Ygb3B0cy5hdG9taWMgPT09ICdudW1iZXInID8gb3B0cy5hdG9taWMgOiAxMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5BREQgJiYgdGhpcy5fcGVuZGluZ1VubGlua3MuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQgPSBFVi5DSEFOR0U7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1VubGlua3MuZGVsZXRlKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhd2YgJiYgKGV2ZW50ID09PSBFVi5BREQgfHwgZXZlbnQgPT09IEVWLkNIQU5HRSkgJiYgdGhpcy5fcmVhZHlFbWl0dGVkKSB7XG4gICAgICAgICAgICBjb25zdCBhd2ZFbWl0ID0gKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50ID0gRVYuRVJST1I7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3NbMF0gPSBlcnI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFdpdGhBbGwoZXZlbnQsIGFyZ3MpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdGF0cykge1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBzdGF0cyBkb2Vzbid0IGV4aXN0IHRoZSBmaWxlIG11c3QgaGF2ZSBiZWVuIGRlbGV0ZWRcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJnc1sxXSA9IHN0YXRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKHN0YXRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRXaXRoQWxsKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5fYXdhaXRXcml0ZUZpbmlzaChwYXRoLCBhd2Yuc3RhYmlsaXR5VGhyZXNob2xkLCBldmVudCwgYXdmRW1pdCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQgPT09IEVWLkNIQU5HRSkge1xuICAgICAgICAgICAgY29uc3QgaXNUaHJvdHRsZWQgPSAhdGhpcy5fdGhyb3R0bGUoRVYuQ0hBTkdFLCBwYXRoLCA1MCk7XG4gICAgICAgICAgICBpZiAoaXNUaHJvdHRsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdHMuYWx3YXlzU3RhdCAmJlxuICAgICAgICAgICAgc3RhdHMgPT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgKGV2ZW50ID09PSBFVi5BREQgfHwgZXZlbnQgPT09IEVWLkFERF9ESVIgfHwgZXZlbnQgPT09IEVWLkNIQU5HRSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gb3B0cy5jd2QgPyBzeXNQYXRoLmpvaW4ob3B0cy5jd2QsIHBhdGgpIDogcGF0aDtcbiAgICAgICAgICAgIGxldCBzdGF0cztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgc3RhdHMgPSBhd2FpdCBzdGF0KGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBTdXBwcmVzcyBldmVudCB3aGVuIGZzX3N0YXQgZmFpbHMsIHRvIGF2b2lkIHNlbmRpbmcgdW5kZWZpbmVkICdzdGF0J1xuICAgICAgICAgICAgaWYgKCFzdGF0cyB8fCB0aGlzLmNsb3NlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBhcmdzLnB1c2goc3RhdHMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZW1pdFdpdGhBbGwoZXZlbnQsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ29tbW9uIGhhbmRsZXIgZm9yIGVycm9yc1xuICAgICAqIEByZXR1cm5zIFRoZSBlcnJvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIHZhbHVlIG9mIHRoZSBGU1dhdGNoZXIgaW5zdGFuY2UncyBgY2xvc2VkYCBmbGFnXG4gICAgICovXG4gICAgX2hhbmRsZUVycm9yKGVycm9yKSB7XG4gICAgICAgIGNvbnN0IGNvZGUgPSBlcnJvciAmJiBlcnJvci5jb2RlO1xuICAgICAgICBpZiAoZXJyb3IgJiZcbiAgICAgICAgICAgIGNvZGUgIT09ICdFTk9FTlQnICYmXG4gICAgICAgICAgICBjb2RlICE9PSAnRU5PVERJUicgJiZcbiAgICAgICAgICAgICghdGhpcy5vcHRpb25zLmlnbm9yZVBlcm1pc3Npb25FcnJvcnMgfHwgKGNvZGUgIT09ICdFUEVSTScgJiYgY29kZSAhPT0gJ0VBQ0NFUycpKSkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KEVWLkVSUk9SLCBlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVycm9yIHx8IHRoaXMuY2xvc2VkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgdXRpbGl0eSBmb3IgdGhyb3R0bGluZ1xuICAgICAqIEBwYXJhbSBhY3Rpb25UeXBlIHR5cGUgYmVpbmcgdGhyb3R0bGVkXG4gICAgICogQHBhcmFtIHBhdGggYmVpbmcgYWN0ZWQgdXBvblxuICAgICAqIEBwYXJhbSB0aW1lb3V0IGR1cmF0aW9uIG9mIHRpbWUgdG8gc3VwcHJlc3MgZHVwbGljYXRlIGFjdGlvbnNcbiAgICAgKiBAcmV0dXJucyB0cmFja2luZyBvYmplY3Qgb3IgZmFsc2UgaWYgYWN0aW9uIHNob3VsZCBiZSBzdXBwcmVzc2VkXG4gICAgICovXG4gICAgX3Rocm90dGxlKGFjdGlvblR5cGUsIHBhdGgsIHRpbWVvdXQpIHtcbiAgICAgICAgaWYgKCF0aGlzLl90aHJvdHRsZWQuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgICAgICB0aGlzLl90aHJvdHRsZWQuc2V0KGFjdGlvblR5cGUsIG5ldyBNYXAoKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYWN0aW9uID0gdGhpcy5fdGhyb3R0bGVkLmdldChhY3Rpb25UeXBlKTtcbiAgICAgICAgaWYgKCFhY3Rpb24pXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgdGhyb3R0bGUnKTtcbiAgICAgICAgY29uc3QgYWN0aW9uUGF0aCA9IGFjdGlvbi5nZXQocGF0aCk7XG4gICAgICAgIGlmIChhY3Rpb25QYXRoKSB7XG4gICAgICAgICAgICBhY3Rpb25QYXRoLmNvdW50Kys7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHByZWZlci1jb25zdFxuICAgICAgICBsZXQgdGltZW91dE9iamVjdDtcbiAgICAgICAgY29uc3QgY2xlYXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gYWN0aW9uLmdldChwYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IGNvdW50ID0gaXRlbSA/IGl0ZW0uY291bnQgOiAwO1xuICAgICAgICAgICAgYWN0aW9uLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0T2JqZWN0KTtcbiAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChpdGVtLnRpbWVvdXRPYmplY3QpO1xuICAgICAgICAgICAgcmV0dXJuIGNvdW50O1xuICAgICAgICB9O1xuICAgICAgICB0aW1lb3V0T2JqZWN0ID0gc2V0VGltZW91dChjbGVhciwgdGltZW91dCk7XG4gICAgICAgIGNvbnN0IHRociA9IHsgdGltZW91dE9iamVjdCwgY2xlYXIsIGNvdW50OiAwIH07XG4gICAgICAgIGFjdGlvbi5zZXQocGF0aCwgdGhyKTtcbiAgICAgICAgcmV0dXJuIHRocjtcbiAgICB9XG4gICAgX2luY3JSZWFkeUNvdW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fcmVhZHlDb3VudCsrO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBd2FpdHMgd3JpdGUgb3BlcmF0aW9uIHRvIGZpbmlzaC5cbiAgICAgKiBQb2xscyBhIG5ld2x5IGNyZWF0ZWQgZmlsZSBmb3Igc2l6ZSB2YXJpYXRpb25zLiBXaGVuIGZpbGVzIHNpemUgZG9lcyBub3QgY2hhbmdlIGZvciAndGhyZXNob2xkJyBtaWxsaXNlY29uZHMgY2FsbHMgY2FsbGJhY2suXG4gICAgICogQHBhcmFtIHBhdGggYmVpbmcgYWN0ZWQgdXBvblxuICAgICAqIEBwYXJhbSB0aHJlc2hvbGQgVGltZSBpbiBtaWxsaXNlY29uZHMgYSBmaWxlIHNpemUgbXVzdCBiZSBmaXhlZCBiZWZvcmUgYWNrbm93bGVkZ2luZyB3cml0ZSBPUCBpcyBmaW5pc2hlZFxuICAgICAqIEBwYXJhbSBldmVudFxuICAgICAqIEBwYXJhbSBhd2ZFbWl0IENhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIHJlYWR5IGZvciBldmVudCB0byBiZSBlbWl0dGVkLlxuICAgICAqL1xuICAgIF9hd2FpdFdyaXRlRmluaXNoKHBhdGgsIHRocmVzaG9sZCwgZXZlbnQsIGF3ZkVtaXQpIHtcbiAgICAgICAgY29uc3QgYXdmID0gdGhpcy5vcHRpb25zLmF3YWl0V3JpdGVGaW5pc2g7XG4gICAgICAgIGlmICh0eXBlb2YgYXdmICE9PSAnb2JqZWN0JylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcG9sbEludGVydmFsID0gYXdmLnBvbGxJbnRlcnZhbDtcbiAgICAgICAgbGV0IHRpbWVvdXRIYW5kbGVyO1xuICAgICAgICBsZXQgZnVsbFBhdGggPSBwYXRoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmN3ZCAmJiAhc3lzUGF0aC5pc0Fic29sdXRlKHBhdGgpKSB7XG4gICAgICAgICAgICBmdWxsUGF0aCA9IHN5c1BhdGguam9pbih0aGlzLm9wdGlvbnMuY3dkLCBwYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBjb25zdCB3cml0ZXMgPSB0aGlzLl9wZW5kaW5nV3JpdGVzO1xuICAgICAgICBmdW5jdGlvbiBhd2FpdFdyaXRlRmluaXNoRm4ocHJldlN0YXQpIHtcbiAgICAgICAgICAgIHN0YXRjYihmdWxsUGF0aCwgKGVyciwgY3VyU3RhdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnIgfHwgIXdyaXRlcy5oYXMocGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciAmJiBlcnIuY29kZSAhPT0gJ0VOT0VOVCcpXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2ZFbWl0KGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3Qgbm93ID0gTnVtYmVyKG5ldyBEYXRlKCkpO1xuICAgICAgICAgICAgICAgIGlmIChwcmV2U3RhdCAmJiBjdXJTdGF0LnNpemUgIT09IHByZXZTdGF0LnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVzLmdldChwYXRoKS5sYXN0Q2hhbmdlID0gbm93O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBwdyA9IHdyaXRlcy5nZXQocGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZGYgPSBub3cgLSBwdy5sYXN0Q2hhbmdlO1xuICAgICAgICAgICAgICAgIGlmIChkZiA+PSB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgd3JpdGVzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgYXdmRW1pdCh1bmRlZmluZWQsIGN1clN0YXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dEhhbmRsZXIgPSBzZXRUaW1lb3V0KGF3YWl0V3JpdGVGaW5pc2hGbiwgcG9sbEludGVydmFsLCBjdXJTdGF0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdyaXRlcy5oYXMocGF0aCkpIHtcbiAgICAgICAgICAgIHdyaXRlcy5zZXQocGF0aCwge1xuICAgICAgICAgICAgICAgIGxhc3RDaGFuZ2U6IG5vdyxcbiAgICAgICAgICAgICAgICBjYW5jZWxXYWl0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlcy5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBldmVudDtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aW1lb3V0SGFuZGxlciA9IHNldFRpbWVvdXQoYXdhaXRXcml0ZUZpbmlzaEZuLCBwb2xsSW50ZXJ2YWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERldGVybWluZXMgd2hldGhlciB1c2VyIGhhcyBhc2tlZCB0byBpZ25vcmUgdGhpcyBwYXRoLlxuICAgICAqL1xuICAgIF9pc0lnbm9yZWQocGF0aCwgc3RhdHMpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5hdG9taWMgJiYgRE9UX1JFLnRlc3QocGF0aCkpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLl91c2VySWdub3JlZCkge1xuICAgICAgICAgICAgY29uc3QgeyBjd2QgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgICAgIGNvbnN0IGlnbiA9IHRoaXMub3B0aW9ucy5pZ25vcmVkO1xuICAgICAgICAgICAgY29uc3QgaWdub3JlZCA9IChpZ24gfHwgW10pLm1hcChub3JtYWxpemVJZ25vcmVkKGN3ZCkpO1xuICAgICAgICAgICAgY29uc3QgaWdub3JlZFBhdGhzID0gWy4uLnRoaXMuX2lnbm9yZWRQYXRoc107XG4gICAgICAgICAgICBjb25zdCBsaXN0ID0gWy4uLmlnbm9yZWRQYXRocy5tYXAobm9ybWFsaXplSWdub3JlZChjd2QpKSwgLi4uaWdub3JlZF07XG4gICAgICAgICAgICB0aGlzLl91c2VySWdub3JlZCA9IGFueW1hdGNoKGxpc3QsIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3VzZXJJZ25vcmVkKHBhdGgsIHN0YXRzKTtcbiAgICB9XG4gICAgX2lzbnRJZ25vcmVkKHBhdGgsIHN0YXQpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLl9pc0lnbm9yZWQocGF0aCwgc3RhdCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGEgc2V0IG9mIGNvbW1vbiBoZWxwZXJzIGFuZCBwcm9wZXJ0aWVzIHJlbGF0aW5nIHRvIHN5bWxpbmsgaGFuZGxpbmcuXG4gICAgICogQHBhcmFtIHBhdGggZmlsZSBvciBkaXJlY3RvcnkgcGF0dGVybiBiZWluZyB3YXRjaGVkXG4gICAgICovXG4gICAgX2dldFdhdGNoSGVscGVycyhwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgV2F0Y2hIZWxwZXIocGF0aCwgdGhpcy5vcHRpb25zLmZvbGxvd1N5bWxpbmtzLCB0aGlzKTtcbiAgICB9XG4gICAgLy8gRGlyZWN0b3J5IGhlbHBlcnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLVxuICAgIC8qKlxuICAgICAqIFByb3ZpZGVzIGRpcmVjdG9yeSB0cmFja2luZyBvYmplY3RzXG4gICAgICogQHBhcmFtIGRpcmVjdG9yeSBwYXRoIG9mIHRoZSBkaXJlY3RvcnlcbiAgICAgKi9cbiAgICBfZ2V0V2F0Y2hlZERpcihkaXJlY3RvcnkpIHtcbiAgICAgICAgY29uc3QgZGlyID0gc3lzUGF0aC5yZXNvbHZlKGRpcmVjdG9yeSk7XG4gICAgICAgIGlmICghdGhpcy5fd2F0Y2hlZC5oYXMoZGlyKSlcbiAgICAgICAgICAgIHRoaXMuX3dhdGNoZWQuc2V0KGRpciwgbmV3IERpckVudHJ5KGRpciwgdGhpcy5fYm91bmRSZW1vdmUpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3dhdGNoZWQuZ2V0KGRpcik7XG4gICAgfVxuICAgIC8vIEZpbGUgaGVscGVyc1xuICAgIC8vIC0tLS0tLS0tLS0tLVxuICAgIC8qKlxuICAgICAqIENoZWNrIGZvciByZWFkIHBlcm1pc3Npb25zOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMTE3ODE0MDQvMTM1ODQwNVxuICAgICAqL1xuICAgIF9oYXNSZWFkUGVybWlzc2lvbnMoc3RhdHMpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVQZXJtaXNzaW9uRXJyb3JzKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybiBCb29sZWFuKE51bWJlcihzdGF0cy5tb2RlKSAmIDBvNDAwKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlcyBlbWl0dGluZyB1bmxpbmsgZXZlbnRzIGZvclxuICAgICAqIGZpbGVzIGFuZCBkaXJlY3RvcmllcywgYW5kIHZpYSByZWN1cnNpb24sIGZvclxuICAgICAqIGZpbGVzIGFuZCBkaXJlY3RvcmllcyB3aXRoaW4gZGlyZWN0b3JpZXMgdGhhdCBhcmUgdW5saW5rZWRcbiAgICAgKiBAcGFyYW0gZGlyZWN0b3J5IHdpdGhpbiB3aGljaCB0aGUgZm9sbG93aW5nIGl0ZW0gaXMgbG9jYXRlZFxuICAgICAqIEBwYXJhbSBpdGVtICAgICAgYmFzZSBwYXRoIG9mIGl0ZW0vZGlyZWN0b3J5XG4gICAgICovXG4gICAgX3JlbW92ZShkaXJlY3RvcnksIGl0ZW0sIGlzRGlyZWN0b3J5KSB7XG4gICAgICAgIC8vIGlmIHdoYXQgaXMgYmVpbmcgZGVsZXRlZCBpcyBhIGRpcmVjdG9yeSwgZ2V0IHRoYXQgZGlyZWN0b3J5J3MgcGF0aHNcbiAgICAgICAgLy8gZm9yIHJlY3Vyc2l2ZSBkZWxldGluZyBhbmQgY2xlYW5pbmcgb2Ygd2F0Y2hlZCBvYmplY3RcbiAgICAgICAgLy8gaWYgaXQgaXMgbm90IGEgZGlyZWN0b3J5LCBuZXN0ZWREaXJlY3RvcnlDaGlsZHJlbiB3aWxsIGJlIGVtcHR5IGFycmF5XG4gICAgICAgIGNvbnN0IHBhdGggPSBzeXNQYXRoLmpvaW4oZGlyZWN0b3J5LCBpdGVtKTtcbiAgICAgICAgY29uc3QgZnVsbFBhdGggPSBzeXNQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgIGlzRGlyZWN0b3J5ID1cbiAgICAgICAgICAgIGlzRGlyZWN0b3J5ICE9IG51bGwgPyBpc0RpcmVjdG9yeSA6IHRoaXMuX3dhdGNoZWQuaGFzKHBhdGgpIHx8IHRoaXMuX3dhdGNoZWQuaGFzKGZ1bGxQYXRoKTtcbiAgICAgICAgLy8gcHJldmVudCBkdXBsaWNhdGUgaGFuZGxpbmcgaW4gY2FzZSBvZiBhcnJpdmluZyBoZXJlIG5lYXJseSBzaW11bHRhbmVvdXNseVxuICAgICAgICAvLyB2aWEgbXVsdGlwbGUgcGF0aHMgKHN1Y2ggYXMgX2hhbmRsZUZpbGUgYW5kIF9oYW5kbGVEaXIpXG4gICAgICAgIGlmICghdGhpcy5fdGhyb3R0bGUoJ3JlbW92ZScsIHBhdGgsIDEwMCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIC8vIGlmIHRoZSBvbmx5IHdhdGNoZWQgZmlsZSBpcyByZW1vdmVkLCB3YXRjaCBmb3IgaXRzIHJldHVyblxuICAgICAgICBpZiAoIWlzRGlyZWN0b3J5ICYmIHRoaXMuX3dhdGNoZWQuc2l6ZSA9PT0gMSkge1xuICAgICAgICAgICAgdGhpcy5hZGQoZGlyZWN0b3J5LCBpdGVtLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdpbGwgY3JlYXRlIGEgbmV3IGVudHJ5IGluIHRoZSB3YXRjaGVkIG9iamVjdCBpbiBlaXRoZXIgY2FzZVxuICAgICAgICAvLyBzbyB3ZSBnb3QgdG8gZG8gdGhlIGRpcmVjdG9yeSBjaGVjayBiZWZvcmVoYW5kXG4gICAgICAgIGNvbnN0IHdwID0gdGhpcy5fZ2V0V2F0Y2hlZERpcihwYXRoKTtcbiAgICAgICAgY29uc3QgbmVzdGVkRGlyZWN0b3J5Q2hpbGRyZW4gPSB3cC5nZXRDaGlsZHJlbigpO1xuICAgICAgICAvLyBSZWN1cnNpdmVseSByZW1vdmUgY2hpbGRyZW4gZGlyZWN0b3JpZXMgLyBmaWxlcy5cbiAgICAgICAgbmVzdGVkRGlyZWN0b3J5Q2hpbGRyZW4uZm9yRWFjaCgobmVzdGVkKSA9PiB0aGlzLl9yZW1vdmUocGF0aCwgbmVzdGVkKSk7XG4gICAgICAgIC8vIENoZWNrIGlmIGl0ZW0gd2FzIG9uIHRoZSB3YXRjaGVkIGxpc3QgYW5kIHJlbW92ZSBpdFxuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLl9nZXRXYXRjaGVkRGlyKGRpcmVjdG9yeSk7XG4gICAgICAgIGNvbnN0IHdhc1RyYWNrZWQgPSBwYXJlbnQuaGFzKGl0ZW0pO1xuICAgICAgICBwYXJlbnQucmVtb3ZlKGl0ZW0pO1xuICAgICAgICAvLyBGaXhlcyBpc3N1ZSAjMTA0MiAtPiBSZWxhdGl2ZSBwYXRocyB3ZXJlIGRldGVjdGVkIGFuZCBhZGRlZCBhcyBzeW1saW5rc1xuICAgICAgICAvLyAoaHR0cHM6Ly9naXRodWIuY29tL3BhdWxtaWxsci9jaG9raWRhci9ibG9iL2UxNzUzZGRiYzk1NzFiZGMzM2I0YTRhZjE3MmQ1MmNiNmU2MTFjMTAvbGliL25vZGVmcy1oYW5kbGVyLmpzI0w2MTIpLFxuICAgICAgICAvLyBidXQgbmV2ZXIgcmVtb3ZlZCBmcm9tIHRoZSBtYXAgaW4gY2FzZSB0aGUgcGF0aCB3YXMgZGVsZXRlZC5cbiAgICAgICAgLy8gVGhpcyBsZWFkcyB0byBhbiBpbmNvcnJlY3Qgc3RhdGUgaWYgdGhlIHBhdGggd2FzIHJlY3JlYXRlZDpcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3BhdWxtaWxsci9jaG9raWRhci9ibG9iL2UxNzUzZGRiYzk1NzFiZGMzM2I0YTRhZjE3MmQ1MmNiNmU2MTFjMTAvbGliL25vZGVmcy1oYW5kbGVyLmpzI0w1NTNcbiAgICAgICAgaWYgKHRoaXMuX3N5bWxpbmtQYXRocy5oYXMoZnVsbFBhdGgpKSB7XG4gICAgICAgICAgICB0aGlzLl9zeW1saW5rUGF0aHMuZGVsZXRlKGZ1bGxQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiB3ZSB3YWl0IGZvciB0aGlzIGZpbGUgdG8gYmUgZnVsbHkgd3JpdHRlbiwgY2FuY2VsIHRoZSB3YWl0LlxuICAgICAgICBsZXQgcmVsUGF0aCA9IHBhdGg7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY3dkKVxuICAgICAgICAgICAgcmVsUGF0aCA9IHN5c1BhdGgucmVsYXRpdmUodGhpcy5vcHRpb25zLmN3ZCwgcGF0aCk7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXdhaXRXcml0ZUZpbmlzaCAmJiB0aGlzLl9wZW5kaW5nV3JpdGVzLmhhcyhyZWxQYXRoKSkge1xuICAgICAgICAgICAgY29uc3QgZXZlbnQgPSB0aGlzLl9wZW5kaW5nV3JpdGVzLmdldChyZWxQYXRoKS5jYW5jZWxXYWl0KCk7XG4gICAgICAgICAgICBpZiAoZXZlbnQgPT09IEVWLkFERClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhlIEVudHJ5IHdpbGwgZWl0aGVyIGJlIGEgZGlyZWN0b3J5IHRoYXQganVzdCBnb3QgcmVtb3ZlZFxuICAgICAgICAvLyBvciBhIGJvZ3VzIGVudHJ5IHRvIGEgZmlsZSwgaW4gZWl0aGVyIGNhc2Ugd2UgaGF2ZSB0byByZW1vdmUgaXRcbiAgICAgICAgdGhpcy5fd2F0Y2hlZC5kZWxldGUocGF0aCk7XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuZGVsZXRlKGZ1bGxQYXRoKTtcbiAgICAgICAgY29uc3QgZXZlbnROYW1lID0gaXNEaXJlY3RvcnkgPyBFVi5VTkxJTktfRElSIDogRVYuVU5MSU5LO1xuICAgICAgICBpZiAod2FzVHJhY2tlZCAmJiAhdGhpcy5faXNJZ25vcmVkKHBhdGgpKVxuICAgICAgICAgICAgdGhpcy5fZW1pdChldmVudE5hbWUsIHBhdGgpO1xuICAgICAgICAvLyBBdm9pZCBjb25mbGljdHMgaWYgd2UgbGF0ZXIgY3JlYXRlIGFub3RoZXIgZmlsZSB3aXRoIHRoZSBzYW1lIG5hbWVcbiAgICAgICAgdGhpcy5fY2xvc2VQYXRoKHBhdGgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgYWxsIHdhdGNoZXJzIGZvciBhIHBhdGhcbiAgICAgKi9cbiAgICBfY2xvc2VQYXRoKHBhdGgpIHtcbiAgICAgICAgdGhpcy5fY2xvc2VGaWxlKHBhdGgpO1xuICAgICAgICBjb25zdCBkaXIgPSBzeXNQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICAgIHRoaXMuX2dldFdhdGNoZWREaXIoZGlyKS5yZW1vdmUoc3lzUGF0aC5iYXNlbmFtZShwYXRoKSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlcyBvbmx5IGZpbGUtc3BlY2lmaWMgd2F0Y2hlcnNcbiAgICAgKi9cbiAgICBfY2xvc2VGaWxlKHBhdGgpIHtcbiAgICAgICAgY29uc3QgY2xvc2VycyA9IHRoaXMuX2Nsb3NlcnMuZ2V0KHBhdGgpO1xuICAgICAgICBpZiAoIWNsb3NlcnMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNsb3NlcnMuZm9yRWFjaCgoY2xvc2VyKSA9PiBjbG9zZXIoKSk7XG4gICAgICAgIHRoaXMuX2Nsb3NlcnMuZGVsZXRlKHBhdGgpO1xuICAgIH1cbiAgICBfYWRkUGF0aENsb3NlcihwYXRoLCBjbG9zZXIpIHtcbiAgICAgICAgaWYgKCFjbG9zZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBsaXN0ID0gdGhpcy5fY2xvc2Vycy5nZXQocGF0aCk7XG4gICAgICAgIGlmICghbGlzdCkge1xuICAgICAgICAgICAgbGlzdCA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fY2xvc2Vycy5zZXQocGF0aCwgbGlzdCk7XG4gICAgICAgIH1cbiAgICAgICAgbGlzdC5wdXNoKGNsb3Nlcik7XG4gICAgfVxuICAgIF9yZWFkZGlycChyb290LCBvcHRzKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgdHlwZTogRVYuQUxMLCBhbHdheXNTdGF0OiB0cnVlLCBsc3RhdDogdHJ1ZSwgLi4ub3B0cywgZGVwdGg6IDAgfTtcbiAgICAgICAgbGV0IHN0cmVhbSA9IHJlYWRkaXJwKHJvb3QsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLl9zdHJlYW1zLmFkZChzdHJlYW0pO1xuICAgICAgICBzdHJlYW0ub25jZShTVFJfQ0xPU0UsICgpID0+IHtcbiAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfSk7XG4gICAgICAgIHN0cmVhbS5vbmNlKFNUUl9FTkQsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdHJlYW1zLmRlbGV0ZShzdHJlYW0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBzdHJlYW07XG4gICAgfVxufVxuLyoqXG4gKiBJbnN0YW50aWF0ZXMgd2F0Y2hlciB3aXRoIHBhdGhzIHRvIGJlIHRyYWNrZWQuXG4gKiBAcGFyYW0gcGF0aHMgZmlsZSAvIGRpcmVjdG9yeSBwYXRoc1xuICogQHBhcmFtIG9wdGlvbnMgb3B0cywgc3VjaCBhcyBgYXRvbWljYCwgYGF3YWl0V3JpdGVGaW5pc2hgLCBgaWdub3JlZGAsIGFuZCBvdGhlcnNcbiAqIEByZXR1cm5zIGFuIGluc3RhbmNlIG9mIEZTV2F0Y2hlciBmb3IgY2hhaW5pbmcuXG4gKiBAZXhhbXBsZVxuICogY29uc3Qgd2F0Y2hlciA9IHdhdGNoKCcuJykub24oJ2FsbCcsIChldmVudCwgcGF0aCkgPT4geyBjb25zb2xlLmxvZyhldmVudCwgcGF0aCk7IH0pO1xuICogd2F0Y2goJy4nLCB7IGF0b21pYzogdHJ1ZSwgYXdhaXRXcml0ZUZpbmlzaDogdHJ1ZSwgaWdub3JlZDogKGYsIHN0YXRzKSA9PiBzdGF0cz8uaXNGaWxlKCkgJiYgIWYuZW5kc1dpdGgoJy5qcycpIH0pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YXRjaChwYXRocywgb3B0aW9ucyA9IHt9KSB7XG4gICAgY29uc3Qgd2F0Y2hlciA9IG5ldyBGU1dhdGNoZXIob3B0aW9ucyk7XG4gICAgd2F0Y2hlci5hZGQocGF0aHMpO1xuICAgIHJldHVybiB3YXRjaGVyO1xufVxuZXhwb3J0IGRlZmF1bHQgeyB3YXRjaCwgRlNXYXRjaGVyIH07XG4iLCAiaW1wb3J0IHsgc3RhdCwgbHN0YXQsIHJlYWRkaXIsIHJlYWxwYXRoIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcyc7XG5pbXBvcnQgeyBSZWFkYWJsZSB9IGZyb20gJ25vZGU6c3RyZWFtJztcbmltcG9ydCB7IHJlc29sdmUgYXMgcHJlc29sdmUsIHJlbGF0aXZlIGFzIHByZWxhdGl2ZSwgam9pbiBhcyBwam9pbiwgc2VwIGFzIHBzZXAgfSBmcm9tICdub2RlOnBhdGgnO1xuZXhwb3J0IGNvbnN0IEVudHJ5VHlwZXMgPSB7XG4gICAgRklMRV9UWVBFOiAnZmlsZXMnLFxuICAgIERJUl9UWVBFOiAnZGlyZWN0b3JpZXMnLFxuICAgIEZJTEVfRElSX1RZUEU6ICdmaWxlc19kaXJlY3RvcmllcycsXG4gICAgRVZFUllUSElOR19UWVBFOiAnYWxsJyxcbn07XG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICByb290OiAnLicsXG4gICAgZmlsZUZpbHRlcjogKF9lbnRyeUluZm8pID0+IHRydWUsXG4gICAgZGlyZWN0b3J5RmlsdGVyOiAoX2VudHJ5SW5mbykgPT4gdHJ1ZSxcbiAgICB0eXBlOiBFbnRyeVR5cGVzLkZJTEVfVFlQRSxcbiAgICBsc3RhdDogZmFsc2UsXG4gICAgZGVwdGg6IDIxNDc0ODM2NDgsXG4gICAgYWx3YXlzU3RhdDogZmFsc2UsXG4gICAgaGlnaFdhdGVyTWFyazogNDA5Nixcbn07XG5PYmplY3QuZnJlZXplKGRlZmF1bHRPcHRpb25zKTtcbmNvbnN0IFJFQ1VSU0lWRV9FUlJPUl9DT0RFID0gJ1JFQURESVJQX1JFQ1VSU0lWRV9FUlJPUic7XG5jb25zdCBOT1JNQUxfRkxPV19FUlJPUlMgPSBuZXcgU2V0KFsnRU5PRU5UJywgJ0VQRVJNJywgJ0VBQ0NFUycsICdFTE9PUCcsIFJFQ1VSU0lWRV9FUlJPUl9DT0RFXSk7XG5jb25zdCBBTExfVFlQRVMgPSBbXG4gICAgRW50cnlUeXBlcy5ESVJfVFlQRSxcbiAgICBFbnRyeVR5cGVzLkVWRVJZVEhJTkdfVFlQRSxcbiAgICBFbnRyeVR5cGVzLkZJTEVfRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX1RZUEUsXG5dO1xuY29uc3QgRElSX1RZUEVTID0gbmV3IFNldChbXG4gICAgRW50cnlUeXBlcy5ESVJfVFlQRSxcbiAgICBFbnRyeVR5cGVzLkVWRVJZVEhJTkdfVFlQRSxcbiAgICBFbnRyeVR5cGVzLkZJTEVfRElSX1RZUEUsXG5dKTtcbmNvbnN0IEZJTEVfVFlQRVMgPSBuZXcgU2V0KFtcbiAgICBFbnRyeVR5cGVzLkVWRVJZVEhJTkdfVFlQRSxcbiAgICBFbnRyeVR5cGVzLkZJTEVfRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX1RZUEUsXG5dKTtcbmNvbnN0IGlzTm9ybWFsRmxvd0Vycm9yID0gKGVycm9yKSA9PiBOT1JNQUxfRkxPV19FUlJPUlMuaGFzKGVycm9yLmNvZGUpO1xuY29uc3Qgd2FudEJpZ2ludEZzU3RhdHMgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xuY29uc3QgZW1wdHlGbiA9IChfZW50cnlJbmZvKSA9PiB0cnVlO1xuY29uc3Qgbm9ybWFsaXplRmlsdGVyID0gKGZpbHRlcikgPT4ge1xuICAgIGlmIChmaWx0ZXIgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGVtcHR5Rm47XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdmdW5jdGlvbicpXG4gICAgICAgIHJldHVybiBmaWx0ZXI7XG4gICAgaWYgKHR5cGVvZiBmaWx0ZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGNvbnN0IGZsID0gZmlsdGVyLnRyaW0oKTtcbiAgICAgICAgcmV0dXJuIChlbnRyeSkgPT4gZW50cnkuYmFzZW5hbWUgPT09IGZsO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShmaWx0ZXIpKSB7XG4gICAgICAgIGNvbnN0IHRySXRlbXMgPSBmaWx0ZXIubWFwKChpdGVtKSA9PiBpdGVtLnRyaW0oKSk7XG4gICAgICAgIHJldHVybiAoZW50cnkpID0+IHRySXRlbXMuc29tZSgoZikgPT4gZW50cnkuYmFzZW5hbWUgPT09IGYpO1xuICAgIH1cbiAgICByZXR1cm4gZW1wdHlGbjtcbn07XG4vKiogUmVhZGFibGUgcmVhZGRpciBzdHJlYW0sIGVtaXR0aW5nIG5ldyBmaWxlcyBhcyB0aGV5J3JlIGJlaW5nIGxpc3RlZC4gKi9cbmV4cG9ydCBjbGFzcyBSZWFkZGlycFN0cmVhbSBleHRlbmRzIFJlYWRhYmxlIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zID0ge30pIHtcbiAgICAgICAgc3VwZXIoe1xuICAgICAgICAgICAgb2JqZWN0TW9kZTogdHJ1ZSxcbiAgICAgICAgICAgIGF1dG9EZXN0cm95OiB0cnVlLFxuICAgICAgICAgICAgaGlnaFdhdGVyTWFyazogb3B0aW9ucy5oaWdoV2F0ZXJNYXJrLFxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHsgLi4uZGVmYXVsdE9wdGlvbnMsIC4uLm9wdGlvbnMgfTtcbiAgICAgICAgY29uc3QgeyByb290LCB0eXBlIH0gPSBvcHRzO1xuICAgICAgICB0aGlzLl9maWxlRmlsdGVyID0gbm9ybWFsaXplRmlsdGVyKG9wdHMuZmlsZUZpbHRlcik7XG4gICAgICAgIHRoaXMuX2RpcmVjdG9yeUZpbHRlciA9IG5vcm1hbGl6ZUZpbHRlcihvcHRzLmRpcmVjdG9yeUZpbHRlcik7XG4gICAgICAgIGNvbnN0IHN0YXRNZXRob2QgPSBvcHRzLmxzdGF0ID8gbHN0YXQgOiBzdGF0O1xuICAgICAgICAvLyBVc2UgYmlnaW50IHN0YXRzIGlmIGl0J3Mgd2luZG93cyBhbmQgc3RhdCgpIHN1cHBvcnRzIG9wdGlvbnMgKG5vZGUgMTArKS5cbiAgICAgICAgaWYgKHdhbnRCaWdpbnRGc1N0YXRzKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ID0gKHBhdGgpID0+IHN0YXRNZXRob2QocGF0aCwgeyBiaWdpbnQ6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ID0gc3RhdE1ldGhvZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9tYXhEZXB0aCA9IG9wdHMuZGVwdGggPz8gZGVmYXVsdE9wdGlvbnMuZGVwdGg7XG4gICAgICAgIHRoaXMuX3dhbnRzRGlyID0gdHlwZSA/IERJUl9UWVBFUy5oYXModHlwZSkgOiBmYWxzZTtcbiAgICAgICAgdGhpcy5fd2FudHNGaWxlID0gdHlwZSA/IEZJTEVfVFlQRVMuaGFzKHR5cGUpIDogZmFsc2U7XG4gICAgICAgIHRoaXMuX3dhbnRzRXZlcnl0aGluZyA9IHR5cGUgPT09IEVudHJ5VHlwZXMuRVZFUllUSElOR19UWVBFO1xuICAgICAgICB0aGlzLl9yb290ID0gcHJlc29sdmUocm9vdCk7XG4gICAgICAgIHRoaXMuX2lzRGlyZW50ID0gIW9wdHMuYWx3YXlzU3RhdDtcbiAgICAgICAgdGhpcy5fc3RhdHNQcm9wID0gdGhpcy5faXNEaXJlbnQgPyAnZGlyZW50JyA6ICdzdGF0cyc7XG4gICAgICAgIHRoaXMuX3JkT3B0aW9ucyA9IHsgZW5jb2Rpbmc6ICd1dGY4Jywgd2l0aEZpbGVUeXBlczogdGhpcy5faXNEaXJlbnQgfTtcbiAgICAgICAgLy8gTGF1bmNoIHN0cmVhbSB3aXRoIG9uZSBwYXJlbnQsIHRoZSByb290IGRpci5cbiAgICAgICAgdGhpcy5wYXJlbnRzID0gW3RoaXMuX2V4cGxvcmVEaXIocm9vdCwgMSldO1xuICAgICAgICB0aGlzLnJlYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGFzeW5jIF9yZWFkKGJhdGNoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWRpbmcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMucmVhZGluZyA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB3aGlsZSAoIXRoaXMuZGVzdHJveWVkICYmIGJhdGNoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhciA9IHRoaXMucGFyZW50O1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbCA9IHBhciAmJiBwYXIuZmlsZXM7XG4gICAgICAgICAgICAgICAgaWYgKGZpbCAmJiBmaWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IHBhdGgsIGRlcHRoIH0gPSBwYXI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNsaWNlID0gZmlsLnNwbGljZSgwLCBiYXRjaCkubWFwKChkaXJlbnQpID0+IHRoaXMuX2Zvcm1hdEVudHJ5KGRpcmVudCwgcGF0aCkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhd2FpdGVkID0gYXdhaXQgUHJvbWlzZS5hbGwoc2xpY2UpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGF3YWl0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZW50cnkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZW50cnlUeXBlID0gYXdhaXQgdGhpcy5fZ2V0RW50cnlUeXBlKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbnRyeVR5cGUgPT09ICdkaXJlY3RvcnknICYmIHRoaXMuX2RpcmVjdG9yeUZpbHRlcihlbnRyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVwdGggPD0gdGhpcy5fbWF4RGVwdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRzLnB1c2godGhpcy5fZXhwbG9yZURpcihlbnRyeS5mdWxsUGF0aCwgZGVwdGggKyAxKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl93YW50c0Rpcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2goZW50cnkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXRjaC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKChlbnRyeVR5cGUgPT09ICdmaWxlJyB8fCB0aGlzLl9pbmNsdWRlQXNGaWxlKGVudHJ5KSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9maWxlRmlsdGVyKGVudHJ5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl93YW50c0ZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmF0Y2gtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50cy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gYXdhaXQgcGFyZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kZXN0cm95ZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95KGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMucmVhZGluZyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIF9leHBsb3JlRGlyKHBhdGgsIGRlcHRoKSB7XG4gICAgICAgIGxldCBmaWxlcztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGZpbGVzID0gYXdhaXQgcmVhZGRpcihwYXRoLCB0aGlzLl9yZE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdGhpcy5fb25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgZmlsZXMsIGRlcHRoLCBwYXRoIH07XG4gICAgfVxuICAgIGFzeW5jIF9mb3JtYXRFbnRyeShkaXJlbnQsIHBhdGgpIHtcbiAgICAgICAgbGV0IGVudHJ5O1xuICAgICAgICBjb25zdCBiYXNlbmFtZSA9IHRoaXMuX2lzRGlyZW50ID8gZGlyZW50Lm5hbWUgOiBkaXJlbnQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IHByZXNvbHZlKHBqb2luKHBhdGgsIGJhc2VuYW1lKSk7XG4gICAgICAgICAgICBlbnRyeSA9IHsgcGF0aDogcHJlbGF0aXZlKHRoaXMuX3Jvb3QsIGZ1bGxQYXRoKSwgZnVsbFBhdGgsIGJhc2VuYW1lIH07XG4gICAgICAgICAgICBlbnRyeVt0aGlzLl9zdGF0c1Byb3BdID0gdGhpcy5faXNEaXJlbnQgPyBkaXJlbnQgOiBhd2FpdCB0aGlzLl9zdGF0KGZ1bGxQYXRoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICB0aGlzLl9vbkVycm9yKGVycik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgIH1cbiAgICBfb25FcnJvcihlcnIpIHtcbiAgICAgICAgaWYgKGlzTm9ybWFsRmxvd0Vycm9yKGVycikgJiYgIXRoaXMuZGVzdHJveWVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXQoJ3dhcm4nLCBlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95KGVycik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXN5bmMgX2dldEVudHJ5VHlwZShlbnRyeSkge1xuICAgICAgICAvLyBlbnRyeSBtYXkgYmUgdW5kZWZpbmVkLCBiZWNhdXNlIGEgd2FybmluZyBvciBhbiBlcnJvciB3ZXJlIGVtaXR0ZWRcbiAgICAgICAgLy8gYW5kIHRoZSBzdGF0c1Byb3AgaXMgdW5kZWZpbmVkXG4gICAgICAgIGlmICghZW50cnkgJiYgdGhpcy5fc3RhdHNQcm9wIGluIGVudHJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc3RhdHMgPSBlbnRyeVt0aGlzLl9zdGF0c1Byb3BdO1xuICAgICAgICBpZiAoc3RhdHMuaXNGaWxlKCkpXG4gICAgICAgICAgICByZXR1cm4gJ2ZpbGUnO1xuICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSlcbiAgICAgICAgICAgIHJldHVybiAnZGlyZWN0b3J5JztcbiAgICAgICAgaWYgKHN0YXRzICYmIHN0YXRzLmlzU3ltYm9saWNMaW5rKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGwgPSBlbnRyeS5mdWxsUGF0aDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZW50cnlSZWFsUGF0aCA9IGF3YWl0IHJlYWxwYXRoKGZ1bGwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5UmVhbFBhdGhTdGF0cyA9IGF3YWl0IGxzdGF0KGVudHJ5UmVhbFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmIChlbnRyeVJlYWxQYXRoU3RhdHMuaXNGaWxlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdmaWxlJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGVudHJ5UmVhbFBhdGhTdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxlbiA9IGVudHJ5UmVhbFBhdGgubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZnVsbC5zdGFydHNXaXRoKGVudHJ5UmVhbFBhdGgpICYmIGZ1bGwuc3Vic3RyKGxlbiwgMSkgPT09IHBzZXApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlY3Vyc2l2ZUVycm9yID0gbmV3IEVycm9yKGBDaXJjdWxhciBzeW1saW5rIGRldGVjdGVkOiBcIiR7ZnVsbH1cIiBwb2ludHMgdG8gXCIke2VudHJ5UmVhbFBhdGh9XCJgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlY3Vyc2l2ZUVycm9yLmNvZGUgPSBSRUNVUlNJVkVfRVJST1JfQ09ERTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9vbkVycm9yKHJlY3Vyc2l2ZUVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ2RpcmVjdG9yeSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fb25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9pbmNsdWRlQXNGaWxlKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHN0YXRzID0gZW50cnkgJiYgZW50cnlbdGhpcy5fc3RhdHNQcm9wXTtcbiAgICAgICAgcmV0dXJuIHN0YXRzICYmIHRoaXMuX3dhbnRzRXZlcnl0aGluZyAmJiAhc3RhdHMuaXNEaXJlY3RvcnkoKTtcbiAgICB9XG59XG4vKipcbiAqIFN0cmVhbWluZyB2ZXJzaW9uOiBSZWFkcyBhbGwgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIGluIGdpdmVuIHJvb3QgcmVjdXJzaXZlbHkuXG4gKiBDb25zdW1lcyB+Y29uc3RhbnQgc21hbGwgYW1vdW50IG9mIFJBTS5cbiAqIEBwYXJhbSByb290IFJvb3QgZGlyZWN0b3J5XG4gKiBAcGFyYW0gb3B0aW9ucyBPcHRpb25zIHRvIHNwZWNpZnkgcm9vdCAoc3RhcnQgZGlyZWN0b3J5KSwgZmlsdGVycyBhbmQgcmVjdXJzaW9uIGRlcHRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkZGlycChyb290LCBvcHRpb25zID0ge30pIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgbGV0IHR5cGUgPSBvcHRpb25zLmVudHJ5VHlwZSB8fCBvcHRpb25zLnR5cGU7XG4gICAgaWYgKHR5cGUgPT09ICdib3RoJylcbiAgICAgICAgdHlwZSA9IEVudHJ5VHlwZXMuRklMRV9ESVJfVFlQRTsgLy8gYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICBpZiAodHlwZSlcbiAgICAgICAgb3B0aW9ucy50eXBlID0gdHlwZTtcbiAgICBpZiAoIXJvb3QpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZWFkZGlycDogcm9vdCBhcmd1bWVudCBpcyByZXF1aXJlZC4gVXNhZ2U6IHJlYWRkaXJwKHJvb3QsIG9wdGlvbnMpJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiByb290ICE9PSAnc3RyaW5nJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdyZWFkZGlycDogcm9vdCBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nLiBVc2FnZTogcmVhZGRpcnAocm9vdCwgb3B0aW9ucyknKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSAmJiAhQUxMX1RZUEVTLmluY2x1ZGVzKHR5cGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgcmVhZGRpcnA6IEludmFsaWQgdHlwZSBwYXNzZWQuIFVzZSBvbmUgb2YgJHtBTExfVFlQRVMuam9pbignLCAnKX1gKTtcbiAgICB9XG4gICAgb3B0aW9ucy5yb290ID0gcm9vdDtcbiAgICByZXR1cm4gbmV3IFJlYWRkaXJwU3RyZWFtKG9wdGlvbnMpO1xufVxuLyoqXG4gKiBQcm9taXNlIHZlcnNpb246IFJlYWRzIGFsbCBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgaW4gZ2l2ZW4gcm9vdCByZWN1cnNpdmVseS5cbiAqIENvbXBhcmVkIHRvIHN0cmVhbWluZyB2ZXJzaW9uLCB3aWxsIGNvbnN1bWUgYSBsb3Qgb2YgUkFNIGUuZy4gd2hlbiAxIG1pbGxpb24gZmlsZXMgYXJlIGxpc3RlZC5cbiAqIEByZXR1cm5zIGFycmF5IG9mIHBhdGhzIGFuZCB0aGVpciBlbnRyeSBpbmZvc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGRpcnBQcm9taXNlKHJvb3QsIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gW107XG4gICAgICAgIHJlYWRkaXJwKHJvb3QsIG9wdGlvbnMpXG4gICAgICAgICAgICAub24oJ2RhdGEnLCAoZW50cnkpID0+IGZpbGVzLnB1c2goZW50cnkpKVxuICAgICAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiByZXNvbHZlKGZpbGVzKSlcbiAgICAgICAgICAgIC5vbignZXJyb3InLCAoZXJyb3IpID0+IHJlamVjdChlcnJvcikpO1xuICAgIH0pO1xufVxuZXhwb3J0IGRlZmF1bHQgcmVhZGRpcnA7XG4iLCAiaW1wb3J0IHsgd2F0Y2hGaWxlLCB1bndhdGNoRmlsZSwgd2F0Y2ggYXMgZnNfd2F0Y2ggfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBvcGVuLCBzdGF0LCBsc3RhdCwgcmVhbHBhdGggYXMgZnNyZWFscGF0aCB9IGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCAqIGFzIHN5c1BhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB0eXBlIGFzIG9zVHlwZSB9IGZyb20gJ29zJztcbmV4cG9ydCBjb25zdCBTVFJfREFUQSA9ICdkYXRhJztcbmV4cG9ydCBjb25zdCBTVFJfRU5EID0gJ2VuZCc7XG5leHBvcnQgY29uc3QgU1RSX0NMT1NFID0gJ2Nsb3NlJztcbmV4cG9ydCBjb25zdCBFTVBUWV9GTiA9ICgpID0+IHsgfTtcbmV4cG9ydCBjb25zdCBJREVOVElUWV9GTiA9ICh2YWwpID0+IHZhbDtcbmNvbnN0IHBsID0gcHJvY2Vzcy5wbGF0Zm9ybTtcbmV4cG9ydCBjb25zdCBpc1dpbmRvd3MgPSBwbCA9PT0gJ3dpbjMyJztcbmV4cG9ydCBjb25zdCBpc01hY29zID0gcGwgPT09ICdkYXJ3aW4nO1xuZXhwb3J0IGNvbnN0IGlzTGludXggPSBwbCA9PT0gJ2xpbnV4JztcbmV4cG9ydCBjb25zdCBpc0ZyZWVCU0QgPSBwbCA9PT0gJ2ZyZWVic2QnO1xuZXhwb3J0IGNvbnN0IGlzSUJNaSA9IG9zVHlwZSgpID09PSAnT1M0MDAnO1xuZXhwb3J0IGNvbnN0IEVWRU5UUyA9IHtcbiAgICBBTEw6ICdhbGwnLFxuICAgIFJFQURZOiAncmVhZHknLFxuICAgIEFERDogJ2FkZCcsXG4gICAgQ0hBTkdFOiAnY2hhbmdlJyxcbiAgICBBRERfRElSOiAnYWRkRGlyJyxcbiAgICBVTkxJTks6ICd1bmxpbmsnLFxuICAgIFVOTElOS19ESVI6ICd1bmxpbmtEaXInLFxuICAgIFJBVzogJ3JhdycsXG4gICAgRVJST1I6ICdlcnJvcicsXG59O1xuY29uc3QgRVYgPSBFVkVOVFM7XG5jb25zdCBUSFJPVFRMRV9NT0RFX1dBVENIID0gJ3dhdGNoJztcbmNvbnN0IHN0YXRNZXRob2RzID0geyBsc3RhdCwgc3RhdCB9O1xuY29uc3QgS0VZX0xJU1RFTkVSUyA9ICdsaXN0ZW5lcnMnO1xuY29uc3QgS0VZX0VSUiA9ICdlcnJIYW5kbGVycyc7XG5jb25zdCBLRVlfUkFXID0gJ3Jhd0VtaXR0ZXJzJztcbmNvbnN0IEhBTkRMRVJfS0VZUyA9IFtLRVlfTElTVEVORVJTLCBLRVlfRVJSLCBLRVlfUkFXXTtcbi8vIHByZXR0aWVyLWlnbm9yZVxuY29uc3QgYmluYXJ5RXh0ZW5zaW9ucyA9IG5ldyBTZXQoW1xuICAgICczZG0nLCAnM2RzJywgJzNnMicsICczZ3AnLCAnN3onLCAnYScsICdhYWMnLCAnYWRwJywgJ2FmZGVzaWduJywgJ2FmcGhvdG8nLCAnYWZwdWInLCAnYWknLFxuICAgICdhaWYnLCAnYWlmZicsICdhbHonLCAnYXBlJywgJ2FwaycsICdhcHBpbWFnZScsICdhcicsICdhcmonLCAnYXNmJywgJ2F1JywgJ2F2aScsXG4gICAgJ2JhaycsICdiYW1sJywgJ2JoJywgJ2JpbicsICdiaycsICdibXAnLCAnYnRpZicsICdiejInLCAnYnppcDInLFxuICAgICdjYWInLCAnY2FmJywgJ2NnbScsICdjbGFzcycsICdjbXgnLCAnY3BpbycsICdjcjInLCAnY3VyJywgJ2RhdCcsICdkY20nLCAnZGViJywgJ2RleCcsICdkanZ1JyxcbiAgICAnZGxsJywgJ2RtZycsICdkbmcnLCAnZG9jJywgJ2RvY20nLCAnZG9jeCcsICdkb3QnLCAnZG90bScsICdkcmEnLCAnRFNfU3RvcmUnLCAnZHNrJywgJ2R0cycsXG4gICAgJ2R0c2hkJywgJ2R2YicsICdkd2cnLCAnZHhmJyxcbiAgICAnZWNlbHA0ODAwJywgJ2VjZWxwNzQ3MCcsICdlY2VscDk2MDAnLCAnZWdnJywgJ2VvbCcsICdlb3QnLCAnZXB1YicsICdleGUnLFxuICAgICdmNHYnLCAnZmJzJywgJ2ZoJywgJ2ZsYScsICdmbGFjJywgJ2ZsYXRwYWsnLCAnZmxpJywgJ2ZsdicsICdmcHgnLCAnZnN0JywgJ2Z2dCcsXG4gICAgJ2czJywgJ2doJywgJ2dpZicsICdncmFmZmxlJywgJ2d6JywgJ2d6aXAnLFxuICAgICdoMjYxJywgJ2gyNjMnLCAnaDI2NCcsICdpY25zJywgJ2ljbycsICdpZWYnLCAnaW1nJywgJ2lwYScsICdpc28nLFxuICAgICdqYXInLCAnanBlZycsICdqcGcnLCAnanBndicsICdqcG0nLCAnanhyJywgJ2tleScsICdrdHgnLFxuICAgICdsaGEnLCAnbGliJywgJ2x2cCcsICdseicsICdsemgnLCAnbHptYScsICdsem8nLFxuICAgICdtM3UnLCAnbTRhJywgJ200dicsICdtYXInLCAnbWRpJywgJ21odCcsICdtaWQnLCAnbWlkaScsICdtajInLCAnbWthJywgJ21rdicsICdtbXInLCAnbW5nJyxcbiAgICAnbW9iaScsICdtb3YnLCAnbW92aWUnLCAnbXAzJyxcbiAgICAnbXA0JywgJ21wNGEnLCAnbXBlZycsICdtcGcnLCAnbXBnYScsICdteHUnLFxuICAgICduZWYnLCAnbnB4JywgJ251bWJlcnMnLCAnbnVwa2cnLFxuICAgICdvJywgJ29kcCcsICdvZHMnLCAnb2R0JywgJ29nYScsICdvZ2cnLCAnb2d2JywgJ290ZicsICdvdHQnLFxuICAgICdwYWdlcycsICdwYm0nLCAncGN4JywgJ3BkYicsICdwZGYnLCAncGVhJywgJ3BnbScsICdwaWMnLCAncG5nJywgJ3BubScsICdwb3QnLCAncG90bScsXG4gICAgJ3BvdHgnLCAncHBhJywgJ3BwYW0nLFxuICAgICdwcG0nLCAncHBzJywgJ3Bwc20nLCAncHBzeCcsICdwcHQnLCAncHB0bScsICdwcHR4JywgJ3BzZCcsICdweWEnLCAncHljJywgJ3B5bycsICdweXYnLFxuICAgICdxdCcsXG4gICAgJ3JhcicsICdyYXMnLCAncmF3JywgJ3Jlc291cmNlcycsICdyZ2InLCAncmlwJywgJ3JsYycsICdybWYnLCAncm12YicsICdycG0nLCAncnRmJywgJ3J6JyxcbiAgICAnczNtJywgJ3M3eicsICdzY3B0JywgJ3NnaScsICdzaGFyJywgJ3NuYXAnLCAnc2lsJywgJ3NrZXRjaCcsICdzbGsnLCAnc212JywgJ3NuaycsICdzbycsXG4gICAgJ3N0bCcsICdzdW8nLCAnc3ViJywgJ3N3ZicsXG4gICAgJ3RhcicsICd0YnonLCAndGJ6MicsICd0Z2EnLCAndGd6JywgJ3RobXgnLCAndGlmJywgJ3RpZmYnLCAndGx6JywgJ3R0YycsICd0dGYnLCAndHh6JyxcbiAgICAndWRmJywgJ3V2aCcsICd1dmknLCAndXZtJywgJ3V2cCcsICd1dnMnLCAndXZ1JyxcbiAgICAndml2JywgJ3ZvYicsXG4gICAgJ3dhcicsICd3YXYnLCAnd2F4JywgJ3dibXAnLCAnd2RwJywgJ3dlYmEnLCAnd2VibScsICd3ZWJwJywgJ3dobCcsICd3aW0nLCAnd20nLCAnd21hJyxcbiAgICAnd212JywgJ3dteCcsICd3b2ZmJywgJ3dvZmYyJywgJ3dybScsICd3dngnLFxuICAgICd4Ym0nLCAneGlmJywgJ3hsYScsICd4bGFtJywgJ3hscycsICd4bHNiJywgJ3hsc20nLCAneGxzeCcsICd4bHQnLCAneGx0bScsICd4bHR4JywgJ3htJyxcbiAgICAneG1pbmQnLCAneHBpJywgJ3hwbScsICd4d2QnLCAneHonLFxuICAgICd6JywgJ3ppcCcsICd6aXB4Jyxcbl0pO1xuY29uc3QgaXNCaW5hcnlQYXRoID0gKGZpbGVQYXRoKSA9PiBiaW5hcnlFeHRlbnNpb25zLmhhcyhzeXNQYXRoLmV4dG5hbWUoZmlsZVBhdGgpLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCkpO1xuLy8gVE9ETzogZW1pdCBlcnJvcnMgcHJvcGVybHkuIEV4YW1wbGU6IEVNRklMRSBvbiBNYWNvcy5cbmNvbnN0IGZvcmVhY2ggPSAodmFsLCBmbikgPT4ge1xuICAgIGlmICh2YWwgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgdmFsLmZvckVhY2goZm4pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm4odmFsKTtcbiAgICB9XG59O1xuY29uc3QgYWRkQW5kQ29udmVydCA9IChtYWluLCBwcm9wLCBpdGVtKSA9PiB7XG4gICAgbGV0IGNvbnRhaW5lciA9IG1haW5bcHJvcF07XG4gICAgaWYgKCEoY29udGFpbmVyIGluc3RhbmNlb2YgU2V0KSkge1xuICAgICAgICBtYWluW3Byb3BdID0gY29udGFpbmVyID0gbmV3IFNldChbY29udGFpbmVyXSk7XG4gICAgfVxuICAgIGNvbnRhaW5lci5hZGQoaXRlbSk7XG59O1xuY29uc3QgY2xlYXJJdGVtID0gKGNvbnQpID0+IChrZXkpID0+IHtcbiAgICBjb25zdCBzZXQgPSBjb250W2tleV07XG4gICAgaWYgKHNldCBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICBzZXQuY2xlYXIoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGRlbGV0ZSBjb250W2tleV07XG4gICAgfVxufTtcbmNvbnN0IGRlbEZyb21TZXQgPSAobWFpbiwgcHJvcCwgaXRlbSkgPT4ge1xuICAgIGNvbnN0IGNvbnRhaW5lciA9IG1haW5bcHJvcF07XG4gICAgaWYgKGNvbnRhaW5lciBpbnN0YW5jZW9mIFNldCkge1xuICAgICAgICBjb250YWluZXIuZGVsZXRlKGl0ZW0pO1xuICAgIH1cbiAgICBlbHNlIGlmIChjb250YWluZXIgPT09IGl0ZW0pIHtcbiAgICAgICAgZGVsZXRlIG1haW5bcHJvcF07XG4gICAgfVxufTtcbmNvbnN0IGlzRW1wdHlTZXQgPSAodmFsKSA9PiAodmFsIGluc3RhbmNlb2YgU2V0ID8gdmFsLnNpemUgPT09IDAgOiAhdmFsKTtcbmNvbnN0IEZzV2F0Y2hJbnN0YW5jZXMgPSBuZXcgTWFwKCk7XG4vKipcbiAqIEluc3RhbnRpYXRlcyB0aGUgZnNfd2F0Y2ggaW50ZXJmYWNlXG4gKiBAcGFyYW0gcGF0aCB0byBiZSB3YXRjaGVkXG4gKiBAcGFyYW0gb3B0aW9ucyB0byBiZSBwYXNzZWQgdG8gZnNfd2F0Y2hcbiAqIEBwYXJhbSBsaXN0ZW5lciBtYWluIGV2ZW50IGhhbmRsZXJcbiAqIEBwYXJhbSBlcnJIYW5kbGVyIGVtaXRzIGluZm8gYWJvdXQgZXJyb3JzXG4gKiBAcGFyYW0gZW1pdFJhdyBlbWl0cyByYXcgZXZlbnQgZGF0YVxuICogQHJldHVybnMge05hdGl2ZUZzV2F0Y2hlcn1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlRnNXYXRjaEluc3RhbmNlKHBhdGgsIG9wdGlvbnMsIGxpc3RlbmVyLCBlcnJIYW5kbGVyLCBlbWl0UmF3KSB7XG4gICAgY29uc3QgaGFuZGxlRXZlbnQgPSAocmF3RXZlbnQsIGV2UGF0aCkgPT4ge1xuICAgICAgICBsaXN0ZW5lcihwYXRoKTtcbiAgICAgICAgZW1pdFJhdyhyYXdFdmVudCwgZXZQYXRoLCB7IHdhdGNoZWRQYXRoOiBwYXRoIH0pO1xuICAgICAgICAvLyBlbWl0IGJhc2VkIG9uIGV2ZW50cyBvY2N1cnJpbmcgZm9yIGZpbGVzIGZyb20gYSBkaXJlY3RvcnkncyB3YXRjaGVyIGluXG4gICAgICAgIC8vIGNhc2UgdGhlIGZpbGUncyB3YXRjaGVyIG1pc3NlcyBpdCAoYW5kIHJlbHkgb24gdGhyb3R0bGluZyB0byBkZS1kdXBlKVxuICAgICAgICBpZiAoZXZQYXRoICYmIHBhdGggIT09IGV2UGF0aCkge1xuICAgICAgICAgICAgZnNXYXRjaEJyb2FkY2FzdChzeXNQYXRoLnJlc29sdmUocGF0aCwgZXZQYXRoKSwgS0VZX0xJU1RFTkVSUywgc3lzUGF0aC5qb2luKHBhdGgsIGV2UGF0aCkpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnNfd2F0Y2gocGF0aCwge1xuICAgICAgICAgICAgcGVyc2lzdGVudDogb3B0aW9ucy5wZXJzaXN0ZW50LFxuICAgICAgICB9LCBoYW5kbGVFdmVudCk7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBlcnJIYW5kbGVyKGVycm9yKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG59XG4vKipcbiAqIEhlbHBlciBmb3IgcGFzc2luZyBmc193YXRjaCBldmVudCBkYXRhIHRvIGEgY29sbGVjdGlvbiBvZiBsaXN0ZW5lcnNcbiAqIEBwYXJhbSBmdWxsUGF0aCBhYnNvbHV0ZSBwYXRoIGJvdW5kIHRvIGZzX3dhdGNoIGluc3RhbmNlXG4gKi9cbmNvbnN0IGZzV2F0Y2hCcm9hZGNhc3QgPSAoZnVsbFBhdGgsIGxpc3RlbmVyVHlwZSwgdmFsMSwgdmFsMiwgdmFsMykgPT4ge1xuICAgIGNvbnN0IGNvbnQgPSBGc1dhdGNoSW5zdGFuY2VzLmdldChmdWxsUGF0aCk7XG4gICAgaWYgKCFjb250KVxuICAgICAgICByZXR1cm47XG4gICAgZm9yZWFjaChjb250W2xpc3RlbmVyVHlwZV0sIChsaXN0ZW5lcikgPT4ge1xuICAgICAgICBsaXN0ZW5lcih2YWwxLCB2YWwyLCB2YWwzKTtcbiAgICB9KTtcbn07XG4vKipcbiAqIEluc3RhbnRpYXRlcyB0aGUgZnNfd2F0Y2ggaW50ZXJmYWNlIG9yIGJpbmRzIGxpc3RlbmVyc1xuICogdG8gYW4gZXhpc3Rpbmcgb25lIGNvdmVyaW5nIHRoZSBzYW1lIGZpbGUgc3lzdGVtIGVudHJ5XG4gKiBAcGFyYW0gcGF0aFxuICogQHBhcmFtIGZ1bGxQYXRoIGFic29sdXRlIHBhdGhcbiAqIEBwYXJhbSBvcHRpb25zIHRvIGJlIHBhc3NlZCB0byBmc193YXRjaFxuICogQHBhcmFtIGhhbmRsZXJzIGNvbnRhaW5lciBmb3IgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb25zXG4gKi9cbmNvbnN0IHNldEZzV2F0Y2hMaXN0ZW5lciA9IChwYXRoLCBmdWxsUGF0aCwgb3B0aW9ucywgaGFuZGxlcnMpID0+IHtcbiAgICBjb25zdCB7IGxpc3RlbmVyLCBlcnJIYW5kbGVyLCByYXdFbWl0dGVyIH0gPSBoYW5kbGVycztcbiAgICBsZXQgY29udCA9IEZzV2F0Y2hJbnN0YW5jZXMuZ2V0KGZ1bGxQYXRoKTtcbiAgICBsZXQgd2F0Y2hlcjtcbiAgICBpZiAoIW9wdGlvbnMucGVyc2lzdGVudCkge1xuICAgICAgICB3YXRjaGVyID0gY3JlYXRlRnNXYXRjaEluc3RhbmNlKHBhdGgsIG9wdGlvbnMsIGxpc3RlbmVyLCBlcnJIYW5kbGVyLCByYXdFbWl0dGVyKTtcbiAgICAgICAgaWYgKCF3YXRjaGVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICByZXR1cm4gd2F0Y2hlci5jbG9zZS5iaW5kKHdhdGNoZXIpO1xuICAgIH1cbiAgICBpZiAoY29udCkge1xuICAgICAgICBhZGRBbmRDb252ZXJ0KGNvbnQsIEtFWV9MSVNURU5FUlMsIGxpc3RlbmVyKTtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfRVJSLCBlcnJIYW5kbGVyKTtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfUkFXLCByYXdFbWl0dGVyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHdhdGNoZXIgPSBjcmVhdGVGc1dhdGNoSW5zdGFuY2UocGF0aCwgb3B0aW9ucywgZnNXYXRjaEJyb2FkY2FzdC5iaW5kKG51bGwsIGZ1bGxQYXRoLCBLRVlfTElTVEVORVJTKSwgZXJySGFuZGxlciwgLy8gbm8gbmVlZCB0byB1c2UgYnJvYWRjYXN0IGhlcmVcbiAgICAgICAgZnNXYXRjaEJyb2FkY2FzdC5iaW5kKG51bGwsIGZ1bGxQYXRoLCBLRVlfUkFXKSk7XG4gICAgICAgIGlmICghd2F0Y2hlcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgd2F0Y2hlci5vbihFVi5FUlJPUiwgYXN5bmMgKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBicm9hZGNhc3RFcnIgPSBmc1dhdGNoQnJvYWRjYXN0LmJpbmQobnVsbCwgZnVsbFBhdGgsIEtFWV9FUlIpO1xuICAgICAgICAgICAgaWYgKGNvbnQpXG4gICAgICAgICAgICAgICAgY29udC53YXRjaGVyVW51c2FibGUgPSB0cnVlOyAvLyBkb2N1bWVudGVkIHNpbmNlIE5vZGUgMTAuNC4xXG4gICAgICAgICAgICAvLyBXb3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vam95ZW50L25vZGUvaXNzdWVzLzQzMzdcbiAgICAgICAgICAgIGlmIChpc1dpbmRvd3MgJiYgZXJyb3IuY29kZSA9PT0gJ0VQRVJNJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZkID0gYXdhaXQgb3BlbihwYXRoLCAncicpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBmZC5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBicm9hZGNhc3RFcnIoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRvIG5vdGhpbmdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBicm9hZGNhc3RFcnIoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29udCA9IHtcbiAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXIsXG4gICAgICAgICAgICBlcnJIYW5kbGVyczogZXJySGFuZGxlcixcbiAgICAgICAgICAgIHJhd0VtaXR0ZXJzOiByYXdFbWl0dGVyLFxuICAgICAgICAgICAgd2F0Y2hlcixcbiAgICAgICAgfTtcbiAgICAgICAgRnNXYXRjaEluc3RhbmNlcy5zZXQoZnVsbFBhdGgsIGNvbnQpO1xuICAgIH1cbiAgICAvLyBjb25zdCBpbmRleCA9IGNvbnQubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIC8vIHJlbW92ZXMgdGhpcyBpbnN0YW5jZSdzIGxpc3RlbmVycyBhbmQgY2xvc2VzIHRoZSB1bmRlcmx5aW5nIGZzX3dhdGNoXG4gICAgLy8gaW5zdGFuY2UgaWYgdGhlcmUgYXJlIG5vIG1vcmUgbGlzdGVuZXJzIGxlZnRcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkZWxGcm9tU2V0KGNvbnQsIEtFWV9MSVNURU5FUlMsIGxpc3RlbmVyKTtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfRVJSLCBlcnJIYW5kbGVyKTtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfUkFXLCByYXdFbWl0dGVyKTtcbiAgICAgICAgaWYgKGlzRW1wdHlTZXQoY29udC5saXN0ZW5lcnMpKSB7XG4gICAgICAgICAgICAvLyBDaGVjayB0byBwcm90ZWN0IGFnYWluc3QgaXNzdWUgZ2gtNzMwLlxuICAgICAgICAgICAgLy8gaWYgKGNvbnQud2F0Y2hlclVudXNhYmxlKSB7XG4gICAgICAgICAgICBjb250LndhdGNoZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIEZzV2F0Y2hJbnN0YW5jZXMuZGVsZXRlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIEhBTkRMRVJfS0VZUy5mb3JFYWNoKGNsZWFySXRlbShjb250KSk7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBjb250LndhdGNoZXIgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBPYmplY3QuZnJlZXplKGNvbnQpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG4vLyBmc193YXRjaEZpbGUgaGVscGVyc1xuLy8gb2JqZWN0IHRvIGhvbGQgcGVyLXByb2Nlc3MgZnNfd2F0Y2hGaWxlIGluc3RhbmNlc1xuLy8gKG1heSBiZSBzaGFyZWQgYWNyb3NzIGNob2tpZGFyIEZTV2F0Y2hlciBpbnN0YW5jZXMpXG5jb25zdCBGc1dhdGNoRmlsZUluc3RhbmNlcyA9IG5ldyBNYXAoKTtcbi8qKlxuICogSW5zdGFudGlhdGVzIHRoZSBmc193YXRjaEZpbGUgaW50ZXJmYWNlIG9yIGJpbmRzIGxpc3RlbmVyc1xuICogdG8gYW4gZXhpc3Rpbmcgb25lIGNvdmVyaW5nIHRoZSBzYW1lIGZpbGUgc3lzdGVtIGVudHJ5XG4gKiBAcGFyYW0gcGF0aCB0byBiZSB3YXRjaGVkXG4gKiBAcGFyYW0gZnVsbFBhdGggYWJzb2x1dGUgcGF0aFxuICogQHBhcmFtIG9wdGlvbnMgb3B0aW9ucyB0byBiZSBwYXNzZWQgdG8gZnNfd2F0Y2hGaWxlXG4gKiBAcGFyYW0gaGFuZGxlcnMgY29udGFpbmVyIGZvciBldmVudCBsaXN0ZW5lciBmdW5jdGlvbnNcbiAqIEByZXR1cm5zIGNsb3NlclxuICovXG5jb25zdCBzZXRGc1dhdGNoRmlsZUxpc3RlbmVyID0gKHBhdGgsIGZ1bGxQYXRoLCBvcHRpb25zLCBoYW5kbGVycykgPT4ge1xuICAgIGNvbnN0IHsgbGlzdGVuZXIsIHJhd0VtaXR0ZXIgfSA9IGhhbmRsZXJzO1xuICAgIGxldCBjb250ID0gRnNXYXRjaEZpbGVJbnN0YW5jZXMuZ2V0KGZ1bGxQYXRoKTtcbiAgICAvLyBsZXQgbGlzdGVuZXJzID0gbmV3IFNldCgpO1xuICAgIC8vIGxldCByYXdFbWl0dGVycyA9IG5ldyBTZXQoKTtcbiAgICBjb25zdCBjb3B0cyA9IGNvbnQgJiYgY29udC5vcHRpb25zO1xuICAgIGlmIChjb3B0cyAmJiAoY29wdHMucGVyc2lzdGVudCA8IG9wdGlvbnMucGVyc2lzdGVudCB8fCBjb3B0cy5pbnRlcnZhbCA+IG9wdGlvbnMuaW50ZXJ2YWwpKSB7XG4gICAgICAgIC8vIFwiVXBncmFkZVwiIHRoZSB3YXRjaGVyIHRvIHBlcnNpc3RlbmNlIG9yIGEgcXVpY2tlciBpbnRlcnZhbC5cbiAgICAgICAgLy8gVGhpcyBjcmVhdGVzIHNvbWUgdW5saWtlbHkgZWRnZSBjYXNlIGlzc3VlcyBpZiB0aGUgdXNlciBtaXhlc1xuICAgICAgICAvLyBzZXR0aW5ncyBpbiBhIHZlcnkgd2VpcmQgd2F5LCBidXQgc29sdmluZyBmb3IgdGhvc2UgY2FzZXNcbiAgICAgICAgLy8gZG9lc24ndCBzZWVtIHdvcnRod2hpbGUgZm9yIHRoZSBhZGRlZCBjb21wbGV4aXR5LlxuICAgICAgICAvLyBsaXN0ZW5lcnMgPSBjb250Lmxpc3RlbmVycztcbiAgICAgICAgLy8gcmF3RW1pdHRlcnMgPSBjb250LnJhd0VtaXR0ZXJzO1xuICAgICAgICB1bndhdGNoRmlsZShmdWxsUGF0aCk7XG4gICAgICAgIGNvbnQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGlmIChjb250KSB7XG4gICAgICAgIGFkZEFuZENvbnZlcnQoY29udCwgS0VZX0xJU1RFTkVSUywgbGlzdGVuZXIpO1xuICAgICAgICBhZGRBbmRDb252ZXJ0KGNvbnQsIEtFWV9SQVcsIHJhd0VtaXR0ZXIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy8gVE9ET1xuICAgICAgICAvLyBsaXN0ZW5lcnMuYWRkKGxpc3RlbmVyKTtcbiAgICAgICAgLy8gcmF3RW1pdHRlcnMuYWRkKHJhd0VtaXR0ZXIpO1xuICAgICAgICBjb250ID0ge1xuICAgICAgICAgICAgbGlzdGVuZXJzOiBsaXN0ZW5lcixcbiAgICAgICAgICAgIHJhd0VtaXR0ZXJzOiByYXdFbWl0dGVyLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgIHdhdGNoZXI6IHdhdGNoRmlsZShmdWxsUGF0aCwgb3B0aW9ucywgKGN1cnIsIHByZXYpID0+IHtcbiAgICAgICAgICAgICAgICBmb3JlYWNoKGNvbnQucmF3RW1pdHRlcnMsIChyYXdFbWl0dGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJhd0VtaXR0ZXIoRVYuQ0hBTkdFLCBmdWxsUGF0aCwgeyBjdXJyLCBwcmV2IH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJtdGltZSA9IGN1cnIubXRpbWVNcztcbiAgICAgICAgICAgICAgICBpZiAoY3Vyci5zaXplICE9PSBwcmV2LnNpemUgfHwgY3Vycm10aW1lID4gcHJldi5tdGltZU1zIHx8IGN1cnJtdGltZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBmb3JlYWNoKGNvbnQubGlzdGVuZXJzLCAobGlzdGVuZXIpID0+IGxpc3RlbmVyKHBhdGgsIGN1cnIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSxcbiAgICAgICAgfTtcbiAgICAgICAgRnNXYXRjaEZpbGVJbnN0YW5jZXMuc2V0KGZ1bGxQYXRoLCBjb250KTtcbiAgICB9XG4gICAgLy8gY29uc3QgaW5kZXggPSBjb250Lmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAvLyBSZW1vdmVzIHRoaXMgaW5zdGFuY2UncyBsaXN0ZW5lcnMgYW5kIGNsb3NlcyB0aGUgdW5kZXJseWluZyBmc193YXRjaEZpbGVcbiAgICAvLyBpbnN0YW5jZSBpZiB0aGVyZSBhcmUgbm8gbW9yZSBsaXN0ZW5lcnMgbGVmdC5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBkZWxGcm9tU2V0KGNvbnQsIEtFWV9MSVNURU5FUlMsIGxpc3RlbmVyKTtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfUkFXLCByYXdFbWl0dGVyKTtcbiAgICAgICAgaWYgKGlzRW1wdHlTZXQoY29udC5saXN0ZW5lcnMpKSB7XG4gICAgICAgICAgICBGc1dhdGNoRmlsZUluc3RhbmNlcy5kZWxldGUoZnVsbFBhdGgpO1xuICAgICAgICAgICAgdW53YXRjaEZpbGUoZnVsbFBhdGgpO1xuICAgICAgICAgICAgY29udC5vcHRpb25zID0gY29udC53YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShjb250KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuLyoqXG4gKiBAbWl4aW5cbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVGc0hhbmRsZXIge1xuICAgIGNvbnN0cnVjdG9yKGZzVykge1xuICAgICAgICB0aGlzLmZzdyA9IGZzVztcbiAgICAgICAgdGhpcy5fYm91bmRIYW5kbGVFcnJvciA9IChlcnJvcikgPT4gZnNXLl9oYW5kbGVFcnJvcihlcnJvcik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFdhdGNoIGZpbGUgZm9yIGNoYW5nZXMgd2l0aCBmc193YXRjaEZpbGUgb3IgZnNfd2F0Y2guXG4gICAgICogQHBhcmFtIHBhdGggdG8gZmlsZSBvciBkaXJcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXIgb24gZnMgY2hhbmdlXG4gICAgICogQHJldHVybnMgY2xvc2VyIGZvciB0aGUgd2F0Y2hlciBpbnN0YW5jZVxuICAgICAqL1xuICAgIF93YXRjaFdpdGhOb2RlRnMocGF0aCwgbGlzdGVuZXIpIHtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMuZnN3Lm9wdGlvbnM7XG4gICAgICAgIGNvbnN0IGRpcmVjdG9yeSA9IHN5c1BhdGguZGlybmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgYmFzZW5hbWUgPSBzeXNQYXRoLmJhc2VuYW1lKHBhdGgpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLmZzdy5fZ2V0V2F0Y2hlZERpcihkaXJlY3RvcnkpO1xuICAgICAgICBwYXJlbnQuYWRkKGJhc2VuYW1lKTtcbiAgICAgICAgY29uc3QgYWJzb2x1dGVQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgICAgICBjb25zdCBvcHRpb25zID0ge1xuICAgICAgICAgICAgcGVyc2lzdGVudDogb3B0cy5wZXJzaXN0ZW50LFxuICAgICAgICB9O1xuICAgICAgICBpZiAoIWxpc3RlbmVyKVxuICAgICAgICAgICAgbGlzdGVuZXIgPSBFTVBUWV9GTjtcbiAgICAgICAgbGV0IGNsb3NlcjtcbiAgICAgICAgaWYgKG9wdHMudXNlUG9sbGluZykge1xuICAgICAgICAgICAgY29uc3QgZW5hYmxlQmluID0gb3B0cy5pbnRlcnZhbCAhPT0gb3B0cy5iaW5hcnlJbnRlcnZhbDtcbiAgICAgICAgICAgIG9wdGlvbnMuaW50ZXJ2YWwgPSBlbmFibGVCaW4gJiYgaXNCaW5hcnlQYXRoKGJhc2VuYW1lKSA/IG9wdHMuYmluYXJ5SW50ZXJ2YWwgOiBvcHRzLmludGVydmFsO1xuICAgICAgICAgICAgY2xvc2VyID0gc2V0RnNXYXRjaEZpbGVMaXN0ZW5lcihwYXRoLCBhYnNvbHV0ZVBhdGgsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgICByYXdFbWl0dGVyOiB0aGlzLmZzdy5fZW1pdFJhdyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2xvc2VyID0gc2V0RnNXYXRjaExpc3RlbmVyKHBhdGgsIGFic29sdXRlUGF0aCwgb3B0aW9ucywge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLFxuICAgICAgICAgICAgICAgIGVyckhhbmRsZXI6IHRoaXMuX2JvdW5kSGFuZGxlRXJyb3IsXG4gICAgICAgICAgICAgICAgcmF3RW1pdHRlcjogdGhpcy5mc3cuX2VtaXRSYXcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvc2VyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXYXRjaCBhIGZpbGUgYW5kIGVtaXQgYWRkIGV2ZW50IGlmIHdhcnJhbnRlZC5cbiAgICAgKiBAcmV0dXJucyBjbG9zZXIgZm9yIHRoZSB3YXRjaGVyIGluc3RhbmNlXG4gICAgICovXG4gICAgX2hhbmRsZUZpbGUoZmlsZSwgc3RhdHMsIGluaXRpYWxBZGQpIHtcbiAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGRpcm5hbWUgPSBzeXNQYXRoLmRpcm5hbWUoZmlsZSk7XG4gICAgICAgIGNvbnN0IGJhc2VuYW1lID0gc3lzUGF0aC5iYXNlbmFtZShmaWxlKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlybmFtZSk7XG4gICAgICAgIC8vIHN0YXRzIGlzIGFsd2F5cyBwcmVzZW50XG4gICAgICAgIGxldCBwcmV2U3RhdHMgPSBzdGF0cztcbiAgICAgICAgLy8gaWYgdGhlIGZpbGUgaXMgYWxyZWFkeSBiZWluZyB3YXRjaGVkLCBkbyBub3RoaW5nXG4gICAgICAgIGlmIChwYXJlbnQuaGFzKGJhc2VuYW1lKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGlzdGVuZXIgPSBhc3luYyAocGF0aCwgbmV3U3RhdHMpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mc3cuX3Rocm90dGxlKFRIUk9UVExFX01PREVfV0FUQ0gsIGZpbGUsIDUpKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmICghbmV3U3RhdHMgfHwgbmV3U3RhdHMubXRpbWVNcyA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1N0YXRzID0gYXdhaXQgc3RhdChmaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgdGhhdCBjaGFuZ2UgZXZlbnQgd2FzIG5vdCBmaXJlZCBiZWNhdXNlIG9mIGNoYW5nZWQgb25seSBhY2Nlc3NUaW1lLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdCA9IG5ld1N0YXRzLmF0aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG10ID0gbmV3U3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFhdCB8fCBhdCA8PSBtdCB8fCBtdCAhPT0gcHJldlN0YXRzLm10aW1lTXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0KEVWLkNIQU5HRSwgZmlsZSwgbmV3U3RhdHMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgoaXNNYWNvcyB8fCBpc0xpbnV4IHx8IGlzRnJlZUJTRCkgJiYgcHJldlN0YXRzLmlubyAhPT0gbmV3U3RhdHMuaW5vKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fY2xvc2VGaWxlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRzID0gbmV3U3RhdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjbG9zZXIgPSB0aGlzLl93YXRjaFdpdGhOb2RlRnMoZmlsZSwgbGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNsb3NlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fYWRkUGF0aENsb3NlcihwYXRoLCBjbG9zZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlN0YXRzID0gbmV3U3RhdHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpeCBpc3N1ZXMgd2hlcmUgbXRpbWUgaXMgbnVsbCBidXQgZmlsZSBpcyBzdGlsbCBwcmVzZW50XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9yZW1vdmUoZGlybmFtZSwgYmFzZW5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBhZGQgaXMgYWJvdXQgdG8gYmUgZW1pdHRlZCBpZiBmaWxlIG5vdCBhbHJlYWR5IHRyYWNrZWQgaW4gcGFyZW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChwYXJlbnQuaGFzKGJhc2VuYW1lKSkge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgY2hhbmdlIGV2ZW50IHdhcyBub3QgZmlyZWQgYmVjYXVzZSBvZiBjaGFuZ2VkIG9ubHkgYWNjZXNzVGltZS5cbiAgICAgICAgICAgICAgICBjb25zdCBhdCA9IG5ld1N0YXRzLmF0aW1lTXM7XG4gICAgICAgICAgICAgICAgY29uc3QgbXQgPSBuZXdTdGF0cy5tdGltZU1zO1xuICAgICAgICAgICAgICAgIGlmICghYXQgfHwgYXQgPD0gbXQgfHwgbXQgIT09IHByZXZTdGF0cy5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0KEVWLkNIQU5HRSwgZmlsZSwgbmV3U3RhdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwcmV2U3RhdHMgPSBuZXdTdGF0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgLy8ga2ljayBvZmYgdGhlIHdhdGNoZXJcbiAgICAgICAgY29uc3QgY2xvc2VyID0gdGhpcy5fd2F0Y2hXaXRoTm9kZUZzKGZpbGUsIGxpc3RlbmVyKTtcbiAgICAgICAgLy8gZW1pdCBhbiBhZGQgZXZlbnQgaWYgd2UncmUgc3VwcG9zZWQgdG9cbiAgICAgICAgaWYgKCEoaW5pdGlhbEFkZCAmJiB0aGlzLmZzdy5vcHRpb25zLmlnbm9yZUluaXRpYWwpICYmIHRoaXMuZnN3Ll9pc250SWdub3JlZChmaWxlKSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmZzdy5fdGhyb3R0bGUoRVYuQURELCBmaWxlLCAwKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BREQsIGZpbGUsIHN0YXRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvc2VyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgc3ltbGlua3MgZW5jb3VudGVyZWQgd2hpbGUgcmVhZGluZyBhIGRpci5cbiAgICAgKiBAcGFyYW0gZW50cnkgcmV0dXJuZWQgYnkgcmVhZGRpcnBcbiAgICAgKiBAcGFyYW0gZGlyZWN0b3J5IHBhdGggb2YgZGlyIGJlaW5nIHJlYWRcbiAgICAgKiBAcGFyYW0gcGF0aCBvZiB0aGlzIGl0ZW1cbiAgICAgKiBAcGFyYW0gaXRlbSBiYXNlbmFtZSBvZiB0aGlzIGl0ZW1cbiAgICAgKiBAcmV0dXJucyB0cnVlIGlmIG5vIG1vcmUgcHJvY2Vzc2luZyBpcyBuZWVkZWQgZm9yIHRoaXMgZW50cnkuXG4gICAgICovXG4gICAgYXN5bmMgX2hhbmRsZVN5bWxpbmsoZW50cnksIGRpcmVjdG9yeSwgcGF0aCwgaXRlbSkge1xuICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZnVsbCA9IGVudHJ5LmZ1bGxQYXRoO1xuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLmZzdy5fZ2V0V2F0Y2hlZERpcihkaXJlY3RvcnkpO1xuICAgICAgICBpZiAoIXRoaXMuZnN3Lm9wdGlvbnMuZm9sbG93U3ltbGlua3MpIHtcbiAgICAgICAgICAgIC8vIHdhdGNoIHN5bWxpbmsgZGlyZWN0bHkgKGRvbid0IGZvbGxvdykgYW5kIGRldGVjdCBjaGFuZ2VzXG4gICAgICAgICAgICB0aGlzLmZzdy5faW5jclJlYWR5Q291bnQoKTtcbiAgICAgICAgICAgIGxldCBsaW5rUGF0aDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbGlua1BhdGggPSBhd2FpdCBmc3JlYWxwYXRoKHBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdFJlYWR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChkaXIuaGFzKGl0ZW0pKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnN3Ll9zeW1saW5rUGF0aHMuZ2V0KGZ1bGwpICE9PSBsaW5rUGF0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fc3ltbGlua1BhdGhzLnNldChmdWxsLCBsaW5rUGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0KEVWLkNIQU5HRSwgcGF0aCwgZW50cnkuc3RhdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpci5hZGQoaXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoZnVsbCwgbGlua1BhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0KEVWLkFERCwgcGF0aCwgZW50cnkuc3RhdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXRSZWFkeSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZG9uJ3QgZm9sbG93IHRoZSBzYW1lIHN5bWxpbmsgbW9yZSB0aGFuIG9uY2VcbiAgICAgICAgaWYgKHRoaXMuZnN3Ll9zeW1saW5rUGF0aHMuaGFzKGZ1bGwpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZzdy5fc3ltbGlua1BhdGhzLnNldChmdWxsLCB0cnVlKTtcbiAgICB9XG4gICAgX2hhbmRsZVJlYWQoZGlyZWN0b3J5LCBpbml0aWFsQWRkLCB3aCwgdGFyZ2V0LCBkaXIsIGRlcHRoLCB0aHJvdHRsZXIpIHtcbiAgICAgICAgLy8gTm9ybWFsaXplIHRoZSBkaXJlY3RvcnkgbmFtZSBvbiBXaW5kb3dzXG4gICAgICAgIGRpcmVjdG9yeSA9IHN5c1BhdGguam9pbihkaXJlY3RvcnksICcnKTtcbiAgICAgICAgdGhyb3R0bGVyID0gdGhpcy5mc3cuX3Rocm90dGxlKCdyZWFkZGlyJywgZGlyZWN0b3J5LCAxMDAwKTtcbiAgICAgICAgaWYgKCF0aHJvdHRsZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHByZXZpb3VzID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIod2gucGF0aCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSBuZXcgU2V0KCk7XG4gICAgICAgIGxldCBzdHJlYW0gPSB0aGlzLmZzdy5fcmVhZGRpcnAoZGlyZWN0b3J5LCB7XG4gICAgICAgICAgICBmaWxlRmlsdGVyOiAoZW50cnkpID0+IHdoLmZpbHRlclBhdGgoZW50cnkpLFxuICAgICAgICAgICAgZGlyZWN0b3J5RmlsdGVyOiAoZW50cnkpID0+IHdoLmZpbHRlckRpcihlbnRyeSksXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoIXN0cmVhbSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgc3RyZWFtXG4gICAgICAgICAgICAub24oU1RSX0RBVEEsIGFzeW5jIChlbnRyeSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBpdGVtID0gZW50cnkucGF0aDtcbiAgICAgICAgICAgIGxldCBwYXRoID0gc3lzUGF0aC5qb2luKGRpcmVjdG9yeSwgaXRlbSk7XG4gICAgICAgICAgICBjdXJyZW50LmFkZChpdGVtKTtcbiAgICAgICAgICAgIGlmIChlbnRyeS5zdGF0cy5pc1N5bWJvbGljTGluaygpICYmXG4gICAgICAgICAgICAgICAgKGF3YWl0IHRoaXMuX2hhbmRsZVN5bWxpbmsoZW50cnksIGRpcmVjdG9yeSwgcGF0aCwgaXRlbSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGaWxlcyB0aGF0IHByZXNlbnQgaW4gY3VycmVudCBkaXJlY3Rvcnkgc25hcHNob3RcbiAgICAgICAgICAgIC8vIGJ1dCBhYnNlbnQgaW4gcHJldmlvdXMgYXJlIGFkZGVkIHRvIHdhdGNoIGxpc3QgYW5kXG4gICAgICAgICAgICAvLyBlbWl0IGBhZGRgIGV2ZW50LlxuICAgICAgICAgICAgaWYgKGl0ZW0gPT09IHRhcmdldCB8fCAoIXRhcmdldCAmJiAhcHJldmlvdXMuaGFzKGl0ZW0pKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9pbmNyUmVhZHlDb3VudCgpO1xuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSByZWxhdGl2ZW5lc3Mgb2YgcGF0aCBpcyBwcmVzZXJ2ZWQgaW4gY2FzZSBvZiB3YXRjaGVyIHJldXNlXG4gICAgICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGguam9pbihkaXIsIHN5c1BhdGgucmVsYXRpdmUoZGlyLCBwYXRoKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkVG9Ob2RlRnMocGF0aCwgaW5pdGlhbEFkZCwgd2gsIGRlcHRoICsgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgICAub24oRVYuRVJST1IsIHRoaXMuX2JvdW5kSGFuZGxlRXJyb3IpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFzdHJlYW0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdCgpO1xuICAgICAgICAgICAgc3RyZWFtLm9uY2UoU1RSX0VORCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHdhc1Rocm90dGxlZCA9IHRocm90dGxlciA/IHRocm90dGxlci5jbGVhcigpIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIC8vIEZpbGVzIHRoYXQgYWJzZW50IGluIGN1cnJlbnQgZGlyZWN0b3J5IHNuYXBzaG90XG4gICAgICAgICAgICAgICAgLy8gYnV0IHByZXNlbnQgaW4gcHJldmlvdXMgZW1pdCBgcmVtb3ZlYCBldmVudFxuICAgICAgICAgICAgICAgIC8vIGFuZCBhcmUgcmVtb3ZlZCBmcm9tIEB3YXRjaGVkW2RpcmVjdG9yeV0uXG4gICAgICAgICAgICAgICAgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgLmdldENoaWxkcmVuKClcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbSAhPT0gZGlyZWN0b3J5ICYmICFjdXJyZW50LmhhcyhpdGVtKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fcmVtb3ZlKGRpcmVjdG9yeSwgaXRlbSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RyZWFtID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIC8vIG9uZSBtb3JlIHRpbWUgZm9yIGFueSBtaXNzZWQgaW4gY2FzZSBjaGFuZ2VzIGNhbWUgaW4gZXh0cmVtZWx5IHF1aWNrbHlcbiAgICAgICAgICAgICAgICBpZiAod2FzVGhyb3R0bGVkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVSZWFkKGRpcmVjdG9yeSwgZmFsc2UsIHdoLCB0YXJnZXQsIGRpciwgZGVwdGgsIHRocm90dGxlcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJlYWQgZGlyZWN0b3J5IHRvIGFkZCAvIHJlbW92ZSBmaWxlcyBmcm9tIGBAd2F0Y2hlZGAgbGlzdCBhbmQgcmUtcmVhZCBpdCBvbiBjaGFuZ2UuXG4gICAgICogQHBhcmFtIGRpciBmcyBwYXRoXG4gICAgICogQHBhcmFtIHN0YXRzXG4gICAgICogQHBhcmFtIGluaXRpYWxBZGRcbiAgICAgKiBAcGFyYW0gZGVwdGggcmVsYXRpdmUgdG8gdXNlci1zdXBwbGllZCBwYXRoXG4gICAgICogQHBhcmFtIHRhcmdldCBjaGlsZCBwYXRoIHRhcmdldGVkIGZvciB3YXRjaFxuICAgICAqIEBwYXJhbSB3aCBDb21tb24gd2F0Y2ggaGVscGVycyBmb3IgdGhpcyBwYXRoXG4gICAgICogQHBhcmFtIHJlYWxwYXRoXG4gICAgICogQHJldHVybnMgY2xvc2VyIGZvciB0aGUgd2F0Y2hlciBpbnN0YW5jZS5cbiAgICAgKi9cbiAgICBhc3luYyBfaGFuZGxlRGlyKGRpciwgc3RhdHMsIGluaXRpYWxBZGQsIGRlcHRoLCB0YXJnZXQsIHdoLCByZWFscGF0aCkge1xuICAgICAgICBjb25zdCBwYXJlbnREaXIgPSB0aGlzLmZzdy5fZ2V0V2F0Y2hlZERpcihzeXNQYXRoLmRpcm5hbWUoZGlyKSk7XG4gICAgICAgIGNvbnN0IHRyYWNrZWQgPSBwYXJlbnREaXIuaGFzKHN5c1BhdGguYmFzZW5hbWUoZGlyKSk7XG4gICAgICAgIGlmICghKGluaXRpYWxBZGQgJiYgdGhpcy5mc3cub3B0aW9ucy5pZ25vcmVJbml0aWFsKSAmJiAhdGFyZ2V0ICYmICF0cmFja2VkKSB7XG4gICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BRERfRElSLCBkaXIsIHN0YXRzKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBlbnN1cmUgZGlyIGlzIHRyYWNrZWQgKGhhcm1sZXNzIGlmIHJlZHVuZGFudClcbiAgICAgICAgcGFyZW50RGlyLmFkZChzeXNQYXRoLmJhc2VuYW1lKGRpcikpO1xuICAgICAgICB0aGlzLmZzdy5fZ2V0V2F0Y2hlZERpcihkaXIpO1xuICAgICAgICBsZXQgdGhyb3R0bGVyO1xuICAgICAgICBsZXQgY2xvc2VyO1xuICAgICAgICBjb25zdCBvRGVwdGggPSB0aGlzLmZzdy5vcHRpb25zLmRlcHRoO1xuICAgICAgICBpZiAoKG9EZXB0aCA9PSBudWxsIHx8IGRlcHRoIDw9IG9EZXB0aCkgJiYgIXRoaXMuZnN3Ll9zeW1saW5rUGF0aHMuaGFzKHJlYWxwYXRoKSkge1xuICAgICAgICAgICAgaWYgKCF0YXJnZXQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9oYW5kbGVSZWFkKGRpciwgaW5pdGlhbEFkZCwgd2gsIHRhcmdldCwgZGlyLCBkZXB0aCwgdGhyb3R0bGVyKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbG9zZXIgPSB0aGlzLl93YXRjaFdpdGhOb2RlRnMoZGlyLCAoZGlyUGF0aCwgc3RhdHMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBpZiBjdXJyZW50IGRpcmVjdG9yeSBpcyByZW1vdmVkLCBkbyBub3RoaW5nXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRzICYmIHN0YXRzLm10aW1lTXMgPT09IDApXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLl9oYW5kbGVSZWFkKGRpclBhdGgsIGZhbHNlLCB3aCwgdGFyZ2V0LCBkaXIsIGRlcHRoLCB0aHJvdHRsZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3NlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlIGFkZGVkIGZpbGUsIGRpcmVjdG9yeSwgb3IgZ2xvYiBwYXR0ZXJuLlxuICAgICAqIERlbGVnYXRlcyBjYWxsIHRvIF9oYW5kbGVGaWxlIC8gX2hhbmRsZURpciBhZnRlciBjaGVja3MuXG4gICAgICogQHBhcmFtIHBhdGggdG8gZmlsZSBvciBpclxuICAgICAqIEBwYXJhbSBpbml0aWFsQWRkIHdhcyB0aGUgZmlsZSBhZGRlZCBhdCB3YXRjaCBpbnN0YW50aWF0aW9uP1xuICAgICAqIEBwYXJhbSBwcmlvcldoIGRlcHRoIHJlbGF0aXZlIHRvIHVzZXItc3VwcGxpZWQgcGF0aFxuICAgICAqIEBwYXJhbSBkZXB0aCBDaGlsZCBwYXRoIGFjdHVhbGx5IHRhcmdldGVkIGZvciB3YXRjaFxuICAgICAqIEBwYXJhbSB0YXJnZXQgQ2hpbGQgcGF0aCBhY3R1YWxseSB0YXJnZXRlZCBmb3Igd2F0Y2hcbiAgICAgKi9cbiAgICBhc3luYyBfYWRkVG9Ob2RlRnMocGF0aCwgaW5pdGlhbEFkZCwgcHJpb3JXaCwgZGVwdGgsIHRhcmdldCkge1xuICAgICAgICBjb25zdCByZWFkeSA9IHRoaXMuZnN3Ll9lbWl0UmVhZHk7XG4gICAgICAgIGlmICh0aGlzLmZzdy5faXNJZ25vcmVkKHBhdGgpIHx8IHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aCA9IHRoaXMuZnN3Ll9nZXRXYXRjaEhlbHBlcnMocGF0aCk7XG4gICAgICAgIGlmIChwcmlvcldoKSB7XG4gICAgICAgICAgICB3aC5maWx0ZXJQYXRoID0gKGVudHJ5KSA9PiBwcmlvcldoLmZpbHRlclBhdGgoZW50cnkpO1xuICAgICAgICAgICAgd2guZmlsdGVyRGlyID0gKGVudHJ5KSA9PiBwcmlvcldoLmZpbHRlckRpcihlbnRyeSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXZhbHVhdGUgd2hhdCBpcyBhdCB0aGUgcGF0aCB3ZSdyZSBiZWluZyBhc2tlZCB0byB3YXRjaFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc3RhdHMgPSBhd2FpdCBzdGF0TWV0aG9kc1t3aC5zdGF0TWV0aG9kXSh3aC53YXRjaFBhdGgpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAodGhpcy5mc3cuX2lzSWdub3JlZCh3aC53YXRjaFBhdGgsIHN0YXRzKSkge1xuICAgICAgICAgICAgICAgIHJlYWR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZm9sbG93ID0gdGhpcy5mc3cub3B0aW9ucy5mb2xsb3dTeW1saW5rcztcbiAgICAgICAgICAgIGxldCBjbG9zZXI7XG4gICAgICAgICAgICBpZiAoc3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFic1BhdGggPSBzeXNQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IGZvbGxvdyA/IGF3YWl0IGZzcmVhbHBhdGgocGF0aCkgOiBwYXRoO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjbG9zZXIgPSBhd2FpdCB0aGlzLl9oYW5kbGVEaXIod2gud2F0Y2hQYXRoLCBzdGF0cywgaW5pdGlhbEFkZCwgZGVwdGgsIHRhcmdldCwgd2gsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyBwcmVzZXJ2ZSB0aGlzIHN5bWxpbmsncyB0YXJnZXQgcGF0aFxuICAgICAgICAgICAgICAgIGlmIChhYnNQYXRoICE9PSB0YXJnZXRQYXRoICYmIHRhcmdldFBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fc3ltbGlua1BhdGhzLnNldChhYnNQYXRoLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdGF0cy5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0UGF0aCA9IGZvbGxvdyA/IGF3YWl0IGZzcmVhbHBhdGgocGF0aCkgOiBwYXRoO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSBzeXNQYXRoLmRpcm5hbWUod2gud2F0Y2hQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZ2V0V2F0Y2hlZERpcihwYXJlbnQpLmFkZCh3aC53YXRjaFBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0KEVWLkFERCwgd2gud2F0Y2hQYXRoLCBzdGF0cyk7XG4gICAgICAgICAgICAgICAgY2xvc2VyID0gYXdhaXQgdGhpcy5faGFuZGxlRGlyKHBhcmVudCwgc3RhdHMsIGluaXRpYWxBZGQsIGRlcHRoLCBwYXRoLCB3aCwgdGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vIHByZXNlcnZlIHRoaXMgc3ltbGluaydzIHRhcmdldCBwYXRoXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFBhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fc3ltbGlua1BhdGhzLnNldChzeXNQYXRoLnJlc29sdmUocGF0aCksIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsb3NlciA9IHRoaXMuX2hhbmRsZUZpbGUod2gud2F0Y2hQYXRoLCBzdGF0cywgaW5pdGlhbEFkZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZWFkeSgpO1xuICAgICAgICAgICAgaWYgKGNsb3NlcilcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fYWRkUGF0aENsb3NlcihwYXRoLCBjbG9zZXIpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuZnN3Ll9oYW5kbGVFcnJvcihlcnJvcikpIHtcbiAgICAgICAgICAgICAgICByZWFkeSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXRoO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwgIi8qKlxuICogRGlzY292ZXIgdHdlYWtzIHVuZGVyIDx1c2VyUm9vdD4vdHdlYWtzLiBFYWNoIHR3ZWFrIGlzIGEgZGlyZWN0b3J5IHdpdGggYVxuICogbWFuaWZlc3QuanNvbiBhbmQgYW4gZW50cnkgc2NyaXB0LiBFbnRyeSByZXNvbHV0aW9uIGlzIG1hbmlmZXN0Lm1haW4gZmlyc3QsXG4gKiB0aGVuIGluZGV4LmpzLCBpbmRleC5tanMsIGFuZCBpbmRleC5janMuXG4gKlxuICogVGhlIG1hbmlmZXN0IGdhdGUgaXMgaW50ZW50aW9uYWxseSBzdHJpY3QuIEEgdHdlYWsgbXVzdCBpZGVudGlmeSBpdHMgR2l0SHViXG4gKiByZXBvc2l0b3J5IHNvIHRoZSBtYW5hZ2VyIGNhbiBjaGVjayByZWxlYXNlcyB3aXRob3V0IGdyYW50aW5nIHRoZSB0d2VhayBhblxuICogdXBkYXRlL2luc3RhbGwgY2hhbm5lbC4gVXBkYXRlIGNoZWNrcyBhcmUgYWR2aXNvcnkgb25seS5cbiAqL1xuaW1wb3J0IHsgcmVhZGRpclN5bmMsIHN0YXRTeW5jLCByZWFkRmlsZVN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlzY292ZXJlZFR3ZWFrIHtcbiAgZGlyOiBzdHJpbmc7XG4gIGVudHJ5OiBzdHJpbmc7XG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xufVxuXG5jb25zdCBFTlRSWV9DQU5ESURBVEVTID0gW1wiaW5kZXguanNcIiwgXCJpbmRleC5janNcIiwgXCJpbmRleC5tanNcIl07XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb3ZlclR3ZWFrcyh0d2Vha3NEaXI6IHN0cmluZyk6IERpc2NvdmVyZWRUd2Vha1tdIHtcbiAgaWYgKCFleGlzdHNTeW5jKHR3ZWFrc0RpcikpIHJldHVybiBbXTtcbiAgY29uc3Qgb3V0OiBEaXNjb3ZlcmVkVHdlYWtbXSA9IFtdO1xuICBmb3IgKGNvbnN0IG5hbWUgb2YgcmVhZGRpclN5bmModHdlYWtzRGlyKSkge1xuICAgIGNvbnN0IGRpciA9IGpvaW4odHdlYWtzRGlyLCBuYW1lKTtcbiAgICBpZiAoIXN0YXRTeW5jKGRpcikuaXNEaXJlY3RvcnkoKSkgY29udGludWU7XG4gICAgY29uc3QgbWFuaWZlc3RQYXRoID0gam9pbihkaXIsIFwibWFuaWZlc3QuanNvblwiKTtcbiAgICBpZiAoIWV4aXN0c1N5bmMobWFuaWZlc3RQYXRoKSkgY29udGludWU7XG4gICAgbGV0IG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xuICAgIHRyeSB7XG4gICAgICBtYW5pZmVzdCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1hbmlmZXN0UGF0aCwgXCJ1dGY4XCIpKSBhcyBUd2Vha01hbmlmZXN0O1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGlmICghaXNWYWxpZE1hbmlmZXN0KG1hbmlmZXN0KSkgY29udGludWU7XG4gICAgY29uc3QgZW50cnkgPSByZXNvbHZlRW50cnkoZGlyLCBtYW5pZmVzdCk7XG4gICAgaWYgKCFlbnRyeSkgY29udGludWU7XG4gICAgb3V0LnB1c2goeyBkaXIsIGVudHJ5LCBtYW5pZmVzdCB9KTtcbiAgfVxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkTWFuaWZlc3QobTogVHdlYWtNYW5pZmVzdCk6IGJvb2xlYW4ge1xuICBpZiAoIW0uaWQgfHwgIW0ubmFtZSB8fCAhbS52ZXJzaW9uIHx8ICFtLmdpdGh1YlJlcG8pIHJldHVybiBmYWxzZTtcbiAgaWYgKCEvXlthLXpBLVowLTkuXy1dK1xcL1thLXpBLVowLTkuXy1dKyQvLnRlc3QobS5naXRodWJSZXBvKSkgcmV0dXJuIGZhbHNlO1xuICBpZiAobS5zY29wZSAmJiAhW1wicmVuZGVyZXJcIiwgXCJtYWluXCIsIFwiYm90aFwiXS5pbmNsdWRlcyhtLnNjb3BlKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUVudHJ5KGRpcjogc3RyaW5nLCBtOiBUd2Vha01hbmlmZXN0KTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmIChtLm1haW4pIHtcbiAgICBjb25zdCBwID0gam9pbihkaXIsIG0ubWFpbik7XG4gICAgcmV0dXJuIGV4aXN0c1N5bmMocCkgPyBwIDogbnVsbDtcbiAgfVxuICBmb3IgKGNvbnN0IGMgb2YgRU5UUllfQ0FORElEQVRFUykge1xuICAgIGNvbnN0IHAgPSBqb2luKGRpciwgYyk7XG4gICAgaWYgKGV4aXN0c1N5bmMocCkpIHJldHVybiBwO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuIiwgIi8qKlxuICogRGlzay1iYWNrZWQga2V5L3ZhbHVlIHN0b3JhZ2UgZm9yIG1haW4tcHJvY2VzcyB0d2Vha3MuXG4gKlxuICogRWFjaCB0d2VhayBnZXRzIG9uZSBKU09OIGZpbGUgdW5kZXIgYDx1c2VyUm9vdD4vc3RvcmFnZS88aWQ+Lmpzb25gLlxuICogV3JpdGVzIGFyZSBkZWJvdW5jZWQgKDUwIG1zKSBhbmQgYXRvbWljICh3cml0ZSB0byA8ZmlsZT4udG1wIHRoZW4gcmVuYW1lKS5cbiAqIFJlYWRzIGFyZSBlYWdlciArIGNhY2hlZCBpbi1tZW1vcnk7IHdlIGxvYWQgb24gZmlyc3QgYWNjZXNzLlxuICovXG5pbXBvcnQge1xuICBleGlzdHNTeW5jLFxuICBta2RpclN5bmMsXG4gIHJlYWRGaWxlU3luYyxcbiAgcmVuYW1lU3luYyxcbiAgd3JpdGVGaWxlU3luYyxcbn0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlza1N0b3JhZ2Uge1xuICBnZXQ8VD4oa2V5OiBzdHJpbmcsIGRlZmF1bHRWYWx1ZT86IFQpOiBUO1xuICBzZXQoa2V5OiBzdHJpbmcsIHZhbHVlOiB1bmtub3duKTogdm9pZDtcbiAgZGVsZXRlKGtleTogc3RyaW5nKTogdm9pZDtcbiAgYWxsKCk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBmbHVzaCgpOiB2b2lkO1xufVxuXG5jb25zdCBGTFVTSF9ERUxBWV9NUyA9IDUwO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlza1N0b3JhZ2Uocm9vdERpcjogc3RyaW5nLCBpZDogc3RyaW5nKTogRGlza1N0b3JhZ2Uge1xuICBjb25zdCBkaXIgPSBqb2luKHJvb3REaXIsIFwic3RvcmFnZVwiKTtcbiAgbWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGZpbGUgPSBqb2luKGRpciwgYCR7c2FuaXRpemUoaWQpfS5qc29uYCk7XG5cbiAgbGV0IGRhdGE6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0ge307XG4gIGlmIChleGlzdHNTeW5jKGZpbGUpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGRhdGEgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhmaWxlLCBcInV0ZjhcIikpIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gQ29ycnVwdCBmaWxlIFx1MjAxNCBzdGFydCBmcmVzaCwgYnV0IGRvbid0IGNsb2JiZXIgdGhlIG9yaWdpbmFsIHVudGlsIHdlXG4gICAgICAvLyBzdWNjZXNzZnVsbHkgd3JpdGUgYWdhaW4uIChNb3ZlIGl0IGFzaWRlIGZvciBmb3JlbnNpY3MuKVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVuYW1lU3luYyhmaWxlLCBgJHtmaWxlfS5jb3JydXB0LSR7RGF0ZS5ub3coKX1gKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGRhdGEgPSB7fTtcbiAgICB9XG4gIH1cblxuICBsZXQgZGlydHkgPSBmYWxzZTtcbiAgbGV0IHRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IHNjaGVkdWxlRmx1c2ggPSAoKSA9PiB7XG4gICAgZGlydHkgPSB0cnVlO1xuICAgIGlmICh0aW1lcikgcmV0dXJuO1xuICAgIHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgICBpZiAoZGlydHkpIGZsdXNoKCk7XG4gICAgfSwgRkxVU0hfREVMQVlfTVMpO1xuICB9O1xuXG4gIGNvbnN0IGZsdXNoID0gKCk6IHZvaWQgPT4ge1xuICAgIGlmICghZGlydHkpIHJldHVybjtcbiAgICBjb25zdCB0bXAgPSBgJHtmaWxlfS50bXBgO1xuICAgIHRyeSB7XG4gICAgICB3cml0ZUZpbGVTeW5jKHRtcCwgSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMiksIFwidXRmOFwiKTtcbiAgICAgIHJlbmFtZVN5bmModG1wLCBmaWxlKTtcbiAgICAgIGRpcnR5ID0gZmFsc2U7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgLy8gTGVhdmUgZGlydHk9dHJ1ZSBzbyBhIGZ1dHVyZSBmbHVzaCByZXRyaWVzLlxuICAgICAgY29uc29sZS5lcnJvcihcIltjb2RleC1wbHVzcGx1c10gc3RvcmFnZSBmbHVzaCBmYWlsZWQ6XCIsIGlkLCBlKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBnZXQ6IDxUPihrOiBzdHJpbmcsIGQ/OiBUKTogVCA9PlxuICAgICAgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGspID8gKGRhdGFba10gYXMgVCkgOiAoZCBhcyBUKSxcbiAgICBzZXQoaywgdikge1xuICAgICAgZGF0YVtrXSA9IHY7XG4gICAgICBzY2hlZHVsZUZsdXNoKCk7XG4gICAgfSxcbiAgICBkZWxldGUoaykge1xuICAgICAgaWYgKGsgaW4gZGF0YSkge1xuICAgICAgICBkZWxldGUgZGF0YVtrXTtcbiAgICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgfVxuICAgIH0sXG4gICAgYWxsOiAoKSA9PiAoeyAuLi5kYXRhIH0pLFxuICAgIGZsdXNoLFxuICB9O1xufVxuXG5mdW5jdGlvbiBzYW5pdGl6ZShpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gVHdlYWsgaWRzIGFyZSBhdXRob3ItY29udHJvbGxlZDsgY2xhbXAgdG8gYSBzYWZlIGZpbGVuYW1lLlxuICByZXR1cm4gaWQucmVwbGFjZSgvW15hLXpBLVowLTkuX0AtXS9nLCBcIl9cIik7XG59XG4iLCAiaW1wb3J0IHsgZXhpc3RzU3luYywgbWtkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB0eXBlIHsgVHdlYWtNY3BTZXJ2ZXIgfSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgTUNQX01BTkFHRURfU1RBUlQgPSBcIiMgQkVHSU4gQ09ERVgrKyBNQU5BR0VEIE1DUCBTRVJWRVJTXCI7XG5leHBvcnQgY29uc3QgTUNQX01BTkFHRURfRU5EID0gXCIjIEVORCBDT0RFWCsrIE1BTkFHRUQgTUNQIFNFUlZFUlNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBNY3BTeW5jVHdlYWsge1xuICBkaXI6IHN0cmluZztcbiAgbWFuaWZlc3Q6IHtcbiAgICBpZDogc3RyaW5nO1xuICAgIG1jcD86IFR3ZWFrTWNwU2VydmVyO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ1aWx0TWFuYWdlZE1jcEJsb2NrIHtcbiAgYmxvY2s6IHN0cmluZztcbiAgc2VydmVyTmFtZXM6IHN0cmluZ1tdO1xuICBza2lwcGVkU2VydmVyTmFtZXM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hbmFnZWRNY3BTeW5jUmVzdWx0IGV4dGVuZHMgQnVpbHRNYW5hZ2VkTWNwQmxvY2sge1xuICBjaGFuZ2VkOiBib29sZWFuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3luY01hbmFnZWRNY3BTZXJ2ZXJzKHtcbiAgY29uZmlnUGF0aCxcbiAgdHdlYWtzLFxufToge1xuICBjb25maWdQYXRoOiBzdHJpbmc7XG4gIHR3ZWFrczogTWNwU3luY1R3ZWFrW107XG59KTogTWFuYWdlZE1jcFN5bmNSZXN1bHQge1xuICBjb25zdCBjdXJyZW50ID0gZXhpc3RzU3luYyhjb25maWdQYXRoKSA/IHJlYWRGaWxlU3luYyhjb25maWdQYXRoLCBcInV0ZjhcIikgOiBcIlwiO1xuICBjb25zdCBidWlsdCA9IGJ1aWxkTWFuYWdlZE1jcEJsb2NrKHR3ZWFrcywgY3VycmVudCk7XG4gIGNvbnN0IG5leHQgPSBtZXJnZU1hbmFnZWRNY3BCbG9jayhjdXJyZW50LCBidWlsdC5ibG9jayk7XG5cbiAgaWYgKG5leHQgIT09IGN1cnJlbnQpIHtcbiAgICBta2RpclN5bmMoZGlybmFtZShjb25maWdQYXRoKSwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gICAgd3JpdGVGaWxlU3luYyhjb25maWdQYXRoLCBuZXh0LCBcInV0ZjhcIik7XG4gIH1cblxuICByZXR1cm4geyAuLi5idWlsdCwgY2hhbmdlZDogbmV4dCAhPT0gY3VycmVudCB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRNYW5hZ2VkTWNwQmxvY2soXG4gIHR3ZWFrczogTWNwU3luY1R3ZWFrW10sXG4gIGV4aXN0aW5nVG9tbCA9IFwiXCIsXG4pOiBCdWlsdE1hbmFnZWRNY3BCbG9jayB7XG4gIGNvbnN0IG1hbnVhbFRvbWwgPSBzdHJpcE1hbmFnZWRNY3BCbG9jayhleGlzdGluZ1RvbWwpO1xuICBjb25zdCBtYW51YWxOYW1lcyA9IGZpbmRNY3BTZXJ2ZXJOYW1lcyhtYW51YWxUb21sKTtcbiAgY29uc3QgdXNlZE5hbWVzID0gbmV3IFNldChtYW51YWxOYW1lcyk7XG4gIGNvbnN0IHNlcnZlck5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBza2lwcGVkU2VydmVyTmFtZXM6IHN0cmluZ1tdID0gW107XG4gIGNvbnN0IGVudHJpZXM6IHN0cmluZ1tdID0gW107XG5cbiAgZm9yIChjb25zdCB0d2VhayBvZiB0d2Vha3MpIHtcbiAgICBjb25zdCBtY3AgPSBub3JtYWxpemVNY3BTZXJ2ZXIodHdlYWsubWFuaWZlc3QubWNwKTtcbiAgICBpZiAoIW1jcCkgY29udGludWU7XG5cbiAgICBjb25zdCBiYXNlTmFtZSA9IG1jcFNlcnZlck5hbWVGcm9tVHdlYWtJZCh0d2Vhay5tYW5pZmVzdC5pZCk7XG4gICAgaWYgKG1hbnVhbE5hbWVzLmhhcyhiYXNlTmFtZSkpIHtcbiAgICAgIHNraXBwZWRTZXJ2ZXJOYW1lcy5wdXNoKGJhc2VOYW1lKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGNvbnN0IHNlcnZlck5hbWUgPSByZXNlcnZlVW5pcXVlTmFtZShiYXNlTmFtZSwgdXNlZE5hbWVzKTtcbiAgICBzZXJ2ZXJOYW1lcy5wdXNoKHNlcnZlck5hbWUpO1xuICAgIGVudHJpZXMucHVzaChmb3JtYXRNY3BTZXJ2ZXIoc2VydmVyTmFtZSwgdHdlYWsuZGlyLCBtY3ApKTtcbiAgfVxuXG4gIGlmIChlbnRyaWVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB7IGJsb2NrOiBcIlwiLCBzZXJ2ZXJOYW1lcywgc2tpcHBlZFNlcnZlck5hbWVzIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGJsb2NrOiBbTUNQX01BTkFHRURfU1RBUlQsIC4uLmVudHJpZXMsIE1DUF9NQU5BR0VEX0VORF0uam9pbihcIlxcblwiKSxcbiAgICBzZXJ2ZXJOYW1lcyxcbiAgICBza2lwcGVkU2VydmVyTmFtZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZU1hbmFnZWRNY3BCbG9jayhjdXJyZW50VG9tbDogc3RyaW5nLCBtYW5hZ2VkQmxvY2s6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICghbWFuYWdlZEJsb2NrICYmICFjdXJyZW50VG9tbC5pbmNsdWRlcyhNQ1BfTUFOQUdFRF9TVEFSVCkpIHJldHVybiBjdXJyZW50VG9tbDtcbiAgY29uc3Qgc3RyaXBwZWQgPSBzdHJpcE1hbmFnZWRNY3BCbG9jayhjdXJyZW50VG9tbCkudHJpbUVuZCgpO1xuICBpZiAoIW1hbmFnZWRCbG9jaykgcmV0dXJuIHN0cmlwcGVkID8gYCR7c3RyaXBwZWR9XFxuYCA6IFwiXCI7XG4gIHJldHVybiBgJHtzdHJpcHBlZCA/IGAke3N0cmlwcGVkfVxcblxcbmAgOiBcIlwifSR7bWFuYWdlZEJsb2NrfVxcbmA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcE1hbmFnZWRNY3BCbG9jayh0b21sOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBwYXR0ZXJuID0gbmV3IFJlZ0V4cChcbiAgICBgXFxcXG4/JHtlc2NhcGVSZWdFeHAoTUNQX01BTkFHRURfU1RBUlQpfVtcXFxcc1xcXFxTXSo/JHtlc2NhcGVSZWdFeHAoTUNQX01BTkFHRURfRU5EKX1cXFxcbj9gLFxuICAgIFwiZ1wiLFxuICApO1xuICByZXR1cm4gdG9tbC5yZXBsYWNlKHBhdHRlcm4sIFwiXFxuXCIpLnJlcGxhY2UoL1xcbnszLH0vZywgXCJcXG5cXG5cIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtY3BTZXJ2ZXJOYW1lRnJvbVR3ZWFrSWQoaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHdpdGhvdXRQdWJsaXNoZXIgPSBpZC5yZXBsYWNlKC9eY29cXC5iZW5uZXR0XFwuLywgXCJcIik7XG4gIGNvbnN0IHNsdWcgPSB3aXRob3V0UHVibGlzaGVyXG4gICAgLnJlcGxhY2UoL1teYS16QS1aMC05Xy1dKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi0rfC0rJC9nLCBcIlwiKVxuICAgIC50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gc2x1ZyB8fCBcInR3ZWFrLW1jcFwiO1xufVxuXG5mdW5jdGlvbiBmaW5kTWNwU2VydmVyTmFtZXModG9tbDogc3RyaW5nKTogU2V0PHN0cmluZz4ge1xuICBjb25zdCBuYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBjb25zdCB0YWJsZVBhdHRlcm4gPSAvXlxccypcXFttY3Bfc2VydmVyc1xcLihbXlxcXVxcc10rKVxcXVxccyokL2dtO1xuICBsZXQgbWF0Y2g6IFJlZ0V4cEV4ZWNBcnJheSB8IG51bGw7XG4gIHdoaWxlICgobWF0Y2ggPSB0YWJsZVBhdHRlcm4uZXhlYyh0b21sKSkgIT09IG51bGwpIHtcbiAgICBuYW1lcy5hZGQodW5xdW90ZVRvbWxLZXkobWF0Y2hbMV0gPz8gXCJcIikpO1xuICB9XG4gIHJldHVybiBuYW1lcztcbn1cblxuZnVuY3Rpb24gcmVzZXJ2ZVVuaXF1ZU5hbWUoYmFzZU5hbWU6IHN0cmluZywgdXNlZE5hbWVzOiBTZXQ8c3RyaW5nPik6IHN0cmluZyB7XG4gIGlmICghdXNlZE5hbWVzLmhhcyhiYXNlTmFtZSkpIHtcbiAgICB1c2VkTmFtZXMuYWRkKGJhc2VOYW1lKTtcbiAgICByZXR1cm4gYmFzZU5hbWU7XG4gIH1cbiAgZm9yIChsZXQgaSA9IDI7IDsgaSArPSAxKSB7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gYCR7YmFzZU5hbWV9LSR7aX1gO1xuICAgIGlmICghdXNlZE5hbWVzLmhhcyhjYW5kaWRhdGUpKSB7XG4gICAgICB1c2VkTmFtZXMuYWRkKGNhbmRpZGF0ZSk7XG4gICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBub3JtYWxpemVNY3BTZXJ2ZXIodmFsdWU6IFR3ZWFrTWNwU2VydmVyIHwgdW5kZWZpbmVkKTogVHdlYWtNY3BTZXJ2ZXIgfCBudWxsIHtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUuY29tbWFuZCAhPT0gXCJzdHJpbmdcIiB8fCB2YWx1ZS5jb21tYW5kLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG51bGw7XG4gIGlmICh2YWx1ZS5hcmdzICE9PSB1bmRlZmluZWQgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUuYXJncykpIHJldHVybiBudWxsO1xuICBpZiAodmFsdWUuYXJncz8uc29tZSgoYXJnKSA9PiB0eXBlb2YgYXJnICE9PSBcInN0cmluZ1wiKSkgcmV0dXJuIG51bGw7XG4gIGlmICh2YWx1ZS5lbnYgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICghdmFsdWUuZW52IHx8IHR5cGVvZiB2YWx1ZS5lbnYgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZS5lbnYpKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoT2JqZWN0LnZhbHVlcyh2YWx1ZS5lbnYpLnNvbWUoKGVudlZhbHVlKSA9PiB0eXBlb2YgZW52VmFsdWUgIT09IFwic3RyaW5nXCIpKSByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdE1jcFNlcnZlcihzZXJ2ZXJOYW1lOiBzdHJpbmcsIHR3ZWFrRGlyOiBzdHJpbmcsIG1jcDogVHdlYWtNY3BTZXJ2ZXIpOiBzdHJpbmcge1xuICBjb25zdCBsaW5lcyA9IFtcbiAgICBgW21jcF9zZXJ2ZXJzLiR7Zm9ybWF0VG9tbEtleShzZXJ2ZXJOYW1lKX1dYCxcbiAgICBgY29tbWFuZCA9ICR7Zm9ybWF0VG9tbFN0cmluZyhyZXNvbHZlQ29tbWFuZCh0d2Vha0RpciwgbWNwLmNvbW1hbmQpKX1gLFxuICBdO1xuXG4gIGlmIChtY3AuYXJncyAmJiBtY3AuYXJncy5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChgYXJncyA9ICR7Zm9ybWF0VG9tbFN0cmluZ0FycmF5KG1jcC5hcmdzLm1hcCgoYXJnKSA9PiByZXNvbHZlQXJnKHR3ZWFrRGlyLCBhcmcpKSl9YCk7XG4gIH1cblxuICBpZiAobWNwLmVudiAmJiBPYmplY3Qua2V5cyhtY3AuZW52KS5sZW5ndGggPiAwKSB7XG4gICAgbGluZXMucHVzaChgZW52ID0gJHtmb3JtYXRUb21sSW5saW5lVGFibGUobWNwLmVudil9YCk7XG4gIH1cblxuICByZXR1cm4gbGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUNvbW1hbmQodHdlYWtEaXI6IHN0cmluZywgY29tbWFuZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKGlzQWJzb2x1dGUoY29tbWFuZCkgfHwgIWxvb2tzTGlrZVJlbGF0aXZlUGF0aChjb21tYW5kKSkgcmV0dXJuIGNvbW1hbmQ7XG4gIHJldHVybiByZXNvbHZlKHR3ZWFrRGlyLCBjb21tYW5kKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUFyZyh0d2Vha0Rpcjogc3RyaW5nLCBhcmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChpc0Fic29sdXRlKGFyZykgfHwgYXJnLnN0YXJ0c1dpdGgoXCItXCIpKSByZXR1cm4gYXJnO1xuICBjb25zdCBjYW5kaWRhdGUgPSByZXNvbHZlKHR3ZWFrRGlyLCBhcmcpO1xuICByZXR1cm4gZXhpc3RzU3luYyhjYW5kaWRhdGUpID8gY2FuZGlkYXRlIDogYXJnO1xufVxuXG5mdW5jdGlvbiBsb29rc0xpa2VSZWxhdGl2ZVBhdGgodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gdmFsdWUuc3RhcnRzV2l0aChcIi4vXCIpIHx8IHZhbHVlLnN0YXJ0c1dpdGgoXCIuLi9cIikgfHwgdmFsdWUuaW5jbHVkZXMoXCIvXCIpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUb21sU3RyaW5nKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUb21sU3RyaW5nQXJyYXkodmFsdWVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBgWyR7dmFsdWVzLm1hcChmb3JtYXRUb21sU3RyaW5nKS5qb2luKFwiLCBcIil9XWA7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdFRvbWxJbmxpbmVUYWJsZShyZWNvcmQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gYHsgJHtPYmplY3QuZW50cmllcyhyZWNvcmQpXG4gICAgLm1hcCgoW2tleSwgdmFsdWVdKSA9PiBgJHtmb3JtYXRUb21sS2V5KGtleSl9ID0gJHtmb3JtYXRUb21sU3RyaW5nKHZhbHVlKX1gKVxuICAgIC5qb2luKFwiLCBcIil9IH1gO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUb21sS2V5KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIC9eW2EtekEtWjAtOV8tXSskLy50ZXN0KGtleSkgPyBrZXkgOiBmb3JtYXRUb21sU3RyaW5nKGtleSk7XG59XG5cbmZ1bmN0aW9uIHVucXVvdGVUb21sS2V5KGtleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKCFrZXkuc3RhcnRzV2l0aCgnXCInKSB8fCAha2V5LmVuZHNXaXRoKCdcIicpKSByZXR1cm4ga2V5O1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGtleSkgYXMgc3RyaW5nO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4ga2V5O1xuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZVJlZ0V4cCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1suKis/XiR7fSgpfFtcXF1cXFxcXS9nLCBcIlxcXFwkJlwiKTtcbn1cbiIsICJpbXBvcnQgeyBleGVjRmlsZVN5bmMgfSBmcm9tIFwibm9kZTpjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgaG9tZWRpciwgcGxhdGZvcm0gfSBmcm9tIFwibm9kZTpvc1wiO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gXCJub2RlOnBhdGhcIjtcblxudHlwZSBDaGVja1N0YXR1cyA9IFwib2tcIiB8IFwid2FyblwiIHwgXCJlcnJvclwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZXJIZWFsdGhDaGVjayB7XG4gIG5hbWU6IHN0cmluZztcbiAgc3RhdHVzOiBDaGVja1N0YXR1cztcbiAgZGV0YWlsOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2F0Y2hlckhlYWx0aCB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICBzdGF0dXM6IENoZWNrU3RhdHVzO1xuICB0aXRsZTogc3RyaW5nO1xuICBzdW1tYXJ5OiBzdHJpbmc7XG4gIHdhdGNoZXI6IHN0cmluZztcbiAgY2hlY2tzOiBXYXRjaGVySGVhbHRoQ2hlY2tbXTtcbn1cblxuaW50ZXJmYWNlIEluc3RhbGxlclN0YXRlIHtcbiAgYXBwUm9vdD86IHN0cmluZztcbiAgdmVyc2lvbj86IHN0cmluZztcbiAgd2F0Y2hlcj86IFwibGF1bmNoZFwiIHwgXCJsb2dpbi1pdGVtXCIgfCBcInNjaGVkdWxlZC10YXNrXCIgfCBcInN5c3RlbWRcIiB8IFwibm9uZVwiO1xufVxuXG5pbnRlcmZhY2UgUnVudGltZUNvbmZpZyB7XG4gIGNvZGV4UGx1c1BsdXM/OiB7XG4gICAgYXV0b1VwZGF0ZT86IGJvb2xlYW47XG4gIH07XG59XG5cbmludGVyZmFjZSBTZWxmVXBkYXRlU3RhdGUge1xuICBzdGF0dXM/OiBcImNoZWNraW5nXCIgfCBcInVwLXRvLWRhdGVcIiB8IFwidXBkYXRlZFwiIHwgXCJmYWlsZWRcIiB8IFwiZGlzYWJsZWRcIjtcbiAgY29tcGxldGVkQXQ/OiBzdHJpbmc7XG4gIGNoZWNrZWRBdD86IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbj86IHN0cmluZyB8IG51bGw7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5jb25zdCBMQVVOQ0hEX0xBQkVMID0gXCJjb20uY29kZXhwbHVzcGx1cy53YXRjaGVyXCI7XG5jb25zdCBXQVRDSEVSX0xPRyA9IGpvaW4oaG9tZWRpcigpLCBcIkxpYnJhcnlcIiwgXCJMb2dzXCIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci5sb2dcIik7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXYXRjaGVySGVhbHRoKHVzZXJSb290OiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoIHtcbiAgY29uc3QgY2hlY2tzOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSA9IFtdO1xuICBjb25zdCBzdGF0ZSA9IHJlYWRKc29uPEluc3RhbGxlclN0YXRlPihqb2luKHVzZXJSb290LCBcInN0YXRlLmpzb25cIikpO1xuICBjb25zdCBjb25maWcgPSByZWFkSnNvbjxSdW50aW1lQ29uZmlnPihqb2luKHVzZXJSb290LCBcImNvbmZpZy5qc29uXCIpKSA/PyB7fTtcbiAgY29uc3Qgc2VsZlVwZGF0ZSA9IHJlYWRKc29uPFNlbGZVcGRhdGVTdGF0ZT4oam9pbih1c2VyUm9vdCwgXCJzZWxmLXVwZGF0ZS1zdGF0ZS5qc29uXCIpKTtcblxuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJJbnN0YWxsIHN0YXRlXCIsXG4gICAgc3RhdHVzOiBzdGF0ZSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IHN0YXRlID8gYENvZGV4KysgJHtzdGF0ZS52ZXJzaW9uID8/IFwiKHVua25vd24gdmVyc2lvbilcIn1gIDogXCJzdGF0ZS5qc29uIGlzIG1pc3NpbmdcIixcbiAgfSk7XG5cbiAgaWYgKCFzdGF0ZSkgcmV0dXJuIHN1bW1hcml6ZShcIm5vbmVcIiwgY2hlY2tzKTtcblxuICBjb25zdCBhdXRvVXBkYXRlID0gY29uZmlnLmNvZGV4UGx1c1BsdXM/LmF1dG9VcGRhdGUgIT09IGZhbHNlO1xuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJBdXRvbWF0aWMgcmVmcmVzaFwiLFxuICAgIHN0YXR1czogYXV0b1VwZGF0ZSA/IFwib2tcIiA6IFwid2FyblwiLFxuICAgIGRldGFpbDogYXV0b1VwZGF0ZSA/IFwiZW5hYmxlZFwiIDogXCJkaXNhYmxlZCBpbiBDb2RleCsrIGNvbmZpZ1wiLFxuICB9KTtcblxuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJXYXRjaGVyIGtpbmRcIixcbiAgICBzdGF0dXM6IHN0YXRlLndhdGNoZXIgJiYgc3RhdGUud2F0Y2hlciAhPT0gXCJub25lXCIgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgZGV0YWlsOiBzdGF0ZS53YXRjaGVyID8/IFwibm9uZVwiLFxuICB9KTtcblxuICBpZiAoc2VsZlVwZGF0ZSkge1xuICAgIGNoZWNrcy5wdXNoKHNlbGZVcGRhdGVDaGVjayhzZWxmVXBkYXRlKSk7XG4gIH1cblxuICBjb25zdCBhcHBSb290ID0gc3RhdGUuYXBwUm9vdCA/PyBcIlwiO1xuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJDb2RleCBhcHBcIixcbiAgICBzdGF0dXM6IGFwcFJvb3QgJiYgZXhpc3RzU3luYyhhcHBSb290KSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IGFwcFJvb3QgfHwgXCJtaXNzaW5nIGFwcFJvb3QgaW4gc3RhdGVcIixcbiAgfSk7XG5cbiAgc3dpdGNoIChwbGF0Zm9ybSgpKSB7XG4gICAgY2FzZSBcImRhcndpblwiOlxuICAgICAgY2hlY2tzLnB1c2goLi4uY2hlY2tMYXVuY2hkV2F0Y2hlcihhcHBSb290KSk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFwibGludXhcIjpcbiAgICAgIGNoZWNrcy5wdXNoKC4uLmNoZWNrU3lzdGVtZFdhdGNoZXIoYXBwUm9vdCkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcIndpbjMyXCI6XG4gICAgICBjaGVja3MucHVzaCguLi5jaGVja1NjaGVkdWxlZFRhc2tXYXRjaGVyKCkpO1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNoZWNrcy5wdXNoKHtcbiAgICAgICAgbmFtZTogXCJQbGF0Zm9ybSB3YXRjaGVyXCIsXG4gICAgICAgIHN0YXR1czogXCJ3YXJuXCIsXG4gICAgICAgIGRldGFpbDogYHVuc3VwcG9ydGVkIHBsYXRmb3JtOiAke3BsYXRmb3JtKCl9YCxcbiAgICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHN1bW1hcml6ZShzdGF0ZS53YXRjaGVyID8/IFwibm9uZVwiLCBjaGVja3MpO1xufVxuXG5mdW5jdGlvbiBzZWxmVXBkYXRlQ2hlY2soc3RhdGU6IFNlbGZVcGRhdGVTdGF0ZSk6IFdhdGNoZXJIZWFsdGhDaGVjayB7XG4gIGNvbnN0IGF0ID0gc3RhdGUuY29tcGxldGVkQXQgPz8gc3RhdGUuY2hlY2tlZEF0ID8/IFwidW5rbm93biB0aW1lXCI7XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZmFpbGVkXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogXCJsYXN0IENvZGV4KysgdXBkYXRlXCIsXG4gICAgICBzdGF0dXM6IFwid2FyblwiLFxuICAgICAgZGV0YWlsOiBzdGF0ZS5lcnJvciA/IGBmYWlsZWQgJHthdH06ICR7c3RhdGUuZXJyb3J9YCA6IGBmYWlsZWQgJHthdH1gLFxuICAgIH07XG4gIH1cbiAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gXCJkaXNhYmxlZFwiKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJsYXN0IENvZGV4KysgdXBkYXRlXCIsIHN0YXR1czogXCJ3YXJuXCIsIGRldGFpbDogYHNraXBwZWQgJHthdH06IGF1dG9tYXRpYyByZWZyZXNoIGRpc2FibGVkYCB9O1xuICB9XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwidXBkYXRlZFwiKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJsYXN0IENvZGV4KysgdXBkYXRlXCIsIHN0YXR1czogXCJva1wiLCBkZXRhaWw6IGB1cGRhdGVkICR7YXR9IHRvICR7c3RhdGUubGF0ZXN0VmVyc2lvbiA/PyBcIm5ldyByZWxlYXNlXCJ9YCB9O1xuICB9XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwidXAtdG8tZGF0ZVwiKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJsYXN0IENvZGV4KysgdXBkYXRlXCIsIHN0YXR1czogXCJva1wiLCBkZXRhaWw6IGB1cCB0byBkYXRlICR7YXR9YCB9O1xuICB9XG4gIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwid2FyblwiLCBkZXRhaWw6IGBjaGVja2luZyBzaW5jZSAke2F0fWAgfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tMYXVuY2hkV2F0Y2hlcihhcHBSb290OiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSB7XG4gIGNvbnN0IGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW10gPSBbXTtcbiAgY29uc3QgcGxpc3RQYXRoID0gam9pbihob21lZGlyKCksIFwiTGlicmFyeVwiLCBcIkxhdW5jaEFnZW50c1wiLCBgJHtMQVVOQ0hEX0xBQkVMfS5wbGlzdGApO1xuICBjb25zdCBwbGlzdCA9IGV4aXN0c1N5bmMocGxpc3RQYXRoKSA/IHJlYWRGaWxlU2FmZShwbGlzdFBhdGgpIDogXCJcIjtcbiAgY29uc3QgYXNhclBhdGggPSBhcHBSb290ID8gam9pbihhcHBSb290LCBcIkNvbnRlbnRzXCIsIFwiUmVzb3VyY2VzXCIsIFwiYXBwLmFzYXJcIikgOiBcIlwiO1xuXG4gIGNoZWNrcy5wdXNoKHtcbiAgICBuYW1lOiBcImxhdW5jaGQgcGxpc3RcIixcbiAgICBzdGF0dXM6IHBsaXN0ID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgIGRldGFpbDogcGxpc3RQYXRoLFxuICB9KTtcblxuICBpZiAocGxpc3QpIHtcbiAgICBjaGVja3MucHVzaCh7XG4gICAgICBuYW1lOiBcImxhdW5jaGQgbGFiZWxcIixcbiAgICAgIHN0YXR1czogcGxpc3QuaW5jbHVkZXMoTEFVTkNIRF9MQUJFTCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IExBVU5DSERfTEFCRUwsXG4gICAgfSk7XG4gICAgY2hlY2tzLnB1c2goe1xuICAgICAgbmFtZTogXCJsYXVuY2hkIHRyaWdnZXJcIixcbiAgICAgIHN0YXR1czogYXNhclBhdGggJiYgcGxpc3QuaW5jbHVkZXMoYXNhclBhdGgpID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgICAgZGV0YWlsOiBhc2FyUGF0aCB8fCBcIm1pc3NpbmcgYXBwUm9vdFwiLFxuICAgIH0pO1xuICAgIGNoZWNrcy5wdXNoKHtcbiAgICAgIG5hbWU6IFwid2F0Y2hlciBjb21tYW5kXCIsXG4gICAgICBzdGF0dXM6IHBsaXN0LmluY2x1ZGVzKFwiQ09ERVhfUExVU1BMVVNfV0FUQ0hFUj0xXCIpICYmIHBsaXN0LmluY2x1ZGVzKFwiIHVwZGF0ZSAtLXdhdGNoZXIgLS1xdWlldFwiKVxuICAgICAgICA/IFwib2tcIlxuICAgICAgICA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogY29tbWFuZFN1bW1hcnkocGxpc3QpLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY2xpUGF0aCA9IGV4dHJhY3RGaXJzdChwbGlzdCwgLycoW14nXSpwYWNrYWdlc1xcL2luc3RhbGxlclxcL2Rpc3RcXC9jbGlcXC5qcyknLyk7XG4gICAgaWYgKGNsaVBhdGgpIHtcbiAgICAgIGNoZWNrcy5wdXNoKHtcbiAgICAgICAgbmFtZTogXCJyZXBhaXIgQ0xJXCIsXG4gICAgICAgIHN0YXR1czogZXhpc3RzU3luYyhjbGlQYXRoKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgICAgZGV0YWlsOiBjbGlQYXRoLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbG9hZGVkID0gY29tbWFuZFN1Y2NlZWRzKFwibGF1bmNoY3RsXCIsIFtcImxpc3RcIiwgTEFVTkNIRF9MQUJFTF0pO1xuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJsYXVuY2hkIGxvYWRlZFwiLFxuICAgIHN0YXR1czogbG9hZGVkID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgIGRldGFpbDogbG9hZGVkID8gXCJzZXJ2aWNlIGlzIGxvYWRlZFwiIDogXCJsYXVuY2hjdGwgY2Fubm90IGZpbmQgdGhlIHdhdGNoZXJcIixcbiAgfSk7XG5cbiAgY2hlY2tzLnB1c2god2F0Y2hlckxvZ0NoZWNrKCkpO1xuICByZXR1cm4gY2hlY2tzO1xufVxuXG5mdW5jdGlvbiBjaGVja1N5c3RlbWRXYXRjaGVyKGFwcFJvb3Q6IHN0cmluZyk6IFdhdGNoZXJIZWFsdGhDaGVja1tdIHtcbiAgY29uc3QgZGlyID0gam9pbihob21lZGlyKCksIFwiLmNvbmZpZ1wiLCBcInN5c3RlbWRcIiwgXCJ1c2VyXCIpO1xuICBjb25zdCBzZXJ2aWNlID0gam9pbihkaXIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci5zZXJ2aWNlXCIpO1xuICBjb25zdCB0aW1lciA9IGpvaW4oZGlyLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIudGltZXJcIik7XG4gIGNvbnN0IHBhdGhVbml0ID0gam9pbihkaXIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci5wYXRoXCIpO1xuICBjb25zdCBleHBlY3RlZFBhdGggPSBhcHBSb290ID8gam9pbihhcHBSb290LCBcInJlc291cmNlc1wiLCBcImFwcC5hc2FyXCIpIDogXCJcIjtcbiAgY29uc3QgcGF0aEJvZHkgPSBleGlzdHNTeW5jKHBhdGhVbml0KSA/IHJlYWRGaWxlU2FmZShwYXRoVW5pdCkgOiBcIlwiO1xuXG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbmFtZTogXCJzeXN0ZW1kIHNlcnZpY2VcIixcbiAgICAgIHN0YXR1czogZXhpc3RzU3luYyhzZXJ2aWNlKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogc2VydmljZSxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwic3lzdGVtZCB0aW1lclwiLFxuICAgICAgc3RhdHVzOiBleGlzdHNTeW5jKHRpbWVyKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogdGltZXIsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcInN5c3RlbWQgcGF0aFwiLFxuICAgICAgc3RhdHVzOiBwYXRoQm9keSAmJiBleHBlY3RlZFBhdGggJiYgcGF0aEJvZHkuaW5jbHVkZXMoZXhwZWN0ZWRQYXRoKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogZXhwZWN0ZWRQYXRoIHx8IHBhdGhVbml0LFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJwYXRoIHVuaXQgYWN0aXZlXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInN5c3RlbWN0bFwiLCBbXCItLXVzZXJcIiwgXCJpcy1hY3RpdmVcIiwgXCItLXF1aWV0XCIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci5wYXRoXCJdKSA/IFwib2tcIiA6IFwid2FyblwiLFxuICAgICAgZGV0YWlsOiBcInN5c3RlbWN0bCAtLXVzZXIgaXMtYWN0aXZlIGNvZGV4LXBsdXNwbHVzLXdhdGNoZXIucGF0aFwiLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJ0aW1lciBhY3RpdmVcIixcbiAgICAgIHN0YXR1czogY29tbWFuZFN1Y2NlZWRzKFwic3lzdGVtY3RsXCIsIFtcIi0tdXNlclwiLCBcImlzLWFjdGl2ZVwiLCBcIi0tcXVpZXRcIiwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLnRpbWVyXCJdKSA/IFwib2tcIiA6IFwid2FyblwiLFxuICAgICAgZGV0YWlsOiBcInN5c3RlbWN0bCAtLXVzZXIgaXMtYWN0aXZlIGNvZGV4LXBsdXNwbHVzLXdhdGNoZXIudGltZXJcIixcbiAgICB9LFxuICBdO1xufVxuXG5mdW5jdGlvbiBjaGVja1NjaGVkdWxlZFRhc2tXYXRjaGVyKCk6IFdhdGNoZXJIZWFsdGhDaGVja1tdIHtcbiAgcmV0dXJuIFtcbiAgICB7XG4gICAgICBuYW1lOiBcImxvZ29uIHRhc2tcIixcbiAgICAgIHN0YXR1czogY29tbWFuZFN1Y2NlZWRzKFwic2NodGFza3MuZXhlXCIsIFtcIi9RdWVyeVwiLCBcIi9UTlwiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXJcIl0pID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgICAgZGV0YWlsOiBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXJcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwiaG91cmx5IHRhc2tcIixcbiAgICAgIHN0YXR1czogY29tbWFuZFN1Y2NlZWRzKFwic2NodGFza3MuZXhlXCIsIFtcIi9RdWVyeVwiLCBcIi9UTlwiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXItaG91cmx5XCJdKSA/IFwib2tcIiA6IFwid2FyblwiLFxuICAgICAgZGV0YWlsOiBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXItaG91cmx5XCIsXG4gICAgfSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gd2F0Y2hlckxvZ0NoZWNrKCk6IFdhdGNoZXJIZWFsdGhDaGVjayB7XG4gIGlmICghZXhpc3RzU3luYyhXQVRDSEVSX0xPRykpIHtcbiAgICByZXR1cm4geyBuYW1lOiBcIndhdGNoZXIgbG9nXCIsIHN0YXR1czogXCJ3YXJuXCIsIGRldGFpbDogXCJubyB3YXRjaGVyIGxvZyB5ZXRcIiB9O1xuICB9XG4gIGNvbnN0IHRhaWwgPSByZWFkRmlsZVNhZmUoV0FUQ0hFUl9MT0cpLnNwbGl0KC9cXHI/XFxuLykuc2xpY2UoLTQwKS5qb2luKFwiXFxuXCIpO1xuICByZXR1cm4gYW5hbHl6ZVdhdGNoZXJMb2dUYWlsKHRhaWwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYW5hbHl6ZVdhdGNoZXJMb2dUYWlsKHRhaWw6IHN0cmluZyk6IFdhdGNoZXJIZWFsdGhDaGVjayB7XG4gIGNvbnN0IGhhc0Vycm9yID0gL1x1MjcxNyBjb2RleC1wbHVzcGx1cyBmYWlsZWR8Y29kZXgtcGx1c3BsdXMgZmFpbGVkfGVycm9yfGZhaWxlZC9pLnRlc3QodGFpbCk7XG4gIGNvbnN0IG5lZWRzTWFudWFsUmVwYWlyID1cbiAgICBoYXNFcnJvciAmJlxuICAgIC9DYW5ub3Qgd3JpdGUgdG8gLipDb2RleC4qXFwuYXBwfEFwcCBNYW5hZ2VtZW50fGZpbGUgb3duZXJzaGlwfHN1ZG8gY29kZXhwbHVzcGx1cyAoPzppbnN0YWxsfHJlcGFpcil8RUFDQ0VTfEVQRVJNL2kudGVzdCh0YWlsKTtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBcIndhdGNoZXIgbG9nXCIsXG4gICAgc3RhdHVzOiBoYXNFcnJvciA/IFwid2FyblwiIDogXCJva1wiLFxuICAgIGRldGFpbDogaGFzRXJyb3JcbiAgICAgID8gbmVlZHNNYW51YWxSZXBhaXJcbiAgICAgICAgPyBcImF1dG8tcmVwYWlyIG5lZWRzIGFwcCBwZXJtaXNzaW9uczsgcnVuIGBjb2RleHBsdXNwbHVzIHJlcGFpcmAgZnJvbSBUZXJtaW5hbFwiXG4gICAgICAgIDogXCJyZWNlbnQgd2F0Y2hlciBsb2cgY29udGFpbnMgYW4gZXJyb3JcIlxuICAgICAgOiBXQVRDSEVSX0xPRyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc3VtbWFyaXplKHdhdGNoZXI6IHN0cmluZywgY2hlY2tzOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSk6IFdhdGNoZXJIZWFsdGgge1xuICBjb25zdCBoYXNFcnJvciA9IGNoZWNrcy5zb21lKChjKSA9PiBjLnN0YXR1cyA9PT0gXCJlcnJvclwiKTtcbiAgY29uc3QgaGFzV2FybiA9IGNoZWNrcy5zb21lKChjKSA9PiBjLnN0YXR1cyA9PT0gXCJ3YXJuXCIpO1xuICBjb25zdCBzdGF0dXM6IENoZWNrU3RhdHVzID0gaGFzRXJyb3IgPyBcImVycm9yXCIgOiBoYXNXYXJuID8gXCJ3YXJuXCIgOiBcIm9rXCI7XG4gIGNvbnN0IGZhaWxlZCA9IGNoZWNrcy5maWx0ZXIoKGMpID0+IGMuc3RhdHVzID09PSBcImVycm9yXCIpLmxlbmd0aDtcbiAgY29uc3Qgd2FybmVkID0gY2hlY2tzLmZpbHRlcigoYykgPT4gYy5zdGF0dXMgPT09IFwid2FyblwiKS5sZW5ndGg7XG4gIGNvbnN0IHRpdGxlID1cbiAgICBzdGF0dXMgPT09IFwib2tcIlxuICAgICAgPyBcIkF1dG8tcmVwYWlyIHdhdGNoZXIgaXMgcmVhZHlcIlxuICAgICAgOiBzdGF0dXMgPT09IFwid2FyblwiXG4gICAgICAgID8gXCJBdXRvLXJlcGFpciB3YXRjaGVyIG5lZWRzIHJldmlld1wiXG4gICAgICAgIDogXCJBdXRvLXJlcGFpciB3YXRjaGVyIGlzIG5vdCByZWFkeVwiO1xuICBjb25zdCBzdW1tYXJ5ID1cbiAgICBzdGF0dXMgPT09IFwib2tcIlxuICAgICAgPyBcIkNvZGV4Kysgc2hvdWxkIGF1dG9tYXRpY2FsbHkgcmVwYWlyIGl0c2VsZiBhZnRlciBDb2RleCB1cGRhdGVzLlwiXG4gICAgICA6IGAke2ZhaWxlZH0gZmFpbGluZyBjaGVjayhzKSwgJHt3YXJuZWR9IHdhcm5pbmcocykuYDtcblxuICByZXR1cm4ge1xuICAgIGNoZWNrZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIHN0YXR1cyxcbiAgICB0aXRsZSxcbiAgICBzdW1tYXJ5LFxuICAgIHdhdGNoZXIsXG4gICAgY2hlY2tzLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjb21tYW5kU3VjY2VlZHMoY29tbWFuZDogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICB0cnkge1xuICAgIGV4ZWNGaWxlU3luYyhjb21tYW5kLCBhcmdzLCB7IHN0ZGlvOiBcImlnbm9yZVwiLCB0aW1lb3V0OiA1XzAwMCB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbW1hbmRTdW1tYXJ5KHBsaXN0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBjb21tYW5kID0gZXh0cmFjdEZpcnN0KHBsaXN0LCAvPHN0cmluZz4oW148XSooPzp1cGRhdGUgLS13YXRjaGVyIC0tcXVpZXR8cmVwYWlyIC0tcXVpZXQpW148XSopPFxcL3N0cmluZz4vKTtcbiAgcmV0dXJuIGNvbW1hbmQgPyB1bmVzY2FwZVhtbChjb21tYW5kKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS50cmltKCkgOiBcIndhdGNoZXIgY29tbWFuZCBub3QgZm91bmRcIjtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEZpcnN0KHNvdXJjZTogc3RyaW5nLCBwYXR0ZXJuOiBSZWdFeHApOiBzdHJpbmcgfCBudWxsIHtcbiAgcmV0dXJuIHNvdXJjZS5tYXRjaChwYXR0ZXJuKT8uWzFdID8/IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlYWRKc29uPFQ+KHBhdGg6IHN0cmluZyk6IFQgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMocGF0aCwgXCJ1dGY4XCIpKSBhcyBUO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkRmlsZVNhZmUocGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVhZEZpbGVTeW5jKHBhdGgsIFwidXRmOFwiKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH1cbn1cblxuZnVuY3Rpb24gdW5lc2NhcGVYbWwodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgXCJcXFwiXCIpXG4gICAgLnJlcGxhY2UoLyZhcG9zOy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICAucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xufVxuIiwgImV4cG9ydCB0eXBlIFR3ZWFrU2NvcGUgPSBcInJlbmRlcmVyXCIgfCBcIm1haW5cIiB8IFwiYm90aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlbG9hZFR3ZWFrc0RlcHMge1xuICBsb2dJbmZvKG1lc3NhZ2U6IHN0cmluZyk6IHZvaWQ7XG4gIHN0b3BBbGxNYWluVHdlYWtzKCk6IHZvaWQ7XG4gIGNsZWFyVHdlYWtNb2R1bGVDYWNoZSgpOiB2b2lkO1xuICBsb2FkQWxsTWFpblR3ZWFrcygpOiB2b2lkO1xuICBicm9hZGNhc3RSZWxvYWQoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXRUd2Vha0VuYWJsZWRBbmRSZWxvYWREZXBzIGV4dGVuZHMgUmVsb2FkVHdlYWtzRGVwcyB7XG4gIHNldFR3ZWFrRW5hYmxlZChpZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzTWFpblByb2Nlc3NUd2Vha1Njb3BlKHNjb3BlOiBUd2Vha1Njb3BlIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gIHJldHVybiBzY29wZSAhPT0gXCJyZW5kZXJlclwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVsb2FkVHdlYWtzKHJlYXNvbjogc3RyaW5nLCBkZXBzOiBSZWxvYWRUd2Vha3NEZXBzKTogdm9pZCB7XG4gIGRlcHMubG9nSW5mbyhgcmVsb2FkaW5nIHR3ZWFrcyAoJHtyZWFzb259KWApO1xuICBkZXBzLnN0b3BBbGxNYWluVHdlYWtzKCk7XG4gIGRlcHMuY2xlYXJUd2Vha01vZHVsZUNhY2hlKCk7XG4gIGRlcHMubG9hZEFsbE1haW5Ud2Vha3MoKTtcbiAgZGVwcy5icm9hZGNhc3RSZWxvYWQoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZChcbiAgaWQ6IHN0cmluZyxcbiAgZW5hYmxlZDogdW5rbm93bixcbiAgZGVwczogU2V0VHdlYWtFbmFibGVkQW5kUmVsb2FkRGVwcyxcbik6IHRydWUge1xuICBjb25zdCBub3JtYWxpemVkRW5hYmxlZCA9ICEhZW5hYmxlZDtcbiAgZGVwcy5zZXRUd2Vha0VuYWJsZWQoaWQsIG5vcm1hbGl6ZWRFbmFibGVkKTtcbiAgZGVwcy5sb2dJbmZvKGB0d2VhayAke2lkfSBlbmFibGVkPSR7bm9ybWFsaXplZEVuYWJsZWR9YCk7XG4gIHJlbG9hZFR3ZWFrcyhcImVuYWJsZWQtdG9nZ2xlXCIsIGRlcHMpO1xuICByZXR1cm4gdHJ1ZTtcbn1cbiIsICJpbXBvcnQgeyBhcHBlbmRGaWxlU3luYywgY2xvc2VTeW5jLCBleGlzdHNTeW5jLCBvcGVuU3luYywgcmVhZFN5bmMsIHN0YXRTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcblxuZXhwb3J0IGNvbnN0IE1BWF9MT0dfQllURVMgPSAxMCAqIDEwMjQgKiAxMDI0O1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kQ2FwcGVkTG9nKHBhdGg6IHN0cmluZywgbGluZTogc3RyaW5nLCBtYXhCeXRlcyA9IE1BWF9MT0dfQllURVMpOiB2b2lkIHtcbiAgY29uc3QgaW5jb21pbmcgPSBCdWZmZXIuZnJvbShsaW5lKTtcbiAgaWYgKGluY29taW5nLmJ5dGVMZW5ndGggPj0gbWF4Qnl0ZXMpIHtcbiAgICB3cml0ZUZpbGVTeW5jKHBhdGgsIGluY29taW5nLnN1YmFycmF5KGluY29taW5nLmJ5dGVMZW5ndGggLSBtYXhCeXRlcykpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICAgIGNvbnN0IHNpemUgPSBzdGF0U3luYyhwYXRoKS5zaXplO1xuICAgICAgY29uc3QgYWxsb3dlZEV4aXN0aW5nID0gbWF4Qnl0ZXMgLSBpbmNvbWluZy5ieXRlTGVuZ3RoO1xuICAgICAgaWYgKHNpemUgPiBhbGxvd2VkRXhpc3RpbmcpIHtcbiAgICAgICAgLy8gTWFrZSByb29tIGluIGJhdGNoZXM6IHRyaW1taW5nIGp1c3QgZW5vdWdoIGZvciBvbmUgbGluZSBsZWF2ZXMgYVxuICAgICAgICAvLyBmdWxsIGZpbGUsIGZvcmNpbmcgZXZlcnkgc3Vic2VxdWVudCBsaW5lIHRvIHJld3JpdGUgdGhlIGVudGlyZSBsb2cuXG4gICAgICAgIGNvbnN0IGtlZXBCeXRlcyA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IobWF4Qnl0ZXMgLyAyKSAtIGluY29taW5nLmJ5dGVMZW5ndGgpO1xuICAgICAgICBjb25zdCB0YWlsID0gQnVmZmVyLmFsbG9jKGtlZXBCeXRlcyk7XG4gICAgICAgIGNvbnN0IGZkID0gb3BlblN5bmMocGF0aCwgXCJyXCIpO1xuICAgICAgICBsZXQgYnl0ZXNSZWFkID0gMDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB3aGlsZSAoYnl0ZXNSZWFkIDwga2VlcEJ5dGVzKSB7XG4gICAgICAgICAgICBjb25zdCBjb3VudCA9IHJlYWRTeW5jKGZkLCB0YWlsLCBieXRlc1JlYWQsIGtlZXBCeXRlcyAtIGJ5dGVzUmVhZCwgc2l6ZSAtIGtlZXBCeXRlcyArIGJ5dGVzUmVhZCk7XG4gICAgICAgICAgICBpZiAoY291bnQgPT09IDApIGJyZWFrO1xuICAgICAgICAgICAgYnl0ZXNSZWFkICs9IGNvdW50O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBjbG9zZVN5bmMoZmQpO1xuICAgICAgICB9XG4gICAgICAgIHdyaXRlRmlsZVN5bmMocGF0aCwgdGFpbC5zdWJhcnJheSgwLCBieXRlc1JlYWQpKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIElmIHRyaW1taW5nIGZhaWxzLCBzdGlsbCB0cnkgdG8gYXBwZW5kIGJlbG93OyBsb2dnaW5nIG11c3QgYmUgYmVzdC1lZmZvcnQuXG4gIH1cblxuICBhcHBlbmRGaWxlU3luYyhwYXRoLCBpbmNvbWluZyk7XG59XG4iLCAiaW1wb3J0IHsgYXBwLCBCcm93c2VyV2luZG93IH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUsIGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4Q2RwU3RhdHVzLFxuICBDb2RleENkcFRhcmdldCxcbiAgQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzLFxuICBDb2RleFJ1bnRpbWVJbmZvLFxuICBDb2RleFJ1bnRpbWVUeXBlLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bnRpbWVQcm9iZU9wdGlvbnMge1xuICB1c2VyUm9vdDogc3RyaW5nO1xuICBydW50aW1lRGlyOiBzdHJpbmc7XG4gIGNvZGV4VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgY2hhbm5lbDogc3RyaW5nIHwgbnVsbDtcbiAgZ2V0V2luZG93U2VydmljZXMoKTogdW5rbm93biB8IG51bGw7XG4gIGdldE5hdGl2ZUNhcGFiaWxpdGllcz8oKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1wibmF0aXZlXCJdO1xuICBnZXRWaWV3Q2FwYWJpbGl0aWVzPygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJ2aWV3c1wiXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJ1bnRpbWVJbmZvKG9wdHM6IFJ1bnRpbWVQcm9iZU9wdGlvbnMpOiBDb2RleFJ1bnRpbWVJbmZvIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBkZXRlY3RSdW50aW1lVHlwZSgpLFxuICAgIGNvZGV4VmVyc2lvbjogb3B0cy5jb2RleFZlcnNpb24gPz8gc2FmZUFwcFZlcnNpb24oKSxcbiAgICBjaGFubmVsOiBvcHRzLmNoYW5uZWwsXG4gICAgYnVpbGRGbGF2b3I6IHNhZmVCdWlsZEZsYXZvcigpLFxuICAgIHVzZXNPd2xBcHBTaGVsbDogbnVsbCxcbiAgICBhcHBQYXRoOiBzYWZlQXBwUGF0aCgpLFxuICAgIHJlc291cmNlc1BhdGg6IHByb2Nlc3MucmVzb3VyY2VzUGF0aCA/PyBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnVudGltZUNhcGFiaWxpdGllcyhvcHRzOiBSdW50aW1lUHJvYmVPcHRpb25zKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzIHtcbiAgY29uc3Qgc2VydmljZXMgPSBhc1JlY29yZChvcHRzLmdldFdpbmRvd1NlcnZpY2VzKCkpO1xuICBjb25zdCB3aW5kb3dNYW5hZ2VyID0gYXNSZWNvcmQoc2VydmljZXM/LndpbmRvd01hbmFnZXIpO1xuICBjb25zdCBjZHAgPSBnZXRDZHBTdGF0dXMoKTtcbiAgY29uc3QgbmF0aXZlID0gb3B0cy5nZXROYXRpdmVDYXBhYmlsaXRpZXM/LigpID8/IGRlZmF1bHROYXRpdmVDYXBhYmlsaXRpZXMoKTtcbiAgY29uc3Qgdmlld3MgPSBvcHRzLmdldFZpZXdDYXBhYmlsaXRpZXM/LigpID8/IGRlZmF1bHRWaWV3Q2FwYWJpbGl0aWVzKCk7XG4gIGNvbnN0IGNhbkNyZWF0ZVdpbmRvdyA9IHR5cGVvZiB3aW5kb3dNYW5hZ2VyPy5jcmVhdGVXaW5kb3cgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgIHR5cGVvZiBzZXJ2aWNlcz8uY3JlYXRlRnJlc2hXaW5kb3cgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgIHR5cGVvZiBzZXJ2aWNlcz8uY3JlYXRlRnJlc2hMb2NhbFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgdHlwZW9mIHNlcnZpY2VzPy5lbnN1cmVIb3N0V2luZG93ID09PSBcImZ1bmN0aW9uXCI7XG4gIHJldHVybiB7XG4gICAgd2luZG93czoge1xuICAgICAgY3JlYXRlOiBjYW5DcmVhdGVXaW5kb3csXG4gICAgICBmb2N1czogdHJ1ZSxcbiAgICAgIHByaW1hcnk6IHR5cGVvZiBzZXJ2aWNlcz8uZ2V0UHJpbWFyeVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiB3aW5kb3dNYW5hZ2VyPy5nZXRQcmltYXJ5V2luZG93ID09PSBcImZ1bmN0aW9uXCIsXG4gICAgICBicm93c2VyVmlldzogdHlwZW9mIHdpbmRvd01hbmFnZXI/LnJlZ2lzdGVyV2luZG93ID09PSBcImZ1bmN0aW9uXCIsXG4gICAgfSxcbiAgICB2aWV3cyxcbiAgICBjZHA6IHtcbiAgICAgIHN1cHBvcnRlZDogdHJ1ZSxcbiAgICAgIGVuYWJsZWQ6IGNkcC5lbmFibGVkLFxuICAgICAgcG9ydDogY2RwLnBvcnQsXG4gICAgfSxcbiAgICBuYXRpdmUsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDZHBTdGF0dXMoKTogQ29kZXhDZHBTdGF0dXMge1xuICBjb25zdCBlbmFibGVkID0gcHJvY2Vzcy5lbnYuQ09ERVhQUF9SRU1PVEVfREVCVUcgPT09IFwiMVwiO1xuICBjb25zdCBwb3J0ID0gcGFyc2VDZHBQb3J0KHByb2Nlc3MuZW52LkNPREVYUFBfUkVNT1RFX0RFQlVHX1BPUlQpO1xuICByZXR1cm4ge1xuICAgIHN1cHBvcnRlZDogdHJ1ZSxcbiAgICBlbmFibGVkLFxuICAgIHBvcnQ6IGVuYWJsZWQgPyBwb3J0IDogbnVsbCxcbiAgICB1cmw6IGVuYWJsZWQgPyBgaHR0cDovLzEyNy4wLjAuMToke3BvcnR9YCA6IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0Q2RwVGFyZ2V0cygpOiBQcm9taXNlPENvZGV4Q2RwVGFyZ2V0W10+IHtcbiAgY29uc3Qgc3RhdHVzID0gZ2V0Q2RwU3RhdHVzKCk7XG4gIGlmICghc3RhdHVzLmVuYWJsZWQgfHwgIXN0YXR1cy51cmwpIHJldHVybiBbXTtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAxMDAwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChgJHtzdGF0dXMudXJsfS9qc29uYCwgeyBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsIH0pO1xuICAgIGlmICghcmVzLm9rKSByZXR1cm4gW107XG4gICAgY29uc3Qgcm93cyA9IGF3YWl0IHJlcy5qc29uKCkgYXMgdW5rbm93bjtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkocm93cykpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcm93c1xuICAgICAgLm1hcCgocm93KSA9PiBub3JtYWxpemVDZHBUYXJnZXQocm93KSlcbiAgICAgIC5maWx0ZXIoKHJvdyk6IHJvdyBpcyBDb2RleENkcFRhcmdldCA9PiByb3cgIT09IG51bGwpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH0gZmluYWxseSB7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRldGVjdFJ1bnRpbWVUeXBlKCk6IENvZGV4UnVudGltZVR5cGUge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIikge1xuICAgIGNvbnN0IGFwcFJvb3QgPSBpbmZlck1hY0FwcFJvb3QoKTtcbiAgICBpZiAoYXBwUm9vdCAmJiBleGlzdHNTeW5jKGpvaW4oYXBwUm9vdCwgXCJDb250ZW50c1wiLCBcIkZyYW1ld29ya3NcIiwgXCJDb2RleCBGcmFtZXdvcmsuZnJhbWV3b3JrXCIpKSkge1xuICAgICAgcmV0dXJuIFwib3dsXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIGFwcFJvb3QgJiZcbiAgICAgIGV4aXN0c1N5bmMoam9pbihhcHBSb290LCBcIkNvbnRlbnRzXCIsIFwiRnJhbWV3b3Jrc1wiLCBcIkVsZWN0cm9uIEZyYW1ld29yay5mcmFtZXdvcmtcIikpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJlbGVjdHJvblwiO1xuICAgIH1cbiAgICBpZiAocHJvY2Vzcy5yZXNvdXJjZXNQYXRoICYmIGV4aXN0c1N5bmMoam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsIFwiYXBwLmFzYXJcIikpKSB7XG4gICAgICByZXR1cm4gXCJlbGVjdHJvblwiO1xuICAgIH1cbiAgICByZXR1cm4gXCJ1bmtub3duXCI7XG4gIH1cbiAgcmV0dXJuIHByb2Nlc3MucmVzb3VyY2VzUGF0aCAmJiBleGlzdHNTeW5jKGpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCBcImFwcC5hc2FyXCIpKVxuICAgID8gXCJlbGVjdHJvblwiXG4gICAgOiBcInVua25vd25cIjtcbn1cblxuZnVuY3Rpb24gaW5mZXJNYWNBcHBSb290KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBtYXJrZXIgPSBcIi5hcHAvQ29udGVudHMvTWFjT1MvXCI7XG4gIGNvbnN0IGlkeCA9IHByb2Nlc3MuZXhlY1BhdGguaW5kZXhPZihtYXJrZXIpO1xuICByZXR1cm4gaWR4ID49IDAgPyBwcm9jZXNzLmV4ZWNQYXRoLnNsaWNlKDAsIGlkeCArIFwiLmFwcFwiLmxlbmd0aCkgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBzYWZlQXBwVmVyc2lvbigpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXBwLmdldFZlcnNpb24oKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FmZUFwcFBhdGgoKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGFwcC5nZXRBcHBQYXRoKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBwcm9jZXNzLnJlc291cmNlc1BhdGggPyBqb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCwgXCJhcHAuYXNhclwiKSA6IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2FmZUJ1aWxkRmxhdm9yKCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBhcHBQYXRoID0gc2FmZUFwcFBhdGgoKTtcbiAgaWYgKCFhcHBQYXRoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcGFyZW50ID0gZGlybmFtZShhcHBQYXRoKTtcbiAgaWYgKHBhcmVudC5pbmNsdWRlcyhcIk5pZ2h0bHlcIikpIHJldHVybiBcIm5pZ2h0bHlcIjtcbiAgcmV0dXJuIGFwcC5pc1BhY2thZ2VkID8gXCJwcm9kXCIgOiBcImRldlwiO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNkcFBvcnQodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCk6IG51bWJlciB7XG4gIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSA/PyBcIjkyMjJcIik7XG4gIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlZCkgJiYgcGFyc2VkID4gMCAmJiBwYXJzZWQgPCA2NTUzNiA/IHBhcnNlZCA6IDkyMjI7XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHROYXRpdmVDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1wibmF0aXZlXCJdIHtcbiAgcmV0dXJuIHtcbiAgICBpblByb2Nlc3NNb2R1bGVzOiB0cnVlLFxuICAgIHN3aWZ0TW9kdWxlczogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIixcbiAgICBhcHBLaXRFbWJlZGRpbmc6IGZhbHNlLFxuICAgIGNoaWxkV2luZG93T3ZlcmxheTogZmFsc2UsXG4gICAgZGlyZWN0Vmlld0F0dGFjaDogZmFsc2UsXG4gICAgbWV0YWxWaWV3czogZmFsc2UsXG4gICAgbmF0aXZlSG9zdDogZmFsc2UsXG4gICAgaGVscGVyczogdHJ1ZSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdFZpZXdDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1widmlld3NcIl0ge1xuICByZXR1cm4ge1xuICAgIGNyZWF0ZTogZmFsc2UsXG4gICAgcHJpdmF0ZVZpZXdUcmVlOiBmYWxzZSxcbiAgICB3ZWJDb250ZW50c1ZpZXc6IGZhbHNlLFxuICAgIGJyb3dzZXJWaWV3RmFsbGJhY2s6IHR5cGVvZiBCcm93c2VyV2luZG93LmZyb21JZCA9PT0gXCJmdW5jdGlvblwiLFxuICB9O1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDZHBUYXJnZXQocm93OiB1bmtub3duKTogQ29kZXhDZHBUYXJnZXQgfCBudWxsIHtcbiAgY29uc3QgdmFsdWUgPSBhc1JlY29yZChyb3cpO1xuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZS5pZCAhPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgdmFsdWUudHlwZSAhPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgdmFsdWUudXJsICE9PSBcInN0cmluZ1wiKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogdmFsdWUuaWQsXG4gICAgdHlwZTogdmFsdWUudHlwZSxcbiAgICB1cmw6IHZhbHVlLnVybCxcbiAgICAuLi4odHlwZW9mIHZhbHVlLnRpdGxlID09PSBcInN0cmluZ1wiID8geyB0aXRsZTogdmFsdWUudGl0bGUgfSA6IHt9KSxcbiAgICAuLi4odHlwZW9mIHZhbHVlLndlYlNvY2tldERlYnVnZ2VyVXJsID09PSBcInN0cmluZ1wiXG4gICAgICA/IHsgd2ViU29ja2V0RGVidWdnZXJVcmw6IHZhbHVlLndlYlNvY2tldERlYnVnZ2VyVXJsIH1cbiAgICAgIDoge30pLFxuICB9O1xufVxuXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGw7XG59XG4iLCAiaW1wb3J0IHsgQnJvd3NlcldpbmRvdyB9IGZyb20gXCJlbGVjdHJvblwiO1xuaW1wb3J0IHsgc3Bhd24sIHR5cGUgQ2hpbGRQcm9jZXNzV2l0aG91dE51bGxTdHJlYW1zIH0gZnJvbSBcIm5vZGU6Y2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBjcmVhdGVJbnRlcmZhY2UgfSBmcm9tIFwibm9kZTpyZWFkbGluZVwiO1xuaW1wb3J0IHsgcmVzb2x2ZU5hdGl2ZVR3ZWFrUGF0aCB9IGZyb20gXCIuL25hdGl2ZS1wYXRoc1wiO1xuaW1wb3J0IHR5cGUge1xuICBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIE5hdGl2ZUhlbHBlckxhdW5jaE9wdGlvbnMsXG4gIE5hdGl2ZUhlbHBlclJlZixcbiAgTmF0aXZlTW9kdWxlS2luZCxcbiAgTmF0aXZlTW9kdWxlTG9hZE9wdGlvbnMsXG4gIE5hdGl2ZU1vZHVsZVJlZixcbiAgTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zLFxuICBOYXRpdmVQYW5lbFJlZixcbiAgTmF0aXZlVmlld0F0dGFjaE9wdGlvbnMsXG4gIE5hdGl2ZVZpZXdSZWYsXG59IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmF0aXZlVHdlYWtDb250ZXh0IHtcbiAgaWQ6IHN0cmluZztcbiAgZGlyOiBzdHJpbmc7XG59XG5cbnR5cGUgTmF0aXZlTG9nID0gKGxldmVsOiBcImluZm9cIiB8IFwid2FyblwiIHwgXCJlcnJvclwiLCAuLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmF0aXZlQnJpZGdlT3B0aW9ucyB7XG4gIG5hdGl2ZUhvc3RQYXRoPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgTG9hZGVkTmF0aXZlTW9kdWxlIHtcbiAga2V5OiBzdHJpbmc7XG4gIHR3ZWFrSWQ6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAga2luZDogTmF0aXZlTW9kdWxlS2luZDtcbiAgcGF0aDogc3RyaW5nO1xuICBleHBvcnRzOiB1bmtub3duO1xufVxuXG5pbnRlcmZhY2UgTmF0aXZlSW5zdGFuY2Uge1xuICBrZXk6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBpZDogc3RyaW5nO1xuICBraW5kOiBcInBhbmVsXCIgfCBcInZpZXdcIjtcbiAgdmFsdWU6IHVua25vd247XG4gIHBhcmVudFdpbmRvd0lkOiBudW1iZXIgfCBudWxsO1xuICB3aW5kb3dJZDogbnVtYmVyIHwgbnVsbDtcbiAgZGlzcG9zZUJpbmRpbmdzOiBBcnJheTwoKSA9PiB2b2lkPjtcbiAgZGlzcG9zaW5nOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSGVscGVyUmVxdWVzdCB7XG4gIHJlc29sdmUodmFsdWU6IHVua25vd24pOiB2b2lkO1xuICByZWplY3QoZXJyb3I6IEVycm9yKTogdm9pZDtcbiAgdGltZXI6IE5vZGVKUy5UaW1lb3V0O1xufVxuXG5pbnRlcmZhY2UgTmF0aXZlSGVscGVyUHJvY2VzcyB7XG4gIGtleTogc3RyaW5nO1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIGNoaWxkOiBDaGlsZFByb2Nlc3NXaXRob3V0TnVsbFN0cmVhbXM7XG4gIHBlbmRpbmc6IE1hcDxzdHJpbmcsIEhlbHBlclJlcXVlc3Q+O1xufVxuXG5leHBvcnQgY2xhc3MgTmF0aXZlQnJpZGdlIHtcbiAgcHJpdmF0ZSBtb2R1bGVzID0gbmV3IE1hcDxzdHJpbmcsIExvYWRlZE5hdGl2ZU1vZHVsZT4oKTtcbiAgcHJpdmF0ZSBpbnN0YW5jZXMgPSBuZXcgTWFwPHN0cmluZywgTmF0aXZlSW5zdGFuY2U+KCk7XG4gIHByaXZhdGUgaGVscGVycyA9IG5ldyBNYXA8c3RyaW5nLCBOYXRpdmVIZWxwZXJQcm9jZXNzPigpO1xuICBwcml2YXRlIG5hdGl2ZUhvc3RFeHBvcnRzOiB1bmtub3duIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbmF0aXZlSG9zdExvYWRFcnJvcjogRXJyb3IgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGxvZzogTmF0aXZlTG9nLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgb3B0aW9uczogTmF0aXZlQnJpZGdlT3B0aW9ucyA9IHt9LFxuICApIHt9XG5cbiAgZ2V0Q2FwYWJpbGl0aWVzKCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllc1tcIm5hdGl2ZVwiXSB7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMubG9hZE5hdGl2ZUhvc3QoZmFsc2UpO1xuICAgIGNvbnN0IGhvc3RDYXBhYmlsaXRpZXMgPSBob3N0ID8gdGhpcy5yZWFkTmF0aXZlSG9zdENhcGFiaWxpdGllcyhob3N0KSA6IHt9O1xuICAgIGNvbnN0IG5hdGl2ZUhvc3QgPSBob3N0ICE9PSBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICBpblByb2Nlc3NNb2R1bGVzOiB0cnVlLFxuICAgICAgc3dpZnRNb2R1bGVzOiBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiLFxuICAgICAgYXBwS2l0RW1iZWRkaW5nOiBCb29sZWFuKGhvc3RDYXBhYmlsaXRpZXMuYXBwS2l0RW1iZWRkaW5nKSxcbiAgICAgIGNoaWxkV2luZG93T3ZlcmxheTogQm9vbGVhbihob3N0Q2FwYWJpbGl0aWVzLmNoaWxkV2luZG93T3ZlcmxheSksXG4gICAgICBkaXJlY3RWaWV3QXR0YWNoOiBCb29sZWFuKGhvc3RDYXBhYmlsaXRpZXMuZGlyZWN0Vmlld0F0dGFjaCksXG4gICAgICBtZXRhbFZpZXdzOiBCb29sZWFuKGhvc3RDYXBhYmlsaXRpZXMubWV0YWxWaWV3cyksXG4gICAgICBuYXRpdmVIb3N0LFxuICAgICAgaGVscGVyczogdHJ1ZSxcbiAgICB9O1xuICB9XG5cbiAgbG9hZE1vZHVsZShjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCwgb3B0aW9uczogTmF0aXZlTW9kdWxlTG9hZE9wdGlvbnMpOiBOYXRpdmVNb2R1bGVSZWYge1xuICAgIGNvbnN0IGlkID0gYXNzZXJ0QnJpZGdlSWQob3B0aW9ucy5pZCwgXCJuYXRpdmUgbW9kdWxlIGlkXCIpO1xuICAgIGNvbnN0IGZ1bGxQYXRoID0gcmVzb2x2ZVR3ZWFrUGF0aChjdHgsIG9wdGlvbnMucGF0aCk7XG4gICAgY29uc3Qga2luZCA9IG9wdGlvbnMua2luZCA/PyBpbmZlck1vZHVsZUtpbmQoZnVsbFBhdGgpO1xuXG4gICAgaWYgKGtpbmQgIT09IFwibm9kZS1hZGRvblwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGAke2tpbmR9IG5hdGl2ZSBtb2R1bGVzIG11c3QgYmUgbG9hZGVkIHRocm91Z2ggYSAubm9kZSBPYmplY3RpdmUtQysrIHNoaW0gaW4gQ29kZXgrKyAxLjAuMGAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghZnVsbFBhdGguZW5kc1dpdGgoXCIubm9kZVwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibm9kZS1hZGRvbiBuYXRpdmUgbW9kdWxlcyBtdXN0IHVzZSBhIC5ub2RlIGZpbGVcIik7XG4gICAgfVxuXG4gICAgY29uc3QgbG9hZGVkID0gcmVxdWlyZShmdWxsUGF0aCkgYXMgdW5rbm93bjtcbiAgICBjb25zdCBleHBvcnRzID0gc2VsZWN0RW50cnlwb2ludChsb2FkZWQsIG9wdGlvbnMuZW50cnlwb2ludCk7XG4gICAgY29uc3Qga2V5ID0gbW9kdWxlS2V5KGN0eC5pZCwgaWQpO1xuICAgIHRoaXMubW9kdWxlcy5zZXQoa2V5LCB7IGtleSwgdHdlYWtJZDogY3R4LmlkLCBpZCwga2luZCwgcGF0aDogZnVsbFBhdGgsIGV4cG9ydHMgfSk7XG4gICAgdGhpcy5sb2coXCJpbmZvXCIsIGBsb2FkZWQgbmF0aXZlIG1vZHVsZSAke2N0eC5pZH06JHtpZH1gLCB7IGtpbmQsIHBhdGg6IGZ1bGxQYXRoIH0pO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZVJlZihjdHguaWQsIGlkLCBraW5kKTtcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZVBhbmVsKGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LCBvcHRpb25zOiBOYXRpdmVQYW5lbENyZWF0ZU9wdGlvbnMpOiBQcm9taXNlPE5hdGl2ZVBhbmVsUmVmPiB7XG4gICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHRoaXMuY3JlYXRlTmF0aXZlSW5zdGFuY2UoY3R4LCBcInBhbmVsXCIsIG9wdGlvbnMubW9kdWxlSWQsIG9wdGlvbnMuZmFjdG9yeSA/PyBcImNyZWF0ZVBhbmVsXCIsIHtcbiAgICAgIHBhcmVudFdpbmRvd0lkOiBvcHRpb25zLnBhcmVudFdpbmRvd0lkLFxuICAgICAgYm91bmRzOiBvcHRpb25zLmJvdW5kcyxcbiAgICAgIHRyYW5zcGFyZW50OiBvcHRpb25zLnRyYW5zcGFyZW50ID09PSB0cnVlLFxuICAgICAgcGFzc3Rocm91Z2hNb3VzZTogb3B0aW9ucy5wYXNzdGhyb3VnaE1vdXNlID09PSB0cnVlLFxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLnBhbmVsUmVmKGNyZWF0ZWQpO1xuICB9XG5cbiAgYXN5bmMgYXR0YWNoVmlldyhjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCwgb3B0aW9uczogTmF0aXZlVmlld0F0dGFjaE9wdGlvbnMpOiBQcm9taXNlPE5hdGl2ZVZpZXdSZWY+IHtcbiAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5jcmVhdGVOYXRpdmVJbnN0YW5jZShjdHgsIFwidmlld1wiLCBvcHRpb25zLm1vZHVsZUlkLCBvcHRpb25zLmZhY3RvcnkgPz8gXCJhdHRhY2hWaWV3XCIsIHtcbiAgICAgIHBhcmVudFdpbmRvd0lkOiBvcHRpb25zLnBhcmVudFdpbmRvd0lkLFxuICAgICAgYm91bmRzOiBvcHRpb25zLmJvdW5kcyxcbiAgICAgIHpJbmRleDogb3B0aW9ucy56SW5kZXgsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMudmlld1JlZihjcmVhdGVkKTtcbiAgfVxuXG4gIGxhdW5jaEhlbHBlcihjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCwgb3B0aW9uczogTmF0aXZlSGVscGVyTGF1bmNoT3B0aW9ucyk6IE5hdGl2ZUhlbHBlclJlZiB7XG4gICAgY29uc3QgaWQgPSBhc3NlcnRCcmlkZ2VJZChvcHRpb25zLmlkLCBcIm5hdGl2ZSBoZWxwZXIgaWRcIik7XG4gICAgaWYgKChvcHRpb25zLnRyYW5zcG9ydCA/PyBcInN0ZGlvXCIpICE9PSBcInN0ZGlvXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBoZWxwZXJzIHN1cHBvcnQgb25seSBzdGRpbyB0cmFuc3BvcnQgaW4gQ29kZXgrKyAxLjAuMFwiKTtcbiAgICB9XG4gICAgaWYgKChvcHRpb25zLnJlc3RhcnQgPz8gXCJuZXZlclwiKSAhPT0gXCJuZXZlclwiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgaGVscGVyIHJlc3RhcnQgcG9saWNpZXMgYXJlIG5vdCBhdmFpbGFibGUgaW4gQ29kZXgrKyAxLjAuMFwiKTtcbiAgICB9XG4gICAgY29uc3QgZXhlY3V0YWJsZSA9IHJlc29sdmVUd2Vha1BhdGgoY3R4LCBvcHRpb25zLmV4ZWN1dGFibGUpO1xuICAgIGNvbnN0IGFyZ3MgPSBvcHRpb25zLmFyZ3MgPz8gW107XG4gICAgY29uc3QgZW52ID0geyAuLi5wcm9jZXNzLmVudiwgLi4uKG9wdGlvbnMuZW52ID8/IHt9KSB9O1xuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oZXhlY3V0YWJsZSwgYXJncywge1xuICAgICAgY3dkOiBjdHguZGlyLFxuICAgICAgZW52LFxuICAgICAgc3RkaW86IFtcInBpcGVcIiwgXCJwaXBlXCIsIFwicGlwZVwiXSxcbiAgICB9KTtcbiAgICBjb25zdCBrZXkgPSBoZWxwZXJLZXkoY3R4LmlkLCBpZCk7XG4gICAgY29uc3QgaGVscGVyOiBOYXRpdmVIZWxwZXJQcm9jZXNzID0ge1xuICAgICAga2V5LFxuICAgICAgdHdlYWtJZDogY3R4LmlkLFxuICAgICAgaWQsXG4gICAgICBjaGlsZCxcbiAgICAgIHBlbmRpbmc6IG5ldyBNYXAoKSxcbiAgICB9O1xuICAgIHRoaXMuaGVscGVycy5zZXQoa2V5LCBoZWxwZXIpO1xuXG4gICAgY29uc3Qgc3Rkb3V0ID0gY3JlYXRlSW50ZXJmYWNlKHsgaW5wdXQ6IGNoaWxkLnN0ZG91dCB9KTtcbiAgICBzdGRvdXQub24oXCJsaW5lXCIsIChsaW5lKSA9PiB0aGlzLmhhbmRsZUhlbHBlckxpbmUoaGVscGVyLCBsaW5lKSk7XG4gICAgY2hpbGQuc3RkZXJyLm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHtcbiAgICAgIHRoaXMubG9nKFwid2FyblwiLCBgbmF0aXZlIGhlbHBlciAke2N0eC5pZH06JHtpZH0gc3RkZXJyYCwgU3RyaW5nKGNodW5rKSk7XG4gICAgfSk7XG4gICAgY2hpbGQub24oXCJleGl0XCIsIChjb2RlLCBzaWduYWwpID0+IHtcbiAgICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgbmF0aXZlIGhlbHBlciAke2N0eC5pZH06JHtpZH0gZXhpdGVkYCwgeyBjb2RlLCBzaWduYWwgfSk7XG4gICAgICB0aGlzLmhlbHBlcnMuZGVsZXRlKGtleSk7XG4gICAgICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgaGVscGVyLnBlbmRpbmcudmFsdWVzKCkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZXIpO1xuICAgICAgICByZXF1ZXN0LnJlamVjdChuZXcgRXJyb3IoYG5hdGl2ZSBoZWxwZXIgZXhpdGVkIGJlZm9yZSByZXNwb25zZWApKTtcbiAgICAgIH1cbiAgICAgIGhlbHBlci5wZW5kaW5nLmNsZWFyKCk7XG4gICAgfSk7XG4gICAgY2hpbGQub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICAgIHRoaXMubG9nKFwiZXJyb3JcIiwgYG5hdGl2ZSBoZWxwZXIgJHtjdHguaWR9OiR7aWR9IGZhaWxlZGAsIGVycm9yKTtcbiAgICAgIHRoaXMuaGVscGVycy5kZWxldGUoa2V5KTtcbiAgICAgIGZvciAoY29uc3QgcmVxdWVzdCBvZiBoZWxwZXIucGVuZGluZy52YWx1ZXMoKSkge1xuICAgICAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lcik7XG4gICAgICAgIHJlcXVlc3QucmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICAgIGhlbHBlci5wZW5kaW5nLmNsZWFyKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmxvZyhcImluZm9cIiwgYGxhdW5jaGVkIG5hdGl2ZSBoZWxwZXIgJHtjdHguaWR9OiR7aWR9YCwgeyBwaWQ6IGNoaWxkLnBpZCwgZXhlY3V0YWJsZSB9KTtcbiAgICByZXR1cm4gdGhpcy5oZWxwZXJSZWYoY3R4LmlkLCBpZCwgY2hpbGQucGlkID8/IC0xKTtcbiAgfVxuXG4gIGRpc3Bvc2VUd2Vhayh0d2Vha0lkOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGluc3RhbmNlXSBvZiBbLi4udGhpcy5pbnN0YW5jZXNdKSB7XG4gICAgICBpZiAoaW5zdGFuY2UudHdlYWtJZCAhPT0gdHdlYWtJZCkgY29udGludWU7XG4gICAgICB2b2lkIHRoaXMuZGlzcG9zZUluc3RhbmNlKGluc3RhbmNlKS5maW5hbGx5KCgpID0+IHRoaXMuaW5zdGFuY2VzLmRlbGV0ZShrZXkpKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBba2V5LCBoZWxwZXJdIG9mIFsuLi50aGlzLmhlbHBlcnNdKSB7XG4gICAgICBpZiAoaGVscGVyLnR3ZWFrSWQgIT09IHR3ZWFrSWQpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5zdG9wSGVscGVyKGhlbHBlcik7XG4gICAgICB0aGlzLmhlbHBlcnMuZGVsZXRlKGtleSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2tleSwgbW9kXSBvZiBbLi4udGhpcy5tb2R1bGVzXSkge1xuICAgICAgaWYgKG1vZC50d2Vha0lkICE9PSB0d2Vha0lkKSBjb250aW51ZTtcbiAgICAgIHZvaWQgY2FsbE9wdGlvbmFsKG1vZC5leHBvcnRzLCBcImRpc3Bvc2VcIiwgW10pO1xuICAgICAgdGhpcy5tb2R1bGVzLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgfVxuXG4gIGRpc3Bvc2VBbGwoKTogdm9pZCB7XG4gICAgY29uc3QgdHdlYWtJZHMgPSBuZXcgU2V0KFtcbiAgICAgIC4uLlsuLi50aGlzLm1vZHVsZXMudmFsdWVzKCldLm1hcCgoaXRlbSkgPT4gaXRlbS50d2Vha0lkKSxcbiAgICAgIC4uLlsuLi50aGlzLmluc3RhbmNlcy52YWx1ZXMoKV0ubWFwKChpdGVtKSA9PiBpdGVtLnR3ZWFrSWQpLFxuICAgICAgLi4uWy4uLnRoaXMuaGVscGVycy52YWx1ZXMoKV0ubWFwKChpdGVtKSA9PiBpdGVtLnR3ZWFrSWQpLFxuICAgIF0pO1xuICAgIGZvciAoY29uc3QgaWQgb2YgdHdlYWtJZHMpIHRoaXMuZGlzcG9zZVR3ZWFrKGlkKTtcbiAgfVxuXG4gIGFzeW5jIGNhbGxJbnN0YW5jZShcbiAgICB0d2Vha0lkOiBzdHJpbmcsXG4gICAga2luZDogXCJwYW5lbFwiIHwgXCJ2aWV3XCIsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmc/OiB1bmtub3duLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoa2luZCA9PT0gXCJwYW5lbFwiKSB7XG4gICAgICBpZiAobWV0aG9kID09PSBcInNldEJvdW5kc1wiKSByZXR1cm4gdGhpcy5pbnZva2VJbnN0YW5jZSh0d2Vha0lkLCBpZCwgXCJzZXRCb3VuZHNcIiwgW2FyZ10pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJzaG93XCIpIHJldHVybiB0aGlzLmludm9rZUluc3RhbmNlKHR3ZWFrSWQsIGlkLCBcInNob3dcIiwgW10pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJoaWRlXCIpIHJldHVybiB0aGlzLmludm9rZUluc3RhbmNlKHR3ZWFrSWQsIGlkLCBcImhpZGVcIiwgW10pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJkaXNwb3NlXCIpIHJldHVybiB0aGlzLmRpc3Bvc2VJbnN0YW5jZUJ5SWQodHdlYWtJZCwgaWQpO1xuICAgIH1cbiAgICBpZiAoa2luZCA9PT0gXCJ2aWV3XCIpIHtcbiAgICAgIGlmIChtZXRob2QgPT09IFwic2V0Qm91bmRzXCIpIHJldHVybiB0aGlzLmludm9rZUluc3RhbmNlKHR3ZWFrSWQsIGlkLCBcInNldEJvdW5kc1wiLCBbYXJnXSk7XG4gICAgICBpZiAobWV0aG9kID09PSBcInNldFZpc2libGVcIikgcmV0dXJuIHRoaXMuaW52b2tlSW5zdGFuY2UodHdlYWtJZCwgaWQsIFwic2V0VmlzaWJsZVwiLCBbYXJnXSk7XG4gICAgICBpZiAobWV0aG9kID09PSBcImRpc3Bvc2VcIikgcmV0dXJuIHRoaXMuZGlzcG9zZUluc3RhbmNlQnlJZCh0d2Vha0lkLCBpZCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biBuYXRpdmUgJHtraW5kfSBtZXRob2Q6ICR7bWV0aG9kfWApO1xuICB9XG5cbiAgYXN5bmMgY2FsbEhlbHBlcihcbiAgICB0d2Vha0lkOiBzdHJpbmcsXG4gICAgaGVscGVySWQ6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBwYXlsb2FkPzogdW5rbm93bixcbiAgICB0aW1lb3V0TXM/OiBudW1iZXIsXG4gICk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIGlmIChtZXRob2QgPT09IFwic2VuZFwiKSByZXR1cm4gdGhpcy5zZW5kSGVscGVyKHR3ZWFrSWQsIGhlbHBlcklkLCBwYXlsb2FkKTtcbiAgICBpZiAobWV0aG9kID09PSBcInJlcXVlc3RcIikgcmV0dXJuIHRoaXMucmVxdWVzdEhlbHBlcih0d2Vha0lkLCBoZWxwZXJJZCwgcGF5bG9hZCwgdGltZW91dE1zKTtcbiAgICBpZiAobWV0aG9kID09PSBcInN0b3BcIikgcmV0dXJuIHRoaXMuc3RvcEhlbHBlckJ5SWQodHdlYWtJZCwgaGVscGVySWQpO1xuICAgIHRocm93IG5ldyBFcnJvcihgdW5rbm93biBuYXRpdmUgaGVscGVyIG1ldGhvZDogJHttZXRob2R9YCk7XG4gIH1cblxuICBwcml2YXRlIG1vZHVsZVJlZih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcsIGtpbmQgPSB0aGlzLm1vZHVsZUZvcih0d2Vha0lkLCBpZCkua2luZCk6IE5hdGl2ZU1vZHVsZVJlZiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkLFxuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3Q6IChtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcykgPT5cbiAgICAgICAgdGhpcy5yZXF1ZXN0TW9kdWxlKHR3ZWFrSWQsIGlkLCBtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcyksXG4gICAgICBkaXNwb3NlOiAoKSA9PiB0aGlzLmRpc3Bvc2VNb2R1bGUodHdlYWtJZCwgaWQpLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHBhbmVsUmVmKGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSk6IE5hdGl2ZVBhbmVsUmVmIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGluc3RhbmNlLmlkLFxuICAgICAgd2luZG93SWQ6IGluc3RhbmNlLndpbmRvd0lkLFxuICAgICAgc2V0Qm91bmRzOiAoYm91bmRzKSA9PiB0aGlzLmludm9rZUluc3RhbmNlKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkLCBcInNldEJvdW5kc1wiLCBbYm91bmRzXSksXG4gICAgICBzaG93OiAoKSA9PiB0aGlzLmludm9rZUluc3RhbmNlKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkLCBcInNob3dcIiwgW10pLFxuICAgICAgaGlkZTogKCkgPT4gdGhpcy5pbnZva2VJbnN0YW5jZShpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCwgXCJoaWRlXCIsIFtdKSxcbiAgICAgIGRpc3Bvc2U6ICgpID0+IHRoaXMuZGlzcG9zZUluc3RhbmNlQnlJZChpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgdmlld1JlZihpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UpOiBOYXRpdmVWaWV3UmVmIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IGluc3RhbmNlLmlkLFxuICAgICAgc2V0Qm91bmRzOiAoYm91bmRzKSA9PiB0aGlzLmludm9rZUluc3RhbmNlKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkLCBcInNldEJvdW5kc1wiLCBbYm91bmRzXSksXG4gICAgICBzZXRWaXNpYmxlOiAodmlzaWJsZSkgPT4gdGhpcy5pbnZva2VJbnN0YW5jZShpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCwgXCJzZXRWaXNpYmxlXCIsIFt2aXNpYmxlXSksXG4gICAgICBkaXNwb3NlOiAoKSA9PiB0aGlzLmRpc3Bvc2VJbnN0YW5jZUJ5SWQoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQpLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGhlbHBlclJlZih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcsIHBpZDogbnVtYmVyKTogTmF0aXZlSGVscGVyUmVmIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQsXG4gICAgICBwaWQsXG4gICAgICBzZW5kOiAobWVzc2FnZSkgPT4gdGhpcy5zZW5kSGVscGVyKHR3ZWFrSWQsIGlkLCBtZXNzYWdlKSxcbiAgICAgIHJlcXVlc3Q6IChtZXNzYWdlLCB0aW1lb3V0TXMpID0+IHRoaXMucmVxdWVzdEhlbHBlcih0d2Vha0lkLCBpZCwgbWVzc2FnZSwgdGltZW91dE1zKSxcbiAgICAgIHN0b3A6ICgpID0+IHRoaXMuc3RvcEhlbHBlckJ5SWQodHdlYWtJZCwgaWQpLFxuICAgIH07XG4gIH1cblxuICBhc3luYyByZXF1ZXN0TW9kdWxlKFxuICAgIHR3ZWFrSWQ6IHN0cmluZyxcbiAgICBpZDogc3RyaW5nLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIHBheWxvYWQ/OiB1bmtub3duLFxuICAgIF90aW1lb3V0TXM/OiBudW1iZXIsXG4gICk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIGNvbnN0IG1vZCA9IHRoaXMubW9kdWxlRm9yKHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCB0YXJnZXQgPSBhc1JlY29yZChtb2QuZXhwb3J0cyk7XG4gICAgY29uc3QgZm4gPSB0YXJnZXQ/LnJlcXVlc3Q7XG4gICAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4uY2FsbChtb2QuZXhwb3J0cywgbWV0aG9kLCBwYXlsb2FkKTtcbiAgICB9XG4gICAgY29uc3QgbWV0aG9kRm4gPSB0YXJnZXQ/LlttZXRob2RdO1xuICAgIGlmICh0eXBlb2YgbWV0aG9kRm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIGF3YWl0IG1ldGhvZEZuLmNhbGwobW9kLmV4cG9ydHMsIHBheWxvYWQpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSBtb2R1bGUgJHt0d2Vha0lkfToke2lkfSBoYXMgbm8gcmVxdWVzdCgpIG9yICR7bWV0aG9kfSgpYCk7XG4gIH1cblxuICBhc3luYyBkaXNwb3NlTW9kdWxlKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGtleSA9IG1vZHVsZUtleSh0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgbW9kID0gdGhpcy5tb2R1bGVzLmdldChrZXkpO1xuICAgIGlmICghbW9kKSByZXR1cm47XG4gICAgYXdhaXQgY2FsbE9wdGlvbmFsKG1vZC5leHBvcnRzLCBcImRpc3Bvc2VcIiwgW10pO1xuICAgIHRoaXMubW9kdWxlcy5kZWxldGUoa2V5KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY3JlYXRlTmF0aXZlSW5zdGFuY2UoXG4gICAgY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsXG4gICAga2luZDogXCJwYW5lbFwiIHwgXCJ2aWV3XCIsXG4gICAgbW9kdWxlSWQ6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgICBmYWN0b3J5OiBzdHJpbmcsXG4gICAgb3B0aW9uczogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICk6IFByb21pc2U8TmF0aXZlSW5zdGFuY2U+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBtb2R1bGVJZCA/IHRoaXMubW9kdWxlRm9yKGN0eC5pZCwgbW9kdWxlSWQpLmV4cG9ydHMgOiB0aGlzLmxvYWROYXRpdmVIb3N0KHRydWUpO1xuICAgIGNvbnN0IGZuID0gYXNSZWNvcmQodGFyZ2V0KT8uW2ZhY3RvcnldO1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgY29uc3QgbGFiZWwgPSBtb2R1bGVJZCA/IGBuYXRpdmUgbW9kdWxlICR7Y3R4LmlkfToke21vZHVsZUlkfWAgOiBcIkNvZGV4KysgbmF0aXZlIGhvc3RcIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtsYWJlbH0gaGFzIG5vIGZhY3RvcnkgJHtmYWN0b3J5fSgpYCk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyZW50V2luZG93ID0gdHlwZW9mIG9wdGlvbnMucGFyZW50V2luZG93SWQgPT09IFwibnVtYmVyXCJcbiAgICAgID8gQnJvd3NlcldpbmRvdy5mcm9tSWQob3B0aW9ucy5wYXJlbnRXaW5kb3dJZClcbiAgICAgIDogQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KCk7XG4gICAgY29uc3QgcGFyZW50TmF0aXZlSGFuZGxlID0gbmF0aXZlSGFuZGxlRm9yV2luZG93KHBhcmVudFdpbmRvdyk7XG4gICAgY29uc3QgdmFsdWUgPSBhd2FpdCBmbi5jYWxsKHRhcmdldCwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIHBhcmVudFdpbmRvd0lkOiB3aW5kb3dJZEZvcihwYXJlbnRXaW5kb3cpLFxuICAgICAgcGFyZW50V2ViQ29udGVudHNJZDogd2ViQ29udGVudHNJZEZvcihwYXJlbnRXaW5kb3cpLFxuICAgICAgcGFyZW50TmF0aXZlSGFuZGxlLFxuICAgIH0pO1xuICAgIGNvbnN0IGlkID0gdHlwZW9mIGFzUmVjb3JkKHZhbHVlKT8uaWQgPT09IFwic3RyaW5nXCIgPyBTdHJpbmcoYXNSZWNvcmQodmFsdWUpPy5pZCkgOiByYW5kb21VVUlEKCk7XG4gICAgY29uc3Qgd2luZG93SWQgPSB0eXBlb2YgYXNSZWNvcmQodmFsdWUpPy53aW5kb3dJZCA9PT0gXCJudW1iZXJcIiA/IE51bWJlcihhc1JlY29yZCh2YWx1ZSk/LndpbmRvd0lkKSA6IG51bGw7XG4gICAgY29uc3QgaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlID0ge1xuICAgICAga2V5OiBpbnN0YW5jZUtleShjdHguaWQsIGlkKSxcbiAgICAgIHR3ZWFrSWQ6IGN0eC5pZCxcbiAgICAgIGlkLFxuICAgICAga2luZCxcbiAgICAgIHZhbHVlLFxuICAgICAgcGFyZW50V2luZG93SWQ6IHdpbmRvd0lkRm9yKHBhcmVudFdpbmRvdyksXG4gICAgICB3aW5kb3dJZCxcbiAgICAgIGRpc3Bvc2VCaW5kaW5nczogW10sXG4gICAgICBkaXNwb3Npbmc6IGZhbHNlLFxuICAgIH07XG4gICAgdGhpcy5pbnN0YW5jZXMuc2V0KGluc3RhbmNlLmtleSwgaW5zdGFuY2UpO1xuICAgIGlmIChjYW5CaW5kUGFyZW50V2luZG93KHBhcmVudFdpbmRvdykpIHtcbiAgICAgIHRoaXMuYmluZEluc3RhbmNlVG9QYXJlbnQoaW5zdGFuY2UsIHBhcmVudFdpbmRvdyk7XG4gICAgICB0aGlzLnN5bmNQYXJlbnRTdGF0ZShpbnN0YW5jZSwgcGFyZW50V2luZG93LCBcImNyZWF0ZWRcIik7XG4gICAgfVxuICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgY3JlYXRlZCBuYXRpdmUgJHtraW5kfSAke2N0eC5pZH06JHtpZH1gLCB7XG4gICAgICBtb2R1bGVJZDogbW9kdWxlSWQgPz8gXCJjb2RleHBwLm5hdGl2ZS1ob3N0XCIsXG4gICAgICBmYWN0b3J5LFxuICAgICAgd2luZG93SWQsXG4gICAgfSk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG5cbiAgcHJpdmF0ZSBsb2FkTmF0aXZlSG9zdChyZXF1aXJlZDogdHJ1ZSk6IHVua25vd247XG4gIHByaXZhdGUgbG9hZE5hdGl2ZUhvc3QocmVxdWlyZWQ6IGZhbHNlKTogdW5rbm93biB8IG51bGw7XG4gIHByaXZhdGUgbG9hZE5hdGl2ZUhvc3QocmVxdWlyZWQ6IGJvb2xlYW4pOiB1bmtub3duIHwgbnVsbCB7XG4gICAgaWYgKHRoaXMubmF0aXZlSG9zdEV4cG9ydHMpIHJldHVybiB0aGlzLm5hdGl2ZUhvc3RFeHBvcnRzO1xuICAgIGlmICh0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3IgJiYgIXJlcXVpcmVkKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBuYXRpdmVIb3N0UGF0aCA9IHRoaXMub3B0aW9ucy5uYXRpdmVIb3N0UGF0aDtcbiAgICBpZiAoIW5hdGl2ZUhvc3RQYXRoIHx8ICFleGlzdHNTeW5jKG5hdGl2ZUhvc3RQYXRoKSkge1xuICAgICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoXCJDb2RleCsrIG5hdGl2ZSBob3N0IGlzIG5vdCBpbnN0YWxsZWRcIik7XG4gICAgICB0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3IgPSBlcnJvcjtcbiAgICAgIGlmIChyZXF1aXJlZCkgdGhyb3cgZXJyb3I7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubmF0aXZlSG9zdEV4cG9ydHMgPSByZXF1aXJlKG5hdGl2ZUhvc3RQYXRoKSBhcyB1bmtub3duO1xuICAgICAgdGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yID0gbnVsbDtcbiAgICAgIHRoaXMubG9nKFwiaW5mb1wiLCBcImxvYWRlZCBDb2RleCsrIG5hdGl2ZSBob3N0XCIsIHsgcGF0aDogbmF0aXZlSG9zdFBhdGggfSk7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmVIb3N0RXhwb3J0cztcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKFN0cmluZyhlcnJvcikpO1xuICAgICAgdGhpcy5sb2coXCJlcnJvclwiLCBcImZhaWxlZCB0byBsb2FkIENvZGV4KysgbmF0aXZlIGhvc3RcIiwgdGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yKTtcbiAgICAgIGlmIChyZXF1aXJlZCkgdGhyb3cgdGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZWFkTmF0aXZlSG9zdENhcGFiaWxpdGllcyhob3N0OiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICAgIGNvbnN0IGdldENhcGFiaWxpdGllcyA9IGFzUmVjb3JkKGhvc3QpPy5nZXRDYXBhYmlsaXRpZXM7XG4gICAgaWYgKHR5cGVvZiBnZXRDYXBhYmlsaXRpZXMgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHt9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjYXBhYmlsaXRpZXMgPSBnZXRDYXBhYmlsaXRpZXMuY2FsbChob3N0KTtcbiAgICAgIHJldHVybiBhc1JlY29yZChjYXBhYmlsaXRpZXMpID8/IHt9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLmxvZyhcIndhcm5cIiwgXCJDb2RleCsrIG5hdGl2ZSBob3N0IGNhcGFiaWxpdHkgcHJvYmUgZmFpbGVkXCIsIGVycm9yKTtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGludm9rZUluc3RhbmNlKFxuICAgIHR3ZWFrSWQ6IHN0cmluZyxcbiAgICBpZDogc3RyaW5nLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIGFyZ3M6IHVua25vd25bXSxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlRm9yKHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCBmbiA9IGFzUmVjb3JkKGluc3RhbmNlLnZhbHVlKT8uW21ldGhvZF07XG4gICAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBhd2FpdCBmbi5hcHBseShpbnN0YW5jZS52YWx1ZSwgYXJncyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChpbnN0YW5jZS53aW5kb3dJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgd2luID0gQnJvd3NlcldpbmRvdy5mcm9tSWQoaW5zdGFuY2Uud2luZG93SWQpO1xuICAgICAgaWYgKHdpbiAmJiAhd2luLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgaWYgKG1ldGhvZCA9PT0gXCJzZXRCb3VuZHNcIikgd2luLnNldEJvdW5kcyhhcmdzWzBdIGFzIEVsZWN0cm9uLlJlY3RhbmdsZSk7XG4gICAgICAgIGVsc2UgaWYgKG1ldGhvZCA9PT0gXCJzaG93XCIpIHdpbi5zaG93KCk7XG4gICAgICAgIGVsc2UgaWYgKG1ldGhvZCA9PT0gXCJoaWRlXCIpIHdpbi5oaWRlKCk7XG4gICAgICAgIGVsc2UgaWYgKG1ldGhvZCA9PT0gXCJzZXRWaXNpYmxlXCIpIChhcmdzWzBdID8gd2luLnNob3coKSA6IHdpbi5oaWRlKCkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgbmF0aXZlICR7aW5zdGFuY2Uua2luZH0gJHt0d2Vha0lkfToke2lkfSBkb2VzIG5vdCBpbXBsZW1lbnQgJHttZXRob2R9KClgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGlzcG9zZUluc3RhbmNlQnlJZCh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBrZXkgPSBpbnN0YW5jZUtleSh0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlcy5nZXQoa2V5KTtcbiAgICBpZiAoIWluc3RhbmNlKSByZXR1cm47XG4gICAgYXdhaXQgdGhpcy5kaXNwb3NlSW5zdGFuY2UoaW5zdGFuY2UpO1xuICAgIHRoaXMuaW5zdGFuY2VzLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkaXNwb3NlSW5zdGFuY2UoaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGluc3RhbmNlLmRpc3Bvc2luZykgcmV0dXJuO1xuICAgIGluc3RhbmNlLmRpc3Bvc2luZyA9IHRydWU7XG4gICAgZm9yIChjb25zdCBkaXNwb3NlIG9mIGluc3RhbmNlLmRpc3Bvc2VCaW5kaW5ncy5zcGxpY2UoMCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRpc3Bvc2UoKTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICB9XG4gICAgYXdhaXQgY2FsbE9wdGlvbmFsKGluc3RhbmNlLnZhbHVlLCBcImRpc3Bvc2VcIiwgW10pO1xuICAgIGlmIChpbnN0YW5jZS53aW5kb3dJZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3Qgd2luID0gQnJvd3NlcldpbmRvdy5mcm9tSWQoaW5zdGFuY2Uud2luZG93SWQpO1xuICAgICAgaWYgKHdpbiAmJiAhd2luLmlzRGVzdHJveWVkKCkpIHdpbi5jbG9zZSgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmluZEluc3RhbmNlVG9QYXJlbnQoaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlLCBwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cpOiB2b2lkIHtcbiAgICBjb25zdCBvbiA9IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgcGFyZW50V2luZG93Lm9uKGV2ZW50IGFzIG5ldmVyLCBsaXN0ZW5lciBhcyBuZXZlcik7XG4gICAgICBpbnN0YW5jZS5kaXNwb3NlQmluZGluZ3MucHVzaCgoKSA9PiBwYXJlbnRXaW5kb3cub2ZmKGV2ZW50IGFzIG5ldmVyLCBsaXN0ZW5lciBhcyBuZXZlcikpO1xuICAgIH07XG4gICAgY29uc3Qgc3luY0JvdW5kcyA9ICgpID0+IHRoaXMuc3luY1BhcmVudFN0YXRlKGluc3RhbmNlLCBwYXJlbnRXaW5kb3csIFwiYm91bmRzXCIpO1xuICAgIGNvbnN0IHN5bmNGb2N1cyA9IChmb2N1c2VkOiBib29sZWFuKSA9PiB0aGlzLnNpZ25hbFBhcmVudFN0YXRlKGluc3RhbmNlLCBwYXJlbnRXaW5kb3csIFwiZm9jdXNcIiwgeyBmb2N1c2VkIH0pO1xuICAgIGNvbnN0IHN5bmNWaXNpYmlsaXR5ID0gKHZpc2libGU6IGJvb2xlYW4pID0+XG4gICAgICB0aGlzLnNpZ25hbFBhcmVudFN0YXRlKGluc3RhbmNlLCBwYXJlbnRXaW5kb3csIFwidmlzaWJpbGl0eVwiLCB7IHZpc2libGUgfSk7XG4gICAgY29uc3QgZGlzcG9zZVdpdGhQYXJlbnQgPSAoKSA9PiB7XG4gICAgICB0aGlzLmxvZyhcImluZm9cIiwgYGRpc3Bvc2luZyBuYXRpdmUgJHtpbnN0YW5jZS5raW5kfSAke2luc3RhbmNlLnR3ZWFrSWR9OiR7aW5zdGFuY2UuaWR9OyBwYXJlbnQgY2xvc2VkYCk7XG4gICAgICB2b2lkIHRoaXMuZGlzcG9zZUluc3RhbmNlQnlJZChpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCk7XG4gICAgfTtcblxuICAgIG9uKFwibW92ZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcInJlc2l6ZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcImVudGVyLWZ1bGwtc2NyZWVuXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwibGVhdmUtZnVsbC1zY3JlZW5cIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJtYXhpbWl6ZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcInVubWF4aW1pemVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJtaW5pbWl6ZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcInJlc3RvcmVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJzaG93XCIsICgpID0+IHN5bmNWaXNpYmlsaXR5KHRydWUpKTtcbiAgICBvbihcImhpZGVcIiwgKCkgPT4gc3luY1Zpc2liaWxpdHkoZmFsc2UpKTtcbiAgICBvbihcImZvY3VzXCIsICgpID0+IHN5bmNGb2N1cyh0cnVlKSk7XG4gICAgb24oXCJibHVyXCIsICgpID0+IHN5bmNGb2N1cyhmYWxzZSkpO1xuICAgIG9uKFwiY2xvc2VcIiwgZGlzcG9zZVdpdGhQYXJlbnQpO1xuICAgIG9uKFwiY2xvc2VkXCIsIGRpc3Bvc2VXaXRoUGFyZW50KTtcbiAgfVxuXG4gIHByaXZhdGUgc3luY1BhcmVudFN0YXRlKFxuICAgIGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSxcbiAgICBwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csXG4gICAgcmVhc29uOiBzdHJpbmcsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHN0YXRlID0gcGFyZW50V2luZG93U3RhdGUocGFyZW50V2luZG93LCByZWFzb24pO1xuICAgIGlmICghc3RhdGUpIHJldHVybjtcbiAgICB2b2lkIHRoaXMuY2FsbEZpcnN0T3B0aW9uYWxJbnN0YW5jZShpbnN0YW5jZSwgW1wic3luY1BhcmVudFwiLCBcInBhcmVudENoYW5nZWRcIl0sIFtzdGF0ZV0pXG4gICAgICAudGhlbigoaGFuZGxlZCkgPT4ge1xuICAgICAgICBpZiAoIWhhbmRsZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5jYWxsRmlyc3RPcHRpb25hbEluc3RhbmNlKFxuICAgICAgICAgICAgaW5zdGFuY2UsXG4gICAgICAgICAgICBbXCJzZXRQYXJlbnRCb3VuZHNcIiwgXCJwYXJlbnRCb3VuZHNDaGFuZ2VkXCJdLFxuICAgICAgICAgICAgW3N0YXRlLmJvdW5kcywgc3RhdGVdLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHRoaXMubG9nKFwid2FyblwiLCBgbmF0aXZlICR7aW5zdGFuY2Uua2luZH0gcGFyZW50IHN5bmMgZmFpbGVkYCwgZXJyb3IpKTtcbiAgfVxuXG4gIHByaXZhdGUgc2lnbmFsUGFyZW50U3RhdGUoXG4gICAgaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlLFxuICAgIHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyxcbiAgICByZWFzb246IHN0cmluZyxcbiAgICBwYXRjaDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHN0YXRlID0gcGFyZW50V2luZG93U3RhdGUocGFyZW50V2luZG93LCByZWFzb24pO1xuICAgIGlmICghc3RhdGUpIHJldHVybjtcbiAgICBjb25zdCBwYXlsb2FkID0geyAuLi5zdGF0ZSwgLi4ucGF0Y2ggfTtcbiAgICB2b2lkIHRoaXMuY2FsbEZpcnN0T3B0aW9uYWxJbnN0YW5jZShpbnN0YW5jZSwgW1wicGFyZW50U3RhdGVDaGFuZ2VkXCIsIFwicGFyZW50Q2hhbmdlZFwiXSwgW3BheWxvYWRdKVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4gdGhpcy5sb2coXCJ3YXJuXCIsIGBuYXRpdmUgJHtpbnN0YW5jZS5raW5kfSBwYXJlbnQgc2lnbmFsIGZhaWxlZGAsIGVycm9yKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNhbGxGaXJzdE9wdGlvbmFsSW5zdGFuY2UoXG4gICAgaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlLFxuICAgIG1ldGhvZHM6IHN0cmluZ1tdLFxuICAgIGFyZ3M6IHVua25vd25bXSxcbiAgKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gYXNSZWNvcmQoaW5zdGFuY2UudmFsdWUpO1xuICAgIGZvciAoY29uc3QgbWV0aG9kIG9mIG1ldGhvZHMpIHtcbiAgICAgIGNvbnN0IGZuID0gdGFyZ2V0Py5bbWV0aG9kXTtcbiAgICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgY29udGludWU7XG4gICAgICBhd2FpdCBmbi5hcHBseShpbnN0YW5jZS52YWx1ZSwgYXJncyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzZW5kSGVscGVyKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZywgbWVzc2FnZTogdW5rbm93bik6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGhlbHBlciA9IHRoaXMuaGVscGVyRm9yKHR3ZWFrSWQsIGlkKTtcbiAgICBoZWxwZXIuY2hpbGQuc3RkaW4ud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkobWVzc2FnZSl9XFxuYCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlcXVlc3RIZWxwZXIoXG4gICAgdHdlYWtJZDogc3RyaW5nLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbWVzc2FnZTogdW5rbm93bixcbiAgICB0aW1lb3V0TXMgPSAxMF8wMDAsXG4gICk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgIGNvbnN0IGhlbHBlciA9IHRoaXMuaGVscGVyRm9yKHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCByZXF1ZXN0SWQgPSByYW5kb21VVUlEKCk7XG4gICAgY29uc3QgcGF5bG9hZCA9IHsgaWQ6IHJlcXVlc3RJZCwgbWVzc2FnZSB9O1xuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBoZWxwZXIucGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgbmF0aXZlIGhlbHBlciByZXF1ZXN0IHRpbWVkIG91dDogJHt0d2Vha0lkfToke2lkfWApKTtcbiAgICAgIH0sIHRpbWVvdXRNcyk7XG4gICAgICBoZWxwZXIucGVuZGluZy5zZXQocmVxdWVzdElkLCB7IHJlc29sdmUsIHJlamVjdCwgdGltZXIgfSk7XG4gICAgICBoZWxwZXIuY2hpbGQuc3RkaW4ud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocGF5bG9hZCl9XFxuYCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHN0b3BIZWxwZXJCeUlkKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGtleSA9IGhlbHBlcktleSh0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgaGVscGVyID0gdGhpcy5oZWxwZXJzLmdldChrZXkpO1xuICAgIGlmICghaGVscGVyKSByZXR1cm47XG4gICAgdGhpcy5zdG9wSGVscGVyKGhlbHBlcik7XG4gICAgdGhpcy5oZWxwZXJzLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBzdG9wSGVscGVyKGhlbHBlcjogTmF0aXZlSGVscGVyUHJvY2Vzcyk6IHZvaWQge1xuICAgIGlmIChoZWxwZXIuY2hpbGQua2lsbGVkKSByZXR1cm47XG4gICAgaGVscGVyLmNoaWxkLmtpbGwoKTtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKCFoZWxwZXIuY2hpbGQua2lsbGVkKSBoZWxwZXIuY2hpbGQua2lsbChcIlNJR0tJTExcIik7XG4gICAgfSwgMTUwMCk7XG4gICAgdGltZXIudW5yZWY/LigpO1xuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVIZWxwZXJMaW5lKGhlbHBlcjogTmF0aXZlSGVscGVyUHJvY2VzcywgbGluZTogc3RyaW5nKTogdm9pZCB7XG4gICAgbGV0IHBheWxvYWQ6IHsgaWQ/OiB1bmtub3duOyByZXN1bHQ/OiB1bmtub3duOyBlcnJvcj86IHVua25vd24gfTtcbiAgICB0cnkge1xuICAgICAgcGF5bG9hZCA9IEpTT04ucGFyc2UobGluZSkgYXMgdHlwZW9mIHBheWxvYWQ7XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aGlzLmxvZyhcImluZm9cIiwgYG5hdGl2ZSBoZWxwZXIgJHtoZWxwZXIudHdlYWtJZH06JHtoZWxwZXIuaWR9YCwgbGluZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcGF5bG9hZC5pZCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuO1xuICAgIGNvbnN0IHJlcXVlc3QgPSBoZWxwZXIucGVuZGluZy5nZXQocGF5bG9hZC5pZCk7XG4gICAgaWYgKCFyZXF1ZXN0KSByZXR1cm47XG4gICAgaGVscGVyLnBlbmRpbmcuZGVsZXRlKHBheWxvYWQuaWQpO1xuICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVyKTtcbiAgICBpZiAocGF5bG9hZC5lcnJvcikge1xuICAgICAgcmVxdWVzdC5yZWplY3QobmV3IEVycm9yKFN0cmluZyhwYXlsb2FkLmVycm9yKSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXF1ZXN0LnJlc29sdmUocGF5bG9hZC5yZXN1bHQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgbW9kdWxlRm9yKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IExvYWRlZE5hdGl2ZU1vZHVsZSB7XG4gICAgY29uc3QgbW9kID0gdGhpcy5tb2R1bGVzLmdldChtb2R1bGVLZXkodHdlYWtJZCwgaWQpKTtcbiAgICBpZiAoIW1vZCkgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgbW9kdWxlIGlzIG5vdCBsb2FkZWQ6ICR7dHdlYWtJZH06JHtpZH1gKTtcbiAgICByZXR1cm4gbW9kO1xuICB9XG5cbiAgcHJpdmF0ZSBpbnN0YW5jZUZvcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBOYXRpdmVJbnN0YW5jZSB7XG4gICAgY29uc3QgaW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlcy5nZXQoaW5zdGFuY2VLZXkodHdlYWtJZCwgaWQpKTtcbiAgICBpZiAoIWluc3RhbmNlKSB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSBpbnN0YW5jZSBpcyBub3QgbG9hZGVkOiAke3R3ZWFrSWR9OiR7aWR9YCk7XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9XG5cbiAgcHJpdmF0ZSBoZWxwZXJGb3IodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogTmF0aXZlSGVscGVyUHJvY2VzcyB7XG4gICAgY29uc3QgaGVscGVyID0gdGhpcy5oZWxwZXJzLmdldChoZWxwZXJLZXkodHdlYWtJZCwgaWQpKTtcbiAgICBpZiAoIWhlbHBlcikgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgaGVscGVyIGlzIG5vdCBydW5uaW5nOiAke3R3ZWFrSWR9OiR7aWR9YCk7XG4gICAgcmV0dXJuIGhlbHBlcjtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlVHdlYWtQYXRoKGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcmVzb2x2ZU5hdGl2ZVR3ZWFrUGF0aChjdHguZGlyLCBwYXRoKTtcbn1cblxuZnVuY3Rpb24gaW5mZXJNb2R1bGVLaW5kKHBhdGg6IHN0cmluZyk6IE5hdGl2ZU1vZHVsZUtpbmQge1xuICBpZiAocGF0aC5lbmRzV2l0aChcIi5ub2RlXCIpKSByZXR1cm4gXCJub2RlLWFkZG9uXCI7XG4gIGlmIChwYXRoLmVuZHNXaXRoKFwiLmR5bGliXCIpKSByZXR1cm4gXCJkeWxpYlwiO1xuICBpZiAocGF0aC5lbmRzV2l0aChcIi5mcmFtZXdvcmtcIikpIHJldHVybiBcImZyYW1ld29ya1wiO1xuICB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgbW9kdWxlIHBhdGggbXVzdCBlbmQgaW4gLm5vZGUsIC5keWxpYiwgb3IgLmZyYW1ld29ya1wiKTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0RW50cnlwb2ludChsb2FkZWQ6IHVua25vd24sIGVudHJ5cG9pbnQ6IHN0cmluZyB8IHVuZGVmaW5lZCk6IHVua25vd24ge1xuICBpZiAoIWVudHJ5cG9pbnQpIHJldHVybiBhc1JlY29yZChsb2FkZWQpPy5kZWZhdWx0ID8/IGxvYWRlZDtcbiAgY29uc3Qgc2VsZWN0ZWQgPSBhc1JlY29yZChsb2FkZWQpPy5bZW50cnlwb2ludF07XG4gIGlmIChzZWxlY3RlZCA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSBtb2R1bGUgZW50cnlwb2ludCBub3QgZm91bmQ6ICR7ZW50cnlwb2ludH1gKTtcbiAgcmV0dXJuIHNlbGVjdGVkO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRCcmlkZ2VJZCh2YWx1ZTogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIiB8fCAhL15bYS16QS1aMC05Ll8tXSskLy50ZXN0KHZhbHVlKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgJHtsYWJlbH0gbWF5IG9ubHkgY29udGFpbiBsZXR0ZXJzLCBudW1iZXJzLCBkb3RzLCB1bmRlcnNjb3JlcywgYW5kIGRhc2hlc2ApO1xuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gbW9kdWxlS2V5KHR3ZWFrSWQ6IHN0cmluZywgbW9kdWxlSWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0d2Vha0lkfToke21vZHVsZUlkfWA7XG59XG5cbmZ1bmN0aW9uIGluc3RhbmNlS2V5KHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0d2Vha0lkfToke2lkfWA7XG59XG5cbmZ1bmN0aW9uIGhlbHBlcktleSh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7dHdlYWtJZH06JHtpZH1gO1xufVxuXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGw7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxPcHRpb25hbCh0YXJnZXQ6IHVua25vd24sIG1ldGhvZDogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgZm4gPSBhc1JlY29yZCh0YXJnZXQpPy5bbWV0aG9kXTtcbiAgaWYgKHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiKSBhd2FpdCBmbi5hcHBseSh0YXJnZXQsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBwYXJlbnRXaW5kb3dTdGF0ZShwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csIHJlYXNvbjogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgaWYgKGlzV2luZG93RGVzdHJveWVkKHBhcmVudFdpbmRvdykpIHJldHVybiBudWxsO1xuICBjb25zdCBib3VuZHMgPSBjYWxsV2luZG93TWV0aG9kPEVsZWN0cm9uLlJlY3RhbmdsZT4ocGFyZW50V2luZG93LCBcImdldEJvdW5kc1wiKTtcbiAgY29uc3QgY29udGVudEJvdW5kcyA9IGNhbGxXaW5kb3dNZXRob2Q8RWxlY3Ryb24uUmVjdGFuZ2xlPihwYXJlbnRXaW5kb3csIFwiZ2V0Q29udGVudEJvdW5kc1wiKTtcbiAgcmV0dXJuIHtcbiAgICByZWFzb24sXG4gICAgd2luZG93SWQ6IHdpbmRvd0lkRm9yKHBhcmVudFdpbmRvdyksXG4gICAgd2ViQ29udGVudHNJZDogd2ViQ29udGVudHNJZEZvcihwYXJlbnRXaW5kb3cpLFxuICAgIGJvdW5kcyxcbiAgICBjb250ZW50Qm91bmRzLFxuICAgIHZpc2libGU6IGNhbGxXaW5kb3dNZXRob2Q8Ym9vbGVhbj4ocGFyZW50V2luZG93LCBcImlzVmlzaWJsZVwiKSA/PyBudWxsLFxuICAgIGZvY3VzZWQ6IGNhbGxXaW5kb3dNZXRob2Q8Ym9vbGVhbj4ocGFyZW50V2luZG93LCBcImlzRm9jdXNlZFwiKSA/PyBudWxsLFxuICAgIG1pbmltaXplZDogY2FsbFdpbmRvd01ldGhvZDxib29sZWFuPihwYXJlbnRXaW5kb3csIFwiaXNNaW5pbWl6ZWRcIikgPz8gbnVsbCxcbiAgICBtYXhpbWl6ZWQ6IGNhbGxXaW5kb3dNZXRob2Q8Ym9vbGVhbj4ocGFyZW50V2luZG93LCBcImlzTWF4aW1pemVkXCIpID8/IG51bGwsXG4gICAgZnVsbHNjcmVlbjogY2FsbFdpbmRvd01ldGhvZDxib29sZWFuPihwYXJlbnRXaW5kb3csIFwiaXNGdWxsU2NyZWVuXCIpID8/IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZUhhbmRsZUZvcldpbmRvdyhwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogQnVmZmVyIHwgbnVsbCB7XG4gIGlmICghcGFyZW50V2luZG93IHx8IGlzV2luZG93RGVzdHJveWVkKHBhcmVudFdpbmRvdykpIHJldHVybiBudWxsO1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/LmdldE5hdGl2ZVdpbmRvd0hhbmRsZTtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBoYW5kbGUgPSBmbi5jYWxsKHBhcmVudFdpbmRvdyk7XG4gICAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcihoYW5kbGUpID8gaGFuZGxlIDogbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FuQmluZFBhcmVudFdpbmRvdyhcbiAgcGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCxcbik6IHBhcmVudFdpbmRvdyBpcyBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHtcbiAgaWYgKCFwYXJlbnRXaW5kb3cgfHwgaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50V2luZG93KSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gdHlwZW9mIGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/Lm9uID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICB0eXBlb2YgYXNSZWNvcmQocGFyZW50V2luZG93KT8ub2ZmID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbmZ1bmN0aW9uIGlzV2luZG93RGVzdHJveWVkKHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgY29uc3QgZm4gPSBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5pc0Rlc3Ryb3llZDtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEJvb2xlYW4oZm4uY2FsbChwYXJlbnRXaW5kb3cpKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gd2luZG93SWRGb3IocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCk6IG51bWJlciB8IG51bGwge1xuICBjb25zdCBpZCA9IGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/LmlkO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiID8gaWQgOiBudWxsO1xufVxuXG5mdW5jdGlvbiB3ZWJDb250ZW50c0lkRm9yKHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBudW1iZXIgfCBudWxsIHtcbiAgY29uc3Qgd2ViQ29udGVudHMgPSBhc1JlY29yZChhc1JlY29yZChwYXJlbnRXaW5kb3cpPy53ZWJDb250ZW50cyk7XG4gIGNvbnN0IGlkID0gd2ViQ29udGVudHM/LmlkO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiID8gaWQgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBjYWxsV2luZG93TWV0aG9kPFQ+KHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdywgbWV0aG9kOiBzdHJpbmcpOiBUIHwgbnVsbCB7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQocGFyZW50V2luZG93KT8uW21ldGhvZF07XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZuLmNhbGwocGFyZW50V2luZG93KSBhcyBUO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuIiwgImltcG9ydCB7IHJlYWxwYXRoU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBpc0Fic29sdXRlLCByZWxhdGl2ZSwgcmVzb2x2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVOYXRpdmVUd2Vha1BhdGgodHdlYWtEaXI6IHN0cmluZywgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiIHx8IHBhdGgudHJpbSgpID09PSBcIlwiKSB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgcGF0aCBpcyByZXF1aXJlZFwiKTtcbiAgY29uc3Qgcm9vdCA9IHJlYWxwYXRoU3luYyh0d2Vha0Rpcik7XG4gIGNvbnN0IGZ1bGwgPSByZXNvbHZlKHR3ZWFrRGlyLCBwYXRoKTtcbiAgbGV0IHRhcmdldDogc3RyaW5nO1xuICB0cnkge1xuICAgIHRhcmdldCA9IHJlYWxwYXRoU3luYyhmdWxsKTtcbiAgfSBjYXRjaCB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIHBhdGggZG9lcyBub3QgZXhpc3RcIik7XG4gIH1cbiAgaWYgKCFpc1BhdGhJbnNpZGUocm9vdCwgdGFyZ2V0KSB8fCB0YXJnZXQgPT09IHJvb3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgcGF0aCBtdXN0IHN0YXkgaW5zaWRlIHRoZSB0d2VhayBkaXJlY3RvcnlcIik7XG4gIH1cbiAgcmV0dXJuIHRhcmdldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzUGF0aEluc2lkZShwYXJlbnQ6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgcmVsID0gcmVsYXRpdmUocmVzb2x2ZShwYXJlbnQpLCByZXNvbHZlKHRhcmdldCkpO1xuICByZXR1cm4gcmVsID09PSBcIlwiIHx8ICghIXJlbCAmJiAhcmVsLnN0YXJ0c1dpdGgoXCIuLlwiKSAmJiAhaXNBYnNvbHV0ZShyZWwpKTtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFR3ZWFrTWFuaWZlc3QgfSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9UV0VBS19TVE9SRV9JTkRFWF9VUkwgPVxuICBcImh0dHBzOi8va3BraHhsZ3kwLmdpdGh1Yi5pby9jb2RleC1wbHVzcGx1cy9zdG9yZS9pbmRleC5qc29uXCI7XG5leHBvcnQgY29uc3QgVFdFQUtfU1RPUkVfUkVWSUVXX0lTU1VFX1VSTCA9XG4gIFwiaHR0cHM6Ly9naXRodWIuY29tL2twa2h4bGd5MC9jb2RleC1wbHVzcGx1cy9pc3N1ZXMvbmV3XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHdlYWtTdG9yZVJlZ2lzdHJ5IHtcbiAgc2NoZW1hVmVyc2lvbjogMTtcbiAgZ2VuZXJhdGVkQXQ/OiBzdHJpbmc7XG4gIGVudHJpZXM6IFR3ZWFrU3RvcmVFbnRyeVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFR3ZWFrU3RvcmVFbnRyeSB7XG4gIGlkOiBzdHJpbmc7XG4gIG1hbmlmZXN0OiBUd2Vha01hbmlmZXN0O1xuICByZXBvOiBzdHJpbmc7XG4gIGFwcHJvdmVkQ29tbWl0U2hhOiBzdHJpbmc7XG4gIGFwcHJvdmVkQXQ6IHN0cmluZztcbiAgYXBwcm92ZWRCeTogc3RyaW5nO1xuICBwbGF0Zm9ybXM/OiBUd2Vha1N0b3JlUGxhdGZvcm1bXTtcbiAgcmVsZWFzZVVybD86IHN0cmluZztcbiAgcmV2aWV3VXJsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBUd2Vha1N0b3JlUGxhdGZvcm0gPSBcImRhcndpblwiIHwgXCJ3aW4zMlwiIHwgXCJsaW51eFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbiB7XG4gIHJlcG86IHN0cmluZztcbiAgZGVmYXVsdEJyYW5jaDogc3RyaW5nO1xuICBjb21taXRTaGE6IHN0cmluZztcbiAgY29tbWl0VXJsOiBzdHJpbmc7XG4gIG1hbmlmZXN0Pzoge1xuICAgIGlkPzogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgdmVyc2lvbj86IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBpY29uVXJsPzogc3RyaW5nO1xuICB9O1xufVxuXG5jb25zdCBHSVRIVUJfUkVQT19SRSA9IC9eW0EtWmEtejAtOV8uLV0rXFwvW0EtWmEtejAtOV8uLV0rJC87XG5jb25zdCBGVUxMX1NIQV9SRSA9IC9eW2EtZjAtOV17NDB9JC9pO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplR2l0SHViUmVwbyhpbnB1dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmF3ID0gaW5wdXQudHJpbSgpO1xuICBpZiAoIXJhdykgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gaXMgcmVxdWlyZWRcIik7XG5cbiAgY29uc3Qgc3NoID0gL15naXRAZ2l0aHViXFwuY29tOihbXi9dK1xcL1teL10rPykoPzpcXC5naXQpPyQvaS5leGVjKHJhdyk7XG4gIGlmIChzc2gpIHJldHVybiBub3JtYWxpemVSZXBvUGFydChzc2hbMV0pO1xuXG4gIGlmICgvXmh0dHBzPzpcXC9cXC8vaS50ZXN0KHJhdykpIHtcbiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHJhdyk7XG4gICAgaWYgKHVybC5ob3N0bmFtZSAhPT0gXCJnaXRodWIuY29tXCIpIHRocm93IG5ldyBFcnJvcihcIk9ubHkgZ2l0aHViLmNvbSByZXBvc2l0b3JpZXMgYXJlIHN1cHBvcnRlZFwiKTtcbiAgICBjb25zdCBwYXJ0cyA9IHVybC5wYXRobmFtZS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKS5zcGxpdChcIi9cIik7XG4gICAgaWYgKHBhcnRzLmxlbmd0aCA8IDIpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIFVSTCBtdXN0IGluY2x1ZGUgb3duZXIgYW5kIHJlcG9zaXRvcnlcIik7XG4gICAgcmV0dXJuIG5vcm1hbGl6ZVJlcG9QYXJ0KGAke3BhcnRzWzBdfS8ke3BhcnRzWzFdfWApO1xuICB9XG5cbiAgcmV0dXJuIG5vcm1hbGl6ZVJlcG9QYXJ0KHJhdyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdG9yZVJlZ2lzdHJ5KGlucHV0OiB1bmtub3duKTogVHdlYWtTdG9yZVJlZ2lzdHJ5IHtcbiAgY29uc3QgcmVnaXN0cnkgPSBpbnB1dCBhcyBQYXJ0aWFsPFR3ZWFrU3RvcmVSZWdpc3RyeT4gfCBudWxsO1xuICBpZiAoIXJlZ2lzdHJ5IHx8IHJlZ2lzdHJ5LnNjaGVtYVZlcnNpb24gIT09IDEgfHwgIUFycmF5LmlzQXJyYXkocmVnaXN0cnkuZW50cmllcykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCB0d2VhayBzdG9yZSByZWdpc3RyeVwiKTtcbiAgfVxuICBjb25zdCBlbnRyaWVzID0gcmVnaXN0cnkuZW50cmllcy5tYXAobm9ybWFsaXplU3RvcmVFbnRyeSk7XG4gIGVudHJpZXMuc29ydCgoYSwgYikgPT4gYS5tYW5pZmVzdC5uYW1lLmxvY2FsZUNvbXBhcmUoYi5tYW5pZmVzdC5uYW1lKSk7XG4gIHJldHVybiB7XG4gICAgc2NoZW1hVmVyc2lvbjogMSxcbiAgICBnZW5lcmF0ZWRBdDogdHlwZW9mIHJlZ2lzdHJ5LmdlbmVyYXRlZEF0ID09PSBcInN0cmluZ1wiID8gcmVnaXN0cnkuZ2VuZXJhdGVkQXQgOiB1bmRlZmluZWQsXG4gICAgZW50cmllcyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGVTdG9yZUVudHJpZXM8VD4oXG4gIGVudHJpZXM6IHJlYWRvbmx5IFRbXSxcbiAgcmFuZG9tSW5kZXg6IChleGNsdXNpdmVNYXg6IG51bWJlcikgPT4gbnVtYmVyID0gKGV4Y2x1c2l2ZU1heCkgPT4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogZXhjbHVzaXZlTWF4KSxcbik6IFRbXSB7XG4gIGNvbnN0IHNodWZmbGVkID0gWy4uLmVudHJpZXNdO1xuICBmb3IgKGxldCBpID0gc2h1ZmZsZWQubGVuZ3RoIC0gMTsgaSA+IDA7IGkgLT0gMSkge1xuICAgIGNvbnN0IGogPSByYW5kb21JbmRleChpICsgMSk7XG4gICAgaWYgKCFOdW1iZXIuaXNJbnRlZ2VyKGopIHx8IGogPCAwIHx8IGogPiBpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYHNodWZmbGUgcmFuZG9tSW5kZXggcmV0dXJuZWQgJHtqfTsgZXhwZWN0ZWQgYW4gaW50ZWdlciBmcm9tIDAgdG8gJHtpfWApO1xuICAgIH1cbiAgICBbc2h1ZmZsZWRbaV0sIHNodWZmbGVkW2pdXSA9IFtzaHVmZmxlZFtqXSwgc2h1ZmZsZWRbaV1dO1xuICB9XG4gIHJldHVybiBzaHVmZmxlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0b3JlRW50cnkoaW5wdXQ6IHVua25vd24pOiBUd2Vha1N0b3JlRW50cnkge1xuICBjb25zdCBlbnRyeSA9IGlucHV0IGFzIFBhcnRpYWw8VHdlYWtTdG9yZUVudHJ5PiB8IG51bGw7XG4gIGlmICghZW50cnkgfHwgdHlwZW9mIGVudHJ5ICE9PSBcIm9iamVjdFwiKSB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHR3ZWFrIHN0b3JlIGVudHJ5XCIpO1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhTdHJpbmcoZW50cnkucmVwbyA/PyBlbnRyeS5tYW5pZmVzdD8uZ2l0aHViUmVwbyA/PyBcIlwiKSk7XG4gIGNvbnN0IG1hbmlmZXN0ID0gZW50cnkubWFuaWZlc3QgYXMgVHdlYWtNYW5pZmVzdCB8IHVuZGVmaW5lZDtcbiAgaWYgKCFtYW5pZmVzdD8uaWQgfHwgIW1hbmlmZXN0Lm5hbWUgfHwgIW1hbmlmZXN0LnZlcnNpb24pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFN0b3JlIGVudHJ5IGZvciAke3JlcG99IGlzIG1pc3NpbmcgbWFuaWZlc3QgZmllbGRzYCk7XG4gIH1cbiAgaWYgKG5vcm1hbGl6ZUdpdEh1YlJlcG8obWFuaWZlc3QuZ2l0aHViUmVwbykgIT09IHJlcG8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFN0b3JlIGVudHJ5ICR7bWFuaWZlc3QuaWR9IHJlcG8gZG9lcyBub3QgbWF0Y2ggbWFuaWZlc3QgZ2l0aHViUmVwb2ApO1xuICB9XG4gIGlmICghaXNGdWxsQ29tbWl0U2hhKFN0cmluZyhlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSA/PyBcIlwiKSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFN0b3JlIGVudHJ5ICR7bWFuaWZlc3QuaWR9IG11c3QgcGluIGEgZnVsbCBhcHByb3ZlZCBjb21taXQgU0hBYCk7XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBpZDogbWFuaWZlc3QuaWQsXG4gICAgbWFuaWZlc3QsXG4gICAgcmVwbyxcbiAgICBhcHByb3ZlZENvbW1pdFNoYTogU3RyaW5nKGVudHJ5LmFwcHJvdmVkQ29tbWl0U2hhKSxcbiAgICBhcHByb3ZlZEF0OiB0eXBlb2YgZW50cnkuYXBwcm92ZWRBdCA9PT0gXCJzdHJpbmdcIiA/IGVudHJ5LmFwcHJvdmVkQXQgOiBcIlwiLFxuICAgIGFwcHJvdmVkQnk6IHR5cGVvZiBlbnRyeS5hcHByb3ZlZEJ5ID09PSBcInN0cmluZ1wiID8gZW50cnkuYXBwcm92ZWRCeSA6IFwiXCIsXG4gICAgcGxhdGZvcm1zOiBub3JtYWxpemVTdG9yZVBsYXRmb3JtcygoZW50cnkgYXMgeyBwbGF0Zm9ybXM/OiB1bmtub3duIH0pLnBsYXRmb3JtcyksXG4gICAgcmVsZWFzZVVybDogb3B0aW9uYWxHaXRodWJVcmwoZW50cnkucmVsZWFzZVVybCksXG4gICAgcmV2aWV3VXJsOiBvcHRpb25hbEdpdGh1YlVybChlbnRyeS5yZXZpZXdVcmwpLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVBcmNoaXZlVXJsKGVudHJ5OiBUd2Vha1N0b3JlRW50cnkpOiBzdHJpbmcge1xuICBpZiAoIWlzRnVsbENvbW1pdFNoYShlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFN0b3JlIGVudHJ5ICR7ZW50cnkuaWR9IGlzIG5vdCBwaW5uZWQgdG8gYSBmdWxsIGNvbW1pdCBTSEFgKTtcbiAgfVxuICByZXR1cm4gYGh0dHBzOi8vY29kZWxvYWQuZ2l0aHViLmNvbS8ke2VudHJ5LnJlcG99L3Rhci5nei8ke2VudHJ5LmFwcHJvdmVkQ29tbWl0U2hhfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBidWlsZFR3ZWFrUHVibGlzaElzc3VlVXJsKHN1Ym1pc3Npb246IFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbik6IHN0cmluZyB7XG4gIGNvbnN0IHJlcG8gPSBub3JtYWxpemVHaXRIdWJSZXBvKHN1Ym1pc3Npb24ucmVwbyk7XG4gIGlmICghaXNGdWxsQ29tbWl0U2hhKHN1Ym1pc3Npb24uY29tbWl0U2hhKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlN1Ym1pc3Npb24gbXVzdCBpbmNsdWRlIHRoZSBmdWxsIGNvbW1pdCBTSEEgdG8gcmV2aWV3XCIpO1xuICB9XG4gIGNvbnN0IHRpdGxlID0gYFR3ZWFrIHN0b3JlIHJldmlldzogJHtyZXBvfWA7XG4gIGNvbnN0IGJvZHkgPSBbXG4gICAgXCIjIyBUd2VhayByZXBvXCIsXG4gICAgYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99YCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQ29tbWl0IHRvIHJldmlld1wiLFxuICAgIHN1Ym1pc3Npb24uY29tbWl0U2hhLFxuICAgIHN1Ym1pc3Npb24uY29tbWl0VXJsLFxuICAgIFwiXCIsXG4gICAgXCJEbyBub3QgYXBwcm92ZSBhIGRpZmZlcmVudCBjb21taXQuIElmIHRoZSBhdXRob3IgcHVzaGVzIGNoYW5nZXMsIGFzayB0aGVtIHRvIHJlc3VibWl0LlwiLFxuICAgIFwiXCIsXG4gICAgXCIjIyBNYW5pZmVzdFwiLFxuICAgIGAtIGlkOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/LmlkID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIG5hbWU6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8ubmFtZSA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSB2ZXJzaW9uOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/LnZlcnNpb24gPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gZGVzY3JpcHRpb246ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uZGVzY3JpcHRpb24gPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gaWNvblVybDogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5pY29uVXJsID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIFwiXCIsXG4gICAgXCIjIyBBZG1pbiBjaGVja2xpc3RcIixcbiAgICBcIi0gWyBdIG1hbmlmZXN0Lmpzb24gaXMgdmFsaWRcIixcbiAgICBcIi0gWyBdIG1hbmlmZXN0Lmljb25VcmwgaXMgdXNhYmxlIGFzIHRoZSBzdG9yZSBpY29uXCIsXG4gICAgXCItIFsgXSBzb3VyY2Ugd2FzIHJldmlld2VkIGF0IHRoZSBleGFjdCBjb21taXQgYWJvdmVcIixcbiAgICBcIi0gWyBdIGBzdG9yZS9pbmRleC5qc29uYCBlbnRyeSBwaW5zIGBhcHByb3ZlZENvbW1pdFNoYWAgdG8gdGhlIGV4YWN0IGNvbW1pdCBhYm92ZVwiLFxuICBdLmpvaW4oXCJcXG5cIik7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoVFdFQUtfU1RPUkVfUkVWSUVXX0lTU1VFX1VSTCk7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwidGVtcGxhdGVcIiwgXCJ0d2Vhay1zdG9yZS1yZXZpZXcubWRcIik7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwidGl0bGVcIiwgdGl0bGUpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcImJvZHlcIiwgYm9keSk7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRnVsbENvbW1pdFNoYSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBGVUxMX1NIQV9SRS50ZXN0KHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplUmVwb1BhcnQodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJlcG8gPSB2YWx1ZS50cmltKCkucmVwbGFjZSgvXFwuZ2l0JC9pLCBcIlwiKS5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCBcIlwiKTtcbiAgaWYgKCFHSVRIVUJfUkVQT19SRS50ZXN0KHJlcG8pKSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBtdXN0IGJlIGluIG93bmVyL3JlcG8gZm9ybVwiKTtcbiAgcmV0dXJuIHJlcG87XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVN0b3JlUGxhdGZvcm1zKGlucHV0OiB1bmtub3duKTogVHdlYWtTdG9yZVBsYXRmb3JtW10gfCB1bmRlZmluZWQge1xuICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGlucHV0KSkgdGhyb3cgbmV3IEVycm9yKFwiU3RvcmUgZW50cnkgcGxhdGZvcm1zIG11c3QgYmUgYW4gYXJyYXlcIik7XG4gIGNvbnN0IGFsbG93ZWQgPSBuZXcgU2V0PFR3ZWFrU3RvcmVQbGF0Zm9ybT4oW1wiZGFyd2luXCIsIFwid2luMzJcIiwgXCJsaW51eFwiXSk7XG4gIGNvbnN0IHBsYXRmb3JtcyA9IEFycmF5LmZyb20obmV3IFNldChpbnB1dC5tYXAoKHZhbHVlKSA9PiB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIiB8fCAhYWxsb3dlZC5oYXModmFsdWUgYXMgVHdlYWtTdG9yZVBsYXRmb3JtKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBzdG9yZSBwbGF0Zm9ybTogJHtTdHJpbmcodmFsdWUpfWApO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWUgYXMgVHdlYWtTdG9yZVBsYXRmb3JtO1xuICB9KSkpO1xuICByZXR1cm4gcGxhdGZvcm1zLmxlbmd0aCA+IDAgPyBwbGF0Zm9ybXMgOiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIG9wdGlvbmFsR2l0aHViVXJsKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIiB8fCAhdmFsdWUudHJpbSgpKSByZXR1cm4gdW5kZWZpbmVkO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHZhbHVlKTtcbiAgaWYgKHVybC5wcm90b2NvbCAhPT0gXCJodHRwczpcIiB8fCB1cmwuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSByZXR1cm4gdW5kZWZpbmVkO1xuICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG59XG4iLCAiaW1wb3J0IHsgYXBwLCBCcm93c2VyVmlldywgQnJvd3NlcldpbmRvdywgTWVzc2FnZUNoYW5uZWxNYWluLCBpcGNNYWluLCBuYXRpdmVUaGVtZSB9IGZyb20gXCJlbGVjdHJvblwiO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCwgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jLCBzdGF0U3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXIsIHR5cGUgSW5jb21pbmdNZXNzYWdlLCB0eXBlIFNlcnZlciwgdHlwZSBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gXCJub2RlOmh0dHBcIjtcbmltcG9ydCB7IGpvaW4sIG5vcm1hbGl6ZSwgcmVsYXRpdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7IFNvY2tldCB9IGZyb20gXCJub2RlOm5ldFwiO1xuXG5jb25zdCBDT05ORUNUX1BPUlRfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWNvbm5lY3QtYXBwLWhvc3RcIjtcbmNvbnN0IEJSSURHRV9SRVFVRVNUX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVxdWVzdFwiO1xuY29uc3QgQlJJREdFX1JFU1BPTlNFX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1icmlkZ2UtcmVzcG9uc2VcIjtcbmNvbnN0IE1FU1NBR0VfRk9SX1ZJRVdfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLW1lc3NhZ2UtZm9yLXZpZXdcIjtcbmNvbnN0IFdPUktFUl9NRVNTQUdFX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS13b3JrZXItbWVzc2FnZVwiO1xuY29uc3QgU1lTVEVNX1RIRU1FX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1zeXN0ZW0tdGhlbWVcIjtcblxudHlwZSBMb2dGbiA9IChsZXZlbDogXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkO1xuXG5pbnRlcmZhY2UgQ29kZXhXaW5kb3dTZXJ2aWNlcyB7XG4gIGdldENvbnRleHQ/OiAoaG9zdElkOiBzdHJpbmcpID0+IHsgcmVnaXN0ZXJXaW5kb3c/OiAod2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlKSA9PiB2b2lkIH0gfCBudWxsO1xuICBnZXRDb250ZXh0Rm9yV2ViQ29udGVudHM/OiAoXG4gICAgd2ViQ29udGVudHM6IEVsZWN0cm9uLldlYkNvbnRlbnRzLFxuICApID0+IHsgcmVnaXN0ZXJXaW5kb3c/OiAod2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlKSA9PiB2b2lkIH0gfCBudWxsO1xuICB3aW5kb3dNYW5hZ2VyPzoge1xuICAgIHJlZ2lzdGVyV2luZG93PzogKFxuICAgICAgd2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlLFxuICAgICAgaG9zdElkOiBzdHJpbmcsXG4gICAgICBwcmltYXJ5OiBib29sZWFuLFxuICAgICAgYXBwZWFyYW5jZTogc3RyaW5nLFxuICAgICkgPT4gdm9pZDtcbiAgICBvcHRpb25zPzoge1xuICAgICAgYWxsb3dEZXZ0b29scz86IGJvb2xlYW47XG4gICAgICBwcmVsb2FkUGF0aD86IHN0cmluZztcbiAgICB9O1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ29kZXhXaW5kb3dMaWtlIHtcbiAgaWQ6IG51bWJlcjtcbiAgd2ViQ29udGVudHM6IEVsZWN0cm9uLldlYkNvbnRlbnRzO1xuICBvbihldmVudDogXCJjbG9zZWRcIiwgbGlzdGVuZXI6ICgpID0+IHZvaWQpOiB1bmtub3duO1xuICBvbmNlPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIG9mZj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICByZW1vdmVMaXN0ZW5lcj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICBpc0Rlc3Ryb3llZD8oKTogYm9vbGVhbjtcbiAgaXNGb2N1c2VkPygpOiBib29sZWFuO1xuICBmb2N1cz8oKTogdm9pZDtcbiAgc2hvdz8oKTogdm9pZDtcbiAgaGlkZT8oKTogdm9pZDtcbiAgZ2V0Qm91bmRzPygpOiBFbGVjdHJvbi5SZWN0YW5nbGU7XG4gIGdldENvbnRlbnRCb3VuZHM/KCk6IEVsZWN0cm9uLlJlY3RhbmdsZTtcbiAgZ2V0U2l6ZT8oKTogW251bWJlciwgbnVtYmVyXTtcbiAgZ2V0Q29udGVudFNpemU/KCk6IFtudW1iZXIsIG51bWJlcl07XG4gIHNldFRpdGxlPyh0aXRsZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0VGl0bGU/KCk6IHN0cmluZztcbiAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZT8oZmlsZW5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldERvY3VtZW50RWRpdGVkPyhlZGl0ZWQ6IGJvb2xlYW4pOiB2b2lkO1xuICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5Pyh2aXNpYmxlOiBib29sZWFuKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIEJyb3dzZXJVaVNlcnZlck9wdGlvbnMge1xuICBwb3J0OiBudW1iZXI7XG4gIGhvc3Q6IHN0cmluZztcbiAgaGlkZU1haW5XaW5kb3c6IGJvb2xlYW47XG4gIGdldFdpbmRvd1NlcnZpY2VzOiAoKSA9PiBDb2RleFdpbmRvd1NlcnZpY2VzIHwgbnVsbDtcbiAgbG9nOiBMb2dGbjtcbn1cblxuaW50ZXJmYWNlIEJyb3dzZXJVaUhvc3Qge1xuICB2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldztcbiAgd2ViQ29udGVudHM6IEVsZWN0cm9uLldlYkNvbnRlbnRzO1xufVxuXG5pbnRlcmZhY2UgQnJpZGdlUGVuZGluZ1JlcXVlc3Qge1xuICByZXNvbHZlOiAodmFsdWU6IHVua25vd24pID0+IHZvaWQ7XG4gIHJlamVjdDogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbiAgdGltZXI6IE5vZGVKUy5UaW1lb3V0O1xufVxuXG5pbnRlcmZhY2UgSW5pdGlhbFN0YXRlIHtcbiAgc25hcHNob3Q6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xuICBzeXN0ZW1UaGVtZVZhcmlhbnQ6IHN0cmluZztcbiAgc2VudHJ5SW5pdE9wdGlvbnM6IHVua25vd247XG4gIGJ1aWxkRmxhdm9yOiB1bmtub3duO1xuICB1c2VzT3dsQXBwU2hlbGw6IGJvb2xlYW47XG4gIHBsYXRmb3JtOiBOb2RlSlMuUGxhdGZvcm07XG4gIGFyY2g6IHN0cmluZztcbn1cblxuY29uc3QgTUlNRV9UWVBFUzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHtcbiAgXCIuaHRtbFwiOiBcInRleHQvaHRtbDsgY2hhcnNldD11dGYtOFwiLFxuICBcIi5qc1wiOiBcInRleHQvamF2YXNjcmlwdDsgY2hhcnNldD11dGYtOFwiLFxuICBcIi5jc3NcIjogXCJ0ZXh0L2NzczsgY2hhcnNldD11dGYtOFwiLFxuICBcIi5qc29uXCI6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxuICBcIi5zdmdcIjogXCJpbWFnZS9zdmcreG1sXCIsXG4gIFwiLnBuZ1wiOiBcImltYWdlL3BuZ1wiLFxuICBcIi5qcGdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLmpwZWdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLndlYnBcIjogXCJpbWFnZS93ZWJwXCIsXG4gIFwiLmljb1wiOiBcImltYWdlL3gtaWNvblwiLFxuICBcIi53b2ZmXCI6IFwiZm9udC93b2ZmXCIsXG4gIFwiLndvZmYyXCI6IFwiZm9udC93b2ZmMlwiLFxufTtcblxubGV0IGFjdGl2ZVNlcnZlcjogU2VydmVyIHwgbnVsbCA9IG51bGw7XG5sZXQgYWN0aXZlSG9zdDogQnJvd3NlclVpSG9zdCB8IG51bGwgPSBudWxsO1xubGV0IGFjdGl2ZU9wdGlvbnM6IEJyb3dzZXJVaVNlcnZlck9wdGlvbnMgfCBudWxsID0gbnVsbDtcbmNvbnN0IGJyaWRnZVJlcXVlc3RzID0gbmV3IE1hcDxzdHJpbmcsIEJyaWRnZVBlbmRpbmdSZXF1ZXN0PigpO1xuY29uc3QgY29udHJvbENsaWVudHMgPSBuZXcgU2V0PFdlYlNvY2tldENvbm5lY3Rpb24+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXliZVN0YXJ0QnJvd3NlclVpU2VydmVyKFxuICBvcHRzOiBQaWNrPEJyb3dzZXJVaVNlcnZlck9wdGlvbnMsIFwiZ2V0V2luZG93U2VydmljZXNcIiB8IFwibG9nXCI+LFxuKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLmVudi5DT0RFWFBQX0JST1dTRVJfVUkgIT09IFwiMVwiKSByZXR1cm47XG4gIGNvbnN0IHBvcnQgPSBwYXJzZVBvcnQocHJvY2Vzcy5lbnYuQ09ERVhQUF9CUk9XU0VSX1VJX1BPUlQsIDg3NjUpO1xuICBzdGFydEJyb3dzZXJVaVNlcnZlcih7XG4gICAgLi4ub3B0cyxcbiAgICBwb3J0LFxuICAgIGhvc3Q6IFwiMTI3LjAuMC4xXCIsXG4gICAgaGlkZU1haW5XaW5kb3c6IHByb2Nlc3MuZW52LkNPREVYUFBfQlJPV1NFUl9VSV9ISURFX01BSU4gPT09IFwiMVwiLFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0QnJvd3NlclVpU2VydmVyKG9wdHM6IEJyb3dzZXJVaVNlcnZlck9wdGlvbnMpOiB2b2lkIHtcbiAgaWYgKGFjdGl2ZVNlcnZlcikgcmV0dXJuO1xuICBhY3RpdmVPcHRpb25zID0gb3B0cztcbiAgaW5zdGFsbEJyb3dzZXJVaUlwY0hhbmRsZXJzKG9wdHMubG9nKTtcblxuICBjb25zdCBzZXJ2ZXIgPSBjcmVhdGVTZXJ2ZXIoKHJlcSwgcmVzKSA9PiB7XG4gICAgaGFuZGxlSHR0cFJlcXVlc3QocmVxLCByZXMpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgb3B0cy5sb2coXCJlcnJvclwiLCBcImJyb3dzZXIgVUkgcmVxdWVzdCBmYWlsZWRcIiwgeyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgc2VuZFRleHQocmVzLCA1MDAsIFwiSW50ZXJuYWwgU2VydmVyIEVycm9yXFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICB9KTtcbiAgfSk7XG4gIHNlcnZlci5vbihcInVwZ3JhZGVcIiwgKHJlcSwgc29ja2V0LCBoZWFkKSA9PiB7XG4gICAgaGFuZGxlVXBncmFkZShyZXEsIHNvY2tldCBhcyBTb2NrZXQsIGhlYWQpLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgb3B0cy5sb2coXCJ3YXJuXCIsIFwiYnJvd3NlciBVSSB3ZWJzb2NrZXQgdXBncmFkZSBmYWlsZWRcIiwgeyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIH0pO1xuICAgICAgc29ja2V0LmRlc3Ryb3koKTtcbiAgICB9KTtcbiAgfSk7XG4gIHNlcnZlci5vbihcImVycm9yXCIsIChlcnJvcikgPT4ge1xuICAgIG9wdHMubG9nKFwiZXJyb3JcIiwgXCJicm93c2VyIFVJIHNlcnZlciBmYWlsZWRcIiwgeyBtZXNzYWdlOiBlcnJvci5tZXNzYWdlIH0pO1xuICB9KTtcbiAgc2VydmVyLmxpc3RlbihvcHRzLnBvcnQsIG9wdHMuaG9zdCwgKCkgPT4ge1xuICAgIG9wdHMubG9nKFwiaW5mb1wiLCBgYnJvd3NlciBVSSBzZXJ2ZXIgbGlzdGVuaW5nIGF0IGh0dHA6Ly8ke29wdHMuaG9zdH06JHtvcHRzLnBvcnR9L2ApO1xuICB9KTtcbiAgYWN0aXZlU2VydmVyID0gc2VydmVyO1xuICBpZiAob3B0cy5oaWRlTWFpbldpbmRvdykge1xuICAgIGZvciAoY29uc3QgZGVsYXlNcyBvZiBbNTAwLCAxXzUwMCwgM18wMDBdKSB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoaGlkZVZpc2libGVDb2RleFdpbmRvd3MsIGRlbGF5TXMpO1xuICAgICAgdGltZXIudW5yZWY/LigpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsQnJvd3NlclVpSXBjSGFuZGxlcnMobG9nOiBMb2dGbik6IHZvaWQge1xuICBpcGNNYWluLnJlbW92ZUFsbExpc3RlbmVycyhCUklER0VfUkVTUE9OU0VfQ0hBTk5FTCk7XG4gIGlwY01haW4ucmVtb3ZlQWxsTGlzdGVuZXJzKE1FU1NBR0VfRk9SX1ZJRVdfQ0hBTk5FTCk7XG4gIGlwY01haW4ucmVtb3ZlQWxsTGlzdGVuZXJzKFdPUktFUl9NRVNTQUdFX0NIQU5ORUwpO1xuICBpcGNNYWluLnJlbW92ZUFsbExpc3RlbmVycyhTWVNURU1fVEhFTUVfQ0hBTk5FTCk7XG5cbiAgaXBjTWFpbi5vbihCUklER0VfUkVTUE9OU0VfQ0hBTk5FTCwgKGV2ZW50LCBwYXlsb2FkKSA9PiB7XG4gICAgaWYgKCFpc0Jyb3dzZXJVaUhvc3RTZW5kZXIoZXZlbnQuc2VuZGVyKSkgcmV0dXJuO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXNSZWNvcmQocGF5bG9hZCk7XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgcmVzcG9uc2U/LmlkID09PSBcInN0cmluZ1wiID8gcmVzcG9uc2UuaWQgOiBcIlwiO1xuICAgIGNvbnN0IHBlbmRpbmcgPSBicmlkZ2VSZXF1ZXN0cy5nZXQoaWQpO1xuICAgIGlmICghcGVuZGluZykgcmV0dXJuO1xuICAgIGJyaWRnZVJlcXVlc3RzLmRlbGV0ZShpZCk7XG4gICAgY2xlYXJUaW1lb3V0KHBlbmRpbmcudGltZXIpO1xuICAgIGlmIChyZXNwb25zZT8ub2sgPT09IHRydWUpIHtcbiAgICAgIHBlbmRpbmcucmVzb2x2ZShyZXNwb25zZS52YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBlbmRpbmcucmVqZWN0KG5ldyBFcnJvcih0eXBlb2YgcmVzcG9uc2U/LmVycm9yID09PSBcInN0cmluZ1wiID8gcmVzcG9uc2UuZXJyb3IgOiBcIkJyaWRnZSByZXF1ZXN0IGZhaWxlZFwiKSk7XG4gICAgfVxuICB9KTtcblxuICBpcGNNYWluLm9uKE1FU1NBR0VfRk9SX1ZJRVdfQ0hBTk5FTCwgKGV2ZW50LCBtZXNzYWdlKSA9PiB7XG4gICAgaWYgKCFpc0Jyb3dzZXJVaUhvc3RTZW5kZXIoZXZlbnQuc2VuZGVyKSkgcmV0dXJuO1xuICAgIGJyb2FkY2FzdENvbnRyb2woeyB0eXBlOiBcIm1lc3NhZ2UtZm9yLXZpZXdcIiwgbWVzc2FnZSB9KTtcbiAgfSk7XG5cbiAgaXBjTWFpbi5vbihXT1JLRVJfTUVTU0FHRV9DSEFOTkVMLCAoZXZlbnQsIHdvcmtlcklkLCBtZXNzYWdlKSA9PiB7XG4gICAgaWYgKCFpc0Jyb3dzZXJVaUhvc3RTZW5kZXIoZXZlbnQuc2VuZGVyKSkgcmV0dXJuO1xuICAgIGlmICh0eXBlb2Ygd29ya2VySWQgIT09IFwic3RyaW5nXCIpIHJldHVybjtcbiAgICBicm9hZGNhc3RDb250cm9sKHsgdHlwZTogXCJ3b3JrZXItbWVzc2FnZVwiLCB3b3JrZXJJZCwgbWVzc2FnZSB9KTtcbiAgfSk7XG5cbiAgaXBjTWFpbi5vbihTWVNURU1fVEhFTUVfQ0hBTk5FTCwgKGV2ZW50LCB2YWx1ZSkgPT4ge1xuICAgIGlmICghaXNCcm93c2VyVWlIb3N0U2VuZGVyKGV2ZW50LnNlbmRlcikpIHJldHVybjtcbiAgICBicm9hZGNhc3RDb250cm9sKHsgdHlwZTogXCJzeXN0ZW0tdGhlbWUtdmFyaWFudC11cGRhdGVkXCIsIHZhbHVlIH0pO1xuICB9KTtcblxuICBwcm9jZXNzLm9uY2UoXCJleGl0XCIsICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IHBlbmRpbmcgb2YgYnJpZGdlUmVxdWVzdHMudmFsdWVzKCkpIHtcbiAgICAgIGNsZWFyVGltZW91dChwZW5kaW5nLnRpbWVyKTtcbiAgICAgIHBlbmRpbmcucmVqZWN0KG5ldyBFcnJvcihcIkNvZGV4KysgYnJvd3NlciBVSSBzZXJ2ZXIgc3RvcHBlZFwiKSk7XG4gICAgfVxuICAgIGJyaWRnZVJlcXVlc3RzLmNsZWFyKCk7XG4gICAgZm9yIChjb25zdCBjbGllbnQgb2YgY29udHJvbENsaWVudHMpIGNsaWVudC5jbG9zZSgpO1xuICAgIGNvbnRyb2xDbGllbnRzLmNsZWFyKCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChhY3RpdmVIb3N0ICYmICFhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgYWN0aXZlSG9zdC53ZWJDb250ZW50cy5jbG9zZSh7IHdhaXRGb3JCZWZvcmVVbmxvYWQ6IGZhbHNlIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIFwiYnJvd3NlciBVSSBob3N0IGNsZWFudXAgZmFpbGVkXCIsIHsgbWVzc2FnZTogU3RyaW5nKGVycm9yKSB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVIdHRwUmVxdWVzdChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBvcHRpb25zID0gcmVxdWlyZU9wdGlvbnMoKTtcbiAgY29uc3QgdXJsID0gcmVxdWVzdFVybChyZXEpO1xuICBpZiAoIXVybCkge1xuICAgIHNlbmRUZXh0KHJlcywgNDAwLCBcIkJhZCBSZXF1ZXN0XFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodXJsLnBhdGhuYW1lID09PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvaGVhbHRoXCIpIHtcbiAgICBzZW5kSnNvbihyZXMsIDIwMCwgeyBvazogdHJ1ZSB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodXJsLnBhdGhuYW1lID09PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvYnJpZGdlXCIpIHtcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gXCJQT1NUXCIpIHtcbiAgICAgIHNlbmRUZXh0KHJlcywgNDA1LCBcIk1ldGhvZCBOb3QgQWxsb3dlZFxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGJvZHkgPSBhc1JlY29yZChhd2FpdCByZWFkSnNvbkJvZHkocmVxKSk7XG4gICAgY29uc3QgbWV0aG9kID0gdHlwZW9mIGJvZHk/Lm1ldGhvZCA9PT0gXCJzdHJpbmdcIiA/IGJvZHkubWV0aG9kIDogXCJcIjtcbiAgICBjb25zdCBhcmdzID0gQXJyYXkuaXNBcnJheShib2R5Py5hcmdzKSA/IGJvZHkuYXJncyA6IFtdO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGNhbGxIaWRkZW5CcmlkZ2UobWV0aG9kLCBhcmdzKTtcbiAgICAgIHNlbmRKc29uKHJlcywgMjAwLCB7IG9rOiB0cnVlLCB2YWx1ZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgc2VuZEpzb24ocmVzLCA1MDAsIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh1cmwucGF0aG5hbWUgPT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9icmlkZ2UuanNcIikge1xuICAgIGlmIChyZXEubWV0aG9kICE9PSBcIkdFVFwiICYmIHJlcS5tZXRob2QgIT09IFwiSEVBRFwiKSB7XG4gICAgICBzZW5kVGV4dChyZXMsIDQwNSwgXCJNZXRob2QgTm90IEFsbG93ZWRcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzY3JpcHQgPSBicm93c2VyQnJpZGdlU2NyaXB0KGF3YWl0IGNvbGxlY3RJbml0aWFsU3RhdGUob3B0aW9ucykpO1xuICAgIHNlbmRCdWZmZXIocmVzLCAyMDAsIEJ1ZmZlci5mcm9tKHNjcmlwdCksIE1JTUVfVFlQRVNbXCIuanNcIl0sIHJlcS5tZXRob2QgPT09IFwiSEVBRFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocmVxLm1ldGhvZCAhPT0gXCJHRVRcIiAmJiByZXEubWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgIHNlbmRUZXh0KHJlcywgNDA1LCBcIk1ldGhvZCBOb3QgQWxsb3dlZFxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHVybC5wYXRobmFtZSA9PT0gXCIvXCIgfHwgdXJsLnBhdGhuYW1lID09PSBcIi9pbmRleC5odG1sXCIpIHtcbiAgICBjb25zdCBodG1sID0gYXdhaXQgYnJvd3NlckluZGV4SHRtbCgpO1xuICAgIHNlbmRCdWZmZXIocmVzLCAyMDAsIEJ1ZmZlci5mcm9tKGh0bWwpLCBNSU1FX1RZUEVTW1wiLmh0bWxcIl0sIHJlcS5tZXRob2QgPT09IFwiSEVBRFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBmaWxlID0gd2Vidmlld0ZpbGUodXJsLnBhdGhuYW1lKTtcbiAgaWYgKCFmaWxlKSB7XG4gICAgc2VuZFRleHQocmVzLCA0MDQsIFwiTm90IEZvdW5kXFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgY29udGVudCA9IHJlYWRGaWxlU3luYyhmaWxlKTtcbiAgc2VuZEJ1ZmZlcihyZXMsIDIwMCwgY29udGVudCwgbWltZVR5cGUoZmlsZSksIHJlcS5tZXRob2QgPT09IFwiSEVBRFwiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlVXBncmFkZShyZXE6IEluY29taW5nTWVzc2FnZSwgc29ja2V0OiBTb2NrZXQsIGhlYWQ6IEJ1ZmZlcik6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCB1cmwgPSByZXF1ZXN0VXJsKHJlcSk7XG4gIGlmICghdXJsKSB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgd2Vic29ja2V0IFVSTFwiKTtcbiAgaWYgKHVybC5wYXRobmFtZSAhPT0gXCIvY29kZXhwcC9icm93c2VyLXVpL3JwY1wiICYmIHVybC5wYXRobmFtZSAhPT0gXCIvY29kZXhwcC9icm93c2VyLXVpL2NvbnRyb2xcIikge1xuICAgIHNvY2tldC5kZXN0cm95KCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHdzID0gYWNjZXB0V2ViU29ja2V0KHJlcSwgc29ja2V0LCBoZWFkKTtcbiAgaWYgKHVybC5wYXRobmFtZSA9PT0gXCIvY29kZXhwcC9icm93c2VyLXVpL2NvbnRyb2xcIikge1xuICAgIGNvbnRyb2xDbGllbnRzLmFkZCh3cyk7XG4gICAgd3Mub25DbG9zZSgoKSA9PiBjb250cm9sQ2xpZW50cy5kZWxldGUod3MpKTtcbiAgICB3cy5zZW5kSnNvbih7IHR5cGU6IFwiaGVsbG9cIiB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICBjb25zdCBob3N0ID0gYXdhaXQgZW5zdXJlQnJvd3NlclVpSG9zdCgpO1xuICBjb25zdCB7IHBvcnQxLCBwb3J0MiB9ID0gbmV3IE1lc3NhZ2VDaGFubmVsTWFpbigpO1xuICBob3N0LndlYkNvbnRlbnRzLnBvc3RNZXNzYWdlKENPTk5FQ1RfUE9SVF9DSEFOTkVMLCB7fSwgW3BvcnQyXSk7XG4gIGJyaWRnZU1lc3NhZ2VQb3J0VG9XZWJTb2NrZXQocG9ydDEsIHdzKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYnJvd3NlckluZGV4SHRtbCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICBjb25zdCBpbmRleFBhdGggPSBqb2luKHdlYnZpZXdSb290KCksIFwiaW5kZXguaHRtbFwiKTtcbiAgbGV0IGh0bWwgPSByZWxheEJyb3dzZXJVaUNzcChyZWFkRmlsZVN5bmMoaW5kZXhQYXRoLCBcInV0ZjhcIikpO1xuICBjb25zdCBzaGltID0gYDxzY3JpcHQgc3JjPVwiL2NvZGV4cHAvYnJvd3Nlci11aS9icmlkZ2UuanNcIj48L3NjcmlwdD5gO1xuICBpZiAoaHRtbC5pbmNsdWRlcyhcIjwvaGVhZD5cIikpIHtcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKFwiPC9oZWFkPlwiLCBgJHtzaGltfVxcbiAgPC9oZWFkPmApO1xuICB9IGVsc2Uge1xuICAgIGh0bWwgPSBgJHtzaGltfVxcbiR7aHRtbH1gO1xuICB9XG4gIHJldHVybiBodG1sO1xufVxuXG5mdW5jdGlvbiByZWxheEJyb3dzZXJVaUNzcChodG1sOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gaHRtbC5yZXBsYWNlKFxuICAgIC8oPG1ldGFcXHMraHR0cC1lcXVpdj1bXCInXUNvbnRlbnQtU2VjdXJpdHktUG9saWN5W1wiJ11cXHMrY29udGVudD1cIikoW15cIl0qKShcIikvLFxuICAgIChfbWF0Y2gsIHByZWZpeDogc3RyaW5nLCBjb250ZW50OiBzdHJpbmcsIHN1ZmZpeDogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVzID0gcGFyc2VDc3BEaXJlY3RpdmVzKGRlY29kZUh0bWxBdHRyaWJ1dGUoY29udGVudCkpO1xuICAgICAgZGlyZWN0aXZlcy5zZXQoXCJjaGlsZC1zcmNcIiwgXCInc2VsZicgYmxvYjogZGF0YTogaHR0cDogaHR0cHM6XCIpO1xuICAgICAgZGlyZWN0aXZlcy5zZXQoXCJmcmFtZS1zcmNcIiwgXCInc2VsZicgYmxvYjogZGF0YTogaHR0cDogaHR0cHM6XCIpO1xuICAgICAgZGlyZWN0aXZlcy5zZXQoXCJjb25uZWN0LXNyY1wiLCBcIidzZWxmJyBodHRwOiBodHRwczogd3M6IHdzczogc2VudHJ5LWlwYzpcIik7XG4gICAgICByZXR1cm4gYCR7cHJlZml4fSR7ZW5jb2RlSHRtbEF0dHJpYnV0ZShmb3JtYXRDc3BEaXJlY3RpdmVzKGRpcmVjdGl2ZXMpKX0ke3N1ZmZpeH1gO1xuICAgIH0sXG4gICk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ3NwRGlyZWN0aXZlcyhjb250ZW50OiBzdHJpbmcpOiBNYXA8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3QgZGlyZWN0aXZlcyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgcGFydCBvZiBjb250ZW50LnNwbGl0KFwiO1wiKSkge1xuICAgIGNvbnN0IHRyaW1tZWQgPSBwYXJ0LnRyaW0oKTtcbiAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgIGNvbnN0IFtuYW1lLCAuLi5yZXN0XSA9IHRyaW1tZWQuc3BsaXQoL1xccysvKTtcbiAgICBpZiAoIW5hbWUpIGNvbnRpbnVlO1xuICAgIGRpcmVjdGl2ZXMuc2V0KG5hbWUsIHJlc3Quam9pbihcIiBcIikpO1xuICB9XG4gIHJldHVybiBkaXJlY3RpdmVzO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRDc3BEaXJlY3RpdmVzKGRpcmVjdGl2ZXM6IE1hcDxzdHJpbmcsIHN0cmluZz4pOiBzdHJpbmcge1xuICByZXR1cm4gWy4uLmRpcmVjdGl2ZXMuZW50cmllcygpXVxuICAgIC5tYXAoKFtuYW1lLCB2YWx1ZV0pID0+ICh2YWx1ZSA/IGAke25hbWV9ICR7dmFsdWV9YCA6IG5hbWUpKVxuICAgIC5qb2luKFwiOyBcIik7XG59XG5cbmZ1bmN0aW9uIGRlY29kZUh0bWxBdHRyaWJ1dGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC5yZXBsYWNlKC8mcXVvdDsvZywgJ1wiJylcbiAgICAucmVwbGFjZSgvJiMzOTsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZsdDsvZywgXCI8XCIpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcbn1cblxuZnVuY3Rpb24gZW5jb2RlSHRtbEF0dHJpYnV0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyYvZywgXCImYW1wO1wiKVxuICAgIC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY29sbGVjdEluaXRpYWxTdGF0ZShvcHRpb25zOiBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zKTogUHJvbWlzZTxJbml0aWFsU3RhdGU+IHtcbiAgYXdhaXQgZW5zdXJlQnJvd3NlclVpSG9zdCgpO1xuICBjb25zdCBbc25hcHNob3QsIHN5c3RlbVRoZW1lVmFyaWFudCwgc2VudHJ5SW5pdE9wdGlvbnMsIGJ1aWxkRmxhdm9yLCB1c2VzT3dsQXBwU2hlbGxdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgIGNhbGxIaWRkZW5CcmlkZ2UoXCJzbmFwc2hvdFwiLCBbXSksXG4gICAgY2FsbEhpZGRlbkJyaWRnZShcInN5c3RlbVRoZW1lXCIsIFtdKSxcbiAgICBjYWxsSGlkZGVuQnJpZGdlKFwic2VudHJ5T3B0aW9uc1wiLCBbXSksXG4gICAgY2FsbEhpZGRlbkJyaWRnZShcImJ1aWxkRmxhdm9yXCIsIFtdKSxcbiAgICBjYWxsSGlkZGVuQnJpZGdlKFwidXNlc093bEFwcFNoZWxsXCIsIFtdKSxcbiAgXSk7XG4gIGlmIChvcHRpb25zLmhpZGVNYWluV2luZG93KSBoaWRlVmlzaWJsZUNvZGV4V2luZG93cygpO1xuICByZXR1cm4ge1xuICAgIHNuYXBzaG90OiBhc1BsYWluT2JqZWN0KHNuYXBzaG90KSxcbiAgICBzeXN0ZW1UaGVtZVZhcmlhbnQ6IHR5cGVvZiBzeXN0ZW1UaGVtZVZhcmlhbnQgPT09IFwic3RyaW5nXCIgPyBzeXN0ZW1UaGVtZVZhcmlhbnQgOiBjdXJyZW50U3lzdGVtVGhlbWVWYXJpYW50KCksXG4gICAgc2VudHJ5SW5pdE9wdGlvbnMsXG4gICAgYnVpbGRGbGF2b3IsXG4gICAgdXNlc093bEFwcFNoZWxsOiB1c2VzT3dsQXBwU2hlbGwgPT09IHRydWUsXG4gICAgcGxhdGZvcm06IHByb2Nlc3MucGxhdGZvcm0sXG4gICAgYXJjaDogcHJvY2Vzcy5hcmNoLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVCcm93c2VyVWlIb3N0KCk6IFByb21pc2U8QnJvd3NlclVpSG9zdD4ge1xuICBpZiAoYWN0aXZlSG9zdCAmJiAhYWN0aXZlSG9zdC53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpKSByZXR1cm4gYWN0aXZlSG9zdDtcbiAgY29uc3Qgb3B0aW9ucyA9IHJlcXVpcmVPcHRpb25zKCk7XG4gIGNvbnN0IHNlcnZpY2VzID0gYXdhaXQgd2FpdEZvcldpbmRvd1NlcnZpY2VzKG9wdGlvbnMpO1xuICBjb25zdCB3aW5kb3dNYW5hZ2VyID0gc2VydmljZXMud2luZG93TWFuYWdlcjtcbiAgaWYgKCF3aW5kb3dNYW5hZ2VyPy5yZWdpc3RlcldpbmRvdykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHdpbmRvdyByZWdpc3RyYXRpb24gc2VydmljZXMgYXJlIHVuYXZhaWxhYmxlXCIpO1xuICB9XG5cbiAgY29uc3QgdmlldyA9IG5ldyBCcm93c2VyVmlldyh7XG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIHByZWxvYWQ6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8ucHJlbG9hZFBhdGgsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSxcbiAgICAgIHNwZWxsY2hlY2s6IGZhbHNlLFxuICAgICAgZGV2VG9vbHM6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8uYWxsb3dEZXZ0b29scyxcbiAgICB9LFxuICB9KTtcbiAgY29uc3Qgd2luZG93TGlrZSA9IG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3KTtcbiAgd2luZG93TWFuYWdlci5yZWdpc3RlcldpbmRvdyh3aW5kb3dMaWtlLCBcImxvY2FsXCIsIGZhbHNlLCBcInNlY29uZGFyeVwiKTtcbiAgY29uc3QgY29udGV4dCA9IHNlcnZpY2VzLmdldENvbnRleHRGb3JXZWJDb250ZW50cz8uKHZpZXcud2ViQ29udGVudHMpID8/IHNlcnZpY2VzLmdldENvbnRleHQ/LihcImxvY2FsXCIpO1xuICBjb250ZXh0Py5yZWdpc3RlcldpbmRvdz8uKHdpbmRvd0xpa2UpO1xuICBhd2FpdCB2aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwoXCJhYm91dDpibGFua1wiKTtcbiAgYWN0aXZlSG9zdCA9IHsgdmlldywgd2ViQ29udGVudHM6IHZpZXcud2ViQ29udGVudHMgfTtcbiAgdmlldy53ZWJDb250ZW50cy5vbmNlKFwiZGVzdHJveWVkXCIsICgpID0+IHtcbiAgICBpZiAoYWN0aXZlSG9zdD8ud2ViQ29udGVudHMgPT09IHZpZXcud2ViQ29udGVudHMpIGFjdGl2ZUhvc3QgPSBudWxsO1xuICB9KTtcbiAgb3B0aW9ucy5sb2coXCJpbmZvXCIsIFwiYnJvd3NlciBVSSBoaWRkZW4gaG9zdCByZWFkeVwiLCB7IHdlYkNvbnRlbnRzSWQ6IHZpZXcud2ViQ29udGVudHMuaWQgfSk7XG4gIHJldHVybiBhY3RpdmVIb3N0O1xufVxuXG5hc3luYyBmdW5jdGlvbiB3YWl0Rm9yV2luZG93U2VydmljZXMob3B0aW9uczogQnJvd3NlclVpU2VydmVyT3B0aW9ucyk6IFByb21pc2U8Q29kZXhXaW5kb3dTZXJ2aWNlcz4ge1xuICBjb25zdCBzdGFydGVkID0gRGF0ZS5ub3coKTtcbiAgd2hpbGUgKERhdGUubm93KCkgLSBzdGFydGVkIDwgMzBfMDAwKSB7XG4gICAgY29uc3Qgc2VydmljZXMgPSBvcHRpb25zLmdldFdpbmRvd1NlcnZpY2VzKCk7XG4gICAgaWYgKFxuICAgICAgc2VydmljZXM/LndpbmRvd01hbmFnZXI/LnJlZ2lzdGVyV2luZG93ICYmXG4gICAgICAoc2VydmljZXMuZ2V0Q29udGV4dCB8fCBzZXJ2aWNlcy5nZXRDb250ZXh0Rm9yV2ViQ29udGVudHMpXG4gICAgKSB7XG4gICAgICByZXR1cm4gc2VydmljZXM7XG4gICAgfVxuICAgIGF3YWl0IGRlbGF5KDEwMCk7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKFwiVGltZWQgb3V0IHdhaXRpbmcgZm9yIENvZGV4IHdpbmRvdyBzZXJ2aWNlc1wiKTtcbn1cblxuZnVuY3Rpb24gY2FsbEhpZGRlbkJyaWRnZShtZXRob2Q6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGFzc2VydEJyaWRnZU1ldGhvZChtZXRob2QpO1xuICByZXR1cm4gZW5zdXJlQnJvd3NlclVpSG9zdCgpLnRoZW4oKGhvc3QpID0+IHtcbiAgICBjb25zdCBpZCA9IHJhbmRvbVVVSUQoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgYnJpZGdlUmVxdWVzdHMuZGVsZXRlKGlkKTtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgVGltZWQgb3V0IHdhaXRpbmcgZm9yIGJyb3dzZXIgVUkgYnJpZGdlIG1ldGhvZDogJHttZXRob2R9YCkpO1xuICAgICAgfSwgMTVfMDAwKTtcbiAgICAgIGJyaWRnZVJlcXVlc3RzLnNldChpZCwgeyByZXNvbHZlLCByZWplY3QsIHRpbWVyIH0pO1xuICAgICAgaG9zdC53ZWJDb250ZW50cy5zZW5kKEJSSURHRV9SRVFVRVNUX0NIQU5ORUwsIHsgaWQsIG1ldGhvZCwgYXJncyB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGJyaWRnZU1lc3NhZ2VQb3J0VG9XZWJTb2NrZXQocG9ydDogRWxlY3Ryb24uTWVzc2FnZVBvcnRNYWluLCB3czogV2ViU29ja2V0Q29ubmVjdGlvbik6IHZvaWQge1xuICBsZXQgY2xvc2VkID0gZmFsc2U7XG4gIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgIGlmIChjbG9zZWQpIHJldHVybjtcbiAgICBjbG9zZWQgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICBwb3J0LnBvc3RNZXNzYWdlKG51bGwpO1xuICAgIH0gY2F0Y2gge31cbiAgICB0cnkge1xuICAgICAgcG9ydC5jbG9zZSgpO1xuICAgIH0gY2F0Y2gge31cbiAgICB3cy5jbG9zZSgpO1xuICB9O1xuICBwb3J0LnN0YXJ0KCk7XG4gIHBvcnQub24oXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICAgIGlmIChjbG9zZWQpIHJldHVybjtcbiAgICBpZiAoZXZlbnQuZGF0YSA9PSBudWxsKSB7XG4gICAgICBjbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGV2ZW50LmRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHdzLnNlbmRUZXh0KGV2ZW50LmRhdGEpO1xuICAgIH1cbiAgfSk7XG4gIHBvcnQub24oXCJjbG9zZVwiLCBjbG9zZSk7XG4gIHdzLm9uVGV4dCgodGV4dCkgPT4ge1xuICAgIGlmIChjbG9zZWQpIHJldHVybjtcbiAgICBwb3J0LnBvc3RNZXNzYWdlKHRleHQpO1xuICB9KTtcbiAgd3Mub25DbG9zZShjbG9zZSk7XG59XG5cbmZ1bmN0aW9uIGJyb2FkY2FzdENvbnRyb2wocGF5bG9hZDogdW5rbm93bik6IHZvaWQge1xuICBmb3IgKGNvbnN0IGNsaWVudCBvZiBbLi4uY29udHJvbENsaWVudHNdKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNsaWVudC5zZW5kSnNvbihwYXlsb2FkKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNsaWVudC5jbG9zZSgpO1xuICAgICAgY29udHJvbENsaWVudHMuZGVsZXRlKGNsaWVudCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGJyb3dzZXJCcmlkZ2VTY3JpcHQoc3RhdGU6IEluaXRpYWxTdGF0ZSk6IHN0cmluZyB7XG4gIHJldHVybiBgXG4oKCkgPT4ge1xuICBjb25zdCBpbml0aWFsU3RhdGUgPSAke3NhZmVKc29uKHN0YXRlKX07XG4gIGNvbnN0IHNuYXBzaG90ID0gbmV3IE1hcChPYmplY3QuZW50cmllcyhpbml0aWFsU3RhdGUuc25hcHNob3QgfHwge30pKTtcbiAgY29uc3Qgd29ya2VyU3Vic2NyaWJlcnMgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IHRoZW1lU3Vic2NyaWJlcnMgPSBuZXcgU2V0KCk7XG4gIGNvbnN0IGJyb3dzZXJTaWRlYmFyU25hcHNob3RzID0gbmV3IE1hcCgpO1xuICBjb25zdCBicm93c2VyU2lkZWJhclNlZWRlZExvY2FsU2VydmVycyA9IG5ldyBTZXQoKTtcbiAgbGV0IHN5c3RlbVRoZW1lVmFyaWFudCA9IGluaXRpYWxTdGF0ZS5zeXN0ZW1UaGVtZVZhcmlhbnQgfHwgXCJsaWdodFwiO1xuXG4gIHdpbmRvdy5fX2NvZGV4cHBCcm93c2VyVWkgPSB0cnVlO1xuICBpbnN0YWxsQnJvd3NlclVpV2Vidmlld1NoaW0oKTtcblxuICBjb25zdCBjb250cm9sID0gbmV3IFdlYlNvY2tldChuZXcgVVJMKFwiL2NvZGV4cHAvYnJvd3Nlci11aS9jb250cm9sXCIsIGxvY2F0aW9uLmhyZWYpKTtcbiAgY29udHJvbC5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCAoZXZlbnQpID0+IHtcbiAgICBsZXQgcGF5bG9hZDtcbiAgICB0cnkgeyBwYXlsb2FkID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTsgfSBjYXRjaCB7IHJldHVybjsgfVxuICAgIGlmIChwYXlsb2FkLnR5cGUgPT09IFwibWVzc2FnZS1mb3Itdmlld1wiKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gcGF5bG9hZC5tZXNzYWdlO1xuICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcInNoYXJlZC1vYmplY3QtdXBkYXRlZFwiKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLnZhbHVlID09PSB1bmRlZmluZWQpIHNuYXBzaG90LmRlbGV0ZShtZXNzYWdlLmtleSk7XG4gICAgICAgIGVsc2Ugc25hcHNob3Quc2V0KG1lc3NhZ2Uua2V5LCBtZXNzYWdlLnZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJlbWVtYmVyQnJvd3NlclNpZGViYXJIb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBNZXNzYWdlRXZlbnQoXCJtZXNzYWdlXCIsIHsgZGF0YTogbWVzc2FnZSB9KSk7XG4gICAgfSBlbHNlIGlmIChwYXlsb2FkLnR5cGUgPT09IFwid29ya2VyLW1lc3NhZ2VcIikge1xuICAgICAgY29uc3Qgc3VicyA9IHdvcmtlclN1YnNjcmliZXJzLmdldChwYXlsb2FkLndvcmtlcklkKTtcbiAgICAgIGlmIChzdWJzKSBmb3IgKGNvbnN0IGZuIG9mIFsuLi5zdWJzXSkgZm4ocGF5bG9hZC5tZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKHBheWxvYWQudHlwZSA9PT0gXCJzeXN0ZW0tdGhlbWUtdmFyaWFudC11cGRhdGVkXCIpIHtcbiAgICAgIHN5c3RlbVRoZW1lVmFyaWFudCA9IHBheWxvYWQudmFsdWU7XG4gICAgICBmb3IgKGNvbnN0IGZuIG9mIFsuLi50aGVtZVN1YnNjcmliZXJzXSkgZm4oKTtcbiAgICB9XG4gIH0pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGJyaWRnZShtZXRob2QsIGFyZ3MgPSBbXSkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiL2NvZGV4cHAvYnJvd3Nlci11aS9icmlkZ2VcIiwge1xuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgIGhlYWRlcnM6IHsgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWV0aG9kLCBhcmdzIH0pLFxuICAgIH0pO1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZXMuanNvbigpO1xuICAgIGlmICghYm9keS5vaykgdGhyb3cgbmV3IEVycm9yKGJvZHkuZXJyb3IgfHwgXCJDb2RleCsrIGJyb3dzZXIgYnJpZGdlIGZhaWxlZFwiKTtcbiAgICByZXR1cm4gYm9keS52YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxlZ2FjeUJyb3dzZXJUYWJJZChjb252ZXJzYXRpb25JZCkge1xuICAgIHJldHVybiBTdHJpbmcoY29udmVyc2F0aW9uSWQgfHwgXCJuZXctY29udmVyc2F0aW9uXCIpICsgXCI6bGVnYWN5XCI7XG4gIH1cblxuICBmdW5jdGlvbiBicm93c2VyU2lkZWJhcktleShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKSB7XG4gICAgcmV0dXJuIFN0cmluZyhjb252ZXJzYXRpb25JZCB8fCBcIm5ldy1jb252ZXJzYXRpb25cIikgKyBcIjo6XCIgKyBTdHJpbmcoYnJvd3NlclRhYklkIHx8IGxlZ2FjeUJyb3dzZXJUYWJJZChjb252ZXJzYXRpb25JZCkpO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplQnJvd3NlclVybCh2YWx1ZSkge1xuICAgIGNvbnN0IHJhdyA9IFN0cmluZyh2YWx1ZSB8fCBcIlwiKS50cmltKCk7XG4gICAgaWYgKCFyYXcpIHJldHVybiBcIlwiO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IFVSTChyYXcpLmhyZWY7XG4gICAgfSBjYXRjaCB7fVxuICAgIGlmICgvXlthLXpBLVpdW2EtekEtWjAtOSsuLV0qOi8udGVzdChyYXcpKSByZXR1cm4gcmF3O1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gbmV3IFVSTChcImh0dHBzOi8vXCIgKyByYXcpLmhyZWY7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gcmF3O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGJyb3dzZXJUaXRsZUZvclVybCh1cmwpIHtcbiAgICBpZiAoIXVybCkgcmV0dXJuIFwiTmV3IHRhYlwiO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBob3N0ID0gbmV3IFVSTCh1cmwpLmhvc3RuYW1lLnJlcGxhY2UoL153d3dcXFxcLi8sIFwiXCIpO1xuICAgICAgcmV0dXJuIGhvc3QgfHwgdXJsO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlQnJvd3NlclNpZGViYXJTbmFwc2hvdCh1cmwsIHBhdGNoID0ge30pIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQnJvd3NlclVybCh1cmwpO1xuICAgIHJldHVybiB7XG4gICAgICB0YWJUeXBlOiBub3JtYWxpemVkID8gXCJ3ZWJcIiA6IFwibmV3LXRhYi1wYWdlXCIsXG4gICAgICBpc1N1c3BlbmRlZDogZmFsc2UsXG4gICAgICB0aXRsZTogbm9ybWFsaXplZCA/IGJyb3dzZXJUaXRsZUZvclVybChub3JtYWxpemVkKSA6IFwiTmV3IHRhYlwiLFxuICAgICAgdXJsOiBub3JtYWxpemVkLFxuICAgICAgZmF2aWNvblVybDogbnVsbCxcbiAgICAgIGlzTG9hZGluZzogZmFsc2UsXG4gICAgICBjYW5Hb0JhY2s6IGZhbHNlLFxuICAgICAgY2FuR29Gb3J3YXJkOiBmYWxzZSxcbiAgICAgIHpvb21QZXJjZW50OiAxMDAsXG4gICAgICBjb21tZW50TW9kZURpc2FibGVkUmVhc29uOiBudWxsLFxuICAgICAgaW50ZXJhY3Rpb25Nb2RlOiBcImJyb3dzZVwiLFxuICAgICAgYW5ub3RhdGlvbkVkaXRvck1vZGU6IFwiY29tbWVudFwiLFxuICAgICAgaXNBbm5vdGF0aW9uQWRkTW9kaWZpZXJQcmVzc2VkOiBmYWxzZSxcbiAgICAgIGlzT3JpZ2luYWxWaWV3RW5hYmxlZDogZmFsc2UsXG4gICAgICBpc1R3ZWFrc0VkaXRvck9wZW46IGZhbHNlLFxuICAgICAgY29tbWVudHM6IFtdLFxuICAgICAgLi4ucGF0Y2gsXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRpc3BhdGNoQnJvd3NlclNpZGViYXJNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgTWVzc2FnZUV2ZW50KFwibWVzc2FnZVwiLCB7IGRhdGE6IG1lc3NhZ2UgfSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VlZEJyb3dzZXJTaWRlYmFyTG9jYWxTZXJ2ZXJzKGNvbnZlcnNhdGlvbklkKSB7XG4gICAgaWYgKCFjb252ZXJzYXRpb25JZCB8fCBicm93c2VyU2lkZWJhclNlZWRlZExvY2FsU2VydmVycy5oYXMoY29udmVyc2F0aW9uSWQpKSByZXR1cm47XG4gICAgYnJvd3NlclNpZGViYXJTZWVkZWRMb2NhbFNlcnZlcnMuYWRkKGNvbnZlcnNhdGlvbklkKTtcbiAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICBkaXNwYXRjaEJyb3dzZXJTaWRlYmFyTWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFwiYnJvd3Nlci1zaWRlYmFyLWxvY2FsLXNlcnZlcnNcIixcbiAgICAgICAgY29udmVyc2F0aW9uSWQsXG4gICAgICAgIHN0YXRlOiB7IGlzTG9hZGluZzogZmFsc2UsIHNlcnZlcnM6IFtdLCBoaWRkZW5TZXJ2ZXJzOiBbXSB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1lbWJlckJyb3dzZXJTaWRlYmFySG9zdE1lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmICghbWVzc2FnZSB8fCB0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiYnJvd3Nlci1zaWRlYmFyLXN0YXRlXCIpIHtcbiAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbklkID0gbWVzc2FnZS5jb252ZXJzYXRpb25JZDtcbiAgICAgIGlmICghY29udmVyc2F0aW9uSWQgfHwgIW1lc3NhZ2Uuc25hcHNob3QpIHJldHVybjtcbiAgICAgIGJyb3dzZXJTaWRlYmFyU25hcHNob3RzLnNldChicm93c2VyU2lkZWJhcktleShjb252ZXJzYXRpb25JZCwgbWVzc2FnZS5icm93c2VyVGFiSWQpLCBtZXNzYWdlLnNuYXBzaG90KTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJicm93c2VyLXNpZGViYXItbG9jYWwtc2VydmVyc1wiKSB7XG4gICAgICBpZiAobWVzc2FnZS5jb252ZXJzYXRpb25JZCkgYnJvd3NlclNpZGViYXJTZWVkZWRMb2NhbFNlcnZlcnMuYWRkKG1lc3NhZ2UuY29udmVyc2F0aW9uSWQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIHNuYXBzaG90UGF0Y2gpIHtcbiAgICBpZiAoIWNvbnZlcnNhdGlvbklkKSByZXR1cm47XG4gICAgY29uc3Qga2V5ID0gYnJvd3NlclNpZGViYXJLZXkoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCk7XG4gICAgY29uc3QgcHJldmlvdXMgPSBicm93c2VyU2lkZWJhclNuYXBzaG90cy5nZXQoa2V5KSB8fCBtYWtlQnJvd3NlclNpZGViYXJTbmFwc2hvdChcIlwiKTtcbiAgICBjb25zdCBuZXh0ID0geyAuLi5wcmV2aW91cywgLi4uc25hcHNob3RQYXRjaCB9O1xuICAgIGJyb3dzZXJTaWRlYmFyU25hcHNob3RzLnNldChrZXksIG5leHQpO1xuICAgIGRpc3BhdGNoQnJvd3NlclNpZGViYXJNZXNzYWdlKHtcbiAgICAgIHR5cGU6IFwiYnJvd3Nlci1zaWRlYmFyLXN0YXRlXCIsXG4gICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgIC4uLihicm93c2VyVGFiSWQgPyB7IGJyb3dzZXJUYWJJZCB9IDoge30pLFxuICAgICAgc25hcHNob3Q6IG5leHQsXG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRCcm93c2VyU2lkZWJhclVybChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCB1cmwsIGlzTG9hZGluZyA9IGZhbHNlKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUJyb3dzZXJVcmwodXJsKTtcbiAgICBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBtYWtlQnJvd3NlclNpZGViYXJTbmFwc2hvdChub3JtYWxpemVkLCB7IGlzTG9hZGluZyB9KSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kQnJvd3NlclNpZGViYXJGcmFtZShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKSB7XG4gICAgY29uc3Qgc2VsZWN0b3IgPSBcIltkYXRhLWJyb3dzZXItc2lkZWJhci1jb252ZXJzYXRpb24taWQ9J1wiICsgY3NzRXNjYXBlKGNvbnZlcnNhdGlvbklkKSArIFwiJ11bZGF0YS1icm93c2VyLXNpZGViYXItYnJvd3Nlci10YWItaWQ9J1wiICsgY3NzRXNjYXBlKGJyb3dzZXJUYWJJZCB8fCBsZWdhY3lCcm93c2VyVGFiSWQoY29udmVyc2F0aW9uSWQpKSArIFwiJ11cIjtcbiAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3Rvcik7XG4gIH1cblxuICBmdW5jdGlvbiBjc3NFc2NhcGUodmFsdWUpIHtcbiAgICBpZiAod2luZG93LkNTUyAmJiB0eXBlb2Ygd2luZG93LkNTUy5lc2NhcGUgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHdpbmRvdy5DU1MuZXNjYXBlKFN0cmluZyh2YWx1ZSkpO1xuICAgIHJldHVybiBTdHJpbmcodmFsdWUpLnJlcGxhY2UoL1snXFxcXFxcXFxdL2csIFwiXFxcXFxcXFwkJlwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZUJyb3dzZXJTaWRlYmFyVmlld01lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmICghbWVzc2FnZSB8fCB0eXBlb2YgbWVzc2FnZSAhPT0gXCJvYmplY3RcIikgcmV0dXJuO1xuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiYnJvd3Nlci1zaWRlYmFyLXN5bmNcIikge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IG1lc3NhZ2UucGF5bG9hZCB8fCB7fTtcbiAgICAgIHNlZWRCcm93c2VyU2lkZWJhckxvY2FsU2VydmVycyhwYXlsb2FkLmNvbnZlcnNhdGlvbklkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJicm93c2VyLXNpZGViYXItb3duZXItc3luY1wiKSB7XG4gICAgICBzZWVkQnJvd3NlclNpZGViYXJMb2NhbFNlcnZlcnMobWVzc2FnZS5jb252ZXJzYXRpb25JZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgIT09IFwiYnJvd3Nlci1zaWRlYmFyLWNvbW1hbmRcIikgcmV0dXJuO1xuXG4gICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBtZXNzYWdlLmNvbnZlcnNhdGlvbklkO1xuICAgIGNvbnN0IGJyb3dzZXJUYWJJZCA9IG1lc3NhZ2UuYnJvd3NlclRhYklkO1xuICAgIGNvbnN0IGNvbW1hbmQgPSBtZXNzYWdlLmNvbW1hbmQgfHwge307XG4gICAgc2VlZEJyb3dzZXJTaWRlYmFyTG9jYWxTZXJ2ZXJzKGNvbnZlcnNhdGlvbklkKTtcblxuICAgIGlmIChjb21tYW5kLnR5cGUgPT09IFwibmF2aWdhdGVcIikge1xuICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUJyb3dzZXJVcmwoY29tbWFuZC51cmwpO1xuICAgICAgc2V0QnJvd3NlclNpZGViYXJVcmwoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgbm9ybWFsaXplZCwgdHJ1ZSk7XG4gICAgICBxdWV1ZU1pY3JvdGFzaygoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZyYW1lID0gZmluZEJyb3dzZXJTaWRlYmFyRnJhbWUoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCk7XG4gICAgICAgIGlmICghZnJhbWUgfHwgIW5vcm1hbGl6ZWQgfHwgZnJhbWUuZ2V0VVJMPy4oKSA9PT0gbm9ybWFsaXplZCkgcmV0dXJuO1xuICAgICAgICBmcmFtZS5sb2FkVVJMPy4obm9ybWFsaXplZCk7XG4gICAgICB9KTtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNldEJyb3dzZXJTaWRlYmFyVXJsKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIG5vcm1hbGl6ZWQsIGZhbHNlKSwgNTAwKTtcbiAgICB9IGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJyZWxvYWRcIikge1xuICAgICAgY29uc3QgZnJhbWUgPSBmaW5kQnJvd3NlclNpZGViYXJGcmFtZShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKTtcbiAgICAgIGZyYW1lPy5yZWxvYWQ/LigpO1xuICAgICAgY29uc3QgY3VycmVudCA9IGJyb3dzZXJTaWRlYmFyU25hcHNob3RzLmdldChicm93c2VyU2lkZWJhcktleShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKSk7XG4gICAgICBpZiAoY3VycmVudD8udXJsKSB7XG4gICAgICAgIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIHsgLi4uY3VycmVudCwgaXNMb2FkaW5nOiB0cnVlIH0pO1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCB7IC4uLmN1cnJlbnQsIGlzTG9hZGluZzogZmFsc2UgfSksIDI1MCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IFwiZ28tYmFja1wiKSB7XG4gICAgICBmaW5kQnJvd3NlclNpZGViYXJGcmFtZShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKT8uZ29CYWNrPy4oKTtcbiAgICB9IGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJnby1mb3J3YXJkXCIpIHtcbiAgICAgIGZpbmRCcm93c2VyU2lkZWJhckZyYW1lKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpPy5nb0ZvcndhcmQ/LigpO1xuICAgIH0gZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBcInN0b3BcIikge1xuICAgICAgY29uc3QgY3VycmVudCA9IGJyb3dzZXJTaWRlYmFyU25hcHNob3RzLmdldChicm93c2VyU2lkZWJhcktleShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKSk7XG4gICAgICBpZiAoY3VycmVudCkgc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgeyAuLi5jdXJyZW50LCBpc0xvYWRpbmc6IGZhbHNlIH0pO1xuICAgIH0gZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBcInJlc2V0XCIgfHwgY29tbWFuZC50eXBlID09PSBcImNsb3NlLXRhYlwiKSB7XG4gICAgICBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBtYWtlQnJvd3NlclNpZGViYXJTbmFwc2hvdChcIlwiKSk7XG4gICAgfVxuICB9XG5cbiAgd2luZG93LmNvZGV4V2luZG93VHlwZSA9IFwiZWxlY3Ryb25cIjtcbiAgd2luZG93LmVsZWN0cm9uQnJpZGdlID0ge1xuICAgIHdpbmRvd1R5cGU6IFwiZWxlY3Ryb25cIixcbiAgICBzZW5kTWVzc2FnZUZyb21WaWV3OiAobWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKG1lc3NhZ2UgJiYgbWVzc2FnZS50eXBlID09PSBcInNoYXJlZC1vYmplY3Qtc2V0XCIpIHNuYXBzaG90LnNldChtZXNzYWdlLmtleSwgbWVzc2FnZS52YWx1ZSk7XG4gICAgICBoYW5kbGVCcm93c2VyU2lkZWJhclZpZXdNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgcmV0dXJuIGJyaWRnZShcInNlbmRNZXNzYWdlRnJvbVZpZXdcIiwgW21lc3NhZ2VdKTtcbiAgICB9LFxuICAgIGdldFBhdGhGb3JGaWxlOiAoKSA9PiBudWxsLFxuICAgIHNlbmRXb3JrZXJNZXNzYWdlRnJvbVZpZXc6ICh3b3JrZXJJZCwgbWVzc2FnZSkgPT4gYnJpZGdlKFwic2VuZFdvcmtlck1lc3NhZ2VGcm9tVmlld1wiLCBbd29ya2VySWQsIG1lc3NhZ2VdKSxcbiAgICBzdWJzY3JpYmVUb1dvcmtlck1lc3NhZ2VzOiAod29ya2VySWQsIGhhbmRsZXIpID0+IHtcbiAgICAgIGxldCBzdWJzID0gd29ya2VyU3Vic2NyaWJlcnMuZ2V0KHdvcmtlcklkKTtcbiAgICAgIGlmICghc3Vicykge1xuICAgICAgICBzdWJzID0gbmV3IFNldCgpO1xuICAgICAgICB3b3JrZXJTdWJzY3JpYmVycy5zZXQod29ya2VySWQsIHN1YnMpO1xuICAgICAgICBicmlkZ2UoXCJzdWJzY3JpYmVXb3JrZXJNZXNzYWdlc1wiLCBbd29ya2VySWRdKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgIH1cbiAgICAgIHN1YnMuYWRkKGhhbmRsZXIpO1xuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHdvcmtlclN1YnNjcmliZXJzLmdldCh3b3JrZXJJZCk7XG4gICAgICAgIGlmICghY3VycmVudCkgcmV0dXJuO1xuICAgICAgICBjdXJyZW50LmRlbGV0ZShoYW5kbGVyKTtcbiAgICAgICAgaWYgKGN1cnJlbnQuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgIHdvcmtlclN1YnNjcmliZXJzLmRlbGV0ZSh3b3JrZXJJZCk7XG4gICAgICAgICAgYnJpZGdlKFwidW5zdWJzY3JpYmVXb3JrZXJNZXNzYWdlc1wiLCBbd29ya2VySWRdKS5jYXRjaChjb25zb2xlLmVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9LFxuICAgIHNob3dDb250ZXh0TWVudTogKGl0ZW1zKSA9PiBicmlkZ2UoXCJzaG93Q29udGV4dE1lbnVcIiwgW2l0ZW1zXSksXG4gICAgc2hvd0FwcGxpY2F0aW9uTWVudTogKG1lbnVJZCwgeCwgeSkgPT4gYnJpZGdlKFwic2hvd0FwcGxpY2F0aW9uTWVudVwiLCBbbWVudUlkLCB4LCB5XSksXG4gICAgZ2V0RmFzdE1vZGVSb2xsb3V0TWV0cmljczogKHBhcmFtcykgPT4gYnJpZGdlKFwiZ2V0RmFzdE1vZGVSb2xsb3V0TWV0cmljc1wiLCBbcGFyYW1zXSksXG4gICAgZ2V0U2hhcmVkT2JqZWN0U25hcHNob3RWYWx1ZTogKGtleSkgPT4gc25hcHNob3QuZ2V0KGtleSksXG4gICAgZ2V0U3lzdGVtVGhlbWVWYXJpYW50OiAoKSA9PiBzeXN0ZW1UaGVtZVZhcmlhbnQsXG4gICAgc3Vic2NyaWJlVG9TeXN0ZW1UaGVtZVZhcmlhbnQ6IChoYW5kbGVyKSA9PiB7XG4gICAgICB0aGVtZVN1YnNjcmliZXJzLmFkZChoYW5kbGVyKTtcbiAgICAgIHJldHVybiAoKSA9PiB0aGVtZVN1YnNjcmliZXJzLmRlbGV0ZShoYW5kbGVyKTtcbiAgICB9LFxuICAgIHRyaWdnZXJTZW50cnlUZXN0RXJyb3I6ICgpID0+IGJyaWRnZShcInRyaWdnZXJTZW50cnlUZXN0RXJyb3JcIiwgW10pLFxuICAgIGdldFNlbnRyeUluaXRPcHRpb25zOiAoKSA9PiBudWxsLFxuICAgIGdldEFwcFNlc3Npb25JZDogKCkgPT4gbnVsbCxcbiAgICBnZXRCdWlsZEZsYXZvcjogKCkgPT4gaW5pdGlhbFN0YXRlLmJ1aWxkRmxhdm9yLFxuICAgIGlzSW50ZWxNYWNCdWlsZDogKCkgPT4gaW5pdGlhbFN0YXRlLnBsYXRmb3JtID09PSBcImRhcndpblwiICYmIGluaXRpYWxTdGF0ZS5hcmNoID09PSBcIng2NFwiLFxuICAgIHVzZXNPd2xBcHBTaGVsbDogKCkgPT4gaW5pdGlhbFN0YXRlLnVzZXNPd2xBcHBTaGVsbCxcbiAgfTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LnNvdXJjZSAhPT0gd2luZG93IHx8ICFldmVudC5kYXRhIHx8IGV2ZW50LmRhdGEudHlwZSAhPT0gXCJjb25uZWN0LWFwcC1ob3N0XCIpIHJldHVybjtcbiAgICBjb25zdCBwb3J0ID0gZXZlbnQuZGF0YS5wb3J0O1xuICAgIGlmICghcG9ydCkgcmV0dXJuO1xuICAgIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldChuZXcgVVJMKFwiL2NvZGV4cHAvYnJvd3Nlci11aS9ycGNcIiwgbG9jYXRpb24uaHJlZikpO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChtZXNzYWdlKSA9PiBwb3J0LnBvc3RNZXNzYWdlKG1lc3NhZ2UuZGF0YSkpO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCAoKSA9PiB7XG4gICAgICB0cnkgeyBwb3J0LnBvc3RNZXNzYWdlKG51bGwpOyB9IGNhdGNoIHt9XG4gICAgICB0cnkgeyBwb3J0LmNsb3NlKCk7IH0gY2F0Y2gge31cbiAgICB9KTtcbiAgICB3cy5hZGRFdmVudExpc3RlbmVyKFwib3BlblwiLCAoKSA9PiB7XG4gICAgICBwb3J0Lm9ubWVzc2FnZSA9IChtZXNzYWdlKSA9PiB7XG4gICAgICAgIGlmIChtZXNzYWdlLmRhdGEgPT0gbnVsbCkge1xuICAgICAgICAgIHdzLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdzLnNlbmQobWVzc2FnZS5kYXRhKTtcbiAgICAgIH07XG4gICAgICBwb3J0LnN0YXJ0ICYmIHBvcnQuc3RhcnQoKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gaW5zdGFsbEJyb3dzZXJVaVdlYnZpZXdTaGltKCkge1xuICAgIGlmICh3aW5kb3cuX19jb2RleHBwV2Vidmlld1NoaW1JbnN0YWxsZWQpIHJldHVybjtcbiAgICB3aW5kb3cuX19jb2RleHBwV2Vidmlld1NoaW1JbnN0YWxsZWQgPSB0cnVlO1xuICAgIGNvbnN0IG9yaWdpbmFsQ3JlYXRlRWxlbWVudCA9IERvY3VtZW50LnByb3RvdHlwZS5jcmVhdGVFbGVtZW50O1xuICAgIERvY3VtZW50LnByb3RvdHlwZS5jcmVhdGVFbGVtZW50ID0gZnVuY3Rpb24odGFnTmFtZSwgb3B0aW9ucykge1xuICAgICAgaWYgKFN0cmluZyh0YWdOYW1lKS50b0xvd2VyQ2FzZSgpICE9PSBcIndlYnZpZXdcIikge1xuICAgICAgICByZXR1cm4gb3JpZ2luYWxDcmVhdGVFbGVtZW50LmNhbGwodGhpcywgdGFnTmFtZSwgb3B0aW9ucyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gY3JlYXRlV2Vidmlld0lmcmFtZSh0aGlzKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlV2Vidmlld0lmcmFtZShkb2MpIHtcbiAgICAgIGNvbnN0IGlmcmFtZSA9IG9yaWdpbmFsQ3JlYXRlRWxlbWVudC5jYWxsKGRvYywgXCJpZnJhbWVcIik7XG4gICAgICBpZnJhbWUuZGF0YXNldC5jb2RleHBwV2Vidmlld1NoaW0gPSBcInRydWVcIjtcbiAgICAgIGlmcmFtZS5zdHlsZS5ib3JkZXIgPSBcIjBcIjtcbiAgICAgIGlmcmFtZS5zdHlsZS5kaXNwbGF5ID0gXCJibG9ja1wiO1xuICAgICAgaWZyYW1lLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwiI2ZmZlwiO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZShcImFsbG93XCIsIFwiYXV0b3BsYXk7IGNsaXBib2FyZC1yZWFkOyBjbGlwYm9hcmQtd3JpdGU7IGRpc3BsYXktY2FwdHVyZTsgZnVsbHNjcmVlbjsgbWljcm9waG9uZTsgY2FtZXJhXCIpO1xuICAgICAgY29uc3QgbmF0aXZlU2V0QXR0cmlidXRlID0gaWZyYW1lLnNldEF0dHJpYnV0ZS5iaW5kKGlmcmFtZSk7XG4gICAgICBjb25zdCBuYXRpdmVHZXRBdHRyaWJ1dGUgPSBpZnJhbWUuZ2V0QXR0cmlidXRlLmJpbmQoaWZyYW1lKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGlmcmFtZSwgXCJ0YWdOYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCBnZXQ6ICgpID0+IFwiV0VCVklFV1wiIH0pO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaWZyYW1lLCBcIm5vZGVOYW1lXCIsIHsgY29uZmlndXJhYmxlOiB0cnVlLCBnZXQ6ICgpID0+IFwiV0VCVklFV1wiIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBjb25zdCBlbWl0ID0gKHR5cGUsIGV4dHJhID0ge30pID0+IHtcbiAgICAgICAgY29uc3QgZXZlbnQgPSBuZXcgRXZlbnQodHlwZSk7XG4gICAgICAgIE9iamVjdC5hc3NpZ24oZXZlbnQsIGV4dHJhKTtcbiAgICAgICAgaWZyYW1lLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSAoKSA9PiBpZnJhbWUuZGF0YXNldC5jb2RleHBwUmVxdWVzdGVkU3JjIHx8IG5hdGl2ZUdldEF0dHJpYnV0ZShcInNyY1wiKSB8fCBcImFib3V0OmJsYW5rXCI7XG4gICAgICBjb25zdCBhY3R1YWxGcmFtZVVybCA9ICh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdGVkID0gU3RyaW5nKHVybCB8fCBcImFib3V0OmJsYW5rXCIpO1xuICAgICAgICBpZiAoIXNob3VsZEJyZWFrUmVjdXJzaXZlRnJhbWVMb2FkKHJlcXVlc3RlZCkpIHJldHVybiByZXF1ZXN0ZWQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgbmV4dCA9IG5ldyBVUkwocmVxdWVzdGVkLCBsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgICBuZXh0LnNlYXJjaFBhcmFtcy5zZXQoXCJfX2NvZGV4cHBfZnJhbWVfZGVwdGhcIiwgU3RyaW5nKGZyYW1lQW5jZXN0b3JEZXB0aCgpICsgMSkpO1xuICAgICAgICAgIHJldHVybiBuZXh0LmhyZWY7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHJldHVybiByZXF1ZXN0ZWQ7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBjb25zdCBzZXRGcmFtZVVybCA9ICh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgcmVxdWVzdGVkID0gU3RyaW5nKHVybCB8fCBcImFib3V0OmJsYW5rXCIpO1xuICAgICAgICBpZnJhbWUuZGF0YXNldC5jb2RleHBwUmVxdWVzdGVkU3JjID0gcmVxdWVzdGVkO1xuICAgICAgICBuYXRpdmVTZXRBdHRyaWJ1dGUoXCJzcmNcIiwgYWN0dWFsRnJhbWVVcmwocmVxdWVzdGVkKSk7XG4gICAgICB9O1xuICAgICAgY29uc3QgbmF2aWdhdGUgPSAodXJsKSA9PiB7XG4gICAgICAgIGNvbnN0IG5leHQgPSBTdHJpbmcodXJsIHx8IFwiYWJvdXQ6YmxhbmtcIik7XG4gICAgICAgIGVtaXQoXCJkaWQtc3RhcnQtbG9hZGluZ1wiLCB7IHVybDogbmV4dCB9KTtcbiAgICAgICAgc2V0RnJhbWVVcmwobmV4dCk7XG4gICAgICB9O1xuXG4gICAgICBpZnJhbWUuc2V0QXR0cmlidXRlID0gKG5hbWUsIHZhbHVlKSA9PiB7XG4gICAgICAgIGlmIChTdHJpbmcobmFtZSkudG9Mb3dlckNhc2UoKSA9PT0gXCJzcmNcIikge1xuICAgICAgICAgIHNldEZyYW1lVXJsKHZhbHVlKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbmF0aXZlU2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgIH07XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWUsIFwic3JjXCIsIHtcbiAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgZ2V0OiAoKSA9PiBjdXJyZW50VXJsKCksXG4gICAgICAgICAgc2V0OiAodmFsdWUpID0+IHNldEZyYW1lVXJsKHZhbHVlKSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGlmcmFtZS5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHVybCA9IGN1cnJlbnRVcmwoKTtcbiAgICAgICAgZW1pdChcImRvbS1yZWFkeVwiLCB7IHVybCB9KTtcbiAgICAgICAgZW1pdChcImRpZC1uYXZpZ2F0ZVwiLCB7IHVybCB9KTtcbiAgICAgICAgZW1pdChcImRpZC1zdG9wLWxvYWRpbmdcIiwgeyB1cmwgfSk7XG4gICAgICAgIGVtaXQoXCJkaWQtZmluaXNoLWxvYWRcIiwgeyB1cmwgfSk7XG4gICAgICAgIGxldCB0aXRsZSA9IFwiXCI7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdGl0bGUgPSBpZnJhbWUuY29udGVudERvY3VtZW50Py50aXRsZSB8fCBcIlwiO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIGNvbnN0IGNvbnZlcnNhdGlvbklkID0gaWZyYW1lLmdldEF0dHJpYnV0ZShcImRhdGEtYnJvd3Nlci1zaWRlYmFyLWNvbnZlcnNhdGlvbi1pZFwiKTtcbiAgICAgICAgY29uc3QgYnJvd3NlclRhYklkID0gaWZyYW1lLmdldEF0dHJpYnV0ZShcImRhdGEtYnJvd3Nlci1zaWRlYmFyLWJyb3dzZXItdGFiLWlkXCIpO1xuICAgICAgICBpZiAoY29udmVyc2F0aW9uSWQpIHtcbiAgICAgICAgICBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBtYWtlQnJvd3NlclNpZGViYXJTbmFwc2hvdCh1cmwsIHtcbiAgICAgICAgICAgIHRpdGxlOiB0aXRsZSB8fCBicm93c2VyVGl0bGVGb3JVcmwodXJsKSxcbiAgICAgICAgICAgIGlzTG9hZGluZzogZmFsc2UsXG4gICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aXRsZSkgZW1pdChcInBhZ2UtdGl0bGUtdXBkYXRlZFwiLCB7IHRpdGxlIH0pO1xuICAgICAgfSk7XG4gICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsICgpID0+IHtcbiAgICAgICAgZW1pdChcImRpZC1mYWlsLWxvYWRcIiwgeyBlcnJvckNvZGU6IC0yLCBlcnJvckRlc2NyaXB0aW9uOiBcImlmcmFtZSBsb2FkIGZhaWxlZFwiLCB2YWxpZGF0ZWRVUkw6IGN1cnJlbnRVcmwoKSB9KTtcbiAgICAgICAgZW1pdChcImRpZC1zdG9wLWxvYWRpbmdcIiwgeyB1cmw6IGN1cnJlbnRVcmwoKSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhpZnJhbWUsIHtcbiAgICAgICAgZGVzdHJveTogeyB2YWx1ZTogKCkgPT4gaWZyYW1lLnJlbW92ZSgpIH0sXG4gICAgICAgIGdldFVSTDogeyB2YWx1ZTogKCkgPT4gY3VycmVudFVybCgpIH0sXG4gICAgICAgIGdldFRpdGxlOiB7XG4gICAgICAgICAgdmFsdWU6ICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHJldHVybiBpZnJhbWUuY29udGVudERvY3VtZW50Py50aXRsZSB8fCBcIlwiO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGxvYWRVUkw6IHsgdmFsdWU6ICh1cmwpID0+IHsgbmF2aWdhdGUodXJsKTsgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpOyB9IH0sXG4gICAgICAgIHJlbG9hZDoge1xuICAgICAgICAgIHZhbHVlOiAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdz8ubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgbmF2aWdhdGUoY3VycmVudFVybCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBzdG9wOiB7IHZhbHVlOiAoKSA9PiB7fSB9LFxuICAgICAgICBjYW5Hb0JhY2s6IHsgdmFsdWU6ICgpID0+IGZhbHNlIH0sXG4gICAgICAgIGNhbkdvRm9yd2FyZDogeyB2YWx1ZTogKCkgPT4gZmFsc2UgfSxcbiAgICAgICAgZ29CYWNrOiB7XG4gICAgICAgICAgdmFsdWU6ICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93Py5oaXN0b3J5LmJhY2soKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBnb0ZvcndhcmQ6IHtcbiAgICAgICAgICB2YWx1ZTogKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3c/Lmhpc3RvcnkuZm9yd2FyZCgpO1xuICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGV4ZWN1dGVKYXZhU2NyaXB0OiB7XG4gICAgICAgICAgdmFsdWU6IChjb2RlKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGlmcmFtZS5jb250ZW50V2luZG93Py5ldmFsKFN0cmluZyhjb2RlKSkpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBpbnNlcnRDU1M6IHsgdmFsdWU6ICgpID0+IFByb21pc2UucmVzb2x2ZShcIlwiKSB9LFxuICAgICAgICBvcGVuRGV2VG9vbHM6IHsgdmFsdWU6ICgpID0+IHt9IH0sXG4gICAgICAgIGNsb3NlRGV2VG9vbHM6IHsgdmFsdWU6ICgpID0+IHt9IH0sXG4gICAgICAgIGlzRGV2VG9vbHNPcGVuZWQ6IHsgdmFsdWU6ICgpID0+IGZhbHNlIH0sXG4gICAgICAgIHNlbmQ6IHsgdmFsdWU6ICgpID0+IHt9IH0sXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGlmcmFtZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmcmFtZUFuY2VzdG9yRGVwdGgoKSB7XG4gICAgICBsZXQgZGVwdGggPSAwO1xuICAgICAgbGV0IGN1cnJlbnQgPSB3aW5kb3c7XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgICAgd2hpbGUgKGN1cnJlbnQgJiYgIXNlZW4uaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgIHNlZW4uYWRkKGN1cnJlbnQpO1xuICAgICAgICBsZXQgcGFyZW50O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHBhcmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAocGFyZW50ID09PSBjdXJyZW50KSBicmVhaztcbiAgICAgICAgZGVwdGggKz0gMTtcbiAgICAgICAgY3VycmVudCA9IHBhcmVudDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkZXB0aDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG91bGRCcmVha1JlY3Vyc2l2ZUZyYW1lTG9hZCh1cmwpIHtcbiAgICAgIGxldCB0YXJnZXQ7XG4gICAgICB0cnkge1xuICAgICAgICB0YXJnZXQgPSBuZXcgVVJMKHVybCwgbG9jYXRpb24uaHJlZikuaHJlZjtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZXQgY3VycmVudCA9IHdpbmRvdztcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgICB3aGlsZSAoY3VycmVudCAmJiAhc2Vlbi5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgc2Vlbi5hZGQoY3VycmVudCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKG5ldyBVUkwoY3VycmVudC5sb2NhdGlvbi5ocmVmKS5ocmVmID09PSB0YXJnZXQpIHJldHVybiB0cnVlO1xuICAgICAgICAgIGlmIChjdXJyZW50LnBhcmVudCA9PT0gY3VycmVudCkgYnJlYWs7XG4gICAgICAgICAgY3VycmVudCA9IGN1cnJlbnQucGFyZW50O1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn0pKCk7XG5gO1xufVxuXG5mdW5jdGlvbiBoaWRlVmlzaWJsZUNvZGV4V2luZG93cygpOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIpIHtcbiAgICB0cnkge1xuICAgICAgYXBwLmhpZGUoKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgZm9yIChjb25zdCB3aW4gb2YgQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkpIHtcbiAgICBpZiAod2luLmlzRGVzdHJveWVkKCkpIGNvbnRpbnVlO1xuICAgIGlmIChhY3RpdmVIb3N0ICYmIHdpbi53ZWJDb250ZW50cy5pZCA9PT0gYWN0aXZlSG9zdC53ZWJDb250ZW50cy5pZCkgY29udGludWU7XG4gICAgaWYgKCF3aW4uaXNWaXNpYmxlKCkpIGNvbnRpbnVlO1xuICAgIHRyeSB7XG4gICAgICB3aW4uaGlkZSgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlV2luZG93TGlrZUZvclZpZXcodmlldzogRWxlY3Ryb24uQnJvd3NlclZpZXcpOiBDb2RleFdpbmRvd0xpa2Uge1xuICBjb25zdCB2aWV3Qm91bmRzID0gKCkgPT4gdmlldy5nZXRCb3VuZHMoKTtcbiAgcmV0dXJuIHtcbiAgICBpZDogdmlldy53ZWJDb250ZW50cy5pZCxcbiAgICB3ZWJDb250ZW50czogdmlldy53ZWJDb250ZW50cyxcbiAgICBvbjogKGV2ZW50OiBcImNsb3NlZFwiLCBsaXN0ZW5lcjogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgaWYgKGV2ZW50ID09PSBcImNsb3NlZFwiKSB2aWV3LndlYkNvbnRlbnRzLm9uY2UoXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgZWxzZSB2aWV3LndlYkNvbnRlbnRzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIG9uY2U6IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgdmlldy53ZWJDb250ZW50cy5vbmNlKGV2ZW50IGFzIFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgb2ZmOiAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHZpZXcud2ViQ29udGVudHMub2ZmKGV2ZW50IGFzIFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgcmVtb3ZlTGlzdGVuZXI6IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgdmlldy53ZWJDb250ZW50cy5yZW1vdmVMaXN0ZW5lcihldmVudCBhcyBcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIGlzRGVzdHJveWVkOiAoKSA9PiB2aWV3LndlYkNvbnRlbnRzLmlzRGVzdHJveWVkKCksXG4gICAgaXNGb2N1c2VkOiAoKSA9PiB2aWV3LndlYkNvbnRlbnRzLmlzRm9jdXNlZCgpLFxuICAgIGZvY3VzOiAoKSA9PiB2aWV3LndlYkNvbnRlbnRzLmZvY3VzKCksXG4gICAgc2hvdzogKCkgPT4ge30sXG4gICAgaGlkZTogKCkgPT4ge30sXG4gICAgZ2V0Qm91bmRzOiB2aWV3Qm91bmRzLFxuICAgIGdldENvbnRlbnRCb3VuZHM6IHZpZXdCb3VuZHMsXG4gICAgZ2V0U2l6ZTogKCkgPT4ge1xuICAgICAgY29uc3QgYiA9IHZpZXdCb3VuZHMoKTtcbiAgICAgIHJldHVybiBbYi53aWR0aCwgYi5oZWlnaHRdO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFNpemU6ICgpID0+IHtcbiAgICAgIGNvbnN0IGIgPSB2aWV3Qm91bmRzKCk7XG4gICAgICByZXR1cm4gW2Iud2lkdGgsIGIuaGVpZ2h0XTtcbiAgICB9LFxuICAgIHNldFRpdGxlOiAoKSA9PiB7fSxcbiAgICBnZXRUaXRsZTogKCkgPT4gXCJcIixcbiAgICBzZXRSZXByZXNlbnRlZEZpbGVuYW1lOiAoKSA9PiB7fSxcbiAgICBzZXREb2N1bWVudEVkaXRlZDogKCkgPT4ge30sXG4gICAgc2V0V2luZG93QnV0dG9uVmlzaWJpbGl0eTogKCkgPT4ge30sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGFjY2VwdFdlYlNvY2tldChyZXE6IEluY29taW5nTWVzc2FnZSwgc29ja2V0OiBTb2NrZXQsIGhlYWQ6IEJ1ZmZlcik6IFdlYlNvY2tldENvbm5lY3Rpb24ge1xuICBjb25zdCBrZXkgPSByZXEuaGVhZGVyc1tcInNlYy13ZWJzb2NrZXQta2V5XCJdO1xuICBpZiAodHlwZW9mIGtleSAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IEVycm9yKFwibWlzc2luZyBTZWMtV2ViU29ja2V0LUtleVwiKTtcbiAgY29uc3QgYWNjZXB0ID0gY3JlYXRlSGFzaChcInNoYTFcIilcbiAgICAudXBkYXRlKGAke2tleX0yNThFQUZBNS1FOTE0LTQ3REEtOTVDQS1DNUFCMERDODVCMTFgKVxuICAgIC5kaWdlc3QoXCJiYXNlNjRcIik7XG4gIHNvY2tldC53cml0ZShcbiAgICBbXG4gICAgICBcIkhUVFAvMS4xIDEwMSBTd2l0Y2hpbmcgUHJvdG9jb2xzXCIsXG4gICAgICBcIlVwZ3JhZGU6IHdlYnNvY2tldFwiLFxuICAgICAgXCJDb25uZWN0aW9uOiBVcGdyYWRlXCIsXG4gICAgICBgU2VjLVdlYlNvY2tldC1BY2NlcHQ6ICR7YWNjZXB0fWAsXG4gICAgICBcIlxcclxcblwiLFxuICAgIF0uam9pbihcIlxcclxcblwiKSxcbiAgKTtcbiAgY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0Q29ubmVjdGlvbihzb2NrZXQpO1xuICBpZiAoaGVhZC5sZW5ndGggPiAwKSB3cy5hY2NlcHRIZWFkKGhlYWQpO1xuICByZXR1cm4gd3M7XG59XG5cbmNsYXNzIFdlYlNvY2tldENvbm5lY3Rpb24ge1xuICBwcml2YXRlIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvYygwKTtcbiAgcHJpdmF0ZSB0ZXh0SGFuZGxlcnMgPSBuZXcgU2V0PCh0ZXh0OiBzdHJpbmcpID0+IHZvaWQ+KCk7XG4gIHByaXZhdGUgY2xvc2VIYW5kbGVycyA9IG5ldyBTZXQ8KCkgPT4gdm9pZD4oKTtcbiAgcHJpdmF0ZSBjbG9zZWQgPSBmYWxzZTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHNvY2tldDogU29ja2V0KSB7XG4gICAgc29ja2V0Lm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHRoaXMuYWNjZXB0SGVhZChjaHVuaykpO1xuICAgIHNvY2tldC5vbihcImNsb3NlXCIsICgpID0+IHRoaXMuZW1pdENsb3NlKCkpO1xuICAgIHNvY2tldC5vbihcImVycm9yXCIsICgpID0+IHRoaXMuZW1pdENsb3NlKCkpO1xuICB9XG5cbiAgYWNjZXB0SGVhZChjaHVuazogQnVmZmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY2xvc2VkKSByZXR1cm47XG4gICAgdGhpcy5idWZmZXIgPSBCdWZmZXIuY29uY2F0KFt0aGlzLmJ1ZmZlciwgY2h1bmtdKTtcbiAgICB0aGlzLnJlYWRGcmFtZXMoKTtcbiAgfVxuXG4gIG9uVGV4dChoYW5kbGVyOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy50ZXh0SGFuZGxlcnMuYWRkKGhhbmRsZXIpO1xuICB9XG5cbiAgb25DbG9zZShoYW5kbGVyOiAoKSA9PiB2b2lkKTogdm9pZCB7XG4gICAgdGhpcy5jbG9zZUhhbmRsZXJzLmFkZChoYW5kbGVyKTtcbiAgfVxuXG4gIHNlbmRKc29uKHBheWxvYWQ6IHVua25vd24pOiB2b2lkIHtcbiAgICB0aGlzLnNlbmRUZXh0KEpTT04uc3RyaW5naWZ5KHBheWxvYWQpKTtcbiAgfVxuXG4gIHNlbmRUZXh0KHRleHQ6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuc2VuZEZyYW1lKDB4MSwgQnVmZmVyLmZyb20odGV4dCwgXCJ1dGY4XCIpKTtcbiAgfVxuXG4gIGNsb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmNsb3NlZCkgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLnNlbmRGcmFtZSgweDgsIEJ1ZmZlci5hbGxvYygwKSk7XG4gICAgfSBjYXRjaCB7fVxuICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcbiAgICB0aGlzLnNvY2tldC5lbmQoKTtcbiAgICB0aGlzLmVtaXRDbG9zZSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWFkRnJhbWVzKCk6IHZvaWQge1xuICAgIHdoaWxlICh0aGlzLmJ1ZmZlci5sZW5ndGggPj0gMikge1xuICAgICAgY29uc3QgZmlyc3QgPSB0aGlzLmJ1ZmZlclswXSE7XG4gICAgICBjb25zdCBzZWNvbmQgPSB0aGlzLmJ1ZmZlclsxXSE7XG4gICAgICBjb25zdCBvcGNvZGUgPSBmaXJzdCAmIDB4MGY7XG4gICAgICBjb25zdCBtYXNrZWQgPSAoc2Vjb25kICYgMHg4MCkgIT09IDA7XG4gICAgICBsZXQgbGVuZ3RoID0gc2Vjb25kICYgMHg3ZjtcbiAgICAgIGxldCBvZmZzZXQgPSAyO1xuICAgICAgaWYgKGxlbmd0aCA9PT0gMTI2KSB7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBvZmZzZXQgKyAyKSByZXR1cm47XG4gICAgICAgIGxlbmd0aCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MTZCRShvZmZzZXQpO1xuICAgICAgICBvZmZzZXQgKz0gMjtcbiAgICAgIH0gZWxzZSBpZiAobGVuZ3RoID09PSAxMjcpIHtcbiAgICAgICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IG9mZnNldCArIDgpIHJldHVybjtcbiAgICAgICAgY29uc3QgaGlnaCA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MzJCRShvZmZzZXQpO1xuICAgICAgICBjb25zdCBsb3cgPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyQkUob2Zmc2V0ICsgNCk7XG4gICAgICAgIGlmIChoaWdoICE9PSAwKSB7XG4gICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZW5ndGggPSBsb3c7XG4gICAgICAgIG9mZnNldCArPSA4O1xuICAgICAgfVxuICAgICAgY29uc3QgbWFza09mZnNldCA9IG9mZnNldDtcbiAgICAgIGlmIChtYXNrZWQpIG9mZnNldCArPSA0O1xuICAgICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IG9mZnNldCArIGxlbmd0aCkgcmV0dXJuO1xuXG4gICAgICBjb25zdCBtYXNrID0gbWFza2VkID8gdGhpcy5idWZmZXIuc3ViYXJyYXkobWFza09mZnNldCwgbWFza09mZnNldCArIDQpIDogbnVsbDtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSBCdWZmZXIuZnJvbSh0aGlzLmJ1ZmZlci5zdWJhcnJheShvZmZzZXQsIG9mZnNldCArIGxlbmd0aCkpO1xuICAgICAgdGhpcy5idWZmZXIgPSB0aGlzLmJ1ZmZlci5zdWJhcnJheShvZmZzZXQgKyBsZW5ndGgpO1xuICAgICAgaWYgKG1hc2spIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXlsb2FkLmxlbmd0aDsgaSArPSAxKSBwYXlsb2FkW2ldIF49IG1hc2tbaSAlIDRdITtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wY29kZSA9PT0gMHg4KSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgIH0gZWxzZSBpZiAob3Bjb2RlID09PSAweDkpIHtcbiAgICAgICAgdGhpcy5zZW5kRnJhbWUoMHhBLCBwYXlsb2FkKTtcbiAgICAgIH0gZWxzZSBpZiAob3Bjb2RlID09PSAweDEpIHtcbiAgICAgICAgY29uc3QgdGV4dCA9IHBheWxvYWQudG9TdHJpbmcoXCJ1dGY4XCIpO1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgWy4uLnRoaXMudGV4dEhhbmRsZXJzXSkgaGFuZGxlcih0ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNlbmRGcmFtZShvcGNvZGU6IG51bWJlciwgcGF5bG9hZDogQnVmZmVyKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY2xvc2VkICYmIG9wY29kZSAhPT0gMHg4KSByZXR1cm47XG4gICAgY29uc3QgbGVuZ3RoID0gcGF5bG9hZC5sZW5ndGg7XG4gICAgbGV0IGhlYWRlcjogQnVmZmVyO1xuICAgIGlmIChsZW5ndGggPCAxMjYpIHtcbiAgICAgIGhlYWRlciA9IEJ1ZmZlci5mcm9tKFsweDgwIHwgb3Bjb2RlLCBsZW5ndGhdKTtcbiAgICB9IGVsc2UgaWYgKGxlbmd0aCA8PSAweGZmZmYpIHtcbiAgICAgIGhlYWRlciA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICAgIGhlYWRlclswXSA9IDB4ODAgfCBvcGNvZGU7XG4gICAgICBoZWFkZXJbMV0gPSAxMjY7XG4gICAgICBoZWFkZXIud3JpdGVVSW50MTZCRShsZW5ndGgsIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWFkZXIgPSBCdWZmZXIuYWxsb2MoMTApO1xuICAgICAgaGVhZGVyWzBdID0gMHg4MCB8IG9wY29kZTtcbiAgICAgIGhlYWRlclsxXSA9IDEyNztcbiAgICAgIGhlYWRlci53cml0ZVVJbnQzMkJFKDAsIDIpO1xuICAgICAgaGVhZGVyLndyaXRlVUludDMyQkUobGVuZ3RoLCA2KTtcbiAgICB9XG4gICAgdGhpcy5zb2NrZXQud3JpdGUoQnVmZmVyLmNvbmNhdChbaGVhZGVyLCBwYXlsb2FkXSkpO1xuICB9XG5cbiAgcHJpdmF0ZSBlbWl0Q2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmNsb3NlZCkgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBbLi4udGhpcy5jbG9zZUhhbmRsZXJzXSkgaGFuZGxlcigpO1xuICAgIHRoaXMuY2xvc2VIYW5kbGVycy5jbGVhcigpO1xuICAgIHRoaXMudGV4dEhhbmRsZXJzLmNsZWFyKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVxdWVzdFVybChyZXE6IEluY29taW5nTWVzc2FnZSk6IFVSTCB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBuZXcgVVJMKHJlcS51cmwgPz8gXCIvXCIsIFwiaHR0cDovLzEyNy4wLjAuMVwiKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEpzb25Cb2R5KHJlcTogSW5jb21pbmdNZXNzYWdlKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgY2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgcmVxLm9uKFwiZGF0YVwiLCAoY2h1bms6IEJ1ZmZlcikgPT4ge1xuICAgICAgdG90YWwgKz0gY2h1bmsubGVuZ3RoO1xuICAgICAgaWYgKHRvdGFsID4gMTAyNCAqIDEwMjQpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihcInJlcXVlc3QgYm9keSB0b28gbGFyZ2VcIikpO1xuICAgICAgICByZXEuZGVzdHJveSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjaHVua3MucHVzaChjaHVuayk7XG4gICAgfSk7XG4gICAgcmVxLm9uKFwiZW5kXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IHJhdyA9IEJ1ZmZlci5jb25jYXQoY2h1bmtzKS50b1N0cmluZyhcInV0ZjhcIik7XG4gICAgICBpZiAoIXJhdykge1xuICAgICAgICByZXNvbHZlKG51bGwpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UocmF3KSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kSnNvbihyZXM6IFNlcnZlclJlc3BvbnNlLCBzdGF0dXM6IG51bWJlciwgYm9keTogdW5rbm93bik6IHZvaWQge1xuICBzZW5kQnVmZmVyKHJlcywgc3RhdHVzLCBCdWZmZXIuZnJvbShKU09OLnN0cmluZ2lmeShib2R5KSksIE1JTUVfVFlQRVNbXCIuanNvblwiXSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBzZW5kVGV4dChyZXM6IFNlcnZlclJlc3BvbnNlLCBzdGF0dXM6IG51bWJlciwgYm9keTogc3RyaW5nLCBjb250ZW50VHlwZTogc3RyaW5nKTogdm9pZCB7XG4gIHNlbmRCdWZmZXIocmVzLCBzdGF0dXMsIEJ1ZmZlci5mcm9tKGJvZHkpLCBjb250ZW50VHlwZSwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBzZW5kQnVmZmVyKFxuICByZXM6IFNlcnZlclJlc3BvbnNlLFxuICBzdGF0dXM6IG51bWJlcixcbiAgYm9keTogQnVmZmVyLFxuICBjb250ZW50VHlwZTogc3RyaW5nLFxuICBoZWFkT25seTogYm9vbGVhbixcbik6IHZvaWQge1xuICByZXMud3JpdGVIZWFkKHN0YXR1cywge1xuICAgIFwiY29udGVudC10eXBlXCI6IGNvbnRlbnRUeXBlLFxuICAgIFwiY29udGVudC1sZW5ndGhcIjogYm9keS5sZW5ndGgsXG4gICAgXCJjYWNoZS1jb250cm9sXCI6IFwibm8tc3RvcmVcIixcbiAgfSk7XG4gIGlmIChoZWFkT25seSkgcmVzLmVuZCgpO1xuICBlbHNlIHJlcy5lbmQoYm9keSk7XG59XG5cbmZ1bmN0aW9uIHdlYnZpZXdSb290KCk6IHN0cmluZyB7XG4gIHJldHVybiBqb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCwgXCJhcHAuYXNhclwiLCBcIndlYnZpZXdcIik7XG59XG5cbmZ1bmN0aW9uIHdlYnZpZXdGaWxlKHBhdGhuYW1lOiBzdHJpbmcpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgY2xlYW5QYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lKS5yZXBsYWNlKC9eXFwvKy8sIFwiXCIpO1xuICBpZiAoIWNsZWFuUGF0aCB8fCBjbGVhblBhdGguaW5jbHVkZXMoXCJcXDBcIikpIHJldHVybiBudWxsO1xuICBjb25zdCByb290ID0gd2Vidmlld1Jvb3QoKTtcbiAgY29uc3QgZmlsZSA9IG5vcm1hbGl6ZShqb2luKHJvb3QsIGNsZWFuUGF0aCkpO1xuICBjb25zdCByZWwgPSByZWxhdGl2ZShyb290LCBmaWxlKTtcbiAgaWYgKHJlbC5zdGFydHNXaXRoKFwiLi5cIikgfHwgcmVsID09PSBcIlwiKSByZXR1cm4gbnVsbDtcbiAgaWYgKCFleGlzdHNTeW5jKGZpbGUpIHx8ICFzdGF0U3luYyhmaWxlKS5pc0ZpbGUoKSkgcmV0dXJuIG51bGw7XG4gIHJldHVybiBmaWxlO1xufVxuXG5mdW5jdGlvbiBtaW1lVHlwZShmaWxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBkb3QgPSBmaWxlLmxhc3RJbmRleE9mKFwiLlwiKTtcbiAgY29uc3QgZXh0ID0gZG90ID49IDAgPyBmaWxlLnNsaWNlKGRvdCkudG9Mb3dlckNhc2UoKSA6IFwiXCI7XG4gIHJldHVybiBNSU1FX1RZUEVTW2V4dF0gPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZU9wdGlvbnMoKTogQnJvd3NlclVpU2VydmVyT3B0aW9ucyB7XG4gIGlmICghYWN0aXZlT3B0aW9ucykgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXgrKyBicm93c2VyIFVJIHNlcnZlciBpcyBub3QgY29uZmlndXJlZFwiKTtcbiAgcmV0dXJuIGFjdGl2ZU9wdGlvbnM7XG59XG5cbmZ1bmN0aW9uIGlzQnJvd3NlclVpSG9zdFNlbmRlcihzZW5kZXI6IEVsZWN0cm9uLldlYkNvbnRlbnRzKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWFjdGl2ZUhvc3QgJiYgIWFjdGl2ZUhvc3Qud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSAmJiBzZW5kZXIuaWQgPT09IGFjdGl2ZUhvc3Qud2ViQ29udGVudHMuaWQ7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEJyaWRnZU1ldGhvZChtZXRob2Q6IHN0cmluZyk6IHZvaWQge1xuICBpZiAoIS9eW2EtekEtWjAtOS5fOi1dKyQvLnRlc3QobWV0aG9kKSkgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBicmlkZ2UgbWV0aG9kXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZVBvcnQodmFsdWU6IHN0cmluZyB8IHVuZGVmaW5lZCwgZmFsbGJhY2s6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IHBhcnNlZCA9IE51bWJlcih2YWx1ZSk7XG4gIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKHBhcnNlZCkgJiYgcGFyc2VkID4gMCAmJiBwYXJzZWQgPD0gNjU1MzUgPyBwYXJzZWQgOiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gYXNSZWNvcmQodmFsdWU6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gOiBudWxsO1xufVxuXG5mdW5jdGlvbiBhc1BsYWluT2JqZWN0KHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4ge1xuICBjb25zdCByZWNvcmQgPSBhc1JlY29yZCh2YWx1ZSk7XG4gIHJldHVybiByZWNvcmQgJiYgIUFycmF5LmlzQXJyYXkocmVjb3JkKSA/IHJlY29yZCA6IHt9O1xufVxuXG5mdW5jdGlvbiBjdXJyZW50U3lzdGVtVGhlbWVWYXJpYW50KCk6IHN0cmluZyB7XG4gIHJldHVybiBuYXRpdmVUaGVtZS5zaG91bGRVc2VEYXJrQ29sb3JzID8gXCJkYXJrXCIgOiBcImxpZ2h0XCI7XG59XG5cbmZ1bmN0aW9uIHNhZmVKc29uKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC88L2csIFwiXFxcXHUwMDNjXCIpO1xufVxuXG5mdW5jdGlvbiBkZWxheShtczogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpO1xufVxuIiwgImV4cG9ydCBjb25zdCBWRVJTSU9OX1JFID0gL152PyhcXGQrKVxcLihcXGQrKVxcLihcXGQrKSg/OlstK10uKik/JC87XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVWZXJzaW9uKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUudHJpbSgpLnJlcGxhY2UoL152L2ksIFwiXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY29tcGFyZVZlcnNpb25zKGE6IHN0cmluZywgYjogc3RyaW5nKTogbnVtYmVyIHtcbiAgY29uc3QgYXYgPSBWRVJTSU9OX1JFLmV4ZWMoYSk7XG4gIGNvbnN0IGJ2ID0gVkVSU0lPTl9SRS5leGVjKGIpO1xuICBpZiAoIWF2IHx8ICFidikgcmV0dXJuIDA7XG4gIGZvciAobGV0IGkgPSAxOyBpIDw9IDM7IGkrKykge1xuICAgIGNvbnN0IGRpZmYgPSBOdW1iZXIoYXZbaV0pIC0gTnVtYmVyKGJ2W2ldKTtcbiAgICBpZiAoZGlmZiAhPT0gMCkgcmV0dXJuIGRpZmY7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBUd2Vha1N0b3JlRW50cnksIFR3ZWFrU3RvcmVQbGF0Zm9ybSB9IGZyb20gXCIuL3R3ZWFrLXN0b3JlXCI7XG5pbXBvcnQgeyBjb21wYXJlVmVyc2lvbnMsIG5vcm1hbGl6ZVZlcnNpb24sIFZFUlNJT05fUkUgfSBmcm9tIFwiLi92ZXJzaW9uLXV0aWxzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJpbGl0eSB7XG4gIGN1cnJlbnQ6IE5vZGVKUy5QbGF0Zm9ybTtcbiAgc3VwcG9ydGVkOiBUd2Vha1N0b3JlUGxhdGZvcm1bXSB8IG51bGw7XG4gIGNvbXBhdGlibGU6IGJvb2xlYW47XG4gIHJlYXNvbjogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdG9yZUVudHJ5UnVudGltZUNvbXBhdGliaWxpdHkge1xuICBjdXJyZW50OiBzdHJpbmc7XG4gIHJlcXVpcmVkOiBzdHJpbmcgfCBudWxsO1xuICBjb21wYXRpYmxlOiBib29sZWFuO1xuICByZWFzb246IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmlsaXR5KFxuICBlbnRyeTogVHdlYWtTdG9yZUVudHJ5LFxuICBjdXJyZW50UGxhdGZvcm0gPSBwcm9jZXNzLnBsYXRmb3JtIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybSxcbik6IFN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkge1xuICBjb25zdCBzdXBwb3J0ZWQgPSBlbnRyeS5wbGF0Zm9ybXMgPz8gbnVsbDtcbiAgY29uc3QgY29tcGF0aWJsZSA9ICFzdXBwb3J0ZWQgfHwgc3VwcG9ydGVkLmluY2x1ZGVzKGN1cnJlbnRQbGF0Zm9ybSk7XG4gIHJldHVybiB7XG4gICAgY3VycmVudDogY3VycmVudFBsYXRmb3JtLFxuICAgIHN1cHBvcnRlZCxcbiAgICBjb21wYXRpYmxlLFxuICAgIHJlYXNvbjogY29tcGF0aWJsZSA/IG51bGwgOiBgJHtlbnRyeS5tYW5pZmVzdC5uYW1lfSBpcyBvbmx5IGF2YWlsYWJsZSBvbiAke2Zvcm1hdFN0b3JlUGxhdGZvcm1zKHN1cHBvcnRlZCl9LmAsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmxlKGVudHJ5OiBUd2Vha1N0b3JlRW50cnkpOiB2b2lkIHtcbiAgY29uc3QgcGxhdGZvcm0gPSBzdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmlsaXR5KGVudHJ5KTtcbiAgaWYgKCFwbGF0Zm9ybS5jb21wYXRpYmxlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHBsYXRmb3JtLnJlYXNvbiA/PyBgJHtlbnRyeS5tYW5pZmVzdC5uYW1lfSBpcyBub3QgYXZhaWxhYmxlIG9uIHRoaXMgcGxhdGZvcm0uYCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eShcbiAgZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSxcbiAgY3VycmVudFZlcnNpb246IHN0cmluZyxcbik6IFN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eSB7XG4gIGNvbnN0IHJlcXVpcmVkID0gY2xlYW5NaW5SdW50aW1lKGVudHJ5Lm1hbmlmZXN0Lm1pblJ1bnRpbWUpO1xuICBjb25zdCBjb21wYXRpYmxlID0gIXJlcXVpcmVkIHx8IGNvbXBhcmVWZXJzaW9ucyhjdXJyZW50VmVyc2lvbiwgcmVxdWlyZWQpID49IDA7XG4gIHJldHVybiB7XG4gICAgY3VycmVudDogY3VycmVudFZlcnNpb24sXG4gICAgcmVxdWlyZWQsXG4gICAgY29tcGF0aWJsZSxcbiAgICByZWFzb246IGNvbXBhdGlibGUgfHwgIXJlcXVpcmVkXG4gICAgICA/IG51bGxcbiAgICAgIDogYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gcmVxdWlyZXMgQ29kZXgrKyAke3JlcXVpcmVkfSBvciBuZXdlci5gLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmxlKFxuICBlbnRyeTogVHdlYWtTdG9yZUVudHJ5LFxuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGNvbnN0IHJ1bnRpbWUgPSBzdG9yZUVudHJ5UnVudGltZUNvbXBhdGliaWxpdHkoZW50cnksIGN1cnJlbnRWZXJzaW9uKTtcbiAgaWYgKCFydW50aW1lLmNvbXBhdGlibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocnVudGltZS5yZWFzb24gPz8gYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gcmVxdWlyZXMgYSBuZXdlciBDb2RleCsrIHJ1bnRpbWUuYCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFuTWluUnVudGltZSh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IG51bGwge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdmVyc2lvbiA9IG5vcm1hbGl6ZVZlcnNpb24odmFsdWUucmVwbGFjZSgvXj49P1xccyovLCBcIlwiKSk7XG4gIHJldHVybiBWRVJTSU9OX1JFLnRlc3QodmVyc2lvbikgPyB2ZXJzaW9uIDogbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdFN0b3JlUGxhdGZvcm1zKHBsYXRmb3JtczogVHdlYWtTdG9yZVBsYXRmb3JtW10gfCBudWxsKTogc3RyaW5nIHtcbiAgaWYgKCFwbGF0Zm9ybXMgfHwgcGxhdGZvcm1zLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFwic3VwcG9ydGVkIHBsYXRmb3Jtc1wiO1xuICByZXR1cm4gcGxhdGZvcm1zLm1hcCgocGxhdGZvcm0pID0+IHtcbiAgICBpZiAocGxhdGZvcm0gPT09IFwiZGFyd2luXCIpIHJldHVybiBcIm1hY09TXCI7XG4gICAgaWYgKHBsYXRmb3JtID09PSBcIndpbjMyXCIpIHJldHVybiBcIldpbmRvd3NcIjtcbiAgICByZXR1cm4gXCJMaW51eFwiO1xuICB9KS5qb2luKFwiLCBcIik7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBU0EsSUFBQUEsbUJBQWlHO0FBQ2pHLElBQUFDLG1CQUFxSTtBQUNySSxJQUFBQyw2QkFBK0M7QUFDL0MsSUFBQUMsc0JBQWtEO0FBQ2xELElBQUFDLG9CQUE2RDtBQUM3RCxJQUFBQyxrQkFBZ0M7OztBQ2JoQyxJQUFBQyxhQUErQjtBQUMvQixJQUFBQyxtQkFBOEI7QUFDOUIsb0JBQTZCO0FBQzdCLElBQUFDLFdBQXlCOzs7QUNKekIsc0JBQStDO0FBQy9DLHlCQUF5QjtBQUN6Qix1QkFBdUY7QUFDaEYsSUFBTSxhQUFhO0FBQUEsRUFDdEIsV0FBVztBQUFBLEVBQ1gsVUFBVTtBQUFBLEVBQ1YsZUFBZTtBQUFBLEVBQ2YsaUJBQWlCO0FBQ3JCO0FBQ0EsSUFBTSxpQkFBaUI7QUFBQSxFQUNuQixNQUFNO0FBQUEsRUFDTixZQUFZLENBQUMsZUFBZTtBQUFBLEVBQzVCLGlCQUFpQixDQUFDLGVBQWU7QUFBQSxFQUNqQyxNQUFNLFdBQVc7QUFBQSxFQUNqQixPQUFPO0FBQUEsRUFDUCxPQUFPO0FBQUEsRUFDUCxZQUFZO0FBQUEsRUFDWixlQUFlO0FBQ25CO0FBQ0EsT0FBTyxPQUFPLGNBQWM7QUFDNUIsSUFBTSx1QkFBdUI7QUFDN0IsSUFBTSxxQkFBcUIsb0JBQUksSUFBSSxDQUFDLFVBQVUsU0FBUyxVQUFVLFNBQVMsb0JBQW9CLENBQUM7QUFDL0YsSUFBTSxZQUFZO0FBQUEsRUFDZCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQUEsRUFDWCxXQUFXO0FBQ2Y7QUFDQSxJQUFNLFlBQVksb0JBQUksSUFBSTtBQUFBLEVBQ3RCLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFDZixDQUFDO0FBQ0Qs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LEVBQVM7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ3ZCO0FBQUEsRUFBYTtBQUFBLEVBQWE7QUFBQSxFQUFhO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQ3BFO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFNO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFXO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQzFFO0FBQUEsRUFBTTtBQUFBLEVBQU07QUFBQSxFQUFPO0FBQUEsRUFBVztBQUFBLEVBQU07QUFBQSxFQUNwQztBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDNUQ7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDbkQ7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFNO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUMxQztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ3JGO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFTO0FBQUEsRUFDeEI7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQ3RDO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFXO0FBQUEsRUFDekI7QUFBQSxFQUFLO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ3REO0FBQUEsRUFBUztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUMvRTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFDZjtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDakY7QUFBQSxFQUNBO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBYTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNwRjtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFVO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDbkY7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNyQjtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDaEY7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUMxQztBQUFBLEVBQU87QUFBQSxFQUNQO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU07QUFBQSxFQUNoRjtBQUFB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QTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFB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QUFLLGdCQUFnQixLQUFLLE1BQU07QUFDOUIsUUFBSSxPQUFPLFFBQVEsV0FBWSxLQUFJLEtBQUssS0FBSyxPQUFPLFFBQVE7QUFBQSxRQUN2RCxrQkFBaUIsS0FBSyxrQkFBa0IsQ0FBQyxPQUFPLFFBQVEsQ0FBQztBQUFBLEVBQ2hFLENBQUM7QUFDSDtBQUVBLFNBQVNDLGdCQUFlLE9BQWUsT0FBdUI7QUFDNUQsTUFBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLG9CQUFvQixLQUFLLEtBQUssR0FBRztBQUNqRSxVQUFNLElBQUksTUFBTSxHQUFHLEtBQUssbUVBQW1FO0FBQUEsRUFDN0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGFBQWEsUUFBa0M7QUFDdEQsUUFBTSxTQUFTLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxRQUFRLE9BQU8sUUFBUSxNQUFNO0FBQ25FLE1BQUksQ0FBQyxPQUFPLE1BQU0sQ0FBQyxVQUFVLE9BQU8sVUFBVSxZQUFZLE9BQU8sU0FBUyxLQUFLLENBQUMsR0FBRztBQUNqRixVQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxFQUM5RTtBQUNBLE1BQUksT0FBTyxRQUFRLEtBQUssT0FBTyxTQUFTLEdBQUc7QUFDekMsVUFBTSxJQUFJLE1BQU0sOENBQThDO0FBQUEsRUFDaEU7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2VsZWN0cm9uIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX2NoaWxkX3Byb2Nlc3MiLCAiaW1wb3J0X25vZGVfY3J5cHRvIiwgImltcG9ydF9ub2RlX3BhdGgiLCAiaW1wb3J0X25vZGVfb3MiLCAiaW1wb3J0X2ZzIiwgImltcG9ydF9wcm9taXNlcyIsICJzeXNQYXRoIiwgInByZXNvbHZlIiwgImJhc2VuYW1lIiwgInBqb2luIiwgInByZWxhdGl2ZSIsICJwc2VwIiwgImltcG9ydF9wcm9taXNlcyIsICJvc1R5cGUiLCAiZnNfd2F0Y2giLCAicmF3RW1pdHRlciIsICJsaXN0ZW5lciIsICJiYXNlbmFtZSIsICJkaXJuYW1lIiwgIm5ld1N0YXRzIiwgImNsb3NlciIsICJmc3JlYWxwYXRoIiwgInJlc29sdmUiLCAicmVhbHBhdGgiLCAic3RhdHMiLCAicmVsYXRpdmUiLCAiRE9VQkxFX1NMQVNIX1JFIiwgInRlc3RTdHJpbmciLCAicGF0aCIsICJzdGF0cyIsICJzdGF0Y2IiLCAibm93IiwgInN0YXQiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJ1c2VyUm9vdCIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9lbGVjdHJvbiIsICJpbXBvcnRfbm9kZV9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAibG9nIiwgImV4cG9ydHMiLCAiYXNSZWNvcmQiLCAicmVzb2x2ZSIsICJ3ZWJDb250ZW50cyIsICJpbXBvcnRfZWxlY3Ryb24iLCAiaW1wb3J0X25vZGVfY3J5cHRvIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAibG9nIiwgImFzUmVjb3JkIiwgInJlc29sdmUiLCAicGxhdGZvcm0iLCAiaXNQYXRoSW5zaWRlIiwgImV4cG9ydHMiLCAiaW5mZXJNYWNBcHBSb290IiwgInBsYXRmb3JtIiwgInN0YXQiLCAiYXNSZWNvcmQiLCAiYXNzZXJ0QnJpZGdlSWQiLCAiaXNXaW5kb3dEZXN0cm95ZWQiLCAid2luZG93SWRGb3IiLCAibWFrZVdpbmRvd0xpa2VGb3JWaWV3Il0KfQo=
