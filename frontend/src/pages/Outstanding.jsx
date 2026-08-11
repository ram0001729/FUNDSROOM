import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const Outstanding = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/invoices');
      // Filter only Pending and Overdue invoices
      const outstanding = res.data.data.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue');
      setInvoices(outstanding);
    } catch (error) {
      console.error('Failed to fetch outstanding invoices', error);
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.amount_paid)), 0);
  const totalOverdue = invoices.filter(i => i.status === 'Overdue').reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.amount_paid)), 0);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading outstanding dues...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Outstanding Dues</h1>
        <p className="text-gray-500 text-sm">Track pending customer payments and overdue invoices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm text-amber-600 font-semibold uppercase tracking-wider">Total Outstanding</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Clock size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-gray-800">₹{totalOutstanding.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <p className="text-sm text-gray-500 mt-2">Across {invoices.length} active invoices</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm text-red-600 font-semibold uppercase tracking-wider">Severely Overdue</div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={18} /></div>
          </div>
          <div className="text-3xl font-bold text-red-600">₹{totalOverdue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <p className="text-sm text-gray-500 mt-2">Requires immediate follow-up</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Invoice #</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium text-right">Invoice Total</th>
                <th className="p-4 font-medium text-right">Paid</th>
                <th className="p-4 font-medium text-right text-red-600">Balance Due</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const balance = parseFloat(inv.total_amount) - parseFloat(inv.amount_paid);
                return (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 font-semibold text-gray-800">{inv.invoice_number}</td>
                    <td className="p-4 text-gray-600 font-medium">{inv.customer_name || 'Walk-in'}</td>
                    <td className="p-4 text-right text-gray-500">₹{parseFloat(inv.total_amount).toFixed(2)}</td>
                    <td className="p-4 text-right text-emerald-600">₹{parseFloat(inv.amount_paid).toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-red-500">₹{balance.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'Overdue' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link to="/payments/record" className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 w-max transition-colors">
                        <CreditCard size={14} /> Record Payment
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-emerald-600 font-medium flex flex-col items-center justify-center gap-2">
                    <Clock size={32} className="opacity-50" />
                    No outstanding dues! All invoices are fully paid.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Outstanding;
