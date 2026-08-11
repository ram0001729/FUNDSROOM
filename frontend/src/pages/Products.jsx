import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [productDetails, setProductDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unit_price: '', cost_price: '',
    current_stock: 0, min_stock: 10, location: '', expiry_date: '', available: true, image_url: ''
  });
  
  const [imageFile, setImageFile] = useState(null);

  const [stockFormData, setStockFormData] = useState({
    quantity_changed: 1, movement_type: 'IN', reason: ''
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      setProducts(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleStockInputChange = (e) => {
    setStockFormData({ ...stockFormData, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditId(null);
    setFormData({
      name: '', sku: '', category: '', unit_price: '', cost_price: '',
      current_stock: 0, min_stock: 10, location: '', expiry_date: '', available: true, image_url: ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setEditId(product.id);
    setFormData({
      name: product.name, 
      sku: product.sku, 
      category: product.category || '', 
      unit_price: product.unit_price,
      cost_price: product.cost_price || '',
      current_stock: product.current_stock, 
      min_stock: product.min_stock, 
      location: product.location || '',
      expiry_date: product.expiry_date ? product.expiry_date.split('T')[0] : '',
      available: product.available !== false,
      image_url: product.image_url || ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const openStockModal = (product) => {
    setActiveProduct(product);
    setStockFormData({
      quantity_changed: 1, movement_type: 'IN', reason: ''
    });
    setIsStockModalOpen(true);
  };

  const openDetailsModal = async (product) => {
    setIsDetailsModalOpen(true);
    setDetailsLoading(true);
    setProductDetails(null);
    try {
      const res = await api.get(`/products/${product.id}/details`);
      setProductDetails(res.data);
    } catch (error) {
      console.error('Failed to fetch details:', error);
      alert('Failed to load product details.');
      setIsDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let productId = editId;
      if (isEditMode) {
        await api.put(`/products/${editId}`, formData);
      } else {
        const res = await api.post('/products', formData);
        productId = res.data.id;
      }

      // Handle Image Upload if a file was selected
      if (imageFile && productId) {
        const imgData = new FormData();
        imgData.append('image', imageFile);
        await api.post(`/products/${productId}/image`, imgData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert(error.response?.data?.error || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/products/${activeProduct.id}/stock`, stockFormData);
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      alert(error.response?.data?.error || 'Failed to adjust stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) return alert('Please select an Excel file');
    
    setSubmitting(true);
    const data = new FormData();
    data.append('file', bulkFile);

    try {
      const res = await api.post('/products/bulk-upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message);
      setIsBulkModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Bulk upload failed', error);
      alert(error.response?.data?.error || 'Upload failed');
    } finally {
      setSubmitting(false);
      setBulkFile(null);
    }
  };

  const handleExportCSV = () => {
    if (products.length === 0) return alert('No products to export');
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Unit Price', 'Cost Price', 'Current Stock', 'Min Stock', 'Location', 'Available'];
    const rows = products.map(p => [
      p.id,
      `"${(p.name||'').replace(/"/g, '""')}"`,
      `"${p.sku||''}"`,
      `"${p.category || ''}"`,
      p.unit_price,
      p.cost_price || 0,
      p.current_stock,
      p.min_stock,
      `"${p.location || ''}"`,
      p.available
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full text-[#111827]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-[22px] font-semibold mb-1">Stock Management</h1>
          <p className="text-[13px] text-[#6b7280]">Manage your inventory and stock levels.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/stock-log" className="bg-white border border-[#e5e7eb] px-4 py-2 rounded-full text-[13px] font-medium hover:bg-[#f9fafb] transition-colors">
            Movement Log
          </Link>
          <button onClick={() => setIsBulkModalOpen(true)} className="bg-white border border-[#e5e7eb] px-4 py-2 rounded-full text-[13px] font-medium hover:bg-[#f9fafb] transition-colors">
            Upload Excel
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button onClick={openAddModal} className="bg-[#2563eb] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:brightness-95 shadow-sm transition-all">
            + Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Image</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Product</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">SKU</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Category</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Price</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Stock</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Location</th>
                <th className="p-[10px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center text-[#6b7280]">Loading products...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="7" className="p-4 text-center text-[#6b7280]">No products found.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className={`hover:bg-[#f9fafb] transition-colors ${!p.available ? 'opacity-60' : ''}`}>
                    <td className="p-[10px] border-b border-[#e5e7eb]">
                      {p.image_url ? (
                        <img src={p.image_url.startsWith('http') ? p.image_url : `${api.defaults.baseURL.replace('/api', '')}${p.image_url}`} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center text-xs font-bold border border-emerald-100">
                          {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                      )}
                    </td>
                    <td className="p-[10px] border-b border-[#e5e7eb] font-medium">{p.name} {!p.available && '(Unavailable)'}</td>
                    <td className="p-[10px] border-b border-[#e5e7eb] text-[#6b7280]">{p.sku}</td>
                    <td className="p-[10px] border-b border-[#e5e7eb]">
                      <span className="inline-flex items-center rounded-full px-[10px] py-[4px] text-[11px] bg-[#f9fafb] text-[#6b7280] border border-[#e5e7eb]">
                        {p.category || 'None'}
                      </span>
                    </td>
                    <td className="p-[10px] border-b border-[#e5e7eb] font-semibold">₹{parseFloat(p.unit_price).toFixed(2)}</td>
                    <td className="p-[10px] border-b border-[#e5e7eb]">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-[9px] py-[3px] rounded-full text-[11px] font-semibold ${
                          p.current_stock <= p.min_stock 
                            ? 'bg-[#fecaca] text-[#dc2626]' 
                            : 'bg-[#dcfce7] text-[#15803d]'
                        }`}>
                          {p.current_stock}
                        </span>
                        <span className="text-[10px] text-[#6b7280]">Min: {p.min_stock}</span>
                      </div>
                    </td>
                    <td className="p-[10px] border-b border-[#e5e7eb] text-[#6b7280]">{p.location || '-'}</td>
                    <td className="p-[10px] border-b border-[#e5e7eb]">
                      <div className="flex gap-2">
                        <button onClick={() => openDetailsModal(p)} className="text-[#10b981] hover:underline text-[13px] font-medium">View</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => openEditModal(p)} className="text-[#2563eb] hover:underline text-[13px] font-medium">Edit</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => openStockModal(p)} className="text-[#2563eb] hover:underline text-[13px] font-medium">Adjust</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
              <h2 className="text-[16px] font-semibold">{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6b7280] hover:text-[#111827]">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Product Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="Product Name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">SKU *</label>
                  <input type="text" name="sku" required value={formData.sku} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="SKU-001" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="Category" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Unit Price (₹) *</label>
                  <input type="number" step="0.01" name="unit_price" required value={formData.unit_price} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Cost Price (₹)</label>
                  <input type="number" step="0.01" name="cost_price" value={formData.cost_price} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Initial Stock</label>
                  <input type="number" name="current_stock" disabled={isEditMode} value={formData.current_stock} onChange={handleInputChange} className={`w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb] ${isEditMode ? 'opacity-50' : ''}`} />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Min Stock Alert</label>
                  <input type="number" name="min_stock" value={formData.min_stock} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Location / Warehouse</label>
                  <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="Aisle 1" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Expiry Date</label>
                  <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2 pb-2">
                <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleInputChange} className="rounded border-[#e5e7eb] text-[#2563eb] focus:ring-[#2563eb]" />
                <label htmlFor="available" className="text-[13px] text-[#374151] font-medium">Product is available for sale</label>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-[12px] font-medium text-[#6b7280] mb-2">Product Image (Optional)</label>
                <div className="flex items-center gap-4">
                  {formData.image_url && !imageFile && (
                    <img src={formData.image_url.startsWith('http') ? formData.image_url : `${api.defaults.baseURL.replace('/api', '')}${formData.image_url}`} alt="Current" className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="text-[12px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="bg-[#2563eb] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:brightness-95 shadow-sm">
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isStockModalOpen && activeProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <h2 className="text-[16px] font-semibold mb-1">Adjust Stock</h2>
              <p className="text-[12px] text-[#6b7280]">{activeProduct.name} (Current: {activeProduct.current_stock})</p>
            </div>
            
            <form onSubmit={handleStockSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Type *</label>
                  <select name="movement_type" value={stockFormData.movement_type} onChange={handleStockInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]">
                    <option value="IN">Stock IN (+)</option>
                    <option value="OUT">Stock OUT (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Quantity *</label>
                  <input type="number" min="1" name="quantity_changed" required value={stockFormData.quantity_changed} onChange={handleStockInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Reason / Notes *</label>
                <input type="text" name="reason" required value={stockFormData.reason} onChange={handleStockInputChange} className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" placeholder="e.g. Supplier delivery" />
              </div>
              
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
                <button type="button" onClick={() => setIsStockModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="bg-[#2563eb] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:brightness-95 shadow-sm">
                  {submitting ? 'Updating...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <h2 className="text-[16px] font-semibold mb-1">Bulk Upload Products</h2>
              <p className="text-[12px] text-[#6b7280]">Upload an Excel file to insert products.</p>
            </div>
            
            <form onSubmit={handleBulkUpload} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#6b7280] mb-2">Excel File (.xlsx)</label>
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={(e) => setBulkFile(e.target.files[0])} 
                  className="w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-[13px] focus:outline-none focus:border-[#2563eb]" 
                  required
                />
              </div>
              <div className="text-[11px] text-[#6b7280]">
                Format expected: Row 1 Headers (Name, SKU, Price, Qty, Category). Row 2 onwards: Data.
              </div>
              
              <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-[#e5e7eb]">
                <button type="button" onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-[13px] font-medium text-[#374151] border border-[#e5e7eb] rounded-full hover:bg-[#f9fafb]">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="bg-[#15803d] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:brightness-95 shadow-sm">
                  {submitting ? 'Uploading...' : 'Upload Excel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details & Sales History Modal */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[16px] shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
              <h2 className="text-[16px] font-semibold">Product Intelligence</h2>
              <button onClick={() => setIsDetailsModalOpen(false)} className="text-[#6b7280] hover:text-[#111827]">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {detailsLoading || !productDetails ? (
                <div className="text-center py-10 text-gray-500">Loading details...</div>
              ) : (
                <div className="space-y-6">
                  {/* Product Header Card */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-6">
                    {productDetails.product.image_url ? (
                      <img src={productDetails.product.image_url.startsWith('http') ? productDetails.product.image_url : `${api.defaults.baseURL.replace('/api', '')}${productDetails.product.image_url}`} alt={productDetails.product.name} className="w-32 h-32 object-cover rounded-xl border border-gray-100 shadow-sm" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">No Image</div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">{productDetails.product.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">SKU: {productDetails.product.sku} | Category: {productDetails.product.category || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#1B512D]">₹{parseFloat(productDetails.product.unit_price).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Unit Price</div>
                        </div>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <div className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Current Stock</div>
                          <div className="text-2xl font-bold text-gray-800">{productDetails.product.current_stock} <span className="text-sm font-normal text-gray-500">units</span></div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                          <div className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Total Sold</div>
                          <div className="text-2xl font-bold text-gray-800">{productDetails.total_sold} <span className="text-sm font-normal text-gray-500">units</span></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Who Bought Table */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-white">
                      <h4 className="font-semibold text-gray-800">Recent Sales History (Who Bought)</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Qty Sold</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sold Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {productDetails.sales_history && productDetails.sales_history.length > 0 ? (
                            productDetails.sales_history.map((sale, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-600">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-gray-800">{sale.customer_name || 'Walk-in Customer'}</div>
                                  {sale.business_name && <div className="text-xs text-gray-500">{sale.business_name}</div>}
                                  {sale.mobile && <div className="text-xs text-gray-400">{sale.mobile}</div>}
                                </td>
                                <td className="px-4 py-3 text-[#2563eb] font-medium">{sale.challan_number}</td>
                                <td className="px-4 py-3 font-semibold text-gray-800">{sale.quantity}</td>
                                <td className="px-4 py-3 text-gray-600">₹{parseFloat(sale.sold_price).toFixed(2)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No sales history found for this product yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
