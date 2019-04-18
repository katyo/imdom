/**
 * @module reuse
 */

import { TRACE_REUSE } from './decls';
import { NULL, trace } from './utils';

/*
  reconciliation:

  [a b c d e f g] -> [a b e f c g h]

  I. Rendering

  The main goal: produce program for reordering.

  (i - sequence offset, l - sequence length)

  1. [{i: 0, l: 1}]
  2. [{i: 0, l: 2}]
  3. [{i: 0, l: 2}, {i: 4, l: 1}]
  4. [{i: 0, l: 2}, {i: 4, l: 2}]
  5. [{i: 0, l: 2}, {i: 4, l: 2}, {i: 2, l: 1}]
  6. [{i: 0, l: 2}, {i: 4, l: 2}, {i: 2, l: 1}, {i: 6, l: 1}]
  7. [{i: 0, l: 2}, {i: 4, l: 2}, {i: 2, l: 1}, {i: 6, l: 1}, {l: 1}]

  II. Reordering

  The main goal: optimize reordering task by minimizing
  number of required DOM operations
  (such as insertBefore, removeChild, replaceChild).

  (i - position, l - weight)

  [2 1 3 4] -> [3 1 4 2]

  1. 1 -> _4
  2. 2 -> _]
*/

/*

  [a b c d e f] => [a c g e d f]

  [_ r _ i u]

  i - insert
  u - update
  r - remove

*/

/** Reconciliation state */
export interface Reconciler<T> {
    /** First source segment */
    $first_src: SegmentRef<T>;
    /** First destination segment */
    $first_dst: SegmentRef<T>;
    /** Last destination segment */
    $last_dst: SegmentRef<T>;
    /** Current reusing segment */
    $current: SegmentRef<T>;
}

/** Reconciliation segment */
export interface Segment<T> {
    /** Segment kind */
    $op: Op,
    /** Next source segment */
    $next_src: SegmentRef<T>;
    /** Previous source segment */
    $prev_src: SegmentRef<T>;
    /** Next destination segment */
    $next_dst: SegmentRef<T>;
    /** Previous destination segment */
    $prev_dst: SegmentRef<T>;
    /** Associated nodes */
    $nodes: T[];
}

/** Reconciliation segment operation

    TODO: try to determine operation using segments refs only
*/
export const enum Op {
    /** Segment contains inserted nodes */
    Insert,
    /** Segment contains reused nodes */
    Update,
    /** Segment contains removed nodes */
    Remove,
}

/** Reconciliation segment reference */
export type SegmentRef<T> = Segment<T> | undefined;

/** Segment contains nodes which should be inserted */
function is_insert<T>(segment: Segment<T>): boolean {
    return segment.$op == Op.Insert;
}

/** Segment contains nodes which should be reused */
function is_update<T>(segment: Segment<T>): boolean {
    return segment.$op == Op.Update;
}

/** Segment contains nodes which should be removed */
function is_remove<T>(segment: Segment<T>): boolean {
    return segment.$op == Op.Remove;
}

/** Wrap nodes to segment */
function to_segment<T>($nodes: T[], $op: Op): Segment<T> {
    return { // create new segment
        $op, // set segment operation
        $next_src: NULL, // clear reference to next source segment
        $prev_src: NULL, // clear reference to previous source segment
        $next_dst: NULL, // clear reference to next destination segment
        $prev_dst: NULL, // clear reference to previous destination segment
        $nodes, // set list of segment nodes
    };
}

/** Initialize reconciler */
export function use_nodes<T>(nodes: T[]): Reconciler<T> {
    const first = to_segment( // create first source segment
        nodes, // use all nodes as segment nodes
        Op.Remove, // mark segment to remove
    );
    return {
        $first_src: first, // set first source segment
        $first_dst: NULL, // clear reference to first destination segment
        $last_dst: NULL, // clear reference to last destination segment
        $current: first, // use first source segment as current
    };
}

