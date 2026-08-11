import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { Package, TrendingUp, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Search, MapPin, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

const StockOverview = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, statsRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/inventory/stats')
      ]);
      const list = Array.isArray(prodRes.data?.data) ? prodRes.data.data : Array.isArray(prodRes.data) ? prodRes.data : [];
      setProducts(list);
      setStats(statsRes.data?.data || null);
    } catch (error) {
      console.error('Error fetching stock overview', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  }, [products, search]);

  // Compute Category Summaries
  const categoryStats = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const cat = p.category || 'General';
      if (!map[cat]) {
        map[cat] = { count: 0, stock: 0, valuation: 0 };
      }
      map[cat].count += 1;
      map[cat].stock += parseInt(p.current_stock || 0);
      map[cat].valuation += (parseInt(p.current_stock || 0) * parseFloat(p.unit_price || 0));
    });
    return Object.entries(map).map(([name, data]) => ({ name, ...data }));
  }, [products]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading stock overview analytics...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Overview & Analytics</h1>
          <p className="text-gray-500 text-sm">Real-time inventory metrics, location tracking, and stock valuation</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B512D] stroke-[2.5]" size={16} />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock by SKU, product, category..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B512D]/30 shadow-sm"
          />
        </div>
      </div>

      {/* 5 KPI Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-[#1B512D]/10 p-3 rounded-xl text-[#1B512D]">
              <Package size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Units</p>
              <h3 className="text-xl font-bold text-gray-800">{(stats.total_items || 0).toLocaleString()}</h3>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
              <TrendingUp size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Valuation</p>
              <h3 className="text-xl font-bold text-gray-800">₹{(stats.total_valuation || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
            </div>
          </div>

          <Link to="/inventory/low-stock" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-red-200 hover:shadow-md transition-all group">
            <div className="bg-red-50 p-3 rounded-xl text-red-500 group-hover:bg-red-100 transition-colors">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium group-hover:text-red-500 transition-colors">Low Stock Alerts</p>
              <h3 className="text-xl font-bold text-gray-800">{stats.low_stock_count || 0} Items</h3>
            </div>
          </Link>

          <Link to="/inventory/in" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-emerald-200 hover:shadow-md transition-all group">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
              <ArrowDownToLine size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium group-hover:text-blue-600 transition-colors">Inwards (30D)</p>
              <h3 className="text-xl font-bold text-gray-800">+{(stats.total_in_30d || 0).toLocaleString()}</h3>
            </div>
          </Link>

          <Link to="/inventory/out" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-amber-200 hover:shadow-md transition-all group">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
              <ArrowUpFromLine size={22} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium group-hover:text-amber-600 transition-colors">Outwards (30D)</p>
              <h3 className="text-xl font-bold text-gray-800">-{(stats.total_out_30d || 0).toLocaleString()}</h3>
            </div>
          </Link>

        </div>
      )}

      {/* Category Breakdown Bar */}
      {categoryStats.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-900 via-[#1B512D] to-emerald-900 text-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-[#73E2A7]" />
            <h3 className="text-sm font-bold tracking-wide">Category Inventory Breakdown</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {categoryStats.map((cat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 flex items-center gap-3">
                <span className="text-xs font-bold text-[#73E2A7]">{cat.name}</span>
                <span className="text-xs font-semibold opacity-90">{cat.stock} units</span>
                <span className="text-[10px] font-bold bg-[#73E2A7] text-[#1B512D] px-2 py-0.5 rounded-full">
                  ₹{cat.valuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-sm">Inventory Catalog ({filteredProducts.length} Items)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider bg-gray-50/80">
                <th className="p-4 font-semibold">SKU</th>
                <th className="p-4 font-semibold">Product Name</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold text-right">Current Stock</th>
                <th className="p-4 font-semibold text-right">Min Alert</th>
                <th className="p-4 font-semibold text-right">Unit Price</th>
                <th className="p-4 font-semibold text-right">Total Value</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const stockValuation = (parseInt(product.current_stock || 0) * parseFloat(product.unit_price || 0));
                const isLowStock = product.current_stock <= product.min_stock;
                return (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-xs font-mono text-gray-500 font-bold">{product.sku}</td>
                    <td className="p-4 font-bold text-gray-800 text-sm">{product.name}</td>
                    <td className="p-4 text-xs text-gray-600">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-semibold">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1 text-gray-500 font-medium">
                        <MapPin size={13} className="text-gray-400" />
                        {product.location || 'Warehouse A'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-gray-800">{product.current_stock}</td>
                    <td className="p-4 text-right text-xs text-gray-500 font-medium">{product.min_stock}</td>
                    <td className="p-4 text-right text-xs font-semibold text-gray-700">₹{parseFloat(product.unit_price || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-[#1B512D]">₹{stockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-4">
                      {isLowStock ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-extrabold flex items-center gap-1 w-max shadow-sm">
                          <AlertTriangle size={12} /> Low Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-extrabold w-max inline-block shadow-sm">
                          Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500 font-medium">No stock items found matching your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockOverview;
