import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import Logo from './Logo';
import Chatbot from './Chatbot';
import { Bot, BotMessageSquare, LayoutDashboard, Package, ArrowRightLeft, Receipt, BarChart2, Briefcase, Settings, Search, Bell, Home, Globe, ChevronDown, ChevronUp, Users, ShoppingCart, Activity, FileText, CreditCard, Truck } from 'lucide-react';
const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [language, setLanguage] = useState('EN');
  
  const [counts, setCounts] = useState({
    pendingOrders: 0,
    lowStock: 0,
    overdueInvoices: 0,
    pendingDispatches: 0,
    newLeads: 0,
    pendingPurchases: 0
  });

  useEffect(() => {
    fetchSidebarCounts();
    const interval = setInterval(fetchSidebarCounts, 8000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const fetchSidebarCounts = async () => {
    try {
      const res = await api.get('/reports');
      const data = res.data;
      setCounts({
        pendingOrders: data.sales_dashboard_stats?.pending_orders || 0,
        lowStock: data.predictive_alerts?.length || 0,
        overdueInvoices: data.accounts_stats?.overdue_invoices || 0,
        pendingDispatches: data.warehouse_dashboard_stats?.pending_dispatches || 0,
        newLeads: data.sales_dashboard_stats?.new_leads || 0,
        pendingPurchases: data.overall_stats?.pending_purchases || 0
      });
    } catch (err) {
      console.error('Failed to fetch sidebar counts', err);
    }
  };

  const languages = [
    { code: 'EN', name: 'English' },
    { code: 'HI', name: 'Hindi' },
    { code: 'ES', name: 'Spanish' },
    { code: 'FR', name: 'French' },
    { code: 'AR', name: 'Arabic' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (name) => {
    setOpenMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Sales', 'Accounts', 'Warehouse'] },
    
    // Customers
    { name: 'Customers', path: '/customers', icon: Users, roles: ['Admin', 'Sales'], badge: counts.newLeads, badgeColor: 'bg-blue-500' },
    
    // Products & Inventory
    { name: 'Products', path: '/products', icon: Package, roles: ['Admin', 'Warehouse'], badge: counts.lowStock, badgeColor: 'bg-red-500' },
    { name: 'Inventory', path: '/inventory/stock', icon: Package, roles: ['Admin', 'Warehouse'], badge: counts.lowStock, badgeColor: 'bg-red-500', children: [
      { name: 'Stock Overview', path: '/inventory/stock', roles: ['Admin', 'Warehouse'] },
      { name: 'Stock In', path: '/inventory/in', roles: ['Warehouse'] },
      { name: 'Stock Out', path: '/inventory/out', roles: ['Warehouse'] },
      { name: 'Stock Movements', path: '/stock-log', roles: ['Warehouse'] },
      { name: 'Low Stock Alerts', path: '/inventory/low-stock', roles: ['Warehouse'], badge: counts.lowStock, badgeColor: 'bg-red-500' }
    ]},
    { name: 'Warehouses', path: '/warehouses', icon: Package, roles: ['Warehouse'], badge: counts.pendingDispatches, badgeColor: 'bg-amber-500' },
    
    // Purchases
    { name: 'Purchases', path: '/purchases/orders', icon: ShoppingCart, roles: ['Admin', 'Warehouse', 'Accounts'], badge: counts.pendingPurchases, badgeColor: 'bg-emerald-600' },
    
    // Sales Operations
    { name: 'Sales', path: '/sales/orders', icon: ShoppingCart, roles: ['Admin', 'Sales'], badge: counts.pendingOrders, badgeColor: 'bg-amber-500' },
    { name: 'Challans', path: '/challans', icon: ShoppingCart, roles: ['Admin'] },
    { name: 'Sales Challans', path: '/challans', icon: ShoppingCart, roles: ['Sales'] },
    { name: 'Online Sales', path: '/sales/online', icon: Globe, roles: ['Sales', 'Accounts'] },
    { name: 'Offline Sales', path: '/sales/offline', icon: ShoppingCart, roles: ['Sales', 'Accounts'] },
    { name: 'CRM / Follow-ups', path: '/crm/leads', icon: Users, roles: ['Sales'], badge: counts.newLeads, badgeColor: 'bg-[#73E2A7] text-[#1B512D]' },
    
    // Financial & Accounting
    { name: 'Invoices', path: '/invoices', icon: FileText, roles: ['Admin', 'Accounts'], badge: counts.overdueInvoices, badgeColor: 'bg-rose-500' },
    { name: 'Payments', path: '/payments/history', icon: CreditCard, roles: ['Accounts'] },
    { name: 'Accounts', path: '/billing', icon: Briefcase, roles: ['Admin'] },
    { name: 'Outstanding', path: '/payments/outstanding', icon: FileText, roles: ['Accounts'], badge: counts.overdueInvoices, badgeColor: 'bg-rose-500' },
    
    // Reports
    { name: 'Reports', path: '/reports', icon: BarChart2, roles: ['Admin', 'Accounts'] },
    { name: 'Sales Reports', path: '/reports/sales', icon: BarChart2, roles: ['Sales'] },
    
    // Admin Settings
    { name: 'Users & Roles', path: '/users', icon: Users, roles: ['Admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['Admin'] }
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  return (
    <div className="flex flex-col h-screen font-sans bg-gradient-to-br from-[#f0fdf4] to-[#e6fcf0] overflow-hidden text-black font-medium">
      
      {/* Floating Mint Glassmorphism Header */}
      <header className="py-3 px-4 lg:px-8 flex-shrink-0 z-30">
        <div className="max-w-7xl mx-auto h-[64px] bg-gradient-to-r from-[#a7f3d0]/70 via-[#bbf7d0]/80 to-[#a7f3d0]/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(16,185,129,0.25)] rounded-full px-6 flex items-center justify-between transition-all">
        
          {/* Left side: Logo & Brand */}
          <div className="flex items-center gap-3">
            <Logo to="/dashboard" />
          </div>
          
          {/* Middle: Search Bar */}
          <div className="flex-1 max-w-lg hidden md:block px-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#1B512D]/70 group-focus-within:text-[#1B512D] transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-12 pr-5 py-2.5 bg-white/50 hover:bg-white/70 backdrop-blur-lg border border-white/70 rounded-full text-[13px] text-gray-800 focus:outline-none focus:bg-white/90 focus:ring-2 focus:ring-[#1B512D]/30 focus:border-white transition-all placeholder-gray-500 shadow-inner"
              />
            </div>
          </div>

          {/* Right side: Actions & Profile */}
          <div className="flex items-center gap-2 md:gap-3 justify-end">
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              <Link to="/" className="flex items-center gap-1.5 px-4 py-2 bg-white/70 hover:bg-white/95 border border-white/90 shadow-sm rounded-full text-gray-800 hover:text-[#1B512D] transition-all text-[12px] font-extrabold tracking-wide uppercase" title="Go to Website Home">
                <Home size={15} />
                <span className="hidden lg:inline-block">Home</span>
              </Link>
              
              <div className="relative">
                <button 
                  onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/70 hover:bg-white/95 border border-white/90 shadow-sm rounded-full text-gray-800 hover:text-[#1B512D] transition-all text-[12px] font-extrabold tracking-wide uppercase" 
                  title="Change Language"
                >
                  <Globe size={15} />
                  <span className="hidden sm:inline-block">{language}</span>
                </button>
                
                {isLanguageOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/80 py-1 z-50 overflow-hidden">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLanguageOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${
                          language === lang.code 
                            ? 'bg-emerald-100 text-emerald-800 font-bold' 
                            : 'text-gray-700 hover:bg-emerald-50'
                        }`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="relative p-2 text-gray-700 hover:text-[#1B512D] hover:bg-white/80 rounded-full transition-all" title="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            <div className="h-6 w-px bg-emerald-700/20 mx-1 hidden sm:block"></div>

            <div className="relative">
              <div 
                className="flex items-center gap-2.5 cursor-pointer p-1 pr-3 rounded-full hover:bg-white/60 transition-colors border border-transparent hover:border-white/80"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-[#1B512D] text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'A')}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[12px] font-bold text-gray-800 leading-tight">
                    {user?.name || (user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin')}
                  </span>
                  <span className="text-[10px] text-[#1B512D] font-semibold">{user?.role || 'Administrator'}</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-[16px] shadow-lg border border-[#e5e7eb] z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb]">
                    <p className="font-bold text-[#111827] text-[15px]">{user?.name || user?.username}</p>
                    {user?.email && <p className="text-[12px] text-[#6b7280] mt-0.5">{user.email}</p>}
                    {user?.mobile && <p className="text-[12px] text-[#6b7280] mt-0.5">{user.mobile}</p>}
                    <div className="mt-2 inline-block px-2.5 py-1 bg-[#e0e7ff] text-[#4f46e5] text-[11px] font-bold rounded-full border border-[#c7d2fe]">
                      Role: {user?.role}
                    </div>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                      className="w-full text-left px-3 py-2 text-[13px] font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </header>

      {/* Main Body (Sidebar + Content) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-[240px] bg-[#1B512D] text-white flex flex-col py-5 flex-shrink-0 z-20 transition-all rounded-tr-[24px] shadow-xl overflow-y-auto overflow-x-hidden">
          <nav className="flex-1 flex flex-col px-4">
            <div className="text-[11px] uppercase text-[#73E2A7] opacity-80 mx-2 mb-2 tracking-[0.06em]">
              Main Menu
            </div>
            
            {visibleNavItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              // Filter children based on role if roles is specified on child, otherwise inherit from parent item check
              const visibleChildren = hasChildren ? item.children.filter(child => !child.roles || (user?.role && child.roles.includes(user.role))) : [];
              const showChildren = hasChildren && visibleChildren.length > 0;
              
              const isMainActive = item.path ? (location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))) : false;
              const isChildActive = showChildren ? visibleChildren.some(child => location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path))) : false;
              const isActive = isMainActive || isChildActive;
              const isOpen = openMenus[item.name] || isChildActive;

              return (
                <div key={item.name} className="mb-0.5">
                  {showChildren ? (
                    <button
                      onClick={() => toggleMenu(item.name)}
                      className={`w-full flex items-center justify-between px-3 py-[10px] mx-1 text-[14px] rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-white/10 text-[#73E2A7] font-bold shadow-sm' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={18} className={`mr-3 ${isActive ? 'text-[#73E2A7]' : 'text-[#73E2A7]/70'}`} />
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge > 0 && (
                          <span 
                            title={`${item.badge} dynamic ${item.name.toLowerCase()} notification${item.badge > 1 ? 's' : ''}`}
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-red-500 text-white'} shadow-sm flex items-center justify-center min-w-[20px] h-[20px]`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isOpen ? <ChevronUp size={16} className="opacity-70" /> : <ChevronDown size={16} className="opacity-70" />}
                      </div>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      title={item.badge > 0 ? `${item.badge} dynamic ${item.name.toLowerCase()} notification${item.badge > 1 ? 's' : ''}` : item.name}
                      className={`flex items-center justify-between px-3 py-[10px] mx-1 text-[14px] rounded-xl transition-colors ${
                        isActive 
                          ? 'bg-[#73E2A7] text-[#1B512D] font-bold shadow-sm' 
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={18} className={`mr-3 ${isActive ? 'text-[#1B512D]' : 'text-[#73E2A7]'}`} />
                        {item.name}
                      </div>
                      {item.badge > 0 && (
                        <span 
                          title={`${item.badge} dynamic ${item.name.toLowerCase()} notification${item.badge > 1 ? 's' : ''}`}
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-[#1B512D] text-[#73E2A7]' : (item.badgeColor || 'bg-red-500 text-white')} shadow-sm flex items-center justify-center min-w-[20px] h-[20px]`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                  
                  {/* Nested Menu Items */}
                  {showChildren && isOpen && (
                    <div className="mt-1 mb-2 ml-10 space-y-1">
                      {visibleChildren.map((child) => {
                        const isChildLinkActive = location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path));
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            className={`block px-3 py-1.5 text-[13px] rounded-lg transition-colors ${
                              isChildLinkActive
                                ? 'text-[#73E2A7] font-bold'
                                : 'text-white/70 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-auto px-4 pb-6">
            <p className="text-[10px] text-[#73E2A7] text-center opacity-60 uppercase tracking-wider">© 2024 DistribuCore</p>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 md:px-6 md:py-8 relative">
          <Outlet />

          {/* Chatbot Toggle Button */}
          {!isChatOpen && (
            <button 
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)] bg-gradient-to-br from-[#e34234] via-rose-500 to-orange-500 text-white hover:scale-110 transition-transform z-50 flex items-center justify-center"
            >
              <Bot size={30} />
              <span className="absolute 0 right-1 top-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></span>
            </button>
          )}

          {/* Chatbot Window */}
          {isChatOpen && (
            <Chatbot onClose={() => setIsChatOpen(false)} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
