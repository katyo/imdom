/** @module patch */

import { DomTxnId, DomNameSpace, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn, DomElement, DomText, DomComment, DomDocType, DomDocTypeSpec, DomNode, DomFlags, DomFragment, DomKey } from './types';
import { is_defined, match_element, is_element, is_text, is_comment, match_doctype, parse_selector, create_element, create_text, create_comment, update_text, replace_node, prepend_node, append_node, remove_node, add_class, remove_class, set_style, remove_style, set_attr, remove_attr, add_event, NULL, NOOP, trace } from './utils';
import { Reconciler, use_nodes, reuse_node, push_node, reconcile } from './reuse';
import { DEBUG, BROWSER } from './decls';

let doc: Document = document;

/** Initialize library */
export function init(doc_: Document = document) {
    doc = doc_;
}

export interface State {
    // element
    $: DomElement | DomFragment,
    // reconciler
    r: Reconciler<DomNode>,
    // fragment capturing stack
    //f:
}

let stack: State[] = [];
let state: State;
let txnid: DomTxnId = 0;

function stack_push($: DomElement | DomFragment) {
    stack.push(state = {
        $, // place fragment or element at stack
        r: use_nodes($._),
    });
}

function is_attached(node: DomNode) {
    return node.f & DomFlags.Attached;
}

function detach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && is_attached(node)) { // and virtual element is attached
        trace('detach', node.$);
        /*for (const child of node._) {
            detach(child);
        }*/
        node.f &= ~DomFlags.Attached; // mark element as detached
    }
}

function attach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && !is_attached(node)) { // and virtual element is detached
        trace('attach', node.$);
        node.f |= DomFlags.Attached; // mark element as attached
        for (const child of node._) {
            attach(child);
        }
    }
}

function replace(node: DomNode, rep: DomNode, parent: Node) {
    detach(rep);
    replace_node(parent, node.$, rep.$); // replace DOM node
    attach(node);
}

function prepend(node: DomNode, ref: DomNode, parent: Node) {
    prepend_node(parent, node.$, ref.$); // prepend DOM node
    attach(node);
}

function append(node: DomNode, ref: DomNode | undefined, parent: Node) {
    append_node(parent, node.$, ref ? ref.$ : NULL); // append DOM node
    attach(node);
}

function remove(node: DomNode, parent: Node) {
    detach(node);
    remove_node(parent, node.$); // remove DOM node
}

function stack_pop() {
    state.$._ = reconcile(
        state.r,
        BROWSER ? replace : NOOP,
        BROWSER ? prepend : NOOP,
        BROWSER ? append : NOOP,
        BROWSER ? remove : NOOP,
        state.$.$
    ); // reconcile children

    stack.pop(); // pop state from stack

    if (!stack.length) {
        if (is_element(state.$ as DomNode)) {
            attach(state.$ as DomNode);
        } else {
            for (const child of (state.$ as DomFragment)._) {
                attach(child);
            }
        }
    }

    state = stack[stack.length - 1]; // update reference to current state

    /*if (stack.length) {
        state = stack[stack.length - 1]; // update reference to current state
    } else {
        attach(state.$ as DomNode);
        state = NULL as unknown as State;
    }*/
}

function create_text_elm(str: string): DomText {
    return {
        $: BROWSER ? create_text(doc, str) : NULL as unknown as Text,
        f: DomFlags.Text,
        t: str,
    };
}

function create_comment_elm(str: string): DomComment {
    return {
        $: BROWSER ? create_comment(doc, str) : NULL as unknown as Comment,
        f: DomFlags.Comment,
        t: str,
    };
}

function create_doctype_elm(dt: DomDocTypeSpec): DomDocType {
    if (BROWSER && DEBUG) {
        throw new Error("Cannot create document type nodes");
    }
    return {
        $: NULL as unknown as DocumentType,
        f: DomFlags.DocType,
        d: dt,
    };
}

function push_text<N extends DomNode, Ctx>(match: (node: DomNode, ctx: Ctx) => node is N, create: (ctx: Ctx) => N, update: (node: N, ctx: Ctx) => void, ctx: Ctx) {
    let elm = reuse_node(state.r, match, ctx, false) as N | void; // try to reuse next node using match function

    if (elm) {
        update(elm, ctx);
    } else { // when no node found
        push_node(state.r, elm = create(ctx)); // create new node and push it
    }
}

