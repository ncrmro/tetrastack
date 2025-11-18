'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { SelectComment } from '@/database/schema.tasks';
import { createComment } from '@/actions/comments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface CommentThreadProps {
  taskId: string;
  comments: Array<
    SelectComment & {
      user: { id: number; name: string | null };
    }
  >;
  currentUserId: number;
}

export function CommentThread({
  taskId,
  comments,
  currentUserId,
}: CommentThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);

    startTransition(async () => {
      const result = await createComment({
        taskId,
        userId: currentUserId,
        content: content.trim(),
      });

      if (result.success) {
        setContent('');
        router.refresh(); // Refresh to show new comment
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4" data-testid="comment-thread">
      <h3 className="text-lg font-semibold text-on-surface">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-on-surface-variant">
          No comments yet. Be the first to comment!
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              data-testid="comment"
              className="rounded-lg border border-outline bg-surface p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-on-surface">
                  {comment.user.name || `User #${comment.user.id}`}
                </span>
                <span className="text-xs text-on-surface-variant">
                  {new Date(comment.createdAt).toLocaleDateString()} at{' '}
                  {new Date(comment.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-on-surface whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          disabled={isPending}
          className="text-sm"
        />
        {error && <p className="text-sm text-error">{error}</p>}
        <Button
          type="submit"
          disabled={isPending || !content.trim()}
          variant="primary"
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </form>
    </div>
  );
}
