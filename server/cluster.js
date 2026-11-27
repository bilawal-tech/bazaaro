// Node ek hi CPU core use karta hai. Ye file server.js ki N copies (workers) chalati hai jo ek hi port 5000 share karti hain.
//   WEB_CONCURRENCY=4 node cluster.js     (Docker mein compose yahi karta hai)
// WEB_CONCURRENCY=1 (ya na ho) to seedha ek hi server chalta hai, bilkul pehle jaisa.
// Dhyan: rate limit aur auth cache har worker ke apne memory mein hain (limit ~N guna ho jati hai).
const cluster = require('cluster');

const WORKERS = Math.max(1, Number(process.env.WEB_CONCURRENCY) || 1);

if (WORKERS > 1 && cluster.isPrimary) {
  let shuttingDown = false;
  let sweeperId = null; // sirf ek worker unpaid-order sweeper chalata hai

  const spawn = () => {
    const needSweeper = sweeperId === null;
    const w = cluster.fork({ CLUSTER_WORKER: '1', SWEEPER: needSweeper ? '1' : '0' });
    if (needSweeper) sweeperId = w.id;
  };

  console.log(`Primary ${process.pid}: ${WORKERS} workers start ho rahe hain`);
  for (let i = 0; i < WORKERS; i++) spawn();

  cluster.on('exit', (worker, code, signal) => {
    if (worker.id === sweeperId) sweeperId = null;
    if (shuttingDown) {
      if (Object.keys(cluster.workers).length === 0) process.exit(0);
      return;
    }
    console.error(`Worker ${worker.process.pid} band hua (${signal || code}), dobara chala raha hoon`);
    setTimeout(spawn, 1000);
  });

  const stop = () => {
    shuttingDown = true;
    Object.values(cluster.workers).forEach((w) => w.process.kill('SIGTERM'));
    setTimeout(() => process.exit(0), 10000).unref();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
} else {
  require('./server');
}
