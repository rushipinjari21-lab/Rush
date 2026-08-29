# PCMC BillPro — Cross-Platform Production Architecture & Deployment Guide

This guide details the complete cross-platform setup for **PCMC BillPro**, enabling all devices (**Android APK/AAB, iOS App, Web Browser, Tablet, Desktop**) to operate synchronously with a central **HTTPS Backend Server** and **MySQL Database**.

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ALL CLIENT DEVICES                              │
│   • Android APK / AAB (Phone & Tablet)                                 │
│   • iOS App (iPhone & iPad via Capacitor/WebKit)                       │
│   • Web Browser (Chrome, Safari, Edge, Firefox)                        │
│   • Desktop & Tablet PWA                                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST API (/api)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CENTRAL BACKEND SERVER                          │
│   • Node.js & Express API (Port 5000)                                  │
│   • Centralized JWT Authentication & Role-Based Access                 │
│   • MySQL Connection Pool (mysql2/promise)                             │
│   • Google Gemini AI (Schedule-B BOQ Multimodal Extraction)            │
│   • PCMC PWD Form 45 MB & RA Bill Generation Engines                   │
│   • CORS & Rate Limiting                                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ TCP / SQL (Port 3306)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL MYSQL DATABASE                         │
│   • `pcmc_billpro` Schema                                              │
│   • Users, Projects, BOQ Master, MB Books, RA Bills, Dakhala Records   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variables Configuration

### Backend (`backend/.env` or production environment)

| Variable | Description | Example (Production) |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend listening port | `5000` |
| `DB_HOST` | MySQL Server Host / IP | `127.0.0.1` or `rds.amazonaws.com` |
| `DB_PORT` | MySQL Port | `3306` |
| `DB_NAME` | Database Name | `pcmc_billpro` |
| `DB_USER` | MySQL User | `pcmc_user` |
| `DB_PASSWORD` | MySQL Password | `YourSecurePassword2026!` |
| `DB_CONNECTION_LIMIT`| Max Connection Pool | `30` |
| `AUTO_START_MYSQL` | Auto-start local XAMPP | `false` (Set `false` on Linux servers) |
| `JWT_SECRET` | Secret key for JWT | `64_char_secure_random_string` |
| `JWT_EXPIRES_IN` | Token expiration | `24h` |
| `CORS_ORIGIN` | Allowed web domains | `https://billing.pcmc.gov.in` |
| `GEMINI_API_KEY` | Google Gemini AI Key | `AQ.Ab8RN6KOye...` |

### Frontend (`frontend/.env` / Build time)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Default central API URL | `https://api.yourdomain.com/api` |

---

## 3. MySQL Database Setup Instructions

1. Log in to your MySQL terminal or phpMyAdmin on your central server:
   ```bash
   mysql -u root -p
   ```
2. Import the complete PCMC schema:
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
3. Create a dedicated MySQL user:
   ```sql
   CREATE USER 'pcmc_user'@'%' IDENTIFIED BY 'YourSecurePassword2026!';
   GRANT ALL PRIVILEGES ON pcmc_billpro.* TO 'pcmc_user'@'%';
   FLUSH PRIVILEGES;
   ```

---

## 4. Central Backend Deployment (Ubuntu / VPS / Cloud)

1. Clone the repository and install dependencies:
   ```bash
   cd backend
   npm install --production
   ```
2. Configure `.env` with production database credentials.
3. Start with PM2 Process Manager:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "pcmc-billpro-api"
   pm2 startup
   pm2 save
   ```
4. Setup Nginx Reverse Proxy with HTTPS (Certbot SSL):
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 50M;
       }
   }
   ```

---

## 5. Client Builds & Deployment

### A. Web Application Deployment
```powershell
cd frontend
$env:VITE_API_URL = "https://api.yourdomain.com/api"
npm run build
```
Deploy the generated `dist/` directory to Nginx, Netlify, Vercel, or AWS S3/CloudFront.

---

### B. Android APK & AAB (Google Play Store) Build
Prerequisites: JDK 21, Android Studio / SDK tools.

```powershell
cd frontend
$env:VITE_API_URL = "https://api.yourdomain.com/api"
npm run build
npx cap sync android

# Build Debug APK
cd android
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
.\gradlew assembleDebug

# Build Production AAB (App Bundle for Play Store)
.\gradlew bundleRelease
```

- **Debug APK**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk` (or root `PCMC-BillPro-debug.apk`)
- **Release AAB**: `frontend/android/app/build/outputs/bundle/release/app-release.aab`

---

### C. iOS Build Instructions (Mac with Xcode)
```bash
cd frontend
export VITE_API_URL="https://api.yourdomain.com/api"
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```
In Xcode: Select Team, Signing Certificate, and click **Product > Archive** to publish to Apple App Store or TestFlight.

---

## 6. Real-Time Diagnostics & Server URL Configurator

Field engineers and users can verify connectivity from any device:
1. **On Login Screen**: Tap the ⚙️ **Settings icon** to test or update the Central Server URL.
2. **In Header Bar**: The network icon provides a live 3-tier health check:
   - 🌐 **Internet Connection**
   - 🖥️ **Central Backend API** (with latency in ms)
   - 🗄️ **MySQL Database Status**

---

## 7. Health Check Endpoints

- **`GET /health`** or **`GET /api/health`**
- Example JSON response:
  ```json
  {
    "success": true,
    "status": "healthy",
    "message": "PCMC BillPro Central API is running",
    "internet": true,
    "backend": "connected",
    "database": "connected",
    "version": "1.0.0",
    "uptime": 1450,
    "timestamp": "2026-08-29T01:00:00.000Z"
  }
  ```
