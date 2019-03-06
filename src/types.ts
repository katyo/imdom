/** Transaction identifier */
export type DomTxnId = number;

/** Set of attributes */
export type DomAttrs = Record<DomAttrName, DomAttr<DomAttrName>>;

/** Map of available attributes */
export type DomAttrMap = Record<DomAttrName, DomAttrVal>;

/** Attribute name */
export type DomAttrName = string;

/** Single attribute */
export interface DomAttr<A extends DomAttrName> {
    /** Attribute value */
    v: DomAttrMap[A];
    /** Transaction identifier */
    t: DomTxnId;
}

/** Attribute value */
export type DomAttrVal = string | number | boolean | undefined | void;

/** Set of styles */
export type DomStyles = Record<DomStyleName, DomStyle<DomStyleVal>>;
//export type DomStyles = { [K in DomStyleName]: DomStyle } & Record<string, DomStyle>;

/** Single style */
export interface DomStyle<S extends keyof DomStyleMap> {
    /** Style value */
    v: DomStyleMap[S];
    /** Transaction identifier */
    t: DomTxnId;
}

/** Map of available styles */
export type DomStyleMap = Record<DomStyleName, DomStyleVal>;

/** Style name */
export type DomStyleName = string;
//export type DomStyleName = Exclude<{ [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends Function ? never : K }[keyof CSSStyleDeclaration], number | 'length' | 'parentRule'>;

/** Style value */
export type DomStyleVal = string;

/** Set of classes */
export type DomClasses = Record<string, DomClass>;

/** Single class */
export type DomClass = DomTxnId;

/** Set of event listeners */
export type DomEvents = { [E in keyof DomEventMap]?: DomEventMap[E] };
//export type DomEvents = { [K in keyof HTMLElementEventMap]?: DomEvent<HTMLElementEventMap[K]> } & { [event: string]: DomEvent<Event> };

/** Single event listener */
export interface DomEvent<E extends keyof DomEventMap> {
    /** Event listener function */
    v: DomEventFn<E>;
    /** Transaction identifier */
    t: number;
}

export type DomEventMap = HTMLElementEventMap & Record<string, Event>;

/** Event listener function */
export interface DomEventFn<E extends keyof DomEventMap> {
    (event: DomEventMap[E]): void;
}

/** List of nodes */
export type DomNodes = DomNode[];

/** Single node */
export type DomNode = DomElement | DomText | DomComment;

/** Single text node */
export interface DomText {
    $: Text;
    t: string;
}

/** Single comment node */
export interface DomComment {
    $: Comment;
    c: string;
}

/** Single evement node */
export interface DomElement {
    /** DOM element */
    $: Element;
    /** Element selector */
    x: DomSelector;
    /** Pluged flag */
    n: boolean;
    /** Mutable attributes */
    a: DomAttrs;
    /** Classes */
    c: DomClasses;
    /** Styles */
    s: DomStyles;
    /** Children nodes */
    _: DomNodes;
}

/** Element selector */
export interface DomSelector {
    /** Tag name */
    t: string;
    /** Identifier (id attribute) */
    i?: string;
    /** Classes (class attribute) */
    c?: DomClassSet;
    /** Key (data-key attribute) */
    k?: string;
}

export type DomClassSet = Record<string, true>;

/** Fragment */
export interface DomFragment {
    /** Parent DOM element */
    $: Element;
    /** Children nodes */
    _: DomNodes;
}
