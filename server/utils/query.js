// ── Query / input helpers ─────────────────────

// User ki search string ko regex mein daalne se pehle escape karo.
// Warna "(a+)+$" jaisi input se server hang ho sakta hai (ReDoS) aur
// ".*" jaisi input har cheez match kar deti hai.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// page/limit ko safe numbers banao. limit par upar se cap, taake koi
// ?limit=1000000 bhej kar poori collection ek saath na kheench le.
function parsePagination(query, { defaultLimit = 10, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

// Query-string ki value sirf tab maano jab wo plain string ho.
// ?search[$ne]=x jaisi cheez object ban kar aati hai (NoSQL injection).
function asString(value) {
  return typeof value === 'string' ? value : '';
}

module.exports = { escapeRegex, parsePagination, asString };
