import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Eye, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const Notes = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchNotes();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, page]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?has_notes=true&search=${search}&page=${page}&limit=${limit}`);
      setCustomers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLatestNoteSnippet = (notesString) => {
    if (!notesString) return '';
    const noteBlocks = notesString.split('\n\n');
    const latest = noteBlocks[noteBlocks.length - 1]; // last appended note
    if (latest.length > 120) return latest.substring(0, 120) + '...';
    return latest;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Customer Notes</h1>
          <p className="text-sm text-gray-500 mt-1">Review recent interactions and logged notes</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..." 
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
                <th className="p-4 font-semibold text-sm w-1/2">Latest Note Snippet</th>
                <th className="p-4 font-semibold text-sm">Last Updated</th>
                <th className="p-4 font-semibold text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    Loading notes...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 italic">
                    {search ? 'No notes found matching your search.' : 'No notes have been added yet.'}
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-black">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.business_name || 'Individual'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {getLatestNoteSnippet(c.notes)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-black">
                        {new Date(c.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/customers/${c.id}`} className="p-2 text-gray-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="View Full Notes">
                          <Eye size={18} />
                        </Link>
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

export default Notes;
