/**
 *  @module build
 *  HTML rendering functions
 */

import { DomNode, DomFlags, DomFragment, DomElement, DomDocType, DomClassSet, DomClasses, DomAttrs, DomStyles } from './types';
import { NULL, is_defined, is_element, is_doctype, is_text } from './utils';

/** Prepare empty DOM fragment for rendering to */
export function prepare(): DomFragment {
    return {
        $: NULL as unknown as Element,
        f: DomFlags.Empty,
        _: [],
    };
}

/** Stringify fragment to HTML */
export function format(elm: DomFragment | DomElement): string {
    return is_element(elm as DomNode) ? format_element("", elm as DomElement) : format_children("", elm._);
}

function format_children(out: string, children: DomNode[]): string {
    for (let i = 0; i < children.length; ) {
        out = format_node(out, children[i++]);
    }
    return out;
}

function format_node(out: string, node: DomNode): string {
    return is_element(node) ? format_element(out, node) :
        is_doctype(node) ? format_doctype(out, node) :
        out + (is_text(node) ? escape_text(node.t) :
               `<!--${escape_text(node.t)}-->`);
}

function format_doctype(out: string, {d}: DomDocType): string {
    out += `<!DOCTYPE ${d.n}`;
    if (d.p) {
        out += ` PUBLIC "${escape_attr(d.p)}" "${escape_attr(d.s)}">`;
    } else {
        out += `>`;
    }
    return out;
}

/* Void elements regexp generator (elisp)
   You can edit list of properties and re-evaluate expression

   (replace-regexp "\\(void_tag = \\)[^;]*;"
   (concat "\\1/^" (replace-regexp-in-string "\\\\" "" (regexp-opt '(
   "area" "base" "br" "col" "embed" "hr" "img" "input"
   "keygen" "link" "meta" "param" "source" "track" "wbr"
   ))) "$/;"))
*/

const void_tag = /^(?:area|b(?:ase|r)|col|embed|hr|i(?:mg|nput)|keygen|link|meta|param|source|track|wbr)$/;

/* Code elements regexp generator (elisp)
   You can edit list of properties and re-evaluate expression

   (replace-regexp "\\(code_tag = \\)[^;]*;"
   (concat "\\1/^" (replace-regexp-in-string "\\\\" "" (regexp-opt '(
   "script" "style"
   ))) "$/;"))
*/

const code_tag = /^(?:s(?:cript|tyle))$/;

function format_element(out: string, elm: DomElement): string {
    const sel = elm.x;
    const tag = sel.t;

    out += `<${tag}`;

    if (sel.i) {
        out += ` id="${escape_attr(sel.i)}"`;
    }
    out = format_classes(out, sel.c, elm.c);
    if (sel.k) {
        out += ` data-key="${format_attr(sel.k)}"`;
    }
    out = format_attrs(out, elm.a);
    out = format_styles(out, elm.s);

    if (elm._.length) {
        out += '>';
        const children = elm._;
        if (code_tag.test(tag)) {
            for (let i = 0; i < children.length; ) {
                const node = children[i++];
                if (is_text(node)) {
                    out += escape_code(node.t);
                }
            }
        } else {
            out = format_children(out, children);
        }
        out += `</${tag}>`;
    } else {
        out += void_tag.test(tag) ? '>' : `></${tag}>`;
    }

    return out;
}

function format_classes(out: string, class_set: DomClassSet | undefined, classes: DomClasses): string {
    let once = false;
    if (class_set) {
        for (const name in class_set) {
            if (class_set[name]) {
                if (once) {
                    out += ` ${escape_attr(name)}`
                } else {
                    once = true;
                    out += ` class="${escape_attr(name)}`;
                }
            }
        }
    }
    for (const name in classes) {
        if (classes[name]) {
            if (once) {
                out += ` ${escape_attr(name)}`
            } else {
                once = true;
                out += ` class="${escape_attr(name)}`;
            }
        }
    }
    if (once) {
        out += '"';
    }
    return out;
}

