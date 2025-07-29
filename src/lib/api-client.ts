export class ApiClient {
  private baseUrl = '/api'

  private cleanParams(params?: Record<string, any>): URLSearchParams {
    if (!params) return new URLSearchParams()
    
    const cleaned: Record<string, string> = {}
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = String(value)
      }
    }
    return new URLSearchParams(cleaned)
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API Error Response:', errorData)
      const errorMessage = errorData.details 
        ? `${errorData.error}: ${errorData.details}`
        : errorData.error || errorData.message || `HTTP error! status: ${response.status}`
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Inquiries
  async getInquiries(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/inquiries?${searchParams}`)
  }

  async getInquiry(id: string) {
    return this.request(`/inquiries/${id}`)
  }

  async createInquiry(data: any) {
    return this.request('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateInquiry(id: string, data: any) {
    return this.request(`/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteInquiry(id: string) {
    return this.request(`/inquiries/${id}`, {
      method: 'DELETE',
    })
  }

  // Customers
  async getCustomers(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/customers?${searchParams}`)
  }

  async getCustomer(id: string) {
    return this.request(`/customers/${id}`)
  }

  async createCustomer(data: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCustomer(id: string, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Users
  async getUsers(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/users?${searchParams}`)
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async createUser(data: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Items
  async getInquiryItems(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/items?${searchParams}`)
  }

  async updateInquiryItem(id: string, data: any) {
    return this.request(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async assignItems(data: { itemIds: string[], assigneeId: string }) {
    return this.request('/items/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Cost Calculations
  async getCostCalculations(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/costs?${searchParams}`)
  }

  async createCostCalculation(data: any) {
    return this.request('/costs', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCostCalculation(id: string, data: any) {
    return this.request(`/costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Quotes
  async getQuotes(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/quotes?${searchParams}`)
  }

  async createQuote(data: any) {
    return this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateQuote(id: string, data: any) {
    return this.request(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Approvals
  async getApprovals(params?: Record<string, any>) {
    const searchParams = this.cleanParams(params)
    return this.request(`/approvals?${searchParams}`)
  }

  async createApproval(data: any) {
    return this.request('/approvals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateApproval(id: string, data: any) {
    return this.request(`/approvals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Workload
  async getWorkload(userId: string) {
    return this.request(`/workload/${userId}`)
  }
}

export const apiClient = new ApiClient()