#!/usr/bin/env python3
"""Bazaaro website load simulator: asli users ki tarah website ki API chalata hai.

Users register hote hain, admin categories/products banata hai, users browse -> cart -> order dete hain,
admin orders ko shipped -> delivered karta hai. Ye sab asli backend se guzarta hai, isliye:
  * MongoDB mein asli data banta hai
  * backend khud Kafka events bhejta hai (EVENTS_ENABLED=true ho to)
  * latency / errors / requests-per-second naap kar website ki capacity pata chalti hai

Zaroori: server/.env mein RATE_LIMIT_DISABLED=true (warna ek IP se 429 aayenge) aur ek admin account.
Card payment (Stripe) skip hai, sirf COD orders. Sirf Python standard library, pip install nahi chahiye.

  set SIM_ADMIN_PASSWORD=...                       (PowerShell: $env:SIM_ADMIN_PASSWORD="...")
  python http_load.py setup --admin-email aap@gmail.com --users 200 --products 40
  python http_load.py run --workers 20 --duration 300
"""
import argparse
import heapq
import json
import os
import random
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict

STATE_FILE = "sim_state.json"
PASSWORD = "SimPass#12345"
CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan"]
CATS = {
    "Men Clothing": (["Shirt", "Jeans", "Hoodie", "Jacket", "Kurta"], ["S", "M", "L", "XL"], (900, 4500)),
    "Women Clothing": (["Dress", "Kurti", "Abaya", "Top", "Shawl"], ["S", "M", "L"], (1200, 6500)),
    "Shoes": (["Sneakers", "Sandals", "Boots", "Loafers"], ["40", "41", "42", "43"], (2500, 9500)),
    "Accessories": (["Watch", "Wallet", "Backpack", "Sunglasses"], ["One Size"], (600, 8000)),
}
COLORS = ["Black", "White", "Blue", "Red", "Green", "Grey"]
SEARCHES = ["shirt", "shoes", "watch", "dress", "bag", "jacket"]

# ── Metrics ──────────────────────────────────
lock = threading.Lock()
lat = defaultdict(list)           # endpoint -> [seconds]
codes = defaultdict(Counter)      # endpoint -> {status: count}
events = Counter()                # business counters (orders placed, carts abandoned ...)


class Api:
    def __init__(self, base):
        self.base = base.rstrip("/")

    def call(self, method, path, body=None, token=None, name=None, timeout=30):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method)
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if token:
            req.add_header("Authorization", f"Bearer {token}")
        t0 = time.perf_counter()
        status, payload = 0, {}
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                status, raw = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, raw = e.code, e.read()
        except Exception:
            status, raw = 0, b""  # connection error / timeout
        dt = time.perf_counter() - t0
        try:
            payload = json.loads(raw) if raw else {}
        except ValueError:
            payload = {}
        key = name or f"{method} {path.split('?')[0]}"
        with lock:
            lat[key].append(dt)
            codes[key][status] += 1
        return status, payload


# ── Setup: admin se category/products, users register ──
def setup(a):
    api = Api(a.base)
    pw = a.admin_password or os.environ.get("SIM_ADMIN_PASSWORD")
    if not (a.admin_email and pw):
        sys.exit("Admin email aur password chahiye (--admin-email, aur SIM_ADMIN_PASSWORD env).")
    s, d = api.call("POST", "/auth/login", {"email": a.admin_email, "password": pw}, name="admin login")
    if s != 200 or d.get("user", {}).get("role") != "admin":
        sys.exit(f"Admin login fail (status {s}). Email/password aur role=admin check karo.")
    admin = d["token"]
    rng = random.Random(a.seed)

    cats = {}
    for name in list(CATS)[: a.categories]:
        s, d = api.call("POST", "/category/create", {"name": name, "description": f"{name} (simulator)"}, admin)
        if s == 201:
            cats[name] = d["category"]["_id"]
    if len(cats) < len(list(CATS)[: a.categories]):  # kuch pehle se hain
        s, d = api.call("GET", "/category/all")
        for c in d.get("AllCategories", []):
            if c["name"] in CATS:
                cats[c["name"]] = c["_id"]
    print(f"Categories: {len(cats)}")

    products = []
    names = [(c, n) for c, (ns, _, _) in CATS.items() if c in cats for n in ns]
    for i in range(a.products):
        cat, base = names[i % len(names)]
        _, sizes, (lo, hi) = CATS[cat]
        price = round(rng.uniform(lo, hi) / 50) * 50
        variants = [{"color": c, "sizes": [{"size": sz, "stock": a.stock, "price": price,
                                            "costPrice": int(price * 0.7), "discountPrice": 0} for sz in sizes]}
                    for c in rng.sample(COLORS, rng.randint(2, 3))]
        body = {"name": f"{base} {rng.choice(['Classic', 'Urban', 'Pro', 'Lite', 'Max'])} {i + 1}", "brand": "Bazaaro",
                "description": "Simulator product", "category": cats[cat], "variants": variants}
        s, d = api.call("POST", "/products", body, admin)
        p = d.get("product")
        if s in (200, 201) and p:
            products.append({"id": p["_id"], "variants": [{"color": v["color"], "sizes": [x["size"] for x in v["sizes"]]}
                                                         for v in variants]})
        else:
            print(f"  product fail ({s}): {d.get('message')}")
    print(f"Products: {len(products)}")

    users, ulock, run_id = [], threading.Lock(), "%x" % int(time.time())

    def reg(idx_list):
        for n in idx_list:
            email = f"sim.user{n}.{run_id}@bazaaro-sim.test"
            body = {"name": f"Sim User {n}", "email": email, "password": PASSWORD,
                    "phone": "03" + "".join(rng_t.choice("0123456789") for _ in range(9))}
            s, d = api.call("POST", "/auth/register", body, name="POST /auth/register")
            if s == 201:
                with ulock:
                    users.append({"email": email, "token": d["token"], "city": rng_t.choice(CITIES), "n": n})
    rng_t = random.Random(a.seed + 1)
    ths = [threading.Thread(target=reg, args=(range(i, a.users, 8),)) for i in range(8)]
    [t.start() for t in ths]
    [t.join() for t in ths]
    print(f"Users: {len(users)} (register ke latency neeche)")
    json.dump({"base": a.base, "admin": {"email": a.admin_email, "token": admin}, "products": products,
               "users": users}, open(a.state, "w"), indent=1)
    print(f"Saved: {a.state}")
    report()


