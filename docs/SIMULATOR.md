# Traffic Simulator

Do tareeqe hain, dono `simulator/` folder mein:

| | `http_load.py` (website se) | `simulate.py` (seedha Kafka mein) |
|---|---|---|
| Data kahan se guzarta hai | Asli website API: Mongo mein asli users/orders, backend khud Kafka events bhejta hai | Sirf Kafka (Mongo/website nahi chhuta) |
| Kis liye | End-to-end test, **website ki capacity** (latency, errors, req/s) | Purani history (din/hafte) aur riders ka data, ML training |
| Waqt | Sirf abhi (real time) | Guzre hue din bhi (backfill) |
| Card payment | Nahi (Stripe), sirf COD | Hai (simulated) |

Pehle `http_load.py` se pipeline test karo; ML ke liye history `simulate.py backfill` se banao.

---

# A) Website load simulator (`http_load.py`)

Sirf Python standard library, `pip install` nahi chahiye. Users register hote hain, admin categories/products banata hai,
users browse -> cart -> order dete hain, admin orders ko shipped -> delivered karta hai.

**Pehle:**
1. `server/.env` mein `RATE_LIMIT_DISABLED=true` (warna ek IP se 429 aayenge), aur `EVENTS_ENABLED=true` (Kafka events ke liye).
2. `docker compose --profile streaming up -d --build`
3. Ek admin account chahiye (tumhara apna admin).

```powershell
cd simulator
$env:SIM_ADMIN_PASSWORD="apna-admin-password"
python http_load.py setup --admin-email aap@gmail.com --users 200 --products 40
python http_load.py run --workers 10 --duration 120
```
- `setup`: categories + products admin se, 200 fake users (`sim.userN.xxx@bazaaro-sim.test`, password `SimPass#12345`). `sim_state.json` mein save (git mein nahi jata).
- `run`: report mein har endpoint ka p50/p95/p99 latency, status codes, 5xx errors aur total req/s. `load_report.json` mein bhi.
- Capacity dhoondna: `--workers 10`, phir 25, 50, 100 karte jao. Jab p95 latency bahut barh jaye ya 5xx aane lagein, wo tumhari hadd hai. `--think 0.1` se aur tez (stress) traffic.
- Order jaldi shipped/delivered hote hain (`--fulfil 15 45` second), taake status events bhi bante rahein.
- Ye sab asli data hai: Mongo mein users/orders/stock badalta hai. Saaf karna ho to admin panel se ya `docker compose down -v` (poora database saaf).

---

# B) Kafka history simulator (`simulate.py`)

Asli jaisa fake traffic (customers + riders) Kafka topics mein bhejta hai, taake pipeline aur ML ko data mile.
Events ka dhancha `docs/EVENTS.md` wala hi hai, bas `source` = `simulator`.

## Kya simulate hota hai
- **Customers:** page views, product views, search, cart add/remove, checkout, order (COD / card), payment success/fail, cancel.
- **Riders** (6 shehron mein ~44): assigned -> picked_up -> out_for_delivery -> delivered/failed, aur har `--ping-seconds` par `rider.location` (lat/lon, speed).
- **Stock:** order par kam, cancel par wapas, kam hone par restock.
- **Asli patterns:** raat ko kam / sham 8-11 peak, jumma-hafta aur mahine ke shuru/aakhir mein zyada, kuch products bahut popular, 18% din baarish.
- **ML ke liye signals:** free shipping (1000 se upar) cart abandonment kam karti hai; delivery mein delay baarish, peak ghanton, doori aur rider ke tajurbe se aata hai (`promised_minutes`, `actual_minutes`, `delay_minutes`).
- **Ganda data (jaan boojh kar, `--dirty 0.02` = 2%):** duplicate events, field gayab, price text mein ("1,200"), negative quantity, future date, toota hua JSON, city ki spelling/case, user_id null. Ye data quality checks (Chat 6) test karne ke liye hai. `--truth-log` mein likha jata hai kaunsa event kyun kharab kiya (answer key).

## Chalana

Laptop par Python se:
```powershell
cd simulator
pip install -r requirements.txt
python simulate.py backfill --days 14 --brokers localhost:29092     # 2 hafte ki history
python simulate.py live --brokers localhost:29092 --speed 30         # abhi se, 30x tez
```
Bina Kafka ke test (file mein):
```powershell
python simulate.py backfill --days 3 --out sample.jsonl --truth-log truth.jsonl
```
Docker se (live mode):
```powershell
docker compose --profile streaming --profile simulator up -d
docker compose logs -f simulator
```
Docker mein backfill:
```powershell
docker compose --profile streaming run --rm simulator backfill --days 14 --brokers kafka:9092
```

## Options
| Option | Default | Matlab |
|---|---|---|
| `--days` | 14 | backfill: kitne din pehle se |
| `--sessions-per-day` | 3000 | roz ke sessions (~200 orders/din) |
| `--users` | 2000 | fake users |
| `--dirty` | 0.02 | kharab events ka hissa (0 = saaf) |
| `--ping-seconds` | 60 | rider location ka gap (kam = zyada events) |
| `--speed` | 1 | live: 60 = 1 sec mein 1 minute |
| `--seed` | 42 | same seed = same data |

Note: products/users fake hain (apne ids), Mongo ke asli products se nahi jude. Analytics event ke andar ke naam/price se hoti hai.
Backfill ke aakhir mein jo orders abhi delivery mein hain, unke baqi events nahi bheje jate (jaise asli system mein).
Volume: 14 din ~ 800k events (zyada tar rider.location). Kam chahiye to `--ping-seconds 180`.
