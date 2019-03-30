/**
 *  @module build
 *  HTML rendering functions
 */

import { DomNode, DomFlags, DomFragment, DomElement } from './types';
import { NULL, is_element, is_doctype, is_text } from './utils';
import { StubNode, StubElement, StubDocType, StubText, StubComment, StubFragment, StubClasses, StubAttrs, StubStyles } from './ssrop';

/** Prepare empty DOM fragment for rendering to */
export function prepare(): DomFragment {
    return {
        f: DomFlags.Empty,
        $: {
            _: NULL,
            $: NULL,
        } as StubFragment as unknown as Element,
        _: [],
    };
}

/** Stringify fragment to HTML */
export function format(elm: DomFragment | DomElement): string {
    return (elm.$ as unknown as StubNode).f ? format_element("", elm.$ as unknown as StubElement) : format_children("", (elm.$ as unknown as StubFragment)._);
}

function format_children(out: string, child: StubNode | undefined): string {
    for (; child; child = child.n) {
        out = format_node(out, child);
    }
    return out;
}

function format_node(out: string, node: StubNode): string {
    return is_element(node as unknown as DomNode) ? format_element(out, node as StubElement) :
        is_doctype(node as unknown as DomNode) ? format_doctype(out, node as StubDocType) :
        out + (is_text(node as unknown as DomNode) ? escape_text((node as StubText).t) :
               `<!--${escape_text((node as StubComment).t)}-->`);
}

function format_doctype(out: string, {d}: StubDocType): string {
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

function format_element(out: string, elm: StubElement): string {
    out += `<${elm.t}`;

    out = format_classes(out, elm.c);
    out = format_attrs(out, elm.a);
    out = format_styles(out, elm.s);

    if (elm._) {
        out += '>';
        if (code_tag.test(elm.t)) {
            for (let node = elm._; node; node = node.n!) {
                if (is_text(node as unknown as DomNode)) {
                    out += escape_code((node as StubText).t);
                }
            }
        } else {
            out = format_children(out, elm._);
        }
        out += `</${elm.t}>`;
    } else {
        out += void_tag.test(elm.t) ? '>' : `></${elm.t}>`;
    }

    return out;
}

function format_classes(out: string, classes: StubClasses): string {
    for (const name in classes) {
        out += ` class="${escape_attr(name)}`;
        let nxt = false;
        for (const name in classes) {
            if (nxt) {
                out += ` ${escape_attr(name)}`
            } else {
                nxt = true;
            }
        }
        out += '"';
        break;
    }
    return out;
}

function format_attrs(out: string, attrs: StubAttrs): string {
    for (const name in attrs) {
        out += ` ${name}="${escape_attr(attrs[name])}"`;
    }
    return out;
}

function format_styles(out: string, styles: StubStyles): string {
    for (const name in styles) {
        out += ` style="${escape_attr(name)}:${escape_attr(styles[name])}`;
        let nxt = false;
        for (const name in styles) {
            if (nxt) {
                out += `;${escape_attr(name)}:${escape_attr(styles[name])}`;
            } else {
                nxt = true;
            }
        }
        out += '"';
        break;
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
function escape_attr(text: string | number): string {
    if (typeof text === "string") {
        if (text.indexOf("\"") === -1 && text.indexOf("&") === -1) {
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
    return text.toString();
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
