import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('[TEST] Starting optimized auth test');
    
    // Test 1: Check if modules can be imported
    let importStatus = { optimizedAuth: false, cache: false, logger: false };
    
    try {
      const { optimizedAuth } = await import('@/utils/supabase/optimized-auth');
      importStatus.optimizedAuth = true;
      console.log('[TEST] ✅ optimizedAuth imported successfully');
      
      // Test 2: Try to get user
      const user = await optimizedAuth.getUser(request);
      console.log('[TEST] Auth result:', user ? `User found: ${user.email}` : 'No user');
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        duration,
        importStatus,
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role
        } : null,
        authenticated: !!user
      }, {
        headers: {
          'x-auth-duration': `${duration}ms`
        }
      });
      
    } catch (importError: any) {
      console.error('[TEST] Import error:', importError);
      return NextResponse.json({
        success: false,
        error: 'Import failed',
        details: importError.message,
        stack: importError.stack,
        importStatus
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[TEST] General error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}