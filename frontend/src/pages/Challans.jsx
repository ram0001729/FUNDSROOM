import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FilePlus, Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Challans = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    items: []
  });

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/challans');
      setChallans(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch challans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      // For dropdowns, we might want all (or implement searchable dropdowns). Assuming reasonable size for MVP.
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100')
      ]);
      setCustomers(custRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch dependencies:', error);
    }
  };

  useEffect(() => {
    fetchChallans();
    fetchDependencies();
  }, []);

  const openAddModal = () => {
    setFormData({ customer_id: '', items: [{ product_id: '', quantity: 1 }] });
    setIsModalOpen(true);
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...formData.items, { product_id: '', quantity: 1 }] });
  };

  const removeItemRow = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleCreateChallan = async (status) => {
    if (!formData.customer_id) {
      return alert('Please select a customer.');
    }
    
    // Filter out incomplete rows
    const validItems = formData.items.filter(item => item.product_id && item.quantity > 0);
    if (validItems.length === 0) {
      return alert('Please add at least one valid product.');
    }

    setSubmitting(true);
    try {
      await api.post('/challans', {
        customer_id: formData.customer_id,
        status: status,
        items: validItems
      });
      setIsModalOpen(false);
      fetchChallans();
    } catch (error) {
      console.error('Failed to create challan:', error);
      alert(error.response?.data?.error || 'Failed to create challan.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this challan as ${newStatus}?`)) return;
    try {
      await api.put(`/challans/${id}/status`, { status: newStatus });
      fetchChallans();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.error || 'Failed to update status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const generatePDF = async (ch) => {
    try {
      const res = await api.get(`/challans/${ch.id}`);
      const challanData = res.data;

      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(27, 81, 45);
      doc.text('DistribuCore', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Hyperlocal Business Platform', 14, 28);
      doc.text('GSTIN: [PLACEHOLDER]', 14, 33);
      
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('TAX INVOICE / CHALLAN', 14, 45);
      
      doc.setFontSize(10);
      doc.text(`Challan No: ${challanData.challan_number}`, 14, 55);
      doc.text(`Date: ${new Date(challanData.created_at).toLocaleDateString()}`, 14, 61);
      doc.text(`Status: ${challanData.status}`, 14, 67);
      
      doc.text(`Billed To:`, 120, 55);
      doc.setFont(undefined, 'bold');
      doc.text(challanData.customer_name || 'Customer', 120, 61);
      doc.setFont(undefined, 'normal');
      
      const tableColumn = ["#", "Product", "SKU", "Qty"];
      const tableRows = [];
      
      if (challanData.items) {
        challanData.items.forEach((item, idx) => {
          tableRows.push([
            idx + 1,
            item.product_name,
            item.sku || '-',
            item.quantity
          ]);
        });
      }
      
      doc.autoTable({
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        headStyles: { fillColor: [27, 81, 45] },
        theme: 'striped'
      });
      
      doc.save(`Invoice_${challanData.challan_number}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">Sales Challans</h1>
        <button onClick={openAddModal} className="btn-primary flex items-center">
          <FilePlus size={18} className="mr-2" /> Create Challan
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Challan No.</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Total Qty</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No challans found.</td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-green-600">
                      {ch.challan_number}
                    </td>
                    <td className="p-4 text-black">
                      {ch.customer_name}
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(ch.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-medium text-black">
                      {ch.total_quantity}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ch.status)}`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {ch.status === 'Draft' && (
                          <>
                            <button onClick={() => updateStatus(ch.id, 'Confirmed')} title="Confirm" className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => updateStatus(ch.id, 'Cancelled')} title="Cancel" className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button title="View" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => generatePDF(ch)} title="Download PDF Invoice" className="p-1.5 text-[#1B512D] hover:bg-green-50 rounded">
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Challan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-8 border border-gray-200/50">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-black">Create New Sales Challan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-1">Select Customer *</label>
                <select 
                  className="input-field"
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                >
                  <option value="">-- Choose a Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.business_name ? `(${c.business_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex justify-between items-end">
                <h3 className="text-lg font-bold text-black border-b-2 border-green-500 inline-block">Products List</h3>
                <button onClick={addItemRow} className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center">
                  <FilePlus size={16} className="mr-1" /> Add Product Row
                </button>
              </div>

              <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[40vh] overflow-y-auto">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start relative bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                      <select 
                        className="input-field text-sm py-2"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} - SKU: {p.sku} (Stock: {p.current_stock})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="input-field text-sm py-2" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <button 
                        onClick={() => removeItemRow(index)} 
                        className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove product"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Total Items: <span className="font-bold text-black">{formData.items.reduce((sum, i) => sum + (i.quantity || 0), 0)}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleCreateChallan('Draft')}
                    disabled={submitting} 
                    className="px-5 py-2.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl"
                  >
                    {submitting ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button 
                    onClick={() => handleCreateChallan('Confirmed')}
                    disabled={submitting} 
                    className="btn-primary"
                  >
                    {submitting ? 'Saving...' : 'Confirm & Deduct Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
