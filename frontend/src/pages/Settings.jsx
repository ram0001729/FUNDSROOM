import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { User, Lock, Shield, Eye, EyeOff, Save, CheckCircle2, AlertCircle, KeyRound, Mail, Phone, UserCheck } from 'lucide-react';

const Settings = () => {
  const { user, login } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
    username: '',
    role: ''
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/profile');
      const data = res.data.data;
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        username: data.username || '',
        role: data.role || 'Admin'
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Fallback to authStore user
      if (user) {
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          mobile: user.mobile || '',
          username: user.username || '',
          role: user.role || 'Admin'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.put('/users/profile', {
        name: profileData.name,
        email: profileData.email,
        mobile: profileData.mobile
      });

      setMessage({ text: res.data.message || 'Profile updated successfully!', type: 'success' });
      
      // Update global auth store with updated profile
      const updatedUser = { ...user, ...res.data.data };
      const token = useAuthStore.getState().token;
      login(updatedUser, token);

    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage({ text: error.response?.data?.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      return setMessage({ text: 'New passwords do not match.', type: 'error' });
    }
    if (passwordData.new_password.length < 6) {
      return setMessage({ text: 'New password must be at least 6 characters long.', type: 'error' });
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.put('/users/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      setMessage({ text: res.data.message || 'Password changed successfully!', type: 'success' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
      setMessage({ text: error.response?.data?.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading personal settings...</div>;

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Personal Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile details, security, and account preferences</p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => { setActiveTab('profile'); setMessage({ text: '', type: '' }); }}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-[#1B512D] text-[#1B512D]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User size={16} /> Edit Profile
        </button>
        <button
          onClick={() => { setActiveTab('security'); setMessage({ text: '', type: '' }); }}
          className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-[#1B512D] text-[#1B512D]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock size={16} /> Security & Password
        </button>
      </div>

      {/* Tab 1: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-full bg-[#1B512D] text-white flex items-center justify-center font-bold text-2xl shadow-md">
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{profileData.name || 'User Profile'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-semibold text-gray-500">Role:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {profileData.role}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text" required className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#1B512D] font-medium text-gray-800 bg-white"
                    value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="email" required className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#1B512D] font-medium text-gray-800 bg-white"
                    value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text" className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#1B512D] font-medium text-gray-800 bg-white"
                    value={profileData.mobile} onChange={(e) => setProfileData({...profileData, mobile: e.target.value})}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Username (Read Only)</label>
                <div className="relative">
                  <UserCheck size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text" readOnly className="w-full border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm bg-gray-50 text-gray-500 font-medium outline-none"
                    value={profileData.username}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button type="submit" disabled={submitting} className="bg-[#1B512D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md transition-all flex items-center gap-2">
                <Save size={16} /> {submitting ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="p-3 bg-emerald-50 text-[#1B512D] rounded-xl"><KeyRound size={20} /></div>
            <div>
              <h3 className="font-bold text-gray-800">Change Account Password</h3>
              <p className="text-xs text-gray-500">Ensure your password is at least 6 characters long with numbers and letters</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Current Password *</label>
              <div className="relative">
                <input
                  type={showCurrentPass ? "text" : "password"} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#1B512D] font-medium bg-white"
                  value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">New Password *</label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"} required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#1B512D] font-medium bg-white"
                  value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm New Password *</label>
              <input
                type="password" required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1B512D] font-medium bg-white"
                value={passwordData.confirm_password} onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                placeholder="Re-enter new password"
              />
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button type="submit" disabled={submitting} className="bg-[#1B512D] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#154124] shadow-md transition-all flex items-center gap-2">
                <Lock size={16} /> {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings;
