import { ViteNodeRunner } from 'vite-node/client';
export { O as Options, a as OptionsResolved, r as resolveOptions } from './options-64bf4571.js';
import 'vite';
import '@rollup/pluginutils';

interface MacroContext {
    id: string;
}
declare function transformMacros(code: string, id: string, getRunner: () => Promise<ViteNodeRunner>, deps: Map<string, Set<string>>, attrs: Record<string, string>): Promise<{
    code: string;
    map: any;
} | undefined>;

export { MacroContext, transformMacros };
