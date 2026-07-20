import { QueryClient } from "@tanstack/react-query";
import type { TreeNode } from "@/lib/types";

const PUBLISH_STATUS_QUERY = ["publish-note-status"] as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1_000,
      gcTime: 15 * 60 * 1_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function publishStatusQueryKey(
  root: string,
  rel: string,
  markdown: string,
  tree: TreeNode[],
) {
  const treeVersions: string[] = [];
  const collect = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      treeVersions.push(`${node.rel}:${node.modifiedMs}`);
      if (node.children) collect(node.children);
    }
  };
  collect(tree);
  return [
    ...PUBLISH_STATUS_QUERY,
    root,
    rel,
    fingerprint(markdown),
    fingerprint(treeVersions.join("|")),
  ] as const;
}

export function invalidatePublishStatus(): void {
  void queryClient.invalidateQueries({ queryKey: PUBLISH_STATUS_QUERY });
}

function fingerprint(value: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return `${value.length}:${hash >>> 0}`;
}
