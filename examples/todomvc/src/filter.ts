import { tag, end, text, once, iattr, ievent, class_ } from 'imdom';
import { Store, get, set } from './store';

export const enum Filter {
    All,
    Active,
    Completed,
}

export interface Data {
    title: string,
    value: Filter,
    href: string,
}

export interface On {
    select(value: Filter): void,
}

export interface State extends Data {
    on: On,
}

export function init(store: Store<State>, on: On, { title = '', value = Filter.All, href = '' }: Partial<Data>) {
    set(store, {
        title, value, href,
        on
    });
}

export function view(state: Store<State>, active: Filter) {
    const { title, value, href } = get(state);
    const selected = value == active;

    tag('li'); {
        tag('a'); {
            if (once()) {
                iattr('href', href);
                ievent('click', () => {
                    get(state).on.select(value);
                });
            }
            if (selected) {
                class_('selected');
            }
            text(title);
        } end();
    } end();
}
