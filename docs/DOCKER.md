# Running Bazaaro with Docker

One command starts MongoDB, the API and the website.

## Quick start

```
docker compose up --build
```

| Service  | URL                     |
|----------|-------------------------|
| Website  | http://localhost:5173   |
| API      | http://localhost:5000   |
| MongoDB  | localhost:27017         |

Your keys (JWT secret, Stripe, SMTP, Google) are read from `server/.env`. Only `MONGO_URI` is replaced,
because inside Docker the database host is called `mongo`.
The website reads `client/.env` while it is being built (Stripe publishable key, Google client ID).
If you change `client/.env`, rebuild with `docker compose up --build`.

Common commands:

```
docker compose up -d          # run in the background
docker compose logs -f server # follow API logs
docker compose down           # stop (data is kept)
docker compose down -v        # stop and delete the database
```

## First-time setup

**1. Stop the old MongoDB container** (it uses the same port 27017):

```
docker stop bazaaro-mongo
```

**2. (Optional) Move your old data** into the new database. Skip this if you are happy to start fresh.

```
docker start bazaaro-mongo
docker exec bazaaro-mongo mongodump --db bazaaro --archive=/tmp/bazaaro.archive
docker cp bazaaro-mongo:/tmp/bazaaro.archive ./bazaaro.archive
docker stop bazaaro-mongo
docker compose up -d mongo
docker compose cp ./bazaaro.archive mongo:/tmp/bazaaro.archive
docker compose exec mongo mongorestore --archive=/tmp/bazaaro.archive --nsInclude="bazaaro.*"
```

Delete `bazaaro.archive` afterwards. It contains real user data and must not be committed.

**3. Start everything:**

```
docker compose up --build
```

**4. Demo products** (only if the shop is empty):

```
docker compose exec server node scripts/seedDemo.js
```

**5. Make an admin** (register on the website first). PowerShell:

```
docker compose exec mongo mongosh bazaaro --eval "db.users.updateOne({email:'you@example.com'},{`$set:{role:'admin'}})"
```

## Developing with hot reload

Docker only for the database, the code runs on your machine:

```
docker compose up -d mongo
cd server && npm run dev
cd client && npm run dev
```

Keep `MONGO_URI=mongodb://localhost:27017/bazaaro` in `server/.env` for this mode.
Do not run this and the full stack at the same time, they use the same ports.

## Troubleshooting

- **port is already allocated:** another process uses 27017, 5000 or 5173. Stop the old `bazaaro-mongo` container
  or the local `npm run dev` servers.
- **server exits right away:** `docker compose logs server`. Usually `JWT_SECRET` is missing in `server/.env`.
- **website shows old code:** `docker compose up --build`.
- **images are missing after a fresh clone:** uploaded images live in `server/uploads` and are not in git.

## What is inside

- `server/Dockerfile`: Node 22, production dependencies only, runs as a non-root user.
- `client/Dockerfile`: builds the Vite app, then serves the static files with nginx (`client/nginx.conf`).
- `docker-compose.yml`: three services (`mongo`, `server`, `client`) with health checks. The server waits for MongoDB.
- Kafka, Postgres and Airflow are added in the next steps of the data engineering work.

## C: drive full hai? Docker ka data D: par le jao

Docker Desktop (WSL2) saara data (Mongo, Kafka, images) ek bari disk file mein C: par rakhta hai.
Docker Desktop -> Settings -> Resources -> Advanced -> **Disk image location** -> `D:\DockerData` -> Apply & restart.
Ye option na dikhe to Docker Desktop update karo (naye versions mein hai).
Move ke baad C: ki purani file khud hat jati hai. Bade data (Kafka, simulator) ke liye ye zaroori hai.
Check: `docker system df`.
