import type { ZodSchema } from 'zod'
import { auth } from '@/app/auth'

/**
 * Action result type for server actions
 * Uses discriminated union to handle success/error cases
 * Promise is built-in since all server actions are async
 *
 * @example
 * // Action signature (no need to wrap in Promise<>)
 * export async function createTeam(data: InsertTeam): ActionResult<SelectTeam> {
 *   return { success: true, data: team };
 * }
 *
 * @example
 * // Usage in components
 * const result = await createTeam(data);
 * if (result.success) {
 *   console.log(result.data); // TypeScript knows data exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 */
export type ActionResult<T> = Promise<
  { success: true; data: T } | { success: false; error: string }
>

/**
 * Validates input data against a Zod schema with standardized error formatting
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param entityName - Name of the entity for error messages (e.g., 'task', 'project')
 * @returns Success with validated data or failure with formatted error message
 *
 * @example
 * const validation = validateActionInput(insertTaskSchema, data, 'task');
 * if (!validation.success) return validation;
 * // Use validation.data with full type safety
 */
export function validateActionInput<T>(
  schema: ZodSchema<T>,
  data: unknown,
  entityName: string,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      error: `Invalid ${entityName} data: ${result.error.issues.map((e) => e.message).join(', ')}`,
    }
  }
  return { success: true, data: result.data }
}

/**
 * Validates an array of input data against a Zod schema with standardized error formatting
 *
 * @param schema - Zod schema to validate against
 * @param data - Array of data to validate
 * @param entityName - Name of the entity for error messages (e.g., 'task', 'project')
 * @returns Success with all validated data or failure with formatted error messages
 *
 * @example
 * const validation = validateBulkInput(insertTaskSchema, tasksData, 'task');
 * if (!validation.success) return validation;
 * // Use validation.data array with full type safety
 */
export function validateBulkInput<T>(
  schema: ZodSchema<T>,
  data: unknown[],
  entityName: string,
): { success: true; data: T[] } | { success: false; error: string } {
  const errors: string[] = []
  const validated: T[] = []

  data.forEach((item, i) => {
    const result = schema.safeParse(item)
    if (!result.success) {
      errors.push(
        `${entityName} ${i + 1}: ${result.error.issues.map((e) => e.message).join(', ')}`,
      )
    } else {
      validated.push(result.data)
    }
  })

  if (errors.length > 0) {
    return {
      success: false,
      error: `Invalid ${entityName} data: ${errors.join('; ')}`,
    }
  }
  return { success: true, data: validated }
}

/**
 * Wraps an action handler with authentication check and error handling
 * Automatically handles session verification and provides userId to handler
 *
 * @param handler - Async function that receives authenticated userId
 * @returns ActionResult with handler's return value or authentication error
 *
 * @example
 * export async function createTag(data: InsertTag): ActionResult<SelectTag> {
 *   return withAuth(async (userId) => {
 *     const validation = validateActionInput(insertTagSchema, data, 'tag');
 *     if (!validation.success) throw new Error(validation.error);
 *
 *     const isMember = await verifyTeamMembership(userId, validation.data.teamId);
 *     if (!isMember) throw new Error('Forbidden: Must be a team member');
 *
 *     return await createTagModel(validation.data);
 *   });
 * }
 */
export async function withAuth<T>(
  handler: (userId: number) => Promise<T>,
): ActionResult<T> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }
    const result = await handler(parseInt(session.user.id, 10))
    return { success: true, data: result }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: errorMessage }
  }
}

/**
 * Combines authentication and validation in a single wrapper
 * Provides both userId and validated data to handler
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @param entityName - Name of entity for error messages
 * @param handler - Async function receiving userId and validated data
 * @returns ActionResult with handler's return value or validation/auth error
 *
 * @example
 * export async function createTag(data: InsertTag): ActionResult<SelectTag> {
 *   return withAuthAndValidation(
 *     insertTagSchema,
 *     data,
 *     'tag',
 *     async (userId, validatedData) => {
 *       const isMember = await verifyTeamMembership(userId, validatedData.teamId);
 *       if (!isMember) throw new Error('Forbidden: Must be a team member');
 *       return await createTagModel(validatedData);
 *     }
 *   );
 * }
 */
export async function withAuthAndValidation<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  data: unknown,
  entityName: string,
  handler: (userId: number, validatedData: TInput) => Promise<TOutput>,
): ActionResult<TOutput> {
  return withAuth(async (userId) => {
    const validation = validateActionInput(schema, data, entityName)
    if (!validation.success) {
      throw new Error(validation.error)
    }
    return await handler(userId, validation.data)
  })
}
