import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Search, Edit2, Eye } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', business_name: '',
    gst_number: '', type: 'Retail', address: '',
    status: 'Active', follow_up_date: '', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?search=${search}`);
      setCustomers(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({
      name: '', mobile: '', email: '', business_name: '',
      gst_number: '', type: 'Retail', address: '',
      status: 'Active', follow_up_date: '', notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setIsEditMode(true);
    setEditId(customer.id);
    setFormData({
      name: customer.name || '', 
      mobile: customer.mobile || '', 
      email: customer.email || '', 
      business_name: customer.business_name || '',
      gst_number: customer.gst_number || '', 
      type: customer.type || 'Retail', 
      address: customer.address || '',
      status: customer.status || 'Active', 
      // Handle date formatting for input type="date"
      follow_up_date: customer.follow_up_date ? new Date(customer.follow_up_date).toISOString().split('T')[0] : '', 
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        await api.put(`/customers/${editId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return alert('No customers to export');
    const headers = ['ID', 'Name', 'Business Name', 'Mobile', 'Email', 'Type', 'Status', 'Address'];
    const rows = customers.map(c => [
      c.id,
      `"${(c.name||'').replace(/"/g, '""')}"`,
      `"${(c.business_name||'').replace(/"/g, '""')}"`,
      `"${c.mobile||''}"`,
      `"${c.email||''}"`,
      `"${c.type||''}"`,
      `"${c.status||''}"`,
      `"${(c.address||'').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-black">Customers</h1>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={openAddModal} className="btn-primary flex items-center shrink-0">
            <Plus size={18} className="mr-2" /> Add Customer
          </button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Name / Business</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No customers found.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-black">{c.name}</div>
                      <div className="text-sm text-gray-500">{c.business_name || '-'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-black">{c.mobile}</div>
                      <div className="text-xs text-gray-500">{c.email || '-'}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'Lead' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/customers/${c.id}`} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="View Details">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => openEditModal(c)} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Edit Customer">
                          <Edit2 size={18} />
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

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 border border-gray-200/50">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-black">{isEditMode ? 'Edit Customer' : 'Add New Customer'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Customer Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Business Name</label>
                  <input type="text" name="business_name" value={formData.business_name} onChange={handleInputChange} className="input-field" placeholder="Doe Enterprises" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Mobile Number</label>
                  <input type="text" name="mobile" value={formData.mobile} onChange={handleInputChange} className="input-field" placeholder="+1 234 567 890" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">GST Number (Optional)</label>
                  <input type="text" name="gst_number" value={formData.gst_number} onChange={handleInputChange} className="input-field" placeholder="GSTIN..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Customer Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="input-field">
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Distributor">Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="input-field">
                    <option value="Lead">Lead</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Follow-up Date</label>
                  <input type="date" name="follow_up_date" value={formData.follow_up_date} onChange={handleInputChange} className="input-field" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-1">Address</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="input-field" placeholder="Full address" />
                </div>
                {!isEditMode && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-black mb-1">Initial Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-field resize-none h-24" placeholder="Any additional details..."></textarea>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Customer' : 'Save Customer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
