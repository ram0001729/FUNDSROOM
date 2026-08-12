import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FilePlus, Eye, CheckCircle, XCircle, Download, X, Package, User, Calendar, Hash } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Challans = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewChallan, setViewChallan] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  
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
      const data = error.response?.data;
      if (data?.message === 'Insufficient stock') {
        alert(`Insufficient stock for ${data.product}. Available: ${data.available_stock}, Requested: ${data.requested_quantity}`);
      } else {
        alert(data?.error || data?.message || 'Failed to create challan.');
      }
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

  const openViewModal = async (ch) => {
    setViewModalOpen(true);
    setViewLoading(true);
    try {
      const res = await api.get(`/challans/${ch.id}`);
      setViewChallan(res.data);
    } catch (error) {
      console.error('Failed to fetch challan details:', error);
      setViewChallan(ch);
    } finally {
      setViewLoading(false);
    }
  };

  const generatePDF = async (ch) => {
    try {
      const res = await api.get(`/challans/${ch.id}`);
      const challanData = res.data;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // --- Header Background ---
      doc.setFillColor(27, 81, 45);
      doc.rect(0, 0, pageW, 38, 'F');

      // --- Company Name ---
      doc.setFontSize(24);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('FUNDSROOM', 14, 18);

      // --- Tagline ---
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 230, 180);
      doc.text('Business Management Platform', 14, 25);
      doc.text('support@fundsroom.com', 14, 31);

      // --- "DELIVERY CHALLAN" label on right ---
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('DELIVERY CHALLAN', pageW - 14, 20, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 230, 180);
      doc.text(`#${challanData.challan_number}`, pageW - 14, 27, { align: 'right' });

      // --- Divider ---
      doc.setDrawColor(27, 81, 45);
      doc.setLineWidth(0.5);
      doc.line(14, 44, pageW - 14, 44);

      // --- Challan Info Box ---
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date:`, 14, 52);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`${new Date(challanData.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 35, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(`Status:`, 14, 59);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(challanData.status === 'Confirmed' ? 0 : 180, challanData.status === 'Confirmed' ? 128 : 100, 0);
      doc.text(`${challanData.status}`, 35, 59);

      // --- Bill To ---
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('BILL TO:', pageW - 80, 47);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(27, 81, 45);
      doc.text(challanData.customer_name || 'Walk-in Customer', pageW - 80, 54);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');

      // --- Items Table ---
      const tableColumn = ['#', 'Product Name', 'SKU', 'Qty'];
      const tableRows = [];
      let totalQty = 0;

      if (challanData.items && challanData.items.length > 0) {
        challanData.items.forEach((item, idx) => {
          totalQty += parseInt(item.quantity || 0);
          tableRows.push([
            idx + 1,
            item.product_name || '-',
            item.sku || '-',
            item.quantity
          ]);
        });
      } else {
        tableRows.push([1, challanData.product_name || 'N/A', '-', challanData.total_quantity || 0]);
        totalQty = challanData.total_quantity || 0;
      }

      const tableOptions = {
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        headStyles: {
          fillColor: [27, 81, 45],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [240, 250, 240] },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
        },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      };

      if (typeof doc.autoTable === 'function') {
        doc.autoTable(tableOptions);
      } else {
        autoTable(doc, tableOptions);
      }

      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 120) + 8;

      // --- Total Row ---
      doc.setFillColor(27, 81, 45);
      doc.roundedRect(pageW - 80, finalY, 66, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Total Qty: ${totalQty}`, pageW - 47, finalY + 9, { align: 'center' });

      // --- Signature Section ---
      const sigY = finalY + 30;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(14, sigY, 70, sigY);
      doc.line(pageW - 70, sigY, pageW - 14, sigY);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.text('Authorized Signatory', 14, sigY + 5);
      doc.text("Receiver's Signature", pageW - 14, sigY + 5, { align: 'right' });

      // --- Footer ---
      doc.setFontSize(7.5);
      doc.setTextColor(160, 160, 160);
      doc.text('This is a computer-generated document and does not require a physical signature.', pageW / 2, 287, { align: 'center' });
      doc.setTextColor(27, 81, 45);
      doc.text('FUNDSROOM © 2026', pageW / 2, 292, { align: 'center' });

      doc.save(`Challan_${challanData.challan_number}.pdf`);

    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF invoice for this challan.');
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
                        <button onClick={() => openViewModal(ch)} title="View Challan" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded">
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

      {/* View Challan Modal */}
      {viewModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Challan Details</h2>
                {viewChallan && <p className="text-sm text-[#1B512D] font-semibold">{viewChallan.challan_number}</p>}
              </div>
              <button onClick={() => { setViewModalOpen(false); setViewChallan(null); }} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-4 border-[#1B512D] border-t-transparent rounded-full mx-auto mb-3"></div>
                Loading challan details...
              </div>
            ) : viewChallan ? (
              <div className="p-6 space-y-6">

                {/* Info Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold uppercase mb-1"><Hash size={11}/> Challan No</div>
                    <div className="text-sm font-bold text-[#1B512D]">{viewChallan.challan_number}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold uppercase mb-1"><User size={11}/> Customer</div>
                    <div className="text-sm font-bold text-gray-800">{viewChallan.customer_name || 'Walk-in'}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold uppercase mb-1"><Calendar size={11}/> Date</div>
                    <div className="text-sm font-bold text-gray-800">{new Date(viewChallan.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold uppercase mb-1">Status</div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(viewChallan.status)}`}>{viewChallan.status}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package size={16} className="text-[#1B512D]" />
                    <h3 className="font-semibold text-gray-800">Items</h3>
                  </div>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-[#1B512D] text-white">
                          <th className="px-4 py-3 font-semibold">#</th>
                          <th className="px-4 py-3 font-semibold">Product</th>
                          <th className="px-4 py-3 font-semibold">SKU</th>
                          <th className="px-4 py-3 font-semibold text-right">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewChallan.items && viewChallan.items.length > 0 ? (
                          viewChallan.items.map((item, idx) => (
                            <tr key={idx} className={`border-t border-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}`}>
                              <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{item.product_name}</td>
                              <td className="px-4 py-3 text-gray-500">{item.sku || '-'}</td>
                              <td className="px-4 py-3 text-right font-bold text-[#1B512D]">{item.quantity}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-4 py-6 text-center text-gray-400">No items found</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td colSpan="3" className="px-4 py-3 font-bold text-gray-700 text-right">Total Quantity:</td>
                          <td className="px-4 py-3 text-right font-bold text-[#1B512D] text-base">{viewChallan.total_quantity || (viewChallan.items || []).reduce((s, i) => s + parseInt(i.quantity || 0), 0)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => { setViewModalOpen(false); setViewChallan(null); }} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition">Close</button>
                  <button onClick={() => { generatePDF(viewChallan); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-[#1B512D] text-white hover:bg-[#163f23] transition">
                    <Download size={16} /> Download PDF
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
