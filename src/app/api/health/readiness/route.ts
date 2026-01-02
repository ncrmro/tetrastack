import { NextResponse } from 'next/server';
import { db } from '@/database';

export async function GET() {
  try {
    // Perform a simple database query to check connectivity
    const result = await db.$client.execute('SELECT 1 as health_check');

    // Check if we got a valid response
    if (result?.rows && result.rows.length > 0) {
      return NextResponse.json(
        {
          status: 'ready',
          timestamp: new Date().toISOString(),
          database: 'connected',
          check: result.rows[0],
        },
        { status: 200 },
      );
    } else {
      // Database returned but with unexpected format
      return NextResponse.json(
        {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          database: 'unexpected response',
          error: 'Database query returned unexpected format',
        },
        { status: 503 },
      );
    }
  } catch (error) {
    // Database connection or query failed
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error:
          error instanceof Error ? error.message : 'Unknown database error',
      },
      { status: 503 },
    );
  }
}
