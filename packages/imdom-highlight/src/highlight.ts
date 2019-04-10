import { Highlighter, Renderer, Result, Options, listLanguages, init, process } from 'highlight-ts';
import { _, tag, end, text } from '@imdom/core';

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

/** Initialize syntax highlighter */
export function initHighlight(options?: Options): ASTHighlighter {
    return init(astRender, options);
}

/** Process syntax highlighting */
export function procHighlight(highlighter: ASTHighlighter, src: string, lang?: string | string[]): Result<AST> {
    if (lang) {
        const langs = listLanguages();
        // remove unsupported languages to prevent fault
        if (typeof lang == 'string') {
            if (langs.indexOf(lang) < 0) lang = undefined;
        } else {
            lang = lang.filter(lang => langs.indexOf(lang) >= 0);
        }
    }
    return process(highlighter, src, lang);
}

/** Render abstract syntax tree */
export function viewHighlight(ast: AST): void {
    if (typeof ast == 'string') {
        text(ast);
    } else if (!('length' in ast)) {
        tag('span', _, ast.c);
        viewHighlight(ast._);
        end();
    } else {
        for (let i = 0; i < ast.length; i++) {
            viewHighlight(ast[i]);
        }
    }
}
