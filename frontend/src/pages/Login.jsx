import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    await authenticate(username, password);
  };

  const authenticate = async (userParam, passParam) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/login', { username: userParam, password: passParam });
      const { token, user } = response.data;
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };


  const demoLogin = (role) => {
    const roles = {
      Admin: { user: 'admin1', pass: 'admin123' },
      Sales: { user: 'sales1', pass: 'admin123' },
      Warehouse: { user: 'warehouse1', pass: 'admin123' },
      Accounts: { user: 'accounts1', pass: 'admin123' }
    };
    setUsername(roles[role].user);
    setPassword(roles[role].pass);
    authenticate(roles[role].user, roles[role].pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md glass-panel p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/distribucore-logo.png" alt="DistribuCore" className="h-14 object-contain" />
          </div>
          <p className="text-gray-500">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email / Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full btn-primary py-2.5 mt-2 flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6">
          <p className="text-center text-sm text-gray-500 mb-3 border-t border-gray-100 pt-4">Or Quick Login As:</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => demoLogin('Admin')} className="text-xs font-bold py-2.5 px-3 bg-[#1B512D] text-white rounded hover:bg-[#154124] shadow-sm transition-all hover:shadow text-center">Admin</button>
            <button type="button" onClick={() => demoLogin('Sales')} className="text-xs font-bold py-2.5 px-3 bg-[#1B512D] text-white rounded hover:bg-[#154124] shadow-sm transition-all hover:shadow text-center">Sales</button>
            <button type="button" onClick={() => demoLogin('Warehouse')} className="text-xs font-bold py-2.5 px-3 bg-[#1B512D] text-white rounded hover:bg-[#154124] shadow-sm transition-all hover:shadow text-center">Warehouse</button>
            <button type="button" onClick={() => demoLogin('Accounts')} className="text-xs font-bold py-2.5 px-3 bg-[#1B512D] text-white rounded hover:bg-[#154124] shadow-sm transition-all hover:shadow text-center">Accounts</button>
          </div>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an account? <Link to="/register" className="text-green-600 font-medium hover:underline">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
