import { 
  Prisma, 
  UserRole,
  InquiryStatus,
  Priority,
  ItemStatus,
  ApprovalType,
  ApprovalStatus,
  QuoteStatus,
  ProductionOrderStatus,
  ProductionItemStatus,
  NotificationType
} from '@prisma/client'

// Database Types
export type User = Prisma.UserGetPayload<{}>
export type Customer = Prisma.CustomerGetPayload<{}>
export type Inquiry = Prisma.InquiryGetPayload<{}>
export type InquiryItem = Prisma.InquiryItemGetPayload<{}>
export type CostCalculation = Prisma.CostCalculationGetPayload<{}>
export type Approval = Prisma.ApprovalGetPayload<{}>
export type Quote = Prisma.QuoteGetPayload<{}>
export type ProductionOrder = Prisma.ProductionOrderGetPayload<{}>
export type ProductionItem = Prisma.ProductionItemGetPayload<{}>
export type Notification = Prisma.NotificationGetPayload<{}>
export type AuditLog = Prisma.AuditLogGetPayload<{}>

// Enums
export {
  UserRole,
  InquiryStatus,
  Priority,
  ItemStatus,
  ApprovalType,
  ApprovalStatus,
  QuoteStatus,
  ProductionOrderStatus,
  ProductionItemStatus,
  NotificationType
} from '@prisma/client'

// Extended Types with Relations
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    createdInquiries: true
    assignedInquiries: true
    inquiryItems: true
    costCalculations: true
    approvals: true
    quotes: true
    notifications: {
      where: { isRead: false }
    }
  }
}>

export type InquiryWithRelations = Prisma.InquiryGetPayload<{
  include: {
    customer: true
    createdBy: true
    assignedTo: true
    items: {
      include: {
        assignedTo: true
        costCalculation: true
      }
    }
    quotes: true
  }
}>

export type InquiryItemWithRelations = Prisma.InquiryItemGetPayload<{
  include: {
    inquiry: {
      include: {
        customer: true
      }
    }
    assignedTo: true
    costCalculation: {
      include: {
        calculatedBy: true
        approvals: true
      }
    }
  }
}>

export type CostCalculationWithRelations = Prisma.CostCalculationGetPayload<{
  include: {
    inquiryItem: {
      include: {
        inquiry: {
          include: {
            customer: true
          }
        }
      }
    }
    calculatedBy: true
    approvals: {
      include: {
        approver: true
      }
    }
  }
}>

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    inquiry: {
      include: {
        customer: true
        items: {
          include: {
            costCalculation: true
          }
        }
      }
    }
    createdBy: true
    productionOrder: true
  }
}>

export type ProductionOrderWithRelations = Prisma.ProductionOrderGetPayload<{
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
    items: {
      include: {
        inquiryItem: true
      }
    }
  }
}>

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Form Types
export interface CreateUserForm {
  name: string
  email: string
  role: UserRole
}

export interface CreateCustomerForm {
  name: string
  email?: string
  phone?: string
  address?: string
}

export interface CreateInquiryForm {
  title: string
  description?: string
  customerId: string
  priority: Priority
  deadline?: Date
  items: CreateInquiryItemForm[]
}

export interface CreateInquiryItemForm {
  name: string
  description?: string
  quantity: number
  unit?: string
  notes?: string
}

export interface CostCalculationForm {
  materialCost: number
  laborCost: number
  overheadCost: number
  notes?: string
}

export interface CreateQuoteForm {
  title: string
  description?: string
  margin: number
  validUntil: Date
  terms?: string
  notes?: string
}

// Dashboard Types
export interface DashboardStats {
  totalInquiries: number
  activeInquiries: number
  pendingApprovals: number
  activeQuotes: number
  productionOrders: number
  revenue: number
}

export interface WorkloadStats {
  userId: string
  userName: string
  role: UserRole
  assignedItems: number
  completedItems: number
  pendingItems: number
  workloadPercentage: number
}

// Permission Types
export interface Permission {
  resource: string
  action: string
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}

// Filter Types
export interface InquiryFilters {
  status?: InquiryStatus[]
  priority?: Priority[]
  assignedToId?: string
  customerId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
}

export interface ItemFilters {
  status?: ItemStatus[]
  assignedToId?: string
  inquiryId?: string
  search?: string
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  category?: string
}

// Notification Types
export interface NotificationPayload {
  inquiryId?: string
  itemId?: string
  quoteId?: string
  approvalId?: string
  [key: string]: any
}

// Error Types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}