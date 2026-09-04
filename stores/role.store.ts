"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "profesional_sanitario" | "cliente";

export const ROLES: { id: Role; label: string; icon: string; color: string; bg: string; description: string }[] = [
  {
    id: "profesional_sanitario",
    label: "Profesional Sanitario",
    icon: "🩺",
    color: "text-violet-700",
    bg: "bg-violet-600",
    description: "Elabora un caso clínico completo",
  },
  {
    id: "cliente",
    label: "Cliente",
    icon: "📊",
    color: "text-emerald-700",
    bg: "bg-emerald-600",
    description: "Analiza datos y patrones de prescripción",
  },
];

interface RoleState {
  role: Role;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setRole: (role: Role) => void;
  login: (role: Role, isAdmin: boolean) => void;
  logout: () => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: "profesional_sanitario",
      isAuthenticated: false,
      isAdmin: false,
      setRole: (role) => set({ role }),
      login: (role, isAdmin) => set({ role, isAdmin, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false, isAdmin: false, role: "profesional_sanitario" }),
    }),
    { name: "atlascases-role" }
  )
);
