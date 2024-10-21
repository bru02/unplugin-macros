import { M as MacroContext } from './index-CpQbvnzJ.js';
export { O as Options, a as OptionsResolved, r as resolveOptions, t as transformMacros } from './index-CpQbvnzJ.js';
import '@rollup/pluginutils';
import 'vite';
import 'unplugin';
import 'vite-node/client';

/**
 * A TypeScript helper function that defines a macro.
 *
 * @param fn - The function that represents the macro.
 * @returns A function that can be called with the macro arguments.
 */
declare function defineMacro<Args extends any[], Return>(fn: (this: MacroContext, ...args: Args) => Return): (...args: Args) => Return;

export { MacroContext, defineMacro };
