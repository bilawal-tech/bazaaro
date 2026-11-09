import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // 💡 react-hot-toast strictly configured here
import {
  selectCartItems,
  selectTotalPrice,
} from '../../redux/slices/cartSlice';
import {
  createOrder,
  selectOrderLoading,
  selectOrderSuccess,
  clearSuccess,
} from '../../redux/slices/orderSlice';
import { selectUser } from '../../redux/slices/authSlice';

function CheckoutPage() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const items      = useSelector(selectCartItems);
  const totalPrice = useSelector(selectTotalPrice);
  const loading    = useSelector(selectOrderLoading);
  const success    = useSelector(selectOrderSuccess);
  const user       = useSelector(selectUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.user?.name  || user?.name || '',
      phone:    user?.user?.phone || user?.phone || '',
      orderNote: ''
    }
  });

  // ── Empty cart guard ───────────────────────
  useEffect(() => {
    if (!items || items.length === 0) navigate('/cart');
  }, [items, navigate]);

  // ── Order success → Toast show karo aur orders page pr le jao ──
  useEffect(() => {
    if (success) {
      // 💡 react-hot-toast syntax applied perfectly
      toast.success('Order Placed Successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#1B4332',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '14px'
        }
      });
      dispatch(clearSuccess());
      navigate('/orders');
    }
  }, [success, dispatch, navigate]);

  // ── Shipping cost ──────────────────────────
  const shippingPrice = totalPrice > 1000 ? 0 : 200;
  const grandTotal    = totalPrice + shippingPrice;

  // ── Submit Data aligned with your Model ────
  const onSubmit = (data) => {
    const formattedOrderItems = items.map(item => ({
      product: item.productId?._id || item.product || item._id,
      name:    item.name || item.productId?.name,
      image:   item.image || item.productId?.image || item.productId?.images?.[0] || '',
      color:   item.color || null,
      size:    item.size || null,
      quantity: item.quantity,
      price:   item.currentProductPrice || item.productId?.price || 0
    }));

    dispatch(createOrder({
      orderItems: formattedOrderItems,
      shippingAddress: {
        fullName: data.fullName,
        phone:    data.phone,
        street:   data.street,
        city:     data.city,
        zip:      data.zip,
      },
      PaymentMethod: data.PaymentMethod, 
      itemsPrice:    totalPrice,
      shippingPrice: shippingPrice,
      totalPrice:    grandTotal,
      orderNote:     data.orderNote 
    }));
  };

  return (
    <div className="min-h-screen py-16 bg-slate-50 text-slate-800 antialiased unified-layout">
      <div className="max-w-5xl mx-auto px-4">

        <h1 className="text-[#1B4332] text-2xl font-black tracking-tight mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">

            {/* ── Left Side — Shipping + Payment Info ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Shipping Address Container */}
              <div className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
                <h2 className="text-[#1B4332] text-sm font-black uppercase tracking-wider mb-5 pb-2 border-b border-slate-100">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Full Name Input */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      Full Name
                    </label>
                    <input
                      {...register('fullName', { required: 'Full name is required' })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200"
                    />
                    {errors.fullName && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Phone Input */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phone', { required: 'Phone number is required' })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200"
                    />
                    {errors.phone && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Street Address Input */}
                  <div className="md:col-span-2">
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      Street Address
                    </label>
                    <input
                      {...register('street', { required: 'Street address is required' })}
                      placeholder="House #, Street name, Apartment, Sector"
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200 placeholder:text-slate-300"
                    />
                    {errors.street && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.street.message}</p>
                    )}
                  </div>

                  {/* City Input */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      City
                    </label>
                    <input
                      {...register('city', { required: 'City is required' })}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200"
                    />
                    {errors.city && (
                      <p className="text-rose-500 text-xs mt-1 font-semibold">{errors.city.message}</p>
                    )}
                  </div>

                  {/* Zip Code Input */}
                  <div>
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      Zip Code (Optional)
                    </label>
                    <input
                      {...register('zip')}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Order Note Input */}
                  <div className="md:col-span-2 mt-2">
                    <label className="text-slate-400 text-xs font-bold block mb-1">
                      Order Note / Special Instructions (Optional)
                    </label>
                    <textarea
                      {...register('orderNote')}
                      rows={3}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-slate-800 bg-slate-50 border border-slate-200 focus:border-[#1B4332] focus:bg-white outline-none transition-all duration-200 placeholder:text-slate-300 resize-none"
                    />
                  </div>

                </div>
              </div>

              {/* Payment Method Container */}
              <div className="rounded-xl p-6 bg-white border border-slate-100 shadow-sm">
                <h2 className="text-[#1B4332] text-sm font-black uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: 'COD',           label: '💵 Cash on Delivery' },
                    { value: 'Jazzcash',      label: '📱 JazzCash'         },
                    { value: 'Easypaisa',     label: '📱 EasyPaisa'        },
                    { value: 'Credit Card',   label: '💳 Credit/Debit Card' },
                    { value: 'Bank Transfer', label: '🏦 Bank Transfer'    },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-[#1B4332] hover:bg-white transition-all duration-200 group"
                    >
                      <input
                        type="radio"
                        value={method.value}
                        defaultChecked={method.value === 'COD'}
                        {...register('PaymentMethod', { required: true })}
                        className="accent-[#1B4332] w-4 h-4"
                      />
                      <span className="text-slate-700 text-xs font-black tracking-tight group-hover:text-[#1B4332]">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right Side — Fixed Sticky Summary Sidebar ── */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 self-start">
              <div className="rounded-xl p-6 bg-gradient-to-br from-[#1B4332] via-[#132A20] to-[#2D6A4F] text-white border border-white/5 shadow-xl">
                <h2 className="text-white font-black text-xs uppercase tracking-widest mb-5 pb-2 border-b border-white/10">
                  Order Items
                </h2>

                <div className="flex flex-col gap-3 mb-5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {items.map((item) => (
                    <div key={item._id} className="flex justify-between items-start gap-4 text-xs font-bold">
                      <span className="text-slate-300 flex-1 truncate">
                        {item.name || item.productId?.name} <span className="text-white font-black">× {item.quantity}</span>
                      </span>
                      <span className="text-white tabular-nums flex-shrink-0">
                        Rs. {((item.currentProductPrice || item.productId?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <hr className="border-white/10 mb-4" />

                <div className="space-y-3 text-xs font-bold text-slate-300 mb-5">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white tabular-nums">Rs. {totalPrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-[#95D5B2] font-black uppercase tracking-wider text-[11px]">
                      {shippingPrice === 0 ? 'Free Shipping' : `Rs. ${shippingPrice}`}
                    </span>
                  </div>
                </div>

                <hr className="border-white/10 mb-5" />

                <div className="flex justify-between text-white font-black text-base tracking-tight mb-6">
                  <span>Total Amount</span>
                  <span className="text-[#F4A261] tabular-nums">
                    Rs. {grandTotal.toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#F4A261] hover:bg-white text-white hover:text-[#1B4332] text-xs font-black py-4 rounded-xl shadow-lg transition-all duration-300 uppercase tracking-widest active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing Order...' : 'Confirm & Place Order'}
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;