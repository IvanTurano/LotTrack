import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { LayoutDashboard, Receipt, Wallet, LogOut } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/ventas", label: "Sueldo", icon: Receipt },
  { href: "/gastos", label: "Gastos", icon: Wallet },
];

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#2e2e2e] sm:hidden"
      role="navigation"
      aria-label="Navegación móvil"
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                isActive
                  ? "text-[#3ecf8e]"
                  : "text-[#898989] hover:text-[#fafafa]"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 text-[#898989] hover:text-[#fafafa] transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Salir</span>
        </button>
      </div>
    </nav>
  );
}
