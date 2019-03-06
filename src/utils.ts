import { DomNode, DomText, DomComment, DomElement, DomSelector, DomClassSet, DomAttrMap, DomStyleMap, DomEventMap, DomEventFn } from './types';

function is_element(node: DomNode): node is DomElement {
    return 'e' in node;
}

function is_text(node: DomNode): node is DomText {
    return 't' in node;
}

function is_comment(node: DomNode): node is DomComment {
    return 'c' in node;
}

function same_element(elm: DomElement, sel: DomSelector): boolean {
    const {x} = elm;
    return x.t == sel.t &&
        (!sel.i || sel.i == x.i) &&
        (!sel.c && !x.c || sel.c && x.c && has_classes(sel.c, x.c)) &&
        (sel.k == x.k) ||
        false;
}

function same_text(txt: DomText, src: string): boolean {
    return txt.t == src;
}

function same_comment(cmt: DomComment, src: string): boolean {
    return cmt.c == src;
}

export function match_element(node: DomNode, sel: DomSelector): node is DomElement {
    return is_element(node) && same_element(node, sel);
}

export function match_text(node: DomNode, txt: string): node is DomText {
    return is_text(node) && same_text(node, txt);
}

export function match_comment(node: DomNode, txt: string): node is DomComment {
    return is_comment(node) && same_comment(node, txt);
}

export function parse_selector(sel: string): DomSelector {
    const id_i = sel.search(/#/);
    const cls_i = sel.search(/\./);
    const res: DomSelector = { t: sel.substring(0, id_i > 0 ? id_i : cls_i > 0 ? cls_i : sel.length) };
    if (id_i > 0) res.i = sel.substring(id_i + 1, cls_i > 0 ? cls_i : sel.length);
    if (cls_i > 0) res.c = parse_classes(sel.substring(cls_i + 1, sel.length));
    return res;
}

export function parse_classes(cls?: string | null): DomClassSet | undefined {
    if (cls) {
        const classes = {} as DomClassSet;
        for (const name of cls.split(/[\.\s]/)) classes[name] = true;
        return classes;
    }
}

function has_classes(req: DomClassSet, all: DomClassSet): boolean {
    for (const name in req) if (!(name in all)) return false;
    return true;
}

export function add_class(elm: Element, name: string) {
    elm.classList.add(name);
}

export function remove_class(elm: Element, name: string) {
    elm.classList.remove(name);
}

export function set_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S, val: DomStyleMap[S]) {
    elm.style.setProperty(name as string, val);
}

export function remove_style<S extends keyof DomStyleMap>(elm: HTMLElement, name: S) {
    elm.style.removeProperty(name as string);
}

export function set_attr<A extends keyof DomAttrMap>(elm: Element, name: A, val: DomAttrMap[A]) {
    elm.setAttribute(name, val as string);
}

export function remove_attr<A extends keyof DomAttrMap>(elm: Element, name: A) {
    elm.removeAttribute(name);
}

export function add_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.addEventListener(name as string, fn as EventListener, false);
}

export function remove_event<E extends keyof DomEventMap>(elm: Element, name: E, fn: DomEventFn<E>) {
    elm.removeEventListener(name as string, fn as EventListener, false);
}
