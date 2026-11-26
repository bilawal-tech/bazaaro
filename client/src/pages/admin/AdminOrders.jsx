import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  getAllOrders,
  updateOrderStatus,
  selectOrders,
  selectOrderLoading,
} from '../../redux/slices/orderSlice';
import Loader from '../../components/common/Loader';
import { AdminPage, AdminHeader, Panel, DataTable, EmptyRow } from '../../components/admin/AdminUI';

const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];
const label = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function AdminOrders() {
  const dispatch = useDispatch();
  const orders   = useSelector(selectOrders) || [];
  const loading  = useSelector(selectOrderLoading);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(getAllOrders({ limit: 50, status: statusFilter }));
  }, [dispatch, statusFilter]);

  const handleStatusChange = async (orderId, newStatus) => {
    const result = await dispatch(updateOrderStatus({ id: orderId, status: newStatus }));
    // Error ka toast Toast.jsx dikha deta hai (server ki asli wajah ke saath)
    if (!updateOrderStatus.rejected.match(result)) toast.success('Status updated');
  };

  if (loading) return <Loader />;

  return (
    <AdminPage>
      <AdminHeader
        title="Orders"
        subtitle="Review orders and update their status."
        actions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
          </select>
        }
      />

      <Panel flush>
        <DataTable
          minWidth={0}
          columns={[
            { label: 'Order', hideOnMobile: true }, { label: 'Customer' }, { label: 'Total' }, { label: 'Payment', hideOnMobile: true }, { label: 'Status' },
          ]}
        >
          {orders.length > 0 ? orders.map((order) => (
            <tr key={order._id} className="hover:bg-slate-50">
              <td className="hidden px-4 py-3 font-mono text-sm font-medium text-slate-900 sm:table-cell">#{order._id.slice(-8).toUpperCase()}</td>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{order.user?.name || 'Deleted user'}</p>
                <p className="hidden text-xs text-slate-500 sm:block">{order.user?.email || '—'}</p>
                <p className="font-mono text-xs text-slate-500 sm:hidden">#{order._id.slice(-8).toUpperCase()}</p>
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-medium tabular-nums text-slate-900">Rs. {order.totalPrice?.toLocaleString()}</td>
              <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">{order.paymentMethod || 'COD'}</td>
              <td className="px-4 py-3">
                <select
                  value={order.orderStatus}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  aria-label={`Status of order ${order._id.slice(-8)}`}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/20"
                >
                  {statusOptions.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
              </td>
            </tr>
          )) : <EmptyRow cols={5} text="No orders match this filter." />}
        </DataTable>
      </Panel>
    </AdminPage>
  );
}

export default AdminOrders;
