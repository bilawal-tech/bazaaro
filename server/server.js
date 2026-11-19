const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const helmet = require('helmet')
const multer = require('multer')
const rateLimit = require('express-rate-limit')
const ConnectDB = require('./config/db')
const path = require('path') 

dotenv.config();

// Bina secret ke server chalana khatarnak hai (tokens sign hi nahi ho sakte)
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET is not set. Add it to server/.env');
  process.exit(1);
}

ConnectDB();

const app = express()

// ── Security headers ──────────────────────────
// Client (5173) aur server (5000) alag origin hain, is liye uploads ki images
// ko cross-origin allow karna parta hai, warna helmet unhe block kar deta hai.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS: allowed origins env se ──────────────
// CLIENT_URL mein comma se alag kar ke kai origins de sakte hain.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // origin nahi hota jab request browser se na ho (curl, Postman, simulator)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────
// Limits env se badal sakte hain. Traffic simulator / load test chalate waqt
// RATE_LIMIT_DISABLED=true rakho, warna ek IP se aane wali requests block hongi.
// Proxy ke peeche deploy karo to app.set('trust proxy', 1) bhi lagana hoga.
const limiterBase = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_DISABLED === 'true',
};

// Poori API par: ek IP se 15 minute mein itni requests
const apiLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 600,
  message: { success: false, message: 'Too many requests, please try again later' },
});

// Login: password guess karne se rokta hai. Sirf nakam attempts gine jate hain.
const loginLimiter = rateLimit({
  ...limiterBase,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' },
});

// Register: spam accounts se rokta hai
const registerLimiter = rateLimit({
  ...limiterBase,
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { success: false, message: 'Too many accounts created from this IP, please try again later' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/AuthRotes');
app.use('/api/auth', authRoutes);

const CategoryRoutes = require('./routes/CategoryRoutes');
app.use('/api/category', CategoryRoutes);

const ProductRoutes = require('./routes/ProductRoutes');
app.use('/api/products', ProductRoutes);

const CartRoutes = require('./routes/CartRoutes');
app.use('/api/cart', CartRoutes);

const OrderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', OrderRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

// ── Error handler ─────────────────────────────
// Upload errors (bari file, galat type) aur bad JSON ke liye JSON jawab,
// warna Express stack trace wala HTML page bhej deta hai.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Image is too large (max 5MB each)'
      : err.message;
    return res.status(400).json({ success: false, message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body too large' });
  }
  // fileFilter ki apni error (galat image type)
  if (err.message && err.message.startsWith('Only JPG')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ success: false, message: 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
