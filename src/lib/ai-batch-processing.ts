/**
 * Provider-agnostic batch processing abstraction
 * Supports OpenAI Batch API and Anthropic Message Batches API
 *
 * ## Overview
 *
 * This module abstracts the differences between multiple LLM providers' batch processing APIs,
 * allowing you to write provider-agnostic code that works with both OpenAI and Anthropic (Claude).
 *
 * ## Key Features
 *
 * - **Provider abstraction**: Switch between providers with a simple parameter
 * - **Normalized status**: Common batch status across all providers
 * - **Normalized results**: Consistent result format regardless of provider
 * - **Object enums as const**: Type-safe, zero-runtime overhead constants
 * - **Validation**: Zod schemas for request and result validation
 * - **Async generators**: Memory-efficient streaming of results
 * - **Convenience functions**: High-level APIs for common workflows
 *
 * ## Supported Providers
 *
 * ### OpenAI Batch API
 * - Workflow: Upload JSONL → Create batch → Poll → Download JSONL results
 * - File-based: Requires file upload before batch creation
 * - Status states: `validating`, `in_progress`, `finalizing`, `completed`, `failed`, `expired`, `cancelled`
 *
 * ### Anthropic Message Batches API
 * - Workflow: Submit requests directly → Poll → Stream results
 * - Direct submission: No file upload required
 * - Status states: `in_progress`, `ended`
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   BATCH_PROVIDERS,
 *   submitAndWaitForBatch,
 *   streamBatchResults,
 * } from '@/lib/ai-batch-processing';
 *
 * // Create requests
 * const requests = [
 *   {
 *     customId: 'recipe-1',
 *     model: 'gpt-4o-mini',
 *     messages: [{ role: 'user', content: 'Create a recipe for chocolate cake' }],
 *     maxTokens: 2048,
 *   },
 * ];
 *
 * // Submit and wait (OpenAI)
 * const batch = await submitAndWaitForBatch(BATCH_PROVIDERS.OPENAI, requests);
 *
 * // Stream results
 * for await (const result of streamBatchResults(BATCH_PROVIDERS.OPENAI, batch.id)) {
 *   if (result.status === 'succeeded') {
 *     console.log(`${result.customId}: ${result.content}`);
 *   } else if (result.status === 'errored') {
 *     console.error(`${result.customId}: ${result.error?.message}`);
 *   }
 * }
 * ```
 *
 * ## Provider-Agnostic Usage
 *
 * ```typescript
 * // Select provider at runtime
 * const provider =
 *   process.env.BATCH_PROVIDER === 'anthropic'
 *     ? BATCH_PROVIDERS.ANTHROPIC
 *     : BATCH_PROVIDERS.OPENAI;
 *
 * const batch = await submitAndWaitForBatch(provider, requests);
 * ```
 *
 * ## Advanced: Direct Provider Usage
 *
 * ```typescript
 * const provider = createBatchProvider(BATCH_PROVIDERS.OPENAI);
 *
 * // Create batch
 * const batch = await provider.createBatch(requests);
 *
 * // Check status manually
 * const status = await provider.checkStatus(batch.id);
 *
 * // Cancel if needed
 * const cancelled = await provider.cancelBatch(batch.id);
 * ```
 *
 * ## Result Processing
 *
 * ```typescript
 * import {
 *   collectBatchResults,
 *   groupResultsByStatus,
 * } from '@/lib/ai-batch-processing';
 *
 * // Collect all results (loads into memory)
 * const allResults = await collectBatchResults(BATCH_PROVIDERS.OPENAI, batchId);
 *
 * // Group by status
 * const { succeeded, errored, expired, cancelled } = groupResultsByStatus(allResults);
 *
 * console.log(`Succeeded: ${succeeded.length}`);
 * console.log(`Failed: ${errored.length}`);
 * ```
 *
 * ## Implementation Checklist
 *
 * ### OpenAI Implementation ✅ (Complete)
 * - ✅ `uploadBatchFile()` - Convert requests to JSONL, upload to Files API
 * - ✅ `createBatch()` - Create batch with file ID
 * - ✅ `checkStatus()` - Poll OpenAI API for status
 * - ✅ `retrieveResults()` - Download and parse JSONL results
 * - ✅ `cancelBatch()` - Cancel in-progress batch
 *
 * ### Anthropic Implementation 🚧 (Stubs only - requires @anthropic-ai/sdk)
 * - [ ] `createBatch()` - Submit requests directly to Anthropic API
 * - [ ] `checkStatus()` - Poll Anthropic API for status
 * - [ ] `retrieveResults()` - Stream results from `results_url`
 * - [ ] `cancelBatch()` - Cancel in-progress batch
 * - [ ] `listBatches()` - List all batches in workspace (optional)
 *
 * ## Environment Variables
 *
 * ### OpenAI
 * ```
 * OPENAI_API_KEY=sk-...
 * ```
 *
 * ### Anthropic
 * ```
 * ANTHROPIC_API_KEY=sk-ant-...
 * ```
 *
 * ## Streaming vs. Collecting Results
 *
 * ### Streaming (Memory Efficient) 📊
 * ```typescript
 * for await (const result of streamBatchResults(provider, batchId)) {
 *   await saveToDatabase(result); // Process and discard immediately
 * }
 * ```
 *
 * ### Collecting (Convenience)
 * ```typescript
 * const allResults = await collectBatchResults(provider, batchId);
 * ```
 *
 * ## Limitations
 *
 * ### OpenAI
 * - Requires file upload for each batch
 * - Results available for 30 days
 *
 * ### Anthropic
 * - Batch limited to 100,000 requests or 256 MB
 * - Results available for 29 days
 * - Most batches complete within 1 hour
 *
 * ### Both
 * - Maximum 24-hour processing window
 * - No streaming requests (async only)
 * - No modifications after submission
 *
 * ## Migration Guide
 *
 * To switch providers, only change the provider parameter:
 *
 * ```typescript
 * // From OpenAI
 * const batch = await submitAndWaitForBatch(BATCH_PROVIDERS.OPENAI, requests);
 *
 * // To Anthropic (same requests)
 * const batch = await submitAndWaitForBatch(BATCH_PROVIDERS.ANTHROPIC, requests);
 * ```
 *
 * No other code changes needed!
 */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import OpenAI from 'openai'
