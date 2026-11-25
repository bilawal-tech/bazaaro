import { FiCheck } from 'react-icons/fi';

const STEPS = ['Cart', 'Address', 'Payment', 'Done'];

// Upar ki progress line: Cart → Address → Payment → Done.
// current: 0 = Cart, 1 = Address, 2 = Payment, 3 = Done (sab mukammal).
function CheckoutSteps({ current = 0 }) {
  return (
    <ol aria-label="Checkout progress" className="mb-8 flex items-start">
      {STEPS.map((label, i) => {
        const done = i < current || current === STEPS.length - 1;
        const active = i === current && !done;
        const last = i === STEPS.length - 1;

        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center text-center"
          >
            {/* Is step se agle step tak ki line */}
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                  i < current ? 'bg-brand-700' : 'bg-line'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                done
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : active
                  ? 'border-brand-800 bg-white text-brand-800 ring-4 ring-brand-100'
                  : 'border-line bg-white text-ink-faint'
              }`}
            >
              {done ? <FiCheck size={16} aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`mt-2 text-xs font-medium sm:text-sm ${
                done || active ? 'text-ink' : 'text-ink-faint'
              }`}
            >
              {label}
              {done && <span className="sr-only"> (completed)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default CheckoutSteps;
