import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { emailService } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can send quotes
    if (session.user.role !== UserRole.SUPERUSER && 
        session.user.role !== UserRole.ADMIN && 
        session.user.role !== UserRole.MANAGER && 
        session.user.role !== UserRole.SALES) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Get quote with full details
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        inquiry: {
          include: {
            customer: true,
            createdBy: true,
            items: true
          }
        },
        createdBy: true
      }
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    if (quote.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft quotes can be sent' },
        { status: 400 }
      )
    }

    // Update quote status to SENT
    await prisma.quote.update({
      where: { id },
      data: { 
        status: 'SENT'
      }
    })

    // Send email to customer if they have an email
    if (quote.inquiry.customer.email) {
      await emailService.sendEmail(
        quote.inquiry.customer.email,
        {
          subject: `Quote ${quote.quoteNumber} - ${quote.inquiry.title}`,
          html: `
            <h2>Quote ${quote.quoteNumber}</h2>
            <p>Dear ${quote.inquiry.customer.name},</p>
            <p>Please find attached your quote for: ${quote.inquiry.title}</p>
            <p><strong>Total Amount: $${quote.total.toFixed(2)}</strong></p>
            <p>This quote is valid until: ${new Date(quote.validUntil).toLocaleDateString()}</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>${quote.inquiry.createdBy.name}</p>
          `,
          text: `Quote ${quote.quoteNumber}\n\nDear ${quote.inquiry.customer.name},\n\nPlease find your quote for: ${quote.inquiry.title}\n\nTotal Amount: $${quote.total.toFixed(2)}\n\nThis quote is valid until: ${new Date(quote.validUntil).toLocaleDateString()}\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\n${quote.inquiry.createdBy.name}`
        }
      )
    }

    // Create notification for sales rep
    await prisma.notification.create({
      data: {
        userId: quote.inquiry.createdById,
        type: 'QUOTE_GENERATED',
        title: 'Quote Sent',
        message: `Quote ${quote.quoteNumber} has been sent to ${quote.inquiry.customer.name}`,
        data: {
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          relatedId: quote.id,
          relatedType: 'QUOTE'
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'QUOTE',
        entityId: quote.id,
        userId: session.user.id!,
        oldData: { status: quote.status },
        newData: { status: 'SENT' },
        metadata: {
          action: 'sent',
          quoteNumber: quote.quoteNumber,
          customer: quote.inquiry.customer.name,
          amount: quote.total
        }
      }
    })

    return NextResponse.json({ 
      message: 'Quote sent successfully',
      quote: { ...quote, status: 'SENT' }
    })
  } catch (error) {
    console.error('Failed to send quote:', error)
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    )
  }
}