function format_attrs(out: string, attrs: DomAttrs): string {
    for (const name in attrs) {
        const attr = attrs[name];
        if (attr) {
            if (is_defined(attr.v)) {
                out += ` ${name}="${format_attr(attr.v)}"`;
            } else {
                out += ` ${name}`;
            }
        }
    }
    return out;
}

function format_attr(val: string | number | boolean): string {
    return typeof val == 'string' ? escape_attr(val) : val.toString();
}

function format_styles(out: string, styles: DomStyles): string {
    let once = false;
    for (const name in styles) {
        const style = styles[name];
        if (style) {
            if (once) {
                out += `;${escape_attr(name)}:${escape_attr(style.v)}`;
            } else {
                once = true;
                out += ` style="${escape_attr(name)}:${escape_attr(style.v)}`;
            }
        }
    }
    if (once) {
        out += '"';
    }
    return out;
}

/**
 * Escapes HTML text.
 * Source: https://github.com/localvoid/ivi
 *
 * {@link https://www.w3.org/TR/html5/syntax.html#data-state}
 * {@link https://www.w3.org/TR/html5/syntax.html#rcdata-state}
 *
 * @param text - Text
 * @returns Escaped text
 */
export function escape_text(text: string | number): string {
    if (typeof text === "string") {
        if (text.indexOf("&") === -1 && text.indexOf("<") === -1) {
            return text;
        }

        let result = text;
        let start = 0;
        let i = 0;
        for (; i < text.length; ++i) {
            let escape: string;
            switch (text.charCodeAt(i)) {
                case 38: // &
                    escape = "&amp;";
                    break;
                case 60: // <
                    escape = "&lt;";
                    break;
                default:
                    continue;
            }
            if (i > start) {
                escape = text.slice(start, i) + escape;
            }
            result = (start > 0) ? result + escape : escape;
            start = i + 1;
        }
        if (i !== start) {
            return result + text.slice(start, i);
        }
        return result;
    }
    return text.toString();
}

/**
 * Escapes HTML attribute values.
 * Source: https://github.com/localvoid/ivi
 *
 * {@link https://www.w3.org/TR/html5/syntax.html#attribute-value-(double-quoted)-state}
 *
 * @param text - Attribute value
 * @returns Escaped attribute value
 */
function escape_attr(text: string): string {
    if (text.indexOf("\"") == -1 && text.indexOf("&") == -1) {
        return text;
    }

    let result = text;
    let start = 0;
    let i = 0;
    for (; i < text.length; ++i) {
        let escape: string;
        switch (text.charCodeAt(i)) {
            case 34: // "
                escape = "&quot;";
                break;
            case 38: // &
                escape = "&amp;";
                break;
            default:
                continue;
        }
        if (i > start) {
            escape = text.slice(start, i) + escape;
        }
        result = (start > 0) ? result + escape : escape;
        start = i + 1;
    }
    if (i !== start) {
        return result + text.slice(start, i);
    }
    return result;
}

/**
 * Escapes javascript code.
 * Source: https://github.com/localvoid/ivi
 *
 * @param text - Text.
 * @returns Escaped text.
 */
function escape_code(text: string): string {
    let result = text;
    let escape: string;
    let start = 0;
    let i = 0;
    for (; i < text.length; ++i) {
        switch (text.charCodeAt(i)) {
            case 47: // /
                escape = "\\u002F";
                break;
            case 60: // <
                escape = "\\u003C";
                break;
            case 62: // >
                escape = "\\u003E";
                break;
            case 8232:
                escape = "\\u2028";
                break;
            case 8233:
                escape = "\\u2029";
                break;
            default:
                continue;
        }
        if (i > start) {
            escape = text.slice(start, i) + escape;
        }
        result = (start > 0) ? result + escape : escape;
        start = i + 1;
    }
    if (start !== 0 && i !== start) {
        return result + text.slice(start, i);
    }
    return result;
}
