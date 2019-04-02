/*import { JSDOM } from 'jsdom';

const doctype = '<!DOCTYPE html>';
const { window: { Node } } = new JSDOM(doctype);
(global as any).Node = Node;
(global as any).requestAnimationFrame = (fn: () => void) => {
    return setTimeout(fn, 17);
};
*/

process.env.JS_TARGET = 'server';

//import "raf/polyfill";

import { patch, end, NOOP, prepare, format } from 'imdom';
import { Init, View, render } from './core';
import { store } from './store';

const now = typeof performance == 'undefined' ? () => Date.now() : () => performance.now();

export function runner<State, Args extends any[]>(init: Init<State, Args>, view: View<State, Args>): (...args: Args) => () => string {
    return (...args: Args) => {
        const state = store<State, void>(NOOP, undefined);
        const frag = prepare();

        init(state, ...args);

        return () => {
            const start = now();
            patch(frag);
            render(view, state, ...args);
            end();
            const stop = now();
            console.log('patch ', (stop - start).toPrecision(3), 'mS');
            return format(frag);
        };
    };
}
