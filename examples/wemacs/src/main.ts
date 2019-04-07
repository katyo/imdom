import { _, tag, end, text, once, iattr, ievent, attr, current, element_of } from 'imdom';
import { PropsLite, page_lite_open, page_lite_close } from './page';
import { Store, lens, get, over } from './store';
import { languages } from './highlight';
import * as Editor from './editor';
import { samples } from './samples';

const page_props: Partial<PropsLite> = {
    styles: [{ link: `client_${process.env.npm_package_version}.min.css` }],
    scripts: [{ link: `client_${process.env.npm_package_version}.min.js` }],
    settings: { viewport: "width=device-width, initial-scale=1" },
    title: "Highlighted code editor",
};

export interface State {
    editor: Editor.State;
}

export function init(store: Store<State>) {
    Editor.init(lens(store, 'editor'));
}

export function view(store: Store<State>) {
    const editor_store = lens(store, 'editor');
    const { language } = get(editor_store);

    page_lite_open(page_props); {
        // language mode select
        tag('select'); {
            if (once()) {
                const elm = element_of<HTMLSelectElement>(current());
                ievent('change', () => {
                    over(editor_store, Editor.set_language(elm.value));
                });
            }
            attr('value', language);

            tag('option'); {
                if (once()) {
                    iattr('value', 'auto');
                }
                text("auto");
            } end();

            const langs = languages();

            for (let i = 0; i < langs.length; i++) {
                tag('option'); {
                    if (once()) {
                        iattr('value', langs[i]);
                    }
                    text(langs[i]);
                } end();
            }
        } end();

        Editor.view(editor_store);

        // load code sample
        tag('select'); {
            if (once()) {
                const elm = element_of<HTMLSelectElement>(current());
                ievent('change', () => {
                    const sample = samples[+elm.value];
                    if (sample) {
                        over(editor_store,
                             Editor.set_content(sample.code),
                             Editor.set_language(sample.lang));
                    }
                });
            }

            tag('option'); {
                if (once()) {
                    iattr('value', 'select');
                }
                text("Select sample");
            } end();

            for (let i = 0; i < samples.length; i++) {
                const sample = samples[i];
                tag('option'); {
                    if (once()) {
                        iattr('value', i);
                    }
                    text(`${sample.name} (${sample.lang})`);
                } end();
            }
        } end();
    } page_lite_close(page_props);
}
