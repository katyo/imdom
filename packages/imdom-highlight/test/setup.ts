import {
    // import basic APIs
    registerLanguages,
    initHighlight as init,

    // import preferred languages
    Rust,
    TypeScript,
    Markdown
} from '../src';

// register languages
registerLanguages(
    Rust,
    TypeScript,
    Markdown
);

export const highlighter = init();
