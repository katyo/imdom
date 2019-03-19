import { NULL } from './utils';

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
    s: SegmentRef<T>;
    /** First destination segment */
    a: SegmentRef<T>;
    /** Last destination segment */
    b: SegmentRef<T>;
    /** Current reusing segment */
    c: SegmentRef<T>;
}

/** Reconciliation segment */
export interface Segment<T> {
    /** Segment kind */
    t: Op,
    /** Next source segment */
    n: SegmentRef<T>;
    /** Previous source segment */
    p: SegmentRef<T>;
    /** Next destination segment */
    a: SegmentRef<T>;
    /** Previous destination segment */
    b: SegmentRef<T>;
    /** Associated nodes */
    _: T[];
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
    return segment.t == Op.Insert;
}

/** Segment contains nodes which should be reused */
function is_update<T>(segment: Segment<T>): boolean {
    return segment.t == Op.Update;
}

/** Segment contains nodes which should be removed */
function is_remove<T>(segment: Segment<T>): boolean {
    return segment.t == Op.Remove;
}

/** Wrap nodes to segment */
function to_segment<T>(nodes: T[], op: Op): Segment<T> {
    return { // create new segment
        t: op, // set segment operation
        n: NULL, // clear reference to next source segment
        p: NULL, // clear reference to previous source segment
        a: NULL, // clear reference to next destination segment
        b: NULL, // clear reference to previous destination segment
        _: nodes, // set list of segment nodes
    };
}

