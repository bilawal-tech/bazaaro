import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiFilter } from 'react-icons/fi';
import {
  getAllOrders,
  updateOrderStatus,
  selectOrders,
  selectOrderLoading,
} from '../../redux/slices/orderSlice';
import Loader from '../../components/common/Loader';

function AdminOrders() {
  const dispatch = useDispatch();
  const orders   = useSelector(selectOrders) || [];
  const loading  = useSelector(selectOrderLoading);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(getAllOrders({ limit: 50, status: statusFilter }));
  }, [dispatch, statusFilter]);

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
  };

  const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];

  // Aligned with premium soft context colors
  const getStatusStyles = (status) => {
    const schemas = {
      processing: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
      shipped:    { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
      delivered:  { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
      cancelled:  { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    };
    return schemas[status] || { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' };
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen py-12 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── HEADER PANEL ── */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 gap-4">
          <div>
            <h1 className="text-[#1B4332] text-2xl font-black tracking-tight flex items-center gap-2">
              <FiPackage className="text-[#2D6A4F]" size={24} /> Order Fulfilment
            </h1>
            <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
              Track transaction histories and update pipelines statuses
            </p>
          </div>

          {/* Filter dropdown design */}
          <div className="relative flex items-center self-start sm:self-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              <FiFilter size={14} />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2 text-xs font-black bg-white border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-[#2D6A4F] transition cursor-pointer appearance-none shadow-sm"
            >
              <option value="">All Pipelines Statuses</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── ORDERS TABLE VIEW ── */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4 pl-6">Order Reference</th>
                  <th className="p-4">Client Customer</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 pr-6">Pipeline Action Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                {orders && orders.length > 0 ? (
                  orders.map((order) => {
                    const currentStyle = getStatusStyles(order.orderStatus);
                    return (
                      <tr key={order._id} className="hover:bg-slate-50/40 transition">
                        
                        {/* Order Identity token hash */}
                        <td className="p-4 pl-6 font-mono font-black text-[#1B4332] tracking-wider">
                          #{order._id.slice(-8).toUpperCase()}
                        </td>

                        {/* Customer profile reference details */}
                        <td className="p-4">
                          <p className="text-slate-900 font-black text-sm tracking-tight">
                            {order.user?.name || 'Walk-In Customer'}
                          </p>
                          <p className="text-[10px] text-slate-400">{order.user?.email || 'N/A'}</p>
                        </td>

                        {/* Cost transaction data logs */}
                        <td className="p-4 font-black text-slate-900 tabular-nums">
                          Rs. {order.totalPrice?.toLocaleString()}
                        </td>

                        {/* Payment gateways tags configurations layout */}
                        <td className="p-4">
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-200/40 rounded text-slate-600 uppercase tracking-wide">
                            {order.paymentMethod || 'COD'}
                          </span>
                        </td>

                        {/* Status pipelines modification selections inputs dropdowns */}
                        <td className="p-4 pr-6">
                          <select
                            value={order.orderStatus}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider outline-none border transition cursor-pointer appearance-none ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`}
                          >
                            {statusOptions.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-slate-400 text-xs">
                      No system purchase records match the selected logs parameters filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AdminOrders;