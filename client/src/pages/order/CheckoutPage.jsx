import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

// Abhi sirf COD chalta hai (server par koi payment gateway nahi).
// Stripe lagne par baqi methods ke liye enabled: true kar dena.
const PAYMENT_METHODS = [
  { value: 'COD',           label: 'Cash on delivery',    hint: 'Pay when your order arrives', enabled: true  },
  { value: 'Credit Card',   label: 'Credit or debit card', hint: 'Coming soon',                 enabled: false },
  { value: 'Jazzcash',      label: 'JazzCash',            hint: 'Coming soon',                 enabled: false },
  { value: 'Easypaisa',     label: 'Easypaisa',           hint: 'Coming soon',                 enabled: false },
  { value: 'Bank Transfer', label: 'Bank transfer',       hint: 'Coming soon',                 enabled: false },
];

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
  // Order place hone ke baad cart khali hoti hai; us waqt /cart par na bhejo,
  // success wala effect /orders par le jayega.
  useEffect(() => {
    if (!success && (!items || items.length === 0)) navigate('/cart');
  }, [items, success, navigate]);

  // ── Order success → Toast show karo aur orders page pr le jao ──
  useEffect(() => {
    if (success) {
      toast.success('Order placed');
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

  const field = (name, label, opts = {}) => (
    <div className={opts.span ? 'sm:col-span-2' : ''}>
      <label htmlFor={name} className="label">{label}</label>
      <input
        id={name}
        {...register(name, opts.required ? { required: `${label} is required` } : {})}
        placeholder={opts.placeholder}
        autoComplete={opts.autoComplete}
        className="input"
      />
      {errors[name] && <p className="field-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <div className="bg-surface">
      <div className="container-page py-8 sm:py-12">

        <h1 className="page-title mb-6">Checkout</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">

            {/* Left: address + payment */}
            <div className="flex flex-col gap-6 lg:col-span-2">

              <section className="card p-5 sm:p-6">
                <h2 className="mb-5 text-lg font-semibold">Delivery address</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {field('fullName', 'Full name', { required: true, autoComplete: 'name' })}
                  {field('phone', 'Phone number', { required: true, autoComplete: 'tel' })}
                  {field('street', 'Street address', { required: true, span: true, placeholder: 'House no., street, area', autoComplete: 'street-address' })}
                  {field('city', 'City', { required: true, autoComplete: 'address-level2' })}
                  {field('zip', 'Postal code (optional)', { autoComplete: 'postal-code' })}

                  <div className="sm:col-span-2">
                    <label htmlFor="orderNote" className="label">Order note (optional)</label>
                    <textarea
                      id="orderNote"
                      {...register('orderNote')}
                      rows={3}
                      placeholder="Anything we should know for delivery"
                      className="input resize-none"
                    />
                  </div>
                </div>
              </section>

              <section className="card p-5 sm:p-6">
                <h2 className="mb-5 text-lg font-semibold">Payment method</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                        method.enabled
                          ? 'cursor-pointer border-line hover:border-brand-700 has-[:checked]:border-brand-800 has-[:checked]:bg-brand-50'
                          : 'cursor-not-allowed border-line bg-surface opacity-60'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method.value}
                        defaultChecked={method.value === 'COD'}
                        disabled={!method.enabled}
                        {...register('PaymentMethod', { required: true })}
                        className="mt-0.5 h-4 w-4 accent-brand-800"
                      />
                      <span>
                        <span className="block text-sm font-medium text-ink">{method.label}</span>
                        <span className="block text-xs text-ink-soft">{method.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            {/* Right: summary */}
            <aside className="lg:sticky lg:top-32">
              <div className="card p-6">
                <h2 className="mb-4 text-lg font-semibold">Order summary</h2>

                <ul className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <li key={item._id} className="flex justify-between gap-4 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink-soft">
                        {item.name || item.productId?.name}
                        <span className="font-medium text-ink"> × {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-medium text-ink">
                        Rs. {((item.currentProductPrice || item.productId?.price || 0) * item.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-3 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Subtotal</dt>
                    <dd className="font-medium text-ink">Rs. {totalPrice?.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Shipping</dt>
                    <dd className="font-medium text-ink">{shippingPrice === 0 ? 'Free' : `Rs. ${shippingPrice}`}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-between border-t border-line pt-4">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-brand-800">Rs. {grandTotal.toLocaleString()}</span>
                </div>

                <button type="submit" disabled={loading} className="btn-primary btn-lg mt-5 w-full">
                  {loading ? 'Placing order…' : 'Place order'}
                </button>
              </div>
            </aside>

          </div>
        </form>
      </div>
    </div>
  );
}

export default CheckoutPage;