import { z } from 'zod'

/**
 * Supported batch processing providers
 */
export const BATCH_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
} as const

export type BatchProvider =
  (typeof BATCH_PROVIDERS)[keyof typeof BATCH_PROVIDERS]

/**
 * Normalized batch status across all providers
 * Maps provider-specific statuses to common states
 */
export const BATCH_STATUS = {
  /** Batch created but not yet submitted to provider */
  PENDING: 'pending',
  /** Batch submitted and being processed */
  PROCESSING: 'processing',
  /** Batch processing completed (may contain failures) */
  COMPLETED: 'completed',
  /** Batch failed to process */
  FAILED: 'failed',
  /** Batch was cancelled by user */
  CANCELLED: 'cancelled',
  /** Batch expired (24-hour window) */
  EXPIRED: 'expired',
} as const

export type BatchStatus = (typeof BATCH_STATUS)[keyof typeof BATCH_STATUS]

/**
 * Individual request in a batch
 */
export interface BatchRequest {
  /** Unique identifier for this request (used to match results) */
  customId: string
  /** Model to use (e.g., "gpt-4o-mini", "claude-opus-4-1") */
  model: string
  /** Messages for the request */
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  /** Maximum tokens in response */
  maxTokens: number
  /** System prompt (optional) */
  systemPrompt?: string
  /** Temperature for sampling (optional) */
  temperature?: number
  /** Top P for sampling (optional) */
  topP?: number
}

/**
 * Individual result from a batch
 */
export interface BatchResult {
  /** Matches BatchRequest.customId */
  customId: string
  /** Result status */
  status: 'succeeded' | 'errored' | 'expired' | 'cancelled'
  /** Parsed response content (for succeeded requests) */
  content?: unknown
  /** Error details (for errored requests) */
  error?: {
    type: string
    message: string
  }
  /** Raw response from provider (for debugging) */
  rawResponse?: unknown
}

