import { FilterPattern } from '@rollup/pluginutils';
import { ViteDevServer, InlineConfig } from 'vite';
import { UnpluginBuildContext, UnpluginContext } from 'unplugin';
import { ViteNodeRunner } from 'vite-node/client';

/**
 * Represents the options for the plugin.
 */
interface Options {
    /**
     * The patterns of files to include.
     * @default [/\.[cm]?[jt]sx?$/]
     */
    include?: FilterPattern;
    /**
     * The patterns of files to exclude.
     * @default [/node_modules/]
     */
    exclude?: FilterPattern;
    /**
     * The Vite dev server instance.
     *
     * If not provided and the bundler is Vite, it will reuse the current dev server.
     * If not provided, it will try to use `viteConfig` to create one.
     */
    viteServer?: ViteDevServer | false;
    /**
     * The Vite configuration.
     * Available when `viteServer` is not provided.
     * @see https://vitejs.dev/config/
     */
    viteConfig?: InlineConfig;
    /**
     * Adjusts the plugin order (only works for Vite and Webpack).
     * @default 'pre'
     */
    enforce?: 'pre' | 'post' | undefined;
    /**
     * The mapping of import attributes.
     * @default { "type": "macro" }
     */
    attrs?: Record<string, string>;
}
/**
 * Represents the resolved options for the plugin.
 */
type OptionsResolved = Omit<Required<Options>, 'enforce' | 'viteServer'> & {
    enforce?: Options['enforce'];
    viteServer?: Options['viteServer'];
};
/**
 * Resolves the options for the plugin.
 *
 * @param options - The options to resolve.
 * @returns The resolved options.
 */
declare function resolveOptions(options: Options): OptionsResolved;

/**
 * Represents the context object passed to macros.
 */
interface MacroContext {
    id: string;
    source: string;
    emitFile: UnpluginBuildContext['emitFile'];
    /**
     * **Use with caution.**
     *
     * This is an experimental feature and may be changed at any time.
     */
    unpluginContext: UnpluginBuildContext & UnpluginContext;
}
/**
 * Transforms macros in the given source code.
 * @param param0 - The transformation options.
 * @param param0.source - The source code to transform.
 * @param param0.id - The filename of the source file.
 * @param param0.unpluginContext - The unplugin context.
 * @param param0.getRunner - A function to get the ViteNodeRunner instance.
 * @param param0.deps - The dependencies of the source file.
 * @param param0.attrs - The import attributes to match.
 * @returns The transformed code and source map, or undefined if no macros were found.
 */
declare function transformMacros({ source, id, unpluginContext, getRunner, deps, attrs, }: {
    id: string;
    source: string;
    unpluginContext: UnpluginBuildContext & UnpluginContext;
    getRunner: () => Promise<ViteNodeRunner>;
    deps: Map<string, Set<string>>;
    attrs: Record<string, string>;
}): Promise<{
    code: string;
    map: any;
} | undefined>;

export { type MacroContext as M, type Options as O, type OptionsResolved as a, resolveOptions as r, transformMacros as t };
