import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check that returns status information
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || 'unknown'
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    }, { status: 500 });
  }
} 