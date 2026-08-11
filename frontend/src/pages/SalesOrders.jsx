import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { PackageOpen, Clock, CheckCircle, Plus, X } from 'lucide-react';

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    sales_source: 'OFFLINE',
    items: [{ product_id: '', quantity: 1, unit_price: 0 }]
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/sales-orders');
      setOrders(res.data.data);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async () => {
    setIsModalOpen(true);
    // Fetch products and customers for the form
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/customers?limit=100')
      ]);
      setProducts(prodRes.data.data || []);
      setCustomers(custRes.data.data || []);
    } catch (error) {
      console.error('Error fetching form data', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ customer_id: '', sales_source: 'OFFLINE', items: [{ product_id: '', quantity: 1, unit_price: 0 }] });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price if product changes
    if (field === 'product_id') {
      const prod = products.find(p => p.id.toString() === value.toString());
      if (prod) newItems[index].unit_price = prod.unit_price;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: '', quantity: 1, unit_price: 0 }] });
  };

  const removeItemRow = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      // Clean up items to include product_name required by backend
      const itemsToSubmit = formData.items.map(item => {
        const prod = products.find(p => p.id.toString() === item.product_id.toString());
        return {
          ...item,
          product_name: prod ? prod.name : 'Unknown Product'
        };
      });

      await api.post('/sales-orders', {
        customer_id: formData.customer_id || null,
        sales_source: formData.sales_source,
        items: itemsToSubmit
      });
      closeModal();
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating order');
    }
  };

  const reserveStock = async (id) => {
    try {
      await api.post(`/sales-orders/${id}/reserve`);
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || 'Error reserving stock');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading orders...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
          <p className="text-gray-500 text-sm">Manage customer orders and workflow</p>
        </div>
        <button onClick={openModal} className="bg-[#1B512D] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#1B512D]/90 transition-colors flex items-center gap-2">
          <Plus size={18} /> New Order
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Order #</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-800">{order.order_number}</td>
                  <td className="p-4 text-gray-600">{order.customer_name || 'Walk-in'}</td>
                  <td className="p-4 font-bold text-[#1B512D]">₹{parseFloat(order.total_amount).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Created' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Stock Reserved' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'Dispatched' ? 'bg-purple-100 text-purple-700' :
                      order.status === 'Invoiced' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-semibold">{order.sales_source}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {order.status === 'Created' && (
                      <button onClick={() => reserveStock(order.id)} className="text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors">
                        <PackageOpen size={14} /> Reserve Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">No sales orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Create New Sales Order</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <select 
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1B512D]/20 outline-none"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                  >
                    <option value="">Walk-in Customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sales Source</label>
                  <select 
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1B512D]/20 outline-none"
                    value={formData.sales_source}
                    onChange={(e) => setFormData({...formData, sales_source: e.target.value})}
                  >
                    <option value="OFFLINE">Offline (In-Store)</option>
                    <option value="ONLINE">Online (Web)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Order Items</h3>
                  <button type="button" onClick={addItemRow} className="text-sm text-[#1B512D] font-bold hover:underline">
                    + Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                        <select 
                          required
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none"
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (₹{p.unit_price})</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                        <input 
                          type="number" 
                          min="1"
                          required
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                        <input 
                          type="number" 
                          readOnly
                          className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-gray-100 outline-none"
                          value={item.unit_price}
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItemRow(index)}
                        disabled={formData.items.length === 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="bg-[#1B512D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#1B512D]/90 shadow-sm">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;
