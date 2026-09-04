import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPct(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function severidadLabel(n: number) {
  if (n <= 3) return "Leve";
  if (n <= 6) return "Moderada";
  return "Grave";
}

export function severidadColor(n: number) {
  if (n <= 3) return "text-emerald-600 bg-emerald-50";
  if (n <= 6) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}
