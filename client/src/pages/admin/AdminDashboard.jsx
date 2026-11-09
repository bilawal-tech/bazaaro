import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiDollarSign, FiPackage, FiShoppingBag, FiLayers, FiArrowRight, FiActivity, FiUsers } from 'react-icons/fi';
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

function AdminDashboard() {
  const dispatch       = useDispatch();
  const orders         = useSelector(selectOrders) || []; // Fallback empty array to avoid potential crash
  const totalOrders    = useSelector(selectTotalOrders);
  const totalRevenue    = useSelector(selectTotalRevenue);
  const totalProducts  = useSelector(selectTotalProducts);
  const categories     = useSelector(selectCategories) || [];

  useEffect(() => {
    dispatch(getAllOrders({ limit: 5 }));
    dispatch(getAllProducts({ limit: 1 }));
    dispatch(getAllCategories());
  }, [dispatch]);

  // ── 📊 Stats Data Config Aligned with New Clean Emerald Theme ──
  const stats = [
    { label: 'Total Revenue',  value: `Rs. ${totalRevenue?.toLocaleString() || 0}`, icon: <FiDollarSign size={20} />, bg: 'bg-[#1B4332]/5', text: 'text-[#1B4332]' },
    { label: 'Total Orders',   value: totalOrders || 0,                            icon: <FiPackage size={20} />,   bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Total Products', value: totalProducts || 0,                          icon: <FiShoppingBag size={20} />, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Categories',     value: categories?.length || 0,                     icon: <FiLayers size={20} />,   bg: 'bg-rose-50', text: 'text-rose-600' },
  ];

  const quickLinks = [
    { label: 'Products Management', path: '/admin/products', icon: <FiShoppingBag size={18} />, desc: 'Add, update or remove store inventory' },
    { label: 'Orders Fulfilment',   path: '/admin/orders',   icon: <FiPackage size={18} />,     desc: 'Track shipping pipelines and status updates' },
    { label: 'Registered Clients',    path: '/admin/users',    icon: <FiUsers size={18} />,       desc: 'View user permissions and account database' },
  ];

  return (
    <div className="min-h-screen py-12 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header Heading section */}
        <div className="mb-10 flex items-center justify-between border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-[#1B4332] text-2xl font-black tracking-tight flex items-center gap-2">
              <FiActivity className="text-[#2D6A4F]" size={24} /> Admin Overview
            </h1>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
              Real-time synchronization and system metrics control room
            </p>
          </div>
          <span className="hidden sm:inline-block text-[10px] font-black bg-[#1B4332] text-white px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm shadow-[#1B4332]/10">
            System Active
          </span>
        </div>

        {/* ── 📊 Stats Dashboard Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text}`}>
                  {stat.icon}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
              </div>
              <p className="text-slate-900 text-2xl font-black tracking-tight mb-1 tabular-nums">
                {stat.value}
              </p>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── 🚀 Actionable Quick Navigation Links ── */}
        <div className="mb-10">
          <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
            System Control Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="group rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:border-[#2D6A4F] hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:bg-[#1B4332]/5 group-hover:text-[#1B4332] transition duration-200">
                    {link.icon}
                  </span>
                  <h3 className="text-slate-800 font-black text-sm group-hover:text-[#2D6A4F] transition duration-200">
                    {link.label}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium leading-relaxed">
                    {link.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[11px] font-black text-[#2D6A4F] uppercase tracking-wider opacity-80 group-hover:opacity-100 transition duration-200">
                  Manage Now <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 🧾 Recent Orders Table/Panel View ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-slate-900 font-black tracking-tight text-sm">
                Recent Orders
              </h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                Latest customer purchases incoming stack
              </p>
            </div>
            <Link 
              to="/admin/orders" 
              className="text-[#2D6A4F] text-xs font-black hover:text-[#1B4332] transition flex items-center gap-0.5 uppercase tracking-wider"
            >
              View All Pipeline →
            </Link>
          </div>

          <div className="divide-y divide-slate-50 px-6">
            {orders && orders.length > 0 ? (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-4 group hover:bg-slate-50/40 px-2 -mx-2 rounded-xl transition duration-150"
                >
                  <div>
                    <p className="text-[#1B4332] text-sm font-black tracking-tight">
                      #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-slate-500 font-medium text-xs mt-0.5">
                      {order.user?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900 font-black text-sm tabular-nums">
                      Rs. {order.totalPrice?.toLocaleString()}
                    </p>
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                      {order.orderStatus || 'Processing'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 font-medium text-xs">No orders registered in the system yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;