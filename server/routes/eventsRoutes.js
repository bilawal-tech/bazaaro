// Client clickstream: frontend se page views / clicks. Login zaroori nahi, token ho to user_id lag jata hai.
const express = require('express');
const jwt = require('jsonwebtoken');
const { emit, TOPICS } = require('../utils/events');

const router = express.Router();

// Sirf ye types qabool hain; baqi sab 400
const ALLOWED = new Set(['page_view', 'product_view', 'search', 'click']);
const str = (v, n = 200) => (typeof v === 'string' ? v.slice(0, n) : null);

function optionalUserId(req) {
  try {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return null;
    return jwt.verify(h.split(' ')[1], process.env.JWT_SECRET).id || null;
  } catch {
    return null;
  }
}

router.post('/', (req, res) => {
  const { type, sessionId, path, productId, query, target, referrer } = req.body || {};
  if (!ALLOWED.has(type)) {
    return res.status(400).json({ success: false, message: 'Invalid event type' });
  }
  const userId = optionalUserId(req);
  const session = str(sessionId, 64);
  emit(
    TOPICS.clicks,
    type,
    {
      session_id: session,
      path: str(path),
      product_id: str(productId, 40),
      query: str(query),
      target: str(target, 80),
      referrer: str(referrer),
      user_agent: str(req.headers['user-agent'], 200),
    },
    { key: userId || session, userId }
  );
  return res.status(202).json({ success: true });
});

module.exports = router;
