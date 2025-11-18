import { seed } from '../../scripts/seed';

async function globalSetup() {
  console.log('Running global setup: seeding database...');

  try {
    await seed();
    console.log('Global setup completed: database seeded successfully');
  } catch (err) {
    console.error('Global setup failed:', err);
    throw err;
  }
}

export default globalSetup;
