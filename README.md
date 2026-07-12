# CareerConnect: College Placement Portal

> 🌐 **Live Demo:** [college-placement-portal-9sorlgu5c-career-connect1.vercel.app](https://college-placement-portal-9sorlgu5c-career-connect1.vercel.app)


CareerConnect is a modern, full-stack placement and internship tracking web application. It simplifies communication between TPO (Training & Placement Officer) Administrators, Partner Company Recruiters, and Students.

The platform streamlines application submissions, vacancy announcements, interview statuses, real-time alert logs, and system analytics in a responsive dashboard.

---

## 🚀 Key Features

* **Premium Theme Engine:** Sleek Dark Mode, glassmorphism card highlights, and micro-interactions.
* **Role-Based Workspaces:**
  * **Students:** Explore job boards, apply to opportunities, upload resume URLs, and view active interview status cycles.
  * **Company Recruiters:** Post vacancies, view applications, download CVs, and move applicants through status funnels.
  * **TPO Administrators:** Create partner company credentials, manage students, review applications, and view analytics.
* **Responsive Sidebar & Navigation:** Collapsible layout on desktops and mobile devices (using hamburger toggle in the top header).
* **Inline PDF Resume Previewer:** Fully integrated modal viewer that auto-converts Google Drive share links into live preview embeds on-the-fly.
* **Live Notifications System:** Tracks status events (such as shortlisted, interview scheduled, selected) and posts instant notification logs in the top header menu.
* **Robust Test Suite:** Offline integration tests for Auth and Application endpoints with mocked database calls.

---

## 🛠️ Technology Stack

* **Frontend:** React (Vite), Tailwind CSS, React Router v6, Material Symbols, Axios, Context API.
* **Backend:** Node.js (Express), Supabase Database (PostgreSQL), Supabase Auth.
* **Testing:** Jest, Supertest.

---

## ⚙️ Local Setup Instructions

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* A [Supabase](https://supabase.com/) Account & Project

---

### 1. Database Setup (Supabase)
Create the required tables inside your Supabase SQL Editor. You can view the list of schema definitions and structure in the [Deployment Guide](docs/DEPLOYMENT.md).

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/backend` folder:
   ```env
   PORT=5001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Start the development server:
   ```bash
   node server.js
   ```

---

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5001
   ```
4. Start the Vite server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Running Unit Tests

We use Jest and Supertest to verify API routes. Tests are mocked and run offline without needing a live connection to the database.

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Run the test suite:
   ```bash
   npm run test
   ```

---

## 📖 Additional Documentation

* **[API Documentation](docs/API.md):** Comprehensive list of REST endpoints, request bodies, response schemas, and role permission restrictions.
* **[Deployment Guide](docs/DEPLOYMENT.md):** Complete guide for staging hosting configuration, PostgreSQL table setups, and environment production builds.
