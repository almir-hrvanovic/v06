import { Inquiry, InquiryItem, Customer, User, CostCalculation } from '@prisma/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DEFAULT_COMPANY_INFO } from './pdf'

type InquiryWithRelations = Inquiry & {
  customer: Customer
  items: (InquiryItem & {
    costCalculation: CostCalculation | null
  })[]
  createdBy: User
}

export function generateQuoteHTML(
  inquiry: InquiryWithRelations,
  quoteNumber: string,
  validUntil: Date
): string {
  const companyInfo = DEFAULT_COMPANY_INFO
  const subtotal = inquiry.items.reduce((sum, item) => {
    return sum + (item.costCalculation?.totalCost?.toNumber() || 0)
  }, 0)
  
  const taxRate = 0.18 // 18% VAT
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  return `
    <div class="max-w-4xl mx-auto bg-white p-8" style="font-family: Arial, sans-serif;">
      <!-- Header -->
      <div class="flex items-start justify-between mb-8 border-b pb-6">
        <div class="flex items-center space-x-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${companyInfo.name}</h1>
            <div class="text-sm text-gray-600 mt-1">
              <p>${companyInfo.address}</p>
              <p>Tel: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
              <p>Web: ${companyInfo.website}</p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <h2 class="text-3xl font-bold text-blue-600">QUOTE</h2>
          <p class="text-lg font-semibold mt-2">#${quoteNumber}</p>
          <p class="text-sm text-gray-600">Date: ${formatDate(new Date())}</p>
          <p class="text-sm text-gray-600">Valid Until: ${formatDate(validUntil)}</p>
        </div>
      </div>

      <!-- Customer Information -->
      <div class="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-900">Quote To:</h3>
          <div class="text-sm">
            <p class="font-semibold">${inquiry.customer.name}</p>
            <p>${inquiry.customer.address || ''}</p>
            <p>Email: ${inquiry.customer.email}</p>
            <p>Phone: ${inquiry.customer.phone || ''}</p>
          </div>
        </div>
        <div>
          <h3 class="text-lg font-semibold mb-3 text-gray-900">Project Details:</h3>
          <div class="text-sm">
            <p><span class="font-medium">Inquiry:</span> ${inquiry.title}</p>
            <p><span class="font-medium">Description:</span> ${inquiry.description || ''}</p>
            <p><span class="font-medium">Priority:</span> ${inquiry.priority}</p>
            <p><span class="font-medium">Sales Representative:</span> ${inquiry.createdBy.name}</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-4 text-gray-900">Quote Items</h3>
        <table class="w-full border-collapse border border-gray-300">
          <thead>
            <tr class="bg-gray-50">
              <th class="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Item</th>
              <th class="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Qty</th>
              <th class="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
              <th class="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            ${inquiry.items.map((item, index) => {
              const unitPrice = item.costCalculation?.totalCost?.toNumber() || 0
              const itemTotal = unitPrice * (item.quantity || 1)
              
              return `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}">
                  <td class="border border-gray-300 px-4 py-3">
                    <div>
                      <p class="font-medium text-sm">${item.name}</p>
                      ${item.description ? `<p class="text-xs text-gray-600 mt-1">${item.description}</p>` : ''}
                    </div>
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-center text-sm">
                    ${item.quantity || 1}
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-right text-sm">
                    ${formatCurrency(unitPrice)}
                  </td>
                  <td class="border border-gray-300 px-4 py-3 text-right text-sm font-medium">
                    ${formatCurrency(itemTotal)}
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div class="flex justify-end mb-8">
        <div class="w-80">
          <div class="bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm">Subtotal:</span>
              <span class="text-sm font-medium">${formatCurrency(subtotal)}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm">VAT (${(taxRate * 100).toFixed(0)}%):</span>
              <span class="text-sm font-medium">${formatCurrency(taxAmount)}</span>
            </div>
            <div class="border-t border-gray-300 pt-2 mt-2">
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold">Total:</span>
                <span class="text-lg font-bold text-blue-600">${formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms and Conditions -->
      <div class="mb-8">
        <h3 class="text-lg font-semibold mb-3 text-gray-900">Terms & Conditions</h3>
        <div class="text-sm text-gray-700 space-y-2">
          <p>• This quote is valid for ${Math.ceil((validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from the date of issue.</p>
          <p>• Prices are subject to change without prior notice.</p>
          <p>• Payment terms: 50% advance, 50% on delivery.</p>
          <p>• Delivery time will be confirmed upon order placement.</p>
          <p>• All prices are exclusive of transportation and installation charges.</p>
          <p>• This quote does not constitute a contract until formally accepted.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t pt-6">
        <div class="grid grid-cols-2 gap-8">
          <div>
            <h4 class="font-semibold mb-2">Bank Details</h4>
            <div class="text-sm text-gray-600">
              <p>Bank Name: Sample Bank</p>
              <p>Account Number: 1234567890</p>
              <p>IBAN: TR12 3456 7890 1234 5678 90</p>
              <p>Swift Code: SAMPLETR</p>
            </div>
          </div>
          <div class="text-right">
            <h4 class="font-semibold mb-2">Contact Information</h4>
            <div class="text-sm text-gray-600">
              <p>For questions about this quote:</p>
              <p>${inquiry.createdBy.name}</p>
              <p>${inquiry.createdBy.email}</p>
              <p>Phone: ${companyInfo.phone}</p>
            </div>
          </div>
        </div>
        <div class="text-center text-xs text-gray-500 mt-6">
          <p>Generated on ${formatDate(new Date())} by GS-CMS v05</p>
        </div>
      </div>
    </div>
  `
}

export function generateReportHTML(
  title: string,
  subtitle: string | undefined,
  data: any,
  dateRange: { from: Date; to: Date },
  filters: Record<string, any>
): string {
  const companyInfo = DEFAULT_COMPANY_INFO

  return `
    <div class="max-w-6xl mx-auto bg-white p-8" style="font-family: Arial, sans-serif;">
      <!-- Header -->
      <div class="text-center mb-8 border-b pb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">${title}</h1>
        ${subtitle ? `<p class="text-lg text-gray-600 mb-4">${subtitle}</p>` : ''}
        <div class="text-sm text-gray-500">
          <p>${companyInfo.name}</p>
          <p>Report Period: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}</p>
          <p>Generated on: ${formatDate(new Date())}</p>
        </div>
      </div>

      <!-- Applied Filters -->
      ${Object.keys(filters).length > 0 ? `
        <div class="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-3">Applied Filters</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            ${Object.entries(filters).map(([key, value]) => `
              <div>
                <span class="font-medium capitalize">${key.replace(/([A-Z])/g, ' $1')}:</span>
                <span class="text-gray-600">
                  ${Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Summary Statistics -->
      ${data.summary ? `
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Summary Statistics</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-blue-600">${data.summary.totalInquiries}</p>
              <p class="text-sm text-gray-600">Total Inquiries</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-green-600">
                ${formatCurrency(data.summary.totalValue)}
              </p>
              <p class="text-sm text-gray-600">Total Value</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-yellow-600">
                ${formatCurrency(data.summary.averageValue)}
              </p>
              <p class="text-sm text-gray-600">Average Value</p>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-orange-600">${data.summary.pendingInquiries}</p>
              <p class="text-sm text-gray-600">Pending</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg text-center">
              <p class="text-2xl font-bold text-purple-600">${data.summary.completedInquiries}</p>
              <p class="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Inquiries Table -->
      ${data.inquiries && data.inquiries.length > 0 ? `
        <div class="mb-8">
          <h3 class="text-lg font-semibold mb-4">Inquiries Details</h3>
          <table class="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr class="bg-gray-50">
                <th class="border border-gray-300 px-3 py-2 text-left font-semibold">ID</th>
                <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Title</th>
                <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Customer</th>
                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Status</th>
                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Priority</th>
                <th class="border border-gray-300 px-3 py-2 text-right font-semibold">Value</th>
                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Items</th>
                <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Created By</th>
                <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              ${data.inquiries.map((inquiry: any, index: number) => `
                <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}">
                  <td class="border border-gray-300 px-3 py-2 font-mono">
                    ${inquiry.id.slice(0, 8)}...
                  </td>
                  <td class="border border-gray-300 px-3 py-2">
                    <div>
                      <p class="font-medium">${inquiry.title}</p>
                      ${inquiry.description ? `
                        <p class="text-xs text-gray-600 mt-1 truncate">
                          ${inquiry.description.slice(0, 50)}...
                        </p>
                      ` : ''}
                    </div>
                  </td>
                  <td class="border border-gray-300 px-3 py-2">${inquiry.customer.name}</td>
                  <td class="border border-gray-300 px-3 py-2 text-center">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                      inquiry.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      inquiry.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      ${inquiry.status}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-center">
                    <span class="px-2 py-1 rounded text-xs font-medium ${
                      inquiry.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      inquiry.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }">
                      ${inquiry.priority}
                    </span>
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-right">
                    ${formatCurrency(inquiry.totalValue?.toNumber() || 0)}
                  </td>
                  <td class="border border-gray-300 px-3 py-2 text-center">
                    ${inquiry.items.length}
                  </td>
                  <td class="border border-gray-300 px-3 py-2">${inquiry.createdBy.name}</td>
                  <td class="border border-gray-300 px-3 py-2 text-center">
                    ${formatDate(inquiry.createdAt)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Footer -->
      <div class="border-t pt-6 mt-8 text-center text-xs text-gray-500">
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p class="font-medium">Contact Information</p>
            <p>${companyInfo.phone}</p>
            <p>${companyInfo.email}</p>
          </div>
          <div>
            <p class="font-medium">Address</p>
            <p>${companyInfo.address}</p>
          </div>
          <div>
            <p class="font-medium">Website</p>
            <p>${companyInfo.website}</p>
          </div>
        </div>
        <p>This report was automatically generated by GS-CMS v05 on ${formatDate(new Date())}</p>
        <p class="mt-2">© 2024 ${companyInfo.name}. All rights reserved.</p>
      </div>
    </div>
  `
}