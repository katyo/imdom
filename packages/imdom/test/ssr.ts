process.env.JS_TARGET = "server";

import { strictEqual as se } from 'assert';
import { DomFragment, _, prepare, format, doctype, patch, tag, end, once, iattr, attr, class_, istyle, style, text } from '../src/index';

describe('ssr', () => {
    let vdom: DomFragment;

    beforeEach(() => {
        vdom = prepare();
    });

    it('attrs', () => {
        function draw(keywords: string[]) {
            patch(vdom); {
                tag('meta'); {
                    if (once()) {
                        iattr('name', 'keywords');
                    }
                    attr('content', keywords.join(', '));
                } end();
            } end();
        }

        draw(['some', 'other']);
        draw([]);
        draw(['some', 'other', '"some other"']);

        se(format(vdom), '<meta name="keywords" content="some, other, &quot;some other&quot;">');
    });

    it('classes', () => {
        function draw(view: boolean) {
            patch(vdom); {
                tag('div', _, 'main'); {
                    if (view) {
                        class_('view');
                    }
                } end();
            } end();
        }

        draw(true);
        draw(false);
        draw(true);

        se(format(vdom), '<div class="main view"></div>');
    });

    it('styles', () => {
        function draw(borderWidth: string, backgroundColor: string) {
            patch(vdom); {
                tag('span'); {
                    if (once()) {
                        istyle('overflow', 'hidden');
                        istyle('border-width', borderWidth);
                    }
                    style('display', 'block');
                    style('background-color', backgroundColor);
                } end();
            } end();
        }

        draw('1px', 'red');
        draw('0px', '#123');

        se(format(vdom), '<span style="overflow:hidden;border-width:1px;display:block;background-color:#123"></span>');
    });

    describe('code tags', () => {
        it('script src', () => {
            patch(vdom); {
                tag('script'); {
                    if (once()) {
                        iattr('src', 'https://example.com/script.js');
                    }
                } end();
            } end();

            se(format(vdom), '<script src="https://example.com/script.js"></script>');
        });

        it('script text', () => {
            patch(vdom); {
                tag('script'); {
                    text('const path="/";');
                } end();
            } end();

            se(format(vdom), '<script>const path="\\u002F";</script>');
        });

        it('style text', () => {
            patch(vdom); {
                tag('style'); {
                    text('a { color: blue; }');
                } end();
            } end();

            se(format(vdom), '<style>a { color: blue; }</style>');
        });
    });

    it('document', () => {
        patch(vdom); {
            doctype('html');
            tag('html'); {
                tag('head'); {
                    tag('meta'); {
                        if (once()) {
                            iattr('charset', 'UTF-8');
                        }
                    } end();
                    tag('title'); {
                        text('Page title');
                    } end();
                } end();
                tag('body'); {
                    tag('p'); {
                        text('Paragraph');
                    } end();
                } end();
            } end();
        } end();

        se(format(vdom), '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Page title</title></head><body><p>Paragraph</p></body></html>');
    });
});
