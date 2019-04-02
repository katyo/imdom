import { parse, patch, end } from 'imdom';
import { Init, View, render } from './core';
import { store } from './store';

const now = typeof performance == 'undefined' ? () => Date.now() : () => performance.now();

export function runner<State, Args extends any[]>(init: Init<State, Args>, view: View<State, Args>): (elm: Element | Document, ...args: Args) => void {
    return (elm: Element, ...args: Args) => {
        const state = store<State, void>(refresh, undefined);
        const frag = parse(elm);
        let frame: any = null;

        console.log(frag);

        init(state, ...args);

        refresh();

        function refresh() {
            if (!frame) {
                console.log('schedule');
                frame = requestAnimationFrame(redraw);
            }
        }

        function redraw() {
            frame = null;
            const start = now();
            patch(frag);
            render(view, state, ...args);
            end();
            const stop = now();
            console.log('patch ', (stop - start).toPrecision(3), 'mS');
        }
    };
}