/**
   Split current segment at specific node

   @param state Reconciler state
   @param p Previous segment when present
   @param c Current segment
   @param l Destination segment
   @param i Index of node to split at
*/
function split_segment<T>(state: Reconciler<T>, c: Segment<T>, i: number) {
    const {
        $last_dst, // last destination segment
    } = state;

    if (TRACE_REUSE) trace('split segment', c, i);

    const {
        $nodes, // segment nodes
        $nodes: {
            length: l // number of segment nodes
        }
    } = c;

    let d: Segment<T> | void; // new segment which contains reused node

    if (i) { // when node isn't first
        if (i == l - 1) { // when node is last
            append_src(state, d = to_segment( // create new segment for reused node
                [$nodes.pop()!], // set last node only
                Op.Update, // mark as reused
            ), c); // append segment to current
        } else { // when node isn't last
            c.$nodes = $nodes.slice(0, i); // set current nodes before reused only

            append_src(state, d = to_segment( // create new segment for reused node
                $nodes.slice(i, i + 1), // put reused node only
                Op.Update, // mark as reused
            ), c); // append segment to current

            append_src(state, to_segment( // create new segment for removed nodes after reused node
                $nodes.slice(i + 1), // put nodes after reused node only
                Op.Remove, // mark as removed
            ), d); // append end segment to new
        }
    } else { // when node is first
        if ($last_dst // when has last destination segment
            && is_update($last_dst) // and which is reusing
            && $last_dst.$next_src == c // and next source is current segment
           ) {
            $last_dst.$nodes.push($nodes.shift()!); // simply move node to previous destination segment

            if (l < 2) { // when only one node in segment
                remove_src(state, c); // remove current segment
            }
        } else { // when at first segment
            if (l > 1) { // when more than one node in segment
                prepend_src(state, d = to_segment( // create new segment for reused node
                    [$nodes.shift()!], // put first node only
                    Op.Update, // mark as reused
                ), c);
            } else { // when only one node in segment
                c.$op = Op.Update; // mark as reused
                d = c; // reuse segment
            }
        }
    }

    if (d) { // when we have new segment for reused node
        append_dst(state, d);
    }
}

/** Try to reuse node */
export function reuse_node<T, X>(state: Reconciler<T>, match: (node: T, ctx: X) => boolean | undefined, ctx: X, next: boolean): T | void {
    let c: SegmentRef<T> = state.$current; // start from current or first segment
    let e: SegmentRef<T>; // end at none segment
    let i: number; // node index
    let n: T | undefined;

    if (TRACE_REUSE) trace('reuse node', ctx, next);

    for (; c; ) {
        for (; c != e; c = c!.$next_src) { // iterate over source segments
            if (is_remove(c!)) { // when segment is to remove
                for (i = 0; i < c!.$nodes.length; i++) { // iterate over nodes of segment
                    n = c!.$nodes[i]; // get current node
                    if (match(n, ctx)) { // when node is matched
                        split_segment(state, c!, i); // we intend to split segment

                        c = state.$last_dst!.$next_src; // set current segment to next of last destination
                        if (c) { // when we have the next segment of last destination
                            e = c; // use it as end for second seeking loop
                            // run first seeking loop
                            for (; c && !is_remove(c!); c = c!.$next_src); // find next removing segment
                        } else {
                            e = NULL; // use none segment as end for second seeking loop
                        }
                        if (!c) { // when we haven't the next segment of last destination or first seeking loop failed
                            // run second seeking loop
                            for (c = state.$first_src; c != e && !is_remove(c!); c = c!.$next_src); // find next removing segment
                        }
                        state.$current = c; // set current segment to next removing
                        return n; // return reused node
                    } else if (!next) { // when node isn't matched and no need to search next
                        return;
                    }
                }
            }
        }

        if (state.$current == state.$first_src || e) { // when current reusing segment is first or second iteration
            break; // break iteration
        }

        // iterate over source segments before current
        c = state.$first_src; // start from first segment
        e = state.$current; // use current segment as end
    }
}

/** Insert new node */
export function push_node<T>(state: Reconciler<T>, node: T) {
    let {
        $last_dst, // last destination segment
    } = state;

    if (TRACE_REUSE) trace('push node', node);

    if ($last_dst // we have last destination segment
        && is_insert($last_dst)) { // and it is marked to insert

        $last_dst.$nodes.push(node); // append node to last destination segment nodes
    } else {
        append_dst(state, to_segment( // create new destination segment
            [node], // put inserted node to segment nodes
            Op.Insert, // mark segment to insert
        ));
    }
}

