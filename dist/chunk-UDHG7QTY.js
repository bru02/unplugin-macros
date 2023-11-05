"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }


var _chunk23MW57ZHjs = require('./chunk-23MW57ZH.js');

// src/index.ts
var _unplugin = require('unplugin');
var _pluginutils = require('@rollup/pluginutils');
var _vite = require('vite');
var _server2 = require('vite-node/server');
var _client = require('vite-node/client');
var _sourcemap = require('vite-node/source-map');
var src_default = _unplugin.createUnplugin.call(void 0, (rawOptions = {}) => {
  const options = _chunk23MW57ZHjs.resolveOptions.call(void 0, rawOptions);
  const filter = _pluginutils.createFilter.call(void 0, options.include, options.exclude);
  let builtInServer = true;
  let server;
  let node;
  let runner;
  const deps = /* @__PURE__ */ new Map();
  let initPromise;
  async function initServer() {
    server = await _vite.createServer.call(void 0, {
      ...options.viteConfig,
      optimizeDeps: {
        disabled: true
      }
    });
    await server.pluginContainer.buildStart({});
  }
  function initRunner() {
    node = new (0, _server2.ViteNodeServer)(server);
    _sourcemap.installSourcemapsSupport.call(void 0, {
      getSourceMap: (source) => node.getSourceMap(source)
    });
    runner = new (0, _client.ViteNodeRunner)({
      root: server.config.root,
      base: server.config.base,
      // when having the server and runner in a different context,
      // you will need to handle the communication between them
      // and pass to this function
      fetchModule(id) {
        return node.fetchModule(id, "ssr");
      },
      resolveId(id, importer) {
        return node.resolveId(id, importer, "ssr");
      }
    });
  }
  function init() {
    if (initPromise)
      return initPromise;
    return initPromise = (async () => {
      server || await initServer();
      initRunner();
    })();
  }
  async function getRunner() {
    await init();
    return runner;
  }
  const name = "unplugin-macros";
  return {
    name,
    enforce: options.enforce,
    buildEnd() {
      if (builtInServer && server)
        return server.close();
    },
    transformInclude(id) {
      return filter(id);
    },
    transform(code, id) {
      return _chunk23MW57ZHjs.transformMacros.call(void 0, code, id, getRunner, deps, options.attrs);
    },
    vite: {
      configureServer(_server) {
        builtInServer = false;
        server = _server;
      },
      handleHotUpdate({ file, server: server2, modules }) {
        const cache = runner.moduleCache;
        const mod = cache.get(file);
        if (!mod)
          return;
        node.fetchCache.delete(file);
        cache.invalidateModule(mod);
        const affected = /* @__PURE__ */ new Set();
        for (const [id, macrosIds] of deps.entries()) {
          if (!macrosIds.has(file))
            continue;
          _optionalChain([server2, 'access', _ => _.moduleGraph, 'access', _2 => _2.getModulesByFile, 'call', _3 => _3(id), 'optionalAccess', _4 => _4.forEach, 'call', _5 => _5((m) => affected.add(m))]);
        }
        return [...affected, ...modules];
      }
    }
  };
});
function defineMacro(fn) {
  return fn;
}




exports.src_default = src_default; exports.defineMacro = defineMacro;
