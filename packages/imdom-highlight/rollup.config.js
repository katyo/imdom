import { lib, test } from '../../scripts/rollup.config';
import pkg from './package.json';

export default process.env.JS_TEST ? test(pkg) : lib(pkg, {
    /*mangle_props: [
        "name",
        "aliases",
        "case_insensitive",

        "className",
        "begin",
        "end",
        "beginKeywords",
        "endsWithParent",
        "endsParent",
        "lexemes",
        "keywords",
        "illegal",
        "excludeBegin",
        "excludeEnd",
        "returnBegin",
        "returnEnd",
        "contains",
        "starts",
        "variants",
        "subLanguage",
        "skip",
        "relevance",

        "terminators",
        "beginRe",
        "endRe",
        "lexemesRe",
        "illegalRe",
        "parent",
    ]*/
});
