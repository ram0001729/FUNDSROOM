import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const StockLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/movements/log');
      setLogs(res.data || []);
    } catch (error) {
      console.error('Failed to fetch stock log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-[#111827]">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/products" className="w-8 h-8 flex items-center justify-center rounded-full border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f9fafb] hover:text-[#111827] transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold mb-0.5">Stock Movement Log</h1>
          <p className="text-[13px] text-[#6b7280]">Track all IN and OUT inventory changes.</p>
        </div>
      </div>

      <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Timestamp</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Product / SKU</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Movement</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Quantity</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Reason</th>
                <th className="p-[12px] text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Created By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-[#6b7280]">Loading log...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-[#6b7280]">No stock movements found.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f9fafb] transition-colors border-b border-[#e5e7eb] last:border-0">
                    <td className="p-[12px] text-[#6b7280] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-[12px]">
                      <div className="font-medium text-[#111827]">{log.product_name}</div>
                      <div className="text-[11px] text-[#6b7280] mt-0.5">{log.sku}</div>
                    </td>
                    <td className="p-[12px]">
                      <span className={`inline-flex items-center px-[8px] py-[2px] rounded-full text-[11px] font-semibold border ${
                        log.movement_type === 'IN' 
                          ? 'bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]' 
                          : 'bg-[#fecaca] text-[#dc2626] border-[#fecaca]'
                      }`}>
                        {log.movement_type}
                      </span>
                    </td>
                    <td className={`p-[12px] font-semibold ${log.movement_type === 'IN' ? 'text-[#15803d]' : 'text-[#dc2626]'}`}>
                      {log.movement_type === 'IN' ? '+' : '-'}{log.quantity_changed}
                    </td>
                    <td className="p-[12px] text-[#374151] max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="p-[12px] text-[#111827] font-medium">
                      {log.created_by_name}
                    </td>
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

export default StockLog;
