import { z } from 'zod'
import { UserRole, Priority, InquiryStatus, ItemStatus, ApprovalStatus, QuoteStatus } from '@prisma/client'

// User Validation Schemas
export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(UserRole),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
})

// Customer Validation Schemas
export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Inquiry Item Validation Schema
export const inquiryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unit: z.string().optional(),
  notes: z.string().optional(),
})

// Inquiry Validation Schemas
export const createInquirySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  customerId: z.string().cuid('Invalid customer ID'),
  priority: z.nativeEnum(Priority),
  deadline: z.date().optional(),
  items: z.array(inquiryItemSchema).min(1, 'At least one item is required'),
})

export const updateInquirySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  deadline: z.date().optional(),
  status: z.nativeEnum(InquiryStatus).optional(),
  assignedToId: z.string().cuid('Invalid user ID').optional(),
})

// Inquiry Item Update Schema
export const updateInquiryItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(ItemStatus).optional(),
  assignedToId: z.string().cuid('Invalid user ID').optional(),
})

// Cost Calculation Validation Schema
export const costCalculationSchema = z.object({
  materialCost: z.number().min(0, 'Material cost must be non-negative'),
  laborCost: z.number().min(0, 'Labor cost must be non-negative'),
  overheadCost: z.number().min(0, 'Overhead cost must be non-negative'),
  notes: z.string().optional(),
}).refine(
  (data) => data.materialCost + data.laborCost + data.overheadCost > 0,
  {
    message: 'Total cost must be greater than zero',
    path: ['totalCost'],
  }
)

// Approval Validation Schema
export const createApprovalSchema = z.object({
  costCalculationId: z.string().cuid('Invalid cost calculation ID'),
  status: z.nativeEnum(ApprovalStatus),
  comments: z.string().optional(),
})

// Quote Validation Schemas
export const createQuoteSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  inquiryId: z.string().cuid('Invalid inquiry ID'),
  margin: z.number().min(0, 'Margin must be non-negative').max(1, 'Margin cannot exceed 100%'),
  validUntil: z.date().min(new Date(), 'Valid until date must be in the future'),
  terms: z.string().optional(),
  notes: z.string().optional(),
})

export const updateQuoteSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  description: z.string().optional(),
  margin: z.number().min(0, 'Margin must be non-negative').max(1, 'Margin cannot exceed 100%').optional(),
  validUntil: z.date().min(new Date(), 'Valid until date must be in the future').optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(QuoteStatus).optional(),
})

// Assignment Validation Schema
export const assignItemSchema = z.object({
  itemId: z.string().cuid('Invalid item ID'),
  assigneeId: z.string().cuid('Invalid assignee ID'),
})

export const bulkAssignItemsSchema = z.object({
  itemIds: z.array(z.string().cuid('Invalid item ID')).min(1, 'At least one item must be selected'),
  assigneeId: z.string().cuid('Invalid assignee ID'),
})

// Filter Validation Schemas
export const inquiryFiltersSchema = z.object({
  status: z.array(z.nativeEnum(InquiryStatus)).optional(),
  priority: z.array(z.nativeEnum(Priority)).optional(),
  assignedToId: z.string().cuid('Invalid user ID').optional(),
  customerId: z.string().cuid('Invalid customer ID').optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

export const itemFiltersSchema = z.object({
  status: z.array(z.nativeEnum(ItemStatus)).optional(),
  assignedToId: z.string().cuid('Invalid user ID').optional(),
  inquiryId: z.string().cuid('Invalid inquiry ID').optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

// ID Schema
export const idSchema = z.object({
  id: z.string().cuid('Invalid ID format'),
})

// Search Schema
export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['users', 'customers', 'inquiries', 'items']).optional(),
})

// Email Schema
export const emailSchema = z.object({
  to: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  attachments: z.array(z.string()).optional(),
})

// Notification Schema
export const createNotificationSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  type: z.enum([
    'INQUIRY_ASSIGNED',
    'COST_CALCULATION_REQUESTED',
    'APPROVAL_REQUIRED',
    'QUOTE_GENERATED',
    'PRODUCTION_ORDER_CREATED',
    'DEADLINE_REMINDER',
    'STATUS_UPDATE',
  ]),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  data: z.record(z.any()).optional(),
})

// Bulk Operations Schema
export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, 'At least one ID is required'),
  updates: z.record(z.any()),
})

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1, 'At least one ID is required'),
})

// File Upload Schema
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().int().min(1, 'File size must be greater than 0'),
})

// Export Schema
export const exportSchema = z.object({
  type: z.enum(['csv', 'xlsx', 'pdf']),
  filters: z.record(z.any()).optional(),
  fields: z.array(z.string()).optional(),
})

// Report Schema
export const reportSchema = z.object({
  type: z.enum(['dashboard', 'workload', 'revenue', 'performance']),
  dateFrom: z.date(),
  dateTo: z.date(),
  filters: z.record(z.any()).optional(),
})

// Settings Schema
export const settingsSchema = z.object({
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    slack: z.boolean(),
  }).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
})

// Type helpers
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
export type CreateInquiryInput = z.infer<typeof createInquirySchema>
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>
export type CostCalculationInput = z.infer<typeof costCalculationSchema>
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>
export type InquiryFiltersInput = z.infer<typeof inquiryFiltersSchema>
export type ItemFiltersInput = z.infer<typeof itemFiltersSchema>