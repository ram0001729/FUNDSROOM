import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShoppingBag, Plus, PackageCheck, Eye, X, Truck, IndianRupee, FileText, CheckCircle2 } from 'lucide-react';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: '',
    notes: '',
    items: [{ product_id: '', quantity: 10, unit_price: 0 }]
  });

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.get('/purchases');
      setPurchases(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = async () => {
    setIsModalOpen(true);
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      supplier_name: '',
      notes: '',
      items: [{ product_id: '', quantity: 10, unit_price: 0 }]
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find(p => p.id.toString() === value.toString());
      if (prod) {
        newItems[index].unit_price = prod.cost_price || prod.unit_price;
      }
    }
    setFormData({ ...formData, items: newItems });
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 10, unit_price: 0 }]
    });
  };

  const removeItemRow = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    if (!formData.supplier_name.trim()) return alert('Please enter supplier name.');
    
    const validItems = formData.items
      .filter(item => item.product_id)
      .map(item => {
        const prod = products.find(p => p.id.toString() === item.product_id.toString());
        return {
          product_id: parseInt(item.product_id),
          product_name: prod ? prod.name : 'Product',
          unit_price: parseFloat(item.unit_price),
          quantity: parseInt(item.quantity)
        };
      });

    if (validItems.length === 0) return alert('Please select at least one product.');

    setSubmitting(true);
    try {
      await api.post('/purchases', {
        supplier_name: formData.supplier_name,
        notes: formData.notes,
        items: validItems
      });
      closeModal();
      fetchPurchases();
    } catch (error) {
      console.error('Failed to create PO:', error);
      alert(error.response?.data?.message || 'Error creating purchase order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceivePO = async (id, poNumber) => {
    if (!window.confirm(`Mark Purchase Order #${poNumber} as Received? This will automatically update inventory stock!`)) return;
    try {
      const res = await api.post(`/purchases/${id}/receive`);
      alert(res.data.message || 'PO marked as Received & Stock Updated!');
      fetchPurchases();
    } catch (error) {
      console.error('Error receiving PO:', error);
      alert(error.response?.data?.message || 'Failed to mark PO as received.');
    }
  };

  const openViewModal = async (po) => {
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const res = await api.get(`/purchases/${po.id}`);
      setViewPO(res.data.data);
    } catch (error) {
      console.error('Failed to fetch PO detail:', error);
      setViewPO(po);
    } finally {
      setViewLoading(false);
    }
  };

  const totalPOAmount = purchases.reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);
  const pendingPOCount = purchases.filter(po => po.status === 'Pending').length;

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading purchase orders...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Purchase Orders</h1>
          <p className="text-gray-500 text-sm">Procurement, supplier orders, and stock receiving</p>
        </div>
        <button onClick={openAddModal} className="bg-[#1B512D] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md transition-all flex items-center gap-2">
          <Plus size={18} /> Create Purchase Order
        </button>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[12px] text-emerald-600 font-bold uppercase tracking-wider">Total Purchase Value</div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700"><IndianRupee size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{totalPOAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[12px] text-amber-600 font-bold uppercase tracking-wider">Pending Delivery</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700"><Truck size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-amber-700">{pendingPOCount} <span className="text-xs text-gray-500 font-normal">orders pending</span></div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-5">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[12px] text-blue-600 font-bold uppercase tracking-wider">Total Orders</div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700"><ShoppingBag size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{purchases.length} <span className="text-xs text-gray-500 font-normal">total POs</span></div>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">PO Number</th>
                <th className="p-4 font-medium">Supplier</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((po) => (
                <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-bold text-[#1B512D]">{po.po_number}</td>
                  <td className="p-4 text-gray-800 font-medium">{po.supplier_name}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(po.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-4 font-bold text-gray-800">₹{parseFloat(po.total_amount).toLocaleString('en-IN')}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      po.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {po.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openViewModal(po)} title="View Order Details" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye size={18} />
                      </button>
                      {po.status === 'Pending' && (
                        <button onClick={() => handleReceivePO(po.id, po.po_number)} title="Mark as Received & Update Stock" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-xs flex items-center gap-1">
                          <PackageCheck size={14} /> Receive Stock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No purchase orders found. Click "Create Purchase Order" to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Create Purchase Order</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
            </div>
            <form onSubmit={handleCreatePO} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input 
                  type="text" required className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D]"
                  placeholder="e.g. UltraTech Building Supplies Ltd"
                  value={formData.supplier_name} onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800">Purchased Items</h3>
                  <button type="button" onClick={addItemRow} className="text-xs text-[#1B512D] font-bold hover:underline">+ Add Product</button>
                </div>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                        <select 
                          required className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white"
                          value={item.product_id} onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        >
                          <option value="">-- Select Product --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cost Price (₹)</label>
                        <input type="number" step="0.01" required className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white"
                          value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                        <input type="number" min="1" required className="w-full border border-gray-200 rounded-lg p-2 text-sm outline-none bg-white"
                          value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} />
                      </div>
                      <button type="button" onClick={() => removeItemRow(index)} disabled={formData.items.length === 1}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"><X size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions (Optional)</label>
                <textarea rows="2" className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm"
                  placeholder="e.g. Delivery expected by Friday morning"
                  value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#1B512D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md">
                  {submitting ? 'Creating...' : 'Save Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Purchase Order Details</h2>
                {viewPO && <p className="text-sm font-bold text-[#1B512D]">{viewPO.po_number}</p>}
              </div>
              <button onClick={() => setViewModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {viewLoading ? (
              <div className="p-8 text-center text-gray-400">Loading details...</div>
            ) : viewPO ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
                  <div><span className="text-gray-500">Supplier:</span> <p className="font-bold text-gray-800">{viewPO.supplier_name}</p></div>
                  <div><span className="text-gray-500">Status:</span> <p className="font-bold text-amber-700">{viewPO.status}</p></div>
                </div>

                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#1B512D] text-white">
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewPO.items || []).map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-800">{item.product_name}</td>
                        <td className="p-3 text-right">₹{parseFloat(item.unit_price).toFixed(2)}</td>
                        <td className="p-3 text-right font-bold">{item.quantity}</td>
                        <td className="p-3 text-right font-bold text-[#1B512D]">₹{parseFloat(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
