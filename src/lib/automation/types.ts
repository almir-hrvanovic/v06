import { AutomationTrigger, UserRole } from '@prisma/client'

export interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in'
  value: any
  logic?: 'AND' | 'OR'
}

export interface AutomationAction {
  type: ActionType
  params: Record<string, any>
}

export enum ActionType {
  ASSIGN_TO_USER = 'ASSIGN_TO_USER',
  ASSIGN_TO_ROLE = 'ASSIGN_TO_ROLE',
  SEND_EMAIL = 'SEND_EMAIL',
  CREATE_NOTIFICATION = 'CREATE_NOTIFICATION',
  UPDATE_STATUS = 'UPDATE_STATUS',
  CREATE_DEADLINE = 'CREATE_DEADLINE',
  ESCALATE = 'ESCALATE',
  CREATE_TASK = 'CREATE_TASK',
  TRIGGER_WEBHOOK = 'TRIGGER_WEBHOOK'
}

export interface RuleExecution {
  ruleId: string
  trigger: AutomationTrigger
  context: Record<string, any>
  userId?: string
}

export interface RuleResult {
  success: boolean
  executedActions: AutomationAction[]
  error?: string
  executionTime: number
}

export interface WorkloadBalance {
  userId: string
  role: UserRole
  activeItems: number
  pendingCosts: number
  totalWorkload: number
}

export interface EmailNotification {
  to: string[]
  templateName: string
  variables: Record<string, any>
}

export interface DeadlineConfig {
  entityType: 'INQUIRY' | 'INQUIRY_ITEM' | 'QUOTE' | 'PRODUCTION_ORDER'
  entityId: string
  dueDate: Date
  warningDays?: number
  escalationDays?: number
}