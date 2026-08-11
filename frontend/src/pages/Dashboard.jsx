import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IndianRupee, TrendingUp, ShoppingBag, BarChart3, AlertTriangle, Users, Package, FileText, Truck, CreditCard } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'Admin';

  const [reportData, setReportData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reportRes, challansRes, productsRes, invoicesRes] = await Promise.all([
        api.get('/reports'),
        api.get('/challans?limit=5'),
        api.get('/products?limit=100'),
        api.get('/invoices?limit=5')
      ]);

      setReportData(reportRes.data);
      setRecentSales(challansRes.data.data || []);
      setRecentInvoices(invoicesRes.data.data || []);
      
      const products = productsRes.data.data || [];
      const lowStock = products.filter(p => p.current_stock <= p.min_stock).length;
      setLowStockCount(lowStock);

    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  const { stats, summary_30d, chart, predictive_alerts } = reportData || {};

  const chartData = {
    labels: chart?.month_labels || [],
    datasets: [
      {
        label: 'Sales (₹)',
        data: chart?.month_values || [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#2563eb',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } },
      x: { grid: { display: false }, ticks: { color: '#6b7280' } }
    }
  };



  const salesDailyChartData = {
    labels: reportData?.sales_dashboard_stats?.daily_trend?.labels || [],
    datasets: [
      {
        label: 'Pipeline Sales (₹)',
        data: reportData?.sales_dashboard_stats?.daily_trend?.sales || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
    ],
  };

  const renderAdminDashboard = () => (
    <>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Sales Card */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider">Sales (30 Days)</div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><IndianRupee size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(stats?.total_sales || 0).toFixed(2)}</div>
        </div>
        
        {/* Profit Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-emerald-600 font-semibold uppercase tracking-wider">Profit (30 Days)</div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(stats?.total_profit || 0).toFixed(2)}</div>
        </div>
        
        {/* Total Orders Card */}
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-purple-600 font-semibold uppercase tracking-wider">Total Orders</div>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><ShoppingBag size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{stats?.total_orders || 0}</div>
        </div>
        
        {/* Avg Order Value Card */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-amber-600 font-semibold uppercase tracking-wider">Avg Order Value</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><BarChart3 size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(stats?.avg_order_value || 0).toFixed(2)}</div>
        </div>
        
        {/* Low Stock Items Card */}
        <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-red-600 font-semibold uppercase tracking-wider">Low Stock Items</div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
        </div>
      </div>

      {/* Main Grid 2 (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[14px] font-semibold mb-4">Sales Trend (Last 6 Months)</div>
          <div className="h-[220px] rounded-[16px] bg-white relative">
             <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4 flex flex-col max-h-[300px] overflow-hidden">
          <div className="text-[14px] font-semibold mb-2">Top Selling Products</div>
          <ul className="list-none text-[13px] overflow-y-auto pr-2 mt-2 space-y-3">
            {summary_30d?.products?.slice(0, 5).map((p, idx) => (
              <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <div className="font-medium">{p.product_name}</div>
                  <div className="text-[11px] text-[#6b7280]">{p.quantity} units sold</div>
                </div>
                <div className="font-semibold text-[#166534]">₹{parseFloat(p.amount).toFixed(0)}</div>
              </li>
            ))}
            {(!summary_30d?.products || summary_30d.products.length === 0) && (
              <li className="text-gray-500 text-center py-4">No data available</li>
            )}
          </ul>
        </div>
      </div>

      {/* Main Grid 3 (Bottom row) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        
        {/* Recent Sales Activity */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="flex justify-between items-center mb-4">
             <div className="text-[14px] font-semibold">Recent Sales Activity</div>
             <Link to="/challans" className="text-[12px] text-[#2563eb] hover:underline font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px] border-collapse">
               <thead>
                 <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                   <th className="pb-2 font-medium">Challan #</th>
                   <th className="pb-2 font-medium">Customer</th>
                   <th className="pb-2 font-medium">Date</th>
                   <th className="pb-2 font-medium">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {recentSales.map((sale) => (
                   <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50">
                     <td className="py-2.5 font-medium">{sale.challan_number}</td>
                     <td className="py-2.5">{sale.customer_name || 'Walk-in'}</td>
                     <td className="py-2.5 text-[#6b7280]">{new Date(sale.created_at).toLocaleString()}</td>
                     <td className="py-2.5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          sale.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          sale.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sale.status}
                        </span>
                     </td>
                   </tr>
                 ))}
                 {recentSales.length === 0 && (
                   <tr><td colSpan="4" className="text-center py-4 text-gray-500">No recent sales.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>

        {/* AI Stock Forecast */}
        <div className="bg-white rounded-[16px] border border-[#fef3c7] shadow-sm px-[18px] py-4 flex flex-col max-h-[300px] overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <div className="text-[14px] font-semibold text-amber-800 flex items-center">
               <span className="mr-2">✨</span> AI Stock Forecast
             </div>
          </div>
          <p className="text-[11px] text-[#6b7280] mb-2">Predicts run-out dates based on 30-day velocity.</p>
          <ul className="list-none text-[13px] overflow-y-auto pr-2 mt-2 space-y-3">
            {predictive_alerts?.slice(0, 5).map((alert, idx) => (
              <li key={idx} className="flex justify-between items-center border-b border-amber-50 pb-2">
                <div>
                  <div className="font-medium">{alert.product_name}</div>
                  <div className="text-[11px] text-amber-600 font-medium">Selling {alert.daily_velocity}/day</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{alert.days_remaining} Days Left</div>
                  <div className="text-[10px] text-gray-500">Stock: {alert.current_stock}</div>
                </div>
              </li>
            ))}
            {(!predictive_alerts || predictive_alerts.length === 0) && (
              <li className="text-gray-500 text-center py-4">All stock levels look healthy! No immediate run-outs predicted.</li>
            )}
          </ul>
        </div>
      </div>
    </>
  );

  const renderSalesDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-blue-600 font-semibold uppercase tracking-wider">My Sales (30 Days)</div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><IndianRupee size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(stats?.total_sales || 0).toFixed(2)}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-purple-600 font-semibold uppercase tracking-wider">New Leads</div>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Users size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{reportData?.sales_dashboard_stats?.new_leads || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-emerald-600 font-semibold uppercase tracking-wider">Follow-ups Today</div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><AlertTriangle size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{reportData?.sales_dashboard_stats?.follow_ups_today || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-amber-600 font-semibold uppercase tracking-wider">Pending Orders</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><ShoppingBag size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{reportData?.sales_dashboard_stats?.pending_orders || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[14px] font-semibold mb-4">Pipeline Sales Trend (Last 14 Days)</div>
          <div className="h-[220px] rounded-[16px] bg-white relative">
             <Line data={salesDailyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4 flex flex-col max-h-[300px] overflow-hidden">
          <div className="text-[14px] font-semibold mb-2">Top Selling Products</div>
          <ul className="list-none text-[13px] overflow-y-auto pr-2 mt-2 space-y-3">
            {summary_30d?.products?.slice(0, 5).map((p, idx) => (
              <li key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2">
                <div>
                  <div className="font-medium">{p.product_name}</div>
                  <div className="text-[11px] text-[#6b7280]">{p.quantity} units sold</div>
                </div>
                <div className="font-semibold text-[#166534]">₹{parseFloat(p.amount).toFixed(0)}</div>
              </li>
            ))}
            {(!summary_30d?.products || summary_30d.products.length === 0) && (
              <li className="text-gray-500 text-center py-4">No data available</li>
            )}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
             <div className="text-[14px] font-semibold">Recent Sales Activity</div>
             <Link to="/challans" className="text-[12px] text-[#2563eb] hover:underline font-medium">View All</Link>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px] border-collapse">
               <thead>
                 <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                   <th className="pb-2 font-medium">Challan #</th>
                   <th className="pb-2 font-medium">Customer</th>
                   <th className="pb-2 font-medium">Date</th>
                   <th className="pb-2 font-medium">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {recentSales.map((sale) => (
                   <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50">
                     <td className="py-2.5 font-medium">{sale.challan_number}</td>
                     <td className="py-2.5">{sale.customer_name || 'Walk-in'}</td>
                     <td className="py-2.5 text-[#6b7280]">{new Date(sale.created_at).toLocaleString()}</td>
                     <td className="py-2.5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          sale.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          sale.status === 'Draft' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {sale.status}
                        </span>
                     </td>
                   </tr>
                 ))}
                 {recentSales.length === 0 && (
                   <tr><td colSpan="4" className="text-center py-4 text-gray-500">No recent sales.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </>
  );

  const renderWarehouseDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[13px] text-blue-600 font-semibold uppercase">Total Products</div>
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Package size={16} /></div>
        </div>
        <div className="text-2xl font-bold text-gray-800">{reportData?.warehouse_dashboard_stats?.total_products || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[13px] text-red-600 font-semibold uppercase">Low Stock Items</div>
          <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={16} /></div>
        </div>
        <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
      </div>
      <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[13px] text-amber-600 font-semibold uppercase">Pending Dispatches</div>
          <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Truck size={16} /></div>
        </div>
        <div className="text-2xl font-bold text-gray-800">{reportData?.warehouse_dashboard_stats?.pending_dispatches || 0}</div>
      </div>
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[13px] text-emerald-600 font-semibold uppercase">Pending POs</div>
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FileText size={16} /></div>
        </div>
        <div className="text-2xl font-bold text-gray-800">0</div>
      </div>
    </div>
  );

  const renderAccountsDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm p-5 hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-blue-600 font-semibold uppercase">Total Invoices</div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><FileText size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">{reportData?.accounts_stats?.total_invoices || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100 shadow-sm p-5 hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-emerald-600 font-semibold uppercase">Payments Received</div>
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><IndianRupee size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(reportData?.accounts_stats?.payments_received || 0).toLocaleString()}</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm p-5 hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-red-600 font-semibold uppercase">Overdue Invoices</div>
            <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-red-600">{reportData?.accounts_stats?.overdue_invoices || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-100 shadow-sm p-5 hover:-translate-y-1 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div className="text-[13px] text-amber-600 font-semibold uppercase">Outstanding Bal</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><CreditCard size={16} /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800">₹{parseFloat(reportData?.accounts_stats?.outstanding_balance || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 mb-4">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4">
          <div className="text-[14px] font-semibold mb-4">Revenue Trend (Last 6 Months)</div>
          <div className="h-[220px] rounded-[16px] bg-white relative">
             <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm px-[18px] py-4 flex flex-col overflow-hidden h-[300px]">
          <div className="flex justify-between items-center mb-4">
             <div className="text-[14px] font-semibold">Recent Invoices</div>
             <Link to="/billing" className="text-[12px] text-[#2563eb] hover:underline font-medium">View All</Link>
          </div>
          <div className="overflow-y-auto pr-2 flex-1">
             <table className="w-full text-left text-[13px] border-collapse">
               <thead>
                 <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
                   <th className="pb-2 font-medium">Invoice #</th>
                   <th className="pb-2 font-medium">Amount</th>
                   <th className="pb-2 font-medium">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {recentInvoices.map((inv) => (
                   <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                     <td className="py-2.5 font-medium">{inv.invoice_number}</td>
                     <td className="py-2.5">₹{parseFloat(inv.total_amount).toFixed(0)}</td>
                     <td className="py-2.5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                     </td>
                   </tr>
                 ))}
                 {recentInvoices.length === 0 && (
                   <tr><td colSpan="3" className="text-center py-4 text-gray-500">No recent invoices.</td></tr>
                 )}
               </tbody>
             </table>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full text-[#111827] animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold mb-1">
          {role} Dashboard
        </h1>
        <p className="text-[13px] text-[#6b7280] mb-5">
          Track your business performance and key metrics.
        </p>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md shadow-sm flex items-start">
          <AlertTriangle className="text-red-500 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Low Stock Warning</h3>
            <p className="text-red-700 text-xs mt-1">
              You have <span className="font-bold">{lowStockCount}</span> product(s) currently below their minimum stock threshold. 
              <Link to="/products" className="ml-2 text-red-600 hover:text-red-800 underline">View Products</Link>
            </p>
          </div>
        </div>
      )}

      {role === 'Admin' && renderAdminDashboard()}
      {role === 'Sales' && renderSalesDashboard()}
      {role === 'Warehouse' && renderWarehouseDashboard()}
      {role === 'Accounts' && renderAccountsDashboard()}
      
    </div>
  );
};

export default Dashboard;
