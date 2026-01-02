import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { AgentBuilder } from './builder';
import type { createEventBuilders } from './event-factory';
import type { AgentState, ChatMessage, ProgressCallback } from './types';

/**
 * Standard discriminated union workflow for agents that search existing items
 * Use this in agent SYSTEM_PROMPT to ensure consistent behavior
 *
 * @param entityName - Singular entity name (e.g., "food", "recipe", "meal")
 * @param toolName - Search tool name (e.g., "searchFoods", "searchRecipes", "searchMeals")
 * @returns Formatted workflow instructions
 */
export function standardWorkflow(entityName: string, toolName: string): string {
  return `IMPORTANT WORKFLOW:
1. ALWAYS search for existing ${entityName}s using the ${toolName} tool first
2. If a matching ${entityName} is found:
   - Return { "result": { "type": "existing", "id": <id> }, "explanation": "..." }
   - Do NOT regenerate the ${entityName} details
   - Include the ${entityName} ID from the search results
3. If no suitable match exists:
   - Return { "result": { "type": "new", "${entityName}": {...} }, "explanation": "..." }
   - Generate complete ${entityName} data with all details
   - The schema describes all required and optional fields with their specific requirements
4. You MUST ALWAYS return a terse conversational explanation in its own key outside of the result`;
}

/**
 * Base class for all AI agents implementing the Database-First AI Generation Pattern
 *
 * ## Database-First AI Generation Pattern
 *
 * This pattern enables AI to generate objects in exact database-ready format,
 * eliminating transformation layers and ensuring type safety from database to AI output.
 *
 * ### Type Flow: Database → Models → Agents
 *
 * 1. **Database Layer** (Source of Truth)
 *    - Drizzle schemas define structure + validation rules
 *    - Schemas include AI-friendly descriptions for each field
 *    - Example: `insertFoodSchema`, `nutrientsSchema`
 *
 * 2. **Model Layer** (Data Operations)
 *    - Provides typed functions: `getFoods()`, `createFoods()`
 *    - Return types match exact query shapes with joins
 *    - Handles database transactions and relationships
 *
 * 3. **Agent Layer** (AI Generation)
 *    - Imports schemas directly from database layer
 *    - AI output schema derived from database insert schemas
 *    - Generated objects are database-ready without transformation
 *
 * ### Two-Phase Execution Pattern
 *
 * **Phase 1: execute()** - AI Generation
 * - AI searches for existing entities OR generates new ones
 * - Returns discriminated union: `{ type: 'existing', id }` or `{ type: 'new', data }`
 * - Generated data matches exact database insert format
 * - No persistence yet - allows refinement, batching, or validation
 *
 * **Phase 2: persist()** - Database Persistence
 * - If existing: fetches full record with joins
 * - If new: creates record and returns with joins
 * - Return type always matches model query return shapes
 *
 * ### Key Benefits
 *
 * - **Zero transformation**: AI output → database with no mapping layer
 * - **Type safety**: Database constraints enforced at AI generation time
 * - **Deferred persistence**: Generate multiple items before saving
 * - **Single source of truth**: Database schema drives everything
 *
 * ### Example Implementation
 *
 * ```typescript
 * // 1. Database defines schema
 * const insertFoodSchema = z.object({
 *   name: z.string().describe("Food name for AI"),
 *   calories: z.number().describe("Calories per serving")
 * });
 *
 * // 2. Agent uses database schema directly
 * class FoodGeneratorAgent extends BaseAgent {
 *   static readonly OUTPUT_SCHEMA = z.discriminatedUnion('type', [
 *     z.object({ type: z.literal('existing'), id: z.string() }),
 *     z.object({ type: z.literal('new'), food: insertFoodSchema })
 *   ]);
 *
 *   async persist() {
 *     // Direct passthrough to database - no transformation needed
 *     if (this.result.id) {
 *       const foods = await getFoods({ ids: [this.result.id] });
 *       return foods[0];
 *     }
 *     return (await createFoods([this.result.food]))[0];
 *   }
 * }
 * ```
 *
 * @template TPlaceholders - Record type defining required placeholder keys
 * @template TResult - AI generation output (database insert schema + optional id)
 * @template TPersisted - Database record after persistence (query return shape with joins)
 */