/**
 * Metadata about a submitted batch
 */
export interface BatchInfo {
  /** Internal batch ID (may differ from provider batch ID) */
  id: string
  /** Provider that handles this batch */
  provider: BatchProvider
  /** Current status */
  status: BatchStatus
  /** When batch was created */
  createdAt: Date
  /** When batch completed processing (if applicable) */
  completedAt?: Date
  /** Total number of requests */
  totalRequests: number
  /** Number of successful requests */
  successCount: number
  /** Number of failed requests */
  failureCount: number
  /** Provider-specific batch ID (openai: "batch_...", anthropic: "msgbatch_...") */
  providerBatchId: string
  /** URL to download results (if available) */
  resultsUrl?: string
  /** Error details (if batch failed) */
  error?: {
    type: string
    message: string
  }
}

/**
 * Provider interface - implemented by each LLM provider
 */
export interface IBatchProvider {
  /**
   * Submit a batch for processing
   */
  createBatch(requests: BatchRequest[]): Promise<BatchInfo>

  /**
   * Check the current status of a batch
   */
  checkStatus(batchId: string): Promise<BatchInfo>

  /**
   * Stream results from a completed batch
   * Results may arrive in any order - use customId to match requests
   */
  retrieveResults(batchId: string): AsyncGenerator<BatchResult>

  /**
   * Cancel an in-progress batch
   * May not immediately stop all requests
   */
  cancelBatch(batchId: string): Promise<BatchInfo>

  /**
   * List all batches (optional, for debugging/monitoring)
   */
  listBatches?(limit?: number): AsyncGenerator<BatchInfo>
}

/**
 * Validation schemas
 */
export const batchRequestSchema = z.object({
  customId: z.string().min(1),
  model: z.string().min(1),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    }),
  ),
  maxTokens: z.number().int().positive(),
  systemPrompt: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
})

export const batchResultSchema = z.object({
  customId: z.string(),
  status: z.enum(['succeeded', 'errored', 'expired', 'cancelled']),
  content: z.any().optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
    })
    .optional(),
  rawResponse: z.any().optional(),
})

/**
 * OpenAI Batch API Provider
 *
 * Workflow:
 * 1. Convert requests to JSONL format
 * 2. Upload JSONL file to OpenAI Files API
 * 3. Create batch with file ID
 * 4. Poll for completion
 * 5. Download results from output_file_id
 */
class OpenAIBatchProvider implements IBatchProvider {
  private openai: OpenAI

  constructor(apiKey: string = process.env.OPENAI_API_KEY || '') {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Convert BatchRequest to OpenAI batch format (JSONL line)
   */
  private buildOpenAIRequest(request: BatchRequest): Record<string, unknown> {
    const messages = request.systemPrompt
      ? [
          {
            role: 'system' as const,
            content: request.systemPrompt,
          },
          ...request.messages,
        ]
      : request.messages

    return {
      custom_id: request.customId,
      method: 'POST',
      url: '/v1/chat/completions',
      body: {
        model: request.model,
        messages,
        max_tokens: request.maxTokens,
        ...(request.temperature !== undefined && {
          temperature: request.temperature,
        }),
        ...(request.topP !== undefined && { top_p: request.topP }),
      },
    }
  }

  /**
   * Upload batch file to OpenAI Files API
   * Steps:
   * 1. Convert requests to JSONL format
   * 2. Create temporary file
   * 3. Upload to OpenAI Files API with purpose="batch"
   * 4. Clean up temp file
   * 5. Return file ID
   */
  private async uploadBatchFile(requests: BatchRequest[]): Promise<string> {
    // Convert requests to JSONL format
    const jsonlLines = requests
      .map((req) => JSON.stringify(this.buildOpenAIRequest(req)))
      .join('\n')

    // Create temporary file
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `batch-${Date.now()}.jsonl`)

    try {
      // Write JSONL content to temp file
      fs.writeFileSync(tempFilePath, jsonlLines, 'utf-8')

      // Upload file to OpenAI
      const file = await this.openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: 'batch',
      })