# ── Run: traffic ─────────────────────────────
def customer_loop(api, st, a, stop, pending, plock, rng):
    products = st["products"]
    while not stop.is_set():
        u = rng.choice(st["users"])
        tok = u["token"]
        think = lambda: stop.wait(rng.uniform(0.3, 1.5) * a.think)

        def go(m, p, b=None, name=None):
            nonlocal tok
            s, d = api.call(m, p, b, tok, name)
            if s == 401:  # token expire: dobara login
                s2, d2 = api.call("POST", "/auth/login", {"email": u["email"], "password": PASSWORD}, name="POST /auth/login")
                if s2 == 200:
                    tok = u["token"] = d2["token"]
                    s, d = api.call(m, p, b, tok, name)
            return s, d

        sid = "%016x" % rng.getrandbits(64)
        go("POST", "/events", {"type": "page_view", "sessionId": sid, "path": "/"})
        go("GET", "/products?limit=12", name="GET /products")
        think()
        if rng.random() < 0.25:
            q = rng.choice(SEARCHES)
            go("GET", f"/products?search={q}", name="GET /products?search")
            go("POST", "/events", {"type": "search", "sessionId": sid, "path": f"/shop?search={q}", "query": q})
        viewed = []
        for _ in range(rng.choice([1, 2, 2, 3, 4])):
            p = rng.choice(products)
            viewed.append(p)
            go("GET", f"/products/{p['id']}", name="GET /products/:id")
            go("POST", "/events", {"type": "product_view", "sessionId": sid, "path": f"/product/{p['id']}", "productId": p["id"]})
            think()
        added = 0
        for p in viewed:
            if rng.random() < 0.35:
                v = rng.choice(p["variants"])
                s, d = go("POST", "/cart", {"productId": p["id"], "color": v["color"], "size": rng.choice(v["sizes"]),
                                            "quantity": 1 if rng.random() < 0.8 else 2}, name="POST /cart")
                added += s in (200, 201)
                think()
        if not added:
            continue
        go("GET", "/cart", name="GET /cart")
        if rng.random() > a.checkout_rate:
            events["cart_abandoned"] += 1
            go("DELETE", "/cart", name="DELETE /cart")
            continue
        city = u["city"]
        s, d = go("POST", "/orders", {"PaymentMethod": "COD", "orderNote": "sim", "shippingAddress": {
            "fullName": "Sim Customer", "phone": "03001234567", "street": f"House {rng.randint(1, 400)}, Street {rng.randint(1, 30)}",
            "city": city, "zip": "54000"}}, name="POST /orders")
        if s == 201:
            events["orders_placed"] += 1
            oid = d["order"]["_id"]
            with plock:
                heapq.heappush(pending, (time.time() + rng.uniform(*a.fulfil), oid, "shipped", tok))
        else:
            events["orders_failed"] += 1
            go("DELETE", "/cart", name="DELETE /cart")
        stop.wait(rng.uniform(0.5, 2) * a.think)


def admin_loop(api, st, a, stop, pending, plock, rng):
    token = st["admin"]["token"]
    while not stop.is_set():
        item = None
        with plock:
            if pending and pending[0][0] <= time.time():
                item = heapq.heappop(pending)
        if not item:
            stop.wait(0.5)
            continue
        _, oid, nxt, utok = item
        if nxt == "shipped" and rng.random() < 0.05:  # customer apna order cancel kar deta hai
            s, _ = api.call("PUT", f"/orders/{oid}/cancel", {}, utok, "PUT /orders/:id/cancel")
            events["orders_cancelled_by_customer"] += s == 200
            continue
        s, _ = api.call("PUT", f"/orders/{oid}/status", {"status": nxt}, token, "PUT /orders/:id/status")
        if s == 200 and nxt == "shipped":
            events["orders_shipped"] += 1
            with plock:
                heapq.heappush(pending, (time.time() + rng.uniform(*a.fulfil), oid, "delivered", utok))
        elif s == 200:
            events["orders_delivered"] += 1


