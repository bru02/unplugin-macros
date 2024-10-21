"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }


var _chunkJRQ5GQFHcjs = require('./chunk-JRQ5GQFH.cjs');

// src/index.ts
var _pluginutils = require('@rollup/pluginutils');
var _unplugin = require('unplugin');
var _client = require('vite-node/client');
var _server = require('vite-node/server');
var _sourcemap = require('vite-node/source-map');
var plugin = _unplugin.createUnplugin.call(void 0, (rawOptions = {}) => {
  const options = _chunkJRQ5GQFHcjs.resolveOptions.call(void 0, rawOptions);
  const filter = _pluginutils.createFilter.call(void 0, options.include, options.exclude);
  let externalServer;
  let server;
  let node;
  let runner;
  const deps = /* @__PURE__ */ new Map();
  let initPromise;
  function init() {
    if (initPromise) return initPromise;
    return initPromise = (async () => {
      externalServer = !!options.viteServer;
      if (options.viteServer) {
        server = options.viteServer;
        externalServer = false;
      } else {
        server = await initServer();
      }
      initRunner();
    })();
  }
  async function initServer() {
    const { createServer } = await Promise.resolve().then(() => _interopRequireWildcard(require("vite")));
    const server2 = await createServer({
      ...options.viteConfig,
      optimizeDeps: {
        include: [],
        noDiscovery: true
      }
    });
    await server2.pluginContainer.buildStart({});
    return server2;
  }
  function initRunner() {
    node = new (0, _server.ViteNodeServer)(server);
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
  async function getRunner() {
    await init();
    return runner;
  }
  const name = "unplugin-macros";
  return {
    name,
    enforce: options.enforce,
    buildEnd() {
      if (!externalServer && server)
        return server.close();
    },
    transformInclude(id) {
      return filter(id);
    },
    transform(source, id) {
      return _chunkJRQ5GQFHcjs.transformMacros.call(void 0, {
        source,
        id,
        getRunner,
        deps,
        attrs: options.attrs,
        unpluginContext: this
      });
    },
    vite: {
      configureServer(server2) {
        if (options.viteServer === void 0) {
          options.viteServer = server2;
        }
      },
      handleHotUpdate({ file, server: server2, modules }) {
        if (!runner) return;
        const cache = runner.moduleCache;
        const mod = cache.get(file);
        if (!mod) return;
        node.fetchCache.delete(file);
        cache.invalidateModule(mod);
        const affected = /* @__PURE__ */ new Set();
        for (const [id, macrosIds] of deps.entries()) {
          if (!macrosIds.has(file)) continue;
          _optionalChain([server2, 'access', _ => _.moduleGraph, 'access', _2 => _2.getModulesByFile, 'call', _3 => _3(id), 'optionalAccess', _4 => _4.forEach, 'call', _5 => _5((m) => affected.add(m))]);
        }
        return [...affected, ...modules];
      }
    }
  };
});
var src_default = plugin;



exports.src_default = src_default;
