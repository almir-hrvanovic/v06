import { NextRequest, NextResponse } from 'next/server';
import { optimizedAuth } from '@/utils/supabase/optimized-auth'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const config = {
      hasToken: !!process.env.UPLOADTHING_TOKEN,
      tokenLength: process.env.UPLOADTHING_TOKEN?.length,
      tokenStart: process.env.UPLOADTHING_TOKEN?.substring(0, 20) + '...',
      appId: process.env.UPLOADTHING_APP_ID,
      nodeEnv: process.env.NODE_ENV,
    };

    // Check auth session
    let session = null;
    try {
      session = await getAuthenticatedUserFromRequest(request);
    } catch (error: any) {
      console.error('Auth error:', error);
    }

    return NextResponse.json({
      success: true,
      config,
      session: session ? {
        userId: session?.id,
        userName: session?.name,
        userEmail: session?.email,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}