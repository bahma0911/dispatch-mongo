# Order Management and Delivery System (Negadras Dispatch Engine)

A complete, lightweight, full-stack dispatching and order management web platform designed for local delivery companies. 

This platform allows company dispatchers (Staff/Admins) to register customers, manage active driver fleets, track credit balances for corporate accounts, dispatch incoming delivery calls, trigger automated customer and driver SMS alerts, and compile business data into beautiful Excel reports.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, and Motion.
- **Backend**: Node.js, Express, TypeScript, and Bundled via `esbuild`.
- **Database**: MongoDB Atlas in production, with a local JSON fallback when `MONGODB_URI` is omitted.
- **Security**: JWT-based Authentication and password hashing via `bcryptjs`.
- **Integrations**: Excel compilation via SheetJS (`xlsx`) and Basic Auth Android SMS Gateway protocol.

---

## 📂 File Directory Layout
```
├── README.md               # Root-level project setup and instruction documentation
├── package.json            # Application dependencies and build scripts
├── vite.config.ts          # Vite asset bundling rules
├── tsconfig.json           # Global TypeScript settings
├── index.html              # HTML DOM entry-point
├── server.ts               # Custom Express server with Vite middleware integration
├── backend/                # Server-side architecture
│   ├── db.ts               # MongoDB Mongoose-like file persistence database
│   ├── middleware/
│   │   ├── auth.ts         # JWT security middleware
│   ├── models/
│   │   ├── User.ts         # Dispatcher admin schema
│   │   ├── Customer.ts     # Clients/Account Holders schema
│   │   ├── Driver.ts       # Fleet driver schema
│   │   └── Order.ts        # Dispatch order schema
│   ├── routes/
│   │   ├── auth.ts         # Credentials verification router
│   │   ├── customers.ts    # Accounts directory & settlements router
│   │   ├── drivers.ts      # Active fleet configuration router
│   │   ├── orders.ts       # Core dispatch workflow & Excel compiler router
│   │   └── sms.ts          # Simulated SMS transmission log router
│   └── utils/
│       ├── smsGateway.ts   # Automated SMS dispatcher utility
│       └── excelExport.ts  # Excel log binary compilers (xlsx)
└── frontend/               # Client-side React interface
    ├── App.tsx             # Main React application entry
    ├── main.tsx            # DOM Render mounting point
    ├── index.css           # Global Tailwind imports
    └── types.ts            # Client-side typescript interface declarations
```

---

## 💾 Core Schemas & Database Models

The local persistence file database (`/backend/db.ts`) mirrors standard MongoDB / Mongoose schemas.

### 1. `Customers` Profile
- `_id`: String (Unique identifier)
- `name`: String (Required)
- `phone`: String (Required, Unique phone collision check)
- `address`: String (Billing or Delivery Address)
- `type`: Enum `['NORMAL', 'ACCOUNT_HOLDER']`
- `creditBalance`: Number (Accumulates credit balance, defaults to `0.00`)

### 2. `Drivers` Fleet
- `_id`: String (Unique identifier)
- `name`: String (Required)
- `phone`: String (Required)
- `status`: Enum `['AVAILABLE', 'BUSY', 'INACTIVE']` (Defaults to `AVAILABLE`)

### 3. `Orders` Dispatch
- `_id`: String (Unique identifier)
- `orderNumber`: Number (Unique, auto-incrementing dispatcher reference starting at `1001`)
- `customer`: ObjectId Ref `Customers`
- `driver`: ObjectId Ref `Drivers`
- `pickupAddress`: String (Required pickup warehouse or store)
- `deliveryAddress`: String (Required dropoff residential address)
- `fee`: Number (Delivery fee value)
- `paymentType`: Enum `['CASH', 'CREDIT']`
- `paymentStatus`: Enum `['UNPAID', 'PAID', 'SETTLED']`
- `orderStatus`: Enum `['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED']`
- `createdAt`: ISO Date String

---

## 🔒 Security Gateways

