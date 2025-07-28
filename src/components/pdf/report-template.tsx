"use client"

import { Inquiry, InquiryItem, User, Customer, CostCalculation } from '@prisma/client'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ReportTemplateProps {
  title: string
  subtitle?: string
  data: {
    inquiries?: (Inquiry & {
      customer: Customer
      createdBy: User
      items: InquiryItem[]
    })[]
    users?: User[]
    summary?: {
      totalInquiries: number
      totalValue: number
      averageValue: number
      pendingInquiries: number
      completedInquiries: number
    }
  }
  dateRange: {
    from: Date
    to: Date
  }
  filters?: Record<string, any>
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
  }
}

export function ReportTemplate({ 
  title, 
  subtitle, 
  data, 
  dateRange, 
  filters = {},
  companyInfo 
}: ReportTemplateProps) {
  return (
    <div className="max-w-6xl mx-auto bg-white p-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && <p className="text-lg text-gray-600 mb-4">{subtitle}</p>}
        <div className="text-sm text-gray-500">
          <p>{companyInfo.name}</p>
          <p>Report Period: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}</p>
          <p>Generated on: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Applied Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Applied Filters</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(filters).map(([key, value]) => (
              <div key={key}>
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>{' '}
                <span className="text-gray-600">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {data.summary && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{data.summary.totalInquiries}</p>
              <p className="text-sm text-gray-600">Total Inquiries</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.summary.totalValue)}
              </p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(data.summary.averageValue)}
              </p>
              <p className="text-sm text-gray-600">Average Value</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">{data.summary.pendingInquiries}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{data.summary.completedInquiries}</p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </div>
      )}

      {/* Inquiries Table */}
      {data.inquiries && data.inquiries.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Inquiries Details</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">ID</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Title</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Customer</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Status</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Priority</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Value</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Items</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Created By</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.inquiries.map((inquiry, index) => (
                <tr key={inquiry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                  <td className="border border-gray-300 px-3 py-2 font-mono">
                    {inquiry.id.slice(0, 8)}...
                  </td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div>
                      <p className="font-medium">{inquiry.title}</p>
                      {inquiry.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {inquiry.description.slice(0, 50)}...
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{inquiry.customer.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (inquiry.status as string) === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      (inquiry.status as string) === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      inquiry.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                      inquiry.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {inquiry.priority}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {formatCurrency(inquiry.totalValue?.toNumber() || 0)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {inquiry.items.length}
                  </td>
                  <td className="border border-gray-300 px-3 py-2">{inquiry.createdBy.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {formatDate(inquiry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Table */}
      {data.users && data.users.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Users Summary</h3>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Name</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Email</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Role</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Status</th>
                <th className="border border-gray-300 px-3 py-2 text-center font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{user.name}</td>
                  <td className="border border-gray-300 px-3 py-2">{user.email}</td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {user.role}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center">
                    {formatDate(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="border-t pt-6 mt-8 text-center text-xs text-gray-500">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="font-medium">Contact Information</p>
            <p>{companyInfo.phone}</p>
            <p>{companyInfo.email}</p>
          </div>
          <div>
            <p className="font-medium">Address</p>
            <p>{companyInfo.address}</p>
          </div>
          <div>
            <p className="font-medium">Website</p>
            <p>{companyInfo.website}</p>
          </div>
        </div>
        <p>This report was automatically generated by GS-CMS v05 on {formatDate(new Date())}</p>
        <p className="mt-2">© 2024 {companyInfo.name}. All rights reserved.</p>
      </div>
    </div>
  )
}