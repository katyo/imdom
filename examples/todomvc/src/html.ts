import { writeFileSync } from 'fs';
import { runner } from './node_runner';
import * as Main from './main';

const container = document.createElement("document");

runner(Main.init, Main.view)(container);

writeFileSync('dist/client.html', elm_html(container));

function elm_html(el: Element): string {
    return el.nodeType===3 ? enc_val(el.textContent) : (
        '<' + el.nodeName.toLowerCase() + (el.attributes as any as Attr[]).map(attr_html).join('') + '>' +
            (el.childNodes as any as Element[]).map(elm_html).join('') + '</' + el.nodeName.toLowerCase() + '>'
    );
}

function attr_html(a: Attr) {
    return ` ${a.name}="${enc_val(a.value)}"`;
}

function enc_val(s: string | number | null) {
    return typeof s == 'string' ? s.replace(/[&'"<>]/g, a => `&#${a};`) : '' + s;
}
