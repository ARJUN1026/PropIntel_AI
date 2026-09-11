# 🚀 PropIntel AI Deployment Guide

Complete step-by-step guide to deploying **PropIntel AI** to production:
- **Frontend**: [Vercel](https://vercel.com)
- **Backend**: [Render](https://render.com) or [Railway](https://railway.app)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) (Free Tier)

---

## Architecture Overview

```
┌──────────────────────────────────────┐
│       Frontend (Vercel)              │
│       https://propintel.vercel.app   │
└──────────────────┬───────────────────┘
                   │
                   │ HTTPS API Calls (VITE_API_URL)
                   ▼
┌──────────────────────────────────────┐
│       Backend (Render / Railway)     │
│  https://propintel-api.onrender.com  │
└──────────────────┬───────────────────┘
                   │
                   │ Mongoose Connection (MONGODB_URI)
                   ▼
┌──────────────────────────────────────┐
│      MongoDB Atlas (Cloud M0 Free)   │
│ mongodb+srv://.../propintel          │
└──────────────────────────────────────┘
```

---

## Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

Since `localhost:27017` is only on your local computer, you need a cloud database for production:

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in.
2. Create a **Free Shared Cluster (M0)**.
3. In **Security > Database Access**:
   - Create a database user (e.g., username `propintel_user`, secure password).
   - Set role to `Read and write to any database`.
4. In **Security > Network Access**:
   - Click **Add IP Address** -> select **Allow Access from Anywhere** (`0.0.0.0/0`).
5. In **Database > Clusters**:
   - Click **Connect** -> **Drivers** -> Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/propintel?retryWrites=true&w=majority
   ```
   *(Replace `<username>` and `<password>` with your database user credentials).*

---

## Step 2: Deploy Backend to Render or Railway

### Option A: Deploy to Render (Recommended & Free)

1. Push your repository to GitHub / GitLab.
2. Log in to [dashboard.render.com](https://dashboard.render.com).
3. Click **New +** -> **Web Service** -> connect your repository.
4. Fill in the settings:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. In **Environment Variables**, add:
   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production environment |
   | `PORT` | `10000` | Render port (auto-handled) |
   | `MONGODB_URI` | `mongodb+srv://...` | Your Atlas string from Step 1 |
   | `JWT_SECRET` | `a-very-long-random-secret-key-12345` | Secure secret |
   | `JWT_EXPIRES_IN` | `7d` | Token expiry |
   | `CORS_ORIGIN` | `https://*.vercel.app,http://localhost:5173` | Add your Vercel URL once known |
   | `AI_PROVIDER` | `mock` or `gemini` | `mock` (offline) or `gemini` |
   | `AI_API_KEY` | `your-gemini-api-key` | Required if `AI_PROVIDER=gemini` |
   | `AI_MODEL` | `gemini-2.0-flash` | Gemini model |
6. Click **Deploy Web Service**.
7. Once deployed, note your backend URL (e.g., `https://propintel-api.onrender.com`).
   - Test it by visiting `https://propintel-api.onrender.com/health` in your browser. You should see `{"success":true,"message":"PropIntel AI API is running","code":"OK"}`.

---

### Option B: Deploy to Railway

1. Log in to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository -> click **Configure**.
4. Set **Root Directory** to `/server`.
5. In **Variables**, add the same environment variables listed above (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `AI_PROVIDER`, etc.).
6. In **Settings > Networking**, click **Generate Domain** to get a public URL (e.g., `https://propintel-production.up.railway.app`).

---

## Step 3: Deploy Frontend to Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project** -> import your GitHub repository.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-backend-name.onrender.com/api` |
   *(Point to your backend URL with `/api` at the end)*
5. Click **Deploy**.
6. Once deployed, Vercel will give you a live domain (e.g., `https://propintel.vercel.app`).

---

## Step 4: Link Frontend and Backend (CORS)

Now that you have your Vercel frontend URL:
1. Go back to your backend on **Render** or **Railway**.
2. Update the `CORS_ORIGIN` environment variable to include your Vercel domain:
   ```text
   CORS_ORIGIN=https://propintel.vercel.app,https://propintel-*.vercel.app,http://localhost:5173
   ```
3. Save changes (Render/Railway will automatically redeploy).

---

## Step 5: (Optional) Seed Initial Data into Production

To populate your cloud database with properties, sample leads, and admin accounts:

Run the seed script from your local machine targeting your cloud MongoDB Atlas database:

```bash
# In your local terminal:
cd server
$env:MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/propintel?retryWrites=true&w=majority"
npm run seed
```

*(On Mac/Linux, use `MONGODB_URI="..." npm run seed`)*

---

## 🛠️ Verification & Troubleshooting Checklist

- [ ] **Backend Health**: Visit `https://your-backend.onrender.com/health` -> returns `{ "success": true }`.
- [ ] **Frontend Login**: Open `https://your-app.vercel.app/login` -> enter credentials.
- [ ] **Deep Links / Page Refresh**: Navigate to `/assistant` and hit browser refresh (Vercel `rewrites` prevent 404s).
- [ ] **CORS Errors**: If browser console shows `blocked by CORS policy`, verify `CORS_ORIGIN` in backend matches your frontend URL exactly (including `https://`).
- [ ] **Cold Starts on Render Free Tier**: Render free tier services spin down after 15 minutes of inactivity and take ~30–50 seconds to wake up on the first request.
