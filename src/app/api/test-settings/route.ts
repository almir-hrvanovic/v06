import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Test API: Starting...')
    
    const settings = await prisma.systemSettings.findFirst()
    console.log('Test API: Settings found:', settings?.id)
    
    return NextResponse.json({
      success: true,
      settings: settings
    })
  } catch (error: any) {
    console.error('Test API: Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}