/**
 * @module types
 */

/** List of nodes */
export type DomNodes = DomNode[];

/** Single node */
export type DomNode = DomElement | DomText | DomComment | DomDocType;

/** Virtual node flags */
export const enum DomFlags {
    /** Empty flags */
    Empty = 0,

    /** Text node */
    Text = 1 << 0,
    /** Comment node */
    Comment = 1 << 1,
    /** Document type node */
    DocType = 1 << 2,
    /** Element node */
    Element = 1 << 3,

    /** Node is attached */
    Attached = 1 << 6,
    /** Node marked to remove */
    Removing = 1 << 7,
}

/** Basic node fields */
export interface DomBase<T> {
    /** Node flags */
    f: DomFlags;
    /** DOM node */
    $: T;
}

/** Single text node */
export interface DomText extends DomBase<Text> {
    /** Text content */
    t: string;
}

/** Single comment node */
export interface DomComment extends DomBase<Comment> {
    /** Text content */
    t: string;
}

/** Single document type */
export interface DomDocType extends DomBase<DocumentType> {
    d: DomDocTypeSpec;
}

/** Document type specifiers */
export interface DomDocTypeSpec {
    /** Qualified name */
    n: string;
    /** Public id */
    p: string;
    /** System id */
    s: string;
}

/** Single element node */
export interface DomElement extends DomBase<Element> {
    /** Element selector */
    x: DomSelector;
    /** Mutable attributes */
    a: DomAttrs;
    /** Classes */
    c: DomClasses;
    /** Styles */
    s: DomStyles;
    /** Children nodes */
    _: DomNodes;
}

/** Sequence of nodes */
export interface DomFragment extends DomBase<Element> {
    /** Children nodes */
    _: DomNodes;
}

/** Element selector */
export interface DomSelector {
    /**
       Full element selector

       Include: tag name, identifier, selector classes.
       Exclude: key
    */
    //s: string;

    /**
       Element name space
    */
    n: DomNameSpace,

    /**
       Element tag name

       The name of tag in lower case.
    */
    t: string;

    /**
       Element identifier

       The value of attribute `id`.
    */
    i: string | undefined;

    /**
       Selector-specific classes

       Some part of value of attribute `class`.
    */
    c: DomClassSet | undefined;

    /**
       Key

       The unique key of element.

       This value stored in `data-key` attribute.
    */
    k: DomKey | undefined;
}

/** Key type */
export type DomKey = string | number;

/** Namespaces */
export const enum DomNameSpace {
    XHTML,
    SVG,
    XLINK,
    XML,
}

/** Set of classes in selector */
export type DomClassSet = Record<string, boolean>;

/** Transaction identifier */
export type DomTxnId = number;

/** Set of attributes */
export type DomAttrs = { [A in DomAttrName]?: DomAttr<A> };

/** Map of available attributes */
export interface DomAttrMap {
		accept: string;
		'accept-charset': string;
		accesskey: string;
		action: string;
    allow: string;
		allowfullscreen: boolean;
		allowtransparency: boolean;
		alt: string;
		async: boolean;
		autocomplete: string;
		autocorrect: string;
		autofocus: boolean;
		autoplay: boolean;
		capture: boolean;
		challenge: string;
    charset: string;
		checked: boolean;
    cite: string;
		//class: string;
    code: string;
    codebase: string;
    cols: number;
		colspan: number;
		content: string;
		contenteditable: boolean;
		contextmenu: string;
		controls: boolean;
		controlslist: string;
		coords: string;
		crossorigin: string;
		data: string;
		datetime: string;
		default: boolean;
		defer: boolean;
		dir: string;
		disabled: boolean;
		download: boolean;
		draggable: boolean;
    dropzone: boolean;
		enctype?: string;
    for: string;
		form: string;
		formaction: string;
		headers: string;
		hidden: boolean;
		high: number;
		href: string;
		hreflang: string;
		'http-equiv': string;
		icon: string;
		//id: string;
		inputmode: string;
		integrity: string;
		is: string;
    ismap: boolean;
    itemprop: string;
		keyparams: string;
		keytype: string;
		kind: string;
		label: string;
		lang: string;
		list: string;
		loop: boolean;
		low: number;
		manifest: string;
		max: number | string;
		maxlength: number;
    minlength: number;
		media: string;
		mediagroup: string;
		method: string;
		min: number | string;
		multiple: boolean;
		muted: boolean;
		name: string;
		novalidate: boolean;
		open: boolean;
		optimum: number;
		pattern: string;
    ping: string;
		placeholder: string;
		playsinline: boolean;
		poster: string;
		preload: string;
		radiogroup: string;
		readonly: boolean;
    referrerpolicy: string;
		rel: string;
		required: boolean;
    reversed: boolean;
		role: string;
		rows: number;
		rowspan: number;
		sandbox: string;
		scope: string;
		scoped: boolean;
		scrolling: string;
		seamless: boolean;
		selected: boolean;
		shape: string;
		size: number;
		sizes: string;
		slot: string;
		span: number;
		spellcheck: boolean;
		src: string;
		srcset: string;
		srcdoc: string;
		srclang: string;
		start: number;
		step: number | string;
		//style: any;
		summary: string;
		tabindex: number;
		target: string;
		title: string;
    translate: string;
		type: string;
		usemap: string;
		value: string | string[] | number;
		wmode: string;
		wrap: string;
}

/** Attribute name */
export type DomAttrName = keyof DomAttrMap | string;

/** Boolean attribute name */
export type DomAttrNameBool = { [A in keyof DomAttrMap]: DomAttrMap[A] extends boolean ? A : never }[keyof DomAttrMap];

/** Single attribute */
export interface DomAttr<A extends DomAttrName> {
    /** Attribute value */
    v: DomAttrType<A>;
    /** Transaction identifier */
    t: DomTxnId;
}

/** Attribute value type */
export type DomAttrType<A extends DomAttrName> =
    A extends keyof DomAttrMap ?
    DomAttrMap[A] extends boolean ?
    undefined : DomAttrMap[A] : DomAttrVal;

/** Generic attribute value */
export type DomAttrVal = string | number | undefined;

/** Attribute assignment function */
export interface DomAttrFn {
    <A extends DomAttrNameBool>(name: A): void;
    <A extends DomAttrName>(name: A, val: DomAttrType<A>): void;
}

/** Set of styles */
export type DomStyles = Record<DomStyleName, DomStyle<DomStyleVal> | undefined>;
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
export type DomClasses = Record<string, DomClass | undefined>;

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
