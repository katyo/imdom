process.env.JS_TARGET = "server";

import { strictEqual as se } from 'assert';
import { NULL as _, prepare, format, doctype, patch, tag, end, once, iattr, attr, class_, istyle, style, text } from '../src/index';

describe('ssr', () => {
    it('attrs', () => {
        const root = prepare();

        function draw(keywords: string[]) {
            patch(root); {
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

        se(format(root), '<meta name="keywords" content="some, other, &quot;some other&quot;">');
    });

    it('classes', () => {
        const root = prepare();

        function draw(view: boolean) {
            patch(root); {
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

        se(format(root), '<div class="main view"></div>');
    });

    it('styles', () => {
        const root = prepare();

        function draw(borderWidth: string, backgroundColor: string) {
            patch(root); {
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

        se(format(root), '<span style="overflow:hidden;border-width:1px;display:block;background-color:#123"></span>');
    });

    describe('code tags', () => {
        it('script src', () => {
            const root = prepare();

            patch(root); {
                tag('script'); {
                    if (once()) {
                        iattr('src', 'https://example.com/script.js');
                    }
                } end();
            } end();

            se(format(root), '<script src="https://example.com/script.js"></script>');
        });

        it('script text', () => {
            const root = prepare();

            patch(root); {
                tag('script'); {
                    text('const path="/";');
                } end();
            } end();

            se(format(root), '<script>const path="\\u002F";</script>');
        });

        it('style text', () => {
            const root = prepare();

            patch(root); {
                tag('style'); {
                    text('a { color: blue; }');
                } end();
            } end();

            se(format(root), '<style>a { color: blue; }</style>');
        });
    });

    it('document', () => {
        const root = prepare();

        patch(root); {
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

        se(format(root), '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Page title</title></head><body><p>Paragraph</p></body></html>');
    });
});
