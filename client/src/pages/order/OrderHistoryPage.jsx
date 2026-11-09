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

function OrderHistoryPage() {
  const dispatch    = useDispatch();
  const orders      = useSelector(selectOrders);
  const loading     = useSelector(selectOrderLoading);
  const totalPages  = useSelector(selectTotalPages);
  const currentPage = useSelector(selectCurrentPage);

  const [page, setPage] = useState(1);
  
  // 💡 States for tracking custom confirmation popup modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // ── Fetch Orders ───────────────────────────
  useEffect(() => {
    dispatch(getMyOrders({ page, limit: 5 }));
  }, [dispatch, page]);

  // ── Trigger Custom Popup ───────────────────
  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalOpen(true);
  };

  // ── Execute Cancellation ───────────────────
  const confirmCancelOrder = () => {
    if (selectedOrderId) {
      dispatch(cancelOrder(selectedOrderId));
      setIsModalOpen(false);
      setSelectedOrderId(null);
    }
  };

  // ── Status Badge Colors Aligned with Backend Case-Sensitivity ──
  const getStatusStyle = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'processing';
    const styles = {
      processing: { bg: '#E0F2FE', text: '#0369A1', label: 'Processing' },
      shipped:    { bg: '#FEF3C7', text: '#B45309', label: 'Shipped'    },
      delivered:  { bg: '#D1FAE5', text: '#065F46', label: 'Delivered'  },
      cancelled:  { bg: '#FEE2E2', text: '#991B1B', label: 'Cancelled'  },
    };
    return styles[normalizedStatus] || styles.processing;
  };

  if (loading) return <Loader />;

  // ── Clean & Elegant Empty State ────────────────────────────
  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 antialiased">
        <div className="text-center max-w-sm px-4">
          <div className="w-16 h-16 bg-[#1B4332]/10 text-[#1B4332] rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            📦
          </div>
          <h2 className="text-slate-800 text-xl font-black tracking-tight mb-2">
            No orders placed yet
          </h2>
          <p className="text-slate-500 text-sm mb-6 font-medium">
            Looks like you haven't made your choice yet. Explore our top products and start filling your collection!
          </p>
          <Link
            to="/shop"
            className="inline-block w-full sm:w-auto bg-[#1B4332] hover:bg-[#132A20] text-white text-xs font-black px-6 py-3.5 rounded-xl uppercase tracking-widest transition-all duration-300 shadow-md"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-slate-50 text-slate-800 antialiased unified-layout relative">
      <div className="max-w-4xl mx-auto px-4">

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-[#1B4332] text-2xl font-black tracking-tight">
            Order History
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wider">
            Track and manage your past purchases
          </p>
        </div>

        {/* ── Orders List ── */}
        <div className="flex flex-col gap-6">
          {orders.map((order) => {
            const statusStyle = getStatusStyle(order.orderStatus);

            return (
              <div
                key={order._id}
                className="rounded-xl bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Order Top Banner / Header */}
                <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4 md:gap-8 flex-wrap">
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Order Number
                      </p>
                      <p className="text-[#1B4332] font-black text-sm tracking-tight mt-0.5">
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Date Placed
                      </p>
                      <p className="text-slate-700 font-bold text-xs mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        Total Value
                      </p>
                      <p className="text-[#F4A261] font-black text-sm mt-0.5 tabular-nums">
                        Rs. {order.totalPrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className="text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>

                {/* Order Items Body */}
                <div className="p-6 flex flex-col gap-4">
                  {order.orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-1 last:border-0 border-b border-slate-50"
                    >
                      <img
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        className="w-14 h-14 rounded-lg object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm font-black truncate">
                          {item.name}
                        </p>
                        <p className="text-slate-400 text-xs font-bold mt-0.5 flex items-center gap-2">
                          <span>Qty: <span className="text-slate-700">{item.quantity}</span></span>
                          <span className="text-slate-200">•</span>
                          <span>Price: <span className="text-slate-700 tabular-nums">Rs. {item.price.toLocaleString()}</span></span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Optional Display: Order Note Info Panel */}
                {order.orderNote && (
                  <div className="mx-6 mb-4 p-3 bg-amber-50/50 border border-amber-100/50 rounded-lg text-xs text-slate-600">
                    <span className="font-black text-[#1B4332] uppercase tracking-wider block mb-0.5 text-[10px]">Note Left:</span>
                    "{order.orderNote}"
                  </div>
                )}

                {/* Actions Footer */}
                <div className="px-6 py-4 bg-slate-50/40 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">
                  <Link
                    to={`/orders/${order._id}`}
                    className="text-xs font-black px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-[#1B4332] hover:text-[#1B4332] bg-white shadow-sm transition-all duration-200 uppercase tracking-wider"
                  >
                    View Full Invoice
                  </Link>

                  {/* Customer Cancel Access for Processing Only */}
                  {order.orderStatus?.toLowerCase() === 'processing' && (
                    <button
                      onClick={() => openCancelModal(order._id)} // 💡 Triggering modern custom modal
                      className="text-xs font-black px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all duration-200 uppercase tracking-wider"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-600 bg-white border border-slate-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1B4332] transition-all duration-200"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-xs font-black transition-all duration-200 shadow-sm flex items-center justify-center ${
                  p === currentPage
                    ? 'bg-[#1B4332] text-white'
                    : 'text-slate-600 bg-white border border-slate-200 hover:border-[#1B4332]'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2.5 rounded-xl text-xs font-black text-slate-600 bg-white border border-slate-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#1B4332] transition-all duration-200"
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* ── 💡 PROFESSIONAL CUSTOM MODAL POPUP OVERLAY ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Animated Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
            onClick={() => setIsModalOpen(false)}
          ></div>

          {/* Modal Container Card */}
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl relative z-10 scale-100 transform transition-all duration-300 animate-scaleUp">
            
            {/* Warning Warning Icon Shield */}
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-xl mb-4 mx-auto">
              ⚠️
            </div>

            {/* Modal Headings */}
            <h3 className="text-center text-slate-800 text-lg font-black tracking-tight mb-2">
              Cancel Order Request
            </h3>
            <p className="text-center text-slate-500 text-xs font-medium leading-relaxed mb-6">
              Are you sure you want to cancel this order? This action cannot be reversed once confirmed, and the allocated inventory items will be re-stocked.
            </p>

            {/* Action Buttons Horizontal Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black py-3 rounded-xl uppercase tracking-wider transition-all duration-200"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-black py-3 rounded-xl uppercase tracking-wider transition-all duration-200 shadow-md shadow-rose-500/10"
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

export default OrderHistoryPage;