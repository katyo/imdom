import { ok, strictEqual as se, notStrictEqual as nse, notEqual as ne } from 'assert';
import { NULL as _, DomElement, DomText, DomComment, parse, patch, end, tag, text, once, comment, iattr, class_, create_element, create_text } from '../src/index';

describe('patch', () => {
    let elm: Element;
    let vdom: DomElement;

    beforeEach(() => {
        elm = create_element('div');
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
            tag('p', 'main');
            text('main text');
            end();
            tag('p', _, 'desc');
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
                const elm1 = create_element('div');

                elm.appendChild(elm1);
                vdom = parse(elm);
                patch(vdom);
                tag('span', 'id');
                end();
                end();

                const n1 = elm.firstChild as Element;

                ok(n1);
                se(n1.tagName, 'SPAN');
                se(n1.id, 'id');
            });

            it('has id', () => {
                patch(vdom);
                tag('div', 'unique');
                end();
                end();

                const n1 = elm.firstChild as Element;

                ok(n1);
                se(n1.id, 'unique');
            });

            it('has correct namespace', () => {
                const SVGNamespace = 'http://www.w3.org/2000/svg';
                const XHTMLNamespace = 'http://www.w3.org/1999/xhtml';

                // verify that svg tag automatically gets svg namespace
                patch(vdom);
                tag('svg');
                tag('foreignObject');
                tag('div');
                text('I am HTML embedded in SVG');
                end();
                end();
                end();
                end();

                const n1 = elm.firstChild as Element;

                se(n1.namespaceURI, SVGNamespace);
                se(n1.firstChild!.namespaceURI, SVGNamespace);
                se(n1.firstChild!.firstChild!.namespaceURI, XHTMLNamespace);

                // verify that svg tag with extra selectors gets svg namespace
                patch(vdom);
                tag('svg', 'some-id');
                end();
                end();

                se(elm.firstChild!.namespaceURI, SVGNamespace);

                // verify that non-svg tag patchning with 'svg' does NOT get namespace
                patch(vdom);
                tag('svg-custom-el');
                end();
                end();

                ne(elm.firstChild!.namespaceURI, SVGNamespace);
            });

            it('receives classes in selector', () => {
                patch(vdom);
                tag('i', _, ['am', 'a', 'class']);
                end();
                end();

                const n1 = (elm.firstChild as Element);

                ok(n1);

                const cls = n1.classList;

                ok(cls.contains('am'));
                ok(cls.contains('a'));
                ok(cls.contains('class'));
            });

            it('receives classes in class property', () => {
                patch(vdom);
                tag('i');
                class_('am');
                class_('a');
                class_('class');
                end();
                end();

                const cls = (elm.firstChild! as Element).classList;

                ok(cls.contains('am'));
                ok(cls.contains('a'));
                ok(cls.contains('class'));
                ok(!cls.contains('not'));
            });

            it('receives classes in selector when namespaced', () => {
                patch(vdom);
                tag('svg');
                tag('g', _, ['am', 'a', 'class', 'too']);
                end();
                end();
                end();

                const cls = (elm.firstChild!.firstChild! as Element).classList;

                ok(cls.contains('am'));
                ok(cls.contains('a'));
                ok(cls.contains('class'));
            });

            it('receives classes in class property when namespaced', () => {
                patch(vdom);
                tag('svg');
                tag('g');
                class_('am');
                class_('a');
                class_('class');
                if (0) {
                    class_('not');
                }
                class_('too');
                end();
                end();
                end();

                const cls = (elm.firstChild!.firstChild as Element).classList;

                ok(cls.contains('am'));
                ok(cls.contains('a'));
                ok(cls.contains('class'));
                ok(!cls.contains('not'));
            });

            it('handles classes from both selector and property', () => {
                patch(vdom);
                tag('div');
                tag('i', _, 'has');
                class_('classes');
                end();
                end();
                end();

                const cls = (elm.firstChild!.firstChild as Element).classList;

                ok(cls.contains('has'));
                ok(cls.contains('classes'));
            });

            it('can create elements with text content', () => {
                patch(vdom);
                tag('div');
                text('I am a string');
                end();
                end();

                se((elm.firstChild as HTMLElement).innerHTML, 'I am a string');
            });

            it('can create elements with span and text content', () => {
                patch(vdom);
                tag('a');
                tag('span');
                end();
                text('I am a string');
                end();
                end();

                se((elm.firstChild!.childNodes[0] as Element).tagName, 'SPAN');
                se(elm.firstChild!.childNodes[1].textContent, 'I am a string');
            });

            it('can create elements with attrs', () => {
                patch(vdom);
                tag('a');
                if (once()) {
                    iattr('href', 'http://localhost/');
                }
                end();
                end();

                se((elm.firstChild as Element).getAttribute('href'), 'http://localhost/');
            });

            /*
            it('can create an element created inside an iframe', done => {
                // Only run if srcdoc is supported.
                var frame = create_element('iframe');
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
            */

            it('is a patch of the root element', () => {
                patch(vdom);
                if (once()) {
                    iattr('id', 'some-id');
                }
                tag('span');
                text('Hi');
                end();
                end();

                se(elm, vdom.$);
                se(elm.tagName, 'DIV');
                se(elm.id, 'some-id');
            });

            it('can create comments', () => {
                patch(vdom);
                comment('test');
                end();

                se(elm.firstChild!.nodeType, document.COMMENT_NODE);
                se(elm.firstChild!.textContent, 'test');
            });
        });

        describe('patching an element', () => {
            it('can remove some children of the root element', () => {
                const h2 = create_element('h2');
                h2.textContent = 'Hello'

                const t = create_text('Foobar');

                elm.appendChild(t);
                elm.appendChild(h2);

                vdom = parse(elm);

                patch(vdom);
                text('Foobar');
                end();

                se(elm.childNodes.length, 1);
                se(elm.childNodes[0].nodeType, 3);
                se((elm.childNodes[0] as Text).wholeText, 'Foobar');
                se(elm.childNodes[0], t);
            });

            it('can remove text elements', () => {
                const h2 = create_element('h2');
                h2.textContent = 'Hello'

                const t = create_text('Foobar');

                elm.appendChild(t);
                elm.appendChild(h2);

                vdom = parse(elm);

                patch(vdom);
                tag('h2');
                text('Hello');
                end();
                end();

                se(elm.childNodes.length, 1);
                se(elm.childNodes[0].nodeType, 1);
                se(elm.childNodes[0].textContent, 'Hello');
                se(elm.childNodes[0], h2);
            });
        });

        describe('updating children with keys', () => {
            function spanNum(n: string | number) {
                if (typeof n == 'string') {
                    tag('span');
                    text(n);
                    end();
                } else if (n != null) {
                    tag('span', _, _, n);
                    text('' + n);
                    end();
                }
            }

            describe('addition of elements', () => {
                it('appends elements', () => {
                    patch(vdom);
                    for (let i = 0; i < 1; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 1);

                    patch(vdom);
                    for (let i = 0; i < 3; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 3);
                    for (let i = 0; i < 3; i++) se(elm.children[i].innerHTML, `${i + 1}`);
                });

                it('prepends elements', () => {
                    patch(vdom);
                    for (let i = 3; i < 5; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 2);

                    patch(vdom);
                    for (let i = 0; i < 5; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 5);
                    for (let i = 0; i < 5; i++) se(elm.children[i].innerHTML, `${i + 1}`);
                });

                it('add elements in the middle', () => {
                    patch(vdom);
                    for (let i = 0; i < 2; i++) spanNum(i + 1);
                    for (let i = 3; i < 5; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 4);

                    patch(vdom);
                    for (let i = 0; i < 5; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 5);
                    for (let i = 0; i < 5; i++) se(elm.children[i].innerHTML, `${i + 1}`);
                });

                it('add elements at begin and end', function() {
                    patch(vdom);
                    for (let i = 1; i < 4; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 3);

                    patch(vdom);
                    for (let i = 0; i < 5; i++) spanNum(i + 1);
                    end();

                    se(elm.children.length, 5);
                    for (let i = 0; i < 5; i++) se(elm.children[i].innerHTML, `${i + 1}`);
                });

                it('adds children to parent with no children', () => {
                    patch(vdom);
                    tag('span', 'span');
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 0);

                    patch(vdom);
                    tag('span', 'span');
                    for (let i = 0; i < 3; i++) spanNum(i + 1);
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 3);
                    for (let i = 0; i < 3; i++) se((elm.firstChild as Element).children[i].innerHTML, `${i + 1}`);
                });

                it('removes all children from parent', function() {
                    patch(vdom);
                    tag('span', 'span');
                    for (let i = 0; i < 3; i++) spanNum(i + 1);
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 3);
                    for (let i = 0; i < 3; i++) se((elm.firstChild as Element).children[i].innerHTML, `${i + 1}`);

                    patch(vdom);
                    tag('span', 'span');
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 0);
                });

                it('update one child with same key but different sel', function() {
                    patch(vdom);
                    tag('span', 'span');
                    for (let i = 0; i < 3; i++) spanNum(i + 1);
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 3);
                    for (let i = 0; i < 3; i++) se((elm.firstChild as Element).children[i].innerHTML, `${i + 1}`);

                    patch(vdom);
                    tag('span', 'span');
                    spanNum(1);
                    tag('i', _, _, 2);
                    text('2');
                    end();
                    spanNum(3);
                    end();
                    end();

                    se((elm.firstChild as Element).children.length, 3);
                    for (let i = 0; i < 3; i++) se((elm.firstChild as Element).children[i].innerHTML, `${i + 1}`);
                    se((elm.firstChild as Element).children[1].tagName, 'I');
                });
            });
        });
    });
});
