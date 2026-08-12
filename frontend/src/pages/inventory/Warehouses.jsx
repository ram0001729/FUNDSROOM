import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { MapPin, Package, TrendingUp, AlertTriangle, Building2, Search, X, CheckCircle2, User, Phone } from 'lucide-react';

const Warehouses = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/inventory/locations');
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setLocations(list);
    } catch (error) {
      console.error('Error fetching warehouse locations', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(l => 
      l.location_name && l.location_name.toLowerCase().includes(q)
    );
  }, [locations, search]);

  // Aggregate stats
  const totals = useMemo(() => {
    let units = 0;
    let val = 0;
    let lowCount = 0;
    locations.forEach(l => {
      units += (l.total_quantity || 0);
      val += (l.total_valuation || 0);
      lowCount += (l.low_stock_count || 0);
    });
    return { count: locations.length, units, val, lowCount };
  }, [locations]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading warehouse facilities...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Warehouses & Storage Zones</h1>
          <p className="text-gray-500 text-sm">Physical storage facilities, aisle locations, and stock distribution</p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1B512D] stroke-[2.5]" size={16} />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search warehouse zone..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B512D]/30 shadow-sm"
          />
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-[#1B512D]/10 p-3 rounded-xl text-[#1B512D]">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Active Zones</p>
            <h3 className="text-xl font-bold text-gray-800">{totals.count} Facilities</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Stored Units</p>
            <h3 className="text-xl font-bold text-gray-800">{totals.units.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Stored Asset Value</p>
            <h3 className="text-xl font-bold text-gray-800">₹{totals.val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-red-50 p-3 rounded-xl text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Low Stock Alerts</p>
            <h3 className="text-xl font-bold text-gray-800">{totals.lowCount} Items</h3>
          </div>
        </div>

      </div>

      {/* Warehouse Location Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map((loc, idx) => {
          // Dynamic Capacity calculation mockup
          const capacityEst = Math.min(100, Math.round(((loc.total_quantity || 0) / 1500) * 100));
          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#1B512D]/10 p-3 rounded-xl text-[#1B512D]">
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-gray-800">{loc.location_name}</h3>
                      <p className="text-xs text-gray-400 font-medium">Primary Storage Facility</p>
                    </div>
                  </div>

                  {loc.low_stock_count > 0 && (
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> {loc.low_stock_count} Alert
                    </span>
                  )}
                </div>

                {/* Capacity Progress */}
                <div className="mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
                    <span>Estimated Zone Utilization</span>
                    <span className="text-[#1B512D] font-bold">{capacityEst}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        capacityEst > 85 ? 'bg-amber-500' : 'bg-[#1B512D]'
                      }`}
                      style={{ width: `${Math.max(10, capacityEst)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics List */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Package size={15} className="text-gray-400" /> Unique SKUs
                    </span>
                    <span className="font-bold text-gray-800">{loc.total_products} SKUs</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <Package size={15} className="text-gray-400" /> Total Units
                    </span>
                    <span className="font-bold text-gray-800">{loc.total_quantity.toLocaleString()} units</span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <TrendingUp size={15} className="text-emerald-600" /> Valuation
                    </span>
                    <span className="font-bold text-[#1B512D]">₹{loc.total_valuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedZone(loc)}
                className="mt-6 w-full py-2.5 bg-gray-50 hover:bg-[#1B512D] hover:text-white text-gray-700 text-xs font-extrabold rounded-xl border border-gray-200 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                Inspect Zone Inventory ({loc.items ? loc.items.length : 0})
              </button>
            </div>
          );
        })}

        {filteredLocations.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Warehouse Zones Found</h3>
            <p className="text-gray-500 text-sm">No storage locations match your query.</p>
          </div>
        )}
      </div>

      {/* Zone Stock Inspection Modal */}
      {selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="bg-[#1B512D] text-white p-2.5 rounded-xl">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedZone.location_name}</h2>
                  <p className="text-xs text-gray-500 font-medium">Stored Product Manifest ({selectedZone.items?.length || 0} Products)</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedZone(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-center">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total Items</p>
                  <p className="text-base font-extrabold text-gray-800">{selectedZone.total_quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Valuation</p>
                  <p className="text-base font-extrabold text-[#1B512D]">₹{selectedZone.total_valuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Low Stock Alerts</p>
                  <p className="text-base font-extrabold text-red-600">{selectedZone.low_stock_count}</p>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                      <th className="p-3">SKU</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Current Stock</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedZone.items && selectedZone.items.length > 0 ? (
                      selectedZone.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-3 text-xs font-mono font-bold text-gray-500">{item.sku}</td>
                          <td className="p-3 font-bold text-gray-800 text-sm">{item.name}</td>
                          <td className="p-3 text-xs text-gray-600">{item.category || 'General'}</td>
                          <td className="p-3 text-right font-black text-gray-800">{item.current_stock}</td>
                          <td className="p-3 text-right text-xs font-semibold text-gray-700">₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                          <td className="p-3">
                            {item.current_stock <= item.min_stock ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertTriangle size={10} /> Low
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-block">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-6 text-center text-gray-500 text-xs">No items currently stored in this location.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedZone(null)}
                className="px-5 py-2 bg-gray-800 text-white text-xs font-bold rounded-xl hover:bg-black transition-colors"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Warehouses;
