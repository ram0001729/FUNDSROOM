import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Eye, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const FollowUps = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchFollowUps();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, page]);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?has_follow_up=true&search=${search}&page=${page}&limit=${limit}`);
      setCustomers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFollowUpStatus = (dateString) => {
    const followUpDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (followUpDate < today) return { label: 'Overdue', color: 'text-red-600 bg-red-50 border-red-200' };
    if (followUpDate.getTime() === today.getTime()) return { label: 'Today', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    return { label: 'Upcoming', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
  };

  const clearFollowUp = async (customer) => {
    if (!window.confirm(`Mark follow-up for ${customer.name} as completed?`)) return;
    try {
      const updated = { ...customer, follow_up_date: null };
      await api.put(`/customers/${customer.id}`, updated);
      fetchFollowUps();
    } catch (error) {
      console.error('Failed to update follow-up:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-1">Customers that require your attention</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B512D] stroke-[2.5]" size={18} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                <th className="p-4 font-semibold text-sm">Customer</th>
                <th className="p-4 font-semibold text-sm">Contact</th>
                <th className="p-4 font-semibold text-sm">Status</th>
                <th className="p-4 font-semibold text-sm">Scheduled Date</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading follow-ups...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    {search ? 'No follow-ups found matching your search.' : 'No scheduled follow-ups.'}
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const status = getFollowUpStatus(c.follow_up_date);
                  return (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-black">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.business_name || 'Individual'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-black">{c.mobile || 'N/A'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[11px] font-bold border ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-black">
                          <Calendar size={16} className="text-gray-400" />
                          {new Date(c.follow_up_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/customers/${c.id}`} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="View Customer Details">
                            <Eye size={18} />
                          </Link>
                          <button onClick={() => clearFollowUp(c)} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Mark Completed">
                            <CheckCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing page <span className="font-bold text-black">{page}</span> of <span className="font-bold text-black">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowUps;
