import { DomFlags, DomNode, DomText, DomComment, DomElement, DomSelector, DomClassSet, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn, DomNamespace } from './types';

/** Undefined value */
export const NULL = void 0;

/** Empty string constant */
export const EMPTY_STRING = '';

/** Dummy function */
export const NOOP = () => {};

/** Check when some value is defined */
export function is_defined<T>(v: T | undefined | null | void): v is T {
    return v != NULL;
}

/** Trace function */
export const trace: (...args: any[]) => void = process.env.IMDOM_TRACE ?
    (...args) => { console.log(...args); } : NOOP;

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
    return x.n == sel.n && // namespace is same
        x.t == sel.t && // tag name is same
        sel.i == x.i && // identifier is same
        (!sel.c && !x.c || sel.c && x.c && has_classes(sel.c, x.c)) && // has same classes
        sel.k == x.k || // key is same
        false; // not same
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
    if (node.t != str) {
        set_text(node.$, node.t = str);
    }
}

/** Parse element selector from string */
export function parse_selector(sel: string): DomSelector {
    //const ns_i = sel.search(/:/);
    const id_i = sel.search(/#/);
    const cls_i = sel.search(/\./);
    const res: DomSelector = {
        //n: ns_i && parse_ns(sel.substring(0, ns_i)) || DomNamespace.XHTML,
        //t: sel.substring(ns_i ? ns_i + 1 : 0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : sel.length) || 'div'
        n: DomNamespace.XHTML,
        t: sel.substring(0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : sel.length) || 'div'
    };
    if (id_i >= 0) res.i = sel.substring(id_i + 1, cls_i >= 0 ? cls_i : sel.length);
    if (cls_i >= 0) res.c = parse_classes(sel.substring(cls_i + 1, sel.length));
    return res;
}

/** Parse classes from string */
export function parse_classes(cls?: string | null): DomClassSet | undefined {
    if (cls) {
        const classes = {} as DomClassSet;
        const lst = cls.replace(/^[\.\s]/, '').split(/[\.\s]/);
        for (const name of lst) classes[name] = true;
        return classes;
    }
}

/** Build classes from set */
export function build_classes(cls: DomClassSet, sep: string = ' ') {
    let str = '';
    for (const name in cls) str += sep + name;
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
/*export function offset_node(node: Node, ref: Node): number {
    let offset = 0; // initialize offset
    // seek beginning node to calculate offset
    for (let elm = ref;
         elm != node && (elm = elm.nextSibling as Node);
         offset++);
    return offset;
}*/

/** Get selector from DOM element */
export function node_selector(elm: Element): DomSelector {
    const tag = elm.tagName.toLowerCase();
    const id = get_attr_str(elm, 'id');
    const cls = parse_classes(get_attr(elm, 'class') as string);
    return {
        // full selector
        /*s: tag
            + (id ? '#' + id : '')
            + (cls ? build_classes(cls, '.') : ''),*/
        n: parse_ns_uri(elm.namespaceURI) as DomNamespace, // name space
        t: tag, // tag name
        i: id, // identifier
        c: cls, // classes
        k: get_attr_str(elm, 'data-key'), // key
    };
}

/*const ns_map: Record<DomNamespace, string> = [
    'xhtml',
    'svg',
    'xlink',
    'xml',
];

function parse_ns(ns: string | null): DomNamespace | undefined {
    if (ns) {
        for (let i: DomNamespace = 0; i < (ns_map as unknown as string[]).length; i++) {
            if (ns_map[i] == ns) {
                return i as DomNamespace;
            }
        }
    }
}*/

const ns_uri_map: Record<DomNamespace, string> = [
    'http://www.w3.org/1999/xhtml',
    'http://www.w3.org/2000/svg',
    'http://www.w3.org/1999/xlink',
    'http://www.w3.org/XML/1998/namespace',
];

function parse_ns_uri(ns: string | null): DomNamespace | undefined {
    if (ns) {
        for (let i: DomNamespace = 0; i < (ns_uri_map as unknown as string[]).length; i++) {
            if (ns_uri_map[i] == ns) {
                return i as DomNamespace;
            }
        }
    }
}

/** Create new DOM element node */
export function create_element(doc: Document, sel: DomSelector): Element {
    const node = !sel.n ? doc.createElement(sel.t) : // create DOM element node
        doc.createElementNS(ns_uri_map[sel.n] as string, sel.t); // create DOM element node with namespace
    
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

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node(parent: Node, other: Node, child: Node) {
    trace('replace node', child, 'in', parent, 'by', other);
    parent.replaceChild(other, child);
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node(parent: Node, child: Node, other: Node) {
    trace('insert node', child, 'to', parent, 'before', other);
    parent.insertBefore(child, other);
}

/** Insert child DOM node to parent DOM node after other child DOM node */
export function append_node(parent: Node, child: Node, other: Node | undefined = NULL) {
    if (other && other.nextSibling) {
        trace('insert node', child, 'to', parent, 'after', other);
        parent.insertBefore(child, other.nextSibling);
    } else {
        trace('append node', child, 'to', parent);
        parent.appendChild(child);
    }
}

/** Remove child DOM node from parent DOM node */
export function remove_node(parent: Node, child: Node) {
    trace('remove node', child, 'from', parent);
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
