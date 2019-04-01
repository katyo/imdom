/**
 * @module patch
 */

import { DomTxnId, DomClassSet, DomNameSpace, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn, DomElement, DomText, DomComment, DomDocType, DomDocTypeSpec, DomNode, DomFlags, DomFragment, DomKey } from './types';
import { Selector, is_defined, match_element, is_element, is_text, is_comment, match_doctype, NULL, NOOP, ns_uri_map } from './utils';
import { Reconciler, use_nodes, reuse_node, push_node, reconcile } from './reuse';
import { create_element, create_text, create_comment, create_doctype, set_text, replace_node, prepend_node, append_node, remove_node, add_class, remove_class, set_style, remove_style, set_attr, remove_attr, add_event } from './uniop';

export interface State {
    // element
    $: DomElement | DomFragment,
    // reconciler
    r: Reconciler<DomNode>,
    // current key
    k: DomKey | undefined,
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
        /*for (const child of node._) {
            detach(child);
        }*/
        node.f &= ~DomFlags.Attached; // mark element as detached
    }
}

function attach(node: DomNode) {
    if (is_element(node) // when virtual node is element
        && !is_attached(node)) { // and virtual element is detached
        //trace('attach', node.$);
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
        replace,
        prepend,
        append,
        remove,
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

function create_text_node(str: string): DomText {
    return {
        $: create_text(str),
        f: DomFlags.Text,
        t: str,
    };
}

function create_comment_node(str: string): DomComment {
    return {
        $: create_comment(str),
        f: DomFlags.Comment,
        t: str,
    };
}

function create_doctype_node(dt: DomDocTypeSpec): DomDocType {
    return {
        $: create_doctype(dt),
        f: DomFlags.DocType,
        d: dt,
    };
}

/** Update string content of text node */
export function update_text<T extends DomText | DomComment>(node: T, str: string) {
    if (node.t != str) {
        set_text(node.$, node.t = str);
    }
}

function push_text<N extends DomNode, Ctx>(match: (node: DomNode, ctx: Ctx) => node is N, create: (ctx: Ctx) => N, update: (node: N, ctx: Ctx) => void, ctx: Ctx) {
    let elm = reuse_node(state.r, match, ctx, false) as N | void; // try to reuse next node using match function

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

/** Open new child element */
export function tag(name: string, id?: string, class1?: string, class2?: string, class3?: string, ...classes: string[]) {
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
            !classes.length ? [class1, class2, class3] : // three classes is present
            [class1, class2, class3, ...classes], // several classes is present
        k: state.k, // set element key
    };

    // try to reuse existing child element using selector
    let elm = reuse_node(state.r, match_element, sel, true) as DomElement | void;

    if (!elm) { // when virtual element missing
        const node = create_element(sel.t, sel.n ? ns_uri_map[sel.n] : NULL); // create new DOM node
        let class_set: DomClassSet | undefined;

        if (is_defined(sel.i)) set_attr(node, 'id', sel.i); // set id attribute when present
        if (sel.c) { // when classes is present
            class_set = {};
            for (const name of sel.c) { // for classes
                class_set[name] = true; // set class in selector
                add_class(node, name); // add class name
            }
        }
        if (is_defined(sel.k)) set_attr(node, 'data-key', sel.k); // set key attribute when present

        push_node(state.r, elm = { // create new virtual node
            f: DomFlags.Element,
            $: node,
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
        });
    } else if (!is_attached(elm) && sel.c) { // when element is exists but not attached
        const cls = elm.x.c; // get classes from element selector

        if (cls) { // when element has classes in selector
            for (const name of sel.c) { // iterate over classes in current selector
                cls[name] = false; // remove class from element selector
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
export function end() {
    const elm = state.$ as DomElement; // get current element from state

    if (elm.f & DomFlags.Element) { // when current subject is element
        const node = elm.$ as HTMLElement; // get associated DOM element

        const { a: attrs, c: classes, s: styles } = elm;

        // remove outdated attributes
        for (const name in attrs) {
            const attr = attrs[name];
            if (attr && attr.t < txnid) { // when attribute is not set in current transaction
                attrs[name] = NULL; // remove attribute entry from virtual element
                remove_attr(node, name, attr.v); // remove attribute from DOM element
            }
        }

        // remove outdated classes
        for (const name in classes) {
            if (classes[name] && classes[name]! < txnid) { // when class is not added in current transaction
                classes[name] = NULL; // remove class entry from virtual element
                remove_class(node, name); // remove class from DOM element
            }
        }

        // remove outdated styles
        for (const name in styles) {
            if (styles[name] && styles[name]!.t < txnid) { // when style is not set in current transaction
                styles[name] = NULL; // remove style entry from virtual element
                remove_style(node, name); // remove style from DOM element
            }
        }
    }

    stack_pop(); // pop state from stack
}

/** Put text node */
export function text(str: string) {
    if (str) { // when string is not empty
        push_text(is_text, create_text_node, update_text, str); // push text node
    }
}

/** Put comment node */
export function comment(str: string) {
    push_text(is_comment, create_comment_node, update_text, str); // push comment node
}

/** Put document type node */
export function doctype(qualifiedName: string, publicId: string = '', systemId: string = '') {
    push_text(match_doctype, create_doctype_node, NOOP, {n: qualifiedName, p: publicId, s: systemId}); // push document type node
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
        elm.a[name] = NULL; // remove it from mutable set
    } else { // when attribute is missing
        set_attr(elm.$, name, val); // set attribute of DOM element
    }
}

/** Put mutable attribute */
export function attr<A extends keyof DomAttrMap>(name: A, val?: DomAttrMap[A]) {
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
        elm.s[name] = NULL; // remove it from mutable set
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
            set_style(elm.$ as HTMLElement, name, ent.v = val);
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
