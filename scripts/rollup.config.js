/* -*- mode: typescript; -*- */
import { join } from 'path';
import sourceMaps from 'rollup-plugin-sourcemaps';
import nodeResolve from 'rollup-plugin-node-resolve';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import nodeGlobals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';
import { dts as typedefs } from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const { stringify } = JSON;

export function lib({
    name,
    version,
    main,
    'jsnext:main': jsnext_main,
    module,
    browser,
    typings,
    peerDependencies,
}, {
    mangle_props = /^$/,
} = {}) {
    const configs = [];
    const targets = {main, 'jsnext:main': jsnext_main, module, typings};

    if (Array.isArray(mangle_props)) {
        mangle_props = new RegExp(`^(?:${mangle_props.join('|')})$`);
    }

    for (const target in targets) {
        const file = targets[target];
        if (!file) {
            continue;
        }

        const platforms = {node: file};
        if (browser && browser[file]) {
            platforms.browser = browser[file];
        }

        for (const platform in platforms) {
            const file = platforms[platform];

            configs.push({
                input: 'src/index.ts',
                output: {
                    file,
                    name,
                    format: {
                        main: 'cjs',
                        'jsnext:main': 'es',
                        module: 'es',
                        typings: 'es',
                    }[target],
                    sourcemap: target != 'typings',
                },

                external: Object.keys(peerDependencies),
                watch: {
                    include: 'src/**',
                },
                plugins: target == 'typings' ? [
                    typedefs(),
                ] : [
                    nodeResolve(),

                    typescript({
                        tsconfigOverride: {
                            compilerOptions: {
                                target: {
                                    main: 'es5',
                                    'jsnext:main': 'es5',
                                    module: 'es2018',
                                }[target],
                                module: 'es2015',
                                preserveConstEnums: target == 'main',
                            }
                        }
                    }),

                    replace({
                        'process.env.npm_package_name': stringify(name),
                        'process.env.npm_package_version': stringify(version),
                        'process.env.JS_TARGET': stringify(platform == 'browser' ?
                                                           'browser' : 'server'),
                    }),

                    terser({
                        ecma: {
                            main: 5,
                            'jsnext:main': 5,
                            module: 8,
                        }[target],
                        toplevel: true,
                        warnings: true,
                        keep_classnames: true,
                        keep_fnames: true,
                        module: false, //target != 'main',
                        ie8: true,
                        safari10: true,
                        mangle: {
                            properties: {
                                regex: mangle_props,
                            },
                        },
                        compress: {
                            defaults: false,
                            collapse_vars: true,
                            computed_props: true,
                            dead_code: true,
                            evaluate: true,
                            join_vars: true,
                            keep_infinity: true,
                            passes: 2,
                            //reduce_funcs: true,
                            //reduce_vars: true,
                        },
                        output: {
                            beautify: true,
                            comments: true,
                        }
                    }),

                    sourceMaps(),
                ]
            });
        }
    }

    return configs;
}

export function test({
    name,
    version,
    target = 'es5',
    platform = 'browser',
    input = 'test/index.ts',
    output: file = 'test-out.js'
}) {
    return {
        input,
        output: {
            file,
            format: 'iife',
            sourcemap: true,
        },
        context: 'this',
        watch: {
            include: 'src/**',
        },
        plugins: [
            commonjs({
                include: /node_modules/,
                extensions: ['.js'],
            }),
            nodeResolve({
                mainFields: [
                    'jsnext:main',
                    'module',
                    'browser'
                ]
            }),
            nodeBuiltins(),
            nodeGlobals(),

            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        target,
                        module: 'es2015',
                    }
                }
            }),

            replace({
                'process.env.npm_package_name': stringify(name),
                'process.env.npm_package_version': stringify(version),
                'process.env.NODE_ENV': stringify(process.env.NODE_ENV),
                'process.env.JS_TARGET': stringify(platform == 'browser' ?
                                                   'browser' : 'server'),
            }),

            sourceMaps(),
        ]
    };
}

