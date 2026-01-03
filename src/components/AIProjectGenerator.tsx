'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SelectProject } from '@/database/schema.projects';

interface AIProjectGeneratorProps {
  teamId: string;
  onSuccess?: (project: SelectProject) => void;
}

interface ProgressEvent {
  type: string;
  message?: string;
  [key: string]: unknown;
}

export function AIProjectGenerator({
  teamId,
  onSuccess,
}: AIProjectGeneratorProps) {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [result, setResult] = useState<{
    project?: SelectProject;
    explanation?: string;
    error?: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setProgress([]);
    setResult(null);

    try {
      const response = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, teamId }),
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
                setResult({
                  project: data.project,
                  explanation: data.explanation,
                });
                if (data.project && onSuccess) {
                  onSuccess(data.project);
                }
              } else if (eventType === 'error') {
                setResult({ error: data.error });
              }
            }
          }
        }
      }
    } catch {
      setResult({ error: 'Failed to generate project. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-on-surface mb-2"
        >
          Describe your project
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="E.g., Create a mobile app for tracking daily habits with reminders and analytics"
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
        {isGenerating ? 'Generating...' : 'Generate Project with AI'}
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
        <div className="rounded-lg border border-outline bg-surface p-4 animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      )}

      {/* Result */}
      {result && !isGenerating && (
        <div className="space-y-3">
          {result.error ? (
            <div className="rounded-lg border border-error bg-error-container p-4">
              <p className="text-sm text-on-error-container">{result.error}</p>
            </div>
          ) : result.project ? (
            <div className="rounded-lg border border-primary bg-primary-container p-4">
              <h4 className="font-semibold text-on-primary-container mb-2">
                Project Created!
              </h4>
              <p className="text-sm text-on-primary-container mb-3">
                {result.project.title}
              </p>
              {result.explanation && (
                <p className="text-sm text-on-primary-container opacity-80 mb-3">
                  {result.explanation}
                </p>
              )}
              <button
                onClick={() => router.push(`/projects/${result.project?.slug}`)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View Project →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
