/**
 * @module patch
 */

import { BROWSER, BENCH_PATCH, BENCH_REUSE, BENCH_DOMOP, STATS_INTERVAL } from './decls';
import { bench_init, bench_start, bench_stop, bench_stat, bench_show } from './bench';
import { DomTxnId, DomClassSet, DomNameSpace, DomAttrFn, DomStyleMap, DomEventMap, DomEventFn, DomElement, DomText, DomComment, DomDocType, DomDocTypeSpec, DomNode, DomFlags, DomFragment, DomKey, DomAttrName, DomAttrType } from './types';
import { Selector, is_defined, match_element, is_element, is_text, is_comment, match_doctype, NULL, NOOP, ns_uri_map, print } from './utils';
import { Reconciler, use_nodes, reuse_node, push_node, reconcile } from './reuse';
import { domop_stats } from './domop';
import * as dom from './domop';

interface State {
    // element
    $: DomElement | DomFragment,
    // reconciler
    r: Reconciler<DomNode>,
    // current key
    k: DomKey | undefined,
    // fragment capturing stack
    //f:
}

// patching stack
let stack: State[] = [];

// current state
let state: State;

// last transaction id
let txnid: DomTxnId = 0;

export interface TaskFn<Args extends any[]> {
    (...args: Args): void;
}

export interface Task<Args extends any[] = any[]> {
    f: TaskFn<Args>;
    a: Args;
}

// tasks to run after patching
const tasks: Task[] = [];

/** Schedule function to run after patch */
export function after<Args extends any[]>(fn: TaskFn<Args>, ...args: Args) {
    tasks.push({ f: fn, a: args } as Task<Args> as unknown as Task);
}

const patch_stats = BENCH_PATCH ? bench_init() : NULL;
const reuse1_stats = BENCH_REUSE ? bench_init() : NULL;
const reuse2_stats = BENCH_REUSE ? bench_init() : NULL;

function stack_push($: DomElement | DomFragment) {
    stack.push(state = {
        $, // place fragment or element at stack
        r: use_nodes($._),
        k: NULL,
    });
}

function is_attached(node: DomNode) {
    return node.f & DomFlags.Attached;
}

function detach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && is_attached(node)) { // and virtual element is attached
        //trace('detach', node.$);
        /*const children = node._;
        for (let i = 0; i < children.length; ) {
            detach(children[i++]);
        }*/
        node.f &= ~DomFlags.Attached; // mark element as detached
    }
}

function attach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && !is_attached(node)) { // and virtual element is detached
        //trace('attach', node.$);
        node.f |= DomFlags.Attached; // mark element as attached
        const children = node._;
        for (let i = 0; i < children.length; ) {
            attach(children[i++]);
        }
    }
}

const replace_node: (node: DomNode, rep: DomNode, parent: Node) => void =
    BROWSER ? (node, rep, parent) => {
        detach(rep);
        dom.replace_node(parent, node.$, rep.$); // replace DOM node
        attach(node);
    } : NOOP;

const prepend_node: (node: DomNode, ref: DomNode, parent: Node) => void =
    BROWSER ? (node, ref, parent) => {
        dom.prepend_node(parent, node.$, ref.$); // prepend DOM node
        attach(node);
    } : NOOP;

const append_node: (node: DomNode, ref: DomNode | undefined, parent: Node) => void =
    BROWSER ? (node, ref, parent) => {
        dom.append_node(parent, node.$, ref ? ref.$ : NULL); // append DOM node
        attach(node);
    } : NOOP;

const remove_node: (node: DomNode, parent: Node) => void =
    BROWSER ? (node, parent) => {
        detach(node);
        dom.remove_node(parent, node.$); // remove DOM node
    } : NOOP;

function stack_pop() {
    if (BENCH_REUSE) bench_start(reuse2_stats!);

    state.$._ = reconcile(
        state.r,
        replace_node,
        prepend_node,
        append_node,
        remove_node,
        state.$.$
    ); // reconcile children

    if (BENCH_REUSE) bench_stop(reuse2_stats!);

    stack.pop(); // pop state from stack

    if (!stack.length) {
        // attach detached elements
        if (is_element(state.$ as DomNode)) {
            attach(state.$ as DomNode);
        } else {
            const children = (state.$ as DomFragment)._;
            for (let i = 0; i < children.length; ) {
                attach(children[i++]);
            }
        }

        // run scheduled tasks
        for (let task; task = tasks.shift(); ) {
            task.f(...task.a);
        }

        if (BENCH_PATCH || BENCH_REUSE || (BROWSER && BENCH_DOMOP)) update_stats();
    }

    state = stack[stack.length - 1]; // update reference to current state
}

