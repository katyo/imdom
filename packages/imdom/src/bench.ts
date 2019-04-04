/** Get current value of high resolution timer in mS */
export const now = typeof performance != 'undefined' ? () => performance.now() : () => new Date().getTime();

export interface Bench {
    /// Last timestamp
    now: number;
    /// Current accumulated time
    tim: number;
    /// Last time
    val: number;
    /// Aggregate time
    acc: number;
    /// Number of runs
    cnt: number;
    /// Minimum time
    min: number;
    /// Maximum time
    max: number;
    /// Average time
    avg: number;
}

export function bench_init(): Bench {
    return {
        now: NaN,
        tim: 0,
        // metrics
        val: NaN,
        acc: 0,
        cnt: 0,
        min: Infinity,
        max: -Infinity,
        avg: NaN,
    };
}

export function bench_start(bench: Bench) {
    bench.now = now();
}

export function bench_stop(bench: Bench) {
    bench.tim += now() - bench.now;
}

export function bench_stat(bench: Bench) {
    bench.val = bench.tim;
    bench.tim = 0;
    bench.min = Math.min(bench.val, bench.min);
    bench.max = Math.max(bench.val, bench.max);
    bench.acc += bench.val;
    bench.cnt ++;
    bench.avg = bench.acc / bench.cnt;
}

function show_val(val: number): string {
    return val.toFixed(3);
}

export function bench_show(bench: Bench): string {
    return show_val(bench.val) +
        ' mS ~' + show_val(bench.avg) +
        ' [' + show_val(bench.min) +
        '..' + show_val(bench.max) + '] +' +
        show_val(bench.acc) + ' #' + bench.cnt;
}
