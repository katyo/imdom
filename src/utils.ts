import { DomFlags, DomNode, DomText, DomComment, DomElement, DomSelector, DomClassSet, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn } from './types';

/** Undefined value */
export const EMPTY_VALUE = void 0;

/** Empty string constant */
export const EMPTY_STRING = '';

/** Check when some value is defined */
export function is_defined<T>(v: T | undefined | null | void): v is T {
    return v != EMPTY_VALUE;
}

/** Virtual node is element node */
export function is_element(node: DomNode): node is DomElement {
    return (node.f & DomFlags.Element) as unknown as boolean;
}

/** Virtual node is text node */
export function is_text(node: DomNode): node is DomText {
    return (node.f & DomFlags.Text) as unknown as boolean;
}

/** Virtual node is comment node */
export function is_comment(node: DomNode): node is DomComment {
    return (node.f & DomFlags.Comment) as unknown as boolean;
}

/** Check when virtual element matched to selector */
function same_element(elm: DomElement, sel: DomSelector): boolean {
    const {x} = elm;
    return x.t == sel.t &&
        (!sel.i || sel.i == x.i) &&
        (!sel.c && !x.c || sel.c && x.c && has_classes(sel.c, x.c)) &&
        (sel.k == x.k) ||
        false;
}

/** Check when virtual text node matched to string */
function same_text<T extends DomText | DomComment>(txt: T, str: string): boolean {
    return txt.t == str;
}

/** Virtual node is element which matched to selector */
export function match_element(node: DomNode, sel: DomSelector): node is DomElement {
    return is_element(node) && same_element(node, sel);
}

/** Virtual node is text which matched to string */
export function match_text(node: DomNode, str: string): node is DomText {
    return is_text(node) && same_text(node, str);
}

/** Virtual node is comment which matched to string */
export function match_comment(node: DomNode, str: string): node is DomComment {
    return is_comment(node) && same_text(node, str);
}

/** Update string content of text node */
export function update_text<T extends DomText | DomComment>(node: T, str: string) {
    set_text(node.$, node.t = str);
}

/** Parse element selector from string */
export function parse_selector(sel: string): DomSelector {
    const id_i = sel.search(/#/);
    const cls_i = sel.search(/\./);
    const res: DomSelector = { t: sel.substring(0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : sel.length) || 'div' };
    if (id_i >= 0) res.i = sel.substring(id_i + 1, cls_i >= 0 ? cls_i : sel.length);
    if (cls_i >= 0) res.c = parse_classes(sel.substring(cls_i + 1, sel.length));
    return res;
}

/** Parse classes from string */
export function parse_classes(cls?: string | null): DomClassSet | undefined {
    if (cls) {
        const classes = {} as DomClassSet;
        for (const name of cls.split(/[\.\s]/)) classes[name] = true;
        return classes;
    }
}

/** Build classes from set */
export function build_classes(cls: DomClassSet) {
    let str = '';
    for (const name in cls) str += str ? (' ' + name) : name;
    return str;
}

/** Check when required classes exists in all classes */
function has_classes(req: DomClassSet, all: DomClassSet): boolean {
    for (const name in req) if (!(name in all)) return false;
    return true;
}

/**
   Calculate node offset across to other node

   @note The node should be after reference.
*/
export function offset_node(node: Node, ref: Node): number {
    let offset = 0; // initialize offset
    // seek beginning node to calculate offset
    for (let elm = ref;
         elm != node && (elm = elm.nextSibling as Node);
         offset++);
    return offset;
}

/** Get selector from DOM element */
export function node_selector(elm: Element): DomSelector {
    return {
        t: elm.tagName.toLowerCase(), // tag name
        i: get_attr_str(elm, 'id'), // identifier
        c: parse_classes(get_attr(elm, 'class') as string), // classes
        k: get_attr_str(elm, 'data-key'), // key
    };
}

/** Create new DOM element node */
export function create_element(doc: Document, sel: DomSelector): Element {
    const node = doc.createElement(sel.t); // create DOM element node
    
    if (is_defined(sel.i)) set_attr(node, 'id', sel.i); // set id attribute when present
    if (sel.c) for (const name in sel.c) add_class(node, name); // add classes when present
    if (is_defined(sel.k)) set_attr(node, 'data-key', sel.k); // set key attribute when present
    
    return node;
}

/** Create new DOM text node */
export function create_text(doc: Document, str: string): Text {
    return doc.createTextNode(str);
}

/** Create new DOM comment node */
export function create_comment(doc: Document, str: string): Comment {
    return doc.createComment(str);
}

/** Set text content of node */
export function set_text(node: Text | Comment | Element, str: string) {
    node.textContent = str;
}

/** Insert child DOM node to parent DOM node at specified position */
export function insert_node(parent: Node, child: Node, index: number) {
    const at = parent.childNodes[index]; // get current child node at index
    if (at) { // when current child node exists
        parent.insertBefore(child, at); // insert child before it
    } else { // when current child node is missing
        parent.appendChild(child); // append child to end of parent children
    }
}

/** Remove child DOM node from parent DOM node */
export function remove_node(parent: Node, child: Node) {
    parent.removeChild(child);
}

/** Add class to DOM element */
export function add_class(elm: Element, name: string) {
    elm.classList.add(name);
}

/** Remove class from DOM element */
export function remove_class(elm: Element, name: string) {
    elm.classList.remove(name);
}

/** Set style property to DOM element */
export function set_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    elm.style.setProperty(name as string, val);
}

/** Remove style property from DOM element */
export function remove_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    elm.style.removeProperty(name as string);
}

/** Check attribute of DOM element */
export function has_attr<A extends keyof DomAttrMap>(elm: Element, name: A): boolean {
    return elm.hasAttribute(name);
}

/** Get attribute from DOM element */
export function get_attr<A extends keyof DomAttrMap>(elm: Element, name: A): DomAttrMap[A] | null {
    return elm.getAttribute(name);
}

export function get_attr_str<A extends keyof DomAttrMap>(elm: Element, name: A): string | undefined {
    if (has_attr(elm, name)) return get_attr(elm, name) as string;
}

/** Set attribute to DOM element */
export function set_attr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    elm.setAttribute(name, val as string);
}

/** Remove attribute from DOM element */
export function remove_attr<A extends keyof DomAttrMap>(elm: Element, name: A) {
    elm.removeAttribute(name);
}

/** Add event listener to DOM element */
export function add_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.addEventListener(name as string, fn as EventListener, false);
}

/** Remove event listener from DOM element */
export function remove_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.removeEventListener(name as string, fn as EventListener, false);
}