      return file.id
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }
    }
  }

  /**
   * Create a batch in OpenAI
   * Steps:
   * 1. Upload requests as JSONL file
   * 2. Create batch with file ID
   * 3. Map OpenAI batch object to BatchInfo
   * 4. Return BatchInfo
   */
  async createBatch(requests: BatchRequest[]): Promise<BatchInfo> {
    // Validate requests
    const validated = z.array(batchRequestSchema).safeParse(requests)
    if (!validated.success) {
      throw new Error(`Invalid batch requests: ${validated.error.message}`)
    }

    // Upload JSONL file
    const fileId = await this.uploadBatchFile(requests)

    // Create batch with file ID
    const openAIBatch = await this.openai.batches.create({
      input_file_id: fileId,
      endpoint: '/v1/chat/completions',
      completion_window: '24h',
    })

    return {
      id: openAIBatch.id,
      provider: BATCH_PROVIDERS.OPENAI,
      status: this.mapOpenAIStatus(openAIBatch.status),
      createdAt: new Date(openAIBatch.created_at * 1000),
      totalRequests: requests.length,
      successCount: openAIBatch.request_counts?.completed ?? 0,
      failureCount: openAIBatch.request_counts?.failed ?? 0,
      providerBatchId: openAIBatch.id,
    }
  }

  /**
   * Check the status of a batch
   */
  async checkStatus(batchId: string): Promise<BatchInfo> {
    const openAIBatch = await this.openai.batches.retrieve(batchId)

    return {
      id: openAIBatch.id,
      provider: BATCH_PROVIDERS.OPENAI,
      status: this.mapOpenAIStatus(openAIBatch.status),
      createdAt: new Date(openAIBatch.created_at * 1000),
      completedAt: openAIBatch.completed_at
        ? new Date(openAIBatch.completed_at * 1000)
        : undefined,
      totalRequests: openAIBatch.request_counts?.total ?? 0,
      successCount: openAIBatch.request_counts?.completed ?? 0,
      failureCount: openAIBatch.request_counts?.failed ?? 0,
      providerBatchId: openAIBatch.id,
      resultsUrl: openAIBatch.output_file_id
        ? `https://api.openai.com/v1/files/${openAIBatch.output_file_id}/content`
        : undefined,
    }
  }

  /**
   * Stream results from a completed batch
   * Yields results one at a time as they're parsed from JSONL
   */
  async *retrieveResults(batchId: string): AsyncGenerator<BatchResult> {
    // Get batch to find output_file_id
    const batch = await this.openai.batches.retrieve(batchId)

    if (!batch.output_file_id) {
      return
    }

    // Download results file from OpenAI
    const fileContent = await this.openai.files.content(batch.output_file_id)
    const text = await fileContent.text()

    // Parse JSONL line by line
    const lines = text.split('\n').filter((line: string) => line.trim())

    for (const line of lines) {
      try {
        const response = JSON.parse(line)
        yield this.mapOpenAIResult(response)
      } catch (error) {
        console.error('Failed to parse JSONL line:', line, error)
        // Continue processing remaining lines even if one fails
      }
    }
  }

  /**
   * Cancel a batch
   */
  async cancelBatch(batchId: string): Promise<BatchInfo> {
    const batch = await this.openai.batches.cancel(batchId)

    return {
      id: batch.id,
      provider: BATCH_PROVIDERS.OPENAI,
      status: this.mapOpenAIStatus(batch.status),
      createdAt: new Date(batch.created_at * 1000),
      completedAt: batch.completed_at
        ? new Date(batch.completed_at * 1000)
        : undefined,
      totalRequests: batch.request_counts?.total ?? 0,
      successCount: batch.request_counts?.completed ?? 0,
      failureCount: batch.request_counts?.failed ?? 0,
      providerBatchId: batch.id,
    }
  }

  /**
   * Map OpenAI status to normalized BatchStatus
   */
  private mapOpenAIStatus(openaiStatus: string): BatchStatus {
    switch (openaiStatus) {
      case 'validating':
      case 'in_progress':
      case 'finalizing':
        return BATCH_STATUS.PROCESSING
      case 'completed':
        return BATCH_STATUS.COMPLETED
      case 'failed':
        return BATCH_STATUS.FAILED
      case 'expired':
        return BATCH_STATUS.EXPIRED
      case 'cancelled':
        return BATCH_STATUS.CANCELLED
      default:
        return BATCH_STATUS.PROCESSING
    }
  }

  /**
   * Map OpenAI result format to normalized BatchResult
   */
  private mapOpenAIResult(response: Record<string, unknown>): BatchResult {
    // Type assertions needed for dynamic JSON parsing from OpenAI Batch API
    // OpenAI returns batch results as JSONL with optional error or response fields
    const customId = response.custom_id as string
    const error = response.error as
      | { code?: string; message?: string }
      | undefined
    const apiResponse = response.response as
      | { status_code?: number; body?: unknown }
      | undefined

    const baseResult = {
      customId,
      rawResponse: response,
    }

    if (error) {
      return {
        ...baseResult,
        status: 'errored' as const,
        error: {
          type: error.code || 'unknown_error',
          message: error.message || 'Unknown error',
        },
      }
    }

    if (apiResponse?.status_code === 200) {
      return {
        ...baseResult,
        status: 'succeeded' as const,
        content: apiResponse.body,
      }
    }

    return {
      ...baseResult,
      status: 'errored' as const,
      error: {
        type: 'api_error',
        message: `OpenAI API returned status ${apiResponse?.status_code}`,
      },
    }
  }
}

