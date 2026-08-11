import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Billing = () => {
  const [period, setPeriod] = useState('month'); // 'today', 'month', '6months'
  const [data, setData] = useState({ sales: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [period]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/challans/billing/summary?period=${period}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch billing data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!data.sales || data.sales.length === 0) {
      alert('No sales data to export.');
      return;
    }
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text(`DistribuCore Billing & Invoices - ${period.toUpperCase()}`, 14, 22);
    
    // KPI Summary
    doc.setFontSize(11);
    doc.text(`Total Sales: Rs ${parseFloat(data.stats.total_sales || 0).toFixed(2)}`, 14, 32);
    doc.text(`Total Profit: Rs ${parseFloat(data.stats.total_profit || 0).toFixed(2)}`, 14, 38);
    doc.text(`Total Invoices: ${data.stats.total_invoices || 0}`, 14, 44);
    doc.text(`Units Sold: ${data.stats.total_qty || 0}`, 14, 50);

    const tableColumn = ["Date", "Product", "Category", "Qty", "Unit (Rs)", "Total (Rs)", "Customer"];
    const tableRows = [];

    data.sales.forEach(sale => {
      const saleData = [
        new Date(sale.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        sale.product_name,
        sale.category || '-',
        sale.quantity,
        parseFloat(sale.unit_price).toFixed(2),
        parseFloat(sale.total_price).toFixed(2),
        sale.customer_name || '-'
      ];
      tableRows.push(saleData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 56,
      theme: 'grid',
      headStyles: { fillColor: [27, 81, 45] } // DistribuCore dark green: #1B512D
    });

    doc.save(`DistribuCore_Billing_${period}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const { stats, sales } = data;

  return (
    <div className="w-full text-[#111827] animate-fade-in max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-[22px] font-semibold mb-1">Billing & Invoices</h1>
          <p className="text-[13px] text-[#6b7280]">See what you sold, profits, and download PDF summaries.</p>
        </div>
        <button 
          onClick={handleDownloadPDF} 
          className="bg-[#1B512D] text-white px-4 py-2 rounded-full text-[13px] font-medium hover:brightness-95 shadow-sm transition-all flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-4 mb-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="text-[11px] font-medium text-[#6b7280] uppercase tracking-wider mb-1.5 ml-1">Period</div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('today')}
              className={`px-[12px] py-[6px] rounded-full text-[13px] font-medium transition-colors ${period === 'today' ? 'bg-[#73E2A7] text-[#1B512D]' : 'bg-[#f9fafb] text-[#374151] hover:bg-[#e5e7eb]'}`}
            >
              Today
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-[12px] py-[6px] rounded-full text-[13px] font-medium transition-colors ${period === 'month' ? 'bg-[#73E2A7] text-[#1B512D]' : 'bg-[#f9fafb] text-[#374151] hover:bg-[#e5e7eb]'}`}
            >
              This month
            </button>
            <button 
              onClick={() => setPeriod('6months')}
              className={`px-[12px] py-[6px] rounded-full text-[13px] font-medium transition-colors ${period === '6months' ? 'bg-[#73E2A7] text-[#1B512D]' : 'bg-[#f9fafb] text-[#374151] hover:bg-[#e5e7eb]'}`}
            >
              Last 6 months
            </button>
          </div>
        </div>
        <div className="text-right text-[12px] text-[#6b7280]">
          <div>You can export up to 6 months at once.</div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[14px] mb-[18px]">
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Total invoices</div>
          <div className="text-[18px] font-semibold">{stats.total_invoices || 0}</div>
          <div className="text-[11px] text-[#6b7280] mt-1 line-clamp-1">Number of sale records</div>
        </div>

        <div className="bg-[#f0fdf4] rounded-[16px] border border-[#bbf7d0] shadow-sm px-[18px] py-4">
          <div className="text-[12px] text-[#15803d] mb-1.5 font-medium">Total sales</div>
          <div className="text-[18px] font-semibold text-[#166534]">₹{parseFloat(stats.total_sales || 0).toFixed(2)}</div>
          <div className="text-[11px] text-[#15803d] mt-1 line-clamp-1">Gross revenue</div>
        </div>

        <div className="bg-[#f0fdf4] rounded-[16px] border border-[#bbf7d0] shadow-sm px-[18px] py-4">
          <div className="text-[12px] text-[#15803d] mb-1.5 font-medium">Total profit</div>
          <div className="text-[18px] font-semibold text-[#166534]">₹{parseFloat(stats.total_profit || 0).toFixed(2)}</div>
          <div className="text-[11px] text-[#15803d] mt-1 line-clamp-1">After cost price</div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Units sold</div>
          <div className="text-[18px] font-semibold">{stats.total_qty || 0}</div>
          <div className="text-[11px] text-[#6b7280] mt-1 line-clamp-1">All products combined</div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Paid today</div>
          <div className="text-[18px] font-semibold">₹{parseFloat(stats.paid_today || 0).toFixed(2)}</div>
          <div className="text-[11px] text-[#6b7280] mt-1 line-clamp-1">Only when period = today</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
          <h3 className="text-[14px] font-semibold text-[#111827]">Invoices / Sales in this period</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Date & Time</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Product</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Category</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Qty</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Unit (₹)</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Total (₹)</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Customer</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="p-6 text-center text-[#6b7280]">Loading sales...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="7" className="p-6 text-center text-[#6b7280]">No sales recorded for this period.</td></tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-[#f9fafb] transition-colors border-b border-[#e5e7eb] last:border-0">
                    <td className="p-[12px] text-[#6b7280] whitespace-nowrap">
                      {new Date(sale.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-[12px] font-medium text-[#111827]">{sale.product_name}</td>
                    <td className="p-[12px] text-[#6b7280]">{sale.category || '—'}</td>
                    <td className="p-[12px] font-medium">{sale.quantity}</td>
                    <td className="p-[12px] text-[#6b7280]">{parseFloat(sale.unit_price).toFixed(2)}</td>
                    <td className="p-[12px] font-semibold text-[#111827]">{parseFloat(sale.total_price).toFixed(2)}</td>
                    <td className="p-[12px] text-[#6b7280]">{sale.customer_name || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Billing;
