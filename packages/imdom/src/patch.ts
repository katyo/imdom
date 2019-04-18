/**
 * @module patch
 */

import { BROWSER, DEBUG, BENCH_PATCH, BENCH_REUSE, BENCH_DOMOP, STATS_INTERVAL } from './decls';
import { bench_init, bench_start, bench_stop, bench_stat, bench_show } from './bench';
import { DomTxnId, DomClassSet, DomNameSpace, DomAttrFn, DomStyleMap, DomEventMap, DomEventFn, DomElement, DomText, DomComment, DomDocType, DomDocTypeSpec, DomNode, DomFlags, DomFragment, DomKey, DomAttrName, DomAttrType } from './types';
import { Selector, is_defined, match_element, is_element, is_text, is_comment, match_doctype, match_node, NULL, NOOP, ns_uri_map, print, assert } from './utils';
import { Reconciler, use_nodes, reuse_node, push_node, reconcile } from './reuse';
import { domop_stats } from './domop';
import * as dom from './domop';

interface State {
    // element
    $node: DomElement | DomFragment,
    // reconciler
    $reconciler: Reconciler<DomNode>,
    // current key
    $key: DomKey | undefined,
    // current fragment(s)
    $fragment: DomFragment[] | undefined,
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
    $func: TaskFn<Args>;
    $args: Args;
}

// tasks to run after patching
const tasks: Task[] = [];

/** Schedule function to run after patch */
export function after<Args extends any[]>(fn: TaskFn<Args>, ...args: Args) {
    tasks.push({ $func: fn, $args: args } as Task<Args> as unknown as Task);
}

const patch_stats = BENCH_PATCH ? bench_init() : NULL;
const reuse1_stats = BENCH_REUSE ? bench_init() : NULL;
const reuse2_stats = BENCH_REUSE ? bench_init() : NULL;

function stack_push($node: DomElement | DomFragment) {
    stack.push(state = {
        $node, // place fragment or element at stack
        $reconciler: use_nodes($node.$nodes),
        $key: NULL,
        $fragment: NULL,
    });
}

function is_attached(node: DomNode) {
    return node.$flags & DomFlags.Attached;
}

function detach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && is_attached(node)) { // and virtual element is attached
        //trace('detach', node.$);
        /*const children = node._;
        for (let i = 0; i < children.length; ) {
            detach(children[i++]);
        }*/
        node.$flags &= ~DomFlags.Attached; // mark element as detached
    }
}

function attach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && !is_attached(node)) { // and virtual element is detached
        //trace('attach', node.$);
        node.$flags |= DomFlags.Attached; // mark element as attached
        const children = node.$nodes;
        for (let i = 0; i < children.length; ) {
            attach(children[i++]);
        }
    }
}

const replace_node: (node: DomNode, rep: DomNode, parent: Node) => void =
    BROWSER ? (node, rep, parent) => {
        detach(rep);
        dom.replace_node(parent, node.$node, rep.$node); // replace DOM node
        attach(node);
    } : NOOP;

const prepend_node: (node: DomNode, ref: DomNode, parent: Node) => void =
    BROWSER ? (node, ref, parent) => {
        dom.prepend_node(parent, node.$node, ref.$node); // prepend DOM node
        attach(node);
    } : NOOP;

const append_node: (node: DomNode, ref: DomNode | undefined, parent: Node) => void =
    BROWSER ? (node, ref, parent) => {
        dom.append_node(parent, node.$node, ref ? ref.$node : NULL); // append DOM node
        attach(node);
    } : NOOP;

const remove_node: (node: DomNode, parent: Node) => void =
    BROWSER ? (node, parent) => {
        detach(node);
        dom.remove_node(parent, node.$node); // remove DOM node
    } : NOOP;