export function reconcile<T, X>(state: Reconciler<T>, replace: (node: T, rep: T, ctx: X) => void, prepend: (node: T, ref: T, ctx: X) => void, append: (node: T, ref: T | undefined, ctx: X) => void, remove: (node: T, ctx: X) => void, ctx: X): T[] {
    // find heaviest reused segment to start optimization

    if (TRACE_REUSE) {
        const nodes: T[] = [];
        let seg: Segment<T> | undefined;
        const src = [];
        for (seg = state.$first_src; seg; seg = seg.$next_src) {
            for (let i = 0; i < seg.$nodes.length; i++) {
                const node = seg.$nodes[i];
                let index = nodes.indexOf(node);
                if (index < 0) {
                    index = nodes.length;
                    nodes.push(node);
                }
                src.push((seg.$op == Op.Remove ? '-' : '') + index);
            }
        }
        const dst = [];
        for (seg = state.$first_dst; seg; seg = seg.$next_dst) {
            for (let i = 0; i < seg.$nodes.length; i++) {
                const node = seg.$nodes[i];
                let index = nodes.indexOf(node);
                if (index < 0) {
                    index = nodes.length;
                    nodes.push(node);
                }
                dst.push((seg.$op == Op.Insert ? '+' : '') + index);
            }
        }
        trace('reconcile', src.join(' '), '=>', dst.join(' '));
    }

    let i: number; // index of node
    let j: number; // helper index
    let d: number; // number of source nodes to remove
    let n: number; // number of destination nodes to insert
    let l: number; // number of overlapped nodes

    let c: SegmentRef<T> = state.$first_dst; // current destination segment
    let h: SegmentRef<T>; // current easiest source segment

    for (; c; c = c.$next_dst) { // iterate over destination segments
        if (is_update(c) // when segment is reused
            && (!h || c.$nodes.length > h.$nodes.length) // and weight greater than previous
           ) {
            h = c; // set current segment as heaviest
        }
    }

    if (h) { // when heaviest reused segment found
        const h_nodes = h.$nodes;

        for (;;) {
            const {
                $prev_dst, // previous destination segment
                $next_dst, // next destination segment
            } = h;

            const s = $prev_dst && $next_dst ? // when we have previous and next destination segments
                ($prev_dst.$nodes.length < $next_dst.$nodes.length ? $prev_dst : $next_dst) : // select easiest segment to merge
                $prev_dst ? $prev_dst : $next_dst; // when we have previous destination segment

            if (!s) break; // nothing to merge, break loop

            const s_nodes = s.$nodes; // segment nodes
            const p = s == $prev_dst; // when segment is before heaviest destination segment
            const u = is_update(s); // segment is for update

            i = 0; // initialize index of node
            n = s_nodes.length; // number of nodes to insert
            l = 0; // no overlapped nodes

            if (!(u && (p ? h.$prev_src == s : h.$next_src == s))) { // when segment doesn't already merged by previous operations
                const o = p ? h.$prev_src : h.$next_src; // get source segment

                if (o && is_remove(o)) { // when source segment marked to remove
                    let o_nodes = o.$nodes; // get nodes to remove

                    if (u && p ? o.$prev_src == s : o.$next_src == s) { // when reused nodes previous or next of removed
                        for (i = 0; i < o_nodes.length; i++) { // iterate over nodes to remove
                            remove(o_nodes[i], ctx); // remove segment node
                        }

                        remove_src(state, o); // remove empty segment
                        n = 0; // we doesn't need insert nodes now
                    } else {
                        // we intend to replace overlapped nodes
                        d = o.$nodes.length; // number of nodes to remove
                        l = Math.min(d, n); // number of overlapped nodes

                        if (d > l) { // when we have extra nodes to remove
                            if (p) { // when merged segment before heaviest segment
                                // cut nodes from tail
                                o.$nodes = o_nodes.slice(0, j = d - l);
                                o_nodes = o_nodes.slice(j);
                            } else { // when merged segment after heaviest segment
                                // cut nodes from head
                                o.$nodes = o_nodes.slice(l);
                                //o_ = o_.slice(0, l); // <-- no effect
                            }
                        } else {
                            remove_src(state, o); // remove empty segment
                        }

                        for (; i < l; i++) { // iterate over overlapped nodes
                            replace(s_nodes[i], o_nodes[i], ctx); // replace overlapped node
                        }
                    }
                }

                if (n > l) { // when we have extra nodes to insert
                    // reference node to insert before
                    const r = p ? // when merged segment before heaviest segment
                        h_nodes[0] : // insert extra nodes before first node of heaviest segment
                        // when merged segment after heaviest segment
                        h.$next_src ? // when we have next segment
                        h.$next_src.$nodes[0] : // insert extra nodes before first node of segment after heaviest
                        ( // when we haven't next segment
                            append(s_nodes[--n]!, o && l ? o.$nodes[l - 1] : h_nodes[h_nodes.length - 1], ctx), // append last inserting node
                            // exclude appended node from insertion
                            s_nodes[n]! // use last node as reference for prepending
                        );

                    for (; i < n; i++) { // iterate over extra nodes to insert
                        prepend(s_nodes[i], r, ctx); // insert extra node before reference
                    }
                }
            }

            if (u) { // when segment is in source
                remove_src(state, s); // remove merged source segment
            }
            remove_dst(state, s); // remove merged destination segment

            h_nodes.splice(p ? 0 : h_nodes.length, 0, ...s_nodes); // merge nodes of segments
        }

        // remove nodes from source segments which marked to remove
        for (c = state.$first_src; c; c = c.$next_src) {
            if (is_remove(c)) { // when segment is marked to remove
                for (i = 0; i < c.$nodes.length; i++) { // iterate over nodes to remove
                    remove(c.$nodes[i], ctx);
                }
            }
        }
    } else { // when no reused segments found
        // we have enough simply replace old nodes by newly inserted

        const {
            $first_src, // first source segment
            $first_dst, // first destination segment
        } = state;

        d = $first_src ? $first_src.$nodes.length : 0; // number of source nodes to remove
        n = $first_dst ? $first_dst.$nodes.length : 0; // number of destination nodes to append
        l = Math.min(d, n); // number of overlapped nodes

        for (i = 0; i < l; i++) { // iterate over overlapped nodes
            replace($first_dst!.$nodes[i], $first_src!.$nodes[i], ctx); // replace overlapped node
        }

        if (d > l) { // when we have extra source nodes to remove
            for (; i < d; i++) { // iterate over extra source nodes
                remove($first_src!.$nodes[i], ctx); // remove extra node
            }
        } else if (n > l) { // when we have extra destination nodes to append
            append($first_dst!.$nodes[--n], $first_dst!.$nodes[i - 1], ctx); // append last node to end

            for (; i < n; i++) { // iterate over extra destination nodes
                prepend($first_dst!.$nodes[i], $first_dst!.$nodes[n], ctx); // prepend extra node
            }
        }
    }

    return state.$first_dst ? state.$first_dst.$nodes : [];
}

