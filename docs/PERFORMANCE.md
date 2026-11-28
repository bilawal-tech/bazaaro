# Performance (load test notes)

Tool: `simulator/http_load.py` (docs/SIMULATOR.md). Test: 50 concurrent users, run **inside** the Docker network, 40-60 s.

## Pehle (baseline)
| Naap | Nateeja |
|---|---|
| `GET /` (bina DB) | ~1,900 req/s (laptop se), ~980 req/s (Docker ke andar) |
| Asli traffic (login, cart, orders, DB) | **~89 req/s**, p50 80-470 ms, p95 400-1960 ms, 0 errors |
| CPU test ke dauran | server **100-120%** (ek core pura), MongoDB ~24% |

Nateeja: bottleneck network ya database nahi, Node ka single core tha. Har DB wali request mein bahut CPU lag raha tha.

## Wajah aur fix
| Wajah | Fix |
|---|---|
| Padhne wali queries (products) har document ka poora Mongoose object banati thin | `.lean()` (plain objects) products list/detail, cart, order mein |
| Har protected request par user DB se | 30 s ka in-memory auth cache (`AUTH_CACHE_SECONDS`, 0 = band) |
| `GET /cart`: har item ke liye alag product query + har baar save | Ek `$in` query, save sirf jab price badle |
| Node ek core | `cluster.js`: `WEB_CONCURRENCY` workers (Docker mein 4) ek port par |

Compromise: auth cache aur rate limit har worker ke memory mein hain. Role badalne ya user delete ka asar worker ke hisaab se 30 s tak der se ho sakta hai; rate limit ~N guna ho jati hai.
Lean ka matlab: purane products jinme `variants` field hi nahi, wahan `variants` undefined aata hai (code isse sambhalta hai).

## Baad (fix ke baad)
Wahi test, 50 workers: **89 -> 321 req/s (3.6 guna)**, errors 0.

| Naap (50 workers) | Pehle | Baad |
|---|---|---|
| Requests/second | 89 | **321** |
| `GET /products/:id` p50 / p95 | 188 ms / 842 ms | **5 ms / 25 ms** |
| `POST /orders` p50 / p95 | 467 ms / 1,962 ms | **16 ms / 66 ms** |

Workers barhane par (fix ke baad, Docker ke andar se, think time 0.3):

| Workers | Req/s | `products/:id` p50 / p95 | `POST /orders` p50 / p95 | Errors |
|---|---|---|---|---|
| 10 | 64 | 5 / 19 ms | 17 / 49 ms | 0 |
| 25 | 162 | 5 / 14 ms | 16 / 38 ms | 0 |
| 50 | 321 | 5 / 25 ms | 16 / 66 ms | 0 |
| 100 | 558 | 15 / 98 ms | 39 / 174 ms | 0 |
| 200 | **860** | 71 / 176 ms | 162 / 349 ms | 0 |

200 workers par ek minute mein ~55,000 requests aur ~1,600 orders, koi error nahi.

## Hadd kahan hai
200 workers ke dauran CPU: server **~400-445%** (4 workers = 4 cores pure bhare), MongoDB **~80-127%** (ek core ke qareeb; fix se pehle 24% tha).
Latency 10 se 50 workers tak lagbhag barabar rahi, 100 par barhna shuru hui. Ab server (4 cores) aur Mongo dono dabav mein hain.

Note: load generator bhi isi laptop par chalta hai (Docker, Windows aur Mongo ke saath), to alag machine par asli capacity thori zyada hogi.

## Agla step (agar aur chahiye)
- `WEB_CONCURRENCY` 6-8 (zyada cores), magar laptop ke baqi kaam ke saath compete karega.
- Mongo: queries par `explain()`, zaroori indexes (jaise `Product.category`, `Order.user + createdAt`).
- Rate limit aur auth cache ko Redis jaisi shared jagah par (abhi har worker ki apni).
- Load balancer ke peeche alag servers.

## Dobara naapna
```powershell
docker compose --profile streaming up -d --build server
docker compose --profile streaming run --rm --entrypoint python simulator /app/http_load.py run --base http://server:5000/api --workers 50 --duration 40 --think 0.3 --report after50.json
```