1. **JWT Auth Verification**: 
   All client requests (excluding `/api/auth/login` and `/api/auth/register`) must append `Authorization: Bearer <JWT_TOKEN>` header.
2. **Password Cryptography**: 
   Hashed safely with `bcryptjs` before committing to the mock DB layer.

---

## 🌐 Android SMS Gateway Integration Specifications

Outgoing SMS are sent using an HTTP Basic Auth `POST` request matching the admin's Android SMS Gateway app credentials.

- **Endpoint**: `POST ${SMS_GATEWAY_ADDRESS}/v1/message/send`
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Basic Base64(SMS_GATEWAY_USERNAME:SMS_GATEWAY_PASSWORD)`
- **Body payload**:
  ```json
  {
    "phoneNumber": "...",
    "message": "...",
    "deviceId": "..."
  }
  ```
- **Fallback Simulation**: If environment variables are missing, the system prints the exact text layout to the server console and redirects logs to `/api/sms/logs` for real-time sandbox verification.

---

## 🚀 Setup & Local Execution Instructions

### 1. Configure Environment Variables (`.env`)
Create a `.env` file at the root of the project, or add these variables in Render:
```env
PORT=3000
NODE_ENV=production
APP_URL=https://nega.bahma.com.et
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@group.sovx7as.mongodb.net/?appName=nega
MONGODB_DB_NAME=nega
JWT_SECRET="replace-with-a-long-random-secret"

# Android SMS Gateway credentials
SMS_GATEWAY_ADDRESS="https://my-sms-gateway-endpoint.com"
SMS_GATEWAY_USERNAME="gateway-user"
SMS_GATEWAY_PASSWORD="gateway-password"
SMS_GATEWAY_DEVICE_ID="android-device-identifier-1"
```

## ☁️ Cloudflare + MongoDB Atlas Deployment

The application uses the supported split deployment model:

- **Cloudflare Pages** serves the Vite frontend and proxies `/api/*` through `functions/api/[[path]].ts`.
- **A Node.js host** (Render, Railway, Fly.io, or a VPS) runs the Express API and native MongoDB driver. Cloudflare Workers cannot run the native `mongodb` driver because Workers do not provide Node's TCP networking APIs.
- **MongoDB Atlas** stores all production data. Do not use the JSON fallback in production.

### 1. Deploy the API

Create a Node web service from this repository with:

- Build command: `npm ci && npm run build:server`
- Start command: `npm start`
- Health check: `/api/health`

Set these API environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster>/<database>?retryWrites=true&w=majority
MONGODB_DB_NAME=nega
JWT_SECRET=<long-random-secret>
```

Also set the optional `SMS_GATEWAY_*` variables when live SMS is required. Restrict the Atlas network access list to the API host's outbound IP when your host provides a stable address; otherwise use Atlas's documented deployment-provider access configuration.

### 2. Deploy the frontend to Cloudflare Pages

In Cloudflare Pages, connect this repository and use:

- Build command: `npm ci && npm run build:client`
- Build output directory: `dist`

Add the Pages environment variable `API_ORIGIN` containing the deployed API origin, for example `https://dispatch-api.example.com` (no trailing slash). The Pages Function forwards browser requests to that origin and preserves the request method, body, and authorization headers.

Alternatively, deploy from the CLI with `npm run deploy:pages` after authenticating Wrangler. Set `API_ORIGIN` in the Pages project before testing login.

### 3. First production login

The API seeds `admin` and `dispatch` with the temporary password `password123` on first startup. Change both passwords immediately after deployment using the application. The seed is stored in MongoDB, so it runs only when each account is absent.

### 2. Boot Up Development Servers
Launch both Vite and Express concurrent routing inside the sandbox or your console:
```bash
npm run dev
```

### 3. Open Dispatch Dashboard
Open your browser and navigate to:
```
http://localhost:3000
```

### 4. Live Login Credentials
Use the pre-seeded admin user details to bypass the authentication gate:
- **Username**: `admin`
- **Password**: `password123`
