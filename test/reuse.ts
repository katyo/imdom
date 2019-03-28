import { ok, strictEqual as se, deepStrictEqual as dse } from 'assert';
import { Op, Segment, Reconciler, use_nodes, reuse_node, push_node, reconcile } from '../src/index';

type Node = number;

function match(node: Node, ctx: Node) {
    return node == ctx;
}

function nth<T>(state: Reconciler<T>, i: number): Segment<T> | undefined {
    let s = state.s;
    for (; s && i; s = s.n!, i--);
    return s;
}

function lth<T>(state: Reconciler<T>, i: number): Segment<T> | undefined {
    let d = state.a;
    for (; d && i; d = d.a!, i--);
    return d;
}

//const echo = console.log;
const echo = (..._: any[]) => {};

function replace(node: Node, rep: Node, list: Node[]) {
    remove_if_exists(node, list);
    echo('replace', rep, 'by', node);
    list.splice(list.indexOf(rep), 1, node);
}

function prepend(node: Node, ref: Node, list: Node[]) {
    remove_if_exists(node, list);
    echo('prepend', node, 'before', ref);
    list.splice(list.indexOf(ref), 0, node);
}

function append(node: Node, ref: Node | undefined, list: Node[]) {
    remove_if_exists(node, list);
    if (ref) {
        echo('append', node, 'after', ref);
        list.splice(list.indexOf(ref) + 1, 0, node);
    } else {
        echo('append', node, 'at end');
        list.push(node);
    }
}

function remove(node: Node, list: Node[]) {
    echo('remove', node);
    remove_if_exists(node, list);
}

function remove_if_exists(node: Node, list: Node[]) {
    const idx = list.indexOf(node);
    if (idx >= 0) list.splice(idx, 1);
}

function apply(state: Reconciler<Node>, nodes: Node[]) {
    reconcile(state, replace, prepend, append, remove, nodes);
}