function stack_pop() {
    if (BENCH_REUSE) bench_start(reuse2_stats!);

    state.$node.$nodes = reconcile(
        state.$reconciler,
        replace_node,
        prepend_node,
        append_node,
        remove_node,
        state.$node.$node
    ); // reconcile children

    if (BENCH_REUSE) bench_stop(reuse2_stats!);

    stack.pop(); // pop state from stack

    if (!stack.length) {
        // attach detached elements
        if (is_element(state.$node as DomNode)) {
            attach(state.$node as DomNode);
        } else {
            const children = (state.$node as DomFragment).$nodes;
            for (let i = 0; i < children.length; ) {
                attach(children[i++]);
            }
        }

        // run scheduled tasks
        for (let task; task = tasks.shift(); ) {
            task.$func(...task.$args);
        }

        if (BENCH_PATCH || BENCH_REUSE || (BROWSER && BENCH_DOMOP)) update_stats();
    }

    state = stack[stack.length - 1]; // update reference to current state
}

const create_text: (str: string) => DomText =
    BROWSER ? (str) => ({
        $node: dom.create_text(str),
        $flags: DomFlags.Text,
        $text: str,
    }) : (str) => ({
        $node: NULL as unknown as Text,
        $flags: DomFlags.Text,
        $text: str,
    });

const create_comment: (str: string) => DomComment =
    BROWSER ? (str) => ({
        $node: dom.create_comment(str),
        $flags: DomFlags.Comment,
        $text: str,
    }) : (str) => ({
        $node: NULL as unknown as Comment,
        $flags: DomFlags.Comment,
        $text: str,
    });

const create_doctype: (dt: DomDocTypeSpec) => DomDocType =
    BROWSER ? (dt) => ({
        $node: dom.create_doctype(dt),
        $flags: DomFlags.DocType,
        $spec: dt,
    }) : (dt) => ({
        $node: NULL as unknown as DocumentType,
        $flags: DomFlags.DocType,
        $spec: dt,
    });

const create_element: (sel: Selector) => DomElement =
    BROWSER ? (sel) => {
        const node = dom.create_element(sel.$tag, sel.$ns ? ns_uri_map[sel.$ns] : NULL); // create new DOM node
        let class_set: DomClassSet | undefined;

        if (is_defined(sel.$id)) {
            dom.set_attr(node, 'id', sel.$id); // set id attribute when present
        }

        const {$class} = sel;
        if ($class) { // when classes is present
            class_set = {}; // initialize selector classes
            for (let i = 0; i < $class.length; ) { // for classes
                const name = $class[i++];
                class_set[name] = true; // set class in selector
                dom.add_class(node, name); // add class name
            }
        }

        if (is_defined(sel.$key)) { // when key is present
            dom.set_attr(node, 'data-key', sel.$key); // set key attribute when present
        }

        return { // create new virtual node
            $node: node,
            $flags: DomFlags.Element,
            $tag: sel.$tag,
            $ns: sel.$ns,
            $id: sel.$id,
            $class: class_set,
            $key: sel.$key,
            $attrs: {},
            $classes: {},
            $style: {},
            $nodes: []
        };
    } : (sel) => {
        let class_set: DomClassSet | undefined;

        const {$class} = sel;
        if ($class) { // when classes is present
            class_set = {}; // initialize selector classes
            for (let i = 0; i < $class.length; ) { // for classes
                class_set[$class[i++]] = true; // set class in selector
            }
        }

        return { // create new virtual node
            $node: NULL as unknown as Element,
            $flags: DomFlags.Element,
            $tag: sel.$tag,
            $ns: sel.$ns,
            $id: sel.$id,
            $class: class_set,
            $key: sel.$key,
            $attrs: {},
            $classes: {},
            $style: {},
            $nodes: []
        };
    };

/** Update string content of text node */
const update_text: <T extends DomText | DomComment>(node: T, str: string) => void =
    BROWSER ? (node, str) => {
        if (node.$text != str) {
            dom.set_text(node.$node, node.$text = str);
        }
    } : NOOP;

