import { BROWSER, TRACE_DOM } from './decls';
import { NULL } from './utils';
import { DomDocTypeSpec, DomStyleMap, DomAttrMap, DomEventMap, DomEventFn } from './types';
import { create_element_dom, create_text_dom, create_comment_dom, create_doctype_dom, set_text_dom, replace_node_dom, prepend_node_dom, append_node_dom, remove_node_dom, add_class_dom, remove_class_dom, set_style_dom, remove_style_dom, set_attr_dom, remove_attr_dom, add_event_dom, remove_event_dom } from './domop';
import { create_element_ssr, create_text_ssr, create_comment_ssr, create_doctype_ssr, set_text_ssr, replace_node_ssr, prepend_node_ssr, append_node_ssr, remove_node_ssr, add_class_ssr, remove_class_ssr, set_style_ssr, remove_style_ssr, set_attr_ssr, remove_attr_ssr } from './ssrop';

/** Trace function */
function trace(...args: any[]) {
    console.log(...args);
}

/** Create new DOM element node */
export function create_element(tag: string, ns?: string): Element {
    const node = (BROWSER ? create_element_dom : create_element_ssr)(tag, ns);

    if (TRACE_DOM) {
        trace('create element', node);
    }

    return node;
}

/** Create new DOM text node */
export function create_text(str: string): Text {
    if (TRACE_DOM) {
        const node = (BROWSER ? create_text_dom : create_text_ssr)(str);
        trace('create text', node);
        return node;
    } else {
        return (BROWSER ? create_text_dom : create_text_ssr)(str);
    }
}

/** Create new DOM comment node */
export function create_comment(str: string): Comment {
    if (TRACE_DOM) {
        const node = (BROWSER ? create_comment_dom : create_comment_ssr)(str);
        trace('create comment', node);
        return node;
    } else {
        return (BROWSER ? create_comment_dom : create_comment_ssr)(str);
    }
}

/** Create new DOM document type node */
export function create_doctype(dt: DomDocTypeSpec): DocumentType {
    if (TRACE_DOM) {
        const node = (BROWSER ? create_doctype_dom : create_doctype_ssr)(dt);
        trace('create doctype', node);
        return node;
    } else {
        return (BROWSER ? create_doctype_dom : create_doctype_ssr)(dt);
    }
}

/** Set text content of node */
export function set_text(node: Text | Comment | Element, str: string) {
    if (TRACE_DOM) {
        trace('set text', `"${str}"`, 'to', node);
    }

    (BROWSER ? set_text_dom : set_text_ssr)(node, str);
}

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node(parent: Node, other: Node, child: Node) {
    if (TRACE_DOM) {
        trace('replace node', child, 'in', parent, 'by', other);
    }

    (BROWSER ? replace_node_dom : replace_node_ssr)(parent, other, child);
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node(parent: Node, child: Node, other: Node) {
    if (TRACE_DOM) {
        trace('insert node', child, 'to', parent, 'before', other);
    }

    (BROWSER ? prepend_node_dom : prepend_node_ssr)(parent, child, other);
}

/** Insert child DOM node to parent DOM node after other child DOM node */
export function append_node(parent: Node, child: Node, other: Node | undefined = NULL) {
    if (TRACE_DOM) {
        if (other) {
            trace('insert node', child, 'to', parent, 'after', other);
        } else {
            trace('append node', child, 'to', parent);
        }
    }

    (BROWSER ? append_node_dom : append_node_ssr)(parent, child, other);
}

/** Remove child DOM node from parent DOM node */
export function remove_node(parent: Node, child: Node) {
    if (TRACE_DOM) {
        trace('remove node', child, 'from', parent);
    }

    (BROWSER ? remove_node_dom : remove_node_ssr)(parent, child);
}

/** Add class to DOM element */
export function add_class(elm: Element, name: string) {
    if (TRACE_DOM) {
        trace('add class', name, 'to', elm);
    }

    (BROWSER ? add_class_dom : add_class_ssr)(elm, name);
}

/** Remove class from DOM element */
export function remove_class(elm: Element, name: string) {
    if (TRACE_DOM) {
        trace('remove class', name, 'from', elm);
    }

    (BROWSER ? remove_class_dom : remove_class_ssr)(elm, name);
}

/** Set style property to DOM element */
export function set_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    if (TRACE_DOM) {
        trace('set style', name, '=', val, 'to', elm);
    }

    (BROWSER ? set_style_dom : set_style_ssr)(elm, name, val);
}

/** Remove style property from DOM element */
export function remove_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    if (TRACE_DOM) {
        trace('remove style', name, 'from', elm);
    }

    (BROWSER ? remove_style_dom : remove_style_ssr)(elm, name);
}

/** Set attribute to DOM element */
export function set_attr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    if (TRACE_DOM) {
        trace('set attr', name, '=', `"${val}"`, 'to', elm);
    }

    (BROWSER ? set_attr_dom : set_attr_ssr)(elm, name, val);
}

/** Remove attribute from DOM element */
export function remove_attr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    if (TRACE_DOM) {
        trace('remove attr', name, 'from', elm);
    }

    (BROWSER ? remove_attr_dom : remove_attr_ssr)(elm, name, val);
}

/** Add event listener to DOM element */
export function add_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOM) {
        trace('add event', name, 'to', elm);
    }

    if (BROWSER) {
        add_event_dom(elm, name, fn);
    }
}

/** Remove event listener from DOM element */
export function remove_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOM) {
        trace('remove event', name, 'from', elm);
    }

    if (BROWSER) {
        remove_event_dom(elm, name, fn);
    }
}