const create_text: (str: string) => DomText =
    BROWSER ? (str) => ({
        $: dom.create_text(str),
        f: DomFlags.Text,
        t: str,
    }) : (str) => ({
        $: NULL as unknown as Text,
        f: DomFlags.Text,
        t: str,
    });

const create_comment: (str: string) => DomComment =
    BROWSER ? (str) => ({
        $: dom.create_comment(str),
        f: DomFlags.Comment,
        t: str,
    }) : (str) => ({
        $: NULL as unknown as Comment,
        f: DomFlags.Comment,
        t: str,
    });

const create_doctype: (dt: DomDocTypeSpec) => DomDocType =
    BROWSER ? (dt) => ({
        $: dom.create_doctype(dt),
        f: DomFlags.DocType,
        d: dt,
    }) : (dt) => ({
        $: NULL as unknown as DocumentType,
        f: DomFlags.DocType,
        d: dt,
    });

const create_element: (sel: Selector) => DomElement =
    BROWSER ? (sel) => {
        const node = dom.create_element(sel.t, sel.n ? ns_uri_map[sel.n] : NULL); // create new DOM node
        let class_set: DomClassSet | undefined;

        if (is_defined(sel.i)) dom.set_attr(node, 'id', sel.i); // set id attribute when present

        if (sel.c) { // when classes is present
            class_set = {}; // initialize selector classes
            const class_list = sel.c;
            for (let i = 0; i < class_list.length; ) { // for classes
                const name = class_list[i++];
                class_set[name] = true; // set class in selector
                dom.add_class(node, name); // add class name
            }
        }

        if (is_defined(sel.k)) { // when key is present
            dom.set_attr(node, 'data-key', sel.k); // set key attribute when present
        }

        return { // create new virtual node
            $: node,
            f: DomFlags.Element,
            x: {
                t: sel.t,
                n: sel.n,
                i: sel.i,
                c: class_set,
                k: sel.k,
            },
            a: {},
            c: {},
            s: {},
            _: []
        };
    } : (sel) => {
        let class_set: DomClassSet | undefined;

        if (sel.c) { // when classes is present
            class_set = {}; // initialize selector classes
            const class_list = sel.c;
            for (let i = 0; i < class_list.length; ) { // for classes
                class_set[class_list[i++]] = true; // set class in selector
            }
        }

        return { // create new virtual node
            $: NULL as unknown as Element,
            f: DomFlags.Element,
            x: {
                t: sel.t,
                n: sel.n,
                i: sel.i,
                c: class_set,
                k: sel.k,
            },
            a: {},
            c: {},
            s: {},
            _: []
        };
    };

/** Update string content of text node */
const update_text: <T extends DomText | DomComment>(node: T, str: string) => void =
    BROWSER ? (node, str) => {
        if (node.t != str) {
            dom.set_text(node.$, node.t = str);
        }
    } : NOOP;

function push_text<N extends DomNode, Ctx>(match: (node: DomNode, ctx: Ctx) => node is N, create: (ctx: Ctx) => N, update: (node: N, ctx: Ctx) => void, ctx: Ctx) {
    if (BENCH_REUSE) bench_start(reuse1_stats!);

    let elm = reuse_node(state.r, match, ctx, false) as N | void; // try to reuse next node using match function

    if (BENCH_REUSE) bench_stop(reuse1_stats!);

    if (elm) {
        update(elm, ctx);
    } else { // when no node found
        push_node(state.r, elm = create(ctx)); // create new node and push it
    }
}

/** Set current key for children elements */
export function key(k?: DomKey | undefined) {
    state.k = k;
}

const slice = Array.prototype.slice;

/** Open new child element */
export function tag(name: string, id?: string, class1?: string, class2?: string, class3?: string, ...classes: string[]): void;
export function tag(name: string, id?: string, class1?: string, class2?: string, class3?: string) {
    const sel: Selector = { // create selector of opened element
        t: name, // set tag name
        n: name == 'svg' ? // when tag is 'svg'
            DomNameSpace.SVG : // set SVG namespace
            is_element(state.$ as DomNode) // when we have parent element
            && (state.$ as DomElement).x.t != 'foreignObject' ? // which is not a foreign object
            (state.$ as DomElement).x.n : // set namespace from parent
            DomNameSpace.XHTML, // set XHTML namespace by default
        i: id, // set element id
        c: !class1 ? NULL : // set element classes
            !class2 ? [class1] : // one class is present
            !class3 ? [class1, class2] : // two classes is present
            arguments.length < 6 ? [class1, class2, class3] : // three classes is present
            slice.call(arguments, 2), // several classes is present
        k: state.k, // set element key
    };

    if (BENCH_REUSE) bench_start(reuse1_stats!);

    // try to reuse existing child element using selector
    let elm = reuse_node(state.r, match_element, sel, true) as DomElement | void;

    if (BENCH_REUSE) bench_stop(reuse1_stats!);

    if (!elm) { // when virtual element missing
        push_node(state.r, elm = create_element(sel)); // create new virtual node
    } else if (!is_attached(elm) && sel.c) { // when element is exists but not attached
        const cls = elm.x.c; // get classes from element selector

        if (cls) { // when element has classes in selector
            const class_list = sel.c;
            for (let i = 0; i < class_list.length; ) { // iterate over classes in current selector
                cls[class_list[i++]] = false; // remove class from element selector
            }

            // move all classes which missing in selector to mutable class set
            for (const name in cls) { // iterate over classes in element selector
                if (!cls[name]) { // class not used in current selector
                    elm.c[name] = txnid; // add class to element mutable class set
                }
            }
        }
    }

    // push opened element at top of stack
    stack_push(elm);
}

