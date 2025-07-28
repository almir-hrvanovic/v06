import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { language } = await request.json()

    if (!language || !['hr-HR', 'en-US', 'de-DE'].includes(language)) {
      return NextResponse.json(
        { error: 'Invalid language' },
        { status: 400 }
      )
    }

    // Update user's preferred language
    await prisma.user.update({
      where: { id: session.user.id },
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