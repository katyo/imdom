/** @module parse */

import { DomFlags, DomAttrs, DomStyles, DomNode, DomNodes, DomElement } from './types';
import { EMPTY_STRING, node_selector } from './utils';

const enum NodeType {
    Element = 1,
    Text = 3,
    Comment = 8,
}

/** Parse DOM element into virtual DOM element */
export function parse(node: Element, offset?: number, length?: number): DomElement {
    return { // parse DOM element
        f: DomFlags.Element, // set virtual node type to element (initially virtual element is detached)
        $: node, // set DOM element node
        x: node_selector(node), // set selector
        a: parse_attrs(node.attributes), // initially all attributes treated as mutable
        c: {}, // initially all classes sits in selector
        s: parse_style((node as HTMLElement).style), // initially all styles treated as mutable
        _: parse_children(node.childNodes, offset, length) // parse children nodes
    };
}

/** Parse DOM node(s) into virtual DOM node */
function parse_node(node: Node): DomNode {
    const {nodeType} = node;
    return nodeType == NodeType.Element ? parse(node as Element) : {
        // parse DOM text or comment
        f: nodeType == NodeType.Text ? DomFlags.Text : DomFlags.Comment, // set virtual node type to text
        $: node as Text | Comment, // set DOM text node
        t: node.textContent || EMPTY_STRING, // set text value
    };
}

function parse_children(nodes: NodeListOf<Node>, i: number = 0, n: number = nodes.length - i): DomNodes {
    const children: DomNodes = [];
    n += i;
    for (; i < n; i++) {
        children.push(parse_node(nodes[i]));
    }
    return children;
}

function parse_attrs(node_attrs: NamedNodeMap): DomAttrs {
    const attrs = {} as DomAttrs;
    for (let i = 0; i < node_attrs.length; i++) {
        const attr = node_attrs[i];
        if (attr.name != 'id' && attr.name != 'class' && attr.name != 'style') {
            attrs[attr.name] = {
                v: attr.value,
                t: 0,
            }
        }
    }
    return attrs;
}

function parse_style(style: CSSStyleDeclaration): DomStyles {
    const styles = {} as DomStyles;
    if (style) {
        for (let i = 0; i < style.length; i++) {
            const name = style[i];
            styles[name] = {
                v: style.getPropertyValue(name),
                t: 0,
            };
        }
    }
    return styles;
}
