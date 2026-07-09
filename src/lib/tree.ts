import type { TreeNode } from "@/lib/types";

/** Depth-first list of every note in the tree (folders skipped). */
export function flattenNotes(tree: TreeNode[], out: TreeNode[] = []) {
  for (const node of tree) {
    if (node.kind === "note") out.push(node);
    if (node.children) flattenNotes(node.children, out);
  }
  return out;
}