/** Close openned element or finalize patching */
export const end: () => void =
    BROWSER ? () => {
        const elm = state.$ as DomElement; // get current element from state

        if (elm.f & DomFlags.Element) { // when current subject is element
            const node = elm.$ as HTMLElement; // get associated DOM element
            const { a: attrs, c: classes, s: styles } = elm;

            // remove outdated classes
            for (const name in classes) {
                if (classes[name] && classes[name]! < txnid) { // when class is not added in current transaction
                    classes[name] = NULL; // remove class entry from virtual element
                    dom.remove_class(node, name); // remove class from DOM element
                }
            }

            // remove outdated attributes
            for (const name in attrs) {
                const attr = attrs[name];
                if (attr && attr.t < txnid) { // when attribute is not set in current transaction
                    attrs[name] = NULL; // remove attribute entry from virtual element
                    dom.remove_attr(node, name, attr.v); // remove attribute from DOM element
                }
            }

            // remove outdated styles
            for (const name in styles) {
                if (styles[name] && styles[name]!.t < txnid) { // when style is not set in current transaction
                    styles[name] = NULL; // remove style entry from virtual element
                    dom.remove_style(node, name); // remove style from DOM element
                }
            }
        }

        stack_pop(); // pop state from stack
    } : () => {
        const elm = state.$ as DomElement; // get current element from state

        if (elm.f & DomFlags.Element) { // when current subject is element
            const { a: attrs, c: classes, s: styles } = elm;

            // remove outdated classes
            for (const name in classes) {
                if (classes[name] && classes[name]! < txnid) { // when class is not added in current transaction
                    classes[name] = NULL; // remove class entry from virtual element
                }
            }

                // remove outdated attributes
            for (const name in attrs) {
                const attr = attrs[name];
                if (attr && attr.t != 0 && attr.t < txnid) { // when attribute is not set in current transaction
                    attrs[name] = NULL; // remove attribute entry from virtual element
                }
            }

            // remove outdated styles
            for (const name in styles) {
                const style = styles[name];
                if (style && style.t != 0 && style.t < txnid) { // when style is not set in current transaction
                    styles[name] = NULL; // remove style entry from virtual element
                }
            }
        }

        stack_pop(); // pop state from stack
    };

/** Put text node */
export function text(str: string) {
    if (str) { // when string is not empty
        push_text(is_text, create_text, update_text, str); // push text node
    }
}

/** Put comment node */
export function comment(str: string) {
    push_text(is_comment, create_comment, update_text, str); // push comment node
}

/** Put document type node */
export function doctype(qualifiedName: string, publicId: string = '', systemId: string = '') {
    push_text(match_doctype, create_doctype, NOOP, {n: qualifiedName, p: publicId, s: systemId}); // push document type node
}

/** Get current opened virtual DOM element */
export function current(): DomElement {
    return state.$ as DomElement;
}

/** Get current opened real DOM element */
export function element<T extends Element = Element>(): T {
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
export const iattr: DomAttrFn =
    BROWSER ? <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$ as DomElement; // get current element from state

        if (elm.a[name]) { // when attribute is listed in mutable set
            elm.a[name] = NULL; // remove it from mutable set
        } else { // when attribute is missing
            dom.set_attr(elm.$, name, val as DomAttrType<A>); // set attribute of DOM element
        }
    } : <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$ as DomElement; // get current element from state

        if (!elm.a[name]) { // when attribute is missing
            elm.a[name] = { v: val, t: 0 }; // add it into attributes set
        }
    };

