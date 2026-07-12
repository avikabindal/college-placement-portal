import StudentProfile from "./pages/student/StudentProfile";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TPODashboard from "./pages/tpo/TPODashboard";
import ManageCompanies from "./pages/tpo/ManageCompanies";
import ManageOpportunities from "./pages/tpo/ManageOpportunities";
import ViewApplicants from "./pages/tpo/ViewApplicants";
import TPOProfile from "./pages/tpo/TPOProfile";
import StudentDashboard from "./pages/student/StudentDashboard";
import BrowseOpportunities from "./pages/student/BrowseOpportunities";
import OpportunityDetail from "./pages/student/OpportunityDetail";
import MyApplications from "./pages/student/MyApplications";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyApplicants from "./pages/company/CompanyApplicants";
import ManageCompanyOpportunities from "./pages/company/ManageCompanyOpportunities";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/ResetPassword";
import MainLayout from "./components/Layout";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === "tpo") return <Navigate to="/tpo/dashboard" replace />;
    if (user.role === "student") return <Navigate to="/student/dashboard" replace />;
    if (user.role === "company") return <Navigate to="/company/dashboard" replace />;
  }
  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            {/* TPO routes */}
            <Route path="/tpo/dashboard" element={<ProtectedRoute allowedRoles={["tpo"]}><TPODashboard /></ProtectedRoute>} />
            <Route path="/tpo/companies" element={<ProtectedRoute allowedRoles={["tpo"]}><ManageCompanies /></ProtectedRoute>} />
            <Route path="/tpo/opportunities" element={<ProtectedRoute allowedRoles={["tpo"]}><ManageOpportunities /></ProtectedRoute>} />
            <Route path="/tpo/applications" element={<ProtectedRoute allowedRoles={["tpo"]}><ViewApplicants /></ProtectedRoute>} />
            <Route path="/tpo/profile" element={<ProtectedRoute allowedRoles={["tpo"]}><TPOProfile /></ProtectedRoute>} />

            {/* Student routes */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/opportunities" element={<ProtectedRoute allowedRoles={["student"]}><BrowseOpportunities /></ProtectedRoute>} />
            <Route path="/student/opportunities/:id" element={<ProtectedRoute allowedRoles={["student"]}><OpportunityDetail /></ProtectedRoute>} />
            <Route path="/student/applications" element={<ProtectedRoute allowedRoles={["student"]}><MyApplications /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute allowedRoles={["student"]}><StudentProfile /></ProtectedRoute>} />

            {/* Company routes */}
            <Route path="/company/dashboard" element={<ProtectedRoute allowedRoles={["company"]}><CompanyDashboard /></ProtectedRoute>} />
            <Route path="/company/opportunities" element={<ProtectedRoute allowedRoles={["company"]}><ManageCompanyOpportunities /></ProtectedRoute>} />
            <Route path="/company/applicants" element={<ProtectedRoute allowedRoles={["company"]}><CompanyApplicants /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
};

export default App;