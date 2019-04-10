import { Store, set, lens } from './store';
import { _, tag, end, iattr, text, once, class_ } from '@imdom/core';
import { render } from './core';
import { PropsLite, page_lite_open, page_lite_close } from './page';
import * as Todo from './todo';

const page_props: Partial<PropsLite> = {
    styles: [{ link: `client_${process.env.npm_package_version}.min.css` }],
    scripts: [{ link: `client_${process.env.npm_package_version}.min.js` }],
    settings: { viewport: "width=device-width, initial-scale=1" },
    title: "TodoMVC",
};

export interface State {
    todo: Todo.State,
}

export function init(store: Store<State>) {
    set(store, {});

    Todo.init(lens(store, 'todo'), { change() {} });
}

export function view(store: Store<State>) {
    page_lite_open(page_props); {
        class_('learn-bar');
        learn();
        render(Todo.view, lens(store, 'todo'));
        footer();
    } page_lite_close(page_props);
}

interface SourceLink {
    title: string;
    url: string;
    local?: true;
    kind?: string;
}

interface SourceLinksGroup {
    title: string;
    links: SourceLink[];
}

const source_links: SourceLinksGroup[] = [
    {
        title: 'Example',
        links: [
            {
                title: 'Source',
                url: 'https://github.com/katyo/imdom/tree/master/examples/todomvc',
            }
        ]
    }
];

function learn() {
    tag('aside', _, 'learn'); {
        tag('header'); {
            tag('h3'); {
                text('ImDOM TodoMVC');
            } end();
            tag('span', _, 'source-links'); {
                for (const { title, links } of source_links) {
                    tag('h5'); {
                        text(title);
                    } end();
                    let n = 0;
                    for (const { title, url, kind, local } of links) {
                        if (n++) text(', ');
                        tag('a', _, (kind ? `${kind}-link` : _));
                        if (once()) {
                            iattr('href', url);
                            if (local) {
                                iattr('data-type', 'local');
                            }
                        }
                        text(title);
                        end();
                    }
                }
            } end();
        } end();
        tag('hr'); end();
        tag('blockquote', _, 'quote', 'speech-bubble'); {
            tag('p'); {
                text('This example demonstrates TodoMVC implementation using ImDOM library and simple lens-based storage.');
            } end();
        } end();
        tag('footer'); {
            tag('hr'); end();
            tag('em'); {
                text('If you found unexpected behavior in example, or you have something helpful ideas, please ');
                tag('a'); {
                    if (once()) {
                        iattr('href', 'https://github.com/katyo/imdom/issues');
                    }
                    text('let me know');
                } end();
                text('.');
            } end();
        } end();
    } end();
}

function footer() {
    tag('footer', _, 'info'); {
        tag('p'); {
            text('Created by ');
            tag('a'); {
                if (once()) {
                    iattr('href', 'https://github.com/katyo');
                }
                text('Kayo');
            } end();
        } end();
        tag('p'); {
            text('Not a part of ');
            tag('a'); {
                if (once()) {
                    iattr('href', 'http://todomvc.com');
                }
                text('TodoMVC');
            } end();
            text(' yet now.');
        } end();
    } end();
}
