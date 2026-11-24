import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  getSingleOrder,
  cancelOrder,
  clearOrder,
  selectOrder,
  selectOrderLoading,
  selectOrderError,
} from '../../redux/slices/orderSlice';
import { selectUser } from '../../redux/slices/authSlice';
import Loader from '../../components/common/Loader';
import OrderStatusBadge from '../../components/common/OrderStatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { STATUS_META } from '../../utils/orderStatus';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { getImageUrl } from '../../utils/imageUrl';

const STEPS = ['processing', 'shipped', 'delivered'];

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();

  const order = useSelector(selectOrder);
  const loading = useSelector(selectOrderLoading);
  const error = useSelector(selectOrderError);
  const authUser = useSelector(selectUser);
  const myId = authUser?.user?._id || authUser?._id;

  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    dispatch(getSingleOrder(id));
    return () => {
      dispatch(clearOrder());
    };
  }, [dispatch, id]);

  // Redux mein pichla order bacha ho sakta hai; sirf isi id ka order dikhao
  const current = order && order._id === id ? order : null;

  if (!current) {
    if (loading) return <Loader />;
    return (
      <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-xl font-semibold">Order not found</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-soft">
          {error || 'This order does not exist or you do not have access to it.'}
        </p>
        <Link to="/orders" className="btn-primary mt-6">Back to orders</Link>
      </div>
    );
  }

  const status = current.orderStatus?.toLowerCase() || 'processing';
  const isOwner = current.user?._id === myId;
  const canCancel = isOwner && status === 'processing';
  const stepIndex = STEPS.indexOf(status);

  const confirmCancel = async () => {
    setShowCancel(false);
    const res = await dispatch(cancelOrder(current._id));
    if (res.error) {
      toast.error(res.payload || 'Could not cancel order');
    } else {
      toast.success('Order cancelled');
    }
  };

  return (
    <div className="bg-surface">
      <div className="container-page max-w-4xl py-8 sm:py-12">

        <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-brand-700">
          <FiArrowLeft size={16} /> Back to orders
        </Link>

        {/* Header */}
        <div className="mb-6 mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">Order #{current._id.slice(-8).toUpperCase()}</h1>
            <p className="mt-1 text-sm text-ink-soft">Placed on {formatDateTime(current.createdAt)}</p>
          </div>
          <OrderStatusBadge status={status} />
        </div>

        {/* Progress */}
        {status === 'cancelled' ? (
          <div role="status" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            This order was cancelled{current.cancelledAt ? ` on ${formatDateTime(current.cancelledAt)}` : ''}.
          </div>
        ) : (
          <div className="card mb-6 p-5">
            <ol className="flex items-center">
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <li key={step} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          done ? 'bg-brand-800 text-white' : 'bg-surface text-ink-faint'
                        }`}
                      >
                        {done ? <FiCheck size={16} /> : i + 1}
                      </span>
                      <span className={`mt-1.5 text-xs font-medium ${done ? 'text-brand-800' : 'text-ink-faint'}`}>
                        {STATUS_META[step].label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <span className={`mx-2 mb-5 h-0.5 flex-1 ${i < stepIndex ? 'bg-brand-800' : 'bg-line'}`} />
                    )}
                  </li>
                );
              })}
            </ol>
            {current.deliveredAt && (
              <p className="mt-3 text-sm text-ink-soft">Delivered on {formatDateTime(current.deliveredAt)}</p>
            )}
          </div>
        )}

        {/* Items */}
        <section className="card mb-6 p-5 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold">Items</h2>
          <ul className="divide-y divide-line">
            {current.orderItems.map((item, index) => (
              <li key={item._id || index} className="flex items-center gap-4 py-4">
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="h-16 w-16 shrink-0 rounded-lg border border-line bg-surface object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${item.product}`} className="block truncate text-sm font-medium text-ink hover:text-brand-700">
                    {item.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="mt-0.5 text-xs text-ink-soft">{[item.color, item.size].filter(Boolean).join(' · ')}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-soft">{item.quantity} × {money(item.price)}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{money(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Shipping + payment */}
          <section className="card p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Delivery address</h2>
            <address className="text-sm not-italic leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">{current.shippingAddress?.fullName}</p>
              <p>{current.shippingAddress?.street}</p>
              <p>
                {current.shippingAddress?.city}
                {current.shippingAddress?.zip ? `, ${current.shippingAddress.zip}` : ''}
              </p>
              <p>{current.shippingAddress?.phone}</p>
            </address>

            <h2 className="mb-2 mt-5 text-lg font-semibold">Payment</h2>
            <p className="text-sm text-ink-soft">
              {current.PaymentMethod} · <span className="font-medium text-ink">{current.PaymentStatus}</span>
              {current.paidAt ? ` (${formatDateTime(current.paidAt)})` : ''}
            </p>
            {isOwner && current.PaymentMethod === 'Credit Card' && status === 'processing' &&
              ['Pending', 'Failed'].includes(current.PaymentStatus) && (
              <Link to={`/pay/${current._id}`} className="btn-primary btn-sm mt-3">Pay now</Link>
            )}

            {!isOwner && current.user && (
              <>
                <h2 className="mb-2 mt-5 text-lg font-semibold">Customer</h2>
                <p className="text-sm text-ink-soft">{current.user.name} · {current.user.email}</p>
              </>
            )}
            {!current.user && (
              <p className="mt-5 text-xs text-ink-faint">Customer account has been deleted.</p>
            )}
          </section>

          {/* Summary */}
          <section className="card self-start p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Items</dt>
                <dd className="font-medium text-ink">{money(current.itemsPrice)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Shipping</dt>
                <dd className="font-medium text-ink">{current.shippingPrice > 0 ? money(current.shippingPrice) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="text-lg font-bold text-brand-800">{money(current.totalPrice)}</dd>
              </div>
            </dl>

            {current.orderNote && (
              <p className="mt-4 rounded-lg bg-surface px-3 py-2 text-xs text-ink-soft">
                <span className="font-medium text-ink">Note: </span>{current.orderNote}
              </p>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancel(true)}
                className="btn mt-5 w-full rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >
                Cancel order
              </button>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={showCancel}
        title="Cancel this order?"
        message="This cannot be undone. The items will go back into stock."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep order"
        danger
        onConfirm={confirmCancel}
        onClose={() => setShowCancel(false)}
      />
    </div>
  );
}

export default OrderDetailPage;
