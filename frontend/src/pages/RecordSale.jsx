import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const RecordSale = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    customer_name: '',
    customer_mobile: '',
    payment_mode: 'offline' // 'offline' or 'online'
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products?limit=100'); // fetch enough for dropdown
        setProducts(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id.toString() === formData.product_id.toString()) || null;
  }, [formData.product_id, products]);

  const totalAmount = useMemo(() => {
    if (!selectedProduct) return 0;
    return selectedProduct.unit_price * formData.quantity;
  }, [selectedProduct, formData.quantity]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, paymentMode) => {
    e.preventDefault();
    if (!formData.product_id || formData.quantity < 1) {
      alert('Please select a product and valid quantity');
      return;
    }

    if (selectedProduct && selectedProduct.current_stock < formData.quantity) {
      alert(`Insufficient stock! Only ${selectedProduct.current_stock} available.`);
      return;
    }

    setSubmitting(true);
    try {
      if (paymentMode === 'online') {
        // In a real app, integrate Razorpay here. For now, mark as online and save.
      }

      // Create confirmed challan/sale
      const payload = {
        customer_name: formData.customer_name,
        customer_mobile: formData.customer_mobile,
        sales_source: paymentMode === 'online' ? 'ONLINE' : 'OFFLINE',
        status: 'Confirmed',
        items: [
          {
            product_id: formData.product_id,
            quantity: formData.quantity
          }
        ]
      };

      await api.post('/challans', payload);
      alert('Sale recorded successfully!');
      navigate('/billing');

    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full text-[#111827] animate-fade-in max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        
        {/* Left Panel: Form */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-[22px] font-semibold mb-1">New Transaction</h1>
            <p className="text-[13px] text-[#6b7280]">Create and process a sale securely</p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Product *</label>
              <select 
                name="product_id" 
                value={formData.product_id} 
                onChange={handleInputChange} 
                className="w-full rounded-[8px] border border-[#e5e7eb] px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2563eb]"
                required
              >
                <option value="">Select product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{parseFloat(p.unit_price).toFixed(2)} ({p.current_stock} in stock)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Quantity *</label>
                <input 
                  type="number" 
                  min="1" 
                  name="quantity" 
                  value={formData.quantity} 
                  onChange={handleInputChange} 
                  className="w-full rounded-[8px] border border-[#e5e7eb] px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2563eb]"
                  required
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Customer Name</label>
                <input 
                  type="text" 
                  name="customer_name" 
                  value={formData.customer_name} 
                  onChange={handleInputChange} 
                  className="w-full rounded-[8px] border border-[#e5e7eb] px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2563eb]"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">Customer Mobile</label>
              <input 
                type="text" 
                name="customer_mobile" 
                value={formData.customer_mobile} 
                onChange={handleInputChange} 
                className="w-full rounded-[8px] border border-[#e5e7eb] px-3 py-2.5 text-[14px] focus:outline-none focus:border-[#2563eb]"
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#e5e7eb]">
              <button 
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, 'offline')}
                className="flex-1 bg-[#f9fafb] border border-[#e5e7eb] text-[#374151] font-medium py-3 px-4 rounded-[8px] hover:bg-gray-100 transition-colors text-[14px] flex items-center justify-center"
              >
                💵 Cash / Offline
              </button>
              
              <button 
                type="button"
                disabled={submitting}
                onClick={(e) => handleSubmit(e, 'online')}
                className="flex-1 bg-[#2563eb] text-white font-medium py-3 px-4 rounded-[8px] hover:brightness-95 transition-all text-[14px] flex items-center justify-center shadow-sm"
              >
                💳 Online Payment
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button type="button" onClick={() => navigate('/dashboard')} className="text-[13px] text-[#6b7280] hover:text-[#2563eb] hover:underline">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Summary */}
        <div className="bg-[#f9fafb] rounded-[16px] border border-[#e5e7eb] shadow-sm p-6 flex flex-col h-fit">
          <h3 className="text-[16px] font-semibold mb-6">Transaction Summary</h3>

          <div className="flex justify-between items-start mb-4 text-[14px]">
            <span className="text-[#6b7280]">Product</span>
            <strong className="text-right max-w-[150px] truncate">{selectedProduct ? selectedProduct.name : '—'}</strong>
          </div>

          <div className="flex justify-between items-center mb-6 text-[14px]">
            <span className="text-[#6b7280]">Quantity</span>
            <strong>{formData.quantity || 0}</strong>
          </div>

          <div className="h-px bg-[#e5e7eb] w-full mb-6"></div>

          <div className="flex justify-between items-end">
            <span className="text-[15px] font-medium text-[#374151]">Total</span>
            <strong className="text-[24px] font-black text-[#2563eb]">₹{totalAmount.toFixed(2)}</strong>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecordSale;
