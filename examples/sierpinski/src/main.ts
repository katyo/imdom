import { Store, set, get, over, lens, change } from './store';
import { _, doctype, tag, end, text, once, iattr, istyle, style, ievent } from 'imdom';

export interface State {
    seconds: number;
    start: number;
    triangle: TriangleState;
}

export function init(store: Store<State>) {
    set(store, {
        seconds: 0,
        start: new Date().getTime(),
    } as State);

    if (process.env.JS_TARGET != 'server') {
        setInterval(() => {
            over(store, (state: State) =>
                 ({
                     ...state,
                     seconds: (state.seconds % 10) + 1
                 }));
        }, 1000);

        setInterval(() => {
            over(store, (state: State) => state);
        }, 16);
    }

    triangle_init(lens(store, 'triangle'), {
        x: 0,
        y: 0,
        s: 1000,
    });
}

export function view(store: Store<State>) {
    doctype('html');
    tag('html'); {
        if (once()) {
            istyle('width', '100%');
            istyle('height', '100%');
            istyle('overflow', 'hidden');
        }
        tag('head'); {
            tag('meta'); {
                if (once()) {
                    iattr('charset', 'utf-8');
                }
            } end();
            tag('title'); {
                text("Sierpinski Triangles");
            } end();
            tag('link'); {
                if (once()) {
                    iattr('rel', 'stylesheet');
                    iattr('href', `client_${process.env.npm_package_version}.min.css`);
                }
            } end();
        } end();
        tag('body'); {
            tag('h1'); {
                text("Sierpinski Triangles");
            } end();
            tag('div', 'container'); {
                if (process.env.JS_TARGET != 'server') {
                    const state = get(store);
                    const elapsed = new Date().getTime() - state.start;
                    const t = (elapsed / 1000) % 10;
                    const scale = 1 + (t > 5 ? 10 - t : t) / 10;

                    tag('div', 'container'); {
                        if (once()) {
                            istyle('position', 'absolute');
                            istyle('transform-origin', '0 0');
                            istyle('left', '50%');
                            istyle('top', '50%');
                            istyle('width', '10px');
                            istyle('height', '10px');
                            istyle('background-color', '#eee');
                        }
                        style('transform', `scaleX(${scale / 2.1}) scaleY(0.7) translateZ(0.1px)`);
                        tag('div'); {
                            triangle_view(lens(store, 'triangle'), `${state.seconds}`);
                        } end();
                    } end();
                } else {
                    tag('p'); {
                        text("To use ImDOM, follow the instructions on");
                        tag('a'); {
                            if (once()) {
                                iattr('href', "https://github.com/katyo/imdom");
                            }
                            text("GitHub");
                        } end();
                    } end();
                    tag('p'); {
                        text("If you can see this, ImDOM is ");
                        tag('strong'); {
                            text("not");
                        } end();
                        text(" working right.");
                    } end();
                }
            } end();
            tag('script'); {
                if (once()) {
                    iattr('src', `client_${process.env.npm_package_version}.min.js`);
                }
            } end();
        } end();
    } end();
}

const targetSize = 25;

interface DotProps {
    x: number;
    y: number;
    size: number;
}

interface DotState extends DotProps {
    hover: boolean;
}

function dot_init(store: Store<DotState>, props: DotProps) {
    set(store, {
        ...props,
        hover: false
    });
}

function dot_view(store: Store<DotState>, content: string) {
    const state = get(store);
    const size = state.size * 1.3;
    tag('div'); {
        if (once()) {
            istyle('position', 'absolute');
            istyle('font', 'normal 15px sans-serif');
            istyle('text-align', 'center');
            istyle('cursor', 'pointer');
            ievent('mouseenter', () => {
                over(store, change<DotState>({ hover: true }));
            });
            ievent('mouseleave', () => {
                over(store, change<DotState>({ hover: false }));
            });
        }
        style('width', `${size}px`);
        style('height', `${size}px`);
        style('left', `${state.x}px`);
        style('top', `${state.y}px`);
        style('border-radius', `${(size / 2)}px`);
        style('line-height', `${size}px`);
        style('background', state.hover ? '#ff0' : '#61dafb');
        text(state.hover ? `*${content}*` : content);
    } end();
}

interface TriangleProps {
    x: number;
    y: number;
    s: number;
}

interface TriangleState extends TriangleProps {
    dot: DotState;
    triangle1: TriangleState;
    triangle2: TriangleState;
    triangle3: TriangleState;
}

function triangle_init(store: Store<TriangleState>, props: TriangleProps) {
    set(store, {
        ...props,
    });

    if (props.s <= targetSize) {
        dot_init(lens(store, 'dot'), {
            x: props.x - targetSize / 2,
            y: props.y - targetSize / 2,
            size: targetSize
        });
    } else {
        const s = props.s / 2;

        triangle_init(lens(store, 'triangle1'), {
            x: props.x,
            y: props.y - s / 2,
            s,
        });

        triangle_init(lens(store, 'triangle2'), {
            x: props.x - s,
            y: props.y + s / 2,
            s,
        });

        triangle_init(lens(store, 'triangle3'), {
            x: props.x + s,
            y: props.y + s / 2,
            s,
        });
    }
}

function triangle_view(store: Store<TriangleState>, content: string) {
    const state = get(store);
    if (state.dot) {
        dot_view(lens(store, 'dot'), content);
    } else {
        triangle_view(lens(store, 'triangle1'), content);
        triangle_view(lens(store, 'triangle2'), content);
        triangle_view(lens(store, 'triangle3'), content);
    }
}
