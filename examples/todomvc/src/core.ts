import { Store } from './store';

export const nokey: undefined = undefined;

export interface Init<State, Args extends any[]> {
    (store: Store<State>, ...args: Args): void;
}

export interface View<State, Args extends any[]> {
    (store: Store<State>, ...args: Args): void;
}

export interface ViewData<State, Args extends any[]> {
    state: State,
    args: Args,
    nodes: number,
}

export function render<State, Args extends any[]>(view: View<State, Args>, store: Store<State>, ...args: Args) {
    view(store, ...args);
    /*
    const state = get(store);
    const ptr = currentPointer();
    //console.log("render: ", state, ptr);
    if (ptr) {
        const data = (ptr as any)._viewdata as ViewData<State, Args>;
        if (data && data.state === state && data.args.length === args.length && data.args.every((arg, i) => arg === args[i])) {
            for (let i = 0; i < data.nodes; i++) skipNode();
            console.log('fast forward');
            return;
        }
    } else {
        console.log('no ptr');
    }
    console.log('full render');
    view(store, ...args);
    if (ptr) {
        console.log('store data');
        let nodes = 1;
        for (let node = ptr; node = node.nextSibling as Node; nodes++);
        (ptr as any)._viewdata = <ViewData<State, Args>>{
            state,
            args,
            nodes,
        };
    }
    */
}