function push_text<N extends DomNode, Ctx>(match: (node: DomNode, ctx: Ctx) => node is N, create: (ctx: Ctx) => N, update: (node: N, ctx: Ctx) => void, ctx: Ctx) {
    if (BENCH_REUSE) bench_start(reuse1_stats!);

    let elm = reuse_node(state.$reconciler, match, ctx, false) as N | void; // try to reuse next node using match function

    if (BENCH_REUSE) bench_stop(reuse1_stats!);

    if (elm) {
        update(elm, ctx);
    } else { // when no node found
        push_node(state.$reconciler, elm = create(ctx)); // create new node and push it
    }

    // push node to current fragments
    capture_node(elm);
}

/** Set current key for children elements */
export function key(k?: DomKey | undefined) {
    state.$key = k;
}

const slice = Array.prototype.slice;

/** Open new child element */
export function tag(name: string, id?: string, class1?: string, class2?: string, class3?: string, ...classes: string[]): void;
export function tag(name: string, id?: string, class1?: string, class2?: string, class3?: string) {
    const sel: Selector = { // create selector of opened element
        $tag: name, // set tag name
        $ns: name == 'svg' ? // when tag is 'svg'
            DomNameSpace.SVG : // set SVG namespace
            is_element(state.$node as DomNode) // when we have parent element
            && (state.$node as DomElement).$tag != 'foreignObject' ? // which is not a foreign object
            (state.$node as DomElement).$ns : // set namespace from parent
            DomNameSpace.XHTML, // set XHTML namespace by default
        $id: id, // set element id
        $class: !class1 ? NULL : // set element classes
            !class2 ? [class1] : // one class is present
            !class3 ? [class1, class2] : // two classes is present
            arguments.length < 6 ? [class1, class2, class3] : // three classes is present
            slice.call(arguments, 2), // several classes is present
        $key: state.$key, // set element key
    };

    if (BENCH_REUSE) bench_start(reuse1_stats!);

    // try to reuse existing child element using selector
    let elm = reuse_node(state.$reconciler, match_element, sel, true) as DomElement | void;

    if (BENCH_REUSE) bench_stop(reuse1_stats!);

    if (!elm) { // when virtual element missing
        push_node(state.$reconciler, elm = create_element(sel)); // create new virtual node
    } else if (!is_attached(elm) && sel.$class) { // when element is exists but not attached
        const cls = elm.$class; // get classes from element selector

        if (cls) { // when element has classes in selector
            const {$class} = sel;
            for (let i = 0; i < $class.length; ) { // iterate over classes in current selector
                cls[$class[i++]] = false; // remove class from element selector
            }

            // move all classes which missing in selector to mutable class set
            for (const name in cls) { // iterate over classes in element selector
                if (!cls[name]) { // class not used in current selector
                    elm.$classes[name] = txnid; // add class to element mutable class set
                }
            }
        }
    }

    // push element to current fragments
    capture_node(elm);

    // push opened element at top of stack
    stack_push(elm);
}