/**
 * Anthropic (Claude) Message Batches API Provider
 *
 * Workflow:
 * 1. Convert requests to Anthropic format
 * 2. Submit directly to Anthropic API (no file upload)
 * 3. Poll for completion
 * 4. Stream results from results_url
 */
class AnthropicBatchProvider implements IBatchProvider {
  constructor(apiKey: string = process.env.ANTHROPIC_API_KEY || '') {
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    this.apiKey = apiKey
  }

  /**
   * TODO: Implement Anthropic batch creation
   * Steps:
   * 1. Convert requests to Anthropic format
   * 2. Call anthropic.messages.batches.create() with requests array
   * 3. Map Anthropic batch object to BatchInfo
   * 4. Return BatchInfo
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async createBatch(_requests: BatchRequest[]): Promise<BatchInfo> {
    throw new Error('Not implemented - createBatch requires Anthropic SDK')
    // const anthropicRequests = requests.map((req) =>
    //   this.buildAnthropicRequest(req),
    // );
    //
    // const batch = await anthropic.messages.batches.create({
    //   requests: anthropicRequests,
    // });
    //
    // return {
    //   id: batch.id,
    //   provider: BATCH_PROVIDERS.ANTHROPIC,
    //   status: this.mapAnthropicStatus(batch.processing_status),
    //   createdAt: new Date(batch.created_at),
    //   totalRequests: requests.length,
    //   successCount: batch.request_counts.succeeded,
    //   failureCount: batch.request_counts.errored,
    //   providerBatchId: batch.id,
    //   resultsUrl: batch.results_url,
    // };
  }

  /**
   * TODO: Implement Anthropic status check
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkStatus(_batchId: string): Promise<BatchInfo> {
    throw new Error('Not implemented - checkStatus requires Anthropic SDK')
    // const batch = await anthropic.messages.batches.retrieve(batchId);
    //
    // return {
    //   id: batch.id,
    //   provider: BATCH_PROVIDERS.ANTHROPIC,
    //   status: this.mapAnthropicStatus(batch.processing_status),
    //   createdAt: new Date(batch.created_at),
    //   completedAt: batch.ended_at ? new Date(batch.ended_at) : undefined,
    //   totalRequests: batch.request_counts.processing +
    //     batch.request_counts.succeeded +
    //     batch.request_counts.errored +
    //     batch.request_counts.canceled +
    //     batch.request_counts.expired,
    //   successCount: batch.request_counts.succeeded,
    //   failureCount: batch.request_counts.errored,
    //   providerBatchId: batch.id,
    //   resultsUrl: batch.results_url,
    // };
  }

  /**
   * TODO: Implement Anthropic results retrieval
   * Stream results from the results_url endpoint
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *retrieveResults(_batchId: string): AsyncGenerator<BatchResult> {
    throw new Error('Not implemented - retrieveResults requires Anthropic SDK')
    // for await (const result of anthropic.messages.batches.results(batchId)) {
    //   yield this.mapAnthropicResult(result);
    // }
  }

  /**
   * TODO: Implement Anthropic batch cancellation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelBatch(_batchId: string): Promise<BatchInfo> {
    throw new Error('Not implemented - cancelBatch requires Anthropic SDK')
    // const batch = await anthropic.messages.batches.cancel(batchId);
    // return this.mapAnthropicBatch(batch);
  }

  /**
   * TODO: Implement Anthropic list batches
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async *listBatches(_limit: number = 10): AsyncGenerator<BatchInfo> {
    throw new Error('Not implemented - listBatches requires Anthropic SDK')
    // for await (const batch of anthropic.messages.batches.list({
    //   limit,
    // })) {
    //   yield this.mapAnthropicBatch(batch);
    // }
  }
}

/**
 * Create a batch provider instance
 *
 * Use this for direct provider control. For most use cases, prefer the convenience
 * functions like submitAndWaitForBatch() and streamBatchResults().
 *
 * @param provider - Which provider to use (BATCH_PROVIDERS.OPENAI or BATCH_PROVIDERS.ANTHROPIC)
 * @returns Provider instance implementing IBatchProvider interface
 *
 * @example
 * ```typescript
 * const provider = createBatchProvider(BATCH_PROVIDERS.OPENAI);
 * const batch = await provider.createBatch(requests);
 * const status = await provider.checkStatus(batch.id);
 * ```
 */
export function createBatchProvider(provider: BatchProvider): IBatchProvider {
  switch (provider) {
    case BATCH_PROVIDERS.OPENAI:
      return new OpenAIBatchProvider()
    case BATCH_PROVIDERS.ANTHROPIC:
      return new AnthropicBatchProvider()
    default: {
      const exhaustiveCheck: never = provider
      throw new Error(`Unknown batch provider: ${exhaustiveCheck}`)
    }
  }
}

/**
 * High-level convenience function: Submit and wait for batch to complete
 *
 * This is the recommended way to submit batches. It handles:
 * - Request validation
 * - Batch submission
 * - Polling for completion
 * - Error handling
 *
 * **Note**: This function blocks until the batch completes or times out.
 * For long-running batches, consider submitting without waiting and checking
 * status later.
 *
 * @param provider - Batch provider to use (BATCH_PROVIDERS.OPENAI or BATCH_PROVIDERS.ANTHROPIC)
 * @param requests - Array of batch requests to process
 * @param pollInterval - How often to check status in milliseconds (default: 60000 = 1 minute)
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 86400000 = 24 hours)
 * @returns Completed batch info with final status and result counts
 * @throws Error if batch fails or exceeds max wait time
 *
 * @example
 * ```typescript
 * const batch = await submitAndWaitForBatch(
 *   BATCH_PROVIDERS.OPENAI,
 *   requests,
 *   60000,  // Check every minute
 *   3600000 // Max 1 hour wait
 * );
 * console.log(`Batch ${batch.id} completed with ${batch.successCount} successes`);
 * ```
 */
export async function submitAndWaitForBatch(
  provider: BatchProvider,
  requests: BatchRequest[],
  pollInterval: number = 60000, // 1 minute
  maxWaitTime: number = 86400000, // 24 hours
): Promise<BatchInfo> {
  const batchProvider = createBatchProvider(provider)

  // Validate requests
  const validated = z.array(batchRequestSchema).safeParse(requests)
  if (!validated.success) {
    throw new Error(`Invalid batch requests: ${validated.error.message}`)
  }

  // Submit batch
  let batch = await batchProvider.createBatch(requests)
  console.log(`Submitted batch ${batch.id} to ${provider}`)

  // Poll for completion
  const startTime = Date.now()
  while (batch.status === BATCH_STATUS.PROCESSING) {
    const elapsed = Date.now() - startTime
    if (elapsed > maxWaitTime) {
      throw new Error(
        `Batch processing exceeded max wait time of ${maxWaitTime}ms`,
      )
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval))
    batch = await batchProvider.checkStatus(batch.id)
    console.log(`Batch ${batch.id} status: ${batch.status}`)
  }

