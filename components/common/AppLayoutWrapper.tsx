"use client";

import { usePathname } from "next/navigation";
import SidebarNav from "./SidebarNav";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If we are on the landing page, don't show sidebar and don't apply margin
  if (pathname === "/") {
    return <>{children}</>;
  }

  // Otherwise, we are inside the app routes
  return (
    <div className="flex bg-slate-50 min-h-screen">
      <SidebarNav />
      {/* 64 width in tailwind is 16rem = 256px */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
