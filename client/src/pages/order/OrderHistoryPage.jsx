import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getMyOrders,
  cancelOrder,
  selectOrders,
  selectOrderLoading,
  selectTotalPages,
  selectCurrentPage,
} from '../../redux/slices/orderSlice';
import Loader from '../../components/common/Loader';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { FiPackage } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUrl';

function OrderHistoryPage() {
  const dispatch    = useDispatch();
  const orders      = useSelector(selectOrders);
  const loading     = useSelector(selectOrderLoading);
  const totalPages  = useSelector(selectTotalPages);
  const currentPage = useSelector(selectCurrentPage);

  const [page, setPage] = useState(1);
  
  // Cancel confirm popup ki state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ── Fetch Orders ───────────────────────────
  useEffect(() => {
    dispatch(getMyOrders({ page, limit: 5 }));
  }, [dispatch, page]);

  // ── Cancel popup kholo ─────────────────────
  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  // ── Cancel confirm ─────────────────────────
  const confirmCancelOrder = () => {
    if (selectedOrderId) {
      dispatch(cancelOrder(selectedOrderId));
      setIsModalOpen(false);
      setSelectedOrderId(null);
    }
  };

  if (loading) return <Loader />;

  if (!orders || orders.length === 0) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-800">
          <FiPackage size={28} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">No orders yet</h1>
        <p className="mt-2 max-w-sm text-ink-soft">When you place an order, it will show up here.</p>
        <Link to="/shop" className="btn-primary btn-lg mt-6">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="bg-surface">
      <div className="container-page max-w-4xl py-8 sm:py-12">

        <div className="mb-6">
          <h1 className="page-title">My orders</h1>
          <p className="mt-1 text-sm text-ink-soft">Track and manage your purchases</p>
        </div>

        <div className="flex flex-col gap-5">
          {orders.map((order) => (
            <article key={order._id} className="card overflow-hidden">

              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-4">
                <dl className="flex flex-wrap gap-x-8 gap-y-2">
                  <div>
                    <dt className="text-xs text-ink-faint">Order</dt>
                    <dd className="text-sm font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-faint">Placed on</dt>
                    <dd className="text-sm text-ink">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-faint">Total</dt>
                    <dd className="text-sm font-semibold text-ink">Rs. {order.totalPrice.toLocaleString()}</dd>
                  </div>
                </dl>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              {/* Items */}
              <ul className="divide-y divide-line px-5">
                {order.orderItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-4 py-4">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-lg border border-line bg-surface object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                      {(item.color || item.size) && (
                        <p className="mt-0.5 text-xs text-ink-soft">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
                      )}
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {item.quantity} × Rs. {item.price.toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {order.orderNote && (
                <p className="mx-5 mb-4 rounded-lg bg-surface px-3 py-2 text-xs text-ink-soft">
                  <span className="font-medium text-ink">Your note: </span>{order.orderNote}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3">
                <Link to={`/orders/${order._id}`} className="btn-secondary btn-sm">View details</Link>
                {order.orderStatus?.toLowerCase() === 'processing' && (
                  <button
                    type="button"
                    onClick={() => openCancelModal(order._id)}
                    className="btn-sm btn rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <Pagination page={currentPage} totalPages={totalPages} onChange={(p) => setPage(Math.max(1, Math.min(totalPages, p)))} />
      </div>

      <ConfirmDialog
        open={isModalOpen}
        title="Cancel this order?"
        message="This cannot be undone. The items will go back into stock."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep order"
        danger
        onConfirm={confirmCancelOrder}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default OrderHistoryPage;
