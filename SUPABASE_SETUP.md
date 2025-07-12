# Supabase Setup Guide

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 2: Create/Update Your .env File

Create a `.env` file in your project root with:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Check Project Status

### If your project is paused:
1. In the Supabase Dashboard, look for a "Resume" or "Unpause" button
2. Click it to wake up your project
3. Wait 1-2 minutes for it to fully start

### If your project is active but still not connecting:
1. Check the **Logs** section in your Supabase dashboard for errors
2. Verify your database is running in **Settings** → **General**
3. Try the SQL Editor to run a simple query: `SELECT 1;`

## Step 4: Database Setup

If this is a new project, you need to run the migrations:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/20250630214441_lively_river.sql`
3. Click "Run"
4. Then copy and paste the contents of `supabase/migrations/20250630214522_little_harbor.sql`
5. Click "Run"
6. Finally, copy and paste the contents of `supabase/migrations/20250704201812_yellow_forest.sql`
7. Click "Run"

## Step 5: Enable Authentication

1. Go to **Authentication** → **Settings**
2. Enable the providers you want (Google, LinkedIn, etc.)
3. Add your OAuth credentials if using social login

## Common Issues:

### "Connection timeout" errors:
- Project is likely paused - resume it in the dashboard
- Check your internet connection
- Verify the URL is correct (no typos)

### "Profile not found" errors:
- Run the database migrations (Step 4)
- Check that RLS policies are set up correctly

### "Invalid API key" errors:
- Double-check you copied the anon key correctly
- Make sure you're using the anon key, not the service role key

## Testing Your Setup:

After setting up, restart your development server:
```bash
npm run dev
```

The app should now connect to Supabase successfully!