/** Initialize reconciler */
export function use_nodes<T>(nodes: T[]): Reconciler<T> {
    return {
        s: to_segment( // set first source segment
            nodes, // use all nodes as segment nodes
            Op.Remove, // mark segment to remove
        ),
        a: NULL, // clear reference to first destination segment
        b: NULL, // clear reference to last destination segment
        c: NULL, // clear reference to current reusing segment
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
        p, // previous segment
        _, // segment nodes
        _: {
            length: l // number of segment nodes
        }
    } = c;
    
    let d: Segment<T> | void; // new segment which contains reused node
    
    if (i) { // when node isn't first
        if (i == l - 1) { // when node is last
            append_src(state, d = to_segment( // create new segment for reused node
                [_.pop()!], // set last node only
                Op.Update, // mark as reused
            ), c); // append segment to current
        } else { // when node isn't last
            c._ = _.slice(0, i); // set current nodes before reused only
            
            append_src(state, d = to_segment( // create new segment for reused node
                _.slice(i, i + 1), // put reused node only
                Op.Update, // mark as reused
            ), c); // append segment to current
            
            append_src(state, to_segment( // create new segment for removed nodes after reused node
                _.slice(i + 1), // put nodes after reused node only
                Op.Remove, // mark as removed
            ), d); // append end segment to new
        }
    } else { // when node is first
        if (p // when has previous segment
            && is_update(p) // which is reusing
           ) {
            p._.push(c._.shift()!); // simply move node to previous segment
            
            if (l < 2) { // when only one node in segment
                remove_src(state, c); // remove current segment
            }
        } else { // when at first segment
            if (l > 1) { // when more than one node in segment
                prepend_src(state, d = to_segment( // create new segment for reused node
                    [_.shift()!], // put first node only
                    Op.Update, // mark as reused
                ), c);
            } else { // when only one node in segment
                c.t = Op.Update; // mark as reused
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
    let c: SegmentRef<T> = state.c || state.s; // start from current or first segment
    let e: SegmentRef<T>; // end at none segment
    let i: number; // node index
    let n: T | undefined;
    
    for (;;) {
        for (; c != e; c = c!.n) { // iterate over source segments
            if (is_remove(c!)) { // when segment is to remove
                for (i = 0; i < c!._.length; i++) { // iterate over nodes of segment
                    n = c!._[i]; // get current node
                    if (match(n, ctx)) { // when node is matched
                        split_segment(state, c!, i); // we intend to split segment
                        return n; // return reused node
                    } else if (!next) { // when node isn't matched and no need to search next
                        return;
                    }
                }
            }
        }
        
        if (state.c) { // when we have current reusing segment
            // iterate over source segments before current
            c = state.s; // start from first segment
            e = state.c; // use current segment as end
        } else {
            // break iteration
            break;
        }
    }
}

/** Insert new node */
export function push_node<T>(state: Reconciler<T>, node: T) {
    let {
        b: last, // last destination segment
    } = state;
    
    if (last // we have last destination segment
        && is_insert(last)) { // and it is marked to insert
        
        last._.push(node); // append node to last destination segment nodes
    } else {
        append_dst(state, to_segment( // create new destination segment
            [node], // put inserted node to segment nodes
            Op.Insert, // mark segment to insert
        ));
    }
}

export function reconcile<T, X>(state: Reconciler<T>, replace: (node: T, rep: T, ctx: X) => void, prepend: (node: T, ref: T, ctx: X) => void, append: (node: T, ref: T | undefined, ctx: X) => void, remove: (node: T, ctx: X) => void, ctx: X): T[] {
    // find heaviest reused segment to start optimization

    let i: number; // index of node
    let d: number; // number of source nodes to remove
    let n: number; // number of destination nodes to insert
    let l: number; // number of overlapped nodes
    
    let c: SegmentRef<T> = state.a; // current destination segment
    let h: SegmentRef<T>; // current easiest source segment
    
    for (; c; c = c.a) { // iterate over destination segments
        if (is_update(c) // when segment is reused
            && (!h || c._.length > h._.length) // and weight greater than previous
           ) {
            h = c; // set current segment as heaviest
        }
    }

    if (h) { // when heaviest reused segment found
        for (;;) {
            const {
                b, // previous destination segment
                a, // next destination segment
            } = h;
            
            const s = b && a ? // when we have previous and next destination segments
                (b._.length < a._.length ? b : a) : // select easiest segment to merge
                b ? b : a; // when we have previous destination segment
            
            if (!s) break; // nothing to merge, break loop

            i = 0; // initialize index of node
            n = s._.length; // number of nodes to insert
            l = 0; // no overlapped nodes
            
            if (!(is_update(s) && (b == s ? h.p == s : h.n == s))) { // when segment doesn't already merged by previous operations
                const o = s == b ? h.p : h.n; // get source segment
                
                if (o && is_remove(o)) { // when source segment marked to remove
                    // we intend to replace overlapped nodes
                    d = o._.length; // number of nodes to remove
                    l = Math.min(d, n); // number of overlapped nodes
                    
                    let o_ = o._; // get nodes to remove
                    
                    if (d > l) { // when we have extra nodes to remove
                        if (s == b) { // when merged segment before heaviest segment
                            // cut nodes from tail
                            o._ = o_.slice(0, l);
                            o_ = o_.slice(l);
                        } else { // when merged segment after heaviest segment
                            // cut nodes from head
                            o._ = o_.slice(l);
                            //o_ = o_.slice(0, l); // <-- no effect
                        }
                    } else {
                        remove_src(state, o); // remove empty segment
                    }
                    
                    for (; i < l; i++) { // iterate over overlapped nodes
                        replace(s._[i], o_[i], ctx); // replace overlapped node
                    }
                }

                if (n > l) { // when we have extra nodes to insert
                    // reference node to insert before
                    const r = s == b ? // when merged segment before heaviest segment
                        h._[0] : // insert extra nodes before first node of heaviest segment
                        // when merged segment after heaviest segment
                        h.n ? // when we have next segment
                        h.n._[0] : // insert extra nodes before first node of segment after heaviest
                        ( // when we haven't next element
                            append(s._[--n]!, h._[h._.length - 1]!, ctx), // append last inserting node
                            // exclude appended node from insertion
                            s._[n]! // use last node as reference for prepending
                        );
                    
                    for (; i < n; i++) { // iterate over extra nodes to insert
                        prepend(s._[i], r, ctx); // insert extra node before reference
                    }
                }
            }
            
            if (is_update(s)) { // when segment is in source
                remove_src(state, s); // remove merged source segment
            }
            remove_dst(state, s); // remove merged destination segment
            
            h._.splice(s == b ? 0 : h._.length, 0, ...s._); // merge nodes of segments
        }

        // remove nodes from source segments which marked to remove
        for (c = state.s; c; c = c.n) {
            if (is_remove(c)) { // when segment is marked to remove
                for (i = 0; i < c._.length; i++) { // iterate over nodes to remove
                    remove(c._[i], ctx);
                }
            }
        }
    } else { // when no reused segments found
        // we have enough simply replace old nodes by newly inserted

        const {
            s, // first source segment
            a, // first destination segment
        } = state;

        d = s ? s._.length : 0; // number of source nodes to remove
        n = a ? a._.length : 0; // number of destination nodes to append
        l = Math.min(d, n); // number of overlapped nodes

        for (i = 0; i < l; i++) { // iterate over overlapped nodes
            replace(a!._[i], s!._[i], ctx); // replace overlapped node
        }

        if (d > l) { // when we have extra source nodes to remove
            for (; i < d; i++) { // iterate over extra source nodes
                remove(s!._[i], ctx); // remove extra node
            }
        } else if (n > l) { // when we have extra destination nodes to append
            append(a!._[--n], a!._[i - 1], ctx); // append last node to end
            
            for (; i < n; i++) { // iterate over extra destination nodes
                prepend(a!._[i], a!._[n], ctx); // prepend extra node
            }
        }
    }

    return state.a ? state.a._ : [];
}

/** Insert new source segment before reference */
function prepend_src<T>(root: Reconciler<T>, item: Segment<T>, ref: Segment<T>) {
    if (ref.p) { // when reference segment has previous
        item.p = ref.p; // set previous of current to previous of reference
        ref.p.n = item; // set next of previous to current
    } else { // when reference segment is first
        root.s = item; // set first to current
    }
    ref.p = item; // set previous of reference to current
    item.n = ref; // set next of current to reference
}

/** Insert new source segment after reference */
function append_src<T>(_root: Reconciler<T>, item: Segment<T>, ref: Segment<T>) {
    if (ref.n) { // when reference segment has next
        ref.n.p = item; // set previous of next to current
        item.n = ref.n; // set next of current to next of reference
    }
    item.p = ref; // set previous of current to reference
    ref.n = item; // set next of reference to current
}

/** Remove source segment */
function remove_src<T>(root: Reconciler<T>, item: Segment<T>) {
    if (item.p) { // when current segment has previous
        item.p.n = item.n; // set next of previous to next of current
    } else { // when current segment is first
        root.s = item.n; // set next as first
    }
    if (item.n) { // when current segment has next
        item.n.p = item.p; // set previous of next to previous
    }
}

/** Append new destination segment to end */
function append_dst<T>(root: Reconciler<T>, item: Segment<T>) {
    const {
        b: last, // last destination segment
    } = root;
    
    if (last) {
        last.a = item; // set item as next for last
        item.b = last; // set last as previous for item
    } else {
        root.a = item; // set a first item
    }
    
    root.b = item; // set a last item
}

/** Remove destination segment */
function remove_dst<T>(root: Reconciler<T>, item: Segment<T>) {
    if (item.b) { // when current segment has previous
        item.b.a = item.a; // set next of previous to next of current
    } else { // when current segment is first
        root.a = item.a; // set next as first
    }
    if (item.a) { // when current segment has next
        item.a.b = item.b; // set previous of next to previous
    }
}
