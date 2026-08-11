import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ArrowDownToLine, Package } from 'lucide-react';

const StockIn = () => {
  const [movements, setMovements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moveRes, statsRes] = await Promise.all([
        api.get('/products/movements/log'),
        api.get('/inventory/stats')
      ]);
      // Filter for IN only
      setMovements(moveRes.data.filter(m => m.movement_type === 'IN'));
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching stock in data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stock in records...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock Inwards</h1>
        <p className="text-gray-500 text-sm">Track all incoming inventory</p>
      </div>

      {stats && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 max-w-sm">
          <div className="bg-[#1B512D]/10 p-4 rounded-xl text-[#1B512D]">
            <ArrowDownToLine size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Stock Received (30 Days)</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total_in_30d.toLocaleString()}</h3>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Quantity Received</th>
                <th className="p-4 font-medium">Reason/Source</th>
                <th className="p-4 font-medium">Logged By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 text-sm text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400" />
                      {m.product_name}
                      <span className="text-xs text-gray-400 font-mono">({m.sku})</span>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-[#1B512D]">+{m.quantity_changed}</td>
                  <td className="p-4 text-sm text-gray-600">{m.reason}</td>
                  <td className="p-4 text-sm text-gray-500">{m.created_by_name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No inward movements found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockIn;
