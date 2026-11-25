import { FiCheck } from 'react-icons/fi';

const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

// Order tracking: Placed → Processing → Shipped → Delivered.
// status: 'processing' | 'shipped' | 'delivered'. Jis step ka waqt server ke paas nahi
// (purane orders mein Shipped ka waqt nahi hota) uska waqt nahi dikhta, step phir bhi tick hota hai.
function OrderTimeline({ status, createdAt, shippedAt, deliveredAt }) {
  // Abhi kaunsa step chal raha hai (0 = Placed ... 3 = Delivered)
  const currentIndex = { processing: 1, shipped: 2, delivered: 3 }[status] ?? 1;

  const steps = [
    { label: 'Order placed',  text: 'We received your order.',       time: createdAt },
    { label: 'Processing',    text: 'We are packing your items.',    time: null },
    { label: 'Shipped',       text: 'Your order is on its way.',     time: shippedAt },
    { label: 'Delivered',     text: 'Your order has been delivered.', time: deliveredAt },
  ];

  return (
    <ol aria-label="Order tracking" className="card mb-6 p-5 sm:p-6">
      {steps.map((step, i) => {
        // Delivered ho chuka to akhri step bhi mukammal hai (chalta hua nahi)
        const done = i < currentIndex || (status === 'delivered' && i === 3);
        const active = i === currentIndex && !done;
        const last = i === steps.length - 1;

        return (
          <li key={step.label} aria-current={active ? 'step' : undefined} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 ${
                  i < currentIndex ? 'bg-brand-700' : 'bg-line'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                done
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : active
                  ? 'border-brand-800 bg-white text-brand-800 ring-4 ring-brand-100'
                  : 'border-line bg-white text-ink-faint'
              }`}
            >
              {done ? <FiCheck size={16} aria-hidden="true" /> : i + 1}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className={`text-sm font-semibold ${done || active ? 'text-ink' : 'text-ink-faint'}`}>
                  {step.label}
                  {active && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">Current</span>}
                  {done && <span className="sr-only"> (completed)</span>}
                </p>
                {step.time && (done || active) && (
                  <p className="text-xs text-ink-soft">{formatDateTime(step.time)}</p>
                )}
              </div>
              <p className={`mt-0.5 text-sm ${done || active ? 'text-ink-soft' : 'text-ink-faint'}`}>{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default OrderTimeline;
