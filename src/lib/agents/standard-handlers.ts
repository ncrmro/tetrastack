import type { StepResult, ToolSet } from 'ai';
import type { createEventBuilders } from './event-factory';

/**
 * Configuration for standard onStepFinish handler
 */
export interface OnStepFinishConfig {
  /**
   * Agent event builders object (from createEventBuilders)
   */
  eventBuilder: ReturnType<typeof createEventBuilders>;

  /**
   * Emit function from the agent
   */
  emit: (event: { type: string; data: unknown; timestamp?: string }) => void;
}

/**
 * Creates a standard onStepFinish handler for AI generation
 * Eliminates ~45 lines of boilerplate per agent
 *
 * Automatically emits:
 * - Tool call events (type: `${entity}.tool.call`)
 * - Tool result events (type: `${entity}.tool.result`)
 * - AI finish events (type: `${entity}.ai.finish`)
 *
 * @example
 * ```typescript
 * const result = await generateText({
 *   model: this.model,
 *   onStepFinish: createStandardOnStepFinish({
 *     eventBuilder: FoodGeneratorAgent.eventBuilder,
 *     emit: (e) => this.emit(e),
 *   }),
 *   // ...
 * });
 * ```
 */
export function createStandardOnStepFinish(config: OnStepFinishConfig) {
  const { eventBuilder, emit } = config;

  return <T extends ToolSet>({
    toolCalls,
    toolResults,
    finishReason,
    usage,
  }: Partial<StepResult<T>>) => {
    // Emit tool call and result events
    if (toolCalls) {
      toolCalls.forEach((toolCall, index) => {
        // Tool call event - use 'input' property from StepResult
        emit(eventBuilder.toolCall(toolCall.toolName, toolCall.input));

        // Tool result event - use 'output' property from StepResult
        if (toolResults && toolResults[index]) {
          const toolResult = toolResults[index];
          emit(eventBuilder.toolResult(toolCall.toolName, toolResult.output));
        }
      });
    }

    // Emit AI finish event
    if (finishReason) {
      emit(eventBuilder.aiFinish(finishReason, usage));
    }
  };
}
