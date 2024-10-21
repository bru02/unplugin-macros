import { UnpluginInstance } from 'unplugin';
import { O as Options } from './index-CpQbvnzJ.js';
export { M as MacroContext } from './index-CpQbvnzJ.js';
import '@rollup/pluginutils';
import 'vite';
import 'vite-node/client';

/**
 * This entry file is for main unplugin.
 * @module
 */

/**
 * The main unplugin instance.
 */
declare const plugin: UnpluginInstance<Options | undefined, false>;

export { Options, plugin as default };
