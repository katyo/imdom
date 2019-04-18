import { ok, strictEqual as se, deepStrictEqual as dse } from 'assert';
import { NULL as _, DomKey, DomSelector, DomClassSet, DomElement, DomNameSpace, DomText, parse, DomFlags, DomTxnId } from '../src/index';

function mksel($ns: DomNameSpace, $tag: string, $id?: string, $class?: DomClassSet, $key?: DomKey): DomSelector {
    return { $ns, $tag, $id, $class, $key };
}

function selof({ $ns, $tag, $id, $class, $key }: DomElement): DomSelector {
    return { $ns, $tag, $id, $class, $key };
}

function mkval<T>($value: T, $txnid: DomTxnId = 0) {
    return { $value, $txnid };
}

describe('parse', () => {
    describe('fragments', () => {
        it('standalone node', () => {
            const elm = document.createElement('div');
            const vdom = parse(elm);

            ok(vdom);
            ok(vdom.$nodes);
            se(vdom.$nodes.length, 0);

            se(vdom.$node, elm);
            dse(selof(vdom), mksel(DomNameSpace.XHTML, 'div'));
            dse(vdom.$attrs, {});
            dse(vdom.$style, {});
            dse(vdom.$classes, {});
            dse(vdom.$nodes, []);
        });

        it('two child nodes', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<span></span><p></p>';
            const vdom = parse(elm);

            se(vdom.$node, elm);
            se(vdom.$nodes.length, 2);

            const n1 = vdom.$nodes[0] as DomElement;
            const n2 = vdom.$nodes[1] as DomElement;

            se(n1.$node, elm.firstChild);
            se(n2.$node, elm.lastChild);
            dse(selof(n1), mksel(DomNameSpace.XHTML, 'span'));
            dse(selof(n2), mksel(DomNameSpace.XHTML, 'p'));
            se(n1.$flags, DomFlags.Element);
            se(n2.$flags, DomFlags.Element);
            dse(n1.$attrs, {});
            dse(n1.$style, {});
            dse(n1.$classes, {});
            dse(n1.$nodes, []);
            dse(n2.$nodes, []);
        });

        it('two child nodes with text contents', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<p>...</p><p></p>';
            const elm1 = elm.children[0];
            const elm2 = elm.children[1];
            const vdom = parse(elm);

            se(vdom.$node, elm);
            se(vdom.$nodes.length, 2);
            const n1 = vdom.$nodes[0] as DomElement;
            const n2 = vdom.$nodes[1] as DomElement;
            se(n1.$node, elm1);
            se(n1.$nodes.length, 1);
            se((n1.$nodes[0] as DomText).$text, '...');
            se(n2.$node, elm2);
            se(n2.$nodes.length, 0);
        });

        it('three child nodes with offset', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<div></div><span></span><p></p><img></img><blockquote></blockquote><span></span>';
            const vdom = parse(elm, 2, 3);

            se(vdom.$node, elm);
            se(vdom.$nodes.length, 3);

            const n1 = vdom.$nodes[0] as DomElement;
            const n2 = vdom.$nodes[1] as DomElement;
            const n3 = vdom.$nodes[2] as DomElement;

            se(n1.$node, elm.children[2]);
            se(n2.$node, elm.children[3]);
            se(n3.$node, elm.children[4]);
            dse(selof(n1), mksel(DomNameSpace.XHTML, 'p'));
            dse(selof(n2), mksel(DomNameSpace.XHTML, 'img'));
            dse(selof(n3), mksel(DomNameSpace.XHTML, 'blockquote'));
            se(n1.$flags, DomFlags.Element);
            se(n2.$flags, DomFlags.Element);
            se(n3.$flags, DomFlags.Element);
            dse(n1.$attrs, {});
            dse(n1.$style, {});
            dse(n1.$classes, {});
            dse(n1.$nodes, []);
            dse(n2.$nodes, []);
            dse(n3.$nodes, []);
        });
    });

    describe('selectors', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<span id="unique"></span><p class="paragraph"></p><a class="menu active"></a><div id="page" class="main" data-key="some"></div>';
        const vdom = parse(elm);

        const n1 = vdom.$nodes[0] as DomElement;
        const n2 = vdom.$nodes[1] as DomElement;
        const n3 = vdom.$nodes[2] as DomElement;
        const n4 = vdom.$nodes[3] as DomElement;

        it('with id', () => { dse(selof(n1), mksel(DomNameSpace.XHTML, 'span', 'unique')); });
        it('with class', () => { dse(selof(n2), mksel(DomNameSpace.XHTML, 'p', _, {paragraph: true})); });
        it('with two classes', () => { dse(selof(n3), mksel(DomNameSpace.XHTML, 'a', _, {menu: true, active: true})); });
        it('with id, class and key', () => { dse(selof(n4), mksel(DomNameSpace.XHTML, 'div', 'page', {main: true}, 'some')); });
    });

    describe('attributes', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<input type="text" value="" disabled><input type="checkbox" checked>';
        const vdom = parse(elm);

        const n1 = vdom.$nodes[0] as DomElement;
        const n2 = vdom.$nodes[1] as DomElement;

        it('enumeration', () => {
            dse(Object.keys(n1.$attrs).sort(), ['disabled', 'type', 'value']);
            dse(Object.keys(n2.$attrs).sort(), ['checked', 'type']);
        });

        it('strings', () => {
            dse(n1.$attrs.type, mkval('text'));
            dse(n1.$attrs.value, mkval(''));
            dse(n2.$attrs.type, mkval('checkbox'));
        });

        it('booleans', () => {
            dse(n1.$attrs.disabled, mkval(''));
            dse(n2.$attrs.checked, mkval(''));
        });
    });

    describe('styles', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<div style="left: 0; top: 15%; margin-right: -11pt; padding-bottom: 22px;"></div><span style="display:none"></span><div style="border-radius :4px;background:#f0f"></div>';
        const vdom = parse(elm);

        const n1 = vdom.$nodes[0] as DomElement;
        const n2 = vdom.$nodes[1] as DomElement;
        const n3 = vdom.$nodes[2] as DomElement;

        it('enumeration', () => {
            dse(Object.keys(n1.$style), ['left', 'top', 'margin-right', 'padding-bottom']);
            dse(Object.keys(n2.$style), ['display']);
            dse(Object.keys(n3.$style), ['border-radius', 'background']);
        });

        it('values', () => {
            dse(n1.$style, {
                left: mkval('0'),
                top: mkval('15%'),
                'margin-right': mkval('-11pt'),
                'padding-bottom': mkval('22px'),
            });

            dse(n2.$style, { display: mkval('none') });

            dse(n3.$style, {
                'border-radius': mkval('4px'),
                'background': mkval('#f0f'),
            });
        });
    });
});
