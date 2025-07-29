import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const languageSchema = z.object({
  language: z.enum(['en-US', 'hr-HR', 'de-DE', 'bs-BA'])
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { language } = languageSchema.parse(body)

    // Update user's preferred language
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
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
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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