/** Insert new source segment before reference */
function prepend_src<T>(root: Reconciler<T>, item: Segment<T>, ref: Segment<T>) {
    if (ref.$prev_src) { // when reference segment has previous
        item.$prev_src = ref.$prev_src; // set previous of current to previous of reference
        ref.$prev_src.$next_src = item; // set next of previous to current
    } else { // when reference segment is first
        root.$first_src = item; // set first to current
    }
    ref.$prev_src = item; // set previous of reference to current
    item.$next_src = ref; // set next of current to reference
}

/** Insert new source segment after reference */
function append_src<T>(_root: Reconciler<T>, item: Segment<T>, ref: Segment<T>) {
    if (ref.$next_src) { // when reference segment has next
        ref.$next_src.$prev_src = item; // set previous of next to current
        item.$next_src = ref.$next_src; // set next of current to next of reference
    }
    item.$prev_src = ref; // set previous of current to reference
    ref.$next_src = item; // set next of reference to current
}

/** Remove source segment */
function remove_src<T>(root: Reconciler<T>, item: Segment<T>) {
    if (item.$prev_src) { // when current segment has previous
        item.$prev_src.$next_src = item.$next_src; // set next of previous to next of current
    } else { // when current segment is first
        root.$first_src = item.$next_src; // set next as first
    }
    if (item.$next_src) { // when current segment has next
        item.$next_src.$prev_src = item.$prev_src; // set previous of next to previous
    }
}

/** Append new destination segment to end */
function append_dst<T>(root: Reconciler<T>, item: Segment<T>) {
    const {
        $last_dst, // last destination segment
    } = root;

    if ($last_dst) {
        $last_dst.$next_dst = item; // set item as next for last
        item.$prev_dst = $last_dst; // set last as previous for item
    } else {
        root.$first_dst = item; // set a first item
    }

    root.$last_dst = item; // set a last item
}

/** Remove destination segment */
function remove_dst<T>(root: Reconciler<T>, item: Segment<T>) {
    if (item.$prev_dst) { // when current segment has previous
        item.$prev_dst.$next_dst = item.$next_dst; // set next of previous to next of current
    } else { // when current segment is first
        root.$first_dst = item.$next_dst; // set next as first
    }
    if (item.$next_dst) { // when current segment has next
        item.$next_dst.$prev_dst = item.$prev_dst; // set previous of next to previous
    }
}
