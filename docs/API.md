# CareerConnect: API Reference

This document maps all REST API endpoints available in the CareerConnect backend service. All request and response bodies are serialized in JSON format.

---

## 🔒 Base Headers
Except for Public endpoints, all requests must include the JWT bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_session_token>
```

---

## 👤 Authentication Endpoints (`/users`)

### 1. User Registration
* **Endpoint:** `POST /users/register`
* **Access:** Public (Student self-registration or TPO setup)
* **Description:** Creates a user in Supabase Auth and inserts their profile meta. Only accounts ending with `@jietjodhpur.ac.in` domain are accepted.
* **Request Body:**
  ```json
  {
    "name": "Alex Johnson",
    "email": "alex@jietjodhpur.ac.in",
    "password": "securepassword123",
    "role": "student",
    "tpo_key": ""
  }
  ```
  *(Note: TPO registration requires passing the server's private TPO key in `tpo_key`)*
* **Success Response (201):**
  ```json
  {
    "message": "User registered successfully! A confirmation link has been sent to your email. Please verify it before logging in.",
    "user": {
      "id": "7bf3b934-ef35-4e02",
      "email": "alex@jietjodhpur.ac.in"
    }
  }
  ```

### 2. User Login
* **Endpoint:** `POST /users/login`
* **Access:** Public
* **Description:** Logs in credentials, returning session token. If the user is a `company` recruiter, checks if their company profile state `is_active` is true.
* **Request Body:**
  ```json
  {
    "email": "alex@jietjodhpur.ac.in",
    "password": "securepassword123"
  }
  ```
* **Success Response (200):**
  ```json
  {
    "message": "Login successful",
    "token": "jwt_access_token_string",
    "user": {
      "id": "7bf3b934-ef35-4e02",
      "email": "alex@jietjodhpur.ac.in",
      "name": "Alex Johnson",
      "role": "student"
    }
  }
  ```

### 3. Get Authenticated User Meta
* **Endpoint:** `GET /users/me`
* **Access:** Authenticated (Any role)
* **Description:** Retrieves profile data for the active session.
* **Success Response (200):**
  ```json
  {
    "id": "7bf3b934-ef35-4e02",
    "role": "student",
    "name": "Alex Johnson",
    "email": "alex@jietjodhpur.ac.in"
  }
  ```

---

## 💼 Recruitment Listings (`/opportunities`)

### 1. List Vacancies
* **Endpoint:** `GET /opportunities`
* **Access:** Authenticated (Any role)
* **Success Response (200):** Array of all vacancies and corresponding company profiles.

### 2. Create Opportunity
* **Endpoint:** `POST /opportunities`
* **Access:** Company Recruiters or TPO Admins
* **Request Body:**
  ```json
  {
    "title": "Backend Engineering Intern",
    "description": "Develop APIs using Node.js.",
    "requirements": "Knowledge of Express and PostgreSQL.",
    "stipend": "₹25,000/month",
    "location": "Jodhpur (In-Office)"
  }
  ```
* **Success Response (201):** Opportunity object.

### 3. Edit Opportunity details
* **Endpoint:** `PUT /opportunities/:id`
* **Access:** Company Recruiters (Owner only) or TPO Admins
* **Request Body:** Fields to modify.
* **Success Response (200):** Updated opportunity object.

### 4. Delete Opportunity
* **Endpoint:** `DELETE /opportunities/:id`
* **Access:** Company Recruiters (Owner only) or TPO Admins
* **Success Response (200):** `{ "message": "Opportunity deleted successfully" }`

---

## 📄 Candidate Applications (`/applications`)

### 1. Apply to Opportunity
* **Endpoint:** `POST /applications`
* **Access:** Student only
* **Description:** Submits student resume for a specific listing. If no `resume_url` is provided in the body, falls back to the student's profile resume link.
* **Request Body:**
  ```json
  {
    "opportunity_id": "opp-uuid-12345",
    "cover_note": "I would love to join your team.",
    "resume_url": "https://drive.google.com/file/d/cv/view"
  }
  ```
* **Success Response (201):** Application data object.

### 2. List All Applications
* **Endpoint:** `GET /applications`
* **Access:** TPO Admins only
* **Success Response (200):** Array of all applications.

### 3. Update Application pipeline status
* **Endpoint:** `PUT /applications/:id/status`
* **Access:** TPO Admins or Company Recruiters (Owner only)
* **Description:** Advances status and writes corresponding entry to logs. Automatically triggers notification updates for the student.
* **Request Body:**
  ```json
  {
    "status": "interview",
    "remarks": "Strong test score. Code review interview scheduled.",
    "scheduled_date": "2026-07-20T10:00:00.000Z",
    "event_details": "Meet link: meet.google.com/abc-defg-hij"
  }
  ```
* **Success Response (200):**
  ```json
  {
    "message": "Status updated successfully",
    "application": {
      "id": "app-uuid",
      "status": "interview",
      "remarks": "Strong test score..."
    }
  }
  ```

---

## 🔔 Live Notification Logs (`/users/notifications`)

### 1. Fetch User Notifications
* **Endpoint:** `GET /users/notifications`
* **Access:** Authenticated (Any role)
* **Success Response (200):** Array of notifications.

### 2. Mark All Notifications Read
* **Endpoint:** `PUT /users/notifications/mark-read`
* **Access:** Authenticated (Any role)
* **Success Response (200):** `{ "message": "All notifications marked as read" }`

---

## 📊 Dashboard Summary Counters (`/dashboard`)

### 1. TPO Summary
* **Endpoint:** `GET /dashboard/tpo`
* **Access:** TPO Admins only
* **Success Response (200):**
  ```json
  {
    "total_opportunities": 12,
    "total_applications": 45,
    "total_placed": 18,
    "total_recruiters": 8
  }
  ```
