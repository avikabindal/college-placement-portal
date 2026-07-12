# CareerConnect: Deployment Guide

This guide describes how to deploy the CareerConnect Placement and Internship Portal to production environments.

---

## 💾 1. Database Setup (Supabase)

Create a new project on [Supabase](https://supabase.com/). In the SQL Editor, execute the following schema queries to create the necessary tables, relationships, and attributes:

```sql
-- 1. Profiles Table (Holds role metadata for authentication)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('student', 'tpo', 'company')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Students Table (Extends profile data with academic info)
CREATE TABLE students (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  resume_url TEXT,
  cgpa NUMERIC(4,2),
  branch TEXT,
  batch_year INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Companies Table (Stores partner recruiter details)
CREATE TABLE companies (
  id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  website TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Opportunities Table (Job/Internship openings)
CREATE TABLE opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  stipend TEXT,
  location TEXT,
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Applications Table (Student applications)
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('applied', 'under_review', 'shared_with_company', 'shortlisted', 'assessment', 'interview', 'selected', 'rejected')) DEFAULT 'applied' NOT NULL,
  cover_note TEXT,
  resume_url TEXT,
  remarks TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  event_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(opportunity_id, student_id)
);

-- 6. Notifications Table (In-app logs and alerts)
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

---

## 🖥️ 2. Backend Deployment

You can host the Express API on servers such as **Render**, **Heroku**, or **Railway**.

### Render Configuration Steps
1. Create a new **Web Service** on Render and link it to your GitHub Repository.
2. Set the Environment/Language to **Node**.
3. Set the Build Command:
   ```bash
   cd backend && npm install
   ```
4. Set the Start Command:
   ```bash
   cd backend && node server.js
   ```
5. Add the following **Environment Variables** in Render's dashboard:
   * `PORT`: `10000` (Render handles port routing automatically)
   * `NODE_ENV`: `production`
   * `SUPABASE_URL`: *(Your Supabase Project API URL)*
   * `SUPABASE_ANON_KEY`: *(Your Supabase anon key)*
   * `SUPABASE_SERVICE_ROLE_KEY`: *(Your Supabase service role key, required to bypass RLS for administrative tasks like listing profiles)*

---

## 🌐 3. Frontend Deployment

You can host the React Single Page Application (SPA) on **Vercel**, **Netlify**, or **GitHub Pages**.

### Vercel Configuration Steps
1. Add a new project in Vercel and import your repository.
2. Select **Vite** as the framework preset (it will automatically configure build and output options).
3. Set the Root Directory to `frontend`.
4. Set the **Environment Variables** in Vercel's settings:
   * `VITE_API_URL`: *(URL of your deployed backend service, e.g., `https://your-backend.onrender.com`)*
5. Configure React Router rewrites to prevent 404 errors when reloading pages. Create a `vercel.json` file inside the `/frontend` directory:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Deploy the project.
