import { db } from '@/lib/db/index'
import { AutomationRule, AutomationTrigger, AutomationLogStatus, UserRole } from '@/lib/db/types'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { 
  AutomationCondition, 
  AutomationAction, 
  RuleExecution, 
  RuleResult,
  ActionType,
  WorkloadBalance
} from './types'
import { sendEmailNotification } from './email-service'
import { createDeadline } from './deadline-service'

export class AutomationEngine {
  private static instance: AutomationEngine
  
  private constructor() {}
  
  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  async executeRulesForTrigger(execution: RuleExecution): Promise<RuleResult[]> {
    const startTime = Date.now()
    const results: RuleResult[] = []

    try {
      // Get all active rules for this trigger
      const rules = await db.automationRule.findMany({
        where: {
          trigger: execution.trigger,
          isActive: true
        },
        orderBy: {
          priority: 'desc'
        }
      })

      // Execute each rule
      for (const rule of rules) {
        const result = await this.executeRule(rule, execution)
        results.push(result)
        
        // Log the execution
        await db.automationLog.create({
          data: {
            ruleId: rule.id,
            status: result.success ? AutomationLogStatus.SUCCESS : AutomationLogStatus.FAILED,
            message: result.error || `Executed ${result.executedActions.length} actions`,
            errorDetails: result.error,
            executionTime: result.executionTime,
            triggeredData: execution.context,
            executedActions: result.executedActions as any,
            executedById: execution.userId
          }
        })
      }
    } catch (error) {
      console.error('Automation engine error:', error)
    }

    return results
  }

  private async executeRule(rule: AutomationRule, execution: RuleExecution): Promise<RuleResult> {
    const startTime = Date.now()
    const executedActions: AutomationAction[] = []

    try {
      // Check conditions
      const conditions = rule.conditions as unknown as AutomationCondition[]
      if (!this.evaluateConditions(conditions, execution.context)) {
        return {
          success: true,
          executedActions: [],
          executionTime: Date.now() - startTime
        }
      }

      // Execute actions
      const actions = rule.actions as unknown as AutomationAction[]
      for (const action of actions) {
        await this.executeAction(action, execution.context)
        executedActions.push(action)
      }

      return {
        success: true,
        executedActions,
        executionTime: Date.now() - startTime
      }
    } catch (error) {
      return {
        success: false,
        executedActions,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      }
    }
  }

  private evaluateConditions(conditions: AutomationCondition[], context: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true

    let result = true
    let previousLogic = 'AND'

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context)
      
