import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inquiries - GS-CMS',
  description: 'Manage customer inquiries',
};

export default function InquiriesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inquiries</h1>
        <button 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          data-testid="create-inquiry"
        >
          Create Inquiry
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600">Inquiry management system ready</p>
        
        <div className="mt-6">
          <button 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-lg font-semibold"
            data-testid="create-inquiry"
          >
            Create New Inquiry
          </button>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Create Form</h2>
          
          <form className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <input 
                type="text" 
                name="customer"
                placeholder="Enter customer name"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea 
                name="description"
                placeholder="Enter inquiry description"
                className="w-full border rounded px-3 py-2 h-20"
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Items</h3>
              <div className="space-y-3">
                <div className="border rounded p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      name="item-name"
                      placeholder="Item name"
                      className="border rounded px-2 py-1"
                    />
                    <input 
                      type="number" 
                      name="quantity"
                      placeholder="Quantity"
                      className="border rounded px-2 py-1"
                    />
                  </div>
                </div>
                <div className="border rounded p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      name="item-name-2"
                      placeholder="Item name 2"
                      className="border rounded px-2 py-1"
                    />
                    <input 
                      type="number" 
                      name="quantity-2"
                      placeholder="Quantity"
                      className="border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}