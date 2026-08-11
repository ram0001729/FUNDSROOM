import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      Admin: { user: 'admin', pass: 'admin123' },
      Sales: { user: 'sales_user', pass: 'admin123' },
      Warehouse: { user: 'warehouse_user', pass: 'admin123' },
      Accounts: { user: 'accounts_user', pass: 'admin123' }
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
            <Logo size="lg" to="/" />
          </div>
          <p className="text-gray-500 font-medium text-sm mt-2">Sign in to your account</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* 1. SELECT ROLE FIRST */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Select Login Role</label>
          <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-gray-100 rounded-xl border border-gray-200/80">
            <button 
              type="button" 
              onClick={() => demoLogin('Admin')} 
              className={`text-xs font-bold py-2 rounded-lg transition-all text-center ${
                username === 'admin' 
                  ? 'bg-[#1B512D] text-white shadow-md scale-105' 
                  : 'text-gray-700 hover:bg-white/80'
              }`}
            >
              Admin
            </button>
            <button 
              type="button" 
              onClick={() => demoLogin('Sales')} 
              className={`text-xs font-bold py-2 rounded-lg transition-all text-center ${
                username === 'sales_user' 
                  ? 'bg-[#1B512D] text-white shadow-md scale-105' 
                  : 'text-gray-700 hover:bg-white/80'
              }`}
            >
              Sales
            </button>
            <button 
              type="button" 
              onClick={() => demoLogin('Warehouse')} 
              className={`text-xs font-bold py-2 rounded-lg transition-all text-center ${
                username === 'warehouse_user' 
                  ? 'bg-[#1B512D] text-white shadow-md scale-105' 
                  : 'text-gray-700 hover:bg-white/80'
              }`}
            >
              Warehouse
            </button>
            <button 
              type="button" 
              onClick={() => demoLogin('Accounts')} 
              className={`text-xs font-bold py-2 rounded-lg transition-all text-center ${
                username === 'accounts_user' 
                  ? 'bg-[#1B512D] text-white shadow-md scale-105' 
                  : 'text-gray-700 hover:bg-white/80'
              }`}
            >
              Accounts
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* 2. EMAIL / USERNAME */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Email / Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email or username"
              required
            />
          </div>
          
          {/* 3. PASSWORD */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className="input-field pr-10" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full btn-primary py-3 mt-2 flex justify-center items-center font-bold text-sm shadow-md hover:shadow-lg transition-all"
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
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an account? <Link to="/register" className="text-green-600 font-medium hover:underline">Create one</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
