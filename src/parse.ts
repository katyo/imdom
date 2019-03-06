import { DomAttrs, DomStyles, DomFragment, DomNode, DomNodes } from './types';
import { parse_classes } from './utils';

const enum NodeType {
    Element = 1,
    Text = 3,
    Comment = 8,
}

export function parse(node: Node, end: Node = node): DomFragment {
    return {
        $: node.parentNode as Element,
        _: parse_tree(node, end),
    };
}

function parse_tree(node: Node | null, end: Node | null = node): DomNodes {
    const children: DomNodes = [];
    if (node) {
        for (let child = node as Node;
             child != (end as Node).nextSibling;
             child = child.nextSibling as Node) {
            children.push(parse_node(child));
        }
    }
    return children;
}

function parse_node(node: Node): DomNode {
    const {nodeType} = node;
    return nodeType == NodeType.Element ? {
        $: node as Element,
        x: {
            t: (node as Element).tagName,
            i: (node as Element).id,
            c: parse_classes((node as Element).className),
            k: (node as Element).getAttribute('data-key') || void 0,
        },
        n: false,
        a: parse_attrs((node as Element).attributes),
        c: {},
        s: parse_style((node as HTMLElement).style),
        _: parse_tree(node.firstChild, node.lastChild)
    } : nodeType == NodeType.Text ? {
        $: node as Text,
        t: node.textContent || '',
    } : /* nodeType == NodeType.Comment ? */ {
        $: node as Comment,
        c: node.textContent || '',
    };
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
    for (let i = 0; i < style.length; i++) {
        const name = style[i];
        styles[name] = {
            v: style.getPropertyValue(name),
            t: 0,
        };
    }
    return styles;
}
