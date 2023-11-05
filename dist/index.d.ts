import * as unplugin from 'unplugin';
import { O as Options } from './options-64bf4571.js';
import { MacroContext } from './api.js';
import 'vite';
import '@rollup/pluginutils';
import 'vite-node/client';

declare const _default: unplugin.UnpluginInstance<Options | undefined, false>;

declare function defineMacro<Args extends any[], Return>(fn: (this: MacroContext, ...args: Args) => Return): (...args: Args) => Return;

export { MacroContext, Options, _default as default, defineMacro };
