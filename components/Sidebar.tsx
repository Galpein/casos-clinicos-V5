"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRoleStore } from "@/stores/role.store";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; icon: string; roles: string[]; }

const NAV: NavItem[] = [
  { href: "/cases",       label: "Casos clínicos",   icon: "🗂️",  roles: ["profesional_sanitario"] },
  { href: "/create-case", label: "Crear caso",        icon: "✚",   roles: ["profesional_sanitario"] },
  { href: "/biblioteca",  label: "Biblioteca",        icon: "📚",  roles: ["profesional_sanitario"] },
  { href: "/analytics",   label: "Analytics",         icon: "📊",  roles: ["cliente"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAdmin, logout } = useRoleStore();

  const visibleNav = NAV.filter((item) => item.roles.includes(role));

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-lg shadow">
          🧬
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">AtlasCases</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Casos clínicos</p>
        </div>
      </div>

      {/* Role Switcher — solo visible para Admin */}
      {isAdmin && (
        <div className="border-b border-slate-100 py-3">
          <RoleSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Navegación
        </p>
        <ul className="space-y-0.5">
          {visibleNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <span className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors",
                    active ? "bg-white shadow-sm" : "bg-transparent"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: info + logout */}
      <div className="border-t border-slate-100 px-4 py-4 space-y-3">
        {isAdmin && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            <p className="text-[11px] font-semibold text-amber-700">Modo Admin activo</p>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-[11px] text-slate-400">Demo · v2.0</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
