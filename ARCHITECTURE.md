# UnEarthed Architecture & Call Stack Documentation

This document describes the architectural boundaries, folder responsibilities, and end-to-end execution call stacks for **UnEarthed Part 2** (Database Integration & Architecture Tracing).

---

## 1. End-to-End Execution Call Stack Trace (`GET /gifts`)

Below is the tree-nested execution trace mapping an incoming client HTTP GET request through all 6 architectural tiers down to PostgreSQL execution and back.

```
Execution Call Stack Trace:
└── [Project] Client Browser / Frontend (http://localhost:5173 or Express static server)
    ├── [Configuration/Env] PORT=3001, PGHOST=dpg-daott9942hec7385t2ag-a.ohio-postgres.render.com
    └── [Folder] client/public/scripts / server/routes
        └── [File] server.js
            └── [Class] Express Application Instance (app)
                └── [Method] app.use('/gifts', giftsRouter)
                    ├── [Variable State Shift] Inbound HTTP Request: req.method = 'GET', req.url = '/gifts'
                    └── [Folder] server/routes
                        └── [File] server/routes/gifts.js
                            └── [Class] Express Router Instance (router)
                                └── [Method] router.get('/', GiftsController.getGifts)
                                    └── [Folder] server/controllers
                                        └── [File] server/controllers/gifts.js
                                            └── [Class] Controller Module (GiftsController)
                                                └── [Method] getGifts(req: Request, res: Response)
                                                    ├── [Variable State Shift] Initial State: results = undefined
                                                    └── [Folder] server/config
                                                        └── [File] server/config/database.js
                                                            └── [Class] pg.Pool Instance (pool)
                                                                └── [Method] pool.query('SELECT * FROM gifts ORDER BY id ASC')
                                                                    ├── [Variable State Shift] SQL Query Executed: queryText = 'SELECT * FROM gifts ORDER BY id ASC'
                                                                    ├── [Project] Remote PostgreSQL Database (Render Cloud PostgreSQL)
                                                                    ├── [Variable State Shift] Raw DB Response: results.rows = [ { id: 1, name: "Disco Ball Candle", ... }, ... ]
                                                                    └── [Method] res.status(200).json(results.rows)
                                                                        └── [Variable State Shift] Mutated HTTP Response Payload: res.statusCode = 200, res.body = JSON array of 9 gift objects
```

---

## 2. Folder & File-Level Traceability Matrix

| Folder | File | Primary Responsibility & Boundary |
| :--- | :--- | :--- |
| `server/config` | `dotenv.js` | Loads environment variables (`PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE`) from `server/.env` into `process.env`. |
| `server/config` | `database.js` | Instantiates and exports a singleton `pg.Pool` connection pool configured with SSL (`rejectUnauthorized: false`). |
| `server/config` | `reset.js` | Database provision and reset script. Drops existing `gifts` table, creates schema with column constraints, and seeds rows from static gift data. |
| `server/controllers` | `gifts.js` | Asynchronous business logic handler. Queries PostgreSQL via connection pool (`pool.query`) and handles HTTP responses (`200 OK` or `409 Conflict`). |
| `server/routes` | `gifts.js` | Express Router mapping endpoint paths (`/` and `/:giftId`) to controller functions and static HTML page views. |
| `server/data` | `gifts.js` | Source array of static seed gift items used during database reset and seeding automation. |
| `server/` | `server.js` | Express server entry point. Serves static files, mounts routes, and listens on configured `PORT`. |

---

## 3. Class, Method & Variable State Execution Lifecycles

### Connection Pool Lifecycle
1. **Config Input State**:
   ```javascript
   {
     user: process.env.PGUSER,        // 'unearthed_2033_user'
     password: process.env.PGPASSWORD, // '<PGPASSWORD>'
     host: process.env.PGHOST,        // 'dpg-daott9942hec7385t2ag-a.ohio-postgres.render.com'
     port: process.env.PGPORT,        // '5432'
     database: process.env.PGDATABASE,// 'unearthed_2033'
     ssl: { rejectUnauthorized: false }
   }
   ```
2. **Instance Lifecycle**: `new pg.Pool(config)` transforms parameters into a managed connection pool.
3. **Execution & Transformation State**:
   - `pool.query('SELECT * FROM gifts ORDER BY id ASC')` acquires an active client connection from the pool.
   - Raw database tuple rows are fetched from Render PostgreSQL and returned as JavaScript objects inside `results.rows`.
   - Controller passes `results.rows` to `res.status(200).json(results.rows)` delivering HTTP JSON output to the caller.
