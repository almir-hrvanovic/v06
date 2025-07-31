import { automationEngine } from './engine'
import { AutomationTrigger } from '@prisma/client'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Hook to be called when inquiry is created
export async function onInquiryCreated(inquiryId: string, inquiry: any) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.INQUIRY_CREATED,
    context: {
      inquiryId,
      inquiry,
      inquiryTitle: inquiry.title,
      customerId: inquiry.customerId,
      customerName: inquiry.customer?.name,
      priority: inquiry.priority,
      deadline: inquiry.deadline,
      createdById: inquiry.createdById,
      creatorName: inquiry.createdBy?.name
    },
    userId: session?.user?.id
  })
}

// Hook to be called when inquiry status changes
export async function onInquiryStatusChanged(
  inquiryId: string, 
  oldStatus: string, 
  newStatus: string,
  inquiry: any
) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.INQUIRY_STATUS_CHANGED,
    context: {
      inquiryId,
      inquiry,
      oldStatus,
      newStatus,
      inquiryTitle: inquiry.title,
      customerId: inquiry.customerId,
      customerName: inquiry.customer?.name,
      assignedToId: inquiry.assignedToId,
      assigneeName: inquiry.assignedTo?.name
    },
    userId: session?.user?.id
  })
}

// Hook to be called when item is assigned
export async function onItemAssigned(
  itemId: string,
  assignedToId: string,
  item: any
) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.ITEM_ASSIGNED,
    context: {
      inquiryItemId: itemId,
      assignedToId,
      item,
      itemName: item.name,
      inquiryId: item.inquiryId,
      inquiryTitle: item.inquiry?.title,
      assigneeName: item.assignedTo?.name,
      assigneeEmail: item.assignedTo?.email
    },
    userId: session?.user?.id
  })
}

// Hook to be called when cost is calculated
export async function onCostCalculated(
  costCalculationId: string,
  calculation: any
) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.COST_CALCULATED,
    context: {
      costCalculationId,
      calculation,
      totalCost: calculation.totalCost,
      inquiryItemId: calculation.inquiryItemId,
      itemName: calculation.inquiryItem?.name,
      calculatedById: calculation.calculatedById,
      calculatedByName: calculation.calculatedBy?.name
    },
    userId: session?.user?.id
  })
}

// Hook to be called when approval is required
export async function onApprovalRequired(
  approvalId: string,
  approval: any,
  entityType: string,
  entity: any
) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.APPROVAL_REQUIRED,
    context: {
      approvalId,
      approval,
      entityType,
      entity,
      approverId: approval.approverId,
      approverName: approval.approver?.name,
      approverEmail: approval.approver?.email
    },
    userId: session?.user?.id
  })
}

// Hook to be called when quote is created
export async function onQuoteCreated(quoteId: string, quote: any) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.QUOTE_CREATED,
    context: {
      quoteId,
      quote,
      quoteNumber: quote.quoteNumber,
      quoteTitle: quote.title,
      totalValue: quote.total,
      inquiryId: quote.inquiryId,
      inquiryTitle: quote.inquiry?.title,
      customerId: quote.inquiry?.customerId,
      customerName: quote.inquiry?.customer?.name,
      createdById: quote.createdById,
      creatorName: quote.createdBy?.name
    },
    userId: session?.user?.id
  })
}

// Hook to be called when production order is created
export async function onProductionOrderCreated(
  orderId: string,
  order: any
) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.PRODUCTION_ORDER_CREATED,
    context: {
      productionOrderId: orderId,
      order,
      orderNumber: order.orderNumber,
      orderTitle: order.title,
      totalValue: order.totalValue,
      quoteId: order.quoteId,
      customerId: order.quote?.inquiry?.customerId,
      customerName: order.quote?.inquiry?.customer?.name
    },
    userId: session?.user?.id
  })
}

// Hook to check workload and trigger balancing if needed
export async function checkWorkloadBalance(role: string) {
  const user = await getAuthenticatedUser()
  
  await automationEngine.executeRulesForTrigger({
    ruleId: '',
    trigger: AutomationTrigger.WORKLOAD_THRESHOLD,
    context: {
      role,
      checkTime: new Date().toISOString()
    },
    userId: session?.user?.id
  })
}