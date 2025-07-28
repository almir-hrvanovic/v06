"use client"

import { Inquiry, InquiryItem, Customer, User, CostCalculation } from '@prisma/client'
import { formatDate, formatCurrency } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface QuoteTemplateProps {
  inquiry: Inquiry & {
    customer: Customer
    items: (InquiryItem & {
      costCalculation: CostCalculation | null
    })[]
    createdBy: User
  }
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
    logo?: string
  }
  quoteNumber: string
  validUntil: Date
}

export function QuoteTemplate({ 
  inquiry, 
  companyInfo, 
  quoteNumber, 
  validUntil 
}: QuoteTemplateProps) {
  const subtotal = inquiry.items.reduce((sum, item) => {
    return sum + (item.costCalculation?.totalCost?.toNumber() || 0)
  }, 0)
  
  const taxRate = 0.18 // 18% VAT
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  return (
    <div className="max-w-4xl mx-auto bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 border-b pb-6">
        <div className="flex items-center space-x-4">
          {companyInfo.logo && (
            <img 
              src={companyInfo.logo} 
              alt="Company Logo"
              className="w-16 h-16 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{companyInfo.name}</h1>
            <div className="text-sm text-gray-600 mt-1">
              <p>{companyInfo.address}</p>
              <p>Tel: {companyInfo.phone} | Email: {companyInfo.email}</p>
              <p>Web: {companyInfo.website}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-blue-600">QUOTE</h2>
          <p className="text-lg font-semibold mt-2">#{quoteNumber}</p>
          <p className="text-sm text-gray-600">Date: {formatDate(new Date())}</p>
          <p className="text-sm text-gray-600">Valid Until: {formatDate(validUntil)}</p>
        </div>
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Quote To:</h3>
          <div className="text-sm">
            <p className="font-semibold">{inquiry.customer.name}</p>
            <p>{inquiry.customer.address}</p>
            <p>Email: {inquiry.customer.email}</p>
            <p>Phone: {inquiry.customer.phone}</p>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Project Details:</h3>
          <div className="text-sm">
            <p><span className="font-medium">Inquiry:</span> {inquiry.title}</p>
            <p><span className="font-medium">Description:</span> {inquiry.description}</p>
            <p><span className="font-medium">Priority:</span> {inquiry.priority}</p>
            <p><span className="font-medium">Sales Representative:</span> {inquiry.createdBy.name}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Quote Items</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Item</th>
              <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold">Qty</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Unit Price</th>
              <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {inquiry.items.map((item, index) => {
              const unitPrice = item.costCalculation?.totalCost?.toNumber() || 0
              const itemTotal = unitPrice * (item.quantity || 1)
              
              return (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                  <td className="border border-gray-300 px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center text-sm">
                    {item.quantity || 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm">
                    {formatCurrency(unitPrice)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right text-sm font-medium">
                    {formatCurrency(itemTotal)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">Subtotal:</span>
              <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm">VAT ({(taxRate * 100).toFixed(0)}%):</span>
              <span className="text-sm font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Terms & Conditions</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p>• This quote is valid for {Math.ceil((validUntil.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from the date of issue.</p>
          <p>• Prices are subject to change without prior notice.</p>
          <p>• Payment terms: 50% advance, 50% on delivery.</p>
          <p>• Delivery time will be confirmed upon order placement.</p>
          <p>• All prices are exclusive of transportation and installation charges.</p>
          <p>• This quote does not constitute a contract until formally accepted.</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold mb-2">Bank Details</h4>
            <div className="text-sm text-gray-600">
              <p>Bank Name: Sample Bank</p>
              <p>Account Number: 1234567890</p>
              <p>IBAN: TR12 3456 7890 1234 5678 90</p>
              <p>Swift Code: SAMPLETR</p>
            </div>
          </div>
          <div className="text-right">
            <h4 className="font-semibold mb-2">Contact Information</h4>
            <div className="text-sm text-gray-600">
              <p>For questions about this quote:</p>
              <p>{inquiry.createdBy.name}</p>
              <p>{inquiry.createdBy.email}</p>
              <p>Phone: {companyInfo.phone}</p>
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 mt-6">
          <p>Generated on {formatDate(new Date())} by GS-CMS v05</p>
        </div>
      </div>
    </div>
  )
}