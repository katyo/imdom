import {
    // import basic APIs
    registerLanguages,
    initHighlight,
    procHighlight,
    viewHighlight,

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

const highlighter = initHighlight();

export function highlight(code: string) {
    const { value } = procHighlight(highlighter, code);
    viewHighlight(value);
}
