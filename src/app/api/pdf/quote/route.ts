import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { PDFService, generateQuoteNumber, getQuoteValidityDate } from '@/lib/pdf'
import { generateQuoteHTML } from '@/lib/pdf-templates'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inquiryId, includeDetails = true, validityDays = 30 } = await request.json()

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 })
    }

    // Fetch inquiry with all related data
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        customer: true,
        createdBy: true,
        items: {
          include: {
            costCalculation: true
          }
        }
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check permissions
    const userRole = session.user.role
    const canGenerate = ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'].includes(userRole) ||
      (userRole === 'VP' && inquiry.items.some(item => item.assignedToId === session.user.id))

    if (!canGenerate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Verify all items have cost calculations
    const itemsWithoutCosts = inquiry.items.filter(item => !item.costCalculation)
    if (itemsWithoutCosts.length > 0) {
      return NextResponse.json({
        error: 'Cannot generate quote: Some items do not have cost calculations',
        missingCosts: itemsWithoutCosts.map(item => ({ id: item.id, name: item.name }))
      }, { status: 400 })
    }

    // Generate quote details
    const quoteNumber = generateQuoteNumber()
    const validUntil = getQuoteValidityDate(validityDays)

    // Generate HTML content
    const htmlContent = generateQuoteHTML(inquiry, quoteNumber, validUntil)

    // Generate PDF
    const pdfBuffer = await PDFService.generatePDFFromHTML(htmlContent, {
      format: 'A4',
      orientation: 'portrait',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="quote-${quoteNumber}.pdf"`)
    headers.set('Content-Length', pdfBuffer.length.toString())

    return new NextResponse(pdfBuffer, { headers })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
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

    const { searchParams } = new URL(request.url)
    const inquiryId = searchParams.get('inquiryId')

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 })
    }

    // Check if inquiry exists and user has permission
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        items: {
          include: {
            costCalculation: true
          }
        }
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    const userRole = session.user.role
    const canGenerate = ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'].includes(userRole) ||
      (userRole === 'VP' && inquiry.items.some(item => item.assignedToId === session.user.id))

    if (!canGenerate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Return quote readiness status
    const itemsWithoutCosts = inquiry.items.filter(item => !item.costCalculation)
    const isReady = itemsWithoutCosts.length === 0

    return NextResponse.json({
      ready: isReady,
      totalItems: inquiry.items.length,
      costedItems: inquiry.items.length - itemsWithoutCosts.length,
      missingCosts: itemsWithoutCosts.map(item => ({ id: item.id, name: item.name })),
      estimatedValue: inquiry.items.reduce((sum, item) => 
        sum + (item.costCalculation?.totalCost?.toNumber() || 0), 0
      )
    })
  } catch (error) {
    console.error('Quote status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check quote status' },
      { status: 500 }
    )
  }
}