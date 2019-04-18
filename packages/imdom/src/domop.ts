import { BROWSER, TRACE_DOMOP, BENCH_DOMOP } from './decls';
import { NULL, EMPTY_STRING, is_defined, trace, show_node } from './utils';
import { DomDocTypeSpec, DomStyleMap, DomAttrName, DomAttrType, DomEventMap, DomEventFn } from './types';
import { Bench, bench_init, bench_start, bench_stop } from './bench';

const doc: Document = (BROWSER && document) as Document;

export const domop_stats: Bench | undefined = BROWSER && BENCH_DOMOP ? bench_init() : NULL;

/** Create new DOM element node */
export function create_element(tag: string, ns?: string): Element {
    if (BENCH_DOMOP) bench_start(domop_stats!);

    const node = !ns ? doc.createElement(tag) : // create DOM element node
        doc.createElementNS(ns, tag); // create DOM element node with namespace

    if (BENCH_DOMOP) bench_stop(domop_stats!);

    if (TRACE_DOMOP) trace('create element', show_node(node));

    return node;
}

/** Create new DOM text node */
export function create_text(str: string): Text {
    if (BENCH_DOMOP) bench_start(domop_stats!);

    const node = doc.createTextNode(str);

    if (BENCH_DOMOP) bench_stop(domop_stats!);

    if (TRACE_DOMOP) trace('create text', show_node(node));

    return node;
}

/** Create new DOM comment node */
export function create_comment(str: string): Comment {
    if (BENCH_DOMOP) bench_start(domop_stats!);

    const node = doc.createComment(str);

    if (BENCH_DOMOP) bench_stop(domop_stats!);

    if (TRACE_DOMOP) trace('create comment', show_node(node));

    return node;
}

/** Create new DOM document type node */
export function create_doctype(dt: DomDocTypeSpec): DocumentType {
    if (BENCH_DOMOP) bench_start(domop_stats!);

    const node = doc.implementation.createDocumentType(dt.$name, dt.$pub_id, dt.$sys_id);

    if (BENCH_DOMOP) bench_stop(domop_stats!);

    if (TRACE_DOMOP) trace('create doctype', show_node(node));

    return node;
}

/** Set text content of node */
export function set_text(node: Text | Comment | Element, str: string) {
    if (TRACE_DOMOP) trace('set text', `"${str}"`, 'to', show_node(node));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    node.textContent = str;

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node(parent: Node, other: Node, child: Node) {
    if (TRACE_DOMOP) trace('replace node', show_node(child), 'in', show_node(parent), 'by', show_node(other));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    parent.replaceChild(other, child);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node(parent: Node, child: Node, other: Node) {
    if (TRACE_DOMOP) trace('insert node', show_node(child), 'to', show_node(parent), 'before', show_node(other));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    parent.insertBefore(child, other);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Insert child DOM node to parent DOM node after other child DOM node */
export function append_node(parent: Node, child: Node, other: Node | undefined = NULL) {
    if (TRACE_DOMOP) {
        if (other) {
            trace('insert node', show_node(child), 'to', show_node(parent), 'after', show_node(other));
        } else {
            trace('append node', show_node(child), 'to', show_node(parent));
        }
    }

    if (BENCH_DOMOP) bench_start(domop_stats!);

    if (other && other.nextSibling) {
        parent.insertBefore(child, other.nextSibling);
    } else {
        parent.appendChild(child);
    }

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Remove child DOM node from parent DOM node */
export function remove_node(parent: Node, child: Node) {
    if (TRACE_DOMOP) trace('remove node', show_node(child), 'from', show_node(parent));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    parent.removeChild(child);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Add class to DOM element */
export function add_class(elm: Element, name: string) {
    if (TRACE_DOMOP) trace('add class', name, 'to', show_node(elm));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.classList.add(name);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Remove class from DOM element */
export function remove_class(elm: Element, name: string) {
    if (TRACE_DOMOP) trace('remove class', name, 'from', show_node(elm));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.classList.remove(name);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Set style property to DOM element */
export function set_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    if (TRACE_DOMOP) trace('set style', name, '=', val, 'to', show_node(elm));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.style.setProperty(name as string, val);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Remove style property from DOM element */
export function remove_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    if (TRACE_DOMOP) trace('remove style', name, 'from', show_node(elm));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.style.removeProperty(name as string);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Set attribute to DOM element */
export function set_attr<A extends DomAttrName>(elm: Element, name: A, val: DomAttrType<A>) {
    if (TRACE_DOMOP) trace('set attr', name, '=', `"${val}"`, 'to', show_node(elm));

    const undef = !is_defined(val);

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.setAttribute(name, undef ? EMPTY_STRING : val as string);

    if (name == 'value') {
        (elm as any)[name] = val; // set value DOM property
    } else if (undef) {
        (elm as any)[name] = true; // set boolean DOM property
    }

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Remove attribute from DOM element */
export function remove_attr<A extends DomAttrName>(elm: Element, name: A, val: DomAttrType<A>) {
    if (TRACE_DOMOP) trace('remove attr', name, 'from', show_node(elm));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.removeAttribute(name);

    if (name == 'value') {
        (elm as any)[name] = ''; // reset value DOM property
    } else if (!is_defined(val)) {
        (elm as any)[name] = false; // reset boolean DOM property
    }

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

export type EventNode = Element | Document | Window;

/** Add event listener to DOM element */
export function add_event<E extends keyof DomEventMap>(elm: EventNode, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOMOP) trace('add event', name, 'to', show_node(elm as Node));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.addEventListener(name as string, fn as EventListener, false);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Remove event listener from DOM element */
export function remove_event<E extends keyof DomEventMap>(elm: EventNode, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOMOP) trace('remove event', name, 'from', show_node(elm as Node));

    if (BENCH_DOMOP) bench_start(domop_stats!);

    elm.removeEventListener(name as string, fn as EventListener, false);

    if (BENCH_DOMOP) bench_stop(domop_stats!);
}

/** Add event listener which fires once */
export function once_event<E extends keyof DomEventMap>(elm: EventNode, name: E, fn: DomEventFn<E>) {
    add_event(elm, name, function handle(event) {
        remove_event(elm, name, handle);
        return fn(event);
    });
}
