import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/index';
import { z } from 'zod';
import { optimizedAuth } from '@/utils/supabase/optimized-auth'

const languageSchema = z.object({
  language: z.enum(['hr', 'bs', 'en', 'de', 'hr-HR', 'bs-BA', 'en-US', 'de-DE'])
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await optimizedAuth.getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Users can only access their own language preference
    if (user.id !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userData = await db.user.findUnique({
      where: { id },
      select: { preferredLanguage: true }
    });

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ language: userData.preferredLanguage });
  } catch (error) {
    console.error('Error fetching user language:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔧 Language API PUT started');
  
  try {
    console.log('🔍 Getting server auth...');
    const authenticatedUser = await optimizedAuth.getUser(request);
    console.log('✅ User authenticated:', authenticatedUser?.id ? 'Valid' : 'Invalid');
    
    if (!authenticatedUser) {
      console.log('❌ No authenticated user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('📥 Parsing params...');
    const { id } = await params;
    console.log('🎯 Target user ID:', id, 'Session user ID:', authenticatedUser.id);

    // Users can only update their own language preference
    if (authenticatedUser.id !== id) {
      console.log('❌ User ID mismatch');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('📦 Parsing request body...');
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    console.log('✅ Validating language with schema...');
    const { language } = languageSchema.parse(body);
    console.log('🎯 Validated language:', language);

    console.log('💾 Checking if user exists...');
    const existingUser = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, preferredLanguage: true }
    });
    
    if (!existingUser) {
      console.log('❌ User not found in database:', id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('✅ User found:', existingUser.email, 'Current language:', existingUser.preferredLanguage);
    
    console.log('💾 Updating user language preference...');
    const updatedUser = await db.user.update({
      where: { id },
      data: { preferredLanguage: language },
      select: { preferredLanguage: true }
    });
    console.log('✅ Database updated:', updatedUser);

    // Set cookie for immediate UI update
    console.log('🍪 Creating response with cookie...');
    const response = NextResponse.json({ 
      language: updatedUser.preferredLanguage,
      message: 'Language preference updated successfully'
    });
    
    // Set cookie with immediate client-side access
    response.cookies.set('locale', language, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      httpOnly: false, // Allow client-side access for immediate updates
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/' // Ensure cookie is available site-wide
    });
    console.log('✅ Cookie set, returning response');

    return response;
  } catch (error) {
    console.error('❌ ERROR in language API:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error constructor:', error?.constructor?.name);
    console.error('❌ Error message:', (error as any)?.message);
    console.error('❌ Error stack:', (error as any)?.stack);
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation error:', error.errors);
      return NextResponse.json({ error: 'Invalid language', details: error.errors }, { status: 400 });
    }
    
    console.error('❌ Unexpected error updating user language:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: (error as any)?.message || 'Unknown error',
      type: (error as any)?.constructor?.name || 'Unknown'
    }, { status: 500 });
  }
}