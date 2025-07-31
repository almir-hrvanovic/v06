import { db } from '@/lib/db/index'
import { DeadlineEntity, DeadlineStatus } from '@/lib/db/types'
import { DeadlineConfig } from './types'
import { automationEngine } from './engine'
import { AutomationTrigger } from '@/lib/db/types'

export async function createDeadline(config: DeadlineConfig): Promise<void> {
  const { entityType, entityId, dueDate, warningDays = 3, escalationDays = 1 } = config

  // Calculate warning and escalation dates
  const warningDate = new Date(dueDate)
  warningDate.setDate(warningDate.getDate() - warningDays)
  
  const escalationDate = new Date(dueDate)
  escalationDate.setDate(escalationDate.getDate() - escalationDays)

  await db.deadline.upsert({
    where: {
      entityType_entityId: {
        entityType: entityType as DeadlineEntity,
        entityId
      }
    },
    update: {
      dueDate,
      warningDate,
      escalationDate,
      status: DeadlineStatus.ACTIVE
    },
    create: {
      entityType: entityType as DeadlineEntity,
      entityId,
      dueDate,
      warningDate,
      escalationDate,
      status: DeadlineStatus.ACTIVE
    }
  })
}

export async function checkDeadlines(): Promise<void> {
  const now = new Date()
  
  // Get all active deadlines
  const deadlines = await db.deadline.findMany({
    where: {
      status: DeadlineStatus.ACTIVE
    }
  })

  for (const deadline of deadlines) {
    try {
      // Check if overdue
      if (now > deadline.dueDate) {
        await handleOverdueDeadline(deadline)
        continue
      }

      // Check if needs escalation
      if (deadline.escalationDate && now > deadline.escalationDate && deadline.remindersSent < 2) {
        await handleDeadlineEscalation(deadline)
        continue
      }

      // Check if needs warning
      if (deadline.warningDate && now > deadline.warningDate && deadline.remindersSent === 0) {
        await handleDeadlineWarning(deadline)
      }
    } catch (error) {
      console.error(`Error processing deadline ${deadline.id}:`, error)
    }
  }
}

async function handleOverdueDeadline(deadline: any): Promise<void> {
  // Update deadline status
  await db.deadline.update({
    where: { id: deadline.id },
    data: { status: DeadlineStatus.OVERDUE }
  })

  // Get entity details
  const entityDetails = await getEntityDetails(deadline.entityType, deadline.entityId)
  
  // Trigger automation rules
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.DEADLINE_APPROACHING,
    context: {
      deadlineId: deadline.id,
      entityType: deadline.entityType,
      entityId: deadline.entityId,
      ...entityDetails,
      isOverdue: true,
      daysOverdue: Math.floor((Date.now() - deadline.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    }
  })
}

async function handleDeadlineEscalation(deadline: any): Promise<void> {
  // Update reminder count
  await db.deadline.update({
    where: { id: deadline.id },
    data: { remindersSent: 2 }
  })

  // Get entity details
  const entityDetails = await getEntityDetails(deadline.entityType, deadline.entityId)
  
  // Trigger automation rules with escalation context
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.DEADLINE_APPROACHING,
    context: {
      deadlineId: deadline.id,
      entityType: deadline.entityType,
      entityId: deadline.entityId,
      ...entityDetails,
      isEscalation: true,
      daysUntilDue: Math.floor((deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }
  })
}

async function handleDeadlineWarning(deadline: any): Promise<void> {
  // Update reminder count
  await db.deadline.update({
    where: { id: deadline.id },
    data: { remindersSent: 1 }
  })

  // Get entity details
  const entityDetails = await getEntityDetails(deadline.entityType, deadline.entityId)
  
  // Trigger automation rules
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.DEADLINE_APPROACHING,
    context: {
      deadlineId: deadline.id,
      entityType: deadline.entityType,
      entityId: deadline.entityId,
      ...entityDetails,
      isWarning: true,
      daysUntilDue: Math.floor((deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }
  })
}

async function getEntityDetails(entityType: DeadlineEntity, entityId: string): Promise<any> {
  switch (entityType) {
    case DeadlineEntity.INQUIRY:
      const inquiry = await db.inquiry.findUnique({
        where: { id: entityId },
        include: {
          customer: true,
          assignedTo: true,
          createdBy: true
        }
      })
      return {
        inquiry,
        inquiryId: entityId,
        inquiryTitle: inquiry?.title,
        customerName: inquiry?.customer.name,
        assignedToId: inquiry?.assignedToId,
        assigneeName: inquiry?.assignedTo?.name,
        assigneeEmail: inquiry?.assignedTo?.email
      }

    case DeadlineEntity.INQUIRY_ITEM:
      const item = await db.inquiryItem.findUnique({
        where: { id: entityId },
        include: {
          inquiry: {
            include: {
              customer: true
            }
          },
          assignedTo: true
        }
      })
      return {
        inquiryItem: item,
        inquiryItemId: entityId,
        itemName: item?.name,
        inquiryTitle: item?.inquiry.title,
        customerName: item?.inquiry.customer.name,
        assignedToId: item?.assignedToId,
        assigneeName: item?.assignedTo?.name,
        assigneeEmail: item?.assignedTo?.email
      }

    case DeadlineEntity.QUOTE:
      const quote = await db.quote.findUnique({
        where: { id: entityId },
        include: {
          inquiry: {
            include: {
              customer: true
            }
          },
          createdBy: true
        }
      })
      return {
        quote,
        quoteId: entityId,
        quoteNumber: quote?.quoteNumber,
        quoteTitle: quote?.title,
        customerName: quote?.inquiry.customer.name,
        createdById: quote?.createdById,
        creatorName: quote?.createdBy?.name,
        creatorEmail: quote?.createdBy?.email
      }

    case DeadlineEntity.PRODUCTION_ORDER:
      const order = await db.productionOrder.findUnique({
        where: { id: entityId },
        include: {
          quote: {
            include: {
              inquiry: {
                include: {
                  customer: true
                }
              }
            }
          }
        }
      })
      return {
        productionOrder: order,
        productionOrderId: entityId,
        orderNumber: order?.orderNumber,
        orderTitle: order?.title,
        customerName: order?.quote.inquiry.customer.name
      }

    default:
      return {}
  }
}

export async function completeDeadline(entityType: DeadlineEntity, entityId: string): Promise<void> {
  await db.deadline.updateMany({
    where: {
      entityType,
      entityId,
      status: { in: [DeadlineStatus.ACTIVE, DeadlineStatus.OVERDUE] }
    },
    data: {
      status: DeadlineStatus.COMPLETED,
      completedAt: new Date()
    }
  })
}