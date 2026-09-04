import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "AtlasCases — Demo",
  description: "Biblioteca de casos clínicos redactados con IA y validados por el profesional",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
