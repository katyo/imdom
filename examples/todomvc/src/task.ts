import { _, tag, end, text, once, iattr, ievent, attr, class_, element } from 'imdom';
import { Store, get, set, over, toggle, change } from './store';
import { KeyCode } from './keys';

export interface Data {
    content: string,
    completed: boolean,
}

export interface State extends Data {
    editing: boolean,
    on: On;
}

export interface On {
    remove(): void;
}

export function toggle_completed(store: Store<State>) {
    over(store, toggle('completed'));
}

export function init(store: Store<State>, on: On, { content = "", completed = false }: Partial<Data> = {}) {
    set(store, {
        content,
        completed,
        editing: false,
        on,
    });
}

export function view(store: Store<State>) {
    const { content, completed, editing } = get(store);

    tag('li'); {
        if (completed) {
            class_('completed');
        }
        if (editing) {
            class_('editing');
        }
        tag('div', _, 'view'); {
            tag('input', _, 'toggle'); {
                if (once()) {
                    iattr('type', 'checkbox');
                    ievent('change', () => {
                        toggle_completed(store);
                    });
                }
                if (completed) {
                    attr('checked');
                }
            } end();
            tag('label'); {
                if (once()) {
                    ievent('dblclick', () => {
                        over(store, change({editing: true}));
                    });
                }
                text(content);
            } end();
            tag('button', _, 'destroy'); {
                if (once()) {
                    ievent('click', () => {
                        get(store).on.remove();
                    });
                }
            } end();
        } end();
        tag('input', _, 'edit'); {
            const elm = element<HTMLInputElement>();
            if (once()) {
                ievent('blur', () => {
                    over(store, change({
                        content: elm.value,
                        editing: false
                    }));
                });
                ievent('keydown', e => {
                    if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                        over(store, change({
                            content: elm.value,
                            editing: false
                        }));
                    }
                });
            }
            attr('value', content);
            if (elm && editing) {
                elm.focus();
                elm.selectionStart = elm.selectionEnd = elm.value.length;
            }
        } end();
    } end();
}
