import {
    // import basic APIs
    registerLanguages,
    listLanguages,

    AST,
    initHighlight,
    procHighlight,
    viewHighlight,

    // import preferred languages
    Rust,
    TypeScript,
    Markdown
} from '@imdom/highlight';

export { listLanguages as languages };

// register languages
registerLanguages(
    Rust,
    TypeScript,
    Markdown
);

const highlighter = initHighlight();

export function process(code: string, lang?: string | string[]) {
    return procHighlight(highlighter, code, lang);
}

export { viewHighlight as highlight, AST };
