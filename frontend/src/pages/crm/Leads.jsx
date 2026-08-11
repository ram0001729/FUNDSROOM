import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Eye, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, page]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?status=Lead&search=${search}&page=${page}&limit=${limit}`);
      setLeads(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertToActive = async (lead) => {
    if (!window.confirm(`Are you sure you want to convert ${lead.name} to an Active customer?`)) return;
    try {
      const updated = { ...lead, status: 'Active' };
      await api.put(`/customers/${lead.id}`, updated);
      fetchLeads();
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert('Failed to convert lead.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">CRM Leads</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and convert potential customers</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search leads..." 
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
                <th className="p-4 font-semibold text-sm">Lead Name</th>
                <th className="p-4 font-semibold text-sm">Contact</th>
                <th className="p-4 font-semibold text-sm">Business Type</th>
                <th className="p-4 font-semibold text-sm">Follow-up</th>
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
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    {search ? 'No leads found matching your search.' : 'No leads available.'}
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-black">{lead.name}</div>
                      <div className="text-xs text-gray-500">{lead.business_name || 'Individual'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-black">{lead.mobile || 'No mobile'}</div>
                      <div className="text-xs text-gray-500">{lead.email || 'No email'}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {lead.type || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString() : 'None set'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/customers/${lead.id}`} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="View Details">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => convertToActive(lead)} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Convert to Active">
                          <UserCheck size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

export default Leads;
