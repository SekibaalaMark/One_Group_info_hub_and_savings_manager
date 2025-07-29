import {
  Route,
  Routes,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/authContext";
import ErrorBoundary from "./components/ErrorBoundary";

import CoverPage from "./StudentPages/CoverPage.jsx";

import Login from "./StudentPages/Login.jsx";
import RegisterForm from "./StudentPages/RegisterForm.jsx";
import ConfirmEmail from "./StudentPages/ConfirmEmail.jsx";

import ForgotPassword from "./features/authentication/ForgotPassword.jsx";

import Logout from "./components/Logout";
import DashboardTreasurer from "./pages/DashboardTreasurer.jsx";
import DashboardSportsManager from "./pages/DashboardSportsManager.jsx";

import { Container } from "@mui/material";
import "./App.css";

const ProtectedLayout = () => {
  // const { user } = useAuth();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = localStorage.getItem("userRole");
  const navigate = useNavigate();

  // Redirect based on role if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If already authenticated, redirect to respective dashboard
  if (isAuthenticated) {
    switch (userRole) {
      case "student":
        return <Navigate to="/Students" replace />;
      case "lecturer":
        return <Navigate to="/lecturers" replace />;
      case "academicregistrar":
        return <Navigate to="/AcademicRegistrar" replace />;
      case "treasurer":
        return <Navigate to="/dashboard-treasurer" replace />;
      case "sports_manager":
        return <Navigate to="/dashboard-sports-manager" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

const AppContent = () => {
  const location = useLocation();

  return (
    <Container
      maxWidth="lg"
      sx={{ mt: 4, mb: 4, padding: 3, borderRadius: 2, boxShadow: 3 }}
    >
      <Routes>
        <Route path="/" element={<CoverPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/dashboard-treasurer" element={<DashboardTreasurer />} />
        <Route path="/dashboard-sports-manager" element={<DashboardSportsManager />} />
      </Routes>
    </Container>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
export default App;
