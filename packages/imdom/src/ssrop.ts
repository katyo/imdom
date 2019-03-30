/**
 * @module ssrop
 */

import { DomFlags, DomDocTypeSpec, DomStyleMap, DomAttrMap } from './types';
import { NULL, EMPTY_STRING, is_defined } from './utils';

/** Generic stub DOM node */
export type StubNode = StubText | StubComment | StubDocType | StubElement;

/** Reference to stub DOM node */
export type StubNodeRef = StubNode | undefined;

/** Base stub DOM node */
export interface StubBase {
    f: DomFlags;
    /** Previous node */
    p: StubNodeRef;
    /** Next node */
    n: StubNodeRef;
}

/** Stub DOM text node */
export interface StubText extends StubBase {
    t: string;
}

/** Stub DOM comment node */
export interface StubComment extends StubBase {
    t: string;
}

/** Stub DOM comment node */
export interface StubDocType extends StubBase {
    d: DomDocTypeSpec;
}

/** Stub DOM Element */
export interface StubElement extends StubBase {
    /** Tag name */
    t: string;
    /** Namespace */
    x: string | undefined;
    /** Classes */
    c: StubClasses;
    /** Attributes */
    a: StubAttrs;
    /** Styles */
    s: StubStyles;
    /** First child node */
    _: StubNodeRef;
    /** Last child node */
    $: StubNodeRef;
}

export type StubClasses = Record<string, boolean>;
export type StubAttrs = Record<string, string>;
export type StubStyles = Record<string, string>;

/** Stub DOM Fragment */
export interface StubFragment {
    /** First child node */
    _: StubNodeRef;
    /** Last child node */
    $: StubNodeRef;
}

/** Create new DOM element node */
export function create_element_ssr(tag: string, ns?: string): Element {
    return <StubElement>{
        f: DomFlags.Element,
        p: NULL,
        n: NULL,
        t: tag,
        x: ns,
        c: {},
        a: {},
        s: {},
        _: NULL,
        $: NULL,
    } as unknown as Element;
}

/** Create new DOM text node */
export function create_text_ssr(str: string): Text {
    return {
        f: DomFlags.Text,
        p: NULL,
        n: NULL,
        t: str,
    } as unknown as Text;
}

/** Create new DOM comment node */
export function create_comment_ssr(str: string): Comment {
    return {
        f: DomFlags.Comment,
        p: NULL,
        n: NULL,
        t: str,
    } as unknown as Comment;
}

/** Create new DOM document type node */
export function create_doctype_ssr(dt: DomDocTypeSpec): DocumentType {
    return {
        f: DomFlags.DocType,
        p: NULL,
        n: NULL,
        d: dt,
    } as unknown as DocumentType;
}

/** Set text content of node */
export function set_text_ssr(node: Text | Comment | Element, str: string) {
    (node as unknown as StubText).t = str;
}

/** Replace child DOM node in parent DOM node by other DOM node */
export function replace_node_ssr(parent: Node, other: Node, child: Node) {
    if ((child as unknown as StubNode).p) {
        (child as unknown as StubNode).p!.n = other as unknown as StubNode;
        (other as unknown as StubNode).p = (child as unknown as StubNode).p;
        (child as unknown as StubNode).p = NULL;
    } else {
        (parent as unknown as StubElement)._ = other as unknown as StubNode;
    }

    if ((child as unknown as StubNode).n) {
        (child as unknown as StubNode).n!.p = other as unknown as StubNode;
        (other as unknown as StubNode).n = (child as unknown as StubNode).n;
        (child as unknown as StubNode).n = NULL;
    } else {
        (parent as unknown as StubElement).$ = other as unknown as StubNode;
    }
}

/** Insert child DOM node to parent DOM node before other child DOM node */
export function prepend_node_ssr(parent: Node, child: Node, other: Node) {
    if ((other as unknown as StubNode).p) {
        (child as unknown as StubNode).p = (other as unknown as StubNode).p;
        (other as unknown as StubNode).p!.n = child as unknown as StubNode;
    } else {
        (parent as unknown as StubElement)._ = child as unknown as StubNode;
    }

    (other as unknown as StubNode).p = child as unknown as StubNode;
    (child as unknown as StubNode).n = other as unknown as StubNode;
}

/** Insert child DOM node to parent DOM node after other child DOM node */
export function append_node_ssr(parent: Node, child: Node, other: Node | undefined = NULL) {
    if (other && (other as unknown as StubNode).n) {
        (child as unknown as StubNode).n = (other as unknown as StubNode).n;
        (other as unknown as StubNode).n!.p = child as unknown as StubNode;
        (other as unknown as StubNode).n = child as unknown as StubNode;
        (child as unknown as StubNode).p = other as unknown as StubNode;
    } else {
        if ((parent as unknown as StubElement).$) {
            (parent as unknown as StubElement).$!.n = child as unknown as StubNode;
            (child as unknown as StubNode).p = (parent as unknown as StubElement).$;
        } else {
            (parent as unknown as StubElement)._ = child as unknown as StubNode;
        }
        (parent as unknown as StubElement).$ = child as unknown as StubNode;
    }
}

/** Remove child DOM node from parent DOM node */
export function remove_node_ssr(parent: Node, child: Node) {
    if ((child as unknown as StubNode).p) {
        (child as unknown as StubNode).p!.n = (child as unknown as StubNode).n;
    } else {
        (parent as unknown as StubElement)._ = (child as unknown as StubNode).n;
    }

    if ((child as unknown as StubNode).n) {
        (child as unknown as StubNode).n!.p = (child as unknown as StubNode).p;
    } else {
        (parent as unknown as StubElement).$ = (child as unknown as StubNode).p;
    }
}

/** Add class to DOM element */
export function add_class_ssr(elm: Element, name: string) {
    (elm as unknown as StubElement).c[name] = true;
}

/** Remove class from DOM element */
export function remove_class_ssr(elm: Element, name: string) {
    delete (elm as unknown as StubElement).c[name];
}

/** Set style property to DOM element */
export function set_style_ssr<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    (elm as unknown as StubElement).s[name as string] = val;
}

/** Remove style property from DOM element */
export function remove_style_ssr<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    delete (elm as unknown as StubElement).s[name as string];
}

/** Set attribute to DOM element */
export function set_attr_ssr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    (elm as unknown as StubElement).a[name] = is_defined(val) ? EMPTY_STRING + val : EMPTY_STRING;
}

/** Remove attribute from DOM element */
export function remove_attr_ssr<A extends keyof DomAttrMap>(elm: Element, name: A, _val: DomAttrMap[A]) {
    delete (elm as unknown as StubElement).a[name];
}
