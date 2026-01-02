#!/usr/bin/env tsx

/**
 * Jobs CLI - Manage and monitor background jobs
 *
 * Usage:
 *   bin/jobs                                    Show help
 *   bin/jobs list                               List all jobs
 *   bin/jobs status <job-id>                    Show detailed job status
 *   bin/jobs generate-projects [options]        Create project generation job
 *
 * Examples:
 *   bin/jobs list
 *   bin/jobs status 01234567-89ab-cdef-0123-456789abcdef
 *   bin/jobs generate-projects --param theme="AI projects" --param count=5
 */

import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/database';
import { teams } from '@/database/schema.teams';
import {
  GenerateProjectIdeasJob,
  type GenerateProjectIdeasParams,
} from '@/jobs/generate-project-ideas';
import { jobs } from '@/lib/jobs/schema.jobs';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function colorStatus(status: string): string {
  switch (status) {
    case 'completed':
      return `${colors.green}${status}${colors.reset}`;
    case 'failed':
      return `${colors.red}${status}${colors.reset}`;
    case 'running':
      return `${colors.yellow}${status}${colors.reset}`;
    case 'pending':
      return `${colors.gray}${status}${colors.reset}`;
    default:
      return status;
  }
}

function formatDuration(
  start: Date | null | undefined,
  end: Date | null | undefined,
): string {
  if (!start || !end) return '-';
  const ms = end.getTime() - start.getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.substring(0, maxLen - 3)}...`;
}

async function listJobs() {
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  if (allJobs.length === 0) {
    console.log('No jobs found.');
    return;
  }

  const tableData = allJobs.map((job) => ({
    ID: truncate(job.id, 12),
    'Job Name': truncate(job.jobName, 30),
    Status: colorStatus(job.status),
    Progress: job.progress !== null ? `${job.progress}%` : '-',
    Created: new Date(job.createdAt).toLocaleString(),
    Completed: job.completedAt
      ? new Date(job.completedAt).toLocaleString()
      : '-',
    Duration: formatDuration(job.workerStartedAt, job.completedAt),
    Attempts: job.attemptCount,
  }));

  console.log(`\n${colors.bold}Jobs (showing last 50)${colors.reset}\n`);
  console.table(tableData);
}

async function showStatus(jobId: string) {
  let job;

  // If partial ID, search for it
  if (jobId.length < 36) {
    const allJobs = await db
      .select()
      .from(jobs)
      .where(sql`${jobs.id} LIKE ${`${jobId}%`}`)
      .limit(2);

    if (allJobs.length === 0) {
      console.error(
        `${colors.red}Error: No job found matching ${jobId}${colors.reset}`,
      );
      process.exit(1);
    }

    if (allJobs.length > 1) {
      console.error(
        `${colors.red}Error: Multiple jobs found matching ${jobId}${colors.reset}`,
      );
      console.error('Please provide a more specific ID:');
      allJobs.forEach((j) => {
        console.error(`  ${j.id} - ${j.jobName}`);
      });
      process.exit(1);
    }

    job = allJobs[0];
  } else {
    [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));

    if (!job) {
      console.error(
        `${colors.red}Error: Job ${jobId} not found${colors.reset}`,
      );
      process.exit(1);
    }
  }

  console.log(`\n${colors.bold}Job Details${colors.reset}`);
  console.log(`${colors.cyan}═${'═'.repeat(70)}${colors.reset}\n`);

  console.log(`${colors.bold}ID:${colors.reset}              ${job.id}`);
  console.log(`${colors.bold}Job Name:${colors.reset}        ${job.jobName}`);
  console.log(
    `${colors.bold}Status:${colors.reset}          ${colorStatus(job.status)}`,
  );
  console.log(
    `${colors.bold}Progress:${colors.reset}        ${job.progress !== null ? `${job.progress}%` : '-'}`,
  );
  if (job.progressMessage) {
    console.log(
      `${colors.bold}Message:${colors.reset}         ${job.progressMessage}`,
    );
  }
  console.log(
    `${colors.bold}Attempts:${colors.reset}        ${job.attemptCount}`,
  );
  console.log(
    `${colors.bold}Created:${colors.reset}         ${new Date(job.createdAt).toLocaleString()}`,
  );
  if (job.workerStartedAt) {
    console.log(
      `${colors.bold}Started:${colors.reset}         ${new Date(job.workerStartedAt).toLocaleString()}`,
    );
  }
  if (job.completedAt) {
    console.log(
      `${colors.bold}Completed:${colors.reset}       ${new Date(job.completedAt).toLocaleString()}`,
    );
    console.log(
      `${colors.bold}Duration:${colors.reset}        ${formatDuration(job.workerStartedAt, job.completedAt)}`,
    );
  }
  if (job.workerExpiresAt) {
    console.log(
      `${colors.bold}Lock Expires:${colors.reset}    ${new Date(job.workerExpiresAt).toLocaleString()}`,
    );
  }

  if (job.params) {
    console.log(`\n${colors.bold}Parameters:${colors.reset}`);
    console.log(JSON.stringify(job.params, null, 2));
  }

  if (job.result) {
    console.log(`\n${colors.bold}Result:${colors.reset}`);
    console.log(JSON.stringify(job.result, null, 2));
  }

  if (job.error) {
    console.log(`\n${colors.bold}Error:${colors.reset}`);
    console.log(`${colors.red}${job.error}${colors.reset}`);
  }

  console.log();
}

function parseParams(args: string[]): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--param')) continue;

    let keyValue: string;

    // Handle --param=key=value format
    if (arg.includes('=')) {
      keyValue = arg.replace(/^--param=?/, '');
    }
    // Handle --param key=value format (next argument)
    else if (i + 1 < args.length) {
      keyValue = args[i + 1];
      i++; // Skip next argument
    } else {
      console.error(`${colors.red}Invalid param format: ${arg}${colors.reset}`);
      console.error('Use: --param key=value or --param=key=value');
      process.exit(1);
    }

    const match = keyValue.match(/^(.+?)=(.+)$/);
    if (!match) {
      console.error(
        `${colors.red}Invalid param format: ${keyValue}${colors.reset}`,
      );
      console.error('Expected format: key=value');
      process.exit(1);
    }

    const [, key, value] = match;
    const keys = key.split('.');

    // Parse value (handle numbers, booleans, strings)
    let parsedValue: unknown = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!Number.isNaN(Number(value)) && value !== '')
      parsedValue = Number(value);

    // Set nested value
    let current: Record<string, unknown> = params;
    for (let j = 0; j < keys.length - 1; j++) {
      if (!current[keys[j]]) current[keys[j]] = {};
      current = current[keys[j]] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = parsedValue;
  }

  return params;
}

function parseFlags(args: string[]): {
  persist: boolean;
  concurrency: number;
} {
  const flags = {
    persist: true,
    concurrency: 3,
  };

  for (const arg of args) {
    if (arg === '--no-persist') {
      flags.persist = false;
    } else if (arg.startsWith('--concurrency=')) {
      const concurrencyStr = arg.substring('--concurrency='.length);
      const concurrency = parseInt(concurrencyStr, 10);
      if (Number.isNaN(concurrency) || concurrency <= 0) {
        console.error(
          `${colors.red}Error: --concurrency must be a positive integer${colors.reset}`,
        );
        process.exit(1);
      }
      flags.concurrency = concurrency;
    }
  }

  return flags;
}

async function generateProjects(args: string[]) {
  const customParams = parseParams(args);
  const flags = parseFlags(args);

  // Get default team if not specified
  let teamId = customParams.teamId;
  if (!teamId) {
    const allTeams = await db.select().from(teams).limit(1);
    if (allTeams.length === 0) {
      console.error(
        `${colors.red}Error: No teams found in database${colors.reset}`,
      );
      console.error('Please seed the database first with: make up');
      process.exit(1);
    }
    teamId = allTeams[0].id;
    console.log(
      `Using default team: "${allTeams[0].name}" (${String(teamId).substring(0, 8)}...)`,
    );
  }

  const params: GenerateProjectIdeasParams = {
    teamId: teamId as string,
    theme:
      (customParams.theme as string) ||
      'Generate innovative software project ideas',
    count: (customParams.count as number) || 10,
    userId: (customParams.userId as number) || 1,
  };

  console.log(`\n${colors.bold}Generating projects...${colors.reset}`);
  console.log(`Theme: ${params.theme}`);
  console.log(`Count: ${params.count}`);
  if (!flags.persist) {
    console.log(
      `${colors.gray}Note: Job will execute without database persistence (--no-persist)${colors.reset}`,
    );
  }
  console.log();

  try {
    const result = await GenerateProjectIdeasJob.now(params, {
      persist: flags.persist,
    });

    console.log(`${colors.green}✓ Job completed successfully${colors.reset}\n`);
    console.log(`Projects created: ${result.data.projectsCreated}`);
    console.log(`Tags created: ${result.data.tagsCreated}`);
    console.log(
      `Duration: ${formatDuration(result.metadata.startedAt, result.metadata.completedAt)}`,
    );
  } catch (error) {
    console.error(`\n${colors.red}✗ Job failed${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
${colors.bold}Jobs CLI - Manage and monitor background jobs${colors.reset}

${colors.bold}USAGE${colors.reset}
  bin/jobs [command] [options]

${colors.bold}COMMANDS${colors.reset}
  ${colors.cyan}list${colors.reset}                           List all jobs (last 50)
  ${colors.cyan}status <job-id>${colors.reset}                Show detailed job status
  ${colors.cyan}generate-projects [options]${colors.reset}    Create project generation job

${colors.bold}OPTIONS (for generate-projects)${colors.reset}
  --param key=value              Set a parameter (supports nested keys)
  --no-persist                   Skip database persistence (faster, no audit trail)
  --concurrency=N                Maximum concurrent jobs for batch mode (default: 3)

${colors.bold}EXAMPLES${colors.reset}
  ${colors.gray}# List all jobs${colors.reset}
  bin/jobs list

  ${colors.gray}# Show job details${colors.reset}
  bin/jobs status 01234567-89ab-cdef-0123-456789abcdef

  ${colors.gray}# Generate projects with custom parameters${colors.reset}
  bin/jobs generate-projects --param theme="AI and ML projects" --param count=5

  ${colors.gray}# Generate projects without database persistence (faster)${colors.reset}
  bin/jobs generate-projects --no-persist --param count=5

  ${colors.gray}# Generate projects with specific concurrency${colors.reset}
  bin/jobs generate-projects --concurrency=1 --param count=10
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (
    !command ||
    command === 'help' ||
    command === '--help' ||
    command === '-h'
  ) {
    showHelp();
    return;
  }

  switch (command) {
    case 'list':
      await listJobs();
      break;

    case 'status':
      if (!args[1]) {
        console.error(`${colors.red}Error: Missing job ID${colors.reset}`);
        console.error('Usage: bin/jobs status <job-id>');
        process.exit(1);
      }
      await showStatus(args[1]);
      break;

    case 'generate-projects':
      await generateProjects(args.slice(1));
      break;

    default:
      console.error(
        `${colors.red}Error: Unknown command "${command}"${colors.reset}`,
      );
      showHelp();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