describe('reconciler', () => {
    let nodes: Node[];
    let state: Reconciler<Node>;

    beforeEach(() => {
        nodes = [1, 2, 3, 4, 5, 6, 7];
        state = use_nodes(nodes.slice(0));
    });

    describe('reuse_node', () => {
        describe('single', () => {
            it('none', () => {
                const node1 = reuse_node(state, match, 8, true);

                ok(!node1);
                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6, 7]);
                console.log(state.c);
                se(nth(state, 1), void 0);
                se(lth(state, 0), void 0);

                apply(state, nodes);
                dse(nodes, []);
            });

            it('first', () => {
                const node1 = reuse_node(state, match, 1, true);

                ok(node1);
                se(node1, 1);
                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [2, 3, 4, 5, 6, 7]);
                console.log(state.c);
                se(nth(state, 2), void 0);
                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [1]);
            });

            it('second', () => {
                const node1 = reuse_node(state, match, 2, true);

                ok(node1);
                se(node1, 2);
                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [2]);
                se(nth(state, 2)!.t, Op.Remove);
                dse(nth(state, 2)!._, [3, 4, 5, 6, 7]);
                se(nth(state, 3), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [2]);
            });

            it('third', () => {
                const node1 = reuse_node(state, match, 3, true);

                ok(node1);
                se(node1, 3);
                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [3]);
                se(nth(state, 2)!.t, Op.Remove);
                dse(nth(state, 2)!._, [4, 5, 6, 7]);
                se(nth(state, 3), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [3]);
            });

            it('last', () => {
                const node1 = reuse_node(state, match, 7, true);

                ok(node1);
                se(node1, 7);
                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [7]);
                se(nth(state, 2), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [7]);
            });
        });

        describe('multiple', () => {
            describe('forward', () => {
                it('first and second', () => {
                    const node1 = reuse_node(state, match, 1, true);
                    const node2 = reuse_node(state, match, 2, true);

                    ok(node1);
                    se(node1, 1);
                    ok(node2);
                    se(node2, 2);
                    se(nth(state, 0)!.t, Op.Update);
                    dse(nth(state, 0)!._, [1, 2]);
                    se(nth(state, 1)!.t, Op.Remove);
                    dse(nth(state, 1)!._, [3, 4, 5, 6, 7]);
                    se(nth(state, 2), void 0);
                    se(lth(state, 0), nth(state, 0));
                    se(lth(state, 1), void 0);

                    apply(state, nodes);
                    dse(nodes, [1, 2]);
                });

                it('second and third', () => {
                    const node1 = reuse_node(state, match, 2, true);
                    const node2 = reuse_node(state, match, 3, true);

                    ok(node1);
                    se(node1, 2);
                    ok(node2);
                    se(node2, 3);
                    se(nth(state, 0)!.t, Op.Remove);
                    dse(nth(state, 0)!._, [1]);
                    se(nth(state, 1)!.t, Op.Update);
                    dse(nth(state, 1)!._, [2, 3]);
                    se(nth(state, 2)!.t, Op.Remove);
                    dse(nth(state, 2)!._, [4, 5, 6, 7]);
                    se(nth(state, 3), void 0);
                    se(lth(state, 0), nth(state, 1));
                    se(lth(state, 1), void 0);

                    apply(state, nodes);
                    dse(nodes, [2, 3]);
                });

                it('penult and last', () => {
                    const node1 = reuse_node(state, match, 6, true);
                    const node2 = reuse_node(state, match, 7, true);

                    ok(node1);
                    se(node1, 6);
                    ok(node2);
                    se(node2, 7);
                    se(nth(state, 0)!.t, Op.Remove);
                    dse(nth(state, 0)!._, [1, 2, 3, 4, 5]);
                    se(nth(state, 1)!.t, Op.Update);
                    dse(nth(state, 1)!._, [6, 7]);
                    se(nth(state, 2), void 0);
                    se(lth(state, 0), nth(state, 1));
                    se(lth(state, 1), void 0);

                    apply(state, nodes);
                    dse(nodes, [6, 7]);
                });

                it('first and last', () => {
                    const node1 = reuse_node(state, match, 1, true);
                    const node2 = reuse_node(state, match, 7, true);

                    ok(node1);
                    se(node1, 1);
                    ok(node2);
                    se(node2, 7);
                    se(nth(state, 0)!.t, Op.Update);
                    dse(nth(state, 0)!._, [1]);
                    se(nth(state, 1)!.t, Op.Remove);
                    dse(nth(state, 1)!._, [2, 3, 4, 5, 6]);
                    se(nth(state, 2)!.t, Op.Update);
                    dse(nth(state, 2)!._, [7]);
                    se(nth(state, 3), void 0);
                    se(lth(state, 0), nth(state, 0));
                    se(lth(state, 1), nth(state, 2));
                    se(lth(state, 2), void 0);

                    apply(state, nodes);
                    dse(nodes, [1, 7]);
                });
            });

            describe('backward', () => {
                it('second and first', () => {
                    const node1 = reuse_node(state, match, 2, true);
                    const node2 = reuse_node(state, match, 1, true);

                    ok(node1);
                    se(node1, 2);
                    ok(node2);
                    se(node2, 1);
                    se(nth(state, 0)!.t, Op.Update);
                    dse(nth(state, 0)!._, [1]);
                    se(nth(state, 1)!.t, Op.Update);
                    dse(nth(state, 1)!._, [2]);
                    se(nth(state, 2)!.t, Op.Remove);
                    dse(nth(state, 2)!._, [3, 4, 5, 6, 7]);
                    se(nth(state, 3), void 0);
                    se(lth(state, 0), nth(state, 1));
                    se(lth(state, 1), nth(state, 0));
                    se(lth(state, 2), void 0);

                    apply(state, nodes);
                    dse(nodes, [2, 1]);
                });

                it('third and second', () => {
                    const node1 = reuse_node(state, match, 3, true);
                    const node2 = reuse_node(state, match, 2, true);

                    ok(node1);
                    se(node1, 3);
                    ok(node2);
                    se(node2, 2);
                    se(nth(state, 0)!.t, Op.Remove);
                    dse(nth(state, 0)!._, [1]);
                    se(nth(state, 1)!.t, Op.Update);
                    dse(nth(state, 1)!._, [2]);
                    se(nth(state, 2)!.t, Op.Update);
                    dse(nth(state, 2)!._, [3]);
                    se(nth(state, 3)!.t, Op.Remove);
                    dse(nth(state, 3)!._, [4, 5, 6, 7]);
                    se(nth(state, 4), void 0);
                    se(lth(state, 0), nth(state, 2));
                    se(lth(state, 1), nth(state, 1));
                    se(lth(state, 2), void 0);

                    apply(state, nodes);
                    dse(nodes, [3, 2]);
                });

                it('last and penult', () => {
                    const node1 = reuse_node(state, match, 7, true);
                    const node2 = reuse_node(state, match, 6, true);

                    ok(node1);
                    se(node1, 7);
                    ok(node2);
                    se(node2, 6);
                    se(nth(state, 0)!.t, Op.Remove);
                    dse(nth(state, 0)!._, [1, 2, 3, 4, 5]);
                    se(nth(state, 1)!.t, Op.Update);
                    dse(nth(state, 1)!._, [6]);
                    se(nth(state, 2)!.t, Op.Update);
                    dse(nth(state, 2)!._, [7]);
                    se(nth(state, 3), void 0);
                    se(lth(state, 0), nth(state, 2));
                    se(lth(state, 1), nth(state, 1));
                    se(lth(state, 2), void 0);

                    apply(state, nodes);
                    dse(nodes, [7, 6]);
                });

                it('last and first', () => {
                    const node1 = reuse_node(state, match, 7, true);
                    const node2 = reuse_node(state, match, 1, true);

                    ok(node1);
                    se(node1, 7);
                    ok(node2);
                    se(node2, 1);
                    se(nth(state, 0)!.t, Op.Update);
                    dse(nth(state, 0)!._, [1]);
                    se(nth(state, 1)!.t, Op.Remove);
                    dse(nth(state, 1)!._, [2, 3, 4, 5, 6]);
                    se(nth(state, 2)!.t, Op.Update);
                    dse(nth(state, 2)!._, [7]);
                    se(nth(state, 3), void 0);
                    se(lth(state, 0), nth(state, 2));
                    se(lth(state, 1), nth(state, 0));
                    se(lth(state, 2), void 0);

                    apply(state, nodes);
                    dse(nodes, [7, 1]);
                });
            });
        });
    });

    describe('push_node', () => {
        describe('single', () => {
            it('insert', () => {
                push_node(state, 8);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6, 7]);
                se(nth(state, 1), void 0);
                se(lth(state, 0)!.t, Op.Insert);
                dse(lth(state, 0)!._, [8]);
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [8]);
            });

            it('insert after first reuse', () => {
                reuse_node(state, match, 1, true);
                push_node(state, 8);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [2, 3, 4, 5, 6, 7]);
                se(nth(state, 2), void 0);
                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [1, 8]);
            });

            it('insert after second reuse', () => {
                reuse_node(state, match, 2, true);
                push_node(state, 8);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [2]);
                se(nth(state, 2)!.t, Op.Remove);
                dse(nth(state, 2)!._, [3, 4, 5, 6, 7]);
                se(nth(state, 3), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [2, 8]);
            });

            it('insert before last reuse', () => {
                push_node(state, 8);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [7]);
                se(nth(state, 2), void 0);

                se(lth(state, 0)!.t, Op.Insert);
                dse(lth(state, 0)!._, [8]);
                se(lth(state, 1), nth(state, 1));
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [8, 7]);
            });

            it('insert after last reuse', () => {
                reuse_node(state, match, 7, true);
                push_node(state, 8);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [7]);
                se(nth(state, 2), void 0);

                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [7, 8]);
            });
        });

        describe('multiple', () => {
            it('insert two', () => {
                push_node(state, 8);
                push_node(state, 9);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5, 6, 7]);
                se(nth(state, 1), void 0);
                se(lth(state, 0)!.t, Op.Insert);
                dse(lth(state, 0)!._, [8, 9]);
                se(lth(state, 1), void 0);

                apply(state, nodes);
                dse(nodes, [8, 9]);
            });

            it('insert two after first reuse', () => {
                reuse_node(state, match, 1, true);
                push_node(state, 9);
                push_node(state, 8);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [2, 3, 4, 5, 6, 7]);
                se(nth(state, 2), void 0);
                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [9, 8]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [1, 9, 8]);
            });

            it('insert two after two second reuse', () => {
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                push_node(state, 9);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [2, 3]);
                se(nth(state, 2)!.t, Op.Remove);
                dse(nth(state, 2)!._, [4, 5, 6, 7]);
                se(nth(state, 3), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [2, 3, 8, 9]);
            });

            it('insert two after two last reuse', () => {
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);
                push_node(state, 8);
                push_node(state, 9);

                se(nth(state, 0)!.t, Op.Remove);
                dse(nth(state, 0)!._, [1, 2, 3, 4, 5]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [6, 7]);
                se(nth(state, 2), void 0);
                se(lth(state, 0), nth(state, 1));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), void 0);

                apply(state, nodes);
                dse(nodes, [6, 7, 8, 9]);
            });

            it('insert single in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                reuse_node(state, match, 4, true);
                reuse_node(state, match, 5, true);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2, 3]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [4, 5, 6, 7]);
                se(nth(state, 2), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8]);
                se(lth(state, 2), nth(state, 1));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 3, 8, 4, 5, 6, 7]);
            });

            it('insert twice in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 4, true);
                reuse_node(state, match, 5, true);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2, 3]);
                se(nth(state, 1)!.t, Op.Update);
                dse(nth(state, 1)!._, [4, 5, 6, 7]);
                se(nth(state, 2), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), nth(state, 1));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 3, 8, 9, 4, 5, 6, 7]);
            });

            it('replace single in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                reuse_node(state, match, 5, true);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2, 3]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [4]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [5, 6, 7]);
                se(nth(state, 3), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8]);
                se(lth(state, 2), nth(state, 2));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 3, 8, 5, 6, 7]);
            });

            it('replace twice in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2, 3]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [4, 5]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [6, 7]);
                se(nth(state, 3), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), nth(state, 2));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 3, 8, 9, 6, 7]);
            });

            it('remove single and replace twice in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [3, 4, 5]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [6, 7]);
                se(nth(state, 3), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), nth(state, 2));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 8, 9, 6, 7]);
            });

            it('replace and insert in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 3, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 5, true);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2, 3]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [4]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [5, 6, 7]);
                se(nth(state, 3), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1)!.t, Op.Insert);
                dse(lth(state, 1)!._, [8, 9]);
                se(lth(state, 2), nth(state, 2));
                se(lth(state, 3), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 3, 8, 9, 5, 6, 7]);
            });

            it('move single and replace twice in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 5, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 6, true);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [3, 4]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [5]);
                se(nth(state, 3)!.t, Op.Update);
                dse(nth(state, 3)!._, [6, 7]);
                se(nth(state, 4), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1), nth(state, 2));
                se(lth(state, 2)!.t, Op.Insert);
                dse(lth(state, 2)!._, [8, 9]);
                se(lth(state, 3), nth(state, 3));
                se(lth(state, 4), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 5, 8, 9, 6, 7]);
            });

            it('move twice and replace twice in the middle', () => {
                reuse_node(state, match, 1, true);
                reuse_node(state, match, 2, true);
                reuse_node(state, match, 5, true);
                reuse_node(state, match, 6, true);
                push_node(state, 8);
                push_node(state, 9);
                reuse_node(state, match, 7, true);

                se(nth(state, 0)!.t, Op.Update);
                dse(nth(state, 0)!._, [1, 2]);
                se(nth(state, 1)!.t, Op.Remove);
                dse(nth(state, 1)!._, [3, 4]);
                se(nth(state, 2)!.t, Op.Update);
                dse(nth(state, 2)!._, [5, 6]);
                se(nth(state, 3)!.t, Op.Update);
                dse(nth(state, 3)!._, [7]);
                se(nth(state, 4), void 0);

                se(lth(state, 0), nth(state, 0));
                se(lth(state, 1), nth(state, 2));
                se(lth(state, 2)!.t, Op.Insert);
                dse(lth(state, 2)!._, [8, 9]);
                se(lth(state, 3), nth(state, 3));
                se(lth(state, 4), void 0);

                apply(state, nodes);
                dse(nodes, [1, 2, 5, 6, 8, 9, 7]);
            });
        });
    });
});
