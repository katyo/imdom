import { BROWSER, TRACE_DOM } from './decls';
import { NULL, EMPTY_STRING, is_defined } from './utils';
import { DomDocTypeSpec, DomStyleMap, DomAttrName, DomAttrType, DomEventMap, DomEventFn } from './types';

const doc: Document = (BROWSER && document) as Document;

/** Trace function */
function trace(...args: any[]) {
    console.log(...args);
}

/** Create new DOM element node */
export function create_element(tag: string, ns?: string): Element {
    const node = !ns ? doc.createElement(tag) : // create DOM element node
        doc.createElementNS(ns, tag); // create DOM element node with namespace

    if (TRACE_DOM) {
        trace('create element', node);
    }

    return node;
}

/** Create new DOM text node */
export function create_text(str: string): Text {
    if (TRACE_DOM) {
        const node = doc.createTextNode(str);
        trace('create text', node);
        return node;
    } else {
        return doc.createTextNode(str);
    }
}

/** Create new DOM comment node */
export function create_comment(str: string): Comment {
    if (TRACE_DOM) {
        const node = doc.createComment(str);
        trace('create comment', node);
        return node;
    } else {
        return doc.createComment(str);
    }
}

/** Create new DOM document type node */
export function create_doctype(dt: DomDocTypeSpec): DocumentType {
    if (TRACE_DOM) {
        const node = doc.implementation.createDocumentType(dt.n, dt.p, dt.s);
        trace('create doctype', node);
        return node;
    } else {
        return doc.implementation.createDocumentType(dt.n, dt.p, dt.s);
    }
}

/** Set text content of node */
export function set_text(node: Text | Comment | Element, str: string) {
    if (TRACE_DOM) {
        trace('set text', `"${str}"`, 'to', node);
    }

    node.textContent = str;
}

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node(parent: Node, other: Node, child: Node) {
    if (TRACE_DOM) {
        trace('replace node', child, 'in', parent, 'by', other);
    }

    parent.replaceChild(other, child);
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node(parent: Node, child: Node, other: Node) {
    if (TRACE_DOM) {
        trace('insert node', child, 'to', parent, 'before', other);
    }

    parent.insertBefore(child, other);
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

    if (other && other.nextSibling) {
        parent.insertBefore(child, other.nextSibling);
    } else {
        parent.appendChild(child);
    }
}

/** Remove child DOM node from parent DOM node */
export function remove_node(parent: Node, child: Node) {
    if (TRACE_DOM) {
        trace('remove node', child, 'from', parent);
    }

    parent.removeChild(child);
}

/** Add class to DOM element */
export function add_class(elm: Element, name: string) {
    if (TRACE_DOM) {
        trace('add class', name, 'to', elm);
    }

    elm.classList.add(name);
}

/** Remove class from DOM element */
export function remove_class(elm: Element, name: string) {
    if (TRACE_DOM) {
        trace('remove class', name, 'from', elm);
    }

    elm.classList.remove(name);
}

/** Set style property to DOM element */
export function set_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    if (TRACE_DOM) {
        trace('set style', name, '=', val, 'to', elm);
    }

    elm.style.setProperty(name as string, val);
}

/** Remove style property from DOM element */
export function remove_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    if (TRACE_DOM) {
        trace('remove style', name, 'from', elm);
    }

    elm.style.removeProperty(name as string);
}

/** Set attribute to DOM element */
export function set_attr<A extends DomAttrName>(elm: Element, name: A, val: DomAttrType<A>) {
    if (TRACE_DOM) {
        trace('set attr', name, '=', `"${val}"`, 'to', elm);
    }

    const undef = !is_defined(val);
    elm.setAttribute(name, undef ? EMPTY_STRING : val as string);
    if (name == 'value') {
        (elm as any)[name] = val; // set value DOM property
    } else if (undef) {
        (elm as any)[name] = true; // set boolean DOM property
    }
}

/** Remove attribute from DOM element */
export function remove_attr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    if (TRACE_DOM) {
        trace('remove attr', name, 'from', elm);
    }

    elm.removeAttribute(name);
    if (name == 'value') {
        (elm as any)[name] = ''; // reset value DOM property
    } else if (!is_defined(val)) {
        (elm as any)[name] = false; // reset boolean DOM property
    }
}

/** Add event listener to DOM element */
export function add_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOM) {
        trace('add event', name, 'to', elm);
    }

    elm.addEventListener(name as string, fn as EventListener, false);
}

/** Remove event listener from DOM element */
export function remove_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    if (TRACE_DOM) {
        trace('remove event', name, 'from', elm);
    }

    elm.removeEventListener(name as string, fn as EventListener, false);
}
