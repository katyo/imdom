/** @module patch */

import { DomTxnId, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn, DomElement, DomNodes, DomNode, DomFlags, DomBase } from './types';
import { match_element, match_text, match_comment, is_element, is_text, is_comment, parse_selector, create_element, create_text, create_comment, update_text, insert_node, remove_node, add_class, remove_class, set_style, remove_style, set_attr, remove_attr, add_event } from './utils';
import { Action, array_diff } from './diff';

let doc: Document;

/** Initialize library */
export function init(doc_: Document = document) {
    doc = doc_;
}

export interface State {
    // element
    $: DomElement,
    // current index
    i: number;
    // old children
    _: DomNodes;
    // old children usage
    u: DomNodes;
}

let stack: State[] = [];
let state: State;
let txnid: DomTxnId = 0;

function stack_push(elm: DomElement) {
    stack.push(state = {
        $: elm, // place fragment or element at stack
        i: 0, // set initial children pointer to 0
        _: elm._, // place current children at state
        u: elm._.slice(0),
    });
    elm._ = []; // reset virtual element or fragment children
}

function stack_pop() {
    const elm = state.$; // get current element from state
    const node = elm.$ as HTMLElement; // get associated DOM element

    if (elm.$ // when current element is parent
        && (state._.length // and has new children
            || elm._.length)) { // and has old children
        let i = 0; // try get index of first child node from fragment offset
        const changes = array_diff(state._, elm._); // compare children to get changes
        //console.log(changes);
        for (const change of changes) { // apply all changes to DOM children
            switch (change.a) {
                case Action.None: // when no changes
                    i += change.c; // skip elements
                    break;
                case Action.Removed: // when nodes should been removed
                    for (let j = 0; j < change.c; j++) {
                        const removed = change.v[j]; // get virtual node to remove
                        if (is_element(removed)) { // when virtual node is element
                            if (removed.f & DomFlags.Attached) { // when virtual element is attached
                                removed.f &= ~DomFlags.Attached; // mark virtual element as detached
                            }
                        }
                        remove_node(node, removed.$); // remove DOM node from parent
                    }
                    break;
                case Action.Added: // when nodes should been added
                    for (let j = 0; j < change.c; j++, i++) {
                        const added = change.v[j]; // get virtual node to add
                        insert_node(node, added.$, i); // insert DOM node to parent
                        if (is_element(added)) { // when virtual node is element
                            if (!(added.f & DomFlags.Attached)) { // when virtual element is detached
                                added.f |= DomFlags.Attached; // mark element as attached
                            }
                        }
                    }
                    break;
            }
        }
    }
    
    stack.pop(); // pop state from stack
    state = stack[stack.length - 1]; // update reference to current state

    if (state) { // when stack is not empty
        state.$._.push(elm as DomNode); // append virtual element to children of vitrual parent
    }
}

function seek_same_node<N extends DomNode, Ctx>(state: State, match: (node: DomNode, ctx: Ctx) => node is N, ctx: Ctx): N | void {
    let {i, u} = state;
    for (; u.length; ) {
        for (; i < u.length; i++) {
            const node = u[i];
            if (match(node, ctx)) {
                u.splice(i, 1);
                if (i >= u.length) state.i = 0;
                return node;
            }
        }
        if (state.i) {
            i = 0;
            continue;
        }
        return;
    }
}

function seek_akin_node<N extends DomNode, Ctx>(state: State, match: (node: DomNode, ctx: Ctx) => node is N, is: (node: DomNode, ctx: Ctx) => node is N, update: (node: N, ctx: Ctx) => void, ctx: Ctx): N | void {
    let node = seek_same_node(state, match, ctx);
    const {i, u} = state;
    if (u.length && is(u[i], ctx)) {
        update(node = u[i] as N, ctx);
        u.splice(i, 1);
        if (i >= u.length) state.i = 0;
    }
    return node;
}

/** Open new element */
export function open(tag: string, key?: string) {
    const sel = parse_selector(tag); // parse selector of opened element
    
    if (key) { // when key is provided
        sel.k = key; // set key in selector
    }
    
    let elm = seek_same_node(state, match_element, sel); // find virtual element usign selector

    if (!elm) { // when virtual element missing
        // create new detached virtual element
        elm = {
            f: DomFlags.Element,
            $: create_element(doc, sel),
            x: sel,
            a: {},
            c: {},
            s: {},
            _: []
        };
    } else if (!(elm.f && DomFlags.Attached)) { // when element is exists but not attached
        const cls = elm.x.c; // get classes from element selector
        
        if (cls) { // when element has classes in selector
            // move all classes which missing in selector to mutable class set
            for (const name in cls) {
                if (!sel.c || !(name in sel.c)) { // class not used in selector
                    delete cls[name]; // remove class from element selector
                    elm.c[name] = txnid; // add class to element mutable class set
                }
            }
        }
    }
    
    // push opened element at top of stack
    stack_push(elm);
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
    
    stack_pop(); // pop state from stack
}

/** Put text node */
export function text(str: string) {
    if (str) { // when string is not empty
        const node = seek_akin_node(state, match_text, is_text, update_text, str); // try to find same text node
        state.$._.push(node ? node : { f: DomFlags.Text, $: create_text(doc, str), t: str });
    }
}

/** Put comment node */
export function comment(str: string) {
    const node = seek_akin_node(state, match_comment, is_comment, update_text, str);
    state.$._.push(node ? node : { f: DomFlags.Comment, $: create_comment(doc, str), t: str });
}

/** Get current opened element */
export function current(): DomElement {
    return state.$;
}

/** Current opened element isn't attached */
export function detached(): boolean {
    return !((state.$ as DomBase<Node>).f && DomFlags.Attached);
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

/** Start patching of fragment */
export function begin(elm: DomElement) {
    txnid ++;
    stack_push(elm);
}

/** Finish patching of fragment */
export function end() {
    stack_pop();
}

/*export function patch<Args extends any[]>(fragment: DomFragment, render: (...args: Args) => void, ...args: Args) {
    begin(fragment);
    render(...args);
    end();
}*/
