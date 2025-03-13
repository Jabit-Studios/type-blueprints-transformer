import ts from "typescript";

/**
 * Predicate accepts ts.Node or it"s subtypes
 */
type NodePredicate<T extends ts.Node = ts.Node> = (node: T) => boolean

/**
 * Returns mapping function that replaces
 * nodes that satisfy the passed predicate
 * with a replacement node passed but skips the first appearance
 */
export function getNodeReplacer(predicate: NodePredicate, replacement: ts.Node) {
    let replaced = false;
    return (node: ts.Node) => {
        if (replaced && predicate(node)) return [replacement, replaced]
        if (replaced || !predicate(node)) return [node, replaced]

        replaced = true;
        return [replacement, replaced]
    }
}