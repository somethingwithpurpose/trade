# Database Setup Guide

## Step 1: Add Database URL to Environment

Add this to your `.env.local` file:

```env
DATABASE_URL=postgresql://postgres:JsKPmExZxXSNKEtCqtBYdotHDGLaHxcp@caboose.proxy.rlwy.net:32990/railway
GEMINI_API_KEY=your_gemini_key_here
```

## Step 2: Initialize Database Tables

You have two options:

### Option A: Use the API Endpoint (Recommended)

Visit: `http://localhost:3000/api/db/init` (POST request)

Or use curl:
```bash
curl -X POST http://localhost:3000/api/db/init
```

### Option B: Run SQL File Directly

Connect to your PostgreSQL database and run the SQL file:

```bash
psql postgresql://postgres:JsKPmExZxXSNKEtCqtBYdotHDGLaHxcp@caboose.proxy.rlwy.net:32990/railway -f database/schema.sql
```

## Step 3: Verify Setup

After initialization, your database will have:

- **trades** table - Stores all trade data
- **screenshots** table - Stores image metadata and URLs
- **chat_messages** table - Stores AI chat history

## Database Schema

The schema includes:
- UUID primary keys
- Proper indexes for performance
- Foreign key relationships
- Auto-updating timestamps
- JSONB fields for flexible data storage

## Notes

- Screenshots are stored as URLs (you'll need to host images separately or use a service like Cloudinary/S3)
- All timestamps are stored with timezone information
- The store will sync with the database automatically when you add/update/delete trades

