import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, CheckCircle } from 'lucide-react';

const Invoices = () => {
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/invoices')
      ]);
      // Only show dispatched orders that need invoicing
      setOrders(ordersRes.data.data.filter(o => o.status === 'Dispatched'));
      setInvoices(invoicesRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async (id) => {
    try {
      await api.post(`/invoices/from-order/${id}`);
      alert('Invoice Generated Successfully!');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error generating invoice');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading invoices...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-gray-500 text-sm">Manage billing and generate invoices from dispatched orders</p>
        </div>
      </div>

      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-2 font-semibold ${activeTab === 'pending' ? 'text-[#1B512D] border-b-2 border-[#1B512D]' : 'text-gray-500'}`}
        >
          Pending Generation
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-2 font-semibold ${activeTab === 'all' ? 'text-[#1B512D] border-b-2 border-[#1B512D]' : 'text-gray-500'}`}
        >
          Generated Invoices
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'pending' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Order #</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Total Amount</th>
                  <th className="p-4 font-medium">Status</th>
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
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => generateInvoice(order.id)} className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors">
                        <FileText size={14} /> Generate Invoice
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">No dispatched orders awaiting invoices.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-medium">Invoice #</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Total Amount</th>
                  <th className="p-4 font-medium">Amount Paid</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-800">{inv.invoice_number}</td>
                    <td className="p-4 text-gray-600">{inv.customer_name || 'Walk-in'}</td>
                    <td className="p-4 font-bold text-gray-800">₹{parseFloat(inv.total_amount).toFixed(2)}</td>
                    <td className="p-4 text-[#1B512D] font-bold">₹{parseFloat(inv.amount_paid).toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                        inv.status === 'Partial' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{new Date(inv.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No invoices generated yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoices;
