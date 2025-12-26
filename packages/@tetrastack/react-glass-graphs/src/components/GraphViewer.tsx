'use client';

import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { GraphNode } from './GraphNode';
import { useGraphLayout } from '../hooks/useGraphLayout';
import type { Graph } from '../types';

const nodeTypes = {
  graphNode: GraphNode,
};

export interface GraphViewerProps {
  graph: Graph;
  interactive?: boolean;
}

/**
 * GraphViewer - Visual graph browser using React Flow
 *
 * Displays a graph as a directed acyclic graph with automatic layout.
 * Supports both interactive and read-only modes.
 *
 * @param graph - The graph to display
 * @param interactive - Enable node dragging and pan/zoom (default: true)
 */
export function GraphViewer({ graph, interactive = true }: GraphViewerProps) {
  const { nodes, edges } = useGraphLayout(graph);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={interactive}
        nodesConnectable={false} // Don't allow creating new connections
        elementsSelectable={interactive}
        panOnDrag={interactive}
        zoomOnScroll={interactive}
        zoomOnPinch={interactive}
        zoomOnDoubleClick={interactive}
        preventScrolling={interactive}
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls showInteractive={interactive} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable={interactive}
          pannable={interactive}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
