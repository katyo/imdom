type Key = string | number;
type Classes = Record<string, true>;

interface Selector {
    t: string;
    i?: string;
    c?: Classes;
    k?: Key;
}

type Classes6 = string[];

interface Selector6 {
    t: string;
    i: string | undefined;
    c: Classes6 | undefined;
    k: Key | undefined;
}

let s: Selector;
let s6: Selector6;

const div = 'div';
const _ = undefined;

function tag1(t: string, k?: Key) {
    const id_i = t.search(/#/);
    const cls_i = t.search(/\./);
    s = {
        t: t.substring(0, id_i >= 0 ? id_i : cls_i >= 0 ? cls_i : t.length) || div
    };
    if (id_i >= 0) s.i = t.substring(id_i + 1, cls_i >= 0 ? cls_i : t.length);
    if (cls_i >= 0) {
        const cls = t.substring(cls_i + 1);
        if (cls) {
            const lst = cls.replace(/^[\.\s]/, '').split(/[\.\s]/);
            if (!s.c) s.c = {};
            for (const name of lst) s.c[name] = true;
        }
    }
    if (k != null) s.k = k;
}

function parse_sel2(s: Selector, v: Key) {
    if (typeof v == 'string') {
        switch (v.charCodeAt(0)) {
            case 35:
                s.i = v.substring(1);
                return;
            case 46:
                if (!s.c) s.c = {};
                s.c[v.substring(1)] = true;
                return;
        }
    }
    s.k = v;
}

function tag20(t: string,
               a?: Key,
               b?: Key,
               c?: Key,
               d?: Key,
               e?: Key,
               f?: Key) {
    s = {t: t || div};
    if (a != null) {
        parse_sel2(s, a);
        if (b != null) {
            parse_sel2(s, b);
            if (c != null) {
                parse_sel2(s, c);
                if (d != null) {
                    parse_sel2(s, d);
                    if (e != null) {
                        parse_sel2(s, e);
                        if (f != null) {
                            parse_sel2(s, f);
                        }
                    }
                }
            }
        }
    }
}

function tag21(t: string,
               a?: Key,
               b?: Key,
               c?: Key,
               d?: Key,
               e?: Key,
               f?: Key,
               ...r: Key[]) {
    s = {t: t || div};
    if (a != null) {
        parse_sel2(s, a);
        if (b != null) {
            parse_sel2(s, b);
            if (c != null) {
                parse_sel2(s, c);
                if (d != null) {
                    parse_sel2(s, d);
                    if (e != null) {
                        parse_sel2(s, e);
                        if (f != null) {
                            parse_sel2(s, f);
                            if (r.length) {
                                for (const v of r) {
                                    parse_sel2(s, v);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function tag22(t: string,
               a?: Key,
               b?: Key,
               c?: Key,
               d?: Key,
               e?: Key,
               f?: Key,
               ...r: Key[]) {
    s = {t: t || div};
    if (a == null) return;
    parse_sel2(s, a);
    if (b == null) return;
    parse_sel2(s, b);
    if (c == null) return;
    parse_sel2(s, c);
    if (d == null) return;
    parse_sel2(s, d);
    if (e == null) return;
    parse_sel2(s, e);
    if (f == null) return;
    parse_sel2(s, f);
    if (!r.length) return;
    for (const v of r) {
        parse_sel2(s, v);
    }
}

function tag23(t: string, ...a: Key[]) {
    s = {t: t || div};
    for (const v of a) {
        if (typeof v == 'string') {
            switch (v.charCodeAt(0)) {
                case 35:
                    s.i = v.substring(1);
                    continue;
                case 46:
                    if (!s.c) s.c = {};
                    s.c[v.substring(1)] = true;
                    continue;
            }
        }
        s.k = v;
    }
}

function tag30(t: string, i?: string, c?: string | string[], k?: Key) {
    s = {
        t: t || div,
        i,
    };

    if (c) {
        s.c = {};
        if (typeof c == 'string') {
            s.c[c] = true;
        } else {
            for (const n of c) {
                s.c[n] = true;
            }
        }
    }

    if (k) s.k = k;
}

function tag31(t: string, i?: string, c?: string[], k?: Key) {
    s = {
        t: t || div,
        i,
    };

    if (c) {
        s.c = {};
        for (const n of c) {
            s.c[n] = true;
        }
    }

    if (k) s.k = k;
}

function tag32(t: string, i?: string, c?: string, k?: Key) {
    s = {
        t: t || div,
        i,
    };

    if (c) {
        s.c = {};
        for (const n of c.split(/ /)) {
            s.c[n] = true;
        }
    }

    if (k) s.k = k;
}

function tag40(t: string, i?: string, c?: Record<string, 1>, k?: Key) {
    s = {
        t: t || div,
        i,
        c: c as unknown as Classes,
        k,
    };
}

function tag41(t: string, i?: string, c?: Classes, k?: Key) {
    s = {
        t: t || div,
        i,
        c,
        k,
    };
}

let k: Key | undefined;

function key5(k_?: Key | undefined) {
    k = k_;
}

function tag50(t: string, i?: string, ...c: string[]) {
    s = {
        t: t || div,
        i,
        k: k,
    };

    if (c) {
        s.c = {};
        for (const n of c) {
            s.c[n] = true;
        }
    }
}

function tag51(t: string, i?: string, c1?: string, c2?: string, c3?: string, c4?: string, ...cs: string[]) {
    s = {
        t: t || div,
        i,
        k: k,
    };

    if (c1) {
        s.c = {};
        s.c[c1] = true;
        if (c2) {
            s.c[c2] = true;
            if (c3) {
                s.c[c3] = true;
                if (c4) {
                    s.c[c4] = true;
                    if (cs) {
                        s.c = {};
                        for (const n of cs) {
                            s.c[n] = true;
                        }
                    }
                }
            }
        }
    }
}

function tag60(t: string, i?: string, ...c: string[]) {
    s6 = {
        t: t || div,
        i,
        c,
        k: k,
    };
}

function tag61(t: string, i?: string, c1?: string, c2?: string, c3?: string, ...c: string[]) {
    s6 = {
        t: t || div,
        i,
        c: !c1 ? _ : !c2 ? [c1] : !c3 ? [c1, c2] : !c.length ? [c1, c2, c3] : [c1, c2, c3, ...c],
        k: k,
    };
}

function tag62(t: string, i?: string, c1?: string, c2?: string, c3?: string, ...c: string[]) {
    s6 = {
        t: t || div,
        i,
        c: c1 ? c2 ? c3 ? c.length ? [c1, c2, c3, ...c] : [c1, c2, c3] : [c1, c2] : [c1] : _,
        k: k,
    };
}

import { bench } from './adapter';

bench(suite => suite
      .add('tag v1', () => {
          for (let i = 0; i < 100; i++) {
              tag1('span');
              tag1('div#id');
              tag1('div.class');
              tag1('div#id.class');
              tag1('div#id.class1.class2');
              tag1('div#id.class1.class2.class3');
              tag1('span', 1);
              tag1('div#id', 1);
              tag1('div.class', 1);
              tag1('div#id.class', 1);
              tag1('div#id.class1.class2', 1);
              tag1('div#id.class1.class2.class3', 1);
              tag1('span', 'a');
              tag1('div#id', 'a');
              tag1('div.class', 'a');
              tag1('div#id.class', 'a');
              tag1('div#id.class1.class2', 'a');
              tag1('div#id.class1.class2.class3', 'a');
          }
      })
      .add('tag v2.0', () => {
          for (let i = 0; i < 100; i++) {
              tag20('span');
              tag20('div', '#id');
              tag20('div', '.class');
              tag20('div', '#id', '.class');
              tag20('div', '#id', '.class1', '.class2');
              tag20('div', '#id', '.class1', '.class2', '.class3');
              tag20('span', 1);
              tag20('div', '#id', 1);
              tag20('div', '.class', 1);
              tag20('div', '#id', '.class', 1);
              tag20('div', '#id', '.class1', '.class2', 1);
              tag20('div', '#id', '.class1', '.class2', '.class3', 1);
              tag20('span', 'a');
              tag20('div', '#id', 'a');
              tag20('div', '.class', 'a');
              tag20('div', '#id', '.class', 'a');
              tag20('div', '#id', '.class1', '.class2', 'a');
              tag20('div', '#id', '.class1', '.class2', '.class3', 'a');
          }
      })
      .add('tag v2.1', () => {
          for (let i = 0; i < 100; i++) {
              tag21('span');
              tag21('div', '#id');
              tag21('div', '.class');
              tag21('div', '#id', '.class');
              tag21('div', '#id', '.class1', '.class2');
              tag21('div', '#id', '.class1', '.class2', '.class3');
              tag21('span', 1);
              tag21('div', '#id', 1);
              tag21('div', '.class', 1);
              tag21('div', '#id', '.class', 1);
              tag21('div', '#id', '.class1', '.class2', 1);
              tag21('div', '#id', '.class1', '.class2', '.class3', 1);
              tag21('span', 'a');
              tag21('div', '#id', 'a');
              tag21('div', '.class', 'a');
              tag21('div', '#id', '.class', 'a');
              tag21('div', '#id', '.class1', '.class2', 'a');
              tag21('div', '#id', '.class1', '.class2', '.class3', 'a');
          }
      })
      .add('tag v2.2', () => {
          for (let i = 0; i < 100; i++) {
              tag22('span');
              tag22('div', '#id');
              tag22('div', '.class');
              tag22('div', '#id', '.class');
              tag22('div', '#id', '.class1', '.class2');
              tag22('div', '#id', '.class1', '.class2', '.class3');
              tag22('span', 1);
              tag22('div', '#id', 1);
              tag22('div', '.class', 1);
              tag22('div', '#id', '.class', 1);
              tag22('div', '#id', '.class1', '.class2', 1);
              tag22('div', '#id', '.class1', '.class2', '.class3', 1);
              tag22('span', 'a');
              tag22('div', '#id', 'a');
              tag22('div', '.class', 'a');
              tag22('div', '#id', '.class', 'a');
              tag22('div', '#id', '.class1', '.class2', 'a');
              tag22('div', '#id', '.class1', '.class2', '.class3', 'a');
          }
      })
      .add('tag v2.3', () => {
          for (let i = 0; i < 100; i++) {
              tag23('span');
              tag23('div', '#id');
              tag23('div', '.class');
              tag23('div', '#id', '.class');
              tag23('div', '#id', '.class1', '.class2');
              tag23('div', '#id', '.class1', '.class2', '.class3');
              tag23('span', 1);
              tag23('div', '#id', 1);
              tag23('div', '.class', 1);
              tag23('div', '#id', '.class', 1);
              tag23('div', '#id', '.class1', '.class2', 1);
              tag23('div', '#id', '.class1', '.class2', '.class3', 1);
              tag23('span', 'a');
              tag23('div', '#id', 'a');
              tag23('div', '.class', 'a');
              tag23('div', '#id', '.class', 'a');
              tag23('div', '#id', '.class1', '.class2', 'a');
              tag23('div', '#id', '.class1', '.class2', '.class3', 'a');
          }
      })
      .add('tag v3.0', () => {
          for (let i = 0; i < 100; i++) {
              tag30('span');
              tag30('div', 'id');
              tag30('div', _, 'class');
              tag30('div', 'id', 'class');
              tag30('div', 'id', ['class1', 'class2']);
              tag30('div', 'id', ['class1', 'class2', 'class3']);
              tag30('span', _, _, 1);
              tag30('div', 'id', _, 1);
              tag30('div', _, 'class', 1);
              tag30('div', 'id', 'class', 1);
              tag30('div', 'id', ['class1', 'class2'], 1);
              tag30('div', 'id', ['class1', 'class2', 'class3'], 1);
              tag30('span', _, _, 'a');
              tag30('div', 'id', _, 'a');
              tag30('div', _, 'class', 'a');
              tag30('div', 'id', 'class', 'a');
              tag30('div', 'id', ['class1', 'class2'], 'a');
              tag30('div', 'id', ['class1', 'class2', 'class3'], 'a');
          }
      })
      .add('tag v3.1', () => {
          for (let i = 0; i < 100; i++) {
              tag31('span');
              tag31('div', 'id');
              tag31('div', _, ['class']);
              tag31('div', 'id', ['class']);
              tag31('div', 'id', ['class1', 'class2']);
              tag31('div', 'id', ['class1', 'class2', 'class3']);
              tag31('span', _, _, 1);
              tag31('div', 'id', _, 1);
              tag31('div', _, ['class'], 1);
              tag31('div', 'id', ['class'], 1);
              tag31('div', 'id', ['class1', 'class2'], 1);
              tag31('div', 'id', ['class1', 'class2', 'class3'], 1);
              tag31('span', _, _, 'a');
              tag31('div', 'id', _, 'a');
              tag31('div', _, ['class'], 'a');
              tag31('div', 'id', ['class'], 'a');
              tag31('div', 'id', ['class1', 'class2'], 'a');
              tag31('div', 'id', ['class1', 'class2', 'class3'], 'a');
          }
      })
      .add('tag v3.2', () => {
          for (let i = 0; i < 100; i++) {
              tag32('span');
              tag32('div', 'id');
              tag32('div', _, 'class');
              tag32('div', 'id', 'class');
              tag32('div', 'id', 'class1 class2');
              tag32('div', 'id', 'class1 class2 class3');
              tag32('span', _, _, 1);
              tag32('div', 'id', _, 1);
              tag32('div', _, 'class', 1);
              tag32('div', 'id', 'class', 1);
              tag32('div', 'id', 'class1 class2', 1);
              tag32('div', 'id', 'class1 class2 class3', 1);
              tag32('span', _, _, 'a');
              tag32('div', 'id', _, 'a');
              tag32('div', _, 'class', 'a');
              tag32('div', 'id', 'class', 'a');
              tag32('div', 'id', 'class1 class2', 'a');
              tag32('div', 'id', 'class1 class2 class3', 'a');
          }
      })
      .add('tag v4.0', () => {
          for (let i = 0; i < 100; i++) {
              tag40('span');
              tag40('div', 'id');
              tag40('div', _, {class: 1});
              tag40('div', 'id', {class: 1});
              tag40('div', 'id', {class1: 1, class2: 1});
              tag40('div', 'id', {class1: 1, class2: 1, class3: 1});
              tag40('span', _, _, 1);
              tag40('div', 'id', _, 1);
              tag40('div', _, {class: 1}, 1);
              tag40('div', 'id', {class: 1}, 1);
              tag40('div', 'id', {class1: 1, class2: 1}, 1);
              tag40('div', 'id', {class1: 1, class2: 1, class3: 1}, 1);
              tag40('span', _, _, 'a');
              tag40('div', 'id', _, 'a');
              tag40('div', _, {class: 1}, 'a');
              tag40('div', 'id', {class: 1}, 'a');
              tag40('div', 'id', {class1: 1, class2: 1}, 'a');
              tag40('div', 'id', {class1: 1, class2: 1, class3: 1}, 'a');
          }
      })
      .add('tag v4.1', () => {
          for (let i = 0; i < 100; i++) {
              tag41('span');
              tag41('div', 'id');
              tag41('div', _, {class: true});
              tag41('div', 'id', {class: true});
              tag41('div', 'id', {class1: true, class2: true});
              tag41('div', 'id', {class1: true, class2: true, class3: true});
              tag41('span', _, _, 1);
              tag41('div', 'id', _, 1);
              tag41('div', _, {class: true}, 1);
              tag41('div', 'id', {class: true}, 1);
              tag41('div', 'id', {class1: true, class2: true}, 1);
              tag41('div', 'id', {class1: true, class2: true, class3: true}, 1);
              tag41('span', _, _, 'a');
              tag41('div', 'id', _, 'a');
              tag41('div', _, {class: true}, 'a');
              tag41('div', 'id', {class: true}, 'a');
              tag41('div', 'id', {class1: true, class2: true}, 'a');
              tag41('div', 'id', {class1: true, class2: true, class3: true}, 'a');
          }
      })
      .add('tag v5.0', () => {
          for (let i = 0; i < 100; i++) {
              tag50('span');
              tag50('div', 'id');
              tag50('div', _, 'class');
              tag50('div', 'id', 'class');
              tag50('div', 'id', 'class1', 'class2');
              tag50('div', 'id', 'class1', 'class2', 'class3');
              key5(1);
              tag50('span');
              key5(1);
              tag50('div', 'id');
              key5(1);
              tag50('div', _, 'class');
              key5(1);
              tag50('div', 'id', 'class');
              key5(1);
              tag50('div', 'id', 'class1', 'class2');
              key5(1);
              tag50('div', 'id', 'class1', 'class2', 'class3');
              key5('a');
              tag50('span');
              key5('a');
              tag50('div', 'id');
              key5('a');
              tag50('div', _, 'class');
              key5('a');
              tag50('div', 'id', 'class');
              key5('a');
              tag50('div', 'id', 'class1', 'class2');
              key5('a');
              tag50('div', 'id', 'class1', 'class2', 'class3');
          }
      })
      .add('tag v5.1', () => {
          for (let i = 0; i < 100; i++) {
              tag51('span');
              tag51('div', 'id');
              tag51('div', _, 'class');
              tag51('div', 'id', 'class');
              tag51('div', 'id', 'class1', 'class2');
              tag51('div', 'id', 'class1', 'class2', 'class3');
              key5(1);
              tag51('span');
              key5();
              key5(1);
              tag51('div', 'id');
              key5();
              key5(1);
              tag51('div', _, 'class');
              key5();
              key5(1);
              tag51('div', 'id', 'class');
              key5();
              key5(1);
              tag51('div', 'id', 'class1', 'class2');
              key5();
              key5(1);
              tag51('div', 'id', 'class1', 'class2', 'class3');
              key5();
              key5('a');
              tag51('span');
              key5();
              key5('a');
              tag51('div', 'id');
              key5();
              key5('a');
              tag51('div', _, 'class');
              key5();
              key5('a');
              tag51('div', 'id', 'class');
              key5();
              key5('a');
              tag51('div', 'id', 'class1', 'class2');
              key5();
              key5('a');
              tag51('div', 'id', 'class1', 'class2', 'class3');
              key5();
          }
      })
      .add('tag v6.0', () => {
          s6;
          for (let i = 0; i < 100; i++) {
              tag60('span');
              tag60('div', 'id');
              tag60('div', _, 'class');
              tag60('div', 'id', 'class');
              tag60('div', 'id', 'class1', 'class2');
              tag60('div', 'id', 'class1', 'class2', 'class3');
              key5(1);
              tag60('span');
              key5();
              key5(1);
              tag60('div', 'id');
              key5();
              key5(1);
              tag60('div', _, 'class');
              key5();
              key5(1);
              tag60('div', 'id', 'class');
              key5();
              key5(1);
              tag60('div', 'id', 'class1', 'class2');
              key5();
              key5(1);
              tag60('div', 'id', 'class1', 'class2', 'class3');
              key5();
              key5('a');
              tag60('span');
              key5();
              key5('a');
              tag60('div', 'id');
              key5();
              key5('a');
              tag60('div', _, 'class');
              key5();
              key5('a');
              tag60('div', 'id', 'class');
              key5();
              key5('a');
              tag60('div', 'id', 'class1', 'class2');
              key5();
              key5('a');
              tag60('div', 'id', 'class1', 'class2', 'class3');
              key5();
          }
      })
      .add('tag v6.1', () => {
          for (let i = 0; i < 100; i++) {
              tag61('span');
              tag61('div', 'id');
              tag61('div', _, 'class');
              tag61('div', 'id', 'class');
              tag61('div', 'id', 'class1', 'class2');
              tag61('div', 'id', 'class1', 'class2', 'class3');
              key5(1);
              tag61('span');
              key5();
              key5(1);
              tag61('div', 'id');
              key5();
              key5(1);
              tag61('div', _, 'class');
              key5();
              key5(1);
              tag61('div', 'id', 'class');
              key5();
              key5(1);
              tag61('div', 'id', 'class1', 'class2');
              key5();
              key5(1);
              tag61('div', 'id', 'class1', 'class2', 'class3');
              key5();
              key5('a');
              tag61('span');
              key5();
              key5('a');
              tag61('div', 'id');
              key5();
              key5('a');
              tag61('div', _, 'class');
              key5();
              key5('a');
              tag61('div', 'id', 'class');
              key5();
              key5('a');
              tag61('div', 'id', 'class1', 'class2');
              key5();
              key5('a');
              tag61('div', 'id', 'class1', 'class2', 'class3');
              key5();
          }
      })
      .add('tag v6.2', () => {
          for (let i = 0; i < 100; i++) {
              tag62('span');
              tag62('div', 'id');
              tag62('div', _, 'class');
              tag62('div', 'id', 'class');
              tag62('div', 'id', 'class1', 'class2');
              tag62('div', 'id', 'class1', 'class2', 'class3');
              key5(1);
              tag62('span');
              key5();
              key5(1);
              tag62('div', 'id');
              key5();
              key5(1);
              tag62('div', _, 'class');
              key5();
              key5(1);
              tag62('div', 'id', 'class');
              key5();
              key5(1);
              tag62('div', 'id', 'class1', 'class2');
              key5();
              key5(1);
              tag62('div', 'id', 'class1', 'class2', 'class3');
              key5();
              key5('a');
              tag62('span');
              key5();
              key5('a');
              tag62('div', 'id');
              key5();
              key5('a');
              tag62('div', _, 'class');
              key5();
              key5('a');
              tag62('div', 'id', 'class');
              key5();
              key5('a');
              tag62('div', 'id', 'class1', 'class2');
              key5();
              key5('a');
              tag62('div', 'id', 'class1', 'class2', 'class3');
              key5();
          }
      }));
