/**
 * @module decls
 */

/**
 * Enable debug assertions
 */
export const DEBUG = process.env.NODE_ENV == 'development';

/**
 * Browser environment
 */
export const BROWSER = process.env.JS_TARGET != 'server';

/**
 * Enable tracing DOM operations
 */
export const TRACE_DOMOP = false;

/**
 * Enable patch benchmarking
 */
export const BENCH_PATCH = false;

/**
 * Enable reuse benchmarking
 */
export const BENCH_REUSE = false;

/**
 * Enable benchmarking DOM operations
 */
export const BENCH_DOMOP = false;

/**
 * Minimum time between printing stats
 */
export const STATS_INTERVAL = 5000;
