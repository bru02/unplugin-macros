import { InlineConfig } from 'vite';
import { FilterPattern } from '@rollup/pluginutils';

interface Options {
    /**
     * @default [/\.[cm]?[jt]sx?$/]
     */
    include?: FilterPattern;
    /**
     * @default [/node_modules/]
     */
    exclude?: FilterPattern;
    /**
     * Available except Vite itself.
     *
     * For Vite, the current Vite instance and configuration will be used directly, so this option will be ignored.
     * @see https://vitejs.dev/config/
     */
    viteConfig?: InlineConfig;
    /**
     * Adjust the plugin order (only works for Vite and Webpack)
     * @default 'pre'
     */
    enforce?: 'pre' | 'post' | undefined;
    /**
     * Import attribute mapping
     *
     * @default { "type": "macro" }
     */
    attrs?: Record<string, string>;
}
type OptionsResolved = Omit<Required<Options>, 'enforce'> & {
    enforce?: Options['enforce'];
};
declare function resolveOptions(options: Options): OptionsResolved;

export { Options as O, OptionsResolved as a, resolveOptions as r };
