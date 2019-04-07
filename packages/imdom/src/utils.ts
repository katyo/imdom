/**
 * @module utils
 */

import { DomFlags, DomKey, DomNode, DomText, DomComment, DomDocType, DomDocTypeSpec, DomElement, DomSelector, DomClassSet, DomNameSpace, DomAttrName, DomAttrType } from './types';

/** Undefined value */
export const NULL = void 0;

export { NULL as _ };

/** Empty string constant */
export const EMPTY_STRING = '';

/** Dummy function */
export const NOOP = () => {};

/** Trace function */
export function trace(...args: any[]) {
    console.log(...args);
}

/** Assert function */
export function assert(val: any, msg: string, ...args: any[]) {
    if (!val) {
        console.error(msg, ...args);
        throw new Error(msg);
    }
}

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
        t: sel.substring(0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : sel.length) || 'div',
        i: NULL,
        c: NULL,
        k: NULL,
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
        for (let i = 0; i < lst.length; ) {
            classes[lst[i++]] = true;
        }
        return classes;
    }
}

/** Build classes from set */
export function build_classes(cls: DomClassSet, sep: string = ' ') {
    let str = '';
    for (const name in cls) {
        str += sep + name;
    }
    return str;
}

/** Check when required classes exists in all classes */
function has_classes(req: string[], all: DomClassSet): boolean {
    for (let i = 0; i < req.length; ) {
        if (!all[req[i++]]) {
            return false;
        }
    }
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
export function has_attr<A extends DomAttrName>(elm: Element, name: A): boolean {
    return elm.hasAttribute(name);
}

/** Get attribute from DOM element */
export function get_attr<A extends DomAttrName>(elm: Element, name: A): DomAttrType<A> | null {
    return elm.getAttribute(name) as DomAttrType<A> | null;
}

export function get_attr_str<A extends DomAttrName>(elm: Element, name: A): string | undefined {
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

/** Get real DOM element from virtual */
export function element_of<T extends Element = Element>(elm: DomElement): T {
    return elm.$ as T;
}

/** Get owner document of DOM node */
export function document_of(node: Node): Document {
    return node.ownerDocument!;
}

/** Widely used key codes */
export const enum KeyCode {
    Backspace = 8,
    Tab = 9,
    Enter = 13,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    PauseBreak = 19,
    CapsLock = 20,
    Escape = 27,
    Space = 32,
    PageUp = 33,
    PageDown = 34,
    End = 35,
    Home = 36,

    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40,

    Insert = 45,
    Delete = 46,

    Zero = 48,
    ClosedParen = Zero,
    One = 49,
    ExclamationMark = One,
    Two = 50,
    AtSign = Two,
    Three = 51,
    PoundSign = Three,
    Hash = PoundSign,
    Four = 52,
    DollarSign = Four,
    Five = 53,
    PercentSign = Five,
    Six = 54,
    Caret = Six,
    Hat = Caret,
    Seven = 55,
    Ampersand = Seven,
    Eight = 56,
    Star = Eight,
    Asterik = Star,
    Nine = 57,
    OpenParen = Nine,

    A = 65,
    B = 66,
    C = 67,
    D = 68,
    E = 69,
    F = 70,
    G = 71,
    H = 72,
    I = 73,
    J = 74,
    K = 75,
    L = 76,
    M = 77,
    N = 78,
    O = 79,
    P = 80,
    Q = 81,
    R = 82,
    S = 83,
    T = 84,
    U = 85,
    V = 86,
    W = 87,
    X = 88,
    Y = 89,
    Z = 90,

    LeftWindowKey = 91,
    RightWindowKey = 92,
    SelectKey = 93,

    Numpad0 = 96,
    Numpad1 = 97,
    Numpad2 = 98,
    Numpad3 = 99,
    Numpad4 = 100,
    Numpad5 = 101,
    Numpad6 = 102,
    Numpad7 = 103,
    Numpad8 = 104,
    Numpad9 = 105,

    Multiply = 106,
    Add = 107,
    Subtract = 109,
    DecimalPoint = 110,
    Divide = 111,

    F1 = 112,
    F2 = 113,
    F3 = 114,
    F4 = 115,
    F5 = 116,
    F6 = 117,
    F7 = 118,
    F8 = 119,
    F9 = 120,
    F10 = 121,
    F11 = 122,
    F12 = 123,

    NumLock = 144,
    ScrollLock = 145,

    SemiColon = 186,
    Equals = 187,
    Comma = 188,
    Dash = 189,
    Period = 190,
    UnderScore = Dash,
    PlusSign = Equals,
    ForwardSlash = 191,
    Tilde = 192,
    GraveAccent = Tilde,

    OpenBracket = 219,
    ClosedBracket = 221,
    Quote = 222
}

/** Get input key code */
export function key_code(event: KeyboardEvent): KeyCode {
    return event.keyCode;
}

/** Get input character */
export function key_char(event: KeyboardEvent): string | undefined {
    /*
    const code = event.which == null ? event.keyCode : // IE
        event.which != 0 && event.charCode != 0 ? event.which : // !IE
            0;
    */
    const code = event.charCode != null ? event.charCode : event.keyCode;

    if (code) {
        if (code < 32) return; // special character
        return String.fromCharCode(code); // ordinary character
    }

    // other special characters
}

/** Common modifier keys */
export const enum ModKey {
    Ctrl = 1 << 0,
    Alt = 1 << 1,
    Meta = 1 << 2,
    Shift = 1 << 3,
}

/** Get active modifier keys */
export function key_mods(event: KeyboardEvent): ModKey {
    return (event.ctrlKey ? ModKey.Ctrl : 0) |
        (event.altKey ? ModKey.Alt : 0) |
        (event.metaKey ? ModKey.Meta : 0) |
        (event.shiftKey ? ModKey.Shift : 0);
}

/** Check for active modifier keys */
export function mod_keys(event: KeyboardEvent, mask: ModKey): boolean {
    return ((mask & ModKey.Ctrl) && event.ctrlKey) ||
        ((mask & ModKey.Alt) && event.altKey) ||
        ((mask & ModKey.Meta) && event.metaKey) ||
        ((mask & ModKey.Shift) && event.shiftKey) ||
        false;
}

/** Stop event propagation */
export function stop_event(event: Event) {
    //if (event.stopPropagation) event.stopPropagation();
    //else event.cancelBubble = true;
    event.stopPropagation();
}

/** Prevent default event behavior */
export function prevent_event(event: Event) {
    //if (event.preventDefault) event.preventDefault();
    //else event.returnValue = false;
    event.preventDefault();
}

/** Stop event propagation and prevent default behavior */
export function cancel_event(event: Event) {
    stop_event(event);
    prevent_event(event);
}

