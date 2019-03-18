import { ok, strictEqual as se, notStrictEqual as nse } from 'assert';
import { EMPTY_VALUE as _, DomElement, DomText, DomComment, parse, patch, end, tag, text, comment, class_ } from '../src/index';

describe('patch', () => {
    let elm: Element;
    let vdom: DomElement;
    
    beforeEach(() => {
        elm = document.createElement('div');
        vdom = parse(elm);
    });
    
    describe('basic', () => {
        it('reuse single html element', () => {
            elm.innerHTML = '<div></div>';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            tag('div');
            end();
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomElement;
            se(n1.$, e1);
        });

        it('reuse single text node with same text', () => {
            elm.innerHTML = "text";
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            text('text');
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomText;
            se(n1.$, e1);
        });

        it('reuse single text node with new text', () => {
            elm.innerHTML = 'text';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            text('str');
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomText;
            se(n1.$, e1);
            se(n1.t, 'str');
        });
        
        it('replace single html element by html element', () => {
            elm.innerHTML = '<div></div>';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            tag('span');
            end();
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomElement;
            nse(n1.$, e1);
            se(n1.$.tagName, 'SPAN');
        });
        
        it('replace single html element by text node', () => {
            elm.innerHTML = '<div></div>';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            text('text');
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomText;
            nse(n1.$, e1);
            se(n1.$.textContent, 'text');
        });

        it('replace single text node by html element', () => {
            elm.innerHTML = 'text';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            tag('div');
            end();
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomElement;
            nse(n1.$, e1);
            se(n1.$.tagName, 'DIV');
        });

        it('replace single text node by comment node', () => {
            elm.innerHTML = 'text';
            const e1 = elm.firstChild;
            vdom = parse(elm);
            patch(vdom);
            comment('comment');
            end();
            se(vdom._.length, 1);
            const n1 = vdom._[0] as DomComment;
            nse(n1.$, e1);
            se(n1.$.textContent, 'comment');
        });

        it('update content of one node and replace another node', () => {
            elm.innerHTML = '<p id="main">...</p><p class="info"></p>';
            const elm1 = elm.childNodes[0];
            const elm2 = elm.childNodes[1];
            vdom = parse(elm);
            patch(vdom);
            tag('p#main');
            text('main text');
            end();
            tag('p.desc');
            text('description');
            end();
            end();
            se(vdom._.length, 2);
            const n1 = vdom._[0] as DomElement;
            const n2 = vdom._[1] as DomElement;
            se(n1.$, elm1);
            nse(n2.$, elm2);
            se(n1._.length, 1);
            se(n2._.length, 1);
            se(n1.$.childNodes.length, 1);
            se(n2.$.childNodes.length, 1);
            se(n1.$.childNodes[0].textContent, 'main text');
            se(n2.$.childNodes[0].textContent, 'description');
        });
    });

    describe('snabbdom', () => {
        describe('created element', () => {
            it('has tag', () => {
                patch(vdom);
                tag('div');
                end();
                end();
                const n1 = vdom.$.firstChild as Element;
                se(n1.tagName, 'DIV');
            });
            it('has different tag and id', () => {
                const elm1 = document.createElement('div');
                elm.appendChild(elm1);
                vdom = parse(elm);
                patch(vdom);
                tag('span#id');
                end();
                end();
                const n1 = elm.firstChild as Element;
                ok(n1);
                se(n1.tagName, 'SPAN');
                se(n1.id, 'id');
            });
            it('has id', () => {
                patch(vdom);
                tag('div#unique');
                end();
                end();
                const n1 = elm.firstChild as Element;
                ok(n1);
                se(n1.id, 'unique');
            });
            /*it('has correct namespace', () => {
                var SVGNamespace = 'http://www.w3.org/2000/svg';
                var XHTMLNamespace = 'http://www.w3.org/1999/xhtml';

                elm = patch(vnode0, h('div', [h('div', {ns: SVGNamespace})])).elm;
                assert.equal(elm.firstChild.namespaceURI, SVGNamespace);

                // verify that svg tag automatically gets svg namespace
                elm = patch(vnode0, h('svg', [
                    h('foreignObject', [
                        h('div', ['I am HTML embedded in SVG'])
                    ])
                ])).elm;
                assert.equal(elm.namespaceURI, SVGNamespace);
                assert.equal(elm.firstChild.namespaceURI, SVGNamespace);
                assert.equal(elm.firstChild.firstChild.namespaceURI, XHTMLNamespace);

                // verify that svg tag with extra selectors gets svg namespace
                elm = patch(vnode0, h('svg#some-id')).elm;
                assert.equal(elm.namespaceURI, SVGNamespace);

                // verify that non-svg tag patchning with 'svg' does NOT get namespace
                elm = patch(vnode0, h('svg-custom-el')).elm;
                assert.notEqual(elm.namespaceURI, SVGNamespace);
            });*/
            it('receives classes in selector', () => {
                patch(vdom);
                tag('i.am.a.class');
                end();
                end();
                const n1 = elm.firstChild as Element;
                ok(n1);
                ok(n1.classList.contains('am'));
                ok(n1.classList.contains('a'));
                ok(n1.classList.contains('class'));
            });
            it('receives classes in class property', () => {
                patch(vdom);
                tag('i');
                class_('am');
                class_('a');
                class_('class');
                end();
                end();
                const n1 = elm.firstChild as Element;
                ok(n1.classList.contains('am'));
                ok(n1.classList.contains('a'));
                ok(n1.classList.contains('class'));
                ok(!n1.classList.contains('not'));
            });
            /*
            it('receives classes in selector when namespaced', () => {
                elm = patch(vnode0,
                            h('svg', [
                                h('g.am.a.class.too')
                            ])
                           ).elm;
                assert(elm.firstChild.classList.contains('am'));
                assert(elm.firstChild.classList.contains('a'));
                assert(elm.firstChild.classList.contains('class'));
            });
            it('receives classes in class property when namespaced', () => {
                elm = patch(vnode0,
                            h('svg', [
                                h('g', {class: {am: true, a: true, class: true, not: false, too: true}})
                            ])
                           ).elm;
                assert(elm.firstChild.classList.contains('am'));
                assert(elm.firstChild.classList.contains('a'));
                assert(elm.firstChild.classList.contains('class'));
                assert(!elm.firstChild.classList.contains('not'));
            });
            it('handles classes from both selector and property', () => {
                elm = patch(vnode0, h('div', [h('i.has', {class: {classes: true}})])).elm;
                assert(elm.firstChild.classList.contains('has'));
                assert(elm.firstChild.classList.contains('classes'));
            });
            it('can create elements with text content', () => {
                elm = patch(vnode0, h('div', ['I am a string'])).elm;
                assert.equal(elm.innerHTML, 'I am a string');
            });
            it('can create elements with span and text content', () => {
                elm = patch(vnode0, h('a', [h('span'), 'I am a string'])).elm;
                assert.equal(elm.childNodes[0].tagName, 'SPAN');
                assert.equal(elm.childNodes[1].textContent, 'I am a string');
            });
            it('can create elements with props', () => {
                elm = patch(vnode0, h('a', {props: {src: 'http://localhost/'}})).elm;
                assert.equal(elm.src, 'http://localhost/');
            });
            it('can create an element created inside an iframe', done => {
                // Only run if srcdoc is supported.
                var frame = document.createElement('iframe');
                if (typeof frame.srcdoc !== 'undefined') {
                    frame.srcdoc = "<div>Thing 1</div>";
                    frame.onload = () => {
                        patch(read(frame.contentDocument.body.querySelector('div')), h('div', 'Thing 2'));
                        assert.equal(frame.contentDocument.body.querySelector('div').textContent, 'Thing 2');
                        frame.remove();
                        done();
                    };
                    document.body.appendChild(frame);
                } else {
                    done();
                }
            });
            it('is a patch of the root element', () => {
                var elmWithIdAndClass = document.createElement('div');
                elmWithIdAndClass.id = 'id';
                elmWithIdAndClass.className = 'class';
                elmWithIdAndClass.dataset.sel = '#.';
                var vnode1 = h('div#id.class', [h('span', 'Hi')]);
                elm = patch(read(elmWithIdAndClass), vnode1).elm;
                assert.strictEqual(elm, elmWithIdAndClass);
                assert.equal(elm.tagName, 'DIV');
                assert.equal(elm.id, 'id');
                assert.equal(elm.className, 'class');
            });
            it('can create comments', () => {
                elm = patch(vnode0, h('!', 'test')).elm;
                assert.equal(elm.nodeType, document.COMMENT_NODE);
                assert.equal(elm.textContent, 'test');
            });
            */
        });
    });
});
