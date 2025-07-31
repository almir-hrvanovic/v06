// Extended database types for additional models
// This supplements the basic types in types.ts

import type {
  Customer,
  Inquiry,
  InquiryItem,
  CostCalculation,
  Approval,
  Quote,
  ProductionOrder,
  FileAttachment,
  InquiryAttachment,
  ItemAttachment,
  AutomationRule,
  BusinessPartner,
  Prisma
} from '@prisma/client'

// Re-export additional types
export type {
  Customer,
  Inquiry,
  InquiryItem,
  CostCalculation,
  Approval,
  Quote,
  ProductionOrder,
  FileAttachment,
  InquiryAttachment,
  ItemAttachment,
  AutomationRule,
  BusinessPartner
}

// Generic CRUD operations interface
interface CrudOperations<T, CreateInput, UpdateInput> {
  findUnique: (args: any) => Promise<T | null>
  findMany: (args?: any) => Promise<T[]>
  create: (args: { data: CreateInput }) => Promise<T>
  update: (args: { where: any; data: UpdateInput }) => Promise<T>
  delete: (args: { where: any }) => Promise<T>
  count?: (args?: any) => Promise<number>
}

// Extended database operations
export interface ExtendedDatabaseOperations {
  // Customer operations
  customer: CrudOperations<Customer, any, any>
  
  // Inquiry operations
  inquiry: CrudOperations<Inquiry, any, any>
  
  // InquiryItem operations
  inquiryItem: CrudOperations<InquiryItem, any, any>
  
  // CostCalculation operations
  costCalculation: CrudOperations<CostCalculation, any, any>
  
  // Approval operations
  approval: CrudOperations<Approval, any, any>
  
  // Quote operations
  quote: CrudOperations<Quote, any, any>
  
  // ProductionOrder operations
  productionOrder: CrudOperations<ProductionOrder, any, any>
  
  // FileAttachment operations
  fileAttachment: CrudOperations<FileAttachment, any, any>
  
  // InquiryAttachment operations
  inquiryAttachment: CrudOperations<InquiryAttachment, any, any>
  
  // ItemAttachment operations
  itemAttachment: CrudOperations<ItemAttachment, any, any>
  
  // AutomationRule operations
  automationRule: CrudOperations<AutomationRule, any, any>
  
  // BusinessPartner operations
  businessPartner: CrudOperations<BusinessPartner, any, any>
  
  // Raw query support
  $queryRaw?: <T = any>(query: TemplateStringsArray, ...values: any[]) => Promise<T>
  $executeRaw?: (query: TemplateStringsArray, ...values: any[]) => Promise<number>
}