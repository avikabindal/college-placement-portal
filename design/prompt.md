Design a multi-role College Internship & Placement Portal web application.
The app has 3 roles: Student, TPO (Admin), and Company.
Use a clean, modern UI with a blue and white color scheme.
Mobile-first, fully responsive design.
Use card-based layouts, sidebar navigation, and clear status badges.

Design the following screens:

1. LOGIN PAGE
- Single login page for all roles
- Email and password fields
- Role selector dropdown (Student / TPO / Company)
- "Login" button
- Clean centered card layout

2. STUDENT DASHBOARD
- Sidebar with: Dashboard, Browse Jobs, My Applications, Profile
- Stats cards: Total Applied, Under Review, Interviews, Selected
- Recent applications table with columns: Company, Role, Applied Date, Status (badge)
- Status badges: Applied (grey), Under Review (blue), Interview (yellow), Selected (green), Rejected (red)

3. STUDENT - BROWSE OPPORTUNITIES PAGE
- Search bar and filters (Branch, Job Type: Internship/Job, Location)
- Job cards in grid layout
- Each card: Company name, Role, Location, Stipend/Package, Deadline, "Apply Now" button

4. STUDENT - MY APPLICATIONS PAGE
- Table view of all applications
- Columns: Company, Role, Applied Date, Status
- Click to expand and see full status timeline/history

5. TPO DASHBOARD
- Sidebar with: Dashboard, Post Opportunity, Manage Opportunities, Applicants, Companies, Reports
- Stats cards: Total Opportunities, Total Applications, Students Selected, Companies Registered
- Recent activity table
- Quick action buttons: Post New Job, Add Company

6. TPO - POST OPPORTUNITY FORM
- Form fields: Company (dropdown), Role Title, Job Type (Internship/Full-time), 
  Location, Description, Eligibility (CGPA, Branch, Year), 
  Stipend/Package, Application Deadline
- Submit button

7. TPO - VIEW APPLICANTS PAGE
- Dropdown to select opportunity
- Filters: Branch, Year, CGPA, Status
- Applicants table: Name, Branch, Year, CGPA, Skills, Status, Actions (Update Status dropdown)

8. TPO - MANAGE COMPANIES PAGE
- Table of registered companies: Name, Location, Website, Contact
- "Add Company" button
- Add Company modal/form: Company Name, Location, Website, Contact Email, Set Login Email and Password fields (TPO creates company credentials manually)

9. COMPANY DASHBOARD
- Sidebar with: Dashboard, My Opportunities, Applicants
- Stats cards: Active Opportunities, Total Applicants, Shortlisted, Selected
- List of their posted opportunities (posted by TPO on their behalf)

10. COMPANY - APPLICANTS VIEW
- Select opportunity from dropdown
- Applicants table: Student Name, Branch, Year, CGPA, Resume Link, Current Status
- Action buttons: Shortlist, Select, Reject

General style guidelines:
- Primary color: #1D4ED8 (blue)
- Background: #F8FAFC (light grey-white)
- Font: Inter or Poppins
- Rounded corners on cards and buttons
- Subtle shadows on cards
- Clean sans-serif typography
- Status badges with color coding