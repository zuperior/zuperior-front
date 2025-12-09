"use client";

import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-zuperior-darker">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
        <main className="flex-1 overflow-y-auto bg-zuperior-dark px-6 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}