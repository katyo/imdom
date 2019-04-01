/**
 * @module utils
 */

import { DomFlags, DomKey, DomNode, DomText, DomComment, DomDocType, DomDocTypeSpec, DomElement, DomSelector, DomClassSet, DomNameSpace, DomAttrMap } from './types';

/** Undefined value */
export const NULL = void 0;

export { NULL as _ };

/** Empty string constant */
export const EMPTY_STRING = '';

/** Dummy function */
export const NOOP = () => {};

/** Check when some value is defined */
export function is_defined<T>(v: T | undefined | null | void): v is T {
    return v != NULL;
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

/** Virtual node is document type node */
export function is_doctype(node: DomNode): node is DomDocType {
    return (node.f & DomFlags.DocType) as unknown as boolean;
}

/** Internal selector (optimal) */
export interface Selector {
    t: string;
    n: DomNameSpace,
    i: string | undefined,
    c: string[] | undefined,
    k: DomKey | undefined,
}

/** Check when virtual element matched to selector */
function same_element(elm: DomElement, sel: Selector): boolean {
    const {x} = elm;
    return x.n == sel.n && // namespace is same
        x.t == sel.t && // tag name is same
        sel.i == x.i && // identifier is same
        (!sel.c || x.c && has_classes(sel.c, x.c)) && // has same classes
        sel.k == x.k || // key is same
        false; // not same
}

/** Check when virtual text node matched to string */
function same_text<T extends DomText | DomComment>(txt: T, str: string): boolean {
    return txt.t == str;
}

/** Virtual node is element which matched to selector */
export function match_element(node: DomNode, sel: Selector): node is DomElement {
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

/** Virtual node is document type with nodeName which matched to string */
export function match_doctype(node: DomNode, dt: DomDocTypeSpec): node is DomDocType {
    return is_doctype(node) && node.d.n == dt.n && node.d.p == dt.p && node.d.s == dt.s;
}

/** Parse element selector from string */
export function parse_selector(sel: string): DomSelector {
    //const ns_i = sel.search(/:/);
    const id_i = sel.search(/#/);
    const cls_i = sel.search(/\./);
    const res: DomSelector = {
        //n: ns_i && parse_ns(sel.substring(0, ns_i)) || DomNamespace.XHTML,
        //t: sel.substring(ns_i ? ns_i + 1 : 0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : sel.length) || 'div'
        n: DomNameSpace.XHTML,
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
function has_classes(req: string[], all: DomClassSet): boolean {
    for (const name of req) if (!(name in all)) return false;
    return true;
}

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
        n: parse_ns_uri(elm.namespaceURI) as DomNameSpace, // name space
        t: tag, // tag name
        i: id, // identifier
        c: cls, // classes
        k: get_attr_str(elm, 'data-key'), // key
    };
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
    if (has_attr(elm, name)) {
        return get_attr(elm, name) as string;
    }
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

export const ns_uri_map: Record<DomNameSpace, string> = [
    'http://www.w3.org/1999/xhtml',
    'http://www.w3.org/2000/svg',
    'http://www.w3.org/1999/xlink',
    'http://www.w3.org/XML/1998/namespace',
];

export function parse_ns_uri(ns: string | null): DomNameSpace | undefined {
    if (ns) {
        for (let i: DomNameSpace = 0; i < (ns_uri_map as unknown as string[]).length; i++) {
            if (ns_uri_map[i] == ns) {
                return i as DomNameSpace;
            }
        }
    }
}