def run(a):
    st = json.load(open(a.state))
    if not st["users"] or not st["products"]:
        sys.exit("State khali hai. Pehle `setup` chalao.")
    api, stop, pending, plock = Api(a.base or st["base"]), threading.Event(), [], threading.Lock()
    ths = [threading.Thread(target=customer_loop, args=(api, st, a, stop, pending, plock, random.Random(i)), daemon=True)
           for i in range(a.workers)]
    ths.append(threading.Thread(target=admin_loop, args=(api, st, a, stop, pending, plock, random.Random(999)), daemon=True))
    print(f"{a.workers} workers, {a.duration}s (ramp {a.ramp}s). Ctrl+C se jaldi band.")
    t0 = time.time()
    try:
        for i, t in enumerate(ths):
            t.start()
            if a.ramp and i < a.workers:
                time.sleep(a.ramp / a.workers)
        while time.time() - t0 < a.duration:
            time.sleep(5)
            n = sum(len(v) for v in lat.values())
            err = sum(c for k in codes for s, c in codes[k].items() if s == 0 or s >= 500)
            print(f"  {int(time.time() - t0):>4}s | requests {n:,} | orders {events['orders_placed']} | 5xx/conn errors {err}")
    except KeyboardInterrupt:
        pass
    stop.set()
    time.sleep(1)
    report(time.time() - t0, a.report)


def pct(xs, p):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(len(xs) * p))] * 1000


def report(elapsed=None, path=None):
    rows, out = [], {"endpoints": {}, "business": dict(events)}
    total = errs = 0
    for k in sorted(lat):
        xs, c = lat[k], codes[k]
        bad = sum(n for s, n in c.items() if s == 0 or s >= 500)
        total, errs = total + len(xs), errs + bad
        rows.append((k, len(xs), pct(xs, .5), pct(xs, .95), pct(xs, .99), bad, dict(c)))
        out["endpoints"][k] = {"count": len(xs), "p50_ms": round(pct(xs, .5), 1), "p95_ms": round(pct(xs, .95), 1),
                               "p99_ms": round(pct(xs, .99), 1), "server_errors": bad, "status_codes": {str(s): n for s, n in c.items()}}
    print(f"\n{'Endpoint':<28}{'count':>8}{'p50ms':>9}{'p95ms':>9}{'p99ms':>9}{'5xx':>6}  status codes")
    for r in rows:
        print(f"{r[0]:<28}{r[1]:>8}{r[2]:>9.0f}{r[3]:>9.0f}{r[4]:>9.0f}{r[5]:>6}  {r[6]}")
    if elapsed:
        out["summary"] = {"seconds": round(elapsed), "requests": total, "rps": round(total / elapsed, 1), "server_errors": errs}
        print(f"\nTotal {total:,} requests in {elapsed:.0f}s = {total / elapsed:.1f} req/s, server errors: {errs}")
    if events:
        print("Business:", dict(events))
    if any(429 in c for c in codes.values()):
        print("NOTE: 429 aaye: server/.env mein RATE_LIMIT_DISABLED=true karo aur server restart.")
    if path:
        json.dump(out, open(path, "w"), indent=1)
        print(f"Report saved: {path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("setup", help="admin se categories/products + users register")
    s.add_argument("--base", default="http://localhost:5000/api")
    s.add_argument("--admin-email")
    s.add_argument("--admin-password", help="behtar hai env SIM_ADMIN_PASSWORD use karo")
    s.add_argument("--users", type=int, default=200)
    s.add_argument("--products", type=int, default=40)
    s.add_argument("--categories", type=int, default=4)
    s.add_argument("--stock", type=int, default=200, help="har size ka shuru ka stock")
    s.add_argument("--seed", type=int, default=7)
    s.add_argument("--state", default=STATE_FILE)
    r = sub.add_parser("run", help="traffic chalao + capacity report")
    r.add_argument("--base", default=None)
    r.add_argument("--workers", type=int, default=10, help="ek waqt mein kitne customers")
    r.add_argument("--duration", type=int, default=120)
    r.add_argument("--ramp", type=int, default=20, help="workers itne second mein dheere dheere shuru hon")
    r.add_argument("--think", type=float, default=1.0, help="insaan ki sochne ki raftaar (0.1 = bahut tez, stress test)")
    r.add_argument("--checkout-rate", type=float, default=0.45, help="cart wale kitne order tak jayein")
    r.add_argument("--fulfil", type=float, nargs=2, default=[15, 45], metavar=("MIN", "MAX"),
                   help="order shipped/delivered hone mein second (asli mein ghante, yahan tez)")
    r.add_argument("--report", default="load_report.json")
    r.add_argument("--state", default=STATE_FILE)
    a = ap.parse_args()
    {"setup": setup, "run": run}[a.cmd](a)


if __name__ == "__main__":
    main()
