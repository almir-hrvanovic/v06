import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

class EmailService {
  private transporter: nodemailer.Transporter
  private from: string

  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@gs-cms.com'
    
    // Configure transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER!,
          pass: process.env.EMAIL_PASS!,
        },
      })
    } else {
      // Development - use Ethereal test account or console logging
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        })
      } else {
        // Fallback to console logging in development
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: false,
        })
      }
    }
  }

  async sendEmail(to: string | string[], template: EmailTemplate): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      if (process.env.NODE_ENV !== 'production') {
        console.log('Email sent:', info.messageId)
        if (info.envelope) {
          console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
        }
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  }

  // Template methods for different types of notifications
  createItemAssignmentTemplate(data: {
    userName: string
    itemName: string
    inquiryTitle: string
    customerName: string
    dueDate?: Date
  }): EmailTemplate {
    const subject = `New Item Assignment: ${data.itemName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Item Assignment</h1>
            </div>
            <div class="content">
              <p>Hello ${data.userName},</p>
              <p>You have been assigned a new item to work on:</p>
              
              <div class="highlight">
                <strong>Item:</strong> ${data.itemName}<br>
                <strong>Inquiry:</strong> ${data.inquiryTitle}<br>
                <strong>Customer:</strong> ${data.customerName}
                ${data.dueDate ? `<br><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}` : ''}
              </div>
              
              <p>Please log into the system to view the details and begin working on this item.</p>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="btn">View Dashboard</a>
            </div>
            <div class="footer">
              This is an automated message from GS-CMS v05. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
New Item Assignment

Hello ${data.userName},

You have been assigned a new item to work on:

Item: ${data.itemName}
Inquiry: ${data.inquiryTitle}
Customer: ${data.customerName}
${data.dueDate ? `Due Date: ${data.dueDate.toLocaleDateString()}` : ''}

Please log into the system to view the details and begin working on this item.

Dashboard: ${process.env.NEXTAUTH_URL}/dashboard

This is an automated message from GS-CMS v05.
    `

    return { subject, html, text }
  }

  createApprovalRequiredTemplate(data: {
    managerName: string
    itemName: string
    vpName: string
    totalCost: number
    inquiryTitle: string
  }): EmailTemplate {
    const subject = `Approval Required: ${data.itemName} - $${data.totalCost}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #ffc107; color: #212529; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .cost-box { background: #d4edda; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .cost-amount { font-size: 24px; font-weight: bold; color: #155724; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔍 Approval Required</h1>
            </div>
            <div class="content">
              <p>Hello ${data.managerName},</p>
              <p>A cost calculation requires your approval:</p>
              
              <div class="cost-box">
                <div><strong>Item:</strong> ${data.itemName}</div>
                <div><strong>Inquiry:</strong> ${data.inquiryTitle}</div>
                <div><strong>Calculated by:</strong> ${data.vpName}</div>
                <div class="cost-amount">$${data.totalCost.toLocaleString()}</div>
              </div>
              
              <p>Please review the cost calculation and approve or reject as appropriate.</p>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard/approvals" class="btn">Review Approvals</a>
            </div>
            <div class="footer">
              This is an automated message from GS-CMS v05. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Approval Required

Hello ${data.managerName},

A cost calculation requires your approval:

Item: ${data.itemName}
Inquiry: ${data.inquiryTitle}
Calculated by: ${data.vpName}
Total Cost: $${data.totalCost.toLocaleString()}

Please review the cost calculation and approve or reject as appropriate.

Review Approvals: ${process.env.NEXTAUTH_URL}/dashboard/approvals

This is an automated message from GS-CMS v05.
    `

    return { subject, html, text }
  }

  createApprovalStatusTemplate(data: {
    vpName: string
    itemName: string
    status: 'approved' | 'rejected'
    managerName: string
    comments?: string
  }): EmailTemplate {
    const subject = `Cost Calculation ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}: ${data.itemName}`
    const statusColor = data.status === 'approved' ? '#28a745' : '#dc3545'
    const statusIcon = data.status === 'approved' ? '✅' : '❌'
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${data.status === 'approved' ? '#d4edda' : '#f8d7da'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: ${statusColor}; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .status-box { background: ${data.status === 'approved' ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusIcon} Cost Calculation ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}</h1>
            </div>
            <div class="content">
              <p>Hello ${data.vpName},</p>
              <p>Your cost calculation has been <strong>${data.status}</strong> by ${data.managerName}:</p>
              
              <div class="status-box">
                <strong>Item:</strong> ${data.itemName}<br>
                <strong>Status:</strong> ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                ${data.comments ? `<br><strong>Comments:</strong> ${data.comments}` : ''}
              </div>
              
              ${data.status === 'approved' 
                ? '<p>The item can now proceed to the next stage in the workflow.</p>'
                : '<p>Please review the feedback and update your cost calculation accordingly.</p>'
              }
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard/costs" class="btn">View Cost Calculations</a>
            </div>
            <div class="footer">
              This is an automated message from GS-CMS v05. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Cost Calculation ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}

Hello ${data.vpName},

Your cost calculation has been ${data.status} by ${data.managerName}:

Item: ${data.itemName}
Status: ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}
${data.comments ? `Comments: ${data.comments}` : ''}

