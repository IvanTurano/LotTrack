import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AuthConfirmedPage from "@/pages/auth-confirmed";
import DashboardPage from "@/pages/dashboard";
import VentasPage from "@/pages/ventas";
import GastosPage from "@/pages/gastos";
import ChangePasswordPage from "@/pages/change-password";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/confirmed" element={<AuthConfirmedPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              {() => <AppLayout />}
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/cambiar-contrasena" element={<ChangePasswordPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
