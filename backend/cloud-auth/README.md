# VyapaarOS Cloud Authentication Server

This folder is the deployment target for the diagram:

Electron App -> Login / Signup / OTP -> Node.js + Express + MongoDB -> User Database + License Database -> Owner Admin Panel

The Electron app currently uses `src/services/cloudAuthService.js` as a local desktop adapter with the same data concepts. When the cloud server is deployed, replace those localStorage calls with HTTP calls to these endpoints.

## Where to store MongoDB link

Create this file:

```text
backend/cloud-auth/.env
```

Put your MongoDB Atlas connection string there:

```text
PORT=8080
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/vyapaaros_auth?retryWrites=true&w=majority
OWNER_EMAIL=your-email@example.com
ALLOWED_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=Vyaapar OS <your-email@example.com>
```

Do not put `MONGODB_URI` in the React/Electron frontend `.env`. Frontend environment variables can be exposed in the app bundle. MongoDB credentials must stay on the backend server only.

If SMTP settings are present, `/auth/request-otp` emails the OTP to the user. If SMTP is missing, the server logs the OTP and returns `devOtp` for local development.

Use `backend/cloud-auth/.env.example` as the safe template.

## Run server

```bash
cd backend/cloud-auth
npm install
npm start
```

Check:

```text
http://localhost:8080/health
```

## Collections

- `users`: shopkeeper account, business profile, password hash, owner/shopkeeper role
- `licenses`: subscription status, trial end, paid-until date, device limit
- `devices`: Windows desktop device binding and last seen timestamp
- `otps`: login/signup OTP audit and expiry status

## API Shape

- `POST /auth/request-otp`
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/login-otp`
- `GET /admin/users`
- `GET /admin/licenses`
- `GET /admin/devices`
- `GET /admin/otps`
