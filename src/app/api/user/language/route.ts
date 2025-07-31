import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const languageSchema = z.object({
  language: z.enum(['en-US', 'hr-HR', 'de-DE', 'bs-BA'])
})

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { language } = languageSchema.parse(body)

    // Update user's preferred language
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { preferredLanguage: language },
      select: {
        id: true,
        preferredLanguage: true
      }
    })

    return NextResponse.json({
      success: true,
      preferredLanguage: updatedUser.preferredLanguage
    })

  } catch (error) {
    console.error('Language update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: user.id },
      select: { preferredLanguage: true }
    })

    return NextResponse.json({
      success: true,
      preferredLanguage: user?.preferredLanguage || 'hr-HR'
    })

  } catch (error) {
    console.error('Language fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}