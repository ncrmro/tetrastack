import { db } from '../src/database';
import {
  users,
  teams,
  teamMemberships,
  projects,
  tasks,
  tags,
  projectTags,
  comments,
} from '../src/database/schema';
import {
  teams as fixtureTeams,
  projects as fixtureProjects,
  tasks as fixtureTasks,
  tags as fixtureTags,
  users as fixtureUsers,
} from '../src/fixtures';

async function seed() {
  try {
    console.log('Starting to seed all data using fixture data...');

    // First, clear existing data in the correct order (child tables first)
    await db.delete(comments);
    await db.delete(projectTags);
    await db.delete(tasks);
    await db.delete(projects);
    await db.delete(tags);
    await db.delete(teamMemberships);
    await db.delete(teams);
    await db.delete(users);

    console.log('Cleared existing data');

    // Insert test users
    const insertedUsers = await db
      .insert(users)
      .values(fixtureUsers)
      .returning();
    console.log(`Created ${insertedUsers.length} users`);

    // Insert teams
    const insertedTeams = await db
      .insert(teams)
      .values(fixtureTeams)
      .returning();
    console.log(`Created ${insertedTeams.length} teams`);

    // Insert team memberships (add both users to each team)
    const teamMembershipsToInsert = [];
    for (const team of insertedTeams) {
      // Add first user as admin
      teamMembershipsToInsert.push({
        teamId: team.id,
        userId: insertedUsers[0].id,
        role: 'admin' as const,
        joinedAt: new Date(),
      });
      // Add second user as member
      if (insertedUsers[1]) {
        teamMembershipsToInsert.push({
          teamId: team.id,
          userId: insertedUsers[1].id,
          role: 'member' as const,
          joinedAt: new Date(),
        });
      }
    }
    await db.insert(teamMemberships).values(teamMembershipsToInsert);
    console.log(`Created ${teamMembershipsToInsert.length} team memberships`);

    // Insert tags
    const insertedTags = await db.insert(tags).values(fixtureTags).returning();
    console.log(`Created ${insertedTags.length} tags`);

    // Insert projects
    const insertedProjects = await db
      .insert(projects)
      .values(fixtureProjects)
      .returning();
    console.log(`Created ${insertedProjects.length} projects`);

    // Insert project-tag relationships (simple mapping for demo)
    const projectTagRelations = [];
    if (insertedProjects.length > 0 && insertedTags.length > 0) {
      // Assign first 2 tags to first 2 projects as examples
      for (let i = 0; i < Math.min(2, insertedProjects.length); i++) {
        for (let j = 0; j < Math.min(2, insertedTags.length); j++) {
          projectTagRelations.push({
            projectId: insertedProjects[i].id,
            tagId: insertedTags[j].id,
          });
        }
      }
      if (projectTagRelations.length > 0) {
        await db.insert(projectTags).values(projectTagRelations);
        console.log(
          `Created ${projectTagRelations.length} project-tag relationships`,
        );
      }
    }

    // Insert tasks
    const insertedTasks = await db
      .insert(tasks)
      .values(fixtureTasks)
      .returning();
    console.log(`Created ${insertedTasks.length} tasks`);

    console.log('All seeding completed successfully using fixture data!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}

// Only run if this file is executed directly
// Check if this module is the main module (not imported)
if (
  require.main === module ||
  import.meta.url === `file://${process.argv[1]}`
) {
  seed()
    .then(() => {
      console.log('Seeding finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };
