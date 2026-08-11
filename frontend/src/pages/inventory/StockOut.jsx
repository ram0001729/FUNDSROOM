import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ArrowUpFromLine, Package } from 'lucide-react';

const StockOut = () => {
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
      // Filter for OUT only
      setMovements(moveRes.data.filter(m => m.movement_type === 'OUT'));
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching stock out data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stock out records...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock Outwards</h1>
        <p className="text-gray-500 text-sm">Track all dispatched inventory</p>
      </div>

      {stats && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 max-w-sm">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
            <ArrowUpFromLine size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Stock Dispatched (30 Days)</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.total_out_30d.toLocaleString()}</h3>
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
                <th className="p-4 font-medium">Quantity Dispatched</th>
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
                  <td className="p-4 font-bold text-amber-600">-{m.quantity_changed}</td>
                  <td className="p-4 text-sm text-gray-600">{m.reason}</td>
                  <td className="p-4 text-sm text-gray-500">{m.created_by_name}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No outward movements found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockOut;
