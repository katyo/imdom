import { strictEqual as se } from 'assert';
import { DomFragment, _, prepare, format, patch, end } from '@imdom/core';
import { highlight } from './setup';

describe('highlight SSR', () => {
    let vdom: DomFragment;

    beforeEach(() => {
        vdom = prepare();
    });

    it('TypeScript', () => {
        patch(vdom); {
            highlight(`import { _, tag, end, patch } from "imdom";
`);
        } end();

        se(format(vdom), `<span class="hljs-keyword">import</span> { _, tag, end, patch } <span class="hljs-keyword">from</span> <span class="hljs-string">"imdom"</span>;
`);
    });

    it('Rust', () => {
        patch(vdom); {
            highlight(`
trait Foo {
    fn foo(&self, Box<Foo>);
}
`);
        } end();

        se(format(vdom), `
<span class="hljs-class"><span class="hljs-keyword">trait</span> <span class="hljs-title">Foo</span></span> {
    <span class="hljs-function"><span class="hljs-keyword">fn</span> <span class="hljs-title">foo</span></span>(&amp;<span class="hljs-keyword">self</span>, <span class="hljs-built_in">Box</span>&lt;Foo>);
}
`);
    });

    it('Markdown', () => {
        patch(vdom); {
            highlight(`
# Title

## Subtitle

1. Foo
2. Bar
3. Baz

Paragraph with *emphasis* and **strong**.
`);
        } end();

        se(format(vdom), `
<span class="hljs-section"># Title</span>

<span class="hljs-section">## Subtitle</span>
<span class="hljs-bullet">
1. </span>Foo
<span class="hljs-bullet">2. </span>Bar
<span class="hljs-bullet">3. </span>Baz

Paragraph with <span class="hljs-emphasis">*emphasis*</span> and <span class="hljs-strong">**strong**</span>.
`);
    });
});
