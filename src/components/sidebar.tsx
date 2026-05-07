import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  LogOut,
  Lock,
} from "lucide-react";
import logoSvg from "/logolottrack.png";

const NAV_SECTIONS = [
  {
    label: "Inicio",
    links: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, disabled: false },
    ],
  },
  {
    label: "Sueldo",
    links: [
      { href: "/ventas", label: "Ventas", icon: Receipt, disabled: false },
    ],
  },
  {
    label: "Gastos",
    links: [
      { href: "/gastos", label: "Gastos", icon: Wallet, disabled: false },
    ],
  },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName, userEmail }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = userName || "Usuario";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="sticky top-0 h-screen w-60 shrink-0 bg-[#0f0f0f] border-r border-[#2e2e2e] flex-col hidden sm:flex"
      role="navigation"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-[#2e2e2e]">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logolottrack.png" alt="LotTrack" className="h-7 w-auto" />
          <span className="text-sm font-medium tracking-tight">
            <span className="text-[#3ecf8e]">Lot</span>
            <span className="text-[#fafafa]">Track</span>
          </span>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 flex flex-col gap-4 p-3 overflow-y-auto">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-medium uppercase tracking-widest text-[#4d4d4d]">
              {section.label}
            </span>
            {section.links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              const disabled = link.disabled;

              if (disabled) {
                return (
                  <div
                    key={link.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#363636] cursor-not-allowed"
                    aria-disabled="true"
                  >
                    <Icon size={18} strokeWidth={1.5} />
                    {link.label}
                    <span className="ml-auto text-[10px] text-[#363636] bg-[#1a1a1a] px-1.5 py-0.5 rounded">
                      Pronto
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-[#1a1a1a] text-[#3ecf8e]"
                      : "text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#1a1a1a]"
                  )}
                  style={{ fontWeight: isActive ? 500 : 400 }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User section - bottom */}
      <div className="border-t border-[#2e2e2e] p-3">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2e2e2e] flex items-center justify-center">
            <span className="text-xs text-[#3ecf8e] font-medium">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#fafafa] truncate">{displayName}</p>
            <p className="text-xs text-[#898989] truncate">
              {userEmail || ""}
            </p>
          </div>
        </div>

        {/* Change password link */}
        <Link
          to="/cambiar-contrasena"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-colors"
        >
          <Lock size={18} strokeWidth={1.5} />
          Cambiar contraseña
        </Link>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#b4b4b4] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
