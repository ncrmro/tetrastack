import type { LanguageModel } from 'ai'
import type { BaseAgent } from './base-agent'
import type { ChatMessage, ProgressCallback } from './types'

/**
 * Configuration object for agent construction
 */
export interface AgentConfig {
  model?: LanguageModel
  progressCallback?: ProgressCallback
}

/**
 * Fluent builder for creating and configuring agents
 * Provides chainable, readable configuration pattern
 *
 * @template TAgent - The agent class type
 * @template TResult - The result type from execute()
 * @template TPersisted - The persisted type from persist()
 *
 * @example
 * ```typescript
 * const agent = await FoodGeneratorAgent.builder()
 *   .withModel(openai('gpt-5-mini'))
 *   .withProgress(progressCallback)
 *   .execute([{ role: 'user', content: 'chicken breast' }]);
 *
 * const result = agent.getResult();
 * ```
 */
export class AgentBuilder<
  TAgent extends BaseAgent<Record<string, string>, TResult, TPersisted>,
  TResult = unknown,
  TPersisted = unknown,
> {
  private config: AgentConfig = {}

  constructor(
    private AgentClass: new (
      progressCallback?: ProgressCallback,
      model?: LanguageModel,
    ) => TAgent,
  ) {}

  /**
   * Set the language model to use for AI generation
   * @param model - AI language model (e.g., openai('gpt-4'))
   * @returns This builder for chaining
   */
  withModel(model: LanguageModel): this {
    this.config.model = model
    return this
  }

  /**
   * Set progress callback for real-time event tracking
   * @param callback - Callback function to receive progress events
   * @returns This builder for chaining
   */
  withProgress(callback: ProgressCallback): this {
    this.config.progressCallback = callback
    return this
  }

  /**
   * Execute the agent with the configured settings
   * Creates agent instance, runs execute(), and returns the agent
   *
   * @param messages - Chat messages to process
   * @param context - Optional context for execution
   * @returns Promise resolving to the configured agent instance
   */
  async execute(messages: ChatMessage[], context?: unknown): Promise<TAgent> {
    const agent = new this.AgentClass(
      this.config.progressCallback,
      this.config.model,
    )
    await agent.execute(messages, context)
    return agent
  }
}