/** Close openned element or finalize patching */
export const end: () => void =
    BROWSER ? () => {
        const elm = state.$node as DomElement; // get current element from state

        if (elm.$flags & DomFlags.Element) { // when current subject is element
            const node = elm.$node as HTMLElement; // get associated DOM element
            const { $attrs, $classes, $style } = elm;

            // remove outdated classes
            for (const name in $classes) {
                if ($classes[name] && $classes[name]! < txnid) { // when class is not added in current transaction
                    $classes[name] = NULL; // remove class entry from virtual element
                    dom.remove_class(node, name); // remove class from DOM element
                }
            }

            // remove outdated attributes
            for (const name in $attrs) {
                const attr = $attrs[name];
                if (attr && attr.$txnid < txnid) { // when attribute is not set in current transaction
                    $attrs[name] = NULL; // remove attribute entry from virtual element
                    dom.remove_attr(node, name, attr.$value); // remove attribute from DOM element
                }
            }

            // remove outdated styles
            for (const name in $style) {
                if ($style[name] && $style[name]!.$txnid < txnid) { // when style is not set in current transaction
                    $style[name] = NULL; // remove style entry from virtual element
                    dom.remove_style(node, name); // remove style from DOM element
                }
            }
        }

        stack_pop(); // pop state from stack
    } : () => {
        const elm = state.$node as DomElement; // get current element from state

        if (elm.$flags & DomFlags.Element) { // when current subject is element
            const { $attrs, $classes, $style } = elm;

            // remove outdated classes
            for (const name in $classes) {
                if ($classes[name] && $classes[name]! < txnid) { // when class is not added in current transaction
                    $classes[name] = NULL; // remove class entry from virtual element
                }
            }

                // remove outdated attributes
            for (const name in $attrs) {
                const attr = $attrs[name];
                if (attr && attr.$txnid != 0 && attr.$txnid < txnid) { // when attribute is not set in current transaction
                    $attrs[name] = NULL; // remove attribute entry from virtual element
                }
            }

            // remove outdated styles
            for (const name in $style) {
                const style = $style[name];
                if (style && style.$txnid != 0 && style.$txnid < txnid) { // when style is not set in current transaction
                    $style[name] = NULL; // remove style entry from virtual element
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
    push_text(match_doctype, create_doctype, NOOP, {$name: qualifiedName, $pub_id: publicId, $sys_id: systemId}); // push document type node
}

/** Get current opened virtual DOM element */
export function current(): DomElement {
    return state.$node as DomElement;
}

/** Get current opened real DOM element */
export function element<T extends Element = Element>(): T {
    return state.$node.$node as T;
}

/**
   Current opened element is brand new

   It means that element is been created or reused from parsed document.
*/
export function once(): boolean {
    return !is_attached(state.$node as DomNode);
}

/** Put immutable attribute */
export const iattr: DomAttrFn =
    BROWSER ? <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$node as DomElement; // get current element from state

        if (elm.$attrs[name]) { // when attribute is listed in mutable set
            elm.$attrs[name] = NULL; // remove it from mutable set
        } else { // when attribute is missing
            dom.set_attr(elm.$node, name, val as DomAttrType<A>); // set attribute of DOM element
        }
    } : <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$node as DomElement; // get current element from state

        if (!elm.$attrs[name]) { // when attribute is missing
            elm.$attrs[name] = { $value: val, $txnid: 0 }; // add it into attributes set
        }
    };

/** Put mutable attribute */
export const attr: DomAttrFn =
    BROWSER ? <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$node as DomElement; // get current element from state
        const ent = elm.$attrs[name]; // get attribute entry from set of mutable attributes

        if (ent) { // when attribute already set
            if (ent.$value != val) { // when value changed
                // update value and set attribute of DOM element
                dom.set_attr(elm.$node, name, ent.$value = val as DomAttrType<A>);
            }
            // update txn id to prevent removing attribute from DOM element
            ent.$txnid = txnid;
        } else { // when attribute is missing
            elm.$attrs[name] = { $value: val, $txnid: txnid }; // create new attribute record
            dom.set_attr(elm.$node, name, val as DomAttrType<A>); // set attribute of DOM element
        }
    } : <A extends DomAttrName>(name: A, val?: DomAttrType<A>) => {
        const elm = state.$node as DomElement; // get current element from state
        const ent = elm.$attrs[name]; // get attribute entry from set of mutable attributes

        if (ent) { // when attribute already set
            if (ent.$value != val) { // when value changed
                // update value and set attribute of DOM element
                ent.$value = val;
            }
            // update txn id to prevent removing attribute from DOM element
            ent.$txnid = txnid;
        } else { // when attribute is missing
            elm.$attrs[name] = { $value: val, $txnid: txnid }; // create new attribute record
        }
    };

/** Add mutable class name */
export const class_: (name: string) => void =
    BROWSER ? (name) => {
        const elm = state.$node as DomElement; // get current element from state
        const { $classes } = elm; // get mutable class set of element

        if (!$classes[name]) { // when class is missing
            dom.add_class(elm.$node, name); // add class to DOM element classes
        }

        // update txn id to prevent removing class from DOM element
        $classes[name] = txnid;
    } : (name) => {
        // update txn id to prevent removing class from DOM element
        (state.$node as DomElement).$classes[name] = txnid;
    };

