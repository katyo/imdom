import { strictEqual as se } from 'assert';
import { DomFragment, _, parse, patch, end, create_element } from 'imdom';
import { viewHighlight as view } from '../src';
import { highlighter } from './setup';

describe('highlight DOM', () => {
    let vdom: DomFragment;

    beforeEach(() => {
        vdom = parse(create_element('pre'));
    });

    it('TypeScript', () => {
        patch(vdom); {
            view(highlighter, `import { _, tag, end, patch } from "imdom";
`);
        } end();

        se(vdom.$.innerHTML, `<span class="hljs-keyword">import</span> { _, tag, end, patch } <span class="hljs-keyword">from</span> <span class="hljs-string">"imdom"</span>;
`);
    });

    it('Rust', () => {
        patch(vdom); {
            view(highlighter, `
trait Foo {
    fn foo(&self, Box<Foo>);
}
`);
        } end();

        se(vdom.$.innerHTML, `
<span class="hljs-class"><span class="hljs-keyword">trait</span> <span class="hljs-title">Foo</span></span> {
    <span class="hljs-function"><span class="hljs-keyword">fn</span> <span class="hljs-title">foo</span></span>(&amp;<span class="hljs-keyword">self</span>, <span class="hljs-built_in">Box</span>&lt;Foo&gt;);
}
`);
    });

    it('Markdown', () => {
        patch(vdom); {
            view(highlighter, `
# Title

## Subtitle

1. Foo
2. Bar
3. Baz

Paragraph with *emphasis* and **strong**.
`);
        } end();

        se(vdom.$.innerHTML, `
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
