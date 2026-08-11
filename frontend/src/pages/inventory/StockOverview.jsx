import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const StockOverview = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, statsRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/inventory/stats')
      ]);
      setProducts(prodRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (error) {
      console.error('Error fetching stock overview', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading stock overview...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock Overview</h1>
        <p className="text-gray-500 text-sm">Real-time inventory levels and valuations</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-[#1B512D]/10 p-3 rounded-xl text-[#1B512D]">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Items in Stock</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.total_items.toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Valuation</p>
              <h3 className="text-2xl font-bold text-gray-800">₹{stats.total_valuation.toLocaleString()}</h3>
            </div>
          </div>

          <Link to="/inventory/low-stock" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-red-200 hover:shadow-md transition-all group">
            <div className="bg-red-50 p-3 rounded-xl text-red-500 group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium group-hover:text-red-500 transition-colors">Low Stock Alerts</p>
              <h3 className="text-2xl font-bold text-gray-800">{stats.low_stock_count} Items</h3>
            </div>
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">All Inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Current Stock</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-xs font-mono text-gray-500">{product.sku}</td>
                  <td className="p-4 font-medium text-gray-800">{product.name}</td>
                  <td className="p-4 text-sm text-gray-600">{product.location || 'Unassigned'}</td>
                  <td className="p-4 font-bold text-gray-800">{product.current_stock}</td>
                  <td className="p-4">
                    {product.current_stock <= product.min_stock ? (
                      <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                        <AlertTriangle size={12} /> Low Stock
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold w-max inline-block">
                        Healthy
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockOverview;
