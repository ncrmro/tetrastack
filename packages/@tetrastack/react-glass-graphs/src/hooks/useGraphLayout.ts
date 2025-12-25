import { useMemo } from 'react';
import * as dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Graph } from '../types';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 150;

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Converts a Graph into React Flow nodes and edges with automatic layout
 * using dagre for hierarchical graph layout.
 *
 * @param graph - The graph to layout
 * @returns Positioned nodes and edges for React Flow
 */
export function useGraphLayout(graph: Graph): LayoutResult {
  return useMemo(() => {
    // Create a new directed graph for dagre layout
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Configure graph layout: top-to-bottom with spacing
    dagreGraph.setGraph({
      rankdir: 'TB', // Top-to-bottom direction
      nodesep: 80, // Horizontal spacing between nodes
      ranksep: 120, // Vertical spacing between ranks
      marginx: 40,
      marginy: 40,
    });

    // Add nodes to dagre graph with dimensions
    graph.nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    // Add edges based on dependencies
    // Each dependency in a node's dependencies array means an edge FROM that dependency TO this node
    graph.nodes.forEach((node) => {
      node.dependencies.forEach((depId) => {
        dagreGraph.setEdge(depId, node.id);
      });
    });

    // Run dagre layout algorithm
    dagre.layout(dagreGraph);

    // Convert dagre nodes to React Flow nodes with calculated positions
    const nodes: Node[] = graph.nodes.map((nodeData) => {
      const dagreNode = dagreGraph.node(nodeData.id);

      // Dagre gives us the center position, but React Flow expects top-left
      const position = {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - NODE_HEIGHT / 2,
      };

      return {
        id: nodeData.id,
        type: 'graphNode', // Custom node type
        position,
        data: nodeData as unknown as Record<string, unknown>,
      };
    });

    // Create edges from dependencies
    const edges: Edge[] = [];
    graph.nodes.forEach((node) => {
      node.dependencies.forEach((depId) => {
        edges.push({
          id: `${depId}-${node.id}`,
          source: depId,
          target: node.id,
          type: 'smoothstep', // Smooth step edge type looks good for graphs
          animated: node.status === 'in_progress', // Animate edges to in-progress nodes
        });
      });
    });

    return { nodes, edges };
  }, [graph]);
}
