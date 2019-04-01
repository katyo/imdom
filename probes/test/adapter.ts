import * as benchmark from 'benchmark';
import { Suite, Event } from 'benchmark';

if (typeof window != 'undefined') {
    (window as any).Benchmark = benchmark;
}

const print: (...args: any[]) => void =
    typeof window != 'undefined' ? (...args) => {
        document.body.innerHTML += `<div>${String(args)}</div>`;
    } : (...args) => {
        console.log(...args);
    };

const queue: Suite[] = [];

export function bench(fn: (suite: Suite) => void) {
    const suite = new Suite();

    fn(suite);

    suite
        .on('cycle', (event: Event) => {
            print(String(event.target));
        })
        .on('complete', () => {
            queue.shift();
            print('Fastest is ' + suite.filter('fastest').map('name' as unknown as Function));
            deque();
        });

    queue.push(suite);

    if (queue.length == 1) {
        print('Running...');
        deque();
    }
}

function deque() {
    if (queue.length > 0) {
        queue[0].run({ async: true });
    }
}
