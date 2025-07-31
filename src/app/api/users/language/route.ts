import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { language } = await request.json()

    if (!language || !['hr-HR', 'en-US', 'de-DE', 'bs-BA'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      )
    }

    // Update user's preferred language
    await db.user.update({
      where: { id: user.id },
      data: { preferredLanguage: language }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update language:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}