import { patch, end, NOOP, prepare, format } from '@imdom/core';
import { Init, View, render } from './core';
import { store } from './store';

export function runner<State, Args extends any[]>(init: Init<State, Args>, view: View<State, Args>): (...args: Args) => () => string {
    return (...args: Args) => {
        const state = store<State, void>(NOOP, undefined);
        const frag = prepare();

        init(state, ...args);

        return () => {
            patch(frag);
            render(view, state, ...args);
            end();
            return format(frag);
        };
    };
}
