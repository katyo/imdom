/**
 * @module parse
 */

import { DomFlags, DomNameSpace, DomAttrs, DomStyles, DomNode, DomNodes, DomElement, DomDocType, DomFragment } from './types';
import { NodeType, EMPTY_STRING, parse_ns_uri, get_attr_str, parse_classes } from './utils';

/** Parse DOM element into virtual DOM element */
export function parse(node: Element): DomElement;
export function parse(node: Document): DomFragment;
export function parse(node: Element | Document, offset: number, length: number): DomFragment;
export function parse(node: Element | Document, offset?: number, length?: number): DomElement | DomFragment {
    return node.nodeType == NodeType.Element && !offset && !length ? parse_element(node as Element) : { // parse DOM fragment
        $flags: DomFlags.Empty,
        $node: node, // set owner DOM node
        $nodes: parse_children(node.childNodes, offset, length) // parse children nodes
    } as DomFragment;
}

function parse_element(node: Element): DomElement {
    return { // parse DOM element
        $flags: DomFlags.Element, // set virtual node type to element (initially virtual element is detached)
        $node: node, // set DOM element node
        $ns: parse_ns_uri(node.namespaceURI) as DomNameSpace, // name space
        $tag: node.tagName.toLowerCase(), // tag name
        $id: get_attr_str(node, 'id'), // identifier
        $class: parse_classes(get_attr_str(node, 'class')), // classes
        $key: get_attr_str(node, 'data-key'), // key
        $attrs: parse_attrs((node as Element).attributes), // initially all attributes treated as mutable
        $classes: {}, // initially all classes sits in selector
        $style: parse_style((node as Element).getAttribute('style')), // initially all styles treated as mutable
        $nodes: parse_children(node.childNodes) // parse children nodes
    };
}

/** Parse DOM node(s) into virtual DOM node */
function parse_node(node: Node): DomNode {
    const {nodeType} = node;
    return nodeType == NodeType.Element ? parse_element(node as Element) :
        nodeType == NodeType.DocType ? {
            // parse DOM document type node
            $flags: DomFlags.DocType,
            $node: node as DocumentType,
            $spec: {
                $name: (node as DocumentType).name,
                $pub_id: (node as DocumentType).publicId,
                $sys_id: (node as DocumentType).systemId,
            },
        } as DomDocType : {
            // parse DOM text or comment nodes
            $flags: nodeType == NodeType.Text ? DomFlags.Text : DomFlags.Comment, // set virtual node type to text
            $node: node as Text | Comment, // set DOM text node
            $text: node.textContent || EMPTY_STRING, // set text value
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

const SPECIAL_ATTR_RE = /id|class|style|data\-key/;

function parse_attrs(node_attrs: NamedNodeMap): DomAttrs {
    const attrs = {} as DomAttrs;
    for (let i = 0; i < node_attrs.length; i++) {
        const attr = node_attrs[i];
        if (!SPECIAL_ATTR_RE.test(attr.name)) {
            attrs[attr.name] = {
                $value: attr.value,
                $txnid: 0,
            }
        }
    }
    return attrs;
}

const cssPropRE = /\s*([^:\s]+)\s*:\s*([^;\s]+)\s*;?/g;

function parse_style(style: string | null): DomStyles {
    const styles = {} as DomStyles;
    if (style) {
        for (;;) {
            const m = cssPropRE.exec(style);
            if (m) {
                styles[m[1]] = {
                    $value: m[2],
                    $txnid: 0,
                };
            } else {
                break;
            }
        }
    }
    return styles;
}
