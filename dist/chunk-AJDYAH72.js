import {
  resolveOptions,
  transformMacros
} from "./chunk-GOXWG6OB.js";

// src/index.ts
import { createFilter } from "@rollup/pluginutils";
import { createUnplugin } from "unplugin";
import { ViteNodeRunner } from "vite-node/client";
import { ViteNodeServer } from "vite-node/server";
import { installSourcemapsSupport } from "vite-node/source-map";
var plugin = createUnplugin((rawOptions = {}) => {
  const options = resolveOptions(rawOptions);
  const filter = createFilter(options.include, options.exclude);
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
    const { createServer } = await import("vite");
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
      return transformMacros({
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
          server2.moduleGraph.getModulesByFile(id)?.forEach((m) => affected.add(m));
        }
        return [...affected, ...modules];
      }
    }
  };
});
var src_default = plugin;

export {
  src_default
};
