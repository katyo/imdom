import {
    // import basic APIs
    registerLanguages,
    listLanguages,
    initHighlight as init,
    viewHighlight as view,

    // import preferred languages
    Rust,
    TypeScript,
    Markdown
} from 'imdom-highlight';

export { listLanguages as languages };

// register languages
registerLanguages(
    Rust,
    TypeScript,
    Markdown
);

const highlighter = init();

export function highlight(code: string, lang?: string | string[]): string {
    return view(highlighter, code, lang);
}
