import { AST, process, highlight } from './highlight';
import { Store, Over, set, get, over } from './store';
import { DomElement, _, NOOP, tag, end, once, iattr, ievent, current, element_of, after } from 'imdom';
import { KeyCode, ModKey, Selection, document_of, once_event/*, add_event, remove_event*/, cancel_event, key_char, mod_keys, selection_of, selection_to, selection_len, selection_cut, selection_copy } from 'imdom';

export interface On {
    change(): void;
    select(): void;
}

export interface State extends On {
    language: string | 'auto';
    content: string;
    out_language: string;
    out_content: AST,
    selection: Selection;
}

export function init(store: Store<State>, { change = NOOP, select = NOOP }: Partial<On> = {}) {
    set(store, update_highlight({
        change,
        select,
        language: 'auto',
        content: '',
        selection: { s: 0, e: 0 }
    } as State));
}

export function view(store: Store<State>) {
    const { out_content, selection } = get(store);

    // editor textarea
    tag('pre'); {
        const node = current();
        if (once()) {
            iattr('contenteditable');
            iattr('spellcheck', false);
            ievent('mousedown', () => {
                const doc = document_of(element_of(node));

                once_event(doc, 'mouseup', () => {
                    //remove_event(doc, 'mousemove', handle);
                    emit_selection(store, node);
                });

                /*add_event(doc, 'mousemove', handle);

                function handle() {
                    emit_selection(store, node);
                }*/
            });
            /*ievent('scroll', () => {
                emit_selection(store, node);
            });*/
            ievent('keypress', event => {
                const char = key_char(event);
                if (!mod_keys(event, ModKey.Ctrl | ModKey.Alt | ModKey.Meta) && char) {
                    cancel_event(event);
                    emit_input(store, char);
                }
            });
            ievent('keyup', event => {
                switch (event.keyCode) {
                    case KeyCode.LeftArrow:
                    case KeyCode.UpArrow:
                    case KeyCode.RightArrow:
                    case KeyCode.DownArrow:
                        emit_selection(store, node);
                        break;
                }
            });
            ievent('keydown', event => {
                switch (event.keyCode) {
                    case KeyCode.Enter:
                    case KeyCode.Backspace:
                    case KeyCode.Delete:
                        cancel_event(event);
                        emit_input(store, event.keyCode);
                        break;
                }
            });
            ievent('cut', event => {
                cancel_event(event);
                try {
                    document_of(element_of(node)).execCommand('copy');
                } catch (e) {
                    const { content, selection } = get(store);
                    const text = selection_copy(content, selection);
                    console.log('copy fallback', text);
                    window.prompt('Press Ctrl-C and Enter', text);
                }
                emit_input(store, '');
            });
            ievent('copy', event => {
                cancel_event(event);
                const { clipboardData } = event;
                if (clipboardData) {
                    const { content, selection } = get(store);
                    const text = selection_copy(content, selection);
                    console.log('copy', text);
                    clipboardData.setData('text/plain', text);
                }
            });
            ievent('paste', event => {
                cancel_event(event);
                const { clipboardData } = event;
                if (clipboardData) {
                    console.log('paste', clipboardData.getData('text/plain'));
                    emit_input(store, clipboardData.getData('text/plain'));
                }
            });
        }
        if (element_of(node)) {
            after(selection_to, node, selection);
        }
        highlight(out_content);
    } end();
}

export function set_language(language: string): Over<State> {
    return state => update_highlight({ ...state, language });
}

export function set_content(content: string): Over<State> {
    return state => (state.change(), update_highlight({ ...state, content }));
}

function update_highlight(state: State): State {
    const result = process(state.content, state.language != 'auto' ? state.language : _);
    return { ...state, out_language: result.language, out_content: result.value };
}

export function set_selection(selection: Selection): Over<State> {
    return state => (
        clamp_selection(selection, state.content.length),
        equal_selection(state.selection, selection) ? state :
            (console.log('set_selection', selection),
             state.select(), {
                 ...state,
                 selection
             })
    );
}

function equal_selection(a: Selection, b: Selection): boolean {
    return a.s == b.s && a.e == b.e;
}

function clamp_selection(sel: Selection, len: number) {
    if (sel.s > len) {
        sel.s = len;
    }
    if (sel.e > len) {
        sel.e = len;
    }
}

function emit_selection(state: Store<State>, node: DomElement) {
    over(state, set_selection(selection_of(node)));
}

function emit_input(state: Store<State>, char: string | number) {
    let { content, selection } = get(state);

    let cursor = selection.s;

    if (selection_len(selection)) {
        // cut selected
        content = selection_cut(content, selection);
    }

    let insert: string | undefined;
    let remove: number | undefined;

    switch (char) {
        case KeyCode.Enter:
            insert ='\n';
            break;
        case KeyCode.Backspace:
            remove = -1;
            break;
        case KeyCode.Delete:
            remove = +1;
            break;
        default:
            insert = char as string;
    }

    if (insert) {
        content = content.substr(0, cursor) + insert + content.substr(cursor);
        cursor += insert.length;
    } else if (remove) {
        const sel = remove < 0 ?
            { s: cursor + remove, e: cursor } :
            { s: cursor, e: cursor + remove };
        if (sel.s >= 0 && sel.e <= content.length && !selection_len(selection)) {
            content = selection_cut(content, sel);
            cursor = sel.s;
        }
    }

    over(state,
         set_content(content),
         set_selection({ s: cursor, e: cursor}));
}
