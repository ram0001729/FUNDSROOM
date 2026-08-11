import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Truck } from 'lucide-react';

const WarehouseDispatch = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/sales-orders');
      // Only show orders that have stock reserved or are already dispatched
      setOrders(res.data.data.filter(o => o.status === 'Stock Reserved' || o.status === 'Dispatched' || o.status === 'Invoiced' || o.status === 'Paid'));
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  const dispatchOrder = async (id) => {
    try {
      await api.post(`/challans/from-order/${id}`);
      alert('Order Dispatched Successfully!');
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Error dispatching order');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading dispatch queue...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pending Dispatch</h1>
          <p className="text-gray-500 text-sm">Process reserved orders and generate challans</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">Order #</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date Reserved</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-semibold text-gray-800">{order.order_number}</td>
                  <td className="p-4 text-gray-600">{order.customer_name || 'Walk-in'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === 'Stock Reserved' ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(order.updated_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    {order.status === 'Stock Reserved' && (
                      <button onClick={() => dispatchOrder(order.id)} className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors">
                        <Truck size={14} /> Dispatch (Create Challan)
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No orders pending dispatch</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDispatch;
