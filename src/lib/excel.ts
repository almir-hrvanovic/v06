import ExcelJS from 'exceljs'
import { Inquiry, InquiryItem, User, Customer, CostCalculation } from '@prisma/client'
import { formatDate, formatCurrency } from '@/lib/utils'

export interface ExcelExportOptions {
  fileName?: string
  includeCharts?: boolean
  includeFormatting?: boolean
  includeSummary?: boolean
  companyInfo?: {
    name: string
    address: string
    phone: string
    email: string
    website: string
  }
}

export class ExcelService {
  static async createWorkbook(options: ExcelExportOptions = {}): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook()
    
    // Set workbook properties
    workbook.creator = 'GS-CMS v05'
    workbook.lastModifiedBy = 'GS-CMS v05'
    workbook.created = new Date()
    workbook.modified = new Date()
    workbook.lastPrinted = new Date()
    
    return workbook
  }

  static async exportInquiriesToExcel(
    inquiries: (Inquiry & {
      customer: Customer
      createdBy: User
      items: (InquiryItem & {
        costCalculation: CostCalculation | null
      })[]
    })[],
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = await this.createWorkbook(options)
    
    // Create main data worksheet
    const worksheet = workbook.addWorksheet('Inquiries')
    
    // Set up company header if provided
    if (options.companyInfo) {
      worksheet.mergeCells('A1:K3')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = `${options.companyInfo.name}\nInquiries Export Report\nGenerated on ${formatDate(new Date())}`
      headerCell.font = { size: 16, bold: true, color: { argb: '004472C4' } }
      headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      }
    }

    // Set up column headers
    const startRow = options.companyInfo ? 5 : 1
    const headers = [
      'ID',
      'Title', 
      'Customer',
      'Status',
      'Priority',
      'Total Value',
      'Items Count',
      'Created By',
      'Created Date',
      'Updated Date',
      'Description'
    ]

    const headerRow = worksheet.getRow(startRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Add data rows
    inquiries.forEach((inquiry, index) => {
      const row = worksheet.getRow(startRow + 1 + index)
      
      row.getCell(1).value = inquiry.id.slice(-8) // Last 8 chars of ID
      row.getCell(2).value = inquiry.title
      row.getCell(3).value = inquiry.customer.name
      row.getCell(4).value = inquiry.status
      row.getCell(5).value = inquiry.priority
      row.getCell(6).value = inquiry.totalValue?.toNumber() || 0
      row.getCell(7).value = inquiry.items.length
      row.getCell(8).value = inquiry.createdBy.name
      row.getCell(9).value = inquiry.createdAt
      row.getCell(10).value = inquiry.updatedAt
      row.getCell(11).value = inquiry.description || ''

      // Apply conditional formatting based on status
      const statusCell = row.getCell(4)
      switch (inquiry.status as string) {
        case 'COMPLETED':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }
          break
        case 'IN_PROGRESS':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
          break
        case 'DRAFT':
          statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } }
          break
      }

      // Apply conditional formatting based on priority
      const priorityCell = row.getCell(5)
      switch (inquiry.priority) {
        case 'HIGH':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } }
          break
        case 'MEDIUM':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } }
          break
        case 'LOW':
          priorityCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } }
          break
      }

      // Format currency
      row.getCell(6).numFmt = '"$"#,##0.00_);("$"#,##0.00)'
      
      // Format dates
      row.getCell(9).numFmt = 'dd/mm/yyyy hh:mm'
      row.getCell(10).numFmt = 'dd/mm/yyyy hh:mm'

      // Add borders
      for (let i = 1; i <= headers.length; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    })

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length
      const columnData = inquiries.map((inquiry) => {
        switch (index) {
          case 0: return inquiry.id.slice(-8)
          case 1: return inquiry.title
          case 2: return inquiry.customer.name
          case 3: return inquiry.status
          case 4: return inquiry.priority
          case 5: return formatCurrency(inquiry.totalValue?.toNumber() || 0)
          case 6: return inquiry.items.length.toString()
          case 7: return inquiry.createdBy.name
          case 8: return formatDate(inquiry.createdAt)
          case 9: return formatDate(inquiry.updatedAt)
          case 10: return inquiry.description || ''
          default: return ''
        }
      })
      
      columnData.forEach((data) => {
        if (data && data.length > maxLength) {
          maxLength = data.length
        }
      })
      
      column.width = Math.min(maxLength + 2, 50) // Max width of 50
    })

    // Add summary worksheet if requested
    if (options.includeSummary) {
      const summaryWorksheet = workbook.addWorksheet('Summary')
      
      // Calculate summary statistics
      const totalInquiries = inquiries.length
      const totalValue = inquiries.reduce((sum, inq) => sum + (inq.totalValue?.toNumber() || 0), 0)
      const averageValue = totalValue / totalInquiries
      const statusCounts = inquiries.reduce((acc, inq) => {
        acc[inq.status] = (acc[inq.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      const priorityCounts = inquiries.reduce((acc, inq) => {
        acc[inq.priority] = (acc[inq.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Summary header
      summaryWorksheet.mergeCells('A1:B1')
      const summaryHeaderCell = summaryWorksheet.getCell('A1')
      summaryHeaderCell.value = 'Inquiries Summary Report'
      summaryHeaderCell.font = { size: 18, bold: true, color: { argb: '004472C4' } }
      summaryHeaderCell.alignment = { horizontal: 'center' }

      // Basic statistics
      const currentRow = 3
      const summaryData = [
        ['Total Inquiries', totalInquiries],
        ['Total Value', totalValue],
        ['Average Value', averageValue],
        ['', ''],
        ['Status Breakdown', ''],
        ...Object.entries(statusCounts).map(([status, count]) => [status, count]),
        ['', ''],
        ['Priority Breakdown', ''],
        ...Object.entries(priorityCounts).map(([priority, count]) => [priority, count])
      ]

      summaryData.forEach(([label, value], index) => {
        const row = summaryWorksheet.getRow(currentRow + index)
        row.getCell(1).value = label
        row.getCell(2).value = value
        
        if (label === 'Status Breakdown' || label === 'Priority Breakdown') {
          row.getCell(1).font = { bold: true }
        }
        
        if (typeof value === 'number' && typeof label === 'string' && (label.includes('Value') || label.includes('Total'))) {
          row.getCell(2).numFmt = '"$"#,##0.00_);("$"#,##0.00)'
        }
      })

      // Auto-fit summary columns
      summaryWorksheet.getColumn(1).width = 20
      summaryWorksheet.getColumn(2).width = 15
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  static async exportUsersToExcel(
    users: User[],
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = await this.createWorkbook(options)
    const worksheet = workbook.addWorksheet('Users')

    // Set up company header if provided
    if (options.companyInfo) {
      worksheet.mergeCells('A1:G3')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = `${options.companyInfo.name}\nUsers Export Report\nGenerated on ${formatDate(new Date())}`
      headerCell.font = { size: 16, bold: true, color: { argb: '004472C4' } }
      headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      }
    }

    // Set up column headers
    const startRow = options.companyInfo ? 5 : 1
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Created Date', 'Last Updated']

    const headerRow = worksheet.getRow(startRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Add data rows
    users.forEach((user, index) => {
      const row = worksheet.getRow(startRow + 1 + index)
      
      row.getCell(1).value = user.id.slice(-8)
      row.getCell(2).value = user.name
      row.getCell(3).value = user.email
      row.getCell(4).value = user.role
      row.getCell(5).value = user.isActive ? 'Active' : 'Inactive'
      row.getCell(6).value = user.createdAt
      row.getCell(7).value = user.updatedAt

      // Apply conditional formatting
      const statusCell = row.getCell(5)
      if (user.isActive) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } }
      }

      // Format dates
      row.getCell(6).numFmt = 'dd/mm/yyyy hh:mm'
      row.getCell(7).numFmt = 'dd/mm/yyyy hh:mm'

      // Add borders
      for (let i = 1; i <= headers.length; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    })

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length
      const columnData = users.map((user) => {
        switch (index) {
          case 0: return user.id.slice(-8)
          case 1: return user.name
          case 2: return user.email
          case 3: return user.role
          case 4: return user.isActive ? 'Active' : 'Inactive'
          case 5: return formatDate(user.createdAt)
          case 6: return formatDate(user.updatedAt)
          default: return ''
        }
      })
      
      columnData.forEach((data) => {
        if (data && data.length > maxLength) {
          maxLength = data.length
        }
      })
      
      column.width = Math.min(maxLength + 2, 50)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }

  static async exportCustomersToExcel(
    customers: (Customer & {
      _count: { inquiries: number }
    })[],
    options: ExcelExportOptions = {}
  ): Promise<Buffer> {
    const workbook = await this.createWorkbook(options)
    const worksheet = workbook.addWorksheet('Customers')

    // Set up company header if provided
    if (options.companyInfo) {
      worksheet.mergeCells('A1:H3')
      const headerCell = worksheet.getCell('A1')
      headerCell.value = `${options.companyInfo.name}\nCustomers Export Report\nGenerated on ${formatDate(new Date())}`
      headerCell.font = { size: 16, bold: true, color: { argb: '004472C4' } }
      headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF2F2F2' }
      }
    }

    // Set up column headers
    const startRow = options.companyInfo ? 5 : 1
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Inquiries Count', 'Status', 'Created Date']

    const headerRow = worksheet.getRow(startRow)
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1)
      cell.value = header
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      }
      cell.alignment = { horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // Add data rows
    customers.forEach((customer, index) => {
      const row = worksheet.getRow(startRow + 1 + index)
      
      row.getCell(1).value = customer.id.slice(-8)
      row.getCell(2).value = customer.name
      row.getCell(3).value = customer.email
      row.getCell(4).value = customer.phone || ''
      row.getCell(5).value = customer.address || ''
      row.getCell(6).value = customer._count.inquiries
      row.getCell(7).value = customer.isActive ? 'Active' : 'Inactive'
      row.getCell(8).value = customer.createdAt

      // Apply conditional formatting
      const statusCell = row.getCell(7)
      if (customer.isActive) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF90EE90' } }
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6B6B' } }
      }

      // Format dates
      row.getCell(8).numFmt = 'dd/mm/yyyy hh:mm'

      // Add borders
      for (let i = 1; i <= headers.length; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    })

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      let maxLength = headers[index].length
      const columnData = customers.map((customer) => {
        switch (index) {
          case 0: return customer.id.slice(-8)
          case 1: return customer.name
          case 2: return customer.email
          case 3: return customer.phone || ''
          case 4: return customer.address || ''
          case 5: return customer._count.inquiries.toString()
          case 6: return customer.isActive ? 'Active' : 'Inactive'
          case 7: return formatDate(customer.createdAt)
          default: return ''
        }
      })
      
      columnData.forEach((data) => {
        if (data && data.length > maxLength) {
          maxLength = data.length
        }
      })
      
      column.width = Math.min(maxLength + 2, 50)
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }
}

// Default company information for exports
export const DEFAULT_EXCEL_COMPANY_INFO = {
  name: 'GS Manufacturing Solutions',
  address: '123 Industrial District, Manufacturing Zone, Istanbul, Turkey',
  phone: '+90 212 555 0123',
  email: 'info@gsmanufacturing.com',
  website: 'www.gsmanufacturing.com'
}