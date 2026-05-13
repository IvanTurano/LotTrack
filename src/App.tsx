import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import { AppLayout } from "@/components/app-layout";
import { ProtectedRoute } from "@/components/protected-route";

// Public routes — small pages, loaded statically
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import AuthConfirmedPage from "@/pages/auth-confirmed";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";

// Protected routes — heavy pages with charts, lazy-loaded for code splitting
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const VentasPage = lazy(() => import("@/pages/ventas"));
const GastosPage = lazy(() => import("@/pages/gastos"));
const ChangePasswordPage = lazy(() => import("@/pages/change-password"));

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

        {/* Protected routes — Suspense lives inside AppLayout around Outlet */}
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
