import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
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
import { CartSkeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import CheckoutSteps from '../../components/common/CheckoutSteps';

function CartPage() {
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  // Har item ka apna timer (itemId -> timeout). Ek shared timer hota to do
  // items jaldi badalne par pehle item ka update cancel ho jata.
  const debounceTimers = useRef({});
  const items          = useSelector(selectCartItems);
  const totalPrice     = useSelector(selectTotalPrice);
  const totalQuantity  = useSelector(selectTotalQuantity);
  const loading        = useSelector(selectCartLoading);
  const user           = useSelector(selectUser);

  // base url
  const BACKEND_URL = "http://localhost:5000";

  // Pehli load ke baad hi "cart khali hai" dikhao. Quantity badalne par poora page skeleton na bane.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) dispatch(getCart()).finally(() => setLoaded(true));
  }, [dispatch, user]);

  // quantity manage
  const handleQuantityChange = (itemId, currentQty, increment) => {
    const newQty = increment ? currentQty + 1 : currentQty - 1;
    if (newQty < 1) return;

    dispatch(updateItemLocally({ itemId, quantity: newQty }));

    clearTimeout(debounceTimers.current[itemId]);
    debounceTimers.current[itemId] = setTimeout(() => {
      delete debounceTimers.current[itemId];
      dispatch(updateCartItem({
        itemId,
        updateData: { quantity: newQty },
      }));
    }, 400);
  };

  // single item remove
  const handleRemove = (itemId) => {
    clearTimeout(debounceTimers.current[itemId]);
    delete debounceTimers.current[itemId];
    dispatch(removeCartItem(itemId));
    toast.success("Item removed from cart");
  };

  // clear complete bag
  const handleClearCart = () => {
    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};
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

  if (user && (!loaded || (loading && items.length === 0))) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        fullPage
        icon={<FiShoppingCart size={28} />}
        title="Your cart is empty"
        text="Add a few products and they will show up here."
      >
        <Link to="/shop" className="btn-primary btn-lg">Start shopping</Link>
      </EmptyState>
    );
  }

  const shipping = totalPrice > 1000 ? 0 : 200;
  const grandTotal = totalPrice + shipping;

  return (
    <div className="bg-surface">
      <div className="container-page py-8 sm:py-12">

        <CheckoutSteps current={0} />

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="page-title">Your cart</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearCart}
            className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-ink-soft hover:text-red-600"
          >
            <FiTrash2 size={16} /> Clear cart
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

          {/* Items */}
          <ul className="space-y-3 lg:col-span-2">
            {items.map((item) => {
              const itemColor = item.color || item.productId?.color;
              const itemSize  = item.size  || item.productId?.size;
              const unitPrice = item.currentProductPrice || item.productId?.price || 0;

              return (
                <li key={item._id} className="card flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line bg-surface sm:h-24 sm:w-24">
                    <img
                      src={getCartItemImage(item)}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-sm font-medium text-ink sm:text-base">
                          {item.name || item.productId?.name}
                        </h3>
                        {(itemColor || itemSize) && (
                          <p className="mt-1 text-sm text-ink-soft">
                            {itemColor && <span className="capitalize">{itemColor}</span>}
                            {itemColor && itemSize && ' · '}
                            {itemSize && <span>Size {itemSize}</span>}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold text-ink">Rs. {(unitPrice * item.quantity).toLocaleString()}</p>
                        {item.currentProductPrice !== item.productAtAddedPrice && item.productAtAddedPrice && (
                          <span className="badge-warning mt-1">Price changed</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-lg border border-line">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, item.quantity, false)}
                          aria-label="Decrease quantity"
                          className="p-2.5 text-ink-soft hover:text-ink"
                        >
                          <FiMinus size={14} />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-medium" aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item._id, item.quantity, true)}
                          aria-label="Increase quantity"
                          className="p-2.5 text-ink-soft hover:text-ink"
                        >
                          <FiPlus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item._id)}
                        className="px-1 py-2 text-sm font-medium text-ink-soft hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Summary */}
          <aside className="lg:sticky lg:top-32">
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Subtotal</dt>
                  <dd className="font-medium text-ink">Rs. {totalPrice?.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Shipping</dt>
                  <dd className="font-medium text-ink">{shipping === 0 ? 'Free' : `Rs. ${shipping}`}</dd>
                </div>
              </dl>

              {shipping > 0 && (
                <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                  Add Rs. {(1001 - totalPrice).toLocaleString()} more for free delivery.
                </p>
              )}

              <div className="mt-4 flex justify-between border-t border-line pt-4">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-brand-800">Rs. {grandTotal.toLocaleString()}</span>
              </div>

              <button type="button" onClick={handleCheckout} className="btn-primary btn-lg mt-5 w-full">
                Checkout
              </button>
              <Link to="/shop" className="link mt-2 block py-2 text-center text-sm">Continue shopping</Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

export default CartPage;
