"use strict";
const electron = require("electron");
const require$$0$1 = require("path");
const process$1 = require("node:process");
const require$$0$2 = require("child_process");
const require$$0 = require("fs");
const require$$0$3 = require("os");
const require$$0$4 = require("assert");
const require$$2 = require("events");
const require$$0$6 = require("buffer");
const require$$0$5 = require("stream");
const require$$2$1 = require("util");
const node_os = require("node:os");
const dgram = require("dgram");
const promises = require("fs/promises");
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var execa$1 = { exports: {} };
var crossSpawn = { exports: {} };
var windows;
var hasRequiredWindows;
function requireWindows() {
  if (hasRequiredWindows) return windows;
  hasRequiredWindows = 1;
  windows = isexe;
  isexe.sync = sync;
  var fs = require$$0;
  function checkPathExt(path, options) {
    var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
    if (!pathext) {
      return true;
    }
    pathext = pathext.split(";");
    if (pathext.indexOf("") !== -1) {
      return true;
    }
    for (var i = 0; i < pathext.length; i++) {
      var p = pathext[i].toLowerCase();
      if (p && path.substr(-p.length).toLowerCase() === p) {
        return true;
      }
    }
    return false;
  }
  function checkStat(stat, path, options) {
    if (!stat.isSymbolicLink() && !stat.isFile()) {
      return false;
    }
    return checkPathExt(path, options);
  }
  function isexe(path, options, cb) {
    fs.stat(path, function(er, stat) {
      cb(er, er ? false : checkStat(stat, path, options));
    });
  }
  function sync(path, options) {
    return checkStat(fs.statSync(path), path, options);
  }
  return windows;
}
var mode;
var hasRequiredMode;
function requireMode() {
  if (hasRequiredMode) return mode;
  hasRequiredMode = 1;
  mode = isexe;
  isexe.sync = sync;
  var fs = require$$0;
  function isexe(path, options, cb) {
    fs.stat(path, function(er, stat) {
      cb(er, er ? false : checkStat(stat, options));
    });
  }
  function sync(path, options) {
    return checkStat(fs.statSync(path), options);
  }
  function checkStat(stat, options) {
    return stat.isFile() && checkMode(stat, options);
  }
  function checkMode(stat, options) {
    var mod = stat.mode;
    var uid = stat.uid;
    var gid = stat.gid;
    var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
    var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
    var u = parseInt("100", 8);
    var g = parseInt("010", 8);
    var o = parseInt("001", 8);
    var ug = u | g;
    var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
    return ret;
  }
  return mode;
}
var isexe_1;
var hasRequiredIsexe;
function requireIsexe() {
  if (hasRequiredIsexe) return isexe_1;
  hasRequiredIsexe = 1;
  var core2;
  if (process.platform === "win32" || commonjsGlobal.TESTING_WINDOWS) {
    core2 = requireWindows();
  } else {
    core2 = requireMode();
  }
  isexe_1 = isexe;
  isexe.sync = sync;
  function isexe(path, options, cb) {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    if (!cb) {
      if (typeof Promise !== "function") {
        throw new TypeError("callback not provided");
      }
      return new Promise(function(resolve, reject) {
        isexe(path, options || {}, function(er, is) {
          if (er) {
            reject(er);
          } else {
            resolve(is);
          }
        });
      });
    }
    core2(path, options || {}, function(er, is) {
      if (er) {
        if (er.code === "EACCES" || options && options.ignoreErrors) {
          er = null;
          is = false;
        }
      }
      cb(er, is);
    });
  }
  function sync(path, options) {
    try {
      return core2.sync(path, options || {});
    } catch (er) {
      if (options && options.ignoreErrors || er.code === "EACCES") {
        return false;
      } else {
        throw er;
      }
    }
  }
  return isexe_1;
}
var which_1;
var hasRequiredWhich;
function requireWhich() {
  if (hasRequiredWhich) return which_1;
  hasRequiredWhich = 1;
  const isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
  const path = require$$0$1;
  const COLON = isWindows ? ";" : ":";
  const isexe = requireIsexe();
  const getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
  const getPathInfo = (cmd, opt) => {
    const colon = opt.colon || COLON;
    const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
      // windows always checks the cwd first
      ...isWindows ? [process.cwd()] : [],
      ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
      "").split(colon)
    ];
    const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
    const pathExt = isWindows ? pathExtExe.split(colon) : [""];
    if (isWindows) {
      if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
        pathExt.unshift("");
    }
    return {
      pathEnv,
      pathExt,
      pathExtExe
    };
  };
  const which = (cmd, opt, cb) => {
    if (typeof opt === "function") {
      cb = opt;
      opt = {};
    }
    if (!opt)
      opt = {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    const step2 = (i) => new Promise((resolve, reject) => {
      if (i === pathEnv.length)
        return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      resolve(subStep(p, i, 0));
    });
    const subStep = (p, i, ii) => new Promise((resolve, reject) => {
      if (ii === pathExt.length)
        return resolve(step2(i + 1));
      const ext = pathExt[ii];
      isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext);
          else
            return resolve(p + ext);
        }
        return resolve(subStep(p, i, ii + 1));
      });
    });
    return cb ? step2(0).then((res) => cb(null, res), cb) : step2(0);
  };
  const whichSync = (cmd, opt) => {
    opt = opt || {};
    const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
    const found = [];
    for (let i = 0; i < pathEnv.length; i++) {
      const ppRaw = pathEnv[i];
      const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
      const pCmd = path.join(pathPart, cmd);
      const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
      for (let j = 0; j < pathExt.length; j++) {
        const cur = p + pathExt[j];
        try {
          const is = isexe.sync(cur, { pathExt: pathExtExe });
          if (is) {
            if (opt.all)
              found.push(cur);
            else
              return cur;
          }
        } catch (ex) {
        }
      }
    }
    if (opt.all && found.length)
      return found;
    if (opt.nothrow)
      return null;
    throw getNotFoundError(cmd);
  };
  which_1 = which;
  which.sync = whichSync;
  return which_1;
}
var pathKey = { exports: {} };
var hasRequiredPathKey;
function requirePathKey() {
  if (hasRequiredPathKey) return pathKey.exports;
  hasRequiredPathKey = 1;
  const pathKey$1 = (options = {}) => {
    const environment = options.env || process.env;
    const platform = options.platform || process.platform;
    if (platform !== "win32") {
      return "PATH";
    }
    return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
  };
  pathKey.exports = pathKey$1;
  pathKey.exports.default = pathKey$1;
  return pathKey.exports;
}
var resolveCommand_1;
var hasRequiredResolveCommand;
function requireResolveCommand() {
  if (hasRequiredResolveCommand) return resolveCommand_1;
  hasRequiredResolveCommand = 1;
  const path = require$$0$1;
  const which = requireWhich();
  const getPathKey = requirePathKey();
  function resolveCommandAttempt(parsed, withoutPathExt) {
    const env2 = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
    if (shouldSwitchCwd) {
      try {
        process.chdir(parsed.options.cwd);
      } catch (err) {
      }
    }
    let resolved;
    try {
      resolved = which.sync(parsed.command, {
        path: env2[getPathKey({ env: env2 })],
        pathExt: withoutPathExt ? path.delimiter : void 0
      });
    } catch (e) {
    } finally {
      if (shouldSwitchCwd) {
        process.chdir(cwd);
      }
    }
    if (resolved) {
      resolved = path.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
    }
    return resolved;
  }
  function resolveCommand(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
  }
  resolveCommand_1 = resolveCommand;
  return resolveCommand_1;
}
var _escape = {};
var hasRequired_escape;
function require_escape() {
  if (hasRequired_escape) return _escape;
  hasRequired_escape = 1;
  const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
  function escapeCommand(arg) {
    arg = arg.replace(metaCharsRegExp, "^$1");
    return arg;
  }
  function escapeArgument(arg, doubleEscapeMetaChars) {
    arg = `${arg}`;
    arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
    arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
    arg = `"${arg}"`;
    arg = arg.replace(metaCharsRegExp, "^$1");
    if (doubleEscapeMetaChars) {
      arg = arg.replace(metaCharsRegExp, "^$1");
    }
    return arg;
  }
  _escape.command = escapeCommand;
  _escape.argument = escapeArgument;
  return _escape;
}
var shebangRegex;
var hasRequiredShebangRegex;
function requireShebangRegex() {
  if (hasRequiredShebangRegex) return shebangRegex;
  hasRequiredShebangRegex = 1;
  shebangRegex = /^#!(.*)/;
  return shebangRegex;
}
var shebangCommand;
var hasRequiredShebangCommand;
function requireShebangCommand() {
  if (hasRequiredShebangCommand) return shebangCommand;
  hasRequiredShebangCommand = 1;
  const shebangRegex2 = requireShebangRegex();
  shebangCommand = (string = "") => {
    const match = string.match(shebangRegex2);
    if (!match) {
      return null;
    }
    const [path, argument] = match[0].replace(/#! ?/, "").split(" ");
    const binary = path.split("/").pop();
    if (binary === "env") {
      return argument;
    }
    return argument ? `${binary} ${argument}` : binary;
  };
  return shebangCommand;
}
var readShebang_1;
var hasRequiredReadShebang;
function requireReadShebang() {
  if (hasRequiredReadShebang) return readShebang_1;
  hasRequiredReadShebang = 1;
  const fs = require$$0;
  const shebangCommand2 = requireShebangCommand();
  function readShebang(command2) {
    const size = 150;
    const buffer = Buffer.alloc(size);
    let fd;
    try {
      fd = fs.openSync(command2, "r");
      fs.readSync(fd, buffer, 0, size, 0);
      fs.closeSync(fd);
    } catch (e) {
    }
    return shebangCommand2(buffer.toString());
  }
  readShebang_1 = readShebang;
  return readShebang_1;
}
var parse_1;
var hasRequiredParse;
function requireParse() {
  if (hasRequiredParse) return parse_1;
  hasRequiredParse = 1;
  const path = require$$0$1;
  const resolveCommand = requireResolveCommand();
  const escape = require_escape();
  const readShebang = requireReadShebang();
  const isWin2 = process.platform === "win32";
  const isExecutableRegExp = /\.(?:com|exe)$/i;
  const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
  function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);
    const shebang = parsed.file && readShebang(parsed.file);
    if (shebang) {
      parsed.args.unshift(parsed.file);
      parsed.command = shebang;
      return resolveCommand(parsed);
    }
    return parsed.file;
  }
  function parseNonShell(parsed) {
    if (!isWin2) {
      return parsed;
    }
    const commandFile = detectShebang(parsed);
    const needsShell = !isExecutableRegExp.test(commandFile);
    if (parsed.options.forceShell || needsShell) {
      const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
      parsed.command = path.normalize(parsed.command);
      parsed.command = escape.command(parsed.command);
      parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
      const shellCommand = [parsed.command].concat(parsed.args).join(" ");
      parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
      parsed.command = process.env.comspec || "cmd.exe";
      parsed.options.windowsVerbatimArguments = true;
    }
    return parsed;
  }
  function parse2(command2, args2, options) {
    if (args2 && !Array.isArray(args2)) {
      options = args2;
      args2 = null;
    }
    args2 = args2 ? args2.slice(0) : [];
    options = Object.assign({}, options);
    const parsed = {
      command: command2,
      args: args2,
      options,
      file: void 0,
      original: {
        command: command2,
        args: args2
      }
    };
    return options.shell ? parsed : parseNonShell(parsed);
  }
  parse_1 = parse2;
  return parse_1;
}
var enoent;
var hasRequiredEnoent;
function requireEnoent() {
  if (hasRequiredEnoent) return enoent;
  hasRequiredEnoent = 1;
  const isWin2 = process.platform === "win32";
  function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
      code: "ENOENT",
      errno: "ENOENT",
      syscall: `${syscall} ${original.command}`,
      path: original.command,
      spawnargs: original.args
    });
  }
  function hookChildProcess(cp, parsed) {
    if (!isWin2) {
      return;
    }
    const originalEmit = cp.emit;
    cp.emit = function(name, arg1) {
      if (name === "exit") {
        const err = verifyENOENT(arg1, parsed);
        if (err) {
          return originalEmit.call(cp, "error", err);
        }
      }
      return originalEmit.apply(cp, arguments);
    };
  }
  function verifyENOENT(status, parsed) {
    if (isWin2 && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawn");
    }
    return null;
  }
  function verifyENOENTSync(status, parsed) {
    if (isWin2 && status === 1 && !parsed.file) {
      return notFoundError(parsed.original, "spawnSync");
    }
    return null;
  }
  enoent = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError
  };
  return enoent;
}
var hasRequiredCrossSpawn;
function requireCrossSpawn() {
  if (hasRequiredCrossSpawn) return crossSpawn.exports;
  hasRequiredCrossSpawn = 1;
  const cp = require$$0$2;
  const parse2 = requireParse();
  const enoent2 = requireEnoent();
  function spawn(command2, args2, options) {
    const parsed = parse2(command2, args2, options);
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
    enoent2.hookChildProcess(spawned, parsed);
    return spawned;
  }
  function spawnSync(command2, args2, options) {
    const parsed = parse2(command2, args2, options);
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
    result.error = result.error || enoent2.verifyENOENTSync(result.status, parsed);
    return result;
  }
  crossSpawn.exports = spawn;
  crossSpawn.exports.spawn = spawn;
  crossSpawn.exports.sync = spawnSync;
  crossSpawn.exports._parse = parse2;
  crossSpawn.exports._enoent = enoent2;
  return crossSpawn.exports;
}
var stripFinalNewline;
var hasRequiredStripFinalNewline;
function requireStripFinalNewline() {
  if (hasRequiredStripFinalNewline) return stripFinalNewline;
  hasRequiredStripFinalNewline = 1;
  stripFinalNewline = (input) => {
    const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
    const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
    if (input[input.length - 1] === LF) {
      input = input.slice(0, input.length - 1);
    }
    if (input[input.length - 1] === CR) {
      input = input.slice(0, input.length - 1);
    }
    return input;
  };
  return stripFinalNewline;
}
var npmRunPath = { exports: {} };
npmRunPath.exports;
var hasRequiredNpmRunPath;
function requireNpmRunPath() {
  if (hasRequiredNpmRunPath) return npmRunPath.exports;
  hasRequiredNpmRunPath = 1;
  (function(module) {
    const path = require$$0$1;
    const pathKey2 = requirePathKey();
    const npmRunPath2 = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey2()],
        execPath: process.execPath,
        ...options
      };
      let previous;
      let cwdPath = path.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path.resolve(cwdPath, "..");
      }
      const execPathDir = path.resolve(options.cwd, options.execPath, "..");
      result.push(execPathDir);
      return result.concat(options.path).join(path.delimiter);
    };
    module.exports = npmRunPath2;
    module.exports.default = npmRunPath2;
    module.exports.env = (options) => {
      options = {
        env: process.env,
        ...options
      };
      const env2 = { ...options.env };
      const path2 = pathKey2({ env: env2 });
      options.path = env2[path2];
      env2[path2] = module.exports(options);
      return env2;
    };
  })(npmRunPath);
  return npmRunPath.exports;
}
var onetime = { exports: {} };
var mimicFn = { exports: {} };
var hasRequiredMimicFn;
function requireMimicFn() {
  if (hasRequiredMimicFn) return mimicFn.exports;
  hasRequiredMimicFn = 1;
  const mimicFn$1 = (to, from) => {
    for (const prop of Reflect.ownKeys(from)) {
      Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
    }
    return to;
  };
  mimicFn.exports = mimicFn$1;
  mimicFn.exports.default = mimicFn$1;
  return mimicFn.exports;
}
var hasRequiredOnetime;
function requireOnetime() {
  if (hasRequiredOnetime) return onetime.exports;
  hasRequiredOnetime = 1;
  const mimicFn2 = requireMimicFn();
  const calledFunctions = /* @__PURE__ */ new WeakMap();
  const onetime$1 = (function_, options = {}) => {
    if (typeof function_ !== "function") {
      throw new TypeError("Expected a function");
    }
    let returnValue;
    let callCount = 0;
    const functionName = function_.displayName || function_.name || "<anonymous>";
    const onetime2 = function(...arguments_) {
      calledFunctions.set(onetime2, ++callCount);
      if (callCount === 1) {
        returnValue = function_.apply(this, arguments_);
        function_ = null;
      } else if (options.throw === true) {
        throw new Error(`Function \`${functionName}\` can only be called once`);
      }
      return returnValue;
    };
    mimicFn2(onetime2, function_);
    calledFunctions.set(onetime2, callCount);
    return onetime2;
  };
  onetime.exports = onetime$1;
  onetime.exports.default = onetime$1;
  onetime.exports.callCount = (function_) => {
    if (!calledFunctions.has(function_)) {
      throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
    }
    return calledFunctions.get(function_);
  };
  return onetime.exports;
}
var main = {};
var signals$1 = {};
var core = {};
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1;
  Object.defineProperty(core, "__esModule", { value: true });
  core.SIGNALS = void 0;
  const SIGNALS = [
    {
      name: "SIGHUP",
      number: 1,
      action: "terminate",
      description: "Terminal closed",
      standard: "posix"
    },
    {
      name: "SIGINT",
      number: 2,
      action: "terminate",
      description: "User interruption with CTRL-C",
      standard: "ansi"
    },
    {
      name: "SIGQUIT",
      number: 3,
      action: "core",
      description: "User interruption with CTRL-\\",
      standard: "posix"
    },
    {
      name: "SIGILL",
      number: 4,
      action: "core",
      description: "Invalid machine instruction",
      standard: "ansi"
    },
    {
      name: "SIGTRAP",
      number: 5,
      action: "core",
      description: "Debugger breakpoint",
      standard: "posix"
    },
    {
      name: "SIGABRT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "ansi"
    },
    {
      name: "SIGIOT",
      number: 6,
      action: "core",
      description: "Aborted",
      standard: "bsd"
    },
    {
      name: "SIGBUS",
      number: 7,
      action: "core",
      description: "Bus error due to misaligned, non-existing address or paging error",
      standard: "bsd"
    },
    {
      name: "SIGEMT",
      number: 7,
      action: "terminate",
      description: "Command should be emulated but is not implemented",
      standard: "other"
    },
    {
      name: "SIGFPE",
      number: 8,
      action: "core",
      description: "Floating point arithmetic error",
      standard: "ansi"
    },
    {
      name: "SIGKILL",
      number: 9,
      action: "terminate",
      description: "Forced termination",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGUSR1",
      number: 10,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGSEGV",
      number: 11,
      action: "core",
      description: "Segmentation fault",
      standard: "ansi"
    },
    {
      name: "SIGUSR2",
      number: 12,
      action: "terminate",
      description: "Application-specific signal",
      standard: "posix"
    },
    {
      name: "SIGPIPE",
      number: 13,
      action: "terminate",
      description: "Broken pipe or socket",
      standard: "posix"
    },
    {
      name: "SIGALRM",
      number: 14,
      action: "terminate",
      description: "Timeout or timer",
      standard: "posix"
    },
    {
      name: "SIGTERM",
      number: 15,
      action: "terminate",
      description: "Termination",
      standard: "ansi"
    },
    {
      name: "SIGSTKFLT",
      number: 16,
      action: "terminate",
      description: "Stack is empty or overflowed",
      standard: "other"
    },
    {
      name: "SIGCHLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "posix"
    },
    {
      name: "SIGCLD",
      number: 17,
      action: "ignore",
      description: "Child process terminated, paused or unpaused",
      standard: "other"
    },
    {
      name: "SIGCONT",
      number: 18,
      action: "unpause",
      description: "Unpaused",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGSTOP",
      number: 19,
      action: "pause",
      description: "Paused",
      standard: "posix",
      forced: true
    },
    {
      name: "SIGTSTP",
      number: 20,
      action: "pause",
      description: 'Paused using CTRL-Z or "suspend"',
      standard: "posix"
    },
    {
      name: "SIGTTIN",
      number: 21,
      action: "pause",
      description: "Background process cannot read terminal input",
      standard: "posix"
    },
    {
      name: "SIGBREAK",
      number: 21,
      action: "terminate",
      description: "User interruption with CTRL-BREAK",
      standard: "other"
    },
    {
      name: "SIGTTOU",
      number: 22,
      action: "pause",
      description: "Background process cannot write to terminal output",
      standard: "posix"
    },
    {
      name: "SIGURG",
      number: 23,
      action: "ignore",
      description: "Socket received out-of-band data",
      standard: "bsd"
    },
    {
      name: "SIGXCPU",
      number: 24,
      action: "core",
      description: "Process timed out",
      standard: "bsd"
    },
    {
      name: "SIGXFSZ",
      number: 25,
      action: "core",
      description: "File too big",
      standard: "bsd"
    },
    {
      name: "SIGVTALRM",
      number: 26,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGPROF",
      number: 27,
      action: "terminate",
      description: "Timeout or timer",
      standard: "bsd"
    },
    {
      name: "SIGWINCH",
      number: 28,
      action: "ignore",
      description: "Terminal window size changed",
      standard: "bsd"
    },
    {
      name: "SIGIO",
      number: 29,
      action: "terminate",
      description: "I/O is available",
      standard: "other"
    },
    {
      name: "SIGPOLL",
      number: 29,
      action: "terminate",
      description: "Watched event",
      standard: "other"
    },
    {
      name: "SIGINFO",
      number: 29,
      action: "ignore",
      description: "Request for process information",
      standard: "other"
    },
    {
      name: "SIGPWR",
      number: 30,
      action: "terminate",
      description: "Device running out of power",
      standard: "systemv"
    },
    {
      name: "SIGSYS",
      number: 31,
      action: "core",
      description: "Invalid system call",
      standard: "other"
    },
    {
      name: "SIGUNUSED",
      number: 31,
      action: "terminate",
      description: "Invalid system call",
      standard: "other"
    }
  ];
  core.SIGNALS = SIGNALS;
  return core;
}
var realtime = {};
var hasRequiredRealtime;
function requireRealtime() {
  if (hasRequiredRealtime) return realtime;
  hasRequiredRealtime = 1;
  Object.defineProperty(realtime, "__esModule", { value: true });
  realtime.SIGRTMAX = realtime.getRealtimeSignals = void 0;
  const getRealtimeSignals = function() {
    const length = SIGRTMAX - SIGRTMIN + 1;
    return Array.from({ length }, getRealtimeSignal);
  };
  realtime.getRealtimeSignals = getRealtimeSignals;
  const getRealtimeSignal = function(value, index2) {
    return {
      name: `SIGRT${index2 + 1}`,
      number: SIGRTMIN + index2,
      action: "terminate",
      description: "Application-specific signal (realtime)",
      standard: "posix"
    };
  };
  const SIGRTMIN = 34;
  const SIGRTMAX = 64;
  realtime.SIGRTMAX = SIGRTMAX;
  return realtime;
}
var hasRequiredSignals$1;
function requireSignals$1() {
  if (hasRequiredSignals$1) return signals$1;
  hasRequiredSignals$1 = 1;
  Object.defineProperty(signals$1, "__esModule", { value: true });
  signals$1.getSignals = void 0;
  var _os = require$$0$3;
  var _core = requireCore();
  var _realtime = requireRealtime();
  const getSignals = function() {
    const realtimeSignals = (0, _realtime.getRealtimeSignals)();
    const signals2 = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
    return signals2;
  };
  signals$1.getSignals = getSignals;
  const normalizeSignal = function({
    name,
    number: defaultNumber,
    description,
    action,
    forced = false,
    standard
  }) {
    const {
      signals: { [name]: constantSignal }
    } = _os.constants;
    const supported = constantSignal !== void 0;
    const number = supported ? constantSignal : defaultNumber;
    return { name, number, description, supported, action, forced, standard };
  };
  return signals$1;
}
var hasRequiredMain;
function requireMain() {
  if (hasRequiredMain) return main;
  hasRequiredMain = 1;
  Object.defineProperty(main, "__esModule", { value: true });
  main.signalsByNumber = main.signalsByName = void 0;
  var _os = require$$0$3;
  var _signals = requireSignals$1();
  var _realtime = requireRealtime();
  const getSignalsByName = function() {
    const signals2 = (0, _signals.getSignals)();
    return signals2.reduce(getSignalByName, {});
  };
  const getSignalByName = function(signalByNameMemo, { name, number, description, supported, action, forced, standard }) {
    return {
      ...signalByNameMemo,
      [name]: { name, number, description, supported, action, forced, standard }
    };
  };
  const signalsByName = getSignalsByName();
  main.signalsByName = signalsByName;
  const getSignalsByNumber = function() {
    const signals2 = (0, _signals.getSignals)();
    const length = _realtime.SIGRTMAX + 1;
    const signalsA = Array.from({ length }, (value, number) => getSignalByNumber(number, signals2));
    return Object.assign({}, ...signalsA);
  };
  const getSignalByNumber = function(number, signals2) {
    const signal = findSignalByNumber(number, signals2);
    if (signal === void 0) {
      return {};
    }
    const { name, description, supported, action, forced, standard } = signal;
    return {
      [number]: {
        name,
        number,
        description,
        supported,
        action,
        forced,
        standard
      }
    };
  };
  const findSignalByNumber = function(number, signals2) {
    const signal = signals2.find(({ name }) => _os.constants.signals[name] === number);
    if (signal !== void 0) {
      return signal;
    }
    return signals2.find((signalA) => signalA.number === number);
  };
  const signalsByNumber = getSignalsByNumber();
  main.signalsByNumber = signalsByNumber;
  return main;
}
var error;
var hasRequiredError;
function requireError() {
  if (hasRequiredError) return error;
  hasRequiredError = 1;
  const { signalsByName } = requireMain();
  const getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
    if (timedOut) {
      return `timed out after ${timeout} milliseconds`;
    }
    if (isCanceled) {
      return "was canceled";
    }
    if (errorCode !== void 0) {
      return `failed with ${errorCode}`;
    }
    if (signal !== void 0) {
      return `was killed with ${signal} (${signalDescription})`;
    }
    if (exitCode !== void 0) {
      return `failed with exit code ${exitCode}`;
    }
    return "failed";
  };
  const makeError = ({
    stdout,
    stderr,
    all,
    error: error2,
    signal,
    exitCode,
    command: command2,
    escapedCommand,
    timedOut,
    isCanceled,
    killed,
    parsed: { options: { timeout } }
  }) => {
    exitCode = exitCode === null ? void 0 : exitCode;
    signal = signal === null ? void 0 : signal;
    const signalDescription = signal === void 0 ? void 0 : signalsByName[signal].description;
    const errorCode = error2 && error2.code;
    const prefix = getErrorPrefix({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled });
    const execaMessage = `Command ${prefix}: ${command2}`;
    const isError = Object.prototype.toString.call(error2) === "[object Error]";
    const shortMessage = isError ? `${execaMessage}
${error2.message}` : execaMessage;
    const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
    if (isError) {
      error2.originalMessage = error2.message;
      error2.message = message;
    } else {
      error2 = new Error(message);
    }
    error2.shortMessage = shortMessage;
    error2.command = command2;
    error2.escapedCommand = escapedCommand;
    error2.exitCode = exitCode;
    error2.signal = signal;
    error2.signalDescription = signalDescription;
    error2.stdout = stdout;
    error2.stderr = stderr;
    if (all !== void 0) {
      error2.all = all;
    }
    if ("bufferedData" in error2) {
      delete error2.bufferedData;
    }
    error2.failed = true;
    error2.timedOut = Boolean(timedOut);
    error2.isCanceled = isCanceled;
    error2.killed = killed && !timedOut;
    return error2;
  };
  error = makeError;
  return error;
}
var stdio = { exports: {} };
var hasRequiredStdio;
function requireStdio() {
  if (hasRequiredStdio) return stdio.exports;
  hasRequiredStdio = 1;
  const aliases = ["stdin", "stdout", "stderr"];
  const hasAlias = (options) => aliases.some((alias) => options[alias] !== void 0);
  const normalizeStdio = (options) => {
    if (!options) {
      return;
    }
    const { stdio: stdio2 } = options;
    if (stdio2 === void 0) {
      return aliases.map((alias) => options[alias]);
    }
    if (hasAlias(options)) {
      throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
    }
    if (typeof stdio2 === "string") {
      return stdio2;
    }
    if (!Array.isArray(stdio2)) {
      throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio2}\``);
    }
    const length = Math.max(stdio2.length, aliases.length);
    return Array.from({ length }, (value, index2) => stdio2[index2]);
  };
  stdio.exports = normalizeStdio;
  stdio.exports.node = (options) => {
    const stdio2 = normalizeStdio(options);
    if (stdio2 === "ipc") {
      return "ipc";
    }
    if (stdio2 === void 0 || typeof stdio2 === "string") {
      return [stdio2, stdio2, stdio2, "ipc"];
    }
    if (stdio2.includes("ipc")) {
      return stdio2;
    }
    return [...stdio2, "ipc"];
  };
  return stdio.exports;
}
var signalExit = { exports: {} };
var signals = { exports: {} };
var hasRequiredSignals;
function requireSignals() {
  if (hasRequiredSignals) return signals.exports;
  hasRequiredSignals = 1;
  (function(module) {
    module.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  })(signals);
  return signals.exports;
}
var hasRequiredSignalExit;
function requireSignalExit() {
  if (hasRequiredSignalExit) return signalExit.exports;
  hasRequiredSignalExit = 1;
  var process2 = commonjsGlobal.process;
  const processOk = function(process3) {
    return process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
  };
  if (!processOk(process2)) {
    signalExit.exports = function() {
      return function() {
      };
    };
  } else {
    var assert = require$$0$4;
    var signals2 = requireSignals();
    var isWin2 = /^win/i.test(process2.platform);
    var EE = require$$2;
    if (typeof EE !== "function") {
      EE = EE.EventEmitter;
    }
    var emitter;
    if (process2.__signal_exit_emitter__) {
      emitter = process2.__signal_exit_emitter__;
    } else {
      emitter = process2.__signal_exit_emitter__ = new EE();
      emitter.count = 0;
      emitter.emitted = {};
    }
    if (!emitter.infinite) {
      emitter.setMaxListeners(Infinity);
      emitter.infinite = true;
    }
    signalExit.exports = function(cb, opts) {
      if (!processOk(commonjsGlobal.process)) {
        return function() {
        };
      }
      assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
      if (loaded === false) {
        load();
      }
      var ev = "exit";
      if (opts && opts.alwaysLast) {
        ev = "afterexit";
      }
      var remove2 = function() {
        emitter.removeListener(ev, cb);
        if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
          unload();
        }
      };
      emitter.on(ev, cb);
      return remove2;
    };
    var unload = function unload2() {
      if (!loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = false;
      signals2.forEach(function(sig) {
        try {
          process2.removeListener(sig, sigListeners[sig]);
        } catch (er) {
        }
      });
      process2.emit = originalProcessEmit;
      process2.reallyExit = originalProcessReallyExit;
      emitter.count -= 1;
    };
    signalExit.exports.unload = unload;
    var emit = function emit2(event, code, signal) {
      if (emitter.emitted[event]) {
        return;
      }
      emitter.emitted[event] = true;
      emitter.emit(event, code, signal);
    };
    var sigListeners = {};
    signals2.forEach(function(sig) {
      sigListeners[sig] = function listener() {
        if (!processOk(commonjsGlobal.process)) {
          return;
        }
        var listeners = process2.listeners(sig);
        if (listeners.length === emitter.count) {
          unload();
          emit("exit", null, sig);
          emit("afterexit", null, sig);
          if (isWin2 && sig === "SIGHUP") {
            sig = "SIGINT";
          }
          process2.kill(process2.pid, sig);
        }
      };
    });
    signalExit.exports.signals = function() {
      return signals2;
    };
    var loaded = false;
    var load = function load2() {
      if (loaded || !processOk(commonjsGlobal.process)) {
        return;
      }
      loaded = true;
      emitter.count += 1;
      signals2 = signals2.filter(function(sig) {
        try {
          process2.on(sig, sigListeners[sig]);
          return true;
        } catch (er) {
          return false;
        }
      });
      process2.emit = processEmit;
      process2.reallyExit = processReallyExit;
    };
    signalExit.exports.load = load;
    var originalProcessReallyExit = process2.reallyExit;
    var processReallyExit = function processReallyExit2(code) {
      if (!processOk(commonjsGlobal.process)) {
        return;
      }
      process2.exitCode = code || /* istanbul ignore next */
      0;
      emit("exit", process2.exitCode, null);
      emit("afterexit", process2.exitCode, null);
      originalProcessReallyExit.call(process2, process2.exitCode);
    };
    var originalProcessEmit = process2.emit;
    var processEmit = function processEmit2(ev, arg) {
      if (ev === "exit" && processOk(commonjsGlobal.process)) {
        if (arg !== void 0) {
          process2.exitCode = arg;
        }
        var ret = originalProcessEmit.apply(this, arguments);
        emit("exit", process2.exitCode, null);
        emit("afterexit", process2.exitCode, null);
        return ret;
      } else {
        return originalProcessEmit.apply(this, arguments);
      }
    };
  }
  return signalExit.exports;
}
var kill;
var hasRequiredKill;
function requireKill() {
  if (hasRequiredKill) return kill;
  hasRequiredKill = 1;
  const os = require$$0$3;
  const onExit = requireSignalExit();
  const DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
  const spawnedKill = (kill2, signal = "SIGTERM", options = {}) => {
    const killResult = kill2(signal);
    setKillTimeout(kill2, signal, options, killResult);
    return killResult;
  };
  const setKillTimeout = (kill2, signal, options, killResult) => {
    if (!shouldForceKill(signal, options, killResult)) {
      return;
    }
    const timeout = getForceKillAfterTimeout(options);
    const t = setTimeout(() => {
      kill2("SIGKILL");
    }, timeout);
    if (t.unref) {
      t.unref();
    }
  };
  const shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
    return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
  };
  const isSigterm = (signal) => {
    return signal === os.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
  };
  const getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
    if (forceKillAfterTimeout === true) {
      return DEFAULT_FORCE_KILL_TIMEOUT;
    }
    if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
      throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
    }
    return forceKillAfterTimeout;
  };
  const spawnedCancel = (spawned, context) => {
    const killResult = spawned.kill();
    if (killResult) {
      context.isCanceled = true;
    }
  };
  const timeoutKill = (spawned, signal, reject) => {
    spawned.kill(signal);
    reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
  };
  const setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
    if (timeout === 0 || timeout === void 0) {
      return spawnedPromise;
    }
    let timeoutId;
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        timeoutKill(spawned, killSignal, reject);
      }, timeout);
    });
    const safeSpawnedPromise = spawnedPromise.finally(() => {
      clearTimeout(timeoutId);
    });
    return Promise.race([timeoutPromise, safeSpawnedPromise]);
  };
  const validateTimeout = ({ timeout }) => {
    if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
      throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
    }
  };
  const setExitHandler = async (spawned, { cleanup, detached }, timedPromise) => {
    if (!cleanup || detached) {
      return timedPromise;
    }
    const removeExitHandler = onExit(() => {
      spawned.kill();
    });
    return timedPromise.finally(() => {
      removeExitHandler();
    });
  };
  kill = {
    spawnedKill,
    spawnedCancel,
    setupTimeout,
    validateTimeout,
    setExitHandler
  };
  return kill;
}
var isStream_1;
var hasRequiredIsStream;
function requireIsStream() {
  if (hasRequiredIsStream) return isStream_1;
  hasRequiredIsStream = 1;
  const isStream = (stream2) => stream2 !== null && typeof stream2 === "object" && typeof stream2.pipe === "function";
  isStream.writable = (stream2) => isStream(stream2) && stream2.writable !== false && typeof stream2._write === "function" && typeof stream2._writableState === "object";
  isStream.readable = (stream2) => isStream(stream2) && stream2.readable !== false && typeof stream2._read === "function" && typeof stream2._readableState === "object";
  isStream.duplex = (stream2) => isStream.writable(stream2) && isStream.readable(stream2);
  isStream.transform = (stream2) => isStream.duplex(stream2) && typeof stream2._transform === "function";
  isStream_1 = isStream;
  return isStream_1;
}
var getStream = { exports: {} };
var bufferStream;
var hasRequiredBufferStream;
function requireBufferStream() {
  if (hasRequiredBufferStream) return bufferStream;
  hasRequiredBufferStream = 1;
  const { PassThrough: PassThroughStream } = require$$0$5;
  bufferStream = (options) => {
    options = { ...options };
    const { array } = options;
    let { encoding } = options;
    const isBuffer = encoding === "buffer";
    let objectMode = false;
    if (array) {
      objectMode = !(encoding || isBuffer);
    } else {
      encoding = encoding || "utf8";
    }
    if (isBuffer) {
      encoding = null;
    }
    const stream2 = new PassThroughStream({ objectMode });
    if (encoding) {
      stream2.setEncoding(encoding);
    }
    let length = 0;
    const chunks = [];
    stream2.on("data", (chunk) => {
      chunks.push(chunk);
      if (objectMode) {
        length = chunks.length;
      } else {
        length += chunk.length;
      }
    });
    stream2.getBufferedValue = () => {
      if (array) {
        return chunks;
      }
      return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
    };
    stream2.getBufferedLength = () => length;
    return stream2;
  };
  return bufferStream;
}
var hasRequiredGetStream;
function requireGetStream() {
  if (hasRequiredGetStream) return getStream.exports;
  hasRequiredGetStream = 1;
  const { constants: BufferConstants } = require$$0$6;
  const stream2 = require$$0$5;
  const { promisify } = require$$2$1;
  const bufferStream2 = requireBufferStream();
  const streamPipelinePromisified = promisify(stream2.pipeline);
  class MaxBufferError extends Error {
    constructor() {
      super("maxBuffer exceeded");
      this.name = "MaxBufferError";
    }
  }
  async function getStream$1(inputStream, options) {
    if (!inputStream) {
      throw new Error("Expected a stream");
    }
    options = {
      maxBuffer: Infinity,
      ...options
    };
    const { maxBuffer } = options;
    const stream3 = bufferStream2(options);
    await new Promise((resolve, reject) => {
      const rejectPromise = (error2) => {
        if (error2 && stream3.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
          error2.bufferedData = stream3.getBufferedValue();
        }
        reject(error2);
      };
      (async () => {
        try {
          await streamPipelinePromisified(inputStream, stream3);
          resolve();
        } catch (error2) {
          rejectPromise(error2);
        }
      })();
      stream3.on("data", () => {
        if (stream3.getBufferedLength() > maxBuffer) {
          rejectPromise(new MaxBufferError());
        }
      });
    });
    return stream3.getBufferedValue();
  }
  getStream.exports = getStream$1;
  getStream.exports.buffer = (stream3, options) => getStream$1(stream3, { ...options, encoding: "buffer" });
  getStream.exports.array = (stream3, options) => getStream$1(stream3, { ...options, array: true });
  getStream.exports.MaxBufferError = MaxBufferError;
  return getStream.exports;
}
var mergeStream;
var hasRequiredMergeStream;
function requireMergeStream() {
  if (hasRequiredMergeStream) return mergeStream;
  hasRequiredMergeStream = 1;
  const { PassThrough } = require$$0$5;
  mergeStream = function() {
    var sources = [];
    var output = new PassThrough({ objectMode: true });
    output.setMaxListeners(0);
    output.add = add;
    output.isEmpty = isEmpty2;
    output.on("unpipe", remove2);
    Array.prototype.slice.call(arguments).forEach(add);
    return output;
    function add(source) {
      if (Array.isArray(source)) {
        source.forEach(add);
        return this;
      }
      sources.push(source);
      source.once("end", remove2.bind(null, source));
      source.once("error", output.emit.bind(output, "error"));
      source.pipe(output, { end: false });
      return this;
    }
    function isEmpty2() {
      return sources.length == 0;
    }
    function remove2(source) {
      sources = sources.filter(function(it) {
        return it !== source;
      });
      if (!sources.length && output.readable) {
        output.end();
      }
    }
  };
  return mergeStream;
}
var stream;
var hasRequiredStream;
function requireStream() {
  if (hasRequiredStream) return stream;
  hasRequiredStream = 1;
  const isStream = requireIsStream();
  const getStream2 = requireGetStream();
  const mergeStream2 = requireMergeStream();
  const handleInput = (spawned, input) => {
    if (input === void 0 || spawned.stdin === void 0) {
      return;
    }
    if (isStream(input)) {
      input.pipe(spawned.stdin);
    } else {
      spawned.stdin.end(input);
    }
  };
  const makeAllStream = (spawned, { all }) => {
    if (!all || !spawned.stdout && !spawned.stderr) {
      return;
    }
    const mixed = mergeStream2();
    if (spawned.stdout) {
      mixed.add(spawned.stdout);
    }
    if (spawned.stderr) {
      mixed.add(spawned.stderr);
    }
    return mixed;
  };
  const getBufferedData = async (stream2, streamPromise) => {
    if (!stream2) {
      return;
    }
    stream2.destroy();
    try {
      return await streamPromise;
    } catch (error2) {
      return error2.bufferedData;
    }
  };
  const getStreamPromise = (stream2, { encoding, buffer, maxBuffer }) => {
    if (!stream2 || !buffer) {
      return;
    }
    if (encoding) {
      return getStream2(stream2, { encoding, maxBuffer });
    }
    return getStream2.buffer(stream2, { maxBuffer });
  };
  const getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
    const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
    const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
    const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
    try {
      return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
    } catch (error2) {
      return Promise.all([
        { error: error2, signal: error2.signal, timedOut: error2.timedOut },
        getBufferedData(stdout, stdoutPromise),
        getBufferedData(stderr, stderrPromise),
        getBufferedData(all, allPromise)
      ]);
    }
  };
  const validateInputSync = ({ input }) => {
    if (isStream(input)) {
      throw new TypeError("The `input` option cannot be a stream in sync mode");
    }
  };
  stream = {
    handleInput,
    makeAllStream,
    getSpawnedResult,
    validateInputSync
  };
  return stream;
}
var promise;
var hasRequiredPromise;
function requirePromise() {
  if (hasRequiredPromise) return promise;
  hasRequiredPromise = 1;
  const nativePromisePrototype = (async () => {
  })().constructor.prototype;
  const descriptors = ["then", "catch", "finally"].map((property) => [
    property,
    Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property)
  ]);
  const mergePromise = (spawned, promise2) => {
    for (const [property, descriptor] of descriptors) {
      const value = typeof promise2 === "function" ? (...args2) => Reflect.apply(descriptor.value, promise2(), args2) : descriptor.value.bind(promise2);
      Reflect.defineProperty(spawned, property, { ...descriptor, value });
    }
    return spawned;
  };
  const getSpawnedPromise = (spawned) => {
    return new Promise((resolve, reject) => {
      spawned.on("exit", (exitCode, signal) => {
        resolve({ exitCode, signal });
      });
      spawned.on("error", (error2) => {
        reject(error2);
      });
      if (spawned.stdin) {
        spawned.stdin.on("error", (error2) => {
          reject(error2);
        });
      }
    });
  };
  promise = {
    mergePromise,
    getSpawnedPromise
  };
  return promise;
}
var command;
var hasRequiredCommand;
function requireCommand() {
  if (hasRequiredCommand) return command;
  hasRequiredCommand = 1;
  const normalizeArgs = (file, args2 = []) => {
    if (!Array.isArray(args2)) {
      return [file];
    }
    return [file, ...args2];
  };
  const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
  const DOUBLE_QUOTES_REGEXP = /"/g;
  const escapeArg = (arg) => {
    if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
      return arg;
    }
    return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
  };
  const joinCommand = (file, args2) => {
    return normalizeArgs(file, args2).join(" ");
  };
  const getEscapedCommand = (file, args2) => {
    return normalizeArgs(file, args2).map((arg) => escapeArg(arg)).join(" ");
  };
  const SPACES_REGEXP = / +/g;
  const parseCommand = (command2) => {
    const tokens = [];
    for (const token of command2.trim().split(SPACES_REGEXP)) {
      const previousToken = tokens[tokens.length - 1];
      if (previousToken && previousToken.endsWith("\\")) {
        tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  };
  command = {
    joinCommand,
    getEscapedCommand,
    parseCommand
  };
  return command;
}
var hasRequiredExeca;
function requireExeca() {
  if (hasRequiredExeca) return execa$1.exports;
  hasRequiredExeca = 1;
  const path = require$$0$1;
  const childProcess = require$$0$2;
  const crossSpawn2 = requireCrossSpawn();
  const stripFinalNewline2 = requireStripFinalNewline();
  const npmRunPath2 = requireNpmRunPath();
  const onetime2 = requireOnetime();
  const makeError = requireError();
  const normalizeStdio = requireStdio();
  const { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = requireKill();
  const { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = requireStream();
  const { mergePromise, getSpawnedPromise } = requirePromise();
  const { joinCommand, parseCommand, getEscapedCommand } = requireCommand();
  const DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
  const getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
    const env2 = extendEnv ? { ...process.env, ...envOption } : envOption;
    if (preferLocal) {
      return npmRunPath2.env({ env: env2, cwd: localDir, execPath });
    }
    return env2;
  };
  const handleArguments = (file, args2, options = {}) => {
    const parsed = crossSpawn2._parse(file, args2, options);
    file = parsed.command;
    args2 = parsed.args;
    options = parsed.options;
    options = {
      maxBuffer: DEFAULT_MAX_BUFFER,
      buffer: true,
      stripFinalNewline: true,
      extendEnv: true,
      preferLocal: false,
      localDir: options.cwd || process.cwd(),
      execPath: process.execPath,
      encoding: "utf8",
      reject: true,
      cleanup: true,
      all: false,
      windowsHide: true,
      ...options
    };
    options.env = getEnv(options);
    options.stdio = normalizeStdio(options);
    if (process.platform === "win32" && path.basename(file, ".exe") === "cmd") {
      args2.unshift("/q");
    }
    return { file, args: args2, options, parsed };
  };
  const handleOutput = (options, value, error2) => {
    if (typeof value !== "string" && !Buffer.isBuffer(value)) {
      return error2 === void 0 ? void 0 : "";
    }
    if (options.stripFinalNewline) {
      return stripFinalNewline2(value);
    }
    return value;
  };
  const execa2 = (file, args2, options) => {
    const parsed = handleArguments(file, args2, options);
    const command2 = joinCommand(file, args2);
    const escapedCommand = getEscapedCommand(file, args2);
    validateTimeout(parsed.options);
    let spawned;
    try {
      spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      const dummySpawned = new childProcess.ChildProcess();
      const errorPromise = Promise.reject(makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        escapedCommand,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      }));
      return mergePromise(dummySpawned, errorPromise);
    }
    const spawnedPromise = getSpawnedPromise(spawned);
    const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
    const processDone = setExitHandler(spawned, parsed.options, timedPromise);
    const context = { isCanceled: false };
    spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
    spawned.cancel = spawnedCancel.bind(null, spawned, context);
    const handlePromise = async () => {
      const [{ error: error2, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
      const stdout = handleOutput(parsed.options, stdoutResult);
      const stderr = handleOutput(parsed.options, stderrResult);
      const all = handleOutput(parsed.options, allResult);
      if (error2 || exitCode !== 0 || signal !== null) {
        const returnedError = makeError({
          error: error2,
          exitCode,
          signal,
          stdout,
          stderr,
          all,
          command: command2,
          escapedCommand,
          parsed,
          timedOut,
          isCanceled: context.isCanceled,
          killed: spawned.killed
        });
        if (!parsed.options.reject) {
          return returnedError;
        }
        throw returnedError;
      }
      return {
        command: command2,
        escapedCommand,
        exitCode: 0,
        stdout,
        stderr,
        all,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false
      };
    };
    const handlePromiseOnce = onetime2(handlePromise);
    handleInput(spawned, parsed.options.input);
    spawned.all = makeAllStream(spawned, parsed.options);
    return mergePromise(spawned, handlePromiseOnce);
  };
  execa$1.exports = execa2;
  execa$1.exports.sync = (file, args2, options) => {
    const parsed = handleArguments(file, args2, options);
    const command2 = joinCommand(file, args2);
    const escapedCommand = getEscapedCommand(file, args2);
    validateInputSync(parsed.options);
    let result;
    try {
      result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
    } catch (error2) {
      throw makeError({
        error: error2,
        stdout: "",
        stderr: "",
        all: "",
        command: command2,
        escapedCommand,
        parsed,
        timedOut: false,
        isCanceled: false,
        killed: false
      });
    }
    const stdout = handleOutput(parsed.options, result.stdout, result.error);
    const stderr = handleOutput(parsed.options, result.stderr, result.error);
    if (result.error || result.status !== 0 || result.signal !== null) {
      const error2 = makeError({
        stdout,
        stderr,
        error: result.error,
        signal: result.signal,
        exitCode: result.status,
        command: command2,
        escapedCommand,
        parsed,
        timedOut: result.error && result.error.code === "ETIMEDOUT",
        isCanceled: false,
        killed: result.signal !== null
      });
      if (!parsed.options.reject) {
        return error2;
      }
      throw error2;
    }
    return {
      command: command2,
      escapedCommand,
      exitCode: 0,
      stdout,
      stderr,
      failed: false,
      timedOut: false,
      isCanceled: false,
      killed: false
    };
  };
  execa$1.exports.command = (command2, options) => {
    const [file, ...args2] = parseCommand(command2);
    return execa2(file, args2, options);
  };
  execa$1.exports.commandSync = (command2, options) => {
    const [file, ...args2] = parseCommand(command2);
    return execa2.sync(file, args2, options);
  };
  execa$1.exports.node = (scriptPath, args2, options = {}) => {
    if (args2 && !Array.isArray(args2) && typeof args2 === "object") {
      options = args2;
      args2 = [];
    }
    const stdio2 = normalizeStdio.node(options);
    const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
    const {
      nodePath = process.execPath,
      nodeOptions = defaultExecArgv
    } = options;
    return execa2(
      nodePath,
      [
        ...nodeOptions,
        scriptPath,
        ...Array.isArray(args2) ? args2 : []
      ],
      {
        ...options,
        stdin: void 0,
        stdout: void 0,
        stderr: void 0,
        stdio: stdio2,
        shell: false
      }
    );
  };
  return execa$1.exports;
}
var execaExports = requireExeca();
const execa = /* @__PURE__ */ getDefaultExportFromCjs(execaExports);
function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? void 0 : "g");
}
const regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}
const detectDefaultShell = () => {
  const { env: env2 } = process$1;
  if (process$1.platform === "win32") {
    return env2.COMSPEC || "cmd.exe";
  }
  try {
    const { shell } = node_os.userInfo();
    if (shell) {
      return shell;
    }
  } catch {
  }
  if (process$1.platform === "darwin") {
    return env2.SHELL || "/bin/zsh";
  }
  return env2.SHELL || "/bin/sh";
};
const defaultShell = detectDefaultShell();
const args = [
  "-ilc",
  'echo -n "_SHELL_ENV_DELIMITER_"; env; echo -n "_SHELL_ENV_DELIMITER_"; exit'
];
const env = {
  // Disables Oh My Zsh auto-update thing that can block the process.
  DISABLE_AUTO_UPDATE: "true"
};
const parseEnv = (env2) => {
  env2 = env2.split("_SHELL_ENV_DELIMITER_")[1];
  const returnValue = {};
  for (const line of stripAnsi(env2).split("\n").filter((line2) => Boolean(line2))) {
    const [key, ...values] = line.split("=");
    returnValue[key] = values.join("=");
  }
  return returnValue;
};
function shellEnvSync(shell) {
  if (process$1.platform === "win32") {
    return process$1.env;
  }
  try {
    const { stdout } = execa.sync(shell || defaultShell, args, { env });
    return parseEnv(stdout);
  } catch (error2) {
    {
      return process$1.env;
    }
  }
}
function shellPathSync() {
  const { PATH } = shellEnvSync();
  return PATH;
}
function fixPath() {
  if (process$1.platform === "win32") {
    return;
  }
  process$1.env.PATH = shellPathSync() || [
    "./node_modules/.bin",
    "/.nodebrew/current/bin",
    "/usr/local/bin",
    process$1.env.PATH
  ].join(":");
}
const strings = {
  // validation errors
  AdditionalItemsError: "Array at `{{pointer}}` may not have an additional item `{{key}}`",
  AdditionalPropertiesError: "Additional property `{{property}}` on `{{pointer}}` does not match schema `{{schema}}`",
  AllOfError: "Value `{{value}}` at `{{pointer}}` does not match schema of `{{allOf}}`",
  AnyOfError: "Value `{{value}}` at `{{pointer}}` does not match any schema of `{{anyOf}}`",
  ConstError: "Expected value at `{{pointer}}` to be `{{expected}}`, but value given is `{{value}}`",
  containsAnyError: "The array at `{{pointer}}` must contain at least one item",
  ContainsArrayError: "The property at `{{pointer}}` must not be an array",
  ContainsError: "The array at `{{pointer}}` must contain an element that matches `{{schema}}`",
  ContainsMinError: "The array at `{{pointer}}` contains {{delta}} too few items matching `{{schema}}`",
  ContainsMaxError: "The array at `{{pointer}}` contains {{delta}} too many items matching `{{schema}}`",
  EnumError: "Expected given value `{{value}}` in `{{pointer}}` to be one of `{{values}}`",
  ForbiddenPropertyError: "Property name `{{property}}` at `{{pointer}}` is not allowed",
  FormatDateError: "Value `{{value}}` at `{{pointer}}` is not a valid date",
  FormatDateTimeError: "Value `{{value}}` at `{{pointer}}` is not a valid date-time",
  FormatDurationError: "Value `{{value}}` at `{{pointer}}` is not a valid duration",
  FormatEmailError: "Value `{{value}}` at `{{pointer}}` is not a valid email",
  FormatHostnameError: "Value `{{value}}` at `{{pointer}}` is not a valid hostname",
  FormatIPV4Error: "Value `{{value}}` at `{{pointer}}` is not a valid IPv4 address",
  FormatIPV4LeadingZeroError: "IPv4 addresses starting with zero are invalid, since they are interpreted as octals",
  FormatIPV6Error: "Value `{{value}}` at `{{pointer}}` is not a valid IPv6 address",
  FormatIPV6LeadingZeroError: "IPv6 addresses starting with zero are invalid, since they are interpreted as octals",
  FormatJsonPointerError: "Value `{{value}}` at `{{pointer}}` is not a valid json-pointer",
  FormatRegExError: "Value `{{value}}` at `{{pointer}}` is not a valid regular expression",
  FormatTimeError: "Value `{{value}}` at `{{pointer}}` is not a valid time",
  FormatURIError: "Value `{{value}}` at `{{pointer}}` is not a valid uri",
  FormatURIReferenceError: "Value `{{value}}` at `{{pointer}}` is not a valid uri-reference",
  FormatURITemplateError: "Value `{{value}}` at `{{pointer}}` is not a valid uri-template",
  FormatURLError: "Value `{{value}}` at `{{pointer}}` is not a valid url",
  InvalidDataError: "No value may be specified in `{{pointer}}`",
  InvalidPropertyNameError: "Invalid property name `{{property}}` at `{{pointer}}`",
  MaximumError: "Value in `{{pointer}}` is `{{length}}`, but should be `{{maximum}}` at maximum",
  MaxItemsError: "Too many items in `{{pointer}}`, should be `{{maximum}}` at most, but got `{{length}}`",
  MaxLengthError: "Value `{{pointer}}` should have a maximum length of `{{maxLength}}`, but got `{{length}}`.",
  MaxPropertiesError: "Too many properties in `{{pointer}}`, should be `{{maximum}}` at most, but got `{{length}}`",
  MinimumError: "Value in `{{pointer}}` is `{{length}}`, but should be `{{minimum}}` at minimum",
  MinItemsError: "Too few items in `{{pointer}}`, should be at least `{{minItems}}`, but got `{{length}}`",
  MinItemsOneError: "At least one item is required in `{{pointer}}`",
  MinLengthError: "Value `{{pointer}}` should have a minimum length of `{{minLength}}`, but got `{{length}}`.",
  MinLengthOneError: "A value is required in `{{pointer}}`",
  MinPropertiesError: "Too few properties in `{{pointer}}`, should be at least `{{minimum}}`, but got `{{length}}`",
  MissingDependencyError: "The required propery '{{missingProperty}}' in `{{pointer}}` is missing",
  MissingOneOfPropertyError: "Value at `{{pointer}}` property: `{{property}}`",
  MultipleOfError: "Expected `{{value}}` in `{{pointer}}` to be multiple of `{{multipleOf}}`",
  MultipleOneOfError: "Value `{{value}}` should not match multiple schemas in oneOf `{{matches}}`",
  NoAdditionalPropertiesError: "Additional property `{{property}}` in `{{pointer}}` is not allowed",
  NotError: "Value `{{value}}` at pointer should not match schema `{{not}}`",
  OneOfError: "Value `{{value}}` in `{{pointer}}` does not match any given oneof schema",
  OneOfPropertyError: "Failed finding a matching oneOfProperty schema in `{{pointer}}` where `{{property}}` matches `{{value}}`",
  PatternError: "Value in `{{pointer}}` should match `{{description}}`, but received `{{received}}`",
  PatternPropertiesError: "Property `{{key}}` does not match any patterns in `{{pointer}}`. Valid patterns are: {{patterns}}",
  RequiredPropertyError: "The required property `{{key}}` is missing at `{{pointer}}`",
  SchemaWarning: "Failed retrieving a schema from '{{pointer}}' to key '{{key}}'",
  TypeError: "Expected `{{value}}` ({{received}}) in `{{pointer}}` to be of type `{{expected}}`",
  UndefinedValueError: "Value must not be undefined in `{{pointer}}`",
  UnevaluatedPropertyError: "Invalid unevaluated property `{{pointer}}`",
  UnevaluatedItemsError: "Invalid unevaluated item `{{pointer}}`",
  UniqueItemsError: "Items in array must be unique. Value `{{value}}` in `{{pointer}}` is a duplicate of {{duplicatePointer}}.",
  UnknownPropertyError: "Could not find a valid schema for property `{{pointer}}` within object",
  ValueNotEmptyError: "A value for `{{property}}` is required at `{{pointer}}`"
};
const toString = Object.prototype.toString;
function getTypeOf(value) {
  const type = toString.call(value).match(/\s([^\]]+)\]/).pop().toLowerCase();
  if (type === "file") {
    return "object";
  }
  return type;
}
const OBJECT_TYPE = "object";
const ARRAY_TYPE = "array";
function render(template, data = {}) {
  return template.replace(/\{\{\w+\}\}/g, (match) => {
    const key = match.replace(/[{}]/g, "");
    const variable = data[key];
    const variableType = getTypeOf(variable);
    if (variableType === OBJECT_TYPE || variableType === ARRAY_TYPE) {
      return JSON.stringify(variable);
    }
    return variable;
  });
}
function __(keyword, data, fallback = keyword) {
  var _a2;
  const template = (_a2 = strings[keyword]) !== null && _a2 !== void 0 ? _a2 : fallback;
  return render(template, data);
}
function dashCase(text) {
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
function createError(name, data) {
  return {
    type: "error",
    name,
    code: dashCase(name),
    message: __(name, data),
    data
  };
}
function createCustomError(name) {
  return createError.bind(null, name);
}
function flattenArray(list, result = []) {
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (Array.isArray(item)) {
      flattenArray(item, result);
    } else {
      result.push(item);
    }
  }
  return result;
}
const settings = {
  DECLARATOR_ONEOF: "oneOfProperty",
  GET_TEMPLATE_RECURSION_LIMIT: 1,
  propertyBlacklist: ["_id"],
  templateDefaultOptions: {
    addOptionalProps: false,
    removeInvalidData: false,
    extendDefaults: true
  }
};
function createOneOfSchemaResult(schema, oneOfSchema, oneOfIndex) {
  const childSchema = { ...oneOfSchema };
  Object.defineProperty(childSchema, "getOneOfOrigin", {
    enumerable: false,
    value: () => ({
      index: oneOfIndex,
      schema
    })
  });
  return childSchema;
}
function isJsonError(error2) {
  return (error2 === null || error2 === void 0 ? void 0 : error2.type) === "error";
}
function isPromise(obj) {
  return obj instanceof Promise;
}
function errorOrPromise(error2) {
  return isJsonError(error2) || isPromise(error2);
}
function isObject$1(v) {
  return getTypeOf(v) === "object";
}
const { DECLARATOR_ONEOF } = settings;
function resolveOneOf(node, data) {
  const { schema, draft, pointer } = node;
  if (data != null && schema[DECLARATOR_ONEOF]) {
    const errors3 = [];
    const oneOfProperty = schema[DECLARATOR_ONEOF];
    const oneOfValue = data[schema[DECLARATOR_ONEOF]];
    if (oneOfValue === void 0) {
      return draft.errors.missingOneOfPropertyError({
        property: oneOfProperty,
        pointer,
        schema,
        value: data
      });
    }
    for (let i = 0; i < schema.oneOf.length; i += 1) {
      const oneNode = node.next(schema.oneOf[i]).resolveRef();
      const resultNode = draft.step(oneNode, oneOfProperty, data);
      if (isJsonError(resultNode)) {
        return resultNode;
      }
      let result = flattenArray(draft.validate(resultNode, oneOfValue));
      result = result.filter(errorOrPromise);
      if (result.length > 0) {
        errors3.push(...result);
      } else {
        const nextSchema = createOneOfSchemaResult(schema, oneNode.schema, i);
        return resultNode.next(nextSchema);
      }
    }
    return draft.errors.oneOfPropertyError({
      property: oneOfProperty,
      value: oneOfValue,
      pointer,
      schema,
      errors: errors3
    });
  }
  const matches = [];
  const errors2 = [];
  for (let i = 0; i < schema.oneOf.length; i += 1) {
    const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
    let result = flattenArray(draft.validate(oneNode, data));
    result = result.filter(errorOrPromise);
    if (result.length > 0) {
      errors2.push(...result);
    } else {
      matches.push({ index: i, schema: oneNode.schema });
    }
  }
  if (matches.length === 1) {
    const nextSchema = createOneOfSchemaResult(schema, matches[0].schema, matches[0].index);
    return node.next(nextSchema);
  }
  if (matches.length > 1) {
    return draft.errors.multipleOneOfError({
      value: data,
      pointer,
      schema,
      matches
    });
  }
  return draft.errors.oneOfError({
    value: JSON.stringify(data),
    pointer,
    schema,
    oneOf: schema.oneOf,
    errors: errors2
  });
}
function fuzzyObjectValue(node, data) {
  const { draft, schema, pointer } = node;
  if (data == null || schema.properties == null) {
    return -1;
  }
  let value = 0;
  const keys = Object.keys(schema.properties);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (data[key]) {
      if (draft.isValid(data[key], schema.properties[key], pointer)) {
        value += 1;
      }
    }
  }
  return value;
}
function resolveOneOfFuzzy(node, data) {
  const { schema, pointer, draft } = node;
  if (!Array.isArray(schema.oneOf)) {
    throw new Error("not a oneof schema");
  }
  if (data != null && schema[DECLARATOR_ONEOF]) {
    const errors2 = [];
    const oneOfProperty = schema[DECLARATOR_ONEOF];
    const oneOfValue = data[schema[DECLARATOR_ONEOF]];
    if (oneOfValue === void 0) {
      return draft.errors.missingOneOfPropertyError({
        property: oneOfProperty,
        pointer,
        schema,
        value: data
      });
    }
    for (let i = 0; i < schema.oneOf.length; i += 1) {
      const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
      const resultNode = draft.step(oneNode, oneOfProperty, data);
      if (isJsonError(resultNode)) {
        return resultNode;
      }
      let result = flattenArray(draft.validate(resultNode, oneOfValue));
      result = result.filter(errorOrPromise);
      if (result.length > 0) {
        errors2.push(...result);
      } else {
        const nextSchema = createOneOfSchemaResult(schema, oneNode.schema, i);
        return resultNode.next(nextSchema);
      }
    }
    return draft.errors.oneOfPropertyError({
      property: oneOfProperty,
      value: oneOfValue,
      pointer,
      schema,
      errors: errors2
    });
  }
  const matches = [];
  for (let i = 0; i < schema.oneOf.length; i += 1) {
    const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
    const one = oneNode.schema;
    if (draft.isValid(data, one, pointer)) {
      matches.push({ schema: one, index: i });
    }
  }
  if (matches.length === 1) {
    const nextSchema = createOneOfSchemaResult(schema, matches[0].schema, matches[0].index);
    return node.next(nextSchema);
  }
  if (isObject$1(data)) {
    let schemaOfItem;
    let schemaOfIndex = -1;
    let fuzzyGreatest = 0;
    for (let i = 0; i < schema.oneOf.length; i += 1) {
      const oneNode = draft.resolveRef(node.next(schema.oneOf[i]));
      const fuzzyValue = fuzzyObjectValue(oneNode, data);
      if (fuzzyGreatest < fuzzyValue) {
        fuzzyGreatest = fuzzyValue;
        schemaOfItem = oneNode.schema;
        schemaOfIndex = i;
      }
    }
    if (schemaOfItem === void 0) {
      return draft.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf
      });
    }
    const nextSchema = createOneOfSchemaResult(schema, schemaOfItem, schemaOfIndex);
    return node.next(nextSchema);
  }
  if (matches.length > 1) {
    return draft.errors.multipleOneOfError({ matches, pointer, schema, value: data });
  }
  return draft.errors.oneOfError({
    value: JSON.stringify(data),
    pointer,
    schema,
    oneOf: schema.oneOf
  });
}
const validateOneOf = (node, value) => {
  if (Array.isArray(node.schema.oneOf)) {
    const nodeOrError = node.draft.resolveOneOf(node, value);
    if (isJsonError(nodeOrError)) {
      return nodeOrError;
    }
  }
};
function mergeSchema(a, b, ...omit2) {
  var _a2;
  if ((b === null || b === void 0 ? void 0 : b.type) === "error") {
    return b;
  } else if ((a === null || a === void 0 ? void 0 : a.type) === "error") {
    return a;
  }
  const aType = getTypeOf(a);
  const bType = getTypeOf(b);
  if (aType !== bType) {
    return a;
  }
  const schema = mergeSchema2(a, b);
  for (let i = 0; i < omit2.length; i += 1) {
    delete schema[omit2[i]];
  }
  if (!isObject$1(schema)) {
    return schema;
  }
  const originalOrigin = (_a2 = b.getOneOfOrigin) !== null && _a2 !== void 0 ? _a2 : a.getOneOfOrigin;
  if (originalOrigin) {
    Object.defineProperty(schema, "getOneOfOrigin", { enumerable: false, value: originalOrigin });
  }
  return schema;
}
function mergeSchema2(a, b, property) {
  var _a2;
  if (isObject$1(a) && isObject$1(b)) {
    const newObject = {};
    [...Object.keys(a), ...Object.keys(b)].filter((item, index2, array) => array.indexOf(item) === index2).forEach((key) => newObject[key] = mergeSchema2(a[key], b[key], key));
    return newObject;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (property === "required") {
      return a.concat(b).filter((item, index2, array) => array.indexOf(item) === index2);
    }
    if (property === "items") {
      const result2 = [];
      for (let i = 0; i < b.length; i += 1) {
        if (isObject$1(a[i]) && isObject$1(b[i]) && a[i].type === b[i].type) {
          result2[i] = mergeSchema2(a[i], b[i]);
        } else {
          result2.push((_a2 = b[i]) !== null && _a2 !== void 0 ? _a2 : a[i]);
        }
      }
      return result2;
    }
    const result = [];
    const append = [];
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if (isObject$1(a[i]) && isObject$1(b[i])) {
        result[i] = mergeSchema2(a[i], b[i]);
      } else {
        if (a[i] !== void 0 && b[i] !== void 0) {
          result[i] = a[i];
          append.push(b[i]);
        } else if (a[i] !== void 0) {
          result[i] = a[i];
        } else if (b[i] !== void 0) {
          append.push(b[i]);
        }
      }
    }
    return [...result, ...append].filter((item, index2, array) => array.indexOf(item) === index2);
  }
  if (Array.isArray(b)) {
    return b;
  }
  if (Array.isArray(a)) {
    return a;
  }
  if (b !== void 0) {
    return b;
  }
  return a;
}
function omit(object, ...keysToOmit) {
  const result = {};
  Object.keys(object).forEach((key) => {
    if (!keysToOmit.includes(key)) {
      result[key] = object[key];
    }
  });
  if (object.getOneOfOrigin) {
    Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: object.getOneOfOrigin });
  }
  return result;
}
function resolveIfSchema(node, data) {
  if (node.schema.if == null) {
    return void 0;
  }
  if (node.schema.if === false) {
    return node.next(node.schema.else);
  }
  if (node.schema.if && (node.schema.then || node.schema.else)) {
    const ifNode = node.draft.resolveRef(node.next(node.schema.if));
    const ifErrors = node.draft.validate(ifNode, data);
    if (ifErrors.length === 0 && node.schema.then) {
      const thenNode = node.next(node.schema.then);
      return node.draft.resolveRef(thenNode);
    }
    if (ifErrors.length !== 0 && node.schema.else) {
      const elseNode = node.next(node.schema.else);
      return node.draft.resolveRef(elseNode);
    }
  }
}
const validateIf = (node, value) => {
  const resolvedNode = resolveIfSchema(node, value);
  if (resolvedNode) {
    return node.draft.validate(resolvedNode, value);
  }
};
function shallowCloneSchemaNode(node) {
  const result = { ...node };
  Object.defineProperty(result, "getOneOfOrigin", { enumerable: false, value: node.getOneOfOrigin });
  return result;
}
function resolveSchema(node, data) {
  const ifSchema = resolveIfSchema(node, data);
  if (ifSchema) {
    return ifSchema;
  }
  const schema = shallowCloneSchemaNode(node.schema);
  return node.next(omit(schema, "if", "then", "else"));
}
function resolveAllOf(node, data) {
  const { schema } = node;
  let mergedSchema = shallowCloneSchemaNode(schema);
  for (let i = 0; i < schema.allOf.length; i += 1) {
    const allOfNode = node.next(schema.allOf[i]).resolveRef();
    const allOfSchema = resolveSchema(allOfNode, data).schema;
    mergedSchema = mergeSchema(mergedSchema, allOfSchema);
  }
  delete mergedSchema.allOf;
  return node.next(mergedSchema);
}
function mergeAllOfSchema(draft, schema) {
  const { allOf } = schema;
  if (!Array.isArray(allOf) || allOf.length === 0) {
    return;
  }
  let resolvedSchema = {};
  allOf.forEach((subschema) => {
    if (subschema == null) {
      return;
    }
    const subSchemaNode = draft.createNode(subschema).resolveRef();
    resolvedSchema = mergeSchema(resolvedSchema, subSchemaNode.schema);
  });
  return resolvedSchema;
}
const validateAllOf = (node, value) => {
  const { draft, schema } = node;
  const { allOf } = schema;
  if (!Array.isArray(allOf) || allOf.length === 0) {
    return;
  }
  const errors2 = [];
  schema.allOf.forEach((subSchema) => {
    errors2.push(...draft.validate(node.next(subSchema), value));
  });
  return errors2;
};
function merge$1(schema, ...omit2) {
  if (schema == null) {
    throw new Error(`undefined schema`);
  }
  const node = this;
  const mergedSchema = mergeSchema(node.schema, schema, ...omit2);
  return { ...node, schema: mergedSchema, path: [...node.path, node.schema] };
}
function resolveRef$2() {
  const node = this;
  return node.draft.resolveRef(node);
}
function next(schema, key) {
  if (isJsonError(schema)) {
    return schema;
  }
  if (schema == null) {
    throw new Error(`undefined schema`);
  }
  if (!isObject$1(schema) && getTypeOf(schema) !== "boolean") {
    throw new Error(`bad schema type ${getTypeOf(schema)}`);
  }
  const node = this;
  return {
    ...node,
    pointer: key ? `${node.pointer}/${key}` : node.pointer,
    schema,
    path: [...node.path, node.schema]
  };
}
function isSchemaNode(value) {
  return isObject$1(value) && value.next && value.path && value.draft;
}
function createNode(draft, schema, pointer = "#") {
  return { draft, pointer, schema, path: [], next, merge: merge$1, resolveRef: resolveRef$2 };
}
function resolveRecursiveRef(node) {
  const history = node.path;
  let startIndex = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].$id && /^https?:\/\//.test(history[i].$id) && history[i].$recursiveAnchor !== true) {
      startIndex = i;
      break;
    }
  }
  const firstAnchor = history.find((s, index2) => index2 >= startIndex && s.$recursiveAnchor === true);
  if (firstAnchor) {
    return node.next(firstAnchor);
  }
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].$id) {
      return node.next(history[i]);
    }
  }
  return node.next(node.draft.rootSchema);
}
function resolveRef$1(node) {
  if (!isSchemaNode(node)) {
    throw new Error("expected node");
  }
  if (node.schema == null) {
    return node;
  }
  if (node.schema.$recursiveRef) {
    return resolveRef$1(resolveRecursiveRef(node));
  }
  if (node.schema.$ref == null) {
    return node;
  }
  const resolvedSchema = node.draft.rootSchema.getRef(node.schema);
  if (resolvedSchema === false) {
    return node.next(resolvedSchema);
  }
  return node.merge(resolvedSchema, "$ref");
}
function uniqueItems(list) {
  return list.filter((item, index2) => list.indexOf(item) === index2);
}
function resolveDependencies(node, data) {
  var _a2;
  const { schema } = node;
  const dependencies = (_a2 = schema.dependencies) !== null && _a2 !== void 0 ? _a2 : schema.dependentSchemas;
  if (!isObject$1(dependencies) || !isObject$1(data)) {
    return;
  }
  let updated = false;
  let resolvedSchema = { required: [] };
  Object.keys(dependencies).forEach((prop) => {
    var _a3, _b;
    if (data[prop] == null && !(((_a3 = schema.required) === null || _a3 === void 0 ? void 0 : _a3.includes(prop)) || ((_b = resolvedSchema.required) === null || _b === void 0 ? void 0 : _b.includes(prop)))) {
      return;
    }
    const dependency = dependencies[prop];
    if (Array.isArray(dependency)) {
      updated = true;
      resolvedSchema.required.push(...dependency);
      return;
    }
    if (isObject$1(dependency)) {
      updated = true;
      const dNode = node.next(dependency).resolveRef();
      resolvedSchema = mergeSchema(resolvedSchema, dNode.schema);
      return;
    }
  });
  if (updated) {
    resolvedSchema.required = uniqueItems(resolvedSchema.required);
    return resolvedSchema;
  }
}
const validateDependentRequired = (node, value) => {
  const { draft, schema, pointer } = node;
  const dependentRequired = schema.dependentRequired;
  if (!isObject$1(dependentRequired)) {
    return void 0;
  }
  const errors2 = [];
  Object.keys(value).forEach((property) => {
    const dependencies = dependentRequired[property];
    if (dependencies === true) {
      return;
    }
    if (dependencies === false) {
      errors2.push(draft.errors.missingDependencyError({ pointer, schema, value }));
      return;
    }
    if (!Array.isArray(dependencies)) {
      return;
    }
    for (let i = 0, l = dependencies.length; i < l; i += 1) {
      if (value[dependencies[i]] === void 0) {
        errors2.push(draft.errors.missingDependencyError({ missingProperty: dependencies[i], pointer, schema, value }));
      }
    }
  });
  return errors2;
};
const validateDependentSchemas = (node, value) => {
  const { draft, schema, pointer } = node;
  const dependentSchemas = schema.dependentSchemas;
  if (!isObject$1(dependentSchemas)) {
    return void 0;
  }
  const errors2 = [];
  Object.keys(value).forEach((property) => {
    const dependencies = dependentSchemas[property];
    if (dependencies === true) {
      return;
    }
    if (dependencies === false) {
      errors2.push(draft.errors.missingDependencyError({ pointer, schema, value }));
      return;
    }
    if (!isObject$1(dependencies)) {
      return;
    }
    draft.validate(node.next(dependencies), value).map((error2) => errors2.push(error2));
  });
  return errors2;
};
const validateDependencies = (node, value) => {
  const { draft, schema, pointer } = node;
  const dependencies = schema.dependencies;
  if (!isObject$1(dependencies)) {
    return void 0;
  }
  const errors2 = [];
  Object.keys(value).forEach((property) => {
    if (dependencies[property] === void 0) {
      return;
    }
    if (dependencies[property] === true) {
      return;
    }
    if (dependencies[property] === false) {
      errors2.push(draft.errors.missingDependencyError({ pointer, schema, value }));
      return;
    }
    let dependencyErrors;
    const type = getTypeOf(dependencies[property]);
    const propertyValue = dependencies[property];
    if (Array.isArray(propertyValue)) {
      dependencyErrors = propertyValue.filter((dependency) => value[dependency] === void 0).map((missingProperty) => draft.errors.missingDependencyError({ missingProperty, pointer, schema, value }));
    } else if (type === "object") {
      dependencyErrors = draft.validate(node.next(dependencies[property]), value);
    } else {
      throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be string[] or schema`);
    }
    errors2.push(...dependencyErrors);
  });
  return errors2.length > 0 ? errors2 : void 0;
};
function mergeValidAnyOfSchema(node, data) {
  const { draft, schema } = node;
  if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
    return;
  }
  let resolvedSchema;
  schema.anyOf.forEach((anySchema) => {
    const anyNode = draft.resolveRef(node.next(anySchema));
    if (draft.validate(anyNode, data).length === 0) {
      resolvedSchema = resolvedSchema ? mergeSchema(resolvedSchema, anyNode.schema) : anyNode.schema;
    }
  });
  if (resolvedSchema) {
    return node.next(resolvedSchema);
  }
}
function resolveAnyOf(node, data) {
  const { anyOf } = node.schema;
  if (!Array.isArray(anyOf) || anyOf.length === 0) {
    return node;
  }
  const resolvedNode = mergeValidAnyOfSchema(node, data);
  if (resolvedNode) {
    const { pointer, schema } = node;
    return node.draft.errors.anyOfError({ pointer, schema, value: data, anyOf: JSON.stringify(anyOf) });
  }
  return node.merge(resolvedNode.schema, "anyOf");
}
const validateAnyOf = (node, value) => {
  const { draft, schema, pointer } = node;
  if (!Array.isArray(schema.anyOf) || schema.anyOf.length === 0) {
    return void 0;
  }
  for (let i = 0; i < schema.anyOf.length; i += 1) {
    const nextNode = draft.resolveRef(node.next(schema.anyOf[i]));
    if (draft.validate(nextNode, value).length === 0) {
      return void 0;
    }
  }
  return draft.errors.anyOfError({ pointer, schema, value, anyOf: schema.anyOf });
};
const toOmit$1 = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "anyOf", "oneOf", "dependencies", "if"];
function isDynamicSchema(schema) {
  const givenProps = Object.keys(schema);
  return dynamicProperties.findIndex((prop) => givenProps.includes(prop)) !== -1;
}
function resolveDynamicSchema(schemaNode, data) {
  let resolvedSchema;
  let error2;
  const node = schemaNode.draft.resolveRef(schemaNode);
  const { draft } = node;
  const schema = isSchemaNode(node) ? node.schema : node;
  if (schema.oneOf) {
    const oneOfSchema = resolveOneOfFuzzy(node, data);
    if (isJsonError(oneOfSchema)) {
      error2 = oneOfSchema;
    } else if (oneOfSchema) {
      resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, oneOfSchema.schema);
    }
  }
  if (Array.isArray(schema.allOf)) {
    const allOf = schema.allOf.map((s) => {
      if (isDynamicSchema(s)) {
        const result = resolveDynamicSchema(node.next(s), data);
        if (result == null || isJsonError(result)) {
          return result;
        }
        const finalSchema2 = mergeSchema(s, result.schema);
        return omit(finalSchema2, ...toOmit$1);
      }
      return s;
    });
    if (allOf.length > 0) {
      const allOfSchema = mergeAllOfSchema(draft, { allOf });
      resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, allOfSchema);
    }
  }
  const anyNode = mergeValidAnyOfSchema(node, data);
  if (anyNode && anyNode.schema) {
    resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, anyNode.schema);
  }
  const dependenciesSchema = resolveDependencies(node, data);
  if (dependenciesSchema) {
    resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, dependenciesSchema);
  }
  const ifNodeResolved = resolveIfSchema(node, data);
  if (isSchemaNode(ifNodeResolved)) {
    resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, ifNodeResolved.schema);
  }
  if (resolvedSchema == null) {
    return error2;
  }
  if (isJsonError(resolvedSchema)) {
    return resolvedSchema;
  }
  const nestedSchema = resolveDynamicSchema(node.next(resolvedSchema), data);
  if (isSchemaNode(nestedSchema)) {
    resolvedSchema = mergeSchema(resolvedSchema, nestedSchema.schema);
  }
  const finalSchema = omit(resolvedSchema, ...toOmit$1);
  return node.next(finalSchema);
}
const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];
function reduceSchema(node, data) {
  const resolvedSchema = resolveDynamicSchema(node, data);
  if (isSchemaNode(resolvedSchema)) {
    return node.merge(resolvedSchema.schema, ...toOmit);
  }
  if (resolvedSchema) {
    return resolvedSchema;
  }
  return node;
}
var toStringFunction = Function.prototype.toString;
var create = Object.create;
var toStringObject = Object.prototype.toString;
var LegacyCache = (
  /** @class */
  function() {
    function LegacyCache2() {
      this._keys = [];
      this._values = [];
    }
    LegacyCache2.prototype.has = function(key) {
      return !!~this._keys.indexOf(key);
    };
    LegacyCache2.prototype.get = function(key) {
      return this._values[this._keys.indexOf(key)];
    };
    LegacyCache2.prototype.set = function(key, value) {
      this._keys.push(key);
      this._values.push(value);
    };
    return LegacyCache2;
  }()
);
function createCacheLegacy() {
  return new LegacyCache();
}
function createCacheModern() {
  return /* @__PURE__ */ new WeakMap();
}
var createCache = typeof WeakMap !== "undefined" ? createCacheModern : createCacheLegacy;
function getCleanClone(prototype) {
  if (!prototype) {
    return create(null);
  }
  var Constructor = prototype.constructor;
  if (Constructor === Object) {
    return prototype === Object.prototype ? {} : create(prototype);
  }
  if (Constructor && ~toStringFunction.call(Constructor).indexOf("[native code]")) {
    try {
      return new Constructor();
    } catch (_a2) {
    }
  }
  return create(prototype);
}
function getRegExpFlagsLegacy(regExp) {
  var flags = "";
  if (regExp.global) {
    flags += "g";
  }
  if (regExp.ignoreCase) {
    flags += "i";
  }
  if (regExp.multiline) {
    flags += "m";
  }
  if (regExp.unicode) {
    flags += "u";
  }
  if (regExp.sticky) {
    flags += "y";
  }
  return flags;
}
function getRegExpFlagsModern(regExp) {
  return regExp.flags;
}
var getRegExpFlags = /test/g.flags === "g" ? getRegExpFlagsModern : getRegExpFlagsLegacy;
function getTagLegacy(value) {
  var type = toStringObject.call(value);
  return type.substring(8, type.length - 1);
}
function getTagModern(value) {
  return value[Symbol.toStringTag] || getTagLegacy(value);
}
var getTag = typeof Symbol !== "undefined" ? getTagModern : getTagLegacy;
var defineProperty = Object.defineProperty, getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor, getOwnPropertyNames = Object.getOwnPropertyNames, getOwnPropertySymbols = Object.getOwnPropertySymbols;
var _a = Object.prototype, hasOwnProperty$1 = _a.hasOwnProperty, propertyIsEnumerable = _a.propertyIsEnumerable;
var SUPPORTS_SYMBOL = typeof getOwnPropertySymbols === "function";
function getStrictPropertiesModern(object) {
  return getOwnPropertyNames(object).concat(getOwnPropertySymbols(object));
}
var getStrictProperties = SUPPORTS_SYMBOL ? getStrictPropertiesModern : getOwnPropertyNames;
function copyOwnPropertiesStrict(value, clone, state) {
  var properties = getStrictProperties(value);
  for (var index2 = 0, length_1 = properties.length, property = void 0, descriptor = void 0; index2 < length_1; ++index2) {
    property = properties[index2];
    if (property === "callee" || property === "caller") {
      continue;
    }
    descriptor = getOwnPropertyDescriptor(value, property);
    if (!descriptor) {
      clone[property] = state.copier(value[property], state);
      continue;
    }
    if (!descriptor.get && !descriptor.set) {
      descriptor.value = state.copier(descriptor.value, state);
    }
    try {
      defineProperty(clone, property, descriptor);
    } catch (error2) {
      clone[property] = descriptor.value;
    }
  }
  return clone;
}
function copyArrayLoose(array, state) {
  var clone = new state.Constructor();
  state.cache.set(array, clone);
  for (var index2 = 0, length_2 = array.length; index2 < length_2; ++index2) {
    clone[index2] = state.copier(array[index2], state);
  }
  return clone;
}
function copyArrayStrict(array, state) {
  var clone = new state.Constructor();
  state.cache.set(array, clone);
  return copyOwnPropertiesStrict(array, clone, state);
}
function copyArrayBuffer(arrayBuffer, _state) {
  return arrayBuffer.slice(0);
}
function copyBlob(blob, _state) {
  return blob.slice(0, blob.size, blob.type);
}
function copyDataView(dataView, state) {
  return new state.Constructor(copyArrayBuffer(dataView.buffer));
}
function copyDate(date, state) {
  return new state.Constructor(date.getTime());
}
function copyMapLoose(map, state) {
  var clone = new state.Constructor();
  state.cache.set(map, clone);
  map.forEach(function(value, key) {
    clone.set(key, state.copier(value, state));
  });
  return clone;
}
function copyMapStrict(map, state) {
  return copyOwnPropertiesStrict(map, copyMapLoose(map, state), state);
}
function copyObjectLooseLegacy(object, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object, clone);
  for (var key in object) {
    if (hasOwnProperty$1.call(object, key)) {
      clone[key] = state.copier(object[key], state);
    }
  }
  return clone;
}
function copyObjectLooseModern(object, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object, clone);
  for (var key in object) {
    if (hasOwnProperty$1.call(object, key)) {
      clone[key] = state.copier(object[key], state);
    }
  }
  var symbols = getOwnPropertySymbols(object);
  for (var index2 = 0, length_3 = symbols.length, symbol = void 0; index2 < length_3; ++index2) {
    symbol = symbols[index2];
    if (propertyIsEnumerable.call(object, symbol)) {
      clone[symbol] = state.copier(object[symbol], state);
    }
  }
  return clone;
}
var copyObjectLoose = SUPPORTS_SYMBOL ? copyObjectLooseModern : copyObjectLooseLegacy;
function copyObjectStrict(object, state) {
  var clone = getCleanClone(state.prototype);
  state.cache.set(object, clone);
  return copyOwnPropertiesStrict(object, clone, state);
}
function copyPrimitiveWrapper(primitiveObject, state) {
  return new state.Constructor(primitiveObject.valueOf());
}
function copyRegExp(regExp, state) {
  var clone = new state.Constructor(regExp.source, getRegExpFlags(regExp));
  clone.lastIndex = regExp.lastIndex;
  return clone;
}
function copySelf(value, _state) {
  return value;
}
function copySetLoose(set, state) {
  var clone = new state.Constructor();
  state.cache.set(set, clone);
  set.forEach(function(value) {
    clone.add(state.copier(value, state));
  });
  return clone;
}
function copySetStrict(set, state) {
  return copyOwnPropertiesStrict(set, copySetLoose(set, state), state);
}
var isArray = Array.isArray;
var assign = Object.assign;
var getPrototypeOf = Object.getPrototypeOf || function(obj) {
  return obj.__proto__;
};
var DEFAULT_LOOSE_OPTIONS = {
  array: copyArrayLoose,
  arrayBuffer: copyArrayBuffer,
  blob: copyBlob,
  dataView: copyDataView,
  date: copyDate,
  error: copySelf,
  map: copyMapLoose,
  object: copyObjectLoose,
  regExp: copyRegExp,
  set: copySetLoose
};
var DEFAULT_STRICT_OPTIONS = assign({}, DEFAULT_LOOSE_OPTIONS, {
  array: copyArrayStrict,
  map: copyMapStrict,
  object: copyObjectStrict,
  set: copySetStrict
});
function getTagSpecificCopiers(options) {
  return {
    Arguments: options.object,
    Array: options.array,
    ArrayBuffer: options.arrayBuffer,
    Blob: options.blob,
    Boolean: copyPrimitiveWrapper,
    DataView: options.dataView,
    Date: options.date,
    Error: options.error,
    Float32Array: options.arrayBuffer,
    Float64Array: options.arrayBuffer,
    Int8Array: options.arrayBuffer,
    Int16Array: options.arrayBuffer,
    Int32Array: options.arrayBuffer,
    Map: options.map,
    Number: copyPrimitiveWrapper,
    Object: options.object,
    Promise: copySelf,
    RegExp: options.regExp,
    Set: options.set,
    String: copyPrimitiveWrapper,
    WeakMap: copySelf,
    WeakSet: copySelf,
    Uint8Array: options.arrayBuffer,
    Uint8ClampedArray: options.arrayBuffer,
    Uint16Array: options.arrayBuffer,
    Uint32Array: options.arrayBuffer,
    Uint64Array: options.arrayBuffer
  };
}
function createCopier(options) {
  var normalizedOptions = assign({}, DEFAULT_LOOSE_OPTIONS, options);
  var tagSpecificCopiers = getTagSpecificCopiers(normalizedOptions);
  var array = tagSpecificCopiers.Array, object = tagSpecificCopiers.Object;
  function copier(value, state) {
    state.prototype = state.Constructor = void 0;
    if (!value || typeof value !== "object") {
      return value;
    }
    if (state.cache.has(value)) {
      return state.cache.get(value);
    }
    state.prototype = getPrototypeOf(value);
    state.Constructor = state.prototype && state.prototype.constructor;
    if (!state.Constructor || state.Constructor === Object) {
      return object(value, state);
    }
    if (isArray(value)) {
      return array(value, state);
    }
    var tagSpecificCopier = tagSpecificCopiers[getTag(value)];
    if (tagSpecificCopier) {
      return tagSpecificCopier(value, state);
    }
    return typeof value.then === "function" ? value : object(value, state);
  }
  return function copy(value) {
    return copier(value, {
      Constructor: void 0,
      cache: createCache(),
      copier,
      prototype: void 0
    });
  };
}
function createStrictCopier(options) {
  return createCopier(assign({}, DEFAULT_STRICT_OPTIONS, options));
}
createStrictCopier({});
var index = createCopier({});
class Draft {
  constructor(config, schema) {
    this.remotes = {};
    this.errors = {};
    this.typeKeywords = {};
    this.validateKeyword = {};
    this.validateType = {};
    this.validateFormat = {};
    this.config = config;
    this.typeKeywords = index(config.typeKeywords);
    this.validateKeyword = Object.assign({}, config.validateKeyword);
    this.validateType = Object.assign({}, config.validateType);
    this.validateFormat = Object.assign({}, config.validateFormat);
    this.errors = Object.assign({}, config.errors);
    this.setSchema(schema);
  }
  get rootSchema() {
    return this.__rootSchema;
  }
  set rootSchema(rootSchema) {
    if (rootSchema == null) {
      return;
    }
    this.__rootSchema = this.config.compileSchema(this, rootSchema);
  }
  /**
   * register a json-schema to be referenced from another json-schema
   * @param url - base-url of json-schema (aka id)
   * @param schema - json-schema root
   */
  addRemoteSchema(url, schema) {
    this.config.addRemoteSchema(this, url, schema);
  }
  compileSchema(schema) {
    var _a2;
    return this.config.compileSchema(this, schema, (_a2 = this.rootSchema) !== null && _a2 !== void 0 ? _a2 : schema);
  }
  createSchemaOf(data) {
    return this.config.createSchemaOf(data);
  }
  /**
   * Iterates over data, retrieving its schema
   *
   * @param data - the data to iterate
   * @param callback - will be called with (schema, data, pointer) on each item
   * @param [schema] - the schema matching the data. Defaults to rootSchema
   * @param [pointer] - pointer to current data. Default to rootPointer
   */
  each(data, callback, schema, pointer) {
    const node = this.createNode(schema !== null && schema !== void 0 ? schema : this.rootSchema, pointer);
    return this.config.each(node, data, callback);
  }
  eachSchema(callback, schema = this.rootSchema) {
    return this.config.eachSchema(schema, callback);
  }
  getChildSchemaSelection(property, schema) {
    return this.config.getChildSchemaSelection(this, property, schema);
  }
  /**
   * Returns the json-schema of a data-json-pointer.
   *
   * To resolve dynamic schema where the type of json-schema is evaluated by
   * its value, a data object has to be passed in options.
   *
   * Per default this function will return `undefined` for valid properties that
   * do not have a defined schema. Use the option `withSchemaWarning: true` to
   * receive an error with `code: schema-warning` containing the location of its
   * last evaluated json-schema.
   *
   * Notes
   *      - uses draft.step to walk through data and schema
   *
   * @param draft
   * @param pointer - json pointer in data to get the json schema for
   * @param [options.data] - the data object, which includes the json pointers value. This is optional, as
   *    long as no oneOf, anyOf, etc statement is part of the pointers schema
   * @param [options.schema] - the json schema to iterate. Defaults to draft.rootSchema
   * @param [options.withSchemaWarning] - if true returns an error instead of `undefined` for valid properties missing a schema definition
   * @return resolved json-schema object of requested json-pointer location
   */
  getSchema(options) {
    const result = this.getSchemaNode(options);
    if (isSchemaNode(result)) {
      return result.schema;
    }
    return result;
  }
  getSchemaNode(options) {
    return this.config.getSchema(this, options);
  }
  /**
   * Create data object matching the given schema
   *
   * @param [data] - optional template data
   * @param [schema] - json schema, defaults to rootSchema
   * @return created template data
   */
  getTemplate(data, schema, opts = this.config.templateDefaultOptions) {
    return this.config.getTemplate(this, data, schema, opts);
  }
  isValid(data, schema, pointer) {
    return this.config.isValid(this, data, schema, pointer);
  }
  createNode(schema, pointer = "#") {
    return this.config.createNode(this, schema, pointer);
  }
  resolveAnyOf(node, data) {
    return this.config.resolveAnyOf(node, data);
  }
  resolveAllOf(node, data) {
    return this.config.resolveAllOf(node, data);
  }
  resolveRef(node) {
    return this.config.resolveRef(node);
  }
  resolveOneOf(node, data) {
    return this.config.resolveOneOf(node, data);
  }
  setSchema(schema) {
    this.rootSchema = schema;
  }
  /**
   * Returns the json-schema of the given object property or array item.
   * e.g. it steps by one key into the data
   *
   * This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
   * returns the correct schema.
   *
   * @param  node
   * @param  key       - property-name or array-index
   * @param  data      - parent of key
   * @return schema-node containing child schema or error if failed resolving key
   */
  step(node, key, data) {
    return this.config.step(node, key, data);
  }
  validate(data, schema = this.rootSchema, pointer) {
    if (isSchemaNode(data)) {
      const inputData = schema;
      const inuptNode = data;
      return this.config.validate(inuptNode, inputData);
    }
    if (isJsonError(data)) {
      return [data];
    }
    const node = this.createNode(schema, pointer);
    return this.config.validate(node, data);
  }
}
function eachProperty(property, schema, callback, pointer) {
  const target = schema[property];
  if (!isObject$1(target)) {
    return;
  }
  Object.keys(target).forEach((key) => {
    if (Array.isArray(target[key])) {
      return;
    }
    if (key === "$defs") {
      eachProperty("$defs", target[key], callback, `${pointer}/${property}/$defs`);
    } else {
      eachSchema(target[key], callback, `${pointer}/${property}/${key}`);
    }
  });
}
function eachItem(property, schema, callback, pointer) {
  const target = schema[property];
  if (!Array.isArray(target)) {
    return;
  }
  target.forEach((s, key) => eachSchema(s, callback, `${pointer}/${property}/${key}`));
}
function eachSchema(schema, callback, pointer = "") {
  if (schema === void 0) {
    return;
  }
  if (callback(schema, pointer) === true) {
    return;
  }
  if (!isObject$1(schema)) {
    return;
  }
  eachProperty("properties", schema, callback, pointer);
  eachProperty("patternProperties", schema, callback, pointer);
  eachSchema(schema.not, callback, `${pointer}/not`);
  eachSchema(schema.additionalProperties, callback, `${pointer}/additionalProperties`);
  eachProperty("dependencies", schema, callback, pointer);
  isObject$1(schema.items) && eachSchema(schema.items, callback, `${pointer}/items`);
  eachItem("items", schema, callback, pointer);
  eachSchema(schema.additionalItems, callback, `${pointer}/additionalItems`);
  eachItem("allOf", schema, callback, pointer);
  eachItem("anyOf", schema, callback, pointer);
  eachItem("oneOf", schema, callback, pointer);
  eachSchema(schema.if, callback, `${pointer}/if`);
  eachSchema(schema.then, callback, `${pointer}/then`);
  eachSchema(schema.else, callback, `${pointer}/else`);
  eachProperty("definitions", schema, callback, pointer);
  eachProperty("$defs", schema, callback, pointer);
}
const suffixes$3 = /(#)+$/;
const trailingHash = /#$/;
const startingHashAndSlash = /^[#/]+/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const trailingFragments = /\/[^/]*$/;
const idAndPointer = /#.*$/;
const isURN = /^urn:uuid:[0-9A-Fa-f]/;
function joinScope(previous, id) {
  if (previous == null && id == null) {
    return "#";
  }
  if (id == null) {
    return previous.replace(trailingHash, "");
  }
  if (isURN.test(id)) {
    return id;
  }
  if (previous == null || previous === "" || previous === "#") {
    return id.replace(trailingHash, "");
  }
  if (id[0] === "#") {
    return `${previous.replace(idAndPointer, "")}${id.replace(suffixes$3, "")}`;
  }
  if (isDomain.test(id)) {
    return id.replace(trailingHash, "");
  }
  if (isDomain.test(previous) && id.startsWith("/")) {
    return `${previous.replace(/(^[^:]+:\/\/[^/]+)(.*)/, "$1")}/${id.replace(startingHashAndSlash, "")}`;
  }
  return `${previous.replace(trailingFragments, "")}/${id.replace(startingHashAndSlash, "")}`;
}
var jsonPointer$1 = { exports: {} };
var jsonPointer = jsonPointer$1.exports;
var hasRequiredJsonPointer;
function requireJsonPointer() {
  if (hasRequiredJsonPointer) return jsonPointer$1.exports;
  hasRequiredJsonPointer = 1;
  (function(module, exports) {
    !function(e, t) {
      module.exports = t();
    }("undefined" != typeof self ? self : jsonPointer, () => (() => {
      var e = { d: (t2, n2) => {
        for (var r2 in n2) e.o(n2, r2) && !e.o(t2, r2) && Object.defineProperty(t2, r2, { enumerable: true, get: n2[r2] });
      }, o: (e2, t2) => Object.prototype.hasOwnProperty.call(e2, t2), r: (e2) => {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e2, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e2, "__esModule", { value: true });
      } }, t = {};
      function n(e2) {
        return "#" === e2 || "" === e2 || Array.isArray(e2) && 0 === e2.length || false;
      }
      e.r(t), e.d(t, { default: () => _, get: () => s, isRoot: () => n, join: () => P, remove: () => v, removeUndefinedItems: () => m, set: () => g, split: () => f, splitLast: () => O });
      const r = /~1/g, o = /~0/g, i = /(^#?\/?)/g;
      function l(e2) {
        return e2.replace(r, "/").replace(o, "~");
      }
      function u(e2) {
        return l(decodeURIComponent(e2));
      }
      function f(e2) {
        if (null == e2 || "string" != typeof e2 || n(e2)) return Array.isArray(e2) ? e2 : [];
        const t2 = e2.indexOf("#") >= 0 ? u : l, r2 = (e2 = e2.replace(i, "")).split("/");
        for (let e3 = 0, n2 = r2.length; e3 < n2; e3 += 1) r2[e3] = t2(r2[e3]);
        return r2;
      }
      function s(e2, t2, r2 = void 0) {
        if (null == t2 || null == e2) return r2;
        if (n(t2)) return e2;
        const o2 = c(e2, f(t2));
        return void 0 === o2 ? r2 : o2;
      }
      function c(e2, t2) {
        const n2 = t2.shift();
        if (void 0 !== e2) return void 0 !== n2 ? c(e2[n2], t2) : e2;
      }
      const p = /^\[.*\]$/, d = /^\[(.+)\]$/;
      function a(e2, t2) {
        return "__proto__" === e2 || "constructor" == e2 && t2.length > 0 && "prototype" == t2[0];
      }
      function g(e2, t2, n2) {
        if (null == t2) return e2;
        const r2 = f(t2);
        if (0 === r2.length) return e2;
        null == e2 && (e2 = p.test(r2[0]) ? [] : {});
        let o2, i2, l2 = e2;
        for (; r2.length > 1; ) o2 = r2.shift(), i2 = p.test(r2[0]), a(o2, r2) || (l2 = h(l2, o2, i2));
        return o2 = r2.pop(), y(l2, o2, n2), e2;
      }
      function y(e2, t2, n2) {
        let r2;
        const o2 = t2.match(d);
        "[]" === t2 && Array.isArray(e2) ? e2.push(n2) : o2 ? (r2 = o2.pop(), e2[r2] = n2) : e2[t2] = n2;
      }
      function h(e2, t2, n2) {
        if (null != e2[t2]) return e2[t2];
        const r2 = n2 ? [] : {};
        return y(e2, t2, r2), r2;
      }
      function m(e2) {
        let t2 = 0, n2 = 0;
        for (; t2 + n2 < e2.length; ) void 0 === e2[t2 + n2] && (n2 += 1), e2[t2] = e2[t2 + n2], t2 += 1;
        return e2.length = e2.length - n2, e2;
      }
      function v(e2, t2, n2) {
        const r2 = f(t2), o2 = r2.pop(), i2 = s(e2, r2);
        return i2 && delete i2[o2], Array.isArray(i2) && true !== n2 && m(i2), e2;
      }
      const j = /~/g, b = /\//g;
      function A(e2, t2) {
        if (0 === e2.length) return t2 ? "#" : "";
        for (let n2 = 0, r2 = e2.length; n2 < r2; n2 += 1) e2[n2] = e2[n2].replace(j, "~0").replace(b, "~1"), t2 && (e2[n2] = encodeURIComponent(e2[n2]));
        return (t2 ? "#/" : "/") + e2.join("/");
      }
      function P(e2, ...t2) {
        const n2 = [];
        if (Array.isArray(e2)) return A(e2, true === arguments[1]);
        const r2 = arguments[arguments.length - 1], o2 = "boolean" == typeof r2 ? r2 : e2 && "#" === e2[0];
        for (let e3 = 0, t3 = arguments.length; e3 < t3; e3 += 1) n2.push.apply(n2, f(arguments[e3]));
        const i2 = [];
        for (let e3 = 0, t3 = n2.length; e3 < t3; e3 += 1) if (".." === n2[e3]) {
          if (0 === i2.length) return o2 ? "#" : "";
          i2.pop();
        } else i2.push(n2[e3]);
        return A(i2, o2);
      }
      function O(e2) {
        const t2 = f(e2);
        if (0 === t2.length) return "string" == typeof e2 && "#" === e2[0] ? ["#", t2[0]] : ["", void 0];
        if (1 === t2.length) return "#" === e2[0] ? ["#", t2[0]] : ["", t2[0]];
        const n2 = t2.pop();
        return [P(t2, "#" === e2[0]), n2];
      }
      const _ = { get: s, set: g, remove: v, join: P, split: f, splitLast: O, isRoot: n, removeUndefinedItems: m };
      return t;
    })());
  })(jsonPointer$1);
  return jsonPointer$1.exports;
}
var jsonPointerExports = requireJsonPointer();
const gp = /* @__PURE__ */ getDefaultExportFromCjs(jsonPointerExports);
const suffixes$2 = /(#)+$/g;
const emptyValues = ["", null, "#"];
function splitRef($ref) {
  if (emptyValues.includes($ref)) {
    return [];
  }
  $ref = $ref.replace(suffixes$2, "");
  if ($ref.indexOf("#") === -1) {
    return [$ref.replace(/(#|\/)+$/g, "")];
  }
  if ($ref.indexOf("#") === 0) {
    return [$ref.replace(suffixes$2, "")];
  }
  const result = $ref.split("#");
  result[0] = result[0].replace(/(#|\/)+$/g, "");
  result[1] = `#${result[1].replace(suffixes$2, "")}`;
  return result;
}
const suffixes$1 = /(#)+$/g;
const isObject = (val) => getTypeOf(val) === "object";
function getRef(context, rootSchema, $search) {
  var _a2, _b, _c, _d, _e;
  let $ref;
  if (isObject($search)) {
    $ref = $search.__ref || $search.$ref;
  } else {
    $ref = $search;
  }
  if ($ref == null) {
    return rootSchema;
  }
  let schema;
  const $remote = $ref.replace(suffixes$1, "");
  if (context.remotes[$remote] != null) {
    schema = context.remotes[$remote];
    if (schema && schema.$ref) {
      return getRef(context, schema, schema);
    }
    return schema;
  }
  const $anchor = (_a2 = context.anchors) === null || _a2 === void 0 ? void 0 : _a2[$ref];
  if ($anchor) {
    return jsonPointerExports.get(rootSchema, $anchor);
  }
  if (context.ids[$ref] != null) {
    schema = jsonPointerExports.get(rootSchema, context.ids[$ref]);
    if (schema && schema.$ref) {
      return getRef(context, rootSchema, schema);
    }
    return schema;
  }
  const $inputRef = $ref;
  const fragments = splitRef($ref);
  if (fragments.length === 0) {
    return rootSchema;
  }
  if (fragments.length === 1) {
    $ref = fragments[0];
    if (context.remotes[$ref]) {
      schema = context.remotes[$ref];
      if (schema && schema.$ref) {
        return getRef(context, rootSchema, schema);
      }
    }
    if (context.ids[$ref]) {
      schema = jsonPointerExports.get(rootSchema, context.ids[$ref]);
      if (schema && schema.$ref) {
        return getRef(context, rootSchema, schema);
      }
      return schema;
    }
    const rootContextRef = (_b = rootSchema.getContext) === null || _b === void 0 ? void 0 : _b.call(rootSchema).ids[$ref];
    if (rootContextRef) {
      return getRef(context, rootSchema, rootContextRef);
    }
  }
  if (fragments.length === 2) {
    const base = fragments[0];
    $ref = fragments[1];
    const fromRemote = (_c = context.remotes[base]) !== null && _c !== void 0 ? _c : context.remotes[`${base}/`];
    if (fromRemote) {
      if (fromRemote.getContext && fromRemote.getContext().anchors[$inputRef] != null) {
        return fromRemote.getRef($inputRef);
      }
      if (fromRemote.getRef) {
        return fromRemote.getRef($ref);
      }
      return getRef(context, fromRemote, $ref);
    }
    const fromId = (_d = context.ids[base]) !== null && _d !== void 0 ? _d : context.ids[`${base}/`];
    if (fromId) {
      return getRef(context, jsonPointerExports.get(rootSchema, fromId), $ref);
    }
  }
  schema = jsonPointerExports.get(rootSchema, (_e = context.ids[$ref]) !== null && _e !== void 0 ? _e : $ref);
  if (schema && schema.$ref) {
    return getRef(context, rootSchema, schema);
  }
  return schema;
}
function createSchemaOf(data) {
  if (data === void 0) {
    return void 0;
  }
  const schema = {
    type: getTypeOf(data)
  };
  if (schema.type === "object" && isObject$1(data)) {
    schema.properties = {};
    Object.keys(data).forEach((key) => schema.properties[key] = createSchemaOf(data[key]));
  }
  if (schema.type === "array" && Array.isArray(data)) {
    if (data.length === 1) {
      schema.items = createSchemaOf(data[0]);
    } else {
      schema.items = data.map(createSchemaOf);
    }
  }
  return schema;
}
const errors = {
  additionalItemsError: createCustomError("AdditionalItemsError"),
  additionalPropertiesError: createCustomError("AdditionalPropertiesError"),
  anyOfError: createCustomError("AnyOfError"),
  allOfError: createCustomError("AllOfError"),
  constError: createCustomError("ConstError"),
  containsError: createCustomError("ContainsError"),
  containsMaxError: createCustomError("ContainsMaxError"),
  containsMinError: createCustomError("ContainsMinError"),
  containsArrayError: createCustomError("ContainsArrayError"),
  containsAnyError: createCustomError("ContainsAnyError"),
  enumError: createCustomError("EnumError"),
  forbiddenPropertyError: createCustomError("ForbiddenPropertyError"),
  formatURLError: createCustomError("FormatURLError"),
  formatURIError: createCustomError("FormatURIError"),
  formatURIReferenceError: createCustomError("FormatURIReferenceError"),
  formatURITemplateError: createCustomError("FormatURITemplateError"),
  formatDateError: createCustomError("FormatDateError"),
  formatDateTimeError: createCustomError("FormatDateTimeError"),
  formatDurationError: createCustomError("FormatDurationError"),
  formatEmailError: createCustomError("FormatEmailError"),
  formatHostnameError: createCustomError("FormatHostnameError"),
  formatIPV4Error: createCustomError("FormatIPV4Error"),
  formatIPV4LeadingZeroError: createCustomError("FormatIPV4LeadingZeroError"),
  formatIPV6Error: createCustomError("FormatIPV6Error"),
  formatIPV6LeadingZeroError: createCustomError("FormatIPV6LeadingZeroError"),
  formatJsonPointerError: createCustomError("FormatJsonPointerError"),
  formatRegExError: createCustomError("FormatRegExError"),
  formatTimeError: createCustomError("FormatTimeError"),
  invalidSchemaError: createCustomError("InvalidSchemaError"),
  invalidDataError: createCustomError("InvalidDataError"),
  invalidTypeError: createCustomError("InvalidTypeError"),
  invalidPropertyNameError: createCustomError("InvalidPropertyNameError"),
  maximumError: createCustomError("MaximumError"),
  maxItemsError: createCustomError("MaxItemsError"),
  maxLengthError: createCustomError("MaxLengthError"),
  maxPropertiesError: createCustomError("MaxPropertiesError"),
  minimumError: createCustomError("MinimumError"),
  minItemsError: createCustomError("MinItemsError"),
  minItemsOneError: createCustomError("MinItemsOneError"),
  minLengthError: createCustomError("MinLengthError"),
  minLengthOneError: createCustomError("MinLengthOneError"),
  minPropertiesError: createCustomError("MinPropertiesError"),
  missingDependencyError: createCustomError("MissingDependencyError"),
  missingOneOfPropertyError: createCustomError("MissingOneOfPropertyError"),
  multipleOfError: createCustomError("MultipleOfError"),
  multipleOneOfError: createCustomError("MultipleOneOfError"),
  noAdditionalPropertiesError: createCustomError("NoAdditionalPropertiesError"),
  notError: createCustomError("NotError"),
  oneOfError: createCustomError("OneOfError"),
  oneOfPropertyError: createCustomError("OneOfPropertyError"),
  patternError: createCustomError("PatternError"),
  patternPropertiesError: createCustomError("PatternPropertiesError"),
  requiredPropertyError: createCustomError("RequiredPropertyError"),
  schemaWarning: createCustomError("SchemaWarning"),
  typeError: createCustomError("TypeError"),
  undefinedValueError: createCustomError("UndefinedValueError"),
  unevaluatedPropertyError: createCustomError("UnevaluatedPropertyError"),
  unevaluatedItemsError: createCustomError("UnevaluatedItemsError"),
  uniqueItemsError: createCustomError("UniqueItemsError"),
  unknownPropertyError: createCustomError("UnknownPropertyError"),
  valueNotEmptyError: createCustomError("ValueNotEmptyError")
};
var validUrl$1 = { exports: {} };
var hasRequiredValidUrl;
function requireValidUrl() {
  if (hasRequiredValidUrl) return validUrl$1.exports;
  hasRequiredValidUrl = 1;
  (function(module) {
    (function(module2) {
      module2.exports.is_uri = is_iri;
      module2.exports.is_http_uri = is_http_iri;
      module2.exports.is_https_uri = is_https_iri;
      module2.exports.is_web_uri = is_web_iri;
      module2.exports.isUri = is_iri;
      module2.exports.isHttpUri = is_http_iri;
      module2.exports.isHttpsUri = is_https_iri;
      module2.exports.isWebUri = is_web_iri;
      var splitUri = function(uri) {
        var splitted = uri.match(/(?:([^:\/?#]+):)?(?:\/\/([^\/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?/);
        return splitted;
      };
      function is_iri(value) {
        if (!value) {
          return;
        }
        if (/[^a-z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\.\-\_\~\%]/i.test(value)) return;
        if (/%[^0-9a-f]/i.test(value)) return;
        if (/%[0-9a-f](:?[^0-9a-f]|$)/i.test(value)) return;
        var splitted = [];
        var scheme = "";
        var authority = "";
        var path = "";
        var query = "";
        var fragment = "";
        var out = "";
        splitted = splitUri(value);
        scheme = splitted[1];
        authority = splitted[2];
        path = splitted[3];
        query = splitted[4];
        fragment = splitted[5];
        if (!(scheme && scheme.length && path.length >= 0)) return;
        if (authority && authority.length) {
          if (!(path.length === 0 || /^\//.test(path))) return;
        } else {
          if (/^\/\//.test(path)) return;
        }
        if (!/^[a-z][a-z0-9\+\-\.]*$/.test(scheme.toLowerCase())) return;
        out += scheme + ":";
        if (authority && authority.length) {
          out += "//" + authority;
        }
        out += path;
        if (query && query.length) {
          out += "?" + query;
        }
        if (fragment && fragment.length) {
          out += "#" + fragment;
        }
        return out;
      }
      function is_http_iri(value, allowHttps) {
        if (!is_iri(value)) {
          return;
        }
        var splitted = [];
        var scheme = "";
        var authority = "";
        var path = "";
        var port = "";
        var query = "";
        var fragment = "";
        var out = "";
        splitted = splitUri(value);
        scheme = splitted[1];
        authority = splitted[2];
        path = splitted[3];
        query = splitted[4];
        fragment = splitted[5];
        if (!scheme) return;
        if (allowHttps) {
          if (scheme.toLowerCase() != "https") return;
        } else {
          if (scheme.toLowerCase() != "http") return;
        }
        if (!authority) {
          return;
        }
        if (/:(\d+)$/.test(authority)) {
          port = authority.match(/:(\d+)$/)[0];
          authority = authority.replace(/:\d+$/, "");
        }
        out += scheme + ":";
        out += "//" + authority;
        if (port) {
          out += port;
        }
        out += path;
        if (query && query.length) {
          out += "?" + query;
        }
        if (fragment && fragment.length) {
          out += "#" + fragment;
        }
        return out;
      }
      function is_https_iri(value) {
        return is_http_iri(value, true);
      }
      function is_web_iri(value) {
        return is_http_iri(value) || is_https_iri(value);
      }
    })(module);
  })(validUrl$1);
  return validUrl$1.exports;
}
var validUrlExports = requireValidUrl();
const validUrl = /* @__PURE__ */ getDefaultExportFromCjs(validUrlExports);
var lib = {};
var nearley$1 = { exports: {} };
var nearley = nearley$1.exports;
var hasRequiredNearley;
function requireNearley() {
  if (hasRequiredNearley) return nearley$1.exports;
  hasRequiredNearley = 1;
  (function(module) {
    (function(root, factory) {
      if (module.exports) {
        module.exports = factory();
      } else {
        root.nearley = factory();
      }
    })(nearley, function() {
      function Rule(name, symbols, postprocess) {
        this.id = ++Rule.highestId;
        this.name = name;
        this.symbols = symbols;
        this.postprocess = postprocess;
        return this;
      }
      Rule.highestId = 0;
      Rule.prototype.toString = function(withCursorAt) {
        var symbolSequence = typeof withCursorAt === "undefined" ? this.symbols.map(getSymbolShortDisplay).join(" ") : this.symbols.slice(0, withCursorAt).map(getSymbolShortDisplay).join(" ") + " ● " + this.symbols.slice(withCursorAt).map(getSymbolShortDisplay).join(" ");
        return this.name + " → " + symbolSequence;
      };
      function State(rule, dot, reference, wantedBy) {
        this.rule = rule;
        this.dot = dot;
        this.reference = reference;
        this.data = [];
        this.wantedBy = wantedBy;
        this.isComplete = this.dot === rule.symbols.length;
      }
      State.prototype.toString = function() {
        return "{" + this.rule.toString(this.dot) + "}, from: " + (this.reference || 0);
      };
      State.prototype.nextState = function(child) {
        var state = new State(this.rule, this.dot + 1, this.reference, this.wantedBy);
        state.left = this;
        state.right = child;
        if (state.isComplete) {
          state.data = state.build();
          state.right = void 0;
        }
        return state;
      };
      State.prototype.build = function() {
        var children = [];
        var node = this;
        do {
          children.push(node.right.data);
          node = node.left;
        } while (node.left);
        children.reverse();
        return children;
      };
      State.prototype.finish = function() {
        if (this.rule.postprocess) {
          this.data = this.rule.postprocess(this.data, this.reference, Parser.fail);
        }
      };
      function Column(grammar2, index2) {
        this.grammar = grammar2;
        this.index = index2;
        this.states = [];
        this.wants = {};
        this.scannable = [];
        this.completed = {};
      }
      Column.prototype.process = function(nextColumn) {
        var states = this.states;
        var wants = this.wants;
        var completed = this.completed;
        for (var w = 0; w < states.length; w++) {
          var state = states[w];
          if (state.isComplete) {
            state.finish();
            if (state.data !== Parser.fail) {
              var wantedBy = state.wantedBy;
              for (var i = wantedBy.length; i--; ) {
                var left = wantedBy[i];
                this.complete(left, state);
              }
              if (state.reference === this.index) {
                var exp = state.rule.name;
                (this.completed[exp] = this.completed[exp] || []).push(state);
              }
            }
          } else {
            var exp = state.rule.symbols[state.dot];
            if (typeof exp !== "string") {
              this.scannable.push(state);
              continue;
            }
            if (wants[exp]) {
              wants[exp].push(state);
              if (completed.hasOwnProperty(exp)) {
                var nulls = completed[exp];
                for (var i = 0; i < nulls.length; i++) {
                  var right = nulls[i];
                  this.complete(state, right);
                }
              }
            } else {
              wants[exp] = [state];
              this.predict(exp);
            }
          }
        }
      };
      Column.prototype.predict = function(exp) {
        var rules = this.grammar.byName[exp] || [];
        for (var i = 0; i < rules.length; i++) {
          var r = rules[i];
          var wantedBy = this.wants[exp];
          var s = new State(r, 0, this.index, wantedBy);
          this.states.push(s);
        }
      };
      Column.prototype.complete = function(left, right) {
        var copy = left.nextState(right);
        this.states.push(copy);
      };
      function Grammar(rules, start) {
        this.rules = rules;
        this.start = start || this.rules[0].name;
        var byName = this.byName = {};
        this.rules.forEach(function(rule) {
          if (!byName.hasOwnProperty(rule.name)) {
            byName[rule.name] = [];
          }
          byName[rule.name].push(rule);
        });
      }
      Grammar.fromCompiled = function(rules, start) {
        var lexer = rules.Lexer;
        if (rules.ParserStart) {
          start = rules.ParserStart;
          rules = rules.ParserRules;
        }
        var rules = rules.map(function(r) {
          return new Rule(r.name, r.symbols, r.postprocess);
        });
        var g = new Grammar(rules, start);
        g.lexer = lexer;
        return g;
      };
      function StreamLexer() {
        this.reset("");
      }
      StreamLexer.prototype.reset = function(data, state) {
        this.buffer = data;
        this.index = 0;
        this.line = state ? state.line : 1;
        this.lastLineBreak = state ? -state.col : 0;
      };
      StreamLexer.prototype.next = function() {
        if (this.index < this.buffer.length) {
          var ch = this.buffer[this.index++];
          if (ch === "\n") {
            this.line += 1;
            this.lastLineBreak = this.index;
          }
          return { value: ch };
        }
      };
      StreamLexer.prototype.save = function() {
        return {
          line: this.line,
          col: this.index - this.lastLineBreak
        };
      };
      StreamLexer.prototype.formatError = function(token, message) {
        var buffer = this.buffer;
        if (typeof buffer === "string") {
          var lines = buffer.split("\n").slice(
            Math.max(0, this.line - 5),
            this.line
          );
          var nextLineBreak = buffer.indexOf("\n", this.index);
          if (nextLineBreak === -1) nextLineBreak = buffer.length;
          var col = this.index - this.lastLineBreak;
          var lastLineDigits = String(this.line).length;
          message += " at line " + this.line + " col " + col + ":\n\n";
          message += lines.map(function(line, i) {
            return pad(this.line - lines.length + i + 1, lastLineDigits) + " " + line;
          }, this).join("\n");
          message += "\n" + pad("", lastLineDigits + col) + "^\n";
          return message;
        } else {
          return message + " at index " + (this.index - 1);
        }
        function pad(n, length) {
          var s = String(n);
          return Array(length - s.length + 1).join(" ") + s;
        }
      };
      function Parser(rules, start, options) {
        if (rules instanceof Grammar) {
          var grammar2 = rules;
          var options = start;
        } else {
          var grammar2 = Grammar.fromCompiled(rules, start);
        }
        this.grammar = grammar2;
        this.options = {
          keepHistory: false,
          lexer: grammar2.lexer || new StreamLexer()
        };
        for (var key in options || {}) {
          this.options[key] = options[key];
        }
        this.lexer = this.options.lexer;
        this.lexerState = void 0;
        var column = new Column(grammar2, 0);
        this.table = [column];
        column.wants[grammar2.start] = [];
        column.predict(grammar2.start);
        column.process();
        this.current = 0;
      }
      Parser.fail = {};
      Parser.prototype.feed = function(chunk) {
        var lexer = this.lexer;
        lexer.reset(chunk, this.lexerState);
        var token;
        while (true) {
          try {
            token = lexer.next();
            if (!token) {
              break;
            }
          } catch (e) {
            var nextColumn = new Column(this.grammar, this.current + 1);
            this.table.push(nextColumn);
            var err = new Error(this.reportLexerError(e));
            err.offset = this.current;
            err.token = e.token;
            throw err;
          }
          var column = this.table[this.current];
          if (!this.options.keepHistory) {
            delete this.table[this.current - 1];
          }
          var n = this.current + 1;
          var nextColumn = new Column(this.grammar, n);
          this.table.push(nextColumn);
          var literal = token.text !== void 0 ? token.text : token.value;
          var value = lexer.constructor === StreamLexer ? token.value : token;
          var scannable = column.scannable;
          for (var w = scannable.length; w--; ) {
            var state = scannable[w];
            var expect = state.rule.symbols[state.dot];
            if (expect.test ? expect.test(value) : expect.type ? expect.type === token.type : expect.literal === literal) {
              var next2 = state.nextState({ data: value, token, isToken: true, reference: n - 1 });
              nextColumn.states.push(next2);
            }
          }
          nextColumn.process();
          if (nextColumn.states.length === 0) {
            var err = new Error(this.reportError(token));
            err.offset = this.current;
            err.token = token;
            throw err;
          }
          if (this.options.keepHistory) {
            column.lexerState = lexer.save();
          }
          this.current++;
        }
        if (column) {
          this.lexerState = lexer.save();
        }
        this.results = this.finish();
        return this;
      };
      Parser.prototype.reportLexerError = function(lexerError) {
        var tokenDisplay, lexerMessage;
        var token = lexerError.token;
        if (token) {
          tokenDisplay = "input " + JSON.stringify(token.text[0]) + " (lexer error)";
          lexerMessage = this.lexer.formatError(token, "Syntax error");
        } else {
          tokenDisplay = "input (lexer error)";
          lexerMessage = lexerError.message;
        }
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
      };
      Parser.prototype.reportError = function(token) {
        var tokenDisplay = (token.type ? token.type + " token: " : "") + JSON.stringify(token.value !== void 0 ? token.value : token);
        var lexerMessage = this.lexer.formatError(token, "Syntax error");
        return this.reportErrorCommon(lexerMessage, tokenDisplay);
      };
      Parser.prototype.reportErrorCommon = function(lexerMessage, tokenDisplay) {
        var lines = [];
        lines.push(lexerMessage);
        var lastColumnIndex = this.table.length - 2;
        var lastColumn = this.table[lastColumnIndex];
        var expectantStates = lastColumn.states.filter(function(state) {
          var nextSymbol = state.rule.symbols[state.dot];
          return nextSymbol && typeof nextSymbol !== "string";
        });
        if (expectantStates.length === 0) {
          lines.push("Unexpected " + tokenDisplay + ". I did not expect any more input. Here is the state of my parse table:\n");
          this.displayStateStack(lastColumn.states, lines);
        } else {
          lines.push("Unexpected " + tokenDisplay + ". Instead, I was expecting to see one of the following:\n");
          var stateStacks = expectantStates.map(function(state) {
            return this.buildFirstStateStack(state, []) || [state];
          }, this);
          stateStacks.forEach(function(stateStack) {
            var state = stateStack[0];
            var nextSymbol = state.rule.symbols[state.dot];
            var symbolDisplay = this.getSymbolDisplay(nextSymbol);
            lines.push("A " + symbolDisplay + " based on:");
            this.displayStateStack(stateStack, lines);
          }, this);
        }
        lines.push("");
        return lines.join("\n");
      };
      Parser.prototype.displayStateStack = function(stateStack, lines) {
        var lastDisplay;
        var sameDisplayCount = 0;
        for (var j = 0; j < stateStack.length; j++) {
          var state = stateStack[j];
          var display = state.rule.toString(state.dot);
          if (display === lastDisplay) {
            sameDisplayCount++;
          } else {
            if (sameDisplayCount > 0) {
              lines.push("    ^ " + sameDisplayCount + " more lines identical to this");
            }
            sameDisplayCount = 0;
            lines.push("    " + display);
          }
          lastDisplay = display;
        }
      };
      Parser.prototype.getSymbolDisplay = function(symbol) {
        return getSymbolLongDisplay(symbol);
      };
      Parser.prototype.buildFirstStateStack = function(state, visited) {
        if (visited.indexOf(state) !== -1) {
          return null;
        }
        if (state.wantedBy.length === 0) {
          return [state];
        }
        var prevState = state.wantedBy[0];
        var childVisited = [state].concat(visited);
        var childResult = this.buildFirstStateStack(prevState, childVisited);
        if (childResult === null) {
          return null;
        }
        return [state].concat(childResult);
      };
      Parser.prototype.save = function() {
        var column = this.table[this.current];
        column.lexerState = this.lexerState;
        return column;
      };
      Parser.prototype.restore = function(column) {
        var index2 = column.index;
        this.current = index2;
        this.table[index2] = column;
        this.table.splice(index2 + 1);
        this.lexerState = column.lexerState;
        this.results = this.finish();
      };
      Parser.prototype.rewind = function(index2) {
        if (!this.options.keepHistory) {
          throw new Error("set option `keepHistory` to enable rewinding");
        }
        this.restore(this.table[index2]);
      };
      Parser.prototype.finish = function() {
        var considerations = [];
        var start = this.grammar.start;
        var column = this.table[this.table.length - 1];
        column.states.forEach(function(t) {
          if (t.rule.name === start && t.dot === t.rule.symbols.length && t.reference === 0 && t.data !== Parser.fail) {
            considerations.push(t);
          }
        });
        return considerations.map(function(c) {
          return c.data;
        });
      };
      function getSymbolLongDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
          return symbol;
        } else if (type === "object") {
          if (symbol.literal) {
            return JSON.stringify(symbol.literal);
          } else if (symbol instanceof RegExp) {
            return "character matching " + symbol;
          } else if (symbol.type) {
            return symbol.type + " token";
          } else if (symbol.test) {
            return "token matching " + String(symbol.test);
          } else {
            throw new Error("Unknown symbol type: " + symbol);
          }
        }
      }
      function getSymbolShortDisplay(symbol) {
        var type = typeof symbol;
        if (type === "string") {
          return symbol;
        } else if (type === "object") {
          if (symbol.literal) {
            return JSON.stringify(symbol.literal);
          } else if (symbol instanceof RegExp) {
            return symbol.toString();
          } else if (symbol.type) {
            return "%" + symbol.type;
          } else if (symbol.test) {
            return "<" + String(symbol.test) + ">";
          } else {
            throw new Error("Unknown symbol type: " + symbol);
          }
        }
      }
      return {
        Parser,
        Grammar,
        Rule
      };
    });
  })(nearley$1);
  return nearley$1.exports;
}
var grammar = {};
var hasRequiredGrammar;
function requireGrammar() {
  if (hasRequiredGrammar) return grammar;
  hasRequiredGrammar = 1;
  Object.defineProperty(grammar, "__esModule", { value: true });
  function id(d) {
    return d[0];
  }
  const deepFlatten = (arr) => [].concat(...arr.map((v) => Array.isArray(v) ? deepFlatten(v) : v));
  function flat_string(d) {
    if (d) {
      if (Array.isArray(d))
        return deepFlatten(d).join("");
      return d;
    }
    return "";
  }
  const grammar$1 = {
    Lexer: void 0,
    ParserRules: [
      { "name": "Reverse_path", "symbols": ["Path"] },
      { "name": "Reverse_path$string$1", "symbols": [{ "literal": "<" }, { "literal": ">" }], "postprocess": (d) => d.join("") },
      { "name": "Reverse_path", "symbols": ["Reverse_path$string$1"] },
      { "name": "Forward_path$subexpression$1$subexpression$1", "symbols": [{ "literal": "<" }, /[pP]/, /[oO]/, /[sS]/, /[tT]/, /[mM]/, /[aA]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/, { "literal": "@" }], "postprocess": function(d) {
        return d.join("");
      } },
      { "name": "Forward_path$subexpression$1", "symbols": ["Forward_path$subexpression$1$subexpression$1", "Domain", { "literal": ">" }] },
      { "name": "Forward_path", "symbols": ["Forward_path$subexpression$1"] },
      { "name": "Forward_path$subexpression$2", "symbols": [{ "literal": "<" }, /[pP]/, /[oO]/, /[sS]/, /[tT]/, /[mM]/, /[aA]/, /[sS]/, /[tT]/, /[eE]/, /[rR]/, { "literal": ">" }], "postprocess": function(d) {
        return d.join("");
      } },
      { "name": "Forward_path", "symbols": ["Forward_path$subexpression$2"] },
      { "name": "Forward_path", "symbols": ["Path"] },
      { "name": "Path$ebnf$1$subexpression$1", "symbols": ["A_d_l", { "literal": ":" }] },
      { "name": "Path$ebnf$1", "symbols": ["Path$ebnf$1$subexpression$1"], "postprocess": id },
      { "name": "Path$ebnf$1", "symbols": [], "postprocess": () => null },
      { "name": "Path", "symbols": [{ "literal": "<" }, "Path$ebnf$1", "Mailbox", { "literal": ">" }] },
      { "name": "A_d_l$ebnf$1", "symbols": [] },
      { "name": "A_d_l$ebnf$1$subexpression$1", "symbols": [{ "literal": "," }, "At_domain"] },
      { "name": "A_d_l$ebnf$1", "symbols": ["A_d_l$ebnf$1", "A_d_l$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "A_d_l", "symbols": ["At_domain", "A_d_l$ebnf$1"] },
      { "name": "At_domain", "symbols": [{ "literal": "@" }, "Domain"] },
      { "name": "Domain$ebnf$1", "symbols": [] },
      { "name": "Domain$ebnf$1$subexpression$1", "symbols": [{ "literal": "." }, "sub_domain"] },
      { "name": "Domain$ebnf$1", "symbols": ["Domain$ebnf$1", "Domain$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "Domain", "symbols": ["sub_domain", "Domain$ebnf$1"] },
      { "name": "sub_domain", "symbols": ["U_label"] },
      { "name": "Let_dig", "symbols": ["ALPHA_DIGIT"], "postprocess": id },
      { "name": "Ldh_str$ebnf$1", "symbols": [] },
      { "name": "Ldh_str$ebnf$1", "symbols": ["Ldh_str$ebnf$1", "ALPHA_DIG_DASH"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "Ldh_str", "symbols": ["Ldh_str$ebnf$1", "Let_dig"] },
      { "name": "U_Let_dig", "symbols": ["ALPHA_DIGIT_U"], "postprocess": id },
      { "name": "U_Ldh_str$ebnf$1", "symbols": [] },
      { "name": "U_Ldh_str$ebnf$1", "symbols": ["U_Ldh_str$ebnf$1", "ALPHA_DIG_DASH_U"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "U_Ldh_str", "symbols": ["U_Ldh_str$ebnf$1", "U_Let_dig"] },
      { "name": "U_label$ebnf$1$subexpression$1", "symbols": ["U_Ldh_str"] },
      { "name": "U_label$ebnf$1", "symbols": ["U_label$ebnf$1$subexpression$1"], "postprocess": id },
      { "name": "U_label$ebnf$1", "symbols": [], "postprocess": () => null },
      { "name": "U_label", "symbols": ["U_Let_dig", "U_label$ebnf$1"] },
      { "name": "address_literal$subexpression$1", "symbols": ["IPv4_address_literal"] },
      { "name": "address_literal$subexpression$1", "symbols": ["IPv6_address_literal"] },
      { "name": "address_literal$subexpression$1", "symbols": ["General_address_literal"] },
      { "name": "address_literal", "symbols": [{ "literal": "[" }, "address_literal$subexpression$1", { "literal": "]" }] },
      {
        "name": "non_local_part",
        "symbols": ["Domain"],
        "postprocess": function(d) {
          return { DomainName: flat_string(d[0]) };
        }
      },
      {
        "name": "non_local_part",
        "symbols": ["address_literal"],
        "postprocess": function(d) {
          return { AddressLiteral: flat_string(d[0]) };
        }
      },
      {
        "name": "Mailbox",
        "symbols": ["Local_part", { "literal": "@" }, "non_local_part"],
        "postprocess": function(d) {
          return { localPart: flat_string(d[0]), domainPart: flat_string(d[2]) };
        }
      },
      {
        "name": "Local_part",
        "symbols": ["Dot_string"],
        "postprocess": function(d) {
          return { DotString: flat_string(d[0]) };
        }
      },
      {
        "name": "Local_part",
        "symbols": ["Quoted_string"],
        "postprocess": function(d) {
          return { QuotedString: flat_string(d[0]) };
        }
      },
      { "name": "Dot_string$ebnf$1", "symbols": [] },
      { "name": "Dot_string$ebnf$1$subexpression$1", "symbols": [{ "literal": "." }, "Atom"] },
      { "name": "Dot_string$ebnf$1", "symbols": ["Dot_string$ebnf$1", "Dot_string$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "Dot_string", "symbols": ["Atom", "Dot_string$ebnf$1"] },
      { "name": "Atom$ebnf$1", "symbols": [/[0-9A-Za-z!#$%&'*+\-/=?^_`{|}~\u0080-\uFFFF/]/] },
      { "name": "Atom$ebnf$1", "symbols": ["Atom$ebnf$1", /[0-9A-Za-z!#$%&'*+\-/=?^_`{|}~\u0080-\uFFFF/]/], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "Atom", "symbols": ["Atom$ebnf$1"] },
      { "name": "Quoted_string$ebnf$1", "symbols": [] },
      { "name": "Quoted_string$ebnf$1", "symbols": ["Quoted_string$ebnf$1", "QcontentSMTP"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "Quoted_string", "symbols": ["DQUOTE", "Quoted_string$ebnf$1", "DQUOTE"] },
      { "name": "QcontentSMTP", "symbols": ["qtextSMTP"] },
      { "name": "QcontentSMTP", "symbols": ["quoted_pairSMTP"] },
      { "name": "quoted_pairSMTP", "symbols": [{ "literal": "\\" }, /[\x20-\x7e]/] },
      { "name": "qtextSMTP", "symbols": [/[\x20-\x21\x23-\x5b\x5d-\x7e\u0080-\uFFFF]/], "postprocess": id },
      { "name": "IPv4_address_literal$macrocall$2", "symbols": [{ "literal": "." }, "Snum"] },
      { "name": "IPv4_address_literal$macrocall$1", "symbols": ["IPv4_address_literal$macrocall$2", "IPv4_address_literal$macrocall$2", "IPv4_address_literal$macrocall$2"] },
      { "name": "IPv4_address_literal", "symbols": ["Snum", "IPv4_address_literal$macrocall$1"] },
      { "name": "IPv6_address_literal$subexpression$1", "symbols": [/[iI]/, /[pP]/, /[vV]/, { "literal": "6" }, { "literal": ":" }], "postprocess": function(d) {
        return d.join("");
      } },
      { "name": "IPv6_address_literal", "symbols": ["IPv6_address_literal$subexpression$1", "IPv6_addr"] },
      { "name": "General_address_literal$ebnf$1", "symbols": ["dcontent"] },
      { "name": "General_address_literal$ebnf$1", "symbols": ["General_address_literal$ebnf$1", "dcontent"], "postprocess": (d) => d[0].concat([d[1]]) },
      { "name": "General_address_literal", "symbols": ["Standardized_tag", { "literal": ":" }, "General_address_literal$ebnf$1"] },
      { "name": "Standardized_tag", "symbols": ["Ldh_str"] },
      { "name": "dcontent", "symbols": [/[\x21-\x5a\x5e-\x7e]/], "postprocess": id },
      { "name": "Snum", "symbols": ["DIGIT"] },
      { "name": "Snum$subexpression$1", "symbols": [/[1-9]/, "DIGIT"] },
      { "name": "Snum", "symbols": ["Snum$subexpression$1"] },
      { "name": "Snum$subexpression$2", "symbols": [{ "literal": "1" }, "DIGIT", "DIGIT"] },
      { "name": "Snum", "symbols": ["Snum$subexpression$2"] },
      { "name": "Snum$subexpression$3", "symbols": [{ "literal": "2" }, /[0-4]/, "DIGIT"] },
      { "name": "Snum", "symbols": ["Snum$subexpression$3"] },
      { "name": "Snum$subexpression$4", "symbols": [{ "literal": "2" }, { "literal": "5" }, /[0-5]/] },
      { "name": "Snum", "symbols": ["Snum$subexpression$4"] },
      { "name": "IPv6_addr", "symbols": ["IPv6_full"] },
      { "name": "IPv6_addr", "symbols": ["IPv6_comp"] },
      { "name": "IPv6_addr", "symbols": ["IPv6v4_full"] },
      { "name": "IPv6_addr", "symbols": ["IPv6v4_comp"] },
      { "name": "IPv6_hex", "symbols": ["HEXDIG"] },
      { "name": "IPv6_hex$subexpression$1", "symbols": ["HEXDIG", "HEXDIG"] },
      { "name": "IPv6_hex", "symbols": ["IPv6_hex$subexpression$1"] },
      { "name": "IPv6_hex$subexpression$2", "symbols": ["HEXDIG", "HEXDIG", "HEXDIG"] },
      { "name": "IPv6_hex", "symbols": ["IPv6_hex$subexpression$2"] },
      { "name": "IPv6_hex$subexpression$3", "symbols": ["HEXDIG", "HEXDIG", "HEXDIG", "HEXDIG"] },
      { "name": "IPv6_hex", "symbols": ["IPv6_hex$subexpression$3"] },
      { "name": "IPv6_full$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6_full$macrocall$1", "symbols": ["IPv6_full$macrocall$2", "IPv6_full$macrocall$2", "IPv6_full$macrocall$2", "IPv6_full$macrocall$2", "IPv6_full$macrocall$2", "IPv6_full$macrocall$2", "IPv6_full$macrocall$2"] },
      { "name": "IPv6_full", "symbols": ["IPv6_hex", "IPv6_full$macrocall$1"] },
      { "name": "IPv6_comp$ebnf$1$subexpression$1$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6_comp$ebnf$1$subexpression$1$macrocall$1", "symbols": ["IPv6_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6_comp$ebnf$1$subexpression$1$macrocall$2"] },
      { "name": "IPv6_comp$ebnf$1$subexpression$1", "symbols": ["IPv6_hex", "IPv6_comp$ebnf$1$subexpression$1$macrocall$1"] },
      { "name": "IPv6_comp$ebnf$1", "symbols": ["IPv6_comp$ebnf$1$subexpression$1"], "postprocess": id },
      { "name": "IPv6_comp$ebnf$1", "symbols": [], "postprocess": () => null },
      { "name": "IPv6_comp$string$1", "symbols": [{ "literal": ":" }, { "literal": ":" }], "postprocess": (d) => d.join("") },
      { "name": "IPv6_comp$ebnf$2$subexpression$1$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6_comp$ebnf$2$subexpression$1$macrocall$1", "symbols": ["IPv6_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6_comp$ebnf$2$subexpression$1$macrocall$2"] },
      { "name": "IPv6_comp$ebnf$2$subexpression$1", "symbols": ["IPv6_hex", "IPv6_comp$ebnf$2$subexpression$1$macrocall$1"] },
      { "name": "IPv6_comp$ebnf$2", "symbols": ["IPv6_comp$ebnf$2$subexpression$1"], "postprocess": id },
      { "name": "IPv6_comp$ebnf$2", "symbols": [], "postprocess": () => null },
      { "name": "IPv6_comp", "symbols": ["IPv6_comp$ebnf$1", "IPv6_comp$string$1", "IPv6_comp$ebnf$2"] },
      { "name": "IPv6v4_full$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6v4_full$macrocall$1", "symbols": ["IPv6v4_full$macrocall$2", "IPv6v4_full$macrocall$2", "IPv6v4_full$macrocall$2", "IPv6v4_full$macrocall$2", "IPv6v4_full$macrocall$2"] },
      { "name": "IPv6v4_full", "symbols": ["IPv6_hex", "IPv6v4_full$macrocall$1", { "literal": ":" }, "IPv4_address_literal"] },
      { "name": "IPv6v4_comp$ebnf$1$subexpression$1$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6v4_comp$ebnf$1$subexpression$1$macrocall$1", "symbols": ["IPv6v4_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6v4_comp$ebnf$1$subexpression$1$macrocall$2", "IPv6v4_comp$ebnf$1$subexpression$1$macrocall$2"] },
      { "name": "IPv6v4_comp$ebnf$1$subexpression$1", "symbols": ["IPv6_hex", "IPv6v4_comp$ebnf$1$subexpression$1$macrocall$1"] },
      { "name": "IPv6v4_comp$ebnf$1", "symbols": ["IPv6v4_comp$ebnf$1$subexpression$1"], "postprocess": id },
      { "name": "IPv6v4_comp$ebnf$1", "symbols": [], "postprocess": () => null },
      { "name": "IPv6v4_comp$string$1", "symbols": [{ "literal": ":" }, { "literal": ":" }], "postprocess": (d) => d.join("") },
      { "name": "IPv6v4_comp$ebnf$2$subexpression$1$macrocall$2", "symbols": [{ "literal": ":" }, "IPv6_hex"] },
      { "name": "IPv6v4_comp$ebnf$2$subexpression$1$macrocall$1", "symbols": ["IPv6v4_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6v4_comp$ebnf$2$subexpression$1$macrocall$2", "IPv6v4_comp$ebnf$2$subexpression$1$macrocall$2"] },
      { "name": "IPv6v4_comp$ebnf$2$subexpression$1", "symbols": ["IPv6_hex", "IPv6v4_comp$ebnf$2$subexpression$1$macrocall$1", { "literal": ":" }] },
      { "name": "IPv6v4_comp$ebnf$2", "symbols": ["IPv6v4_comp$ebnf$2$subexpression$1"], "postprocess": id },
      { "name": "IPv6v4_comp$ebnf$2", "symbols": [], "postprocess": () => null },
      { "name": "IPv6v4_comp", "symbols": ["IPv6v4_comp$ebnf$1", "IPv6v4_comp$string$1", "IPv6v4_comp$ebnf$2", "IPv4_address_literal"] },
      { "name": "DIGIT", "symbols": [/[0-9]/], "postprocess": id },
      { "name": "ALPHA_DIGIT_U", "symbols": [/[0-9A-Za-z\u0080-\uFFFF]/], "postprocess": id },
      { "name": "ALPHA_DIGIT", "symbols": [/[0-9A-Za-z]/], "postprocess": id },
      { "name": "ALPHA_DIG_DASH", "symbols": [/[-0-9A-Za-z]/], "postprocess": id },
      { "name": "ALPHA_DIG_DASH_U", "symbols": [/[-0-9A-Za-z\u0080-\uFFFF]/], "postprocess": id },
      { "name": "HEXDIG", "symbols": [/[0-9A-Fa-f]/], "postprocess": id },
      { "name": "DQUOTE", "symbols": [{ "literal": '"' }], "postprocess": id }
    ],
    ParserStart: "Reverse_path"
  };
  grammar.default = grammar$1;
  return grammar;
}
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib;
  hasRequiredLib = 1;
  var __importDefault = lib && lib.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(lib, "__esModule", { value: true });
  lib.canonicalize = lib.canonicalize_quoted_string = lib.normalize = lib.normalize_dot_string = lib.parse = void 0;
  const nearley2 = requireNearley();
  const grammar_1 = __importDefault(requireGrammar());
  grammar_1.default.ParserStart = "Mailbox";
  const grammar2 = nearley2.Grammar.fromCompiled(grammar_1.default);
  function parse2(address) {
    const parser = new nearley2.Parser(grammar2);
    parser.feed(address);
    if (parser.results.length !== 1) {
      throw new Error("address parsing failed: ambiguous grammar");
    }
    return parser.results[0];
  }
  lib.parse = parse2;
  function normalize_dot_string(dot_string) {
    const tagless = function() {
      const plus_loc = dot_string.indexOf("+");
      if (plus_loc === -1) {
        return dot_string;
      }
      return dot_string.substr(0, plus_loc);
    }();
    const dotless = tagless.replace(/\./g, "");
    return dotless.toLowerCase();
  }
  lib.normalize_dot_string = normalize_dot_string;
  function normalize(address) {
    var _a2, _b;
    const a = parse2(address);
    const domain = (_a2 = a.domainPart.AddressLiteral) !== null && _a2 !== void 0 ? _a2 : a.domainPart.DomainName.toLowerCase();
    const local = (_b = a.localPart.QuotedString) !== null && _b !== void 0 ? _b : normalize_dot_string(a.localPart.DotString);
    return `${local}@${domain}`;
  }
  lib.normalize = normalize;
  function canonicalize_quoted_string(quoted_string) {
    const unquoted = quoted_string.substr(1).substr(0, quoted_string.length - 2);
    const unescaped = unquoted.replace(/(?:\\(.))/g, "$1");
    const reescaped = unescaped.replace(/(?:(["\\]))/g, "\\$1");
    return `"${reescaped}"`;
  }
  lib.canonicalize_quoted_string = canonicalize_quoted_string;
  function canonicalize(address) {
    var _a2;
    const a = parse2(address);
    const domain = (_a2 = a.domainPart.AddressLiteral) !== null && _a2 !== void 0 ? _a2 : a.domainPart.DomainName.toLowerCase();
    const local = a.localPart.QuotedString ? canonicalize_quoted_string(a.localPart.QuotedString) : a.localPart.DotString;
    return `${local}@${domain}`;
  }
  lib.canonicalize = canonicalize;
  return lib;
}
var libExports = requireLib();
const isValidDateTime = new RegExp("^([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\\.[0-9]+)?(([Zz])|([\\+|\\-]([01][0-9]|2[0-3]):[0-5][0-9]))$");
const isValidIPV4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
const isValidIPV6 = /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i;
const isValidHostname = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|-){0,61}[0-9A-Za-z])?)*\.?$/;
const matchDate = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const matchTime = /^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isValidJsonPointer = /^(?:\/(?:[^~/]|~0|~1)*)*$/;
const isValidRelativeJsonPointer = /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/;
const isValidURIRef = /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
const isValidURITemplate = /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i;
const isValidDurationString = /^P(?!$)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?$/;
const formatValidators = {
  date: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    const matches = value.match(matchDate);
    if (!matches) {
      return draft.errors.formatDateTimeError({ value, pointer, schema });
    }
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    if (month >= 1 && month <= 12 && day >= 1 && day <= (month == 2 && isLeapYear ? 29 : DAYS[month])) {
      return void 0;
    }
    return draft.errors.formatDateError({ value, pointer, schema });
  },
  "date-time": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (value === "" || isValidDateTime.test(value)) {
      if (new Date(value).toString() === "Invalid Date") {
        return draft.errors.formatDateTimeError({ value, pointer, schema });
      }
      return void 0;
    }
    return draft.errors.formatDateTimeError({ value, pointer, schema });
  },
  duration: (node, value) => {
    const type = getTypeOf(value);
    if (type !== "string") {
      return void 0;
    }
    const isInvalidDurationString = /(\d+M)(\d+W)|(\d+Y)(\d+W)/;
    if (!isValidDurationString.test(value) || isInvalidDurationString.test(value)) {
      return node.draft.errors.formatDurationError({ value, pointer: node.pointer, schema: node.schema });
    }
  },
  email: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (value[0] === '"') {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
    const [name, host, ...rest] = value.split("@");
    if (!name || !host || rest.length !== 0 || name.length > 64 || host.length > 253) {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
    if (name[0] === "." || name.endsWith(".") || name.includes("..")) {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
    if (!/^[a-z0-9.-]+$/i.test(host) || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(name)) {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
    if (!host.split(".").every((part) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(part))) {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
    return void 0;
  },
  /**
   * @draft 7
   * [RFC6531] https://json-schema.org/draft-07/json-schema-validation.html#RFC6531
   */
  "idn-email": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    try {
      libExports.parse(value);
      return void 0;
    } catch (e) {
      return draft.errors.formatEmailError({ value, pointer, schema });
    }
  },
  hostname: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string") {
      return void 0;
    }
    if (value === "" || isValidHostname.test(value)) {
      return void 0;
    }
    return draft.errors.formatHostnameError({ value, pointer, schema });
  },
  ipv4: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (value && value[0] === "0") {
      return draft.errors.formatIPV4LeadingZeroError({ value, pointer, schema });
    }
    if (value.length <= 15 && isValidIPV4.test(value)) {
      return void 0;
    }
    return draft.errors.formatIPV4Error({ value, pointer, schema });
  },
  ipv6: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (value && value[0] === "0") {
      return draft.errors.formatIPV6LeadingZeroError({ value, pointer, schema });
    }
    if (value.length <= 45 && isValidIPV6.test(value)) {
      return void 0;
    }
    return draft.errors.formatIPV6Error({ value, pointer, schema });
  },
  "json-pointer": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (isValidJsonPointer.test(value)) {
      return void 0;
    }
    return draft.errors.formatJsonPointerError({ value, pointer, schema });
  },
  "relative-json-pointer": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string") {
      return void 0;
    }
    if (isValidRelativeJsonPointer.test(value)) {
      return void 0;
    }
    return draft.errors.formatJsonPointerError({ value, pointer, schema });
  },
  regex: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value === "string" && /\\Z$/.test(value) === false) {
      try {
        new RegExp(value);
        return void 0;
      } catch (e) {
      }
      return draft.errors.formatRegExError({ value, pointer, schema });
    }
    if (typeof value === "object" || typeof value === "number" || Array.isArray(value)) {
      return void 0;
    }
    return draft.errors.formatRegExError({ value, pointer, schema });
  },
  // hh:mm:ss.sTZD
  // https://opis.io/json-schema/2.x/formats.html
  // regex https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s07.html
  time: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    const matches = value.match(matchTime);
    return matches ? void 0 : draft.errors.formatDateTimeError({ value, pointer, schema });
  },
  uri: (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (validUrl.isUri(value)) {
      return void 0;
    }
    return draft.errors.formatURIError({ value, pointer, schema });
  },
  "uri-reference": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (isValidURIRef.test(value)) {
      return void 0;
    }
    return draft.errors.formatURIReferenceError({ value, pointer, schema });
  },
  "uri-template": (node, value) => {
    const { draft, schema, pointer } = node;
    if (typeof value !== "string" || value === "") {
      return void 0;
    }
    if (isValidURITemplate.test(value)) {
      return void 0;
    }
    return draft.errors.formatURITemplateError({ value, pointer, schema });
  },
  url: (node, value) => {
    const { draft, schema, pointer } = node;
    if (value === "" || validUrl.isWebUri(value)) {
      return void 0;
    }
    return draft.errors.formatURLError({ value, pointer, schema });
  }
};
function getChildSchemaSelection(draft, property, schema = draft.rootSchema) {
  var _a2;
  if (schema.oneOf) {
    return schema.oneOf.map((item) => draft.createNode(item).resolveRef().schema);
  }
  if ((_a2 = schema.items) === null || _a2 === void 0 ? void 0 : _a2.oneOf) {
    return schema.items.oneOf.map((item) => draft.createNode(item).resolveRef().schema);
  }
  const node = draft.step(draft.createNode(schema), property, {});
  if (isJsonError(node)) {
    return node;
  }
  return [node.schema];
}
const emptyObject = {};
function getSchema(draft, options = emptyObject) {
  const { pointer = "#", data, schema = draft.rootSchema, withSchemaWarning = false } = options;
  const path = gp.split(pointer);
  const node = draft.createNode(schema).resolveRef();
  const result = _getSchema(node, path, data);
  if (!withSchemaWarning && isJsonError(result) && result.code === "schema-warning") {
    return void 0;
  }
  return result;
}
function _getSchema(node, path, data = emptyObject) {
  if (path.length === 0) {
    return node.resolveRef();
  }
  const key = path.shift();
  const nextNode = node.draft.step(node, key, data);
  if (isJsonError(nextNode)) {
    return nextNode;
  }
  data = data[key];
  return _getSchema(nextNode, path, data);
}
var cjs;
var hasRequiredCjs;
function requireCjs() {
  if (hasRequiredCjs) return cjs;
  hasRequiredCjs = 1;
  var isMergeableObject = function isMergeableObject2(value) {
    return isNonNullObject(value) && !isSpecial(value);
  };
  function isNonNullObject(value) {
    return !!value && typeof value === "object";
  }
  function isSpecial(value) {
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === "[object RegExp]" || stringValue === "[object Date]" || isReactElement(value);
  }
  var canUseSymbol = typeof Symbol === "function" && Symbol.for;
  var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for("react.element") : 60103;
  function isReactElement(value) {
    return value.$$typeof === REACT_ELEMENT_TYPE;
  }
  function emptyTarget(val) {
    return Array.isArray(val) ? [] : {};
  }
  function cloneUnlessOtherwiseSpecified(value, options) {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge2(emptyTarget(value), value, options) : value;
  }
  function defaultArrayMerge(target, source, options) {
    return target.concat(source).map(function(element) {
      return cloneUnlessOtherwiseSpecified(element, options);
    });
  }
  function getMergeFunction(key, options) {
    if (!options.customMerge) {
      return deepmerge2;
    }
    var customMerge = options.customMerge(key);
    return typeof customMerge === "function" ? customMerge : deepmerge2;
  }
  function getEnumerableOwnPropertySymbols(target) {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
      return Object.propertyIsEnumerable.call(target, symbol);
    }) : [];
  }
  function getKeys(target) {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
  }
  function propertyIsOnObject(object, property) {
    try {
      return property in object;
    } catch (_) {
      return false;
    }
  }
  function propertyIsUnsafe(target, key) {
    return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
  }
  function mergeObject(target, source, options) {
    var destination = {};
    if (options.isMergeableObject(target)) {
      getKeys(target).forEach(function(key) {
        destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
      });
    }
    getKeys(source).forEach(function(key) {
      if (propertyIsUnsafe(target, key)) {
        return;
      }
      if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
        destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
      } else {
        destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
      }
    });
    return destination;
  }
  function deepmerge2(target, source, options) {
    options = options || {};
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
    if (!sourceAndTargetTypesMatch) {
      return cloneUnlessOtherwiseSpecified(source, options);
    } else if (sourceIsArray) {
      return options.arrayMerge(target, source, options);
    } else {
      return mergeObject(target, source, options);
    }
  }
  deepmerge2.all = function deepmergeAll(array, options) {
    if (!Array.isArray(array)) {
      throw new Error("first argument should be an array");
    }
    return array.reduce(function(prev, next2) {
      return deepmerge2(prev, next2, options);
    }, {});
  };
  var deepmerge_1 = deepmerge2;
  cjs = deepmerge_1;
  return cjs;
}
var cjsExports = requireCjs();
const deepmerge = /* @__PURE__ */ getDefaultExportFromCjs(cjsExports);
const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
const merge = (a, b) => deepmerge(a, b, { arrayMerge: overwriteMerge });
function isEmpty(v) {
  const type = getTypeOf(v);
  switch (type) {
    case "string":
    case "array":
      return (v === null || v === void 0 ? void 0 : v.length) === 0;
    case "null":
    case "undefined":
      return true;
    case "object":
      return Object.keys(v).length === 0;
    default:
      return false;
  }
}
const defaultOptions = settings.templateDefaultOptions;
let cache;
function shouldResolveRef(schema, pointer) {
  const { $ref } = schema;
  if ($ref == null) {
    return true;
  }
  const value = cache[pointer] == null || cache[pointer][$ref] == null ? 0 : cache[pointer][$ref];
  return value < settings.GET_TEMPLATE_RECURSION_LIMIT;
}
function resolveRef(draft, schema, pointer) {
  const { $ref } = schema;
  if ($ref == null) {
    return schema;
  }
  cache[pointer] = cache[pointer] || {};
  cache[pointer][$ref] = cache[pointer][$ref] || 0;
  cache[pointer][$ref] += 1;
  return draft.createNode(schema, pointer).resolveRef().schema;
}
function convertValue(type, value) {
  if (type === "string") {
    return JSON.stringify(value);
  } else if (typeof value !== "string") {
    return null;
  }
  try {
    value = JSON.parse(value);
    if (typeof value === type) {
      return value;
    }
  } catch (e) {
  }
  return null;
}
function createTemplateSchema(draft, schema, data, pointer, opts) {
  if (getTypeOf(schema) !== "object") {
    return Object.assign({ pointer }, schema);
  }
  if (shouldResolveRef(schema, pointer) === false && data == null) {
    return false;
  }
  let templateSchema = index(resolveRef(draft, schema, pointer));
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    if (shouldResolveRef(schema.anyOf[0], `${pointer}/anyOf/0`)) {
      const resolvedAnyOf = resolveRef(draft, schema.anyOf[0], `${pointer}/anyOf/0`);
      templateSchema = merge(templateSchema, resolvedAnyOf);
      templateSchema.pointer = schema.anyOf[0].$ref || templateSchema.pointer;
    }
    delete templateSchema.anyOf;
  }
  if (Array.isArray(schema.allOf)) {
    const mayResolve = schema.allOf.map((allOf, index2) => shouldResolveRef(allOf, `${pointer}/allOf/${index2}`)).reduceRight((next2, before) => next2 && before, true);
    if (mayResolve) {
      const allOf = [];
      let extendedData = index(data);
      for (let i = 0; i < schema.allOf.length; i += 1) {
        const allNode = draft.createNode(schema.allOf[i], pointer);
        allOf.push(resolveSchema(allNode, extendedData).schema);
        extendedData = getTemplate(draft, extendedData, { type: schema.type, ...allOf[i] }, `${pointer}/allOf/${i}`, opts);
      }
      const resolvedSchema = mergeAllOfSchema(draft, { allOf });
      if (resolvedSchema) {
        templateSchema = mergeSchema(templateSchema, resolvedSchema);
      }
    }
  }
  templateSchema.pointer = templateSchema.pointer || schema.$ref || pointer;
  return templateSchema;
}
const isJsonSchema = (template) => template && typeof template === "object";
function getTemplate(draft, data, _schema, pointer, opts) {
  var _a2;
  if (_schema == null) {
    throw new Error(`getTemplate: missing schema for data: ${JSON.stringify(data)}`);
  }
  if (pointer == null) {
    throw new Error("Missing pointer");
  }
  let schema = createTemplateSchema(draft, _schema, data, pointer, opts);
  if (!isJsonSchema(schema)) {
    return void 0;
  }
  pointer = schema.pointer;
  if (schema === null || schema === void 0 ? void 0 : schema.const) {
    return schema.const;
  }
  if (Array.isArray(schema.oneOf)) {
    if (isEmpty(data)) {
      const type2 = schema.oneOf[0].type || schema.type || schema.const && typeof schema.const || getTypeOf(data);
      schema = { ...schema.oneOf[0], type: type2 };
    } else {
      const oneNode = draft.createNode(schema, pointer);
      const resolvedNode = resolveOneOfFuzzy(oneNode, data);
      if (isJsonError(resolvedNode)) {
        if (data != null && opts.removeInvalidData !== true) {
          return data;
        }
        schema = schema.oneOf[0];
        data = void 0;
      } else {
        const resolvedSchema = resolvedNode.schema;
        resolvedSchema.type = (_a2 = resolvedSchema.type) !== null && _a2 !== void 0 ? _a2 : schema.type;
        schema = resolvedSchema;
      }
    }
  }
  if (!isJsonSchema(schema) || schema.type == null) {
    return void 0;
  }
  if (data instanceof File) {
    return data;
  }
  const type = Array.isArray(schema.type) ? selectType(schema.type, data, schema.default) : schema.type;
  const javascriptTypeOfData = getTypeOf(data);
  if (data != null && javascriptTypeOfData !== type && !(javascriptTypeOfData === "number" && type === "integer")) {
    data = convertValue(type, data);
  }
  if (TYPE[type] == null) {
    if (opts.removeInvalidData) {
      return void 0;
    }
    return data;
  }
  const templateData = TYPE[type](draft, schema, data, pointer, opts);
  return templateData;
}
function selectType(types, data, defaultValue) {
  if (data == void 0) {
    if (defaultValue != null) {
      const defaultType = getTypeOf(defaultValue);
      if (types.includes(defaultType)) {
        return defaultType;
      }
    }
    return types[0];
  }
  const dataType = getTypeOf(data);
  if (types.includes(dataType)) {
    return dataType;
  }
  return types[0];
}
const TYPE = {
  null: (draft, schema, data) => getDefault(schema, data, null),
  string: (draft, schema, data) => getDefault(schema, data, ""),
  number: (draft, schema, data) => getDefault(schema, data, 0),
  integer: (draft, schema, data) => getDefault(schema, data, 0),
  boolean: (draft, schema, data) => getDefault(schema, data, false),
  object: (draft, schema, data, pointer, opts) => {
    var _a2;
    const template = schema.default === void 0 ? {} : schema.default;
    const d = {};
    const required = opts.extendDefaults === false && schema.default !== void 0 ? [] : (_a2 = schema.required) !== null && _a2 !== void 0 ? _a2 : [];
    if (schema.properties) {
      Object.keys(schema.properties).forEach((key) => {
        const value = data == null || data[key] == null ? template[key] : data[key];
        const isRequired = required.includes(key);
        if (value != null || isRequired || opts.addOptionalProps) {
          d[key] = getTemplate(draft, value, schema.properties[key], `${pointer}/properties/${key}`, opts);
        }
      });
    }
    const dNode = draft.createNode(schema, pointer);
    let dependenciesSchema = resolveDependencies(dNode, d);
    if (dependenciesSchema) {
      dependenciesSchema = mergeSchema(schema, dependenciesSchema);
      delete dependenciesSchema.dependencies;
      const dependencyData = getTemplate(draft, data, dependenciesSchema, `${pointer}/dependencies`, opts);
      Object.assign(d, dependencyData);
    }
    if (data) {
      if (opts.removeInvalidData === true && (schema.additionalProperties === false || getTypeOf(schema.additionalProperties) === "object")) {
        if (getTypeOf(schema.additionalProperties) === "object") {
          Object.keys(data).forEach((key) => {
            if (d[key] == null) {
              if (draft.isValid(data[key], schema.additionalProperties)) {
                d[key] = data[key];
              }
            }
          });
        }
      } else {
        Object.keys(data).forEach((key) => d[key] == null && (d[key] = data[key]));
      }
    }
    const node = draft.createNode(schema, pointer);
    const ifSchema = resolveIfSchema(node, d);
    if (isSchemaNode(ifSchema)) {
      const additionalData = getTemplate(draft, d, { type: "object", ...ifSchema.schema }, pointer, opts);
      Object.assign(d, additionalData);
    }
    return d;
  },
  // build array type of items, ignores additionalItems
  array: (draft, schema, data, pointer, opts) => {
    var _a2, _b;
    if (schema.items == null) {
      return data || [];
    }
    const template = schema.default === void 0 ? [] : schema.default;
    const d = data || template;
    const minItems = opts.extendDefaults === false && schema.default !== void 0 ? 0 : schema.minItems || 0;
    if (Array.isArray(schema.items)) {
      for (let i = 0, l = Math.max(minItems !== null && minItems !== void 0 ? minItems : 0, (_b = (_a2 = schema.items) === null || _a2 === void 0 ? void 0 : _a2.length) !== null && _b !== void 0 ? _b : 0); i < l; i += 1) {
        d[i] = getTemplate(draft, d[i] == null ? template[i] : d[i], schema.items[i], `${pointer}/items/${i}`, opts);
      }
      return d;
    }
    if (getTypeOf(schema.items) !== "object") {
      return d;
    }
    const templateSchema = createTemplateSchema(draft, schema.items, data, pointer, opts);
    if (templateSchema === false) {
      return d;
    }
    pointer = templateSchema.pointer || pointer;
    if (templateSchema.oneOf && d.length === 0) {
      const oneOfSchema = templateSchema.oneOf[0];
      for (let i = 0; i < minItems; i += 1) {
        d[i] = getTemplate(draft, d[i] == null ? template[i] : d[i], oneOfSchema, `${pointer}/oneOf/0`, opts);
      }
      return d;
    }
    if (templateSchema.oneOf && d.length > 0) {
      const itemCount = Math.max(minItems, d.length);
      for (let i = 0; i < itemCount; i += 1) {
        let value = d[i] == null ? template[i] : d[i];
        const oneNode = draft.createNode(templateSchema, pointer);
        let one = resolveOneOfFuzzy(oneNode, value);
        if (one == null || isJsonError(one)) {
          if (value != null && opts.removeInvalidData !== true) {
            d[i] = value;
          } else {
            value = void 0;
            one = templateSchema.oneOf[0];
            d[i] = getTemplate(draft, value, one, `${pointer}/oneOf/${i}`, opts);
          }
        } else {
          d[i] = getTemplate(draft, value, one.schema, `${pointer}/oneOf/${i}`, opts);
        }
      }
      return d;
    }
    if (templateSchema.type) {
      for (let i = 0, l = Math.max(minItems, d.length); i < l; i += 1) {
        d[i] = getTemplate(draft, d[i] == null ? template[i] : d[i], templateSchema, `${pointer}/items`, opts);
      }
      return d;
    }
    return d;
  }
};
function getDefault(schema, templateValue, initValue) {
  if (templateValue != null) {
    return templateValue;
  } else if (schema.const) {
    return schema.const;
  } else if (schema.default === void 0 && Array.isArray(schema.enum)) {
    return schema.enum[0];
  } else if (schema.default === void 0) {
    return initValue;
  }
  return schema.default;
}
const getTemplate$1 = (draft, data, schema = draft.rootSchema, opts) => {
  cache = {};
  if (opts) {
    return getTemplate(draft, data, schema, "#", { ...defaultOptions, ...opts });
  }
  return getTemplate(draft, data, schema, "#", defaultOptions);
};
function isValid(draft, value, schema = draft.rootSchema, pointer = "#") {
  const node = draft.createNode(schema, pointer);
  return draft.validate(node, value).length === 0;
}
function ucs2decode(string) {
  const output = [];
  let counter = 0;
  const length = string.length;
  while (counter < length) {
    const value = string.charCodeAt(counter++);
    if (value >= 55296 && value <= 56319 && counter < length) {
      const extra = string.charCodeAt(counter++);
      if ((extra & 64512) == 56320) {
        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
      } else {
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}
function getPrecision(value) {
  const string = `${value}`;
  if (string.includes("e-")) {
    return parseInt(string.replace(/.*e-/, ""));
  }
  const index2 = string.indexOf(".");
  return index2 === -1 ? 0 : string.length - (index2 + 1);
}
var fastDeepEqual;
var hasRequiredFastDeepEqual;
function requireFastDeepEqual() {
  if (hasRequiredFastDeepEqual) return fastDeepEqual;
  hasRequiredFastDeepEqual = 1;
  fastDeepEqual = function equal2(a, b) {
    if (a === b) return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor) return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length) return false;
        for (i = length; i-- !== 0; )
          if (!equal2(a[i], b[i])) return false;
        return true;
      }
      if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length) return false;
      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
      for (i = length; i-- !== 0; ) {
        var key = keys[i];
        if (!equal2(a[key], b[key])) return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
  return fastDeepEqual;
}
var fastDeepEqualExports = requireFastDeepEqual();
const equal = /* @__PURE__ */ getDefaultExportFromCjs(fastDeepEqualExports);
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasProperty = (value, property) => !(value[property] === void 0 || !hasOwnProperty.call(value, property));
const KeywordValidation$2 = {
  additionalProperties: (node, value) => {
    const { draft, schema, pointer } = node;
    if (schema.additionalProperties === true || schema.additionalProperties == null) {
      return void 0;
    }
    if (getTypeOf(schema.patternProperties) === "object" && schema.additionalProperties === false) {
      return void 0;
    }
    const errors2 = [];
    let receivedProperties = Object.keys(value).filter((prop) => settings.propertyBlacklist.includes(prop) === false);
    const expectedProperties = Object.keys(schema.properties || {});
    if (getTypeOf(schema.patternProperties) === "object") {
      const patterns = Object.keys(schema.patternProperties).map((pattern) => new RegExp(pattern));
      receivedProperties = receivedProperties.filter((prop) => {
        for (let i = 0; i < patterns.length; i += 1) {
          if (patterns[i].test(prop)) {
            return false;
          }
        }
        return true;
      });
    }
    for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
      const property = receivedProperties[i];
      if (expectedProperties.indexOf(property) === -1) {
        const additionalIsObject = isObject$1(schema.additionalProperties);
        if (additionalIsObject && Array.isArray(schema.additionalProperties.oneOf)) {
          const result = draft.resolveOneOf(node.next(schema.additionalProperties), value[property]);
          if (isJsonError(result)) {
            errors2.push(draft.errors.additionalPropertiesError({
              pointer,
              schema: schema.additionalProperties,
              value,
              property: receivedProperties[i],
              properties: expectedProperties,
              // pass all validation errors
              errors: result.data.errors
            }));
          } else {
            errors2.push(...draft.validate(node.next(result, property), value[property]));
          }
        } else if (additionalIsObject) {
          const res = draft.validate(node.next(schema.additionalProperties, property), value[property]);
          errors2.push(...res);
        } else {
          errors2.push(draft.errors.noAdditionalPropertiesError({
            pointer,
            schema,
            value,
            property: receivedProperties[i],
            properties: expectedProperties
          }));
        }
      }
    }
    return errors2;
  },
  allOf: validateAllOf,
  anyOf: validateAnyOf,
  dependencies: validateDependencies,
  enum: (node, value) => {
    const { draft, schema, pointer } = node;
    const type = getTypeOf(value);
    if (type === "object" || type === "array") {
      const valueStr = JSON.stringify(value);
      for (let i = 0; i < schema.enum.length; i += 1) {
        if (JSON.stringify(schema.enum[i]) === valueStr) {
          return void 0;
        }
      }
    } else if (schema.enum.includes(value)) {
      return void 0;
    }
    return draft.errors.enumError({ pointer, schema, value, values: schema.enum });
  },
  format: (node, value) => {
    const { draft, schema } = node;
    if (draft.validateFormat[schema.format]) {
      const errors2 = draft.validateFormat[schema.format](node, value);
      return errors2;
    }
    return void 0;
  },
  items: (node, value) => {
    const { draft, schema, pointer } = node;
    if (schema.items === false) {
      if (Array.isArray(value) && value.length === 0) {
        return void 0;
      }
      return draft.errors.invalidDataError({ pointer, value, schema });
    }
    const errors2 = [];
    for (let i = 0; i < value.length; i += 1) {
      const itemData = value[i];
      const itemNode = draft.step(node.next(schema), i, value);
      if (isJsonError(itemNode)) {
        return [itemNode];
      }
      const itemErrors = draft.validate(itemNode, itemData);
      errors2.push(...itemErrors);
    }
    return errors2;
  },
  maximum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.maximum)) {
      return void 0;
    }
    if (schema.maximum && schema.maximum < value) {
      return draft.errors.maximumError({
        maximum: schema.maximum,
        length: value,
        value,
        pointer,
        schema
      });
    }
    if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === value) {
      return draft.errors.maximumError({
        maximum: schema.maximum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  maxItems: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.maxItems)) {
      return void 0;
    }
    if (schema.maxItems < value.length) {
      return draft.errors.maxItemsError({
        maximum: schema.maxItems,
        length: value.length,
        schema,
        value,
        pointer
      });
    }
    return void 0;
  },
  maxLength: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.maxLength)) {
      return void 0;
    }
    const lengthOfString = ucs2decode(value).length;
    if (schema.maxLength < lengthOfString) {
      return draft.errors.maxLengthError({
        maxLength: schema.maxLength,
        length: lengthOfString,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  maxProperties: (node, value) => {
    const { draft, schema, pointer } = node;
    const propertyCount = Object.keys(value).length;
    if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
      return draft.errors.maxPropertiesError({
        maxProperties: schema.maxProperties,
        length: propertyCount,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  minLength: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.minLength)) {
      return void 0;
    }
    const lengthOfString = ucs2decode(value).length;
    if (schema.minLength > lengthOfString) {
      if (schema.minLength === 1) {
        return draft.errors.minLengthOneError({
          minLength: schema.minLength,
          length: lengthOfString,
          pointer,
          schema,
          value
        });
      }
      return draft.errors.minLengthError({
        minLength: schema.minLength,
        length: lengthOfString,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  minimum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.minimum)) {
      return void 0;
    }
    if (schema.minimum > value) {
      return draft.errors.minimumError({
        minimum: schema.minimum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    if (schema.exclusiveMinimum === true && schema.minimum === value) {
      return draft.errors.minimumError({
        minimum: schema.minimum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  minItems: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.minItems)) {
      return void 0;
    }
    if (schema.minItems > value.length) {
      if (schema.minItems === 1) {
        return draft.errors.minItemsOneError({
          minItems: schema.minItems,
          length: value.length,
          pointer,
          schema,
          value
        });
      }
      return draft.errors.minItemsError({
        minItems: schema.minItems,
        length: value.length,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  minProperties: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.minProperties)) {
      return void 0;
    }
    const propertyCount = Object.keys(value).length;
    if (schema.minProperties > propertyCount) {
      return draft.errors.minPropertiesError({
        minProperties: schema.minProperties,
        length: propertyCount,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  multipleOf: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.multipleOf) || typeof value !== "number") {
      return void 0;
    }
    const valuePrecision = getPrecision(value);
    const multiplePrecision = getPrecision(schema.multipleOf);
    if (valuePrecision > multiplePrecision) {
      return draft.errors.multipleOfError({
        multipleOf: schema.multipleOf,
        value,
        pointer,
        schema
      });
    }
    const precision = Math.pow(10, multiplePrecision);
    const val = Math.round(value * precision);
    const multiple = Math.round(schema.multipleOf * precision);
    if (val % multiple / precision !== 0) {
      return draft.errors.multipleOfError({
        multipleOf: schema.multipleOf,
        value,
        pointer,
        schema
      });
    }
    return void 0;
  },
  not: (node, value) => {
    const { draft, schema, pointer } = node;
    const errors2 = [];
    if (draft.validate(node.next(schema.not), value).length === 0) {
      errors2.push(draft.errors.notError({ value, not: schema.not, pointer, schema }));
    }
    return errors2;
  },
  oneOf: validateOneOf,
  pattern: (node, value) => {
    const { draft, schema, pointer } = node;
    const pattern = new RegExp(schema.pattern, "u");
    if (pattern.test(value) === false) {
      return draft.errors.patternError({
        pattern: schema.pattern,
        description: schema.patternExample || schema.pattern,
        received: value,
        schema,
        value,
        pointer
      });
    }
    return void 0;
  },
  patternProperties: (node, value) => {
    const { draft, schema, pointer } = node;
    const properties = schema.properties || {};
    const pp = schema.patternProperties;
    if (getTypeOf(pp) !== "object") {
      return void 0;
    }
    const errors2 = [];
    const keys = Object.keys(value);
    const patterns = Object.keys(pp).map((expr) => ({
      regex: new RegExp(expr),
      patternSchema: pp[expr]
    }));
    keys.forEach((key) => {
      let patternFound = false;
      for (let i = 0, l = patterns.length; i < l; i += 1) {
        if (patterns[i].regex.test(key)) {
          patternFound = true;
          const valErrors = draft.validate(node.next(patterns[i].patternSchema, key), value[key]);
          if (valErrors && valErrors.length > 0) {
            errors2.push(...valErrors);
          }
        }
      }
      if (properties[key]) {
        return;
      }
      if (patternFound === false && schema.additionalProperties === false) {
        errors2.push(draft.errors.patternPropertiesError({
          key,
          pointer,
          schema,
          value,
          patterns: Object.keys(pp).join(",")
        }));
      }
    });
    return errors2;
  },
  properties: (node, value) => {
    const { draft, schema } = node;
    const errors2 = [];
    const keys = Object.keys(schema.properties || {});
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (hasProperty(value, key)) {
        const itemNode = draft.step(node, key, value);
        if (isJsonError(itemNode)) {
          errors2.push(itemNode);
        } else {
          const keyErrors = draft.validate(itemNode, value[key]);
          errors2.push(...keyErrors);
        }
      }
    }
    return errors2;
  },
  // @todo move to separate file: this is custom keyword validation for JsonEditor.properties keyword
  propertiesRequired: (node, value) => {
    const { draft, schema, pointer } = node;
    const errors2 = [];
    const keys = Object.keys(schema.properties || {});
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (value[key] === void 0) {
        errors2.push(draft.errors.requiredPropertyError({ key, pointer, schema, value }));
      } else {
        const itemNode = draft.step(node, key, value);
        const keyErrors = draft.validate(itemNode, value[key]);
        errors2.push(...keyErrors);
      }
    }
    return errors2;
  },
  required: (node, value) => {
    const { draft, schema, pointer } = node;
    if (Array.isArray(schema.required) === false) {
      return void 0;
    }
    return schema.required.map((property) => {
      if (!hasProperty(value, property)) {
        return draft.errors.requiredPropertyError({
          key: property,
          pointer,
          schema,
          value
        });
      }
      return void 0;
    });
  },
  // @todo move to separate file: this is custom keyword validation for JsonEditor.required keyword
  requiredNotEmpty: (node, value) => {
    const { schema } = node;
    if (Array.isArray(schema.required) === false) {
      return void 0;
    }
    return schema.required.map((property) => {
      const { draft, schema: schema2, pointer } = node;
      if (value[property] == null || value[property] === "") {
        return draft.errors.valueNotEmptyError({
          property,
          pointer: `${pointer}/${property}`,
          schema: schema2,
          value
        });
      }
      return void 0;
    });
  },
  uniqueItems: (node, value) => {
    const { draft, schema, pointer } = node;
    if ((Array.isArray(value) && schema.uniqueItems) === false) {
      return void 0;
    }
    const duplicates = [];
    const errors2 = [];
    value.forEach((item, index2) => {
      for (let i = index2 + 1; i < value.length; i += 1) {
        if (equal(item, value[i]) && !duplicates.includes(i)) {
          errors2.push(draft.errors.uniqueItemsError({
            pointer: `${pointer}/${i}`,
            duplicatePointer: `${pointer}/${index2}`,
            arrayPointer: pointer,
            value: JSON.stringify(item),
            schema
          }));
          duplicates.push(i);
        }
      }
    });
    return errors2;
  }
};
const stepType = {
  array: (node, key, data) => {
    const { draft, schema, pointer } = node;
    const itemValue = data === null || data === void 0 ? void 0 : data[key];
    const itemsType = getTypeOf(schema.items);
    if (itemsType === "object") {
      return reduceSchema(node.next(schema.items, key), itemValue);
    }
    if (itemsType === "array") {
      if (schema.items[key] === true) {
        return node.next(createSchemaOf(itemValue), key);
      }
      if (schema.items[key] === false) {
        return draft.errors.invalidDataError({
          key,
          value: itemValue,
          pointer,
          schema
        });
      }
      if (schema.items[key]) {
        return draft.resolveRef(node.next(schema.items[key], key));
      }
      if (schema.additionalItems === false) {
        return draft.errors.additionalItemsError({
          key,
          value: itemValue,
          pointer,
          schema
        });
      }
      if (schema.additionalItems === true || schema.additionalItems === void 0) {
        return node.next(createSchemaOf(itemValue), key);
      }
      if (getTypeOf(schema.additionalItems) === "object") {
        return node.next(schema.additionalItems, key);
      }
      throw new Error(`Invalid schema ${JSON.stringify(schema, null, 2)} for ${JSON.stringify(data, null, 2)}`);
    }
    if (schema.additionalItems !== false && itemValue) {
      return node.next(createSchemaOf(itemValue), key);
    }
    return new Error(`Invalid array schema for ${key} at ${pointer}`);
  },
  object: (node, key, data) => {
    var _a2, _b;
    const { draft, pointer } = node;
    const reduction = reduceSchema(node, data);
    const schema = (_a2 = reduction.schema) !== null && _a2 !== void 0 ? _a2 : reduction;
    const property = (_b = schema === null || schema === void 0 ? void 0 : schema.properties) === null || _b === void 0 ? void 0 : _b[key];
    if (property !== void 0) {
      if (property === false) {
        return draft.errors.forbiddenPropertyError({
          property: key,
          value: data,
          pointer,
          schema
        });
      } else if (property === true) {
        return node.next(createSchemaOf(data === null || data === void 0 ? void 0 : data[key]), key);
      }
      const nextPropertyNode = draft.resolveRef(node.next(property, key));
      if (isJsonError(nextPropertyNode)) {
        return nextPropertyNode;
      }
      if (nextPropertyNode && Array.isArray(nextPropertyNode.schema.oneOf)) {
        return draft.resolveOneOf(node.next(nextPropertyNode.schema, key), data[key]);
      }
      if (nextPropertyNode) {
        return nextPropertyNode;
      }
    }
    const { patternProperties } = schema;
    if (getTypeOf(patternProperties) === "object") {
      let regex2;
      const patterns = Object.keys(patternProperties);
      for (let i = 0, l = patterns.length; i < l; i += 1) {
        regex2 = new RegExp(patterns[i]);
        if (regex2.test(key)) {
          return node.next(patternProperties[patterns[i]], key);
        }
      }
    }
    const { additionalProperties } = schema;
    if (getTypeOf(additionalProperties) === "object") {
      return node.next(schema.additionalProperties, key);
    }
    if (data && (additionalProperties === void 0 || additionalProperties === true)) {
      const generatedSchema = createSchemaOf(data[key]);
      return generatedSchema ? node.next(generatedSchema, key) : void 0;
    }
    return draft.errors.unknownPropertyError({
      property: key,
      value: data,
      pointer: `${pointer}`,
      schema
    });
  }
};
function step(node, key, data) {
  var _a2;
  const { draft, schema, pointer } = node;
  const typeOfData = getTypeOf(data);
  let schemaType = (_a2 = schema.type) !== null && _a2 !== void 0 ? _a2 : typeOfData;
  if (Array.isArray(schemaType)) {
    if (!schemaType.includes(typeOfData)) {
      return draft.errors.typeError({
        value: data,
        pointer,
        expected: schema.type,
        received: typeOfData,
        schema
      });
    }
    schemaType = typeOfData;
  }
  const stepFunction = stepType[schemaType];
  if (stepFunction) {
    const childNode = stepFunction(node, `${key}`, data);
    if (childNode === void 0) {
      return draft.errors.schemaWarning({ pointer, value: data, schema, key });
    }
    return childNode;
  }
  return new Error(`Unsupported schema type ${schema.type} for key ${key}`);
}
const typeValidators = {
  array: (node, value) => node.draft.typeKeywords.array.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  object: (node, value) => node.draft.typeKeywords.object.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  string: (node, value) => node.draft.typeKeywords.string.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  integer: (node, value) => node.draft.typeKeywords.number.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  number: (node, value) => node.draft.typeKeywords.number.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  boolean: (node, value) => node.draft.typeKeywords.boolean.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value)),
  null: (node, value) => node.draft.typeKeywords.null.filter((key) => node.schema && node.schema[key] != null).map((key) => node.draft.validateKeyword[key](node, value))
};
function getJsonSchemaType(value, expectedType) {
  const jsType = getTypeOf(value);
  if (jsType === "number" && (expectedType === "integer" || Array.isArray(expectedType) && expectedType.includes("integer"))) {
    return Number.isInteger(value) || isNaN(value) ? "integer" : "number";
  }
  return jsType;
}
function validate(node, value) {
  if (!isSchemaNode(node)) {
    throw new Error("node expected");
  }
  const { draft, pointer } = node;
  node = node.resolveRef();
  const schema = node.schema;
  if (schema == null) {
    throw new Error("missing schema");
  }
  if (getTypeOf(schema) === "boolean") {
    if (schema) {
      return [];
    }
    return [draft.errors.invalidDataError({ pointer, schema, value })];
  }
  if (isJsonError(schema)) {
    return [schema];
  }
  if (schema.const !== void 0) {
    if (equal(schema.const, value)) {
      return [];
    }
    return [draft.errors.constError({ pointer, schema, value, expected: schema.const })];
  }
  const receivedType = getJsonSchemaType(value, schema.type);
  const expectedType = schema.type || receivedType;
  if (receivedType !== expectedType && (!Array.isArray(expectedType) || !expectedType.includes(receivedType))) {
    return [
      draft.errors.typeError({
        pointer,
        schema,
        value,
        received: receivedType,
        expected: expectedType
      })
    ];
  }
  if (draft.validateType[receivedType] == null) {
    return [draft.errors.invalidTypeError({ pointer, schema, value, receivedType })];
  }
  const errors2 = flattenArray(draft.validateType[receivedType](node, value));
  return errors2.filter(errorOrPromise);
}
function each(schemaNode, data, callback) {
  const node = schemaNode.resolveRef();
  const { draft, schema, pointer } = node;
  callback(schema, data, pointer);
  const dataType = getTypeOf(data);
  if (dataType === "object") {
    Object.keys(data).forEach((key) => {
      const nextNode = draft.step(node, key, data);
      if (isSchemaNode(nextNode)) {
        each(nextNode, data[key], callback);
      }
    });
  } else if (dataType === "array") {
    data.forEach((next2, key) => {
      const nextNode = draft.step(node, key, data);
      if (isSchemaNode(nextNode)) {
        each(nextNode, data[key], callback);
      }
    });
  }
}
function addRemoteSchema(draft, url, schema) {
  schema.$id = schema.$id || url;
  draft.remotes[url] = draft.compileSchema(schema);
}
const COMPILED = "__compiled";
const COMPILED_REF = "__ref";
const GET_REF = "getRef";
const GET_ROOT = "getRoot";
const GET_CONTEXT = "getContext";
const suffixes = /(#|\/)+$/g;
function compileSchema(draft, schemaToCompile, rootSchema = schemaToCompile, force = false) {
  if (schemaToCompile === true || schemaToCompile === false || schemaToCompile === void 0) {
    return schemaToCompile;
  }
  if (schemaToCompile[COMPILED] !== void 0) {
    return schemaToCompile;
  }
  const context = { ids: {}, anchors: {}, remotes: draft.remotes };
  const rootSchemaAsString = JSON.stringify(schemaToCompile);
  const compiledSchema = JSON.parse(rootSchemaAsString);
  Object.defineProperties(compiledSchema, {
    [COMPILED]: { enumerable: false, value: true },
    [GET_CONTEXT]: { enumerable: false, value: () => context },
    [GET_REF]: {
      enumerable: false,
      value: getRef.bind(null, context, compiledSchema)
    }
  });
  if (force === false && rootSchemaAsString.includes("$ref") === false) {
    return compiledSchema;
  }
  if (compiledSchema !== rootSchema) {
    Object.defineProperty(compiledSchema, "$defs", {
      enumerable: true,
      value: Object.assign({}, rootSchema.definitions, rootSchema.$defs, compiledSchema.definitions, compiledSchema.$defs)
    });
  }
  const scopes = {};
  const getRoot = () => compiledSchema;
  eachSchema(compiledSchema, (schema, pointer) => {
    var _a2;
    if (schema.$id) {
      if (schema.$id.startsWith("http") && /(allOf|anyOf|oneOf|if)\/\d+$/.test(pointer)) {
        const parentPointer2 = pointer.replace(/\/(allOf|anyOf|oneOf|if)\/\d+$/, "");
        const parentSchema = jsonPointerExports.get(compiledSchema, parentPointer2);
        schema.$id = (_a2 = parentSchema.$id) !== null && _a2 !== void 0 ? _a2 : schema.$id;
      }
      context.ids[schema.$id.replace(suffixes, "")] = pointer;
    }
    pointer = `#${pointer}`.replace(/##+/, "#");
    const previousPointer = pointer.replace(/\/[^/]+$/, "");
    const parentPointer = pointer.replace(/\/[^/]+\/[^/]+$/, "");
    const previousScope = scopes[previousPointer] || scopes[parentPointer];
    const scope = joinScope(previousScope, schema.$id);
    scopes[pointer] = scope;
    if (context.ids[scope] == null) {
      context.ids[scope] = pointer;
    }
    if (schema.$anchor) {
      context.anchors[`${scope}#${schema.$anchor}`] = pointer;
    }
    if (schema.$ref && !schema[COMPILED_REF]) {
      Object.defineProperty(schema, COMPILED_REF, {
        enumerable: false,
        value: joinScope(scope, schema.$ref)
      });
      Object.defineProperty(schema, GET_ROOT, { enumerable: false, value: getRoot });
    }
  });
  return compiledSchema;
}
const KeywordValidation$1 = {
  ...KeywordValidation$2,
  // @draft >= 6
  contains: (node, value) => {
    var _a2, _b;
    const { draft, schema, pointer } = node;
    if (schema.contains === false) {
      return draft.errors.containsArrayError({ pointer, value, schema });
    }
    if (schema.contains === true) {
      if (Array.isArray(value) && value.length === 0) {
        return draft.errors.containsAnyError({ pointer, value, schema });
      }
      return void 0;
    }
    if (getTypeOf(schema.contains) !== "object") {
      return void 0;
    }
    let count = 0;
    for (let i = 0; i < value.length; i += 1) {
      if (draft.validate(node.next(schema.contains, i), value[i]).length === 0) {
        count++;
      }
    }
    const max = (_a2 = schema.maxContains) !== null && _a2 !== void 0 ? _a2 : Infinity;
    const min = (_b = schema.minContains) !== null && _b !== void 0 ? _b : 1;
    if (max >= count && min <= count) {
      return void 0;
    }
    if (max < count) {
      return draft.errors.containsMaxError({ pointer, schema, delta: count - max, value });
    }
    if (min > count) {
      return draft.errors.containsMinError({ pointer, schema, delta: min - count, value });
    }
    return draft.errors.containsError({ pointer, schema, value });
  },
  exclusiveMaximum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.exclusiveMaximum)) {
      return void 0;
    }
    if (schema.exclusiveMaximum <= value) {
      return draft.errors.maximumError({
        maximum: schema.exclusiveMaximum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  exclusiveMinimum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.exclusiveMinimum)) {
      return void 0;
    }
    if (schema.exclusiveMinimum >= value) {
      return draft.errors.minimumError({
        minimum: schema.exclusiveMinimum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  // @feature if-then-else
  if: validateIf,
  maximum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.maximum)) {
      return void 0;
    }
    if (schema.maximum && schema.maximum < value) {
      return draft.errors.maximumError({
        maximum: schema.maximum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  minimum: (node, value) => {
    const { draft, schema, pointer } = node;
    if (isNaN(schema.minimum)) {
      return void 0;
    }
    if (schema.minimum > value) {
      return draft.errors.minimumError({
        minimum: schema.minimum,
        length: value,
        pointer,
        schema,
        value
      });
    }
    return void 0;
  },
  patternProperties: (node, value) => {
    const { draft, schema, pointer } = node;
    const properties = schema.properties || {};
    const pp = schema.patternProperties;
    if (getTypeOf(pp) !== "object") {
      return void 0;
    }
    const errors2 = [];
    const keys = Object.keys(value);
    const patterns = Object.keys(pp).map((expr) => ({
      regex: new RegExp(expr),
      patternSchema: pp[expr]
    }));
    keys.forEach((key) => {
      let patternFound = false;
      for (let i = 0, l = patterns.length; i < l; i += 1) {
        if (patterns[i].regex.test(key)) {
          patternFound = true;
          if (patterns[i].patternSchema === false) {
            errors2.push(draft.errors.patternPropertiesError({
              key,
              pointer,
              patterns: Object.keys(pp).join(","),
              schema,
              value
            }));
            return;
          }
          const valErrors = draft.validate(node.next(patterns[i].patternSchema, key), value[key]);
          if (valErrors && valErrors.length > 0) {
            errors2.push(...valErrors);
          }
        }
      }
      if (properties[key]) {
        return;
      }
      if (patternFound === false && schema.additionalProperties === false) {
        errors2.push(draft.errors.patternPropertiesError({
          key,
          pointer,
          patterns: Object.keys(pp).join(","),
          schema,
          value
        }));
      }
    });
    return errors2;
  },
  // @draft >= 6
  propertyNames: (node, value) => {
    const { draft, schema, pointer } = node;
    if (schema.propertyNames === false) {
      if (Object.keys(value).length === 0) {
        return void 0;
      }
      return draft.errors.invalidPropertyNameError({
        property: Object.keys(value),
        pointer,
        value,
        schema
      });
    }
    if (schema.propertyNames === true) {
      return void 0;
    }
    if (getTypeOf(schema.propertyNames) !== "object") {
      return void 0;
    }
    const errors2 = [];
    const properties = Object.keys(value);
    const propertySchema = { ...schema.propertyNames, type: "string" };
    properties.forEach((prop) => {
      const nextNode = node.next(propertySchema, prop);
      const validationResult = draft.validate(nextNode, prop);
      if (validationResult.length > 0) {
        errors2.push(draft.errors.invalidPropertyNameError({
          property: prop,
          pointer,
          validationError: validationResult[0],
          value: value[prop],
          schema
        }));
      }
    });
    return errors2;
  }
};
const getPatternTests = (patternProperties) => isObject$1(patternProperties) ? Object.keys(patternProperties).map((pattern) => new RegExp(pattern)) : [];
function isPropertyEvaluated(schemaNode, propertyName, value) {
  var _a2, _b;
  const node = schemaNode.draft.resolveRef(schemaNode);
  const { schema } = node;
  if (schema.additionalProperties === true) {
    return true;
  }
  if ((_a2 = schema.properties) === null || _a2 === void 0 ? void 0 : _a2[propertyName]) {
    const nextSchema = (_b = schema.properties) === null || _b === void 0 ? void 0 : _b[propertyName];
    if (node.draft.isValid(value, nextSchema)) {
      return true;
    }
  }
  const patterns = getPatternTests(schema.patternProperties);
  if (patterns.find((pattern) => pattern.test(propertyName))) {
    return true;
  }
  if (isObject$1(schema.additionalProperties)) {
    const nextSchema = schema.additionalProperties;
    return node.draft.validate(node.next(nextSchema), value);
  }
  return false;
}
const KeywordValidation = {
  ...KeywordValidation$1,
  dependencies: void 0,
  dependentSchemas: validateDependentSchemas,
  dependentRequired: validateDependentRequired,
  /**
   * @draft >= 2019-09
   * Similar to additionalProperties, but can "see" into subschemas and across references
   * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.2.4
   */
  unevaluatedProperties: (node, value) => {
    var _a2;
    const { draft, schema, pointer } = node;
    if (!isObject$1(value) || schema.unevaluatedProperties == null) {
      return void 0;
    }
    let unevaluated = Object.keys(value);
    if (unevaluated.length === 0) {
      return void 0;
    }
    const reduction = reduceSchema(node, value);
    const resolvedSchema = (_a2 = reduction.schema) !== null && _a2 !== void 0 ? _a2 : reduction;
    if (resolvedSchema.unevaluatedProperties === true) {
      return void 0;
    }
    const testPatterns = getPatternTests(resolvedSchema.patternProperties);
    unevaluated = unevaluated.filter((key) => {
      var _a3;
      if ((_a3 = resolvedSchema.properties) === null || _a3 === void 0 ? void 0 : _a3[key]) {
        return false;
      }
      if (isObject$1(schema.if) && isPropertyEvaluated(node.next({ type: "object", ...schema.if }), key, value[key])) {
        return false;
      }
      if (testPatterns.find((pattern) => pattern.test(key))) {
        return false;
      }
      if (resolvedSchema.additionalProperties) {
        return false;
      }
      return true;
    });
    if (unevaluated.length === 0) {
      return void 0;
    }
    const errors2 = [];
    if (resolvedSchema.unevaluatedProperties === false) {
      unevaluated.forEach((key) => {
        errors2.push(draft.errors.unevaluatedPropertyError({
          pointer: `${pointer}/${key}`,
          value: JSON.stringify(value[key]),
          schema
        }));
      });
      return errors2;
    }
    unevaluated.forEach((key) => {
      if (isObject$1(resolvedSchema.unevaluatedProperties)) {
        const keyErrors = draft.validate(node.next(resolvedSchema.unevaluatedProperties, key), value[key]);
        errors2.push(...keyErrors);
      }
    });
    return errors2;
  },
  /**
   * @draft >= 2019-09
   * Similar to additionalItems, but can "see" into subschemas and across references
   * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
   */
  unevaluatedItems: (node, value) => {
    var _a2;
    const { draft, schema, pointer } = node;
    if (!Array.isArray(value) || value.length === 0 || schema.unevaluatedItems == null || schema.unevaluatedItems === true) {
      return void 0;
    }
    const reduction = reduceSchema(draft.resolveRef(node), value);
    const resolvedSchema = (_a2 = reduction.schema) !== null && _a2 !== void 0 ? _a2 : reduction;
    if (resolvedSchema.unevaluatedItems === true || resolvedSchema.additionalItems === true) {
      return void 0;
    }
    if (isObject$1(schema.if)) {
      const nextSchemaNode = { type: "array", ...schema.if };
      if (draft.isValid(value, nextSchemaNode)) {
        if (Array.isArray(nextSchemaNode.items) && nextSchemaNode.items.length === value.length) {
          return void 0;
        }
      }
    }
    if (isObject$1(resolvedSchema.items)) {
      const nextSchemaNode = { ...resolvedSchema, unevaluatedItems: void 0 };
      const errors3 = draft.validate(node.next(nextSchemaNode), value);
      return errors3.map((e) => draft.errors.unevaluatedItemsError({ ...e.data }));
    }
    if (Array.isArray(resolvedSchema.items)) {
      const items = [];
      for (let i = resolvedSchema.items.length; i < value.length; i += 1) {
        if (i < resolvedSchema.items.length) {
          if (draft.validate(node.next(resolvedSchema.items[i], i), value[i]).length > 0) {
            items.push({ index: i, value: value[i] });
          }
        } else {
          items.push({ index: i, value: value[i] });
        }
      }
      return items.map((item) => draft.errors.unevaluatedItemsError({
        pointer: `${pointer}/${item.index}`,
        value: JSON.stringify(item.value),
        schema: resolvedSchema.unevaluatedItems
      }));
    }
    if (isObject$1(resolvedSchema.unevaluatedItems)) {
      return value.map((item, index2) => {
        if (!draft.isValid(item, resolvedSchema.unevaluatedItems)) {
          return draft.errors.unevaluatedItemsError({
            pointer: `${pointer}/${index2}`,
            value: JSON.stringify(item),
            schema: resolvedSchema.unevaluatedItems
          });
        }
      });
    }
    const errors2 = [];
    value.forEach((item, index2) => {
      errors2.push(draft.errors.unevaluatedItemsError({
        pointer: `${pointer}/${index2}`,
        value: JSON.stringify(item),
        schema
      }));
    });
    return errors2;
  }
};
const draft2019Config = {
  typeKeywords: {
    array: [
      "allOf",
      "anyOf",
      "contains",
      "enum",
      "if",
      "items",
      "maxItems",
      "minItems",
      "not",
      "oneOf",
      "unevaluatedItems",
      "uniqueItems"
    ],
    boolean: ["allOf", "anyOf", "enum", "not", "oneOf"],
    object: [
      "additionalProperties",
      "allOf",
      "anyOf",
      "dependencies",
      "dependentSchemas",
      "dependentRequired",
      "enum",
      "format",
      "if",
      "maxProperties",
      "minProperties",
      "not",
      "oneOf",
      "patternProperties",
      "properties",
      "propertyNames",
      "required",
      "unevaluatedProperties"
      // 2019-09
    ],
    string: [
      "allOf",
      "anyOf",
      "enum",
      "format",
      "if",
      "maxLength",
      "minLength",
      "not",
      "oneOf",
      "pattern"
    ],
    number: [
      "allOf",
      "anyOf",
      "enum",
      "exclusiveMaximum",
      "exclusiveMinimum",
      "format",
      "if",
      "maximum",
      "minimum",
      "multipleOf",
      "not",
      "oneOf"
    ],
    null: ["allOf", "anyOf", "enum", "format", "not", "oneOf"]
  },
  validateKeyword: KeywordValidation,
  validateType: typeValidators,
  validateFormat: formatValidators,
  errors,
  createNode,
  addRemoteSchema,
  compileSchema,
  createSchemaOf,
  each,
  eachSchema,
  getChildSchemaSelection,
  getSchema,
  getTemplate: getTemplate$1,
  isValid,
  resolveAllOf,
  resolveAnyOf,
  resolveOneOf,
  resolveRef: resolveRef$1,
  step,
  validate,
  templateDefaultOptions: settings.templateDefaultOptions
};
class Draft2019 extends Draft {
  constructor(schema, config = {}) {
    super(merge(draft2019Config, config), schema);
  }
}
class EventEmitter {
  listeners = {};
  onListener = {};
  on(event, handler) {
    let onListener = this.onListener[event];
    if (onListener) {
      onListener(handler);
    }
    let listeners;
    let maybeListeners = this.listeners[event];
    if (maybeListeners) {
      listeners = maybeListeners;
    } else {
      listeners = [];
      this.listeners[event] = listeners;
    }
    listeners.push(handler);
    return () => {
      let index2 = listeners.indexOf(handler);
      if (index2 != -1) {
        listeners.splice(index2, 1);
      }
    };
  }
  once(event, handler) {
    let disconnect = this.on(event, (value) => {
      handler(value);
      disconnect();
    });
    return disconnect;
  }
  next(event) {
    return new Promise((resolve) => {
      this.once(event, (value) => {
        resolve(value);
      });
    });
  }
  emit(event, value) {
    (this.listeners[event] || []).forEach((handler) => {
      handler(value);
    });
  }
}
class Config extends EventEmitter {
  _data = {};
  get data() {
    return this._data;
  }
  update(data) {
    this._data = data;
    this.emit("change", data);
  }
  extend(schema) {
    return new ConfigExtension(schema, this);
  }
}
class ConfigExtension extends EventEmitter {
  constructor(schema, parent) {
    super();
    this.parent = parent;
    this.draft = new Draft2019({ ...schema, type: "object" });
    this._data = this.getTemplate();
    this.parent.on("change", () => {
      this._data = this.getTemplate();
      this.emit("change", this.data);
    });
  }
  draft;
  _data;
  get data() {
    return this._data;
  }
  getTemplate() {
    return this.draft.getTemplate(this.parent.data, void 0, {
      addOptionalProps: false
    });
  }
}
function readInt32(data) {
  let value = new DataView(data.buffer).getInt32(data.byteOffset);
  return [value, data.subarray(4)];
}
function readFloat32(data) {
  let value = new DataView(data.buffer).getFloat32(data.byteOffset);
  return [value, data.subarray(4)];
}
function readString(data) {
  let length = 0;
  while (length < data.length && data[length] !== 0) {
    length++;
  }
  let text = new require$$2$1.TextDecoder().decode(data.subarray(0, length));
  return [text, data.subarray(chunkSize(length + 1))];
}
function readBlob(data) {
  let size = new DataView(data.buffer).getInt32(data.byteOffset);
  let blob = data.subarray(4, size + 4);
  return [blob, data.subarray(chunkSize(size + 4))];
}
function readTimestamp(data) {
  let seconds = new DataView(data.buffer).getUint32(data.byteOffset);
  let fracSeconds = new DataView(data.buffer).getUint32(data.byteOffset + 4);
  return [[seconds, fracSeconds], data.subarray(8)];
}
function chunkSize(bytes) {
  return bytes + 3 & -4;
}
function parse(data) {
  let address;
  [address, data] = readString(data);
  if (address === "#bundle") {
    let ntpTime;
    [ntpTime, data] = readTimestamp(data);
    let packets = [];
    while (data.length > 0) {
      let packetSize;
      [packetSize, data] = readInt32(data);
      if (data.length < packetSize) {
        throw Error("Unexpected end of bundle");
      }
      packets.push(parse(data.subarray(0, packetSize)));
      data = data.subarray(packetSize);
    }
    return { time: 0, ntpTime, packets };
  } else if (address[0] === "/") {
    let types;
    [types, data] = readString(data);
    if (types === "") {
      return { address, args: [], argTypes: [] };
    } else {
      types = types.slice(1);
      let [argTypes, args2] = readArguments(types, data);
      return { address, args: args2, argTypes };
    }
  } else {
    throw Error(`Data is neither an OSC message or bundle`);
  }
}
function readArguments(typeString, data, nested = false) {
  let argTypes = [];
  let argValues = [];
  for (let type of typeString) {
    let argValue;
    if (type === "i") {
      argTypes.push(type);
      [argValue, data] = readInt32(data);
      argValues.push(argValue);
    } else if (type === "f") {
      argTypes.push(type);
      [argValue, data] = readFloat32(data);
      argValues.push(argValue);
    } else if (type === "s") {
      argTypes.push(type);
      [argValue, data] = readString(data);
      argValues.push(argValue);
    } else if (type === "b") {
      argTypes.push(type);
      [argValue, data] = readBlob(data);
      argValues.push(argValue);
    } else {
      throw Error(
        `Unrecognized argument type "${type}" (${type.codePointAt(0)})`
      );
    }
  }
  if (nested) {
    throw Error();
  }
  return [argTypes, argValues, data];
}
class Engine extends EventEmitter {
  constructor() {
    super();
  }
}
const TidalSettingsSchema = {
  properties: {
    // environment: { const: "ghci" },
    "tidal.boot.useDefaultFile": { type: "boolean", default: true },
    "tidal.boot.customFiles": { type: "array", items: { type: "string" } },
    "tidal.boot.disableEditorIntegration": { type: "boolean", default: false }
  }
};
var lrucache;
var hasRequiredLrucache;
function requireLrucache() {
  if (hasRequiredLrucache) return lrucache;
  hasRequiredLrucache = 1;
  class LRUCache {
    constructor() {
      this.max = 1e3;
      this.map = /* @__PURE__ */ new Map();
    }
    get(key) {
      const value = this.map.get(key);
      if (value === void 0) {
        return void 0;
      } else {
        this.map.delete(key);
        this.map.set(key, value);
        return value;
      }
    }
    delete(key) {
      return this.map.delete(key);
    }
    set(key, value) {
      const deleted = this.delete(key);
      if (!deleted && value !== void 0) {
        if (this.map.size >= this.max) {
          const firstKey = this.map.keys().next().value;
          this.delete(firstKey);
        }
        this.map.set(key, value);
      }
      return this;
    }
  }
  lrucache = LRUCache;
  return lrucache;
}
var parseOptions_1;
var hasRequiredParseOptions;
function requireParseOptions() {
  if (hasRequiredParseOptions) return parseOptions_1;
  hasRequiredParseOptions = 1;
  const looseOption = Object.freeze({ loose: true });
  const emptyOpts = Object.freeze({});
  const parseOptions = (options) => {
    if (!options) {
      return emptyOpts;
    }
    if (typeof options !== "object") {
      return looseOption;
    }
    return options;
  };
  parseOptions_1 = parseOptions;
  return parseOptions_1;
}
var re = { exports: {} };
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  const SEMVER_SPEC_VERSION = "2.0.0";
  const MAX_LENGTH = 256;
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991;
  const MAX_SAFE_COMPONENT_LENGTH = 16;
  const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
  const RELEASE_TYPES = [
    "major",
    "premajor",
    "minor",
    "preminor",
    "patch",
    "prepatch",
    "prerelease"
  ];
  constants = {
    MAX_LENGTH,
    MAX_SAFE_COMPONENT_LENGTH,
    MAX_SAFE_BUILD_LENGTH,
    MAX_SAFE_INTEGER,
    RELEASE_TYPES,
    SEMVER_SPEC_VERSION,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  };
  return constants;
}
var debug_1;
var hasRequiredDebug;
function requireDebug() {
  if (hasRequiredDebug) return debug_1;
  hasRequiredDebug = 1;
  const debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args2) => console.error("SEMVER", ...args2) : () => {
  };
  debug_1 = debug;
  return debug_1;
}
var hasRequiredRe;
function requireRe() {
  if (hasRequiredRe) return re.exports;
  hasRequiredRe = 1;
  (function(module, exports) {
    const {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = requireConstants();
    const debug = requireDebug();
    exports = module.exports = {};
    const re2 = exports.re = [];
    const safeRe = exports.safeRe = [];
    const src = exports.src = [];
    const safeSrc = exports.safeSrc = [];
    const t = exports.t = {};
    let R = 0;
    const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    const safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    const makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    const createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index2 = R++;
      debug(name, index2, value);
      t[name] = index2;
      src[index2] = value;
      safeSrc[index2] = safe;
      re2[index2] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index2] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NUMERICIDENTIFIER]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NUMERICIDENTIFIERLOOSE]}|${src[t.NONNUMERICIDENTIFIER]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(re, re.exports);
  return re.exports;
}
var identifiers;
var hasRequiredIdentifiers;
function requireIdentifiers() {
  if (hasRequiredIdentifiers) return identifiers;
  hasRequiredIdentifiers = 1;
  const numeric = /^[0-9]+$/;
  const compareIdentifiers = (a, b) => {
    const anum = numeric.test(a);
    const bnum = numeric.test(b);
    if (anum && bnum) {
      a = +a;
      b = +b;
    }
    return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
  };
  const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
  identifiers = {
    compareIdentifiers,
    rcompareIdentifiers
  };
  return identifiers;
}
var semver;
var hasRequiredSemver;
function requireSemver() {
  if (hasRequiredSemver) return semver;
  hasRequiredSemver = 1;
  const debug = requireDebug();
  const { MAX_LENGTH, MAX_SAFE_INTEGER } = requireConstants();
  const { safeRe: re2, safeSrc: src, t } = requireRe();
  const parseOptions = requireParseOptions();
  const { compareIdentifiers } = requireIdentifiers();
  class SemVer {
    constructor(version, options) {
      options = parseOptions(options);
      if (version instanceof SemVer) {
        if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
          return version;
        } else {
          version = version.version;
        }
      } else if (typeof version !== "string") {
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
      }
      if (version.length > MAX_LENGTH) {
        throw new TypeError(
          `version is longer than ${MAX_LENGTH} characters`
        );
      }
      debug("SemVer", version, options);
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      const m = version.trim().match(options.loose ? re2[t.LOOSE] : re2[t.FULL]);
      if (!m) {
        throw new TypeError(`Invalid Version: ${version}`);
      }
      this.raw = version;
      this.major = +m[1];
      this.minor = +m[2];
      this.patch = +m[3];
      if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
        throw new TypeError("Invalid major version");
      }
      if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
        throw new TypeError("Invalid minor version");
      }
      if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
        throw new TypeError("Invalid patch version");
      }
      if (!m[4]) {
        this.prerelease = [];
      } else {
        this.prerelease = m[4].split(".").map((id) => {
          if (/^[0-9]+$/.test(id)) {
            const num = +id;
            if (num >= 0 && num < MAX_SAFE_INTEGER) {
              return num;
            }
          }
          return id;
        });
      }
      this.build = m[5] ? m[5].split(".") : [];
      this.format();
    }
    format() {
      this.version = `${this.major}.${this.minor}.${this.patch}`;
      if (this.prerelease.length) {
        this.version += `-${this.prerelease.join(".")}`;
      }
      return this.version;
    }
    toString() {
      return this.version;
    }
    compare(other) {
      debug("SemVer.compare", this.version, this.options, other);
      if (!(other instanceof SemVer)) {
        if (typeof other === "string" && other === this.version) {
          return 0;
        }
        other = new SemVer(other, this.options);
      }
      if (other.version === this.version) {
        return 0;
      }
      return this.compareMain(other) || this.comparePre(other);
    }
    compareMain(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
    }
    comparePre(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      if (this.prerelease.length && !other.prerelease.length) {
        return -1;
      } else if (!this.prerelease.length && other.prerelease.length) {
        return 1;
      } else if (!this.prerelease.length && !other.prerelease.length) {
        return 0;
      }
      let i = 0;
      do {
        const a = this.prerelease[i];
        const b = other.prerelease[i];
        debug("prerelease compare", i, a, b);
        if (a === void 0 && b === void 0) {
          return 0;
        } else if (b === void 0) {
          return 1;
        } else if (a === void 0) {
          return -1;
        } else if (a === b) {
          continue;
        } else {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    compareBuild(other) {
      if (!(other instanceof SemVer)) {
        other = new SemVer(other, this.options);
      }
      let i = 0;
      do {
        const a = this.build[i];
        const b = other.build[i];
        debug("build compare", i, a, b);
        if (a === void 0 && b === void 0) {
          return 0;
        } else if (b === void 0) {
          return 1;
        } else if (a === void 0) {
          return -1;
        } else if (a === b) {
          continue;
        } else {
          return compareIdentifiers(a, b);
        }
      } while (++i);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(release, identifier, identifierBase) {
      if (release.startsWith("pre")) {
        if (!identifier && identifierBase === false) {
          throw new Error("invalid increment argument: identifier is empty");
        }
        if (identifier) {
          const r = new RegExp(`^${this.options.loose ? src[t.PRERELEASELOOSE] : src[t.PRERELEASE]}$`);
          const match = `-${identifier}`.match(r);
          if (!match || match[1] !== identifier) {
            throw new Error(`invalid identifier: ${identifier}`);
          }
        }
      }
      switch (release) {
        case "premajor":
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor = 0;
          this.major++;
          this.inc("pre", identifier, identifierBase);
          break;
        case "preminor":
          this.prerelease.length = 0;
          this.patch = 0;
          this.minor++;
          this.inc("pre", identifier, identifierBase);
          break;
        case "prepatch":
          this.prerelease.length = 0;
          this.inc("patch", identifier, identifierBase);
          this.inc("pre", identifier, identifierBase);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          if (this.prerelease.length === 0) {
            this.inc("patch", identifier, identifierBase);
          }
          this.inc("pre", identifier, identifierBase);
          break;
        case "release":
          if (this.prerelease.length === 0) {
            throw new Error(`version ${this.raw} is not a prerelease`);
          }
          this.prerelease.length = 0;
          break;
        case "major":
          if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
            this.major++;
          }
          this.minor = 0;
          this.patch = 0;
          this.prerelease = [];
          break;
        case "minor":
          if (this.patch !== 0 || this.prerelease.length === 0) {
            this.minor++;
          }
          this.patch = 0;
          this.prerelease = [];
          break;
        case "patch":
          if (this.prerelease.length === 0) {
            this.patch++;
          }
          this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const base = Number(identifierBase) ? 1 : 0;
          if (this.prerelease.length === 0) {
            this.prerelease = [base];
          } else {
            let i = this.prerelease.length;
            while (--i >= 0) {
              if (typeof this.prerelease[i] === "number") {
                this.prerelease[i]++;
                i = -2;
              }
            }
            if (i === -1) {
              if (identifier === this.prerelease.join(".") && identifierBase === false) {
                throw new Error("invalid increment argument: identifier already exists");
              }
              this.prerelease.push(base);
            }
          }
          if (identifier) {
            let prerelease = [identifier, base];
            if (identifierBase === false) {
              prerelease = [identifier];
            }
            if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
              if (isNaN(this.prerelease[1])) {
                this.prerelease = prerelease;
              }
            } else {
              this.prerelease = prerelease;
            }
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${release}`);
      }
      this.raw = this.format();
      if (this.build.length) {
        this.raw += `+${this.build.join(".")}`;
      }
      return this;
    }
  }
  semver = SemVer;
  return semver;
}
var compare_1;
var hasRequiredCompare;
function requireCompare() {
  if (hasRequiredCompare) return compare_1;
  hasRequiredCompare = 1;
  const SemVer = requireSemver();
  const compare2 = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
  compare_1 = compare2;
  return compare_1;
}
var eq_1;
var hasRequiredEq;
function requireEq() {
  if (hasRequiredEq) return eq_1;
  hasRequiredEq = 1;
  const compare2 = requireCompare();
  const eq = (a, b, loose) => compare2(a, b, loose) === 0;
  eq_1 = eq;
  return eq_1;
}
var neq_1;
var hasRequiredNeq;
function requireNeq() {
  if (hasRequiredNeq) return neq_1;
  hasRequiredNeq = 1;
  const compare2 = requireCompare();
  const neq = (a, b, loose) => compare2(a, b, loose) !== 0;
  neq_1 = neq;
  return neq_1;
}
var gt_1;
var hasRequiredGt;
function requireGt() {
  if (hasRequiredGt) return gt_1;
  hasRequiredGt = 1;
  const compare2 = requireCompare();
  const gt = (a, b, loose) => compare2(a, b, loose) > 0;
  gt_1 = gt;
  return gt_1;
}
var gte_1;
var hasRequiredGte;
function requireGte() {
  if (hasRequiredGte) return gte_1;
  hasRequiredGte = 1;
  const compare2 = requireCompare();
  const gte = (a, b, loose) => compare2(a, b, loose) >= 0;
  gte_1 = gte;
  return gte_1;
}
var lt_1;
var hasRequiredLt;
function requireLt() {
  if (hasRequiredLt) return lt_1;
  hasRequiredLt = 1;
  const compare2 = requireCompare();
  const lt = (a, b, loose) => compare2(a, b, loose) < 0;
  lt_1 = lt;
  return lt_1;
}
var lte_1;
var hasRequiredLte;
function requireLte() {
  if (hasRequiredLte) return lte_1;
  hasRequiredLte = 1;
  const compare2 = requireCompare();
  const lte = (a, b, loose) => compare2(a, b, loose) <= 0;
  lte_1 = lte;
  return lte_1;
}
var cmp_1;
var hasRequiredCmp;
function requireCmp() {
  if (hasRequiredCmp) return cmp_1;
  hasRequiredCmp = 1;
  const eq = requireEq();
  const neq = requireNeq();
  const gt = requireGt();
  const gte = requireGte();
  const lt = requireLt();
  const lte = requireLte();
  const cmp = (a, op, b, loose) => {
    switch (op) {
      case "===":
        if (typeof a === "object") {
          a = a.version;
        }
        if (typeof b === "object") {
          b = b.version;
        }
        return a === b;
      case "!==":
        if (typeof a === "object") {
          a = a.version;
        }
        if (typeof b === "object") {
          b = b.version;
        }
        return a !== b;
      case "":
      case "=":
      case "==":
        return eq(a, b, loose);
      case "!=":
        return neq(a, b, loose);
      case ">":
        return gt(a, b, loose);
      case ">=":
        return gte(a, b, loose);
      case "<":
        return lt(a, b, loose);
      case "<=":
        return lte(a, b, loose);
      default:
        throw new TypeError(`Invalid operator: ${op}`);
    }
  };
  cmp_1 = cmp;
  return cmp_1;
}
var comparator;
var hasRequiredComparator;
function requireComparator() {
  if (hasRequiredComparator) return comparator;
  hasRequiredComparator = 1;
  const ANY = Symbol("SemVer ANY");
  class Comparator {
    static get ANY() {
      return ANY;
    }
    constructor(comp, options) {
      options = parseOptions(options);
      if (comp instanceof Comparator) {
        if (comp.loose === !!options.loose) {
          return comp;
        } else {
          comp = comp.value;
        }
      }
      comp = comp.trim().split(/\s+/).join(" ");
      debug("comparator", comp, options);
      this.options = options;
      this.loose = !!options.loose;
      this.parse(comp);
      if (this.semver === ANY) {
        this.value = "";
      } else {
        this.value = this.operator + this.semver.version;
      }
      debug("comp", this);
    }
    parse(comp) {
      const r = this.options.loose ? re2[t.COMPARATORLOOSE] : re2[t.COMPARATOR];
      const m = comp.match(r);
      if (!m) {
        throw new TypeError(`Invalid comparator: ${comp}`);
      }
      this.operator = m[1] !== void 0 ? m[1] : "";
      if (this.operator === "=") {
        this.operator = "";
      }
      if (!m[2]) {
        this.semver = ANY;
      } else {
        this.semver = new SemVer(m[2], this.options.loose);
      }
    }
    toString() {
      return this.value;
    }
    test(version) {
      debug("Comparator.test", version, this.options.loose);
      if (this.semver === ANY || version === ANY) {
        return true;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return false;
        }
      }
      return cmp(version, this.operator, this.semver, this.options);
    }
    intersects(comp, options) {
      if (!(comp instanceof Comparator)) {
        throw new TypeError("a Comparator is required");
      }
      if (this.operator === "") {
        if (this.value === "") {
          return true;
        }
        return new Range2(comp.value, options).test(this.value);
      } else if (comp.operator === "") {
        if (comp.value === "") {
          return true;
        }
        return new Range2(this.value, options).test(comp.semver);
      }
      options = parseOptions(options);
      if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
        return false;
      }
      if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
        return false;
      }
      if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
        return true;
      }
      if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
        return true;
      }
      if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
        return true;
      }
      if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
        return true;
      }
      if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
        return true;
      }
      return false;
    }
  }
  comparator = Comparator;
  const parseOptions = requireParseOptions();
  const { safeRe: re2, t } = requireRe();
  const cmp = requireCmp();
  const debug = requireDebug();
  const SemVer = requireSemver();
  const Range2 = requireRange();
  return comparator;
}
var range;
var hasRequiredRange;
function requireRange() {
  if (hasRequiredRange) return range;
  hasRequiredRange = 1;
  const SPACE_CHARACTERS = /\s+/g;
  class Range2 {
    constructor(range2, options) {
      options = parseOptions(options);
      if (range2 instanceof Range2) {
        if (range2.loose === !!options.loose && range2.includePrerelease === !!options.includePrerelease) {
          return range2;
        } else {
          return new Range2(range2.raw, options);
        }
      }
      if (range2 instanceof Comparator) {
        this.raw = range2.value;
        this.set = [[range2]];
        this.formatted = void 0;
        return this;
      }
      this.options = options;
      this.loose = !!options.loose;
      this.includePrerelease = !!options.includePrerelease;
      this.raw = range2.trim().replace(SPACE_CHARACTERS, " ");
      this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
      if (!this.set.length) {
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      }
      if (this.set.length > 1) {
        const first = this.set[0];
        this.set = this.set.filter((c) => !isNullSet(c[0]));
        if (this.set.length === 0) {
          this.set = [first];
        } else if (this.set.length > 1) {
          for (const c of this.set) {
            if (c.length === 1 && isAny(c[0])) {
              this.set = [c];
              break;
            }
          }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let i = 0; i < this.set.length; i++) {
          if (i > 0) {
            this.formatted += "||";
          }
          const comps = this.set[i];
          for (let k = 0; k < comps.length; k++) {
            if (k > 0) {
              this.formatted += " ";
            }
            this.formatted += comps[k].toString().trim();
          }
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(range2) {
      const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
      const memoKey = memoOpts + ":" + range2;
      const cached = cache2.get(memoKey);
      if (cached) {
        return cached;
      }
      const loose = this.options.loose;
      const hr = loose ? re2[t.HYPHENRANGELOOSE] : re2[t.HYPHENRANGE];
      range2 = range2.replace(hr, hyphenReplace(this.options.includePrerelease));
      debug("hyphen replace", range2);
      range2 = range2.replace(re2[t.COMPARATORTRIM], comparatorTrimReplace);
      debug("comparator trim", range2);
      range2 = range2.replace(re2[t.TILDETRIM], tildeTrimReplace);
      debug("tilde trim", range2);
      range2 = range2.replace(re2[t.CARETTRIM], caretTrimReplace);
      debug("caret trim", range2);
      let rangeList = range2.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
      if (loose) {
        rangeList = rangeList.filter((comp) => {
          debug("loose invalid filter", comp, this.options);
          return !!comp.match(re2[t.COMPARATORLOOSE]);
        });
      }
      debug("range list", rangeList);
      const rangeMap = /* @__PURE__ */ new Map();
      const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
      for (const comp of comparators) {
        if (isNullSet(comp)) {
          return [comp];
        }
        rangeMap.set(comp.value, comp);
      }
      if (rangeMap.size > 1 && rangeMap.has("")) {
        rangeMap.delete("");
      }
      const result = [...rangeMap.values()];
      cache2.set(memoKey, result);
      return result;
    }
    intersects(range2, options) {
      if (!(range2 instanceof Range2)) {
        throw new TypeError("a Range is required");
      }
      return this.set.some((thisComparators) => {
        return isSatisfiable(thisComparators, options) && range2.set.some((rangeComparators) => {
          return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
            return rangeComparators.every((rangeComparator) => {
              return thisComparator.intersects(rangeComparator, options);
            });
          });
        });
      });
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(version) {
      if (!version) {
        return false;
      }
      if (typeof version === "string") {
        try {
          version = new SemVer(version, this.options);
        } catch (er) {
          return false;
        }
      }
      for (let i = 0; i < this.set.length; i++) {
        if (testSet(this.set[i], version, this.options)) {
          return true;
        }
      }
      return false;
    }
  }
  range = Range2;
  const LRU = requireLrucache();
  const cache2 = new LRU();
  const parseOptions = requireParseOptions();
  const Comparator = requireComparator();
  const debug = requireDebug();
  const SemVer = requireSemver();
  const {
    safeRe: re2,
    t,
    comparatorTrimReplace,
    tildeTrimReplace,
    caretTrimReplace
  } = requireRe();
  const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = requireConstants();
  const isNullSet = (c) => c.value === "<0.0.0-0";
  const isAny = (c) => c.value === "";
  const isSatisfiable = (comparators, options) => {
    let result = true;
    const remainingComparators = comparators.slice();
    let testComparator = remainingComparators.pop();
    while (result && remainingComparators.length) {
      result = remainingComparators.every((otherComparator) => {
        return testComparator.intersects(otherComparator, options);
      });
      testComparator = remainingComparators.pop();
    }
    return result;
  };
  const parseComparator = (comp, options) => {
    debug("comp", comp, options);
    comp = replaceCarets(comp, options);
    debug("caret", comp);
    comp = replaceTildes(comp, options);
    debug("tildes", comp);
    comp = replaceXRanges(comp, options);
    debug("xrange", comp);
    comp = replaceStars(comp, options);
    debug("stars", comp);
    return comp;
  };
  const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
  const replaceTildes = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
  };
  const replaceTilde = (comp, options) => {
    const r = options.loose ? re2[t.TILDELOOSE] : re2[t.TILDE];
    return comp.replace(r, (_, M, m, p, pr) => {
      debug("tilde", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
      } else if (pr) {
        debug("replaceTilde pr", pr);
        ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
      }
      debug("tilde return", ret);
      return ret;
    });
  };
  const replaceCarets = (comp, options) => {
    return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
  };
  const replaceCaret = (comp, options) => {
    debug("caret", comp, options);
    const r = options.loose ? re2[t.CARETLOOSE] : re2[t.CARET];
    const z = options.includePrerelease ? "-0" : "";
    return comp.replace(r, (_, M, m, p, pr) => {
      debug("caret", comp, _, M, m, p, pr);
      let ret;
      if (isX(M)) {
        ret = "";
      } else if (isX(m)) {
        ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
      } else if (isX(p)) {
        if (M === "0") {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
        }
      } else if (pr) {
        debug("replaceCaret pr", pr);
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
        }
      } else {
        debug("no pr");
        if (M === "0") {
          if (m === "0") {
            ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
          } else {
            ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
          }
        } else {
          ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
        }
      }
      debug("caret return", ret);
      return ret;
    });
  };
  const replaceXRanges = (comp, options) => {
    debug("replaceXRanges", comp, options);
    return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
  };
  const replaceXRange = (comp, options) => {
    comp = comp.trim();
    const r = options.loose ? re2[t.XRANGELOOSE] : re2[t.XRANGE];
    return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
      debug("xRange", comp, ret, gtlt, M, m, p, pr);
      const xM = isX(M);
      const xm = xM || isX(m);
      const xp = xm || isX(p);
      const anyX = xp;
      if (gtlt === "=" && anyX) {
        gtlt = "";
      }
      pr = options.includePrerelease ? "-0" : "";
      if (xM) {
        if (gtlt === ">" || gtlt === "<") {
          ret = "<0.0.0-0";
        } else {
          ret = "*";
        }
      } else if (gtlt && anyX) {
        if (xm) {
          m = 0;
        }
        p = 0;
        if (gtlt === ">") {
          gtlt = ">=";
          if (xm) {
            M = +M + 1;
            m = 0;
            p = 0;
          } else {
            m = +m + 1;
            p = 0;
          }
        } else if (gtlt === "<=") {
          gtlt = "<";
          if (xm) {
            M = +M + 1;
          } else {
            m = +m + 1;
          }
        }
        if (gtlt === "<") {
          pr = "-0";
        }
        ret = `${gtlt + M}.${m}.${p}${pr}`;
      } else if (xm) {
        ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
      } else if (xp) {
        ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
      }
      debug("xRange return", ret);
      return ret;
    });
  };
  const replaceStars = (comp, options) => {
    debug("replaceStars", comp, options);
    return comp.trim().replace(re2[t.STAR], "");
  };
  const replaceGTE0 = (comp, options) => {
    debug("replaceGTE0", comp, options);
    return comp.trim().replace(re2[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
  };
  const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
    if (isX(fM)) {
      from = "";
    } else if (isX(fm)) {
      from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
    } else if (isX(fp)) {
      from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
    } else if (fpr) {
      from = `>=${from}`;
    } else {
      from = `>=${from}${incPr ? "-0" : ""}`;
    }
    if (isX(tM)) {
      to = "";
    } else if (isX(tm)) {
      to = `<${+tM + 1}.0.0-0`;
    } else if (isX(tp)) {
      to = `<${tM}.${+tm + 1}.0-0`;
    } else if (tpr) {
      to = `<=${tM}.${tm}.${tp}-${tpr}`;
    } else if (incPr) {
      to = `<${tM}.${tm}.${+tp + 1}-0`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  };
  const testSet = (set, version, options) => {
    for (let i = 0; i < set.length; i++) {
      if (!set[i].test(version)) {
        return false;
      }
    }
    if (version.prerelease.length && !options.includePrerelease) {
      for (let i = 0; i < set.length; i++) {
        debug(set[i].semver);
        if (set[i].semver === Comparator.ANY) {
          continue;
        }
        if (set[i].semver.prerelease.length > 0) {
          const allowed = set[i].semver;
          if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  };
  return range;
}
var satisfies_1;
var hasRequiredSatisfies;
function requireSatisfies() {
  if (hasRequiredSatisfies) return satisfies_1;
  hasRequiredSatisfies = 1;
  const Range2 = requireRange();
  const satisfies2 = (version, range2, options) => {
    try {
      range2 = new Range2(range2, options);
    } catch (er) {
      return false;
    }
    return range2.test(version);
  };
  satisfies_1 = satisfies2;
  return satisfies_1;
}
var satisfiesExports = requireSatisfies();
const satisfies = /* @__PURE__ */ getDefaultExportFromCjs(satisfiesExports);
const editorPort = ':set -package hosc\n\nimport System.Environment (getEnv)\n\neditorPort <- read <$> getEnv "editor_port" :: IO Int';
const editorSocket_1_9_2 = 'import Sound.OSC.FD\n\neditorSocket <- openUDP "127.0.0.1" editorPort';
const editorSocket_1_9_3 = 'import Sound.Osc.Fd\n\neditorSocket <- openUdp "127.0.0.1" editorPort';
const tidalSetup = 'import Control.Concurrent\n\nimport Sound.Tidal.Context hiding (startStream, startTidal)\nimport qualified Sound.Tidal.Stream as Stream\n\n:{\nhighlightTarget :: Target\nhighlightTarget = Target {oName = "Text Management Highlights",\n                          oAddress = "127.0.0.1",\n                          oPort = editorPort,\n                          oBusPort = Nothing,\n                          oLatency = 0.02,\n                          oWindow = Nothing,\n                          oSchedule = Pre BundleStamp,\n                          oHandshake = False\n                         }\n:}\n\n:{\nstartStream :: Config -> [(Target, [OSC])] -> IO Stream\nstartStream config oscmap\n  = do tidal <- Stream.startStream config (oscmap ++ [(highlightTarget, [OSCContext "/highlight"])])\n       watchClock tidal\n       return tidal\n    where\n      watchClock :: Stream -> IO ThreadId\n      watchClock stream = forkIO checkClock\n        where\n          checkClock :: IO ()\n          checkClock = do time <- streamGetnow stream\n                          sendMessage editorSocket (Message "/now" [Float $ realToFrac time])\n                          threadDelay 100000\n                          checkClock\n:}\n\n:{\nstartTidal :: Target -> Config -> IO Stream\nstartTidal t c = startStream c [(t, [superdirtShape])]\n:}\n';
function generateIntegrationCode(version) {
  let integrationCode = editorPort;
  if (satisfies(version, "<=1.9.2")) {
    integrationCode = [integrationCode, editorSocket_1_9_2].join("\n");
  } else {
    integrationCode = [integrationCode, editorSocket_1_9_3].join("\n");
  }
  return [integrationCode, tidalSetup].join("\n");
}
const multilineBlock = /^[ \t]*:{[ \t]*\r?\n((?:[ \t]*(?:[^:\s].*|:|:[^}].*|:}.*\S.*)?\r?\n)*)[ \t]*:}[ \t]*$/m;
const indentedStatement = /([ \t]*)\S.*(?:\r?\n\1[ \t]+\S.*)*/g;
function extractStatements(code) {
  let blocks = code.split(multilineBlock);
  let plainBlock, bracketBlock;
  let statements = [];
  while (blocks.length > 0) {
    [plainBlock, bracketBlock, ...blocks] = blocks;
    for (let [statement] of plainBlock.matchAll(indentedStatement)) {
      statements.push(statement);
    }
    if (bracketBlock) {
      statements.push(bracketBlock);
    }
  }
  return statements;
}
function asMessages(packet) {
  return asMessagesAtTime(packet, [0, 0]);
}
function asMessagesAtTime(packet, ntpTime) {
  if ("address" in packet) {
    return [{ ...packet, ntpTime }];
  } else {
    let { ntpTime: newTime, packets } = packet;
    return packets.flatMap((newPacket) => asMessagesAtTime(newPacket, newTime));
  }
}
class GHCI extends Engine {
  settings;
  socket;
  process;
  history = [];
  constructor(settings2) {
    super();
    this.settings = settings2.extend(TidalSettingsSchema);
    this.settings.on("change", () => {
      this.reloadSettings;
    });
    this.socket = this.initSocket();
    this.process = this.initProcess();
    this.on("message", (message) => {
      this.history.push(message);
    });
    this.onListener["message"] = (listener) => {
      for (let message of this.history) {
        listener(message);
      }
    };
  }
  initSocket() {
    return new Promise((resolve) => {
      const socket = dgram.createSocket("udp4");
      socket.bind(0, "localhost", () => {
        resolve(socket);
      });
      socket.on("message", (data) => {
        let packet = parse(data);
        for (let message of asMessages(packet)) {
          if (message.address === "/now") {
            if (typeof message.args[0] === "number") {
              this.emit("now", message.args[0]);
            }
          } else if (message.address === "/highlight") {
            let [_orbit, duration, cycle, from, miniID, to] = message.args;
            this.emit("highlight", {
              miniID: miniID - 1,
              from,
              to,
              onset: message.ntpTime,
              cycle,
              duration: duration / 1e3
              // Convert from microseconds
            });
          }
        }
      });
    });
  }
  wrapper = null;
  async initProcess() {
    const {
      "tidal.boot.disableEditorIntegration": disableEditorIntegration,
      "tidal.boot.useDefaultFile": useDefaultBootfile,
      "tidal.boot.customFiles": bootFiles
    } = this.settings.data;
    const port = (await this.socket).address().port.toString();
    const child = require$$0$2.spawn("ghci", ["-XOverloadedStrings"], {
      env: {
        ...process.env,
        editor_port: port
      }
    });
    this.wrapper = new ProcessWrapper(child);
    this.wrapper.on("log", (message) => {
      this.emit("message", message);
    });
    if (!disableEditorIntegration) {
      const integrationCode = generateIntegrationCode(await this.getVersion());
      await this.send(integrationCode);
    }
    if (useDefaultBootfile) {
      await this.sendFile(await this.defaultBootfile());
    }
    for (let path of bootFiles ?? []) {
      try {
        await this.sendFile(path);
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
        this.emit("message", {
          level: "error",
          text: `The boot file "${path}" can't be found, so it wasn't loaded.`
        });
      }
    }
    return child;
  }
  outputFilters = [];
  async defaultBootfile() {
    const { stdout } = await require$$2$1.promisify(require$$0$2.exec)(
      'ghc -e "import Paths_tidal" -e "getDataDir>>=putStr"'
    );
    return require$$0$1.join(stdout, "BootTidal.hs");
  }
  async reloadSettings() {
    this.emit("message", {
      level: "info",
      text: "Tidal's settings have changed. Reboot Tidal to apply new settings."
    });
  }
  async sendFile(path) {
    let code = await promises.readFile(path, "utf-8");
    await this.send(code);
  }
  async send(code) {
    if (!this.wrapper)
      throw Error("Can't evaluate code before process is started");
    for await (let evaluation of this.wrapper.send(code)) {
      if (evaluation.text) {
        this.emit("message", evaluation);
      }
    }
  }
  version;
  getVersion() {
    if (!this.version) {
      this.version = require$$2$1.promisify(require$$0$2.exec)(
        'ghc -e "import Sound.Tidal.Version" -e "putStr tidal_version"'
      ).then(({ stdout }) => stdout);
    }
    return this.version;
  }
  async close() {
    let process2 = await this.process;
    if (!process2.killed) {
      (await this.process).kill();
    }
    if (process2.exitCode === null) {
      await new Promise((resolve) => {
        process2.once("close", () => {
          resolve();
        });
      });
      this.emit("stopped", void 0);
    }
  }
  async restart() {
    await this.close();
    this.process = this.initProcess();
    await this.process;
    this.emit("started", void 0);
  }
}
class ProcessWrapper extends EventEmitter {
  constructor(child) {
    super();
    this.child = child;
    child.stdout.setEncoding("utf-8");
    child.stderr.setEncoding("utf-8");
    this.runningProcess = this.init();
    this.consumeStdout();
    this.consumeStderr();
  }
  runningProcess = null;
  prompt = "ghci> ";
  out = [];
  error = [];
  inputFilters = [];
  async init() {
    await this.next("prompt");
    if (this.out.length > 0) {
      this.emit("prologue", this.out.join(require$$0$3.EOL));
      this.out = [];
    }
    this.prompt = "";
    await this.evaluate(':set prompt ""');
    await this.evaluate(':set prompt-cont ""');
    this.addInputFilter(/^[ \t]*:set[ \t]+prompt.*$/m);
  }
  async evaluate(code) {
    let nextPrompt = this.next("prompt");
    console.log(`EVALUATE: "${code}"`);
    this.child.stdin.write(code + require$$0$3.EOL);
    await nextPrompt;
    let input = code, success = true, text = void 0;
    if (this.error.length > 1) {
      success = false;
      text = this.error.join(require$$0$3.EOL);
      this.error = [];
    }
    if (this.out.length > 0) {
      if (success) {
        text = this.out.join(require$$0$3.EOL);
      } else {
        throw Error(`Unexpected text on stdout: "${this.out.join(require$$0$3.EOL)}"`);
      }
      this.out = [];
    }
    return { input, success, text };
  }
  async consumeStdout() {
    let runningLine = "";
    let chunk;
    for await (chunk of this.child.stdout) {
      console.log(`CHUNK: "${chunk}"`);
      if (!this.runningProcess) {
        this.emit("log", { level: "info", text: chunk.trim() });
        continue;
      }
      let hasPrompt = false;
      let splits = chunk.split(require$$0$3.EOL);
      for (let i = 0; i < splits.length; ++i) {
        let split = splits[i];
        if (i === 0) {
          split = runningLine + split;
          runningLine = "";
        }
        if (split.includes(this.prompt)) {
          hasPrompt = true;
          split = split.replace(this.prompt, "");
        }
        if (i < splits.length - 1) {
          this.out.push(split);
        } else {
          runningLine = runningLine + split;
        }
      }
      if (hasPrompt) {
        if (runningLine) {
          this.out.push(runningLine);
          runningLine = "";
        }
        this.emit("prompt", this.prompt);
      }
    }
  }
  async consumeStderr() {
    let runningLine = "";
    let chunk;
    for await (chunk of this.child.stderr) {
      console.log(`ERROR CHUNK: "${chunk}"`);
      if (!this.runningProcess) {
        this.emit("log", { level: "error", text: chunk.trim() });
        continue;
      }
      let splits = chunk.split(require$$0$3.EOL);
      let lines = splits.slice(0, -1);
      let [remainder] = splits.slice(-1);
      if (lines.length > 0) {
        lines[0] = runningLine + lines[0];
      } else {
        remainder = runningLine + remainder;
      }
      runningLine = "";
      this.error.push(...lines);
      runningLine = remainder;
    }
  }
  async *send(code) {
    let resolve = () => {
    };
    if (this.runningProcess !== null) {
      await this.runningProcess;
    }
    this.runningProcess = new Promise((res) => {
      resolve = res;
    }).then(() => {
      this.runningProcess = null;
    });
    for (let statement of extractStatements(code)) {
      for (let filter of this.inputFilters) {
        statement = statement.replaceAll(filter, "");
      }
      if (/^\s*$/.test(statement)) {
        console.log("BREAK");
        continue;
      }
      if (statement.split(require$$0$3.EOL).length > 1) {
        statement = `:{${require$$0$3.EOL}${statement}${require$$0$3.EOL}:}`;
      }
      yield this.evaluate(statement);
    }
    resolve();
  }
  addInputFilter(filter) {
    this.inputFilters.push(new RegExp(filter, filter.flags + "g"));
  }
}
class Text {
  /**
  Get the line description around the given position.
  */
  lineAt(pos) {
    if (pos < 0 || pos > this.length)
      throw new RangeError(`Invalid position ${pos} in document of length ${this.length}`);
    return this.lineInner(pos, false, 1, 0);
  }
  /**
  Get the description for the given (1-based) line number.
  */
  line(n) {
    if (n < 1 || n > this.lines)
      throw new RangeError(`Invalid line number ${n} in ${this.lines}-line document`);
    return this.lineInner(n, true, 1, 0);
  }
  /**
  Replace a range of the text with the given content.
  */
  replace(from, to, text) {
    [from, to] = clip(this, from, to);
    let parts = [];
    this.decompose(
      0,
      from,
      parts,
      2
      /* Open.To */
    );
    if (text.length)
      text.decompose(
        0,
        text.length,
        parts,
        1 | 2
        /* Open.To */
      );
    this.decompose(
      to,
      this.length,
      parts,
      1
      /* Open.From */
    );
    return TextNode.from(parts, this.length - (to - from) + text.length);
  }
  /**
  Append another document to this one.
  */
  append(other) {
    return this.replace(this.length, this.length, other);
  }
  /**
  Retrieve the text between the given points.
  */
  slice(from, to = this.length) {
    [from, to] = clip(this, from, to);
    let parts = [];
    this.decompose(from, to, parts, 0);
    return TextNode.from(parts, to - from);
  }
  /**
  Test whether this text is equal to another instance.
  */
  eq(other) {
    if (other == this)
      return true;
    if (other.length != this.length || other.lines != this.lines)
      return false;
    let start = this.scanIdentical(other, 1), end = this.length - this.scanIdentical(other, -1);
    let a = new RawTextCursor(this), b = new RawTextCursor(other);
    for (let skip = start, pos = start; ; ) {
      a.next(skip);
      b.next(skip);
      skip = 0;
      if (a.lineBreak != b.lineBreak || a.done != b.done || a.value != b.value)
        return false;
      pos += a.value.length;
      if (a.done || pos >= end)
        return true;
    }
  }
  /**
  Iterate over the text. When `dir` is `-1`, iteration happens
  from end to start. This will return lines and the breaks between
  them as separate strings.
  */
  iter(dir = 1) {
    return new RawTextCursor(this, dir);
  }
  /**
  Iterate over a range of the text. When `from` > `to`, the
  iterator will run in reverse.
  */
  iterRange(from, to = this.length) {
    return new PartialTextCursor(this, from, to);
  }
  /**
  Return a cursor that iterates over the given range of lines,
  _without_ returning the line breaks between, and yielding empty
  strings for empty lines.
  
  When `from` and `to` are given, they should be 1-based line numbers.
  */
  iterLines(from, to) {
    let inner;
    if (from == null) {
      inner = this.iter();
    } else {
      if (to == null)
        to = this.lines + 1;
      let start = this.line(from).from;
      inner = this.iterRange(start, Math.max(start, to == this.lines + 1 ? this.length : to <= 1 ? 0 : this.line(to - 1).to));
    }
    return new LineCursor(inner);
  }
  /**
  Return the document as a string, using newline characters to
  separate lines.
  */
  toString() {
    return this.sliceString(0);
  }
  /**
  Convert the document to an array of lines (which can be
  deserialized again via [`Text.of`](https://codemirror.net/6/docs/ref/#state.Text^of)).
  */
  toJSON() {
    let lines = [];
    this.flatten(lines);
    return lines;
  }
  /**
  @internal
  */
  constructor() {
  }
  /**
  Create a `Text` instance for the given array of lines.
  */
  static of(text) {
    if (text.length == 0)
      throw new RangeError("A document must have at least one line");
    if (text.length == 1 && !text[0])
      return Text.empty;
    return text.length <= 32 ? new TextLeaf(text) : TextNode.from(TextLeaf.split(text, []));
  }
}
class TextLeaf extends Text {
  constructor(text, length = textLength(text)) {
    super();
    this.text = text;
    this.length = length;
  }
  get lines() {
    return this.text.length;
  }
  get children() {
    return null;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0; ; i++) {
      let string = this.text[i], end = offset + string.length;
      if ((isLine ? line : end) >= target)
        return new Line(offset, end, line, string);
      offset = end + 1;
      line++;
    }
  }
  decompose(from, to, target, open) {
    let text = from <= 0 && to >= this.length ? this : new TextLeaf(sliceText(this.text, from, to), Math.min(to, this.length) - Math.max(0, from));
    if (open & 1) {
      let prev = target.pop();
      let joined = appendText(text.text, prev.text.slice(), 0, text.length);
      if (joined.length <= 32) {
        target.push(new TextLeaf(joined, prev.length + text.length));
      } else {
        let mid = joined.length >> 1;
        target.push(new TextLeaf(joined.slice(0, mid)), new TextLeaf(joined.slice(mid)));
      }
    } else {
      target.push(text);
    }
  }
  replace(from, to, text) {
    if (!(text instanceof TextLeaf))
      return super.replace(from, to, text);
    [from, to] = clip(this, from, to);
    let lines = appendText(this.text, appendText(text.text, sliceText(this.text, 0, from)), to);
    let newLen = this.length + text.length - (to - from);
    if (lines.length <= 32)
      return new TextLeaf(lines, newLen);
    return TextNode.from(TextLeaf.split(lines, []), newLen);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    [from, to] = clip(this, from, to);
    let result = "";
    for (let pos = 0, i = 0; pos <= to && i < this.text.length; i++) {
      let line = this.text[i], end = pos + line.length;
      if (pos > from && i)
        result += lineSep;
      if (from < end && to > pos)
        result += line.slice(Math.max(0, from - pos), to - pos);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let line of this.text)
      target.push(line);
  }
  scanIdentical() {
    return 0;
  }
  static split(text, target) {
    let part = [], len = -1;
    for (let line of text) {
      part.push(line);
      len += line.length + 1;
      if (part.length == 32) {
        target.push(new TextLeaf(part, len));
        part = [];
        len = -1;
      }
    }
    if (len > -1)
      target.push(new TextLeaf(part, len));
    return target;
  }
}
class TextNode extends Text {
  constructor(children, length) {
    super();
    this.children = children;
    this.length = length;
    this.lines = 0;
    for (let child of children)
      this.lines += child.lines;
  }
  lineInner(target, isLine, line, offset) {
    for (let i = 0; ; i++) {
      let child = this.children[i], end = offset + child.length, endLine = line + child.lines - 1;
      if ((isLine ? endLine : end) >= target)
        return child.lineInner(target, isLine, line, offset);
      offset = end + 1;
      line = endLine + 1;
    }
  }
  decompose(from, to, target, open) {
    for (let i = 0, pos = 0; pos <= to && i < this.children.length; i++) {
      let child = this.children[i], end = pos + child.length;
      if (from <= end && to >= pos) {
        let childOpen = open & ((pos <= from ? 1 : 0) | (end >= to ? 2 : 0));
        if (pos >= from && end <= to && !childOpen)
          target.push(child);
        else
          child.decompose(from - pos, to - pos, target, childOpen);
      }
      pos = end + 1;
    }
  }
  replace(from, to, text) {
    [from, to] = clip(this, from, to);
    if (text.lines < this.lines)
      for (let i = 0, pos = 0; i < this.children.length; i++) {
        let child = this.children[i], end = pos + child.length;
        if (from >= pos && to <= end) {
          let updated = child.replace(from - pos, to - pos, text);
          let totalLines = this.lines - child.lines + updated.lines;
          if (updated.lines < totalLines >> 5 - 1 && updated.lines > totalLines >> 5 + 1) {
            let copy = this.children.slice();
            copy[i] = updated;
            return new TextNode(copy, this.length - (to - from) + text.length);
          }
          return super.replace(pos, end, updated);
        }
        pos = end + 1;
      }
    return super.replace(from, to, text);
  }
  sliceString(from, to = this.length, lineSep = "\n") {
    [from, to] = clip(this, from, to);
    let result = "";
    for (let i = 0, pos = 0; i < this.children.length && pos <= to; i++) {
      let child = this.children[i], end = pos + child.length;
      if (pos > from && i)
        result += lineSep;
      if (from < end && to > pos)
        result += child.sliceString(from - pos, to - pos, lineSep);
      pos = end + 1;
    }
    return result;
  }
  flatten(target) {
    for (let child of this.children)
      child.flatten(target);
  }
  scanIdentical(other, dir) {
    if (!(other instanceof TextNode))
      return 0;
    let length = 0;
    let [iA, iB, eA, eB] = dir > 0 ? [0, 0, this.children.length, other.children.length] : [this.children.length - 1, other.children.length - 1, -1, -1];
    for (; ; iA += dir, iB += dir) {
      if (iA == eA || iB == eB)
        return length;
      let chA = this.children[iA], chB = other.children[iB];
      if (chA != chB)
        return length + chA.scanIdentical(chB, dir);
      length += chA.length + 1;
    }
  }
  static from(children, length = children.reduce((l, ch) => l + ch.length + 1, -1)) {
    let lines = 0;
    for (let ch of children)
      lines += ch.lines;
    if (lines < 32) {
      let flat = [];
      for (let ch of children)
        ch.flatten(flat);
      return new TextLeaf(flat, length);
    }
    let chunk = Math.max(
      32,
      lines >> 5
      /* Tree.BranchShift */
    ), maxChunk = chunk << 1, minChunk = chunk >> 1;
    let chunked = [], currentLines = 0, currentLen = -1, currentChunk = [];
    function add(child) {
      let last;
      if (child.lines > maxChunk && child instanceof TextNode) {
        for (let node of child.children)
          add(node);
      } else if (child.lines > minChunk && (currentLines > minChunk || !currentLines)) {
        flush();
        chunked.push(child);
      } else if (child instanceof TextLeaf && currentLines && (last = currentChunk[currentChunk.length - 1]) instanceof TextLeaf && child.lines + last.lines <= 32) {
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk[currentChunk.length - 1] = new TextLeaf(last.text.concat(child.text), last.length + 1 + child.length);
      } else {
        if (currentLines + child.lines > chunk)
          flush();
        currentLines += child.lines;
        currentLen += child.length + 1;
        currentChunk.push(child);
      }
    }
    function flush() {
      if (currentLines == 0)
        return;
      chunked.push(currentChunk.length == 1 ? currentChunk[0] : TextNode.from(currentChunk, currentLen));
      currentLen = -1;
      currentLines = currentChunk.length = 0;
    }
    for (let child of children)
      add(child);
    flush();
    return chunked.length == 1 ? chunked[0] : new TextNode(chunked, length);
  }
}
Text.empty = /* @__PURE__ */ new TextLeaf([""], 0);
function textLength(text) {
  let length = -1;
  for (let line of text)
    length += line.length + 1;
  return length;
}
function appendText(text, target, from = 0, to = 1e9) {
  for (let pos = 0, i = 0, first = true; i < text.length && pos <= to; i++) {
    let line = text[i], end = pos + line.length;
    if (end >= from) {
      if (end > to)
        line = line.slice(0, to - pos);
      if (pos < from)
        line = line.slice(from - pos);
      if (first) {
        target[target.length - 1] += line;
        first = false;
      } else
        target.push(line);
    }
    pos = end + 1;
  }
  return target;
}
function sliceText(text, from, to) {
  return appendText(text, [""], from, to);
}
class RawTextCursor {
  constructor(text, dir = 1) {
    this.dir = dir;
    this.done = false;
    this.lineBreak = false;
    this.value = "";
    this.nodes = [text];
    this.offsets = [dir > 0 ? 1 : (text instanceof TextLeaf ? text.text.length : text.children.length) << 1];
  }
  nextInner(skip, dir) {
    this.done = this.lineBreak = false;
    for (; ; ) {
      let last = this.nodes.length - 1;
      let top = this.nodes[last], offsetValue = this.offsets[last], offset = offsetValue >> 1;
      let size = top instanceof TextLeaf ? top.text.length : top.children.length;
      if (offset == (dir > 0 ? size : 0)) {
        if (last == 0) {
          this.done = true;
          this.value = "";
          return this;
        }
        if (dir > 0)
          this.offsets[last - 1]++;
        this.nodes.pop();
        this.offsets.pop();
      } else if ((offsetValue & 1) == (dir > 0 ? 0 : 1)) {
        this.offsets[last] += dir;
        if (skip == 0) {
          this.lineBreak = true;
          this.value = "\n";
          return this;
        }
        skip--;
      } else if (top instanceof TextLeaf) {
        let next2 = top.text[offset + (dir < 0 ? -1 : 0)];
        this.offsets[last] += dir;
        if (next2.length > Math.max(0, skip)) {
          this.value = skip == 0 ? next2 : dir > 0 ? next2.slice(skip) : next2.slice(0, next2.length - skip);
          return this;
        }
        skip -= next2.length;
      } else {
        let next2 = top.children[offset + (dir < 0 ? -1 : 0)];
        if (skip > next2.length) {
          skip -= next2.length;
          this.offsets[last] += dir;
        } else {
          if (dir < 0)
            this.offsets[last]--;
          this.nodes.push(next2);
          this.offsets.push(dir > 0 ? 1 : (next2 instanceof TextLeaf ? next2.text.length : next2.children.length) << 1);
        }
      }
    }
  }
  next(skip = 0) {
    if (skip < 0) {
      this.nextInner(-skip, -this.dir);
      skip = this.value.length;
    }
    return this.nextInner(skip, this.dir);
  }
}
class PartialTextCursor {
  constructor(text, start, end) {
    this.value = "";
    this.done = false;
    this.cursor = new RawTextCursor(text, start > end ? -1 : 1);
    this.pos = start > end ? text.length : 0;
    this.from = Math.min(start, end);
    this.to = Math.max(start, end);
  }
  nextInner(skip, dir) {
    if (dir < 0 ? this.pos <= this.from : this.pos >= this.to) {
      this.value = "";
      this.done = true;
      return this;
    }
    skip += Math.max(0, dir < 0 ? this.pos - this.to : this.from - this.pos);
    let limit = dir < 0 ? this.pos - this.from : this.to - this.pos;
    if (skip > limit)
      skip = limit;
    limit -= skip;
    let { value } = this.cursor.next(skip);
    this.pos += (value.length + skip) * dir;
    this.value = value.length <= limit ? value : dir < 0 ? value.slice(value.length - limit) : value.slice(0, limit);
    this.done = !this.value;
    return this;
  }
  next(skip = 0) {
    if (skip < 0)
      skip = Math.max(skip, this.from - this.pos);
    else if (skip > 0)
      skip = Math.min(skip, this.to - this.pos);
    return this.nextInner(skip, this.cursor.dir);
  }
  get lineBreak() {
    return this.cursor.lineBreak && this.value != "";
  }
}
class LineCursor {
  constructor(inner) {
    this.inner = inner;
    this.afterBreak = true;
    this.value = "";
    this.done = false;
  }
  next(skip = 0) {
    let { done, lineBreak, value } = this.inner.next(skip);
    if (done && this.afterBreak) {
      this.value = "";
      this.afterBreak = false;
    } else if (done) {
      this.done = true;
      this.value = "";
    } else if (lineBreak) {
      if (this.afterBreak) {
        this.value = "";
      } else {
        this.afterBreak = true;
        this.next();
      }
    } else {
      this.value = value;
      this.afterBreak = false;
    }
    return this;
  }
  get lineBreak() {
    return false;
  }
}
if (typeof Symbol != "undefined") {
  Text.prototype[Symbol.iterator] = function() {
    return this.iter();
  };
  RawTextCursor.prototype[Symbol.iterator] = PartialTextCursor.prototype[Symbol.iterator] = LineCursor.prototype[Symbol.iterator] = function() {
    return this;
  };
}
class Line {
  /**
  @internal
  */
  constructor(from, to, number, text) {
    this.from = from;
    this.to = to;
    this.number = number;
    this.text = text;
  }
  /**
  The length of the line (not including any line break after it).
  */
  get length() {
    return this.to - this.from;
  }
}
function clip(text, from, to) {
  from = Math.max(0, Math.min(text.length, from));
  return [from, Math.max(from, Math.min(text.length, to))];
}
let extend = /* @__PURE__ */ "lc,34,7n,7,7b,19,,,,2,,2,,,20,b,1c,l,g,,2t,7,2,6,2,2,,4,z,,u,r,2j,b,1m,9,9,,o,4,,9,,3,,5,17,3,3b,f,,w,1j,,,,4,8,4,,3,7,a,2,t,,1m,,,,2,4,8,,9,,a,2,q,,2,2,1l,,4,2,4,2,2,3,3,,u,2,3,,b,2,1l,,4,5,,2,4,,k,2,m,6,,,1m,,,2,,4,8,,7,3,a,2,u,,1n,,,,c,,9,,14,,3,,1l,3,5,3,,4,7,2,b,2,t,,1m,,2,,2,,3,,5,2,7,2,b,2,s,2,1l,2,,,2,4,8,,9,,a,2,t,,20,,4,,2,3,,,8,,29,,2,7,c,8,2q,,2,9,b,6,22,2,r,,,,,,1j,e,,5,,2,5,b,,10,9,,2u,4,,6,,2,2,2,p,2,4,3,g,4,d,,2,2,6,,f,,jj,3,qa,3,t,3,t,2,u,2,1s,2,,7,8,,2,b,9,,19,3,3b,2,y,,3a,3,4,2,9,,6,3,63,2,2,,1m,,,7,,,,,2,8,6,a,2,,1c,h,1r,4,1c,7,,,5,,14,9,c,2,w,4,2,2,,3,1k,,,2,3,,,3,1m,8,2,2,48,3,,d,,7,4,,6,,3,2,5i,1m,,5,ek,,5f,x,2da,3,3x,,2o,w,fe,6,2x,2,n9w,4,,a,w,2,28,2,7k,,3,,4,,p,2,5,,47,2,q,i,d,,12,8,p,b,1a,3,1c,,2,4,2,2,13,,1v,6,2,2,2,2,c,,8,,1b,,1f,,,3,2,2,5,2,,,16,2,8,,6m,,2,,4,,fn4,,kh,g,g,g,a6,2,gt,,6a,,45,5,1ae,3,,2,5,4,14,3,4,,4l,2,fx,4,ar,2,49,b,4w,,1i,f,1k,3,1d,4,2,2,1x,3,10,5,,8,1q,,c,2,1g,9,a,4,2,,2n,3,2,,,2,6,,4g,,3,8,l,2,1l,2,,,,,m,,e,7,3,5,5f,8,2,3,,,n,,29,,2,6,,,2,,,2,,2,6j,,2,4,6,2,,2,r,2,2d,8,2,,,2,2y,,,,2,6,,,2t,3,2,4,,5,77,9,,2,6t,,a,2,,,4,,40,4,2,2,4,,w,a,14,6,2,4,8,,9,6,2,3,1a,d,,2,ba,7,,6,,,2a,m,2,7,,2,,2,3e,6,3,,,2,,7,,,20,2,3,,,,9n,2,f0b,5,1n,7,t4,,1r,4,29,,f5k,2,43q,,,3,4,5,8,8,2,7,u,4,44,3,1iz,1j,4,1e,8,,e,,m,5,,f,11s,7,,h,2,7,,2,,5,79,7,c5,4,15s,7,31,7,240,5,gx7k,2o,3k,6o".split(",").map((s) => s ? parseInt(s, 36) : 1);
for (let i = 1; i < extend.length; i++)
  extend[i] += extend[i - 1];
const DefaultSplit = /\r\n?|\n/;
var MapMode = /* @__PURE__ */ function(MapMode2) {
  MapMode2[MapMode2["Simple"] = 0] = "Simple";
  MapMode2[MapMode2["TrackDel"] = 1] = "TrackDel";
  MapMode2[MapMode2["TrackBefore"] = 2] = "TrackBefore";
  MapMode2[MapMode2["TrackAfter"] = 3] = "TrackAfter";
  return MapMode2;
}(MapMode || (MapMode = {}));
class ChangeDesc {
  // Sections are encoded as pairs of integers. The first is the
  // length in the current document, and the second is -1 for
  // unaffected sections, and the length of the replacement content
  // otherwise. So an insertion would be (0, n>0), a deletion (n>0,
  // 0), and a replacement two positive numbers.
  /**
  @internal
  */
  constructor(sections) {
    this.sections = sections;
  }
  /**
  The length of the document before the change.
  */
  get length() {
    let result = 0;
    for (let i = 0; i < this.sections.length; i += 2)
      result += this.sections[i];
    return result;
  }
  /**
  The length of the document after the change.
  */
  get newLength() {
    let result = 0;
    for (let i = 0; i < this.sections.length; i += 2) {
      let ins = this.sections[i + 1];
      result += ins < 0 ? this.sections[i] : ins;
    }
    return result;
  }
  /**
  False when there are actual changes in this set.
  */
  get empty() {
    return this.sections.length == 0 || this.sections.length == 2 && this.sections[1] < 0;
  }
  /**
  Iterate over the unchanged parts left by these changes. `posA`
  provides the position of the range in the old document, `posB`
  the new position in the changed document.
  */
  iterGaps(f) {
    for (let i = 0, posA = 0, posB = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0) {
        f(posA, posB, len);
        posB += len;
      } else {
        posB += ins;
      }
      posA += len;
    }
  }
  /**
  Iterate over the ranges changed by these changes. (See
  [`ChangeSet.iterChanges`](https://codemirror.net/6/docs/ref/#state.ChangeSet.iterChanges) for a
  variant that also provides you with the inserted text.)
  `fromA`/`toA` provides the extent of the change in the starting
  document, `fromB`/`toB` the extent of the replacement in the
  changed document.
  
  When `individual` is true, adjacent changes (which are kept
  separate for [position mapping](https://codemirror.net/6/docs/ref/#state.ChangeDesc.mapPos)) are
  reported separately.
  */
  iterChangedRanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  /**
  Get a description of the inverted form of these changes.
  */
  get invertedDesc() {
    let sections = [];
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      if (ins < 0)
        sections.push(len, ins);
      else
        sections.push(ins, len);
    }
    return new ChangeDesc(sections);
  }
  /**
  Compute the combined effect of applying another set of changes
  after this one. The length of the document after this set should
  match the length before `other`.
  */
  composeDesc(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other);
  }
  /**
  Map this description, which should start with the same document
  as `other`, over another set of changes, so that it can be
  applied after it. When `before` is true, map as if the changes
  in `other` happened before the ones in `this`.
  */
  mapDesc(other, before = false) {
    return other.empty ? this : mapSet(this, other, before);
  }
  mapPos(pos, assoc = -1, mode2 = MapMode.Simple) {
    let posA = 0, posB = 0;
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++], endA = posA + len;
      if (ins < 0) {
        if (endA > pos)
          return posB + (pos - posA);
        posB += len;
      } else {
        if (mode2 != MapMode.Simple && endA >= pos && (mode2 == MapMode.TrackDel && posA < pos && endA > pos || mode2 == MapMode.TrackBefore && posA < pos || mode2 == MapMode.TrackAfter && endA > pos))
          return null;
        if (endA > pos || endA == pos && assoc < 0 && !len)
          return pos == posA || assoc < 0 ? posB : posB + ins;
        posB += ins;
      }
      posA = endA;
    }
    if (pos > posA)
      throw new RangeError(`Position ${pos} is out of range for changeset of length ${posA}`);
    return posB;
  }
  /**
  Check whether these changes touch a given range. When one of the
  changes entirely covers the range, the string `"cover"` is
  returned.
  */
  touchesRange(from, to = from) {
    for (let i = 0, pos = 0; i < this.sections.length && pos <= to; ) {
      let len = this.sections[i++], ins = this.sections[i++], end = pos + len;
      if (ins >= 0 && pos <= to && end >= from)
        return pos < from && end > to ? "cover" : true;
      pos = end;
    }
    return false;
  }
  /**
  @internal
  */
  toString() {
    let result = "";
    for (let i = 0; i < this.sections.length; ) {
      let len = this.sections[i++], ins = this.sections[i++];
      result += (result ? " " : "") + len + (ins >= 0 ? ":" + ins : "");
    }
    return result;
  }
  /**
  Serialize this change desc to a JSON-representable value.
  */
  toJSON() {
    return this.sections;
  }
  /**
  Create a change desc from its JSON representation (as produced
  by [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeDesc.toJSON).
  */
  static fromJSON(json) {
    if (!Array.isArray(json) || json.length % 2 || json.some((a) => typeof a != "number"))
      throw new RangeError("Invalid JSON representation of ChangeDesc");
    return new ChangeDesc(json);
  }
  /**
  @internal
  */
  static create(sections) {
    return new ChangeDesc(sections);
  }
}
class ChangeSet extends ChangeDesc {
  constructor(sections, inserted) {
    super(sections);
    this.inserted = inserted;
  }
  /**
  Apply the changes to a document, returning the modified
  document.
  */
  apply(doc) {
    if (this.length != doc.length)
      throw new RangeError("Applying change set to a document with the wrong length");
    iterChanges(this, (fromA, toA, fromB, _toB, text) => doc = doc.replace(fromB, fromB + (toA - fromA), text), false);
    return doc;
  }
  mapDesc(other, before = false) {
    return mapSet(this, other, before, true);
  }
  /**
  Given the document as it existed _before_ the changes, return a
  change set that represents the inverse of this set, which could
  be used to go from the document created by the changes back to
  the document as it existed before the changes.
  */
  invert(doc) {
    let sections = this.sections.slice(), inserted = [];
    for (let i = 0, pos = 0; i < sections.length; i += 2) {
      let len = sections[i], ins = sections[i + 1];
      if (ins >= 0) {
        sections[i] = ins;
        sections[i + 1] = len;
        let index2 = i >> 1;
        while (inserted.length < index2)
          inserted.push(Text.empty);
        inserted.push(len ? doc.slice(pos, pos + len) : Text.empty);
      }
      pos += len;
    }
    return new ChangeSet(sections, inserted);
  }
  /**
  Combine two subsequent change sets into a single set. `other`
  must start in the document produced by `this`. If `this` goes
  `docA` → `docB` and `other` represents `docB` → `docC`, the
  returned value will represent the change `docA` → `docC`.
  */
  compose(other) {
    return this.empty ? other : other.empty ? this : composeSets(this, other, true);
  }
  /**
  Given another change set starting in the same document, maps this
  change set over the other, producing a new change set that can be
  applied to the document produced by applying `other`. When
  `before` is `true`, order changes as if `this` comes before
  `other`, otherwise (the default) treat `other` as coming first.
  
  Given two changes `A` and `B`, `A.compose(B.map(A))` and
  `B.compose(A.map(B, true))` will produce the same document. This
  provides a basic form of [operational
  transformation](https://en.wikipedia.org/wiki/Operational_transformation),
  and can be used for collaborative editing.
  */
  map(other, before = false) {
    return other.empty ? this : mapSet(this, other, before, true);
  }
  /**
  Iterate over the changed ranges in the document, calling `f` for
  each, with the range in the original document (`fromA`-`toA`)
  and the range that replaces it in the new document
  (`fromB`-`toB`).
  
  When `individual` is true, adjacent changes are reported
  separately.
  */
  iterChanges(f, individual = false) {
    iterChanges(this, f, individual);
  }
  /**
  Get a [change description](https://codemirror.net/6/docs/ref/#state.ChangeDesc) for this change
  set.
  */
  get desc() {
    return ChangeDesc.create(this.sections);
  }
  /**
  @internal
  */
  filter(ranges) {
    let resultSections = [], resultInserted = [], filteredSections = [];
    let iter = new SectionIter(this);
    done: for (let i = 0, pos = 0; ; ) {
      let next2 = i == ranges.length ? 1e9 : ranges[i++];
      while (pos < next2 || pos == next2 && iter.len == 0) {
        if (iter.done)
          break done;
        let len = Math.min(iter.len, next2 - pos);
        addSection(filteredSections, len, -1);
        let ins = iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0;
        addSection(resultSections, len, ins);
        if (ins > 0)
          addInsert(resultInserted, resultSections, iter.text);
        iter.forward(len);
        pos += len;
      }
      let end = ranges[i++];
      while (pos < end) {
        if (iter.done)
          break done;
        let len = Math.min(iter.len, end - pos);
        addSection(resultSections, len, -1);
        addSection(filteredSections, len, iter.ins == -1 ? -1 : iter.off == 0 ? iter.ins : 0);
        iter.forward(len);
        pos += len;
      }
    }
    return {
      changes: new ChangeSet(resultSections, resultInserted),
      filtered: ChangeDesc.create(filteredSections)
    };
  }
  /**
  Serialize this change set to a JSON-representable value.
  */
  toJSON() {
    let parts = [];
    for (let i = 0; i < this.sections.length; i += 2) {
      let len = this.sections[i], ins = this.sections[i + 1];
      if (ins < 0)
        parts.push(len);
      else if (ins == 0)
        parts.push([len]);
      else
        parts.push([len].concat(this.inserted[i >> 1].toJSON()));
    }
    return parts;
  }
  /**
  Create a change set for the given changes, for a document of the
  given length, using `lineSep` as line separator.
  */
  static of(changes, length, lineSep) {
    let sections = [], inserted = [], pos = 0;
    let total = null;
    function flush(force = false) {
      if (!force && !sections.length)
        return;
      if (pos < length)
        addSection(sections, length - pos, -1);
      let set = new ChangeSet(sections, inserted);
      total = total ? total.compose(set.map(total)) : set;
      sections = [];
      inserted = [];
      pos = 0;
    }
    function process2(spec) {
      if (Array.isArray(spec)) {
        for (let sub of spec)
          process2(sub);
      } else if (spec instanceof ChangeSet) {
        if (spec.length != length)
          throw new RangeError(`Mismatched change set length (got ${spec.length}, expected ${length})`);
        flush();
        total = total ? total.compose(spec.map(total)) : spec;
      } else {
        let { from, to = from, insert: insert2 } = spec;
        if (from > to || from < 0 || to > length)
          throw new RangeError(`Invalid change range ${from} to ${to} (in doc of length ${length})`);
        let insText = !insert2 ? Text.empty : typeof insert2 == "string" ? Text.of(insert2.split(lineSep || DefaultSplit)) : insert2;
        let insLen = insText.length;
        if (from == to && insLen == 0)
          return;
        if (from < pos)
          flush();
        if (from > pos)
          addSection(sections, from - pos, -1);
        addSection(sections, to - from, insLen);
        addInsert(inserted, sections, insText);
        pos = to;
      }
    }
    process2(changes);
    flush(!total);
    return total;
  }
  /**
  Create an empty changeset of the given length.
  */
  static empty(length) {
    return new ChangeSet(length ? [length, -1] : [], []);
  }
  /**
  Create a changeset from its JSON representation (as produced by
  [`toJSON`](https://codemirror.net/6/docs/ref/#state.ChangeSet.toJSON).
  */
  static fromJSON(json) {
    if (!Array.isArray(json))
      throw new RangeError("Invalid JSON representation of ChangeSet");
    let sections = [], inserted = [];
    for (let i = 0; i < json.length; i++) {
      let part = json[i];
      if (typeof part == "number") {
        sections.push(part, -1);
      } else if (!Array.isArray(part) || typeof part[0] != "number" || part.some((e, i2) => i2 && typeof e != "string")) {
        throw new RangeError("Invalid JSON representation of ChangeSet");
      } else if (part.length == 1) {
        sections.push(part[0], 0);
      } else {
        while (inserted.length < i)
          inserted.push(Text.empty);
        inserted[i] = Text.of(part.slice(1));
        sections.push(part[0], inserted[i].length);
      }
    }
    return new ChangeSet(sections, inserted);
  }
  /**
  @internal
  */
  static createSet(sections, inserted) {
    return new ChangeSet(sections, inserted);
  }
}
function addSection(sections, len, ins, forceJoin = false) {
  if (len == 0 && ins <= 0)
    return;
  let last = sections.length - 2;
  if (last >= 0 && ins <= 0 && ins == sections[last + 1])
    sections[last] += len;
  else if (len == 0 && sections[last] == 0)
    sections[last + 1] += ins;
  else if (forceJoin) {
    sections[last] += len;
    sections[last + 1] += ins;
  } else
    sections.push(len, ins);
}
function addInsert(values, sections, value) {
  if (value.length == 0)
    return;
  let index2 = sections.length - 2 >> 1;
  if (index2 < values.length) {
    values[values.length - 1] = values[values.length - 1].append(value);
  } else {
    while (values.length < index2)
      values.push(Text.empty);
    values.push(value);
  }
}
function iterChanges(desc, f, individual) {
  let inserted = desc.inserted;
  for (let posA = 0, posB = 0, i = 0; i < desc.sections.length; ) {
    let len = desc.sections[i++], ins = desc.sections[i++];
    if (ins < 0) {
      posA += len;
      posB += len;
    } else {
      let endA = posA, endB = posB, text = Text.empty;
      for (; ; ) {
        endA += len;
        endB += ins;
        if (ins && inserted)
          text = text.append(inserted[i - 2 >> 1]);
        if (individual || i == desc.sections.length || desc.sections[i + 1] < 0)
          break;
        len = desc.sections[i++];
        ins = desc.sections[i++];
      }
      f(posA, endA, posB, endB, text);
      posA = endA;
      posB = endB;
    }
  }
}
function mapSet(setA, setB, before, mkSet = false) {
  let sections = [], insert2 = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let inserted = -1; ; ) {
    if (a.ins == -1 && b.ins == -1) {
      let len = Math.min(a.len, b.len);
      addSection(sections, len, -1);
      a.forward(len);
      b.forward(len);
    } else if (b.ins >= 0 && (a.ins < 0 || inserted == a.i || a.off == 0 && (b.len < a.len || b.len == a.len && !before))) {
      let len = b.len;
      addSection(sections, b.ins, -1);
      while (len) {
        let piece = Math.min(a.len, len);
        if (a.ins >= 0 && inserted < a.i && a.len <= piece) {
          addSection(sections, 0, a.ins);
          if (insert2)
            addInsert(insert2, sections, a.text);
          inserted = a.i;
        }
        a.forward(piece);
        len -= piece;
      }
      b.next();
    } else if (a.ins >= 0) {
      let len = 0, left = a.len;
      while (left) {
        if (b.ins == -1) {
          let piece = Math.min(left, b.len);
          len += piece;
          left -= piece;
          b.forward(piece);
        } else if (b.ins == 0 && b.len < left) {
          left -= b.len;
          b.next();
        } else {
          break;
        }
      }
      addSection(sections, len, inserted < a.i ? a.ins : 0);
      if (insert2 && inserted < a.i)
        addInsert(insert2, sections, a.text);
      inserted = a.i;
      a.forward(a.len - left);
    } else if (a.done && b.done) {
      return insert2 ? ChangeSet.createSet(sections, insert2) : ChangeDesc.create(sections);
    } else {
      throw new Error("Mismatched change set lengths");
    }
  }
}
function composeSets(setA, setB, mkSet = false) {
  let sections = [];
  let insert2 = mkSet ? [] : null;
  let a = new SectionIter(setA), b = new SectionIter(setB);
  for (let open = false; ; ) {
    if (a.done && b.done) {
      return insert2 ? ChangeSet.createSet(sections, insert2) : ChangeDesc.create(sections);
    } else if (a.ins == 0) {
      addSection(sections, a.len, 0, open);
      a.next();
    } else if (b.len == 0 && !b.done) {
      addSection(sections, 0, b.ins, open);
      if (insert2)
        addInsert(insert2, sections, b.text);
      b.next();
    } else if (a.done || b.done) {
      throw new Error("Mismatched change set lengths");
    } else {
      let len = Math.min(a.len2, b.len), sectionLen = sections.length;
      if (a.ins == -1) {
        let insB = b.ins == -1 ? -1 : b.off ? 0 : b.ins;
        addSection(sections, len, insB, open);
        if (insert2 && insB)
          addInsert(insert2, sections, b.text);
      } else if (b.ins == -1) {
        addSection(sections, a.off ? 0 : a.len, len, open);
        if (insert2)
          addInsert(insert2, sections, a.textBit(len));
      } else {
        addSection(sections, a.off ? 0 : a.len, b.off ? 0 : b.ins, open);
        if (insert2 && !b.off)
          addInsert(insert2, sections, b.text);
      }
      open = (a.ins > len || b.ins >= 0 && b.len > len) && (open || sections.length > sectionLen);
      a.forward2(len);
      b.forward(len);
    }
  }
}
class SectionIter {
  constructor(set) {
    this.set = set;
    this.i = 0;
    this.next();
  }
  next() {
    let { sections } = this.set;
    if (this.i < sections.length) {
      this.len = sections[this.i++];
      this.ins = sections[this.i++];
    } else {
      this.len = 0;
      this.ins = -2;
    }
    this.off = 0;
  }
  get done() {
    return this.ins == -2;
  }
  get len2() {
    return this.ins < 0 ? this.len : this.ins;
  }
  get text() {
    let { inserted } = this.set, index2 = this.i - 2 >> 1;
    return index2 >= inserted.length ? Text.empty : inserted[index2];
  }
  textBit(len) {
    let { inserted } = this.set, index2 = this.i - 2 >> 1;
    return index2 >= inserted.length && !len ? Text.empty : inserted[index2].slice(this.off, len == null ? void 0 : this.off + len);
  }
  forward(len) {
    if (len == this.len)
      this.next();
    else {
      this.len -= len;
      this.off += len;
    }
  }
  forward2(len) {
    if (this.ins == -1)
      this.forward(len);
    else if (len == this.ins)
      this.next();
    else {
      this.ins -= len;
      this.off += len;
    }
  }
}
let wordChar;
try {
  wordChar = /* @__PURE__ */ new RegExp("[\\p{Alphabetic}\\p{Number}_]", "u");
} catch (_) {
}
MapMode.TrackDel;
class Range {
  constructor(from, to, value) {
    this.from = from;
    this.to = to;
    this.value = value;
  }
  /**
  @internal
  */
  static create(from, to, value) {
    return new Range(from, to, value);
  }
}
function cmpRange(a, b) {
  return a.from - b.from || a.value.startSide - b.value.startSide;
}
class Chunk {
  constructor(from, to, value, maxPoint) {
    this.from = from;
    this.to = to;
    this.value = value;
    this.maxPoint = maxPoint;
  }
  get length() {
    return this.to[this.to.length - 1];
  }
  // Find the index of the given position and side. Use the ranges'
  // `from` pos when `end == false`, `to` when `end == true`.
  findIndex(pos, side, end, startAt = 0) {
    let arr = end ? this.to : this.from;
    for (let lo = startAt, hi = arr.length; ; ) {
      if (lo == hi)
        return lo;
      let mid = lo + hi >> 1;
      let diff = arr[mid] - pos || (end ? this.value[mid].endSide : this.value[mid].startSide) - side;
      if (mid == lo)
        return diff >= 0 ? lo : hi;
      if (diff >= 0)
        hi = mid;
      else
        lo = mid + 1;
    }
  }
  between(offset, from, to, f) {
    for (let i = this.findIndex(from, -1e9, true), e = this.findIndex(to, 1e9, false, i); i < e; i++)
      if (f(this.from[i] + offset, this.to[i] + offset, this.value[i]) === false)
        return false;
  }
  map(offset, changes) {
    let value = [], from = [], to = [], newPos = -1, maxPoint = -1;
    for (let i = 0; i < this.value.length; i++) {
      let val = this.value[i], curFrom = this.from[i] + offset, curTo = this.to[i] + offset, newFrom, newTo;
      if (curFrom == curTo) {
        let mapped = changes.mapPos(curFrom, val.startSide, val.mapMode);
        if (mapped == null)
          continue;
        newFrom = newTo = mapped;
        if (val.startSide != val.endSide) {
          newTo = changes.mapPos(curFrom, val.endSide);
          if (newTo < newFrom)
            continue;
        }
      } else {
        newFrom = changes.mapPos(curFrom, val.startSide);
        newTo = changes.mapPos(curTo, val.endSide);
        if (newFrom > newTo || newFrom == newTo && val.startSide > 0 && val.endSide <= 0)
          continue;
      }
      if ((newTo - newFrom || val.endSide - val.startSide) < 0)
        continue;
      if (newPos < 0)
        newPos = newFrom;
      if (val.point)
        maxPoint = Math.max(maxPoint, newTo - newFrom);
      value.push(val);
      from.push(newFrom - newPos);
      to.push(newTo - newPos);
    }
    return { mapped: value.length ? new Chunk(from, to, value, maxPoint) : null, pos: newPos };
  }
}
class RangeSet {
  constructor(chunkPos, chunk, nextLayer, maxPoint) {
    this.chunkPos = chunkPos;
    this.chunk = chunk;
    this.nextLayer = nextLayer;
    this.maxPoint = maxPoint;
  }
  /**
  @internal
  */
  static create(chunkPos, chunk, nextLayer, maxPoint) {
    return new RangeSet(chunkPos, chunk, nextLayer, maxPoint);
  }
  /**
  @internal
  */
  get length() {
    let last = this.chunk.length - 1;
    return last < 0 ? 0 : Math.max(this.chunkEnd(last), this.nextLayer.length);
  }
  /**
  The number of ranges in the set.
  */
  get size() {
    if (this.isEmpty)
      return 0;
    let size = this.nextLayer.size;
    for (let chunk of this.chunk)
      size += chunk.value.length;
    return size;
  }
  /**
  @internal
  */
  chunkEnd(index2) {
    return this.chunkPos[index2] + this.chunk[index2].length;
  }
  /**
  Update the range set, optionally adding new ranges or filtering
  out existing ones.
  
  (Note: The type parameter is just there as a kludge to work
  around TypeScript variance issues that prevented `RangeSet<X>`
  from being a subtype of `RangeSet<Y>` when `X` is a subtype of
  `Y`.)
  */
  update(updateSpec) {
    let { add = [], sort = false, filterFrom = 0, filterTo = this.length } = updateSpec;
    let filter = updateSpec.filter;
    if (add.length == 0 && !filter)
      return this;
    if (sort)
      add = add.slice().sort(cmpRange);
    if (this.isEmpty)
      return add.length ? RangeSet.of(add) : this;
    let cur = new LayerCursor(this, null, -1).goto(0), i = 0, spill = [];
    let builder = new RangeSetBuilder();
    while (cur.value || i < add.length) {
      if (i < add.length && (cur.from - add[i].from || cur.startSide - add[i].value.startSide) >= 0) {
        let range2 = add[i++];
        if (!builder.addInner(range2.from, range2.to, range2.value))
          spill.push(range2);
      } else if (cur.rangeIndex == 1 && cur.chunkIndex < this.chunk.length && (i == add.length || this.chunkEnd(cur.chunkIndex) < add[i].from) && (!filter || filterFrom > this.chunkEnd(cur.chunkIndex) || filterTo < this.chunkPos[cur.chunkIndex]) && builder.addChunk(this.chunkPos[cur.chunkIndex], this.chunk[cur.chunkIndex])) {
        cur.nextChunk();
      } else {
        if (!filter || filterFrom > cur.to || filterTo < cur.from || filter(cur.from, cur.to, cur.value)) {
          if (!builder.addInner(cur.from, cur.to, cur.value))
            spill.push(Range.create(cur.from, cur.to, cur.value));
        }
        cur.next();
      }
    }
    return builder.finishInner(this.nextLayer.isEmpty && !spill.length ? RangeSet.empty : this.nextLayer.update({ add: spill, filter, filterFrom, filterTo }));
  }
  /**
  Map this range set through a set of changes, return the new set.
  */
  map(changes) {
    if (changes.empty || this.isEmpty)
      return this;
    let chunks = [], chunkPos = [], maxPoint = -1;
    for (let i = 0; i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      let touch = changes.touchesRange(start, start + chunk.length);
      if (touch === false) {
        maxPoint = Math.max(maxPoint, chunk.maxPoint);
        chunks.push(chunk);
        chunkPos.push(changes.mapPos(start));
      } else if (touch === true) {
        let { mapped, pos } = chunk.map(start, changes);
        if (mapped) {
          maxPoint = Math.max(maxPoint, mapped.maxPoint);
          chunks.push(mapped);
          chunkPos.push(pos);
        }
      }
    }
    let next2 = this.nextLayer.map(changes);
    return chunks.length == 0 ? next2 : new RangeSet(chunkPos, chunks, next2 || RangeSet.empty, maxPoint);
  }
  /**
  Iterate over the ranges that touch the region `from` to `to`,
  calling `f` for each. There is no guarantee that the ranges will
  be reported in any specific order. When the callback returns
  `false`, iteration stops.
  */
  between(from, to, f) {
    if (this.isEmpty)
      return;
    for (let i = 0; i < this.chunk.length; i++) {
      let start = this.chunkPos[i], chunk = this.chunk[i];
      if (to >= start && from <= start + chunk.length && chunk.between(start, from - start, to - start, f) === false)
        return;
    }
    this.nextLayer.between(from, to, f);
  }
  /**
  Iterate over the ranges in this set, in order, including all
  ranges that end at or after `from`.
  */
  iter(from = 0) {
    return HeapCursor.from([this]).goto(from);
  }
  /**
  @internal
  */
  get isEmpty() {
    return this.nextLayer == this;
  }
  /**
  Iterate over the ranges in a collection of sets, in order,
  starting from `from`.
  */
  static iter(sets, from = 0) {
    return HeapCursor.from(sets).goto(from);
  }
  /**
  Iterate over two groups of sets, calling methods on `comparator`
  to notify it of possible differences.
  */
  static compare(oldSets, newSets, textDiff, comparator2, minPointSize = -1) {
    let a = oldSets.filter((set) => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
    let b = newSets.filter((set) => set.maxPoint > 0 || !set.isEmpty && set.maxPoint >= minPointSize);
    let sharedChunks = findSharedChunks(a, b, textDiff);
    let sideA = new SpanCursor(a, sharedChunks, minPointSize);
    let sideB = new SpanCursor(b, sharedChunks, minPointSize);
    textDiff.iterGaps((fromA, fromB, length) => compare(sideA, fromA, sideB, fromB, length, comparator2));
    if (textDiff.empty && textDiff.length == 0)
      compare(sideA, 0, sideB, 0, 0, comparator2);
  }
  /**
  Compare the contents of two groups of range sets, returning true
  if they are equivalent in the given range.
  */
  static eq(oldSets, newSets, from = 0, to) {
    if (to == null)
      to = 1e9 - 1;
    let a = oldSets.filter((set) => !set.isEmpty && newSets.indexOf(set) < 0);
    let b = newSets.filter((set) => !set.isEmpty && oldSets.indexOf(set) < 0);
    if (a.length != b.length)
      return false;
    if (!a.length)
      return true;
    let sharedChunks = findSharedChunks(a, b);
    let sideA = new SpanCursor(a, sharedChunks, 0).goto(from), sideB = new SpanCursor(b, sharedChunks, 0).goto(from);
    for (; ; ) {
      if (sideA.to != sideB.to || !sameValues(sideA.active, sideB.active) || sideA.point && (!sideB.point || !sideA.point.eq(sideB.point)))
        return false;
      if (sideA.to > to)
        return true;
      sideA.next();
      sideB.next();
    }
  }
  /**
  Iterate over a group of range sets at the same time, notifying
  the iterator about the ranges covering every given piece of
  content. Returns the open count (see
  [`SpanIterator.span`](https://codemirror.net/6/docs/ref/#state.SpanIterator.span)) at the end
  of the iteration.
  */
  static spans(sets, from, to, iterator, minPointSize = -1) {
    let cursor = new SpanCursor(sets, null, minPointSize).goto(from), pos = from;
    let openRanges = cursor.openStart;
    for (; ; ) {
      let curTo = Math.min(cursor.to, to);
      if (cursor.point) {
        let active = cursor.activeForPoint(cursor.to);
        let openCount = cursor.pointFrom < from ? active.length + 1 : cursor.point.startSide < 0 ? active.length : Math.min(active.length, openRanges);
        iterator.point(pos, curTo, cursor.point, active, openCount, cursor.pointRank);
        openRanges = Math.min(cursor.openEnd(curTo), active.length);
      } else if (curTo > pos) {
        iterator.span(pos, curTo, cursor.active, openRanges);
        openRanges = cursor.openEnd(curTo);
      }
      if (cursor.to > to)
        return openRanges + (cursor.point && cursor.to > to ? 1 : 0);
      pos = cursor.to;
      cursor.next();
    }
  }
  /**
  Create a range set for the given range or array of ranges. By
  default, this expects the ranges to be _sorted_ (by start
  position and, if two start at the same position,
  `value.startSide`). You can pass `true` as second argument to
  cause the method to sort them.
  */
  static of(ranges, sort = false) {
    let build = new RangeSetBuilder();
    for (let range2 of ranges instanceof Range ? [ranges] : sort ? lazySort(ranges) : ranges)
      build.add(range2.from, range2.to, range2.value);
    return build.finish();
  }
  /**
  Join an array of range sets into a single set.
  */
  static join(sets) {
    if (!sets.length)
      return RangeSet.empty;
    let result = sets[sets.length - 1];
    for (let i = sets.length - 2; i >= 0; i--) {
      for (let layer = sets[i]; layer != RangeSet.empty; layer = layer.nextLayer)
        result = new RangeSet(layer.chunkPos, layer.chunk, result, Math.max(layer.maxPoint, result.maxPoint));
    }
    return result;
  }
}
RangeSet.empty = /* @__PURE__ */ new RangeSet([], [], null, -1);
function lazySort(ranges) {
  if (ranges.length > 1)
    for (let prev = ranges[0], i = 1; i < ranges.length; i++) {
      let cur = ranges[i];
      if (cmpRange(prev, cur) > 0)
        return ranges.slice().sort(cmpRange);
      prev = cur;
    }
  return ranges;
}
RangeSet.empty.nextLayer = RangeSet.empty;
class RangeSetBuilder {
  finishChunk(newArrays) {
    this.chunks.push(new Chunk(this.from, this.to, this.value, this.maxPoint));
    this.chunkPos.push(this.chunkStart);
    this.chunkStart = -1;
    this.setMaxPoint = Math.max(this.setMaxPoint, this.maxPoint);
    this.maxPoint = -1;
    if (newArrays) {
      this.from = [];
      this.to = [];
      this.value = [];
    }
  }
  /**
  Create an empty builder.
  */
  constructor() {
    this.chunks = [];
    this.chunkPos = [];
    this.chunkStart = -1;
    this.last = null;
    this.lastFrom = -1e9;
    this.lastTo = -1e9;
    this.from = [];
    this.to = [];
    this.value = [];
    this.maxPoint = -1;
    this.setMaxPoint = -1;
    this.nextLayer = null;
  }
  /**
  Add a range. Ranges should be added in sorted (by `from` and
  `value.startSide`) order.
  */
  add(from, to, value) {
    if (!this.addInner(from, to, value))
      (this.nextLayer || (this.nextLayer = new RangeSetBuilder())).add(from, to, value);
  }
  /**
  @internal
  */
  addInner(from, to, value) {
    let diff = from - this.lastTo || value.startSide - this.last.endSide;
    if (diff <= 0 && (from - this.lastFrom || value.startSide - this.last.startSide) < 0)
      throw new Error("Ranges must be added sorted by `from` position and `startSide`");
    if (diff < 0)
      return false;
    if (this.from.length == 250)
      this.finishChunk(true);
    if (this.chunkStart < 0)
      this.chunkStart = from;
    this.from.push(from - this.chunkStart);
    this.to.push(to - this.chunkStart);
    this.last = value;
    this.lastFrom = from;
    this.lastTo = to;
    this.value.push(value);
    if (value.point)
      this.maxPoint = Math.max(this.maxPoint, to - from);
    return true;
  }
  /**
  @internal
  */
  addChunk(from, chunk) {
    if ((from - this.lastTo || chunk.value[0].startSide - this.last.endSide) < 0)
      return false;
    if (this.from.length)
      this.finishChunk(true);
    this.setMaxPoint = Math.max(this.setMaxPoint, chunk.maxPoint);
    this.chunks.push(chunk);
    this.chunkPos.push(from);
    let last = chunk.value.length - 1;
    this.last = chunk.value[last];
    this.lastFrom = chunk.from[last] + from;
    this.lastTo = chunk.to[last] + from;
    return true;
  }
  /**
  Finish the range set. Returns the new set. The builder can't be
  used anymore after this has been called.
  */
  finish() {
    return this.finishInner(RangeSet.empty);
  }
  /**
  @internal
  */
  finishInner(next2) {
    if (this.from.length)
      this.finishChunk(false);
    if (this.chunks.length == 0)
      return next2;
    let result = RangeSet.create(this.chunkPos, this.chunks, this.nextLayer ? this.nextLayer.finishInner(next2) : next2, this.setMaxPoint);
    this.from = null;
    return result;
  }
}
function findSharedChunks(a, b, textDiff) {
  let inA = /* @__PURE__ */ new Map();
  for (let set of a)
    for (let i = 0; i < set.chunk.length; i++)
      if (set.chunk[i].maxPoint <= 0)
        inA.set(set.chunk[i], set.chunkPos[i]);
  let shared = /* @__PURE__ */ new Set();
  for (let set of b)
    for (let i = 0; i < set.chunk.length; i++) {
      let known = inA.get(set.chunk[i]);
      if (known != null && (textDiff ? textDiff.mapPos(known) : known) == set.chunkPos[i] && !(textDiff === null || textDiff === void 0 ? void 0 : textDiff.touchesRange(known, known + set.chunk[i].length)))
        shared.add(set.chunk[i]);
    }
  return shared;
}
class LayerCursor {
  constructor(layer, skip, minPoint, rank = 0) {
    this.layer = layer;
    this.skip = skip;
    this.minPoint = minPoint;
    this.rank = rank;
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  get endSide() {
    return this.value ? this.value.endSide : 0;
  }
  goto(pos, side = -1e9) {
    this.chunkIndex = this.rangeIndex = 0;
    this.gotoInner(pos, side, false);
    return this;
  }
  gotoInner(pos, side, forward) {
    while (this.chunkIndex < this.layer.chunk.length) {
      let next2 = this.layer.chunk[this.chunkIndex];
      if (!(this.skip && this.skip.has(next2) || this.layer.chunkEnd(this.chunkIndex) < pos || next2.maxPoint < this.minPoint))
        break;
      this.chunkIndex++;
      forward = false;
    }
    if (this.chunkIndex < this.layer.chunk.length) {
      let rangeIndex = this.layer.chunk[this.chunkIndex].findIndex(pos - this.layer.chunkPos[this.chunkIndex], side, true);
      if (!forward || this.rangeIndex < rangeIndex)
        this.setRangeIndex(rangeIndex);
    }
    this.next();
  }
  forward(pos, side) {
    if ((this.to - pos || this.endSide - side) < 0)
      this.gotoInner(pos, side, true);
  }
  next() {
    for (; ; ) {
      if (this.chunkIndex == this.layer.chunk.length) {
        this.from = this.to = 1e9;
        this.value = null;
        break;
      } else {
        let chunkPos = this.layer.chunkPos[this.chunkIndex], chunk = this.layer.chunk[this.chunkIndex];
        let from = chunkPos + chunk.from[this.rangeIndex];
        this.from = from;
        this.to = chunkPos + chunk.to[this.rangeIndex];
        this.value = chunk.value[this.rangeIndex];
        this.setRangeIndex(this.rangeIndex + 1);
        if (this.minPoint < 0 || this.value.point && this.to - this.from >= this.minPoint)
          break;
      }
    }
  }
  setRangeIndex(index2) {
    if (index2 == this.layer.chunk[this.chunkIndex].value.length) {
      this.chunkIndex++;
      if (this.skip) {
        while (this.chunkIndex < this.layer.chunk.length && this.skip.has(this.layer.chunk[this.chunkIndex]))
          this.chunkIndex++;
      }
      this.rangeIndex = 0;
    } else {
      this.rangeIndex = index2;
    }
  }
  nextChunk() {
    this.chunkIndex++;
    this.rangeIndex = 0;
    this.next();
  }
  compare(other) {
    return this.from - other.from || this.startSide - other.startSide || this.rank - other.rank || this.to - other.to || this.endSide - other.endSide;
  }
}
class HeapCursor {
  constructor(heap) {
    this.heap = heap;
  }
  static from(sets, skip = null, minPoint = -1) {
    let heap = [];
    for (let i = 0; i < sets.length; i++) {
      for (let cur = sets[i]; !cur.isEmpty; cur = cur.nextLayer) {
        if (cur.maxPoint >= minPoint)
          heap.push(new LayerCursor(cur, skip, minPoint, i));
      }
    }
    return heap.length == 1 ? heap[0] : new HeapCursor(heap);
  }
  get startSide() {
    return this.value ? this.value.startSide : 0;
  }
  goto(pos, side = -1e9) {
    for (let cur of this.heap)
      cur.goto(pos, side);
    for (let i = this.heap.length >> 1; i >= 0; i--)
      heapBubble(this.heap, i);
    this.next();
    return this;
  }
  forward(pos, side) {
    for (let cur of this.heap)
      cur.forward(pos, side);
    for (let i = this.heap.length >> 1; i >= 0; i--)
      heapBubble(this.heap, i);
    if ((this.to - pos || this.value.endSide - side) < 0)
      this.next();
  }
  next() {
    if (this.heap.length == 0) {
      this.from = this.to = 1e9;
      this.value = null;
      this.rank = -1;
    } else {
      let top = this.heap[0];
      this.from = top.from;
      this.to = top.to;
      this.value = top.value;
      this.rank = top.rank;
      if (top.value)
        top.next();
      heapBubble(this.heap, 0);
    }
  }
}
function heapBubble(heap, index2) {
  for (let cur = heap[index2]; ; ) {
    let childIndex = (index2 << 1) + 1;
    if (childIndex >= heap.length)
      break;
    let child = heap[childIndex];
    if (childIndex + 1 < heap.length && child.compare(heap[childIndex + 1]) >= 0) {
      child = heap[childIndex + 1];
      childIndex++;
    }
    if (cur.compare(child) < 0)
      break;
    heap[childIndex] = cur;
    heap[index2] = child;
    index2 = childIndex;
  }
}
class SpanCursor {
  constructor(sets, skip, minPoint) {
    this.minPoint = minPoint;
    this.active = [];
    this.activeTo = [];
    this.activeRank = [];
    this.minActive = -1;
    this.point = null;
    this.pointFrom = 0;
    this.pointRank = 0;
    this.to = -1e9;
    this.endSide = 0;
    this.openStart = -1;
    this.cursor = HeapCursor.from(sets, skip, minPoint);
  }
  goto(pos, side = -1e9) {
    this.cursor.goto(pos, side);
    this.active.length = this.activeTo.length = this.activeRank.length = 0;
    this.minActive = -1;
    this.to = pos;
    this.endSide = side;
    this.openStart = -1;
    this.next();
    return this;
  }
  forward(pos, side) {
    while (this.minActive > -1 && (this.activeTo[this.minActive] - pos || this.active[this.minActive].endSide - side) < 0)
      this.removeActive(this.minActive);
    this.cursor.forward(pos, side);
  }
  removeActive(index2) {
    remove(this.active, index2);
    remove(this.activeTo, index2);
    remove(this.activeRank, index2);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  addActive(trackOpen) {
    let i = 0, { value, to, rank } = this.cursor;
    while (i < this.activeRank.length && (rank - this.activeRank[i] || to - this.activeTo[i]) > 0)
      i++;
    insert(this.active, i, value);
    insert(this.activeTo, i, to);
    insert(this.activeRank, i, rank);
    if (trackOpen)
      insert(trackOpen, i, this.cursor.from);
    this.minActive = findMinIndex(this.active, this.activeTo);
  }
  // After calling this, if `this.point` != null, the next range is a
  // point. Otherwise, it's a regular range, covered by `this.active`.
  next() {
    let from = this.to, wasPoint = this.point;
    this.point = null;
    let trackOpen = this.openStart < 0 ? [] : null;
    for (; ; ) {
      let a = this.minActive;
      if (a > -1 && (this.activeTo[a] - this.cursor.from || this.active[a].endSide - this.cursor.startSide) < 0) {
        if (this.activeTo[a] > from) {
          this.to = this.activeTo[a];
          this.endSide = this.active[a].endSide;
          break;
        }
        this.removeActive(a);
        if (trackOpen)
          remove(trackOpen, a);
      } else if (!this.cursor.value) {
        this.to = this.endSide = 1e9;
        break;
      } else if (this.cursor.from > from) {
        this.to = this.cursor.from;
        this.endSide = this.cursor.startSide;
        break;
      } else {
        let nextVal = this.cursor.value;
        if (!nextVal.point) {
          this.addActive(trackOpen);
          this.cursor.next();
        } else if (wasPoint && this.cursor.to == this.to && this.cursor.from < this.cursor.to) {
          this.cursor.next();
        } else {
          this.point = nextVal;
          this.pointFrom = this.cursor.from;
          this.pointRank = this.cursor.rank;
          this.to = this.cursor.to;
          this.endSide = nextVal.endSide;
          this.cursor.next();
          this.forward(this.to, this.endSide);
          break;
        }
      }
    }
    if (trackOpen) {
      this.openStart = 0;
      for (let i = trackOpen.length - 1; i >= 0 && trackOpen[i] < from; i--)
        this.openStart++;
    }
  }
  activeForPoint(to) {
    if (!this.active.length)
      return this.active;
    let active = [];
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.activeRank[i] < this.pointRank)
        break;
      if (this.activeTo[i] > to || this.activeTo[i] == to && this.active[i].endSide >= this.point.endSide)
        active.push(this.active[i]);
    }
    return active.reverse();
  }
  openEnd(to) {
    let open = 0;
    for (let i = this.activeTo.length - 1; i >= 0 && this.activeTo[i] > to; i--)
      open++;
    return open;
  }
}
function compare(a, startA, b, startB, length, comparator2) {
  a.goto(startA);
  b.goto(startB);
  let endB = startB + length;
  let pos = startB, dPos = startB - startA;
  for (; ; ) {
    let diff = a.to + dPos - b.to || a.endSide - b.endSide;
    let end = diff < 0 ? a.to + dPos : b.to, clipEnd = Math.min(end, endB);
    if (a.point || b.point) {
      if (!(a.point && b.point && (a.point == b.point || a.point.eq(b.point)) && sameValues(a.activeForPoint(a.to), b.activeForPoint(b.to))))
        comparator2.comparePoint(pos, clipEnd, a.point, b.point);
    } else {
      if (clipEnd > pos && !sameValues(a.active, b.active))
        comparator2.compareRange(pos, clipEnd, a.active, b.active);
    }
    if (end > endB)
      break;
    pos = end;
    if (diff <= 0)
      a.next();
    if (diff >= 0)
      b.next();
  }
}
function sameValues(a, b) {
  if (a.length != b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] != b[i] && !a[i].eq(b[i]))
      return false;
  return true;
}
function remove(array, index2) {
  for (let i = index2, e = array.length - 1; i < e; i++)
    array[i] = array[i + 1];
  array.pop();
}
function insert(array, index2, value) {
  for (let i = array.length - 1; i >= index2; i--)
    array[i + 1] = array[i];
  array[index2] = value;
}
function findMinIndex(value, array) {
  let found = -1, foundPos = 1e9;
  for (let i = 0; i < array.length; i++)
    if ((array[i] - foundPos || value[i].endSide - value[found].endSide) < 0) {
      found = i;
      foundPos = array[i];
    }
  return found;
}
let PUSH_CHARS = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
let lastPushTime = 0;
let lastRandChars = [];
function getID() {
  var now = (/* @__PURE__ */ new Date()).getTime();
  var duplicateTime = now === lastPushTime;
  lastPushTime = now;
  var timeStampChars = new Array(8);
  for (var i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
    now = Math.floor(now / 64);
  }
  if (now !== 0)
    throw new Error("We should have converted the entire timestamp.");
  var id = timeStampChars.join("");
  if (!duplicateTime) {
    for (i = 0; i < 12; i++) {
      lastRandChars[i] = Math.floor(Math.random() * 64);
    }
  } else {
    for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }
  for (i = 0; i < 12; i++) {
    id += PUSH_CHARS.charAt(lastRandChars[i]);
  }
  if (id.length != 20) throw new Error("Length should be 20.");
  return id;
}
class DesktopDocument extends EventEmitter {
  constructor(id, path = null, defaultContent = "") {
    super();
    this.id = id;
    const loadContent = async () => {
      let doc = Text.of(defaultContent.split(/\r?\n/));
      let version = 0;
      let saved = false;
      if (!path) {
        this.content = { doc, version };
        this.fileStatus = { path, version, saved };
      } else {
        this.fileStatus = { path, version: null, saved: true };
        try {
          doc = Text.of(
            (await promises.readFile(path, { encoding: "utf-8" })).split(/\r?\n/)
          );
          saved = true;
        } catch (err) {
          if (err.code !== "ENOENT") {
            throw err;
          }
        }
        await promises.mkdir(require$$0$1.dirname(path), { recursive: true });
        this.content = { doc, version };
        let fileStatus = { path, version, saved };
        this.fileStatus = fileStatus;
        this.emit("loaded", { ...fileStatus, doc });
      }
    };
    loadContent();
  }
  fileStatus = { path: null, version: null, saved: false };
  content = null;
  get path() {
    return this.fileStatus.path;
  }
  get needsSave() {
    if (!this.fileStatus.path && (!this.content || this.content.doc.eq(Text.empty))) {
      return false;
    }
    return this.fileStatus.version === this.content?.version ? !this.fileStatus.saved : true;
  }
  saveQueue = /* @__PURE__ */ new Map();
  async save(newPath = null) {
    let { path, version } = this.fileStatus;
    path = newPath ?? path;
    let content = this.content;
    if (version === null || content === null)
      throw Error("Can't save an unloaded document.");
    if (path === null) throw Error("Can't save a document with no path.");
    let fileStatus = { path, version, saved: "saving" };
    this.fileStatus = fileStatus;
    this.emit("status", fileStatus);
    let currentSave = this.saveQueue.get(path);
    if (currentSave) {
      if (content.version > currentSave.version) {
        this.saveQueue.set(path, content);
      }
      return;
    }
    currentSave = content;
    while (currentSave) {
      let doc;
      ({ doc, version } = currentSave);
      await promises.writeFile(path, doc.sliceString(0));
      currentSave = this.saveQueue.get(path);
      this.saveQueue.delete(path);
    }
    if (this.fileStatus.path === path) {
      fileStatus = { path, version, saved: true };
      this.fileStatus = fileStatus;
      this.emit("status", fileStatus);
    }
  }
  update(update) {
    if (!this.content) throw Error("Can't update an unloaded document");
    let { changes, version } = update;
    let doc = ChangeSet.fromJSON(changes).apply(this.content.doc);
    let content = { doc, version };
    this.content = content;
    this.emit("update", content);
  }
  async close() {
    this.emit("closed", void 0);
  }
}
class Filesystem extends EventEmitter {
  docs = /* @__PURE__ */ new Map();
  getDoc(id) {
    return this.docs.get(id) ?? null;
  }
  getIDFromPath(path) {
    for (let [id, doc] of this.docs) {
      if (doc.path === path) {
        return id;
      }
    }
    return null;
  }
  getDocFromPath(path) {
    let id = this.getIDFromPath(path);
    if (id === null) return null;
    return this.getDoc(id);
  }
  loadDoc(path, defaultContent) {
    let existing;
    if (path && (existing = this.getDocFromPath(path))) {
      this.emit("setCurrent", existing.id);
      return existing;
    }
    let id = getID();
    let document = new DesktopDocument(id, path, defaultContent);
    this.docs.set(id, document);
    document.once("closed", () => {
      this.docs.delete(id);
    });
    this.emit("open", document);
    return document;
  }
  _currentDocID = null;
  get currentDocID() {
    return this._currentDocID;
  }
  set currentDocID(docID) {
    this._currentDocID = docID;
    this.emit("current", this.currentDoc);
  }
  get currentDoc() {
    return this._currentDocID !== null ? this.getDoc(this._currentDocID) : null;
  }
}
function wrapIPC(webContents) {
  function send(channel, value) {
    webContents.send(channel, value);
  }
  function listen(channel, handler) {
    function handle(_, value) {
      handler(value);
    }
    webContents.ipc.on(channel, handle);
    return () => {
      webContents.ipc.off(channel, handle);
    };
  }
  return [send, listen];
}
const isWin = process.platform === "win32";
const isMac = process.platform === "darwin";
class ElectronMenu extends EventEmitter {
  // The main menu
  menu = new electron.Menu();
  // Menu items that will be modified
  saveItem;
  saveAsItem;
  closeItem;
  constructor() {
    super();
    if (isMac) {
      this.menu.append(
        new electron.MenuItem({
          label: electron.app.name,
          submenu: [
            {
              label: "About",
              click: (_, window2) => this.emit("about", window2)
            },
            { type: "separator" },
            { role: "hide" },
            { role: "unhide" },
            { type: "separator" },
            { role: "quit" }
          ]
        })
      );
    }
    let fileMenu = new electron.MenuItem({
      role: "fileMenu",
      submenu: [
        {
          label: "New",
          accelerator: "CommandOrControl+N",
          click: (_, window2) => this.emit("newFile", window2)
        },
        {
          label: "Open...",
          accelerator: "CommandOrControl+O",
          click: (_, window2) => this.emit("openFile", window2)
        }
      ]
    });
    this.saveItem = new electron.MenuItem({
      id: "save",
      label: "Save",
      accelerator: "CommandOrControl+S",
      click: (_, window2) => this.emit("saveFile", window2)
    });
    fileMenu.submenu?.append(this.saveItem);
    this.saveAsItem = new electron.MenuItem({
      id: "saveAs",
      label: "Save As...",
      accelerator: "CommandOrControl+Shift+S",
      click: (_, window2) => this.emit("saveAsFile", window2)
    });
    fileMenu.submenu?.append(this.saveAsItem);
    fileMenu.submenu?.append(new electron.MenuItem({ type: "separator" }));
    fileMenu.submenu?.append(
      new electron.MenuItem({
        label: "Settings",
        click: (_, window2) => this.emit("settings", window2)
      })
    );
    fileMenu.submenu?.append(new electron.MenuItem({ type: "separator" }));
    this.closeItem = new electron.MenuItem({
      id: "close",
      label: "Close Editor",
      accelerator: "CommandOrControl+W",
      click: (_, window2) => this.emit("close", window2)
    });
    fileMenu.submenu?.append(this.closeItem);
    if (!isMac) {
      fileMenu.submenu?.append(new electron.MenuItem({ role: "quit" }));
    }
    this.menu.append(fileMenu);
    this.currentDoc = null;
    this.menu.append(
      new electron.MenuItem({
        role: "editMenu",
        submenu: [
          {
            label: "Undo",
            accelerator: "CommandOrControl+Z",
            click: (_, window2, { triggeredByAccelerator }) => {
              if (window2 && !triggeredByAccelerator) {
                window2.webContents.sendInputEvent({
                  type: "keyDown",
                  keyCode: "Ctrl"
                });
                window2.webContents.sendInputEvent({
                  type: "keyDown",
                  keyCode: "Z",
                  modifiers: ["control"]
                });
                window2.webContents.sendInputEvent({
                  type: "keyUp",
                  keyCode: "Z",
                  modifiers: ["control"]
                });
                window2.webContents.sendInputEvent({
                  type: "keyUp",
                  keyCode: "Ctrl"
                });
              }
            }
          },
          {
            label: "Redo",
            accelerator: isWin ? "CommandOrControl+Y" : "CommandOrControl+Shift+Z",
            click: (_, window2, { triggeredByAccelerator }) => {
              if (window2 && !triggeredByAccelerator) {
                window2.webContents.sendInputEvent({
                  type: "keyDown",
                  keyCode: "Ctrl"
                });
                window2.webContents.sendInputEvent({
                  type: "keyDown",
                  keyCode: "Shift"
                });
                window2.webContents.sendInputEvent({
                  type: "keyDown",
                  keyCode: "Z",
                  modifiers: ["control", "shift"]
                });
                window2.webContents.sendInputEvent({
                  type: "keyUp",
                  keyCode: "Z",
                  modifiers: ["control", "shift"]
                });
                window2.webContents.sendInputEvent({
                  type: "keyUp",
                  keyCode: "Shift"
                });
                window2.webContents.sendInputEvent({
                  type: "keyUp",
                  keyCode: "Ctrl"
                });
              }
            }
          },
          { type: "separator" },
          { role: "cut" },
          { role: "copy" },
          { role: "paste" }
        ]
      })
    );
    this.menu.append(
      new electron.MenuItem({
        label: "View",
        submenu: [
          {
            label: "Toggle Console",
            accelerator: "CommandOrControl+`",
            click: (_, window2) => this.emit("toggleConsole", window2)
          },
          { type: "separator" },
          { role: "resetZoom" },
          { role: "zoomIn", accelerator: "CommandOrControl+=" },
          { role: "zoomOut" },
          { type: "separator" },
          { role: "togglefullscreen" }
        ]
      })
    );
    this.menu.append(
      new electron.MenuItem({
        label: "Tidal",
        submenu: [
          {
            label: "Reboot Tidal",
            accelerator: "CommandOrControl+R",
            click: (_, window2) => this.emit("rebootTidal", window2)
          }
          // { type: "separator" },
          // { label: "About", click: () => {} },
        ]
      })
    );
    const helpMenu = new electron.MenuItem({
      role: "help",
      submenu: [{ role: "toggleDevTools" }]
    });
    if (!isMac) {
      helpMenu.submenu?.append(new electron.MenuItem({ type: "separator" }));
      helpMenu.submenu?.append(
        new electron.MenuItem({
          label: "About",
          click: (_, window2) => this.emit("about", window2)
        })
      );
    }
    this.menu.append(helpMenu);
    electron.Menu.setApplicationMenu(this.menu);
  }
  _untrackDocument = null;
  _currentDoc = null;
  get currentDoc() {
    return this._currentDoc;
  }
  set currentDoc(document) {
    if (this._untrackDocument) {
      this._untrackDocument();
      this._untrackDocument = null;
    }
    if (document) {
      const trackSaveState = () => {
        this.saveItem.enabled = document.needsSave;
        this.saveAsItem.enabled = true;
        this.closeItem.enabled = true;
        let unStatus = document.on("status", () => {
          this.saveItem.enabled = document.needsSave;
        });
        let unUpdate = document.on("update", () => {
          this.saveItem.enabled = document.needsSave;
        });
        if (this._untrackDocument) this._untrackDocument();
        this._untrackDocument = () => {
          unStatus();
          unUpdate();
        };
      };
      if (document.content) {
        trackSaveState();
      } else {
        this.saveItem.enabled = false;
        this.saveAsItem.enabled = false;
        this.closeItem.enabled = false;
        this._untrackDocument = document.once("loaded", () => {
          trackSaveState();
        });
      }
    } else {
      this.saveItem.enabled = false;
      this.saveAsItem.enabled = false;
      this.closeItem.enabled = false;
    }
    this._currentDoc = document;
  }
}
const menu = new ElectronMenu();
fixPath();
const filesystem = new Filesystem();
const settingsPath = require$$0$1.resolve(electron.app.getPath("userData"), "settings.json");
const createWindow = (configuration) => {
  const tidal = new GHCI(configuration);
  const window2 = new electron.BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      preload: require$$0$1.resolve(electron.app.getAppPath(), "out/preload/index.js"),
      sandbox: process.env.NODE_ENV === "production"
    }
  });
  let listeners = [];
  let docsListeners = {};
  window2.on("ready-to-show", () => {
    const [send, listen] = wrapIPC(window2.webContents);
    listeners.push(
      listen("current", ({ id }) => {
        filesystem.currentDocID = id;
      })
    );
    listeners.push(
      filesystem.on("current", (doc) => {
        if (doc) send("setCurrent", { id: doc.id });
      })
    );
    listeners.push(
      filesystem.on("open", (document) => {
        let { id, path, content, fileStatus } = document;
        let { saved } = fileStatus;
        let docListeners = [];
        docsListeners[id] = docListeners;
        send("open", { id, path });
        if (content) {
          let { doc, version } = content;
          send("content", {
            withID: id,
            content: { doc: doc.toJSON(), version, saved }
          });
        } else {
          document.once("loaded", (content2) => {
            send("content", {
              withID: id,
              content: { ...content2, doc: content2.doc.toJSON() }
            });
          });
        }
        docListeners.push(
          document.on("status", (status) => {
            send("status", { withID: id, content: status });
          })
        );
        docListeners.push(
          listen("update", ({ withID, value }) => {
            if (withID === id) {
              document.update(value);
            }
          })
        );
      })
    );
    listeners.push(
      filesystem.on("setCurrent", (id) => {
        send("setCurrent", { id });
      })
    );
    listeners.push(
      listen("newTab", () => {
        filesystem.loadDoc();
      })
    );
    listeners.push(
      listen("requestClose", async ({ id }) => {
        await close({ window: window2, id });
      })
    );
    tidal.getVersion().then((version) => {
      send("tidalVersion", version);
    });
    listeners.push(
      listen("evaluation", (code) => {
        tidal.send(code);
      })
    );
    listeners.push(
      menu.on("rebootTidal", () => {
        tidal.restart();
      })
    );
    listeners.push(
      menu.on("toggleConsole", () => {
        send("toggleConsole", void 0);
      })
    );
    listeners.push(
      menu.on("settings", async () => {
        let settingsDoc = filesystem.loadDoc(settingsPath, "{}");
        settingsDoc.on("status", ({ saved }) => {
          if (saved === true) {
            try {
              let settingsText = settingsDoc.content?.doc.toString();
              if (typeof settingsText === "string") {
                configuration.update(JSON.parse(settingsText));
              }
            } catch (error2) {
              console.log("Error updating settings");
            }
          }
        });
      })
    );
    listeners.push(
      tidal.on("message", (message) => {
        send("console", message);
      })
    );
    listeners.push(
      tidal.on("now", (now) => {
        send("tidalNow", now);
      })
    );
    listeners.push(
      tidal.on("highlight", (highlightEvent) => {
        send("tidalHighlight", highlightEvent);
      })
    );
    send("settingsData", configuration.data);
    listeners.push(
      configuration.on("change", (data) => {
        send("settingsData", data);
      })
    );
    filesystem.loadDoc();
    window2.show();
  });
  if (!electron.app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    window2.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    window2.loadFile("./out/renderer/index.html");
  }
  window2.on("close", async (event) => {
    let docs = [...filesystem.docs.values()];
    if (!docs.some((doc) => doc.needsSave)) return;
    event.preventDefault();
    try {
      await closeAll(window2);
      window2.close();
    } catch (error2) {
      if (!(error2 instanceof CancelledError)) {
        console.log("Unexpected Error: " + error2.message);
      }
    }
  });
  window2.on("closed", () => {
    for (let listener of listeners) {
      listener();
    }
    listeners = [];
    for (let docListeners of Object.values(docsListeners)) {
      for (let listener of docListeners) {
        listener();
      }
    }
    docsListeners = {};
    tidal.close();
  });
};
electron.app.whenReady().then(async () => {
  const settings2 = new Config();
  let settingsData = {};
  try {
    settingsData = JSON.parse(await promises.readFile(settingsPath, "utf-8"));
  } catch (err) {
  }
  settings2.update(settingsData);
  createWindow(settings2);
});
menu.on("newFile", newFile);
async function newFile() {
  filesystem.loadDoc();
}
menu.on("openFile", openFile);
async function openFile(window2) {
  if (window2) {
    let result = await electron.dialog.showOpenDialog(window2, {
      properties: ["openFile"]
    });
    if (result.canceled) return;
    filesystem.loadDoc(result.filePaths[0]);
  } else {
    electron.dialog.showOpenDialog({ properties: ["openFile"] });
  }
}
menu.on("saveFile", saveFile);
async function saveFile(window2) {
  if (window2) {
    if (filesystem.currentDoc) {
      if (filesystem.currentDoc.path === null) {
        saveAsFile(window2);
      } else {
        filesystem.currentDoc.save();
      }
    }
  }
}
menu.on("saveAsFile", saveAsFile);
async function saveAsFile(window2) {
  if (window2) {
    let result = await electron.dialog.showSaveDialog(window2);
    if (result.canceled || !result.filePath) return;
    if (filesystem.currentDoc) {
      filesystem.currentDoc.save(result.filePath);
    }
  }
}
menu.on("close", (window2) => {
  close({ window: window2 });
});
async function close({ window: window2, id }) {
  if (!window2) return;
  let [send] = wrapIPC(window2.webContents);
  id = id ?? filesystem.currentDocID;
  let document = id ? filesystem.getDoc(id) : filesystem.currentDoc;
  if (!id || !document) {
    if (id) {
      send("close", { id });
    }
    return;
  }
  if (document.needsSave) {
    let { response } = await electron.dialog.showMessageBox(window2, {
      type: "warning",
      message: "Do you want to save your changes?",
      buttons: ["Save", "Don't Save", "Cancel"]
    });
    if (response === 2) return;
    if (response === 0) {
      if (document.path) {
        document.save();
      } else {
        let { canceled, filePath } = await electron.dialog.showSaveDialog(window2);
        if (!canceled && filePath) {
          document.save(filePath);
        }
      }
    }
  }
  await document.close();
  send("close", { id });
}
class CancelledError extends Error {
  constructor() {
    super("Close All action was cancelled");
  }
}
async function closeAll(window2) {
  if (!window2) return;
  let [send] = wrapIPC(window2.webContents);
  let docs = [...filesystem.docs.values()];
  if (docs.some((doc) => doc.needsSave)) {
    let { response } = await electron.dialog.showMessageBox(window2, {
      type: "warning",
      message: "Do you want to save your changes?",
      buttons: ["Save", "Don't Save", "Cancel"]
    });
    if (response === 2) throw new CancelledError();
    if (response === 0) {
      for (let doc of docs) {
        if (doc.needsSave) {
          if (doc.path !== null) {
            doc.save();
          } else {
            filesystem.currentDocID = doc.id;
            let { canceled, filePath } = await electron.dialog.showSaveDialog(window2);
            if (!canceled && filePath) {
              await doc.save(filePath);
            } else {
              throw new CancelledError();
            }
          }
        }
      }
    }
  }
  await Promise.all(
    docs.map((doc) => doc.close().then(() => send("close", { id: doc.id })))
  );
}
menu.on("about", showAbout);
function showAbout(window2) {
  if (window2) {
    let [send] = wrapIPC(window2.webContents);
    send("showAbout", electron.app.getVersion());
  }
}
menu.currentDoc = filesystem.currentDoc;
filesystem.on("current", (doc) => {
  menu.currentDoc = doc;
});
