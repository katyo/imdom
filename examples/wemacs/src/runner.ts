import { _, parse, patch, end } from 'imdom';
import { Init, View, render } from './core';
import { store } from './store';

export function runner<State, Args extends any[]>(init: Init<State, Args>, view: View<State, Args>): (elm: Element | Document, ...args: Args) => void {
    return (elm: Element, ...args: Args) => {
        const state = store<State, void>(refresh, undefined);
        const frag = parse(elm);
        let frame: any = _;

        init(state, ...args);
        refresh();

        function refresh() {
            if (!frame) {
                frame = requestAnimationFrame(redraw);
            }
        }

        function redraw() {
            frame = _;
            patch(frag);
            render(view, state, ...args);
            end();
        }
    };
}
