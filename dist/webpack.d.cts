import plugin from './index.cjs';
import 'unplugin';
import './index-CpQbvnzJ.cjs';
import '@rollup/pluginutils';
import 'vite';
import 'vite-node/client';

/**
 * This entry file is for webpack plugin.
 *
 * @module
 */

/**
 * Webpack plugin
 *
 * @example
 * ```ts
 * // webpack.config.js
 * module.exports = {
 *  plugins: [require('unplugin-macros/webpack')()],
 * }
 * ```
 */
declare const _default: typeof plugin.webpack;

export = _default;
