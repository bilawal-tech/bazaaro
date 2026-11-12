// Ek baar chalao:  node scripts/normalizeOrderStatus.js
// 1. Purane orders ka orderStatus lowercase karta hai (Processing -> processing)
// 2. Carts se purana TTL index (expireAt) hata kar lastActivityAt set karta hai
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  // 1. Order status (raw collection, taake enum validation beech mein na aaye)
  const orders = db.collection('orders');
  const r1 = await orders.updateMany(
    { orderStatus: { $type: 'string' } },
    [{ $set: { orderStatus: { $toLower: '$orderStatus' } } }]
  );
  console.log(`Orders checked: ${r1.matchedCount}, changed: ${r1.modifiedCount}`);

  // 2. Cart TTL hatao
  const carts = db.collection('carts');
  try {
    await carts.dropIndex('expireAt_1');
    console.log('Dropped old TTL index expireAt_1');
  } catch (e) {
    console.log('TTL index already gone (ok)');
  }
  const r2 = await carts.updateMany(
    { lastActivityAt: { $exists: false } },
    [{ $set: { lastActivityAt: { $ifNull: ['$updatedAt', '$$NOW'] } } }, { $unset: 'expireAt' }]
  );
  console.log(`Carts updated: ${r2.modifiedCount}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
