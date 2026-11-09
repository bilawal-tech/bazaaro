import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast'; 
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCartAsync,
  selectCartItems,
  selectTotalPrice,
  selectTotalQuantity,
  selectCartLoading,
  updateItemLocally,
} from '../../redux/slices/cartSlice';
import { selectUser } from '../../redux/slices/authSlice';
import Loader from '../../components/common/Loader';

function CartPage() {
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const debounceTimer  = useRef(null);
  const items          = useSelector(selectCartItems);
  const totalPrice     = useSelector(selectTotalPrice);
  const totalQuantity  = useSelector(selectTotalQuantity);
  const loading        = useSelector(selectCartLoading);
  const user           = useSelector(selectUser);

  // base url
  const BACKEND_URL = "http://localhost:5000";

  useEffect(() => {
    if (user) dispatch(getCart());
  }, [dispatch, user]);

  // quantity manage
  const handleQuantityChange = (itemId, currentQty, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;

    dispatch(updateItemLocally({ itemId, quantity: newQty }));

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      dispatch(updateCartItem({
        itemId,
        updateData: { quantity: newQty },
      }));
    }, 400);
  };

  // single item remove
  const handleRemove = (itemId) => {
    dispatch(removeCartItem(itemId));
    toast.error("Item removed from cart"); 
  };

  // clear complete bag
  const handleClearCart = () => {
    dispatch(clearCartAsync());
    toast.success("Cart cleared successfully"); 
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // dynamic safe image utility
  const getCartItemImage = (item) => {
    const rawImage = item.image || item.productId?.image || item.productId?.images?.[0];
    
    if (!rawImage) return '/placeholder.png';

    // check object or string
    const imageStr = typeof rawImage === 'object' 
      ? (rawImage.url || rawImage.path || '') 
      : rawImage;

    if (!imageStr) return '/placeholder.png';

    if (imageStr.startsWith('http')) {
      return imageStr;
    }
    const cleanPath = imageStr.startsWith('/') ? imageStr : `/${imageStr}`;
    return `${BACKEND_URL}${cleanPath}`;
  };

  if (loading) return <Loader />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center px-4 max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h2 className="text-[#1B4332] text-xl font-black mb-2 tracking-tight">
            Your cart is empty
          </h2>
          <p className="text-slate-400 text-xs mb-6 font-medium">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link
            to="/shop"
            className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 bg-slate-50 text-slate-800 antialiased unified-layout">
      <div className="max-w-5xl mx-auto px-4">

        {/* title heading */}
        <div className="flex flex-row items-end justify-between gap-4 mb-10 pb-5 border-b border-slate-200">
          <div>
            <h1 className="text-[#1B4332] text-2xl font-black tracking-tight">
              Review Your Selection
            </h1>
            
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white border border-slate-200 shadow-sm rounded-lg">
              <span className="text-base font-black text-[#1B4332] tabular-nums">
                {totalQuantity}
              </span>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {totalQuantity === 1 ? 'Item Secured' : 'Items Secured'}
              </span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleClearCart}
            className="text-slate-400 hover:text-rose-600 text-[11px] font-black uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 group"
          >
            <span>🗑️</span> <span className="border-b border-transparent group-hover:border-rose-600/40 pb-0.5">Clear Bag</span>
          </button>
        </div>

        {/* layout split grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start relative">

          {/* cart products cards wrapper */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const itemColor = item.color || item.productId?.color;
              const itemSize  = item.size  || item.productId?.size;

              return (
                <div
                  key={item._id}
                  className="rounded-xl p-4 bg-white border border-slate-100 shadow-sm flex flex-row items-center justify-between transition-all duration-300 hover:border-slate-200/80"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200/60 shadow-inner text-transparent select-none">
                      <img
                        src={getCartItemImage(item)} // 👈 Multer pipeline image handler
                        alt=""
                        className="w-full h-full object-cover text-transparent"
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="text-[#1B4332] font-extrabold text-sm tracking-tight truncate">
                        {item.name || item.productId?.name}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-1 mb-2">
                        {itemColor && (
                          <span className="capitalize px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded text-[10px]">
                            {itemColor}
                          </span>
                        )}
                        {itemColor && itemSize && <span className="text-slate-200">|</span>}
                        {itemSize && (
                          <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded text-[10px]">
                            Size {itemSize}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="grid grid-cols-3 items-center w-24 h-8 bg-slate-50 rounded-lg border border-slate-200/60 overflow-hidden shadow-inner">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity, false)}
                            className="h-full flex items-center justify-center text-[#1B4332] hover:bg-slate-200/50 font-black text-xs select-none transition-colors"
                          >
                            -
                          </button>
                          <span className="h-full flex items-center justify-center text-[#1B4332] font-black text-xs tabular-nums select-none border-x border-slate-200/40 bg-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item._id, item.quantity, true)}
                            className="h-full flex items-center justify-center text-[#1B4332] hover:bg-slate-200/50 font-black text-xs select-none transition-colors"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemove(item._id)}
                          className="text-slate-400 hover:text-rose-500 text-xs font-bold transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-[#1B4332] font-black text-sm tracking-tight tabular-nums">
                      Rs. {((item.currentProductPrice || item.productId?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                    {item.currentProductPrice !== item.productAtAddedPrice && item.productAtAddedPrice && (
                      <span className="text-[9px] font-black text-amber-600 block mt-0.5 uppercase tracking-wide">
                        Price Adjusted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* sticky checkout sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 self-start">
            <div className="rounded-xl p-6 bg-gradient-to-br from-[#1B4332] via-[#132A20] to-[#2D6A4F] text-white border border-white/5 shadow-xl">
              <h2 className="text-white font-black text-xs uppercase tracking-widest mb-6 pb-2 border-b border-white/10">
                Order Summary
              </h2>

              <div className="space-y-3.5 mb-5 text-xs font-bold text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white tabular-nums">Rs. {totalPrice?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-[#95D5B2] font-black uppercase tracking-wider text-[11px]">
                    {totalPrice > 1000 ? 'Free Shipping' : 'Rs. 200'}
                  </span>
                </div>
              </div>

              <hr className="border-white/10 mb-5" />

              <div className="flex justify-between text-white font-black text-base tracking-tight mb-6">
                <span>Total Amount</span>
                <span className="text-[#F4A261] tabular-nums">
                  Rs. {(totalPrice > 1000 ? totalPrice : totalPrice + 200).toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full bg-[#F4A261] hover:bg-white text-white hover:text-[#1B4332] text-xs font-black py-3.5 rounded-xl shadow-lg transition-all duration-300 uppercase tracking-widest active:scale-[0.98]"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block text-center text-slate-300 hover:text-white text-[11px] font-black uppercase tracking-wider mt-4 transition-colors duration-200"
              >
                ← Return to Shop
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default CartPage;