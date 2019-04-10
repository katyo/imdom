import { KeyCode, _, key, tag, end, text, once, iattr, attr, ievent, element } from '@imdom/core';
import { Store, get, set, over, lens, adjust, remove } from './store';
import { render } from './core';
import * as Filter from './filter';
import * as Task from './task';

export interface Data {
    tasks: Task.Data[];
    filter: Filter.Filter;
}

export type Tasks = Record<number, Task.State>;

export interface State {
    tasks: Tasks;
    last_task: number;
    filter: Filter.Filter;
    filters: Filter.State[];
    on: On;
}

export interface On {
    change(): void;
}

function add_task(store: Store<State>, data?: Partial<Task.Data>) {
    over(store, adjust('last_task', 1));
    const $ = get(store).last_task;
    Task.init(lens(store, 'tasks', $), {
        remove() { over(lens(store, 'tasks'), remove($)); }
    }, data);
}

function toggle_completed(tasks: Tasks): Tasks {
    tasks = { ...tasks };
    for (const $ in tasks) {
        const task = tasks[$];
        task.completed = !task.completed;
    }
    return tasks;
}

function clear_completed(tasks: Tasks): Tasks {
    tasks = { ...tasks };
    for (const $ in tasks) {
        if (tasks[$].completed) delete tasks[$];
    }
    return tasks;
}

const task_filters: Record<Filter.Filter, (task: Task.State) => boolean> = {
    [Filter.Filter.All]: () => true,
    [Filter.Filter.Active]: task => !task.completed,
    [Filter.Filter.Completed]: task => task.completed,
};

export function init(store: Store<State>, on: On, { tasks = [], filter = Filter.Filter.All }: Partial<Data> = {}) {
    set(store, {
        tasks: {},
        last_task: 0,
        filter,
        filters: [],
        on,
    });

    for (const task of tasks) add_task(store, task);

    const on_filter = {
        select(value: Filter.Filter) {
            set(lens(store, 'filter'), value);
            //on.change();
        }
    };

    const filters = lens(store, 'filters');
    let filter_id = 0;

    for (const [title, value, href] of [
        ["All", Filter.Filter.All, "#/"],
        ["Active", Filter.Filter.Active, "#/active"],
        ["Completed", Filter.Filter.Completed, "#/completed"],
    ] as [string, Filter.Filter, string][]) {
        Filter.init(lens(filters, filter_id++),
                    on_filter, { title, value, href });
    }
}

export function view(store: Store<State>) {
    const { tasks, filter, filters, on } = get(store);

    let active = 0, all = 0;
    for (const $ in tasks) {
        all ++;
        if (!tasks[$].completed) active ++;
    }

    tag('section', _, 'todoapp'); {
        tag('header', _, 'header'); {
            tag('h1'); {
                text('todos');
            } end();
            tag('input', _, 'new-todo'); {
                if (once()) {
                    const elm = element<HTMLInputElement>();
                    iattr('placeholder', 'What needs to be done?');
                    iattr('autofocus');
                    ievent('keydown', e => {
                        if (elm.value != '' && e.keyCode == KeyCode.Enter) {
                            add_task(store, { content: elm.value });
                            on.change();
                            elm.value = '';
                        }
                    });
                }
            } end();

            if (all) {
                tag('section', _, 'main'); {
                    tag('input', 'toggle-all', 'toggle-all'); {
                        if (once()) {
                            iattr('type', 'checkbox');
                            ievent('click', () => {
                                over(lens(store, 'tasks'), toggle_completed);
                            });
                        }
                        if (!active) {
                            attr('checked');
                        }
                    } end();
                    tag('label'); {
                        if (once()) {
                            iattr('for', 'toggle-all');
                        }
                        text('Mark all as complete');
                    } end();
                    tag('ul', _, 'todo-list'); {
                        const task_filter = task_filters[filter];
                        for (const $ in tasks) {
                            if (task_filter(tasks[$])) {
                                key(+$);
                                render(Task.view, lens(store, 'tasks', +$));
                            }
                        }
                        key();
                    } end();
                } end();
            }
        } end();
        tag('footer', _, 'footer'); {
            tag('span', _, 'todo-count'); {
                tag('strong'); {
                    text('' + active);
                } end();
                text(` item${active == 1 ? '' : 's'} left`);
            } end();
            tag('ul', _, 'filters'); {
                for (let i = 0; i < filters.length; i++) {
                    render(Filter.view, lens(store, 'filters', i), filter);
                }
            } end();
            if (all > active) {
                tag('button', _, 'clear-completed'); {
                    if (once()) {
                        ievent('click', () => {
                            over(lens(store, 'tasks'), clear_completed);
                        });
                    }
                    text(`Clear completed (${all - active})`);
                } end();
            }
        } end();
    } end();
}
