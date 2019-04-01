type Classes1 = Record<string, boolean>;

function classes1(): Classes1 {
    return {};
}

function has_class1(classes: Classes1, name: string): boolean {
    return classes[name];
}

function has_class11(classes: Classes1, name: string): boolean {
    return name in classes;
}

function add_class1(classes: Classes1, name: string) {
    classes[name] = true;
}

function remove_class1(classes: Classes1, name: string) {
    delete classes[name];
}

function remove_class11(classes: Classes1, name: string) {
    classes[name] = undefined as unknown as boolean;
}

type Classes2 = string[];

function classes2(): Classes2 {
    return [];
}

function has_class2(classes: Classes2, name: string): boolean {
    return classes.indexOf(name) >= 0;
}

function add_class2(classes: Classes2, name: string) {
    if (classes.indexOf(name) < 0) {
        classes.push(name);
    }
}

function remove_class2(classes: Classes2, name: string) {
    const index = classes.indexOf(name);
    if (index >= 0) {
        classes.splice(index, 1);
    }
}

type Classes3 = { _: string };

function classes3(): Classes3 {
    return { _: "" };
}

function has_class3(classes: Classes3, name: string): boolean {
    return classes._.search('.' + name) >= 0;
}

function add_class3(classes: Classes3, name: string) {
    name = '.' + name;
    if (classes._.search(name) < 0) {
        classes._ += name;
    }
}

const EMPTY = '';

function remove_class3(classes: Classes3, name: string) {
    name = '.' + name;
    const index = classes._.search(name);
    if (index >= 0) {
        classes._ = classes._.replace(name, EMPTY);
    }
}

import { bench } from './adapter';

bench(suite => suite
      .add('classes v1', () => {
          const classes = classes1();
          for (let i = 0; i < 100; i++) {
              add_class1(classes, "some");
              if (has_class1(classes, "some")) {
                  add_class1(classes, "other");
              }
              add_class1(classes, "some");
              if (has_class1(classes, "other")) {
                  remove_class1(classes, "other");
              }
              add_class1(classes, "another");
              if (!has_class1(classes, "other")) {
                  add_class1(classes, "another");
                  add_class1(classes, "other");
                  add_class1(classes, "active");
              }
              remove_class1(classes, "invalid");
              add_class1(classes, "main");
              if (has_class1(classes, "main")) {
                  remove_class1(classes, "invalid");
                  remove_class1(classes, "front");
                  add_class1(classes, "nav");
                  add_class1(classes, "over");
                  remove_class1(classes, "nav");
              }
          }
      })
      .add('classes v1 has v1.1', () => {
          const classes = classes1();
          for (let i = 0; i < 100; i++) {
              add_class1(classes, "some");
              if (has_class11(classes, "some")) {
                  add_class1(classes, "other");
              }
              add_class1(classes, "some");
              if (has_class11(classes, "other")) {
                  remove_class1(classes, "other");
              }
              add_class1(classes, "another");
              if (!has_class11(classes, "other")) {
                  add_class1(classes, "another");
                  add_class1(classes, "other");
                  add_class1(classes, "active");
              }
              remove_class1(classes, "invalid");
              add_class1(classes, "main");
              if (has_class11(classes, "main")) {
                  remove_class1(classes, "invalid");
                  remove_class1(classes, "front");
                  add_class1(classes, "nav");
                  add_class1(classes, "over");
                  remove_class1(classes, "nav");
              }
          }
      })
      .add('classes v1 remove v1.1', () => {
          const classes = classes1();
          for (let i = 0; i < 100; i++) {
              add_class1(classes, "some");
              if (has_class1(classes, "some")) {
                  add_class1(classes, "other");
              }
              add_class1(classes, "some");
              if (has_class1(classes, "other")) {
                  remove_class11(classes, "other");
              }
              add_class1(classes, "another");
              if (!has_class1(classes, "other")) {
                  add_class1(classes, "another");
                  add_class1(classes, "other");
                  add_class1(classes, "active");
              }
              remove_class11(classes, "invalid");
              add_class1(classes, "main");
              if (has_class1(classes, "main")) {
                  remove_class11(classes, "invalid");
                  remove_class11(classes, "front");
                  add_class1(classes, "nav");
                  add_class1(classes, "over");
                  remove_class11(classes, "nav");
              }
          }
      })
      .add('classes v2', () => {
          const classes = classes2();
          for (let i = 0; i < 100; i++) {
              add_class2(classes, "some");
              if (has_class2(classes, "some")) {
                  add_class2(classes, "other");
              }
              add_class2(classes, "some");
              if (has_class2(classes, "other")) {
                  remove_class2(classes, "other");
              }
              add_class2(classes, "another");
              if (!has_class2(classes, "other")) {
                  add_class2(classes, "another");
                  add_class2(classes, "other");
                  add_class2(classes, "active");
              }
              remove_class2(classes, "invalid");
              add_class2(classes, "main");
              if (has_class2(classes, "main")) {
                  remove_class2(classes, "invalid");
                  remove_class2(classes, "front");
                  add_class2(classes, "nav");
                  add_class2(classes, "over");
                  remove_class2(classes, "nav");
              }
          }
      })
      .add('classes v3', () => {
          const classes = classes3();
          for (let i = 0; i < 100; i++) {
              add_class3(classes, "some");
              if (has_class3(classes, "some")) {
                  add_class3(classes, "other");
              }
              add_class3(classes, "some");
              if (has_class3(classes, "other")) {
                  remove_class3(classes, "other");
              }
              add_class3(classes, "another");
              if (!has_class3(classes, "other")) {
                  add_class3(classes, "another");
                  add_class3(classes, "other");
                  add_class3(classes, "active");
              }
              remove_class3(classes, "invalid");
              add_class3(classes, "main");
              if (has_class3(classes, "main")) {
                  remove_class3(classes, "invalid");
                  remove_class3(classes, "front");
                  add_class3(classes, "nav");
                  add_class3(classes, "over");
                  remove_class3(classes, "nav");
              }
          }
      }));
