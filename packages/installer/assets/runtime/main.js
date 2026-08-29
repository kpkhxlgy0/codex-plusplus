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
        const existing = (0, import_node_fs5.readFileSync)(path);
        (0, import_node_fs5.writeFileSync)(path, existing.subarray(Math.max(0, existing.byteLength - allowedExisting)));
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
var CODEX_PLUSPLUS_VERSION = "1.0.2";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc3JjL21haW4udHMiLCAiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2Nob2tpZGFyL2VzbS9pbmRleC5qcyIsICIuLi8uLi8uLi9ub2RlX21vZHVsZXMvcmVhZGRpcnAvZXNtL2luZGV4LmpzIiwgIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9jaG9raWRhci9lc20vaGFuZGxlci5qcyIsICIuLi9zcmMvdHdlYWstZGlzY292ZXJ5LnRzIiwgIi4uL3NyYy9zdG9yYWdlLnRzIiwgIi4uL3NyYy9tY3Atc3luYy50cyIsICIuLi9zcmMvd2F0Y2hlci1oZWFsdGgudHMiLCAiLi4vc3JjL3R3ZWFrLWxpZmVjeWNsZS50cyIsICIuLi9zcmMvbG9nZ2luZy50cyIsICIuLi9zcmMvY29kZXgtcnVudGltZS1wcm9iZS50cyIsICIuLi9zcmMvbmF0aXZlLWJyaWRnZS50cyIsICIuLi9zcmMvbmF0aXZlLXBhdGhzLnRzIiwgIi4uL3NyYy90d2Vhay1zdG9yZS50cyIsICIuLi9zcmMvYnJvd3Nlci11aS50cyIsICIuLi9zcmMvdmVyc2lvbi11dGlscy50cyIsICIuLi9zcmMvdHdlYWstc3RvcmUtY29tcGF0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIE1haW4tcHJvY2VzcyBib290c3RyYXAuIExvYWRlZCBieSB0aGUgYXNhciBsb2FkZXIgYmVmb3JlIENvZGV4J3Mgb3duXG4gKiBtYWluIHByb2Nlc3MgY29kZSBydW5zLiBXZSBob29rIGBCcm93c2VyV2luZG93YCBzbyBldmVyeSB3aW5kb3cgQ29kZXhcbiAqIGNyZWF0ZXMgZ2V0cyBvdXIgcHJlbG9hZCBzY3JpcHQgYXR0YWNoZWQuIFdlIGFsc28gc3RhbmQgdXAgYW4gSVBDXG4gKiBjaGFubmVsIGZvciB0d2Vha3MgdG8gdGFsayB0byB0aGUgbWFpbiBwcm9jZXNzLlxuICpcbiAqIFdlIGFyZSBpbiBDSlMgbGFuZCBoZXJlIChtYXRjaGVzIEVsZWN0cm9uJ3MgbWFpbiBwcm9jZXNzIGFuZCBDb2RleCdzIG93blxuICogY29kZSkuIFRoZSByZW5kZXJlci1zaWRlIHJ1bnRpbWUgaXMgYnVuZGxlZCBzZXBhcmF0ZWx5IGludG8gcHJlbG9hZC5qcy5cbiAqL1xuaW1wb3J0IHsgYXBwLCBCcm93c2VyVmlldywgQnJvd3NlcldpbmRvdywgY2xpcGJvYXJkLCBpcGNNYWluLCBzZXNzaW9uLCBzaGVsbCwgd2ViQ29udGVudHMgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGNwU3luYywgZXhpc3RzU3luYywgbWtkaXJTeW5jLCBta2R0ZW1wU3luYywgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgcmVhbHBhdGhTeW5jLCBybVN5bmMsIHN0YXRTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGV4ZWNGaWxlU3luYywgc3Bhd24sIHNwYXduU3luYyB9IGZyb20gXCJub2RlOmNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IGNyZWF0ZUhhc2gsIHJhbmRvbUludCwgcmFuZG9tVVVJRCB9IGZyb20gXCJub2RlOmNyeXB0b1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgaXNBYnNvbHV0ZSwgam9pbiwgcmVsYXRpdmUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBob21lZGlyLCB0bXBkaXIgfSBmcm9tIFwibm9kZTpvc1wiO1xuaW1wb3J0IGNob2tpZGFyIGZyb20gXCJjaG9raWRhclwiO1xuaW1wb3J0IHsgZGlzY292ZXJUd2Vha3MsIHR5cGUgRGlzY292ZXJlZFR3ZWFrIH0gZnJvbSBcIi4vdHdlYWstZGlzY292ZXJ5XCI7XG5pbXBvcnQgeyBjcmVhdGVEaXNrU3RvcmFnZSwgdHlwZSBEaXNrU3RvcmFnZSB9IGZyb20gXCIuL3N0b3JhZ2VcIjtcbmltcG9ydCB7IHN5bmNNYW5hZ2VkTWNwU2VydmVycyB9IGZyb20gXCIuL21jcC1zeW5jXCI7XG5pbXBvcnQgeyBnZXRXYXRjaGVySGVhbHRoIH0gZnJvbSBcIi4vd2F0Y2hlci1oZWFsdGhcIjtcbmltcG9ydCB7XG4gIGlzTWFpblByb2Nlc3NUd2Vha1Njb3BlLFxuICByZWxvYWRUd2Vha3MsXG4gIHNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZCxcbn0gZnJvbSBcIi4vdHdlYWstbGlmZWN5Y2xlXCI7XG5pbXBvcnQgeyBhcHBlbmRDYXBwZWRMb2cgfSBmcm9tIFwiLi9sb2dnaW5nXCI7XG5pbXBvcnQge1xuICBnZXRDZHBTdGF0dXMsXG4gIGdldFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIGdldFJ1bnRpbWVJbmZvLFxuICBsaXN0Q2RwVGFyZ2V0cyxcbn0gZnJvbSBcIi4vY29kZXgtcnVudGltZS1wcm9iZVwiO1xuaW1wb3J0IHsgTmF0aXZlQnJpZGdlLCB0eXBlIE5hdGl2ZVR3ZWFrQ29udGV4dCB9IGZyb20gXCIuL25hdGl2ZS1icmlkZ2VcIjtcbmltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgQ29kZXhSdW50aW1lSW5mbyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbiAgQ29kZXhNb2RlbEdlbmVyYXRlVGV4dE9wdGlvbnMsXG4gIENvZGV4TW9kZWxPYmplY3RSZXN1bHQsXG4gIENvZGV4TW9kZWxSZWFzb25pbmdFZmZvcnQsXG4gIENvZGV4TW9kZWxUZXh0UmVzdWx0LFxuICBDb2RleFZpZXdDcmVhdGVPcHRpb25zLFxuICBDb2RleFZpZXdSZWYsXG4gIENvZGV4V2luZG93UmVmLFxuICBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zLFxuICBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucyxcbiAgTmF0aXZlUGFuZWxDcmVhdGVPcHRpb25zLFxuICBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucyxcbiAgVHdlYWtQZXJtaXNzaW9uLFxufSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuaW1wb3J0IHtcbiAgREVGQVVMVF9UV0VBS19TVE9SRV9JTkRFWF9VUkwsXG4gIG5vcm1hbGl6ZUdpdEh1YlJlcG8sXG4gIG5vcm1hbGl6ZVN0b3JlUmVnaXN0cnksXG4gIHNodWZmbGVTdG9yZUVudHJpZXMsXG4gIHN0b3JlQXJjaGl2ZVVybCxcbiAgdHlwZSBUd2Vha1N0b3JlUHVibGlzaFN1Ym1pc3Npb24sXG4gIHR5cGUgVHdlYWtTdG9yZUVudHJ5LFxuICB0eXBlIFR3ZWFrU3RvcmVSZWdpc3RyeSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmVcIjtcbmltcG9ydCB7IG1heWJlU3RhcnRCcm93c2VyVWlTZXJ2ZXIgfSBmcm9tIFwiLi9icm93c2VyLXVpXCI7XG5pbXBvcnQgeyBjb21wYXJlVmVyc2lvbnMsIG5vcm1hbGl6ZVZlcnNpb24gfSBmcm9tIFwiLi92ZXJzaW9uLXV0aWxzXCI7XG5pbXBvcnQge1xuICBhc3NlcnRTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmxlLFxuICBhc3NlcnRTdG9yZUVudHJ5UnVudGltZUNvbXBhdGlibGUsXG4gIHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHksXG4gIHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eSxcbn0gZnJvbSBcIi4vdHdlYWstc3RvcmUtY29tcGF0XCI7XG5cbmNvbnN0IHVzZXJSb290ID0gcHJvY2Vzcy5lbnYuQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UO1xuY29uc3QgcnVudGltZURpciA9IHByb2Nlc3MuZW52LkNPREVYX1BMVVNQTFVTX1JVTlRJTUU7XG5cbmlmICghdXNlclJvb3QgfHwgIXJ1bnRpbWVEaXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIFwiY29kZXgtcGx1c3BsdXMgcnVudGltZSBzdGFydGVkIHdpdGhvdXQgQ09ERVhfUExVU1BMVVNfVVNFUl9ST09UL1JVTlRJTUUgZW52c1wiLFxuICApO1xufVxuXG5jb25zdCBQUkVMT0FEX1BBVEggPSByZXNvbHZlKHJ1bnRpbWVEaXIsIFwicHJlbG9hZC5qc1wiKTtcbmNvbnN0IFRXRUFLU19ESVIgPSBqb2luKHVzZXJSb290LCBcInR3ZWFrc1wiKTtcbmNvbnN0IExPR19ESVIgPSBqb2luKHVzZXJSb290LCBcImxvZ1wiKTtcbmNvbnN0IExPR19GSUxFID0gam9pbihMT0dfRElSLCBcIm1haW4ubG9nXCIpO1xuY29uc3QgQ09ORklHX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcImNvbmZpZy5qc29uXCIpO1xuY29uc3QgQ09ERVhfQ09ORklHX0ZJTEUgPSBqb2luKGhvbWVkaXIoKSwgXCIuY29kZXhcIiwgXCJjb25maWcudG9tbFwiKTtcbmNvbnN0IElOU1RBTExFUl9TVEFURV9GSUxFID0gam9pbih1c2VyUm9vdCwgXCJzdGF0ZS5qc29uXCIpO1xuY29uc3QgVVBEQVRFX01PREVfRklMRSA9IGpvaW4odXNlclJvb3QsIFwidXBkYXRlLW1vZGUuanNvblwiKTtcbmNvbnN0IFNFTEZfVVBEQVRFX1NUQVRFX0ZJTEUgPSBqb2luKHVzZXJSb290LCBcInNlbGYtdXBkYXRlLXN0YXRlLmpzb25cIik7XG5jb25zdCBTSUdORURfQ09ERVhfQkFDS1VQID0gam9pbih1c2VyUm9vdCwgXCJiYWNrdXBcIiwgXCJDb2RleC5hcHBcIik7XG5jb25zdCBDT0RFWF9QTFVTUExVU19DTElfU0hJTSA9IGpvaW4odXNlclJvb3QsIFwiYmluXCIsIHByb2Nlc3MucGxhdGZvcm0gPT09IFwid2luMzJcIiA/IFwiY29kZXhwbHVzcGx1cy5jbWRcIiA6IFwiY29kZXhwbHVzcGx1c1wiKTtcbmNvbnN0IFBPU1RfVVBEQVRFX1JFUEFJUl9MT0dfRklMRSA9IGpvaW4oTE9HX0RJUiwgXCJwb3N0LXVwZGF0ZS1yZXBhaXIubG9nXCIpO1xuY29uc3QgQ09ERVhfUExVU1BMVVNfVkVSU0lPTiA9IFwiMS4wLjJcIjtcbmNvbnN0IENPREVYX1BMVVNQTFVTX1JFUE8gPSBcImtwa2h4bGd5MC9jb2RleC1wbHVzcGx1c1wiO1xuY29uc3QgVFdFQUtfU1RPUkVfSU5ERVhfVVJMID0gcHJvY2Vzcy5lbnYuQ09ERVhfUExVU1BMVVNfU1RPUkVfSU5ERVhfVVJMID8/IERFRkFVTFRfVFdFQUtfU1RPUkVfSU5ERVhfVVJMO1xuY29uc3QgQ09ERVhfV0lORE9XX1NFUlZJQ0VTX0tFWSA9IFwiX19jb2RleHBwX3dpbmRvd19zZXJ2aWNlc19fXCI7XG5jb25zdCBERUJVR19XRUJfQ09OVEVOVFNfTE9HID0gcHJvY2Vzcy5lbnYuQ09ERVhQUF9ERUJVR19XRUJfQ09OVEVOVFMgPT09IFwiMVwiO1xuY29uc3QgREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVyA9IFwiY29kZXhfZGVza3RvcDptZXNzYWdlLWZyb20tdmlld1wiO1xuXG50eXBlIE1lc3NhZ2VGcm9tVmlld0NvbnRleHQgPSB7IHNlbmRlcklkPzogbnVtYmVyOyBzZW5kZXJVcmw/OiBzdHJpbmcgfTtcbnR5cGUgTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXIgPSAoXG4gIG1lc3NhZ2U6IHVua25vd24sXG4gIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQsXG4pID0+IHVua25vd24gfCB1bmRlZmluZWQ7XG50eXBlIE1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXIgPSAoXG4gIG1lc3NhZ2U6IHVua25vd24sXG4gIHJlc3BvbnNlOiB1bmtub3duLFxuICBjb250ZXh0OiBNZXNzYWdlRnJvbVZpZXdDb250ZXh0LFxuKSA9PiB2b2lkO1xuXG5jb25zdCBtYWluTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzID0gbmV3IFNldDxNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcj4oKTtcbmNvbnN0IG1haW5NZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVycyA9IG5ldyBTZXQ8TWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcj4oKTtcblxubWtkaXJTeW5jKExPR19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xubWtkaXJTeW5jKFRXRUFLU19ESVIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuaW5zdGFsbE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybUhvb2soKTtcblxuLy8gT3B0aW9uYWw6IGVuYWJsZSBDaHJvbWUgRGV2VG9vbHMgUHJvdG9jb2wgb24gYSBUQ1AgcG9ydCBzbyB3ZSBjYW4gZHJpdmUgdGhlXG4vLyBydW5uaW5nIENvZGV4IGZyb20gb3V0c2lkZSAoY3VybCBodHRwOi8vbG9jYWxob3N0Ojxwb3J0Pi9qc29uLCBhdHRhY2ggdmlhXG4vLyBDRFAgV2ViU29ja2V0LCB0YWtlIHNjcmVlbnNob3RzLCBldmFsdWF0ZSBpbiByZW5kZXJlciwgZXRjLikuIENvZGV4J3Ncbi8vIHByb2R1Y3Rpb24gYnVpbGQgc2V0cyB3ZWJQcmVmZXJlbmNlcy5kZXZUb29scz1mYWxzZSwgd2hpY2gga2lsbHMgdGhlXG4vLyBpbi13aW5kb3cgRGV2VG9vbHMgc2hvcnRjdXQsIGJ1dCBgLS1yZW1vdGUtZGVidWdnaW5nLXBvcnRgIHdvcmtzIHJlZ2FyZGxlc3Ncbi8vIGJlY2F1c2UgaXQncyBhIENocm9taXVtIGNvbW1hbmQtbGluZSBzd2l0Y2ggcHJvY2Vzc2VkIGJlZm9yZSBhcHAgaW5pdC5cbi8vXG4vLyBPZmYgYnkgZGVmYXVsdC4gU2V0IENPREVYUFBfUkVNT1RFX0RFQlVHPTEgKG9wdGlvbmFsbHkgQ09ERVhQUF9SRU1PVEVfREVCVUdfUE9SVClcbi8vIHRvIHR1cm4gaXQgb24uIE11c3QgYmUgYXBwZW5kZWQgYmVmb3JlIGBhcHBgIGJlY29tZXMgcmVhZHk7IHdlJ3JlIGF0IG1vZHVsZVxuLy8gdG9wLWxldmVsIHNvIHRoYXQncyBmaW5lLlxuaWYgKHByb2Nlc3MuZW52LkNPREVYUFBfUkVNT1RFX0RFQlVHID09PSBcIjFcIikge1xuICBjb25zdCBwb3J0ID0gcHJvY2Vzcy5lbnYuQ09ERVhQUF9SRU1PVEVfREVCVUdfUE9SVCA/PyBcIjkyMjJcIjtcbiAgYXBwLmNvbW1hbmRMaW5lLmFwcGVuZFN3aXRjaChcInJlbW90ZS1kZWJ1Z2dpbmctcG9ydFwiLCBwb3J0KTtcbiAgbG9nKFwiaW5mb1wiLCBgcmVtb3RlIGRlYnVnZ2luZyBlbmFibGVkIG9uIHBvcnQgJHtwb3J0fWApO1xufVxuXG5pbnRlcmZhY2UgUGVyc2lzdGVkU3RhdGUge1xuICBjb2RleFBsdXNQbHVzPzoge1xuICAgIGF1dG9VcGRhdGU/OiBib29sZWFuO1xuICAgIHNhZmVNb2RlPzogYm9vbGVhbjtcbiAgICB1cGRhdGVDaGFubmVsPzogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gICAgdXBkYXRlUmVwbz86IHN0cmluZztcbiAgICB1cGRhdGVSZWY/OiBzdHJpbmc7XG4gICAgdXBkYXRlQ2hlY2s/OiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2s7XG4gIH07XG4gIC8qKiBQZXItdHdlYWsgZW5hYmxlIGZsYWdzLiBNaXNzaW5nIGVudHJpZXMgZGVmYXVsdCB0byBlbmFibGVkLiAqL1xuICB0d2Vha3M/OiBSZWNvcmQ8c3RyaW5nLCB7IGVuYWJsZWQ/OiBib29sZWFuIH0+O1xuICAvKiogQ2FjaGVkIEdpdEh1YiByZWxlYXNlIGNoZWNrcy4gUnVudGltZSBuZXZlciBhdXRvLWluc3RhbGxzIHVwZGF0ZXMuICovXG4gIHR3ZWFrVXBkYXRlQ2hlY2tzPzogUmVjb3JkPHN0cmluZywgVHdlYWtVcGRhdGVDaGVjaz47XG59XG5cbmludGVyZmFjZSBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgbGF0ZXN0VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZU5vdGVzOiBzdHJpbmcgfCBudWxsO1xuICB1cGRhdGVBdmFpbGFibGU6IGJvb2xlYW47XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG50eXBlIFNlbGZVcGRhdGVDaGFubmVsID0gXCJzdGFibGVcIiB8IFwicHJlcmVsZWFzZVwiIHwgXCJjdXN0b21cIjtcbnR5cGUgU2VsZlVwZGF0ZVN0YXR1cyA9IFwiY2hlY2tpbmdcIiB8IFwidXAtdG8tZGF0ZVwiIHwgXCJ1cGRhdGVkXCIgfCBcImZhaWxlZFwiIHwgXCJkaXNhYmxlZFwiO1xuXG5pbnRlcmZhY2UgU2VsZlVwZGF0ZVN0YXRlIHtcbiAgY2hlY2tlZEF0OiBzdHJpbmc7XG4gIGNvbXBsZXRlZEF0Pzogc3RyaW5nO1xuICBzdGF0dXM6IFNlbGZVcGRhdGVTdGF0dXM7XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIHRhcmdldFJlZjogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgcmVwbzogc3RyaW5nO1xuICBjaGFubmVsOiBTZWxmVXBkYXRlQ2hhbm5lbDtcbiAgc291cmNlUm9vdDogc3RyaW5nO1xuICBpbnN0YWxsYXRpb25Tb3VyY2U/OiBJbnN0YWxsYXRpb25Tb3VyY2U7XG4gIGVycm9yPzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW5zdGFsbGF0aW9uU291cmNlIHtcbiAga2luZDogXCJnaXRodWItc291cmNlXCIgfCBcImhvbWVicmV3XCIgfCBcImxvY2FsLWRldlwiIHwgXCJzb3VyY2UtYXJjaGl2ZVwiIHwgXCJ1bmtub3duXCI7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIGRldGFpbDogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVHdlYWtVcGRhdGVDaGVjayB7XG4gIGNoZWNrZWRBdDogc3RyaW5nO1xuICByZXBvOiBzdHJpbmc7XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGxhdGVzdFRhZzogc3RyaW5nIHwgbnVsbDtcbiAgcmVsZWFzZVVybDogc3RyaW5nIHwgbnVsbDtcbiAgdXBkYXRlQXZhaWxhYmxlOiBib29sZWFuO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gcmVhZFN0YXRlKCk6IFBlcnNpc3RlZFN0YXRlIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoQ09ORklHX0ZJTEUsIFwidXRmOFwiKSkgYXMgUGVyc2lzdGVkU3RhdGU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiB7fTtcbiAgfVxufVxuZnVuY3Rpb24gd3JpdGVTdGF0ZShzOiBQZXJzaXN0ZWRTdGF0ZSk6IHZvaWQge1xuICB0cnkge1xuICAgIHdyaXRlRmlsZVN5bmMoQ09ORklHX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHMsIG51bGwsIDIpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJ3cml0ZVN0YXRlIGZhaWxlZDpcIiwgU3RyaW5nKChlIGFzIEVycm9yKS5tZXNzYWdlKSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGlzQ29kZXhQbHVzUGx1c0F1dG9VcGRhdGVFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cz8uYXV0b1VwZGF0ZSAhPT0gZmFsc2U7XG59XG5mdW5jdGlvbiBzZXRDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZShlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgcy5jb2RleFBsdXNQbHVzLmF1dG9VcGRhdGUgPSBlbmFibGVkO1xuICB3cml0ZVN0YXRlKHMpO1xufVxuZnVuY3Rpb24gc2V0Q29kZXhQbHVzUGx1c1VwZGF0ZUNvbmZpZyhjb25maWc6IHtcbiAgdXBkYXRlQ2hhbm5lbD86IFNlbGZVcGRhdGVDaGFubmVsO1xuICB1cGRhdGVSZXBvPzogc3RyaW5nO1xuICB1cGRhdGVSZWY/OiBzdHJpbmc7XG59KTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgaWYgKGNvbmZpZy51cGRhdGVDaGFubmVsKSBzLmNvZGV4UGx1c1BsdXMudXBkYXRlQ2hhbm5lbCA9IGNvbmZpZy51cGRhdGVDaGFubmVsO1xuICBpZiAoXCJ1cGRhdGVSZXBvXCIgaW4gY29uZmlnKSBzLmNvZGV4UGx1c1BsdXMudXBkYXRlUmVwbyA9IGNsZWFuT3B0aW9uYWxTdHJpbmcoY29uZmlnLnVwZGF0ZVJlcG8pO1xuICBpZiAoXCJ1cGRhdGVSZWZcIiBpbiBjb25maWcpIHMuY29kZXhQbHVzUGx1cy51cGRhdGVSZWYgPSBjbGVhbk9wdGlvbmFsU3RyaW5nKGNvbmZpZy51cGRhdGVSZWYpO1xuICB3cml0ZVN0YXRlKHMpO1xufVxuZnVuY3Rpb24gaXNDb2RleFBsdXNQbHVzU2FmZU1vZGVFbmFibGVkKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWU7XG59XG5mdW5jdGlvbiBpc1R3ZWFrRW5hYmxlZChpZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgaWYgKHMuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHMudHdlYWtzPy5baWRdPy5lbmFibGVkICE9PSBmYWxzZTtcbn1cbmZ1bmN0aW9uIHNldFR3ZWFrRW5hYmxlZChpZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKTogdm9pZCB7XG4gIGNvbnN0IHMgPSByZWFkU3RhdGUoKTtcbiAgcy50d2Vha3MgPz89IHt9O1xuICBzLnR3ZWFrc1tpZF0gPSB7IC4uLnMudHdlYWtzW2lkXSwgZW5hYmxlZCB9O1xuICB3cml0ZVN0YXRlKHMpO1xufVxuXG5pbnRlcmZhY2UgSW5zdGFsbGVyU3RhdGUge1xuICBhcHBSb290OiBzdHJpbmc7XG4gIGNvZGV4VmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgc291cmNlUm9vdD86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gcmVhZEluc3RhbGxlclN0YXRlKCk6IEluc3RhbGxlclN0YXRlIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKElOU1RBTExFUl9TVEFURV9GSUxFLCBcInV0ZjhcIikpIGFzIEluc3RhbGxlclN0YXRlO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkU2VsZlVwZGF0ZVN0YXRlKCk6IFNlbGZVcGRhdGVTdGF0ZSB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhTRUxGX1VQREFURV9TVEFURV9GSUxFLCBcInV0ZjhcIikpIGFzIFNlbGZVcGRhdGVTdGF0ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbmZ1bmN0aW9uIHdyaXRlU2VsZlVwZGF0ZVN0YXRlKHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICB3cml0ZUZpbGVTeW5jKFNFTEZfVVBEQVRFX1NUQVRFX0ZJTEUsIEpTT04uc3RyaW5naWZ5KHN0YXRlLCBudWxsLCAyKSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwid3JpdGVTZWxmVXBkYXRlU3RhdGUgZmFpbGVkOlwiLCBTdHJpbmcoKGUgYXMgRXJyb3IpLm1lc3NhZ2UpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbGVhbk9wdGlvbmFsU3RyaW5nKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgY29uc3QgdHJpbW1lZCA9IHZhbHVlLnRyaW0oKTtcbiAgcmV0dXJuIHRyaW1tZWQgPyB0cmltbWVkIDogdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc1BhdGhJbnNpZGUocGFyZW50OiBzdHJpbmcsIHRhcmdldDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IHJlbCA9IHJlbGF0aXZlKHJlc29sdmUocGFyZW50KSwgcmVzb2x2ZSh0YXJnZXQpKTtcbiAgcmV0dXJuIHJlbCA9PT0gXCJcIiB8fCAoISFyZWwgJiYgIXJlbC5zdGFydHNXaXRoKFwiLi5cIikgJiYgIWlzQWJzb2x1dGUocmVsKSk7XG59XG5cbmZ1bmN0aW9uIGxvZyhsZXZlbDogXCJpbmZvXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIiwgLi4uYXJnczogdW5rbm93bltdKTogdm9pZCB7XG4gIGNvbnN0IGxpbmUgPSBgWyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfV0gWyR7bGV2ZWx9XSAke2FyZ3NcbiAgICAubWFwKChhKSA9PiAodHlwZW9mIGEgPT09IFwic3RyaW5nXCIgPyBhIDogSlNPTi5zdHJpbmdpZnkoYSkpKVxuICAgIC5qb2luKFwiIFwiKX1cXG5gO1xuICB0cnkge1xuICAgIGFwcGVuZENhcHBlZExvZyhMT0dfRklMRSwgbGluZSk7XG4gIH0gY2F0Y2gge31cbiAgaWYgKGxldmVsID09PSBcImVycm9yXCIpIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdXCIsIC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsU3BhcmtsZVVwZGF0ZUhvb2soKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcImRhcndpblwiKSByZXR1cm47XG5cbiAgY29uc3QgTW9kdWxlID0gcmVxdWlyZShcIm5vZGU6bW9kdWxlXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJub2RlOm1vZHVsZVwiKSAmIHtcbiAgICBfbG9hZD86IChyZXF1ZXN0OiBzdHJpbmcsIHBhcmVudDogdW5rbm93biwgaXNNYWluOiBib29sZWFuKSA9PiB1bmtub3duO1xuICB9O1xuICBjb25zdCBvcmlnaW5hbExvYWQgPSBNb2R1bGUuX2xvYWQ7XG4gIGlmICh0eXBlb2Ygb3JpZ2luYWxMb2FkICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybjtcblxuICBNb2R1bGUuX2xvYWQgPSBmdW5jdGlvbiBjb2RleFBsdXNQbHVzTW9kdWxlTG9hZChyZXF1ZXN0OiBzdHJpbmcsIHBhcmVudDogdW5rbm93biwgaXNNYWluOiBib29sZWFuKSB7XG4gICAgY29uc3QgbG9hZGVkID0gb3JpZ2luYWxMb2FkLmFwcGx5KHRoaXMsIFtyZXF1ZXN0LCBwYXJlbnQsIGlzTWFpbl0pIGFzIHVua25vd247XG4gICAgaWYgKHR5cGVvZiByZXF1ZXN0ID09PSBcInN0cmluZ1wiICYmIC9zcGFya2xlKD86XFwubm9kZSk/JC9pLnRlc3QocmVxdWVzdCkpIHtcbiAgICAgIHdyYXBTcGFya2xlRXhwb3J0cyhsb2FkZWQpO1xuICAgIH1cbiAgICByZXR1cm4gbG9hZGVkO1xuICB9O1xufVxuXG5mdW5jdGlvbiB3cmFwU3BhcmtsZUV4cG9ydHMobG9hZGVkOiB1bmtub3duKTogdm9pZCB7XG4gIGlmICghbG9hZGVkIHx8IHR5cGVvZiBsb2FkZWQgIT09IFwib2JqZWN0XCIpIHJldHVybjtcbiAgY29uc3QgZXhwb3J0cyA9IGxvYWRlZCBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiAmIHsgX19jb2RleHBwU3BhcmtsZVdyYXBwZWQ/OiBib29sZWFuIH07XG4gIGlmIChleHBvcnRzLl9fY29kZXhwcFNwYXJrbGVXcmFwcGVkKSByZXR1cm47XG4gIGV4cG9ydHMuX19jb2RleHBwU3BhcmtsZVdyYXBwZWQgPSB0cnVlO1xuXG4gIGZvciAoY29uc3QgbmFtZSBvZiBbXCJpbnN0YWxsVXBkYXRlc0lmQXZhaWxhYmxlXCJdKSB7XG4gICAgY29uc3QgZm4gPSBleHBvcnRzW25hbWVdO1xuICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgY29udGludWU7XG4gICAgZXhwb3J0c1tuYW1lXSA9IGZ1bmN0aW9uIGNvZGV4UGx1c1BsdXNTcGFya2xlV3JhcHBlcih0aGlzOiB1bmtub3duLCAuLi5hcmdzOiB1bmtub3duW10pIHtcbiAgICAgIHByZXBhcmVTaWduZWRDb2RleEZvclNwYXJrbGVJbnN0YWxsKCk7XG4gICAgICByZXR1cm4gUmVmbGVjdC5hcHBseShmbiwgdGhpcywgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChleHBvcnRzLmRlZmF1bHQgJiYgZXhwb3J0cy5kZWZhdWx0ICE9PSBleHBvcnRzKSB7XG4gICAgd3JhcFNwYXJrbGVFeHBvcnRzKGV4cG9ydHMuZGVmYXVsdCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJlcGFyZVNpZ25lZENvZGV4Rm9yU3BhcmtsZUluc3RhbGwoKTogdm9pZCB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSBcImRhcndpblwiKSByZXR1cm47XG4gIGlmIChleGlzdHNTeW5jKFVQREFURV9NT0RFX0ZJTEUpKSB7XG4gICAgbG9nKFwiaW5mb1wiLCBcIlNwYXJrbGUgdXBkYXRlIHByZXAgc2tpcHBlZDsgdXBkYXRlIG1vZGUgYWxyZWFkeSBhY3RpdmVcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghZXhpc3RzU3luYyhTSUdORURfQ09ERVhfQkFDS1VQKSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJTcGFya2xlIHVwZGF0ZSBwcmVwIHNraXBwZWQ7IHNpZ25lZCBDb2RleC5hcHAgYmFja3VwIGlzIG1pc3NpbmdcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmICghaXNEZXZlbG9wZXJJZFNpZ25lZEFwcChTSUdORURfQ09ERVhfQkFDS1VQKSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJTcGFya2xlIHVwZGF0ZSBwcmVwIHNraXBwZWQ7IENvZGV4LmFwcCBiYWNrdXAgaXMgbm90IERldmVsb3BlciBJRCBzaWduZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3Qgc3RhdGUgPSByZWFkSW5zdGFsbGVyU3RhdGUoKTtcbiAgY29uc3QgYXBwUm9vdCA9IHN0YXRlPy5hcHBSb290ID8/IGluZmVyTWFjQXBwUm9vdCgpO1xuICBpZiAoIWFwcFJvb3QpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwiU3BhcmtsZSB1cGRhdGUgcHJlcCBza2lwcGVkOyBjb3VsZCBub3QgaW5mZXIgQ29kZXguYXBwIHBhdGhcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgbW9kZSA9IHtcbiAgICBlbmFibGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBhcHBSb290LFxuICAgIGNvZGV4VmVyc2lvbjogc3RhdGU/LmNvZGV4VmVyc2lvbiA/PyBudWxsLFxuICB9O1xuICB3cml0ZUZpbGVTeW5jKFVQREFURV9NT0RFX0ZJTEUsIEpTT04uc3RyaW5naWZ5KG1vZGUsIG51bGwsIDIpKTtcbiAgc3RhcnRQb3N0VXBkYXRlUmVwYWlyTW9uaXRvcigpO1xuXG4gIHRyeSB7XG4gICAgZXhlY0ZpbGVTeW5jKFwiZGl0dG9cIiwgW1NJR05FRF9DT0RFWF9CQUNLVVAsIGFwcFJvb3RdLCB7IHN0ZGlvOiBcImlnbm9yZVwiIH0pO1xuICAgIHRyeSB7XG4gICAgICBleGVjRmlsZVN5bmMoXCJ4YXR0clwiLCBbXCItZHJcIiwgXCJjb20uYXBwbGUucXVhcmFudGluZVwiLCBhcHBSb290XSwgeyBzdGRpbzogXCJpZ25vcmVcIiB9KTtcbiAgICB9IGNhdGNoIHt9XG4gICAgbG9nKFwiaW5mb1wiLCBcIlJlc3RvcmVkIHNpZ25lZCBDb2RleC5hcHAgYmVmb3JlIFNwYXJrbGUgaW5zdGFsbFwiLCB7IGFwcFJvb3QgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJlcnJvclwiLCBcIkZhaWxlZCB0byByZXN0b3JlIHNpZ25lZCBDb2RleC5hcHAgYmVmb3JlIFNwYXJrbGUgaW5zdGFsbFwiLCB7XG4gICAgICBtZXNzYWdlOiAoZSBhcyBFcnJvcikubWVzc2FnZSxcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdGFydFBvc3RVcGRhdGVSZXBhaXJNb25pdG9yKCk6IHZvaWQge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gXCJkYXJ3aW5cIikgcmV0dXJuO1xuICBpZiAoIWV4aXN0c1N5bmMoQ09ERVhfUExVU1BMVVNfQ0xJX1NISU0pKSB7XG4gICAgbG9nKFwid2FyblwiLCBcIlBvc3QtdXBkYXRlIHJlcGFpciBtb25pdG9yIHNraXBwZWQ7IENvZGV4KysgQ0xJIHNoaW0gaXMgbWlzc2luZ1wiLCB7XG4gICAgICBzaGltOiBDT0RFWF9QTFVTUExVU19DTElfU0hJTSxcbiAgICB9KTtcbiAgICByZXR1cm47XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oXCIvYmluL3NoXCIsIFtcIi1jXCIsIGAke3Bvc3RVcGRhdGVSZXBhaXJTY3JpcHQoKX0gPj4gJHtzaGVsbFF1b3RlKFBPU1RfVVBEQVRFX1JFUEFJUl9MT0dfRklMRSl9IDI+JjFgXSwge1xuICAgICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgICBzdGRpbzogXCJpZ25vcmVcIixcbiAgICB9KTtcbiAgICBjaGlsZC51bnJlZigpO1xuICAgIGxvZyhcImluZm9cIiwgXCJTdGFydGVkIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3JcIiwge1xuICAgICAgbG9nOiBQT1NUX1VQREFURV9SRVBBSVJfTE9HX0ZJTEUsXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBsb2coXCJ3YXJuXCIsIFwiUG9zdC11cGRhdGUgcmVwYWlyIG1vbml0b3IgZmFpbGVkIHRvIHN0YXJ0XCIsIHtcbiAgICAgIG1lc3NhZ2U6IChlIGFzIEVycm9yKS5tZXNzYWdlLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwb3N0VXBkYXRlUmVwYWlyU2NyaXB0KCk6IHN0cmluZyB7XG4gIGNvbnN0IHJlcGFpckNvbW1hbmQgPSBbXG4gICAgXCJDT0RFWF9QTFVTUExVU19XQVRDSEVSPTFcIixcbiAgICBzaGVsbFF1b3RlKENPREVYX1BMVVNQTFVTX0NMSV9TSElNKSxcbiAgICBcInJlcGFpclwiLFxuICAgIFwiLS13YXRjaGVyXCIsXG4gICAgXCItLXF1aWV0XCIsXG4gICAgXCItLWxvY2FsXCIsXG4gIF0uam9pbihcIiBcIik7XG4gIGNvbnN0IGRvY3RvckNvbW1hbmQgPSBgJHtzaGVsbFF1b3RlKENPREVYX1BMVVNQTFVTX0NMSV9TSElNKX0gZG9jdG9yID4vZGV2L251bGwgMj4mMWA7XG4gIHJldHVybiBbXG4gICAgXCJzZXQgLXVcIixcbiAgICBgZWNobyBcIlskKGRhdGUpXSBDb2RleCsrIHBvc3QtdXBkYXRlIHJlcGFpciBtb25pdG9yIHN0YXJ0ZWRcImAsXG4gICAgXCJzbGVlcCAyMFwiLFxuICAgIFwiZGVhZGxpbmU9JCgoICQoZGF0ZSArJXMpICsgOTAwICkpXCIsXG4gICAgXCJ3aGlsZSBbICQoZGF0ZSArJXMpIC1sdCAkZGVhZGxpbmUgXTsgZG9cIixcbiAgICBgICAke3JlcGFpckNvbW1hbmR9IHx8IHRydWVgLFxuICAgIGAgIGlmIFsgISAtZiAke3NoZWxsUXVvdGUoVVBEQVRFX01PREVfRklMRSl9IF0gJiYgJHtkb2N0b3JDb21tYW5kfTsgdGhlbmAsXG4gICAgYCAgICBlY2hvIFwiWyQoZGF0ZSldIENvZGV4KysgcG9zdC11cGRhdGUgcmVwYWlyIGNvbXBsZXRlZFwiYCxcbiAgICBcIiAgICBleGl0IDBcIixcbiAgICBcIiAgZmlcIixcbiAgICBcIiAgc2xlZXAgMjBcIixcbiAgICBcImRvbmVcIixcbiAgICBgZWNobyBcIlskKGRhdGUpXSBDb2RleCsrIHBvc3QtdXBkYXRlIHJlcGFpciB0aW1lZCBvdXRcImAsXG4gICAgXCJleGl0IDFcIixcbiAgXS5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc0RldmVsb3BlcklkU2lnbmVkQXBwKGFwcFJvb3Q6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCByZXN1bHQgPSBzcGF3blN5bmMoXCJjb2Rlc2lnblwiLCBbXCItZHZcIiwgXCItLXZlcmJvc2U9NFwiLCBhcHBSb290XSwge1xuICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gIH0pO1xuICBjb25zdCBvdXRwdXQgPSBgJHtyZXN1bHQuc3Rkb3V0ID8/IFwiXCJ9JHtyZXN1bHQuc3RkZXJyID8/IFwiXCJ9YDtcbiAgcmV0dXJuIChcbiAgICByZXN1bHQuc3RhdHVzID09PSAwICYmXG4gICAgL0F1dGhvcml0eT1EZXZlbG9wZXIgSUQgQXBwbGljYXRpb246Ly50ZXN0KG91dHB1dCkgJiZcbiAgICAhL1NpZ25hdHVyZT1hZGhvYy8udGVzdChvdXRwdXQpICYmXG4gICAgIS9UZWFtSWRlbnRpZmllcj1ub3Qgc2V0Ly50ZXN0KG91dHB1dClcbiAgKTtcbn1cblxuZnVuY3Rpb24gaW5mZXJNYWNBcHBSb290KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBtYXJrZXIgPSBcIi5hcHAvQ29udGVudHMvTWFjT1MvXCI7XG4gIGNvbnN0IGlkeCA9IHByb2Nlc3MuZXhlY1BhdGguaW5kZXhPZihtYXJrZXIpO1xuICByZXR1cm4gaWR4ID49IDAgPyBwcm9jZXNzLmV4ZWNQYXRoLnNsaWNlKDAsIGlkeCArIFwiLmFwcFwiLmxlbmd0aCkgOiBudWxsO1xufVxuXG4vLyBTdXJmYWNlIHVuaGFuZGxlZCBlcnJvcnMgZnJvbSBhbnl3aGVyZSBpbiB0aGUgbWFpbiBwcm9jZXNzIHRvIG91ciBsb2cuXG5wcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgKGU6IEVycm9yICYgeyBjb2RlPzogc3RyaW5nIH0pID0+IHtcbiAgbG9nKFwiZXJyb3JcIiwgXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCB7IGNvZGU6IGUuY29kZSwgbWVzc2FnZTogZS5tZXNzYWdlLCBzdGFjazogZS5zdGFjayB9KTtcbn0pO1xucHJvY2Vzcy5vbihcInVuaGFuZGxlZFJlamVjdGlvblwiLCAoZSkgPT4ge1xuICBsb2coXCJlcnJvclwiLCBcInVuaGFuZGxlZFJlamVjdGlvblwiLCB7IHZhbHVlOiBTdHJpbmcoZSkgfSk7XG59KTtcblxuaW5zdGFsbFNwYXJrbGVVcGRhdGVIb29rKCk7XG5cbmludGVyZmFjZSBMb2FkZWRNYWluVHdlYWsge1xuICBzdG9wPzogKCkgPT4gdm9pZDtcbiAgc3RvcmFnZTogRGlza1N0b3JhZ2U7XG59XG5cbmludGVyZmFjZSBDb2RleFdpbmRvd1NlcnZpY2VzIHtcbiAgY3JlYXRlRnJlc2hXaW5kb3c/OiAocm91dGU/OiBzdHJpbmcpID0+IFByb21pc2U8RWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw+O1xuICBjcmVhdGVGcmVzaExvY2FsV2luZG93PzogKHJvdXRlPzogc3RyaW5nKSA9PiBQcm9taXNlPEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsPjtcbiAgZW5zdXJlSG9zdFdpbmRvdz86IChob3N0SWQ/OiBzdHJpbmcpID0+IFByb21pc2U8RWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw+O1xuICBnZXRQcmltYXJ5V2luZG93PzogKGhvc3RJZD86IHN0cmluZykgPT4gRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGw7XG4gIGdldENvbnRleHQ/OiAoaG9zdElkOiBzdHJpbmcpID0+IHsgcmVnaXN0ZXJXaW5kb3c/OiAod2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlKSA9PiB2b2lkIH0gfCBudWxsO1xuICB3aW5kb3dNYW5hZ2VyPzoge1xuICAgIGNyZWF0ZVdpbmRvdz86IChvcHRzOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gUHJvbWlzZTxFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbD47XG4gICAgZ2V0UHJpbWFyeVdpbmRvdz86ICgpID0+IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsO1xuICAgIHJlZ2lzdGVyV2luZG93PzogKFxuICAgICAgd2luZG93TGlrZTogQ29kZXhXaW5kb3dMaWtlLFxuICAgICAgaG9zdElkOiBzdHJpbmcsXG4gICAgICBwcmltYXJ5OiBib29sZWFuLFxuICAgICAgYXBwZWFyYW5jZTogc3RyaW5nLFxuICAgICkgPT4gdm9pZDtcbiAgICBvcHRpb25zPzoge1xuICAgICAgYWxsb3dEZXZ0b29scz86IGJvb2xlYW47XG4gICAgICBwcmVsb2FkUGF0aD86IHN0cmluZztcbiAgICB9O1xuICB9O1xufVxuXG5pbnRlcmZhY2UgQ29kZXhXaW5kb3dMaWtlIHtcbiAgaWQ6IG51bWJlcjtcbiAgd2ViQ29udGVudHM6IEVsZWN0cm9uLldlYkNvbnRlbnRzO1xuICBvbihldmVudDogXCJjbG9zZWRcIiwgbGlzdGVuZXI6ICgpID0+IHZvaWQpOiB1bmtub3duO1xuICBvbmNlPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIG9mZj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICByZW1vdmVMaXN0ZW5lcj8oZXZlbnQ6IHN0cmluZywgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQpOiB1bmtub3duO1xuICBpc0Rlc3Ryb3llZD8oKTogYm9vbGVhbjtcbiAgaXNGb2N1c2VkPygpOiBib29sZWFuO1xuICBmb2N1cz8oKTogdm9pZDtcbiAgc2hvdz8oKTogdm9pZDtcbiAgaGlkZT8oKTogdm9pZDtcbiAgZ2V0Qm91bmRzPygpOiBFbGVjdHJvbi5SZWN0YW5nbGU7XG4gIGdldENvbnRlbnRCb3VuZHM/KCk6IEVsZWN0cm9uLlJlY3RhbmdsZTtcbiAgZ2V0U2l6ZT8oKTogW251bWJlciwgbnVtYmVyXTtcbiAgZ2V0Q29udGVudFNpemU/KCk6IFtudW1iZXIsIG51bWJlcl07XG4gIHNldFRpdGxlPyh0aXRsZTogc3RyaW5nKTogdm9pZDtcbiAgZ2V0VGl0bGU/KCk6IHN0cmluZztcbiAgc2V0UmVwcmVzZW50ZWRGaWxlbmFtZT8oZmlsZW5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gIHNldERvY3VtZW50RWRpdGVkPyhlZGl0ZWQ6IGJvb2xlYW4pOiB2b2lkO1xuICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5Pyh2aXNpYmxlOiBib29sZWFuKTogdm9pZDtcbn1cblxuaW50ZXJmYWNlIENvZGV4Q3JlYXRlV2luZG93T3B0aW9ucyB7XG4gIHJvdXRlOiBzdHJpbmc7XG4gIGhvc3RJZD86IHN0cmluZztcbiAgc2hvdz86IGJvb2xlYW47XG4gIGFwcGVhcmFuY2U/OiBzdHJpbmc7XG4gIHBhcmVudFdpbmRvd0lkPzogbnVtYmVyO1xuICBib3VuZHM/OiBFbGVjdHJvbi5SZWN0YW5nbGU7XG59XG5cbmludGVyZmFjZSBDb2RleENyZWF0ZVZpZXdPcHRpb25zIHtcbiAgcm91dGU6IHN0cmluZztcbiAgaG9zdElkPzogc3RyaW5nO1xuICBhcHBlYXJhbmNlPzogc3RyaW5nO1xufVxuXG50eXBlIE93bFZpZXdBdHRhY2hNb2RlID0gXCJjb250ZW50Vmlld1wiIHwgXCJicm93c2VyVmlld1wiO1xuXG5pbnRlcmZhY2UgTWFuYWdlZE93bFZpZXcge1xuICBrZXk6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBpZDogc3RyaW5nO1xuICB2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldztcbiAgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGw7XG4gIGF0dGFjaE1vZGU6IE93bFZpZXdBdHRhY2hNb2RlIHwgbnVsbDtcbiAgZGlzcG9zZUJpbmRpbmdzOiBBcnJheTwoKSA9PiB2b2lkPjtcbiAgZGlzcG9zZWQ6IGJvb2xlYW47XG59XG5cbmNvbnN0IHR3ZWFrU3RhdGUgPSB7XG4gIGRpc2NvdmVyZWQ6IFtdIGFzIERpc2NvdmVyZWRUd2Vha1tdLFxuICBsb2FkZWRNYWluOiBuZXcgTWFwPHN0cmluZywgTG9hZGVkTWFpblR3ZWFrPigpLFxufTtcblxuY29uc3QgbmF0aXZlQnJpZGdlID0gbmV3IE5hdGl2ZUJyaWRnZShsb2csIHtcbiAgbmF0aXZlSG9zdFBhdGg6IGpvaW4ocnVudGltZURpciwgXCJuYXRpdmVcIiwgXCJjb2RleHBwX25hdGl2ZV9ob3N0Lm5vZGVcIiksXG59KTtcbmNvbnN0IG93bFZpZXdzID0gbmV3IE1hcDxzdHJpbmcsIE1hbmFnZWRPd2xWaWV3PigpO1xuXG5jb25zdCB0d2Vha0xpZmVjeWNsZURlcHMgPSB7XG4gIGxvZ0luZm86IChtZXNzYWdlOiBzdHJpbmcpID0+IGxvZyhcImluZm9cIiwgbWVzc2FnZSksXG4gIHNldFR3ZWFrRW5hYmxlZCxcbiAgc3RvcEFsbE1haW5Ud2Vha3MsXG4gIGNsZWFyVHdlYWtNb2R1bGVDYWNoZSxcbiAgbG9hZEFsbE1haW5Ud2Vha3MsXG4gIGJyb2FkY2FzdFJlbG9hZCxcbn07XG5cbi8vIDEuIEhvb2sgZXZlcnkgc2Vzc2lvbiBzbyBvdXIgcHJlbG9hZCBydW5zIGluIGV2ZXJ5IHJlbmRlcmVyLlxuLy9cbi8vIFdlIHVzZSBFbGVjdHJvbidzIG1vZGVybiBgc2Vzc2lvbi5yZWdpc3RlclByZWxvYWRTY3JpcHRgIEFQSSAoYWRkZWQgaW5cbi8vIEVsZWN0cm9uIDM1KS4gVGhlIGRlcHJlY2F0ZWQgYHNldFByZWxvYWRzYCBwYXRoIHNpbGVudGx5IG5vLW9wcyBpbiBzb21lXG4vLyBjb25maWd1cmF0aW9ucyAobm90YWJseSB3aXRoIHNhbmRib3hlZCByZW5kZXJlcnMpLCBzbyByZWdpc3RlclByZWxvYWRTY3JpcHRcbi8vIGlzIHRoZSBvbmx5IHJlbGlhYmxlIHdheSB0byBpbmplY3QgaW50byBDb2RleCdzIEJyb3dzZXJXaW5kb3dzLlxuZnVuY3Rpb24gcmVnaXN0ZXJQcmVsb2FkKHM6IEVsZWN0cm9uLlNlc3Npb24sIGxhYmVsOiBzdHJpbmcpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZWcgPSAocyBhcyB1bmtub3duIGFzIHtcbiAgICAgIHJlZ2lzdGVyUHJlbG9hZFNjcmlwdD86IChvcHRzOiB7XG4gICAgICAgIHR5cGU/OiBcImZyYW1lXCIgfCBcInNlcnZpY2Utd29ya2VyXCI7XG4gICAgICAgIGlkPzogc3RyaW5nO1xuICAgICAgICBmaWxlUGF0aDogc3RyaW5nO1xuICAgICAgfSkgPT4gc3RyaW5nO1xuICAgIH0pLnJlZ2lzdGVyUHJlbG9hZFNjcmlwdDtcbiAgICBpZiAodHlwZW9mIHJlZyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZWcuY2FsbChzLCB7IHR5cGU6IFwiZnJhbWVcIiwgZmlsZVBhdGg6IFBSRUxPQURfUEFUSCwgaWQ6IFwiY29kZXgtcGx1c3BsdXNcIiB9KTtcbiAgICAgIGxvZyhcImluZm9cIiwgYHByZWxvYWQgcmVnaXN0ZXJlZCAocmVnaXN0ZXJQcmVsb2FkU2NyaXB0KSBvbiAke2xhYmVsfTpgLCBQUkVMT0FEX1BBVEgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBGYWxsYmFjayBmb3Igb2xkZXIgRWxlY3Ryb24gdmVyc2lvbnMuXG4gICAgY29uc3QgZXhpc3RpbmcgPSBzLmdldFByZWxvYWRzKCk7XG4gICAgaWYgKCFleGlzdGluZy5pbmNsdWRlcyhQUkVMT0FEX1BBVEgpKSB7XG4gICAgICBzLnNldFByZWxvYWRzKFsuLi5leGlzdGluZywgUFJFTE9BRF9QQVRIXSk7XG4gICAgfVxuICAgIGxvZyhcImluZm9cIiwgYHByZWxvYWQgcmVnaXN0ZXJlZCAoc2V0UHJlbG9hZHMpIG9uICR7bGFiZWx9OmAsIFBSRUxPQURfUEFUSCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yICYmIGUubWVzc2FnZS5pbmNsdWRlcyhcImV4aXN0aW5nIElEXCIpKSB7XG4gICAgICBsb2coXCJpbmZvXCIsIGBwcmVsb2FkIGFscmVhZHkgcmVnaXN0ZXJlZCBvbiAke2xhYmVsfTpgLCBQUkVMT0FEX1BBVEgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsb2coXCJlcnJvclwiLCBgcHJlbG9hZCByZWdpc3RyYXRpb24gb24gJHtsYWJlbH0gZmFpbGVkOmAsIGUpO1xuICB9XG59XG5cbmFwcC53aGVuUmVhZHkoKS50aGVuKCgpID0+IHtcbiAgbG9nKFwiaW5mb1wiLCBcImFwcCByZWFkeSBmaXJlZFwiKTtcbiAgaWYgKGlzQ29kZXhQbHVzUGx1c1NhZmVNb2RlRW5hYmxlZCgpKSB7XG4gICAgbG9nKFwid2FyblwiLCBcInNhZmUgbW9kZSBpcyBlbmFibGVkOyBwcmVsb2FkIHdpbGwgbm90IGJlIHJlZ2lzdGVyZWRcIik7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJlZ2lzdGVyUHJlbG9hZChzZXNzaW9uLmRlZmF1bHRTZXNzaW9uLCBcImRlZmF1bHRTZXNzaW9uXCIpO1xuICBtYXliZVN0YXJ0QnJvd3NlclVpU2VydmVyKHtcbiAgICBnZXRXaW5kb3dTZXJ2aWNlczogZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcyxcbiAgICBsb2csXG4gIH0pO1xufSk7XG5cbmFwcC5vbihcInNlc3Npb24tY3JlYXRlZFwiLCAocykgPT4ge1xuICBpZiAoaXNDb2RleFBsdXNQbHVzU2FmZU1vZGVFbmFibGVkKCkpIHJldHVybjtcbiAgcmVnaXN0ZXJQcmVsb2FkKHMsIFwic2Vzc2lvbi1jcmVhdGVkXCIpO1xufSk7XG5cbmFwcC5vbihcIndlYi1jb250ZW50cy1jcmVhdGVkXCIsIChfZSwgd2MpID0+IHtcbiAgdHJ5IHtcbiAgICBpZiAoREVCVUdfV0VCX0NPTlRFTlRTX0xPRykge1xuICAgICAgY29uc3Qgd3AgPSAod2MgYXMgdW5rbm93biBhcyB7IGdldExhc3RXZWJQcmVmZXJlbmNlcz86ICgpID0+IFJlY29yZDxzdHJpbmcsIHVua25vd24+IH0pXG4gICAgICAgIC5nZXRMYXN0V2ViUHJlZmVyZW5jZXM/LigpO1xuICAgICAgbG9nKFwiaW5mb1wiLCBcIndlYi1jb250ZW50cy1jcmVhdGVkXCIsIHtcbiAgICAgICAgaWQ6IHdjLmlkLFxuICAgICAgICB0eXBlOiB3Yy5nZXRUeXBlKCksXG4gICAgICAgIHNlc3Npb25Jc0RlZmF1bHQ6IHdjLnNlc3Npb24gPT09IHNlc3Npb24uZGVmYXVsdFNlc3Npb24sXG4gICAgICAgIHNhbmRib3g6IHdwPy5zYW5kYm94LFxuICAgICAgICBjb250ZXh0SXNvbGF0aW9uOiB3cD8uY29udGV4dElzb2xhdGlvbixcbiAgICAgIH0pO1xuICAgIH1cbiAgICB3Yy5vbihcInByZWxvYWQtZXJyb3JcIiwgKF9ldiwgcCwgZXJyKSA9PiB7XG4gICAgICBsb2coXCJlcnJvclwiLCBgd2MgJHt3Yy5pZH0gcHJlbG9hZC1lcnJvciBwYXRoPSR7cH1gLCBTdHJpbmcoZXJyPy5zdGFjayA/PyBlcnIpKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcImVycm9yXCIsIFwid2ViLWNvbnRlbnRzLWNyZWF0ZWQgaGFuZGxlciBmYWlsZWQ6XCIsIFN0cmluZygoZSBhcyBFcnJvcik/LnN0YWNrID8/IGUpKTtcbiAgfVxufSk7XG5cbmxvZyhcImluZm9cIiwgXCJtYWluLnRzIGV2YWx1YXRlZDsgYXBwLmlzUmVhZHk9XCIgKyBhcHAuaXNSZWFkeSgpKTtcbmlmIChpc0NvZGV4UGx1c1BsdXNTYWZlTW9kZUVuYWJsZWQoKSkge1xuICBsb2coXCJ3YXJuXCIsIFwic2FmZSBtb2RlIGlzIGVuYWJsZWQ7IHR3ZWFrcyB3aWxsIG5vdCBiZSBsb2FkZWRcIik7XG59XG5cbi8vIDIuIEluaXRpYWwgdHdlYWsgZGlzY292ZXJ5ICsgbWFpbi1zY29wZSBsb2FkLlxubG9hZEFsbE1haW5Ud2Vha3MoKTtcblxuYXBwLm9uKFwid2lsbC1xdWl0XCIsICgpID0+IHtcbiAgc3RvcEFsbE1haW5Ud2Vha3MoKTtcbiAgbmF0aXZlQnJpZGdlLmRpc3Bvc2VBbGwoKTtcbiAgZGlzcG9zZUFsbE93bFZpZXdzKCk7XG4gIC8vIEJlc3QtZWZmb3J0IGZsdXNoIG9mIGFueSBwZW5kaW5nIHN0b3JhZ2Ugd3JpdGVzLlxuICBmb3IgKGNvbnN0IHQgb2YgdHdlYWtTdGF0ZS5sb2FkZWRNYWluLnZhbHVlcygpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHQuc3RvcmFnZS5mbHVzaCgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxufSk7XG5cbi8vIDMuIElQQzogZXhwb3NlIHR3ZWFrIG1ldGFkYXRhICsgcmV2ZWFsLWluLWZpbmRlci5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpsaXN0LXR3ZWFrc1wiLCBhc3luYyAoKSA9PiB7XG4gIGF3YWl0IFByb21pc2UuYWxsKHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5tYXAoKHQpID0+IGVuc3VyZVR3ZWFrVXBkYXRlQ2hlY2sodCkpKTtcbiAgY29uc3QgdXBkYXRlQ2hlY2tzID0gcmVhZFN0YXRlKCkudHdlYWtVcGRhdGVDaGVja3MgPz8ge307XG4gIHJldHVybiB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiAoe1xuICAgIG1hbmlmZXN0OiB0Lm1hbmlmZXN0LFxuICAgIGVudHJ5OiB0LmVudHJ5LFxuICAgIGRpcjogdC5kaXIsXG4gICAgZW50cnlFeGlzdHM6IGV4aXN0c1N5bmModC5lbnRyeSksXG4gICAgZW5hYmxlZDogaXNUd2Vha0VuYWJsZWQodC5tYW5pZmVzdC5pZCksXG4gICAgdXBkYXRlOiB1cGRhdGVDaGVja3NbdC5tYW5pZmVzdC5pZF0gPz8gbnVsbCxcbiAgfSkpO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpnZXQtdHdlYWstZW5hYmxlZFwiLCAoX2UsIGlkOiBzdHJpbmcpID0+IGlzVHdlYWtFbmFibGVkKGlkKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6c2V0LXR3ZWFrLWVuYWJsZWRcIiwgKF9lLCBpZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gIHJldHVybiBzZXRUd2Vha0VuYWJsZWRBbmRSZWxvYWQoaWQsIGVuYWJsZWQsIHR3ZWFrTGlmZWN5Y2xlRGVwcyk7XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC1jb25maWdcIiwgKCkgPT4ge1xuICBjb25zdCBzID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGluc3RhbGxlclN0YXRlID0gcmVhZEluc3RhbGxlclN0YXRlKCk7XG4gIGNvbnN0IHNvdXJjZVJvb3QgPSBpbnN0YWxsZXJTdGF0ZT8uc291cmNlUm9vdCA/PyBmYWxsYmFja1NvdXJjZVJvb3QoKTtcbiAgcmV0dXJuIHtcbiAgICB2ZXJzaW9uOiBDT0RFWF9QTFVTUExVU19WRVJTSU9OLFxuICAgIGF1dG9VcGRhdGU6IHMuY29kZXhQbHVzUGx1cz8uYXV0b1VwZGF0ZSAhPT0gZmFsc2UsXG4gICAgc2FmZU1vZGU6IHMuY29kZXhQbHVzUGx1cz8uc2FmZU1vZGUgPT09IHRydWUsXG4gICAgdXBkYXRlQ2hhbm5lbDogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCIsXG4gICAgdXBkYXRlUmVwbzogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgdXBkYXRlUmVmOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlZiA/PyBcIlwiLFxuICAgIHVwZGF0ZUNoZWNrOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoZWNrID8/IG51bGwsXG4gICAgc2VsZlVwZGF0ZTogcmVhZFNlbGZVcGRhdGVTdGF0ZSgpLFxuICAgIGluc3RhbGxhdGlvblNvdXJjZTogZGVzY3JpYmVJbnN0YWxsYXRpb25Tb3VyY2Uoc291cmNlUm9vdCksXG4gIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOnNldC1hdXRvLXVwZGF0ZVwiLCAoX2UsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgc2V0Q29kZXhQbHVzUGx1c0F1dG9VcGRhdGUoISFlbmFibGVkKTtcbiAgcmV0dXJuIHsgYXV0b1VwZGF0ZTogaXNDb2RleFBsdXNQbHVzQXV0b1VwZGF0ZUVuYWJsZWQoKSB9O1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpzZXQtdXBkYXRlLWNvbmZpZ1wiLCAoX2UsIGNvbmZpZzoge1xuICB1cGRhdGVDaGFubmVsPzogU2VsZlVwZGF0ZUNoYW5uZWw7XG4gIHVwZGF0ZVJlcG8/OiBzdHJpbmc7XG4gIHVwZGF0ZVJlZj86IHN0cmluZztcbn0pID0+IHtcbiAgc2V0Q29kZXhQbHVzUGx1c1VwZGF0ZUNvbmZpZyhjb25maWcpO1xuICBjb25zdCBzID0gcmVhZFN0YXRlKCk7XG4gIHJldHVybiB7XG4gICAgdXBkYXRlQ2hhbm5lbDogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVDaGFubmVsID8/IFwic3RhYmxlXCIsXG4gICAgdXBkYXRlUmVwbzogcy5jb2RleFBsdXNQbHVzPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgdXBkYXRlUmVmOiBzLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZVJlZiA/PyBcIlwiLFxuICB9O1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjaGVjay1jb2RleHBwLXVwZGF0ZVwiLCBhc3luYyAoX2UsIGZvcmNlPzogYm9vbGVhbikgPT4ge1xuICByZXR1cm4gZW5zdXJlQ29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrKGZvcmNlID09PSB0cnVlKTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cnVuLWNvZGV4cHAtdXBkYXRlXCIsIGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc291cmNlUm9vdCA9IHJlYWRJbnN0YWxsZXJTdGF0ZSgpPy5zb3VyY2VSb290ID8/IGZhbGxiYWNrU291cmNlUm9vdCgpO1xuICBpZiAoIXNvdXJjZVJvb3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCsrIHNvdXJjZSBDTEkgd2FzIG5vdCBmb3VuZC4gUnVuIHRoZSBpbnN0YWxsZXIgb25jZSwgdGhlbiB0cnkgYWdhaW4uXCIpO1xuICB9XG4gIGNvbnN0IGNsaSA9IGpvaW4oc291cmNlUm9vdCwgXCJwYWNrYWdlc1wiLCBcImluc3RhbGxlclwiLCBcImRpc3RcIiwgXCJjbGkuanNcIik7XG4gIGlmICghZXhpc3RzU3luYyhjbGkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXgrKyBzb3VyY2UgQ0xJIHdhcyBub3QgZm91bmQuIFJ1biB0aGUgaW5zdGFsbGVyIG9uY2UsIHRoZW4gdHJ5IGFnYWluLlwiKTtcbiAgfVxuICBjb25zdCBwZW5kaW5nID0gbWFya1NlbGZVcGRhdGVTdGFydGVkKHNvdXJjZVJvb3QpO1xuICBzdGFydEluc3RhbGxlZENsaShjbGksIFtcInVwZGF0ZVwiLCBcIi0td2F0Y2hlclwiXSk7XG4gIHJldHVybiBwZW5kaW5nO1xufSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpnZXQtd2F0Y2hlci1oZWFsdGhcIiwgKCkgPT4gZ2V0V2F0Y2hlckhlYWx0aCh1c2VyUm9vdCEpKTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmdldC10d2Vhay1zdG9yZVwiLCBhc3luYyAoKSA9PiB7XG4gIGNvbnN0IHN0b3JlID0gYXdhaXQgZmV0Y2hUd2Vha1N0b3JlUmVnaXN0cnkoKTtcbiAgY29uc3QgcmVnaXN0cnkgPSBzdG9yZS5yZWdpc3RyeTtcbiAgY29uc3QgaW5zdGFsbGVkID0gbmV3IE1hcCh0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiBbdC5tYW5pZmVzdC5pZCwgdF0pKTtcbiAgY29uc3QgZW50cmllcyA9IHNodWZmbGVTdG9yZUVudHJpZXMocmVnaXN0cnkuZW50cmllcywgcmFuZG9tSW50KTtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZWdpc3RyeSxcbiAgICBzb3VyY2VVcmw6IFRXRUFLX1NUT1JFX0lOREVYX1VSTCxcbiAgICBmZXRjaGVkQXQ6IHN0b3JlLmZldGNoZWRBdCxcbiAgICBlbnRyaWVzOiBlbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICAgIGNvbnN0IGxvY2FsID0gaW5zdGFsbGVkLmdldChlbnRyeS5pZCk7XG4gICAgICBjb25zdCBwbGF0Zm9ybSA9IHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkoZW50cnkpO1xuICAgICAgY29uc3QgcnVudGltZSA9IHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eShlbnRyeSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5lbnRyeSxcbiAgICAgICAgcGxhdGZvcm0sXG4gICAgICAgIHJ1bnRpbWUsXG4gICAgICAgIGluc3RhbGxlZDogbG9jYWxcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgdmVyc2lvbjogbG9jYWwubWFuaWZlc3QudmVyc2lvbixcbiAgICAgICAgICAgICAgZW5hYmxlZDogaXNUd2Vha0VuYWJsZWQobG9jYWwubWFuaWZlc3QuaWQpLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIH07XG4gICAgfSksXG4gIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmluc3RhbGwtc3RvcmUtdHdlYWtcIiwgYXN5bmMgKF9lLCBpZDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHsgcmVnaXN0cnkgfSA9IGF3YWl0IGZldGNoVHdlYWtTdG9yZVJlZ2lzdHJ5KCk7XG4gIGNvbnN0IGVudHJ5ID0gcmVnaXN0cnkuZW50cmllcy5maW5kKChjYW5kaWRhdGUpID0+IGNhbmRpZGF0ZS5pZCA9PT0gaWQpO1xuICBpZiAoIWVudHJ5KSB0aHJvdyBuZXcgRXJyb3IoYFR3ZWFrIHN0b3JlIGVudHJ5IG5vdCBmb3VuZDogJHtpZH1gKTtcbiAgYXNzZXJ0U3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJsZShlbnRyeSk7XG4gIGFzc2VydFN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJsZShlbnRyeSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTik7XG4gIGF3YWl0IGluc3RhbGxTdG9yZVR3ZWFrKGVudHJ5KTtcbiAgcmVsb2FkVHdlYWtzKFwic3RvcmUtaW5zdGFsbFwiLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICByZXR1cm4geyBpbnN0YWxsZWQ6IGVudHJ5LmlkIH07XG59KTtcblxuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOnByZXBhcmUtdHdlYWstc3RvcmUtc3VibWlzc2lvblwiLCBhc3luYyAoX2UsIHJlcG9JbnB1dDogc3RyaW5nKSA9PiB7XG4gIHJldHVybiBwcmVwYXJlVHdlYWtTdG9yZVN1Ym1pc3Npb24ocmVwb0lucHV0KTtcbn0pO1xuXG4vLyBTYW5kYm94ZWQgcmVuZGVyZXIgcHJlbG9hZCBjYW4ndCB1c2UgTm9kZSBmcyB0byByZWFkIHR3ZWFrIHNvdXJjZS4gTWFpblxuLy8gcmVhZHMgaXQgb24gdGhlIHJlbmRlcmVyJ3MgYmVoYWxmLiBQYXRoIG11c3QgbGl2ZSB1bmRlciB0d2Vha3NEaXIgZm9yXG4vLyBzZWN1cml0eSBcdTIwMTQgd2UgcmVmdXNlIGFueXRoaW5nIGVsc2UuXG5mdW5jdGlvbiByZWFkVHdlYWtTb3VyY2UoZW50cnlQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByZXNvbHZlZCA9IHJlc29sdmUoZW50cnlQYXRoKTtcbiAgaWYgKCFpc1BhdGhJbnNpZGUoVFdFQUtTX0RJUiwgcmVzb2x2ZWQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwicGF0aCBvdXRzaWRlIHR3ZWFrcyBkaXJcIik7XG4gIH1cbiAgcmV0dXJuIHJlcXVpcmUoXCJub2RlOmZzXCIpLnJlYWRGaWxlU3luYyhyZXNvbHZlZCwgXCJ1dGY4XCIpO1xufVxuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2VcIiwgKF9lLCBlbnRyeVBhdGg6IHN0cmluZykgPT4ge1xuICByZXR1cm4gcmVhZFR3ZWFrU291cmNlKGVudHJ5UGF0aCk7XG59KTtcblxuaXBjTWFpbi5vbihcImNvZGV4cHA6cmVhZC10d2Vhay1zb3VyY2Utc3luY1wiLCAoZXZlbnQsIGVudHJ5UGF0aDogc3RyaW5nKSA9PiB7XG4gIHRyeSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSB7IG9rOiB0cnVlLCBzb3VyY2U6IHJlYWRUd2Vha1NvdXJjZShlbnRyeVBhdGgpIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgZXZlbnQucmV0dXJuVmFsdWUgPSB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBlcnJvcjogU3RyaW5nKChlcnJvciBhcyBFcnJvcik/Lm1lc3NhZ2UgPz8gZXJyb3IpLFxuICAgIH07XG4gIH1cbn0pO1xuXG4vKipcbiAqIFJlYWQgYW4gYXJiaXRyYXJ5IGFzc2V0IGZpbGUgZnJvbSBpbnNpZGUgYSB0d2VhaydzIGRpcmVjdG9yeSBhbmQgcmV0dXJuIGl0XG4gKiBhcyBhIGBkYXRhOmAgVVJMLiBVc2VkIGJ5IHRoZSBzZXR0aW5ncyBpbmplY3RvciB0byByZW5kZXIgbWFuaWZlc3QgaWNvbnNcbiAqICh0aGUgcmVuZGVyZXIgaXMgc2FuZGJveGVkOyBgZmlsZTovL2Agd29uJ3QgbG9hZCkuXG4gKlxuICogU2VjdXJpdHk6IGNhbGxlciBwYXNzZXMgYHR3ZWFrRGlyYCBhbmQgYHJlbFBhdGhgOyB3ZSAoMSkgcmVxdWlyZSB0d2Vha0RpclxuICogdG8gbGl2ZSB1bmRlciBUV0VBS1NfRElSLCAoMikgcmVzb2x2ZSByZWxQYXRoIGFnYWluc3QgaXQgYW5kIHJlLWNoZWNrIHRoZVxuICogcmVzdWx0IHN0aWxsIGxpdmVzIHVuZGVyIFRXRUFLU19ESVIsICgzKSBjYXAgb3V0cHV0IHNpemUgYXQgMSBNaUIuXG4gKi9cbmNvbnN0IEFTU0VUX01BWF9CWVRFUyA9IDEwMjQgKiAxMDI0O1xuY29uc3QgTUlNRV9CWV9FWFQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIFwiLnBuZ1wiOiBcImltYWdlL3BuZ1wiLFxuICBcIi5qcGdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLmpwZWdcIjogXCJpbWFnZS9qcGVnXCIsXG4gIFwiLmdpZlwiOiBcImltYWdlL2dpZlwiLFxuICBcIi53ZWJwXCI6IFwiaW1hZ2Uvd2VicFwiLFxuICBcIi5zdmdcIjogXCJpbWFnZS9zdmcreG1sXCIsXG4gIFwiLmljb1wiOiBcImltYWdlL3gtaWNvblwiLFxufTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6cmVhZC10d2Vhay1hc3NldFwiLFxuICAoX2UsIHR3ZWFrRGlyOiBzdHJpbmcsIHJlbFBhdGg6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGZzID0gcmVxdWlyZShcIm5vZGU6ZnNcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6ZnNcIik7XG4gICAgY29uc3QgZGlyID0gcmVzb2x2ZSh0d2Vha0Rpcik7XG4gICAgaWYgKCFpc1BhdGhJbnNpZGUoVFdFQUtTX0RJUiwgZGlyKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwidHdlYWtEaXIgb3V0c2lkZSB0d2Vha3MgZGlyXCIpO1xuICAgIH1cbiAgICBjb25zdCBmdWxsID0gcmVzb2x2ZShkaXIsIHJlbFBhdGgpO1xuICAgIGlmICghaXNQYXRoSW5zaWRlKGRpciwgZnVsbCkgfHwgZnVsbCA9PT0gZGlyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYXRoIHRyYXZlcnNhbFwiKTtcbiAgICB9XG4gICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKGZ1bGwpO1xuICAgIGlmIChzdGF0LnNpemUgPiBBU1NFVF9NQVhfQllURVMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgYXNzZXQgdG9vIGxhcmdlICgke3N0YXQuc2l6ZX0gPiAke0FTU0VUX01BWF9CWVRFU30pYCk7XG4gICAgfVxuICAgIGNvbnN0IGV4dCA9IGZ1bGwuc2xpY2UoZnVsbC5sYXN0SW5kZXhPZihcIi5cIikpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgbWltZSA9IE1JTUVfQllfRVhUW2V4dF0gPz8gXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIjtcbiAgICBjb25zdCBidWYgPSBmcy5yZWFkRmlsZVN5bmMoZnVsbCk7XG4gICAgcmV0dXJuIGBkYXRhOiR7bWltZX07YmFzZTY0LCR7YnVmLnRvU3RyaW5nKFwiYmFzZTY0XCIpfWA7XG4gIH0sXG4pO1xuXG4vLyBTYW5kYm94ZWQgcHJlbG9hZCBjYW4ndCB3cml0ZSBsb2dzIHRvIGRpc2s7IGZvcndhcmQgdG8gdXMgdmlhIElQQy5cbmlwY01haW4ub24oXCJjb2RleHBwOnByZWxvYWQtbG9nXCIsIChfZSwgbGV2ZWw6IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIG1zZzogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IGx2bCA9IGxldmVsID09PSBcImVycm9yXCIgfHwgbGV2ZWwgPT09IFwid2FyblwiID8gbGV2ZWwgOiBcImluZm9cIjtcbiAgdHJ5IHtcbiAgICBhcHBlbmRDYXBwZWRMb2coam9pbihMT0dfRElSLCBcInByZWxvYWQubG9nXCIpLCBgWyR7bmV3IERhdGUoKS50b0lTT1N0cmluZygpfV0gWyR7bHZsfV0gJHttc2d9XFxuYCk7XG4gIH0gY2F0Y2gge31cbn0pO1xuXG4vLyBTYW5kYm94LXNhZmUgZmlsZXN5c3RlbSBvcHMgZm9yIHJlbmRlcmVyLXNjb3BlIHR3ZWFrcy4gRWFjaCB0d2VhayBnZXRzXG4vLyBhIHNhbmRib3hlZCBkaXIgdW5kZXIgdXNlclJvb3QvdHdlYWstZGF0YS88aWQ+LiBSZW5kZXJlciBzaWRlIGNhbGxzIHRoZXNlXG4vLyBvdmVyIElQQyBpbnN0ZWFkIG9mIHVzaW5nIE5vZGUgZnMgZGlyZWN0bHkuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6dHdlYWstZnNcIiwgKF9lLCBvcDogc3RyaW5nLCBpZDogc3RyaW5nLCBwOiBzdHJpbmcsIGM/OiBzdHJpbmcpID0+IHtcbiAgaWYgKCEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QoaWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgdHdlYWsgaWRcIik7XG4gIGNvbnN0IGRpciA9IGpvaW4odXNlclJvb3QhLCBcInR3ZWFrLWRhdGFcIiwgaWQpO1xuICBta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3QgZnVsbCA9IHJlc29sdmUoZGlyLCBwKTtcbiAgaWYgKCFpc1BhdGhJbnNpZGUoZGlyLCBmdWxsKSB8fCBmdWxsID09PSBkaXIpIHRocm93IG5ldyBFcnJvcihcInBhdGggdHJhdmVyc2FsXCIpO1xuICBjb25zdCBmcyA9IHJlcXVpcmUoXCJub2RlOmZzXCIpIGFzIHR5cGVvZiBpbXBvcnQoXCJub2RlOmZzXCIpO1xuICBzd2l0Y2ggKG9wKSB7XG4gICAgY2FzZSBcInJlYWRcIjogcmV0dXJuIGZzLnJlYWRGaWxlU3luYyhmdWxsLCBcInV0ZjhcIik7XG4gICAgY2FzZSBcIndyaXRlXCI6IHJldHVybiBmcy53cml0ZUZpbGVTeW5jKGZ1bGwsIGMgPz8gXCJcIiwgXCJ1dGY4XCIpO1xuICAgIGNhc2UgXCJleGlzdHNcIjogcmV0dXJuIGZzLmV4aXN0c1N5bmMoZnVsbCk7XG4gICAgY2FzZSBcImRhdGFEaXJcIjogcmV0dXJuIGRpcjtcbiAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gb3A6ICR7b3B9YCk7XG4gIH1cbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6dXNlci1wYXRoc1wiLCAoKSA9PiAoe1xuICB1c2VyUm9vdCxcbiAgcnVudGltZURpcixcbiAgdHdlYWtzRGlyOiBUV0VBS1NfRElSLFxuICBsb2dEaXI6IExPR19ESVIsXG59KSk7XG5cbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC1ydW50aW1lLWluZm9cIiwgKCkgPT4gY3VycmVudFJ1bnRpbWVJbmZvKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXJ1bnRpbWUtY2FwYWJpbGl0aWVzXCIsICgpID0+IGN1cnJlbnRSdW50aW1lQ2FwYWJpbGl0aWVzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LWNkcC1zdGF0dXNcIiwgKCkgPT4gZ2V0Q2RwU3RhdHVzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LWNkcC10YXJnZXRzXCIsICgpID0+IGxpc3RDZHBUYXJnZXRzKCkpO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDptb2RlbC1nZW5lcmF0ZS10ZXh0XCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucykgPT4ge1xuICAgIGFzc2VydFR3ZWFrUGVybWlzc2lvbkZvcklkKHR3ZWFrSWQsIFwibW9kZWxcIik7XG4gICAgcmV0dXJuIGdlbmVyYXRlTW9kZWxUZXh0KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bW9kZWwtZ2VuZXJhdGUtb2JqZWN0XCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVPYmplY3RPcHRpb25zKSA9PiB7XG4gICAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgXCJtb2RlbFwiKTtcbiAgICByZXR1cm4gZ2VuZXJhdGVNb2RlbE9iamVjdCh0d2Vha0lkLCBvcHRpb25zKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWNyZWF0ZVwiLCAoX2UsIG9wdHM6IENvZGV4Q3JlYXRlV2luZG93T3B0aW9ucykgPT4ge1xuICByZXR1cm4gY3JlYXRlQ29kZXhXaW5kb3cob3B0cyk7XG59KTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpjb2RleC13aW5kb3ctcHJpbWFyeVwiLCAoKSA9PiBnZXRQcmltYXJ5Q29kZXhXaW5kb3dSZWYoKSk7XG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29kZXgtd2luZG93LWZvY3VzXCIsIChfZSwgd2luZG93SWQ6IG51bWJlcikgPT4gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZCkpO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXdpbmRvdy1zaG93XCIsIChfZSwgd2luZG93SWQ6IG51bWJlcikgPT4gc2hvd0NvZGV4V2luZG93KHdpbmRvd0lkKSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOmNvZGV4LXZpZXctY3JlYXRlXCIsXG4gIGFzeW5jIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBDb2RleFZpZXdDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgdHdlYWsgPSBhc3NlcnRUd2Vha1ZpZXdQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCk7XG4gICAgY29uc3QgcmVmID0gYXdhaXQgY3JlYXRlT3dsVmlldyh7IGlkOiB0d2Vhay5tYW5pZmVzdC5pZCwgZGlyOiB0d2Vhay5kaXIgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiByZWYuaWQsXG4gICAgICB3ZWJDb250ZW50c0lkOiByZWYud2ViQ29udGVudHNJZCxcbiAgICAgIHBhcmVudFdpbmRvd0lkOiByZWYucGFyZW50V2luZG93SWQsXG4gICAgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOmNvZGV4LXZpZXctY2FsbFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgdmlld0lkOiBzdHJpbmcsIG1ldGhvZDogc3RyaW5nLCBhcmc/OiB1bmtub3duLCBhcmcyPzogdW5rbm93bikgPT4ge1xuICAgIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkKTtcbiAgICByZXR1cm4gY2FsbE93bFZpZXcodHdlYWtJZCwgdmlld0lkLCBtZXRob2QsIGFyZywgYXJnMik7XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOmNvZGV4LXZpZXctZGlzcG9zZS10d2Vha1wiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha0lkKHR3ZWFrSWQpO1xuICBkaXNwb3NlT3dsVmlld3NGb3JUd2Vhayh0d2Vha0lkKTtcbn0pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpuYXRpdmUtbG9hZC1tb2R1bGVcIixcbiAgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZU1vZHVsZUxvYWRPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gbmF0aXZlQnJpZGdlLmxvYWRNb2R1bGUodHdlYWtDb250ZXh0KHR3ZWFrSWQsIFwibmF0aXZlLW1vZHVsZVwiKSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHsgaWQ6IHJlZi5pZCwga2luZDogcmVmLmtpbmQgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtcmVxdWVzdFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgbW9kdWxlSWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHBheWxvYWQ/OiB1bmtub3duLCB0aW1lb3V0TXM/OiBudW1iZXIpID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1tb2R1bGVcIik7XG4gICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5yZXF1ZXN0TW9kdWxlKHR3ZWFrSWQsIG1vZHVsZUlkLCBtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcyk7XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXCJjb2RleHBwOm5hdGl2ZS1tb2R1bGUtZGlzcG9zZVwiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgbW9kdWxlSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1tb2R1bGVcIik7XG4gIHJldHVybiBuYXRpdmVCcmlkZ2UuZGlzcG9zZU1vZHVsZSh0d2Vha0lkLCBtb2R1bGVJZCk7XG59KTtcbmlwY01haW4uaGFuZGxlKFwiY29kZXhwcDpuYXRpdmUtZGlzcG9zZS10d2Vha1wiLCAoX2UsIHR3ZWFrSWQ6IHN0cmluZykgPT4ge1xuICBhc3NlcnRUd2Vha0lkKHR3ZWFrSWQpO1xuICBuYXRpdmVCcmlkZ2UuZGlzcG9zZVR3ZWFrKHR3ZWFrSWQpO1xufSk7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1jcmVhdGUtcGFuZWxcIixcbiAgYXN5bmMgKF9lLCB0d2Vha0lkOiBzdHJpbmcsIG9wdGlvbnM6IE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IHJlZiA9IGF3YWl0IG5hdGl2ZUJyaWRnZS5jcmVhdGVQYW5lbCh0d2Vha0NvbnRleHQodHdlYWtJZCwgXCJuYXRpdmUtdmlld1wiKSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHsgaWQ6IHJlZi5pZCwgd2luZG93SWQ6IHJlZi53aW5kb3dJZCB9O1xuICB9LFxuKTtcbmlwY01haW4uaGFuZGxlKFxuICBcImNvZGV4cHA6bmF0aXZlLWF0dGFjaC12aWV3XCIsXG4gIGFzeW5jIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucykgPT4ge1xuICAgIGNvbnN0IHJlZiA9IGF3YWl0IG5hdGl2ZUJyaWRnZS5hdHRhY2hWaWV3KHR3ZWFrQ29udGV4dCh0d2Vha0lkLCBcIm5hdGl2ZS12aWV3XCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkIH07XG4gIH0sXG4pO1xuaXBjTWFpbi5oYW5kbGUoXG4gIFwiY29kZXhwcDpuYXRpdmUtaW5zdGFuY2UtY2FsbFwiLFxuICBhc3luYyAoX2UsIHR3ZWFrSWQ6IHN0cmluZywga2luZDogXCJwYW5lbFwiIHwgXCJ2aWV3XCIsIGluc3RhbmNlSWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIGFyZz86IHVua25vd24pID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS12aWV3XCIpO1xuICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuY2FsbEluc3RhbmNlKHR3ZWFrSWQsIGtpbmQsIGluc3RhbmNlSWQsIG1ldGhvZCwgYXJnKTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1sYXVuY2gtaGVscGVyXCIsXG4gIChfZSwgdHdlYWtJZDogc3RyaW5nLCBvcHRpb25zOiBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zKSA9PiB7XG4gICAgY29uc3QgcmVmID0gbmF0aXZlQnJpZGdlLmxhdW5jaEhlbHBlcih0d2Vha0NvbnRleHQodHdlYWtJZCwgXCJuYXRpdmUtaGVscGVyXCIpLCBvcHRpb25zKTtcbiAgICByZXR1cm4geyBpZDogcmVmLmlkLCBwaWQ6IHJlZi5waWQgfTtcbiAgfSxcbik7XG5pcGNNYWluLmhhbmRsZShcbiAgXCJjb2RleHBwOm5hdGl2ZS1oZWxwZXItY2FsbFwiLFxuICAoX2UsIHR3ZWFrSWQ6IHN0cmluZywgaGVscGVySWQ6IHN0cmluZywgbWV0aG9kOiBzdHJpbmcsIHBheWxvYWQ/OiB1bmtub3duLCB0aW1lb3V0TXM/OiBudW1iZXIpID0+IHtcbiAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm5hdGl2ZS1oZWxwZXJcIik7XG4gICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5jYWxsSGVscGVyKHR3ZWFrSWQsIGhlbHBlcklkLCBtZXRob2QsIHBheWxvYWQsIHRpbWVvdXRNcyk7XG4gIH0sXG4pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmV2ZWFsXCIsIChfZSwgcDogc3RyaW5nKSA9PiB7XG4gIHNoZWxsLm9wZW5QYXRoKHApLmNhdGNoKCgpID0+IHt9KTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6b3Blbi1leHRlcm5hbFwiLCAoX2UsIHVybDogc3RyaW5nKSA9PiB7XG4gIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwodXJsKTtcbiAgaWYgKHBhcnNlZC5wcm90b2NvbCAhPT0gXCJodHRwczpcIiB8fCBwYXJzZWQuaG9zdG5hbWUgIT09IFwiZ2l0aHViLmNvbVwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwib25seSBnaXRodWIuY29tIGxpbmtzIGNhbiBiZSBvcGVuZWQgZnJvbSB0d2VhayBtZXRhZGF0YVwiKTtcbiAgfVxuICBzaGVsbC5vcGVuRXh0ZXJuYWwocGFyc2VkLnRvU3RyaW5nKCkpLmNhdGNoKCgpID0+IHt9KTtcbn0pO1xuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6Y29weS10ZXh0XCIsIChfZSwgdGV4dDogc3RyaW5nKSA9PiB7XG4gIGNsaXBib2FyZC53cml0ZVRleHQoU3RyaW5nKHRleHQpKTtcbiAgcmV0dXJuIHRydWU7XG59KTtcblxuLy8gTWFudWFsIGZvcmNlLXJlbG9hZCB0cmlnZ2VyIGZyb20gdGhlIHJlbmRlcmVyIChlLmcuIHRoZSBcIkZvcmNlIFJlbG9hZFwiXG4vLyBidXR0b24gb24gb3VyIGluamVjdGVkIFR3ZWFrcyBwYWdlKS4gQnlwYXNzZXMgdGhlIHdhdGNoZXIgZGVib3VuY2UuXG5pcGNNYWluLmhhbmRsZShcImNvZGV4cHA6cmVsb2FkLXR3ZWFrc1wiLCAoKSA9PiB7XG4gIHJlbG9hZFR3ZWFrcyhcIm1hbnVhbFwiLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICByZXR1cm4geyBhdDogRGF0ZS5ub3coKSwgY291bnQ6IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5sZW5ndGggfTtcbn0pO1xuXG4vLyA0LiBGaWxlc3lzdGVtIHdhdGNoZXIgXHUyMTkyIGRlYm91bmNlZCByZWxvYWQgKyBicm9hZGNhc3QuXG4vLyAgICBXZSB3YXRjaCB0aGUgdHdlYWtzIGRpciBmb3IgYW55IGNoYW5nZS4gT24gdGhlIGZpcnN0IHRpY2sgb2YgaW5hY3Rpdml0eVxuLy8gICAgd2Ugc3RvcCBtYWluLXNpZGUgdHdlYWtzLCBjbGVhciB0aGVpciBjYWNoZWQgbW9kdWxlcywgcmUtZGlzY292ZXIsIHRoZW5cbi8vICAgIHJlc3RhcnQgYW5kIGJyb2FkY2FzdCBgY29kZXhwcDp0d2Vha3MtY2hhbmdlZGAgdG8gZXZlcnkgcmVuZGVyZXIgc28gaXRcbi8vICAgIGNhbiByZS1pbml0IGl0cyBob3N0LlxuY29uc3QgUkVMT0FEX0RFQk9VTkNFX01TID0gMjUwO1xubGV0IHJlbG9hZFRpbWVyOiBOb2RlSlMuVGltZW91dCB8IG51bGwgPSBudWxsO1xuZnVuY3Rpb24gc2NoZWR1bGVSZWxvYWQocmVhc29uOiBzdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHJlbG9hZFRpbWVyKSBjbGVhclRpbWVvdXQocmVsb2FkVGltZXIpO1xuICByZWxvYWRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHJlbG9hZFRpbWVyID0gbnVsbDtcbiAgICByZWxvYWRUd2Vha3MocmVhc29uLCB0d2Vha0xpZmVjeWNsZURlcHMpO1xuICB9LCBSRUxPQURfREVCT1VOQ0VfTVMpO1xufVxuXG50cnkge1xuICBjb25zdCB3YXRjaGVyID0gY2hva2lkYXIud2F0Y2goVFdFQUtTX0RJUiwge1xuICAgIGlnbm9yZUluaXRpYWw6IHRydWUsXG4gICAgLy8gV2FpdCBmb3IgZmlsZXMgdG8gc2V0dGxlIGJlZm9yZSB0cmlnZ2VyaW5nIFx1MjAxNCBndWFyZHMgYWdhaW5zdCBwYXJ0aWFsbHlcbiAgICAvLyB3cml0dGVuIHR3ZWFrIGZpbGVzIGR1cmluZyBlZGl0b3Igc2F2ZXMgLyBnaXQgY2hlY2tvdXRzLlxuICAgIGF3YWl0V3JpdGVGaW5pc2g6IHsgc3RhYmlsaXR5VGhyZXNob2xkOiAxNTAsIHBvbGxJbnRlcnZhbDogNTAgfSxcbiAgICAvLyBBdm9pZCBlYXRpbmcgQ1BVIG9uIGh1Z2Ugbm9kZV9tb2R1bGVzIHRyZWVzIGluc2lkZSB0d2VhayBmb2xkZXJzLlxuICAgIGlnbm9yZWQ6IChwKSA9PiBwLmluY2x1ZGVzKGAke1RXRUFLU19ESVJ9L2ApICYmIC9cXC9ub2RlX21vZHVsZXNcXC8vLnRlc3QocCksXG4gIH0pO1xuICB3YXRjaGVyLm9uKFwiYWxsXCIsIChldmVudCwgcGF0aCkgPT4gc2NoZWR1bGVSZWxvYWQoYCR7ZXZlbnR9ICR7cGF0aH1gKSk7XG4gIHdhdGNoZXIub24oXCJlcnJvclwiLCAoZSkgPT4gbG9nKFwid2FyblwiLCBcIndhdGNoZXIgZXJyb3I6XCIsIGUpKTtcbiAgbG9nKFwiaW5mb1wiLCBcIndhdGNoaW5nXCIsIFRXRUFLU19ESVIpO1xuICBhcHAub24oXCJ3aWxsLXF1aXRcIiwgKCkgPT4gd2F0Y2hlci5jbG9zZSgpLmNhdGNoKCgpID0+IHt9KSk7XG59IGNhdGNoIChlKSB7XG4gIGxvZyhcImVycm9yXCIsIFwiZmFpbGVkIHRvIHN0YXJ0IHdhdGNoZXI6XCIsIGUpO1xufVxuXG4vLyAtLS0gaGVscGVycyAtLS1cblxuZnVuY3Rpb24gbG9hZEFsbE1haW5Ud2Vha3MoKTogdm9pZCB7XG4gIHRyeSB7XG4gICAgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkID0gZGlzY292ZXJUd2Vha3MoVFdFQUtTX0RJUik7XG4gICAgbG9nKFxuICAgICAgXCJpbmZvXCIsXG4gICAgICBgZGlzY292ZXJlZCAke3R3ZWFrU3RhdGUuZGlzY292ZXJlZC5sZW5ndGh9IHR3ZWFrKHMpOmAsXG4gICAgICB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiB0Lm1hbmlmZXN0LmlkKS5qb2luKFwiLCBcIiksXG4gICAgKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcImVycm9yXCIsIFwidHdlYWsgZGlzY292ZXJ5IGZhaWxlZDpcIiwgZSk7XG4gICAgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkID0gW107XG4gIH1cblxuICBzeW5jTWNwU2VydmVyc0Zyb21FbmFibGVkVHdlYWtzKCk7XG5cbiAgZm9yIChjb25zdCB0IG9mIHR3ZWFrU3RhdGUuZGlzY292ZXJlZCkge1xuICAgIGlmICghaXNNYWluUHJvY2Vzc1R3ZWFrU2NvcGUodC5tYW5pZmVzdC5zY29wZSkpIGNvbnRpbnVlO1xuICAgIGlmICghaXNUd2Vha0VuYWJsZWQodC5tYW5pZmVzdC5pZCkpIHtcbiAgICAgIGxvZyhcImluZm9cIiwgYHNraXBwaW5nIGRpc2FibGVkIG1haW4gdHdlYWs6ICR7dC5tYW5pZmVzdC5pZH1gKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgY29uc3QgbW9kID0gcmVxdWlyZSh0LmVudHJ5KTtcbiAgICAgIGNvbnN0IHR3ZWFrID0gbW9kLmRlZmF1bHQgPz8gbW9kO1xuICAgICAgaWYgKHR5cGVvZiB0d2Vhaz8uc3RhcnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjb25zdCBzdG9yYWdlID0gY3JlYXRlRGlza1N0b3JhZ2UodXNlclJvb3QhLCB0Lm1hbmlmZXN0LmlkKTtcbiAgICAgICAgdHdlYWsuc3RhcnQoe1xuICAgICAgICAgIG1hbmlmZXN0OiB0Lm1hbmlmZXN0LFxuICAgICAgICAgIHByb2Nlc3M6IFwibWFpblwiLFxuICAgICAgICAgIGxvZzogbWFrZUxvZ2dlcih0Lm1hbmlmZXN0LmlkKSxcbiAgICAgICAgICBzdG9yYWdlLFxuICAgICAgICAgIGJyaWRnZTogbWFrZU1haW5CcmlkZ2UoKSxcbiAgICAgICAgICBpcGM6IG1ha2VNYWluSXBjKHQubWFuaWZlc3QuaWQpLFxuICAgICAgICAgIGZzOiBtYWtlTWFpbkZzKHQubWFuaWZlc3QuaWQpLFxuICAgICAgICAgIG1vZGVsOiBtYWtlTW9kZWxBcGkodC5tYW5pZmVzdC5pZCksXG4gICAgICAgICAgY29kZXg6IG1ha2VDb2RleEFwaSh0KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHR3ZWFrU3RhdGUubG9hZGVkTWFpbi5zZXQodC5tYW5pZmVzdC5pZCwge1xuICAgICAgICAgIHN0b3A6IHR3ZWFrLnN0b3AsXG4gICAgICAgICAgc3RvcmFnZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGxvZyhcImluZm9cIiwgYHN0YXJ0ZWQgbWFpbiB0d2VhazogJHt0Lm1hbmlmZXN0LmlkfWApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcImVycm9yXCIsIGB0d2VhayAke3QubWFuaWZlc3QuaWR9IGZhaWxlZCB0byBzdGFydDpgLCBlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3luY01jcFNlcnZlcnNGcm9tRW5hYmxlZFR3ZWFrcygpOiB2b2lkIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBzeW5jTWFuYWdlZE1jcFNlcnZlcnMoe1xuICAgICAgY29uZmlnUGF0aDogQ09ERVhfQ09ORklHX0ZJTEUsXG4gICAgICB0d2Vha3M6IHR3ZWFrU3RhdGUuZGlzY292ZXJlZC5maWx0ZXIoKHQpID0+IGlzVHdlYWtFbmFibGVkKHQubWFuaWZlc3QuaWQpKSxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LmNoYW5nZWQpIHtcbiAgICAgIGxvZyhcImluZm9cIiwgYHN5bmNlZCBDb2RleCBNQ1AgY29uZmlnOiAke3Jlc3VsdC5zZXJ2ZXJOYW1lcy5qb2luKFwiLCBcIikgfHwgXCJub25lXCJ9YCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuc2tpcHBlZFNlcnZlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIGxvZyhcbiAgICAgICAgXCJpbmZvXCIsXG4gICAgICAgIGBza2lwcGVkIENvZGV4KysgbWFuYWdlZCBNQ1Agc2VydmVyKHMpIGFscmVhZHkgY29uZmlndXJlZCBieSB1c2VyOiAke3Jlc3VsdC5za2lwcGVkU2VydmVyTmFtZXMuam9pbihcIiwgXCIpfWAsXG4gICAgICApO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGxvZyhcIndhcm5cIiwgXCJmYWlsZWQgdG8gc3luYyBDb2RleCBNQ1AgY29uZmlnOlwiLCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzdG9wQWxsTWFpblR3ZWFrcygpOiB2b2lkIHtcbiAgZm9yIChjb25zdCBbaWQsIHRdIG9mIHR3ZWFrU3RhdGUubG9hZGVkTWFpbikge1xuICAgIHRyeSB7XG4gICAgICB0LnN0b3A/LigpO1xuICAgICAgdC5zdG9yYWdlLmZsdXNoKCk7XG4gICAgICBsb2coXCJpbmZvXCIsIGBzdG9wcGVkIG1haW4gdHdlYWs6ICR7aWR9YCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nKFwid2FyblwiLCBgc3RvcCBmYWlsZWQgZm9yICR7aWR9OmAsIGUpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBuYXRpdmVCcmlkZ2UuZGlzcG9zZVR3ZWFrKGlkKTtcbiAgICAgIGRpc3Bvc2VPd2xWaWV3c0ZvclR3ZWFrKGlkKTtcbiAgICB9XG4gIH1cbiAgdHdlYWtTdGF0ZS5sb2FkZWRNYWluLmNsZWFyKCk7XG59XG5cbmZ1bmN0aW9uIGNsZWFyVHdlYWtNb2R1bGVDYWNoZSgpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFNldCA9IG5ldyBTZXQ8c3RyaW5nPihbVFdFQUtTX0RJUiwgc2FmZVJlYWxwYXRoKFRXRUFLU19ESVIpXSk7XG4gIGNvbnN0IGVudHJ5U2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgdHdlYWsgb2YgdHdlYWtTdGF0ZS5kaXNjb3ZlcmVkKSB7XG4gICAgcm9vdFNldC5hZGQodHdlYWsuZGlyKTtcbiAgICByb290U2V0LmFkZChzYWZlUmVhbHBhdGgodHdlYWsuZGlyKSk7XG4gICAgZW50cnlTZXQuYWRkKHR3ZWFrLmVudHJ5KTtcbiAgICBlbnRyeVNldC5hZGQoc2FmZVJlYWxwYXRoKHR3ZWFrLmVudHJ5KSk7XG4gIH1cblxuICBjb25zdCByb290cyA9IFsuLi5yb290U2V0XTtcbiAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMocmVxdWlyZS5jYWNoZSkpIHtcbiAgICBjb25zdCByZWFsS2V5ID0gc2FmZVJlYWxwYXRoKGtleSk7XG4gICAgY29uc3QgaXNUd2Vha01vZHVsZSA9XG4gICAgICBlbnRyeVNldC5oYXMoa2V5KSB8fFxuICAgICAgZW50cnlTZXQuaGFzKHJlYWxLZXkpIHx8XG4gICAgICByb290cy5zb21lKChyb290KSA9PiBpc1BhdGhJbnNpZGUocm9vdCwga2V5KSB8fCBpc1BhdGhJbnNpZGUocm9vdCwgcmVhbEtleSkpO1xuICAgIGlmIChpc1R3ZWFrTW9kdWxlKSBkZWxldGUgcmVxdWlyZS5jYWNoZVtrZXldO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhZmVSZWFscGF0aChmaWxlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gcmVhbHBhdGhTeW5jKGZpbGVQYXRoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZpbGVQYXRoO1xuICB9XG59XG5cbmNvbnN0IFVQREFURV9DSEVDS19JTlRFUlZBTF9NUyA9IDI0ICogNjAgKiA2MCAqIDEwMDA7XG5hc3luYyBmdW5jdGlvbiBlbnN1cmVDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2soZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8Q29kZXhQbHVzUGx1c1VwZGF0ZUNoZWNrPiB7XG4gIGNvbnN0IHN0YXRlID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGNhY2hlZCA9IHN0YXRlLmNvZGV4UGx1c1BsdXM/LnVwZGF0ZUNoZWNrO1xuICBjb25zdCBjaGFubmVsID0gc3RhdGUuY29kZXhQbHVzUGx1cz8udXBkYXRlQ2hhbm5lbCA/PyBcInN0YWJsZVwiO1xuICBjb25zdCByZXBvID0gc3RhdGUuY29kZXhQbHVzUGx1cz8udXBkYXRlUmVwbyA/PyBDT0RFWF9QTFVTUExVU19SRVBPO1xuICBpZiAoXG4gICAgIWZvcmNlICYmXG4gICAgY2FjaGVkICYmXG4gICAgY2FjaGVkLmN1cnJlbnRWZXJzaW9uID09PSBDT0RFWF9QTFVTUExVU19WRVJTSU9OICYmXG4gICAgRGF0ZS5ub3coKSAtIERhdGUucGFyc2UoY2FjaGVkLmNoZWNrZWRBdCkgPCBVUERBVEVfQ0hFQ0tfSU5URVJWQUxfTVNcbiAgKSB7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfVxuXG4gIGNvbnN0IHJlbGVhc2UgPSBhd2FpdCBmZXRjaExhdGVzdFJlbGVhc2UocmVwbywgQ09ERVhfUExVU1BMVVNfVkVSU0lPTiwgY2hhbm5lbCA9PT0gXCJwcmVyZWxlYXNlXCIpO1xuICBjb25zdCBsYXRlc3RWZXJzaW9uID0gcmVsZWFzZS5sYXRlc3RUYWcgPyBub3JtYWxpemVWZXJzaW9uKHJlbGVhc2UubGF0ZXN0VGFnKSA6IG51bGw7XG4gIGNvbnN0IGNoZWNrOiBDb2RleFBsdXNQbHVzVXBkYXRlQ2hlY2sgPSB7XG4gICAgY2hlY2tlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgY3VycmVudFZlcnNpb246IENPREVYX1BMVVNQTFVTX1ZFUlNJT04sXG4gICAgbGF0ZXN0VmVyc2lvbixcbiAgICByZWxlYXNlVXJsOiByZWxlYXNlLnJlbGVhc2VVcmwgPz8gYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99L3JlbGVhc2VzYCxcbiAgICByZWxlYXNlTm90ZXM6IHJlbGVhc2UucmVsZWFzZU5vdGVzLFxuICAgIHVwZGF0ZUF2YWlsYWJsZTogbGF0ZXN0VmVyc2lvblxuICAgICAgPyBjb21wYXJlVmVyc2lvbnMobm9ybWFsaXplVmVyc2lvbihsYXRlc3RWZXJzaW9uKSwgQ09ERVhfUExVU1BMVVNfVkVSU0lPTikgPiAwXG4gICAgICA6IGZhbHNlLFxuICAgIC4uLihyZWxlYXNlLmVycm9yID8geyBlcnJvcjogcmVsZWFzZS5lcnJvciB9IDoge30pLFxuICB9O1xuICBzdGF0ZS5jb2RleFBsdXNQbHVzID8/PSB7fTtcbiAgc3RhdGUuY29kZXhQbHVzUGx1cy51cGRhdGVDaGVjayA9IGNoZWNrO1xuICB3cml0ZVN0YXRlKHN0YXRlKTtcbiAgcmV0dXJuIGNoZWNrO1xufVxuXG5hc3luYyBmdW5jdGlvbiBlbnN1cmVUd2Vha1VwZGF0ZUNoZWNrKHQ6IERpc2NvdmVyZWRUd2Vhayk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpZCA9IHQubWFuaWZlc3QuaWQ7XG4gIGNvbnN0IHJlcG8gPSB0Lm1hbmlmZXN0LmdpdGh1YlJlcG87XG4gIGNvbnN0IHN0YXRlID0gcmVhZFN0YXRlKCk7XG4gIGNvbnN0IGNhY2hlZCA9IHN0YXRlLnR3ZWFrVXBkYXRlQ2hlY2tzPy5baWRdO1xuICBpZiAoXG4gICAgY2FjaGVkICYmXG4gICAgY2FjaGVkLnJlcG8gPT09IHJlcG8gJiZcbiAgICBjYWNoZWQuY3VycmVudFZlcnNpb24gPT09IHQubWFuaWZlc3QudmVyc2lvbiAmJlxuICAgIERhdGUubm93KCkgLSBEYXRlLnBhcnNlKGNhY2hlZC5jaGVja2VkQXQpIDwgVVBEQVRFX0NIRUNLX0lOVEVSVkFMX01TXG4gICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IG5leHQgPSBhd2FpdCBmZXRjaExhdGVzdFJlbGVhc2UocmVwbywgdC5tYW5pZmVzdC52ZXJzaW9uKTtcbiAgY29uc3QgbGF0ZXN0VmVyc2lvbiA9IG5leHQubGF0ZXN0VGFnID8gbm9ybWFsaXplVmVyc2lvbihuZXh0LmxhdGVzdFRhZykgOiBudWxsO1xuICBjb25zdCBjaGVjazogVHdlYWtVcGRhdGVDaGVjayA9IHtcbiAgICBjaGVja2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICByZXBvLFxuICAgIGN1cnJlbnRWZXJzaW9uOiB0Lm1hbmlmZXN0LnZlcnNpb24sXG4gICAgbGF0ZXN0VmVyc2lvbixcbiAgICBsYXRlc3RUYWc6IG5leHQubGF0ZXN0VGFnLFxuICAgIHJlbGVhc2VVcmw6IG5leHQucmVsZWFzZVVybCxcbiAgICB1cGRhdGVBdmFpbGFibGU6IGxhdGVzdFZlcnNpb25cbiAgICAgID8gY29tcGFyZVZlcnNpb25zKGxhdGVzdFZlcnNpb24sIG5vcm1hbGl6ZVZlcnNpb24odC5tYW5pZmVzdC52ZXJzaW9uKSkgPiAwXG4gICAgICA6IGZhbHNlLFxuICAgIC4uLihuZXh0LmVycm9yID8geyBlcnJvcjogbmV4dC5lcnJvciB9IDoge30pLFxuICB9O1xuICBzdGF0ZS50d2Vha1VwZGF0ZUNoZWNrcyA/Pz0ge307XG4gIHN0YXRlLnR3ZWFrVXBkYXRlQ2hlY2tzW2lkXSA9IGNoZWNrO1xuICB3cml0ZVN0YXRlKHN0YXRlKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hMYXRlc3RSZWxlYXNlKFxuICByZXBvOiBzdHJpbmcsXG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4gIGluY2x1ZGVQcmVyZWxlYXNlID0gZmFsc2UsXG4pOiBQcm9taXNlPHsgbGF0ZXN0VGFnOiBzdHJpbmcgfCBudWxsOyByZWxlYXNlVXJsOiBzdHJpbmcgfCBudWxsOyByZWxlYXNlTm90ZXM6IHN0cmluZyB8IG51bGw7IGVycm9yPzogc3RyaW5nIH0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgODAwMCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGVuZHBvaW50ID0gaW5jbHVkZVByZXJlbGVhc2UgPyBcInJlbGVhc2VzP3Blcl9wYWdlPTIwXCIgOiBcInJlbGVhc2VzL2xhdGVzdFwiO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfS8ke2VuZHBvaW50fWAsIHtcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vdm5kLmdpdGh1Yitqc29uXCIsXG4gICAgICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke2N1cnJlbnRWZXJzaW9ufWAsXG4gICAgICAgIH0sXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICB9KTtcbiAgICAgIGlmIChyZXMuc3RhdHVzID09PSA0MDQpIHtcbiAgICAgICAgcmV0dXJuIHsgbGF0ZXN0VGFnOiBudWxsLCByZWxlYXNlVXJsOiBudWxsLCByZWxlYXNlTm90ZXM6IG51bGwsIGVycm9yOiBcIm5vIEdpdEh1YiByZWxlYXNlIGZvdW5kXCIgfTtcbiAgICAgIH1cbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHJldHVybiB7IGxhdGVzdFRhZzogbnVsbCwgcmVsZWFzZVVybDogbnVsbCwgcmVsZWFzZU5vdGVzOiBudWxsLCBlcnJvcjogYEdpdEh1YiByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCB9O1xuICAgICAgfVxuICAgICAgY29uc3QganNvbiA9IGF3YWl0IHJlcy5qc29uKCkgYXMgeyB0YWdfbmFtZT86IHN0cmluZzsgaHRtbF91cmw/OiBzdHJpbmc7IGJvZHk/OiBzdHJpbmc7IGRyYWZ0PzogYm9vbGVhbiB9IHwgQXJyYXk8eyB0YWdfbmFtZT86IHN0cmluZzsgaHRtbF91cmw/OiBzdHJpbmc7IGJvZHk/OiBzdHJpbmc7IGRyYWZ0PzogYm9vbGVhbiB9PjtcbiAgICAgIGNvbnN0IGJvZHkgPSBBcnJheS5pc0FycmF5KGpzb24pID8ganNvbi5maW5kKChyZWxlYXNlKSA9PiAhcmVsZWFzZS5kcmFmdCkgOiBqc29uO1xuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIHJldHVybiB7IGxhdGVzdFRhZzogbnVsbCwgcmVsZWFzZVVybDogbnVsbCwgcmVsZWFzZU5vdGVzOiBudWxsLCBlcnJvcjogXCJubyBHaXRIdWIgcmVsZWFzZSBmb3VuZFwiIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYXRlc3RUYWc6IGJvZHkudGFnX25hbWUgPz8gbnVsbCxcbiAgICAgICAgcmVsZWFzZVVybDogYm9keS5odG1sX3VybCA/PyBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb30vcmVsZWFzZXNgLFxuICAgICAgICByZWxlYXNlTm90ZXM6IGJvZHkuYm9keSA/PyBudWxsLFxuICAgICAgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB7XG4gICAgICBsYXRlc3RUYWc6IG51bGwsXG4gICAgICByZWxlYXNlVXJsOiBudWxsLFxuICAgICAgcmVsZWFzZU5vdGVzOiBudWxsLFxuICAgICAgZXJyb3I6IGUgaW5zdGFuY2VvZiBFcnJvciA/IGUubWVzc2FnZSA6IFN0cmluZyhlKSxcbiAgICB9O1xuICB9XG59XG5cbmludGVyZmFjZSBUd2Vha1N0b3JlRmV0Y2hSZXN1bHQge1xuICByZWdpc3RyeTogVHdlYWtTdG9yZVJlZ2lzdHJ5O1xuICBmZXRjaGVkQXQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIFN0b3JlSW5zdGFsbE1ldGFkYXRhIHtcbiAgcmVwbzogc3RyaW5nO1xuICBhcHByb3ZlZENvbW1pdFNoYTogc3RyaW5nO1xuICBpbnN0YWxsZWRBdDogc3RyaW5nO1xuICBzdG9yZUluZGV4VXJsOiBzdHJpbmc7XG4gIGZpbGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuY2xhc3MgU3RvcmVUd2Vha01vZGlmaWVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKHR3ZWFrTmFtZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoXG4gICAgICBgJHt0d2Vha05hbWV9IGhhcyBsb2NhbCBzb3VyY2UgY2hhbmdlcywgc28gQ29kZXgrKyBjYW4ndCBhdXRvLXVwZGF0ZSBpdC4gUmV2ZXJ0IHlvdXIgbG9jYWwgY2hhbmdlcyBvciByZWluc3RhbGwgdGhlIHR3ZWFrIG1hbnVhbGx5LmAsXG4gICAgKTtcbiAgICB0aGlzLm5hbWUgPSBcIlN0b3JlVHdlYWtNb2RpZmllZEVycm9yXCI7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hUd2Vha1N0b3JlUmVnaXN0cnkoKTogUHJvbWlzZTxUd2Vha1N0b3JlRmV0Y2hSZXN1bHQ+IHtcbiAgY29uc3QgZmV0Y2hlZEF0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICB0cnkge1xuICAgIGNvbnN0IGNvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA4MDAwKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goVFdFQUtfU1RPUkVfSU5ERVhfVVJMLCB7XG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICBcIlVzZXItQWdlbnRcIjogYGNvZGV4LXBsdXNwbHVzLyR7Q09ERVhfUExVU1BMVVNfVkVSU0lPTn1gLFxuICAgICAgICB9LFxuICAgICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgICAgfSk7XG4gICAgICBpZiAoIXJlcy5vaykgdGhyb3cgbmV3IEVycm9yKGBzdG9yZSByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByZWdpc3RyeTogbm9ybWFsaXplU3RvcmVSZWdpc3RyeShhd2FpdCByZXMuanNvbigpKSxcbiAgICAgICAgZmV0Y2hlZEF0LFxuICAgICAgfTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnN0IGVycm9yID0gZSBpbnN0YW5jZW9mIEVycm9yID8gZSA6IG5ldyBFcnJvcihTdHJpbmcoZSkpO1xuICAgIGxvZyhcIndhcm5cIiwgXCJmYWlsZWQgdG8gZmV0Y2ggdHdlYWsgc3RvcmUgcmVnaXN0cnk6XCIsIGVycm9yLm1lc3NhZ2UpO1xuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxTdG9yZVR3ZWFrKGVudHJ5OiBUd2Vha1N0b3JlRW50cnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgdXJsID0gc3RvcmVBcmNoaXZlVXJsKGVudHJ5KTtcbiAgY29uc3Qgd29yayA9IG1rZHRlbXBTeW5jKGpvaW4odG1wZGlyKCksIFwiY29kZXhwcC1zdG9yZS10d2Vhay1cIikpO1xuICBjb25zdCBhcmNoaXZlID0gam9pbih3b3JrLCBcInNvdXJjZS50YXIuZ3pcIik7XG4gIGNvbnN0IGV4dHJhY3REaXIgPSBqb2luKHdvcmssIFwiZXh0cmFjdFwiKTtcbiAgY29uc3QgdGFyZ2V0ID0gam9pbihUV0VBS1NfRElSLCBlbnRyeS5pZCk7XG4gIGNvbnN0IHN0YWdlZFRhcmdldCA9IGpvaW4od29yaywgXCJzdGFnZWRcIiwgZW50cnkuaWQpO1xuXG4gIHRyeSB7XG4gICAgbG9nKFwiaW5mb1wiLCBgaW5zdGFsbGluZyBzdG9yZSB0d2VhayAke2VudHJ5LmlkfSBmcm9tICR7ZW50cnkucmVwb31AJHtlbnRyeS5hcHByb3ZlZENvbW1pdFNoYX1gKTtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHsgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCB9LFxuICAgICAgcmVkaXJlY3Q6IFwiZm9sbG93XCIsXG4gICAgfSk7XG4gICAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgZG93bmxvYWQgZmFpbGVkOiAke3Jlcy5zdGF0dXN9YCk7XG4gICAgY29uc3QgYnl0ZXMgPSBCdWZmZXIuZnJvbShhd2FpdCByZXMuYXJyYXlCdWZmZXIoKSk7XG4gICAgd3JpdGVGaWxlU3luYyhhcmNoaXZlLCBieXRlcyk7XG4gICAgbWtkaXJTeW5jKGV4dHJhY3REaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIGV4dHJhY3RUYXJBcmNoaXZlKGFyY2hpdmUsIGV4dHJhY3REaXIpO1xuICAgIGNvbnN0IHNvdXJjZSA9IGZpbmRUd2Vha1Jvb3QoZXh0cmFjdERpcik7XG4gICAgaWYgKCFzb3VyY2UpIHRocm93IG5ldyBFcnJvcihcImRvd25sb2FkZWQgYXJjaGl2ZSBkaWQgbm90IGNvbnRhaW4gbWFuaWZlc3QuanNvblwiKTtcbiAgICB2YWxpZGF0ZVN0b3JlVHdlYWtTb3VyY2UoZW50cnksIHNvdXJjZSk7XG4gICAgcm1TeW5jKHN0YWdlZFRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgIGNvcHlUd2Vha1NvdXJjZShzb3VyY2UsIHN0YWdlZFRhcmdldCk7XG4gICAgY29uc3Qgc3RhZ2VkRmlsZXMgPSBoYXNoVHdlYWtTb3VyY2Uoc3RhZ2VkVGFyZ2V0KTtcbiAgICB3cml0ZUZpbGVTeW5jKFxuICAgICAgam9pbihzdGFnZWRUYXJnZXQsIFwiLmNvZGV4cHAtc3RvcmUuanNvblwiKSxcbiAgICAgIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICB7XG4gICAgICAgICAgcmVwbzogZW50cnkucmVwbyxcbiAgICAgICAgICBhcHByb3ZlZENvbW1pdFNoYTogZW50cnkuYXBwcm92ZWRDb21taXRTaGEsXG4gICAgICAgICAgaW5zdGFsbGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICBzdG9yZUluZGV4VXJsOiBUV0VBS19TVE9SRV9JTkRFWF9VUkwsXG4gICAgICAgICAgZmlsZXM6IHN0YWdlZEZpbGVzLFxuICAgICAgICB9LFxuICAgICAgICBudWxsLFxuICAgICAgICAyLFxuICAgICAgKSxcbiAgICApO1xuICAgIGF3YWl0IGFzc2VydFN0b3JlVHdlYWtDbGVhbkZvckF1dG9VcGRhdGUoZW50cnksIHRhcmdldCwgd29yayk7XG4gICAgcm1TeW5jKHRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgIGNwU3luYyhzdGFnZWRUYXJnZXQsIHRhcmdldCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH0gZmluYWxseSB7XG4gICAgcm1TeW5jKHdvcmssIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlVHdlYWtTdG9yZVN1Ym1pc3Npb24ocmVwb0lucHV0OiBzdHJpbmcpOiBQcm9taXNlPFR3ZWFrU3RvcmVQdWJsaXNoU3VibWlzc2lvbj4ge1xuICBjb25zdCByZXBvID0gbm9ybWFsaXplR2l0SHViUmVwbyhyZXBvSW5wdXQpO1xuICBjb25zdCByZXBvSW5mbyA9IGF3YWl0IGZldGNoR2l0aHViSnNvbjx7IGRlZmF1bHRfYnJhbmNoPzogc3RyaW5nIH0+KGBodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zLyR7cmVwb31gKTtcbiAgY29uc3QgZGVmYXVsdEJyYW5jaCA9IHJlcG9JbmZvLmRlZmF1bHRfYnJhbmNoO1xuICBpZiAoIWRlZmF1bHRCcmFuY2gpIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlc29sdmUgZGVmYXVsdCBicmFuY2ggZm9yICR7cmVwb31gKTtcblxuICBjb25zdCBjb21taXQgPSBhd2FpdCBmZXRjaEdpdGh1Ykpzb248e1xuICAgIHNoYT86IHN0cmluZztcbiAgICBodG1sX3VybD86IHN0cmluZztcbiAgfT4oYGh0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvJHtyZXBvfS9jb21taXRzLyR7ZW5jb2RlVVJJQ29tcG9uZW50KGRlZmF1bHRCcmFuY2gpfWApO1xuICBpZiAoIWNvbW1pdC5zaGEpIHRocm93IG5ldyBFcnJvcihgQ291bGQgbm90IHJlc29sdmUgY3VycmVudCBjb21taXQgZm9yICR7cmVwb31gKTtcblxuICBjb25zdCBtYW5pZmVzdCA9IGF3YWl0IGZldGNoTWFuaWZlc3RBdENvbW1pdChyZXBvLCBjb21taXQuc2hhKS5jYXRjaCgoZSkgPT4ge1xuICAgIGxvZyhcIndhcm5cIiwgYGNvdWxkIG5vdCByZWFkIG1hbmlmZXN0IGZvciBzdG9yZSBzdWJtaXNzaW9uICR7cmVwb31AJHtjb21taXQuc2hhfTpgLCBlKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHJlcG8sXG4gICAgZGVmYXVsdEJyYW5jaCxcbiAgICBjb21taXRTaGE6IGNvbW1pdC5zaGEsXG4gICAgY29tbWl0VXJsOiBjb21taXQuaHRtbF91cmwgPz8gYGh0dHBzOi8vZ2l0aHViLmNvbS8ke3JlcG99L2NvbW1pdC8ke2NvbW1pdC5zaGF9YCxcbiAgICBtYW5pZmVzdDogbWFuaWZlc3RcbiAgICAgID8ge1xuICAgICAgICAgIGlkOiB0eXBlb2YgbWFuaWZlc3QuaWQgPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC5pZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBuYW1lOiB0eXBlb2YgbWFuaWZlc3QubmFtZSA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0Lm5hbWUgOiB1bmRlZmluZWQsXG4gICAgICAgICAgdmVyc2lvbjogdHlwZW9mIG1hbmlmZXN0LnZlcnNpb24gPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC52ZXJzaW9uIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiB0eXBlb2YgbWFuaWZlc3QuZGVzY3JpcHRpb24gPT09IFwic3RyaW5nXCIgPyBtYW5pZmVzdC5kZXNjcmlwdGlvbiA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBpY29uVXJsOiB0eXBlb2YgbWFuaWZlc3QuaWNvblVybCA9PT0gXCJzdHJpbmdcIiA/IG1hbmlmZXN0Lmljb25VcmwgOiB1bmRlZmluZWQsXG4gICAgICAgIH1cbiAgICAgIDogdW5kZWZpbmVkLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBmZXRjaEdpdGh1Ykpzb248VD4odXJsOiBzdHJpbmcpOiBQcm9taXNlPFQ+IHtcbiAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCA4MDAwKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaCh1cmwsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJBY2NlcHRcIjogXCJhcHBsaWNhdGlvbi92bmQuZ2l0aHViK2pzb25cIixcbiAgICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCxcbiAgICAgIH0sXG4gICAgICBzaWduYWw6IGNvbnRyb2xsZXIuc2lnbmFsLFxuICAgIH0pO1xuICAgIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEdpdEh1YiByZXR1cm5lZCAke3Jlcy5zdGF0dXN9YCk7XG4gICAgcmV0dXJuIGF3YWl0IHJlcy5qc29uKCkgYXMgVDtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hNYW5pZmVzdEF0Q29tbWl0KHJlcG86IHN0cmluZywgY29tbWl0U2hhOiBzdHJpbmcpOiBQcm9taXNlPFBhcnRpYWw8VHdlYWtNYW5pZmVzdD4+IHtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS8ke3JlcG99LyR7Y29tbWl0U2hhfS9tYW5pZmVzdC5qc29uYCwge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgIFwiQWNjZXB0XCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJVc2VyLUFnZW50XCI6IGBjb2RleC1wbHVzcGx1cy8ke0NPREVYX1BMVVNQTFVTX1ZFUlNJT059YCxcbiAgICB9LFxuICB9KTtcbiAgaWYgKCFyZXMub2spIHRocm93IG5ldyBFcnJvcihgbWFuaWZlc3QgZmV0Y2ggcmV0dXJuZWQgJHtyZXMuc3RhdHVzfWApO1xuICByZXR1cm4gYXdhaXQgcmVzLmpzb24oKSBhcyBQYXJ0aWFsPFR3ZWFrTWFuaWZlc3Q+O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0VGFyQXJjaGl2ZShhcmNoaXZlOiBzdHJpbmcsIHRhcmdldERpcjogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IHJlc3VsdCA9IHNwYXduU3luYyhcInRhclwiLCBbXCIteHpmXCIsIGFyY2hpdmUsIFwiLUNcIiwgdGFyZ2V0RGlyXSwge1xuICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICBzdGRpbzogW1wiaWdub3JlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gIH0pO1xuICBpZiAocmVzdWx0LnN0YXR1cyAhPT0gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgdGFyIGV4dHJhY3Rpb24gZmFpbGVkOiAke3Jlc3VsdC5zdGRlcnIgfHwgcmVzdWx0LnN0ZG91dCB8fCByZXN1bHQuc3RhdHVzfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlU3RvcmVUd2Vha1NvdXJjZShlbnRyeTogVHdlYWtTdG9yZUVudHJ5LCBzb3VyY2U6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBtYW5pZmVzdFBhdGggPSBqb2luKHNvdXJjZSwgXCJtYW5pZmVzdC5qc29uXCIpO1xuICBjb25zdCBtYW5pZmVzdCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1hbmlmZXN0UGF0aCwgXCJ1dGY4XCIpKSBhcyBUd2Vha01hbmlmZXN0O1xuICBpZiAobWFuaWZlc3QuaWQgIT09IGVudHJ5Lm1hbmlmZXN0LmlkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBkb3dubG9hZGVkIHR3ZWFrIGlkICR7bWFuaWZlc3QuaWR9IGRvZXMgbm90IG1hdGNoIGFwcHJvdmVkIGlkICR7ZW50cnkubWFuaWZlc3QuaWR9YCk7XG4gIH1cbiAgaWYgKG1hbmlmZXN0LmdpdGh1YlJlcG8gIT09IGVudHJ5LnJlcG8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYGRvd25sb2FkZWQgdHdlYWsgcmVwbyAke21hbmlmZXN0LmdpdGh1YlJlcG99IGRvZXMgbm90IG1hdGNoIGFwcHJvdmVkIHJlcG8gJHtlbnRyeS5yZXBvfWApO1xuICB9XG4gIGlmIChtYW5pZmVzdC52ZXJzaW9uICE9PSBlbnRyeS5tYW5pZmVzdC52ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBkb3dubG9hZGVkIHR3ZWFrIHZlcnNpb24gJHttYW5pZmVzdC52ZXJzaW9ufSBkb2VzIG5vdCBtYXRjaCBhcHByb3ZlZCB2ZXJzaW9uICR7ZW50cnkubWFuaWZlc3QudmVyc2lvbn1gKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBmaW5kVHdlYWtSb290KGRpcjogc3RyaW5nKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICghZXhpc3RzU3luYyhkaXIpKSByZXR1cm4gbnVsbDtcbiAgaWYgKGV4aXN0c1N5bmMoam9pbihkaXIsIFwibWFuaWZlc3QuanNvblwiKSkpIHJldHVybiBkaXI7XG4gIGZvciAoY29uc3QgbmFtZSBvZiByZWFkZGlyU3luYyhkaXIpKSB7XG4gICAgY29uc3QgY2hpbGQgPSBqb2luKGRpciwgbmFtZSk7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghc3RhdFN5bmMoY2hpbGQpLmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGZvdW5kID0gZmluZFR3ZWFrUm9vdChjaGlsZCk7XG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGNvcHlUd2Vha1NvdXJjZShzb3VyY2U6IHN0cmluZywgdGFyZ2V0OiBzdHJpbmcpOiB2b2lkIHtcbiAgY3BTeW5jKHNvdXJjZSwgdGFyZ2V0LCB7XG4gICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgIGZpbHRlcjogKHNyYykgPT4gIS8oXnxbL1xcXFxdKSg/OlxcLmdpdHxub2RlX21vZHVsZXMpKD86Wy9cXFxcXXwkKS8udGVzdChzcmMpLFxuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gYXNzZXJ0U3RvcmVUd2Vha0NsZWFuRm9yQXV0b1VwZGF0ZShcbiAgZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSxcbiAgdGFyZ2V0OiBzdHJpbmcsXG4gIHdvcms6IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoIWV4aXN0c1N5bmModGFyZ2V0KSkgcmV0dXJuO1xuICBjb25zdCBtZXRhZGF0YSA9IHJlYWRTdG9yZUluc3RhbGxNZXRhZGF0YSh0YXJnZXQpO1xuICBpZiAoIW1ldGFkYXRhKSByZXR1cm47XG4gIGlmIChtZXRhZGF0YS5yZXBvICE9PSBlbnRyeS5yZXBvKSB7XG4gICAgdGhyb3cgbmV3IFN0b3JlVHdlYWtNb2RpZmllZEVycm9yKGVudHJ5Lm1hbmlmZXN0Lm5hbWUpO1xuICB9XG4gIGNvbnN0IGN1cnJlbnRGaWxlcyA9IGhhc2hUd2Vha1NvdXJjZSh0YXJnZXQpO1xuICBjb25zdCBiYXNlbGluZUZpbGVzID0gbWV0YWRhdGEuZmlsZXMgPz8gYXdhaXQgZmV0Y2hCYXNlbGluZVN0b3JlVHdlYWtIYXNoZXMobWV0YWRhdGEsIHdvcmspO1xuICBpZiAoIXNhbWVGaWxlSGFzaGVzKGN1cnJlbnRGaWxlcywgYmFzZWxpbmVGaWxlcykpIHtcbiAgICB0aHJvdyBuZXcgU3RvcmVUd2Vha01vZGlmaWVkRXJyb3IoZW50cnkubWFuaWZlc3QubmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFN0b3JlSW5zdGFsbE1ldGFkYXRhKHRhcmdldDogc3RyaW5nKTogU3RvcmVJbnN0YWxsTWV0YWRhdGEgfCBudWxsIHtcbiAgY29uc3QgbWV0YWRhdGFQYXRoID0gam9pbih0YXJnZXQsIFwiLmNvZGV4cHAtc3RvcmUuanNvblwiKTtcbiAgaWYgKCFleGlzdHNTeW5jKG1ldGFkYXRhUGF0aCkpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IHBhcnNlZCA9IEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKG1ldGFkYXRhUGF0aCwgXCJ1dGY4XCIpKSBhcyBQYXJ0aWFsPFN0b3JlSW5zdGFsbE1ldGFkYXRhPjtcbiAgICBpZiAodHlwZW9mIHBhcnNlZC5yZXBvICE9PSBcInN0cmluZ1wiIHx8IHR5cGVvZiBwYXJzZWQuYXBwcm92ZWRDb21taXRTaGEgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICByZXBvOiBwYXJzZWQucmVwbyxcbiAgICAgIGFwcHJvdmVkQ29tbWl0U2hhOiBwYXJzZWQuYXBwcm92ZWRDb21taXRTaGEsXG4gICAgICBpbnN0YWxsZWRBdDogdHlwZW9mIHBhcnNlZC5pbnN0YWxsZWRBdCA9PT0gXCJzdHJpbmdcIiA/IHBhcnNlZC5pbnN0YWxsZWRBdCA6IFwiXCIsXG4gICAgICBzdG9yZUluZGV4VXJsOiB0eXBlb2YgcGFyc2VkLnN0b3JlSW5kZXhVcmwgPT09IFwic3RyaW5nXCIgPyBwYXJzZWQuc3RvcmVJbmRleFVybCA6IFwiXCIsXG4gICAgICBmaWxlczogaXNIYXNoUmVjb3JkKHBhcnNlZC5maWxlcykgPyBwYXJzZWQuZmlsZXMgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hCYXNlbGluZVN0b3JlVHdlYWtIYXNoZXMoXG4gIG1ldGFkYXRhOiBTdG9yZUluc3RhbGxNZXRhZGF0YSxcbiAgd29yazogc3RyaW5nLFxuKTogUHJvbWlzZTxSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+PiB7XG4gIGNvbnN0IGJhc2VsaW5lRGlyID0gam9pbih3b3JrLCBcImJhc2VsaW5lXCIpO1xuICBjb25zdCBhcmNoaXZlID0gam9pbih3b3JrLCBcImJhc2VsaW5lLnRhci5nelwiKTtcbiAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goYGh0dHBzOi8vY29kZWxvYWQuZ2l0aHViLmNvbS8ke21ldGFkYXRhLnJlcG99L3Rhci5nei8ke21ldGFkYXRhLmFwcHJvdmVkQ29tbWl0U2hhfWAsIHtcbiAgICBoZWFkZXJzOiB7IFwiVXNlci1BZ2VudFwiOiBgY29kZXgtcGx1c3BsdXMvJHtDT0RFWF9QTFVTUExVU19WRVJTSU9OfWAgfSxcbiAgICByZWRpcmVjdDogXCJmb2xsb3dcIixcbiAgfSk7XG4gIGlmICghcmVzLm9rKSB0aHJvdyBuZXcgRXJyb3IoYENvdWxkIG5vdCB2ZXJpZnkgbG9jYWwgdHdlYWsgY2hhbmdlcyBiZWZvcmUgdXBkYXRlOiAke3Jlcy5zdGF0dXN9YCk7XG4gIHdyaXRlRmlsZVN5bmMoYXJjaGl2ZSwgQnVmZmVyLmZyb20oYXdhaXQgcmVzLmFycmF5QnVmZmVyKCkpKTtcbiAgbWtkaXJTeW5jKGJhc2VsaW5lRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgZXh0cmFjdFRhckFyY2hpdmUoYXJjaGl2ZSwgYmFzZWxpbmVEaXIpO1xuICBjb25zdCBzb3VyY2UgPSBmaW5kVHdlYWtSb290KGJhc2VsaW5lRGlyKTtcbiAgaWYgKCFzb3VyY2UpIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCB2ZXJpZnkgbG9jYWwgdHdlYWsgY2hhbmdlcyBiZWZvcmUgdXBkYXRlOiBiYXNlbGluZSBtYW5pZmVzdCBtaXNzaW5nXCIpO1xuICByZXR1cm4gaGFzaFR3ZWFrU291cmNlKHNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIGhhc2hUd2Vha1NvdXJjZShyb290OiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+IHtcbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XG4gIGNvbGxlY3RUd2Vha0ZpbGVIYXNoZXMocm9vdCwgcm9vdCwgb3V0KTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gY29sbGVjdFR3ZWFrRmlsZUhhc2hlcyhyb290OiBzdHJpbmcsIGRpcjogc3RyaW5nLCBvdXQ6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBuYW1lIG9mIHJlYWRkaXJTeW5jKGRpcikuc29ydCgpKSB7XG4gICAgaWYgKG5hbWUgPT09IFwiLmdpdFwiIHx8IG5hbWUgPT09IFwibm9kZV9tb2R1bGVzXCIgfHwgbmFtZSA9PT0gXCIuY29kZXhwcC1zdG9yZS5qc29uXCIpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGZ1bGwgPSBqb2luKGRpciwgbmFtZSk7XG4gICAgY29uc3QgcmVsID0gcmVsYXRpdmUocm9vdCwgZnVsbCkuc3BsaXQoXCJcXFxcXCIpLmpvaW4oXCIvXCIpO1xuICAgIGNvbnN0IHN0YXQgPSBzdGF0U3luYyhmdWxsKTtcbiAgICBpZiAoc3RhdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBjb2xsZWN0VHdlYWtGaWxlSGFzaGVzKHJvb3QsIGZ1bGwsIG91dCk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKCFzdGF0LmlzRmlsZSgpKSBjb250aW51ZTtcbiAgICBvdXRbcmVsXSA9IGNyZWF0ZUhhc2goXCJzaGEyNTZcIikudXBkYXRlKHJlYWRGaWxlU3luYyhmdWxsKSkuZGlnZXN0KFwiaGV4XCIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNhbWVGaWxlSGFzaGVzKGE6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sIGI6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4pOiBib29sZWFuIHtcbiAgY29uc3QgYWsgPSBPYmplY3Qua2V5cyhhKS5zb3J0KCk7XG4gIGNvbnN0IGJrID0gT2JqZWN0LmtleXMoYikuc29ydCgpO1xuICBpZiAoYWsubGVuZ3RoICE9PSBiay5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhay5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGFrW2ldO1xuICAgIGlmIChrZXkgIT09IGJrW2ldIHx8IGFba2V5XSAhPT0gYltrZXldKSByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGlzSGFzaFJlY29yZCh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHN0cmluZz4ge1xuICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gXCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KHZhbHVlKSkgcmV0dXJuIGZhbHNlO1xuICByZXR1cm4gT2JqZWN0LnZhbHVlcyh2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikuZXZlcnkoKHYpID0+IHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKTtcbn1cblxuZnVuY3Rpb24gZmFsbGJhY2tTb3VyY2VSb290KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgIGpvaW4oaG9tZWRpcigpLCBcIi5jb2RleC1wbHVzcGx1c1wiLCBcInNvdXJjZVwiKSxcbiAgICBqb2luKHVzZXJSb290ISwgXCJzb3VyY2VcIiksXG4gIF07XG4gIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICBpZiAoZXhpc3RzU3luYyhqb2luKGNhbmRpZGF0ZSwgXCJwYWNrYWdlc1wiLCBcImluc3RhbGxlclwiLCBcImRpc3RcIiwgXCJjbGkuanNcIikpKSByZXR1cm4gY2FuZGlkYXRlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBkZXNjcmliZUluc3RhbGxhdGlvblNvdXJjZShzb3VyY2VSb290OiBzdHJpbmcgfCBudWxsKTogSW5zdGFsbGF0aW9uU291cmNlIHtcbiAgaWYgKCFzb3VyY2VSb290KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGtpbmQ6IFwidW5rbm93blwiLFxuICAgICAgbGFiZWw6IFwiVW5rbm93blwiLFxuICAgICAgZGV0YWlsOiBcIkNvZGV4Kysgc291cmNlIGxvY2F0aW9uIGlzIG5vdCByZWNvcmRlZCB5ZXQuXCIsXG4gICAgfTtcbiAgfVxuICBjb25zdCBub3JtYWxpemVkID0gc291cmNlUm9vdC5yZXBsYWNlKC9cXFxcL2csIFwiL1wiKTtcbiAgaWYgKC9cXC8oPzpIb21lYnJld3xob21lYnJldylcXC9DZWxsYXJcXC9jb2RleHBsdXNwbHVzXFwvLy50ZXN0KG5vcm1hbGl6ZWQpKSB7XG4gICAgcmV0dXJuIHsga2luZDogXCJob21lYnJld1wiLCBsYWJlbDogXCJIb21lYnJld1wiLCBkZXRhaWw6IHNvdXJjZVJvb3QgfTtcbiAgfVxuICBpZiAoZXhpc3RzU3luYyhqb2luKHNvdXJjZVJvb3QsIFwiLmdpdFwiKSkpIHtcbiAgICByZXR1cm4geyBraW5kOiBcImxvY2FsLWRldlwiLCBsYWJlbDogXCJMb2NhbCBkZXZlbG9wbWVudCBjaGVja291dFwiLCBkZXRhaWw6IHNvdXJjZVJvb3QgfTtcbiAgfVxuICBpZiAobm9ybWFsaXplZC5lbmRzV2l0aChcIi8uY29kZXgtcGx1c3BsdXMvc291cmNlXCIpIHx8IG5vcm1hbGl6ZWQuaW5jbHVkZXMoXCIvLmNvZGV4LXBsdXNwbHVzL3NvdXJjZS9cIikpIHtcbiAgICByZXR1cm4geyBraW5kOiBcImdpdGh1Yi1zb3VyY2VcIiwgbGFiZWw6IFwiR2l0SHViIHNvdXJjZSBpbnN0YWxsZXJcIiwgZGV0YWlsOiBzb3VyY2VSb290IH07XG4gIH1cbiAgaWYgKGV4aXN0c1N5bmMoam9pbihzb3VyY2VSb290LCBcInBhY2thZ2UuanNvblwiKSkpIHtcbiAgICByZXR1cm4geyBraW5kOiBcInNvdXJjZS1hcmNoaXZlXCIsIGxhYmVsOiBcIlNvdXJjZSBhcmNoaXZlXCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xuICB9XG4gIHJldHVybiB7IGtpbmQ6IFwidW5rbm93blwiLCBsYWJlbDogXCJVbmtub3duXCIsIGRldGFpbDogc291cmNlUm9vdCB9O1xufVxuXG5mdW5jdGlvbiBzdGFydEluc3RhbGxlZENsaShjbGk6IHN0cmluZywgYXJnczogc3RyaW5nW10pOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIgJiYgc3RhcnRJbnN0YWxsZWRDbGlXaXRoTGF1bmNoZChjbGksIGFyZ3MpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGNoaWxkID0gc3Bhd24ocHJvY2Vzcy5leGVjUGF0aCwgW2NsaSwgLi4uYXJnc10sIHtcbiAgICBjd2Q6IHJlc29sdmUoZGlybmFtZShjbGkpLCBcIi4uXCIsIFwiLi5cIiwgXCIuLlwiKSxcbiAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIENPREVYX1BMVVNQTFVTX01BTlVBTF9VUERBVEU6IFwiMVwiIH0sXG4gICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgc3RkaW86IFwiaWdub3JlXCIsXG4gIH0pO1xuICBjaGlsZC51bnJlZigpO1xufVxuXG5mdW5jdGlvbiBzdGFydEluc3RhbGxlZENsaVdpdGhMYXVuY2hkKGNsaTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xuICBjb25zdCBsYWJlbCA9IGBjb20uY29kZXhwbHVzcGx1cy5wYXRjaC1oZWxwZXIuJHtwcm9jZXNzLnBpZH0uJHtEYXRlLm5vdygpfWA7XG4gIGNvbnN0IGNsZWFudXAgPSBgbGF1bmNoY3RsIHJlbW92ZSAke2xhYmVsfSA+L2Rldi9udWxsIDI+JjEgfHwgbGF1bmNoY3RsIGJvb3RvdXQgZ3VpLyQoaWQgLXUpLyR7bGFiZWx9ID4vZGV2L251bGwgMj4mMSB8fCB0cnVlYDtcbiAgY29uc3QgY29tbWFuZCA9IFtcbiAgICBgdHJhcCAke3NoZWxsUXVvdGUoY2xlYW51cCl9IEVYSVRgLFxuICAgIGBjZCAke3NoZWxsUXVvdGUocmVzb2x2ZShkaXJuYW1lKGNsaSksIFwiLi5cIiwgXCIuLlwiLCBcIi4uXCIpKX1gLFxuICAgIGBDT0RFWF9QTFVTUExVU19NQU5VQUxfVVBEQVRFPTEgJHtbcHJvY2Vzcy5leGVjUGF0aCwgY2xpLCAuLi5hcmdzXS5tYXAoc2hlbGxRdW90ZSkuam9pbihcIiBcIil9YCxcbiAgXS5qb2luKFwiICYmIFwiKTtcbiAgY29uc3QgcmVzdWx0ID0gc3Bhd25TeW5jKFxuICAgIFwibGF1bmNoY3RsXCIsXG4gICAgW1xuICAgICAgXCJzdWJtaXRcIixcbiAgICAgIFwiLWxcIixcbiAgICAgIGxhYmVsLFxuICAgICAgXCItLVwiLFxuICAgICAgXCIvYmluL3NoXCIsXG4gICAgICBcIi1jXCIsXG4gICAgICBgJHtjb21tYW5kfSB8fCB0cnVlYCxcbiAgICBdLFxuICAgIHtcbiAgICAgIGVuY29kaW5nOiBcInV0ZjhcIixcbiAgICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgIH0sXG4gICk7XG4gIGlmIChyZXN1bHQuc3RhdHVzID09PSAwKSByZXR1cm4gdHJ1ZTtcbiAgbG9nKFwid2FyblwiLCBgbGF1bmNoY3RsIHN1Ym1pdCBmYWlsZWQgZm9yIENvZGV4KysgcGF0Y2ggaGVscGVyOiAke3Jlc3VsdC5lcnJvcj8ubWVzc2FnZSA/PyByZXN1bHQuc3RhdHVzfWApO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHNoZWxsUXVvdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJyR7dmFsdWUucmVwbGFjZSgvJy9nLCBgJ1xcXFwnJ2ApfSdgO1xufVxuXG5mdW5jdGlvbiBtYXJrU2VsZlVwZGF0ZVN0YXJ0ZWQoc291cmNlUm9vdDogc3RyaW5nKTogU2VsZlVwZGF0ZVN0YXRlIHtcbiAgY29uc3QgY29uZmlnID0gcmVhZFN0YXRlKCkuY29kZXhQbHVzUGx1cztcbiAgY29uc3QgY2hhbm5lbCA9IGNvbmZpZz8udXBkYXRlQ2hhbm5lbCA/PyBcInN0YWJsZVwiO1xuICBjb25zdCBzdGF0ZTogU2VsZlVwZGF0ZVN0YXRlID0ge1xuICAgIGNoZWNrZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIHN0YXR1czogXCJjaGVja2luZ1wiLFxuICAgIGN1cnJlbnRWZXJzaW9uOiBDT0RFWF9QTFVTUExVU19WRVJTSU9OLFxuICAgIGxhdGVzdFZlcnNpb246IG51bGwsXG4gICAgdGFyZ2V0UmVmOiBjb25maWc/LnVwZGF0ZUNoYW5uZWwgPT09IFwiY3VzdG9tXCIgPyBjb25maWcudXBkYXRlUmVmID8/IG51bGwgOiBudWxsLFxuICAgIHJlbGVhc2VVcmw6IG51bGwsXG4gICAgcmVwbzogY29uZmlnPy51cGRhdGVSZXBvID8/IENPREVYX1BMVVNQTFVTX1JFUE8sXG4gICAgY2hhbm5lbCxcbiAgICBzb3VyY2VSb290LFxuICAgIGluc3RhbGxhdGlvblNvdXJjZTogZGVzY3JpYmVJbnN0YWxsYXRpb25Tb3VyY2Uoc291cmNlUm9vdCksXG4gIH07XG4gIHdyaXRlU2VsZlVwZGF0ZVN0YXRlKHN0YXRlKTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG5mdW5jdGlvbiBicm9hZGNhc3RSZWxvYWQoKTogdm9pZCB7XG4gIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgYXQ6IERhdGUubm93KCksXG4gICAgdHdlYWtzOiB0d2Vha1N0YXRlLmRpc2NvdmVyZWQubWFwKCh0KSA9PiB0Lm1hbmlmZXN0LmlkKSxcbiAgfTtcbiAgZm9yIChjb25zdCB3YyBvZiB3ZWJDb250ZW50cy5nZXRBbGxXZWJDb250ZW50cygpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHdjLnNlbmQoXCJjb2RleHBwOnR3ZWFrcy1jaGFuZ2VkXCIsIHBheWxvYWQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJicm9hZGNhc3Qgc2VuZCBmYWlsZWQ6XCIsIGUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlTG9nZ2VyKHNjb3BlOiBzdHJpbmcpIHtcbiAgcmV0dXJuIHtcbiAgICBkZWJ1ZzogKC4uLmE6IHVua25vd25bXSkgPT4gbG9nKFwiaW5mb1wiLCBgWyR7c2NvcGV9XWAsIC4uLmEpLFxuICAgIGluZm86ICguLi5hOiB1bmtub3duW10pID0+IGxvZyhcImluZm9cIiwgYFske3Njb3BlfV1gLCAuLi5hKSxcbiAgICB3YXJuOiAoLi4uYTogdW5rbm93bltdKSA9PiBsb2coXCJ3YXJuXCIsIGBbJHtzY29wZX1dYCwgLi4uYSksXG4gICAgZXJyb3I6ICguLi5hOiB1bmtub3duW10pID0+IGxvZyhcImVycm9yXCIsIGBbJHtzY29wZX1dYCwgLi4uYSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluQnJpZGdlKCkge1xuICByZXR1cm4ge1xuICAgIGFkZE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyOiAodHJhbnNmb3JtZXI6IE1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVyKSA9PiB7XG4gICAgICBtYWluTWVzc2FnZUZyb21WaWV3VHJhbnNmb3JtZXJzLmFkZCh0cmFuc2Zvcm1lcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1RyYW5zZm9ybWVycy5kZWxldGUodHJhbnNmb3JtZXIpO1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9LFxuICAgIGFkZE1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXI6IChsaXN0ZW5lcjogTWVzc2FnZUZyb21WaWV3UmVzcG9uc2VMaXN0ZW5lcikgPT4ge1xuICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1bnJlZ2lzdGVyOiAoKSA9PiB7XG4gICAgICAgICAgbWFpbk1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxNZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1Ib29rKCk6IHZvaWQge1xuICBjb25zdCBjdXJyZW50ID0gaXBjTWFpbi5oYW5kbGUgYXMgdHlwZW9mIGlwY01haW4uaGFuZGxlICYgeyBfX2NvZGV4cHBNZXNzYWdlVHJhbnNmb3JtUGF0Y2hlZD86IGJvb2xlYW4gfTtcbiAgaWYgKGN1cnJlbnQuX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQpIHJldHVybjtcbiAgY29uc3Qgb3JpZ2luYWxIYW5kbGUgPSBpcGNNYWluLmhhbmRsZS5iaW5kKGlwY01haW4pO1xuICBjb25zdCBwYXRjaGVkSGFuZGxlID0gKChjaGFubmVsOiBzdHJpbmcsIGxpc3RlbmVyOiBQYXJhbWV0ZXJzPHR5cGVvZiBpcGNNYWluLmhhbmRsZT5bMV0pID0+IHtcbiAgICBpZiAoY2hhbm5lbCAhPT0gREVTS1RPUF9NRVNTQUdFX0ZST01fVklFVykgcmV0dXJuIG9yaWdpbmFsSGFuZGxlKGNoYW5uZWwsIGxpc3RlbmVyKTtcbiAgICByZXR1cm4gb3JpZ2luYWxIYW5kbGUoY2hhbm5lbCwgYXN5bmMgKGV2ZW50LCBtZXNzYWdlKSA9PiB7XG4gICAgICBjb25zdCBjb250ZXh0ID0ge1xuICAgICAgICBzZW5kZXJJZDogZXZlbnQuc2VuZGVyPy5pZCxcbiAgICAgICAgc2VuZGVyVXJsOiBldmVudC5zZW5kZXJGcmFtZT8udXJsIHx8IGV2ZW50LnNlbmRlcj8uZ2V0VVJMPy4oKSxcbiAgICAgIH07XG4gICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlLCBjb250ZXh0KTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbGlzdGVuZXIoZXZlbnQsIHRyYW5zZm9ybWVkKTtcbiAgICAgIG5vdGlmeU1lc3NhZ2VGcm9tVmlld1Jlc3BvbnNlKHRyYW5zZm9ybWVkLCByZXNwb25zZSwgY29udGV4dCk7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfSk7XG4gIH0pIGFzIHR5cGVvZiBpcGNNYWluLmhhbmRsZSAmIHsgX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQ/OiBib29sZWFuIH07XG4gIHBhdGNoZWRIYW5kbGUuX19jb2RleHBwTWVzc2FnZVRyYW5zZm9ybVBhdGNoZWQgPSB0cnVlO1xuICBpcGNNYWluLmhhbmRsZSA9IHBhdGNoZWRIYW5kbGU7XG59XG5cbmZ1bmN0aW9uIHRyYW5zZm9ybU1lc3NhZ2VGcm9tVmlldyhtZXNzYWdlOiB1bmtub3duLCBjb250ZXh0OiBNZXNzYWdlRnJvbVZpZXdDb250ZXh0KTogdW5rbm93biB7XG4gIGxldCBjdXJyZW50ID0gbWVzc2FnZTtcbiAgZm9yIChjb25zdCB0cmFuc2Zvcm1lciBvZiBBcnJheS5mcm9tKG1haW5NZXNzYWdlRnJvbVZpZXdUcmFuc2Zvcm1lcnMpKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG5leHQgPSB0cmFuc2Zvcm1lcihjdXJyZW50LCBjb250ZXh0KTtcbiAgICAgIGlmIChuZXh0ICE9PSB1bmRlZmluZWQpIGN1cnJlbnQgPSBuZXh0O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIFwibWVzc2FnZS1mcm9tLXZpZXcgdHJhbnNmb3JtZXIgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyZW50O1xufVxuXG5mdW5jdGlvbiBub3RpZnlNZXNzYWdlRnJvbVZpZXdSZXNwb25zZShcbiAgbWVzc2FnZTogdW5rbm93bixcbiAgcmVzcG9uc2U6IHVua25vd24sXG4gIGNvbnRleHQ6IE1lc3NhZ2VGcm9tVmlld0NvbnRleHQsXG4pOiB2b2lkIHtcbiAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBBcnJheS5mcm9tKG1haW5NZXNzYWdlRnJvbVZpZXdSZXNwb25zZUxpc3RlbmVycykpIHtcbiAgICB0cnkge1xuICAgICAgbGlzdGVuZXIobWVzc2FnZSwgcmVzcG9uc2UsIGNvbnRleHQpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBsb2coXCJ3YXJuXCIsIFwibWVzc2FnZS1mcm9tLXZpZXcgcmVzcG9uc2UgbGlzdGVuZXIgZmFpbGVkOlwiLCBlcnJvcik7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluSXBjKGlkOiBzdHJpbmcpIHtcbiAgY29uc3QgY2ggPSAoYzogc3RyaW5nKSA9PiBgY29kZXhwcDoke2lkfToke2N9YDtcbiAgcmV0dXJuIHtcbiAgICBvbjogKGM6IHN0cmluZywgaDogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgY29uc3Qgd3JhcHBlZCA9IChfZTogdW5rbm93biwgLi4uYXJnczogdW5rbm93bltdKSA9PiBoKC4uLmFyZ3MpO1xuICAgICAgaXBjTWFpbi5vbihjaChjKSwgd3JhcHBlZCk7XG4gICAgICByZXR1cm4gKCkgPT4gaXBjTWFpbi5yZW1vdmVMaXN0ZW5lcihjaChjKSwgd3JhcHBlZCBhcyBuZXZlcik7XG4gICAgfSxcbiAgICBzZW5kOiAoX2M6IHN0cmluZykgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaXBjLnNlbmQgaXMgcmVuZGVyZXJcdTIxOTJtYWluOyBtYWluIHNpZGUgdXNlcyBoYW5kbGUvb25cIik7XG4gICAgfSxcbiAgICBpbnZva2U6IChfYzogc3RyaW5nKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpcGMuaW52b2tlIGlzIHJlbmRlcmVyXHUyMTkybWFpbjsgbWFpbiBzaWRlIHVzZXMgaGFuZGxlXCIpO1xuICAgIH0sXG4gICAgaGFuZGxlOiAoYzogc3RyaW5nLCBoYW5kbGVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB1bmtub3duKSA9PiB7XG4gICAgICBpcGNNYWluLmhhbmRsZShjaChjKSwgKF9lOiB1bmtub3duLCAuLi5hcmdzOiB1bmtub3duW10pID0+IGhhbmRsZXIoLi4uYXJncykpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VNYWluRnMoaWQ6IHN0cmluZykge1xuICBjb25zdCBkaXIgPSBqb2luKHVzZXJSb290ISwgXCJ0d2Vhay1kYXRhXCIsIGlkKTtcbiAgbWtkaXJTeW5jKGRpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IGZzID0gcmVxdWlyZShcIm5vZGU6ZnMvcHJvbWlzZXNcIikgYXMgdHlwZW9mIGltcG9ydChcIm5vZGU6ZnMvcHJvbWlzZXNcIik7XG4gIHJldHVybiB7XG4gICAgZGF0YURpcjogZGlyLFxuICAgIHJlYWQ6IChwOiBzdHJpbmcpID0+IGZzLnJlYWRGaWxlKGpvaW4oZGlyLCBwKSwgXCJ1dGY4XCIpLFxuICAgIHdyaXRlOiAocDogc3RyaW5nLCBjOiBzdHJpbmcpID0+IGZzLndyaXRlRmlsZShqb2luKGRpciwgcCksIGMsIFwidXRmOFwiKSxcbiAgICBleGlzdHM6IGFzeW5jIChwOiBzdHJpbmcpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGZzLmFjY2Vzcyhqb2luKGRpciwgcCkpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZU1vZGVsQXBpKHR3ZWFrSWQ6IHN0cmluZykge1xuICByZXR1cm4ge1xuICAgIGdlbmVyYXRlVGV4dDogKG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zKSA9PiB7XG4gICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb25Gb3JJZCh0d2Vha0lkLCBcIm1vZGVsXCIpO1xuICAgICAgcmV0dXJuIGdlbmVyYXRlTW9kZWxUZXh0KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gICAgZ2VuZXJhdGVPYmplY3Q6IDxUID0gdW5rbm93bj4ob3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucykgPT4ge1xuICAgICAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgXCJtb2RlbFwiKTtcbiAgICAgIHJldHVybiBnZW5lcmF0ZU1vZGVsT2JqZWN0PFQ+KHR3ZWFrSWQsIG9wdGlvbnMpO1xuICAgIH0sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsZWFuTW9kZWxSZWFzb25pbmdFZmZvcnQodmFsdWU6IHVua25vd24pOiBDb2RleE1vZGVsUmVhc29uaW5nRWZmb3J0IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSA9PT0gXCJtaW5pbWFsXCIgfHxcbiAgICB2YWx1ZSA9PT0gXCJsb3dcIiB8fFxuICAgIHZhbHVlID09PSBcIm1lZGl1bVwiIHx8XG4gICAgdmFsdWUgPT09IFwiaGlnaFwiIHx8XG4gICAgdmFsdWUgPT09IFwieGhpZ2hcIlxuICAgID8gdmFsdWVcbiAgICA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGNsZWFuTW9kZWxTdHJpbmcodmFsdWU6IHVua25vd24sIG1heExlbmd0aDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/IHZhbHVlLnNsaWNlKDAsIG1heExlbmd0aCkgOiBcIlwiO1xufVxuXG5mdW5jdGlvbiBtb2RlbFByb21wdChvcHRpb25zOiBDb2RleE1vZGVsR2VuZXJhdGVUZXh0T3B0aW9ucyk6IHN0cmluZyB7XG4gIGNvbnN0IHN5c3RlbSA9IGNsZWFuTW9kZWxTdHJpbmcob3B0aW9ucy5zeXN0ZW0sIDgwMDApLnRyaW0oKTtcbiAgY29uc3QgcHJvbXB0ID0gY2xlYW5Nb2RlbFN0cmluZyhvcHRpb25zLnByb21wdCwgMTIwMDAwKS50cmltKCk7XG4gIGlmICghcHJvbXB0KSB0aHJvdyBuZXcgRXJyb3IoXCJtb2RlbCBwcm9tcHQgaXMgcmVxdWlyZWRcIik7XG4gIHJldHVybiBzeXN0ZW0gPyBgJHtzeXN0ZW19XFxuXFxuJHtwcm9tcHR9YCA6IHByb21wdDtcbn1cblxuZnVuY3Rpb24gbW9kZWxXb3JraW5nRGlyZWN0b3J5KHR3ZWFrSWQ6IHN0cmluZywgY3dkOiB1bmtub3duKTogc3RyaW5nIHtcbiAgaWYgKHR5cGVvZiBjd2QgPT09IFwic3RyaW5nXCIgJiYgY3dkICYmIGlzQWJzb2x1dGUoY3dkKSAmJiBleGlzdHNTeW5jKGN3ZCkpIHJldHVybiBjd2Q7XG4gIHJldHVybiBqb2luKHVzZXJSb290ISwgXCJ0d2Vhay1kYXRhXCIsIHR3ZWFrSWQpO1xufVxuXG5mdW5jdGlvbiBjb2RleENsaUVudigpOiBOb2RlSlMuUHJvY2Vzc0VudiB7XG4gIHJldHVybiB7XG4gICAgLi4ucHJvY2Vzcy5lbnYsXG4gICAgSE9NRTogcHJvY2Vzcy5lbnYuSE9NRSB8fCBob21lZGlyKCksXG4gICAgQ09ERVhfSU5URVJOQUxfT1JJR0lOQVRPUl9PVkVSUklERTogcHJvY2Vzcy5lbnYuQ09ERVhfSU5URVJOQUxfT1JJR0lOQVRPUl9PVkVSUklERSB8fCBcIkNvZGV4KytcIixcbiAgICBQQVRIOiBbXG4gICAgICBwcm9jZXNzLmVudi5QQVRIIHx8IFwiXCIsXG4gICAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgICBcIi91c3IvbG9jYWwvYmluXCIsXG4gICAgICBcIi91c3IvYmluXCIsXG4gICAgICBcIi9iaW5cIixcbiAgICBdLmZpbHRlcihCb29sZWFuKS5qb2luKFwiOlwiKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29kZXhDbGlDb21tYW5kKCk6IHN0cmluZyB7XG4gIHJldHVybiBwcm9jZXNzLmVudi5DT0RFWF9QTFVTUExVU19DT0RFWF9DTEkgfHwgcHJvY2Vzcy5lbnYuQ09ERVhfQ0xJIHx8IFwiY29kZXhcIjtcbn1cblxuZnVuY3Rpb24gbW9kZWxUaW1lb3V0TXModmFsdWU6IHVua25vd24pOiBudW1iZXIge1xuICBjb25zdCB0aW1lb3V0TXMgPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHZhbHVlKSA/IHZhbHVlIDogNDVfMDAwO1xuICByZXR1cm4gTWF0aC5tYXgoNV8wMDAsIE1hdGgubWluKDE4MF8wMDAsIE1hdGguZmxvb3IodGltZW91dE1zKSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBydW5Db2RleE1vZGVsKFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zLFxuICBzY2hlbWE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbik6IFByb21pc2U8Q29kZXhNb2RlbFRleHRSZXN1bHQ+IHtcbiAgY29uc3QgcHJvbXB0ID0gbW9kZWxQcm9tcHQob3B0aW9ucyk7XG4gIGNvbnN0IG1vZGVsID0gY2xlYW5Nb2RlbFN0cmluZyhvcHRpb25zLm1vZGVsLCAxMjApLnRyaW0oKTtcbiAgY29uc3QgcmVhc29uaW5nRWZmb3J0ID0gY2xlYW5Nb2RlbFJlYXNvbmluZ0VmZm9ydChvcHRpb25zLnJlYXNvbmluZ0VmZm9ydCk7XG4gIGNvbnN0IGN3ZCA9IG1vZGVsV29ya2luZ0RpcmVjdG9yeSh0d2Vha0lkLCBvcHRpb25zLmN3ZCk7XG4gIGNvbnN0IHRlbXBEaXIgPSBta2R0ZW1wU3luYyhqb2luKHRtcGRpcigpLCBcImNvZGV4cHAtbW9kZWwtXCIpKTtcbiAgY29uc3QgcHJvbXB0UGF0aCA9IGpvaW4odGVtcERpciwgXCJwcm9tcHQudHh0XCIpO1xuICBjb25zdCBvdXRwdXRQYXRoID0gam9pbih0ZW1wRGlyLCBcIm91dHB1dC50eHRcIik7XG4gIGNvbnN0IHNjaGVtYVBhdGggPSBqb2luKHRlbXBEaXIsIFwic2NoZW1hLmpzb25cIik7XG5cbiAgdHJ5IHtcbiAgICB3cml0ZUZpbGVTeW5jKHByb21wdFBhdGgsIHByb21wdCwgXCJ1dGY4XCIpO1xuICAgIGNvbnN0IGFyZ3MgPSBbXG4gICAgICBcImV4ZWNcIixcbiAgICAgIFwiLS1lcGhlbWVyYWxcIixcbiAgICAgIFwiLS1za2lwLWdpdC1yZXBvLWNoZWNrXCIsXG4gICAgICBcIi0taWdub3JlLXJ1bGVzXCIsXG4gICAgICBcIi0tYXNrLWZvci1hcHByb3ZhbFwiLFxuICAgICAgXCJuZXZlclwiLFxuICAgICAgXCItLXNhbmRib3hcIixcbiAgICAgIFwicmVhZC1vbmx5XCIsXG4gICAgICBcIi0tb3V0cHV0LWxhc3QtbWVzc2FnZVwiLFxuICAgICAgb3V0cHV0UGF0aCxcbiAgICAgIFwiLUNcIixcbiAgICAgIGN3ZCxcbiAgICBdO1xuXG4gICAgaWYgKG1vZGVsKSBhcmdzLnB1c2goXCItLW1vZGVsXCIsIG1vZGVsKTtcbiAgICBpZiAocmVhc29uaW5nRWZmb3J0KSBhcmdzLnB1c2goXCItY1wiLCBgbW9kZWxfcmVhc29uaW5nX2VmZm9ydD1cIiR7cmVhc29uaW5nRWZmb3J0fVwiYCk7XG4gICAgaWYgKHNjaGVtYSkge1xuICAgICAgd3JpdGVGaWxlU3luYyhzY2hlbWFQYXRoLCBKU09OLnN0cmluZ2lmeShzY2hlbWEsIG51bGwsIDIpLCBcInV0ZjhcIik7XG4gICAgICBhcmdzLnB1c2goXCItLW91dHB1dC1zY2hlbWFcIiwgc2NoZW1hUGF0aCk7XG4gICAgfVxuICAgIGFyZ3MucHVzaChcIi1cIik7XG5cbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzcGF3bldpdGhJbnB1dChjb2RleENsaUNvbW1hbmQoKSwgYXJncywgcHJvbXB0LCB7XG4gICAgICBjd2QsXG4gICAgICBlbnY6IGNvZGV4Q2xpRW52KCksXG4gICAgICB0aW1lb3V0TXM6IG1vZGVsVGltZW91dE1zKG9wdGlvbnMudGltZW91dE1zKSxcbiAgICB9KTtcbiAgICBpZiAocmVzdWx0LnN0YXR1cyAhPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBjb2RleCBleGVjIGZhaWxlZCAoJHtyZXN1bHQuc3RhdHVzID8/IFwic2lnbmFsXCJ9KTogJHtyZXN1bHQuc3RkZXJyLnNsaWNlKC0yMDAwKX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0ID0gcmVhZEZpbGVTeW5jKG91dHB1dFBhdGgsIFwidXRmOFwiKS50cmltKCk7XG4gICAgaWYgKCF0ZXh0KSB0aHJvdyBuZXcgRXJyb3IoXCJjb2RleCBleGVjIHJldHVybmVkIGFuIGVtcHR5IGZpbmFsIG1lc3NhZ2VcIik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRleHQsXG4gICAgICBtb2RlbDogbW9kZWwgfHwgbnVsbCxcbiAgICAgIHJlYXNvbmluZ0VmZm9ydCxcbiAgICB9O1xuICB9IGZpbmFsbHkge1xuICAgIHJtU3luYyh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3Bhd25XaXRoSW5wdXQoXG4gIGNvbW1hbmQ6IHN0cmluZyxcbiAgYXJnczogc3RyaW5nW10sXG4gIGlucHV0OiBzdHJpbmcsXG4gIG9wdGlvbnM6IHsgY3dkOiBzdHJpbmc7IGVudjogTm9kZUpTLlByb2Nlc3NFbnY7IHRpbWVvdXRNczogbnVtYmVyIH0sXG4pOiBQcm9taXNlPHsgc3RhdHVzOiBudW1iZXIgfCBudWxsOyBzaWduYWw6IE5vZGVKUy5TaWduYWxzIHwgbnVsbDsgc3Rkb3V0OiBzdHJpbmc7IHN0ZGVycjogc3RyaW5nIH0+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlUHJvbWlzZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgY2hpbGQgPSBzcGF3bihjb21tYW5kLCBhcmdzLCB7XG4gICAgICBjd2Q6IG9wdGlvbnMuY3dkLFxuICAgICAgZW52OiBvcHRpb25zLmVudixcbiAgICAgIHN0ZGlvOiBbXCJwaXBlXCIsIFwicGlwZVwiLCBcInBpcGVcIl0sXG4gICAgfSk7XG4gICAgbGV0IHN0ZG91dCA9IFwiXCI7XG4gICAgbGV0IHN0ZGVyciA9IFwiXCI7XG4gICAgbGV0IHNldHRsZWQgPSBmYWxzZTtcbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHJldHVybjtcbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgY2hpbGQua2lsbChcIlNJR1RFUk1cIik7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBjb2RleCBtb2RlbCBnZW5lcmF0aW9uIHRpbWVkIG91dCBhZnRlciAke29wdGlvbnMudGltZW91dE1zfW1zYCkpO1xuICAgIH0sIG9wdGlvbnMudGltZW91dE1zKTtcblxuICAgIGNoaWxkLnN0ZG91dD8uc2V0RW5jb2RpbmcoXCJ1dGY4XCIpO1xuICAgIGNoaWxkLnN0ZGVycj8uc2V0RW5jb2RpbmcoXCJ1dGY4XCIpO1xuICAgIGNoaWxkLnN0ZG91dD8ub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xuICAgICAgc3Rkb3V0ICs9IFN0cmluZyhjaHVuayk7XG4gICAgICBpZiAoc3Rkb3V0Lmxlbmd0aCA+IDEyOF8wMDApIHN0ZG91dCA9IHN0ZG91dC5zbGljZSgtMTI4XzAwMCk7XG4gICAgfSk7XG4gICAgY2hpbGQuc3RkZXJyPy5vbihcImRhdGFcIiwgKGNodW5rKSA9PiB7XG4gICAgICBzdGRlcnIgKz0gU3RyaW5nKGNodW5rKTtcbiAgICAgIGlmIChzdGRlcnIubGVuZ3RoID4gMTI4XzAwMCkgc3RkZXJyID0gc3RkZXJyLnNsaWNlKC0xMjhfMDAwKTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbihcImVycm9yXCIsIChlcnJvcikgPT4ge1xuICAgICAgaWYgKHNldHRsZWQpIHJldHVybjtcbiAgICAgIHNldHRsZWQgPSB0cnVlO1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgfSk7XG4gICAgY2hpbGQub24oXCJjbG9zZVwiLCAoc3RhdHVzLCBzaWduYWwpID0+IHtcbiAgICAgIGlmIChzZXR0bGVkKSByZXR1cm47XG4gICAgICBzZXR0bGVkID0gdHJ1ZTtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICByZXNvbHZlUHJvbWlzZSh7IHN0YXR1cywgc2lnbmFsLCBzdGRvdXQsIHN0ZGVyciB9KTtcbiAgICB9KTtcbiAgICBjaGlsZC5zdGRpbj8uZW5kKGlucHV0KTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlTW9kZWxUZXh0KFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIG9wdGlvbnM6IENvZGV4TW9kZWxHZW5lcmF0ZVRleHRPcHRpb25zLFxuKTogUHJvbWlzZTxDb2RleE1vZGVsVGV4dFJlc3VsdD4ge1xuICByZXR1cm4gcnVuQ29kZXhNb2RlbCh0d2Vha0lkLCBvcHRpb25zKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVNb2RlbE9iamVjdDxUID0gdW5rbm93bj4oXG4gIHR3ZWFrSWQ6IHN0cmluZyxcbiAgb3B0aW9uczogQ29kZXhNb2RlbEdlbmVyYXRlT2JqZWN0T3B0aW9ucyxcbik6IFByb21pc2U8Q29kZXhNb2RlbE9iamVjdFJlc3VsdDxUPj4ge1xuICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09IFwib2JqZWN0XCIgfHwgIW9wdGlvbnMuc2NoZW1hIHx8IHR5cGVvZiBvcHRpb25zLnNjaGVtYSAhPT0gXCJvYmplY3RcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm1vZGVsIG9iamVjdCBnZW5lcmF0aW9uIHJlcXVpcmVzIGEgSlNPTiBzY2hlbWFcIik7XG4gIH1cbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcnVuQ29kZXhNb2RlbCh0d2Vha0lkLCBvcHRpb25zLCBvcHRpb25zLnNjaGVtYSk7XG4gIGxldCBvYmplY3Q6IFQ7XG4gIHRyeSB7XG4gICAgb2JqZWN0ID0gSlNPTi5wYXJzZShyZXN1bHQudGV4dCkgYXMgVDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYG1vZGVsIG9iamVjdCBnZW5lcmF0aW9uIHJldHVybmVkIGludmFsaWQgSlNPTjogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V9YCk7XG4gIH1cbiAgcmV0dXJuIHsgLi4ucmVzdWx0LCBvYmplY3QgfTtcbn1cblxuZnVuY3Rpb24gY3VycmVudFJ1bnRpbWVJbmZvKCk6IENvZGV4UnVudGltZUluZm8ge1xuICBjb25zdCBpbnN0YWxsZXJTdGF0ZSA9IHJlYWRJbnN0YWxsZXJTdGF0ZSgpO1xuICByZXR1cm4gZ2V0UnVudGltZUluZm8oe1xuICAgIHVzZXJSb290OiB1c2VyUm9vdCEsXG4gICAgcnVudGltZURpcjogcnVudGltZURpciEsXG4gICAgY29kZXhWZXJzaW9uOiBpbnN0YWxsZXJTdGF0ZT8uY29kZXhWZXJzaW9uID8/IG51bGwsXG4gICAgY2hhbm5lbDogbnVsbCxcbiAgICBnZXRXaW5kb3dTZXJ2aWNlczogZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcyxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGN1cnJlbnRSdW50aW1lQ2FwYWJpbGl0aWVzKCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllcyB7XG4gIGNvbnN0IGluc3RhbGxlclN0YXRlID0gcmVhZEluc3RhbGxlclN0YXRlKCk7XG4gIHJldHVybiBnZXRSdW50aW1lQ2FwYWJpbGl0aWVzKHtcbiAgICB1c2VyUm9vdDogdXNlclJvb3QhLFxuICAgIHJ1bnRpbWVEaXI6IHJ1bnRpbWVEaXIhLFxuICAgIGNvZGV4VmVyc2lvbjogaW5zdGFsbGVyU3RhdGU/LmNvZGV4VmVyc2lvbiA/PyBudWxsLFxuICAgIGNoYW5uZWw6IG51bGwsXG4gICAgZ2V0V2luZG93U2VydmljZXM6IGdldENvZGV4V2luZG93U2VydmljZXMsXG4gICAgZ2V0TmF0aXZlQ2FwYWJpbGl0aWVzOiAoKSA9PiBuYXRpdmVCcmlkZ2UuZ2V0Q2FwYWJpbGl0aWVzKCksXG4gICAgZ2V0Vmlld0NhcGFiaWxpdGllczogKCkgPT4gZ2V0T3dsVmlld0NhcGFiaWxpdGllcygpLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gdHdlYWtDb250ZXh0KHR3ZWFrSWQ6IHN0cmluZywgcGVybWlzc2lvbj86IFR3ZWFrUGVybWlzc2lvbik6IE5hdGl2ZVR3ZWFrQ29udGV4dCB7XG4gIGNvbnN0IHR3ZWFrID0gcGVybWlzc2lvblxuICAgID8gYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZCwgcGVybWlzc2lvbilcbiAgICA6IHR3ZWFrQnlJZCh0d2Vha0lkKTtcbiAgcmV0dXJuIHsgaWQ6IHR3ZWFrLm1hbmlmZXN0LmlkLCBkaXI6IHR3ZWFrLmRpciB9O1xufVxuXG5mdW5jdGlvbiB0d2Vha0J5SWQodHdlYWtJZDogc3RyaW5nKTogRGlzY292ZXJlZFR3ZWFrIHtcbiAgYXNzZXJ0VHdlYWtJZCh0d2Vha0lkKTtcbiAgY29uc3QgdHdlYWsgPSB0d2Vha1N0YXRlLmRpc2NvdmVyZWQuZmluZCgoaXRlbSkgPT4gaXRlbS5tYW5pZmVzdC5pZCA9PT0gdHdlYWtJZCk7XG4gIGlmICghdHdlYWspIHRocm93IG5ldyBFcnJvcihgdW5rbm93biB0d2VhazogJHt0d2Vha0lkfWApO1xuICBpZiAoIWlzVHdlYWtFbmFibGVkKHR3ZWFrSWQpKSB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrIGlzIGRpc2FibGVkOiAke3R3ZWFrSWR9YCk7XG4gIHJldHVybiB0d2Vhaztcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtQZXJtaXNzaW9uRm9ySWQodHdlYWtJZDogc3RyaW5nLCBwZXJtaXNzaW9uOiBUd2Vha1Blcm1pc3Npb24pOiBEaXNjb3ZlcmVkVHdlYWsge1xuICBjb25zdCB0d2VhayA9IHR3ZWFrQnlJZCh0d2Vha0lkKTtcbiAgYXNzZXJ0VHdlYWtQZXJtaXNzaW9uKHR3ZWFrLCBwZXJtaXNzaW9uKTtcbiAgcmV0dXJuIHR3ZWFrO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRUd2Vha1ZpZXdQZXJtaXNzaW9uRm9ySWQodHdlYWtJZDogc3RyaW5nKTogRGlzY292ZXJlZFR3ZWFrIHtcbiAgY29uc3QgdHdlYWsgPSB0d2Vha0J5SWQodHdlYWtJZCk7XG4gIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb24odHdlYWspO1xuICByZXR1cm4gdHdlYWs7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFR3ZWFrUGVybWlzc2lvbih0d2VhazogRGlzY292ZXJlZFR3ZWFrLCBwZXJtaXNzaW9uOiBUd2Vha1Blcm1pc3Npb24pOiB2b2lkIHtcbiAgaWYgKHR3ZWFrLm1hbmlmZXN0LnBlcm1pc3Npb25zPy5pbmNsdWRlcyhwZXJtaXNzaW9uKSkgcmV0dXJuO1xuICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dHdlYWsubWFuaWZlc3QuaWR9IG11c3QgZGVjbGFyZSAke3Blcm1pc3Npb259IHBlcm1pc3Npb25gKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0VHdlYWtWaWV3UGVybWlzc2lvbih0d2VhazogRGlzY292ZXJlZFR3ZWFrKTogdm9pZCB7XG4gIGlmIChcbiAgICB0d2Vhay5tYW5pZmVzdC5wZXJtaXNzaW9ucz8uaW5jbHVkZXMoXCJjb2RleC12aWV3c1wiKSB8fFxuICAgIHR3ZWFrLm1hbmlmZXN0LnBlcm1pc3Npb25zPy5pbmNsdWRlcyhcImNvZGV4LnZpZXdzXCIpXG4gICkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoYHR3ZWFrICR7dHdlYWsubWFuaWZlc3QuaWR9IG11c3QgZGVjbGFyZSBjb2RleC12aWV3cyBwZXJtaXNzaW9uYCk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydFR3ZWFrSWQodHdlYWtJZDogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghL15bYS16QS1aMC05Ll8tXSskLy50ZXN0KHR3ZWFrSWQpKSB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgdHdlYWsgaWRcIik7XG59XG5cbmZ1bmN0aW9uIGdldFByaW1hcnlDb2RleFdpbmRvdygpOiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBjb25zdCBmcm9tU2VydmljZXMgPSB0eXBlb2Ygc2VydmljZXM/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gc2VydmljZXMuZ2V0UHJpbWFyeVdpbmRvdyhcImxvY2FsXCIpXG4gICAgOiBudWxsO1xuICBpZiAoZnJvbVNlcnZpY2VzICYmICFmcm9tU2VydmljZXMuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZyb21TZXJ2aWNlcztcbiAgY29uc3QgZnJvbU1hbmFnZXIgPSB0eXBlb2Ygc2VydmljZXM/LndpbmRvd01hbmFnZXI/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIlxuICAgID8gc2VydmljZXMud2luZG93TWFuYWdlci5nZXRQcmltYXJ5V2luZG93LmNhbGwoc2VydmljZXMud2luZG93TWFuYWdlcilcbiAgICA6IG51bGw7XG4gIGlmIChmcm9tTWFuYWdlciAmJiAhZnJvbU1hbmFnZXIuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIGZyb21NYW5hZ2VyO1xuICBjb25zdCBmb2N1c2VkID0gQnJvd3NlcldpbmRvdy5nZXRGb2N1c2VkV2luZG93KCk7XG4gIGlmIChmb2N1c2VkICYmICFmb2N1c2VkLmlzRGVzdHJveWVkKCkpIHJldHVybiBmb2N1c2VkO1xuICByZXR1cm4gQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkuZmluZCgod2luKSA9PiAhd2luLmlzRGVzdHJveWVkKCkpID8/IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFByaW1hcnlDb2RleFdpbmRvd1JlZigpOiBDb2RleFdpbmRvd1JlZiB8IG51bGwge1xuICBjb25zdCB3aW4gPSBnZXRQcmltYXJ5Q29kZXhXaW5kb3coKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBudWxsO1xuICByZXR1cm4geyB3aW5kb3dJZDogd2luLmlkLCB3ZWJDb250ZW50c0lkOiB3aW4ud2ViQ29udGVudHMuaWQgfTtcbn1cblxuZnVuY3Rpb24gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHdpbmRvd0lkKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBmYWxzZTtcbiAgaWYgKHdpbi5pc01pbmltaXplZCgpKSB3aW4ucmVzdG9yZSgpO1xuICB3aW4uc2hvdygpO1xuICB3aW4uZm9jdXMoKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHNob3dDb2RleFdpbmRvdyh3aW5kb3dJZDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHdpbiA9IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHdpbmRvd0lkKTtcbiAgaWYgKCF3aW4gfHwgd2luLmlzRGVzdHJveWVkKCkpIHJldHVybiBmYWxzZTtcbiAgd2luLnNob3coKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldE93bFZpZXdDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1widmlld3NcIl0ge1xuICBjb25zdCBwYXJlbnQgPSBnZXRQcmltYXJ5Q29kZXhXaW5kb3coKSA/PyBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgY29uc3QgY29udGVudFZpZXcgPSBhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldztcbiAgbGV0IHNhbXBsZVZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3IHwgbnVsbCA9IG51bGw7XG4gIHRyeSB7XG4gICAgc2FtcGxlVmlldyA9IG5ldyBCcm93c2VyVmlldyh7IHdlYlByZWZlcmVuY2VzOiB7IHNhbmRib3g6IHRydWUgfSB9KTtcbiAgfSBjYXRjaCB7fVxuICBjb25zdCB3ZWJDb250ZW50c1ZpZXcgPSBhc1JlY29yZChzYW1wbGVWaWV3KT8ud2ViQ29udGVudHNWaWV3O1xuICBjb25zdCBwcml2YXRlVmlld1RyZWUgPSB0eXBlb2YgYXNSZWNvcmQoY29udGVudFZpZXcpPy5hZGRDaGlsZFZpZXcgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgIHR5cGVvZiBhc1JlY29yZChjb250ZW50Vmlldyk/LnJlbW92ZUNoaWxkVmlldyA9PT0gXCJmdW5jdGlvblwiO1xuICBjb25zdCB3ZWJDb250ZW50c1ZpZXdBdmFpbGFibGUgPSBCb29sZWFuKHdlYkNvbnRlbnRzVmlldykgJiZcbiAgICB0eXBlb2YgYXNSZWNvcmQod2ViQ29udGVudHNWaWV3KT8uc2V0Qm91bmRzID09PSBcImZ1bmN0aW9uXCI7XG4gIGNvbnN0IHByaXZhdGVBdHRhY2ggPSBwcml2YXRlVmlld1RyZWUgJiYgd2ViQ29udGVudHNWaWV3QXZhaWxhYmxlO1xuICBjb25zdCBicm93c2VyVmlld0ZhbGxiYWNrID0gdHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LmFkZEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCI7XG4gIHRyeSB7XG4gICAgaWYgKHNhbXBsZVZpZXcgJiYgIXNhbXBsZVZpZXcud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgc2FtcGxlVmlldy53ZWJDb250ZW50cy5jbG9zZSh7IHdhaXRGb3JCZWZvcmVVbmxvYWQ6IGZhbHNlIH0pO1xuICAgIH1cbiAgfSBjYXRjaCB7fVxuICByZXR1cm4ge1xuICAgIGNyZWF0ZTogcHJpdmF0ZUF0dGFjaCB8fCBicm93c2VyVmlld0ZhbGxiYWNrLFxuICAgIHByaXZhdGVWaWV3VHJlZTogcHJpdmF0ZUF0dGFjaCxcbiAgICB3ZWJDb250ZW50c1ZpZXc6IHdlYkNvbnRlbnRzVmlld0F2YWlsYWJsZSxcbiAgICBicm93c2VyVmlld0ZhbGxiYWNrLFxuICB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVPd2xWaWV3KFxuICBjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCxcbiAgb3B0czogQ29kZXhWaWV3Q3JlYXRlT3B0aW9ucyxcbik6IFByb21pc2U8Q29kZXhWaWV3UmVmPiB7XG4gIGNvbnN0IGlkID0gYXNzZXJ0QnJpZGdlSWQob3B0cy5pZCA/PyByYW5kb21VVUlEKCksIFwiQ29kZXggdmlldyBpZFwiKTtcbiAgY29uc3Qga2V5ID0gb3dsVmlld0tleShjdHguaWQsIGlkKTtcbiAgaWYgKG93bFZpZXdzLmhhcyhrZXkpKSB0aHJvdyBuZXcgRXJyb3IoYENvZGV4IHZpZXcgYWxyZWFkeSBleGlzdHM6ICR7Y3R4LmlkfToke2lkfWApO1xuXG4gIGNvbnN0IHBhcmVudCA9IHR5cGVvZiBvcHRzLnBhcmVudFdpbmRvd0lkID09PSBcIm51bWJlclwiXG4gICAgPyBCcm93c2VyV2luZG93LmZyb21JZChvcHRzLnBhcmVudFdpbmRvd0lkKVxuICAgIDogZ2V0UHJpbWFyeUNvZGV4V2luZG93KCk7XG4gIGlmICghcGFyZW50IHx8IGlzV2luZG93RGVzdHJveWVkKHBhcmVudCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCB2aWV3IG5lZWRzIGFuIGFjdGl2ZSBwYXJlbnQgd2luZG93XCIpO1xuICB9XG5cbiAgY29uc3Qgc2VydmljZXMgPSBnZXRDb2RleFdpbmRvd1NlcnZpY2VzKCk7XG4gIGNvbnN0IHdpbmRvd01hbmFnZXIgPSBzZXJ2aWNlcz8ud2luZG93TWFuYWdlcjtcbiAgY29uc3Qgcm91dGUgPSBvcHRzLnJvdXRlID09PSB1bmRlZmluZWQgPyBudWxsIDogbm9ybWFsaXplQ29kZXhSb3V0ZShvcHRzLnJvdXRlKTtcbiAgY29uc3QgaG9zdElkID0gb3B0cy5ob3N0SWQgfHwgXCJsb2NhbFwiO1xuICBjb25zdCB2aWV3ID0gbmV3IEJyb3dzZXJWaWV3KHtcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgcHJlbG9hZDogb3B0cy5yZWdpc3RlcldpdGhDb2RleCA9PT0gZmFsc2UgPyB1bmRlZmluZWQgOiB3aW5kb3dNYW5hZ2VyPy5vcHRpb25zPy5wcmVsb2FkUGF0aCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgc3BlbGxjaGVjazogZmFsc2UsXG4gICAgICBkZXZUb29sczogd2luZG93TWFuYWdlcj8ub3B0aW9ucz8uYWxsb3dEZXZ0b29scyxcbiAgICB9LFxuICB9KTtcblxuICBpZiAob3B0cy5iYWNrZ3JvdW5kQ29sb3IpIHtcbiAgICBjYWxsT2JqZWN0TWV0aG9kKHZpZXcsIFwic2V0QmFja2dyb3VuZENvbG9yXCIsIFtvcHRzLmJhY2tncm91bmRDb2xvcl0pO1xuICAgIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQodmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRCYWNrZ3JvdW5kQ29sb3JcIiwgW29wdHMuYmFja2dyb3VuZENvbG9yXSk7XG4gIH1cblxuICBjb25zdCBtYW5hZ2VkOiBNYW5hZ2VkT3dsVmlldyA9IHtcbiAgICBrZXksXG4gICAgdHdlYWtJZDogY3R4LmlkLFxuICAgIGlkLFxuICAgIHZpZXcsXG4gICAgcGFyZW50V2luZG93SWQ6IHdpbmRvd0lkRm9yKHBhcmVudCksXG4gICAgYXR0YWNoTW9kZTogbnVsbCxcbiAgICBkaXNwb3NlQmluZGluZ3M6IFtdLFxuICAgIGRpc3Bvc2VkOiBmYWxzZSxcbiAgfTtcbiAgb3dsVmlld3Muc2V0KGtleSwgbWFuYWdlZCk7XG5cbiAgdHJ5IHtcbiAgICBpZiAocm91dGUgIT09IG51bGwgJiYgb3B0cy5yZWdpc3RlcldpdGhDb2RleCAhPT0gZmFsc2UgJiYgd2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cpIHtcbiAgICAgIGNvbnN0IGFwcGVhcmFuY2UgPSBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIjtcbiAgICAgIGNvbnN0IHdpbmRvd0xpa2UgPSBtYWtlV2luZG93TGlrZUZvclZpZXcodmlldyk7XG4gICAgICB3aW5kb3dNYW5hZ2VyLnJlZ2lzdGVyV2luZG93KHdpbmRvd0xpa2UsIGhvc3RJZCwgZmFsc2UsIGFwcGVhcmFuY2UpO1xuICAgICAgc2VydmljZXM/LmdldENvbnRleHQ/Lihob3N0SWQpPy5yZWdpc3RlcldpbmRvdz8uKHdpbmRvd0xpa2UpO1xuICAgIH1cblxuICAgIGF0dGFjaE93bFZpZXcobWFuYWdlZCwgcGFyZW50KTtcbiAgICBpZiAob3B0cy5ib3VuZHMpIHNldE93bFZpZXdCb3VuZHMobWFuYWdlZCwgb3B0cy5ib3VuZHMpO1xuICAgIGlmIChvcHRzLnZpc2libGUgPT09IGZhbHNlKSBzZXRPd2xWaWV3VmlzaWJsZShtYW5hZ2VkLCBmYWxzZSk7XG5cbiAgICBpZiAocm91dGUgIT09IG51bGwpIHtcbiAgICAgIGF3YWl0IHZpZXcud2ViQ29udGVudHMubG9hZFVSTChjb2RleEFwcFVybChyb3V0ZSwgaG9zdElkKSk7XG4gICAgfSBlbHNlIGlmIChvcHRzLnVybCkge1xuICAgICAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKG5vcm1hbGl6ZU93bFZpZXdVcmwob3B0cy51cmwpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdmlldy53ZWJDb250ZW50cy5sb2FkVVJMKFwiYWJvdXQ6YmxhbmtcIik7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgZGlzcG9zZU93bFZpZXcobWFuYWdlZCk7XG4gICAgdGhyb3cgZTtcbiAgfVxuXG4gIGxvZyhcImluZm9cIiwgYGNyZWF0ZWQgT3dsIHZpZXcgJHtjdHguaWR9OiR7aWR9YCwge1xuICAgIHBhcmVudFdpbmRvd0lkOiBtYW5hZ2VkLnBhcmVudFdpbmRvd0lkLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHZpZXcud2ViQ29udGVudHMuaWQsXG4gICAgYXR0YWNoTW9kZTogbWFuYWdlZC5hdHRhY2hNb2RlLFxuICB9KTtcbiAgcmV0dXJuIG93bFZpZXdSZWYobWFuYWdlZCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNhbGxPd2xWaWV3KFxuICB0d2Vha0lkOiBzdHJpbmcsXG4gIGlkOiBzdHJpbmcsXG4gIG1ldGhvZDogc3RyaW5nLFxuICBhcmc/OiB1bmtub3duLFxuICBhcmcyPzogdW5rbm93bixcbik6IFByb21pc2U8dW5rbm93bj4ge1xuICBjb25zdCB2aWV3ID0gb3dsVmlld0Zvcih0d2Vha0lkLCBpZCk7XG4gIGlmIChtZXRob2QgPT09IFwic2V0Qm91bmRzXCIpIHJldHVybiBzZXRPd2xWaWV3Qm91bmRzKHZpZXcsIGFyZyBhcyBFbGVjdHJvbi5SZWN0YW5nbGUpO1xuICBpZiAobWV0aG9kID09PSBcInNldFZpc2libGVcIikgcmV0dXJuIHNldE93bFZpZXdWaXNpYmxlKHZpZXcsIEJvb2xlYW4oYXJnKSk7XG4gIGlmIChtZXRob2QgPT09IFwiYnJpbmdUb0Zyb250XCIpIHJldHVybiBicmluZ093bFZpZXdUb0Zyb250KHZpZXcpO1xuICBpZiAobWV0aG9kID09PSBcImxvYWRSb3V0ZVwiKSB7XG4gICAgY29uc3Qgcm91dGUgPSBub3JtYWxpemVDb2RleFJvdXRlKFN0cmluZyhhcmcpKTtcbiAgICBjb25zdCBob3N0SWQgPSB0eXBlb2YgYXJnMiA9PT0gXCJzdHJpbmdcIiAmJiBhcmcyID8gYXJnMiA6IFwibG9jYWxcIjtcbiAgICByZXR1cm4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwoY29kZXhBcHBVcmwocm91dGUsIGhvc3RJZCkpO1xuICB9XG4gIGlmIChtZXRob2QgPT09IFwibG9hZFVybFwiKSByZXR1cm4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwobm9ybWFsaXplT3dsVmlld1VybChTdHJpbmcoYXJnKSkpO1xuICBpZiAobWV0aG9kID09PSBcImRpc3Bvc2VcIikgcmV0dXJuIGRpc3Bvc2VPd2xWaWV3QnlJZCh0d2Vha0lkLCBpZCk7XG4gIHRocm93IG5ldyBFcnJvcihgdW5rbm93biBDb2RleCB2aWV3IG1ldGhvZDogJHttZXRob2R9YCk7XG59XG5cbmZ1bmN0aW9uIG93bFZpZXdSZWYodmlldzogTWFuYWdlZE93bFZpZXcpOiBDb2RleFZpZXdSZWYge1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3LmlkLFxuICAgIHdlYkNvbnRlbnRzSWQ6IHZpZXcudmlldy53ZWJDb250ZW50cy5pZCxcbiAgICBwYXJlbnRXaW5kb3dJZDogdmlldy5wYXJlbnRXaW5kb3dJZCxcbiAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+IFByb21pc2UucmVzb2x2ZShzZXRPd2xWaWV3Qm91bmRzKHZpZXcsIGJvdW5kcykpLFxuICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PiBQcm9taXNlLnJlc29sdmUoc2V0T3dsVmlld1Zpc2libGUodmlldywgdmlzaWJsZSkpLFxuICAgIGJyaW5nVG9Gcm9udDogKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGJyaW5nT3dsVmlld1RvRnJvbnQodmlldykpLFxuICAgIGxvYWRSb3V0ZTogKHJvdXRlLCBob3N0SWQpID0+IHZpZXcudmlldy53ZWJDb250ZW50cy5sb2FkVVJMKGNvZGV4QXBwVXJsKG5vcm1hbGl6ZUNvZGV4Um91dGUocm91dGUpLCBob3N0SWQgfHwgXCJsb2NhbFwiKSkudGhlbigoKSA9PiB7fSksXG4gICAgbG9hZFVybDogKHVybCkgPT4gdmlldy52aWV3LndlYkNvbnRlbnRzLmxvYWRVUkwobm9ybWFsaXplT3dsVmlld1VybCh1cmwpKS50aGVuKCgpID0+IHt9KSxcbiAgICBkaXNwb3NlOiAoKSA9PiBQcm9taXNlLnJlc29sdmUoZGlzcG9zZU93bFZpZXdCeUlkKHZpZXcudHdlYWtJZCwgdmlldy5pZCkpLFxuICB9O1xufVxuXG5mdW5jdGlvbiBhdHRhY2hPd2xWaWV3KHZpZXc6IE1hbmFnZWRPd2xWaWV3LCBwYXJlbnQ6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFZpZXcgPSBhc1JlY29yZChwYXJlbnQpPy5jb250ZW50VmlldztcbiAgY29uc3Qgd2ViQ29udGVudHNWaWV3ID0gYXNSZWNvcmQodmlldy52aWV3KT8ud2ViQ29udGVudHNWaWV3O1xuICBpZiAodHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LmFkZEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsT2JqZWN0TWV0aG9kKHBhcmVudCwgXCJhZGRCcm93c2VyVmlld1wiLCBbdmlldy52aWV3XSk7XG4gICAgdmlldy5hdHRhY2hNb2RlID0gXCJicm93c2VyVmlld1wiO1xuICB9IGVsc2UgaWYgKFxuICAgIHR5cGVvZiBhc1JlY29yZChjb250ZW50Vmlldyk/LmFkZENoaWxkVmlldyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgd2ViQ29udGVudHNWaWV3XG4gICkge1xuICAgIHRyeSB7XG4gICAgICBhZGRPd2xDaGlsZFZpZXcocGFyZW50LCB2aWV3LnZpZXcpO1xuICAgICAgdmlldy5hdHRhY2hNb2RlID0gXCJjb250ZW50Vmlld1wiO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgY29udGVudFZpZXcgYXR0YWNobWVudCBmYWlsZWQ7IGZhbGxpbmcgYmFjayB0byBCcm93c2VyVmlld1wiLCB7XG4gICAgICAgIHR3ZWFrSWQ6IHZpZXcudHdlYWtJZCxcbiAgICAgICAgdmlld0lkOiB2aWV3LmlkLFxuICAgICAgICBlcnJvcjogU3RyaW5nKGUpLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIGlmICghdmlldy5hdHRhY2hNb2RlKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiT3dsIHZpZXcgYXR0YWNobWVudCBpcyBub3QgYXZhaWxhYmxlIG9uIHRoaXMgQ29kZXggd2luZG93XCIpO1xuICB9XG5cbiAgY29uc3QgZGlzcG9zZSA9ICgpID0+IGRpc3Bvc2VPd2xWaWV3QnlJZCh2aWV3LnR3ZWFrSWQsIHZpZXcuaWQpO1xuICBiaW5kV2luZG93RXZlbnQocGFyZW50LCB2aWV3LCBcImNsb3NlZFwiLCBkaXNwb3NlKTtcbiAgYmluZFdpbmRvd0V2ZW50KHBhcmVudCwgdmlldywgXCJjbG9zZVwiLCBkaXNwb3NlKTtcbn1cblxuZnVuY3Rpb24gYnJpbmdPd2xWaWV3VG9Gcm9udCh2aWV3OiBNYW5hZ2VkT3dsVmlldyk6IHZvaWQge1xuICBpZiAodmlldy5kaXNwb3NlZCkgcmV0dXJuO1xuICBjb25zdCBwYXJlbnQgPSB2aWV3LnBhcmVudFdpbmRvd0lkID09PSBudWxsID8gbnVsbCA6IEJyb3dzZXJXaW5kb3cuZnJvbUlkKHZpZXcucGFyZW50V2luZG93SWQpO1xuICBpZiAoIXBhcmVudCB8fCBpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnQpKSByZXR1cm47XG4gIGNvbnN0IGNvbnRlbnRWaWV3ID0gYXNSZWNvcmQocGFyZW50KT8uY29udGVudFZpZXc7XG4gIGNvbnN0IHdlYkNvbnRlbnRzVmlldyA9IGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldztcbiAgaWYgKHZpZXcuYXR0YWNoTW9kZSA9PT0gXCJjb250ZW50Vmlld1wiICYmIHdlYkNvbnRlbnRzVmlldykge1xuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGFzUmVjb3JkKHBhcmVudCk/LnNldFRvcEJyb3dzZXJWaWV3ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwic2V0VG9wQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChjb250ZW50VmlldywgXCJhZGRDaGlsZFZpZXdcIiwgW3dlYkNvbnRlbnRzVmlld10pO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgY29udGVudFZpZXcgYnJpbmctdG8tZnJvbnQgZmFpbGVkXCIsIHtcbiAgICAgICAgdHdlYWtJZDogdmlldy50d2Vha0lkLFxuICAgICAgICB2aWV3SWQ6IHZpZXcuaWQsXG4gICAgICAgIGVycm9yOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgaWYgKHR5cGVvZiBhc1JlY29yZChwYXJlbnQpPy5zZXRUb3BCcm93c2VyVmlldyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwic2V0VG9wQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE93bFZpZXdCb3VuZHModmlldzogTWFuYWdlZE93bFZpZXcsIGJvdW5kczogRWxlY3Ryb24uUmVjdGFuZ2xlKTogdm9pZCB7XG4gIGFzc2VydEJvdW5kcyhib3VuZHMpO1xuICBjYWxsT2JqZWN0TWV0aG9kKHZpZXcudmlldywgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pO1xuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRCb3VuZHNcIiwgW2JvdW5kc10pO1xufVxuXG5mdW5jdGlvbiBzZXRPd2xWaWV3VmlzaWJsZSh2aWV3OiBNYW5hZ2VkT3dsVmlldywgdmlzaWJsZTogYm9vbGVhbik6IHZvaWQge1xuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHZpZXcudmlldyk/LndlYkNvbnRlbnRzVmlldywgXCJzZXRWaXNpYmxlXCIsIFt2aXNpYmxlXSk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VPd2xWaWV3QnlJZCh0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IG93bFZpZXdzLmdldChvd2xWaWV3S2V5KHR3ZWFrSWQsIGlkKSk7XG4gIGlmICghdmlldykgcmV0dXJuO1xuICBkaXNwb3NlT3dsVmlldyh2aWV3KTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZU93bFZpZXdzRm9yVHdlYWsodHdlYWtJZDogc3RyaW5nKTogdm9pZCB7XG4gIGZvciAoY29uc3QgdmlldyBvZiBbLi4ub3dsVmlld3MudmFsdWVzKCldKSB7XG4gICAgaWYgKHZpZXcudHdlYWtJZCA9PT0gdHdlYWtJZCkgZGlzcG9zZU93bFZpZXcodmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzcG9zZUFsbE93bFZpZXdzKCk6IHZvaWQge1xuICBmb3IgKGNvbnN0IHZpZXcgb2YgWy4uLm93bFZpZXdzLnZhbHVlcygpXSkgZGlzcG9zZU93bFZpZXcodmlldyk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VPd2xWaWV3KHZpZXc6IE1hbmFnZWRPd2xWaWV3KTogdm9pZCB7XG4gIGlmICh2aWV3LmRpc3Bvc2VkKSByZXR1cm47XG4gIHZpZXcuZGlzcG9zZWQgPSB0cnVlO1xuICBvd2xWaWV3cy5kZWxldGUodmlldy5rZXkpO1xuICBmb3IgKGNvbnN0IGRpc3Bvc2Ugb2Ygdmlldy5kaXNwb3NlQmluZGluZ3Muc3BsaWNlKDApKSB7XG4gICAgdHJ5IHtcbiAgICAgIGRpc3Bvc2UoKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgY29uc3QgcGFyZW50ID0gdmlldy5wYXJlbnRXaW5kb3dJZCA9PT0gbnVsbCA/IG51bGwgOiBCcm93c2VyV2luZG93LmZyb21JZCh2aWV3LnBhcmVudFdpbmRvd0lkKTtcbiAgaWYgKHBhcmVudCAmJiAhaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50KSkge1xuICAgIHRyeSB7XG4gICAgICBpZiAodmlldy5hdHRhY2hNb2RlID09PSBcImNvbnRlbnRWaWV3XCIpIHtcbiAgICAgICAgcmVtb3ZlT3dsQ2hpbGRWaWV3KHBhcmVudCwgdmlldy52aWV3KTtcbiAgICAgIH0gZWxzZSBpZiAodmlldy5hdHRhY2hNb2RlID09PSBcImJyb3dzZXJWaWV3XCIpIHtcbiAgICAgICAgY2FsbE9iamVjdE1ldGhvZChwYXJlbnQsIFwicmVtb3ZlQnJvd3NlclZpZXdcIiwgW3ZpZXcudmlld10pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJPd2wgdmlldyBkZXRhY2ggZmFpbGVkIGR1cmluZyBkaXNwb3NlXCIsIHtcbiAgICAgICAgdHdlYWtJZDogdmlldy50d2Vha0lkLFxuICAgICAgICB2aWV3SWQ6IHZpZXcuaWQsXG4gICAgICAgIGVycm9yOiBTdHJpbmcoZSksXG4gICAgICB9KTtcbiAgICB9XG4gIH1cbiAgdHJ5IHtcbiAgICBpZiAoIXZpZXcudmlldy53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICB2aWV3LnZpZXcud2ViQ29udGVudHMuY2xvc2UoeyB3YWl0Rm9yQmVmb3JlVW5sb2FkOiBmYWxzZSB9KTtcbiAgICB9XG4gIH0gY2F0Y2gge31cbn1cblxuZnVuY3Rpb24gb3dsVmlld0Zvcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBNYW5hZ2VkT3dsVmlldyB7XG4gIGNvbnN0IHZpZXcgPSBvd2xWaWV3cy5nZXQob3dsVmlld0tleSh0d2Vha0lkLCBpZCkpO1xuICBpZiAoIXZpZXcgfHwgdmlldy5kaXNwb3NlZCkgdGhyb3cgbmV3IEVycm9yKGBDb2RleCB2aWV3IGlzIG5vdCBsb2FkZWQ6ICR7dHdlYWtJZH06JHtpZH1gKTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmZ1bmN0aW9uIG93bFZpZXdLZXkodHdlYWtJZDogc3RyaW5nLCB2aWV3SWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0d2Vha0lkfToke3ZpZXdJZH1gO1xufVxuXG5mdW5jdGlvbiBhZGRPd2xDaGlsZFZpZXcocGFyZW50OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LCBjaGlsZDogRWxlY3Ryb24uQnJvd3NlclZpZXcpOiB2b2lkIHtcbiAgY29uc3Qgb3duZXJXaW5kb3cgPSBhc1JlY29yZChjaGlsZCk/Lm93bmVyV2luZG93O1xuICBpZiAob3duZXJXaW5kb3cgJiYgb3duZXJXaW5kb3cgIT09IHBhcmVudCkge1xuICAgIGNhbGxPYmplY3RNZXRob2Qob3duZXJXaW5kb3csIFwicmVtb3ZlQnJvd3NlclZpZXdcIiwgW2NoaWxkXSk7XG4gIH1cblxuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKHBhcmVudCk/LmNvbnRlbnRWaWV3LCBcImFkZENoaWxkVmlld1wiLCBbYXNSZWNvcmQoY2hpbGQpPy53ZWJDb250ZW50c1ZpZXddKTtcbiAgdHJ5IHtcbiAgICAoY2hpbGQgYXMgdW5rbm93biBhcyB7IG93bmVyV2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB9KS5vd25lcldpbmRvdyA9IHBhcmVudDtcbiAgfSBjYXRjaCB7fVxuICBjYWxsT2JqZWN0TWV0aG9kKGFzUmVjb3JkKGNoaWxkLndlYkNvbnRlbnRzKSwgXCJfc2V0T3duZXJXaW5kb3dcIiwgW3BhcmVudF0pO1xuXG4gIGNvbnN0IGJyb3dzZXJWaWV3cyA9IGFzUmVjb3JkKHBhcmVudCk/Ll9icm93c2VyVmlld3M7XG4gIGlmIChBcnJheS5pc0FycmF5KGJyb3dzZXJWaWV3cykgJiYgIWJyb3dzZXJWaWV3cy5pbmNsdWRlcyhjaGlsZCkpIHtcbiAgICBicm93c2VyVmlld3MucHVzaChjaGlsZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlT3dsQ2hpbGRWaWV3KHBhcmVudDogRWxlY3Ryb24uQnJvd3NlcldpbmRvdywgY2hpbGQ6IEVsZWN0cm9uLkJyb3dzZXJWaWV3KTogdm9pZCB7XG4gIGNhbGxPYmplY3RNZXRob2QoYXNSZWNvcmQocGFyZW50KT8uY29udGVudFZpZXcsIFwicmVtb3ZlQ2hpbGRWaWV3XCIsIFthc1JlY29yZChjaGlsZCk/LndlYkNvbnRlbnRzVmlld10pO1xuICB0cnkge1xuICAgIChjaGlsZCBhcyB1bmtub3duIGFzIHsgb3duZXJXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIH0pLm93bmVyV2luZG93ID0gbnVsbDtcbiAgfSBjYXRjaCB7fVxuXG4gIGNvbnN0IGJyb3dzZXJWaWV3cyA9IGFzUmVjb3JkKHBhcmVudCk/Ll9icm93c2VyVmlld3M7XG4gIGlmIChBcnJheS5pc0FycmF5KGJyb3dzZXJWaWV3cykpIHtcbiAgICBjb25zdCBpbmRleCA9IGJyb3dzZXJWaWV3cy5pbmRleE9mKGNoaWxkKTtcbiAgICBpZiAoaW5kZXggPj0gMCkgYnJvd3NlclZpZXdzLnNwbGljZShpbmRleCwgMSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ29kZXhCcm93c2VyVmlldyhvcHRzOiBDb2RleENyZWF0ZVZpZXdPcHRpb25zKTogUHJvbWlzZTx1bmtub3duPiB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBjb25zdCB3aW5kb3dNYW5hZ2VyID0gc2VydmljZXM/LndpbmRvd01hbmFnZXI7XG4gIGlmICghc2VydmljZXMgfHwgIXdpbmRvd01hbmFnZXI/LnJlZ2lzdGVyV2luZG93KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJDb2RleCBlbWJlZGRlZCB2aWV3IHNlcnZpY2VzIGFyZSBub3QgYXZhaWxhYmxlLiBSZWluc3RhbGwgQ29kZXgrKyAxLjAuMCBvciBsYXRlci5cIixcbiAgICApO1xuICB9XG5cbiAgY29uc3Qgcm91dGUgPSBub3JtYWxpemVDb2RleFJvdXRlKG9wdHMucm91dGUpO1xuICBjb25zdCBob3N0SWQgPSBvcHRzLmhvc3RJZCB8fCBcImxvY2FsXCI7XG4gIGNvbnN0IGFwcGVhcmFuY2UgPSBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIjtcbiAgY29uc3QgdmlldyA9IG5ldyBCcm93c2VyVmlldyh7XG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIHByZWxvYWQ6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8ucHJlbG9hZFBhdGgsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSxcbiAgICAgIHNwZWxsY2hlY2s6IGZhbHNlLFxuICAgICAgZGV2VG9vbHM6IHdpbmRvd01hbmFnZXIub3B0aW9ucz8uYWxsb3dEZXZ0b29scyxcbiAgICB9LFxuICB9KTtcbiAgY29uc3Qgd2luZG93TGlrZSA9IG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3KTtcbiAgd2luZG93TWFuYWdlci5yZWdpc3RlcldpbmRvdyh3aW5kb3dMaWtlLCBob3N0SWQsIGZhbHNlLCBhcHBlYXJhbmNlKTtcbiAgc2VydmljZXMuZ2V0Q29udGV4dD8uKGhvc3RJZCk/LnJlZ2lzdGVyV2luZG93Py4od2luZG93TGlrZSk7XG4gIGF3YWl0IHZpZXcud2ViQ29udGVudHMubG9hZFVSTChjb2RleEFwcFVybChyb3V0ZSwgaG9zdElkKSk7XG4gIHJldHVybiB2aWV3O1xufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVDb2RleFdpbmRvdyhvcHRzOiBDb2RleENyZWF0ZVdpbmRvd09wdGlvbnMpOiBQcm9taXNlPENvZGV4V2luZG93UmVmPiB7XG4gIGNvbnN0IHNlcnZpY2VzID0gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpO1xuICBpZiAoIXNlcnZpY2VzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgXCJDb2RleCB3aW5kb3cgc2VydmljZXMgYXJlIG5vdCBhdmFpbGFibGUuIFJlaW5zdGFsbCBDb2RleCsrIDEuMC4wIG9yIGxhdGVyLlwiLFxuICAgICk7XG4gIH1cblxuICBjb25zdCByb3V0ZSA9IG5vcm1hbGl6ZUNvZGV4Um91dGUob3B0cy5yb3V0ZSk7XG4gIGNvbnN0IGhvc3RJZCA9IG9wdHMuaG9zdElkIHx8IFwibG9jYWxcIjtcbiAgY29uc3QgcGFyZW50ID0gdHlwZW9mIG9wdHMucGFyZW50V2luZG93SWQgPT09IFwibnVtYmVyXCJcbiAgICA/IEJyb3dzZXJXaW5kb3cuZnJvbUlkKG9wdHMucGFyZW50V2luZG93SWQpXG4gICAgOiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgY29uc3QgY3JlYXRlV2luZG93ID0gc2VydmljZXMud2luZG93TWFuYWdlcj8uY3JlYXRlV2luZG93O1xuXG4gIGxldCB3aW46IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkO1xuICBpZiAodHlwZW9mIGNyZWF0ZVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgY3JlYXRlV2luZG93LmNhbGwoc2VydmljZXMud2luZG93TWFuYWdlciwge1xuICAgICAgaW5pdGlhbFJvdXRlOiByb3V0ZSxcbiAgICAgIGhvc3RJZCxcbiAgICAgIHNob3c6IG9wdHMuc2hvdyAhPT0gZmFsc2UsXG4gICAgICBhcHBlYXJhbmNlOiBvcHRzLmFwcGVhcmFuY2UgfHwgXCJzZWNvbmRhcnlcIixcbiAgICAgIHBhcmVudCxcbiAgICB9KTtcbiAgfSBlbHNlIGlmIChob3N0SWQgPT09IFwibG9jYWxcIiAmJiB0eXBlb2Ygc2VydmljZXMuY3JlYXRlRnJlc2hXaW5kb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbiA9IGF3YWl0IHNlcnZpY2VzLmNyZWF0ZUZyZXNoV2luZG93KHJvdXRlKTtcbiAgfSBlbHNlIGlmIChob3N0SWQgPT09IFwibG9jYWxcIiAmJiB0eXBlb2Ygc2VydmljZXMuY3JlYXRlRnJlc2hMb2NhbFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luID0gYXdhaXQgc2VydmljZXMuY3JlYXRlRnJlc2hMb2NhbFdpbmRvdyhyb3V0ZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNlcnZpY2VzLmVuc3VyZUhvc3RXaW5kb3cgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbiA9IGF3YWl0IHNlcnZpY2VzLmVuc3VyZUhvc3RXaW5kb3coaG9zdElkKTtcbiAgfVxuXG4gIGlmICghd2luIHx8IHdpbi5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggZGlkIG5vdCByZXR1cm4gYSB3aW5kb3cgZm9yIHRoZSByZXF1ZXN0ZWQgcm91dGVcIik7XG4gIH1cblxuICBpZiAob3B0cy5ib3VuZHMpIHtcbiAgICB3aW4uc2V0Qm91bmRzKG9wdHMuYm91bmRzKTtcbiAgfVxuICBpZiAocGFyZW50ICYmICFwYXJlbnQuaXNEZXN0cm95ZWQoKSkge1xuICAgIHRyeSB7XG4gICAgICB3aW4uc2V0UGFyZW50V2luZG93KHBhcmVudCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIGlmIChvcHRzLnNob3cgIT09IGZhbHNlKSB7XG4gICAgd2luLnNob3coKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgd2luZG93SWQ6IHdpbi5pZCxcbiAgICB3ZWJDb250ZW50c0lkOiB3aW4ud2ViQ29udGVudHMuaWQsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VDb2RleEFwaSh0d2VhazogRGlzY292ZXJlZFR3ZWFrKSB7XG4gIGNvbnN0IGN0eCA9ICgpOiBOYXRpdmVUd2Vha0NvbnRleHQgPT4gKHsgaWQ6IHR3ZWFrLm1hbmlmZXN0LmlkLCBkaXI6IHR3ZWFrLmRpciB9KTtcbiAgcmV0dXJuIHtcbiAgICBydW50aW1lOiB7XG4gICAgICBnZXRJbmZvOiBhc3luYyAoKSA9PiBjdXJyZW50UnVudGltZUluZm8oKSxcbiAgICAgIGdldENhcGFiaWxpdGllczogYXN5bmMgKCkgPT4gY3VycmVudFJ1bnRpbWVDYXBhYmlsaXRpZXMoKSxcbiAgICB9LFxuICAgIHdpbmRvd3M6IHtcbiAgICAgIGNyZWF0ZTogY3JlYXRlQ29kZXhXaW5kb3csXG4gICAgICBnZXRQcmltYXJ5OiBhc3luYyAoKSA9PiBnZXRQcmltYXJ5Q29kZXhXaW5kb3dSZWYoKSxcbiAgICAgIGZvY3VzOiBhc3luYyAod2luZG93SWQ6IG51bWJlcikgPT4gZm9jdXNDb2RleFdpbmRvdyh3aW5kb3dJZCksXG4gICAgICBzaG93OiBhc3luYyAod2luZG93SWQ6IG51bWJlcikgPT4gc2hvd0NvZGV4V2luZG93KHdpbmRvd0lkKSxcbiAgICB9LFxuICAgIHZpZXdzOiB7XG4gICAgICBjcmVhdGU6IGFzeW5jIChvcHRpb25zOiBDb2RleFZpZXdDcmVhdGVPcHRpb25zKSA9PiB7XG4gICAgICAgIGFzc2VydFR3ZWFrVmlld1Blcm1pc3Npb24odHdlYWspO1xuICAgICAgICByZXR1cm4gY3JlYXRlT3dsVmlldyhjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgY2RwOiB7XG4gICAgICBnZXRTdGF0dXM6IGFzeW5jICgpID0+IGdldENkcFN0YXR1cygpLFxuICAgICAgbGlzdFRhcmdldHM6IGFzeW5jICgpID0+IGxpc3RDZHBUYXJnZXRzKCksXG4gICAgfSxcbiAgICBuYXRpdmU6IHtcbiAgICAgIGxvYWRNb2R1bGU6IGFzeW5jIChvcHRpb25zOiBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLW1vZHVsZVwiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5sb2FkTW9kdWxlKGN0eCgpLCBvcHRpb25zKTtcbiAgICAgIH0sXG4gICAgICBjcmVhdGVQYW5lbDogYXN5bmMgKG9wdGlvbnM6IE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLXZpZXdcIik7XG4gICAgICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuY3JlYXRlUGFuZWwoY3R4KCksIG9wdGlvbnMpO1xuICAgICAgfSxcbiAgICAgIGF0dGFjaFZpZXc6IGFzeW5jIChvcHRpb25zOiBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLXZpZXdcIik7XG4gICAgICAgIHJldHVybiBuYXRpdmVCcmlkZ2UuYXR0YWNoVmlldyhjdHgoKSwgb3B0aW9ucyk7XG4gICAgICB9LFxuICAgICAgbGF1bmNoSGVscGVyOiBhc3luYyAob3B0aW9uczogTmF0aXZlSGVscGVyTGF1bmNoT3B0aW9ucykgPT4ge1xuICAgICAgICBhc3NlcnRUd2Vha1Blcm1pc3Npb24odHdlYWssIFwibmF0aXZlLWhlbHBlclwiKTtcbiAgICAgICAgcmV0dXJuIG5hdGl2ZUJyaWRnZS5sYXVuY2hIZWxwZXIoY3R4KCksIG9wdGlvbnMpO1xuICAgICAgfSxcbiAgICB9LFxuICAgIGNyZWF0ZUJyb3dzZXJWaWV3OiBjcmVhdGVDb2RleEJyb3dzZXJWaWV3LFxuICAgIGNyZWF0ZVdpbmRvdzogY3JlYXRlQ29kZXhXaW5kb3csXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldyk6IENvZGV4V2luZG93TGlrZSB7XG4gIGNvbnN0IHZpZXdCb3VuZHMgPSAoKSA9PiB2aWV3LmdldEJvdW5kcygpO1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3LndlYkNvbnRlbnRzLmlkLFxuICAgIHdlYkNvbnRlbnRzOiB2aWV3LndlYkNvbnRlbnRzLFxuICAgIG9uOiAoZXZlbnQ6IFwiY2xvc2VkXCIsIGxpc3RlbmVyOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICBpZiAoZXZlbnQgPT09IFwiY2xvc2VkXCIpIHtcbiAgICAgICAgdmlldy53ZWJDb250ZW50cy5vbmNlKFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXcud2ViQ29udGVudHMub24oZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgb25jZTogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLm9uY2UoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBvZmY6IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgdmlldy53ZWJDb250ZW50cy5vZmYoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcjogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50IGFzIFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgaXNEZXN0cm95ZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSxcbiAgICBpc0ZvY3VzZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNGb2N1c2VkKCksXG4gICAgZm9jdXM6ICgpID0+IHZpZXcud2ViQ29udGVudHMuZm9jdXMoKSxcbiAgICBzaG93OiAoKSA9PiB7fSxcbiAgICBoaWRlOiAoKSA9PiB7fSxcbiAgICBnZXRCb3VuZHM6IHZpZXdCb3VuZHMsXG4gICAgZ2V0Q29udGVudEJvdW5kczogdmlld0JvdW5kcyxcbiAgICBnZXRTaXplOiAoKSA9PiB7XG4gICAgICBjb25zdCBiID0gdmlld0JvdW5kcygpO1xuICAgICAgcmV0dXJuIFtiLndpZHRoLCBiLmhlaWdodF07XG4gICAgfSxcbiAgICBnZXRDb250ZW50U2l6ZTogKCkgPT4ge1xuICAgICAgY29uc3QgYiA9IHZpZXdCb3VuZHMoKTtcbiAgICAgIHJldHVybiBbYi53aWR0aCwgYi5oZWlnaHRdO1xuICAgIH0sXG4gICAgc2V0VGl0bGU6ICgpID0+IHt9LFxuICAgIGdldFRpdGxlOiAoKSA9PiBcIlwiLFxuICAgIHNldFJlcHJlc2VudGVkRmlsZW5hbWU6ICgpID0+IHt9LFxuICAgIHNldERvY3VtZW50RWRpdGVkOiAoKSA9PiB7fSxcbiAgICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5OiAoKSA9PiB7fSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29kZXhBcHBVcmwocm91dGU6IHN0cmluZywgaG9zdElkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKFwiYXBwOi8vLS9pbmRleC5odG1sXCIpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldChcImhvc3RJZFwiLCBob3N0SWQpO1xuICBpZiAocm91dGUgIT09IFwiL1wiKSB1cmwuc2VhcmNoUGFyYW1zLnNldChcImluaXRpYWxSb3V0ZVwiLCByb3V0ZSk7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplT3dsVmlld1VybCh1cmw6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgdXJsICE9PSBcInN0cmluZ1wiIHx8IHVybC5pbmNsdWRlcyhcIlxcblwiKSB8fCB1cmwuaW5jbHVkZXMoXCJcXHJcIikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJPd2wgdmlldyBVUkwgbXVzdCBiZSBhIHN0cmluZyB3aXRob3V0IGNvbnRyb2wgY2hhcmFjdGVyc1wiKTtcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBuZXcgVVJMKHVybCk7XG4gIGlmICghW1wiaHR0cDpcIiwgXCJodHRwczpcIiwgXCJhcHA6XCIsIFwiZmlsZTpcIiwgXCJkYXRhOlwiLCBcImFib3V0OlwiXS5pbmNsdWRlcyhwYXJzZWQucHJvdG9jb2wpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bnN1cHBvcnRlZCBPd2wgdmlldyBVUkwgcHJvdG9jb2w6ICR7cGFyc2VkLnByb3RvY29sfWApO1xuICB9XG4gIHJldHVybiBwYXJzZWQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q29kZXhXaW5kb3dTZXJ2aWNlcygpOiBDb2RleFdpbmRvd1NlcnZpY2VzIHwgbnVsbCB7XG4gIGNvbnN0IHNlcnZpY2VzID0gKGdsb2JhbFRoaXMgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPilbQ09ERVhfV0lORE9XX1NFUlZJQ0VTX0tFWV07XG4gIHJldHVybiBzZXJ2aWNlcyAmJiB0eXBlb2Ygc2VydmljZXMgPT09IFwib2JqZWN0XCIgPyAoc2VydmljZXMgYXMgQ29kZXhXaW5kb3dTZXJ2aWNlcykgOiBudWxsO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVDb2RleFJvdXRlKHJvdXRlOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHJvdXRlICE9PSBcInN0cmluZ1wiIHx8ICFyb3V0ZS5zdGFydHNXaXRoKFwiL1wiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJvdXRlIG11c3QgYmUgYW4gYWJzb2x1dGUgYXBwIHJvdXRlXCIpO1xuICB9XG4gIGlmIChyb3V0ZS5pbmNsdWRlcyhcIjovL1wiKSB8fCByb3V0ZS5pbmNsdWRlcyhcIlxcblwiKSB8fCByb3V0ZS5pbmNsdWRlcyhcIlxcclwiKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNvZGV4IHJvdXRlIG11c3Qgbm90IGluY2x1ZGUgYSBwcm90b2NvbCBvciBjb250cm9sIGNoYXJhY3RlcnNcIik7XG4gIH1cbiAgcmV0dXJuIHJvdXRlO1xufVxuXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGNhbGxPYmplY3RNZXRob2QodGFyZ2V0OiB1bmtub3duLCBtZXRob2Q6IHN0cmluZywgYXJnczogdW5rbm93bltdKTogdW5rbm93biB7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQodGFyZ2V0KT8uW21ldGhvZF07XG4gIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgcmV0dXJuIGZuLmFwcGx5KHRhcmdldCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGlzV2luZG93RGVzdHJveWVkKHdpbjogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBib29sZWFuIHtcbiAgaWYgKCF3aW4pIHJldHVybiB0cnVlO1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHdpbik/LmlzRGVzdHJveWVkO1xuICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gQm9vbGVhbihmbi5jYWxsKHdpbikpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3aW5kb3dJZEZvcih3aW46IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gYXNSZWNvcmQod2luKT8uaWQ7XG4gIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGJpbmRXaW5kb3dFdmVudChcbiAgd2luOiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LFxuICB2aWV3OiBNYW5hZ2VkT3dsVmlldyxcbiAgZXZlbnQ6IHN0cmluZyxcbiAgbGlzdGVuZXI6ICguLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQsXG4pOiB2b2lkIHtcbiAgY29uc3Qgb24gPSBhc1JlY29yZCh3aW4pPy5vbjtcbiAgY29uc3Qgb2ZmID0gYXNSZWNvcmQod2luKT8ub2ZmO1xuICBpZiAodHlwZW9mIG9uICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybjtcbiAgb24uY2FsbCh3aW4sIGV2ZW50LCBsaXN0ZW5lcik7XG4gIHZpZXcuZGlzcG9zZUJpbmRpbmdzLnB1c2goKCkgPT4ge1xuICAgIGlmICh0eXBlb2Ygb2ZmID09PSBcImZ1bmN0aW9uXCIpIG9mZi5jYWxsKHdpbiwgZXZlbnQsIGxpc3RlbmVyKTtcbiAgICBlbHNlIGNhbGxPYmplY3RNZXRob2Qod2luLCBcInJlbW92ZUxpc3RlbmVyXCIsIFtldmVudCwgbGlzdGVuZXJdKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEJyaWRnZUlkKHZhbHVlOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2xhYmVsfSBtYXkgb25seSBjb250YWluIGxldHRlcnMsIG51bWJlcnMsIGRvdHMsIHVuZGVyc2NvcmVzLCBhbmQgZGFzaGVzYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRCb3VuZHMoYm91bmRzOiBFbGVjdHJvbi5SZWN0YW5nbGUpOiB2b2lkIHtcbiAgY29uc3QgdmFsdWVzID0gW2JvdW5kcz8ueCwgYm91bmRzPy55LCBib3VuZHM/LndpZHRoLCBib3VuZHM/LmhlaWdodF07XG4gIGlmICghdmFsdWVzLmV2ZXJ5KCh2YWx1ZSkgPT4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmRzIG11c3QgY29udGFpbiBmaW5pdGUgeCwgeSwgd2lkdGgsIGFuZCBoZWlnaHQgbnVtYmVyc1wiKTtcbiAgfVxuICBpZiAoYm91bmRzLndpZHRoIDwgMCB8fCBib3VuZHMuaGVpZ2h0IDwgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kcyB3aWR0aCBhbmQgaGVpZ2h0IG11c3QgYmUgbm9uLW5lZ2F0aXZlXCIpO1xuICB9XG59XG5cbi8vIFRvdWNoIEJyb3dzZXJXaW5kb3cgdG8ga2VlcCBpdHMgaW1wb3J0IFx1MjAxNCBvbGRlciBFbGVjdHJvbiBsaW50IHJ1bGVzLlxudm9pZCBCcm93c2VyV2luZG93O1xuIiwgIi8qISBjaG9raWRhciAtIE1JVCBMaWNlbnNlIChjKSAyMDEyIFBhdWwgTWlsbGVyIChwYXVsbWlsbHIuY29tKSAqL1xuaW1wb3J0IHsgc3RhdCBhcyBzdGF0Y2IgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBzdGF0LCByZWFkZGlyIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCAqIGFzIHN5c1BhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyByZWFkZGlycCB9IGZyb20gJ3JlYWRkaXJwJztcbmltcG9ydCB7IE5vZGVGc0hhbmRsZXIsIEVWRU5UUyBhcyBFViwgaXNXaW5kb3dzLCBpc0lCTWksIEVNUFRZX0ZOLCBTVFJfQ0xPU0UsIFNUUl9FTkQsIH0gZnJvbSAnLi9oYW5kbGVyLmpzJztcbmNvbnN0IFNMQVNIID0gJy8nO1xuY29uc3QgU0xBU0hfU0xBU0ggPSAnLy8nO1xuY29uc3QgT05FX0RPVCA9ICcuJztcbmNvbnN0IFRXT19ET1RTID0gJy4uJztcbmNvbnN0IFNUUklOR19UWVBFID0gJ3N0cmluZyc7XG5jb25zdCBCQUNLX1NMQVNIX1JFID0gL1xcXFwvZztcbmNvbnN0IERPVUJMRV9TTEFTSF9SRSA9IC9cXC9cXC8vO1xuY29uc3QgRE9UX1JFID0gL1xcLi4qXFwuKHN3W3B4XSkkfH4kfFxcLnN1YmwuKlxcLnRtcC87XG5jb25zdCBSRVBMQUNFUl9SRSA9IC9eXFwuWy9cXFxcXS87XG5mdW5jdGlvbiBhcnJpZnkoaXRlbSkge1xuICAgIHJldHVybiBBcnJheS5pc0FycmF5KGl0ZW0pID8gaXRlbSA6IFtpdGVtXTtcbn1cbmNvbnN0IGlzTWF0Y2hlck9iamVjdCA9IChtYXRjaGVyKSA9PiB0eXBlb2YgbWF0Y2hlciA9PT0gJ29iamVjdCcgJiYgbWF0Y2hlciAhPT0gbnVsbCAmJiAhKG1hdGNoZXIgaW5zdGFuY2VvZiBSZWdFeHApO1xuZnVuY3Rpb24gY3JlYXRlUGF0dGVybihtYXRjaGVyKSB7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gbWF0Y2hlcjtcbiAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdzdHJpbmcnKVxuICAgICAgICByZXR1cm4gKHN0cmluZykgPT4gbWF0Y2hlciA9PT0gc3RyaW5nO1xuICAgIGlmIChtYXRjaGVyIGluc3RhbmNlb2YgUmVnRXhwKVxuICAgICAgICByZXR1cm4gKHN0cmluZykgPT4gbWF0Y2hlci50ZXN0KHN0cmluZyk7XG4gICAgaWYgKHR5cGVvZiBtYXRjaGVyID09PSAnb2JqZWN0JyAmJiBtYXRjaGVyICE9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiAoc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBpZiAobWF0Y2hlci5wYXRoID09PSBzdHJpbmcpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICBpZiAobWF0Y2hlci5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByZWxhdGl2ZSA9IHN5c1BhdGgucmVsYXRpdmUobWF0Y2hlci5wYXRoLCBzdHJpbmcpO1xuICAgICAgICAgICAgICAgIGlmICghcmVsYXRpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gIXJlbGF0aXZlLnN0YXJ0c1dpdGgoJy4uJykgJiYgIXN5c1BhdGguaXNBYnNvbHV0ZShyZWxhdGl2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiAoKSA9PiBmYWxzZTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhdGgocGF0aCkge1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignc3RyaW5nIGV4cGVjdGVkJyk7XG4gICAgcGF0aCA9IHN5c1BhdGgubm9ybWFsaXplKHBhdGgpO1xuICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICBsZXQgcHJlcGVuZCA9IGZhbHNlO1xuICAgIGlmIChwYXRoLnN0YXJ0c1dpdGgoJy8vJykpXG4gICAgICAgIHByZXBlbmQgPSB0cnVlO1xuICAgIGNvbnN0IERPVUJMRV9TTEFTSF9SRSA9IC9cXC9cXC8vO1xuICAgIHdoaWxlIChwYXRoLm1hdGNoKERPVUJMRV9TTEFTSF9SRSkpXG4gICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoRE9VQkxFX1NMQVNIX1JFLCAnLycpO1xuICAgIGlmIChwcmVwZW5kKVxuICAgICAgICBwYXRoID0gJy8nICsgcGF0aDtcbiAgICByZXR1cm4gcGF0aDtcbn1cbmZ1bmN0aW9uIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcsIHN0YXRzKSB7XG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgodGVzdFN0cmluZyk7XG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHBhdHRlcm5zLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBwYXR0ZXJuID0gcGF0dGVybnNbaW5kZXhdO1xuICAgICAgICBpZiAocGF0dGVybihwYXRoLCBzdGF0cykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGFueW1hdGNoKG1hdGNoZXJzLCB0ZXN0U3RyaW5nKSB7XG4gICAgaWYgKG1hdGNoZXJzID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignYW55bWF0Y2g6IHNwZWNpZnkgZmlyc3QgYXJndW1lbnQnKTtcbiAgICB9XG4gICAgLy8gRWFybHkgY2FjaGUgZm9yIG1hdGNoZXJzLlxuICAgIGNvbnN0IG1hdGNoZXJzQXJyYXkgPSBhcnJpZnkobWF0Y2hlcnMpO1xuICAgIGNvbnN0IHBhdHRlcm5zID0gbWF0Y2hlcnNBcnJheS5tYXAoKG1hdGNoZXIpID0+IGNyZWF0ZVBhdHRlcm4obWF0Y2hlcikpO1xuICAgIGlmICh0ZXN0U3RyaW5nID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuICh0ZXN0U3RyaW5nLCBzdGF0cykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcsIHN0YXRzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoUGF0dGVybnMocGF0dGVybnMsIHRlc3RTdHJpbmcpO1xufVxuY29uc3QgdW5pZnlQYXRocyA9IChwYXRoc18pID0+IHtcbiAgICBjb25zdCBwYXRocyA9IGFycmlmeShwYXRoc18pLmZsYXQoKTtcbiAgICBpZiAoIXBhdGhzLmV2ZXJ5KChwKSA9PiB0eXBlb2YgcCA9PT0gU1RSSU5HX1RZUEUpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYE5vbi1zdHJpbmcgcHJvdmlkZWQgYXMgd2F0Y2ggcGF0aDogJHtwYXRoc31gKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGhzLm1hcChub3JtYWxpemVQYXRoVG9Vbml4KTtcbn07XG4vLyBJZiBTTEFTSF9TTEFTSCBvY2N1cnMgYXQgdGhlIGJlZ2lubmluZyBvZiBwYXRoLCBpdCBpcyBub3QgcmVwbGFjZWRcbi8vICAgICBiZWNhdXNlIFwiLy9TdG9yYWdlUEMvRHJpdmVQb29sL01vdmllc1wiIGlzIGEgdmFsaWQgbmV0d29yayBwYXRoXG5jb25zdCB0b1VuaXggPSAoc3RyaW5nKSA9PiB7XG4gICAgbGV0IHN0ciA9IHN0cmluZy5yZXBsYWNlKEJBQ0tfU0xBU0hfUkUsIFNMQVNIKTtcbiAgICBsZXQgcHJlcGVuZCA9IGZhbHNlO1xuICAgIGlmIChzdHIuc3RhcnRzV2l0aChTTEFTSF9TTEFTSCkpIHtcbiAgICAgICAgcHJlcGVuZCA9IHRydWU7XG4gICAgfVxuICAgIHdoaWxlIChzdHIubWF0Y2goRE9VQkxFX1NMQVNIX1JFKSkge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZShET1VCTEVfU0xBU0hfUkUsIFNMQVNIKTtcbiAgICB9XG4gICAgaWYgKHByZXBlbmQpIHtcbiAgICAgICAgc3RyID0gU0xBU0ggKyBzdHI7XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuLy8gT3VyIHZlcnNpb24gb2YgdXBhdGgubm9ybWFsaXplXG4vLyBUT0RPOiB0aGlzIGlzIG5vdCBlcXVhbCB0byBwYXRoLW5vcm1hbGl6ZSBtb2R1bGUgLSBpbnZlc3RpZ2F0ZSB3aHlcbmNvbnN0IG5vcm1hbGl6ZVBhdGhUb1VuaXggPSAocGF0aCkgPT4gdG9Vbml4KHN5c1BhdGgubm9ybWFsaXplKHRvVW5peChwYXRoKSkpO1xuLy8gVE9ETzogcmVmYWN0b3JcbmNvbnN0IG5vcm1hbGl6ZUlnbm9yZWQgPSAoY3dkID0gJycpID0+IChwYXRoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbm9ybWFsaXplUGF0aFRvVW5peChzeXNQYXRoLmlzQWJzb2x1dGUocGF0aCkgPyBwYXRoIDogc3lzUGF0aC5qb2luKGN3ZCwgcGF0aCkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxufTtcbmNvbnN0IGdldEFic29sdXRlUGF0aCA9IChwYXRoLCBjd2QpID0+IHtcbiAgICBpZiAoc3lzUGF0aC5pc0Fic29sdXRlKHBhdGgpKSB7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cbiAgICByZXR1cm4gc3lzUGF0aC5qb2luKGN3ZCwgcGF0aCk7XG59O1xuY29uc3QgRU1QVFlfU0VUID0gT2JqZWN0LmZyZWV6ZShuZXcgU2V0KCkpO1xuLyoqXG4gKiBEaXJlY3RvcnkgZW50cnkuXG4gKi9cbmNsYXNzIERpckVudHJ5IHtcbiAgICBjb25zdHJ1Y3RvcihkaXIsIHJlbW92ZVdhdGNoZXIpIHtcbiAgICAgICAgdGhpcy5wYXRoID0gZGlyO1xuICAgICAgICB0aGlzLl9yZW1vdmVXYXRjaGVyID0gcmVtb3ZlV2F0Y2hlcjtcbiAgICAgICAgdGhpcy5pdGVtcyA9IG5ldyBTZXQoKTtcbiAgICB9XG4gICAgYWRkKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcztcbiAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKGl0ZW0gIT09IE9ORV9ET1QgJiYgaXRlbSAhPT0gVFdPX0RPVFMpXG4gICAgICAgICAgICBpdGVtcy5hZGQoaXRlbSk7XG4gICAgfVxuICAgIGFzeW5jIHJlbW92ZShpdGVtKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGl0ZW1zLmRlbGV0ZShpdGVtKTtcbiAgICAgICAgaWYgKGl0ZW1zLnNpemUgPiAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBkaXIgPSB0aGlzLnBhdGg7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkZGlyKGRpcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3JlbW92ZVdhdGNoZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVXYXRjaGVyKHN5c1BhdGguZGlybmFtZShkaXIpLCBzeXNQYXRoLmJhc2VuYW1lKGRpcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGhhcyhpdGVtKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXM7XG4gICAgICAgIGlmICghaXRlbXMpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHJldHVybiBpdGVtcy5oYXMoaXRlbSk7XG4gICAgfVxuICAgIGdldENoaWxkcmVuKCkge1xuICAgICAgICBjb25zdCB7IGl0ZW1zIH0gPSB0aGlzO1xuICAgICAgICBpZiAoIWl0ZW1zKVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICByZXR1cm4gWy4uLml0ZW1zLnZhbHVlcygpXTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5pdGVtcy5jbGVhcigpO1xuICAgICAgICB0aGlzLnBhdGggPSAnJztcbiAgICAgICAgdGhpcy5fcmVtb3ZlV2F0Y2hlciA9IEVNUFRZX0ZOO1xuICAgICAgICB0aGlzLml0ZW1zID0gRU1QVFlfU0VUO1xuICAgICAgICBPYmplY3QuZnJlZXplKHRoaXMpO1xuICAgIH1cbn1cbmNvbnN0IFNUQVRfTUVUSE9EX0YgPSAnc3RhdCc7XG5jb25zdCBTVEFUX01FVEhPRF9MID0gJ2xzdGF0JztcbmV4cG9ydCBjbGFzcyBXYXRjaEhlbHBlciB7XG4gICAgY29uc3RydWN0b3IocGF0aCwgZm9sbG93LCBmc3cpIHtcbiAgICAgICAgdGhpcy5mc3cgPSBmc3c7XG4gICAgICAgIGNvbnN0IHdhdGNoUGF0aCA9IHBhdGg7XG4gICAgICAgIHRoaXMucGF0aCA9IHBhdGggPSBwYXRoLnJlcGxhY2UoUkVQTEFDRVJfUkUsICcnKTtcbiAgICAgICAgdGhpcy53YXRjaFBhdGggPSB3YXRjaFBhdGg7XG4gICAgICAgIHRoaXMuZnVsbFdhdGNoUGF0aCA9IHN5c1BhdGgucmVzb2x2ZSh3YXRjaFBhdGgpO1xuICAgICAgICB0aGlzLmRpclBhcnRzID0gW107XG4gICAgICAgIHRoaXMuZGlyUGFydHMuZm9yRWFjaCgocGFydHMpID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgICAgIHBhcnRzLnBvcCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5mb2xsb3dTeW1saW5rcyA9IGZvbGxvdztcbiAgICAgICAgdGhpcy5zdGF0TWV0aG9kID0gZm9sbG93ID8gU1RBVF9NRVRIT0RfRiA6IFNUQVRfTUVUSE9EX0w7XG4gICAgfVxuICAgIGVudHJ5UGF0aChlbnRyeSkge1xuICAgICAgICByZXR1cm4gc3lzUGF0aC5qb2luKHRoaXMud2F0Y2hQYXRoLCBzeXNQYXRoLnJlbGF0aXZlKHRoaXMud2F0Y2hQYXRoLCBlbnRyeS5mdWxsUGF0aCkpO1xuICAgIH1cbiAgICBmaWx0ZXJQYXRoKGVudHJ5KSB7XG4gICAgICAgIGNvbnN0IHsgc3RhdHMgfSA9IGVudHJ5O1xuICAgICAgICBpZiAoc3RhdHMgJiYgc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlckRpcihlbnRyeSk7XG4gICAgICAgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHRoaXMuZW50cnlQYXRoKGVudHJ5KTtcbiAgICAgICAgLy8gVE9ETzogd2hhdCBpZiBzdGF0cyBpcyB1bmRlZmluZWQ/IHJlbW92ZSAhXG4gICAgICAgIHJldHVybiB0aGlzLmZzdy5faXNudElnbm9yZWQocmVzb2x2ZWRQYXRoLCBzdGF0cykgJiYgdGhpcy5mc3cuX2hhc1JlYWRQZXJtaXNzaW9ucyhzdGF0cyk7XG4gICAgfVxuICAgIGZpbHRlckRpcihlbnRyeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5mc3cuX2lzbnRJZ25vcmVkKHRoaXMuZW50cnlQYXRoKGVudHJ5KSwgZW50cnkuc3RhdHMpO1xuICAgIH1cbn1cbi8qKlxuICogV2F0Y2hlcyBmaWxlcyAmIGRpcmVjdG9yaWVzIGZvciBjaGFuZ2VzLiBFbWl0dGVkIGV2ZW50czpcbiAqIGBhZGRgLCBgYWRkRGlyYCwgYGNoYW5nZWAsIGB1bmxpbmtgLCBgdW5saW5rRGlyYCwgYGFsbGAsIGBlcnJvcmBcbiAqXG4gKiAgICAgbmV3IEZTV2F0Y2hlcigpXG4gKiAgICAgICAuYWRkKGRpcmVjdG9yaWVzKVxuICogICAgICAgLm9uKCdhZGQnLCBwYXRoID0+IGxvZygnRmlsZScsIHBhdGgsICd3YXMgYWRkZWQnKSlcbiAqL1xuZXhwb3J0IGNsYXNzIEZTV2F0Y2hlciBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gICAgLy8gTm90IGluZGVudGluZyBtZXRob2RzIGZvciBoaXN0b3J5IHNha2U7IGZvciBub3cuXG4gICAgY29uc3RydWN0b3IoX29wdHMgPSB7fSkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmNsb3NlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9jbG9zZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX3Rocm90dGxlZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgdGhpcy5fc3ltbGlua1BhdGhzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl93YXRjaGVkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9wZW5kaW5nV3JpdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9wZW5kaW5nVW5saW5rcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fcmVhZHlDb3VudCA9IDA7XG4gICAgICAgIHRoaXMuX3JlYWR5RW1pdHRlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBhd2YgPSBfb3B0cy5hd2FpdFdyaXRlRmluaXNoO1xuICAgICAgICBjb25zdCBERUZfQVdGID0geyBzdGFiaWxpdHlUaHJlc2hvbGQ6IDIwMDAsIHBvbGxJbnRlcnZhbDogMTAwIH07XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7XG4gICAgICAgICAgICAvLyBEZWZhdWx0c1xuICAgICAgICAgICAgcGVyc2lzdGVudDogdHJ1ZSxcbiAgICAgICAgICAgIGlnbm9yZUluaXRpYWw6IGZhbHNlLFxuICAgICAgICAgICAgaWdub3JlUGVybWlzc2lvbkVycm9yczogZmFsc2UsXG4gICAgICAgICAgICBpbnRlcnZhbDogMTAwLFxuICAgICAgICAgICAgYmluYXJ5SW50ZXJ2YWw6IDMwMCxcbiAgICAgICAgICAgIGZvbGxvd1N5bWxpbmtzOiB0cnVlLFxuICAgICAgICAgICAgdXNlUG9sbGluZzogZmFsc2UsXG4gICAgICAgICAgICAvLyB1c2VBc3luYzogZmFsc2UsXG4gICAgICAgICAgICBhdG9taWM6IHRydWUsIC8vIE5PVEU6IG92ZXJ3cml0dGVuIGxhdGVyIChkZXBlbmRzIG9uIHVzZVBvbGxpbmcpXG4gICAgICAgICAgICAuLi5fb3B0cyxcbiAgICAgICAgICAgIC8vIENoYW5nZSBmb3JtYXRcbiAgICAgICAgICAgIGlnbm9yZWQ6IF9vcHRzLmlnbm9yZWQgPyBhcnJpZnkoX29wdHMuaWdub3JlZCkgOiBhcnJpZnkoW10pLFxuICAgICAgICAgICAgYXdhaXRXcml0ZUZpbmlzaDogYXdmID09PSB0cnVlID8gREVGX0FXRiA6IHR5cGVvZiBhd2YgPT09ICdvYmplY3QnID8geyAuLi5ERUZfQVdGLCAuLi5hd2YgfSA6IGZhbHNlLFxuICAgICAgICB9O1xuICAgICAgICAvLyBBbHdheXMgZGVmYXVsdCB0byBwb2xsaW5nIG9uIElCTSBpIGJlY2F1c2UgZnMud2F0Y2goKSBpcyBub3QgYXZhaWxhYmxlIG9uIElCTSBpLlxuICAgICAgICBpZiAoaXNJQk1pKVxuICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgLy8gRWRpdG9yIGF0b21pYyB3cml0ZSBub3JtYWxpemF0aW9uIGVuYWJsZWQgYnkgZGVmYXVsdCB3aXRoIGZzLndhdGNoXG4gICAgICAgIGlmIChvcHRzLmF0b21pYyA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgb3B0cy5hdG9taWMgPSAhb3B0cy51c2VQb2xsaW5nO1xuICAgICAgICAvLyBvcHRzLmF0b21pYyA9IHR5cGVvZiBfb3B0cy5hdG9taWMgPT09ICdudW1iZXInID8gX29wdHMuYXRvbWljIDogMTAwO1xuICAgICAgICAvLyBHbG9iYWwgb3ZlcnJpZGUuIFVzZWZ1bCBmb3IgZGV2ZWxvcGVycywgd2hvIG5lZWQgdG8gZm9yY2UgcG9sbGluZyBmb3IgYWxsXG4gICAgICAgIC8vIGluc3RhbmNlcyBvZiBjaG9raWRhciwgcmVnYXJkbGVzcyBvZiB1c2FnZSAvIGRlcGVuZGVuY3kgZGVwdGhcbiAgICAgICAgY29uc3QgZW52UG9sbCA9IHByb2Nlc3MuZW52LkNIT0tJREFSX1VTRVBPTExJTkc7XG4gICAgICAgIGlmIChlbnZQb2xsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVudkxvd2VyID0gZW52UG9sbC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKGVudkxvd2VyID09PSAnZmFsc2UnIHx8IGVudkxvd2VyID09PSAnMCcpXG4gICAgICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBlbHNlIGlmIChlbnZMb3dlciA9PT0gJ3RydWUnIHx8IGVudkxvd2VyID09PSAnMScpXG4gICAgICAgICAgICAgICAgb3B0cy51c2VQb2xsaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBvcHRzLnVzZVBvbGxpbmcgPSAhIWVudkxvd2VyO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGVudkludGVydmFsID0gcHJvY2Vzcy5lbnYuQ0hPS0lEQVJfSU5URVJWQUw7XG4gICAgICAgIGlmIChlbnZJbnRlcnZhbClcbiAgICAgICAgICAgIG9wdHMuaW50ZXJ2YWwgPSBOdW1iZXIucGFyc2VJbnQoZW52SW50ZXJ2YWwsIDEwKTtcbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIHRvIGVtaXQgcmVhZHkgb25seSBvbmNlLCBidXQgZWFjaCAnYWRkJyB3aWxsIGluY3JlYXNlIHRoYXQ/XG4gICAgICAgIGxldCByZWFkeUNhbGxzID0gMDtcbiAgICAgICAgdGhpcy5fZW1pdFJlYWR5ID0gKCkgPT4ge1xuICAgICAgICAgICAgcmVhZHlDYWxscysrO1xuICAgICAgICAgICAgaWYgKHJlYWR5Q2FsbHMgPj0gdGhpcy5fcmVhZHlDb3VudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VtaXRSZWFkeSA9IEVNUFRZX0ZOO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlYWR5RW1pdHRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgLy8gdXNlIHByb2Nlc3MubmV4dFRpY2sgdG8gYWxsb3cgdGltZSBmb3IgbGlzdGVuZXIgdG8gYmUgYm91bmRcbiAgICAgICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHRoaXMuZW1pdChFVi5SRUFEWSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLl9lbWl0UmF3ID0gKC4uLmFyZ3MpID0+IHRoaXMuZW1pdChFVi5SQVcsIC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLl9ib3VuZFJlbW92ZSA9IHRoaXMuX3JlbW92ZS5iaW5kKHRoaXMpO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRzO1xuICAgICAgICB0aGlzLl9ub2RlRnNIYW5kbGVyID0gbmV3IE5vZGVGc0hhbmRsZXIodGhpcyk7XG4gICAgICAgIC8vIFlvdVx1MjAxOXJlIGZyb3plbiB3aGVuIHlvdXIgaGVhcnRcdTIwMTlzIG5vdCBvcGVuLlxuICAgICAgICBPYmplY3QuZnJlZXplKG9wdHMpO1xuICAgIH1cbiAgICBfYWRkSWdub3JlZFBhdGgobWF0Y2hlcikge1xuICAgICAgICBpZiAoaXNNYXRjaGVyT2JqZWN0KG1hdGNoZXIpKSB7XG4gICAgICAgICAgICAvLyByZXR1cm4gZWFybHkgaWYgd2UgYWxyZWFkeSBoYXZlIGEgZGVlcGx5IGVxdWFsIG1hdGNoZXIgb2JqZWN0XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlnbm9yZWQgb2YgdGhpcy5faWdub3JlZFBhdGhzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzTWF0Y2hlck9iamVjdChpZ25vcmVkKSAmJlxuICAgICAgICAgICAgICAgICAgICBpZ25vcmVkLnBhdGggPT09IG1hdGNoZXIucGF0aCAmJlxuICAgICAgICAgICAgICAgICAgICBpZ25vcmVkLnJlY3Vyc2l2ZSA9PT0gbWF0Y2hlci5yZWN1cnNpdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMuYWRkKG1hdGNoZXIpO1xuICAgIH1cbiAgICBfcmVtb3ZlSWdub3JlZFBhdGgobWF0Y2hlcikge1xuICAgICAgICB0aGlzLl9pZ25vcmVkUGF0aHMuZGVsZXRlKG1hdGNoZXIpO1xuICAgICAgICAvLyBub3cgZmluZCBhbnkgbWF0Y2hlciBvYmplY3RzIHdpdGggdGhlIG1hdGNoZXIgYXMgcGF0aFxuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGlnbm9yZWQgb2YgdGhpcy5faWdub3JlZFBhdGhzKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyAoNDMwODFqKTogbWFrZSB0aGlzIG1vcmUgZWZmaWNpZW50LlxuICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IGp1c3QgbWFrZSBhIGB0aGlzLl9pZ25vcmVkRGlyZWN0b3JpZXNgIG9yIHNvbWVcbiAgICAgICAgICAgICAgICAvLyBzdWNoIHRoaW5nLlxuICAgICAgICAgICAgICAgIGlmIChpc01hdGNoZXJPYmplY3QoaWdub3JlZCkgJiYgaWdub3JlZC5wYXRoID09PSBtYXRjaGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2lnbm9yZWRQYXRocy5kZWxldGUoaWdub3JlZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFB1YmxpYyBtZXRob2RzXG4gICAgLyoqXG4gICAgICogQWRkcyBwYXRocyB0byBiZSB3YXRjaGVkIG9uIGFuIGV4aXN0aW5nIEZTV2F0Y2hlciBpbnN0YW5jZS5cbiAgICAgKiBAcGFyYW0gcGF0aHNfIGZpbGUgb3IgZmlsZSBsaXN0LiBPdGhlciBhcmd1bWVudHMgYXJlIHVudXNlZFxuICAgICAqL1xuICAgIGFkZChwYXRoc18sIF9vcmlnQWRkLCBfaW50ZXJuYWwpIHtcbiAgICAgICAgY29uc3QgeyBjd2QgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdGhpcy5jbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY2xvc2VQcm9taXNlID0gdW5kZWZpbmVkO1xuICAgICAgICBsZXQgcGF0aHMgPSB1bmlmeVBhdGhzKHBhdGhzXyk7XG4gICAgICAgIGlmIChjd2QpIHtcbiAgICAgICAgICAgIHBhdGhzID0gcGF0aHMubWFwKChwYXRoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWJzUGF0aCA9IGdldEFic29sdXRlUGF0aChwYXRoLCBjd2QpO1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGBwYXRoYCBpbnN0ZWFkIG9mIGBhYnNQYXRoYCBiZWNhdXNlIHRoZSBjd2QgcG9ydGlvbiBjYW4ndCBiZSBhIGdsb2JcbiAgICAgICAgICAgICAgICByZXR1cm4gYWJzUGF0aDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3JlbW92ZUlnbm9yZWRQYXRoKHBhdGgpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmICghdGhpcy5fcmVhZHlDb3VudClcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5Q291bnQgPSAwO1xuICAgICAgICB0aGlzLl9yZWFkeUNvdW50ICs9IHBhdGhzLmxlbmd0aDtcbiAgICAgICAgUHJvbWlzZS5hbGwocGF0aHMubWFwKGFzeW5jIChwYXRoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLl9ub2RlRnNIYW5kbGVyLl9hZGRUb05vZGVGcyhwYXRoLCAhX2ludGVybmFsLCB1bmRlZmluZWQsIDAsIF9vcmlnQWRkKTtcbiAgICAgICAgICAgIGlmIChyZXMpXG4gICAgICAgICAgICAgICAgdGhpcy5fZW1pdFJlYWR5KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9KSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2xvc2VkKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIHJlc3VsdHMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZChzeXNQYXRoLmRpcm5hbWUoaXRlbSksIHN5c1BhdGguYmFzZW5hbWUoX29yaWdBZGQgfHwgaXRlbSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2Ugd2F0Y2hlcnMgb3Igc3RhcnQgaWdub3JpbmcgZXZlbnRzIGZyb20gc3BlY2lmaWVkIHBhdGhzLlxuICAgICAqL1xuICAgIHVud2F0Y2gocGF0aHNfKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICBjb25zdCBwYXRocyA9IHVuaWZ5UGF0aHMocGF0aHNfKTtcbiAgICAgICAgY29uc3QgeyBjd2QgfSA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgcGF0aHMuZm9yRWFjaCgocGF0aCkgPT4ge1xuICAgICAgICAgICAgLy8gY29udmVydCB0byBhYnNvbHV0ZSBwYXRoIHVubGVzcyByZWxhdGl2ZSBwYXRoIGFscmVhZHkgbWF0Y2hlc1xuICAgICAgICAgICAgaWYgKCFzeXNQYXRoLmlzQWJzb2x1dGUocGF0aCkgJiYgIXRoaXMuX2Nsb3NlcnMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN3ZClcbiAgICAgICAgICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGguam9pbihjd2QsIHBhdGgpO1xuICAgICAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLnJlc29sdmUocGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9jbG9zZVBhdGgocGF0aCk7XG4gICAgICAgICAgICB0aGlzLl9hZGRJZ25vcmVkUGF0aChwYXRoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl93YXRjaGVkLmhhcyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZElnbm9yZWRQYXRoKHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gcmVzZXQgdGhlIGNhY2hlZCB1c2VySWdub3JlZCBhbnltYXRjaCBmblxuICAgICAgICAgICAgLy8gdG8gbWFrZSBpZ25vcmVkUGF0aHMgY2hhbmdlcyBlZmZlY3RpdmVcbiAgICAgICAgICAgIHRoaXMuX3VzZXJJZ25vcmVkID0gdW5kZWZpbmVkO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlIHdhdGNoZXJzIGFuZCByZW1vdmUgYWxsIGxpc3RlbmVycyBmcm9tIHdhdGNoZWQgcGF0aHMuXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLl9jbG9zZVByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9jbG9zZVByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgICAgICAvLyBNZW1vcnkgbWFuYWdlbWVudC5cbiAgICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgY29uc3QgY2xvc2VycyA9IFtdO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmZvckVhY2goKGNsb3Nlckxpc3QpID0+IGNsb3Nlckxpc3QuZm9yRWFjaCgoY2xvc2VyKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcm9taXNlID0gY2xvc2VyKCk7XG4gICAgICAgICAgICBpZiAocHJvbWlzZSBpbnN0YW5jZW9mIFByb21pc2UpXG4gICAgICAgICAgICAgICAgY2xvc2Vycy5wdXNoKHByb21pc2UpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX3N0cmVhbXMuZm9yRWFjaCgoc3RyZWFtKSA9PiBzdHJlYW0uZGVzdHJveSgpKTtcbiAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX3JlYWR5Q291bnQgPSAwO1xuICAgICAgICB0aGlzLl9yZWFkeUVtaXR0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fd2F0Y2hlZC5mb3JFYWNoKChkaXJlbnQpID0+IGRpcmVudC5kaXNwb3NlKCkpO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zeW1saW5rUGF0aHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fdGhyb3R0bGVkLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2Nsb3NlUHJvbWlzZSA9IGNsb3NlcnMubGVuZ3RoXG4gICAgICAgICAgICA/IFByb21pc2UuYWxsKGNsb3NlcnMpLnRoZW4oKCkgPT4gdW5kZWZpbmVkKVxuICAgICAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlUHJvbWlzZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRXhwb3NlIGxpc3Qgb2Ygd2F0Y2hlZCBwYXRoc1xuICAgICAqIEByZXR1cm5zIGZvciBjaGFpbmluZ1xuICAgICAqL1xuICAgIGdldFdhdGNoZWQoKSB7XG4gICAgICAgIGNvbnN0IHdhdGNoTGlzdCA9IHt9O1xuICAgICAgICB0aGlzLl93YXRjaGVkLmZvckVhY2goKGVudHJ5LCBkaXIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMub3B0aW9ucy5jd2QgPyBzeXNQYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5jd2QsIGRpcikgOiBkaXI7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGtleSB8fCBPTkVfRE9UO1xuICAgICAgICAgICAgd2F0Y2hMaXN0W2luZGV4XSA9IGVudHJ5LmdldENoaWxkcmVuKCkuc29ydCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHdhdGNoTGlzdDtcbiAgICB9XG4gICAgZW1pdFdpdGhBbGwoZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgdGhpcy5lbWl0KGV2ZW50LCAuLi5hcmdzKTtcbiAgICAgICAgaWYgKGV2ZW50ICE9PSBFVi5FUlJPUilcbiAgICAgICAgICAgIHRoaXMuZW1pdChFVi5BTEwsIGV2ZW50LCAuLi5hcmdzKTtcbiAgICB9XG4gICAgLy8gQ29tbW9uIGhlbHBlcnNcbiAgICAvLyAtLS0tLS0tLS0tLS0tLVxuICAgIC8qKlxuICAgICAqIE5vcm1hbGl6ZSBhbmQgZW1pdCBldmVudHMuXG4gICAgICogQ2FsbGluZyBfZW1pdCBET0VTIE5PVCBNRUFOIGVtaXQoKSB3b3VsZCBiZSBjYWxsZWQhXG4gICAgICogQHBhcmFtIGV2ZW50IFR5cGUgb2YgZXZlbnRcbiAgICAgKiBAcGFyYW0gcGF0aCBGaWxlIG9yIGRpcmVjdG9yeSBwYXRoXG4gICAgICogQHBhcmFtIHN0YXRzIGFyZ3VtZW50cyB0byBiZSBwYXNzZWQgd2l0aCBldmVudFxuICAgICAqIEByZXR1cm5zIHRoZSBlcnJvciBpZiBkZWZpbmVkLCBvdGhlcndpc2UgdGhlIHZhbHVlIG9mIHRoZSBGU1dhdGNoZXIgaW5zdGFuY2UncyBgY2xvc2VkYCBmbGFnXG4gICAgICovXG4gICAgYXN5bmMgX2VtaXQoZXZlbnQsIHBhdGgsIHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLmNsb3NlZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgaWYgKGlzV2luZG93cylcbiAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLm5vcm1hbGl6ZShwYXRoKTtcbiAgICAgICAgaWYgKG9wdHMuY3dkKVxuICAgICAgICAgICAgcGF0aCA9IHN5c1BhdGgucmVsYXRpdmUob3B0cy5jd2QsIHBhdGgpO1xuICAgICAgICBjb25zdCBhcmdzID0gW3BhdGhdO1xuICAgICAgICBpZiAoc3RhdHMgIT0gbnVsbClcbiAgICAgICAgICAgIGFyZ3MucHVzaChzdGF0cyk7XG4gICAgICAgIGNvbnN0IGF3ZiA9IG9wdHMuYXdhaXRXcml0ZUZpbmlzaDtcbiAgICAgICAgbGV0IHB3O1xuICAgICAgICBpZiAoYXdmICYmIChwdyA9IHRoaXMuX3BlbmRpbmdXcml0ZXMuZ2V0KHBhdGgpKSkge1xuICAgICAgICAgICAgcHcubGFzdENoYW5nZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0cy5hdG9taWMpIHtcbiAgICAgICAgICAgIGlmIChldmVudCA9PT0gRVYuVU5MSU5LKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGVuZGluZ1VubGlua3Muc2V0KHBhdGgsIFtldmVudCwgLi4uYXJnc10pO1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wZW5kaW5nVW5saW5rcy5mb3JFYWNoKChlbnRyeSwgcGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0KC4uLmVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdChFVi5BTEwsIC4uLmVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSwgdHlwZW9mIG9wdHMuYXRvbWljID09PSAnbnVtYmVyJyA/IG9wdHMuYXRvbWljIDogMTAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldmVudCA9PT0gRVYuQUREICYmIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmhhcyhwYXRoKSkge1xuICAgICAgICAgICAgICAgIGV2ZW50ID0gRVYuQ0hBTkdFO1xuICAgICAgICAgICAgICAgIHRoaXMuX3BlbmRpbmdVbmxpbmtzLmRlbGV0ZShwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYXdmICYmIChldmVudCA9PT0gRVYuQUREIHx8IGV2ZW50ID09PSBFVi5DSEFOR0UpICYmIHRoaXMuX3JlYWR5RW1pdHRlZCkge1xuICAgICAgICAgICAgY29uc3QgYXdmRW1pdCA9IChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBldmVudCA9IEVWLkVSUk9SO1xuICAgICAgICAgICAgICAgICAgICBhcmdzWzBdID0gZXJyO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRXaXRoQWxsKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgc3RhdHMgZG9lc24ndCBleGlzdCB0aGUgZmlsZSBtdXN0IGhhdmUgYmVlbiBkZWxldGVkXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3NbMV0gPSBzdGF0cztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MucHVzaChzdGF0cyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0V2l0aEFsbChldmVudCwgYXJncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuX2F3YWl0V3JpdGVGaW5pc2gocGF0aCwgYXdmLnN0YWJpbGl0eVRocmVzaG9sZCwgZXZlbnQsIGF3ZkVtaXQpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5DSEFOR0UpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzVGhyb3R0bGVkID0gIXRoaXMuX3Rocm90dGxlKEVWLkNIQU5HRSwgcGF0aCwgNTApO1xuICAgICAgICAgICAgaWYgKGlzVGhyb3R0bGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRzLmFsd2F5c1N0YXQgJiZcbiAgICAgICAgICAgIHN0YXRzID09PSB1bmRlZmluZWQgJiZcbiAgICAgICAgICAgIChldmVudCA9PT0gRVYuQUREIHx8IGV2ZW50ID09PSBFVi5BRERfRElSIHx8IGV2ZW50ID09PSBFVi5DSEFOR0UpKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsUGF0aCA9IG9wdHMuY3dkID8gc3lzUGF0aC5qb2luKG9wdHMuY3dkLCBwYXRoKSA6IHBhdGg7XG4gICAgICAgICAgICBsZXQgc3RhdHM7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHN0YXRzID0gYXdhaXQgc3RhdChmdWxsUGF0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gU3VwcHJlc3MgZXZlbnQgd2hlbiBmc19zdGF0IGZhaWxzLCB0byBhdm9pZCBzZW5kaW5nIHVuZGVmaW5lZCAnc3RhdCdcbiAgICAgICAgICAgIGlmICghc3RhdHMgfHwgdGhpcy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgYXJncy5wdXNoKHN0YXRzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVtaXRXaXRoQWxsKGV2ZW50LCBhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENvbW1vbiBoYW5kbGVyIGZvciBlcnJvcnNcbiAgICAgKiBAcmV0dXJucyBUaGUgZXJyb3IgaWYgZGVmaW5lZCwgb3RoZXJ3aXNlIHRoZSB2YWx1ZSBvZiB0aGUgRlNXYXRjaGVyIGluc3RhbmNlJ3MgYGNsb3NlZGAgZmxhZ1xuICAgICAqL1xuICAgIF9oYW5kbGVFcnJvcihlcnJvcikge1xuICAgICAgICBjb25zdCBjb2RlID0gZXJyb3IgJiYgZXJyb3IuY29kZTtcbiAgICAgICAgaWYgKGVycm9yICYmXG4gICAgICAgICAgICBjb2RlICE9PSAnRU5PRU5UJyAmJlxuICAgICAgICAgICAgY29kZSAhPT0gJ0VOT1RESVInICYmXG4gICAgICAgICAgICAoIXRoaXMub3B0aW9ucy5pZ25vcmVQZXJtaXNzaW9uRXJyb3JzIHx8IChjb2RlICE9PSAnRVBFUk0nICYmIGNvZGUgIT09ICdFQUNDRVMnKSkpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdChFVi5FUlJPUiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlcnJvciB8fCB0aGlzLmNsb3NlZDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGVscGVyIHV0aWxpdHkgZm9yIHRocm90dGxpbmdcbiAgICAgKiBAcGFyYW0gYWN0aW9uVHlwZSB0eXBlIGJlaW5nIHRocm90dGxlZFxuICAgICAqIEBwYXJhbSBwYXRoIGJlaW5nIGFjdGVkIHVwb25cbiAgICAgKiBAcGFyYW0gdGltZW91dCBkdXJhdGlvbiBvZiB0aW1lIHRvIHN1cHByZXNzIGR1cGxpY2F0ZSBhY3Rpb25zXG4gICAgICogQHJldHVybnMgdHJhY2tpbmcgb2JqZWN0IG9yIGZhbHNlIGlmIGFjdGlvbiBzaG91bGQgYmUgc3VwcHJlc3NlZFxuICAgICAqL1xuICAgIF90aHJvdHRsZShhY3Rpb25UeXBlLCBwYXRoLCB0aW1lb3V0KSB7XG4gICAgICAgIGlmICghdGhpcy5fdGhyb3R0bGVkLmhhcyhhY3Rpb25UeXBlKSkge1xuICAgICAgICAgICAgdGhpcy5fdGhyb3R0bGVkLnNldChhY3Rpb25UeXBlLCBuZXcgTWFwKCkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IHRoaXMuX3Rocm90dGxlZC5nZXQoYWN0aW9uVHlwZSk7XG4gICAgICAgIGlmICghYWN0aW9uKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhbGlkIHRocm90dGxlJyk7XG4gICAgICAgIGNvbnN0IGFjdGlvblBhdGggPSBhY3Rpb24uZ2V0KHBhdGgpO1xuICAgICAgICBpZiAoYWN0aW9uUGF0aCkge1xuICAgICAgICAgICAgYWN0aW9uUGF0aC5jb3VudCsrO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBwcmVmZXItY29uc3RcbiAgICAgICAgbGV0IHRpbWVvdXRPYmplY3Q7XG4gICAgICAgIGNvbnN0IGNsZWFyID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGFjdGlvbi5nZXQocGF0aCk7XG4gICAgICAgICAgICBjb25zdCBjb3VudCA9IGl0ZW0gPyBpdGVtLmNvdW50IDogMDtcbiAgICAgICAgICAgIGFjdGlvbi5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dE9iamVjdCk7XG4gICAgICAgICAgICBpZiAoaXRlbSlcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaXRlbS50aW1lb3V0T2JqZWN0KTtcbiAgICAgICAgICAgIHJldHVybiBjb3VudDtcbiAgICAgICAgfTtcbiAgICAgICAgdGltZW91dE9iamVjdCA9IHNldFRpbWVvdXQoY2xlYXIsIHRpbWVvdXQpO1xuICAgICAgICBjb25zdCB0aHIgPSB7IHRpbWVvdXRPYmplY3QsIGNsZWFyLCBjb3VudDogMCB9O1xuICAgICAgICBhY3Rpb24uc2V0KHBhdGgsIHRocik7XG4gICAgICAgIHJldHVybiB0aHI7XG4gICAgfVxuICAgIF9pbmNyUmVhZHlDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3JlYWR5Q291bnQrKztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQXdhaXRzIHdyaXRlIG9wZXJhdGlvbiB0byBmaW5pc2guXG4gICAgICogUG9sbHMgYSBuZXdseSBjcmVhdGVkIGZpbGUgZm9yIHNpemUgdmFyaWF0aW9ucy4gV2hlbiBmaWxlcyBzaXplIGRvZXMgbm90IGNoYW5nZSBmb3IgJ3RocmVzaG9sZCcgbWlsbGlzZWNvbmRzIGNhbGxzIGNhbGxiYWNrLlxuICAgICAqIEBwYXJhbSBwYXRoIGJlaW5nIGFjdGVkIHVwb25cbiAgICAgKiBAcGFyYW0gdGhyZXNob2xkIFRpbWUgaW4gbWlsbGlzZWNvbmRzIGEgZmlsZSBzaXplIG11c3QgYmUgZml4ZWQgYmVmb3JlIGFja25vd2xlZGdpbmcgd3JpdGUgT1AgaXMgZmluaXNoZWRcbiAgICAgKiBAcGFyYW0gZXZlbnRcbiAgICAgKiBAcGFyYW0gYXdmRW1pdCBDYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiByZWFkeSBmb3IgZXZlbnQgdG8gYmUgZW1pdHRlZC5cbiAgICAgKi9cbiAgICBfYXdhaXRXcml0ZUZpbmlzaChwYXRoLCB0aHJlc2hvbGQsIGV2ZW50LCBhd2ZFbWl0KSB7XG4gICAgICAgIGNvbnN0IGF3ZiA9IHRoaXMub3B0aW9ucy5hd2FpdFdyaXRlRmluaXNoO1xuICAgICAgICBpZiAodHlwZW9mIGF3ZiAhPT0gJ29iamVjdCcpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IHBvbGxJbnRlcnZhbCA9IGF3Zi5wb2xsSW50ZXJ2YWw7XG4gICAgICAgIGxldCB0aW1lb3V0SGFuZGxlcjtcbiAgICAgICAgbGV0IGZ1bGxQYXRoID0gcGF0aDtcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jd2QgJiYgIXN5c1BhdGguaXNBYnNvbHV0ZShwYXRoKSkge1xuICAgICAgICAgICAgZnVsbFBhdGggPSBzeXNQYXRoLmpvaW4odGhpcy5vcHRpb25zLmN3ZCwgcGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3Qgd3JpdGVzID0gdGhpcy5fcGVuZGluZ1dyaXRlcztcbiAgICAgICAgZnVuY3Rpb24gYXdhaXRXcml0ZUZpbmlzaEZuKHByZXZTdGF0KSB7XG4gICAgICAgICAgICBzdGF0Y2IoZnVsbFBhdGgsIChlcnIsIGN1clN0YXQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIHx8ICF3cml0ZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgJiYgZXJyLmNvZGUgIT09ICdFTk9FTlQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgYXdmRW1pdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IE51bWJlcihuZXcgRGF0ZSgpKTtcbiAgICAgICAgICAgICAgICBpZiAocHJldlN0YXQgJiYgY3VyU3RhdC5zaXplICE9PSBwcmV2U3RhdC5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlcy5nZXQocGF0aCkubGFzdENoYW5nZSA9IG5vdztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc3QgcHcgPSB3cml0ZXMuZ2V0KHBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRmID0gbm93IC0gcHcubGFzdENoYW5nZTtcbiAgICAgICAgICAgICAgICBpZiAoZGYgPj0gdGhyZXNob2xkKSB7XG4gICAgICAgICAgICAgICAgICAgIHdyaXRlcy5kZWxldGUocGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGF3ZkVtaXQodW5kZWZpbmVkLCBjdXJTdGF0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRIYW5kbGVyID0gc2V0VGltZW91dChhd2FpdFdyaXRlRmluaXNoRm4sIHBvbGxJbnRlcnZhbCwgY3VyU3RhdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3cml0ZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICB3cml0ZXMuc2V0KHBhdGgsIHtcbiAgICAgICAgICAgICAgICBsYXN0Q2hhbmdlOiBub3csXG4gICAgICAgICAgICAgICAgY2FuY2VsV2FpdDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3cml0ZXMuZGVsZXRlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQ7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGltZW91dEhhbmRsZXIgPSBzZXRUaW1lb3V0KGF3YWl0V3JpdGVGaW5pc2hGbiwgcG9sbEludGVydmFsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdXNlciBoYXMgYXNrZWQgdG8gaWdub3JlIHRoaXMgcGF0aC5cbiAgICAgKi9cbiAgICBfaXNJZ25vcmVkKHBhdGgsIHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYXRvbWljICYmIERPVF9SRS50ZXN0KHBhdGgpKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGlmICghdGhpcy5fdXNlcklnbm9yZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgY3dkIH0gPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICBjb25zdCBpZ24gPSB0aGlzLm9wdGlvbnMuaWdub3JlZDtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWQgPSAoaWduIHx8IFtdKS5tYXAobm9ybWFsaXplSWdub3JlZChjd2QpKTtcbiAgICAgICAgICAgIGNvbnN0IGlnbm9yZWRQYXRocyA9IFsuLi50aGlzLl9pZ25vcmVkUGF0aHNdO1xuICAgICAgICAgICAgY29uc3QgbGlzdCA9IFsuLi5pZ25vcmVkUGF0aHMubWFwKG5vcm1hbGl6ZUlnbm9yZWQoY3dkKSksIC4uLmlnbm9yZWRdO1xuICAgICAgICAgICAgdGhpcy5fdXNlcklnbm9yZWQgPSBhbnltYXRjaChsaXN0LCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl91c2VySWdub3JlZChwYXRoLCBzdGF0cyk7XG4gICAgfVxuICAgIF9pc250SWdub3JlZChwYXRoLCBzdGF0KSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5faXNJZ25vcmVkKHBhdGgsIHN0YXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBhIHNldCBvZiBjb21tb24gaGVscGVycyBhbmQgcHJvcGVydGllcyByZWxhdGluZyB0byBzeW1saW5rIGhhbmRsaW5nLlxuICAgICAqIEBwYXJhbSBwYXRoIGZpbGUgb3IgZGlyZWN0b3J5IHBhdHRlcm4gYmVpbmcgd2F0Y2hlZFxuICAgICAqL1xuICAgIF9nZXRXYXRjaEhlbHBlcnMocGF0aCkge1xuICAgICAgICByZXR1cm4gbmV3IFdhdGNoSGVscGVyKHBhdGgsIHRoaXMub3B0aW9ucy5mb2xsb3dTeW1saW5rcywgdGhpcyk7XG4gICAgfVxuICAgIC8vIERpcmVjdG9yeSBoZWxwZXJzXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvKipcbiAgICAgKiBQcm92aWRlcyBkaXJlY3RvcnkgdHJhY2tpbmcgb2JqZWN0c1xuICAgICAqIEBwYXJhbSBkaXJlY3RvcnkgcGF0aCBvZiB0aGUgZGlyZWN0b3J5XG4gICAgICovXG4gICAgX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHN5c1BhdGgucmVzb2x2ZShkaXJlY3RvcnkpO1xuICAgICAgICBpZiAoIXRoaXMuX3dhdGNoZWQuaGFzKGRpcikpXG4gICAgICAgICAgICB0aGlzLl93YXRjaGVkLnNldChkaXIsIG5ldyBEaXJFbnRyeShkaXIsIHRoaXMuX2JvdW5kUmVtb3ZlKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl93YXRjaGVkLmdldChkaXIpO1xuICAgIH1cbiAgICAvLyBGaWxlIGhlbHBlcnNcbiAgICAvLyAtLS0tLS0tLS0tLS1cbiAgICAvKipcbiAgICAgKiBDaGVjayBmb3IgcmVhZCBwZXJtaXNzaW9uczogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzExNzgxNDA0LzEzNTg0MDVcbiAgICAgKi9cbiAgICBfaGFzUmVhZFBlcm1pc3Npb25zKHN0YXRzKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlUGVybWlzc2lvbkVycm9ycylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gQm9vbGVhbihOdW1iZXIoc3RhdHMubW9kZSkgJiAwbzQwMCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEhhbmRsZXMgZW1pdHRpbmcgdW5saW5rIGV2ZW50cyBmb3JcbiAgICAgKiBmaWxlcyBhbmQgZGlyZWN0b3JpZXMsIGFuZCB2aWEgcmVjdXJzaW9uLCBmb3JcbiAgICAgKiBmaWxlcyBhbmQgZGlyZWN0b3JpZXMgd2l0aGluIGRpcmVjdG9yaWVzIHRoYXQgYXJlIHVubGlua2VkXG4gICAgICogQHBhcmFtIGRpcmVjdG9yeSB3aXRoaW4gd2hpY2ggdGhlIGZvbGxvd2luZyBpdGVtIGlzIGxvY2F0ZWRcbiAgICAgKiBAcGFyYW0gaXRlbSAgICAgIGJhc2UgcGF0aCBvZiBpdGVtL2RpcmVjdG9yeVxuICAgICAqL1xuICAgIF9yZW1vdmUoZGlyZWN0b3J5LCBpdGVtLCBpc0RpcmVjdG9yeSkge1xuICAgICAgICAvLyBpZiB3aGF0IGlzIGJlaW5nIGRlbGV0ZWQgaXMgYSBkaXJlY3RvcnksIGdldCB0aGF0IGRpcmVjdG9yeSdzIHBhdGhzXG4gICAgICAgIC8vIGZvciByZWN1cnNpdmUgZGVsZXRpbmcgYW5kIGNsZWFuaW5nIG9mIHdhdGNoZWQgb2JqZWN0XG4gICAgICAgIC8vIGlmIGl0IGlzIG5vdCBhIGRpcmVjdG9yeSwgbmVzdGVkRGlyZWN0b3J5Q2hpbGRyZW4gd2lsbCBiZSBlbXB0eSBhcnJheVxuICAgICAgICBjb25zdCBwYXRoID0gc3lzUGF0aC5qb2luKGRpcmVjdG9yeSwgaXRlbSk7XG4gICAgICAgIGNvbnN0IGZ1bGxQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgICAgICBpc0RpcmVjdG9yeSA9XG4gICAgICAgICAgICBpc0RpcmVjdG9yeSAhPSBudWxsID8gaXNEaXJlY3RvcnkgOiB0aGlzLl93YXRjaGVkLmhhcyhwYXRoKSB8fCB0aGlzLl93YXRjaGVkLmhhcyhmdWxsUGF0aCk7XG4gICAgICAgIC8vIHByZXZlbnQgZHVwbGljYXRlIGhhbmRsaW5nIGluIGNhc2Ugb2YgYXJyaXZpbmcgaGVyZSBuZWFybHkgc2ltdWx0YW5lb3VzbHlcbiAgICAgICAgLy8gdmlhIG11bHRpcGxlIHBhdGhzIChzdWNoIGFzIF9oYW5kbGVGaWxlIGFuZCBfaGFuZGxlRGlyKVxuICAgICAgICBpZiAoIXRoaXMuX3Rocm90dGxlKCdyZW1vdmUnLCBwYXRoLCAxMDApKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAvLyBpZiB0aGUgb25seSB3YXRjaGVkIGZpbGUgaXMgcmVtb3ZlZCwgd2F0Y2ggZm9yIGl0cyByZXR1cm5cbiAgICAgICAgaWYgKCFpc0RpcmVjdG9yeSAmJiB0aGlzLl93YXRjaGVkLnNpemUgPT09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkKGRpcmVjdG9yeSwgaXRlbSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhpcyB3aWxsIGNyZWF0ZSBhIG5ldyBlbnRyeSBpbiB0aGUgd2F0Y2hlZCBvYmplY3QgaW4gZWl0aGVyIGNhc2VcbiAgICAgICAgLy8gc28gd2UgZ290IHRvIGRvIHRoZSBkaXJlY3RvcnkgY2hlY2sgYmVmb3JlaGFuZFxuICAgICAgICBjb25zdCB3cCA9IHRoaXMuX2dldFdhdGNoZWREaXIocGF0aCk7XG4gICAgICAgIGNvbnN0IG5lc3RlZERpcmVjdG9yeUNoaWxkcmVuID0gd3AuZ2V0Q2hpbGRyZW4oKTtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgcmVtb3ZlIGNoaWxkcmVuIGRpcmVjdG9yaWVzIC8gZmlsZXMuXG4gICAgICAgIG5lc3RlZERpcmVjdG9yeUNoaWxkcmVuLmZvckVhY2goKG5lc3RlZCkgPT4gdGhpcy5fcmVtb3ZlKHBhdGgsIG5lc3RlZCkpO1xuICAgICAgICAvLyBDaGVjayBpZiBpdGVtIHdhcyBvbiB0aGUgd2F0Y2hlZCBsaXN0IGFuZCByZW1vdmUgaXRcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5fZ2V0V2F0Y2hlZERpcihkaXJlY3RvcnkpO1xuICAgICAgICBjb25zdCB3YXNUcmFja2VkID0gcGFyZW50LmhhcyhpdGVtKTtcbiAgICAgICAgcGFyZW50LnJlbW92ZShpdGVtKTtcbiAgICAgICAgLy8gRml4ZXMgaXNzdWUgIzEwNDIgLT4gUmVsYXRpdmUgcGF0aHMgd2VyZSBkZXRlY3RlZCBhbmQgYWRkZWQgYXMgc3ltbGlua3NcbiAgICAgICAgLy8gKGh0dHBzOi8vZ2l0aHViLmNvbS9wYXVsbWlsbHIvY2hva2lkYXIvYmxvYi9lMTc1M2RkYmM5NTcxYmRjMzNiNGE0YWYxNzJkNTJjYjZlNjExYzEwL2xpYi9ub2RlZnMtaGFuZGxlci5qcyNMNjEyKSxcbiAgICAgICAgLy8gYnV0IG5ldmVyIHJlbW92ZWQgZnJvbSB0aGUgbWFwIGluIGNhc2UgdGhlIHBhdGggd2FzIGRlbGV0ZWQuXG4gICAgICAgIC8vIFRoaXMgbGVhZHMgdG8gYW4gaW5jb3JyZWN0IHN0YXRlIGlmIHRoZSBwYXRoIHdhcyByZWNyZWF0ZWQ6XG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9wYXVsbWlsbHIvY2hva2lkYXIvYmxvYi9lMTc1M2RkYmM5NTcxYmRjMzNiNGE0YWYxNzJkNTJjYjZlNjExYzEwL2xpYi9ub2RlZnMtaGFuZGxlci5qcyNMNTUzXG4gICAgICAgIGlmICh0aGlzLl9zeW1saW5rUGF0aHMuaGFzKGZ1bGxQYXRoKSkge1xuICAgICAgICAgICAgdGhpcy5fc3ltbGlua1BhdGhzLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgd2Ugd2FpdCBmb3IgdGhpcyBmaWxlIHRvIGJlIGZ1bGx5IHdyaXR0ZW4sIGNhbmNlbCB0aGUgd2FpdC5cbiAgICAgICAgbGV0IHJlbFBhdGggPSBwYXRoO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmN3ZClcbiAgICAgICAgICAgIHJlbFBhdGggPSBzeXNQYXRoLnJlbGF0aXZlKHRoaXMub3B0aW9ucy5jd2QsIHBhdGgpO1xuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmF3YWl0V3JpdGVGaW5pc2ggJiYgdGhpcy5fcGVuZGluZ1dyaXRlcy5oYXMocmVsUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGV2ZW50ID0gdGhpcy5fcGVuZGluZ1dyaXRlcy5nZXQocmVsUGF0aCkuY2FuY2VsV2FpdCgpO1xuICAgICAgICAgICAgaWYgKGV2ZW50ID09PSBFVi5BREQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoZSBFbnRyeSB3aWxsIGVpdGhlciBiZSBhIGRpcmVjdG9yeSB0aGF0IGp1c3QgZ290IHJlbW92ZWRcbiAgICAgICAgLy8gb3IgYSBib2d1cyBlbnRyeSB0byBhIGZpbGUsIGluIGVpdGhlciBjYXNlIHdlIGhhdmUgdG8gcmVtb3ZlIGl0XG4gICAgICAgIHRoaXMuX3dhdGNoZWQuZGVsZXRlKHBhdGgpO1xuICAgICAgICB0aGlzLl93YXRjaGVkLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgIGNvbnN0IGV2ZW50TmFtZSA9IGlzRGlyZWN0b3J5ID8gRVYuVU5MSU5LX0RJUiA6IEVWLlVOTElOSztcbiAgICAgICAgaWYgKHdhc1RyYWNrZWQgJiYgIXRoaXMuX2lzSWdub3JlZChwYXRoKSlcbiAgICAgICAgICAgIHRoaXMuX2VtaXQoZXZlbnROYW1lLCBwYXRoKTtcbiAgICAgICAgLy8gQXZvaWQgY29uZmxpY3RzIGlmIHdlIGxhdGVyIGNyZWF0ZSBhbm90aGVyIGZpbGUgd2l0aCB0aGUgc2FtZSBuYW1lXG4gICAgICAgIHRoaXMuX2Nsb3NlUGF0aChwYXRoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIGFsbCB3YXRjaGVycyBmb3IgYSBwYXRoXG4gICAgICovXG4gICAgX2Nsb3NlUGF0aChwYXRoKSB7XG4gICAgICAgIHRoaXMuX2Nsb3NlRmlsZShwYXRoKTtcbiAgICAgICAgY29uc3QgZGlyID0gc3lzUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgICB0aGlzLl9nZXRXYXRjaGVkRGlyKGRpcikucmVtb3ZlKHN5c1BhdGguYmFzZW5hbWUocGF0aCkpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZXMgb25seSBmaWxlLXNwZWNpZmljIHdhdGNoZXJzXG4gICAgICovXG4gICAgX2Nsb3NlRmlsZShwYXRoKSB7XG4gICAgICAgIGNvbnN0IGNsb3NlcnMgPSB0aGlzLl9jbG9zZXJzLmdldChwYXRoKTtcbiAgICAgICAgaWYgKCFjbG9zZXJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjbG9zZXJzLmZvckVhY2goKGNsb3NlcikgPT4gY2xvc2VyKCkpO1xuICAgICAgICB0aGlzLl9jbG9zZXJzLmRlbGV0ZShwYXRoKTtcbiAgICB9XG4gICAgX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKSB7XG4gICAgICAgIGlmICghY2xvc2VyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbGlzdCA9IHRoaXMuX2Nsb3NlcnMuZ2V0KHBhdGgpO1xuICAgICAgICBpZiAoIWxpc3QpIHtcbiAgICAgICAgICAgIGxpc3QgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlcnMuc2V0KHBhdGgsIGxpc3QpO1xuICAgICAgICB9XG4gICAgICAgIGxpc3QucHVzaChjbG9zZXIpO1xuICAgIH1cbiAgICBfcmVhZGRpcnAocm9vdCwgb3B0cykge1xuICAgICAgICBpZiAodGhpcy5jbG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IHR5cGU6IEVWLkFMTCwgYWx3YXlzU3RhdDogdHJ1ZSwgbHN0YXQ6IHRydWUsIC4uLm9wdHMsIGRlcHRoOiAwIH07XG4gICAgICAgIGxldCBzdHJlYW0gPSByZWFkZGlycChyb290LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtcy5hZGQoc3RyZWFtKTtcbiAgICAgICAgc3RyZWFtLm9uY2UoU1RSX0NMT1NFLCAoKSA9PiB7XG4gICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0ub25jZShTVFJfRU5ELCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3RyZWFtcy5kZWxldGUoc3RyZWFtKTtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gc3RyZWFtO1xuICAgIH1cbn1cbi8qKlxuICogSW5zdGFudGlhdGVzIHdhdGNoZXIgd2l0aCBwYXRocyB0byBiZSB0cmFja2VkLlxuICogQHBhcmFtIHBhdGhzIGZpbGUgLyBkaXJlY3RvcnkgcGF0aHNcbiAqIEBwYXJhbSBvcHRpb25zIG9wdHMsIHN1Y2ggYXMgYGF0b21pY2AsIGBhd2FpdFdyaXRlRmluaXNoYCwgYGlnbm9yZWRgLCBhbmQgb3RoZXJzXG4gKiBAcmV0dXJucyBhbiBpbnN0YW5jZSBvZiBGU1dhdGNoZXIgZm9yIGNoYWluaW5nLlxuICogQGV4YW1wbGVcbiAqIGNvbnN0IHdhdGNoZXIgPSB3YXRjaCgnLicpLm9uKCdhbGwnLCAoZXZlbnQsIHBhdGgpID0+IHsgY29uc29sZS5sb2coZXZlbnQsIHBhdGgpOyB9KTtcbiAqIHdhdGNoKCcuJywgeyBhdG9taWM6IHRydWUsIGF3YWl0V3JpdGVGaW5pc2g6IHRydWUsIGlnbm9yZWQ6IChmLCBzdGF0cykgPT4gc3RhdHM/LmlzRmlsZSgpICYmICFmLmVuZHNXaXRoKCcuanMnKSB9KVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2F0Y2gocGF0aHMsIG9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IHdhdGNoZXIgPSBuZXcgRlNXYXRjaGVyKG9wdGlvbnMpO1xuICAgIHdhdGNoZXIuYWRkKHBhdGhzKTtcbiAgICByZXR1cm4gd2F0Y2hlcjtcbn1cbmV4cG9ydCBkZWZhdWx0IHsgd2F0Y2gsIEZTV2F0Y2hlciB9O1xuIiwgImltcG9ydCB7IHN0YXQsIGxzdGF0LCByZWFkZGlyLCByZWFscGF0aCB9IGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgUmVhZGFibGUgfSBmcm9tICdub2RlOnN0cmVhbSc7XG5pbXBvcnQgeyByZXNvbHZlIGFzIHByZXNvbHZlLCByZWxhdGl2ZSBhcyBwcmVsYXRpdmUsIGpvaW4gYXMgcGpvaW4sIHNlcCBhcyBwc2VwIH0gZnJvbSAnbm9kZTpwYXRoJztcbmV4cG9ydCBjb25zdCBFbnRyeVR5cGVzID0ge1xuICAgIEZJTEVfVFlQRTogJ2ZpbGVzJyxcbiAgICBESVJfVFlQRTogJ2RpcmVjdG9yaWVzJyxcbiAgICBGSUxFX0RJUl9UWVBFOiAnZmlsZXNfZGlyZWN0b3JpZXMnLFxuICAgIEVWRVJZVEhJTkdfVFlQRTogJ2FsbCcsXG59O1xuY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgcm9vdDogJy4nLFxuICAgIGZpbGVGaWx0ZXI6IChfZW50cnlJbmZvKSA9PiB0cnVlLFxuICAgIGRpcmVjdG9yeUZpbHRlcjogKF9lbnRyeUluZm8pID0+IHRydWUsXG4gICAgdHlwZTogRW50cnlUeXBlcy5GSUxFX1RZUEUsXG4gICAgbHN0YXQ6IGZhbHNlLFxuICAgIGRlcHRoOiAyMTQ3NDgzNjQ4LFxuICAgIGFsd2F5c1N0YXQ6IGZhbHNlLFxuICAgIGhpZ2hXYXRlck1hcms6IDQwOTYsXG59O1xuT2JqZWN0LmZyZWV6ZShkZWZhdWx0T3B0aW9ucyk7XG5jb25zdCBSRUNVUlNJVkVfRVJST1JfQ09ERSA9ICdSRUFERElSUF9SRUNVUlNJVkVfRVJST1InO1xuY29uc3QgTk9STUFMX0ZMT1dfRVJST1JTID0gbmV3IFNldChbJ0VOT0VOVCcsICdFUEVSTScsICdFQUNDRVMnLCAnRUxPT1AnLCBSRUNVUlNJVkVfRVJST1JfQ09ERV0pO1xuY29uc3QgQUxMX1RZUEVTID0gW1xuICAgIEVudHJ5VHlwZXMuRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuICAgIEVudHJ5VHlwZXMuRklMRV9UWVBFLFxuXTtcbmNvbnN0IERJUl9UWVBFUyA9IG5ldyBTZXQoW1xuICAgIEVudHJ5VHlwZXMuRElSX1RZUEUsXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuXSk7XG5jb25zdCBGSUxFX1RZUEVTID0gbmV3IFNldChbXG4gICAgRW50cnlUeXBlcy5FVkVSWVRISU5HX1RZUEUsXG4gICAgRW50cnlUeXBlcy5GSUxFX0RJUl9UWVBFLFxuICAgIEVudHJ5VHlwZXMuRklMRV9UWVBFLFxuXSk7XG5jb25zdCBpc05vcm1hbEZsb3dFcnJvciA9IChlcnJvcikgPT4gTk9STUFMX0ZMT1dfRVJST1JTLmhhcyhlcnJvci5jb2RlKTtcbmNvbnN0IHdhbnRCaWdpbnRGc1N0YXRzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJztcbmNvbnN0IGVtcHR5Rm4gPSAoX2VudHJ5SW5mbykgPT4gdHJ1ZTtcbmNvbnN0IG5vcm1hbGl6ZUZpbHRlciA9IChmaWx0ZXIpID0+IHtcbiAgICBpZiAoZmlsdGVyID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBlbXB0eUZuO1xuICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKVxuICAgICAgICByZXR1cm4gZmlsdGVyO1xuICAgIGlmICh0eXBlb2YgZmlsdGVyID09PSAnc3RyaW5nJykge1xuICAgICAgICBjb25zdCBmbCA9IGZpbHRlci50cmltKCk7XG4gICAgICAgIHJldHVybiAoZW50cnkpID0+IGVudHJ5LmJhc2VuYW1lID09PSBmbDtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZmlsdGVyKSkge1xuICAgICAgICBjb25zdCB0ckl0ZW1zID0gZmlsdGVyLm1hcCgoaXRlbSkgPT4gaXRlbS50cmltKCkpO1xuICAgICAgICByZXR1cm4gKGVudHJ5KSA9PiB0ckl0ZW1zLnNvbWUoKGYpID0+IGVudHJ5LmJhc2VuYW1lID09PSBmKTtcbiAgICB9XG4gICAgcmV0dXJuIGVtcHR5Rm47XG59O1xuLyoqIFJlYWRhYmxlIHJlYWRkaXIgc3RyZWFtLCBlbWl0dGluZyBuZXcgZmlsZXMgYXMgdGhleSdyZSBiZWluZyBsaXN0ZWQuICovXG5leHBvcnQgY2xhc3MgUmVhZGRpcnBTdHJlYW0gZXh0ZW5kcyBSZWFkYWJsZSB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucyA9IHt9KSB7XG4gICAgICAgIHN1cGVyKHtcbiAgICAgICAgICAgIG9iamVjdE1vZGU6IHRydWUsXG4gICAgICAgICAgICBhdXRvRGVzdHJveTogdHJ1ZSxcbiAgICAgICAgICAgIGhpZ2hXYXRlck1hcms6IG9wdGlvbnMuaGlnaFdhdGVyTWFyayxcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB7IC4uLmRlZmF1bHRPcHRpb25zLCAuLi5vcHRpb25zIH07XG4gICAgICAgIGNvbnN0IHsgcm9vdCwgdHlwZSB9ID0gb3B0cztcbiAgICAgICAgdGhpcy5fZmlsZUZpbHRlciA9IG5vcm1hbGl6ZUZpbHRlcihvcHRzLmZpbGVGaWx0ZXIpO1xuICAgICAgICB0aGlzLl9kaXJlY3RvcnlGaWx0ZXIgPSBub3JtYWxpemVGaWx0ZXIob3B0cy5kaXJlY3RvcnlGaWx0ZXIpO1xuICAgICAgICBjb25zdCBzdGF0TWV0aG9kID0gb3B0cy5sc3RhdCA/IGxzdGF0IDogc3RhdDtcbiAgICAgICAgLy8gVXNlIGJpZ2ludCBzdGF0cyBpZiBpdCdzIHdpbmRvd3MgYW5kIHN0YXQoKSBzdXBwb3J0cyBvcHRpb25zIChub2RlIDEwKykuXG4gICAgICAgIGlmICh3YW50QmlnaW50RnNTdGF0cykge1xuICAgICAgICAgICAgdGhpcy5fc3RhdCA9IChwYXRoKSA9PiBzdGF0TWV0aG9kKHBhdGgsIHsgYmlnaW50OiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc3RhdCA9IHN0YXRNZXRob2Q7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWF4RGVwdGggPSBvcHRzLmRlcHRoID8/IGRlZmF1bHRPcHRpb25zLmRlcHRoO1xuICAgICAgICB0aGlzLl93YW50c0RpciA9IHR5cGUgPyBESVJfVFlQRVMuaGFzKHR5cGUpIDogZmFsc2U7XG4gICAgICAgIHRoaXMuX3dhbnRzRmlsZSA9IHR5cGUgPyBGSUxFX1RZUEVTLmhhcyh0eXBlKSA6IGZhbHNlO1xuICAgICAgICB0aGlzLl93YW50c0V2ZXJ5dGhpbmcgPSB0eXBlID09PSBFbnRyeVR5cGVzLkVWRVJZVEhJTkdfVFlQRTtcbiAgICAgICAgdGhpcy5fcm9vdCA9IHByZXNvbHZlKHJvb3QpO1xuICAgICAgICB0aGlzLl9pc0RpcmVudCA9ICFvcHRzLmFsd2F5c1N0YXQ7XG4gICAgICAgIHRoaXMuX3N0YXRzUHJvcCA9IHRoaXMuX2lzRGlyZW50ID8gJ2RpcmVudCcgOiAnc3RhdHMnO1xuICAgICAgICB0aGlzLl9yZE9wdGlvbnMgPSB7IGVuY29kaW5nOiAndXRmOCcsIHdpdGhGaWxlVHlwZXM6IHRoaXMuX2lzRGlyZW50IH07XG4gICAgICAgIC8vIExhdW5jaCBzdHJlYW0gd2l0aCBvbmUgcGFyZW50LCB0aGUgcm9vdCBkaXIuXG4gICAgICAgIHRoaXMucGFyZW50cyA9IFt0aGlzLl9leHBsb3JlRGlyKHJvb3QsIDEpXTtcbiAgICAgICAgdGhpcy5yZWFkaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBhc3luYyBfcmVhZChiYXRjaCkge1xuICAgICAgICBpZiAodGhpcy5yZWFkaW5nKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnJlYWRpbmcgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgd2hpbGUgKCF0aGlzLmRlc3Ryb3llZCAmJiBiYXRjaCA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXIgPSB0aGlzLnBhcmVudDtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWwgPSBwYXIgJiYgcGFyLmZpbGVzO1xuICAgICAgICAgICAgICAgIGlmIChmaWwgJiYgZmlsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyBwYXRoLCBkZXB0aCB9ID0gcGFyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbGljZSA9IGZpbC5zcGxpY2UoMCwgYmF0Y2gpLm1hcCgoZGlyZW50KSA9PiB0aGlzLl9mb3JtYXRFbnRyeShkaXJlbnQsIHBhdGgpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXdhaXRlZCA9IGF3YWl0IFByb21pc2UuYWxsKHNsaWNlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBhd2FpdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVudHJ5KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5VHlwZSA9IGF3YWl0IHRoaXMuX2dldEVudHJ5VHlwZShlbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZW50cnlUeXBlID09PSAnZGlyZWN0b3J5JyAmJiB0aGlzLl9kaXJlY3RvcnlGaWx0ZXIoZW50cnkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlcHRoIDw9IHRoaXMuX21heERlcHRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50cy5wdXNoKHRoaXMuX2V4cGxvcmVEaXIoZW50cnkuZnVsbFBhdGgsIGRlcHRoICsgMSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2FudHNEaXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoKGVudHJ5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmF0Y2gtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICgoZW50cnlUeXBlID09PSAnZmlsZScgfHwgdGhpcy5faW5jbHVkZUFzRmlsZShlbnRyeSkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmlsZUZpbHRlcihlbnRyeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fd2FudHNGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaChlbnRyeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhdGNoLS07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnB1c2gobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IGF3YWl0IHBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZGVzdHJveWVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveShlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICB0aGlzLnJlYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhc3luYyBfZXhwbG9yZURpcihwYXRoLCBkZXB0aCkge1xuICAgICAgICBsZXQgZmlsZXM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmaWxlcyA9IGF3YWl0IHJlYWRkaXIocGF0aCwgdGhpcy5fcmRPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGZpbGVzLCBkZXB0aCwgcGF0aCB9O1xuICAgIH1cbiAgICBhc3luYyBfZm9ybWF0RW50cnkoZGlyZW50LCBwYXRoKSB7XG4gICAgICAgIGxldCBlbnRyeTtcbiAgICAgICAgY29uc3QgYmFzZW5hbWUgPSB0aGlzLl9pc0RpcmVudCA/IGRpcmVudC5uYW1lIDogZGlyZW50O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZnVsbFBhdGggPSBwcmVzb2x2ZShwam9pbihwYXRoLCBiYXNlbmFtZSkpO1xuICAgICAgICAgICAgZW50cnkgPSB7IHBhdGg6IHByZWxhdGl2ZSh0aGlzLl9yb290LCBmdWxsUGF0aCksIGZ1bGxQYXRoLCBiYXNlbmFtZSB9O1xuICAgICAgICAgICAgZW50cnlbdGhpcy5fc3RhdHNQcm9wXSA9IHRoaXMuX2lzRGlyZW50ID8gZGlyZW50IDogYXdhaXQgdGhpcy5fc3RhdChmdWxsUGF0aCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgdGhpcy5fb25FcnJvcihlcnIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBlbnRyeTtcbiAgICB9XG4gICAgX29uRXJyb3IoZXJyKSB7XG4gICAgICAgIGlmIChpc05vcm1hbEZsb3dFcnJvcihlcnIpICYmICF0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0KCd3YXJuJywgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZGVzdHJveShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGFzeW5jIF9nZXRFbnRyeVR5cGUoZW50cnkpIHtcbiAgICAgICAgLy8gZW50cnkgbWF5IGJlIHVuZGVmaW5lZCwgYmVjYXVzZSBhIHdhcm5pbmcgb3IgYW4gZXJyb3Igd2VyZSBlbWl0dGVkXG4gICAgICAgIC8vIGFuZCB0aGUgc3RhdHNQcm9wIGlzIHVuZGVmaW5lZFxuICAgICAgICBpZiAoIWVudHJ5ICYmIHRoaXMuX3N0YXRzUHJvcCBpbiBlbnRyeSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YXRzID0gZW50cnlbdGhpcy5fc3RhdHNQcm9wXTtcbiAgICAgICAgaWYgKHN0YXRzLmlzRmlsZSgpKVxuICAgICAgICAgICAgcmV0dXJuICdmaWxlJztcbiAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpXG4gICAgICAgICAgICByZXR1cm4gJ2RpcmVjdG9yeSc7XG4gICAgICAgIGlmIChzdGF0cyAmJiBzdGF0cy5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgICAgICAgICBjb25zdCBmdWxsID0gZW50cnkuZnVsbFBhdGg7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVudHJ5UmVhbFBhdGggPSBhd2FpdCByZWFscGF0aChmdWxsKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRyeVJlYWxQYXRoU3RhdHMgPSBhd2FpdCBsc3RhdChlbnRyeVJlYWxQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAoZW50cnlSZWFsUGF0aFN0YXRzLmlzRmlsZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnZmlsZSc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlbnRyeVJlYWxQYXRoU3RhdHMuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZW4gPSBlbnRyeVJlYWxQYXRoLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZ1bGwuc3RhcnRzV2l0aChlbnRyeVJlYWxQYXRoKSAmJiBmdWxsLnN1YnN0cihsZW4sIDEpID09PSBwc2VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWN1cnNpdmVFcnJvciA9IG5ldyBFcnJvcihgQ2lyY3VsYXIgc3ltbGluayBkZXRlY3RlZDogXCIke2Z1bGx9XCIgcG9pbnRzIHRvIFwiJHtlbnRyeVJlYWxQYXRofVwiYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICByZWN1cnNpdmVFcnJvci5jb2RlID0gUkVDVVJTSVZFX0VSUk9SX0NPREU7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fb25FcnJvcihyZWN1cnNpdmVFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICdkaXJlY3RvcnknO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfaW5jbHVkZUFzRmlsZShlbnRyeSkge1xuICAgICAgICBjb25zdCBzdGF0cyA9IGVudHJ5ICYmIGVudHJ5W3RoaXMuX3N0YXRzUHJvcF07XG4gICAgICAgIHJldHVybiBzdGF0cyAmJiB0aGlzLl93YW50c0V2ZXJ5dGhpbmcgJiYgIXN0YXRzLmlzRGlyZWN0b3J5KCk7XG4gICAgfVxufVxuLyoqXG4gKiBTdHJlYW1pbmcgdmVyc2lvbjogUmVhZHMgYWxsIGZpbGVzIGFuZCBkaXJlY3RvcmllcyBpbiBnaXZlbiByb290IHJlY3Vyc2l2ZWx5LlxuICogQ29uc3VtZXMgfmNvbnN0YW50IHNtYWxsIGFtb3VudCBvZiBSQU0uXG4gKiBAcGFyYW0gcm9vdCBSb290IGRpcmVjdG9yeVxuICogQHBhcmFtIG9wdGlvbnMgT3B0aW9ucyB0byBzcGVjaWZ5IHJvb3QgKHN0YXJ0IGRpcmVjdG9yeSksIGZpbHRlcnMgYW5kIHJlY3Vyc2lvbiBkZXB0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZGRpcnAocm9vdCwgb3B0aW9ucyA9IHt9KSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGxldCB0eXBlID0gb3B0aW9ucy5lbnRyeVR5cGUgfHwgb3B0aW9ucy50eXBlO1xuICAgIGlmICh0eXBlID09PSAnYm90aCcpXG4gICAgICAgIHR5cGUgPSBFbnRyeVR5cGVzLkZJTEVfRElSX1RZUEU7IC8vIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgaWYgKHR5cGUpXG4gICAgICAgIG9wdGlvbnMudHlwZSA9IHR5cGU7XG4gICAgaWYgKCFyb290KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncmVhZGRpcnA6IHJvb3QgYXJndW1lbnQgaXMgcmVxdWlyZWQuIFVzYWdlOiByZWFkZGlycChyb290LCBvcHRpb25zKScpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygcm9vdCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncmVhZGRpcnA6IHJvb3QgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZy4gVXNhZ2U6IHJlYWRkaXJwKHJvb3QsIG9wdGlvbnMpJyk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgJiYgIUFMTF9UWVBFUy5pbmNsdWRlcyh0eXBlKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHJlYWRkaXJwOiBJbnZhbGlkIHR5cGUgcGFzc2VkLiBVc2Ugb25lIG9mICR7QUxMX1RZUEVTLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICAgIG9wdGlvbnMucm9vdCA9IHJvb3Q7XG4gICAgcmV0dXJuIG5ldyBSZWFkZGlycFN0cmVhbShvcHRpb25zKTtcbn1cbi8qKlxuICogUHJvbWlzZSB2ZXJzaW9uOiBSZWFkcyBhbGwgZmlsZXMgYW5kIGRpcmVjdG9yaWVzIGluIGdpdmVuIHJvb3QgcmVjdXJzaXZlbHkuXG4gKiBDb21wYXJlZCB0byBzdHJlYW1pbmcgdmVyc2lvbiwgd2lsbCBjb25zdW1lIGEgbG90IG9mIFJBTSBlLmcuIHdoZW4gMSBtaWxsaW9uIGZpbGVzIGFyZSBsaXN0ZWQuXG4gKiBAcmV0dXJucyBhcnJheSBvZiBwYXRocyBhbmQgdGhlaXIgZW50cnkgaW5mb3NcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRkaXJwUHJvbWlzZShyb290LCBvcHRpb25zID0ge30pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlcyA9IFtdO1xuICAgICAgICByZWFkZGlycChyb290LCBvcHRpb25zKVxuICAgICAgICAgICAgLm9uKCdkYXRhJywgKGVudHJ5KSA9PiBmaWxlcy5wdXNoKGVudHJ5KSlcbiAgICAgICAgICAgIC5vbignZW5kJywgKCkgPT4gcmVzb2x2ZShmaWxlcykpXG4gICAgICAgICAgICAub24oJ2Vycm9yJywgKGVycm9yKSA9PiByZWplY3QoZXJyb3IpKTtcbiAgICB9KTtcbn1cbmV4cG9ydCBkZWZhdWx0IHJlYWRkaXJwO1xuIiwgImltcG9ydCB7IHdhdGNoRmlsZSwgdW53YXRjaEZpbGUsIHdhdGNoIGFzIGZzX3dhdGNoIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgb3Blbiwgc3RhdCwgbHN0YXQsIHJlYWxwYXRoIGFzIGZzcmVhbHBhdGggfSBmcm9tICdmcy9wcm9taXNlcyc7XG5pbXBvcnQgKiBhcyBzeXNQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZSBhcyBvc1R5cGUgfSBmcm9tICdvcyc7XG5leHBvcnQgY29uc3QgU1RSX0RBVEEgPSAnZGF0YSc7XG5leHBvcnQgY29uc3QgU1RSX0VORCA9ICdlbmQnO1xuZXhwb3J0IGNvbnN0IFNUUl9DTE9TRSA9ICdjbG9zZSc7XG5leHBvcnQgY29uc3QgRU1QVFlfRk4gPSAoKSA9PiB7IH07XG5leHBvcnQgY29uc3QgSURFTlRJVFlfRk4gPSAodmFsKSA9PiB2YWw7XG5jb25zdCBwbCA9IHByb2Nlc3MucGxhdGZvcm07XG5leHBvcnQgY29uc3QgaXNXaW5kb3dzID0gcGwgPT09ICd3aW4zMic7XG5leHBvcnQgY29uc3QgaXNNYWNvcyA9IHBsID09PSAnZGFyd2luJztcbmV4cG9ydCBjb25zdCBpc0xpbnV4ID0gcGwgPT09ICdsaW51eCc7XG5leHBvcnQgY29uc3QgaXNGcmVlQlNEID0gcGwgPT09ICdmcmVlYnNkJztcbmV4cG9ydCBjb25zdCBpc0lCTWkgPSBvc1R5cGUoKSA9PT0gJ09TNDAwJztcbmV4cG9ydCBjb25zdCBFVkVOVFMgPSB7XG4gICAgQUxMOiAnYWxsJyxcbiAgICBSRUFEWTogJ3JlYWR5JyxcbiAgICBBREQ6ICdhZGQnLFxuICAgIENIQU5HRTogJ2NoYW5nZScsXG4gICAgQUREX0RJUjogJ2FkZERpcicsXG4gICAgVU5MSU5LOiAndW5saW5rJyxcbiAgICBVTkxJTktfRElSOiAndW5saW5rRGlyJyxcbiAgICBSQVc6ICdyYXcnLFxuICAgIEVSUk9SOiAnZXJyb3InLFxufTtcbmNvbnN0IEVWID0gRVZFTlRTO1xuY29uc3QgVEhST1RUTEVfTU9ERV9XQVRDSCA9ICd3YXRjaCc7XG5jb25zdCBzdGF0TWV0aG9kcyA9IHsgbHN0YXQsIHN0YXQgfTtcbmNvbnN0IEtFWV9MSVNURU5FUlMgPSAnbGlzdGVuZXJzJztcbmNvbnN0IEtFWV9FUlIgPSAnZXJySGFuZGxlcnMnO1xuY29uc3QgS0VZX1JBVyA9ICdyYXdFbWl0dGVycyc7XG5jb25zdCBIQU5ETEVSX0tFWVMgPSBbS0VZX0xJU1RFTkVSUywgS0VZX0VSUiwgS0VZX1JBV107XG4vLyBwcmV0dGllci1pZ25vcmVcbmNvbnN0IGJpbmFyeUV4dGVuc2lvbnMgPSBuZXcgU2V0KFtcbiAgICAnM2RtJywgJzNkcycsICczZzInLCAnM2dwJywgJzd6JywgJ2EnLCAnYWFjJywgJ2FkcCcsICdhZmRlc2lnbicsICdhZnBob3RvJywgJ2FmcHViJywgJ2FpJyxcbiAgICAnYWlmJywgJ2FpZmYnLCAnYWx6JywgJ2FwZScsICdhcGsnLCAnYXBwaW1hZ2UnLCAnYXInLCAnYXJqJywgJ2FzZicsICdhdScsICdhdmknLFxuICAgICdiYWsnLCAnYmFtbCcsICdiaCcsICdiaW4nLCAnYmsnLCAnYm1wJywgJ2J0aWYnLCAnYnoyJywgJ2J6aXAyJyxcbiAgICAnY2FiJywgJ2NhZicsICdjZ20nLCAnY2xhc3MnLCAnY214JywgJ2NwaW8nLCAnY3IyJywgJ2N1cicsICdkYXQnLCAnZGNtJywgJ2RlYicsICdkZXgnLCAnZGp2dScsXG4gICAgJ2RsbCcsICdkbWcnLCAnZG5nJywgJ2RvYycsICdkb2NtJywgJ2RvY3gnLCAnZG90JywgJ2RvdG0nLCAnZHJhJywgJ0RTX1N0b3JlJywgJ2RzaycsICdkdHMnLFxuICAgICdkdHNoZCcsICdkdmInLCAnZHdnJywgJ2R4ZicsXG4gICAgJ2VjZWxwNDgwMCcsICdlY2VscDc0NzAnLCAnZWNlbHA5NjAwJywgJ2VnZycsICdlb2wnLCAnZW90JywgJ2VwdWInLCAnZXhlJyxcbiAgICAnZjR2JywgJ2ZicycsICdmaCcsICdmbGEnLCAnZmxhYycsICdmbGF0cGFrJywgJ2ZsaScsICdmbHYnLCAnZnB4JywgJ2ZzdCcsICdmdnQnLFxuICAgICdnMycsICdnaCcsICdnaWYnLCAnZ3JhZmZsZScsICdneicsICdnemlwJyxcbiAgICAnaDI2MScsICdoMjYzJywgJ2gyNjQnLCAnaWNucycsICdpY28nLCAnaWVmJywgJ2ltZycsICdpcGEnLCAnaXNvJyxcbiAgICAnamFyJywgJ2pwZWcnLCAnanBnJywgJ2pwZ3YnLCAnanBtJywgJ2p4cicsICdrZXknLCAna3R4JyxcbiAgICAnbGhhJywgJ2xpYicsICdsdnAnLCAnbHonLCAnbHpoJywgJ2x6bWEnLCAnbHpvJyxcbiAgICAnbTN1JywgJ200YScsICdtNHYnLCAnbWFyJywgJ21kaScsICdtaHQnLCAnbWlkJywgJ21pZGknLCAnbWoyJywgJ21rYScsICdta3YnLCAnbW1yJywgJ21uZycsXG4gICAgJ21vYmknLCAnbW92JywgJ21vdmllJywgJ21wMycsXG4gICAgJ21wNCcsICdtcDRhJywgJ21wZWcnLCAnbXBnJywgJ21wZ2EnLCAnbXh1JyxcbiAgICAnbmVmJywgJ25weCcsICdudW1iZXJzJywgJ251cGtnJyxcbiAgICAnbycsICdvZHAnLCAnb2RzJywgJ29kdCcsICdvZ2EnLCAnb2dnJywgJ29ndicsICdvdGYnLCAnb3R0JyxcbiAgICAncGFnZXMnLCAncGJtJywgJ3BjeCcsICdwZGInLCAncGRmJywgJ3BlYScsICdwZ20nLCAncGljJywgJ3BuZycsICdwbm0nLCAncG90JywgJ3BvdG0nLFxuICAgICdwb3R4JywgJ3BwYScsICdwcGFtJyxcbiAgICAncHBtJywgJ3BwcycsICdwcHNtJywgJ3Bwc3gnLCAncHB0JywgJ3BwdG0nLCAncHB0eCcsICdwc2QnLCAncHlhJywgJ3B5YycsICdweW8nLCAncHl2JyxcbiAgICAncXQnLFxuICAgICdyYXInLCAncmFzJywgJ3JhdycsICdyZXNvdXJjZXMnLCAncmdiJywgJ3JpcCcsICdybGMnLCAncm1mJywgJ3JtdmInLCAncnBtJywgJ3J0ZicsICdyeicsXG4gICAgJ3MzbScsICdzN3onLCAnc2NwdCcsICdzZ2knLCAnc2hhcicsICdzbmFwJywgJ3NpbCcsICdza2V0Y2gnLCAnc2xrJywgJ3NtdicsICdzbmsnLCAnc28nLFxuICAgICdzdGwnLCAnc3VvJywgJ3N1YicsICdzd2YnLFxuICAgICd0YXInLCAndGJ6JywgJ3RiejInLCAndGdhJywgJ3RneicsICd0aG14JywgJ3RpZicsICd0aWZmJywgJ3RseicsICd0dGMnLCAndHRmJywgJ3R4eicsXG4gICAgJ3VkZicsICd1dmgnLCAndXZpJywgJ3V2bScsICd1dnAnLCAndXZzJywgJ3V2dScsXG4gICAgJ3ZpdicsICd2b2InLFxuICAgICd3YXInLCAnd2F2JywgJ3dheCcsICd3Ym1wJywgJ3dkcCcsICd3ZWJhJywgJ3dlYm0nLCAnd2VicCcsICd3aGwnLCAnd2ltJywgJ3dtJywgJ3dtYScsXG4gICAgJ3dtdicsICd3bXgnLCAnd29mZicsICd3b2ZmMicsICd3cm0nLCAnd3Z4JyxcbiAgICAneGJtJywgJ3hpZicsICd4bGEnLCAneGxhbScsICd4bHMnLCAneGxzYicsICd4bHNtJywgJ3hsc3gnLCAneGx0JywgJ3hsdG0nLCAneGx0eCcsICd4bScsXG4gICAgJ3htaW5kJywgJ3hwaScsICd4cG0nLCAneHdkJywgJ3h6JyxcbiAgICAneicsICd6aXAnLCAnemlweCcsXG5dKTtcbmNvbnN0IGlzQmluYXJ5UGF0aCA9IChmaWxlUGF0aCkgPT4gYmluYXJ5RXh0ZW5zaW9ucy5oYXMoc3lzUGF0aC5leHRuYW1lKGZpbGVQYXRoKS5zbGljZSgxKS50b0xvd2VyQ2FzZSgpKTtcbi8vIFRPRE86IGVtaXQgZXJyb3JzIHByb3Blcmx5LiBFeGFtcGxlOiBFTUZJTEUgb24gTWFjb3MuXG5jb25zdCBmb3JlYWNoID0gKHZhbCwgZm4pID0+IHtcbiAgICBpZiAodmFsIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgICAgIHZhbC5mb3JFYWNoKGZuKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZuKHZhbCk7XG4gICAgfVxufTtcbmNvbnN0IGFkZEFuZENvbnZlcnQgPSAobWFpbiwgcHJvcCwgaXRlbSkgPT4ge1xuICAgIGxldCBjb250YWluZXIgPSBtYWluW3Byb3BdO1xuICAgIGlmICghKGNvbnRhaW5lciBpbnN0YW5jZW9mIFNldCkpIHtcbiAgICAgICAgbWFpbltwcm9wXSA9IGNvbnRhaW5lciA9IG5ldyBTZXQoW2NvbnRhaW5lcl0pO1xuICAgIH1cbiAgICBjb250YWluZXIuYWRkKGl0ZW0pO1xufTtcbmNvbnN0IGNsZWFySXRlbSA9IChjb250KSA9PiAoa2V5KSA9PiB7XG4gICAgY29uc3Qgc2V0ID0gY29udFtrZXldO1xuICAgIGlmIChzZXQgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgc2V0LmNsZWFyKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBkZWxldGUgY29udFtrZXldO1xuICAgIH1cbn07XG5jb25zdCBkZWxGcm9tU2V0ID0gKG1haW4sIHByb3AsIGl0ZW0pID0+IHtcbiAgICBjb25zdCBjb250YWluZXIgPSBtYWluW3Byb3BdO1xuICAgIGlmIChjb250YWluZXIgaW5zdGFuY2VvZiBTZXQpIHtcbiAgICAgICAgY29udGFpbmVyLmRlbGV0ZShpdGVtKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoY29udGFpbmVyID09PSBpdGVtKSB7XG4gICAgICAgIGRlbGV0ZSBtYWluW3Byb3BdO1xuICAgIH1cbn07XG5jb25zdCBpc0VtcHR5U2V0ID0gKHZhbCkgPT4gKHZhbCBpbnN0YW5jZW9mIFNldCA/IHZhbC5zaXplID09PSAwIDogIXZhbCk7XG5jb25zdCBGc1dhdGNoSW5zdGFuY2VzID0gbmV3IE1hcCgpO1xuLyoqXG4gKiBJbnN0YW50aWF0ZXMgdGhlIGZzX3dhdGNoIGludGVyZmFjZVxuICogQHBhcmFtIHBhdGggdG8gYmUgd2F0Y2hlZFxuICogQHBhcmFtIG9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIGZzX3dhdGNoXG4gKiBAcGFyYW0gbGlzdGVuZXIgbWFpbiBldmVudCBoYW5kbGVyXG4gKiBAcGFyYW0gZXJySGFuZGxlciBlbWl0cyBpbmZvIGFib3V0IGVycm9yc1xuICogQHBhcmFtIGVtaXRSYXcgZW1pdHMgcmF3IGV2ZW50IGRhdGFcbiAqIEByZXR1cm5zIHtOYXRpdmVGc1dhdGNoZXJ9XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUZzV2F0Y2hJbnN0YW5jZShwYXRoLCBvcHRpb25zLCBsaXN0ZW5lciwgZXJySGFuZGxlciwgZW1pdFJhdykge1xuICAgIGNvbnN0IGhhbmRsZUV2ZW50ID0gKHJhd0V2ZW50LCBldlBhdGgpID0+IHtcbiAgICAgICAgbGlzdGVuZXIocGF0aCk7XG4gICAgICAgIGVtaXRSYXcocmF3RXZlbnQsIGV2UGF0aCwgeyB3YXRjaGVkUGF0aDogcGF0aCB9KTtcbiAgICAgICAgLy8gZW1pdCBiYXNlZCBvbiBldmVudHMgb2NjdXJyaW5nIGZvciBmaWxlcyBmcm9tIGEgZGlyZWN0b3J5J3Mgd2F0Y2hlciBpblxuICAgICAgICAvLyBjYXNlIHRoZSBmaWxlJ3Mgd2F0Y2hlciBtaXNzZXMgaXQgKGFuZCByZWx5IG9uIHRocm90dGxpbmcgdG8gZGUtZHVwZSlcbiAgICAgICAgaWYgKGV2UGF0aCAmJiBwYXRoICE9PSBldlBhdGgpIHtcbiAgICAgICAgICAgIGZzV2F0Y2hCcm9hZGNhc3Qoc3lzUGF0aC5yZXNvbHZlKHBhdGgsIGV2UGF0aCksIEtFWV9MSVNURU5FUlMsIHN5c1BhdGguam9pbihwYXRoLCBldlBhdGgpKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGZzX3dhdGNoKHBhdGgsIHtcbiAgICAgICAgICAgIHBlcnNpc3RlbnQ6IG9wdGlvbnMucGVyc2lzdGVudCxcbiAgICAgICAgfSwgaGFuZGxlRXZlbnQpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJySGFuZGxlcihlcnJvcik7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxufVxuLyoqXG4gKiBIZWxwZXIgZm9yIHBhc3NpbmcgZnNfd2F0Y2ggZXZlbnQgZGF0YSB0byBhIGNvbGxlY3Rpb24gb2YgbGlzdGVuZXJzXG4gKiBAcGFyYW0gZnVsbFBhdGggYWJzb2x1dGUgcGF0aCBib3VuZCB0byBmc193YXRjaCBpbnN0YW5jZVxuICovXG5jb25zdCBmc1dhdGNoQnJvYWRjYXN0ID0gKGZ1bGxQYXRoLCBsaXN0ZW5lclR5cGUsIHZhbDEsIHZhbDIsIHZhbDMpID0+IHtcbiAgICBjb25zdCBjb250ID0gRnNXYXRjaEluc3RhbmNlcy5nZXQoZnVsbFBhdGgpO1xuICAgIGlmICghY29udClcbiAgICAgICAgcmV0dXJuO1xuICAgIGZvcmVhY2goY29udFtsaXN0ZW5lclR5cGVdLCAobGlzdGVuZXIpID0+IHtcbiAgICAgICAgbGlzdGVuZXIodmFsMSwgdmFsMiwgdmFsMyk7XG4gICAgfSk7XG59O1xuLyoqXG4gKiBJbnN0YW50aWF0ZXMgdGhlIGZzX3dhdGNoIGludGVyZmFjZSBvciBiaW5kcyBsaXN0ZW5lcnNcbiAqIHRvIGFuIGV4aXN0aW5nIG9uZSBjb3ZlcmluZyB0aGUgc2FtZSBmaWxlIHN5c3RlbSBlbnRyeVxuICogQHBhcmFtIHBhdGhcbiAqIEBwYXJhbSBmdWxsUGF0aCBhYnNvbHV0ZSBwYXRoXG4gKiBAcGFyYW0gb3B0aW9ucyB0byBiZSBwYXNzZWQgdG8gZnNfd2F0Y2hcbiAqIEBwYXJhbSBoYW5kbGVycyBjb250YWluZXIgZm9yIGV2ZW50IGxpc3RlbmVyIGZ1bmN0aW9uc1xuICovXG5jb25zdCBzZXRGc1dhdGNoTGlzdGVuZXIgPSAocGF0aCwgZnVsbFBhdGgsIG9wdGlvbnMsIGhhbmRsZXJzKSA9PiB7XG4gICAgY29uc3QgeyBsaXN0ZW5lciwgZXJySGFuZGxlciwgcmF3RW1pdHRlciB9ID0gaGFuZGxlcnM7XG4gICAgbGV0IGNvbnQgPSBGc1dhdGNoSW5zdGFuY2VzLmdldChmdWxsUGF0aCk7XG4gICAgbGV0IHdhdGNoZXI7XG4gICAgaWYgKCFvcHRpb25zLnBlcnNpc3RlbnQpIHtcbiAgICAgICAgd2F0Y2hlciA9IGNyZWF0ZUZzV2F0Y2hJbnN0YW5jZShwYXRoLCBvcHRpb25zLCBsaXN0ZW5lciwgZXJySGFuZGxlciwgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmICghd2F0Y2hlcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgcmV0dXJuIHdhdGNoZXIuY2xvc2UuYmluZCh3YXRjaGVyKTtcbiAgICB9XG4gICAgaWYgKGNvbnQpIHtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGFkZEFuZENvbnZlcnQoY29udCwgS0VZX0VSUiwgZXJySGFuZGxlcik7XG4gICAgICAgIGFkZEFuZENvbnZlcnQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB3YXRjaGVyID0gY3JlYXRlRnNXYXRjaEluc3RhbmNlKHBhdGgsIG9wdGlvbnMsIGZzV2F0Y2hCcm9hZGNhc3QuYmluZChudWxsLCBmdWxsUGF0aCwgS0VZX0xJU1RFTkVSUyksIGVyckhhbmRsZXIsIC8vIG5vIG5lZWQgdG8gdXNlIGJyb2FkY2FzdCBoZXJlXG4gICAgICAgIGZzV2F0Y2hCcm9hZGNhc3QuYmluZChudWxsLCBmdWxsUGF0aCwgS0VZX1JBVykpO1xuICAgICAgICBpZiAoIXdhdGNoZXIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHdhdGNoZXIub24oRVYuRVJST1IsIGFzeW5jIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgY29uc3QgYnJvYWRjYXN0RXJyID0gZnNXYXRjaEJyb2FkY2FzdC5iaW5kKG51bGwsIGZ1bGxQYXRoLCBLRVlfRVJSKTtcbiAgICAgICAgICAgIGlmIChjb250KVxuICAgICAgICAgICAgICAgIGNvbnQud2F0Y2hlclVudXNhYmxlID0gdHJ1ZTsgLy8gZG9jdW1lbnRlZCBzaW5jZSBOb2RlIDEwLjQuMVxuICAgICAgICAgICAgLy8gV29ya2Fyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2pveWVudC9ub2RlL2lzc3Vlcy80MzM3XG4gICAgICAgICAgICBpZiAoaXNXaW5kb3dzICYmIGVycm9yLmNvZGUgPT09ICdFUEVSTScpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmZCA9IGF3YWl0IG9wZW4ocGF0aCwgJ3InKTtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgZmQuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJvYWRjYXN0RXJyKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAvLyBkbyBub3RoaW5nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJvYWRjYXN0RXJyKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnQgPSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnM6IGxpc3RlbmVyLFxuICAgICAgICAgICAgZXJySGFuZGxlcnM6IGVyckhhbmRsZXIsXG4gICAgICAgICAgICByYXdFbWl0dGVyczogcmF3RW1pdHRlcixcbiAgICAgICAgICAgIHdhdGNoZXIsXG4gICAgICAgIH07XG4gICAgICAgIEZzV2F0Y2hJbnN0YW5jZXMuc2V0KGZ1bGxQYXRoLCBjb250KTtcbiAgICB9XG4gICAgLy8gY29uc3QgaW5kZXggPSBjb250Lmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAvLyByZW1vdmVzIHRoaXMgaW5zdGFuY2UncyBsaXN0ZW5lcnMgYW5kIGNsb3NlcyB0aGUgdW5kZXJseWluZyBmc193YXRjaFxuICAgIC8vIGluc3RhbmNlIGlmIHRoZXJlIGFyZSBubyBtb3JlIGxpc3RlbmVycyBsZWZ0XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX0VSUiwgZXJySGFuZGxlcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmIChpc0VtcHR5U2V0KGNvbnQubGlzdGVuZXJzKSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgdG8gcHJvdGVjdCBhZ2FpbnN0IGlzc3VlIGdoLTczMC5cbiAgICAgICAgICAgIC8vIGlmIChjb250LndhdGNoZXJVbnVzYWJsZSkge1xuICAgICAgICAgICAgY29udC53YXRjaGVyLmNsb3NlKCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBGc1dhdGNoSW5zdGFuY2VzLmRlbGV0ZShmdWxsUGF0aCk7XG4gICAgICAgICAgICBIQU5ETEVSX0tFWVMuZm9yRWFjaChjbGVhckl0ZW0oY29udCkpO1xuICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgY29udC53YXRjaGVyID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgT2JqZWN0LmZyZWV6ZShjb250KTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuLy8gZnNfd2F0Y2hGaWxlIGhlbHBlcnNcbi8vIG9iamVjdCB0byBob2xkIHBlci1wcm9jZXNzIGZzX3dhdGNoRmlsZSBpbnN0YW5jZXNcbi8vIChtYXkgYmUgc2hhcmVkIGFjcm9zcyBjaG9raWRhciBGU1dhdGNoZXIgaW5zdGFuY2VzKVxuY29uc3QgRnNXYXRjaEZpbGVJbnN0YW5jZXMgPSBuZXcgTWFwKCk7XG4vKipcbiAqIEluc3RhbnRpYXRlcyB0aGUgZnNfd2F0Y2hGaWxlIGludGVyZmFjZSBvciBiaW5kcyBsaXN0ZW5lcnNcbiAqIHRvIGFuIGV4aXN0aW5nIG9uZSBjb3ZlcmluZyB0aGUgc2FtZSBmaWxlIHN5c3RlbSBlbnRyeVxuICogQHBhcmFtIHBhdGggdG8gYmUgd2F0Y2hlZFxuICogQHBhcmFtIGZ1bGxQYXRoIGFic29sdXRlIHBhdGhcbiAqIEBwYXJhbSBvcHRpb25zIG9wdGlvbnMgdG8gYmUgcGFzc2VkIHRvIGZzX3dhdGNoRmlsZVxuICogQHBhcmFtIGhhbmRsZXJzIGNvbnRhaW5lciBmb3IgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb25zXG4gKiBAcmV0dXJucyBjbG9zZXJcbiAqL1xuY29uc3Qgc2V0RnNXYXRjaEZpbGVMaXN0ZW5lciA9IChwYXRoLCBmdWxsUGF0aCwgb3B0aW9ucywgaGFuZGxlcnMpID0+IHtcbiAgICBjb25zdCB7IGxpc3RlbmVyLCByYXdFbWl0dGVyIH0gPSBoYW5kbGVycztcbiAgICBsZXQgY29udCA9IEZzV2F0Y2hGaWxlSW5zdGFuY2VzLmdldChmdWxsUGF0aCk7XG4gICAgLy8gbGV0IGxpc3RlbmVycyA9IG5ldyBTZXQoKTtcbiAgICAvLyBsZXQgcmF3RW1pdHRlcnMgPSBuZXcgU2V0KCk7XG4gICAgY29uc3QgY29wdHMgPSBjb250ICYmIGNvbnQub3B0aW9ucztcbiAgICBpZiAoY29wdHMgJiYgKGNvcHRzLnBlcnNpc3RlbnQgPCBvcHRpb25zLnBlcnNpc3RlbnQgfHwgY29wdHMuaW50ZXJ2YWwgPiBvcHRpb25zLmludGVydmFsKSkge1xuICAgICAgICAvLyBcIlVwZ3JhZGVcIiB0aGUgd2F0Y2hlciB0byBwZXJzaXN0ZW5jZSBvciBhIHF1aWNrZXIgaW50ZXJ2YWwuXG4gICAgICAgIC8vIFRoaXMgY3JlYXRlcyBzb21lIHVubGlrZWx5IGVkZ2UgY2FzZSBpc3N1ZXMgaWYgdGhlIHVzZXIgbWl4ZXNcbiAgICAgICAgLy8gc2V0dGluZ3MgaW4gYSB2ZXJ5IHdlaXJkIHdheSwgYnV0IHNvbHZpbmcgZm9yIHRob3NlIGNhc2VzXG4gICAgICAgIC8vIGRvZXNuJ3Qgc2VlbSB3b3J0aHdoaWxlIGZvciB0aGUgYWRkZWQgY29tcGxleGl0eS5cbiAgICAgICAgLy8gbGlzdGVuZXJzID0gY29udC5saXN0ZW5lcnM7XG4gICAgICAgIC8vIHJhd0VtaXR0ZXJzID0gY29udC5yYXdFbWl0dGVycztcbiAgICAgICAgdW53YXRjaEZpbGUoZnVsbFBhdGgpO1xuICAgICAgICBjb250ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBpZiAoY29udCkge1xuICAgICAgICBhZGRBbmRDb252ZXJ0KGNvbnQsIEtFWV9MSVNURU5FUlMsIGxpc3RlbmVyKTtcbiAgICAgICAgYWRkQW5kQ29udmVydChjb250LCBLRVlfUkFXLCByYXdFbWl0dGVyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIFRPRE9cbiAgICAgICAgLy8gbGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG4gICAgICAgIC8vIHJhd0VtaXR0ZXJzLmFkZChyYXdFbWl0dGVyKTtcbiAgICAgICAgY29udCA9IHtcbiAgICAgICAgICAgIGxpc3RlbmVyczogbGlzdGVuZXIsXG4gICAgICAgICAgICByYXdFbWl0dGVyczogcmF3RW1pdHRlcixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICB3YXRjaGVyOiB3YXRjaEZpbGUoZnVsbFBhdGgsIG9wdGlvbnMsIChjdXJyLCBwcmV2KSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yZWFjaChjb250LnJhd0VtaXR0ZXJzLCAocmF3RW1pdHRlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICByYXdFbWl0dGVyKEVWLkNIQU5HRSwgZnVsbFBhdGgsIHsgY3VyciwgcHJldiB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJybXRpbWUgPSBjdXJyLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnIuc2l6ZSAhPT0gcHJldi5zaXplIHx8IGN1cnJtdGltZSA+IHByZXYubXRpbWVNcyB8fCBjdXJybXRpbWUgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yZWFjaChjb250Lmxpc3RlbmVycywgKGxpc3RlbmVyKSA9PiBsaXN0ZW5lcihwYXRoLCBjdXJyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSksXG4gICAgICAgIH07XG4gICAgICAgIEZzV2F0Y2hGaWxlSW5zdGFuY2VzLnNldChmdWxsUGF0aCwgY29udCk7XG4gICAgfVxuICAgIC8vIGNvbnN0IGluZGV4ID0gY29udC5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgLy8gUmVtb3ZlcyB0aGlzIGluc3RhbmNlJ3MgbGlzdGVuZXJzIGFuZCBjbG9zZXMgdGhlIHVuZGVybHlpbmcgZnNfd2F0Y2hGaWxlXG4gICAgLy8gaW5zdGFuY2UgaWYgdGhlcmUgYXJlIG5vIG1vcmUgbGlzdGVuZXJzIGxlZnQuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgZGVsRnJvbVNldChjb250LCBLRVlfTElTVEVORVJTLCBsaXN0ZW5lcik7XG4gICAgICAgIGRlbEZyb21TZXQoY29udCwgS0VZX1JBVywgcmF3RW1pdHRlcik7XG4gICAgICAgIGlmIChpc0VtcHR5U2V0KGNvbnQubGlzdGVuZXJzKSkge1xuICAgICAgICAgICAgRnNXYXRjaEZpbGVJbnN0YW5jZXMuZGVsZXRlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIHVud2F0Y2hGaWxlKGZ1bGxQYXRoKTtcbiAgICAgICAgICAgIGNvbnQub3B0aW9ucyA9IGNvbnQud2F0Y2hlciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIE9iamVjdC5mcmVlemUoY29udCk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcbi8qKlxuICogQG1peGluXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlRnNIYW5kbGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihmc1cpIHtcbiAgICAgICAgdGhpcy5mc3cgPSBmc1c7XG4gICAgICAgIHRoaXMuX2JvdW5kSGFuZGxlRXJyb3IgPSAoZXJyb3IpID0+IGZzVy5faGFuZGxlRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXYXRjaCBmaWxlIGZvciBjaGFuZ2VzIHdpdGggZnNfd2F0Y2hGaWxlIG9yIGZzX3dhdGNoLlxuICAgICAqIEBwYXJhbSBwYXRoIHRvIGZpbGUgb3IgZGlyXG4gICAgICogQHBhcmFtIGxpc3RlbmVyIG9uIGZzIGNoYW5nZVxuICAgICAqIEByZXR1cm5zIGNsb3NlciBmb3IgdGhlIHdhdGNoZXIgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBfd2F0Y2hXaXRoTm9kZUZzKHBhdGgsIGxpc3RlbmVyKSB7XG4gICAgICAgIGNvbnN0IG9wdHMgPSB0aGlzLmZzdy5vcHRpb25zO1xuICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBzeXNQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICAgIGNvbnN0IGJhc2VuYW1lID0gc3lzUGF0aC5iYXNlbmFtZShwYXRoKTtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KTtcbiAgICAgICAgcGFyZW50LmFkZChiYXNlbmFtZSk7XG4gICAgICAgIGNvbnN0IGFic29sdXRlUGF0aCA9IHN5c1BhdGgucmVzb2x2ZShwYXRoKTtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIHBlcnNpc3RlbnQ6IG9wdHMucGVyc2lzdGVudCxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKCFsaXN0ZW5lcilcbiAgICAgICAgICAgIGxpc3RlbmVyID0gRU1QVFlfRk47XG4gICAgICAgIGxldCBjbG9zZXI7XG4gICAgICAgIGlmIChvcHRzLnVzZVBvbGxpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IGVuYWJsZUJpbiA9IG9wdHMuaW50ZXJ2YWwgIT09IG9wdHMuYmluYXJ5SW50ZXJ2YWw7XG4gICAgICAgICAgICBvcHRpb25zLmludGVydmFsID0gZW5hYmxlQmluICYmIGlzQmluYXJ5UGF0aChiYXNlbmFtZSkgPyBvcHRzLmJpbmFyeUludGVydmFsIDogb3B0cy5pbnRlcnZhbDtcbiAgICAgICAgICAgIGNsb3NlciA9IHNldEZzV2F0Y2hGaWxlTGlzdGVuZXIocGF0aCwgYWJzb2x1dGVQYXRoLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIsXG4gICAgICAgICAgICAgICAgcmF3RW1pdHRlcjogdGhpcy5mc3cuX2VtaXRSYXcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNsb3NlciA9IHNldEZzV2F0Y2hMaXN0ZW5lcihwYXRoLCBhYnNvbHV0ZVBhdGgsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcixcbiAgICAgICAgICAgICAgICBlcnJIYW5kbGVyOiB0aGlzLl9ib3VuZEhhbmRsZUVycm9yLFxuICAgICAgICAgICAgICAgIHJhd0VtaXR0ZXI6IHRoaXMuZnN3Ll9lbWl0UmF3LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3NlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2F0Y2ggYSBmaWxlIGFuZCBlbWl0IGFkZCBldmVudCBpZiB3YXJyYW50ZWQuXG4gICAgICogQHJldHVybnMgY2xvc2VyIGZvciB0aGUgd2F0Y2hlciBpbnN0YW5jZVxuICAgICAqL1xuICAgIF9oYW5kbGVGaWxlKGZpbGUsIHN0YXRzLCBpbml0aWFsQWRkKSB7XG4gICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkaXJuYW1lID0gc3lzUGF0aC5kaXJuYW1lKGZpbGUpO1xuICAgICAgICBjb25zdCBiYXNlbmFtZSA9IHN5c1BhdGguYmFzZW5hbWUoZmlsZSk7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMuZnN3Ll9nZXRXYXRjaGVkRGlyKGRpcm5hbWUpO1xuICAgICAgICAvLyBzdGF0cyBpcyBhbHdheXMgcHJlc2VudFxuICAgICAgICBsZXQgcHJldlN0YXRzID0gc3RhdHM7XG4gICAgICAgIC8vIGlmIHRoZSBmaWxlIGlzIGFscmVhZHkgYmVpbmcgd2F0Y2hlZCwgZG8gbm90aGluZ1xuICAgICAgICBpZiAocGFyZW50LmhhcyhiYXNlbmFtZSkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpc3RlbmVyID0gYXN5bmMgKHBhdGgsIG5ld1N0YXRzKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZnN3Ll90aHJvdHRsZShUSFJPVFRMRV9NT0RFX1dBVENILCBmaWxlLCA1KSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoIW5ld1N0YXRzIHx8IG5ld1N0YXRzLm10aW1lTXMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdTdGF0cyA9IGF3YWl0IHN0YXQoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIHRoYXQgY2hhbmdlIGV2ZW50IHdhcyBub3QgZmlyZWQgYmVjYXVzZSBvZiBjaGFuZ2VkIG9ubHkgYWNjZXNzVGltZS5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXQgPSBuZXdTdGF0cy5hdGltZU1zO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtdCA9IG5ld1N0YXRzLm10aW1lTXM7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYXQgfHwgYXQgPD0gbXQgfHwgbXQgIT09IHByZXZTdGF0cy5tdGltZU1zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIGZpbGUsIG5ld1N0YXRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoKGlzTWFjb3MgfHwgaXNMaW51eCB8fCBpc0ZyZWVCU0QpICYmIHByZXZTdGF0cy5pbm8gIT09IG5ld1N0YXRzLmlubykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX2Nsb3NlRmlsZShwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IG5ld1N0YXRzO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY2xvc2VyID0gdGhpcy5fd2F0Y2hXaXRoTm9kZUZzKGZpbGUsIGxpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjbG9zZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZTdGF0cyA9IG5ld1N0YXRzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXggaXNzdWVzIHdoZXJlIG10aW1lIGlzIG51bGwgYnV0IGZpbGUgaXMgc3RpbGwgcHJlc2VudFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fcmVtb3ZlKGRpcm5hbWUsIGJhc2VuYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gYWRkIGlzIGFib3V0IHRvIGJlIGVtaXR0ZWQgaWYgZmlsZSBub3QgYWxyZWFkeSB0cmFja2VkIGluIHBhcmVudFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocGFyZW50LmhhcyhiYXNlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0aGF0IGNoYW5nZSBldmVudCB3YXMgbm90IGZpcmVkIGJlY2F1c2Ugb2YgY2hhbmdlZCBvbmx5IGFjY2Vzc1RpbWUuXG4gICAgICAgICAgICAgICAgY29uc3QgYXQgPSBuZXdTdGF0cy5hdGltZU1zO1xuICAgICAgICAgICAgICAgIGNvbnN0IG10ID0gbmV3U3RhdHMubXRpbWVNcztcbiAgICAgICAgICAgICAgICBpZiAoIWF0IHx8IGF0IDw9IG10IHx8IG10ICE9PSBwcmV2U3RhdHMubXRpbWVNcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIGZpbGUsIG5ld1N0YXRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcHJldlN0YXRzID0gbmV3U3RhdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIC8vIGtpY2sgb2ZmIHRoZSB3YXRjaGVyXG4gICAgICAgIGNvbnN0IGNsb3NlciA9IHRoaXMuX3dhdGNoV2l0aE5vZGVGcyhmaWxlLCBsaXN0ZW5lcik7XG4gICAgICAgIC8vIGVtaXQgYW4gYWRkIGV2ZW50IGlmIHdlJ3JlIHN1cHBvc2VkIHRvXG4gICAgICAgIGlmICghKGluaXRpYWxBZGQgJiYgdGhpcy5mc3cub3B0aW9ucy5pZ25vcmVJbml0aWFsKSAmJiB0aGlzLmZzdy5faXNudElnbm9yZWQoZmlsZSkpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5mc3cuX3Rocm90dGxlKEVWLkFERCwgZmlsZSwgMCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXQoRVYuQURELCBmaWxlLCBzdGF0cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb3NlcjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSGFuZGxlIHN5bWxpbmtzIGVuY291bnRlcmVkIHdoaWxlIHJlYWRpbmcgYSBkaXIuXG4gICAgICogQHBhcmFtIGVudHJ5IHJldHVybmVkIGJ5IHJlYWRkaXJwXG4gICAgICogQHBhcmFtIGRpcmVjdG9yeSBwYXRoIG9mIGRpciBiZWluZyByZWFkXG4gICAgICogQHBhcmFtIHBhdGggb2YgdGhpcyBpdGVtXG4gICAgICogQHBhcmFtIGl0ZW0gYmFzZW5hbWUgb2YgdGhpcyBpdGVtXG4gICAgICogQHJldHVybnMgdHJ1ZSBpZiBubyBtb3JlIHByb2Nlc3NpbmcgaXMgbmVlZGVkIGZvciB0aGlzIGVudHJ5LlxuICAgICAqL1xuICAgIGFzeW5jIF9oYW5kbGVTeW1saW5rKGVudHJ5LCBkaXJlY3RvcnksIHBhdGgsIGl0ZW0pIHtcbiAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZ1bGwgPSBlbnRyeS5mdWxsUGF0aDtcbiAgICAgICAgY29uc3QgZGlyID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyZWN0b3J5KTtcbiAgICAgICAgaWYgKCF0aGlzLmZzdy5vcHRpb25zLmZvbGxvd1N5bWxpbmtzKSB7XG4gICAgICAgICAgICAvLyB3YXRjaCBzeW1saW5rIGRpcmVjdGx5IChkb24ndCBmb2xsb3cpIGFuZCBkZXRlY3QgY2hhbmdlc1xuICAgICAgICAgICAgdGhpcy5mc3cuX2luY3JSZWFkeUNvdW50KCk7XG4gICAgICAgICAgICBsZXQgbGlua1BhdGg7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxpbmtQYXRoID0gYXdhaXQgZnNyZWFscGF0aChwYXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXRSZWFkeSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBpZiAoZGlyLmhhcyhpdGVtKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmdldChmdWxsKSAhPT0gbGlua1BhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoZnVsbCwgbGlua1BhdGgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5DSEFOR0UsIHBhdGgsIGVudHJ5LnN0YXRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaXIuYWRkKGl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoaXMuZnN3Ll9zeW1saW5rUGF0aHMuc2V0KGZ1bGwsIGxpbmtQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BREQsIHBhdGgsIGVudHJ5LnN0YXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZnN3Ll9lbWl0UmVhZHkoKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRvbid0IGZvbGxvdyB0aGUgc2FtZSBzeW1saW5rIG1vcmUgdGhhbiBvbmNlXG4gICAgICAgIGlmICh0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmhhcyhmdWxsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoZnVsbCwgdHJ1ZSk7XG4gICAgfVxuICAgIF9oYW5kbGVSZWFkKGRpcmVjdG9yeSwgaW5pdGlhbEFkZCwgd2gsIHRhcmdldCwgZGlyLCBkZXB0aCwgdGhyb3R0bGVyKSB7XG4gICAgICAgIC8vIE5vcm1hbGl6ZSB0aGUgZGlyZWN0b3J5IG5hbWUgb24gV2luZG93c1xuICAgICAgICBkaXJlY3RvcnkgPSBzeXNQYXRoLmpvaW4oZGlyZWN0b3J5LCAnJyk7XG4gICAgICAgIHRocm90dGxlciA9IHRoaXMuZnN3Ll90aHJvdHRsZSgncmVhZGRpcicsIGRpcmVjdG9yeSwgMTAwMCk7XG4gICAgICAgIGlmICghdGhyb3R0bGVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBwcmV2aW91cyA9IHRoaXMuZnN3Ll9nZXRXYXRjaGVkRGlyKHdoLnBhdGgpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gbmV3IFNldCgpO1xuICAgICAgICBsZXQgc3RyZWFtID0gdGhpcy5mc3cuX3JlYWRkaXJwKGRpcmVjdG9yeSwge1xuICAgICAgICAgICAgZmlsZUZpbHRlcjogKGVudHJ5KSA9PiB3aC5maWx0ZXJQYXRoKGVudHJ5KSxcbiAgICAgICAgICAgIGRpcmVjdG9yeUZpbHRlcjogKGVudHJ5KSA9PiB3aC5maWx0ZXJEaXIoZW50cnkpLFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFzdHJlYW0pXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN0cmVhbVxuICAgICAgICAgICAgLm9uKFNUUl9EQVRBLCBhc3luYyAoZW50cnkpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGVudHJ5LnBhdGg7XG4gICAgICAgICAgICBsZXQgcGF0aCA9IHN5c1BhdGguam9pbihkaXJlY3RvcnksIGl0ZW0pO1xuICAgICAgICAgICAgY3VycmVudC5hZGQoaXRlbSk7XG4gICAgICAgICAgICBpZiAoZW50cnkuc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSAmJlxuICAgICAgICAgICAgICAgIChhd2FpdCB0aGlzLl9oYW5kbGVTeW1saW5rKGVudHJ5LCBkaXJlY3RvcnksIHBhdGgsIGl0ZW0pKSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgICAgICBzdHJlYW0gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmlsZXMgdGhhdCBwcmVzZW50IGluIGN1cnJlbnQgZGlyZWN0b3J5IHNuYXBzaG90XG4gICAgICAgICAgICAvLyBidXQgYWJzZW50IGluIHByZXZpb3VzIGFyZSBhZGRlZCB0byB3YXRjaCBsaXN0IGFuZFxuICAgICAgICAgICAgLy8gZW1pdCBgYWRkYCBldmVudC5cbiAgICAgICAgICAgIGlmIChpdGVtID09PSB0YXJnZXQgfHwgKCF0YXJnZXQgJiYgIXByZXZpb3VzLmhhcyhpdGVtKSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5faW5jclJlYWR5Q291bnQoKTtcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgcmVsYXRpdmVuZXNzIG9mIHBhdGggaXMgcHJlc2VydmVkIGluIGNhc2Ugb2Ygd2F0Y2hlciByZXVzZVxuICAgICAgICAgICAgICAgIHBhdGggPSBzeXNQYXRoLmpvaW4oZGlyLCBzeXNQYXRoLnJlbGF0aXZlKGRpciwgcGF0aCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2FkZFRvTm9kZUZzKHBhdGgsIGluaXRpYWxBZGQsIHdoLCBkZXB0aCArIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKEVWLkVSUk9SLCB0aGlzLl9ib3VuZEhhbmRsZUVycm9yKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghc3RyZWFtKVxuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoKTtcbiAgICAgICAgICAgIHN0cmVhbS5vbmNlKFNUUl9FTkQsICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCB3YXNUaHJvdHRsZWQgPSB0aHJvdHRsZXIgPyB0aHJvdHRsZXIuY2xlYXIoKSA6IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgICAgICAgICAvLyBGaWxlcyB0aGF0IGFic2VudCBpbiBjdXJyZW50IGRpcmVjdG9yeSBzbmFwc2hvdFxuICAgICAgICAgICAgICAgIC8vIGJ1dCBwcmVzZW50IGluIHByZXZpb3VzIGVtaXQgYHJlbW92ZWAgZXZlbnRcbiAgICAgICAgICAgICAgICAvLyBhbmQgYXJlIHJlbW92ZWQgZnJvbSBAd2F0Y2hlZFtkaXJlY3RvcnldLlxuICAgICAgICAgICAgICAgIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgIC5nZXRDaGlsZHJlbigpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0gIT09IGRpcmVjdG9yeSAmJiAhY3VycmVudC5oYXMoaXRlbSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3JlbW92ZShkaXJlY3RvcnksIGl0ZW0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0cmVhbSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAvLyBvbmUgbW9yZSB0aW1lIGZvciBhbnkgbWlzc2VkIGluIGNhc2UgY2hhbmdlcyBjYW1lIGluIGV4dHJlbWVseSBxdWlja2x5XG4gICAgICAgICAgICAgICAgaWYgKHdhc1Rocm90dGxlZClcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlUmVhZChkaXJlY3RvcnksIGZhbHNlLCB3aCwgdGFyZ2V0LCBkaXIsIGRlcHRoLCB0aHJvdHRsZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZWFkIGRpcmVjdG9yeSB0byBhZGQgLyByZW1vdmUgZmlsZXMgZnJvbSBgQHdhdGNoZWRgIGxpc3QgYW5kIHJlLXJlYWQgaXQgb24gY2hhbmdlLlxuICAgICAqIEBwYXJhbSBkaXIgZnMgcGF0aFxuICAgICAqIEBwYXJhbSBzdGF0c1xuICAgICAqIEBwYXJhbSBpbml0aWFsQWRkXG4gICAgICogQHBhcmFtIGRlcHRoIHJlbGF0aXZlIHRvIHVzZXItc3VwcGxpZWQgcGF0aFxuICAgICAqIEBwYXJhbSB0YXJnZXQgY2hpbGQgcGF0aCB0YXJnZXRlZCBmb3Igd2F0Y2hcbiAgICAgKiBAcGFyYW0gd2ggQ29tbW9uIHdhdGNoIGhlbHBlcnMgZm9yIHRoaXMgcGF0aFxuICAgICAqIEBwYXJhbSByZWFscGF0aFxuICAgICAqIEByZXR1cm5zIGNsb3NlciBmb3IgdGhlIHdhdGNoZXIgaW5zdGFuY2UuXG4gICAgICovXG4gICAgYXN5bmMgX2hhbmRsZURpcihkaXIsIHN0YXRzLCBpbml0aWFsQWRkLCBkZXB0aCwgdGFyZ2V0LCB3aCwgcmVhbHBhdGgpIHtcbiAgICAgICAgY29uc3QgcGFyZW50RGlyID0gdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoc3lzUGF0aC5kaXJuYW1lKGRpcikpO1xuICAgICAgICBjb25zdCB0cmFja2VkID0gcGFyZW50RGlyLmhhcyhzeXNQYXRoLmJhc2VuYW1lKGRpcikpO1xuICAgICAgICBpZiAoIShpbml0aWFsQWRkICYmIHRoaXMuZnN3Lm9wdGlvbnMuaWdub3JlSW5pdGlhbCkgJiYgIXRhcmdldCAmJiAhdHJhY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5mc3cuX2VtaXQoRVYuQUREX0RJUiwgZGlyLCBzdGF0cyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZW5zdXJlIGRpciBpcyB0cmFja2VkIChoYXJtbGVzcyBpZiByZWR1bmRhbnQpXG4gICAgICAgIHBhcmVudERpci5hZGQoc3lzUGF0aC5iYXNlbmFtZShkaXIpKTtcbiAgICAgICAgdGhpcy5mc3cuX2dldFdhdGNoZWREaXIoZGlyKTtcbiAgICAgICAgbGV0IHRocm90dGxlcjtcbiAgICAgICAgbGV0IGNsb3NlcjtcbiAgICAgICAgY29uc3Qgb0RlcHRoID0gdGhpcy5mc3cub3B0aW9ucy5kZXB0aDtcbiAgICAgICAgaWYgKChvRGVwdGggPT0gbnVsbCB8fCBkZXB0aCA8PSBvRGVwdGgpICYmICF0aGlzLmZzdy5fc3ltbGlua1BhdGhzLmhhcyhyZWFscGF0aCkpIHtcbiAgICAgICAgICAgIGlmICghdGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5faGFuZGxlUmVhZChkaXIsIGluaXRpYWxBZGQsIHdoLCB0YXJnZXQsIGRpciwgZGVwdGgsIHRocm90dGxlcik7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnN3LmNsb3NlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xvc2VyID0gdGhpcy5fd2F0Y2hXaXRoTm9kZUZzKGRpciwgKGRpclBhdGgsIHN0YXRzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gaWYgY3VycmVudCBkaXJlY3RvcnkgaXMgcmVtb3ZlZCwgZG8gbm90aGluZ1xuICAgICAgICAgICAgICAgIGlmIChzdGF0cyAmJiBzdGF0cy5tdGltZU1zID09PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlUmVhZChkaXJQYXRoLCBmYWxzZSwgd2gsIHRhcmdldCwgZGlyLCBkZXB0aCwgdGhyb3R0bGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9zZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhZGRlZCBmaWxlLCBkaXJlY3RvcnksIG9yIGdsb2IgcGF0dGVybi5cbiAgICAgKiBEZWxlZ2F0ZXMgY2FsbCB0byBfaGFuZGxlRmlsZSAvIF9oYW5kbGVEaXIgYWZ0ZXIgY2hlY2tzLlxuICAgICAqIEBwYXJhbSBwYXRoIHRvIGZpbGUgb3IgaXJcbiAgICAgKiBAcGFyYW0gaW5pdGlhbEFkZCB3YXMgdGhlIGZpbGUgYWRkZWQgYXQgd2F0Y2ggaW5zdGFudGlhdGlvbj9cbiAgICAgKiBAcGFyYW0gcHJpb3JXaCBkZXB0aCByZWxhdGl2ZSB0byB1c2VyLXN1cHBsaWVkIHBhdGhcbiAgICAgKiBAcGFyYW0gZGVwdGggQ2hpbGQgcGF0aCBhY3R1YWxseSB0YXJnZXRlZCBmb3Igd2F0Y2hcbiAgICAgKiBAcGFyYW0gdGFyZ2V0IENoaWxkIHBhdGggYWN0dWFsbHkgdGFyZ2V0ZWQgZm9yIHdhdGNoXG4gICAgICovXG4gICAgYXN5bmMgX2FkZFRvTm9kZUZzKHBhdGgsIGluaXRpYWxBZGQsIHByaW9yV2gsIGRlcHRoLCB0YXJnZXQpIHtcbiAgICAgICAgY29uc3QgcmVhZHkgPSB0aGlzLmZzdy5fZW1pdFJlYWR5O1xuICAgICAgICBpZiAodGhpcy5mc3cuX2lzSWdub3JlZChwYXRoKSB8fCB0aGlzLmZzdy5jbG9zZWQpIHtcbiAgICAgICAgICAgIHJlYWR5KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgd2ggPSB0aGlzLmZzdy5fZ2V0V2F0Y2hIZWxwZXJzKHBhdGgpO1xuICAgICAgICBpZiAocHJpb3JXaCkge1xuICAgICAgICAgICAgd2guZmlsdGVyUGF0aCA9IChlbnRyeSkgPT4gcHJpb3JXaC5maWx0ZXJQYXRoKGVudHJ5KTtcbiAgICAgICAgICAgIHdoLmZpbHRlckRpciA9IChlbnRyeSkgPT4gcHJpb3JXaC5maWx0ZXJEaXIoZW50cnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGV2YWx1YXRlIHdoYXQgaXMgYXQgdGhlIHBhdGggd2UncmUgYmVpbmcgYXNrZWQgdG8gd2F0Y2hcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc3RhdE1ldGhvZHNbd2guc3RhdE1ldGhvZF0od2gud2F0Y2hQYXRoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKHRoaXMuZnN3Ll9pc0lnbm9yZWQod2gud2F0Y2hQYXRoLCBzdGF0cykpIHtcbiAgICAgICAgICAgICAgICByZWFkeSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGZvbGxvdyA9IHRoaXMuZnN3Lm9wdGlvbnMuZm9sbG93U3ltbGlua3M7XG4gICAgICAgICAgICBsZXQgY2xvc2VyO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhYnNQYXRoID0gc3lzUGF0aC5yZXNvbHZlKHBhdGgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBmb2xsb3cgPyBhd2FpdCBmc3JlYWxwYXRoKHBhdGgpIDogcGF0aDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgY2xvc2VyID0gYXdhaXQgdGhpcy5faGFuZGxlRGlyKHdoLndhdGNoUGF0aCwgc3RhdHMsIGluaXRpYWxBZGQsIGRlcHRoLCB0YXJnZXQsIHdoLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgLy8gcHJlc2VydmUgdGhpcyBzeW1saW5rJ3MgdGFyZ2V0IHBhdGhcbiAgICAgICAgICAgICAgICBpZiAoYWJzUGF0aCAhPT0gdGFyZ2V0UGF0aCAmJiB0YXJnZXRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoYWJzUGF0aCwgdGFyZ2V0UGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhdHMuaXNTeW1ib2xpY0xpbmsoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSBmb2xsb3cgPyBhd2FpdCBmc3JlYWxwYXRoKHBhdGgpIDogcGF0aDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5mc3cuY2xvc2VkKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyZW50ID0gc3lzUGF0aC5kaXJuYW1lKHdoLndhdGNoUGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2dldFdhdGNoZWREaXIocGFyZW50KS5hZGQod2gud2F0Y2hQYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZzdy5fZW1pdChFVi5BREQsIHdoLndhdGNoUGF0aCwgc3RhdHMpO1xuICAgICAgICAgICAgICAgIGNsb3NlciA9IGF3YWl0IHRoaXMuX2hhbmRsZURpcihwYXJlbnQsIHN0YXRzLCBpbml0aWFsQWRkLCBkZXB0aCwgcGF0aCwgd2gsIHRhcmdldFBhdGgpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZzdy5jbG9zZWQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAvLyBwcmVzZXJ2ZSB0aGlzIHN5bWxpbmsncyB0YXJnZXQgcGF0aFxuICAgICAgICAgICAgICAgIGlmICh0YXJnZXRQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mc3cuX3N5bWxpbmtQYXRocy5zZXQoc3lzUGF0aC5yZXNvbHZlKHBhdGgpLCB0YXJnZXRQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXIgPSB0aGlzLl9oYW5kbGVGaWxlKHdoLndhdGNoUGF0aCwgc3RhdHMsIGluaXRpYWxBZGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgIGlmIChjbG9zZXIpXG4gICAgICAgICAgICAgICAgdGhpcy5mc3cuX2FkZFBhdGhDbG9zZXIocGF0aCwgY2xvc2VyKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZzdy5faGFuZGxlRXJyb3IoZXJyb3IpKSB7XG4gICAgICAgICAgICAgICAgcmVhZHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsICIvKipcbiAqIERpc2NvdmVyIHR3ZWFrcyB1bmRlciA8dXNlclJvb3Q+L3R3ZWFrcy4gRWFjaCB0d2VhayBpcyBhIGRpcmVjdG9yeSB3aXRoIGFcbiAqIG1hbmlmZXN0Lmpzb24gYW5kIGFuIGVudHJ5IHNjcmlwdC4gRW50cnkgcmVzb2x1dGlvbiBpcyBtYW5pZmVzdC5tYWluIGZpcnN0LFxuICogdGhlbiBpbmRleC5qcywgaW5kZXgubWpzLCBhbmQgaW5kZXguY2pzLlxuICpcbiAqIFRoZSBtYW5pZmVzdCBnYXRlIGlzIGludGVudGlvbmFsbHkgc3RyaWN0LiBBIHR3ZWFrIG11c3QgaWRlbnRpZnkgaXRzIEdpdEh1YlxuICogcmVwb3NpdG9yeSBzbyB0aGUgbWFuYWdlciBjYW4gY2hlY2sgcmVsZWFzZXMgd2l0aG91dCBncmFudGluZyB0aGUgdHdlYWsgYW5cbiAqIHVwZGF0ZS9pbnN0YWxsIGNoYW5uZWwuIFVwZGF0ZSBjaGVja3MgYXJlIGFkdmlzb3J5IG9ubHkuXG4gKi9cbmltcG9ydCB7IHJlYWRkaXJTeW5jLCBzdGF0U3luYywgcmVhZEZpbGVTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7IFR3ZWFrTWFuaWZlc3QgfSBmcm9tIFwiQGNvZGV4LXBsdXNwbHVzL3Nka1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERpc2NvdmVyZWRUd2VhayB7XG4gIGRpcjogc3RyaW5nO1xuICBlbnRyeTogc3RyaW5nO1xuICBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbn1cblxuY29uc3QgRU5UUllfQ0FORElEQVRFUyA9IFtcImluZGV4LmpzXCIsIFwiaW5kZXguY2pzXCIsIFwiaW5kZXgubWpzXCJdO1xuXG5leHBvcnQgZnVuY3Rpb24gZGlzY292ZXJUd2Vha3ModHdlYWtzRGlyOiBzdHJpbmcpOiBEaXNjb3ZlcmVkVHdlYWtbXSB7XG4gIGlmICghZXhpc3RzU3luYyh0d2Vha3NEaXIpKSByZXR1cm4gW107XG4gIGNvbnN0IG91dDogRGlzY292ZXJlZFR3ZWFrW10gPSBbXTtcbiAgZm9yIChjb25zdCBuYW1lIG9mIHJlYWRkaXJTeW5jKHR3ZWFrc0RpcikpIHtcbiAgICBjb25zdCBkaXIgPSBqb2luKHR3ZWFrc0RpciwgbmFtZSk7XG4gICAgaWYgKCFzdGF0U3luYyhkaXIpLmlzRGlyZWN0b3J5KCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IG1hbmlmZXN0UGF0aCA9IGpvaW4oZGlyLCBcIm1hbmlmZXN0Lmpzb25cIik7XG4gICAgaWYgKCFleGlzdHNTeW5jKG1hbmlmZXN0UGF0aCkpIGNvbnRpbnVlO1xuICAgIGxldCBtYW5pZmVzdDogVHdlYWtNYW5pZmVzdDtcbiAgICB0cnkge1xuICAgICAgbWFuaWZlc3QgPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtYW5pZmVzdFBhdGgsIFwidXRmOFwiKSkgYXMgVHdlYWtNYW5pZmVzdDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoIWlzVmFsaWRNYW5pZmVzdChtYW5pZmVzdCkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGVudHJ5ID0gcmVzb2x2ZUVudHJ5KGRpciwgbWFuaWZlc3QpO1xuICAgIGlmICghZW50cnkpIGNvbnRpbnVlO1xuICAgIG91dC5wdXNoKHsgZGlyLCBlbnRyeSwgbWFuaWZlc3QgfSk7XG4gIH1cbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KG06IFR3ZWFrTWFuaWZlc3QpOiBib29sZWFuIHtcbiAgaWYgKCFtLmlkIHx8ICFtLm5hbWUgfHwgIW0udmVyc2lvbiB8fCAhbS5naXRodWJSZXBvKSByZXR1cm4gZmFsc2U7XG4gIGlmICghL15bYS16QS1aMC05Ll8tXStcXC9bYS16QS1aMC05Ll8tXSskLy50ZXN0KG0uZ2l0aHViUmVwbykpIHJldHVybiBmYWxzZTtcbiAgaWYgKG0uc2NvcGUgJiYgIVtcInJlbmRlcmVyXCIsIFwibWFpblwiLCBcImJvdGhcIl0uaW5jbHVkZXMobS5zY29wZSkpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVFbnRyeShkaXI6IHN0cmluZywgbTogVHdlYWtNYW5pZmVzdCk6IHN0cmluZyB8IG51bGwge1xuICBpZiAobS5tYWluKSB7XG4gICAgY29uc3QgcCA9IGpvaW4oZGlyLCBtLm1haW4pO1xuICAgIHJldHVybiBleGlzdHNTeW5jKHApID8gcCA6IG51bGw7XG4gIH1cbiAgZm9yIChjb25zdCBjIG9mIEVOVFJZX0NBTkRJREFURVMpIHtcbiAgICBjb25zdCBwID0gam9pbihkaXIsIGMpO1xuICAgIGlmIChleGlzdHNTeW5jKHApKSByZXR1cm4gcDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiIsICIvKipcbiAqIERpc2stYmFja2VkIGtleS92YWx1ZSBzdG9yYWdlIGZvciBtYWluLXByb2Nlc3MgdHdlYWtzLlxuICpcbiAqIEVhY2ggdHdlYWsgZ2V0cyBvbmUgSlNPTiBmaWxlIHVuZGVyIGA8dXNlclJvb3Q+L3N0b3JhZ2UvPGlkPi5qc29uYC5cbiAqIFdyaXRlcyBhcmUgZGVib3VuY2VkICg1MCBtcykgYW5kIGF0b21pYyAod3JpdGUgdG8gPGZpbGU+LnRtcCB0aGVuIHJlbmFtZSkuXG4gKiBSZWFkcyBhcmUgZWFnZXIgKyBjYWNoZWQgaW4tbWVtb3J5OyB3ZSBsb2FkIG9uIGZpcnN0IGFjY2Vzcy5cbiAqL1xuaW1wb3J0IHtcbiAgZXhpc3RzU3luYyxcbiAgbWtkaXJTeW5jLFxuICByZWFkRmlsZVN5bmMsXG4gIHJlbmFtZVN5bmMsXG4gIHdyaXRlRmlsZVN5bmMsXG59IGZyb20gXCJub2RlOmZzXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIERpc2tTdG9yYWdlIHtcbiAgZ2V0PFQ+KGtleTogc3RyaW5nLCBkZWZhdWx0VmFsdWU/OiBUKTogVDtcbiAgc2V0KGtleTogc3RyaW5nLCB2YWx1ZTogdW5rbm93bik6IHZvaWQ7XG4gIGRlbGV0ZShrZXk6IHN0cmluZyk6IHZvaWQ7XG4gIGFsbCgpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgZmx1c2goKTogdm9pZDtcbn1cblxuY29uc3QgRkxVU0hfREVMQVlfTVMgPSA1MDtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpc2tTdG9yYWdlKHJvb3REaXI6IHN0cmluZywgaWQ6IHN0cmluZyk6IERpc2tTdG9yYWdlIHtcbiAgY29uc3QgZGlyID0gam9pbihyb290RGlyLCBcInN0b3JhZ2VcIik7XG4gIG1rZGlyU3luYyhkaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBmaWxlID0gam9pbihkaXIsIGAke3Nhbml0aXplKGlkKX0uanNvbmApO1xuXG4gIGxldCBkYXRhOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA9IHt9O1xuICBpZiAoZXhpc3RzU3luYyhmaWxlKSkge1xuICAgIHRyeSB7XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMoZmlsZSwgXCJ1dGY4XCIpKSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPjtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIENvcnJ1cHQgZmlsZSBcdTIwMTQgc3RhcnQgZnJlc2gsIGJ1dCBkb24ndCBjbG9iYmVyIHRoZSBvcmlnaW5hbCB1bnRpbCB3ZVxuICAgICAgLy8gc3VjY2Vzc2Z1bGx5IHdyaXRlIGFnYWluLiAoTW92ZSBpdCBhc2lkZSBmb3IgZm9yZW5zaWNzLilcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlbmFtZVN5bmMoZmlsZSwgYCR7ZmlsZX0uY29ycnVwdC0ke0RhdGUubm93KCl9YCk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBkYXRhID0ge307XG4gICAgfVxuICB9XG5cbiAgbGV0IGRpcnR5ID0gZmFsc2U7XG4gIGxldCB0aW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdCBzY2hlZHVsZUZsdXNoID0gKCkgPT4ge1xuICAgIGRpcnR5ID0gdHJ1ZTtcbiAgICBpZiAodGltZXIpIHJldHVybjtcbiAgICB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGltZXIgPSBudWxsO1xuICAgICAgaWYgKGRpcnR5KSBmbHVzaCgpO1xuICAgIH0sIEZMVVNIX0RFTEFZX01TKTtcbiAgfTtcblxuICBjb25zdCBmbHVzaCA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoIWRpcnR5KSByZXR1cm47XG4gICAgY29uc3QgdG1wID0gYCR7ZmlsZX0udG1wYDtcbiAgICB0cnkge1xuICAgICAgd3JpdGVGaWxlU3luYyh0bXAsIEpTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpLCBcInV0ZjhcIik7XG4gICAgICByZW5hbWVTeW5jKHRtcCwgZmlsZSk7XG4gICAgICBkaXJ0eSA9IGZhbHNlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIExlYXZlIGRpcnR5PXRydWUgc28gYSBmdXR1cmUgZmx1c2ggcmV0cmllcy5cbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJbY29kZXgtcGx1c3BsdXNdIHN0b3JhZ2UgZmx1c2ggZmFpbGVkOlwiLCBpZCwgZSk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZ2V0OiA8VD4oazogc3RyaW5nLCBkPzogVCk6IFQgPT5cbiAgICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrKSA/IChkYXRhW2tdIGFzIFQpIDogKGQgYXMgVCksXG4gICAgc2V0KGssIHYpIHtcbiAgICAgIGRhdGFba10gPSB2O1xuICAgICAgc2NoZWR1bGVGbHVzaCgpO1xuICAgIH0sXG4gICAgZGVsZXRlKGspIHtcbiAgICAgIGlmIChrIGluIGRhdGEpIHtcbiAgICAgICAgZGVsZXRlIGRhdGFba107XG4gICAgICAgIHNjaGVkdWxlRmx1c2goKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIGFsbDogKCkgPT4gKHsgLi4uZGF0YSB9KSxcbiAgICBmbHVzaCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc2FuaXRpemUoaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIFR3ZWFrIGlkcyBhcmUgYXV0aG9yLWNvbnRyb2xsZWQ7IGNsYW1wIHRvIGEgc2FmZSBmaWxlbmFtZS5cbiAgcmV0dXJuIGlkLnJlcGxhY2UoL1teYS16QS1aMC05Ll9ALV0vZywgXCJfXCIpO1xufVxuIiwgImltcG9ydCB7IGV4aXN0c1N5bmMsIG1rZGlyU3luYywgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUsIGlzQWJzb2x1dGUsIHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgdHlwZSB7IFR3ZWFrTWNwU2VydmVyIH0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGNvbnN0IE1DUF9NQU5BR0VEX1NUQVJUID0gXCIjIEJFR0lOIENPREVYKysgTUFOQUdFRCBNQ1AgU0VSVkVSU1wiO1xuZXhwb3J0IGNvbnN0IE1DUF9NQU5BR0VEX0VORCA9IFwiIyBFTkQgQ09ERVgrKyBNQU5BR0VEIE1DUCBTRVJWRVJTXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWNwU3luY1R3ZWFrIHtcbiAgZGlyOiBzdHJpbmc7XG4gIG1hbmlmZXN0OiB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBtY3A/OiBUd2Vha01jcFNlcnZlcjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdWlsdE1hbmFnZWRNY3BCbG9jayB7XG4gIGJsb2NrOiBzdHJpbmc7XG4gIHNlcnZlck5hbWVzOiBzdHJpbmdbXTtcbiAgc2tpcHBlZFNlcnZlck5hbWVzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNYW5hZ2VkTWNwU3luY1Jlc3VsdCBleHRlbmRzIEJ1aWx0TWFuYWdlZE1jcEJsb2NrIHtcbiAgY2hhbmdlZDogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN5bmNNYW5hZ2VkTWNwU2VydmVycyh7XG4gIGNvbmZpZ1BhdGgsXG4gIHR3ZWFrcyxcbn06IHtcbiAgY29uZmlnUGF0aDogc3RyaW5nO1xuICB0d2Vha3M6IE1jcFN5bmNUd2Vha1tdO1xufSk6IE1hbmFnZWRNY3BTeW5jUmVzdWx0IHtcbiAgY29uc3QgY3VycmVudCA9IGV4aXN0c1N5bmMoY29uZmlnUGF0aCkgPyByZWFkRmlsZVN5bmMoY29uZmlnUGF0aCwgXCJ1dGY4XCIpIDogXCJcIjtcbiAgY29uc3QgYnVpbHQgPSBidWlsZE1hbmFnZWRNY3BCbG9jayh0d2Vha3MsIGN1cnJlbnQpO1xuICBjb25zdCBuZXh0ID0gbWVyZ2VNYW5hZ2VkTWNwQmxvY2soY3VycmVudCwgYnVpbHQuYmxvY2spO1xuXG4gIGlmIChuZXh0ICE9PSBjdXJyZW50KSB7XG4gICAgbWtkaXJTeW5jKGRpcm5hbWUoY29uZmlnUGF0aCksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICAgIHdyaXRlRmlsZVN5bmMoY29uZmlnUGF0aCwgbmV4dCwgXCJ1dGY4XCIpO1xuICB9XG5cbiAgcmV0dXJuIHsgLi4uYnVpbHQsIGNoYW5nZWQ6IG5leHQgIT09IGN1cnJlbnQgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTWFuYWdlZE1jcEJsb2NrKFxuICB0d2Vha3M6IE1jcFN5bmNUd2Vha1tdLFxuICBleGlzdGluZ1RvbWwgPSBcIlwiLFxuKTogQnVpbHRNYW5hZ2VkTWNwQmxvY2sge1xuICBjb25zdCBtYW51YWxUb21sID0gc3RyaXBNYW5hZ2VkTWNwQmxvY2soZXhpc3RpbmdUb21sKTtcbiAgY29uc3QgbWFudWFsTmFtZXMgPSBmaW5kTWNwU2VydmVyTmFtZXMobWFudWFsVG9tbCk7XG4gIGNvbnN0IHVzZWROYW1lcyA9IG5ldyBTZXQobWFudWFsTmFtZXMpO1xuICBjb25zdCBzZXJ2ZXJOYW1lczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3Qgc2tpcHBlZFNlcnZlck5hbWVzOiBzdHJpbmdbXSA9IFtdO1xuICBjb25zdCBlbnRyaWVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGZvciAoY29uc3QgdHdlYWsgb2YgdHdlYWtzKSB7XG4gICAgY29uc3QgbWNwID0gbm9ybWFsaXplTWNwU2VydmVyKHR3ZWFrLm1hbmlmZXN0Lm1jcCk7XG4gICAgaWYgKCFtY3ApIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgYmFzZU5hbWUgPSBtY3BTZXJ2ZXJOYW1lRnJvbVR3ZWFrSWQodHdlYWsubWFuaWZlc3QuaWQpO1xuICAgIGlmIChtYW51YWxOYW1lcy5oYXMoYmFzZU5hbWUpKSB7XG4gICAgICBza2lwcGVkU2VydmVyTmFtZXMucHVzaChiYXNlTmFtZSk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJ2ZXJOYW1lID0gcmVzZXJ2ZVVuaXF1ZU5hbWUoYmFzZU5hbWUsIHVzZWROYW1lcyk7XG4gICAgc2VydmVyTmFtZXMucHVzaChzZXJ2ZXJOYW1lKTtcbiAgICBlbnRyaWVzLnB1c2goZm9ybWF0TWNwU2VydmVyKHNlcnZlck5hbWUsIHR3ZWFrLmRpciwgbWNwKSk7XG4gIH1cblxuICBpZiAoZW50cmllcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4geyBibG9jazogXCJcIiwgc2VydmVyTmFtZXMsIHNraXBwZWRTZXJ2ZXJOYW1lcyB9O1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBibG9jazogW01DUF9NQU5BR0VEX1NUQVJULCAuLi5lbnRyaWVzLCBNQ1BfTUFOQUdFRF9FTkRdLmpvaW4oXCJcXG5cIiksXG4gICAgc2VydmVyTmFtZXMsXG4gICAgc2tpcHBlZFNlcnZlck5hbWVzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VNYW5hZ2VkTWNwQmxvY2soY3VycmVudFRvbWw6IHN0cmluZywgbWFuYWdlZEJsb2NrOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIW1hbmFnZWRCbG9jayAmJiAhY3VycmVudFRvbWwuaW5jbHVkZXMoTUNQX01BTkFHRURfU1RBUlQpKSByZXR1cm4gY3VycmVudFRvbWw7XG4gIGNvbnN0IHN0cmlwcGVkID0gc3RyaXBNYW5hZ2VkTWNwQmxvY2soY3VycmVudFRvbWwpLnRyaW1FbmQoKTtcbiAgaWYgKCFtYW5hZ2VkQmxvY2spIHJldHVybiBzdHJpcHBlZCA/IGAke3N0cmlwcGVkfVxcbmAgOiBcIlwiO1xuICByZXR1cm4gYCR7c3RyaXBwZWQgPyBgJHtzdHJpcHBlZH1cXG5cXG5gIDogXCJcIn0ke21hbmFnZWRCbG9ja31cXG5gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBNYW5hZ2VkTWNwQmxvY2sodG9tbDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0dGVybiA9IG5ldyBSZWdFeHAoXG4gICAgYFxcXFxuPyR7ZXNjYXBlUmVnRXhwKE1DUF9NQU5BR0VEX1NUQVJUKX1bXFxcXHNcXFxcU10qPyR7ZXNjYXBlUmVnRXhwKE1DUF9NQU5BR0VEX0VORCl9XFxcXG4/YCxcbiAgICBcImdcIixcbiAgKTtcbiAgcmV0dXJuIHRvbWwucmVwbGFjZShwYXR0ZXJuLCBcIlxcblwiKS5yZXBsYWNlKC9cXG57Myx9L2csIFwiXFxuXFxuXCIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWNwU2VydmVyTmFtZUZyb21Ud2Vha0lkKGlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB3aXRob3V0UHVibGlzaGVyID0gaWQucmVwbGFjZSgvXmNvXFwuYmVubmV0dFxcLi8sIFwiXCIpO1xuICBjb25zdCBzbHVnID0gd2l0aG91dFB1Ymxpc2hlclxuICAgIC5yZXBsYWNlKC9bXmEtekEtWjAtOV8tXSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tK3wtKyQvZywgXCJcIilcbiAgICAudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHNsdWcgfHwgXCJ0d2Vhay1tY3BcIjtcbn1cblxuZnVuY3Rpb24gZmluZE1jcFNlcnZlck5hbWVzKHRvbWw6IHN0cmluZyk6IFNldDxzdHJpbmc+IHtcbiAgY29uc3QgbmFtZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgY29uc3QgdGFibGVQYXR0ZXJuID0gL15cXHMqXFxbbWNwX3NlcnZlcnNcXC4oW15cXF1cXHNdKylcXF1cXHMqJC9nbTtcbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuICB3aGlsZSAoKG1hdGNoID0gdGFibGVQYXR0ZXJuLmV4ZWModG9tbCkpICE9PSBudWxsKSB7XG4gICAgbmFtZXMuYWRkKHVucXVvdGVUb21sS2V5KG1hdGNoWzFdID8/IFwiXCIpKTtcbiAgfVxuICByZXR1cm4gbmFtZXM7XG59XG5cbmZ1bmN0aW9uIHJlc2VydmVVbmlxdWVOYW1lKGJhc2VOYW1lOiBzdHJpbmcsIHVzZWROYW1lczogU2V0PHN0cmluZz4pOiBzdHJpbmcge1xuICBpZiAoIXVzZWROYW1lcy5oYXMoYmFzZU5hbWUpKSB7XG4gICAgdXNlZE5hbWVzLmFkZChiYXNlTmFtZSk7XG4gICAgcmV0dXJuIGJhc2VOYW1lO1xuICB9XG4gIGZvciAobGV0IGkgPSAyOyA7IGkgKz0gMSkge1xuICAgIGNvbnN0IGNhbmRpZGF0ZSA9IGAke2Jhc2VOYW1lfS0ke2l9YDtcbiAgICBpZiAoIXVzZWROYW1lcy5oYXMoY2FuZGlkYXRlKSkge1xuICAgICAgdXNlZE5hbWVzLmFkZChjYW5kaWRhdGUpO1xuICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplTWNwU2VydmVyKHZhbHVlOiBUd2Vha01jcFNlcnZlciB8IHVuZGVmaW5lZCk6IFR3ZWFrTWNwU2VydmVyIHwgbnVsbCB7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlLmNvbW1hbmQgIT09IFwic3RyaW5nXCIgfHwgdmFsdWUuY29tbWFuZC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICBpZiAodmFsdWUuYXJncyAhPT0gdW5kZWZpbmVkICYmICFBcnJheS5pc0FycmF5KHZhbHVlLmFyZ3MpKSByZXR1cm4gbnVsbDtcbiAgaWYgKHZhbHVlLmFyZ3M/LnNvbWUoKGFyZykgPT4gdHlwZW9mIGFyZyAhPT0gXCJzdHJpbmdcIikpIHJldHVybiBudWxsO1xuICBpZiAodmFsdWUuZW52ICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIXZhbHVlLmVudiB8fCB0eXBlb2YgdmFsdWUuZW52ICE9PSBcIm9iamVjdFwiIHx8IEFycmF5LmlzQXJyYXkodmFsdWUuZW52KSkgcmV0dXJuIG51bGw7XG4gICAgaWYgKE9iamVjdC52YWx1ZXModmFsdWUuZW52KS5zb21lKChlbnZWYWx1ZSkgPT4gdHlwZW9mIGVudlZhbHVlICE9PSBcInN0cmluZ1wiKSkgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRNY3BTZXJ2ZXIoc2VydmVyTmFtZTogc3RyaW5nLCB0d2Vha0Rpcjogc3RyaW5nLCBtY3A6IFR3ZWFrTWNwU2VydmVyKTogc3RyaW5nIHtcbiAgY29uc3QgbGluZXMgPSBbXG4gICAgYFttY3Bfc2VydmVycy4ke2Zvcm1hdFRvbWxLZXkoc2VydmVyTmFtZSl9XWAsXG4gICAgYGNvbW1hbmQgPSAke2Zvcm1hdFRvbWxTdHJpbmcocmVzb2x2ZUNvbW1hbmQodHdlYWtEaXIsIG1jcC5jb21tYW5kKSl9YCxcbiAgXTtcblxuICBpZiAobWNwLmFyZ3MgJiYgbWNwLmFyZ3MubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goYGFyZ3MgPSAke2Zvcm1hdFRvbWxTdHJpbmdBcnJheShtY3AuYXJncy5tYXAoKGFyZykgPT4gcmVzb2x2ZUFyZyh0d2Vha0RpciwgYXJnKSkpfWApO1xuICB9XG5cbiAgaWYgKG1jcC5lbnYgJiYgT2JqZWN0LmtleXMobWNwLmVudikubGVuZ3RoID4gMCkge1xuICAgIGxpbmVzLnB1c2goYGVudiA9ICR7Zm9ybWF0VG9tbElubGluZVRhYmxlKG1jcC5lbnYpfWApO1xuICB9XG5cbiAgcmV0dXJuIGxpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVDb21tYW5kKHR3ZWFrRGlyOiBzdHJpbmcsIGNvbW1hbmQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChpc0Fic29sdXRlKGNvbW1hbmQpIHx8ICFsb29rc0xpa2VSZWxhdGl2ZVBhdGgoY29tbWFuZCkpIHJldHVybiBjb21tYW5kO1xuICByZXR1cm4gcmVzb2x2ZSh0d2Vha0RpciwgY29tbWFuZCk7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVBcmcodHdlYWtEaXI6IHN0cmluZywgYXJnOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoaXNBYnNvbHV0ZShhcmcpIHx8IGFyZy5zdGFydHNXaXRoKFwiLVwiKSkgcmV0dXJuIGFyZztcbiAgY29uc3QgY2FuZGlkYXRlID0gcmVzb2x2ZSh0d2Vha0RpciwgYXJnKTtcbiAgcmV0dXJuIGV4aXN0c1N5bmMoY2FuZGlkYXRlKSA/IGNhbmRpZGF0ZSA6IGFyZztcbn1cblxuZnVuY3Rpb24gbG9va3NMaWtlUmVsYXRpdmVQYXRoKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIHZhbHVlLnN0YXJ0c1dpdGgoXCIuL1wiKSB8fCB2YWx1ZS5zdGFydHNXaXRoKFwiLi4vXCIpIHx8IHZhbHVlLmluY2x1ZGVzKFwiL1wiKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbFN0cmluZyh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbFN0cmluZ0FycmF5KHZhbHVlczogc3RyaW5nW10pOiBzdHJpbmcge1xuICByZXR1cm4gYFske3ZhbHVlcy5tYXAoZm9ybWF0VG9tbFN0cmluZykuam9pbihcIiwgXCIpfV1gO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRUb21sSW5saW5lVGFibGUocmVjb3JkOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+KTogc3RyaW5nIHtcbiAgcmV0dXJuIGB7ICR7T2JqZWN0LmVudHJpZXMocmVjb3JkKVxuICAgIC5tYXAoKFtrZXksIHZhbHVlXSkgPT4gYCR7Zm9ybWF0VG9tbEtleShrZXkpfSA9ICR7Zm9ybWF0VG9tbFN0cmluZyh2YWx1ZSl9YClcbiAgICAuam9pbihcIiwgXCIpfSB9YDtcbn1cblxuZnVuY3Rpb24gZm9ybWF0VG9tbEtleShrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiAvXlthLXpBLVowLTlfLV0rJC8udGVzdChrZXkpID8ga2V5IDogZm9ybWF0VG9tbFN0cmluZyhrZXkpO1xufVxuXG5mdW5jdGlvbiB1bnF1b3RlVG9tbEtleShrZXk6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICgha2V5LnN0YXJ0c1dpdGgoJ1wiJykgfHwgIWtleS5lbmRzV2l0aCgnXCInKSkgcmV0dXJuIGtleTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShrZXkpIGFzIHN0cmluZztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGtleTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlc2NhcGVSZWdFeHAodmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG59XG4iLCAiaW1wb3J0IHsgZXhlY0ZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6Y2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgZXhpc3RzU3luYywgcmVhZEZpbGVTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGhvbWVkaXIsIHBsYXRmb3JtIH0gZnJvbSBcIm5vZGU6b3NcIjtcbmltcG9ydCB7IGpvaW4gfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbnR5cGUgQ2hlY2tTdGF0dXMgPSBcIm9rXCIgfCBcIndhcm5cIiB8IFwiZXJyb3JcIjtcblxuZXhwb3J0IGludGVyZmFjZSBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0YXR1czogQ2hlY2tTdGF0dXM7XG4gIGRldGFpbDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdhdGNoZXJIZWFsdGgge1xuICBjaGVja2VkQXQ6IHN0cmluZztcbiAgc3RhdHVzOiBDaGVja1N0YXR1cztcbiAgdGl0bGU6IHN0cmluZztcbiAgc3VtbWFyeTogc3RyaW5nO1xuICB3YXRjaGVyOiBzdHJpbmc7XG4gIGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW107XG59XG5cbmludGVyZmFjZSBJbnN0YWxsZXJTdGF0ZSB7XG4gIGFwcFJvb3Q/OiBzdHJpbmc7XG4gIHZlcnNpb24/OiBzdHJpbmc7XG4gIHdhdGNoZXI/OiBcImxhdW5jaGRcIiB8IFwibG9naW4taXRlbVwiIHwgXCJzY2hlZHVsZWQtdGFza1wiIHwgXCJzeXN0ZW1kXCIgfCBcIm5vbmVcIjtcbn1cblxuaW50ZXJmYWNlIFJ1bnRpbWVDb25maWcge1xuICBjb2RleFBsdXNQbHVzPzoge1xuICAgIGF1dG9VcGRhdGU/OiBib29sZWFuO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgU2VsZlVwZGF0ZVN0YXRlIHtcbiAgc3RhdHVzPzogXCJjaGVja2luZ1wiIHwgXCJ1cC10by1kYXRlXCIgfCBcInVwZGF0ZWRcIiB8IFwiZmFpbGVkXCIgfCBcImRpc2FibGVkXCI7XG4gIGNvbXBsZXRlZEF0Pzogc3RyaW5nO1xuICBjaGVja2VkQXQ/OiBzdHJpbmc7XG4gIGxhdGVzdFZlcnNpb24/OiBzdHJpbmcgfCBudWxsO1xuICBlcnJvcj86IHN0cmluZztcbn1cblxuY29uc3QgTEFVTkNIRF9MQUJFTCA9IFwiY29tLmNvZGV4cGx1c3BsdXMud2F0Y2hlclwiO1xuY29uc3QgV0FUQ0hFUl9MT0cgPSBqb2luKGhvbWVkaXIoKSwgXCJMaWJyYXJ5XCIsIFwiTG9nc1wiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIubG9nXCIpO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2F0Y2hlckhlYWx0aCh1c2VyUm9vdDogc3RyaW5nKTogV2F0Y2hlckhlYWx0aCB7XG4gIGNvbnN0IGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW10gPSBbXTtcbiAgY29uc3Qgc3RhdGUgPSByZWFkSnNvbjxJbnN0YWxsZXJTdGF0ZT4oam9pbih1c2VyUm9vdCwgXCJzdGF0ZS5qc29uXCIpKTtcbiAgY29uc3QgY29uZmlnID0gcmVhZEpzb248UnVudGltZUNvbmZpZz4oam9pbih1c2VyUm9vdCwgXCJjb25maWcuanNvblwiKSkgPz8ge307XG4gIGNvbnN0IHNlbGZVcGRhdGUgPSByZWFkSnNvbjxTZWxmVXBkYXRlU3RhdGU+KGpvaW4odXNlclJvb3QsIFwic2VsZi11cGRhdGUtc3RhdGUuanNvblwiKSk7XG5cbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiSW5zdGFsbCBzdGF0ZVwiLFxuICAgIHN0YXR1czogc3RhdGUgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgZGV0YWlsOiBzdGF0ZSA/IGBDb2RleCsrICR7c3RhdGUudmVyc2lvbiA/PyBcIih1bmtub3duIHZlcnNpb24pXCJ9YCA6IFwic3RhdGUuanNvbiBpcyBtaXNzaW5nXCIsXG4gIH0pO1xuXG4gIGlmICghc3RhdGUpIHJldHVybiBzdW1tYXJpemUoXCJub25lXCIsIGNoZWNrcyk7XG5cbiAgY29uc3QgYXV0b1VwZGF0ZSA9IGNvbmZpZy5jb2RleFBsdXNQbHVzPy5hdXRvVXBkYXRlICE9PSBmYWxzZTtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiQXV0b21hdGljIHJlZnJlc2hcIixcbiAgICBzdGF0dXM6IGF1dG9VcGRhdGUgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICBkZXRhaWw6IGF1dG9VcGRhdGUgPyBcImVuYWJsZWRcIiA6IFwiZGlzYWJsZWQgaW4gQ29kZXgrKyBjb25maWdcIixcbiAgfSk7XG5cbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiV2F0Y2hlciBraW5kXCIsXG4gICAgc3RhdHVzOiBzdGF0ZS53YXRjaGVyICYmIHN0YXRlLndhdGNoZXIgIT09IFwibm9uZVwiID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgIGRldGFpbDogc3RhdGUud2F0Y2hlciA/PyBcIm5vbmVcIixcbiAgfSk7XG5cbiAgaWYgKHNlbGZVcGRhdGUpIHtcbiAgICBjaGVja3MucHVzaChzZWxmVXBkYXRlQ2hlY2soc2VsZlVwZGF0ZSkpO1xuICB9XG5cbiAgY29uc3QgYXBwUm9vdCA9IHN0YXRlLmFwcFJvb3QgPz8gXCJcIjtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwiQ29kZXggYXBwXCIsXG4gICAgc3RhdHVzOiBhcHBSb290ICYmIGV4aXN0c1N5bmMoYXBwUm9vdCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgZGV0YWlsOiBhcHBSb290IHx8IFwibWlzc2luZyBhcHBSb290IGluIHN0YXRlXCIsXG4gIH0pO1xuXG4gIHN3aXRjaCAocGxhdGZvcm0oKSkge1xuICAgIGNhc2UgXCJkYXJ3aW5cIjpcbiAgICAgIGNoZWNrcy5wdXNoKC4uLmNoZWNrTGF1bmNoZFdhdGNoZXIoYXBwUm9vdCkpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImxpbnV4XCI6XG4gICAgICBjaGVja3MucHVzaCguLi5jaGVja1N5c3RlbWRXYXRjaGVyKGFwcFJvb3QpKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgXCJ3aW4zMlwiOlxuICAgICAgY2hlY2tzLnB1c2goLi4uY2hlY2tTY2hlZHVsZWRUYXNrV2F0Y2hlcigpKTtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjaGVja3MucHVzaCh7XG4gICAgICAgIG5hbWU6IFwiUGxhdGZvcm0gd2F0Y2hlclwiLFxuICAgICAgICBzdGF0dXM6IFwid2FyblwiLFxuICAgICAgICBkZXRhaWw6IGB1bnN1cHBvcnRlZCBwbGF0Zm9ybTogJHtwbGF0Zm9ybSgpfWAsXG4gICAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBzdW1tYXJpemUoc3RhdGUud2F0Y2hlciA/PyBcIm5vbmVcIiwgY2hlY2tzKTtcbn1cblxuZnVuY3Rpb24gc2VsZlVwZGF0ZUNoZWNrKHN0YXRlOiBTZWxmVXBkYXRlU3RhdGUpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBjb25zdCBhdCA9IHN0YXRlLmNvbXBsZXRlZEF0ID8/IHN0YXRlLmNoZWNrZWRBdCA/PyBcInVua25vd24gdGltZVwiO1xuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcImZhaWxlZFwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLFxuICAgICAgc3RhdHVzOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogc3RhdGUuZXJyb3IgPyBgZmFpbGVkICR7YXR9OiAke3N0YXRlLmVycm9yfWAgOiBgZmFpbGVkICR7YXR9YCxcbiAgICB9O1xuICB9XG4gIGlmIChzdGF0ZS5zdGF0dXMgPT09IFwiZGlzYWJsZWRcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwid2FyblwiLCBkZXRhaWw6IGBza2lwcGVkICR7YXR9OiBhdXRvbWF0aWMgcmVmcmVzaCBkaXNhYmxlZGAgfTtcbiAgfVxuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwZGF0ZWRcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwib2tcIiwgZGV0YWlsOiBgdXBkYXRlZCAke2F0fSB0byAke3N0YXRlLmxhdGVzdFZlcnNpb24gPz8gXCJuZXcgcmVsZWFzZVwifWAgfTtcbiAgfVxuICBpZiAoc3RhdGUuc3RhdHVzID09PSBcInVwLXRvLWRhdGVcIikge1xuICAgIHJldHVybiB7IG5hbWU6IFwibGFzdCBDb2RleCsrIHVwZGF0ZVwiLCBzdGF0dXM6IFwib2tcIiwgZGV0YWlsOiBgdXAgdG8gZGF0ZSAke2F0fWAgfTtcbiAgfVxuICByZXR1cm4geyBuYW1lOiBcImxhc3QgQ29kZXgrKyB1cGRhdGVcIiwgc3RhdHVzOiBcIndhcm5cIiwgZGV0YWlsOiBgY2hlY2tpbmcgc2luY2UgJHthdH1gIH07XG59XG5cbmZ1bmN0aW9uIGNoZWNrTGF1bmNoZFdhdGNoZXIoYXBwUm9vdDogc3RyaW5nKTogV2F0Y2hlckhlYWx0aENoZWNrW10ge1xuICBjb25zdCBjaGVja3M6IFdhdGNoZXJIZWFsdGhDaGVja1tdID0gW107XG4gIGNvbnN0IHBsaXN0UGF0aCA9IGpvaW4oaG9tZWRpcigpLCBcIkxpYnJhcnlcIiwgXCJMYXVuY2hBZ2VudHNcIiwgYCR7TEFVTkNIRF9MQUJFTH0ucGxpc3RgKTtcbiAgY29uc3QgcGxpc3QgPSBleGlzdHNTeW5jKHBsaXN0UGF0aCkgPyByZWFkRmlsZVNhZmUocGxpc3RQYXRoKSA6IFwiXCI7XG4gIGNvbnN0IGFzYXJQYXRoID0gYXBwUm9vdCA/IGpvaW4oYXBwUm9vdCwgXCJDb250ZW50c1wiLCBcIlJlc291cmNlc1wiLCBcImFwcC5hc2FyXCIpIDogXCJcIjtcblxuICBjaGVja3MucHVzaCh7XG4gICAgbmFtZTogXCJsYXVuY2hkIHBsaXN0XCIsXG4gICAgc3RhdHVzOiBwbGlzdCA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IHBsaXN0UGF0aCxcbiAgfSk7XG5cbiAgaWYgKHBsaXN0KSB7XG4gICAgY2hlY2tzLnB1c2goe1xuICAgICAgbmFtZTogXCJsYXVuY2hkIGxhYmVsXCIsXG4gICAgICBzdGF0dXM6IHBsaXN0LmluY2x1ZGVzKExBVU5DSERfTEFCRUwpID8gXCJva1wiIDogXCJlcnJvclwiLFxuICAgICAgZGV0YWlsOiBMQVVOQ0hEX0xBQkVMLFxuICAgIH0pO1xuICAgIGNoZWNrcy5wdXNoKHtcbiAgICAgIG5hbWU6IFwibGF1bmNoZCB0cmlnZ2VyXCIsXG4gICAgICBzdGF0dXM6IGFzYXJQYXRoICYmIHBsaXN0LmluY2x1ZGVzKGFzYXJQYXRoKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogYXNhclBhdGggfHwgXCJtaXNzaW5nIGFwcFJvb3RcIixcbiAgICB9KTtcbiAgICBjaGVja3MucHVzaCh7XG4gICAgICBuYW1lOiBcIndhdGNoZXIgY29tbWFuZFwiLFxuICAgICAgc3RhdHVzOiBwbGlzdC5pbmNsdWRlcyhcIkNPREVYX1BMVVNQTFVTX1dBVENIRVI9MVwiKSAmJiBwbGlzdC5pbmNsdWRlcyhcIiB1cGRhdGUgLS13YXRjaGVyIC0tcXVpZXRcIilcbiAgICAgICAgPyBcIm9rXCJcbiAgICAgICAgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IGNvbW1hbmRTdW1tYXJ5KHBsaXN0KSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGNsaVBhdGggPSBleHRyYWN0Rmlyc3QocGxpc3QsIC8nKFteJ10qcGFja2FnZXNcXC9pbnN0YWxsZXJcXC9kaXN0XFwvY2xpXFwuanMpJy8pO1xuICAgIGlmIChjbGlQYXRoKSB7XG4gICAgICBjaGVja3MucHVzaCh7XG4gICAgICAgIG5hbWU6IFwicmVwYWlyIENMSVwiLFxuICAgICAgICBzdGF0dXM6IGV4aXN0c1N5bmMoY2xpUGF0aCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICAgIGRldGFpbDogY2xpUGF0aCxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGxvYWRlZCA9IGNvbW1hbmRTdWNjZWVkcyhcImxhdW5jaGN0bFwiLCBbXCJsaXN0XCIsIExBVU5DSERfTEFCRUxdKTtcbiAgY2hlY2tzLnB1c2goe1xuICAgIG5hbWU6IFwibGF1bmNoZCBsb2FkZWRcIixcbiAgICBzdGF0dXM6IGxvYWRlZCA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICBkZXRhaWw6IGxvYWRlZCA/IFwic2VydmljZSBpcyBsb2FkZWRcIiA6IFwibGF1bmNoY3RsIGNhbm5vdCBmaW5kIHRoZSB3YXRjaGVyXCIsXG4gIH0pO1xuXG4gIGNoZWNrcy5wdXNoKHdhdGNoZXJMb2dDaGVjaygpKTtcbiAgcmV0dXJuIGNoZWNrcztcbn1cblxuZnVuY3Rpb24gY2hlY2tTeXN0ZW1kV2F0Y2hlcihhcHBSb290OiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSB7XG4gIGNvbnN0IGRpciA9IGpvaW4oaG9tZWRpcigpLCBcIi5jb25maWdcIiwgXCJzeXN0ZW1kXCIsIFwidXNlclwiKTtcbiAgY29uc3Qgc2VydmljZSA9IGpvaW4oZGlyLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIuc2VydmljZVwiKTtcbiAgY29uc3QgdGltZXIgPSBqb2luKGRpciwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLnRpbWVyXCIpO1xuICBjb25zdCBwYXRoVW5pdCA9IGpvaW4oZGlyLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIucGF0aFwiKTtcbiAgY29uc3QgZXhwZWN0ZWRQYXRoID0gYXBwUm9vdCA/IGpvaW4oYXBwUm9vdCwgXCJyZXNvdXJjZXNcIiwgXCJhcHAuYXNhclwiKSA6IFwiXCI7XG4gIGNvbnN0IHBhdGhCb2R5ID0gZXhpc3RzU3luYyhwYXRoVW5pdCkgPyByZWFkRmlsZVNhZmUocGF0aFVuaXQpIDogXCJcIjtcblxuICByZXR1cm4gW1xuICAgIHtcbiAgICAgIG5hbWU6IFwic3lzdGVtZCBzZXJ2aWNlXCIsXG4gICAgICBzdGF0dXM6IGV4aXN0c1N5bmMoc2VydmljZSkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IHNlcnZpY2UsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcInN5c3RlbWQgdGltZXJcIixcbiAgICAgIHN0YXR1czogZXhpc3RzU3luYyh0aW1lcikgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IHRpbWVyLFxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogXCJzeXN0ZW1kIHBhdGhcIixcbiAgICAgIHN0YXR1czogcGF0aEJvZHkgJiYgZXhwZWN0ZWRQYXRoICYmIHBhdGhCb2R5LmluY2x1ZGVzKGV4cGVjdGVkUGF0aCkgPyBcIm9rXCIgOiBcImVycm9yXCIsXG4gICAgICBkZXRhaWw6IGV4cGVjdGVkUGF0aCB8fCBwYXRoVW5pdCxcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwicGF0aCB1bml0IGFjdGl2ZVwiLFxuICAgICAgc3RhdHVzOiBjb21tYW5kU3VjY2VlZHMoXCJzeXN0ZW1jdGxcIiwgW1wiLS11c2VyXCIsIFwiaXMtYWN0aXZlXCIsIFwiLS1xdWlldFwiLCBcImNvZGV4LXBsdXNwbHVzLXdhdGNoZXIucGF0aFwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJzeXN0ZW1jdGwgLS11c2VyIGlzLWFjdGl2ZSBjb2RleC1wbHVzcGx1cy13YXRjaGVyLnBhdGhcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6IFwidGltZXIgYWN0aXZlXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInN5c3RlbWN0bFwiLCBbXCItLXVzZXJcIiwgXCJpcy1hY3RpdmVcIiwgXCItLXF1aWV0XCIsIFwiY29kZXgtcGx1c3BsdXMtd2F0Y2hlci50aW1lclwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJzeXN0ZW1jdGwgLS11c2VyIGlzLWFjdGl2ZSBjb2RleC1wbHVzcGx1cy13YXRjaGVyLnRpbWVyXCIsXG4gICAgfSxcbiAgXTtcbn1cblxuZnVuY3Rpb24gY2hlY2tTY2hlZHVsZWRUYXNrV2F0Y2hlcigpOiBXYXRjaGVySGVhbHRoQ2hlY2tbXSB7XG4gIHJldHVybiBbXG4gICAge1xuICAgICAgbmFtZTogXCJsb2dvbiB0YXNrXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInNjaHRhc2tzLmV4ZVwiLCBbXCIvUXVlcnlcIiwgXCIvVE5cIiwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyXCJdKSA/IFwib2tcIiA6IFwiZXJyb3JcIixcbiAgICAgIGRldGFpbDogXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICBuYW1lOiBcImhvdXJseSB0YXNrXCIsXG4gICAgICBzdGF0dXM6IGNvbW1hbmRTdWNjZWVkcyhcInNjaHRhc2tzLmV4ZVwiLCBbXCIvUXVlcnlcIiwgXCIvVE5cIiwgXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLWhvdXJseVwiXSkgPyBcIm9rXCIgOiBcIndhcm5cIixcbiAgICAgIGRldGFpbDogXCJjb2RleC1wbHVzcGx1cy13YXRjaGVyLWhvdXJseVwiLFxuICAgIH0sXG4gIF07XG59XG5cbmZ1bmN0aW9uIHdhdGNoZXJMb2dDaGVjaygpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBpZiAoIWV4aXN0c1N5bmMoV0FUQ0hFUl9MT0cpKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogXCJ3YXRjaGVyIGxvZ1wiLCBzdGF0dXM6IFwid2FyblwiLCBkZXRhaWw6IFwibm8gd2F0Y2hlciBsb2cgeWV0XCIgfTtcbiAgfVxuICBjb25zdCB0YWlsID0gcmVhZEZpbGVTYWZlKFdBVENIRVJfTE9HKS5zcGxpdCgvXFxyP1xcbi8pLnNsaWNlKC00MCkuam9pbihcIlxcblwiKTtcbiAgcmV0dXJuIGFuYWx5emVXYXRjaGVyTG9nVGFpbCh0YWlsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFuYWx5emVXYXRjaGVyTG9nVGFpbCh0YWlsOiBzdHJpbmcpOiBXYXRjaGVySGVhbHRoQ2hlY2sge1xuICBjb25zdCBoYXNFcnJvciA9IC9cdTI3MTcgY29kZXgtcGx1c3BsdXMgZmFpbGVkfGNvZGV4LXBsdXNwbHVzIGZhaWxlZHxlcnJvcnxmYWlsZWQvaS50ZXN0KHRhaWwpO1xuICBjb25zdCBuZWVkc01hbnVhbFJlcGFpciA9XG4gICAgaGFzRXJyb3IgJiZcbiAgICAvQ2Fubm90IHdyaXRlIHRvIC4qQ29kZXguKlxcLmFwcHxBcHAgTWFuYWdlbWVudHxmaWxlIG93bmVyc2hpcHxzdWRvIGNvZGV4cGx1c3BsdXMgKD86aW5zdGFsbHxyZXBhaXIpfEVBQ0NFU3xFUEVSTS9pLnRlc3QodGFpbCk7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJ3YXRjaGVyIGxvZ1wiLFxuICAgIHN0YXR1czogaGFzRXJyb3IgPyBcIndhcm5cIiA6IFwib2tcIixcbiAgICBkZXRhaWw6IGhhc0Vycm9yXG4gICAgICA/IG5lZWRzTWFudWFsUmVwYWlyXG4gICAgICAgID8gXCJhdXRvLXJlcGFpciBuZWVkcyBhcHAgcGVybWlzc2lvbnM7IHJ1biBgY29kZXhwbHVzcGx1cyByZXBhaXJgIGZyb20gVGVybWluYWxcIlxuICAgICAgICA6IFwicmVjZW50IHdhdGNoZXIgbG9nIGNvbnRhaW5zIGFuIGVycm9yXCJcbiAgICAgIDogV0FUQ0hFUl9MT0csXG4gIH07XG59XG5cbmZ1bmN0aW9uIHN1bW1hcml6ZSh3YXRjaGVyOiBzdHJpbmcsIGNoZWNrczogV2F0Y2hlckhlYWx0aENoZWNrW10pOiBXYXRjaGVySGVhbHRoIHtcbiAgY29uc3QgaGFzRXJyb3IgPSBjaGVja3Muc29tZSgoYykgPT4gYy5zdGF0dXMgPT09IFwiZXJyb3JcIik7XG4gIGNvbnN0IGhhc1dhcm4gPSBjaGVja3Muc29tZSgoYykgPT4gYy5zdGF0dXMgPT09IFwid2FyblwiKTtcbiAgY29uc3Qgc3RhdHVzOiBDaGVja1N0YXR1cyA9IGhhc0Vycm9yID8gXCJlcnJvclwiIDogaGFzV2FybiA/IFwid2FyblwiIDogXCJva1wiO1xuICBjb25zdCBmYWlsZWQgPSBjaGVja3MuZmlsdGVyKChjKSA9PiBjLnN0YXR1cyA9PT0gXCJlcnJvclwiKS5sZW5ndGg7XG4gIGNvbnN0IHdhcm5lZCA9IGNoZWNrcy5maWx0ZXIoKGMpID0+IGMuc3RhdHVzID09PSBcIndhcm5cIikubGVuZ3RoO1xuICBjb25zdCB0aXRsZSA9XG4gICAgc3RhdHVzID09PSBcIm9rXCJcbiAgICAgID8gXCJBdXRvLXJlcGFpciB3YXRjaGVyIGlzIHJlYWR5XCJcbiAgICAgIDogc3RhdHVzID09PSBcIndhcm5cIlxuICAgICAgICA/IFwiQXV0by1yZXBhaXIgd2F0Y2hlciBuZWVkcyByZXZpZXdcIlxuICAgICAgICA6IFwiQXV0by1yZXBhaXIgd2F0Y2hlciBpcyBub3QgcmVhZHlcIjtcbiAgY29uc3Qgc3VtbWFyeSA9XG4gICAgc3RhdHVzID09PSBcIm9rXCJcbiAgICAgID8gXCJDb2RleCsrIHNob3VsZCBhdXRvbWF0aWNhbGx5IHJlcGFpciBpdHNlbGYgYWZ0ZXIgQ29kZXggdXBkYXRlcy5cIlxuICAgICAgOiBgJHtmYWlsZWR9IGZhaWxpbmcgY2hlY2socyksICR7d2FybmVkfSB3YXJuaW5nKHMpLmA7XG5cbiAgcmV0dXJuIHtcbiAgICBjaGVja2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBzdGF0dXMsXG4gICAgdGl0bGUsXG4gICAgc3VtbWFyeSxcbiAgICB3YXRjaGVyLFxuICAgIGNoZWNrcyxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29tbWFuZFN1Y2NlZWRzKGNvbW1hbmQ6IHN0cmluZywgYXJnczogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICBleGVjRmlsZVN5bmMoY29tbWFuZCwgYXJncywgeyBzdGRpbzogXCJpZ25vcmVcIiwgdGltZW91dDogNV8wMDAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb21tYW5kU3VtbWFyeShwbGlzdDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgY29tbWFuZCA9IGV4dHJhY3RGaXJzdChwbGlzdCwgLzxzdHJpbmc+KFtePF0qKD86dXBkYXRlIC0td2F0Y2hlciAtLXF1aWV0fHJlcGFpciAtLXF1aWV0KVtePF0qKTxcXC9zdHJpbmc+Lyk7XG4gIHJldHVybiBjb21tYW5kID8gdW5lc2NhcGVYbWwoY29tbWFuZCkucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpIDogXCJ3YXRjaGVyIGNvbW1hbmQgbm90IGZvdW5kXCI7XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RGaXJzdChzb3VyY2U6IHN0cmluZywgcGF0dGVybjogUmVnRXhwKTogc3RyaW5nIHwgbnVsbCB7XG4gIHJldHVybiBzb3VyY2UubWF0Y2gocGF0dGVybik/LlsxXSA/PyBudWxsO1xufVxuXG5mdW5jdGlvbiByZWFkSnNvbjxUPihwYXRoOiBzdHJpbmcpOiBUIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UocmVhZEZpbGVTeW5jKHBhdGgsIFwidXRmOFwiKSkgYXMgVDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEZpbGVTYWZlKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIHJlYWRGaWxlU3luYyhwYXRoLCBcInV0ZjhcIik7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVuZXNjYXBlWG1sKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvJnF1b3Q7L2csIFwiXFxcIlwiKVxuICAgIC5yZXBsYWNlKC8mYXBvczsvZywgXCInXCIpXG4gICAgLnJlcGxhY2UoLyZsdDsvZywgXCI8XCIpXG4gICAgLnJlcGxhY2UoLyZndDsvZywgXCI+XCIpXG4gICAgLnJlcGxhY2UoLyZhbXA7L2csIFwiJlwiKTtcbn1cbiIsICJleHBvcnQgdHlwZSBUd2Vha1Njb3BlID0gXCJyZW5kZXJlclwiIHwgXCJtYWluXCIgfCBcImJvdGhcIjtcblxuZXhwb3J0IGludGVyZmFjZSBSZWxvYWRUd2Vha3NEZXBzIHtcbiAgbG9nSW5mbyhtZXNzYWdlOiBzdHJpbmcpOiB2b2lkO1xuICBzdG9wQWxsTWFpblR3ZWFrcygpOiB2b2lkO1xuICBjbGVhclR3ZWFrTW9kdWxlQ2FjaGUoKTogdm9pZDtcbiAgbG9hZEFsbE1haW5Ud2Vha3MoKTogdm9pZDtcbiAgYnJvYWRjYXN0UmVsb2FkKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2V0VHdlYWtFbmFibGVkQW5kUmVsb2FkRGVwcyBleHRlbmRzIFJlbG9hZFR3ZWFrc0RlcHMge1xuICBzZXRUd2Vha0VuYWJsZWQoaWQ6IHN0cmluZywgZW5hYmxlZDogYm9vbGVhbik6IHZvaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01haW5Qcm9jZXNzVHdlYWtTY29wZShzY29wZTogVHdlYWtTY29wZSB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2NvcGUgIT09IFwicmVuZGVyZXJcIjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZFR3ZWFrcyhyZWFzb246IHN0cmluZywgZGVwczogUmVsb2FkVHdlYWtzRGVwcyk6IHZvaWQge1xuICBkZXBzLmxvZ0luZm8oYHJlbG9hZGluZyB0d2Vha3MgKCR7cmVhc29ufSlgKTtcbiAgZGVwcy5zdG9wQWxsTWFpblR3ZWFrcygpO1xuICBkZXBzLmNsZWFyVHdlYWtNb2R1bGVDYWNoZSgpO1xuICBkZXBzLmxvYWRBbGxNYWluVHdlYWtzKCk7XG4gIGRlcHMuYnJvYWRjYXN0UmVsb2FkKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRUd2Vha0VuYWJsZWRBbmRSZWxvYWQoXG4gIGlkOiBzdHJpbmcsXG4gIGVuYWJsZWQ6IHVua25vd24sXG4gIGRlcHM6IFNldFR3ZWFrRW5hYmxlZEFuZFJlbG9hZERlcHMsXG4pOiB0cnVlIHtcbiAgY29uc3Qgbm9ybWFsaXplZEVuYWJsZWQgPSAhIWVuYWJsZWQ7XG4gIGRlcHMuc2V0VHdlYWtFbmFibGVkKGlkLCBub3JtYWxpemVkRW5hYmxlZCk7XG4gIGRlcHMubG9nSW5mbyhgdHdlYWsgJHtpZH0gZW5hYmxlZD0ke25vcm1hbGl6ZWRFbmFibGVkfWApO1xuICByZWxvYWRUd2Vha3MoXCJlbmFibGVkLXRvZ2dsZVwiLCBkZXBzKTtcbiAgcmV0dXJuIHRydWU7XG59XG4iLCAiaW1wb3J0IHsgYXBwZW5kRmlsZVN5bmMsIGV4aXN0c1N5bmMsIHJlYWRGaWxlU3luYywgc3RhdFN5bmMsIHdyaXRlRmlsZVN5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuXG5leHBvcnQgY29uc3QgTUFYX0xPR19CWVRFUyA9IDEwICogMTAyNCAqIDEwMjQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDYXBwZWRMb2cocGF0aDogc3RyaW5nLCBsaW5lOiBzdHJpbmcsIG1heEJ5dGVzID0gTUFYX0xPR19CWVRFUyk6IHZvaWQge1xuICBjb25zdCBpbmNvbWluZyA9IEJ1ZmZlci5mcm9tKGxpbmUpO1xuICBpZiAoaW5jb21pbmcuYnl0ZUxlbmd0aCA+PSBtYXhCeXRlcykge1xuICAgIHdyaXRlRmlsZVN5bmMocGF0aCwgaW5jb21pbmcuc3ViYXJyYXkoaW5jb21pbmcuYnl0ZUxlbmd0aCAtIG1heEJ5dGVzKSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBpZiAoZXhpc3RzU3luYyhwYXRoKSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IHN0YXRTeW5jKHBhdGgpLnNpemU7XG4gICAgICBjb25zdCBhbGxvd2VkRXhpc3RpbmcgPSBtYXhCeXRlcyAtIGluY29taW5nLmJ5dGVMZW5ndGg7XG4gICAgICBpZiAoc2l6ZSA+IGFsbG93ZWRFeGlzdGluZykge1xuICAgICAgICBjb25zdCBleGlzdGluZyA9IHJlYWRGaWxlU3luYyhwYXRoKTtcbiAgICAgICAgd3JpdGVGaWxlU3luYyhwYXRoLCBleGlzdGluZy5zdWJhcnJheShNYXRoLm1heCgwLCBleGlzdGluZy5ieXRlTGVuZ3RoIC0gYWxsb3dlZEV4aXN0aW5nKSkpO1xuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCB7XG4gICAgLy8gSWYgdHJpbW1pbmcgZmFpbHMsIHN0aWxsIHRyeSB0byBhcHBlbmQgYmVsb3c7IGxvZ2dpbmcgbXVzdCBiZSBiZXN0LWVmZm9ydC5cbiAgfVxuXG4gIGFwcGVuZEZpbGVTeW5jKHBhdGgsIGluY29taW5nKTtcbn1cbiIsICJpbXBvcnQgeyBhcHAsIEJyb3dzZXJXaW5kb3cgfSBmcm9tIFwiZWxlY3Ryb25cIjtcbmltcG9ydCB7IGV4aXN0c1N5bmMgfSBmcm9tIFwibm9kZTpmc1wiO1xuaW1wb3J0IHsgZGlybmFtZSwgam9pbiB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB0eXBlIHtcbiAgQ29kZXhDZHBTdGF0dXMsXG4gIENvZGV4Q2RwVGFyZ2V0LFxuICBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXMsXG4gIENvZGV4UnVudGltZUluZm8sXG4gIENvZGV4UnVudGltZVR5cGUsXG59IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUnVudGltZVByb2JlT3B0aW9ucyB7XG4gIHVzZXJSb290OiBzdHJpbmc7XG4gIHJ1bnRpbWVEaXI6IHN0cmluZztcbiAgY29kZXhWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBjaGFubmVsOiBzdHJpbmcgfCBudWxsO1xuICBnZXRXaW5kb3dTZXJ2aWNlcygpOiB1bmtub3duIHwgbnVsbDtcbiAgZ2V0TmF0aXZlQ2FwYWJpbGl0aWVzPygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJuYXRpdmVcIl07XG4gIGdldFZpZXdDYXBhYmlsaXRpZXM/KCk6IENvZGV4UnVudGltZUNhcGFiaWxpdGllc1tcInZpZXdzXCJdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UnVudGltZUluZm8ob3B0czogUnVudGltZVByb2JlT3B0aW9ucyk6IENvZGV4UnVudGltZUluZm8ge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IGRldGVjdFJ1bnRpbWVUeXBlKCksXG4gICAgY29kZXhWZXJzaW9uOiBvcHRzLmNvZGV4VmVyc2lvbiA/PyBzYWZlQXBwVmVyc2lvbigpLFxuICAgIGNoYW5uZWw6IG9wdHMuY2hhbm5lbCxcbiAgICBidWlsZEZsYXZvcjogc2FmZUJ1aWxkRmxhdm9yKCksXG4gICAgdXNlc093bEFwcFNoZWxsOiBudWxsLFxuICAgIGFwcFBhdGg6IHNhZmVBcHBQYXRoKCksXG4gICAgcmVzb3VyY2VzUGF0aDogcHJvY2Vzcy5yZXNvdXJjZXNQYXRoID8/IG51bGwsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSdW50aW1lQ2FwYWJpbGl0aWVzKG9wdHM6IFJ1bnRpbWVQcm9iZU9wdGlvbnMpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXMge1xuICBjb25zdCBzZXJ2aWNlcyA9IGFzUmVjb3JkKG9wdHMuZ2V0V2luZG93U2VydmljZXMoKSk7XG4gIGNvbnN0IHdpbmRvd01hbmFnZXIgPSBhc1JlY29yZChzZXJ2aWNlcz8ud2luZG93TWFuYWdlcik7XG4gIGNvbnN0IGNkcCA9IGdldENkcFN0YXR1cygpO1xuICBjb25zdCBuYXRpdmUgPSBvcHRzLmdldE5hdGl2ZUNhcGFiaWxpdGllcz8uKCkgPz8gZGVmYXVsdE5hdGl2ZUNhcGFiaWxpdGllcygpO1xuICBjb25zdCB2aWV3cyA9IG9wdHMuZ2V0Vmlld0NhcGFiaWxpdGllcz8uKCkgPz8gZGVmYXVsdFZpZXdDYXBhYmlsaXRpZXMoKTtcbiAgY29uc3QgY2FuQ3JlYXRlV2luZG93ID0gdHlwZW9mIHdpbmRvd01hbmFnZXI/LmNyZWF0ZVdpbmRvdyA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgdHlwZW9mIHNlcnZpY2VzPy5jcmVhdGVGcmVzaFdpbmRvdyA9PT0gXCJmdW5jdGlvblwiIHx8XG4gICAgdHlwZW9mIHNlcnZpY2VzPy5jcmVhdGVGcmVzaExvY2FsV2luZG93ID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICB0eXBlb2Ygc2VydmljZXM/LmVuc3VyZUhvc3RXaW5kb3cgPT09IFwiZnVuY3Rpb25cIjtcbiAgcmV0dXJuIHtcbiAgICB3aW5kb3dzOiB7XG4gICAgICBjcmVhdGU6IGNhbkNyZWF0ZVdpbmRvdyxcbiAgICAgIGZvY3VzOiB0cnVlLFxuICAgICAgcHJpbWFyeTogdHlwZW9mIHNlcnZpY2VzPy5nZXRQcmltYXJ5V2luZG93ID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICAgdHlwZW9mIHdpbmRvd01hbmFnZXI/LmdldFByaW1hcnlXaW5kb3cgPT09IFwiZnVuY3Rpb25cIixcbiAgICAgIGJyb3dzZXJWaWV3OiB0eXBlb2Ygd2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cgPT09IFwiZnVuY3Rpb25cIixcbiAgICB9LFxuICAgIHZpZXdzLFxuICAgIGNkcDoge1xuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgICAgZW5hYmxlZDogY2RwLmVuYWJsZWQsXG4gICAgICBwb3J0OiBjZHAucG9ydCxcbiAgICB9LFxuICAgIG5hdGl2ZSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENkcFN0YXR1cygpOiBDb2RleENkcFN0YXR1cyB7XG4gIGNvbnN0IGVuYWJsZWQgPSBwcm9jZXNzLmVudi5DT0RFWFBQX1JFTU9URV9ERUJVRyA9PT0gXCIxXCI7XG4gIGNvbnN0IHBvcnQgPSBwYXJzZUNkcFBvcnQocHJvY2Vzcy5lbnYuQ09ERVhQUF9SRU1PVEVfREVCVUdfUE9SVCk7XG4gIHJldHVybiB7XG4gICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgIGVuYWJsZWQsXG4gICAgcG9ydDogZW5hYmxlZCA/IHBvcnQgOiBudWxsLFxuICAgIHVybDogZW5hYmxlZCA/IGBodHRwOi8vMTI3LjAuMC4xOiR7cG9ydH1gIDogbnVsbCxcbiAgfTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxpc3RDZHBUYXJnZXRzKCk6IFByb21pc2U8Q29kZXhDZHBUYXJnZXRbXT4ge1xuICBjb25zdCBzdGF0dXMgPSBnZXRDZHBTdGF0dXMoKTtcbiAgaWYgKCFzdGF0dXMuZW5hYmxlZCB8fCAhc3RhdHVzLnVybCkgcmV0dXJuIFtdO1xuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBjb250cm9sbGVyLmFib3J0KCksIDEwMDApO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKGAke3N0YXR1cy51cmx9L2pzb25gLCB7IHNpZ25hbDogY29udHJvbGxlci5zaWduYWwgfSk7XG4gICAgaWYgKCFyZXMub2spIHJldHVybiBbXTtcbiAgICBjb25zdCByb3dzID0gYXdhaXQgcmVzLmpzb24oKSBhcyB1bmtub3duO1xuICAgIGlmICghQXJyYXkuaXNBcnJheShyb3dzKSkgcmV0dXJuIFtdO1xuICAgIHJldHVybiByb3dzXG4gICAgICAubWFwKChyb3cpID0+IG5vcm1hbGl6ZUNkcFRhcmdldChyb3cpKVxuICAgICAgLmZpbHRlcigocm93KTogcm93IGlzIENvZGV4Q2RwVGFyZ2V0ID0+IHJvdyAhPT0gbnVsbCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBbXTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGV0ZWN0UnVudGltZVR5cGUoKTogQ29kZXhSdW50aW1lVHlwZSB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiKSB7XG4gICAgY29uc3QgYXBwUm9vdCA9IGluZmVyTWFjQXBwUm9vdCgpO1xuICAgIGlmIChhcHBSb290ICYmIGV4aXN0c1N5bmMoam9pbihhcHBSb290LCBcIkNvbnRlbnRzXCIsIFwiRnJhbWV3b3Jrc1wiLCBcIkNvZGV4IEZyYW1ld29yay5mcmFtZXdvcmtcIikpKSB7XG4gICAgICByZXR1cm4gXCJvd2xcIjtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgYXBwUm9vdCAmJlxuICAgICAgZXhpc3RzU3luYyhqb2luKGFwcFJvb3QsIFwiQ29udGVudHNcIiwgXCJGcmFtZXdvcmtzXCIsIFwiRWxlY3Ryb24gRnJhbWV3b3JrLmZyYW1ld29ya1wiKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBcImVsZWN0cm9uXCI7XG4gICAgfVxuICAgIGlmIChwcm9jZXNzLnJlc291cmNlc1BhdGggJiYgZXhpc3RzU3luYyhqb2luKHByb2Nlc3MucmVzb3VyY2VzUGF0aCwgXCJhcHAuYXNhclwiKSkpIHtcbiAgICAgIHJldHVybiBcImVsZWN0cm9uXCI7XG4gICAgfVxuICAgIHJldHVybiBcInVua25vd25cIjtcbiAgfVxuICByZXR1cm4gcHJvY2Vzcy5yZXNvdXJjZXNQYXRoICYmIGV4aXN0c1N5bmMoam9pbihwcm9jZXNzLnJlc291cmNlc1BhdGgsIFwiYXBwLmFzYXJcIikpXG4gICAgPyBcImVsZWN0cm9uXCJcbiAgICA6IFwidW5rbm93blwiO1xufVxuXG5mdW5jdGlvbiBpbmZlck1hY0FwcFJvb3QoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IG1hcmtlciA9IFwiLmFwcC9Db250ZW50cy9NYWNPUy9cIjtcbiAgY29uc3QgaWR4ID0gcHJvY2Vzcy5leGVjUGF0aC5pbmRleE9mKG1hcmtlcik7XG4gIHJldHVybiBpZHggPj0gMCA/IHByb2Nlc3MuZXhlY1BhdGguc2xpY2UoMCwgaWR4ICsgXCIuYXBwXCIubGVuZ3RoKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHNhZmVBcHBWZXJzaW9uKCk6IHN0cmluZyB8IG51bGwge1xuICB0cnkge1xuICAgIHJldHVybiBhcHAuZ2V0VmVyc2lvbigpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBzYWZlQXBwUGF0aCgpOiBzdHJpbmcgfCBudWxsIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXBwLmdldEFwcFBhdGgoKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIHByb2Nlc3MucmVzb3VyY2VzUGF0aCA/IGpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCBcImFwcC5hc2FyXCIpIDogbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBzYWZlQnVpbGRGbGF2b3IoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGFwcFBhdGggPSBzYWZlQXBwUGF0aCgpO1xuICBpZiAoIWFwcFBhdGgpIHJldHVybiBudWxsO1xuICBjb25zdCBwYXJlbnQgPSBkaXJuYW1lKGFwcFBhdGgpO1xuICBpZiAocGFyZW50LmluY2x1ZGVzKFwiTmlnaHRseVwiKSkgcmV0dXJuIFwibmlnaHRseVwiO1xuICByZXR1cm4gYXBwLmlzUGFja2FnZWQgPyBcInByb2RcIiA6IFwiZGV2XCI7XG59XG5cbmZ1bmN0aW9uIHBhcnNlQ2RwUG9ydCh2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkKTogbnVtYmVyIHtcbiAgY29uc3QgcGFyc2VkID0gTnVtYmVyKHZhbHVlID8/IFwiOTIyMlwiKTtcbiAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIocGFyc2VkKSAmJiBwYXJzZWQgPiAwICYmIHBhcnNlZCA8IDY1NTM2ID8gcGFyc2VkIDogOTIyMjtcbn1cblxuZnVuY3Rpb24gZGVmYXVsdE5hdGl2ZUNhcGFiaWxpdGllcygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJuYXRpdmVcIl0ge1xuICByZXR1cm4ge1xuICAgIGluUHJvY2Vzc01vZHVsZXM6IHRydWUsXG4gICAgc3dpZnRNb2R1bGVzOiBwcm9jZXNzLnBsYXRmb3JtID09PSBcImRhcndpblwiLFxuICAgIGFwcEtpdEVtYmVkZGluZzogZmFsc2UsXG4gICAgY2hpbGRXaW5kb3dPdmVybGF5OiBmYWxzZSxcbiAgICBkaXJlY3RWaWV3QXR0YWNoOiBmYWxzZSxcbiAgICBtZXRhbFZpZXdzOiBmYWxzZSxcbiAgICBuYXRpdmVIb3N0OiBmYWxzZSxcbiAgICBoZWxwZXJzOiB0cnVlLFxuICB9O1xufVxuXG5mdW5jdGlvbiBkZWZhdWx0Vmlld0NhcGFiaWxpdGllcygpOiBDb2RleFJ1bnRpbWVDYXBhYmlsaXRpZXNbXCJ2aWV3c1wiXSB7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlOiBmYWxzZSxcbiAgICBwcml2YXRlVmlld1RyZWU6IGZhbHNlLFxuICAgIHdlYkNvbnRlbnRzVmlldzogZmFsc2UsXG4gICAgYnJvd3NlclZpZXdGYWxsYmFjazogdHlwZW9mIEJyb3dzZXJXaW5kb3cuZnJvbUlkID09PSBcImZ1bmN0aW9uXCIsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZUNkcFRhcmdldChyb3c6IHVua25vd24pOiBDb2RleENkcFRhcmdldCB8IG51bGwge1xuICBjb25zdCB2YWx1ZSA9IGFzUmVjb3JkKHJvdyk7XG4gIGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlLmlkICE9PSBcInN0cmluZ1wiIHx8IHR5cGVvZiB2YWx1ZS50eXBlICE9PSBcInN0cmluZ1wiIHx8IHR5cGVvZiB2YWx1ZS51cmwgIT09IFwic3RyaW5nXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiB2YWx1ZS5pZCxcbiAgICB0eXBlOiB2YWx1ZS50eXBlLFxuICAgIHVybDogdmFsdWUudXJsLFxuICAgIC4uLih0eXBlb2YgdmFsdWUudGl0bGUgPT09IFwic3RyaW5nXCIgPyB7IHRpdGxlOiB2YWx1ZS50aXRsZSB9IDoge30pLFxuICAgIC4uLih0eXBlb2YgdmFsdWUud2ViU29ja2V0RGVidWdnZXJVcmwgPT09IFwic3RyaW5nXCJcbiAgICAgID8geyB3ZWJTb2NrZXREZWJ1Z2dlclVybDogdmFsdWUud2ViU29ja2V0RGVidWdnZXJVcmwgfVxuICAgICAgOiB7fSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIGFzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IDogbnVsbDtcbn1cbiIsICJpbXBvcnQgeyBCcm93c2VyV2luZG93IH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgeyBzcGF3biwgdHlwZSBDaGlsZFByb2Nlc3NXaXRob3V0TnVsbFN0cmVhbXMgfSBmcm9tIFwibm9kZTpjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyByYW5kb21VVUlEIH0gZnJvbSBcIm5vZGU6Y3J5cHRvXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGNyZWF0ZUludGVyZmFjZSB9IGZyb20gXCJub2RlOnJlYWRsaW5lXCI7XG5pbXBvcnQgeyByZXNvbHZlTmF0aXZlVHdlYWtQYXRoIH0gZnJvbSBcIi4vbmF0aXZlLXBhdGhzXCI7XG5pbXBvcnQgdHlwZSB7XG4gIENvZGV4UnVudGltZUNhcGFiaWxpdGllcyxcbiAgTmF0aXZlSGVscGVyTGF1bmNoT3B0aW9ucyxcbiAgTmF0aXZlSGVscGVyUmVmLFxuICBOYXRpdmVNb2R1bGVLaW5kLFxuICBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucyxcbiAgTmF0aXZlTW9kdWxlUmVmLFxuICBOYXRpdmVQYW5lbENyZWF0ZU9wdGlvbnMsXG4gIE5hdGl2ZVBhbmVsUmVmLFxuICBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucyxcbiAgTmF0aXZlVmlld1JlZixcbn0gZnJvbSBcIkBjb2RleC1wbHVzcGx1cy9zZGtcIjtcblxuZXhwb3J0IGludGVyZmFjZSBOYXRpdmVUd2Vha0NvbnRleHQge1xuICBpZDogc3RyaW5nO1xuICBkaXI6IHN0cmluZztcbn1cblxudHlwZSBOYXRpdmVMb2cgPSAobGV2ZWw6IFwiaW5mb1wiIHwgXCJ3YXJuXCIgfCBcImVycm9yXCIsIC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBOYXRpdmVCcmlkZ2VPcHRpb25zIHtcbiAgbmF0aXZlSG9zdFBhdGg/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBMb2FkZWROYXRpdmVNb2R1bGUge1xuICBrZXk6IHN0cmluZztcbiAgdHdlYWtJZDogc3RyaW5nO1xuICBpZDogc3RyaW5nO1xuICBraW5kOiBOYXRpdmVNb2R1bGVLaW5kO1xuICBwYXRoOiBzdHJpbmc7XG4gIGV4cG9ydHM6IHVua25vd247XG59XG5cbmludGVyZmFjZSBOYXRpdmVJbnN0YW5jZSB7XG4gIGtleTogc3RyaW5nO1xuICB0d2Vha0lkOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIGtpbmQ6IFwicGFuZWxcIiB8IFwidmlld1wiO1xuICB2YWx1ZTogdW5rbm93bjtcbiAgcGFyZW50V2luZG93SWQ6IG51bWJlciB8IG51bGw7XG4gIHdpbmRvd0lkOiBudW1iZXIgfCBudWxsO1xuICBkaXNwb3NlQmluZGluZ3M6IEFycmF5PCgpID0+IHZvaWQ+O1xuICBkaXNwb3Npbmc6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBIZWxwZXJSZXF1ZXN0IHtcbiAgcmVzb2x2ZSh2YWx1ZTogdW5rbm93bik6IHZvaWQ7XG4gIHJlamVjdChlcnJvcjogRXJyb3IpOiB2b2lkO1xuICB0aW1lcjogTm9kZUpTLlRpbWVvdXQ7XG59XG5cbmludGVyZmFjZSBOYXRpdmVIZWxwZXJQcm9jZXNzIHtcbiAga2V5OiBzdHJpbmc7XG4gIHR3ZWFrSWQ6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAgY2hpbGQ6IENoaWxkUHJvY2Vzc1dpdGhvdXROdWxsU3RyZWFtcztcbiAgcGVuZGluZzogTWFwPHN0cmluZywgSGVscGVyUmVxdWVzdD47XG59XG5cbmV4cG9ydCBjbGFzcyBOYXRpdmVCcmlkZ2Uge1xuICBwcml2YXRlIG1vZHVsZXMgPSBuZXcgTWFwPHN0cmluZywgTG9hZGVkTmF0aXZlTW9kdWxlPigpO1xuICBwcml2YXRlIGluc3RhbmNlcyA9IG5ldyBNYXA8c3RyaW5nLCBOYXRpdmVJbnN0YW5jZT4oKTtcbiAgcHJpdmF0ZSBoZWxwZXJzID0gbmV3IE1hcDxzdHJpbmcsIE5hdGl2ZUhlbHBlclByb2Nlc3M+KCk7XG4gIHByaXZhdGUgbmF0aXZlSG9zdEV4cG9ydHM6IHVua25vd24gfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBuYXRpdmVIb3N0TG9hZEVycm9yOiBFcnJvciB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgbG9nOiBOYXRpdmVMb2csXG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRpb25zOiBOYXRpdmVCcmlkZ2VPcHRpb25zID0ge30sXG4gICkge31cblxuICBnZXRDYXBhYmlsaXRpZXMoKTogQ29kZXhSdW50aW1lQ2FwYWJpbGl0aWVzW1wibmF0aXZlXCJdIHtcbiAgICBjb25zdCBob3N0ID0gdGhpcy5sb2FkTmF0aXZlSG9zdChmYWxzZSk7XG4gICAgY29uc3QgaG9zdENhcGFiaWxpdGllcyA9IGhvc3QgPyB0aGlzLnJlYWROYXRpdmVIb3N0Q2FwYWJpbGl0aWVzKGhvc3QpIDoge307XG4gICAgY29uc3QgbmF0aXZlSG9zdCA9IGhvc3QgIT09IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgIGluUHJvY2Vzc01vZHVsZXM6IHRydWUsXG4gICAgICBzd2lmdE1vZHVsZXM6IHByb2Nlc3MucGxhdGZvcm0gPT09IFwiZGFyd2luXCIsXG4gICAgICBhcHBLaXRFbWJlZGRpbmc6IEJvb2xlYW4oaG9zdENhcGFiaWxpdGllcy5hcHBLaXRFbWJlZGRpbmcpLFxuICAgICAgY2hpbGRXaW5kb3dPdmVybGF5OiBCb29sZWFuKGhvc3RDYXBhYmlsaXRpZXMuY2hpbGRXaW5kb3dPdmVybGF5KSxcbiAgICAgIGRpcmVjdFZpZXdBdHRhY2g6IEJvb2xlYW4oaG9zdENhcGFiaWxpdGllcy5kaXJlY3RWaWV3QXR0YWNoKSxcbiAgICAgIG1ldGFsVmlld3M6IEJvb2xlYW4oaG9zdENhcGFiaWxpdGllcy5tZXRhbFZpZXdzKSxcbiAgICAgIG5hdGl2ZUhvc3QsXG4gICAgICBoZWxwZXJzOiB0cnVlLFxuICAgIH07XG4gIH1cblxuICBsb2FkTW9kdWxlKGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LCBvcHRpb25zOiBOYXRpdmVNb2R1bGVMb2FkT3B0aW9ucyk6IE5hdGl2ZU1vZHVsZVJlZiB7XG4gICAgY29uc3QgaWQgPSBhc3NlcnRCcmlkZ2VJZChvcHRpb25zLmlkLCBcIm5hdGl2ZSBtb2R1bGUgaWRcIik7XG4gICAgY29uc3QgZnVsbFBhdGggPSByZXNvbHZlVHdlYWtQYXRoKGN0eCwgb3B0aW9ucy5wYXRoKTtcbiAgICBjb25zdCBraW5kID0gb3B0aW9ucy5raW5kID8/IGluZmVyTW9kdWxlS2luZChmdWxsUGF0aCk7XG5cbiAgICBpZiAoa2luZCAhPT0gXCJub2RlLWFkZG9uXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYCR7a2luZH0gbmF0aXZlIG1vZHVsZXMgbXVzdCBiZSBsb2FkZWQgdGhyb3VnaCBhIC5ub2RlIE9iamVjdGl2ZS1DKysgc2hpbSBpbiBDb2RleCsrIDEuMC4wYCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKCFmdWxsUGF0aC5lbmRzV2l0aChcIi5ub2RlXCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJub2RlLWFkZG9uIG5hdGl2ZSBtb2R1bGVzIG11c3QgdXNlIGEgLm5vZGUgZmlsZVwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBsb2FkZWQgPSByZXF1aXJlKGZ1bGxQYXRoKSBhcyB1bmtub3duO1xuICAgIGNvbnN0IGV4cG9ydHMgPSBzZWxlY3RFbnRyeXBvaW50KGxvYWRlZCwgb3B0aW9ucy5lbnRyeXBvaW50KTtcbiAgICBjb25zdCBrZXkgPSBtb2R1bGVLZXkoY3R4LmlkLCBpZCk7XG4gICAgdGhpcy5tb2R1bGVzLnNldChrZXksIHsga2V5LCB0d2Vha0lkOiBjdHguaWQsIGlkLCBraW5kLCBwYXRoOiBmdWxsUGF0aCwgZXhwb3J0cyB9KTtcbiAgICB0aGlzLmxvZyhcImluZm9cIiwgYGxvYWRlZCBuYXRpdmUgbW9kdWxlICR7Y3R4LmlkfToke2lkfWAsIHsga2luZCwgcGF0aDogZnVsbFBhdGggfSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlUmVmKGN0eC5pZCwgaWQsIGtpbmQpO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlUGFuZWwoY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsIG9wdGlvbnM6IE5hdGl2ZVBhbmVsQ3JlYXRlT3B0aW9ucyk6IFByb21pc2U8TmF0aXZlUGFuZWxSZWY+IHtcbiAgICBjb25zdCBjcmVhdGVkID0gYXdhaXQgdGhpcy5jcmVhdGVOYXRpdmVJbnN0YW5jZShjdHgsIFwicGFuZWxcIiwgb3B0aW9ucy5tb2R1bGVJZCwgb3B0aW9ucy5mYWN0b3J5ID8/IFwiY3JlYXRlUGFuZWxcIiwge1xuICAgICAgcGFyZW50V2luZG93SWQ6IG9wdGlvbnMucGFyZW50V2luZG93SWQsXG4gICAgICBib3VuZHM6IG9wdGlvbnMuYm91bmRzLFxuICAgICAgdHJhbnNwYXJlbnQ6IG9wdGlvbnMudHJhbnNwYXJlbnQgPT09IHRydWUsXG4gICAgICBwYXNzdGhyb3VnaE1vdXNlOiBvcHRpb25zLnBhc3N0aHJvdWdoTW91c2UgPT09IHRydWUsXG4gICAgfSk7XG4gICAgcmV0dXJuIHRoaXMucGFuZWxSZWYoY3JlYXRlZCk7XG4gIH1cblxuICBhc3luYyBhdHRhY2hWaWV3KGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LCBvcHRpb25zOiBOYXRpdmVWaWV3QXR0YWNoT3B0aW9ucyk6IFByb21pc2U8TmF0aXZlVmlld1JlZj4ge1xuICAgIGNvbnN0IGNyZWF0ZWQgPSBhd2FpdCB0aGlzLmNyZWF0ZU5hdGl2ZUluc3RhbmNlKGN0eCwgXCJ2aWV3XCIsIG9wdGlvbnMubW9kdWxlSWQsIG9wdGlvbnMuZmFjdG9yeSA/PyBcImF0dGFjaFZpZXdcIiwge1xuICAgICAgcGFyZW50V2luZG93SWQ6IG9wdGlvbnMucGFyZW50V2luZG93SWQsXG4gICAgICBib3VuZHM6IG9wdGlvbnMuYm91bmRzLFxuICAgICAgekluZGV4OiBvcHRpb25zLnpJbmRleCxcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcy52aWV3UmVmKGNyZWF0ZWQpO1xuICB9XG5cbiAgbGF1bmNoSGVscGVyKGN0eDogTmF0aXZlVHdlYWtDb250ZXh0LCBvcHRpb25zOiBOYXRpdmVIZWxwZXJMYXVuY2hPcHRpb25zKTogTmF0aXZlSGVscGVyUmVmIHtcbiAgICBjb25zdCBpZCA9IGFzc2VydEJyaWRnZUlkKG9wdGlvbnMuaWQsIFwibmF0aXZlIGhlbHBlciBpZFwiKTtcbiAgICBpZiAoKG9wdGlvbnMudHJhbnNwb3J0ID8/IFwic3RkaW9cIikgIT09IFwic3RkaW9cIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwibmF0aXZlIGhlbHBlcnMgc3VwcG9ydCBvbmx5IHN0ZGlvIHRyYW5zcG9ydCBpbiBDb2RleCsrIDEuMC4wXCIpO1xuICAgIH1cbiAgICBpZiAoKG9wdGlvbnMucmVzdGFydCA/PyBcIm5ldmVyXCIpICE9PSBcIm5ldmVyXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBoZWxwZXIgcmVzdGFydCBwb2xpY2llcyBhcmUgbm90IGF2YWlsYWJsZSBpbiBDb2RleCsrIDEuMC4wXCIpO1xuICAgIH1cbiAgICBjb25zdCBleGVjdXRhYmxlID0gcmVzb2x2ZVR3ZWFrUGF0aChjdHgsIG9wdGlvbnMuZXhlY3V0YWJsZSk7XG4gICAgY29uc3QgYXJncyA9IG9wdGlvbnMuYXJncyA/PyBbXTtcbiAgICBjb25zdCBlbnYgPSB7IC4uLnByb2Nlc3MuZW52LCAuLi4ob3B0aW9ucy5lbnYgPz8ge30pIH07XG4gICAgY29uc3QgY2hpbGQgPSBzcGF3bihleGVjdXRhYmxlLCBhcmdzLCB7XG4gICAgICBjd2Q6IGN0eC5kaXIsXG4gICAgICBlbnYsXG4gICAgICBzdGRpbzogW1wicGlwZVwiLCBcInBpcGVcIiwgXCJwaXBlXCJdLFxuICAgIH0pO1xuICAgIGNvbnN0IGtleSA9IGhlbHBlcktleShjdHguaWQsIGlkKTtcbiAgICBjb25zdCBoZWxwZXI6IE5hdGl2ZUhlbHBlclByb2Nlc3MgPSB7XG4gICAgICBrZXksXG4gICAgICB0d2Vha0lkOiBjdHguaWQsXG4gICAgICBpZCxcbiAgICAgIGNoaWxkLFxuICAgICAgcGVuZGluZzogbmV3IE1hcCgpLFxuICAgIH07XG4gICAgdGhpcy5oZWxwZXJzLnNldChrZXksIGhlbHBlcik7XG5cbiAgICBjb25zdCBzdGRvdXQgPSBjcmVhdGVJbnRlcmZhY2UoeyBpbnB1dDogY2hpbGQuc3Rkb3V0IH0pO1xuICAgIHN0ZG91dC5vbihcImxpbmVcIiwgKGxpbmUpID0+IHRoaXMuaGFuZGxlSGVscGVyTGluZShoZWxwZXIsIGxpbmUpKTtcbiAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xuICAgICAgdGhpcy5sb2coXCJ3YXJuXCIsIGBuYXRpdmUgaGVscGVyICR7Y3R4LmlkfToke2lkfSBzdGRlcnJgLCBTdHJpbmcoY2h1bmspKTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbihcImV4aXRcIiwgKGNvZGUsIHNpZ25hbCkgPT4ge1xuICAgICAgdGhpcy5sb2coXCJpbmZvXCIsIGBuYXRpdmUgaGVscGVyICR7Y3R4LmlkfToke2lkfSBleGl0ZWRgLCB7IGNvZGUsIHNpZ25hbCB9KTtcbiAgICAgIHRoaXMuaGVscGVycy5kZWxldGUoa2V5KTtcbiAgICAgIGZvciAoY29uc3QgcmVxdWVzdCBvZiBoZWxwZXIucGVuZGluZy52YWx1ZXMoKSkge1xuICAgICAgICBjbGVhclRpbWVvdXQocmVxdWVzdC50aW1lcik7XG4gICAgICAgIHJlcXVlc3QucmVqZWN0KG5ldyBFcnJvcihgbmF0aXZlIGhlbHBlciBleGl0ZWQgYmVmb3JlIHJlc3BvbnNlYCkpO1xuICAgICAgfVxuICAgICAgaGVscGVyLnBlbmRpbmcuY2xlYXIoKTtcbiAgICB9KTtcbiAgICBjaGlsZC5vbihcImVycm9yXCIsIChlcnJvcikgPT4ge1xuICAgICAgdGhpcy5sb2coXCJlcnJvclwiLCBgbmF0aXZlIGhlbHBlciAke2N0eC5pZH06JHtpZH0gZmFpbGVkYCwgZXJyb3IpO1xuICAgICAgdGhpcy5oZWxwZXJzLmRlbGV0ZShrZXkpO1xuICAgICAgZm9yIChjb25zdCByZXF1ZXN0IG9mIGhlbHBlci5wZW5kaW5nLnZhbHVlcygpKSB7XG4gICAgICAgIGNsZWFyVGltZW91dChyZXF1ZXN0LnRpbWVyKTtcbiAgICAgICAgcmVxdWVzdC5yZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgICAgaGVscGVyLnBlbmRpbmcuY2xlYXIoKTtcbiAgICB9KTtcblxuICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgbGF1bmNoZWQgbmF0aXZlIGhlbHBlciAke2N0eC5pZH06JHtpZH1gLCB7IHBpZDogY2hpbGQucGlkLCBleGVjdXRhYmxlIH0pO1xuICAgIHJldHVybiB0aGlzLmhlbHBlclJlZihjdHguaWQsIGlkLCBjaGlsZC5waWQgPz8gLTEpO1xuICB9XG5cbiAgZGlzcG9zZVR3ZWFrKHR3ZWFrSWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGZvciAoY29uc3QgW2tleSwgaW5zdGFuY2VdIG9mIFsuLi50aGlzLmluc3RhbmNlc10pIHtcbiAgICAgIGlmIChpbnN0YW5jZS50d2Vha0lkICE9PSB0d2Vha0lkKSBjb250aW51ZTtcbiAgICAgIHZvaWQgdGhpcy5kaXNwb3NlSW5zdGFuY2UoaW5zdGFuY2UpLmZpbmFsbHkoKCkgPT4gdGhpcy5pbnN0YW5jZXMuZGVsZXRlKGtleSkpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrZXksIGhlbHBlcl0gb2YgWy4uLnRoaXMuaGVscGVyc10pIHtcbiAgICAgIGlmIChoZWxwZXIudHdlYWtJZCAhPT0gdHdlYWtJZCkgY29udGludWU7XG4gICAgICB0aGlzLnN0b3BIZWxwZXIoaGVscGVyKTtcbiAgICAgIHRoaXMuaGVscGVycy5kZWxldGUoa2V5KTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBba2V5LCBtb2RdIG9mIFsuLi50aGlzLm1vZHVsZXNdKSB7XG4gICAgICBpZiAobW9kLnR3ZWFrSWQgIT09IHR3ZWFrSWQpIGNvbnRpbnVlO1xuICAgICAgdm9pZCBjYWxsT3B0aW9uYWwobW9kLmV4cG9ydHMsIFwiZGlzcG9zZVwiLCBbXSk7XG4gICAgICB0aGlzLm1vZHVsZXMuZGVsZXRlKGtleSk7XG4gICAgfVxuICB9XG5cbiAgZGlzcG9zZUFsbCgpOiB2b2lkIHtcbiAgICBjb25zdCB0d2Vha0lkcyA9IG5ldyBTZXQoW1xuICAgICAgLi4uWy4uLnRoaXMubW9kdWxlcy52YWx1ZXMoKV0ubWFwKChpdGVtKSA9PiBpdGVtLnR3ZWFrSWQpLFxuICAgICAgLi4uWy4uLnRoaXMuaW5zdGFuY2VzLnZhbHVlcygpXS5tYXAoKGl0ZW0pID0+IGl0ZW0udHdlYWtJZCksXG4gICAgICAuLi5bLi4udGhpcy5oZWxwZXJzLnZhbHVlcygpXS5tYXAoKGl0ZW0pID0+IGl0ZW0udHdlYWtJZCksXG4gICAgXSk7XG4gICAgZm9yIChjb25zdCBpZCBvZiB0d2Vha0lkcykgdGhpcy5kaXNwb3NlVHdlYWsoaWQpO1xuICB9XG5cbiAgYXN5bmMgY2FsbEluc3RhbmNlKFxuICAgIHR3ZWFrSWQ6IHN0cmluZyxcbiAgICBraW5kOiBcInBhbmVsXCIgfCBcInZpZXdcIixcbiAgICBpZDogc3RyaW5nLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIGFyZz86IHVua25vd24sXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmIChraW5kID09PSBcInBhbmVsXCIpIHtcbiAgICAgIGlmIChtZXRob2QgPT09IFwic2V0Qm91bmRzXCIpIHJldHVybiB0aGlzLmludm9rZUluc3RhbmNlKHR3ZWFrSWQsIGlkLCBcInNldEJvdW5kc1wiLCBbYXJnXSk7XG4gICAgICBpZiAobWV0aG9kID09PSBcInNob3dcIikgcmV0dXJuIHRoaXMuaW52b2tlSW5zdGFuY2UodHdlYWtJZCwgaWQsIFwic2hvd1wiLCBbXSk7XG4gICAgICBpZiAobWV0aG9kID09PSBcImhpZGVcIikgcmV0dXJuIHRoaXMuaW52b2tlSW5zdGFuY2UodHdlYWtJZCwgaWQsIFwiaGlkZVwiLCBbXSk7XG4gICAgICBpZiAobWV0aG9kID09PSBcImRpc3Bvc2VcIikgcmV0dXJuIHRoaXMuZGlzcG9zZUluc3RhbmNlQnlJZCh0d2Vha0lkLCBpZCk7XG4gICAgfVxuICAgIGlmIChraW5kID09PSBcInZpZXdcIikge1xuICAgICAgaWYgKG1ldGhvZCA9PT0gXCJzZXRCb3VuZHNcIikgcmV0dXJuIHRoaXMuaW52b2tlSW5zdGFuY2UodHdlYWtJZCwgaWQsIFwic2V0Qm91bmRzXCIsIFthcmddKTtcbiAgICAgIGlmIChtZXRob2QgPT09IFwic2V0VmlzaWJsZVwiKSByZXR1cm4gdGhpcy5pbnZva2VJbnN0YW5jZSh0d2Vha0lkLCBpZCwgXCJzZXRWaXNpYmxlXCIsIFthcmddKTtcbiAgICAgIGlmIChtZXRob2QgPT09IFwiZGlzcG9zZVwiKSByZXR1cm4gdGhpcy5kaXNwb3NlSW5zdGFuY2VCeUlkKHR3ZWFrSWQsIGlkKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIG5hdGl2ZSAke2tpbmR9IG1ldGhvZDogJHttZXRob2R9YCk7XG4gIH1cblxuICBhc3luYyBjYWxsSGVscGVyKFxuICAgIHR3ZWFrSWQ6IHN0cmluZyxcbiAgICBoZWxwZXJJZDogc3RyaW5nLFxuICAgIG1ldGhvZDogc3RyaW5nLFxuICAgIHBheWxvYWQ/OiB1bmtub3duLFxuICAgIHRpbWVvdXRNcz86IG51bWJlcixcbiAgKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJzZW5kXCIpIHJldHVybiB0aGlzLnNlbmRIZWxwZXIodHdlYWtJZCwgaGVscGVySWQsIHBheWxvYWQpO1xuICAgIGlmIChtZXRob2QgPT09IFwicmVxdWVzdFwiKSByZXR1cm4gdGhpcy5yZXF1ZXN0SGVscGVyKHR3ZWFrSWQsIGhlbHBlcklkLCBwYXlsb2FkLCB0aW1lb3V0TXMpO1xuICAgIGlmIChtZXRob2QgPT09IFwic3RvcFwiKSByZXR1cm4gdGhpcy5zdG9wSGVscGVyQnlJZCh0d2Vha0lkLCBoZWxwZXJJZCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKGB1bmtub3duIG5hdGl2ZSBoZWxwZXIgbWV0aG9kOiAke21ldGhvZH1gKTtcbiAgfVxuXG4gIHByaXZhdGUgbW9kdWxlUmVmKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZywga2luZCA9IHRoaXMubW9kdWxlRm9yKHR3ZWFrSWQsIGlkKS5raW5kKTogTmF0aXZlTW9kdWxlUmVmIHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQsXG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdDogKG1ldGhvZCwgcGF5bG9hZCwgdGltZW91dE1zKSA9PlxuICAgICAgICB0aGlzLnJlcXVlc3RNb2R1bGUodHdlYWtJZCwgaWQsIG1ldGhvZCwgcGF5bG9hZCwgdGltZW91dE1zKSxcbiAgICAgIGRpc3Bvc2U6ICgpID0+IHRoaXMuZGlzcG9zZU1vZHVsZSh0d2Vha0lkLCBpZCksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgcGFuZWxSZWYoaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlKTogTmF0aXZlUGFuZWxSZWYge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogaW5zdGFuY2UuaWQsXG4gICAgICB3aW5kb3dJZDogaW5zdGFuY2Uud2luZG93SWQsXG4gICAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+IHRoaXMuaW52b2tlSW5zdGFuY2UoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQsIFwic2V0Qm91bmRzXCIsIFtib3VuZHNdKSxcbiAgICAgIHNob3c6ICgpID0+IHRoaXMuaW52b2tlSW5zdGFuY2UoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQsIFwic2hvd1wiLCBbXSksXG4gICAgICBoaWRlOiAoKSA9PiB0aGlzLmludm9rZUluc3RhbmNlKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkLCBcImhpZGVcIiwgW10pLFxuICAgICAgZGlzcG9zZTogKCkgPT4gdGhpcy5kaXNwb3NlSW5zdGFuY2VCeUlkKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkKSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSB2aWV3UmVmKGluc3RhbmNlOiBOYXRpdmVJbnN0YW5jZSk6IE5hdGl2ZVZpZXdSZWYge1xuICAgIHJldHVybiB7XG4gICAgICBpZDogaW5zdGFuY2UuaWQsXG4gICAgICBzZXRCb3VuZHM6IChib3VuZHMpID0+IHRoaXMuaW52b2tlSW5zdGFuY2UoaW5zdGFuY2UudHdlYWtJZCwgaW5zdGFuY2UuaWQsIFwic2V0Qm91bmRzXCIsIFtib3VuZHNdKSxcbiAgICAgIHNldFZpc2libGU6ICh2aXNpYmxlKSA9PiB0aGlzLmludm9rZUluc3RhbmNlKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkLCBcInNldFZpc2libGVcIiwgW3Zpc2libGVdKSxcbiAgICAgIGRpc3Bvc2U6ICgpID0+IHRoaXMuZGlzcG9zZUluc3RhbmNlQnlJZChpbnN0YW5jZS50d2Vha0lkLCBpbnN0YW5jZS5pZCksXG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaGVscGVyUmVmKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZywgcGlkOiBudW1iZXIpOiBOYXRpdmVIZWxwZXJSZWYge1xuICAgIHJldHVybiB7XG4gICAgICBpZCxcbiAgICAgIHBpZCxcbiAgICAgIHNlbmQ6IChtZXNzYWdlKSA9PiB0aGlzLnNlbmRIZWxwZXIodHdlYWtJZCwgaWQsIG1lc3NhZ2UpLFxuICAgICAgcmVxdWVzdDogKG1lc3NhZ2UsIHRpbWVvdXRNcykgPT4gdGhpcy5yZXF1ZXN0SGVscGVyKHR3ZWFrSWQsIGlkLCBtZXNzYWdlLCB0aW1lb3V0TXMpLFxuICAgICAgc3RvcDogKCkgPT4gdGhpcy5zdG9wSGVscGVyQnlJZCh0d2Vha0lkLCBpZCksXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHJlcXVlc3RNb2R1bGUoXG4gICAgdHdlYWtJZDogc3RyaW5nLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgcGF5bG9hZD86IHVua25vd24sXG4gICAgX3RpbWVvdXRNcz86IG51bWJlcixcbiAgKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgY29uc3QgbW9kID0gdGhpcy5tb2R1bGVGb3IodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IHRhcmdldCA9IGFzUmVjb3JkKG1vZC5leHBvcnRzKTtcbiAgICBjb25zdCBmbiA9IHRhcmdldD8ucmVxdWVzdDtcbiAgICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIHJldHVybiBhd2FpdCBmbi5jYWxsKG1vZC5leHBvcnRzLCBtZXRob2QsIHBheWxvYWQpO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2RGbiA9IHRhcmdldD8uW21ldGhvZF07XG4gICAgaWYgKHR5cGVvZiBtZXRob2RGbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gYXdhaXQgbWV0aG9kRm4uY2FsbChtb2QuZXhwb3J0cywgcGF5bG9hZCk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgbmF0aXZlIG1vZHVsZSAke3R3ZWFrSWR9OiR7aWR9IGhhcyBubyByZXF1ZXN0KCkgb3IgJHttZXRob2R9KClgKTtcbiAgfVxuXG4gIGFzeW5jIGRpc3Bvc2VNb2R1bGUodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qga2V5ID0gbW9kdWxlS2V5KHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCBtb2QgPSB0aGlzLm1vZHVsZXMuZ2V0KGtleSk7XG4gICAgaWYgKCFtb2QpIHJldHVybjtcbiAgICBhd2FpdCBjYWxsT3B0aW9uYWwobW9kLmV4cG9ydHMsIFwiZGlzcG9zZVwiLCBbXSk7XG4gICAgdGhpcy5tb2R1bGVzLmRlbGV0ZShrZXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVOYXRpdmVJbnN0YW5jZShcbiAgICBjdHg6IE5hdGl2ZVR3ZWFrQ29udGV4dCxcbiAgICBraW5kOiBcInBhbmVsXCIgfCBcInZpZXdcIixcbiAgICBtb2R1bGVJZDogc3RyaW5nIHwgdW5kZWZpbmVkLFxuICAgIGZhY3Rvcnk6IHN0cmluZyxcbiAgICBvcHRpb25zOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogUHJvbWlzZTxOYXRpdmVJbnN0YW5jZT4ge1xuICAgIGNvbnN0IHRhcmdldCA9IG1vZHVsZUlkID8gdGhpcy5tb2R1bGVGb3IoY3R4LmlkLCBtb2R1bGVJZCkuZXhwb3J0cyA6IHRoaXMubG9hZE5hdGl2ZUhvc3QodHJ1ZSk7XG4gICAgY29uc3QgZm4gPSBhc1JlY29yZCh0YXJnZXQpPy5bZmFjdG9yeV07XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICBjb25zdCBsYWJlbCA9IG1vZHVsZUlkID8gYG5hdGl2ZSBtb2R1bGUgJHtjdHguaWR9OiR7bW9kdWxlSWR9YCA6IFwiQ29kZXgrKyBuYXRpdmUgaG9zdFwiO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2xhYmVsfSBoYXMgbm8gZmFjdG9yeSAke2ZhY3Rvcnl9KClgKTtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJlbnRXaW5kb3cgPSB0eXBlb2Ygb3B0aW9ucy5wYXJlbnRXaW5kb3dJZCA9PT0gXCJudW1iZXJcIlxuICAgICAgPyBCcm93c2VyV2luZG93LmZyb21JZChvcHRpb25zLnBhcmVudFdpbmRvd0lkKVxuICAgICAgOiBCcm93c2VyV2luZG93LmdldEZvY3VzZWRXaW5kb3coKTtcbiAgICBjb25zdCBwYXJlbnROYXRpdmVIYW5kbGUgPSBuYXRpdmVIYW5kbGVGb3JXaW5kb3cocGFyZW50V2luZG93KTtcbiAgICBjb25zdCB2YWx1ZSA9IGF3YWl0IGZuLmNhbGwodGFyZ2V0LCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgcGFyZW50V2luZG93SWQ6IHdpbmRvd0lkRm9yKHBhcmVudFdpbmRvdyksXG4gICAgICBwYXJlbnRXZWJDb250ZW50c0lkOiB3ZWJDb250ZW50c0lkRm9yKHBhcmVudFdpbmRvdyksXG4gICAgICBwYXJlbnROYXRpdmVIYW5kbGUsXG4gICAgfSk7XG4gICAgY29uc3QgaWQgPSB0eXBlb2YgYXNSZWNvcmQodmFsdWUpPy5pZCA9PT0gXCJzdHJpbmdcIiA/IFN0cmluZyhhc1JlY29yZCh2YWx1ZSk/LmlkKSA6IHJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCB3aW5kb3dJZCA9IHR5cGVvZiBhc1JlY29yZCh2YWx1ZSk/LndpbmRvd0lkID09PSBcIm51bWJlclwiID8gTnVtYmVyKGFzUmVjb3JkKHZhbHVlKT8ud2luZG93SWQpIDogbnVsbDtcbiAgICBjb25zdCBpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UgPSB7XG4gICAgICBrZXk6IGluc3RhbmNlS2V5KGN0eC5pZCwgaWQpLFxuICAgICAgdHdlYWtJZDogY3R4LmlkLFxuICAgICAgaWQsXG4gICAgICBraW5kLFxuICAgICAgdmFsdWUsXG4gICAgICBwYXJlbnRXaW5kb3dJZDogd2luZG93SWRGb3IocGFyZW50V2luZG93KSxcbiAgICAgIHdpbmRvd0lkLFxuICAgICAgZGlzcG9zZUJpbmRpbmdzOiBbXSxcbiAgICAgIGRpc3Bvc2luZzogZmFsc2UsXG4gICAgfTtcbiAgICB0aGlzLmluc3RhbmNlcy5zZXQoaW5zdGFuY2Uua2V5LCBpbnN0YW5jZSk7XG4gICAgaWYgKGNhbkJpbmRQYXJlbnRXaW5kb3cocGFyZW50V2luZG93KSkge1xuICAgICAgdGhpcy5iaW5kSW5zdGFuY2VUb1BhcmVudChpbnN0YW5jZSwgcGFyZW50V2luZG93KTtcbiAgICAgIHRoaXMuc3luY1BhcmVudFN0YXRlKGluc3RhbmNlLCBwYXJlbnRXaW5kb3csIFwiY3JlYXRlZFwiKTtcbiAgICB9XG4gICAgdGhpcy5sb2coXCJpbmZvXCIsIGBjcmVhdGVkIG5hdGl2ZSAke2tpbmR9ICR7Y3R4LmlkfToke2lkfWAsIHtcbiAgICAgIG1vZHVsZUlkOiBtb2R1bGVJZCA/PyBcImNvZGV4cHAubmF0aXZlLWhvc3RcIixcbiAgICAgIGZhY3RvcnksXG4gICAgICB3aW5kb3dJZCxcbiAgICB9KTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cblxuICBwcml2YXRlIGxvYWROYXRpdmVIb3N0KHJlcXVpcmVkOiB0cnVlKTogdW5rbm93bjtcbiAgcHJpdmF0ZSBsb2FkTmF0aXZlSG9zdChyZXF1aXJlZDogZmFsc2UpOiB1bmtub3duIHwgbnVsbDtcbiAgcHJpdmF0ZSBsb2FkTmF0aXZlSG9zdChyZXF1aXJlZDogYm9vbGVhbik6IHVua25vd24gfCBudWxsIHtcbiAgICBpZiAodGhpcy5uYXRpdmVIb3N0RXhwb3J0cykgcmV0dXJuIHRoaXMubmF0aXZlSG9zdEV4cG9ydHM7XG4gICAgaWYgKHRoaXMubmF0aXZlSG9zdExvYWRFcnJvciAmJiAhcmVxdWlyZWQpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IG5hdGl2ZUhvc3RQYXRoID0gdGhpcy5vcHRpb25zLm5hdGl2ZUhvc3RQYXRoO1xuICAgIGlmICghbmF0aXZlSG9zdFBhdGggfHwgIWV4aXN0c1N5bmMobmF0aXZlSG9zdFBhdGgpKSB7XG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihcIkNvZGV4KysgbmF0aXZlIGhvc3QgaXMgbm90IGluc3RhbGxlZFwiKTtcbiAgICAgIHRoaXMubmF0aXZlSG9zdExvYWRFcnJvciA9IGVycm9yO1xuICAgICAgaWYgKHJlcXVpcmVkKSB0aHJvdyBlcnJvcjtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdGhpcy5uYXRpdmVIb3N0RXhwb3J0cyA9IHJlcXVpcmUobmF0aXZlSG9zdFBhdGgpIGFzIHVua25vd247XG4gICAgICB0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3IgPSBudWxsO1xuICAgICAgdGhpcy5sb2coXCJpbmZvXCIsIFwibG9hZGVkIENvZGV4KysgbmF0aXZlIGhvc3RcIiwgeyBwYXRoOiBuYXRpdmVIb3N0UGF0aCB9KTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZUhvc3RFeHBvcnRzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoU3RyaW5nKGVycm9yKSk7XG4gICAgICB0aGlzLmxvZyhcImVycm9yXCIsIFwiZmFpbGVkIHRvIGxvYWQgQ29kZXgrKyBuYXRpdmUgaG9zdFwiLCB0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3IpO1xuICAgICAgaWYgKHJlcXVpcmVkKSB0aHJvdyB0aGlzLm5hdGl2ZUhvc3RMb2FkRXJyb3I7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlYWROYXRpdmVIb3N0Q2FwYWJpbGl0aWVzKGhvc3Q6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgY29uc3QgZ2V0Q2FwYWJpbGl0aWVzID0gYXNSZWNvcmQoaG9zdCk/LmdldENhcGFiaWxpdGllcztcbiAgICBpZiAodHlwZW9mIGdldENhcGFiaWxpdGllcyAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4ge307XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNhcGFiaWxpdGllcyA9IGdldENhcGFiaWxpdGllcy5jYWxsKGhvc3QpO1xuICAgICAgcmV0dXJuIGFzUmVjb3JkKGNhcGFiaWxpdGllcykgPz8ge307XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHRoaXMubG9nKFwid2FyblwiLCBcIkNvZGV4KysgbmF0aXZlIGhvc3QgY2FwYWJpbGl0eSBwcm9iZSBmYWlsZWRcIiwgZXJyb3IpO1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgaW52b2tlSW5zdGFuY2UoXG4gICAgdHdlYWtJZDogc3RyaW5nLFxuICAgIGlkOiBzdHJpbmcsXG4gICAgbWV0aG9kOiBzdHJpbmcsXG4gICAgYXJnczogdW5rbm93bltdLFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2VGb3IodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IGZuID0gYXNSZWNvcmQoaW5zdGFuY2UudmFsdWUpPy5bbWV0aG9kXTtcbiAgICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIGF3YWl0IGZuLmFwcGx5KGluc3RhbmNlLnZhbHVlLCBhcmdzKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGluc3RhbmNlLndpbmRvd0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB3aW4gPSBCcm93c2VyV2luZG93LmZyb21JZChpbnN0YW5jZS53aW5kb3dJZCk7XG4gICAgICBpZiAod2luICYmICF3aW4uaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICBpZiAobWV0aG9kID09PSBcInNldEJvdW5kc1wiKSB3aW4uc2V0Qm91bmRzKGFyZ3NbMF0gYXMgRWxlY3Ryb24uUmVjdGFuZ2xlKTtcbiAgICAgICAgZWxzZSBpZiAobWV0aG9kID09PSBcInNob3dcIikgd2luLnNob3coKTtcbiAgICAgICAgZWxzZSBpZiAobWV0aG9kID09PSBcImhpZGVcIikgd2luLmhpZGUoKTtcbiAgICAgICAgZWxzZSBpZiAobWV0aG9kID09PSBcInNldFZpc2libGVcIikgKGFyZ3NbMF0gPyB3aW4uc2hvdygpIDogd2luLmhpZGUoKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGBuYXRpdmUgJHtpbnN0YW5jZS5raW5kfSAke3R3ZWFrSWR9OiR7aWR9IGRvZXMgbm90IGltcGxlbWVudCAke21ldGhvZH0oKWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkaXNwb3NlSW5zdGFuY2VCeUlkKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGtleSA9IGluc3RhbmNlS2V5KHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2VzLmdldChrZXkpO1xuICAgIGlmICghaW5zdGFuY2UpIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLmRpc3Bvc2VJbnN0YW5jZShpbnN0YW5jZSk7XG4gICAgdGhpcy5pbnN0YW5jZXMuZGVsZXRlKGtleSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGRpc3Bvc2VJbnN0YW5jZShpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoaW5zdGFuY2UuZGlzcG9zaW5nKSByZXR1cm47XG4gICAgaW5zdGFuY2UuZGlzcG9zaW5nID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IGRpc3Bvc2Ugb2YgaW5zdGFuY2UuZGlzcG9zZUJpbmRpbmdzLnNwbGljZSgwKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgZGlzcG9zZSgpO1xuICAgICAgfSBjYXRjaCB7fVxuICAgIH1cbiAgICBhd2FpdCBjYWxsT3B0aW9uYWwoaW5zdGFuY2UudmFsdWUsIFwiZGlzcG9zZVwiLCBbXSk7XG4gICAgaWYgKGluc3RhbmNlLndpbmRvd0lkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB3aW4gPSBCcm93c2VyV2luZG93LmZyb21JZChpbnN0YW5jZS53aW5kb3dJZCk7XG4gICAgICBpZiAod2luICYmICF3aW4uaXNEZXN0cm95ZWQoKSkgd2luLmNsb3NlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBiaW5kSW5zdGFuY2VUb1BhcmVudChpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UsIHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyk6IHZvaWQge1xuICAgIGNvbnN0IG9uID0gKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICBwYXJlbnRXaW5kb3cub24oZXZlbnQgYXMgbmV2ZXIsIGxpc3RlbmVyIGFzIG5ldmVyKTtcbiAgICAgIGluc3RhbmNlLmRpc3Bvc2VCaW5kaW5ncy5wdXNoKCgpID0+IHBhcmVudFdpbmRvdy5vZmYoZXZlbnQgYXMgbmV2ZXIsIGxpc3RlbmVyIGFzIG5ldmVyKSk7XG4gICAgfTtcbiAgICBjb25zdCBzeW5jQm91bmRzID0gKCkgPT4gdGhpcy5zeW5jUGFyZW50U3RhdGUoaW5zdGFuY2UsIHBhcmVudFdpbmRvdywgXCJib3VuZHNcIik7XG4gICAgY29uc3Qgc3luY0ZvY3VzID0gKGZvY3VzZWQ6IGJvb2xlYW4pID0+IHRoaXMuc2lnbmFsUGFyZW50U3RhdGUoaW5zdGFuY2UsIHBhcmVudFdpbmRvdywgXCJmb2N1c1wiLCB7IGZvY3VzZWQgfSk7XG4gICAgY29uc3Qgc3luY1Zpc2liaWxpdHkgPSAodmlzaWJsZTogYm9vbGVhbikgPT5cbiAgICAgIHRoaXMuc2lnbmFsUGFyZW50U3RhdGUoaW5zdGFuY2UsIHBhcmVudFdpbmRvdywgXCJ2aXNpYmlsaXR5XCIsIHsgdmlzaWJsZSB9KTtcbiAgICBjb25zdCBkaXNwb3NlV2l0aFBhcmVudCA9ICgpID0+IHtcbiAgICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgZGlzcG9zaW5nIG5hdGl2ZSAke2luc3RhbmNlLmtpbmR9ICR7aW5zdGFuY2UudHdlYWtJZH06JHtpbnN0YW5jZS5pZH07IHBhcmVudCBjbG9zZWRgKTtcbiAgICAgIHZvaWQgdGhpcy5kaXNwb3NlSW5zdGFuY2VCeUlkKGluc3RhbmNlLnR3ZWFrSWQsIGluc3RhbmNlLmlkKTtcbiAgICB9O1xuXG4gICAgb24oXCJtb3ZlXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwicmVzaXplXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwiZW50ZXItZnVsbC1zY3JlZW5cIiwgc3luY0JvdW5kcyk7XG4gICAgb24oXCJsZWF2ZS1mdWxsLXNjcmVlblwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcIm1heGltaXplXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwidW5tYXhpbWl6ZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcIm1pbmltaXplXCIsIHN5bmNCb3VuZHMpO1xuICAgIG9uKFwicmVzdG9yZVwiLCBzeW5jQm91bmRzKTtcbiAgICBvbihcInNob3dcIiwgKCkgPT4gc3luY1Zpc2liaWxpdHkodHJ1ZSkpO1xuICAgIG9uKFwiaGlkZVwiLCAoKSA9PiBzeW5jVmlzaWJpbGl0eShmYWxzZSkpO1xuICAgIG9uKFwiZm9jdXNcIiwgKCkgPT4gc3luY0ZvY3VzKHRydWUpKTtcbiAgICBvbihcImJsdXJcIiwgKCkgPT4gc3luY0ZvY3VzKGZhbHNlKSk7XG4gICAgb24oXCJjbG9zZVwiLCBkaXNwb3NlV2l0aFBhcmVudCk7XG4gICAgb24oXCJjbG9zZWRcIiwgZGlzcG9zZVdpdGhQYXJlbnQpO1xuICB9XG5cbiAgcHJpdmF0ZSBzeW5jUGFyZW50U3RhdGUoXG4gICAgaW5zdGFuY2U6IE5hdGl2ZUluc3RhbmNlLFxuICAgIHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyxcbiAgICByZWFzb246IHN0cmluZyxcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdGUgPSBwYXJlbnRXaW5kb3dTdGF0ZShwYXJlbnRXaW5kb3csIHJlYXNvbik7XG4gICAgaWYgKCFzdGF0ZSkgcmV0dXJuO1xuICAgIHZvaWQgdGhpcy5jYWxsRmlyc3RPcHRpb25hbEluc3RhbmNlKGluc3RhbmNlLCBbXCJzeW5jUGFyZW50XCIsIFwicGFyZW50Q2hhbmdlZFwiXSwgW3N0YXRlXSlcbiAgICAgIC50aGVuKChoYW5kbGVkKSA9PiB7XG4gICAgICAgIGlmICghaGFuZGxlZCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNhbGxGaXJzdE9wdGlvbmFsSW5zdGFuY2UoXG4gICAgICAgICAgICBpbnN0YW5jZSxcbiAgICAgICAgICAgIFtcInNldFBhcmVudEJvdW5kc1wiLCBcInBhcmVudEJvdW5kc0NoYW5nZWRcIl0sXG4gICAgICAgICAgICBbc3RhdGUuYm91bmRzLCBzdGF0ZV0sXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4gdGhpcy5sb2coXCJ3YXJuXCIsIGBuYXRpdmUgJHtpbnN0YW5jZS5raW5kfSBwYXJlbnQgc3luYyBmYWlsZWRgLCBlcnJvcikpO1xuICB9XG5cbiAgcHJpdmF0ZSBzaWduYWxQYXJlbnRTdGF0ZShcbiAgICBpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UsXG4gICAgcGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LFxuICAgIHJlYXNvbjogc3RyaW5nLFxuICAgIHBhdGNoOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgKTogdm9pZCB7XG4gICAgY29uc3Qgc3RhdGUgPSBwYXJlbnRXaW5kb3dTdGF0ZShwYXJlbnRXaW5kb3csIHJlYXNvbik7XG4gICAgaWYgKCFzdGF0ZSkgcmV0dXJuO1xuICAgIGNvbnN0IHBheWxvYWQgPSB7IC4uLnN0YXRlLCAuLi5wYXRjaCB9O1xuICAgIHZvaWQgdGhpcy5jYWxsRmlyc3RPcHRpb25hbEluc3RhbmNlKGluc3RhbmNlLCBbXCJwYXJlbnRTdGF0ZUNoYW5nZWRcIiwgXCJwYXJlbnRDaGFuZ2VkXCJdLCBbcGF5bG9hZF0pXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB0aGlzLmxvZyhcIndhcm5cIiwgYG5hdGl2ZSAke2luc3RhbmNlLmtpbmR9IHBhcmVudCBzaWduYWwgZmFpbGVkYCwgZXJyb3IpKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgY2FsbEZpcnN0T3B0aW9uYWxJbnN0YW5jZShcbiAgICBpbnN0YW5jZTogTmF0aXZlSW5zdGFuY2UsXG4gICAgbWV0aG9kczogc3RyaW5nW10sXG4gICAgYXJnczogdW5rbm93bltdLFxuICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBjb25zdCB0YXJnZXQgPSBhc1JlY29yZChpbnN0YW5jZS52YWx1ZSk7XG4gICAgZm9yIChjb25zdCBtZXRob2Qgb2YgbWV0aG9kcykge1xuICAgICAgY29uc3QgZm4gPSB0YXJnZXQ/LlttZXRob2RdO1xuICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSBjb250aW51ZTtcbiAgICAgIGF3YWl0IGZuLmFwcGx5KGluc3RhbmNlLnZhbHVlLCBhcmdzKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNlbmRIZWxwZXIodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nLCBtZXNzYWdlOiB1bmtub3duKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgaGVscGVyID0gdGhpcy5oZWxwZXJGb3IodHdlYWtJZCwgaWQpO1xuICAgIGhlbHBlci5jaGlsZC5zdGRpbi53cml0ZShgJHtKU09OLnN0cmluZ2lmeShtZXNzYWdlKX1cXG5gKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdEhlbHBlcihcbiAgICB0d2Vha0lkOiBzdHJpbmcsXG4gICAgaWQ6IHN0cmluZyxcbiAgICBtZXNzYWdlOiB1bmtub3duLFxuICAgIHRpbWVvdXRNcyA9IDEwXzAwMCxcbiAgKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgY29uc3QgaGVscGVyID0gdGhpcy5oZWxwZXJGb3IodHdlYWtJZCwgaWQpO1xuICAgIGNvbnN0IHJlcXVlc3RJZCA9IHJhbmRvbVVVSUQoKTtcbiAgICBjb25zdCBwYXlsb2FkID0geyBpZDogcmVxdWVzdElkLCBtZXNzYWdlIH07XG4gICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGhlbHBlci5wZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGBuYXRpdmUgaGVscGVyIHJlcXVlc3QgdGltZWQgb3V0OiAke3R3ZWFrSWR9OiR7aWR9YCkpO1xuICAgICAgfSwgdGltZW91dE1zKTtcbiAgICAgIGhlbHBlci5wZW5kaW5nLnNldChyZXF1ZXN0SWQsIHsgcmVzb2x2ZSwgcmVqZWN0LCB0aW1lciB9KTtcbiAgICAgIGhlbHBlci5jaGlsZC5zdGRpbi53cml0ZShgJHtKU09OLnN0cmluZ2lmeShwYXlsb2FkKX1cXG5gKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc3RvcEhlbHBlckJ5SWQodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3Qga2V5ID0gaGVscGVyS2V5KHR3ZWFrSWQsIGlkKTtcbiAgICBjb25zdCBoZWxwZXIgPSB0aGlzLmhlbHBlcnMuZ2V0KGtleSk7XG4gICAgaWYgKCFoZWxwZXIpIHJldHVybjtcbiAgICB0aGlzLnN0b3BIZWxwZXIoaGVscGVyKTtcbiAgICB0aGlzLmhlbHBlcnMuZGVsZXRlKGtleSk7XG4gIH1cblxuICBwcml2YXRlIHN0b3BIZWxwZXIoaGVscGVyOiBOYXRpdmVIZWxwZXJQcm9jZXNzKTogdm9pZCB7XG4gICAgaWYgKGhlbHBlci5jaGlsZC5raWxsZWQpIHJldHVybjtcbiAgICBoZWxwZXIuY2hpbGQua2lsbCgpO1xuICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBpZiAoIWhlbHBlci5jaGlsZC5raWxsZWQpIGhlbHBlci5jaGlsZC5raWxsKFwiU0lHS0lMTFwiKTtcbiAgICB9LCAxNTAwKTtcbiAgICB0aW1lci51bnJlZj8uKCk7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZUhlbHBlckxpbmUoaGVscGVyOiBOYXRpdmVIZWxwZXJQcm9jZXNzLCBsaW5lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBsZXQgcGF5bG9hZDogeyBpZD86IHVua25vd247IHJlc3VsdD86IHVua25vd247IGVycm9yPzogdW5rbm93biB9O1xuICAgIHRyeSB7XG4gICAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShsaW5lKSBhcyB0eXBlb2YgcGF5bG9hZDtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHRoaXMubG9nKFwiaW5mb1wiLCBgbmF0aXZlIGhlbHBlciAke2hlbHBlci50d2Vha0lkfToke2hlbHBlci5pZH1gLCBsaW5lKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXlsb2FkLmlkICE9PSBcInN0cmluZ1wiKSByZXR1cm47XG4gICAgY29uc3QgcmVxdWVzdCA9IGhlbHBlci5wZW5kaW5nLmdldChwYXlsb2FkLmlkKTtcbiAgICBpZiAoIXJlcXVlc3QpIHJldHVybjtcbiAgICBoZWxwZXIucGVuZGluZy5kZWxldGUocGF5bG9hZC5pZCk7XG4gICAgY2xlYXJUaW1lb3V0KHJlcXVlc3QudGltZXIpO1xuICAgIGlmIChwYXlsb2FkLmVycm9yKSB7XG4gICAgICByZXF1ZXN0LnJlamVjdChuZXcgRXJyb3IoU3RyaW5nKHBheWxvYWQuZXJyb3IpKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcXVlc3QucmVzb2x2ZShwYXlsb2FkLnJlc3VsdCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBtb2R1bGVGb3IodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogTG9hZGVkTmF0aXZlTW9kdWxlIHtcbiAgICBjb25zdCBtb2QgPSB0aGlzLm1vZHVsZXMuZ2V0KG1vZHVsZUtleSh0d2Vha0lkLCBpZCkpO1xuICAgIGlmICghbW9kKSB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSBtb2R1bGUgaXMgbm90IGxvYWRlZDogJHt0d2Vha0lkfToke2lkfWApO1xuICAgIHJldHVybiBtb2Q7XG4gIH1cblxuICBwcml2YXRlIGluc3RhbmNlRm9yKHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IE5hdGl2ZUluc3RhbmNlIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuaW5zdGFuY2VzLmdldChpbnN0YW5jZUtleSh0d2Vha0lkLCBpZCkpO1xuICAgIGlmICghaW5zdGFuY2UpIHRocm93IG5ldyBFcnJvcihgbmF0aXZlIGluc3RhbmNlIGlzIG5vdCBsb2FkZWQ6ICR7dHdlYWtJZH06JHtpZH1gKTtcbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cblxuICBwcml2YXRlIGhlbHBlckZvcih0d2Vha0lkOiBzdHJpbmcsIGlkOiBzdHJpbmcpOiBOYXRpdmVIZWxwZXJQcm9jZXNzIHtcbiAgICBjb25zdCBoZWxwZXIgPSB0aGlzLmhlbHBlcnMuZ2V0KGhlbHBlcktleSh0d2Vha0lkLCBpZCkpO1xuICAgIGlmICghaGVscGVyKSB0aHJvdyBuZXcgRXJyb3IoYG5hdGl2ZSBoZWxwZXIgaXMgbm90IHJ1bm5pbmc6ICR7dHdlYWtJZH06JHtpZH1gKTtcbiAgICByZXR1cm4gaGVscGVyO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUd2Vha1BhdGgoY3R4OiBOYXRpdmVUd2Vha0NvbnRleHQsIHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiByZXNvbHZlTmF0aXZlVHdlYWtQYXRoKGN0eC5kaXIsIHBhdGgpO1xufVxuXG5mdW5jdGlvbiBpbmZlck1vZHVsZUtpbmQocGF0aDogc3RyaW5nKTogTmF0aXZlTW9kdWxlS2luZCB7XG4gIGlmIChwYXRoLmVuZHNXaXRoKFwiLm5vZGVcIikpIHJldHVybiBcIm5vZGUtYWRkb25cIjtcbiAgaWYgKHBhdGguZW5kc1dpdGgoXCIuZHlsaWJcIikpIHJldHVybiBcImR5bGliXCI7XG4gIGlmIChwYXRoLmVuZHNXaXRoKFwiLmZyYW1ld29ya1wiKSkgcmV0dXJuIFwiZnJhbWV3b3JrXCI7XG4gIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBtb2R1bGUgcGF0aCBtdXN0IGVuZCBpbiAubm9kZSwgLmR5bGliLCBvciAuZnJhbWV3b3JrXCIpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RFbnRyeXBvaW50KGxvYWRlZDogdW5rbm93biwgZW50cnlwb2ludDogc3RyaW5nIHwgdW5kZWZpbmVkKTogdW5rbm93biB7XG4gIGlmICghZW50cnlwb2ludCkgcmV0dXJuIGFzUmVjb3JkKGxvYWRlZCk/LmRlZmF1bHQgPz8gbG9hZGVkO1xuICBjb25zdCBzZWxlY3RlZCA9IGFzUmVjb3JkKGxvYWRlZCk/LltlbnRyeXBvaW50XTtcbiAgaWYgKHNlbGVjdGVkID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBFcnJvcihgbmF0aXZlIG1vZHVsZSBlbnRyeXBvaW50IG5vdCBmb3VuZDogJHtlbnRyeXBvaW50fWApO1xuICByZXR1cm4gc2VsZWN0ZWQ7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEJyaWRnZUlkKHZhbHVlOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICEvXlthLXpBLVowLTkuXy1dKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGAke2xhYmVsfSBtYXkgb25seSBjb250YWluIGxldHRlcnMsIG51bWJlcnMsIGRvdHMsIHVuZGVyc2NvcmVzLCBhbmQgZGFzaGVzYCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiBtb2R1bGVLZXkodHdlYWtJZDogc3RyaW5nLCBtb2R1bGVJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3R3ZWFrSWR9OiR7bW9kdWxlSWR9YDtcbn1cblxuZnVuY3Rpb24gaW5zdGFuY2VLZXkodHdlYWtJZDogc3RyaW5nLCBpZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIGAke3R3ZWFrSWR9OiR7aWR9YDtcbn1cblxuZnVuY3Rpb24gaGVscGVyS2V5KHR3ZWFrSWQ6IHN0cmluZywgaWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgJHt0d2Vha0lkfToke2lkfWA7XG59XG5cbmZ1bmN0aW9uIGFzUmVjb3JkKHZhbHVlOiB1bmtub3duKTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4gfCBudWxsIHtcbiAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiA/IHZhbHVlIGFzIFJlY29yZDxzdHJpbmcsIHVua25vd24+IDogbnVsbDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2FsbE9wdGlvbmFsKHRhcmdldDogdW5rbm93biwgbWV0aG9kOiBzdHJpbmcsIGFyZ3M6IHVua25vd25bXSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHRhcmdldCk/LlttZXRob2RdO1xuICBpZiAodHlwZW9mIGZuID09PSBcImZ1bmN0aW9uXCIpIGF3YWl0IGZuLmFwcGx5KHRhcmdldCwgYXJncyk7XG59XG5cbmZ1bmN0aW9uIHBhcmVudFdpbmRvd1N0YXRlKHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdywgcmVhc29uOiBzdHJpbmcpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB8IG51bGwge1xuICBpZiAoaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50V2luZG93KSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGJvdW5kcyA9IGNhbGxXaW5kb3dNZXRob2Q8RWxlY3Ryb24uUmVjdGFuZ2xlPihwYXJlbnRXaW5kb3csIFwiZ2V0Qm91bmRzXCIpO1xuICBjb25zdCBjb250ZW50Qm91bmRzID0gY2FsbFdpbmRvd01ldGhvZDxFbGVjdHJvbi5SZWN0YW5nbGU+KHBhcmVudFdpbmRvdywgXCJnZXRDb250ZW50Qm91bmRzXCIpO1xuICByZXR1cm4ge1xuICAgIHJlYXNvbixcbiAgICB3aW5kb3dJZDogd2luZG93SWRGb3IocGFyZW50V2luZG93KSxcbiAgICB3ZWJDb250ZW50c0lkOiB3ZWJDb250ZW50c0lkRm9yKHBhcmVudFdpbmRvdyksXG4gICAgYm91bmRzLFxuICAgIGNvbnRlbnRCb3VuZHMsXG4gICAgdmlzaWJsZTogY2FsbFdpbmRvd01ldGhvZDxib29sZWFuPihwYXJlbnRXaW5kb3csIFwiaXNWaXNpYmxlXCIpID8/IG51bGwsXG4gICAgZm9jdXNlZDogY2FsbFdpbmRvd01ldGhvZDxib29sZWFuPihwYXJlbnRXaW5kb3csIFwiaXNGb2N1c2VkXCIpID8/IG51bGwsXG4gICAgbWluaW1pemVkOiBjYWxsV2luZG93TWV0aG9kPGJvb2xlYW4+KHBhcmVudFdpbmRvdywgXCJpc01pbmltaXplZFwiKSA/PyBudWxsLFxuICAgIG1heGltaXplZDogY2FsbFdpbmRvd01ldGhvZDxib29sZWFuPihwYXJlbnRXaW5kb3csIFwiaXNNYXhpbWl6ZWRcIikgPz8gbnVsbCxcbiAgICBmdWxsc2NyZWVuOiBjYWxsV2luZG93TWV0aG9kPGJvb2xlYW4+KHBhcmVudFdpbmRvdywgXCJpc0Z1bGxTY3JlZW5cIikgPz8gbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbmF0aXZlSGFuZGxlRm9yV2luZG93KHBhcmVudFdpbmRvdzogRWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgfCB1bmRlZmluZWQpOiBCdWZmZXIgfCBudWxsIHtcbiAgaWYgKCFwYXJlbnRXaW5kb3cgfHwgaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50V2luZG93KSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IGZuID0gYXNSZWNvcmQocGFyZW50V2luZG93KT8uZ2V0TmF0aXZlV2luZG93SGFuZGxlO1xuICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBudWxsO1xuICB0cnkge1xuICAgIGNvbnN0IGhhbmRsZSA9IGZuLmNhbGwocGFyZW50V2luZG93KTtcbiAgICByZXR1cm4gQnVmZmVyLmlzQnVmZmVyKGhhbmRsZSkgPyBoYW5kbGUgOiBudWxsO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW5CaW5kUGFyZW50V2luZG93KFxuICBwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkLFxuKTogcGFyZW50V2luZG93IGlzIEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cge1xuICBpZiAoIXBhcmVudFdpbmRvdyB8fCBpc1dpbmRvd0Rlc3Ryb3llZChwYXJlbnRXaW5kb3cpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0eXBlb2YgYXNSZWNvcmQocGFyZW50V2luZG93KT8ub24gPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgIHR5cGVvZiBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5vZmYgPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuZnVuY3Rpb24gaXNXaW5kb3dEZXN0cm95ZWQocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCk6IGJvb2xlYW4ge1xuICBjb25zdCBmbiA9IGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/LmlzRGVzdHJveWVkO1xuICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gQm9vbGVhbihmbi5jYWxsKHBhcmVudFdpbmRvdykpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3aW5kb3dJZEZvcihwYXJlbnRXaW5kb3c6IEVsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsIHwgdW5kZWZpbmVkKTogbnVtYmVyIHwgbnVsbCB7XG4gIGNvbnN0IGlkID0gYXNSZWNvcmQocGFyZW50V2luZG93KT8uaWQ7XG4gIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHdlYkNvbnRlbnRzSWRGb3IocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCB8IHVuZGVmaW5lZCk6IG51bWJlciB8IG51bGwge1xuICBjb25zdCB3ZWJDb250ZW50cyA9IGFzUmVjb3JkKGFzUmVjb3JkKHBhcmVudFdpbmRvdyk/LndlYkNvbnRlbnRzKTtcbiAgY29uc3QgaWQgPSB3ZWJDb250ZW50cz8uaWQ7XG4gIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGNhbGxXaW5kb3dNZXRob2Q8VD4ocGFyZW50V2luZG93OiBFbGVjdHJvbi5Ccm93c2VyV2luZG93LCBtZXRob2Q6IHN0cmluZyk6IFQgfCBudWxsIHtcbiAgY29uc3QgZm4gPSBhc1JlY29yZChwYXJlbnRXaW5kb3cpPy5bbWV0aG9kXTtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZm4uY2FsbChwYXJlbnRXaW5kb3cpIGFzIFQ7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iLCAiaW1wb3J0IHsgcmVhbHBhdGhTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGlzQWJzb2x1dGUsIHJlbGF0aXZlLCByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZU5hdGl2ZVR3ZWFrUGF0aCh0d2Vha0Rpcjogc3RyaW5nLCBwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAodHlwZW9mIHBhdGggIT09IFwic3RyaW5nXCIgfHwgcGF0aC50cmltKCkgPT09IFwiXCIpIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBwYXRoIGlzIHJlcXVpcmVkXCIpO1xuICBjb25zdCByb290ID0gcmVhbHBhdGhTeW5jKHR3ZWFrRGlyKTtcbiAgY29uc3QgZnVsbCA9IHJlc29sdmUodHdlYWtEaXIsIHBhdGgpO1xuICBsZXQgdGFyZ2V0OiBzdHJpbmc7XG4gIHRyeSB7XG4gICAgdGFyZ2V0ID0gcmVhbHBhdGhTeW5jKGZ1bGwpO1xuICB9IGNhdGNoIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJuYXRpdmUgcGF0aCBkb2VzIG5vdCBleGlzdFwiKTtcbiAgfVxuICBpZiAoIWlzUGF0aEluc2lkZShyb290LCB0YXJnZXQpIHx8IHRhcmdldCA9PT0gcm9vdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIm5hdGl2ZSBwYXRoIG11c3Qgc3RheSBpbnNpZGUgdGhlIHR3ZWFrIGRpcmVjdG9yeVwiKTtcbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNQYXRoSW5zaWRlKHBhcmVudDogc3RyaW5nLCB0YXJnZXQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCByZWwgPSByZWxhdGl2ZShyZXNvbHZlKHBhcmVudCksIHJlc29sdmUodGFyZ2V0KSk7XG4gIHJldHVybiByZWwgPT09IFwiXCIgfHwgKCEhcmVsICYmICFyZWwuc3RhcnRzV2l0aChcIi4uXCIpICYmICFpc0Fic29sdXRlKHJlbCkpO1xufVxuIiwgImltcG9ydCB0eXBlIHsgVHdlYWtNYW5pZmVzdCB9IGZyb20gXCJAY29kZXgtcGx1c3BsdXMvc2RrXCI7XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1RXRUFLX1NUT1JFX0lOREVYX1VSTCA9XG4gIFwiaHR0cHM6Ly9rcGtoeGxneTAuZ2l0aHViLmlvL2NvZGV4LXBsdXNwbHVzL3N0b3JlL2luZGV4Lmpzb25cIjtcbmV4cG9ydCBjb25zdCBUV0VBS19TVE9SRV9SRVZJRVdfSVNTVUVfVVJMID1cbiAgXCJodHRwczovL2dpdGh1Yi5jb20va3BraHhsZ3kwL2NvZGV4LXBsdXNwbHVzL2lzc3Vlcy9uZXdcIjtcblxuZXhwb3J0IGludGVyZmFjZSBUd2Vha1N0b3JlUmVnaXN0cnkge1xuICBzY2hlbWFWZXJzaW9uOiAxO1xuICBnZW5lcmF0ZWRBdD86IHN0cmluZztcbiAgZW50cmllczogVHdlYWtTdG9yZUVudHJ5W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHdlYWtTdG9yZUVudHJ5IHtcbiAgaWQ6IHN0cmluZztcbiAgbWFuaWZlc3Q6IFR3ZWFrTWFuaWZlc3Q7XG4gIHJlcG86IHN0cmluZztcbiAgYXBwcm92ZWRDb21taXRTaGE6IHN0cmluZztcbiAgYXBwcm92ZWRBdDogc3RyaW5nO1xuICBhcHByb3ZlZEJ5OiBzdHJpbmc7XG4gIHBsYXRmb3Jtcz86IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdO1xuICByZWxlYXNlVXJsPzogc3RyaW5nO1xuICByZXZpZXdVcmw/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFR3ZWFrU3RvcmVQbGF0Zm9ybSA9IFwiZGFyd2luXCIgfCBcIndpbjMyXCIgfCBcImxpbnV4XCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uIHtcbiAgcmVwbzogc3RyaW5nO1xuICBkZWZhdWx0QnJhbmNoOiBzdHJpbmc7XG4gIGNvbW1pdFNoYTogc3RyaW5nO1xuICBjb21taXRVcmw6IHN0cmluZztcbiAgbWFuaWZlc3Q/OiB7XG4gICAgaWQ/OiBzdHJpbmc7XG4gICAgbmFtZT86IHN0cmluZztcbiAgICB2ZXJzaW9uPzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIGljb25Vcmw/OiBzdHJpbmc7XG4gIH07XG59XG5cbmNvbnN0IEdJVEhVQl9SRVBPX1JFID0gL15bQS1aYS16MC05Xy4tXStcXC9bQS1aYS16MC05Xy4tXSskLztcbmNvbnN0IEZVTExfU0hBX1JFID0gL15bYS1mMC05XXs0MH0kL2k7XG5cbmV4cG9ydCBmdW5jdGlvbiBub3JtYWxpemVHaXRIdWJSZXBvKGlucHV0OiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCByYXcgPSBpbnB1dC50cmltKCk7XG4gIGlmICghcmF3KSB0aHJvdyBuZXcgRXJyb3IoXCJHaXRIdWIgcmVwbyBpcyByZXF1aXJlZFwiKTtcblxuICBjb25zdCBzc2ggPSAvXmdpdEBnaXRodWJcXC5jb206KFteL10rXFwvW14vXSs/KSg/OlxcLmdpdCk/JC9pLmV4ZWMocmF3KTtcbiAgaWYgKHNzaCkgcmV0dXJuIG5vcm1hbGl6ZVJlcG9QYXJ0KHNzaFsxXSk7XG5cbiAgaWYgKC9eaHR0cHM/OlxcL1xcLy9pLnRlc3QocmF3KSkge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocmF3KTtcbiAgICBpZiAodXJsLmhvc3RuYW1lICE9PSBcImdpdGh1Yi5jb21cIikgdGhyb3cgbmV3IEVycm9yKFwiT25seSBnaXRodWIuY29tIHJlcG9zaXRvcmllcyBhcmUgc3VwcG9ydGVkXCIpO1xuICAgIGNvbnN0IHBhcnRzID0gdXJsLnBhdGhuYW1lLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpLnNwbGl0KFwiL1wiKTtcbiAgICBpZiAocGFydHMubGVuZ3RoIDwgMikgdGhyb3cgbmV3IEVycm9yKFwiR2l0SHViIHJlcG8gVVJMIG11c3QgaW5jbHVkZSBvd25lciBhbmQgcmVwb3NpdG9yeVwiKTtcbiAgICByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQoYCR7cGFydHNbMF19LyR7cGFydHNbMV19YCk7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplUmVwb1BhcnQocmF3KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVN0b3JlUmVnaXN0cnkoaW5wdXQ6IHVua25vd24pOiBUd2Vha1N0b3JlUmVnaXN0cnkge1xuICBjb25zdCByZWdpc3RyeSA9IGlucHV0IGFzIFBhcnRpYWw8VHdlYWtTdG9yZVJlZ2lzdHJ5PiB8IG51bGw7XG4gIGlmICghcmVnaXN0cnkgfHwgcmVnaXN0cnkuc2NoZW1hVmVyc2lvbiAhPT0gMSB8fCAhQXJyYXkuaXNBcnJheShyZWdpc3RyeS5lbnRyaWVzKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIHR3ZWFrIHN0b3JlIHJlZ2lzdHJ5XCIpO1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSByZWdpc3RyeS5lbnRyaWVzLm1hcChub3JtYWxpemVTdG9yZUVudHJ5KTtcbiAgZW50cmllcy5zb3J0KChhLCBiKSA9PiBhLm1hbmlmZXN0Lm5hbWUubG9jYWxlQ29tcGFyZShiLm1hbmlmZXN0Lm5hbWUpKTtcbiAgcmV0dXJuIHtcbiAgICBzY2hlbWFWZXJzaW9uOiAxLFxuICAgIGdlbmVyYXRlZEF0OiB0eXBlb2YgcmVnaXN0cnkuZ2VuZXJhdGVkQXQgPT09IFwic3RyaW5nXCIgPyByZWdpc3RyeS5nZW5lcmF0ZWRBdCA6IHVuZGVmaW5lZCxcbiAgICBlbnRyaWVzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZVN0b3JlRW50cmllczxUPihcbiAgZW50cmllczogcmVhZG9ubHkgVFtdLFxuICByYW5kb21JbmRleDogKGV4Y2x1c2l2ZU1heDogbnVtYmVyKSA9PiBudW1iZXIgPSAoZXhjbHVzaXZlTWF4KSA9PiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBleGNsdXNpdmVNYXgpLFxuKTogVFtdIHtcbiAgY29uc3Qgc2h1ZmZsZWQgPSBbLi4uZW50cmllc107XG4gIGZvciAobGV0IGkgPSBzaHVmZmxlZC5sZW5ndGggLSAxOyBpID4gMDsgaSAtPSAxKSB7XG4gICAgY29uc3QgaiA9IHJhbmRvbUluZGV4KGkgKyAxKTtcbiAgICBpZiAoIU51bWJlci5pc0ludGVnZXIoaikgfHwgaiA8IDAgfHwgaiA+IGkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgc2h1ZmZsZSByYW5kb21JbmRleCByZXR1cm5lZCAke2p9OyBleHBlY3RlZCBhbiBpbnRlZ2VyIGZyb20gMCB0byAke2l9YCk7XG4gICAgfVxuICAgIFtzaHVmZmxlZFtpXSwgc2h1ZmZsZWRbal1dID0gW3NodWZmbGVkW2pdLCBzaHVmZmxlZFtpXV07XG4gIH1cbiAgcmV0dXJuIHNodWZmbGVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVFbnRyeShpbnB1dDogdW5rbm93bik6IFR3ZWFrU3RvcmVFbnRyeSB7XG4gIGNvbnN0IGVudHJ5ID0gaW5wdXQgYXMgUGFydGlhbDxUd2Vha1N0b3JlRW50cnk+IHwgbnVsbDtcbiAgaWYgKCFlbnRyeSB8fCB0eXBlb2YgZW50cnkgIT09IFwib2JqZWN0XCIpIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdHdlYWsgc3RvcmUgZW50cnlcIik7XG4gIGNvbnN0IHJlcG8gPSBub3JtYWxpemVHaXRIdWJSZXBvKFN0cmluZyhlbnRyeS5yZXBvID8/IGVudHJ5Lm1hbmlmZXN0Py5naXRodWJSZXBvID8/IFwiXCIpKTtcbiAgY29uc3QgbWFuaWZlc3QgPSBlbnRyeS5tYW5pZmVzdCBhcyBUd2Vha01hbmlmZXN0IHwgdW5kZWZpbmVkO1xuICBpZiAoIW1hbmlmZXN0Py5pZCB8fCAhbWFuaWZlc3QubmFtZSB8fCAhbWFuaWZlc3QudmVyc2lvbikge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgZm9yICR7cmVwb30gaXMgbWlzc2luZyBtYW5pZmVzdCBmaWVsZHNgKTtcbiAgfVxuICBpZiAobm9ybWFsaXplR2l0SHViUmVwbyhtYW5pZmVzdC5naXRodWJSZXBvKSAhPT0gcmVwbykge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHttYW5pZmVzdC5pZH0gcmVwbyBkb2VzIG5vdCBtYXRjaCBtYW5pZmVzdCBnaXRodWJSZXBvYCk7XG4gIH1cbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoU3RyaW5nKGVudHJ5LmFwcHJvdmVkQ29tbWl0U2hhID8/IFwiXCIpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHttYW5pZmVzdC5pZH0gbXVzdCBwaW4gYSBmdWxsIGFwcHJvdmVkIGNvbW1pdCBTSEFgKTtcbiAgfVxuICByZXR1cm4ge1xuICAgIGlkOiBtYW5pZmVzdC5pZCxcbiAgICBtYW5pZmVzdCxcbiAgICByZXBvLFxuICAgIGFwcHJvdmVkQ29tbWl0U2hhOiBTdHJpbmcoZW50cnkuYXBwcm92ZWRDb21taXRTaGEpLFxuICAgIGFwcHJvdmVkQXQ6IHR5cGVvZiBlbnRyeS5hcHByb3ZlZEF0ID09PSBcInN0cmluZ1wiID8gZW50cnkuYXBwcm92ZWRBdCA6IFwiXCIsXG4gICAgYXBwcm92ZWRCeTogdHlwZW9mIGVudHJ5LmFwcHJvdmVkQnkgPT09IFwic3RyaW5nXCIgPyBlbnRyeS5hcHByb3ZlZEJ5IDogXCJcIixcbiAgICBwbGF0Zm9ybXM6IG5vcm1hbGl6ZVN0b3JlUGxhdGZvcm1zKChlbnRyeSBhcyB7IHBsYXRmb3Jtcz86IHVua25vd24gfSkucGxhdGZvcm1zKSxcbiAgICByZWxlYXNlVXJsOiBvcHRpb25hbEdpdGh1YlVybChlbnRyeS5yZWxlYXNlVXJsKSxcbiAgICByZXZpZXdVcmw6IG9wdGlvbmFsR2l0aHViVXJsKGVudHJ5LnJldmlld1VybCksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUFyY2hpdmVVcmwoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSk6IHN0cmluZyB7XG4gIGlmICghaXNGdWxsQ29tbWl0U2hhKGVudHJ5LmFwcHJvdmVkQ29tbWl0U2hhKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgU3RvcmUgZW50cnkgJHtlbnRyeS5pZH0gaXMgbm90IHBpbm5lZCB0byBhIGZ1bGwgY29tbWl0IFNIQWApO1xuICB9XG4gIHJldHVybiBgaHR0cHM6Ly9jb2RlbG9hZC5naXRodWIuY29tLyR7ZW50cnkucmVwb30vdGFyLmd6LyR7ZW50cnkuYXBwcm92ZWRDb21taXRTaGF9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkVHdlYWtQdWJsaXNoSXNzdWVVcmwoc3VibWlzc2lvbjogVHdlYWtTdG9yZVB1Ymxpc2hTdWJtaXNzaW9uKTogc3RyaW5nIHtcbiAgY29uc3QgcmVwbyA9IG5vcm1hbGl6ZUdpdEh1YlJlcG8oc3VibWlzc2lvbi5yZXBvKTtcbiAgaWYgKCFpc0Z1bGxDb21taXRTaGEoc3VibWlzc2lvbi5jb21taXRTaGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VibWlzc2lvbiBtdXN0IGluY2x1ZGUgdGhlIGZ1bGwgY29tbWl0IFNIQSB0byByZXZpZXdcIik7XG4gIH1cbiAgY29uc3QgdGl0bGUgPSBgVHdlYWsgc3RvcmUgcmV2aWV3OiAke3JlcG99YDtcbiAgY29uc3QgYm9keSA9IFtcbiAgICBcIiMjIFR3ZWFrIHJlcG9cIixcbiAgICBgaHR0cHM6Ly9naXRodWIuY29tLyR7cmVwb31gLFxuICAgIFwiXCIsXG4gICAgXCIjIyBDb21taXQgdG8gcmV2aWV3XCIsXG4gICAgc3VibWlzc2lvbi5jb21taXRTaGEsXG4gICAgc3VibWlzc2lvbi5jb21taXRVcmwsXG4gICAgXCJcIixcbiAgICBcIkRvIG5vdCBhcHByb3ZlIGEgZGlmZmVyZW50IGNvbW1pdC4gSWYgdGhlIGF1dGhvciBwdXNoZXMgY2hhbmdlcywgYXNrIHRoZW0gdG8gcmVzdWJtaXQuXCIsXG4gICAgXCJcIixcbiAgICBcIiMjIE1hbmlmZXN0XCIsXG4gICAgYC0gaWQ6ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8uaWQgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgYC0gbmFtZTogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5uYW1lID8/IFwiKG5vdCBkZXRlY3RlZClcIn1gLFxuICAgIGAtIHZlcnNpb246ICR7c3VibWlzc2lvbi5tYW5pZmVzdD8udmVyc2lvbiA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBkZXNjcmlwdGlvbjogJHtzdWJtaXNzaW9uLm1hbmlmZXN0Py5kZXNjcmlwdGlvbiA/PyBcIihub3QgZGV0ZWN0ZWQpXCJ9YCxcbiAgICBgLSBpY29uVXJsOiAke3N1Ym1pc3Npb24ubWFuaWZlc3Q/Lmljb25VcmwgPz8gXCIobm90IGRldGVjdGVkKVwifWAsXG4gICAgXCJcIixcbiAgICBcIiMjIEFkbWluIGNoZWNrbGlzdFwiLFxuICAgIFwiLSBbIF0gbWFuaWZlc3QuanNvbiBpcyB2YWxpZFwiLFxuICAgIFwiLSBbIF0gbWFuaWZlc3QuaWNvblVybCBpcyB1c2FibGUgYXMgdGhlIHN0b3JlIGljb25cIixcbiAgICBcIi0gWyBdIHNvdXJjZSB3YXMgcmV2aWV3ZWQgYXQgdGhlIGV4YWN0IGNvbW1pdCBhYm92ZVwiLFxuICAgIFwiLSBbIF0gYHN0b3JlL2luZGV4Lmpzb25gIGVudHJ5IHBpbnMgYGFwcHJvdmVkQ29tbWl0U2hhYCB0byB0aGUgZXhhY3QgY29tbWl0IGFib3ZlXCIsXG4gIF0uam9pbihcIlxcblwiKTtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChUV0VBS19TVE9SRV9SRVZJRVdfSVNTVUVfVVJMKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJ0ZW1wbGF0ZVwiLCBcInR3ZWFrLXN0b3JlLXJldmlldy5tZFwiKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoXCJ0aXRsZVwiLCB0aXRsZSk7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KFwiYm9keVwiLCBib2R5KTtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNGdWxsQ29tbWl0U2hhKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIEZVTExfU0hBX1JFLnRlc3QodmFsdWUpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVSZXBvUGFydCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgcmVwbyA9IHZhbHVlLnRyaW0oKS5yZXBsYWNlKC9cXC5naXQkL2ksIFwiXCIpLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpO1xuICBpZiAoIUdJVEhVQl9SRVBPX1JFLnRlc3QocmVwbykpIHRocm93IG5ldyBFcnJvcihcIkdpdEh1YiByZXBvIG11c3QgYmUgaW4gb3duZXIvcmVwbyBmb3JtXCIpO1xuICByZXR1cm4gcmVwbztcbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplU3RvcmVQbGF0Zm9ybXMoaW5wdXQ6IHVua25vd24pOiBUd2Vha1N0b3JlUGxhdGZvcm1bXSB8IHVuZGVmaW5lZCB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoaW5wdXQpKSB0aHJvdyBuZXcgRXJyb3IoXCJTdG9yZSBlbnRyeSBwbGF0Zm9ybXMgbXVzdCBiZSBhbiBhcnJheVwiKTtcbiAgY29uc3QgYWxsb3dlZCA9IG5ldyBTZXQ8VHdlYWtTdG9yZVBsYXRmb3JtPihbXCJkYXJ3aW5cIiwgXCJ3aW4zMlwiLCBcImxpbnV4XCJdKTtcbiAgY29uc3QgcGxhdGZvcm1zID0gQXJyYXkuZnJvbShuZXcgU2V0KGlucHV0Lm1hcCgodmFsdWUpID0+IHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICFhbGxvd2VkLmhhcyh2YWx1ZSBhcyBUd2Vha1N0b3JlUGxhdGZvcm0pKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuc3VwcG9ydGVkIHN0b3JlIHBsYXRmb3JtOiAke1N0cmluZyh2YWx1ZSl9YCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZSBhcyBUd2Vha1N0b3JlUGxhdGZvcm07XG4gIH0pKSk7XG4gIHJldHVybiBwbGF0Zm9ybXMubGVuZ3RoID4gMCA/IHBsYXRmb3JtcyA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gb3B0aW9uYWxHaXRodWJVcmwodmFsdWU6IHVua25vd24pOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICBpZiAodHlwZW9mIHZhbHVlICE9PSBcInN0cmluZ1wiIHx8ICF2YWx1ZS50cmltKCkpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwodmFsdWUpO1xuICBpZiAodXJsLnByb3RvY29sICE9PSBcImh0dHBzOlwiIHx8IHVybC5ob3N0bmFtZSAhPT0gXCJnaXRodWIuY29tXCIpIHJldHVybiB1bmRlZmluZWQ7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cbiIsICJpbXBvcnQgeyBhcHAsIEJyb3dzZXJWaWV3LCBCcm93c2VyV2luZG93LCBNZXNzYWdlQ2hhbm5lbE1haW4sIGlwY01haW4sIG5hdGl2ZVRoZW1lIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5pbXBvcnQgeyBjcmVhdGVIYXNoLCByYW5kb21VVUlEIH0gZnJvbSBcIm5vZGU6Y3J5cHRvXCI7XG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkRmlsZVN5bmMsIHN0YXRTeW5jIH0gZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGNyZWF0ZVNlcnZlciwgdHlwZSBJbmNvbWluZ01lc3NhZ2UsIHR5cGUgU2VydmVyLCB0eXBlIFNlcnZlclJlc3BvbnNlIH0gZnJvbSBcIm5vZGU6aHR0cFwiO1xuaW1wb3J0IHsgam9pbiwgbm9ybWFsaXplLCByZWxhdGl2ZSB9IGZyb20gXCJub2RlOnBhdGhcIjtcbmltcG9ydCB0eXBlIHsgU29ja2V0IH0gZnJvbSBcIm5vZGU6bmV0XCI7XG5cbmNvbnN0IENPTk5FQ1RfUE9SVF9DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktY29ubmVjdC1hcHAtaG9zdFwiO1xuY29uc3QgQlJJREdFX1JFUVVFU1RfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWJyaWRnZS1yZXF1ZXN0XCI7XG5jb25zdCBCUklER0VfUkVTUE9OU0VfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLWJyaWRnZS1yZXNwb25zZVwiO1xuY29uc3QgTUVTU0FHRV9GT1JfVklFV19DSEFOTkVMID0gXCJjb2RleHBwOmJyb3dzZXItdWktbWVzc2FnZS1mb3Itdmlld1wiO1xuY29uc3QgV09SS0VSX01FU1NBR0VfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLXdvcmtlci1tZXNzYWdlXCI7XG5jb25zdCBTWVNURU1fVEhFTUVfQ0hBTk5FTCA9IFwiY29kZXhwcDpicm93c2VyLXVpLXN5c3RlbS10aGVtZVwiO1xuXG50eXBlIExvZ0ZuID0gKGxldmVsOiBcImluZm9cIiB8IFwid2FyblwiIHwgXCJlcnJvclwiLCAuLi5hcmdzOiB1bmtub3duW10pID0+IHZvaWQ7XG5cbmludGVyZmFjZSBDb2RleFdpbmRvd1NlcnZpY2VzIHtcbiAgZ2V0Q29udGV4dD86IChob3N0SWQ6IHN0cmluZykgPT4geyByZWdpc3RlcldpbmRvdz86ICh3aW5kb3dMaWtlOiBDb2RleFdpbmRvd0xpa2UpID0+IHZvaWQgfSB8IG51bGw7XG4gIGdldENvbnRleHRGb3JXZWJDb250ZW50cz86IChcbiAgICB3ZWJDb250ZW50czogRWxlY3Ryb24uV2ViQ29udGVudHMsXG4gICkgPT4geyByZWdpc3RlcldpbmRvdz86ICh3aW5kb3dMaWtlOiBDb2RleFdpbmRvd0xpa2UpID0+IHZvaWQgfSB8IG51bGw7XG4gIHdpbmRvd01hbmFnZXI/OiB7XG4gICAgcmVnaXN0ZXJXaW5kb3c/OiAoXG4gICAgICB3aW5kb3dMaWtlOiBDb2RleFdpbmRvd0xpa2UsXG4gICAgICBob3N0SWQ6IHN0cmluZyxcbiAgICAgIHByaW1hcnk6IGJvb2xlYW4sXG4gICAgICBhcHBlYXJhbmNlOiBzdHJpbmcsXG4gICAgKSA9PiB2b2lkO1xuICAgIG9wdGlvbnM/OiB7XG4gICAgICBhbGxvd0RldnRvb2xzPzogYm9vbGVhbjtcbiAgICAgIHByZWxvYWRQYXRoPzogc3RyaW5nO1xuICAgIH07XG4gIH07XG59XG5cbmludGVyZmFjZSBDb2RleFdpbmRvd0xpa2Uge1xuICBpZDogbnVtYmVyO1xuICB3ZWJDb250ZW50czogRWxlY3Ryb24uV2ViQ29udGVudHM7XG4gIG9uKGV2ZW50OiBcImNsb3NlZFwiLCBsaXN0ZW5lcjogKCkgPT4gdm9pZCk6IHVua25vd247XG4gIG9uY2U/KGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKTogdW5rbm93bjtcbiAgb2ZmPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIHJlbW92ZUxpc3RlbmVyPyhldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCk6IHVua25vd247XG4gIGlzRGVzdHJveWVkPygpOiBib29sZWFuO1xuICBpc0ZvY3VzZWQ/KCk6IGJvb2xlYW47XG4gIGZvY3VzPygpOiB2b2lkO1xuICBzaG93PygpOiB2b2lkO1xuICBoaWRlPygpOiB2b2lkO1xuICBnZXRCb3VuZHM/KCk6IEVsZWN0cm9uLlJlY3RhbmdsZTtcbiAgZ2V0Q29udGVudEJvdW5kcz8oKTogRWxlY3Ryb24uUmVjdGFuZ2xlO1xuICBnZXRTaXplPygpOiBbbnVtYmVyLCBudW1iZXJdO1xuICBnZXRDb250ZW50U2l6ZT8oKTogW251bWJlciwgbnVtYmVyXTtcbiAgc2V0VGl0bGU/KHRpdGxlOiBzdHJpbmcpOiB2b2lkO1xuICBnZXRUaXRsZT8oKTogc3RyaW5nO1xuICBzZXRSZXByZXNlbnRlZEZpbGVuYW1lPyhmaWxlbmFtZTogc3RyaW5nKTogdm9pZDtcbiAgc2V0RG9jdW1lbnRFZGl0ZWQ/KGVkaXRlZDogYm9vbGVhbik6IHZvaWQ7XG4gIHNldFdpbmRvd0J1dHRvblZpc2liaWxpdHk/KHZpc2libGU6IGJvb2xlYW4pOiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgQnJvd3NlclVpU2VydmVyT3B0aW9ucyB7XG4gIHBvcnQ6IG51bWJlcjtcbiAgaG9zdDogc3RyaW5nO1xuICBoaWRlTWFpbldpbmRvdzogYm9vbGVhbjtcbiAgZ2V0V2luZG93U2VydmljZXM6ICgpID0+IENvZGV4V2luZG93U2VydmljZXMgfCBudWxsO1xuICBsb2c6IExvZ0ZuO1xufVxuXG5pbnRlcmZhY2UgQnJvd3NlclVpSG9zdCB7XG4gIHZpZXc6IEVsZWN0cm9uLkJyb3dzZXJWaWV3O1xuICB3ZWJDb250ZW50czogRWxlY3Ryb24uV2ViQ29udGVudHM7XG59XG5cbmludGVyZmFjZSBCcmlkZ2VQZW5kaW5nUmVxdWVzdCB7XG4gIHJlc29sdmU6ICh2YWx1ZTogdW5rbm93bikgPT4gdm9pZDtcbiAgcmVqZWN0OiAoZXJyb3I6IEVycm9yKSA9PiB2b2lkO1xuICB0aW1lcjogTm9kZUpTLlRpbWVvdXQ7XG59XG5cbmludGVyZmFjZSBJbml0aWFsU3RhdGUge1xuICBzbmFwc2hvdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG4gIHN5c3RlbVRoZW1lVmFyaWFudDogc3RyaW5nO1xuICBzZW50cnlJbml0T3B0aW9uczogdW5rbm93bjtcbiAgYnVpbGRGbGF2b3I6IHVua25vd247XG4gIHVzZXNPd2xBcHBTaGVsbDogYm9vbGVhbjtcbiAgcGxhdGZvcm06IE5vZGVKUy5QbGF0Zm9ybTtcbiAgYXJjaDogc3RyaW5nO1xufVxuXG5jb25zdCBNSU1FX1RZUEVTOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge1xuICBcIi5odG1sXCI6IFwidGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04XCIsXG4gIFwiLmpzXCI6IFwidGV4dC9qYXZhc2NyaXB0OyBjaGFyc2V0PXV0Zi04XCIsXG4gIFwiLmNzc1wiOiBcInRleHQvY3NzOyBjaGFyc2V0PXV0Zi04XCIsXG4gIFwiLmpzb25cIjogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXG4gIFwiLnN2Z1wiOiBcImltYWdlL3N2Zyt4bWxcIixcbiAgXCIucG5nXCI6IFwiaW1hZ2UvcG5nXCIsXG4gIFwiLmpwZ1wiOiBcImltYWdlL2pwZWdcIixcbiAgXCIuanBlZ1wiOiBcImltYWdlL2pwZWdcIixcbiAgXCIud2VicFwiOiBcImltYWdlL3dlYnBcIixcbiAgXCIuaWNvXCI6IFwiaW1hZ2UveC1pY29uXCIsXG4gIFwiLndvZmZcIjogXCJmb250L3dvZmZcIixcbiAgXCIud29mZjJcIjogXCJmb250L3dvZmYyXCIsXG59O1xuXG5sZXQgYWN0aXZlU2VydmVyOiBTZXJ2ZXIgfCBudWxsID0gbnVsbDtcbmxldCBhY3RpdmVIb3N0OiBCcm93c2VyVWlIb3N0IHwgbnVsbCA9IG51bGw7XG5sZXQgYWN0aXZlT3B0aW9uczogQnJvd3NlclVpU2VydmVyT3B0aW9ucyB8IG51bGwgPSBudWxsO1xuY29uc3QgYnJpZGdlUmVxdWVzdHMgPSBuZXcgTWFwPHN0cmluZywgQnJpZGdlUGVuZGluZ1JlcXVlc3Q+KCk7XG5jb25zdCBjb250cm9sQ2xpZW50cyA9IG5ldyBTZXQ8V2ViU29ja2V0Q29ubmVjdGlvbj4oKTtcblxuZXhwb3J0IGZ1bmN0aW9uIG1heWJlU3RhcnRCcm93c2VyVWlTZXJ2ZXIoXG4gIG9wdHM6IFBpY2s8QnJvd3NlclVpU2VydmVyT3B0aW9ucywgXCJnZXRXaW5kb3dTZXJ2aWNlc1wiIHwgXCJsb2dcIj4sXG4pOiB2b2lkIHtcbiAgaWYgKHByb2Nlc3MuZW52LkNPREVYUFBfQlJPV1NFUl9VSSAhPT0gXCIxXCIpIHJldHVybjtcbiAgY29uc3QgcG9ydCA9IHBhcnNlUG9ydChwcm9jZXNzLmVudi5DT0RFWFBQX0JST1dTRVJfVUlfUE9SVCwgODc2NSk7XG4gIHN0YXJ0QnJvd3NlclVpU2VydmVyKHtcbiAgICAuLi5vcHRzLFxuICAgIHBvcnQsXG4gICAgaG9zdDogXCIxMjcuMC4wLjFcIixcbiAgICBoaWRlTWFpbldpbmRvdzogcHJvY2Vzcy5lbnYuQ09ERVhQUF9CUk9XU0VSX1VJX0hJREVfTUFJTiA9PT0gXCIxXCIsXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RhcnRCcm93c2VyVWlTZXJ2ZXIob3B0czogQnJvd3NlclVpU2VydmVyT3B0aW9ucyk6IHZvaWQge1xuICBpZiAoYWN0aXZlU2VydmVyKSByZXR1cm47XG4gIGFjdGl2ZU9wdGlvbnMgPSBvcHRzO1xuICBpbnN0YWxsQnJvd3NlclVpSXBjSGFuZGxlcnMob3B0cy5sb2cpO1xuXG4gIGNvbnN0IHNlcnZlciA9IGNyZWF0ZVNlcnZlcigocmVxLCByZXMpID0+IHtcbiAgICBoYW5kbGVIdHRwUmVxdWVzdChyZXEsIHJlcykuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBvcHRzLmxvZyhcImVycm9yXCIsIFwiYnJvd3NlciBVSSByZXF1ZXN0IGZhaWxlZFwiLCB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICBzZW5kVGV4dChyZXMsIDUwMCwgXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgIH0pO1xuICB9KTtcbiAgc2VydmVyLm9uKFwidXBncmFkZVwiLCAocmVxLCBzb2NrZXQsIGhlYWQpID0+IHtcbiAgICBoYW5kbGVVcGdyYWRlKHJlcSwgc29ja2V0IGFzIFNvY2tldCwgaGVhZCkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICBvcHRzLmxvZyhcIndhcm5cIiwgXCJicm93c2VyIFVJIHdlYnNvY2tldCB1cGdyYWRlIGZhaWxlZFwiLCB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG4gICAgICBzb2NrZXQuZGVzdHJveSgpO1xuICAgIH0pO1xuICB9KTtcbiAgc2VydmVyLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgb3B0cy5sb2coXCJlcnJvclwiLCBcImJyb3dzZXIgVUkgc2VydmVyIGZhaWxlZFwiLCB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfSk7XG4gIH0pO1xuICBzZXJ2ZXIubGlzdGVuKG9wdHMucG9ydCwgb3B0cy5ob3N0LCAoKSA9PiB7XG4gICAgb3B0cy5sb2coXCJpbmZvXCIsIGBicm93c2VyIFVJIHNlcnZlciBsaXN0ZW5pbmcgYXQgaHR0cDovLyR7b3B0cy5ob3N0fToke29wdHMucG9ydH0vYCk7XG4gIH0pO1xuICBhY3RpdmVTZXJ2ZXIgPSBzZXJ2ZXI7XG4gIGlmIChvcHRzLmhpZGVNYWluV2luZG93KSB7XG4gICAgZm9yIChjb25zdCBkZWxheU1zIG9mIFs1MDAsIDFfNTAwLCAzXzAwMF0pIHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dChoaWRlVmlzaWJsZUNvZGV4V2luZG93cywgZGVsYXlNcyk7XG4gICAgICB0aW1lci51bnJlZj8uKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxCcm93c2VyVWlJcGNIYW5kbGVycyhsb2c6IExvZ0ZuKTogdm9pZCB7XG4gIGlwY01haW4ucmVtb3ZlQWxsTGlzdGVuZXJzKEJSSURHRV9SRVNQT05TRV9DSEFOTkVMKTtcbiAgaXBjTWFpbi5yZW1vdmVBbGxMaXN0ZW5lcnMoTUVTU0FHRV9GT1JfVklFV19DSEFOTkVMKTtcbiAgaXBjTWFpbi5yZW1vdmVBbGxMaXN0ZW5lcnMoV09SS0VSX01FU1NBR0VfQ0hBTk5FTCk7XG4gIGlwY01haW4ucmVtb3ZlQWxsTGlzdGVuZXJzKFNZU1RFTV9USEVNRV9DSEFOTkVMKTtcblxuICBpcGNNYWluLm9uKEJSSURHRV9SRVNQT05TRV9DSEFOTkVMLCAoZXZlbnQsIHBheWxvYWQpID0+IHtcbiAgICBpZiAoIWlzQnJvd3NlclVpSG9zdFNlbmRlcihldmVudC5zZW5kZXIpKSByZXR1cm47XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhc1JlY29yZChwYXlsb2FkKTtcbiAgICBjb25zdCBpZCA9IHR5cGVvZiByZXNwb25zZT8uaWQgPT09IFwic3RyaW5nXCIgPyByZXNwb25zZS5pZCA6IFwiXCI7XG4gICAgY29uc3QgcGVuZGluZyA9IGJyaWRnZVJlcXVlc3RzLmdldChpZCk7XG4gICAgaWYgKCFwZW5kaW5nKSByZXR1cm47XG4gICAgYnJpZGdlUmVxdWVzdHMuZGVsZXRlKGlkKTtcbiAgICBjbGVhclRpbWVvdXQocGVuZGluZy50aW1lcik7XG4gICAgaWYgKHJlc3BvbnNlPy5vayA9PT0gdHJ1ZSkge1xuICAgICAgcGVuZGluZy5yZXNvbHZlKHJlc3BvbnNlLnZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGVuZGluZy5yZWplY3QobmV3IEVycm9yKHR5cGVvZiByZXNwb25zZT8uZXJyb3IgPT09IFwic3RyaW5nXCIgPyByZXNwb25zZS5lcnJvciA6IFwiQnJpZGdlIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlwY01haW4ub24oTUVTU0FHRV9GT1JfVklFV19DSEFOTkVMLCAoZXZlbnQsIG1lc3NhZ2UpID0+IHtcbiAgICBpZiAoIWlzQnJvd3NlclVpSG9zdFNlbmRlcihldmVudC5zZW5kZXIpKSByZXR1cm47XG4gICAgYnJvYWRjYXN0Q29udHJvbCh7IHR5cGU6IFwibWVzc2FnZS1mb3Itdmlld1wiLCBtZXNzYWdlIH0pO1xuICB9KTtcblxuICBpcGNNYWluLm9uKFdPUktFUl9NRVNTQUdFX0NIQU5ORUwsIChldmVudCwgd29ya2VySWQsIG1lc3NhZ2UpID0+IHtcbiAgICBpZiAoIWlzQnJvd3NlclVpSG9zdFNlbmRlcihldmVudC5zZW5kZXIpKSByZXR1cm47XG4gICAgaWYgKHR5cGVvZiB3b3JrZXJJZCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuO1xuICAgIGJyb2FkY2FzdENvbnRyb2woeyB0eXBlOiBcIndvcmtlci1tZXNzYWdlXCIsIHdvcmtlcklkLCBtZXNzYWdlIH0pO1xuICB9KTtcblxuICBpcGNNYWluLm9uKFNZU1RFTV9USEVNRV9DSEFOTkVMLCAoZXZlbnQsIHZhbHVlKSA9PiB7XG4gICAgaWYgKCFpc0Jyb3dzZXJVaUhvc3RTZW5kZXIoZXZlbnQuc2VuZGVyKSkgcmV0dXJuO1xuICAgIGJyb2FkY2FzdENvbnRyb2woeyB0eXBlOiBcInN5c3RlbS10aGVtZS12YXJpYW50LXVwZGF0ZWRcIiwgdmFsdWUgfSk7XG4gIH0pO1xuXG4gIHByb2Nlc3Mub25jZShcImV4aXRcIiwgKCkgPT4ge1xuICAgIGZvciAoY29uc3QgcGVuZGluZyBvZiBicmlkZ2VSZXF1ZXN0cy52YWx1ZXMoKSkge1xuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmcudGltZXIpO1xuICAgICAgcGVuZGluZy5yZWplY3QobmV3IEVycm9yKFwiQ29kZXgrKyBicm93c2VyIFVJIHNlcnZlciBzdG9wcGVkXCIpKTtcbiAgICB9XG4gICAgYnJpZGdlUmVxdWVzdHMuY2xlYXIoKTtcbiAgICBmb3IgKGNvbnN0IGNsaWVudCBvZiBjb250cm9sQ2xpZW50cykgY2xpZW50LmNsb3NlKCk7XG4gICAgY29udHJvbENsaWVudHMuY2xlYXIoKTtcbiAgICB0cnkge1xuICAgICAgaWYgKGFjdGl2ZUhvc3QgJiYgIWFjdGl2ZUhvc3Qud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICBhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmNsb3NlKHsgd2FpdEZvckJlZm9yZVVubG9hZDogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxvZyhcIndhcm5cIiwgXCJicm93c2VyIFVJIGhvc3QgY2xlYW51cCBmYWlsZWRcIiwgeyBtZXNzYWdlOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUh0dHBSZXF1ZXN0KHJlcTogSW5jb21pbmdNZXNzYWdlLCByZXM6IFNlcnZlclJlc3BvbnNlKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG9wdGlvbnMgPSByZXF1aXJlT3B0aW9ucygpO1xuICBjb25zdCB1cmwgPSByZXF1ZXN0VXJsKHJlcSk7XG4gIGlmICghdXJsKSB7XG4gICAgc2VuZFRleHQocmVzLCA0MDAsIFwiQmFkIFJlcXVlc3RcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh1cmwucGF0aG5hbWUgPT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9oZWFsdGhcIikge1xuICAgIHNlbmRKc29uKHJlcywgMjAwLCB7IG9rOiB0cnVlIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh1cmwucGF0aG5hbWUgPT09IFwiL2NvZGV4cHAvYnJvd3Nlci11aS9icmlkZ2VcIikge1xuICAgIGlmIChyZXEubWV0aG9kICE9PSBcIlBPU1RcIikge1xuICAgICAgc2VuZFRleHQocmVzLCA0MDUsIFwiTWV0aG9kIE5vdCBBbGxvd2VkXFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm9keSA9IGFzUmVjb3JkKGF3YWl0IHJlYWRKc29uQm9keShyZXEpKTtcbiAgICBjb25zdCBtZXRob2QgPSB0eXBlb2YgYm9keT8ubWV0aG9kID09PSBcInN0cmluZ1wiID8gYm9keS5tZXRob2QgOiBcIlwiO1xuICAgIGNvbnN0IGFyZ3MgPSBBcnJheS5pc0FycmF5KGJvZHk/LmFyZ3MpID8gYm9keS5hcmdzIDogW107XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXdhaXQgY2FsbEhpZGRlbkJyaWRnZShtZXRob2QsIGFyZ3MpO1xuICAgICAgc2VuZEpzb24ocmVzLCAyMDAsIHsgb2s6IHRydWUsIHZhbHVlIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBzZW5kSnNvbihyZXMsIDUwMCwge1xuICAgICAgICBvazogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvciksXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHVybC5wYXRobmFtZSA9PT0gXCIvY29kZXhwcC9icm93c2VyLXVpL2JyaWRnZS5qc1wiKSB7XG4gICAgaWYgKHJlcS5tZXRob2QgIT09IFwiR0VUXCIgJiYgcmVxLm1ldGhvZCAhPT0gXCJIRUFEXCIpIHtcbiAgICAgIHNlbmRUZXh0KHJlcywgNDA1LCBcIk1ldGhvZCBOb3QgQWxsb3dlZFxcblwiLCBcInRleHQvcGxhaW47IGNoYXJzZXQ9dXRmLThcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNjcmlwdCA9IGJyb3dzZXJCcmlkZ2VTY3JpcHQoYXdhaXQgY29sbGVjdEluaXRpYWxTdGF0ZShvcHRpb25zKSk7XG4gICAgc2VuZEJ1ZmZlcihyZXMsIDIwMCwgQnVmZmVyLmZyb20oc2NyaXB0KSwgTUlNRV9UWVBFU1tcIi5qc1wiXSwgcmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChyZXEubWV0aG9kICE9PSBcIkdFVFwiICYmIHJlcS5tZXRob2QgIT09IFwiSEVBRFwiKSB7XG4gICAgc2VuZFRleHQocmVzLCA0MDUsIFwiTWV0aG9kIE5vdCBBbGxvd2VkXFxuXCIsIFwidGV4dC9wbGFpbjsgY2hhcnNldD11dGYtOFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodXJsLnBhdGhuYW1lID09PSBcIi9cIiB8fCB1cmwucGF0aG5hbWUgPT09IFwiL2luZGV4Lmh0bWxcIikge1xuICAgIGNvbnN0IGh0bWwgPSBhd2FpdCBicm93c2VySW5kZXhIdG1sKCk7XG4gICAgc2VuZEJ1ZmZlcihyZXMsIDIwMCwgQnVmZmVyLmZyb20oaHRtbCksIE1JTUVfVFlQRVNbXCIuaHRtbFwiXSwgcmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGZpbGUgPSB3ZWJ2aWV3RmlsZSh1cmwucGF0aG5hbWUpO1xuICBpZiAoIWZpbGUpIHtcbiAgICBzZW5kVGV4dChyZXMsIDQwNCwgXCJOb3QgRm91bmRcXG5cIiwgXCJ0ZXh0L3BsYWluOyBjaGFyc2V0PXV0Zi04XCIpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBjb250ZW50ID0gcmVhZEZpbGVTeW5jKGZpbGUpO1xuICBzZW5kQnVmZmVyKHJlcywgMjAwLCBjb250ZW50LCBtaW1lVHlwZShmaWxlKSwgcmVxLm1ldGhvZCA9PT0gXCJIRUFEXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVVcGdyYWRlKHJlcTogSW5jb21pbmdNZXNzYWdlLCBzb2NrZXQ6IFNvY2tldCwgaGVhZDogQnVmZmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHVybCA9IHJlcXVlc3RVcmwocmVxKTtcbiAgaWYgKCF1cmwpIHRocm93IG5ldyBFcnJvcihcImJhZCB3ZWJzb2NrZXQgVVJMXCIpO1xuICBpZiAodXJsLnBhdGhuYW1lICE9PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvcnBjXCIgJiYgdXJsLnBhdGhuYW1lICE9PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvY29udHJvbFwiKSB7XG4gICAgc29ja2V0LmRlc3Ryb3koKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgd3MgPSBhY2NlcHRXZWJTb2NrZXQocmVxLCBzb2NrZXQsIGhlYWQpO1xuICBpZiAodXJsLnBhdGhuYW1lID09PSBcIi9jb2RleHBwL2Jyb3dzZXItdWkvY29udHJvbFwiKSB7XG4gICAgY29udHJvbENsaWVudHMuYWRkKHdzKTtcbiAgICB3cy5vbkNsb3NlKCgpID0+IGNvbnRyb2xDbGllbnRzLmRlbGV0ZSh3cykpO1xuICAgIHdzLnNlbmRKc29uKHsgdHlwZTogXCJoZWxsb1wiIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGhvc3QgPSBhd2FpdCBlbnN1cmVCcm93c2VyVWlIb3N0KCk7XG4gIGNvbnN0IHsgcG9ydDEsIHBvcnQyIH0gPSBuZXcgTWVzc2FnZUNoYW5uZWxNYWluKCk7XG4gIGhvc3Qud2ViQ29udGVudHMucG9zdE1lc3NhZ2UoQ09OTkVDVF9QT1JUX0NIQU5ORUwsIHt9LCBbcG9ydDJdKTtcbiAgYnJpZGdlTWVzc2FnZVBvcnRUb1dlYlNvY2tldChwb3J0MSwgd3MpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBicm93c2VySW5kZXhIdG1sKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGluZGV4UGF0aCA9IGpvaW4od2Vidmlld1Jvb3QoKSwgXCJpbmRleC5odG1sXCIpO1xuICBsZXQgaHRtbCA9IHJlbGF4QnJvd3NlclVpQ3NwKHJlYWRGaWxlU3luYyhpbmRleFBhdGgsIFwidXRmOFwiKSk7XG4gIGNvbnN0IHNoaW0gPSBgPHNjcmlwdCBzcmM9XCIvY29kZXhwcC9icm93c2VyLXVpL2JyaWRnZS5qc1wiPjwvc2NyaXB0PmA7XG4gIGlmIChodG1sLmluY2x1ZGVzKFwiPC9oZWFkPlwiKSkge1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoXCI8L2hlYWQ+XCIsIGAke3NoaW19XFxuICA8L2hlYWQ+YCk7XG4gIH0gZWxzZSB7XG4gICAgaHRtbCA9IGAke3NoaW19XFxuJHtodG1sfWA7XG4gIH1cbiAgcmV0dXJuIGh0bWw7XG59XG5cbmZ1bmN0aW9uIHJlbGF4QnJvd3NlclVpQ3NwKGh0bWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBodG1sLnJlcGxhY2UoXG4gICAgLyg8bWV0YVxccytodHRwLWVxdWl2PVtcIiddQ29udGVudC1TZWN1cml0eS1Qb2xpY3lbXCInXVxccytjb250ZW50PVwiKShbXlwiXSopKFwiKS8sXG4gICAgKF9tYXRjaCwgcHJlZml4OiBzdHJpbmcsIGNvbnRlbnQ6IHN0cmluZywgc3VmZml4OiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSBwYXJzZUNzcERpcmVjdGl2ZXMoZGVjb2RlSHRtbEF0dHJpYnV0ZShjb250ZW50KSk7XG4gICAgICBkaXJlY3RpdmVzLnNldChcImNoaWxkLXNyY1wiLCBcIidzZWxmJyBibG9iOiBkYXRhOiBodHRwOiBodHRwczpcIik7XG4gICAgICBkaXJlY3RpdmVzLnNldChcImZyYW1lLXNyY1wiLCBcIidzZWxmJyBibG9iOiBkYXRhOiBodHRwOiBodHRwczpcIik7XG4gICAgICBkaXJlY3RpdmVzLnNldChcImNvbm5lY3Qtc3JjXCIsIFwiJ3NlbGYnIGh0dHA6IGh0dHBzOiB3czogd3NzOiBzZW50cnktaXBjOlwiKTtcbiAgICAgIHJldHVybiBgJHtwcmVmaXh9JHtlbmNvZGVIdG1sQXR0cmlidXRlKGZvcm1hdENzcERpcmVjdGl2ZXMoZGlyZWN0aXZlcykpfSR7c3VmZml4fWA7XG4gICAgfSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VDc3BEaXJlY3RpdmVzKGNvbnRlbnQ6IHN0cmluZyk6IE1hcDxzdHJpbmcsIHN0cmluZz4ge1xuICBjb25zdCBkaXJlY3RpdmVzID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBwYXJ0IG9mIGNvbnRlbnQuc3BsaXQoXCI7XCIpKSB7XG4gICAgY29uc3QgdHJpbW1lZCA9IHBhcnQudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgY29uc3QgW25hbWUsIC4uLnJlc3RdID0gdHJpbW1lZC5zcGxpdCgvXFxzKy8pO1xuICAgIGlmICghbmFtZSkgY29udGludWU7XG4gICAgZGlyZWN0aXZlcy5zZXQobmFtZSwgcmVzdC5qb2luKFwiIFwiKSk7XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZXM7XG59XG5cbmZ1bmN0aW9uIGZvcm1hdENzcERpcmVjdGl2ZXMoZGlyZWN0aXZlczogTWFwPHN0cmluZywgc3RyaW5nPik6IHN0cmluZyB7XG4gIHJldHVybiBbLi4uZGlyZWN0aXZlcy5lbnRyaWVzKCldXG4gICAgLm1hcCgoW25hbWUsIHZhbHVlXSkgPT4gKHZhbHVlID8gYCR7bmFtZX0gJHt2YWx1ZX1gIDogbmFtZSkpXG4gICAgLmpvaW4oXCI7IFwiKTtcbn1cblxuZnVuY3Rpb24gZGVjb2RlSHRtbEF0dHJpYnV0ZSh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlXG4gICAgLnJlcGxhY2UoLyZxdW90Oy9nLCAnXCInKVxuICAgIC5yZXBsYWNlKC8mIzM5Oy9nLCBcIidcIilcbiAgICAucmVwbGFjZSgvJmx0Oy9nLCBcIjxcIilcbiAgICAucmVwbGFjZSgvJmd0Oy9nLCBcIj5cIilcbiAgICAucmVwbGFjZSgvJmFtcDsvZywgXCImXCIpO1xufVxuXG5mdW5jdGlvbiBlbmNvZGVIdG1sQXR0cmlidXRlKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWVcbiAgICAucmVwbGFjZSgvJi9nLCBcIiZhbXA7XCIpXG4gICAgLnJlcGxhY2UoL1wiL2csIFwiJnF1b3Q7XCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjb2xsZWN0SW5pdGlhbFN0YXRlKG9wdGlvbnM6IEJyb3dzZXJVaVNlcnZlck9wdGlvbnMpOiBQcm9taXNlPEluaXRpYWxTdGF0ZT4ge1xuICBhd2FpdCBlbnN1cmVCcm93c2VyVWlIb3N0KCk7XG4gIGNvbnN0IFtzbmFwc2hvdCwgc3lzdGVtVGhlbWVWYXJpYW50LCBzZW50cnlJbml0T3B0aW9ucywgYnVpbGRGbGF2b3IsIHVzZXNPd2xBcHBTaGVsbF0gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgY2FsbEhpZGRlbkJyaWRnZShcInNuYXBzaG90XCIsIFtdKSxcbiAgICBjYWxsSGlkZGVuQnJpZGdlKFwic3lzdGVtVGhlbWVcIiwgW10pLFxuICAgIGNhbGxIaWRkZW5CcmlkZ2UoXCJzZW50cnlPcHRpb25zXCIsIFtdKSxcbiAgICBjYWxsSGlkZGVuQnJpZGdlKFwiYnVpbGRGbGF2b3JcIiwgW10pLFxuICAgIGNhbGxIaWRkZW5CcmlkZ2UoXCJ1c2VzT3dsQXBwU2hlbGxcIiwgW10pLFxuICBdKTtcbiAgaWYgKG9wdGlvbnMuaGlkZU1haW5XaW5kb3cpIGhpZGVWaXNpYmxlQ29kZXhXaW5kb3dzKCk7XG4gIHJldHVybiB7XG4gICAgc25hcHNob3Q6IGFzUGxhaW5PYmplY3Qoc25hcHNob3QpLFxuICAgIHN5c3RlbVRoZW1lVmFyaWFudDogdHlwZW9mIHN5c3RlbVRoZW1lVmFyaWFudCA9PT0gXCJzdHJpbmdcIiA/IHN5c3RlbVRoZW1lVmFyaWFudCA6IGN1cnJlbnRTeXN0ZW1UaGVtZVZhcmlhbnQoKSxcbiAgICBzZW50cnlJbml0T3B0aW9ucyxcbiAgICBidWlsZEZsYXZvcixcbiAgICB1c2VzT3dsQXBwU2hlbGw6IHVzZXNPd2xBcHBTaGVsbCA9PT0gdHJ1ZSxcbiAgICBwbGF0Zm9ybTogcHJvY2Vzcy5wbGF0Zm9ybSxcbiAgICBhcmNoOiBwcm9jZXNzLmFyY2gsXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGVuc3VyZUJyb3dzZXJVaUhvc3QoKTogUHJvbWlzZTxCcm93c2VyVWlIb3N0PiB7XG4gIGlmIChhY3RpdmVIb3N0ICYmICFhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmlzRGVzdHJveWVkKCkpIHJldHVybiBhY3RpdmVIb3N0O1xuICBjb25zdCBvcHRpb25zID0gcmVxdWlyZU9wdGlvbnMoKTtcbiAgY29uc3Qgc2VydmljZXMgPSBhd2FpdCB3YWl0Rm9yV2luZG93U2VydmljZXMob3B0aW9ucyk7XG4gIGNvbnN0IHdpbmRvd01hbmFnZXIgPSBzZXJ2aWNlcy53aW5kb3dNYW5hZ2VyO1xuICBpZiAoIXdpbmRvd01hbmFnZXI/LnJlZ2lzdGVyV2luZG93KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ29kZXggd2luZG93IHJlZ2lzdHJhdGlvbiBzZXJ2aWNlcyBhcmUgdW5hdmFpbGFibGVcIik7XG4gIH1cblxuICBjb25zdCB2aWV3ID0gbmV3IEJyb3dzZXJWaWV3KHtcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgcHJlbG9hZDogd2luZG93TWFuYWdlci5vcHRpb25zPy5wcmVsb2FkUGF0aCxcbiAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgc3BlbGxjaGVjazogZmFsc2UsXG4gICAgICBkZXZUb29sczogd2luZG93TWFuYWdlci5vcHRpb25zPy5hbGxvd0RldnRvb2xzLFxuICAgIH0sXG4gIH0pO1xuICBjb25zdCB3aW5kb3dMaWtlID0gbWFrZVdpbmRvd0xpa2VGb3JWaWV3KHZpZXcpO1xuICB3aW5kb3dNYW5hZ2VyLnJlZ2lzdGVyV2luZG93KHdpbmRvd0xpa2UsIFwibG9jYWxcIiwgZmFsc2UsIFwic2Vjb25kYXJ5XCIpO1xuICBjb25zdCBjb250ZXh0ID0gc2VydmljZXMuZ2V0Q29udGV4dEZvcldlYkNvbnRlbnRzPy4odmlldy53ZWJDb250ZW50cykgPz8gc2VydmljZXMuZ2V0Q29udGV4dD8uKFwibG9jYWxcIik7XG4gIGNvbnRleHQ/LnJlZ2lzdGVyV2luZG93Py4od2luZG93TGlrZSk7XG4gIGF3YWl0IHZpZXcud2ViQ29udGVudHMubG9hZFVSTChcImFib3V0OmJsYW5rXCIpO1xuICBhY3RpdmVIb3N0ID0geyB2aWV3LCB3ZWJDb250ZW50czogdmlldy53ZWJDb250ZW50cyB9O1xuICB2aWV3LndlYkNvbnRlbnRzLm9uY2UoXCJkZXN0cm95ZWRcIiwgKCkgPT4ge1xuICAgIGlmIChhY3RpdmVIb3N0Py53ZWJDb250ZW50cyA9PT0gdmlldy53ZWJDb250ZW50cykgYWN0aXZlSG9zdCA9IG51bGw7XG4gIH0pO1xuICBvcHRpb25zLmxvZyhcImluZm9cIiwgXCJicm93c2VyIFVJIGhpZGRlbiBob3N0IHJlYWR5XCIsIHsgd2ViQ29udGVudHNJZDogdmlldy53ZWJDb250ZW50cy5pZCB9KTtcbiAgcmV0dXJuIGFjdGl2ZUhvc3Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdhaXRGb3JXaW5kb3dTZXJ2aWNlcyhvcHRpb25zOiBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zKTogUHJvbWlzZTxDb2RleFdpbmRvd1NlcnZpY2VzPiB7XG4gIGNvbnN0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICB3aGlsZSAoRGF0ZS5ub3coKSAtIHN0YXJ0ZWQgPCAzMF8wMDApIHtcbiAgICBjb25zdCBzZXJ2aWNlcyA9IG9wdGlvbnMuZ2V0V2luZG93U2VydmljZXMoKTtcbiAgICBpZiAoXG4gICAgICBzZXJ2aWNlcz8ud2luZG93TWFuYWdlcj8ucmVnaXN0ZXJXaW5kb3cgJiZcbiAgICAgIChzZXJ2aWNlcy5nZXRDb250ZXh0IHx8IHNlcnZpY2VzLmdldENvbnRleHRGb3JXZWJDb250ZW50cylcbiAgICApIHtcbiAgICAgIHJldHVybiBzZXJ2aWNlcztcbiAgICB9XG4gICAgYXdhaXQgZGVsYXkoMTAwKTtcbiAgfVxuICB0aHJvdyBuZXcgRXJyb3IoXCJUaW1lZCBvdXQgd2FpdGluZyBmb3IgQ29kZXggd2luZG93IHNlcnZpY2VzXCIpO1xufVxuXG5mdW5jdGlvbiBjYWxsSGlkZGVuQnJpZGdlKG1ldGhvZDogc3RyaW5nLCBhcmdzOiB1bmtub3duW10pOiBQcm9taXNlPHVua25vd24+IHtcbiAgYXNzZXJ0QnJpZGdlTWV0aG9kKG1ldGhvZCk7XG4gIHJldHVybiBlbnN1cmVCcm93c2VyVWlIb3N0KCkudGhlbigoaG9zdCkgPT4ge1xuICAgIGNvbnN0IGlkID0gcmFuZG9tVVVJRCgpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBicmlkZ2VSZXF1ZXN0cy5kZWxldGUoaWQpO1xuICAgICAgICByZWplY3QobmV3IEVycm9yKGBUaW1lZCBvdXQgd2FpdGluZyBmb3IgYnJvd3NlciBVSSBicmlkZ2UgbWV0aG9kOiAke21ldGhvZH1gKSk7XG4gICAgICB9LCAxNV8wMDApO1xuICAgICAgYnJpZGdlUmVxdWVzdHMuc2V0KGlkLCB7IHJlc29sdmUsIHJlamVjdCwgdGltZXIgfSk7XG4gICAgICBob3N0LndlYkNvbnRlbnRzLnNlbmQoQlJJREdFX1JFUVVFU1RfQ0hBTk5FTCwgeyBpZCwgbWV0aG9kLCBhcmdzIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gYnJpZGdlTWVzc2FnZVBvcnRUb1dlYlNvY2tldChwb3J0OiBFbGVjdHJvbi5NZXNzYWdlUG9ydE1haW4sIHdzOiBXZWJTb2NrZXRDb25uZWN0aW9uKTogdm9pZCB7XG4gIGxldCBjbG9zZWQgPSBmYWxzZTtcbiAgY29uc3QgY2xvc2UgPSAoKSA9PiB7XG4gICAgaWYgKGNsb3NlZCkgcmV0dXJuO1xuICAgIGNsb3NlZCA9IHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIHBvcnQucG9zdE1lc3NhZ2UobnVsbCk7XG4gICAgfSBjYXRjaCB7fVxuICAgIHRyeSB7XG4gICAgICBwb3J0LmNsb3NlKCk7XG4gICAgfSBjYXRjaCB7fVxuICAgIHdzLmNsb3NlKCk7XG4gIH07XG4gIHBvcnQuc3RhcnQoKTtcbiAgcG9ydC5vbihcIm1lc3NhZ2VcIiwgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGNsb3NlZCkgcmV0dXJuO1xuICAgIGlmIChldmVudC5kYXRhID09IG51bGwpIHtcbiAgICAgIGNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZXZlbnQuZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgd3Muc2VuZFRleHQoZXZlbnQuZGF0YSk7XG4gICAgfVxuICB9KTtcbiAgcG9ydC5vbihcImNsb3NlXCIsIGNsb3NlKTtcbiAgd3Mub25UZXh0KCh0ZXh0KSA9PiB7XG4gICAgaWYgKGNsb3NlZCkgcmV0dXJuO1xuICAgIHBvcnQucG9zdE1lc3NhZ2UodGV4dCk7XG4gIH0pO1xuICB3cy5vbkNsb3NlKGNsb3NlKTtcbn1cblxuZnVuY3Rpb24gYnJvYWRjYXN0Q29udHJvbChwYXlsb2FkOiB1bmtub3duKTogdm9pZCB7XG4gIGZvciAoY29uc3QgY2xpZW50IG9mIFsuLi5jb250cm9sQ2xpZW50c10pIHtcbiAgICB0cnkge1xuICAgICAgY2xpZW50LnNlbmRKc29uKHBheWxvYWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgY2xpZW50LmNsb3NlKCk7XG4gICAgICBjb250cm9sQ2xpZW50cy5kZWxldGUoY2xpZW50KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYnJvd3NlckJyaWRnZVNjcmlwdChzdGF0ZTogSW5pdGlhbFN0YXRlKTogc3RyaW5nIHtcbiAgcmV0dXJuIGBcbigoKSA9PiB7XG4gIGNvbnN0IGluaXRpYWxTdGF0ZSA9ICR7c2FmZUpzb24oc3RhdGUpfTtcbiAgY29uc3Qgc25hcHNob3QgPSBuZXcgTWFwKE9iamVjdC5lbnRyaWVzKGluaXRpYWxTdGF0ZS5zbmFwc2hvdCB8fCB7fSkpO1xuICBjb25zdCB3b3JrZXJTdWJzY3JpYmVycyA9IG5ldyBNYXAoKTtcbiAgY29uc3QgdGhlbWVTdWJzY3JpYmVycyA9IG5ldyBTZXQoKTtcbiAgY29uc3QgYnJvd3NlclNpZGViYXJTbmFwc2hvdHMgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IGJyb3dzZXJTaWRlYmFyU2VlZGVkTG9jYWxTZXJ2ZXJzID0gbmV3IFNldCgpO1xuICBsZXQgc3lzdGVtVGhlbWVWYXJpYW50ID0gaW5pdGlhbFN0YXRlLnN5c3RlbVRoZW1lVmFyaWFudCB8fCBcImxpZ2h0XCI7XG5cbiAgd2luZG93Ll9fY29kZXhwcEJyb3dzZXJVaSA9IHRydWU7XG4gIGluc3RhbGxCcm93c2VyVWlXZWJ2aWV3U2hpbSgpO1xuXG4gIGNvbnN0IGNvbnRyb2wgPSBuZXcgV2ViU29ja2V0KG5ldyBVUkwoXCIvY29kZXhwcC9icm93c2VyLXVpL2NvbnRyb2xcIiwgbG9jYXRpb24uaHJlZikpO1xuICBjb250cm9sLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChldmVudCkgPT4ge1xuICAgIGxldCBwYXlsb2FkO1xuICAgIHRyeSB7IHBheWxvYWQgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpOyB9IGNhdGNoIHsgcmV0dXJuOyB9XG4gICAgaWYgKHBheWxvYWQudHlwZSA9PT0gXCJtZXNzYWdlLWZvci12aWV3XCIpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBwYXlsb2FkLm1lc3NhZ2U7XG4gICAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnR5cGUgPT09IFwic2hhcmVkLW9iamVjdC11cGRhdGVkXCIpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UudmFsdWUgPT09IHVuZGVmaW5lZCkgc25hcHNob3QuZGVsZXRlKG1lc3NhZ2Uua2V5KTtcbiAgICAgICAgZWxzZSBzbmFwc2hvdC5zZXQobWVzc2FnZS5rZXksIG1lc3NhZ2UudmFsdWUpO1xuICAgICAgfVxuICAgICAgcmVtZW1iZXJCcm93c2VyU2lkZWJhckhvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IE1lc3NhZ2VFdmVudChcIm1lc3NhZ2VcIiwgeyBkYXRhOiBtZXNzYWdlIH0pKTtcbiAgICB9IGVsc2UgaWYgKHBheWxvYWQudHlwZSA9PT0gXCJ3b3JrZXItbWVzc2FnZVwiKSB7XG4gICAgICBjb25zdCBzdWJzID0gd29ya2VyU3Vic2NyaWJlcnMuZ2V0KHBheWxvYWQud29ya2VySWQpO1xuICAgICAgaWYgKHN1YnMpIGZvciAoY29uc3QgZm4gb2YgWy4uLnN1YnNdKSBmbihwYXlsb2FkLm1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZiAocGF5bG9hZC50eXBlID09PSBcInN5c3RlbS10aGVtZS12YXJpYW50LXVwZGF0ZWRcIikge1xuICAgICAgc3lzdGVtVGhlbWVWYXJpYW50ID0gcGF5bG9hZC52YWx1ZTtcbiAgICAgIGZvciAoY29uc3QgZm4gb2YgWy4uLnRoZW1lU3Vic2NyaWJlcnNdKSBmbigpO1xuICAgIH1cbiAgfSk7XG5cbiAgYXN5bmMgZnVuY3Rpb24gYnJpZGdlKG1ldGhvZCwgYXJncyA9IFtdKSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2goXCIvY29kZXhwcC9icm93c2VyLXVpL2JyaWRnZVwiLCB7XG4gICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgaGVhZGVyczogeyBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXRob2QsIGFyZ3MgfSksXG4gICAgfSk7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgaWYgKCFib2R5Lm9rKSB0aHJvdyBuZXcgRXJyb3IoYm9keS5lcnJvciB8fCBcIkNvZGV4KysgYnJvd3NlciBicmlkZ2UgZmFpbGVkXCIpO1xuICAgIHJldHVybiBib2R5LnZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gbGVnYWN5QnJvd3NlclRhYklkKGNvbnZlcnNhdGlvbklkKSB7XG4gICAgcmV0dXJuIFN0cmluZyhjb252ZXJzYXRpb25JZCB8fCBcIm5ldy1jb252ZXJzYXRpb25cIikgKyBcIjpsZWdhY3lcIjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJyb3dzZXJTaWRlYmFyS2V5KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpIHtcbiAgICByZXR1cm4gU3RyaW5nKGNvbnZlcnNhdGlvbklkIHx8IFwibmV3LWNvbnZlcnNhdGlvblwiKSArIFwiOjpcIiArIFN0cmluZyhicm93c2VyVGFiSWQgfHwgbGVnYWN5QnJvd3NlclRhYklkKGNvbnZlcnNhdGlvbklkKSk7XG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVCcm93c2VyVXJsKHZhbHVlKSB7XG4gICAgY29uc3QgcmF3ID0gU3RyaW5nKHZhbHVlIHx8IFwiXCIpLnRyaW0oKTtcbiAgICBpZiAoIXJhdykgcmV0dXJuIFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBuZXcgVVJMKHJhdykuaHJlZjtcbiAgICB9IGNhdGNoIHt9XG4gICAgaWYgKC9eW2EtekEtWl1bYS16QS1aMC05Ky4tXSo6Ly50ZXN0KHJhdykpIHJldHVybiByYXc7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBuZXcgVVJMKFwiaHR0cHM6Ly9cIiArIHJhdykuaHJlZjtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybiByYXc7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYnJvd3NlclRpdGxlRm9yVXJsKHVybCkge1xuICAgIGlmICghdXJsKSByZXR1cm4gXCJOZXcgdGFiXCI7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhvc3QgPSBuZXcgVVJMKHVybCkuaG9zdG5hbWUucmVwbGFjZSgvXnd3d1xcXFwuLywgXCJcIik7XG4gICAgICByZXR1cm4gaG9zdCB8fCB1cmw7XG4gICAgfSBjYXRjaCB7XG4gICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VCcm93c2VyU2lkZWJhclNuYXBzaG90KHVybCwgcGF0Y2ggPSB7fSkge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVCcm93c2VyVXJsKHVybCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRhYlR5cGU6IG5vcm1hbGl6ZWQgPyBcIndlYlwiIDogXCJuZXctdGFiLXBhZ2VcIixcbiAgICAgIGlzU3VzcGVuZGVkOiBmYWxzZSxcbiAgICAgIHRpdGxlOiBub3JtYWxpemVkID8gYnJvd3NlclRpdGxlRm9yVXJsKG5vcm1hbGl6ZWQpIDogXCJOZXcgdGFiXCIsXG4gICAgICB1cmw6IG5vcm1hbGl6ZWQsXG4gICAgICBmYXZpY29uVXJsOiBudWxsLFxuICAgICAgaXNMb2FkaW5nOiBmYWxzZSxcbiAgICAgIGNhbkdvQmFjazogZmFsc2UsXG4gICAgICBjYW5Hb0ZvcndhcmQ6IGZhbHNlLFxuICAgICAgem9vbVBlcmNlbnQ6IDEwMCxcbiAgICAgIGNvbW1lbnRNb2RlRGlzYWJsZWRSZWFzb246IG51bGwsXG4gICAgICBpbnRlcmFjdGlvbk1vZGU6IFwiYnJvd3NlXCIsXG4gICAgICBhbm5vdGF0aW9uRWRpdG9yTW9kZTogXCJjb21tZW50XCIsXG4gICAgICBpc0Fubm90YXRpb25BZGRNb2RpZmllclByZXNzZWQ6IGZhbHNlLFxuICAgICAgaXNPcmlnaW5hbFZpZXdFbmFibGVkOiBmYWxzZSxcbiAgICAgIGlzVHdlYWtzRWRpdG9yT3BlbjogZmFsc2UsXG4gICAgICBjb21tZW50czogW10sXG4gICAgICAuLi5wYXRjaCxcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZGlzcGF0Y2hCcm93c2VyU2lkZWJhck1lc3NhZ2UobWVzc2FnZSkge1xuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBNZXNzYWdlRXZlbnQoXCJtZXNzYWdlXCIsIHsgZGF0YTogbWVzc2FnZSB9KSk7XG4gIH1cblxuICBmdW5jdGlvbiBzZWVkQnJvd3NlclNpZGViYXJMb2NhbFNlcnZlcnMoY29udmVyc2F0aW9uSWQpIHtcbiAgICBpZiAoIWNvbnZlcnNhdGlvbklkIHx8IGJyb3dzZXJTaWRlYmFyU2VlZGVkTG9jYWxTZXJ2ZXJzLmhhcyhjb252ZXJzYXRpb25JZCkpIHJldHVybjtcbiAgICBicm93c2VyU2lkZWJhclNlZWRlZExvY2FsU2VydmVycy5hZGQoY29udmVyc2F0aW9uSWQpO1xuICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgIGRpc3BhdGNoQnJvd3NlclNpZGViYXJNZXNzYWdlKHtcbiAgICAgICAgdHlwZTogXCJicm93c2VyLXNpZGViYXItbG9jYWwtc2VydmVyc1wiLFxuICAgICAgICBjb252ZXJzYXRpb25JZCxcbiAgICAgICAgc3RhdGU6IHsgaXNMb2FkaW5nOiBmYWxzZSwgc2VydmVyczogW10sIGhpZGRlblNlcnZlcnM6IFtdIH0sXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbWVtYmVyQnJvd3NlclNpZGViYXJIb3N0TWVzc2FnZShtZXNzYWdlKSB7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHR5cGVvZiBtZXNzYWdlICE9PSBcIm9iamVjdFwiKSByZXR1cm47XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJicm93c2VyLXNpZGViYXItc3RhdGVcIikge1xuICAgICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBtZXNzYWdlLmNvbnZlcnNhdGlvbklkO1xuICAgICAgaWYgKCFjb252ZXJzYXRpb25JZCB8fCAhbWVzc2FnZS5zbmFwc2hvdCkgcmV0dXJuO1xuICAgICAgYnJvd3NlclNpZGViYXJTbmFwc2hvdHMuc2V0KGJyb3dzZXJTaWRlYmFyS2V5KGNvbnZlcnNhdGlvbklkLCBtZXNzYWdlLmJyb3dzZXJUYWJJZCksIG1lc3NhZ2Uuc25hcHNob3QpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSBcImJyb3dzZXItc2lkZWJhci1sb2NhbC1zZXJ2ZXJzXCIpIHtcbiAgICAgIGlmIChtZXNzYWdlLmNvbnZlcnNhdGlvbklkKSBicm93c2VyU2lkZWJhclNlZWRlZExvY2FsU2VydmVycy5hZGQobWVzc2FnZS5jb252ZXJzYXRpb25JZCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgc25hcHNob3RQYXRjaCkge1xuICAgIGlmICghY29udmVyc2F0aW9uSWQpIHJldHVybjtcbiAgICBjb25zdCBrZXkgPSBicm93c2VyU2lkZWJhcktleShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKTtcbiAgICBjb25zdCBwcmV2aW91cyA9IGJyb3dzZXJTaWRlYmFyU25hcHNob3RzLmdldChrZXkpIHx8IG1ha2VCcm93c2VyU2lkZWJhclNuYXBzaG90KFwiXCIpO1xuICAgIGNvbnN0IG5leHQgPSB7IC4uLnByZXZpb3VzLCAuLi5zbmFwc2hvdFBhdGNoIH07XG4gICAgYnJvd3NlclNpZGViYXJTbmFwc2hvdHMuc2V0KGtleSwgbmV4dCk7XG4gICAgZGlzcGF0Y2hCcm93c2VyU2lkZWJhck1lc3NhZ2Uoe1xuICAgICAgdHlwZTogXCJicm93c2VyLXNpZGViYXItc3RhdGVcIixcbiAgICAgIGNvbnZlcnNhdGlvbklkLFxuICAgICAgLi4uKGJyb3dzZXJUYWJJZCA/IHsgYnJvd3NlclRhYklkIH0gOiB7fSksXG4gICAgICBzbmFwc2hvdDogbmV4dCxcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldEJyb3dzZXJTaWRlYmFyVXJsKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIHVybCwgaXNMb2FkaW5nID0gZmFsc2UpIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQnJvd3NlclVybCh1cmwpO1xuICAgIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIG1ha2VCcm93c2VyU2lkZWJhclNuYXBzaG90KG5vcm1hbGl6ZWQsIHsgaXNMb2FkaW5nIH0pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRCcm93c2VyU2lkZWJhckZyYW1lKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpIHtcbiAgICBjb25zdCBzZWxlY3RvciA9IFwiW2RhdGEtYnJvd3Nlci1zaWRlYmFyLWNvbnZlcnNhdGlvbi1pZD0nXCIgKyBjc3NFc2NhcGUoY29udmVyc2F0aW9uSWQpICsgXCInXVtkYXRhLWJyb3dzZXItc2lkZWJhci1icm93c2VyLXRhYi1pZD0nXCIgKyBjc3NFc2NhcGUoYnJvd3NlclRhYklkIHx8IGxlZ2FjeUJyb3dzZXJUYWJJZChjb252ZXJzYXRpb25JZCkpICsgXCInXVwiO1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNzc0VzY2FwZSh2YWx1ZSkge1xuICAgIGlmICh3aW5kb3cuQ1NTICYmIHR5cGVvZiB3aW5kb3cuQ1NTLmVzY2FwZSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gd2luZG93LkNTUy5lc2NhcGUoU3RyaW5nKHZhbHVlKSk7XG4gICAgcmV0dXJuIFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvWydcXFxcXFxcXF0vZywgXCJcXFxcXFxcXCQmXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFuZGxlQnJvd3NlclNpZGViYXJWaWV3TWVzc2FnZShtZXNzYWdlKSB7XG4gICAgaWYgKCFtZXNzYWdlIHx8IHR5cGVvZiBtZXNzYWdlICE9PSBcIm9iamVjdFwiKSByZXR1cm47XG4gICAgaWYgKG1lc3NhZ2UudHlwZSA9PT0gXCJicm93c2VyLXNpZGViYXItc3luY1wiKSB7XG4gICAgICBjb25zdCBwYXlsb2FkID0gbWVzc2FnZS5wYXlsb2FkIHx8IHt9O1xuICAgICAgc2VlZEJyb3dzZXJTaWRlYmFyTG9jYWxTZXJ2ZXJzKHBheWxvYWQuY29udmVyc2F0aW9uSWQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAobWVzc2FnZS50eXBlID09PSBcImJyb3dzZXItc2lkZWJhci1vd25lci1zeW5jXCIpIHtcbiAgICAgIHNlZWRCcm93c2VyU2lkZWJhckxvY2FsU2VydmVycyhtZXNzYWdlLmNvbnZlcnNhdGlvbklkKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG1lc3NhZ2UudHlwZSAhPT0gXCJicm93c2VyLXNpZGViYXItY29tbWFuZFwiKSByZXR1cm47XG5cbiAgICBjb25zdCBjb252ZXJzYXRpb25JZCA9IG1lc3NhZ2UuY29udmVyc2F0aW9uSWQ7XG4gICAgY29uc3QgYnJvd3NlclRhYklkID0gbWVzc2FnZS5icm93c2VyVGFiSWQ7XG4gICAgY29uc3QgY29tbWFuZCA9IG1lc3NhZ2UuY29tbWFuZCB8fCB7fTtcbiAgICBzZWVkQnJvd3NlclNpZGViYXJMb2NhbFNlcnZlcnMoY29udmVyc2F0aW9uSWQpO1xuXG4gICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJuYXZpZ2F0ZVwiKSB7XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplQnJvd3NlclVybChjb21tYW5kLnVybCk7XG4gICAgICBzZXRCcm93c2VyU2lkZWJhclVybChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCBub3JtYWxpemVkLCB0cnVlKTtcbiAgICAgIHF1ZXVlTWljcm90YXNrKCgpID0+IHtcbiAgICAgICAgY29uc3QgZnJhbWUgPSBmaW5kQnJvd3NlclNpZGViYXJGcmFtZShjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkKTtcbiAgICAgICAgaWYgKCFmcmFtZSB8fCAhbm9ybWFsaXplZCB8fCBmcmFtZS5nZXRVUkw/LigpID09PSBub3JtYWxpemVkKSByZXR1cm47XG4gICAgICAgIGZyYW1lLmxvYWRVUkw/Lihub3JtYWxpemVkKTtcbiAgICAgIH0pO1xuICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gc2V0QnJvd3NlclNpZGViYXJVcmwoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgbm9ybWFsaXplZCwgZmFsc2UpLCA1MDApO1xuICAgIH0gZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBcInJlbG9hZFwiKSB7XG4gICAgICBjb25zdCBmcmFtZSA9IGZpbmRCcm93c2VyU2lkZWJhckZyYW1lKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpO1xuICAgICAgZnJhbWU/LnJlbG9hZD8uKCk7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYnJvd3NlclNpZGViYXJTbmFwc2hvdHMuZ2V0KGJyb3dzZXJTaWRlYmFyS2V5KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpKTtcbiAgICAgIGlmIChjdXJyZW50Py51cmwpIHtcbiAgICAgICAgc2VuZEJyb3dzZXJTaWRlYmFyU25hcHNob3QoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCwgeyAuLi5jdXJyZW50LCBpc0xvYWRpbmc6IHRydWUgfSk7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIHsgLi4uY3VycmVudCwgaXNMb2FkaW5nOiBmYWxzZSB9KSwgMjUwKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gXCJnby1iYWNrXCIpIHtcbiAgICAgIGZpbmRCcm93c2VyU2lkZWJhckZyYW1lKGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpPy5nb0JhY2s/LigpO1xuICAgIH0gZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBcImdvLWZvcndhcmRcIikge1xuICAgICAgZmluZEJyb3dzZXJTaWRlYmFyRnJhbWUoY29udmVyc2F0aW9uSWQsIGJyb3dzZXJUYWJJZCk/LmdvRm9yd2FyZD8uKCk7XG4gICAgfSBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IFwic3RvcFwiKSB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gYnJvd3NlclNpZGViYXJTbmFwc2hvdHMuZ2V0KGJyb3dzZXJTaWRlYmFyS2V5KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQpKTtcbiAgICAgIGlmIChjdXJyZW50KSBzZW5kQnJvd3NlclNpZGViYXJTbmFwc2hvdChjb252ZXJzYXRpb25JZCwgYnJvd3NlclRhYklkLCB7IC4uLmN1cnJlbnQsIGlzTG9hZGluZzogZmFsc2UgfSk7XG4gICAgfSBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IFwicmVzZXRcIiB8fCBjb21tYW5kLnR5cGUgPT09IFwiY2xvc2UtdGFiXCIpIHtcbiAgICAgIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIG1ha2VCcm93c2VyU2lkZWJhclNuYXBzaG90KFwiXCIpKTtcbiAgICB9XG4gIH1cblxuICB3aW5kb3cuY29kZXhXaW5kb3dUeXBlID0gXCJlbGVjdHJvblwiO1xuICB3aW5kb3cuZWxlY3Ryb25CcmlkZ2UgPSB7XG4gICAgd2luZG93VHlwZTogXCJlbGVjdHJvblwiLFxuICAgIHNlbmRNZXNzYWdlRnJvbVZpZXc6IChtZXNzYWdlKSA9PiB7XG4gICAgICBpZiAobWVzc2FnZSAmJiBtZXNzYWdlLnR5cGUgPT09IFwic2hhcmVkLW9iamVjdC1zZXRcIikgc25hcHNob3Quc2V0KG1lc3NhZ2Uua2V5LCBtZXNzYWdlLnZhbHVlKTtcbiAgICAgIGhhbmRsZUJyb3dzZXJTaWRlYmFyVmlld01lc3NhZ2UobWVzc2FnZSk7XG4gICAgICByZXR1cm4gYnJpZGdlKFwic2VuZE1lc3NhZ2VGcm9tVmlld1wiLCBbbWVzc2FnZV0pO1xuICAgIH0sXG4gICAgZ2V0UGF0aEZvckZpbGU6ICgpID0+IG51bGwsXG4gICAgc2VuZFdvcmtlck1lc3NhZ2VGcm9tVmlldzogKHdvcmtlcklkLCBtZXNzYWdlKSA9PiBicmlkZ2UoXCJzZW5kV29ya2VyTWVzc2FnZUZyb21WaWV3XCIsIFt3b3JrZXJJZCwgbWVzc2FnZV0pLFxuICAgIHN1YnNjcmliZVRvV29ya2VyTWVzc2FnZXM6ICh3b3JrZXJJZCwgaGFuZGxlcikgPT4ge1xuICAgICAgbGV0IHN1YnMgPSB3b3JrZXJTdWJzY3JpYmVycy5nZXQod29ya2VySWQpO1xuICAgICAgaWYgKCFzdWJzKSB7XG4gICAgICAgIHN1YnMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHdvcmtlclN1YnNjcmliZXJzLnNldCh3b3JrZXJJZCwgc3Vicyk7XG4gICAgICAgIGJyaWRnZShcInN1YnNjcmliZVdvcmtlck1lc3NhZ2VzXCIsIFt3b3JrZXJJZF0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgICAgfVxuICAgICAgc3Vicy5hZGQoaGFuZGxlcik7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gd29ya2VyU3Vic2NyaWJlcnMuZ2V0KHdvcmtlcklkKTtcbiAgICAgICAgaWYgKCFjdXJyZW50KSByZXR1cm47XG4gICAgICAgIGN1cnJlbnQuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgICBpZiAoY3VycmVudC5zaXplID09PSAwKSB7XG4gICAgICAgICAgd29ya2VyU3Vic2NyaWJlcnMuZGVsZXRlKHdvcmtlcklkKTtcbiAgICAgICAgICBicmlkZ2UoXCJ1bnN1YnNjcmliZVdvcmtlck1lc3NhZ2VzXCIsIFt3b3JrZXJJZF0pLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgc2hvd0NvbnRleHRNZW51OiAoaXRlbXMpID0+IGJyaWRnZShcInNob3dDb250ZXh0TWVudVwiLCBbaXRlbXNdKSxcbiAgICBzaG93QXBwbGljYXRpb25NZW51OiAobWVudUlkLCB4LCB5KSA9PiBicmlkZ2UoXCJzaG93QXBwbGljYXRpb25NZW51XCIsIFttZW51SWQsIHgsIHldKSxcbiAgICBnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzOiAocGFyYW1zKSA9PiBicmlkZ2UoXCJnZXRGYXN0TW9kZVJvbGxvdXRNZXRyaWNzXCIsIFtwYXJhbXNdKSxcbiAgICBnZXRTaGFyZWRPYmplY3RTbmFwc2hvdFZhbHVlOiAoa2V5KSA9PiBzbmFwc2hvdC5nZXQoa2V5KSxcbiAgICBnZXRTeXN0ZW1UaGVtZVZhcmlhbnQ6ICgpID0+IHN5c3RlbVRoZW1lVmFyaWFudCxcbiAgICBzdWJzY3JpYmVUb1N5c3RlbVRoZW1lVmFyaWFudDogKGhhbmRsZXIpID0+IHtcbiAgICAgIHRoZW1lU3Vic2NyaWJlcnMuYWRkKGhhbmRsZXIpO1xuICAgICAgcmV0dXJuICgpID0+IHRoZW1lU3Vic2NyaWJlcnMuZGVsZXRlKGhhbmRsZXIpO1xuICAgIH0sXG4gICAgdHJpZ2dlclNlbnRyeVRlc3RFcnJvcjogKCkgPT4gYnJpZGdlKFwidHJpZ2dlclNlbnRyeVRlc3RFcnJvclwiLCBbXSksXG4gICAgZ2V0U2VudHJ5SW5pdE9wdGlvbnM6ICgpID0+IG51bGwsXG4gICAgZ2V0QXBwU2Vzc2lvbklkOiAoKSA9PiBudWxsLFxuICAgIGdldEJ1aWxkRmxhdm9yOiAoKSA9PiBpbml0aWFsU3RhdGUuYnVpbGRGbGF2b3IsXG4gICAgaXNJbnRlbE1hY0J1aWxkOiAoKSA9PiBpbml0aWFsU3RhdGUucGxhdGZvcm0gPT09IFwiZGFyd2luXCIgJiYgaW5pdGlhbFN0YXRlLmFyY2ggPT09IFwieDY0XCIsXG4gICAgdXNlc093bEFwcFNoZWxsOiAoKSA9PiBpbml0aWFsU3RhdGUudXNlc093bEFwcFNoZWxsLFxuICB9O1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuc291cmNlICE9PSB3aW5kb3cgfHwgIWV2ZW50LmRhdGEgfHwgZXZlbnQuZGF0YS50eXBlICE9PSBcImNvbm5lY3QtYXBwLWhvc3RcIikgcmV0dXJuO1xuICAgIGNvbnN0IHBvcnQgPSBldmVudC5kYXRhLnBvcnQ7XG4gICAgaWYgKCFwb3J0KSByZXR1cm47XG4gICAgY29uc3Qgd3MgPSBuZXcgV2ViU29ja2V0KG5ldyBVUkwoXCIvY29kZXhwcC9icm93c2VyLXVpL3JwY1wiLCBsb2NhdGlvbi5ocmVmKSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgKG1lc3NhZ2UpID0+IHBvcnQucG9zdE1lc3NhZ2UobWVzc2FnZS5kYXRhKSk7XG4gICAgd3MuYWRkRXZlbnRMaXN0ZW5lcihcImNsb3NlXCIsICgpID0+IHtcbiAgICAgIHRyeSB7IHBvcnQucG9zdE1lc3NhZ2UobnVsbCk7IH0gY2F0Y2gge31cbiAgICAgIHRyeSB7IHBvcnQuY2xvc2UoKTsgfSBjYXRjaCB7fVxuICAgIH0pO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsICgpID0+IHtcbiAgICAgIHBvcnQub25tZXNzYWdlID0gKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZGF0YSA9PSBudWxsKSB7XG4gICAgICAgICAgd3MuY2xvc2UoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgd3Muc2VuZChtZXNzYWdlLmRhdGEpO1xuICAgICAgfTtcbiAgICAgIHBvcnQuc3RhcnQgJiYgcG9ydC5zdGFydCgpO1xuICAgIH0pO1xuICB9KTtcblxuICBmdW5jdGlvbiBpbnN0YWxsQnJvd3NlclVpV2Vidmlld1NoaW0oKSB7XG4gICAgaWYgKHdpbmRvdy5fX2NvZGV4cHBXZWJ2aWV3U2hpbUluc3RhbGxlZCkgcmV0dXJuO1xuICAgIHdpbmRvdy5fX2NvZGV4cHBXZWJ2aWV3U2hpbUluc3RhbGxlZCA9IHRydWU7XG4gICAgY29uc3Qgb3JpZ2luYWxDcmVhdGVFbGVtZW50ID0gRG9jdW1lbnQucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQ7XG4gICAgRG9jdW1lbnQucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnQgPSBmdW5jdGlvbih0YWdOYW1lLCBvcHRpb25zKSB7XG4gICAgICBpZiAoU3RyaW5nKHRhZ05hbWUpLnRvTG93ZXJDYXNlKCkgIT09IFwid2Vidmlld1wiKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbENyZWF0ZUVsZW1lbnQuY2FsbCh0aGlzLCB0YWdOYW1lLCBvcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBjcmVhdGVXZWJ2aWV3SWZyYW1lKHRoaXMpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVXZWJ2aWV3SWZyYW1lKGRvYykge1xuICAgICAgY29uc3QgaWZyYW1lID0gb3JpZ2luYWxDcmVhdGVFbGVtZW50LmNhbGwoZG9jLCBcImlmcmFtZVwiKTtcbiAgICAgIGlmcmFtZS5kYXRhc2V0LmNvZGV4cHBXZWJ2aWV3U2hpbSA9IFwidHJ1ZVwiO1xuICAgICAgaWZyYW1lLnN0eWxlLmJvcmRlciA9IFwiMFwiO1xuICAgICAgaWZyYW1lLnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG4gICAgICBpZnJhbWUuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gXCIjZmZmXCI7XG4gICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKFwiYWxsb3dcIiwgXCJhdXRvcGxheTsgY2xpcGJvYXJkLXJlYWQ7IGNsaXBib2FyZC13cml0ZTsgZGlzcGxheS1jYXB0dXJlOyBmdWxsc2NyZWVuOyBtaWNyb3Bob25lOyBjYW1lcmFcIik7XG4gICAgICBjb25zdCBuYXRpdmVTZXRBdHRyaWJ1dGUgPSBpZnJhbWUuc2V0QXR0cmlidXRlLmJpbmQoaWZyYW1lKTtcbiAgICAgIGNvbnN0IG5hdGl2ZUdldEF0dHJpYnV0ZSA9IGlmcmFtZS5nZXRBdHRyaWJ1dGUuYmluZChpZnJhbWUpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaWZyYW1lLCBcInRhZ05hbWVcIiwgeyBjb25maWd1cmFibGU6IHRydWUsIGdldDogKCkgPT4gXCJXRUJWSUVXXCIgfSk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpZnJhbWUsIFwibm9kZU5hbWVcIiwgeyBjb25maWd1cmFibGU6IHRydWUsIGdldDogKCkgPT4gXCJXRUJWSUVXXCIgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGNvbnN0IGVtaXQgPSAodHlwZSwgZXh0cmEgPSB7fSkgPT4ge1xuICAgICAgICBjb25zdCBldmVudCA9IG5ldyBFdmVudCh0eXBlKTtcbiAgICAgICAgT2JqZWN0LmFzc2lnbihldmVudCwgZXh0cmEpO1xuICAgICAgICBpZnJhbWUuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICB9O1xuICAgICAgY29uc3QgY3VycmVudFVybCA9ICgpID0+IGlmcmFtZS5kYXRhc2V0LmNvZGV4cHBSZXF1ZXN0ZWRTcmMgfHwgbmF0aXZlR2V0QXR0cmlidXRlKFwic3JjXCIpIHx8IFwiYWJvdXQ6YmxhbmtcIjtcbiAgICAgIGNvbnN0IGFjdHVhbEZyYW1lVXJsID0gKHVybCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0ZWQgPSBTdHJpbmcodXJsIHx8IFwiYWJvdXQ6YmxhbmtcIik7XG4gICAgICAgIGlmICghc2hvdWxkQnJlYWtSZWN1cnNpdmVGcmFtZUxvYWQocmVxdWVzdGVkKSkgcmV0dXJuIHJlcXVlc3RlZDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gbmV3IFVSTChyZXF1ZXN0ZWQsIGxvY2F0aW9uLmhyZWYpO1xuICAgICAgICAgIG5leHQuc2VhcmNoUGFyYW1zLnNldChcIl9fY29kZXhwcF9mcmFtZV9kZXB0aFwiLCBTdHJpbmcoZnJhbWVBbmNlc3RvckRlcHRoKCkgKyAxKSk7XG4gICAgICAgICAgcmV0dXJuIG5leHQuaHJlZjtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgcmV0dXJuIHJlcXVlc3RlZDtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGNvbnN0IHNldEZyYW1lVXJsID0gKHVybCkgPT4ge1xuICAgICAgICBjb25zdCByZXF1ZXN0ZWQgPSBTdHJpbmcodXJsIHx8IFwiYWJvdXQ6YmxhbmtcIik7XG4gICAgICAgIGlmcmFtZS5kYXRhc2V0LmNvZGV4cHBSZXF1ZXN0ZWRTcmMgPSByZXF1ZXN0ZWQ7XG4gICAgICAgIG5hdGl2ZVNldEF0dHJpYnV0ZShcInNyY1wiLCBhY3R1YWxGcmFtZVVybChyZXF1ZXN0ZWQpKTtcbiAgICAgIH07XG4gICAgICBjb25zdCBuYXZpZ2F0ZSA9ICh1cmwpID0+IHtcbiAgICAgICAgY29uc3QgbmV4dCA9IFN0cmluZyh1cmwgfHwgXCJhYm91dDpibGFua1wiKTtcbiAgICAgICAgZW1pdChcImRpZC1zdGFydC1sb2FkaW5nXCIsIHsgdXJsOiBuZXh0IH0pO1xuICAgICAgICBzZXRGcmFtZVVybChuZXh0KTtcbiAgICAgIH07XG5cbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUgPSAobmFtZSwgdmFsdWUpID0+IHtcbiAgICAgICAgaWYgKFN0cmluZyhuYW1lKS50b0xvd2VyQ2FzZSgpID09PSBcInNyY1wiKSB7XG4gICAgICAgICAgc2V0RnJhbWVVcmwodmFsdWUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBuYXRpdmVTZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGlmcmFtZSwgXCJzcmNcIiwge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICBnZXQ6ICgpID0+IGN1cnJlbnRVcmwoKSxcbiAgICAgICAgICBzZXQ6ICh2YWx1ZSkgPT4gc2V0RnJhbWVVcmwodmFsdWUpLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgaWZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoXCJsb2FkXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgdXJsID0gY3VycmVudFVybCgpO1xuICAgICAgICBlbWl0KFwiZG9tLXJlYWR5XCIsIHsgdXJsIH0pO1xuICAgICAgICBlbWl0KFwiZGlkLW5hdmlnYXRlXCIsIHsgdXJsIH0pO1xuICAgICAgICBlbWl0KFwiZGlkLXN0b3AtbG9hZGluZ1wiLCB7IHVybCB9KTtcbiAgICAgICAgZW1pdChcImRpZC1maW5pc2gtbG9hZFwiLCB7IHVybCB9KTtcbiAgICAgICAgbGV0IHRpdGxlID0gXCJcIjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICB0aXRsZSA9IGlmcmFtZS5jb250ZW50RG9jdW1lbnQ/LnRpdGxlIHx8IFwiXCI7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgICAgY29uc3QgY29udmVyc2F0aW9uSWQgPSBpZnJhbWUuZ2V0QXR0cmlidXRlKFwiZGF0YS1icm93c2VyLXNpZGViYXItY29udmVyc2F0aW9uLWlkXCIpO1xuICAgICAgICBjb25zdCBicm93c2VyVGFiSWQgPSBpZnJhbWUuZ2V0QXR0cmlidXRlKFwiZGF0YS1icm93c2VyLXNpZGViYXItYnJvd3Nlci10YWItaWRcIik7XG4gICAgICAgIGlmIChjb252ZXJzYXRpb25JZCkge1xuICAgICAgICAgIHNlbmRCcm93c2VyU2lkZWJhclNuYXBzaG90KGNvbnZlcnNhdGlvbklkLCBicm93c2VyVGFiSWQsIG1ha2VCcm93c2VyU2lkZWJhclNuYXBzaG90KHVybCwge1xuICAgICAgICAgICAgdGl0bGU6IHRpdGxlIHx8IGJyb3dzZXJUaXRsZUZvclVybCh1cmwpLFxuICAgICAgICAgICAgaXNMb2FkaW5nOiBmYWxzZSxcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRpdGxlKSBlbWl0KFwicGFnZS10aXRsZS11cGRhdGVkXCIsIHsgdGl0bGUgfSk7XG4gICAgICB9KTtcbiAgICAgIGlmcmFtZS5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKCkgPT4ge1xuICAgICAgICBlbWl0KFwiZGlkLWZhaWwtbG9hZFwiLCB7IGVycm9yQ29kZTogLTIsIGVycm9yRGVzY3JpcHRpb246IFwiaWZyYW1lIGxvYWQgZmFpbGVkXCIsIHZhbGlkYXRlZFVSTDogY3VycmVudFVybCgpIH0pO1xuICAgICAgICBlbWl0KFwiZGlkLXN0b3AtbG9hZGluZ1wiLCB7IHVybDogY3VycmVudFVybCgpIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGlmcmFtZSwge1xuICAgICAgICBkZXN0cm95OiB7IHZhbHVlOiAoKSA9PiBpZnJhbWUucmVtb3ZlKCkgfSxcbiAgICAgICAgZ2V0VVJMOiB7IHZhbHVlOiAoKSA9PiBjdXJyZW50VXJsKCkgfSxcbiAgICAgICAgZ2V0VGl0bGU6IHtcbiAgICAgICAgICB2YWx1ZTogKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGlmcmFtZS5jb250ZW50RG9jdW1lbnQ/LnRpdGxlIHx8IFwiXCI7XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFVSTDogeyB2YWx1ZTogKHVybCkgPT4geyBuYXZpZ2F0ZSh1cmwpOyByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7IH0gfSxcbiAgICAgICAgcmVsb2FkOiB7XG4gICAgICAgICAgdmFsdWU6ICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGlmcmFtZS5jb250ZW50V2luZG93Py5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgICAgICBuYXZpZ2F0ZShjdXJyZW50VXJsKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IHsgdmFsdWU6ICgpID0+IHt9IH0sXG4gICAgICAgIGNhbkdvQmFjazogeyB2YWx1ZTogKCkgPT4gZmFsc2UgfSxcbiAgICAgICAgY2FuR29Gb3J3YXJkOiB7IHZhbHVlOiAoKSA9PiBmYWxzZSB9LFxuICAgICAgICBnb0JhY2s6IHtcbiAgICAgICAgICB2YWx1ZTogKCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgaWZyYW1lLmNvbnRlbnRXaW5kb3c/Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGdvRm9yd2FyZDoge1xuICAgICAgICAgIHZhbHVlOiAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZnJhbWUuY29udGVudFdpbmRvdz8uaGlzdG9yeS5mb3J3YXJkKCk7XG4gICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgZXhlY3V0ZUphdmFTY3JpcHQ6IHtcbiAgICAgICAgICB2YWx1ZTogKGNvZGUpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaWZyYW1lLmNvbnRlbnRXaW5kb3c/LmV2YWwoU3RyaW5nKGNvZGUpKSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIGluc2VydENTUzogeyB2YWx1ZTogKCkgPT4gUHJvbWlzZS5yZXNvbHZlKFwiXCIpIH0sXG4gICAgICAgIG9wZW5EZXZUb29sczogeyB2YWx1ZTogKCkgPT4ge30gfSxcbiAgICAgICAgY2xvc2VEZXZUb29sczogeyB2YWx1ZTogKCkgPT4ge30gfSxcbiAgICAgICAgaXNEZXZUb29sc09wZW5lZDogeyB2YWx1ZTogKCkgPT4gZmFsc2UgfSxcbiAgICAgICAgc2VuZDogeyB2YWx1ZTogKCkgPT4ge30gfSxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gaWZyYW1lO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZyYW1lQW5jZXN0b3JEZXB0aCgpIHtcbiAgICAgIGxldCBkZXB0aCA9IDA7XG4gICAgICBsZXQgY3VycmVudCA9IHdpbmRvdztcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0KCk7XG4gICAgICB3aGlsZSAoY3VycmVudCAmJiAhc2Vlbi5oYXMoY3VycmVudCkpIHtcbiAgICAgICAgc2Vlbi5hZGQoY3VycmVudCk7XG4gICAgICAgIGxldCBwYXJlbnQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcGFyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJlbnQgPT09IGN1cnJlbnQpIGJyZWFrO1xuICAgICAgICBkZXB0aCArPSAxO1xuICAgICAgICBjdXJyZW50ID0gcGFyZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlcHRoO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3VsZEJyZWFrUmVjdXJzaXZlRnJhbWVMb2FkKHVybCkge1xuICAgICAgbGV0IHRhcmdldDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRhcmdldCA9IG5ldyBVUkwodXJsLCBsb2NhdGlvbi5ocmVmKS5ocmVmO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxldCBjdXJyZW50ID0gd2luZG93O1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQoKTtcbiAgICAgIHdoaWxlIChjdXJyZW50ICYmICFzZWVuLmhhcyhjdXJyZW50KSkge1xuICAgICAgICBzZWVuLmFkZChjdXJyZW50KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAobmV3IFVSTChjdXJyZW50LmxvY2F0aW9uLmhyZWYpLmhyZWYgPT09IHRhcmdldCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgaWYgKGN1cnJlbnQucGFyZW50ID09PSBjdXJyZW50KSBicmVhaztcbiAgICAgICAgICBjdXJyZW50ID0gY3VycmVudC5wYXJlbnQ7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufSkoKTtcbmA7XG59XG5cbmZ1bmN0aW9uIGhpZGVWaXNpYmxlQ29kZXhXaW5kb3dzKCk6IHZvaWQge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIikge1xuICAgIHRyeSB7XG4gICAgICBhcHAuaGlkZSgpO1xuICAgIH0gY2F0Y2gge31cbiAgfVxuICBmb3IgKGNvbnN0IHdpbiBvZiBCcm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKSkge1xuICAgIGlmICh3aW4uaXNEZXN0cm95ZWQoKSkgY29udGludWU7XG4gICAgaWYgKGFjdGl2ZUhvc3QgJiYgd2luLndlYkNvbnRlbnRzLmlkID09PSBhY3RpdmVIb3N0LndlYkNvbnRlbnRzLmlkKSBjb250aW51ZTtcbiAgICBpZiAoIXdpbi5pc1Zpc2libGUoKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIHdpbi5oaWRlKCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG59XG5cbmZ1bmN0aW9uIG1ha2VXaW5kb3dMaWtlRm9yVmlldyh2aWV3OiBFbGVjdHJvbi5Ccm93c2VyVmlldyk6IENvZGV4V2luZG93TGlrZSB7XG4gIGNvbnN0IHZpZXdCb3VuZHMgPSAoKSA9PiB2aWV3LmdldEJvdW5kcygpO1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3LndlYkNvbnRlbnRzLmlkLFxuICAgIHdlYkNvbnRlbnRzOiB2aWV3LndlYkNvbnRlbnRzLFxuICAgIG9uOiAoZXZlbnQ6IFwiY2xvc2VkXCIsIGxpc3RlbmVyOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgICBpZiAoZXZlbnQgPT09IFwiY2xvc2VkXCIpIHZpZXcud2ViQ29udGVudHMub25jZShcImRlc3Ryb3llZFwiLCBsaXN0ZW5lcik7XG4gICAgICBlbHNlIHZpZXcud2ViQ29udGVudHMub24oZXZlbnQsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgb25jZTogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLm9uY2UoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICBvZmY6IChldmVudDogc3RyaW5nLCBsaXN0ZW5lcjogKC4uLmFyZ3M6IHVua25vd25bXSkgPT4gdm9pZCkgPT4ge1xuICAgICAgdmlldy53ZWJDb250ZW50cy5vZmYoZXZlbnQgYXMgXCJkZXN0cm95ZWRcIiwgbGlzdGVuZXIpO1xuICAgICAgcmV0dXJuIHZpZXc7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcjogKGV2ZW50OiBzdHJpbmcsIGxpc3RlbmVyOiAoLi4uYXJnczogdW5rbm93bltdKSA9PiB2b2lkKSA9PiB7XG4gICAgICB2aWV3LndlYkNvbnRlbnRzLnJlbW92ZUxpc3RlbmVyKGV2ZW50IGFzIFwiZGVzdHJveWVkXCIsIGxpc3RlbmVyKTtcbiAgICAgIHJldHVybiB2aWV3O1xuICAgIH0sXG4gICAgaXNEZXN0cm95ZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNEZXN0cm95ZWQoKSxcbiAgICBpc0ZvY3VzZWQ6ICgpID0+IHZpZXcud2ViQ29udGVudHMuaXNGb2N1c2VkKCksXG4gICAgZm9jdXM6ICgpID0+IHZpZXcud2ViQ29udGVudHMuZm9jdXMoKSxcbiAgICBzaG93OiAoKSA9PiB7fSxcbiAgICBoaWRlOiAoKSA9PiB7fSxcbiAgICBnZXRCb3VuZHM6IHZpZXdCb3VuZHMsXG4gICAgZ2V0Q29udGVudEJvdW5kczogdmlld0JvdW5kcyxcbiAgICBnZXRTaXplOiAoKSA9PiB7XG4gICAgICBjb25zdCBiID0gdmlld0JvdW5kcygpO1xuICAgICAgcmV0dXJuIFtiLndpZHRoLCBiLmhlaWdodF07XG4gICAgfSxcbiAgICBnZXRDb250ZW50U2l6ZTogKCkgPT4ge1xuICAgICAgY29uc3QgYiA9IHZpZXdCb3VuZHMoKTtcbiAgICAgIHJldHVybiBbYi53aWR0aCwgYi5oZWlnaHRdO1xuICAgIH0sXG4gICAgc2V0VGl0bGU6ICgpID0+IHt9LFxuICAgIGdldFRpdGxlOiAoKSA9PiBcIlwiLFxuICAgIHNldFJlcHJlc2VudGVkRmlsZW5hbWU6ICgpID0+IHt9LFxuICAgIHNldERvY3VtZW50RWRpdGVkOiAoKSA9PiB7fSxcbiAgICBzZXRXaW5kb3dCdXR0b25WaXNpYmlsaXR5OiAoKSA9PiB7fSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gYWNjZXB0V2ViU29ja2V0KHJlcTogSW5jb21pbmdNZXNzYWdlLCBzb2NrZXQ6IFNvY2tldCwgaGVhZDogQnVmZmVyKTogV2ViU29ja2V0Q29ubmVjdGlvbiB7XG4gIGNvbnN0IGtleSA9IHJlcS5oZWFkZXJzW1wic2VjLXdlYnNvY2tldC1rZXlcIl07XG4gIGlmICh0eXBlb2Yga2V5ICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgRXJyb3IoXCJtaXNzaW5nIFNlYy1XZWJTb2NrZXQtS2V5XCIpO1xuICBjb25zdCBhY2NlcHQgPSBjcmVhdGVIYXNoKFwic2hhMVwiKVxuICAgIC51cGRhdGUoYCR7a2V5fTI1OEVBRkE1LUU5MTQtNDdEQS05NUNBLUM1QUIwREM4NUIxMWApXG4gICAgLmRpZ2VzdChcImJhc2U2NFwiKTtcbiAgc29ja2V0LndyaXRlKFxuICAgIFtcbiAgICAgIFwiSFRUUC8xLjEgMTAxIFN3aXRjaGluZyBQcm90b2NvbHNcIixcbiAgICAgIFwiVXBncmFkZTogd2Vic29ja2V0XCIsXG4gICAgICBcIkNvbm5lY3Rpb246IFVwZ3JhZGVcIixcbiAgICAgIGBTZWMtV2ViU29ja2V0LUFjY2VwdDogJHthY2NlcHR9YCxcbiAgICAgIFwiXFxyXFxuXCIsXG4gICAgXS5qb2luKFwiXFxyXFxuXCIpLFxuICApO1xuICBjb25zdCB3cyA9IG5ldyBXZWJTb2NrZXRDb25uZWN0aW9uKHNvY2tldCk7XG4gIGlmIChoZWFkLmxlbmd0aCA+IDApIHdzLmFjY2VwdEhlYWQoaGVhZCk7XG4gIHJldHVybiB3cztcbn1cblxuY2xhc3MgV2ViU29ja2V0Q29ubmVjdGlvbiB7XG4gIHByaXZhdGUgYnVmZmVyID0gQnVmZmVyLmFsbG9jKDApO1xuICBwcml2YXRlIHRleHRIYW5kbGVycyA9IG5ldyBTZXQ8KHRleHQ6IHN0cmluZykgPT4gdm9pZD4oKTtcbiAgcHJpdmF0ZSBjbG9zZUhhbmRsZXJzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuICBwcml2YXRlIGNsb3NlZCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgc29ja2V0OiBTb2NrZXQpIHtcbiAgICBzb2NrZXQub24oXCJkYXRhXCIsIChjaHVuaykgPT4gdGhpcy5hY2NlcHRIZWFkKGNodW5rKSk7XG4gICAgc29ja2V0Lm9uKFwiY2xvc2VcIiwgKCkgPT4gdGhpcy5lbWl0Q2xvc2UoKSk7XG4gICAgc29ja2V0Lm9uKFwiZXJyb3JcIiwgKCkgPT4gdGhpcy5lbWl0Q2xvc2UoKSk7XG4gIH1cblxuICBhY2NlcHRIZWFkKGNodW5rOiBCdWZmZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jbG9zZWQpIHJldHVybjtcbiAgICB0aGlzLmJ1ZmZlciA9IEJ1ZmZlci5jb25jYXQoW3RoaXMuYnVmZmVyLCBjaHVua10pO1xuICAgIHRoaXMucmVhZEZyYW1lcygpO1xuICB9XG5cbiAgb25UZXh0KGhhbmRsZXI6ICh0ZXh0OiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLnRleHRIYW5kbGVycy5hZGQoaGFuZGxlcik7XG4gIH1cblxuICBvbkNsb3NlKGhhbmRsZXI6ICgpID0+IHZvaWQpOiB2b2lkIHtcbiAgICB0aGlzLmNsb3NlSGFuZGxlcnMuYWRkKGhhbmRsZXIpO1xuICB9XG5cbiAgc2VuZEpzb24ocGF5bG9hZDogdW5rbm93bik6IHZvaWQge1xuICAgIHRoaXMuc2VuZFRleHQoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkpO1xuICB9XG5cbiAgc2VuZFRleHQodGV4dDogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZW5kRnJhbWUoMHgxLCBCdWZmZXIuZnJvbSh0ZXh0LCBcInV0ZjhcIikpO1xuICB9XG5cbiAgY2xvc2UoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuY2xvc2VkKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuc2VuZEZyYW1lKDB4OCwgQnVmZmVyLmFsbG9jKDApKTtcbiAgICB9IGNhdGNoIHt9XG4gICAgdGhpcy5jbG9zZWQgPSB0cnVlO1xuICAgIHRoaXMuc29ja2V0LmVuZCgpO1xuICAgIHRoaXMuZW1pdENsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIHJlYWRGcmFtZXMoKTogdm9pZCB7XG4gICAgd2hpbGUgKHRoaXMuYnVmZmVyLmxlbmd0aCA+PSAyKSB7XG4gICAgICBjb25zdCBmaXJzdCA9IHRoaXMuYnVmZmVyWzBdITtcbiAgICAgIGNvbnN0IHNlY29uZCA9IHRoaXMuYnVmZmVyWzFdITtcbiAgICAgIGNvbnN0IG9wY29kZSA9IGZpcnN0ICYgMHgwZjtcbiAgICAgIGNvbnN0IG1hc2tlZCA9IChzZWNvbmQgJiAweDgwKSAhPT0gMDtcbiAgICAgIGxldCBsZW5ndGggPSBzZWNvbmQgJiAweDdmO1xuICAgICAgbGV0IG9mZnNldCA9IDI7XG4gICAgICBpZiAobGVuZ3RoID09PSAxMjYpIHtcbiAgICAgICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IG9mZnNldCArIDIpIHJldHVybjtcbiAgICAgICAgbGVuZ3RoID0gdGhpcy5idWZmZXIucmVhZFVJbnQxNkJFKG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSAyO1xuICAgICAgfSBlbHNlIGlmIChsZW5ndGggPT09IDEyNykge1xuICAgICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgb2Zmc2V0ICsgOCkgcmV0dXJuO1xuICAgICAgICBjb25zdCBoaWdoID0gdGhpcy5idWZmZXIucmVhZFVJbnQzMkJFKG9mZnNldCk7XG4gICAgICAgIGNvbnN0IGxvdyA9IHRoaXMuYnVmZmVyLnJlYWRVSW50MzJCRShvZmZzZXQgKyA0KTtcbiAgICAgICAgaWYgKGhpZ2ggIT09IDApIHtcbiAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxlbmd0aCA9IGxvdztcbiAgICAgICAgb2Zmc2V0ICs9IDg7XG4gICAgICB9XG4gICAgICBjb25zdCBtYXNrT2Zmc2V0ID0gb2Zmc2V0O1xuICAgICAgaWYgKG1hc2tlZCkgb2Zmc2V0ICs9IDQ7XG4gICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgb2Zmc2V0ICsgbGVuZ3RoKSByZXR1cm47XG5cbiAgICAgIGNvbnN0IG1hc2sgPSBtYXNrZWQgPyB0aGlzLmJ1ZmZlci5zdWJhcnJheShtYXNrT2Zmc2V0LCBtYXNrT2Zmc2V0ICsgNCkgOiBudWxsO1xuICAgICAgY29uc3QgcGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHRoaXMuYnVmZmVyLnN1YmFycmF5KG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKSk7XG4gICAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuYnVmZmVyLnN1YmFycmF5KG9mZnNldCArIGxlbmd0aCk7XG4gICAgICBpZiAobWFzaykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBheWxvYWQubGVuZ3RoOyBpICs9IDEpIHBheWxvYWRbaV0gXj0gbWFza1tpICUgNF0hO1xuICAgICAgfVxuXG4gICAgICBpZiAob3Bjb2RlID09PSAweDgpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgfSBlbHNlIGlmIChvcGNvZGUgPT09IDB4OSkge1xuICAgICAgICB0aGlzLnNlbmRGcmFtZSgweEEsIHBheWxvYWQpO1xuICAgICAgfSBlbHNlIGlmIChvcGNvZGUgPT09IDB4MSkge1xuICAgICAgICBjb25zdCB0ZXh0ID0gcGF5bG9hZC50b1N0cmluZyhcInV0ZjhcIik7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBbLi4udGhpcy50ZXh0SGFuZGxlcnNdKSBoYW5kbGVyKHRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2VuZEZyYW1lKG9wY29kZTogbnVtYmVyLCBwYXlsb2FkOiBCdWZmZXIpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5jbG9zZWQgJiYgb3Bjb2RlICE9PSAweDgpIHJldHVybjtcbiAgICBjb25zdCBsZW5ndGggPSBwYXlsb2FkLmxlbmd0aDtcbiAgICBsZXQgaGVhZGVyOiBCdWZmZXI7XG4gICAgaWYgKGxlbmd0aCA8IDEyNikge1xuICAgICAgaGVhZGVyID0gQnVmZmVyLmZyb20oWzB4ODAgfCBvcGNvZGUsIGxlbmd0aF0pO1xuICAgIH0gZWxzZSBpZiAobGVuZ3RoIDw9IDB4ZmZmZikge1xuICAgICAgaGVhZGVyID0gQnVmZmVyLmFsbG9jKDQpO1xuICAgICAgaGVhZGVyWzBdID0gMHg4MCB8IG9wY29kZTtcbiAgICAgIGhlYWRlclsxXSA9IDEyNjtcbiAgICAgIGhlYWRlci53cml0ZVVJbnQxNkJFKGxlbmd0aCwgMik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlciA9IEJ1ZmZlci5hbGxvYygxMCk7XG4gICAgICBoZWFkZXJbMF0gPSAweDgwIHwgb3Bjb2RlO1xuICAgICAgaGVhZGVyWzFdID0gMTI3O1xuICAgICAgaGVhZGVyLndyaXRlVUludDMyQkUoMCwgMik7XG4gICAgICBoZWFkZXIud3JpdGVVSW50MzJCRShsZW5ndGgsIDYpO1xuICAgIH1cbiAgICB0aGlzLnNvY2tldC53cml0ZShCdWZmZXIuY29uY2F0KFtoZWFkZXIsIHBheWxvYWRdKSk7XG4gIH1cblxuICBwcml2YXRlIGVtaXRDbG9zZSgpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuY2xvc2VkKSB0aGlzLmNsb3NlZCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIFsuLi50aGlzLmNsb3NlSGFuZGxlcnNdKSBoYW5kbGVyKCk7XG4gICAgdGhpcy5jbG9zZUhhbmRsZXJzLmNsZWFyKCk7XG4gICAgdGhpcy50ZXh0SGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXF1ZXN0VXJsKHJlcTogSW5jb21pbmdNZXNzYWdlKTogVVJMIHwgbnVsbCB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIG5ldyBVUkwocmVxLnVybCA/PyBcIi9cIiwgXCJodHRwOi8vMTI3LjAuMC4xXCIpO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkSnNvbkJvZHkocmVxOiBJbmNvbWluZ01lc3NhZ2UpOiBQcm9taXNlPHVua25vd24+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBjaHVua3M6IEJ1ZmZlcltdID0gW107XG4gICAgbGV0IHRvdGFsID0gMDtcbiAgICByZXEub24oXCJkYXRhXCIsIChjaHVuazogQnVmZmVyKSA9PiB7XG4gICAgICB0b3RhbCArPSBjaHVuay5sZW5ndGg7XG4gICAgICBpZiAodG90YWwgPiAxMDI0ICogMTAyNCkge1xuICAgICAgICByZWplY3QobmV3IEVycm9yKFwicmVxdWVzdCBib2R5IHRvbyBsYXJnZVwiKSk7XG4gICAgICAgIHJlcS5kZXN0cm95KCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNodW5rcy5wdXNoKGNodW5rKTtcbiAgICB9KTtcbiAgICByZXEub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgcmF3ID0gQnVmZmVyLmNvbmNhdChjaHVua3MpLnRvU3RyaW5nKFwidXRmOFwiKTtcbiAgICAgIGlmICghcmF3KSB7XG4gICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZShyYXcpKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKFwiZXJyb3JcIiwgcmVqZWN0KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRKc29uKHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiB1bmtub3duKTogdm9pZCB7XG4gIHNlbmRCdWZmZXIocmVzLCBzdGF0dXMsIEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGJvZHkpKSwgTUlNRV9UWVBFU1tcIi5qc29uXCJdLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRUZXh0KHJlczogU2VydmVyUmVzcG9uc2UsIHN0YXR1czogbnVtYmVyLCBib2R5OiBzdHJpbmcsIGNvbnRlbnRUeXBlOiBzdHJpbmcpOiB2b2lkIHtcbiAgc2VuZEJ1ZmZlcihyZXMsIHN0YXR1cywgQnVmZmVyLmZyb20oYm9keSksIGNvbnRlbnRUeXBlLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRCdWZmZXIoXG4gIHJlczogU2VydmVyUmVzcG9uc2UsXG4gIHN0YXR1czogbnVtYmVyLFxuICBib2R5OiBCdWZmZXIsXG4gIGNvbnRlbnRUeXBlOiBzdHJpbmcsXG4gIGhlYWRPbmx5OiBib29sZWFuLFxuKTogdm9pZCB7XG4gIHJlcy53cml0ZUhlYWQoc3RhdHVzLCB7XG4gICAgXCJjb250ZW50LXR5cGVcIjogY29udGVudFR5cGUsXG4gICAgXCJjb250ZW50LWxlbmd0aFwiOiBib2R5Lmxlbmd0aCxcbiAgICBcImNhY2hlLWNvbnRyb2xcIjogXCJuby1zdG9yZVwiLFxuICB9KTtcbiAgaWYgKGhlYWRPbmx5KSByZXMuZW5kKCk7XG4gIGVsc2UgcmVzLmVuZChib2R5KTtcbn1cblxuZnVuY3Rpb24gd2Vidmlld1Jvb3QoKTogc3RyaW5nIHtcbiAgcmV0dXJuIGpvaW4ocHJvY2Vzcy5yZXNvdXJjZXNQYXRoLCBcImFwcC5hc2FyXCIsIFwid2Vidmlld1wiKTtcbn1cblxuZnVuY3Rpb24gd2Vidmlld0ZpbGUocGF0aG5hbWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjbGVhblBhdGggPSBkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpLnJlcGxhY2UoL15cXC8rLywgXCJcIik7XG4gIGlmICghY2xlYW5QYXRoIHx8IGNsZWFuUGF0aC5pbmNsdWRlcyhcIlxcMFwiKSkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IHJvb3QgPSB3ZWJ2aWV3Um9vdCgpO1xuICBjb25zdCBmaWxlID0gbm9ybWFsaXplKGpvaW4ocm9vdCwgY2xlYW5QYXRoKSk7XG4gIGNvbnN0IHJlbCA9IHJlbGF0aXZlKHJvb3QsIGZpbGUpO1xuICBpZiAocmVsLnN0YXJ0c1dpdGgoXCIuLlwiKSB8fCByZWwgPT09IFwiXCIpIHJldHVybiBudWxsO1xuICBpZiAoIWV4aXN0c1N5bmMoZmlsZSkgfHwgIXN0YXRTeW5jKGZpbGUpLmlzRmlsZSgpKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIGZpbGU7XG59XG5cbmZ1bmN0aW9uIG1pbWVUeXBlKGZpbGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGRvdCA9IGZpbGUubGFzdEluZGV4T2YoXCIuXCIpO1xuICBjb25zdCBleHQgPSBkb3QgPj0gMCA/IGZpbGUuc2xpY2UoZG90KS50b0xvd2VyQ2FzZSgpIDogXCJcIjtcbiAgcmV0dXJuIE1JTUVfVFlQRVNbZXh0XSA/PyBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiO1xufVxuXG5mdW5jdGlvbiByZXF1aXJlT3B0aW9ucygpOiBCcm93c2VyVWlTZXJ2ZXJPcHRpb25zIHtcbiAgaWYgKCFhY3RpdmVPcHRpb25zKSB0aHJvdyBuZXcgRXJyb3IoXCJDb2RleCsrIGJyb3dzZXIgVUkgc2VydmVyIGlzIG5vdCBjb25maWd1cmVkXCIpO1xuICByZXR1cm4gYWN0aXZlT3B0aW9ucztcbn1cblxuZnVuY3Rpb24gaXNCcm93c2VyVWlIb3N0U2VuZGVyKHNlbmRlcjogRWxlY3Ryb24uV2ViQ29udGVudHMpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhYWN0aXZlSG9zdCAmJiAhYWN0aXZlSG9zdC53ZWJDb250ZW50cy5pc0Rlc3Ryb3llZCgpICYmIHNlbmRlci5pZCA9PT0gYWN0aXZlSG9zdC53ZWJDb250ZW50cy5pZDtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0QnJpZGdlTWV0aG9kKG1ldGhvZDogc3RyaW5nKTogdm9pZCB7XG4gIGlmICghL15bYS16QS1aMC05Ll86LV0rJC8udGVzdChtZXRob2QpKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGJyaWRnZSBtZXRob2RcIik7XG59XG5cbmZ1bmN0aW9uIHBhcnNlUG9ydCh2YWx1ZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgcGFyc2VkID0gTnVtYmVyKHZhbHVlKTtcbiAgcmV0dXJuIE51bWJlci5pc0ludGVnZXIocGFyc2VkKSAmJiBwYXJzZWQgPiAwICYmIHBhcnNlZCA8PSA2NTUzNSA/IHBhcnNlZCA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBhc1JlY29yZCh2YWx1ZTogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+IHwgbnVsbCB7XG4gIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgPyB2YWx1ZSBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGFzUGxhaW5PYmplY3QodmFsdWU6IHVua25vd24pOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gIGNvbnN0IHJlY29yZCA9IGFzUmVjb3JkKHZhbHVlKTtcbiAgcmV0dXJuIHJlY29yZCAmJiAhQXJyYXkuaXNBcnJheShyZWNvcmQpID8gcmVjb3JkIDoge307XG59XG5cbmZ1bmN0aW9uIGN1cnJlbnRTeXN0ZW1UaGVtZVZhcmlhbnQoKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hdGl2ZVRoZW1lLnNob3VsZFVzZURhcmtDb2xvcnMgPyBcImRhcmtcIiA6IFwibGlnaHRcIjtcbn1cblxuZnVuY3Rpb24gc2FmZUpzb24odmFsdWU6IHVua25vd24pOiBzdHJpbmcge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoLzwvZywgXCJcXFxcdTAwM2NcIik7XG59XG5cbmZ1bmN0aW9uIGRlbGF5KG1zOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1zKSk7XG59XG4iLCAiZXhwb3J0IGNvbnN0IFZFUlNJT05fUkUgPSAvXnY/KFxcZCspXFwuKFxcZCspXFwuKFxcZCspKD86Wy0rXS4qKT8kLztcblxuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZVZlcnNpb24odmFsdWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB2YWx1ZS50cmltKCkucmVwbGFjZSgvXnYvaSwgXCJcIik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb21wYXJlVmVyc2lvbnMoYTogc3RyaW5nLCBiOiBzdHJpbmcpOiBudW1iZXIge1xuICBjb25zdCBhdiA9IFZFUlNJT05fUkUuZXhlYyhhKTtcbiAgY29uc3QgYnYgPSBWRVJTSU9OX1JFLmV4ZWMoYik7XG4gIGlmICghYXYgfHwgIWJ2KSByZXR1cm4gMDtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPD0gMzsgaSsrKSB7XG4gICAgY29uc3QgZGlmZiA9IE51bWJlcihhdltpXSkgLSBOdW1iZXIoYnZbaV0pO1xuICAgIGlmIChkaWZmICE9PSAwKSByZXR1cm4gZGlmZjtcbiAgfVxuICByZXR1cm4gMDtcbn1cbiIsICJpbXBvcnQgdHlwZSB7IFR3ZWFrU3RvcmVFbnRyeSwgVHdlYWtTdG9yZVBsYXRmb3JtIH0gZnJvbSBcIi4vdHdlYWstc3RvcmVcIjtcbmltcG9ydCB7IGNvbXBhcmVWZXJzaW9ucywgbm9ybWFsaXplVmVyc2lvbiwgVkVSU0lPTl9SRSB9IGZyb20gXCIuL3ZlcnNpb24tdXRpbHNcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTdG9yZUVudHJ5UGxhdGZvcm1Db21wYXRpYmlsaXR5IHtcbiAgY3VycmVudDogTm9kZUpTLlBsYXRmb3JtO1xuICBzdXBwb3J0ZWQ6IFR3ZWFrU3RvcmVQbGF0Zm9ybVtdIHwgbnVsbDtcbiAgY29tcGF0aWJsZTogYm9vbGVhbjtcbiAgcmVhc29uOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eSB7XG4gIGN1cnJlbnQ6IHN0cmluZztcbiAgcmVxdWlyZWQ6IHN0cmluZyB8IG51bGw7XG4gIGNvbXBhdGlibGU6IGJvb2xlYW47XG4gIHJlYXNvbjogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkoXG4gIGVudHJ5OiBUd2Vha1N0b3JlRW50cnksXG4gIGN1cnJlbnRQbGF0Zm9ybSA9IHByb2Nlc3MucGxhdGZvcm0gYXMgVHdlYWtTdG9yZVBsYXRmb3JtLFxuKTogU3RvcmVFbnRyeVBsYXRmb3JtQ29tcGF0aWJpbGl0eSB7XG4gIGNvbnN0IHN1cHBvcnRlZCA9IGVudHJ5LnBsYXRmb3JtcyA/PyBudWxsO1xuICBjb25zdCBjb21wYXRpYmxlID0gIXN1cHBvcnRlZCB8fCBzdXBwb3J0ZWQuaW5jbHVkZXMoY3VycmVudFBsYXRmb3JtKTtcbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50OiBjdXJyZW50UGxhdGZvcm0sXG4gICAgc3VwcG9ydGVkLFxuICAgIGNvbXBhdGlibGUsXG4gICAgcmVhc29uOiBjb21wYXRpYmxlID8gbnVsbCA6IGAke2VudHJ5Lm1hbmlmZXN0Lm5hbWV9IGlzIG9ubHkgYXZhaWxhYmxlIG9uICR7Zm9ybWF0U3RvcmVQbGF0Zm9ybXMoc3VwcG9ydGVkKX0uYCxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGlibGUoZW50cnk6IFR3ZWFrU3RvcmVFbnRyeSk6IHZvaWQge1xuICBjb25zdCBwbGF0Zm9ybSA9IHN0b3JlRW50cnlQbGF0Zm9ybUNvbXBhdGliaWxpdHkoZW50cnkpO1xuICBpZiAoIXBsYXRmb3JtLmNvbXBhdGlibGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IocGxhdGZvcm0ucmVhc29uID8/IGAke2VudHJ5Lm1hbmlmZXN0Lm5hbWV9IGlzIG5vdCBhdmFpbGFibGUgb24gdGhpcyBwbGF0Zm9ybS5gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmlsaXR5KFxuICBlbnRyeTogVHdlYWtTdG9yZUVudHJ5LFxuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nLFxuKTogU3RvcmVFbnRyeVJ1bnRpbWVDb21wYXRpYmlsaXR5IHtcbiAgY29uc3QgcmVxdWlyZWQgPSBjbGVhbk1pblJ1bnRpbWUoZW50cnkubWFuaWZlc3QubWluUnVudGltZSk7XG4gIGNvbnN0IGNvbXBhdGlibGUgPSAhcmVxdWlyZWQgfHwgY29tcGFyZVZlcnNpb25zKGN1cnJlbnRWZXJzaW9uLCByZXF1aXJlZCkgPj0gMDtcbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50OiBjdXJyZW50VmVyc2lvbixcbiAgICByZXF1aXJlZCxcbiAgICBjb21wYXRpYmxlLFxuICAgIHJlYXNvbjogY29tcGF0aWJsZSB8fCAhcmVxdWlyZWRcbiAgICAgID8gbnVsbFxuICAgICAgOiBgJHtlbnRyeS5tYW5pZmVzdC5uYW1lfSByZXF1aXJlcyBDb2RleCsrICR7cmVxdWlyZWR9IG9yIG5ld2VyLmAsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdG9yZUVudHJ5UnVudGltZUNvbXBhdGlibGUoXG4gIGVudHJ5OiBUd2Vha1N0b3JlRW50cnksXG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgcnVudGltZSA9IHN0b3JlRW50cnlSdW50aW1lQ29tcGF0aWJpbGl0eShlbnRyeSwgY3VycmVudFZlcnNpb24pO1xuICBpZiAoIXJ1bnRpbWUuY29tcGF0aWJsZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihydW50aW1lLnJlYXNvbiA/PyBgJHtlbnRyeS5tYW5pZmVzdC5uYW1lfSByZXF1aXJlcyBhIG5ld2VyIENvZGV4KysgcnVudGltZS5gKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5NaW5SdW50aW1lKHZhbHVlOiB1bmtub3duKTogc3RyaW5nIHwgbnVsbCB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuICBjb25zdCB2ZXJzaW9uID0gbm9ybWFsaXplVmVyc2lvbih2YWx1ZS5yZXBsYWNlKC9ePj0/XFxzKi8sIFwiXCIpKTtcbiAgcmV0dXJuIFZFUlNJT05fUkUudGVzdCh2ZXJzaW9uKSA/IHZlcnNpb24gOiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0U3RvcmVQbGF0Zm9ybXMocGxhdGZvcm1zOiBUd2Vha1N0b3JlUGxhdGZvcm1bXSB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAoIXBsYXRmb3JtcyB8fCBwbGF0Zm9ybXMubGVuZ3RoID09PSAwKSByZXR1cm4gXCJzdXBwb3J0ZWQgcGxhdGZvcm1zXCI7XG4gIHJldHVybiBwbGF0Zm9ybXMubWFwKChwbGF0Zm9ybSkgPT4ge1xuICAgIGlmIChwbGF0Zm9ybSA9PT0gXCJkYXJ3aW5cIikgcmV0dXJuIFwibWFjT1NcIjtcbiAgICBpZiAocGxhdGZvcm0gPT09IFwid2luMzJcIikgcmV0dXJuIFwiV2luZG93c1wiO1xuICAgIHJldHVybiBcIkxpbnV4XCI7XG4gIH0pLmpvaW4oXCIsIFwiKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFTQSxJQUFBQSxtQkFBaUc7QUFDakcsSUFBQUMsbUJBQXFJO0FBQ3JJLElBQUFDLDZCQUErQztBQUMvQyxJQUFBQyxzQkFBa0Q7QUFDbEQsSUFBQUMsb0JBQTZEO0FBQzdELElBQUFDLGtCQUFnQzs7O0FDYmhDLElBQUFDLGFBQStCO0FBQy9CLElBQUFDLG1CQUE4QjtBQUM5QixvQkFBNkI7QUFDN0IsSUFBQUMsV0FBeUI7OztBQ0p6QixzQkFBK0M7QUFDL0MseUJBQXlCO0FBQ3pCLHVCQUF1RjtBQUNoRixJQUFNLGFBQWE7QUFBQSxFQUN0QixXQUFXO0FBQUEsRUFDWCxVQUFVO0FBQUEsRUFDVixlQUFlO0FBQUEsRUFDZixpQkFBaUI7QUFDckI7QUFDQSxJQUFNLGlCQUFpQjtBQUFBLEVBQ25CLE1BQU07QUFBQSxFQUNOLFlBQVksQ0FBQyxlQUFlO0FBQUEsRUFDNUIsaUJBQWlCLENBQUMsZUFBZTtBQUFBLEVBQ2pDLE1BQU0sV0FBVztBQUFBLEVBQ2pCLE9BQU87QUFBQSxFQUNQLE9BQU87QUFBQSxFQUNQLFlBQVk7QUFBQSxFQUNaLGVBQWU7QUFDbkI7QUFDQSxP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QUFBLEVBQ3hEO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDdkY7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFZO0FBQUEsRUFBTztBQUFBLEVBQ3JGO0FBQUEsRUFBUztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDdkI7QUFBQSxFQUFhO0FBQUEsRUFBYTtBQUFBLEVBQWE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFDcEU7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU07QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQVc7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDMUU7QUFBQSxFQUFNO0FBQUEsRUFBTTtBQUFBLEVBQU87QUFBQSxFQUFXO0FBQUEsRUFBTTtBQUFBLEVBQ3BDO0FBQUEsRUFBUTtBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUM1RDtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNuRDtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU07QUFBQSxFQUFPO0FBQUEsRUFBUTtBQUFBLEVBQzFDO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDckY7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVM7QUFBQSxFQUN4QjtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFDdEM7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVc7QUFBQSxFQUN6QjtBQUFBLEVBQUs7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFDdEQ7QUFBQSxFQUFTO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQy9FO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUNmO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBUTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNqRjtBQUFBLEVBQ0E7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFhO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ3BGO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVE7QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQVU7QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUNuRjtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQ3JCO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFRO0FBQUEsRUFBTztB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O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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QUFPLFFBQVEsV0FBWSxLQUFJLEtBQUssS0FBSyxPQUFPLFFBQVE7QUFBQSxRQUN2RCxrQkFBaUIsS0FBSyxrQkFBa0IsQ0FBQyxPQUFPLFFBQVEsQ0FBQztBQUFBLEVBQ2hFLENBQUM7QUFDSDtBQUVBLFNBQVNDLGdCQUFlLE9BQWUsT0FBdUI7QUFDNUQsTUFBSSxPQUFPLFVBQVUsWUFBWSxDQUFDLG9CQUFvQixLQUFLLEtBQUssR0FBRztBQUNqRSxVQUFNLElBQUksTUFBTSxHQUFHLEtBQUssbUVBQW1FO0FBQUEsRUFDN0Y7QUFDQSxTQUFPO0FBQ1Q7QUFFQSxTQUFTLGFBQWEsUUFBa0M7QUFDdEQsUUFBTSxTQUFTLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxRQUFRLE9BQU8sUUFBUSxNQUFNO0FBQ25FLE1BQUksQ0FBQyxPQUFPLE1BQU0sQ0FBQyxVQUFVLE9BQU8sVUFBVSxZQUFZLE9BQU8sU0FBUyxLQUFLLENBQUMsR0FBRztBQUNqRixVQUFNLElBQUksTUFBTSw0REFBNEQ7QUFBQSxFQUM5RTtBQUNBLE1BQUksT0FBTyxRQUFRLEtBQUssT0FBTyxTQUFTLEdBQUc7QUFDekMsVUFBTSxJQUFJLE1BQU0sOENBQThDO0FBQUEsRUFDaEU7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2VsZWN0cm9uIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX2NoaWxkX3Byb2Nlc3MiLCAiaW1wb3J0X25vZGVfY3J5cHRvIiwgImltcG9ydF9ub2RlX3BhdGgiLCAiaW1wb3J0X25vZGVfb3MiLCAiaW1wb3J0X2ZzIiwgImltcG9ydF9wcm9taXNlcyIsICJzeXNQYXRoIiwgInByZXNvbHZlIiwgImJhc2VuYW1lIiwgInBqb2luIiwgInByZWxhdGl2ZSIsICJwc2VwIiwgImltcG9ydF9wcm9taXNlcyIsICJvc1R5cGUiLCAiZnNfd2F0Y2giLCAicmF3RW1pdHRlciIsICJsaXN0ZW5lciIsICJiYXNlbmFtZSIsICJkaXJuYW1lIiwgIm5ld1N0YXRzIiwgImNsb3NlciIsICJmc3JlYWxwYXRoIiwgInJlc29sdmUiLCAicmVhbHBhdGgiLCAic3RhdHMiLCAicmVsYXRpdmUiLCAiRE9VQkxFX1NMQVNIX1JFIiwgInRlc3RTdHJpbmciLCAicGF0aCIsICJzdGF0cyIsICJzdGF0Y2IiLCAibm93IiwgInN0YXQiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAiaW1wb3J0X25vZGVfZnMiLCAiaW1wb3J0X25vZGVfcGF0aCIsICJ1c2VyUm9vdCIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9mcyIsICJpbXBvcnRfbm9kZV9wYXRoIiwgImltcG9ydF9lbGVjdHJvbiIsICJpbXBvcnRfbm9kZV9jaGlsZF9wcm9jZXNzIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAibG9nIiwgImV4cG9ydHMiLCAiYXNSZWNvcmQiLCAicmVzb2x2ZSIsICJ3ZWJDb250ZW50cyIsICJpbXBvcnRfZWxlY3Ryb24iLCAiaW1wb3J0X25vZGVfY3J5cHRvIiwgImltcG9ydF9ub2RlX2ZzIiwgImltcG9ydF9ub2RlX3BhdGgiLCAibG9nIiwgImFzUmVjb3JkIiwgInJlc29sdmUiLCAicGxhdGZvcm0iLCAiaXNQYXRoSW5zaWRlIiwgImV4cG9ydHMiLCAiaW5mZXJNYWNBcHBSb290IiwgInBsYXRmb3JtIiwgInN0YXQiLCAiYXNSZWNvcmQiLCAiYXNzZXJ0QnJpZGdlSWQiLCAiaXNXaW5kb3dEZXN0cm95ZWQiLCAid2luZG93SWRGb3IiLCAibWFrZVdpbmRvd0xpa2VGb3JWaWV3Il0KfQo=
