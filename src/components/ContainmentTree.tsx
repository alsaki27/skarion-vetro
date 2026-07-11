"use client";

import { useMemo } from "react";
import { useDesignStore } from "@/lib/store";
import { isContainerType, isPointElement, type PointElement } from "@/lib/types";

interface TreeNode {
  id: string;
  label: string;
  icon: string;
  detail: string;
  children: TreeNode[];
}

function elementIcon(type: string): string {
  switch (type) {
    case "co": return "🏢";
    case "pole": return "📍";
    case "handhole": return "⬛";
    case "flowerpot": return "🌸";
    case "vault": return "🏦";
    case "fdh_cabinet": return "🗄️";
    case "mst": return "📡";
    case "splitter": return "🔀";
    case "splice_closure": return "📦";
    case "riser": return "⬆️";
    case "terminal": return "🔌";
    case "slack_loop": return "🌀";
    case "premise": return "🏠";
    default: return "•";
  }
}

function buildTree(): TreeNode[] {
  const state = useDesignStore.getState();
  const elements = Object.values(state.elements);
  const points = elements.filter(isPointElement);
  const hostedMap = new Map<string, PointElement[]>();
  for (const p of points) {
    if (p.parent_container_id) {
      if (!hostedMap.has(p.parent_container_id)) hostedMap.set(p.parent_container_id, []);
      hostedMap.get(p.parent_container_id)!.push(p);
    }
  }

  const co = points.find((p) => p.type === "co");
  if (!co) return [{ id: "empty", label: "No CO placed", icon: "⚠️", detail: "", children: [] }];

  function toNode(p: PointElement): TreeNode {
    const h = hostedMap.get(p.id);
    const hosted = h
      ? [
          ...h.map((child) => ({
            id: child.id,
            label: `${child.type}${child.label ? ` (${child.label})` : ""}`,
            icon: elementIcon(child.type),
            detail: child.attributes.port_count
              ? `${String(child.attributes.port_count)}-port`
              : child.attributes.ratio
                ? String(child.attributes.ratio)
                : child.attributes.capacity
                  ? `${String(child.attributes.capacity)}-ct`
                  : "",
            children: [],
          })),
        ]
      : [];

    const detail =
      p.type === "handhole" || p.type === "flowerpot" || p.type === "vault"
        ? String(p.attributes.size ?? "")
        : p.type === "pole"
          ? `${String(p.attributes.height_ft ?? "")}ft`
          : p.type === "fdh_cabinet"
            ? `${String(p.attributes.port_count ?? "")}p`
            : "";

    return {
      id: p.id,
      label: p.label ?? p.type,
      icon: elementIcon(p.type),
      detail,
      children: hosted,
    };
  }

  const roots: TreeNode[] = [];

  // CO always first
  roots.push(toNode(co));

  // Containers with hosted equipment — add child hosting under their parent container or directly under CO
  const containers = points.filter((p) => isContainerType(p.type) && p.id !== co.id);
  for (const c of containers) {
    const hosted = hostedMap.get(c.id);
    const cn = toNode(c);
    if (c.parent_container_id) {
      // This container is itself hosted inside another container — handled by toNode recursion later
      // We still need to show it; find its parent in the roots
      const parentRoot = roots.find((r) => r.id === c.parent_container_id);
      if (parentRoot) {
        parentRoot.children.push(cn);
        continue;
      }
    }
    // Standalone container (or container parent not found in roots)
    if (hosted && hosted.length > 0) {
      roots.push(cn);
    }
  }

  // Premises (not hosted in anything)
  const premises = points.filter((p) => p.type === "premise" && !p.parent_container_id);
  for (const pr of premises) {
    roots.push({
      id: pr.id,
      label: pr.label ?? pr.type,
      icon: elementIcon(pr.type),
      detail: String(pr.attributes.address ?? ""),
      children: [],
    });
  }

  return roots.length > 0 ? roots : [{ id: "empty", label: "No elements", icon: "⚠️", detail: "", children: [] }];
}

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const selectedId = useDesignStore((s) => s.selectedId);
  const select = useDesignStore((s) => s.select);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <button
        onClick={() => select(node.id)}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs transition-colors ${
          isSelected
            ? "bg-blue-600 text-white"
            : "text-zinc-300 hover:bg-zinc-800"
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <span className="shrink-0">{node.icon}</span>
        <span className="truncate">{node.label}</span>
        {node.detail && (
          <span className="ml-auto shrink-0 text-[10px] text-zinc-500">{node.detail}</span>
        )}
      </button>
      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContainmentTree() {
  const elements = useDesignStore((s) => s.elements);
  const tree = useMemo(() => buildTree(), [elements]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-0.5">
      {tree.map((node) => (
        <TreeNodeItem key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
