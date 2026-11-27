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

## Dobara naapna
```powershell
docker compose --profile streaming up -d --build server
docker compose --profile streaming run --rm --entrypoint python simulator /app/http_load.py run --base http://server:5000/api --workers 50 --duration 40 --think 0.3 --report after50.json
```
Neeche "Baad" ka table apne numbers se bharo.

## Baad
| Naap | Nateeja |
|---|---|
| Asli traffic, 50 workers | (naap ke baad likho) |
