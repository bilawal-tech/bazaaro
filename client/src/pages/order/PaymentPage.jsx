import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import API from '../../services/api';
import Loader from '../../components/common/Loader';
import CheckoutSteps from '../../components/common/CheckoutSteps';
import { getImageUrl } from '../../utils/imageUrl';

const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`;

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
// Key na ho to Stripe load hi nahi hota; page saaf paigham dikhata hai.
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const appearance = {
  theme: 'stripe',
  variables: { colorPrimary: '#1B4332', borderRadius: '8px', fontFamily: 'Inter, system-ui, sans-serif' },
};

function CardForm({ order }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Kuch cards (3D Secure) redirect karte hain; wapas order page par aayenge
      confirmParams: { return_url: `${window.location.origin}/orders/${order._id}?paid=1` },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'Payment failed. Please try another card.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      toast.success('Payment received');
      navigate(`/orders/${order._id}?paid=1`, { replace: true });
      return;
    }

    setMessage('Payment was not completed. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {message && <p className="field-error mt-3">{message}</p>}
      <button type="submit" disabled={!stripe || submitting} className="btn-primary btn-lg mt-5 w-full">
        {submitting ? 'Processing…' : `Pay Rs. ${order.totalPrice.toLocaleString()}`}
      </button>
      <p className="mt-3 text-center text-xs text-ink-soft">
        Test mode: use card 4242 4242 4242 4242, any future date, any CVC.
      </p>
    </form>
  );
}

// Payment page par order ka chhota khulasa: customer ko pata rahe kis cheez ke paise de raha hai
function OrderSummary({ order }) {
  const shipping = Number(order.shippingPrice || 0);

  return (
    <aside className="card p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Order summary</h2>
      <p className="mt-0.5 text-xs text-ink-soft">Order #{order._id.slice(-8).toUpperCase()}</p>

      <ul className="mt-4 max-h-64 divide-y divide-line overflow-y-auto pr-1">
        {order.orderItems.map((item, index) => (
          <li key={item._id || index} className="flex items-center gap-3 py-3 first:pt-0">
            <img
              src={getImageUrl(item.image)}
              alt={item.name}
              className="h-12 w-12 shrink-0 rounded-lg border border-line bg-surface object-cover"
              onError={(e) => { e.target.onerror = null; e.target.src = '/placeholder.png'; }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{item.name}</p>
              <p className="text-xs text-ink-soft">
                {[item.color, item.size].filter(Boolean).join(' · ')}
                {(item.color || item.size) && ' · '}
                {item.quantity} × {money(item.price)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink">{money(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-ink-soft">Subtotal</dt>
          <dd className="font-medium text-ink">{money(order.itemsPrice)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-soft">Shipping</dt>
          <dd className="font-medium text-ink">{shipping > 0 ? money(shipping) : 'Free'}</dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-brand-800">{money(order.totalPrice)}</span>
      </div>

      {order.shippingAddress?.city && (
        <p className="mt-4 border-t border-line pt-4 text-xs text-ink-soft">
          Delivering to {order.shippingAddress.fullName}, {order.shippingAddress.street}, {order.shippingAddress.city}
        </p>
      )}
    </aside>
  );
}

function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data } = await API.get(`/orders/${orderId}`);
        const found = data.order;

        if (found.PaymentMethod !== 'Credit Card' || found.orderStatus !== 'processing') {
          navigate(`/orders/${orderId}`, { replace: true });
          return;
        }
        if (found.PaymentStatus === 'Completed') {
          navigate(`/orders/${orderId}`, { replace: true });
          return;
        }

        const intent = await API.post('/payments/create-intent', { orderId });
        if (!active) return;
        setOrder(found);
        setClientSecret(intent.data.clientSecret);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Could not start payment');
      }
    })();

    return () => { active = false; };
  }, [orderId, navigate]);

  const options = useMemo(() => ({ clientSecret, appearance }), [clientSecret]);

  return (
    <div className="bg-surface">
      <div className="container-page max-w-4xl py-8 sm:py-12">
        <CheckoutSteps current={2} />

        <h1 className="page-title mb-6">Pay for your order</h1>

        {!publishableKey && (
          <p className="card p-6 text-sm text-ink-soft">
            Card payments are not set up yet (VITE_STRIPE_PUBLISHABLE_KEY is missing).
          </p>
        )}

        {publishableKey && error && (
          <div className="card p-6">
            <p className="field-error">{error}</p>
            <Link to={`/orders/${orderId}`} className="btn-secondary mt-4">View order</Link>
          </div>
        )}

        {publishableKey && !error && (!order || !clientSecret) && <Loader />}

        {publishableKey && !error && order && clientSecret && (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
            {/* Phone par summary pehle: pata chale kis cheez ka payment hai */}
            <div className="lg:order-last lg:col-span-2 lg:sticky lg:top-32">
              <OrderSummary order={order} />
            </div>

            <div className="card p-5 sm:p-6 lg:col-span-3">
              <p className="mb-4 text-sm text-ink-soft">
                Your items are reserved for a short time. Please complete the payment to confirm your order.
              </p>
              <Elements stripe={stripePromise} options={options}>
                <CardForm order={order} />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentPage;
