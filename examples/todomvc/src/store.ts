const nothing: any = void 0;

export function change<T>(changes: Partial<T>): Over<T> {
    return state => ({ ...state, ...changes });
}

export function toggle<T extends Record<K, boolean>, K extends keyof T>(k: K): Over<T> {
    return state => ({ ...state, [k]: !state[k] });
}

export function adjust<T extends Record<K, number>, K extends keyof T>(k: K, d: number): Over<T> {
    return state => ({ ...state, [k]: state[k] + d });
}

export function remove<T extends Record<K, any>, K extends keyof T>(k: K): Over<T> {
    return state => (state = { ...state }, delete state[k], state);
}

export interface Listen<T, X = any> {
    (x: X, s: Store<T>): void;
}

export interface Store<T> {
    // get actual value
    g(): T;
    // put new value
    p(v: T): void;
}

export function get<T>(s: Store<T>): T {
    return s.g();
}

export function set<T>(s: Store<T>, v: T) {
    s.p(v);
}

export interface Over<T> {
    (v: T): T;
}

export function over<T>(s: Store<T>, f: Over<T>) {
    s.p(f(s.g()));
}

interface StoreImpl<T, X = any> extends Store<T> {
    v: T;
    x: X;
    u: Listen<T>;
    a: boolean;
}

export function store<T, X>(u: Listen<T>, x: X): Store<T> {
    return <StoreImpl<T>>{
        v: nothing,
        u, x,
        a: false,
        g: store_get,
        p: store_put,
    };
}

function store_get<T>(this: StoreImpl<T>): T {
    return this.v;
}

function store_put<T>(this: StoreImpl<T>, v: T) {
    this.v = v;

    if (!this.a) {
        this.a = true;
        this.u(this.x, this);
        this.a = false;
    }
}

interface LensStore<T, B> extends Store<T> {
    // base store
    b: Store<B>;
    // field path
    k: (keyof any)[];
}

export function lens<T, A extends keyof T>(s: Store<T>, a: A): Store<T[A]>;
export function lens<T, A extends keyof T, B extends keyof T[A]>(s: Store<T>, a: A, b: B): Store<T[A][B]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B]>(s: Store<T>, a: A, b: B, c: C): Store<T[A][B][C]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B], D extends keyof T[A][B][C]>(s: Store<T>, a: A, b: B, c: C, d: D): Store<T[A][B][C][D]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B], D extends keyof T[A][B][C], E extends keyof T[A][B][C][D]>(s: Store<T>, a: A, b: B, c: C, d: D, e: E): Store<T[A][B][C][D][E]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B], D extends keyof T[A][B][C], E extends keyof T[A][B][C][D], F extends keyof T[A][B][C][D][E]>(s: Store<T>, a: A, b: B, c: C, d: D, e: E, f: F): Store<T[A][B][C][D][E][F]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B], D extends keyof T[A][B][C], E extends keyof T[A][B][C][D], F extends keyof T[A][B][C][D][E], G extends keyof T[A][B][C][D][E][F]>(s: Store<T>, a: A, b: B, c: C, d: D, e: E, f: F, g: G): Store<T[A][B][C][D][E][F][G]>;
export function lens<T, A extends keyof T, B extends keyof T[A], C extends keyof T[A][B], D extends keyof T[A][B][C], E extends keyof T[A][B][C][D], F extends keyof T[A][B][C][D][E], G extends keyof T[A][B][C][D][E][F], H extends keyof T[A][B][C][D][E][F][G]>(s: Store<T>, a: A, b: B, c: C, d: D, e: E, f: F, g: G, h: H): Store<T[A][B][C][D][E][F][G][H]>;
export function lens<T, K extends (keyof any)[]>(b: Store<T>, ...k: K): Store<any> {
    return <LensStore<any, T>>{
        b,
        k,
        g: lens_getN[k.length] || lens_get,
        p: lens_setN[k.length] || lens_set,
    };
}

const lens_getN: Record<number, <T>(this: LensStore<T, any>) => T> = {
    [0]<T>(this: LensStore<T, any>): T {
        return this.b.g();
    },
    [1]<T>(this: LensStore<T, any>): T {
        return this.b.g()[this.k[0]];
    },
    [2]<T>(this: LensStore<T, any>): T {
        return this.b.g()[this.k[0]][this.k[1]];
    },
    [3]<T>(this: LensStore<T, any>): T {
        const k = this.k;
        return this.b.g()[k[0]][k[1]][k[2]];
    },
    [4]<T>(this: LensStore<T, any>): T {
        const k = this.k;
        return this.b.g()[k[0]][k[1]][k[2]][k[3]];
    }
};

const lens_setN: Record<number, <T>(this: LensStore<T, any>, val: T) => void> = {
    [0]<T>(this: LensStore<T, any>, val: T) {
        this.b.p(val);
    },
    [1]<T>(this: LensStore<T, any>, val: T) {
        this.b.p(set_field(this.b.g(), this.k[0], val));
    },
    [2]<T>(this: LensStore<T, any>, val: T) {
        const k = this.k;
        const v = this.b.g();
        this.b.p(set_field(v, k[0], set_field(v[k[0]], k[1], val)));
    },
    [3]<T>(this: LensStore<T, any>, val: T) {
        const k = this.k;
        const v = this.b.g();
        this.b.p(set_field(v, k[0], set_field(v[k[0]], k[1], set_field(v[k[0]][k[1]], k[2], val))));
    },
    [4]<T>(this: LensStore<T, any>, val: T) {
        const k = this.k;
        const v = this.b.g();
        const v0 = v[k[0]];
        this.b.p(set_field(v, k[0], set_field(v0, k[1], set_field(v0[k[1]], k[2], set_field(v0[k[1]][k[2]], k[3], val)))));
    },
    [5]<T>(this: LensStore<T, any>, val: T) {
        const k = this.k;
        const v = this.b.g();
        const v0 = v[k[0]];
        const v1 = v0[k[1]];
        this.b.p(set_field(v, k[0], set_field(v0, k[1], set_field(v1, k[2], set_field(v1[k[2]], k[3], set_field(v1[k[2]][k[3]], k[4], val))))));
    }
};

function set_field<O extends any[] | Record<string, any>, K extends keyof any>(obj: O, key: K, val: any): O {
    return Array.isArray(obj) ?
        (obj = obj.slice() as O, (obj as any[])[key as number] = val, obj) :
        { ...obj, [key]: val };
}

function lens_get<T>(this: LensStore<T, any>): T {
    let v = this.b.g();
    for (const k of this.k) v = v[k];
    return v;
}

function lens_set<T>(this: LensStore<T, any>, val: T) {
    const k = this.k;
    if (k.length) {
        const a = new Array(k.length);
        a[0] = this.b.g();
        let i = 0;
        for (; i < k.length - 1; i++)
            a[i + 1] = a[i][k[i]];
        a[i] = set_field(a[i], k[i], val);
        for (i--; i >= 0; i--)
            a[i] = set_field(a[i], k[i], a[i + 1]);
        this.b.p(a[0]);
    } else {
        this.b.p(val);
    }
}
