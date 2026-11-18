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
import { getImageUrl } from '../../utils/imageUrl';

const STATUS_STYLES = {
  processing: { bg: '#E0F2FE', text: '#0369A1', label: 'Processing' },
  shipped:    { bg: '#FEF3C7', text: '#B45309', label: 'Shipped'    },
  delivered:  { bg: '#D1FAE5', text: '#065F46', label: 'Delivered'  },
  cancelled:  { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled'  },
};

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-4">
          <h2 className="text-slate-800 text-xl font-black mb-2">Order not found</h2>
          <p className="text-slate-500 text-sm mb-6">
            {error || 'This order does not exist or you do not have access to it.'}
          </p>
          <Link
            to="/orders"
            className="inline-block bg-[#1B4332] hover:bg-[#132A20] text-white text-xs font-black px-6 py-3 rounded-xl uppercase tracking-widest"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const status = current.orderStatus?.toLowerCase() || 'processing';
  const style = STATUS_STYLES[status] || STATUS_STYLES.processing;
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
    <div className="min-h-screen py-16 bg-slate-50 text-slate-800 antialiased">
      <div className="max-w-4xl mx-auto px-4">

        <Link
          to="/orders"
          className="text-xs font-bold text-slate-500 hover:text-[#1B4332] uppercase tracking-wider"
        >
          ← Back to Orders
        </Link>

        {/* Header */}
        <div className="mt-4 mb-8 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[#1B4332] text-2xl font-black tracking-tight">
              Order #{current._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-slate-500 text-xs font-bold mt-1">
              Placed on {formatDateTime(current.createdAt)}
            </p>
          </div>
          <span
            className="text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
            style={{ background: style.bg, color: style.text }}
          >
            {style.label}
          </span>
        </div>

        {/* Progress */}
        {status === 'cancelled' ? (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold">
            This order was cancelled
            {current.cancelledAt ? ` on ${formatDateTime(current.cancelledAt)}` : ''}.
          </div>
        ) : (
          <div className="mb-6 p-5 rounded-xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center">
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                          done ? 'bg-[#1B4332] text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <span
                        className={`mt-1 text-[10px] font-black uppercase tracking-wider ${
                          done ? 'text-[#1B4332]' : 'text-slate-400'
                        }`}
                      >
                        {STATUS_STYLES[step].label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mb-4 ${
                          i < stepIndex ? 'bg-[#1B4332]' : 'bg-slate-100'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {current.deliveredAt && (
              <p className="text-xs text-slate-500 font-bold mt-3">
                Delivered on {formatDateTime(current.deliveredAt)}
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider mb-4">
            Items
          </h2>
          <div className="flex flex-col gap-4">
            {current.orderItems.map((item, index) => (
              <div
                key={item._id || index}
                className="flex items-center gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0"
              >
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product}`}
                    className="text-slate-800 text-sm font-black hover:text-[#2D6A4F] truncate block"
                  >
                    {item.name}
                  </Link>
                  {(item.color || item.size) && (
                    <p className="text-slate-400 text-xs font-bold mt-0.5">
                      {[item.color, item.size].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  <p className="text-slate-400 text-xs font-bold mt-0.5">
                    {item.quantity} × {money(item.price)}
                  </p>
                </div>
                <p className="text-slate-800 text-sm font-black tabular-nums">
                  {money(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Shipping + payment */}
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider mb-3">
              Shipping Address
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed">
              <p className="font-black text-slate-800">{current.shippingAddress?.fullName}</p>
              <p>{current.shippingAddress?.street}</p>
              <p>
                {current.shippingAddress?.city}
                {current.shippingAddress?.zip ? `, ${current.shippingAddress.zip}` : ''}
              </p>
              <p>{current.shippingAddress?.phone}</p>
            </div>

            <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider mt-5 mb-2">
              Payment
            </h2>
            <p className="text-sm text-slate-600">
              {current.PaymentMethod} ·{' '}
              <span className="font-black">{current.PaymentStatus}</span>
              {current.paidAt ? ` (${formatDateTime(current.paidAt)})` : ''}
            </p>

            {!isOwner && current.user && (
              <>
                <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider mt-5 mb-2">
                  Customer
                </h2>
                <p className="text-sm text-slate-600">
                  {current.user.name} · {current.user.email}
                </p>
              </>
            )}
            {!current.user && (
              <p className="text-xs text-slate-400 font-bold mt-5">
                Customer account has been deleted.
              </p>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-xl bg-white border border-slate-100 shadow-sm p-6">
            <h2 className="text-slate-800 text-sm font-black uppercase tracking-wider mb-3">
              Summary
            </h2>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Items</span>
                <span className="tabular-nums">{money(current.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="tabular-nums">
                  {current.shippingPrice > 0 ? money(current.shippingPrice) : 'Free'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-base font-black text-[#1B4332]">
                <span>Total</span>
                <span className="tabular-nums">{money(current.totalPrice)}</span>
              </div>
            </div>

            {current.orderNote && (
              <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg text-xs text-slate-600">
                <span className="font-black text-[#1B4332] uppercase tracking-wider block mb-0.5 text-[10px]">
                  Note
                </span>
                {current.orderNote}
              </div>
            )}

            {canCancel && (
              <button
                onClick={() => setShowCancel(true)}
                className="mt-5 w-full text-xs font-black px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition uppercase tracking-wider"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel confirm */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowCancel(false)}
          />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative z-10">
            <h3 className="text-center text-slate-800 text-lg font-black mb-2">
              Cancel this order?
            </h3>
            <p className="text-center text-slate-500 text-xs font-medium leading-relaxed mb-6">
              This cannot be undone. The items will go back into stock.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancel(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black py-3 rounded-xl uppercase tracking-wider"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancel}
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetailPage;
