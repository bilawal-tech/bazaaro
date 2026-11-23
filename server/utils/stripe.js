const Stripe = require('stripe');

let client = null;

// Stripe client sirf tab banta hai jab STRIPE_SECRET_KEY set ho.
function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

function getStripe() {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  }
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

// Order ka total (Rs.) -> Stripe ka amount (sab se chhoti unit, yani paisa/cents).
// Default currency PKR. Agar PKR Stripe account par reject ho to .env mein
// PAYMENT_CURRENCY=usd aur PKR_PER_USD=280 (apna rate) rakho.
function toStripeAmount(totalPrice) {
  const currency = (process.env.PAYMENT_CURRENCY || 'pkr').toLowerCase();
  let major = totalPrice;
  if (currency === 'usd') {
    const rate = Number(process.env.PKR_PER_USD) || 280;
    major = totalPrice / rate;
  }
  return { currency, amount: Math.round(major * 100) };
}

module.exports = { isStripeConfigured, getStripe, toStripeAmount };