export abstract class BaseAgent<
  TPlaceholders extends Record<string, string> = Record<string, string>,
  TResult = unknown,
  TPersisted = unknown,
> {
  static readonly SYSTEM_PROMPT: string;
  static readonly PROMPT?: string;
  static readonly DEFAULT_MODEL = openai('gpt-5');

  /**
   * Create a fluent builder for this agent class
   * Enables chainable configuration with type safety
   *
   * @example
   * ```typescript
   * const agent = await FoodGeneratorAgent.builder()
   *   .withModel(openai('gpt-5-mini'))
   *   .withProgress(progressCallback)
   *   .execute([{ role: 'user', content: 'chicken breast' }]);
   * ```
   */
  static builder<
    T extends BaseAgent<Record<string, string>, TResult, TPersisted>,
    TResult = unknown,
    TPersisted = unknown,
  >(
    this: new (
      progressCallback?: ProgressCallback,
      model?: LanguageModel,
    ) => T,
  ): AgentBuilder<T, TResult, TPersisted> {
    return new AgentBuilder<T, TResult, TPersisted>(BaseAgent);
  }

  protected readonly agentName: string;
  protected readonly model: LanguageModel;
  protected result?: TResult;
  protected messages: ChatMessage[] = [];
  protected context?: unknown;
  protected completedStages: string[] = [];

  /**
   * Auto-emitting event builder proxy
   * Subclasses will override this with their specific event builder
   */
  protected emit!: ReturnType<typeof createEventBuilders>;

  constructor(
    protected progressCallback?: ProgressCallback,
    model?: LanguageModel,
  ) {
    this.agentName = this.constructor.name;
    // Use subclass DEFAULT_MODEL if defined, otherwise use BaseAgent.DEFAULT_MODEL
    const agentClass = this.constructor as typeof BaseAgent;
    this.model = model ?? agentClass.DEFAULT_MODEL ?? BaseAgent.DEFAULT_MODEL;

    // Auto-initialize emit proxy from subclass's static eventBuilder
    const agentClassWithBuilder = agentClass as typeof BaseAgent & {
      eventBuilder?: ReturnType<typeof createEventBuilders>;
    };

    if (agentClassWithBuilder.eventBuilder) {
      this.emit = this.createEmitter(agentClassWithBuilder.eventBuilder);
    }
  }

  /**
   * Create an auto-emitting proxy from event builders
   * Each builder method is wrapped to automatically call emitEvent
   *
   * @example
   * ```typescript
   * this.emit = this.createEmitter(FoodGeneratorAgent.eventBuilder);
   * // Now you can call: this.emit.generationStart('Chicken')
   * ```
   */
  protected createEmitter<T extends ReturnType<typeof createEventBuilders>>(
    eventBuilder: T,
  ): T {
    return new Proxy(eventBuilder, {
      get: (target, prop) => {
        const builder = target[prop as keyof T];
        if (typeof builder === 'function') {
          return (...args: unknown[]) => {
            const event = (builder as (...args: unknown[]) => unknown)(...args);
            this.emitEvent(event as { type: string; data: unknown });
          };
        }
        return builder;
      },
    }) as T;
  }

  /**
   * Get the prompt with placeholders replaced by values
   */
  protected getPrompt(placeholderValues: TPlaceholders): string {
    let prompt = (this.constructor as typeof BaseAgent).PROMPT || '';
    for (const [key, value] of Object.entries(placeholderValues)) {
      prompt = prompt.replace(`{${key}}`, value);
    }
    return prompt;
  }

  /**
   * Internal method to emit an event with automatic timestamp handling
   * Called automatically by the emit proxy
   * You should not call this directly - use this.emit.eventName() instead
   *
   * @internal
   */
  protected emitEvent<
    TEvent extends { type: string; data: unknown; timestamp?: string },
  >(event: TEvent): void {
    if (!this.progressCallback) return;

    // Add timestamp if not present
    const eventWithTimestamp = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    };

    // Call progress callback
    // For backward compatibility during migration, we still use the old signature
    // but pass the event as the fourth parameter
    this.progressCallback(
      this.agentName.toLowerCase(),
      eventWithTimestamp.type,
      this.completedStages,
      eventWithTimestamp,
    );
  }

  /**
   * Extract the latest user message from a conversation
   */
  protected getLatestUserMessage(messages: ChatMessage[]): string {
    const latestUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!latestUserMessage) {
      throw new Error('No user message found');
    }
    return latestUserMessage.content;
  }

  /**
   * Get the stored result from the last execution
   * @throws Error if no result exists (execute must be called first)
   */
  getResult(): TResult {
    if (!this.result) {
      throw new Error(
        'No result available - execute() must be called first before accessing result',
      );
    }
    return this.result;
  }

  /**
   * Continue a conversation with new messages
   * Appends new messages to conversation history and re-executes
   * Enables iterative refinement and multi-turn interactions
   *
   * @param newMessages - New messages to append to conversation
   * @param context - Optional context for execution
   * @returns Promise resolving to the updated result
   *
   * @example
   * ```typescript
   * const agent = await FoodGeneratorAgent.builder()
   *   .execute([{ role: 'user', content: 'chicken breast' }]);
   *
   * // Refine the result with a follow-up
   * await agent.continue([
   *   { role: 'user', content: 'Make it skinless chicken breast' }
   * ]);
   *
   * const refinedResult = agent.getResult();
   * ```
   */
  async continue(
    newMessages: ChatMessage[],
    context?: unknown,
  ): Promise<TResult> {
    // Append new messages to existing conversation history
    this.messages = [...this.messages, ...newMessages];

    // Re-execute with full conversation history
    // Subclass execute() will see all messages including follow-ups
    return this.execute(this.messages, context);
  }

  /**
   * Serialize the agent state to JSON for storage
   */
  toJSON(): AgentState<TResult> {
    return {
      agentName: this.agentName,
      result: this.result,
      messages: this.messages,
      context: this.context,
      modelId:
        typeof this.model === 'object' &&
        this.model !== null &&
        'modelId' in this.model &&
        typeof this.model.modelId === 'string'
          ? this.model.modelId
          : BaseAgent.DEFAULT_MODEL.modelId,
      completedStages: this.completedStages,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Deserialize an agent from stored state
   * Note: Subclasses must implement this to properly recreate the agent instance
   */
  static fromJSON<T extends BaseAgent>(
    this: new (
      progressCallback?: ProgressCallback,
      model?: LanguageModel,
    ) => T,
    state: AgentState,
  ): T {
    // Create agent instance with model from state
    const modelId = state.modelId;
    const model = openai(modelId);
    const agent = new BaseAgent(undefined, model);

    // Restore state
    agent.result = state.result;
    agent.messages = state.messages;
    agent.context = state.context;
    agent.completedStages = state.completedStages || [];

    return agent;
  }

  /**
   * Execute the agent - generate AI output
   * Subclasses should store the result using this.result before returning
   */
  abstract execute(
    messages: ChatMessage[],
    context?: unknown,
  ): Promise<TResult>;

  /**
   * @deprecated Persistence should be handled by actions/scripts, not agents
   * Agents focus on search/read and generate only
   *
   * @example
   * ```typescript
   * // OLD PATTERN (deprecated):
   * const agent = await ProjectGeneratorAgent.builder().execute([...]);
   * const persisted = await agent.persist(); // ❌ Don't do this
   *
   * // NEW PATTERN (recommended):
   * const agent = await ProjectGeneratorAgent.builder().execute([...]);
   * const result = agent.getResult();
   * if (result.type === 'new') {
   *   await createProjects([result.project]); // ✅ Persist in action/script
   * }
   * ```
   *
   * @throws Error explaining that persistence should be done in actions/scripts
   */
  persist(): Promise<TPersisted> {
    throw new Error(
      `persist() is deprecated. Agents focus on generation only. ` +
        `Handle persistence in actions/scripts using model layer. ` +
        `See src/agents/README.md for the new pattern.`,
    );
  }
}