/** Put mutable attribute */
export const attr: DomAttrFn =
    BROWSER ? <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$ as DomElement; // get current element from state
        const ent = elm.a[name]; // get attribute entry from set of mutable attributes

        if (ent) { // when attribute already set
            if (ent.v != val) { // when value changed
                // update value and set attribute of DOM element
                dom.set_attr(elm.$, name, ent.v = val as DomAttrType<A>);
            }
            // update txn id to prevent removing attribute from DOM element
            ent.t = txnid;
        } else { // when attribute is missing
            elm.a[name] = { v: val, t: txnid }; // create new attribute record
            dom.set_attr(elm.$, name, val as DomAttrType<A>); // set attribute of DOM element
        }
    } : <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$ as DomElement; // get current element from state
        const ent = elm.a[name]; // get attribute entry from set of mutable attributes

        if (ent) { // when attribute already set
            if (ent.v != val) { // when value changed
                // update value and set attribute of DOM element
                ent.v = val;
            }
            // update txn id to prevent removing attribute from DOM element
            ent.t = txnid;
        } else { // when attribute is missing
            elm.a[name] = { v: val, t: txnid }; // create new attribute record
        }
    };

/** Add mutable class name */
export const class_: (name: string) => void =
    BROWSER ? (name) => {
        const elm = state.$ as DomElement; // get current element from state
        const cls = elm.c; // get mutable class set of element

        if (!cls[name]) { // when class is missing
            dom.add_class(elm.$, name); // add class to DOM element classes
        }

        // update txn id to prevent removing class from DOM element
        cls[name] = txnid;
    } : (name) => {
        // update txn id to prevent removing class from DOM element
        (state.$ as DomElement).c[name] = txnid;
    };

/** Set immutable style */
export const istyle: <S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) => void =
    BROWSER ? (name, val) => {
        const elm = state.$ as DomElement; // get current element from state

        if (elm.s[name]) { // when style property is listed in mutable set
            elm.s[name] = NULL; // remove it from mutable set
        } else { // when style is missing
            dom.set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
        }
    } : (name, val) => {
        const elm = state.$ as DomElement; // get current element from state

        if (!elm.s[name]) { // when style property is missing
            elm.s[name] = { v: val, t: 0 }; // add it into style properties set
        }
    };

/** Set mutable style */
export const style: <S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) => void =
    BROWSER ? (name, val) => {
        const elm = state.$ as DomElement; // get current element from state
        const ent = elm.s[name]; // get style entry from set of mutable styles

        if (ent) { // when style already set
            if (ent.v != val) { // when value changed
                // update value and set style of DOM element
                dom.set_style(elm.$ as HTMLElement, name, ent.v = val);
            }
            // update txn id to prevent removing style from DOM element
            ent.t = txnid;
        } else { // when style is missing
            elm.s[name] = { v: val, t: txnid }; // create new style entry
            dom.set_style(elm.$ as HTMLElement, name, val); // set style of DOM element
        }
    } : (name, val) => {
        const elm = state.$ as DomElement; // get current element from state
        const ent = elm.s[name]; // get style entry from set of mutable styles

        if (ent) { // when style already set
            if (ent.v != val) { // when value changed
                // update value and set style of DOM element
                ent.v = val;
            }
            // update txn id to prevent removing style from DOM element
            ent.t = txnid;
        } else { // when style is missing
            elm.s[name] = { v: val, t: txnid }; // create new style entry
        }
    };

/**
   Attach event listener to element

   Only immutable event listeners is supported.
*/
export const ievent: <E extends keyof DomEventMap>(name: E, fn: DomEventFn<E>) => void =
    BROWSER ? (name, fn) => {
        dom.add_event((state.$ as DomElement).$, name, fn); // attach event listener to DOM element
    } : NOOP;

/**
   Start patching of fragment or element

   Call `end()` to stop patching.
*/
export function patch(fragment: DomFragment) {
    if (BENCH_PATCH) bench_start(patch_stats!);

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

let stats_timer: any;

function update_stats() {
    if (BENCH_PATCH) {
        bench_stop(patch_stats!);
        bench_stat(patch_stats!);
    }

    if (BENCH_REUSE) {
        bench_stat(reuse1_stats!);
        bench_stat(reuse2_stats!);
    }

    if (BROWSER && BENCH_DOMOP) {
        bench_stat(domop_stats!);
    }

    if (!stats_timer) {
        stats_timer = setTimeout(print_stats, STATS_INTERVAL);
    }
}

function print_stats() {
    stats_timer = NULL;

    if (BENCH_PATCH) {
        print('patch', bench_show(patch_stats!));
    }

    if (BENCH_REUSE) {
        print('reuse1', bench_show(reuse1_stats!));
        print('reuse2', bench_show(reuse2_stats!));
    }

    if (BROWSER && BENCH_DOMOP) {
        print('domop', bench_show(domop_stats!));
    }
}
