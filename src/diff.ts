export const enum Action {
    None = 0,
    Added = 1,
    Removed = 2,
}

export interface Component<T> {
    // value
    v: T[],
    // count
    c: number,
    // action
    a: Action,
}

interface Path<T> {
    // newPos
    n: number,
    // components
    c: Component<T>[],
}

export function array_diff<T>(oldList: T[], newList: T[]): Component<T>[] {
    oldList = oldList.slice();
    newList = newList.slice();
    
    let newLen = newList.length, oldLen = oldList.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    let bestPath: Path<T>[] = [{ n: -1, c: [] }];
    
    // Seed editLength = 0, i.e. the content starts with the same values
    let oldPos = extractCommon(bestPath[0], newList, oldList, 0);
    if (bestPath[0].n + 1 >= newLen && oldPos + 1 >= oldLen) {
        // Identity per the equality and tokenizer
        return [{v: newList, c: newList.length, a: Action.None}];
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    function execEditLength() {
        for (let diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
            let basePath: Path<T>;
            let addPath = bestPath[diagonalPath - 1],
            removePath = bestPath[diagonalPath + 1],
            oldPos = (removePath ? removePath.n : 0) - diagonalPath;
            if (addPath) {
                // No one else is going to attempt to use this value, clear it
                bestPath[diagonalPath - 1] = undefined as any;
            }

            let canAdd = addPath && addPath.n + 1 < newLen,
            canRemove = removePath && 0 <= oldPos && oldPos < oldLen;
            if (!canAdd && !canRemove) {
                // If this path is a terminal then prune
                bestPath[diagonalPath] = undefined as any;
                continue;
            }

            // Select the diagonal that we want to branch from. We select the prior
            // path whose position in the new string is the farthest from the origin
            // and does not pass the bounds of the diff graph
            if (!canAdd || (canRemove && addPath.n < removePath.n)) {
                basePath = clonePath(removePath);
                pushComponent(basePath.c, Action.Removed);
            } else {
                basePath = addPath; // No need to clone, we've pulled it from the list
                basePath.n++;
                pushComponent(basePath.c, Action.Added);
            }

            oldPos = extractCommon(basePath, newList, oldList, diagonalPath);

            // If we have hit the end of both strings, then we are done
            if (basePath.n + 1 >= newLen && oldPos + 1 >= oldLen) {
                return buildValues(basePath.c, newList, oldList/*, false*/);
            } else {
                // Otherwise track this path as a potential candidate and continue.
                bestPath[diagonalPath] = basePath;
            }
        }

        editLength++;
    }

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced.
    while (editLength <= maxEditLength) {
        let ret = execEditLength();
        if (ret) return ret;
    }

    return [];
}

function pushComponent<T>(components: Component<T>[], a: Action) {
    let last = components[components.length - 1];
    if (last && last.a === a) {
        // We need to clone here as the component clone operation is just
        // as shallow array clone
        components[components.length - 1] = {c: last.c + 1, a } as Component<T>;
    } else {
        components.push({ c: 1, a } as Component<T>);
    }
}

function extractCommon<T>(basePath: Path<T>, newList: T[], oldList: T[], diagonalPath: number) {
    let newLen = newList.length,
    oldLen = oldList.length,
    newPos = basePath.n,
    oldPos = newPos - diagonalPath,
    
    commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && newList[newPos + 1] === oldList[oldPos + 1]) {
        newPos++;
        oldPos++;
        commonCount++;
    }
    
    if (commonCount) {
        basePath.c.push({c: commonCount, a: Action.None} as Component<T>);
    }
    
    basePath.n = newPos;
    return oldPos;
}

function buildValues<T>(components: Component<T>[], newList: T[], oldList: T[]) {
    let componentPos = 0,
    componentLen = components.length,
    newPos = 0,
    oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
        let component = components[componentPos];
        if (component.a != Action.Removed) {
            component.v = newList.slice(newPos, newPos + component.c);
            newPos += component.c;

            // Common case
            if (!component.a) {
                oldPos += component.c;
            }
        } else {
            component.v = oldList.slice(oldPos, oldPos + component.c);
            oldPos += component.c;

            // Reverse add and remove so removes are output first to match common convention
            // The diffing algorithm is tied to add then remove output and this is the simplest
            // route to get the desired output with minimal overhead.
            if (componentPos && components[componentPos - 1].a) {
                let tmp = components[componentPos - 1];
                components[componentPos - 1] = components[componentPos];
                components[componentPos] = tmp;
            }
        }
    }

    return components;
}

function clonePath<T>(path: Path<T>): Path<T> {
    return { n: path.n, c: path.c.slice(0) };
}
