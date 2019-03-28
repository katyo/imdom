/** Enable debug assertions */
export const DEBUG = process.env.NODE_ENV == 'development';

/** Browser environment */
export const BROWSER = process.env.JS_TARGET != 'server';
