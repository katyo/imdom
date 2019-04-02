import { ok, strictEqual as se, deepStrictEqual as dse } from 'assert';
import { NULL as _, DomElement, DomNameSpace, DomText, parse, DomFlags } from '../src/index';

describe('parse', () => {
    describe('fragments', () => {
        it('standalone node', () => {
            const elm = document.createElement('div');
            const vdom = parse(elm);

            ok(vdom);
            ok(vdom._);
            se(vdom._.length, 0);

            se(vdom.$, elm);
            dse(vdom.x, {n: DomNameSpace.XHTML, t: 'div', i: _, c: _, k: _});
            dse(vdom.a, {});
            dse(vdom.s, {});
            dse(vdom.c, {});
            dse(vdom._, []);
        });

        it('two child nodes', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<span></span><p></p>';
            const vdom = parse(elm);

            se(vdom.$, elm);
            se(vdom._.length, 2);

            const n1 = vdom._[0] as DomElement;
            const n2 = vdom._[1] as DomElement;

            se(n1.$, elm.firstChild);
            se(n2.$, elm.lastChild);
            dse(n1.x, {n: DomNameSpace.XHTML, t: 'span', i: _, c: _, k: _});
            dse(n2.x, {n: DomNameSpace.XHTML, t: 'p', i: _, c: _, k: _});
            se(n1.f, DomFlags.Element);
            se(n2.f, DomFlags.Element);
            dse(n1.a, {});
            dse(n1.s, {});
            dse(n1.c, {});
            dse(n1._, []);
            dse(n2._, []);
        });

        it('two child nodes with text contents', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<p>...</p><p></p>';
            const elm1 = elm.children[0];
            const elm2 = elm.children[1];
            const vdom = parse(elm);

            se(vdom.$, elm);
            se(vdom._.length, 2);
            const n1 = vdom._[0] as DomElement;
            const n2 = vdom._[1] as DomElement;
            se(n1.$, elm1);
            se(n1._.length, 1);
            se((n1._[0] as DomText).t, '...');
            se(n2.$, elm2);
            se(n2._.length, 0);
        });

        it('three child nodes with offset', () => {
            const elm = document.createElement('div');
            elm.innerHTML = '<div></div><span></span><p></p><img></img><blockquote></blockquote><span></span>';
            const vdom = parse(elm, 2, 3);

            se(vdom.$, elm);
            se(vdom._.length, 3);

            const n1 = vdom._[0] as DomElement;
            const n2 = vdom._[1] as DomElement;
            const n3 = vdom._[2] as DomElement;

            se(n1.$, elm.children[2]);
            se(n2.$, elm.children[3]);
            se(n3.$, elm.children[4]);
            dse(n1.x, {n: DomNameSpace.XHTML, t: 'p', i: _, c: _, k: _});
            dse(n2.x, {n: DomNameSpace.XHTML, t: 'img', i: _, c: _, k: _});
            dse(n3.x, {n: DomNameSpace.XHTML, t: 'blockquote', i: _, c: _, k: _});
            se(n1.f, DomFlags.Element);
            se(n2.f, DomFlags.Element);
            se(n3.f, DomFlags.Element);
            dse(n1.a, {});
            dse(n1.s, {});
            dse(n1.c, {});
            dse(n1._, []);
            dse(n2._, []);
            dse(n3._, []);
        });
    });

    describe('selectors', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<span id="unique"></span><p class="paragraph"></p><a class="menu active"></a><div id="page" class="main" data-key="some"></div>';
        const vdom = parse(elm);

        const n1 = vdom._[0] as DomElement;
        const n2 = vdom._[1] as DomElement;
        const n3 = vdom._[2] as DomElement;
        const n4 = vdom._[3] as DomElement;

        it('with id', () => { dse(n1.x, {n: DomNameSpace.XHTML, t: 'span', i: 'unique', c: _, k: _}); });
        it('with class', () => { dse(n2.x, {n: DomNameSpace.XHTML, t: 'p', i: _, c: {paragraph: true}, k: _}); });
        it('with two classes', () => { dse(n3.x, {n: DomNameSpace.XHTML, t: 'a', i: _, c: {menu: true, active: true}, k: _}); });
        it('with id, class and key', () => { dse(n4.x, {n: DomNameSpace.XHTML, t: 'div', i: 'page', c: {main: true}, k: 'some'}); });
    });

    describe('attributes', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<input type="text" value="" disabled><input type="checkbox" checked>';
        const vdom = parse(elm);

        const n1 = vdom._[0] as DomElement;
        const n2 = vdom._[1] as DomElement;

        it('enumeration', () => {
            dse(Object.keys(n1.a).sort(), ['disabled', 'type', 'value']);
            dse(Object.keys(n2.a).sort(), ['checked', 'type']);
        });

        it('strings', () => {
            dse(n1.a.type, { v: 'text', t: 0 });
            dse(n1.a.value, { v: '', t: 0 });
            dse(n2.a.type, { v: 'checkbox', t: 0 });
        });

        it('booleans', () => {
            dse(n1.a.disabled, { v: '', t: 0 });
            dse(n2.a.checked, { v: '', t: 0 });
        });
    });

    describe('styles', () => {
        const elm = document.createElement('div');
        elm.innerHTML = '<div style="left: 0; top: 15%; margin-right: -11pt; padding-bottom: 22px;"></div><span style="display:none"></span><div style="border-radius :4px;background:#f0f"></div>';
        const vdom = parse(elm);

        const n1 = vdom._[0] as DomElement;
        const n2 = vdom._[1] as DomElement;
        const n3 = vdom._[2] as DomElement;

        it('enumeration', () => {
            dse(Object.keys(n1.s), ['left', 'top', 'margin-right', 'padding-bottom']);
            dse(Object.keys(n2.s), ['display']);
            dse(Object.keys(n3.s), ['border-radius', 'background']);
        });

        it('values', () => {
            dse(n1.s, {
                left: { v: '0', t: 0 },
                top: { v: '15%', t: 0 },
                'margin-right': { v: '-11pt', t: 0 },
                'padding-bottom': { v: '22px', t: 0 },
            });

            dse(n2.s, { display: { v: 'none', t: 0 } });

            dse(n3.s, {
                'border-radius': { v: '4px', t: 0 },
                'background': { v: '#f0f', t: 0 },
            });
        });
    });
});
