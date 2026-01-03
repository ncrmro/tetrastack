'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SelectTask } from '@/database/schema.tasks';

interface AITaskGeneratorProps {
  projectId: string;
  onSuccess?: (tasks: SelectTask[]) => void;
}

interface ProgressEvent {
  type: string;
  message?: string;
  [key: string]: unknown;
}

export function AITaskGenerator({
  projectId,
  onSuccess,
}: AITaskGeneratorProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<{
    tasks?: SelectTask[];
    explanation?: string;
    error?: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setProgress([]);
    setResult(null);

    try {
      const response = await fetch('/api/ai/generate-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, projectId }),
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.substring(7);
            const nextLine = lines[lines.indexOf(line) + 1];

            if (nextLine?.startsWith('data: ')) {
              const data = JSON.parse(nextLine.substring(6));

              if (eventType === 'progress') {
                setProgress((prev) => [...prev, data]);
              } else if (eventType === 'complete') {
                const tasks = data.type === 'bulk' ? data.tasks : [data.task];
                setResult({
                  tasks,
                  explanation: data.explanation,
                });
                if (onSuccess) {
                  onSuccess(tasks);
                }
              } else if (eventType === 'error') {
                setResult({ error: data.error });
              }
            }
          }
        }
      }
    } catch {
      setResult({ error: 'Failed to generate tasks. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="task-description"
          className="block text-sm font-medium text-on-surface mb-2"
        >
          Describe the feature or work to be done
        </label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="E.g., Implement user authentication with email and password"
          rows={4}
          disabled={isGenerating}
          className="text-sm"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !description.trim()}
        variant="primary"
        className="w-full"
      >
        {isGenerating ? 'Generating...' : 'Generate Tasks with AI'}
      </Button>

      {/* Progress Events */}
      {isGenerating && progress.length > 0 && (
        <div className="rounded-lg border border-outline bg-surface p-4">
          <h4 className="text-sm font-medium text-on-surface mb-2">
            AI is working...
          </h4>
          <div className="space-y-1">
            {progress.slice(-3).map((event, idx) => (
              <div key={idx} className="text-xs text-on-surface-variant">
                {event.message || event.type}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skeleton Loading */}
      {isGenerating && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-outline bg-surface p-3 animate-pulse"
            >
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* Result */}
      {result && !isGenerating && (
        <div className="space-y-3">
          {result.error ? (
            <div className="rounded-lg border border-error bg-error-container p-4">
              <p className="text-sm text-on-error-container">{result.error}</p>
            </div>
          ) : result.tasks && result.tasks.length > 0 ? (
            <div className="rounded-lg border border-primary bg-primary-container p-4">
              <h4 className="font-semibold text-on-primary-container mb-2">
                {result.tasks.length} Task{result.tasks.length > 1 ? 's' : ''}{' '}
                Created!
              </h4>
              {result.explanation && (
                <p className="text-sm text-on-primary-container opacity-80 mb-3">
                  {result.explanation}
                </p>
              )}
              <ul className="space-y-1 mb-3">
                {result.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="text-sm text-on-primary-container"
                  >
                    • {task.title}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => router.refresh()}
                className="text-sm font-medium text-primary hover:underline"
              >
                Refresh to see tasks
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
