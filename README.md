# Nimbus Drive — Cloud Storage (MERN)

Production-ready cloud file storage and sharing service built with MongoDB, Express, React, and Node.js.

## Project Overview

Nimbus Drive lets users upload, organize, share, and recover files with Drive-like workflows: nested folders, trash, starring, search, user sharing (Viewer/Editor), and password/expiry-protected public links. Files are stored in AWS S3 (or local disk for development) behind short-lived signed URLs.

## Features

- JWT auth (register/login/logout/refresh) + Google OAuth-ready architecture
- Nested folders with breadcrumbs
- Direct-to-S3 (or local) upload with quota enforcement
- Soft delete / restore / permanent delete
- Starred items, full-text-style search with filters
- Share with registered users (VIEWER / EDITOR) + Brevo notification emails
- Public links with optional password + expiry
- Activity tracking and admin-ready USER/ADMIN roles
- Responsive React UI (Tailwind, TanStack Query, Dropzone)

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, Tailwind CSS, React Router, Axios, TanStack Query, React Dropzone |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt, Helmet, rate limiting |
| Storage | AWS S3 (SDK v3) or local filesystem |
| Database | MongoDB |

## Architecture

```text
React (Vite)  --JWT-->  Express API  --metadata-->  MongoDB
                         |--signed URL-->  S3 / local storage
```

Upload flow:

1. `POST /api/files/init-upload` → signed upload URL + pending metadata  
2. Client uploads to S3 (or `POST /api/files/local-upload`)  
3. `POST /api/files/complete-upload` → finalize + quota update  

## Folder Structure

See `cloud-storage/backend` and `cloud-storage/frontend` for the modular layout (controllers, services, models, pages, hooks).

## Installation

```bash
# Backend
cd cloud-storage/backend
cp .env.example .env
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

## Environment Setup

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Strong secret for tokens |
| `S3_BUCKET_NAME` | S3 bucket (e.g. `mailot-s3-bucket`) |
| `AWS_MAILOT_REGION` | AWS region for the bucket |
| `AWS_MAILOT_ACCESS_KEY_ID` | IAM access key (backend only) |
| `AWS_MAILOT_SECRET_ACCESS_KEY` | IAM secret key (backend only) |
| `BREVO_API_KEY` | Brevo transactional API key (backend only) |
| `BREVO_SENDER_EMAIL` | Verified sender email in Brevo |
| `BREVO_SENDER_NAME` | Sender display name (default: Nimbus Cloud Drive) |

### Frontend (`frontend/.env`)

```text
VITE_API_URL=http://localhost:5000/api
```

## Database Setup

1. Install and start MongoDB locally, or use Atlas.  
2. Set `MONGODB_URI` in `backend/.env`.  
3. Indexes are defined on Mongoose models and created automatically in development.

## AWS S3 Setup

Files are stored in **AWS S3** using short-lived signed URLs. Credentials stay on the backend only — never in React / `VITE_*` vars.

1. Create an S3 bucket (example: `mailot-s3-bucket`).
2. Create an IAM user with least privilege: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:HeadObject` on that bucket.
3. Set backend environment variables (local `.env` or Railway/Render dashboard):

```env
S3_BUCKET_NAME=mailot-s3-bucket
AWS_MAILOT_REGION=ap-south-1
AWS_MAILOT_ACCESS_KEY_ID=your-access-key
AWS_MAILOT_SECRET_ACCESS_KEY=your-secret-key
```

4. Restart the backend. Startup fails with a clear error if any of these are missing (except in `NODE_ENV=test`).
5. Upload flow: `init-upload` → browser `PUT` to signed S3 URL → `complete-upload` → MongoDB metadata.

Do **not** commit `.env` or real AWS keys to Git.
## Brevo Setup

Transactional share emails are sent from the **backend only** via the Brevo API (`@getbrevo/brevo`). Never put `BREVO_API_KEY` in the frontend.

1. Create a [Brevo](https://www.brevo.com/) account.
2. Open **SMTP & API** settings and generate an **API key** (not an SMTP key).
3. Add/verify a sender identity (`BREVO_SENDER_EMAIL`).
4. For production, authenticate your sending domain and add the DNS records Brevo provides.
5. Set backend env vars:

```env
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=Nimbus Cloud Drive
CLIENT_URL=http://localhost:5173
```

6. Restart the backend. Startup logs show `Brevo email: configured` when keys are present.
7. Test (development only, authenticated):

```http
POST /api/dev/test-email
Authorization: Bearer <token>
Content-Type: application/json

{ "email": "you@example.com" }
```

Share flow: after `POST /api/shares` succeeds in MongoDB, the API sends a FILE_SHARE / FOLDER_SHARE email. If Brevo fails, the share remains and the response includes `emailSent: false` with a clear message.

## Running Backend

```bash
cd cloud-storage/backend
npm run dev
```

Health check: `GET http://localhost:5000/health`

## Running Frontend

```bash
cd cloud-storage/frontend
npm run dev
```

Open `http://localhost:5173`

## API Documentation

See [backend/README.md](./backend/README.md) for endpoint details.

## Testing

```bash
cd cloud-storage/backend
npm test
```

## Deployment

- Backend: Node host (Railway, Render, EC2) with MongoDB Atlas + S3  
- Frontend: static build (`npm run build`) on Vercel/Netlify/CloudFront  
- Set production `JWT_SECRET`, HTTPS, and restrictive CORS `CLIENT_URL`

## Security

- Passwords hashed with bcrypt  
- JWT auth; refresh token rotation (hashed at rest)  
- Helmet, CORS, rate limits on auth/upload/public links  
- Backend permission checks for OWNER / EDITOR / VIEWER  
- Signed URLs; no permanent public S3 object URLs  
- Input validation via express-validator  

## Future Improvements

- Full multipart upload for very large files  
- Admin dashboard UI  
- Real-time presence / collaboration (out of MVP scope)  
- Virus scanning on upload  

## License

MIT
