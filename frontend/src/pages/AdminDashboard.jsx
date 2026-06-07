import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { HiOutlineCurrencyDollar, HiOutlineShoppingBag, HiOutlineUsers, HiOutlineCube } from 'react-icons/hi2';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PIE_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(setStats)
      .catch(() => setStats(DEMO_STATS))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="py-32" />;
  if (!stats) return null;

  const cards = [
    { label: 'Total Revenue', value: `$${(stats.revenue || 0).toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: 'bg-green-50 text-green-600' },
    { label: 'Orders', value: stats.orders_count || 0, icon: HiOutlineShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Customers', value: stats.customers_count || 0, icon: HiOutlineUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'Products', value: stats.products_count || 0, icon: HiOutlineCube, color: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your store performance</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue over time */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Revenue (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.revenue_chart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status */}
        <div className="card p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.orders_by_status || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="count"
                nameKey="status"
              >
                {(stats.orders_by_status || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="card p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Products by Sales</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.top_products || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
              <Bar dataKey="sales" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="card mt-6 overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(stats.recent_orders || []).map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 font-medium">#{o.id.slice(-6)}</td>
                  <td className="px-6 py-4 text-gray-600">{o.customer}</td>
                  <td className="px-6 py-4 font-semibold">${o.total.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-700'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const DEMO_STATS = {
  revenue: 24850,
  orders_count: 156,
  customers_count: 89,
  products_count: 47,
  revenue_chart: [
    { date: 'Mon', revenue: 3200 },
    { date: 'Tue', revenue: 4100 },
    { date: 'Wed', revenue: 2800 },
    { date: 'Thu', revenue: 5200 },
    { date: 'Fri', revenue: 3900 },
    { date: 'Sat', revenue: 4600 },
    { date: 'Sun', revenue: 3050 },
  ],
  orders_by_status: [
    { status: 'Delivered', count: 78 },
    { status: 'Shipped', count: 34 },
    { status: 'Processing', count: 22 },
    { status: 'Pending', count: 15 },
    { status: 'Cancelled', count: 7 },
  ],
  top_products: [
    { name: 'Wireless Headphones', sales: 89 },
    { name: 'Fitness Watch', sales: 76 },
    { name: 'Running Shoes', sales: 64 },
    { name: 'Leather Bag', sales: 52 },
    { name: 'Desk Lamp', sales: 41 },
  ],
  recent_orders: [
    { id: 'ord_abc12345', customer: 'Alice Johnson', total: 249.98, status: 'delivered', date: 'Jun 6' },
    { id: 'ord_def67890', customer: 'Bob Smith', total: 129.99, status: 'shipped', date: 'Jun 5' },
    { id: 'ord_ghi11223', customer: 'Carol White', total: 89.00, status: 'processing', date: 'Jun 5' },
    { id: 'ord_jkl44556', customer: 'Dave Brown', total: 199.99, status: 'pending', date: 'Jun 4' },
    { id: 'ord_mno77889', customer: 'Eve Davis', total: 34.99, status: 'delivered', date: 'Jun 3' },
  ],
};
