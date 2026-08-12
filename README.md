# FUNDSROOM (ERP System)

A full-stack Enterprise Resource Planning (ERP) system designed for comprehensive business management, including inventory, sales, challan generation, and invoicing.

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS / Custom CSS
- **Routing**: React Router
- **State Management**: Zustand
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon Serverless)
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Media Storage**: Cloudinary (via Multer)

---

## Features

- **Role-Based Access Control**: Different permissions for Admin, Sales, Warehouse, and Accounts roles.
- **Product & Inventory Management**: Track current stock, minimum stock levels, and upload product images.
- **Sales & Orders**: Create sales orders, generate dispatch challans, and manage invoice status.
- **Customer Directory**: Manage customer details and track interactions.
- **Reporting**: Financial snapshots and balance reporting.

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require&channel_binding=require
JWT_SECRET=your_super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (if running locally):

```env
VITE_API_URL=http://localhost:5000/api
```
*(For production, set this in your Vercel or Cloudflare environment variables to point to your live backend URL).*

---

## Local Development Setup

### 1. Database Setup
Ensure you have a PostgreSQL database running (or a Neon database string). Run the schema found in `backend/schema.sql` to initialize your tables. You can also seed data using `node seed.js` in the backend folder.

### 2. Backend
```bash
cd backend
npm install
npm start
```
The backend API will be available at `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend will run at `http://localhost:5173`.

---

## Deployment Guides

### Frontend (Vercel or Cloudflare Pages)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Routing**: Handled by `vercel.json` (Vercel) or `public/_redirects` (Cloudflare Pages).
- **Env**: Make sure to add `VITE_API_URL` pointing to your backend URL.

### Backend (Render)
- **Environment**: Node
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node index.js`
- **Env**: Add all the variables from the Backend section above.

---

## Default Testing Accounts

All default roles share the password: **`admin123`**
- **Admin**: `admin`
- **Sales**: `sales`
- **Warehouse**: `warehouse`
- **Accounts**: `accounts`
