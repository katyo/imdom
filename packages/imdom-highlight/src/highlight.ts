import { Highlighter, Renderer, Options, listLanguages, init, process } from 'highlight-ts';
import { _, tag, end, text } from 'imdom';

export type AST = ASTNode[] | ASTNode;

export type ASTNode = ASTSpan | string;

export interface ASTSpan {
    c: string;
    _: AST;
}

export type ASTRenderer = Renderer<AST>;

export const astRender: ASTRenderer = {
    text: (chunk: string) => chunk,
    join: (chunks: ASTNode[]) => chunks,
    wrap: (className: string, chunk: AST) => ({ c: className, _: chunk })
};

export type ASTHighlighter = Highlighter<AST>;

export function initHighlight(options?: Options): ASTHighlighter {
    return init(astRender, options);
}

export function viewHighlight(highlighter: ASTHighlighter, src: string, lang?: string | string[]): string {
    if (lang) {
        const langs = listLanguages();
        // remove unsupported languages to prevent fault
        if (typeof lang == 'string') {
            if (langs.indexOf(lang) < 0) lang = undefined;
        } else {
            lang = lang.filter(lang => langs.indexOf(lang) >= 0);
        }
    }
    const { value, language } = process(highlighter, src, lang);
    render_ast(value);
    return language;
}

function render_ast(ast: AST): void {
    if (typeof ast == 'string') {
        text(ast);
    } else if (!('length' in ast)) {
        tag('span', _, ast.c);
        render_ast(ast._);
        end();
    } else {
        for (let i = 0; i < ast.length; i++) {
            render_ast(ast[i]);
        }
    }
}