export function app({
    name,
    version,
}, {
    target = 'browser', // | 'server'
    build_type = process.env.NODE_ENV == 'production' ||
        process.env.BUILD_TYPE == 'release' ?
        'release' : 'debug', // undefined | 'debug' | 'release'
    context = 'this',
    target_dir = 'dist',
    use_babel = false,
    js_minifier = 'uglify',
    use_postcss = true,
    compress = true,
    compressor = 'zopfli',
    visualize = true,
    make_deps = false,
    extend = (config, target, build_type) => config,
} = {}) {
    const makeDeps = make_deps && require('rollup-plugin-make').default;
    const babel = use_babel && require('rollup-plugin-babel');
    const uglify = js_minifier == 'uglify' && require('rollup-plugin-uglify').uglify;
    const terser = js_minifier == 'terser' && require('rollup-plugin-terser').terser;
    const closure_compiler = js_minifier == 'closure-compiler' && require('@ampproject/rollup-plugin-closure-compiler');
    const postcss = use_postcss && require('rollup-plugin-postcss');
    const postcss_import = use_postcss && require('postcss-import');
    const gzip = compress && require('rollup-plugin-gzip').default;
    const compress_fn = compressor == 'brotli' && require('brotli').compress ||
        compressor == 'zopfli' && require('node-zopfli').gzip;
    const visualizer = visualize && require('rollup-plugin-visualizer');

    const debug = build_type == 'debug';
    const release = build_type == 'release';

    return extend({
        context,
        input: `src/client.ts`,
        output: {
            file: join(target_dir, `client_${version}.min.js`),
            format: target == 'browser' ? 'iife' : 'cjs',
            compact: true,
            sourcemap: true,
        },
        watch: {
            include: 'src/**',
        },
        plugins: [
            nodeResolve({
                mainFields: [
                    use_babel ? 'module' : 'jsnext:main',
                    ...(target == 'browser' ? ['browser'] : []),
                ],
            }),
            sourceMaps(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: 'es2015',
                        target: use_babel ? 'es2018' : 'es5',
                    }
                },
                objectHashIgnoreUnknownHack: true,
            }),
            replace({
                'process.env.npm_package_name': stringify(name),
                'process.env.npm_package_version': stringify(version),
                'process.env.NODE_ENV': stringify(debug ? 'development' : 'production'),
            }),
            use_babel && babel({
                presets: [['@babel/preset-env', {modules: false}]],
                extensions: ['.js', '.ts'],
            }),
            release && js_minifier == 'uglify' && uglify({
                toplevel: true,
                warnings: true,
                ie8: true,
                mangle: {
                    properties: {
                        regex: /^\$/,
                    },
                },
                compress: {
                    keep_fargs: false,
                    unsafe_comps: true,
                    unsafe_math: true,
                    unsafe_undefined: true,
                    inline: 2,
                    passes: 2,
                },
                output: {
                    comments: false,
                }
            }),
            release && js_minifier == 'terser' && terser({
                toplevel: true,
                warnings: true,
                ie8: true,
                safari10: true,
                ecma: 5,
                mangle: {
                    properties: {
                        regex: /^\$/,
                    },
                },
                compress: {
                    keep_fargs: false,
                    unsafe_comps: true,
                    unsafe_math: true,
                    unsafe_undefined: true,
                    inline: 2,
                    passes: 2,
                },
                output: {
                    comments: false,
                }
            }),
            release && js_minifier == 'closure-compiler' && closure_compiler({
                compilation_level: 'ADVANCED',
                warning_level: 'VERBOSE',
                env: target == 'browser' ? 'BROWSER' : 'CUSTOM',
                language_in: 'ES5',
                language_out: 'ES5',
                rewrite_polyfills: true,
            }),
            use_postcss && postcss({
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
            release && compress && gzip({
                customCompression: compress && (content => compress_fn(Buffer.from(content))),
                fileName: compressor == 'brotli' ? '.br' : '.gz',
                additionalFiles: [
                    join(target_dir, `client_${version}.min.css`),
                    join(target_dir, 'client.html')
                ],
            }),
            make_deps && makeDeps({
                mangle: file => join(target_dir, `${file.replace(target_dir + '/', '')}.d`),
            }),
            visualize && visualizer({
                filename: join(target_dir, 'stats.html'),
                sourcemap: true
            }),
        ],
    }, target, build_type);
}