      if (previousLogic === 'AND') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }
      
      previousLogic = condition.logic || 'AND'
    }

    return result
  }

  private evaluateCondition(condition: AutomationCondition, context: Record<string, any>): boolean {
    const fieldValue = this.getNestedValue(context, condition.field)
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private async executeAction(action: AutomationAction, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case ActionType.ASSIGN_TO_USER:
        await this.assignToUser(action.params, context)
        break
      case ActionType.ASSIGN_TO_ROLE:
        await this.assignToRole(action.params, context)
        break
      case ActionType.SEND_EMAIL:
        await this.sendEmail(action.params, context)
        break
      case ActionType.CREATE_NOTIFICATION:
        await this.createNotification(action.params, context)
        break
      case ActionType.UPDATE_STATUS:
        await this.updateStatus(action.params, context)
        break
      case ActionType.CREATE_DEADLINE:
        await this.createDeadlineAction(action.params, context)
        break
      case ActionType.ESCALATE:
        await this.escalate(action.params, context)
        break
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  private async assignToUser(params: any, context: Record<string, any>): Promise<void> {
    const { userId, entityType, entityId } = params
    
    if (entityType === 'inquiry') {
      await db.inquiry.update({
        where: { id: entityId || context.inquiryId },
        data: { assignedToId: userId }
      })
    } else if (entityType === 'inquiryItem') {
      await db.inquiryItem.update({
        where: { id: entityId || context.inquiryItemId },
        data: { assignedToId: userId }
      })
    }
  }

  private async assignToRole(params: any, context: Record<string, any>): Promise<void> {
    const { role, entityType, entityId, balanceWorkload } = params
    
    // Get user with least workload if balancing is enabled
    let userId: string
    
    if (balanceWorkload) {
      const workloads = await this.getWorkloadsByRole(role as UserRole)
      const leastBusy = workloads.reduce((prev, current) => 
        prev.totalWorkload < current.totalWorkload ? prev : current
      )
      userId = leastBusy.userId
    } else {
      // Get random active user with the role
      const users = await db.user.findMany({
        where: { role: role as UserRole, isActive: true }
      })
      if (users.length === 0) throw new Error(`No active users with role ${role}`)
      userId = users[Math.floor(Math.random() * users.length)].id
    }
    
    await this.assignToUser({ userId, entityType, entityId }, context)
  }

  private async getWorkloadsByRole(role: UserRole): Promise<WorkloadBalance[]> {
    const users = await db.user.findMany({
      where: { role, isActive: true },
      include: {
        inquiryItems: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }
        },
        costCalculations: {
          where: { isApproved: false }
        }
      }
    })

    return users.map(user => ({
      userId: user.id,
      role: user.role,
      activeItems: user.inquiryItems.length,
      pendingCosts: user.costCalculations.length,
      totalWorkload: user.inquiryItems.length + user.costCalculations.length
    }))
  }

  private async sendEmail(params: any, context: Record<string, any>): Promise<void> {
    const { templateName, to, variables } = params
    
    // Resolve recipient emails
    const recipients = await this.resolveRecipients(to, context)
    
    await sendEmailNotification({
      to: recipients,
      templateName,
      variables: { ...variables, ...context }
    })
  }

  private async resolveRecipients(to: any, context: Record<string, any>): Promise<string[]> {
    if (Array.isArray(to)) return to
    
    if (typeof to === 'string') {
      if (to.includes('@')) return [to]
      
      // Resolve special recipients
      switch (to) {
        case 'assignee':
          const assignee = await db.user.findUnique({
            where: { id: context.assignedToId }
          })
          return assignee?.email ? [assignee.email] : []
        case 'managers':
          const managers = await db.user.findMany({
            where: { role: UserRole.MANAGER, isActive: true }
          })
          return managers.map(m => m.email).filter(Boolean) as string[]
        default:
          return []
      }
    }
    
    return []
  }

  private async createNotification(params: any, context: Record<string, any>): Promise<void> {
    const { userId, type, title, message } = params
    
    await db.notification.create({
      data: {
        userId: userId || context.assignedToId,
        type,
        title,
        message,
        data: context
      }
    })
  }

  private async updateStatus(params: any, context: Record<string, any>): Promise<void> {
    const { entityType, entityId, status } = params
    
    if (entityType === 'inquiry') {
      await db.inquiry.update({
        where: { id: entityId || context.inquiryId },
        data: { status }
      })
    } else if (entityType === 'inquiryItem') {
      await db.inquiryItem.update({
        where: { id: entityId || context.inquiryItemId },
        data: { status }
      })
    }
  }

  private async createDeadlineAction(params: any, context: Record<string, any>): Promise<void> {
    const { entityType, entityId, daysFromNow, warningDays, escalationDays } = params
    
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysFromNow)
    
    await createDeadline({
      entityType,
      entityId: entityId || context[`${entityType}Id`],
      dueDate,
      warningDays,
      escalationDays
    })
  }

  private async escalate(params: any, context: Record<string, any>): Promise<void> {
    // Escalate to managers
    const managers = await db.user.findMany({
      where: { role: UserRole.MANAGER, isActive: true }
    })
    
    for (const manager of managers) {
      await this.createNotification({
        userId: manager.id,
        type: 'STATUS_UPDATE',
        title: params.title || 'Escalation Required',
        message: params.message || 'An item requires your attention'
      }, context)
    }
  }
}

export const automationEngine = AutomationEngine.getInstance()