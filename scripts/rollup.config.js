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
