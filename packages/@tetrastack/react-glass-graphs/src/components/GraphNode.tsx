import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GlassCard as Card } from '@tetrastack/react-glass';
import type { GraphNodeData, DocumentOutput } from '../types';
import { statusStyles, statusLabels } from '../types';
import { CategoryBadge } from './CategoryBadge';

export function GraphNode({ data }: NodeProps) {
  // Cast data to GraphNodeData for type safety
  const nodeData = data as unknown as GraphNodeData;
  const status = statusStyles[nodeData.status];

  return (
    <div className="graph-node">
      {/* Handle for incoming connections (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !w-3 !h-3"
      />

      <Card className={`w-80 ${status.ring}`} padded={false} rounded="lg">
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <CategoryBadge category={nodeData.category} />
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.badge}`}
            >
              {statusLabels[nodeData.status]}
            </span>
          </div>
          <h3 className="text-base font-semibold text-on-surface">
            {nodeData.label}
          </h3>
          {nodeData.description && (
            <p className="mt-1 text-xs text-on-surface-variant">
              {nodeData.description}
            </p>
          )}
        </div>

        <div className="px-4 pb-4">
          {/* Estimated Time */}
          {nodeData.estimatedTime && (
            <div className="mb-2 text-xs text-on-surface-variant">
              Estimated: {nodeData.estimatedTime}
            </div>
          )}

          {/* Outputs List */}
          {nodeData.outputs.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium text-on-surface-variant mb-1">
                Outputs:
              </div>
              <div className="space-y-1">
                {nodeData.outputs.map((output: DocumentOutput) => (
                  <div
                    key={output.id}
                    className="flex items-center justify-between text-xs bg-surface-variant/30 rounded px-2 py-1"
                  >
                    <span className="text-on-surface truncate">
                      {output.name}
                    </span>
                    <span
                      className={`text-xs ml-2 ${
                        output.status === 'complete'
                          ? 'text-primary'
                          : output.status === 'needs_review'
                            ? 'text-secondary'
                            : 'text-on-surface-variant'
                      }`}
                    >
                      {output.status === 'complete'
                        ? '✓'
                        : output.status === 'needs_review'
                          ? '⚠'
                          : '○'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Handle for outgoing connections (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !w-3 !h-3"
      />
    </div>
  );
}
