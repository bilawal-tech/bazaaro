# Bazaaro Events (Kafka)

Backend ke har important kaam ka ek event Kafka mein jata hai. Ye data pipeline (S3 bronze -> Spark -> Postgres) ka source hai.

## Chalana

```powershell
docker compose --profile streaming up -d     # Kafka (localhost:29092) + Kafka UI (http://localhost:8080)
```
`server/.env` mein `EVENTS_ENABLED=true` karo, phir server restart (`docker compose up -d --build server`).
Server laptop par chal raha ho to `KAFKA_BROKERS=localhost:29092`; Docker mein compose khud `kafka:9092` deta hai.
`EVENTS_ENABLED=false` (default) par app bilkul pehle jaisi chalti hai. Kafka band ho to bhi API fail nahi hoti (event chupchap drop, warning log).

Dekhna: Kafka UI -> Topics -> bazaaro.orders -> Messages. Ya terminal se:
```powershell
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic bazaaro.orders --from-beginning
```

## Envelope (har event ka dhancha)

```json
{
  "event_id": "uuid",
  "event_type": "order.created",
  "schema_version": 1,
  "occurred_at": "2026-11-26T10:20:40.694Z",
  "source": "api",
  "user_id": "mongo user id ya null",
  "data": { }
}
```
- `event_id` dedupe ke liye (Kafka at-least-once hai, duplicates aa sakte hain).
- `occurred_at` event time hai (processing time nahi), UTC ISO.
- `schema_version` badlne par purane events todne ke bajaye version barhao.
- Message key: order events ke liye order id, cart/click ke liye user (ya session) id, stock ke liye product id. Is se ek order/user ke events ek partition mein, sahi tarteeb se.

## Topics aur events

| Topic | event_type | Kab | data (mukhya fields) |
|---|---|---|---|
| bazaaro.clicks | page_view, product_view, search, click | Frontend har page par | session_id, path, product_id, query, target, referrer, user_agent |
| bazaaro.cart | cart.item_added | Add to cart | product_id, color, size, quantity, unit_price, cart_quantity |
| bazaaro.cart | cart.item_removed, cart.cleared | Cart se hatana | item_id |
| bazaaro.orders | order.created | Order place | order_id, status, payment_method, payment_status, items_price, shipping_price, total_price, city, items[] |
| bazaaro.orders | order.status_changed | Admin/customer/auto-cancel | upar wala + previous_status, changed_by (admin, customer, system_unpaid_timeout) |
| bazaaro.payments | payment.succeeded, payment.failed, payment.refunded | Stripe webhook | order_id, amount, method / reason |
| bazaaro.inventory | stock.changed | Order par stock kam, cancel par wapas | product_id, color, size, quantity, delta (- ya +), reason (order_reserved, order_cancelled) |
| bazaaro.delivery | rider.location, delivery.status_changed | Step 3 ka simulator | (Rider feature aane par backend se bhi) |

Order save fail hone par stock rollback hota hai, uska event nahi bhejte (net effect zero).
Clickstream endpoint: `POST /api/events` (type: page_view, product_view, search, click). Login zaroori nahi.

## Baad ke kaam
- Step 3: simulator in topics mein asli jaisa traffic bhejega.
- Chat 5: Kafka -> S3 bronze (partition by date).
- Dedupe `event_id` par, silver layer mein.
