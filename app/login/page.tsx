"use client";

import { useRouter } from "next/navigation";
import { useRoleStore, type Role } from "@/stores/role.store";

interface DemoProfile {
  label: string;
  sublabel: string;
  role: Role;
  isAdmin: boolean;
  redirectTo: string;
  accent: string;
  iconBg: string;
  icon: React.ReactNode;
}

function IconMedic() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconAdmin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    label: "Profesional Sanitario",
    sublabel: "Col. 12345 · Dermatología",
    role: "profesional_sanitario",
    isAdmin: false,
    redirectTo: "/cases",
    accent: "border-violet-200 hover:border-violet-400 hover:bg-violet-50",
    iconBg: "bg-violet-100 text-violet-600",
    icon: <IconMedic />,
  },
  {
    label: "Cliente Farma",
    sublabel: "Acceso Analytics · Solo lectura",
    role: "cliente",
    isAdmin: false,
    redirectTo: "/analytics",
    accent: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    iconBg: "bg-emerald-100 text-emerald-600",
    icon: <IconChart />,
  },
  {
    label: "Admin (Programador)",
    sublabel: "Acceso completo · Cambio de rol",
    role: "profesional_sanitario",
    isAdmin: true,
    redirectTo: "/cases",
    accent: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    iconBg: "bg-amber-100 text-amber-600",
    icon: <IconAdmin />,
  },
];

export default function LoginPage() {
  const { login } = useRoleStore();
  const router = useRouter();

  const handleDemoLogin = (profile: DemoProfile) => {
    login(profile.role, profile.isAdmin);
    router.replace(profile.redirectTo);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-2xl shadow-lg">
            🧬
          </div>
          <h1 className="text-xl font-bold text-slate-900">AtlasCases</h1>
          <p className="mt-1 text-sm text-slate-500">Plataforma de casos clínicos · Demo v2.0</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Decorative form fields */}
          <div className="mb-5 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Usuario / Correo
              </label>
              <input
                type="email"
                disabled
                placeholder="demo@atlascases.es"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Contraseña
              </label>
              <input
                type="password"
                disabled
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                Acceso rápido demo
              </span>
            </div>
          </div>

          {/* Demo login buttons */}
          <div className="space-y-2.5">
            {DEMO_PROFILES.map((profile) => (
              <button
                key={profile.label}
                onClick={() => handleDemoLogin(profile)}
                className={`group w-full rounded-xl border px-4 py-3 text-left transition-all duration-150 ${profile.accent}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${profile.iconBg}`}>
                    {profile.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{profile.label}</p>
                    <p className="text-[11px] text-slate-500">{profile.sublabel}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"
                    className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
                    aria-hidden>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Entorno de demostración · Sin datos reales
        </p>
      </div>
    </div>
  );
}
