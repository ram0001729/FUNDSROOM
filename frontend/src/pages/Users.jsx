import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { Users as UsersIcon, UserPlus, Shield, Trash2, Key, Mail, Phone, CheckCircle, AlertCircle, X } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuthStore();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'Sales'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setUsersList(list);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsersList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role: newRole });
      alert(res.data.message || 'User role updated!');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.message || 'Error updating user role.');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      const res = await api.delete(`/users/${userId}`);
      alert(res.data.message || 'User deleted successfully.');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Error deleting user.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', mobile: '', password: '', role: 'Sales' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert(error.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleCounts = {
    Admin: usersList.filter(u => u.role === 'Admin').length,
    Sales: usersList.filter(u => u.role === 'Sales').length,
    Warehouse: usersList.filter(u => u.role === 'Warehouse').length,
    Accounts: usersList.filter(u => u.role === 'Accounts').length,
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'Sales': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Warehouse': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Accounts': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading user directory...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users & Roles</h1>
          <p className="text-gray-500 text-sm">Manage system access, permissions, and team roles</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#1B512D] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md transition-all flex items-center gap-2">
          <UserPlus size={18} /> Add New User
        </button>
      </div>

      {/* Role Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Admins</div>
          <div className="text-2xl font-bold text-gray-800">{roleCounts.Admin} <span className="text-xs text-gray-400 font-normal">users</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Sales Team</div>
          <div className="text-2xl font-bold text-gray-800">{roleCounts.Sales} <span className="text-xs text-gray-400 font-normal">users</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Warehouse</div>
          <div className="text-2xl font-bold text-gray-800">{roleCounts.Warehouse} <span className="text-xs text-gray-400 font-normal">users</span></div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Accounts</div>
          <div className="text-2xl font-bold text-gray-800">{roleCounts.Accounts} <span className="text-xs text-gray-400 font-normal">users</span></div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Current Role</th>
                <th className="p-4 font-medium">Change Role</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1B512D] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 flex items-center gap-1.5">
                          {u.name || u.username}
                          {u.id === currentUser?.id && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700">{u.email || '-'}</div>
                    <div className="text-xs text-gray-400">{u.mobile || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRoleBadgeStyle(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      disabled={u.id === currentUser?.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white outline-none focus:border-[#1B512D] disabled:opacity-50"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Sales">Sales</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Accounts">Accounts</option>
                    </select>
                  </td>
                  <td className="p-4 text-right">
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDeleteUser(u.id, u.name || u.username)} title="Delete User" className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add New Team Member</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" required placeholder="John Doe" value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username *</label>
                <input type="email" required placeholder="john@fundsroom.com" value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input type="text" placeholder="+91 9876543210" value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" required placeholder="Set temporary password" value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">System Role *</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-[#1B512D] text-sm bg-white font-semibold">
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Sales">Sales (Leads, Orders, Customers)</option>
                  <option value="Warehouse">Warehouse (Inventory, Dispatches, Stock)</option>
                  <option value="Accounts">Accounts (Invoices, Payments, Billing)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-[#1B512D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md">
                  {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
