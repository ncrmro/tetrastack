import { asc, like, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/database'

/**
 * Factory function to create standard search tools
 * Eliminates 99% of tool boilerplate across agents
 *
 * @example
 * ```typescript
 * const searchFoods = createSearchTool({
 *   entityName: 'food',
 *   table: foods,
 * });
 * ```
 */
export function createSearchTool(config: {
  entityName: string // 'food', 'recipe', 'meal'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any // Drizzle SQLite table
  limit?: number // default: 50
}) {
  const { entityName, table, limit = 50 } = config
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return {
    description: `Search for existing ${entityName}s in the database by name. Accepts multiple search terms.`,
    inputSchema: z.object({
      queries: z
        .array(z.string())
        .describe(`Array of ${entityName} names or keywords to search for`),
    }),
    execute: async ({ queries }: { queries: string[] }) => {
      console.debug(`🔍 search${capitalize(entityName)}s tool called:`, {
        queries,
      })

      try {
        const results = await db
          .select({
            id: table.id,
            name: table.name,
          })
          .from(table)
          .where(or(...queries.map((q) => like(table.name, `%${q}%`))))
          .orderBy(asc(table.name))
          .limit(limit)

        console.debug(`✅ search${capitalize(entityName)}s result:`, {
          count: results.length,
        })
        return { success: true, [`${entityName}s`]: results }
      } catch (error) {
        console.error(`search${capitalize(entityName)}s failed:`, error)
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred'
        return {
          success: false,
          error: `Failed to search ${entityName}s: ${errorMessage}`,
        }
      }
    },
  }
}

/**
 * Factory to create discriminated union schemas for agent output
 * Eliminates manual OUTPUT_SCHEMA construction
 *
 * @example
 * ```typescript
 * const OUTPUT_SCHEMA = createAgentOutputSchema(
 *   'food',
 *   insertFoodSchema.omit({ createdBy: true }).extend({ nutrients: nutrientsSchema })
 * );
 * ```
 */
export function createAgentOutputSchema(
  entityName: string,
  insertSchema: z.ZodObject<z.ZodRawShape>,
) {
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  return z.object({
    result: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('existing'),
        id: z
          .string()
          .describe(
            `ID of existing ${entityName} found via search${capitalize(entityName)}s tool`,
          ),
      }),
      z.object({
        type: z.literal('new'),
        [entityName]: insertSchema,
      }),
    ]),
    explanation: z
      .string()
      .min(1)
      .describe('Conversational explanation of your choices and insights.'),
  })
}

/**
 * Generate standard system prompt with workflow
 * Eliminates manual prompt construction
 *
 * @example
 * ```typescript
 * const SYSTEM_PROMPT = createSystemPrompt({
 *   role: 'nutrition expert',
 *   task: 'create food entries',
 *   entityName: 'food',
 *   guidelines: [
 *     'Use BASE FOOD NAMES ONLY without preparation adjectives',
 *     'Base nutritional values on USDA FoodData Central',
 *   ],
 *   criticalRules: [
 *     'ALWAYS search before creating to avoid duplicates',
 *   ]
 * });
 * ```
 */
export function createSystemPrompt(config: {
  role: string // "nutrition expert", "culinary expert", "meal planning expert"
  task: string // "create food entries", "create recipes", "create meal plans"
  entityName: string // "food", "recipe", "meal"
  guidelines?: string[] // Optional specific guidelines
  criticalRules?: string[] // Optional critical rules (MUST/NEVER statements)
}): string {
  const { role, task, entityName, guidelines = [], criticalRules = [] } = config

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  const standardWorkflow = `IMPORTANT WORKFLOW:
1. ALWAYS search for existing ${entityName}s using the search${capitalize(entityName)}s tool first
2. If a matching ${entityName} is found:
   - Return { "result": { "type": "existing", "id": <id> }, "explanation": "..." }
   - Do NOT regenerate the ${entityName} details
   - Include the ${entityName} ID from the search results
3. If no suitable match exists:
   - Return { "result": { "type": "new", "${entityName}": {...} }, "explanation": "..." }
   - Generate complete ${entityName} data with all details
   - The schema describes all required and optional fields with their specific requirements
4. You MUST ALWAYS return a terse conversational explanation in its own key outside of the result`

  const parts = [
    `You are a ${role} helping users ${task} for a meal planning app.`,
    '',
    'Your task is to either find existing items in the database or generate new ones as needed. The schema provides detailed field descriptions and validation rules for all properties.',
    '',
    standardWorkflow,
  ]

  if (guidelines.length > 0) {
    parts.push(
      '',
      `${capitalize(entityName)} Guidelines:`,
      ...guidelines.map((g) => `- ${g}`),
    )
  }

  if (criticalRules.length > 0) {
    parts.push('', 'Critical Rules:', ...criticalRules.map((r) => `- ${r}`))
  }

  return parts.join('\n')
}
