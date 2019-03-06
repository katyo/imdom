import { DomTxnId, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn, DomFragment, DomElement, DomNodes, DomNode } from './types';
import { match_element, match_text, match_comment, parse_selector, add_class, remove_class, set_style, remove_style, set_attr, remove_attr, add_event } from './utils';
import { Action, array_diff } from './diff';

/*export interface API {
    parse(node: Node, end?: Node): DomFragment;
    patch(target: DomFragment, render: () => void): void;
}*/

let doc: Document;

/** Initialize library */
export function init(doc_: Document = document) {
    doc = doc_;
}

export interface State {
    // element
    $: DomFragment | DomElement,
    // current index
    i: number;
    // new children
    _: DomNodes;
}

let stack: State[] = [];
let state: State;
let txnid: DomTxnId = 0;

function stack_push(new_state: State) {
    stack.push(state = new_state);
}

function stack_pop() {
    stack.pop();
    state = stack[stack.length - 1];
}

export function seek_node<N extends DomNode, Ctx>(state: State, match_func: (node: DomNode, ctx: Ctx) => node is N, ctx: Ctx): N | void {
    for (let i = state.i; ; ) {
        for (; state.i < state.$._.length; ) {
            const node = state.$._[state.i++];
            if (match_func(node, ctx)) {
                return node;
            }
        }
        if (i) {
            i = state.i = 0;
            continue;
        }
        return;
    }

    /*for (; state.i < state.e.C.length; ) {
        const node = state.e.C[state.i];
        if (match_func(node, ctx)) {
            state.i++;
            return node;
        } else {
            state.e.C.splice(state.i, 1);
            state.e.$.removeChild(node.$);
            state.C.push(node);
        }
    }

    for (let i = state.I; ; ) {
        for (; state.I < state.C.length; state.I++) {
            const node = state.C[state.I];
            if (match_func(node, ctx)) {
                state.C.splice(state.I, 1);
                state.e.C.push(node);
                state.e.$.appendChild(node.$);
                state.i ++;
                return node;
            }
        }
        if (i) {
            i = state.I = 0;
            continue;
        }
        return;
    }*/
}

/*
function reuse_classes() {
    // move extra classes to mutable
    if (!elm.c) {
        elm.c = {} as DomClasses;
        if (cls) {
            for (const name in elm.x.c) {
                if (!(name in cls)) {
                    elm.c[name] = true;
                    delete elm.x.c[name];
                }
            }
        }
    }
}
*/

/** Open new element */
export function open(tag: string, key?: string) {
    const sel = parse_selector(tag);
    if (key) sel.k = key;
    const node = seek_node(state, match_element, sel);
    stack_push(node ? {
        $: node,
        i: 0,
        _: [],
    } : {
        $: { $: doc.createElement(sel.t), x: sel, a: {}, c: {}, s: {}, _: [] },
        i: 0,
        _: [],
    });
}

/** Close openned element */
export function close() {
    const elm = state.$ as DomElement; // get current element from state
    const node = elm.$ as HTMLElement; // get associated DOM element

    // remove outdated attributes
    for (const name in elm.a) {
        if (elm.a[name].t < txnid) { // when attribute is not set in current transaction
            delete elm.a[name]; // remove attribute entry from virtual element
            remove_attr(node, name); // remove attribute from DOM element
        }
    }

    // remove outdated classes
    for (const name in elm.c) {
        if (elm.c[name] < txnid) { // when class is not added in current transaction
            delete elm.c[name]; // remove class entry from virtual element
            remove_class(node, name); // remove class from DOM element
        }
    }

    // remove outdated styles
    for (const name in elm.s) {
        if (elm.s[name].t < txnid) { // when style is not set in current transaction
            delete elm.s[name]; // remove style entry from virtual element
            remove_style(node, name); // remove style from DOM element
        }
    }

    // update children
    let child: Element = node.firstChild as Element;
    for (const change of array_diff(elm._, state._)) {
        switch (change.a) {
            case Action.None:
                child = child.nextSibling as Element;
                break;
            case Action.Removed:
                for (let j = 0; j < change.c; j++) {
                    const removed = child;
                    child = child.nextSibling as Element;
                    node.removeChild(removed);
                }
                break;
            case Action.Added:
                for (let j = 0; j < change.c; j++) {
                    const added = change.v[j].$;
                    child = child.nextSibling as Element;
                    if (child) {
                        node.insertBefore(added, child.nextSibling);
                    } else {
                        node.appendChild(added);
                    }
                }
                break;
        }
    }
    elm._ = state._;
    stack_pop();
}

