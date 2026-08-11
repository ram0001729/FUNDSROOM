import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MapPin, Package, TrendingUp } from 'lucide-react';

const Warehouses = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/inventory/locations');
      setLocations(res.data.data || []);
    } catch (error) {
      console.error('Error fetching warehouse locations', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading warehouses...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Warehouses & Locations</h1>
        <p className="text-gray-500 text-sm">Physical storage locations and capacity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <MapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{loc.location_name}</h3>
              </div>
            </div>

            <div className="space-y-4 mt-auto">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Package size={16} /> Unique Products
                </span>
                <span className="font-bold text-gray-800">{loc.total_products}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Package size={16} /> Total Quantity
                </span>
                <span className="font-bold text-gray-800">{loc.total_quantity}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <TrendingUp size={16} /> Total Value
                </span>
                <span className="font-bold text-[#1B512D]">₹{parseFloat(loc.total_valuation).toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
        {locations.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Locations Found</h3>
            <p className="text-gray-500 text-sm">Update products to assign them to physical locations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Warehouses;