/** Open new child element */
export function tag(selector: string, key?: DomKey) {
    const sel = parse_selector(selector); // parse selector of opened element

    if (sel.t == 'svg') { // when tag is 'svg'
        sel.n = DomNameSpace.SVG; // set SVG namespace
    } else if (is_element(state.$ as DomNode) // when we have parent element
               && (state.$ as DomElement).x.t != 'foreignObject') { // which is not a foreign object
        sel.n = (state.$ as DomElement).x.n; // set namespace from parent
    }

    if (is_defined(key)) { // when key is provided
        sel.k = key; // set key in selector
    }

    // try to reuse existing child element using selector
    let elm = reuse_node(state.r, match_element, sel, true) as DomElement | void;

    if (!elm) { // when virtual element missing
        push_node(state.r, elm = { // create new virtual node
            f: DomFlags.Element,
            $: BROWSER ? create_element(doc, sel) : NULL as unknown as Element,
            x: sel,
            a: {},
            c: {},
            s: {},
            _: []
        });
    } else if (!is_attached(elm)) { // when element is exists but not attached
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

/** Close openned element or finalize patching */
export function end() {
    const elm = state.$ as DomElement; // get current element from state

    if (elm.f & DomFlags.Element) { // when current subject is element
        const node = elm.$ as HTMLElement; // get associated DOM element

        // remove outdated attributes
        for (const name in elm.a) {
            const attr = elm.a[name];
            if (attr.t < txnid) { // when attribute is not set in current transaction
                delete elm.a[name]; // remove attribute entry from virtual element
                if (BROWSER) {
                    remove_attr(node, name, attr.v); // remove attribute from DOM element
                }
            }
        }

        // remove outdated classes
        for (const name in elm.c) {
            if (elm.c[name] < txnid) { // when class is not added in current transaction
                delete elm.c[name]; // remove class entry from virtual element
                if (BROWSER) {
                    remove_class(node, name); // remove class from DOM element
                }
            }
        }

        // remove outdated styles
        for (const name in elm.s) {
            if (elm.s[name].t < txnid) { // when style is not set in current transaction
                delete elm.s[name]; // remove style entry from virtual element
                if (BROWSER) {
                    remove_style(node, name); // remove style from DOM element
                }
            }
        }
    }

    stack_pop(); // pop state from stack
}

/** Put text node */
export function text(str: string) {
    if (str) { // when string is not empty
        push_text(is_text, create_text_elm, BROWSER ? update_text : NOOP, str); // push text node
    }
}

/** Put comment node */
export function comment(str: string) {
    push_text(is_comment, create_comment_elm, BROWSER ? update_text : NOOP, str); // push comment node
}

/** Put document type node */
export function doctype(qualifiedName: string, publicId: string = '', systemId: string = '') {
    push_text(match_doctype, create_doctype_elm, NOOP, {n: qualifiedName, p: publicId, s: systemId}); // push document type node
}

/** Get current opened DOM element */
export function elem<T extends Element = Element>(): T {
    return state.$.$ as T;
}

/**
   Current opened element is brand new

   It means that element is been created or reused from parsed document.
*/
export function once(): boolean {
    return !is_attached(state.$ as DomNode);
}

/** Put immutable attribute */
export function iattr<A extends keyof DomAttrMap>(name: A, val?: DomAttrMap[A]) {
    const elm = state.$ as DomElement; // get current element from state

    if (elm.a[name]) { // when attribute is listed in mutable set
        delete elm.a[name]; // remove it from mutable set
    } else { // when attribute is missing
        if (BROWSER) {
            set_attr(elm.$, name, val); // set attribute of DOM element
        }
    }
}

/** Put mutable attribute */
export function attr<A extends keyof DomAttrMap>(name: A, val?: DomAttrMap[A]) {
    const elm = state.$ as DomElement; // get current element from state
    const ent = elm.a[name]; // get attribute entry from set of mutable attributes

    if (ent) { // when attribute already set
        if (ent.v != val) { // when value changed
            // update value and set attribute of DOM element
            if (BROWSER) {
                set_attr(elm.$, name, ent.v = val);
            }
        }
        // update txn id to prevent removing attribute from DOM element
        ent.t = txnid;
    } else { // when attribute is missing
        elm.a[name] = { v: val, t: txnid }; // create new attribute record
        if (BROWSER) {
            set_attr(elm.$, name, val); // set attribute of DOM element
        }
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
        if (BROWSER) {
            set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
        }
    }
}

/** Set mutable style */
export function style<S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) {
    const elm = state.$ as DomElement; // get current element from state
    const ent = elm.s[name]; // get style entry from set of mutable styles

    if (ent) { // when style already set
        if (ent.v != val) { // when value changed
            // update value and set style of DOM element
            if (BROWSER) {
                set_style(elm.$ as HTMLElement, name, ent.v = val);
            }
        }
        // update txn id to prevent removing style from DOM element
        ent.t = txnid;
    } else { // when style is missing
        elm.s[name] = { v: val, t: txnid }; // create new style entry
        if (BROWSER) {
            set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
        }
    }
}

/**
   Attach event listener to element

   Only immutable event listeners is supported.
*/
export function ievent<E extends keyof DomEventMap>(name: E, fn: DomEventFn<E>) {
    if (BROWSER) {
        const elm = state.$ as DomElement; // get current element from state
        add_event(elm.$, name, fn); // attach event listener to DOM element
    }
}

/**
   Start patching of fragment or element

   Call `end()` to stop patching.
*/
export function patch(fragment: DomFragment) {
    txnid ++;
    stack_push(fragment);
}

/**
 *  Start fragment capturing
 */
/*export function start() {

}*/

/**
 * Finalize fragment capturing and return fragment
 */
/*export function stop(): DomFragment {

}*/
