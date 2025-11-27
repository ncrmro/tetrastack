#!/usr/bin/env tsx

/**
 * Test script for GenerateProjectIdeasJob
 * Queries the database for a team, then runs the job
 */

import { db } from '@/database'
import { teams } from '@/database/schema.teams'
import { GenerateProjectIdeasJob } from './generate-project-ideas'

async function main() {
  console.log('='.repeat(60))
  console.log('Testing GenerateProjectIdeasJob')
  console.log('='.repeat(60))
  console.log('')

  // Step 1: Get the default team from the database (admin's team)
  console.log('Step 1: Fetching default team from database...')
  const allTeams = await db.select().from(teams).limit(1)

  if (allTeams.length === 0) {
    console.error(
      'Error: No teams found in database. Please seed the database first.',
    )
    console.log('\nRun: make up')
    process.exit(1)
  }

  const team = allTeams[0]
  console.log(`  Using team: "${team.name}" (${team.id.substring(0, 8)}...)`)
  console.log('  Using user: Admin (ID: 1)')
  console.log('')

  // Step 2: Run the job
  console.log('Step 2: Running GenerateProjectIdeasJob...')
  console.log(
    '  Theme: Generate innovative software project ideas for a tech startup',
  )
  console.log('  Count: 5')
  console.log('  User ID: 1 (admin)')
  console.log('')

  try {
    const result = await GenerateProjectIdeasJob.now({
      teamId: team.id,
      theme: 'Generate innovative software project ideas for a tech startup',
      count: 5,
      userId: 1,
    })

    console.log('')
    console.log('='.repeat(60))
    console.log('Job Completed Successfully!')
    console.log('='.repeat(60))
    console.log('')
    console.log('Results:')
    console.log(`  Projects created: ${result.data.projectsCreated}`)
    console.log(`  Tags created: ${result.data.tagsCreated}`)
    console.log('')
    console.log('Projects:')
    result.data.projects.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title}`)
      console.log(`     Slug: ${p.slug}`)
      console.log(`     Tags: ${p.tags.join(', ')}`)
      console.log('')
    })
    console.log('Metadata:')
    console.log(`  Job name: ${result.metadata.jobName}`)
    console.log(`  Status: ${result.metadata.status}`)
    console.log(`  Enqueued at: ${result.metadata.enqueuedAt}`)
    console.log(`  Started at: ${result.metadata.startedAt}`)
    console.log(`  Completed at: ${result.metadata.completedAt}`)
    if (result.metadata.completedAt && result.metadata.startedAt) {
      const duration =
        (result.metadata.completedAt.getTime() -
          result.metadata.startedAt.getTime()) /
        1000
      console.log(`  Duration: ${duration.toFixed(2)}s`)
    }

    process.exit(0)
  } catch (error) {
    console.error('')
    console.error('='.repeat(60))
    console.error('Job Failed!')
    console.error('='.repeat(60))
    console.error('')
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
