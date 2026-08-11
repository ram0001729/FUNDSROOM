import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, CheckCircle } from 'lucide-react';

const Payments = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [reference, setReference] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, payRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/payments')
      ]);
      // Only show unpaid or partially paid invoices
      setInvoices(invRes.data.data.filter(i => i.status !== 'Paid'));
      setPayments(payRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(amount),
        payment_method: method,
        reference_number: reference,
        notes: 'Payment recorded via portal'
      });
      alert('Payment Recorded Successfully!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error recording payment');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading payments...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
          <p className="text-gray-500 text-sm">Record payments against pending invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Invoices Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">Pending Invoices</div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-medium">Invoice #</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Balance</th>
                  <th className="p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const balance = parseFloat(inv.total_amount) - parseFloat(inv.amount_paid);
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-3 font-semibold text-gray-800 text-sm">{inv.invoice_number}</td>
                      <td className="p-3 text-gray-600 text-sm">{inv.customer_name || 'Walk-in'}</td>
                      <td className="p-3 font-bold text-red-500 text-sm">₹{balance.toFixed(2)}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setAmount(balance.toFixed(2));
                            setShowModal(true);
                          }}
                          className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-semibold transition-colors"
                        >
                          Receive Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {invoices.length === 0 && (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500 text-sm">No pending invoices</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">Recent Payments</div>
          <div className="overflow-x-auto overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-3 font-medium">Payment #</th>
                  <th className="p-3 font-medium">Invoice</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 15).map((pay) => (
                  <tr key={pay.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-3 font-semibold text-gray-800 text-sm">{pay.payment_number}</td>
                    <td className="p-3 text-gray-600 text-sm">{pay.invoice_number}</td>
                    <td className="p-3 font-bold text-[#1B512D] text-sm">₹{parseFloat(pay.amount).toFixed(2)}</td>
                    <td className="p-3 text-gray-500 text-sm">{pay.payment_method}</td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr><td colSpan="4" className="p-4 text-center text-gray-500 text-sm">No recent payments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Record Payment</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form onSubmit={handlePayment} className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice</label>
                <input type="text" disabled value={`${selectedInvoice.invoice_number} - Balance: ₹${(selectedInvoice.total_amount - selectedInvoice.amount_paid).toFixed(2)}`} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (₹)</label>
                <input type="number" step="0.01" required max={(selectedInvoice.total_amount - selectedInvoice.amount_paid).toFixed(2)} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73E2A7]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73E2A7]">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number (Optional)</label>
                <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#73E2A7]" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#1B512D] text-white font-bold rounded-lg hover:bg-[#1B512D]/90 transition-colors flex items-center gap-2">
                  <CreditCard size={16} /> Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
