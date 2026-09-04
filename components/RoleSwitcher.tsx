"use client";

import { useRoleStore, ROLES, type Role } from "@/stores/role.store";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ROLE_HOME: Record<Role, string> = {
  profesional_sanitario: "/cases",
  cliente: "/analytics",
};

export function RoleSwitcher() {
  const { role, setRole } = useRoleStore();
  const router = useRouter();

  const handleSelect = (r: Role) => {
    setRole(r);
    router.push(ROLE_HOME[r]);
  };

  return (
    <div className="px-3 pb-4">
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Vista actual
      </p>
      <div className="flex flex-col gap-1">
        {ROLES.map((r) => {
          const active = role === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSelect(r.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                active
                  ? "bg-slate-900 shadow-sm"
                  : "hover:bg-slate-100"
              )}
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition-all",
                active ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
              )}>
                {r.icon}
              </span>
              <div className="min-w-0">
                <p className={cn("text-xs font-semibold leading-tight", active ? "text-white" : "text-slate-700")}>
                  {r.label}
                </p>
                <p className={cn("truncate text-[10px] leading-tight", active ? "text-slate-400" : "text-slate-400")}>
                  {r.description}
                </p>
              </div>
              {active && (
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
