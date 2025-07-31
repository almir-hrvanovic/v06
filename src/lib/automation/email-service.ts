import { db } from '@/lib/db/index'
import { EmailNotification } from './types'
import nodemailer from 'nodemailer'

// Create transporter based on environment configuration
const createTransporter = () => {
  const host = process.env.EMAIL_SERVER_HOST
  const port = process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 587
  const user = process.env.EMAIL_SERVER_USER
  const pass = process.env.EMAIL_SERVER_PASSWORD

  if (!host || !user || !pass) {
    console.warn('Email configuration not found. Email notifications will be logged only.')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  })
}

const transporter = createTransporter()

export async function sendEmailNotification(notification: EmailNotification): Promise<void> {
  try {
    // Get email template
    const template = await db.emailTemplate.findUnique({
      where: { name: notification.templateName, isActive: true }
    })

    if (!template) {
      throw new Error(`Email template '${notification.templateName}' not found`)
    }

    // Replace variables in template
    let subject = template.subject
    let htmlContent = template.htmlContent
    let textContent = template.textContent || ''

    Object.entries(notification.variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value))
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value))
      textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value))
    })

    // Send email or log if transporter not configured
    if (transporter) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@gs-cms.com',
        to: notification.to.join(', '),
        subject,
        html: htmlContent,
        text: textContent
      })
      console.log(`Email sent to ${notification.to.join(', ')}: ${subject}`)
    } else {
      console.log('Email notification (not sent - no email config):')
      console.log(`To: ${notification.to.join(', ')}`)
      console.log(`Subject: ${subject}`)
      console.log(`Template: ${notification.templateName}`)
      console.log(`Variables:`, notification.variables)
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

// Create default email templates
export async function createDefaultEmailTemplates(): Promise<void> {
  const templates = [
    {
      name: 'inquiry_assigned',
      subject: 'New Inquiry Assigned: {{inquiryTitle}}',
      htmlContent: `
        <h2>New Inquiry Assigned</h2>
        <p>Hello {{assigneeName}},</p>
        <p>A new inquiry has been assigned to you:</p>
        <ul>
          <li><strong>Title:</strong> {{inquiryTitle}}</li>
          <li><strong>Customer:</strong> {{customerName}}</li>
          <li><strong>Priority:</strong> {{priority}}</li>
          <li><strong>Deadline:</strong> {{deadline}}</li>
        </ul>
        <p>Please log in to the system to view details and take action.</p>
        <p>Best regards,<br>GS-CMS System</p>
      `,
      textContent: `
New Inquiry Assigned

Hello {{assigneeName}},

A new inquiry has been assigned to you:
- Title: {{inquiryTitle}}
- Customer: {{customerName}}
- Priority: {{priority}}
- Deadline: {{deadline}}

Please log in to the system to view details and take action.

Best regards,
GS-CMS System
      `,
      variables: ['assigneeName', 'inquiryTitle', 'customerName', 'priority', 'deadline']
    },
    {
      name: 'cost_approval_required',
      subject: 'Cost Approval Required: {{itemName}}',
      htmlContent: `
        <h2>Cost Approval Required</h2>
        <p>Hello {{managerName}},</p>
        <p>A cost calculation requires your approval:</p>
        <ul>
          <li><strong>Item:</strong> {{itemName}}</li>
          <li><strong>Total Cost:</strong> $\{{totalCost}}</li>
          <li><strong>Calculated By:</strong> {{calculatedBy}}</li>
          <li><strong>Notes:</strong> {{notes}}</li>
        </ul>
        <p>Please log in to review and approve or reject this calculation.</p>
        <p>Best regards,<br>GS-CMS System</p>
      `,
      textContent: `
Cost Approval Required

Hello {{managerName}},

A cost calculation requires your approval:
- Item: {{itemName}}
- Total Cost: $\{{totalCost}}
- Calculated By: {{calculatedBy}}
- Notes: {{notes}}

Please log in to review and approve or reject this calculation.

Best regards,
GS-CMS System
      `,
      variables: ['managerName', 'itemName', 'totalCost', 'calculatedBy', 'notes']
    },
    {
      name: 'deadline_reminder',
      subject: 'Deadline Reminder: {{entityType}} - {{entityName}}',
      htmlContent: `
        <h2>Deadline Reminder</h2>
        <p>Hello {{recipientName}},</p>
        <p>This is a reminder about an upcoming deadline:</p>
        <ul>
          <li><strong>Type:</strong> {{entityType}}</li>
          <li><strong>Name:</strong> {{entityName}}</li>
          <li><strong>Due Date:</strong> {{dueDate}}</li>
          <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
        </ul>
        <p>Please ensure completion before the deadline.</p>
        <p>Best regards,<br>GS-CMS System</p>
      `,
      textContent: `
Deadline Reminder

Hello {{recipientName}},

This is a reminder about an upcoming deadline:
- Type: {{entityType}}
- Name: {{entityName}}
- Due Date: {{dueDate}}
- Days Remaining: {{daysRemaining}}

Please ensure completion before the deadline.

Best regards,
GS-CMS System
      `,
      variables: ['recipientName', 'entityType', 'entityName', 'dueDate', 'daysRemaining']
    },
    {
      name: 'status_changed',
      subject: '{{entityType}} Status Changed: {{entityName}}',
      htmlContent: `
        <h2>Status Update</h2>
        <p>Hello {{recipientName}},</p>
        <p>The status has been updated:</p>
        <ul>
          <li><strong>Type:</strong> {{entityType}}</li>
          <li><strong>Name:</strong> {{entityName}}</li>
          <li><strong>Previous Status:</strong> {{oldStatus}}</li>
          <li><strong>New Status:</strong> {{newStatus}}</li>
          <li><strong>Updated By:</strong> {{updatedBy}}</li>
        </ul>
        <p>Best regards,<br>GS-CMS System</p>
      `,
      textContent: `
Status Update

Hello {{recipientName}},

The status has been updated:
- Type: {{entityType}}
- Name: {{entityName}}
- Previous Status: {{oldStatus}}
- New Status: {{newStatus}}
- Updated By: {{updatedBy}}

Best regards,
GS-CMS System
      `,
      variables: ['recipientName', 'entityType', 'entityName', 'oldStatus', 'newStatus', 'updatedBy']
    }
  ]

  for (const template of templates) {
    await db.emailTemplate.upsert({
      where: { name: template.name },
      update: template,
      create: template
    })
  }
}