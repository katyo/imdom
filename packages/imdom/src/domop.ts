/**
 * @module domop
 */

import { DomDocTypeSpec, DomStyleMap, DomAttrMap, DomEventMap, DomEventFn } from './types';
import { NULL, EMPTY_STRING, is_defined } from './utils';
import { BROWSER } from './decls';

const doc: Document = (BROWSER && document) as Document;

/** Create new DOM element node */
export function create_element_dom(tag: string, ns?: string): Element {
    return !ns ? doc.createElement(tag) : // create DOM element node
        doc.createElementNS(ns, tag); // create DOM element node with namespace
}

/** Create new DOM text node */
export function create_text_dom(str: string): Text {
    return doc.createTextNode(str);
}

/** Create new DOM comment node */
export function create_comment_dom(str: string): Comment {
    return doc.createComment(str);
}

/** Create new DOM document type node */
export function create_doctype_dom(dt: DomDocTypeSpec): DocumentType {
    return doc.implementation.createDocumentType(dt.n, dt.p, dt.s);
}

/** Set text content of node */
export function set_text_dom(node: Text | Comment | Element, str: string) {
    node.textContent = str;
}

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node_dom(parent: Node, other: Node, child: Node) {
    parent.replaceChild(other, child);
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node_dom(parent: Node, child: Node, other: Node) {
    parent.insertBefore(child, other);
}

/** Insert child DOM node to parent DOM node after other child DOM node */
export function append_node_dom(parent: Node, child: Node, other: Node | undefined = NULL) {
    if (other && other.nextSibling) {
        parent.insertBefore(child, other.nextSibling);
    } else {
        parent.appendChild(child);
    }
}

/** Remove child DOM node from parent DOM node */
export function remove_node_dom(parent: Node, child: Node) {
    parent.removeChild(child);
}

/** Add class to DOM element */
export function add_class_dom(elm: Element, name: string) {
    elm.classList.add(name);
}

/** Remove class from DOM element */
export function remove_class_dom(elm: Element, name: string) {
    elm.classList.remove(name);
}

/** Set style property to DOM element */
export function set_style_dom<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    elm.style.setProperty(name as string, val);
}

/** Remove style property from DOM element */
export function remove_style_dom<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    elm.style.removeProperty(name as string);
}

/** Set attribute to DOM element */
export function set_attr_dom<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    const undef = !is_defined(val);
    elm.setAttribute(name, undef ? EMPTY_STRING : val as string);
    if (name == 'value') {
        (elm as any)[name] = val; // set value DOM property
    } else if (undef) {
        (elm as any)[name] = true; // set boolean DOM property
    }
}

/** Remove attribute from DOM element */
export function remove_attr_dom<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    elm.removeAttribute(name);
    if (name == 'value') {
        (elm as any)[name] = ''; // reset value DOM property
    } else if (!is_defined(val)) {
        (elm as any)[name] = false; // reset boolean DOM property
    }
}

/** Add event listener to DOM element */
export function add_event_dom<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.addEventListener(name as string, fn as EventListener, false);
}

/** Remove event listener from DOM element */
export function remove_event_dom<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.removeEventListener(name as string, fn as EventListener, false);
}
