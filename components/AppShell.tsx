"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRoleStore } from "@/stores/role.store";
import { Sidebar } from "@/components/Sidebar";

const emptySubscribe = () => () => {};

export function AppShell({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useRoleStore((s) => s.isAuthenticated);
  const pathname = usePathname();
  const router = useRouter();

  // La sesión vive en localStorage (zustand persist): en el servidor no existe,
  // así que el primer render del cliente debe COINCIDIR con el del servidor para
  // no provocar un desajuste de hidratación (que con páginas cliente rompía con
  // "Rendered more hooks…"). `useSyncExternalStore` devuelve false en servidor y
  // en el primer render cliente, y true después: hidratación estable sin efectos.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (mounted && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [mounted, isAuthenticated, isLoginPage, router]);

  // Servidor + primer render cliente: neutro e idéntico → sin mismatch.
  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  // Login: pantalla completa, sin sidebar.
  if (isLoginPage) {
    return <>{children}</>;
  }

  // En tránsito hacia /login: evita mostrar contenido protegido.
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </>
  );
}
