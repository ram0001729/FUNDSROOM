import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AlertTriangle, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const LowStock = () => {
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/products?limit=100');
      // Filter products where current_stock <= min_stock
      const filtered = (res.data.data || []).filter(p => p.current_stock <= p.min_stock);
      setLowStockProducts(filtered);
    } catch (error) {
      console.error('Error fetching low stock data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading low stock alerts...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Low Stock Alerts</h1>
          <p className="text-gray-500 text-sm">Products requiring immediate attention</p>
        </div>
        
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-100 font-bold flex items-center gap-2">
          <AlertTriangle size={18} />
          {lowStockProducts.length} Items Critical
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">SKU</th>
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium text-right">Current Stock</th>
                <th className="p-4 font-medium text-right">Min Required</th>
                <th className="p-4 font-medium text-right">Deficit</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((p) => {
                const deficit = p.min_stock - p.current_stock;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 text-sm font-mono text-gray-500">{p.sku}</td>
                    <td className="p-4 font-bold text-gray-800">{p.name}</td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                        {p.current_stock}
                      </span>
                    </td>
                    <td className="p-4 text-right text-gray-500 font-medium">{p.min_stock}</td>
                    <td className="p-4 text-right font-bold text-amber-600">-{deficit > 0 ? deficit : 0}</td>
                    <td className="p-4">
                      <Link to={`/products`} className="text-xs bg-[#1B512D]/10 text-[#1B512D] hover:bg-[#1B512D]/20 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 w-max transition-colors">
                        <PackageOpen size={14} /> Reorder
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {lowStockProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-emerald-600 font-medium flex flex-col items-center justify-center gap-2">
                    <AlertTriangle size={32} className="opacity-50" />
                    All stock levels are healthy!
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

export default LowStock;
