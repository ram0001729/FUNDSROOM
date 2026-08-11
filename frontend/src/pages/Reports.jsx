import React, { useState, useEffect } from 'react';
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

const Reports = ({ defaultMetric = 'sales' }) => {
  const [data, setData] = useState({
    stats: {},
    summary_30d: { products: [] },
    chart: { month_labels: [], month_values: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  const [metric, setMetric] = useState(defaultMetric);

  const { stats, summary_30d, chart } = data;

  const chartData = {
    labels: chart?.month_labels || [],
    datasets: [
      {
        label: metric === 'sales' ? 'Sales (₹)' : metric === 'profit' ? 'Profit (₹)' : 'Orders',
        data: metric === 'sales' ? chart?.month_sales : metric === 'profit' ? chart?.month_profit : chart?.month_orders,
        borderColor: metric === 'profit' ? '#16a34a' : metric === 'orders' ? '#9333ea' : '#2563eb',
        backgroundColor: metric === 'profit' ? 'rgba(22, 163, 74, 0.1)' : metric === 'orders' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: metric === 'profit' ? '#16a34a' : metric === 'orders' ? '#9333ea' : '#2563eb',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleFont: { size: 13 },
        bodyFont: { size: 14 },
        padding: 12,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6', drawBorder: false },
        ticks: { color: '#6b7280', font: { size: 11 } }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: '#6b7280', font: { size: 11 } }
      }
    }
  };

  return (
    <div className="w-full text-[#111827] animate-fade-in max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold mb-1">Reports & Growth</h1>
        <p className="text-[13px] text-[#6b7280]">Key metrics and 30-day product performance.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[14px]">
        {/* Sales (30 Days) */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-[18px]">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Sales (Last 30 Days)</div>
          <div className="text-[20px] font-bold text-[#111827]">
            ₹{parseFloat(stats.total_sales || 0).toFixed(2)}
          </div>
          <div className={`text-[12px] mt-1.5 font-medium flex items-center ${stats.growth_sales_30d >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {stats.growth_sales_30d >= 0 ? '↗' : '↘'} {Math.abs(stats.growth_sales_30d || 0).toFixed(1)}% vs prev 30d
          </div>
        </div>

        {/* Profit (30 Days) */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-[18px]">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Profit (Last 30 Days)</div>
          <div className="text-[20px] font-bold text-[#111827]">
            ₹{parseFloat(stats.total_profit || 0).toFixed(2)}
          </div>
          <div className={`text-[12px] mt-1.5 font-medium flex items-center ${stats.growth_profit_30d >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
            {stats.growth_profit_30d >= 0 ? '↗' : '↘'} {Math.abs(stats.growth_profit_30d || 0).toFixed(1)}% vs prev 30d
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-[18px]">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Orders (Last 30 Days)</div>
          <div className="text-[20px] font-bold text-[#111827]">
            {stats.total_orders || 0}
          </div>
          <div className="text-[12px] text-[#6b7280] mt-1.5">Confirmed invoices</div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-[18px]">
          <div className="text-[12px] text-[#6b7280] mb-1.5 font-medium">Avg Order Value</div>
          <div className="text-[20px] font-bold text-[#111827]">
            ₹{parseFloat(stats.avg_order_value || 0).toFixed(2)}
          </div>
          <div className="text-[12px] text-[#6b7280] mt-1.5">Revenue per order</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm p-5 flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[14px] font-semibold text-[#111827]">Sales Trend (Last 6 Months)</h3>
            <select 
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="text-[12px] border border-[#e5e7eb] rounded-md px-2 py-1 bg-[#f9fafb] text-[#374151] focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="sales">Revenue</option>
              <option value="profit">Profit</option>
              <option value="orders">Orders</option>
            </select>
          </div>
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-[#6b7280] text-[13px]">Loading chart...</div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-[16px] border border-[#e5e7eb] shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-[#e5e7eb]">
            <h3 className="text-[14px] font-semibold text-[#111827]">Top Products (Last 30 Days)</h3>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f9fafb] sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb]">Product</th>
                  <th className="p-3 text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb] text-right">Sold Qty</th>
                  <th className="p-3 text-[11px] uppercase text-[#6b7280] font-medium border-b border-[#e5e7eb] text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="p-6 text-center text-[#6b7280]">Loading products...</td></tr>
                ) : summary_30d?.products?.length === 0 ? (
                  <tr><td colSpan="3" className="p-6 text-center text-[#6b7280]">No sales data available.</td></tr>
                ) : (
                  summary_30d.products.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#f9fafb] border-b border-[#e5e7eb] last:border-0">
                      <td className="p-3">
                        <div className="font-medium text-[#111827]">{p.product_name}</div>
                        <div className="text-[11px] text-[#6b7280]">{p.category || 'N/A'}</div>
                      </td>
                      <td className="p-3 text-right font-medium">{p.quantity}</td>
                      <td className="p-3 text-right font-medium text-[#166534] bg-[#f0fdf4] bg-opacity-50">
                        {parseFloat(p.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
