#!/usr/bin/env python3
"""Bazaaro traffic simulator: asli jaisa traffic Kafka topics mein bhejta hai.

Customers (clicks, cart, orders, payments) aur riders (location, delivery status).
Events ka dhancha docs/EVENTS.md wala hi hai (source = "simulator").

Modes:
  backfill  guzre hue N din ki history jaldi se (ML training / pipeline test ke liye)
  live      abhi se real-time (--speed 60 ka matlab 1 sec mein 1 minute ka traffic)

Misalen:
  python simulate.py backfill --days 14 --out sample.jsonl          # Kafka ke bagair, file mein
  python simulate.py backfill --days 30 --brokers localhost:29092   # Kafka mein
  python simulate.py live --brokers localhost:29092 --speed 30
"""
import argparse
import heapq
import itertools
import json
import math
import random
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone

TOPICS = {
    "clicks": "bazaaro.clicks", "cart": "bazaaro.cart", "orders": "bazaaro.orders",
    "payments": "bazaaro.payments", "inventory": "bazaaro.inventory", "delivery": "bazaaro.delivery",
}
PKT = timedelta(hours=5)  # Pakistan local time = UTC+5

# city: (lat, lon, order weight, rider count)
CITIES = {
    "Karachi": (24.8607, 67.0011, 0.30, 12), "Lahore": (31.5204, 74.3587, 0.28, 12),
    "Islamabad": (33.6844, 73.0479, 0.14, 6), "Rawalpindi": (33.5651, 73.0169, 0.10, 5),
    "Faisalabad": (31.4504, 73.1350, 0.10, 5), "Multan": (30.1575, 71.5249, 0.08, 4),
}
# local ghante ke hisab se traffic ka wazan (raat ko kam, sham 8-11 par peak)
HOUR_W = [1, 0.6, 0.4, 0.3, 0.3, 0.5, 1, 2, 3, 4, 4.5, 5, 5, 4.5, 4.5, 5, 5.5, 6, 7, 8.5, 9, 8.5, 6, 3]
HOUR_W = [w / sum(HOUR_W) for w in HOUR_W]

CATEGORIES = {  # naam: (price range, sizes, product count)
    "Men Clothing": ((900, 4500), ["S", "M", "L", "XL"], 14),
    "Women Clothing": ((1200, 6500), ["S", "M", "L"], 14),
    "Shoes": ((2500, 9500), ["40", "41", "42", "43"], 10),
    "Electronics": ((1500, 45000), [None], 12),
    "Home": ((600, 8000), [None], 10),
}
COLORS = ["Black", "White", "Blue", "Red", "Green", "Grey"]
REFERRERS = ["google", "instagram", "facebook", "direct", "direct", "direct", "whatsapp"]


def hexid(rng):
    return "%024x" % rng.getrandbits(96)


