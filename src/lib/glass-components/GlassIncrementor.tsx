'use client';
import { useState, useTransition } from 'react';
import { GlassButton } from './GlassButton';
import { GlassSurface } from './GlassSurface';
import { cn } from './utils';

interface GlassIncrementorProps {
  value: number;
  onChange: (newValue: number) => Promise<void> | void;
  disabled?: boolean;
  min?: number;
  max?: number;
  addLabel?: string;
  addingLabel?: string;
  showAddButton?: boolean;
}

export default function GlassIncrementor({
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 7,
  addLabel = 'Add',
  addingLabel = 'Adding...',
  showAddButton = true,
}: GlassIncrementorProps) {
  const [isPending, startTransition] = useTransition();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleValueChange = async (newValue: number) => {
    // Ensure value stays within min/max bounds
    const clampedValue = Math.max(min, Math.min(max, newValue));

    if (clampedValue === value) return;

    setIsUpdating(true);
    startTransition(async () => {
      try {
        await onChange(clampedValue);
      } catch (error) {
        console.error('Error updating value:', error);
      } finally {
        setIsUpdating(false);
      }
    });
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleValueChange(value + 1);
  };
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleValueChange(value - 1);
  };
  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleValueChange(min + 1);
  };

  const isDisabled = disabled || isPending || isUpdating;

  // If value is at minimum and showAddButton is true, show "Add" button
  if (value === min && showAddButton) {
    return (
      <GlassButton
        variant="primary"
        size="small"
        onClick={handleAdd}
        disabled={isDisabled}
      >
        {isUpdating ? addingLabel : addLabel}
      </GlassButton>
    );
  }

  // Show incrementor controls when value > min or showAddButton is false
  return (
    <GlassSurface
      intensity="light"
      bordered
      shadowed={false}
      className="flex items-center gap-2 bg-primary/10 rounded-lg p-1"
      data-testid="incrementor"
    >
      <button
        className={cn(
          'h-8 w-8 p-0 rounded-md transition-all',
          'hover:bg-primary/20 active:bg-primary/30',
          'text-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
        onClick={handleDecrement}
        disabled={isDisabled || value <= min}
        aria-label="Decrease value"
      >
        <svg
          className="h-4 w-4 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>

      <div className="flex items-center justify-center min-w-[2rem] px-2">
        <span className="text-sm font-medium text-primary">
          {isUpdating ? '...' : value}
        </span>
      </div>

      <button
        className={cn(
          'h-8 w-8 p-0 rounded-md transition-all',
          'hover:bg-primary/20 active:bg-primary/30',
          'text-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
        onClick={handleIncrement}
        disabled={isDisabled || value >= max}
        aria-label="Increase value"
      >
        <svg
          className="h-4 w-4 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </GlassSurface>
  );
}
