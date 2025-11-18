#!/usr/bin/env tsx

/**
 * Script to run the GenerateProjectIdeasJob
 *
 * Usage:
 *   npx tsx src/jobs/run-generate-projects.ts
 *   npx tsx src/jobs/run-generate-projects.ts --team-id=team-123
 *   npx tsx src/jobs/run-generate-projects.ts --theme="AI and ML projects" --count=5
 *
 * Defaults:
 *   --team-id     First team from database (typically Engineering from fixtures)
 *   --user-id     1 (admin user from fixtures)
 *   --theme       "Generate innovative software project ideas"
 *   --count       10
 */

import { GenerateProjectIdeasJob } from './generate-project-ideas';
import { db } from '@/database';
import { teams } from '@/database/schema.teams';

async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  const parseArg = (name: string, defaultValue: string): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };

  let teamId = parseArg('team-id', '');
  const theme = parseArg('theme', 'Generate innovative software project ideas');
  const count = parseInt(parseArg('count', '10'), 10);
  const userId = parseInt(parseArg('user-id', '1'), 10);

  // If no team-id provided, fetch the first team from database (admin's team)
  if (!teamId) {
    console.log(
      'No --team-id provided, fetching default team from database...',
    );
    const allTeams = await db.select().from(teams).limit(1);

    if (allTeams.length === 0) {
      console.error('Error: No teams found in database.');
      console.error('Please seed the database first with: make up');
      process.exit(1);
    }

    teamId = allTeams[0].id;
    console.log(
      `Using default team: "${allTeams[0].name}" (${teamId.substring(0, 8)}...)`,
    );
  }

  console.log('='.repeat(60));
  console.log('Generate Project Ideas Job');
  console.log('='.repeat(60));
  console.log('');

  try {
    const result = await GenerateProjectIdeasJob.now({
      teamId,
      theme,
      count,
      userId,
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('Job Completed Successfully!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Results:');
    console.log(`  Projects created: ${result.data.projectsCreated}`);
    console.log(`  Tags created: ${result.data.tagsCreated}`);
    console.log('');
    console.log('Projects:');
    result.data.projects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} (${p.slug})`);
      console.log(`     Tags: ${p.tags.join(', ')}`);
    });
    console.log('');
    console.log('Metadata:');
    console.log(`  Job name: ${result.metadata.jobName}`);
    console.log(`  Status: ${result.metadata.status}`);
    console.log(`  Enqueued at: ${result.metadata.enqueuedAt}`);
    console.log(`  Started at: ${result.metadata.startedAt}`);
    console.log(`  Completed at: ${result.metadata.completedAt}`);
    console.log(
      `  Duration: ${result.metadata.completedAt && result.metadata.startedAt ? `${(result.metadata.completedAt.getTime() - result.metadata.startedAt.getTime()) / 1000}s` : 'N/A'}`,
    );
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('Job Failed!');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
