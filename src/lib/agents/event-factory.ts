/**
 * Event Factory for AI Agents
 *
 * Creates separated event constants and builders with:
 * - Auto-generated standard events (7 constants + 7 builders)
 * - Custom events (constants + builders from config)
 * - Full TypeScript type safety
 *
 * Usage:
 * ```typescript
 * static readonly event = createEventConstants({
 *   entity: 'food',
 *   custom: ['nutritionCalculated']
 * });
 *
 * static readonly eventBuilder = createEventBuilders({
 *   entity: 'food',
 *   custom: {
 *     nutritionCalculated: (name, cal, pro) => ({ name, cal, pro })
 *   }
 * });
 *
 * // Usage
 * this.emit(FoodAgent.eventBuilder.generationStart('Chicken'));
 * case FoodAgent.event.GENERATION_START:
 * ```
 */

/**
 * Helper: Convert camelCase to kebab-case
 * nutritionCalculated => nutrition-calculated
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Helper: Convert camelCase to SCREAMING_SNAKE_CASE
 * nutritionCalculated => NUTRITION_CALCULATED
 */
function camelToScreamingSnake(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
}

/**
 * Type helper: Convert camelCase to snake_case at type level
 */
type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnake<U>}`
  : S

/**
 * Creates event constants (enum-style strings) for an agent
 *
 * @example
 * ```typescript
 * static readonly event = createEventConstants({
 *   entity: 'food',
 *   custom: ['nutritionCalculated', 'created'],
 * });
 *
 * // Usage in switch statements
 * case FoodAgent.event.GENERATION_START:
 * case FoodAgent.event.NUTRITION_CALCULATED:
 * ```
 */
export function createEventConstants<
  TEntity extends string,
  TCustom extends readonly string[] = readonly string[],
>(config: {
  entity: TEntity
  custom?: TCustom
}): {
  // Standard event constants
  GENERATION_START: `${TEntity}.generation.start`
  GENERATION_COMPLETE: `${TEntity}.generation.complete`
  EXISTING_FOUND: `${TEntity}.existing.found`
  ERROR: `${TEntity}.error`
  TOOL_CALL: `${TEntity}.tool.call`
  TOOL_RESULT: `${TEntity}.tool.result`
  AI_FINISH: `${TEntity}.ai.finish`
} & {
  // Custom event constants
  [K in TCustom[number] as Uppercase<
    CamelToSnake<K & string>
  >]: `${TEntity}.${string}`
} {
  const { entity, custom = [] as unknown as TCustom } = config

  // Standard event constants (auto-generated)
  const standardConstants = {
    GENERATION_START: `${entity}.generation.start` as const,
    GENERATION_COMPLETE: `${entity}.generation.complete` as const,
    EXISTING_FOUND: `${entity}.existing.found` as const,
    ERROR: `${entity}.error` as const,
    TOOL_CALL: `${entity}.tool.call` as const,
    TOOL_RESULT: `${entity}.tool.result` as const,
    AI_FINISH: `${entity}.ai.finish` as const,
  }

  // Custom event constants - auto-generated from array
  const customConstants = Object.fromEntries(
    custom.map((key) => [
      camelToScreamingSnake(key),
      `${entity}.${camelToKebab(key)}`,
    ]),
  ) as {
    [K in TCustom[number] as Uppercase<
      CamelToSnake<K & string>
    >]: `${TEntity}.${string}`
  }

  return {
    ...standardConstants,
    ...customConstants,
  }
}

/**
 * Creates event builders (functions that create event objects) for an agent
 *
 * @example
 * ```typescript
 * static readonly eventBuilder = createEventBuilders({
 *   entity: 'food',
 *   custom: {
 *     nutritionCalculated: (name: string, cal: number, pro: number) => ({
 *       foodName: name,
 *       calories: cal,
 *       protein: pro,
 *     }),
 *   },
 * });
 *
 * // Usage in agent
 * this.emit(FoodAgent.eventBuilder.generationStart('Chicken'));
 * this.emit(FoodAgent.eventBuilder.nutritionCalculated('Chicken', 165, 31));
 * ```
 */
export function createEventBuilders<
  TEntity extends string,
  TResult = unknown,
  TCustom extends Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => Record<string, any>
  > = Record<string, never>,
>(config: {
  entity: TEntity
  custom?: TCustom
}): {
  // Standard event builders
  generationStart: (entityName: string) => {
    type: `${TEntity}.generation.start`
    data: { entityName: string }
  }
  generationComplete: (
    entityName: string,
    result: TResult,
  ) => {
    type: `${TEntity}.generation.complete`
    data: { entityName: string; result: TResult }
  }
  existingFound: (
    entityName: string,
    id: string,
  ) => {
    type: `${TEntity}.existing.found`
    data: { entityName: string; id: string }
  }
  error: (
    entityName: string,
    message: string,
    error?: unknown,
  ) => {
    type: `${TEntity}.error`
    data: { entityName: string; message: string; error?: unknown }
  }
  toolCall: (
    toolName: string,
    input: unknown,
  ) => {
    type: `${TEntity}.tool.call`
    data: { toolName: string; input: unknown }
  }
  toolResult: (
    toolName: string,
    output: unknown,
  ) => {
    type: `${TEntity}.tool.result`
    data: { toolName: string; output: unknown }
  }
  aiFinish: (
    finishReason: string,
    usage?: unknown,
  ) => {
    type: `${TEntity}.ai.finish`
    data: { finishReason: string; usage?: unknown }
  }
} & {
  // Custom event builders
  [K in keyof TCustom]: (...args: Parameters<TCustom[K]>) => {
    type: `${TEntity}.${string}`
    data: ReturnType<TCustom[K]>
  }
} {
  const { entity, custom = {} as TCustom } = config

  // Standard event builders (auto-generated)
  const standardBuilders = {
    generationStart: (entityName: string) => ({
      type: `${entity}.generation.start` as const,
      data: { entityName },
    }),
    generationComplete: (entityName: string, result: TResult) => ({
      type: `${entity}.generation.complete` as const,
      data: { entityName, result },
    }),
    existingFound: (entityName: string, id: string) => ({
      type: `${entity}.existing.found` as const,
      data: { entityName, id },
    }),
    error: (entityName: string, message: string, error?: unknown) => ({
      type: `${entity}.error` as const,
      data: { entityName, message, error },
    }),
    toolCall: (toolName: string, input: unknown) => ({
      type: `${entity}.tool.call` as const,
      data: { toolName, input },
    }),
    toolResult: (toolName: string, output: unknown) => ({
      type: `${entity}.tool.result` as const,
      data: { toolName, output },
    }),
    aiFinish: (finishReason: string, usage?: unknown) => ({
      type: `${entity}.ai.finish` as const,
      data: { finishReason, usage },
    }),
  }

  // Custom event builders - transform config into builders
  const customBuilders = Object.fromEntries(
    Object.entries(custom).map(([key, dataFn]) => {
      const eventType = `${entity}.${camelToKebab(key)}` as const
      return [
        key,
        (...args: Parameters<typeof dataFn>) => ({
          type: eventType,
          data: dataFn(...args),
        }),
      ]
    }),
  ) as {
    [K in keyof TCustom]: (...args: Parameters<TCustom[K]>) => {
      type: `${TEntity}.${string}`
      data: ReturnType<TCustom[K]>
    }
  }

  return {
    ...standardBuilders,
    ...customBuilders,
  }
}

/**
 * Extract event type union from createEventBuilders result
 * Enables full type safety for event handling
 */
export type ExtractEventUnion<
  T extends ReturnType<typeof createEventBuilders>,
> = ReturnType<T[keyof T]>