${data.status === 'approved' 
  ? 'The item can now proceed to the next stage in the workflow.'
  : 'Please review the feedback and update your cost calculation accordingly.'
}

View Cost Calculations: ${process.env.NEXTAUTH_URL}/dashboard/costs

This is an automated message from GS-CMS v05.
    `

    return { subject, html, text }
  }

  createQuoteReadyTemplate(data: {
    salesPersonName: string
    inquiryTitle: string
    customerName: string
    itemCount: number
  }): EmailTemplate {
    const subject = `Quote Ready: ${data.inquiryTitle}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; }
            .btn { display: inline-block; padding: 12px 24px; background: #17a2b8; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
            .quote-box { background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Quote Ready for Generation</h1>
            </div>
            <div class="content">
              <p>Hello ${data.salesPersonName},</p>
              <p>All cost calculations have been approved and the inquiry is ready for quote generation:</p>
              
              <div class="quote-box">
                <strong>Inquiry:</strong> ${data.inquiryTitle}<br>
                <strong>Customer:</strong> ${data.customerName}<br>
                <strong>Items:</strong> ${data.itemCount} approved items
              </div>
              
              <p>You can now generate and send the quote to the customer.</p>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard/quotes" class="btn">Generate Quote</a>
            </div>
            <div class="footer">
              This is an automated message from GS-CMS v05. Please do not reply to this email.
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Quote Ready for Generation

Hello ${data.salesPersonName},

All cost calculations have been approved and the inquiry is ready for quote generation:

Inquiry: ${data.inquiryTitle}
Customer: ${data.customerName}
Items: ${data.itemCount} approved items

You can now generate and send the quote to the customer.

Generate Quote: ${process.env.NEXTAUTH_URL}/dashboard/quotes

This is an automated message from GS-CMS v05.
    `

    return { subject, html, text }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email service verification failed:', error)
      return false
    }
  }
}

// Singleton instance
export const emailService = new EmailService()

// Helper function to send notifications based on system events
export async function sendNotificationEmail(
  type: 'assignment' | 'approval_required' | 'approval_status' | 'quote_ready',
  recipients: string[],
  data: any
): Promise<void> {
  let template: EmailTemplate

  switch (type) {
    case 'assignment':
      template = emailService.createItemAssignmentTemplate(data)
      break
    case 'approval_required':
      template = emailService.createApprovalRequiredTemplate(data)
      break
    case 'approval_status':
      template = emailService.createApprovalStatusTemplate(data)
      break
    case 'quote_ready':
      template = emailService.createQuoteReadyTemplate(data)
      break
    default:
      throw new Error(`Unknown notification type: ${type}`)
  }

  await emailService.sendEmail(recipients, template)
}