/** Set immutable style */
export const istyle: <S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) => void =
    BROWSER ? (name, val) => {
        const elm = state.$node as DomElement; // get current element from state

        if (elm.$style[name]) { // when style property is listed in mutable set
            elm.$style[name] = NULL; // remove it from mutable set
        } else { // when style is missing
            dom.set_style(elm.$node as HTMLElement, name, val); // set style of DOM element
        }
    } : (name, val) => {
        const elm = state.$node as DomElement; // get current element from state

        if (!elm.$style[name]) { // when style property is missing
            elm.$style[name] = { $value: val, $txnid: 0 }; // add it into style properties set
        }
    };

/** Set mutable style */
export const style: <S extends keyof DomStyleMap>(name: S, val: DomStyleMap[S]) => void =
    BROWSER ? (name, val) => {
        const elm = state.$node as DomElement; // get current element from state
        const ent = elm.$style[name]; // get style entry from set of mutable styles

        if (ent) { // when style already set
            if (ent.$value != val) { // when value changed
                // update value and set style of DOM element
                dom.set_style(elm.$node as HTMLElement, name, ent.$value = val);
            }
            // update txn id to prevent removing style from DOM element
            ent.$txnid = txnid;
        } else { // when style is missing
            elm.$style[name] = { $value: val, $txnid: txnid }; // create new style entry
            dom.set_style(elm.$node as HTMLElement, name, val); // set style of DOM element
        }
    } : (name, val) => {
        const elm = state.$node as DomElement; // get current element from state
        const ent = elm.$style[name]; // get style entry from set of mutable styles

        if (ent) { // when style already set
            if (ent.$value != val) { // when value changed
                // update value and set style of DOM element
                ent.$value = val;
            }
            // update txn id to prevent removing style from DOM element
            ent.$txnid = txnid;
        } else { // when style is missing
            elm.$style[name] = { $value: val, $txnid: txnid }; // create new style entry
        }
    };

/**
   Attach event listener to element

   Only immutable event listeners is supported.
*/
export const ievent: <E extends keyof DomEventMap>(name: E, fn: DomEventFn<E>) => void =
    BROWSER ? (name, fn) => {
        dom.add_event((state.$node as DomElement).$node, name, fn); // attach event listener to DOM element
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
export function start() {
    const frag: DomFragment = {
        $flags: DomFlags.Empty,
        $node: state.$node.$node,
        $nodes: [],
    };

    if (!state.$fragment) {
        state.$fragment = [frag];
    } else {
        state.$fragment.push(frag);
    }
}

/**
 * Finalize fragment capturing and return fragment
 */
export function stop(): DomFragment {
    if (DEBUG) {
        assert(state.$fragment, "Attempt to end fragment which is not started");
    }

    if ((state.$fragment as DomFragment[]).length > 1) {
        return (state.$fragment as DomFragment[]).pop() as DomFragment;
    }

    const frag = (state.$fragment as DomFragment[])[0];

    state.$fragment = NULL;

    return frag;
}

function capture_node(node: DomNode) {
    if (state.$fragment) {
        for (let i = 0; i < state.$fragment.length; i++) {
            state.$fragment[i].$nodes.push(node);
        }
    }
}

/**
 * Reuse captured fragment
 */
export function reuse(frag: DomFragment) {
    if (DEBUG) {
        assert(frag.$node !== state.$node.$node, "Attempt to reuse fragment which parent is different");
    }

    for (let i = 0; i < frag.$nodes.length; i++) {
        const node = frag.$nodes[i];

        if (BENCH_REUSE) bench_start(reuse1_stats!);

        const elm = reuse_node(state.$reconciler, match_node, node, true);

        if (DEBUG) {
            assert(elm, "Unable to reuse fragment bacause fragment node not exists");
        }

        if (BENCH_REUSE) bench_stop(reuse1_stats!);
    }
}

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
