const _ = undefined;

let attrs: Record<string, string | undefined>;

function attr1(name: string, val?: string) {
    attrs[name] = val;
}

function attr2(rec: Record<string, string | undefined>) {
    for (const name in rec) attrs[name] = rec[name];
}

import { bench } from './adapter';

bench(suite => suite
      .add('attr v1', () => {
          for (let i = 0; i < 100; i++) {
              attrs = {};
              attr1('id', 'a');
              attr1('value', 'some data');
              attr1('checked');
              attr1('data-key', 'some key');
              attr1('disabled');
          }
      })
      .add('attr v2', () => {
          for (let i = 0; i < 100; i++) {
              attrs = {};
              attr2({
                  id: 'a',
                  value: 'some data',
                  checked: _,
                  'data-key': 'some key',
                  disabled: _,
              });
          }
      }));