  if (batch.status === BATCH_STATUS.FAILED) {
    throw new Error(`Batch ${batch.id} failed: ${batch.error?.message}`)
  }

  return batch
}

/**
 * Stream results from a batch one at a time (memory efficient)
 *
 * Results are yielded as they're parsed from the provider's response.
 * This is the preferred approach for large batches as it doesn't load
 * all results into memory at once.
 *
 * @param provider - Batch provider to use
 * @param batchId - ID of completed batch (use batch.id from submitAndWaitForBatch)
 * @returns Async generator that yields BatchResult objects
 *
 * @example
 * ```typescript
 * for await (const result of streamBatchResults(BATCH_PROVIDERS.OPENAI, batchId)) {
 *   if (result.status === 'succeeded') {
 *     await database.saveResult(result.customId, result.content);
 *   } else {
 *     console.error(`${result.customId} failed: ${result.error?.message}`);
 *   }
 * }
 * ```
 */
export async function* streamBatchResults(
  provider: BatchProvider,
  batchId: string,
): AsyncGenerator<BatchResult> {
  const batchProvider = createBatchProvider(provider)
  yield* batchProvider.retrieveResults(batchId)
}

/**
 * Collect all results from a batch into memory
 *
 * ⚠️ **WARNING**: This loads the entire result set into memory at once.
 * For large batches (>10k requests), prefer streamBatchResults() instead.
 *
 * Use this only when you need all results available at once, such as for
 * batch operations or analysis that requires random access.
 *
 * @param provider - Batch provider to use
 * @param batchId - ID of completed batch
 * @returns Promise that resolves to array of all results
 *
 * @example
 * ```typescript
 * const allResults = await collectBatchResults(BATCH_PROVIDERS.OPENAI, batchId);
 * const { succeeded, errored } = groupResultsByStatus(allResults);
 * console.log(`Success rate: ${succeeded.length / allResults.length * 100}%`);
 * ```
 */
