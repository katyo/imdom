/* -*- mode: typescript; -*- */
import { name, version, config } from './package.json';

import { join } from 'path';
import sourceMaps from 'rollup-plugin-sourcemaps';
import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import postcss from 'rollup-plugin-postcss';
import postcss_import from 'postcss-import';
import typescript from 'rollup-plugin-typescript2';

const makeDeps = config.make_deps && require('rollup-plugin-make').default;
const babel = config.use_babel && require('rollup-plugin-babel');
const uglify = config.js_minifier == 'uglify' && require('rollup-plugin-uglify').uglify;
const terser = config.js_minifier == 'terser' && require('rollup-plugin-terser').terser;
const closure_compiler = config.js_minifier == 'closure-compiler' && require('@ampproject/rollup-plugin-closure-compiler');
const gzip = config.compress && require('rollup-plugin-gzip').default;
const compress = config.compressor == 'brotli' && require('brotli').compress ||
    config.compressor == 'zopfli' && require('node-zopfli').gzip;
const visualize = config.visualize && require('rollup-plugin-visualizer');

const { stringify } = JSON;

const debug = !(process.env.NODE_ENV == 'production' || process.env.BUILD_TYPE == 'release');
const release = !debug;

export default {
    context: 'this',
    input: `src/client.ts`,
    output: {
        file: join(config.target_dir, `client_${version}.min.js`),
        format: 'cjs',
        sourcemap: true
    },
    watch: {
        include: 'src/**',
    },
    plugins: [
        sourceMaps(),
        nodeResolve({
            browser: true,
        }),
        postcss({
            extract: true,
            sourceMap: true,
            plugins: [
                postcss_import({
                    path: ['node_modules']
                })
            ],
            minimize: release && {
                preset: ['advanced', { autoprefixer: { browsers: ['> 1%'] } }]
            },
        }),
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: 'es2015'
                }
            },
            objectHashIgnoreUnknownHack: true,
        }),
        replace({
            'process.env.npm_package_name': stringify(name),
            'process.env.npm_package_version': stringify(version),
            'process.env.NODE_ENV': stringify(debug ? 'development' : 'production'),
            'process.env.JS_TARGET': stringify('browser'),
            'process.env.JS_TRACE': stringify('dom' && ''),
        }),
        config.use_babel && babel({
            presets: [['@babel/preset-env', {modules: false}]],
            extensions: ['.js', '.ts'],
        }),
        release && config.js_minifier == 'uglify' && uglify({
            ie8: true,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
            compress: {
                toplevel: true,
                keep_fargs: false,
                keep_fnames: false,
                warnings: true,
                inline: 2,
                passes: 2,
            },
            output: {
                comments: false
            }
        }),
        release && config.js_minifier == 'terser' && terser({
            toplevel: true,
            ie8: true,
            safari10: true,
            ecma: 5,
            mangle: {
                toplevel: true,
                keep_fnames: false,
            },
            compress: {
                toplevel: true,
                keep_fargs: false,
                keep_fnames: false,
                warnings: true,
                inline: 2,
                passes: 2,
            },
            output: {
                comments: false
            }
        }),
        release && config.js_minifier == 'closure-compiler' && closure_compiler({
            compilation_level: 'ADVANCED',
            //warning_level: 'VERBOSE',
            env: 'BROWSER',
            language_in: 'ES5',
            language_out: 'ES5',
            rewrite_polyfills: true,
        }),
        release && config.compress && gzip({
            customCompression: compress && (content => compress(Buffer.from(content))),
            fileName: config.compressor == 'brotli' ? '.br' : '.gz',
            additionalFiles: [
                join(config.target_dir, `client_${version}.min.css`),
                join(config.target_dir, 'client.html')
            ],
        }),
        config.make_deps && makeDeps({
            mangle: file => join(config.target_dir, `${file.replace(config.target_dir + '/', '')}.d`),
        }),
        config.visualize && visualize({
            filename: join(config.target_dir, 'stats.html'),
            sourcemap: true
        }),
    ],
}
