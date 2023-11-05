import {
  resolveOptions,
  transformMacros
} from "./chunk-6KIXESFE.mjs";

// src/index.ts
import { createUnplugin } from "unplugin";
import { createFilter } from "@rollup/pluginutils";
import { createServer } from "vite";
import { ViteNodeServer } from "vite-node/server";
import { ViteNodeRunner } from "vite-node/client";
import { installSourcemapsSupport } from "vite-node/source-map";
var src_default = createUnplugin((rawOptions = {}) => {
  const options = resolveOptions(rawOptions);
  const filter = createFilter(options.include, options.exclude);
  let builtInServer = true;
  let server;
  let node;
  let runner;
  const deps = /* @__PURE__ */ new Map();
  let initPromise;
  async function initServer() {
    server = await createServer({
      ...options.viteConfig,
      optimizeDeps: {
        disabled: true
      }
    });
    await server.pluginContainer.buildStart({});
  }
  function initRunner() {
    node = new ViteNodeServer(server);
    installSourcemapsSupport({
      getSourceMap: (source) => node.getSourceMap(source)
    });
    runner = new ViteNodeRunner({
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
      return transformMacros(code, id, getRunner, deps, options.attrs);
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
          server2.moduleGraph.getModulesByFile(id)?.forEach((m) => affected.add(m));
        }
        return [...affected, ...modules];
      }
    }
  };
});
function defineMacro(fn) {
  return fn;
}

export {
  src_default,
  defineMacro
};
