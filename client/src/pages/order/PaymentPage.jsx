import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import API from '../../services/api';
import Loader from '../../components/common/Loader';

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
      <div className="container-page max-w-xl py-8 sm:py-12">
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
          <div className="card p-5 sm:p-6">
            <p className="mb-4 text-sm text-ink-soft">
              Your items are reserved for a short time. Please complete the payment to confirm your order.
            </p>
            <Elements stripe={stripePromise} options={options}>
              <CardForm order={order} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentPage;
