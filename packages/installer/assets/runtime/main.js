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
var CODEX_CONFIG_FILE = (0, import_node_path9.join)((0, import_node_os2.homedir)(), ".codex", "config.toml");
var INSTALLER_STATE_FILE = (0, import_node_path9.join)(userRoot, "state.json");
var UPDATE_MODE_FILE = (0, import_node_path9.join)(userRoot, "update-mode.json");
var SELF_UPDATE_STATE_FILE = (0, import_node_path9.join)(userRoot, "self-update-state.json");
var SIGNED_CODEX_BACKUP = (0, import_node_path9.join)(userRoot, "backup", "Codex.app");
var CODEX_PLUSPLUS_CLI_SHIM = (0, import_node_path9.join)(userRoot, "bin", process.platform === "win32" ? "codexplusplus.cmd" : "codexplusplus");
var POST_UPDATE_REPAIR_LOG_FILE = (0, import_node_path9.join)(LOG_DIR, "post-update-repair.log");
var CODEX_PLUSPLUS_VERSION = "1.0.4";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21haW4udHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nob2tpZGFyL2VzbS9pbmRleC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVhZGRpcnAvZXNtL2luZGV4LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jaG9raWRhci9lc20vaGFuZGxlci5qcyIsICIuLi9zcmMvdHdlYWstZGlzY292ZXJ5LnRzIiwgIi4uL3NyYy9zdG9yYWdlLnRzIiwgIi4uL3NyYy9tY3Atc3luYy50cyIsICIuLi9zcmMvd2F0Y2hlci1oZWFsdGgudHMiLCAiLi4vc3JjL3R3ZWFrLWxpZmVjeWNsZS50cyIsICIuLi9zcmMvbG9nZ2luZy50cyIsICIuLi9zcmMvY29kZXgtcnVudGltZS1wcm9iZS50cyIsICIuLi9zcmMvbmF0aXZlLWJyaWRnZS50cyIsICIuLi9zcmMvbmF0aXZlLXBhdGhzLnRzIiwgIi4uL3NyYy90d2Vhay1zdG9yZS50cyIsICIuLi9zcmMvYnJvd3Nlci11aS50cyIsICIuLi9zcmMvdmVyc2lvbi11dGlscy50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUtY29tcGF0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIE1haW4tcHJvY2VzcyBib290c3RyYXAuIExvYWRlZCBieSB0aGUgYXNhciBsb2FkZXIgYmVmb3JlIENvZGV4J3Mgb3duXG4gKiBtYWluIHByb2Nlc3MgY29kZSBydW5zLiBXZSBob29rIGBCcm93c2VyV2luZG93YCBzbyBldmVyeSB3aW5kb3cgQ29kZXhcbiAqIGNyZWF0ZXMgZ2V0cyBvdXIgcHJlbG9hZCBzY3JpcHQgYXR0YWNoZWQuIFdlIGFsc28gc3RhbmQgdXAgYW4gSVBDXG4gKiBjaGFubmVsIGZvciB0d2Vha3MgdG8gdGFsayB0byB0aGUgbWFpbiBwcm9jZXNzLlxuICpcbiAqIFdlIGFyZSBpbiBDSlMgbGFuZCBoZXJlIChtYXRjaGVzIEVsZWN0cm9uJ3MgbWFpbiBwcm9jZXNzIGFuZCBDb2RleCdzIG93blxuICogY29kZSkuIFRoZSByZW5kZXJlci1zaWRlIHJ1bnRpbWUgaXMgYnVuZGxlZCBzZXBhcmF0ZWx5IGludG8gcHJlbG9hZC5qcy5cbiAqL1xuaW1wb3J0IHsgYXBwLCBCcm93c2VyVmlldywgQnJvd3NlcldpbmRvdywgY2xpcGJvYXJkLCBpcGNNYWluLCBzZXNzaW9uLCBzaGVsbCwgd2ViQ29udGVudHMgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGNwU3luYywgZXhpc3RzU3luYywgbWtkaXJTeW5jLCBta2R0ZW1wU3luYywgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgcmVhbHBhdGhTeW5jLCBybVN5bmMsIHN0YXRTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGV4ZWNGaWxlU3luYywgc3Bhd24sIHNwYXduU3luYyB9IGZyb20gXCJub2RlOmNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2gsIHJhbmRvbUludCwgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBob21lZGlyLCB0bXBkaXIgfSBmcm9tIFwibm9kZTpvc1wiO1xuaW1wb3J0IGNob2tpZGFyIGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IHsgZGlzY292ZXJUd2Vha3MsIHR5cGUgRGlzY292ZXJlZFR3ZWFrIH0gZnJvbSBcIi4vdHdlYWstZGlzY292ZXJ5XCI7XG5pbXBvcnQgeyBjcmVhdGVEaXNrU3RvcmFnZSwgdHlwZSBEaXNrU3RvcmFnZSB9IGZyb20gXCIuL3N0b3JhZ2VcIjtcbmltcG9ydCB7IHN5bmNNYW5hZ2VkTWNwU2VydmVycyB9IGZyb20gXCIuL21jcC1zeW5jXCI7XG5pbXBvcnQgeyBnZXRXYXRjaGVySGVhbHRoIH0gZnJvbSBcIi4vd2F0Y2hlci1oZWFsdGhcIjtcbmltcG9ydCB7XG4gIGlzTWFpblByb2Nlc3NUd2Vha1Njb3BlLFxuICByZWxvYWRUd2Vha3MsXG4gIHNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZCxcbn0gZnJvbSBcIi4vdHdlYWstbGlmZWN5Y2xlXCI7XG5pbXBvcnQgeyBhcHBlbmRDYXBwZWRMb2cgfSBmcm9tIFwiLi9sb2dnaW5nXCI7XG5pbXBvcnQge1xuICBnZXRDZHBTdGF0dXMsXG4gIGdldFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIGdldFJ1bnRpbWVJbmZvLFxuICBsaXN0Q2RwVGFyZ2V0cyxcbn0gZnJvbSBcIi4vY29kZXgtcnVudGltZS1wcm9iZVwiO1xuaW1wb3J0IHsgTmF0aXZlQnJpZGdlLCB0eXBlIE5hdGl2ZVR3ZWFrQ29udGV4dCB9IGZyb20gXCIuL25hdGl2ZS1icmlkZ2VcIjtcbmltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgQ29kZXhSdW50aW1lSW5mbyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIENvZGV4TW9kZWxPYmplY3RSZXN1bHQsXG4gIENvZGV4TW9kZWxSZWFzb25pbmdFZmZvcnQsXG4gIENvZGV4TW9kZWxUZXh0UmVzdWx0LFxuICBDb2RleFZpZXdDcmVhdGVPcHRpb25zLFxuICBDb2RleFZpZXdSZWYsXG4gIENvZGV4V2luZG93UmVmLFxuICBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zLFxuICBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucyxcbiAgTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zLFxuICBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucyxcbiAgVHdlYWtQZXJtaXNzaW9uLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9UV0VBS19TVE9SRV9JTkRFWF9VUkwsXG4gIG5vcm1hbGl6ZUdpdEh1YlJlcG8sXG4gIG5vcm1hbGl6ZVN0b3JlUmVnaXN0cnksXG4gIHNodWZmbGVTdG9yZUVudHJpZXMsXG4gIHN0b3JlQXJjaGl2ZVVybCxcbiAgdHlwZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24sXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVSZWdpc3RyeSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmVcIjtcbmltcG9ydCB7IG1heWJlU3RhcnRCcm93c2VyVWlTZXJ2ZXIgfSBmcm9tIFwiLi9icm93c2VyLXVpXCI7XG5pbXBvcnQgeyBjb21wYXJlVmVyc2lvbnMsIG5vcm1hbGl6ZVZlcnNpb24gfSBmcm9tIFwiLi92ZXJzaW9uLXV0aWxzXCI7XG5pbXBvcnQge1xuICBhc3NlcnRTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmxlLFxuICBhc3NlcnRTdG9yZUVudHJ5UnVudGltZUNvbXBhdGlibGUsXG4gIHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHksXG4gIHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmUtY29tcGF0XCI7XG5cbmNvbnN0IHVzZXJSb290ID0gcHJvY2Vzcy5lbnYuQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UO1xuY29uc3QgcnVudGltZURpciA9IHByb2Nlc3MuZW52LkNPREVYX1BMVVNQTFVTX1JVTlRJTUU7XG5cbmlmICghdXNlclJvb3QgfHwgIXJ1bnRpbWVEaXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiY29kZXgtcGx1c3BsdXMgcnVudGltZSBzdGFydGVkIHdpdGhvdXQgQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UL1JVTlRJTUUgZW52c1wiLFxuICApO1xufVxuXG5jb25zdCBQUkVMT0FEX1BBVEggPSByZXNvbHZlKHJ1bnRpbWVEaXIsIFwicHJlbG9hZC5qc1wiKTtcbmNvbnN0IFRXRUFLU19ESVIgPSBqb2luKHVzZXJSb290LCBcInR3ZWFrc1wiKTtcbmNvbnN0IExPR19ESVIgPSBqb2luKHVzZXJSb290LCBcImxvZ1wiKTtcbmNvbnN0IExPR19GSUxFID0gam9pbihMT0dfRElSLCBcIm1haW4ubG9nXCIpO1xuY29uc3QgQ09ORklHX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcImNvbmZpZy5qc29uXCIpO1xuY29uc3QgQ09ERVhfQ09ORklHX0ZJTEUgPSBqb2luKGhvbWVkaXIoKSwgXCIuY29kZXhcIiwgXCJjb25maWcudG9tbFwiKTtcbmNvbnN0IElOU1RBTExFUl9TVEFURV9GSUxFID0gam9pbih1c2VyUm9vdCwgXCJzdGF0ZS5qc29uXCIpO1xuY29uc3QgVVBEQVRFX01PREVfRklMRSA9IGpvaW4odXNlclJvb3QsIFwidXBkYXRlLW1vZGUuanNvblwiKTtcbmNvbnN0IFNFTEZfVVBEQVRFX1NUQVRFX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcInNlbGYtdXBkYXRlLXN0YXRlLmpzb25cIik7XG5jb25zdCBTSUdORURfQ09ERVhfQkFDS1VQID0gam9pbih1c2VyUm9vdCwgXCJiYWNrdXBcIiwgXCJDb2RleC5hcHBcIik7XG5jb25zdCBDT0RFWF9QTFVTUExVU19DTElfU0hJTSA9IGpvaW4odXNlclJvb3QsIFwiYmluXCIsIHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIiA/IFwiY29kZXhwbHVzcGx1cy5jbWRcIiA6IFwiY29kZXhwbHVzcGx1c1wiKTtcbmNvbnN0IFBPU1RfVVBEQVRFX1JFUEFJUl9MT0dfRklMRSA9IGpvaW4oTE9HX0RJUiwgXCJwb3N0LXVwZGF0ZS1yZXBhaXIubG9nXCIpO1xuY29uc3QgQ09ERVhfUExVU1BMVVNfVkVSU0lPTiA9IFwiMS4wLjRcIjtcbmNvbnN0IENPREVYX1BMVVNQTFVTX1JFUE8gPSBcImtwa2h4bGd5MC9jb2RleC1wbHVzcGx1c1wiO1xuY29uc3QgVFdFQUtfU1RPUkVfSU5ERVhfVVJMID0gcHJvY2Vzcy5lbnYuQ09ERVhfUExVU1BMVVNfU1RPUkVfSU5ERVhfVVJMID8/IERFRkFVTFRfVFdFQUtfU1RPUkVfSU5ERVhfVVJMO1xuY29uc3QgQ09ERVhfV0lORE9XX1NFUlZJQ0VTX0tFWSA9IFwiX19jb2RleHBwX3dpbmRvd19zZXJ2aWNlc19fXCI7XG5jb25zdCBERUJVR19XRUJfQ09OVEVOVFNfTE9HID0gcHJvY2Vzcy5lbnYuQ09ERVhQUF9ERUJVR19XRUJfQ09OVEVOVFMgPT09IFwiMVwiO1xuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZyb20tdmlld1wiO1xuXG50eXBlIE1lc3NhZ2VGcm9tVmlld0NvbnRleHQgPSB7IHNlbmRlcklkPzogbnVtYmVyOyBzZW5kZXJVcmw/OiBzdHJpbmcgfTtcbnR5cGUgTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIgPSAoXG4gIG1lc3NhZ2U6IHVua25vd24sXG4gIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQsXG4pID0+IHVua25vd24gfCB1bmRlZmluZWQ7XG50eXBlIE1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXIgPSAoXG4gIG1lc3NhZ2U6IHVua25vd24sXG4gIHJlc3BvbnNlOiB1bmtub3duLFxuICBjb250ZXh0OiBNZXNzYWdlRnJvbVZpZXdDb250ZXh0LFxuKSA9PiB2b2lkO1xuXG5jb25zdCBtYWluTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzID0gbmV3IFNldDxNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcj4oKTtcbmNvbnN0IG1haW5NZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVycyA9IG5ldyBTZXQ8TWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcj4oKTtcblxubWtkaXJTeW5jKExPR19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xubWtkaXJTeW5jKFRXRUFLU19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuaW5zdGFsbE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybUhvb2soKTtcblxuLy8gT3B0aW9uYWw6IGVuYWJsZSBDaHJvbWUgRGV2VG9vbHMgUHJvdG9jb2wgb24gYSBUQ1AgcG9ydCBzbyB3ZSBjYW4gZHJpdmUgdGhlXG4vLyBydW5uaW5nIENvZGV4IGZyb20gb3V0c2lkZSAoY3VybCBodHRwOi8vbG9jYWxob3N0Ojxwb3J0Pi9qc29uLCBhdHRhY2ggdmlhXG4vLyBDRFAgV2ViU29ja2V0LCB0YWtlIHNjcmVlbnNob3RzLCBldmFsdWF0ZSBpbiByZW5kZXJlciwgZXRjLikuIENvZGV4J3Ncbi8vIHByb2R1Y3Rpb24gYnVpbGQgc2V0cyB3ZWJQcmVmZXJlbmNlcy5kZXZUb29scz1mYWxzZSwgd2hpY2gga2lsbHMgdGhlXG4vLyBpbi13aW5kb3cgRGV2VG9vbHMgc2hvcnRjdXQsIGJ1dCBgLS1yZW1vdGUtZGVidWdnaW5nLXBvcnRgIHdvcmtzIHJlZ2FyZGxlc3Ncbi8vIGJlY2F1c2UgaXQncyBhIENocm9taXVtIGNvbW1hbmQtbGluZSBzd2l0Y2ggcHJvY2Vzc2VkIGJlZm9yZSBhcHAgaW5pdC5cbi8vXG4vLyBPZmYgYnkgZGVmYXVsdC4gU2V0IENPREVYUFBfUkVNT1RFX0RFQlVHPTEgKG9wdGlvbmFsbHkgQ09ERVhQUF9SRU1PVEVfREVCVUdfUE9SVClcbi8vIHRvIHR1cm4gaXQgb24uIE11c3QgYmUgYXBwZW5kZWQgYmVmb3JlIGBhcHBgIGJlY29tZXMgcmVhZHk7IHdlJ3JlIGF0IG1vZHVsZVxuLy8gdG9wLWxldmVsIHNvIHRoYXQncyBmaW5lLlxuaWYgKHByb2Nlc3MuZW52LkNPREVYUFBfUkVNT1RFX0RFQlVHID09PSBcIjFcIikge1xuICBjb25zdCBwb3J0ID0gcHJvY2Vzcy5lbnYuQ09ERVhQUF9SRU1PVEVfREVCVUdfUE9SVCA/PyBcIjkyMjJcIjtcbiAgYXBwLmNvbW1hbmRMaW5lLmFwcGVuZFN3aXRjaChcInJlbW90ZS1kZWJ1Z2dpbmctcG9ydFwiLCBwb3J0KTtcbiAgbG9nKFwiaW5mb1wiLCBgcmVtb3RlIGRlYnVnZ2luZyBlbmFibGVkIG9uIHBvcnQgJHtwb3J0fWApO1xufVxuXG5pbnRlcmZhY2UgUGVyc2lzdGVkU3RhdGUge1xuICBjb2RleFBsdXNQbHVzPzoge1xuICAgIGF1dG9VcGRhdGU/OiBib29sZWFuO1xuICAgIHNhZmVNb2RlPzogYm9vbGVhbjtcbiAgICB1cGRhdGVDaGFubmVsPzogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gICAgdXBkYXRlUmVwbz86IHN0cmluZztcbiAgICB1cGRhdGVSZWY/OiBzdHJpbmc7XG4gICAgdXBkYXRlQ2hlY2s/OiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2s7XG4gIH07XG4gIC8qKiBQZXItdHdlYWsgZW5hYmxlIGZsYWdzLiBNaXNzaW5nIGVudHJpZXMgZGVmYXVsdCB0byBlbmFibGVkLiAqL1xuICB0d2Vha3M/OiBSZWNvcmQ8c3RyaW5nLCB7IGVuYWJsZWQ/OiBib29sZWFuIH0+O1xuICAvKiogQ2FjaGVkIEdpdEh1YiByZWxlYXNlIGNoZWNrcy4gUnVudGltZSBuZXZlciBhdXRvLWluc3RhbGxzIHVwZGF0ZXMuICovXG4gIHR3ZWFrVXBkYXRlQ2hlY2tzPzogUmVjb3JkPHN0cmluZywgVHdlYWtVcGRhdGVDaGVjaz47XG59XG5cbmludGVyZmFjZSBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZU5vdGVzOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG50eXBlIFNlbGZVcGRhdGVDaGFubmVsID0gXCJzdGFibGVcIiB8IFwicHJlcmVsZWFzZVwiIHwgXCJjdXN0b21cIjtcbnR5cGUgU2VsZlVwZGF0ZVN0YXR1cyA9IFwiY2hlY2tpbmdcIiB8IFwidXAtdG8tZGF0ZVwiIHwgXCJ1cGRhdGVkXCIgfCBcImZhaWxlZFwiIHwgXCJkaXNhYmxlZFwiO1xuXG5pbnRlcmZhY2UgU2VsZlVwZGF0ZVN0YXRlIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIGNvbXBsZXRlZEF0Pzogc3RyaW5nO1xuICBzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXM7XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIHRhcmdldFJlZjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgcmVwbzogc3RyaW5nO1xuICBjaGFubmVsOiBTZWxmVXBkYXRlQ2hhbm5lbDtcbiAgc291cmNlUm9vdDogc3RyaW5nO1xuICBpbnN0YWxsYXRpb25Tb3VyY2U/OiBJbnN0YWxsYXRpb25Tb3VyY2U7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW5zdGFsbGF0aW9uU291cmNlIHtcbiAga2luZDogXCJnaXRodWItc291cmNlXCIgfCBcImhvbWVicmV3XCIgfCBcImxvY2FsLWRldlwiIHwgXCJzb3VyY2UtYXJjaGl2ZVwiIHwgXCJ1bmtub3duXCI7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRldGFpbDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVHdlYWtVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICByZXBvOiBzdHJpbmc7XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGxhdGVzdFRhZzogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgdXBkYXRlQXZhaWxhYmxlOiBib29sZWFuO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gcmVhZFN0YXRlKCk6IFBlcnNpc3RlZFN0YXRlIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoQ09ORklHX0ZJTEUsIFwidXRmOFwiKSkgYXMgUGVyc2lzdGVkU3RhdGU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7fTtcbiAgfVxufVxuZnVuY3Rpb24gd3JpdGVTdGF0ZShzOiBQZXJzaXN0ZWRTdGF0ZSk6IHZvaWQge1xuICB0cnkge1xuICAgIHdyaXRlRmlsZVN5bmMoQ09ORklHX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHMsIG51bGwsIDIpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJ3cml0ZVN0YXRlIGZhaWxlZDpcIiwgU3RyaW5nKChlIGFzIEVycm9yKS5tZXNzYWdlKSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGlzQ29kZXhQbHVzUGx1c0F1dG9VcGRhdGVFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cz8uYXV0b1VwZGF0ZSAhPT0gZmFsc2U7XG59XG5mdW5jdGlvbiBzZXRDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZShlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgcy5jb2RleFBsdXNQbHVzLmF1dG9VcGRhdGUgPSBlbmFibGVkO1xuICB3cml0ZVN0YXRlKHMpO1xufVxuZnVuY3Rpb24gc2V0Q29kZXhQbHVzUGx1c1VwZGF0ZUNvbmZpZyhjb25maWc6IHtcbiAgdXBkYXRlQ2hhbm5lbD86IFNlbGZVcGRhdGVDaGFubmVsO1xuICB1cGRhdGVSZXBvPzogc3RyaW5nO1xuICB1cGRhdGVSZWY/OiBzdHJpbmc7XG59KTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGFubmVsKSBzLmNvZGV4UGx1c1BsdXMudXBkYXRlQ2hhbm5lbCA9IGNvbmZpZy51cGRhdGVDaGFubmVsO1xuICBpZiAoXCJ1cGRhdGVSZXBvXCIgaW4gY29uZmlnKSBzLmNvZGV4UGx1c1BsdXMudXBkYXRlUmVwbyA9IGNsZWFuT3B0aW9uYWxTdHJpbmcoY29uZmlnLnVwZGF0ZVJlcG8pO1xuICBpZiAoXCJ1cGRhdGVSZWZcIiBpbiBjb25maWcpIHMuY29kZXhQbHVzUGx1cy51cGRhdGVSZWYgPSBjbGVhbk9wdGlvbmFsU3RyaW5nKGNvbmZpZy51cGRhdGVSZWYpO1xuICB3cml0ZVN0YXRlKHMpO1xufVxuZnVuY3Rpb24gaXNDb2RleFBsdXNQbHVzU2FmZU1vZGVFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWU7XG59XG5mdW5jdGlvbiBpc1R3ZWFrRW5hYmxlZChpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgaWYgKHMuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHMudHdlYWtzPy5baWRdPy5lbmFibGVkICE9PSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHNldFR3ZWFrRW5hYmxlZChpZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy50d2Vha3MgPz89IHt9O1xuICBzLnR3ZWFrc1tpZF0gPSB7IC4uLnMudHdlYWtzW2lkXSwgZW5hYmxlZCB9O1xuICB3cml0ZVN0YXRlKHMpO1xufVxuXG5pbnRlcmZhY2UgSW5zdGFsbGVyU3RhdGUge1xuICBhcHBSb290OiBzdHJpbmc7XG4gIGNvZGV4VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgc291cmNlUm9vdD86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gcmVhZEluc3RhbGxlclN0YXRlKCk6IEluc3RhbGxlclN0YXRlIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKElOU1RBTExFUl9TVEFURV9GSUxFLCBcInV0ZjhcIikpIGFzIEluc3RhbGxlclN0YXRlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkU2VsZlVwZGF0ZVN0YXRlKCk6IFNlbGZVcGRhdGVTdGF0ZSB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhTRUxGX1VQREFURV9TVEFURV9GSUxFLCBcInV0ZjhcIikpIGFzIFNlbGZVcGRhdGVTdGF0ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbmZ1bmN0aW9uIHdyaXRlU2VsZlVwZGF0ZVN0YXRlKHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICB3cml0ZUZpbGVTeW5jKFNFTEZfVVBEQVRFX1NUQVRFX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHN0YXRlLCBudWxsLCAyKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwid3JpdGVTZWxmVXBkYXRlU3RhdGUgZmFpbGVkOlwiLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbGVhbk9wdGlvbmFsU3RyaW5nKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgcmV0dXJuIHRyaW1tZWQgPyB0cmltbWVkIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1BhdGhJbnNpZGUocGFyZW50OiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHJlbCA9IHJlbGF0aXZlKHJlc29sdmUocGFyZW50KSwgcmVzb2x2ZSh0YXJnZXQpKTtcbiAgcmV0dXJuIHJlbCA9PT0gXCJcIiB8fCAoISFyZWwgJiYgIXJlbC5zdGFydHNXaXRoKFwiLi5cIikgJiYgIWlzQWJzb2x1dGUocmVsKSk7XG59XG5cbmZ1bmN0aW9uIGxvZyhsZXZlbDogXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgLi4uYXJnczogdW5rbm93bltdKTogdm9pZCB7XG4gIGNvbnN0IGxpbmUgPSBgWyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfV0gWyR7bGV2ZWx9XSAke2FyZ3NcbiAgICAubWFwKChhKSA9PiAodHlwZW9mIGEgPT09IFwic3RyaW5nXCIgPyBhIDogSlNPTi5zdHJpbmdpZnkoYSkpKVxuICAgIC5qb2luKFwiIFwiKX1cXG5gO1xuICB0cnkge1xuICAgIGFwcGVuZENhcHBlZExvZyhMT0dfRklMRSwgbGluZSk7XG4gIH0gY2F0Y2gge31cbiAgaWYgKGxldmVsID09PSBcImVycm9yXCIpIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdXCIsIC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsU3BhcmtsZVVwZGF0ZUhvb2soKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcImRhcndpblwiKSByZXR1cm47XG5cbiAgY29uc3QgTW9kdWxlID0gcmVxdWlyZShcIm5vZGU6bW9kdWxlXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJub2RlOm1vZHVsZVwiKSAmIHtcbiAgICBfbG9hZD86IChyZXF1ZXN0OiBzdHJpbmcsIHBhcmVudDogdW5rbm93biwgaXNNYWluOiBib29sZWFuKSA9PiB1bmtub3duO1xuICB9O1xuICBjb25zdCBvcmlnaW5hbExvYWQgPSBNb2R1bGUuX2xvYWQ7XG4gIGlmICh0eXBlb2Ygb3JpZ2luYWxMb2FkICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybjtcblxuICBNb2R1bGUuX2xvYWQgPSBmdW5jdGlvbiBjb2RleFBsdXNQbHVzTW9kdWxlTG9hZChyZXF1ZXN0OiBzdHJpbmcsIHBhcmVudDogdW5rbm93biwgaXNNYWluOiBib29sZWFuKSB7XG4gICAgY29uc3QgbG9hZGVkID0gb3JpZ2luYWxMb2FkLmFwcGx5KHRoaXMsIFtyZXF1ZXN0LCBwYXJlbnQsIGlzTWFpbl0pIGFzIHVua25vd247XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0ID09PSBcInN0cmluZ1wiICYmIC9zcGFya2xlKD86XFwubm9kZSk/JC9pLnRlc3QocmVxdWVzdCkpIHtcbiAgICAgIHdyYXBTcGFya2xlRXhwb3J0cyhsb2FkZWQpO1xuICAgIH1cbiAgICByZXR1cm4gbG9hZGVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwU3BhcmtsZUV4cG9ydHMobG9hZGVkOiB1bmtub3duKTogdm9pZCB7XG4gIGlmICghbG9hZGVkIHx8IHR5cGVvZiBsb2FkZWQgIT09IFwib2JqZWN0XCIpIHJldHVybjtcbiAgY29uc3QgZXhwb3J0cyA9IGxvYWRlZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHsgX19jb2RleHBwU3BhcmtsZVdyYXBwZWQ/OiBib29sZWFuIH07XG4gIGlmIChleHBvcnRzLl9fY29kZXhwcFNwYXJrbGVXcmFwcGVkKSByZXR1cm47XG4gIGV4cG9ydHMuX19jb2RleHBwU3BhcmtsZVdyYXBwZWQgPSB0cnVlO1xuXG4gIGZvciAoY29uc3QgbmFtZSBvZiBbXCJpbnN0YWxsVXBkYXRlc0lmQXZhaWxhYmxlXCJdKSB7XG4gICAgY29uc3QgZm4gPSBleHBvcnRzW25hbWVdO1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgY29udGludWU7XG4gICAgZXhwb3J0c1tuYW1lXSA9IGZ1bmN0aW9uIGNvZGV4UGx1c1BsdXNTcGFya2xlV3JhcHBlcih0aGlzOiB1bmtub3duLCAuLi5hcmdzOiB1bmtub3duW10pIHtcbiAgICAgIHByZXBhcmVTaWduZWRDb2RleEZvclNwYXJrbGVJbnN0YWxsKCk7XG4gICAgICByZXR1cm4gUmVmbGVjdC5hcHBseShmbiwgdGhpcywgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChleHBvcnRzLmRlZmF1bHQgJiYgZXhwb3J0cy5kZWZhdWx0ICE9PSBleHBvcnRzKSB7XG4gICAgd3JhcFNwYXJrbGVFeHBvcnRzKGV4cG9ydHMuZGVmYXVsdCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZVNpZ25lZENvZGV4Rm9yU3BhcmtsZUluc3RhbGwoKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcImRhcndpblwiKSByZXR1cm47XG4gIGlmIChleGlzdHNTeW5jKFVQREFURV9NT0RFX0ZJTEUpKSB7XG4gICAgbG9nKFwiaW5mb1wiLCBcIlNwYXJrbGUgdXBkYXRlIHByZXAgc2tpcHBlZDsgdXBkYXRlIG1vZGUgYWxyZWFkeSBhY3RpdmVcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghZXhpc3RzU3luYyhTSUdORURfQ09ERVhfQkFDS1VQKSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJTcGFya2xlIHVwZGF0ZSBwcmVwIHNraXBwZWQ7IHNpZ25lZCBDb2RleC5hcHAgYmFja3VwIGlzIG1pc3NpbmdcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghaXNEZXZlbG9wZXJJZFNpZ25lZEFwcChTSUdORURfQ09ERVhfQkFDS1VQKSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJTcGFya2xlIHVwZGF0ZSBwcmVwIHNraXBwZWQ7IENvZGV4LmFwcCBiYWNrdXAgaXMgbm90IERldmVsb3BlciBJRCBzaWduZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSByZWFkSW5zdGFsbGVyU3RhdGUoKTtcbiAgY29uc3QgYXBwUm9vdCA9IHN0YXRlPy5hcHBSb290ID8/IGluZmVyTWFjQXBwUm9vdCgpO1xuICBpZiAoIWFwcFJvb3QpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwiU3BhcmtsZSB1cGRhdGUgcHJlcCBza2lwcGVkOyBjb3VsZCBub3QgaW5mZXIgQ29kZXguYXBwIHBhdGhcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbW9kZSA9IHtcbiAgICBlbmFibGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBhcHBSb290LFxuICAgIGNvZGV4VmVyc2lvbjogc3RhdGU/LmNvZGV4VmVyc2lvbiA/PyBudWxsLFxuICB9O1xuICB3cml0ZUZpbGVTeW5jKFVQREFURV9NT0RFX0ZJTEUsIEpTT04uc3RyaW5naWZ5KG1vZGUsIG51bGwsIDIpKTtcbiAgc3RhcnRQb3N0VXBkYXRlUmVwYWlyTW9uaXRvcigpO1xuXG4gIHRyeSB7XG4gICAgZXhlY0ZpbGVTeW5jKFwiZGl0dG9cIiwgW1NJR05FRF9DT0RFWF9CQUNLVVAsIGFwcFJvb3RdLCB7IHN0ZGlvOiBcImlnbm9yZVwiIH0pO1xuICAgIHRyeSB7XG4gICAgICBleGVjRmlsZVN5bmMoXCJ4YXR0clwiLCBbXCItZHJcIiwgXCJjb20uYXBwbGUucXVhcmFudGluZVwiLCBhcHBSb290XSwgeyBzdGRpbzogXCJpZ25vcmVcIiB9KTtcbiAgICB9IGNhdGNoIHt9XG4gICAgbG9nKFwiaW5mb1wiLCBcIlJlc3RvcmVkIHNpZ25lZCBDb2RleC5hcHAgYmVmb3JlIFNwYXJrbGUgaW5zdGFsbFwiLCB7IGFwcFJvb3QgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJlcnJvclwiLCBcIkZhaWxlZCB0byByZXN0b3JlIHNpZ25lZCBDb2RleC5hcHAgYmVmb3JlIFNwYXJrbGUgaW5zdGFsbFwiLCB7XG4gICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdGFydFBvc3RVcGRhdGVSZXBhaXJNb25pdG9yKCk6IHZvaWQge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gXCJkYXJ3aW5cIikgcmV0dXJuO1xuICBpZiAoIWV4aXN0c1N5bmMoQ09ERVhfUExVU1BMVVNfQ0xJX1NISU0pKSB7XG4gICAgbG9nKFwid2FyblwiLCBcIlBvc3QtdXBkYXRlIHJlcGFpciBtb25pdG9yIHNraXBwZWQ7IENvZGV4KysgQ0xJIHNoaW0gaXMgbWlzc2luZ1wiLCB7XG4gICAgICBzaGltOiBDT0RFWF9QTFVTUExVU19DTElfU0hJTSxcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oXCIvYmluL3NoXCIsIFtcIi1jXCIsIGAke3Bvc3RVcGRhdGVSZXBhaXJTY3JpcHQoKX0gPj4gJHtzaGVsbFF1b3RlKFBPU1RfVVBEQVRFX1JFUEFJUl9MT0dfRklMRSl9IDI+JjFgXSwge1xuICAgICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgICBzdGRpbzogXCJpZ25vcmVcIixcbiAgICB9KTtcbiAgICBjaGlsZC51bnJlZigpO1xuICAgIGxvZyhcImluZm9cIiwgXCJTdGFydGVkIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3JcIiwge1xuICAgICAgbG9nOiBQT1NUX1VQREFURV9SRVBBSVJfTE9HX0ZJTEUsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwiUG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3IgZmFpbGVkIHRvIHN0YXJ0XCIsIHtcbiAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwb3N0VXBkYXRlUmVwYWlyU2NyaXB0KCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlcGFpckNvbW1hbmQgPSBbXG4gICAgXCJDT0RFWF9QTFVTUExVU19XQVRDSEVSPTFcIixcbiAgICBzaGVsbFF1b3RlKENPREVYX1BMVVNQTFVTX0NMSV9TSElNKSxcbiAgICBcInJlcGFpclwiLFxuICAgIFwiLS13YXRjaGVyXCIsXG4gICAgXCItLXF1aWV0XCIsXG4gICAgXCItLWxvY2FsXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIGNvbnN0IGRvY3RvckNvbW1hbmQgPSBgJHtzaGVsbFF1b3RlKENPREVYX1BMVVNQTFVTX0NMSV9TSElNKX0gZG9jdG9yID4vZGV2L251bGwgMj4mMWA7XG4gIHJldHVybiBbXG4gICAgXCJzZXQgLXVcIixcbiAgICBgZWNobyBcIlskKGRhdGUpXSBDb2RleCsrIHBvc3QtdXBkYXRlIHJlcGFpciBtb25pdG9yIHN0YXJ0ZWRcImAsXG4gICAgXCJzbGVlcCAyMFwiLFxuICAgIFwiZGVhZGxpbmU9JCgoICQoZGF0ZSArJXMpICsgOTAwICkpXCIsXG4gICAgXCJ3aGlsZSBbICQoZGF0ZSArJXMpIC1sdCAkZGVhZGxpbmUgXTsgZG9cIixcbiAgICBgICAke3JlcGFpckNvbW1hbmR9IHx8IHRydWVgLFxuICAgIGAgIGlmIFsgISAtZiAke3NoZWxsUXVvdGUoVVBEQVRFX01PREVfRklMRSl9IF0gJiYgJHtkb2N0b3JDb21tYW5kfTsgdGhlbmAsXG4gICAgYCAgICBlY2hvIFwiWyQoZGF0ZSldIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIGNvbXBsZXRlZFwiYCxcbiAgICBcIiAgICBleGl0IDBcIixcbiAgICBcIiAgZmlcIixcbiAgICBcIiAgc2xlZXAgMjBcIixcbiAgICBcImRvbmVcIixcbiAgICBgZWNobyBcIlskKGRhdGUpXSBDb2RleCsrIHBvc3QtdXBkYXRlIHJlcGFpciB0aW1lZCBvdXRcImAsXG4gICAgXCJleGl0IDFcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc0RldmVsb3BlcklkU2lnbmVkQXBwKGFwcFJvb3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCByZXN1bHQgPSBzcGF3blN5bmMoXCJjb2Rlc2lnblwiLCBbXCItZHZcIiwgXCItLXZlcmJvc2U9NFwiLCBhcHBSb290XSwge1xuICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gIH0pO1xuICBjb25zdCBvdXRwdXQgPSBgJHtyZXN1bHQuc3Rkb3V0ID8/IFwiXCJ9JHtyZXN1bHQuc3RkZXJyID8/IFwiXCJ9YDtcbiAgcmV0dXJuIChcbiAgICByZXN1bHQuc3RhdHVzID09PSAwICYmXG4gICAgL0F1dGhvcml0eT1EZXZlbG9wZXIgSUQgQXBwbGljYXRpb246Ly50ZXN0KG91dHB1dCkgJiZcbiAgICAhL1NpZ25hdHVyZT1hZGhvYy8udGVzdChvdXRwdXQpICYmXG4gICAgIS9UZWFtSWRlbnRpZmllcj1ub3Qgc2V0Ly50ZXN0KG91dHB1dClcbiAgKTtcbn1cblxuZnVuY3Rpb24gaW5mZXJNYWNBcHBSb290KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBtYXJrZXIgPSBcIi5hcHAvQ29udGVudHMvTWFjT1MvXCI7XG4gIGNvbnN0IGlkeCA9IHByb2Nlc3MuZXhlY1BhdGguaW5kZXhPZihtYXJrZXIpO1xuICByZXR1cm4gaWR4ID49IDAgPyBwcm9jZXNzLmV4ZWNQYXRoLnNsaWNlKDAsIGlkeCArIFwiLmFwcFwiLmxlbmd0aCkgOiBudWxsO1xufVxuXG4vLyBTdXJmYWNlIHVuaGFuZGxlZCBlcnJvcnMgZnJvbSBhbnl3aGVyZSBpbiB0aGUgbWFpbiBwcm9jZXNzIHRvIG91ciBsb2cuXG5wcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgKGU6IEVycm9yICYgeyBjb2RlPzogc3RyaW5nIH0pID0+IHtcbiAgbG9nKFwiZXJyb3JcIiwgXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCB7IGNvZGU6IGUuY29kZSwgbWVzc2FnZTogZS5tZXNzYWdlLCBzdGFjazogZS5zdGFjayB9KTtcbn0pO1xucHJvY2Vzcy5vbihcInVuaGFuZGxlZFJlamVjdGlvblwiLCAoZSkgPT4ge1xuICBsb2coXCJlcnJvclwiLCBcInVuaGFuZGxlZFJlamVjdGlvblwiLCB7IHZhbHVlOiBTdHJpbmcoZSkgfSk7XG59KTtcblxuaW5zdGFsbFNwYXJrbGVVcGRhdGVIb29rKCk7XG5cbmludGVyZmFjZSBMb2FkZWRNYWluVHdlYWsge1xuICBzdG9wPzogKCkgPT4gdm9pZDtcbiAgc3RvcmFnZTogRGlza1N0b3JhZ2U7XG59XG5cbmludGVyZmFjZSBDb2RleFdpbmRvd1NlcnZpY2VzIHtcbiAgY3JlYXRlRnJlc2hXaW5kb3c/OiAocm91dGU/OiBzdHJpbmcpID0+IFByb21pc2U8RWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw+O1xuICBjcmVhdGVGcmVzaExvY2FsV2luZG93PzogKHJvdXRlPzogc3RyaW5nKSA9PiBQcm9taXNlPEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsPjtcbiAgZW5zdXJlSG9zdFdpbmRvdz86IChob3N0SWQ/OiBzdHJpbmcpID0+IFByb21pc2U8RWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw+O1xuICBnZXRQcmltYXJ5V2luZG93PzogKGhvc3RJZD86IHN0cmluZykgPT4gRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw7XG4gIGdldENvbnRleHQ/OiAoaG9zdElkOiBzdHJpbmcpID0+IHsgcmVnaXN0ZXJXaW5kb3c/OiAod2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlKSA9PiB2b2lkIH0gfCBudWxsO1xuICB3aW5kb3dNYW5hZ2VyPzoge1xuICAgIGNyZWF0ZVdpbmRvdz86IChvcHRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTxFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbD47XG4gICAgZ2V0UHJpbWFyeVdpbmRvdz86ICgpID0+IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsO1xuICAgIHJlZ2lzdGVyV2luZG93PzogKFxuICAgICAgd2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlLFxuICAgICAgaG9zdElkOiBzdHJpbmcsXG4gICAgICBwcmltYXJ5OiBib29sZWFuLFxuICAgICAgYXBwZWFyYW5jZTogc3RyaW5nLFxuICAgICkgPT4gdm9pZDtcbiAgICBvcHRpb25zPzoge1xuICAgICAgYWxsb3dEZXZ0b29scz86IGJvb2xlYW47XG4gICAgICBwcmVsb2FkUGF0aD86IHN0cmluZztcbiAgICB9O1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ29kZXhXaW5kb3dMaWtlIHtcbiAgaWQ6IG51bWJlcjtcbiAgd2ViQ29udGVudHM6IEVsZWN0cm9uLldlYkNvbnRlbnRzO1xuICBvbihldmVudDogXCJjbG9zZWRcIiwgbGlzdGVuZXI6ICgpID0+IHZvaWQpOiB1bmtub3duO1xuICBvbmNlPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIG9mZj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICByZW1vdmVMaXN0ZW5lcj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICBpc0Rlc3Ryb3llZD8oKTogYm9vbGVhbjtcbiAgaXNGb2N1c2VkPygpOiBib29sZWFuO1xuICBmb2N1cz8oKTogdm9pZDtcbiAgc2hvdz8oKTogdm9pZDtcbiAgaGlkZT8oKTogdm9pZDtcbiAgZ2V0Qm91bmRzPygpOiBFbGVjdHJvbi5SZWN0YW5nbGU7XG4gIGdldENvbnRlbnRCb3VuZHM/KCk6IEVsZWN0cm9uLlJlY3RhbmdsZTtcbiAgZ2V0U2l6ZT8oKTogW251bWJlciwgbnVtYmVyXTtcbiAgZ2V0Q29udGVudFNpemU/KCk6IFtudW1iZXIsIG51bWJlcl07XG4gIHNldFRpdGxlPyh0aXRsZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0VGl0bGU/KCk6IHN0cmluZztcbiAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZT8oZmlsZW5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldERvY3VtZW50RWRpdGVkPyhlZGl0ZWQ6IGJvb2xlYW4pOiB2b2lkO1xuICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5Pyh2aXNpYmxlOiBib29sZWFuKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIENvZGV4Q3JlYXRlV2luZG93T3B0aW9ucyB7XG4gIHJvdXRlOiBzdHJpbmc7XG4gIGhvc3RJZD86IHN0cmluZztcbiAgc2hvdz86IGJvb2xlYW47XG4gIGFwcGVhcmFuY2U/OiBzdHJpbmc7XG4gIHBhcmVudFdpbmRvd0lkPzogbnVtYmVyO1xuICBib3VuZHM/OiBFbGVjdHJvbi5SZWN0YW5nbGU7XG59XG5cbmludGVyZmFjZSBDb2RleENyZWF0ZVZpZXdPcHRpb25zIHtcbiAgcm91dGU6IHN0cmluZztcbiAgaG9zdElkPzogc3RyaW5nO1xuICBhcHBlYXJhbmNlPzogc3RyaW5nO1xufVxuXG50eXBlIE93bFZpZXdBdHRhY2hNb2RlID0gXCJjb250ZW50Vmlld1wiIHwgXCJicm93c2VyVmlld1wiO1xuXG5pbnRlcmZhY2UgTWFuYWdlZE93bFZpZXcge1xuICBrZXk6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBpZDogc3RyaW5nO1xuICB2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldztcbiAgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGw7XG4gIGF0dGFjaE1vZGU6IE93bFZpZXdBdHRhY2hNb2RlIHwgbnVsbDtcbiAgZGlzcG9zZUJpbmRpbmdzOiBBcnJheTwoKSA9PiB2b2lkPjtcbiAgZGlzcG9zZWQ6IGJvb2xlYW47XG59XG5cbmNvbnN0IHR3ZWFrU3RhdGUgPSB7XG4gIGRpc2NvdmVyZWQ6IFtdIGFzIERpc2NvdmVyZWRUd2Vha1tdLFxuICBsb2FkZWRNYWluOiBuZXcgTWFwPHN0cmluZywgTG9hZGVkTWFpblR3ZWFrPigpLFxufTtcblxuY29uc3QgbmF0aXZlQnJpZGdlID0gbmV3IE5hdGl2ZUJyaWRnZShsb2csIHtcbiAgbmF0aXZlSG9zdFBhdGg6IGpvaW4ocnVudGltZURpciwgXCJuYXRpdmVcIiwgXCJjb2RleHBwX25hdGl2ZV9ob3N0Lm5vZGVcIiksXG59KTtcbmNvbnN0IG93bFZpZXdzID0gbmV3IE1hcDxzdHJpbmcsIE1hbmFnZWRPd2xWaWV3PigpO1xuXG5jb25zdCB0d2Vha0xpZmVjeWNsZURlcHMgPSB7XG4gIGxvZ0luZm86IChtZXNzYWdlOiBzdHJpbmcpID0+IGxvZyhcImluZm9cIiwgbWVzc2FnZSksXG4gIHNldFR3ZWFrRW5hYmxlZCxcbiAgc3RvcEFsbE1haW5Ud2Vha3MsXG4gIGNsZWFyVHdlYWtNb2R1bGVDYWNoZSxcbiAgbG9hZEFsbE1haW5Ud2Vha3MsXG4gIGJyb2FkY2FzdFJlbG9hZCxcbn07XG5cbi8vIDEuIEhvb2sgZXZlcnkgc2Vzc2lvbiBzbyBvdXIgcHJlbG9hZCBydW5zIGluIGV2ZXJ5IHJlbmRlcmVyLlxuLy9cbi8vIFdlIHVzZSBFbGVjdHJvbidzIG1vZGVybiBgc2Vzc2lvbi5yZWdpc3RlclByZWxvYWRTY3JpcHRgIEFQSSAoYWRkZWQgaW5cbi8vIEVsZWN0cm9uIDM1KS4gVGhlIGRlcHJlY2F0ZWQgYHNldFByZWxvYWRzYCBwYXRoIHNpbGVudGx5IG5vLW9wcyBpbiBzb21lXG4vLyBjb25maWd1cmF0aW9ucyAobm90YWJseSB3aXRoIHNhbmRib3hlZCByZW5kZXJlcnMpLCBzbyByZWdpc3RlclByZWxvYWRTY3JpcHRcbi8vIGlzIHRoZSBvbmx5IHJlbGlhYmxlIHdheSB0byBpbmplY3QgaW50byBDb2RleCdzIEJyb3dzZXJXaW5kb3dzLlxuZnVuY3Rpb24gcmVnaXN0ZXJQcmVsb2FkKHM6IEVsZWN0cm9uLlNlc3Npb24sIGxhYmVsOiBzdHJpbmcpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZWcgPSAocyBhcyB1bmtub3duIGFzIHtcbiAgICAgIHJlZ2lzdGVyUHJlbG9hZFNjcmlwdD86IChvcHRzOiB7XG4gICAgICAgIHR5cGU/OiBcImZyYW1lXCIgfCBcInNlcnZpY2Utd29ya2VyXCI7XG4gICAgICAgIGlkPzogc3RyaW5nO1xuICAgICAgICBmaWxlUGF0aDogc3RyaW5nO1xuICAgICAgfSkgPT4gc3RyaW5nO1xuICAgIH0pLnJlZ2lzdGVyUHJlbG9hZFNjcmlwdDtcbiAgICBpZiAodHlwZW9mIHJlZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZWcuY2FsbChzLCB7IHR5cGU6IFwiZnJhbWVcIiwgZmlsZVBhdGg6IFBSRUxPQURfUEFUSCwgaWQ6IFwiY29kZXgtcGx1c3BsdXNcIiB9KTtcbiAgICAgIGxvZyhcImluZm9cIiwgYHByZWxvYWQgcmVnaXN0ZXJlZCAocmVnaXN0ZXJQcmVsb2FkU2NyaXB0KSBvbiAke2xhYmVsfTpgLCBQUkVMT0FEX1BBVEgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBGYWxsYmFjayBmb3Igb2xkZXIgRWxlY3Ryb24gdmVyc2lvbnMuXG4gICAgY29uc3QgZXhpc3RpbmcgPSBzLmdldFByZWxvYWRzKCk7XG4gICAgaWYgKCFleGlzdGluZy5pbmNsdWRlcyhQUkVMT0FEX1BBVEgpKSB7XG4gICAgICBzLnNldFByZWxvYWRzKFsuLi5leGlzdGluZywgUFJFTE9BRF9QQVRIXSk7XG4gICAgfVxuICAgIGxvZyhcImluZm9cIiwgYHByZWxvYWQgcmVnaXN0ZXJlZCAoc2V0UHJlbG9hZHMpIG9uICR7bGFiZWx9OmAsIFBSRUxPQURfUEFUSCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcImV4aXN0aW5nIElEXCIpKSB7XG4gICAgICBsb2coXCJpbmZvXCIsIGBwcmVsb2FkIGFscmVhZHkgcmVnaXN0ZXJlZCBvbiAke2xhYmVsfTpgLCBQUkVMT0FEX1BBVEgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsb2coXCJlcnJvclwiLCBgcHJlbG9hZCByZWdpc3RyYXRpb24gb24gJHtsYWJlbH0gZmFpbGVkOmAsIGUpO1xuICB9XG59XG5cbmFwcC53aGVuUmVhZHkoKS50aGVuKCgpID0+IHtcbiAgbG9nKFwiaW5mb1wiLCBcImFwcCByZWFkeSBmaXJlZFwiKTtcbiAgaWYgKGlzQ29kZXhQbHVzUGx1c1NhZmVNb2RlRW5hYmxlZCgpKSB7XG4gICAgbG9nKFwid2FyblwiLCBcInNhZmUgbW9kZSBpcyBlbmFibGVkOyBwcmVsb2FkIHdpbGwgbm90IGJlIHJlZ2lzdGVyZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJlZ2lzdGVyUHJlbG9hZChzZXNzaW9uLmRlZmF1bHRTZXNzaW9uLCBcImRlZmF1bHRTZXNzaW9uXCIpO1xuICBtYXliZVN0YXJ0QnJvd3NlclVpU2VydmVyKHtcbiAgICBnZXRXaW5kb3dTZXJ2aWNlczogZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcyxcbiAgICBsb2csXG4gIH0pO1xufSk7XG5cbmFwcC5vbihcInNlc3Npb24tY3JlYXRlZFwiLCAocykgPT4ge1xuICBpZiAoaXNDb2RleFBsdXNQbHVzU2FmZU1vZGVFbmFibGVkKCkpIHJldHVybjtcbiAgcmVnaXN0ZXJQcmVsb2FkKHMsIFwic2Vzc2lvbi1jcmVhdGVkXCIpO1xufSk7XG5cbmFwcC5vbihcIndlYi1jb250ZW50cy1jcmVhdGVkXCIsIChfZSwgd2MpID0+IHtcbiAgdHJ5IHtcbiAgICBpZiAoREVCVUdfV0VCX0NPTlRFTlRTX0xPRykge1xuICAgICAgY29uc3Qgd3AgPSAod2MgYXMgdW5rbm93biBhcyB7IGdldExhc3RXZWJQcmVmZXJlbmNlcz86ICgpID0+IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pXG4gICAgICAgIC5nZXRMYXN0V2ViUHJlZmVyZW5jZXM/LigpO1xuICAgICAgbG9nKFwiaW5mb1wiLCBcIndlYi1jb250ZW50cy1jcmVhdGVkXCIsIHtcbiAgICAgICAgaWQ6IHdjLmlkLFxuICAgICAgICB0eXBlOiB3Yy5nZXRUeXBlKCksXG4gICAgICAgIHNlc3Npb25Jc0RlZmF1bHQ6IHdjLnNlc3Npb24gPT09IHNlc3Npb24uZGVmYXVsdFNlc3Npb24sXG4gICAgICAgIHNhbmRib3g6IHdwPy5zYW5kYm94LFxuICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB3cD8uY29udGV4dElzb2xhdGlvbixcbiAgICAgIH0pO1xuICAgIH1cbiAgICB3Yy5vbihcInByZWxvYWQtZXJyb3JcIiwgKF9ldiwgcCwgZXJyKSA9PiB7XG4gICAgICBsb2coXCJlcnJvclwiLCBgd2MgJHt3Yy5pZH0gcHJlbG9hZC1lcnJvciBwYXRoPSR7cH1gLCBTdHJpbmcoZXJyPy5zdGFjayA/PyBlcnIpKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcImVycm9yXCIsIFwid2ViLWNvbnRlbnRzLWNyZWF0ZWQgaGFuZGxlciBmYWlsZWQ6XCIsIFN0cmluZygoZSBhcyBFcnJvcik/LnN0YWNrID8/IGUpKTtcbiAgfVxufSk7XG5cbmxvZyhcImluZm9cIiwgXCJtYWluLnRzIGV2YWx1YXRlZDsgYXBwLmlzUmVhZHk9XCIgKyBhcHAuaXNSZWFkeSgpKTtcbmlmIChpc0NvZGV4UGx1c1BsdXNTYWZlTW9kZUVuYWJsZWQoKSkge1xuICBsb2coXCJ3YXJuXCIsIFwic2FmZSBtb2RlIGlzIGVuYWJsZWQ7IHR3ZWFrcyB3aWxsIG5vdCBiZSBsb2FkZWRcIik7XG59XG5cbi8vIDIuIEluaXRpYWwgdHdlYWsgZGlzY292ZXJ5ICsgbWFpbi1zY29wZSBsb2FkLlxubG9hZEFsbE1haW5Ud2Vha3MoKTtcblxuYXBwLm9uKFwid2lsbC1xdWl0XCIsICgpID0+IHtcbiAgc3RvcEFsbE1haW5Ud2Vha3MoKTtcbiAgbmF0aXZlQnJpZGdlLmRpc3Bvc2VBbGwoKTtcbiAgZGlzcG9zZUFsbE93bFZpZXdzKCk7XG4gIC8vIEJlc3QtZWZmb3J0IGZsdXNoIG9mIGFueSBwZW5kaW5nIHN0b3JhZ2Ugd3JpdGVzLlxuICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtTdGF0ZS5sb2FkZWRNYWluLnZhbHVlcygpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHQuc3RvcmFnZS5mbHVzaCgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxufSk7XG5cbi8vIDMuIElQQzogZXhwb3NlIHR3ZWFrIG1ldGFkYXRhICsgcmV2ZWFsLWluLWZpbmRlci5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpsaXN0LXR3ZWFrc1wiLCBhc3luYyAoKSA9PiB7XG4gIGF3YWl0IFByb21pc2UuYWxsKHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+IGVuc3VyZVR3ZWFrVXBkYXRlQ2hlY2sodCkpKTtcbiAgY29uc3QgdXBkYXRlQ2hlY2tzID0gcmVhZFN0YXRlKCkudHdlYWtVcGRhdGVDaGVja3MgPz8ge307XG4gIHJldHVybiB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiAoe1xuICAgIG1hbmlmZXN0OiB0Lm1hbmlmZXN0LFxuICAgIGVudHJ5OiB0LmVudHJ5LFxuICAgIGRpcjogdC5kaXIsXG4gICAgZW50cnlFeGlzdHM6IGV4aXN0c1N5bmModC5lbnRyeSksXG4gICAgZW5hYmxlZDogaXNUd2Vha0VuYWJsZWQodC5tYW5pZmVzdC5pZCksXG4gICAgdXBkYXRlOiB1cGRhdGVDaGVja3NbdC5tYW5pZmVzdC5pZF0gPz8gbnVsbCxcbiAgfSkpO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpnZXQtdHdlYWstZW5hYmxlZFwiLCAoX2UsIGlkOiBzdHJpbmcpID0+IGlzVHdlYWtFbmFibGVkKGlkKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6c2V0LXR3ZWFrLWVuYWJsZWRcIiwgKF9lLCBpZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gIHJldHVybiBzZXRUd2Vha0VuYWJsZWRBbmRSZWxvYWQoaWQsIGVuYWJsZWQsIHR3ZWFrTGlmZWN5Y2xlRGVwcyk7XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC1jb25maWdcIiwgKCkgPT4ge1xuICBjb25zdCBzID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGluc3RhbGxlclN0YXRlID0gcmVhZEluc3RhbGxlclN0YXRlKCk7XG4gIGNvbnN0IHNvdXJjZVJvb3QgPSBpbnN0YWxsZXJTdGF0ZT8uc291cmNlUm9vdCA/PyBmYWxsYmFja1NvdXJjZVJvb3QoKTtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uOiBDT0RFWF9QTFVTUExVU19WRVJTSU9OLFxuICAgIGF1dG9VcGRhdGU6IHMuY29kZXhQbHVzUGx1cz8uYXV0b1VwZGF0ZSAhPT0gZmFsc2UsXG4gICAgc2FmZU1vZGU6IHMuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWUsXG4gICAgdXBkYXRlQ2hhbm5lbDogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCIsXG4gICAgdXBkYXRlUmVwbzogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgdXBkYXRlUmVmOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlZiA/PyBcIlwiLFxuICAgIHVwZGF0ZUNoZWNrOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoZWNrID8/IG51bGwsXG4gICAgc2VsZlVwZGF0ZTogcmVhZFNlbGZVcGRhdGVTdGF0ZSgpLFxuICAgIGluc3RhbGxhdGlvblNvdXJjZTogZGVzY3JpYmVJbnN0YWxsYXRpb25Tb3VyY2Uoc291cmNlUm9vdCksXG4gIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOnNldC1hdXRvLXVwZGF0ZVwiLCAoX2UsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgc2V0Q29kZXhQbHVzUGx1c0F1dG9VcGRhdGUoISFlbmFibGVkKTtcbiAgcmV0dXJuIHsgYXV0b1VwZGF0ZTogaXNDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZUVuYWJsZWQoKSB9O1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpzZXQtdXBkYXRlLWNvbmZpZ1wiLCAoX2UsIGNvbmZpZzoge1xuICB1cGRhdGVDaGFubmVsPzogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG8/OiBzdHJpbmc7XG4gIHVwZGF0ZVJlZj86IHN0cmluZztcbn0pID0+IHtcbiAgc2V0Q29kZXhQbHVzUGx1c1VwZGF0ZUNvbmZpZyhjb25maWcpO1xuICBjb25zdCBzID0gcmVhZFN0YXRlKCk7XG4gIHJldHVybiB7XG4gICAgdXBkYXRlQ2hhbm5lbDogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCIsXG4gICAgdXBkYXRlUmVwbzogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgdXBkYXRlUmVmOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlZiA/PyBcIlwiLFxuICB9O1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCBhc3luYyAoX2UsIGZvcmNlPzogYm9vbGVhbikgPT4ge1xuICByZXR1cm4gZW5zdXJlQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKGZvcmNlID09PSB0cnVlKTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cnVuLWNvZGV4cHAtdXBkYXRlXCIsIGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc291cmNlUm9vdCA9IHJlYWRJbnN0YWxsZXJTdGF0ZSgpPy5zb3VyY2VSb290ID8/IGZhbGxiYWNrU291cmNlUm9vdCgpO1xuICBpZiAoIXNvdXJjZVJvb3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCsrIHNvdXJjZSBDTEkgd2FzIG5vdCBmb3VuZC4gUnVuIHRoZSBpbnN0YWxsZXIgb25jZSwgdGhlbiB0cnkgYWdhaW4uXCIpO1xuICB9XG4gIGNvbnN0IGNsaSA9IGpvaW4oc291cmNlUm9vdCwgXCJwYWNrYWdlc1wiLCBcImluc3RhbGxlclwiLCBcImRpc3RcIiwgXCJjbGkuanNcIik7XG4gIGlmICghZXhpc3RzU3luYyhjbGkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXgrKyBzb3VyY2UgQ0xJIHdhcyBub3QgZm91bmQuIFJ1biB0aGUgaW5zdGFsbGVyIG9uY2UsIHRoZW4gdHJ5IGFnYWluLlwiKTtcbiAgfVxuICBjb25zdCBwZW5kaW5nID0gbWFya1NlbGZVcGRhdGVTdGFydGVkKHNvdXJjZVJvb3QpO1xuICBzdGFydEluc3RhbGxlZENsaShjbGksIFtcInVwZGF0ZVwiLCBcIi0td2F0Y2hlclwiXSk7XG4gIHJldHVybiBwZW5kaW5nO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpnZXQtd2F0Y2hlci1oZWFsdGhcIiwgKCkgPT4gZ2V0V2F0Y2hlckhlYWx0aCh1c2VyUm9vdCEpKTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC10d2Vhay1zdG9yZVwiLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHN0b3JlID0gYXdhaXQgZmV0Y2hUd2Vha1N0b3JlUmVnaXN0cnkoKTtcbiAgY29uc3QgcmVnaXN0cnkgPSBzdG9yZS5yZWdpc3RyeTtcbiAgY29uc3QgaW5zdGFsbGVkID0gbmV3IE1hcCh0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiBbdC5tYW5pZmVzdC5pZCwgdF0pKTtcbiAgY29uc3QgZW50cmllcyA9IHNodWZmbGVTdG9yZUVudHJpZXMocmVnaXN0cnkuZW50cmllcywgcmFuZG9tSW50KTtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZWdpc3RyeSxcbiAgICBzb3VyY2VVcmw6IFRXRUFLX1NUT1JFX0lOREVYX1VSTCxcbiAgICBmZXRjaGVkQXQ6IHN0b3JlLmZldGNoZWRBdCxcbiAgICBlbnRyaWVzOiBlbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICAgIGNvbnN0IGxvY2FsID0gaW5zdGFsbGVkLmdldChlbnRyeS5pZCk7XG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkoZW50cnkpO1xuICAgICAgY29uc3QgcnVudGltZSA9IHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eShlbnRyeSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5lbnRyeSxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIHJ1bnRpbWUsXG4gICAgICAgIGluc3RhbGxlZDogbG9jYWxcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgdmVyc2lvbjogbG9jYWwubWFuaWZlc3QudmVyc2lvbixcbiAgICAgICAgICAgICAgZW5hYmxlZDogaXNUd2Vha0VuYWJsZWQobG9jYWwubWFuaWZlc3QuaWQpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIH07XG4gICAgfSksXG4gIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmluc3RhbGwtc3RvcmUtdHdlYWtcIiwgYXN5bmMgKF9lLCBpZDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHsgcmVnaXN0cnkgfSA9IGF3YWl0IGZldGNoVHdlYWtTdG9yZVJlZ2lzdHJ5KCk7XG4gIGNvbnN0IGVudHJ5ID0gcmVnaXN0cnkuZW50cmllcy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS5pZCA9PT0gaWQpO1xuICBpZiAoIWVudHJ5KSB0aHJvdyBuZXcgRXJyb3IoYFR3ZWFrIHN0b3JlIGVudHJ5IG5vdCBmb3VuZDogJHtpZH1gKTtcbiAgYXNzZXJ0U3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJsZShlbnRyeSk7XG4gIGFzc2VydFN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJsZShlbnRyeSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTik7XG4gIGF3YWl0IGluc3RhbGxTdG9yZVR3ZWFrKGVudHJ5KTtcbiAgcmVsb2FkVHdlYWtzKFwic3RvcmUtaW5zdGFsbFwiLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICByZXR1cm4geyBpbnN0YWxsZWQ6IGVudHJ5LmlkIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOnByZXBhcmUtdHdlYWstc3RvcmUtc3VibWlzc2lvblwiLCBhc3luYyAoX2UsIHJlcG9JbnB1dDogc3RyaW5nKSA9PiB7XG4gIHJldHVybiBwcmVwYXJlVHdlYWtTdG9yZVN1Ym1pc3Npb24ocmVwb0lucHV0KTtcbn0pO1xuXG4vLyBTYW5kYm94ZWQgcmVuZGVyZXIgcHJlbG9hZCBjYW4ndCB1c2UgTm9kZSBmcyB0byByZWFkIHR3ZWFrIHNvdXJjZS4gTWFpblxuLy8gcmVhZHMgaXQgb24gdGhlIHJlbmRlcmVyJ3MgYmVoYWxmLiBQYXRoIG11c3QgbGl2ZSB1bmRlciB0d2Vha3NEaXIgZm9yXG4vLyBzZWN1cml0eSBcdTIwMTQgd2UgcmVmdXNlIGFueXRoaW5nIGVsc2UuXG5mdW5jdGlvbiByZWFkVHdlYWtTb3VyY2UoZW50cnlQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmUoZW50cnlQYXRoKTtcbiAgaWYgKCFpc1BhdGhJbnNpZGUoVFdFQUtTX0RJUiwgcmVzb2x2ZWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGF0aCBvdXRzaWRlIHR3ZWFrcyBkaXJcIik7XG4gIH1cbiAgcmV0dXJuIHJlcXVpcmUoXCJub2RlOmZzXCIpLnJlYWRGaWxlU3luYyhyZXNvbHZlZCwgXCJ1dGY4XCIpO1xufVxuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2VcIiwgKF9lLCBlbnRyeVBhdGg6IHN0cmluZykgPT4ge1xuICByZXR1cm4gcmVhZFR3ZWFrU291cmNlKGVudHJ5UGF0aCk7XG59KTtcblxuaXBjTWFpbi5vbihcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2Utc3luY1wiLCAoZXZlbnQsIGVudHJ5UGF0aDogc3RyaW5nKSA9PiB7XG4gIHRyeSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSB7IG9rOiB0cnVlLCBzb3VyY2U6IHJlYWRUd2Vha1NvdXJjZShlbnRyeVBhdGgpIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBlcnJvcjogU3RyaW5nKChlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3IpLFxuICAgIH07XG4gIH1cbn0pO1xuXG4vKipcbiAqIFJlYWQgYW4gYXJiaXRyYXJ5IGFzc2V0IGZpbGUgZnJvbSBpbnNpZGUgYSB0d2VhaydzIGRpcmVjdG9yeSBhbmQgcmV0dXJuIGl0XG4gKiBhcyBhIGBkYXRhOmAgVVJMLiBVc2VkIGJ5IHRoZSBzZXR0aW5ncyBpbmplY3RvciB0byByZW5kZXIgbWFuaWZlc3QgaWNvbnNcbiAqICh0aGUgcmVuZGVyZXIgaXMgc2FuZGJveGVkOyBgZmlsZTovL2Agd29uJ3QgbG9hZCkuXG4gKlxuICogU2VjdXJpdHk6IGNhbGxlciBwYXNzZXMgYHR3ZWFrRGlyYCBhbmQgYHJlbFBhdGhgOyB3ZSAoMSkgcmVxdWlyZSB0d2Vha0RpclxuICogdG8gbGl2ZSB1bmRlciBUV0VBS1NfRElSLCAoMikgcmVzb2x2ZSByZWxQYXRoIGFnYWluc3QgaXQgYW5kIHJlLWNoZWNrIHRoZVxuICogcmVzdWx0IHN0aWxsIGxpdmVzIHVuZGVyIFRXRUFLU19ESVIsICgzKSBjYXAgb3V0cHV0IHNpemUgYXQgMSBNaUIuXG4gKi9cbmNvbnN0IEFTU0VUX01BWF9CWVRFUyA9IDEwMjQgKiAxMDI0O1xuY29uc3QgTUlNRV9CWV9FWFQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwiLnBuZ1wiOiBcImltYWdlL3BuZ1wiLFxuICBcIi5qcGdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLmpwZWdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLmdpZlwiOiBcImltYWdlL2dpZlwiLFxuICBcIi53ZWJwXCI6IFwiaW1hZ2Uvd2VicFwiLFxuICBcIi5zdmdcIjogXCJpbWFnZS9zdmcreG1sXCIsXG4gIFwiLmljb1wiOiBcImltYWdlL3gtaWNvblwiLFxufTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6cmVhZC10d2Vhay1hc3NldFwiLFxuICAoX2UsIHR3ZWFrRGlyOiBzdHJpbmcsIHJlbFBhdGg6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGZzID0gcmVxdWlyZShcIm5vZGU6ZnNcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6ZnNcIik7XG4gICAgY29uc3QgZGlyID0gcmVzb2x2ZSh0d2Vha0Rpcik7XG4gICAgaWYgKCFpc1BhdGhJbnNpZGUoVFdFQUtTX0RJUiwgZGlyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwidHdlYWtEaXIgb3V0c2lkZSB0d2Vha3MgZGlyXCIpO1xuICAgIH1cbiAgICBjb25zdCBmdWxsID0gcmVzb2x2ZShkaXIsIHJlbFBhdGgpO1xuICAgIGlmICghaXNQYXRoSW5zaWRlKGRpciwgZnVsbCkgfHwgZnVsbCA9PT0gZGlyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIHRyYXZlcnNhbFwiKTtcbiAgICB9XG4gICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGwpO1xuICAgIGlmIChzdGF0LnNpemUgPiBBU1NFVF9NQVhfQllURVMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgYXNzZXQgdG9vIGxhcmdlICgke3N0YXQuc2l6ZX0gPiAke0FTU0VUX01BWF9CWVRFU30pYCk7XG4gICAgfVxuICAgIGNvbnN0IGV4dCA9IGZ1bGwuc2xpY2UoZnVsbC5sYXN0SW5kZXhPZihcIi5cIikpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgbWltZSA9IE1JTUVfQllfRVhUW2V4dF0gPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgICBjb25zdCBidWYgPSBmcy5yZWFkRmlsZVN5bmMoZnVsbCk7XG4gICAgcmV0dXJuIGBkYXRhOiR7bWltZX07YmFzZTY0LCR7YnVmLnRvU3RyaW5nKFwiYmFzZTY0XCIpfWA7XG4gIH0sXG4pO1xuXG4vLyBTYW5kYm94ZWQgcHJlbG9hZCBjYW4ndCB3cml0ZSBsb2dzIHRvIGRpc2s7IGZvcndhcmQgdG8gdXMgdmlhIElQQy5cbmlwY01haW4ub24oXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsIChfZSwgbGV2ZWw6IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIG1zZzogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGx2bCA9IGxldmVsID09PSBcImVycm9yXCIgfHwgbGV2ZWwgPT09IFwid2FyblwiID8gbGV2ZWwgOiBcImluZm9cIjtcbiAgdHJ5IHtcbiAgICBhcHBlbmRDYXBwZWRMb2coam9pbihMT0dfRElSLCBcInByZWxvYWQubG9nXCIpLCBgWyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfV0gWyR7bHZsfV0gJHttc2d9XFxuYCk7XG4gIH0gY2F0Y2gge31cbn0pO1xuXG4vLyBTYW5kYm94LXNhZmUgZmlsZXN5c3RlbSBvcHMgZm9yIHJlbmRlcmVyLXNjb3BlIHR3ZWFrcy4gRWFjaCB0d2VhayBnZXRzXG4vLyBhIHNhbmRib3hlZCBkaXIgdW5kZXIgdXNlclJvb3QvdHdlYWstZGF0YS88aWQ+LiBSZW5kZXJlciBzaWRlIGNhbGxzIHRoZXNlXG4vLyBvdmVyIElQQyBpbnN0ZWFkIG9mIHVzaW5nIE5vZGUgZnMgZGlyZWN0bHkuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6dHdlYWstZnNcIiwgKF9lLCBvcDogc3RyaW5nLCBpZDogc3RyaW5nLCBwOiBzdHJpbmcsIGM/OiBzdHJpbmcpID0+IHtcbiAgaWYgKCEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QoaWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgdHdlYWsgaWRcIik7XG4gIGNvbnN0IGRpciA9IGpvaW4odXNlclJvb3QhLCBcInR3ZWFrLWRhdGFcIiwgaWQpO1xuICBta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgZnVsbCA9IHJlc29sdmUoZGlyLCBwKTtcbiAgaWYgKCFpc1BhdGhJbnNpZGUoZGlyLCBmdWxsKSB8fCBmdWxsID09PSBkaXIpIHRocm93IG5ldyBFcnJvcihcInBhdGggdHJhdmVyc2FsXCIpO1xuICBjb25zdCBmcyA9IHJlcXVpcmUoXCJub2RlOmZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJub2RlOmZzXCIpO1xuICBzd2l0Y2ggKG9wKSB7XG4gICAgY2FzZSBcInJlYWRcIjogcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmdWxsLCBcInV0ZjhcIik7XG4gICAgY2FzZSBcIndyaXRlXCI6IHJldHVybiBmcy53cml0ZUZpbGVTeW5jKGZ1bGwsIGMgPz8gXCJcIiwgXCJ1dGY4XCIpO1xuICAgIGNhc2UgXCJleGlzdHNcIjogcmV0dXJuIGZzLmV4aXN0c1N5bmMoZnVsbCk7XG4gICAgY2FzZSBcImRhdGFEaXJcIjogcmV0dXJuIGRpcjtcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gb3A6ICR7b3B9YCk7XG4gIH1cbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6dXNlci1wYXRoc1wiLCAoKSA9PiAoe1xuICB1c2VyUm9vdCxcbiAgcnVudGltZURpcixcbiAgdHdlYWtzRGlyOiBUV0VBS1NfRElSLFxuICBsb2dEaXI6IExPR19ESVIsXG59KSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC1ydW50aW1lLWluZm9cIiwgKCkgPT4gY3VycmVudFJ1bnRpbWVJbmZvKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtY2FwYWJpbGl0aWVzXCIsICgpID0+IGN1cnJlbnRSdW50aW1lQ2FwYWJpbGl0aWVzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LWNkcC1zdGF0dXNcIiwgKCkgPT4gZ2V0Q2RwU3RhdHVzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LWNkcC10YXJnZXRzXCIsICgpID0+IGxpc3RDZHBUYXJnZXRzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS10ZXh0XCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucykgPT4ge1xuICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibW9kZWxcIik7XG4gICAgcmV0dXJuIGdlbmVyYXRlTW9kZWxUZXh0KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bW9kZWwtZ2VuZXJhdGUtb2JqZWN0XCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVPYmplY3RPcHRpb25zKSA9PiB7XG4gICAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgXCJtb2RlbFwiKTtcbiAgICByZXR1cm4gZ2VuZXJhdGVNb2RlbE9iamVjdCh0d2Vha0lkLCBvcHRpb25zKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCAoX2UsIG9wdHM6IENvZGV4Q3JlYXRlV2luZG93T3B0aW9ucykgPT4ge1xuICByZXR1cm4gY3JlYXRlQ29kZXhXaW5kb3cob3B0cyk7XG59KTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctcHJpbWFyeVwiLCAoKSA9PiBnZXRQcmltYXJ5Q29kZXhXaW5kb3dSZWYoKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWZvY3VzXCIsIChfZSwgd2luZG93SWQ6IG51bWJlcikgPT4gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1zaG93XCIsIChfZSwgd2luZG93SWQ6IG51bWJlcikgPT4gc2hvd0NvZGV4V2luZG93KHdpbmRvd0lkKSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOmNvZGV4LXZpZXctY3JlYXRlXCIsXG4gIGFzeW5jIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleFZpZXdDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgdHdlYWsgPSBhc3NlcnRUd2Vha1ZpZXdQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCk7XG4gICAgY29uc3QgcmVmID0gYXdhaXQgY3JlYXRlT3dsVmlldyh7IGlkOiB0d2Vhay5tYW5pZmVzdC5pZCwgZGlyOiB0d2Vhay5kaXIgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiByZWYuaWQsXG4gICAgICB3ZWJDb250ZW50c0lkOiByZWYud2ViQ29udGVudHNJZCxcbiAgICAgIHBhcmVudFdpbmRvd0lkOiByZWYucGFyZW50V2luZG93SWQsXG4gICAgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgdmlld0lkOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCBhcmc/OiB1bmtub3duLCBhcmcyPzogdW5rbm93bikgPT4ge1xuICAgIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkKTtcbiAgICByZXR1cm4gY2FsbE93bFZpZXcodHdlYWtJZCwgdmlld0lkLCBtZXRob2QsIGFyZywgYXJnMik7XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXZpZXctZGlzcG9zZS10d2Vha1wiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha0lkKHR3ZWFrSWQpO1xuICBkaXNwb3NlT3dsVmlld3NGb3JUd2Vhayh0d2Vha0lkKTtcbn0pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpuYXRpdmUtbG9hZC1tb2R1bGVcIixcbiAgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gbmF0aXZlQnJpZGdlLmxvYWRNb2R1bGUodHdlYWtDb250ZXh0KHR3ZWFrSWQsIFwibmF0aXZlLW1vZHVsZVwiKSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHsgaWQ6IHJlZi5pZCwga2luZDogcmVmLmtpbmQgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtcmVxdWVzdFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgbW9kdWxlSWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHBheWxvYWQ/OiB1bmtub3duLCB0aW1lb3V0TXM/OiBudW1iZXIpID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1tb2R1bGVcIik7XG4gICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5yZXF1ZXN0TW9kdWxlKHR3ZWFrSWQsIG1vZHVsZUlkLCBtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcyk7XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtZGlzcG9zZVwiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgbW9kdWxlSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1tb2R1bGVcIik7XG4gIHJldHVybiBuYXRpdmVCcmlkZ2UuZGlzcG9zZU1vZHVsZSh0d2Vha0lkLCBtb2R1bGVJZCk7XG59KTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpuYXRpdmUtZGlzcG9zZS10d2Vha1wiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha0lkKHR3ZWFrSWQpO1xuICBuYXRpdmVCcmlkZ2UuZGlzcG9zZVR3ZWFrKHR3ZWFrSWQpO1xufSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1jcmVhdGUtcGFuZWxcIixcbiAgYXN5bmMgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IHJlZiA9IGF3YWl0IG5hdGl2ZUJyaWRnZS5jcmVhdGVQYW5lbCh0d2Vha0NvbnRleHQodHdlYWtJZCwgXCJuYXRpdmUtdmlld1wiKSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHsgaWQ6IHJlZi5pZCwgd2luZG93SWQ6IHJlZi53aW5kb3dJZCB9O1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLWF0dGFjaC12aWV3XCIsXG4gIGFzeW5jIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IHJlZiA9IGF3YWl0IG5hdGl2ZUJyaWRnZS5hdHRhY2hWaWV3KHR3ZWFrQ29udGV4dCh0d2Vha0lkLCBcIm5hdGl2ZS12aWV3XCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkIH07XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLFxuICBhc3luYyAoX2UsIHR3ZWFrSWQ6IHN0cmluZywga2luZDogXCJwYW5lbFwiIHwgXCJ2aWV3XCIsIGluc3RhbmNlSWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIGFyZz86IHVua25vd24pID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS12aWV3XCIpO1xuICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuY2FsbEluc3RhbmNlKHR3ZWFrSWQsIGtpbmQsIGluc3RhbmNlSWQsIG1ldGhvZCwgYXJnKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1sYXVuY2gtaGVscGVyXCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gbmF0aXZlQnJpZGdlLmxhdW5jaEhlbHBlcih0d2Vha0NvbnRleHQodHdlYWtJZCwgXCJuYXRpdmUtaGVscGVyXCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkLCBwaWQ6IHJlZi5waWQgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgaGVscGVySWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHBheWxvYWQ/OiB1bmtub3duLCB0aW1lb3V0TXM/OiBudW1iZXIpID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1oZWxwZXJcIik7XG4gICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5jYWxsSGVscGVyKHR3ZWFrSWQsIGhlbHBlcklkLCBtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcyk7XG4gIH0sXG4pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmV2ZWFsXCIsIChfZSwgcDogc3RyaW5nKSA9PiB7XG4gIHNoZWxsLm9wZW5QYXRoKHApLmNhdGNoKCgpID0+IHt9KTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCAoX2UsIHVybDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsKTtcbiAgaWYgKHBhcnNlZC5wcm90b2NvbCAhPT0gXCJodHRwczpcIiB8fCBwYXJzZWQuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwib25seSBnaXRodWIuY29tIGxpbmtzIGNhbiBiZSBvcGVuZWQgZnJvbSB0d2VhayBtZXRhZGF0YVwiKTtcbiAgfVxuICBzaGVsbC5vcGVuRXh0ZXJuYWwocGFyc2VkLnRvU3RyaW5nKCkpLmNhdGNoKCgpID0+IHt9KTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29weS10ZXh0XCIsIChfZSwgdGV4dDogc3RyaW5nKSA9PiB7XG4gIGNsaXBib2FyZC53cml0ZVRleHQoU3RyaW5nKHRleHQpKTtcbiAgcmV0dXJuIHRydWU7XG59KTtcblxuLy8gTWFudWFsIGZvcmNlLXJlbG9hZCB0cmlnZ2VyIGZyb20gdGhlIHJlbmRlcmVyIChlLmcuIHRoZSBcIkZvcmNlIFJlbG9hZFwiXG4vLyBidXR0b24gb24gb3VyIGluamVjdGVkIFR3ZWFrcyBwYWdlKS4gQnlwYXNzZXMgdGhlIHdhdGNoZXIgZGVib3VuY2UuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmVsb2FkLXR3ZWFrc1wiLCAoKSA9PiB7XG4gIHJlbG9hZFR3ZWFrcyhcIm1hbnVhbFwiLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICByZXR1cm4geyBhdDogRGF0ZS5ub3coKSwgY291bnQ6IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5sZW5ndGggfTtcbn0pO1xuXG4vLyA0LiBGaWxlc3lzdGVtIHdhdGNoZXIgXHUyMTkyIGRlYm91bmNlZCByZWxvYWQgKyBicm9hZGNhc3QuXG4vLyAgICBXZSB3YXRjaCB0aGUgdHdlYWtzIGRpciBmb3IgYW55IGNoYW5nZS4gT24gdGhlIGZpcnN0IHRpY2sgb2YgaW5hY3Rpdml0eVxuLy8gICAgd2Ugc3RvcCBtYWluLXNpZGUgdHdlYWtzLCBjbGVhciB0aGVpciBjYWNoZWQgbW9kdWxlcywgcmUtZGlzY292ZXIsIHRoZW5cbi8vICAgIHJlc3RhcnQgYW5kIGJyb2FkY2FzdCBgY29kZXhwcDp0d2Vha3MtY2hhbmdlZGAgdG8gZXZlcnkgcmVuZGVyZXIgc28gaXRcbi8vICAgIGNhbiByZS1pbml0IGl0cyBob3N0LlxuY29uc3QgUkVMT0FEX0RFQk9VTkNFX01TID0gMjUwO1xubGV0IHJlbG9hZFRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuZnVuY3Rpb24gc2NoZWR1bGVSZWxvYWQocmVhc29uOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHJlbG9hZFRpbWVyKSBjbGVhclRpbWVvdXQocmVsb2FkVGltZXIpO1xuICByZWxvYWRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHJlbG9hZFRpbWVyID0gbnVsbDtcbiAgICByZWxvYWRUd2Vha3MocmVhc29uLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICB9LCBSRUxPQURfREVCT1VOQ0VfTVMpO1xufVxuXG50cnkge1xuICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goVFdFQUtTX0RJUiwge1xuICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgLy8gV2FpdCBmb3IgZmlsZXMgdG8gc2V0dGxlIGJlZm9yZSB0cmlnZ2VyaW5nIFx1MjAxNCBndWFyZHMgYWdhaW5zdCBwYXJ0aWFsbHlcbiAgICAvLyB3cml0dGVuIHR3ZWFrIGZpbGVzIGR1cmluZyBlZGl0b3Igc2F2ZXMgLyBnaXQgY2hlY2tvdXRzLlxuICAgIGF3YWl0V3JpdGVGaW5pc2g6IHsgc3RhYmlsaXR5VGhyZXNob2xkOiAxNTAsIHBvbGxJbnRlcnZhbDogNTAgfSxcbiAgICAvLyBBdm9pZCBlYXRpbmcgQ1BVIG9uIGh1Z2Ugbm9kZV9tb2R1bGVzIHRyZWVzIGluc2lkZSB0d2VhayBmb2xkZXJzLlxuICAgIGlnbm9yZWQ6IChwKSA9PiBwLmluY2x1ZGVzKGAke1RXRUFLU19ESVJ9L2ApICYmIC9cXC9ub2RlX21vZHVsZXNcXC8vLnRlc3QocCksXG4gIH0pO1xuICB3YXRjaGVyLm9uKFwiYWxsXCIsIChldmVudCwgcGF0aCkgPT4gc2NoZWR1bGVSZWxvYWQoYCR7ZXZlbnR9ICR7cGF0aH1gKSk7XG4gIHdhdGNoZXIub24oXCJlcnJvclwiLCAoZSkgPT4gbG9nKFwid2FyblwiLCBcIndhdGNoZXIgZXJyb3I6XCIsIGUpKTtcbiAgbG9nKFwiaW5mb1wiLCBcIndhdGNoaW5nXCIsIFRXRUFLU19ESVIpO1xuICBhcHAub24oXCJ3aWxsLXF1aXRcIiwgKCkgPT4gd2F0Y2hlci5jbG9zZSgpLmNhdGNoKCgpID0+IHt9KSk7XG59IGNhdGNoIChlKSB7XG4gIGxvZyhcImVycm9yXCIsIFwiZmFpbGVkIHRvIHN0YXJ0IHdhdGNoZXI6XCIsIGUpO1xufVxuXG4vLyAtLS0gaGVscGVycyAtLS1cblxuZnVuY3Rpb24gbG9hZEFsbE1haW5Ud2Vha3MoKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkID0gZGlzY292ZXJUd2Vha3MoVFdFQUtTX0RJUik7XG4gICAgbG9nKFxuICAgICAgXCJpbmZvXCIsXG4gICAgICBgZGlzY292ZXJlZCAke3R3ZWFrU3RhdGUuZGlzY292ZXJlZC5sZW5ndGh9IHR3ZWFrKHMpOmAsXG4gICAgICB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiB0Lm1hbmlmZXN0LmlkKS5qb2luKFwiLCBcIiksXG4gICAgKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcImVycm9yXCIsIFwidHdlYWsgZGlzY292ZXJ5IGZhaWxlZDpcIiwgZSk7XG4gICAgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkID0gW107XG4gIH1cblxuICBzeW5jTWNwU2VydmVyc0Zyb21FbmFibGVkVHdlYWtzKCk7XG5cbiAgZm9yIChjb25zdCB0IG9mIHR3ZWFrU3RhdGUuZGlzY292ZXJlZCkge1xuICAgIGlmICghaXNNYWluUHJvY2Vzc1R3ZWFrU2NvcGUodC5tYW5pZmVzdC5zY29wZSkpIGNvbnRpbnVlO1xuICAgIGlmICghaXNUd2Vha0VuYWJsZWQodC5tYW5pZmVzdC5pZCkpIHtcbiAgICAgIGxvZyhcImluZm9cIiwgYHNraXBwaW5nIGRpc2FibGVkIG1haW4gdHdlYWs6ICR7dC5tYW5pZmVzdC5pZH1gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgbW9kID0gcmVxdWlyZSh0LmVudHJ5KTtcbiAgICAgIGNvbnN0IHR3ZWFrID0gbW9kLmRlZmF1bHQgPz8gbW9kO1xuICAgICAgaWYgKHR5cGVvZiB0d2Vhaz8uc3RhcnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCBzdG9yYWdlID0gY3JlYXRlRGlza1N0b3JhZ2UodXNlclJvb3QhLCB0Lm1hbmlmZXN0LmlkKTtcbiAgICAgICAgdHdlYWsuc3RhcnQoe1xuICAgICAgICAgIG1hbmlmZXN0OiB0Lm1hbmlmZXN0LFxuICAgICAgICAgIHByb2Nlc3M6IFwibWFpblwiLFxuICAgICAgICAgIGxvZzogbWFrZUxvZ2dlcih0Lm1hbmlmZXN0LmlkKSxcbiAgICAgICAgICBzdG9yYWdlLFxuICAgICAgICAgIGJyaWRnZTogbWFrZU1haW5CcmlkZ2UoKSxcbiAgICAgICAgICBpcGM6IG1ha2VNYWluSXBjKHQubWFuaWZlc3QuaWQpLFxuICAgICAgICAgIGZzOiBtYWtlTWFpbkZzKHQubWFuaWZlc3QuaWQpLFxuICAgICAgICAgIG1vZGVsOiBtYWtlTW9kZWxBcGkodC5tYW5pZmVzdC5pZCksXG4gICAgICAgICAgY29kZXg6IG1ha2VDb2RleEFwaSh0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHR3ZWFrU3RhdGUubG9hZGVkTWFpbi5zZXQodC5tYW5pZmVzdC5pZCwge1xuICAgICAgICAgIHN0b3A6IHR3ZWFrLnN0b3AsXG4gICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGxvZyhcImluZm9cIiwgYHN0YXJ0ZWQgbWFpbiB0d2VhazogJHt0Lm1hbmlmZXN0LmlkfWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcImVycm9yXCIsIGB0d2VhayAke3QubWFuaWZlc3QuaWR9IGZhaWxlZCB0byBzdGFydDpgLCBlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3luY01jcFNlcnZlcnNGcm9tRW5hYmxlZFR3ZWFrcygpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBzeW5jTWFuYWdlZE1jcFNlcnZlcnMoe1xuICAgICAgY29uZmlnUGF0aDogQ09ERVhfQ09ORklHX0ZJTEUsXG4gICAgICB0d2Vha3M6IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5maWx0ZXIoKHQpID0+IGlzVHdlYWtFbmFibGVkKHQubWFuaWZlc3QuaWQpKSxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LmNoYW5nZWQpIHtcbiAgICAgIGxvZyhcImluZm9cIiwgYHN5bmNlZCBDb2RleCBNQ1AgY29uZmlnOiAke3Jlc3VsdC5zZXJ2ZXJOYW1lcy5qb2luKFwiLCBcIikgfHwgXCJub25lXCJ9YCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc2tpcHBlZFNlcnZlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGxvZyhcbiAgICAgICAgXCJpbmZvXCIsXG4gICAgICAgIGBza2lwcGVkIENvZGV4KysgbWFuYWdlZCBNQ1Agc2VydmVyKHMpIGFscmVhZHkgY29uZmlndXJlZCBieSB1c2VyOiAke3Jlc3VsdC5za2lwcGVkU2VydmVyTmFtZXMuam9pbihcIiwgXCIpfWAsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJmYWlsZWQgdG8gc3luYyBDb2RleCBNQ1AgY29uZmlnOlwiLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdG9wQWxsTWFpblR3ZWFrcygpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbaWQsIHRdIG9mIHR3ZWFrU3RhdGUubG9hZGVkTWFpbikge1xuICAgIHRyeSB7XG4gICAgICB0LnN0b3A/LigpO1xuICAgICAgdC5zdG9yYWdlLmZsdXNoKCk7XG4gICAgICBsb2coXCJpbmZvXCIsIGBzdG9wcGVkIG1haW4gdHdlYWs6ICR7aWR9YCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBgc3RvcCBmYWlsZWQgZm9yICR7aWR9OmAsIGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBuYXRpdmVCcmlkZ2UuZGlzcG9zZVR3ZWFrKGlkKTtcbiAgICAgIGRpc3Bvc2VPd2xWaWV3c0ZvclR3ZWFrKGlkKTtcbiAgICB9XG4gIH1cbiAgdHdlYWtTdGF0ZS5sb2FkZWRNYWluLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyVHdlYWtNb2R1bGVDYWNoZSgpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFNldCA9IG5ldyBTZXQ8c3RyaW5nPihbVFdFQUtTX0RJUiwgc2FmZVJlYWxwYXRoKFRXRUFLU19ESVIpXSk7XG4gIGNvbnN0IGVudHJ5U2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdHdlYWsgb2YgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkKSB7XG4gICAgcm9vdFNldC5hZGQodHdlYWsuZGlyKTtcbiAgICByb290U2V0LmFkZChzYWZlUmVhbHBhdGgodHdlYWsuZGlyKSk7XG4gICAgZW50cnlTZXQuYWRkKHR3ZWFrLmVudHJ5KTtcbiAgICBlbnRyeVNldC5hZGQoc2FmZVJlYWxwYXRoKHR3ZWFrLmVudHJ5KSk7XG4gIH1cblxuICBjb25zdCByb290cyA9IFsuLi5yb290U2V0XTtcbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmVxdWlyZS5jYWNoZSkpIHtcbiAgICBjb25zdCByZWFsS2V5ID0gc2FmZVJlYWxwYXRoKGtleSk7XG4gICAgY29uc3QgaXNUd2Vha01vZHVsZSA9XG4gICAgICBlbnRyeVNldC5oYXMoa2V5KSB8fFxuICAgICAgZW50cnlTZXQuaGFzKHJlYWxLZXkpIHx8XG4gICAgICByb290cy5zb21lKChyb290KSA9PiBpc1BhdGhJbnNpZGUocm9vdCwga2V5KSB8fCBpc1BhdGhJbnNpZGUocm9vdCwgcmVhbEtleSkpO1xuICAgIGlmIChpc1R3ZWFrTW9kdWxlKSBkZWxldGUgcmVxdWlyZS5jYWNoZVtrZXldO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVSZWFscGF0aChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVhbHBhdGhTeW5jKGZpbGVQYXRoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG59XG5cbmNvbnN0IFVQREFURV9DSEVDS19JTlRFUlZBTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5hc3luYyBmdW5jdGlvbiBlbnN1cmVDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2soZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8Q29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrPiB7XG4gIGNvbnN0IHN0YXRlID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGNhY2hlZCA9IHN0YXRlLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoZWNrO1xuICBjb25zdCBjaGFubmVsID0gc3RhdGUuY29kZXhQbHVzUGx1cz8udXBkYXRlQ2hhbm5lbCA/PyBcInN0YWJsZVwiO1xuICBjb25zdCByZXBvID0gc3RhdGUuY29kZXhQbHVzUGx1cz8udXBkYXRlUmVwbyA/PyBDT0RFWF9QTFVTUExVU19SRVBPO1xuICBpZiAoXG4gICAgIWZvcmNlICYmXG4gICAgY2FjaGVkICYmXG4gICAgY2FjaGVkLmN1cnJlbnRWZXJzaW9uID09PSBDT0RFWF9QTFVTUExVU19WRVJTSU9OICYmXG4gICAgRGF0ZS5ub3coKSAtIERhdGUucGFyc2UoY2FjaGVkLmNoZWNrZWRBdCkgPCBVUERBVEVfQ0hFQ0tfSU5URVJWQUxfTVNcbiAgKSB7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfVxuXG4gIGNvbnN0IHJlbGVhc2UgPSBhd2FpdCBmZXRjaExhdGVzdFJlbGVhc2UocmVwbywgQ09ERVhfUExVU1BMVVNfVkVSU0lPTiwgY2hhbm5lbCA9PT0gXCJwcmVyZWxlYXNlXCIpO1xuICBjb25zdCBsYXRlc3RWZXJzaW9uID0gcmVsZWFzZS5sYXRlc3RUYWcgPyBub3JtYWxpemVWZXJzaW9uKHJlbGVhc2UubGF0ZXN0VGFnKSA6IG51bGw7XG4gIGNvbnN0IGNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgPSB7XG4gICAgY2hlY2tlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgY3VycmVudFZlcnNpb246IENPREVYX1BMVVNQTFVTX1ZFUlNJT04sXG4gICAgbGF0ZXN0VmVyc2lvbixcbiAgICByZWxlYXNlVXJsOiByZWxlYXNlLnJlbGVhc2VVcmwgPz8gYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99L3JlbGVhc2VzYCxcbiAgICByZWxlYXNlTm90ZXM6IHJlbGVhc2UucmVsZWFzZU5vdGVzLFxuICAgIHVwZGF0ZUF2YWlsYWJsZTogbGF0ZXN0VmVyc2lvblxuICAgICAgPyBjb21wYXJlVmVyc2lvbnMobm9ybWFsaXplVmVyc2lvbihsYXRlc3RWZXJzaW9uKSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTikgPiAwXG4gICAgICA6IGZhbHNlLFxuICAgIC4uLihyZWxlYXNlLmVycm9yID8geyBlcnJvcjogcmVsZWFzZS5lcnJvciB9IDoge30pLFxuICB9O1xuICBzdGF0ZS5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgc3RhdGUuY29kZXhQbHVzUGx1cy51cGRhdGVDaGVjayA9IGNoZWNrO1xuICB3cml0ZVN0YXRlKHN0YXRlKTtcbiAgcmV0dXJuIGNoZWNrO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVUd2Vha1VwZGF0ZUNoZWNrKHQ6IERpc2NvdmVyZWRUd2Vhayk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpZCA9IHQubWFuaWZlc3QuaWQ7XG4gIGNvbnN0IHJlcG8gPSB0Lm1hbmlmZXN0LmdpdGh1YlJlcG87XG4gIGNvbnN0IHN0YXRlID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGNhY2hlZCA9IHN0YXRlLnR3ZWFrVXBkYXRlQ2hlY2tzPy5baWRdO1xuICBpZiAoXG4gICAgY2FjaGVkICYmXG4gICAgY2FjaGVkLnJlcG8gPT09IHJlcG8gJiZcbiAgICBjYWNoZWQuY3VycmVudFZlcnNpb24gPT09IHQubWFuaWZlc3QudmVyc2lvbiAmJlxuICAgIERhdGUubm93KCkgLSBEYXRlLnBhcnNlKGNhY2hlZC5jaGVja2VkQXQpIDwgVVBEQVRFX0NIRUNLX0lOVEVSVkFMX01TXG4gICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5leHQgPSBhd2FpdCBmZXRjaExhdGVzdFJlbGVhc2UocmVwbywgdC5tYW5pZmVzdC52ZXJzaW9uKTtcbiAgY29uc3QgbGF0ZXN0VmVyc2lvbiA9IG5leHQubGF0ZXN0VGFnID8gbm9ybWFsaXplVmVyc2lvbihuZXh0LmxhdGVzdFRhZykgOiBudWxsO1xuICBjb25zdCBjaGVjazogVHdlYWtVcGRhdGVDaGVjayA9IHtcbiAgICBjaGVja2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICByZXBvLFxuICAgIGN1cnJlbnRWZXJzaW9uOiB0Lm1hbmlmZXN0LnZlcnNpb24sXG4gICAgbGF0ZXN0VmVyc2lvbixcbiAgICBsYXRlc3RUYWc6IG5leHQubGF0ZXN0VGFnLFxuICAgIHJlbGVhc2VVcmw6IG5leHQucmVsZWFzZVVybCxcbiAgICB1cGRhdGVBdmFpbGFibGU6IGxhdGVzdFZlcnNpb25cbiAgICAgID8gY29tcGFyZVZlcnNpb25zKGxhdGVzdFZlcnNpb24sIG5vcm1hbGl6ZVZlcnNpb24odC5tYW5pZmVzdC52ZXJzaW9uKSkgPiAwXG4gICAgICA6IGZhbHNlLFxuICAgIC4uLihuZXh0LmVycm9yID8geyBlcnJvcjogbmV4dC5lcnJvciB9IDoge30pLFxuICB9O1xuICBzdGF0ZS50d2Vha1VwZGF0ZUNoZWNrcyA/Pz0ge307XG4gIHN0YXRlLnR3ZWFrVXBkYXRlQ2hlY2tzW2lkXSA9IGNoZWNrO1xuICB3cml0ZVN0YXRlKHN0YXRlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hMYXRlc3RSZWxlYXNlKFxuICByZXBvOiBzdHJpbmcsXG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4gIGluY2x1ZGVQcmVyZWxlYXNlID0gZmFsc2UsXG4pOiBQcm9taXNlPHsgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsOyByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsOyByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgODAwMCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVuZHBvaW50ID0gaW5jbHVkZVByZXJlbGVhc2UgPyBcInJlbGVhc2VzP3Blcl9wYWdlPTIwXCIgOiBcInJlbGVhc2VzL2xhdGVzdFwiO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfS8ke2VuZHBvaW50fWAsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vdm5kLmdpdGh1Yitqc29uXCIsXG4gICAgICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke2N1cnJlbnRWZXJzaW9ufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICB9KTtcbiAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIHsgbGF0ZXN0VGFnOiBudWxsLCByZWxlYXNlVXJsOiBudWxsLCByZWxlYXNlTm90ZXM6IG51bGwsIGVycm9yOiBcIm5vIEdpdEh1YiByZWxlYXNlIGZvdW5kXCIgfTtcbiAgICAgIH1cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHJldHVybiB7IGxhdGVzdFRhZzogbnVsbCwgcmVsZWFzZVVybDogbnVsbCwgcmVsZWFzZU5vdGVzOiBudWxsLCBlcnJvcjogYEdpdEh1YiByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCB9O1xuICAgICAgfVxuICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCkgYXMgeyB0YWdfbmFtZT86IHN0cmluZzsgaHRtbF91cmw/OiBzdHJpbmc7IGJvZHk/OiBzdHJpbmc7IGRyYWZ0PzogYm9vbGVhbiB9IHwgQXJyYXk8eyB0YWdfbmFtZT86IHN0cmluZzsgaHRtbF91cmw/OiBzdHJpbmc7IGJvZHk/OiBzdHJpbmc7IGRyYWZ0PzogYm9vbGVhbiB9PjtcbiAgICAgIGNvbnN0IGJvZHkgPSBBcnJheS5pc0FycmF5KGpzb24pID8ganNvbi5maW5kKChyZWxlYXNlKSA9PiAhcmVsZWFzZS5kcmFmdCkgOiBqc29uO1xuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIHJldHVybiB7IGxhdGVzdFRhZzogbnVsbCwgcmVsZWFzZVVybDogbnVsbCwgcmVsZWFzZU5vdGVzOiBudWxsLCBlcnJvcjogXCJubyBHaXRIdWIgcmVsZWFzZSBmb3VuZFwiIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXRlc3RUYWc6IGJvZHkudGFnX25hbWUgPz8gbnVsbCxcbiAgICAgICAgcmVsZWFzZVVybDogYm9keS5odG1sX3VybCA/PyBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb30vcmVsZWFzZXNgLFxuICAgICAgICByZWxlYXNlTm90ZXM6IGJvZHkuYm9keSA/PyBudWxsLFxuICAgICAgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB7XG4gICAgICBsYXRlc3RUYWc6IG51bGwsXG4gICAgICByZWxlYXNlVXJsOiBudWxsLFxuICAgICAgcmVsZWFzZU5vdGVzOiBudWxsLFxuICAgICAgZXJyb3I6IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICB9O1xuICB9XG59XG5cbmludGVyZmFjZSBUd2Vha1N0b3JlRmV0Y2hSZXN1bHQge1xuICByZWdpc3RyeTogVHdlYWtTdG9yZVJlZ2lzdHJ5O1xuICBmZXRjaGVkQXQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFN0b3JlSW5zdGFsbE1ldGFkYXRhIHtcbiAgcmVwbzogc3RyaW5nO1xuICBhcHByb3ZlZENvbW1pdFNoYTogc3RyaW5nO1xuICBpbnN0YWxsZWRBdDogc3RyaW5nO1xuICBzdG9yZUluZGV4VXJsOiBzdHJpbmc7XG4gIGZpbGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuY2xhc3MgU3RvcmVUd2Vha01vZGlmaWVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHR3ZWFrTmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBgJHt0d2Vha05hbWV9IGhhcyBsb2NhbCBzb3VyY2UgY2hhbmdlcywgc28gQ29kZXgrKyBjYW4ndCBhdXRvLXVwZGF0ZSBpdC4gUmV2ZXJ0IHlvdXIgbG9jYWwgY2hhbmdlcyBvciByZWluc3RhbGwgdGhlIHR3ZWFrIG1hbnVhbGx5LmAsXG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSBcIlN0b3JlVHdlYWtNb2RpZmllZEVycm9yXCI7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hUd2Vha1N0b3JlUmVnaXN0cnkoKTogUHJvbWlzZTxUd2Vha1N0b3JlRmV0Y2hSZXN1bHQ+IHtcbiAgY29uc3QgZmV0Y2hlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA4MDAwKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goVFdFQUtfU1RPUkVfSU5ERVhfVVJMLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Q09ERVhfUExVU1BMVVNfVkVSU0lPTn1gLFxuICAgICAgICB9LFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBzdG9yZSByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWdpc3RyeTogbm9ybWFsaXplU3RvcmVSZWdpc3RyeShhd2FpdCByZXMuanNvbigpKSxcbiAgICAgICAgZmV0Y2hlZEF0LFxuICAgICAgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnN0IGVycm9yID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpO1xuICAgIGxvZyhcIndhcm5cIiwgXCJmYWlsZWQgdG8gZmV0Y2ggdHdlYWsgc3RvcmUgcmVnaXN0cnk6XCIsIGVycm9yLm1lc3NhZ2UpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTdG9yZVR3ZWFrKGVudHJ5OiBUd2Vha1N0b3JlRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdXJsID0gc3RvcmVBcmNoaXZlVXJsKGVudHJ5KTtcbiAgY29uc3Qgd29yayA9IG1rZHRlbXBTeW5jKGpvaW4odG1wZGlyKCksIFwiY29kZXhwcC1zdG9yZS10d2Vhay1cIikpO1xuICBjb25zdCBhcmNoaXZlID0gam9pbih3b3JrLCBcInNvdXJjZS50YXIuZ3pcIik7XG4gIGNvbnN0IGV4dHJhY3REaXIgPSBqb2luKHdvcmssIFwiZXh0cmFjdFwiKTtcbiAgY29uc3QgdGFyZ2V0ID0gam9pbihUV0VBS1NfRElSLCBlbnRyeS5pZCk7XG4gIGNvbnN0IHN0YWdlZFRhcmdldCA9IGpvaW4od29yaywgXCJzdGFnZWRcIiwgZW50cnkuaWQpO1xuXG4gIHRyeSB7XG4gICAgbG9nKFwiaW5mb1wiLCBgaW5zdGFsbGluZyBzdG9yZSB0d2VhayAke2VudHJ5LmlkfSBmcm9tICR7ZW50cnkucmVwb31AJHtlbnRyeS5hcHByb3ZlZENvbW1pdFNoYX1gKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCB9LFxuICAgICAgcmVkaXJlY3Q6IFwiZm9sbG93XCIsXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgZG93bmxvYWQgZmFpbGVkOiAke3Jlcy5zdGF0dXN9YCk7XG4gICAgY29uc3QgYnl0ZXMgPSBCdWZmZXIuZnJvbShhd2FpdCByZXMuYXJyYXlCdWZmZXIoKSk7XG4gICAgd3JpdGVGaWxlU3luYyhhcmNoaXZlLCBieXRlcyk7XG4gICAgbWtkaXJTeW5jKGV4dHJhY3REaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGV4dHJhY3RUYXJBcmNoaXZlKGFyY2hpdmUsIGV4dHJhY3REaXIpO1xuICAgIGNvbnN0IHNvdXJjZSA9IGZpbmRUd2Vha1Jvb3QoZXh0cmFjdERpcik7XG4gICAgaWYgKCFzb3VyY2UpIHRocm93IG5ldyBFcnJvcihcImRvd25sb2FkZWQgYXJjaGl2ZSBkaWQgbm90IGNvbnRhaW4gbWFuaWZlc3QuanNvblwiKTtcbiAgICB2YWxpZGF0ZVN0b3JlVHdlYWtTb3VyY2UoZW50cnksIHNvdXJjZSk7XG4gICAgcm1TeW5jKHN0YWdlZFRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgIGNvcHlUd2Vha1NvdXJjZShzb3VyY2UsIHN0YWdlZFRhcmdldCk7XG4gICAgY29uc3Qgc3RhZ2VkRmlsZXMgPSBoYXNoVHdlYWtTb3VyY2Uoc3RhZ2VkVGFyZ2V0KTtcbiAgICB3cml0ZUZpbGVTeW5jKFxuICAgICAgam9pbihzdGFnZWRUYXJnZXQsIFwiLmNvZGV4cHAtc3RvcmUuanNvblwiKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbzogZW50cnkucmVwbyxcbiAgICAgICAgICBhcHByb3ZlZENvbW1pdFNoYTogZW50cnkuYXBwcm92ZWRDb21taXRTaGEsXG4gICAgICAgICAgaW5zdGFsbGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBzdG9yZUluZGV4VXJsOiBUV0VBS19TVE9SRV9JTkRFWF9VUkwsXG4gICAgICAgICAgZmlsZXM6IHN0YWdlZEZpbGVzLFxuICAgICAgICB9LFxuICAgICAgICBudWxsLFxuICAgICAgICAyLFxuICAgICAgKSxcbiAgICApO1xuICAgIGF3YWl0IGFzc2VydFN0b3JlVHdlYWtDbGVhbkZvckF1dG9VcGRhdGUoZW50cnksIHRhcmdldCwgd29yayk7XG4gICAgcm1TeW5jKHRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgIGNwU3luYyhzdGFnZWRUYXJnZXQsIHRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgcm1TeW5jKHdvcmssIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlVHdlYWtTdG9yZVN1Ym1pc3Npb24ocmVwb0lucHV0OiBzdHJpbmcpOiBQcm9taXNlPFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbj4ge1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhyZXBvSW5wdXQpO1xuICBjb25zdCByZXBvSW5mbyA9IGF3YWl0IGZldGNoR2l0aHViSnNvbjx7IGRlZmF1bHRfYnJhbmNoPzogc3RyaW5nIH0+KGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gKTtcbiAgY29uc3QgZGVmYXVsdEJyYW5jaCA9IHJlcG9JbmZvLmRlZmF1bHRfYnJhbmNoO1xuICBpZiAoIWRlZmF1bHRCcmFuY2gpIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlc29sdmUgZGVmYXVsdCBicmFuY2ggZm9yICR7cmVwb31gKTtcblxuICBjb25zdCBjb21taXQgPSBhd2FpdCBmZXRjaEdpdGh1Ykpzb248e1xuICAgIHNoYT86IHN0cmluZztcbiAgICBodG1sX3VybD86IHN0cmluZztcbiAgfT4oYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfS9jb21taXRzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGRlZmF1bHRCcmFuY2gpfWApO1xuICBpZiAoIWNvbW1pdC5zaGEpIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlc29sdmUgY3VycmVudCBjb21taXQgZm9yICR7cmVwb31gKTtcblxuICBjb25zdCBtYW5pZmVzdCA9IGF3YWl0IGZldGNoTWFuaWZlc3RBdENvbW1pdChyZXBvLCBjb21taXQuc2hhKS5jYXRjaCgoZSkgPT4ge1xuICAgIGxvZyhcIndhcm5cIiwgYGNvdWxkIG5vdCByZWFkIG1hbmlmZXN0IGZvciBzdG9yZSBzdWJtaXNzaW9uICR7cmVwb31AJHtjb21taXQuc2hhfTpgLCBlKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHJlcG8sXG4gICAgZGVmYXVsdEJyYW5jaCxcbiAgICBjb21taXRTaGE6IGNvbW1pdC5zaGEsXG4gICAgY29tbWl0VXJsOiBjb21taXQuaHRtbF91cmwgPz8gYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99L2NvbW1pdC8ke2NvbW1pdC5zaGF9YCxcbiAgICBtYW5pZmVzdDogbWFuaWZlc3RcbiAgICAgID8ge1xuICAgICAgICAgIGlkOiB0eXBlb2YgbWFuaWZlc3QuaWQgPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC5pZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBuYW1lOiB0eXBlb2YgbWFuaWZlc3QubmFtZSA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0Lm5hbWUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdmVyc2lvbjogdHlwZW9mIG1hbmlmZXN0LnZlcnNpb24gPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC52ZXJzaW9uIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiB0eXBlb2YgbWFuaWZlc3QuZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC5kZXNjcmlwdGlvbiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBpY29uVXJsOiB0eXBlb2YgbWFuaWZlc3QuaWNvblVybCA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0Lmljb25VcmwgOiB1bmRlZmluZWQsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEdpdGh1Ykpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA4MDAwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi92bmQuZ2l0aHViK2pzb25cIixcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCxcbiAgICAgIH0sXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEdpdEh1YiByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgcmV0dXJuIGF3YWl0IHJlcy5qc29uKCkgYXMgVDtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hNYW5pZmVzdEF0Q29tbWl0KHJlcG86IHN0cmluZywgY29tbWl0U2hhOiBzdHJpbmcpOiBQcm9taXNlPFBhcnRpYWw8VHdlYWtNYW5pZmVzdD4+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS8ke3JlcG99LyR7Y29tbWl0U2hhfS9tYW5pZmVzdC5qc29uYCwge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCxcbiAgICB9LFxuICB9KTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgbWFuaWZlc3QgZmV0Y2ggcmV0dXJuZWQgJHtyZXMuc3RhdHVzfWApO1xuICByZXR1cm4gYXdhaXQgcmVzLmpzb24oKSBhcyBQYXJ0aWFsPFR3ZWFrTWFuaWZlc3Q+O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0VGFyQXJjaGl2ZShhcmNoaXZlOiBzdHJpbmcsIHRhcmdldERpcjogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHJlc3VsdCA9IHNwYXduU3luYyhcInRhclwiLCBbXCIteHpmXCIsIGFyY2hpdmUsIFwiLUNcIiwgdGFyZ2V0RGlyXSwge1xuICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gIH0pO1xuICBpZiAocmVzdWx0LnN0YXR1cyAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgdGFyIGV4dHJhY3Rpb24gZmFpbGVkOiAke3Jlc3VsdC5zdGRlcnIgfHwgcmVzdWx0LnN0ZG91dCB8fCByZXN1bHQuc3RhdHVzfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlU3RvcmVUd2Vha1NvdXJjZShlbnRyeTogVHdlYWtTdG9yZUVudHJ5LCBzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBtYW5pZmVzdFBhdGggPSBqb2luKHNvdXJjZSwgXCJtYW5pZmVzdC5qc29uXCIpO1xuICBjb25zdCBtYW5pZmVzdCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1hbmlmZXN0UGF0aCwgXCJ1dGY4XCIpKSBhcyBUd2Vha01hbmlmZXN0O1xuICBpZiAobWFuaWZlc3QuaWQgIT09IGVudHJ5Lm1hbmlmZXN0LmlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBkb3dubG9hZGVkIHR3ZWFrIGlkICR7bWFuaWZlc3QuaWR9IGRvZXMgbm90IG1hdGNoIGFwcHJvdmVkIGlkICR7ZW50cnkubWFuaWZlc3QuaWR9YCk7XG4gIH1cbiAgaWYgKG1hbmlmZXN0LmdpdGh1YlJlcG8gIT09IGVudHJ5LnJlcG8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGRvd25sb2FkZWQgdHdlYWsgcmVwbyAke21hbmlmZXN0LmdpdGh1YlJlcG99IGRvZXMgbm90IG1hdGNoIGFwcHJvdmVkIHJlcG8gJHtlbnRyeS5yZXBvfWApO1xuICB9XG4gIGlmIChtYW5pZmVzdC52ZXJzaW9uICE9PSBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBkb3dubG9hZGVkIHR3ZWFrIHZlcnNpb24gJHttYW5pZmVzdC52ZXJzaW9ufSBkb2VzIG5vdCBtYXRjaCBhcHByb3ZlZCB2ZXJzaW9uICR7ZW50cnkubWFuaWZlc3QudmVyc2lvbn1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kVHdlYWtSb290KGRpcjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghZXhpc3RzU3luYyhkaXIpKSByZXR1cm4gbnVsbDtcbiAgaWYgKGV4aXN0c1N5bmMoam9pbihkaXIsIFwibWFuaWZlc3QuanNvblwiKSkpIHJldHVybiBkaXI7XG4gIGZvciAoY29uc3QgbmFtZSBvZiByZWFkZGlyU3luYyhkaXIpKSB7XG4gICAgY29uc3QgY2hpbGQgPSBqb2luKGRpciwgbmFtZSk7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghc3RhdFN5bmMoY2hpbGQpLmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGZvdW5kID0gZmluZFR3ZWFrUm9vdChjaGlsZCk7XG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvcHlUd2Vha1NvdXJjZShzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY3BTeW5jKHNvdXJjZSwgdGFyZ2V0LCB7XG4gICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgIGZpbHRlcjogKHNyYykgPT4gIS8oXnxbL1xcXFxdKSg/OlxcLmdpdHxub2RlX21vZHVsZXMpKD86Wy9cXFxcXXwkKS8udGVzdChzcmMpLFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0U3RvcmVUd2Vha0NsZWFuRm9yQXV0b1VwZGF0ZShcbiAgZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSxcbiAgdGFyZ2V0OiBzdHJpbmcsXG4gIHdvcms6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWV4aXN0c1N5bmModGFyZ2V0KSkgcmV0dXJuO1xuICBjb25zdCBtZXRhZGF0YSA9IHJlYWRTdG9yZUluc3RhbGxNZXRhZGF0YSh0YXJnZXQpO1xuICBpZiAoIW1ldGFkYXRhKSByZXR1cm47XG4gIGlmIChtZXRhZGF0YS5yZXBvICE9PSBlbnRyeS5yZXBvKSB7XG4gICAgdGhyb3cgbmV3IFN0b3JlVHdlYWtNb2RpZmllZEVycm9yKGVudHJ5Lm1hbmlmZXN0Lm5hbWUpO1xuICB9XG4gIGNvbnN0IGN1cnJlbnRGaWxlcyA9IGhhc2hUd2Vha1NvdXJjZSh0YXJnZXQpO1xuICBjb25zdCBiYXNlbGluZUZpbGVzID0gbWV0YWRhdGEuZmlsZXMgPz8gYXdhaXQgZmV0Y2hCYXNlbGluZVN0b3JlVHdlYWtIYXNoZXMobWV0YWRhdGEsIHdvcmspO1xuICBpZiAoIXNhbWVGaWxlSGFzaGVzKGN1cnJlbnRGaWxlcywgYmFzZWxpbmVGaWxlcykpIHtcbiAgICB0aHJvdyBuZXcgU3RvcmVUd2Vha01vZGlmaWVkRXJyb3IoZW50cnkubWFuaWZlc3QubmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFN0b3JlSW5zdGFsbE1ldGFkYXRhKHRhcmdldDogc3RyaW5nKTogU3RvcmVJbnN0YWxsTWV0YWRhdGEgfCBudWxsIHtcbiAgY29uc3QgbWV0YWRhdGFQYXRoID0gam9pbih0YXJnZXQsIFwiLmNvZGV4cHAtc3RvcmUuanNvblwiKTtcbiAgaWYgKCFleGlzdHNTeW5jKG1ldGFkYXRhUGF0aCkpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1ldGFkYXRhUGF0aCwgXCJ1dGY4XCIpKSBhcyBQYXJ0aWFsPFN0b3JlSW5zdGFsbE1ldGFkYXRhPjtcbiAgICBpZiAodHlwZW9mIHBhcnNlZC5yZXBvICE9PSBcInN0cmluZ1wiIHx8IHR5cGVvZiBwYXJzZWQuYXBwcm92ZWRDb21taXRTaGEgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICByZXBvOiBwYXJzZWQucmVwbyxcbiAgICAgIGFwcHJvdmVkQ29tbWl0U2hhOiBwYXJzZWQuYXBwcm92ZWRDb21taXRTaGEsXG4gICAgICBpbnN0YWxsZWRBdDogdHlwZW9mIHBhcnNlZC5pbnN0YWxsZWRBdCA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlZC5pbnN0YWxsZWRBdCA6IFwiXCIsXG4gICAgICBzdG9yZUluZGV4VXJsOiB0eXBlb2YgcGFyc2VkLnN0b3JlSW5kZXhVcmwgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuc3RvcmVJbmRleFVybCA6IFwiXCIsXG4gICAgICBmaWxlczogaXNIYXNoUmVjb3JkKHBhcnNlZC5maWxlcykgPyBwYXJzZWQuZmlsZXMgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hCYXNlbGluZVN0b3JlVHdlYWtIYXNoZXMoXG4gIG1ldGFkYXRhOiBTdG9yZUluc3RhbGxNZXRhZGF0YSxcbiAgd29yazogc3RyaW5nLFxuKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiB7XG4gIGNvbnN0IGJhc2VsaW5lRGlyID0gam9pbih3b3JrLCBcImJhc2VsaW5lXCIpO1xuICBjb25zdCBhcmNoaXZlID0gam9pbih3b3JrLCBcImJhc2VsaW5lLnRhci5nelwiKTtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vY29kZWxvYWQuZ2l0aHViLmNvbS8ke21ldGFkYXRhLnJlcG99L3Rhci5nei8ke21ldGFkYXRhLmFwcHJvdmVkQ29tbWl0U2hhfWAsIHtcbiAgICBoZWFkZXJzOiB7IFwiVXNlci1BZ2VudFwiOiBgY29kZXgtcGx1c3BsdXMvJHtDT0RFWF9QTFVTUExVU19WRVJTSU9OfWAgfSxcbiAgICByZWRpcmVjdDogXCJmb2xsb3dcIixcbiAgfSk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCB2ZXJpZnkgbG9jYWwgdHdlYWsgY2hhbmdlcyBiZWZvcmUgdXBkYXRlOiAke3Jlcy5zdGF0dXN9YCk7XG4gIHdyaXRlRmlsZVN5bmMoYXJjaGl2ZSwgQnVmZmVyLmZyb20oYXdhaXQgcmVzLmFycmF5QnVmZmVyKCkpKTtcbiAgbWtkaXJTeW5jKGJhc2VsaW5lRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgZXh0cmFjdFRhckFyY2hpdmUoYXJjaGl2ZSwgYmFzZWxpbmVEaXIpO1xuICBjb25zdCBzb3VyY2UgPSBmaW5kVHdlYWtSb290KGJhc2VsaW5lRGlyKTtcbiAgaWYgKCFzb3VyY2UpIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCB2ZXJpZnkgbG9jYWwgdHdlYWsgY2hhbmdlcyBiZWZvcmUgdXBkYXRlOiBiYXNlbGluZSBtYW5pZmVzdCBtaXNzaW5nXCIpO1xuICByZXR1cm4gaGFzaFR3ZWFrU291cmNlKHNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIGhhc2hUd2Vha1NvdXJjZShyb290OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbGxlY3RUd2Vha0ZpbGVIYXNoZXMocm9vdCwgcm9vdCwgb3V0KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdFR3ZWFrRmlsZUhhc2hlcyhyb290OiBzdHJpbmcsIGRpcjogc3RyaW5nLCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBuYW1lIG9mIHJlYWRkaXJTeW5jKGRpcikuc29ydCgpKSB7XG4gICAgaWYgKG5hbWUgPT09IFwiLmdpdFwiIHx8IG5hbWUgPT09IFwibm9kZV9tb2R1bGVzXCIgfHwgbmFtZSA9PT0gXCIuY29kZXhwcC1zdG9yZS5qc29uXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGZ1bGwgPSBqb2luKGRpciwgbmFtZSk7XG4gICAgY29uc3QgcmVsID0gcmVsYXRpdmUocm9vdCwgZnVsbCkuc3BsaXQoXCJcXFxcXCIpLmpvaW4oXCIvXCIpO1xuICAgIGNvbnN0IHN0YXQgPSBzdGF0U3luYyhmdWxsKTtcbiAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBjb2xsZWN0VHdlYWtGaWxlSGFzaGVzKHJvb3QsIGZ1bGwsIG91dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFzdGF0LmlzRmlsZSgpKSBjb250aW51ZTtcbiAgICBvdXRbcmVsXSA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKHJlYWRGaWxlU3luYyhmdWxsKSkuZGlnZXN0KFwiaGV4XCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhbWVGaWxlSGFzaGVzKGE6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIGI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBib29sZWFuIHtcbiAgY29uc3QgYWsgPSBPYmplY3Qua2V5cyhhKS5zb3J0KCk7XG4gIGNvbnN0IGJrID0gT2JqZWN0LmtleXMoYikuc29ydCgpO1xuICBpZiAoYWsubGVuZ3RoICE9PSBiay5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhay5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGFrW2ldO1xuICAgIGlmIChrZXkgIT09IGJrW2ldIHx8IGFba2V5XSAhPT0gYltrZXldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzSGFzaFJlY29yZCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikuZXZlcnkoKHYpID0+IHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKTtcbn1cblxuZnVuY3Rpb24gZmFsbGJhY2tTb3VyY2VSb290KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgIGpvaW4oaG9tZWRpcigpLCBcIi5jb2RleC1wbHVzcGx1c1wiLCBcInNvdXJjZVwiKSxcbiAgICBqb2luKHVzZXJSb290ISwgXCJzb3VyY2VcIiksXG4gIF07XG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICBpZiAoZXhpc3RzU3luYyhqb2luKGNhbmRpZGF0ZSwgXCJwYWNrYWdlc1wiLCBcImluc3RhbGxlclwiLCBcImRpc3RcIiwgXCJjbGkuanNcIikpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBkZXNjcmliZUluc3RhbGxhdGlvblNvdXJjZShzb3VyY2VSb290OiBzdHJpbmcgfCBudWxsKTogSW5zdGFsbGF0aW9uU291cmNlIHtcbiAgaWYgKCFzb3VyY2VSb290KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtpbmQ6IFwidW5rbm93blwiLFxuICAgICAgbGFiZWw6IFwiVW5rbm93blwiLFxuICAgICAgZGV0YWlsOiBcIkNvZGV4Kysgc291cmNlIGxvY2F0aW9uIGlzIG5vdCByZWNvcmRlZCB5ZXQuXCIsXG4gICAgfTtcbiAgfVxuICBjb25zdCBub3JtYWxpemVkID0gc291cmNlUm9vdC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcbiAgaWYgKC9cXC8oPzpIb21lYnJld3xob21lYnJldylcXC9DZWxsYXJcXC9jb2RleHBsdXNwbHVzXFwvLy50ZXN0KG5vcm1hbGl6ZWQpKSB7XG4gICAgcmV0dXJuIHsga2luZDogXCJob21lYnJld1wiLCBsYWJlbDogXCJIb21lYnJld1wiLCBkZXRhaWw6IHNvdXJjZVJvb3QgfTtcbiAgfVxuICBpZiAoZXhpc3RzU3luYyhqb2luKHNvdXJjZVJvb3QsIFwiLmdpdFwiKSkpIHtcbiAgICByZXR1cm4geyBraW5kOiBcImxvY2FsLWRldlwiLCBsYWJlbDogXCJMb2NhbCBkZXZlbG9wbWVudCBjaGVja291dFwiLCBkZXRhaWw6IHNvdXJjZVJvb3QgfTtcbiAgfVxuICBpZiAobm9ybWFsaXplZC5lbmRzV2l0aChcIi8uY29kZXgtcGx1c3BsdXMvc291cmNlXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCIvLmNvZGV4LXBsdXNwbHVzL3NvdXJjZS9cIikpIHtcbiAgICByZXR1cm4geyBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiwgbGFiZWw6IFwiR2l0SHViIHNvdXJjZSBpbnN0YWxsZXJcIiwgZGV0YWlsOiBzb3VyY2VSb290IH07XG4gIH1cbiAgaWYgKGV4aXN0c1N5bmMoam9pbihzb3VyY2VSb290LCBcInBhY2thZ2UuanNvblwiKSkpIHtcbiAgICByZXR1cm4geyBraW5kOiBcInNvdXJjZS1hcmNoaXZlXCIsIGxhYmVsOiBcIlNvdXJjZSBhcmNoaXZlXCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xuICB9XG4gIHJldHVybiB7IGtpbmQ6IFwidW5rbm93blwiLCBsYWJlbDogXCJVbmtub3duXCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xufVxuXG5mdW5jdGlvbiBzdGFydEluc3RhbGxlZENsaShjbGk6IHN0cmluZywgYXJnczogc3RyaW5nW10pOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIgJiYgc3RhcnRJbnN0YWxsZWRDbGlXaXRoTGF1bmNoZChjbGksIGFyZ3MpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGNoaWxkID0gc3Bhd24ocHJvY2Vzcy5leGVjUGF0aCwgW2NsaSwgLi4uYXJnc10sIHtcbiAgICBjd2Q6IHJlc29sdmUoZGlybmFtZShjbGkpLCBcIi4uXCIsIFwiLi5cIiwgXCIuLlwiKSxcbiAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIENPREVYX1BMVVNQTFVTX01BTlVBTF9VUERBVEU6IFwiMVwiIH0sXG4gICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgc3RkaW86IFwiaWdub3JlXCIsXG4gIH0pO1xuICBjaGlsZC51bnJlZigpO1xufVxuXG5mdW5jdGlvbiBzdGFydEluc3RhbGxlZENsaVdpdGhMYXVuY2hkKGNsaTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBjb25zdCBsYWJlbCA9IGBjb20uY29kZXhwbHVzcGx1cy5wYXRjaC1oZWxwZXIuJHtwcm9jZXNzLnBpZH0uJHtEYXRlLm5vdygpfWA7XG4gIGNvbnN0IGNsZWFudXAgPSBgbGF1bmNoY3RsIHJlbW92ZSAke2xhYmVsfSA+L2Rldi9udWxsIDI+JjEgfHwgbGF1bmNoY3RsIGJvb3RvdXQgZ3VpLyQoaWQgLXUpLyR7bGFiZWx9ID4vZGV2L251bGwgMj4mMSB8fCB0cnVlYDtcbiAgY29uc3QgY29tbWFuZCA9IFtcbiAgICBgdHJhcCAke3NoZWxsUXVvdGUoY2xlYW51cCl9IEVYSVRgLFxuICAgIGBjZCAke3NoZWxsUXVvdGUocmVzb2x2ZShkaXJuYW1lKGNsaSksIFwiLi5cIiwgXCIuLlwiLCBcIi4uXCIpKX1gLFxuICAgIGBDT0RFWF9QTFVTUExVU19NQU5VQUxfVVBEQVRFPTEgJHtbcHJvY2Vzcy5leGVjUGF0aCwgY2xpLCAuLi5hcmdzXS5tYXAoc2hlbGxRdW90ZSkuam9pbihcIiBcIil9YCxcbiAgXS5qb2luKFwiICYmIFwiKTtcbiAgY29uc3QgcmVzdWx0ID0gc3Bhd25TeW5jKFxuICAgIFwibGF1bmNoY3RsXCIsXG4gICAgW1xuICAgICAgXCJzdWJtaXRcIixcbiAgICAgIFwiLWxcIixcbiAgICAgIGxhYmVsLFxuICAgICAgXCItLVwiLFxuICAgICAgXCIvYmluL3NoXCIsXG4gICAgICBcIi1jXCIsXG4gICAgICBgJHtjb21tYW5kfSB8fCB0cnVlYCxcbiAgICBdLFxuICAgIHtcbiAgICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgIH0sXG4gICk7XG4gIGlmIChyZXN1bHQuc3RhdHVzID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgbG9nKFwid2FyblwiLCBgbGF1bmNoY3RsIHN1Ym1pdCBmYWlsZWQgZm9yIENvZGV4KysgcGF0Y2ggaGVscGVyOiAke3Jlc3VsdC5lcnJvcj8ubWVzc2FnZSA/PyByZXN1bHQuc3RhdHVzfWApO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHNoZWxsUXVvdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJyR7dmFsdWUucmVwbGFjZSgvJy9nLCBgJ1xcXFwnJ2ApfSdgO1xufVxuXG5mdW5jdGlvbiBtYXJrU2VsZlVwZGF0ZVN0YXJ0ZWQoc291cmNlUm9vdDogc3RyaW5nKTogU2VsZlVwZGF0ZVN0YXRlIHtcbiAgY29uc3QgY29uZmlnID0gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cztcbiAgY29uc3QgY2hhbm5lbCA9IGNvbmZpZz8udXBkYXRlQ2hhbm5lbCA/PyBcInN0YWJsZVwiO1xuICBjb25zdCBzdGF0ZTogU2VsZlVwZGF0ZVN0YXRlID0ge1xuICAgIGNoZWNrZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIHN0YXR1czogXCJjaGVja2luZ1wiLFxuICAgIGN1cnJlbnRWZXJzaW9uOiBDT0RFWF9QTFVTUExVU19WRVJTSU9OLFxuICAgIGxhdGVzdFZlcnNpb246IG51bGwsXG4gICAgdGFyZ2V0UmVmOiBjb25maWc/LnVwZGF0ZUNoYW5uZWwgPT09IFwiY3VzdG9tXCIgPyBjb25maWcudXBkYXRlUmVmID8/IG51bGwgOiBudWxsLFxuICAgIHJlbGVhc2VVcmw6IG51bGwsXG4gICAgcmVwbzogY29uZmlnPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgY2hhbm5lbCxcbiAgICBzb3VyY2VSb290LFxuICAgIGluc3RhbGxhdGlvblNvdXJjZTogZGVzY3JpYmVJbnN0YWxsYXRpb25Tb3VyY2Uoc291cmNlUm9vdCksXG4gIH07XG4gIHdyaXRlU2VsZlVwZGF0ZVN0YXRlKHN0YXRlKTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG5mdW5jdGlvbiBicm9hZGNhc3RSZWxvYWQoKTogdm9pZCB7XG4gIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgYXQ6IERhdGUubm93KCksXG4gICAgdHdlYWtzOiB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiB0Lm1hbmlmZXN0LmlkKSxcbiAgfTtcbiAgZm9yIChjb25zdCB3YyBvZiB3ZWJDb250ZW50cy5nZXRBbGxXZWJDb250ZW50cygpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHdjLnNlbmQoXCJjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkXCIsIHBheWxvYWQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJicm9hZGNhc3Qgc2VuZCBmYWlsZWQ6XCIsIGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlTG9nZ2VyKHNjb3BlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHtcbiAgICBkZWJ1ZzogKC4uLmE6IHVua25vd25bXSkgPT4gbG9nKFwiaW5mb1wiLCBgWyR7c2NvcGV9XWAsIC4uLmEpLFxuICAgIGluZm86ICguLi5hOiB1bmtub3duW10pID0+IGxvZyhcImluZm9cIiwgYFske3Njb3BlfV1gLCAuLi5hKSxcbiAgICB3YXJuOiAoLi4uYTogdW5rbm93bltdKSA9PiBsb2coXCJ3YXJuXCIsIGBbJHtzY29wZX1dYCwgLi4uYSksXG4gICAgZXJyb3I6ICguLi5hOiB1bmtub3duW10pID0+IGxvZyhcImVycm9yXCIsIGBbJHtzY29wZX1dYCwgLi4uYSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluQnJpZGdlKCkge1xuICByZXR1cm4ge1xuICAgIGFkZE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyOiAodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSA9PiB7XG4gICAgICBtYWluTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzLmFkZCh0cmFuc2Zvcm1lcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5kZWxldGUodHJhbnNmb3JtZXIpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9LFxuICAgIGFkZE1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXI6IChsaXN0ZW5lcjogTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcikgPT4ge1xuICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1Ib29rKCk6IHZvaWQge1xuICBjb25zdCBjdXJyZW50ID0gaXBjTWFpbi5oYW5kbGUgYXMgdHlwZW9mIGlwY01haW4uaGFuZGxlICYgeyBfX2NvZGV4cHBNZXNzYWdlVHJhbnNmb3JtUGF0Y2hlZD86IGJvb2xlYW4gfTtcbiAgaWYgKGN1cnJlbnQuX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQpIHJldHVybjtcbiAgY29uc3Qgb3JpZ2luYWxIYW5kbGUgPSBpcGNNYWluLmhhbmRsZS5iaW5kKGlwY01haW4pO1xuICBjb25zdCBwYXRjaGVkSGFuZGxlID0gKChjaGFubmVsOiBzdHJpbmcsIGxpc3RlbmVyOiBQYXJhbWV0ZXJzPHR5cGVvZiBpcGNNYWluLmhhbmRsZT5bMV0pID0+IHtcbiAgICBpZiAoY2hhbm5lbCAhPT0gREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVykgcmV0dXJuIG9yaWdpbmFsSGFuZGxlKGNoYW5uZWwsIGxpc3RlbmVyKTtcbiAgICByZXR1cm4gb3JpZ2luYWxIYW5kbGUoY2hhbm5lbCwgYXN5bmMgKGV2ZW50LCBtZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICBzZW5kZXJJZDogZXZlbnQuc2VuZGVyPy5pZCxcbiAgICAgICAgc2VuZGVyVXJsOiBldmVudC5zZW5kZXJGcmFtZT8udXJsIHx8IGV2ZW50LnNlbmRlcj8uZ2V0VVJMPy4oKSxcbiAgICAgIH07XG4gICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlLCBjb250ZXh0KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbGlzdGVuZXIoZXZlbnQsIHRyYW5zZm9ybWVkKTtcbiAgICAgIG5vdGlmeU1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlKHRyYW5zZm9ybWVkLCByZXNwb25zZSwgY29udGV4dCk7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSk7XG4gIH0pIGFzIHR5cGVvZiBpcGNNYWluLmhhbmRsZSAmIHsgX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQ/OiBib29sZWFuIH07XG4gIHBhdGNoZWRIYW5kbGUuX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQgPSB0cnVlO1xuICBpcGNNYWluLmhhbmRsZSA9IHBhdGNoZWRIYW5kbGU7XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlOiB1bmtub3duLCBjb250ZXh0OiBNZXNzYWdlRnJvbVZpZXdDb250ZXh0KTogdW5rbm93biB7XG4gIGxldCBjdXJyZW50ID0gbWVzc2FnZTtcbiAgZm9yIChjb25zdCB0cmFuc2Zvcm1lciBvZiBBcnJheS5mcm9tKG1haW5NZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5leHQgPSB0cmFuc2Zvcm1lcihjdXJyZW50LCBjb250ZXh0KTtcbiAgICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIGN1cnJlbnQgPSBuZXh0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIFwibWVzc2FnZS1mcm9tLXZpZXcgdHJhbnNmb3JtZXIgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5mdW5jdGlvbiBub3RpZnlNZXNzYWdlRnJvbVZpZXdSZXNwb25zZShcbiAgbWVzc2FnZTogdW5rbm93bixcbiAgcmVzcG9uc2U6IHVua25vd24sXG4gIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQsXG4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBBcnJheS5mcm9tKG1haW5NZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVycykpIHtcbiAgICB0cnkge1xuICAgICAgbGlzdGVuZXIobWVzc2FnZSwgcmVzcG9uc2UsIGNvbnRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIFwibWVzc2FnZS1mcm9tLXZpZXcgcmVzcG9uc2UgbGlzdGVuZXIgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluSXBjKGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgY2ggPSAoYzogc3RyaW5nKSA9PiBgY29kZXhwcDoke2lkfToke2N9YDtcbiAgcmV0dXJuIHtcbiAgICBvbjogKGM6IHN0cmluZywgaDogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgY29uc3Qgd3JhcHBlZCA9IChfZTogdW5rbm93biwgLi4uYXJnczogdW5rbm93bltdKSA9PiBoKC4uLmFyZ3MpO1xuICAgICAgaXBjTWFpbi5vbihjaChjKSwgd3JhcHBlZCk7XG4gICAgICByZXR1cm4gKCkgPT4gaXBjTWFpbi5yZW1vdmVMaXN0ZW5lcihjaChjKSwgd3JhcHBlZCBhcyBuZXZlcik7XG4gICAgfSxcbiAgICBzZW5kOiAoX2M6IHN0cmluZykgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaXBjLnNlbmQgaXMgcmVuZGVyZXJcdTIxOTJtYWluOyBtYWluIHNpZGUgdXNlcyBoYW5kbGUvb25cIik7XG4gICAgfSxcbiAgICBpbnZva2U6IChfYzogc3RyaW5nKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpcGMuaW52b2tlIGlzIHJlbmRlcmVyXHUyMTkybWFpbjsgbWFpbiBzaWRlIHVzZXMgaGFuZGxlXCIpO1xuICAgIH0sXG4gICAgaGFuZGxlOiAoYzogc3RyaW5nLCBoYW5kbGVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duKSA9PiB7XG4gICAgICBpcGNNYWluLmhhbmRsZShjaChjKSwgKF9lOiB1bmtub3duLCAuLi5hcmdzOiB1bmtub3duW10pID0+IGhhbmRsZXIoLi4uYXJncykpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluRnMoaWQ6IHN0cmluZykge1xuICBjb25zdCBkaXIgPSBqb2luKHVzZXJSb290ISwgXCJ0d2Vhay1kYXRhXCIsIGlkKTtcbiAgbWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGZzID0gcmVxdWlyZShcIm5vZGU6ZnMvcHJvbWlzZXNcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6ZnMvcHJvbWlzZXNcIik7XG4gIHJldHVybiB7XG4gICAgZGF0YURpcjogZGlyLFxuICAgIHJlYWQ6IChwOiBzdHJpbmcpID0+IGZzLnJlYWRGaWxlKGpvaW4oZGlyLCBwKSwgXCJ1dGY4XCIpLFxuICAgIHdyaXRlOiAocDogc3RyaW5nLCBjOiBzdHJpbmcpID0+IGZzLndyaXRlRmlsZShqb2luKGRpciwgcCksIGMsIFwidXRmOFwiKSxcbiAgICBleGlzdHM6IGFzeW5jIChwOiBzdHJpbmcpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmFjY2Vzcyhqb2luKGRpciwgcCkpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZU1vZGVsQXBpKHR3ZWFrSWQ6IHN0cmluZykge1xuICByZXR1cm4ge1xuICAgIGdlbmVyYXRlVGV4dDogKG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zKSA9PiB7XG4gICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm1vZGVsXCIpO1xuICAgICAgcmV0dXJuIGdlbmVyYXRlTW9kZWxUZXh0KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgZ2VuZXJhdGVPYmplY3Q6IDxUID0gdW5rbm93bj4ob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucykgPT4ge1xuICAgICAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgXCJtb2RlbFwiKTtcbiAgICAgIHJldHVybiBnZW5lcmF0ZU1vZGVsT2JqZWN0PFQ+KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsZWFuTW9kZWxSZWFzb25pbmdFZmZvcnQodmFsdWU6IHVua25vd24pOiBDb2RleE1vZGVsUmVhc29uaW5nRWZmb3J0IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJtaW5pbWFsXCIgfHxcbiAgICB2YWx1ZSA9PT0gXCJsb3dcIiB8fFxuICAgIHZhbHVlID09PSBcIm1lZGl1bVwiIHx8XG4gICAgdmFsdWUgPT09IFwiaGlnaFwiIHx8XG4gICAgdmFsdWUgPT09IFwieGhpZ2hcIlxuICAgID8gdmFsdWVcbiAgICA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGNsZWFuTW9kZWxTdHJpbmcodmFsdWU6IHVua25vd24sIG1heExlbmd0aDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/IHZhbHVlLnNsaWNlKDAsIG1heExlbmd0aCkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiBtb2RlbFByb21wdChvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucyk6IHN0cmluZyB7XG4gIGNvbnN0IHN5c3RlbSA9IGNsZWFuTW9kZWxTdHJpbmcob3B0aW9ucy5zeXN0ZW0sIDgwMDApLnRyaW0oKTtcbiAgY29uc3QgcHJvbXB0ID0gY2xlYW5Nb2RlbFN0cmluZyhvcHRpb25zLnByb21wdCwgMTIwMDAwKS50cmltKCk7XG4gIGlmICghcHJvbXB0KSB0aHJvdyBuZXcgRXJyb3IoXCJtb2RlbCBwcm9tcHQgaXMgcmVxdWlyZWRcIik7XG4gIHJldHVybiBzeXN0ZW0gPyBgJHtzeXN0ZW19XFxuXFxuJHtwcm9tcHR9YCA6IHByb21wdDtcbn1cblxuZnVuY3Rpb24gbW9kZWxXb3JraW5nRGlyZWN0b3J5KHR3ZWFrSWQ6IHN0cmluZywgY3dkOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjd2QgPT09IFwic3RyaW5nXCIgJiYgY3dkICYmIGlzQWJzb2x1dGUoY3dkKSAmJiBleGlzdHNTeW5jKGN3ZCkpIHJldHVybiBjd2Q7XG4gIHJldHVybiBqb2luKHVzZXJSb290ISwgXCJ0d2Vhay1kYXRhXCIsIHR3ZWFrSWQpO1xufVxuXG5mdW5jdGlvbiBjb2RleENsaUVudigpOiBOb2RlSlMuUHJvY2Vzc0VudiB7XG4gIHJldHVybiB7XG4gICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgSE9NRTogcHJvY2Vzcy5lbnYuSE9NRSB8fCBob21lZGlyKCksXG4gICAgQ09ERVhfSU5URVJOQUxfT1JJR0lOQVRPUl9PVkVSUklERTogcHJvY2Vzcy5lbnYuQ09ERVhfSU5URVJOQUxfT1JJR0lOQVRPUl9PVkVSUklERSB8fCBcIkNvZGV4KytcIixcbiAgICBQQVRIOiBbXG4gICAgICBwcm9jZXNzLmVudi5QQVRIIHx8IFwiXCIsXG4gICAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgICBcIi91c3IvYmluXCIsXG4gICAgICBcIi9iaW5cIixcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiOlwiKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29kZXhDbGlDb21tYW5kKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLmVudi5DT0RFWF9QTFVTUExVU19DT0RFWF9DTEkgfHwgcHJvY2Vzcy5lbnYuQ09ERVhfQ0xJIHx8IFwiY29kZXhcIjtcbn1cblxuZnVuY3Rpb24gbW9kZWxUaW1lb3V0TXModmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCB0aW1lb3V0TXMgPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHZhbHVlKSA/IHZhbHVlIDogNDVfMDAwO1xuICByZXR1cm4gTWF0aC5tYXgoNV8wMDAsIE1hdGgubWluKDE4MF8wMDAsIE1hdGguZmxvb3IodGltZW91dE1zKSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Db2RleE1vZGVsKFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zLFxuICBzY2hlbWE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFByb21pc2U8Q29kZXhNb2RlbFRleHRSZXN1bHQ+IHtcbiAgY29uc3QgcHJvbXB0ID0gbW9kZWxQcm9tcHQob3B0aW9ucyk7XG4gIGNvbnN0IG1vZGVsID0gY2xlYW5Nb2RlbFN0cmluZyhvcHRpb25zLm1vZGVsLCAxMjApLnRyaW0oKTtcbiAgY29uc3QgcmVhc29uaW5nRWZmb3J0ID0gY2xlYW5Nb2RlbFJlYXNvbmluZ0VmZm9ydChvcHRpb25zLnJlYXNvbmluZ0VmZm9ydCk7XG4gIGNvbnN0IGN3ZCA9IG1vZGVsV29ya2luZ0RpcmVjdG9yeSh0d2Vha0lkLCBvcHRpb25zLmN3ZCk7XG4gIGNvbnN0IHRlbXBEaXIgPSBta2R0ZW1wU3luYyhqb2luKHRtcGRpcigpLCBcImNvZGV4cHAtbW9kZWwtXCIpKTtcbiAgY29uc3QgcHJvbXB0UGF0aCA9IGpvaW4odGVtcERpciwgXCJwcm9tcHQudHh0XCIpO1xuICBjb25zdCBvdXRwdXRQYXRoID0gam9pbih0ZW1wRGlyLCBcIm91dHB1dC50eHRcIik7XG4gIGNvbnN0IHNjaGVtYVBhdGggPSBqb2luKHRlbXBEaXIsIFwic2NoZW1hLmpzb25cIik7XG5cbiAgdHJ5IHtcbiAgICB3cml0ZUZpbGVTeW5jKHByb21wdFBhdGgsIHByb21wdCwgXCJ1dGY4XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1lcGhlbWVyYWxcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0taWdub3JlLXJ1bGVzXCIsXG4gICAgICBcIi0tYXNrLWZvci1hcHByb3ZhbFwiLFxuICAgICAgXCJuZXZlclwiLFxuICAgICAgXCItLXNhbmRib3hcIixcbiAgICAgIFwicmVhZC1vbmx5XCIsXG4gICAgICBcIi0tb3V0cHV0LWxhc3QtbWVzc2FnZVwiLFxuICAgICAgb3V0cHV0UGF0aCxcbiAgICAgIFwiLUNcIixcbiAgICAgIGN3ZCxcbiAgICBdO1xuXG4gICAgaWYgKG1vZGVsKSBhcmdzLnB1c2goXCItLW1vZGVsXCIsIG1vZGVsKTtcbiAgICBpZiAocmVhc29uaW5nRWZmb3J0KSBhcmdzLnB1c2goXCItY1wiLCBgbW9kZWxfcmVhc29uaW5nX2VmZm9ydD1cIiR7cmVhc29uaW5nRWZmb3J0fVwiYCk7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgd3JpdGVGaWxlU3luYyhzY2hlbWFQYXRoLCBKU09OLnN0cmluZ2lmeShzY2hlbWEsIG51bGwsIDIpLCBcInV0ZjhcIik7XG4gICAgICBhcmdzLnB1c2goXCItLW91dHB1dC1zY2hlbWFcIiwgc2NoZW1hUGF0aCk7XG4gICAgfVxuICAgIGFyZ3MucHVzaChcIi1cIik7XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzcGF3bldpdGhJbnB1dChjb2RleENsaUNvbW1hbmQoKSwgYXJncywgcHJvbXB0LCB7XG4gICAgICBjd2QsXG4gICAgICBlbnY6IGNvZGV4Q2xpRW52KCksXG4gICAgICB0aW1lb3V0TXM6IG1vZGVsVGltZW91dE1zKG9wdGlvbnMudGltZW91dE1zKSxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LnN0YXR1cyAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RleCBleGVjIGZhaWxlZCAoJHtyZXN1bHQuc3RhdHVzID8/IFwic2lnbmFsXCJ9KTogJHtyZXN1bHQuc3RkZXJyLnNsaWNlKC0yMDAwKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gcmVhZEZpbGVTeW5jKG91dHB1dFBhdGgsIFwidXRmOFwiKS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB0aHJvdyBuZXcgRXJyb3IoXCJjb2RleCBleGVjIHJldHVybmVkIGFuIGVtcHR5IGZpbmFsIG1lc3NhZ2VcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQsXG4gICAgICBtb2RlbDogbW9kZWwgfHwgbnVsbCxcbiAgICAgIHJlYXNvbmluZ0VmZm9ydCxcbiAgICB9O1xuICB9IGZpbmFsbHkge1xuICAgIHJtU3luYyh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3Bhd25XaXRoSW5wdXQoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgYXJnczogc3RyaW5nW10sXG4gIGlucHV0OiBzdHJpbmcsXG4gIG9wdGlvbnM6IHsgY3dkOiBzdHJpbmc7IGVudjogTm9kZUpTLlByb2Nlc3NFbnY7IHRpbWVvdXRNczogbnVtYmVyIH0sXG4pOiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXIgfCBudWxsOyBzaWduYWw6IE5vZGVKUy5TaWduYWxzIHwgbnVsbDsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlUHJvbWlzZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgY2hpbGQgPSBzcGF3bihjb21tYW5kLCBhcmdzLCB7XG4gICAgICBjd2Q6IG9wdGlvbnMuY3dkLFxuICAgICAgZW52OiBvcHRpb25zLmVudixcbiAgICAgIHN0ZGlvOiBbXCJwaXBlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gICAgfSk7XG4gICAgbGV0IHN0ZG91dCA9IFwiXCI7XG4gICAgbGV0IHN0ZGVyciA9IFwiXCI7XG4gICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHJldHVybjtcbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBjb2RleCBtb2RlbCBnZW5lcmF0aW9uIHRpbWVkIG91dCBhZnRlciAke29wdGlvbnMudGltZW91dE1zfW1zYCkpO1xuICAgIH0sIG9wdGlvbnMudGltZW91dE1zKTtcblxuICAgIGNoaWxkLnN0ZG91dD8uc2V0RW5jb2RpbmcoXCJ1dGY4XCIpO1xuICAgIGNoaWxkLnN0ZGVycj8uc2V0RW5jb2RpbmcoXCJ1dGY4XCIpO1xuICAgIGNoaWxkLnN0ZG91dD8ub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xuICAgICAgc3Rkb3V0ICs9IFN0cmluZyhjaHVuayk7XG4gICAgICBpZiAoc3Rkb3V0Lmxlbmd0aCA+IDEyOF8wMDApIHN0ZG91dCA9IHN0ZG91dC5zbGljZSgtMTI4XzAwMCk7XG4gICAgfSk7XG4gICAgY2hpbGQuc3RkZXJyPy5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XG4gICAgICBzdGRlcnIgKz0gU3RyaW5nKGNodW5rKTtcbiAgICAgIGlmIChzdGRlcnIubGVuZ3RoID4gMTI4XzAwMCkgc3RkZXJyID0gc3RkZXJyLnNsaWNlKC0xMjhfMDAwKTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbihcImVycm9yXCIsIChlcnJvcikgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHJldHVybjtcbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgfSk7XG4gICAgY2hpbGQub24oXCJjbG9zZVwiLCAoc3RhdHVzLCBzaWduYWwpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSByZXR1cm47XG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICByZXNvbHZlUHJvbWlzZSh7IHN0YXR1cywgc2lnbmFsLCBzdGRvdXQsIHN0ZGVyciB9KTtcbiAgICB9KTtcbiAgICBjaGlsZC5zdGRpbj8uZW5kKGlucHV0KTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlTW9kZWxUZXh0KFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zLFxuKTogUHJvbWlzZTxDb2RleE1vZGVsVGV4dFJlc3VsdD4ge1xuICByZXR1cm4gcnVuQ29kZXhNb2RlbCh0d2Vha0lkLCBvcHRpb25zKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVNb2RlbE9iamVjdDxUID0gdW5rbm93bj4oXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgb3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbik6IFByb21pc2U8Q29kZXhNb2RlbE9iamVjdFJlc3VsdDxUPj4ge1xuICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09IFwib2JqZWN0XCIgfHwgIW9wdGlvbnMuc2NoZW1hIHx8IHR5cGVvZiBvcHRpb25zLnNjaGVtYSAhPT0gXCJvYmplY3RcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm1vZGVsIG9iamVjdCBnZW5lcmF0aW9uIHJlcXVpcmVzIGEgSlNPTiBzY2hlbWFcIik7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuQ29kZXhNb2RlbCh0d2Vha0lkLCBvcHRpb25zLCBvcHRpb25zLnNjaGVtYSk7XG4gIGxldCBvYmplY3Q6IFQ7XG4gIHRyeSB7XG4gICAgb2JqZWN0ID0gSlNPTi5wYXJzZShyZXN1bHQudGV4dCkgYXMgVDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG1vZGVsIG9iamVjdCBnZW5lcmF0aW9uIHJldHVybmVkIGludmFsaWQgSlNPTjogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIHsgLi4ucmVzdWx0LCBvYmplY3QgfTtcbn1cblxuZnVuY3Rpb24gY3VycmVudFJ1bnRpbWVJbmZvKCk6IENvZGV4UnVudGltZUluZm8ge1xuICBjb25zdCBpbnN0YWxsZXJTdGF0ZSA9IHJlYWRJbnN0YWxsZXJTdGF0ZSgpO1xuICByZXR1cm4gZ2V0UnVudGltZUluZm8oe1xuICAgIHVzZXJSb290OiB1c2VyUm9vdCEsXG4gICAgcnVudGltZURpcjogcnVudGltZURpciEsXG4gICAgY29kZXhWZXJzaW9uOiBpbnN0YWxsZXJTdGF0ZT8uY29kZXhWZXJzaW9uID8/IG51bGwsXG4gICAgY2hhbm5lbDogbnVsbCxcbiAgICBnZXRXaW5kb3dTZXJ2aWNlczogZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcyxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGN1cnJlbnRSdW50aW1lQ2FwYWJpbGl0aWVzKCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllcyB7XG4gIGNvbnN0IGluc3RhbGxlclN0YXRlID0gcmVhZEluc3RhbGxlclN0YXRlKCk7XG4gIHJldHVybiBnZXRSdW50aW1lQ2FwYWJpbGl0aWVzKHtcbiAgICB1c2VyUm9vdDogdXNlclJvb3QhLFxuICAgIHJ1bnRpbWVEaXI6IHJ1bnRpbWVEaXIhLFxuICAgIGNvZGV4VmVyc2lvbjogaW5zdGFsbGVyU3RhdGU/LmNvZGV4VmVyc2lvbiA/PyBudWxsLFxuICAgIGNoYW5uZWw6IG51bGwsXG4gICAgZ2V0V2luZG93U2VydmljZXM6IGdldENvZGV4V2luZG93U2VydmljZXMsXG4gICAgZ2V0TmF0aXZlQ2FwYWJpbGl0aWVzOiAoKSA9PiBuYXRpdmVCcmlkZ2UuZ2V0Q2FwYWJpbGl0aWVzKCksXG4gICAgZ2V0Vmlld0NhcGFiaWxpdGllczogKCkgPT4gZ2V0T3dsVmlld0NhcGFiaWxpdGllcygpLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gdHdlYWtDb250ZXh0KHR3ZWFrSWQ6IHN0cmluZywgcGVybWlzc2lvbj86IFR3ZWFrUGVybWlzc2lvbik6IE5hdGl2ZVR3ZWFrQ29udGV4dCB7XG4gIGNvbnN0IHR3ZWFrID0gcGVybWlzc2lvblxuICAgID8gYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgcGVybWlzc2lvbilcbiAgICA6IHR3ZWFrQnlJZCh0d2Vha0lkKTtcbiAgcmV0dXJuIHsgaWQ6IHR3ZWFrLm1hbmlmZXN0LmlkLCBkaXI6IHR3ZWFrLmRpciB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha0J5SWQodHdlYWtJZDogc3RyaW5nKTogRGlzY292ZXJlZFR3ZWFrIHtcbiAgYXNzZXJ0VHdlYWtJZCh0d2Vha0lkKTtcbiAgY29uc3QgdHdlYWsgPSB0d2Vha1N0YXRlLmRpc2NvdmVyZWQuZmluZCgoaXRlbSkgPT4gaXRlbS5tYW5pZmVzdC5pZCA9PT0gdHdlYWtJZCk7XG4gIGlmICghdHdlYWspIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0d2VhazogJHt0d2Vha0lkfWApO1xuICBpZiAoIWlzVHdlYWtFbmFibGVkKHR3ZWFrSWQpKSB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrIGlzIGRpc2FibGVkOiAke3R3ZWFrSWR9YCk7XG4gIHJldHVybiB0d2Vhaztcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZDogc3RyaW5nLCBwZXJtaXNzaW9uOiBUd2Vha1Blcm1pc3Npb24pOiBEaXNjb3ZlcmVkVHdlYWsge1xuICBjb25zdCB0d2VhayA9IHR3ZWFrQnlJZCh0d2Vha0lkKTtcbiAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uKHR3ZWFrLCBwZXJtaXNzaW9uKTtcbiAgcmV0dXJuIHR3ZWFrO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRUd2Vha1ZpZXdQZXJtaXNzaW9uRm9ySWQodHdlYWtJZDogc3RyaW5nKTogRGlzY292ZXJlZFR3ZWFrIHtcbiAgY29uc3QgdHdlYWsgPSB0d2Vha0J5SWQodHdlYWtJZCk7XG4gIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb24odHdlYWspO1xuICByZXR1cm4gdHdlYWs7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhazogRGlzY292ZXJlZFR3ZWFrLCBwZXJtaXNzaW9uOiBUd2Vha1Blcm1pc3Npb24pOiB2b2lkIHtcbiAgaWYgKHR3ZWFrLm1hbmlmZXN0LnBlcm1pc3Npb25zPy5pbmNsdWRlcyhwZXJtaXNzaW9uKSkgcmV0dXJuO1xuICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dHdlYWsubWFuaWZlc3QuaWR9IG11c3QgZGVjbGFyZSAke3Blcm1pc3Npb259IHBlcm1pc3Npb25gKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtWaWV3UGVybWlzc2lvbih0d2VhazogRGlzY292ZXJlZFR3ZWFrKTogdm9pZCB7XG4gIGlmIChcbiAgICB0d2Vhay5tYW5pZmVzdC5wZXJtaXNzaW9ucz8uaW5jbHVkZXMoXCJjb2RleC12aWV3c1wiKSB8fFxuICAgIHR3ZWFrLm1hbmlmZXN0LnBlcm1pc3Npb25zPy5pbmNsdWRlcyhcImNvZGV4LnZpZXdzXCIpXG4gICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dHdlYWsubWFuaWZlc3QuaWR9IG11c3QgZGVjbGFyZSBjb2RleC12aWV3cyBwZXJtaXNzaW9uYCk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFR3ZWFrSWQodHdlYWtJZDogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghL15bYS16QS1aMC05Ll8tXSskLy50ZXN0KHR3ZWFrSWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgdHdlYWsgaWRcIik7XG59XG5cbmZ1bmN0aW9uIGdldFByaW1hcnlDb2RleFdpbmRvdygpOiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBjb25zdCBmcm9tU2VydmljZXMgPSB0eXBlb2Ygc2VydmljZXM/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gc2VydmljZXMuZ2V0UHJpbWFyeVdpbmRvdyhcImxvY2FsXCIpXG4gICAgOiBudWxsO1xuICBpZiAoZnJvbVNlcnZpY2VzICYmICFmcm9tU2VydmljZXMuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZyb21TZXJ2aWNlcztcbiAgY29uc3QgZnJvbU1hbmFnZXIgPSB0eXBlb2Ygc2VydmljZXM/LndpbmRvd01hbmFnZXI/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gc2VydmljZXMud2luZG93TWFuYWdlci5nZXRQcmltYXJ5V2luZG93LmNhbGwoc2VydmljZXMud2luZG93TWFuYWdlcilcbiAgICA6IG51bGw7XG4gIGlmIChmcm9tTWFuYWdlciAmJiAhZnJvbU1hbmFnZXIuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZyb21NYW5hZ2VyO1xuICBjb25zdCBmb2N1c2VkID0gQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KCk7XG4gIGlmIChmb2N1c2VkICYmICFmb2N1c2VkLmlzRGVzdHJveWVkKCkpIHJldHVybiBmb2N1c2VkO1xuICByZXR1cm4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuZmluZCgod2luKSA9PiAhd2luLmlzRGVzdHJveWVkKCkpID8/IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFByaW1hcnlDb2RleFdpbmRvd1JlZigpOiBDb2RleFdpbmRvd1JlZiB8IG51bGwge1xuICBjb25zdCB3aW4gPSBnZXRQcmltYXJ5Q29kZXhXaW5kb3coKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBudWxsO1xuICByZXR1cm4geyB3aW5kb3dJZDogd2luLmlkLCB3ZWJDb250ZW50c0lkOiB3aW4ud2ViQ29udGVudHMuaWQgfTtcbn1cblxuZnVuY3Rpb24gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHdpbmRvd0lkKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBmYWxzZTtcbiAgaWYgKHdpbi5pc01pbmltaXplZCgpKSB3aW4ucmVzdG9yZSgpO1xuICB3aW4uc2hvdygpO1xuICB3aW4uZm9jdXMoKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHNob3dDb2RleFdpbmRvdyh3aW5kb3dJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHdpbmRvd0lkKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBmYWxzZTtcbiAgd2luLnNob3coKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldE93bFZpZXdDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1widmlld3NcIl0ge1xuICBjb25zdCBwYXJlbnQgPSBnZXRQcmltYXJ5Q29kZXhXaW5kb3coKSA/PyBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgY29uc3QgY29udGVudFZpZXcgPSBhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldztcbiAgbGV0IHNhbXBsZVZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgc2FtcGxlVmlldyA9IG5ldyBCcm93c2VyVmlldyh7IHdlYlByZWZlcmVuY2VzOiB7IHNhbmRib3g6IHRydWUgfSB9KTtcbiAgfSBjYXRjaCB7fVxuICBjb25zdCB3ZWJDb250ZW50c1ZpZXcgPSBhc1JlY29yZChzYW1wbGVWaWV3KT8ud2ViQ29udGVudHNWaWV3O1xuICBjb25zdCBwcml2YXRlVmlld1RyZWUgPSB0eXBlb2YgYXNSZWNvcmQoY29udGVudFZpZXcpPy5hZGRDaGlsZFZpZXcgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgIHR5cGVvZiBhc1JlY29yZChjb250ZW50Vmlldyk/LnJlbW92ZUNoaWxkVmlldyA9PT0gXCJmdW5jdGlvblwiO1xuICBjb25zdCB3ZWJDb250ZW50c1ZpZXdBdmFpbGFibGUgPSBCb29sZWFuKHdlYkNvbnRlbnRzVmlldykgJiZcbiAgICB0eXBlb2YgYXNSZWNvcmQod2ViQ29udGVudHNWaWV3KT8uc2V0Qm91bmRzID09PSBcImZ1bmN0aW9uXCI7XG4gIGNvbnN0IHByaXZhdGVBdHRhY2ggPSBwcml2YXRlVmlld1RyZWUgJiYgd2ViQ29udGVudHNWaWV3QXZhaWxhYmxlO1xuICBjb25zdCBicm93c2VyVmlld0ZhbGxiYWNrID0gdHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LmFkZEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCI7XG4gIHRyeSB7XG4gICAgaWYgKHNhbXBsZVZpZXcgJiYgIXNhbXBsZVZpZXcud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgc2FtcGxlVmlldy53ZWJDb250ZW50cy5jbG9zZSh7IHdhaXRGb3JCZWZvcmVVbmxvYWQ6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxuICByZXR1cm4ge1xuICAgIGNyZWF0ZTogcHJpdmF0ZUF0dGFjaCB8fCBicm93c2VyVmlld0ZhbGxiYWNrLFxuICAgIHByaXZhdGVWaWV3VHJlZTogcHJpdmF0ZUF0dGFjaCxcbiAgICB3ZWJDb250ZW50c1ZpZXc6IHdlYkNvbnRlbnRzVmlld0F2YWlsYWJsZSxcbiAgICBicm93c2VyVmlld0ZhbGxiYWNrLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPd2xWaWV3KFxuICBjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCxcbiAgb3B0czogQ29kZXhWaWV3Q3JlYXRlT3B0aW9ucyxcbik6IFByb21pc2U8Q29kZXhWaWV3UmVmPiB7XG4gIGNvbnN0IGlkID0gYXNzZXJ0QnJpZGdlSWQob3B0cy5pZCA/PyByYW5kb21VVUlEKCksIFwiQ29kZXggdmlldyBpZFwiKTtcbiAgY29uc3Qga2V5ID0gb3dsVmlld0tleShjdHguaWQsIGlkKTtcbiAgaWYgKG93bFZpZXdzLmhhcyhrZXkpKSB0aHJvdyBuZXcgRXJyb3IoYENvZGV4IHZpZXcgYWxyZWFkeSBleGlzdHM6ICR7Y3R4LmlkfToke2lkfWApO1xuXG4gIGNvbnN0IHBhcmVudCA9IHR5cGVvZiBvcHRzLnBhcmVudFdpbmRvd0lkID09PSBcIm51bWJlclwiXG4gICAgPyBCcm93c2VyV2luZG93LmZyb21JZChvcHRzLnBhcmVudFdpbmRvd0lkKVxuICAgIDogZ2V0UHJpbWFyeUNvZGV4V2luZG93KCk7XG4gIGlmICghcGFyZW50IHx8IGlzV2luZG93RGVzdHJveWVkKHBhcmVudCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCB2aWV3IG5lZWRzIGFuIGFjdGl2ZSBwYXJlbnQgd2luZG93XCIpO1xuICB9XG5cbiAgY29uc3Qgc2VydmljZXMgPSBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk7XG4gIGNvbnN0IHdpbmRvd01hbmFnZXIgPSBzZXJ2aWNlcz8ud2luZG93TWFuYWdlcjtcbiAgY29uc3Qgcm91dGUgPSBvcHRzLnJvdXRlID09PSB1bmRlZmluZWQgPyBudWxsIDogbm9ybWFsaXplQ29kZXhSb3V0ZShvcHRzLnJvdXRlKTtcbiAgY29uc3QgaG9zdElkID0gb3B0cy5ob3N0SWQgfHwgXCJsb2NhbFwiO1xuICBjb25zdCB2aWV3ID0gbmV3IEJyb3dzZXJWaWV3KHtcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgcHJlbG9hZDogb3B0cy5yZWdpc3RlcldpdGhDb2RleCA9PT0gZmFsc2UgPyB1bmRlZmluZWQgOiB3aW5kb3dNYW5hZ2VyPy5vcHRpb25zPy5wcmVsb2FkUGF0aCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgc3BlbGxjaGVjazogZmFsc2UsXG4gICAgICBkZXZUb29sczogd2luZG93TWFuYWdlcj8ub3B0aW9ucz8uYWxsb3dEZXZ0b29scyxcbiAgICB9LFxuICB9KTtcblxuICBpZiAob3B0cy5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICBjYWxsT2JqZWN0TWV0aG9kKHZpZXcsIFwic2V0QmFja2dyb3VuZENvbG9yXCIsIFtvcHRzLmJhY2tncm91bmRDb2xvcl0pO1xuICAgIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQodmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRCYWNrZ3JvdW5kQ29sb3JcIiwgW29wdHMuYmFja2dyb3VuZENvbG9yXSk7XG4gIH1cblxuICBjb25zdCBtYW5hZ2VkOiBNYW5hZ2VkT3dsVmlldyA9IHtcbiAgICBrZXksXG4gICAgdHdlYWtJZDogY3R4LmlkLFxuICAgIGlkLFxuICAgIHZpZXcsXG4gICAgcGFyZW50V2luZG93SWQ6IHdpbmRvd0lkRm9yKHBhcmVudCksXG4gICAgYXR0YWNoTW9kZTogbnVsbCxcbiAgICBkaXNwb3NlQmluZGluZ3M6IFtdLFxuICAgIGRpc3Bvc2VkOiBmYWxzZSxcbiAgfTtcbiAgb3dsVmlld3Muc2V0KGtleSwgbWFuYWdlZCk7XG5cbiAgdHJ5IHtcbiAgICBpZiAocm91dGUgIT09IG51bGwgJiYgb3B0cy5yZWdpc3RlcldpdGhDb2RleCAhPT0gZmFsc2UgJiYgd2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cpIHtcbiAgICAgIGNvbnN0IGFwcGVhcmFuY2UgPSBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIjtcbiAgICAgIGNvbnN0IHdpbmRvd0xpa2UgPSBtYWtlV2luZG93TGlrZUZvclZpZXcodmlldyk7XG4gICAgICB3aW5kb3dNYW5hZ2VyLnJlZ2lzdGVyV2luZG93KHdpbmRvd0xpa2UsIGhvc3RJZCwgZmFsc2UsIGFwcGVhcmFuY2UpO1xuICAgICAgc2VydmljZXM/LmdldENvbnRleHQ/Lihob3N0SWQpPy5yZWdpc3RlcldpbmRvdz8uKHdpbmRvd0xpa2UpO1xuICAgIH1cblxuICAgIGF0dGFjaE93bFZpZXcobWFuYWdlZCwgcGFyZW50KTtcbiAgICBpZiAob3B0cy5ib3VuZHMpIHNldE93bFZpZXdCb3VuZHMobWFuYWdlZCwgb3B0cy5ib3VuZHMpO1xuICAgIGlmIChvcHRzLnZpc2libGUgPT09IGZhbHNlKSBzZXRPd2xWaWV3VmlzaWJsZShtYW5hZ2VkLCBmYWxzZSk7XG5cbiAgICBpZiAocm91dGUgIT09IG51bGwpIHtcbiAgICAgIGF3YWl0IHZpZXcud2ViQ29udGVudHMubG9hZFVSTChjb2RleEFwcFVybChyb3V0ZSwgaG9zdElkKSk7XG4gICAgfSBlbHNlIGlmIChvcHRzLnVybCkge1xuICAgICAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKG5vcm1hbGl6ZU93bFZpZXdVcmwob3B0cy51cmwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKFwiYWJvdXQ6YmxhbmtcIik7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgZGlzcG9zZU93bFZpZXcobWFuYWdlZCk7XG4gICAgdGhyb3cgZTtcbiAgfVxuXG4gIGxvZyhcImluZm9cIiwgYGNyZWF0ZWQgT3dsIHZpZXcgJHtjdHguaWR9OiR7aWR9YCwge1xuICAgIHBhcmVudFdpbmRvd0lkOiBtYW5hZ2VkLnBhcmVudFdpbmRvd0lkLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHZpZXcud2ViQ29udGVudHMuaWQsXG4gICAgYXR0YWNoTW9kZTogbWFuYWdlZC5hdHRhY2hNb2RlLFxuICB9KTtcbiAgcmV0dXJuIG93bFZpZXdSZWYobWFuYWdlZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxPd2xWaWV3KFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIGlkOiBzdHJpbmcsXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmc/OiB1bmtub3duLFxuICBhcmcyPzogdW5rbm93bixcbik6IFByb21pc2U8dW5rbm93bj4ge1xuICBjb25zdCB2aWV3ID0gb3dsVmlld0Zvcih0d2Vha0lkLCBpZCk7XG4gIGlmIChtZXRob2QgPT09IFwic2V0Qm91bmRzXCIpIHJldHVybiBzZXRPd2xWaWV3Qm91bmRzKHZpZXcsIGFyZyBhcyBFbGVjdHJvbi5SZWN0YW5nbGUpO1xuICBpZiAobWV0aG9kID09PSBcInNldFZpc2libGVcIikgcmV0dXJuIHNldE93bFZpZXdWaXNpYmxlKHZpZXcsIEJvb2xlYW4oYXJnKSk7XG4gIGlmIChtZXRob2QgPT09IFwiYnJpbmdUb0Zyb250XCIpIHJldHVybiBicmluZ093bFZpZXdUb0Zyb250KHZpZXcpO1xuICBpZiAobWV0aG9kID09PSBcImxvYWRSb3V0ZVwiKSB7XG4gICAgY29uc3Qgcm91dGUgPSBub3JtYWxpemVDb2RleFJvdXRlKFN0cmluZyhhcmcpKTtcbiAgICBjb25zdCBob3N0SWQgPSB0eXBlb2YgYXJnMiA9PT0gXCJzdHJpbmdcIiAmJiBhcmcyID8gYXJnMiA6IFwibG9jYWxcIjtcbiAgICByZXR1cm4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwoY29kZXhBcHBVcmwocm91dGUsIGhvc3RJZCkpO1xuICB9XG4gIGlmIChtZXRob2QgPT09IFwibG9hZFVybFwiKSByZXR1cm4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwobm9ybWFsaXplT3dsVmlld1VybChTdHJpbmcoYXJnKSkpO1xuICBpZiAobWV0aG9kID09PSBcImRpc3Bvc2VcIikgcmV0dXJuIGRpc3Bvc2VPd2xWaWV3QnlJZCh0d2Vha0lkLCBpZCk7XG4gIHRocm93IG5ldyBFcnJvcihgdW5rbm93biBDb2RleCB2aWV3IG1ldGhvZDogJHttZXRob2R9YCk7XG59XG5cbmZ1bmN0aW9uIG93bFZpZXdSZWYodmlldzogTWFuYWdlZE93bFZpZXcpOiBDb2RleFZpZXdSZWYge1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3LmlkLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHZpZXcudmlldy53ZWJDb250ZW50cy5pZCxcbiAgICBwYXJlbnRXaW5kb3dJZDogdmlldy5wYXJlbnRXaW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+IFByb21pc2UucmVzb2x2ZShzZXRPd2xWaWV3Qm91bmRzKHZpZXcsIGJvdW5kcykpLFxuICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PiBQcm9taXNlLnJlc29sdmUoc2V0T3dsVmlld1Zpc2libGUodmlldywgdmlzaWJsZSkpLFxuICAgIGJyaW5nVG9Gcm9udDogKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGJyaW5nT3dsVmlld1RvRnJvbnQodmlldykpLFxuICAgIGxvYWRSb3V0ZTogKHJvdXRlLCBob3N0SWQpID0+IHZpZXcudmlldy53ZWJDb250ZW50cy5sb2FkVVJMKGNvZGV4QXBwVXJsKG5vcm1hbGl6ZUNvZGV4Um91dGUocm91dGUpLCBob3N0SWQgfHwgXCJsb2NhbFwiKSkudGhlbigoKSA9PiB7fSksXG4gICAgbG9hZFVybDogKHVybCkgPT4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwobm9ybWFsaXplT3dsVmlld1VybCh1cmwpKS50aGVuKCgpID0+IHt9KSxcbiAgICBkaXNwb3NlOiAoKSA9PiBQcm9taXNlLnJlc29sdmUoZGlzcG9zZU93bFZpZXdCeUlkKHZpZXcudHdlYWtJZCwgdmlldy5pZCkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBhdHRhY2hPd2xWaWV3KHZpZXc6IE1hbmFnZWRPd2xWaWV3LCBwYXJlbnQ6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFZpZXcgPSBhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldztcbiAgY29uc3Qgd2ViQ29udGVudHNWaWV3ID0gYXNSZWNvcmQodmlldy52aWV3KT8ud2ViQ29udGVudHNWaWV3O1xuICBpZiAodHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LmFkZEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsT2JqZWN0TWV0aG9kKHBhcmVudCwgXCJhZGRCcm93c2VyVmlld1wiLCBbdmlldy52aWV3XSk7XG4gICAgdmlldy5hdHRhY2hNb2RlID0gXCJicm93c2VyVmlld1wiO1xuICB9IGVsc2UgaWYgKFxuICAgIHR5cGVvZiBhc1JlY29yZChjb250ZW50Vmlldyk/LmFkZENoaWxkVmlldyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgd2ViQ29udGVudHNWaWV3XG4gICkge1xuICAgIHRyeSB7XG4gICAgICBhZGRPd2xDaGlsZFZpZXcocGFyZW50LCB2aWV3LnZpZXcpO1xuICAgICAgdmlldy5hdHRhY2hNb2RlID0gXCJjb250ZW50Vmlld1wiO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgY29udGVudFZpZXcgYXR0YWNobWVudCBmYWlsZWQ7IGZhbGxpbmcgYmFjayB0byBCcm93c2VyVmlld1wiLCB7XG4gICAgICAgIHR3ZWFrSWQ6IHZpZXcudHdlYWtJZCxcbiAgICAgICAgdmlld0lkOiB2aWV3LmlkLFxuICAgICAgICBlcnJvcjogU3RyaW5nKGUpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGlmICghdmlldy5hdHRhY2hNb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT3dsIHZpZXcgYXR0YWNobWVudCBpcyBub3QgYXZhaWxhYmxlIG9uIHRoaXMgQ29kZXggd2luZG93XCIpO1xuICB9XG5cbiAgY29uc3QgZGlzcG9zZSA9ICgpID0+IGRpc3Bvc2VPd2xWaWV3QnlJZCh2aWV3LnR3ZWFrSWQsIHZpZXcuaWQpO1xuICBiaW5kV2luZG93RXZlbnQocGFyZW50LCB2aWV3LCBcImNsb3NlZFwiLCBkaXNwb3NlKTtcbiAgYmluZFdpbmRvd0V2ZW50KHBhcmVudCwgdmlldywgXCJjbG9zZVwiLCBkaXNwb3NlKTtcbn1cblxuZnVuY3Rpb24gYnJpbmdPd2xWaWV3VG9Gcm9udCh2aWV3OiBNYW5hZ2VkT3dsVmlldyk6IHZvaWQge1xuICBpZiAodmlldy5kaXNwb3NlZCkgcmV0dXJuO1xuICBjb25zdCBwYXJlbnQgPSB2aWV3LnBhcmVudFdpbmRvd0lkID09PSBudWxsID8gbnVsbCA6IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHZpZXcucGFyZW50V2luZG93SWQpO1xuICBpZiAoIXBhcmVudCB8fCBpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnQpKSByZXR1cm47XG4gIGNvbnN0IGNvbnRlbnRWaWV3ID0gYXNSZWNvcmQocGFyZW50KT8uY29udGVudFZpZXc7XG4gIGNvbnN0IHdlYkNvbnRlbnRzVmlldyA9IGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldztcbiAgaWYgKHZpZXcuYXR0YWNoTW9kZSA9PT0gXCJjb250ZW50Vmlld1wiICYmIHdlYkNvbnRlbnRzVmlldykge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LnNldFRvcEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwic2V0VG9wQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChjb250ZW50VmlldywgXCJhZGRDaGlsZFZpZXdcIiwgW3dlYkNvbnRlbnRzVmlld10pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgY29udGVudFZpZXcgYnJpbmctdG8tZnJvbnQgZmFpbGVkXCIsIHtcbiAgICAgICAgdHdlYWtJZDogdmlldy50d2Vha0lkLFxuICAgICAgICB2aWV3SWQ6IHZpZXcuaWQsXG4gICAgICAgIGVycm9yOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGVvZiBhc1JlY29yZChwYXJlbnQpPy5zZXRUb3BCcm93c2VyVmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwic2V0VG9wQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE93bFZpZXdCb3VuZHModmlldzogTWFuYWdlZE93bFZpZXcsIGJvdW5kczogRWxlY3Ryb24uUmVjdGFuZ2xlKTogdm9pZCB7XG4gIGFzc2VydEJvdW5kcyhib3VuZHMpO1xuICBjYWxsT2JqZWN0TWV0aG9kKHZpZXcudmlldywgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pO1xuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pO1xufVxuXG5mdW5jdGlvbiBzZXRPd2xWaWV3VmlzaWJsZSh2aWV3OiBNYW5hZ2VkT3dsVmlldywgdmlzaWJsZTogYm9vbGVhbik6IHZvaWQge1xuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRWaXNpYmxlXCIsIFt2aXNpYmxlXSk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VPd2xWaWV3QnlJZCh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IG93bFZpZXdzLmdldChvd2xWaWV3S2V5KHR3ZWFrSWQsIGlkKSk7XG4gIGlmICghdmlldykgcmV0dXJuO1xuICBkaXNwb3NlT3dsVmlldyh2aWV3KTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZU93bFZpZXdzRm9yVHdlYWsodHdlYWtJZDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdmlldyBvZiBbLi4ub3dsVmlld3MudmFsdWVzKCldKSB7XG4gICAgaWYgKHZpZXcudHdlYWtJZCA9PT0gdHdlYWtJZCkgZGlzcG9zZU93bFZpZXcodmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcG9zZUFsbE93bFZpZXdzKCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHZpZXcgb2YgWy4uLm93bFZpZXdzLnZhbHVlcygpXSkgZGlzcG9zZU93bFZpZXcodmlldyk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VPd2xWaWV3KHZpZXc6IE1hbmFnZWRPd2xWaWV3KTogdm9pZCB7XG4gIGlmICh2aWV3LmRpc3Bvc2VkKSByZXR1cm47XG4gIHZpZXcuZGlzcG9zZWQgPSB0cnVlO1xuICBvd2xWaWV3cy5kZWxldGUodmlldy5rZXkpO1xuICBmb3IgKGNvbnN0IGRpc3Bvc2Ugb2Ygdmlldy5kaXNwb3NlQmluZGluZ3Muc3BsaWNlKDApKSB7XG4gICAgdHJ5IHtcbiAgICAgIGRpc3Bvc2UoKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgY29uc3QgcGFyZW50ID0gdmlldy5wYXJlbnRXaW5kb3dJZCA9PT0gbnVsbCA/IG51bGwgOiBCcm93c2VyV2luZG93LmZyb21JZCh2aWV3LnBhcmVudFdpbmRvd0lkKTtcbiAgaWYgKHBhcmVudCAmJiAhaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50KSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAodmlldy5hdHRhY2hNb2RlID09PSBcImNvbnRlbnRWaWV3XCIpIHtcbiAgICAgICAgcmVtb3ZlT3dsQ2hpbGRWaWV3KHBhcmVudCwgdmlldy52aWV3KTtcbiAgICAgIH0gZWxzZSBpZiAodmlldy5hdHRhY2hNb2RlID09PSBcImJyb3dzZXJWaWV3XCIpIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwicmVtb3ZlQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgdmlldyBkZXRhY2ggZmFpbGVkIGR1cmluZyBkaXNwb3NlXCIsIHtcbiAgICAgICAgdHdlYWtJZDogdmlldy50d2Vha0lkLFxuICAgICAgICB2aWV3SWQ6IHZpZXcuaWQsXG4gICAgICAgIGVycm9yOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgdHJ5IHtcbiAgICBpZiAoIXZpZXcudmlldy53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICB2aWV3LnZpZXcud2ViQ29udGVudHMuY2xvc2UoeyB3YWl0Rm9yQmVmb3JlVW5sb2FkOiBmYWxzZSB9KTtcbiAgICB9XG4gIH0gY2F0Y2gge31cbn1cblxuZnVuY3Rpb24gb3dsVmlld0Zvcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBNYW5hZ2VkT3dsVmlldyB7XG4gIGNvbnN0IHZpZXcgPSBvd2xWaWV3cy5nZXQob3dsVmlld0tleSh0d2Vha0lkLCBpZCkpO1xuICBpZiAoIXZpZXcgfHwgdmlldy5kaXNwb3NlZCkgdGhyb3cgbmV3IEVycm9yKGBDb2RleCB2aWV3IGlzIG5vdCBsb2FkZWQ6ICR7dHdlYWtJZH06JHtpZH1gKTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmZ1bmN0aW9uIG93bFZpZXdLZXkodHdlYWtJZDogc3RyaW5nLCB2aWV3SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0d2Vha0lkfToke3ZpZXdJZH1gO1xufVxuXG5mdW5jdGlvbiBhZGRPd2xDaGlsZFZpZXcocGFyZW50OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LCBjaGlsZDogRWxlY3Ryb24uQnJvd3NlclZpZXcpOiB2b2lkIHtcbiAgY29uc3Qgb3duZXJXaW5kb3cgPSBhc1JlY29yZChjaGlsZCk/Lm93bmVyV2luZG93O1xuICBpZiAob3duZXJXaW5kb3cgJiYgb3duZXJXaW5kb3cgIT09IHBhcmVudCkge1xuICAgIGNhbGxPYmplY3RNZXRob2Qob3duZXJXaW5kb3csIFwicmVtb3ZlQnJvd3NlclZpZXdcIiwgW2NoaWxkXSk7XG4gIH1cblxuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHBhcmVudCk/LmNvbnRlbnRWaWV3LCBcImFkZENoaWxkVmlld1wiLCBbYXNSZWNvcmQoY2hpbGQpPy53ZWJDb250ZW50c1ZpZXddKTtcbiAgdHJ5IHtcbiAgICAoY2hpbGQgYXMgdW5rbm93biBhcyB7IG93bmVyV2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB9KS5vd25lcldpbmRvdyA9IHBhcmVudDtcbiAgfSBjYXRjaCB7fVxuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKGNoaWxkLndlYkNvbnRlbnRzKSwgXCJfc2V0T3duZXJXaW5kb3dcIiwgW3BhcmVudF0pO1xuXG4gIGNvbnN0IGJyb3dzZXJWaWV3cyA9IGFzUmVjb3JkKHBhcmVudCk/Ll9icm93c2VyVmlld3M7XG4gIGlmIChBcnJheS5pc0FycmF5KGJyb3dzZXJWaWV3cykgJiYgIWJyb3dzZXJWaWV3cy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICBicm93c2VyVmlld3MucHVzaChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlT3dsQ2hpbGRWaWV3KHBhcmVudDogRWxlY3Ryb24uQnJvd3NlcldpbmRvdywgY2hpbGQ6IEVsZWN0cm9uLkJyb3dzZXJWaWV3KTogdm9pZCB7XG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQocGFyZW50KT8uY29udGVudFZpZXcsIFwicmVtb3ZlQ2hpbGRWaWV3XCIsIFthc1JlY29yZChjaGlsZCk/LndlYkNvbnRlbnRzVmlld10pO1xuICB0cnkge1xuICAgIChjaGlsZCBhcyB1bmtub3duIGFzIHsgb3duZXJXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIH0pLm93bmVyV2luZG93ID0gbnVsbDtcbiAgfSBjYXRjaCB7fVxuXG4gIGNvbnN0IGJyb3dzZXJWaWV3cyA9IGFzUmVjb3JkKHBhcmVudCk/Ll9icm93c2VyVmlld3M7XG4gIGlmIChBcnJheS5pc0FycmF5KGJyb3dzZXJWaWV3cykpIHtcbiAgICBjb25zdCBpbmRleCA9IGJyb3dzZXJWaWV3cy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgYnJvd3NlclZpZXdzLnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29kZXhCcm93c2VyVmlldyhvcHRzOiBDb2RleENyZWF0ZVZpZXdPcHRpb25zKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBjb25zdCB3aW5kb3dNYW5hZ2VyID0gc2VydmljZXM/LndpbmRvd01hbmFnZXI7XG4gIGlmICghc2VydmljZXMgfHwgIXdpbmRvd01hbmFnZXI/LnJlZ2lzdGVyV2luZG93KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJDb2RleCBlbWJlZGRlZCB2aWV3IHNlcnZpY2VzIGFyZSBub3QgYXZhaWxhYmxlLiBSZWluc3RhbGwgQ29kZXgrKyAxLjAuMCBvciBsYXRlci5cIixcbiAgICApO1xuICB9XG5cbiAgY29uc3Qgcm91dGUgPSBub3JtYWxpemVDb2RleFJvdXRlKG9wdHMucm91dGUpO1xuICBjb25zdCBob3N0SWQgPSBvcHRzLmhvc3RJZCB8fCBcImxvY2FsXCI7XG4gIGNvbnN0IGFwcGVhcmFuY2UgPSBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIjtcbiAgY29uc3QgdmlldyA9IG5ldyBCcm93c2VyVmlldyh7XG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIHByZWxvYWQ6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8ucHJlbG9hZFBhdGgsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSxcbiAgICAgIHNwZWxsY2hlY2s6IGZhbHNlLFxuICAgICAgZGV2VG9vbHM6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8uYWxsb3dEZXZ0b29scyxcbiAgICB9LFxuICB9KTtcbiAgY29uc3Qgd2luZG93TGlrZSA9IG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3KTtcbiAgd2luZG93TWFuYWdlci5yZWdpc3RlcldpbmRvdyh3aW5kb3dMaWtlLCBob3N0SWQsIGZhbHNlLCBhcHBlYXJhbmNlKTtcbiAgc2VydmljZXMuZ2V0Q29udGV4dD8uKGhvc3RJZCk/LnJlZ2lzdGVyV2luZG93Py4od2luZG93TGlrZSk7XG4gIGF3YWl0IHZpZXcud2ViQ29udGVudHMubG9hZFVSTChjb2RleEFwcFVybChyb3V0ZSwgaG9zdElkKSk7XG4gIHJldHVybiB2aWV3O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb2RleFdpbmRvdyhvcHRzOiBDb2RleENyZWF0ZVdpbmRvd09wdGlvbnMpOiBQcm9taXNlPENvZGV4V2luZG93UmVmPiB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBpZiAoIXNlcnZpY2VzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJDb2RleCB3aW5kb3cgc2VydmljZXMgYXJlIG5vdCBhdmFpbGFibGUuIFJlaW5zdGFsbCBDb2RleCsrIDEuMC4wIG9yIGxhdGVyLlwiLFxuICAgICk7XG4gIH1cblxuICBjb25zdCByb3V0ZSA9IG5vcm1hbGl6ZUNvZGV4Um91dGUob3B0cy5yb3V0ZSk7XG4gIGNvbnN0IGhvc3RJZCA9IG9wdHMuaG9zdElkIHx8IFwibG9jYWxcIjtcbiAgY29uc3QgcGFyZW50ID0gdHlwZW9mIG9wdHMucGFyZW50V2luZG93SWQgPT09IFwibnVtYmVyXCJcbiAgICA/IEJyb3dzZXJXaW5kb3cuZnJvbUlkKG9wdHMucGFyZW50V2luZG93SWQpXG4gICAgOiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgY29uc3QgY3JlYXRlV2luZG93ID0gc2VydmljZXMud2luZG93TWFuYWdlcj8uY3JlYXRlV2luZG93O1xuXG4gIGxldCB3aW46IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBpZiAodHlwZW9mIGNyZWF0ZVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgY3JlYXRlV2luZG93LmNhbGwoc2VydmljZXMud2luZG93TWFuYWdlciwge1xuICAgICAgaW5pdGlhbFJvdXRlOiByb3V0ZSxcbiAgICAgIGhvc3RJZCxcbiAgICAgIHNob3c6IG9wdHMuc2hvdyAhPT0gZmFsc2UsXG4gICAgICBhcHBlYXJhbmNlOiBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIixcbiAgICAgIHBhcmVudCxcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChob3N0SWQgPT09IFwibG9jYWxcIiAmJiB0eXBlb2Ygc2VydmljZXMuY3JlYXRlRnJlc2hXaW5kb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbiA9IGF3YWl0IHNlcnZpY2VzLmNyZWF0ZUZyZXNoV2luZG93KHJvdXRlKTtcbiAgfSBlbHNlIGlmIChob3N0SWQgPT09IFwibG9jYWxcIiAmJiB0eXBlb2Ygc2VydmljZXMuY3JlYXRlRnJlc2hMb2NhbFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgc2VydmljZXMuY3JlYXRlRnJlc2hMb2NhbFdpbmRvdyhyb3V0ZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNlcnZpY2VzLmVuc3VyZUhvc3RXaW5kb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbiA9IGF3YWl0IHNlcnZpY2VzLmVuc3VyZUhvc3RXaW5kb3coaG9zdElkKTtcbiAgfVxuXG4gIGlmICghd2luIHx8IHdpbi5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggZGlkIG5vdCByZXR1cm4gYSB3aW5kb3cgZm9yIHRoZSByZXF1ZXN0ZWQgcm91dGVcIik7XG4gIH1cblxuICBpZiAob3B0cy5ib3VuZHMpIHtcbiAgICB3aW4uc2V0Qm91bmRzKG9wdHMuYm91bmRzKTtcbiAgfVxuICBpZiAocGFyZW50ICYmICFwYXJlbnQuaXNEZXN0cm95ZWQoKSkge1xuICAgIHRyeSB7XG4gICAgICB3aW4uc2V0UGFyZW50V2luZG93KHBhcmVudCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIGlmIChvcHRzLnNob3cgIT09IGZhbHNlKSB7XG4gICAgd2luLnNob3coKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgd2luZG93SWQ6IHdpbi5pZCxcbiAgICB3ZWJDb250ZW50c0lkOiB3aW4ud2ViQ29udGVudHMuaWQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VDb2RleEFwaSh0d2VhazogRGlzY292ZXJlZFR3ZWFrKSB7XG4gIGNvbnN0IGN0eCA9ICgpOiBOYXRpdmVUd2Vha0NvbnRleHQgPT4gKHsgaWQ6IHR3ZWFrLm1hbmlmZXN0LmlkLCBkaXI6IHR3ZWFrLmRpciB9KTtcbiAgcmV0dXJuIHtcbiAgICBydW50aW1lOiB7XG4gICAgICBnZXRJbmZvOiBhc3luYyAoKSA9PiBjdXJyZW50UnVudGltZUluZm8oKSxcbiAgICAgIGdldENhcGFiaWxpdGllczogYXN5bmMgKCkgPT4gY3VycmVudFJ1bnRpbWVDYXBhYmlsaXRpZXMoKSxcbiAgICB9LFxuICAgIHdpbmRvd3M6IHtcbiAgICAgIGNyZWF0ZTogY3JlYXRlQ29kZXhXaW5kb3csXG4gICAgICBnZXRQcmltYXJ5OiBhc3luYyAoKSA9PiBnZXRQcmltYXJ5Q29kZXhXaW5kb3dSZWYoKSxcbiAgICAgIGZvY3VzOiBhc3luYyAod2luZG93SWQ6IG51bWJlcikgPT4gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZCksXG4gICAgICBzaG93OiBhc3luYyAod2luZG93SWQ6IG51bWJlcikgPT4gc2hvd0NvZGV4V2luZG93KHdpbmRvd0lkKSxcbiAgICB9LFxuICAgIHZpZXdzOiB7XG4gICAgICBjcmVhdGU6IGFzeW5jIChvcHRpb25zOiBDb2RleFZpZXdDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb24odHdlYWspO1xuICAgICAgICByZXR1cm4gY3JlYXRlT3dsVmlldyhjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY2RwOiB7XG4gICAgICBnZXRTdGF0dXM6IGFzeW5jICgpID0+IGdldENkcFN0YXR1cygpLFxuICAgICAgbGlzdFRhcmdldHM6IGFzeW5jICgpID0+IGxpc3RDZHBUYXJnZXRzKCksXG4gICAgfSxcbiAgICBuYXRpdmU6IHtcbiAgICAgIGxvYWRNb2R1bGU6IGFzeW5jIChvcHRpb25zOiBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLW1vZHVsZVwiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5sb2FkTW9kdWxlKGN0eCgpLCBvcHRpb25zKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVQYW5lbDogYXN5bmMgKG9wdGlvbnM6IE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLXZpZXdcIik7XG4gICAgICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuY3JlYXRlUGFuZWwoY3R4KCksIG9wdGlvbnMpO1xuICAgICAgfSxcbiAgICAgIGF0dGFjaFZpZXc6IGFzeW5jIChvcHRpb25zOiBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLXZpZXdcIik7XG4gICAgICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuYXR0YWNoVmlldyhjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgICAgbGF1bmNoSGVscGVyOiBhc3luYyAob3B0aW9uczogTmF0aXZlSGVscGVyTGF1bmNoT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLWhlbHBlclwiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5sYXVuY2hIZWxwZXIoY3R4KCksIG9wdGlvbnMpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIGNyZWF0ZUJyb3dzZXJWaWV3OiBjcmVhdGVDb2RleEJyb3dzZXJWaWV3LFxuICAgIGNyZWF0ZVdpbmRvdzogY3JlYXRlQ29kZXhXaW5kb3csXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldyk6IENvZGV4V2luZG93TGlrZSB7XG4gIGNvbnN0IHZpZXdCb3VuZHMgPSAoKSA9PiB2aWV3LmdldEJvdW5kcygpO1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3LndlYkNvbnRlbnRzLmlkLFxuICAgIHdlYkNvbnRlbnRzOiB2aWV3LndlYkNvbnRlbnRzLFxuICAgIG9uOiAoZXZlbnQ6IFwiY2xvc2VkXCIsIGxpc3RlbmVyOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICBpZiAoZXZlbnQgPT09IFwiY2xvc2VkXCIpIHtcbiAgICAgICAgdmlldy53ZWJDb250ZW50cy5vbmNlKFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcud2ViQ29udGVudHMub24oZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgb25jZTogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLm9uY2UoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBvZmY6IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgdmlldy53ZWJDb250ZW50cy5vZmYoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcjogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50IGFzIFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgaXNEZXN0cm95ZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSxcbiAgICBpc0ZvY3VzZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNGb2N1c2VkKCksXG4gICAgZm9jdXM6ICgpID0+IHZpZXcud2ViQ29udGVudHMuZm9jdXMoKSxcbiAgICBzaG93OiAoKSA9PiB7fSxcbiAgICBoaWRlOiAoKSA9PiB7fSxcbiAgICBnZXRCb3VuZHM6IHZpZXdCb3VuZHMsXG4gICAgZ2V0Q29udGVudEJvdW5kczogdmlld0JvdW5kcyxcbiAgICBnZXRTaXplOiAoKSA9PiB7XG4gICAgICBjb25zdCBiID0gdmlld0JvdW5kcygpO1xuICAgICAgcmV0dXJuIFtiLndpZHRoLCBiLmhlaWdodF07XG4gICAgfSxcbiAgICBnZXRDb250ZW50U2l6ZTogKCkgPT4ge1xuICAgICAgY29uc3QgYiA9IHZpZXdCb3VuZHMoKTtcbiAgICAgIHJldHVybiBbYi53aWR0aCwgYi5oZWlnaHRdO1xuICAgIH0sXG4gICAgc2V0VGl0bGU6ICgpID0+IHt9LFxuICAgIGdldFRpdGxlOiAoKSA9PiBcIlwiLFxuICAgIHNldFJlcHJlc2VudGVkRmlsZW5hbWU6ICgpID0+IHt9LFxuICAgIHNldERvY3VtZW50RWRpdGVkOiAoKSA9PiB7fSxcbiAgICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5OiAoKSA9PiB7fSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29kZXhBcHBVcmwocm91dGU6IHN0cmluZywgaG9zdElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFwiYXBwOi8vLS9pbmRleC5odG1sXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcImhvc3RJZFwiLCBob3N0SWQpO1xuICBpZiAocm91dGUgIT09IFwiL1wiKSB1cmwuc2VhcmNoUGFyYW1zLnNldChcImluaXRpYWxSb3V0ZVwiLCByb3V0ZSk7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT3dsVmlld1VybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdXJsICE9PSBcInN0cmluZ1wiIHx8IHVybC5pbmNsdWRlcyhcIlxcblwiKSB8fCB1cmwuaW5jbHVkZXMoXCJcXHJcIikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPd2wgdmlldyBVUkwgbXVzdCBiZSBhIHN0cmluZyB3aXRob3V0IGNvbnRyb2wgY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XG4gIGlmICghW1wiaHR0cDpcIiwgXCJodHRwczpcIiwgXCJhcHA6XCIsIFwiZmlsZTpcIiwgXCJkYXRhOlwiLCBcImFib3V0OlwiXS5pbmNsdWRlcyhwYXJzZWQucHJvdG9jb2wpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBPd2wgdmlldyBVUkwgcHJvdG9jb2w6ICR7cGFyc2VkLnByb3RvY29sfWApO1xuICB9XG4gIHJldHVybiBwYXJzZWQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpOiBDb2RleFdpbmRvd1NlcnZpY2VzIHwgbnVsbCB7XG4gIGNvbnN0IHNlcnZpY2VzID0gKGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilbQ09ERVhfV0lORE9XX1NFUlZJQ0VTX0tFWV07XG4gIHJldHVybiBzZXJ2aWNlcyAmJiB0eXBlb2Ygc2VydmljZXMgPT09IFwib2JqZWN0XCIgPyAoc2VydmljZXMgYXMgQ29kZXhXaW5kb3dTZXJ2aWNlcykgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb2RleFJvdXRlKHJvdXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHJvdXRlICE9PSBcInN0cmluZ1wiIHx8ICFyb3V0ZS5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJvdXRlIG11c3QgYmUgYW4gYWJzb2x1dGUgYXBwIHJvdXRlXCIpO1xuICB9XG4gIGlmIChyb3V0ZS5pbmNsdWRlcyhcIjovL1wiKSB8fCByb3V0ZS5pbmNsdWRlcyhcIlxcblwiKSB8fCByb3V0ZS5pbmNsdWRlcyhcIlxcclwiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJvdXRlIG11c3Qgbm90IGluY2x1ZGUgYSBwcm90b2NvbCBvciBjb250cm9sIGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgcmV0dXJuIHJvdXRlO1xufVxuXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGNhbGxPYmplY3RNZXRob2QodGFyZ2V0OiB1bmtub3duLCBtZXRob2Q6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogdW5rbm93biB7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQodGFyZ2V0KT8uW21ldGhvZF07XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIGZuLmFwcGx5KHRhcmdldCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGlzV2luZG93RGVzdHJveWVkKHdpbjogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgaWYgKCF3aW4pIHJldHVybiB0cnVlO1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHdpbik/LmlzRGVzdHJveWVkO1xuICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gQm9vbGVhbihmbi5jYWxsKHdpbikpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3aW5kb3dJZEZvcih3aW46IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gYXNSZWNvcmQod2luKT8uaWQ7XG4gIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGJpbmRXaW5kb3dFdmVudChcbiAgd2luOiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LFxuICB2aWV3OiBNYW5hZ2VkT3dsVmlldyxcbiAgZXZlbnQ6IHN0cmluZyxcbiAgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQsXG4pOiB2b2lkIHtcbiAgY29uc3Qgb24gPSBhc1JlY29yZCh3aW4pPy5vbjtcbiAgY29uc3Qgb2ZmID0gYXNSZWNvcmQod2luKT8ub2ZmO1xuICBpZiAodHlwZW9mIG9uICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybjtcbiAgb24uY2FsbCh3aW4sIGV2ZW50LCBsaXN0ZW5lcik7XG4gIHZpZXcuZGlzcG9zZUJpbmRpbmdzLnB1c2goKCkgPT4ge1xuICAgIGlmICh0eXBlb2Ygb2ZmID09PSBcImZ1bmN0aW9uXCIpIG9mZi5jYWxsKHdpbiwgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICBlbHNlIGNhbGxPYmplY3RNZXRob2Qod2luLCBcInJlbW92ZUxpc3RlbmVyXCIsIFtldmVudCwgbGlzdGVuZXJdKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEJyaWRnZUlkKHZhbHVlOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2xhYmVsfSBtYXkgb25seSBjb250YWluIGxldHRlcnMsIG51bWJlcnMsIGRvdHMsIHVuZGVyc2NvcmVzLCBhbmQgZGFzaGVzYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRCb3VuZHMoYm91bmRzOiBFbGVjdHJvbi5SZWN0YW5nbGUpOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzID0gW2JvdW5kcz8ueCwgYm91bmRzPy55LCBib3VuZHM/LndpZHRoLCBib3VuZHM/LmhlaWdodF07XG4gIGlmICghdmFsdWVzLmV2ZXJ5KCh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmRzIG11c3QgY29udGFpbiBmaW5pdGUgeCwgeSwgd2lkdGgsIGFuZCBoZWlnaHQgbnVtYmVyc1wiKTtcbiAgfVxuICBpZiAoYm91bmRzLndpZHRoIDwgMCB8fCBib3VuZHMuaGVpZ2h0IDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kcyB3aWR0aCBhbmQgaGVpZ2h0IG11c3QgYmUgbm9uLW5lZ2F0aXZlXCIpO1xuICB9XG59XG5cbi8vIFRvdWNoIEJyb3dzZXJXaW5kb3cgdG8ga2VlcCBpdHMgaW1wb3J0IFx1MjAxNCBvbGRlciBFbGVjdHJvbiBsaW50IHJ1bGVzLlxudm9pZCBCcm93c2VyV2luZG93O1xuIiwgIi8qISBjaG9raWRhciAtIE1JVCBMaWNlbnNlIChjKSAyMDEyIFBhdWwgTWlsbGVyIChwYXVsbWlsbHIuY29tKSAqL1xuaW1wb3J0IHsgc3RhdCBhcyBzdGF0Y2IgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBzdGF0LCByZWFkZGlyIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCAqIGFzIHN5c1BhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkZGlycCB9IGZyb20gJ3JlYWRkaXJwJztcbmltcG9ydCB7IE5vZGVGc0hhbmRsZXIsIEVWRU5UUyBhcyBFViwgaXNXaW5kb3dzLCBpc0lCTWksIEVNUFRZX0ZOLCBTVFJfQ0xPU0UsIFNUUl9FTkQsIH0gZnJvbSAnLi9oYW5kbGVyLmpzJztcbmNvbnN0IFNMQVNIID0gJy8nO1xuY29uc3QgU0xBU0hfU0xBU0ggPSAnLy8nO1xuY29uc3QgT05FX0RPVCA9ICcuJztcbmNvbnN0IFRXT19ET1RTID0gJy4uJztcbmNvbnN0IFNUUklOR19UWVBFID0gJ3N0cmluZyc7XG5jb25zdCBCQUNLX1NMQVNIX1JFID0gL1xcXFwvZztcbmNvbnN0IERPVUJMRV9TTEFTSF9SRSA9IC9cXC9cXC8vO1xuY29uc3QgRE9UX1JFID0gL1xcLi4qXFwuKHN3W3B4XSkkfH4kfFxcLnN1YmwuKlxcLnRtcC87XG5jb25zdCBSRVBMQUNFUl9SRSA9IC9eXFwuWy9cXFxcXS87XG5mdW5jdGlvbiBhcnJpZnkoaXRlbSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGl0ZW0pID8gaXRlbSA6IFtpdGVtXTtcbn1cbmNvbnN0IGlzTWF0Y2hlck9iamVjdCA9IChtYXRjaGVyKSA9PiB0eXBlb2YgbWF0Y2hlciA9PT0gJ29iamVjdCcgJiYgbWF0Y2hlciAhPT0gbnVsbCAmJiAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApO1xuZnVuY3Rpb24gY3JlYXRlUGF0dGVybihtYXRjaGVyKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdzdHJpbmcnKVxuICAgICAgICByZXR1cm4gKHN0cmluZykgPT4gbWF0Y2hlciA9PT0gc3RyaW5nO1xuICAgIGlmIChtYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgICByZXR1cm4gKHN0cmluZykgPT4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSAnb2JqZWN0JyAmJiBtYXRjaGVyICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAoc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobWF0Y2hlci5wYXRoID09PSBzdHJpbmcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAobWF0Y2hlci5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZWxhdGl2ZSA9IHN5c1BhdGgucmVsYXRpdmUobWF0Y2hlci5wYXRoLCBzdHJpbmcpO1xuICAgICAgICAgICAgICAgIGlmICghcmVsYXRpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gIXJlbGF0aXZlLnN0YXJ0c1dpdGgoJy4uJykgJiYgIXN5c1BhdGguaXNBYnNvbHV0ZShyZWxhdGl2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBmYWxzZTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocGF0aCkge1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignc3RyaW5nIGV4cGVjdGVkJyk7XG4gICAgcGF0aCA9IHN5c1BhdGgubm9ybWFsaXplKHBhdGgpO1xuICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICBsZXQgcHJlcGVuZCA9IGZhbHNlO1xuICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoJy8vJykpXG4gICAgICAgIHByZXBlbmQgPSB0cnVlO1xuICAgIGNvbnN0IERPVUJMRV9TTEFTSF9SRSA9IC9cXC9cXC8vO1xuICAgIHdoaWxlIChwYXRoLm1hdGNoKERPVUJMRV9TTEFTSF9SRSkpXG4gICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoRE9VQkxFX1NMQVNIX1JFLCAnLycpO1xuICAgIGlmIChwcmVwZW5kKVxuICAgICAgICBwYXRoID0gJy8nICsgcGF0aDtcbiAgICByZXR1cm4gcGF0aDtcbn1cbmZ1bmN0aW9uIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcsIHN0YXRzKSB7XG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgodGVzdFN0cmluZyk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHBhdHRlcm5zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gcGF0dGVybnNbaW5kZXhdO1xuICAgICAgICBpZiAocGF0dGVybihwYXRoLCBzdGF0cykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGFueW1hdGNoKG1hdGNoZXJzLCB0ZXN0U3RyaW5nKSB7XG4gICAgaWYgKG1hdGNoZXJzID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYW55bWF0Y2g6IHNwZWNpZnkgZmlyc3QgYXJndW1lbnQnKTtcbiAgICB9XG4gICAgLy8gRWFybHkgY2FjaGUgZm9yIG1hdGNoZXJzLlxuICAgIGNvbnN0IG1hdGNoZXJzQXJyYXkgPSBhcnJpZnkobWF0Y2hlcnMpO1xuICAgIGNvbnN0IHBhdHRlcm5zID0gbWF0Y2hlcnNBcnJheS5tYXAoKG1hdGNoZXIpID0+IGNyZWF0ZVBhdHRlcm4obWF0Y2hlcikpO1xuICAgIGlmICh0ZXN0U3RyaW5nID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICh0ZXN0U3RyaW5nLCBzdGF0cykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcsIHN0YXRzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcpO1xufVxuY29uc3QgdW5pZnlQYXRocyA9IChwYXRoc18pID0+IHtcbiAgICBjb25zdCBwYXRocyA9IGFycmlmeShwYXRoc18pLmZsYXQoKTtcbiAgICBpZiAoIXBhdGhzLmV2ZXJ5KChwKSA9PiB0eXBlb2YgcCA9PT0gU1RSSU5HX1RZUEUpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYE5vbi1zdHJpbmcgcHJvdmlkZWQgYXMgd2F0Y2ggcGF0aDogJHtwYXRoc31gKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGhzLm1hcChub3JtYWxpemVQYXRoVG9Vbml4KTtcbn07XG4vLyBJZiBTTEFTSF9TTEFTSCBvY2N1cnMgYXQgdGhlIGJlZ2lubmluZyBvZiBwYXRoLCBpdCBpcyBub3QgcmVwbGFjZWRcbi8vICAgICBiZWNhdXNlIFwiLy9TdG9yYWdlUEMvRHJpdmVQb29sL01vdmllc1wiIGlzIGEgdmFsaWQgbmV0d29yayBwYXRoXG5jb25zdCB0b1VuaXggPSAoc3RyaW5nKSA9PiB7XG4gICAgbGV0IHN0ciA9IHN0cmluZy5yZXBsYWNlKEJBQ0tfU0xBU0hfUkUsIFNMQVNIKTtcbiAgICBsZXQgcHJlcGVuZCA9IGZhbHNlO1xuICAgIGlmIChzdHIuc3RhcnRzV2l0aChTTEFTSF9TTEFTSCkpIHtcbiAgICAgICAgcHJlcGVuZCA9IHRydWU7XG4gICAgfVxuICAgIHdoaWxlIChzdHIubWF0Y2goRE9VQkxFX1NMQVNIX1JFKSkge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShET1VCTEVfU0xBU0hfUkUsIFNMQVNIKTtcbiAgICB9XG4gICAgaWYgKHByZXBlbmQpIHtcbiAgICAgICAgc3RyID0gU0xBU0ggKyBzdHI7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuLy8gT3VyIHZlcnNpb24gb2YgdXBhdGgubm9ybWFsaXplXG4vLyBUT0RPOiB0aGlzIGlzIG5vdCBlcXVhbCB0byBwYXRoLW5vcm1hbGl6ZSBtb2R1bGUgLSBpbnZlc3RpZ2F0ZSB3aHlcbmNvbnN0IG5vcm1hbGl6ZVBhdGhUb1VuaXggPSAocGF0aCkgPT4gdG9Vbml4KHN5c1BhdGgubm9ybWFsaXplKHRvVW5peChwYXRoKSkpO1xuLy8gVE9ETzogcmVmYWN0b3JcbmNvbnN0IG5vcm1hbGl6ZUlnbm9yZWQgPSAoY3dkID0gJycpID0+IChwYXRoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplUGF0aFRvVW5peChzeXNQYXRoLmlzQWJzb2x1dGUocGF0aCkgPyBwYXRoIDogc3lzUGF0aC5qb2luKGN3ZCwgcGF0aCkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxufTtcbmNvbnN0IGdldEFic29sdXRlUGF0aCA9IChwYXRoLCBjd2QpID0+IHtcbiAgICBpZiAoc3lzUGF0aC5pc0Fic29sdXRlKHBhdGgpKSB7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cbiAgICByZXR1cm4gc3lzUGF0aC5qb2luKGN3ZCwgcGF0aCk7XG59O1xuY29uc3QgRU1QVFlfU0VUID0gT2JqZWN0LmZyZWV6ZShuZXcgU2V0KCkpO1xuLyoqXG4gKiBEaXJlY3RvcnkgZW50cnkuXG4gKi9cbmNsYXNzIERpckVudHJ5IHtcbiAgICBjb25zdHJ1Y3RvcihkaXIsIHJlbW92ZVdhdGNoZXIpIHtcbiAgICAgICAgdGhpcy5wYXRoID0gZGlyO1xuICAgICAgICB0aGlzLl9yZW1vdmVXYXRjaGVyID0gcmVtb3ZlV2F0Y2hlcjtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBTZXQoKTtcbiAgICB9XG4gICAgYWRkKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGl0ZW0gIT09IE9ORV9ET1QgJiYgaXRlbSAhPT0gVFdPX0RPVFMpXG4gICAgICAgICAgICBpdGVtcy5hZGQoaXRlbSk7XG4gICAgfVxuICAgIGFzeW5jIHJlbW92ZShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGl0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgICAgICAgaWYgKGl0ZW1zLnNpemUgPiAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLnBhdGg7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkZGlyKGRpcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlbW92ZVdhdGNoZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVXYXRjaGVyKHN5c1BhdGguZGlybmFtZShkaXIpLCBzeXNQYXRoLmJhc2VuYW1lKGRpcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhhcyhpdGVtKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJldHVybiBpdGVtcy5oYXMoaXRlbSk7XG4gICAgfVxuICAgIGdldENoaWxkcmVuKCkge1xuICAgICAgICBjb25zdCB7IGl0ZW1zIH0gPSB0aGlzO1xuICAgICAgICBpZiAoIWl0ZW1zKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gWy4uLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5pdGVtcy5jbGVhcigpO1xuICAgICAgICB0aGlzLnBhdGggPSAnJztcbiAgICAgICAgdGhpcy5fcmVtb3ZlV2F0Y2hlciA9IEVNUFRZX0ZOO1xuICAgICAgICB0aGlzLml0ZW1zID0gRU1QVFlfU0VUO1xuICAgICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xuICAgIH1cbn1cbmNvbnN0IFNUQVRfTUVUSE9EX0YgPSAnc3RhdCc7XG5jb25zdCBTVEFUX01FVEhPRF9MID0gJ2xzdGF0JztcbmV4cG9ydCBjbGFzcyBXYXRjaEhlbHBlciB7XG4gICAgY29uc3RydWN0b3IocGF0aCwgZm9sbG93LCBmc3cpIHtcbiAgICAgICAgdGhpcy5mc3cgPSBmc3c7XG4gICAgICAgIGNvbnN0IHdhdGNoUGF0aCA9IHBhdGg7XG4gICAgICAgIHRoaXMucGF0aCA9IHBhdGggPSBwYXRoLnJlcGxhY2UoUkVQTEFDRVJfUkUsICcnKTtcbiAgICAgICAgdGhpcy53YXRjaFBhdGggPSB3YXRjaFBhdGg7XG4gICAgICAgIHRoaXMuZnVsbFdhdGNoUGF0aCA9IHN5c1BhdGgucmVzb2x2ZSh3YXRjaFBhdGgpO1xuICAgICAgICB0aGlzLmRpclBhcnRzID0gW107XG4gICAgICAgIHRoaXMuZGlyUGFydHMuZm9yRWFjaCgocGFydHMpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgIHBhcnRzLnBvcCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5mb2xsb3dTeW1saW5rcyA9IGZvbGxvdztcbiAgICAgICAgdGhpcy5zdGF0TWV0aG9kID0gZm9sbG93ID8gU1RBVF9NRVRIT0RfRiA6IFNUQVRfTUVUSE9EX0w7XG4gICAgfVxuICAgIGVudHJ5UGF0aChlbnRyeSkge1xuICAgICAgICByZXR1cm4gc3lzUGF0aC5qb2luKHRoaXMud2F0Y2hQYXRoLCBzeXNQYXRoLnJlbGF0aXZlKHRoaXMud2F0Y2hQYXRoLCBlbnRyeS5mdWxsUGF0aCkpO1xuICAgIH1cbiAgICBmaWx0ZXJQYXRoKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHsgc3RhdHMgfSA9IGVudHJ5O1xuICAgICAgICBpZiAoc3RhdHMgJiYgc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlckRpcihlbnRyeSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuZW50cnlQYXRoKGVudHJ5KTtcbiAgICAgICAgLy8gVE9ETzogd2hhdCBpZiBzdGF0cyBpcyB1bmRlZmluZWQ/IHJlbW92ZSAhXG4gICAgICAgIHJldHVybiB0aGlzLmZzdy5faXNudElnbm9yZWQocmVzb2x2ZWRQYXRoLCBzdGF0cykgJiYgdGhpcy5mc3cuX2hhc1JlYWRQZXJtaXNzaW9ucyhzdGF0cyk7XG4gICAgfVxuICAgIGZpbHRlckRpcihlbnRyeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5mc3cuX2lzbnRJZ25vcmVkKHRoaXMuZW50cnlQYXRoKGVudHJ5KSwgZW50cnkuc3RhdHMpO1xuICAgIH1cbn1cbi8qKlxuICogV2F0Y2hlcyBmaWxlcyAmIGRpcmVjdG9yaWVzIGZvciBjaGFuZ2VzLiBFbWl0dGVkIGV2ZW50czpcbiAqIGBhZGRgLCBgYWRkRGlyYCwgYGNoYW5nZWAsIGB1bmxpbmtgLCBgdW5saW5rRGlyYCwgYGFsbGAsIGBlcnJvcmBcbiAqXG4gKiAgICAgbmV3IEZTV2F0Y2hlcigpXG4gKiAgICAgICAuYWRkKGRpcmVjdG9yaWVzKVxuICogICAgICAgLm9uKCdhZGQnLCBwYXRoID0+IGxvZygnRmlsZScsIHBhdGgsICd3YXMgYWRkZWQnKSlcbiAqL1xuZXhwb3J0IGNsYXNzIEZTV2F0Y2hlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgLy8gTm90IGluZGVudGluZyBtZXRob2RzIGZvciBoaXN0b3J5IHNha2U7IGZvciBub3cuXG4gICAgY29uc3RydWN0b3IoX29wdHMgPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jbG9zZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX3Rocm90dGxlZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fc3ltbGlua1BhdGhzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl93YXRjaGVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9wZW5kaW5nV3JpdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVW5saW5rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fcmVhZHlDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3JlYWR5RW1pdHRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBhd2YgPSBfb3B0cy5hd2FpdFdyaXRlRmluaXNoO1xuICAgICAgICBjb25zdCBERUZfQVdGID0geyBzdGFiaWxpdHlUaHJlc2hvbGQ6IDIwMDAsIHBvbGxJbnRlcnZhbDogMTAwIH07XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0c1xuICAgICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZUluaXRpYWw6IGZhbHNlLFxuICAgICAgICAgICAgaWdub3JlUGVybWlzc2lvbkVycm9yczogZmFsc2UsXG4gICAgICAgICAgICBpbnRlcnZhbDogMTAwLFxuICAgICAgICAgICAgYmluYXJ5SW50ZXJ2YWw6IDMwMCxcbiAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiB0cnVlLFxuICAgICAgICAgICAgdXNlUG9sbGluZzogZmFsc2UsXG4gICAgICAgICAgICAvLyB1c2VBc3luYzogZmFsc2UsXG4gICAgICAgICAgICBhdG9taWM6IHRydWUsIC8vIE5PVEU6IG92ZXJ3cml0dGVuIGxhdGVyIChkZXBlbmRzIG9uIHVzZVBvbGxpbmcpXG4gICAgICAgICAgICAuLi5fb3B0cyxcbiAgICAgICAgICAgIC8vIENoYW5nZSBmb3JtYXRcbiAgICAgICAgICAgIGlnbm9yZWQ6IF9vcHRzLmlnbm9yZWQgPyBhcnJpZnkoX29wdHMuaWdub3JlZCkgOiBhcnJpZnkoW10pLFxuICAgICAgICAgICAgYXdhaXRXcml0ZUZpbmlzaDogYXdmID09PSB0cnVlID8gREVGX0FXRiA6IHR5cGVvZiBhd2YgPT09ICdvYmplY3QnID8geyAuLi5ERUZfQVdGLCAuLi5hd2YgfSA6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgICAvLyBBbHdheXMgZGVmYXVsdCB0byBwb2xsaW5nIG9uIElCTSBpIGJlY2F1c2UgZnMud2F0Y2goKSBpcyBub3QgYXZhaWxhYmxlIG9uIElCTSBpLlxuICAgICAgICBpZiAoaXNJQk1pKVxuICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgLy8gRWRpdG9yIGF0b21pYyB3cml0ZSBub3JtYWxpemF0aW9uIGVuYWJsZWQgYnkgZGVmYXVsdCB3aXRoIGZzLndhdGNoXG4gICAgICAgIGlmIChvcHRzLmF0b21pYyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgb3B0cy5hdG9taWMgPSAhb3B0cy51c2VQb2xsaW5nO1xuICAgICAgICAvLyBvcHRzLmF0b21pYyA9IHR5cGVvZiBfb3B0cy5hdG9taWMgPT09ICdudW1iZXInID8gX29wdHMuYXRvbWljIDogMTAwO1xuICAgICAgICAvLyBHbG9iYWwgb3ZlcnJpZGUuIFVzZWZ1bCBmb3IgZGV2ZWxvcGVycywgd2hvIG5lZWQgdG8gZm9yY2UgcG9sbGluZyBmb3IgYWxsXG4gICAgICAgIC8vIGluc3RhbmNlcyBvZiBjaG9raWRhciwgcmVnYXJkbGVzcyBvZiB1c2FnZSAvIGRlcGVuZGVuY3kgZGVwdGhcbiAgICAgICAgY29uc3QgZW52UG9sbCA9IHByb2Nlc3MuZW52LkNIT0tJREFSX1VTRVBPTExJTkc7XG4gICAgICAgIGlmIChlbnZQb2xsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVudkxvd2VyID0gZW52UG9sbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGVudkxvd2VyID09PSAnZmFsc2UnIHx8IGVudkxvd2VyID09PSAnMCcpXG4gICAgICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBlbHNlIGlmIChlbnZMb3dlciA9PT0gJ3RydWUnIHx8IGVudkxvd2VyID09PSAnMScpXG4gICAgICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcHRzLnVzZVBvbGxpbmcgPSAhIWVudkxvd2VyO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudkludGVydmFsID0gcHJvY2Vzcy5lbnYuQ0hPS0lEQVJfSU5URVJWQUw7XG4gICAgICAgIGlmIChlbnZJbnRlcnZhbClcbiAgICAgICAgICAgIG9wdHMuaW50ZXJ2YWwgPSBOdW1iZXIucGFyc2VJbnQoZW52SW50ZXJ2YWwsIDEwKTtcbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIHRvIGVtaXQgcmVhZHkgb25seSBvbmNlLCBidXQgZWFjaCAnYWRkJyB3aWxsIGluY3JlYXNlIHRoYXQ/XG4gICAgICAgIGxldCByZWFkeUNhbGxzID0gMDtcbiAgICAgICAgdGhpcy5fZW1pdFJlYWR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgcmVhZHlDYWxscysrO1xuICAgICAgICAgICAgaWYgKHJlYWR5Q2FsbHMgPj0gdGhpcy5fcmVhZHlDb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXRSZWFkeSA9IEVNUFRZX0ZOO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlYWR5RW1pdHRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gdXNlIHByb2Nlc3MubmV4dFRpY2sgdG8gYWxsb3cgdGltZSBmb3IgbGlzdGVuZXIgdG8gYmUgYm91bmRcbiAgICAgICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHRoaXMuZW1pdChFVi5SRUFEWSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9lbWl0UmF3ID0gKC4uLmFyZ3MpID0+IHRoaXMuZW1pdChFVi5SQVcsIC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLl9ib3VuZFJlbW92ZSA9IHRoaXMuX3JlbW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRzO1xuICAgICAgICB0aGlzLl9ub2RlRnNIYW5kbGVyID0gbmV3IE5vZGVGc0hhbmRsZXIodGhpcyk7XG4gICAgICAgIC8vIFlvdVx1MjAxOXJlIGZyb3plbiB3aGVuIHlvdXIgaGVhcnRcdTIwMTlzIG5vdCBvcGVuLlxuICAgICAgICBPYmplY3QuZnJlZXplKG9wdHMpO1xuICAgIH1cbiAgICBfYWRkSWdub3JlZFBhdGgobWF0Y2hlcikge1xuICAgICAgICBpZiAoaXNNYXRjaGVyT2JqZWN0KG1hdGNoZXIpKSB7XG4gICAgICAgICAgICAvLyByZXR1cm4gZWFybHkgaWYgd2UgYWxyZWFkeSBoYXZlIGEgZGVlcGx5IGVxdWFsIG1hdGNoZXIgb2JqZWN0XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlnbm9yZWQgb2YgdGhpcy5faWdub3JlZFBhdGhzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2hlck9iamVjdChpZ25vcmVkKSAmJlxuICAgICAgICAgICAgICAgICAgICBpZ25vcmVkLnBhdGggPT09IG1hdGNoZXIucGF0aCAmJlxuICAgICAgICAgICAgICAgICAgICBpZ25vcmVkLnJlY3Vyc2l2ZSA9PT0gbWF0Y2hlci5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMuYWRkKG1hdGNoZXIpO1xuICAgIH1cbiAgICBfcmVtb3ZlSWdub3JlZFBhdGgobWF0Y2hlcikge1xuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMuZGVsZXRlKG1hdGNoZXIpO1xuICAgICAgICAvLyBub3cgZmluZCBhbnkgbWF0Y2hlciBvYmplY3RzIHdpdGggdGhlIG1hdGNoZXIgYXMgcGF0aFxuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlnbm9yZWQgb2YgdGhpcy5faWdub3JlZFBhdGhzKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyAoNDMwODFqKTogbWFrZSB0aGlzIG1vcmUgZWZmaWNpZW50LlxuICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IGp1c3QgbWFrZSBhIGB0aGlzLl9pZ25vcmVkRGlyZWN0b3JpZXNgIG9yIHNvbWVcbiAgICAgICAgICAgICAgICAvLyBzdWNoIHRoaW5nLlxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoZXJPYmplY3QoaWdub3JlZCkgJiYgaWdub3JlZC5wYXRoID09PSBtYXRjaGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lnbm9yZWRQYXRocy5kZWxldGUoaWdub3JlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFB1YmxpYyBtZXRob2RzXG4gICAgLyoqXG4gICAgICogQWRkcyBwYXRocyB0byBiZSB3YXRjaGVkIG9uIGFuIGV4aXN0aW5nIEZTV2F0Y2hlciBpbnN0YW5jZS5cbiAgICAgKiBAcGFyYW0gcGF0aHNfIGZpbGUgb3IgZmlsZSBsaXN0LiBPdGhlciBhcmd1bWVudHMgYXJlIHVudXNlZFxuICAgICAqL1xuICAgIGFkZChwYXRoc18sIF9vcmlnQWRkLCBfaW50ZXJuYWwpIHtcbiAgICAgICAgY29uc3QgeyBjd2QgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdGhpcy5jbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY2xvc2VQcm9taXNlID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgcGF0aHMgPSB1bmlmeVBhdGhzKHBhdGhzXyk7XG4gICAgICAgIGlmIChjd2QpIHtcbiAgICAgICAgICAgIHBhdGhzID0gcGF0aHMubWFwKChwYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWJzUGF0aCA9IGdldEFic29sdXRlUGF0aChwYXRoLCBjd2QpO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGBwYXRoYCBpbnN0ZWFkIG9mIGBhYnNQYXRoYCBiZWNhdXNlIHRoZSBjd2QgcG9ydGlvbiBjYW4ndCBiZSBhIGdsb2JcbiAgICAgICAgICAgICAgICByZXR1cm4gYWJzUGF0aDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUlnbm9yZWRQYXRoKHBhdGgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghdGhpcy5fcmVhZHlDb3VudClcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5Q291bnQgPSAwO1xuICAgICAgICB0aGlzLl9yZWFkeUNvdW50ICs9IHBhdGhzLmxlbmd0aDtcbiAgICAgICAgUHJvbWlzZS5hbGwocGF0aHMubWFwKGFzeW5jIChwYXRoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLl9ub2RlRnNIYW5kbGVyLl9hZGRUb05vZGVGcyhwYXRoLCAhX2ludGVybmFsLCB1bmRlZmluZWQsIDAsIF9vcmlnQWRkKTtcbiAgICAgICAgICAgIGlmIChyZXMpXG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdFJlYWR5KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xvc2VkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChzeXNQYXRoLmRpcm5hbWUoaXRlbSksIHN5c1BhdGguYmFzZW5hbWUoX29yaWdBZGQgfHwgaXRlbSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2Ugd2F0Y2hlcnMgb3Igc3RhcnQgaWdub3JpbmcgZXZlbnRzIGZyb20gc3BlY2lmaWVkIHBhdGhzLlxuICAgICAqL1xuICAgIHVud2F0Y2gocGF0aHNfKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjb25zdCBwYXRocyA9IHVuaWZ5UGF0aHMocGF0aHNfKTtcbiAgICAgICAgY29uc3QgeyBjd2QgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuICAgICAgICAgICAgLy8gY29udmVydCB0byBhYnNvbHV0ZSBwYXRoIHVubGVzcyByZWxhdGl2ZSBwYXRoIGFscmVhZHkgbWF0Y2hlc1xuICAgICAgICAgICAgaWYgKCFzeXNQYXRoLmlzQWJzb2x1dGUocGF0aCkgJiYgIXRoaXMuX2Nsb3NlcnMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN3ZClcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGguam9pbihjd2QsIHBhdGgpO1xuICAgICAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jbG9zZVBhdGgocGF0aCk7XG4gICAgICAgICAgICB0aGlzLl9hZGRJZ25vcmVkUGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl93YXRjaGVkLmhhcyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZElnbm9yZWRQYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIGNhY2hlZCB1c2VySWdub3JlZCBhbnltYXRjaCBmblxuICAgICAgICAgICAgLy8gdG8gbWFrZSBpZ25vcmVkUGF0aHMgY2hhbmdlcyBlZmZlY3RpdmVcbiAgICAgICAgICAgIHRoaXMuX3VzZXJJZ25vcmVkID0gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlIHdhdGNoZXJzIGFuZCByZW1vdmUgYWxsIGxpc3RlbmVycyBmcm9tIHdhdGNoZWQgcGF0aHMuXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZVByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZVByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgICAgICAvLyBNZW1vcnkgbWFuYWdlbWVudC5cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgY29uc3QgY2xvc2VycyA9IFtdO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmZvckVhY2goKGNsb3Nlckxpc3QpID0+IGNsb3Nlckxpc3QuZm9yRWFjaCgoY2xvc2VyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gY2xvc2VyKCk7XG4gICAgICAgICAgICBpZiAocHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpXG4gICAgICAgICAgICAgICAgY2xvc2Vycy5wdXNoKHByb21pc2UpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX3N0cmVhbXMuZm9yRWFjaCgoc3RyZWFtKSA9PiBzdHJlYW0uZGVzdHJveSgpKTtcbiAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3JlYWR5Q291bnQgPSAwO1xuICAgICAgICB0aGlzLl9yZWFkeUVtaXR0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fd2F0Y2hlZC5mb3JFYWNoKChkaXJlbnQpID0+IGRpcmVudC5kaXNwb3NlKCkpO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zeW1saW5rUGF0aHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2Nsb3NlUHJvbWlzZSA9IGNsb3NlcnMubGVuZ3RoXG4gICAgICAgICAgICA/IFByb21pc2UuYWxsKGNsb3NlcnMpLnRoZW4oKCkgPT4gdW5kZWZpbmVkKVxuICAgICAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlUHJvbWlzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhwb3NlIGxpc3Qgb2Ygd2F0Y2hlZCBwYXRoc1xuICAgICAqIEByZXR1cm5zIGZvciBjaGFpbmluZ1xuICAgICAqL1xuICAgIGdldFdhdGNoZWQoKSB7XG4gICAgICAgIGNvbnN0IHdhdGNoTGlzdCA9IHt9O1xuICAgICAgICB0aGlzLl93YXRjaGVkLmZvckVhY2goKGVudHJ5LCBkaXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMub3B0aW9ucy5jd2QgPyBzeXNQYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5jd2QsIGRpcikgOiBkaXI7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGtleSB8fCBPTkVfRE9UO1xuICAgICAgICAgICAgd2F0Y2hMaXN0W2luZGV4XSA9IGVudHJ5LmdldENoaWxkcmVuKCkuc29ydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHdhdGNoTGlzdDtcbiAgICB9XG4gICAgZW1pdFdpdGhBbGwoZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICAgICAgaWYgKGV2ZW50ICE9PSBFVi5FUlJPUilcbiAgICAgICAgICAgIHRoaXMuZW1pdChFVi5BTEwsIGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uIGhlbHBlcnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLVxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBhbmQgZW1pdCBldmVudHMuXG4gICAgICogQ2FsbGluZyBfZW1pdCBET0VTIE5PVCBNRUFOIGVtaXQoKSB3b3VsZCBiZSBjYWxsZWQhXG4gICAgICogQHBhcmFtIGV2ZW50IFR5cGUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0gcGF0aCBGaWxlIG9yIGRpcmVjdG9yeSBwYXRoXG4gICAgICogQHBhcmFtIHN0YXRzIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgd2l0aCBldmVudFxuICAgICAqIEByZXR1cm5zIHRoZSBlcnJvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIHZhbHVlIG9mIHRoZSBGU1dhdGNoZXIgaW5zdGFuY2UncyBgY2xvc2VkYCBmbGFnXG4gICAgICovXG4gICAgYXN5bmMgX2VtaXQoZXZlbnQsIHBhdGgsIHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgaWYgKGlzV2luZG93cylcbiAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLm5vcm1hbGl6ZShwYXRoKTtcbiAgICAgICAgaWYgKG9wdHMuY3dkKVxuICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGgucmVsYXRpdmUob3B0cy5jd2QsIHBhdGgpO1xuICAgICAgICBjb25zdCBhcmdzID0gW3BhdGhdO1xuICAgICAgICBpZiAoc3RhdHMgIT0gbnVsbClcbiAgICAgICAgICAgIGFyZ3MucHVzaChzdGF0cyk7XG4gICAgICAgIGNvbnN0IGF3ZiA9IG9wdHMuYXdhaXRXcml0ZUZpbmlzaDtcbiAgICAgICAgbGV0IHB3O1xuICAgICAgICBpZiAoYXdmICYmIChwdyA9IHRoaXMuX3BlbmRpbmdXcml0ZXMuZ2V0KHBhdGgpKSkge1xuICAgICAgICAgICAgcHcubGFzdENoYW5nZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5hdG9taWMpIHtcbiAgICAgICAgICAgIGlmIChldmVudCA9PT0gRVYuVU5MSU5LKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1VubGlua3Muc2V0KHBhdGgsIFtldmVudCwgLi4uYXJnc10pO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nVW5saW5rcy5mb3JFYWNoKChlbnRyeSwgcGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KC4uLmVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFVi5BTEwsIC4uLmVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgdHlwZW9mIG9wdHMuYXRvbWljID09PSAnbnVtYmVyJyA/IG9wdHMuYXRvbWljIDogMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudCA9PT0gRVYuQUREICYmIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmhhcyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50ID0gRVYuQ0hBTkdFO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYXdmICYmIChldmVudCA9PT0gRVYuQUREIHx8IGV2ZW50ID09PSBFVi5DSEFOR0UpICYmIHRoaXMuX3JlYWR5RW1pdHRlZCkge1xuICAgICAgICAgICAgY29uc3QgYXdmRW1pdCA9IChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IEVWLkVSUk9SO1xuICAgICAgICAgICAgICAgICAgICBhcmdzWzBdID0gZXJyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRXaXRoQWxsKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgc3RhdHMgZG9lc24ndCBleGlzdCB0aGUgZmlsZSBtdXN0IGhhdmUgYmVlbiBkZWxldGVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0gPSBzdGF0cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChzdGF0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0V2l0aEFsbChldmVudCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2F3YWl0V3JpdGVGaW5pc2gocGF0aCwgYXdmLnN0YWJpbGl0eVRocmVzaG9sZCwgZXZlbnQsIGF3ZkVtaXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5DSEFOR0UpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVGhyb3R0bGVkID0gIXRoaXMuX3Rocm90dGxlKEVWLkNIQU5HRSwgcGF0aCwgNTApO1xuICAgICAgICAgICAgaWYgKGlzVGhyb3R0bGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLmFsd2F5c1N0YXQgJiZcbiAgICAgICAgICAgIHN0YXRzID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIChldmVudCA9PT0gRVYuQUREIHx8IGV2ZW50ID09PSBFVi5BRERfRElSIHx8IGV2ZW50ID09PSBFVi5DSEFOR0UpKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IG9wdHMuY3dkID8gc3lzUGF0aC5qb2luKG9wdHMuY3dkLCBwYXRoKSA6IHBhdGg7XG4gICAgICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3VwcHJlc3MgZXZlbnQgd2hlbiBmc19zdGF0IGZhaWxzLCB0byBhdm9pZCBzZW5kaW5nIHVuZGVmaW5lZCAnc3RhdCdcbiAgICAgICAgICAgIGlmICghc3RhdHMgfHwgdGhpcy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgYXJncy5wdXNoKHN0YXRzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXRXaXRoQWxsKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbW1vbiBoYW5kbGVyIGZvciBlcnJvcnNcbiAgICAgKiBAcmV0dXJucyBUaGUgZXJyb3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSB2YWx1ZSBvZiB0aGUgRlNXYXRjaGVyIGluc3RhbmNlJ3MgYGNsb3NlZGAgZmxhZ1xuICAgICAqL1xuICAgIF9oYW5kbGVFcnJvcihlcnJvcikge1xuICAgICAgICBjb25zdCBjb2RlID0gZXJyb3IgJiYgZXJyb3IuY29kZTtcbiAgICAgICAgaWYgKGVycm9yICYmXG4gICAgICAgICAgICBjb2RlICE9PSAnRU5PRU5UJyAmJlxuICAgICAgICAgICAgY29kZSAhPT0gJ0VOT1RESVInICYmXG4gICAgICAgICAgICAoIXRoaXMub3B0aW9ucy5pZ25vcmVQZXJtaXNzaW9uRXJyb3JzIHx8IChjb2RlICE9PSAnRVBFUk0nICYmIGNvZGUgIT09ICdFQUNDRVMnKSkpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFVi5FUlJPUiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlcnJvciB8fCB0aGlzLmNsb3NlZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGVscGVyIHV0aWxpdHkgZm9yIHRocm90dGxpbmdcbiAgICAgKiBAcGFyYW0gYWN0aW9uVHlwZSB0eXBlIGJlaW5nIHRocm90dGxlZFxuICAgICAqIEBwYXJhbSBwYXRoIGJlaW5nIGFjdGVkIHVwb25cbiAgICAgKiBAcGFyYW0gdGltZW91dCBkdXJhdGlvbiBvZiB0aW1lIHRvIHN1cHByZXNzIGR1cGxpY2F0ZSBhY3Rpb25zXG4gICAgICogQHJldHVybnMgdHJhY2tpbmcgb2JqZWN0IG9yIGZhbHNlIGlmIGFjdGlvbiBzaG91bGQgYmUgc3VwcHJlc3NlZFxuICAgICAqL1xuICAgIF90aHJvdHRsZShhY3Rpb25UeXBlLCBwYXRoLCB0aW1lb3V0KSB7XG4gICAgICAgIGlmICghdGhpcy5fdGhyb3R0bGVkLmhhcyhhY3Rpb25UeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5fdGhyb3R0bGVkLnNldChhY3Rpb25UeXBlLCBuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuX3Rocm90dGxlZC5nZXQoYWN0aW9uVHlwZSk7XG4gICAgICAgIGlmICghYWN0aW9uKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHRocm90dGxlJyk7XG4gICAgICAgIGNvbnN0IGFjdGlvblBhdGggPSBhY3Rpb24uZ2V0KHBhdGgpO1xuICAgICAgICBpZiAoYWN0aW9uUGF0aCkge1xuICAgICAgICAgICAgYWN0aW9uUGF0aC5jb3VudCsrO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItY29uc3RcbiAgICAgICAgbGV0IHRpbWVvdXRPYmplY3Q7XG4gICAgICAgIGNvbnN0IGNsZWFyID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGFjdGlvbi5nZXQocGF0aCk7XG4gICAgICAgICAgICBjb25zdCBjb3VudCA9IGl0ZW0gPyBpdGVtLmNvdW50IDogMDtcbiAgICAgICAgICAgIGFjdGlvbi5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dE9iamVjdCk7XG4gICAgICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaXRlbS50aW1lb3V0T2JqZWN0KTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgICAgfTtcbiAgICAgICAgdGltZW91dE9iamVjdCA9IHNldFRpbWVvdXQoY2xlYXIsIHRpbWVvdXQpO1xuICAgICAgICBjb25zdCB0aHIgPSB7IHRpbWVvdXRPYmplY3QsIGNsZWFyLCBjb3VudDogMCB9O1xuICAgICAgICBhY3Rpb24uc2V0KHBhdGgsIHRocik7XG4gICAgICAgIHJldHVybiB0aHI7XG4gICAgfVxuICAgIF9pbmNyUmVhZHlDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWR5Q291bnQrKztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXdhaXRzIHdyaXRlIG9wZXJhdGlvbiB0byBmaW5pc2guXG4gICAgICogUG9sbHMgYSBuZXdseSBjcmVhdGVkIGZpbGUgZm9yIHNpemUgdmFyaWF0aW9ucy4gV2hlbiBmaWxlcyBzaXplIGRvZXMgbm90IGNoYW5nZSBmb3IgJ3RocmVzaG9sZCcgbWlsbGlzZWNvbmRzIGNhbGxzIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSBwYXRoIGJlaW5nIGFjdGVkIHVwb25cbiAgICAgKiBAcGFyYW0gdGhyZXNob2xkIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGEgZmlsZSBzaXplIG11c3QgYmUgZml4ZWQgYmVmb3JlIGFja25vd2xlZGdpbmcgd3JpdGUgT1AgaXMgZmluaXNoZWRcbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gYXdmRW1pdCBDYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiByZWFkeSBmb3IgZXZlbnQgdG8gYmUgZW1pdHRlZC5cbiAgICAgKi9cbiAgICBfYXdhaXRXcml0ZUZpbmlzaChwYXRoLCB0aHJlc2hvbGQsIGV2ZW50LCBhd2ZFbWl0KSB7XG4gICAgICAgIGNvbnN0IGF3ZiA9IHRoaXMub3B0aW9ucy5hd2FpdFdyaXRlRmluaXNoO1xuICAgICAgICBpZiAodHlwZW9mIGF3ZiAhPT0gJ29iamVjdCcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHBvbGxJbnRlcnZhbCA9IGF3Zi5wb2xsSW50ZXJ2YWw7XG4gICAgICAgIGxldCB0aW1lb3V0SGFuZGxlcjtcbiAgICAgICAgbGV0IGZ1bGxQYXRoID0gcGF0aDtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jd2QgJiYgIXN5c1BhdGguaXNBYnNvbHV0ZShwYXRoKSkge1xuICAgICAgICAgICAgZnVsbFBhdGggPSBzeXNQYXRoLmpvaW4odGhpcy5vcHRpb25zLmN3ZCwgcGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3Qgd3JpdGVzID0gdGhpcy5fcGVuZGluZ1dyaXRlcztcbiAgICAgICAgZnVuY3Rpb24gYXdhaXRXcml0ZUZpbmlzaEZuKHByZXZTdGF0KSB7XG4gICAgICAgICAgICBzdGF0Y2IoZnVsbFBhdGgsIChlcnIsIGN1clN0YXQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF3cml0ZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXdmRW1pdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IE51bWJlcihuZXcgRGF0ZSgpKTtcbiAgICAgICAgICAgICAgICBpZiAocHJldlN0YXQgJiYgY3VyU3RhdC5zaXplICE9PSBwcmV2U3RhdC5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlcy5nZXQocGF0aCkubGFzdENoYW5nZSA9IG5vdztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcHcgPSB3cml0ZXMuZ2V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRmID0gbm93IC0gcHcubGFzdENoYW5nZTtcbiAgICAgICAgICAgICAgICBpZiAoZGYgPj0gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlcy5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGF3ZkVtaXQodW5kZWZpbmVkLCBjdXJTdGF0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRIYW5kbGVyID0gc2V0VGltZW91dChhd2FpdFdyaXRlRmluaXNoRm4sIHBvbGxJbnRlcnZhbCwgY3VyU3RhdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3cml0ZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICB3cml0ZXMuc2V0KHBhdGgsIHtcbiAgICAgICAgICAgICAgICBsYXN0Q2hhbmdlOiBub3csXG4gICAgICAgICAgICAgICAgY2FuY2VsV2FpdDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZXMuZGVsZXRlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQ7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGltZW91dEhhbmRsZXIgPSBzZXRUaW1lb3V0KGF3YWl0V3JpdGVGaW5pc2hGbiwgcG9sbEludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdXNlciBoYXMgYXNrZWQgdG8gaWdub3JlIHRoaXMgcGF0aC5cbiAgICAgKi9cbiAgICBfaXNJZ25vcmVkKHBhdGgsIHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXRvbWljICYmIERPVF9SRS50ZXN0KHBhdGgpKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICghdGhpcy5fdXNlcklnbm9yZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgY3dkIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICBjb25zdCBpZ24gPSB0aGlzLm9wdGlvbnMuaWdub3JlZDtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWQgPSAoaWduIHx8IFtdKS5tYXAobm9ybWFsaXplSWdub3JlZChjd2QpKTtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWRQYXRocyA9IFsuLi50aGlzLl9pZ25vcmVkUGF0aHNdO1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IFsuLi5pZ25vcmVkUGF0aHMubWFwKG5vcm1hbGl6ZUlnbm9yZWQoY3dkKSksIC4uLmlnbm9yZWRdO1xuICAgICAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSBhbnltYXRjaChsaXN0LCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91c2VySWdub3JlZChwYXRoLCBzdGF0cyk7XG4gICAgfVxuICAgIF9pc250SWdub3JlZChwYXRoLCBzdGF0KSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5faXNJZ25vcmVkKHBhdGgsIHN0YXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIHNldCBvZiBjb21tb24gaGVscGVycyBhbmQgcHJvcGVydGllcyByZWxhdGluZyB0byBzeW1saW5rIGhhbmRsaW5nLlxuICAgICAqIEBwYXJhbSBwYXRoIGZpbGUgb3IgZGlyZWN0b3J5IHBhdHRlcm4gYmVpbmcgd2F0Y2hlZFxuICAgICAqL1xuICAgIF9nZXRXYXRjaEhlbHBlcnMocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IFdhdGNoSGVscGVyKHBhdGgsIHRoaXMub3B0aW9ucy5mb2xsb3dTeW1saW5rcywgdGhpcyk7XG4gICAgfVxuICAgIC8vIERpcmVjdG9yeSBoZWxwZXJzXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBkaXJlY3RvcnkgdHJhY2tpbmcgb2JqZWN0c1xuICAgICAqIEBwYXJhbSBkaXJlY3RvcnkgcGF0aCBvZiB0aGUgZGlyZWN0b3J5XG4gICAgICovXG4gICAgX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHN5c1BhdGgucmVzb2x2ZShkaXJlY3RvcnkpO1xuICAgICAgICBpZiAoIXRoaXMuX3dhdGNoZWQuaGFzKGRpcikpXG4gICAgICAgICAgICB0aGlzLl93YXRjaGVkLnNldChkaXIsIG5ldyBEaXJFbnRyeShkaXIsIHRoaXMuX2JvdW5kUmVtb3ZlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl93YXRjaGVkLmdldChkaXIpO1xuICAgIH1cbiAgICAvLyBGaWxlIGhlbHBlcnNcbiAgICAvLyAtLS0tLS0tLS0tLS1cbiAgICAvKipcbiAgICAgKiBDaGVjayBmb3IgcmVhZCBwZXJtaXNzaW9uczogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzExNzgxNDA0LzEzNTg0MDVcbiAgICAgKi9cbiAgICBfaGFzUmVhZFBlcm1pc3Npb25zKHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlUGVybWlzc2lvbkVycm9ycylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gQm9vbGVhbihOdW1iZXIoc3RhdHMubW9kZSkgJiAwbzQwMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZW1pdHRpbmcgdW5saW5rIGV2ZW50cyBmb3JcbiAgICAgKiBmaWxlcyBhbmQgZGlyZWN0b3JpZXMsIGFuZCB2aWEgcmVjdXJzaW9uLCBmb3JcbiAgICAgKiBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgd2l0aGluIGRpcmVjdG9yaWVzIHRoYXQgYXJlIHVubGlua2VkXG4gICAgICogQHBhcmFtIGRpcmVjdG9yeSB3aXRoaW4gd2hpY2ggdGhlIGZvbGxvd2luZyBpdGVtIGlzIGxvY2F0ZWRcbiAgICAgKiBAcGFyYW0gaXRlbSAgICAgIGJhc2UgcGF0aCBvZiBpdGVtL2RpcmVjdG9yeVxuICAgICAqL1xuICAgIF9yZW1vdmUoZGlyZWN0b3J5LCBpdGVtLCBpc0RpcmVjdG9yeSkge1xuICAgICAgICAvLyBpZiB3aGF0IGlzIGJlaW5nIGRlbGV0ZWQgaXMgYSBkaXJlY3RvcnksIGdldCB0aGF0IGRpcmVjdG9yeSdzIHBhdGhzXG4gICAgICAgIC8vIGZvciByZWN1cnNpdmUgZGVsZXRpbmcgYW5kIGNsZWFuaW5nIG9mIHdhdGNoZWQgb2JqZWN0XG4gICAgICAgIC8vIGlmIGl0IGlzIG5vdCBhIGRpcmVjdG9yeSwgbmVzdGVkRGlyZWN0b3J5Q2hpbGRyZW4gd2lsbCBiZSBlbXB0eSBhcnJheVxuICAgICAgICBjb25zdCBwYXRoID0gc3lzUGF0aC5qb2luKGRpcmVjdG9yeSwgaXRlbSk7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgICAgICBpc0RpcmVjdG9yeSA9XG4gICAgICAgICAgICBpc0RpcmVjdG9yeSAhPSBudWxsID8gaXNEaXJlY3RvcnkgOiB0aGlzLl93YXRjaGVkLmhhcyhwYXRoKSB8fCB0aGlzLl93YXRjaGVkLmhhcyhmdWxsUGF0aCk7XG4gICAgICAgIC8vIHByZXZlbnQgZHVwbGljYXRlIGhhbmRsaW5nIGluIGNhc2Ugb2YgYXJyaXZpbmcgaGVyZSBuZWFybHkgc2ltdWx0YW5lb3VzbHlcbiAgICAgICAgLy8gdmlhIG11bHRpcGxlIHBhdGhzIChzdWNoIGFzIF9oYW5kbGVGaWxlIGFuZCBfaGFuZGxlRGlyKVxuICAgICAgICBpZiAoIXRoaXMuX3Rocm90dGxlKCdyZW1vdmUnLCBwYXRoLCAxMDApKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyBpZiB0aGUgb25seSB3YXRjaGVkIGZpbGUgaXMgcmVtb3ZlZCwgd2F0Y2ggZm9yIGl0cyByZXR1cm5cbiAgICAgICAgaWYgKCFpc0RpcmVjdG9yeSAmJiB0aGlzLl93YXRjaGVkLnNpemUgPT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkKGRpcmVjdG9yeSwgaXRlbSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBlbnRyeSBpbiB0aGUgd2F0Y2hlZCBvYmplY3QgaW4gZWl0aGVyIGNhc2VcbiAgICAgICAgLy8gc28gd2UgZ290IHRvIGRvIHRoZSBkaXJlY3RvcnkgY2hlY2sgYmVmb3JlaGFuZFxuICAgICAgICBjb25zdCB3cCA9IHRoaXMuX2dldFdhdGNoZWREaXIocGF0aCk7XG4gICAgICAgIGNvbnN0IG5lc3RlZERpcmVjdG9yeUNoaWxkcmVuID0gd3AuZ2V0Q2hpbGRyZW4oKTtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgcmVtb3ZlIGNoaWxkcmVuIGRpcmVjdG9yaWVzIC8gZmlsZXMuXG4gICAgICAgIG5lc3RlZERpcmVjdG9yeUNoaWxkcmVuLmZvckVhY2goKG5lc3RlZCkgPT4gdGhpcy5fcmVtb3ZlKHBhdGgsIG5lc3RlZCkpO1xuICAgICAgICAvLyBDaGVjayBpZiBpdGVtIHdhcyBvbiB0aGUgd2F0Y2hlZCBsaXN0IGFuZCByZW1vdmUgaXRcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZ2V0V2F0Y2hlZERpcihkaXJlY3RvcnkpO1xuICAgICAgICBjb25zdCB3YXNUcmFja2VkID0gcGFyZW50LmhhcyhpdGVtKTtcbiAgICAgICAgcGFyZW50LnJlbW92ZShpdGVtKTtcbiAgICAgICAgLy8gRml4ZXMgaXNzdWUgIzEwNDIgLT4gUmVsYXRpdmUgcGF0aHMgd2VyZSBkZXRlY3RlZCBhbmQgYWRkZWQgYXMgc3ltbGlua3NcbiAgICAgICAgLy8gKGh0dHBzOi8vZ2l0aHViLmNvbS9wYXVsbWlsbHIvY2hva2lkYXIvYmxvYi9lMTc1M2RkYmM5NTcxYmRjMzNiNGE0YWYxNzJkNTJjYjZlNjExYzEwL2xpYi9ub2RlZnMtaGFuZGxlci5qcyNMNjEyKSxcbiAgICAgICAgLy8gYnV0IG5ldmVyIHJlbW92ZWQgZnJvbSB0aGUgbWFwIGluIGNhc2UgdGhlIHBhdGggd2FzIGRlbGV0ZWQuXG4gICAgICAgIC8vIFRoaXMgbGVhZHMgdG8gYW4gaW5jb3JyZWN0IHN0YXRlIGlmIHRoZSBwYXRoIHdhcyByZWNyZWF0ZWQ6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wYXVsbWlsbHIvY2hva2lkYXIvYmxvYi9lMTc1M2RkYmM5NTcxYmRjMzNiNGE0YWYxNzJkNTJjYjZlNjExYzEwL2xpYi9ub2RlZnMtaGFuZGxlci5qcyNMNTUzXG4gICAgICAgIGlmICh0aGlzLl9zeW1saW5rUGF0aHMuaGFzKGZ1bGxQYXRoKSkge1xuICAgICAgICAgICAgdGhpcy5fc3ltbGlua1BhdGhzLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgd2Ugd2FpdCBmb3IgdGhpcyBmaWxlIHRvIGJlIGZ1bGx5IHdyaXR0ZW4sIGNhbmNlbCB0aGUgd2FpdC5cbiAgICAgICAgbGV0IHJlbFBhdGggPSBwYXRoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmN3ZClcbiAgICAgICAgICAgIHJlbFBhdGggPSBzeXNQYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5jd2QsIHBhdGgpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF3YWl0V3JpdGVGaW5pc2ggJiYgdGhpcy5fcGVuZGluZ1dyaXRlcy5oYXMocmVsUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fcGVuZGluZ1dyaXRlcy5nZXQocmVsUGF0aCkuY2FuY2VsV2FpdCgpO1xuICAgICAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5BREQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBFbnRyeSB3aWxsIGVpdGhlciBiZSBhIGRpcmVjdG9yeSB0aGF0IGp1c3QgZ290IHJlbW92ZWRcbiAgICAgICAgLy8gb3IgYSBib2d1cyBlbnRyeSB0byBhIGZpbGUsIGluIGVpdGhlciBjYXNlIHdlIGhhdmUgdG8gcmVtb3ZlIGl0XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuZGVsZXRlKHBhdGgpO1xuICAgICAgICB0aGlzLl93YXRjaGVkLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGlzRGlyZWN0b3J5ID8gRVYuVU5MSU5LX0RJUiA6IEVWLlVOTElOSztcbiAgICAgICAgaWYgKHdhc1RyYWNrZWQgJiYgIXRoaXMuX2lzSWdub3JlZChwYXRoKSlcbiAgICAgICAgICAgIHRoaXMuX2VtaXQoZXZlbnROYW1lLCBwYXRoKTtcbiAgICAgICAgLy8gQXZvaWQgY29uZmxpY3RzIGlmIHdlIGxhdGVyIGNyZWF0ZSBhbm90aGVyIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lXG4gICAgICAgIHRoaXMuX2Nsb3NlUGF0aChwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIGFsbCB3YXRjaGVycyBmb3IgYSBwYXRoXG4gICAgICovXG4gICAgX2Nsb3NlUGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMuX2Nsb3NlRmlsZShwYXRoKTtcbiAgICAgICAgY29uc3QgZGlyID0gc3lzUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgICB0aGlzLl9nZXRXYXRjaGVkRGlyKGRpcikucmVtb3ZlKHN5c1BhdGguYmFzZW5hbWUocGF0aCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgb25seSBmaWxlLXNwZWNpZmljIHdhdGNoZXJzXG4gICAgICovXG4gICAgX2Nsb3NlRmlsZShwYXRoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlcnMgPSB0aGlzLl9jbG9zZXJzLmdldChwYXRoKTtcbiAgICAgICAgaWYgKCFjbG9zZXJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjbG9zZXJzLmZvckVhY2goKGNsb3NlcikgPT4gY2xvc2VyKCkpO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmRlbGV0ZShwYXRoKTtcbiAgICB9XG4gICAgX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKSB7XG4gICAgICAgIGlmICghY2xvc2VyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuX2Nsb3NlcnMuZ2V0KHBhdGgpO1xuICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICAgIGxpc3QgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlcnMuc2V0KHBhdGgsIGxpc3QpO1xuICAgICAgICB9XG4gICAgICAgIGxpc3QucHVzaChjbG9zZXIpO1xuICAgIH1cbiAgICBfcmVhZGRpcnAocm9vdCwgb3B0cykge1xuICAgICAgICBpZiAodGhpcy5jbG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IHR5cGU6IEVWLkFMTCwgYWx3YXlzU3RhdDogdHJ1ZSwgbHN0YXQ6IHRydWUsIC4uLm9wdHMsIGRlcHRoOiAwIH07XG4gICAgICAgIGxldCBzdHJlYW0gPSByZWFkZGlycChyb290LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcy5hZGQoc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLm9uY2UoU1RSX0NMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0ub25jZShTVFJfRU5ELCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RyZWFtcy5kZWxldGUoc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH1cbn1cbi8qKlxuICogSW5zdGFudGlhdGVzIHdhdGNoZXIgd2l0aCBwYXRocyB0byBiZSB0cmFja2VkLlxuICogQHBhcmFtIHBhdGhzIGZpbGUgLyBkaXJlY3RvcnkgcGF0aHNcbiAqIEBwYXJhbSBvcHRpb25zIG9wdHMsIHN1Y2ggYXMgYGF0b21pY2AsIGBhd2FpdFdyaXRlRmluaXNoYCwgYGlnbm9yZWRgLCBhbmQgb3RoZXJzXG4gKiBAcmV0dXJucyBhbiBpbnN0YW5jZSBvZiBGU1dhdGNoZXIgZm9yIGNoYWluaW5nLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0IHdhdGNoZXIgPSB3YXRjaCgnLicpLm9uKCdhbGwnLCAoZXZlbnQsIHBhdGgpID0+IHsgY29uc29sZS5sb2coZXZlbnQsIHBhdGgpOyB9KTtcbiAqIHdhdGNoKCcuJywgeyBhdG9taWM6IHRydWUsIGF3YWl0V3JpdGVGaW5pc2g6IHRydWUsIGlnbm9yZWQ6IChmLCBzdGF0cykgPT4gc3RhdHM/LmlzRmlsZSgpICYmICFmLmVuZHNXaXRoKCcuanMnKSB9KVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2F0Y2gocGF0aHMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHdhdGNoZXIgPSBuZXcgRlNXYXRjaGVyKG9wdGlvbnMpO1xuICAgIHdhdGNoZXIuYWRkKHBhdGhzKTtcbiAgICByZXR1cm4gd2F0Y2hlcjtcbn1cbmV4cG9ydCBkZWZhdWx0IHsgd2F0Y2gsIEZTV2F0Y2hlciB9O1xuIiwgImltcG9ydCB7IHN0YXQsIGxzdGF0LCByZWFkZGlyLCByZWFscGF0aCB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgUmVhZGFibGUgfSBmcm9tICdub2RlOnN0cmVhbSc7XG5pbXBvcnQgeyByZXNvbHZlIGFzIHByZXNvbHZlLCByZWxhdGl2ZSBhcyBwcmVsYXRpdmUsIGpvaW4gYXMgcGpvaW4sIHNlcCBhcyBwc2VwIH0gZnJvbSAnbm9kZTpwYXRoJztcbmV4cG9ydCBjb25zdCBFbnRyeVR5cGVzID0ge1xuICAgIEZJTEVfVFlQRTogJ2ZpbGVzJyxcbiAgICBESVJfVFlQRTogJ2RpcmVjdG9yaWVzJyxcbiAgICBGSUxFX0RJUl9UWVBFOiAnZmlsZXNfZGlyZWN0b3JpZXMnLFxuICAgIEVWRVJZVEhJTkdfVFlQRTogJ2FsbCcsXG59O1xuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgcm9vdDogJy4nLFxuICAgIGZpbGVGaWx0ZXI6IChfZW50cnlJbmZvKSA9PiB0cnVlLFxuICAgIGRpcmVjdG9yeUZpbHRlcjogKF9lbnRyeUluZm8pID0+IHRydWUsXG4gICAgdHlwZTogRW50cnlUeXBlcy5GSUxFX1RZUEUsXG4gICAgbHN0YXQ6IGZhbHNlLFxuICAgIGRlcHRoOiAyMTQ3NDgzNjQ4LFxuICAgIGFsd2F5c1N0YXQ6IGZhbHNlLFxuICAgIGhpZ2hXYXRlck1hcms6IDQwOTYsXG59O1xuT2JqZWN0LmZyZWV6ZShkZWZhdWx0T3B0aW9ucyk7XG5jb25zdCBSRUNVUlNJVkVfRVJST1JfQ09ERSA9ICdSRUFERElSUF9SRUNVUlNJVkVfRVJST1InO1xuY29uc3QgTk9STUFMX0ZMT1dfRVJST1JTID0gbmV3IFNldChbJ0VOT0VOVCcsICdFUEVSTScsICdFQUNDRVMnLCAnRUxPT1AnLCBSRUNVUlNJVkVfRVJST1JfQ09ERV0pO1xuY29uc3QgQUxMX1RZUEVTID0gW1xuICAgIEVudHJ5VHlwZXMuRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuICAgIEVudHJ5VHlwZXMuRklMRV9UWVBFLFxuXTtcbmNvbnN0IERJUl9UWVBFUyA9IG5ldyBTZXQoW1xuICAgIEVudHJ5VHlwZXMuRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuXSk7XG5jb25zdCBGSUxFX1RZUEVTID0gbmV3IFNldChbXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuICAgIEVudHJ5VHlwZXMuRklMRV9UWVBFLFxuXSk7XG5jb25zdCBpc05vcm1hbEZsb3dFcnJvciA9IChlcnJvcikgPT4gTk9STUFMX0ZMT1dfRVJST1JTLmhhcyhlcnJvci5jb2RlKTtcbmNvbnN0IHdhbnRCaWdpbnRGc1N0YXRzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcbmNvbnN0IGVtcHR5Rm4gPSAoX2VudHJ5SW5mbykgPT4gdHJ1ZTtcbmNvbnN0IG5vcm1hbGl6ZUZpbHRlciA9IChmaWx0ZXIpID0+IHtcbiAgICBpZiAoZmlsdGVyID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBlbXB0eUZuO1xuICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBmbCA9IGZpbHRlci50cmltKCk7XG4gICAgICAgIHJldHVybiAoZW50cnkpID0+IGVudHJ5LmJhc2VuYW1lID09PSBmbDtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyKSkge1xuICAgICAgICBjb25zdCB0ckl0ZW1zID0gZmlsdGVyLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkpO1xuICAgICAgICByZXR1cm4gKGVudHJ5KSA9PiB0ckl0ZW1zLnNvbWUoKGYpID0+IGVudHJ5LmJhc2VuYW1lID09PSBmKTtcbiAgICB9XG4gICAgcmV0dXJuIGVtcHR5Rm47XG59O1xuLyoqIFJlYWRhYmxlIHJlYWRkaXIgc3RyZWFtLCBlbWl0dGluZyBuZXcgZmlsZXMgYXMgdGhleSdyZSBiZWluZyBsaXN0ZWQuICovXG5leHBvcnQgY2xhc3MgUmVhZGRpcnBTdHJlYW0gZXh0ZW5kcyBSZWFkYWJsZSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKHtcbiAgICAgICAgICAgIG9iamVjdE1vZGU6IHRydWUsXG4gICAgICAgICAgICBhdXRvRGVzdHJveTogdHJ1ZSxcbiAgICAgICAgICAgIGhpZ2hXYXRlck1hcms6IG9wdGlvbnMuaGlnaFdhdGVyTWFyayxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7IC4uLmRlZmF1bHRPcHRpb25zLCAuLi5vcHRpb25zIH07XG4gICAgICAgIGNvbnN0IHsgcm9vdCwgdHlwZSB9ID0gb3B0cztcbiAgICAgICAgdGhpcy5fZmlsZUZpbHRlciA9IG5vcm1hbGl6ZUZpbHRlcihvcHRzLmZpbGVGaWx0ZXIpO1xuICAgICAgICB0aGlzLl9kaXJlY3RvcnlGaWx0ZXIgPSBub3JtYWxpemVGaWx0ZXIob3B0cy5kaXJlY3RvcnlGaWx0ZXIpO1xuICAgICAgICBjb25zdCBzdGF0TWV0aG9kID0gb3B0cy5sc3RhdCA/IGxzdGF0IDogc3RhdDtcbiAgICAgICAgLy8gVXNlIGJpZ2ludCBzdGF0cyBpZiBpdCdzIHdpbmRvd3MgYW5kIHN0YXQoKSBzdXBwb3J0cyBvcHRpb25zIChub2RlIDEwKykuXG4gICAgICAgIGlmICh3YW50QmlnaW50RnNTdGF0cykge1xuICAgICAgICAgICAgdGhpcy5fc3RhdCA9IChwYXRoKSA9PiBzdGF0TWV0aG9kKHBhdGgsIHsgYmlnaW50OiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdCA9IHN0YXRNZXRob2Q7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWF4RGVwdGggPSBvcHRzLmRlcHRoID8/IGRlZmF1bHRPcHRpb25zLmRlcHRoO1xuICAgICAgICB0aGlzLl93YW50c0RpciA9IHR5cGUgPyBESVJfVFlQRVMuaGFzKHR5cGUpIDogZmFsc2U7XG4gICAgICAgIHRoaXMuX3dhbnRzRmlsZSA9IHR5cGUgPyBGSUxFX1RZUEVTLmhhcyh0eXBlKSA6IGZhbHNlO1xuICAgICAgICB0aGlzLl93YW50c0V2ZXJ5dGhpbmcgPSB0eXBlID09PSBFbnRyeVR5cGVzLkVWRVJZVEhJTkdfVFlQRTtcbiAgICAgICAgdGhpcy5fcm9vdCA9IHByZXNvbHZlKHJvb3QpO1xuICAgICAgICB0aGlzLl9pc0RpcmVudCA9ICFvcHRzLmFsd2F5c1N0YXQ7XG4gICAgICAgIHRoaXMuX3N0YXRzUHJvcCA9IHRoaXMuX2lzRGlyZW50ID8gJ2RpcmVudCcgOiAnc3RhdHMnO1xuICAgICAgICB0aGlzLl9yZE9wdGlvbnMgPSB7IGVuY29kaW5nOiAndXRmOCcsIHdpdGhGaWxlVHlwZXM6IHRoaXMuX2lzRGlyZW50IH07XG4gICAgICAgIC8vIExhdW5jaCBzdHJlYW0gd2l0aCBvbmUgcGFyZW50LCB0aGUgcm9vdCBkaXIuXG4gICAgICAgIHRoaXMucGFyZW50cyA9IFt0aGlzLl9leHBsb3JlRGlyKHJvb3QsIDEpXTtcbiAgICAgICAgdGhpcy5yZWFkaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBhc3luYyBfcmVhZChiYXRjaCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkaW5nKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlYWRpbmcgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2hpbGUgKCF0aGlzLmRlc3Ryb3llZCAmJiBiYXRjaCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXIgPSB0aGlzLnBhcmVudDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWwgPSBwYXIgJiYgcGFyLmZpbGVzO1xuICAgICAgICAgICAgICAgIGlmIChmaWwgJiYgZmlsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBwYXRoLCBkZXB0aCB9ID0gcGFyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbGljZSA9IGZpbC5zcGxpY2UoMCwgYmF0Y2gpLm1hcCgoZGlyZW50KSA9PiB0aGlzLl9mb3JtYXRFbnRyeShkaXJlbnQsIHBhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXdhaXRlZCA9IGF3YWl0IFByb21pc2UuYWxsKHNsaWNlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBhd2FpdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVudHJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5VHlwZSA9IGF3YWl0IHRoaXMuX2dldEVudHJ5VHlwZShlbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlUeXBlID09PSAnZGlyZWN0b3J5JyAmJiB0aGlzLl9kaXJlY3RvcnlGaWx0ZXIoZW50cnkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlcHRoIDw9IHRoaXMuX21heERlcHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50cy5wdXNoKHRoaXMuX2V4cGxvcmVEaXIoZW50cnkuZnVsbFBhdGgsIGRlcHRoICsgMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2FudHNEaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmF0Y2gtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoZW50cnlUeXBlID09PSAnZmlsZScgfHwgdGhpcy5faW5jbHVkZUFzRmlsZShlbnRyeSkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmlsZUZpbHRlcihlbnRyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2FudHNGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaChlbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhdGNoLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IGF3YWl0IHBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveShlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnJlYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBfZXhwbG9yZURpcihwYXRoLCBkZXB0aCkge1xuICAgICAgICBsZXQgZmlsZXM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmaWxlcyA9IGF3YWl0IHJlYWRkaXIocGF0aCwgdGhpcy5fcmRPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGZpbGVzLCBkZXB0aCwgcGF0aCB9O1xuICAgIH1cbiAgICBhc3luYyBfZm9ybWF0RW50cnkoZGlyZW50LCBwYXRoKSB7XG4gICAgICAgIGxldCBlbnRyeTtcbiAgICAgICAgY29uc3QgYmFzZW5hbWUgPSB0aGlzLl9pc0RpcmVudCA/IGRpcmVudC5uYW1lIDogZGlyZW50O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwcmVzb2x2ZShwam9pbihwYXRoLCBiYXNlbmFtZSkpO1xuICAgICAgICAgICAgZW50cnkgPSB7IHBhdGg6IHByZWxhdGl2ZSh0aGlzLl9yb290LCBmdWxsUGF0aCksIGZ1bGxQYXRoLCBiYXNlbmFtZSB9O1xuICAgICAgICAgICAgZW50cnlbdGhpcy5fc3RhdHNQcm9wXSA9IHRoaXMuX2lzRGlyZW50ID8gZGlyZW50IDogYXdhaXQgdGhpcy5fc3RhdChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhpcy5fb25FcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG4gICAgX29uRXJyb3IoZXJyKSB7XG4gICAgICAgIGlmIChpc05vcm1hbEZsb3dFcnJvcihlcnIpICYmICF0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCd3YXJuJywgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIF9nZXRFbnRyeVR5cGUoZW50cnkpIHtcbiAgICAgICAgLy8gZW50cnkgbWF5IGJlIHVuZGVmaW5lZCwgYmVjYXVzZSBhIHdhcm5pbmcgb3IgYW4gZXJyb3Igd2VyZSBlbWl0dGVkXG4gICAgICAgIC8vIGFuZCB0aGUgc3RhdHNQcm9wIGlzIHVuZGVmaW5lZFxuICAgICAgICBpZiAoIWVudHJ5ICYmIHRoaXMuX3N0YXRzUHJvcCBpbiBlbnRyeSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXRzID0gZW50cnlbdGhpcy5fc3RhdHNQcm9wXTtcbiAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKVxuICAgICAgICAgICAgcmV0dXJuICdmaWxlJztcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpXG4gICAgICAgICAgICByZXR1cm4gJ2RpcmVjdG9yeSc7XG4gICAgICAgIGlmIChzdGF0cyAmJiBzdGF0cy5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsID0gZW50cnkuZnVsbFBhdGg7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5UmVhbFBhdGggPSBhd2FpdCByZWFscGF0aChmdWxsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeVJlYWxQYXRoU3RhdHMgPSBhd2FpdCBsc3RhdChlbnRyeVJlYWxQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnlSZWFsUGF0aFN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZmlsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbnRyeVJlYWxQYXRoU3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBlbnRyeVJlYWxQYXRoLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGwuc3RhcnRzV2l0aChlbnRyeVJlYWxQYXRoKSAmJiBmdWxsLnN1YnN0cihsZW4sIDEpID09PSBwc2VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN1cnNpdmVFcnJvciA9IG5ldyBFcnJvcihgQ2lyY3VsYXIgc3ltbGluayBkZXRlY3RlZDogXCIke2Z1bGx9XCIgcG9pbnRzIHRvIFwiJHtlbnRyeVJlYWxQYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNpdmVFcnJvci5jb2RlID0gUkVDVVJTSVZFX0VSUk9SX0NPREU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fb25FcnJvcihyZWN1cnNpdmVFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdkaXJlY3RvcnknO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfaW5jbHVkZUFzRmlsZShlbnRyeSkge1xuICAgICAgICBjb25zdCBzdGF0cyA9IGVudHJ5ICYmIGVudHJ5W3RoaXMuX3N0YXRzUHJvcF07XG4gICAgICAgIHJldHVybiBzdGF0cyAmJiB0aGlzLl93YW50c0V2ZXJ5dGhpbmcgJiYgIXN0YXRzLmlzRGlyZWN0b3J5KCk7XG4gICAgfVxufVxuLyoqXG4gKiBTdHJlYW1pbmcgdmVyc2lvbjogUmVhZHMgYWxsIGZpbGVzIGFuZCBkaXJlY3RvcmllcyBpbiBnaXZlbiByb290IHJlY3Vyc2l2ZWx5LlxuICogQ29uc3VtZXMgfmNvbnN0YW50IHNtYWxsIGFtb3VudCBvZiBSQU0uXG4gKiBAcGFyYW0gcm9vdCBSb290IGRpcmVjdG9yeVxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0byBzcGVjaWZ5IHJvb3QgKHN0YXJ0IGRpcmVjdG9yeSksIGZpbHRlcnMgYW5kIHJlY3Vyc2lvbiBkZXB0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGRpcnAocm9vdCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGxldCB0eXBlID0gb3B0aW9ucy5lbnRyeVR5cGUgfHwgb3B0aW9ucy50eXBlO1xuICAgIGlmICh0eXBlID09PSAnYm90aCcpXG4gICAgICAgIHR5cGUgPSBFbnRyeVR5cGVzLkZJTEVfRElSX1RZUEU7IC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgaWYgKHR5cGUpXG4gICAgICAgIG9wdGlvbnMudHlwZSA9IHR5cGU7XG4gICAgaWYgKCFyb290KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncmVhZGRpcnA6IHJvb3QgYXJndW1lbnQgaXMgcmVxdWlyZWQuIFVzYWdlOiByZWFkZGlycChyb290LCBvcHRpb25zKScpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygcm9vdCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVhZGRpcnA6IHJvb3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZy4gVXNhZ2U6IHJlYWRkaXJwKHJvb3QsIG9wdGlvbnMpJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgJiYgIUFMTF9UWVBFUy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlYWRkaXJwOiBJbnZhbGlkIHR5cGUgcGFzc2VkLiBVc2Ugb25lIG9mICR7QUxMX1RZUEVTLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICAgIG9wdGlvbnMucm9vdCA9IHJvb3Q7XG4gICAgcmV0dXJuIG5ldyBSZWFkZGlycFN0cmVhbShvcHRpb25zKTtcbn1cbi8qKlxuICogUHJvbWlzZSB2ZXJzaW9uOiBSZWFkcyBhbGwgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIGluIGdpdmVuIHJvb3QgcmVjdXJzaXZlbHkuXG4gKiBDb21wYXJlZCB0byBzdHJlYW1pbmcgdmVyc2lvbiwgd2lsbCBjb25zdW1lIGEgbG90IG9mIFJBTSBlLmcuIHdoZW4gMSBtaWxsaW9uIGZpbGVzIGFyZSBsaXN0ZWQuXG4gKiBAcmV0dXJucyBhcnJheSBvZiBwYXRocyBhbmQgdGhlaXIgZW50cnkgaW5mb3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRkaXJwUHJvbWlzZShyb290LCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IFtdO1xuICAgICAgICByZWFkZGlycChyb290LCBvcHRpb25zKVxuICAgICAgICAgICAgLm9uKCdkYXRhJywgKGVudHJ5KSA9PiBmaWxlcy5wdXNoKGVudHJ5KSlcbiAgICAgICAgICAgIC5vbignZW5kJywgKCkgPT4gcmVzb2x2ZShmaWxlcykpXG4gICAgICAgICAgICAub24oJ2Vycm9yJywgKGVycm9yKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICB9KTtcbn1cbmV4cG9ydCBkZWZhdWx0IHJlYWRkaXJwO1xuIiwgImltcG9ydCB7IHdhdGNoRmlsZSwgdW53YXRjaEZpbGUsIHdhdGNoIGFzIGZzX3dhdGNoIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgb3Blbiwgc3RhdCwgbHN0YXQsIHJlYWxwYXRoIGFzIGZzcmVhbHBhdGggfSBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgKiBhcyBzeXNQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZSBhcyBvc1R5cGUgfSBmcm9tICdvcyc7XG5leHBvcnQgY29uc3QgU1RSX0RBVEEgPSAnZGF0YSc7XG5leHBvcnQgY29uc3QgU1RSX0VORCA9ICdlbmQnO1xuZXhwb3J0IGNvbnN0IFNUUl9DTE9TRSA9ICdjbG9zZSc7XG5leHBvcnQgY29uc3QgRU1QVFlfRk4gPSAoKSA9PiB7IH07XG5leHBvcnQgY29uc3QgSURFTlRJVFlfRk4gPSAodmFsKSA9PiB2YWw7XG5jb25zdCBwbCA9IHByb2Nlc3MucGxhdGZvcm07XG5leHBvcnQgY29uc3QgaXNXaW5kb3dzID0gcGwgPT09ICd3aW4zMic7XG5leHBvcnQgY29uc3QgaXNNYWNvcyA9IHBsID09PSAnZGFyd2luJztcbmV4cG9ydCBjb25zdCBpc0xpbnV4ID0gcGwgPT09ICdsaW51eCc7XG5leHBvcnQgY29uc3QgaXNGcmVlQlNEID0gcGwgPT09ICdmcmVlYnNkJztcbmV4cG9ydCBjb25zdCBpc0lCTWkgPSBvc1R5cGUoKSA9PT0gJ09TNDAwJztcbmV4cG9ydCBjb25zdCBFVkVOVFMgPSB7XG4gICAgQUxMOiAnYWxsJyxcbiAgICBSRUFEWTogJ3JlYWR5JyxcbiAgICBBREQ6ICdhZGQnLFxuICAgIENIQU5HRTogJ2NoYW5nZScsXG4gICAgQUREX0RJUjogJ2FkZERpcicsXG4gICAgVU5MSU5LOiAndW5saW5rJyxcbiAgICBVTkxJTktfRElSOiAndW5saW5rRGlyJyxcbiAgICBSQVc6ICdyYXcnLFxuICAgIEVSUk9SOiAnZXJyb3InLFxufTtcbmNvbnN0IEVWID0gRVZFTlRTO1xuY29uc3QgVEhST1RUTEVfTU9ERV9XQVRDSCA9ICd3YXRjaCc7XG5jb25zdCBzdGF0TWV0aG9kcyA9IHsgbHN0YXQsIHN0YXQgfTtcbmNvbnN0IEtFWV9MSVNURU5FUlMgPSAnbGlzdGVuZXJzJztcbmNvbnN0IEtFWV9FUlIgPSAnZXJySGFuZGxlcnMnO1xuY29uc3QgS0VZX1JBVyA9ICdyYXdFbWl0dGVycyc7XG5jb25zdCBIQU5ETEVSX0tFWVMgPSBbS0VZX0xJU1RFTkVSUywgS0VZX0VSUiwgS0VZX1JBV107XG4vLyBwcmV0dGllci1pZ25vcmVcbmNvbnN0IGJpbmFyeUV4dGVuc2lvbnMgPSBuZXcgU2V0KFtcbiAgICAnM2RtJywgJzNkcycsICczZzInLCAnM2dwJywgJzd6JywgJ2EnLCAnYWFjJywgJ2FkcCcsICdhZmRlc2lnbicsICdhZnBob3RvJywgJ2FmcHViJywgJ2FpJyxcbiAgICAnYWlmJywgJ2FpZmYnLCAnYWx6JywgJ2FwZScsICdhcGsnLCAnYXBwaW1hZ2UnLCAnYXInLCAnYXJqJywgJ2FzZicsICdhdScsICdhdmknLFxuICAgICdiYWsnLCAnYmFtbCcsICdiaCcsICdiaW4nLCAnYmsnLCAnYm1wJywgJ2J0aWYnLCAnYnoyJywgJ2J6aXAyJyxcbiAgICAnY2FiJywgJ2NhZicsICdjZ20nLCAnY2xhc3MnLCAnY214JywgJ2NwaW8nLCAnY3IyJywgJ2N1cicsICdkYXQnLCAnZGNtJywgJ2RlYicsICdkZXgnLCAnZGp2dScsXG4gICAgJ2RsbCcsICdkbWcnLCAnZG5nJywgJ2RvYycsICdkb2NtJywgJ2RvY3gnLCAnZG90JywgJ2RvdG0nLCAnZHJhJywgJ0RTX1N0b3JlJywgJ2RzaycsICdkdHMnLFxuICAgICdkdHNoZCcsICdkdmInLCAnZHdnJywgJ2R4ZicsXG4gICAgJ2VjZWxwNDgwMCcsICdlY2VscDc0NzAnLCAnZWNlbHA5NjAwJywgJ2VnZycsICdlb2wnLCAnZW90JywgJ2VwdWInLCAnZXhlJyxcbiAgICAnZjR2JywgJ2ZicycsICdmaCcsICdmbGEnLCAnZmxhYycsICdmbGF0cGFrJywgJ2ZsaScsICdmbHYnLCAnZnB4JywgJ2ZzdCcsICdmdnQnLFxuICAgICdnMycsICdnaCcsICdnaWYnLCAnZ3JhZmZsZScsICdneicsICdnemlwJyxcbiAgICAnaDI2MScsICdoMjYzJywgJ2gyNjQnLCAnaWNucycsICdpY28nLCAnaWVmJywgJ2ltZycsICdpcGEnLCAnaXNvJyxcbiAgICAnamFyJywgJ2pwZWcnLCAnanBnJywgJ2pwZ3YnLCAnanBtJywgJ2p4cicsICdrZXknLCAna3R4JyxcbiAgICAnbGhhJywgJ2xpYicsICdsdnAnLCAnbHonLCAnbHpoJywgJ2x6bWEnLCAnbHpvJyxcbiAgICAnbTN1JywgJ200YScsICdtNHYnLCAnbWFyJywgJ21kaScsICdtaHQnLCAnbWlkJywgJ21pZGknLCAnbWoyJywgJ21rYScsICdta3YnLCAnbW1yJywgJ21uZycsXG4gICAgJ21vYmknLCAnbW92JywgJ21vdmllJywgJ21wMycsXG4gICAgJ21wNCcsICdtcDRhJywgJ21wZWcnLCAnbXBnJywgJ21wZ2EnLCAnbXh1JyxcbiAgICAnbmVmJywgJ25weCcsICdudW1iZXJzJywgJ251cGtnJyxcbiAgICAnbycsICdvZHAnLCAnb2RzJywgJ29kdCcsICdvZ2EnLCAnb2dnJywgJ29ndicsICdvdGYnLCAnb3R0JyxcbiAgICAncGFnZXMnLCAncGJtJywgJ3BjeCcsICdwZGInLCAncGRmJywgJ3BlYScsICdwZ20nLCAncGljJywgJ3BuZycsICdwbm0nLCAncG90JywgJ3BvdG0nLFxuICAgICdwb3R4JywgJ3BwYScsICdwcGFtJyxcbiAgICAncHBtJywgJ3BwcycsICdwcHNtJywgJ3Bwc3gnLCAncHB0JywgJ3BwdG0nLCAncHB0eCcsICdwc2QnLCAncHlhJywgJ3B5YycsICdweW8nLCAncHl2JyxcbiAgICAncXQnLFxuICAgICdyYXInLCAncmFzJywgJ3JhdycsICdyZXNvdXJjZXMnLCAncmdiJywgJ3JpcCcsICdybGMnLCAncm1mJywgJ3JtdmInLCAncnBtJywgJ3J0ZicsICdyeicsXG4gICAgJ3MzbScsICdzN3onLCAnc2NwdCcsICdzZ2knLCAnc2hhcicsICdzbmFwJywgJ3NpbCcsICdza2V0Y2gnLCAnc2xrJywgJ3NtdicsICdzbmsnLCAnc28nLFxuICAgICdzdGwnLCAnc3VvJywgJ3N1YicsICdzd2YnLFxuICAgICd0YXInLCAndGJ6JywgJ3RiejInLCAndGdhJywgJ3RneicsICd0aG14JywgJ3RpZicsICd0aWZmJywgJ3RseicsICd0dGMnLCAndHRmJywgJ3R4eicsXG4gICAgJ3VkZicsICd1dmgnLCAndXZpJywgJ3V2bScsICd1dnAnLCAndXZzJywgJ3V2dScsXG4gICAgJ3ZpdicsICd2b2InLFxuICAgICd3YXInLCAnd2F2JywgJ3dheCcsICd3Ym1wJywgJ3dkcCcsICd3ZWJhJywgJ3dlYm0nLCAnd2VicCcsICd3aGwnLCAnd2ltJywgJ3dtJywgJ3dtYScsXG4gICAgJ3dtdicsICd3bXgnLCAnd29mZicsICd3b2ZmMicsICd3cm0nLCAnd3Z4JyxcbiAgICAneGJtJywgJ3hpZicsICd4bGEnLCAneGxhbScsICd4bHMnLCAneGxzYicsICd4bHNtJywgJ3hsc3gnLCAneGx0JywgJ3hsdG0nLCAneGx0eCcsICd4bScsXG4gICAgJ3htaW5kJywgJ3hwaScsICd4cG0nLCAneHdkJywgJ3h6JyxcbiAgICAneicsICd6aXAnLCAnemlweCcsXG5dKTtcbmNvbnN0IGlzQmluYXJ5UGF0aCA9IChmaWxlUGF0aCkgPT4gYmluYXJ5RXh0ZW5zaW9ucy5oYXMoc3lzUGF0aC5leHRuYW1lKGZpbGVQYXRoKS5zbGljZSgxKS50b0xvd2VyQ2FzZSgpKTtcbi8vIFRPRE86IGVtaXQgZXJyb3JzIHByb3Blcmx5LiBFeGFtcGxlOiBFTUZJTEUgb24gTWFjb3MuXG5jb25zdCBmb3JlYWNoID0gKHZhbCwgZm4pID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgIHZhbC5mb3JFYWNoKGZuKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZuKHZhbCk7XG4gICAgfVxufTtcbmNvbnN0IGFkZEFuZENvbnZlcnQgPSAobWFpbiwgcHJvcCwgaXRlbSkgPT4ge1xuICAgIGxldCBjb250YWluZXIgPSBtYWluW3Byb3BdO1xuICAgIGlmICghKGNvbnRhaW5lciBpbnN0YW5jZW9mIFNldCkpIHtcbiAgICAgICAgbWFpbltwcm9wXSA9IGNvbnRhaW5lciA9IG5ldyBTZXQoW2NvbnRhaW5lcl0pO1xuICAgIH1cbiAgICBjb250YWluZXIuYWRkKGl0ZW0pO1xufTtcbmNvbnN0IGNsZWFySXRlbSA9IChjb250KSA9PiAoa2V5KSA9PiB7XG4gICAgY29uc3Qgc2V0ID0gY29udFtrZXldO1xuICAgIGlmIChzZXQgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgc2V0LmNsZWFyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkZWxldGUgY29udFtrZXldO1xuICAgIH1cbn07XG5jb25zdCBkZWxGcm9tU2V0ID0gKG1haW4sIHByb3AsIGl0ZW0pID0+IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBtYWluW3Byb3BdO1xuICAgIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgY29udGFpbmVyLmRlbGV0ZShpdGVtKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29udGFpbmVyID09PSBpdGVtKSB7XG4gICAgICAgIGRlbGV0ZSBtYWluW3Byb3BdO1xuICAgIH1cbn07XG5jb25zdCBpc0VtcHR5U2V0ID0gKHZhbCkgPT4gKHZhbCBpbnN0YW5jZW9mIFNldCA/IHZhbC5zaXplID09PSAwIDogIXZhbCk7XG5jb25zdCBGc1dhdGNoSW5zdGFuY2VzID0gbmV3IE1hcCgpO1xuLyoqXG4gKiBJbnN0YW50aWF0ZXMgdGhlIGZzX3dhdGNoIGludGVyZmFjZVxuICogQHBhcmFtIHBhdGggdG8gYmUgd2F0Y2hlZFxuICogQHBhcmFtIG9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIGZzX3dhdGNoXG4gKiBAcGFyYW0gbGlzdGVuZXIgbWFpbiBldmVudCBoYW5kbGVyXG4gKiBAcGFyYW0gZXJySGFuZGxlciBlbWl0cyBpbmZvIGFib3V0IGVycm9yc1xuICogQHBhcmFtIGVtaXRSYXcgZW1pdHMgcmF3IGV2ZW50IGRhdGFcbiAqIEByZXR1cm5zIHtOYXRpdmVGc1dhdGNoZXJ9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZzV2F0Y2hJbnN0YW5jZShwYXRoLCBvcHRpb25zLCBsaXN0ZW5lciwgZXJySGFuZGxlciwgZW1pdFJhdykge1xuICAgIGNvbnN0IGhhbmRsZUV2ZW50ID0gKHJhd0V2ZW50LCBldlBhdGgpID0+IHtcbiAgICAgICAgbGlzdGVuZXIocGF0aCk7XG4gICAgICAgIGVtaXRSYXcocmF3RXZlbnQsIGV2UGF0aCwgeyB3YXRjaGVkUGF0aDogcGF0aCB9KTtcbiAgICAgICAgLy8gZW1pdCBiYXNlZCBvbiBldmVudHMgb2NjdXJyaW5nIGZvciBmaWxlcyBmcm9tIGEgZGlyZWN0b3J5J3Mgd2F0Y2hlciBpblxuICAgICAgICAvLyBjYXNlIHRoZSBmaWxlJ3Mgd2F0Y2hlciBtaXNzZXMgaXQgKGFuZCByZWx5IG9uIHRocm90dGxpbmcgdG8gZGUtZHVwZSlcbiAgICAgICAgaWYgKGV2UGF0aCAmJiBwYXRoICE9PSBldlBhdGgpIHtcbiAgICAgICAgICAgIGZzV2F0Y2hCcm9hZGNhc3Qoc3lzUGF0aC5yZXNvbHZlKHBhdGgsIGV2UGF0aCksIEtFWV9MSVNURU5FUlMsIHN5c1BhdGguam9pbihwYXRoLCBldlBhdGgpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGZzX3dhdGNoKHBhdGgsIHtcbiAgICAgICAgICAgIHBlcnNpc3RlbnQ6IG9wdGlvbnMucGVyc2lzdGVudCxcbiAgICAgICAgfSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJySGFuZGxlcihlcnJvcik7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuLyoqXG4gKiBIZWxwZXIgZm9yIHBhc3NpbmcgZnNfd2F0Y2ggZXZlbnQgZGF0YSB0byBhIGNvbGxlY3Rpb24gb2YgbGlzdGVuZXJzXG4gKiBAcGFyYW0gZnVsbFBhdGggYWJzb2x1dGUgcGF0aCBib3VuZCB0byBmc193YXRjaCBpbnN0YW5jZVxuICovXG5jb25zdCBmc1dhdGNoQnJvYWRjYXN0ID0gKGZ1bGxQYXRoLCBsaXN0ZW5lclR5cGUsIHZhbDEsIHZhbDIsIHZhbDMpID0+IHtcbiAgICBjb25zdCBjb250ID0gRnNXYXRjaEluc3RhbmNlcy5nZXQoZnVsbFBhdGgpO1xuICAgIGlmICghY29udClcbiAgICAgICAgcmV0dXJuO1xuICAgIGZvcmVhY2goY29udFtsaXN0ZW5lclR5cGVdLCAobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIodmFsMSwgdmFsMiwgdmFsMyk7XG4gICAgfSk7XG59O1xuLyoqXG4gKiBJbnN0YW50aWF0ZXMgdGhlIGZzX3dhdGNoIGludGVyZmFjZSBvciBiaW5kcyBsaXN0ZW5lcnNcbiAqIHRvIGFuIGV4aXN0aW5nIG9uZSBjb3ZlcmluZyB0aGUgc2FtZSBmaWxlIHN5c3RlbSBlbnRyeVxuICogQHBhcmFtIHBhdGhcbiAqIEBwYXJhbSBmdWxsUGF0aCBhYnNvbHV0ZSBwYXRoXG4gKiBAcGFyYW0gb3B0aW9ucyB0byBiZSBwYXNzZWQgdG8gZnNfd2F0Y2hcbiAqIEBwYXJhbSBoYW5kbGVycyBjb250YWluZXIgZm9yIGV2ZW50IGxpc3RlbmVyIGZ1bmN0aW9uc1xuICovXG5jb25zdCBzZXRGc1dhdGNoTGlzdGVuZXIgPSAocGF0aCwgZnVsbFBhdGgsIG9wdGlvbnMsIGhhbmRsZXJzKSA9PiB7XG4gICAgY29uc3QgeyBsaXN0ZW5lciwgZXJySGFuZGxlciwgcmF3RW1pdHRlciB9ID0gaGFuZGxlcnM7XG4gICAgbGV0IGNvbnQgPSBGc1dhdGNoSW5zdGFuY2VzLmdldChmdWxsUGF0aCk7XG4gICAgbGV0IHdhdGNoZXI7XG4gICAgaWYgKCFvcHRpb25zLnBlcnNpc3RlbnQpIHtcbiAgICAgICAgd2F0Y2hlciA9IGNyZWF0ZUZzV2F0Y2hJbnN0YW5jZShwYXRoLCBvcHRpb25zLCBsaXN0ZW5lciwgZXJySGFuZGxlciwgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmICghd2F0Y2hlcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UuYmluZCh3YXRjaGVyKTtcbiAgICB9XG4gICAgaWYgKGNvbnQpIHtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGFkZEFuZENvbnZlcnQoY29udCwgS0VZX0VSUiwgZXJySGFuZGxlcik7XG4gICAgICAgIGFkZEFuZENvbnZlcnQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB3YXRjaGVyID0gY3JlYXRlRnNXYXRjaEluc3RhbmNlKHBhdGgsIG9wdGlvbnMsIGZzV2F0Y2hCcm9hZGNhc3QuYmluZChudWxsLCBmdWxsUGF0aCwgS0VZX0xJU1RFTkVSUyksIGVyckhhbmRsZXIsIC8vIG5vIG5lZWQgdG8gdXNlIGJyb2FkY2FzdCBoZXJlXG4gICAgICAgIGZzV2F0Y2hCcm9hZGNhc3QuYmluZChudWxsLCBmdWxsUGF0aCwgS0VZX1JBVykpO1xuICAgICAgICBpZiAoIXdhdGNoZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHdhdGNoZXIub24oRVYuRVJST1IsIGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnJvYWRjYXN0RXJyID0gZnNXYXRjaEJyb2FkY2FzdC5iaW5kKG51bGwsIGZ1bGxQYXRoLCBLRVlfRVJSKTtcbiAgICAgICAgICAgIGlmIChjb250KVxuICAgICAgICAgICAgICAgIGNvbnQud2F0Y2hlclVudXNhYmxlID0gdHJ1ZTsgLy8gZG9jdW1lbnRlZCBzaW5jZSBOb2RlIDEwLjQuMVxuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2lzc3Vlcy80MzM3XG4gICAgICAgICAgICBpZiAoaXNXaW5kb3dzICYmIGVycm9yLmNvZGUgPT09ICdFUEVSTScpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZCA9IGF3YWl0IG9wZW4ocGF0aCwgJ3InKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJvYWRjYXN0RXJyKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJvYWRjYXN0RXJyKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnQgPSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnM6IGxpc3RlbmVyLFxuICAgICAgICAgICAgZXJySGFuZGxlcnM6IGVyckhhbmRsZXIsXG4gICAgICAgICAgICByYXdFbWl0dGVyczogcmF3RW1pdHRlcixcbiAgICAgICAgICAgIHdhdGNoZXIsXG4gICAgICAgIH07XG4gICAgICAgIEZzV2F0Y2hJbnN0YW5jZXMuc2V0KGZ1bGxQYXRoLCBjb250KTtcbiAgICB9XG4gICAgLy8gY29uc3QgaW5kZXggPSBjb250Lmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAvLyByZW1vdmVzIHRoaXMgaW5zdGFuY2UncyBsaXN0ZW5lcnMgYW5kIGNsb3NlcyB0aGUgdW5kZXJseWluZyBmc193YXRjaFxuICAgIC8vIGluc3RhbmNlIGlmIHRoZXJlIGFyZSBubyBtb3JlIGxpc3RlbmVycyBsZWZ0XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX0VSUiwgZXJySGFuZGxlcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmIChpc0VtcHR5U2V0KGNvbnQubGlzdGVuZXJzKSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gcHJvdGVjdCBhZ2FpbnN0IGlzc3VlIGdoLTczMC5cbiAgICAgICAgICAgIC8vIGlmIChjb250LndhdGNoZXJVbnVzYWJsZSkge1xuICAgICAgICAgICAgY29udC53YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBGc1dhdGNoSW5zdGFuY2VzLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgICAgICBIQU5ETEVSX0tFWVMuZm9yRWFjaChjbGVhckl0ZW0oY29udCkpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29udC53YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShjb250KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuLy8gZnNfd2F0Y2hGaWxlIGhlbHBlcnNcbi8vIG9iamVjdCB0byBob2xkIHBlci1wcm9jZXNzIGZzX3dhdGNoRmlsZSBpbnN0YW5jZXNcbi8vIChtYXkgYmUgc2hhcmVkIGFjcm9zcyBjaG9raWRhciBGU1dhdGNoZXIgaW5zdGFuY2VzKVxuY29uc3QgRnNXYXRjaEZpbGVJbnN0YW5jZXMgPSBuZXcgTWFwKCk7XG4vKipcbiAqIEluc3RhbnRpYXRlcyB0aGUgZnNfd2F0Y2hGaWxlIGludGVyZmFjZSBvciBiaW5kcyBsaXN0ZW5lcnNcbiAqIHRvIGFuIGV4aXN0aW5nIG9uZSBjb3ZlcmluZyB0aGUgc2FtZSBmaWxlIHN5c3RlbSBlbnRyeVxuICogQHBhcmFtIHBhdGggdG8gYmUgd2F0Y2hlZFxuICogQHBhcmFtIGZ1bGxQYXRoIGFic29sdXRlIHBhdGhcbiAqIEBwYXJhbSBvcHRpb25zIG9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIGZzX3dhdGNoRmlsZVxuICogQHBhcmFtIGhhbmRsZXJzIGNvbnRhaW5lciBmb3IgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb25zXG4gKiBAcmV0dXJucyBjbG9zZXJcbiAqL1xuY29uc3Qgc2V0RnNXYXRjaEZpbGVMaXN0ZW5lciA9IChwYXRoLCBmdWxsUGF0aCwgb3B0aW9ucywgaGFuZGxlcnMpID0+IHtcbiAgICBjb25zdCB7IGxpc3RlbmVyLCByYXdFbWl0dGVyIH0gPSBoYW5kbGVycztcbiAgICBsZXQgY29udCA9IEZzV2F0Y2hGaWxlSW5zdGFuY2VzLmdldChmdWxsUGF0aCk7XG4gICAgLy8gbGV0IGxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgICAvLyBsZXQgcmF3RW1pdHRlcnMgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgY29wdHMgPSBjb250ICYmIGNvbnQub3B0aW9ucztcbiAgICBpZiAoY29wdHMgJiYgKGNvcHRzLnBlcnNpc3RlbnQgPCBvcHRpb25zLnBlcnNpc3RlbnQgfHwgY29wdHMuaW50ZXJ2YWwgPiBvcHRpb25zLmludGVydmFsKSkge1xuICAgICAgICAvLyBcIlVwZ3JhZGVcIiB0aGUgd2F0Y2hlciB0byBwZXJzaXN0ZW5jZSBvciBhIHF1aWNrZXIgaW50ZXJ2YWwuXG4gICAgICAgIC8vIFRoaXMgY3JlYXRlcyBzb21lIHVubGlrZWx5IGVkZ2UgY2FzZSBpc3N1ZXMgaWYgdGhlIHVzZXIgbWl4ZXNcbiAgICAgICAgLy8gc2V0dGluZ3MgaW4gYSB2ZXJ5IHdlaXJkIHdheSwgYnV0IHNvbHZpbmcgZm9yIHRob3NlIGNhc2VzXG4gICAgICAgIC8vIGRvZXNuJ3Qgc2VlbSB3b3J0aHdoaWxlIGZvciB0aGUgYWRkZWQgY29tcGxleGl0eS5cbiAgICAgICAgLy8gbGlzdGVuZXJzID0gY29udC5saXN0ZW5lcnM7XG4gICAgICAgIC8vIHJhd0VtaXR0ZXJzID0gY29udC5yYXdFbWl0dGVycztcbiAgICAgICAgdW53YXRjaEZpbGUoZnVsbFBhdGgpO1xuICAgICAgICBjb250ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoY29udCkge1xuICAgICAgICBhZGRBbmRDb252ZXJ0KGNvbnQsIEtFWV9MSVNURU5FUlMsIGxpc3RlbmVyKTtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfUkFXLCByYXdFbWl0dGVyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgICAgIC8vIHJhd0VtaXR0ZXJzLmFkZChyYXdFbWl0dGVyKTtcbiAgICAgICAgY29udCA9IHtcbiAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXIsXG4gICAgICAgICAgICByYXdFbWl0dGVyczogcmF3RW1pdHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICB3YXRjaGVyOiB3YXRjaEZpbGUoZnVsbFBhdGgsIG9wdGlvbnMsIChjdXJyLCBwcmV2KSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaChjb250LnJhd0VtaXR0ZXJzLCAocmF3RW1pdHRlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByYXdFbWl0dGVyKEVWLkNIQU5HRSwgZnVsbFBhdGgsIHsgY3VyciwgcHJldiB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJybXRpbWUgPSBjdXJyLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnIuc2l6ZSAhPT0gcHJldi5zaXplIHx8IGN1cnJtdGltZSA+IHByZXYubXRpbWVNcyB8fCBjdXJybXRpbWUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaChjb250Lmxpc3RlbmVycywgKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihwYXRoLCBjdXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgIH07XG4gICAgICAgIEZzV2F0Y2hGaWxlSW5zdGFuY2VzLnNldChmdWxsUGF0aCwgY29udCk7XG4gICAgfVxuICAgIC8vIGNvbnN0IGluZGV4ID0gY29udC5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgLy8gUmVtb3ZlcyB0aGlzIGluc3RhbmNlJ3MgbGlzdGVuZXJzIGFuZCBjbG9zZXMgdGhlIHVuZGVybHlpbmcgZnNfd2F0Y2hGaWxlXG4gICAgLy8gaW5zdGFuY2UgaWYgdGhlcmUgYXJlIG5vIG1vcmUgbGlzdGVuZXJzIGxlZnQuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmIChpc0VtcHR5U2V0KGNvbnQubGlzdGVuZXJzKSkge1xuICAgICAgICAgICAgRnNXYXRjaEZpbGVJbnN0YW5jZXMuZGVsZXRlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIHVud2F0Y2hGaWxlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIGNvbnQub3B0aW9ucyA9IGNvbnQud2F0Y2hlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIE9iamVjdC5mcmVlemUoY29udCk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbi8qKlxuICogQG1peGluXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlRnNIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihmc1cpIHtcbiAgICAgICAgdGhpcy5mc3cgPSBmc1c7XG4gICAgICAgIHRoaXMuX2JvdW5kSGFuZGxlRXJyb3IgPSAoZXJyb3IpID0+IGZzVy5faGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXYXRjaCBmaWxlIGZvciBjaGFuZ2VzIHdpdGggZnNfd2F0Y2hGaWxlIG9yIGZzX3dhdGNoLlxuICAgICAqIEBwYXJhbSBwYXRoIHRvIGZpbGUgb3IgZGlyXG4gICAgICogQHBhcmFtIGxpc3RlbmVyIG9uIGZzIGNoYW5nZVxuICAgICAqIEByZXR1cm5zIGNsb3NlciBmb3IgdGhlIHdhdGNoZXIgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBfd2F0Y2hXaXRoTm9kZUZzKHBhdGgsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB0aGlzLmZzdy5vcHRpb25zO1xuICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBzeXNQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2VuYW1lID0gc3lzUGF0aC5iYXNlbmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KTtcbiAgICAgICAgcGFyZW50LmFkZChiYXNlbmFtZSk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHN5c1BhdGgucmVzb2x2ZShwYXRoKTtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHBlcnNpc3RlbnQ6IG9wdHMucGVyc2lzdGVudCxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFsaXN0ZW5lcilcbiAgICAgICAgICAgIGxpc3RlbmVyID0gRU1QVFlfRk47XG4gICAgICAgIGxldCBjbG9zZXI7XG4gICAgICAgIGlmIChvcHRzLnVzZVBvbGxpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGVuYWJsZUJpbiA9IG9wdHMuaW50ZXJ2YWwgIT09IG9wdHMuYmluYXJ5SW50ZXJ2YWw7XG4gICAgICAgICAgICBvcHRpb25zLmludGVydmFsID0gZW5hYmxlQmluICYmIGlzQmluYXJ5UGF0aChiYXNlbmFtZSkgPyBvcHRzLmJpbmFyeUludGVydmFsIDogb3B0cy5pbnRlcnZhbDtcbiAgICAgICAgICAgIGNsb3NlciA9IHNldEZzV2F0Y2hGaWxlTGlzdGVuZXIocGF0aCwgYWJzb2x1dGVQYXRoLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgcmF3RW1pdHRlcjogdGhpcy5mc3cuX2VtaXRSYXcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsb3NlciA9IHNldEZzV2F0Y2hMaXN0ZW5lcihwYXRoLCBhYnNvbHV0ZVBhdGgsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgICBlcnJIYW5kbGVyOiB0aGlzLl9ib3VuZEhhbmRsZUVycm9yLFxuICAgICAgICAgICAgICAgIHJhd0VtaXR0ZXI6IHRoaXMuZnN3Ll9lbWl0UmF3LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3NlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2F0Y2ggYSBmaWxlIGFuZCBlbWl0IGFkZCBldmVudCBpZiB3YXJyYW50ZWQuXG4gICAgICogQHJldHVybnMgY2xvc2VyIGZvciB0aGUgd2F0Y2hlciBpbnN0YW5jZVxuICAgICAqL1xuICAgIF9oYW5kbGVGaWxlKGZpbGUsIHN0YXRzLCBpbml0aWFsQWRkKSB7XG4gICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkaXJuYW1lID0gc3lzUGF0aC5kaXJuYW1lKGZpbGUpO1xuICAgICAgICBjb25zdCBiYXNlbmFtZSA9IHN5c1BhdGguYmFzZW5hbWUoZmlsZSk7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZnN3Ll9nZXRXYXRjaGVkRGlyKGRpcm5hbWUpO1xuICAgICAgICAvLyBzdGF0cyBpcyBhbHdheXMgcHJlc2VudFxuICAgICAgICBsZXQgcHJldlN0YXRzID0gc3RhdHM7XG4gICAgICAgIC8vIGlmIHRoZSBmaWxlIGlzIGFscmVhZHkgYmVpbmcgd2F0Y2hlZCwgZG8gbm90aGluZ1xuICAgICAgICBpZiAocGFyZW50LmhhcyhiYXNlbmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gYXN5bmMgKHBhdGgsIG5ld1N0YXRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZnN3Ll90aHJvdHRsZShUSFJPVFRMRV9NT0RFX1dBVENILCBmaWxlLCA1KSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoIW5ld1N0YXRzIHx8IG5ld1N0YXRzLm10aW1lTXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0cyA9IGF3YWl0IHN0YXQoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgY2hhbmdlIGV2ZW50IHdhcyBub3QgZmlyZWQgYmVjYXVzZSBvZiBjaGFuZ2VkIG9ubHkgYWNjZXNzVGltZS5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXQgPSBuZXdTdGF0cy5hdGltZU1zO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtdCA9IG5ld1N0YXRzLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXQgfHwgYXQgPD0gbXQgfHwgbXQgIT09IHByZXZTdGF0cy5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIGZpbGUsIG5ld1N0YXRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGlzTWFjb3MgfHwgaXNMaW51eCB8fCBpc0ZyZWVCU0QpICYmIHByZXZTdGF0cy5pbm8gIT09IG5ld1N0YXRzLmlubykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX2Nsb3NlRmlsZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IG5ld1N0YXRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xvc2VyID0gdGhpcy5fd2F0Y2hXaXRoTm9kZUZzKGZpbGUsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9zZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IG5ld1N0YXRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXggaXNzdWVzIHdoZXJlIG10aW1lIGlzIG51bGwgYnV0IGZpbGUgaXMgc3RpbGwgcHJlc2VudFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fcmVtb3ZlKGRpcm5hbWUsIGJhc2VuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYWRkIGlzIGFib3V0IHRvIGJlIGVtaXR0ZWQgaWYgZmlsZSBub3QgYWxyZWFkeSB0cmFja2VkIGluIHBhcmVudFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocGFyZW50LmhhcyhiYXNlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGF0IGNoYW5nZSBldmVudCB3YXMgbm90IGZpcmVkIGJlY2F1c2Ugb2YgY2hhbmdlZCBvbmx5IGFjY2Vzc1RpbWUuXG4gICAgICAgICAgICAgICAgY29uc3QgYXQgPSBuZXdTdGF0cy5hdGltZU1zO1xuICAgICAgICAgICAgICAgIGNvbnN0IG10ID0gbmV3U3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICBpZiAoIWF0IHx8IGF0IDw9IG10IHx8IG10ICE9PSBwcmV2U3RhdHMubXRpbWVNcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIGZpbGUsIG5ld1N0YXRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldlN0YXRzID0gbmV3U3RhdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIGtpY2sgb2ZmIHRoZSB3YXRjaGVyXG4gICAgICAgIGNvbnN0IGNsb3NlciA9IHRoaXMuX3dhdGNoV2l0aE5vZGVGcyhmaWxlLCBsaXN0ZW5lcik7XG4gICAgICAgIC8vIGVtaXQgYW4gYWRkIGV2ZW50IGlmIHdlJ3JlIHN1cHBvc2VkIHRvXG4gICAgICAgIGlmICghKGluaXRpYWxBZGQgJiYgdGhpcy5mc3cub3B0aW9ucy5pZ25vcmVJbml0aWFsKSAmJiB0aGlzLmZzdy5faXNudElnbm9yZWQoZmlsZSkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mc3cuX3Rocm90dGxlKEVWLkFERCwgZmlsZSwgMCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXQoRVYuQURELCBmaWxlLCBzdGF0cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3NlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlIHN5bWxpbmtzIGVuY291bnRlcmVkIHdoaWxlIHJlYWRpbmcgYSBkaXIuXG4gICAgICogQHBhcmFtIGVudHJ5IHJldHVybmVkIGJ5IHJlYWRkaXJwXG4gICAgICogQHBhcmFtIGRpcmVjdG9yeSBwYXRoIG9mIGRpciBiZWluZyByZWFkXG4gICAgICogQHBhcmFtIHBhdGggb2YgdGhpcyBpdGVtXG4gICAgICogQHBhcmFtIGl0ZW0gYmFzZW5hbWUgb2YgdGhpcyBpdGVtXG4gICAgICogQHJldHVybnMgdHJ1ZSBpZiBubyBtb3JlIHByb2Nlc3NpbmcgaXMgbmVlZGVkIGZvciB0aGlzIGVudHJ5LlxuICAgICAqL1xuICAgIGFzeW5jIF9oYW5kbGVTeW1saW5rKGVudHJ5LCBkaXJlY3RvcnksIHBhdGgsIGl0ZW0pIHtcbiAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZ1bGwgPSBlbnRyeS5mdWxsUGF0aDtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KTtcbiAgICAgICAgaWYgKCF0aGlzLmZzdy5vcHRpb25zLmZvbGxvd1N5bWxpbmtzKSB7XG4gICAgICAgICAgICAvLyB3YXRjaCBzeW1saW5rIGRpcmVjdGx5IChkb24ndCBmb2xsb3cpIGFuZCBkZXRlY3QgY2hhbmdlc1xuICAgICAgICAgICAgdGhpcy5mc3cuX2luY3JSZWFkeUNvdW50KCk7XG4gICAgICAgICAgICBsZXQgbGlua1BhdGg7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxpbmtQYXRoID0gYXdhaXQgZnNyZWFscGF0aChwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXRSZWFkeSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoZGlyLmhhcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmdldChmdWxsKSAhPT0gbGlua1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoZnVsbCwgbGlua1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIHBhdGgsIGVudHJ5LnN0YXRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXIuYWRkKGl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9zeW1saW5rUGF0aHMuc2V0KGZ1bGwsIGxpbmtQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BREQsIHBhdGgsIGVudHJ5LnN0YXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0UmVhZHkoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRvbid0IGZvbGxvdyB0aGUgc2FtZSBzeW1saW5rIG1vcmUgdGhhbiBvbmNlXG4gICAgICAgIGlmICh0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmhhcyhmdWxsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoZnVsbCwgdHJ1ZSk7XG4gICAgfVxuICAgIF9oYW5kbGVSZWFkKGRpcmVjdG9yeSwgaW5pdGlhbEFkZCwgd2gsIHRhcmdldCwgZGlyLCBkZXB0aCwgdGhyb3R0bGVyKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgZGlyZWN0b3J5IG5hbWUgb24gV2luZG93c1xuICAgICAgICBkaXJlY3RvcnkgPSBzeXNQYXRoLmpvaW4oZGlyZWN0b3J5LCAnJyk7XG4gICAgICAgIHRocm90dGxlciA9IHRoaXMuZnN3Ll90aHJvdHRsZSgncmVhZGRpcicsIGRpcmVjdG9yeSwgMTAwMCk7XG4gICAgICAgIGlmICghdGhyb3R0bGVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuZnN3Ll9nZXRXYXRjaGVkRGlyKHdoLnBhdGgpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gbmV3IFNldCgpO1xuICAgICAgICBsZXQgc3RyZWFtID0gdGhpcy5mc3cuX3JlYWRkaXJwKGRpcmVjdG9yeSwge1xuICAgICAgICAgICAgZmlsZUZpbHRlcjogKGVudHJ5KSA9PiB3aC5maWx0ZXJQYXRoKGVudHJ5KSxcbiAgICAgICAgICAgIGRpcmVjdG9yeUZpbHRlcjogKGVudHJ5KSA9PiB3aC5maWx0ZXJEaXIoZW50cnkpLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFzdHJlYW0pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN0cmVhbVxuICAgICAgICAgICAgLm9uKFNUUl9EQVRBLCBhc3luYyAoZW50cnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGVudHJ5LnBhdGg7XG4gICAgICAgICAgICBsZXQgcGF0aCA9IHN5c1BhdGguam9pbihkaXJlY3RvcnksIGl0ZW0pO1xuICAgICAgICAgICAgY3VycmVudC5hZGQoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZW50cnkuc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSAmJlxuICAgICAgICAgICAgICAgIChhd2FpdCB0aGlzLl9oYW5kbGVTeW1saW5rKGVudHJ5LCBkaXJlY3RvcnksIHBhdGgsIGl0ZW0pKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmlsZXMgdGhhdCBwcmVzZW50IGluIGN1cnJlbnQgZGlyZWN0b3J5IHNuYXBzaG90XG4gICAgICAgICAgICAvLyBidXQgYWJzZW50IGluIHByZXZpb3VzIGFyZSBhZGRlZCB0byB3YXRjaCBsaXN0IGFuZFxuICAgICAgICAgICAgLy8gZW1pdCBgYWRkYCBldmVudC5cbiAgICAgICAgICAgIGlmIChpdGVtID09PSB0YXJnZXQgfHwgKCF0YXJnZXQgJiYgIXByZXZpb3VzLmhhcyhpdGVtKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5faW5jclJlYWR5Q291bnQoKTtcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgcmVsYXRpdmVuZXNzIG9mIHBhdGggaXMgcHJlc2VydmVkIGluIGNhc2Ugb2Ygd2F0Y2hlciByZXVzZVxuICAgICAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLmpvaW4oZGlyLCBzeXNQYXRoLnJlbGF0aXZlKGRpciwgcGF0aCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRvTm9kZUZzKHBhdGgsIGluaXRpYWxBZGQsIHdoLCBkZXB0aCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKEVWLkVSUk9SLCB0aGlzLl9ib3VuZEhhbmRsZUVycm9yKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghc3RyZWFtKVxuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICAgICAgICAgIHN0cmVhbS5vbmNlKFNUUl9FTkQsICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB3YXNUaHJvdHRsZWQgPSB0aHJvdHRsZXIgPyB0aHJvdHRsZXIuY2xlYXIoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAvLyBGaWxlcyB0aGF0IGFic2VudCBpbiBjdXJyZW50IGRpcmVjdG9yeSBzbmFwc2hvdFxuICAgICAgICAgICAgICAgIC8vIGJ1dCBwcmVzZW50IGluIHByZXZpb3VzIGVtaXQgYHJlbW92ZWAgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBhbmQgYXJlIHJlbW92ZWQgZnJvbSBAd2F0Y2hlZFtkaXJlY3RvcnldLlxuICAgICAgICAgICAgICAgIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0gIT09IGRpcmVjdG9yeSAmJiAhY3VycmVudC5oYXMoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3JlbW92ZShkaXJlY3RvcnksIGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAvLyBvbmUgbW9yZSB0aW1lIGZvciBhbnkgbWlzc2VkIGluIGNhc2UgY2hhbmdlcyBjYW1lIGluIGV4dHJlbWVseSBxdWlja2x5XG4gICAgICAgICAgICAgICAgaWYgKHdhc1Rocm90dGxlZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlUmVhZChkaXJlY3RvcnksIGZhbHNlLCB3aCwgdGFyZ2V0LCBkaXIsIGRlcHRoLCB0aHJvdHRsZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWFkIGRpcmVjdG9yeSB0byBhZGQgLyByZW1vdmUgZmlsZXMgZnJvbSBgQHdhdGNoZWRgIGxpc3QgYW5kIHJlLXJlYWQgaXQgb24gY2hhbmdlLlxuICAgICAqIEBwYXJhbSBkaXIgZnMgcGF0aFxuICAgICAqIEBwYXJhbSBzdGF0c1xuICAgICAqIEBwYXJhbSBpbml0aWFsQWRkXG4gICAgICogQHBhcmFtIGRlcHRoIHJlbGF0aXZlIHRvIHVzZXItc3VwcGxpZWQgcGF0aFxuICAgICAqIEBwYXJhbSB0YXJnZXQgY2hpbGQgcGF0aCB0YXJnZXRlZCBmb3Igd2F0Y2hcbiAgICAgKiBAcGFyYW0gd2ggQ29tbW9uIHdhdGNoIGhlbHBlcnMgZm9yIHRoaXMgcGF0aFxuICAgICAqIEBwYXJhbSByZWFscGF0aFxuICAgICAqIEByZXR1cm5zIGNsb3NlciBmb3IgdGhlIHdhdGNoZXIgaW5zdGFuY2UuXG4gICAgICovXG4gICAgYXN5bmMgX2hhbmRsZURpcihkaXIsIHN0YXRzLCBpbml0aWFsQWRkLCBkZXB0aCwgdGFyZ2V0LCB3aCwgcmVhbHBhdGgpIHtcbiAgICAgICAgY29uc3QgcGFyZW50RGlyID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoc3lzUGF0aC5kaXJuYW1lKGRpcikpO1xuICAgICAgICBjb25zdCB0cmFja2VkID0gcGFyZW50RGlyLmhhcyhzeXNQYXRoLmJhc2VuYW1lKGRpcikpO1xuICAgICAgICBpZiAoIShpbml0aWFsQWRkICYmIHRoaXMuZnN3Lm9wdGlvbnMuaWdub3JlSW5pdGlhbCkgJiYgIXRhcmdldCAmJiAhdHJhY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXQoRVYuQUREX0RJUiwgZGlyLCBzdGF0cyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZW5zdXJlIGRpciBpcyB0cmFja2VkIChoYXJtbGVzcyBpZiByZWR1bmRhbnQpXG4gICAgICAgIHBhcmVudERpci5hZGQoc3lzUGF0aC5iYXNlbmFtZShkaXIpKTtcbiAgICAgICAgdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyKTtcbiAgICAgICAgbGV0IHRocm90dGxlcjtcbiAgICAgICAgbGV0IGNsb3NlcjtcbiAgICAgICAgY29uc3Qgb0RlcHRoID0gdGhpcy5mc3cub3B0aW9ucy5kZXB0aDtcbiAgICAgICAgaWYgKChvRGVwdGggPT0gbnVsbCB8fCBkZXB0aCA8PSBvRGVwdGgpICYmICF0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmhhcyhyZWFscGF0aCkpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5faGFuZGxlUmVhZChkaXIsIGluaXRpYWxBZGQsIHdoLCB0YXJnZXQsIGRpciwgZGVwdGgsIHRocm90dGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xvc2VyID0gdGhpcy5fd2F0Y2hXaXRoTm9kZUZzKGRpciwgKGRpclBhdGgsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gaWYgY3VycmVudCBkaXJlY3RvcnkgaXMgcmVtb3ZlZCwgZG8gbm90aGluZ1xuICAgICAgICAgICAgICAgIGlmIChzdGF0cyAmJiBzdGF0cy5tdGltZU1zID09PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlUmVhZChkaXJQYXRoLCBmYWxzZSwgd2gsIHRhcmdldCwgZGlyLCBkZXB0aCwgdGhyb3R0bGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhZGRlZCBmaWxlLCBkaXJlY3RvcnksIG9yIGdsb2IgcGF0dGVybi5cbiAgICAgKiBEZWxlZ2F0ZXMgY2FsbCB0byBfaGFuZGxlRmlsZSAvIF9oYW5kbGVEaXIgYWZ0ZXIgY2hlY2tzLlxuICAgICAqIEBwYXJhbSBwYXRoIHRvIGZpbGUgb3IgaXJcbiAgICAgKiBAcGFyYW0gaW5pdGlhbEFkZCB3YXMgdGhlIGZpbGUgYWRkZWQgYXQgd2F0Y2ggaW5zdGFudGlhdGlvbj9cbiAgICAgKiBAcGFyYW0gcHJpb3JXaCBkZXB0aCByZWxhdGl2ZSB0byB1c2VyLXN1cHBsaWVkIHBhdGhcbiAgICAgKiBAcGFyYW0gZGVwdGggQ2hpbGQgcGF0aCBhY3R1YWxseSB0YXJnZXRlZCBmb3Igd2F0Y2hcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IENoaWxkIHBhdGggYWN0dWFsbHkgdGFyZ2V0ZWQgZm9yIHdhdGNoXG4gICAgICovXG4gICAgYXN5bmMgX2FkZFRvTm9kZUZzKHBhdGgsIGluaXRpYWxBZGQsIHByaW9yV2gsIGRlcHRoLCB0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgcmVhZHkgPSB0aGlzLmZzdy5fZW1pdFJlYWR5O1xuICAgICAgICBpZiAodGhpcy5mc3cuX2lzSWdub3JlZChwYXRoKSB8fCB0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHJlYWR5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2ggPSB0aGlzLmZzdy5fZ2V0V2F0Y2hIZWxwZXJzKHBhdGgpO1xuICAgICAgICBpZiAocHJpb3JXaCkge1xuICAgICAgICAgICAgd2guZmlsdGVyUGF0aCA9IChlbnRyeSkgPT4gcHJpb3JXaC5maWx0ZXJQYXRoKGVudHJ5KTtcbiAgICAgICAgICAgIHdoLmZpbHRlckRpciA9IChlbnRyeSkgPT4gcHJpb3JXaC5maWx0ZXJEaXIoZW50cnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV2YWx1YXRlIHdoYXQgaXMgYXQgdGhlIHBhdGggd2UncmUgYmVpbmcgYXNrZWQgdG8gd2F0Y2hcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc3RhdE1ldGhvZHNbd2guc3RhdE1ldGhvZF0od2gud2F0Y2hQYXRoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuZnN3Ll9pc0lnbm9yZWQod2gud2F0Y2hQYXRoLCBzdGF0cykpIHtcbiAgICAgICAgICAgICAgICByZWFkeSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvbGxvdyA9IHRoaXMuZnN3Lm9wdGlvbnMuZm9sbG93U3ltbGlua3M7XG4gICAgICAgICAgICBsZXQgY2xvc2VyO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhYnNQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBmb2xsb3cgPyBhd2FpdCBmc3JlYWxwYXRoKHBhdGgpIDogcGF0aDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgY2xvc2VyID0gYXdhaXQgdGhpcy5faGFuZGxlRGlyKHdoLndhdGNoUGF0aCwgc3RhdHMsIGluaXRpYWxBZGQsIGRlcHRoLCB0YXJnZXQsIHdoLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgLy8gcHJlc2VydmUgdGhpcyBzeW1saW5rJ3MgdGFyZ2V0IHBhdGhcbiAgICAgICAgICAgICAgICBpZiAoYWJzUGF0aCAhPT0gdGFyZ2V0UGF0aCAmJiB0YXJnZXRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoYWJzUGF0aCwgdGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBmb2xsb3cgPyBhd2FpdCBmc3JlYWxwYXRoKHBhdGgpIDogcGF0aDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc3lzUGF0aC5kaXJuYW1lKHdoLndhdGNoUGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2dldFdhdGNoZWREaXIocGFyZW50KS5hZGQod2gud2F0Y2hQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BREQsIHdoLndhdGNoUGF0aCwgc3RhdHMpO1xuICAgICAgICAgICAgICAgIGNsb3NlciA9IGF3YWl0IHRoaXMuX2hhbmRsZURpcihwYXJlbnQsIHN0YXRzLCBpbml0aWFsQWRkLCBkZXB0aCwgcGF0aCwgd2gsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyBwcmVzZXJ2ZSB0aGlzIHN5bWxpbmsncyB0YXJnZXQgcGF0aFxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoc3lzUGF0aC5yZXNvbHZlKHBhdGgpLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXIgPSB0aGlzLl9oYW5kbGVGaWxlKHdoLndhdGNoUGF0aCwgc3RhdHMsIGluaXRpYWxBZGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgIGlmIChjbG9zZXIpXG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5faGFuZGxlRXJyb3IoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsICIvKipcbiAqIERpc2NvdmVyIHR3ZWFrcyB1bmRlciA8dXNlclJvb3Q+L3R3ZWFrcy4gRWFjaCB0d2VhayBpcyBhIGRpcmVjdG9yeSB3aXRoIGFcbiAqIG1hbmlmZXN0Lmpzb24gYW5kIGFuIGVudHJ5IHNjcmlwdC4gRW50cnkgcmVzb2x1dGlvbiBpcyBtYW5pZmVzdC5tYWluIGZpcnN0LFxuICogdGhlbiBpbmRleC5qcywgaW5kZXgubWpzLCBhbmQgaW5kZXguY2pzLlxuICpcbiAqIFRoZSBtYW5pZmVzdCBnYXRlIGlzIGludGVudGlvbmFsbHkgc3RyaWN0LiBBIHR3ZWFrIG11c3QgaWRlbnRpZnkgaXRzIEdpdEh1YlxuICogcmVwb3NpdG9yeSBzbyB0aGUgbWFuYWdlciBjYW4gY2hlY2sgcmVsZWFzZXMgd2l0aG91dCBncmFudGluZyB0aGUgdHdlYWsgYW5cbiAqIHVwZGF0ZS9pbnN0YWxsIGNoYW5uZWwuIFVwZGF0ZSBjaGVja3MgYXJlIGFkdmlzb3J5IG9ubHkuXG4gKi9cbmltcG9ydCB7IHJlYWRkaXJTeW5jLCBzdGF0U3luYywgcmVhZEZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7IFR3ZWFrTWFuaWZlc3QgfSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERpc2NvdmVyZWRUd2VhayB7XG4gIGRpcjogc3RyaW5nO1xuICBlbnRyeTogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbn1cblxuY29uc3QgRU5UUllfQ0FORElEQVRFUyA9IFtcImluZGV4LmpzXCIsIFwiaW5kZXguY2pzXCIsIFwiaW5kZXgubWpzXCJdO1xuXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJUd2Vha3ModHdlYWtzRGlyOiBzdHJpbmcpOiBEaXNjb3ZlcmVkVHdlYWtbXSB7XG4gIGlmICghZXhpc3RzU3luYyh0d2Vha3NEaXIpKSByZXR1cm4gW107XG4gIGNvbnN0IG91dDogRGlzY292ZXJlZFR3ZWFrW10gPSBbXTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIHJlYWRkaXJTeW5jKHR3ZWFrc0RpcikpIHtcbiAgICBjb25zdCBkaXIgPSBqb2luKHR3ZWFrc0RpciwgbmFtZSk7XG4gICAgaWYgKCFzdGF0U3luYyhkaXIpLmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IG1hbmlmZXN0UGF0aCA9IGpvaW4oZGlyLCBcIm1hbmlmZXN0Lmpzb25cIik7XG4gICAgaWYgKCFleGlzdHNTeW5jKG1hbmlmZXN0UGF0aCkpIGNvbnRpbnVlO1xuICAgIGxldCBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgICB0cnkge1xuICAgICAgbWFuaWZlc3QgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtYW5pZmVzdFBhdGgsIFwidXRmOFwiKSkgYXMgVHdlYWtNYW5pZmVzdDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIWlzVmFsaWRNYW5pZmVzdChtYW5pZmVzdCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGVudHJ5ID0gcmVzb2x2ZUVudHJ5KGRpciwgbWFuaWZlc3QpO1xuICAgIGlmICghZW50cnkpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHsgZGlyLCBlbnRyeSwgbWFuaWZlc3QgfSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KG06IFR3ZWFrTWFuaWZlc3QpOiBib29sZWFuIHtcbiAgaWYgKCFtLmlkIHx8ICFtLm5hbWUgfHwgIW0udmVyc2lvbiB8fCAhbS5naXRodWJSZXBvKSByZXR1cm4gZmFsc2U7XG4gIGlmICghL15bYS16QS1aMC05Ll8tXStcXC9bYS16QS1aMC05Ll8tXSskLy50ZXN0KG0uZ2l0aHViUmVwbykpIHJldHVybiBmYWxzZTtcbiAgaWYgKG0uc2NvcGUgJiYgIVtcInJlbmRlcmVyXCIsIFwibWFpblwiLCBcImJvdGhcIl0uaW5jbHVkZXMobS5zY29wZSkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVFbnRyeShkaXI6IHN0cmluZywgbTogVHdlYWtNYW5pZmVzdCk6IHN0cmluZyB8IG51bGwge1xuICBpZiAobS5tYWluKSB7XG4gICAgY29uc3QgcCA9IGpvaW4oZGlyLCBtLm1haW4pO1xuICAgIHJldHVybiBleGlzdHNTeW5jKHApID8gcCA6IG51bGw7XG4gIH1cbiAgZm9yIChjb25zdCBjIG9mIEVOVFJZX0NBTkRJREFURVMpIHtcbiAgICBjb25zdCBwID0gam9pbihkaXIsIGMpO1xuICAgIGlmIChleGlzdHNTeW5jKHApKSByZXR1cm4gcDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsICIvKipcbiAqIERpc2stYmFja2VkIGtleS92YWx1ZSBzdG9yYWdlIGZvciBtYWluLXByb2Nlc3MgdHdlYWtzLlxuICpcbiAqIEVhY2ggdHdlYWsgZ2V0cyBvbmUgSlNPTiBmaWxlIHVuZGVyIGA8dXNlclJvb3Q+L3N0b3JhZ2UvPGlkPi5qc29uYC5cbiAqIFdyaXRlcyBhcmUgZGVib3VuY2VkICg1MCBtcykgYW5kIGF0b21pYyAod3JpdGUgdG8gPGZpbGU+LnRtcCB0aGVuIHJlbmFtZSkuXG4gKiBSZWFkcyBhcmUgZWFnZXIgKyBjYWNoZWQgaW4tbWVtb3J5OyB3ZSBsb2FkIG9uIGZpcnN0IGFjY2Vzcy5cbiAqL1xuaW1wb3J0IHtcbiAgZXhpc3RzU3luYyxcbiAgbWtkaXJTeW5jLFxuICByZWFkRmlsZVN5bmMsXG4gIHJlbmFtZVN5bmMsXG4gIHdyaXRlRmlsZVN5bmMsXG59IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERpc2tTdG9yYWdlIHtcbiAgZ2V0PFQ+KGtleTogc3RyaW5nLCBkZWZhdWx0VmFsdWU/OiBUKTogVDtcbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQ7XG4gIGRlbGV0ZShrZXk6IHN0cmluZyk6IHZvaWQ7XG4gIGFsbCgpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgZmx1c2goKTogdm9pZDtcbn1cblxuY29uc3QgRkxVU0hfREVMQVlfTVMgPSA1MDtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpc2tTdG9yYWdlKHJvb3REaXI6IHN0cmluZywgaWQ6IHN0cmluZyk6IERpc2tTdG9yYWdlIHtcbiAgY29uc3QgZGlyID0gam9pbihyb290RGlyLCBcInN0b3JhZ2VcIik7XG4gIG1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBmaWxlID0gam9pbihkaXIsIGAke3Nhbml0aXplKGlkKX0uanNvbmApO1xuXG4gIGxldCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBpZiAoZXhpc3RzU3luYyhmaWxlKSkge1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoZmlsZSwgXCJ1dGY4XCIpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIENvcnJ1cHQgZmlsZSBcdTIwMTQgc3RhcnQgZnJlc2gsIGJ1dCBkb24ndCBjbG9iYmVyIHRoZSBvcmlnaW5hbCB1bnRpbCB3ZVxuICAgICAgLy8gc3VjY2Vzc2Z1bGx5IHdyaXRlIGFnYWluLiAoTW92ZSBpdCBhc2lkZSBmb3IgZm9yZW5zaWNzLilcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlbmFtZVN5bmMoZmlsZSwgYCR7ZmlsZX0uY29ycnVwdC0ke0RhdGUubm93KCl9YCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBkYXRhID0ge307XG4gICAgfVxuICB9XG5cbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG4gIGxldCB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBzY2hlZHVsZUZsdXNoID0gKCkgPT4ge1xuICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICBpZiAodGltZXIpIHJldHVybjtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgaWYgKGRpcnR5KSBmbHVzaCgpO1xuICAgIH0sIEZMVVNIX0RFTEFZX01TKTtcbiAgfTtcblxuICBjb25zdCBmbHVzaCA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWRpcnR5KSByZXR1cm47XG4gICAgY29uc3QgdG1wID0gYCR7ZmlsZX0udG1wYDtcbiAgICB0cnkge1xuICAgICAgd3JpdGVGaWxlU3luYyh0bXAsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpLCBcInV0ZjhcIik7XG4gICAgICByZW5hbWVTeW5jKHRtcCwgZmlsZSk7XG4gICAgICBkaXJ0eSA9IGZhbHNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIExlYXZlIGRpcnR5PXRydWUgc28gYSBmdXR1cmUgZmx1c2ggcmV0cmllcy5cbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHN0b3JhZ2UgZmx1c2ggZmFpbGVkOlwiLCBpZCwgZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4oazogc3RyaW5nLCBkPzogVCk6IFQgPT5cbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrKSA/IChkYXRhW2tdIGFzIFQpIDogKGQgYXMgVCksXG4gICAgc2V0KGssIHYpIHtcbiAgICAgIGRhdGFba10gPSB2O1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH0sXG4gICAgZGVsZXRlKGspIHtcbiAgICAgIGlmIChrIGluIGRhdGEpIHtcbiAgICAgICAgZGVsZXRlIGRhdGFba107XG4gICAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFsbDogKCkgPT4gKHsgLi4uZGF0YSB9KSxcbiAgICBmbHVzaCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemUoaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIFR3ZWFrIGlkcyBhcmUgYXV0aG9yLWNvbnRyb2xsZWQ7IGNsYW1wIHRvIGEgc2FmZSBmaWxlbmFtZS5cbiAgcmV0dXJuIGlkLnJlcGxhY2UoL1teYS16QS1aMC05Ll9ALV0vZywgXCJfXCIpO1xufVxuIiwgImltcG9ydCB7IGV4aXN0c1N5bmMsIG1rZGlyU3luYywgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7IFR3ZWFrTWNwU2VydmVyIH0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IE1DUF9NQU5BR0VEX1NUQVJUID0gXCIjIEJFR0lOIENPREVYKysgTUFOQUdFRCBNQ1AgU0VSVkVSU1wiO1xuZXhwb3J0IGNvbnN0IE1DUF9NQU5BR0VEX0VORCA9IFwiIyBFTkQgQ09ERVgrKyBNQU5BR0VEIE1DUCBTRVJWRVJTXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWNwU3luY1R3ZWFrIHtcbiAgZGlyOiBzdHJpbmc7XG4gIG1hbmlmZXN0OiB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBtY3A/OiBUd2Vha01jcFNlcnZlcjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdWlsdE1hbmFnZWRNY3BCbG9jayB7XG4gIGJsb2NrOiBzdHJpbmc7XG4gIHNlcnZlck5hbWVzOiBzdHJpbmdbXTtcbiAgc2tpcHBlZFNlcnZlck5hbWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYW5hZ2VkTWNwU3luY1Jlc3VsdCBleHRlbmRzIEJ1aWx0TWFuYWdlZE1jcEJsb2NrIHtcbiAgY2hhbmdlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN5bmNNYW5hZ2VkTWNwU2VydmVycyh7XG4gIGNvbmZpZ1BhdGgsXG4gIHR3ZWFrcyxcbn06IHtcbiAgY29uZmlnUGF0aDogc3RyaW5nO1xuICB0d2Vha3M6IE1jcFN5bmNUd2Vha1tdO1xufSk6IE1hbmFnZWRNY3BTeW5jUmVzdWx0IHtcbiAgY29uc3QgY3VycmVudCA9IGV4aXN0c1N5bmMoY29uZmlnUGF0aCkgPyByZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgXCJ1dGY4XCIpIDogXCJcIjtcbiAgY29uc3QgYnVpbHQgPSBidWlsZE1hbmFnZWRNY3BCbG9jayh0d2Vha3MsIGN1cnJlbnQpO1xuICBjb25zdCBuZXh0ID0gbWVyZ2VNYW5hZ2VkTWNwQmxvY2soY3VycmVudCwgYnVpbHQuYmxvY2spO1xuXG4gIGlmIChuZXh0ICE9PSBjdXJyZW50KSB7XG4gICAgbWtkaXJTeW5jKGRpcm5hbWUoY29uZmlnUGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgbmV4dCwgXCJ1dGY4XCIpO1xuICB9XG5cbiAgcmV0dXJuIHsgLi4uYnVpbHQsIGNoYW5nZWQ6IG5leHQgIT09IGN1cnJlbnQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTWFuYWdlZE1jcEJsb2NrKFxuICB0d2Vha3M6IE1jcFN5bmNUd2Vha1tdLFxuICBleGlzdGluZ1RvbWwgPSBcIlwiLFxuKTogQnVpbHRNYW5hZ2VkTWNwQmxvY2sge1xuICBjb25zdCBtYW51YWxUb21sID0gc3RyaXBNYW5hZ2VkTWNwQmxvY2soZXhpc3RpbmdUb21sKTtcbiAgY29uc3QgbWFudWFsTmFtZXMgPSBmaW5kTWNwU2VydmVyTmFtZXMobWFudWFsVG9tbCk7XG4gIGNvbnN0IHVzZWROYW1lcyA9IG5ldyBTZXQobWFudWFsTmFtZXMpO1xuICBjb25zdCBzZXJ2ZXJOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc2tpcHBlZFNlcnZlck5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgdHdlYWsgb2YgdHdlYWtzKSB7XG4gICAgY29uc3QgbWNwID0gbm9ybWFsaXplTWNwU2VydmVyKHR3ZWFrLm1hbmlmZXN0Lm1jcCk7XG4gICAgaWYgKCFtY3ApIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgYmFzZU5hbWUgPSBtY3BTZXJ2ZXJOYW1lRnJvbVR3ZWFrSWQodHdlYWsubWFuaWZlc3QuaWQpO1xuICAgIGlmIChtYW51YWxOYW1lcy5oYXMoYmFzZU5hbWUpKSB7XG4gICAgICBza2lwcGVkU2VydmVyTmFtZXMucHVzaChiYXNlTmFtZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJ2ZXJOYW1lID0gcmVzZXJ2ZVVuaXF1ZU5hbWUoYmFzZU5hbWUsIHVzZWROYW1lcyk7XG4gICAgc2VydmVyTmFtZXMucHVzaChzZXJ2ZXJOYW1lKTtcbiAgICBlbnRyaWVzLnB1c2goZm9ybWF0TWNwU2VydmVyKHNlcnZlck5hbWUsIHR3ZWFrLmRpciwgbWNwKSk7XG4gIH1cblxuICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyBibG9jazogXCJcIiwgc2VydmVyTmFtZXMsIHNraXBwZWRTZXJ2ZXJOYW1lcyB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBibG9jazogW01DUF9NQU5BR0VEX1NUQVJULCAuLi5lbnRyaWVzLCBNQ1BfTUFOQUdFRF9FTkRdLmpvaW4oXCJcXG5cIiksXG4gICAgc2VydmVyTmFtZXMsXG4gICAgc2tpcHBlZFNlcnZlck5hbWVzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VNYW5hZ2VkTWNwQmxvY2soY3VycmVudFRvbWw6IHN0cmluZywgbWFuYWdlZEJsb2NrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIW1hbmFnZWRCbG9jayAmJiAhY3VycmVudFRvbWwuaW5jbHVkZXMoTUNQX01BTkFHRURfU1RBUlQpKSByZXR1cm4gY3VycmVudFRvbWw7XG4gIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBNYW5hZ2VkTWNwQmxvY2soY3VycmVudFRvbWwpLnRyaW1FbmQoKTtcbiAgaWYgKCFtYW5hZ2VkQmxvY2spIHJldHVybiBzdHJpcHBlZCA/IGAke3N0cmlwcGVkfVxcbmAgOiBcIlwiO1xuICByZXR1cm4gYCR7c3RyaXBwZWQgPyBgJHtzdHJpcHBlZH1cXG5cXG5gIDogXCJcIn0ke21hbmFnZWRCbG9ja31cXG5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBNYW5hZ2VkTWNwQmxvY2sodG9tbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgYFxcXFxuPyR7ZXNjYXBlUmVnRXhwKE1DUF9NQU5BR0VEX1NUQVJUKX1bXFxcXHNcXFxcU10qPyR7ZXNjYXBlUmVnRXhwKE1DUF9NQU5BR0VEX0VORCl9XFxcXG4/YCxcbiAgICBcImdcIixcbiAgKTtcbiAgcmV0dXJuIHRvbWwucmVwbGFjZShwYXR0ZXJuLCBcIlxcblwiKS5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWNwU2VydmVyTmFtZUZyb21Ud2Vha0lkKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB3aXRob3V0UHVibGlzaGVyID0gaWQucmVwbGFjZSgvXmNvXFwuYmVubmV0dFxcLi8sIFwiXCIpO1xuICBjb25zdCBzbHVnID0gd2l0aG91dFB1Ymxpc2hlclxuICAgIC5yZXBsYWNlKC9bXmEtekEtWjAtOV8tXSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHNsdWcgfHwgXCJ0d2Vhay1tY3BcIjtcbn1cblxuZnVuY3Rpb24gZmluZE1jcFNlcnZlck5hbWVzKHRvbWw6IHN0cmluZyk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgbmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFibGVQYXR0ZXJuID0gL15cXHMqXFxbbWNwX3NlcnZlcnNcXC4oW15cXF1cXHNdKylcXF1cXHMqJC9nbTtcbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG1hdGNoID0gdGFibGVQYXR0ZXJuLmV4ZWModG9tbCkpICE9PSBudWxsKSB7XG4gICAgbmFtZXMuYWRkKHVucXVvdGVUb21sS2V5KG1hdGNoWzFdID8/IFwiXCIpKTtcbiAgfVxuICByZXR1cm4gbmFtZXM7XG59XG5cbmZ1bmN0aW9uIHJlc2VydmVVbmlxdWVOYW1lKGJhc2VOYW1lOiBzdHJpbmcsIHVzZWROYW1lczogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIXVzZWROYW1lcy5oYXMoYmFzZU5hbWUpKSB7XG4gICAgdXNlZE5hbWVzLmFkZChiYXNlTmFtZSk7XG4gICAgcmV0dXJuIGJhc2VOYW1lO1xuICB9XG4gIGZvciAobGV0IGkgPSAyOyA7IGkgKz0gMSkge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2VOYW1lfS0ke2l9YDtcbiAgICBpZiAoIXVzZWROYW1lcy5oYXMoY2FuZGlkYXRlKSkge1xuICAgICAgdXNlZE5hbWVzLmFkZChjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWNwU2VydmVyKHZhbHVlOiBUd2Vha01jcFNlcnZlciB8IHVuZGVmaW5lZCk6IFR3ZWFrTWNwU2VydmVyIHwgbnVsbCB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlLmNvbW1hbmQgIT09IFwic3RyaW5nXCIgfHwgdmFsdWUuY29tbWFuZC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBpZiAodmFsdWUuYXJncyAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KHZhbHVlLmFyZ3MpKSByZXR1cm4gbnVsbDtcbiAgaWYgKHZhbHVlLmFyZ3M/LnNvbWUoKGFyZykgPT4gdHlwZW9mIGFyZyAhPT0gXCJzdHJpbmdcIikpIHJldHVybiBudWxsO1xuICBpZiAodmFsdWUuZW52ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIXZhbHVlLmVudiB8fCB0eXBlb2YgdmFsdWUuZW52ICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkodmFsdWUuZW52KSkgcmV0dXJuIG51bGw7XG4gICAgaWYgKE9iamVjdC52YWx1ZXModmFsdWUuZW52KS5zb21lKChlbnZWYWx1ZSkgPT4gdHlwZW9mIGVudlZhbHVlICE9PSBcInN0cmluZ1wiKSkgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNY3BTZXJ2ZXIoc2VydmVyTmFtZTogc3RyaW5nLCB0d2Vha0Rpcjogc3RyaW5nLCBtY3A6IFR3ZWFrTWNwU2VydmVyKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBbXG4gICAgYFttY3Bfc2VydmVycy4ke2Zvcm1hdFRvbWxLZXkoc2VydmVyTmFtZSl9XWAsXG4gICAgYGNvbW1hbmQgPSAke2Zvcm1hdFRvbWxTdHJpbmcocmVzb2x2ZUNvbW1hbmQodHdlYWtEaXIsIG1jcC5jb21tYW5kKSl9YCxcbiAgXTtcblxuICBpZiAobWNwLmFyZ3MgJiYgbWNwLmFyZ3MubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goYGFyZ3MgPSAke2Zvcm1hdFRvbWxTdHJpbmdBcnJheShtY3AuYXJncy5tYXAoKGFyZykgPT4gcmVzb2x2ZUFyZyh0d2Vha0RpciwgYXJnKSkpfWApO1xuICB9XG5cbiAgaWYgKG1jcC5lbnYgJiYgT2JqZWN0LmtleXMobWNwLmVudikubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goYGVudiA9ICR7Zm9ybWF0VG9tbElubGluZVRhYmxlKG1jcC5lbnYpfWApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDb21tYW5kKHR3ZWFrRGlyOiBzdHJpbmcsIGNvbW1hbmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChpc0Fic29sdXRlKGNvbW1hbmQpIHx8ICFsb29rc0xpa2VSZWxhdGl2ZVBhdGgoY29tbWFuZCkpIHJldHVybiBjb21tYW5kO1xuICByZXR1cm4gcmVzb2x2ZSh0d2Vha0RpciwgY29tbWFuZCk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVBcmcodHdlYWtEaXI6IHN0cmluZywgYXJnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoaXNBYnNvbHV0ZShhcmcpIHx8IGFyZy5zdGFydHNXaXRoKFwiLVwiKSkgcmV0dXJuIGFyZztcbiAgY29uc3QgY2FuZGlkYXRlID0gcmVzb2x2ZSh0d2Vha0RpciwgYXJnKTtcbiAgcmV0dXJuIGV4aXN0c1N5bmMoY2FuZGlkYXRlKSA/IGNhbmRpZGF0ZSA6IGFyZztcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUmVsYXRpdmVQYXRoKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlLnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCB2YWx1ZS5zdGFydHNXaXRoKFwiLi4vXCIpIHx8IHZhbHVlLmluY2x1ZGVzKFwiL1wiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbFN0cmluZyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbFN0cmluZ0FycmF5KHZhbHVlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYFske3ZhbHVlcy5tYXAoZm9ybWF0VG9tbFN0cmluZykuam9pbihcIiwgXCIpfV1gO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUb21sSW5saW5lVGFibGUocmVjb3JkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgcmV0dXJuIGB7ICR7T2JqZWN0LmVudHJpZXMocmVjb3JkKVxuICAgIC5tYXAoKFtrZXksIHZhbHVlXSkgPT4gYCR7Zm9ybWF0VG9tbEtleShrZXkpfSA9ICR7Zm9ybWF0VG9tbFN0cmluZyh2YWx1ZSl9YClcbiAgICAuam9pbihcIiwgXCIpfSB9YDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbEtleShrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAvXlthLXpBLVowLTlfLV0rJC8udGVzdChrZXkpID8ga2V5IDogZm9ybWF0VG9tbFN0cmluZyhrZXkpO1xufVxuXG5mdW5jdGlvbiB1bnF1b3RlVG9tbEtleShrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgha2V5LnN0YXJ0c1dpdGgoJ1wiJykgfHwgIWtleS5lbmRzV2l0aCgnXCInKSkgcmV0dXJuIGtleTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShrZXkpIGFzIHN0cmluZztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG59XG4iLCAiaW1wb3J0IHsgZXhlY0ZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6Y2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGhvbWVkaXIsIHBsYXRmb3JtIH0gZnJvbSBcIm5vZGU6b3NcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbnR5cGUgQ2hlY2tTdGF0dXMgPSBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcblxuZXhwb3J0IGludGVyZmFjZSBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXR1czogQ2hlY2tTdGF0dXM7XG4gIGRldGFpbDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZXJIZWFsdGgge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgc3RhdHVzOiBDaGVja1N0YXR1cztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3VtbWFyeTogc3RyaW5nO1xuICB3YXRjaGVyOiBzdHJpbmc7XG4gIGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW107XG59XG5cbmludGVyZmFjZSBJbnN0YWxsZXJTdGF0ZSB7XG4gIGFwcFJvb3Q/OiBzdHJpbmc7XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIHdhdGNoZXI/OiBcImxhdW5jaGRcIiB8IFwibG9naW4taXRlbVwiIHwgXCJzY2hlZHVsZWQtdGFza1wiIHwgXCJzeXN0ZW1kXCIgfCBcIm5vbmVcIjtcbn1cblxuaW50ZXJmYWNlIFJ1bnRpbWVDb25maWcge1xuICBjb2RleFBsdXNQbHVzPzoge1xuICAgIGF1dG9VcGRhdGU/OiBib29sZWFuO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgU2VsZlVwZGF0ZVN0YXRlIHtcbiAgc3RhdHVzPzogXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG4gIGNvbXBsZXRlZEF0Pzogc3RyaW5nO1xuICBjaGVja2VkQXQ/OiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb24/OiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuY29uc3QgTEFVTkNIRF9MQUJFTCA9IFwiY29tLmNvZGV4cGx1c3BsdXMud2F0Y2hlclwiO1xuY29uc3QgV0FUQ0hFUl9MT0cgPSBqb2luKGhvbWVkaXIoKSwgXCJMaWJyYXJ5XCIsIFwiTG9nc1wiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIubG9nXCIpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2F0Y2hlckhlYWx0aCh1c2VyUm9vdDogc3RyaW5nKTogV2F0Y2hlckhlYWx0aCB7XG4gIGNvbnN0IGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW10gPSBbXTtcbiAgY29uc3Qgc3RhdGUgPSByZWFkSnNvbjxJbnN0YWxsZXJTdGF0ZT4oam9pbih1c2VyUm9vdCwgXCJzdGF0ZS5qc29uXCIpKTtcbiAgY29uc3QgY29uZmlnID0gcmVhZEpzb248UnVudGltZUNvbmZpZz4oam9pbih1c2VyUm9vdCwgXCJjb25maWcuanNvblwiKSkgPz8ge307XG4gIGNvbnN0IHNlbGZVcGRhdGUgPSByZWFkSnNvbjxTZWxmVXBkYXRlU3RhdGU+KGpvaW4odXNlclJvb3QsIFwic2VsZi11cGRhdGUtc3RhdGUuanNvblwiKSk7XG5cbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiSW5zdGFsbCBzdGF0ZVwiLFxuICAgIHN0YXR1czogc3RhdGUgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgZGV0YWlsOiBzdGF0ZSA/IGBDb2RleCsrICR7c3RhdGUudmVyc2lvbiA/PyBcIih1bmtub3duIHZlcnNpb24pXCJ9YCA6IFwic3RhdGUuanNvbiBpcyBtaXNzaW5nXCIsXG4gIH0pO1xuXG4gIGlmICghc3RhdGUpIHJldHVybiBzdW1tYXJpemUoXCJub25lXCIsIGNoZWNrcyk7XG5cbiAgY29uc3QgYXV0b1VwZGF0ZSA9IGNvbmZpZy5jb2RleFBsdXNQbHVzPy5hdXRvVXBkYXRlICE9PSBmYWxzZTtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiQXV0b21hdGljIHJlZnJlc2hcIixcbiAgICBzdGF0dXM6IGF1dG9VcGRhdGUgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICBkZXRhaWw6IGF1dG9VcGRhdGUgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWQgaW4gQ29kZXgrKyBjb25maWdcIixcbiAgfSk7XG5cbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiV2F0Y2hlciBraW5kXCIsXG4gICAgc3RhdHVzOiBzdGF0ZS53YXRjaGVyICYmIHN0YXRlLndhdGNoZXIgIT09IFwibm9uZVwiID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgIGRldGFpbDogc3RhdGUud2F0Y2hlciA/PyBcIm5vbmVcIixcbiAgfSk7XG5cbiAgaWYgKHNlbGZVcGRhdGUpIHtcbiAgICBjaGVja3MucHVzaChzZWxmVXBkYXRlQ2hlY2soc2VsZlVwZGF0ZSkpO1xuICB9XG5cbiAgY29uc3QgYXBwUm9vdCA9IHN0YXRlLmFwcFJvb3QgPz8gXCJcIjtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiQ29kZXggYXBwXCIsXG4gICAgc3RhdHVzOiBhcHBSb290ICYmIGV4aXN0c1N5bmMoYXBwUm9vdCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgZGV0YWlsOiBhcHBSb290IHx8IFwibWlzc2luZyBhcHBSb290IGluIHN0YXRlXCIsXG4gIH0pO1xuXG4gIHN3aXRjaCAocGxhdGZvcm0oKSkge1xuICAgIGNhc2UgXCJkYXJ3aW5cIjpcbiAgICAgIGNoZWNrcy5wdXNoKC4uLmNoZWNrTGF1bmNoZFdhdGNoZXIoYXBwUm9vdCkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImxpbnV4XCI6XG4gICAgICBjaGVja3MucHVzaCguLi5jaGVja1N5c3RlbWRXYXRjaGVyKGFwcFJvb3QpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ3aW4zMlwiOlxuICAgICAgY2hlY2tzLnB1c2goLi4uY2hlY2tTY2hlZHVsZWRUYXNrV2F0Y2hlcigpKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjaGVja3MucHVzaCh7XG4gICAgICAgIG5hbWU6IFwiUGxhdGZvcm0gd2F0Y2hlclwiLFxuICAgICAgICBzdGF0dXM6IFwid2FyblwiLFxuICAgICAgICBkZXRhaWw6IGB1bnN1cHBvcnRlZCBwbGF0Zm9ybTogJHtwbGF0Zm9ybSgpfWAsXG4gICAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdW1tYXJpemUoc3RhdGUud2F0Y2hlciA/PyBcIm5vbmVcIiwgY2hlY2tzKTtcbn1cblxuZnVuY3Rpb24gc2VsZlVwZGF0ZUNoZWNrKHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBjb25zdCBhdCA9IHN0YXRlLmNvbXBsZXRlZEF0ID8/IHN0YXRlLmNoZWNrZWRBdCA/PyBcInVua25vd24gdGltZVwiO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImZhaWxlZFwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLFxuICAgICAgc3RhdHVzOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogc3RhdGUuZXJyb3IgPyBgZmFpbGVkICR7YXR9OiAke3N0YXRlLmVycm9yfWAgOiBgZmFpbGVkICR7YXR9YCxcbiAgICB9O1xuICB9XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZGlzYWJsZWRcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwid2FyblwiLCBkZXRhaWw6IGBza2lwcGVkICR7YXR9OiBhdXRvbWF0aWMgcmVmcmVzaCBkaXNhYmxlZGAgfTtcbiAgfVxuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwZGF0ZWRcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwib2tcIiwgZGV0YWlsOiBgdXBkYXRlZCAke2F0fSB0byAke3N0YXRlLmxhdGVzdFZlcnNpb24gPz8gXCJuZXcgcmVsZWFzZVwifWAgfTtcbiAgfVxuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwLXRvLWRhdGVcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwib2tcIiwgZGV0YWlsOiBgdXAgdG8gZGF0ZSAke2F0fWAgfTtcbiAgfVxuICByZXR1cm4geyBuYW1lOiBcImxhc3QgQ29kZXgrKyB1cGRhdGVcIiwgc3RhdHVzOiBcIndhcm5cIiwgZGV0YWlsOiBgY2hlY2tpbmcgc2luY2UgJHthdH1gIH07XG59XG5cbmZ1bmN0aW9uIGNoZWNrTGF1bmNoZFdhdGNoZXIoYXBwUm9vdDogc3RyaW5nKTogV2F0Y2hlckhlYWx0aENoZWNrW10ge1xuICBjb25zdCBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdID0gW107XG4gIGNvbnN0IHBsaXN0UGF0aCA9IGpvaW4oaG9tZWRpcigpLCBcIkxpYnJhcnlcIiwgXCJMYXVuY2hBZ2VudHNcIiwgYCR7TEFVTkNIRF9MQUJFTH0ucGxpc3RgKTtcbiAgY29uc3QgcGxpc3QgPSBleGlzdHNTeW5jKHBsaXN0UGF0aCkgPyByZWFkRmlsZVNhZmUocGxpc3RQYXRoKSA6IFwiXCI7XG4gIGNvbnN0IGFzYXJQYXRoID0gYXBwUm9vdCA/IGpvaW4oYXBwUm9vdCwgXCJDb250ZW50c1wiLCBcIlJlc291cmNlc1wiLCBcImFwcC5hc2FyXCIpIDogXCJcIjtcblxuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJsYXVuY2hkIHBsaXN0XCIsXG4gICAgc3RhdHVzOiBwbGlzdCA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IHBsaXN0UGF0aCxcbiAgfSk7XG5cbiAgaWYgKHBsaXN0KSB7XG4gICAgY2hlY2tzLnB1c2goe1xuICAgICAgbmFtZTogXCJsYXVuY2hkIGxhYmVsXCIsXG4gICAgICBzdGF0dXM6IHBsaXN0LmluY2x1ZGVzKExBVU5DSERfTEFCRUwpID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgICAgZGV0YWlsOiBMQVVOQ0hEX0xBQkVMLFxuICAgIH0pO1xuICAgIGNoZWNrcy5wdXNoKHtcbiAgICAgIG5hbWU6IFwibGF1bmNoZCB0cmlnZ2VyXCIsXG4gICAgICBzdGF0dXM6IGFzYXJQYXRoICYmIHBsaXN0LmluY2x1ZGVzKGFzYXJQYXRoKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogYXNhclBhdGggfHwgXCJtaXNzaW5nIGFwcFJvb3RcIixcbiAgICB9KTtcbiAgICBjaGVja3MucHVzaCh7XG4gICAgICBuYW1lOiBcIndhdGNoZXIgY29tbWFuZFwiLFxuICAgICAgc3RhdHVzOiBwbGlzdC5pbmNsdWRlcyhcIkNPREVYX1BMVVNQTFVTX1dBVENIRVI9MVwiKSAmJiBwbGlzdC5pbmNsdWRlcyhcIiB1cGRhdGUgLS13YXRjaGVyIC0tcXVpZXRcIilcbiAgICAgICAgPyBcIm9rXCJcbiAgICAgICAgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IGNvbW1hbmRTdW1tYXJ5KHBsaXN0KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsaVBhdGggPSBleHRyYWN0Rmlyc3QocGxpc3QsIC8nKFteJ10qcGFja2FnZXNcXC9pbnN0YWxsZXJcXC9kaXN0XFwvY2xpXFwuanMpJy8pO1xuICAgIGlmIChjbGlQYXRoKSB7XG4gICAgICBjaGVja3MucHVzaCh7XG4gICAgICAgIG5hbWU6IFwicmVwYWlyIENMSVwiLFxuICAgICAgICBzdGF0dXM6IGV4aXN0c1N5bmMoY2xpUGF0aCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICAgIGRldGFpbDogY2xpUGF0aCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGxvYWRlZCA9IGNvbW1hbmRTdWNjZWVkcyhcImxhdW5jaGN0bFwiLCBbXCJsaXN0XCIsIExBVU5DSERfTEFCRUxdKTtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwibGF1bmNoZCBsb2FkZWRcIixcbiAgICBzdGF0dXM6IGxvYWRlZCA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IGxvYWRlZCA/IFwic2VydmljZSBpcyBsb2FkZWRcIiA6IFwibGF1bmNoY3RsIGNhbm5vdCBmaW5kIHRoZSB3YXRjaGVyXCIsXG4gIH0pO1xuXG4gIGNoZWNrcy5wdXNoKHdhdGNoZXJMb2dDaGVjaygpKTtcbiAgcmV0dXJuIGNoZWNrcztcbn1cblxuZnVuY3Rpb24gY2hlY2tTeXN0ZW1kV2F0Y2hlcihhcHBSb290OiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSB7XG4gIGNvbnN0IGRpciA9IGpvaW4oaG9tZWRpcigpLCBcIi5jb25maWdcIiwgXCJzeXN0ZW1kXCIsIFwidXNlclwiKTtcbiAgY29uc3Qgc2VydmljZSA9IGpvaW4oZGlyLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIuc2VydmljZVwiKTtcbiAgY29uc3QgdGltZXIgPSBqb2luKGRpciwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLnRpbWVyXCIpO1xuICBjb25zdCBwYXRoVW5pdCA9IGpvaW4oZGlyLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIucGF0aFwiKTtcbiAgY29uc3QgZXhwZWN0ZWRQYXRoID0gYXBwUm9vdCA/IGpvaW4oYXBwUm9vdCwgXCJyZXNvdXJjZXNcIiwgXCJhcHAuYXNhclwiKSA6IFwiXCI7XG4gIGNvbnN0IHBhdGhCb2R5ID0gZXhpc3RzU3luYyhwYXRoVW5pdCkgPyByZWFkRmlsZVNhZmUocGF0aFVuaXQpIDogXCJcIjtcblxuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIG5hbWU6IFwic3lzdGVtZCBzZXJ2aWNlXCIsXG4gICAgICBzdGF0dXM6IGV4aXN0c1N5bmMoc2VydmljZSkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IHNlcnZpY2UsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcInN5c3RlbWQgdGltZXJcIixcbiAgICAgIHN0YXR1czogZXhpc3RzU3luYyh0aW1lcikgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IHRpbWVyLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJzeXN0ZW1kIHBhdGhcIixcbiAgICAgIHN0YXR1czogcGF0aEJvZHkgJiYgZXhwZWN0ZWRQYXRoICYmIHBhdGhCb2R5LmluY2x1ZGVzKGV4cGVjdGVkUGF0aCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IGV4cGVjdGVkUGF0aCB8fCBwYXRoVW5pdCxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwicGF0aCB1bml0IGFjdGl2ZVwiLFxuICAgICAgc3RhdHVzOiBjb21tYW5kU3VjY2VlZHMoXCJzeXN0ZW1jdGxcIiwgW1wiLS11c2VyXCIsIFwiaXMtYWN0aXZlXCIsIFwiLS1xdWlldFwiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIucGF0aFwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJzeXN0ZW1jdGwgLS11c2VyIGlzLWFjdGl2ZSBjb2RleC1wbHVzcGx1cy13YXRjaGVyLnBhdGhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwidGltZXIgYWN0aXZlXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInN5c3RlbWN0bFwiLCBbXCItLXVzZXJcIiwgXCJpcy1hY3RpdmVcIiwgXCItLXF1aWV0XCIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci50aW1lclwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJzeXN0ZW1jdGwgLS11c2VyIGlzLWFjdGl2ZSBjb2RleC1wbHVzcGx1cy13YXRjaGVyLnRpbWVyXCIsXG4gICAgfSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gY2hlY2tTY2hlZHVsZWRUYXNrV2F0Y2hlcigpOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbmFtZTogXCJsb2dvbiB0YXNrXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInNjaHRhc2tzLmV4ZVwiLCBbXCIvUXVlcnlcIiwgXCIvVE5cIiwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyXCJdKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImhvdXJseSB0YXNrXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInNjaHRhc2tzLmV4ZVwiLCBbXCIvUXVlcnlcIiwgXCIvVE5cIiwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLWhvdXJseVwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLWhvdXJseVwiLFxuICAgIH0sXG4gIF07XG59XG5cbmZ1bmN0aW9uIHdhdGNoZXJMb2dDaGVjaygpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBpZiAoIWV4aXN0c1N5bmMoV0FUQ0hFUl9MT0cpKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJ3YXRjaGVyIGxvZ1wiLCBzdGF0dXM6IFwid2FyblwiLCBkZXRhaWw6IFwibm8gd2F0Y2hlciBsb2cgeWV0XCIgfTtcbiAgfVxuICBjb25zdCB0YWlsID0gcmVhZEZpbGVTYWZlKFdBVENIRVJfTE9HKS5zcGxpdCgvXFxyP1xcbi8pLnNsaWNlKC00MCkuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGFuYWx5emVXYXRjaGVyTG9nVGFpbCh0YWlsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVXYXRjaGVyTG9nVGFpbCh0YWlsOiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBjb25zdCBoYXNFcnJvciA9IC9cdTI3MTcgY29kZXgtcGx1c3BsdXMgZmFpbGVkfGNvZGV4LXBsdXNwbHVzIGZhaWxlZHxlcnJvcnxmYWlsZWQvaS50ZXN0KHRhaWwpO1xuICBjb25zdCBuZWVkc01hbnVhbFJlcGFpciA9XG4gICAgaGFzRXJyb3IgJiZcbiAgICAvQ2Fubm90IHdyaXRlIHRvIC4qQ29kZXguKlxcLmFwcHxBcHAgTWFuYWdlbWVudHxmaWxlIG93bmVyc2hpcHxzdWRvIGNvZGV4cGx1c3BsdXMgKD86aW5zdGFsbHxyZXBhaXIpfEVBQ0NFU3xFUEVSTS9pLnRlc3QodGFpbCk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJ3YXRjaGVyIGxvZ1wiLFxuICAgIHN0YXR1czogaGFzRXJyb3IgPyBcIndhcm5cIiA6IFwib2tcIixcbiAgICBkZXRhaWw6IGhhc0Vycm9yXG4gICAgICA/IG5lZWRzTWFudWFsUmVwYWlyXG4gICAgICAgID8gXCJhdXRvLXJlcGFpciBuZWVkcyBhcHAgcGVybWlzc2lvbnM7IHJ1biBgY29kZXhwbHVzcGx1cyByZXBhaXJgIGZyb20gVGVybWluYWxcIlxuICAgICAgICA6IFwicmVjZW50IHdhdGNoZXIgbG9nIGNvbnRhaW5zIGFuIGVycm9yXCJcbiAgICAgIDogV0FUQ0hFUl9MT0csXG4gIH07XG59XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZSh3YXRjaGVyOiBzdHJpbmcsIGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW10pOiBXYXRjaGVySGVhbHRoIHtcbiAgY29uc3QgaGFzRXJyb3IgPSBjaGVja3Muc29tZSgoYykgPT4gYy5zdGF0dXMgPT09IFwiZXJyb3JcIik7XG4gIGNvbnN0IGhhc1dhcm4gPSBjaGVja3Muc29tZSgoYykgPT4gYy5zdGF0dXMgPT09IFwid2FyblwiKTtcbiAgY29uc3Qgc3RhdHVzOiBDaGVja1N0YXR1cyA9IGhhc0Vycm9yID8gXCJlcnJvclwiIDogaGFzV2FybiA/IFwid2FyblwiIDogXCJva1wiO1xuICBjb25zdCBmYWlsZWQgPSBjaGVja3MuZmlsdGVyKChjKSA9PiBjLnN0YXR1cyA9PT0gXCJlcnJvclwiKS5sZW5ndGg7XG4gIGNvbnN0IHdhcm5lZCA9IGNoZWNrcy5maWx0ZXIoKGMpID0+IGMuc3RhdHVzID09PSBcIndhcm5cIikubGVuZ3RoO1xuICBjb25zdCB0aXRsZSA9XG4gICAgc3RhdHVzID09PSBcIm9rXCJcbiAgICAgID8gXCJBdXRvLXJlcGFpciB3YXRjaGVyIGlzIHJlYWR5XCJcbiAgICAgIDogc3RhdHVzID09PSBcIndhcm5cIlxuICAgICAgICA/IFwiQXV0by1yZXBhaXIgd2F0Y2hlciBuZWVkcyByZXZpZXdcIlxuICAgICAgICA6IFwiQXV0by1yZXBhaXIgd2F0Y2hlciBpcyBub3QgcmVhZHlcIjtcbiAgY29uc3Qgc3VtbWFyeSA9XG4gICAgc3RhdHVzID09PSBcIm9rXCJcbiAgICAgID8gXCJDb2RleCsrIHNob3VsZCBhdXRvbWF0aWNhbGx5IHJlcGFpciBpdHNlbGYgYWZ0ZXIgQ29kZXggdXBkYXRlcy5cIlxuICAgICAgOiBgJHtmYWlsZWR9IGZhaWxpbmcgY2hlY2socyksICR7d2FybmVkfSB3YXJuaW5nKHMpLmA7XG5cbiAgcmV0dXJuIHtcbiAgICBjaGVja2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBzdGF0dXMsXG4gICAgdGl0bGUsXG4gICAgc3VtbWFyeSxcbiAgICB3YXRjaGVyLFxuICAgIGNoZWNrcyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29tbWFuZFN1Y2NlZWRzKGNvbW1hbmQ6IHN0cmluZywgYXJnczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICBleGVjRmlsZVN5bmMoY29tbWFuZCwgYXJncywgeyBzdGRpbzogXCJpZ25vcmVcIiwgdGltZW91dDogNV8wMDAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb21tYW5kU3VtbWFyeShwbGlzdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY29tbWFuZCA9IGV4dHJhY3RGaXJzdChwbGlzdCwgLzxzdHJpbmc+KFtePF0qKD86dXBkYXRlIC0td2F0Y2hlciAtLXF1aWV0fHJlcGFpciAtLXF1aWV0KVtePF0qKTxcXC9zdHJpbmc+Lyk7XG4gIHJldHVybiBjb21tYW5kID8gdW5lc2NhcGVYbWwoY29tbWFuZCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpIDogXCJ3YXRjaGVyIGNvbW1hbmQgbm90IGZvdW5kXCI7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGaXJzdChzb3VyY2U6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBzb3VyY2UubWF0Y2gocGF0dGVybik/LlsxXSA/PyBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkSnNvbjxUPihwYXRoOiBzdHJpbmcpOiBUIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHBhdGgsIFwidXRmOFwiKSkgYXMgVDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEZpbGVTYWZlKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlYWRGaWxlU3luYyhwYXRoLCBcInV0ZjhcIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVuZXNjYXBlWG1sKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csIFwiXFxcIlwiKVxuICAgIC5yZXBsYWNlKC8mYXBvczsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZsdDsvZywgXCI8XCIpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcbn1cbiIsICJleHBvcnQgdHlwZSBUd2Vha1Njb3BlID0gXCJyZW5kZXJlclwiIHwgXCJtYWluXCIgfCBcImJvdGhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSZWxvYWRUd2Vha3NEZXBzIHtcbiAgbG9nSW5mbyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICBzdG9wQWxsTWFpblR3ZWFrcygpOiB2b2lkO1xuICBjbGVhclR3ZWFrTW9kdWxlQ2FjaGUoKTogdm9pZDtcbiAgbG9hZEFsbE1haW5Ud2Vha3MoKTogdm9pZDtcbiAgYnJvYWRjYXN0UmVsb2FkKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0VHdlYWtFbmFibGVkQW5kUmVsb2FkRGVwcyBleHRlbmRzIFJlbG9hZFR3ZWFrc0RlcHMge1xuICBzZXRUd2Vha0VuYWJsZWQoaWQ6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01haW5Qcm9jZXNzVHdlYWtTY29wZShzY29wZTogVHdlYWtTY29wZSB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2NvcGUgIT09IFwicmVuZGVyZXJcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZFR3ZWFrcyhyZWFzb246IHN0cmluZywgZGVwczogUmVsb2FkVHdlYWtzRGVwcyk6IHZvaWQge1xuICBkZXBzLmxvZ0luZm8oYHJlbG9hZGluZyB0d2Vha3MgKCR7cmVhc29ufSlgKTtcbiAgZGVwcy5zdG9wQWxsTWFpblR3ZWFrcygpO1xuICBkZXBzLmNsZWFyVHdlYWtNb2R1bGVDYWNoZSgpO1xuICBkZXBzLmxvYWRBbGxNYWluVHdlYWtzKCk7XG4gIGRlcHMuYnJvYWRjYXN0UmVsb2FkKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUd2Vha0VuYWJsZWRBbmRSZWxvYWQoXG4gIGlkOiBzdHJpbmcsXG4gIGVuYWJsZWQ6IHVua25vd24sXG4gIGRlcHM6IFNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZERlcHMsXG4pOiB0cnVlIHtcbiAgY29uc3Qgbm9ybWFsaXplZEVuYWJsZWQgPSAhIWVuYWJsZWQ7XG4gIGRlcHMuc2V0VHdlYWtFbmFibGVkKGlkLCBub3JtYWxpemVkRW5hYmxlZCk7XG4gIGRlcHMubG9nSW5mbyhgdHdlYWsgJHtpZH0gZW5hYmxlZD0ke25vcm1hbGl6ZWRFbmFibGVkfWApO1xuICByZWxvYWRUd2Vha3MoXCJlbmFibGVkLXRvZ2dsZVwiLCBkZXBzKTtcbiAgcmV0dXJuIHRydWU7XG59XG4iLCAiaW1wb3J0IHsgYXBwZW5kRmlsZVN5bmMsIGNsb3NlU3luYywgZXhpc3RzU3luYywgb3BlblN5bmMsIHJlYWRTeW5jLCBzdGF0U3luYywgd3JpdGVGaWxlU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5cbmV4cG9ydCBjb25zdCBNQVhfTE9HX0JZVEVTID0gMTAgKiAxMDI0ICogMTAyNDtcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZENhcHBlZExvZyhwYXRoOiBzdHJpbmcsIGxpbmU6IHN0cmluZywgbWF4Qnl0ZXMgPSBNQVhfTE9HX0JZVEVTKTogdm9pZCB7XG4gIGNvbnN0IGluY29taW5nID0gQnVmZmVyLmZyb20obGluZSk7XG4gIGlmIChpbmNvbWluZy5ieXRlTGVuZ3RoID49IG1heEJ5dGVzKSB7XG4gICAgd3JpdGVGaWxlU3luYyhwYXRoLCBpbmNvbWluZy5zdWJhcnJheShpbmNvbWluZy5ieXRlTGVuZ3RoIC0gbWF4Qnl0ZXMpKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGlmIChleGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgICBjb25zdCBzaXplID0gc3RhdFN5bmMocGF0aCkuc2l6ZTtcbiAgICAgIGNvbnN0IGFsbG93ZWRFeGlzdGluZyA9IG1heEJ5dGVzIC0gaW5jb21pbmcuYnl0ZUxlbmd0aDtcbiAgICAgIGlmIChzaXplID4gYWxsb3dlZEV4aXN0aW5nKSB7XG4gICAgICAgIC8vIE1ha2Ugcm9vbSBpbiBiYXRjaGVzOiB0cmltbWluZyBqdXN0IGVub3VnaCBmb3Igb25lIGxpbmUgbGVhdmVzIGFcbiAgICAgICAgLy8gZnVsbCBmaWxlLCBmb3JjaW5nIGV2ZXJ5IHN1YnNlcXVlbnQgbGluZSB0byByZXdyaXRlIHRoZSBlbnRpcmUgbG9nLlxuICAgICAgICBjb25zdCBrZWVwQnl0ZXMgPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKG1heEJ5dGVzIC8gMikgLSBpbmNvbWluZy5ieXRlTGVuZ3RoKTtcbiAgICAgICAgY29uc3QgdGFpbCA9IEJ1ZmZlci5hbGxvYyhrZWVwQnl0ZXMpO1xuICAgICAgICBjb25zdCBmZCA9IG9wZW5TeW5jKHBhdGgsIFwiclwiKTtcbiAgICAgICAgbGV0IGJ5dGVzUmVhZCA9IDA7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgd2hpbGUgKGJ5dGVzUmVhZCA8IGtlZXBCeXRlcykge1xuICAgICAgICAgICAgY29uc3QgY291bnQgPSByZWFkU3luYyhmZCwgdGFpbCwgYnl0ZXNSZWFkLCBrZWVwQnl0ZXMgLSBieXRlc1JlYWQsIHNpemUgLSBrZWVwQnl0ZXMgKyBieXRlc1JlYWQpO1xuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSBicmVhaztcbiAgICAgICAgICAgIGJ5dGVzUmVhZCArPSBjb3VudDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgY2xvc2VTeW5jKGZkKTtcbiAgICAgICAgfVxuICAgICAgICB3cml0ZUZpbGVTeW5jKHBhdGgsIHRhaWwuc3ViYXJyYXkoMCwgYnl0ZXNSZWFkKSk7XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIHtcbiAgICAvLyBJZiB0cmltbWluZyBmYWlscywgc3RpbGwgdHJ5IHRvIGFwcGVuZCBiZWxvdzsgbG9nZ2luZyBtdXN0IGJlIGJlc3QtZWZmb3J0LlxuICB9XG5cbiAgYXBwZW5kRmlsZVN5bmMocGF0aCwgaW5jb21pbmcpO1xufVxuIiwgImltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdyB9IGZyb20gXCJlbGVjdHJvblwiO1xuaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBkaXJuYW1lLCBqb2luIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHR5cGUge1xuICBDb2RleENkcFN0YXR1cyxcbiAgQ29kZXhDZHBUYXJnZXQsXG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgQ29kZXhSdW50aW1lSW5mbyxcbiAgQ29kZXhSdW50aW1lVHlwZSxcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSdW50aW1lUHJvYmVPcHRpb25zIHtcbiAgdXNlclJvb3Q6IHN0cmluZztcbiAgcnVudGltZURpcjogc3RyaW5nO1xuICBjb2RleFZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGNoYW5uZWw6IHN0cmluZyB8IG51bGw7XG4gIGdldFdpbmRvd1NlcnZpY2VzKCk6IHVua25vd24gfCBudWxsO1xuICBnZXROYXRpdmVDYXBhYmlsaXRpZXM/KCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllc1tcIm5hdGl2ZVwiXTtcbiAgZ2V0Vmlld0NhcGFiaWxpdGllcz8oKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1widmlld3NcIl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSdW50aW1lSW5mbyhvcHRzOiBSdW50aW1lUHJvYmVPcHRpb25zKTogQ29kZXhSdW50aW1lSW5mbyB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogZGV0ZWN0UnVudGltZVR5cGUoKSxcbiAgICBjb2RleFZlcnNpb246IG9wdHMuY29kZXhWZXJzaW9uID8/IHNhZmVBcHBWZXJzaW9uKCksXG4gICAgY2hhbm5lbDogb3B0cy5jaGFubmVsLFxuICAgIGJ1aWxkRmxhdm9yOiBzYWZlQnVpbGRGbGF2b3IoKSxcbiAgICB1c2VzT3dsQXBwU2hlbGw6IG51bGwsXG4gICAgYXBwUGF0aDogc2FmZUFwcFBhdGgoKSxcbiAgICByZXNvdXJjZXNQYXRoOiBwcm9jZXNzLnJlc291cmNlc1BhdGggPz8gbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJ1bnRpbWVDYXBhYmlsaXRpZXMob3B0czogUnVudGltZVByb2JlT3B0aW9ucyk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllcyB7XG4gIGNvbnN0IHNlcnZpY2VzID0gYXNSZWNvcmQob3B0cy5nZXRXaW5kb3dTZXJ2aWNlcygpKTtcbiAgY29uc3Qgd2luZG93TWFuYWdlciA9IGFzUmVjb3JkKHNlcnZpY2VzPy53aW5kb3dNYW5hZ2VyKTtcbiAgY29uc3QgY2RwID0gZ2V0Q2RwU3RhdHVzKCk7XG4gIGNvbnN0IG5hdGl2ZSA9IG9wdHMuZ2V0TmF0aXZlQ2FwYWJpbGl0aWVzPy4oKSA/PyBkZWZhdWx0TmF0aXZlQ2FwYWJpbGl0aWVzKCk7XG4gIGNvbnN0IHZpZXdzID0gb3B0cy5nZXRWaWV3Q2FwYWJpbGl0aWVzPy4oKSA/PyBkZWZhdWx0Vmlld0NhcGFiaWxpdGllcygpO1xuICBjb25zdCBjYW5DcmVhdGVXaW5kb3cgPSB0eXBlb2Ygd2luZG93TWFuYWdlcj8uY3JlYXRlV2luZG93ID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICB0eXBlb2Ygc2VydmljZXM/LmNyZWF0ZUZyZXNoV2luZG93ID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICB0eXBlb2Ygc2VydmljZXM/LmNyZWF0ZUZyZXNoTG9jYWxXaW5kb3cgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgIHR5cGVvZiBzZXJ2aWNlcz8uZW5zdXJlSG9zdFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiO1xuICByZXR1cm4ge1xuICAgIHdpbmRvd3M6IHtcbiAgICAgIGNyZWF0ZTogY2FuQ3JlYXRlV2luZG93LFxuICAgICAgZm9jdXM6IHRydWUsXG4gICAgICBwcmltYXJ5OiB0eXBlb2Ygc2VydmljZXM/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICB0eXBlb2Ygd2luZG93TWFuYWdlcj8uZ2V0UHJpbWFyeVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiLFxuICAgICAgYnJvd3NlclZpZXc6IHR5cGVvZiB3aW5kb3dNYW5hZ2VyPy5yZWdpc3RlcldpbmRvdyA9PT0gXCJmdW5jdGlvblwiLFxuICAgIH0sXG4gICAgdmlld3MsXG4gICAgY2RwOiB7XG4gICAgICBzdXBwb3J0ZWQ6IHRydWUsXG4gICAgICBlbmFibGVkOiBjZHAuZW5hYmxlZCxcbiAgICAgIHBvcnQ6IGNkcC5wb3J0LFxuICAgIH0sXG4gICAgbmF0aXZlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2RwU3RhdHVzKCk6IENvZGV4Q2RwU3RhdHVzIHtcbiAgY29uc3QgZW5hYmxlZCA9IHByb2Nlc3MuZW52LkNPREVYUFBfUkVNT1RFX0RFQlVHID09PSBcIjFcIjtcbiAgY29uc3QgcG9ydCA9IHBhcnNlQ2RwUG9ydChwcm9jZXNzLmVudi5DT0RFWFBQX1JFTU9URV9ERUJVR19QT1JUKTtcbiAgcmV0dXJuIHtcbiAgICBzdXBwb3J0ZWQ6IHRydWUsXG4gICAgZW5hYmxlZCxcbiAgICBwb3J0OiBlbmFibGVkID8gcG9ydCA6IG51bGwsXG4gICAgdXJsOiBlbmFibGVkID8gYGh0dHA6Ly8xMjcuMC4wLjE6JHtwb3J0fWAgOiBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbGlzdENkcFRhcmdldHMoKTogUHJvbWlzZTxDb2RleENkcFRhcmdldFtdPiB7XG4gIGNvbnN0IHN0YXR1cyA9IGdldENkcFN0YXR1cygpO1xuICBpZiAoIXN0YXR1cy5lbmFibGVkIHx8ICFzdGF0dXMudXJsKSByZXR1cm4gW107XG4gIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgMTAwMCk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYCR7c3RhdHVzLnVybH0vanNvbmAsIHsgc2lnbmFsOiBjb250cm9sbGVyLnNpZ25hbCB9KTtcbiAgICBpZiAoIXJlcy5vaykgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHJvd3MgPSBhd2FpdCByZXMuanNvbigpIGFzIHVua25vd247XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHJvd3MpKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJvd3NcbiAgICAgIC5tYXAoKHJvdykgPT4gbm9ybWFsaXplQ2RwVGFyZ2V0KHJvdykpXG4gICAgICAuZmlsdGVyKChyb3cpOiByb3cgaXMgQ29kZXhDZHBUYXJnZXQgPT4gcm93ICE9PSBudWxsKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFtdO1xuICB9IGZpbmFsbHkge1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXRlY3RSdW50aW1lVHlwZSgpOiBDb2RleFJ1bnRpbWVUeXBlIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIpIHtcbiAgICBjb25zdCBhcHBSb290ID0gaW5mZXJNYWNBcHBSb290KCk7XG4gICAgaWYgKGFwcFJvb3QgJiYgZXhpc3RzU3luYyhqb2luKGFwcFJvb3QsIFwiQ29udGVudHNcIiwgXCJGcmFtZXdvcmtzXCIsIFwiQ29kZXggRnJhbWV3b3JrLmZyYW1ld29ya1wiKSkpIHtcbiAgICAgIHJldHVybiBcIm93bFwiO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBhcHBSb290ICYmXG4gICAgICBleGlzdHNTeW5jKGpvaW4oYXBwUm9vdCwgXCJDb250ZW50c1wiLCBcIkZyYW1ld29ya3NcIiwgXCJFbGVjdHJvbiBGcmFtZXdvcmsuZnJhbWV3b3JrXCIpKVxuICAgICkge1xuICAgICAgcmV0dXJuIFwiZWxlY3Ryb25cIjtcbiAgICB9XG4gICAgaWYgKHByb2Nlc3MucmVzb3VyY2VzUGF0aCAmJiBleGlzdHNTeW5jKGpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCBcImFwcC5hc2FyXCIpKSkge1xuICAgICAgcmV0dXJuIFwiZWxlY3Ryb25cIjtcbiAgICB9XG4gICAgcmV0dXJuIFwidW5rbm93blwiO1xuICB9XG4gIHJldHVybiBwcm9jZXNzLnJlc291cmNlc1BhdGggJiYgZXhpc3RzU3luYyhqb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCwgXCJhcHAuYXNhclwiKSlcbiAgICA/IFwiZWxlY3Ryb25cIlxuICAgIDogXCJ1bmtub3duXCI7XG59XG5cbmZ1bmN0aW9uIGluZmVyTWFjQXBwUm9vdCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgbWFya2VyID0gXCIuYXBwL0NvbnRlbnRzL01hY09TL1wiO1xuICBjb25zdCBpZHggPSBwcm9jZXNzLmV4ZWNQYXRoLmluZGV4T2YobWFya2VyKTtcbiAgcmV0dXJuIGlkeCA+PSAwID8gcHJvY2Vzcy5leGVjUGF0aC5zbGljZSgwLCBpZHggKyBcIi5hcHBcIi5sZW5ndGgpIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gc2FmZUFwcFZlcnNpb24oKTogc3RyaW5nIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGFwcC5nZXRWZXJzaW9uKCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVBcHBQYXRoKCk6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBhcHAuZ2V0QXBwUGF0aCgpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5yZXNvdXJjZXNQYXRoID8gam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsIFwiYXBwLmFzYXJcIikgOiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVCdWlsZEZsYXZvcigpOiBzdHJpbmcgfCBudWxsIHtcbiAgY29uc3QgYXBwUGF0aCA9IHNhZmVBcHBQYXRoKCk7XG4gIGlmICghYXBwUGF0aCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHBhcmVudCA9IGRpcm5hbWUoYXBwUGF0aCk7XG4gIGlmIChwYXJlbnQuaW5jbHVkZXMoXCJOaWdodGx5XCIpKSByZXR1cm4gXCJuaWdodGx5XCI7XG4gIHJldHVybiBhcHAuaXNQYWNrYWdlZCA/IFwicHJvZFwiIDogXCJkZXZcIjtcbn1cblxuZnVuY3Rpb24gcGFyc2VDZHBQb3J0KHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBudW1iZXIge1xuICBjb25zdCBwYXJzZWQgPSBOdW1iZXIodmFsdWUgPz8gXCI5MjIyXCIpO1xuICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihwYXJzZWQpICYmIHBhcnNlZCA+IDAgJiYgcGFyc2VkIDwgNjU1MzYgPyBwYXJzZWQgOiA5MjIyO1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0TmF0aXZlQ2FwYWJpbGl0aWVzKCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllc1tcIm5hdGl2ZVwiXSB7XG4gIHJldHVybiB7XG4gICAgaW5Qcm9jZXNzTW9kdWxlczogdHJ1ZSxcbiAgICBzd2lmdE1vZHVsZXM6IHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIsXG4gICAgYXBwS2l0RW1iZWRkaW5nOiBmYWxzZSxcbiAgICBjaGlsZFdpbmRvd092ZXJsYXk6IGZhbHNlLFxuICAgIGRpcmVjdFZpZXdBdHRhY2g6IGZhbHNlLFxuICAgIG1ldGFsVmlld3M6IGZhbHNlLFxuICAgIG5hdGl2ZUhvc3Q6IGZhbHNlLFxuICAgIGhlbHBlcnM6IHRydWUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRWaWV3Q2FwYWJpbGl0aWVzKCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllc1tcInZpZXdzXCJdIHtcbiAgcmV0dXJuIHtcbiAgICBjcmVhdGU6IGZhbHNlLFxuICAgIHByaXZhdGVWaWV3VHJlZTogZmFsc2UsXG4gICAgd2ViQ29udGVudHNWaWV3OiBmYWxzZSxcbiAgICBicm93c2VyVmlld0ZhbGxiYWNrOiB0eXBlb2YgQnJvd3NlcldpbmRvdy5mcm9tSWQgPT09IFwiZnVuY3Rpb25cIixcbiAgfTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplQ2RwVGFyZ2V0KHJvdzogdW5rbm93bik6IENvZGV4Q2RwVGFyZ2V0IHwgbnVsbCB7XG4gIGNvbnN0IHZhbHVlID0gYXNSZWNvcmQocm93KTtcbiAgaWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUuaWQgIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbHVlLnR5cGUgIT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHZhbHVlLnVybCAhPT0gXCJzdHJpbmdcIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IHZhbHVlLmlkLFxuICAgIHR5cGU6IHZhbHVlLnR5cGUsXG4gICAgdXJsOiB2YWx1ZS51cmwsXG4gICAgLi4uKHR5cGVvZiB2YWx1ZS50aXRsZSA9PT0gXCJzdHJpbmdcIiA/IHsgdGl0bGU6IHZhbHVlLnRpdGxlIH0gOiB7fSksXG4gICAgLi4uKHR5cGVvZiB2YWx1ZS53ZWJTb2NrZXREZWJ1Z2dlclVybCA9PT0gXCJzdHJpbmdcIlxuICAgICAgPyB7IHdlYlNvY2tldERlYnVnZ2VyVXJsOiB2YWx1ZS53ZWJTb2NrZXREZWJ1Z2dlclVybCB9XG4gICAgICA6IHt9KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYXNSZWNvcmQodmFsdWU6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gOiBudWxsO1xufVxuIiwgImltcG9ydCB7IEJyb3dzZXJXaW5kb3cgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IHNwYXduLCB0eXBlIENoaWxkUHJvY2Vzc1dpdGhvdXROdWxsU3RyZWFtcyB9IGZyb20gXCJub2RlOmNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJhbmRvbVVVSUQgfSBmcm9tIFwibm9kZTpjcnlwdG9cIjtcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgY3JlYXRlSW50ZXJmYWNlIH0gZnJvbSBcIm5vZGU6cmVhZGxpbmVcIjtcbmltcG9ydCB7IHJlc29sdmVOYXRpdmVUd2Vha1BhdGggfSBmcm9tIFwiLi9uYXRpdmUtcGF0aHNcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzLFxuICBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zLFxuICBOYXRpdmVIZWxwZXJSZWYsXG4gIE5hdGl2ZU1vZHVsZUtpbmQsXG4gIE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zLFxuICBOYXRpdmVNb2R1bGVSZWYsXG4gIE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucyxcbiAgTmF0aXZlUGFuZWxSZWYsXG4gIE5hdGl2ZVZpZXdBdHRhY2hPcHRpb25zLFxuICBOYXRpdmVWaWV3UmVmLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZVR3ZWFrQ29udGV4dCB7XG4gIGlkOiBzdHJpbmc7XG4gIGRpcjogc3RyaW5nO1xufVxuXG50eXBlIE5hdGl2ZUxvZyA9IChsZXZlbDogXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkO1xuXG5leHBvcnQgaW50ZXJmYWNlIE5hdGl2ZUJyaWRnZU9wdGlvbnMge1xuICBuYXRpdmVIb3N0UGF0aD86IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIExvYWRlZE5hdGl2ZU1vZHVsZSB7XG4gIGtleTogc3RyaW5nO1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIGtpbmQ6IE5hdGl2ZU1vZHVsZUtpbmQ7XG4gIHBhdGg6IHN0cmluZztcbiAgZXhwb3J0czogdW5rbm93bjtcbn1cblxuaW50ZXJmYWNlIE5hdGl2ZUluc3RhbmNlIHtcbiAga2V5OiBzdHJpbmc7XG4gIHR3ZWFrSWQ6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAga2luZDogXCJwYW5lbFwiIHwgXCJ2aWV3XCI7XG4gIHZhbHVlOiB1bmtub3duO1xuICBwYXJlbnRXaW5kb3dJZDogbnVtYmVyIHwgbnVsbDtcbiAgd2luZG93SWQ6IG51bWJlciB8IG51bGw7XG4gIGRpc3Bvc2VCaW5kaW5nczogQXJyYXk8KCkgPT4gdm9pZD47XG4gIGRpc3Bvc2luZzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEhlbHBlclJlcXVlc3Qge1xuICByZXNvbHZlKHZhbHVlOiB1bmtub3duKTogdm9pZDtcbiAgcmVqZWN0KGVycm9yOiBFcnJvcik6IHZvaWQ7XG4gIHRpbWVyOiBOb2RlSlMuVGltZW91dDtcbn1cblxuaW50ZXJmYWNlIE5hdGl2ZUhlbHBlclByb2Nlc3Mge1xuICBrZXk6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBpZDogc3RyaW5nO1xuICBjaGlsZDogQ2hpbGRQcm9jZXNzV2l0aG91dE51bGxTdHJlYW1zO1xuICBwZW5kaW5nOiBNYXA8c3RyaW5nLCBIZWxwZXJSZXF1ZXN0Pjtcbn1cblxuZXhwb3J0IGNsYXNzIE5hdGl2ZUJyaWRnZSB7XG4gIHByaXZhdGUgbW9kdWxlcyA9IG5ldyBNYXA8c3RyaW5nLCBMb2FkZWROYXRpdmVNb2R1bGU+KCk7XG4gIHByaXZhdGUgaW5zdGFuY2VzID0gbmV3IE1hcDxzdHJpbmcsIE5hdGl2ZUluc3RhbmNlPigpO1xuICBwcml2YXRlIGhlbHBlcnMgPSBuZXcgTWFwPHN0cmluZywgTmF0aXZlSGVscGVyUHJvY2Vzcz4oKTtcbiAgcHJpdmF0ZSBuYXRpdmVIb3N0RXhwb3J0czogdW5rbm93biB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG5hdGl2ZUhvc3RMb2FkRXJyb3I6IEVycm9yIHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBsb2c6IE5hdGl2ZUxvZyxcbiAgICBwcml2YXRlIHJlYWRvbmx5IG9wdGlvbnM6IE5hdGl2ZUJyaWRnZU9wdGlvbnMgPSB7fSxcbiAgKSB7fVxuXG4gIGdldENhcGFiaWxpdGllcygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJuYXRpdmVcIl0ge1xuICAgIGNvbnN0IGhvc3QgPSB0aGlzLmxvYWROYXRpdmVIb3N0KGZhbHNlKTtcbiAgICBjb25zdCBob3N0Q2FwYWJpbGl0aWVzID0gaG9zdCA/IHRoaXMucmVhZE5hdGl2ZUhvc3RDYXBhYmlsaXRpZXMoaG9zdCkgOiB7fTtcbiAgICBjb25zdCBuYXRpdmVIb3N0ID0gaG9zdCAhPT0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgaW5Qcm9jZXNzTW9kdWxlczogdHJ1ZSxcbiAgICAgIHN3aWZ0TW9kdWxlczogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIixcbiAgICAgIGFwcEtpdEVtYmVkZGluZzogQm9vbGVhbihob3N0Q2FwYWJpbGl0aWVzLmFwcEtpdEVtYmVkZGluZyksXG4gICAgICBjaGlsZFdpbmRvd092ZXJsYXk6IEJvb2xlYW4oaG9zdENhcGFiaWxpdGllcy5jaGlsZFdpbmRvd092ZXJsYXkpLFxuICAgICAgZGlyZWN0Vmlld0F0dGFjaDogQm9vbGVhbihob3N0Q2FwYWJpbGl0aWVzLmRpcmVjdFZpZXdBdHRhY2gpLFxuICAgICAgbWV0YWxWaWV3czogQm9vbGVhbihob3N0Q2FwYWJpbGl0aWVzLm1ldGFsVmlld3MpLFxuICAgICAgbmF0aXZlSG9zdCxcbiAgICAgIGhlbHBlcnM6IHRydWUsXG4gICAgfTtcbiAgfVxuXG4gIGxvYWRNb2R1bGUoY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsIG9wdGlvbnM6IE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zKTogTmF0aXZlTW9kdWxlUmVmIHtcbiAgICBjb25zdCBpZCA9IGFzc2VydEJyaWRnZUlkKG9wdGlvbnMuaWQsIFwibmF0aXZlIG1vZHVsZSBpZFwiKTtcbiAgICBjb25zdCBmdWxsUGF0aCA9IHJlc29sdmVUd2Vha1BhdGgoY3R4LCBvcHRpb25zLnBhdGgpO1xuICAgIGNvbnN0IGtpbmQgPSBvcHRpb25zLmtpbmQgPz8gaW5mZXJNb2R1bGVLaW5kKGZ1bGxQYXRoKTtcblxuICAgIGlmIChraW5kICE9PSBcIm5vZGUtYWRkb25cIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgJHtraW5kfSBuYXRpdmUgbW9kdWxlcyBtdXN0IGJlIGxvYWRlZCB0aHJvdWdoIGEgLm5vZGUgT2JqZWN0aXZlLUMrKyBzaGltIGluIENvZGV4KysgMS4wLjBgLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIWZ1bGxQYXRoLmVuZHNXaXRoKFwiLm5vZGVcIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm5vZGUtYWRkb24gbmF0aXZlIG1vZHVsZXMgbXVzdCB1c2UgYSAubm9kZSBmaWxlXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGxvYWRlZCA9IHJlcXVpcmUoZnVsbFBhdGgpIGFzIHVua25vd247XG4gICAgY29uc3QgZXhwb3J0cyA9IHNlbGVjdEVudHJ5cG9pbnQobG9hZGVkLCBvcHRpb25zLmVudHJ5cG9pbnQpO1xuICAgIGNvbnN0IGtleSA9IG1vZHVsZUtleShjdHguaWQsIGlkKTtcbiAgICB0aGlzLm1vZHVsZXMuc2V0KGtleSwgeyBrZXksIHR3ZWFrSWQ6IGN0eC5pZCwgaWQsIGtpbmQsIHBhdGg6IGZ1bGxQYXRoLCBleHBvcnRzIH0pO1xuICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgbG9hZGVkIG5hdGl2ZSBtb2R1bGUgJHtjdHguaWR9OiR7aWR9YCwgeyBraW5kLCBwYXRoOiBmdWxsUGF0aCB9KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGVSZWYoY3R4LmlkLCBpZCwga2luZCk7XG4gIH1cblxuICBhc3luYyBjcmVhdGVQYW5lbChjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCwgb3B0aW9uczogTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zKTogUHJvbWlzZTxOYXRpdmVQYW5lbFJlZj4ge1xuICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5hdGl2ZUluc3RhbmNlKGN0eCwgXCJwYW5lbFwiLCBvcHRpb25zLm1vZHVsZUlkLCBvcHRpb25zLmZhY3RvcnkgPz8gXCJjcmVhdGVQYW5lbFwiLCB7XG4gICAgICBwYXJlbnRXaW5kb3dJZDogb3B0aW9ucy5wYXJlbnRXaW5kb3dJZCxcbiAgICAgIGJvdW5kczogb3B0aW9ucy5ib3VuZHMsXG4gICAgICB0cmFuc3BhcmVudDogb3B0aW9ucy50cmFuc3BhcmVudCA9PT0gdHJ1ZSxcbiAgICAgIHBhc3N0aHJvdWdoTW91c2U6IG9wdGlvbnMucGFzc3Rocm91Z2hNb3VzZSA9PT0gdHJ1ZSxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy5wYW5lbFJlZihjcmVhdGVkKTtcbiAgfVxuXG4gIGFzeW5jIGF0dGFjaFZpZXcoY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsIG9wdGlvbnM6IE5hdGl2ZVZpZXdBdHRhY2hPcHRpb25zKTogUHJvbWlzZTxOYXRpdmVWaWV3UmVmPiB7XG4gICAgY29uc3QgY3JlYXRlZCA9IGF3YWl0IHRoaXMuY3JlYXRlTmF0aXZlSW5zdGFuY2UoY3R4LCBcInZpZXdcIiwgb3B0aW9ucy5tb2R1bGVJZCwgb3B0aW9ucy5mYWN0b3J5ID8/IFwiYXR0YWNoVmlld1wiLCB7XG4gICAgICBwYXJlbnRXaW5kb3dJZDogb3B0aW9ucy5wYXJlbnRXaW5kb3dJZCxcbiAgICAgIGJvdW5kczogb3B0aW9ucy5ib3VuZHMsXG4gICAgICB6SW5kZXg6IG9wdGlvbnMuekluZGV4LFxuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLnZpZXdSZWYoY3JlYXRlZCk7XG4gIH1cblxuICBsYXVuY2hIZWxwZXIoY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsIG9wdGlvbnM6IE5hdGl2ZUhlbHBlckxhdW5jaE9wdGlvbnMpOiBOYXRpdmVIZWxwZXJSZWYge1xuICAgIGNvbnN0IGlkID0gYXNzZXJ0QnJpZGdlSWQob3B0aW9ucy5pZCwgXCJuYXRpdmUgaGVscGVyIGlkXCIpO1xuICAgIGlmICgob3B0aW9ucy50cmFuc3BvcnQgPz8gXCJzdGRpb1wiKSAhPT0gXCJzdGRpb1wiKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgaGVscGVycyBzdXBwb3J0IG9ubHkgc3RkaW8gdHJhbnNwb3J0IGluIENvZGV4KysgMS4wLjBcIik7XG4gICAgfVxuICAgIGlmICgob3B0aW9ucy5yZXN0YXJ0ID8/IFwibmV2ZXJcIikgIT09IFwibmV2ZXJcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIGhlbHBlciByZXN0YXJ0IHBvbGljaWVzIGFyZSBub3QgYXZhaWxhYmxlIGluIENvZGV4KysgMS4wLjBcIik7XG4gICAgfVxuICAgIGNvbnN0IGV4ZWN1dGFibGUgPSByZXNvbHZlVHdlYWtQYXRoKGN0eCwgb3B0aW9ucy5leGVjdXRhYmxlKTtcbiAgICBjb25zdCBhcmdzID0gb3B0aW9ucy5hcmdzID8/IFtdO1xuICAgIGNvbnN0IGVudiA9IHsgLi4ucHJvY2Vzcy5lbnYsIC4uLihvcHRpb25zLmVudiA/PyB7fSkgfTtcbiAgICBjb25zdCBjaGlsZCA9IHNwYXduKGV4ZWN1dGFibGUsIGFyZ3MsIHtcbiAgICAgIGN3ZDogY3R4LmRpcixcbiAgICAgIGVudixcbiAgICAgIHN0ZGlvOiBbXCJwaXBlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gICAgfSk7XG4gICAgY29uc3Qga2V5ID0gaGVscGVyS2V5KGN0eC5pZCwgaWQpO1xuICAgIGNvbnN0IGhlbHBlcjogTmF0aXZlSGVscGVyUHJvY2VzcyA9IHtcbiAgICAgIGtleSxcbiAgICAgIHR3ZWFrSWQ6IGN0eC5pZCxcbiAgICAgIGlkLFxuICAgICAgY2hpbGQsXG4gICAgICBwZW5kaW5nOiBuZXcgTWFwKCksXG4gICAgfTtcbiAgICB0aGlzLmhlbHBlcnMuc2V0KGtleSwgaGVscGVyKTtcblxuICAgIGNvbnN0IHN0ZG91dCA9IGNyZWF0ZUludGVyZmFjZSh7IGlucHV0OiBjaGlsZC5zdGRvdXQgfSk7XG4gICAgc3Rkb3V0Lm9uKFwibGluZVwiLCAobGluZSkgPT4gdGhpcy5oYW5kbGVIZWxwZXJMaW5lKGhlbHBlciwgbGluZSkpO1xuICAgIGNoaWxkLnN0ZGVyci5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XG4gICAgICB0aGlzLmxvZyhcIndhcm5cIiwgYG5hdGl2ZSBoZWxwZXIgJHtjdHguaWR9OiR7aWR9IHN0ZGVycmAsIFN0cmluZyhjaHVuaykpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKFwiZXhpdFwiLCAoY29kZSwgc2lnbmFsKSA9PiB7XG4gICAgICB0aGlzLmxvZyhcImluZm9cIiwgYG5hdGl2ZSBoZWxwZXIgJHtjdHguaWR9OiR7aWR9IGV4aXRlZGAsIHsgY29kZSwgc2lnbmFsIH0pO1xuICAgICAgdGhpcy5oZWxwZXJzLmRlbGV0ZShrZXkpO1xuICAgICAgZm9yIChjb25zdCByZXF1ZXN0IG9mIGhlbHBlci5wZW5kaW5nLnZhbHVlcygpKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVyKTtcbiAgICAgICAgcmVxdWVzdC5yZWplY3QobmV3IEVycm9yKGBuYXRpdmUgaGVscGVyIGV4aXRlZCBiZWZvcmUgcmVzcG9uc2VgKSk7XG4gICAgICB9XG4gICAgICBoZWxwZXIucGVuZGluZy5jbGVhcigpO1xuICAgIH0pO1xuICAgIGNoaWxkLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgICB0aGlzLmxvZyhcImVycm9yXCIsIGBuYXRpdmUgaGVscGVyICR7Y3R4LmlkfToke2lkfSBmYWlsZWRgLCBlcnJvcik7XG4gICAgICB0aGlzLmhlbHBlcnMuZGVsZXRlKGtleSk7XG4gICAgICBmb3IgKGNvbnN0IHJlcXVlc3Qgb2YgaGVscGVyLnBlbmRpbmcudmFsdWVzKCkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZXIpO1xuICAgICAgICByZXF1ZXN0LnJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgICBoZWxwZXIucGVuZGluZy5jbGVhcigpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5sb2coXCJpbmZvXCIsIGBsYXVuY2hlZCBuYXRpdmUgaGVscGVyICR7Y3R4LmlkfToke2lkfWAsIHsgcGlkOiBjaGlsZC5waWQsIGV4ZWN1dGFibGUgfSk7XG4gICAgcmV0dXJuIHRoaXMuaGVscGVyUmVmKGN0eC5pZCwgaWQsIGNoaWxkLnBpZCA/PyAtMSk7XG4gIH1cblxuICBkaXNwb3NlVHdlYWsodHdlYWtJZDogc3RyaW5nKTogdm9pZCB7XG4gICAgZm9yIChjb25zdCBba2V5LCBpbnN0YW5jZV0gb2YgWy4uLnRoaXMuaW5zdGFuY2VzXSkge1xuICAgICAgaWYgKGluc3RhbmNlLnR3ZWFrSWQgIT09IHR3ZWFrSWQpIGNvbnRpbnVlO1xuICAgICAgdm9pZCB0aGlzLmRpc3Bvc2VJbnN0YW5jZShpbnN0YW5jZSkuZmluYWxseSgoKSA9PiB0aGlzLmluc3RhbmNlcy5kZWxldGUoa2V5KSk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgW2tleSwgaGVscGVyXSBvZiBbLi4udGhpcy5oZWxwZXJzXSkge1xuICAgICAgaWYgKGhlbHBlci50d2Vha0lkICE9PSB0d2Vha0lkKSBjb250aW51ZTtcbiAgICAgIHRoaXMuc3RvcEhlbHBlcihoZWxwZXIpO1xuICAgICAgdGhpcy5oZWxwZXJzLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrZXksIG1vZF0gb2YgWy4uLnRoaXMubW9kdWxlc10pIHtcbiAgICAgIGlmIChtb2QudHdlYWtJZCAhPT0gdHdlYWtJZCkgY29udGludWU7XG4gICAgICB2b2lkIGNhbGxPcHRpb25hbChtb2QuZXhwb3J0cywgXCJkaXNwb3NlXCIsIFtdKTtcbiAgICAgIHRoaXMubW9kdWxlcy5kZWxldGUoa2V5KTtcbiAgICB9XG4gIH1cblxuICBkaXNwb3NlQWxsKCk6IHZvaWQge1xuICAgIGNvbnN0IHR3ZWFrSWRzID0gbmV3IFNldChbXG4gICAgICAuLi5bLi4udGhpcy5tb2R1bGVzLnZhbHVlcygpXS5tYXAoKGl0ZW0pID0+IGl0ZW0udHdlYWtJZCksXG4gICAgICAuLi5bLi4udGhpcy5pbnN0YW5jZXMudmFsdWVzKCldLm1hcCgoaXRlbSkgPT4gaXRlbS50d2Vha0lkKSxcbiAgICAgIC4uLlsuLi50aGlzLmhlbHBlcnMudmFsdWVzKCldLm1hcCgoaXRlbSkgPT4gaXRlbS50d2Vha0lkKSxcbiAgICBdKTtcbiAgICBmb3IgKGNvbnN0IGlkIG9mIHR3ZWFrSWRzKSB0aGlzLmRpc3Bvc2VUd2VhayhpZCk7XG4gIH1cblxuICBhc3luYyBjYWxsSW5zdGFuY2UoXG4gICAgdHdlYWtJZDogc3RyaW5nLFxuICAgIGtpbmQ6IFwicGFuZWxcIiB8IFwidmlld1wiLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgYXJnPzogdW5rbm93bixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKGtpbmQgPT09IFwicGFuZWxcIikge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJzZXRCb3VuZHNcIikgcmV0dXJuIHRoaXMuaW52b2tlSW5zdGFuY2UodHdlYWtJZCwgaWQsIFwic2V0Qm91bmRzXCIsIFthcmddKTtcbiAgICAgIGlmIChtZXRob2QgPT09IFwic2hvd1wiKSByZXR1cm4gdGhpcy5pbnZva2VJbnN0YW5jZSh0d2Vha0lkLCBpZCwgXCJzaG93XCIsIFtdKTtcbiAgICAgIGlmIChtZXRob2QgPT09IFwiaGlkZVwiKSByZXR1cm4gdGhpcy5pbnZva2VJbnN0YW5jZSh0d2Vha0lkLCBpZCwgXCJoaWRlXCIsIFtdKTtcbiAgICAgIGlmIChtZXRob2QgPT09IFwiZGlzcG9zZVwiKSByZXR1cm4gdGhpcy5kaXNwb3NlSW5zdGFuY2VCeUlkKHR3ZWFrSWQsIGlkKTtcbiAgICB9XG4gICAgaWYgKGtpbmQgPT09IFwidmlld1wiKSB7XG4gICAgICBpZiAobWV0aG9kID09PSBcInNldEJvdW5kc1wiKSByZXR1cm4gdGhpcy5pbnZva2VJbnN0YW5jZSh0d2Vha0lkLCBpZCwgXCJzZXRCb3VuZHNcIiwgW2FyZ10pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJzZXRWaXNpYmxlXCIpIHJldHVybiB0aGlzLmludm9rZUluc3RhbmNlKHR3ZWFrSWQsIGlkLCBcInNldFZpc2libGVcIiwgW2FyZ10pO1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJkaXNwb3NlXCIpIHJldHVybiB0aGlzLmRpc3Bvc2VJbnN0YW5jZUJ5SWQodHdlYWtJZCwgaWQpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gbmF0aXZlICR7a2luZH0gbWV0aG9kOiAke21ldGhvZH1gKTtcbiAgfVxuXG4gIGFzeW5jIGNhbGxIZWxwZXIoXG4gICAgdHdlYWtJZDogc3RyaW5nLFxuICAgIGhlbHBlcklkOiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgcGF5bG9hZD86IHVua25vd24sXG4gICAgdGltZW91dE1zPzogbnVtYmVyLFxuICApOiBQcm9taXNlPHVua25vd24+IHtcbiAgICBpZiAobWV0aG9kID09PSBcInNlbmRcIikgcmV0dXJuIHRoaXMuc2VuZEhlbHBlcih0d2Vha0lkLCBoZWxwZXJJZCwgcGF5bG9hZCk7XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJyZXF1ZXN0XCIpIHJldHVybiB0aGlzLnJlcXVlc3RIZWxwZXIodHdlYWtJZCwgaGVscGVySWQsIHBheWxvYWQsIHRpbWVvdXRNcyk7XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJzdG9wXCIpIHJldHVybiB0aGlzLnN0b3BIZWxwZXJCeUlkKHR3ZWFrSWQsIGhlbHBlcklkKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gbmF0aXZlIGhlbHBlciBtZXRob2Q6ICR7bWV0aG9kfWApO1xuICB9XG5cbiAgcHJpdmF0ZSBtb2R1bGVSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBraW5kID0gdGhpcy5tb2R1bGVGb3IodHdlYWtJZCwgaWQpLmtpbmQpOiBOYXRpdmVNb2R1bGVSZWYge1xuICAgIHJldHVybiB7XG4gICAgICBpZCxcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0OiAobWV0aG9kLCBwYXlsb2FkLCB0aW1lb3V0TXMpID0+XG4gICAgICAgIHRoaXMucmVxdWVzdE1vZHVsZSh0d2Vha0lkLCBpZCwgbWV0aG9kLCBwYXlsb2FkLCB0aW1lb3V0TXMpLFxuICAgICAgZGlzcG9zZTogKCkgPT4gdGhpcy5kaXNwb3NlTW9kdWxlKHR3ZWFrSWQsIGlkKSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBwYW5lbFJlZihpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UpOiBOYXRpdmVQYW5lbFJlZiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBpbnN0YW5jZS5pZCxcbiAgICAgIHdpbmRvd0lkOiBpbnN0YW5jZS53aW5kb3dJZCxcbiAgICAgIHNldEJvdW5kczogKGJvdW5kcykgPT4gdGhpcy5pbnZva2VJbnN0YW5jZShpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCwgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pLFxuICAgICAgc2hvdzogKCkgPT4gdGhpcy5pbnZva2VJbnN0YW5jZShpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCwgXCJzaG93XCIsIFtdKSxcbiAgICAgIGhpZGU6ICgpID0+IHRoaXMuaW52b2tlSW5zdGFuY2UoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQsIFwiaGlkZVwiLCBbXSksXG4gICAgICBkaXNwb3NlOiAoKSA9PiB0aGlzLmRpc3Bvc2VJbnN0YW5jZUJ5SWQoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQpLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHZpZXdSZWYoaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlKTogTmF0aXZlVmlld1JlZiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBpbnN0YW5jZS5pZCxcbiAgICAgIHNldEJvdW5kczogKGJvdW5kcykgPT4gdGhpcy5pbnZva2VJbnN0YW5jZShpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCwgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pLFxuICAgICAgc2V0VmlzaWJsZTogKHZpc2libGUpID0+IHRoaXMuaW52b2tlSW5zdGFuY2UoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQsIFwic2V0VmlzaWJsZVwiLCBbdmlzaWJsZV0pLFxuICAgICAgZGlzcG9zZTogKCkgPT4gdGhpcy5kaXNwb3NlSW5zdGFuY2VCeUlkKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkKSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBoZWxwZXJSZWYodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBwaWQ6IG51bWJlcik6IE5hdGl2ZUhlbHBlclJlZiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkLFxuICAgICAgcGlkLFxuICAgICAgc2VuZDogKG1lc3NhZ2UpID0+IHRoaXMuc2VuZEhlbHBlcih0d2Vha0lkLCBpZCwgbWVzc2FnZSksXG4gICAgICByZXF1ZXN0OiAobWVzc2FnZSwgdGltZW91dE1zKSA9PiB0aGlzLnJlcXVlc3RIZWxwZXIodHdlYWtJZCwgaWQsIG1lc3NhZ2UsIHRpbWVvdXRNcyksXG4gICAgICBzdG9wOiAoKSA9PiB0aGlzLnN0b3BIZWxwZXJCeUlkKHR3ZWFrSWQsIGlkKSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgcmVxdWVzdE1vZHVsZShcbiAgICB0d2Vha0lkOiBzdHJpbmcsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBwYXlsb2FkPzogdW5rbm93bixcbiAgICBfdGltZW91dE1zPzogbnVtYmVyLFxuICApOiBQcm9taXNlPHVua25vd24+IHtcbiAgICBjb25zdCBtb2QgPSB0aGlzLm1vZHVsZUZvcih0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgdGFyZ2V0ID0gYXNSZWNvcmQobW9kLmV4cG9ydHMpO1xuICAgIGNvbnN0IGZuID0gdGFyZ2V0Py5yZXF1ZXN0O1xuICAgIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIGF3YWl0IGZuLmNhbGwobW9kLmV4cG9ydHMsIG1ldGhvZCwgcGF5bG9hZCk7XG4gICAgfVxuICAgIGNvbnN0IG1ldGhvZEZuID0gdGFyZ2V0Py5bbWV0aG9kXTtcbiAgICBpZiAodHlwZW9mIG1ldGhvZEZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiBhd2FpdCBtZXRob2RGbi5jYWxsKG1vZC5leHBvcnRzLCBwYXlsb2FkKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgbW9kdWxlICR7dHdlYWtJZH06JHtpZH0gaGFzIG5vIHJlcXVlc3QoKSBvciAke21ldGhvZH0oKWApO1xuICB9XG5cbiAgYXN5bmMgZGlzcG9zZU1vZHVsZSh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBrZXkgPSBtb2R1bGVLZXkodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IG1vZCA9IHRoaXMubW9kdWxlcy5nZXQoa2V5KTtcbiAgICBpZiAoIW1vZCkgcmV0dXJuO1xuICAgIGF3YWl0IGNhbGxPcHRpb25hbChtb2QuZXhwb3J0cywgXCJkaXNwb3NlXCIsIFtdKTtcbiAgICB0aGlzLm1vZHVsZXMuZGVsZXRlKGtleSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZU5hdGl2ZUluc3RhbmNlKFxuICAgIGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LFxuICAgIGtpbmQ6IFwicGFuZWxcIiB8IFwidmlld1wiLFxuICAgIG1vZHVsZUlkOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gICAgZmFjdG9yeTogc3RyaW5nLFxuICAgIG9wdGlvbnM6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiBQcm9taXNlPE5hdGl2ZUluc3RhbmNlPiB7XG4gICAgY29uc3QgdGFyZ2V0ID0gbW9kdWxlSWQgPyB0aGlzLm1vZHVsZUZvcihjdHguaWQsIG1vZHVsZUlkKS5leHBvcnRzIDogdGhpcy5sb2FkTmF0aXZlSG9zdCh0cnVlKTtcbiAgICBjb25zdCBmbiA9IGFzUmVjb3JkKHRhcmdldCk/LltmYWN0b3J5XTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGNvbnN0IGxhYmVsID0gbW9kdWxlSWQgPyBgbmF0aXZlIG1vZHVsZSAke2N0eC5pZH06JHttb2R1bGVJZH1gIDogXCJDb2RleCsrIG5hdGl2ZSBob3N0XCI7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGFiZWx9IGhhcyBubyBmYWN0b3J5ICR7ZmFjdG9yeX0oKWApO1xuICAgIH1cblxuICAgIGNvbnN0IHBhcmVudFdpbmRvdyA9IHR5cGVvZiBvcHRpb25zLnBhcmVudFdpbmRvd0lkID09PSBcIm51bWJlclwiXG4gICAgICA/IEJyb3dzZXJXaW5kb3cuZnJvbUlkKG9wdGlvbnMucGFyZW50V2luZG93SWQpXG4gICAgICA6IEJyb3dzZXJXaW5kb3cuZ2V0Rm9jdXNlZFdpbmRvdygpO1xuICAgIGNvbnN0IHBhcmVudE5hdGl2ZUhhbmRsZSA9IG5hdGl2ZUhhbmRsZUZvcldpbmRvdyhwYXJlbnRXaW5kb3cpO1xuICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgZm4uY2FsbCh0YXJnZXQsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBwYXJlbnRXaW5kb3dJZDogd2luZG93SWRGb3IocGFyZW50V2luZG93KSxcbiAgICAgIHBhcmVudFdlYkNvbnRlbnRzSWQ6IHdlYkNvbnRlbnRzSWRGb3IocGFyZW50V2luZG93KSxcbiAgICAgIHBhcmVudE5hdGl2ZUhhbmRsZSxcbiAgICB9KTtcbiAgICBjb25zdCBpZCA9IHR5cGVvZiBhc1JlY29yZCh2YWx1ZSk/LmlkID09PSBcInN0cmluZ1wiID8gU3RyaW5nKGFzUmVjb3JkKHZhbHVlKT8uaWQpIDogcmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IHdpbmRvd0lkID0gdHlwZW9mIGFzUmVjb3JkKHZhbHVlKT8ud2luZG93SWQgPT09IFwibnVtYmVyXCIgPyBOdW1iZXIoYXNSZWNvcmQodmFsdWUpPy53aW5kb3dJZCkgOiBudWxsO1xuICAgIGNvbnN0IGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSA9IHtcbiAgICAgIGtleTogaW5zdGFuY2VLZXkoY3R4LmlkLCBpZCksXG4gICAgICB0d2Vha0lkOiBjdHguaWQsXG4gICAgICBpZCxcbiAgICAgIGtpbmQsXG4gICAgICB2YWx1ZSxcbiAgICAgIHBhcmVudFdpbmRvd0lkOiB3aW5kb3dJZEZvcihwYXJlbnRXaW5kb3cpLFxuICAgICAgd2luZG93SWQsXG4gICAgICBkaXNwb3NlQmluZGluZ3M6IFtdLFxuICAgICAgZGlzcG9zaW5nOiBmYWxzZSxcbiAgICB9O1xuICAgIHRoaXMuaW5zdGFuY2VzLnNldChpbnN0YW5jZS5rZXksIGluc3RhbmNlKTtcbiAgICBpZiAoY2FuQmluZFBhcmVudFdpbmRvdyhwYXJlbnRXaW5kb3cpKSB7XG4gICAgICB0aGlzLmJpbmRJbnN0YW5jZVRvUGFyZW50KGluc3RhbmNlLCBwYXJlbnRXaW5kb3cpO1xuICAgICAgdGhpcy5zeW5jUGFyZW50U3RhdGUoaW5zdGFuY2UsIHBhcmVudFdpbmRvdywgXCJjcmVhdGVkXCIpO1xuICAgIH1cbiAgICB0aGlzLmxvZyhcImluZm9cIiwgYGNyZWF0ZWQgbmF0aXZlICR7a2luZH0gJHtjdHguaWR9OiR7aWR9YCwge1xuICAgICAgbW9kdWxlSWQ6IG1vZHVsZUlkID8/IFwiY29kZXhwcC5uYXRpdmUtaG9zdFwiLFxuICAgICAgZmFjdG9yeSxcbiAgICAgIHdpbmRvd0lkLFxuICAgIH0pO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuXG4gIHByaXZhdGUgbG9hZE5hdGl2ZUhvc3QocmVxdWlyZWQ6IHRydWUpOiB1bmtub3duO1xuICBwcml2YXRlIGxvYWROYXRpdmVIb3N0KHJlcXVpcmVkOiBmYWxzZSk6IHVua25vd24gfCBudWxsO1xuICBwcml2YXRlIGxvYWROYXRpdmVIb3N0KHJlcXVpcmVkOiBib29sZWFuKTogdW5rbm93biB8IG51bGwge1xuICAgIGlmICh0aGlzLm5hdGl2ZUhvc3RFeHBvcnRzKSByZXR1cm4gdGhpcy5uYXRpdmVIb3N0RXhwb3J0cztcbiAgICBpZiAodGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yICYmICFyZXF1aXJlZCkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgbmF0aXZlSG9zdFBhdGggPSB0aGlzLm9wdGlvbnMubmF0aXZlSG9zdFBhdGg7XG4gICAgaWYgKCFuYXRpdmVIb3N0UGF0aCB8fCAhZXhpc3RzU3luYyhuYXRpdmVIb3N0UGF0aCkpIHtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFwiQ29kZXgrKyBuYXRpdmUgaG9zdCBpcyBub3QgaW5zdGFsbGVkXCIpO1xuICAgICAgdGhpcy5uYXRpdmVIb3N0TG9hZEVycm9yID0gZXJyb3I7XG4gICAgICBpZiAocmVxdWlyZWQpIHRocm93IGVycm9yO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB0aGlzLm5hdGl2ZUhvc3RFeHBvcnRzID0gcmVxdWlyZShuYXRpdmVIb3N0UGF0aCkgYXMgdW5rbm93bjtcbiAgICAgIHRoaXMubmF0aXZlSG9zdExvYWRFcnJvciA9IG51bGw7XG4gICAgICB0aGlzLmxvZyhcImluZm9cIiwgXCJsb2FkZWQgQ29kZXgrKyBuYXRpdmUgaG9zdFwiLCB7IHBhdGg6IG5hdGl2ZUhvc3RQYXRoIH0pO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlSG9zdEV4cG9ydHM7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMubmF0aXZlSG9zdExvYWRFcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvciA6IG5ldyBFcnJvcihTdHJpbmcoZXJyb3IpKTtcbiAgICAgIHRoaXMubG9nKFwiZXJyb3JcIiwgXCJmYWlsZWQgdG8gbG9hZCBDb2RleCsrIG5hdGl2ZSBob3N0XCIsIHRoaXMubmF0aXZlSG9zdExvYWRFcnJvcik7XG4gICAgICBpZiAocmVxdWlyZWQpIHRocm93IHRoaXMubmF0aXZlSG9zdExvYWRFcnJvcjtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVhZE5hdGl2ZUhvc3RDYXBhYmlsaXRpZXMoaG9zdDogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgICBjb25zdCBnZXRDYXBhYmlsaXRpZXMgPSBhc1JlY29yZChob3N0KT8uZ2V0Q2FwYWJpbGl0aWVzO1xuICAgIGlmICh0eXBlb2YgZ2V0Q2FwYWJpbGl0aWVzICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiB7fTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY2FwYWJpbGl0aWVzID0gZ2V0Q2FwYWJpbGl0aWVzLmNhbGwoaG9zdCk7XG4gICAgICByZXR1cm4gYXNSZWNvcmQoY2FwYWJpbGl0aWVzKSA/PyB7fTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5sb2coXCJ3YXJuXCIsIFwiQ29kZXgrKyBuYXRpdmUgaG9zdCBjYXBhYmlsaXR5IHByb2JlIGZhaWxlZFwiLCBlcnJvcik7XG4gICAgICByZXR1cm4ge307XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBpbnZva2VJbnN0YW5jZShcbiAgICB0d2Vha0lkOiBzdHJpbmcsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBtZXRob2Q6IHN0cmluZyxcbiAgICBhcmdzOiB1bmtub3duW10sXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbnN0YW5jZUZvcih0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgZm4gPSBhc1JlY29yZChpbnN0YW5jZS52YWx1ZSk/LlttZXRob2RdO1xuICAgIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgYXdhaXQgZm4uYXBwbHkoaW5zdGFuY2UudmFsdWUsIGFyZ3MpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaW5zdGFuY2Uud2luZG93SWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKGluc3RhbmNlLndpbmRvd0lkKTtcbiAgICAgIGlmICh3aW4gJiYgIXdpbi5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgIGlmIChtZXRob2QgPT09IFwic2V0Qm91bmRzXCIpIHdpbi5zZXRCb3VuZHMoYXJnc1swXSBhcyBFbGVjdHJvbi5SZWN0YW5nbGUpO1xuICAgICAgICBlbHNlIGlmIChtZXRob2QgPT09IFwic2hvd1wiKSB3aW4uc2hvdygpO1xuICAgICAgICBlbHNlIGlmIChtZXRob2QgPT09IFwiaGlkZVwiKSB3aW4uaGlkZSgpO1xuICAgICAgICBlbHNlIGlmIChtZXRob2QgPT09IFwic2V0VmlzaWJsZVwiKSAoYXJnc1swXSA/IHdpbi5zaG93KCkgOiB3aW4uaGlkZSgpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSAke2luc3RhbmNlLmtpbmR9ICR7dHdlYWtJZH06JHtpZH0gZG9lcyBub3QgaW1wbGVtZW50ICR7bWV0aG9kfSgpYCk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRpc3Bvc2VJbnN0YW5jZUJ5SWQodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qga2V5ID0gaW5zdGFuY2VLZXkodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbnN0YW5jZXMuZ2V0KGtleSk7XG4gICAgaWYgKCFpbnN0YW5jZSkgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMuZGlzcG9zZUluc3RhbmNlKGluc3RhbmNlKTtcbiAgICB0aGlzLmluc3RhbmNlcy5kZWxldGUoa2V5KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZGlzcG9zZUluc3RhbmNlKGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChpbnN0YW5jZS5kaXNwb3NpbmcpIHJldHVybjtcbiAgICBpbnN0YW5jZS5kaXNwb3NpbmcgPSB0cnVlO1xuICAgIGZvciAoY29uc3QgZGlzcG9zZSBvZiBpbnN0YW5jZS5kaXNwb3NlQmluZGluZ3Muc3BsaWNlKDApKSB7XG4gICAgICB0cnkge1xuICAgICAgICBkaXNwb3NlKCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgfVxuICAgIGF3YWl0IGNhbGxPcHRpb25hbChpbnN0YW5jZS52YWx1ZSwgXCJkaXNwb3NlXCIsIFtdKTtcbiAgICBpZiAoaW5zdGFuY2Uud2luZG93SWQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKGluc3RhbmNlLndpbmRvd0lkKTtcbiAgICAgIGlmICh3aW4gJiYgIXdpbi5pc0Rlc3Ryb3llZCgpKSB3aW4uY2xvc2UoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGJpbmRJbnN0YW5jZVRvUGFyZW50KGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSwgcGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93KTogdm9pZCB7XG4gICAgY29uc3Qgb24gPSAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHBhcmVudFdpbmRvdy5vbihldmVudCBhcyBuZXZlciwgbGlzdGVuZXIgYXMgbmV2ZXIpO1xuICAgICAgaW5zdGFuY2UuZGlzcG9zZUJpbmRpbmdzLnB1c2goKCkgPT4gcGFyZW50V2luZG93Lm9mZihldmVudCBhcyBuZXZlciwgbGlzdGVuZXIgYXMgbmV2ZXIpKTtcbiAgICB9O1xuICAgIGNvbnN0IHN5bmNCb3VuZHMgPSAoKSA9PiB0aGlzLnN5bmNQYXJlbnRTdGF0ZShpbnN0YW5jZSwgcGFyZW50V2luZG93LCBcImJvdW5kc1wiKTtcbiAgICBjb25zdCBzeW5jRm9jdXMgPSAoZm9jdXNlZDogYm9vbGVhbikgPT4gdGhpcy5zaWduYWxQYXJlbnRTdGF0ZShpbnN0YW5jZSwgcGFyZW50V2luZG93LCBcImZvY3VzXCIsIHsgZm9jdXNlZCB9KTtcbiAgICBjb25zdCBzeW5jVmlzaWJpbGl0eSA9ICh2aXNpYmxlOiBib29sZWFuKSA9PlxuICAgICAgdGhpcy5zaWduYWxQYXJlbnRTdGF0ZShpbnN0YW5jZSwgcGFyZW50V2luZG93LCBcInZpc2liaWxpdHlcIiwgeyB2aXNpYmxlIH0pO1xuICAgIGNvbnN0IGRpc3Bvc2VXaXRoUGFyZW50ID0gKCkgPT4ge1xuICAgICAgdGhpcy5sb2coXCJpbmZvXCIsIGBkaXNwb3NpbmcgbmF0aXZlICR7aW5zdGFuY2Uua2luZH0gJHtpbnN0YW5jZS50d2Vha0lkfToke2luc3RhbmNlLmlkfTsgcGFyZW50IGNsb3NlZGApO1xuICAgICAgdm9pZCB0aGlzLmRpc3Bvc2VJbnN0YW5jZUJ5SWQoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQpO1xuICAgIH07XG5cbiAgICBvbihcIm1vdmVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJyZXNpemVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJlbnRlci1mdWxsLXNjcmVlblwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcImxlYXZlLWZ1bGwtc2NyZWVuXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwibWF4aW1pemVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJ1bm1heGltaXplXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwibWluaW1pemVcIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJyZXN0b3JlXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwic2hvd1wiLCAoKSA9PiBzeW5jVmlzaWJpbGl0eSh0cnVlKSk7XG4gICAgb24oXCJoaWRlXCIsICgpID0+IHN5bmNWaXNpYmlsaXR5KGZhbHNlKSk7XG4gICAgb24oXCJmb2N1c1wiLCAoKSA9PiBzeW5jRm9jdXModHJ1ZSkpO1xuICAgIG9uKFwiYmx1clwiLCAoKSA9PiBzeW5jRm9jdXMoZmFsc2UpKTtcbiAgICBvbihcImNsb3NlXCIsIGRpc3Bvc2VXaXRoUGFyZW50KTtcbiAgICBvbihcImNsb3NlZFwiLCBkaXNwb3NlV2l0aFBhcmVudCk7XG4gIH1cblxuICBwcml2YXRlIHN5bmNQYXJlbnRTdGF0ZShcbiAgICBpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UsXG4gICAgcGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LFxuICAgIHJlYXNvbjogc3RyaW5nLFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0ZSA9IHBhcmVudFdpbmRvd1N0YXRlKHBhcmVudFdpbmRvdywgcmVhc29uKTtcbiAgICBpZiAoIXN0YXRlKSByZXR1cm47XG4gICAgdm9pZCB0aGlzLmNhbGxGaXJzdE9wdGlvbmFsSW5zdGFuY2UoaW5zdGFuY2UsIFtcInN5bmNQYXJlbnRcIiwgXCJwYXJlbnRDaGFuZ2VkXCJdLCBbc3RhdGVdKVxuICAgICAgLnRoZW4oKGhhbmRsZWQpID0+IHtcbiAgICAgICAgaWYgKCFoYW5kbGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY2FsbEZpcnN0T3B0aW9uYWxJbnN0YW5jZShcbiAgICAgICAgICAgIGluc3RhbmNlLFxuICAgICAgICAgICAgW1wic2V0UGFyZW50Qm91bmRzXCIsIFwicGFyZW50Qm91bmRzQ2hhbmdlZFwiXSxcbiAgICAgICAgICAgIFtzdGF0ZS5ib3VuZHMsIHN0YXRlXSxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB0aGlzLmxvZyhcIndhcm5cIiwgYG5hdGl2ZSAke2luc3RhbmNlLmtpbmR9IHBhcmVudCBzeW5jIGZhaWxlZGAsIGVycm9yKSk7XG4gIH1cblxuICBwcml2YXRlIHNpZ25hbFBhcmVudFN0YXRlKFxuICAgIGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSxcbiAgICBwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csXG4gICAgcmVhc29uOiBzdHJpbmcsXG4gICAgcGF0Y2g6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICApOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0ZSA9IHBhcmVudFdpbmRvd1N0YXRlKHBhcmVudFdpbmRvdywgcmVhc29uKTtcbiAgICBpZiAoIXN0YXRlKSByZXR1cm47XG4gICAgY29uc3QgcGF5bG9hZCA9IHsgLi4uc3RhdGUsIC4uLnBhdGNoIH07XG4gICAgdm9pZCB0aGlzLmNhbGxGaXJzdE9wdGlvbmFsSW5zdGFuY2UoaW5zdGFuY2UsIFtcInBhcmVudFN0YXRlQ2hhbmdlZFwiLCBcInBhcmVudENoYW5nZWRcIl0sIFtwYXlsb2FkXSlcbiAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHRoaXMubG9nKFwid2FyblwiLCBgbmF0aXZlICR7aW5zdGFuY2Uua2luZH0gcGFyZW50IHNpZ25hbCBmYWlsZWRgLCBlcnJvcikpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWxsRmlyc3RPcHRpb25hbEluc3RhbmNlKFxuICAgIGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSxcbiAgICBtZXRob2RzOiBzdHJpbmdbXSxcbiAgICBhcmdzOiB1bmtub3duW10sXG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHRhcmdldCA9IGFzUmVjb3JkKGluc3RhbmNlLnZhbHVlKTtcbiAgICBmb3IgKGNvbnN0IG1ldGhvZCBvZiBtZXRob2RzKSB7XG4gICAgICBjb25zdCBmbiA9IHRhcmdldD8uW21ldGhvZF07XG4gICAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIGNvbnRpbnVlO1xuICAgICAgYXdhaXQgZm4uYXBwbHkoaW5zdGFuY2UudmFsdWUsIGFyZ3MpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZEhlbHBlcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcsIG1lc3NhZ2U6IHVua25vd24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBoZWxwZXIgPSB0aGlzLmhlbHBlckZvcih0d2Vha0lkLCBpZCk7XG4gICAgaGVscGVyLmNoaWxkLnN0ZGluLndyaXRlKGAke0pTT04uc3RyaW5naWZ5KG1lc3NhZ2UpfVxcbmApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyByZXF1ZXN0SGVscGVyKFxuICAgIHR3ZWFrSWQ6IHN0cmluZyxcbiAgICBpZDogc3RyaW5nLFxuICAgIG1lc3NhZ2U6IHVua25vd24sXG4gICAgdGltZW91dE1zID0gMTBfMDAwLFxuICApOiBQcm9taXNlPHVua25vd24+IHtcbiAgICBjb25zdCBoZWxwZXIgPSB0aGlzLmhlbHBlckZvcih0d2Vha0lkLCBpZCk7XG4gICAgY29uc3QgcmVxdWVzdElkID0gcmFuZG9tVVVJRCgpO1xuICAgIGNvbnN0IHBheWxvYWQgPSB7IGlkOiByZXF1ZXN0SWQsIG1lc3NhZ2UgfTtcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgaGVscGVyLnBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYG5hdGl2ZSBoZWxwZXIgcmVxdWVzdCB0aW1lZCBvdXQ6ICR7dHdlYWtJZH06JHtpZH1gKSk7XG4gICAgICB9LCB0aW1lb3V0TXMpO1xuICAgICAgaGVscGVyLnBlbmRpbmcuc2V0KHJlcXVlc3RJZCwgeyByZXNvbHZlLCByZWplY3QsIHRpbWVyIH0pO1xuICAgICAgaGVscGVyLmNoaWxkLnN0ZGluLndyaXRlKGAke0pTT04uc3RyaW5naWZ5KHBheWxvYWQpfVxcbmApO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzdG9wSGVscGVyQnlJZCh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBrZXkgPSBoZWxwZXJLZXkodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IGhlbHBlciA9IHRoaXMuaGVscGVycy5nZXQoa2V5KTtcbiAgICBpZiAoIWhlbHBlcikgcmV0dXJuO1xuICAgIHRoaXMuc3RvcEhlbHBlcihoZWxwZXIpO1xuICAgIHRoaXMuaGVscGVycy5kZWxldGUoa2V5KTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcEhlbHBlcihoZWxwZXI6IE5hdGl2ZUhlbHBlclByb2Nlc3MpOiB2b2lkIHtcbiAgICBpZiAoaGVscGVyLmNoaWxkLmtpbGxlZCkgcmV0dXJuO1xuICAgIGhlbHBlci5jaGlsZC5raWxsKCk7XG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICghaGVscGVyLmNoaWxkLmtpbGxlZCkgaGVscGVyLmNoaWxkLmtpbGwoXCJTSUdLSUxMXCIpO1xuICAgIH0sIDE1MDApO1xuICAgIHRpbWVyLnVucmVmPy4oKTtcbiAgfVxuXG4gIHByaXZhdGUgaGFuZGxlSGVscGVyTGluZShoZWxwZXI6IE5hdGl2ZUhlbHBlclByb2Nlc3MsIGxpbmU6IHN0cmluZyk6IHZvaWQge1xuICAgIGxldCBwYXlsb2FkOiB7IGlkPzogdW5rbm93bjsgcmVzdWx0PzogdW5rbm93bjsgZXJyb3I/OiB1bmtub3duIH07XG4gICAgdHJ5IHtcbiAgICAgIHBheWxvYWQgPSBKU09OLnBhcnNlKGxpbmUpIGFzIHR5cGVvZiBwYXlsb2FkO1xuICAgIH0gY2F0Y2gge1xuICAgICAgdGhpcy5sb2coXCJpbmZvXCIsIGBuYXRpdmUgaGVscGVyICR7aGVscGVyLnR3ZWFrSWR9OiR7aGVscGVyLmlkfWAsIGxpbmUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHBheWxvYWQuaWQgIT09IFwic3RyaW5nXCIpIHJldHVybjtcbiAgICBjb25zdCByZXF1ZXN0ID0gaGVscGVyLnBlbmRpbmcuZ2V0KHBheWxvYWQuaWQpO1xuICAgIGlmICghcmVxdWVzdCkgcmV0dXJuO1xuICAgIGhlbHBlci5wZW5kaW5nLmRlbGV0ZShwYXlsb2FkLmlkKTtcbiAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lcik7XG4gICAgaWYgKHBheWxvYWQuZXJyb3IpIHtcbiAgICAgIHJlcXVlc3QucmVqZWN0KG5ldyBFcnJvcihTdHJpbmcocGF5bG9hZC5lcnJvcikpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxdWVzdC5yZXNvbHZlKHBheWxvYWQucmVzdWx0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG1vZHVsZUZvcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBMb2FkZWROYXRpdmVNb2R1bGUge1xuICAgIGNvbnN0IG1vZCA9IHRoaXMubW9kdWxlcy5nZXQobW9kdWxlS2V5KHR3ZWFrSWQsIGlkKSk7XG4gICAgaWYgKCFtb2QpIHRocm93IG5ldyBFcnJvcihgbmF0aXZlIG1vZHVsZSBpcyBub3QgbG9hZGVkOiAke3R3ZWFrSWR9OiR7aWR9YCk7XG4gICAgcmV0dXJuIG1vZDtcbiAgfVxuXG4gIHByaXZhdGUgaW5zdGFuY2VGb3IodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogTmF0aXZlSW5zdGFuY2Uge1xuICAgIGNvbnN0IGluc3RhbmNlID0gdGhpcy5pbnN0YW5jZXMuZ2V0KGluc3RhbmNlS2V5KHR3ZWFrSWQsIGlkKSk7XG4gICAgaWYgKCFpbnN0YW5jZSkgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgaW5zdGFuY2UgaXMgbm90IGxvYWRlZDogJHt0d2Vha0lkfToke2lkfWApO1xuICAgIHJldHVybiBpbnN0YW5jZTtcbiAgfVxuXG4gIHByaXZhdGUgaGVscGVyRm9yKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE5hdGl2ZUhlbHBlclByb2Nlc3Mge1xuICAgIGNvbnN0IGhlbHBlciA9IHRoaXMuaGVscGVycy5nZXQoaGVscGVyS2V5KHR3ZWFrSWQsIGlkKSk7XG4gICAgaWYgKCFoZWxwZXIpIHRocm93IG5ldyBFcnJvcihgbmF0aXZlIGhlbHBlciBpcyBub3QgcnVubmluZzogJHt0d2Vha0lkfToke2lkfWApO1xuICAgIHJldHVybiBoZWxwZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVR3ZWFrUGF0aChjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCwgcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHJlc29sdmVOYXRpdmVUd2Vha1BhdGgoY3R4LmRpciwgcGF0aCk7XG59XG5cbmZ1bmN0aW9uIGluZmVyTW9kdWxlS2luZChwYXRoOiBzdHJpbmcpOiBOYXRpdmVNb2R1bGVLaW5kIHtcbiAgaWYgKHBhdGguZW5kc1dpdGgoXCIubm9kZVwiKSkgcmV0dXJuIFwibm9kZS1hZGRvblwiO1xuICBpZiAocGF0aC5lbmRzV2l0aChcIi5keWxpYlwiKSkgcmV0dXJuIFwiZHlsaWJcIjtcbiAgaWYgKHBhdGguZW5kc1dpdGgoXCIuZnJhbWV3b3JrXCIpKSByZXR1cm4gXCJmcmFtZXdvcmtcIjtcbiAgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIG1vZHVsZSBwYXRoIG11c3QgZW5kIGluIC5ub2RlLCAuZHlsaWIsIG9yIC5mcmFtZXdvcmtcIik7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdEVudHJ5cG9pbnQobG9hZGVkOiB1bmtub3duLCBlbnRyeXBvaW50OiBzdHJpbmcgfCB1bmRlZmluZWQpOiB1bmtub3duIHtcbiAgaWYgKCFlbnRyeXBvaW50KSByZXR1cm4gYXNSZWNvcmQobG9hZGVkKT8uZGVmYXVsdCA/PyBsb2FkZWQ7XG4gIGNvbnN0IHNlbGVjdGVkID0gYXNSZWNvcmQobG9hZGVkKT8uW2VudHJ5cG9pbnRdO1xuICBpZiAoc2VsZWN0ZWQgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgbW9kdWxlIGVudHJ5cG9pbnQgbm90IGZvdW5kOiAke2VudHJ5cG9pbnR9YCk7XG4gIHJldHVybiBzZWxlY3RlZDtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0QnJpZGdlSWQodmFsdWU6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIS9eW2EtekEtWjAtOS5fLV0rJC8udGVzdCh2YWx1ZSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYCR7bGFiZWx9IG1heSBvbmx5IGNvbnRhaW4gbGV0dGVycywgbnVtYmVycywgZG90cywgdW5kZXJzY29yZXMsIGFuZCBkYXNoZXNgKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIG1vZHVsZUtleSh0d2Vha0lkOiBzdHJpbmcsIG1vZHVsZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7dHdlYWtJZH06JHttb2R1bGVJZH1gO1xufVxuXG5mdW5jdGlvbiBpbnN0YW5jZUtleSh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gYCR7dHdlYWtJZH06JHtpZH1gO1xufVxuXG5mdW5jdGlvbiBoZWxwZXJLZXkodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3R3ZWFrSWR9OiR7aWR9YDtcbn1cblxuZnVuY3Rpb24gYXNSZWNvcmQodmFsdWU6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiID8gdmFsdWUgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gOiBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjYWxsT3B0aW9uYWwodGFyZ2V0OiB1bmtub3duLCBtZXRob2Q6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQodGFyZ2V0KT8uW21ldGhvZF07XG4gIGlmICh0eXBlb2YgZm4gPT09IFwiZnVuY3Rpb25cIikgYXdhaXQgZm4uYXBwbHkodGFyZ2V0LCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gcGFyZW50V2luZG93U3RhdGUocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LCByZWFzb246IHN0cmluZyk6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIGlmIChpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnRXaW5kb3cpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgYm91bmRzID0gY2FsbFdpbmRvd01ldGhvZDxFbGVjdHJvbi5SZWN0YW5nbGU+KHBhcmVudFdpbmRvdywgXCJnZXRCb3VuZHNcIik7XG4gIGNvbnN0IGNvbnRlbnRCb3VuZHMgPSBjYWxsV2luZG93TWV0aG9kPEVsZWN0cm9uLlJlY3RhbmdsZT4ocGFyZW50V2luZG93LCBcImdldENvbnRlbnRCb3VuZHNcIik7XG4gIHJldHVybiB7XG4gICAgcmVhc29uLFxuICAgIHdpbmRvd0lkOiB3aW5kb3dJZEZvcihwYXJlbnRXaW5kb3cpLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHdlYkNvbnRlbnRzSWRGb3IocGFyZW50V2luZG93KSxcbiAgICBib3VuZHMsXG4gICAgY29udGVudEJvdW5kcyxcbiAgICB2aXNpYmxlOiBjYWxsV2luZG93TWV0aG9kPGJvb2xlYW4+KHBhcmVudFdpbmRvdywgXCJpc1Zpc2libGVcIikgPz8gbnVsbCxcbiAgICBmb2N1c2VkOiBjYWxsV2luZG93TWV0aG9kPGJvb2xlYW4+KHBhcmVudFdpbmRvdywgXCJpc0ZvY3VzZWRcIikgPz8gbnVsbCxcbiAgICBtaW5pbWl6ZWQ6IGNhbGxXaW5kb3dNZXRob2Q8Ym9vbGVhbj4ocGFyZW50V2luZG93LCBcImlzTWluaW1pemVkXCIpID8/IG51bGwsXG4gICAgbWF4aW1pemVkOiBjYWxsV2luZG93TWV0aG9kPGJvb2xlYW4+KHBhcmVudFdpbmRvdywgXCJpc01heGltaXplZFwiKSA/PyBudWxsLFxuICAgIGZ1bGxzY3JlZW46IGNhbGxXaW5kb3dNZXRob2Q8Ym9vbGVhbj4ocGFyZW50V2luZG93LCBcImlzRnVsbFNjcmVlblwiKSA/PyBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBuYXRpdmVIYW5kbGVGb3JXaW5kb3cocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCk6IEJ1ZmZlciB8IG51bGwge1xuICBpZiAoIXBhcmVudFdpbmRvdyB8fCBpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnRXaW5kb3cpKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgZm4gPSBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5nZXROYXRpdmVXaW5kb3dIYW5kbGU7XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgaGFuZGxlID0gZm4uY2FsbChwYXJlbnRXaW5kb3cpO1xuICAgIHJldHVybiBCdWZmZXIuaXNCdWZmZXIoaGFuZGxlKSA/IGhhbmRsZSA6IG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbkJpbmRQYXJlbnRXaW5kb3coXG4gIHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQsXG4pOiBwYXJlbnRXaW5kb3cgaXMgRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB7XG4gIGlmICghcGFyZW50V2luZG93IHx8IGlzV2luZG93RGVzdHJveWVkKHBhcmVudFdpbmRvdykpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHR5cGVvZiBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5vbiA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgdHlwZW9mIGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/Lm9mZiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG5mdW5jdGlvbiBpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogYm9vbGVhbiB7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQocGFyZW50V2luZG93KT8uaXNEZXN0cm95ZWQ7XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuICB0cnkge1xuICAgIHJldHVybiBCb29sZWFuKGZuLmNhbGwocGFyZW50V2luZG93KSk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdpbmRvd0lkRm9yKHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBudW1iZXIgfCBudWxsIHtcbiAgY29uc3QgaWQgPSBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5pZDtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gd2ViQ29udGVudHNJZEZvcihwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IHdlYkNvbnRlbnRzID0gYXNSZWNvcmQoYXNSZWNvcmQocGFyZW50V2luZG93KT8ud2ViQ29udGVudHMpO1xuICBjb25zdCBpZCA9IHdlYkNvbnRlbnRzPy5pZDtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gY2FsbFdpbmRvd01ldGhvZDxUPihwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3csIG1ldGhvZDogc3RyaW5nKTogVCB8IG51bGwge1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/LlttZXRob2RdO1xuICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIHJldHVybiBmbi5jYWxsKHBhcmVudFdpbmRvdykgYXMgVDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiIsICJpbXBvcnQgeyByZWFscGF0aFN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgaXNBYnNvbHV0ZSwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlTmF0aXZlVHdlYWtQYXRoKHR3ZWFrRGlyOiBzdHJpbmcsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gXCJzdHJpbmdcIiB8fCBwYXRoLnRyaW0oKSA9PT0gXCJcIikgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIHBhdGggaXMgcmVxdWlyZWRcIik7XG4gIGNvbnN0IHJvb3QgPSByZWFscGF0aFN5bmModHdlYWtEaXIpO1xuICBjb25zdCBmdWxsID0gcmVzb2x2ZSh0d2Vha0RpciwgcGF0aCk7XG4gIGxldCB0YXJnZXQ6IHN0cmluZztcbiAgdHJ5IHtcbiAgICB0YXJnZXQgPSByZWFscGF0aFN5bmMoZnVsbCk7XG4gIH0gY2F0Y2gge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBwYXRoIGRvZXMgbm90IGV4aXN0XCIpO1xuICB9XG4gIGlmICghaXNQYXRoSW5zaWRlKHJvb3QsIHRhcmdldCkgfHwgdGFyZ2V0ID09PSByb290KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIHBhdGggbXVzdCBzdGF5IGluc2lkZSB0aGUgdHdlYWsgZGlyZWN0b3J5XCIpO1xuICB9XG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1BhdGhJbnNpZGUocGFyZW50OiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHJlbCA9IHJlbGF0aXZlKHJlc29sdmUocGFyZW50KSwgcmVzb2x2ZSh0YXJnZXQpKTtcbiAgcmV0dXJuIHJlbCA9PT0gXCJcIiB8fCAoISFyZWwgJiYgIXJlbC5zdGFydHNXaXRoKFwiLi5cIikgJiYgIWlzQWJzb2x1dGUocmVsKSk7XG59XG4iLCAiaW1wb3J0IHR5cGUgeyBUd2Vha01hbmlmZXN0IH0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IERFRkFVTFRfVFdFQUtfU1RPUkVfSU5ERVhfVVJMID1cbiAgXCJodHRwczovL2twa2h4bGd5MC5naXRodWIuaW8vY29kZXgtcGx1c3BsdXMvc3RvcmUvaW5kZXguanNvblwiO1xuZXhwb3J0IGNvbnN0IFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwgPVxuICBcImh0dHBzOi8vZ2l0aHViLmNvbS9rcGtoeGxneTAvY29kZXgtcGx1c3BsdXMvaXNzdWVzL25ld1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIHNjaGVtYVZlcnNpb246IDE7XG4gIGdlbmVyYXRlZEF0Pzogc3RyaW5nO1xuICBlbnRyaWVzOiBUd2Vha1N0b3JlRW50cnlbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlRW50cnkge1xuICBpZDogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgcmVwbzogc3RyaW5nO1xuICBhcHByb3ZlZENvbW1pdFNoYTogc3RyaW5nO1xuICBhcHByb3ZlZEF0OiBzdHJpbmc7XG4gIGFwcHJvdmVkQnk6IHN0cmluZztcbiAgcGxhdGZvcm1zPzogVHdlYWtTdG9yZVBsYXRmb3JtW107XG4gIHJlbGVhc2VVcmw/OiBzdHJpbmc7XG4gIHJldmlld1VybD86IHN0cmluZztcbn1cblxuZXhwb3J0IHR5cGUgVHdlYWtTdG9yZVBsYXRmb3JtID0gXCJkYXJ3aW5cIiB8IFwid2luMzJcIiB8IFwibGludXhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24ge1xuICByZXBvOiBzdHJpbmc7XG4gIGRlZmF1bHRCcmFuY2g6IHN0cmluZztcbiAgY29tbWl0U2hhOiBzdHJpbmc7XG4gIGNvbW1pdFVybDogc3RyaW5nO1xuICBtYW5pZmVzdD86IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHZlcnNpb24/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgaWNvblVybD86IHN0cmluZztcbiAgfTtcbn1cblxuY29uc3QgR0lUSFVCX1JFUE9fUkUgPSAvXltBLVphLXowLTlfLi1dK1xcL1tBLVphLXowLTlfLi1dKyQvO1xuY29uc3QgRlVMTF9TSEFfUkUgPSAvXlthLWYwLTldezQwfSQvaTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZUdpdEh1YlJlcG8oaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHJhdyA9IGlucHV0LnRyaW0oKTtcbiAgaWYgKCFyYXcpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIGlzIHJlcXVpcmVkXCIpO1xuXG4gIGNvbnN0IHNzaCA9IC9eZ2l0QGdpdGh1YlxcLmNvbTooW14vXStcXC9bXi9dKz8pKD86XFwuZ2l0KT8kL2kuZXhlYyhyYXcpO1xuICBpZiAoc3NoKSByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQoc3NoWzFdKTtcblxuICBpZiAoL15odHRwcz86XFwvXFwvL2kudGVzdChyYXcpKSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyYXcpO1xuICAgIGlmICh1cmwuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSB0aHJvdyBuZXcgRXJyb3IoXCJPbmx5IGdpdGh1Yi5jb20gcmVwb3NpdG9yaWVzIGFyZSBzdXBwb3J0ZWRcIik7XG4gICAgY29uc3QgcGFydHMgPSB1cmwucGF0aG5hbWUucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikuc3BsaXQoXCIvXCIpO1xuICAgIGlmIChwYXJ0cy5sZW5ndGggPCAyKSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBVUkwgbXVzdCBpbmNsdWRlIG93bmVyIGFuZCByZXBvc2l0b3J5XCIpO1xuICAgIHJldHVybiBub3JtYWxpemVSZXBvUGFydChgJHtwYXJ0c1swXX0vJHtwYXJ0c1sxXX1gKTtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVSZXBvUGFydChyYXcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVSZWdpc3RyeShpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVSZWdpc3RyeSB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gaW5wdXQgYXMgUGFydGlhbDxUd2Vha1N0b3JlUmVnaXN0cnk+IHwgbnVsbDtcbiAgaWYgKCFyZWdpc3RyeSB8fCByZWdpc3RyeS5zY2hlbWFWZXJzaW9uICE9PSAxIHx8ICFBcnJheS5pc0FycmF5KHJlZ2lzdHJ5LmVudHJpZXMpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgdHdlYWsgc3RvcmUgcmVnaXN0cnlcIik7XG4gIH1cbiAgY29uc3QgZW50cmllcyA9IHJlZ2lzdHJ5LmVudHJpZXMubWFwKG5vcm1hbGl6ZVN0b3JlRW50cnkpO1xuICBlbnRyaWVzLnNvcnQoKGEsIGIpID0+IGEubWFuaWZlc3QubmFtZS5sb2NhbGVDb21wYXJlKGIubWFuaWZlc3QubmFtZSkpO1xuICByZXR1cm4ge1xuICAgIHNjaGVtYVZlcnNpb246IDEsXG4gICAgZ2VuZXJhdGVkQXQ6IHR5cGVvZiByZWdpc3RyeS5nZW5lcmF0ZWRBdCA9PT0gXCJzdHJpbmdcIiA/IHJlZ2lzdHJ5LmdlbmVyYXRlZEF0IDogdW5kZWZpbmVkLFxuICAgIGVudHJpZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlU3RvcmVFbnRyaWVzPFQ+KFxuICBlbnRyaWVzOiByZWFkb25seSBUW10sXG4gIHJhbmRvbUluZGV4OiAoZXhjbHVzaXZlTWF4OiBudW1iZXIpID0+IG51bWJlciA9IChleGNsdXNpdmVNYXgpID0+IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGV4Y2x1c2l2ZU1heCksXG4pOiBUW10ge1xuICBjb25zdCBzaHVmZmxlZCA9IFsuLi5lbnRyaWVzXTtcbiAgZm9yIChsZXQgaSA9IHNodWZmbGVkLmxlbmd0aCAtIDE7IGkgPiAwOyBpIC09IDEpIHtcbiAgICBjb25zdCBqID0gcmFuZG9tSW5kZXgoaSArIDEpO1xuICAgIGlmICghTnVtYmVyLmlzSW50ZWdlcihqKSB8fCBqIDwgMCB8fCBqID4gaSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBzaHVmZmxlIHJhbmRvbUluZGV4IHJldHVybmVkICR7an07IGV4cGVjdGVkIGFuIGludGVnZXIgZnJvbSAwIHRvICR7aX1gKTtcbiAgICB9XG4gICAgW3NodWZmbGVkW2ldLCBzaHVmZmxlZFtqXV0gPSBbc2h1ZmZsZWRbal0sIHNodWZmbGVkW2ldXTtcbiAgfVxuICByZXR1cm4gc2h1ZmZsZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVTdG9yZUVudHJ5KGlucHV0OiB1bmtub3duKTogVHdlYWtTdG9yZUVudHJ5IHtcbiAgY29uc3QgZW50cnkgPSBpbnB1dCBhcyBQYXJ0aWFsPFR3ZWFrU3RvcmVFbnRyeT4gfCBudWxsO1xuICBpZiAoIWVudHJ5IHx8IHR5cGVvZiBlbnRyeSAhPT0gXCJvYmplY3RcIikgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCB0d2VhayBzdG9yZSBlbnRyeVwiKTtcbiAgY29uc3QgcmVwbyA9IG5vcm1hbGl6ZUdpdEh1YlJlcG8oU3RyaW5nKGVudHJ5LnJlcG8gPz8gZW50cnkubWFuaWZlc3Q/LmdpdGh1YlJlcG8gPz8gXCJcIikpO1xuICBjb25zdCBtYW5pZmVzdCA9IGVudHJ5Lm1hbmlmZXN0IGFzIFR3ZWFrTWFuaWZlc3QgfCB1bmRlZmluZWQ7XG4gIGlmICghbWFuaWZlc3Q/LmlkIHx8ICFtYW5pZmVzdC5uYW1lIHx8ICFtYW5pZmVzdC52ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSBmb3IgJHtyZXBvfSBpcyBtaXNzaW5nIG1hbmlmZXN0IGZpZWxkc2ApO1xuICB9XG4gIGlmIChub3JtYWxpemVHaXRIdWJSZXBvKG1hbmlmZXN0LmdpdGh1YlJlcG8pICE9PSByZXBvKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSByZXBvIGRvZXMgbm90IG1hdGNoIG1hbmlmZXN0IGdpdGh1YlJlcG9gKTtcbiAgfVxuICBpZiAoIWlzRnVsbENvbW1pdFNoYShTdHJpbmcoZW50cnkuYXBwcm92ZWRDb21taXRTaGEgPz8gXCJcIikpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke21hbmlmZXN0LmlkfSBtdXN0IHBpbiBhIGZ1bGwgYXBwcm92ZWQgY29tbWl0IFNIQWApO1xuICB9XG4gIHJldHVybiB7XG4gICAgaWQ6IG1hbmlmZXN0LmlkLFxuICAgIG1hbmlmZXN0LFxuICAgIHJlcG8sXG4gICAgYXBwcm92ZWRDb21taXRTaGE6IFN0cmluZyhlbnRyeS5hcHByb3ZlZENvbW1pdFNoYSksXG4gICAgYXBwcm92ZWRBdDogdHlwZW9mIGVudHJ5LmFwcHJvdmVkQXQgPT09IFwic3RyaW5nXCIgPyBlbnRyeS5hcHByb3ZlZEF0IDogXCJcIixcbiAgICBhcHByb3ZlZEJ5OiB0eXBlb2YgZW50cnkuYXBwcm92ZWRCeSA9PT0gXCJzdHJpbmdcIiA/IGVudHJ5LmFwcHJvdmVkQnkgOiBcIlwiLFxuICAgIHBsYXRmb3Jtczogbm9ybWFsaXplU3RvcmVQbGF0Zm9ybXMoKGVudHJ5IGFzIHsgcGxhdGZvcm1zPzogdW5rbm93biB9KS5wbGF0Zm9ybXMpLFxuICAgIHJlbGVhc2VVcmw6IG9wdGlvbmFsR2l0aHViVXJsKGVudHJ5LnJlbGVhc2VVcmwpLFxuICAgIHJldmlld1VybDogb3B0aW9uYWxHaXRodWJVcmwoZW50cnkucmV2aWV3VXJsKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQXJjaGl2ZVVybChlbnRyeTogVHdlYWtTdG9yZUVudHJ5KTogc3RyaW5nIHtcbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoZW50cnkuYXBwcm92ZWRDb21taXRTaGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBTdG9yZSBlbnRyeSAke2VudHJ5LmlkfSBpcyBub3QgcGlubmVkIHRvIGEgZnVsbCBjb21taXQgU0hBYCk7XG4gIH1cbiAgcmV0dXJuIGBodHRwczovL2NvZGVsb2FkLmdpdGh1Yi5jb20vJHtlbnRyeS5yZXBvfS90YXIuZ3ovJHtlbnRyeS5hcHByb3ZlZENvbW1pdFNoYX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRUd2Vha1B1Ymxpc2hJc3N1ZVVybChzdWJtaXNzaW9uOiBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24pOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhzdWJtaXNzaW9uLnJlcG8pO1xuICBpZiAoIWlzRnVsbENvbW1pdFNoYShzdWJtaXNzaW9uLmNvbW1pdFNoYSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdWJtaXNzaW9uIG11c3QgaW5jbHVkZSB0aGUgZnVsbCBjb21taXQgU0hBIHRvIHJldmlld1wiKTtcbiAgfVxuICBjb25zdCB0aXRsZSA9IGBUd2VhayBzdG9yZSByZXZpZXc6ICR7cmVwb31gO1xuICBjb25zdCBib2R5ID0gW1xuICAgIFwiIyMgVHdlYWsgcmVwb1wiLFxuICAgIGBodHRwczovL2dpdGh1Yi5jb20vJHtyZXBvfWAsXG4gICAgXCJcIixcbiAgICBcIiMjIENvbW1pdCB0byByZXZpZXdcIixcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFNoYSxcbiAgICBzdWJtaXNzaW9uLmNvbW1pdFVybCxcbiAgICBcIlwiLFxuICAgIFwiRG8gbm90IGFwcHJvdmUgYSBkaWZmZXJlbnQgY29tbWl0LiBJZiB0aGUgYXV0aG9yIHB1c2hlcyBjaGFuZ2VzLCBhc2sgdGhlbSB0byByZXN1Ym1pdC5cIixcbiAgICBcIlwiLFxuICAgIFwiIyMgTWFuaWZlc3RcIixcbiAgICBgLSBpZDogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5pZCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBuYW1lOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/Lm5hbWUgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gdmVyc2lvbjogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py52ZXJzaW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGRlc2NyaXB0aW9uOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/LmRlc2NyaXB0aW9uID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIGljb25Vcmw6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uaWNvblVybCA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBcIlwiLFxuICAgIFwiIyMgQWRtaW4gY2hlY2tsaXN0XCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5qc29uIGlzIHZhbGlkXCIsXG4gICAgXCItIFsgXSBtYW5pZmVzdC5pY29uVXJsIGlzIHVzYWJsZSBhcyB0aGUgc3RvcmUgaWNvblwiLFxuICAgIFwiLSBbIF0gc291cmNlIHdhcyByZXZpZXdlZCBhdCB0aGUgZXhhY3QgY29tbWl0IGFib3ZlXCIsXG4gICAgXCItIFsgXSBgc3RvcmUvaW5kZXguanNvbmAgZW50cnkgcGlucyBgYXBwcm92ZWRDb21taXRTaGFgIHRvIHRoZSBleGFjdCBjb21taXQgYWJvdmVcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFRXRUFLX1NUT1JFX1JFVklFV19JU1NVRV9VUkwpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRlbXBsYXRlXCIsIFwidHdlYWstc3RvcmUtcmV2aWV3Lm1kXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcInRpdGxlXCIsIHRpdGxlKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJib2R5XCIsIGJvZHkpO1xuICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Z1bGxDb21taXRTaGEodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gRlVMTF9TSEFfUkUudGVzdCh2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVJlcG9QYXJ0KHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXBvID0gdmFsdWUudHJpbSgpLnJlcGxhY2UoL1xcLmdpdCQvaSwgXCJcIikucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIik7XG4gIGlmICghR0lUSFVCX1JFUE9fUkUudGVzdChyZXBvKSkgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gbXVzdCBiZSBpbiBvd25lci9yZXBvIGZvcm1cIik7XG4gIHJldHVybiByZXBvO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVTdG9yZVBsYXRmb3JtcyhpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdIHwgdW5kZWZpbmVkIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmICghQXJyYXkuaXNBcnJheShpbnB1dCkpIHRocm93IG5ldyBFcnJvcihcIlN0b3JlIGVudHJ5IHBsYXRmb3JtcyBtdXN0IGJlIGFuIGFycmF5XCIpO1xuICBjb25zdCBhbGxvd2VkID0gbmV3IFNldDxUd2Vha1N0b3JlUGxhdGZvcm0+KFtcImRhcndpblwiLCBcIndpbjMyXCIsIFwibGludXhcIl0pO1xuICBjb25zdCBwbGF0Zm9ybXMgPSBBcnJheS5mcm9tKG5ldyBTZXQoaW5wdXQubWFwKCh2YWx1ZSkgPT4ge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIWFsbG93ZWQuaGFzKHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5zdXBwb3J0ZWQgc3RvcmUgcGxhdGZvcm06ICR7U3RyaW5nKHZhbHVlKX1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlIGFzIFR3ZWFrU3RvcmVQbGF0Zm9ybTtcbiAgfSkpKTtcbiAgcmV0dXJuIHBsYXRmb3Jtcy5sZW5ndGggPiAwID8gcGxhdGZvcm1zIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBvcHRpb25hbEdpdGh1YlVybCh2YWx1ZTogdW5rbm93bik6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIgfHwgIXZhbHVlLnRyaW0oKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdXJsID0gbmV3IFVSTCh2YWx1ZSk7XG4gIGlmICh1cmwucHJvdG9jb2wgIT09IFwiaHR0cHM6XCIgfHwgdXJsLmhvc3RuYW1lICE9PSBcImdpdGh1Yi5jb21cIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuIiwgImltcG9ydCB7IGFwcCwgQnJvd3NlclZpZXcsIEJyb3dzZXJXaW5kb3csIE1lc3NhZ2VDaGFubmVsTWFpbiwgaXBjTWFpbiwgbmF0aXZlVGhlbWUgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2gsIHJhbmRvbVVVSUQgfSBmcm9tIFwibm9kZTpjcnlwdG9cIjtcbmltcG9ydCB7IGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgc3RhdFN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgY3JlYXRlU2VydmVyLCB0eXBlIEluY29taW5nTWVzc2FnZSwgdHlwZSBTZXJ2ZXIsIHR5cGUgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgeyBqb2luLCBub3JtYWxpemUsIHJlbGF0aXZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHR5cGUgeyBTb2NrZXQgfSBmcm9tIFwibm9kZTpuZXRcIjtcblxuY29uc3QgQ09OTkVDVF9QT1JUX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1jb25uZWN0LWFwcC1ob3N0XCI7XG5jb25zdCBCUklER0VfUkVRVUVTVF9DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktYnJpZGdlLXJlcXVlc3RcIjtcbmNvbnN0IEJSSURHRV9SRVNQT05TRV9DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktYnJpZGdlLXJlc3BvbnNlXCI7XG5jb25zdCBNRVNTQUdFX0ZPUl9WSUVXX0NIQU5ORUwgPSBcImNvZGV4cHA6YnJvd3Nlci11aS1tZXNzYWdlLWZvci12aWV3XCI7XG5jb25zdCBXT1JLRVJfTUVTU0FHRV9DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktd29ya2VyLW1lc3NhZ2VcIjtcbmNvbnN0IFNZU1RFTV9USEVNRV9DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktc3lzdGVtLXRoZW1lXCI7XG5cbnR5cGUgTG9nRm4gPSAobGV2ZWw6IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZDtcblxuaW50ZXJmYWNlIENvZGV4V2luZG93U2VydmljZXMge1xuICBnZXRDb250ZXh0PzogKGhvc3RJZDogc3RyaW5nKSA9PiB7IHJlZ2lzdGVyV2luZG93PzogKHdpbmRvd0xpa2U6IENvZGV4V2luZG93TGlrZSkgPT4gdm9pZCB9IHwgbnVsbDtcbiAgZ2V0Q29udGV4dEZvcldlYkNvbnRlbnRzPzogKFxuICAgIHdlYkNvbnRlbnRzOiBFbGVjdHJvbi5XZWJDb250ZW50cyxcbiAgKSA9PiB7IHJlZ2lzdGVyV2luZG93PzogKHdpbmRvd0xpa2U6IENvZGV4V2luZG93TGlrZSkgPT4gdm9pZCB9IHwgbnVsbDtcbiAgd2luZG93TWFuYWdlcj86IHtcbiAgICByZWdpc3RlcldpbmRvdz86IChcbiAgICAgIHdpbmRvd0xpa2U6IENvZGV4V2luZG93TGlrZSxcbiAgICAgIGhvc3RJZDogc3RyaW5nLFxuICAgICAgcHJpbWFyeTogYm9vbGVhbixcbiAgICAgIGFwcGVhcmFuY2U6IHN0cmluZyxcbiAgICApID0+IHZvaWQ7XG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGFsbG93RGV2dG9vbHM/OiBib29sZWFuO1xuICAgICAgcHJlbG9hZFBhdGg/OiBzdHJpbmc7XG4gICAgfTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIENvZGV4V2luZG93TGlrZSB7XG4gIGlkOiBudW1iZXI7XG4gIHdlYkNvbnRlbnRzOiBFbGVjdHJvbi5XZWJDb250ZW50cztcbiAgb24oZXZlbnQ6IFwiY2xvc2VkXCIsIGxpc3RlbmVyOiAoKSA9PiB2b2lkKTogdW5rbm93bjtcbiAgb25jZT8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICBvZmY/KGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKTogdW5rbm93bjtcbiAgcmVtb3ZlTGlzdGVuZXI/KGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKTogdW5rbm93bjtcbiAgaXNEZXN0cm95ZWQ/KCk6IGJvb2xlYW47XG4gIGlzRm9jdXNlZD8oKTogYm9vbGVhbjtcbiAgZm9jdXM/KCk6IHZvaWQ7XG4gIHNob3c/KCk6IHZvaWQ7XG4gIGhpZGU/KCk6IHZvaWQ7XG4gIGdldEJvdW5kcz8oKTogRWxlY3Ryb24uUmVjdGFuZ2xlO1xuICBnZXRDb250ZW50Qm91bmRzPygpOiBFbGVjdHJvbi5SZWN0YW5nbGU7XG4gIGdldFNpemU/KCk6IFtudW1iZXIsIG51bWJlcl07XG4gIGdldENvbnRlbnRTaXplPygpOiBbbnVtYmVyLCBudW1iZXJdO1xuICBzZXRUaXRsZT8odGl0bGU6IHN0cmluZyk6IHZvaWQ7XG4gIGdldFRpdGxlPygpOiBzdHJpbmc7XG4gIHNldFJlcHJlc2VudGVkRmlsZW5hbWU/KGZpbGVuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICBzZXREb2N1bWVudEVkaXRlZD8oZWRpdGVkOiBib29sZWFuKTogdm9pZDtcbiAgc2V0V2luZG93QnV0dG9uVmlzaWJpbGl0eT8odmlzaWJsZTogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmludGVyZmFjZSBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zIHtcbiAgcG9ydDogbnVtYmVyO1xuICBob3N0OiBzdHJpbmc7XG4gIGhpZGVNYWluV2luZG93OiBib29sZWFuO1xuICBnZXRXaW5kb3dTZXJ2aWNlczogKCkgPT4gQ29kZXhXaW5kb3dTZXJ2aWNlcyB8IG51bGw7XG4gIGxvZzogTG9nRm47XG59XG5cbmludGVyZmFjZSBCcm93c2VyVWlIb3N0IHtcbiAgdmlldzogRWxlY3Ryb24uQnJvd3NlclZpZXc7XG4gIHdlYkNvbnRlbnRzOiBFbGVjdHJvbi5XZWJDb250ZW50cztcbn1cblxuaW50ZXJmYWNlIEJyaWRnZVBlbmRpbmdSZXF1ZXN0IHtcbiAgcmVzb2x2ZTogKHZhbHVlOiB1bmtub3duKSA9PiB2b2lkO1xuICByZWplY3Q6IChlcnJvcjogRXJyb3IpID0+IHZvaWQ7XG4gIHRpbWVyOiBOb2RlSlMuVGltZW91dDtcbn1cblxuaW50ZXJmYWNlIEluaXRpYWxTdGF0ZSB7XG4gIHNuYXBzaG90OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgc3lzdGVtVGhlbWVWYXJpYW50OiBzdHJpbmc7XG4gIHNlbnRyeUluaXRPcHRpb25zOiB1bmtub3duO1xuICBidWlsZEZsYXZvcjogdW5rbm93bjtcbiAgdXNlc093bEFwcFNoZWxsOiBib29sZWFuO1xuICBwbGF0Zm9ybTogTm9kZUpTLlBsYXRmb3JtO1xuICBhcmNoOiBzdHJpbmc7XG59XG5cbmNvbnN0IE1JTUVfVFlQRVM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwiLmh0bWxcIjogXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLThcIixcbiAgXCIuanNcIjogXCJ0ZXh0L2phdmFzY3JpcHQ7IGNoYXJzZXQ9dXRmLThcIixcbiAgXCIuY3NzXCI6IFwidGV4dC9jc3M7IGNoYXJzZXQ9dXRmLThcIixcbiAgXCIuanNvblwiOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcbiAgXCIuc3ZnXCI6IFwiaW1hZ2Uvc3ZnK3htbFwiLFxuICBcIi5wbmdcIjogXCJpbWFnZS9wbmdcIixcbiAgXCIuanBnXCI6IFwiaW1hZ2UvanBlZ1wiLFxuICBcIi5qcGVnXCI6IFwiaW1hZ2UvanBlZ1wiLFxuICBcIi53ZWJwXCI6IFwiaW1hZ2Uvd2VicFwiLFxuICBcIi5pY29cIjogXCJpbWFnZS94LWljb25cIixcbiAgXCIud29mZlwiOiBcImZvbnQvd29mZlwiLFxuICBcIi53b2ZmMlwiOiBcImZvbnQvd29mZjJcIixcbn07XG5cbmxldCBhY3RpdmVTZXJ2ZXI6IFNlcnZlciB8IG51bGwgPSBudWxsO1xubGV0IGFjdGl2ZUhvc3Q6IEJyb3dzZXJVaUhvc3QgfCBudWxsID0gbnVsbDtcbmxldCBhY3RpdmVPcHRpb25zOiBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zIHwgbnVsbCA9IG51bGw7XG5jb25zdCBicmlkZ2VSZXF1ZXN0cyA9IG5ldyBNYXA8c3RyaW5nLCBCcmlkZ2VQZW5kaW5nUmVxdWVzdD4oKTtcbmNvbnN0IGNvbnRyb2xDbGllbnRzID0gbmV3IFNldDxXZWJTb2NrZXRDb25uZWN0aW9uPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gbWF5YmVTdGFydEJyb3dzZXJVaVNlcnZlcihcbiAgb3B0czogUGljazxCcm93c2VyVWlTZXJ2ZXJPcHRpb25zLCBcImdldFdpbmRvd1NlcnZpY2VzXCIgfCBcImxvZ1wiPixcbik6IHZvaWQge1xuICBpZiAocHJvY2Vzcy5lbnYuQ09ERVhQUF9CUk9XU0VSX1VJICE9PSBcIjFcIikgcmV0dXJuO1xuICBjb25zdCBwb3J0ID0gcGFyc2VQb3J0KHByb2Nlc3MuZW52LkNPREVYUFBfQlJPV1NFUl9VSV9QT1JULCA4NzY1KTtcbiAgc3RhcnRCcm93c2VyVWlTZXJ2ZXIoe1xuICAgIC4uLm9wdHMsXG4gICAgcG9ydCxcbiAgICBob3N0OiBcIjEyNy4wLjAuMVwiLFxuICAgIGhpZGVNYWluV2luZG93OiBwcm9jZXNzLmVudi5DT0RFWFBQX0JST1dTRVJfVUlfSElERV9NQUlOID09PSBcIjFcIixcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdGFydEJyb3dzZXJVaVNlcnZlcihvcHRzOiBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zKTogdm9pZCB7XG4gIGlmIChhY3RpdmVTZXJ2ZXIpIHJldHVybjtcbiAgYWN0aXZlT3B0aW9ucyA9IG9wdHM7XG4gIGluc3RhbGxCcm93c2VyVWlJcGNIYW5kbGVycyhvcHRzLmxvZyk7XG5cbiAgY29uc3Qgc2VydmVyID0gY3JlYXRlU2VydmVyKChyZXEsIHJlcykgPT4ge1xuICAgIGhhbmRsZUh0dHBSZXF1ZXN0KHJlcSwgcmVzKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIG9wdHMubG9nKFwiZXJyb3JcIiwgXCJicm93c2VyIFVJIHJlcXVlc3QgZmFpbGVkXCIsIHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgIHNlbmRUZXh0KHJlcywgNTAwLCBcIkludGVybmFsIFNlcnZlciBFcnJvclxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgfSk7XG4gIH0pO1xuICBzZXJ2ZXIub24oXCJ1cGdyYWRlXCIsIChyZXEsIHNvY2tldCwgaGVhZCkgPT4ge1xuICAgIGhhbmRsZVVwZ3JhZGUocmVxLCBzb2NrZXQgYXMgU29ja2V0LCBoZWFkKS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgIG9wdHMubG9nKFwid2FyblwiLCBcImJyb3dzZXIgVUkgd2Vic29ja2V0IHVwZ3JhZGUgZmFpbGVkXCIsIHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcbiAgICAgIHNvY2tldC5kZXN0cm95KCk7XG4gICAgfSk7XG4gIH0pO1xuICBzZXJ2ZXIub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICBvcHRzLmxvZyhcImVycm9yXCIsIFwiYnJvd3NlciBVSSBzZXJ2ZXIgZmFpbGVkXCIsIHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB9KTtcbiAgfSk7XG4gIHNlcnZlci5saXN0ZW4ob3B0cy5wb3J0LCBvcHRzLmhvc3QsICgpID0+IHtcbiAgICBvcHRzLmxvZyhcImluZm9cIiwgYGJyb3dzZXIgVUkgc2VydmVyIGxpc3RlbmluZyBhdCBodHRwOi8vJHtvcHRzLmhvc3R9OiR7b3B0cy5wb3J0fS9gKTtcbiAgfSk7XG4gIGFjdGl2ZVNlcnZlciA9IHNlcnZlcjtcbiAgaWYgKG9wdHMuaGlkZU1haW5XaW5kb3cpIHtcbiAgICBmb3IgKGNvbnN0IGRlbGF5TXMgb2YgWzUwMCwgMV81MDAsIDNfMDAwXSkge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KGhpZGVWaXNpYmxlQ29kZXhXaW5kb3dzLCBkZWxheU1zKTtcbiAgICAgIHRpbWVyLnVucmVmPy4oKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbEJyb3dzZXJVaUlwY0hhbmRsZXJzKGxvZzogTG9nRm4pOiB2b2lkIHtcbiAgaXBjTWFpbi5yZW1vdmVBbGxMaXN0ZW5lcnMoQlJJREdFX1JFU1BPTlNFX0NIQU5ORUwpO1xuICBpcGNNYWluLnJlbW92ZUFsbExpc3RlbmVycyhNRVNTQUdFX0ZPUl9WSUVXX0NIQU5ORUwpO1xuICBpcGNNYWluLnJlbW92ZUFsbExpc3RlbmVycyhXT1JLRVJfTUVTU0FHRV9DSEFOTkVMKTtcbiAgaXBjTWFpbi5yZW1vdmVBbGxMaXN0ZW5lcnMoU1lTVEVNX1RIRU1FX0NIQU5ORUwpO1xuXG4gIGlwY01haW4ub24oQlJJREdFX1JFU1BPTlNFX0NIQU5ORUwsIChldmVudCwgcGF5bG9hZCkgPT4ge1xuICAgIGlmICghaXNCcm93c2VyVWlIb3N0U2VuZGVyKGV2ZW50LnNlbmRlcikpIHJldHVybjtcbiAgICBjb25zdCByZXNwb25zZSA9IGFzUmVjb3JkKHBheWxvYWQpO1xuICAgIGNvbnN0IGlkID0gdHlwZW9mIHJlc3BvbnNlPy5pZCA9PT0gXCJzdHJpbmdcIiA/IHJlc3BvbnNlLmlkIDogXCJcIjtcbiAgICBjb25zdCBwZW5kaW5nID0gYnJpZGdlUmVxdWVzdHMuZ2V0KGlkKTtcbiAgICBpZiAoIXBlbmRpbmcpIHJldHVybjtcbiAgICBicmlkZ2VSZXF1ZXN0cy5kZWxldGUoaWQpO1xuICAgIGNsZWFyVGltZW91dChwZW5kaW5nLnRpbWVyKTtcbiAgICBpZiAocmVzcG9uc2U/Lm9rID09PSB0cnVlKSB7XG4gICAgICBwZW5kaW5nLnJlc29sdmUocmVzcG9uc2UudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwZW5kaW5nLnJlamVjdChuZXcgRXJyb3IodHlwZW9mIHJlc3BvbnNlPy5lcnJvciA9PT0gXCJzdHJpbmdcIiA/IHJlc3BvbnNlLmVycm9yIDogXCJCcmlkZ2UgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgIH1cbiAgfSk7XG5cbiAgaXBjTWFpbi5vbihNRVNTQUdFX0ZPUl9WSUVXX0NIQU5ORUwsIChldmVudCwgbWVzc2FnZSkgPT4ge1xuICAgIGlmICghaXNCcm93c2VyVWlIb3N0U2VuZGVyKGV2ZW50LnNlbmRlcikpIHJldHVybjtcbiAgICBicm9hZGNhc3RDb250cm9sKHsgdHlwZTogXCJtZXNzYWdlLWZvci12aWV3XCIsIG1lc3NhZ2UgfSk7XG4gIH0pO1xuXG4gIGlwY01haW4ub24oV09SS0VSX01FU1NBR0VfQ0hBTk5FTCwgKGV2ZW50LCB3b3JrZXJJZCwgbWVzc2FnZSkgPT4ge1xuICAgIGlmICghaXNCcm93c2VyVWlIb3N0U2VuZGVyKGV2ZW50LnNlbmRlcikpIHJldHVybjtcbiAgICBpZiAodHlwZW9mIHdvcmtlcklkICE9PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgYnJvYWRjYXN0Q29udHJvbCh7IHR5cGU6IFwid29ya2VyLW1lc3NhZ2VcIiwgd29ya2VySWQsIG1lc3NhZ2UgfSk7XG4gIH0pO1xuXG4gIGlwY01haW4ub24oU1lTVEVNX1RIRU1FX0NIQU5ORUwsIChldmVudCwgdmFsdWUpID0+IHtcbiAgICBpZiAoIWlzQnJvd3NlclVpSG9zdFNlbmRlcihldmVudC5zZW5kZXIpKSByZXR1cm47XG4gICAgYnJvYWRjYXN0Q29udHJvbCh7IHR5cGU6IFwic3lzdGVtLXRoZW1lLXZhcmlhbnQtdXBkYXRlZFwiLCB2YWx1ZSB9KTtcbiAgfSk7XG5cbiAgcHJvY2Vzcy5vbmNlKFwiZXhpdFwiLCAoKSA9PiB7XG4gICAgZm9yIChjb25zdCBwZW5kaW5nIG9mIGJyaWRnZVJlcXVlc3RzLnZhbHVlcygpKSB7XG4gICAgICBjbGVhclRpbWVvdXQocGVuZGluZy50aW1lcik7XG4gICAgICBwZW5kaW5nLnJlamVjdChuZXcgRXJyb3IoXCJDb2RleCsrIGJyb3dzZXIgVUkgc2VydmVyIHN0b3BwZWRcIikpO1xuICAgIH1cbiAgICBicmlkZ2VSZXF1ZXN0cy5jbGVhcigpO1xuICAgIGZvciAoY29uc3QgY2xpZW50IG9mIGNvbnRyb2xDbGllbnRzKSBjbGllbnQuY2xvc2UoKTtcbiAgICBjb250cm9sQ2xpZW50cy5jbGVhcigpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoYWN0aXZlSG9zdCAmJiAhYWN0aXZlSG9zdC53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgIGFjdGl2ZUhvc3Qud2ViQ29udGVudHMuY2xvc2UoeyB3YWl0Rm9yQmVmb3JlVW5sb2FkOiBmYWxzZSB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgbG9nKFwid2FyblwiLCBcImJyb3dzZXIgVUkgaG9zdCBjbGVhbnVwIGZhaWxlZFwiLCB7IG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgfVxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlSHR0cFJlcXVlc3QocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgb3B0aW9ucyA9IHJlcXVpcmVPcHRpb25zKCk7XG4gIGNvbnN0IHVybCA9IHJlcXVlc3RVcmwocmVxKTtcbiAgaWYgKCF1cmwpIHtcbiAgICBzZW5kVGV4dChyZXMsIDQwMCwgXCJCYWQgUmVxdWVzdFxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHVybC5wYXRobmFtZSA9PT0gXCIvY29kZXhwcC9icm93c2VyLXVpL2hlYWx0aFwiKSB7XG4gICAgc2VuZEpzb24ocmVzLCAyMDAsIHsgb2s6IHRydWUgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHVybC5wYXRobmFtZSA9PT0gXCIvY29kZXhwcC9icm93c2VyLXVpL2JyaWRnZVwiKSB7XG4gICAgaWYgKHJlcS5tZXRob2QgIT09IFwiUE9TVFwiKSB7XG4gICAgICBzZW5kVGV4dChyZXMsIDQwNSwgXCJNZXRob2QgTm90IEFsbG93ZWRcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBib2R5ID0gYXNSZWNvcmQoYXdhaXQgcmVhZEpzb25Cb2R5KHJlcSkpO1xuICAgIGNvbnN0IG1ldGhvZCA9IHR5cGVvZiBib2R5Py5tZXRob2QgPT09IFwic3RyaW5nXCIgPyBib2R5Lm1ldGhvZCA6IFwiXCI7XG4gICAgY29uc3QgYXJncyA9IEFycmF5LmlzQXJyYXkoYm9keT8uYXJncykgPyBib2R5LmFyZ3MgOiBbXTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhd2FpdCBjYWxsSGlkZGVuQnJpZGdlKG1ldGhvZCwgYXJncyk7XG4gICAgICBzZW5kSnNvbihyZXMsIDIwMCwgeyBvazogdHJ1ZSwgdmFsdWUgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHNlbmRKc29uKHJlcywgNTAwLCB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodXJsLnBhdGhuYW1lID09PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvYnJpZGdlLmpzXCIpIHtcbiAgICBpZiAocmVxLm1ldGhvZCAhPT0gXCJHRVRcIiAmJiByZXEubWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgc2VuZFRleHQocmVzLCA0MDUsIFwiTWV0aG9kIE5vdCBBbGxvd2VkXFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgc2NyaXB0ID0gYnJvd3NlckJyaWRnZVNjcmlwdChhd2FpdCBjb2xsZWN0SW5pdGlhbFN0YXRlKG9wdGlvbnMpKTtcbiAgICBzZW5kQnVmZmVyKHJlcywgMjAwLCBCdWZmZXIuZnJvbShzY3JpcHQpLCBNSU1FX1RZUEVTW1wiLmpzXCJdLCByZXEubWV0aG9kID09PSBcIkhFQURcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHJlcS5tZXRob2QgIT09IFwiR0VUXCIgJiYgcmVxLm1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcbiAgICBzZW5kVGV4dChyZXMsIDQwNSwgXCJNZXRob2QgTm90IEFsbG93ZWRcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh1cmwucGF0aG5hbWUgPT09IFwiL1wiIHx8IHVybC5wYXRobmFtZSA9PT0gXCIvaW5kZXguaHRtbFwiKSB7XG4gICAgY29uc3QgaHRtbCA9IGF3YWl0IGJyb3dzZXJJbmRleEh0bWwoKTtcbiAgICBzZW5kQnVmZmVyKHJlcywgMjAwLCBCdWZmZXIuZnJvbShodG1sKSwgTUlNRV9UWVBFU1tcIi5odG1sXCJdLCByZXEubWV0aG9kID09PSBcIkhFQURcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZmlsZSA9IHdlYnZpZXdGaWxlKHVybC5wYXRobmFtZSk7XG4gIGlmICghZmlsZSkge1xuICAgIHNlbmRUZXh0KHJlcywgNDA0LCBcIk5vdCBGb3VuZFxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGNvbnRlbnQgPSByZWFkRmlsZVN5bmMoZmlsZSk7XG4gIHNlbmRCdWZmZXIocmVzLCAyMDAsIGNvbnRlbnQsIG1pbWVUeXBlKGZpbGUpLCByZXEubWV0aG9kID09PSBcIkhFQURcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVVwZ3JhZGUocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHNvY2tldDogU29ja2V0LCBoZWFkOiBCdWZmZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdXJsID0gcmVxdWVzdFVybChyZXEpO1xuICBpZiAoIXVybCkgdGhyb3cgbmV3IEVycm9yKFwiYmFkIHdlYnNvY2tldCBVUkxcIik7XG4gIGlmICh1cmwucGF0aG5hbWUgIT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9ycGNcIiAmJiB1cmwucGF0aG5hbWUgIT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9jb250cm9sXCIpIHtcbiAgICBzb2NrZXQuZGVzdHJveSgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCB3cyA9IGFjY2VwdFdlYlNvY2tldChyZXEsIHNvY2tldCwgaGVhZCk7XG4gIGlmICh1cmwucGF0aG5hbWUgPT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9jb250cm9sXCIpIHtcbiAgICBjb250cm9sQ2xpZW50cy5hZGQod3MpO1xuICAgIHdzLm9uQ2xvc2UoKCkgPT4gY29udHJvbENsaWVudHMuZGVsZXRlKHdzKSk7XG4gICAgd3Muc2VuZEpzb24oeyB0eXBlOiBcImhlbGxvXCIgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaG9zdCA9IGF3YWl0IGVuc3VyZUJyb3dzZXJVaUhvc3QoKTtcbiAgY29uc3QgeyBwb3J0MSwgcG9ydDIgfSA9IG5ldyBNZXNzYWdlQ2hhbm5lbE1haW4oKTtcbiAgaG9zdC53ZWJDb250ZW50cy5wb3N0TWVzc2FnZShDT05ORUNUX1BPUlRfQ0hBTk5FTCwge30sIFtwb3J0Ml0pO1xuICBicmlkZ2VNZXNzYWdlUG9ydFRvV2ViU29ja2V0KHBvcnQxLCB3cyk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGJyb3dzZXJJbmRleEh0bWwoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgaW5kZXhQYXRoID0gam9pbih3ZWJ2aWV3Um9vdCgpLCBcImluZGV4Lmh0bWxcIik7XG4gIGxldCBodG1sID0gcmVsYXhCcm93c2VyVWlDc3AocmVhZEZpbGVTeW5jKGluZGV4UGF0aCwgXCJ1dGY4XCIpKTtcbiAgY29uc3Qgc2hpbSA9IGA8c2NyaXB0IHNyYz1cIi9jb2RleHBwL2Jyb3dzZXItdWkvYnJpZGdlLmpzXCI+PC9zY3JpcHQ+YDtcbiAgaWYgKGh0bWwuaW5jbHVkZXMoXCI8L2hlYWQ+XCIpKSB7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShcIjwvaGVhZD5cIiwgYCR7c2hpbX1cXG4gIDwvaGVhZD5gKTtcbiAgfSBlbHNlIHtcbiAgICBodG1sID0gYCR7c2hpbX1cXG4ke2h0bWx9YDtcbiAgfVxuICByZXR1cm4gaHRtbDtcbn1cblxuZnVuY3Rpb24gcmVsYXhCcm93c2VyVWlDc3AoaHRtbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGh0bWwucmVwbGFjZShcbiAgICAvKDxtZXRhXFxzK2h0dHAtZXF1aXY9W1wiJ11Db250ZW50LVNlY3VyaXR5LVBvbGljeVtcIiddXFxzK2NvbnRlbnQ9XCIpKFteXCJdKikoXCIpLyxcbiAgICAoX21hdGNoLCBwcmVmaXg6IHN0cmluZywgY29udGVudDogc3RyaW5nLCBzdWZmaXg6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgZGlyZWN0aXZlcyA9IHBhcnNlQ3NwRGlyZWN0aXZlcyhkZWNvZGVIdG1sQXR0cmlidXRlKGNvbnRlbnQpKTtcbiAgICAgIGRpcmVjdGl2ZXMuc2V0KFwiY2hpbGQtc3JjXCIsIFwiJ3NlbGYnIGJsb2I6IGRhdGE6IGh0dHA6IGh0dHBzOlwiKTtcbiAgICAgIGRpcmVjdGl2ZXMuc2V0KFwiZnJhbWUtc3JjXCIsIFwiJ3NlbGYnIGJsb2I6IGRhdGE6IGh0dHA6IGh0dHBzOlwiKTtcbiAgICAgIGRpcmVjdGl2ZXMuc2V0KFwiY29ubmVjdC1zcmNcIiwgXCInc2VsZicgaHR0cDogaHR0cHM6IHdzOiB3c3M6IHNlbnRyeS1pcGM6XCIpO1xuICAgICAgcmV0dXJuIGAke3ByZWZpeH0ke2VuY29kZUh0bWxBdHRyaWJ1dGUoZm9ybWF0Q3NwRGlyZWN0aXZlcyhkaXJlY3RpdmVzKSl9JHtzdWZmaXh9YDtcbiAgICB9LFxuICApO1xufVxuXG5mdW5jdGlvbiBwYXJzZUNzcERpcmVjdGl2ZXMoY29udGVudDogc3RyaW5nKTogTWFwPHN0cmluZywgc3RyaW5nPiB7XG4gIGNvbnN0IGRpcmVjdGl2ZXMgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IHBhcnQgb2YgY29udGVudC5zcGxpdChcIjtcIikpIHtcbiAgICBjb25zdCB0cmltbWVkID0gcGFydC50cmltKCk7XG4gICAgaWYgKCF0cmltbWVkKSBjb250aW51ZTtcbiAgICBjb25zdCBbbmFtZSwgLi4ucmVzdF0gPSB0cmltbWVkLnNwbGl0KC9cXHMrLyk7XG4gICAgaWYgKCFuYW1lKSBjb250aW51ZTtcbiAgICBkaXJlY3RpdmVzLnNldChuYW1lLCByZXN0LmpvaW4oXCIgXCIpKTtcbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlcztcbn1cblxuZnVuY3Rpb24gZm9ybWF0Q3NwRGlyZWN0aXZlcyhkaXJlY3RpdmVzOiBNYXA8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgcmV0dXJuIFsuLi5kaXJlY3RpdmVzLmVudHJpZXMoKV1cbiAgICAubWFwKChbbmFtZSwgdmFsdWVdKSA9PiAodmFsdWUgPyBgJHtuYW1lfSAke3ZhbHVlfWAgOiBuYW1lKSlcbiAgICAuam9pbihcIjsgXCIpO1xufVxuXG5mdW5jdGlvbiBkZWNvZGVIdG1sQXR0cmlidXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csICdcIicpXG4gICAgLnJlcGxhY2UoLyYjMzk7L2csIFwiJ1wiKVxuICAgIC5yZXBsYWNlKC8mbHQ7L2csIFwiPFwiKVxuICAgIC5yZXBsYWNlKC8mZ3Q7L2csIFwiPlwiKVxuICAgIC5yZXBsYWNlKC8mYW1wOy9nLCBcIiZcIik7XG59XG5cbmZ1bmN0aW9uIGVuY29kZUh0bWxBdHRyaWJ1dGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZVxuICAgIC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcbiAgICAucmVwbGFjZSgvXCIvZywgXCImcXVvdDtcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNvbGxlY3RJbml0aWFsU3RhdGUob3B0aW9uczogQnJvd3NlclVpU2VydmVyT3B0aW9ucyk6IFByb21pc2U8SW5pdGlhbFN0YXRlPiB7XG4gIGF3YWl0IGVuc3VyZUJyb3dzZXJVaUhvc3QoKTtcbiAgY29uc3QgW3NuYXBzaG90LCBzeXN0ZW1UaGVtZVZhcmlhbnQsIHNlbnRyeUluaXRPcHRpb25zLCBidWlsZEZsYXZvciwgdXNlc093bEFwcFNoZWxsXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICBjYWxsSGlkZGVuQnJpZGdlKFwic25hcHNob3RcIiwgW10pLFxuICAgIGNhbGxIaWRkZW5CcmlkZ2UoXCJzeXN0ZW1UaGVtZVwiLCBbXSksXG4gICAgY2FsbEhpZGRlbkJyaWRnZShcInNlbnRyeU9wdGlvbnNcIiwgW10pLFxuICAgIGNhbGxIaWRkZW5CcmlkZ2UoXCJidWlsZEZsYXZvclwiLCBbXSksXG4gICAgY2FsbEhpZGRlbkJyaWRnZShcInVzZXNPd2xBcHBTaGVsbFwiLCBbXSksXG4gIF0pO1xuICBpZiAob3B0aW9ucy5oaWRlTWFpbldpbmRvdykgaGlkZVZpc2libGVDb2RleFdpbmRvd3MoKTtcbiAgcmV0dXJuIHtcbiAgICBzbmFwc2hvdDogYXNQbGFpbk9iamVjdChzbmFwc2hvdCksXG4gICAgc3lzdGVtVGhlbWVWYXJpYW50OiB0eXBlb2Ygc3lzdGVtVGhlbWVWYXJpYW50ID09PSBcInN0cmluZ1wiID8gc3lzdGVtVGhlbWVWYXJpYW50IDogY3VycmVudFN5c3RlbVRoZW1lVmFyaWFudCgpLFxuICAgIHNlbnRyeUluaXRPcHRpb25zLFxuICAgIGJ1aWxkRmxhdm9yLFxuICAgIHVzZXNPd2xBcHBTaGVsbDogdXNlc093bEFwcFNoZWxsID09PSB0cnVlLFxuICAgIHBsYXRmb3JtOiBwcm9jZXNzLnBsYXRmb3JtLFxuICAgIGFyY2g6IHByb2Nlc3MuYXJjaCxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZW5zdXJlQnJvd3NlclVpSG9zdCgpOiBQcm9taXNlPEJyb3dzZXJVaUhvc3Q+IHtcbiAgaWYgKGFjdGl2ZUhvc3QgJiYgIWFjdGl2ZUhvc3Qud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGFjdGl2ZUhvc3Q7XG4gIGNvbnN0IG9wdGlvbnMgPSByZXF1aXJlT3B0aW9ucygpO1xuICBjb25zdCBzZXJ2aWNlcyA9IGF3YWl0IHdhaXRGb3JXaW5kb3dTZXJ2aWNlcyhvcHRpb25zKTtcbiAgY29uc3Qgd2luZG93TWFuYWdlciA9IHNlcnZpY2VzLndpbmRvd01hbmFnZXI7XG4gIGlmICghd2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCB3aW5kb3cgcmVnaXN0cmF0aW9uIHNlcnZpY2VzIGFyZSB1bmF2YWlsYWJsZVwiKTtcbiAgfVxuXG4gIGNvbnN0IHZpZXcgPSBuZXcgQnJvd3NlclZpZXcoe1xuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBwcmVsb2FkOiB3aW5kb3dNYW5hZ2VyLm9wdGlvbnM/LnByZWxvYWRQYXRoLFxuICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2UsXG4gICAgICBzcGVsbGNoZWNrOiBmYWxzZSxcbiAgICAgIGRldlRvb2xzOiB3aW5kb3dNYW5hZ2VyLm9wdGlvbnM/LmFsbG93RGV2dG9vbHMsXG4gICAgfSxcbiAgfSk7XG4gIGNvbnN0IHdpbmRvd0xpa2UgPSBtYWtlV2luZG93TGlrZUZvclZpZXcodmlldyk7XG4gIHdpbmRvd01hbmFnZXIucmVnaXN0ZXJXaW5kb3cod2luZG93TGlrZSwgXCJsb2NhbFwiLCBmYWxzZSwgXCJzZWNvbmRhcnlcIik7XG4gIGNvbnN0IGNvbnRleHQgPSBzZXJ2aWNlcy5nZXRDb250ZXh0Rm9yV2ViQ29udGVudHM/Lih2aWV3LndlYkNvbnRlbnRzKSA/PyBzZXJ2aWNlcy5nZXRDb250ZXh0Py4oXCJsb2NhbFwiKTtcbiAgY29udGV4dD8ucmVnaXN0ZXJXaW5kb3c/Lih3aW5kb3dMaWtlKTtcbiAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKFwiYWJvdXQ6YmxhbmtcIik7XG4gIGFjdGl2ZUhvc3QgPSB7IHZpZXcsIHdlYkNvbnRlbnRzOiB2aWV3LndlYkNvbnRlbnRzIH07XG4gIHZpZXcud2ViQ29udGVudHMub25jZShcImRlc3Ryb3llZFwiLCAoKSA9PiB7XG4gICAgaWYgKGFjdGl2ZUhvc3Q/LndlYkNvbnRlbnRzID09PSB2aWV3LndlYkNvbnRlbnRzKSBhY3RpdmVIb3N0ID0gbnVsbDtcbiAgfSk7XG4gIG9wdGlvbnMubG9nKFwiaW5mb1wiLCBcImJyb3dzZXIgVUkgaGlkZGVuIGhvc3QgcmVhZHlcIiwgeyB3ZWJDb250ZW50c0lkOiB2aWV3LndlYkNvbnRlbnRzLmlkIH0pO1xuICByZXR1cm4gYWN0aXZlSG9zdDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gd2FpdEZvcldpbmRvd1NlcnZpY2VzKG9wdGlvbnM6IEJyb3dzZXJVaVNlcnZlck9wdGlvbnMpOiBQcm9taXNlPENvZGV4V2luZG93U2VydmljZXM+IHtcbiAgY29uc3Qgc3RhcnRlZCA9IERhdGUubm93KCk7XG4gIHdoaWxlIChEYXRlLm5vdygpIC0gc3RhcnRlZCA8IDMwXzAwMCkge1xuICAgIGNvbnN0IHNlcnZpY2VzID0gb3B0aW9ucy5nZXRXaW5kb3dTZXJ2aWNlcygpO1xuICAgIGlmIChcbiAgICAgIHNlcnZpY2VzPy53aW5kb3dNYW5hZ2VyPy5yZWdpc3RlcldpbmRvdyAmJlxuICAgICAgKHNlcnZpY2VzLmdldENvbnRleHQgfHwgc2VydmljZXMuZ2V0Q29udGV4dEZvcldlYkNvbnRlbnRzKVxuICAgICkge1xuICAgICAgcmV0dXJuIHNlcnZpY2VzO1xuICAgIH1cbiAgICBhd2FpdCBkZWxheSgxMDApO1xuICB9XG4gIHRocm93IG5ldyBFcnJvcihcIlRpbWVkIG91dCB3YWl0aW5nIGZvciBDb2RleCB3aW5kb3cgc2VydmljZXNcIik7XG59XG5cbmZ1bmN0aW9uIGNhbGxIaWRkZW5CcmlkZ2UobWV0aG9kOiBzdHJpbmcsIGFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8dW5rbm93bj4ge1xuICBhc3NlcnRCcmlkZ2VNZXRob2QobWV0aG9kKTtcbiAgcmV0dXJuIGVuc3VyZUJyb3dzZXJVaUhvc3QoKS50aGVuKChob3N0KSA9PiB7XG4gICAgY29uc3QgaWQgPSByYW5kb21VVUlEKCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGJyaWRnZVJlcXVlc3RzLmRlbGV0ZShpZCk7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRpbWVkIG91dCB3YWl0aW5nIGZvciBicm93c2VyIFVJIGJyaWRnZSBtZXRob2Q6ICR7bWV0aG9kfWApKTtcbiAgICAgIH0sIDE1XzAwMCk7XG4gICAgICBicmlkZ2VSZXF1ZXN0cy5zZXQoaWQsIHsgcmVzb2x2ZSwgcmVqZWN0LCB0aW1lciB9KTtcbiAgICAgIGhvc3Qud2ViQ29udGVudHMuc2VuZChCUklER0VfUkVRVUVTVF9DSEFOTkVMLCB7IGlkLCBtZXRob2QsIGFyZ3MgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBicmlkZ2VNZXNzYWdlUG9ydFRvV2ViU29ja2V0KHBvcnQ6IEVsZWN0cm9uLk1lc3NhZ2VQb3J0TWFpbiwgd3M6IFdlYlNvY2tldENvbm5lY3Rpb24pOiB2b2lkIHtcbiAgbGV0IGNsb3NlZCA9IGZhbHNlO1xuICBjb25zdCBjbG9zZSA9ICgpID0+IHtcbiAgICBpZiAoY2xvc2VkKSByZXR1cm47XG4gICAgY2xvc2VkID0gdHJ1ZTtcbiAgICB0cnkge1xuICAgICAgcG9ydC5wb3N0TWVzc2FnZShudWxsKTtcbiAgICB9IGNhdGNoIHt9XG4gICAgdHJ5IHtcbiAgICAgIHBvcnQuY2xvc2UoKTtcbiAgICB9IGNhdGNoIHt9XG4gICAgd3MuY2xvc2UoKTtcbiAgfTtcbiAgcG9ydC5zdGFydCgpO1xuICBwb3J0Lm9uKFwibWVzc2FnZVwiLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoY2xvc2VkKSByZXR1cm47XG4gICAgaWYgKGV2ZW50LmRhdGEgPT0gbnVsbCkge1xuICAgICAgY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBldmVudC5kYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICB3cy5zZW5kVGV4dChldmVudC5kYXRhKTtcbiAgICB9XG4gIH0pO1xuICBwb3J0Lm9uKFwiY2xvc2VcIiwgY2xvc2UpO1xuICB3cy5vblRleHQoKHRleHQpID0+IHtcbiAgICBpZiAoY2xvc2VkKSByZXR1cm47XG4gICAgcG9ydC5wb3N0TWVzc2FnZSh0ZXh0KTtcbiAgfSk7XG4gIHdzLm9uQ2xvc2UoY2xvc2UpO1xufVxuXG5mdW5jdGlvbiBicm9hZGNhc3RDb250cm9sKHBheWxvYWQ6IHVua25vd24pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBjbGllbnQgb2YgWy4uLmNvbnRyb2xDbGllbnRzXSkge1xuICAgIHRyeSB7XG4gICAgICBjbGllbnQuc2VuZEpzb24ocGF5bG9hZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICBjbGllbnQuY2xvc2UoKTtcbiAgICAgIGNvbnRyb2xDbGllbnRzLmRlbGV0ZShjbGllbnQpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBicm93c2VyQnJpZGdlU2NyaXB0KHN0YXRlOiBJbml0aWFsU3RhdGUpOiBzdHJpbmcge1xuICByZXR1cm4gYFxuKCgpID0+IHtcbiAgY29uc3QgaW5pdGlhbFN0YXRlID0gJHtzYWZlSnNvbihzdGF0ZSl9O1xuICBjb25zdCBzbmFwc2hvdCA9IG5ldyBNYXAoT2JqZWN0LmVudHJpZXMoaW5pdGlhbFN0YXRlLnNuYXBzaG90IHx8IHt9KSk7XG4gIGNvbnN0IHdvcmtlclN1YnNjcmliZXJzID0gbmV3IE1hcCgpO1xuICBjb25zdCB0aGVtZVN1YnNjcmliZXJzID0gbmV3IFNldCgpO1xuICBjb25zdCBicm93c2VyU2lkZWJhclNuYXBzaG90cyA9IG5ldyBNYXAoKTtcbiAgY29uc3QgYnJvd3NlclNpZGViYXJTZWVkZWRMb2NhbFNlcnZlcnMgPSBuZXcgU2V0KCk7XG4gIGxldCBzeXN0ZW1UaGVtZVZhcmlhbnQgPSBpbml0aWFsU3RhdGUuc3lzdGVtVGhlbWVWYXJpYW50IHx8IFwibGlnaHRcIjtcblxuICB3aW5kb3cuX19jb2RleHBwQnJvd3NlclVpID0gdHJ1ZTtcbiAgaW5zdGFsbEJyb3dzZXJVaVdlYnZpZXdTaGltKCk7XG5cbiAgY29uc3QgY29udHJvbCA9IG5ldyBXZWJTb2NrZXQobmV3IFVSTChcIi9jb2RleHBwL2Jyb3dzZXItdWkvY29udHJvbFwiLCBsb2NhdGlvbi5ocmVmKSk7XG4gIGNvbnRyb2wuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgbGV0IHBheWxvYWQ7XG4gICAgdHJ5IHsgcGF5bG9hZCA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7IH0gY2F0Y2ggeyByZXR1cm47IH1cbiAgICBpZiAocGF5bG9hZC50eXBlID09PSBcIm1lc3NhZ2UtZm9yLXZpZXdcIikge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IHBheWxvYWQubWVzc2FnZTtcbiAgICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UudHlwZSA9PT0gXCJzaGFyZWQtb2JqZWN0LXVwZGF0ZWRcIikge1xuICAgICAgICBpZiAobWVzc2FnZS52YWx1ZSA9PT0gdW5kZWZpbmVkKSBzbmFwc2hvdC5kZWxldGUobWVzc2FnZS5rZXkpO1xuICAgICAgICBlbHNlIHNuYXBzaG90LnNldChtZXNzYWdlLmtleSwgbWVzc2FnZS52YWx1ZSk7XG4gICAgICB9XG4gICAgICByZW1lbWJlckJyb3dzZXJTaWRlYmFySG9zdE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgTWVzc2FnZUV2ZW50KFwibWVzc2FnZVwiLCB7IGRhdGE6IG1lc3NhZ2UgfSkpO1xuICAgIH0gZWxzZSBpZiAocGF5bG9hZC50eXBlID09PSBcIndvcmtlci1tZXNzYWdlXCIpIHtcbiAgICAgIGNvbnN0IHN1YnMgPSB3b3JrZXJTdWJzY3JpYmVycy5nZXQocGF5bG9hZC53b3JrZXJJZCk7XG4gICAgICBpZiAoc3VicykgZm9yIChjb25zdCBmbiBvZiBbLi4uc3Vic10pIGZuKHBheWxvYWQubWVzc2FnZSk7XG4gICAgfSBlbHNlIGlmIChwYXlsb2FkLnR5cGUgPT09IFwic3lzdGVtLXRoZW1lLXZhcmlhbnQtdXBkYXRlZFwiKSB7XG4gICAgICBzeXN0ZW1UaGVtZVZhcmlhbnQgPSBwYXlsb2FkLnZhbHVlO1xuICAgICAgZm9yIChjb25zdCBmbiBvZiBbLi4udGhlbWVTdWJzY3JpYmVyc10pIGZuKCk7XG4gICAgfVxuICB9KTtcblxuICBhc3luYyBmdW5jdGlvbiBicmlkZ2UobWV0aG9kLCBhcmdzID0gW10pIHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9jb2RleHBwL2Jyb3dzZXItdWkvYnJpZGdlXCIsIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7IFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1ldGhvZCwgYXJncyB9KSxcbiAgICB9KTtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICBpZiAoIWJvZHkub2spIHRocm93IG5ldyBFcnJvcihib2R5LmVycm9yIHx8IFwiQ29kZXgrKyBicm93c2VyIGJyaWRnZSBmYWlsZWRcIik7XG4gICAgcmV0dXJuIGJvZHkudmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBsZWdhY3lCcm93c2VyVGFiSWQoY29udmVyc2F0aW9uSWQpIHtcbiAgICByZXR1cm4gU3RyaW5nKGNvbnZlcnNhdGlvbklkIHx8IFwibmV3LWNvbnZlcnNhdGlvblwiKSArIFwiOmxlZ2FjeVwiO1xuICB9XG5cbiAgZnVuY3Rpb24gYnJvd3NlclNpZGViYXJLZXkoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCkge1xuICAgIHJldHVybiBTdHJpbmcoY29udmVyc2F0aW9uSWQgfHwgXCJuZXctY29udmVyc2F0aW9uXCIpICsgXCI6OlwiICsgU3RyaW5nKGJyb3dzZXJUYWJJZCB8fCBsZWdhY3lCcm93c2VyVGFiSWQoY29udmVyc2F0aW9uSWQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZUJyb3dzZXJVcmwodmFsdWUpIHtcbiAgICBjb25zdCByYXcgPSBTdHJpbmcodmFsdWUgfHwgXCJcIikudHJpbSgpO1xuICAgIGlmICghcmF3KSByZXR1cm4gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBVUkwocmF3KS5ocmVmO1xuICAgIH0gY2F0Y2gge31cbiAgICBpZiAoL15bYS16QS1aXVthLXpBLVowLTkrLi1dKjovLnRlc3QocmF3KSkgcmV0dXJuIHJhdztcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIG5ldyBVUkwoXCJodHRwczovL1wiICsgcmF3KS5ocmVmO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuIHJhdztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBicm93c2VyVGl0bGVGb3JVcmwodXJsKSB7XG4gICAgaWYgKCF1cmwpIHJldHVybiBcIk5ldyB0YWJcIjtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaG9zdCA9IG5ldyBVUkwodXJsKS5ob3N0bmFtZS5yZXBsYWNlKC9ed3d3XFxcXC4vLCBcIlwiKTtcbiAgICAgIHJldHVybiBob3N0IHx8IHVybDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUJyb3dzZXJTaWRlYmFyU25hcHNob3QodXJsLCBwYXRjaCA9IHt9KSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZUJyb3dzZXJVcmwodXJsKTtcbiAgICByZXR1cm4ge1xuICAgICAgdGFiVHlwZTogbm9ybWFsaXplZCA/IFwid2ViXCIgOiBcIm5ldy10YWItcGFnZVwiLFxuICAgICAgaXNTdXNwZW5kZWQ6IGZhbHNlLFxuICAgICAgdGl0bGU6IG5vcm1hbGl6ZWQgPyBicm93c2VyVGl0bGVGb3JVcmwobm9ybWFsaXplZCkgOiBcIk5ldyB0YWJcIixcbiAgICAgIHVybDogbm9ybWFsaXplZCxcbiAgICAgIGZhdmljb25Vcmw6IG51bGwsXG4gICAgICBpc0xvYWRpbmc6IGZhbHNlLFxuICAgICAgY2FuR29CYWNrOiBmYWxzZSxcbiAgICAgIGNhbkdvRm9yd2FyZDogZmFsc2UsXG4gICAgICB6b29tUGVyY2VudDogMTAwLFxuICAgICAgY29tbWVudE1vZGVEaXNhYmxlZFJlYXNvbjogbnVsbCxcbiAgICAgIGludGVyYWN0aW9uTW9kZTogXCJicm93c2VcIixcbiAgICAgIGFubm90YXRpb25FZGl0b3JNb2RlOiBcImNvbW1lbnRcIixcbiAgICAgIGlzQW5ub3RhdGlvbkFkZE1vZGlmaWVyUHJlc3NlZDogZmFsc2UsXG4gICAgICBpc09yaWdpbmFsVmlld0VuYWJsZWQ6IGZhbHNlLFxuICAgICAgaXNUd2Vha3NFZGl0b3JPcGVuOiBmYWxzZSxcbiAgICAgIGNvbW1lbnRzOiBbXSxcbiAgICAgIC4uLnBhdGNoLFxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBkaXNwYXRjaEJyb3dzZXJTaWRlYmFyTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IE1lc3NhZ2VFdmVudChcIm1lc3NhZ2VcIiwgeyBkYXRhOiBtZXNzYWdlIH0pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlZWRCcm93c2VyU2lkZWJhckxvY2FsU2VydmVycyhjb252ZXJzYXRpb25JZCkge1xuICAgIGlmICghY29udmVyc2F0aW9uSWQgfHwgYnJvd3NlclNpZGViYXJTZWVkZWRMb2NhbFNlcnZlcnMuaGFzKGNvbnZlcnNhdGlvbklkKSkgcmV0dXJuO1xuICAgIGJyb3dzZXJTaWRlYmFyU2VlZGVkTG9jYWxTZXJ2ZXJzLmFkZChjb252ZXJzYXRpb25JZCk7XG4gICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgZGlzcGF0Y2hCcm93c2VyU2lkZWJhck1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBcImJyb3dzZXItc2lkZWJhci1sb2NhbC1zZXJ2ZXJzXCIsXG4gICAgICAgIGNvbnZlcnNhdGlvbklkLFxuICAgICAgICBzdGF0ZTogeyBpc0xvYWRpbmc6IGZhbHNlLCBzZXJ2ZXJzOiBbXSwgaGlkZGVuU2VydmVyczogW10gfSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtZW1iZXJCcm93c2VyU2lkZWJhckhvc3RNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgdHlwZW9mIG1lc3NhZ2UgIT09IFwib2JqZWN0XCIpIHJldHVybjtcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSBcImJyb3dzZXItc2lkZWJhci1zdGF0ZVwiKSB7XG4gICAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IG1lc3NhZ2UuY29udmVyc2F0aW9uSWQ7XG4gICAgICBpZiAoIWNvbnZlcnNhdGlvbklkIHx8ICFtZXNzYWdlLnNuYXBzaG90KSByZXR1cm47XG4gICAgICBicm93c2VyU2lkZWJhclNuYXBzaG90cy5zZXQoYnJvd3NlclNpZGViYXJLZXkoY29udmVyc2F0aW9uSWQsIG1lc3NhZ2UuYnJvd3NlclRhYklkKSwgbWVzc2FnZS5zbmFwc2hvdCk7XG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiYnJvd3Nlci1zaWRlYmFyLWxvY2FsLXNlcnZlcnNcIikge1xuICAgICAgaWYgKG1lc3NhZ2UuY29udmVyc2F0aW9uSWQpIGJyb3dzZXJTaWRlYmFyU2VlZGVkTG9jYWxTZXJ2ZXJzLmFkZChtZXNzYWdlLmNvbnZlcnNhdGlvbklkKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBzbmFwc2hvdFBhdGNoKSB7XG4gICAgaWYgKCFjb252ZXJzYXRpb25JZCkgcmV0dXJuO1xuICAgIGNvbnN0IGtleSA9IGJyb3dzZXJTaWRlYmFyS2V5KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpO1xuICAgIGNvbnN0IHByZXZpb3VzID0gYnJvd3NlclNpZGViYXJTbmFwc2hvdHMuZ2V0KGtleSkgfHwgbWFrZUJyb3dzZXJTaWRlYmFyU25hcHNob3QoXCJcIik7XG4gICAgY29uc3QgbmV4dCA9IHsgLi4ucHJldmlvdXMsIC4uLnNuYXBzaG90UGF0Y2ggfTtcbiAgICBicm93c2VyU2lkZWJhclNuYXBzaG90cy5zZXQoa2V5LCBuZXh0KTtcbiAgICBkaXNwYXRjaEJyb3dzZXJTaWRlYmFyTWVzc2FnZSh7XG4gICAgICB0eXBlOiBcImJyb3dzZXItc2lkZWJhci1zdGF0ZVwiLFxuICAgICAgY29udmVyc2F0aW9uSWQsXG4gICAgICAuLi4oYnJvd3NlclRhYklkID8geyBicm93c2VyVGFiSWQgfSA6IHt9KSxcbiAgICAgIHNuYXBzaG90OiBuZXh0LFxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0QnJvd3NlclNpZGViYXJVcmwoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgdXJsLCBpc0xvYWRpbmcgPSBmYWxzZSkge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcm93c2VyVXJsKHVybCk7XG4gICAgc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgbWFrZUJyb3dzZXJTaWRlYmFyU25hcHNob3Qobm9ybWFsaXplZCwgeyBpc0xvYWRpbmcgfSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluZEJyb3dzZXJTaWRlYmFyRnJhbWUoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCkge1xuICAgIGNvbnN0IHNlbGVjdG9yID0gXCJbZGF0YS1icm93c2VyLXNpZGViYXItY29udmVyc2F0aW9uLWlkPSdcIiArIGNzc0VzY2FwZShjb252ZXJzYXRpb25JZCkgKyBcIiddW2RhdGEtYnJvd3Nlci1zaWRlYmFyLWJyb3dzZXItdGFiLWlkPSdcIiArIGNzc0VzY2FwZShicm93c2VyVGFiSWQgfHwgbGVnYWN5QnJvd3NlclRhYklkKGNvbnZlcnNhdGlvbklkKSkgKyBcIiddXCI7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3NzRXNjYXBlKHZhbHVlKSB7XG4gICAgaWYgKHdpbmRvdy5DU1MgJiYgdHlwZW9mIHdpbmRvdy5DU1MuZXNjYXBlID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiB3aW5kb3cuQ1NTLmVzY2FwZShTdHJpbmcodmFsdWUpKTtcbiAgICByZXR1cm4gU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9bJ1xcXFxcXFxcXS9nLCBcIlxcXFxcXFxcJCZcIik7XG4gIH1cblxuICBmdW5jdGlvbiBoYW5kbGVCcm93c2VyU2lkZWJhclZpZXdNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICBpZiAoIW1lc3NhZ2UgfHwgdHlwZW9mIG1lc3NhZ2UgIT09IFwib2JqZWN0XCIpIHJldHVybjtcbiAgICBpZiAobWVzc2FnZS50eXBlID09PSBcImJyb3dzZXItc2lkZWJhci1zeW5jXCIpIHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSBtZXNzYWdlLnBheWxvYWQgfHwge307XG4gICAgICBzZWVkQnJvd3NlclNpZGViYXJMb2NhbFNlcnZlcnMocGF5bG9hZC5jb252ZXJzYXRpb25JZCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChtZXNzYWdlLnR5cGUgPT09IFwiYnJvd3Nlci1zaWRlYmFyLW93bmVyLXN5bmNcIikge1xuICAgICAgc2VlZEJyb3dzZXJTaWRlYmFyTG9jYWxTZXJ2ZXJzKG1lc3NhZ2UuY29udmVyc2F0aW9uSWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS50eXBlICE9PSBcImJyb3dzZXItc2lkZWJhci1jb21tYW5kXCIpIHJldHVybjtcblxuICAgIGNvbnN0IGNvbnZlcnNhdGlvbklkID0gbWVzc2FnZS5jb252ZXJzYXRpb25JZDtcbiAgICBjb25zdCBicm93c2VyVGFiSWQgPSBtZXNzYWdlLmJyb3dzZXJUYWJJZDtcbiAgICBjb25zdCBjb21tYW5kID0gbWVzc2FnZS5jb21tYW5kIHx8IHt9O1xuICAgIHNlZWRCcm93c2VyU2lkZWJhckxvY2FsU2VydmVycyhjb252ZXJzYXRpb25JZCk7XG5cbiAgICBpZiAoY29tbWFuZC50eXBlID09PSBcIm5hdmlnYXRlXCIpIHtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcm93c2VyVXJsKGNvbW1hbmQudXJsKTtcbiAgICAgIHNldEJyb3dzZXJTaWRlYmFyVXJsKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIG5vcm1hbGl6ZWQsIHRydWUpO1xuICAgICAgcXVldWVNaWNyb3Rhc2soKCkgPT4ge1xuICAgICAgICBjb25zdCBmcmFtZSA9IGZpbmRCcm93c2VyU2lkZWJhckZyYW1lKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpO1xuICAgICAgICBpZiAoIWZyYW1lIHx8ICFub3JtYWxpemVkIHx8IGZyYW1lLmdldFVSTD8uKCkgPT09IG5vcm1hbGl6ZWQpIHJldHVybjtcbiAgICAgICAgZnJhbWUubG9hZFVSTD8uKG5vcm1hbGl6ZWQpO1xuICAgICAgfSk7XG4gICAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiBzZXRCcm93c2VyU2lkZWJhclVybChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBub3JtYWxpemVkLCBmYWxzZSksIDUwMCk7XG4gICAgfSBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IFwicmVsb2FkXCIpIHtcbiAgICAgIGNvbnN0IGZyYW1lID0gZmluZEJyb3dzZXJTaWRlYmFyRnJhbWUoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCk7XG4gICAgICBmcmFtZT8ucmVsb2FkPy4oKTtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBicm93c2VyU2lkZWJhclNuYXBzaG90cy5nZXQoYnJvd3NlclNpZGViYXJLZXkoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCkpO1xuICAgICAgaWYgKGN1cnJlbnQ/LnVybCkge1xuICAgICAgICBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCB7IC4uLmN1cnJlbnQsIGlzTG9hZGluZzogdHJ1ZSB9KTtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgeyAuLi5jdXJyZW50LCBpc0xvYWRpbmc6IGZhbHNlIH0pLCAyNTApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBcImdvLWJhY2tcIikge1xuICAgICAgZmluZEJyb3dzZXJTaWRlYmFyRnJhbWUoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCk/LmdvQmFjaz8uKCk7XG4gICAgfSBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IFwiZ28tZm9yd2FyZFwiKSB7XG4gICAgICBmaW5kQnJvd3NlclNpZGViYXJGcmFtZShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKT8uZ29Gb3J3YXJkPy4oKTtcbiAgICB9IGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJzdG9wXCIpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBicm93c2VyU2lkZWJhclNuYXBzaG90cy5nZXQoYnJvd3NlclNpZGViYXJLZXkoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCkpO1xuICAgICAgaWYgKGN1cnJlbnQpIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIHsgLi4uY3VycmVudCwgaXNMb2FkaW5nOiBmYWxzZSB9KTtcbiAgICB9IGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJyZXNldFwiIHx8IGNvbW1hbmQudHlwZSA9PT0gXCJjbG9zZS10YWJcIikge1xuICAgICAgc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgbWFrZUJyb3dzZXJTaWRlYmFyU25hcHNob3QoXCJcIikpO1xuICAgIH1cbiAgfVxuXG4gIHdpbmRvdy5jb2RleFdpbmRvd1R5cGUgPSBcImVsZWN0cm9uXCI7XG4gIHdpbmRvdy5lbGVjdHJvbkJyaWRnZSA9IHtcbiAgICB3aW5kb3dUeXBlOiBcImVsZWN0cm9uXCIsXG4gICAgc2VuZE1lc3NhZ2VGcm9tVmlldzogKG1lc3NhZ2UpID0+IHtcbiAgICAgIGlmIChtZXNzYWdlICYmIG1lc3NhZ2UudHlwZSA9PT0gXCJzaGFyZWQtb2JqZWN0LXNldFwiKSBzbmFwc2hvdC5zZXQobWVzc2FnZS5rZXksIG1lc3NhZ2UudmFsdWUpO1xuICAgICAgaGFuZGxlQnJvd3NlclNpZGViYXJWaWV3TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgIHJldHVybiBicmlkZ2UoXCJzZW5kTWVzc2FnZUZyb21WaWV3XCIsIFttZXNzYWdlXSk7XG4gICAgfSxcbiAgICBnZXRQYXRoRm9yRmlsZTogKCkgPT4gbnVsbCxcbiAgICBzZW5kV29ya2VyTWVzc2FnZUZyb21WaWV3OiAod29ya2VySWQsIG1lc3NhZ2UpID0+IGJyaWRnZShcInNlbmRXb3JrZXJNZXNzYWdlRnJvbVZpZXdcIiwgW3dvcmtlcklkLCBtZXNzYWdlXSksXG4gICAgc3Vic2NyaWJlVG9Xb3JrZXJNZXNzYWdlczogKHdvcmtlcklkLCBoYW5kbGVyKSA9PiB7XG4gICAgICBsZXQgc3VicyA9IHdvcmtlclN1YnNjcmliZXJzLmdldCh3b3JrZXJJZCk7XG4gICAgICBpZiAoIXN1YnMpIHtcbiAgICAgICAgc3VicyA9IG5ldyBTZXQoKTtcbiAgICAgICAgd29ya2VyU3Vic2NyaWJlcnMuc2V0KHdvcmtlcklkLCBzdWJzKTtcbiAgICAgICAgYnJpZGdlKFwic3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIiwgW3dvcmtlcklkXSkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICB9XG4gICAgICBzdWJzLmFkZChoYW5kbGVyKTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSB3b3JrZXJTdWJzY3JpYmVycy5nZXQod29ya2VySWQpO1xuICAgICAgICBpZiAoIWN1cnJlbnQpIHJldHVybjtcbiAgICAgICAgY3VycmVudC5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgIGlmIChjdXJyZW50LnNpemUgPT09IDApIHtcbiAgICAgICAgICB3b3JrZXJTdWJzY3JpYmVycy5kZWxldGUod29ya2VySWQpO1xuICAgICAgICAgIGJyaWRnZShcInVuc3Vic2NyaWJlV29ya2VyTWVzc2FnZXNcIiwgW3dvcmtlcklkXSkuY2F0Y2goY29uc29sZS5lcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBzaG93Q29udGV4dE1lbnU6IChpdGVtcykgPT4gYnJpZGdlKFwic2hvd0NvbnRleHRNZW51XCIsIFtpdGVtc10pLFxuICAgIHNob3dBcHBsaWNhdGlvbk1lbnU6IChtZW51SWQsIHgsIHkpID0+IGJyaWRnZShcInNob3dBcHBsaWNhdGlvbk1lbnVcIiwgW21lbnVJZCwgeCwgeV0pLFxuICAgIGdldEZhc3RNb2RlUm9sbG91dE1ldHJpY3M6IChwYXJhbXMpID0+IGJyaWRnZShcImdldEZhc3RNb2RlUm9sbG91dE1ldHJpY3NcIiwgW3BhcmFtc10pLFxuICAgIGdldFNoYXJlZE9iamVjdFNuYXBzaG90VmFsdWU6IChrZXkpID0+IHNuYXBzaG90LmdldChrZXkpLFxuICAgIGdldFN5c3RlbVRoZW1lVmFyaWFudDogKCkgPT4gc3lzdGVtVGhlbWVWYXJpYW50LFxuICAgIHN1YnNjcmliZVRvU3lzdGVtVGhlbWVWYXJpYW50OiAoaGFuZGxlcikgPT4ge1xuICAgICAgdGhlbWVTdWJzY3JpYmVycy5hZGQoaGFuZGxlcik7XG4gICAgICByZXR1cm4gKCkgPT4gdGhlbWVTdWJzY3JpYmVycy5kZWxldGUoaGFuZGxlcik7XG4gICAgfSxcbiAgICB0cmlnZ2VyU2VudHJ5VGVzdEVycm9yOiAoKSA9PiBicmlkZ2UoXCJ0cmlnZ2VyU2VudHJ5VGVzdEVycm9yXCIsIFtdKSxcbiAgICBnZXRTZW50cnlJbml0T3B0aW9uczogKCkgPT4gbnVsbCxcbiAgICBnZXRBcHBTZXNzaW9uSWQ6ICgpID0+IG51bGwsXG4gICAgZ2V0QnVpbGRGbGF2b3I6ICgpID0+IGluaXRpYWxTdGF0ZS5idWlsZEZsYXZvcixcbiAgICBpc0ludGVsTWFjQnVpbGQ6ICgpID0+IGluaXRpYWxTdGF0ZS5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIiAmJiBpbml0aWFsU3RhdGUuYXJjaCA9PT0gXCJ4NjRcIixcbiAgICB1c2VzT3dsQXBwU2hlbGw6ICgpID0+IGluaXRpYWxTdGF0ZS51c2VzT3dsQXBwU2hlbGwsXG4gIH07XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5zb3VyY2UgIT09IHdpbmRvdyB8fCAhZXZlbnQuZGF0YSB8fCBldmVudC5kYXRhLnR5cGUgIT09IFwiY29ubmVjdC1hcHAtaG9zdFwiKSByZXR1cm47XG4gICAgY29uc3QgcG9ydCA9IGV2ZW50LmRhdGEucG9ydDtcbiAgICBpZiAoIXBvcnQpIHJldHVybjtcbiAgICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXQobmV3IFVSTChcIi9jb2RleHBwL2Jyb3dzZXItdWkvcnBjXCIsIGxvY2F0aW9uLmhyZWYpKTtcbiAgICB3cy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCAobWVzc2FnZSkgPT4gcG9ydC5wb3N0TWVzc2FnZShtZXNzYWdlLmRhdGEpKTtcbiAgICB3cy5hZGRFdmVudExpc3RlbmVyKFwiY2xvc2VcIiwgKCkgPT4ge1xuICAgICAgdHJ5IHsgcG9ydC5wb3N0TWVzc2FnZShudWxsKTsgfSBjYXRjaCB7fVxuICAgICAgdHJ5IHsgcG9ydC5jbG9zZSgpOyB9IGNhdGNoIHt9XG4gICAgfSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcIm9wZW5cIiwgKCkgPT4ge1xuICAgICAgcG9ydC5vbm1lc3NhZ2UgPSAobWVzc2FnZSkgPT4ge1xuICAgICAgICBpZiAobWVzc2FnZS5kYXRhID09IG51bGwpIHtcbiAgICAgICAgICB3cy5jbG9zZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB3cy5zZW5kKG1lc3NhZ2UuZGF0YSk7XG4gICAgICB9O1xuICAgICAgcG9ydC5zdGFydCAmJiBwb3J0LnN0YXJ0KCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGluc3RhbGxCcm93c2VyVWlXZWJ2aWV3U2hpbSgpIHtcbiAgICBpZiAod2luZG93Ll9fY29kZXhwcFdlYnZpZXdTaGltSW5zdGFsbGVkKSByZXR1cm47XG4gICAgd2luZG93Ll9fY29kZXhwcFdlYnZpZXdTaGltSW5zdGFsbGVkID0gdHJ1ZTtcbiAgICBjb25zdCBvcmlnaW5hbENyZWF0ZUVsZW1lbnQgPSBEb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlRWxlbWVudDtcbiAgICBEb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uKHRhZ05hbWUsIG9wdGlvbnMpIHtcbiAgICAgIGlmIChTdHJpbmcodGFnTmFtZSkudG9Mb3dlckNhc2UoKSAhPT0gXCJ3ZWJ2aWV3XCIpIHtcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsQ3JlYXRlRWxlbWVudC5jYWxsKHRoaXMsIHRhZ05hbWUsIG9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGNyZWF0ZVdlYnZpZXdJZnJhbWUodGhpcyk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZVdlYnZpZXdJZnJhbWUoZG9jKSB7XG4gICAgICBjb25zdCBpZnJhbWUgPSBvcmlnaW5hbENyZWF0ZUVsZW1lbnQuY2FsbChkb2MsIFwiaWZyYW1lXCIpO1xuICAgICAgaWZyYW1lLmRhdGFzZXQuY29kZXhwcFdlYnZpZXdTaGltID0gXCJ0cnVlXCI7XG4gICAgICBpZnJhbWUuc3R5bGUuYm9yZGVyID0gXCIwXCI7XG4gICAgICBpZnJhbWUuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgIGlmcmFtZS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNmZmZcIjtcbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoXCJhbGxvd1wiLCBcImF1dG9wbGF5OyBjbGlwYm9hcmQtcmVhZDsgY2xpcGJvYXJkLXdyaXRlOyBkaXNwbGF5LWNhcHR1cmU7IGZ1bGxzY3JlZW47IG1pY3JvcGhvbmU7IGNhbWVyYVwiKTtcbiAgICAgIGNvbnN0IG5hdGl2ZVNldEF0dHJpYnV0ZSA9IGlmcmFtZS5zZXRBdHRyaWJ1dGUuYmluZChpZnJhbWUpO1xuICAgICAgY29uc3QgbmF0aXZlR2V0QXR0cmlidXRlID0gaWZyYW1lLmdldEF0dHJpYnV0ZS5iaW5kKGlmcmFtZSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWUsIFwidGFnTmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgZ2V0OiAoKSA9PiBcIldFQlZJRVdcIiB9KTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGlmcmFtZSwgXCJub2RlTmFtZVwiLCB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgZ2V0OiAoKSA9PiBcIldFQlZJRVdcIiB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgY29uc3QgZW1pdCA9ICh0eXBlLCBleHRyYSA9IHt9KSA9PiB7XG4gICAgICAgIGNvbnN0IGV2ZW50ID0gbmV3IEV2ZW50KHR5cGUpO1xuICAgICAgICBPYmplY3QuYXNzaWduKGV2ZW50LCBleHRyYSk7XG4gICAgICAgIGlmcmFtZS5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgIH07XG4gICAgICBjb25zdCBjdXJyZW50VXJsID0gKCkgPT4gaWZyYW1lLmRhdGFzZXQuY29kZXhwcFJlcXVlc3RlZFNyYyB8fCBuYXRpdmVHZXRBdHRyaWJ1dGUoXCJzcmNcIikgfHwgXCJhYm91dDpibGFua1wiO1xuICAgICAgY29uc3QgYWN0dWFsRnJhbWVVcmwgPSAodXJsKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RlZCA9IFN0cmluZyh1cmwgfHwgXCJhYm91dDpibGFua1wiKTtcbiAgICAgICAgaWYgKCFzaG91bGRCcmVha1JlY3Vyc2l2ZUZyYW1lTG9hZChyZXF1ZXN0ZWQpKSByZXR1cm4gcmVxdWVzdGVkO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG5leHQgPSBuZXcgVVJMKHJlcXVlc3RlZCwgbG9jYXRpb24uaHJlZik7XG4gICAgICAgICAgbmV4dC5zZWFyY2hQYXJhbXMuc2V0KFwiX19jb2RleHBwX2ZyYW1lX2RlcHRoXCIsIFN0cmluZyhmcmFtZUFuY2VzdG9yRGVwdGgoKSArIDEpKTtcbiAgICAgICAgICByZXR1cm4gbmV4dC5ocmVmO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICByZXR1cm4gcmVxdWVzdGVkO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgY29uc3Qgc2V0RnJhbWVVcmwgPSAodXJsKSA9PiB7XG4gICAgICAgIGNvbnN0IHJlcXVlc3RlZCA9IFN0cmluZyh1cmwgfHwgXCJhYm91dDpibGFua1wiKTtcbiAgICAgICAgaWZyYW1lLmRhdGFzZXQuY29kZXhwcFJlcXVlc3RlZFNyYyA9IHJlcXVlc3RlZDtcbiAgICAgICAgbmF0aXZlU2V0QXR0cmlidXRlKFwic3JjXCIsIGFjdHVhbEZyYW1lVXJsKHJlcXVlc3RlZCkpO1xuICAgICAgfTtcbiAgICAgIGNvbnN0IG5hdmlnYXRlID0gKHVybCkgPT4ge1xuICAgICAgICBjb25zdCBuZXh0ID0gU3RyaW5nKHVybCB8fCBcImFib3V0OmJsYW5rXCIpO1xuICAgICAgICBlbWl0KFwiZGlkLXN0YXJ0LWxvYWRpbmdcIiwgeyB1cmw6IG5leHQgfSk7XG4gICAgICAgIHNldEZyYW1lVXJsKG5leHQpO1xuICAgICAgfTtcblxuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSA9IChuYW1lLCB2YWx1ZSkgPT4ge1xuICAgICAgICBpZiAoU3RyaW5nKG5hbWUpLnRvTG93ZXJDYXNlKCkgPT09IFwic3JjXCIpIHtcbiAgICAgICAgICBzZXRGcmFtZVVybCh2YWx1ZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG5hdGl2ZVNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaWZyYW1lLCBcInNyY1wiLCB7XG4gICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgIGdldDogKCkgPT4gY3VycmVudFVybCgpLFxuICAgICAgICAgIHNldDogKHZhbHVlKSA9PiBzZXRGcmFtZVVybCh2YWx1ZSksXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBpZnJhbWUuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCB1cmwgPSBjdXJyZW50VXJsKCk7XG4gICAgICAgIGVtaXQoXCJkb20tcmVhZHlcIiwgeyB1cmwgfSk7XG4gICAgICAgIGVtaXQoXCJkaWQtbmF2aWdhdGVcIiwgeyB1cmwgfSk7XG4gICAgICAgIGVtaXQoXCJkaWQtc3RvcC1sb2FkaW5nXCIsIHsgdXJsIH0pO1xuICAgICAgICBlbWl0KFwiZGlkLWZpbmlzaC1sb2FkXCIsIHsgdXJsIH0pO1xuICAgICAgICBsZXQgdGl0bGUgPSBcIlwiO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRpdGxlID0gaWZyYW1lLmNvbnRlbnREb2N1bWVudD8udGl0bGUgfHwgXCJcIjtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IGlmcmFtZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWJyb3dzZXItc2lkZWJhci1jb252ZXJzYXRpb24taWRcIik7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJUYWJJZCA9IGlmcmFtZS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWJyb3dzZXItc2lkZWJhci1icm93c2VyLXRhYi1pZFwiKTtcbiAgICAgICAgaWYgKGNvbnZlcnNhdGlvbklkKSB7XG4gICAgICAgICAgc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgbWFrZUJyb3dzZXJTaWRlYmFyU25hcHNob3QodXJsLCB7XG4gICAgICAgICAgICB0aXRsZTogdGl0bGUgfHwgYnJvd3NlclRpdGxlRm9yVXJsKHVybCksXG4gICAgICAgICAgICBpc0xvYWRpbmc6IGZhbHNlLFxuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGl0bGUpIGVtaXQoXCJwYWdlLXRpdGxlLXVwZGF0ZWRcIiwgeyB0aXRsZSB9KTtcbiAgICAgIH0pO1xuICAgICAgaWZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoKSA9PiB7XG4gICAgICAgIGVtaXQoXCJkaWQtZmFpbC1sb2FkXCIsIHsgZXJyb3JDb2RlOiAtMiwgZXJyb3JEZXNjcmlwdGlvbjogXCJpZnJhbWUgbG9hZCBmYWlsZWRcIiwgdmFsaWRhdGVkVVJMOiBjdXJyZW50VXJsKCkgfSk7XG4gICAgICAgIGVtaXQoXCJkaWQtc3RvcC1sb2FkaW5nXCIsIHsgdXJsOiBjdXJyZW50VXJsKCkgfSk7XG4gICAgICB9KTtcblxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoaWZyYW1lLCB7XG4gICAgICAgIGRlc3Ryb3k6IHsgdmFsdWU6ICgpID0+IGlmcmFtZS5yZW1vdmUoKSB9LFxuICAgICAgICBnZXRVUkw6IHsgdmFsdWU6ICgpID0+IGN1cnJlbnRVcmwoKSB9LFxuICAgICAgICBnZXRUaXRsZToge1xuICAgICAgICAgIHZhbHVlOiAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICByZXR1cm4gaWZyYW1lLmNvbnRlbnREb2N1bWVudD8udGl0bGUgfHwgXCJcIjtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBsb2FkVVJMOiB7IHZhbHVlOiAodXJsKSA9PiB7IG5hdmlnYXRlKHVybCk7IHJldHVybiBQcm9taXNlLnJlc29sdmUoKTsgfSB9LFxuICAgICAgICByZWxvYWQ6IHtcbiAgICAgICAgICB2YWx1ZTogKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3c/LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIG5hdmlnYXRlKGN1cnJlbnRVcmwoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogeyB2YWx1ZTogKCkgPT4ge30gfSxcbiAgICAgICAgY2FuR29CYWNrOiB7IHZhbHVlOiAoKSA9PiBmYWxzZSB9LFxuICAgICAgICBjYW5Hb0ZvcndhcmQ6IHsgdmFsdWU6ICgpID0+IGZhbHNlIH0sXG4gICAgICAgIGdvQmFjazoge1xuICAgICAgICAgIHZhbHVlOiAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdz8uaGlzdG9yeS5iYWNrKCk7XG4gICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgZ29Gb3J3YXJkOiB7XG4gICAgICAgICAgdmFsdWU6ICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93Py5oaXN0b3J5LmZvcndhcmQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBleGVjdXRlSmF2YVNjcmlwdDoge1xuICAgICAgICAgIHZhbHVlOiAoY29kZSkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShpZnJhbWUuY29udGVudFdpbmRvdz8uZXZhbChTdHJpbmcoY29kZSkpKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgaW5zZXJ0Q1NTOiB7IHZhbHVlOiAoKSA9PiBQcm9taXNlLnJlc29sdmUoXCJcIikgfSxcbiAgICAgICAgb3BlbkRldlRvb2xzOiB7IHZhbHVlOiAoKSA9PiB7fSB9LFxuICAgICAgICBjbG9zZURldlRvb2xzOiB7IHZhbHVlOiAoKSA9PiB7fSB9LFxuICAgICAgICBpc0RldlRvb2xzT3BlbmVkOiB7IHZhbHVlOiAoKSA9PiBmYWxzZSB9LFxuICAgICAgICBzZW5kOiB7IHZhbHVlOiAoKSA9PiB7fSB9LFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiBpZnJhbWU7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZnJhbWVBbmNlc3RvckRlcHRoKCkge1xuICAgICAgbGV0IGRlcHRoID0gMDtcbiAgICAgIGxldCBjdXJyZW50ID0gd2luZG93O1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICAgIHdoaWxlIChjdXJyZW50ICYmICFzZWVuLmhhcyhjdXJyZW50KSkge1xuICAgICAgICBzZWVuLmFkZChjdXJyZW50KTtcbiAgICAgICAgbGV0IHBhcmVudDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwYXJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhcmVudCA9PT0gY3VycmVudCkgYnJlYWs7XG4gICAgICAgIGRlcHRoICs9IDE7XG4gICAgICAgIGN1cnJlbnQgPSBwYXJlbnQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZGVwdGg7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvdWxkQnJlYWtSZWN1cnNpdmVGcmFtZUxvYWQodXJsKSB7XG4gICAgICBsZXQgdGFyZ2V0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGFyZ2V0ID0gbmV3IFVSTCh1cmwsIGxvY2F0aW9uLmhyZWYpLmhyZWY7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IGN1cnJlbnQgPSB3aW5kb3c7XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldCgpO1xuICAgICAgd2hpbGUgKGN1cnJlbnQgJiYgIXNlZW4uaGFzKGN1cnJlbnQpKSB7XG4gICAgICAgIHNlZW4uYWRkKGN1cnJlbnQpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChuZXcgVVJMKGN1cnJlbnQubG9jYXRpb24uaHJlZikuaHJlZiA9PT0gdGFyZ2V0KSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICBpZiAoY3VycmVudC5wYXJlbnQgPT09IGN1cnJlbnQpIGJyZWFrO1xuICAgICAgICAgIGN1cnJlbnQgPSBjdXJyZW50LnBhcmVudDtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59KSgpO1xuYDtcbn1cblxuZnVuY3Rpb24gaGlkZVZpc2libGVDb2RleFdpbmRvd3MoKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiKSB7XG4gICAgdHJ5IHtcbiAgICAgIGFwcC5oaWRlKCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIGZvciAoY29uc3Qgd2luIG9mIEJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpKSB7XG4gICAgaWYgKHdpbi5pc0Rlc3Ryb3llZCgpKSBjb250aW51ZTtcbiAgICBpZiAoYWN0aXZlSG9zdCAmJiB3aW4ud2ViQ29udGVudHMuaWQgPT09IGFjdGl2ZUhvc3Qud2ViQ29udGVudHMuaWQpIGNvbnRpbnVlO1xuICAgIGlmICghd2luLmlzVmlzaWJsZSgpKSBjb250aW51ZTtcbiAgICB0cnkge1xuICAgICAgd2luLmhpZGUoKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVdpbmRvd0xpa2VGb3JWaWV3KHZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3KTogQ29kZXhXaW5kb3dMaWtlIHtcbiAgY29uc3Qgdmlld0JvdW5kcyA9ICgpID0+IHZpZXcuZ2V0Qm91bmRzKCk7XG4gIHJldHVybiB7XG4gICAgaWQ6IHZpZXcud2ViQ29udGVudHMuaWQsXG4gICAgd2ViQ29udGVudHM6IHZpZXcud2ViQ29udGVudHMsXG4gICAgb246IChldmVudDogXCJjbG9zZWRcIiwgbGlzdGVuZXI6ICgpID0+IHZvaWQpID0+IHtcbiAgICAgIGlmIChldmVudCA9PT0gXCJjbG9zZWRcIikgdmlldy53ZWJDb250ZW50cy5vbmNlKFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIGVsc2Ugdmlldy53ZWJDb250ZW50cy5vbihldmVudCwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBvbmNlOiAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHZpZXcud2ViQ29udGVudHMub25jZShldmVudCBhcyBcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIG9mZjogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLm9mZihldmVudCBhcyBcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICByZXR1cm4gdmlldztcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiAoZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpID0+IHtcbiAgICAgIHZpZXcud2ViQ29udGVudHMucmVtb3ZlTGlzdGVuZXIoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBpc0Rlc3Ryb3llZDogKCkgPT4gdmlldy53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpLFxuICAgIGlzRm9jdXNlZDogKCkgPT4gdmlldy53ZWJDb250ZW50cy5pc0ZvY3VzZWQoKSxcbiAgICBmb2N1czogKCkgPT4gdmlldy53ZWJDb250ZW50cy5mb2N1cygpLFxuICAgIHNob3c6ICgpID0+IHt9LFxuICAgIGhpZGU6ICgpID0+IHt9LFxuICAgIGdldEJvdW5kczogdmlld0JvdW5kcyxcbiAgICBnZXRDb250ZW50Qm91bmRzOiB2aWV3Qm91bmRzLFxuICAgIGdldFNpemU6ICgpID0+IHtcbiAgICAgIGNvbnN0IGIgPSB2aWV3Qm91bmRzKCk7XG4gICAgICByZXR1cm4gW2Iud2lkdGgsIGIuaGVpZ2h0XTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTaXplOiAoKSA9PiB7XG4gICAgICBjb25zdCBiID0gdmlld0JvdW5kcygpO1xuICAgICAgcmV0dXJuIFtiLndpZHRoLCBiLmhlaWdodF07XG4gICAgfSxcbiAgICBzZXRUaXRsZTogKCkgPT4ge30sXG4gICAgZ2V0VGl0bGU6ICgpID0+IFwiXCIsXG4gICAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZTogKCkgPT4ge30sXG4gICAgc2V0RG9jdW1lbnRFZGl0ZWQ6ICgpID0+IHt9LFxuICAgIHNldFdpbmRvd0J1dHRvblZpc2liaWxpdHk6ICgpID0+IHt9LFxuICB9O1xufVxuXG5mdW5jdGlvbiBhY2NlcHRXZWJTb2NrZXQocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHNvY2tldDogU29ja2V0LCBoZWFkOiBCdWZmZXIpOiBXZWJTb2NrZXRDb25uZWN0aW9uIHtcbiAgY29uc3Qga2V5ID0gcmVxLmhlYWRlcnNbXCJzZWMtd2Vic29ja2V0LWtleVwiXTtcbiAgaWYgKHR5cGVvZiBrZXkgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBFcnJvcihcIm1pc3NpbmcgU2VjLVdlYlNvY2tldC1LZXlcIik7XG4gIGNvbnN0IGFjY2VwdCA9IGNyZWF0ZUhhc2goXCJzaGExXCIpXG4gICAgLnVwZGF0ZShgJHtrZXl9MjU4RUFGQTUtRTkxNC00N0RBLTk1Q0EtQzVBQjBEQzg1QjExYClcbiAgICAuZGlnZXN0KFwiYmFzZTY0XCIpO1xuICBzb2NrZXQud3JpdGUoXG4gICAgW1xuICAgICAgXCJIVFRQLzEuMSAxMDEgU3dpdGNoaW5nIFByb3RvY29sc1wiLFxuICAgICAgXCJVcGdyYWRlOiB3ZWJzb2NrZXRcIixcbiAgICAgIFwiQ29ubmVjdGlvbjogVXBncmFkZVwiLFxuICAgICAgYFNlYy1XZWJTb2NrZXQtQWNjZXB0OiAke2FjY2VwdH1gLFxuICAgICAgXCJcXHJcXG5cIixcbiAgICBdLmpvaW4oXCJcXHJcXG5cIiksXG4gICk7XG4gIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldENvbm5lY3Rpb24oc29ja2V0KTtcbiAgaWYgKGhlYWQubGVuZ3RoID4gMCkgd3MuYWNjZXB0SGVhZChoZWFkKTtcbiAgcmV0dXJuIHdzO1xufVxuXG5jbGFzcyBXZWJTb2NrZXRDb25uZWN0aW9uIHtcbiAgcHJpdmF0ZSBidWZmZXIgPSBCdWZmZXIuYWxsb2MoMCk7XG4gIHByaXZhdGUgdGV4dEhhbmRsZXJzID0gbmV3IFNldDwodGV4dDogc3RyaW5nKSA9PiB2b2lkPigpO1xuICBwcml2YXRlIGNsb3NlSGFuZGxlcnMgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG4gIHByaXZhdGUgY2xvc2VkID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBzb2NrZXQ6IFNvY2tldCkge1xuICAgIHNvY2tldC5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB0aGlzLmFjY2VwdEhlYWQoY2h1bmspKTtcbiAgICBzb2NrZXQub24oXCJjbG9zZVwiLCAoKSA9PiB0aGlzLmVtaXRDbG9zZSgpKTtcbiAgICBzb2NrZXQub24oXCJlcnJvclwiLCAoKSA9PiB0aGlzLmVtaXRDbG9zZSgpKTtcbiAgfVxuXG4gIGFjY2VwdEhlYWQoY2h1bms6IEJ1ZmZlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLmNsb3NlZCkgcmV0dXJuO1xuICAgIHRoaXMuYnVmZmVyID0gQnVmZmVyLmNvbmNhdChbdGhpcy5idWZmZXIsIGNodW5rXSk7XG4gICAgdGhpcy5yZWFkRnJhbWVzKCk7XG4gIH1cblxuICBvblRleHQoaGFuZGxlcjogKHRleHQ6IHN0cmluZykgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMudGV4dEhhbmRsZXJzLmFkZChoYW5kbGVyKTtcbiAgfVxuXG4gIG9uQ2xvc2UoaGFuZGxlcjogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIHRoaXMuY2xvc2VIYW5kbGVycy5hZGQoaGFuZGxlcik7XG4gIH1cblxuICBzZW5kSnNvbihwYXlsb2FkOiB1bmtub3duKTogdm9pZCB7XG4gICAgdGhpcy5zZW5kVGV4dChKU09OLnN0cmluZ2lmeShwYXlsb2FkKSk7XG4gIH1cblxuICBzZW5kVGV4dCh0ZXh0OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNlbmRGcmFtZSgweDEsIEJ1ZmZlci5mcm9tKHRleHQsIFwidXRmOFwiKSk7XG4gIH1cblxuICBjbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5zZW5kRnJhbWUoMHg4LCBCdWZmZXIuYWxsb2MoMCkpO1xuICAgIH0gY2F0Y2gge31cbiAgICB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgdGhpcy5zb2NrZXQuZW5kKCk7XG4gICAgdGhpcy5lbWl0Q2xvc2UoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZEZyYW1lcygpOiB2b2lkIHtcbiAgICB3aGlsZSAodGhpcy5idWZmZXIubGVuZ3RoID49IDIpIHtcbiAgICAgIGNvbnN0IGZpcnN0ID0gdGhpcy5idWZmZXJbMF0hO1xuICAgICAgY29uc3Qgc2Vjb25kID0gdGhpcy5idWZmZXJbMV0hO1xuICAgICAgY29uc3Qgb3Bjb2RlID0gZmlyc3QgJiAweDBmO1xuICAgICAgY29uc3QgbWFza2VkID0gKHNlY29uZCAmIDB4ODApICE9PSAwO1xuICAgICAgbGV0IGxlbmd0aCA9IHNlY29uZCAmIDB4N2Y7XG4gICAgICBsZXQgb2Zmc2V0ID0gMjtcbiAgICAgIGlmIChsZW5ndGggPT09IDEyNikge1xuICAgICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgb2Zmc2V0ICsgMikgcmV0dXJuO1xuICAgICAgICBsZW5ndGggPSB0aGlzLmJ1ZmZlci5yZWFkVUludDE2QkUob2Zmc2V0KTtcbiAgICAgICAgb2Zmc2V0ICs9IDI7XG4gICAgICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gMTI3KSB7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBvZmZzZXQgKyA4KSByZXR1cm47XG4gICAgICAgIGNvbnN0IGhpZ2ggPSB0aGlzLmJ1ZmZlci5yZWFkVUludDMyQkUob2Zmc2V0KTtcbiAgICAgICAgY29uc3QgbG93ID0gdGhpcy5idWZmZXIucmVhZFVJbnQzMkJFKG9mZnNldCArIDQpO1xuICAgICAgICBpZiAoaGlnaCAhPT0gMCkge1xuICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGVuZ3RoID0gbG93O1xuICAgICAgICBvZmZzZXQgKz0gODtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1hc2tPZmZzZXQgPSBvZmZzZXQ7XG4gICAgICBpZiAobWFza2VkKSBvZmZzZXQgKz0gNDtcbiAgICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBvZmZzZXQgKyBsZW5ndGgpIHJldHVybjtcblxuICAgICAgY29uc3QgbWFzayA9IG1hc2tlZCA/IHRoaXMuYnVmZmVyLnN1YmFycmF5KG1hc2tPZmZzZXQsIG1hc2tPZmZzZXQgKyA0KSA6IG51bGw7XG4gICAgICBjb25zdCBwYXlsb2FkID0gQnVmZmVyLmZyb20odGhpcy5idWZmZXIuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGgpKTtcbiAgICAgIHRoaXMuYnVmZmVyID0gdGhpcy5idWZmZXIuc3ViYXJyYXkob2Zmc2V0ICsgbGVuZ3RoKTtcbiAgICAgIGlmIChtYXNrKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF5bG9hZC5sZW5ndGg7IGkgKz0gMSkgcGF5bG9hZFtpXSBePSBtYXNrW2kgJSA0XSE7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcGNvZGUgPT09IDB4OCkge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICB9IGVsc2UgaWYgKG9wY29kZSA9PT0gMHg5KSB7XG4gICAgICAgIHRoaXMuc2VuZEZyYW1lKDB4QSwgcGF5bG9hZCk7XG4gICAgICB9IGVsc2UgaWYgKG9wY29kZSA9PT0gMHgxKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSBwYXlsb2FkLnRvU3RyaW5nKFwidXRmOFwiKTtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIFsuLi50aGlzLnRleHRIYW5kbGVyc10pIGhhbmRsZXIodGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZW5kRnJhbWUob3Bjb2RlOiBudW1iZXIsIHBheWxvYWQ6IEJ1ZmZlcik6IHZvaWQge1xuICAgIGlmICh0aGlzLmNsb3NlZCAmJiBvcGNvZGUgIT09IDB4OCkgcmV0dXJuO1xuICAgIGNvbnN0IGxlbmd0aCA9IHBheWxvYWQubGVuZ3RoO1xuICAgIGxldCBoZWFkZXI6IEJ1ZmZlcjtcbiAgICBpZiAobGVuZ3RoIDwgMTI2KSB7XG4gICAgICBoZWFkZXIgPSBCdWZmZXIuZnJvbShbMHg4MCB8IG9wY29kZSwgbGVuZ3RoXSk7XG4gICAgfSBlbHNlIGlmIChsZW5ndGggPD0gMHhmZmZmKSB7XG4gICAgICBoZWFkZXIgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgICBoZWFkZXJbMF0gPSAweDgwIHwgb3Bjb2RlO1xuICAgICAgaGVhZGVyWzFdID0gMTI2O1xuICAgICAgaGVhZGVyLndyaXRlVUludDE2QkUobGVuZ3RoLCAyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVhZGVyID0gQnVmZmVyLmFsbG9jKDEwKTtcbiAgICAgIGhlYWRlclswXSA9IDB4ODAgfCBvcGNvZGU7XG4gICAgICBoZWFkZXJbMV0gPSAxMjc7XG4gICAgICBoZWFkZXIud3JpdGVVSW50MzJCRSgwLCAyKTtcbiAgICAgIGhlYWRlci53cml0ZVVJbnQzMkJFKGxlbmd0aCwgNik7XG4gICAgfVxuICAgIHRoaXMuc29ja2V0LndyaXRlKEJ1ZmZlci5jb25jYXQoW2hlYWRlciwgcGF5bG9hZF0pKTtcbiAgfVxuXG4gIHByaXZhdGUgZW1pdENsb3NlKCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5jbG9zZWQpIHRoaXMuY2xvc2VkID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgWy4uLnRoaXMuY2xvc2VIYW5kbGVyc10pIGhhbmRsZXIoKTtcbiAgICB0aGlzLmNsb3NlSGFuZGxlcnMuY2xlYXIoKTtcbiAgICB0aGlzLnRleHRIYW5kbGVycy5jbGVhcigpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlcXVlc3RVcmwocmVxOiBJbmNvbWluZ01lc3NhZ2UpOiBVUkwgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gbmV3IFVSTChyZXEudXJsID8/IFwiL1wiLCBcImh0dHA6Ly8xMjcuMC4wLjFcIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlYWRKc29uQm9keShyZXE6IEluY29taW5nTWVzc2FnZSk6IFByb21pc2U8dW5rbm93bj4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIHRvdGFsICs9IGNodW5rLmxlbmd0aDtcbiAgICAgIGlmICh0b3RhbCA+IDEwMjQgKiAxMDI0KSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJyZXF1ZXN0IGJvZHkgdG9vIGxhcmdlXCIpKTtcbiAgICAgICAgcmVxLmRlc3Ryb3koKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgIH0pO1xuICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCByYXcgPSBCdWZmZXIuY29uY2F0KGNodW5rcykudG9TdHJpbmcoXCJ1dGY4XCIpO1xuICAgICAgaWYgKCFyYXcpIHtcbiAgICAgICAgcmVzb2x2ZShudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHJhdykpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXEub24oXCJlcnJvclwiLCByZWplY3QpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZEpzb24ocmVzOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHVua25vd24pOiB2b2lkIHtcbiAgc2VuZEJ1ZmZlcihyZXMsIHN0YXR1cywgQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkoYm9keSkpLCBNSU1FX1RZUEVTW1wiLmpzb25cIl0sIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gc2VuZFRleHQocmVzOiBTZXJ2ZXJSZXNwb25zZSwgc3RhdHVzOiBudW1iZXIsIGJvZHk6IHN0cmluZywgY29udGVudFR5cGU6IHN0cmluZyk6IHZvaWQge1xuICBzZW5kQnVmZmVyKHJlcywgc3RhdHVzLCBCdWZmZXIuZnJvbShib2R5KSwgY29udGVudFR5cGUsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gc2VuZEJ1ZmZlcihcbiAgcmVzOiBTZXJ2ZXJSZXNwb25zZSxcbiAgc3RhdHVzOiBudW1iZXIsXG4gIGJvZHk6IEJ1ZmZlcixcbiAgY29udGVudFR5cGU6IHN0cmluZyxcbiAgaGVhZE9ubHk6IGJvb2xlYW4sXG4pOiB2b2lkIHtcbiAgcmVzLndyaXRlSGVhZChzdGF0dXMsIHtcbiAgICBcImNvbnRlbnQtdHlwZVwiOiBjb250ZW50VHlwZSxcbiAgICBcImNvbnRlbnQtbGVuZ3RoXCI6IGJvZHkubGVuZ3RoLFxuICAgIFwiY2FjaGUtY29udHJvbFwiOiBcIm5vLXN0b3JlXCIsXG4gIH0pO1xuICBpZiAoaGVhZE9ubHkpIHJlcy5lbmQoKTtcbiAgZWxzZSByZXMuZW5kKGJvZHkpO1xufVxuXG5mdW5jdGlvbiB3ZWJ2aWV3Um9vdCgpOiBzdHJpbmcge1xuICByZXR1cm4gam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsIFwiYXBwLmFzYXJcIiwgXCJ3ZWJ2aWV3XCIpO1xufVxuXG5mdW5jdGlvbiB3ZWJ2aWV3RmlsZShwYXRobmFtZTogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNsZWFuUGF0aCA9IGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkucmVwbGFjZSgvXlxcLysvLCBcIlwiKTtcbiAgaWYgKCFjbGVhblBhdGggfHwgY2xlYW5QYXRoLmluY2x1ZGVzKFwiXFwwXCIpKSByZXR1cm4gbnVsbDtcbiAgY29uc3Qgcm9vdCA9IHdlYnZpZXdSb290KCk7XG4gIGNvbnN0IGZpbGUgPSBub3JtYWxpemUoam9pbihyb290LCBjbGVhblBhdGgpKTtcbiAgY29uc3QgcmVsID0gcmVsYXRpdmUocm9vdCwgZmlsZSk7XG4gIGlmIChyZWwuc3RhcnRzV2l0aChcIi4uXCIpIHx8IHJlbCA9PT0gXCJcIikgcmV0dXJuIG51bGw7XG4gIGlmICghZXhpc3RzU3luYyhmaWxlKSB8fCAhc3RhdFN5bmMoZmlsZSkuaXNGaWxlKCkpIHJldHVybiBudWxsO1xuICByZXR1cm4gZmlsZTtcbn1cblxuZnVuY3Rpb24gbWltZVR5cGUoZmlsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgZG90ID0gZmlsZS5sYXN0SW5kZXhPZihcIi5cIik7XG4gIGNvbnN0IGV4dCA9IGRvdCA+PSAwID8gZmlsZS5zbGljZShkb3QpLnRvTG93ZXJDYXNlKCkgOiBcIlwiO1xuICByZXR1cm4gTUlNRV9UWVBFU1tleHRdID8/IFwiYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtXCI7XG59XG5cbmZ1bmN0aW9uIHJlcXVpcmVPcHRpb25zKCk6IEJyb3dzZXJVaVNlcnZlck9wdGlvbnMge1xuICBpZiAoIWFjdGl2ZU9wdGlvbnMpIHRocm93IG5ldyBFcnJvcihcIkNvZGV4KysgYnJvd3NlciBVSSBzZXJ2ZXIgaXMgbm90IGNvbmZpZ3VyZWRcIik7XG4gIHJldHVybiBhY3RpdmVPcHRpb25zO1xufVxuXG5mdW5jdGlvbiBpc0Jyb3dzZXJVaUhvc3RTZW5kZXIoc2VuZGVyOiBFbGVjdHJvbi5XZWJDb250ZW50cyk6IGJvb2xlYW4ge1xuICByZXR1cm4gISFhY3RpdmVIb3N0ICYmICFhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmlzRGVzdHJveWVkKCkgJiYgc2VuZGVyLmlkID09PSBhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmlkO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRCcmlkZ2VNZXRob2QobWV0aG9kOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKCEvXlthLXpBLVowLTkuXzotXSskLy50ZXN0KG1ldGhvZCkpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYnJpZGdlIG1ldGhvZFwiKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQb3J0KHZhbHVlOiBzdHJpbmcgfCB1bmRlZmluZWQsIGZhbGxiYWNrOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBwYXJzZWQgPSBOdW1iZXIodmFsdWUpO1xuICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcihwYXJzZWQpICYmIHBhcnNlZCA+IDAgJiYgcGFyc2VkIDw9IDY1NTM1ID8gcGFyc2VkIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGFzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IDogbnVsbDtcbn1cblxuZnVuY3Rpb24gYXNQbGFpbk9iamVjdCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHtcbiAgY29uc3QgcmVjb3JkID0gYXNSZWNvcmQodmFsdWUpO1xuICByZXR1cm4gcmVjb3JkICYmICFBcnJheS5pc0FycmF5KHJlY29yZCkgPyByZWNvcmQgOiB7fTtcbn1cblxuZnVuY3Rpb24gY3VycmVudFN5c3RlbVRoZW1lVmFyaWFudCgpOiBzdHJpbmcge1xuICByZXR1cm4gbmF0aXZlVGhlbWUuc2hvdWxkVXNlRGFya0NvbG9ycyA/IFwiZGFya1wiIDogXCJsaWdodFwiO1xufVxuXG5mdW5jdGlvbiBzYWZlSnNvbih2YWx1ZTogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvPC9nLCBcIlxcXFx1MDAzY1wiKTtcbn1cblxuZnVuY3Rpb24gZGVsYXkobXM6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKTtcbn1cbiIsICJleHBvcnQgY29uc3QgVkVSU0lPTl9SRSA9IC9edj8oXFxkKylcXC4oXFxkKylcXC4oXFxkKykoPzpbLStdLiopPyQvO1xuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplVmVyc2lvbih2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9edi9pLCBcIlwiKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVWZXJzaW9ucyhhOiBzdHJpbmcsIGI6IHN0cmluZyk6IG51bWJlciB7XG4gIGNvbnN0IGF2ID0gVkVSU0lPTl9SRS5leGVjKGEpO1xuICBjb25zdCBidiA9IFZFUlNJT05fUkUuZXhlYyhiKTtcbiAgaWYgKCFhdiB8fCAhYnYpIHJldHVybiAwO1xuICBmb3IgKGxldCBpID0gMTsgaSA8PSAzOyBpKyspIHtcbiAgICBjb25zdCBkaWZmID0gTnVtYmVyKGF2W2ldKSAtIE51bWJlcihidltpXSk7XG4gICAgaWYgKGRpZmYgIT09IDApIHJldHVybiBkaWZmO1xuICB9XG4gIHJldHVybiAwO1xufVxuIiwgImltcG9ydCB0eXBlIHsgVHdlYWtTdG9yZUVudHJ5LCBUd2Vha1N0b3JlUGxhdGZvcm0gfSBmcm9tIFwiLi90d2Vhay1zdG9yZVwiO1xuaW1wb3J0IHsgY29tcGFyZVZlcnNpb25zLCBub3JtYWxpemVWZXJzaW9uLCBWRVJTSU9OX1JFIH0gZnJvbSBcIi4vdmVyc2lvbi11dGlsc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkge1xuICBjdXJyZW50OiBOb2RlSlMuUGxhdGZvcm07XG4gIHN1cHBvcnRlZDogVHdlYWtTdG9yZVBsYXRmb3JtW10gfCBudWxsO1xuICBjb21wYXRpYmxlOiBib29sZWFuO1xuICByZWFzb246IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmlsaXR5IHtcbiAgY3VycmVudDogc3RyaW5nO1xuICByZXF1aXJlZDogc3RyaW5nIHwgbnVsbDtcbiAgY29tcGF0aWJsZTogYm9vbGVhbjtcbiAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJpbGl0eShcbiAgZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSxcbiAgY3VycmVudFBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybSBhcyBUd2Vha1N0b3JlUGxhdGZvcm0sXG4pOiBTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmlsaXR5IHtcbiAgY29uc3Qgc3VwcG9ydGVkID0gZW50cnkucGxhdGZvcm1zID8/IG51bGw7XG4gIGNvbnN0IGNvbXBhdGlibGUgPSAhc3VwcG9ydGVkIHx8IHN1cHBvcnRlZC5pbmNsdWRlcyhjdXJyZW50UGxhdGZvcm0pO1xuICByZXR1cm4ge1xuICAgIGN1cnJlbnQ6IGN1cnJlbnRQbGF0Zm9ybSxcbiAgICBzdXBwb3J0ZWQsXG4gICAgY29tcGF0aWJsZSxcbiAgICByZWFzb246IGNvbXBhdGlibGUgPyBudWxsIDogYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gaXMgb25seSBhdmFpbGFibGUgb24gJHtmb3JtYXRTdG9yZVBsYXRmb3JtcyhzdXBwb3J0ZWQpfS5gLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJsZShlbnRyeTogVHdlYWtTdG9yZUVudHJ5KTogdm9pZCB7XG4gIGNvbnN0IHBsYXRmb3JtID0gc3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJpbGl0eShlbnRyeSk7XG4gIGlmICghcGxhdGZvcm0uY29tcGF0aWJsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihwbGF0Zm9ybS5yZWFzb24gPz8gYCR7ZW50cnkubWFuaWZlc3QubmFtZX0gaXMgbm90IGF2YWlsYWJsZSBvbiB0aGlzIHBsYXRmb3JtLmApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUVudHJ5UnVudGltZUNvbXBhdGliaWxpdHkoXG4gIGVudHJ5OiBUd2Vha1N0b3JlRW50cnksXG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4pOiBTdG9yZUVudHJ5UnVudGltZUNvbXBhdGliaWxpdHkge1xuICBjb25zdCByZXF1aXJlZCA9IGNsZWFuTWluUnVudGltZShlbnRyeS5tYW5pZmVzdC5taW5SdW50aW1lKTtcbiAgY29uc3QgY29tcGF0aWJsZSA9ICFyZXF1aXJlZCB8fCBjb21wYXJlVmVyc2lvbnMoY3VycmVudFZlcnNpb24sIHJlcXVpcmVkKSA+PSAwO1xuICByZXR1cm4ge1xuICAgIGN1cnJlbnQ6IGN1cnJlbnRWZXJzaW9uLFxuICAgIHJlcXVpcmVkLFxuICAgIGNvbXBhdGlibGUsXG4gICAgcmVhc29uOiBjb21wYXRpYmxlIHx8ICFyZXF1aXJlZFxuICAgICAgPyBudWxsXG4gICAgICA6IGAke2VudHJ5Lm1hbmlmZXN0Lm5hbWV9IHJlcXVpcmVzIENvZGV4KysgJHtyZXF1aXJlZH0gb3IgbmV3ZXIuYCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJsZShcbiAgZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSxcbiAgY3VycmVudFZlcnNpb246IHN0cmluZyxcbik6IHZvaWQge1xuICBjb25zdCBydW50aW1lID0gc3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmlsaXR5KGVudHJ5LCBjdXJyZW50VmVyc2lvbik7XG4gIGlmICghcnVudGltZS5jb21wYXRpYmxlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKHJ1bnRpbWUucmVhc29uID8/IGAke2VudHJ5Lm1hbmlmZXN0Lm5hbWV9IHJlcXVpcmVzIGEgbmV3ZXIgQ29kZXgrKyBydW50aW1lLmApO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhbk1pblJ1bnRpbWUodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCBudWxsIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHZlcnNpb24gPSBub3JtYWxpemVWZXJzaW9uKHZhbHVlLnJlcGxhY2UoL14+PT9cXHMqLywgXCJcIikpO1xuICByZXR1cm4gVkVSU0lPTl9SRS50ZXN0KHZlcnNpb24pID8gdmVyc2lvbiA6IG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRTdG9yZVBsYXRmb3JtcyhwbGF0Zm9ybXM6IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdIHwgbnVsbCk6IHN0cmluZyB7XG4gIGlmICghcGxhdGZvcm1zIHx8IHBsYXRmb3Jtcy5sZW5ndGggPT09IDApIHJldHVybiBcInN1cHBvcnRlZCBwbGF0Zm9ybXNcIjtcbiAgcmV0dXJuIHBsYXRmb3Jtcy5tYXAoKHBsYXRmb3JtKSA9PiB7XG4gICAgaWYgKHBsYXRmb3JtID09PSBcImRhcndpblwiKSByZXR1cm4gXCJtYWNPU1wiO1xuICAgIGlmIChwbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiKSByZXR1cm4gXCJXaW5kb3dzXCI7XG4gICAgcmV0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QUN2QjtBQUFBLEVBQWE7QUFBQSxFQUFhO0FBQUEsRUFBYTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUNwRTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBVztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUMxRTtBQUFBLEVBQU07QUFBQSxFQUFNO0FBQUEsRUFBTztBQUFBLEVBQVc7QUFBQSxFQUFNO0FBQUEsRUFDcEM7QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQzVEO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ25EO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFDMUM7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNyRjtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUztBQUFBLEVBQ3hCO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUN0QztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBVztBQUFBLEVBQ3pCO0FBQUEsRUFBSztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RDtBQUFBLEVBQVM7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDL0U7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQ2Y7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ2pGO0FBQUEsRUFDQTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQWE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDcEY7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBVTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ25GO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDckI7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ2hGO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDMUM7QUFBQSxFQUFPO0FBQUEsRUFDUDtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFNO0FBQUEsRUFDaEY7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxF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QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7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QUssT0FBTyxRQUFRO0FBQUEsUUFDdkQsa0JBQWlCLEtBQUssa0JBQWtCLENBQUMsT0FBTyxRQUFRLENBQUM7QUFBQSxFQUNoRSxDQUFDO0FBQ0g7QUFFQSxTQUFTQyxnQkFBZSxPQUFlLE9BQXVCO0FBQzVELE1BQUksT0FBTyxVQUFVLFlBQVksQ0FBQyxvQkFBb0IsS0FBSyxLQUFLLEdBQUc7QUFDakUsVUFBTSxJQUFJLE1BQU0sR0FBRyxLQUFLLG1FQUFtRTtBQUFBLEVBQzdGO0FBQ0EsU0FBTztBQUNUO0FBRUEsU0FBUyxhQUFhLFFBQWtDO0FBQ3RELFFBQU0sU0FBUyxDQUFDLFFBQVEsR0FBRyxRQUFRLEdBQUcsUUFBUSxPQUFPLFFBQVEsTUFBTTtBQUNuRSxNQUFJLENBQUMsT0FBTyxNQUFNLENBQUMsVUFBVSxPQUFPLFVBQVUsWUFBWSxPQUFPLFNBQVMsS0FBSyxDQUFDLEdBQUc7QUFDakYsVUFBTSxJQUFJLE1BQU0sNERBQTREO0FBQUEsRUFDOUU7QUFDQSxNQUFJLE9BQU8sUUFBUSxLQUFLLE9BQU8sU0FBUyxHQUFHO0FBQ3pDLFVBQU0sSUFBSSxNQUFNLDhDQUE4QztBQUFBLEVBQ2hFO0FBQ0Y7IiwKICAibmFtZXMiOiBbImltcG9ydF9lbGVjdHJvbiIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9ub2RlX29zIiwgImltcG9ydF9mcyIsICJpbXBvcnRfcHJvbWlzZXMiLCAic3lzUGF0aCIsICJwcmVzb2x2ZSIsICJiYXNlbmFtZSIsICJwam9pbiIsICJwcmVsYXRpdmUiLCAicHNlcCIsICJpbXBvcnRfcHJvbWlzZXMiLCAib3NUeXBlIiwgImZzX3dhdGNoIiwgInJhd0VtaXR0ZXIiLCAibGlzdGVuZXIiLCAiYmFzZW5hbWUiLCAiZGlybmFtZSIsICJuZXdTdGF0cyIsICJjbG9zZXIiLCAiZnNyZWFscGF0aCIsICJyZXNvbHZlIiwgInJlYWxwYXRoIiwgInN0YXRzIiwgInJlbGF0aXZlIiwgIkRPVUJMRV9TTEFTSF9SRSIsICJ0ZXN0U3RyaW5nIiwgInBhdGgiLCAic3RhdHMiLCAic3RhdGNiIiwgIm5vdyIsICJzdGF0IiwgImltcG9ydF9ub2RlX3BhdGgiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAidXNlclJvb3QiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJpbXBvcnRfZWxlY3Ryb24iLCAiaW1wb3J0X25vZGVfY2hpbGRfcHJvY2VzcyIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImxvZyIsICJleHBvcnRzIiwgImFzUmVjb3JkIiwgInJlc29sdmUiLCAid2ViQ29udGVudHMiLCAiaW1wb3J0X2VsZWN0cm9uIiwgImltcG9ydF9ub2RlX2NyeXB0byIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImxvZyIsICJhc1JlY29yZCIsICJyZXNvbHZlIiwgInBsYXRmb3JtIiwgImlzUGF0aEluc2lkZSIsICJleHBvcnRzIiwgImluZmVyTWFjQXBwUm9vdCIsICJwbGF0Zm9ybSIsICJzdGF0IiwgImFzUmVjb3JkIiwgImFzc2VydEJyaWRnZUlkIiwgImlzV2luZG93RGVzdHJveWVkIiwgIndpbmRvd0lkRm9yIiwgIm1ha2VXaW5kb3dMaWtlRm9yVmlldyJdCn0K
