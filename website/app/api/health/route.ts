import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Simple health check — confirms the service is running.
 * Never exposes env var values, only confirms they are set.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    }
  );
}
