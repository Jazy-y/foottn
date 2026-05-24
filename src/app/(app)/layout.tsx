"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { CommandMenuProvider } from "@/components/layout/CommandMenu";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <AuthGuard>
      <CommandMenuProvider>
        <div className="flex min-h-screen">
          {/* Desktop sidebar */}
          <Sidebar />
          {/* Mobile drawer */}
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar onMenuClick={() => setDrawerOpen(true)} />
            <main className="flex-1 overflow-y-auto scrollbar-thin">
              {children}
            </main>
          </div>
        </div>
      </CommandMenuProvider>
    </AuthGuard>
  );
}