/** Put text node */
export function text(text: string) {
    const node = seek_node(state, match_text, text);
    state._.push(node ? node : { $: doc.createTextNode(text), t: text });
}

/** Put comment node */
export function comment(text: string) {
    const node = seek_node(state, match_comment, text);
    state._.push(node ? node : { $: doc.createComment(text), c: text });
}

/** Get current openned element */
export function current(): DomFragment | DomElement {
    return state.$;
}

/** Current element is newly created element */
export function created(): boolean {
    return !(state.$ as DomElement).n;
}

/** Current element reused */
export function reused(): boolean {
    return !created();
}

/** Put immutable attribute */
export function iattr<A extends keyof DomAttrMap>(name: A, val: DomAttrMap[A]) {
    const elm = state.$ as DomElement; // get current element from state
    
    if (elm.a[name]) { // when attribute is listed in mutable set
        delete elm.a[name]; // remove it from mutable set
    } else { // when attribute is missing
        set_attr(elm.$, name, val); // set attribute of DOM element
    }
}

/** Put mutable attribute */
export function attr<A extends keyof DomAttrMap>(name: A, val: DomAttrMap[A]) {
    const elm = state.$ as DomElement; // get current element from state
    const ent = elm.a[name]; // get attribute entry from set of mutable attributes
    
    if (ent) { // when attribute already set
        if (ent.v != val) { // when value changed
            // update value and set attribute of DOM element
            set_attr(elm.$, name, ent.v = val);
        }
        // update txn id to prevent removing attribute from DOM element
        ent.t = txnid;
    } else { // when attribute is missing
        elm.a[name] = { v: val, t: txnid }; // create new attribute record
        set_attr(elm.$, name, val); // set attribute of DOM element
    }
}

/** Add mutable class name */
export function class_(name: string) {
    const elm = state.$ as DomElement; // get current element from state
    const cls = elm.c; // get mutable class set of element
    
    if (!cls[name]) { // when class is missing
        add_class(elm.$, name); // add class to DOM element classes
    }
    
    // update txn id to prevent removing class from DOM element
    cls[name] = txnid;
}

/** Set immutable style */
export function istyle<S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) {
    const elm = state.$ as DomElement; // get current element from state
    
    if (elm.s[name]) { // when style is listed in mutable set
        delete elm.s[name]; // remove it from mutable set
    } else { // when style is missing
        set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
    }
}

/** Set mutable style */
export function style<S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) {
    const elm = state.$ as DomElement; // get current element from state
    const ent = elm.s[name]; // get style entry from set of mutable styles
    
    if (ent) { // when style already set
        if (ent.v != val) { // when value changed
            // update value and set style of DOM element
            set_attr(elm.$, name, ent.v = val);
        }
        // update txn id to prevent removing style from DOM element
        ent.t = txnid;
    } else { // when style is missing
        elm.s[name] = { v: val, t: txnid }; // create new style entry
        set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
    }
}

/**
   Attach event listener to element
   
   Only immutable event listeners is supported.
*/
export function ievent<E extends keyof DomEventMap>(name: E, fn: DomEventFn<E>) {
    const elm = state.$ as DomElement; // get current element from state
    
    add_event(elm.$, name, fn); // attach event listener to DOM element
}

export function patch<Args extends any[]>(fragment: DomFragment, render: (...args: Args) => void, ...args: Args) {
    txnid ++;
    stack.push({
        $: fragment,
        i: 0,
        _: [],
    });
    render(...args);
    stack.pop();
}