def poisson(rng, lam):
    if lam <= 0:
        return 0
    if lam > 30:
        return max(0, int(round(rng.gauss(lam, math.sqrt(lam)))))
    l, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= rng.random()
        if p <= l:
            return k
        k += 1


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + "%03dZ" % (dt.microsecond // 1000)


class Sim:
    def __init__(self, a):
        self.a = a
        self.rng = random.Random(a.seed)
        self.heap, self.seq = [], itertools.count()
        self.sent = 0
        self.sink = Sink(a)
        self.build_world()
        self.weather = {}  # (city, date) -> baarish hai ya nahi

    # ── Duniya: products, users, riders ──────
    def build_world(self):
        r, a = self.rng, self.a
        self.products = []
        for cat, (pr, sizes, n) in CATEGORIES.items():
            for i in range(n):
                price = round(r.uniform(*pr) / 50) * 50
                stock = {(c, s): r.randint(40, 160) for c in r.sample(COLORS, 3) for s in sizes}
                self.products.append({"id": hexid(r), "name": f"{cat.split()[0]} Item {i + 1}",
                                      "category": cat, "price": price, "stock": stock})
        # popularity Zipf jaisi: kuch products bahut zyada bikte hain
        self.pop = [1 / (i + 1) ** 0.9 for i in range(len(self.products))]
        r.shuffle(self.pop)
        cw = [v[2] for v in CITIES.values()]
        self.users = [{"id": hexid(r), "city": r.choices(list(CITIES), cw)[0],
                       "pay_card": r.random() < 0.3, "buyer": r.random() ** 2,  # zyada log kam kharidte hain
                       "fav": r.choice(list(CATEGORIES))} for _ in range(a.users)]
        self.riders = {}
        n = 0
        for c, v in CITIES.items():
            self.riders[c] = []
            for _ in range(v[3]):
                n += 1
                self.riders[c].append({"id": "R%03d" % n, "exp": round(r.uniform(0.5, 6), 1), "bike": r.random() < 0.8,
                                       "free_at": datetime.min.replace(tzinfo=timezone.utc)})

    def rain(self, city, ts):
        k = (city, (ts + PKT).date())
        if k not in self.weather:
            self.weather[k] = self.rng.random() < 0.18
        return self.weather[k]

    # ── Event bhejna (heap se, taake future events sahi waqt par jayein) ──
    def emit(self, ts, topic, etype, data, key, user_id=None, send_delay=0.0):
        ev = {"event_id": str(uuid.UUID(int=self.rng.getrandbits(128), version=4)), "event_type": etype,
              "schema_version": 1, "occurred_at": iso(ts), "source": "simulator",
              "user_id": user_id, "data": data}
        heapq.heappush(self.heap, (ts + timedelta(seconds=send_delay), next(self.seq), topic, str(key), ev))

    def flush_until(self, now):
        while self.heap and self.heap[0][0] <= now:
            _, _, topic, key, ev = heapq.heappop(self.heap)
            for item in self.dirty(topic, key, ev):
                self.sink.send(*item)
                self.sent += 1

    # ── Ganda data (jaan boojh kar), data quality checks test karne ke liye ──
    def dirty(self, topic, key, ev):
        p, r = self.a.dirty, self.rng
        if p <= 0 or r.random() >= p:
            return [(topic, key, json.dumps(ev))]
        kind = r.choice(["duplicate", "missing_field", "bad_type", "negative_qty", "future_time",
                         "bad_json", "city_case", "null_user"])
        self.sink.truth(ev["event_id"], kind, topic)
        e = json.loads(json.dumps(ev))
        d = e["data"]
        if kind == "duplicate":
            return [(topic, key, json.dumps(ev))] * 2
        if kind == "missing_field" and d:
            d.pop(r.choice(list(d)))
        elif kind == "bad_type":
            for f in ("total_price", "amount", "unit_price", "quantity"):
                if f in d:
                    d[f] = f"{d[f]:,}" if isinstance(d[f], (int, float)) else d[f]
                    break
        elif kind == "negative_qty":
            for f in ("quantity", "delta"):
                if f in d and isinstance(d[f], (int, float)):
                    d[f] = -abs(d[f]) if f == "quantity" else d[f]
                    break
        elif kind == "future_time":
            e["occurred_at"] = iso(datetime.now(timezone.utc) + timedelta(days=r.randint(2, 400)))
        elif kind == "bad_json":
            return [(topic, key, json.dumps(ev)[:-r.randint(5, 25)])]
        elif kind == "city_case" and "city" in d and d["city"]:
            d["city"] = r.choice([d["city"].lower(), d["city"].upper(), " " + d["city"] + " "])
        elif kind == "null_user":
            e["user_id"] = None
        return [(topic, key, json.dumps(e))]

    # ── Ek customer session ──────────────────
    def session(self, t0):
        r = self.rng
        user = r.choice(self.users) if r.random() < 0.65 else None
        uid = user["id"] if user else None
        sid = hexid(r)
        t = t0
        ref = r.choice(REFERRERS)

        def click(etype, path, **extra):
            nonlocal t
            t += timedelta(seconds=r.randint(3, 50))
            d = {"session_id": sid, "path": path, "product_id": extra.get("product_id"), "query": extra.get("query"),
                 "target": extra.get("target"), "referrer": ref if etype == "page_view" and path == "/" else None,
                 "user_agent": r.choice(["Mozilla/5.0 (Android)", "Mozilla/5.0 (iPhone)", "Mozilla/5.0 (Windows NT 10.0)"])}
            self.emit(t, TOPICS["clicks"], etype, d, uid or sid, uid)

        click("page_view", "/")
        if r.random() < 0.8:
            click("page_view", "/shop")
        if r.random() < 0.25:
            click("search", "/shop?search=shirt", query=r.choice(["shirt", "shoes", "phone", "lamp", "dress", "watch"]))

        viewed = []
        for _ in range(poisson(r, 2.2)):
            pr = self.pick_product(user)
            viewed.append(pr)
            click("product_view", f"/product/{pr['id']}", product_id=pr["id"])
        if not user or not viewed:
            return

        cart = []
        for pr in viewed:
            if r.random() < 0.08 + 0.14 * user["buyer"]:
                color, size = r.choice(list(pr["stock"]))
                qty = 1 if r.random() < 0.8 else r.randint(2, 3)
                t += timedelta(seconds=r.randint(5, 60))
                line = {"product": pr, "color": color, "size": size, "quantity": qty}
                cart.append(line)
                self.emit(t, TOPICS["cart"], "cart.item_added",
                          {"product_id": pr["id"], "color": color, "size": size, "quantity": qty,
                           "unit_price": pr["price"], "cart_quantity": qty}, uid, uid)
        if not cart:
            return
        if len(cart) > 1 and r.random() < 0.15:
            gone = cart.pop(r.randrange(len(cart)))
            t += timedelta(seconds=r.randint(5, 40))
            self.emit(t, TOPICS["cart"], "cart.item_removed", {"item_id": hexid(r)}, uid, uid)

        items_price = sum(l["product"]["price"] * l["quantity"] for l in cart)
        # free shipping 1000 se upar: shipping lagti ho to log zyada chhor dete hain
        p_checkout = 0.22 + 0.30 * user["buyer"] + (0.12 if items_price > 1000 else -0.08)
        if r.random() >= p_checkout:
            return  # cart abandon (koi event nahi: abandonment baad mein derive hoga)
        click("page_view", "/checkout")
        t += timedelta(seconds=r.randint(30, 240))
        self.place_order(t, user, cart, items_price)

    def pick_product(self, user):
        r = self.rng
        pool = [i for i, p in enumerate(self.products) if p["category"] == user["fav"]] if user and r.random() < 0.4 \
            else range(len(self.products))
        i = r.choices(list(pool), [self.pop[i] for i in pool])[0]
        return self.products[i]

    # ── Order ki poori zindagi: payment, stock, rider, delivery ──
    def place_order(self, t, user, cart, items_price):
        r = self.rng
        uid, oid, city = user["id"], hexid(r), user["city"]
        # stock check (asli server ki tarah atomic reserve)
        for l in cart:
            if l["product"]["stock"][(l["color"], l["size"])] < l["quantity"]:
                return
        shipping = 0 if items_price > 1000 else 200
        method = "Credit Card" if user["pay_card"] else "COD"
        items = [{"product_id": l["product"]["id"], "name": l["product"]["name"], "color": l["color"],
                  "size": l["size"], "quantity": l["quantity"], "price": l["product"]["price"]} for l in cart]
        base = {"order_id": oid, "payment_method": method, "items_price": items_price,
                "shipping_price": shipping, "total_price": items_price + shipping, "city": city, "items": items}

        def order_ev(ts, status, prev, by):
            d = dict(base, status=status, payment_status="Pending")
            if prev:
                d.update(previous_status=prev, changed_by=by)
            self.emit(ts, TOPICS["orders"], "order.created" if not prev else "order.status_changed", d, oid, uid)

        order_ev(t, "processing", None, None)
        for l in cart:
            self.stock_change(t, l, -l["quantity"], "order_reserved")

        # payment
        paid = method == "COD"
        if method == "Credit Card":
            tp = t + timedelta(seconds=r.randint(30, 200))
            if r.random() < 0.9:
                paid = True
                self.emit(tp, TOPICS["payments"], "payment.succeeded",
                          {"order_id": oid, "amount": base["total_price"], "method": "card"}, oid, uid)
            else:
                self.emit(tp, TOPICS["payments"], "payment.failed",
                          {"order_id": oid, "amount": base["total_price"], "method": "card"}, oid, uid)
        if not paid or r.random() < 0.04:  # payment fail (30 min baad auto-cancel) ya customer ne cancel kiya
            tc = t + timedelta(minutes=30 if not paid else r.randint(5, 600))
            by = "system_unpaid_timeout" if not paid else "customer"
            order_ev(tc, "cancelled", "processing", by)
            for l in cart:
                self.stock_change(tc, l, l["quantity"], "order_cancelled")
            return

        # processing -> shipped (admin)
        ts = t + timedelta(minutes=r.randint(20, 600))
        order_ev(ts, "shipped", "processing", "admin")
        self.deliver(ts, oid, uid, city, base, order_ev, cart, method)

    def deliver(self, ts, oid, uid, city, base, order_ev, cart, method):
        r = self.rng
        riders = self.riders[city]
        rider = min(riders, key=lambda x: x["free_at"])  # sab se jaldi free rider
        start = max(ts, rider["free_at"]) + timedelta(minutes=r.randint(2, 15))
        dist = round(r.uniform(1.5, 18), 1)
        raining = self.rain(city, start)
        local_h = ((start + PKT).hour)
        peak = 1 if 12 <= local_h <= 14 or 18 <= local_h <= 21 else 0
        speed = (24 if rider["bike"] else 17) * (0.75 if raining else 1) * (0.85 if peak else 1) * (0.9 + 0.03 * rider["exp"])
        promised = int(dist / 22 * 60 + 20)  # customer ko jo wada kiya gaya
        actual = max(8, int(dist / speed * 60 + r.uniform(5, 25) + (10 if r.random() < 0.1 else 0)))
        common = {"order_id": oid, "rider_id": rider["id"], "city": city, "distance_km": dist}
        self.emit(start, TOPICS["delivery"], "delivery.status_changed",
                  dict(common, status="assigned", promised_minutes=promised, is_raining=raining), oid, uid)
        pick = start + timedelta(minutes=r.randint(3, 12))
        self.emit(pick, TOPICS["delivery"], "delivery.status_changed", dict(common, status="picked_up"), oid, uid)
        self.emit(pick, TOPICS["delivery"], "delivery.status_changed", dict(common, status="out_for_delivery"), oid, uid)
        lat0, lon0 = CITIES[city][0] + r.uniform(-.05, .05), CITIES[city][1] + r.uniform(-.05, .05)
        bearing = r.uniform(0, 2 * math.pi)
        lat1 = lat0 + dist / 111 * math.cos(bearing)
        lon1 = lon0 + dist / 111 * math.sin(bearing) / math.cos(math.radians(lat0))
        steps = max(1, int(actual * 60 / self.a.ping_seconds))
        for i in range(1, steps):
            f = i / steps
            self.emit(pick + timedelta(seconds=i * self.a.ping_seconds), TOPICS["delivery"], "rider.location",
                      {"rider_id": rider["id"], "order_id": oid, "lat": round(lat0 + (lat1 - lat0) * f + r.gauss(0, 3e-4), 6),
                       "lon": round(lon0 + (lon1 - lon0) * f + r.gauss(0, 3e-4), 6),
                       "speed_kmh": round(max(0, r.gauss(speed, 4)), 1)}, rider["id"])
        done = pick + timedelta(minutes=actual)
        rider["free_at"] = done
        failed = r.random() < 0.03  # customer nahi mila
        self.emit(done, TOPICS["delivery"], "delivery.status_changed",
                  dict(common, status="failed" if failed else "delivered", promised_minutes=promised, actual_minutes=actual,
                       delay_minutes=actual - promised, is_raining=raining), oid, uid)
        if failed:
            order_ev(done, "cancelled", "shipped", "admin")
            for l in cart:
                self.stock_change(done, l, l["quantity"], "order_cancelled")
        else:
            d = dict(base, status="delivered", payment_status="Completed", previous_status="shipped", changed_by="admin")
            self.emit(done, TOPICS["orders"], "order.status_changed", d, oid, uid)
            if method == "COD":
                pass  # COD ka paisa delivery par milta hai (payment_status Completed upar)

    def stock_change(self, ts, line, delta, reason):
        pr = line["product"]
        pr["stock"][(line["color"], line["size"])] += delta
        d = {"product_id": pr["id"], "color": line["color"], "size": line["size"],
             "quantity": line["quantity"], "delta": delta, "reason": reason}
        self.emit(ts, TOPICS["inventory"], "stock.changed", d, pr["id"])
        left = pr["stock"][(line["color"], line["size"])]
        if left < 10:  # admin restock
            add = self.rng.randint(60, 150)
            pr["stock"][(line["color"], line["size"])] += add
            self.emit(ts + timedelta(hours=self.rng.randint(2, 30)), TOPICS["inventory"], "stock.changed",
                      dict(d, quantity=add, delta=add, reason="restock"), pr["id"])

    # ── Main loop ────────────────────────────
    def run(self, start, end, live):
        a, r = self.a, self.rng
        t = start
        step = timedelta(minutes=1)
        last_log = time.time()
        while t < end:
            local = t + PKT
            weekend = 1.25 if local.weekday() in (4, 5) else 1.0  # jumma/hafta
            payday = 1.3 if local.day in (1, 2, 28, 29, 30) else 1.0
            lam = a.sessions_per_day * HOUR_W[local.hour] / 60 * weekend * payday
            for _ in range(poisson(r, lam)):
                self.session(t + timedelta(seconds=r.uniform(0, 60)))
            t += step
            if live:
                wait = 60 / a.speed
                self.flush_until(t)
                time.sleep(wait)
            elif t.minute == 0:
                self.flush_until(t)
            if time.time() - last_log > 5:
                print(f"  ... {t:%Y-%m-%d %H:%M} | {self.sent:,} events", file=sys.stderr)
                last_log = time.time()
        self.flush_until(end if not live else t)
        self.sink.close()
        print(f"Done: {self.sent:,} events bheje. Baqi {len(self.heap):,} future events (in-flight orders) chhor diye.",
              file=sys.stderr)


class Sink:
    def __init__(self, a):
        self.f = open(a.out, "w", encoding="utf-8") if a.out else None
        self.truth_f = open(a.truth_log, "w", encoding="utf-8") if a.truth_log else None
        self.p = None
        if not self.f:
            from confluent_kafka import Producer
            self.p = Producer({"bootstrap.servers": a.brokers, "linger.ms": 50, "compression.type": "gzip",
                               "queue.buffering.max.messages": 500000})

    def send(self, topic, key, value):
        if self.f:
            self.f.write(f"{topic}\t{key}\t{value}\n")
            return
        while True:
            try:
                self.p.produce(topic, key=key, value=value)
                self.p.poll(0)
                return
            except BufferError:
                self.p.poll(0.5)

    def truth(self, event_id, kind, topic):
        if self.truth_f:
            self.truth_f.write(json.dumps({"event_id": event_id, "kind": kind, "topic": topic}) + "\n")

    def close(self):
        if self.p:
            self.p.flush(30)
        for f in (self.f, self.truth_f):
            if f:
                f.close()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=["backfill", "live"])
    ap.add_argument("--days", type=int, default=14, help="backfill: kitne din pehle se")
    ap.add_argument("--users", type=int, default=2000)
    ap.add_argument("--sessions-per-day", type=int, default=3000, help="~4%% sessions order tak jate hain")
    ap.add_argument("--ping-seconds", type=int, default=60, help="rider location kitne second baad")
    ap.add_argument("--dirty", type=float, default=0.02, help="kharab events ka hissa (0 = bilkul saaf)")
    ap.add_argument("--speed", type=float, default=1, help="live: 1 = real time, 60 = 1 sec mein 1 minute")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--brokers", default="localhost:29092")
    ap.add_argument("--out", help="Kafka ki jagah is file mein likho (topic<TAB>key<TAB>json)")
    ap.add_argument("--truth-log", help="kaunsa event kyun kharab kiya gaya (data quality test ka answer key)")
    a = ap.parse_args()

    now = datetime.now(timezone.utc).replace(second=0, microsecond=0)
    sim = Sim(a)
    if a.mode == "backfill":
        start, end = now - timedelta(days=a.days), now
        print(f"Backfill: {start:%Y-%m-%d %H:%M} se {end:%Y-%m-%d %H:%M} UTC", file=sys.stderr)
        sim.run(start, end, live=False)
    else:
        print("Live mode shuru (Ctrl+C se band)", file=sys.stderr)
        try:
            sim.run(now, now + timedelta(days=3650), live=True)
        except KeyboardInterrupt:
            sim.sink.close()
            print(f"\nBand. {sim.sent:,} events bheje.", file=sys.stderr)


if __name__ == "__main__":
    main()