export async function collectBatchResults(
  provider: BatchProvider,
  batchId: string,
): Promise<BatchResult[]> {
  const results: BatchResult[] = []
  for await (const result of streamBatchResults(provider, batchId)) {
    results.push(result)
  }
  return results
}

/**
 * Group batch results by their status
 *
 * This is a convenience function for organizing results for analysis.
 * Useful after collecting all results with collectBatchResults().
 *
 * @param results - Array of batch results
 * @returns Object with four arrays: succeeded, errored, expired, and cancelled results
 *
 * @example
 * ```typescript
 * const allResults = await collectBatchResults(provider, batchId);
 * const { succeeded, errored, expired, cancelled } = groupResultsByStatus(allResults);
 *
 * console.log(`✅ Succeeded: ${succeeded.length}`);
 * console.log(`❌ Failed: ${errored.length}`);
 * console.log(`⏱️ Expired: ${expired.length}`);
 * console.log(`🚫 Cancelled: ${cancelled.length}`);
 * ```
 */
export function groupResultsByStatus(results: BatchResult[]): {
  succeeded: BatchResult[]
  errored: BatchResult[]
  expired: BatchResult[]
  cancelled: BatchResult[]
} {
  return {
    succeeded: results.filter((r) => r.status === 'succeeded'),
    errored: results.filter((r) => r.status === 'errored'),
    expired: results.filter((r) => r.status === 'expired'),
    cancelled: results.filter((r) => r.status === 'cancelled'),
  }
}
