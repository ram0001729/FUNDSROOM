import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Edit2, Calendar, Phone, Mail, MapPin, Briefcase, Hash, Send } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
      
      const purchaseRes = await api.get(`/customers/${id}/purchases`);
      setPurchases(purchaseRes.data || []);
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSavingNote(true);
    try {
      const timestamp = new Date().toLocaleString();
      const messageWithCustomer = `Message to ${customer.name}: ${newNote}`;
      const updatedNotes = customer.notes 
        ? `${customer.notes}\n\n[${timestamp}] ${messageWithCustomer}`
        : `[${timestamp}] ${messageWithCustomer}`;

      const updatedCustomer = { ...customer, notes: updatedNotes };
      const res = await api.put(`/customers/${id}`, updatedCustomer);
      setCustomer(res.data);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Customer not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customers" className="p-2 bg-white rounded-xl shadow-sm border border-gray-200 text-gray-500 hover:text-green-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-black flex-1">{customer.name}</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          customer.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
          customer.status === 'Lead' ? 'bg-amber-100 text-amber-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {customer.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-100 pb-2">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-start gap-3">
                <Briefcase className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Business Name</p>
                  <p className="text-black font-medium">{customer.business_name || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">GST Number</p>
                  <p className="text-black font-medium">{customer.gst_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Customer Type</p>
                  <p className="text-black font-medium">{customer.type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Follow-up Date</p>
                  <p className="text-black font-medium">
                    {customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : 'None set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-100 pb-2">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex items-start gap-3">
                <Phone className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Mobile</p>
                  <p className="text-black font-medium">{customer.mobile || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Email</p>
                  <p className="text-black font-medium">{customer.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="text-green-500 mt-1" size={18} />
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Address</p>
                  <p className="text-black font-medium">{customer.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notes */}
        <div className="space-y-6">
          <div className="glass-panel p-6 flex flex-col h-full max-h-[600px]">
            <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-100 pb-2">Follow-up Notes</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3">
              {customer.notes ? (
                customer.notes.split('\n\n').map((noteBlock, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-black whitespace-pre-wrap">{noteBlock}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic text-center mt-10">No notes found for this customer.</p>
              )}
            </div>

            <form onSubmit={handleAddNote} className="mt-auto">
              <div className="relative">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={`Type a new follow-up note for ${customer.name}...`}
                  className="input-field resize-none h-24 pr-12 text-sm"
                  required
                ></textarea>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="absolute bottom-3 right-3 p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-md disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Purchase History Table */}
      <div className="glass-panel p-6 mt-6">
        <h2 className="text-lg font-bold text-black mb-4 border-b border-gray-100 pb-2">Purchase History</h2>
        
        {purchases.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">No purchases found for this customer yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-50/50 text-green-900 border-b border-green-100">
                  <th className="p-3 font-semibold text-sm">Date</th>
                  <th className="p-3 font-semibold text-sm">Challan #</th>
                  <th className="p-3 font-semibold text-sm">Product</th>
                  <th className="p-3 font-semibold text-sm">Qty</th>
                  <th className="p-3 font-semibold text-sm">Unit Price</th>
                  <th className="p-3 font-semibold text-sm">Total</th>
                  <th className="p-3 font-semibold text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-3 whitespace-nowrap text-gray-600">
                      {new Date(p.purchase_date).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-medium text-black">{p.challan_number}</td>
                    <td className="p-3 text-black">{p.product_name}</td>
                    <td className="p-3 text-gray-700">{p.quantity}</td>
                    <td className="p-3 text-gray-700">₹{parseFloat(p.unit_price).toFixed(2)}</td>
                    <td className="p-3 font-bold text-black">₹{parseFloat(p.total_price).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetail;
