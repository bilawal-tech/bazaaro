import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiDollarSign, FiPackage, FiShoppingBag, FiLayers, FiUsers, FiChevronRight } from 'react-icons/fi';
import {
  getAllOrders,
  selectOrders,
  selectTotalOrders,
  selectTotalRevenue,
} from '../../redux/slices/orderSlice';
import {
  getAllProducts,
  selectTotalProducts,
} from '../../redux/slices/productSlice';
import { selectCategories, getAllCategories } from '../../redux/slices/categorySlice';
import { AdminPage, AdminHeader, StatCard, Panel } from '../../components/admin/AdminUI';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';

function AdminDashboard() {
  const dispatch       = useDispatch();
  const orders         = useSelector(selectOrders) || [];
  const totalOrders    = useSelector(selectTotalOrders);
  const totalRevenue   = useSelector(selectTotalRevenue);
  const totalProducts  = useSelector(selectTotalProducts);
  const categories     = useSelector(selectCategories) || [];

  useEffect(() => {
    dispatch(getAllOrders({ limit: 5 }));
    dispatch(getAllProducts({ limit: 1 }));
    dispatch(getAllCategories());
  }, [dispatch]);

  const stats = [
    { label: 'Revenue',    value: `Rs. ${totalRevenue?.toLocaleString() || 0}`, icon: <FiDollarSign size={18} /> },
    { label: 'Orders',     value: totalOrders || 0,                             icon: <FiPackage size={18} /> },
    { label: 'Products',   value: totalProducts || 0,                           icon: <FiShoppingBag size={18} /> },
    { label: 'Categories', value: categories.length || 0,                       icon: <FiLayers size={18} /> },
  ];

  const quickLinks = [
    { label: 'Products', path: '/admin/products', icon: <FiShoppingBag size={16} />, desc: 'Add, edit or remove products' },
    { label: 'Orders',   path: '/admin/orders',   icon: <FiPackage size={16} />,     desc: 'Update order status' },
    { label: 'Users',    path: '/admin/users',    icon: <FiUsers size={16} />,       desc: 'View and manage accounts' },
  ];

  return (
    <AdminPage>
      <AdminHeader title="Dashboard" subtitle="A quick look at your store." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {quickLinks.map((l) => (
          <Link
            key={l.path}
            to={l.path}
            className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">{l.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-900">{l.label}</span>
              <span className="block truncate text-xs text-slate-500">{l.desc}</span>
            </span>
            <FiChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>

      <Panel
        title="Recent orders"
        flush
        action={<Link to="/admin/orders" className="text-sm font-medium text-brand-700 hover:text-brand-800">View all</Link>}
      >
        {orders.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <li key={order._id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-medium text-slate-900">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="truncate text-xs text-slate-500">{order.user?.name || 'Deleted user'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-sm font-medium tabular-nums text-slate-900">Rs. {order.totalPrice?.toLocaleString()}</p>
                  <OrderStatusBadge status={order.orderStatus} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No orders yet.</p>
        )}
      </Panel>
    </AdminPage>
  );
}

export default AdminDashboard;
