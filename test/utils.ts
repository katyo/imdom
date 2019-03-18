import { ok, strictEqual as se } from 'assert';
import { DomNamespace, create_text, create_comment, create_element } from '../src/index';

describe('dom', () => {
    describe('create_text', () => {
        it('empty', () => {
            const t0 = '';
            const n0 = create_text(document, t0);

            ok(n0);
            se(n0.nodeType, 3);
            se(n0.textContent, t0);
        });
        
        it('non empty', () => {
            const t0 = 'some text content';
            const n0 = create_text(document, t0);

            ok(n0);
            se(n0.nodeType, 3);
            se(n0.textContent, t0);
        });
    });

    describe('create_comment', () => {
        it('empty', () => {
            const t0 = '';
            const n0 = create_comment(document, t0);

            ok(n0);
            se(n0.nodeType, 8);
            se(n0.textContent, t0);
        });
        
        it('non empty', () => {
            const t0 = 'some comment';
            const n0 = create_comment(document, t0);

            ok(n0);
            se(n0.nodeType, 8);
            se(n0.textContent, t0);
        });
    });
    
    describe('create_element', () => {
        it('html tag', () => {
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });

            ok(n0);
            se(n0.tagName, 'SPAN');
        });

        it('html tag with id', () => {
            const i0 = 'some-id';
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'div', i: i0 });

            ok(n0);
            se(n0.tagName, 'DIV');
            se(n0.id, i0);
            se(n0.getAttribute('id'), i0);
        });

        it('html tag with class', () => {
            const c0 = 'some-class';
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'span', c: {[c0]: true} });
            
            ok(n0);
            se(n0.tagName, 'SPAN');
            se(n0.className, c0);
            se(n0.getAttribute('class'), c0);
            ok(n0.classList.contains(c0));
        });

        it('html tag with classes', () => {
            const c0 = 'some-class';
            const c1 = 'other-class';
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'span', c: {[c0]: true, [c1]: true} });
            
            ok(n0);
            se(n0.tagName, 'SPAN');
            se(n0.className, c0 + ' ' + c1);
            se(n0.getAttribute('class'), c0 + ' ' + c1);
            ok(n0.classList.contains(c0));
            ok(n0.classList.contains(c1));
        });

        it('html tag with key', () => {
            const k0 = 'some-key';
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'i', k: k0 });
            
            ok(n0);
            se(n0.tagName, 'I');
            se((n0 as HTMLElement).dataset.key, k0);
            se(n0.getAttribute('data-key'), k0);
        });

        it('html tag with id and class', () => {
            const i0 = 'some-id';
            const c0 = 'some-class';
            const n0 = create_element(document, { n: DomNamespace.XHTML, t: 'div', i: i0, c: {[c0]: true} });

            ok(n0);
            se(n0.tagName, 'DIV');
            se(n0.id, i0);
            se(n0.getAttribute('id'), i0);
            se(n0.className, c0);
            se(n0.getAttribute('class'), c0);
            ok(n0.classList.contains(c0));
        });
    });
    
    /*describe('insert_node', () => {
        let n0: Element;

        beforeEach(() => {
            n0 = create_element(document, { n: DomNamespace.XHTML, t: 'div' });
        });
        
        it('new node at 0 of empty', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 0);
            
            se(n0.childNodes.length, 1);
            se(n0.childNodes[0], n1);
        });

        it('new node at 1 of empty', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 1);
            
            se(n0.childNodes.length, 1);
            se(n0.childNodes[0], n1);
        });

        it('new node at 1 of non empty', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            const n2 = create_element(document, { n: DomNamespace.XHTML, t: 'p' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 0);
            insert_node(n0, n2, 1);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n1);
            se(n0.childNodes[1], n2);
        });

        it('new node at 0 of non empty', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            const n2 = create_element(document, { n: DomNamespace.XHTML, t: 'p' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 1);
            insert_node(n0, n2, 0);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n2);
            se(n0.childNodes[1], n1);
        });

        it('move node to beginning', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            const n2 = create_element(document, { n: DomNamespace.XHTML, t: 'p' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 0);
            insert_node(n0, n2, 1);
            insert_node(n0, n2, 0);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n2);
            se(n0.childNodes[1], n1);
        });

        it('move node to end', () => {
            const n1 = create_element(document, { n: DomNamespace.XHTML, t: 'span' });
            const n2 = create_element(document, { n: DomNamespace.XHTML, t: 'p' });
            
            se(n0.childNodes.length, 0);
            
            insert_node(n0, n1, 0);
            insert_node(n0, n2, 1);
            insert_node(n0, n1, 2);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n2);
            se(n0.childNodes[1], n1);
        });
    });*/
});

describe('dom behavior', () => {
    describe('replace node', () => {
        let n0: HTMLElement;
        let n1: HTMLElement;
        let n2: HTMLElement;
        let n3: HTMLElement;
        
        beforeEach(() => {
            n0 = document.createElement('div');
            
            n1 = document.createElement('p');
            n2 = document.createElement('a');
            n3 = document.createElement('i');
        
            n0.appendChild(n1);
            n0.appendChild(n2);
            n0.appendChild(n3);
            
            se(n0.childNodes.length, 3);
            se(n0.childNodes[0], n1);
            se(n0.childNodes[1], n2);
            se(n0.childNodes[2], n3);
        });
        
        it('backward 1', () => {
            n0.replaceChild(n3, n1);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n3);
            se(n0.childNodes[1], n2);
        });
        
        it('backward 2', () => {
            n0.replaceChild(n3, n2);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n1);
            se(n0.childNodes[1], n3);
        });

        it('forward 1', () => {
            n0.replaceChild(n1, n3);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n2);
            se(n0.childNodes[1], n1);
        });
        
        it('forward 2', () => {
            n0.replaceChild(n2, n3);
            
            se(n0.childNodes.length, 2);
            se(n0.childNodes[0], n1);
            se(n0.childNodes[1], n2);
        });
    });
});
